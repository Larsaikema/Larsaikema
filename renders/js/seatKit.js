// Seating kit (furniture group, v2): materials and geometry that make chairs, stools and
// tables read as real products at catalogue size (~1 mm per pixel on a 1200-2000 px hero).
//
//   materials  fabricMat (woven polyester upholstery: weave + melange + slubs), velvetMat (pile
//              with crush mottling and sheen), leatherMat (PU kunstleer, pebble grain),
//              woodMat (v2 grain: straight fine lines, low-contrast rings, pores / flecks,
//              per-species tone; U = along the grain), rattanMats (PE strands, 3 tones),
//              holedSheet (powder-coated sheet with drainage holes via alphaMap).
//   geometry   softBlock (upholstered block: crowned top, bellied sides, radial gather folds
//              at the corners, low-frequency unevenness) + weltPath (piping exactly on the
//              block's top / bottom seam), roundCushion + its welt, swapUV / uvJitter (grain
//              along the length of sweeps and prisms), weavePanel (real over-under PE strand
//              geometry on any surface patch), ribbedTube (helically wrapped strand on a tube),
//              wireSweep (round wire along a polyline, smooth), plyBoard (multiplex board with
//              visible plies on the edge).
//   lighting   SEAT_RIG: six dome lights with soft (20 texel) PCF per frame instead of two: the
//              sky occlusion of back posts over a flat seat converges to a smooth gradient
//              instead of an X of discrete shadow wedges. exposureFor(root): the engine's
//              per-product auto exposure, but with the true albedo of textured materials
//              (userData.albedoL) instead of the engine's flat 0.45 for anything with a map.
//
// Units metres, Y up, front +Z, uv in metres measured on the surface. No Math.random().
import * as THREE from 'three';
import * as G from './geom.js';
import { makeNoise2, rng } from './rng.js';
import { mergeVertices } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

// --------------------------------------------------------------------------- textures
function dataTex(data, w, h, { srgb = false, wrap = THREE.RepeatWrapping, name = '' } = {}) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = wrap;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true; t.name = name;
  return t;
}
function heightToNormal(H, w, h, strength, wrap = true) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = wrap ? (x - 1 + w) % w : Math.max(0, x - 1), xr = wrap ? (x + 1) % w : Math.min(w - 1, x + 1);
    const yu = wrap ? (y - 1 + h) % h : Math.max(0, y - 1), yd = wrap ? (y + 1) % h : Math.min(h - 1, y + 1);
    const dx = (H[y * w + xr] - H[y * w + xl]) * strength, dy = (H[yd * w + x] - H[yu * w + x]) * strength;
    const l = Math.hypot(dx, dy, 1);
    const k = (y * w + x) * 4;
    out[k] = Math.round((-dx / l * 0.5 + 0.5) * 255); out[k + 1] = Math.round((-dy / l * 0.5 + 0.5) * 255);
    out[k + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); out[k + 3] = 255;
  }
  return out;
}
const grey = (vals, w, h) => { const d = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(255, Math.round(vals[i] * 255))); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } return d; };

// Periodic value noise (integer periods) for tileable fabric / leather tiles.
function makePNoise(seed) {
  const R = rng(seed); const N = 4096; const g = new Float32Array(N); for (let i = 0; i < N; i++) g[i] = R() * 2 - 1;
  const hash = (i, j) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return g[(h ^ (h >>> 16)) & (N - 1)]; };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const m = (a, p) => ((a % p) + p) % p;
  const noise = (x, y, px, py) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = fade(x - xi), v = fade(y - yi);
    const x0 = m(xi, px), x1 = m(xi + 1, px), y0 = m(yi, py), y1 = m(yi + 1, py);
    return (hash(x0, y0) * (1 - u) + hash(x1, y0) * u) * (1 - v) + (hash(x0, y1) * (1 - u) + hash(x1, y1) * u) * v;
  };
  const fbm = (x, y, px, py, oct = 4) => { let s = 0, a = 1, n = 0; for (let o = 0; o < oct; o++) { s += a * noise(x, y, px, py); n += a; a *= 0.5; x *= 2; y *= 2; px *= 2; py *= 2; } return s / n; };
  return { noise, fbm, hash };
}

