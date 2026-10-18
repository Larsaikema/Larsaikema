// Transportkar (trolley) for statafels, klaptafels or stacked bar stools, empty or loaded.
//
// { kind, size, loaded, tableTop, tableFrame, diameter, stoolColor, stoolStyle, frame }
//   kind 'statafel'   cage cart in grey hammer-finish powder coat on four Ø125 heavy-duty
//                     swivel castors (two with brake): base frame with a centre channel the
//                     folded tables stand in, an end frame at each end (one with a push grip),
//                     top and mid side rails that keep the vertical table tops upright.
//                     size 'groot' = 15 tables (ca. 126 x 97 x 113 cm), 'klein' = 5. Loaded
//                     with folded statafels (statafel.js, folded: true), top `tableTop`, frame
//                     `tableFrame`; tops stand across the cart, all inside the end frames.
//        'klaptafel'  platform (ca. 190 x 75 x 90 cm) for folding tables on their long edge:
//                     carpeted bunks, U push frames at both ends; loaded with folded klaptafels.
//        'barkruk'    platform (ca. 150 x 55 cm) for 24 bar stools: 3 stacks of 8 metal stools
//                     (barStool.js) in a row, plywood deck with a bumper edge, push handle.
//        'plateau'    square dolly (`size` side, default 0.9 m) on 4 Ø100 castors (2 with brake), plywood deck with
//                     a rubber bumper, no handle; loaded with stacked square statafels (statafel.js shape square,
//                     `tableWidth`, `tableTop`, `tableFrame`), 7,5 cm stacking pitch.
//        'stapelstoel' chair dolly for stacks of 10: `chairs` 20 (2 stacks in a row, ca. 105 x 58 cm) or 40 (2 x 2,
//                     ca. 105 x 112 cm), plywood deck with bumper, U push handle; loaded with stacks of chairs
//                     (chair.js `chairStyle` metaal | banquet | crossback, `chairColor`), backs towards the handle.
//        'rond'       cage cart for round folding tables on edge (ca. 120 x 102 cm, 10 tables of 9 cm): base frame on
//                     Ø125 castors, two padded cross bunks the discs rest on, side U frames, push grip; loaded with
//                     folded klaptafels shape rond (`diameter` 1.5 / 1.8).
//        'biertafel'  flat cart for 10 biertafelsets (ca. 230 x 82 cm): tube base with slatted deck, U end frames
//                     (one with grip); loaded with folded tables (flat, top up) and the benches in two stacks on top
//                     (`tableWidth` 0.5 / 0.7, `loaded` = sets).
//        'terras'     platform cart for terrastafels with a tilted top (ca. 140 x 80 cm): deck, U end frames (one
//                     with grip) and side rails; shown empty.
//   loaded  number of products on the cart (0 = empty)
//   frame   'hamerslag' (default for statafel) | 'grijs' | 'galv' | powder coat colour
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { statafel } from './statafel.js';
import { klaptafel } from './klaptafel.js';
import { barStool } from './barStool.js';
import { chair } from './chair.js';
import { biertafelset } from './biertafelset.js';
import { chairCart, postCart, rackCart, fridgeCart } from './trolley2.js';

const { V3 } = G;

// grey hammer-finish powder coat: mottled metallic grey with fine dimples
let hammerMat = null;
function hammertone() {
  if (hammerMat) return hammerMat;
  const t = S.leatherTextures(19);
  const nrm = t.nrm.clone(); nrm.repeat.set(1 / 0.11, 1 / 0.11); nrm.needsUpdate = true;
  hammerMat = new THREE.MeshPhysicalMaterial({ color: '#8E9294', metalness: 0.55, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3, normalMap: nrm, normalScale: new THREE.Vector2(0.55, 0.55), name: 'hammertone grey' });
  return hammerMat;
}
export function frameMat(f, dflt = 'grijs') {
  const s = String(f || dflt).toLowerCase();
  if (s === 'hamerslag' || s === 'hammer') return hammertone();
  if (s === 'galv' || s === 'verzinkt') return M.galvanised();
  if (s === 'grijs') return M.steelPowder('#8C9093', { roughness: 0.45, clearcoat: 0.2 });
  return F.powder(s);
}
export const sq = (w = 0.04, h = w) => G.roundedRectProfile(w, h, Math.min(w, h) * 0.18, 3);

