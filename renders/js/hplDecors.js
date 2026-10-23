// Decor laminate / compact-HPL table tops (furniture group, round 5): stone, concrete and wood
// prints as the terrastafel tops come (patioTable.js), each as one procedural colour map with a
// matching relief (normal map) in metres, one tile per top (no visible repeat on a 60-120 cm top).
//
//   hplDecor(name) -> { face, edge, compact }
//     name  'beton' | 'graniet' | 'leisteen' | 'marmer-wit' | 'marmer-zwart' | 'teak' |
//           'eiken-grijs' | 'vintage-hout'   (null for an unknown name)
//     face  material for the top and bottom faces; uv in metres centred on the top (as F.slab caps)
//     edge  the edge band: the black core of compact HPL for the compact decors, the decor itself
//           (wrapped laminate edge) for the others
// What each decor must read as at ~1 mm/px:
//   beton        light warm grey with cloudy trowel mottling, pinholes and fine light grit; matte
//   graniet      salt-and-pepper speckle (black, white, grey grains of 0.5-2.5 mm) on mid grey
//   leisteen     dark blue-grey slate with lamination streaks along the cleft and a cleft relief; matte
//   marmer-wit   Carrara: off-white with soft grey clouds and meandering grey veins (fine + bold)
//   marmer-zwart Nero Marquina: deep black with crisp white veins
//   teak         golden-brown wood print, straight grain, dark pore lines
//   eiken        natural oak print (round 6)
//   eiken-grijs  grey-washed oak print
//   vintage-hout boards of 9-16 cm in mixed weathered tones (grey, brown, worn whitewash), seams,
//                knots and nail holes, brushed grain relief
// Deterministic (seeded noise), no Math.random().
import * as THREE from 'three';
import { makeNoise2, rng } from './rng.js';

export const DECOR_TILE = 0.8; // metres covered by one texture tile
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function dataTex(data, N, { srgb = false, name = '' } = {}) {
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  // uv in metres centred on the top -> one tile, centred
  t.repeat.set(1 / DECOR_TILE, 1 / DECOR_TILE); t.offset.set(0.5, 0.5);
  t.needsUpdate = true; t.name = name;
  return t;
}
function heightToNormal(H, N, strength) {
  const out = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const xl = Math.max(0, x - 1), xr = Math.min(N - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(N - 1, y + 1);
    const dx = (H[y * N + xr] - H[y * N + xl]) * strength, dy = (H[yd * N + x] - H[yu * N + x]) * strength;
    const l = Math.hypot(dx, dy, 1), k = (y * N + x) * 4;
    out[k] = Math.round((-dx / l * 0.5 + 0.5) * 255); out[k + 1] = Math.round((-dy / l * 0.5 + 0.5) * 255);
    out[k + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); out[k + 3] = 255;
  }
  return out;
}

// Generic generator: pix(x, y) -> [r, g, b] (sRGB 0..255) and height h, over a tile of DECOR_TILE metres.
function makeDecor(key, N, pix, post = null) {
  const data = new Uint8Array(N * N * 4), H = new Float32Array(N * N);
  const o = { r: 0, g: 0, b: 0, h: 0 };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i / N) * DECOR_TILE, y = (j / N) * DECOR_TILE;
    o.h = 0; pix(x, y, o);
    const k = (j * N + i) * 4;
    data[k] = clamp(Math.round(o.r), 0, 255); data[k + 1] = clamp(Math.round(o.g), 0, 255); data[k + 2] = clamp(Math.round(o.b), 0, 255); data[k + 3] = 255;
    H[j * N + i] = o.h;
  }
  if (post) post(data, H, N);
  let L = 0, n = 0;
  for (let k = 0; k < N * N * 4; k += 4 * 7) { L += 0.2126 * srgbToLin(data[k] / 255) + 0.7152 * srgbToLin(data[k + 1] / 255) + 0.0722 * srgbToLin(data[k + 2] / 255); n++; }
  return { data, H, albedoL: L / n };
}
// stamp round grains / dots into the colour data (and height)
function speckle(data, H, N, R, { count, rMin, rMax, pick, dh = 0 }) {
  const px = N / DECOR_TILE;
  for (let s = 0; s < count; s++) {
    const cx = R() * N, cy = R() * N, rad = (rMin + (rMax - rMin) * R() * R()) * px;
    const [cr, cg, cb, a] = pick(R);
    const ri = Math.ceil(rad + 1);
    for (let yy = -ri; yy <= ri; yy++) for (let xx = -ri; xx <= ri; xx++) {
      const X = Math.floor(cx) + xx, Y = Math.floor(cy) + yy;
      if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
      const d = Math.hypot(X + 0.5 - cx, Y + 0.5 - cy);
      const w = a * (1 - sstep(rad - 0.6, rad + 0.6, d));
      if (w <= 0) continue;
      const k = (Y * N + X) * 4;
      data[k] += (cr - data[k]) * w; data[k + 1] += (cg - data[k + 1]) * w; data[k + 2] += (cb - data[k + 2]) * w;
      H[Y * N + X] += dh * w;
    }
  }
}

