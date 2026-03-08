// ─────────────────────────────────────────────
//  Tool selection & all canvas mouse events
// ─────────────────────────────────────────────
import { G, state, rowLineY } from './state.js';
import { plateCanvas, previewCanvas, pvc } from './canvases.js';
import {
  drawUpCable, drawDownCable, drawOutline, drawStem,
  drawDownWave, drawUpWave, drawTrellis,
} from './stitches.js';
import { redraw } from './grid.js';
import { flashMsg } from './ui.js';
import { pushUndo } from './history.js';
import {
  isPasteMode, getClipboard,
  exitPasteMode, pasteAt, drawPasteGhost, doClearSelection,
} from './clipboard.js';

// Module-local interaction state
let downWaveFirst  = null;
let waveClickTimer = null;
let marquee        = null;
let marqueeStart   = null;

const TOOL_NAMES = {
  'up-cable':   'Up Cable',
  'down-cable': 'Down Cable',
  'outline':    'Outline',
  'stem':       'Stem',
  'wave':       'Wave',
  'trellis':    'Trellis',
  'select':     'Select — drag to lasso, ⌘/Ctrl+click to toggle',
  'eraser':     'Eraser',
};

// ─────────────────────────────────────────────
//  Tool selection
// ─────────────────────────────────────────────
export function selectTool(tool) {
  if (isPasteMode()) exitPasteMode();
  if (state.activeTool === tool) {
    state.activeTool = null; downWaveFirst = null;
    pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  } else {
    state.activeTool = tool;
  }
  if (state.activeTool !== 'select') {
    state.selectedStitches = []; marquee = null; marqueeStart = null; redraw();
  }
  ['up-cable', 'down-cable', 'outline', 'stem', 'wave', 'trellis', 'select', 'eraser'].forEach(t => {
    const btn = document.getElementById('tool-' + t);
    if (btn) btn.classList.toggle('active', state.activeTool === t);
  });
  plateCanvas.classList.toggle('tool-active', state.activeTool !== null);
  document.getElementById('ind-tool').textContent = state.activeTool ? TOOL_NAMES[state.activeTool] : '—';
  flashMsg(state.activeTool ? ('Tool: ' + TOOL_NAMES[state.activeTool]) : 'Tool deselected');
}

// ─────────────────────────────────────────────
//  Coordinate helpers
// ─────────────────────────────────────────────
export function canvasCoords(e) {
  const rect = plateCanvas.getBoundingClientRect();
  return { cx: (e.clientX - rect.left) / G.scale, cy: (e.clientY - rect.top) / G.scale };
}

export function snapValley(cx) {
  const v = Math.round(cx / G.pleatW);
  return Math.max(0, Math.min(G.pleats - 2, v));
}

export function snapRow(cy) {
  const padY = G.rowH;
  const eighth = Math.round((cy - padY) / (G.rowH / 8));
  const maxEighth = ((G.rows + 2) - 1) * 8;
  return Math.max(0, Math.min(maxEighth, eighth)) / 8;
}

export function cableCentre(valley, row) {
  return { x: (valley + 1) * G.pleatW, y: rowLineY(row) };
}

export function nearestCable(cx, cy, types) {
  let best = null, bestDist = Infinity;
  state.stitches.forEach(s => {
    if (!types.includes(s.type)) return;
    const c = cableCentre(s.valley, s.row);
    const d = Math.hypot(cx - c.x, cy - c.y);
    if (d < bestDist) { bestDist = d; best = s; }
  });
  return bestDist < G.pleatW * 3 ? best : null;
}