export function castors4(bins, xs, zs, yMount, { R = 0.0625 } = {}) {
  const mats = { steel: M.galvanised(), tyre: M.rubber('#2A2B2D'), hub: F.plastic('#8E9194', 0.45) };
  for (const x of xs) for (const z of zs) {
    F.castor(bins, { at: V3(x, yMount, z), R, swivel: true, brake: x > 0, heading: (x > 0 ? 1 : -1) * Math.PI / 2 + (z > 0 ? 0.12 : -0.08), mats });
  }
}
// U frame across z at x: two uprights from y0 to y1 joined by a bent top bar
export function endFrame(bins, mat, x, z, y0, y1, r = 0.0125, grip = false) {
  const pts = [V3(x, y0, -z), V3(x, y1, -z), V3(x, y1, z), V3(x, y0, z)];
  bins.add(mat, F.sweep(F.filletPath(pts, 0.06), G.circleProfile(r, 16)));
  if (grip) bins.add(F.plastic('#1A1A1A', 0.7), G.tube(V3(x, y1, -z * 0.55), V3(x, y1, z * 0.55), r + 0.004, 18));
}

// ------------------------------------------------------------------- statafel cart
// Folded statafel prepared for transport: the leg bundle folds tight against the column
// (the model's open fold is squeezed to 50 % across the stacking direction), the top keeps
// its thickness and moves back onto the hinge. Local frame: top faces +z.
function packedTable(p) {
  let o = statafel({ diameter: p.diameter ?? 0.8, top: p.tableTop || 'berken', frame: p.tableFrame || 'zwart', folded: true }).object;
  o.updateMatrixWorld(true);
  const D = Number(p.diameter ?? 0.8) > 5 ? Number(p.diameter) / 100 : Number(p.diameter ?? 0.8);
  const s = 0.5;
  // flatten: bake every mesh's transform into its geometry (the folded top sits in a rotated
  // sub-group), so the squeeze acts across the stacking direction of the whole table
  const flat = new THREE.Group();
  const meshes = []; o.traverse((m) => { if (m.isMesh) meshes.push(m); });
  for (const m of meshes) {
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const mm = new THREE.Mesh(g, m.material); mm.castShadow = m.castShadow; mm.receiveShadow = m.receiveShadow; mm.name = m.name;
    flat.add(mm);
  }
  let topBack = Infinity;
  const tops = [], rest = [];
  for (const m of flat.children) {
    m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox;
    if (b.max.x - b.min.x > 0.6 * D) { tops.push(m); topBack = Math.min(topBack, b.min.z); } else rest.push(m);
  }
  const shift = topBack - topBack * s;
  for (const m of rest) m.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, s));
  for (const m of tops) m.geometry.translate(0, 0, -shift);
  o = flat;
  o.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(o);
  let topFront = -Infinity, bMin = Infinity, bMax = -Infinity;
  for (const m of tops) topFront = Math.max(topFront, new THREE.Box3().setFromObject(m).max.z);
  for (const m of rest) { const b = new THREE.Box3().setFromObject(m); bMin = Math.min(bMin, b.min.z); bMax = Math.max(bMax, b.max.z); }
  const pitch = Math.max(topFront - bMin, bMax - bMin) + 0.004;
  return { o, box, pitch, topFront, bMin };
}
function statafelCart(bins, group, p) {
  const cap = String(p.size || 'groot').toLowerCase() === 'klein' ? 5 : 15;
  const n = Math.max(0, Math.min(cap, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'hamerslag');
  const rubberMat = M.rubber('#1E1F20');
  const T = packedTable(p);
  const W = 0.97, endGap = 0.055;
  const L = cap * T.pitch + 2 * endGap + 0.04;
  const R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.045; // top of the base frame / deck
  const Htot = 1.13;
  castors4(bins, [-L / 2 + 0.09, L / 2 - 0.09], [-W / 2 + 0.07, W / 2 - 0.07], yM, { R });
  // base: perimeter of 40 x 40 tube, cross members, centre channel with a rubber strip
  const yb = yd - 0.02;
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(), V3(-L / 2, yb, s * (W / 2 - 0.02)), V3(L / 2, yb, s * (W / 2 - 0.02)), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(), V3(s * (L / 2 - 0.02), yb, -W / 2 + 0.04), V3(s * (L / 2 - 0.02), yb, W / 2 - 0.04), { side: V3(0, 1, 0) }));
  }
  const nx = Math.max(2, Math.round(L / 0.42));
  for (let i = 1; i < nx; i++) {
    const x = -L / 2 + (L * i) / nx;
    bins.add(mat, G.prism(sq(0.03), V3(x, yb, -W / 2 + 0.04), V3(x, yb, W / 2 - 0.04), { side: V3(0, 1, 0) }));
  }
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(G.roundedRectProfile(0.004, 0.04, 0.0015, 2), V3(-L / 2 + 0.04, yd + 0.02, s * 0.09), V3(L / 2 - 0.04, yd + 0.02, s * 0.09), { side: V3(0, 0, 1) }));
  }
  bins.add(mat, G.roundedBox(L - 0.08, 0.004, 0.18, 0.0015).translate(0, yd + 0.002, 0));
  bins.add(rubberMat, G.roundedBox(L - 0.1, 0.005, 0.17, 0.002).translate(0, yd + 0.0065, 0));
  // end frames (push grip at +x) and side rails
  const yTop = Htot - 0.0125;
  const zf = W / 2 - 0.02;
  for (const s of [-1, 1]) endFrame(bins, mat, s * (L / 2 - 0.02), zf, yd, yTop, 0.0125, s > 0);
  for (const s of [-1, 1]) {
    for (const y of [yd + 0.42, yTop - 0.06]) bins.add(mat, G.tube(V3(-L / 2 + 0.02, y, s * zf), V3(L / 2 - 0.02, y, s * zf), 0.0115, 14));
    // a diagonal brace in each side panel
    bins.add(mat, G.tube(V3(-L / 2 + 0.03, yd + 0.03, s * zf), V3(-L / 2 + 0.03 + Math.min(0.45, L * 0.3), yd + 0.41, s * zf), 0.009, 12));
  }
  // load: tops across the cart, faces towards -x; each table stands in front of the next
  for (let i = 0; i < n; i++) {
    const t = i === 0 ? T.o : T.o.clone();
    const holder = new THREE.Group();
    holder.add(t);
    holder.rotation.y = -Math.PI / 2; // local +z (top face) -> world -x
    // slots run from the +x end (0) to the -x end (cap - 1); a part load stands centred in the cage
    // (the tables lean on each other, the end frames keep the outer ones upright)
    const slot = cap - 1 - i - Math.floor((cap - n) / 2);
    const x = L / 2 - 0.02 - 0.0125 - endGap + T.bMin - slot * T.pitch;
    holder.position.set(x - 0.006, yd + 0.009, 0);
    group.add(holder);
  }
  // loaded: hero from the front-left, key from the left and lower, so the outer table face
  // (white HPL, birch) reads at its real value instead of a vertical grey
  return { L, W, H: Htot, detailTarget: [L / 2 - 0.09, R, W / 2 - 0.07],
    view: n ? { hero: { azimuth: -34 } } : undefined,
    rig: n ? { key: { azimuth: -62, elevation: 36 }, minExposure: 0.86 } : null };
}

