// Second helper module for the tents/canopies/sails group (round 2: catalogue-grade rebuild).
// Additive to js/tentkit.js (which stays as is, easyUpFrame uses it too):
//  - archCurve(): centre line of an inflated X-frame arch (vertical leg, bend, straight hip,
//    apex round-over), solved so it lands exactly on the apex; sampled by arc length
//  - membranePatch(): force-density membrane on a 4-sided grid with pinned boundaries (taut
//    canopy faces, awnings): uniform stress, optional self weight, returns rows of points
//  - polyline helpers (resample by arc length, offset along normals), stitch lines, welts
//  - frameProxy()/noFrame(): steer the auto-framing (re-exported from softGoods)
//  - glowLight(): a real point light for lit products (light that also falls on the product)
// Units: metres, Y up, front +Z.
import * as THREE from 'three';
import * as G from './geom.js';
import * as M from './materials.js';
import * as K from './tentkit.js';
import { frameProxy, noFrame } from './softGoods.js';

export { frameProxy, noFrame };
export const V3 = G.V3;
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------
// X-frame arch. In the vertical plane through the leg: rho = horizontal distance from the
// centre, y = height. Leg vertical from yFoot to yb, a bend of radius Rb into a straight hip at
// pitch alpha, a round-over of radius Ra to a horizontal tangent at (0, Yc). alpha and the
// straight length are solved from the end conditions.
export function archCurve({ Rc, yb, Yc, Rb, Ra, yFoot = 0.1 }) {
  const H = Yc - yb;
  const geo = (a) => {
    const Ls = (Rc - Rb * (1 - Math.sin(a)) - Ra * Math.sin(a)) / Math.cos(a);
    return { Ls, v: Rb * Math.cos(a) + Ls * Math.sin(a) + Ra * (1 - Math.cos(a)) };
  };
  let lo = 0.02, hi = 1.3;
  for (let it = 0; it < 80; it++) { const m = (lo + hi) / 2; if (geo(m).v > H) hi = m; else lo = m; }
  const al = (lo + hi) / 2, Ls = Math.max(0, geo(al).Ls);
  const P = [];
  const nV = 48;
  for (let i = 0; i <= nV; i++) P.push([Rc, yFoot + ((yb - yFoot) * i) / nV]);
  const beta = Math.PI / 2 - al, nB = 90;
  for (let i = 1; i <= nB; i++) { const th = (beta * i) / nB; P.push([Rc - Rb + Rb * Math.cos(th), yb + Rb * Math.sin(th)]); }
  const p1 = P[P.length - 1];
  const nS = 60;
  for (let i = 1; i <= nS; i++) { const t = (Ls * i) / nS; P.push([p1[0] - t * Math.cos(al), p1[1] + t * Math.sin(al)]); }
  const nA = 60;
  for (let i = 1; i <= nA; i++) { const ps = al * (1 - i / nA); P.push([Ra * Math.sin(ps), Yc - Ra + Ra * Math.cos(ps)]); }
  // arc length
  const S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = S[S.length - 1];
  const sBend = S[nV], sStraight = S[nV + nB], sApex = S[nV + nB + nS];
  let seg = 0;
  // sample at arc length s: rho, y and the unit tangent (dRho, dY) towards the apex
  function at(s) {
    s = Math.min(total, Math.max(0, s));
    if (S[seg] > s) seg = 0;
    while (seg < S.length - 2 && S[seg + 1] < s) seg++;
    const t = (s - S[seg]) / Math.max(1e-9, S[seg + 1] - S[seg]);
    const a = P[seg], b = P[seg + 1];
    const rho = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    // smooth tangent: central difference over +-1 cm
    const e = 0.01;
    const s0 = Math.max(0, s - e), s1 = Math.min(total, s + e);
    const pa = raw(s0), pb = raw(s1);
    let tr = pb[0] - pa[0], ty = pb[1] - pa[1];
    const l = Math.hypot(tr, ty) || 1; tr /= l; ty /= l;
    return { rho, y, tr, ty, s };
  }
  function raw(s) {
    let k = 0; while (k < S.length - 2 && S[k + 1] < s) k++;
    const t = (s - S[k]) / Math.max(1e-9, S[k + 1] - S[k]);
    return [P[k][0] + (P[k + 1][0] - P[k][0]) * t, P[k][1] + (P[k + 1][1] - P[k][1]) * t];
  }
  // arc length where rho first drops below a value (on the hip / apex part)
  function sAtRho(rho) {
    for (let i = nV; i < P.length - 1; i++) if (P[i + 1][0] <= rho) {
      const t = (P[i][0] - rho) / Math.max(1e-9, P[i][0] - P[i + 1][0]);
      return S[i] + (S[i + 1] - S[i]) * t;
    }
    return total;
  }
  // height of the centre line at plan distance rho (hip part)
  function yAtRho(rho) { return at(sAtRho(rho)).y; }
  return { at, total, sBend, sStraight, sApex, alpha: al, Ls, sAtRho, yAtRho, Rc, yb, Yc, Rb, Ra };
}

