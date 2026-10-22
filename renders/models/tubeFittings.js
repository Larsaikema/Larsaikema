// Koppelstukken en buizen 38 mm (tube-frame party tent parts).
//
// { parts, tubeLength, count, angle, lip, ground, corner, length }
//   parts: any of '2-weg', '3-weg', '4-weg', '3-weg-grond', 'buis', 'voetplaat', 'klem', 'knevelbout'
// Connectors: hot-dip galvanised steel tube Ø 42 x 1.4 mm (the 38 mm frame tubes slide in).
// Built like the real thing: a through tube (or a mitred pair of arms) with branch arms
// welded onto its side; the welds are lumpy fillet beads that follow the saddle / mitre
// curve, galvanised over (zinc pooled in the fillet). Every socket has a welded M8 nut with a
// wing bolt (knevelbout) screwed in. Variants (angle = the catalogue angle of the piece):
//   2-weg        straight sleeve, a nut at each end; `length` 0.2 (default) or 0.5 m;
//                `ground: true` = grondframe 2-weg: a welded peg tab beside the sleeve
//   3-weg        angle 140 (default): nokstuk, two rafter arms mitred at 140° plus the ridge arm
//                angle 110 / 120: dakrand hoekstuk, leg arm down mitred to one eave arm, rafter
//                arm up at the angle from the leg (pitch 20° / 30°)
//                angle 180: dakvlak 3-weg, straight rafter tube with one purlin arm at 90°
//   4-weg        angle 110 / 120 (default): dakrand 4-weg, eave through tube, leg down, rafter up
//                angle 140: nokstuk 4-weg, ridge through tube with two rafter arms at 140°
//                angle 180: dakvlak 4-weg, straight rafter tube with purlin arms both ways
//   lip: true    a welded flat lip with a bolt hole under the ridge hub (for the ridge brace)
//   3-weg-grond  grondframe T-stuk: ground through tube + staander arm up, peg tab;
//                `corner: true` = grondframe hoekstuk (two ground arms mitred at 90° + arm up)
//   voetplaat    120 x 120 x 5 mm plate, Ø 42 socket with welded nut + wing bolt, two peg holes
//   klem         klem nokversteviging: split band clamp round a 38 mm tube, bolted ears, brace lug
//   knevelbout   M8 wing bolts (`count`, default 10), knolled in two rows
// Tube: galvanised steel Ø 38 x 1.2 mm with the faint weld seam line, open ends and drilled
// bolt holes; `tubeLength` (default 1.59 m); `count` > 1 = a taped bundle (3 + 2, ...).
// Flat-lay: with connectors the tube lies behind them running away from the camera, the
// connectors lie stably on their arms in front; a piece alone sits centred.
// Surfaces: L3.galvFine (world-space, fine low-contrast spangle: no uv seams).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const RO = 0.021, RI = 0.0193;

// open tube along dir from t0 to t1 (bore visible at the t1 end; t0 end hidden in a joint);
// `deep` = how far the bore surface runs in from an open end
function arm(c, dir, t0, t1, { openStart = false, deep = 0.07 } = {}) {
  const d = Math.min(deep, (t1 - t0) / (openStart ? 2 : 1) - 0.0008);
  const g = K.lathe([[RI, t1 - d], [RI, t1 - 0.0006], [RI + 0.0004, t1], [RO - 0.0004, t1], [RO, t1 - 0.0006], [RO, openStart ? t0 + 0.0006 : t0], ...(openStart ? [[RO - 0.0004, t0], [RI + 0.0004, t0], [RI, t0 + 0.0006], [RI, t0 + d]] : [])], 48);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()));
  g.translate(c.x, c.y, c.z);
  return g;
}
const perp = (d) => { const t = Math.abs(d.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0); const a = V3().crossVectors(d, t).normalize(); return [a, V3().crossVectors(d, a).normalize()]; };

