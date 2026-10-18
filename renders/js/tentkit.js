// Shared helpers for the tents/canopies/sails group (opblaasbareTent, frameTent, carportTent,
// stretchtent, stertent, canopyRoof, marketStall, gardenPavilion, shadeSail, tarp).
//
//  - colour aliases + the catalogue tent light rig (same studio set-up as easyUpTent)
//  - force-density form finding (FDM) for tensioned membranes: the standard method for
//    tensile structures. Free edges carry an edge cable (webbing / kedder rope) and curve
//    inward; pole tops and anchor points are fixed. Linear system solved with SOR.
//  - grid surfaces with uvs measured in metres on the surface, swept tubes, ropes with
//    a catenary sag, ground stakes, ratchet straps
//  - materials not in js/materials.js: stretch fabric, woven PE, polyester canopy cloth,
//    HDPE shade cloth, clear PVC sheet, varnished wooden poles, guy rope
//  - a full-colour sample artwork ("voorbeeld") for printed roofs, mapped on its own uv set
// Units: metres, Y up, front +Z (see renders/README.md).
import * as THREE from 'three';
import * as G from './geom.js';
import * as M from './materials.js';
import * as TX from './textures.js';
import { rng } from './rng.js';

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const V3 = G.V3;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------------------------------
// colours
const ALIAS = { zandkleur: 'zand', sand: 'zand', creme: 'creme', white: 'wit', black: 'zwart', red: 'rood', blue: 'blauw', green: 'groen', orange: 'oranje', grey: 'grijs', gray: 'grijs', anthracite: 'antraciet' };
export function col(c, fallback = M.COLORS.wit) {
  if (!c) return fallback;
  if (typeof c !== 'string') return c;
  const k = c.toLowerCase().replace(/[\s_-]/g, '');
  return M.resolveColor(ALIAS[k] || k, fallback);
}
export function lumOf(hex) { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

// Catalogue light rig for tents (identical to easyUpTent's tentRig, so every tent in the shop
// is lit the same way): dark studio reflections, a feathered softbox spot at 1.78x the
// half-diagonal from front-left, fill from behind-right, tilted sky dome, overhead floor key.
export function tentRig(hex, { walled = false, print = false } = {}) {
  const L = lumOf(hex);
  const white = L > 0.7 && !print, black = L < 0.06;
  const key = { azimuth: -72, elevation: 32, intensity: 4.86, cone: 10, distanceRel: 1.78, aimRel: [0.0, 0.4, 0.69], angle: 40, penumbra: 1.0 };
  return {
    env: 'studio', envIntensity: 1.0,
    key,
    floorKey: { azimuth: -15, elevation: 80, cone: 16, intensity: 3.0 },
    keyShadow: 0.46,
    rim: { azimuth: -155, elevation: 35, intensity: 0.3 },
    fill: { azimuth: 100, elevation: 12, intensity: 5.5 },
    bounce: { intensity: 0.5 },
    dome: { count: 2, intensity: 2.4, maxZenith: 62, tilt: 25, tiltAzimuth: -72 },
    exposure: white ? 0.52 : 'auto',
    ...(white ? { toneMapping: 'neutral', shoulder: 0.88 } : {}),
    exposureAuto: { ref: 0.2, base: 0.64, power: 0.22, min: 0.45, max: 1.0 },
    groundSplit: true,
    shadowFloor: 0.6,
    groundAO: { strength: walled ? 0.5 : 0.32, maxZenith: 75 },
    contact: { res: 2048, h0: 0.03, strength: 1.0, blur: 2.6, wide: { h0: 0.05, sigma: 0.028, strength: 0.42 } },
    ...(black ? {
      key: { ...key, intensity: 8 },
      dome: { count: 2, intensity: 1.2, maxZenith: 62, tilt: 25, tiltAzimuth: -72 },
      fill: { azimuth: 100, elevation: 12, intensity: 5.0 },
      rim: { azimuth: -155, elevation: 35, intensity: 0.2 },
      exposure: 0.85,
    } : {}),
  };
}

// ---------------------------------------------------------------------------------------
// Force-density net. Nodes with positions P (Float64Array, 3n), edges with force density q
// (force / length). Free node equilibrium: sum_j q_ij (x_j - x_i) + p_i = 0.
export class Net {
  constructor(n) {
    this.n = n; this.P = new Float64Array(n * 3); this.fixed = new Uint8Array(n); this.load = null;
    this.edges = [];
  }
  set(i, x, y, z) { this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z; }
  get(i, out = new THREE.Vector3()) { return out.set(this.P[i * 3], this.P[i * 3 + 1], this.P[i * 3 + 2]); }
  pin(i, x, y, z) { this.set(i, x, y, z); this.fixed[i] = 1; }
  edge(i, j, q) { if (i !== j) this.edges.push(i, j, q); }
  addLoad(i, x, y, z) { if (!this.load) this.load = new Float64Array(this.n * 3); this.load[i * 3] += x; this.load[i * 3 + 1] += y; this.load[i * 3 + 2] += z; }
  solve({ iters = 900, omega = 1.86 } = {}) {
    const n = this.n, E = this.edges, m = E.length / 3;
    const deg = new Int32Array(n + 1);
    for (let k = 0; k < m; k++) { deg[E[k * 3]]++; deg[E[k * 3 + 1]]++; }
    const off = new Int32Array(n + 1);
    for (let i = 0; i < n; i++) off[i + 1] = off[i] + deg[i];
    const nb = new Int32Array(off[n]), qq = new Float64Array(off[n]), fill = off.slice(0, n);
    for (let k = 0; k < m; k++) {
      const a = E[k * 3], b = E[k * 3 + 1], q = E[k * 3 + 2];
      nb[fill[a]] = b; qq[fill[a]++] = q; nb[fill[b]] = a; qq[fill[b]++] = q;
    }
    const P = this.P, F = this.fixed, L = this.load;
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n; i++) {
        if (F[i]) continue;
        let sx = 0, sy = 0, sz = 0, sq = 0;
        for (let k = off[i]; k < off[i + 1]; k++) { const j = nb[k] * 3, w = qq[k]; sx += w * P[j]; sy += w * P[j + 1]; sz += w * P[j + 2]; sq += w; }
        if (L) { sx += L[i * 3]; sy += L[i * 3 + 1]; sz += L[i * 3 + 2]; }
        if (sq <= 0) continue;
        const o = i * 3;
        P[o] += omega * (sx / sq - P[o]); P[o + 1] += omega * (sy / sq - P[o + 1]); P[o + 2] += omega * (sz / sq - P[o + 2]);
      }
    }
    return this;
  }
}