// ------------------------------------------------------------------- klaptafel cart
function klaptafelCart(bins, group, p) {
  const n = Math.max(0, Math.min(10, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'grijs');
  const carpet = S.fabricMat('#3A3B3D', { seed: 7 });
  const Lc = 1.9, Wc = 0.75, Htot = 0.9;
  const R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.04;
  castors4(bins, [-Lc / 2 + 0.12, Lc / 2 - 0.12], [-Wc / 2 + 0.06, Wc / 2 - 0.06], yM, { R });
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(), V3(-Lc / 2, yd - 0.02, s * (Wc / 2 - 0.06)), V3(Lc / 2, yd - 0.02, s * (Wc / 2 - 0.06)), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(), V3(s * (Lc / 2 - 0.02), yd - 0.02, -Wc / 2 + 0.04), V3(s * (Lc / 2 - 0.02), yd - 0.02, Wc / 2 - 0.04), { side: V3(0, 1, 0) }));
  }
  for (const x of [-0.55, 0, 0.55]) {
    bins.add(mat, G.prism(sq(0.03), V3(x, yd - 0.015, -Wc / 2 + 0.06), V3(x, yd - 0.015, Wc / 2 - 0.06), { side: V3(0, 1, 0) }));
    bins.add(carpet, S.softBlock(0.07, 0.045, Wc - 0.06, { r: 0.008, crown: 0.002, belly: 0, gather: 0, uneven: 0.0005, seed: 3 }).translate(x, yd + 0.0225, 0));
  }
  const yTop = Htot - 0.0125;
  for (const s of [-1, 1]) {
    endFrame(bins, mat, s * (Lc / 2 - 0.02), Wc / 2 - 0.06, yd, yTop, 0.0125, true);
    bins.add(mat, G.tube(V3(s * (Lc / 2 - 0.02), yd + 0.4, -Wc / 2 + 0.06), V3(s * (Lc / 2 - 0.02), yd + 0.4, Wc / 2 - 0.06), 0.0115, 14));
  }
  if (n) {
    const proto = klaptafel({ length: p.tableLength ?? 1.83, width: p.tableWidth ?? 0.76, folded: true }).object;
    proto.updateMatrixWorld(true);
    const pb = new THREE.Box3().setFromObject(proto);
    const pitch = pb.max.z - pb.min.z + 0.006;
    for (let i = 0; i < n; i++) {
      const t = i === 0 ? proto : proto.clone();
      t.position.set(0, yd + 0.045, -((n - 1) * pitch) / 2 + i * pitch);
      group.add(t);
    }
  }
  return { L: Lc, W: Wc, H: Htot, detailTarget: [Lc / 2 - 0.12, R, Wc / 2 - 0.06] };
}

