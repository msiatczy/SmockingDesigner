// ─────────────────────────────────────────────
//  main.js — application entry point
//
//  1. Imports every module
//  2. Initialises the app
//  3. Exposes functions to window so the HTML
//     onclick="..." attributes continue to work
// ─────────────────────────────────────────────

// ── Module imports ──────────────────────────
import { state }                           from './state.js';
import { DMC_COLORS }                      from './dmc-colors.js';
import { redraw }                          from './grid.js';
import { toggleCenterline, toggleHolding, buildGrid } from './grid.js';
import { doUndo, doRedo }                  from './history.js';
import { doCopy, startPaste, doSelectAll, doEraseSelected, doClearSelection, isPasteMode, exitPasteMode } from './clipboard.js';
import { selectTool }                      from './tools.js';
import { initMouseEvents }                 from './tools.js';
import { buildDMCGrid, pickDMC, dmcSearch, getActiveDMC } from './colors.js';
import {
  openSaveModal, closeSaveModal, commitSave,
  openLoadModal, closeLoadModal, loadDesign, deleteDesign,
  exportJSON, importJSON, handleImport, clearGrid,
} from './persist.js';
import { doPrint, doPNG }                  from './export-utils.js';
import {
  toggleMenu, closeAllMenus,
  toggleColorPopover, closeColorPopover,
  adjustZoom, resetZoom,
  updateStatus, flashMsg, initUI,
} from './ui.js';

// ─────────────────────────────────────────────
//  Keyboard shortcuts
// ─────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (isPasteMode()) { exitPasteMode(); flashMsg('Paste cancelled'); return; }
    if (state.selectedStitches.length) { doClearSelection(); flashMsg('Selection cleared'); return; }
    if (state.activeTool) { selectTool(state.activeTool); return; }
  }
  
  // Delete / Backspace works with or without a modifier
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); doEraseSelected(); return; }
  
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const mod   = isMac ? e.metaKey : e.ctrlKey;
  if (!mod) return;
  if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
  if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); doRedo(); }
  if (e.key === 'c') { e.preventDefault(); doCopy(); }
  if (e.key === 'v') { e.preventDefault(); if (!isPasteMode()) startPaste(); }
  if (e.key === 'x') { e.preventDefault(); doEraseSelected(); }
  if (e.key === 'a') { e.preventDefault(); doSelectAll(); }
  if (e.key === 's') { e.preventDefault(); exportJSON(); }
});

// ─────────────────────────────────────────────
//  Expose functions to window
//  (required for HTML onclick="..." attributes)
// ─────────────────────────────────────────────
Object.assign(window, {
  // Menus
  toggleMenu,
  closeAllMenus,
  toggleColorPopover,

  // File menu
  openSaveModal,
  closeSaveModal,
  commitSave,
  openLoadModal,
  closeLoadModal,
  loadDesign,
  deleteDesign,
  exportJSON,
  importJSON,
  handleImport,
  doPrint,
  doPNG,

  // Edit menu
  selectTool,
  doSelectAll,
  doCopy,
  startPaste,
  doEraseSelected,
  clearGrid,

  // Stitches menu (selectTool covers these)

  // Grid menu
  buildGrid,
  toggleCenterline,
  toggleHolding,

  // Toolbar
  doUndo,
  doRedo,

  // Color picker
  dmcSearch,

  // Zoom
  adjustZoom,
  resetZoom,
});

// ─────────────────────────────────────────────
//  Initialise
// ─────────────────────────────────────────────
initUI();
initMouseEvents();
buildDMCGrid(DMC_COLORS);
pickDMC(getActiveDMC());
redraw();
updateStatus();