// ---------------------------------------------------------------------------------------
// Force-density membrane on a grid (nu+1) x (nv+1). boundary(i, j) returns a V3 for every
// pinned node (i = 0 / nu, j = 0 / nv, plus any extra pins it wants) or null for a free node;
// init(i, j) the starting position of free nodes. q(i, j, dir) the force density of the edge
// from (i,j) in direction dir ('u' or 'v'), default 1. load: [x, y, z] per node (self weight).
// Returns rows[j][i] of V3.
export function membranePatch(nu, nv, { pin, init, q = null, load = null, iters = 700, omega = 1.85, stress = 0 }) {
  const id = (i, j) => j * (nu + 1) + i;
  const net = new K.Net((nu + 1) * (nv + 1));
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = pin(i, j);
    if (p) net.pin(id(i, j), p.x, p.y, p.z);
    else { const s = init(i, j); net.set(id(i, j), s.x, s.y, s.z); }
  }
  const base = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    if (i < nu) { const qq = q ? q(i, j, 'u') : 1; net.edge(id(i, j), id(i + 1, j), qq); base.push(qq); }
    if (j < nv) { const qq = q ? q(i, j, 'v') : 1; net.edge(id(i, j), id(i, j + 1), qq); base.push(qq); }
  }
  if (load) for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const L = typeof load === 'function' ? load(i, j) : load;
    if (L) net.addLoad(id(i, j), L[0], L[1], L[2]);
  }
  net.solve({ iters, omega });
  // stress > 0: re-solve with force densities ~ 1 / length (uniform membrane stress instead of
  // uniform force density: a minimal-surface-like form that does not follow the grid layout)
  for (let it = 0; it < stress; it++) {
    const E = net.edges, P = net.P, m = E.length / 3;
    let Lm = 0; const Ls = new Float64Array(m);
    for (let e = 0; e < m; e++) { const a = E[e * 3] * 3, b = E[e * 3 + 1] * 3; Ls[e] = Math.hypot(P[a] - P[b], P[a + 1] - P[b + 1], P[a + 2] - P[b + 2]); Lm += Ls[e]; }
    Lm /= m;
    for (let e = 0; e < m; e++) E[e * 3 + 2] = base[e] * Lm / Math.max(Ls[e], 0.25 * Lm);
    net.solve({ iters, omega });
  }
  const rows = [];
  for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) r.push(net.get(id(i, j))); rows.push(r); }
  return rows;
}

// ---------------------------------------------------------------------------------------
// polylines
export function resample(pts, step) {
  const out = [pts[0].clone()];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = a.distanceTo(b);
    let t = step - carry;
    while (t <= d) { out.push(a.clone().lerp(b, t / d)); t += step; }
    carry = d - (t - step);
  }
  if (out[out.length - 1].distanceTo(pts[pts.length - 1]) > step * 0.2) out.push(pts[pts.length - 1].clone());
  return out;
}
export function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; }

// vertex normals of a grid (rows[j][i]) by central differences (unnormalised orientation:
// d/du x d/dv)
export function gridNormal(rows, i, j) {
  const nv = rows.length - 1, nu = rows[0].length - 1;
  const a = rows[j][Math.max(0, i - 1)], b = rows[j][Math.min(nu, i + 1)];
  const c = rows[Math.max(0, j - 1)][i], d = rows[Math.min(nv, j + 1)][i];
  const du = b.clone().sub(a), dv = d.clone().sub(c);
  return V3().crossVectors(du, dv).normalize();
}

// a sewn line on a surface: thin thread tube along pts lifted by `lift` along nrm[]
export function stitchLine(pts, nrm, { lift = 0.0012, r = 0.0011, radial = 4 } = {}) {
  const q = pts.map((p, i) => p.clone().addScaledVector(nrm[i], lift));
  return K.sweep(q, r, radial);
}

// flat band (webbing, velcro strap, hem tape) along a path on a surface: width w across the
// path in the surface plane, thickness t along the normal, sitting on the surface
export function bandAlong(pts, nrm, w, t, { lift = 0 } = {}) {
  const n = pts.length;
  const rows = [];
  const cross = [-1, -1, 1, 1, -1];
  const up = [0, 1, 1, 0, 0];
  for (let k = 0; k < cross.length; k++) {
    const row = [];
    for (let i = 0; i < n; i++) {
      const T = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
      const B = V3().crossVectors(nrm[i], T).normalize();
      row.push(pts[i].clone().addScaledVector(B, cross[k] * w / 2).addScaledVector(nrm[i], lift + up[k] * t));
    }
    rows.push(row);
  }
  return K.gridGeometry(rows);
}

