// Shared helpers for the parts & accessories group (bags, straps, fittings, ballast, small
// hardware). Geometry: swept profiles along paths, strap/webbing ribbons, row grids, soft
// bag bodies; materials: 600D oxford, velcro, PVC tarpaulin, concrete, chestnut wood,
// hot-dip galvanised spangle, clear PVC, ABS; print/label textures from brand SVG paths.
// Units metres, Y up; everything deterministic (seeded noise only).
import * as THREE from 'three';
import * as G from './geom.js';
import * as M from './materials.js';
import * as TX from './textures.js';
import { rng, makeNoise2 } from './rng.js';
import { resolvePrint } from './brandPrints.js';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const V3 = G.V3;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

const cache = new Map();
export function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

// ---------------------------------------------------------------------------------------
// geometry

// Grid from rows of points (rows[j][i]); closedU joins the ring seam (normals + one extra column).
export function gridGeometry(rows, { closedU = false, flip = false, uvRows = null } = {}) {
  const nv = rows.length, nu = rows[0].length;
  const cols = closedU ? nu + 1 : nu;
  const pos = new Float32Array(nv * cols * 3), uv = new Float32Array(nv * cols * 2);
  // uv in metres: u along the row (arc length), v down the rows (mean spacing)
  const vAcc = [0];
  for (let j = 1; j < nv; j++) {
    let d = 0; for (let i = 0; i < nu; i++) d += rows[j][i].distanceTo(rows[j - 1][i]);
    vAcc.push(vAcc[j - 1] + d / nu);
  }
  for (let j = 0; j < nv; j++) {
    let ua = 0;
    for (let i = 0; i < cols; i++) {
      const p = rows[j][i % nu];
      if (i > 0) ua += p.distanceTo(rows[j][(i - 1) % nu]);
      const k = j * cols + i;
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      uv[k * 2] = ua; uv[k * 2 + 1] = uvRows ? uvRows[j] : vAcc[j];
    }
  }
  const idx = [];
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < cols - 1; i++) {
    const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (closedU) {
    const n = g.attributes.normal;
    for (let j = 0; j < nv; j++) {
      const a = j * cols, b = a + cols - 1;
      const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return g;
}

// Rotation-minimising frames along a polyline. `normals` (array of V3 or fn(i)) pins the
// N axis (e.g. a strap lying on a surface); otherwise parallel transport from `up`.
export function pathFrames(pts, { normals = null, up = null, closed = false } = {}) {
  const n = pts.length, T = [], N = [], B = [], S = [0];
  for (let i = 0; i < n; i++) {
    const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)], b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
    T.push(b.clone().sub(a).normalize());
    if (i > 0) S.push(S[i - 1] + pts[i].distanceTo(pts[i - 1]));
  }
  if (normals) {
    for (let i = 0; i < n; i++) {
      const nn = (typeof normals === 'function' ? normals(i) : normals[i]).clone();
      nn.addScaledVector(T[i], -nn.dot(T[i])).normalize();
      N.push(nn); B.push(V3().crossVectors(T[i], nn).normalize());
    }
  } else {
    let ref = up ? up.clone() : (Math.abs(T[0].y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0));
    let nn = ref.addScaledVector(T[0], -ref.dot(T[0])).normalize();
    for (let i = 0; i < n; i++) {
      if (i > 0) {
        // parallel transport: rotate nn by the rotation taking T[i-1] to T[i]
        const q = new THREE.Quaternion().setFromUnitVectors(T[i - 1], T[i]);
        nn.applyQuaternion(q); nn.addScaledVector(T[i], -nn.dot(T[i])).normalize();
      }
      N.push(nn.clone()); B.push(V3().crossVectors(T[i], nn).normalize());
    }
  }
  return { T, N, B, S };
}

// Sweep a closed 2D profile ([x, y] pairs; x along B, y along N) along a path.
// scale(i, s) -> number or [sx, sy]; caps close both ends with a fan.
export function sweep(pts, profile, { normals = null, up = null, closed = false, scale = null, caps = true } = {}) {
  const F = pathFrames(pts, { normals, up, closed });
  const rows = [];
  for (let i = 0; i < pts.length; i++) {
    const k = scale ? scale(i, F.S[i]) : 1;
    const kx = Array.isArray(k) ? k[0] : k, ky = Array.isArray(k) ? k[1] : k;
    rows.push(profile.map(([x, y]) => pts[i].clone().addScaledVector(F.B[i], x * kx).addScaledVector(F.N[i], y * ky)));
  }
  if (closed) rows.push(rows[0].map((p) => p.clone()));
  // rows run along the path: transpose so the ring is u and the path is v
  const g = gridGeometry(rows, { closedU: true, flip: true });
  if (!caps || closed) return g;
  const capGeo = (row, c, nrm, flip) => {
    const pos = [c.x, c.y, c.z], idx = [], uv = [0, 0];
    row.forEach((p) => { pos.push(p.x, p.y, p.z); uv.push(p.x, p.z); });
    for (let i = 0; i < row.length; i++) { const a = 1 + i, b = 1 + ((i + 1) % row.length); if (flip) idx.push(0, b, a); else idx.push(0, a, b); }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    cg.setIndex(idx); cg.computeVertexNormals();
    return cg;
  };
  const r0 = rows[0], r1 = rows[rows.length - 1];
  const c0 = r0.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / r0.length);
  const c1 = r1.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / r1.length);
  return G.merge([g, capGeo(r0, c0, null, false), capGeo(r1, c1, null, true)]);
}

export const circle = (r, n = 16) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * r, Math.sin((i / n) * TAU) * r]);
export function rrect(w, h, r, segs = 3) { return G.roundedRectProfile(w, h, r, segs).map((p) => [p.x, p.y]); }

export const tubeAlong = (pts, r, radial = 14, opts = {}) => sweep(pts, circle(r, radial), opts);
// Flat strap: width along B, thickness along N (N = strap face normal, pass `normals`).
export const strapAlong = (pts, w, t, opts = {}) => sweep(pts, rrect(w, t, Math.min(t * 0.5, w * 0.25), 2), opts);

// Smooth path through control points (centripetal Catmull-Rom), n samples evenly spaced.
export function smoothPath(ctrl, n = 64, closed = false) {
  const c = new THREE.CatmullRomCurve3(ctrl, closed, 'centripetal');
  return c.getSpacedPoints(n);
}

