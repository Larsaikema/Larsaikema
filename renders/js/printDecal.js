// One-colour print decals (logo / wordmark from js/brandPrints.js) for printed textiles:
// the artwork is drawn on a transparent canvas of the print zone's aspect ratio and laid on a
// surface that follows the cloth a few millimetres outside it (alpha-tested, both sides).
import * as THREE from 'three';
import { resolvePrint } from './brandPrints.js';

export { resolvePrint };

const cache = new Map();
export function artTexture(art, color, cw, ch, fill = 0.96) {
  const key = `${art.d.length}:${art.d.slice(0, 24)}:${color}:${cw}:${ch}:${fill}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'); g.clearRect(0, 0, cw, ch);
  const s = Math.min((ch * fill) / art.vb[1], (cw * fill) / art.vb[0]);
  g.translate((cw - art.vb[0] * s) / 2, (ch - art.vb[1] * s) / 2); g.scale(s, s);
  g.fillStyle = color; g.fill(new Path2D(art.d));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

export function decalMaterial(tex, { roughness = 0.62 } = {}) {
  return new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness, metalness: 0, side: THREE.DoubleSide, name: 'print decal' });
}