// ------------------------------------------------------------------- bar stool platform
function stoolDolly(bins, group, p) {
  const n = Math.max(0, Math.min(24, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'grijs');
  const ply = S.woodMat('beuken', { stain: '#A48A68', finish: 'mat', seed: 61 });
  const bumper = M.rubber('#1C1D1E');
  const L = 1.5, Wd = 0.55, R = 0.05, yM = F.castorHeight(R);
  const yd = yM + 0.035;
  castors4(bins, [-L / 2 + 0.08, L / 2 - 0.08], [-Wd / 2 + 0.07, Wd / 2 - 0.07], yM, { R });
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(0.03), V3(-L / 2 + 0.03, yd - 0.015, s * (Wd / 2 - 0.07)), V3(L / 2 - 0.03, yd - 0.015, s * (Wd / 2 - 0.07)), { side: V3(0, 1, 0) }));
  }
  for (let i = 0; i <= 4; i++) { const x = -L / 2 + 0.06 + ((L - 0.12) * i) / 4; bins.add(mat, G.prism(sq(0.03), V3(x, yd - 0.015, -Wd / 2 + 0.03), V3(x, yd - 0.015, Wd / 2 - 0.03), { side: V3(0, 1, 0) })); }
  const deck = F.slab(L, Wd, 0.018, { rc: 0.03, re: 0.003 });
  S.uvBoxAlong(deck.faces, 'x'); S.uvBoxAlong(deck.band, 'x');
  bins.add(ply, deck.faces.translate(0, yd + 0.018, 0)); bins.add(ply, deck.band.translate(0, yd + 0.018, 0));
  bins.add(bumper, F.sweep(F.rectPath(L + 0.006, Wd + 0.006, 0.033, yd + 0.009), G.roundedRectProfile(0.024, 0.012, 0.005, 3), { closed: true }));
  // push handle at -x
  const xh = -L / 2 + 0.02;
  endFrame(bins, mat, xh, Wd / 2 - 0.07, yd + 0.018, yd + 1.0, 0.0125, true);
  for (const s of [-1, 1]) bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(xh, yd + 0.02, s * (Wd / 2 - 0.07)));
  if (n) {
    const per = 8;
    let left = n;
    for (const x of [-0.44, 0.03, 0.5]) {
      const k = Math.min(per, left); left -= k;
      if (k <= 0) continue;
      const st = barStool({ style: p.stoolStyle || 'metaal', color: p.stoolColor || 'zwart', stack: k }).object;
      st.position.set(x, yd + 0.018, 0);
      group.add(st);
    }
  }
  return { L, W: Wd, H: yd + 1.0, detailTarget: [L / 2 - 0.08, R, Wd / 2 - 0.07] };
}

