// Transportkar (trolley) for statafels, klaptafels or stacked bar stools, empty or loaded.
//
// { kind, size, loaded, tableTop, tableFrame, diameter, stoolColor, frame }
//   kind 'statafel'   long deck on four Ø125 castors (two swivel with brake, two fixed),
//                     rubber-lined centre channel the folded tables stand in, two guide
//                     rails that keep the folded leg bundles upright, a push frame at each
//                     end. size 'groot' = 15 tables, 'klein' = 10. Loaded with folded
//                     statafels (statafel.js, folded: true) top `tableTop`, frame `tableFrame`.
//        'klaptafel'  platform for folding tables stood on their long edge (and folding
//                     chairs): carpeted bunks, U push frames at both ends; loaded with
//                     folded klaptafels (klaptafel.js, folded: true).
//        'barkruk'    square dolly (plywood deck with steel frame and bumper edge, push
//                     handle) carrying 2 x 2 stacks of metal bar stools (barStool.js).
//   loaded  number of products on the cart (0 = empty)
//   frame   'galv' (galvanised, default) | powder coat colour
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import { statafel } from './statafel.js';
import { klaptafel } from './klaptafel.js';
import { barStool } from './barStool.js';

const { V3 } = G;

function frameMat(f) {
  const s = String(f || 'galv').toLowerCase();
  return s === 'galv' || s === 'verzinkt' ? M.galvanised() : F.powder(s);
}
const sq = (w = 0.04, h = w) => G.roundedRectProfile(w, h, Math.min(w, h) * 0.18, 3);

function castors4(bins, xs, zs, yMount, { R = 0.0625 } = {}) {
  const mats = { steel: M.galvanised(), tyre: M.rubber('#2A2B2D'), hub: F.plastic('#8E9194', 0.45) };
  for (const x of xs) for (const z of zs) {
    const swivel = x > 0; // swivel + brake at the +x end
    F.castor(bins, { at: V3(x, yMount, z), R, swivel, brake: swivel && z > 0, heading: swivel ? Math.PI / 2 * 0.15 : 0, mats });
  }
}

// U push frame across z at x: two uprights from y0 to y1 joined by a bent top bar
function pushFrame(bins, mat, x, z, y0, y1, r = 0.0125, grip = true) {
  const pts = [V3(x, y0, -z), V3(x, y1, -z), V3(x, y1, z), V3(x, y0, z)];
  bins.add(mat, F.sweep(F.filletPath(pts, 0.06), G.circleProfile(r, 16)));
  if (grip) bins.add(F.plastic('#1A1A1A', 0.7), G.tube(V3(x, y1, -z * 0.55), V3(x, y1, z * 0.55), r + 0.004, 18));
}

