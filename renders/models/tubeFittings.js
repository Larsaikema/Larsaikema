// Koppelstukken en buizen 38 mm (tube-frame party tent parts).
//
// { parts: ['2-weg','3-weg','4-weg','3-weg-grond','buis'], tubeLength }
// Connectors: hot-dip galvanised steel tube Ø 42 x 1.4 mm (the 38 mm frame tubes slide in),
// arms welded at a central knuckle with visible weld beads; every socket has a welded M8 nut
// with a wing bolt (borgbout) screwed in. Variants:
//   2-weg      straight 20 cm sleeve, a nut at each end
//   3-weg      ridge connector: two rafter arms at 140° plus the ridge arm
//   4-weg      eave connector: leg arm down, two eave arms, rafter arm up at 120° from the leg
//   3-weg-grond ground-frame corner: two horizontal arms at 90° and a short arm up
// Tube: pre-galvanised (sendzimir) steel Ø 38 x 1.2 mm, bright satin with a faint weld seam
// line, open ends; default 1.59 m. Laid out as a flat-lay: the tube diagonally behind, the
// connectors lying stably on their arms in front.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const RO = 0.021, RI = 0.0193;

// open tube arm along +Y from y0 to L (lathe), with the inner bore visible at the end
function armGeo(y0, L) {
  return K.lathe([[RI, L - 0.07], [RI, L - 0.0006], [RI + 0.0004, L], [RO - 0.0004, L], [RO, L - 0.0006], [RO, y0]], 40);
}

function orientTo(geo, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
  geo.applyQuaternion(q);
  return geo;
}

// welded nut + wing bolt on an arm (dir) at distance s from the hub, nut on the side `up`
function nutAndBolt(bins, mats, dir, s, up) {
  const d = dir.clone().normalize();
  let u = up.clone().addScaledVector(d, -up.dot(d)).normalize();
  const c = d.clone().multiplyScalar(s).addScaledVector(u, RO);
  const nut = K.hexNutGeo(0.013, 0.0065, 0.004);
  nut.applyMatrix4(new THREE.Matrix4().makeBasis(d, u, V3().crossVectors(d, u)).setPosition(c.clone().addScaledVector(u, 0.003)));
  bins.add(mats.fit, nut);
  // weld fillet round the nut base
  const wp = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * TAU; const l = V3().crossVectors(d, u); wp.push(c.clone().addScaledVector(d, Math.cos(a) * 0.0078).addScaledVector(l, Math.sin(a) * 0.0078).addScaledVector(u, -0.0003 + 0.0004 * Math.sin(a * 5))); }
  bins.add(mats.fit, K.tubeAlong(wp, 0.0017, 6));
  // wing bolt: threaded shank in the nut, wing head above
  bins.add(mats.zinc, G.tube(c.clone().addScaledVector(u, 0.003), c.clone().addScaledVector(u, 0.012), 0.0038, 12));
  const wn = K.wingNutGeo(1.0);
  const l = V3().crossVectors(d, u);
  wn.applyMatrix4(new THREE.Matrix4().makeBasis(d, u, V3().crossVectors(d, u)).setPosition(c.clone().addScaledVector(u, 0.0085)));
  bins.add(mats.zinc, wn);
}

