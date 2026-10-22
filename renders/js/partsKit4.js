// Parts group, round 4 (22 October 2026): small hardware shared by the parts models that got new
// variants (stretchParts, haringen, lightParts, tubeFittings, concreteBlock, footCaps). New file:
// js/partsKit.js, js/softGoods.js and js/partsLook3.js keep their behaviour for everybody else.
//
// Every generator returns a list of [material, geometry] pairs (or adds to a PartBin) in a local
// frame documented per function; `placeParts` lays a list down centred on the floor.
//  - threadRings(): rolled thread as a stack of shallow rings (reads as thread at catalogue size)
//  - wireHook / sHook(): bent round bar (S-hooks, eye hooks), built with K.tubeAlong
//  - eyeBolt(), woodScrewEye(), wallPlug(): RVS eye bolt / screw eye, ribbed nylon plug
//  - turnbuckle(): open-body hook-eye turnbuckle (spanschroef)
//  - snapHook(): DIN 5299-C carabiner with a spring gate
//  - chain(): welded short-link chain lying on the floor along a path
//  - roundPeg(): round steel ground peg with a beaten head, cone tip and a welded ring
import * as THREE from 'three';
import * as G from './geom.js';
import * as K from './partsKit.js';
import { makeNoise2 } from './rng.js';

const V3 = G.V3;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------
// placement

// Rotate a PartBin's geometry by yaw (deg), rest it on the floor and centre it on (x, z).
// Returns the footprint box (after placement) for layouts.
export function placeBin(target, sub, { x = 0, z = 0, yaw = 0, lift = 0 } = {}) {
  const geos = []; for (const [, list] of sub.bins) geos.push(...list);
  const bb = new THREE.Box3();
  for (const g of geos) { g.rotateY(yaw * DEG); g.computeBoundingBox(); bb.union(g.boundingBox); }
  const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  for (const [mat, list] of sub.bins) for (const g of list) { g.translate(x - cx, -bb.min.y + lift, z - cz); target.add(mat, g); }
  return new THREE.Box3(V3(bb.min.x - cx + x, 0, bb.min.z - cz + z), V3(bb.max.x - cx + x, bb.max.y - bb.min.y, bb.max.z - cz + z));
}

// ---------------------------------------------------------------------------------------
// threads, bars

// rolled thread on a shank: rings along `dir` from point a, count n, pitch p, radius r
export function threadRings(bins, mat, a, dir, { r = 0.004, n = 20, pitch = 0.00125, tube = 0.00055 } = {}) {
  const d = dir.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), d);
  for (let k = 0; k < n; k++) {
    const t = new THREE.TorusGeometry(r, tube, 4, 18);
    t.applyQuaternion(q);
    const c = a.clone().addScaledVector(d, k * pitch);
    t.translate(c.x, c.y, c.z);
    bins.add(mat, t);
  }
}

// polyline from a list of segments: ['line', len] | ['arc', radius, angleDeg] in the XZ plane
// (turning left for positive angles), starting at origin heading +X. y = constant.
export function planarPath(segs, { y = 0, step = 0.002, start = V3(0, 0, 0), heading = 0 } = {}) {
  const pts = [start.clone().setY(y)];
  let p = start.clone().setY(y), h = heading * DEG;
  for (const s of segs) {
    if (s[0] === 'line') {
      const n = Math.max(1, Math.ceil(s[1] / step));
      for (let i = 1; i <= n; i++) pts.push(p.clone().add(V3(Math.cos(h), 0, -Math.sin(h)).multiplyScalar((s[1] * i) / n)));
      p = pts[pts.length - 1].clone();
    } else {
      const R = s[1], a = s[2] * DEG;
      const n = Math.max(2, Math.ceil((Math.abs(a) * R) / step));
      // centre to the left (positive a) or right
      const sg = Math.sign(a) || 1;
      const c = p.clone().add(V3(Math.cos(h + sg * Math.PI / 2), 0, -Math.sin(h + sg * Math.PI / 2)).multiplyScalar(R));
      const a0 = h - sg * Math.PI / 2;
      for (let i = 1; i <= n; i++) { const t = a0 + (a * i) / n; pts.push(c.clone().add(V3(Math.cos(t), 0, -Math.sin(t)).multiplyScalar(R))); }
      h += a; p = pts[pts.length - 1].clone();
    }
  }
  return pts;
}

// a bar along a path with rounded (cut + deburred) ends
export function bar(pts, r, radial = 16) {
  return K.tubeAlong(pts, r, radial, { scale: (i) => { const e = Math.min(1, (i + 0.35) / 1.2, (pts.length - 1 - i + 0.35) / 1.2); return 0.55 + 0.45 * Math.sqrt(Math.max(0, e)); } });
}

