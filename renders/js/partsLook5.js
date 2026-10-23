// Parts group, round 5 (art direction 22 October 2026): what the parts accessories need to read as
// the products the shop sells at catalogue size. Additive: partsKit / softGoods / partsLook3 /
// partsKit4 keep their behaviour.
//
//  - goodsRig(): the catalogue's black-product lighting (the studio of js/statafelLook.js, copied
//    here so the other team can keep iterating theirs): studio reflection map with an overhead scrim,
//    key box, frontal fill card and rim strip, a shadowed overhead softbox at a real distance and a
//    floor bounce card. Black cloth then reads ~55-65 sRGB (statafel-80-stretch-zwart: 59), not 15.
//  - cloth5() / pvc5() / pe5(): black goods with the albedo floor of the catalogue's black cloth
//    (linear 0.03: a black that is photographed, not a hole), a fibre sheen that falls off towards
//    grazing view (engine `grazing` hook) and almost no mirror reflection on cloth.
//  - creased(): smooth normals across bevels while keeping hard edges (ExtrudeGeometry is flat
//    shaded per triangle: the faceted pump corners).
//  - stableDown(): a resting orientation that is physically stable (the centre of mass over the
//    support polygon), nearest to a preferred one (fittings balanced on one tube end).
//  - textGeo(): flat text geometry from a canvas bitmap (row runs -> quads), lying on the floor;
//    dimensionLine(): a dimension line with end ticks and a length label on the floor.
import * as THREE from 'three';
import { toCreasedNormals } from '../vendor/three/addons/utils/BufferGeometryUtils.js';
import * as G from './geom.js';
import * as SG from './softGoods.js';
import * as L3 from './partsLook3.js';

const V3 = G.V3;
const TAU = Math.PI * 2;
const cache = new Map();
export function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

// ---------------------------------------------------------------------------------------
// light

export const GOODS_ENV = {
  surround: 0.04, ceiling: 0.06,
  floor: { front: 0.5, side: 0.16, back: 0.22, frontWidth: 60, backWidth: 50 },
  boxes: [
    { az: -10, el: 72, w: 70, h: 40, I: 3.2, soft: 0.6, hot: 0.3 },      // overhead scrim
    { az: -50, el: 36, w: 30, h: 36, I: 3.6, soft: 0.45, hot: 0.3 },     // key box front-left
    { az: 28, el: 8, w: 48, h: 34, I: 1.1, soft: 0.6, hot: 0.15 },       // frontal fill card right
    { az: 150, el: 30, w: 10, h: 40, I: 1.4, soft: 0.5, hot: 0.2 },      // rim strip behind-right
    { az: -150, el: 22, w: 26, h: 18, I: 0.45, soft: 0.6, hot: 0.1 },    // dim reflector behind-left
    { az: 180, el: 14, w: 110, h: 20, I: 0.6, soft: 0.8, hot: 0.1 },     // low soft sheet behind the set
    { az: -105, el: 6, w: 14, h: 70, I: 1.6, soft: 0.5, hot: 0.25 },     // strip box left (vertical sides)
  ],
};

