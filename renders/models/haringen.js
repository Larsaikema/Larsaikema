// Haringen (tent pegs).
//
// { count, length, type }
//   type 'hoekijzer' (default for length >= 0.4): long peg of hot-dip galvanised angle iron
//        30 x 30 x 3 mm, flanges cut to a point over the last 7 cm, a 10 mm round bar welded
//        along the corner at the head and bent into an open hook (for a strap, rope or the
//        foot plate); lengths 0.5 / 0.75 / 1.0 m
//   type 'wand' (default below 0.4 m): 18-30 cm galvanised wire peg with a bent hook and a
//        red moulded stopper
// A set lies as a tidy flat-lay: angle irons on their two flange edges (corner up, hook up),
// slightly fanned and staggered.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// L-profile (corner at the origin, flanges along +x and +y, thickness t) with duplicated
// corner points so every face keeps a crisp edge; scale k shortens the flanges (tip cut).
function angleProfile(w, t, rr = 0.0012) {
  const P = [];
  const add = (x, y) => P.push([x, y]);
  // outer edge of flange x (bottom face), out to the rolled edge, back along the top face
  add(0, 0); add(w - rr, 0); add(w - rr, 0);
  for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + (i / 4) * Math.PI; add(w - rr + Math.cos(a) * rr * 0.9, t / 2 + Math.sin(a) * t / 2); }
  add(w - rr, t); add(w - rr, t);
  // inner root fillet
  const rf = 0.003;
  add(t + rf, t); add(t + rf, t);
  for (let i = 1; i < 4; i++) { const a = -Math.PI / 2 - (i / 4) * (Math.PI / 2); add(t + rf + Math.cos(a) * rf, t + rf + Math.sin(a) * rf); }
  add(t, t + rf); add(t, t + rf);
  add(t, w - rr); add(t, w - rr);
  for (let i = 0; i <= 4; i++) { const a = (i / 4) * Math.PI; add(t / 2 + Math.cos(a) * t / 2, w - rr + Math.sin(a) * rr * 0.9); }
  add(0, w - rr); add(0, w - rr);
  add(0, 0);
  return P;
}

function angleIronPeg(bins, mat, { L, w = 0.03, t = 0.003, seed = 1 }) {
  // along +Z from z = 0 (head) to z = L (tip), lying on one flange (flange x flat on the
  // floor, flange y standing up), so the L reads; both flanges are cut to a point at the tip
  const prof = angleProfile(w, t);
  const ns = 70, tipLen = 0.075;
  const zs = [];
  for (let i = 0; i <= ns; i++) { const s = i / ns; zs.push(s < 0.5 ? s * 2 * (L - tipLen) : (L - tipLen) + (s - 0.5) * 2 * tipLen); }
  const rows = zs.map((z) => {
    const k = z > L - tipLen ? Math.max(0.05, 1 - (z - (L - tipLen)) / tipLen) : 1;
    return prof.map(([x, y]) => V3(x > t ? t + (x - t) * k : x, y > t ? t + (y - t) * k : y, z));
  });
  bins.add(mat, K.gridGeometry(rows, { closedU: false, flip: true }));
  // saw-cut head face
  const cap = new THREE.Shape();
  prof.forEach(([x, y], i) => { if (i === 0) cap.moveTo(x, y); else cap.lineTo(x, y); });
  const cg = new THREE.ShapeGeometry(cap); bins.add(mat, cg);
  const tc = new THREE.ShapeGeometry(cap); tc.scale(0.05, 0.05, 1); tc.translate(t * 0.95, t * 0.95, L); bins.add(mat, tc);
  return { yMin: 0 };
}

// lumpy weld bead (galvanised over) along a polyline, sitting in the corner given by normals
function bead(bins, mat, pts, nrm, seed, { w = 0.0022, h = 0.0016 } = {}) {
  const nz = makeNoise2(seed);
  const prof = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; prof.push([Math.cos(a) * w, Math.sin(a) * h]); }
  bins.add(mat, K.sweep(pts, prof, { normals: nrm, scale: (i) => { const e = Math.min(1, i / 3, (pts.length - 1 - i) / 3); return [1, Math.max(0.2, e) * (0.8 + 0.35 * (0.5 + 0.5 * nz.noise(i * 0.7, 3.3)))]; } }));
}