// ---------------------------------------------------------------- stone and concrete
function beton() {
  const { noise, fbm } = makeNoise2(301), n2 = makeNoise2(302);
  return makeDecor('beton', 1024, (x, y, o) => {
    const cloud = fbm(x * 2.2, y * 2.2, 5) * 0.09 + fbm(x * 9 + 4, y * 9, 4) * 0.05 + n2.fbm(x * 0.9, y * 0.6 + 2, 3) * 0.05;
    const trowel = n2.noise(x * 5 + n2.fbm(x * 2, y * 2, 3) * 2, y * 0.9) * 0.025;
    const grit = noise(x * 380, y * 380) * 0.025 + noise(x * 900 + 3, y * 900) * 0.018;
    const k = 1 + cloud + trowel + grit;
    o.r = 160 * k; o.g = 157 * k; o.b = 150 * k;
    o.h = grit * 2 + cloud * 0.6;
  }, (data, H, N) => {
    const R = rng(303);
    // pinholes (dark, sunk) and light sand grains
    speckle(data, H, N, R, { count: 2600, rMin: 0.0003, rMax: 0.0011, pick: (r) => [92 + r() * 20, 90 + r() * 18, 86 + r() * 16, 0.75], dh: -1.4 });
    speckle(data, H, N, R, { count: 5000, rMin: 0.0002, rMax: 0.0006, pick: (r) => [196 + r() * 18, 193 + r() * 18, 186 + r() * 16, 0.45], dh: 0.3 });
  });
}
function graniet() {
  const { noise, fbm } = makeNoise2(311);
  return makeDecor('graniet', 1024, (x, y, o) => {
    const k = 1 + fbm(x * 3, y * 3, 4) * 0.06 + noise(x * 300, y * 300) * 0.05;
    o.r = 132 * k; o.g = 130 * k; o.b = 126 * k;
    o.h = noise(x * 500, y * 500) * 0.3;
  }, (data, H, N) => {
    const R = rng(312);
    speckle(data, H, N, R, { count: 26000, rMin: 0.0003, rMax: 0.0016, pick: (r) => { const v = 92 + r() * 70; return [v, v - 1, v - 3, 0.85]; } });
    speckle(data, H, N, R, { count: 22000, rMin: 0.0003, rMax: 0.0014, pick: (r) => { const v = 28 + r() * 34; return [v, v, v + 2, 0.92]; } });
    speckle(data, H, N, R, { count: 16000, rMin: 0.0003, rMax: 0.0012, pick: (r) => { const v = 196 + r() * 40; return [v, v - 2, v - 6, 0.9]; } });
    speckle(data, H, N, R, { count: 2200, rMin: 0.0003, rMax: 0.0009, pick: (r) => [150 + r() * 30, 118 + r() * 20, 104 + r() * 16, 0.6] });
  });
}
function leisteen() {
  const { noise, fbm } = makeNoise2(321), n2 = makeNoise2(322);
  return makeDecor('leisteen', 1024, (x, y, o) => {
    // lamination along x: streaks stretched along the cleft, gently waving
    const yy = y + n2.fbm(x * 1.4, y * 0.7, 3) * 0.05;
    const streak = fbm(x * 1.6, yy * 26, 5) * 0.12 + fbm(x * 5 + 3, yy * 70, 3) * 0.05;
    const cloud = n2.fbm(x * 2.5 + 5, y * 2.5, 4) * 0.06;
    const fine = noise(x * 420, y * 700) * 0.03;
    const k = 1 + streak + cloud + fine;
    o.r = 64 * k; o.g = 68 * k; o.b = 73 * k;
    // cleft relief: shallow steps along the lamination, fine grain
    o.h = fbm(x * 2.2, yy * 34, 5) * 2.6 + noise(x * 300, y * 500) * 0.25;
  });
}
function marble(seed, base, vein, { alpha1, alpha2, cloud, flow = [0.8, 0.45], freq = 5.5, hazeK = 1, turbK = 0.12 }) {
  const { noise, fbm } = makeNoise2(seed), n2 = makeNoise2(seed + 1), n3 = makeNoise2(seed + 2);
  const turb = (x, y, nz) => { let t = 0, f = 2, a = 1; for (let o = 0; o < 5; o++) { t += Math.abs(nz.noise(x * f, y * f)) * a; f *= 2.1; a *= 0.5; } return t; };
  return makeDecor(`marble${seed}`, 1280, (x, y, o) => {
    // classic turbulent marble: bands along a flow direction, bent by turbulence; only some bands
    // show (visibility mask), each as a crisp core in a soft haze; a finer cross-vein network on top
    // the linear flow must dominate the warp's gradient, or the bands close into contour loops
    const warp = n3.fbm(x * 1.1, y * 1.1, 4) * 2.4 + n2.fbm(x * 3.2 + 2, y * 3.2, 3) * 0.55 + turb(x * 3, y * 3, n2) * turbK;
    const t = (x * flow[0] + y * flow[1]) * freq + warp;
    const sv = Math.abs(Math.sin(Math.PI * t));
    const vis = sstep(-0.15, 0.3, n3.fbm(x * 1.4 + 5, y * 1.4, 3) + 0.08 * Math.sin(t * 0.7));
    const core = (1 - sv) ** 30 * vis, haze = ((1 - sv) ** 6 * 0.45 + (1 - sv) ** 2 * 0.1) * vis * hazeK;
    const t2 = (-x * 0.45 + y * 1.0) * freq * 2.2 + n2.fbm(x * 2.4 + 7, y * 2.4, 4) * 3.0 + turb(x * 4 + 3, y * 4, n3) * 0.15;
    const s2 = Math.abs(Math.sin(Math.PI * t2));
    const vis2 = sstep(0.05, 0.35, n2.fbm(x * 2.2 + 9, y * 2.2, 3));
    const fine = (1 - s2) ** 46 * vis2;
    const cl = fbm(x * 2.5 + 9, y * 2.5, 4) * cloud + noise(x * 260, y * 260) * 0.012;
    const a = clamp(core * alpha1 + haze * alpha1 * 0.7 + fine * alpha2);
    o.r = base[0] * (1 + cl) * (1 - a) + vein[0] * a; o.g = base[1] * (1 + cl) * (1 - a) + vein[1] * a; o.b = base[2] * (1 + cl) * (1 - a) + vein[2] * a;
    o.h = 0;
  });
}
const marmerWit = () => marble(331, [236, 234, 230], [122, 126, 131], { alpha1: 0.6, alpha2: 0.2, cloud: 0.035, hazeK: 1.7 });
const marmerZwart = () => marble(347, [31, 32, 34], [222, 219, 212], { alpha1: 0.85, alpha2: 0.4, cloud: 0.12, flow: [0.55, -0.7], freq: 4.5, hazeK: 0.45, turbK: 0.045 });