// ------------------------------------------------------------------- shared deck dolly
// plywood deck (L along x, W along z) on a square-tube under-frame with cross members, a rubber bumper
// round the deck edge and 4 castors (the two at +x with brake). Returns the deck top height.
export function deckDolly(bins, mat, { L, W, R = 0.05 }) {
  const ply = S.woodMat('beuken', { stain: '#A48A68', finish: 'mat', seed: 61 });
  const bumper = M.rubber('#1C1D1E');
  const yM = F.castorHeight(R);
  const yd = yM + 0.035;
  castors4(bins, [-L / 2 + 0.08, L / 2 - 0.08], [-W / 2 + 0.07, W / 2 - 0.07], yM, { R });
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(0.03), V3(-L / 2 + 0.03, yd - 0.015, s * (W / 2 - 0.07)), V3(L / 2 - 0.03, yd - 0.015, s * (W / 2 - 0.07)), { side: V3(0, 1, 0) }));
  }
  const nx = Math.max(3, Math.round(L / 0.36));
  for (let i = 0; i <= nx; i++) {
    const x = -L / 2 + 0.06 + ((L - 0.12) * i) / nx;
    bins.add(mat, G.prism(sq(0.03), V3(x, yd - 0.015, -W / 2 + 0.03), V3(x, yd - 0.015, W / 2 - 0.03), { side: V3(0, 1, 0) }));
  }
  const deck = F.slab(L, W, 0.018, { rc: 0.03, re: 0.003 });
  S.uvBoxAlong(deck.faces, 'x'); S.uvBoxAlong(deck.band, 'x');
  bins.add(ply, deck.faces.translate(0, yd + 0.018, 0)); bins.add(ply, deck.band.translate(0, yd + 0.018, 0));
  bins.add(bumper, F.sweep(F.rectPath(L + 0.006, W + 0.006, 0.033, yd + 0.009), G.roundedRectProfile(0.024, 0.012, 0.005, 3), { closed: true }));
  return { yTop: yd + 0.018, yM };
}

// ------------------------------------------------------------------- plateau for stacked square statafels
function plateauCart(bins, group, p) {
  const n = Math.max(0, Math.min(5, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'grijs');
  const side = Number(p.size ?? 0.9) > 5 ? Number(p.size) / 100 : Number(p.size ?? 0.9) || 0.9;
  const R = 0.05;
  const { yTop } = deckDolly(bins, mat, { L: side, W: side, R });
  // four corner stops so the bottom table's glides stay on the deck
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    bins.add(M.rubber('#1C1D1E'), G.roundedBox(0.05, 0.02, 0.05, 0.006).translate(sx * (side / 2 - 0.05), yTop + 0.01, sz * (side / 2 - 0.05)));
  }
  if (n) {
    const pitch = 0.075;
    const proto = statafel({ shape: 'square', width: p.tableWidth ?? 0.7, top: p.tableTop || 'wit', frame: p.tableFrame || 'zwart' }).object;
    for (let k = 0; k < n; k++) {
      const t = k === 0 ? proto : proto.clone();
      t.position.set(0, yTop + 0.02 + k * pitch, 0);
      group.add(t);
    }
  }
  return { L: side, W: side, H: yTop + (n ? 1.1 + (n - 1) * 0.075 : 0.05), detailTarget: [side / 2 - 0.08, R, side / 2 - 0.07],
    view: n ? undefined : { hero: { elevation: 30 } } };
}

