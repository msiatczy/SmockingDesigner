// ─────────────────────────────────────────────
//  Stitch drawing functions
//  Each function draws one stitch onto a given
//  canvas context (ctx).  alpha defaults to 1.
// ─────────────────────────────────────────────
import { G, rowLineY } from './state.js';

export function drawUpCable(ctx, x1, x2, y, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const w  = x2 - x1;
  const ah = Math.min(w * 0.26, G.rowH * 0.36);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.bezierCurveTo(x1, y - ah * 1.875, x2, y - ah * 1.875, x2, y);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.bezierCurveTo(x1, y - ah * 1.875, x2, y - ah * 1.875, x2, y);
  ctx.closePath();
  ctx.strokeStyle = '#1c1810'; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.restore();
}

export function drawDownCable(ctx, x1, x2, y, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const w  = x2 - x1;
  const ah = Math.min(w * 0.26, G.rowH * 0.36);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.bezierCurveTo(x1, y + ah * 1.875, x2, y + ah * 1.875, x2, y);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.bezierCurveTo(x1, y + ah * 1.875, x2, y + ah * 1.875, x2, y);
  ctx.closePath();
  ctx.strokeStyle = '#1c1810'; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.restore();
}

export function drawOutline(ctx, x1, x2, y, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const w  = x2 - x1;
  const ah = Math.min(w * 0.26, G.rowH * 0.36) * 2.0;
  const ex1 = x1, ey1 = y;
  const ex2 = x2, ey2 = y - ah;
  const mx = (ex1 + ex2) / 2, my = (ey1 + ey2) / 2;
  const dx = ex2 - ex1, dy = ey2 - ey1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / len, py = dx / len;
  const bulge = len * 0.12;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(ex1, ey1);
  ctx.quadraticCurveTo(mx + px * bulge, my + py * bulge, ex2, ey2);
  ctx.quadraticCurveTo(mx - px * bulge, my - py * bulge, ex1, ey1);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

export function drawStem(ctx, x1, x2, y, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const w  = x2 - x1;
  const ah = Math.min(w * 0.26, G.rowH * 0.36) * 2.0;
  const ex1 = x1, ey1 = y;
  const ex2 = x2, ey2 = y + ah;
  const mx = (ex1 + ex2) / 2, my = (ey1 + ey2) / 2;
  const dx = ex2 - ex1, dy = ey2 - ey1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / len, py = dx / len;
  const bulge = len * 0.12;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(ex1, ey1);
  ctx.quadraticCurveTo(mx + px * bulge, my + py * bulge, ex2, ey2);
  ctx.quadraticCurveTo(mx - px * bulge, my - py * bulge, ex1, ey1);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

export function drawDownWave(ctx, s1, s2, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const x1 = (s1.valley + 1) * G.pleatW, x2 = (s2.valley + 1) * G.pleatW;
  const y1base = rowLineY(s1.row), y2base = rowLineY(s2.row);
  const startX = x1, startY = y1base, endX = x2, endY = y2base;
  const midX = (startX + endX) / 2, midY = (startY + endY) / 2;
  const dx = endX - startX, dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / len, py = dx / len;
  const bulge = len * 0.12;
  const cp1x = (startX + midX) / 2 + px * bulge * 1.4;
  const cp1y = (startY + midY) / 2 + py * bulge * 1.4;
  const cp2x = (midX + endX) / 2 - px * bulge * 1.4;
  const cp2y = (midY + endY) / 2 - py * bulge * 1.4;
  const thick = G.rowH * 0.022;
  const tpx = px * thick, tpy = py * thick;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(startX + tpx, startY + tpy);
  ctx.bezierCurveTo(cp1x + tpx, cp1y + tpy, cp2x + tpx, cp2y + tpy, endX + tpx, endY + tpy);
  ctx.lineTo(endX - tpx, endY - tpy);
  ctx.bezierCurveTo(cp2x - tpx, cp2y - tpy, cp1x - tpx, cp1y - tpy, startX - tpx, startY - tpy);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

export function drawUpWave(ctx, s1, s2, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const x1 = (s1.valley + 1) * G.pleatW, x2 = (s2.valley + 1) * G.pleatW;
  const y1base = rowLineY(s1.row), y2base = rowLineY(s2.row);
  const startX = x1, startY = y1base, endX = x2, endY = y2base;
  const midX = (startX + endX) / 2, midY = (startY + endY) / 2;
  const dx = endX - startX, dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;
  const px = -dy / len, py = dx / len;
  const bulge = len * 0.12;
  const cp1x = (startX + midX) / 2 - px * bulge * 1.4;
  const cp1y = (startY + midY) / 2 - py * bulge * 1.4;
  const cp2x = (midX + endX) / 2 + px * bulge * 1.4;
  const cp2y = (midY + endY) / 2 + py * bulge * 1.4;
  const thick = G.rowH * 0.022;
  const tpx = px * thick, tpy = py * thick;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(startX + tpx, startY + tpy);
  ctx.bezierCurveTo(cp1x + tpx, cp1y + tpy, cp2x + tpx, cp2y + tpy, endX + tpx, endY + tpy);
  ctx.lineTo(endX - tpx, endY - tpy);
  ctx.bezierCurveTo(cp2x - tpx, cp2y - tpy, cp1x - tpx, cp1y - tpy, startX - tpx, startY - tpy);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

export function drawTrellis(ctx, s1, s2, steps, color, alpha) {
  alpha = (alpha === undefined) ? 1.0 : alpha;
  const cx1 = (s1.valley + 1) * G.pleatW, cy1 = rowLineY(s1.row);
  const cx2 = (s2.valley + 1) * G.pleatW, cy2 = rowLineY(s2.row);
  const sign  = (s2.row >= s1.row) ? 1 : -1;
  const thick = G.rowH * 0.022;
  const startV = s1.valley + 1;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let i = 0; i < steps; i++) {
    const t1 = i / steps, t2 = (i + 1) / steps;
    const sx = (startV + i)     * G.pleatW, ex = (startV + i + 2) * G.pleatW;
    const sy = cy1 + t1 * (cy2 - cy1),       ey = cy1 + t2 * (cy2 - cy1);
    const midX = (sx + ex) / 2, midY = (sy + ey) / 2;
    const dx = ex - sx, dy = ey - sy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) continue;
    const px = -dy / len, py = dx / len;
    const bulge = len * 0.12;
    const cp1x = (sx + midX) / 2 + sign * px * bulge * 1.4;
    const cp1y = (sy + midY) / 2 + sign * py * bulge * 1.4;
    const cp2x = (midX + ex) / 2 - sign * px * bulge * 1.4;
    const cp2y = (midY + ey) / 2 - sign * py * bulge * 1.4;
    const tpx = px * thick, tpy = py * thick;
    ctx.beginPath();
    ctx.moveTo(sx + tpx, sy + tpy);
    ctx.bezierCurveTo(cp1x + tpx, cp1y + tpy, cp2x + tpx, cp2y + tpy, ex + tpx, ey + tpy);
    ctx.lineTo(ex - tpx, ey - tpy);
    ctx.bezierCurveTo(cp2x - tpx, cp2y - tpy, cp1x - tpx, cp1y - tpy, sx - tpx, sy - tpy);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