export function place(geo, { pos = [0, 0, 0], rot = [0, 0, 0], order = 'XYZ', scale = null } = {}) {
  const m = new THREE.Matrix4().compose(V3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], order)), scale ? V3(...scale) : V3(1, 1, 1));
  geo.applyMatrix4(m);
  return geo;
}

// Basis matrix: columns x, y, z at origin o.
export function basisAt(o, x, y, z = null) {
  const zz = z || V3().crossVectors(x, y).normalize();
  return new THREE.Matrix4().makeBasis(x.clone().normalize(), y.clone().normalize(), zz).setPosition(o);
}

// ExtrudeGeometry from a THREE.Shape, extrusion along +Y (shape x -> x, shape y -> -z),
// bottom at y0, height h, bevel b.
export function extrudeY(shape, h, { y0 = 0, bevel = 0.001, bevelSegs = 2, curveSegs = 32 } = {}) {
  const b = Math.min(bevel, h / 2.2);
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-5, h - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: bevelSegs, curveSegments: curveSegs });
  g.translate(0, 0, b);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

export function lathe(pts, segs = 48, phi0 = 0, phiL = TAU) { return G.lathe(pts, segs, phi0, phiL); }

// Merge several geometries that keep vertex colours (G.merge strips them).
export function mergeRaw(list) { return mergeGeometries(list.filter(Boolean), false); }

// Lowest point of an object (world) -> move it so it rests on y = 0.
export function restOnFloor(obj, lift = 0) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  obj.position.y += lift - b.min.y;
  return obj;
}

// Lowest y of a geometry after a matrix (for placing loose parts).
export function minY(geo) { geo.computeBoundingBox(); return geo.boundingBox.min.y; }

// Rounded-rect cross-section sampled by perimeter fraction f in [0,1): starts at the
// middle of the +Z face and runs towards +X (counter-clockwise seen from +Y... i.e. +Z, +X, -Z, -X).
// Returns {x, z, nx, nz, face} where face = 1 in the middle of a flat side, 0 on the corners.
export function rrPoint(f, a, b, r) {
  r = Math.min(r, a - 1e-4, b - 1e-4);
  const fa = a - r, fb = b - r, q = (Math.PI / 2) * r;
  const segs = [fa, q, 2 * fb, q, 2 * fa, q, 2 * fb, q, fa];
  const P = segs.reduce((s, x) => s + x, 0);
  let s = (((f % 1) + 1) % 1) * P;
  let k = 0; while (k < segs.length - 1 && s > segs[k]) { s -= segs[k]; k++; }
  const t = segs[k] > 0 ? s / segs[k] : 0;
  const faceW = (len, tt) => (len > 1e-6 ? Math.sin(Math.PI * tt) : 0);
  switch (k) {
    case 0: return { x: t * fa, z: b, nx: 0, nz: 1, face: Math.sin(Math.PI * (0.5 + t * 0.5)) * (fa > 1e-6 ? 1 : 0), P };
    case 1: { const ang = Math.PI / 2 - t * Math.PI / 2; return { x: fa + Math.cos(ang) * r, z: fb + Math.sin(ang) * r, nx: Math.cos(ang), nz: Math.sin(ang), face: 0, P }; }
    case 2: return { x: a, z: fb - t * 2 * fb, nx: 1, nz: 0, face: faceW(fb, t), P };
    case 3: { const ang = -t * Math.PI / 2; return { x: fa + Math.cos(ang) * r, z: -fb + Math.sin(ang) * r, nx: Math.cos(ang), nz: Math.sin(ang), face: 0, P }; }
    case 4: return { x: fa - t * 2 * fa, z: -b, nx: 0, nz: -1, face: faceW(fa, t), P };
    case 5: { const ang = -Math.PI / 2 - t * Math.PI / 2; return { x: -fa + Math.cos(ang) * r, z: -fb + Math.sin(ang) * r, nx: Math.cos(ang), nz: Math.sin(ang), face: 0, P }; }
    case 6: return { x: -a, z: -fb + t * 2 * fb, nx: -1, nz: 0, face: faceW(fb, t), P };
    case 7: { const ang = Math.PI - t * Math.PI / 2; return { x: -fa + Math.cos(ang) * r, z: fb + Math.sin(ang) * r, nx: Math.cos(ang), nz: Math.sin(ang), face: 0, P }; }
    default: return { x: -fa + t * fa, z: b, nx: 0, nz: 1, face: Math.sin(Math.PI * t * 0.5) * (fa > 1e-6 ? 1 : 0), P };
  }
}
// perimeter fraction of the centre of each face / corner
export function rrFractions(a, b, r) {
  const fa = a - r, fb = b - r, q = (Math.PI / 2) * r, P = 4 * fa + 4 * fb + 4 * q;
  const acc = (n) => n / P;
  return {
    front: 0, right: acc(fa + q + fb), back: acc(2 * fa + 2 * q + 2 * fb), left: acc(3 * fa + 3 * q + 3 * fb),
    cFR: acc(fa + q / 2), cBR: acc(fa + q + 2 * fb + q / 2), cBL: acc(3 * fa + 2 * q + 2 * fb + q / 2), cFL: acc(3 * fa + 3 * q + 4 * fb + q / 2),
    P, faW: fa, fbW: fb,
  };
}