// ------------------------------------------------------------------- statafel cart
function statafelCart(bins, group, p) {
  const cap = String(p.size || 'groot').toLowerCase() === 'klein' ? 10 : 15;
  const n = Math.max(0, Math.min(cap, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame);
  const rubberMat = M.rubber('#1E1F20');
  // measure one folded table (local frame: top faces +z)
  const proto = statafel({ diameter: p.diameter ?? 0.8, top: p.tableTop || 'berken', frame: p.tableFrame || 'zwart', folded: true }).object;
  proto.updateMatrixWorld(true);
  const pb = new THREE.Box3().setFromObject(proto);
  const depth = pb.max.z - pb.min.z;
  const pitch = depth + 0.008;
  const Lc = cap * pitch + 0.16, Wc = 0.56;
  const R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.04; // deck level (top of the base tubes)
  castors4(bins, [-Lc / 2 + 0.09, Lc / 2 - 0.09], [-Wc / 2 + 0.05, Wc / 2 - 0.05], yM, { R });
  // base: two long tubes, end + cross tubes, castor plates sit under the long tubes
  for (const s of [-1, 1]) bins.add(mat, G.prism(sq(), V3(-Lc / 2, yd - 0.02, s * (Wc / 2 - 0.05)), V3(Lc / 2, yd - 0.02, s * (Wc / 2 - 0.05)), { side: V3(0, 1, 0) }));
  const nx = Math.max(2, Math.round(Lc / 0.45));
  for (let i = 0; i <= nx; i++) {
    const x = -Lc / 2 + 0.02 + ((Lc - 0.04) * i) / nx;
    bins.add(mat, G.prism(sq(0.03), V3(x, yd - 0.015, -Wc / 2 + 0.07), V3(x, yd - 0.015, Wc / 2 - 0.07), { side: V3(0, 1, 0) }));
  }
  // centre channel (two angle irons) with a rubber mat the tables stand on
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(G.roundedRectProfile(0.004, 0.035, 0.0015, 2), V3(-Lc / 2 + 0.02, yd + 0.0175, s * 0.1), V3(Lc / 2 - 0.02, yd + 0.0175, s * 0.1), { side: V3(0, 0, 1) }));
    bins.add(mat, G.prism(G.roundedRectProfile(0.03, 0.004, 0.0015, 2), V3(-Lc / 2 + 0.02, yd + 0.002, s * 0.115), V3(Lc / 2 - 0.02, yd + 0.002, s * 0.115), { side: V3(0, 0, 1) }));
  }
  bins.add(rubberMat, G.roundedBox(Lc - 0.06, 0.006, 0.19, 0.002).translate(0, yd + 0.003, 0));
  // end push frames + guide rails for the leg bundles
  const yTop = yd + 0.86;
  for (const s of [-1, 1]) pushFrame(bins, mat, s * (Lc / 2 - 0.02), Wc / 2 - 0.05, yd, yTop);
  const yG = yd + 0.36;
  for (const s of [-1, 1]) {
    bins.add(mat, G.tube(V3(-Lc / 2 + 0.02, yG, s * 0.1), V3(Lc / 2 - 0.02, yG, s * 0.1), 0.0125, 14));
    // supports from the guide rails out to the push frames
    for (const sx of [-1, 1]) bins.add(mat, G.tube(V3(sx * (Lc / 2 - 0.02), yG, s * 0.1), V3(sx * (Lc / 2 - 0.02), yG, s * (Wc / 2 - 0.05)), 0.0125, 14));
  }
  // load: folded tables standing in the channel, tops facing -x (towards the key light when the
  // cart is seen from the front-left, see `view`); filled from the -x end
  for (let i = 0; i < n; i++) {
    const t = i === 0 ? proto : proto.clone();
    const holder = new THREE.Group();
    holder.add(t);
    t.position.z = -(pb.min.z + pb.max.z) / 2; // centre the table's depth on the holder
    t.position.x = -(pb.min.x + pb.max.x) / 2;
    holder.rotation.y = -Math.PI / 2;
    holder.position.set(-Lc / 2 + 0.08 + pitch * (i + 0.5), yd + 0.006, 0);
    group.add(holder);
  }
  return { L: Lc, W: Wc, H: Math.max(yTop, n ? yd + pb.max.y : 0), detailTarget: [Lc / 2 - 0.09, R, Wc / 2 - 0.05],
    // loaded: hero from the front-left so the faces of the folded tops catch the key light
    view: n ? { hero: { azimuth: -34 } } : undefined };
}

// ------------------------------------------------------------------- klaptafel cart
function klaptafelCart(bins, group, p) {
  const n = Math.max(0, Math.min(12, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame);
  const carpet = F.upholstery('#3A3B3D', { coarse: true });
  const Lc = 1.9, Wc = 0.8;
  const R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.04;
  castors4(bins, [-Lc / 2 + 0.12, Lc / 2 - 0.12], [-Wc / 2 + 0.06, Wc / 2 - 0.06], yM, { R });
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(), V3(-Lc / 2, yd - 0.02, s * (Wc / 2 - 0.06)), V3(Lc / 2, yd - 0.02, s * (Wc / 2 - 0.06)), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(), V3(s * (Lc / 2 - 0.02), yd - 0.02, -Wc / 2 + 0.04), V3(s * (Lc / 2 - 0.02), yd - 0.02, Wc / 2 - 0.04), { side: V3(0, 1, 0) }));
  }
  // carpeted bunks (wood beams wrapped in carpet) the table edges rest on
  for (const x of [-0.55, 0, 0.55]) {
    bins.add(mat, G.prism(sq(0.03), V3(x, yd - 0.015, -Wc / 2 + 0.06), V3(x, yd - 0.015, Wc / 2 - 0.06), { side: V3(0, 1, 0) }));
    bins.add(carpet, F.cushion(0.07, 0.045, Wc - 0.06, { r: 0.008, puff: 0, seg: [6, 4, 16] }).translate(x, yd + 0.0225, 0));
  }
  const yTop = yd + 0.85;
  for (const s of [-1, 1]) {
    pushFrame(bins, mat, s * (Lc / 2 - 0.02), Wc / 2 - 0.06, yd, yTop);
    // mid rail across each end frame
    bins.add(mat, G.tube(V3(s * (Lc / 2 - 0.02), yd + 0.42, -Wc / 2 + 0.06), V3(s * (Lc / 2 - 0.02), yd + 0.42, Wc / 2 - 0.06), 0.0115, 14));
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
  return { L: Lc, W: Wc, H: yTop, detailTarget: [Lc / 2 - 0.12, R, Wc / 2 - 0.06] };
}