// S-hook from round bar d (m), overall length H, lying flat (plane XZ), centred at the origin
export function sHook(d = 0.01, H = 0.12, { open = 30 } = {}) {
  const r = d / 2;
  const R1 = H * 0.2, R2 = H * 0.18, mid = H - 2 * R1 - 2 * R2;
  // start at the tip of the upper hook, run round it, down the middle, round the lower hook
  const pts = planarPath([['arc', R1, 270 - open], ['line', Math.max(0.005, mid)], ['arc', R2, -(270 - open)]], { y: r, step: 0.0015, heading: 90 + open });
  const bb = new THREE.Box3().setFromPoints(pts);
  const c = bb.getCenter(V3()); for (const p of pts) { p.x -= c.x; p.z -= c.z; }
  return bar(pts, r, 16);
}

// ---------------------------------------------------------------------------------------
// eye bolts, screws, plugs (local: axis +X, eye at x < 0, the shank towards +X; lying flat in
// the XZ plane with the eye flat on the floor, y = 0 at the floor)

export function eyeBolt(bins, mats, { R = 0.0095, d = 0.007, shank = 0.035, thread = 0.008, screw = false } = {}) {
  const r = d / 2;
  const yc = Math.max(r, thread / 2);
  // eye: torus in the floor plane, its gap closed by the forged neck
  const eye = new THREE.TorusGeometry(R, r, 14, 48);
  eye.rotateX(Math.PI / 2); eye.translate(-R - r * 0.6, yc, 0); bins.add(mats.metal, eye);
  // neck / collar
  bins.add(mats.metal, K.lathe([[0.0001, 0], [thread / 2 + 0.0018, 0], [thread / 2 + 0.0022, 0.003], [thread / 2 + 0.0012, 0.0055], [thread / 2, 0.0065], [0.0001, 0.0065]], 24).rotateZ(-Math.PI / 2).translate(-0.0005, yc, 0));
  const tr = thread / 2;
  if (!screw) {
    bins.add(mats.metal, G.tube(V3(0.006, yc, 0), V3(shank, yc, 0), tr * 0.88, 16));
    threadRings(bins, mats.metal, V3(0.008, yc, 0), V3(1, 0, 0), { r: tr * 0.88, n: Math.floor((shank - 0.01) / 0.00125), pitch: 0.00125, tube: tr * 0.14 });
    bins.add(mats.metal, K.lathe([[0.0001, 0], [tr * 0.88, 0], [tr * 0.98, 0.001], [tr * 0.6, 0.002], [0.0001, 0.002]].reverse(), 16).rotateZ(-Math.PI / 2).translate(shank, yc, 0));
  } else {
    // wood / plug screw: tapering core, a sharp helical thread, gimlet point
    const L = shank;
    const core = (x) => tr * 0.62 * (x < L - 0.012 ? 1 : Math.max(0.08, (L - x) / 0.012));
    const prof = [[0.0001, 0.006]]; for (let i = 0; i <= 20; i++) { const x = 0.006 + (L - 0.006) * (i / 20); prof.push([core(x), x]); } prof.push([0.0001, L]);
    bins.add(mats.metal, K.lathe(prof, 18).rotateZ(-Math.PI / 2).translate(0, yc, 0));
    const pts = [];
    const pitch = 0.0028, turns = (L - 0.012) / pitch;
    for (let i = 0; i <= turns * 24; i++) {
      const t = i / 24, x = 0.009 + t * pitch, a = t * TAU;
      const rr = core(x) + tr * 0.32 * Math.min(1, (L - x) / 0.006);
      pts.push(V3(x, yc + Math.cos(a) * rr, Math.sin(a) * rr));
    }
    bins.add(mats.metal, K.sweep(pts, [[0, 0.0007], [-0.0004, -0.0003], [0.0004, -0.0003]], { up: V3(1, 0, 0) }));
  }
  return { length: shank + 2 * R + d, yc };
}