// weld bead along a closed curve where the surface of tube B (axis cb + db*t) meets the
// surface `hit(p)` (signed function, 0 on the other surface), found by bisection along db.
function weldBead(bins, mat, cb, db, hit, tMin, tMax, seed, { w = 0.0032, h = 0.0021 } = {}) {
  const nz = makeNoise2(seed);
  const [a1, a2] = perp(db);
  const pts = [], nrm = [], sc = [];
  const N = 96;
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * TAU;
    const radial = a1.clone().multiplyScalar(Math.cos(a)).addScaledVector(a2, Math.sin(a));
    const at = (t) => cb.clone().addScaledVector(db, t).addScaledVector(radial, RO);
    let lo = tMin, hi = tMax;
    const flo = hit(at(lo));
    for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (Math.sign(hit(at(mid))) === Math.sign(flo)) lo = mid; else hi = mid; }
    const p = at((lo + hi) / 2);
    pts.push(p);
    // bead normal: between the branch's radial and the axis direction (sits in the fillet)
    nrm.push(radial.clone().add(db.clone().multiplyScalar(0.9)).normalize());
    sc.push(0.8 + 0.35 * (0.5 + 0.5 * nz.noise(k * 0.35, 1.7)) + 0.12 * Math.sin(k * 2.3));
  }
  // flattened lens profile (x across the bead, y out of the fillet)
  const prof = []; for (let i = 0; i < 14; i++) { const t = (i / 14) * TAU; prof.push([Math.cos(t) * w, Math.sin(t) * h]); }
  bins.add(mat, K.sweep(pts, prof, { normals: nrm, closed: true, scale: (i) => [1, sc[i % sc.length]] }));
}

// welded M8 nut + wing bolt on an arm (dir from c) at distance s, on side `up`
function nutAndBolt(bins, mats, c, dir, s, up) {
  const d = dir.clone().normalize();
  const u = up.clone().addScaledVector(d, -up.dot(d)).normalize();
  const l = V3().crossVectors(d, u);
  const b = c.clone().addScaledVector(d, s).addScaledVector(u, RO);
  const nut = K.hexNutGeo(0.013, 0.0065, 0.0042);
  nut.applyMatrix4(new THREE.Matrix4().makeBasis(d, u, l).setPosition(b.clone().addScaledVector(u, 0.0031)));
  bins.add(mats.fit, nut);
  // weld fillet round the nut base
  const wp = [], wn = [];
  for (let k = 0; k <= 30; k++) { const a = (k / 30) * TAU; const r = 0.0077 + 0.0004 * Math.sin(a * 5 + 1); wp.push(b.clone().addScaledVector(d, Math.cos(a) * r).addScaledVector(l, Math.sin(a) * r).addScaledVector(u, 0.0004)); wn.push(u.clone().add(d.clone().multiplyScalar(Math.cos(a) * 0.8)).add(l.clone().multiplyScalar(Math.sin(a) * 0.8)).normalize()); }
  const prof = []; for (let i = 0; i < 10; i++) { const t = (i / 10) * TAU; prof.push([Math.cos(t) * 0.0018, Math.sin(t) * 0.0013]); }
  bins.add(mats.fit, K.sweep(wp, prof, { normals: wn, closed: true }));
  // wing bolt: threaded shank out of the nut, wing head
  bins.add(mats.zinc, G.tube(b.clone().addScaledVector(u, 0.006), b.clone().addScaledVector(u, 0.012), 0.0039, 14));
  const wng = K.wingNutGeo(1.0);
  wng.applyMatrix4(new THREE.Matrix4().makeBasis(d, u, l).setPosition(b.clone().addScaledVector(u, 0.0098)));
  bins.add(mats.zinc, wng);
}

// distance-to-axis surface test for a tube (axis c + d t): |p - axis| - RO
const cylHit = (c, d) => (p) => { const v = p.clone().sub(c); const t = v.dot(d); return v.addScaledVector(d, -t).length() - RO; };
const planeHit = (c, n) => (p) => p.clone().sub(c).dot(n);

// straight fillet weld bead along a polyline (normals = out of the fillet)
function beadAlong(bins, mat, pts, nrm, seed, { w = 0.0026, h = 0.0018 } = {}) {
  const nz = makeNoise2(seed);
  const prof = []; for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU; prof.push([Math.cos(t) * w, Math.sin(t) * h]); }
  bins.add(mat, K.sweep(pts, prof, { normals: nrm, scale: (i) => { const e = Math.min(1, i / 2, (pts.length - 1 - i) / 2); return [1, Math.max(0.25, e) * (0.8 + 0.35 * (0.5 + 0.5 * nz.noise(i * 0.8, 2.1)))]; } }));
}

// right-handed basis helper: x, y given (orthonormal), z = x cross y
const basis = (x, y, o) => new THREE.Matrix4().makeBasis(x, y, V3().crossVectors(x, y)).setPosition(o);

