// Koppelset easy-up: two double clamps that lock the legs of two tents together.
//
// { line, count }
//   line  'professional' (50 mm hex legs, default) | 'premium' (40 mm)
//   count clamps in the set (2)
// Each clamp: an aluminium centre block between two hinged jaws. Both jaws are extrusions
// that wrap three faces of a hex leg (6 mm wall, rounded edges); each hinges on a steel pin
// at the back of the block and closes at the front with a zinc-plated wing bolt that pulls
// the jaw against the block. Height 60 mm. The set lies as a tidy pair: one clamp standing,
// one lying on its side, jaws closed, wing bolts towards the viewer.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

// shape helpers in the XZ plane (shape y = -z)
function poly(pts) { const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); s.closePath(); return s; }

function clamp(bins, mats, { AF = 0.05, H = 0.06 } = {}) {
  const wall = 0.006, gapC = 0.0;
  const Rv = AF / 2 / Math.cos(Math.PI / 6); // hex circumradius, flats facing +-x
  const cb = 0.012; // centre block half-thickness (x)
  // leg centres at x = +-(cb + AF/2)
  const xc = cb + AF / 2;
  // centre block: x in [-cb, cb], z in [-(Rv + 0.012), Rv + 0.012] with the hinge knuckles at the back
  const zb = Rv * 0.5 + 0.004;
  bins.add(mats.alu, K.extrudeY(poly([[-cb, -zb - 0.016], [cb, -zb - 0.016], [cb, zb + 0.016], [-cb, zb + 0.016]].reverse()), H, { bevel: 0.0015, bevelSegs: 2 }));
  for (const s of [-1, 1]) {
    // jaw: offset of the far half of the hex (three faces) + two tabs back to the block
    const cx = s * xc;
    const hexPt = (a, r) => [cx + Math.cos(a) * r, Math.sin(a) * r];
    // hex vertices with flats facing x: vertices at 30 + k*60 deg
    const angs = s > 0 ? [-90, -30, 30, 90] : [90, 150, 210, 270];
    const inner = angs.map((d) => hexPt(d * DEG, Rv));
    const outer = angs.map((d) => hexPt(d * DEG, Rv + wall / Math.cos(Math.PI / 6)));
    // tabs: from the top/bottom vertices (z = +-Rv) inwards along z to the block faces
    const tabIn = Rv, tabOut = Rv + wall;
    const pts = [];
    pts.push([s * cb, tabIn]); // inner tab corner at the block, front
    inner.slice().reverse().forEach((q) => pts.push(q)); // hmm order fixed below
    const pathPts = [];
    // build CCW outline: start at block front-inner, go along inner hex (front -> back), to block back-inner,
    // then back-outer, outer hex (back -> front), front-outer
    const innerF2B = s > 0 ? inner.slice().reverse() : inner.slice(); // from z=+Rv to z=-Rv
    const outerB2F = s > 0 ? outer.slice() : outer.slice().reverse();
    pathPts.push([s * (cb + 0.0005), tabIn]);
    innerF2B.forEach((q) => pathPts.push(q));
    pathPts.push([s * (cb + 0.0005), -tabIn]);
    pathPts.push([s * (cb + 0.0005), -tabOut - 0.003]);
    outerB2F.forEach((q) => pathPts.push(q));
    pathPts.push([s * (cb + 0.0005), tabOut + 0.003]);
    // ensure CCW for three (signed area)
    let A = 0; for (let i = 0; i < pathPts.length; i++) { const [x1, z1] = pathPts[i], [x2, z2] = pathPts[(i + 1) % pathPts.length]; A += x1 * (-z2) - x2 * (-z1); }
    if (A < 0) pathPts.reverse();
    bins.add(mats.alu, K.extrudeY(poly(pathPts), H, { bevel: 0.0015, bevelSegs: 2 }));
    // hinge knuckles + pin at the back (z = -(Rv + wall/2)), wing bolt at the front
    const zk = -(Rv + wall / 2 + 0.003);
    const xk = s * (cb + 0.006);
    for (let k = 0; k < 3; k++) {
      const y0 = k * (H / 3) + 0.001, y1 = (k + 1) * (H / 3) - 0.001;
      bins.add(mats.alu, G.tube(V3(xk, y0, zk), V3(xk, y1, zk), 0.0075, 24));
    }
    bins.add(mats.zinc, G.tube(V3(xk, -0.0015, zk), V3(xk, H + 0.0015, zk), 0.0042, 16));
    // wing bolt through the front tab into the block (axis along x), wing head outside
    const zf = Rv + wall / 2 + 0.003;
    const xa = s * (cb + 0.012);
    bins.add(mats.zinc, G.tube(V3(-s * cb * 0.5, H / 2, zf), V3(xa + s * 0.004, H / 2, zf), 0.0038, 12));
    bins.add(mats.alu, G.tube(V3(s * (cb - 0.002), H / 2, zf), V3(s * (cb + 0.012), H / 2, zf), 0.0085, 20)); // boss
    const wn = K.wingNutGeo(1.15);
    // wing nut axis +Y -> +x*s
    wn.applyMatrix4(new THREE.Matrix4().makeBasis(V3(0, 1, 0), V3(s, 0, 0), V3(0, 0, -s)).setPosition(V3(xa + s * 0.0035, H / 2, zf)));
    bins.add(mats.zinc, wn);
  }
}

export function tentCoupler(p = {}) {
  const pro = String(p.line || 'professional') !== 'premium';
  const AF = pro ? 0.0505 : 0.0405;
  const n = Number(p.count ?? 2);
  const mats = { alu: M.aluminium({ tone: '#C3C7CB', roughness: 0.34 }), zinc: K.zinc() };
  const bins = new G.PartBin();
  const H = 0.06;
  const poses = [
    { m: new THREE.Matrix4().makeRotationY(-8 * DEG).setPosition(-0.02, 0, -0.06) },
    // second clamp lying on its back (jaw axis vertical -> horizontal), in front
    { m: new THREE.Matrix4().makeRotationY(22 * DEG).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).setPosition(0.03, 0, 0.1) },
  ];
  for (let i = 0; i < n; i++) {
    const sub = new G.PartBin();
    clamp(sub, mats, { AF, H });
    const pose = poses[i % 2].m.clone();
    if (i >= 2) pose.premultiply(new THREE.Matrix4().makeTranslation(0.2 * Math.floor(i / 2), 0, 0));
    let yMin = Infinity;
    for (const [, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(pose); geo.computeBoundingBox(); yMin = Math.min(yMin, geo.boundingBox.min.y); }
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.translate(0, -yMin, 0); bins.add(mat, geo); }
  }
  const g = K.finish(bins, `tentCoupler ${pro ? 50 : 40}`);
  return {
    object: g,
    detail: { target: [0, H / 2, 0], size: 0.16, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 24 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.005, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { pro, n },
  };
}
