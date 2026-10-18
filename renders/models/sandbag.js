// Zandzakken voor partytent (set of fillable sand bags for tent legs).
//
// { count, color, filled }
// Each bag: two panels of PVC-coated 600D polyester (52 x 27 cm flat) sewn together round the
// edge with a welt seam, filled 3/4 with ~10 kg sand. Filled, the sand settles: the bottom
// panel flattens on the floor, the sides bulge out to the seam, the top is a soft dome; the
// middles of the edges are pulled in by the fill while the corners stay out as flat "dog
// ears"; tension folds run from the corners into the bag and the cloth wrinkles where it is
// gathered along the seam. On top: a fill opening with a zip under a stitched flap (zip
// puller out at one end); on one long seam two 5 cm hook-and-loop straps that wrap round the
// leg (shown lying open on the floor, hook side up); a webbing grab loop at one end.
// `filled: false` shows the bags flat.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;

function bag(bins, mats, { a0 = 0.26, b0 = 0.135, Hm = 0.115, seed = 1, filled = true }) {
  const nz = makeNoise2(seed);
  const Hmax = filled ? Hm : 0.008;
  const f = (t, p = 2.6, q = 0.62) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), p)), q);
  // thickness of the fill over the flat panel domain (u, v) in [-1, 1]^2, lumpy sand
  const thick = (u, v) => {
    const base = f(u, 3.2, 0.55) * f(v, 2.4, 0.6);
    const lump = 1 + 0.05 * nz.fbm(u * 2.2 + seed, v * 2.2, 2) * base;
    // sand slumps towards one long side a little
    return Hmax * base * lump * (1 + 0.06 * v);
  };
  const pullX = 0.11, pullZ = 0.2;
  const plan = (u, v) => {
    // the fill pulls the middles of the edges in; corners stay out (dog ears)
    const T = thick(u, v) / Math.max(1e-6, Hmax);
    return [a0 * u * (1 - pullX * (1 - v * v) * (filled ? 1 : 0)) * (1 - 0.04 * T), b0 * v * (1 - pullZ * (1 - u * u) * (filled ? 1 : 0)) * (1 - 0.05 * T)];
  };
  // seam height: ~40 % of the fill in the middle of the edges, dropping to the floor at the
  // corners (the dog ears lie down)
  const ysF = (u, v) => 0.003 + (Hmax * 0.4 + 0.002) * Math.pow(1 - Math.pow(Math.abs(u), 3) * Math.pow(Math.abs(v), 3), 1.5);
  // wrinkles on the top panel, in panel metres
  const fams = [];
  for (const [cu, cv] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const ang = Math.atan2(-cv * b0, -cu * a0);
    fams.push({ n: 3, u: [cu * a0 * 0.78, cu * a0 * 0.9], v: [cv * b0 * 0.62, cv * b0 * 0.85], ang, angJ: 0.35, len: [0.07, 0.15], wid: [0.012, 0.022], amp: [0.002, 0.004], sharp: 0.45, sign: 1 });
  }
  fams.push({ n: 10, u: [-a0 * 0.85, a0 * 0.85], v: [-b0 * 0.9, b0 * 0.9], ang: Math.PI / 2, angJ: 0.4, len: [0.03, 0.08], wid: [0.007, 0.014], amp: [0.0008, 0.002], sharp: 0.5 });
  const crT = SG.creases(seed * 7 + 3, fams);
  const crB = SG.creases(seed * 7 + 5, [{ n: 26, u: [-a0, a0], v: [-b0, b0], ang: 0, angJ: 1.6, len: [0.02, 0.06], wid: [0.006, 0.012], amp: [0.001, 0.0025], sharp: 0.5 }]);
  const top = (u, v) => {
    const [x, z] = plan(u, v); const T = thick(u, v);
    const edgeK = 1 - Math.pow(Math.max(Math.abs(u), Math.abs(v)), 6);
    return V3(x, ysF(u, v) + T * 0.62 + crT(a0 * u, b0 * v) * (0.35 + 0.65 * edgeK) * (filled ? 1 : 0.3), z);
  };
  const bot = (u, v) => {
    const [x, z] = plan(u, v); const T = thick(u, v);
    // seam -> bulge out -> floor: the bottom panel bulges out below the seam before tucking under
    const out = 1 + 0.035 * Math.sin(Math.PI * Math.min(1, (1 - Math.max(Math.abs(u), Math.abs(v))) * 5)) * (filled ? 1 : 0);
    const ys = ysF(u, v);
    const y = Math.max(0.0015, ys - T * 0.5) + crB(a0 * u, b0 * v) * Math.min(1, (ys - T * 0.5 > 0.002 ? 1 : 0.15));
    return V3(x * out, y, z * out);
  };
  const N = 84, Mv = 52;
  const grid = (fn, flip) => {
    const rows = [];
    for (let j = 0; j <= Mv; j++) { const v = -1 + 2 * (j / Mv); const row = []; for (let i = 0; i <= N; i++) row.push(fn(-1 + 2 * (i / N), v)); rows.push(row); }
    return K.gridGeometry(rows, { closedU: false, flip });
  };
  bins.add(mats.fab, grid(top, false));
  bins.add(mats.fab, grid(bot, true));
  // welt seam round the edge + stitch row on the top panel
  const ring = (fn, inset) => {
    const pts = [];
    const side = (u0, v0, u1, v1, n) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push(fn(u0 + (u1 - u0) * t, v0 + (v1 - v0) * t)); } };
    const e = 1 - inset;
    side(-e, -e, e, -e, 60); side(e, -e, e, e, 34); side(e, e, -e, e, 60); side(-e, e, -e, -e, 34);
    pts.push(pts[0].clone());
    return pts;
  };
  const seam = ring((u, v) => { const p = top(u, v); return p.add(V3(0, 0.0005, 0)); }, 0);
  bins.add(mats.fab, K.tubeAlong(seam, 0.0036, 10, { closed: false }));
  const st = ring((u, v) => top(u, v), 0.045);
  const stN = st.map((q, i) => V3(0, 1, 0));
  bins.add(mats.thr, SG.stitches(st.map((q) => q.clone().add(V3(0, 0.0006, 0))), stN, { len: 0.0034, gap: 0.0016 }));
  // fill opening: zip under a 5 cm flap along the top, a little off-centre
  const vz = -0.32;
  const flap = [], flapN = [];
  for (let i = 0; i <= 50; i++) {
    const u = -0.62 + 1.24 * (i / 50);
    const p = top(u, vz), e = 0.01;
    const n = V3().crossVectors(top(u, vz + e).sub(top(u, vz - e)), top(u + e, vz).sub(top(u - e, vz))).normalize();
    if (n.y < 0) n.negate();
    flap.push(p.addScaledVector(n, 0.002)); flapN.push(n);
  }
  bins.add(mats.fab, K.strapAlong(flap, 0.05, 0.0024, { normals: flapN }));
  for (const off of [0.019, -0.019]) {
    const pts = flap.map((q, i) => { const T = flap[Math.min(flap.length - 1, i + 1)].clone().sub(flap[Math.max(0, i - 1)]).normalize(); const B = V3().crossVectors(T, flapN[i]).normalize(); return q.clone().addScaledVector(B, off).addScaledVector(flapN[i], 0.0016); });
    bins.add(mats.thr, SG.stitches(pts, flapN, { len: 0.0034, gap: 0.0016 }));
  }
  // zip end + slider + puller poking out at the +u end of the flap
  {
    const q = flap[flap.length - 1], n = flapN[flapN.length - 1];
    const T = flap[flap.length - 1].clone().sub(flap[flap.length - 3]).normalize();
    const B = V3().crossVectors(T, n).normalize();
    const c = q.clone().addScaledVector(T, 0.012).addScaledVector(n, -0.0008);
    const body = G.roundedBox(0.016, 0.0075, 0.028, 0.003); body.applyMatrix4(K.basisAt(c, B, n, T)); bins.add(mats.slider, body);
    const pull = G.roundedBox(0.011, 0.0035, 0.04, 0.0017); pull.applyMatrix4(K.basisAt(c.clone().addScaledVector(T, 0.03).addScaledVector(n, -0.003), B, n, T)); bins.add(mats.puller, pull);
    const ch = G.roundedBox(0.008, 0.0028, 0.03, 0.001); ch.applyMatrix4(K.basisAt(q.clone().addScaledVector(T, -0.008).addScaledVector(n, -0.0006), B, n, T)); bins.add(mats.tooth, ch);
  }
  // webbing grab loop on the -u end seam
  {
    const e = top(-1, 0);
    const loop = K.smoothPath([e.clone().add(V3(0.012, 0.004, -0.02)), e.clone().add(V3(-0.012, 0.006, -0.018)), e.clone().add(V3(-0.03, 0.002, 0)), e.clone().add(V3(-0.012, 0.006, 0.018)), e.clone().add(V3(0.012, 0.004, 0.02))], 36);
    bins.add(mats.web, K.strapAlong(loop, 0.025, 0.0024, { up: V3(0, 1, 0) }));
  }
  // two hook-and-loop straps from the +v (front) seam, lying open on the floor, hook side up
  for (const u of [-0.45, 0.45]) {
    const e = top(u, 1);
    const pts = K.smoothPath([e.clone().add(V3(0, 0.002, -0.012)), e.clone().add(V3(0, 0.001, 0.006)), V3(e.x, e.y * 0.55, e.z + 0.02), V3(e.x + 0.004, 0.006, e.z + 0.05), V3(e.x + 0.008, 0.0018, e.z + 0.1), V3(e.x + 0.012, 0.0018, e.z + 0.2)], 60);
    const nrm = pts.map((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const T = b.clone().sub(a).normalize(); return V3(0, 1, 0).addScaledVector(T, -T.y).normalize(); });
    bins.add(mats.fab, K.strapAlong(pts, 0.05, 0.0022, { normals: nrm }));
    // hook pad on the outer half, stitched round
    const sub = pts.slice(34, 58), subN = nrm.slice(34, 58);
    bins.add(mats.hook, K.strapAlong(sub.map((q, i) => q.clone().addScaledVector(subN[i], 0.0018)), 0.042, 0.0016, { normals: subN }));
    for (const off of [0.0225, -0.0225]) {
      const sp = pts.map((q, i) => { const T = pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize(); const B = V3().crossVectors(T, nrm[i]).normalize(); return q.clone().addScaledVector(B, off).addScaledVector(nrm[i], 0.0013); });
      bins.add(mats.thr, SG.stitches(sp.slice(6), nrm.slice(6), { len: 0.0034, gap: 0.0016 }));
    }
  }
}

