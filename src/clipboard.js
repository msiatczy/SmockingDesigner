// ─────────────────────────────────────────────
//  Copy / Paste / Selection operations
// ─────────────────────────────────────────────
import { G, state, totalRowLines, rowLineY } from './state.js';
import { plateCanvas, previewCanvas, pvc } from './canvases.js';
import {
  drawDownWave, drawUpWave, drawTrellis,
  drawUpCable, drawDownCable, drawOutline, drawStem,
} from './stitches.js';
import { redraw } from './grid.js';
import { flashMsg } from './ui.js';
import { pushUndo } from './history.js';

// Module-local clipboard state
let clipboard  = [];
let pasteMode  = false;

// ─────────────────────────────────────────────
//  Copy
// ─────────────────────────────────────────────
export function doCopy() {
  if (!state.selectedStitches.length) {
    flashMsg('Nothing selected — use Select tool first');
    return;
  }

  let minV = Infinity, minR = Infinity;
  state.selectedStitches.map(i => state.stitches[i]).forEach(s => {
    if (s.type === 'down-wave' || s.type === 'up-wave' || s.type === 'trellis') {
      minV = Math.min(minV, s.s1.valley, s.s2.valley);
      minR = Math.min(minR, s.s1.row,    s.s2.row);
    } else {
      minV = Math.min(minV, s.valley);
      minR = Math.min(minR, s.row);
    }
  });

  clipboard = state.selectedStitches.map(i => {
    const s = JSON.parse(JSON.stringify(state.stitches[i]));
    if (s.type === 'down-wave' || s.type === 'up-wave' || s.type === 'trellis') {
      s.s1.valley -= minV; s.s1.row -= minR;
      s.s2.valley -= minV; s.s2.row -= minR;
    } else {
      s.valley -= minV;
      s.row    -= minR;
    }
    return s;
  });

  flashMsg(clipboard.length + ' stitch' + (clipboard.length > 1 ? 'es' : '') + ' copied — click to place, or ⌘V');
  enterPasteMode();
}

// ─────────────────────────────────────────────
//  Paste
// ─────────────────────────────────────────────
export function startPaste() {
  if (!clipboard.length) { flashMsg('Nothing copied yet'); return; }
  enterPasteMode();
}

export function enterPasteMode() {
  pasteMode = true;
  plateCanvas.classList.add('paste-mode');
  plateCanvas.classList.remove('tool-active');
  flashMsg('Click on the grid to paste — Esc to cancel');
}

export function exitPasteMode() {
  pasteMode = false;
  plateCanvas.classList.remove('paste-mode');
  if (state.activeTool) plateCanvas.classList.add('tool-active');
  pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

export function isPasteMode() { return pasteMode; }
export function getClipboard() { return clipboard; }

export function pasteAt(anchorValley, anchorRow) {
  if (!clipboard.length) return;
  pushUndo();
  const placed = clipboard.map(s => {
    const n = JSON.parse(JSON.stringify(s));
    if (n.type === 'down-wave' || n.type === 'up-wave' || n.type === 'trellis') {
      n.s1.valley += anchorValley; n.s1.row += anchorRow;
      n.s2.valley += anchorValley; n.s2.row += anchorRow;
    } else {
      n.valley += anchorValley;
      n.row    += anchorRow;
    }
    return n;
  });
  const valid = placed.filter(s => {
    if (s.type === 'down-wave' || s.type === 'up-wave' || s.type === 'trellis') {
      return s.s1.valley >= 0 && s.s2.valley >= 0 &&
             s.s1.valley <= G.pleats - 2 && s.s2.valley <= G.pleats - 2 &&
             s.s1.row >= 0 && s.s2.row <= totalRowLines() - 1;
    }
    return s.valley >= 0 && s.valley <= G.pleats - 2 &&
           s.row >= 0 && s.row <= totalRowLines() - 1;
  });
  state.stitches.push(...valid);
  state.selectedStitches = Array.from({ length: valid.length }, (_, i) => state.stitches.length - valid.length + i);
  redraw();
  flashMsg(valid.length + ' stitch' + (valid.length > 1 ? 'es' : '') + ' pasted — click again to paste another copy');
}

// ─────────────────────────────────────────────
//  Selection
// ─────────────────────────────────────────────
export function doSelectAll() {
  state.selectedStitches = state.stitches.map((_, i) => i);
  redraw();
  flashMsg(state.selectedStitches.length + ' stitches selected');
}

export function doEraseSelected() {
  if (!state.selectedStitches.length) {
    flashMsg('Nothing selected — use Select first');
    return;
  }
  pushUndo();
  const toRemove = new Set(state.selectedStitches);
  state.stitches = state.stitches.filter((_, i) => !toRemove.has(i));
  const count = toRemove.size;
  state.selectedStitches = [];
  redraw();
  flashMsg(count + ' stitch' + (count > 1 ? 'es' : '') + ' erased');
}

export function doClearSelection() {
  state.selectedStitches = [];
  redraw();
}

// ─────────────────────────────────────────────
//  Paste ghost preview
// ─────────────────────────────────────────────
export function drawPasteGhost(anchorValley, anchorRow) {
  pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  clipboard.forEach(s => {
    const n = JSON.parse(JSON.stringify(s));
    if (n.type === 'down-wave' || n.type === 'up-wave' || n.type === 'trellis') {
      n.s1.valley += anchorValley; n.s1.row += anchorRow;
      n.s2.valley += anchorValley; n.s2.row += anchorRow;
    } else {
      n.valley += anchorValley;
      n.row    += anchorRow;
    }
    const alpha = 0.45;
    if (n.type === 'down-wave') { drawDownWave(pvc, n.s1, n.s2, n.color, alpha); return; }
    if (n.type === 'up-wave')   { drawUpWave(pvc, n.s1, n.s2, n.color, alpha); return; }
    if (n.type === 'trellis')   { drawTrellis(pvc, n.s1, n.s2, n.steps, n.color, alpha); return; }
    const x1 = n.valley * G.pleatW, x2 = x1 + 2 * G.pleatW, y = rowLineY(n.row);
    if (n.type === 'up-cable')   drawUpCable(pvc, x1, x2, y, n.color, alpha);
    if (n.type === 'down-cable') drawDownCable(pvc, x1, x2, y, n.color, alpha);
    if (n.type === 'outline')    drawOutline(pvc, x1, x2, y, n.color, alpha);
    if (n.type === 'stem')       drawStem(pvc, x1, x2, y, n.color, alpha);
  });
}