export function haringen(p = {}) {
  const n = Number(p.count ?? 3);
  const len = Number(p.length ?? 0.75);
  const type = p.type || (len >= 0.4 ? 'hoekijzer' : 'wand');
  const bins = new G.PartBin();
  const extras = [];
  if (type === 'hoekijzer') {
    const galv = SG.galvSG({ cell: 0.006, dull: 0.4 });
    const w = 0.03, t = 0.003;
    for (let i = 0; i < n; i++) {
      const sub = new G.PartBin();
      angleIronPeg(sub, galv, { L: len, w, t, seed: i });
      // welded hook: 10 mm round bar in the inner corner at the head, out past the head and
      // bent up and over into an open hook that turns back towards the tip
      const rb = 0.005;
      const xc = t + rb, yc = t + rb;
      const pts = [];
      const zW0 = 0.085;
      for (let k = 0; k <= 12; k++) pts.push(V3(xc, yc, zW0 - (zW0 + 0.006) * (k / 12)));
      const R = 0.021;
      const c = V3(xc, yc + R, -0.006);
      for (let k = 1; k <= 30; k++) { const a = -Math.PI / 2 - (k / 30) * Math.PI * 1.3; pts.push(V3(xc, c.y + Math.sin(a) * R, c.z + Math.cos(a) * R)); }
      const last = pts[pts.length - 1], dir = last.clone().sub(pts[pts.length - 2]).normalize();
      for (let k = 1; k <= 3; k++) pts.push(last.clone().addScaledVector(dir, 0.004 * k));
      sub.add(galv, K.tubeAlong(pts, rb, 16));
      // fillet welds bar <-> floor flange and bar <-> standing flange
      const wl = [], wn1 = [], wl2 = [], wn2 = [];
      for (let k = 0; k <= 24; k++) {
        const z = 0.004 + (zW0 - 0.012) * (k / 24);
        wl.push(V3(xc + rb * 0.85, t + 0.0003, z)); wn1.push(V3(0.7, 0.7, 0).normalize());
        wl2.push(V3(t + 0.0003, yc + rb * 0.85, z)); wn2.push(V3(0.7, 0.7, 0).normalize());
      }
      bead(sub, galv, wl, wn1, 11 + i);
      bead(sub, galv, wl2, wn2, 23 + i);
      // place: parallel, slightly staggered and fanned
      const yaw = (i - (n - 1) / 2) * 3 * DEG;
      const x = (i - (n - 1) / 2) * 0.062, z = ((i % 2) * 0.03) - len / 2;
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
      for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(m); bins.add(mat, geo); }
    }
    const g = K.finish(bins, `haringen hoekijzer ${n}x${len}`, extras);
    // heads (with the hooks and the L-shaped saw cuts) towards the camera, running diagonally
    g.rotation.y = 172 * DEG;
    const root = new THREE.Group(); root.add(g);
    return {
      object: root,
      detail: { target: [0, 0.03, len / 2], size: 0.22, azimuth: 20, elevation: 24 },
      view: { hero: { elevation: 30, azimuth: 34 } },
      rig: { default: { envIntensity: 1.1, contact: { strength: 0.9, h0: 0.004, res: 1024, blur: 1.1 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
      meta: { type, n, len },
    };
  }
  // wire pegs with hook + red stopper, laid in a fan
  const galv = M.galvanised();
  const cap = M.nylon('#C7372E');
  const wr = 0.0032;
  for (let i = 0; i < n; i++) {
    const a = (-24 + (48 * i) / Math.max(1, n - 1)) * DEG;
    const dir = V3(Math.sin(a), 0, -Math.cos(a));
    const base = V3((i - (n - 1) / 2) * 0.014, 0, 0.1);
    const pts = [];
    // hook (in the vertical plane through the shaft), then the straight shaft to the tip
    const R = 0.012;
    for (let k = 0; k <= 16; k++) { const t = Math.PI * 1.1 * (1 - k / 16); pts.push(base.clone().addScaledVector(dir, -R + R * Math.cos(t)).setY(wr + R * Math.sin(t))); }
    for (let k = 1; k <= 20; k++) pts.push(base.clone().addScaledVector(dir, (len - 0.01) * (k / 20)).setY(wr));
    bins.add(galv, K.tubeAlong(pts, wr, 10, { scale: (j) => (j > pts.length - 4 ? Math.max(0.2, (pts.length - 1 - j) / 3) : 1) }));
    bins.add(cap, G.tube(base.clone().addScaledVector(dir, 0.012).setY(wr), base.clone().addScaledVector(dir, 0.04).setY(wr), 0.0062, 14));
  }
  const g = K.finish(bins, `haringen wand ${n}`);
  return { object: g, detail: { target: [0, 0.01, 0], size: 0.2, azimuth: 20, elevation: 40 }, view: { hero: { elevation: 38 } }, meta: { type, n, len } };
}