// Woven polyester upholstery. One tile = 40 x 40 mm (512 px, 0.08 mm/px): 2/1 basket-ish
// plain weave of 1 mm yarns, per-crossing yarn tone (melange), slubs along the warp (4-12 mm),
// and a 5-20 mm mottle. At hero size the yarns average out; the melange, slubs and mottle stay
// as a fine, slightly irregular grain, which is what upholstery looks like in a packshot.
export const FABRIC_TILE = 0.064;
export function fabricTextures(seed = 3) {
  return cached(`fabric:${seed}`, () => {
    const N = 1024, threads = 80, cell = N / threads;
    const P = makePNoise(seed), R = rng(seed * 3 + 1);
    const H = new Float32Array(N * N), A = new Float32Array(N * N), Rg = new Float32Array(N * N);
    const tone = new Float32Array(threads * threads); for (let i = 0; i < tone.length; i++) tone[i] = (R() - 0.5);
    // slubs: per warp thread a few thicker / lighter segments
    const slub = new Float32Array(threads * N);
    for (let i = 0; i < threads; i++) {
      for (let k = 0; k < 3; k++) {
        const c = R() * N, L = (0.1 + 0.2 * R()) * N, a = (R() - 0.35) * 0.9;
        for (let y = 0; y < N; y++) { let d = Math.abs(y - c); d = Math.min(d, N - d); slub[i * N + y] += a * Math.exp(-((d / (L / 2)) ** 4)); }
      }
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
      const over = (i + j) % 2 === 0;
      const pw = Math.sqrt(Math.max(0, 1 - (2 * fx - 1) ** 2)), pf = Math.sqrt(Math.max(0, 1 - (2 * fy - 1) ** 2));
      const zw = Math.sin(Math.PI * fy) * (over ? 1 : -1), zf = Math.sin(Math.PI * fx) * (over ? -1 : 1);
      const hw = 0.6 * pw + 0.4 * zw + slub[i * N + y] * 0.6, hf = 0.6 * pf + 0.4 * zf;
      const warpOnTop = hw >= hf;
      const h = Math.max(hw, hf);
      const mott = P.fbm(x / N * 4, y / N * 4, 4, 4, 3);
      // heather / crepe: 1.5-3 mm tone and relief irregularity, the part of the cloth that
      // still resolves at ~1 mm per pixel
      const heather = P.fbm(x / N * 28, y / N * 28, 28, 28, 3);
      const crepe = P.fbm(x / N * 40 + 7, y / N * 40 + 3, 40, 40, 2);
      const t = tone[(j % threads) * threads + (i % threads)] * (warpOnTop ? 1 : 0.7);
      const gap = Math.min(pw, pf) < 0.25 && Math.max(pw, pf) < 0.5 ? 1 : 0;
      const k = y * N + x;
      H[k] = h * 0.35 + crepe * 1.3;
      A[k] = 0.88 + 0.07 * t + 0.06 * (warpOnTop ? slub[i * N + y] : 0) + 0.05 * mott + 0.16 * heather - 0.08 * gap;
      Rg[k] = 0.95 - 0.06 * Math.max(0, h) + 0.04 * mott;
    }
    const nrm = dataTex(heightToNormal(H, N, N, 1.4), N, N, { name: 'fabric normal' });
    const map = dataTex(grey(A, N, N), N, N, { name: 'fabric melange' });
    const rough = dataTex(grey(Rg, N, N), N, N, { name: 'fabric rough' });
    for (const t of [nrm, map, rough]) t.repeat.set(1 / FABRIC_TILE, 1 / FABRIC_TILE);
    return { nrm, map, rough, mean: 0.9 };
  });
}
// Leather grain (PU kunstleer): pebbled cells of ~1.1 mm with creased borders and a few
// longer creases. One tile = 30 mm. Returns normal + roughness (+ albedo modulation).
export const LEATHER_TILE = 0.03;
export function leatherTextures(seed = 9) {
  return cached(`leather:${seed}`, () => {
    const N = 512, cells = 27; const R = rng(seed), P = makePNoise(seed + 5);
    const pts = [];
    for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) pts.push([(i + 0.15 + 0.7 * R()) / cells, (j + 0.15 + 0.7 * R()) / cells]);
    const H = new Float32Array(N * N), A = new Float32Array(N * N), Rg = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, ci = Math.floor(u * cells), cj = Math.floor(v * cells);
      let d1 = 9, d2 = 9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = (ci + di + cells) % cells, jj = (cj + dj + cells) % cells;
        const p = pts[jj * cells + ii];
        const px = p[0] + Math.floor((ci + di) / cells) * 1, py = p[1] + Math.floor((cj + dj) / cells) * 1;
        const d = Math.hypot(u - px, v - py);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      const edge = (d2 - d1) * cells; // 0 at the border between cells
      const crease = 0.25 * Math.max(0, 1 - Math.abs(P.fbm(u * 6, v * 6, 6, 6, 3)) * 14);
      const h = Math.sqrt(Math.min(1, edge * 2.2)) - crease;
      const k = y * N + x;
      H[k] = h; A[k] = 0.93 + 0.07 * Math.min(1, edge * 3) - 0.05 * crease; Rg[k] = 0.62 - 0.14 * Math.min(1, edge * 2.5) + 0.2 * crease;
    }
    const nrm = dataTex(heightToNormal(H, N, N, 2.0), N, N, { name: 'leather normal' });
    const map = dataTex(grey(A, N, N), N, N, { name: 'leather mod' });
    const rough = dataTex(grey(Rg, N, N), N, N, { name: 'leather rough' });
    for (const t of [nrm, map, rough]) t.repeat.set(1 / LEATHER_TILE, 1 / LEATHER_TILE);
    return { nrm, map, rough, mean: 0.96 };
  });
}
// Velvet: pile shading mottle ("crush"): soft irregular patches of 1-6 cm where the pile leans
// differently (normal + sheen roughness), plus a fine pile stipple. One tile = 0.24 m.
export const VELVET_TILE = 0.24;
export function velvetTextures(seed = 13) {
  return cached(`velvet2:${seed}`, () => {
    const N = 512; const P = makePNoise(seed);
    const H = new Float32Array(N * N), Rg = new Float32Array(N * N), A = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      const c = P.fbm(u * 5, v * 5, 5, 5, 4), f = P.noise(u * 160, v * 160, 160, 160);
      const k = y * N + x;
      const fine = P.noise(u * 220 + 3, v * 220 + 9, 220, 220);
      H[k] = c * 1.0 + f * 0.05; Rg[k] = 0.75 + 0.2 * c; A[k] = 0.9 + 0.12 * c + 0.05 * fine;
    }
    const nrm = dataTex(heightToNormal(H, N, N, 6.0), N, N, { name: 'velvet crush' });
    const rough = dataTex(grey(Rg, N, N), N, N, { name: 'velvet sheen rough' });
    const map = dataTex(grey(A, N, N), N, N, { name: 'velvet mod' });
    for (const t of [nrm, rough, map]) t.repeat.set(1 / VELVET_TILE, 1 / VELVET_TILE);
    return { nrm, rough, map, mean: 0.9 };
  });
}