// ---------------------------------------------------------------- wood prints
// grain along x; planks: [y0, y1, tone] across y
function woodPrint(seed, { planks, pore = 0.25, figure = 0.08, ringScale = 120, contrast = 0.22, seams = false, nails = false, knots = 0, wash = 0 }) {
  const { noise, fbm } = makeNoise2(seed), n2 = makeNoise2(seed + 1);
  const R = rng(seed + 2);
  const P = planks.map((p) => ({ ...p, off: R() * 10, pith: R() * 0.3, depth: 0.04 + 0.08 * R(), knot: R() < knots ? { x: 0.1 + 0.6 * R(), y: p.y0 + (p.y1 - p.y0) * (0.3 + 0.4 * R()), r: 0.006 + 0.008 * R() } : null }));
  const plankAt = (y) => P.find((p) => y >= p.y0 && y < p.y1) || P[P.length - 1];
  return makeDecor(`wood${seed}`, 1280, (x, y, o) => {
    const p = plankAt(y);
    const c = y - p.y0;
    const dy = c - p.pith * (p.y1 - p.y0) + 0.008 * fbm(x * 1.3 + p.off, 3.3, 3);
    let r = Math.sqrt(dy * dy + (p.depth - 0.01 * x) ** 2) + 0.0014 * fbm(x * 5 + p.off, c * 30, 3);
    let kn = 0;
    if (p.knot) {
      const dxk = (x - p.knot.x) / 2.2, dk = y - p.knot.y, d = Math.hypot(dxk, dk);
      r += 0.005 * Math.exp(-(d * d) / (p.knot.r * p.knot.r * 9));
      kn = 1 - sstep(p.knot.r * 0.4, p.knot.r, Math.hypot(x - p.knot.x, dk));
    }
    const ring = r * ringScale, f = ring - Math.floor(ring);
    const late = sstep(0.55, 0.8, f) * (1 - sstep(0.92, 1, f)) * (0.7 + 0.6 * noise(Math.floor(ring) * 2.1, x * 3 + p.off));
    const pr = pore ? Math.max(0, noise(x * 60 + p.off, y * 1300) * 0.6 + noise(x * 140, y * 2400 + p.off) * 0.5 - 0.3) : 0;
    const fig = fbm(x * 1.5 + p.off, c * 8, 3) * figure;
    let k = 1 + fig - late * contrast - pr * pore * 1.6 - kn * 0.5;
    // weathering: worn whitewash in the grain hollows of some boards
    let ww = 0;
    if (wash && p.wash) ww = clamp(sstep(0.08, 0.45, n2.fbm(x * 2.5 + p.off, y * 70, 4) + 0.1 * n2.noise(x * 4, p.off)) * p.wash * (1 - late) * (0.6 + 0.8 * pr));
    let rr = p.tone[0] * k, gg = p.tone[1] * k, bb = p.tone[2] * k;
    rr += (226 - rr) * ww; gg += (220 - gg) * ww; bb += (208 - bb) * ww;
    // seams between boards: a dark 1.5 mm joint with soft shoulders
    let seam = 0;
    if (seams) { const e = Math.min(c, p.y1 - y); seam = 1 - sstep(0.0004, 0.0018, e); }
    o.r = rr * (1 - 0.75 * seam); o.g = gg * (1 - 0.75 * seam); o.b = bb * (1 - 0.75 * seam);
    o.h = -pr * 1.4 + late * 0.35 - seam * 3 + (seams ? noise(x * 40, y * 900) * 0.25 : 0) - kn * 0.3;
  }, nails ? (data, H, N) => {
    // nail holes near both ends of each board
    const Rn = rng(seed + 9), px = N / DECOR_TILE;
    for (const p of P) for (const xe of [0.04 + 0.02 * Rn(), DECOR_TILE - 0.05 - 0.02 * Rn()]) {
      const yc = (p.y0 + p.y1) / 2 + (Rn() - 0.5) * 0.02;
      const cx = xe * px, cy = yc * px, rad = 0.0016 * px;
      for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) {
        const X = Math.floor(cx) + xx, Y = Math.floor(cy) + yy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        const d = Math.hypot(X - cx, Y - cy), w = 1 - sstep(rad - 0.7, rad + 0.7, d), halo = Math.exp(-((d / (rad * 2.4)) ** 2)) * 0.35;
        const kk = (Y * N + X) * 4; const m = 1 - Math.max(w * 0.85, halo);
        data[kk] *= m; data[kk + 1] *= m; data[kk + 2] *= m * 0.98; H[Y * N + X] -= w * 1.5;
      }
    }
  } : null);
}
const ONE = (tone) => [{ y0: -1, y1: 2, tone }];
const teak = () => woodPrint(351, { planks: ONE([146, 106, 74]), pore: 0.32, figure: 0.07, ringScale: 150, contrast: 0.2 });
// round 6: warm natural oak print (terrastafel eiken; the solid-wood material showed a dark smudge mid-top)
const eiken = () => woodPrint(381, { planks: ONE([184, 140, 94]), pore: 0.34, figure: 0.08, ringScale: 120, contrast: 0.22 });
const eikenGrijs = () => woodPrint(361, { planks: ONE([168, 160, 148]), pore: 0.3, figure: 0.06, ringScale: 110, contrast: 0.2 });
function vintageHout() {
  const R = rng(371);
  const tones = [[132, 118, 100], [168, 140, 104], [104, 96, 88], [178, 162, 136], [126, 100, 74], [150, 144, 134], [96, 80, 64], [172, 150, 118]];
  const planks = []; let y = 0, i = 0;
  while (y < DECOR_TILE) { const w = 0.09 + 0.07 * R(); planks.push({ y0: y, y1: Math.min(DECOR_TILE + 0.001, y + w), tone: tones[(i * 3 + Math.floor(R() * 2)) % tones.length], wash: R() < 0.4 ? 0.25 + 0.3 * R() : 0 }); y += w; i++; }
  return woodPrint(372, { planks, pore: 0.22, figure: 0.12, ringScale: 90, contrast: 0.28, seams: true, nails: true, knots: 0.5, wash: 1 });
}

