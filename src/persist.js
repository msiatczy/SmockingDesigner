// ----------------------------------------------------
//  Save / Load (localStorage + JSON file)
// ----------------------------------------------------
import { G, state, clamp } from './state.js';
import { redraw } from './grid.js';
import { flashMsg, updateStatus } from './ui.js';

// ----------------------------------------------------
//  Serialize / Deserialize
// ----------------------------------------------------
export function serialize() {
  return {
    pleats: G.pleats, rows: G.rows, pleatW: G.pleatW, rowH: G.rowH,
    title:  document.getElementById('plate-title').value,
    stitches: JSON.parse(JSON.stringify(state.stitches)),
  };
}

export function deserialize(data) {
  G.pleats = data.pleats || 100; G.rows = data.rows || 10;
  G.pleatW = data.pleatW || 8;   G.rowH = data.rowH || 40;
  state.stitches = data.stitches ? JSON.parse(JSON.stringify(data.stitches)) : [];
  document.getElementById('inp-pleats').value  = G.pleats;
  document.getElementById('inp-rows').value    = G.rows;
  document.getElementById('inp-pw').value      = G.pleatW;
  document.getElementById('inp-rh').value      = G.rowH;
  document.getElementById('plate-title').value = data.title || '';
  redraw(); updateStatus();
}

// ----------------------------------------------------
//  Browser cache (localStorage) - kept for module compatibility
// ----------------------------------------------------
function getSaves() {
  try { return JSON.parse(localStorage.getItem('smocking_saves') || '{}'); } catch (e) { return {}; }
}
function setSaves(obj) {
  localStorage.setItem('smocking_saves', JSON.stringify(obj));
}

export function openSaveModal() {}
export function closeSaveModal() {}
export function commitSave() {}

export function openLoadModal() {}
export function closeLoadModal() {}
export function loadDesign(name) {}
export function deleteDesign(name) {
  const saves = getSaves(); delete saves[name]; setSaves(saves);
}

// ----------------------------------------------------
//  JSON file export / import
// ----------------------------------------------------
export async function exportJSON() {
  const title = document.getElementById('plate-title').value || 'smocking-plate';
  const blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' });
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: title + '.json',
        types: [{ description: 'JSON Design File', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      flashMsg('JSON saved');
    } catch (e) {
      if (e.name !== 'AbortError') flashMsg('Save failed');
    }
  } else {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = title + '.json'; a.click();
    URL.revokeObjectURL(url); flashMsg('JSON saved');
  }
}

export function importJSON() {
  document.getElementById('imp-input').click();
}

export function handleImport(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try { deserialize(JSON.parse(ev.target.result)); flashMsg('Imported: ' + file.name); }
    catch (err) { flashMsg('Error: invalid JSON file'); }
  };
  reader.readAsText(file); e.target.value = '';
}

// ----------------------------------------------------
//  Clear / Reset
// ----------------------------------------------------
export function clearGrid() {
  if (!confirm('Reset the grid to defaults and clear all stitches?')) return;
  G.pleats = 100; G.rows = 10; G.pleatW = 8; G.rowH = 40;
  state.stitches = []; state.undoStack.length = 0; state.redoStack.length = 0;
  document.getElementById('inp-pleats').value  = G.pleats;
  document.getElementById('inp-rows').value    = G.rows;
  document.getElementById('inp-pw').value      = G.pleatW;
  document.getElementById('inp-rh').value      = G.rowH;
  document.getElementById('plate-title').value = '';
  redraw(); updateStatus(); flashMsg('Reset to defaults');
}