// Cloth-shape helpers for the tents-other group (round 6: "the large fabric structures must
// read as fabric"). Shared by models/frameTent.js (buizenframe partytent, opslagtent, eindwand,
// carport via buildFrameTent) and models/marketStall.js. Kept out of tentkit*.js so the other
// tent models keep their pixels.
//
// Everything here is shape, not shading: the engine lights it. The scale of every feature is
// chosen so it reads in a 1200-2000 px catalogue hero of a 4 x 8 m tent (~90-150 px per metre):
//  - fanWrinkles: tension wrinkles that fan out of a point where the cover is pulled (eave
//    corner over a leg, ridge node, strap), 15-25 cm apart, a few mm deep, dying out over
//    50-80 cm. Several fans add up; a panel window keeps them off the supported edges;
//  - festoon: the scallop of a hem hung from points (valance on ball bungees, wall on hooks);
//  - grommet / grommetHole: a pressed brass/zinc eyelet ring and the dark hole with the cord;
//  - ballBungee: the black elastic loop with its ball that ties a valance or wall to a tube.
import * as THREE from 'three';
import * as G from './geom.js';
import * as K from './tentkit.js';

const V3 = G.V3;
const TAU = Math.PI * 2;
export const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// deterministic hash -> [0, 1)
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// Tension wrinkles fanning out of pull points, in a 2D surface parametrisation (a, b) in metres.
// fans: [{ a, b, da, db (unit direction into the cloth), A (m), lam (spacing at mid reach, m),
//          reach (m), spread (half angle, rad), w0 (m: no wrinkle closer than this) }]
// returns (a, b) -> displacement (m, along the surface normal; + = out of the surface)
export function fanWrinkles(fans) {
  const F = fans.map((f, i) => {
    const l = Math.hypot(f.da, f.db) || 1;
    const k = (TAU * (f.reach * 0.5)) / (f.lam || 0.2); // angular frequency: spacing lam at reach/2
    return { ...f, da: f.da / l, db: f.db / l, k, ph: f.phase ?? hash(i + 1.7) * TAU, spread: f.spread ?? 0.62, w0: f.w0 ?? 0.05 };
  });
  return (a, b) => {
    let w = 0;
    for (const f of F) {
      const pa = a - f.a, pb = b - f.b;
      const d = pa * f.da + pb * f.db;                 // along the pull
      if (d <= 0) continue;
      const q = -pa * f.db + pb * f.da;                // across the pull
      const r = Math.hypot(d, q);
      if (r > f.reach * 2.4) continue;
      const th = Math.atan2(q, d);
      if (Math.abs(th) > f.spread) continue;
      const win = Math.cos((0.5 * Math.PI * th) / f.spread);
      const env = sst(0, f.w0 * 2, r) * Math.exp(-r / f.reach);
      // ridges along the rays (parallel to the pull), slightly irregular depth per ridge
      const s = f.k * th + f.ph;
      const irr = 0.75 + 0.5 * hash(Math.floor(s / TAU) + f.ph);
      w += f.A * env * win * win * irr * (0.5 + 0.5 * Math.cos(s)) ;
    }
    return w;
  };
}

// Scallop profile of a hem hung from points `pitch` apart, the first at `first`:
// returns { d: 0 at a hang point .. 1 midway, ph: signed phase in [-0.5, 0.5] }
export function festoon(s, first, pitch) {
  const t = (s - first) / pitch;
  const ph = t - Math.round(t);
  return { d: Math.abs(ph) * 2, ph, k: Math.round(t) };
}

// Pressed eyelet (grommet) on a cloth surface: flat ring of outer radius R facing `nrm`
export function grommet(at, nrm, { R = 0.011, r = 0.0062, t = 0.0022, segs = 18 } = {}) {
  const g = new THREE.TorusGeometry((R + r) / 2, (R - r) / 2 * 0.9, 6, segs);
  g.scale(1, 1, t / ((R - r) * 0.9));
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), nrm.clone().normalize());
  g.applyQuaternion(q);
  g.translate(at.x, at.y, at.z);
  return g;
}
// the hole of the eyelet with the dark cord running through it
export function grommetHole(at, nrm, { r = 0.0064 } = {}) {
  const g = new THREE.CircleGeometry(r, 14);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), nrm.clone().normalize());
  g.applyQuaternion(q);
  const p = at.clone().addScaledVector(nrm, 0.0004);
  g.translate(p.x, p.y, p.z);
  return g;
}

// Ball bungee: the elastic loop runs from the eyelet (at, on the cloth facing nrm) up and round
// the tube centre `tube` (radius rt) and back, the ball sits just outside the eyelet.
export function ballBungee(at, nrm, tube, rt, { rc = 0.0026, ball = 0.0105 } = {}) {
  const parts = [];
  const n = nrm.clone().normalize();
  const b = at.clone().addScaledVector(n, ball * 0.85);
  const s = new THREE.SphereGeometry(ball, 12, 9); s.translate(b.x, b.y, b.z); parts.push(s);
  // loop: from the ball up over the outside of the cloth to above the tube, round the tube and
  // back down inside (only the outer leg and the top are visible)
  const up = tube.clone().sub(at); const h = up.y;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const f = i / 14;
    const p = at.clone().addScaledVector(n, ball * 0.4 + 0.004 * Math.sin(Math.PI * f));
    p.y += h * f * 0.94;
    pts.push(p);
  }
  // over the top of the tube
  const c = tube.clone();
  const out0 = n.clone(); out0.y = 0; out0.normalize();
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    pts.push(c.clone().addScaledVector(out0, Math.cos(a) * (rt + rc)).add(V3(0, Math.sin(a) * (rt + rc), 0)));
  }
  parts.push(K.sweep(pts, rc, 5));
  return G.merge(parts);
}

// smooth value noise in 1D (deterministic), for irregular fold depths along a hem
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash(i + seed * 17.3) * (1 - u) + hash(i + 1 + seed * 17.3) * u) * 2 - 1;
}