// ribbed nylon wall plug (Ø 10 x 50 mm): collar, anti-rotation fins, split expansion legs.
// Local: axis +X from x = 0 (collar) to x = L, lying on the floor.
export function wallPlug(bins, mat, { D = 0.01, L = 0.05 } = {}) {
  const r = D / 2;
  const prof = [[0.0001, 0], [r * 1.25, 0], [r * 1.25, 0.0018], [r * 0.95, 0.0024]];
  for (let k = 0; k < 9; k++) { const x0 = 0.006 + k * (L - 0.012) / 9; prof.push([r * 0.86, x0], [r * 1.02, x0 + 0.0028], [r * 0.86, x0 + 0.0031]); }
  prof.push([r * 0.7, L - 0.002], [r * 0.5, L], [0.0001, L]);
  bins.add(mat, K.lathe(prof, 28).rotateZ(-Math.PI / 2).translate(0, r * 1.25, 0));
  // anti-rotation fins
  for (const s of [-1, 1]) { const f = G.roundedBox(0.012, 0.0018, 0.0024, 0.0006); f.translate(0.012, r * 1.25 + s * 0.0, s * (r + 0.0006)); bins.add(mat, f); }
  // expansion slot (dark) along the legs
  const dark = K.cached('pk4-slot', () => new THREE.MeshStandardMaterial({ color: '#2A2824', roughness: 0.9, name: 'plug slot' }));
  const sl = G.roundedBox(L * 0.55, 0.0009, 0.0012, 0.0003); sl.translate(L * 0.66, r * 2.2, 0); bins.add(dark, sl);
}

// open-body turnbuckle, hook + eye, lying flat along +X centred at the origin (M8 RVS)
export function turnbuckle(bins, mats, { M = 0.008, body = 0.11 } = {}) {
  const r = M / 2, yc = r + 0.0035;
  const half = body / 2;
  // two threaded end bosses joined by two side bars (flat-lay: side bars in the floor plane)
  for (const s of [-1, 1]) {
    bins.add(mats.metal, K.lathe([[0.0001, 0], [r + 0.0032, 0], [r + 0.0038, 0.0015], [r + 0.0038, 0.011], [r + 0.0032, 0.0125], [0.0001, 0.0125]], 24).rotateZ(-Math.PI / 2).translate(s > 0 ? half - 0.0125 : -half, yc, 0));
  }
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30, x = -half + 0.008 + (body - 0.016) * t; const bow = Math.sin(Math.PI * t); pts.push(V3(x, yc, s * (r + 0.004 + 0.007 * Math.pow(bow, 0.5)))); }
    bins.add(mats.metal, bar(pts, 0.0032, 14));
  }
  // threaded rods out of both ends
  for (const s of [-1, 1]) {
    const a = V3(s * (half - 0.004), yc, 0), b = V3(s * (half + 0.03), yc, 0);
    bins.add(mats.metal, G.tube(a, b, r * 0.86, 16));
    threadRings(bins, mats.metal, V3(s * (half + 0.001), yc, 0), V3(s, 0, 0), { r: r * 0.86, n: 20, pitch: 0.00125, tube: r * 0.12 });
  }
  // eye end (left): forged eye in the floor plane
  const eyeR = 0.011, er = r * 0.95;
  const eye = new THREE.TorusGeometry(eyeR, er, 14, 48); eye.rotateX(Math.PI / 2); eye.translate(-(half + 0.03 + eyeR + er * 0.4), yc, 0); bins.add(mats.metal, eye);
  // hook end (right): open hook curling round to the side
  const hp = planarPath([['line', 0.006], ['arc', 0.013, 200], ['line', 0.006]], { y: yc, step: 0.0012, start: V3(half + 0.03, 0, 0), heading: 0 });
  bins.add(mats.metal, bar(hp, er, 16));
  return { length: body + 2 * 0.03 + 2 * eyeR + 0.02 };
}

// DIN 5299-C snap hook (karabijnhaak), lying flat along +X, eye end at x = 0, d = wire size
export function snapHook(bins, mats, { L = 0.08, d = 0.008 } = {}) {
  const r = d / 2, yc = r;
  const W = L * 0.42;
  // body: straight back (z = -W/2), round nose at +X, round eye at -X, the gate side open
  const pts = [];
  const nose = V3(L - W / 2, yc, 0), eyeC = V3(W * 0.42, yc, 0);
  // from the gate hinge (on the eye side, +z) round the eye, along the back, round the nose to the hook tip
  for (let i = 0; i <= 30; i++) { const a = Math.PI / 2 + (i / 30) * Math.PI; pts.push(V3(eyeC.x + Math.cos(a) * W * 0.42, yc, Math.sin(a) * W * 0.42)); }
  const back0 = pts[pts.length - 1].clone();
  for (let i = 1; i <= 16; i++) pts.push(V3(back0.x + (nose.x - back0.x) * (i / 16), yc, back0.z + ((-W / 2) - back0.z) * (i / 16)));
  for (let i = 1; i <= 30; i++) { const a = -Math.PI / 2 + (i / 30) * Math.PI * 0.92; pts.push(V3(nose.x + Math.cos(a) * W / 2, yc, Math.sin(a) * W / 2)); }
  // hook tip turns in a little (the gate seats behind it)
  const tip = pts[pts.length - 1];
  pts.push(tip.clone().add(V3(-0.004, 0, -0.0025)));
  bins.add(mats.metal, bar(pts, r, 16));
  // spring gate: straight bar from the hinge on the eye side to just inside the nose tip
  const g0 = pts[0].clone().add(V3(0.004, 0, -0.001)), g1 = tip.clone().add(V3(-0.006, 0, -0.0045));
  bins.add(mats.metal, G.tube(g0.clone().setY(yc + 0.0004), g1.clone().setY(yc + 0.0004), r * 0.72, 14));
  // hinge rivet + the gate's notch boss
  bins.add(mats.metal, G.tube(g0.clone().setY(yc - r * 0.9), g0.clone().setY(yc + r * 1.25), r * 0.55, 12));
  return { length: L };
}

