// Dakzeil (loose roof cover) for an easy-up tent.
//
// `display: 'draped'` shows the cover in its pitched shape exactly as it sits on the frame:
// the canopy is built by the easy-up builder (models/easyUpTent.js: dished half-panels, taped
// hip seams, corner pockets, apex cap, rolled eave and the valance with its festoon and hem)
// and everything that is not cloth is taken away, so the cover floats as a cut-out with no
// floor shadow. `material: 'polyester'` swaps the PVC coating for a matte PU-coated polyester.
// `roofPrint: {artwork}` prints a full-colour sample design on every roof face (upright, bottom
// at the eave) and a band design on the valance.
// `display: 'folded'` shows the cover folded into a flat package on the floor.
// `withFrame: true` keeps the easy-up frame, floor shadow and lighting: a complete printed tent
// (catalogue image of the full-colour easy-up); `legs` picks the frame (default premium).
//   { w, d, color, material: 'pvc'|'polyester', display: 'draped'|'folded', roofPrint, withFrame, legs }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import { makeNoise2 } from '../js/rng.js';
import { easyUpTent } from './easyUpTent.js';

const { V3 } = K;

export function canopyRoof(p = {}) {
  const color = p.color || 'wit';
  const hex = K.col(color, M.COLORS.wit);
  if (String(p.display || 'draped') === 'folded') return foldedRoof(p, hex);
  const w = Number(p.w ?? 3), d = Number(p.d ?? 3);
  const keepFrame = !!p.withFrame;
  const res = easyUpTent({ w, d, color: hex, legs: p.legs || 'premium' });
  const root = res.object;
  const poly = String(p.material || '').toLowerCase().startsWith('poly');
  const polyMat = poly ? K.polyesterFabric(hex) : null;
  const print = p.roofPrint || p.canopyPrint || null;
  // keep the cloth (canopy, patches, valance, cap) and its stitching, drop frame + proxies;
  // materials are recognised by name, so this follows the easy-up builder's cloth materials
  const drop = [], cloth = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.contactProxy || o.layers.mask === 8) { if (!keepFrame) drop.push(o); return; }
    const m = o.material;
    if (K.isCloth(m)) { cloth.add(o); if (polyMat) o.material = polyMat; return; }
    if (K.isThread(m)) return;
    if (!keepFrame) drop.push(o);
  });
  for (const o of drop) { o.parent.remove(o); o.geometry.dispose(); }
  if (!cloth.size) throw new Error('canopyRoof: no cloth meshes found in the easy-up build');
  const mats = [...cloth].map((o) => o.material);
  const fabric = mats.find((m) => /^(pvcCloth|tentFabric) /.test(m.name)) || mats[0];

  const meta = res.meta || {};
  const He = meta.eave ?? 2.1, vDrop = meta.valance ?? 0.21;
  const X = Math.max(w, d) / 2 + 0.022, Z = Math.min(w, d) / 2 + 0.022;
  if (print) {
    const atlas = printAtlas();
    const base = polyMat || fabric;
    const pm = K.printed(base, atlas, 'canopyRoof');
    root.traverse((o) => {
      if (!o.isMesh || !cloth.has(o)) return;
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      const P = g.attributes.position, n = P.count;
      const uv1 = new Float32Array(n * 2);
      const eaveY = He + 0.012;
      for (let t = 0; t < n; t += 3) {
        let cx = 0, cy = 0, cz = 0;
        for (let k = 0; k < 3; k++) { cx += P.getX(t + k); cy += P.getY(t + k); cz += P.getZ(t + k); }
        cx /= 3; cy /= 3; cz /= 3;
        const fx = Math.abs(cx) / X, fz = Math.abs(cz) / Z;
        const face = fz >= fx ? (cz > 0 ? 'front' : 'back') : (cx > 0 ? 'right' : 'left');
        const roof = cy > eaveY + 0.004;
        for (let k = 0; k < 3; k++) {
          const x = P.getX(t + k), y = P.getY(t + k), z = P.getZ(t + k);
          let u, v;
          // u: left -> right as seen from outside that face
          if (face === 'front') u = 0.5 + 0.5 * x / X; else if (face === 'back') u = 0.5 - 0.5 * x / X;
          else if (face === 'right') u = 0.5 - 0.5 * z / Z; else u = 0.5 + 0.5 * z / Z;
          if (roof) {
            const m = face === 'front' || face === 'back' ? Math.abs(z) / Z : Math.abs(x) / X;
            v = 0.24 + 0.76 * Math.min(1, Math.max(0, 1 - m));
          } else v = 0.2 * Math.min(1, Math.max(0, (y - (eaveY - vDrop)) / vDrop));
          uv1[(t + k) * 2] = Math.min(1, Math.max(0, u)); uv1[(t + k) * 2 + 1] = v;
        }
      }
      g.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
      if (g !== o.geometry) o.geometry.dispose();
      o.geometry = g; o.material = pm;
    });
  }
  root.name = `canopyRoof ${w}x${d} ${color}`;
  if (keepFrame) {
    const rigs = { ...(res.rig || {}) };
    if (print && rigs.default) { rigs.default = { ...rigs.default, exposure: 'auto' }; delete rigs.default.toneMapping; delete rigs.default.shoulder; }
    return { ...res, object: root, rig: rigs, meta: { ...(res.meta || {}), w, d, print: !!print, withFrame: true } };
  }
  const rig = { ...(res.rig?.default || K.tentRig(hex)), keyShadow: 0, groundAO: { strength: 0 }, contact: { strength: 0 } };
  if (print) { rig.exposure = 'auto'; delete rig.toneMapping; delete rig.shoulder; }
  return {
    object: root,
    view: { hero: { azimuth: 34, elevation: 22 }, front: { elevation: 10 } },
    rig: { default: rig },
    meta: { w, d, display: 'draped', poly, print: !!print },
  };
}