// Soft rectangular bag (canvas bag / wheel bag / duffel) standing along +Y in its local frame:
// cross-section W x D with corner radius r, body length L from y0, rounded flat ends (edge
// radius re) with a slight dome; flat faces bulge (`bulge`, m) and carry soft wrinkles.
// Returns { geo, point(f, t) -> {p, n}, frac, L, y0, ytop } (f = perimeter fraction, t = 0..1 along the body).
export function softBag({ W, D, L, r = 0.04, re = 0.03, y0 = 0, bulge = 0.012, wrinkle = 0.004, waist = 0, seed = 1, nu = 120, nv = 70, bottomBulge = 0.2, topDome = 0.01, sag = 0, flatBottom = false } = {}) {
  const a = W / 2, b = D / 2;
  const nz = makeNoise2(seed);
  const frac = rrFractions(a, b, r);
  const P = frac.P;
  // offset along the ring normal at (f, t)
  const off = (f, t, q) => {
    const env = Math.pow(Math.sin(Math.PI * clamp01(t)), 0.55) * (1 - bottomBulge * (1 - sstep(0, 0.25, t)));
    const s = f * P;
    const wr = nz.fbm(s * 9 + 3.1, t * L * 2.2, 3) * 1.0 + nz.fbm(s * 22 + 9.7, t * L * 7, 2) * 0.35;
    return (bulge * q.face * env) - waist * Math.sin(Math.PI * t) * 0.3 + wrinkle * wr * (0.35 + 0.65 * q.face) * Math.min(1, env * 1.6);
  };
  const bodyAt = (f, t) => {
    const q = rrPoint(f, a, b, r);
    const o = off(f, t, q);
    let y = y0 + t * L;
    if (sag) y -= sag * q.face * Math.sin(Math.PI * t) * (q.nz > 0.5 ? 0 : 0);
    return V3(q.x + q.nx * o, y, q.z + q.nz * o);
  };
  const rows = [];
  // bottom end: from centre outwards (rings offset inwards by d, quarter-round edge)
  const endRing = (top) => {
    const out = [];
    const nE = 10;
    for (let k = 0; k <= nE; k++) {
      const ang = (k / nE) * Math.PI / 2; // 0 at the body seam, pi/2 on the flat end
      const d = re * (1 - Math.cos(ang)), h = re * Math.sin(ang);
      out.push({ d, h });
    }
    // flat end: inset from re to the centre, small dome
    const inner = Math.min(a, b) - re - 0.002;
    for (let k = 1; k <= 8; k++) { const d = re + inner * (k / 8); out.push({ d, h: re + (top ? topDome : (flatBottom ? 0 : topDome * 0.3)) * Math.sin((k / 8) * Math.PI / 2) }); }
    return out;
  };
  const ringAt = (d, y, tBody) => {
    const row = [];
    for (let i = 0; i < nu; i++) {
      const f = i / nu;
      const q = rrPoint(f, Math.max(1e-3, a - d), Math.max(1e-3, b - d), Math.max(1e-4, r - d * 0.7));
      const o = d < re * 1.01 ? off(f, tBody, rrPoint(f, a, b, r)) * (1 - d / re) : 0;
      row.push(V3(q.x + q.nx * o, y, q.z + q.nz * o));
    }
    return row;
  };
  const eb = endRing(false);
  for (let k = eb.length - 1; k >= 1; k--) rows.push(ringAt(eb[k].d, y0 - eb[k].h + re + (flatBottom ? -re : 0) * 0, 0));
  // body
  for (let j = 0; j <= nv; j++) {
    const t = j / nv;
    const row = [];
    for (let i = 0; i < nu; i++) row.push(bodyAt(i / nu, t));
    rows.push(row);
  }
  const et = endRing(true);
  for (let k = 1; k < et.length; k++) rows.push(ringAt(et[k].d, y0 + L + et[k].h - 0.0, 1));
  // the bottom rings above were built at y0 + re - h: shift so the bag body starts at y0 and the
  // bottom end sits re lower (ends are rounded outward)
  for (let j = 0; j < eb.length - 1; j++) for (const p of rows[j]) p.y -= re;
  const geo = gridGeometry(rows, { closedU: true, flip: false });
  const point = (f, t, lift = 0) => {
    const p = bodyAt(f, t);
    const e = 1e-3;
    const pu = bodyAt(f + e, t).sub(bodyAt(f - e, t));
    const pv = bodyAt(f, Math.min(1, t + e)).sub(bodyAt(f, Math.max(0, t - e)));
    const n = V3().crossVectors(pu, pv).normalize();
    // outward check
    const q = rrPoint(f, a, b, r);
    if (n.x * q.nx + n.z * q.nz < 0) n.negate();
    return { p: p.addScaledVector(n, lift), n };
  };
  return { geo, point, frac, L, y0, ytop: y0 + L + re + topDome, ybot: y0 - re, a, b, r, re };
}

// ---------------------------------------------------------------------------------------
// textures

function canvasTex(key, w, h, draw, { srgb = true, repeat = null } = {}) {
  return cached(`ctex:${key}`, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    return t;
  });
}

// Data texture helper (RGBA8).
function dataTex(key, w, h, fill, { srgb = false } = {}) {
  return cached(`dtex:${key}`, () => {
    const out = new Uint8Array(w * h * 4);
    fill(out, w, h);
    const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  });
}

// Height (Float32 w*h, tileable) -> normal map bytes.
function heightToNormalBytes(H, w, h, strength, out) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = (x - 1 + w) % w, xr = (x + 1) % w, yu = (y - 1 + h) % h, yd = (y + 1) % h;
    const dx = (H[y * w + xr] - H[y * w + xl]) * strength, dy = (H[yd * w + x] - H[yu * w + x]) * strength;
    let nx = -dx, ny = -dy, nzv = 1; const l = Math.hypot(nx, ny, nzv);
    const k = (y * w + x) * 4;
    out[k] = Math.round((nx / l * 0.5 + 0.5) * 255); out[k + 1] = Math.round((ny / l * 0.5 + 0.5) * 255); out[k + 2] = Math.round((nzv / l * 0.5 + 0.5) * 255); out[k + 3] = 255;
  }
}

// Periodic value-noise fbm on the unit square (seamless tiles): f(u, v) for u, v in [0,1),
// base lattice `period` cells per tile, `oct` octaves (period doubles per octave).
export function tileFbm(seed = 1, period = 8, oct = 4, gain = 0.5) {
  const R = rng(seed);
  const tables = [];
  for (let o = 0; o < oct; o++) { const P = period << o; const t = new Float32Array(P * P); for (let i = 0; i < P * P; i++) t[i] = R() * 2 - 1; tables.push([P, t]); }
  const fade = (t) => t * t * (3 - 2 * t);
  return (u, v) => {
    let s = 0, a = 1, n = 0;
    for (const [P, t] of tables) {
      const x = (((u % 1) + 1) % 1) * P, y = (((v % 1) + 1) % 1) * P;
      const xi = Math.floor(x), yi = Math.floor(y), xf = fade(x - xi), yf = fade(y - yi);
      const x0 = xi % P, x1 = (xi + 1) % P, y0 = yi % P, y1 = (yi + 1) % P;
      const v00 = t[y0 * P + x0], v10 = t[y0 * P + x1], v01 = t[y1 * P + x0], v11 = t[y1 * P + x1];
      s += a * ((v00 * (1 - xf) + v10 * xf) * (1 - yf) + (v01 * (1 - xf) + v11 * xf) * yf); n += a; a *= gain;
    }
    return s / n;
  };
}

