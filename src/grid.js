// ─────────────────────────────────────────────
//  Grid rendering, full redraw, and grid controls
// ─────────────────────────────────────────────
import { G, state, totalRowLines, padY, rowLineY, canvasW, canvasH, clamp } from './state.js';
import { plateCanvas, labelCanvas, previewCanvas, pc, lc } from './canvases.js';
import {
  drawUpCable, drawDownCable, drawOutline, drawStem,
  drawDownWave, drawUpWave, drawTrellis,
} from './stitches.js';
import { flashMsg, updateStatus } from './ui.js';

// ─────────────────────────────────────────────
//  Grid rendering
// ─────────────────────────────────────────────
export function renderGrid() {
  const W = canvasW(), H = canvasH();
  plateCanvas.width = W; plateCanvas.height = H;
  const labelW = 52;
  labelCanvas.width = labelW; labelCanvas.height = H;
  labelCanvas.style.width  = labelW + 'px';
  labelCanvas.style.height = H + 'px';
  labelCanvas.style.left   = (56 - labelW) + 'px';
  previewCanvas.width  = W; previewCanvas.height = H;
  previewCanvas.style.width  = W + 'px';
  previewCanvas.style.height = H + 'px';
  pc.fillStyle = '#ffffff'; pc.fillRect(0, 0, W, H);

  pc.strokeStyle = '#a09080'; pc.lineWidth = 0.8;
  const gridTop = rowLineY(0), gridBottom = rowLineY(totalRowLines() - 1);
  for (let v = 0; v <= G.pleats; v++) {
    const x = v * G.pleatW;
    pc.beginPath(); pc.moveTo(x, gridTop); pc.lineTo(x, gridBottom); pc.stroke();
  }

  for (let r = 0; r < totalRowLines(); r++) {
    const y = rowLineY(r);
    const isTop = (r === 0), isBot = (r === totalRowLines() - 1);
    const holding = isTop || isBot;
    if (isTop && !state.showTopHolding) continue;
    if (isBot && !state.showBotHolding) continue;
    pc.strokeStyle = '#993333'; pc.lineWidth = holding ? 0.9 : 1.1;
    pc.beginPath(); pc.moveTo(0, y); pc.lineTo(W, y); pc.stroke();
  }

  pc.strokeStyle = '#c8b8a8'; pc.lineWidth = 0.5; pc.setLineDash([3, 4]);
  for (let r = 0; r < totalRowLines() - 1; r++) {
    const y = rowLineY(r) + G.rowH / 2;
    pc.beginPath(); pc.moveTo(0, y); pc.lineTo(W, y); pc.stroke();
  }
  pc.setLineDash([]);

  if (state.showCenterline) renderCenterline(W, H);
  renderLabels(labelW, H);
}

export function renderCenterline(W, H) {
  const midPleat = G.pleats / 2, cx = midPleat * G.pleatW;
  const yTop = rowLineY(0), yBottom = rowLineY(totalRowLines() - 1);
  const arrowH = 10, arrowW = 6;
  pc.save();
  pc.strokeStyle = '#000000'; pc.lineWidth = 1.5; pc.setLineDash([]);
  pc.beginPath(); pc.moveTo(cx, yTop); pc.lineTo(cx, yBottom); pc.stroke();
  pc.fillStyle = '#000000';
  pc.beginPath(); pc.moveTo(cx, yTop); pc.lineTo(cx - arrowW, yTop - arrowH); pc.lineTo(cx + arrowW, yTop - arrowH); pc.closePath(); pc.fill();
  pc.font = 'bold 11px "DM Mono", monospace'; pc.textAlign = 'center'; pc.textBaseline = 'bottom';
  pc.fillStyle = '#000000'; pc.fillText('C', cx, yTop - arrowH - 2);
  pc.restore();
}

export function renderLabels(labelW, H) {
  lc.clearRect(0, 0, labelW, H);
  for (let r = 0; r < totalRowLines(); r++) {
    const y = rowLineY(r);
    const isTop = (r === 0), isBot = (r === totalRowLines() - 1);
    const holding = isTop || isBot;
    if (isTop && !state.showTopHolding) continue;
    if (isBot && !state.showBotHolding) continue;
    const label = holding ? 'H' : String(r);
    const bw = 22, bh = 16, bx = labelW - bw - 2, by = y - bh / 2;
    lc.fillStyle = '#ffffff'; lc.fillRect(bx, by, bw, bh);
    lc.strokeStyle = '#888070'; lc.lineWidth = 0.9; lc.strokeRect(bx, by, bw, bh);
    lc.font = '600 10px "DM Mono", monospace'; lc.textAlign = 'center';
    lc.fillStyle = '#1c1810'; lc.fillText(label, bx + bw / 2, by + bh - 3);
    lc.strokeStyle = '#993333'; lc.lineWidth = 1.0;
    lc.beginPath(); lc.moveTo(bx + bw, y); lc.lineTo(labelW, y); lc.stroke();
  }
  for (let r = 0; r < totalRowLines() - 1; r++) {
    const y = rowLineY(r) + G.rowH / 2;
    lc.strokeStyle = '#c8b8a8'; lc.lineWidth = 0.8;
    lc.beginPath(); lc.moveTo(labelW - 8, y); lc.lineTo(labelW, y); lc.stroke();
  }
}