// ---------------------------------------------------------------- materials
const DECORS = {
  beton: { make: beton, rough: 0.62, cc: 0.08, normal: 0.9, strength: 2.2, compact: true },
  graniet: { make: graniet, rough: 0.42, cc: 0.25, normal: 0.25, strength: 1.5, compact: false },
  leisteen: { make: leisteen, rough: 0.58, cc: 0.08, normal: 0.8, strength: 2.6, compact: false },
  'marmer-wit': { make: marmerWit, rough: 0.3, cc: 0.4, normal: 0, compact: true },
  'marmer-zwart': { make: marmerZwart, rough: 0.28, cc: 0.45, normal: 0, compact: true },
  teak: { make: teak, rough: 0.5, cc: 0.15, normal: 0.45, strength: 2.0, compact: true },
  eiken: { make: eiken, rough: 0.5, cc: 0.15, normal: 0.45, strength: 2.0, compact: false },
  'eiken-grijs': { make: eikenGrijs, rough: 0.52, cc: 0.12, normal: 0.45, strength: 2.0, compact: true },
  'vintage-hout': { make: vintageHout, rough: 0.6, cc: 0.06, normal: 0.8, strength: 2.4, compact: false },
};
const ALIAS = { betonlook: 'beton', granite: 'graniet', slate: 'leisteen', 'wit-marmer': 'marmer-wit', 'zwart-marmer': 'marmer-zwart', marmer: 'marmer-wit', 'grijs-eiken': 'eiken-grijs', vintage: 'vintage-hout', 'vintage-houtlook': 'vintage-hout' };