// ---------------------------------------------------------------------------------------
// geometry

// Surface from rows of points: rows[j][i] (j = 0..nv, i = 0..nu). uv measured in metres along
// the rows (u) and columns (v), so fabric textures keep their scale. closedU: the last point of
// every row equals the first (seam normals are averaged).
export function gridGeometry(rows, { closedU = false, flip = false, uv1 = null } = {}) {
  const nv = rows.length - 1, nu = rows[0].length - 1;
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  const vacc = new Float64Array(nu + 1);
  for (let j = 0; j <= nv; j++) {
    let uacc = 0;
    for (let i = 0; i <= nu; i++) {
      const p = rows[j][i], k = j * (nu + 1) + i;
      if (i > 0) uacc += p.distanceTo(rows[j][i - 1]);
      if (j > 0) vacc[i] += p.distanceTo(rows[j - 1][i]);
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      uv[k * 2] = uacc; uv[k * 2 + 1] = vacc[i];
    }
  }
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (uv1) g.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (closedU) {
    const n = g.attributes.normal;
    for (let j = 0; j <= nv; j++) {
      const a = j * (nu + 1), b = a + nu;
      const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return g;
}

// Thin shell: the same grid offset along its normals by +-t/2, plus the rim strips, so cloth
// has a visible edge thickness (hems) and shadows see a closed surface. Returns the outer grid
// only when t = 0.
export function gridFromFn(fn, nu, nv, opts = {}) {
  const rows = [];
  for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) { const p = V3(); fn(i / nu, j / nv, p, i, j); r.push(p); } rows.push(r); }
  return { rows, geo: gridGeometry(rows, opts) };
}

// Parallel-transport frames along a polyline.
export function frames(pts) {
  const n = pts.length, T = [], N = [], B = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; T.push(b.clone().sub(a).normalize()); }
  const ref = Math.abs(T[0].y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  const nn = ref.clone().addScaledVector(T[0], -ref.dot(T[0])).normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) nn.addScaledVector(T[i], -nn.dot(T[i])).normalize();
    N.push(nn.clone()); B.push(V3().crossVectors(T[i], nn).normalize());
  }
  return { T, N, B };
}

