// ─────────────────────────────────────────────
//  Save / Load (localStorage + JSON file)
// ─────────────────────────────────────────────
import { G, state, clamp } from './state.js';
import { redraw } from './grid.js';
import { flashMsg, updateStatus } from './ui.js';

// ─────────────────────────────────────────────
//  Serialize / Deserialize
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  Browser cache (localStorage)
// ─────────────────────────────────────────────
function getSaves() {
  try { return JSON.parse(localStorage.getItem('smocking_saves') || '{}'); } catch { return {}; }
}
function setSaves(obj) {
  localStorage.setItem('smocking_saves', JSON.stringify(obj));
}

export function openSaveModal() {
  document.getElementById('save-name').value = document.getElementById('plate-title').value || 'My Design';
  document.getElementById('save-modal').classList.add('open');
}
export function closeSaveModal() {
  document.getElementById('save-modal').classList.remove('open');
}
export function commitSave() {
  const name  = document.getElementById('save-name').value.trim() || 'Untitled';
  const saves = getSaves();
  saves[name] = { name, date: new Date().toLocaleString(), data: serialize() };
  setSaves(saves); closeSaveModal(); flashMsg('Saved: ' + name);
}

export function openLoadModal() {
  const saves = getSaves(), keys = Object.keys(saves);
  const list = document.getElementById('saves-list');
  list.innerHTML = !keys.length
    ? '<div style="padding:12px;font-size:.78rem;color:#9a8a7a;text-align:center">No saved designs yet.</div>'
    : keys.map(k => {
        const s = saves[k], safe = k.replace(/'/g, "\\'");
        return `<div class="save-item">
          <div><div class="save-item-name">${k}</div><div class="save-item-date">${s.date || ''}</div></div>
          <div class="save-item-btns">
            <button class="lb" onclick="loadDesign('${safe}')">Load</button>
            <button class="db" onclick="deleteDesign('${safe}')">Del</button>
          </div>
        </div>`;
      }).join('');
  document.getElementById('load-modal').classList.add('open');
}
export function closeLoadModal() {
  document.getElementById('load-modal').classList.remove('open');
}
export function loadDesign(name) {
  const saves = getSaves();
  if (!saves[name]) return;
  deserialize(saves[name].data); closeLoadModal(); flashMsg('Loaded: ' + name);
}
export function deleteDesign(name) {
  const saves = getSaves(); delete saves[name]; setSaves(saves); openLoadModal();
}

// ─────────────────────────────────────────────
//  JSON file export / import
// ─────────────────────────────────────────────
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
      const savedName = handle.name.replace(/\.json$/i, '');
      document.getElementById('plate-title').value = savedName;
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
    catch { flashMsg('Error: invalid JSON file'); }
  };
  reader.readAsText(file); e.target.value = '';
}

// ─────────────────────────────────────────────
//  Clear / Reset
// ─────────────────────────────────────────────
export function clearGrid() {
  if (!confirm('Reset the grid to defaults and clear all stitches?')) return;
  G.pleats = 100; G.rows = 10; G.pleatW = 8; G.rowH = 40;
  state.stitches = []; state.undoStack.length = 0; state.redoStack.length = 0;
  document.getElementById('inp-pleats').value  = G.pleats;
  document.getElementById('inp-rows').value    = G.rows;
  document.getElementById('inp-pw').value      = G.pleatW;
  document.getElementById('inp-rh').value      = G.rowH;
  document.getElementById('plate-title').value = '';