// tone: 'black' (black / anthracite goods), 'mid', 'white'. size: half-diagonal of the product (m),
// scales the overhead box distance (1.05 m for a statafel-sized product).
export function goodsRig({ tone = 'black', size = 0.6, exposure = null, extra = {} } = {}) {
  const black = tone === 'black', white = tone === 'white';
  const def = {
    exposure: exposure ?? (black ? 1.32 : white ? 0.86 : 0.98),
    toneMapping: 'neutral', shoulder: white ? 0.86 : 0.8, toe: 1,
    env: 'studio', envStudio: GOODS_ENV, envIntensity: 1.0,
    key: { azimuth: -46, elevation: 38, intensity: 2.0, cone: 14, mapSize: 2048, radius: 2.5 },
    floorKey: { azimuth: -25, elevation: 78, cone: 24 },
    dome: { count: 3, intensity: 1.1, maxZenith: 70, mapSize: 1024, radius: 12 },
    fill: { azimuth: 26, elevation: 10, intensity: black ? 1.5 : 0.95 },
    rim: { azimuth: 155, elevation: 32, intensity: 0.55 },
    bounce: { azimuth: -28, elevation: -22, intensity: black ? 2.6 : 1.9 },
    overhead: { azimuth: -75, elevation: 58, distance: Math.max(0.7, Math.min(2.2, 1.05 * Math.max(0.6, size) / 0.6)), intensity: black ? 2.6 : 2.0, size: 18, angle: 60, penumbra: 1, mapSize: 1024, radius: 2 },
    groundAmbient: 0.3,
    groundAO: { strength: 1.0, samples: 64, keySamples: 64, res: 1024, maxZenith: 66, mapSize: 512, blur: 2, sigma: 0.02, edgeFade: 0.18 },
    contact: { strength: 0.8, h0: 0.01, res: 1024, blur: 1.4, wide: { strength: 0.36, h0: 0.035, sigma: 0.024 } },
    shadowStrength: 0.9,
    edgeFade: 0.06,
  };
  const out = { ...def };
  for (const [k, v] of Object.entries(extra)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' ? { ...out[k], ...v } : v;
  return { default: out, detail: { edgeFade: 0 } };
}

// flat-lay of small hard parts: a grounded contact shadow (tight dark line where a bar touches,
// a soft halo a couple of cm round it) so nothing floats
export function flatLayRig(extra = {}) {
  const base = {
    contact: { strength: 1.0, h0: 0.0035, res: 1024, blur: 1.1, wide: { strength: 0.5, h0: 0.012, sigma: 0.01 } },
    groundAO: { strength: 0.85, maxZenith: 80 },
  };
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' ? { ...out[k], ...v } : v;
  return { default: out };
}

// ---------------------------------------------------------------------------------------
// materials

const lumLin = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
// lift a near-black towards a neutral dark grey of linear luminance `min` (keeps a faint cast)
export function liftAlbedo(hex, min = 0.03) {
  const c = new THREE.Color(hex);
  const L = lumLin(c);
  if (L < min) c.lerp(new THREE.Color().setRGB(min, min, min * 1.04), 1 - L / min);
  return c;
}

// coated 600D polyester as photographed: matte, a soft fibre sheen that dies towards the
// silhouette, the basket weave and yarn macro of SG.fabric600
export function cloth5(hex = '#1C1D1F', { rough = 0.74, sheen = 0.7, spec = 0.3, env = 0.22, min = 0.03 } = {}) {
  return cached(`c5:${hex}:${rough}:${sheen}:${spec}:${env}:${min}`, () => {
    const c = liftAlbedo(hex, min);
    const m = L3.cloth600('#' + c.getHexString(), { rough, sheen, env, spec }).clone();
    m.color.copy(c);
    const dark = lumLin(c) < 0.06;
    m.sheenColor = dark ? new THREE.Color('#6a6c71') : c.clone().lerp(new THREE.Color('#ffffff'), 0.35);
    m.sheenRoughness = 0.5;
    m.userData = { ...m.userData, grazing: { spec: 0.4, sheen: 0.55, w: 0.35 } };
    delete m.userData.__hooked;
    m.name = `cloth5 ${hex}`;
    return m;
  });
}

// PVC tarpaulin (gutters, water bags): satin coat, lifted black
export function pvc5(hex = '#1C1D1F', { rough = 0.46, coat = 0.18, env = null, weave = 0.28, min = 0.03 } = {}) {
  return cached(`p5:${hex}:${rough}:${coat}:${env}:${weave}:${min}`, () => {
    const c = liftAlbedo(hex, min);
    const m = L3.pvcSatin('#' + c.getHexString(), { rough, coat, env, weave }).clone();
    m.color.copy(c);
    m.userData = { ...m.userData, grazing: { spec: 0.5, sheen: 0.6, w: 0.3 } };
    delete m.userData.__hooked;
    m.name = `pvc5 ${hex}`;
    return m;
  });
}

// moulded black PE / PP (caps, housings)
export function pe5(hex = '#161616', { rough = 0.44, spec = 0.5, min = 0.028 } = {}) {
  return cached(`pe5:${hex}:${rough}:${spec}:${min}`, () => {
    const c = liftAlbedo(hex, min);
    const m = SG.moulded('#' + c.getHexString(), { rough, spec }).clone();
    m.color.copy(c);
    delete m.userData.__hooked;
    m.name = `pe5 ${hex}`;
    return m;
  });
}

// ---------------------------------------------------------------------------------------
// geometry

// smooth normals over bevels / rounded corners, hard edges kept (crease angle in degrees)
export function creased(geo, deg = 40) {
  const g = toCreasedNormals(geo.index ? geo.toNonIndexed() : geo, (deg * Math.PI) / 180);
  return g;
}

// Stable rest: among down directions sampled over the sphere, the one nearest `pref` whose
// centre of mass (mean of the vertices) lies over the support polygon of the contact points
// (vertices within `eps` of the support plane) with at least `margin` m to spare.
// Returns { down, margin }.
export function stableDown(geos, pref = V3(0, -1, 0), { eps = 0.0015, margin = 0.006, n = 1600, stride = 2 } = {}) {
  const P = [];
  for (const g of geos) { const pa = g.attributes.position; for (let i = 0; i < pa.count; i += stride) P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); }
  const N = P.length / 3;
  let cx = 0, cy = 0, cz = 0; for (let i = 0; i < N; i++) { cx += P[i * 3]; cy += P[i * 3 + 1]; cz += P[i * 3 + 2]; } cx /= N; cy /= N; cz /= N;
  const pd = pref.clone().normalize();
  let best = null;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < n; k++) {
    const y = 1 - (k / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * k;
    const d = V3(Math.cos(th) * r, y, Math.sin(th) * r);
    // support level along d and contacts
    let m = -Infinity; for (let i = 0; i < N; i++) { const s = P[i * 3] * d.x + P[i * 3 + 1] * d.y + P[i * 3 + 2] * d.z; if (s > m) m = s; }
    // plane basis
    const a = Math.abs(d.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
    const u = V3().crossVectors(d, a).normalize(), v = V3().crossVectors(d, u);
    const pts = [];
    for (let i = 0; i < N; i++) {
      const x = P[i * 3], yy = P[i * 3 + 1], z = P[i * 3 + 2];
      if (x * d.x + yy * d.y + z * d.z > m - eps) pts.push([x * u.x + yy * u.y + z * u.z, x * v.x + yy * v.y + z * v.z]);
    }
    if (pts.length < 3) continue;
    const hull = hull2(pts);
    if (hull.length < 3) continue;
    const c2 = [cx * u.x + cy * u.y + cz * u.z, cx * v.x + cy * v.y + cz * v.z];
    const mg = insideMargin(hull, c2);
    if (mg < margin) continue;
    const score = d.dot(pd) + Math.min(mg, 0.03) * 2;
    if (!best || score > best.score) best = { down: d, margin: mg, score };
  }
  return best || { down: pd, margin: 0 };
}
// stability margin (m) of resting with `down` pointing at the floor (negative: it would tip)
export function restMargin(geos, down, { eps = 0.0015, stride = 2 } = {}) {
  const d = down.clone().normalize();
  const P = [];
  for (const g of geos) { const pa = g.attributes.position; for (let i = 0; i < pa.count; i += stride) P.push(V3(pa.getX(i), pa.getY(i), pa.getZ(i))); }
  const c = P.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / P.length);
  let m = -Infinity; for (const p of P) m = Math.max(m, p.dot(d));
  const a = Math.abs(d.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  const u = V3().crossVectors(d, a).normalize(), v = V3().crossVectors(d, u);
  const pts = P.filter((p) => p.dot(d) > m - eps).map((p) => [p.dot(u), p.dot(v)]);
  if (pts.length < 3) return -1;
  const h = hull2(pts);
  if (h.length < 3) return -1;
  return insideMargin(h, [c.dot(u), c.dot(v)]);
}
function hull2(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop();
  return lo.concat(up);
}
// signed distance from c to the edges of a CCW convex polygon (positive inside)
function insideMargin(h, c) {
  let m = Infinity;
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length];
    const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1;
    const d = ((c[0] - a[0]) * ey - (c[1] - a[1]) * ex) / l; // right-hand side positive
    m = Math.min(m, -d);
  }
  return m;
}

