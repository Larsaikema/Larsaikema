// Opbergtassenset voor buizenframe-partytenten (storage bag set).
//
// { count, color }
// Three black bags of PVC-coated 600D polyester (SG.fabric600), each a sewn soft body
// (SG.softBox) with piping round the end panels, stitched zips with sliders and pullers and
// webbing handles with box-X stitched patches:
//   1. buizentas ~230 cm (tubes up to 216 cm): long, the tube bundle inside shows as soft
//      lengthwise ridges, the tube ends push the end panels out; full-length zip on top, two
//      carry handles and a grab loop at each end
//   2. doektas 75 x 40 x 36 for roof and walls: soft and pillowy (folded cloth inside), slumps
//      and wrinkles, U-zip lid, two carry handles
//   3. koppelstukkentas 50 x 30 x 28 with a stiff bottom: heavy couplers make the walls bulge
//      low and the lid sag; U-zip lid, one padded handle
// Laid out as a 3/4 group: the long bag diagonally at the back, the two others in front.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import { kit, darkRig, addZip, addHandle, addPiping } from './draagtas.js';

const { V3 } = G;
const DEG = Math.PI / 180;

// a soft box laid down: local +Y (its length) -> world +X, local +X -> world down; centred,
// resting on the floor (lift = half height). Returns helpers in world space.
function lying(bins, k, { L, H, D, r, re, disp, warp, seed, x = 0, z = 0, yaw = 0, nu = 180, nWall = 150, lift = null }) {
  const box = SG.softBox({ W: H, D, L, r, re, y0: 0, nu, nWall, nEdge: 9, nEnd: 10, disp, warp });
  const Mx = new THREE.Matrix4().set(0, 1, 0, -L / 2, -1, 0, 0, lift ?? H / 2 + 0.012, 0, 0, 1, 0, 0, 0, 0, 1);
  Mx.premultiply(new THREE.Matrix4().makeRotationY(yaw * DEG).setPosition(x, 0, z));
  const NM = new THREE.Matrix3().getNormalMatrix(Mx);
  const pt = (f, t, l = 0) => { const q = box.point(((f % 1) + 1) % 1, t, l); return { p: q.p.applyMatrix4(Mx), n: q.n.applyMatrix3(NM).normalize() }; };
  const ptM = (f, m, l = 0) => { const q = box.pointM(((f % 1) + 1) % 1, m, l); return { p: q.p.applyMatrix4(Mx), n: q.n.applyMatrix3(NM).normalize() }; };
  const geo = box.geo.clone().applyMatrix4(Mx);
  // drop it so its lowest point just touches the floor
  geo.computeBoundingBox();
  const dy = -geo.boundingBox.min.y + 0.0008;
  geo.translate(0, dy, 0);
  bins.add(k.fab, geo);
  const sh = (q) => { q.p.y += dy; return q; };
  return { box, pt: (f, t, l) => sh(pt(f, t, l)), ptM: (f, m, l) => sh(ptM(f, m, l)), fr: box.frac, dy };
}

function endPiping(bins, k, B) {
  for (const mm of [B.box.mBot + (B.box.mWall0 - B.box.mBot) * 0.5, B.box.mWall1 + (B.box.mTop0 - B.box.mWall1) * 0.5]) {
    const pts = [], nrm = [];
    for (let i = 0; i <= 220; i++) { const q = B.ptM(i / 220, mm, 0.002); pts.push(q.p); nrm.push(q.n); }
    addPiping(bins, k, pts, nrm, { r: 0.0038, stitchOff: 0.008, sideRef: null });
  }
}

function uZip(bins, k, B, half, t0, t1, sliders) {
  const fA = B.fr.left - half, fB = B.fr.left + half;
  const ft = [];
  for (let i = 0; i <= 50; i++) ft.push([fA, t0 + (i / 50) * (t1 - t0)]);
  for (let i = 1; i <= 16; i++) { const u = i / 16; ft.push([fA + (fB - fA) * u, t1]); }
  for (let i = 1; i <= 50; i++) ft.push([fB, t1 - (i / 50) * (t1 - t0)]);
  const pts = [], nrm = [];
  for (const [f, t] of ft) { const q = B.pt(f, t, 0.0012); pts.push(q.p); nrm.push(q.n); }
  addZip(bins, k, { pts, nrm }, { sliders });
}

