// Koppelstukken en buizen 38 mm (tube-frame party tent parts).
//
// { parts: ['2-weg','3-weg','4-weg','3-weg-grond','buis'], tubeLength }
// Connectors: hot-dip galvanised steel tube Ø 42 x 1.4 mm (the 38 mm frame tubes slide in).
// Built like the real thing: a through tube (or a mitred pair of arms) with branch arms
// welded onto its side; the welds are lumpy fillet beads that follow the saddle / mitre
// curve, galvanised over (zinc pooled in the fillet). Every socket has a welded M8 nut with a
// wing bolt (borgbout) screwed in. Variants:
//   2-weg      straight 20 cm sleeve, a nut at each end
//   3-weg      ridge connector: two rafter arms mitred at 140° plus the ridge arm
//   4-weg      eave connector: eave through tube, leg arm down, rafter arm up at 120° from the leg
//   3-weg-grond ground-frame corner: two horizontal arms mitred at 90° and a short arm up
// Tube: galvanised steel Ø 38 x 1.2 mm with the faint weld seam line and open ends; default
// 1.59 m. Flat-lay: the tube lies behind the connectors running away from the camera
// (diagonally, fully in frame), the connectors lie stably on their arms in front.
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

// open tube along dir from t0 to t1 (bore visible at the t1 end; t0 end hidden in a joint)
function arm(c, dir, t0, t1, { openStart = false } = {}) {
  const g = K.lathe([[RI, t1 - 0.07], [RI, t1 - 0.0006], [RI + 0.0004, t1], [RO - 0.0004, t1], [RO, t1 - 0.0006], [RO, openStart ? t0 + 0.0006 : t0], ...(openStart ? [[RO - 0.0004, t0], [RI + 0.0004, t0], [RI, t0 + 0.0006], [RI, t0 + 0.07]] : [])], 48);
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

function connector(name, mats, seed) {
  const bins = new G.PartBin();
  const C = V3();
  const L = 0.12, armS = L - 0.034;
  const up = V3(0.25, 1, 0.15).normalize();
  let supports = null;
  if (name === '2-weg') {
    bins.add(mats.fit, arm(V3(-0.1, 0, 0), V3(1, 0, 0), 0, 0.2, { openStart: true }));
    nutAndBolt(bins, mats, V3(-0.1, 0, 0), V3(1, 0, 0), 0.032, V3(0, 1, 0));
    nutAndBolt(bins, mats, V3(0.1, 0, 0), V3(-1, 0, 0), 0.032, V3(0, 1, 0));
    return { bins, supports: null };
  }
  const mitre = (dA, dB, branches) => {
    // two arms meeting at the hub, each running a little past the mitre plane
    const nA = dA.clone().normalize(), nB = dB.clone().normalize();
    const half = Math.acos(Math.max(-1, Math.min(1, nA.dot(nB)))) / 2;
    const over = RO / Math.tan(half) + 0.002;
    bins.add(mats.fit, arm(C.clone().addScaledVector(nA, -over), nA, 0, L + over));
    bins.add(mats.fit, arm(C.clone().addScaledVector(nB, -over), nB, 0, L + over));
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
  const through = (dT, branches) => {
    const n = dT.clone().normalize();
    bins.add(mats.fit, arm(C.clone().addScaledVector(n, -L), n, 0, 2 * L, { openStart: true }));
    nutAndBolt(bins, mats, C, n, armS, up); nutAndBolt(bins, mats, C, n.clone().negate(), armS, up);
    for (const d of branches) {
      const nd = d.clone().normalize();
      bins.add(mats.fit, arm(C, nd, 0, L));
      weldBead(bins, mats.fit, C, nd, cylHit(C, n), 0, RO * 2.5, seed + 5);
      nutAndBolt(bins, mats, C, nd, armS, up.clone().add(n.clone().multiplyScalar(0.4)).normalize());
    }
  };
  let ends;
  if (name === '3-weg') {
    const a = V3(Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), b = V3(-Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), r = V3(0, 0, 1);
    mitre(a, b, [r]); ends = [a, b, r];
  } else if (name === '3-weg-grond') {
    const a = V3(1, 0, 0), b = V3(0, 0, 1), u = V3(0, 1, 0);
    mitre(a, b, [u]); ends = [a, b, null];
  } else {
    const leg = V3(0, -1, 0), raf = V3(-Math.cos(30 * DEG), Math.sin(30 * DEG), 0);
    through(V3(0, 0, 1), [leg, raf]); ends = [leg, V3(0, 0, 1), V3(0, 0, -1)];
  }
  supports = ends.map((d) => (d ? d.clone().multiplyScalar(L * 0.9) : V3()));
  return { bins, supports };
}

function layFlat(geos, supports) {
  const [a, b, c] = supports;
  let n = V3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
  if (V3().sub(a).dot(n) < 0) n.negate();
  const q = new THREE.Quaternion().setFromUnitVectors(n, V3(0, 1, 0));
  for (const g of geos) g.applyQuaternion(q);
}

export function tubeFittings(p = {}) {
  let parts = p.parts || ['2-weg', '3-weg', '4-weg', 'buis'];
  if (typeof parts === 'string') parts = [parts];
  const mats = { fit: L3.galvFine({ cell: 0.004 }), tube: L3.galvFine({ tone: '#BEC3C7', cell: 0.003, pre: true }), zinc: SG.zincSG() };
  const bins = new G.PartBin();
  const front = parts.filter((x) => x !== 'buis');
  const hasTube = parts.includes('buis');
  // camera-aligned knolling (round 3: tidy, not scattered): with the tube, the tube lies on the
  // left running straight away from the camera and the connectors stand in an evenly spaced
  // column beside it, each turned the same way; alone, a connector sits in the centre
  const right = V3(Math.cos(34 * DEG), 0, -Math.sin(34 * DEG)), fwd = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
  const nF = front.length;
  front.forEach((name, i) => {
    const { bins: sub, supports } = connector(name, mats, 7 + i * 11);
    const geos = []; for (const [, list] of sub.bins) geos.push(...list);
    if (supports) layFlat(geos, supports);
    const yaw = ({ '2-weg': 34 - 22, '3-weg': 34 - 8, '4-weg': 34 + 20, '3-weg-grond': 34 + 45 })[name] * DEG;
    let yMin = Infinity, cx = 0, cz = 0;
    for (const g of geos) { g.rotateY(yaw); g.computeBoundingBox(); yMin = Math.min(yMin, g.boundingBox.min.y); }
    { const bb = new THREE.Box3(); for (const g of geos) bb.union(g.boundingBox); cx = (bb.min.x + bb.max.x) / 2; cz = (bb.min.z + bb.max.z) / 2; }
    const sf = nF > 1 ? 0.32 * ((nF - 1) / 2 - i) : 0;
    const pos = right.clone().multiplyScalar(hasTube ? 0.15 : 0).addScaledVector(fwd, sf);
    for (const [mat, list] of sub.bins) for (const g of list) { g.translate(pos.x - cx, -yMin, pos.z - cz); bins.add(mat, g); }
  });
  if (hasTube) {
    const L = Number(p.tubeLength ?? 1.59);
    const r0 = 0.019, ri = 0.0178;
    const t = K.lathe([[ri, 0.06], [ri, L - 0.06], [ri, L], [r0, L], [r0, 0], [ri, 0], [ri, 0.06]].reverse(), 48);
    // weld seam line (a faint raised line along the tube)
    const seam = G.roundedBox(0.0014, L - 0.004, 0.0005, 0.0002); seam.translate(0, L / 2, r0 - 0.00005);
    seam.rotateY(0.9);
    // with connectors: left-right behind them; alone: corner to corner through the frame
    const alone = front.length === 0;
    const yawT = alone ? -31 * DEG : (34 + 90) * DEG; // with connectors: straight away from the camera
    const dir = V3(Math.cos(yawT), 0, -Math.sin(yawT));
    const start = dir.clone().multiplyScalar(-L / 2).addScaledVector(right, alone ? 0 : -0.16);
    const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir);
    for (const g of [t, seam]) { g.applyQuaternion(q); g.translate(start.x, r0, start.z); }
    bins.add(mats.tube, t); bins.add(mats.tube, seam);
    // bolt holes near both ends (dark)
    for (const s0 of [0.03, L - 0.03]) {
      const c = start.clone().addScaledVector(dir, s0).setY(2 * r0);
      bins.add(SG.rubberSG('#0B0B0B'), G.tube(c.clone().add(V3(0, -0.0012, 0)), c.clone().add(V3(0, 0.0002, 0)), 0.0042, 16));
    }
  }
  const g = K.finish(bins, 'tubeFittings');
  return {
    object: g,
    detail: { target: [0, 0.05, 0.2], size: 0.25, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 28 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 }, envIntensity: 1.0 } },
    meta: { parts },
  };
}
