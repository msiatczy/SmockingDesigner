// ─────────────────────────────────────────────
//  Undo / Redo
// ─────────────────────────────────────────────
import { state, MAX_UNDO } from './state.js';
import { redraw } from './grid.js';
import { flashMsg } from './ui.js';

export function pushUndo() {
  state.undoStack.push(JSON.stringify(state.stitches));
  if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
  state.redoStack.length = 0;
}

export function doUndo() {
  if (!state.undoStack.length) return;
  state.redoStack.push(JSON.stringify(state.stitches));
  state.stitches = JSON.parse(state.undoStack.pop());
  redraw(); flashMsg('Undo');
}

export function doRedo() {
  if (!state.redoStack.length) return;
  state.undoStack.push(JSON.stringify(state.stitches));
  state.stitches = JSON.parse(state.redoStack.pop());
  redraw(); flashMsg('Redo');
}
