// ─────────────────────────────────────────────
//  UI utilities: menus, color popover, zoom,
//  status bar, and flash messages.
//  NOTE: This module intentionally does NOT
//  import from grid/tools/clipboard etc. to
//  avoid circular dependencies.  Functions that
//  need redraw() call it via the modules that
//  own it.
// ─────────────────────────────────────────────
import { G } from './state.js';

// ─────────────────────────────────────────────
//  Menu open / close
// ─────────────────────────────────────────────
export function toggleMenu(id) {
  const isOpen = document.getElementById(id).classList.contains('open');
  closeAllMenus();
  if (!isOpen) document.getElementById(id).classList.add('open');
}

export function closeAllMenus() {
  document.querySelectorAll('.menu-trigger.open').forEach(m => m.classList.remove('open'));
}

// ─────────────────────────────────────────────
//  Color popover
// ─────────────────────────────────────────────
export function toggleColorPopover() {
  const pop = document.getElementById('color-popover');
  const btn = document.getElementById('color-btn');
  const isOpen = pop.style.display !== 'none';
  closeAllMenus();
  if (isOpen) {
    pop.style.display = 'none';
    btn.classList.remove('active');
  } else {
    const rect = btn.getBoundingClientRect();
    pop.style.display = 'block';
    pop.style.top  = (rect.bottom + 4) + 'px';
    const pw = 320;
    const left = Math.min(rect.left, window.innerWidth - pw - 8);
    pop.style.left = left + 'px';
    btn.classList.add('active');
    document.getElementById('dmc-search').focus();
  }
}

export function closeColorPopover() {
  document.getElementById('color-popover').style.display = 'none';
  document.getElementById('color-btn').classList.remove('active');
}

// ─────────────────────────────────────────────
//  Zoom
// ─────────────────────────────────────────────
export function adjustZoom(delta) {
  G.scale = Math.max(0.25, Math.min(4.0, G.scale + delta));
  applyZoom();
}

export function resetZoom() {
  G.scale = 1.0;
  applyZoom();
}

export function applyZoom() {
  const paper = document.getElementById('plate-paper');
  paper.style.transform = `scale(${G.scale})`;
  paper.style.transformOrigin = 'top left';
  document.getElementById('zoom-label').textContent = Math.round(G.scale * 100) + '%';
}

// ─────────────────────────────────────────────
//  Status bar
// ─────────────────────────────────────────────
export function updateStatus() {
  document.getElementById('stat-pleats').textContent = 'Pleats: ' + G.pleats;
  document.getElementById('stat-rows').textContent   = 'Rows: '   + G.rows;
  document.getElementById('stat-pw').textContent     = 'Pleat width: ' + G.pleatW + ' px';
  document.getElementById('stat-rh').textContent     = 'Row height: '  + G.rowH   + ' px';
}

// ─────────────────────────────────────────────
//  Flash message
// ─────────────────────────────────────────────
let flashTimer = null;

export function flashMsg(msg) {
  const el = document.getElementById('stat-msg');
  el.textContent = msg;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { el.textContent = ''; flashTimer = null; }, 2500);
}

// ─────────────────────────────────────────────
//  Init: wire up global click-outside listeners
// ─────────────────────────────────────────────
export function initUI() {
  // Close menus / popover when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.menu-trigger')) closeAllMenus();
    if (!e.target.closest('#color-popover') && !e.target.closest('#color-btn')) closeColorPopover();
  });

  // Prevent dropdown clicks from bubbling to the document close handler
  document.querySelectorAll('.menu-dropdown').forEach(d => {
    d.addEventListener('click', e => e.stopPropagation());
  });
  document.getElementById('color-popover').addEventListener('click', e => e.stopPropagation());
}
