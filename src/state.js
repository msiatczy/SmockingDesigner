// ─────────────────────────────────────────────
//  Shared grid parameters
// ─────────────────────────────────────────────
export const G = {
  pleats: 100,
  rows:   10,
  pleatW: 8,
  rowH:   40,
  scale:  1.0,
};

// ─────────────────────────────────────────────
//  Shared application state
//  All modules import this object and mutate
//  its properties directly.
// ─────────────────────────────────────────────
export const state = {
  stitches:         [],
  activeTool:       null,
  activeColor:      '#8b2020',
  showCenterline:   false,
  showTopHolding:   true,
  showBotHolding:   true,
  undoStack:        [],
  redoStack:        [],
  selectedStitches: [],
};

export const MAX_UNDO = 80;

// ─────────────────────────────────────────────
//  Grid helper functions
// ─────────────────────────────────────────────
export const totalRowLines = () => G.rows + 2;
export const padY          = () => G.rowH;
export const rowLineY      = r  => r * G.rowH + padY();
export const canvasW       = () => G.pleats * G.pleatW;
export const canvasH       = () => (totalRowLines() - 1) * G.rowH + padY() * 2;

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