// --------------------------------------------------------------------------- materials
// Every textured material records its true mean albedo (userData.albedoL) for exposureFor().
function tagAlbedo(m, color, mean = 1) { m.userData.albedoL = lumOf(new THREE.Color(color)) * mean; return m; }

export function fabricMat(hex, { sheen = 0.7, rough = 1.0, seed = 3 } = {}) {
  return cached(`fabricMat:${hex}:${sheen}:${rough}:${seed}`, () => {
    const t = fabricTextures(seed);
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(1 / t.mean), map: t.map, normalMap: t.nrm, normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: t.rough, roughness: rough, specularIntensity: 0.14, metalness: 0,
      sheen, sheenRoughness: 0.62, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.3), name: `fabric ${hex}`,
    });
    m.userData.envSpec = 0.22;
    return tagAlbedo(m, hex);
  });
}
export function velvetMat(hex) {
  return cached(`velvetMat:${hex}`, () => {
    const t = velvetTextures();
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(0.78 / t.mean), map: t.map, normalMap: t.nrm, normalScale: new THREE.Vector2(0.1, 0.1),
      roughness: 1.0, specularIntensity: 0.03, metalness: 0,
      sheen: 0.75, sheenRoughness: 0.8, sheenRoughnessMap: t.rough, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.5), name: `velvet ${hex}`,
    });
    m.userData.envSpec = 0.15;
    return tagAlbedo(m, hex, 0.78);
  });
}
export function leatherMat(hex) {
  return cached(`leatherMat:${hex}`, () => {
    const t = leatherTextures();
    const c = new THREE.Color(hex);
    const L = lumOf(c);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(1 / t.mean), map: t.map, normalMap: t.nrm, normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: t.rough, roughness: L > 0.5 ? 0.78 : 0.72, specularIntensity: 0.5, metalness: 0,
      clearcoat: 0.22, clearcoatRoughness: 0.38, name: `faux leather ${hex}`,
    });
    m.userData.envSpec = 0.55;
    return tagAlbedo(m, hex);
  });
}