// Atlas for the printed roof: the square panel artwork in the top 76 %, the valance band in
// the bottom 20 % (uv1 v), 4 % spare between them.
let atlasTex = null;
function printAtlas() {
  if (atlasTex) return atlasTex;
  const panel = K.artwork('panel').image, band = K.artwork('band').image;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1348;
  const g = c.getContext('2d');
  const H = c.height;
  g.drawImage(panel, 0, 0, 1024, H * 0.76);
  g.drawImage(band, 0, H * 0.8, 1024, H * 0.2);
  g.fillStyle = '#173A7A'; g.fillRect(0, H * 0.76, 1024, H * 0.04);
  atlasTex = new THREE.CanvasTexture(c);
  atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 8;
  atlasTex.generateMipmaps = true; atlasTex.minFilter = THREE.LinearMipmapLinearFilter;
  return atlasTex;
}

// Folded cover: the roof folded into a flat package (about 52 x 36 x 9 cm) on the floor, as it
// comes out of the box. Every fold is a soft, double-layer slab with rounded edges all round
// (the fold bends), slightly offset and with an irregular outline; the stack bulges a little
// in the middle, the top layer shows soft creases, and the valance hem with its stitch line
// runs along the front of the top fold.
function foldedRoof(p, hex) {
  const poly = String(p.material || '').toLowerCase().startsWith('poly');
  const fab = poly ? K.polyesterFabric(hex) : K.pvc(hex, { translucent: false });
  const thread = M.tentThread(hex);
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'canopyRoof folded';
  const Lx = 0.52, Lz = 0.36, nL = 7, t = 0.0125;
  const nz = makeNoise2(57);
  const NU = 120, NV = 28, rc = 0.035;
  // rounded-rectangle outline point for u in [0,1) (counter-clockwise from +x)
  const outline = (u, hx, hz) => {
    const a = u * Math.PI * 2;
    const cx = Math.cos(a), sz = Math.sin(a);
    // superellipse with exponent 8 approximates a rounded rectangle
    const e = 0.25;
    const x = Math.sign(cx) * Math.pow(Math.abs(cx), e) * hx, z = Math.sign(sz) * Math.pow(Math.abs(sz), e) * hz;
    return [x, z];
  };
  for (let k = 0; k < nL; k++) {
    const y0 = 0.003 + k * t * 0.98;
    const jx = 0.01 * Math.sin(k * 2.3 + 0.4), jz = 0.008 * Math.cos(k * 1.7);
    const hx = Lx / 2 - 0.004 * ((k * 3) % 4), hz = Lz / 2 - 0.004 * ((k * 5) % 3);
    const th = t * (0.82 + 0.18 * Math.sin(k * 1.9 + 1));
    const top = k === nL - 1;
    const rows = [];
    for (let j = 0; j <= NV; j++) {
      const v = j / NV, row = [];
      for (let i = 0; i <= NU; i++) {
        const u = (i % NU) / NU;
        let [ox, oz] = outline(u, hx, hz);
        // irregular outline: the fold edges are never straight
        const wob = 0.004 * nz.noise(u * 23 + k * 7.1, k * 1.3) + 0.0025 * Math.sin(u * 61 + k);
        const rr = Math.hypot(ox, oz) || 1;
        ox += (ox / rr) * wob; oz += (oz / rr) * wob;
        let x, y, z;
        const bulge = (cxz) => (top ? 0.006 : 0.002) * (1 - cxz * cxz);
        if (v < 0.42) {
          const f = v / 0.42;
          x = ox * f; z = oz * f;
          const cre = top ? 0.004 * nz.fbm(x * 9 + 3, z * 9, 4) + 0.0016 * Math.sin(x * 34 + z * 8) * Math.sin(z * 15 + 1) : 0.0008 * nz.noise(x * 20 + k, z * 20);
          y = y0 + th + bulge(f) * (1 - f * 0.2) + cre * f;
        } else if (v <= 0.58) {
          const a = Math.PI / 2 - ((v - 0.42) / 0.16) * Math.PI;
          const out = 1 + (th * 0.5 * Math.cos(a)) / rr;
          x = ox * out; z = oz * out;
          y = y0 + th * 0.5 + th * 0.5 * Math.sin(a);
        } else {
          const f = 1 - (v - 0.58) / 0.42;
          x = ox * f; z = oz * f; y = y0;
        }
        row.push(V3(x + jx, y, z + jz));
      }
      rows.push(row);
    }
    bins.add(fab, K.gridGeometry(rows, { closedU: true }));
  }
  // valance hem + stitch along the front of the top fold
  const ytop = 0.003 + (nL - 1) * t * 0.98;
  const hem = [], st = [];
  for (let i = 0; i <= 40; i++) {
    const x = -Lx * 0.38 + (Lx * 0.7 * i) / 40;
    hem.push(V3(x, ytop + t * 0.62, Lz / 2 - 0.004));
    st.push(V3(x, ytop + t * 0.98 + 0.0008, Lz / 2 - 0.03));
  }
  bins.add(fab, K.sweep(hem, 0.0028, 6));
  bins.add(thread, K.sweep(st, 0.001, 4));
  bins.build(group);
  return {
    object: group,
    view: { hero: { azimuth: 34, elevation: 30 } },
    rig: { default: { ...K.tentRig(hex), exposure: K.lumOf(hex) > 0.7 ? 0.6 : 'auto' } },
    meta: { display: 'folded' },
  };
}