// Brand print (svg path) or text drawn into a canvas; returns {tex, aspect}.
// spec: {svg|name|d+vb} -> path art; or a string -> text in Figtree-like heavy sans.
export function printTex(spec, { color = '#FBF6EC', bg = null, px = 1024, pad = 0.02, rotate = 0, mirror = false, font = '800 160px "Arial Black", Arial, sans-serif' } = {}) {
  const art = typeof spec === 'string' && !/\.(json|svg)$/.test(spec) && !/^print-/.test(spec) ? null : resolvePrint(spec);
  const key = `print:${art ? art.d.length + ':' + art.vb.join('x') : spec}:${color}:${bg}:${px}:${rotate}:${mirror}`;
  let aspect;
  if (art) aspect = art.vb[0] / art.vb[1];
  else aspect = Math.max(1, String(spec).length * 0.72);
  const W = aspect >= 1 ? px : Math.round(px * aspect), Hh = aspect >= 1 ? Math.round(px / aspect) : px;
  const tex = canvasTex(key, Math.max(8, W), Math.max(8, Hh), (g, w, h) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.save();
    if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    g.fillStyle = color;
    if (art) {
      const s = Math.min(w / art.vb[0], h / art.vb[1]) * (1 - 2 * pad);
      g.translate((w - art.vb[0] * s) / 2, (h - art.vb[1] * s) / 2);
      g.scale(s, s);
      g.fill(new Path2D(art.d));
    } else {
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
      const tw = g.measureText(String(spec)).width;
      const m = /(\d+)px/.exec(font);
      if (m) g.font = font.replace(/\d+px/, `${Math.floor(Number(m[1]) * Math.min(w * 0.94 / tw, h * 0.8 / Number(m[1])))}px`);
      g.fillText(String(spec), w / 2, h / 2 + h * 0.03);
    }
    g.restore();
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return { tex, aspect };
}

// Generic label/card texture drawn by a callback.
export function drawnTex(key, w, h, draw, opts = {}) { const t = canvasTex(key, w, h, draw, opts); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }

// Embossed (raised) text as a normal map over a plaque (uv 0..1).
export function embossTextNormal(text, { w = 512, h = 160, strength = 3, font = '800 100px "Arial Black", Arial, sans-serif', border = false } = {}) {
  return cached(`embtxt:${text}:${w}:${h}:${strength}:${border}`, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = font.replace(/\d+px/, `${Math.round(h * 0.62)}px`);
    const tw = g.measureText(text).width;
    if (tw > w * 0.9) g.font = g.font.replace(/\d+px/, `${Math.floor(h * 0.62 * w * 0.9 / tw)}px`);
    g.fillText(text, w / 2, h * 0.54);
    if (border) { g.strokeStyle = '#fff'; g.lineWidth = h * 0.05; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12); }
    const src = g.getImageData(0, 0, w, h).data;
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.min(w - 1, Math.max(0, x + dx)), yy = Math.min(h - 1, Math.max(0, y + dy)); s += src[(yy * w + xx) * 4]; n++; }
      H[(h - 1 - y) * w + x] = s / n / 255;
    }
    const out = new Uint8Array(w * h * 4);
    heightToNormalBytes(H, w, h, strength, out);
    // heightToNormal assumes y down in the array; we flipped rows so v = 1 is the canvas top
    for (let i = 0; i < w * h; i++) out[i * 4 + 1] = 255 - out[i * 4 + 1];
    const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = THREE.NoColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// ---------------------------------------------------------------------------------------
// materials (cached)

// 600D polyester oxford with PU/PVC backing (bags, covers, sandbags): basket weave of
// ~0.6 mm yarns, matte with a soft fibre sheen. uv in metres.
export function oxford(color = '#18191B', { sheen = 0.35, rough = 0.62 } = {}) {
  const hex = M.resolveColor(color, '#18191B');
  return cached(`oxford:${hex}:${sheen}:${rough}`, () => {
    const c = new THREE.Color(hex);
    const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: rough, metalness: 0, specularIntensity: 0.4,
      sheen, sheenRoughness: 0.5, sheenColor: L < 0.05 ? new THREE.Color('#45474b') : c.clone().lerp(new THREE.Color('#ffffff'), 0.25),
      normalMap: TX.weaveNormal({ threads: 24, strength: 2.0, irregular: 0.3, seed: 41 }).clone(), normalScale: new THREE.Vector2(0.55, 0.55),
      side: THREE.DoubleSide, name: `oxford ${hex}`,
    });
    m.normalMap.repeat.set(70, 70); m.normalMap.needsUpdate = true;
    m.userData.envSpec = L < 0.05 ? 0.45 : 0.3;
    return m;
  });
}

// Hook-and-loop tape: hook side (stiff nylon hooks: dark, rough with glints) or loop side (fuzzy, matte).
export function velcro(kind = 'loop', color = '#141516') {
  const hex = M.resolveColor(color, '#141516');
  return cached(`velcro:${kind}:${hex}`, () => {
    const hook = kind === 'hook';
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: hook ? 0.7 : 0.95, specularIntensity: hook ? 0.6 : 0.2,
      sheen: hook ? 0.2 : 1.0, sheenRoughness: 0.7, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.25),
      normalMap: TX.stippleNormal({ size: 256, strength: hook ? 2.4 : 1.6, scale: hook ? 60 : 40, seed: hook ? 51 : 53 }).clone(),
      normalScale: new THREE.Vector2(hook ? 0.9 : 0.6, hook ? 0.9 : 0.6), side: THREE.DoubleSide, name: `velcro ${kind} ${hex}`,
    });
    m.normalMap.repeat.set(hook ? 90 : 60, hook ? 90 : 60); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.25;
    return m;
  });
}