// welded peg tab (ground frame): 32 x 4 mm flat bar lying flat on the floor beside the tube,
// round end with a 13 mm peg hole. c = point on the tube axis, along = tube axis, out =
// horizontal direction away from the tube. Pieces built in their use orientation (y up).
function pegTab(bins, mats, c, along, out, seed) {
  const w = 0.032, t = 0.004, len = 0.062, r = w / 2;
  const sh = new THREE.Shape();
  sh.moveTo(0, -r); sh.lineTo(len - r, -r); sh.absarc(len - r, 0, r, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, r); sh.lineTo(0, -r);
  const hole = new THREE.Path(); hole.absarc(len - r, 0, 0.0065, 0, TAU, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: t - 0.0012, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1, curveSegments: 24 });
  // shape (x, y) -> (out, along'), extrude z -> up
  const o = out.clone().normalize();
  let a = along.clone().normalize();
  if (V3().crossVectors(o, a).y < 0) a.negate();
  const y0 = c.y - RO;
  g.applyMatrix4(new THREE.Matrix4().makeBasis(o, a, V3(0, 1, 0)).setPosition(c.clone().addScaledVector(o, RO * 0.35).setY(y0 + 0.0006)));
  bins.add(mats.fit, g);
  // fillet weld where the tab's top face meets the tube
  const yt = y0 + t, dx = Math.sqrt(Math.max(0, RO * RO - (RO - t) * (RO - t)));
  const pts = [], nrm = [];
  for (let k = 0; k <= 10; k++) { const v = -r + 0.003 + (w - 0.006) * (k / 10); pts.push(c.clone().addScaledVector(o, dx + 0.0006).addScaledVector(a, v).setY(yt + 0.0004)); nrm.push(o.clone().add(V3(0, 1, 0)).normalize()); }
  beadAlong(bins, mats.fit, pts, nrm, seed);
}

// welded lip under a ridge hub: flat bar 32 x 5 mm hanging from the hub centre c along `down`,
// its faces normal to `thick`; rounded end with a 10.5 mm bolt hole. `hit(p)` < 0 inside the
// hub tubes: the fillet welds follow where the lip leaves them, on both faces.
function lipPlate(bins, mats, c, down, thick, hit, seed) {
  const w = 0.032, t = 0.005, len = 0.048, r = w / 2;
  const dn = down.clone().normalize(), th = thick.clone().normalize();
  const across = V3().crossVectors(dn, th).normalize();
  const v0 = 0.004, v1 = RO + len;
  const sh = new THREE.Shape();
  sh.moveTo(-r, v0); sh.lineTo(-r, v1 - r); sh.absarc(0, v1 - r, r, Math.PI, 0, true); sh.lineTo(r, v0); sh.lineTo(-r, v0);
  const hole = new THREE.Path(); hole.absarc(0, v1 - r, 0.0053, 0, TAU, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: t - 0.0012, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1, curveSegments: 24 });
  g.translate(0, 0, -(t - 0.0012) / 2);
  // shape x -> across, y -> down, z -> thick (right-handed: across x down = thick)
  g.applyMatrix4(new THREE.Matrix4().makeBasis(across, dn, th).setPosition(c));
  bins.add(mats.fit, g);
  for (const sz of [-1, 1]) {
    const pts = [], nrm = [];
    for (let k = 0; k <= 14; k++) {
      const x = -r + 0.002 + (w - 0.004) * (k / 14);
      const at = (v) => c.clone().addScaledVector(across, x).addScaledVector(dn, v).addScaledVector(th, sz * (t / 2 + 0.0004));
      let lo = 0, hi = RO * 2.2;
      for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (hit(at(mid)) < 0) lo = mid; else hi = mid; }
      pts.push(at((lo + hi) / 2 + 0.0006));
      nrm.push(th.clone().multiplyScalar(sz).add(dn.clone().multiplyScalar(-0.9)).normalize());
    }
    beadAlong(bins, mats.fit, pts, nrm, seed + sz * 3, { w: 0.0024, h: 0.0017 });
  }
}