// welded short-link chain lying along a floor path (pts in XZ), link wire d
export function chain(bins, mat, pts, { d = 0.006, link = 0.032 } = {}) {
  const P = K.smoothPath(pts, 200);
  // arc-length sampling at link pitch
  const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + P[i].distanceTo(P[i - 1]));
  const pitch = link - 2 * d * 0.95;
  const n = Math.floor(S[S.length - 1] / pitch);
  const at = (s) => { let i = 1; while (i < S.length - 1 && S[i] < s) i++; const f = (s - S[i - 1]) / Math.max(1e-9, S[i] - S[i - 1]); return P[i - 1].clone().lerp(P[i], f); };
  const r = d / 2, W = link * 0.55;
  for (let k = 0; k < n; k++) {
    const a = at(k * pitch), b = at((k + 1) * pitch);
    const c = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a).setY(0).normalize();
    // link: stadium loop; alternate links lie flat / stand on edge
    const flat = k % 2 === 0;
    const loop = [];
    const Lh = link / 2 - W / 2;
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * TAU;
      const cx = Math.cos(t) >= 0 ? Lh : -Lh;
      loop.push([cx + Math.cos(t) * (W / 2 - r), Math.sin(t) * (W / 2 - r)]);
    }
    const g = K.tubeAlong(loop.map(([x, y]) => V3(x, 0, y)), r, 10, { closed: true });
    if (!flat) g.rotateX(Math.PI / 2);
    const m = new THREE.Matrix4().makeBasis(dir, V3(0, 1, 0), V3().crossVectors(dir, V3(0, 1, 0))).setPosition(c.x, flat ? r : W / 2, c.z);
    g.applyMatrix4(m);
    bins.add(mat, g);
  }
}

// round ground peg: rod Ø D, length L along +X from the head (x = 0) to the tip, lying on the
// floor; a beaten (mushroomed) head, cone tip, and a welded ring flat on the floor beside the
// head on the +Z side (ring: R, wire rw). Returns the ring centre.
export function roundPeg(bins, mats, { L = 1.0, D = 0.025, ring = true, R = 0.032, rw = 0.005, seed = 3 } = {}) {
  const r = D / 2, yc = r;
  const tip = 0.075;
  const prof = [[0.0001, 0], [r * 1.12, 0], [r * 1.18, 0.003], [r * 1.08, 0.008], [r, 0.014], [r, L - tip]];
  for (let i = 1; i <= 8; i++) { const t = i / 8; prof.push([Math.max(0.0012, r * (1 - t) + 0.0012 * t), L - tip + tip * t]); }
  prof.push([0.0001, L + 0.0008]);
  bins.add(mats.metal, K.lathe(prof, 32).rotateZ(-Math.PI / 2).translate(0, yc, 0));
  // beaten head: a few dents round the edge of the striking face
  const nz = makeNoise2(seed);
  for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + nz.noise(k, 1); const dn = G.roundedBox(0.0016, 0.004, 0.006, 0.0007); dn.translate(-0.0004, yc + Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08); bins.add(mats.metal, dn); }
  if (!ring) return null;
  const rc = V3(0.07, rw, r * Math.sqrt(1 - Math.pow((r - rw) / r, 2)) + R + rw * 0.4);
  const tor = new THREE.TorusGeometry(R, rw, 14, 56); tor.rotateX(Math.PI / 2); tor.translate(rc.x, rc.y, rc.z); bins.add(mats.metal, tor);
  // weld where the ring touches the rod
  const wpts = [], wn = [];
  const z0 = rc.z - R - rw * 0.6;
  for (let i = 0; i <= 10; i++) { const x = rc.x - 0.007 + 0.014 * (i / 10); wpts.push(V3(x, rw * 1.25, z0)); wn.push(V3(0, 1, 0.6).normalize()); }
  bins.add(mats.metal, K.sweep(wpts, K.circle(0.0028, 10).map(([a, b]) => [a, b * 0.7]), { normals: wn }));
  return rc;
}
