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
  // the printed roof cover on its own ("los dak met luifel"): a printed roof without the
  // complete tent's 'note' and without an explicit withFrame is shown WITHOUT a frame, hovering
  // low over the studio floor with its soft shadow under it (round 3 put it on a black frame,
  // which contradicted the product: the frame is not included)
  const loose = !!(p.roofPrint || p.canopyPrint) && !(p.roofPrint && p.roofPrint.note) && p.withFrame == null;
  const keepFrame = p.withFrame !== false && !loose;
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
  if (loose) {
    // hover: valance hem 0.42 m over the floor, a soft key shadow and sky occlusion under it
    const lift = new THREE.Group(); lift.add(root); root.position.y = -(He - vDrop - 0.42);
    // no key shadow: cast from a hovering roof it lands far behind it on the floor and reads as a
    // smudge in the backdrop; the sky occlusion alone gives the soft shadow right under it
    const rigL = { ...(res.rig?.default || K.tentRig(hex)), keyShadow: 0, contact: { strength: 0 } };
    if (print) { rigL.exposure = 'auto'; delete rigL.toneMapping; delete rigL.shoulder; }
    return {
      object: lift,
      view: { hero: { azimuth: 34, elevation: 20 } },
      rig: { default: rigL },
      meta: { w, d, display: 'loose', poly, print: !!print },
    };
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

// Folded cover (round 4; round 3's seven pillow-shaped layers read as "a stack of red rubber
// mats"). The roof as it comes out of the bag, about 50 x 36 x 9 cm, built the way cloth is
// folded: ONE thin sheet zig-zagged into 13 layers. Each layer is a thin, slightly crinkled
// sheet with a little air under it; consecutive layers are joined alternately on the left and
// the right by a soft U-shaped fold that bulges out a few millimetres, so the visible side shows
// a column of loose rounded loops and the front shows the thin free edges of the sheets, like
// the pages of a book, uneven and a little wavy. The top layer is the roof's outer face with
// broad soft creases and a pressed diagonal fold, the valance hem with its double stitch runs
// along the front. Default cloth: matte PU-coated polyester (the easy-up roof cloth).
function foldedRoof(p, hex) {
  const poly = !String(p.material || '').toLowerCase().startsWith('pvc');
  const fab = poly ? K.polyesterFabric(hex) : K.pvc(hex, { translucent: false });
  const thread = M.tentThread(hex);
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'canopyRoof folded';
  const nz = makeNoise2(57);
  const Lx = 0.5, Lz = 0.36, nL = 13;
  // layer table: height, extents, offsets (every layer a little different)
  const L = [];
  let y = 0.0016;
  for (let k = 0; k < nL; k++) {
    const gap = 0.0042 + 0.0034 * (0.5 + 0.5 * Math.sin(k * 2.3 + 0.4)) + (k === 0 ? 0 : 0.0012 * Math.cos(k * 1.7));
    const x0 = -Lx / 2 + 0.011 * Math.sin(k * 1.9 + 0.3) + 0.004 * (k % 2 ? 1 : -1);
    const x1 = Lx / 2 + 0.011 * Math.sin(k * 2.7 + 1.1) + 0.005 * (k % 3 - 1);
    const z0 = -Lz / 2 + 0.009 * Math.sin(k * 1.3 + 2) - 0.003 * k / nL, z1 = Lz / 2 + 0.011 * Math.cos(k * 2.1) + 0.004 * Math.sin(k * 3.3);
    L.push({ k, y, x0, x1, z0, z1 });
    y += gap;
  }
  const NXg = 64, NZg = 46;
  // height of layer k at (u, w) in [0,1]^2: air pillow in the middle, crinkles, top-layer creases
  const hAt = (Lk, u, w) => {
    const x = Lk.x0 + (Lk.x1 - Lk.x0) * u, z = Lk.z0 + (Lk.z1 - Lk.z0) * w;
    const edge = Math.min(1, Math.min(u, 1 - u) / 0.08) * Math.min(1, Math.min(w, 1 - w) / 0.1);
    let h = 0.0016 * Math.sin(Math.PI * u) * Math.sin(Math.PI * w);
    h += 0.0012 * nz.fbm(x * 14 + Lk.k * 3.1, z * 14, 3) * edge;
    if (Lk.k === nL - 1) {
      h += 0.009 * nz.fbm(x * 6 + 7, z * 6 + 2, 4) * edge + 0.0032 * nz.fbm(x * 22 + 1, z * 22 + 5, 3) * edge;
      const crease = (d, ww) => -0.0045 * Math.exp(-((d / ww) ** 2)) + 0.002 * Math.exp(-(((Math.abs(d) - ww * 1.6) / (ww * 1.2)) ** 2));
      h += crease(z - 0.035 + 0.01 * Math.sin(x * 9), 0.006) * edge;
      h += crease(x + 0.07 + 0.008 * Math.sin(z * 11), 0.007) * 0.8 * edge;
      for (const [xc, zc, a, len] of [[0.05, 0.06, 0.6, 0.09], [-0.12, -0.05, 2.2, 0.07], [0.14, -0.07, 1.2, 0.08], [-0.02, 0.1, 2.8, 0.06]]) {
        const dx = x - xc, dz = z - zc, t = dx * Math.cos(a) + dz * Math.sin(a), n = -dx * Math.sin(a) + dz * Math.cos(a);
        if (Math.abs(t) < len) h += 0.0024 * Math.exp(-((n / 0.006) ** 2)) * Math.cos((Math.PI * t) / (2 * len)) * edge;
      }
    }
    // free front / back edges curl a hair up or down
    const ew = Math.max(0, 1 - Math.min(w, 1 - w) / 0.06);
    h += 0.0015 * ew * nz.noise(x * 30 + Lk.k * 5, Lk.k * 2.3);
    return Lk.y + h;
  };
  const P = (Lk, u, w) => V3(Lk.x0 + (Lk.x1 - Lk.x0) * u, hAt(Lk, u, w), Lk.z0 + (Lk.z1 - Lk.z0) * w);
  for (const Lk of L) {
    const rows = [];
    for (let j = 0; j <= NZg; j++) { const row = []; for (let i = 0; i <= NXg; i++) row.push(P(Lk, i / NXg, j / NZg)); rows.push(row); }
    bins.add(fab, K.gridGeometry(rows));
    // the free edges front and back: a thin rolled edge so the sheet reads with its thickness
    for (const w of [0, 1]) {
      const e = []; for (let i = 0; i <= NXg; i++) e.push(P(Lk, i / NXg, w).add(V3(0, 0.0004, 0)));
      bins.add(fab, K.sweep(e, 0.0011, 5));
    }
  }
  // U-folds joining layer k and k+1, alternately on the right (+x) and the left (-x)
  for (let k = 0; k < nL - 1; k++) {
    const A = L[k], B = L[k + 1], right = k % 2 === 0;
    const rows = [];
    const NA = 14;
    for (let j = 0; j <= NZg; j++) {
      const w = j / NZg;
      const a = P(A, right ? 1 : 0, w), b = P(B, right ? 1 : 0, w);
      const mid = a.clone().lerp(b, 0.5), rad = Math.max(0.0025, (b.y - a.y) / 2);
      const bulge = 0.005 + 0.004 * (0.5 + 0.5 * nz.noise(w * 7 + k * 1.3, k * 0.9)) + 0.007 * Math.sin(Math.PI * w) * (0.6 + 0.4 * Math.sin(k * 1.7));
      const sx = right ? 1 : -1;
      const row = [];
      for (let i = 0; i <= NA; i++) {
        const t = (Math.PI * i) / NA; // 0: at layer k, pi: at layer k+1
        const out = Math.sin(t) * (rad + bulge);
        const yy = mid.y - Math.cos(t) * rad;
        const base = a.clone().lerp(b, (1 - Math.cos(t)) / 2);
        row.push(V3(base.x + sx * out, yy, base.z));
      }
      rows.push(row);
    }
    bins.add(fab, K.gridGeometry(rows));
  }
  // valance hem along the front of the top layer + double stitch
  const T = L[nL - 1];
  const hem = [], st1 = [], st2 = [];
  for (let i = 0; i <= 60; i++) {
    const u = 0.08 + 0.84 * (i / 60);
    hem.push(P(T, u, 0.93).add(V3(0, 0.0012, 0)));
    st1.push(P(T, u, 0.9).add(V3(0, 0.0009, 0)));
    st2.push(P(T, u, 0.875).add(V3(0, 0.0009, 0)));
  }
  bins.add(fab, K.sweep(hem, 0.0022, 6));
  bins.add(thread, K.sweep(st1, 0.0007, 4));
  bins.add(thread, K.sweep(st2, 0.0007, 4));
  bins.build(group);
  return {
    object: group,
    view: { hero: { azimuth: 30, elevation: 26 } },
    rig: { default: { ...K.tentRig(hex), exposure: K.lumOf(hex) > 0.7 ? 0.6 : 'auto' } },
    meta: { display: 'folded', layers: nL },
  };
}
