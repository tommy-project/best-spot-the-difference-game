// render.js — everything the player sees, and nothing else.
// One job: paint the two panels, draw the markers and the crosshair, keep
// the HUD (counter, timer, score, hints) honest, and show the menu /
// round-clear / victory / time-up cards. It never changes the score or the
// rules; it only mirrors the state game.js hands it.

import { PANEL_W, PANEL_H, HINT_PULSE_MS, MARK_RING_MS } from './config.js';

function $(id) {
  return document.getElementById(id);
}

export function createRenderer() {
  const leftBase = $('panel-left');
  const rightBase = $('panel-right');
  const leftMark = $('mark-left');
  const rightMark = $('mark-right');
  const cursorEl = $('cursor');
  const els = {
    roundName: $('round-name'), counter: $('counter'), timerFill: $('timer-fill'),
    timerText: $('timer-text'), score: $('score'), hints: $('hints'), best: $('best'),
    stage: $('stage'), menu: $('menu'), roundClear: $('round-clear'),
    victory: $('victory'), timeUp: $('time-up'),
    clearTitle: $('clear-title'), clearStars: $('clear-stars'),
    clearDetail: $('clear-detail'), victoryScore: $('victory-score'),
    victoryBest: $('victory-best'), timeUpDetail: $('timeup-detail'),
  };

  let scene = null;
  let foundAt = new Map();
  let hintTarget = null;
  let hintStartedAt = 0;
  let missFlash = null;
  let cursor = { x: 0.5, y: 0.5, visible: false };
  let snapshot = null;

  for (const c of [leftBase, rightBase, leftMark, rightMark]) {
    c.width = PANEL_W;
    c.height = PANEL_H;
  }

  function paintScene(nextScene) {
    scene = nextScene;
    foundAt = new Map();
    hintTarget = null;
    missFlash = null;
    const lctx = leftBase.getContext('2d');
    const rctx = rightBase.getContext('2d');
    scene.paint(lctx, PANEL_W, PANEL_H, new Set());
    scene.paint(rctx, PANEL_W, PANEL_H, new Set(scene.diffs.map((d) => d.id)));
    drawMarkers();
  }

  function ring(ctx, x, y, r, color, width, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function check(ctx, x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = 'rgba(8,8,28,0.65)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y);
    ctx.lineTo(x - s * 0.12, y + s * 0.42);
    ctx.lineTo(x + s * 0.6, y - s * 0.42);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y);
    ctx.lineTo(x - s * 0.12, y + s * 0.42);
    ctx.lineTo(x + s * 0.6, y - s * 0.42);
    ctx.stroke();
    ctx.restore();
  }

  function drawMarkers(now = performance.now()) {
    for (const canvas of [leftMark, rightMark]) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, PANEL_W, PANEL_H);
      if (!scene) continue;
      for (const diff of scene.diffs) {
        if (!snapshot || !snapshot.found.has(diff.id)) continue;
        const age = now - (foundAt.get(diff.id) || now);
        const pop = age < MARK_RING_MS ? 0.6 + 0.4 * (age / MARK_RING_MS) : 1;
        const x = diff.x * PANEL_W;
        const y = diff.y * PANEL_H;
        // Dark under-ring first: the gold ring must read even on the bright moon.
        ring(ctx, x, y, diff.r * pop + 3, 'rgba(8,8,28,0.65)', 8, 0.95);
        ring(ctx, x, y, diff.r * pop + 3, '#ffd76a', 4, 0.95);
        ring(ctx, x, y, diff.r * pop + 8, 'rgba(255,215,106,0.45)', 2, 0.8);
        check(ctx, x, y, 13, '#ffe9a8');
      }
      if (hintTarget) {
        const age = now - hintStartedAt;
        if (age < HINT_PULSE_MS) {
          const phase = (age % 500) / 500;
          const x = hintTarget.x * PANEL_W;
          const y = hintTarget.y * PANEL_H;
          ring(ctx, x, y, hintTarget.r + phase * 16, '#7fe7ff', 3, 1 - phase);
          ring(ctx, x, y, hintTarget.r, 'rgba(127,231,255,0.9)', 3, 0.9);
        }
      }
      if (missFlash && now - missFlash.at < 450) {
        const age = now - missFlash.at;
        const x = missFlash.x * PANEL_W;
        const y = missFlash.y * PANEL_H;
        ctx.save();
        ctx.globalAlpha = 1 - age / 450;
        ctx.strokeStyle = '#ff5d73';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9);
        ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9);
        ctx.stroke();
        ctx.restore();
      }
    }
    positionCursor();
  }

  function positionCursor() {
    if (!cursor.visible || !snapshot || snapshot.phase !== 'playing') {
      cursorEl.style.display = 'none';
      return;
    }
    cursorEl.style.display = 'block';
    // The cursor lives in the left panel wrap, below the 26px panel tag.
    cursorEl.style.left = `${cursor.x * 100}%`;
    cursorEl.style.top = `calc(26px + ${cursor.y} * (100% - 26px))`;
  }

  function fmtTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function setState(next) {
    snapshot = next;
    const total = scene ? scene.diffs.length : 0;
    const found = next.found.size;
    els.counter.textContent = `FOUND ${found} / ${total}  ·  ${total - found} REMAIN`;
    els.roundName.textContent = next.scene ? next.scene.name.toUpperCase() : '';
    els.score.textContent = String(next.score);
    els.best.textContent = `BEST ${next.best}`;
    els.hints.textContent = `✦ ${next.hintsLeft}`;
    els.timerText.textContent = fmtTime(next.timeLeftS);
    const frac = next.timeLimitS ? next.timeLeftS / next.timeLimitS : 0;
    els.timerFill.style.width = `${Math.max(0, frac * 100).toFixed(1)}%`;
    els.timerFill.classList.toggle('low', frac < 0.25);
    els.stage.classList.toggle('shake', false);
    const show = (el, on) => el.classList.toggle('hidden', !on);
    show(els.menu, next.phase === 'menu');
    show(els.roundClear, next.phase === 'round-clear');
    show(els.victory, next.phase === 'victory');
    show(els.timeUp, next.phase === 'time-up');
    drawMarkers();
  }

  function onTick(timeLeftS) {
    if (!snapshot) return;
    els.timerText.textContent = fmtTime(timeLeftS);
    const frac = snapshot.timeLimitS ? timeLeftS / snapshot.timeLimitS : 0;
    els.timerFill.style.width = `${Math.max(0, frac * 100).toFixed(1)}%`;
    els.timerFill.classList.toggle('low', frac < 0.25);
  }

  function onFound(diff) {
    foundAt.set(diff.id, performance.now());
    drawMarkers();
  }

  function onMiss(nx, ny) {
    missFlash = { x: nx, y: ny, at: performance.now() };
    els.stage.classList.remove('shake');
    void els.stage.offsetWidth;
    els.stage.classList.add('shake');
    drawMarkers();
  }

  function onHint(diff) {
    hintTarget = diff;
    hintStartedAt = performance.now();
    drawMarkers();
  }

  function onRoundClear(detail) {
    els.clearTitle.textContent = detail.roundIndex === 2 ? 'FINAL ROUND CLEAR!' : 'ROUND CLEAR!';
    els.clearStars.textContent = '★'.repeat(detail.stars) + '☆'.repeat(3 - detail.stars);
    els.clearDetail.textContent = `${detail.scene.diffs.length} differences found · time bonus +${detail.timeBonus} · round score ${detail.roundScore}`;
  }

  function onVictory(detail) {
    els.victoryScore.textContent = String(detail.score);
    els.victoryBest.textContent = `BEST ${detail.best}`;
  }

  function onTimeUp(detail) {
    els.timeUpDetail.textContent = `${detail.found.size} of ${detail.scene.diffs.length} differences found — so close. Try again!`;
  }

  function setCursor(next) {
    cursor = next;
    positionCursor();
  }

  // Marker pulse + hint pulse keep animating while anything is alive.
  (function loop() {
    if (scene && snapshot && (hintTarget || missFlash || foundAt.size > 0)) drawMarkers();
    window.requestAnimationFrame(loop);
  })();

  return {
    paintScene, setState, onTick, onFound, onMiss, onHint,
    onRoundClear, onVictory, onTimeUp, setCursor,
  };
}
