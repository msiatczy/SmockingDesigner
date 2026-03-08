// ─────────────────────────────────────────────
//  Canvas element references
//  Safe to access at module load time because
//  <script type="module"> is always deferred.
// ─────────────────────────────────────────────
export const plateCanvas   = document.getElementById('plate-canvas');
export const labelCanvas   = document.getElementById('label-canvas');
export const previewCanvas = document.getElementById('preview-canvas');

export const pc  = plateCanvas.getContext('2d');
export const lc  = labelCanvas.getContext('2d');
export const pvc = previewCanvas.getContext('2d');