// ─────────────────────────────────────────────
//  Mouse event handlers
// ─────────────────────────────────────────────
export function initMouseEvents() {

  // ── click ──
  plateCanvas.addEventListener('click', function(e) {
    if (isPasteMode()) {
      const { cx, cy } = canvasCoords(e);
      pasteAt(snapValley(cx), snapRow(cy));
      return;
    }

    if (!state.activeTool) return;
    const { cx, cy } = canvasCoords(e);
    const valley = snapValley(cx);
    const row    = snapRow(cy);

    if (state.activeTool === 'eraser') {
      const before = state.stitches.length;
      state.stitches = state.stitches.filter(s => {
        if (s.type === 'down-wave' || s.type === 'up-wave' || s.type === 'trellis') {
          const wx1 = (s.s1.valley + 1) * G.pleatW, wx2 = (s.s2.valley + 1) * G.pleatW;
          const wy1 = rowLineY(s.s1.row), wy2 = rowLineY(s.s2.row);
          const wmx = (wx1 + wx2) / 2, wmy = (wy1 + wy2) / 2;
          return !(Math.abs(cx - wmx) <= Math.abs(wx2 - wx1) / 2 + 8 &&
                   Math.abs(cy - wmy) <= Math.abs(wy2 - wy1) / 2 + 8);
        }
        const sx1 = s.valley * G.pleatW, sx2 = sx1 + 2 * G.pleatW, sy = rowLineY(s.row);
        const sw = sx2 - sx1, ah = Math.min(sw * 0.26, G.rowH * 0.36) * 2.05;
        if (cx < sx1 || cx > sx2) return true;
        if (s.type === 'up-cable')   return !(cy <= sy && cy >= sy - ah);
        if (s.type === 'down-cable') return !(cy >= sy && cy <= sy + ah);
        if (s.type === 'outline') {
          const w2 = sx2 - sx1, lineH = Math.min(w2 * 0.26, G.rowH * 0.36) * 2.0;
          const t2 = (cx - sx1) / w2, lineY = sy - t2 * lineH;
          return !(Math.abs(cy - lineY) <= 6);
        }
        if (s.type === 'stem') {
          const w2 = sx2 - sx1, lineH = Math.min(w2 * 0.26, G.rowH * 0.36) * 2.0;
          const t2 = (cx - sx1) / w2, lineY = sy + t2 * lineH;
          return !(Math.abs(cy - lineY) <= 6);
        }
        return true;
      });
      if (state.stitches.length < before) { pushUndo(); redraw(); }
      return;
    }

    if (state.activeTool === 'wave') {
      if (!downWaveFirst) {
        const hit = nearestCable(cx, cy, ['up-cable', 'down-cable']);
        if (!hit) { flashMsg('Click an Up Cable or Down Cable to start'); return; }
        downWaveFirst = hit;
        flashMsg('Single-click row = wave only  |  Double-click = wave + cable');
        pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const c = cableCentre(hit.valley, hit.row);
        pvc.beginPath(); pvc.arc(c.x, c.y, 4, 0, Math.PI * 2);
        pvc.fillStyle = state.activeColor; pvc.globalAlpha = 0.7; pvc.fill(); pvc.globalAlpha = 1;
      } else {
        if (waveClickTimer) { clearTimeout(waveClickTimer); waveClickTimer = null; }
        const savedFirst = downWaveFirst, savedRow = row;
        waveClickTimer = setTimeout(() => {
          waveClickTimer = null;
          const s2valley = savedFirst.valley + 2;
          pushUndo();
          if (savedFirst.type === 'up-cable') {
            state.stitches.push({ type: 'down-wave', s1: { valley: savedFirst.valley, row: savedFirst.row }, s2: { valley: s2valley, row: savedRow }, color: state.activeColor });
            flashMsg('Down Wave placed');
          } else {
            state.stitches.push({ type: 'up-wave', s1: { valley: savedFirst.valley, row: savedFirst.row }, s2: { valley: s2valley, row: savedRow }, color: state.activeColor });
            flashMsg('Up Wave placed');
          }
          downWaveFirst = null;
          pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          redraw();
        }, 250);
      }
      return;
    }

    if (state.activeTool === 'trellis') {
      if (!downWaveFirst) {
        const hit = nearestCable(cx, cy, ['up-cable', 'down-cable']);
        if (!hit) { flashMsg('Click any cable to start the trellis'); return; }
        downWaveFirst = hit;
        flashMsg('Single-click row = trellis only  |  Double-click = trellis + cable');
        pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const c = cableCentre(hit.valley, hit.row);
        pvc.beginPath(); pvc.arc(c.x, c.y, 4, 0, Math.PI * 2);
        pvc.fillStyle = state.activeColor; pvc.globalAlpha = 0.7; pvc.fill(); pvc.globalAlpha = 1;
      } else {
        if (waveClickTimer) { clearTimeout(waveClickTimer); waveClickTimer = null; }
        const savedFirst = downWaveFirst, savedRow = row;
        waveClickTimer = setTimeout(() => {
          waveClickTimer = null;
          const steps    = Math.max(1, parseInt(document.getElementById('inp-trellis-steps').value) || 2);
          const s2valley = savedFirst.valley + steps + 1;
          const s1 = { valley: savedFirst.valley, row: savedFirst.row };
          const s2 = { valley: s2valley, row: savedRow };
          pushUndo();
          state.stitches.push({ type: 'trellis', s1, s2, steps, color: state.activeColor });
          flashMsg('Trellis (' + steps + ' steps) placed');
          downWaveFirst = null;
          pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          redraw();
        }, 250);
      }
      return;
    }

    const duplicate = state.stitches.some(s => s.type === state.activeTool && s.valley === valley && s.row === row);
    if (duplicate) return;
    pushUndo();
    state.stitches.push({ type: state.activeTool, valley, row, color: state.activeColor });
    redraw();
  });

  // ── dblclick ──
  plateCanvas.addEventListener('dblclick', function(e) {
    if (!downWaveFirst) return;
    if (state.activeTool !== 'wave' && state.activeTool !== 'trellis') return;
    if (waveClickTimer) { clearTimeout(waveClickTimer); waveClickTimer = null; }
    const { cx, cy } = canvasCoords(e);
    const row = snapRow(cy);

    if (state.activeTool === 'wave') {
      const s2valley = downWaveFirst.valley + 2;
      pushUndo();
      if (downWaveFirst.type === 'up-cable') {
        state.stitches.push({ type: 'down-cable', valley: s2valley, row, color: state.activeColor });
        state.stitches.push({ type: 'down-wave', s1: { valley: downWaveFirst.valley, row: downWaveFirst.row }, s2: { valley: s2valley, row }, color: state.activeColor });
        flashMsg('Down Wave + cable placed');
      } else {
        state.stitches.push({ type: 'up-cable', valley: s2valley, row, color: state.activeColor });
        state.stitches.push({ type: 'up-wave', s1: { valley: downWaveFirst.valley, row: downWaveFirst.row }, s2: { valley: s2valley, row }, color: state.activeColor });
        flashMsg('Up Wave + cable placed');
      }
    }

    if (state.activeTool === 'trellis') {
      const steps    = Math.max(1, parseInt(document.getElementById('inp-trellis-steps').value) || 2);
      const s2valley = downWaveFirst.valley + steps + 1;
      const s1 = { valley: downWaveFirst.valley, row: downWaveFirst.row };
      const s2 = { valley: s2valley, row };
      pushUndo();
      if (downWaveFirst.type === 'up-cable') {
        state.stitches.push({ type: 'down-cable', valley: s2valley, row, color: state.activeColor });
      } else {
        state.stitches.push({ type: 'up-cable', valley: s2valley, row, color: state.activeColor });
      }
      state.stitches.push({ type: 'trellis', s1, s2, steps, color: state.activeColor });
      flashMsg('Trellis (' + steps + ' steps) + cable placed');
    }

    downWaveFirst = null;
    pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    redraw();
  });

  // ── mousemove ──
  plateCanvas.addEventListener('mousemove', function(e) {
    pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (isPasteMode() && getClipboard().length) {
      const { cx, cy } = canvasCoords(e);
      drawPasteGhost(snapValley(cx), snapRow(cy));
      return;
    }

    if (!state.activeTool || state.activeTool === 'eraser') return;

    const { cx, cy } = canvasCoords(e);

    if (state.activeTool === 'select') {
      if (marqueeStart) {
        const rx = Math.min(marqueeStart.cx, cx), ry = Math.min(marqueeStart.cy, cy);
        const rw = Math.abs(cx - marqueeStart.cx), rh = Math.abs(cy - marqueeStart.cy);
        pvc.save();
        pvc.strokeStyle = '#3377cc'; pvc.lineWidth = 1.2; pvc.setLineDash([5, 3]);
        pvc.strokeRect(rx, ry, rw, rh);
        pvc.fillStyle = 'rgba(51,119,204,0.08)'; pvc.fillRect(rx, ry, rw, rh);
        pvc.setLineDash([]); pvc.restore();
      }
      return;
    }

    const valley = snapValley(cx), row = snapRow(cy);
    const x1 = valley * G.pleatW, x2 = x1 + 2 * G.pleatW, y = rowLineY(row);

    if (state.activeTool === 'up-cable')   drawUpCable(pvc, x1, x2, y, state.activeColor, 0.45);
    if (state.activeTool === 'down-cable') drawDownCable(pvc, x1, x2, y, state.activeColor, 0.45);
    if (state.activeTool === 'outline')    drawOutline(pvc, x1, x2, y, state.activeColor, 0.45);
    if (state.activeTool === 'stem')       drawStem(pvc, x1, x2, y, state.activeColor, 0.45);

    if (state.activeTool === 'wave') {
      if (!downWaveFirst) {
        const hit = nearestCable(cx, cy, ['up-cable', 'down-cable']);
        if (hit) {
          const c = cableCentre(hit.valley, hit.row);
          pvc.beginPath(); pvc.arc(c.x, c.y, 5, 0, Math.PI * 2);
          pvc.strokeStyle = state.activeColor; pvc.lineWidth = 1.5; pvc.globalAlpha = 0.6; pvc.stroke(); pvc.globalAlpha = 1;
        }
      } else {
        const s2valley = downWaveFirst.valley + 2;
        const s1 = { valley: downWaveFirst.valley, row: downWaveFirst.row }, s2 = { valley: s2valley, row };
        const wx1 = s2valley * G.pleatW, wx2 = wx1 + 2 * G.pleatW, yy = rowLineY(row);
        if (downWaveFirst.type === 'up-cable') {
          drawDownCable(pvc, wx1, wx2, yy, state.activeColor, 0.35);
          drawDownWave(pvc, s1, s2, state.activeColor, 0.45);
        } else {
          drawUpCable(pvc, wx1, wx2, yy, state.activeColor, 0.35);
          drawUpWave(pvc, s1, s2, state.activeColor, 0.45);
        }
        const c1 = cableCentre(downWaveFirst.valley, downWaveFirst.row);
        pvc.beginPath(); pvc.arc(c1.x, c1.y, 4, 0, Math.PI * 2);
        pvc.fillStyle = state.activeColor; pvc.globalAlpha = 0.7; pvc.fill(); pvc.globalAlpha = 1;
      }
    }

    if (state.activeTool === 'trellis') {
      if (!downWaveFirst) {
        const hit = nearestCable(cx, cy, ['up-cable', 'down-cable']);
        if (hit) {
          const c = cableCentre(hit.valley, hit.row);
          pvc.beginPath(); pvc.arc(c.x, c.y, 5, 0, Math.PI * 2);
          pvc.strokeStyle = state.activeColor; pvc.lineWidth = 1.5; pvc.globalAlpha = 0.6; pvc.stroke(); pvc.globalAlpha = 1;
        }
      } else {
        const steps    = Math.max(1, parseInt(document.getElementById('inp-trellis-steps').value) || 2);
        const s2valley = downWaveFirst.valley + steps + 1;
        const s1 = { valley: downWaveFirst.valley, row: downWaveFirst.row }, s2 = { valley: s2valley, row };
        const wx1 = s2valley * G.pleatW, wx2 = wx1 + 2 * G.pleatW, yy = rowLineY(row);
        if (downWaveFirst.type === 'up-cable') {
          drawDownCable(pvc, wx1, wx2, yy, state.activeColor, 0.35);
        } else {
          drawUpCable(pvc, wx1, wx2, yy, state.activeColor, 0.35);
        }
        drawTrellis(pvc, s1, s2, steps, state.activeColor, 0.45);
        const c1 = cableCentre(downWaveFirst.valley, downWaveFirst.row);
        pvc.beginPath(); pvc.arc(c1.x, c1.y, 4, 0, Math.PI * 2);
        pvc.fillStyle = state.activeColor; pvc.globalAlpha = 0.7; pvc.fill(); pvc.globalAlpha = 1;
      }
    }
  });

  // ── mouseleave ──
  plateCanvas.addEventListener('mouseleave', function() {
    pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    if ((state.activeTool === 'wave' || state.activeTool === 'trellis') && downWaveFirst) {
      const c = cableCentre(downWaveFirst.valley, downWaveFirst.row);
      pvc.beginPath(); pvc.arc(c.x, c.y, 4, 0, Math.PI * 2);
      pvc.fillStyle = state.activeColor; pvc.globalAlpha = 0.7; pvc.fill(); pvc.globalAlpha = 1;
    }
  });

  // ── mousedown (marquee start) ──
  plateCanvas.addEventListener('mousedown', function(e) {
    if (state.activeTool !== 'select') return;
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const mod   = isMac ? e.metaKey : e.ctrlKey;
    if (mod) return;
    const { cx, cy } = canvasCoords(e);
    marqueeStart = { cx, cy }; marquee = null; state.selectedStitches = []; redraw();
  });

  // ── cmd/ctrl+click: toggle individual stitch ──
  plateCanvas.addEventListener('click', function(e) {
    if (state.activeTool !== 'select') return;
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const mod   = isMac ? e.metaKey : e.ctrlKey;
    if (!mod) return;

    const { cx, cy } = canvasCoords(e);
    const hitRadius  = G.pleatW * 2.5;

    let bestIdx  = -1;
    let bestDist = Infinity;
    state.stitches.forEach((s, i) => {
      let ax, ay;
      if (s.type === 'down-wave' || s.type === 'up-wave' || s.type === 'trellis') {
        ax = (s.s1.valley + 1) * G.pleatW; ay = rowLineY(s.s1.row);
      } else {
        ax = (s.valley + 1) * G.pleatW; ay = rowLineY(s.row);
      }
      const d = Math.hypot(cx - ax, cy - ay);
      if (d < hitRadius && d < bestDist) { bestDist = d; bestIdx = i; }
    });

    if (bestIdx === -1) return;

    const pos = state.selectedStitches.indexOf(bestIdx);
    if (pos !== -1) {
      state.selectedStitches.splice(pos, 1);
    } else {
      state.selectedStitches.push(bestIdx);
    }

    if (state.selectedStitches.length) {
      flashMsg(state.selectedStitches.length + ' stitch' + (state.selectedStitches.length > 1 ? 'es' : '') + ' selected');
    } else {
      flashMsg('Selection cleared');
    }
    redraw();
  }, true);

  // ── mouseup (marquee finish) ──
  plateCanvas.addEventListener('mouseup', function(e) {
    if (state.activeTool !== 'select' || !marqueeStart) return;
    const { cx, cy } = canvasCoords(e);
    const rx = Math.min(marqueeStart.cx, cx), ry = Math.min(marqueeStart.cy, cy);
    const rw = Math.abs(cx - marqueeStart.cx), rh = Math.abs(cy - marqueeStart.cy);
    state.selectedStitches = [];
    state.stitches.forEach((s, i) => {
      let ax, ay;
      if (s.type === 'down-wave' || s.type === 'up-wave' || s.type === 'trellis') {
        ax = (s.s1.valley + 1) * G.pleatW; ay = rowLineY(s.s1.row);
      } else {
        ax = (s.valley + 1) * G.pleatW; ay = rowLineY(s.row);
      }
      if (ax >= rx && ax <= rx + rw && ay >= ry && ay <= ry + rh) state.selectedStitches.push(i);
    });
    marquee = null; marqueeStart = null;
    pvc.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    if (state.selectedStitches.length) {
      flashMsg(state.selectedStitches.length + ' stitches selected — ⌘C to copy');
      redraw();
    } else {
      flashMsg('No stitches selected'); redraw();
    }
  });
}
