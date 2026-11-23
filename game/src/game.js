// game.js — the state machine and the rules of the hunt.
// One job: own the round state (menu / playing / round-clear / victory /
// time-up), the score, the timer, the found set and the hints. It paints
// nothing and touches no DOM directly: it reports every change through the
// `events` callbacks the renderer wires up.

import { ROUNDS, POINTS_FIND, POINTS_COMBO_STEP, POINTS_HINT_COST, POINTS_WRONG_CLICK, WRONG_CLICK_TIME_PENALTY_S, HINTS_PER_ROUND, SCORE } from './config.js';
import { sceneById } from './scenes.js';
import * as audio from './audio.js';

export const PHASES = {
  MENU: 'menu',
  PLAYING: 'playing',
  ROUND_CLEAR: 'round-clear',
  TIME_UP: 'time-up',
  VICTORY: 'victory',
};

export function createGame(events) {
  const state = {
    phase: PHASES.MENU,
    roundIndex: 0,
    scene: sceneById(ROUNDS[0].sceneId),
    found: new Set(),
    wrongClicks: 0,
    streak: 0,
    score: 0,
    roundScore: 0,
    hintsLeft: HINTS_PER_ROUND,
    timeLeftS: ROUNDS[0].timeLimitS,
    timeLimitS: ROUNDS[0].timeLimitS,
    startedAt: 0,
    lastTickSecond: -1,
    best: Number(window.localStorage.getItem('nebulaspot-best') || 0),
  };

  let timerId = null;

  function emit() {
    events.onState({ ...state, found: new Set(state.found) });
  }

  function stopTimer() {
    if (timerId !== null) { window.clearInterval(timerId); timerId = null; }
  }

  function startTimer() {
    stopTimer();
    state.lastTickSecond = Math.ceil(state.timeLeftS);
    timerId = window.setInterval(() => {
      if (state.phase !== PHASES.PLAYING) return;
      state.timeLeftS = Math.max(0, state.timeLeftS - 0.1);
      const whole = Math.ceil(state.timeLeftS);
      if (whole !== state.lastTickSecond) {
        state.lastTickSecond = whole;
        if (whole <= 10 && whole > 0) audio.playTick();
        events.onTick(state.timeLeftS);
      }
      if (state.timeLeftS <= 0) {
        stopTimer();
        state.phase = PHASES.TIME_UP;
        audio.playWrong();
        emit();
      }
    }, 100);
  }

  function startRound(index) {
    const round = ROUNDS[index];
    state.roundIndex = index;
    state.scene = sceneById(round.sceneId);
    state.found = new Set();
    state.wrongClicks = 0;
    state.streak = 0;
    state.roundScore = 0;
    state.hintsLeft = HINTS_PER_ROUND;
    state.timeLimitS = round.timeLimitS;
    state.timeLeftS = round.timeLimitS;
    state.phase = PHASES.PLAYING;
    state.startedAt = Date.now();
    events.onRoundStart({ ...state, found: new Set(state.found) });
    startTimer();
    emit();
  }

  function finishRound() {
    stopTimer();
    const timeBonus = Math.round(state.timeLeftS) * 5;
    state.roundScore += timeBonus;
    state.score += timeBonus;
    const used = state.timeLimitS - state.timeLeftS;
    const fraction = used / state.timeLimitS;
    let stars = 1;
    if (fraction <= SCORE.starTimeFractions[0] && state.wrongClicks < SCORE.wrongClicksForStarLoss) stars = 3;
    else if (fraction <= SCORE.starTimeFractions[1] || state.wrongClicks < SCORE.wrongClicksForStarLoss) stars = 2;
    if (state.roundIndex === ROUNDS.length - 1) {
      state.phase = PHASES.VICTORY;
      if (state.score > state.best) {
        state.best = state.score;
        window.localStorage.setItem('nebulaspot-best', String(state.best));
      }
      audio.playVictory();
    } else {
      state.phase = PHASES.ROUND_CLEAR;
      audio.playRoundClear();
    }
    events.onRoundClear({ ...state, found: new Set(state.found), timeBonus, stars });
    emit();
  }

  function markAt(nx, ny) {
    if (state.phase !== PHASES.PLAYING) return null;
    // Nearest unfound difference within its marker radius (in panel px).
    let best = null;
    let bestDist = Infinity;
    for (const diff of state.scene.diffs) {
      if (state.found.has(diff.id)) continue;
      const dx = (nx - diff.x) * 600;
      const dy = (ny - diff.y) * 450;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) { bestDist = dist; best = diff; }
    }
    if (best && bestDist <= best.r + 14) {
      state.found.add(best.id);
      state.streak += 1;
      const gained = POINTS_FIND + (state.streak - 1) * POINTS_COMBO_STEP;
      state.score += gained;
      state.roundScore += gained;
      audio.playFind();
      events.onFound(best, gained, state.streak);
      if (state.found.size === state.scene.diffs.length) finishRound();
      else emit();
      return { hit: true, diff: best, gained };
    }
    state.wrongClicks += 1;
    state.streak = 0;
    state.score = Math.max(0, state.score - POINTS_WRONG_CLICK);
    state.roundScore = Math.max(0, state.roundScore - POINTS_WRONG_CLICK);
    state.timeLeftS = Math.max(0, state.timeLeftS - WRONG_CLICK_TIME_PENALTY_S);
    audio.playWrong();
    events.onMiss(nx, ny);
    emit();
    return { hit: false };
  }

  function hint() {
    if (state.phase !== PHASES.PLAYING) return null;
    if (state.hintsLeft <= 0) { events.onHintDenied(); return null; }
    const remaining = state.scene.diffs.filter((d) => !state.found.has(d.id));
    if (remaining.length === 0) return null;
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - POINTS_HINT_COST);
    state.roundScore = Math.max(0, state.roundScore - POINTS_HINT_COST);
    const target = remaining[Math.floor(Math.random() * remaining.length)];
    audio.playHint();
    events.onHint(target);
    emit();
    return target;
  }

  return {
    state,
    startRound,
    nextRound() {
      if (state.phase === PHASES.ROUND_CLEAR) startRound(state.roundIndex + 1);
    },
    backToMenu() {
      stopTimer();
      state.phase = PHASES.MENU;
      emit();
    },
    restartRound() {
      startRound(state.roundIndex);
    },
    markAt,
    hint,
  };
}