// PVC tarpaulin 650 g/m² (water bags): glossy coated, welded, faint calendering waviness.
export function pvcTarp(color = '#151617') {
  const hex = M.resolveColor(color, '#151617');
  return cached(`pvctarp:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: 0.38, metalness: 0, specularIntensity: 0.6, clearcoat: 0.5, clearcoatRoughness: 0.28,
      normalMap: TX.stippleNormal({ size: 256, strength: 0.8, scale: 22, seed: 57 }).clone(), normalScale: new THREE.Vector2(0.18, 0.18),
      side: THREE.DoubleSide, name: `pvc tarp ${hex}`,
    });
    m.normalMap.repeat.set(40, 40); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.6;
    return m;
  });
}

export function abs(color = '#151515', rough = 0.45, { clearcoat = 0 } = {}) {
  const hex = M.resolveColor(color, '#151515');
  return cached(`abs:${hex}:${rough}:${clearcoat}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: rough, metalness: 0, specularIntensity: 0.5, clearcoat, clearcoatRoughness: 0.3,
      normalMap: TX.stippleNormal({ size: 256, strength: 0.6, scale: 30, seed: 61 }).clone(), normalScale: new THREE.Vector2(0.06, 0.06), name: `abs ${hex}`,
    });
    m.normalMap.repeat.set(60, 60); m.normalMap.needsUpdate = true;
    return m;
  });
}

export function softRubber(color = '#1a1a1a', rough = 0.78) {
  return cached(`srubber:${color}:${rough}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: rough, metalness: 0, specularIntensity: 0.4, sheen: 0.15, sheenRoughness: 0.7, sheenColor: new THREE.Color('#4a4a4a'),
      normalMap: TX.stippleNormal({ size: 256, strength: 1.2, scale: 30, seed: 63 }).clone(), normalScale: new THREE.Vector2(0.15, 0.15), name: `soft rubber ${color}`,
    });
    m.normalMap.repeat.set(80, 80); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Zinc-plated steel (bolts, wing nuts, hooks): bright, slightly bluish, satin.
export function zinc() {
  return cached('zinc', () => new THREE.MeshPhysicalMaterial({ color: '#C9CED3', metalness: 1, roughness: 0.28, name: 'zinc plated' }));
}
export function stainless(rough = 0.22) {
  return cached(`ss:${rough}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: '#D4D7DA', metalness: 1, roughness: rough, anisotropy: 0.4,
      normalMap: TX.brushedNormal().clone(), normalScale: new THREE.Vector2(0.05, 0.05), name: 'stainless' });
    m.normalMap.repeat.set(40, 4); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Hot-dip galvanised steel: matte grey zinc with a visible spangle (crystal cells of
// different reflectance) and a slightly uneven, dull surface. uv in metres.
export function hotDipGalv({ tone = 1 } = {}) {
  return cached(`hdg:${tone}`, () => {
    const S = 512; // 1 tile = 12 cm
    const R = rng(71);
    const nCells = 900;
    const cx = new Float32Array(nCells), cy = new Float32Array(nCells), cv = new Float32Array(nCells), cr = new Float32Array(nCells);
    for (let i = 0; i < nCells; i++) { cx[i] = R() * S; cy[i] = R() * S; cv[i] = R(); cr[i] = R(); }
    // grid acceleration
    const GN = 32, cell = S / GN, buckets = Array.from({ length: GN * GN }, () => []);
    for (let i = 0; i < nCells; i++) buckets[Math.floor(cy[i] / cell) * GN + Math.floor(cx[i] / cell)].push(i);
    const nearest = (x, y) => {
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      let best = 1e9, bi = 0, second = 1e9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const bx = (gx + dx + GN) % GN, by = (gy + dy + GN) % GN;
        for (const i of buckets[by * GN + bx]) {
          let ddx = Math.abs(cx[i] - x); ddx = Math.min(ddx, S - ddx);
          let ddy = Math.abs(cy[i] - y); ddy = Math.min(ddy, S - ddy);
          const d = ddx * ddx + ddy * ddy;
          if (d < best) { second = best; best = d; bi = i; } else if (d < second) second = d;
        }
      }
      return { i: bi, edge: Math.sqrt(second) - Math.sqrt(best) };
    };
    const tf = tileFbm(73, 3, 4);
    const albedo = new Uint8Array(S * S * 4), rough = new Uint8Array(S * S * 4);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const { i, edge } = nearest(x, y);
      const a = (x / S) * TAU, b = (y / S) * TAU;
      const mott = tf(x / S, y / S) * 1.6;
      let v = 150 + (cv[i] - 0.5) * 34 + mott * 22;
      if (edge < 1.2) v -= 10;
      v *= tone;
      const k = (y * S + x) * 4;
      albedo[k] = v * 0.98; albedo[k + 1] = v * 1.0; albedo[k + 2] = v * 1.03; albedo[k + 3] = 255;
      const rr = 150 + (cr[i] - 0.5) * 90 + mott * 30;
      rough[k] = rough[k + 1] = rough[k + 2] = Math.max(60, Math.min(250, rr)); rough[k + 3] = 255;
    }
    const mk = (data, srgb) => { const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.repeat.set(1 / 0.12, 1 / 0.12); t.needsUpdate = true; return t; };
    const m = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', map: mk(albedo, true), metalness: 0.75, roughness: 1.0, roughnessMap: mk(rough, false),
      normalMap: TX.stippleNormal({ size: 256, strength: 1.2, scale: 26, seed: 77 }).clone(), normalScale: new THREE.Vector2(0.08, 0.08), name: 'hot-dip galvanised',
    });
    m.normalMap.repeat.set(30, 30); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Cast concrete: grey with mottled laitance, small blowholes (dark pores) and a faint
