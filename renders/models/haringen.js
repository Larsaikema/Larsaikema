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
  // along +Z from z = 0 (head) to z = L (tip); profile rotated so the corner points up (+Y)
  // and both flange edges rest on the floor
  const prof = angleProfile(w, t);
  const rot = (x, y) => { const a = -135 * DEG; return [Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y]; };
  const ns = 60, tipLen = 0.07;
  const zs = [];
  for (let i = 0; i <= ns; i++) { const s = i / ns; zs.push(s < 0.5 ? s * 2 * (L - tipLen) * 0.98 : (L - tipLen) * 0.98 + (s - 0.5) * 2 * (tipLen + (L - tipLen) * 0.02)); }
  const rows = zs.map((z) => {
    const k = z > L - tipLen ? Math.max(0.06, 1 - (z - (L - tipLen)) / tipLen) : 1;
    return prof.map(([x, y]) => {
      // flanges shorten towards the tip (diagonal cut), thickness stays
      const sx = x > t ? t + (x - t) * k : x, sy = y > t ? t + (y - t) * k : y;
      const [rx, ry] = rot(sx, sy);
      return V3(rx, ry, z);
    });
  });
  const g = K.gridGeometry(rows, { closedU: false, flip: true });
  bins.add(mat, g);
  // head end cap (flat saw cut)
  const cap = new THREE.Shape();
  prof.forEach(([x, y], i) => { const [rx, ry] = rot(x, y); if (i === 0) cap.moveTo(rx, ry); else cap.lineTo(rx, ry); });
  const cg = new THREE.ShapeGeometry(cap); cg.rotateY(Math.PI); bins.add(mat, cg);
  // the profile bottom: flange edges rest at y = min
  return { yMin: Math.min(...prof.map(([x, y]) => rot(x, y)[1])) };
}

export function haringen(p = {}) {
  const n = Number(p.count ?? 3);
  const len = Number(p.length ?? 0.75);
  const type = p.type || (len >= 0.4 ? 'hoekijzer' : 'wand');
  const bins = new G.PartBin();
  const extras = [];
  if (type === 'hoekijzer') {
    const galv = K.hotDipGalv();
    const w = 0.03, t = 0.003;
    for (let i = 0; i < n; i++) {
      const sub = new G.PartBin();
      const { yMin } = angleIronPeg(sub, galv, { L: len, w, t, seed: i });
      // welded hook: 10 mm round bar along the corner ridge at the head, then up and over
      // into an open hook that turns back towards the tip
      const rb = 0.005;
      const ridgeY = Math.SQRT2 * 0; // corner sits at the origin of the rotated profile
      const yC = rb + 0.0005; // bar lies on the ridge
      const pts = [];
      const zW0 = 0.075, zW1 = 0.006;
      for (let k = 0; k <= 10; k++) pts.push(V3(0, yC, zW0 - (zW0 - zW1) * (k / 10)));
      // bend: up and back over the head -> hook opening towards the tip
      const R = 0.022;
      const c = V3(0, yC + R, zW1 - 0.012);
      for (let k = 1; k <= 26; k++) {
        const a = -Math.PI / 2 - (k / 26) * Math.PI * 1.25; // from below the centre round the back to the top and forward
        pts.push(V3(0, c.y + Math.sin(a) * R, c.z + Math.cos(a) * R));
      }
      const last = pts[pts.length - 1];
      const dir = last.clone().sub(pts[pts.length - 2]).normalize();
      for (let k = 1; k <= 4; k++) pts.push(last.clone().addScaledVector(dir, 0.004 * k));
      sub.add(galv, K.tubeAlong(pts, rb, 14));
      // weld beads either side of the bar on the ridge
      for (const sx of [-1, 1]) {
        const wp = [];
        for (let k = 0; k <= 20; k++) { const z = zW1 + 0.004 + (zW0 - zW1 - 0.01) * (k / 20); wp.push(V3(sx * rb * 0.75, yC - rb * 0.55 + 0.0006 * Math.sin(k * 2.1), z)); }
        sub.add(galv, K.tubeAlong(wp, 0.0022, 8));
      }
      // place: fan + stagger, resting on the flange edges
      const yaw = (i - (n - 1) / 2) * 5 * DEG;
      const x = (i - (n - 1) / 2) * 0.075, z = ((i % 2) * 0.025) - len / 2;
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, -yMin, z);
      for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(m); bins.add(mat, geo); }
    }
    const g = K.finish(bins, `haringen hoekijzer ${n}x${len}`, extras);
    // lie diagonally in the frame
    g.rotation.y = -100 * DEG;
    const root = new THREE.Group(); root.add(g);
    return {
      object: root,
      detail: { target: [0, 0.03, 0], size: 0.22, azimuth: 30, elevation: 30 },
      view: { hero: { elevation: 32 } },
      rig: { default: { key: { azimuth: -70, elevation: 40 }, contact: { strength: 0.85, h0: 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
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