// Wood v2. Board face, U along the grain. Tile lenM x widM (MirroredRepeat, book-matched).
// Low-contrast latewood lines from (gently conical, wandering) growth rings cut by the board
// plane, fine pore streaks (oak strong, beech faint), short ray flecks (beech), a soft long
// colour figure and, for spruce, the odd pin knot. Natural tones in sRGB.
const WOOD2 = {
  eiken:  { base: [186, 146, 100], late: [150, 108, 66], ring: 0.55, rings: 210, pore: 0.20, fleck: 0.03, figure: 0.07, knots: 0 },
  beuken: { base: [214, 172, 128], late: [196, 150, 106], ring: 0.35, rings: 260, pore: 0.05, fleck: 0.10, figure: 0.05, knots: 0 },
  vuren:  { base: [232, 206, 160], late: [208, 160, 104], ring: 0.75, rings: 170, pore: 0.0, fleck: 0, figure: 0.05, knots: 0.6 },
};
export function woodTextures2(species = 'eiken', seed = 3, { lenM = 1.0, widM = 0.25 } = {}) {
  const S = WOOD2[species] || WOOD2.eiken;
  return cached(`wood2:${species}:${seed}:${lenM}:${widM}`, () => {
    const w = 2048, h = 512;
    const { noise, fbm } = makeNoise2(seed);
    const R = rng(seed * 11 + 3);
    const data = new Uint8Array(w * h * 4), Hh = new Float32Array(w * h);
    const pith = widM * (0.2 + 0.6 * R()), depth = 0.07 + 0.08 * R(), taper = 0.004 + 0.006 * R();
    const knots = [];
    if (S.knots) for (let i = 0; i < 2; i++) if (R() < S.knots) knots.push({ x: (0.2 + 0.6 * R()) * lenM, y: (0.15 + 0.7 * R()) * widM, r: 0.003 + 0.004 * R() });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = (x / w) * lenM, c = (y / h) * widM;
      const dy = c - pith + 0.01 * fbm(a * 1.1, 3.3, 3) + 0.002 * noise(a * 7, c * 13);
      let r = Math.sqrt(dy * dy + (depth - taper * a) ** 2) + 0.0012 * fbm(a * 5 + 7, c * 30, 3);
      let kn = 0;
      for (const k of knots) {
        const dx = (a - k.x) / 2.5, dk = c - k.y, d = Math.hypot(dx, dk);
        r += 0.004 * Math.exp(-(d * d) / (k.r * k.r * 16));
        kn = Math.max(kn, 1 - sstep(k.r * 0.5, k.r, Math.hypot(a - k.x, dk)));
      }
      const ring = r * S.rings, f = ring - Math.floor(ring);
      let late = sstep(0.58, 0.8, f) * (1 - sstep(0.93, 1.0, f));
      late *= 0.75 + 0.5 * noise(Math.floor(ring) * 2.3, a * 3);
      const pore = S.pore ? Math.max(0, noise(a * 60, c * 1400) * 0.6 + noise(a * 150 + 3, c * 2600) * 0.5 - 0.25) * (1 - 0.5 * late) : 0;
      const fleck = S.fleck ? Math.max(0, noise(a * 260, c * 700) - 0.55) * 2 : 0;
      const fig = fbm(a * 1.6, c * 9, 3) * S.figure + noise(a * 0.7, c * 2) * S.figure * 0.6;
      const t = Math.min(1, late * S.ring);
      let k = 1 + fig - pore * S.pore * 2.2 - fleck * S.fleck * 1.5;
      const kd = 1 - kn * 0.45;
      const i = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) data[i + ch] = Math.max(0, Math.min(255, (S.base[ch] + (S.late[ch] - S.base[ch]) * t) * k * (kd - ch * kn * 0.04)));
      data[i + 3] = 255;
      Hh[y * w + x] = -pore * 1.2 + t * 0.12 - kn * 0.1;
    }
    const map = dataTex(data, w, h, { srgb: true, wrap: THREE.MirroredRepeatWrapping, name: `wood2 ${species}` });
    const bump = dataTex(heightToNormal(Hh, w, h, 1.2, false), w, h, { wrap: THREE.MirroredRepeatWrapping, name: `wood2 bump ${species}` });
    map.repeat.set(1 / lenM, 1 / widM); bump.repeat.set(1 / lenM, 1 / widM);
    return { map, bump, base: S.base };
  });
}
// stain: null (clear lacquer over natural wood) or a target colour (the grain stays visible;
// a near-black stain keeps only a faint grain, like black-lacquered beech).
export function woodMat(species = 'eiken', { stain = null, finish = 'lak', seed = 3 } = {}) {
  return cached(`woodMat2:${species}:${stain}:${finish}:${seed}`, () => {
    const { map, bump, base } = woodTextures2(species, seed);
    const nat = new THREE.Color().setRGB(base[0] / 255, base[1] / 255, base[2] / 255, THREE.SRGBColorSpace);
    let color = new THREE.Color(1, 1, 1);
    if (stain) { const st = new THREE.Color(stain); color = new THREE.Color(Math.min(2, st.r / nat.r), Math.min(2, st.g / nat.g), Math.min(2, st.b / nat.b)); }
    const dark = stain && lumOf(new THREE.Color(stain)) < 0.03;
    const m = new THREE.MeshPhysicalMaterial({
      map, color, normalMap: bump, normalScale: new THREE.Vector2(0.3, 0.3),
      roughness: finish === 'mat' ? 0.62 : finish === 'hoogglans' ? 0.22 : 0.46, specularIntensity: 0.5,
      clearcoat: finish === 'mat' ? 0 : finish === 'hoogglans' ? 0.9 : dark ? 0.45 : 0.3, clearcoatRoughness: finish === 'hoogglans' ? 0.08 : 0.32,
      name: `wood2 ${species}${stain ? ' ' + stain : ''}`,
    });
    m.userData.envSpec = 0.6;
    m.userData.albedoL = lumOf(nat) * lumOf(color) / Math.max(1e-3, lumOf(new THREE.Color(1, 1, 1))) * 0.97;
    return m;
  });
}

// PE rattan strands: three slightly different tones of one colour (real wicker is never one
// flat colour), fine lengthwise extrusion ridges, satin.
export function rattanMats(hex, n = 3) {
  return cached(`rattanMats:${hex}:${n}`, () => {
    const ridges = cached('rattanRidges', () => {
      const W = 64, Hn = 256; const H = new Float32Array(W * Hn); const { noise } = makeNoise2(71);
      for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) H[y * W + x] = 0.5 * Math.sin((x / W) * TAU * 4) + 0.3 * noise(x * 0.5, y * 0.02);
      const t = dataTex(heightToNormal(H, W, Hn, 1.0), W, Hn, { name: 'rattan ridges' });
      t.repeat.set(1 / 0.008, 1 / 0.1);
      return t;
    });
    const out = [];
    const c0 = new THREE.Color(hex);
    for (let i = 0; i < n; i++) {
      const k = [1.0, 0.94, 1.06][i % 3];
      const c = c0.clone().multiplyScalar(k);
      const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, specularIntensity: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.35, normalMap: ridges, normalScale: new THREE.Vector2(0.25, 0.25), name: `PE rattan ${hex} ${i}` });
      m.userData.envSpec = 0.45;
      out.push(m);
    }
    return out;
  });
}