// formwork texture. uv in metres; 1 tile = 0.5 m.
export function concrete() {
  return cached('concrete', () => {
    const S = 1024;
    const tLow = tileFbm(81, 2, 3), tMid = tileFbm(82, 6, 3), tFine = tileFbm(84, 32, 2);
    const R = rng(83);
    const H = new Float32Array(S * S);
    const albedo = new Uint8Array(S * S * 4);
    // pores
    const pores = [];
    for (let i = 0; i < 2600; i++) pores.push([R() * S, R() * S, 0.6 + Math.pow(R(), 4) * 3.2]);
    const poreMap = new Float32Array(S * S);
    for (const [px, py, pr] of pores) {
      const r2 = Math.ceil(pr + 1);
      for (let dy = -r2; dy <= r2; dy++) for (let dx = -r2; dx <= r2; dx++) {
        const d = Math.hypot(dx, dy); if (d > pr + 0.7) continue;
        const x = (Math.floor(px) + dx + S) % S, y = (Math.floor(py) + dy + S) % S;
        poreMap[y * S + x] = Math.max(poreMap[y * S + x], clamp01(pr + 0.7 - d));
      }
    }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const a = (x / S) * TAU, b = (y / S) * TAU;
      const uu = x / S, vv = y / S;
      const low = tLow(uu, vv) * 1.6, mid = tMid(uu, vv) * 1.6, fine = tFine(uu, vv) * 1.6;
      const pr = poreMap[y * S + x];
      H[y * S + x] = fine * 0.4 + mid * 0.2 - pr * 1.0;
      let v = 168 + low * 26 + mid * 12 + fine * 10 - pr * 70;
      const k = (y * S + x) * 4;
      albedo[k] = v * 1.0; albedo[k + 1] = v * 0.995; albedo[k + 2] = v * 0.965; albedo[k + 3] = 255;
    }
    const nb = new Uint8Array(S * S * 4); heightToNormalBytes(H, S, S, 2.2, nb);
    const mk = (data, srgb) => { const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.repeat.set(2, 2); t.needsUpdate = true; return t; };
    return new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: mk(albedo, true), normalMap: mk(nb, false), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.88, metalness: 0, specularIntensity: 0.35, name: 'concrete' });
  });
}

// Peeled sweet-chestnut wood (stretch tent poles): warm tan-brown with long grain streaks,
// draw-knife facets and the odd knot. uv: u = around (m), v = along the pole (m); 1 tile = 0.3 x 1.2 m.
export function chestnut() {
  return cached('chestnut', () => {
    const W = 256, Hh = 1024;
    const tg1 = tileFbm(91, 4, 4), tg2 = tileFbm(92, 8, 2), tfa = tileFbm(94, 2, 3), tlo = tileFbm(95, 2, 3);
    const R = rng(93);
    const knots = []; for (let i = 0; i < 7; i++) knots.push([R() * W, R() * Hh, 4 + R() * 7]);
    const albedo = new Uint8Array(W * Hh * 4), Hm = new Float32Array(W * Hh);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / Hh;
      const a = u * TAU, b = v * TAU;
      // grain: streaks along v (tileable: periodic in both)
      // long grain streaks: fine across (u), long along the pole (v)
      const g1 = tg1(u * 6, v) * 1.6;
      const g2 = tg2(u * 12, v * 2) * 1.6;
      const facet = Math.abs(Math.sin(a * 7 + tfa(u, v * 3) * 4));
      let kn = 0;
      for (const [kx, ky, kr] of knots) {
        let dx = Math.abs(x - kx); dx = Math.min(dx, W - dx); let dy = Math.abs(y - ky); dy = Math.min(dy, Hh - dy);
        const d = Math.hypot(dx * 1.0, dy * 0.6);
        kn = Math.max(kn, clamp01(1 - d / kr));
      }
      const low = tlo(u, v * 2) * 1.6;
      const k = (y * W + x) * 4;
      const base = [150, 122, 92];
      const sh = 1 + g1 * 0.18 + g2 * 0.07 + low * 0.1 - kn * 0.45 + (facet - 0.5) * 0.05;
      albedo[k] = base[0] * sh; albedo[k + 1] = base[1] * sh; albedo[k + 2] = base[2] * sh * 0.97; albedo[k + 3] = 255;
      Hm[y * W + x] = g2 * 0.25 + g1 * 0.4 + facet * 0.35 - kn * 0.8;
    }
    const nb = new Uint8Array(W * Hh * 4); heightToNormalBytes(Hm, W, Hh, 1.6, nb);
    const mk = (data, srgb) => { const t = new THREE.DataTexture(data, W, Hh, THREE.RGBAFormat, THREE.UnsignedByteType); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.repeat.set(1 / 0.3, 1 / 1.2); t.needsUpdate = true; return t; };
    return new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: mk(albedo, true), normalMap: mk(nb, false), normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.72, specularIntensity: 0.4, sheen: 0.15, sheenRoughness: 0.6, sheenColor: new THREE.Color('#c9a27a'), name: 'chestnut' });
  });
}

// Clear flexible PVC (2 mm table protector): glass-like transmission, glossy.
export function clearPVC({ tint = '#EEF4F2' } = {}) {
  return cached(`clearpvc:${tint}`, () => new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.002, ior: 1.53,
    specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04, side: THREE.DoubleSide, name: 'clear pvc',
  }));
}

// Matte printed paper / card.
export function paper(map, { rough = 0.8 } = {}) {
  return new THREE.MeshPhysicalMaterial({ map, roughness: rough, specularIntensity: 0.3, side: THREE.DoubleSide, name: 'paper' });
}

// Contact proxy material (never drawn, floor contact only)
export const PROXY_MAT = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });

// ---------------------------------------------------------------------------------------
// small parts

// Side-release buckle (female + male), body along +Z from the origin, face normal +Y.
export function buckleGeo(w = 0.04) {
  const parts = [];
  const L = w * 1.6;
  // female housing
  parts.push(place(G.roundedBox(w + 0.006, 0.011, L * 0.55, 0.003), { pos: [0, 0.0055, L * 0.275] }));
  // male tongue with the two side prongs and strap bar
  parts.push(place(G.roundedBox(w * 0.86, 0.007, L * 0.5, 0.002), { pos: [0, 0.0045, L * 0.78] }));
  for (const s of [-1, 1]) parts.push(place(G.roundedBox(0.005, 0.009, L * 0.22, 0.0018), { pos: [s * (w / 2 + 0.0015), 0.005, L * 0.6] }));
  parts.push(place(G.roundedBox(w * 0.9, 0.006, 0.006, 0.002), { pos: [0, 0.004, L + 0.004] }));
  parts.push(place(G.roundedBox(w * 0.9, 0.006, 0.006, 0.002), { pos: [0, 0.004, -0.006] }));
  return G.merge(parts);
}