// Tube swept along pts; radius r or rFn(i, angle) -> radius. uv in metres (u around, v along).
export function sweep(pts, r, radial = 16, { rFn = null, closed = false, capStart = false, capEnd = false, refUp = null } = {}) {
  const fr = frames(pts);
  if (refUp) {
    // re-orient frames so N points as close as possible to refUp (stable seam position)
    for (let i = 0; i < pts.length; i++) {
      const t = fr.T[i]; const nn = refUp.clone().addScaledVector(t, -refUp.dot(t));
      if (nn.lengthSq() > 1e-8) { nn.normalize(); fr.N[i] = nn; fr.B[i] = V3().crossVectors(t, nn).normalize(); }
    }
  }
  const rows = [];
  for (let j = 0; j <= radial; j++) {
    const a = (j / radial) * TAU, row = [];
    for (let i = 0; i < pts.length; i++) {
      const rr = rFn ? rFn(i, a) : r;
      row.push(pts[i].clone().addScaledVector(fr.N[i], Math.cos(a) * rr).addScaledVector(fr.B[i], Math.sin(a) * rr));
    }
    rows.push(row);
  }
  // rows: j around, i along (u = along, v = around, closed in v); flipped winding -> outward normals
  const g = gridGeometry(rows, { flip: true });
  // fix the seam normals (v = 0 and v = 1 rows coincide)
  const n = g.attributes.normal, nu = pts.length - 1;
  for (let i = 0; i <= nu; i++) {
    const a = i, b = radial * (nu + 1) + i;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b); const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  const parts = [g];
  if (capStart) parts.push(domeCap(pts[0], fr.T[0].clone().negate(), rFn ? rFn(0, 0) : r));
  if (capEnd) parts.push(domeCap(pts[pts.length - 1], fr.T[pts.length - 1], rFn ? rFn(pts.length - 1, 0) : r));
  return parts.length > 1 ? G.merge(parts) : g;
}

// Hemispherical end cap (inflated tube end), centred at c pointing along dir.
export function domeCap(c, dir, r, squash = 0.75, segs = 16) {
  const g = new THREE.SphereGeometry(r, segs, Math.max(4, segs / 2), 0, TAU, 0, Math.PI / 2);
  g.scale(1, squash, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
  g.applyQuaternion(q); g.translate(c.x, c.y, c.z);
  return g;
}

// Polyline of a rope from a to b with catenary-like sag (fraction of the span) straight down.
export function ropePts(a, b, sag = 0.01, n = 16) {
  const L = a.distanceTo(b), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(a.clone().lerp(b, t).add(V3(0, -4 * sag * L * t * (1 - t), 0))); }
  return pts;
}
export function rope(a, b, r = 0.005, sag = 0.008, radial = 6) { return sweep(ropePts(a, b, sag, 14), r, radial); }

// Galvanised ground stake: round bar driven in at a slight angle away from the load, with a
// welded hook. `at` is where it enters the floor, `away` the horizontal direction of the pull.
export function stakeGeo(at, away, { len = 0.12, r = 0.0095 } = {}) {
  const d = away.clone().setY(0).normalize();
  const top = at.clone().addScaledVector(d, -0.025).setY(len);
  const parts = [G.tube(at.clone().setY(-0.02), top, r, 12)];
  // hook: a short bend over the top towards the rope
  const pts = [];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 1.1; pts.push(top.clone().addScaledVector(d, 0.022 - 0.022 * Math.cos(a)).add(V3(0, 0.022 * Math.sin(a), 0))); }
  parts.push(sweep(pts, r * 0.8, 8));
  return G.merge(parts);
}

// Flat webbing strap (ratchet strap) from a to b, width w, faces turned to `side`.
export function strapGeo(a, b, w = 0.035, t = 0.0018, up = V3(0, 1, 0)) {
  const dir = b.clone().sub(a).normalize();
  let side = V3().crossVectors(dir, up); if (side.lengthSq() < 1e-6) side = V3(1, 0, 0); side.normalize();
  return G.flatBar(a, b, w, t, side, t * 0.45);
}

