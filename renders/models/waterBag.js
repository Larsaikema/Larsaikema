// Watergewichtzakken (water weight bags, ~20 kg each).
//
// { count, color, filled }
// Each bag is a ring of PVC tarpaulin (650 g/m², HF-welded) that lies round a tent leg on the
// foot plate: two flat annular panels (Ø 51 cm, hole Ø 11 cm) welded together along the outer
// and the inner edge, so a filled bag is a heavy water pillow: the bottom panel lies flat on the
// floor, the top panel domes to ~13 cm and meets the bottom panel at a crisp welded seam whose
// flange sticks out (10 mm outside, 7 mm into the hole). A straight slit (2 cm, parallel edges)
// lets it go round the leg; there the panels are welded across, the bag thins to that seam and
// the cloth pulls into a few tension wrinkles. A hook-and-loop tab and a webbing strap with a
// side-release buckle close the slit; a screw-cap filler spout sits on top opposite the slit
// with 'MAX 20 L' printed beside it. Material: satin PVC (js/partsLook3.pvcSatin), no lumpy
// noise. Round 3 (art direction 18-10): the round-2 bag read as a glossy melted rubber donut
// with a puckered inner ring.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';
import * as L5 from '../js/partsLook5.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function ringBag(bins, extras, mats, { Ro = 0.252, Ri = 0.056, H = 0.112, hs = 0.052, hi = 0.056, gw = 0.022, seed = 1, filled = true, textYaw = 0 }) {
  const nz = makeNoise2(seed);
  const rc = (Ro + Ri) / 2, hw = (Ro - Ri) / 2;
  const ye = 0.046;                 // height of the welded end seam (the tube pinches to it)
  const taperL = 0.085;             // arc length over which the body thins into the end seam
  const Hf = filled ? H : 0.014, hsF = filled ? hs : 0.006, hiF = filled ? hi : 0.006;
  const co = 0.034, ci = 0.02;      // floor contact inset from the outer / inner seam
  // slit with parallel edges at z = +-gw/2 (local +X = slit direction): end angle per radius
  const phiE = (r) => Math.asin(Math.min(0.99, (gw / 2 + 0.004) / r));
  // taper factor from the arc distance to the nearer end
  const kOf = (phi, r) => { const e = phiE(r); const d = Math.min(phi - e, TAU - e - phi) * r; return K.sstep(0, taperL, Math.max(0, d)); };
  // section: v 0..0.5 top (outer seam -> inner seam), 0.5..1 bottom (inner seam -> floor -> outer seam)
  const sec = (v, k, phi) => {
    let r, y, top = false;
    if (v <= 0.5) {
      const s = 1 - 4 * v; // +1 outer seam .. -1 inner seam
      r = rc + s * hw;
      const ys = hiF + (hsF - hiF) * (s + 1) / 2;
      const prof = Math.pow(1 - Math.pow(Math.abs(s), 4.5), 0.85);
      y = ys + (Hf - ys) * prof;
      // low tension undulation, and wrinkles parallel to the slit where the body thins
      y += 0.0011 * nz.fbm(phi * 1.6 + 3.1, s * 1.3, 2) * prof;
      const zone = Math.max(0, Math.sin(Math.PI * K.clamp01((k - 0.05) / 0.9)));
      y += 0.0026 * zone * Math.sin(TAU * (r - Ri) / 0.042 + phi * 0.6) * prof;
      top = true;
    } else {
      const t = (v - 0.5) * 2;
      if (t < 0.22) { const a = (t / 0.22) * Math.PI / 2; r = Ri + ci * (1 - Math.cos(a)); y = hiF * Math.cos(a); }
      else if (t < 0.78) { const u = (t - 0.22) / 0.56; r = Ri + ci + (Ro - co - Ri - ci) * u; y = 0.0004; }
      else { const a = ((1 - t) / 0.22) * Math.PI / 2; r = Ro - co * (1 - Math.cos(a)); y = hsF * Math.cos(a); }
      // the bottom panel bulges out a touch below each seam (water pressure)
      if (t < 0.22) r -= 0.004 * Math.sin(Math.PI * t / 0.22);
      if (t > 0.78) r += 0.006 * Math.sin(Math.PI * (1 - t) / 0.22);
    }
    y = ye + (y - ye) * k;
    if (!top) y = Math.max(0.0004, y);
    return [r, y];
  };
  const nv = 72, nu = 220;
  const vs = [];
  for (let j = 0; j <= nv; j++) { const t = j / nv; vs.push(t); }
  const rows = vs.map((v) => {
    const row = [];
    for (let i = 0; i <= nu; i++) {
      // per row: the radius at full section decides the slit angles (parallel slit edges)
      const r0 = sec(v, 1, 0)[0];
      const e = phiE(r0);
      const phi = e + (TAU - 2 * e) * (i / nu);
      const k = kOf(phi, r0);
      const [r, y] = sec(v, k, phi);
      row.push(V3(Math.cos(phi) * r, y, -Math.sin(phi) * r));
    }
    return row;
  });
  bins.add(mats.pvc, K.gridGeometry(rows, { closedU: false, flip: false }));
  // welded flanges round the outer and inner seams (two layers, a little drooping), and the
  // welded end seams across the slit ends
  const flange = (side) => {
    const fl = side > 0 ? 0.011 : 0.007;
    const rowsF = [0, 1].map((t) => Array.from({ length: 181 }, (_, i) => {
      const rs = side > 0 ? Ro : Ri;
      const e = phiE(rs);
      const phi = e + (TAU - 2 * e) * (i / 180);
      const k = kOf(phi, rs);
      const ys = (side > 0 ? hsF : hiF);
      const y0 = ye + (ys - ye) * k;
      const r = rs + side * (fl * t - 0.0015);
      return V3(Math.cos(phi) * r, y0 - 0.0035 * t * t + 0.0006, -Math.sin(phi) * r);
    }));
    return K.gridGeometry(rowsF, { closedU: false });
  };
  for (const side of [1, -1]) {
    const f = flange(side); bins.add(mats.pvc, f);
    const f2 = f.clone(); f2.translate(0, -0.0013, 0); bins.add(mats.pvc, f2);
  }
  for (const sz of [1, -1]) {
    // end seam: a flat weld strip just inside each slit edge, from the inner to the outer flange
    const pts = [];
    for (let i = 0; i <= 20; i++) { const r = Ri - 0.006 + (Ro - Ri + 0.016) * (i / 20); const ph = phiE(r) + 0.004 / r; pts.push(V3(Math.cos(ph) * r, ye, -sz * Math.sin(ph) * r)); }
    // a vertical weld fin (the two panels pressed together), 12 mm tall
    bins.add(mats.pvc, K.strapAlong(pts, 0.0024, 0.012, { up: V3(0, 1, 0) }));
  }
  // top surface height at (phi, r) (no wrinkles), for the closures, the spout and the print
  const topY = (phi, r) => {
    const s = (r - rc) / hw;
    if (Math.abs(s) >= 1) return ye + 0.002;
    const v = (1 - s) / 4;
    const r0 = sec(v, 1, 0)[0];
    return sec(v, kOf(phi, r0), phi)[1];
  };
  // closures across the slit: hook-and-loop tab (inner) and webbing strap with buckle (outer).
  // Round 5: they lie ON the cloth (surface normals from the top surface, the strap follows the
  // slope down into the pinched end and bridges the slit taut, a hair above the end seams), with
  // box stitching where each is welded / sewn on; no more flat blades floating over the slit.
  const surf = (phi, r, lift) => {
    const y = topY(phi, r);
    const e = 0.002;
    const yx = (topY(phi, r + e) - topY(phi, r - e)) / (2 * e);               // d y / d r
    const yp = (topY(phi + e / r, r) - topY(phi - e / r, r)) / (2 * e);       // d y / d (arc)
    const radial = V3(Math.cos(phi), 0, -Math.sin(phi)), tang = V3(-Math.sin(phi), 0, -Math.cos(phi));
    const n = V3(0, 1, 0).addScaledVector(radial, -yx).addScaledVector(tang, -yp).normalize();
    return { p: V3(Math.cos(phi) * r, y, -Math.sin(phi) * r).addScaledVector(n, lift), n };
  };
  const across = (r, half, lift) => {
    const pts = [], nrm = [];
    const e = phiE(r) + 0.004;
    for (let i = 0; i <= 40; i++) { const q = surf(e + half * (1 - i / 40), r, lift); pts.push(q.p); nrm.push(q.n); }
    const a = surf(e, r, lift), b = surf(TAU - e, r, lift);
    const ya = Math.max(a.p.y, b.p.y);
    for (let i = 1; i < 12; i++) { const t = i / 12; const q = a.p.clone().lerp(b.p, t); q.y = Math.max(q.y, ya - 0.002 * Math.sin(Math.PI * t)); pts.push(q); nrm.push(a.n.clone().lerp(b.n, t).normalize()); }
    for (let i = 0; i <= 40; i++) { const q = surf(TAU - e - half * (i / 40), r, lift); pts.push(q.p); nrm.push(q.n); }
    return { pts, nrm };
  };
  const tab = across(Ri + 0.045, 0.42, 0.0022);
  bins.add(mats.hook, K.strapAlong(tab.pts, 0.034, 0.0022, { normals: tab.nrm }));
  const str = across(Ro - 0.042, 0.2, 0.0018);
  bins.add(mats.web, K.strapAlong(str.pts, 0.025, 0.0018, { normals: str.nrm }));
  // box stitching on the sewn-down ends (first / last 3 cm of each closure)
  for (const [path, w] of [[tab, 0.034], [str, 0.025]]) {
    for (const end of [0, 1]) {
      const n = path.pts.length, i0 = end ? n - 1 : 0, i1 = end ? n - 9 : 8;
      const A = path.pts[i0], B = path.pts[i1], N = path.nrm[i0];
      const T = B.clone().sub(A).normalize(), Sd = V3().crossVectors(N, T).normalize();
      const hw = w / 2 - 0.004;
      const c = (sx, t) => A.clone().lerp(B, t).addScaledVector(Sd, sx * hw).addScaledVector(N, 0.0013);
      const bx = [c(-1, 0.1), c(1, 0.1), c(1, 0.9), c(-1, 0.9)];
      for (const [k0, k1] of [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]]) {
        const line = [], nl = []; for (let q = 0; q <= 10; q++) { line.push(bx[k0].clone().lerp(bx[k1], q / 10)); nl.push(N); }
        bins.add(mats.thr, SG.stitches(line, nl, { len: 0.003, gap: 0.0014, w: 0.0009, h: 0.0005 }));
      }
    }
  }
  {
    const i = Math.round(str.pts.length * 0.62);
    const T = str.pts[i + 1].clone().sub(str.pts[i - 1]).normalize();
    const N = str.nrm[i];
    const bk = K.buckleGeo(0.025);
    bk.applyMatrix4(K.basisAt(str.pts[i].clone().addScaledVector(N, 0.0012), V3().crossVectors(N, T).normalize(), N, T));
    bins.add(mats.buckle, bk);
  }
  // filler spout + screw cap opposite the slit, on the crest
  const cp = V3(-rc, topY(Math.PI, rc) - 0.003, 0);
  bins.add(mats.pvc, K.lathe([[0.036, -0.002], [0.036, 0.0015], [0.031, 0.0028], [0.021, 0.0038], [0.021, 0.0]], 48).translate(cp.x, cp.y, cp.z));
  const capProfile = [[0.0001, 0.03], [0.015, 0.03], [0.0185, 0.0285], [0.019, 0.006], [0.018, 0.0035], [0.0001, 0.0035]].reverse();
  bins.add(mats.cap, K.lathe(capProfile, 48).translate(cp.x, cp.y, cp.z));
  for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU; const rib = G.roundedBox(0.002, 0.02, 0.0014, 0.0005); rib.translate(Math.cos(a) * 0.0191, 0.017, Math.sin(a) * 0.0191); rib.translate(cp.x, cp.y, cp.z); bins.add(mats.cap, rib); }
  // 'MAX 20 L' printed on the top beside the spout (reads from the slit side = towards the viewer)
  if (filled && mats.print) {
    const w = 0.1, h = 0.021;
    const d = V3(Math.cos(textYaw), 0, -Math.sin(textYaw)), e = V3(-d.z, 0, d.x); // baseline, up (away)
    const C = V3(-rc + 0.052, 0, 0.0).addScaledVector(e, 0.0);
    extras.push(L3.decalOn((u, v) => {
      const q = C.clone().addScaledVector(d, (u - 0.5) * w).addScaledVector(e, (v - 0.5) * h);
      const r = Math.hypot(q.x, q.z), phi = ((Math.atan2(-q.z, q.x) % TAU) + TAU) % TAU;
      return V3(q.x, topY(phi, r) + 0.0005, q.z);
    }, mats.print, { nu: 30, nv: 6, rough: 0.45, name: 'water bag print' }));
  }
  return { outerR: Ro + 0.011 };
}