// One connector, built in its use orientation (y up), hub at the origin. Returns the parts and
// `down`: the direction in the piece's frame that ends up pointing at the floor (null = as built).
function connector(name, mats, seed, opt = {}) {
  const bins = new G.PartBin();
  const C = V3();
  const L = 0.12, armS = L - 0.034;
  const up = V3(0.25, 1, 0.15).normalize();
  const ang = opt.angle != null ? Number(opt.angle) : null;
  if (name === '2-weg') {
    const len = Number(opt.length ?? 0.2);
    bins.add(mats.fit, arm(V3(-len / 2, 0, 0), V3(1, 0, 0), 0, len, { openStart: true, deep: len / 2 }));
    nutAndBolt(bins, mats, V3(-len / 2, 0, 0), V3(1, 0, 0), 0.032, V3(0, 1, 0));
    nutAndBolt(bins, mats, V3(len / 2, 0, 0), V3(-1, 0, 0), 0.032, V3(0, 1, 0));
    if (opt.ground) pegTab(bins, mats, V3(0, 0, 0), V3(1, 0, 0), V3(0, 0, 1), seed);
    return { bins, down: null };
  }
  const tubes = []; // hub tubes as [centre, dir] for the lip welds
  const hubHit = (p) => Math.min(...tubes.map(([c, d]) => cylHit(c, d)(p)));
  const mitre = (dA, dB, branches) => {
    // two arms meeting at the hub, each running a little past the mitre plane
    const nA = dA.clone().normalize(), nB = dB.clone().normalize();
    const half = Math.acos(Math.max(-1, Math.min(1, nA.dot(nB)))) / 2;
    const over = RO / Math.tan(half) + 0.002;
    bins.add(mats.fit, arm(C.clone().addScaledVector(nA, -over), nA, 0, L + over));
    bins.add(mats.fit, arm(C.clone().addScaledVector(nB, -over), nB, 0, L + over));
    tubes.push([C, nA], [C, nB]);
    const pn = nA.clone().sub(nB).normalize(); // mitre plane normal
    weldBead(bins, mats.fit, C, nA, planeHit(C, pn), -over, RO * 2, seed);
    nutAndBolt(bins, mats, C, nA, armS, up); nutAndBolt(bins, mats, C, nB, armS, up);
    for (const d of branches) {
      const nd = d.clone().normalize();
      bins.add(mats.fit, arm(C, nd, 0, L));
      // the branch meets either arm's surface: weld where it leaves the union
      const hit = (p) => Math.min(cylHit(C, nA)(p), cylHit(C, nB)(p));
      weldBead(bins, mats.fit, C, nd, hit, 0, RO * 2.5, seed + 3);
      nutAndBolt(bins, mats, C, nd, armS, up);
    }
  };
  const through = (dT, branches, len = L) => {
    const n = dT.clone().normalize();
    bins.add(mats.fit, arm(C.clone().addScaledVector(n, -len), n, 0, 2 * len, { openStart: true }));
    tubes.push([C, n]);
    nutAndBolt(bins, mats, C, n, len - 0.034, up); nutAndBolt(bins, mats, C, n.clone().negate(), len - 0.034, up);
    for (const d of branches) {
      const nd = d.clone().normalize();
      bins.add(mats.fit, arm(C, nd, 0, L));
      weldBead(bins, mats.fit, C, nd, cylHit(C, n), 0, RO * 2.5, seed + 5);
      nutAndBolt(bins, mats, C, nd, armS, up.clone().add(n.clone().multiplyScalar(0.4)).normalize());
    }
  };
  let down = null, arms = null;
  if (name === '3-weg' && (ang === 110 || ang === 120)) {
    // dakrand hoekstuk: leg down + one eave arm, mitred at 90 deg; the rafter rises over the
    // free side at (angle - 90) deg pitch
    const pitch = (ang - 90) * DEG;
    const leg = V3(0, -1, 0), eave = V3(0, 0, 1), raf = V3(-Math.cos(pitch), Math.sin(pitch), 0);
    mitre(leg, eave, [raf]);
    // rests on the three arm ends
    down = planeDown([leg, eave, raf].map((d) => d.clone().multiplyScalar(L * 0.9)));
    arms = [leg, eave, raf];
  } else if (name === '3-weg' && ang === 180) {
    // dakvlak 3-weg: straight rafter tube with one purlin arm; lies flat
    through(V3(1, 0, 0), [V3(0, 0, -1)]);
  } else if (name === '3-weg') {
    // nokstuk 140 deg: two rafter arms mitred at the ridge, ridge arm along +z
    const a = V3(Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), b = V3(-Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), r = V3(0, 0, 1);
    mitre(a, b, [r]);
    if (opt.lip) {
      lipPlate(bins, mats, C, V3(0, -1, 0), V3(0, 0, 1), hubHit, seed + 9);
      // on its side: rafter ends and the lip end on the floor, the ridge arm rising from it
      down = planeDown([a.clone().multiplyScalar(L * 0.9).add(V3(0, 0, -RO)), b.clone().multiplyScalar(L * 0.9).add(V3(0, 0, -RO)), V3(0, -(RO + 0.044), -0.0025)]);
    } else down = planeDown([a, b, r].map((d) => d.clone().multiplyScalar(L * 0.9)));
  } else if (name === '4-weg' && ang === 140) {
    // nokstuk 4-weg: ridge through tube with two rafter arms at 140 deg
    const a = V3(Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), b = V3(-Math.cos(20 * DEG), -Math.sin(20 * DEG), 0);
    through(V3(0, 0, 1), [a, b]);
    if (opt.lip) lipPlate(bins, mats, C, V3(0, -1, 0), V3(0, 0, 1), hubHit, seed + 9);
    // lies on the ridge tube and one rafter; the other rafter (and the lip) rise from the floor
    const n0 = V3().crossVectors(V3(0, 0, 1), a).normalize();
    down = n0.dot(b) > 0 ? n0.negate() : n0;
  } else if (name === '4-weg' && ang === 180) {
    // dakvlak 4-weg: straight rafter tube, purlin arms both ways; lies flat
    through(V3(1, 0, 0), [V3(0, 0, 1), V3(0, 0, -1)]);
  } else if (name === '4-weg') {
    // dakrand 4-weg (110 / 120 deg): eave through tube, leg down, rafter up
    const pitch = ((ang || 120) - 90) * DEG;
    const leg = V3(0, -1, 0), raf = V3(-Math.cos(pitch), Math.sin(pitch), 0);
    through(V3(0, 0, 1), [leg, raf]);
    down = planeDown([leg, V3(0, 0, 1), V3(0, 0, -1)].map((d) => d.clone().multiplyScalar(L * 0.9)));
  } else if (name === '3-weg-grond') {
    if (opt.corner) {
      // grondframe hoekstuk: two ground arms mitred at 90 deg, staander arm up (use orientation)
      mitre(V3(1, 0, 0), V3(0, 0, 1), [V3(0, 1, 0)]);
      pegTab(bins, mats, V3(0, 0, 0), V3(1, -0, -1).normalize(), V3(-1, 0, -1).normalize(), seed);
    } else {
      // grondframe T-stuk: ground through tube, staander arm up, peg tab on the outside
      through(V3(1, 0, 0), [V3(0, 1, 0)]);
      pegTab(bins, mats, V3(0, 0, 0), V3(1, 0, 0), V3(0, 0, 1), seed);
    }
  }
  return { bins, down, arms };
}

