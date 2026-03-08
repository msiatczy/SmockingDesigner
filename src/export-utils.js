// ─────────────────────────────────────────────
//  PNG and Print export
// ─────────────────────────────────────────────
import { G, totalRowLines, rowLineY, canvasW, canvasH } from './state.js';
import { plateCanvas } from './canvases.js';
import { flashMsg } from './ui.js';

export function buildExportCanvas() {
  const padL = 58, padT = 44, padR = 20, padB = 20;
  const W = canvasW() + padL + padR, H = canvasH() + padT + padB;
  const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
  const oc2 = oc.getContext('2d');
  oc2.fillStyle = '#ffffff'; oc2.fillRect(0, 0, W, H);
  const title = document.getElementById('plate-title').value || 'Smocking Plate';
  oc2.font = 'bold 15px serif'; oc2.fillStyle = '#1c1810'; oc2.textAlign = 'left';
  oc2.fillText(title, padL, 26);
  oc2.drawImage(plateCanvas, padL, padT);
  oc2.font = '600 10px monospace'; oc2.textAlign = 'center';
  for (let r = 0; r < totalRowLines(); r++) {
    const y = rowLineY(r) + padT;
    const holding = r === 0 || r === totalRowLines() - 1;
    const label = holding ? 'H' : String(r);
    const bw = 20, bh = 14, bx = padL - bw - 4, by = y - bh / 2;
    oc2.fillStyle = '#fff'; oc2.fillRect(bx, by, bw, bh);
    oc2.strokeStyle = '#888'; oc2.lineWidth = 0.8; oc2.strokeRect(bx, by, bw, bh);
    oc2.fillStyle = '#1c1810'; oc2.fillText(label, bx + bw / 2, by + bh - 2);
    oc2.strokeStyle = '#993333'; oc2.lineWidth = 1;
    oc2.beginPath(); oc2.moveTo(bx + bw, y); oc2.lineTo(padL, y); oc2.stroke();
  }
  return oc;
}

export function doPrint() {
  const title = document.getElementById('plate-title').value || 'Smocking Plate';
  const url   = buildExportCanvas().toDataURL('image/png');
  const win   = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{margin:20px;background:#fff}img{max-width:100%}@media print{button{display:none}}</style></head>
    <body><img src="${url}"><br><button onclick="window.print()">Print</button></body></html>`);
  win.document.close();
}

export function doPNG() {
  const title = document.getElementById('plate-title').value || 'smocking-plate';
  const a = document.createElement('a');
  a.href = buildExportCanvas().toDataURL('image/png');
  a.download = title + '.png'; a.click(); flashMsg('Downloaded PNG');
}
