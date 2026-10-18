// Stertent (star tent): a tensioned PVC-coated canvas with 6-8 points on one central mast
// (or two masts in line for the long version), each point pulled out and up on a leaning
// perimeter pole with an inline guy rope to a steel stake. Between the points the free edges
// (kedder rope in a hem) sweep up and inward, which gives the star its shape.
//
// Form found with the force-density method on a polar net (js/tentkit.js): radial and hoop
// force densities chosen for a uniform membrane stress (q_r ~ r, q_hoop ~ 1/r), edge cables
// with a set radius of curvature. The single mast carries the cloth on a 44 cm crown ring with
// a reinforced top cap; double-mast tents sag into a saddle between the masts.
//
//   { diameter, points, height, color, masts: 1|2, length, walls: 'panorama'|'closed'|null,
//     canopyPrint: {artwork} }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';

const { V3, TAU } = K;

export function stertent(p = {}) {
  const Dm = Number(p.diameter ?? p.w ?? 10), N = Math.max(4, Math.round(Number(p.points ?? 6)));
  const masts = Number(p.masts ?? 1) >= 2 ? 2 : 1;
  const Lm = Number(p.length ?? (masts === 2 ? Dm * 1.6 : Dm));
  const Hc = Number(p.height ?? (masts === 2 ? 6 : 5));
  const Hp = Number(p.poleHeight ?? (Dm >= 9 ? 2.35 : 2.2));
  const hex = K.col(p.color || 'wit', M.COLORS.wit);
  const print = p.canopyPrint || p.print || null;
  const baseFab = K.pvc(hex);
  const fab = print ? K.printed(baseFab, K.artwork('star'), 'star') : baseFab;
  const wallFab = K.pvc(K.col(p.wallColor || p.color || 'wit', M.COLORS.wit));
  // `wallPrint: {artwork}`: full-colour printed walls (sample design: the band artwork over the
  // solid band under the panorama windows, and plain base colour above)
  const wallPrintMat = p.wallPrint ? K.printed(wallFab, K.artwork('band'), 'star-wall') : null;
  const alu = M.aluminium({ roughness: 0.3 });
  const steel = M.galvanised();
  const ropeM = K.ropeMat(K.lumOf(hex) > 0.5 ? '#E8E6E0' : '#2A2B2D');
  const capM = M.mouldedNylon('#1A1A1A');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `stertent ${Dm} ${N}p`;

  // ---- outline: star points -----------------------------------------------------------------
  const A = Lm / 2, B = Dm / 2;
  const tips = [];
  if (masts === 1) {
    for (let k = 0; k < N; k++) { const a = ((k + 0.5) / N) * TAU; tips.push(a); }
  } else {
    // points on an ellipse: one at each end, the rest spread over the long sides
    const side = (N - 2) / 2;
    const xs = []; for (let s = 0; s < side; s++) xs.push(-A * 0.62 + (A * 1.24 * s) / Math.max(1, side - 1));
    const pts = [[A, 0]];
    for (const x of xs.slice().reverse()) pts.push([x, -B * Math.sqrt(Math.max(0, 1 - (x / A) ** 2))]);
    pts.push([-A, 0]);
    for (const x of xs) pts.push([x, B * Math.sqrt(Math.max(0, 1 - (x / A) ** 2))]);
    for (const [x, z] of pts) tips.push(Math.atan2(x, z));
    tips.sort((a, b) => ((a + TAU) % TAU) - ((b + TAU) % TAU));
  }
  const tipsN = tips.map((a) => (a + TAU) % TAU).sort((a, b) => a - b);
  const radiusAt = (a) => masts === 1 ? B : 1 / Math.sqrt((Math.sin(a) / A) ** 2 + (Math.cos(a) / B) ** 2);

  // ---- polar net --------------------------------------------------------------------------
  // ring 0 is the crown: a 22 cm ring round a single mast, or for two masts a thin slot along
  // the ridge between the mast tops (both crowns + a ridge rope that sags between them)
  const Mseg = masts === 1 ? 30 : 26;
  const NS = tipsN.length * Mseg, NR = 46;
  const r0 = 0.22;
  const xm = masts === 1 ? 0 : Math.max(1.5, (Lm - Dm) / 2);
  const ridgeSag = masts === 1 ? 0 : 0.55;
  const angles = [];
  for (let k = 0; k < tipsN.length; k++) {
    const a0 = tipsN[k], a1 = k + 1 < tipsN.length ? tipsN[k + 1] : tipsN[0] + TAU;
    for (let s = 0; s < Mseg; s++) angles.push(a0 + ((a1 - a0) * s) / Mseg);
  }
  const id = (i, j) => j * NS + (((i % NS) + NS) % NS);
  const net = new K.Net(NS * (NR + 1));
  const dirOf = (a) => V3(Math.sin(a), 0, Math.cos(a));
  // crown curve point for angle a (plan) and its height
  const crown = (a) => {
    const d = dirOf(a);
    if (masts === 1) return V3(d.x * r0, Hc - 0.03, d.z * r0);
    // stadium round the ridge segment [-xm, xm]: half-circles of r0 at the mast tops, a 3 cm
    // slot in between (covered by the ridge cap)
    const x = Math.max(-xm - r0, Math.min(xm + r0, d.x * (xm + r0) * 1.6));
    const ax = Math.abs(x);
    let z;
    if (ax > xm) z = Math.sign(d.z || 1) * Math.sqrt(Math.max(0, r0 * r0 - (ax - xm) ** 2));
    else z = Math.sign(d.z || 1) * 0.015;
    const t = Math.min(1, ax / xm);
    const y = ax > xm ? Hc - 0.03 : Hc - 0.03 - ridgeSag * (1 - t * t);
    return V3(x, y, z);
  };
  for (let j = 0; j <= NR; j++) for (let i = 0; i < NS; i++) {
    const a = angles[i], Ro = radiusAt(a), d = dirOf(a), c = crown(a);
    const t = j / NR;
    net.set(id(i, j), c.x + (d.x * Ro - c.x) * t, c.y + (Hp - c.y) * t, c.z + (d.z * Ro - c.z) * t);
  }
  // force densities: the cloth is cut and tensioned as a cone, the radial stress dominates the
  // hoop stress (HOOP < 1), so the canvas runs nearly straight from the crown to the points.
  // q = stress x tributary width / length, from the initial layout.
  const HOOP = Number(p.hoop ?? 0.18);
  const P0 = net.P.slice();
  const dist0 = (a, b) => Math.hypot(P0[a * 3] - P0[b * 3], P0[a * 3 + 1] - P0[b * 3 + 1], P0[a * 3 + 2] - P0[b * 3 + 2]) || 1e-3;
  for (let j = 0; j <= NR; j++) for (let i = 0; i < NS; i++) {
    const a = id(i, j), b = id(i + 1, j);
    if (j < NR) {
      const c = id(i, j + 1), w = 0.5 * (dist0(a, b) + dist0(c, id(i + 1, j + 1)));
      net.edge(a, c, w / dist0(a, c));
    }
    const lc = dist0(a, b);
    if (j === NR) {
      const Ro = radiusAt(angles[i]);
      const span = 2 * Ro * Math.sin(Math.PI / tipsN.length);
      net.edge(a, b, (span * 0.42) / lc);
    } else if (j > 0) {
      const dr = dist0(a, id(i, Math.min(NR, j + 1)));
      net.edge(a, b, (HOOP * dr) / lc);
    }
  }
  // pins: the crown curve, star points
  for (let i = 0; i < NS; i++) { const k = id(i, 0); net.fixed[k] = 1; }
  const mastPos = masts === 1 ? [V3(0, 0, 0)] : [V3(-xm, 0, 0), V3(xm, 0, 0)];
  const tipInfo = [];
  for (let k = 0; k < tipsN.length; k++) {
    const i = k * Mseg, a = angles[i], d = dirOf(a), Ro = radiusAt(a);
    const top = d.clone().multiplyScalar(Ro + 0.12).setY(Hp);
    net.pin(id(i, NR), d.x * Ro, Hp - 0.06, d.z * Ro);
    tipInfo.push({ a, d, Ro, top });
  }
  // canvas self weight (~0.6 kg/m2 against ~1.5 kN/m pretension), per node tributary area
  for (let j = 1; j < NR; j++) for (let i = 0; i < NS; i++) {
    const a = id(i, j), area = dist0(a, id(i + 1, j)) * dist0(a, id(i, j + 1));
    net.addLoad(a, 0, -0.004 * area, 0);
  }
  net.solve({ iters: 1800, omega: 1.9 });

  // ---- cloth geometry -------------------------------------------------------------------------
  const rows = [];
  for (let j = 0; j <= NR; j++) { const r = []; for (let i = 0; i <= NS; i++) r.push(net.get(id(i, j))); rows.push(r); }
  const uv1 = print ? (() => {
    const a = new Float32Array((NS + 1) * (NR + 1) * 2); let k = 0;
    const ext = Math.max(A, B) * 1.02;
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NS; i++) { const q = rows[j][i]; a[k++] = 0.5 + q.x / (2 * ext); a[k++] = 0.5 - q.z / (2 * ext); }
    return a;
  })() : null;
  const clothGeo = K.gridGeometry(rows, { closedU: true, uv1 });
  if (print) { const m = new THREE.Mesh(clothGeo, fab); m.castShadow = true; m.receiveShadow = true; group.add(m); } else bins.add(fab, clothGeo);
  // ridge cap over the slot between two masts (double-mast tents)
  if (masts === 2) {
    const rp = [];
    for (let k = 0; k <= 40; k++) { const x = -xm + (2 * xm * k) / 40, t = Math.abs(x) / xm; rp.push(V3(x, Hc - 0.03 - ridgeSag * (1 - t * t) + 0.01, 0)); }
    bins.add(baseFab, K.sweep(rp, 0.045, 12, { rFn: (i, a) => 0.045 * (Math.sin(a) > 0 ? 1 : 0.5) }));
  }
  // kedder hem along the free edge
  const edge = rows[NR].map((q) => q.clone());
  bins.add(baseFab, K.sweep(edge, 0.014, 8));

  // ---- masts ------------------------------------------------------------------------------
  for (const mp of mastPos) {
    const mr = masts === 2 ? 0.05 : 0.045;
    bins.add(alu, G.tube(V3(mp.x, 0.02, mp.z), V3(mp.x, Hc + 0.04, mp.z), mr, 28));
    bins.add(steel, K.footPlate(mp.x, mp.z, 0.3, 0.012));
    // top cap: crown ring and pin with a domed cap above the cloth
    const cap = G.lathe([[0.0001, 0.17], [0.06, 0.165], [0.1, 0.14], [0.13, 0.1], [r0 * 0.98 + 0.01, 0.06], [r0 + 0.02, 0.03], [r0 + 0.02, 0.0]].map(([r, y]) => [r, y]).reverse(), 40);
    cap.translate(mp.x, Hc - 0.02, mp.z);
    bins.add(capM, cap);
    // mast base: bracket with a winch strap
    bins.add(steel, G.tube(V3(mp.x, 0.012, mp.z), V3(mp.x, 0.18, mp.z), mr * 1.25, 24));
  }

  // ---- perimeter poles, guys, stakes ---------------------------------------------------------
  for (const t of tipInfo) {
    const top = t.top.clone();
    const foot = top.clone().addScaledVector(t.d, -0.32).setY(0);
    bins.add(alu, G.tube(foot.clone().setY(0.012), top, 0.03, 18));
    bins.add(steel, G.tube(top.clone(), top.clone().add(V3(0, 0.1, 0)), 0.009, 10, { caps: true }));
    bins.add(steel, K.footPlate(foot.x, foot.z, 0.12, 0.01));
    const stake = top.clone().setY(0).addScaledVector(t.d, Hp * 0.36 + 0.25);
    bins.add(ropeM, K.rope(top.clone().add(V3(0, 0.03, 0)), stake.clone().setY(0.1), 0.006, 0.006));
    bins.add(steel, K.stakeGeo(stake, t.d.clone().negate(), { len: 0.12, r: 0.011 }));
  }

  // ---- side walls (hung from a rope between the pole tops) ---------------------------------------
  const walls = p.walls ? String(p.walls) : null;
  if (walls && walls !== 'none') {
    const win = walls === 'panorama' || walls === 'windows';
    const clear = M.pvcWindow();
    const thread = M.tentThread(hex);
    for (let k = 0; k < tipInfo.length; k++) {
      const a = tipInfo[k], b = tipInfo[(k + 1) % tipInfo.length];
      const pa = a.d.clone().multiplyScalar(a.Ro + 0.02), pb = b.d.clone().multiplyScalar(b.Ro + 0.02);
      const len = pa.distanceTo(pb);
      const along = pb.clone().sub(pa).normalize();
      const inward = V3(-along.z, 0, along.x);
      if (inward.dot(pa.clone().add(pb)) > 0) inward.negate(); // points to the centre
      const yTop = Hp - 0.12;
      const lace = Math.max(4, Math.round(len / 0.45));
      const ph = k * 1.9;
      const P = (s, y) => {
        // the rope sags; the top hem is laced to it (scallops between the lacing points); the cloth
        // bellies in, hangs in soft irregular vertical folds that grow towards the hem, and the hem
        // rests on the floor with a little kick
        const ropeSag = 0.05 * 4 * s * (1 - s);
        const top = yTop - ropeSag;
        const yy = Math.min(y, top);
        const f = yy / top, lo = 1 - f;
        const sc = 0.012 * Math.abs(Math.sin(Math.PI * s * lace)) * Math.exp(-lo * 12);
        const x = s * len;
        const belly = 0.05 * Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, f * 0.9 + 0.1));
        const fold = (0.016 * Math.sin(x * 3.1 + ph) + 0.01 * Math.sin(x * 7.3 + 1.3 + ph) + 0.005 * Math.sin(x * 14.9 + ph * 2)) * (0.25 + lo) * Math.sin(Math.PI * Math.min(1, s * 1.08 + 0.01));
        const kick = yy < 0.05 ? (0.05 - yy) * 0.6 : 0;
        return pa.clone().lerp(pb, s).addScaledVector(inward, belly + fold - kick).setY(Math.max(0.003, yy - sc));
      };
      const ny = 30, nx = Math.max(16, Math.round(len * 14));
      const part = (s0, s1, y0, y1, mat, printV = null) => {
        const rowsW = [];
        for (let j = 0; j <= ny; j++) { const r = []; for (let i = 0; i <= nx; i++) { const s = s0 + (s1 - s0) * (i / nx), y = y0 + (y1 - y0) * (j / ny); r.push(P(s, y)); } rowsW.push(r); }
        if (wallPrintMat && printV) {
          // uv1: u along the panel, v up the printed band (the hem at 0); the panel is seen from outside
          const uv = new Float32Array((nx + 1) * (ny + 1) * 2); let m = 0;
          for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const sx = s0 + (s1 - s0) * (i / nx), y = y0 + (y1 - y0) * (j / ny); uv[m++] = 1 - sx; uv[m++] = Math.min(1, Math.max(0, (y - printV[0]) / (printV[1] - printV[0]))); }
          K.addMesh(group, K.gridGeometry(rowsW, { uv1: uv }), wallPrintMat);
        } else bins.add(mat, K.gridGeometry(rowsW));
      };
      const topAt = yTop - 0.05;
      const tapeM = K.pvcPatch(hex);
      if (win) {
        const m = 0.32 / len, w0 = 0.95, w1 = 1.85;
        part(0, 1, 0, w0, wallFab, [0.02, w0 - 0.02]);
        part(0, 1, w1, topAt + 0.06, wallFab);
        part(0, m, w0, w1, wallFab);
        part(1 - m, 1, w0, w1, wallFab);
        part(m, 1 - m, w0, w1, clear);
        // welded border tape round the window
        const brd = [];
        for (const [s1, y1] of [[m, w0], [1 - m, w0], [1 - m, w1], [m, w1], [m, w0]]) brd.push([s1, y1]);
        const dense = [];
        for (let q = 0; q < brd.length - 1; q++) for (let t = 0; t < 24; t++) { const [sa, ya] = brd[q], [sb, yb] = brd[q + 1]; dense.push(P(sa + (sb - sa) * t / 24, ya + (yb - ya) * t / 24).addScaledVector(inward, -0.003)); }
        dense.push(dense[0].clone());
        bins.add(tapeM, T2.bandAlong(dense, dense.map(() => inward.clone().negate()), 0.035, 0.0015));
      } else part(0, 1, 0, topAt + 0.06, wallFab, [0.05, topAt]);
      // lacing loops at the top hem, a folded hem at the bottom, zips down both ends
      for (let q = 0; q <= lace; q++) {
        const s0 = q / lace, pt = P(s0, topAt + 0.05);
        const ring = new THREE.TorusGeometry(0.012, 0.003, 6, 14); ring.lookAt(inward); ring.translate(pt.x, pt.y, pt.z); bins.add(steel, ring);
      }
      bins.add(wallFab, K.sweep(Array.from({ length: 41 }, (_, i) => P(i / 40, 0.008).addScaledVector(inward, -0.002)), 0.006, 5));
      for (const s0 of [0.004, 0.996]) bins.add(M.zipTooth('#1B1B1C'), K.sweep(Array.from({ length: 13 }, (_, i) => P(s0, 0.03 + (topAt - 0.05) * i / 12).addScaledVector(inward, -0.004)), 0.005, 5));
      // perimeter rope between pole tops
      bins.add(ropeM, K.rope(a.top.clone().add(V3(0, -0.1, 0)), b.top.clone().add(V3(0, -0.1, 0)), 0.005, 0.012));
    }
  }

  bins.build(group);
  return {
    object: group,
    detail: { target: [0, Hc - 0.5, 0], size: 2.2, azimuth: 30, elevation: 5 },
    // white canvas: the big sail is mostly turned away from the softbox, so it gets a brighter
    // exposure than an easy-up roof (lit canvas ~240-248, not light grey against the Linnen)
    rig: { default: { ...T2.tentRig2(hex, { walled: !!walls, print: !!print }), ...(K.lumOf(hex) > 0.7 && !print ? { exposure: 0.86 } : {}) } },
    meta: { Dm, N, masts, Hc, Hp },
  };
}