// ------------------------------------------------------------------- chair dolly (stacks of 10)
const CHAIR_PITCH = { metaal: 0.055, metal: 0.055, banquet: 0.075, crossback: 0.1, 'cross-back': 0.1 };
function chairDolly(bins, group, p) {
  const cap = Number(p.chairs ?? 20) >= 40 ? 40 : 20;
  const n = Math.max(0, Math.min(cap, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'grijs');
  const L = 1.05, W = cap === 40 ? 1.12 : 0.58, R = 0.05;
  const { yTop } = deckDolly(bins, mat, { L, W, R });
  // push handle at -x over the full width
  const xh = -L / 2 + 0.02;
  endFrame(bins, mat, xh, W / 2 - 0.07, yTop, yTop + 0.98, 0.0125, true);
  bins.add(mat, G.tube(V3(xh, yTop + 0.5, -(W / 2 - 0.07)), V3(xh, yTop + 0.5, W / 2 - 0.07), 0.0105, 14));
  for (const s of [-1, 1]) bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(xh, yTop + 0.002, s * (W / 2 - 0.07)));
  if (n) {
    const style = String(p.chairStyle || 'metaal').toLowerCase();
    const per = 10, pitch = CHAIR_PITCH[style] ?? 0.07;
    const proto = chair({ style, color: p.chairColor || 'zwart', frame: p.chairFrame || 'zwart' }).object;
    // front of the chair (+z in chair.js) towards +x, backs towards the handle
    const slots = cap === 40 ? [[-0.25, -0.28], [0.27, -0.28], [-0.25, 0.28], [0.27, 0.28]] : [[-0.25, 0], [0.27, 0]];
    let left = n, first = true;
    for (const [x, z] of slots) {
      const k = Math.min(per, left); left -= k;
      for (let i = 0; i < k; i++) {
        const c = first ? proto : proto.clone(); first = false;
        const h = new THREE.Group(); h.add(c);
        h.rotation.y = Math.PI / 2;
        h.position.set(x, yTop + i * pitch, z);
        group.add(h);
      }
    }
  }
  return { L, W, H: yTop + 1.0, detailTarget: [L / 2 - 0.08, R, W / 2 - 0.07],
    view: n ? { hero: { azimuth: 32 } } : undefined };
}

// ------------------------------------------------------------------- round folding tables on edge
function roundCart(bins, group, p) {
  const n = Math.max(0, Math.min(10, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'grijs');
  const pad = S.fabricMat('#3A3B3D', { seed: 9 });
  const Lz = 1.2, Wx = 1.02, R = 0.0625, yM = F.castorHeight(R);
  const yb = yM + 0.04;            // top of the base frame
  const yBunk = 0.31;              // top of the padded bunks the discs rest on
  const zBunk = 0.42;
  castors4(bins, [-Wx / 2 + 0.08, Wx / 2 - 0.08], [-Lz / 2 + 0.09, Lz / 2 - 0.09], yM, { R });
  // base: perimeter of 40 x 40 tube + two cross members under the bunks
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(), V3(s * (Wx / 2 - 0.02), yb - 0.02, -Lz / 2), V3(s * (Wx / 2 - 0.02), yb - 0.02, Lz / 2), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(), V3(-Wx / 2 + 0.04, yb - 0.02, s * (Lz / 2 - 0.02)), V3(Wx / 2 - 0.04, yb - 0.02, s * (Lz / 2 - 0.02)), { side: V3(0, 1, 0) }));
    // bunk: square tube on two short posts, with a carpet pad on top
    for (const sx of [-1, 1]) bins.add(mat, G.prism(sq(0.035), V3(sx * (Wx / 2 - 0.06), yb, s * zBunk), V3(sx * (Wx / 2 - 0.06), yBunk - 0.04, s * zBunk), { side: V3(1, 0, 0) }));
    bins.add(mat, G.prism(sq(0.04), V3(-Wx / 2 + 0.04, yBunk - 0.04, s * zBunk), V3(Wx / 2 - 0.04, yBunk - 0.04, s * zBunk), { side: V3(0, 1, 0) }));
    bins.add(pad, S.softBlock(Wx - 0.1, 0.03, 0.07, { r: 0.008, crown: 0.002, belly: 0, gather: 0, uneven: 0.0005, seed: 5 }).translate(0, yBunk - 0.005, s * zBunk));
  }
  // side U frames at +-x keep the outer discs upright; push grip across x at +z
  const yTop = 1.0;
  for (const s of [-1, 1]) {
    const x = s * (Wx / 2 - 0.02);
    const pts = [V3(x, yb, -0.52), V3(x, yTop, -0.52), V3(x, yTop, 0.52), V3(x, yb, 0.52)];
    bins.add(mat, F.sweep(F.filletPath(pts, 0.06), G.circleProfile(0.0125, 16)));
    bins.add(mat, G.tube(V3(x, 0.62, -0.52), V3(x, 0.62, 0.52), 0.0105, 14));
  }
  bins.add(mat, G.tube(V3(-Wx / 2 + 0.02, yTop, 0.52), V3(Wx / 2 - 0.02, yTop, 0.52), 0.0125, 16));
  bins.add(F.plastic('#1A1A1A', 0.7), G.tube(V3(-0.28, yTop, 0.52), V3(0.28, yTop, 0.52), 0.0165, 18));
  if (n) {
    let D = Number(p.diameter ?? 1.8); if (D > 5) D /= 100;
    const proto0 = klaptafel({ shape: 'rond', diameter: D, folded: true }).object;
    const holder = new THREE.Group(); holder.add(proto0);
    holder.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(holder);
    // the thin dimension of the folded disc goes along x (stacking direction)
    const sz = box.getSize(V3());
    if (sz.z < sz.x) { holder.rotation.y = Math.PI / 2; holder.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(holder); }
    const c = box.getCenter(V3()), size = box.getSize(V3());
    const Rd = D / 2;
    const yc = yBunk + Math.sqrt(Math.max(0, Rd * Rd - zBunk * zBunk));
    const pitch = Math.max(0.09, size.x + 0.004);
    for (let i = 0; i < n; i++) {
      const h = i === 0 ? holder : holder.clone();
      const x = -((n - 1) * pitch) / 2 + i * pitch;
      h.position.set(x - c.x, yc - c.y, -c.z);
      group.add(h);
    }
  }
  return { L: Wx, W: Lz, H: n ? 2.0 : yTop, detailTarget: [Wx / 2 - 0.08, R, Lz / 2 - 0.09],
    view: n ? { hero: { azimuth: 40 } } : undefined };
}