export function tubeBag(p = {}) {
  const n = Number(p.count ?? 3);
  const hex = p.color && p.color !== 'zwart' ? M.resolveColor(p.color) : '#19191B';
  const k = kit(hex);
  const bins = new G.PartBin();
  // 1. buizentas
  {
    const L = 2.2, H = 0.22, D = 0.27, r = 0.085, re = 0.05;
    const P0 = K.rrFractions(H / 2, D / 2, r).P;
    const cr = SG.creases(21, [
      { n: 46, u: [0, P0], v: [0.02, L - 0.02], ang: Math.PI / 2, angJ: 0.5, len: [0.06, 0.2], wid: [0.012, 0.03], amp: [0.0015, 0.004], sharp: 0.45 },
      { n: 14, u: [0, P0], v: [0.05, L - 0.05], ang: 0, angJ: 0.08, len: [0.3, 1.0], wid: [0.02, 0.035], amp: [0.002, 0.004], sharp: 0.2, sign: 1 },
    ], { periodU: P0 });
    const crE = SG.creases(22, [{ n: 10, u: [-H / 2, H / 2], v: [-D / 2, D / 2], ang: 0, angJ: 1.6, len: [0.04, 0.1], wid: [0.01, 0.02], amp: [0.0015, 0.0035], sharp: 0.4 }]);
    const B = lying(bins, k, {
      L, H, D, r, re, seed: 21, x: -0.08, z: -0.32, yaw: -22,
      disp: (q) => (q.part === 'wall' ? 0.006 * q.face * Math.pow(Math.sin(Math.PI * q.t), 0.3) + cr(q.s, q.y) * (0.4 + 0.6 * q.face) : crE(q.x, q.z) + (q.part === 'top' || q.part === 'bot' ? 0.012 : 0)),
      // tubes settle: the top flattens a little
      warp: (pp) => { const v = -pp.x; return V3(v > 0 ? pp.x * (1 - 0.08 * v / (H / 2)) : pp.x, pp.y, pp.z * (1 + 0.03 * Math.max(0, -v) / (H / 2))); },
    });
    endPiping(bins, k, B);
    // full-length zip on top, a little to the front
    const ft = []; for (let i = 0; i <= 140; i++) ft.push([B.fr.left - 0.045, 0.02 + 0.96 * (i / 140)]);
    const pts = [], nrm = [];
    for (const [f, t] of ft) { const q = B.pt(f, t, 0.0012); pts.push(q.p); nrm.push(q.n); }
    addZip(bins, k, { pts, nrm }, { sliders: [0.92] });
    for (const tc of [0.4, 0.6]) addHandle(bins, k, B.pt(B.fr.left - 0.11, tc, 0.0015), B.pt(B.fr.left + 0.11, tc, 0.0015), { h: 0.05, w: 0.036 });
    // grab loops on both end panels
    for (const mm of [0.03, B.box.mEnd - 0.03]) {
      const a = B.ptM(B.fr.left - 0.06, mm, 0.0015), b = B.ptM(B.fr.left + 0.06, mm, 0.0015);
      addHandle(bins, k, a, b, { h: 0.03, w: 0.03, patchL: 0.04 });
    }
  }
  if (n >= 2) {
    // 2. doektas: soft, pillowy, slumped
    const L = 0.66, H = 0.36, D = 0.42, r = 0.14, re = 0.07;
    const P0 = K.rrFractions(H / 2, D / 2, r).P;
    const cr = SG.creases(23, [
      { n: 40, u: [0, P0], v: [0.0, L], ang: 0, angJ: 0.7, len: [0.06, 0.22], wid: [0.014, 0.035], amp: [0.002, 0.0065], sharp: 0.45 },
      { n: 12, u: [0, P0], v: [0.0, L], ang: Math.PI / 2, angJ: 0.4, len: [0.12, 0.3], wid: [0.03, 0.06], amp: [0.003, 0.007], sharp: 0.25 },
    ], { periodU: P0 });
    const crE = SG.creases(24, [{ n: 24, u: [-H / 2, H / 2], v: [-D / 2, D / 2], ang: 0, angJ: 1.6, len: [0.05, 0.14], wid: [0.012, 0.03], amp: [0.002, 0.006], sharp: 0.45 }]);
    const B = lying(bins, k, {
      L, H, D, r, re, seed: 23, x: -0.36, z: 0.26, yaw: 16,
      disp: (q) => (q.part === 'wall' ? 0.022 * q.face * Math.pow(Math.sin(Math.PI * q.t), 0.6) + cr(q.s, q.y) * (0.5 + 0.5 * q.face) : crE(q.x, q.z) + (q.part === 'top' || q.part === 'bot' ? 0.012 : 0)),
      warp: (pp) => { const v = -pp.x, h = v / (H / 2 + 0.02); const sq = h > 0 ? 1 - 0.12 * h : 1 - 0.05 * -h; const spread = 1 + 0.08 * Math.max(0, 1 - Math.abs(h + 0.6)); return V3(pp.x * sq, pp.y, pp.z * spread); },
    });
    endPiping(bins, k, B);
    uZip(bins, k, B, 0.085, 0.08, 0.92, [0.44, 0.56]);
    for (const tc of [0.36, 0.64]) addHandle(bins, k, B.pt(B.fr.left - 0.13, tc, 0.0015), B.pt(B.fr.left + 0.13, tc, 0.0015), { h: 0.06, w: 0.038 });
  }
  if (n >= 3) {
    // 3. koppelstukkentas: stiff bottom, heavy -> walls bulge low, lid sags
    const L = 0.46, H = 0.27, D = 0.3, r = 0.05, re = 0.04;
    const P0 = K.rrFractions(H / 2, D / 2, r).P;
    const cr = SG.creases(25, [
      { n: 30, u: [0, P0], v: [0.0, L], ang: 0, angJ: 0.6, len: [0.05, 0.16], wid: [0.012, 0.028], amp: [0.0015, 0.0045], sharp: 0.5 },
    ], { periodU: P0 });
    const crE = SG.creases(26, [{ n: 14, u: [-H / 2, H / 2], v: [-D / 2, D / 2], ang: 0, angJ: 1.6, len: [0.04, 0.1], wid: [0.01, 0.022], amp: [0.0015, 0.004], sharp: 0.45 }]);
    const B = lying(bins, k, {
      L, H, D, r, re, seed: 25, x: 0.3, z: 0.3, yaw: -16,
      disp: (q) => {
        // local x>0 = down: bottom face (fr.right) stays flat (stiff board), walls bulge low, lid sags
        if (q.part !== 'wall') return crE(q.x, q.z) * 0.8 + 0.004;
        const down = q.x / (H / 2); // +1 bottom .. -1 lid
        const bulge = q.face * 0.012 * Math.max(0, 0.4 + 0.6 * down) * (Math.abs(q.nz) > 0.5 ? 1 : 0.4);
        const sag = q.nx < -0.7 ? -0.012 * q.face * Math.sin(Math.PI * q.t) : 0;
        const flat = q.nx > 0.7 ? 0 : 1;
        return (bulge + sag + cr(q.s, q.y) * (0.4 + 0.6 * q.face)) * flat;
      },
    });
    endPiping(bins, k, B);
    uZip(bins, k, B, 0.075, 0.1, 0.9, [0.5]);
    addHandle(bins, k, B.pt(B.fr.left - 0.1, 0.5 - 0.0, 0.0015).p ? B.pt(B.fr.left - 0.1, 0.5, 0.0015) : null, B.pt(B.fr.left + 0.1, 0.5, 0.0015), { h: 0.055, w: 0.038, grip: k.tray });
  }
  const g = K.finish(bins, `tubeBag set ${n}`);
  return {
    object: g,
    detail: { target: [0.3, 0.2, 0.3], size: 0.45, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 20 } },
    rig: darkRig(k.dark),
    meta: { n },
  };
}