export function waterBag(p = {}) {
  const n = Number(p.count ?? 4);
  const filled = p.filled !== false;
  const hex = p.color && p.color !== 'zwart' ? M.resolveColor(p.color) : '#1B1C1E';
  const pvc = L5.pvc5(hex, { rough: 0.44, coat: 0.2 });
  const { tex } = K.printTex('MAX 20 L', { color: '#E9E6DF', px: 1024, font: '700 160px "Arial", sans-serif' });
  const mats = { pvc, thr: SG.thread('#4A4B50', { sheen: 0.7 }), hook: SG.hookTape('#2A2B2E'), web: M.webbing('#141516'), buckle: SG.moulded('#151617', { rough: 0.42, spec: 0.6 }), cap: SG.moulded('#232426', { rough: 0.38, spec: 0.55 }), print: tex };
  const bins = new G.PartBin();
  const extras = [];
  const cols = 2, pitch = 0.6;
  for (let i = 0; i < n; i++) {
    const sub = new G.PartBin(); const subEx = [];
    const c = i % cols, r = Math.floor(i / cols);
    // slit (local +X) towards the viewer's front-left, a little different per bag
    const yaw = (-118 + [0, 16, -10, 22][i % 4]) * DEG;
    // print baseline along the hero camera's right vector (world yaw 34 deg -> right = -56 deg)
    ringBag(sub, subEx, mats, { seed: 3 + i * 5, H: 0.112 - (i % 2) * 0.004, filled, textYaw: 34 * DEG - yaw });
    const x = (c - 0.5) * pitch + (r ? 0.03 : 0), z = (0.5 - r) * pitch * 0.95;
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(m); bins.add(mat, geo); }
    for (const e of subEx) { e.geometry.applyMatrix4(m); extras.push(e); }
  }
  const g = K.finish(bins, `waterBag ${n}`, extras);
  return {
    object: g,
    detail: { target: [-0.1, 0.1, 0.25], size: 0.4, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 30 } },
    rig: L5.goodsRig({ tone: 'black', size: 0.6, extra: { contact: { strength: 0.9, h0: 0.008, res: 1024, blur: 1.3, wide: { strength: 0.4, h0: 0.03, sigma: 0.02 } } } }),
    meta: { n, filled },
  };
}
