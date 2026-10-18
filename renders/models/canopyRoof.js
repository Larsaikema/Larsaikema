// Dakzeil (loose roof cover) for an easy-up tent.
//
// `display: 'draped'` shows the cover in its pitched shape exactly as it sits on the frame:
// the canopy is built by the easy-up builder (models/easyUpTent.js: dished half-panels, taped
// hip seams, corner pockets, apex cap, rolled eave and the valance with its festoon and hem).
// Round 2: the cover is shown ON a black Premium frame (frame not included), with the studio
// floor, contact shadows and the catalogue tent light, like every other tent image (a floating
// cut-out broke the studio-floor convention). `withFrame: false` still gives the cut-out.
// `material: 'polyester'` swaps the PVC coating for a matte PU-coated polyester.
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
  const keepFrame = p.withFrame !== false;
  // roof-only product on a frame (no 'note' = not the complete tent): seen from front-left, so it
  // never repeats the complete printed tent's hero
  const roofOnly = !(p.roofPrint && p.roofPrint.note) && !!(p.roofPrint || p.canopyPrint) && !!p.withFrame;
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
    const view = roofOnly ? { ...(res.view || {}), hero: { ...((res.view || {}).hero || {}), azimuth: -34 } } : res.view;
    return { ...res, object: root, rig: rigs, view, meta: { ...(res.meta || {}), w, d, print: !!print, withFrame: true } };
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

