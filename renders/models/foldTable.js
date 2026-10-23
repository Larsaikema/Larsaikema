// Klaptafel met banken, rolbaar (mobile folding table with attached benches, school-canteen type).
//
// { length (2.0), width (0.6), open (true) }
//   A centre chassis on four Ø 100 swivel castors carries the hinge of a two-part table top (each half
//   1,0 x 0,6 m, 25 mm plywood with a light grey HPL face and a black T-edge) and a gas spring per half.
//   Open: each half rests on an H leg at its outer end (two posts, a foot bar with glides) whose arms carry
//   the two bench seats (2 x 200 x 25 cm, same board, seat height 45 cm) on steel rails; the inner bench
//   ends rest on the chassis cross tube. Table height 76 cm.
//   Folded (open: false): both halves swing up about the hinge until the HPL faces meet, the legs fold flat
//   against the under-frame and the bench seats against the outside; the unit stands upright on its
//   castors, ca. 155 cm high.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const DEG = Math.PI / 180;

function hplMat() {
  return K.cached('ft-hpl', () => {
    const m = F.hdpeGranite('#D5D4CE').clone();
    m.roughness = 0.5; m.clearcoat = 0.12; m.name = 'hpl light grey';
    return m;
  });
}
const sq = (w, h) => G.roundedRectProfile(w, h, Math.min(w, h) * 0.2, 3);
// box tube from a to b with a w x h section, `side` = the w direction
const rect = (a, b, w, h, side) => G.prism(sq(w, h), a, b, { side });

