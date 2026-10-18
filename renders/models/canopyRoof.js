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

// Folded cover (round 3): the roof as it comes out of the bag, about 50 x 36 x 9 cm, folded
// like a blanket rather than cut into slabs. Every fold is a flattened loop of thin cloth with
// AIR in it: each of the 7 layers is a soft cushion (a superellipsoid: flat-ish top, fully
// rounded fold edges all round, rounded corners in plan) that pillows up in the middle and is
// pressed down by the layers above, so the edges of the stack read as rounded folds of
// different thickness, never as the thin cut edges of placemats. The layers do not line up:
// each is a little longer / shorter, shifted and turned; the folds at the left and right bulge
// out further than the front and back. The top layer is the roof's outer face with broad soft
// creases, one diagonal fold line, the valance edge with its hem and double stitch running
// along the front and a reinforced corner pocket at the right.
function foldedRoof(p, hex) {
  const poly = String(p.material || '').toLowerCase().startsWith('poly');
  const fab = poly ? K.polyesterFabric(hex) : K.pvc(hex, { translucent: false });
  const patch = K.pvcPatch(hex);
  const thread = M.tentThread(hex);
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'canopyRoof folded';
  const nz = makeNoise2(57);
  const Lx = 0.5, Lz = 0.36, nL = 7;
  const S = (c, e) => Math.sign(c) * Math.pow(Math.abs(c), e);
  const layers = [];
  let y0 = 0;
  for (let k = 0; k < nL; k++) {
    const h = 0.0105 + 0.0055 * (0.5 + 0.5 * Math.sin(k * 2.3 + 0.4)) * (0.6 + 0.4 * Math.cos(k * 1.7)) + (k === nL - 1 ? 0.002 : 0);
    // folds alternate left / right: the fold side of a layer bulges out a little further
    const side = k % 2 === 0 ? 1 : -1;
    const ax = Lx / 2 + 0.006 * Math.sin(k * 1.7) + 0.004, az = Lz / 2 + 0.005 * Math.cos(k * 2.1) - 0.002 * k / nL;
    layers.push({ k, h, y: y0 + h / 2, ax, az, cx: 0.007 * side + 0.004 * Math.sin(k * 3.1), cz: 0.005 * Math.sin(k * 1.3 + 1), rot: 0.012 * Math.sin(k * 2.9 + 0.5), side });
    y0 += h * 0.86; // pressed together a little
  }
  const NT = 160, NP = 28;
  const shape = (L, th, ph) => {
    // superellipsoid: th round the plan, ph from the top (0) to the bottom (pi)
    const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
    const e1 = 0.42, e2 = 0.12; // vertical section: rounded fold edge; plan: rounded corners
    let x = L.ax * S(sp, e1) * S(ct, e2), z = L.az * S(sp, e1) * S(st, e2), y = (L.h / 2) * S(cp, e1);
    // the fold side bulges out further (a loop of cloth with air in it)
    if (Math.sign(ct) === L.side) x += 0.006 * Math.pow(Math.abs(ct), 6) * sp;
    // pillow: the top and bottom faces dome a little in the middle, more so on the top layer
    const inner = (1 - Math.pow(Math.abs(x) / L.ax, 4)) * (1 - Math.pow(Math.abs(z) / L.az, 4));
    const pill = (L.k === nL - 1 ? 0.0045 : 0.0022) * Math.max(0, inner);
    y += pill * Math.max(0, cp) - 0.6 * pill * Math.max(0, -cp);
    // soft unevenness, stronger on the top layer: broad creases + one diagonal fold line
    if (cp > 0.2) {
      const w = Math.min(1, (cp - 0.2) / 0.5);
      let c = 0.0012 * nz.fbm(x * 9 + L.k * 3, z * 9, 3);
      if (L.k === nL - 1) {
        // crumpled cloth: broad soft swells, finer wrinkles, the two pressed fold lines of the last
        // folds (a crease ridge along and across the package) and a few short wrinkles off them
        c += 0.0065 * nz.fbm(x * 5 + 7, z * 5 + 2, 4) + 0.0024 * nz.fbm(x * 16 + 1, z * 16 + 5, 3);
        const crease = (d, w) => -0.0024 * Math.exp(-((d / w) ** 2)) + 0.0016 * Math.exp(-(((Math.abs(d) - w * 1.6) / (w * 1.2)) ** 2));
        c += crease(z - 0.035 + 0.01 * Math.sin(x * 9), 0.006) * Math.max(0, inner);
        c += crease(x + 0.07 + 0.008 * Math.sin(z * 11), 0.007) * Math.max(0, inner) * 0.8;
        for (const [x0, z0, a, len] of [[0.05, 0.06, 0.6, 0.09], [-0.12, -0.05, 2.2, 0.07], [0.14, -0.07, 1.2, 0.08], [-0.02, 0.1, 2.8, 0.06]]) {
          const dx = x - x0, dz = z - z0, t = dx * Math.cos(a) + dz * Math.sin(a), n = -dx * Math.sin(a) + dz * Math.cos(a);
          if (Math.abs(t) < len) c += 0.0018 * Math.exp(-((n / 0.005) ** 2)) * Math.cos((Math.PI * t) / (2 * len));
        }
      }
      y += c * w;
    }
    // the fold edges are cloth, not a moulded rim: they wobble in plan and in height, and the
    // loops sag a little where the air has been pressed out
    const rim = Math.pow(sp, 6);
    const wob = nz.fbm(ct * 2.6 + L.k * 1.9, st * 2.6 + L.k * 0.7, 3);
    const rr = Math.hypot(x / L.ax, z / L.az) || 1;
    x += (x / L.ax / rr) * 0.006 * wob * rim; z += (z / L.az / rr) * 0.006 * wob * rim;
    y += 0.0025 * nz.fbm(ct * 4 + L.k * 3.3, st * 4 + 2, 3) * rim - 0.0012 * rim * (cp < 0 ? 1 : 0.3);
    // rotate a little in plan, shift
    const cr = Math.cos(L.rot), sr = Math.sin(L.rot);
    return V3(L.cx + x * cr - z * sr, L.y + y, L.cz + x * sr + z * cr);
  };
  for (const L of layers) {
    const rows = [];
    for (let j = 0; j <= NP; j++) {
      const ph = (Math.PI * j) / NP, row = [];
      for (let i = 0; i <= NT; i++) row.push(shape(L, (i / NT) * Math.PI * 2, ph));
      rows.push(row);
    }
    bins.add(fab, K.gridGeometry(rows, { closedU: true }));
  }
  // valance hem along the front of the top layer + double stitch, a reinforced corner pocket
  const T = layers[nL - 1];
  const onTop = (x, z, lift) => {
    // find the surface point above plan position (x, z) on the top layer (local, unrotated)
    const th = Math.atan2(z / T.az, x / T.ax);
    const r = Math.max(Math.abs(x) / T.ax, Math.abs(z) / T.az);
    const ph = Math.asin(Math.min(1, Math.pow(Math.max(1e-4, r), 1 / 0.42))) ;
    return shape(T, th, Math.min(ph, Math.PI / 2 - 0.02)).add(V3(0, lift, 0));
  };
  const hem = [], st1 = [], st2 = [];
  for (let i = 0; i <= 60; i++) {
    const x = -T.ax * 0.86 + T.ax * 1.6 * (i / 60);
    hem.push(onTop(x, T.az * 0.84, 0.0012));
    st1.push(onTop(x, T.az * 0.79, 0.0009));
    st2.push(onTop(x, T.az * 0.755, 0.0009));
  }
  bins.add(fab, K.sweep(hem, 0.0024, 6));
  bins.add(thread, K.sweep(st1, 0.0008, 4));
  bins.add(thread, K.sweep(st2, 0.0008, 4));
  bins.build(group);
  return {
    object: group,
    view: { hero: { azimuth: 30, elevation: 26 } },
    rig: { default: { ...K.tentRig(hex), exposure: K.lumOf(hex) > 0.7 ? 0.6 : 'auto' } },
    meta: { display: 'folded' },
  };
}
