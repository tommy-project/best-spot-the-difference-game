// main.js — boot and wiring, nothing else.
// One job: build the game, the renderer and the input, connect every event
// to the renderer, then either stage a ?shot= screenshot preset or show the
// menu. All rules live in game.js, all pixels in render.js and scenes.js.

import { createGame, PHASES } from './game.js';
import { createRenderer } from './render.js';
import { attachInput } from './input.js';
import { applyShotPreset } from './shots.js';
import { setMuted, isMuted } from './audio.js';
import { ROUNDS } from './config.js';

const renderer = createRenderer();

const game = createGame({
  onState: (snapshot) => renderer.setState(snapshot),
  onTick: (timeLeftS) => renderer.onTick(timeLeftS),
  onRoundStart: (snapshot) => {
    renderer.paintScene(snapshot.scene);
    renderer.setState(snapshot);
  },
  onFound: (diff) => renderer.onFound(diff),
  onMiss: (x, y) => renderer.onMiss(x, y),
  onHint: (diff) => renderer.onHint(diff),
  onHintDenied: () => {
    const btn = document.getElementById('btn-hint');
    btn.classList.remove('denied');
    void btn.offsetWidth;
    btn.classList.add('denied');
  },
  onRoundClear: (detail) => {
    if (detail.phase === 'victory') renderer.onVictory(detail);
    else renderer.onRoundClear(detail);
    renderer.setState({ ...game.state, found: new Set(game.state.found) });
  },
});

attachInput({
  panels: [document.getElementById('panel-left'), document.getElementById('panel-right')],
  onMark: (x, y) => game.markAt(x, y),
  onHint: () => game.hint(),
  onRestart: () => game.restartRound(),
  onNext: () => game.nextRound(),
  onMenu: () => game.backToMenu(),
  onToggleMute: () => {
    setMuted(!isMuted());
    document.getElementById('btn-mute').textContent = isMuted() ? 'SOUND OFF' : 'SOUND ON';
  },
  onRoundPick: (index) => {
    if (game.state.phase === PHASES.MENU) game.startRound(index);
  },
  onCursorMove: (cursor) => renderer.setCursor(cursor),
});

function wireButton(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

wireButton('btn-hint', () => game.hint());
wireButton('btn-restart', () => game.restartRound());
wireButton('btn-menu', () => game.backToMenu());
wireButton('btn-next', () => game.nextRound());
wireButton('btn-retry', () => game.restartRound());
wireButton('btn-again', () => game.startRound(0));
wireButton('btn-victory-menu', () => game.backToMenu());
wireButton('btn-mute', () => {
  setMuted(!isMuted());
  document.getElementById('btn-mute').textContent = isMuted() ? 'SOUND OFF' : 'SOUND ON';
});

document.querySelectorAll('.round-card').forEach((card) => {
  card.addEventListener('click', () => {
    game.startRound(Number(card.dataset.round));
  });
});

// Best score on the menu, kept fresh whenever the menu shows.
const bestEl = document.getElementById('menu-best');
if (bestEl) {
  bestEl.textContent = `BEST ${game.state.best}`;
}

// Paint the first scene behind the menu so the menu never sits on blank panels.
renderer.paintScene(game.state.scene);

// Stage the screenshot preset when asked, else open on the menu.
const params = new URLSearchParams(window.location.search);
if (!applyShotPreset(game, params)) {
  game.backToMenu();
}

// The menu shows the three rounds; keep its cards in step with the config.
document.querySelectorAll('.round-card').forEach((card, i) => {
  const round = ROUNDS[i];
  if (!round) return;
  const meta = card.querySelector('.round-meta');
  if (meta) meta.textContent = `${round.tag} · ${round.timeLimitS}s`;
});