// Wing nut / wing bolt head, axis +Y, base at y = 0.
export function wingNutGeo(s = 1) {
  const parts = [];
  parts.push(lathe([[0.0001, 0], [0.008 * s, 0], [0.0085 * s, 0.002 * s], [0.007 * s, 0.012 * s], [0.0055 * s, 0.014 * s], [0.0001, 0.014 * s]], 24));
  for (const sg of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.016 * s, 0.003 * s); sh.quadraticCurveTo(0.024 * s, 0.006 * s, 0.022 * s, 0.017 * s); sh.quadraticCurveTo(0.016 * s, 0.024 * s, 0.006 * s, 0.014 * s); sh.lineTo(0, 0.012 * s); sh.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.003 * s, bevelEnabled: true, bevelThickness: 0.0008 * s, bevelSize: 0.0008 * s, bevelSegments: 2, curveSegments: 12 });
    g.translate(0, 0, -0.0015 * s);
    if (sg < 0) g.rotateY(Math.PI);
    g.translate(sg * 0.005 * s, 0, 0);
    parts.push(g);
  }
  return G.merge(parts);
}

// Hex nut, axis +Y, centred; af = across flats.
export function hexNutGeo(af = 0.013, h = 0.0065, hole = 0.004) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; const R = af / 2 / Math.cos(Math.PI / 6); const x = Math.cos(a) * R, y = Math.sin(a) * R; if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y); }
  sh.closePath();
  if (hole > 0) { const p = new THREE.Path(); p.absarc(0, 0, hole, 0, TAU, true); sh.holes.push(p); }
  const g = extrudeY(sh, h, { y0: -h / 2, bevel: 0.0006, curveSegs: 16 });
  return g;
}

// Contact proxy strip (render layer 3, floor halo only).
export function contactProxy(geo) {
  const m = new THREE.Mesh(geo, PROXY_MAT);
  m.layers.set(3); m.userData.contactProxy = true; m.userData.noFrame = true; m.castShadow = false; m.receiveShadow = false;
  return m;
}

// Build a group from a PartBin and extra meshes; default shadow flags on.
export function finish(bins, name, extras = []) {
  const g = new THREE.Group(); g.name = name; bins.build(g);
  for (const m of extras) g.add(m);
  return g;
}

export function meshOf(geo, mat, { cast = true, receive = true } = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m; }

// Default light suggestion for small studio packshots of hard goods (sets, flat-lays): same
// studio as the catalogue, a little more env for metal, firm contact shadows.
export function smallRig(extra = {}) {
  return { default: { contact: { strength: 0.75, h0: 0.012, res: 1024, blur: 1.6 }, groundAO: { strength: 0.8, maxZenith: 80 }, ...extra } };
}

// ---------------------------------------------------------------------------------------
// bag tools: zips and webbing handles on any surface given pt(f, t, lift) -> {p, n}

export function bagTools(bins, pt, { tape, tooth, slider, web, fab }) {
  const zip = (ft, { sliders = [], tapeW = 0.03 } = {}) => {
    const S = ft.map(([f, t]) => pt(f, t, 0.0012));
    const pts = S.map((s) => s.p), nrm = S.map((s) => s.n);
    bins.add(tape, strapAlong(pts, tapeW, 0.0014, { normals: nrm }));
    const pts2 = S.map((s) => s.p.clone().addScaledVector(s.n, 0.0016));
    bins.add(tooth, strapAlong(pts2, 0.0068, 0.0026, { normals: nrm }));
    for (const si of sliders) {
      const i = Math.round(si * (pts.length - 1));
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const T = b.clone().sub(a).normalize(), N = nrm[i];
      const Bv = V3().crossVectors(T, N).normalize();
      const c = pts[i].clone().addScaledVector(N, 0.006);
      const body = G.roundedBox(0.019, 0.009, 0.032, 0.003);
      body.applyMatrix4(basisAt(c, Bv, N, T)); bins.add(slider, body);
      const tab = G.roundedBox(0.012, 0.0035, 0.04, 0.0015);
      const tc = c.clone().addScaledVector(T, -0.026).addScaledVector(N, 0.003);
      tab.applyMatrix4(basisAt(tc, Bv, N, T)); bins.add(slider, tab);
    }
  };
  const handle = (A, B, h = 0.04, { grip = false, w = 0.038, patch = true } = {}) => {
    const a = pt(A[0], A[1], 0.0015), b = pt(B[0], B[1], 0.0015);
    const along = b.p.clone().sub(a.p).normalize();
    const n = a.n.clone().add(b.n).normalize();
    const mid = a.p.clone().lerp(b.p, 0.5).addScaledVector(n, h);
    const ctrl = [a.p.clone().addScaledVector(along, -0.035), a.p, a.p.clone().addScaledVector(along, 0.02).addScaledVector(n, h * 0.5), mid, b.p.clone().addScaledVector(along, -0.02).addScaledVector(n, h * 0.5), b.p, b.p.clone().addScaledVector(along, 0.035)];
    const pts = smoothPath(ctrl, 48);
    bins.add(web, strapAlong(pts, w, 0.0024, { up: n.clone() }));
    if (patch) for (const e of [a, b]) {
      const pg = G.roundedBox(w + 0.006, 0.0016, 0.05, 0.0008);
      pg.applyMatrix4(basisAt(e.p.clone().addScaledVector(e.n, 0.0006), V3().crossVectors(e.n, along).normalize(), e.n, along));
      bins.add(web, pg);
    }
    if (grip) bins.add(fab, tubeAlong(pts.filter((_, i) => i > 16 && i < 32), 0.013, 18));
  };
  return { zip, handle };
}

