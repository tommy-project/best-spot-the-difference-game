// input.js — mouse and keyboard, translated into game actions.
// One job: turn raw events into calls on the game (markAt, hint, restart,
// nextRound, backToMenu, moveCursor). It knows nothing about scoring or
// scenes; it only knows where the pointer is and which key was pressed.
//
// Mouse: click either panel to mark a spot. Keyboard: arrow keys move a
// crosshair (visible on both panels), Enter/Space marks under it, H asks
// for a hint, R restarts the round, N advances after a clear, Esc goes back
// to the menu, M toggles sound, 1/2/3 pick a round from the menu.

export function attachInput({ panels, onMark, onHint, onRestart, onNext, onMenu, onToggleMute, onRoundPick, onCursorMove }) {
  const cursor = { x: 0.5, y: 0.5, visible: false };
  const STEP = 0.03;

  function panelPoint(event, panelEl) {
    const rect = panelEl.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      inside: event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom,
    };
  }

  for (const panelEl of panels) {
    panelEl.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const p = panelPoint(event, panelEl);
      if (!p.inside) return;
      cursor.x = p.x;
      cursor.y = p.y;
      cursor.visible = true;
      onCursorMove({ ...cursor });
      onMark(p.x, p.y, panelEl.dataset.side);
    });
    panelEl.addEventListener('pointermove', (event) => {
      const p = panelPoint(event, panelEl);
      if (!p.inside) return;
      cursor.x = p.x;
      cursor.y = p.y;
      cursor.visible = true;
      onCursorMove({ ...cursor });
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'
      && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    switch (event.key) {
      case 'ArrowLeft': cursor.x = Math.max(0.01, cursor.x - STEP); break;
      case 'ArrowRight': cursor.x = Math.min(0.99, cursor.x + STEP); break;
      case 'ArrowUp': cursor.y = Math.max(0.01, cursor.y - STEP); break;
      case 'ArrowDown': cursor.y = Math.min(0.99, cursor.y + STEP); break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onMark(cursor.x, cursor.y, 'left');
        return;
      case 'h': case 'H': onHint(); return;
      case 'r': case 'R': onRestart(); return;
      case 'n': case 'N': onNext(); return;
      case 'm': case 'M': onToggleMute(); return;
      case 'Escape': onMenu(); return;
      case '1': case '2': case '3': onRoundPick(Number(event.key) - 1); return;
      default: return;
    }
    cursor.visible = true;
    onCursorMove({ ...cursor });
  });

  return cursor;
}