// Canvas alpha mask with round holes for a sheet whose uv spans [0,1]^2 over sizeM x sizeM
// metres. holes: [[x, y, r]] in metres from the sheet centre. Returns a material clone of
// `base` with the holes cut (alphaTest), double sided.
export function holedSheet(base, holes, sizeM, key) {
  return cached(`holed:${base.uuid}:${key}`, () => {
    const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, N, N); g.fillStyle = '#000';
    for (const [x, y, r] of holes) { g.beginPath(); g.arc((x / sizeM + 0.5) * N, (0.5 - y / sizeM) * N, (r / sizeM) * N, 0, TAU); g.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.flipY = true;
    const m = base.clone();
    m.alphaMap = t; m.alphaTest = 0.5; m.side = THREE.DoubleSide;
    if (base.normalMap) { m.normalMap = base.normalMap.clone(); m.normalMap.repeat.set(sizeM * 40, sizeM * 40); m.normalMap.needsUpdate = true; }
    m.name = `${base.name} holed`;
    m.userData = { ...base.userData }; delete m.userData.__hooked;
    return m;
  });
}

// --------------------------------------------------------------------------- lighting
export const SEAT_RIG = { default: { dome: { count: 6, radius: 20 } } };
// The engine's auto exposure formula (DEFAULT_RIG.exposureAuto) with true albedos.
export function exposureFor(root, { ref = 0.2, base = 0.86, power = 0.22, min = 0.6, max = 1.25 } = {}) {
  let sum = 0, area = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || o.userData.contactProxy) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    let L = 0.25;
    if (m.userData && m.userData.albedoL != null) L = m.userData.albedoL;
    else if (m.color && !m.map && (m.metalness ?? 0) < 0.5) L = lumOf(m.color);
    else if (m.map) L = 0.45;
    const pos = o.geometry.attributes.position, idx = o.geometry.index;
    const n = idx ? idx.count : pos.count;
    const step = Math.max(3, Math.floor(n / 3 / 4000) * 3);
    let A = 0;
    const s = new THREE.Vector3(); o.getWorldScale(s); const sc = Math.abs(s.x * s.y * s.z) ** (2 / 3);
    for (let i = 0; i + 2 < n; i += step) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
      A += b.sub(a).cross(c.sub(a)).length() * 0.5 * (step / 3);
    }
    sum += L * A * sc; area += A * sc;
  });
  const L = Math.max(0.005, area > 0 ? sum / area : 0.2);
  return Math.min(max, Math.max(min, base * Math.pow(ref / L, power)));
}
export function seatRig(root, extra = {}) {
  const d = { ...SEAT_RIG.default, exposure: exposureFor(root), ...(extra.default || {}) };
  if (extra.default && extra.default.dome) d.dome = { ...SEAT_RIG.default.dome, ...extra.default.dome };
  return { ...extra, default: d };
}

// --------------------------------------------------------------------------- uv helpers
// Sweeps / prisms carry uv = (perimeter, length): swap so U runs along the part (grain).
export function swapUV(g) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i); uv.setXY(i, uv.getY(i), u); } uv.needsUpdate = true; return g; }
// Random offset (and mirror) of the uv so no two parts show the same stretch of grain.
export function uvJitter(g, R, { du = 2, dv = 0.5, flip = true } = {}) {
  const uv = g.attributes.uv, ou = R() * du, ov = R() * dv, fu = flip && R() < 0.5 ? -1 : 1;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * fu + ou, uv.getY(i) + ov);
  uv.needsUpdate = true; return g;
}
// Box-projected uv in metres with U on each face along `along` ('x'|'y'|'z') where possible.
export function uvBoxAlong(g, along = 'x') {
  const pos = g.attributes.position, nor = g.attributes.normal;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2));
  const uv = g.attributes.uv; const ax = { x: 0, y: 1, z: 2 }[along];
  for (let i = 0; i < pos.count; i++) {
    const p = [pos.getX(i), pos.getY(i), pos.getZ(i)], n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    const dom = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2;
    const others = [0, 1, 2].filter((k) => k !== dom);
    const u = others.includes(ax) ? ax : others[0];
    const v = others.find((k) => k !== u);
    uv.setXY(i, p[u], p[v]);
  }
  uv.needsUpdate = true; return g;
}