// ─────────────────────────────────────────────
//  Full redraw
// ─────────────────────────────────────────────
export function redraw() {
  renderGrid();
  state.stitches.forEach(s => {
    if (s.type === 'down-wave') { drawDownWave(pc, s.s1, s.s2, s.color); return; }
    if (s.type === 'up-wave')   { drawUpWave(pc, s.s1, s.s2, s.color); return; }
    if (s.type === 'trellis')   { drawTrellis(pc, s.s1, s.s2, s.steps, s.color); return; }
    const x1 = s.valley * G.pleatW, x2 = x1 + 2 * G.pleatW, y = rowLineY(s.row);
    if (s.type === 'up-cable')   drawUpCable(pc, x1, x2, y, s.color);
    if (s.type === 'down-cable') drawDownCable(pc, x1, x2, y, s.color);
    if (s.type === 'outline')    drawOutline(pc, x1, x2, y, s.color);
    if (s.type === 'stem')       drawStem(pc, x1, x2, y, s.color);
  });

  if (state.selectedStitches.length) {
    pc.save();
    pc.strokeStyle = '#3377cc'; pc.lineWidth = 2; pc.globalAlpha = 0.6;
    state.selectedStitches.forEach(i => {
      const s = state.stitches[i];
      if (s.type === 'down-wave' || s.type === 'up-wave') {
        const x1 = (s.s1.valley + 1) * G.pleatW, y1 = rowLineY(s.s1.row);
        const x2 = (s.s2.valley + 1) * G.pleatW, y2 = rowLineY(s.s2.row);
        pc.beginPath(); pc.moveTo(x1, y1); pc.lineTo(x2, y2); pc.stroke();
        pc.beginPath(); pc.arc(x1, y1, G.pleatW * 0.6, 0, Math.PI * 2); pc.stroke();
        pc.beginPath(); pc.arc(x2, y2, G.pleatW * 0.6, 0, Math.PI * 2); pc.stroke();
      } else if (s.type === 'trellis') {
        const x1 = (s.s1.valley + 1) * G.pleatW, y1 = rowLineY(s.s1.row);
        const x2 = (s.s2.valley + 1) * G.pleatW, y2 = rowLineY(s.s2.row);
        pc.beginPath(); pc.moveTo(x1, y1); pc.lineTo(x2, y2); pc.stroke();
        pc.beginPath(); pc.arc(x1, y1, G.pleatW * 0.6, 0, Math.PI * 2); pc.stroke();
        pc.beginPath(); pc.arc(x2, y2, G.pleatW * 0.6, 0, Math.PI * 2); pc.stroke();
      } else {
        const x1 = s.valley * G.pleatW, x2 = x1 + 2 * G.pleatW;
        const y  = rowLineY(s.row);
        const cx = (x1 + x2) / 2, r = G.pleatW * 0.6;
        const w  = x2 - x1 + r * 2;
        const h  = r * 2;
        pc.beginPath();
        pc.roundRect(cx - w / 2, y - h / 2, w, h, r);
        pc.stroke();
      }
    });
    pc.globalAlpha = 1; pc.restore();
  }
}

// ─────────────────────────────────────────────
//  Grid toggles
// ─────────────────────────────────────────────
export function toggleCenterline() {
  state.showCenterline = !state.showCenterline;
  document.getElementById('btn-centerline').classList.toggle('active', state.showCenterline);
  redraw();
  flashMsg(state.showCenterline ? 'Centerline marked' : 'Centerline cleared');
}

export function toggleHolding(which) {
  if (which === 'top') {
    state.showTopHolding = !state.showTopHolding;
    document.getElementById('btn-top-holding').classList.toggle('active', state.showTopHolding);
    flashMsg(state.showTopHolding ? 'Top holding row shown' : 'Top holding row hidden');
  } else {
    state.showBotHolding = !state.showBotHolding;
    document.getElementById('btn-bot-holding').classList.toggle('active', state.showBotHolding);
    flashMsg(state.showBotHolding ? 'Bottom holding row shown' : 'Bottom holding row hidden');
  }
  redraw();
}

// ─────────────────────────────────────────────
//  Apply grid settings from UI inputs
// ─────────────────────────────────────────────
export function buildGrid() {
  G.pleats = clamp(parseInt(document.getElementById('inp-pleats').value) || 100,  4, 200);
  G.rows   = clamp(parseInt(document.getElementById('inp-rows').value)   ||  10,  2,  40);
  G.pleatW = clamp(parseInt(document.getElementById('inp-pw').value)     ||   8,  8,  40);
  G.rowH   = clamp(parseInt(document.getElementById('inp-rh').value)     ||  40, 20, 100);
  redraw(); updateStatus();
}