function connector(bins, mats, dirs, { armL = 0.13, up = V3(0, 1, 0) } = {}) {
  // knuckle + arms + weld beads + nuts
  bins.add(mats.fit, new THREE.SphereGeometry(RO * 1.02, 32, 20));
  for (const d of dirs) {
    bins.add(mats.fit, orientTo(armGeo(0.0, armL), d));
    // weld bead round the arm root
    const dd = d.clone().normalize();
    const t1 = Math.abs(dd.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
    const a1 = V3().crossVectors(dd, t1).normalize(), a2 = V3().crossVectors(dd, a1).normalize();
    const wp = [];
    for (let k = 0; k <= 48; k++) { const a = (k / 48) * TAU; wp.push(dd.clone().multiplyScalar(RO * 1.02 + 0.0015 + 0.0006 * Math.sin(a * 9)).addScaledVector(a1, Math.cos(a) * (RO + 0.0008)).addScaledVector(a2, Math.sin(a) * (RO + 0.0008))); }
    bins.add(mats.fit, K.tubeAlong(wp, 0.0026, 8));
    // nut on the side that faces `up` best (perpendicular to the arm)
    let u = up.clone(); if (Math.abs(u.dot(dd)) > 0.9) u = V3(0, 0, 1);
    nutAndBolt(bins, mats, dd, armL - 0.035, u);
  }
}

// rotate a set of geometries so the plane through the support points lies flat, hub above
function layFlat(geos, supports, hub = V3()) {
  const [a, b, c] = supports;
  let n = V3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
  if (hub.clone().sub(a).dot(n) < 0) n.negate();
  const q = new THREE.Quaternion().setFromUnitVectors(n, V3(0, 1, 0));
  for (const g of geos) g.applyQuaternion(q);
}

export function tubeFittings(p = {}) {
  let parts = p.parts || ['2-weg', '3-weg', '4-weg', 'buis'];
  if (typeof parts === 'string') parts = [parts];
  const mats = { fit: K.hotDipGalv({ tone: 1.02 }), tube: M.galvanised(), zinc: K.zinc() };
  const bins = new G.PartBin();
  const front = parts.filter((x) => x !== 'buis');
  const slotX = front.length <= 1 ? [0] : front.map((_, i) => -0.24 + (0.48 * i) / (front.length - 1));
  front.forEach((name, i) => {
    const sub = new G.PartBin();
    let dirs, supports;
    if (name === '2-weg') {
      // straight sleeve along x, nuts on top at both ends
      sub.add(mats.fit, orientTo(armGeo(-0.1, 0.1), V3(1, 0, 0)));
      sub.add(mats.fit, orientTo(armGeo(-0.1, 0.1), V3(-1, 0, 0)));
      nutAndBolt(sub, mats, V3(1, 0, 0), 0.068, V3(0, 1, 0));
      nutAndBolt(sub, mats, V3(-1, 0, 0), 0.068, V3(0, 1, 0));
      supports = null;
    } else {
      if (name === '3-weg') dirs = [V3(Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), V3(-Math.cos(20 * DEG), -Math.sin(20 * DEG), 0), V3(0, 0, 1)];
      else if (name === '3-weg-grond') dirs = [V3(1, 0, 0), V3(0, 0, 1), V3(0, 1, 0)];
      else dirs = [V3(0, -1, 0), V3(0, 0, 1), V3(0, 0, -1), V3(-Math.cos(30 * DEG), Math.sin(30 * DEG), 0)];
      connector(sub, mats, dirs, { up: V3(0, 1, 0).add(V3(0.3, 0, 0.2)).normalize() });
      const ends = dirs.map((d) => d.clone().normalize().multiplyScalar(0.12));
      supports = name === '4-weg' ? [ends[0], ends[1], ends[2]] : name === '3-weg-grond' ? [ends[0], ends[1], V3(0, 0, 0)] : ends;
    }
    const geos = []; for (const [, list] of sub.bins) geos.push(...list);
    if (supports) layFlat(geos, supports);
    const yaw = [28, -20, 35, -10][i % 4] * DEG;
    let yMin = Infinity;
    for (const g of geos) { g.rotateY(yaw); g.computeBoundingBox(); yMin = Math.min(yMin, g.boundingBox.min.y); }
    for (const [mat, list] of sub.bins) for (const g of list) { g.translate(slotX[i], -yMin, 0.12 + (i % 2) * 0.04); bins.add(mat, g); }
  });
  if (parts.includes('buis')) {
    const L = Number(p.tubeLength ?? 1.59);
    const r0 = 0.019, ri = 0.0178;
    const t = K.lathe([[ri, 0.06], [ri, L - 0.06], [ri, L], [r0, L], [r0, 0], [ri, 0], [ri, 0.06]].reverse(), 40);
    // seam line
    const seam = G.roundedBox(0.0016, L - 0.004, 0.0006, 0.0003); seam.translate(0, L / 2, r0 - 0.0001);
    const geos = [t, seam];
    for (const g of geos) { g.rotateZ(-Math.PI / 2); g.translate(-L / 2, r0, 0); g.rotateY(-32 * DEG); g.translate(0.02, 0, -0.22); }
    bins.add(mats.tube, t); bins.add(mats.tube, seam);
    // bolt holes near both ends (dark)
    for (const s of [-1, 1]) {
      const c = V3(s * (L / 2 - 0.03), r0 * 2 - 0.0002, 0).applyAxisAngle(V3(0, 1, 0), -32 * DEG).add(V3(0.02, 0, -0.22));
      bins.add(M.rubber('#0E0E0E'), G.tube(c.clone().add(V3(0, -0.001, 0)), c.clone().add(V3(0, 0.0004, 0)), 0.0042, 14));
    }
  }
  const g = K.finish(bins, 'tubeFittings');
  return {
    object: g,
    detail: { target: [slotX[1] || 0, 0.05, 0.14], size: 0.25, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 30 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { parts },
  };
}