export function foldTable(p = {}) {
  const L = Number(p.length ?? 2.0), W = Number(p.width ?? 0.6);
  const open = p.open !== false && p.open !== 'false';
  const half = L / 2 - 0.01, T = 0.025;
  const Htop = 0.76, Hseat = 0.45, zB = W / 2 + 0.205, bw = 0.25;
  const yh = open ? Htop : 0.555;                 // hinge axis height (top-surface level)
  const hpl = hplMat(), edge = F.plastic('#1B1B1C', 0.45);
  const steel = F.powder('antraciet'), chrome = M.chrome(), glide = F.plastic('#161616', 0.55);
  const B = new G.PartBin();

  // ---- the two halves, built in hinge coordinates (hinge on the z axis at the origin, HPL face at y = 0,
  //      x = s * u outwards), then laid open or swung up
  for (const s of [-1, 1]) {
    const H = new G.PartBin();
    const X = (u) => s * u;
    const board = (u0, u1, z, w, y, mat = hpl) => {
      const sl = F.slab(u1 - u0, w, T, { rc: 0.02, re: 0.003 });
      for (const g of [sl.faces, sl.band]) { g.translate(X((u0 + u1) / 2), y, z); }
      F.uvBox(sl.faces, { offset: [s * 0.37, 0, z] });
      H.add(mat, sl.faces); H.add(edge, sl.band);
    };
    board(0.01, 0.01 + half, 0, W, 0);
    // under-frame: two rails, a cross rail at the leg, hinge knuckles
    for (const z of [-0.2, 0.2]) {
      H.add(steel, rect(V3(X(0.03), -T - 0.011, z), V3(X(half - 0.06), -T - 0.011, z), 0.02, 0.022, V3(0, 0, 1)));
      H.add(steel, G.tube(V3(X(0.012), -T - 0.012, z - 0.04), V3(X(0.012), -T - 0.012, z + 0.04), 0.011, 16));
    }
    H.add(steel, rect(V3(X(0.84), -T - 0.011, -0.22), V3(X(0.84), -T - 0.011, 0.22), 0.03, 0.022, V3(1, 0, 0)));
    if (open) {
      const yF = -Htop;                        // floor
      const yS = Hseat - Htop;                 // bench top
      // H leg: two posts, foot bar with glides, bench arms with braces
      for (const z of [-0.11, 0.11]) H.add(steel, rect(V3(X(0.84), -T - 0.02, z), V3(X(0.84), yF + 0.035, z), 0.035, 0.035, V3(1, 0, 0)));
      H.add(steel, rect(V3(X(0.84), yF + 0.02, -0.26), V3(X(0.84), yF + 0.02, 0.26), 0.035, 0.03, V3(1, 0, 0)));
      for (const z of [-0.25, 0.25]) H.add(glide, G.lathe([[0.0001, 0], [0.02, 0], [0.021, 0.004], [0.016, 0.008], [0.0001, 0.008]], 20).translate(X(0.84), yF, z));
      const yA = yS - T - 0.03;
      H.add(steel, rect(V3(X(0.84), yA, -zB - 0.1), V3(X(0.84), yA, zB + 0.1), 0.035, 0.03, V3(1, 0, 0)));
      for (const sz of [-1, 1]) H.add(steel, G.tube(V3(X(0.84), yF + 0.18, sz * 0.11), V3(X(0.84), yA - 0.012, sz * (zB - 0.05)), 0.009, 12));
      // bench rails and seats
      for (const sz of [-1, 1]) {
        H.add(steel, rect(V3(X(0.02), yS - T - 0.011, sz * zB), V3(X(half - 0.02), yS - T - 0.011, sz * zB), 0.03, 0.02, V3(0, 0, 1)));
        board(0.015, 0.015 + half - 0.01, sz * zB, bw, yS);
      }
    } else {
      // folded flat against the under-frame: leg posts + foot bar, then bench rails and seats outside
      for (const z of [-0.11, 0.11]) H.add(steel, rect(V3(X(0.84), -T - 0.042, z), V3(X(0.17), -T - 0.042, z), 0.035, 0.035, V3(0, 0, 1)));
      H.add(steel, rect(V3(X(0.15), -T - 0.042, -0.26), V3(X(0.15), -T - 0.042, 0.26), 0.035, 0.03, V3(1, 0, 0)));
      for (const z of [-0.25, 0.25]) H.add(glide, G.lathe([[0.0001, 0], [0.02, 0], [0.021, 0.004], [0.016, 0.008], [0.0001, 0.008]], 20).rotateZ(s * Math.PI / 2).translate(X(0.15) - s * 0.0, -T - 0.042, z).translate(0, -0.018, 0));
      for (const sz of [-1, 1]) {
        H.add(steel, rect(V3(X(0.03), -T - 0.071, sz * 0.15), V3(X(half - 0.03), -T - 0.071, sz * 0.15), 0.03, 0.02, V3(0, 0, 1)));
        board(0.015, 0.015 + half - 0.01, sz * 0.145, bw, -T - 0.082);
      }
    }
    // gas spring attachment on the rail
    const att = V3(X(0.32), -T - 0.024, 0.0);
    // place the half
    const m = open
      ? new THREE.Matrix4().makeTranslation(0, yh, 0)
      : new THREE.Matrix4().makeTranslation(0, yh, 0).multiply(new THREE.Matrix4().makeRotationZ(s * Math.PI / 2));
    for (const [mat, l] of H.bins) for (const g of l) { g.applyMatrix4(m); B.add(mat, g); }
    att.applyMatrix4(m);
    // gas spring from the chassis base to the rail (body black, rod chrome)
    const a0 = V3(s * 0.05, 0.2, 0.0);
    const d = att.clone().sub(a0), len = d.length(); d.normalize();
    const mid = a0.clone().addScaledVector(d, len * 0.55);
    B.add(F.plastic('#18191A', 0.4), G.tube(a0, mid, 0.011, 16));
    B.add(chrome, G.tube(mid, att, 0.004, 10));
    for (const q of [a0, att]) B.add(steel, G.tube(q.clone().add(V3(0, 0, -0.018)), q.clone().add(V3(0, 0, 0.018)), 0.008, 12));
  }

  // ---- centre chassis on four castors
  const R = 0.05, yM = F.castorHeight(R);
  const mats = { steel: M.galvanised(), tyre: M.rubber('#2A2B2D'), hub: F.plastic('#8E9194', 0.45) };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.castor(B, { at: V3(sx * 0.08, yM, sz * 0.21), R, swivel: true, brake: sz > 0, heading: sx * Math.PI / 2 + 0.15 * sz, mats });
  const yb = yM + 0.015;
  for (const sz of [-1, 1]) B.add(steel, rect(V3(-0.12, yb, sz * 0.21), V3(0.12, yb, sz * 0.21), 0.04, 0.03, V3(0, 0, 1)));
  for (const sx of [-1, 1]) B.add(steel, rect(V3(sx * 0.1, yb, -0.24), V3(sx * 0.1, yb, 0.24), 0.04, 0.03, V3(1, 0, 0)));
  for (const sz of [-1, 1]) {
    B.add(steel, rect(V3(0, yb + 0.015, sz * 0.2), V3(0, yh - 0.04, sz * 0.2), 0.05, 0.05, V3(1, 0, 0)));
    // hinge block
    B.add(steel, G.roundedBox(0.07, 0.05, 0.06, 0.006).translate(0, yh - 0.04, sz * 0.2));
  }
  if (open) {
    // cross tube under the inner bench ends
    const yA = Hseat - T - 0.03 - 0.011;
    B.add(steel, rect(V3(0, yA, -zB - 0.1), V3(0, yA, zB + 0.1), 0.05, 0.03, V3(1, 0, 0)));
  }
  B.add(F.plastic('#18191A', 0.4), G.tube(V3(0, yb + 0.06, -0.2), V3(0, yb + 0.06, 0.2), 0.012, 14));

  const g = K.finish(B, `foldTable ${L}x${W} ${open ? 'open' : 'folded'}`);
  // the open set's bounds (scale of the open shot)
  const refPoints = [];
  for (const x of [-L / 2, L / 2]) for (const z of [-zB - bw / 2, zB + bw / 2]) for (const y of [0, Htop]) refPoints.push([x, y, z]);
  return {
    object: g,
    detail: open ? { target: [L / 2 - 0.16, Hseat, zB], size: 0.45, azimuth: 30, elevation: 18 } : { target: [0.1, 0.3, 0.3], size: 0.5, azimuth: 30, elevation: 12 },
    // folded: framed on its own (at the open set's scale it filled a fifth of the frame)
    view: { hero: open ? { elevation: 20, refPoints } : { elevation: 12, azimuth: 40 } },
    rig: S.seatRig(g),
    meta: { L, W, open },
  };
}
