// ─────────────────────────────────────────────
//  DMC color picker UI
// ─────────────────────────────────────────────
import { state } from './state.js';
import { DMC_COLORS } from './dmc-colors.js';
import { redraw } from './grid.js';
import { flashMsg, closeColorPopover } from './ui.js';

// Module-local: which DMC color is currently active
let activeDMC = DMC_COLORS.find(c => c.num === '304') || DMC_COLORS[0];

export function buildDMCGrid(filtered) {
  const grid = document.getElementById('dmc-grid');
  grid.innerHTML = '';
  const families = [];
  const seen = {};
  filtered.forEach(c => { if (!seen[c.family]) { seen[c.family] = true; families.push(c.family); } });
  families.forEach(fam => {
    const label = document.createElement('div');
    label.className = 'dmc-family-label';
    label.textContent = fam;
    grid.appendChild(label);
    filtered.filter(c => c.family === fam).forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'dmc-swatch' + (c === activeDMC ? ' sel' : '');
      sw.style.background = c.hex;
      sw.title = `DMC ${c.num} — ${c.n}`;
      sw.addEventListener('click', e => { e.stopPropagation(); pickDMC(c); });
      grid.appendChild(sw);
    });
  });
}

export function pickDMC(c) {
  activeDMC = c;
  state.activeColor = c.hex;
  document.getElementById('dmc-sel-swatch').style.background = c.hex;
  document.getElementById('dmc-sel-label').textContent = `DMC ${c.num} — ${c.n}`;
  document.getElementById('ind-color').style.background = c.hex;
  document.getElementById('ind-dmc-name').textContent = `DMC ${c.num}`;
  document.querySelectorAll('.dmc-swatch').forEach(s => s.classList.remove('sel'));
  document.querySelectorAll('.dmc-swatch').forEach(s => {
    if (s.title === `DMC ${c.num} — ${c.n}`) s.classList.add('sel');
  });
  if (state.selectedStitches.length) {
    state.selectedStitches.forEach(i => { state.stitches[i].color = c.hex; });
    redraw();
    flashMsg(`Recolored ${state.selectedStitches.length} stitch${state.selectedStitches.length > 1 ? 'es' : ''} → DMC ${c.num}`);
    closeColorPopover();
  } else {
    flashMsg(`DMC ${c.num} — ${c.n}`);
    closeColorPopover();
  }
}

export function dmcSearch(query) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? DMC_COLORS.filter(c => c.num.toLowerCase().includes(q) || c.n.toLowerCase().includes(q))
    : DMC_COLORS;
  buildDMCGrid(filtered);
}

// Legacy shim
export function selectColor(hex) {
  state.activeColor = hex;
  document.getElementById('ind-color').style.background = hex;
}

export function getActiveDMC() { return activeDMC; }