export function sandbag(p = {}) {
  const n = Number(p.count ?? 4);
  const filled = p.filled !== false;
  const hex = p.color && p.color !== 'zwart' ? M.resolveColor(p.color) : '#19191B';
  const mats = {
    fab: SG.fabric600(hex, { sheen: 0.75, rough: 0.56 }),
    hook: SG.hookTape('#1C1D1E'),
    web: M.webbing('#141516'),
    thr: SG.thread('#3A3B40'),
    slider: SG.castSG('#3C3F43', { metal: 1, rough: 0.38 }),
    puller: SG.moulded('#141516', { rough: 0.55 }),
    tooth: SG.moulded('#121314', { rough: 0.32, spec: 0.7 }),
  };
  const bins = new G.PartBin();
  // tidy 2 x 2 lay-out, straps of the front row towards the viewer, back row turned round
  const pitchX = 0.6, pitchZ = 0.32;
  for (let i = 0; i < n; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const sub = new G.PartBin();
    bag(sub, mats, { seed: 11 + i * 7, Hm: 0.112 - (i % 3) * 0.005, filled });
    const yaw = (row === 1 ? Math.PI : 0) + [0.04, -0.05, 0.03, -0.06][i % 4];
    const x = (col - 0.5) * pitchX + (row ? 0.025 : 0), z = (0.5 - row) * pitchZ - (row ? 0.0 : 0.02);
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(m); bins.add(mat, geo); }
  }
  const g = K.finish(bins, `sandbag ${n}`);
  return {
    object: g,
    detail: { target: [0.18, 0.06, 0.2], size: 0.4, azimuth: 30, elevation: 28 },
    view: { hero: { elevation: 24 } },
    rig: { default: { key: { intensity: 4.2 }, fill: { azimuth: 80, elevation: 14, intensity: 2.0 }, rim: { azimuth: 150, elevation: 32, intensity: 1.8 }, exposure: 1.3, envIntensity: 1.1, contact: { strength: 0.85, h0: 0.01, res: 1024, blur: 1.4 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
    meta: { n, filled },
  };
}