export function hplDecor(name) {
  let key = String(name || '').toLowerCase().replace(/\s+/g, '-');
  key = ALIAS[key] || key;
  const D = DECORS[key];
  if (!D) return null;
  return cached(key, () => {
    const { data, H, albedoL } = D.make();
    const N = Math.round(Math.sqrt(data.length / 4));
    const map = dataTex(data, N, { srgb: true, name: `decor ${key}` });
    const face = new THREE.MeshPhysicalMaterial({
      map, roughness: D.rough, specularIntensity: 0.5, clearcoat: D.cc, clearcoatRoughness: 0.3, name: `HPL decor ${key}`,
    });
    if (D.normal) { face.normalMap = dataTex(heightToNormal(H, N, D.strength), N, { name: `decor relief ${key}` }); face.normalScale = new THREE.Vector2(D.normal, D.normal); }
    face.userData.albedoL = albedoL;
    let edge = face;
    if (D.compact) {
      // compact HPL: the black phenolic core shows on the sawn, polished edge
      edge = new THREE.MeshPhysicalMaterial({ color: '#1E1D1C', roughness: 0.42, specularIntensity: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.3, name: 'compact HPL core' });
      edge.userData.albedoL = 0.012;
    }
    return { face, edge, compact: D.compact, key };
  });
}