// yaw (deg) that turns every arm across the view (none pointing at or away from the camera):
// maximises the smallest |sin| between an arm's floor projection and the hero view axis
function autoYaw(arms, down) {
  const q = new THREE.Quaternion().setFromUnitVectors(down.clone().normalize(), V3(0, -1, 0));
  const flat = arms.map((d) => d.clone().applyQuaternion(q).setY(0));
  let best = 0, bestScore = -1;
  for (let y = 0; y < 360; y += 2) {
    const a = y * DEG, view = 34 * DEG;
    let score = Infinity;
    for (const f of flat) {
      const r = f.clone().applyAxisAngle(V3(0, 1, 0), a);
      const ang = Math.atan2(r.x, r.z) - view;
      score = Math.min(score, Math.abs(Math.sin(ang)) * Math.max(0.3, r.length()));
    }
    if (score > bestScore + 1e-6) { bestScore = score; best = y; }
  }
  return best;
}

// down direction for a piece resting on three arm ends: the normal of their plane pointing
// away from the hub
function planeDown([a, b, c]) {
  const n = V3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
  // the hub (origin) must end up above the plane: down points from the hub towards the plane
  if (a.dot(n) < 0) n.negate();
  return n;
}

// rotate so `down` points at the floor
function layDown(geos, down) {
  const q = new THREE.Quaternion().setFromUnitVectors(down.clone().normalize(), V3(0, -1, 0));
  for (const g of geos) g.applyQuaternion(q);
}

// voetplaat met haringgat: plate on the floor, Ø 42 socket up, welded nut + wing bolt
function footPlate(mats, seed) {
  const bins = new G.PartBin();
  const S = 0.12, T = 0.005, rc = 0.014;
  const sh = new THREE.Shape(G.roundedRectProfile(S, S, rc, 6).map((q) => new THREE.Vector2(q.x, q.y)));
  for (const s of [-1, 1]) { const h = new THREE.Path(); h.absarc(s * 0.039, s * 0.039, 0.0065, 0, TAU, true); sh.holes.push(h); }
  bins.add(mats.fit, K.extrudeY(sh, T, { y0: 0, bevel: 0.0008, bevelSegs: 1, curveSegs: 24 }));
  bins.add(mats.fit, arm(V3(0, T, 0), V3(0, 1, 0), 0, 0.1, { deep: 0.09 }));
  // fillet weld round the socket base
  const pts = [], nrm = [];
  for (let k = 0; k <= 64; k++) { const a = (k / 64) * TAU; pts.push(V3(Math.cos(a) * (RO + 0.0009), T + 0.0009, Math.sin(a) * (RO + 0.0009))); nrm.push(V3(Math.cos(a), 1, Math.sin(a)).normalize()); }
  bins.add(mats.fit, K.sweep(pts, K.circle(0.0024, 10).map(([x, y]) => [x, y * 0.75]), { normals: nrm, closed: true }));
  nutAndBolt(bins, mats, V3(0, T, 0), V3(0, 1, 0), 0.068, V3(0.55, 0, 0.83));
  return bins;
}

