// shots.js — screenshot staging for the hand-in.
// One job: read ?shot= from the URL and drive the real game into the exact
// state a screenshot needs (menu, mid-hunt with markers, hint pulsing, or
// round-clear). Every state is produced by the game's own public actions —
// startRound, markAt, hint — never by painting over the canvas by hand, so
// each screenshot is a true render of the game.
//
//   ?shot=start            the menu with the three round cards
//   ?shot=play             round 2 mid-hunt, 5 of 9 found, 4 remain
//   ?shot=hint             round 1, 2 found, hint pulsing on an unfound one
//   ?shot=win              round 1 cleared, all 7 markers ringing

import { SHOT_PRESETS } from './config.js';

export function applyShotPreset(game, params) {
  const shot = params.get('shot');
  if (!shot || !SHOT_PRESETS[shot]) return false;
  const preset = SHOT_PRESETS[shot];
  if (shot === 'start') {
    game.backToMenu();
    return true;
  }
  game.startRound(preset.scene);
  // Set the staged clock BEFORE marking: the last mark can clear the round,
  // and the clear card's time bonus is computed from the clock at that moment.
  if (preset.timeLeftS !== undefined) {
    game.state.timeLeftS = preset.timeLeftS;
  }
  const diffs = game.state.scene.diffs;
  const count = Math.min(preset.found || 0, diffs.length);
  for (let i = 0; i < count; i++) {
    game.markAt(diffs[i].x, diffs[i].y);
  }
  if (shot === 'hint' && preset.hintAt !== undefined) {
    // Spend one real hint so the pulse, the cost and the counter all agree.
    game.hint();
  }
  return true;
}