// ------------------------------------------------------------------- biertafelsets, flat
// Three lanes on one deck: the folded tables stacked flat in the middle, the folded benches in a stack
// on either side (their splayed feet make a folded bench ~37 cm wide), so 10 sets stand ~1 m high, all
// inside the end frames (which are sized for a full load of 10, loaded or not).
function bierCart(bins, group, p) {
  const n = Math.max(0, Math.min(10, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'galv');
  let TW = Number(p.tableWidth ?? 0.5); if (TW > 5) TW /= 100;
  const tProto = biertafelset({ only: 'tafel', tableWidth: TW, folded: true }).object;
  const bProto = biertafelset({ only: 'bank', folded: true }).object;
  tProto.updateMatrixWorld(true); bProto.updateMatrixWorld(true);
  const tb = new THREE.Box3().setFromObject(tProto), bb = new THREE.Box3().setFromObject(bProto);
  const tH = tb.max.y - tb.min.y + 0.002, bH = bb.max.y - bb.min.y + 0.002;
  const tW = tb.max.z - tb.min.z, bW = bb.max.z - bb.min.z;
  const zB = tW / 2 + 0.03 + bW / 2;               // bench lane centres
  const L = 2.32, W = 2 * zB + bW + 0.08, R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.045;
  castors4(bins, [-L / 2 + 0.12, L / 2 - 0.12], [-W / 2 + 0.08, W / 2 - 0.08], yM, { R });
  // base: two long rails, cross members, deck slats under each lane
  for (const s of [-1, 1]) bins.add(mat, G.prism(sq(), V3(-L / 2, yd - 0.02, s * (W / 2 - 0.02)), V3(L / 2, yd - 0.02, s * (W / 2 - 0.02)), { side: V3(0, 1, 0) }));
  const nx = 6;
  for (let i = 0; i <= nx; i++) {
    const x = -L / 2 + 0.02 + ((L - 0.04) * i) / nx;
    bins.add(mat, G.prism(sq(0.04), V3(x, yd - 0.02, -W / 2 + 0.04), V3(x, yd - 0.02, W / 2 - 0.04), { side: V3(0, 1, 0) }));
  }
  const slats = [-zB - bW * 0.3, -zB + bW * 0.3, -tW * 0.3, tW * 0.3, zB - bW * 0.3, zB + bW * 0.3];
  for (const z of slats) bins.add(mat, G.prism(sq(0.03), V3(-L / 2 + 0.04, yd + 0.015, z), V3(L / 2 - 0.04, yd + 0.015, z), { side: V3(0, 1, 0) }));
  // lane dividers: low posts between the lanes at both ends
  const y0 = yd + 0.03;
  const full = Math.max(10 * tH, 10 * bH);
  const yTop = Math.max(1.05, y0 + full + 0.08);
  for (const s of [-1, 1]) {
    const x = s * (L / 2 - 0.02);
    endFrame(bins, mat, x, W / 2 - 0.03, yd, yTop, 0.0125, s > 0);
    for (const y of [yd + 0.45, yTop - 0.3]) bins.add(mat, G.tube(V3(x, y, -(W / 2 - 0.03)), V3(x, y, W / 2 - 0.03), 0.0105, 14));
    for (const zs of [-1, 1]) bins.add(mat, G.prism(sq(0.03), V3(x, yd, zs * (tW / 2 + 0.015)), V3(x, yTop - 0.3, zs * (tW / 2 + 0.015)), { side: V3(1, 0, 0) }));
  }
  if (n) {
    const tc = tb.getCenter(V3()), bc = bb.getCenter(V3());
    let y = y0;
    for (let i = 0; i < n; i++) {
      const t = i === 0 ? tProto : tProto.clone();
      t.position.set(-tc.x, y - tb.min.y, -tc.z); group.add(t); y += tH;
    }
    let first = true;
    for (const z of [-zB, zB]) {
      let yb2 = y0;
      for (let i = 0; i < n; i++) {
        const b = first ? bProto : bProto.clone(); first = false;
        b.position.set(-bc.x, yb2 - bb.min.y, z - bc.z); group.add(b); yb2 += bH;
      }
    }
  }
  return { L, W, H: yTop, detailTarget: [L / 2 - 0.12, R, W / 2 - 0.07],
    view: n ? { hero: { azimuth: -30 } } : undefined };
}

// ------------------------------------------------------------------- terrastafels with a tilted top
function terrasCart(bins, group, p) {
  const mat = frameMat(p.frame, 'grijs');
  const L = 1.4, W = 0.8, R = 0.05;
  const { yTop } = deckDolly(bins, mat, { L, W, R });
  const yT = yTop + 0.92;
  for (const s of [-1, 1]) {
    endFrame(bins, mat, s * (L / 2 - 0.02), W / 2 - 0.05, yTop, yT, 0.0125, s < 0);
    for (const y of [yTop + 0.3, yTop + 0.62]) bins.add(mat, G.tube(V3(-L / 2 + 0.02, y, s * (W / 2 - 0.05)), V3(L / 2 - 0.02, y, s * (W / 2 - 0.05)), 0.0105, 14));
  }
  for (const s of [-1, 1]) bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(s * (L / 2 - 0.02), yTop + 0.002, W / 2 - 0.05));
  return { L, W, H: yT, detailTarget: [L / 2 - 0.08, R, W / 2 - 0.07] };
}