// Flat text lying in the XZ plane (reading along +X, letters' up = -Z), centred at the origin,
// cap height `h` (m): canvas bitmap, each row's runs of ink -> one quad (sub-pixel at catalogue size)
export function textGeo(text, { h = 0.04, font = '700 120px Arial, Helvetica, sans-serif', px = 160, y = 0.0004 } = {}) {
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 20;
  cv.width = w; cv.height = px;
  const c2 = cv.getContext('2d');
  c2.font = font; c2.fillStyle = '#000'; c2.textBaseline = 'alphabetic'; c2.textAlign = 'left';
  const base = Math.round(px * 0.82);
  c2.fillText(text, 10, base);
  const img = c2.getImageData(0, 0, w, px).data;
  // cap height in px: measure the ink of 'H'-like extent (rows with ink)
  let top = px, bot = 0;
  for (let yy = 0; yy < px; yy++) for (let xx = 0; xx < w; xx++) if (img[(yy * w + xx) * 4 + 3] > 127) { if (yy < top) top = yy; if (yy > bot) bot = yy; }
  const s = h / Math.max(1, bot - top + 1);
  let x0 = w, x1 = 0;
  for (let yy = top; yy <= bot; yy++) for (let xx = 0; xx < w; xx++) if (img[(yy * w + xx) * 4 + 3] > 127) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; }
  const cxp = (x0 + x1 + 1) / 2, cyp = (top + bot + 1) / 2;
  const pos = [], idx = [];
  for (let yy = top; yy <= bot; yy++) {
    let xx = 0;
    while (xx < w) {
      while (xx < w && img[(yy * w + xx) * 4 + 3] <= 127) xx++;
      if (xx >= w) break;
      const a = xx; while (xx < w && img[(yy * w + xx) * 4 + 3] > 127) xx++;
      const b = xx;
      const X0 = (a - cxp) * s, X1 = (b - cxp) * s, Z0 = (yy - cyp) * s, Z1 = (yy + 1 - cyp) * s;
      const k = pos.length / 3;
      pos.push(X0, y, Z0, X1, y, Z0, X1, y, Z1, X0, y, Z1);
      idx.push(k, k + 2, k + 1, k, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(idx);
  return { geo: g, width: (x1 - x0 + 1) * s, height: h };
}

// dimension line on the floor from a to b (floor points), offset sideways by `off` (m, along the
// floor normal x direction), end ticks, a gap in the middle with the label
export function dimensionLine(a, b, label, { off = 0.08, h = 0.045, lw = 0.0028, tick = 0.035, y = 0.0004, readAlong = null, elev = null } = {}) {
  const dir = b.clone().sub(a).setY(0); const L = dir.length(); dir.normalize();
  const side = V3(-dir.z, 0, dir.x).multiplyScalar(Math.sign(off) || 1);
  const o = Math.abs(off);
  const A = a.clone().setY(y).addScaledVector(side, o), B = b.clone().setY(y).addScaledVector(side, o);
  const parts = [];
  const tx = textGeo(label, { h, y });
  // along the line: the label sits in a gap; read across the frame: the line is whole and the
  // label sits beside it, away from the product
  const gap = readAlong ? 0 : tx.width / 2 + h * 0.6;
  const mid = A.clone().lerp(B, 0.5);
  const strip = (p, q, w) => {
    const d = q.clone().sub(p); const l = d.length(); if (l < 1e-5) return null;
    const g = new THREE.PlaneGeometry(l, w); g.rotateX(-Math.PI / 2);
    g.rotateY(-Math.atan2(d.z, d.x));
    const c = p.clone().lerp(q, 0.5); g.translate(c.x, y, c.z);
    return g;
  };
  if (gap > 0) { parts.push(strip(A, mid.clone().addScaledVector(dir, -gap), lw)); parts.push(strip(mid.clone().addScaledVector(dir, gap), B, lw)); }
  else parts.push(strip(A, B, lw));
  for (const P of [A, B]) parts.push(strip(P.clone().addScaledVector(side, -tick * 0.5), P.clone().addScaledVector(side, tick * 0.5), lw));
  // arrow heads: small triangles pointing at the ticks
  for (const [P, s] of [[A, 1], [B, -1]]) {
    const tip = P.clone(), back = P.clone().addScaledVector(dir, s * h * 0.5);
    const w2 = h * 0.16;
    const g = new THREE.BufferGeometry();
    const l1 = back.clone().addScaledVector(side, w2), l2 = back.clone().addScaledVector(side, -w2);
    g.setAttribute('position', new THREE.Float32BufferAttribute([tip.x, y, tip.z, l1.x, y, l1.z, l2.x, y, l2.z], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 2));
    g.setIndex(s > 0 ? [0, 2, 1] : [0, 1, 2]);
    parts.push(g);
  }
  // label: reading along the line (left to right as the camera sees it: caller orients a -> b), or
  // along `readAlong` (the camera's right vector) and stretched in depth by 1 / sin(elev) so the
  // letters keep their proportions on the foreshortened floor
  const tg = tx.geo;
  const rd = readAlong ? readAlong.clone().setY(0).normalize() : dir;
  if (readAlong && elev) tg.scale(1, 1, 1 / Math.sin((elev * Math.PI) / 180));
  tg.rotateY(-Math.atan2(rd.z, rd.x));
  const lab = readAlong ? mid.clone().addScaledVector(side, h * (elev ? 1 / Math.sin((elev * Math.PI) / 180) : 1) * 0.75 + tick * 0.5) : mid;
  tg.translate(lab.x, 0, lab.z);
  parts.push(tg);
  return G.merge(parts.filter(Boolean).map((g) => (g.index ? g : g)));
}

// ink for dimension lines (brand Inkt, matte)
export function inkMat() {
  return cached('ink5', () => new THREE.MeshStandardMaterial({ color: '#2A2724', roughness: 0.9, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, name: 'dimension ink' }));
}

// A framing proxy that pins the auto-framing to one camera: four points round `target` in the
// plane facing a camera at (az, el) degrees, half-size `half` (m). With the view hint
// {azimuth: az, elevation: el, fov, fill}, the camera ends up at distance half / (tan(fov/2) * fill)
// from target; mark everything else noFrame.
export function viewProxy(target, az, el, half) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const dir = V3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  const f = dir.clone().negate();
  const r = V3().crossVectors(f, V3(0, 1, 0)).normalize(), u = V3().crossVectors(r, f).normalize();
  const pos = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const q = target.clone().addScaledVector(r, sx * half).addScaledVector(u, sy * half); pos.push(q.x, q.y, q.z); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([0, 0, 0]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff00ff }));
  m.layers.set(5); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false;
  m.userData.frameProxy = true;
  return m;
}

export { V3, TAU };