// Ratchet buckle (galvanised frame + handle) centred on p along dir.
export function ratchetGeo(p, dir, { scale = 1 } = {}) {
  const g = G.roundedBox(0.05 * scale, 0.03 * scale, 0.13 * scale, 0.005 * scale);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dir.clone().normalize());
  g.applyQuaternion(q); g.translate(p.x, p.y, p.z);
  return g;
}

// Pole cap / foot plate helpers
export function footPlate(x, z, s = 0.16, t = 0.008) { const g = G.roundedBox(s, t, s, 0.006); g.translate(x, t / 2, z); return g; }

// ---------------------------------------------------------------------------------------
// materials
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

function baseAlbedo(hex, white = 0.82, black = 0.045) {
  const c = new THREE.Color(hex); const L = lumOf(hex);
  if (L > white) c.multiplyScalar(white / L);
  if (L < 0.06) c.lerp(new THREE.Color().setRGB(black, black, black * 1.05), Math.min(1, (0.06 - L) / 0.06 + 0.35));
  return c;
}

// Stretch tent fabric: heavy knitted polyester with a PU/silver coating on the back: a matte
// textile face with a soft fibre sheen, very fine knit, almost opaque.
export function stretchFabric(color) {
  const hex = col(color, M.COLORS.zand);
  return cached(`stretch:${hex}`, () => {
    const L = lumOf(hex), base = baseAlbedo(hex, 0.8);
    const m = new THREE.MeshPhysicalMaterial({
      color: base, roughness: 0.78, metalness: 0, specularIntensity: 0.32,
      sheen: L < 0.1 ? 0.55 : 0.4, sheenRoughness: 0.55,
      sheenColor: L < 0.1 ? base.clone().multiplyScalar(3.0) : new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.18),
      normalMap: TX.knitNormal({ loops: 40 }).clone(), normalScale: new THREE.Vector2(0.4, 0.4), side: THREE.DoubleSide,
    });
    m.normalMap.repeat.set(30, 30); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.22; m.userData.translucency = 0.1 * Math.min(1, L * 1.3);
    m.name = `stretch ${hex}`;
    return m;
  });
}

// Woven polyethylene (PE party tents / carports): tape weave under a thin LDPE coating, a bit
// glossier and more translucent than PVC.
export function peFabric(color) {
  const hex = col(color, M.COLORS.wit);
  return cached(`pe:${hex}`, () => {
    const L = lumOf(hex), base = baseAlbedo(hex, 0.8);
    const m = new THREE.MeshPhysicalMaterial({
      color: base, roughness: 0.5, specularIntensity: 0.55, sheen: 0.15, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'),
      normalMap: TX.weaveNormal({ threads: 16, strength: 1.4 }).clone(), normalScale: new THREE.Vector2(0.35, 0.35), side: THREE.DoubleSide,
    });
    m.normalMap.repeat.set(36, 36); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.42; m.userData.translucency = 0.3 * Math.min(1, L * 1.3);
    m.name = `pe ${hex}`;
    return m;
  });
}

// Polyester canopy cloth (replacement easy-up roofs, market stall roofs): PU coated, matte.
export function polyesterFabric(color) {
  const hex = col(color, M.COLORS.wit);
  return cached(`polyester:${hex}`, () => {
    const L = lumOf(hex), base = M.tentFabricBase(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: base, roughness: L < 0.1 ? 0.64 : 0.72, specularIntensity: 0.4, sheen: 0.3, sheenRoughness: 0.55,
      sheenColor: L < 0.1 ? base.clone().multiplyScalar(2.4) : new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.2),
      normalMap: TX.plainWeaveNormal(), normalScale: new THREE.Vector2(0.8, 0.8), side: THREE.DoubleSide,
    });
    m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(M.WEAVE_REPEAT, M.WEAVE_REPEAT); m.normalMap.needsUpdate = true;
    m.userData.envSpec = L < 0.1 ? 0.32 : 0.26; m.userData.translucency = 0.2 * Math.min(1, L * 1.4);
    m.name = `polyester ${hex}`;
    return m;
  });
}

