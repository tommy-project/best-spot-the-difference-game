// config.js — tuning constants for NEBULA SPOT (spot the difference).
// One job: every number the game balances on lives here, so a difficulty
// tweak never touches the art or the state machine.

export const PANEL_W = 600;
export const PANEL_H = 450;

export const POINTS_FIND = 100;
export const POINTS_COMBO_STEP = 15;
export const POINTS_HINT_COST = 50;
export const POINTS_WRONG_CLICK = 10;
export const WRONG_CLICK_TIME_PENALTY_S = 3;
export const HINTS_PER_ROUND = 3;
export const HINT_PULSE_MS = 1600;
export const MARK_RING_MS = 900;

export const ROUNDS = [
  { sceneId: 'garden', name: 'Starlight Garden', tag: 'Warm-up hunt', timeLimitS: 180 },
  { sceneId: 'harbor', name: 'Moon Harbor', tag: 'Trickier tides', timeLimitS: 150 },
  { sceneId: 'observatory', name: 'Nebula Observatory', tag: 'Deep-space final', timeLimitS: 120 },
];

export const SCORE = {
  // Stars shown on the round-clear card: finish fast, find cleanly.
  starTimeFractions: [0.5, 0.25],
  wrongClicksForStarLoss: 3,
};

export const SHOT_PRESETS = {
  // ?shot= values used only to stage the four hand-in screenshots.
  start: { scene: 0 },
  play: { scene: 1, found: 5, timeLeftS: 96 },
  hint: { scene: 0, found: 2, timeLeftS: 141, hintAt: 0 },
  win: { scene: 0, found: 7, timeLeftS: 63 },
};