// klem nokversteviging: split band clamp lying flat (axis vertical), bolted ears at +x, lug at -x
function ridgeClamp(mats) {
  const bins = new G.PartBin();
  const Ri = 0.0193, t = 0.0032, Ro = Ri + t, h = 0.03, gh = 13 * DEG;
  // three's lathe: x = r sin(phi), z = r cos(phi): the split at +x is phi = 90 deg
  const ring = K.lathe([[Ri, 0], [Ro, 0], [Ro, h], [Ri, h], [Ri, 0]], 72, Math.PI / 2 + gh, TAU - 2 * gh);
  bins.add(mats.fit, ring);
  // ears: two plates parallel to x either side of the split, bolt + nut through them
  const zE = Math.sin(gh) * (Ri + t / 2);
  for (const s of [-1, 1]) {
    const e = G.roundedBox(0.028, h, t, 0.0012, 2); e.translate(Ri * Math.cos(gh) + 0.0125, h / 2, s * zE); bins.add(mats.fit, e);
  }
  const bx = Ri + 0.017;
  bins.add(mats.zinc, G.tube(V3(bx, h / 2, -zE - 0.012), V3(bx, h / 2, zE + 0.009), 0.004, 14));
  const hd = K.hexNutGeo(0.013, 0.0055, 0); hd.rotateX(Math.PI / 2); hd.translate(bx, h / 2, zE + t / 2 + 0.0028); bins.add(mats.zinc, hd);
  const nt = K.hexNutGeo(0.013, 0.0065, 0.004); nt.rotateX(Math.PI / 2); nt.translate(bx, h / 2, -zE - t / 2 - 0.0033); bins.add(mats.zinc, nt);
  // brace lug at -x: 5 mm plate, rounded end with a 10.5 mm hole (bolt axis along z)
  const ls = new THREE.Shape();
  const l0 = Ri, l1 = Ro + 0.03;
  ls.moveTo(-l0, 0.0); ls.lineTo(-(l1 - h / 2), 0); ls.absarc(-(l1 - h / 2), h / 2, h / 2, -Math.PI / 2, Math.PI / 2, true); ls.lineTo(-l0, h); ls.lineTo(-l0, 0);
  const lh = new THREE.Path(); lh.absarc(-(l1 - h / 2), h / 2, 0.0053, 0, TAU, true); ls.holes.push(lh);
  const lug = new THREE.ExtrudeGeometry(ls, { depth: 0.0038, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1, curveSegments: 24 });
  lug.translate(0, 0, -0.0019); bins.add(mats.fit, lug);
  return bins;
}

// M8 wing bolt (knevelbout), axis -z after laying flat: wings flat on the floor
function wingBolt(bins, mats, m) {
  const parts = [];
  const shank = 0.032;
  parts.push([mats.zinc, G.tube(V3(0, -shank, 0), V3(0, 0.001, 0), 0.0036, 14)]);
  for (let k = 0; k < 22; k++) { const tr = new THREE.TorusGeometry(0.0036, 0.00055, 4, 16); tr.rotateX(Math.PI / 2); tr.translate(0, -shank + 0.002 + k * 0.00125, 0); parts.push([mats.zinc, tr]); }
  parts.push([mats.zinc, K.lathe([[0.0001, -shank - 0.0006], [0.003, -shank - 0.0006], [0.0036, -shank + 0.0002]], 14)]);
  parts.push([mats.zinc, K.wingNutGeo(1.0)]);
  for (const [mat, g] of parts) { g.rotateX(-Math.PI / 2); g.applyMatrix4(m); bins.add(mat, g); }
}