// HDPE knitted shade cloth: open raschel knit, matte, lets ~8 % light through.
export function shadeCloth(color) {
  const hex = col(color, M.COLORS.antraciet);
  return cached(`shade:${hex}`, () => {
    const L = lumOf(hex), base = baseAlbedo(hex, 0.75);
    const m = new THREE.MeshPhysicalMaterial({
      color: base, roughness: 0.86, specularIntensity: 0.3, sheen: 0.5, sheenRoughness: 0.6,
      sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.25),
      normalMap: TX.knitNormal({ loops: 24, strength: 2.0, seed: 8 }).clone(), normalScale: new THREE.Vector2(0.9, 0.9), side: THREE.DoubleSide,
    });
    m.normalMap.repeat.set(9, 9); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.15; m.userData.stochasticAlpha = 0.93; m.userData.translucency = 0.12 * Math.min(1, L * 1.4);
    m.name = `shadecloth ${hex}`;
    return m;
  });
}

// Clear PVC sheet (0.5 mm): high transmission, glossy, faint green-grey edge tint.
export function clearPVC({ coverage = 0.3, tint = '#7F8F8D' } = {}) {
  return cached(`clearpvc:${coverage}:${tint}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: tint, roughness: 0.08, metalness: 0, specularIntensity: 1.0, clearcoat: 0.9, clearcoatRoughness: 0.05,
      envMapIntensity: 1.2, side: THREE.DoubleSide, name: 'clear pvc',
      normalMap: TX.softWrinkleNormal().clone(), normalScale: new THREE.Vector2(0.05, 0.05),
    });
    m.normalMap.repeat.set(0.8, 0.8); m.normalMap.needsUpdate = true;
    m.userData.stochasticAlpha = coverage;
    return m;
  });
}

// Varnished pine pole (stretch tents): warm wood, grain along the pole (prism uv: v along).
export function woodPole() {
  return cached('woodpole', () => {
    const map = TX.birchAlbedo({ tone: [192, 146, 96], seed: 33 }).clone(); map.repeat.set(1.0, 0.25); map.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({ map, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35, specularIntensity: 0.5, name: 'pine pole' });
  });
}

// Braided polyester guy rope.
export function ropeMat(color = '#2B2C2E') {
  const hex = col(color, '#2B2C2E');
  return cached(`rope:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.75, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.2), normalMap: TX.twillNormal().clone(), normalScale: new THREE.Vector2(0.6, 0.6), name: `rope ${hex}` });
    m.normalMap.repeat.set(40, 40); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Fabric material with a full-colour print: the base cloth (weave normal map on uv) with the
// artwork as albedo on uv1 (channel 1). The cloth's own colour is replaced by a print-base white.
export function printed(baseMat, tex, key) {
  return cached(`printed:${baseMat.uuid}:${key}`, () => {
    const m = baseMat.clone();
    m.color = new THREE.Color(0.86, 0.86, 0.86);
    m.map = tex; m.map.channel = 1;
    m.sheenColor = new THREE.Color(0.9, 0.9, 0.9); m.sheen = Math.min(m.sheen, 0.25);
    m.userData = { envSpec: baseMat.userData.envSpec, translucency: (baseMat.userData.translucency || 0) * 0.5 };
    m.name = `${baseMat.name} print ${key}`;
    return m;
  });
}