// --------------------------------------------------------------------------- upholstery
// Upholstered block w x h x d centred on the origin. Starts from a subdivided cube mapped to
// a rounded box (edge radius r), then: crown on the top (and bottom if crownBottom), belly on
// the sides, fabric gathered at the four vertical corners (radial folds fanning from each
// corner over the top and the sides), slight low-frequency unevenness. All displacement goes
// through shape.displace(), which weltPath() reuses, so piping sits exactly on the seam.
export function blockShape(w, h, d, { r = 0.02, crown = 0.01, crownBottom = 0, belly = 0.004, gather = 0.0016, uneven = 0.0008, seed = 1, arch = 0 } = {}) {
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  const { noise } = makeNoise2(seed);
  const R = rng(seed); const phase = [R() * 6, R() * 6, R() * 6, R() * 6];
  function displace(P, o) {
    // P: point on the rounded box, o: its outward unit offset (the rounded-box normal)
    let { x, y, z } = P;
    const bx = Math.max(0, 1 - (x / (w / 2)) ** 2), bz = Math.max(0, 1 - (z / (d / 2)) ** 2);
    const bell = Math.pow(bx, 1.3) * Math.pow(bz, 1.3);
    const top = sstep(-hy - r * 0.5, hy + r * 0.2, y);
    y += crown * bell * top - crownBottom * bell * (1 - top);
    if (arch) y += arch * Math.max(0, 1 - (x / (w / 2)) ** 2) * sstep(0, h / 2, P.y);
    // belly on the side walls (strongest at mid height, none at the edges / corners)
    const sideW = Math.max(0, 1 - (P.y / (h / 2)) ** 2);
    const ox = o.x, oz = o.z;
    x += belly * ox * sideW * Math.max(0, 1 - (z / (d / 2)) ** 4);
    z += belly * oz * sideW * Math.max(0, 1 - (x / (w / 2)) ** 4);
    // gather folds at the vertical corners: radial ridges around each corner
    let gd = 0;
    for (let k = 0; k < 4; k++) {
      const sx = k & 1 ? 1 : -1, sz = k & 2 ? 1 : -1;
      const cx = sx * hx, cz = sz * hz;
      const dx = P.x - cx, dz = P.z - cz;
      const rho = Math.hypot(dx, dz) + Math.max(0, Math.abs(P.y) - hy) * 0.3;
      const ang = Math.atan2(dz * sz, dx * sx); // 0..pi/2 around the corner
      const fall = Math.exp(-rho / 0.035) * (0.4 + 0.6 * sstep(0, hy + r, P.y));
      gd += fall * Math.sin(ang * 7 + phase[k] + rho * 40) * (0.6 + 0.4 * Math.sin(ang * 3 + phase[k] * 2));
    }
    gd = gd * gather + uneven * noise(P.x * 18 + seed, P.z * 18 + P.y * 9);
    return new THREE.Vector3(x + o.x * gd, y + o.y * gd, z + o.z * gd);
  }
  // point on the base rounded box from a core point and an offset direction
  const base = (q, o) => new THREE.Vector3(q.x + o.x * r, q.y + o.y * r, q.z + o.z * r);
  return { w, h, d, r, hx, hy, hz, displace, base };
}
export function softBlock(w, h, d, opts = {}) {
  const S = blockShape(w, h, d, opts);
  const seg = opts.seg || [Math.max(12, Math.round(w / 0.01)), Math.max(6, Math.round(h / 0.008)), Math.max(12, Math.round(d / 0.01))];
  let g = new THREE.BoxGeometry(1, 1, 1, seg[0], seg[1], seg[2]);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const pos = g.attributes.position;
  const p = new THREE.Vector3(), q = new THREE.Vector3(), o = new THREE.Vector3();
  const remap = (s, half) => { const a = Math.abs(s), s0 = 0.72; return Math.sign(s) * (a <= s0 ? (a / s0) * (half - S.r) : (half - S.r) + ((a - s0) / (1 - s0)) * S.r); };
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const X = remap(p.x * 2, w / 2), Y = remap(p.y * 2, h / 2), Z = remap(p.z * 2, d / 2);
    q.set(THREE.MathUtils.clamp(X, -S.hx, S.hx), THREE.MathUtils.clamp(Y, -S.hy, S.hy), THREE.MathUtils.clamp(Z, -S.hz, S.hz));
    o.set(X - q.x, Y - q.y, Z - q.z);
    if (o.lengthSq() < 1e-12) o.set(0, Math.sign(Y) || 1, 0);
    o.normalize();
    const P = S.base(q, o);
    const D = S.displace(P, o);
    pos.setXYZ(i, D.x, D.y, D.z);
  }
  g.computeVertexNormals();
  uvBoxAlong(g, 'x');
  g.userData.shape = S;
  return g;
}
// Piping along the top (side = 1) or bottom (side = -1) seam of a softBlock shape: a cord of
// radius cr, embedded `embed` x cr into the block so it never floats or sinks.
export function weltPath(S, side = 1, { cr = 0.003, embed = 0.45, angle = 45, n = 10 } = {}) {
  const pts = [];
  const a = (angle * Math.PI) / 180;
  const corners = [[S.hx, S.hz, 0], [-S.hx, S.hz, Math.PI / 2], [-S.hx, -S.hz, Math.PI], [S.hx, -S.hz, 1.5 * Math.PI]];
  // walk the core rectangle (+x,+z) -> (-x,+z) -> ... with the plan normal turning at corners
  for (let k = 0; k < 4; k++) {
    const [cx, cz, a0] = corners[k];
    for (let s = 0; s <= n; s++) {
      const t = a0 + (Math.PI / 2) * (s / n);
      const np = V3(Math.cos(t), 0, Math.sin(t));
      const o = np.clone().multiplyScalar(Math.cos(a)).add(V3(0, side * Math.sin(a), 0)).normalize();
      const q = V3(cx, side * S.hy, cz);
      const P = S.base(q, o), D = S.displace(P, o);
      pts.push(D.addScaledVector(o, cr * (1 - embed)));
    }
  }
  return pts;
}
// Round cushion (seat pad): radius R, height h, edge radius r, crown; optional gathered
// underside edge. Lathe based, uv in metres. Returns { geo, weltTop(cr), weltBottom(cr) }.
export function roundCushion(R, h, { r = 0.02, crown = 0.008, segs = 160, wobble = 0.0008, seed = 2 } = {}) {
  const prof = [];
  const top = h, rr = Math.min(r, h / 2 - 0.001);
  prof.push([0.0001, top + crown]);
  for (let i = 1; i <= 16; i++) { const t = i / 16, x = (R - rr) * t; prof.push([x, top + crown * (1 - t * t) ** 1.3]); }
  for (let i = 1; i <= 10; i++) { const a = (Math.PI / 2) * (1 - i / 10); prof.push([R - rr + Math.cos(a) * rr, top - rr + Math.sin(a) * rr]); }
  // side wall with a slight belly
  for (let i = 1; i <= 6; i++) { const t = i / 7; prof.push([R + 0.003 * Math.sin(Math.PI * t), top - rr - (h - 2 * rr) * t]); }
  for (let i = 0; i <= 8; i++) { const a = -(Math.PI / 2) * (i / 8); prof.push([R - rr + Math.cos(a) * rr, rr + Math.sin(a) * rr]); }
  prof.push([0.0001, 0]);
  const g = G.lathe(prof.reverse(), segs);
  const { noise } = makeNoise2(seed);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), rad = Math.hypot(x, z);
    if (rad > R * 0.5) {
      const k = 1 + (wobble * noise(Math.atan2(x, z) * 4 + seed, y * 30)) / Math.max(rad, 1e-3);
      pos.setXYZ(i, x * k, y, z * k);
    }
  }
  g.computeVertexNormals();
  const nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(nor.getY(i)) > 0.6) uv.setXY(i, x, z); else uv.setXY(i, Math.atan2(x, z) * R, y);
  }
  const welt = (side, cr = 0.003, embed = 0.45) => {
    const a = Math.PI / 4;
    const cy = side > 0 ? top - rr : rr;
    const o = [Math.cos(a), side * Math.sin(a)];
    const rad = R - rr + o[0] * (rr + cr * (1 - embed)), y = cy + o[1] * (rr + cr * (1 - embed));
    const pts = []; for (let i = 0; i < segs; i++) { const t = (i / segs) * TAU; pts.push(V3(Math.sin(t) * rad, y, Math.cos(t) * rad)); }
    return pts;
  };
  return { geo: g, welt };
}