// ---------------------------------------------------------------------------------------
// light: a point light that lights the product itself (lamp on in a tent). Not a mesh, so it
// never affects framing, exposure or the floor passes; the floor gets its spill from
// lightKit.floorGlow.
export function pointLight(pos, { color = '#FFE7C4', intensity = 1, distance = 0, decay = 2 } = {}) {
  const l = new THREE.PointLight(color, intensity, distance, decay);
  l.position.copy(pos);
  l.castShadow = false;
  return l;
}

// thread / patch materials that never need vertex colours
export const thread = (hex) => M.tentThread(hex);
export const patch = (hex) => K.pvcPatch(hex);

// ---------------------------------------------------------------------------------------
// Catalogue tent light rig, round 2: the current easy-up rig (models/easyUpTent.js tentRig,
// which is not exported) so every tent in the shop is lit the same way: studio reflections with
// two low wall cards and two tall strip boxes, a feathered softbox spot from front-left, fill
// from behind-right, a tilted dome; white cloth gets the higher white key, the late shoulder
// and exposure 0.58; with walls the key beam is wider and aimed at the walls' half height.
// enclosure: rig.interior for tents with three or more hanging walls (engine `interior`).
import { STUDIO_ENV_DEFAULT } from './studioEnv.js';
export function tentRig2(colorHex, { walled = false, enclosure = null, print = false } = {}) {
  const L = K.lumOf(colorHex);
  const white = L > 0.7 && !print, dark = L < 0.1;
  const key0 = { azimuth: -72, elevation: 32, intensity: 4.86, cone: 10, distanceRel: 1.78, aimRel: [0.0, 0.4, 0.69], angle: 40, penumbra: 1.0 };
  const key = walled ? { ...key0, angle: 60, aimRel: [0.0, 0.0, 0.69] } : key0;
  const wallCards = walled ? [
    { az: -66, el: -15, w: 72, h: 40, I: dark ? 11 : white ? 3.4 : 6, soft: 0.95, hot: 0.55 },
    { az: 112, el: -15, w: 56, h: 36, I: dark ? 2.0 : 1.3, soft: 0.95, hot: 0.55 },
  ] : [
    { az: -62, el: -10, w: 64, h: 30, I: 3.4, soft: 0.95, hot: 0.6 },
    { az: 112, el: -10, w: 54, h: 28, I: 1.3, soft: 0.95, hot: 0.6 },
  ];
  return {
    env: 'studio', envIntensity: 1.0,
    envStudio: { boxes: [...STUDIO_ENV_DEFAULT.boxes, ...wallCards,
      { az: -100, el: 2, w: 14, h: 64, I: 3.4, soft: 0.35, hot: 0.25 },
      { az: 136, el: 2, w: 12, h: 64, I: 1.4, soft: 0.35, hot: 0.25 }] },
    key,
    floorKey: { azimuth: -15, elevation: 80, cone: 16, intensity: 3.0 },
    keyShadow: 0.46,
    rim: { azimuth: -155, elevation: 35, intensity: 0.3 },
    fill: { azimuth: 100, elevation: 12, intensity: 3.0 },
    bounce: { intensity: 0.5 },
    dome: { count: 2, intensity: 2.4, maxZenith: 62, tilt: 25, tiltAzimuth: -72 },
    exposure: white ? 0.58 : 'auto',
    interior: enclosure,
    ...(white ? {
      key: { ...key, azimuth: -70, elevation: 40, distanceRel: 2.3, aimRel: [0.3, 0.55, 0.45], angle: walled ? 50 : 34, intensity: 4.8 },
      fill: { azimuth: 100, elevation: 12, intensity: 2.2 },
      bounce: { azimuth: -20, elevation: -25, intensity: 1.5 },
      dome: { count: 2, intensity: 2.0, maxZenith: 62, tilt: 25, tiltAzimuth: -72 },
      toneMapping: 'neutral', shoulder: 0.88,
    } : {}),
    exposureAuto: { ref: 0.2, base: 0.64, power: 0.22, min: 0.45, max: 0.72 },
    groundSplit: true,
    shadowFloor: 0.6,
    groundAO: { strength: walled ? 0.5 : 0.32, maxZenith: 75 },
    contact: { res: 2048, h0: 0.03, strength: 1.0, blur: 2.6, wide: { h0: 0.05, sigma: 0.028, strength: 0.42 } },
  };
}