export function tubeFittings(p = {}) {
  let parts = p.parts || ['2-weg', '3-weg', '4-weg', 'buis'];
  if (typeof parts === 'string') parts = [parts];
  const mats = { fit: L3.galvFine({ cell: 0.004 }), tube: L3.galvFine({ tone: '#BEC3C7', cell: 0.003, pre: true }), zinc: SG.zincSG() };
  const bins = new G.PartBin();
  const connectorNames = ['2-weg', '3-weg', '4-weg', '3-weg-grond', 'voetplaat', 'klem'];
  const front = parts.filter((x) => connectorNames.includes(x));
  const hasTube = parts.includes('buis');
  const opt = { angle: p.angle, lip: !!p.lip, ground: !!p.ground, corner: !!p.corner, length: p.length };
  // camera-aligned knolling (round 3: tidy, not scattered): with the tube, the tube lies on the
  // left running straight away from the camera and the connectors stand in an evenly spaced
  // column beside it, each turned the same way; alone, a connector sits in the centre
  const right = V3(Math.cos(34 * DEG), 0, -Math.sin(34 * DEG)), fwd = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
  const nF = front.length;
  front.forEach((name, i) => {
    let sub, down = null;
    if (name === 'voetplaat') sub = footPlate(mats, 7 + i * 11);
    else if (name === 'klem') sub = ridgeClamp(mats);
    let arms = null;
    if (name !== 'voetplaat' && name !== 'klem') ({ bins: sub, down, arms } = connector(name, mats, 7 + i * 11, opt));
    const geos = []; for (const [, list] of sub.bins) geos.push(...list);
    if (down) layDown(geos, down);
    const a = opt.angle != null ? Number(opt.angle) : null;
    const yawDeg = name === '2-weg' ? (opt.length > 0.3 ? 34 - 58 : opt.ground ? 34 - 30 : 34 - 22)
      : name === '3-weg' ? (a === 180 ? 34 + 25 : (a === 110 || a === 120) ? 34 + 150 : opt.lip ? 34 - 8 : 34 - 8)
      : name === '4-weg' ? (a === 180 ? 34 + 12 : a === 140 ? 34 + 70 : 34 + 20)
      : name === '3-weg-grond' ? (opt.corner ? 34 + 180 : 34 - 18)
      : name === 'voetplaat' ? 34 + 10 : name === 'klem' ? 34 + 205 : 34;
    const yaw = (arms && down && p.yaw == null ? autoYaw(arms, down) : p.yaw != null ? Number(p.yaw) : yawDeg) * DEG;
    let yMin = Infinity, cx = 0, cz = 0;
    for (const g of geos) { g.rotateY(yaw); g.computeBoundingBox(); yMin = Math.min(yMin, g.boundingBox.min.y); }
    { const bb = new THREE.Box3(); for (const g of geos) bb.union(g.boundingBox); cx = (bb.min.x + bb.max.x) / 2; cz = (bb.min.z + bb.max.z) / 2; }
    const sf = nF > 1 ? 0.32 * ((nF - 1) / 2 - i) : 0;
    const pos = right.clone().multiplyScalar(hasTube ? 0.15 : 0).addScaledVector(fwd, sf);
    for (const [mat, list] of sub.bins) for (const g of list) { g.translate(pos.x - cx, -yMin, pos.z - cz); bins.add(mat, g); }
  });
  if (parts.includes('knevelbout')) {
    // M8 wing bolts knolled in two rows (heads one way), wings flat on the floor
    const n = Math.max(1, Number(p.count ?? 10));
    const perRow = Math.ceil(n / 2);
    // two columns of bolts side by side
    const rgt = V3(Math.cos(34 * DEG), 0, -Math.sin(34 * DEG)), fw = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow), col = i % perRow;
      const nInRow = row === 0 ? perRow : n - perRow;
      // shank towards the camera's right, wings flat, the bolts stacked front to back
      const c = rgt.clone().multiplyScalar((row - 0.5) * 0.095 + (col % 2) * 0.004).addScaledVector(fw, (col - (nInRow - 1) / 2) * 0.066);
      const m = new THREE.Matrix4().makeRotationY((34 + 90) * DEG + (((i * 37) % 7) - 3) * 0.7 * DEG).setPosition(c.x, 0.0085, c.z);
      wingBolt(bins, mats, m);
    }
  }
  if (hasTube) {
    const L = Number(p.tubeLength ?? 1.59);
    const n = Math.max(1, Number(hasTube && !front.length ? (p.count ?? 1) : 1));
    const r0 = 0.019, ri = 0.0178;
    // with connectors: left-right behind them; alone: corner to corner through the frame
    const alone = front.length === 0 && !parts.includes('knevelbout');
    const yawT = alone ? -31 * DEG : (34 + 90) * DEG; // with connectors: straight away from the camera
    const dir = V3(Math.cos(yawT), 0, -Math.sin(yawT));
    const side = V3(-dir.z, 0, dir.x);
    // bundle cross-section: rows of 3, 2, ... (stacked in the grooves)
    const centres = [];
    if (n === 1) centres.push([0, r0]);
    else {
      let left = n, row = 0;
      while (left > 0) {
        const k = Math.min(left, row === 0 ? Math.ceil(n / 2 + 0.5) : Math.max(1, (row === 1 ? Math.ceil(n / 2 + 0.5) - 1 : 1)));
        for (let j = 0; j < k; j++) centres.push([(j - (k - 1) / 2) * 2 * r0 * 1.003, r0 + row * r0 * Math.sqrt(3) * 1.003]);
        left -= k; row++;
      }
    }
    const holeMat = SG.rubberSG('#0B0B0B');
    centres.forEach(([sx, sy], i) => {
      const stag = n > 1 ? ((i * 0.37) % 1 - 0.5) * 0.03 : 0;
      const t = K.lathe([[ri, 0.06], [ri, L - 0.06], [ri, L], [r0, L], [r0, 0], [ri, 0], [ri, 0.06]].reverse(), 48);
      // weld seam line (a faint raised line along the tube)
      const seam = G.roundedBox(0.0014, L - 0.004, 0.0005, 0.0002); seam.translate(0, L / 2, r0 - 0.00005);
      const spin = 0.9 + i * 1.7;
      seam.rotateY(spin);
      const start = dir.clone().multiplyScalar(-L / 2 + stag).addScaledVector(side, sx).addScaledVector(right, alone ? 0 : -0.16);
      const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir);
      for (const g of [t, seam]) { g.applyQuaternion(q); g.translate(start.x, sy, start.z); }
      bins.add(mats.tube, t); bins.add(mats.tube, seam);
      // drilled bolt holes near both ends (dark), on the visible upper side
      const hn = V3(0, 1, 0).addScaledVector(side, n > 1 ? Math.sin(i * 2.3) * 0.6 : 0).normalize();
      for (const s0 of [0.03, L - 0.03]) {
        const c = start.clone().addScaledVector(dir, s0).setY(sy).addScaledVector(hn, r0);
        bins.add(holeMat, G.tube(c.clone().addScaledVector(hn, -0.0012), c.clone().addScaledVector(hn, 0.0002), 0.0042, 16));
      }
    });
    if (n > 1) {
      // black PVC tape round the bundle near both ends
      const tape = SG.moulded('#141414', { rough: 0.38, spec: 0.5 });
      // convex outline of the circles: sample directions, support distance of the set
      const ctr = centres.reduce((a, [x, y]) => [a[0] + x / n, a[1] + y / n], [0, 0]);
      for (const s0 of [0.16, L - 0.16]) {
        const pts = [], nrm = [];
        for (let k = 0; k < 96; k++) {
          const a = (k / 96) * TAU;
          const ux = Math.cos(a), uy = Math.sin(a);
          let best = -Infinity; for (const [x, y] of centres) best = Math.max(best, (x - ctr[0]) * ux + (y - ctr[1]) * uy + r0 + 0.0009);
          // point on the outline in direction a: use the support point of the nearest circle
          let bp = null, bd = -Infinity; for (const [x, y] of centres) { const d = (x - ctr[0]) * ux + (y - ctr[1]) * uy; if (d > bd) { bd = d; bp = [x + ux * (r0 + 0.0009), y + uy * (r0 + 0.0009)]; } }
          const c = dir.clone().multiplyScalar(-L / 2 + s0).addScaledVector(side, bp[0]).addScaledVector(right, alone ? 0 : -0.16).setY(bp[1]);
          pts.push(c); nrm.push(side.clone().multiplyScalar(ux).add(V3(0, uy, 0)).normalize());
        }
        bins.add(tape, K.sweep(pts, K.rrect(0.03, 0.0009, 0.0004, 2), { normals: nrm, closed: true }));
      }
    }
  }
  const g = K.finish(bins, 'tubeFittings');
  const solo = front.length === 1 && !hasTube;
  return {
    object: g,
    detail: { target: [0, 0.05, 0.2], size: 0.25, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: parts.includes('knevelbout') ? 40 : front.includes('voetplaat') || front.includes('klem') ? 32 : 28 } },
    rig: { default: { contact: { strength: 0.85, h0: solo ? 0.004 : 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 }, envIntensity: 1.0 } },
    meta: { parts, opt },
  };
}