// --------------------------------------------------------------------------- wicker
// Real over-under weave of flat PE strands over a surface patch.
//   surf(s, t) -> {p: Vector3, n: Vector3} for s in [0, W], t in [0, H] (metres on the patch)
//   pitch: strand pitch (m); sw, st: strand width / thickness; amp: over-under lift.
//   clip(s, t) -> bool: keep (used for rounded panel corners).
// Strands along s (weft) and along t (warp) alternate over/under at every crossing. Each
// strand is a sweep of a flat rounded profile whose thin side follows the surface normal.
export function weavePanel(bins, mats, surf, W, H, { pitch = 0.009, sw = 0.0075, st = 0.0016, amp = 0.0011, clip = null, seed = 5, step = 0.003 } = {}) {
  const R = rng(seed);
  const prof = G.roundedRectProfile(st, sw, st * 0.48, 2);
  const mk = (along) => {
    const L = along === 's' ? W : H, M2 = along === 's' ? H : W;
    const count = Math.floor(M2 / pitch);
    const off = (M2 - (count - 1) * pitch) / 2;
    for (let j = 0; j < count; j++) {
      const c = off + j * pitch;
      const n = Math.max(4, Math.ceil(L / step));
      let run = [];
      const flush = () => {
        if (run.length >= 3) {
          const path = run.map((e) => e.p);
          const g = sweepOnSurface(path, run.map((e) => e.n), prof);
          bins.add(mats[Math.floor(R() * mats.length) % mats.length], g);
        }
        run = [];
      };
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * L;
        const s = along === 's' ? a : c, t = along === 's' ? c : a;
        if (clip && !clip(s, t)) { flush(); continue; }
        const q = surf(s, t);
        // crossing index along this strand: alternate over / under; opposite phase for warp
        const ph = (a / pitch) * Math.PI + (j % 2) * Math.PI + (along === 's' ? 0 : Math.PI);
        const lift = amp * Math.cos(ph);
        run.push({ p: q.p.clone().addScaledVector(q.n, lift), n: q.n.clone() });
      }
      flush();
    }
  };
  mk('s'); mk('t');
}
// Sweep where the profile's x axis follows given per-point normals (no twist drift).
export function sweepOnSurface(path, normals, profile) {
  const n = path.length, m = profile.length;
  const pos = [], nor = [], uv = [], idx = [];
  let len = 0;
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    const T = new THREE.Vector3().subVectors(b, a).normalize();
    const N = normals[i].clone().addScaledVector(T, -normals[i].dot(T)).normalize();
    const B = new THREE.Vector3().crossVectors(T, N);
    if (i > 0) len += path[i].distanceTo(path[i - 1]);
    let per = 0;
    for (let j = 0; j <= m; j++) {
      const p = profile[j % m];
      if (j > 0) per += Math.hypot(p.x - profile[j - 1].x, p.y - profile[j - 1].y);
      pos.push(path[i].x + N.x * p.x + B.x * p.y, path[i].y + N.y * p.x + B.y * p.y, path[i].z + N.z * p.x + B.z * p.y);
      nor.push(N.x * p.nx + B.x * p.ny, N.y * p.nx + B.y * p.ny, N.z * p.nx + B.z * p.ny);
      uv.push(per, len);
    }
  }
  const row = m + 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) { const a = i * row + j, b = a + 1, c = a + row, d = c + 1; idx.push(a, b, d, a, d, c); }
  // flat end caps
  for (const e of [0, n - 1]) {
    const base = pos.length / 3; const T = path[e === 0 ? 1 : n - 1].clone().sub(path[e === 0 ? 0 : n - 2]).normalize().multiplyScalar(e === 0 ? -1 : 1);
    for (let j = 0; j < m; j++) { const k = (e * row + j) * 3; pos.push(pos[k], pos[k + 1], pos[k + 2]); nor.push(T.x, T.y, T.z); uv.push(0, 0); }
    for (let j = 1; j < m - 1; j++) { if (e === 0) idx.push(base, base + j + 1, base + j); else idx.push(base, base + j, base + j + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// Tube along a smooth path wrapped with a flat strand: radius modulated by a helical ridge
// pattern (pitch = strand width), so it reads as a binding, not as a ribbed hose.
export function ribbedTube(path, r, { pitch = 0.0075, depth = 0.0011, segs = 20, closed = false } = {}) {
  // resample the path by arc length
  const pts = []; let L = 0; const acc = [0];
  for (let i = 1; i < path.length + (closed ? 1 : 0); i++) { L += path[i % path.length].distanceTo(path[i - 1]); acc.push(L); }
  const ns = Math.max(8, Math.ceil(L / (pitch / 4)));
  let k = 0;
  for (let s = 0; s <= ns; s++) {
    const d = (s / ns) * L;
    while (k < acc.length - 2 && acc[k + 1] < d) k++;
    const a = path[k % path.length], b = path[(k + 1) % path.length];
    const t = (d - acc[k]) / Math.max(1e-9, acc[k + 1] - acc[k]);
    pts.push(a.clone().lerp(b, t));
  }
  const n = pts.length;
  if (closed) pitch = L / Math.max(1, Math.round(L / pitch)); // whole number of strands round the loop
  const T = pts.map((p, i) => {
    if (closed && (i === 0 || i === n - 1)) return pts[1].clone().sub(pts[n - 2]).normalize();
    return pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
  });
  let N = Math.abs(T[0].y) < 0.95 ? V3(0, 1, 0) : V3(1, 0, 0);
  N.addScaledVector(T[0], -N.dot(T[0])).normalize();
  const Ns = [N.clone()]; const q = new THREE.Quaternion();
  for (let i = 1; i < n; i++) { q.setFromUnitVectors(T[i - 1], T[i]); N = N.clone().applyQuaternion(q); N.addScaledVector(T[i], -N.dot(T[i])).normalize(); Ns.push(N); }
  if (closed) {
    // remove the transport twist (holonomy) so the last ring meets the first one exactly
    const a = Ns[n - 1], b = Ns[0];
    const phi = Math.atan2(new THREE.Vector3().crossVectors(a, b).dot(T[0]), a.dot(b));
    for (let i = 1; i < n; i++) Ns[i].applyAxisAngle(T[i], (phi * i) / (n - 1)).addScaledVector(T[i], 0).normalize();
  }
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < n; i++) {
    const B = new THREE.Vector3().crossVectors(T[i], Ns[i]);
    const along = (i / (n - 1)) * L;
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * TAU;
      // helical coordinate: strands cross the tube at the wrap angle
      const hcoord = along / pitch - th / TAU;
      const f = hcoord - Math.floor(hcoord);
      const prof = Math.sqrt(Math.max(0, 1 - ((2 * f - 1) / 0.98) ** 2));
      const rr = r + depth * (prof - 1);
      const c = Math.cos(th), s = Math.sin(th);
      pos.push(pts[i].x + (Ns[i].x * c + B.x * s) * rr, pts[i].y + (Ns[i].y * c + B.y * s) * rr, pts[i].z + (Ns[i].z * c + B.z * s) * rr);
      uv.push(th * r, along);
    }
  }
  const row = segs + 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) { const a = i * row + j, b = a + 1, c = a + row, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// --------------------------------------------------------------------------- misc geometry
// Densify a polyline so sweeps of it bend smoothly (max segment length `step`).
export function densify(pts, step = 0.01) {
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; const n = Math.max(1, Math.ceil(a.distanceTo(b) / step)); for (let k = 1; k <= n; k++) out.push(a.clone().lerp(b, k / n)); }
  return out;
}
// Multiplex board w (x) x d (z) x T with rounded plan corners rc: face plates (uv in metres,
// grain along x) and an edge band whose uv runs around the edge (u) and across the plies (v
// = 0..1 over the thickness) for a ply-edge texture. Top at y = 0.
export function plyBoard(w, d, T, { rc = 0.02, re = 0.0015, n = 10 } = {}) {
  const prof = G.roundedRectProfile(w, d, rc, n);
  const top = G.prism(prof, V3(0, -re, 0), V3(0, 0, 0), { side: V3(1, 0, 0), caps: true });
  const bot = G.prism(prof, V3(0, -T, 0), V3(0, -T + re, 0), { side: V3(1, 0, 0), caps: true });
  for (const g of [top, bot]) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i)); }
  const edge = G.prism(prof, V3(0, -T + re, 0), V3(0, -re, 0), { side: V3(1, 0, 0), caps: false });
  const p = edge.attributes.position, uv = edge.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getX(i), (p.getY(i) + T) / T);
  return { faces: G.merge([top, bot]), edge };
}