// ------------------------------------------------------------------- bar stool dolly
function stoolDolly(bins, group, p) {
  const n = Math.max(0, Math.round(Number(p.loaded ?? 0)));
  const mat = frameMat(p.frame);
  const ply = F.wood('beuken', { stain: '#9A8366', finish: 'mat', seed: 61 });
  const bumper = M.rubber('#1C1D1E');
  const S = 0.92, R = 0.05, yM = F.castorHeight(R);
  const yd = yM + 0.03;
  castors4(bins, [-S / 2 + 0.08, S / 2 - 0.08], [-S / 2 + 0.08, S / 2 - 0.08], yM, { R });
  // steel frame + plywood deck with a rubber bumper edge
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(0.03), V3(-S / 2 + 0.03, yd - 0.015, s * (S / 2 - 0.08)), V3(S / 2 - 0.03, yd - 0.015, s * (S / 2 - 0.08)), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(0.03), V3(s * (S / 2 - 0.08), yd - 0.015, -S / 2 + 0.03), V3(s * (S / 2 - 0.08), yd - 0.015, S / 2 - 0.03), { side: V3(0, 1, 0) }));
  }
  const deck = F.slab(S, S, 0.018, { rc: 0.03, re: 0.003 });
  F.uvGrain(deck.faces, 'x'); bins.add(ply, deck.faces.translate(0, yd + 0.018, 0)); bins.add(ply, deck.band.translate(0, yd + 0.018, 0));
  bins.add(bumper, F.sweep(F.rectPath(S + 0.006, S + 0.006, 0.033, yd + 0.009), G.roundedRectProfile(0.024, 0.012, 0.005, 3), { closed: true }));
  // push handle at -x
  const xh = -S / 2 + 0.02;
  pushFrame(bins, mat, xh, S / 2 - 0.08, yd + 0.018, yd + 1.0, 0.0125);
  for (const s of [-1, 1]) bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(xh, yd + 0.02, s * (S / 2 - 0.08)));
  if (n) {
    const per = Math.ceil(n / 4);
    let left = n;
    const spots = [[0.225, 0.225], [0.225, -0.225], [-0.225, 0.225], [-0.225, -0.225]];
    for (const [x, z] of spots) {
      const k = Math.min(per, left); left -= k;
      if (k <= 0) continue;
      const st = barStool({ style: p.stoolStyle || 'metaal', color: p.stoolColor || 'zwart', stack: k }).object;
      st.position.set(x + 0.02, yd + 0.018, z);
      group.add(st);
    }
  }
  return { L: S, W: S, H: yd + 1.0, detailTarget: [S / 2 - 0.08, R, S / 2 - 0.08] };
}

export function trolley(p = {}) {
  const kind = String(p.kind || 'statafel').toLowerCase();
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `trolley ${kind}`;
  let info;
  if (kind === 'klaptafel' || kind === 'klaptafels' || kind === 'stoel') info = klaptafelCart(bins, group, p);
  else if (kind === 'barkruk' || kind === 'barkrukken' || kind === 'kruk') info = stoolDolly(bins, group, p);
  else info = statafelCart(bins, group, p);
  bins.build(group);
  return {
    object: group,
    detail: { target: info.detailTarget, size: 0.3, azimuth: 30, elevation: 12 },
    meta: { kind, L: info.L, W: info.W },
    view: info.view,
    rig: { default: { groundAO: { maxZenith: 55 } } },
  };
}