export function trolley(p = {}) {
  const kind = String(p.kind || 'statafel').toLowerCase();
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `trolley ${kind}`;
  let info;
  if (kind === 'klaptafel' || kind === 'klaptafels' || kind === 'stoel') info = klaptafelCart(bins, group, p);
  else if (kind === 'barkruk' || kind === 'barkrukken' || kind === 'kruk') info = stoolDolly(bins, group, p);
  else if (kind === 'plateau') info = plateauCart(bins, group, p);
  else if (kind === 'stapelstoel' || kind === 'stapelstoelen') info = chairDolly(bins, group, p);
  else if (kind === 'rond' || kind === 'ronde-klaptafel') info = roundCart(bins, group, p);
  else if (kind === 'biertafel' || kind === 'biertafelset') info = bierCart(bins, group, p);
  else if (kind === 'terras' || kind === 'terrastafel') info = terrasCart(bins, group, p);
  else if (kind === 'klapstoel' || kind === 'klapstoelen' || kind === 'wedding') info = chairCart(bins, group, p);
  else if (kind === 'afzetpaal' || kind === 'afzetpalen') info = postCart(bins, group, p);
  else if (kind === 'kapstok' || kind === 'kapstokken') info = rackCart(bins, group, p);
  else if (kind === 'koelkast' || kind === 'koelkasten') info = fridgeCart(bins, group, p);
  else info = statafelCart(bins, group, p);
  bins.build(group);
  return {
    object: group,
    detail: { target: info.detailTarget, size: 0.3, azimuth: 30, elevation: 12 },
    meta: { kind, L: info.L, W: info.W },
    view: info.view,
    rig: (() => {
      const extra = info.rig || {};
      const r = S.seatRig(group, { default: { groundAO: { maxZenith: 55 }, ...(extra.key ? { key: extra.key } : {}) } });
      if (extra.minExposure) r.default.exposure = Math.max(r.default.exposure, extra.minExposure);
      return r;
    })(),
  };
}