// Lying soft bag (axis along world X, centred, resting on y = 0 + lift): returns {pt, frac, L, W, D}
// and adds the body to bins. W = vertical size, D = depth (z).
export function lyingBag(bins, fab, { L, W, D, r = 0.05, re = 0.035, bulge = 0.015, wrinkle = 0.004, seed = 1, lift = 0, pipe = true, matrix = null }) {
  const bag = softBag({ W, D, L: L - 2 * re, r, re, y0: 0, bulge, wrinkle, seed, topDome: 0.004, bottomBulge: 0 });
  const Mx = new THREE.Matrix4().set(0, 1, 0, -(L - 2 * re) / 2, -1, 0, 0, W / 2 + lift, 0, 0, 1, 0, 0, 0, 0, 1);
  if (matrix) Mx.premultiply(matrix);
  const NM = new THREE.Matrix3().getNormalMatrix(Mx);
  const pt = (f, t, l = 0) => { const q = bag.point(f, t, l); return { p: q.p.applyMatrix4(Mx), n: q.n.applyMatrix3(NM).normalize() }; };
  bins.add(fab, bag.geo.clone().applyMatrix4(Mx));
  const fr = bag.frac;
  if (pipe) for (const fc of [fr.cFR, fr.cBR, fr.cBL, fr.cFL]) {
    const pts = []; for (let k = 0; k <= 60; k++) pts.push(pt(fc, 0.004 + (k / 60) * 0.992, 0.0015).p);
    bins.add(fab, tubeAlong(pts, 0.0036, 10));
  }
  // in world terms: fr.left = top face, fr.right = bottom face, 0 = front (+z), fr.back = back
  return { pt, frac: fr, L, W, D, matrix: Mx };
}

// ---------------------------------------------------------------------------------------
// Rolled strip (connection strip, rain gutter): a strip of coated cloth of width `width`,
// rolled up from its inner end into a loose spiral roll that rests on the floor, the free
// end unrolled flat towards +Z for `tail` metres. `section(w, a, tailT)` returns a lateral /
// vertical offset for the cross-section (w in [-width/2, width/2], a = arc length from the
// free end, tailT = 0 on the roll .. 1 far out on the tail) to shape gutters.
// Returns { geo (double-sided surface, uv in metres), at(w, a, lift) -> {p, n}, rollR, tailLen }.
export function rolledStrip({ width = 0.3, length = 3, tail = 0.9, pitch = 0.0028, core = 0.018, thick = 0.0006, section = null, seed = 1, waviness = 0.004, nw = 40 }) {
  const nz = makeNoise2(seed);
  const rollLen = length - tail;
  // outer radius from the rolled length: area = rollLen * pitch
  const Rout = Math.sqrt(core * core + (rollLen * pitch) / Math.PI);
  // spiral: r(phi) = Rout + pitch * phi / TAU for phi in [-Phi, 0], centre (y = Rout, z = 0)
  // arc length from the outer end ~ integral r dphi
  const Phi = (Rout - core) / pitch * TAU;
  const N = Math.max(400, Math.ceil(rollLen / 0.004));
  const pts = []; // ordered from the free tail end to the inner end of the roll
  const tailN = Math.ceil(tail / 0.01);
  // the tail lies ~1 mm clear of the floor plane (no depth fighting with the shadow-catcher floor)
  for (let i = tailN; i >= 1; i--) { const a = (i / tailN) * tail; pts.push({ z: a, y: thick / 2 + 0.001 * Math.min(1, a / 0.05), a: 0, tail: a / tail, nY: 1, nZ: 0 }); }
  for (let i = 0; i <= N; i++) {
    const phi = -(i / N) * Phi;
    const r = Rout + pitch * phi / TAU;
    const z = r * Math.sin(phi), y = Rout - r * Math.cos(phi);
    // normal of the top face (towards the roll centre at the bottom = +y)
    const nZ = -Math.sin(phi), nY = Math.cos(phi);
    pts.push({ z, y: y + thick / 2, a: 0, tail: 0, nY, nZ });
  }
  // arc length from the free end
  let acc = 0;
  for (let i = 0; i < pts.length; i++) { if (i) acc += Math.hypot(pts[i].z - pts[i - 1].z, pts[i].y - pts[i - 1].y); pts[i].a = acc; }
  const rows = [];
  const W = width;
  for (let j = 0; j <= nw; j++) {
    const w = -W / 2 + W * (j / nw);
    const row = [];
    for (const q of pts) {
      let lx = w, ly = 0;
      if (section) { const o = section(w, q.a, q.tail); lx = o[0]; ly = o[1]; }
      // a little waviness of the free tail (cloth relaxing on the floor)
      const wave = q.tail > 0 ? waviness * (0.55 + 0.45 * nz.fbm(q.z * 3 + 1.3, w * 2, 2)) * Math.min(1, q.tail * 3) : 0;
      row.push(V3(lx, q.y + (ly + wave) * q.nY, q.z + (ly + wave) * q.nZ));
    }
    rows.push(row);
  }
  const geo = gridGeometry(rows, { closedU: false, flip: true });
  // uv in metres: u along the strip (arc length), v across
  const uv = geo.attributes.uv;
  const cols = pts.length;
  for (let j = 0; j <= nw; j++) for (let i = 0; i < cols; i++) uv.setXY(j * cols + i, pts[i].a, (j / nw) * W);
  const at = (w, a, lift = 0) => {
    // interpolate between the two samples around arc length a (binary search)
    let lo = 0, hi = pts.length - 1;
    if (a <= 0) hi = 1; else if (a >= pts[hi].a) lo = hi - 1;
    else while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid].a <= a) lo = mid; else hi = mid; }
    const A = pts[lo], Bq = pts[hi];
    const f = Math.min(1, Math.max(0, (a - A.a) / Math.max(1e-9, Bq.a - A.a)));
    const L2 = (k) => A[k] + (Bq[k] - A[k]) * f;
    const nl = Math.hypot(L2('nY'), L2('nZ')) || 1;
    const q = { z: L2('z'), y: L2('y'), a, tail: L2('tail'), nY: L2('nY') / nl, nZ: L2('nZ') / nl };
    let lx = w, ly = 0;
    if (section) { const o = section(w, q.a, q.tail); lx = o[0]; ly = o[1]; }
    const wave = q.tail > 0 ? waviness * (0.55 + 0.45 * nz.fbm(q.z * 3 + 1.3, w * 2, 2)) * Math.min(1, q.tail * 3) : 0;
    const n = V3(0, q.nY, q.nZ);
    return { p: V3(lx, q.y + (ly + wave) * q.nY, q.z + (ly + wave) * q.nZ).addScaledVector(n, lift), n };
  };
  return { geo, at, rollR: Rout, tailLen: tail, pts };
}
