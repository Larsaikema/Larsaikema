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
  // round 6: the hovering loose roof read as "a rigid shell floating in mid-air". Like the plain
  // dakzeil variants, the loose printed cover is now shown on the frame (frame not included), seen
  // from higher up (30 deg) so the printed roof is the subject and the picture differs from the
  // complete printed tent's hero (17 deg) and the 'op frame' shot (front left)
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
    const view = roofOnly ? { ...(res.view || {}), hero: { ...((res.view || {}).hero || {}), azimuth: -34 } }
      : loose ? { ...(res.view || {}), hero: { ...((res.view || {}).hero || {}), azimuth: 34, elevation: 30 } } : res.view;
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

// Folded cover. Round 7 (art direction: "a flat stack of paper or felt sheets with razor-thin
// edges and stray stitch lines, not a bulky folded 3 x 3 canopy"; round 4's single zig-zagged
// sheet had 13 thin layers with free edges). A 3 x 3 m roof with its valance is ~11 m2 of
// coated cloth: folded for the bag it is a bulky bundle of ~56 x 40 x 15 cm. Built as folded
// cloth is: ten folded layers, each a soft slab ~1.2 cm thick whose every edge is a ROUND fold
// (no free sheet edge anywhere in view), wavy in plan and in height, every layer a little
// different in size and offset, the layers bedded on each other with a dark groove between them;
// on the right side and on the front the layers pair up into thicker U-folds (the folds of the
// last two folding steps), the top layer domes over the bundle like a cushion with broad soft
// creases and a pressed cross fold. On top lies the folded valance (21 cm band) with its doubled
// hem band and two stitch rows along its free edge (the stitches belong to that hem, nowhere
// else), and two black velcro tabs (the frame straps on the inside of the roof) stick out between
// the layers.
function foldedRoof(p, hex) {
  const poly = !String(p.material || '').toLowerCase().startsWith('pvc');
  const fab = poly ? K.polyesterFabric(hex) : K.pvc(hex, { translucent: false });
  const thread = M.tentThread(hex);
  const strapM = M.webbing('#151617');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'canopyRoof folded';
  const nz = makeNoise2(57);
  const A = 0.28, B = 0.2, nL = 17;           // half size of the bundle in plan, layers
  const TAU = Math.PI * 2;
  // rounded-rectangle boundary in plan, by arc length u in [0,1): point + outward normal
  const rrect = (a, b, rc, u) => {
    const sa = 2 * (a - rc), sb = 2 * (b - rc), q = (Math.PI / 2) * rc;
    const per = 2 * sa + 2 * sb + 4 * q;
    let t = (((u % 1) + 1) % 1) * per;
    // start at the middle of the front edge (+z), run towards +x
    const segs = [
      ['L', sa / 2, [0, b], [1, 0], [0, 1]], ['C', q, [a - rc, b - rc], Math.PI / 2, 0],
      ['L', sb, [a, b - rc], [0, -1], [1, 0]], ['C', q, [a - rc, -(b - rc)], 0, -Math.PI / 2],
      ['L', sa, [a - rc, -b], [-1, 0], [0, -1]], ['C', q, [-(a - rc), -(b - rc)], -Math.PI / 2, -Math.PI],
      ['L', sb, [-a, -(b - rc)], [0, 1], [-1, 0]], ['C', q, [-(a - rc), b - rc], Math.PI, Math.PI / 2],
      ['L', sa / 2, [-(a - rc), b], [1, 0], [0, 1]],
    ];
    for (const sg of segs) {
      if (t <= sg[1] + 1e-9) {
        if (sg[0] === 'L') return { x: sg[2][0] + sg[3][0] * t, z: sg[2][1] + sg[3][1] * t, nx: sg[4][0], nz: sg[4][1] };
        const ang = sg[3] + (sg[4] - sg[3]) * (t / sg[1]);
        return { x: sg[2][0] + rc * Math.cos(ang), z: sg[2][1] + rc * Math.sin(ang), nx: Math.cos(ang), nz: Math.sin(ang) };
      }
      t -= sg[1];
    }
    return { x: 0, z: b, nx: 0, nz: 1 };
  };
  // one folded layer: a slab whose edges are all round folds (Minkowski rounded rectangle),
  // wavy edge in plan (wob) and in height (lift), a domed top
  // noise along the closed edge, sampled on a circle so u = 0 and u = 1 meet without a step
  const pn = (u, freq, a, b, oct = 3) => nz.fbm(Math.cos(TAU * u) * freq / TAU + a, Math.sin(TAU * u) * freq / TAU + b, oct);
  const slab = (L) => {
    const NU = 160, NT = 9, NR = 14, NBt = 3;
    const rows = [];
    const edge = (u) => {
      const e = rrect(L.a, L.b, L.rc, u);
      // corners: where two folds cross the cloth bunches, so every layer's corner splays out or
      // tucks in on its own (a folded bundle never has four neat round corners)
      let cs = 0;
      for (let c = 0; c < 4; c++) {
        const uc = [0.25 * (L.a / (L.a + L.b)), 0.5 - 0.25 * (L.a / (L.a + L.b)), 0.5 + 0.25 * (L.a / (L.a + L.b)), 1 - 0.25 * (L.a / (L.a + L.b))][c];
        const du = ((((u - uc) % 1) + 1.5) % 1) - 0.5;
        cs += L.corner[c] * Math.exp(-((du / 0.035) ** 2));
      }
      const w = L.wob * pn(u, 9, L.k * 3.7, L.k * 1.3) + L.pull * Math.exp(-((((((u - L.pu) % 1) + 1.5) % 1 - 0.5) / 0.05) ** 2)) + cs;
      // the fold edge is never a ruled line: slow waves plus a fine crinkle (pressed PVC
      // puckers along a fold every few cm)
      const lift = L.lift * pn(u, 7, 11 + L.k, L.k * 2.1) + L.crink * pn(u, 70, L.k * 7.3, L.k * 1.9, 1);
      const rr = L.rho * (1 + 0.22 * pn(u, 45, L.k * 3.1, 5.5 + L.k, 1));
      return { x: L.cx + e.x + e.nx * w, z: L.cz + e.z + e.nz * w, nx: e.nx, nz: e.nz, lift, rr };
    };
    const E = []; for (let i = 0; i <= NU; i++) E.push(edge(i / NU));
    // top face: from the centre out to the fold
    for (let j = 0; j <= NT; j++) {
      const s = j / NT, row = [];
      for (let i = 0; i <= NU; i++) {
        const e = E[i];
        const x = L.cx + (e.x - L.cx) * s, z = L.cz + (e.z - L.cz) * s;
        const dome = L.dome * (1 - s * s) + (L.top ? L.topFn(x, z) * Math.min(1, (1 - s) / 0.12) : 0.0015 * nz.fbm(x * 12 + L.k, z * 12, 2));
        row.push(V3(x, L.y + L.rho + e.lift * s * s + dome, z));
      }
      rows.push(row);
    }
    // round fold edge: from the top round to the bottom
    for (let j = 1; j <= NR; j++) {
      const v = (j / NR) * Math.PI, row = [];
      for (let i = 0; i <= NU; i++) {
        const e = E[i];
        const puff = 1 + 0.3 * Math.sin(v);
        row.push(V3(e.x + e.nx * e.rr * Math.sin(v) * puff, L.y + e.lift + L.rho * Math.cos(v), e.z + e.nz * e.rr * Math.sin(v) * puff));
      }
      rows.push(row);
    }
    for (let j = 1; j <= NBt; j++) {
      const s = 1 - j / NBt, row = [];
      for (let i = 0; i <= NU; i++) { const e = E[i]; row.push(V3(L.cx + (e.x - L.cx) * s, L.y - L.rho + e.lift * s, L.cz + (e.z - L.cz) * s)); }
      rows.push(row);
    }
    return rows;
  };
  // top layer: broad soft creases and a pressed cross fold
  const topFn = (x, z) => {
    let h = 0.0055 * nz.fbm(x * 5 + 7, z * 5 + 2, 4) + 0.0018 * nz.fbm(x * 18 + 1, z * 18 + 5, 3);
    const crease = (d, ww) => -0.004 * Math.exp(-((d / ww) ** 2)) + 0.0018 * Math.exp(-(((Math.abs(d) - ww * 1.7) / (ww * 1.2)) ** 2));
    h += crease(x + 0.06 + 0.012 * Math.sin(z * 9), 0.008);
    // the pressed fold lines of the last folding steps (a cross over the top)
    h += 0.8 * crease(z + 0.01 + 0.006 * Math.sin(x * 7), 0.006);
    h += 0.7 * crease(x - 0.14 + 0.008 * Math.sin(z * 8 + 1), 0.006);
    for (const [xc, zc, a, len] of [[0.1, -0.06, 0.5, 0.1], [-0.15, -0.08, 2.3, 0.08], [0.17, 0.02, 1.3, 0.07]]) {
      const dx = x - xc, dz = z - zc, t = dx * Math.cos(a) + dz * Math.sin(a), n = -dx * Math.sin(a) + dz * Math.cos(a);
      if (Math.abs(t) < len) h += 0.0022 * Math.exp(-((n / 0.007) ** 2)) * Math.cos((Math.PI * t) / (2 * len));
    }
    return h;
  };
  const Ls = [];
  let y = 0;
  for (let k = 0; k < nL; k++) {
    const rho = 0.0031 + 0.0011 * (0.5 + 0.5 * Math.sin(k * 2.1 + 0.7));
    const top = k === nL - 1;
    const L = {
      k, rho, top, topFn,
      a: A + 0.012 * Math.sin(k * 1.9 + 0.3) - (top ? 0.004 : 0), b: B + 0.01 * Math.cos(k * 2.4 + 1.1),
      rc: 0.016 + 0.008 * (0.5 + 0.5 * Math.sin(k * 1.3)), cx: 0.011 * Math.sin(k * 2.7 + 1.1), cz: 0.009 * Math.sin(k * 1.7 + 2.2),
      corner: [0, 1, 2, 3].map((c) => 0.016 * Math.sin(k * (1.7 + c * 0.9) + c * 2.1) + (((k + c) % 5 === 0) ? 0.012 : 0)),
      wob: 0.007, pull: (k % 3 === 1 ? 0.014 : 0) * (k % 2 ? 1 : -1), pu: (0.13 + 0.37 * k) % 1,
      lift: 0.003, crink: 0.0011, dome: top ? 0.007 : 0.0012 + 0.0008 * Math.sin(k * 1.1),
    };
    // bundle bulges: the middle layers a little bigger (the folds pushed out by the stack)
    const mid = Math.sin(Math.PI * (k + 0.5) / nL);
    L.a += 0.012 * mid; L.b += 0.01 * mid;
    L.y = y + rho;
    y += 2 * rho + L.dome * 0.6 + 0.0011;
    Ls.push(L);
    bins.add(fab, K.gridGeometry(slab(L), { closedU: true }));
  }
  // U-folds joining pairs of layers: on the right side (+x) layers 0-1, 2-3, ...; on the front
  // (+z) layers 1-2, 3-4, ... (the last two folding steps): a soft round filling the groove
  const pairFold = (L0, L1, side) => {
    const pts = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (side === 'x') {
        const z = -B * 0.82 + 1.64 * B * t;
        const x = Math.min(L0.a + L0.cx, L1.a + L1.cx) + 0.0005 + 0.003 * nz.fbm(z * 9 + L0.k, 4.2, 2);
        pts.push(V3(x, (L0.y + L1.y) / 2 + 0.0015 * nz.noise(z * 11, L0.k), z));
      } else {
        const x = -A * 0.82 + 1.64 * A * t;
        const z = Math.min(L0.b + L0.cz, L1.b + L1.cz) + 0.0005 + 0.003 * nz.fbm(x * 9 + L0.k, 7.7, 2);
        pts.push(V3(x, (L0.y + L1.y) / 2 + 0.0015 * nz.noise(x * 11, L0.k + 3), z));
      }
    }
    const r = (L1.y - L0.y) / 2 + 0.0012;
    bins.add(fab, K.sweep(pts, r, 14, { capStart: true, capEnd: true }));
  };
  for (let k = 0; k + 1 < nL - 1; k += 2) pairFold(Ls[k], Ls[k + 1], 'x');
  for (let k = 1; k + 1 < nL - 1; k += 2) pairFold(Ls[k], Ls[k + 1], 'z');
  // the folded valance on top: a 4 mm band along the front of the top layer, its front edge a
  // round fold, its free back edge the doubled hem band with two stitch rows
  {
    const T = Ls[nL - 1];
    const yTop = (x, z) => T.y + T.rho + T.dome * (1 - Math.min(1, (x * x) / (A * A) * 0.6 + (z * z) / (B * B) * 0.6)) + topFn(x, z);
    const z0 = B - 0.004, z1 = B - 0.16;
    const NXv = 120;
    const rows = [];
    for (let j = 0; j <= 10; j++) {
      const f = j / 10, row = [];
      for (let i = 0; i <= NXv; i++) {
        const x = -A * 0.9 + 1.8 * A * (i / NXv);
        const zb = z1 + 0.008 * nz.fbm(x * 6 + 2, 1.3, 3);
        const z = z0 + (zb - z0) * f;
        row.push(V3(x, yTop(x, z) + 0.0032 + 0.0015 * Math.sin(Math.PI * f), z));
      }
      rows.push(row);
    }
    bins.add(fab, K.gridGeometry(rows));
    // round front fold of the valance (wraps down to the top layer) and the hem edge
    const front = rows[0].map((q) => q.clone().add(V3(0, -0.0016, 0)));
    bins.add(fab, K.sweep(front, 0.0024, 8));
    const hemE = rows[10].map((q) => q.clone().add(V3(0, -0.0012, 0)));
    bins.add(fab, K.sweep(hemE, 0.0021, 6));
    // doubled hem band (2 cm) and two stitch rows (5 and 13.5 mm from the edge)
    const band = [];
    for (let jj = 0; jj <= 2; jj++) band.push(rows[10].map((q, i) => { const r9 = rows[9][i]; const d = q.clone().sub(r9).normalize(); return q.clone().addScaledVector(d, -0.02 * (jj / 2)).add(V3(0, 0.0009, 0)); }));
    bins.add(fab, K.gridGeometry(band));
    for (const dd of [0.005, 0.0135]) bins.add(thread, K.sweep(rows[10].map((q, i) => { const d = q.clone().sub(rows[9][i]).normalize(); return q.clone().addScaledVector(d, -dd).add(V3(0, 0.0016, 0)); }), 0.0007, 4));
  }
  // velcro tabs (frame straps on the inside of the roof) sticking out between the layers
  const tab = (L0, side, along, len, droop) => {
    const yy = L0.y + L0.rho + 0.0008;
    const pts = [], n = 10;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const out = -0.03 + (len + 0.03) * t;
      const dy = -droop * Math.max(0, t - 0.45) ** 2 / 0.3;
      if (side === 'x') pts.push(V3(L0.a + L0.cx + out, yy + dy, along));
      else pts.push(V3(along, yy + dy, L0.b + L0.cz + out));
    }
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[i + 1];
      bins.add(strapM, K.strapGeo(a, b, 0.025, 0.0022, side === 'x' ? V3(0, 1, 0) : V3(0, 1, 0)));
    }
  };
  tab(Ls[5], 'x', 0.07, 0.045, 0.012);
  tab(Ls[10], 'z', -0.12, 0.035, 0.008);
  bins.build(group);
  return {
    object: group,
    view: { hero: { azimuth: 30, elevation: 26 } },
    rig: { default: { ...K.tentRig(hex), exposure: K.lumOf(hex) > 0.7 ? 0.6 : 'auto' } },
    meta: { display: 'folded', layers: nL },
  };
}