// Folded cover (round 2): the roof as it comes out of the box, about 52 x 36 x 9 cm. Built as ONE
// continuous sheet folded like an accordion (Z-fold): every layer is the thin cloth (two sheets
// with a little air between them), joined to the next by a U-bend that alternates between the
// left and the right side, so the right side shows stacked loops and the front shows the thin
// layer edges with dark shadow gaps (not solid slabs). Every layer has its own length, skew and
// waviness, the bends sag and bulge, the stack settles a little in the middle; the top layer
// carries soft creases and the valance edge with its hem and double stitch running along the
// front, one reinforced corner pocket peeking out at the right.
function foldedRoof(p, hex) {
  const poly = String(p.material || '').toLowerCase().startsWith('poly');
  const fab = poly ? K.polyesterFabric(hex) : K.pvc(hex, { translucent: false });
  const patch = K.pvcPatch(hex);
  const thread = M.tentThread(hex);
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'canopyRoof folded';
  const nz = makeNoise2(57);
  const Lx = 0.52, Lz = 0.36, nL = 8, pitch = 0.0105, tc = 0.0016;
  // centre line of the sheet in the side profile (x, y), layer by layer, with the U-bends
  const prof = [];
  const lay = [];
  for (let k = 0; k < nL; k++) {
    const y = 0.004 + k * pitch;
    const ext = Lx / 2 - 0.006 * ((k * 5) % 3) + 0.004 * Math.sin(k * 2.1);
    lay.push({ y, x0: -ext + 0.008 * Math.sin(k * 1.3 + 0.5), x1: ext + 0.006 * Math.cos(k * 1.7) });
  }
  for (let k = 0; k < nL; k++) {
    const L = lay[k], dir = k % 2 === 0 ? 1 : -1;
    const xa = dir > 0 ? L.x0 : L.x1, xb = dir > 0 ? L.x1 : L.x0;
    const nS = 40;
    for (let i = 0; i <= nS; i++) { const t = i / nS; prof.push({ x: xa + (xb - xa) * t, y: L.y, layer: k, t }); }
    if (k < nL - 1) {
      // U-bend up to the next layer at xb, bulging out a little and sagging
      const rr = pitch / 2, cx = xb, cy = L.y + rr, nB = 14;
      const bulge = 0.004 + 0.003 * Math.sin(k * 2.7);
      for (let i = 1; i < nB; i++) { const a = -Math.PI / 2 + (Math.PI * i) / nB; prof.push({ x: cx + dir * (Math.cos(a) * (rr + bulge * Math.cos(a))), y: cy + Math.sin(a) * rr, layer: k + 0.5, t: i / nB, bend: true }); }
    }
  }
  // sweep the profile across z: the sheet, as a thin double layer (outer + inner face)
  const NZ = 64;
  const point = (q, v, side) => {
    const z = -Lz / 2 + Lz * v;
    const k = Math.floor(q.layer);
    // per layer: a slight skew in plan, wavy front and back edges, the stack settles in the middle
    const skew = 0.01 * Math.sin(k * 1.9 + 0.3) * (v - 0.5) * 2;
    const settle = -0.0035 * Math.sin(Math.PI * v) * Math.sin(Math.PI * (q.x / Lx + 0.5)) * (k / nL);
    const top = Math.floor(q.layer) === nL - 1 && !q.bend;
    const crease = top ? 0.0035 * nz.fbm(q.x * 7 + 3, z * 7, 4) + 0.0016 * Math.sin(q.x * 30 + z * 9) * Math.sin(z * 17 + 1) : 0.0007 * nz.noise(q.x * 18 + k, z * 18);
    const edge = Math.min(1, v * 14, (1 - v) * 14);
    const y = q.y + (settle + crease) * edge + side * tc / 2;
    return V3(q.x + skew + 0.003 * nz.noise(k * 3.1, z * 9) * (q.bend ? 1 : 0.3), y, z + 0.004 * Math.sin(q.x * 9 + k) * (1 - edge));
  };
  for (const side of [1, -1]) {
    const rows = [];
    for (let j = 0; j <= NZ; j++) { const v = j / NZ; rows.push(prof.map((q) => point(q, v, side))); }
    if (side < 0) for (const r of rows) r.reverse();
    bins.add(fab, K.gridGeometry(rows));
  }
  // the thin front and back edges of every layer (cut edges / hems), so layers read as cloth
  for (const v of [0, 1]) {
    const rows = [prof.map((q) => point(q, v, 1)), prof.map((q) => point(q, v, -1))];
    if (v === 0) rows.reverse();
    bins.add(fab, K.gridGeometry(rows));
  }
  // valance hem along the front of the top layer, double stitch, a corner pocket
  const top = lay[nL - 1];
  const yT = top.y + tc / 2;
  const hem = [], st1 = [], st2 = [];
  for (let i = 0; i <= 50; i++) {
    const x = top.x0 + 0.02 + (top.x1 - top.x0 - 0.04) * (i / 50);
    const q = point({ x, y: top.y, layer: nL - 1 }, 0.985, 1);
    hem.push(q.clone().add(V3(0, 0.0012, 0)));
    st1.push(point({ x, y: top.y, layer: nL - 1 }, 0.95, 1).add(V3(0, 0.0009, 0)));
    st2.push(point({ x, y: top.y, layer: nL - 1 }, 0.925, 1).add(V3(0, 0.0009, 0)));
  }
  bins.add(fab, K.sweep(hem, 0.0022, 6));
  bins.add(thread, K.sweep(st1, 0.0008, 4));
  bins.add(thread, K.sweep(st2, 0.0008, 4));
  {
    // reinforced corner pocket (double layer triangle with a stitch) at the right front corner
    const cx = top.x1 - 0.005, cz = Lz / 2 - 0.005, s = 0.075;
    const tri = [];
    for (let j = 0; j <= 6; j++) { const row = []; for (let i = 0; i <= 6; i++) { const u = i / 6, w = j / 6 * (1 - u); const x = cx - s * u, z = cz - s * w; const v = (z + Lz / 2) / Lz; row.push(point({ x, y: top.y, layer: nL - 1 }, v, 1).add(V3(0, 0.0011, 0))); } tri.push(row); }
    bins.add(patch, K.gridGeometry(tri));
    const sl = []; for (let i = 0; i <= 12; i++) { const u = i / 12; const x = cx - (s - 0.012) * u, z = cz - 0.012 - (s - 0.024) * (1 - u) * 0; const v = (z + Lz / 2) / Lz; sl.push(point({ x, y: top.y, layer: nL - 1 }, v, 1).add(V3(0, 0.0018, 0))); }
    bins.add(thread, K.sweep(sl, 0.0007, 4));
  }
  bins.build(group);
  return {
    object: group,
    view: { hero: { azimuth: 34, elevation: 30 } },
    rig: { default: { ...K.tentRig(hex), exposure: K.lumOf(hex) > 0.7 ? 0.6 : 'auto' } },
    meta: { display: 'folded' },
  };
}
