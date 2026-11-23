// audio.js — every sound in the game, synthesised live with WebAudio.
// One job: short, satisfying blips with no audio files and no network.
// The context is created lazily on the first user gesture (browsers block
// audio before interaction), and every effect is a tiny oscillator envelope.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freqStart, freqEnd, durationS, type, gainValue, delayS = 0) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delayS;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + durationS);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationS);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durationS + 0.02);
}

export function playFind() {
  // Two-note chime: the satisfying "you got one" mark.
  blip(740, 740, 0.09, 'sine', 0.22);
  blip(1108, 1108, 0.16, 'sine', 0.20, 0.07);
}

export function playWrong() {
  blip(190, 120, 0.16, 'square', 0.10);
}

export function playHint() {
  blip(520, 880, 0.22, 'sine', 0.14);
}

export function playRoundClear() {
  // Little ascending arpeggio for the round-clear card.
  [523, 659, 784, 1047].forEach((f, i) => blip(f, f, 0.18, 'triangle', 0.18, i * 0.09));
}

export function playVictory() {
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => blip(f, f, 0.22, 'triangle', 0.16, i * 0.11));
}

export function playTick() {
  blip(980, 980, 0.05, 'sine', 0.08);
}