// ---------------------------------------------------------------------------------------
// Full-colour sample artwork ("voorbeeld"): a customer design placeholder. kind 'panel' is a
// square design (logo emblem low in the panel so it sits well on a triangular roof face),
// 'band' a long strip for valances. Drawn procedurally (no image files in the pipeline).
export function artwork(kind = 'panel', { text = 'JOUW ONTWERP' } = {}) {
  return cached(`art:${kind}:${text}`, () => {
    const W = kind === 'band' ? 2048 : 1024, H = kind === 'band' ? 256 : 1024;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, H, W, 0);
    gr.addColorStop(0, '#173A7A'); gr.addColorStop(0.55, '#1A6F9C'); gr.addColorStop(1, '#13A39A');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const R = rng(77);
    // soft diagonal light rays
    g.globalAlpha = 0.12; g.fillStyle = '#ffffff';
    for (let k = 0; k < 7; k++) { const x = (k / 7) * W * 1.4 - W * 0.2; g.beginPath(); g.moveTo(x, H); g.lineTo(x + W * 0.08, H); g.lineTo(x + W * 0.5, 0); g.lineTo(x + W * 0.42, 0); g.closePath(); g.fill(); }
    g.globalAlpha = 1;
    if (kind === 'star') {
      // seen from above, projected on a star / round roof: emblem round the mast, the text on
      // the slope that faces the hero camera (image bottom = front of the tent)
      const cx = W * 0.5, cy = H * 0.5;
      g.fillStyle = '#F4C430'; g.beginPath(); g.arc(cx - W * 0.06, cy + H * 0.03, W * 0.13, 0, TAU); g.fill();
      g.fillStyle = '#EF5B4B'; g.globalAlpha = 0.9; g.beginPath(); g.arc(cx + W * 0.08, cy + H * 0.05, W * 0.095, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = '#FFFFFF'; g.lineWidth = W * 0.016; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i <= 40; i++) { const x = cx - W * 0.2 + (i / 40) * W * 0.4, y = cy + H * 0.13 + Math.sin(i / 40 * TAU * 1.5) * H * 0.02; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${Math.round(H * 0.046)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${Math.round(H * 0.004)}px`;
      g.fillText(text, cx, H * 0.71);
      for (let k = 0; k < 40; k++) { g.fillStyle = ['#F4C430', '#EF5B4B', '#FFFFFF'][k % 3]; g.globalAlpha = 0.85; const a = R() * TAU, rr = (0.28 + 0.2 * R()) * W; g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9 - H * 0.06, W * (0.005 + 0.007 * R()), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    } else if (kind === 'band') {
      // circles at the ends, text centred
      g.fillStyle = '#F4C430'; g.beginPath(); g.arc(H * 0.75, H * 0.55, H * 0.42, 0, TAU); g.fill();
      g.fillStyle = '#EF5B4B'; g.globalAlpha = 0.92; g.beginPath(); g.arc(W - H * 0.8, H * 0.45, H * 0.36, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${Math.round(H * 0.46)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${Math.round(H * 0.04)}px`;
      g.fillText(text, W / 2, H * 0.54);
    } else {
      // emblem: sun + overlapping coral disc + white wave, text underneath
      const cx = W * 0.5, cy = H * 0.6;
      g.fillStyle = '#F4C430'; g.beginPath(); g.arc(cx - W * 0.07, cy, W * 0.17, 0, TAU); g.fill();
      g.fillStyle = '#EF5B4B'; g.globalAlpha = 0.9; g.beginPath(); g.arc(cx + W * 0.1, cy + H * 0.02, W * 0.12, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = '#FFFFFF'; g.lineWidth = W * 0.022; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i <= 40; i++) { const x = cx - W * 0.26 + (i / 40) * W * 0.52, y = cy + H * 0.1 + Math.sin(i / 40 * TAU * 1.5) * H * 0.025; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${Math.round(H * 0.085)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${Math.round(H * 0.006)}px`;
      g.fillText(text, cx, H * 0.86);
      // a few confetti dots
      for (let k = 0; k < 26; k++) { g.fillStyle = ['#F4C430', '#EF5B4B', '#FFFFFF'][k % 3]; g.globalAlpha = 0.85; g.beginPath(); g.arc(R() * W, R() * H * 0.45, W * (0.006 + 0.01 * R()), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  });
}

// mesh helpers
export function addMesh(group, geo, mat, { cast = true, receive = true, name = '' } = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; m.name = name; group.add(m); return m;
}
// Turn any 2D outline (array of {x,z}) into an offset outline (positive = outward) assuming CCW.
export function offsetPoly(pts, d) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const n1 = V3(b.z - a.z, 0, -(b.x - a.x)).normalize(), n2 = V3(c.z - b.z, 0, -(c.x - b.x)).normalize();
    const m = n1.clone().add(n2).normalize();
    const k = d / Math.max(0.2, m.dot(n1));
    out.push(V3(b.x + m.x * k, 0, b.z + m.z * k));
  }
  return out;
}

// PVC-coated cloth: the catalogue's easy-up cloth (materials.js pvcCloth / pvcPatch, with the
// engine's weave, macro and translucency hooks) when available, else the older tentFabric, so
// every PVC tent in the shop shows the same cloth.
export const pvc = (color, opts) => (M.pvcCloth || M.tentFabric)(color, opts);
export const pvcPatch = (color) => (M.pvcPatch || M.tentPatch)(color);
const CLOTH_NAME = /^(tentFabric|tentPatch|pvcCloth|pvcPatch) /;
const THREAD_NAME = /^(thread|pvcThread) /;
export const isCloth = (m) => !!m && CLOTH_NAME.test(m.name || '');
export const isThread = (m) => !!m && THREAD_NAME.test(m.name || '');
