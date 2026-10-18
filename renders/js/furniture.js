// Shared helpers for the furniture builders (barStool, chair, biertafelset, klaptafel,
// patioTable, bench, barrelTable, tableTop, trolley, stanchion):
//   - procedural textures: wood (oak / spruce / beech, flat-sawn cathedral grain with
//     pores, rays and knots), PE wicker weave, HDPE granite speckle, belt print strips;
//   - PBR materials built on them (wood, velvet, upholstery, PE rattan, stainless, belt);
//   - geometry: profile sweeps along filleted paths (bent tubes), cushions (rounded,
//     puffed boxes with merged normals), box-projected uvs in metres, castors.
// Same conventions as the rest of the pipeline: metres, Y up, front +Z, uv in metres,
// everything cached so a batch reuses textures and compiled programs. No Math.random().
import * as THREE from 'three';
import * as G from './geom.js';
import * as M from './materials.js';
import * as TX from './textures.js';
import { makeNoise2, rng } from './rng.js';
import { mergeVertices } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const cache = new Map();
function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

// ------------------------------------------------------------------------------------
// texture plumbing (non-square DataTextures)
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
    let nx = -dx, ny = -dy, nz = 1; const l = Math.hypot(nx, ny, nz);
    const k = (y * w + x) * 4;
    out[k] = Math.round((nx / l * 0.5 + 0.5) * 255); out[k + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
    out[k + 2] = Math.round((nz / l * 0.5 + 0.5) * 255); out[k + 3] = 255;
  }
  return out;
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------
// WOOD. Flat-sawn board face: growth rings are the intersection of (slightly conical)
// cylinders with the board plane -> long lines with cathedral arches where the board
// cuts through the rings. U (x) runs along the grain. One tile = lenM x widM metres;
// MirroredRepeat tiling (book-matched) hides the seam. Returns {map, bump} where bump
// is a normal map of the open pores (oak) / latewood ridges (spruce).
const WOOD = {
  // early-, latewood sRGB, rings per metre, pore strength, ray flecks, knots
  eiken:  { early: [192, 152, 104], late: [146, 104, 64], rings: 240, pores: 0.6, rays: 0.5, knots: 0, figure: 0.10 },
  oak:    null,
  vuren:  { early: [236, 214, 170], late: [214, 168, 112], rings: 210, pores: 0.12, rays: 0, knots: 0.45, figure: 0.06 },
  beuken: { early: [216, 176, 134], late: [196, 150, 108], rings: 300, pores: 0.18, rays: 0.25, knots: 0, figure: 0.07 },
};
WOOD.oak = WOOD.eiken;
export function woodTextures(species = 'eiken', { seed = 3, lenM = 1.2, widM = 0.3, w = 1024, h = 512 } = {}) {
  const S = WOOD[species] || WOOD.eiken;
  return cached(`wood:${species}:${seed}:${lenM}:${widM}:${w}:${h}`, () => {
    const { noise, fbm } = makeNoise2(seed);
    const R = rng(seed * 7 + 1);
    const knots = [];
    if (S.knots) for (let i = 0; i < 3; i++) if (R() < S.knots) knots.push({ x: (0.15 + 0.7 * R()) * lenM, y: (0.2 + 0.6 * R()) * widM, r: 0.006 + 0.01 * R() });
    const data = new Uint8Array(w * h * 4);
    const Hh = new Float32Array(w * h);
    const pithY = widM * (0.35 + 0.3 * R()), depth = 0.05 + 0.05 * R(), taper = 0.012 + 0.008 * R();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = (x / w) * lenM, c = (y / h) * widM;
      // radius in the log: conical stem + lateral wander (grain never perfectly straight)
      let dy = c - pithY + 0.012 * fbm(a * 1.3, 3.1, 3) + 0.004 * noise(a * 6, c * 9);
      let r = Math.sqrt(dy * dy + depth * depth) - taper * a + 0.0025 * fbm(a * 4 + 7, c * 40, 3);
      // knots: rings swirl around a dark core
      let kn = 0;
      for (const k of knots) {
        const dx = (a - k.x) / 2.2, dk = c - k.y, d = Math.hypot(dx, dk);
        r += 0.02 * Math.exp(-(d * d) / (k.r * k.r * 9)) * Math.sign(dk || 1) * 0.3;
        kn = Math.max(kn, 1 - sstep(k.r * 0.6, k.r, d));
      }
      const ring = r * S.rings;
      const f = ring - Math.floor(ring);
      // latewood: a sharp band at the end of each year (softer start)
      let late = sstep(0.55, 0.82, f) * (1 - sstep(0.9, 1.0, f));
      late = Math.pow(late, 1.2) * (0.75 + 0.25 * noise(Math.floor(ring) * 3.7, 1.3));
      // pores: fine dark streaks along the grain, stronger in the earlywood (ring-porous oak)
      const pore = Math.max(0, noise(a * 9, c * 900) * 0.5 + noise(a * 23 + 5, c * 2300) * 0.5 - 0.15) * S.pores * (1 - 0.6 * late);
      // medullary rays (flat-sawn flecks): short, light lenses along the grain
      const ray = S.rays ? Math.max(0, noise(a * 40, c * 160) - 0.45) * 2.2 * S.rays : 0;
      const figure = fbm(a * 2, c * 6, 3) * S.figure;
      let k = 1 + figure - pore * 0.35 + ray * 0.12;
      const rr = (S.early[0] + (S.late[0] - S.early[0]) * late) * k;
      const gg = (S.early[1] + (S.late[1] - S.early[1]) * late) * k;
      const bb = (S.early[2] + (S.late[2] - S.early[2]) * late) * k;
      const dark = kn * 0.32;
      const i = (y * w + x) * 4;
      data[i] = Math.max(0, Math.min(255, rr * (1 - dark))); data[i + 1] = Math.max(0, Math.min(255, gg * (1 - dark * 1.1))); data[i + 2] = Math.max(0, Math.min(255, bb * (1 - dark * 1.2))); data[i + 3] = 255;
      Hh[y * w + x] = -pore * 0.8 + late * 0.15 - kn * 0.1;
    }
    const map = dataTex(data, w, h, { srgb: true, wrap: THREE.MirroredRepeatWrapping, name: `wood ${species}` });
    map.repeat.set(1 / lenM, 1 / widM);
    const bump = dataTex(heightToNormal(Hh, w, h, 1.6, false), w, h, { wrap: THREE.MirroredRepeatWrapping, name: `wood bump ${species}` });
    bump.repeat.set(1 / lenM, 1 / widM);
    return { map, bump };
  });
}

// Wood material. stain: null (natural, clear lacquer) or a colour the wood is stained to
// (the grain stays visible: the albedo is multiplied by stain / natural tone).
// finish: 'lak' (satin lacquer) | 'mat' (oiled) | 'hoogglans'.
export function wood(species = 'eiken', { stain = null, finish = 'lak', seed = 3 } = {}) {
  return cached(`woodmat:${species}:${stain}:${finish}:${seed}`, () => {
    const { map, bump } = woodTextures(species, { seed });
    const S = WOOD[species] || WOOD.eiken;
    let color = new THREE.Color(1, 1, 1);
    if (stain) {
      const st = new THREE.Color(M.resolveColor(stain, stain));
      const nat = new THREE.Color().setRGB(S.early[0] / 255, S.early[1] / 255, S.early[2] / 255, THREE.SRGBColorSpace);
      color = new THREE.Color(Math.min(2, st.r / nat.r), Math.min(2, st.g / nat.g), Math.min(2, st.b / nat.b));
    }
    const m = new THREE.MeshPhysicalMaterial({
      map, color, normalMap: bump, normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: finish === 'mat' ? 0.68 : finish === 'hoogglans' ? 0.25 : 0.5,
      specularIntensity: 0.5,
      clearcoat: finish === 'mat' ? 0.0 : finish === 'hoogglans' ? 0.9 : 0.35,
      clearcoatRoughness: finish === 'hoogglans' ? 0.08 : 0.38,
      name: `wood ${species}${stain ? ' ' + stain : ''}`,
    });
    m.userData.envSpec = 0.6;
    return m;
  });
}
// End grain / cut edge of a board: darker, matte, no long grain (stained like the face).
export function woodEnd(species = 'eiken', { stain = null } = {}) {
  return cached(`woodend:${species}:${stain}`, () => {
    const S = WOOD[species] || WOOD.eiken;
    let c = new THREE.Color().setRGB(S.late[0] / 255 * 0.92, S.late[1] / 255 * 0.9, S.late[2] / 255 * 0.88, THREE.SRGBColorSpace);
    if (stain) c = new THREE.Color(M.resolveColor(stain, stain)).multiplyScalar(0.85);
    return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.7, normalMap: TX.stippleNormal({ scale: 30 }), normalScale: new THREE.Vector2(0.2, 0.2), name: 'wood end grain' });
  });
}

// ------------------------------------------------------------------------------------
// TEXTILES
// Velvet (velours): short dense pile -> dark when seen head-on, a bright soft rim at
// grazing angles (sheen), almost no specular, faint crush marks in the pile.
export function velvet(color) {
  const hex = M.resolveColor(color, '#6E7276');
  return cached(`velvet:${hex}`, () => {
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(0.7), roughness: 0.94, specularIntensity: 0.08, metalness: 0,
      sheen: 1.0, sheenRoughness: 0.38, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.45),
      normalMap: TX.stippleNormal({ size: 256, strength: 0.8, scale: 40, seed: 43 }).clone(), normalScale: new THREE.Vector2(0.12, 0.12),
      name: `velvet ${hex}`,
    });
    m.normalMap.repeat.set(60, 60); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.2;
    return m;
  });
}
// Woven upholstery fabric (polyester / linen look): matte, fine plain weave, mild sheen.
export function upholstery(color, { coarse = false } = {}) {
  const hex = M.resolveColor(color, '#6E7276');
  return cached(`uph:${hex}:${coarse}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: 0.86, specularIntensity: 0.25, sheen: 0.55, sheenRoughness: 0.55,
      sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.22),
      normalMap: TX.weaveNormal({ threads: 24, strength: 3.0 }).clone(), normalScale: new THREE.Vector2(0.6, 0.6),
      name: `upholstery ${hex}`,
    });
    m.normalMap.repeat.set(coarse ? 22 : 36, coarse ? 22 : 36); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.25;
    return m;
  });
}

// PE wicker (synthetic rattan): flat extruded strands (8 mm) in a plain over-under weave.
// tile = 8 strands each way at 9 mm pitch = 72 mm. Albedo + normal, uv in metres.
export function wickerTextures(seed = 5) {
  return cached(`wicker:${seed}`, () => {
    const N = 512, strands = 8, cell = N / strands;
    const { noise } = makeNoise2(seed);
    const R = rng(seed);
    const tone = []; for (let i = 0; i < strands * 2; i++) tone.push(0.86 + 0.24 * R());
    const alb = new Uint8Array(N * N * 4), H = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy);
      const fx = gx - i, fy = gy - j;
      const hOnTop = (i + j) % 2 === 0; // horizontal strand (along x) on top in this cell
      // strand j runs along x (across = fy); strand i runs along y (across = fx)
      const acrossH = fy, acrossV = fx;
      const gap = 0.09;
      const inH = acrossH > gap && acrossH < 1 - gap, inV = acrossV > gap && acrossV < 1 - gap;
      let h, shade, str;
      const dome = (t) => Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.5) / 0.5, 2)));
      if ((hOnTop && inH) || (!inV && inH)) {
        // horizontal strand visible: rises in the middle of the cell (crossing over)
        h = 0.5 + 0.35 * dome(acrossH) + 0.25 * Math.cos(Math.PI * (fx - 0.5) * 1.0) * (hOnTop ? 1 : -1);
        shade = tone[j % strands]; str = noise(x * 0.9, j * 13.1) * 0.06;
      } else if (inV) {
        h = 0.5 + 0.35 * dome(acrossV) + 0.25 * Math.cos(Math.PI * (fy - 0.5)) * (hOnTop ? -1 : 1);
        shade = tone[strands + (i % strands)]; str = noise(i * 11.7, y * 0.9) * 0.06;
      } else { h = 0; shade = 0.35; str = 0; }
      const k = Math.max(0, Math.min(1.3, shade * (0.55 + 0.6 * h) + str));
      const o = (y * N + x) * 4;
      const v = Math.round(255 * Math.min(1, k * 0.78));
      alb[o] = alb[o + 1] = alb[o + 2] = v; alb[o + 3] = 255;
      H[y * N + x] = h;
    }
    const map = dataTex(alb, N, N, { srgb: false, name: 'wicker mod' });
    const nrm = dataTex(heightToNormal(H, N, N, 2.2), N, N, { name: 'wicker normal' });
    const rep = 1 / 0.096;
    map.repeat.set(rep, rep); nrm.repeat.set(rep, rep);
    return { map, nrm };
  });
}
// Wicker wrapped round a frame tube: parallel flat strands running around the tube
// (bands across uv V = along the tube), 8 mm each, slight per-strand tone and gaps.
export function wickerWrapTextures(seed = 6) {
  return cached(`wickerwrap:${seed}`, () => {
    const N = 256, strands = 16, cell = N / strands;
    const { noise } = makeNoise2(seed); const R = rng(seed);
    const tone = []; for (let i = 0; i < strands; i++) tone.push(0.85 + 0.25 * R());
    const alb = new Uint8Array(N * N * 4), H = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const j = Math.floor(y / cell), f = y / cell - j;
      const dome = Math.sqrt(Math.max(0, 1 - Math.pow((f - 0.5) / 0.46, 2)));
      const h = dome; const k = Math.min(1.25, tone[j] * (0.5 + 0.6 * h) + noise(x * 0.7, j * 9.3) * 0.05);
      const o = (y * N + x) * 4; const v = Math.round(255 * Math.min(1, k * 0.8));
      alb[o] = alb[o + 1] = alb[o + 2] = v; alb[o + 3] = 255; H[y * N + x] = h;
    }
    const map = dataTex(alb, N, N, { name: 'wicker wrap mod' });
    const nrm = dataTex(heightToNormal(H, N, N, 2.0), N, N, { name: 'wicker wrap normal' });
    map.repeat.set(1 / 0.1, 1 / 0.144); nrm.repeat.set(1 / 0.1, 1 / 0.144);
    return { map, nrm };
  });
}
export function peRattanWrap(color) {
  const hex = M.resolveColor(color, '#2A2826');
  return cached(`rattanwrap:${hex}`, () => {
    const { map, nrm } = wickerWrapTextures();
    const m = new THREE.MeshPhysicalMaterial({ color: hex, map, normalMap: nrm, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.48, specularIntensity: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.4, name: `PE rattan wrap ${hex}` });
    m.map.colorSpace = THREE.NoColorSpace; m.userData.envSpec = 0.5;
    return m;
  });
}
// The albedo of the weave is a grey modulation (linear) multiplied with the strand colour.
export function peRattan(color) {
  const hex = M.resolveColor(color, '#2A2826');
  return cached(`rattan:${hex}`, () => {
    const { map, nrm } = wickerTextures();
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, map, normalMap: nrm, normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.48, specularIntensity: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.4, name: `PE rattan ${hex}`,
    });
    // the modulation map is linear data; keep it out of sRGB decoding but let three treat it as albedo
    m.map.colorSpace = THREE.NoColorSpace;
    m.userData.envSpec = 0.5;
    return m;
  });
}

// ------------------------------------------------------------------------------------
// HARD MATERIALS
// Brushed stainless steel (AISI 304, satin): grain along uv V (tube length in prism/sweep uvs).
export function stainless({ roughness = 0.24 } = {}) {
  return cached(`rvs:${roughness}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#C3C6C9', metalness: 1, roughness, anisotropy: 0.6, anisotropyRotation: Math.PI / 2,
      normalMap: TX.brushedNormal().clone(), normalScale: new THREE.Vector2(0.1, 0.1), name: 'stainless',
    });
    m.normalMap.repeat.set(30, 4); m.normalMap.needsUpdate = true;
    return m;
  });
}
// Polished stainless (domes, caps).
export function stainlessPolished() {
  return cached('rvsPol', () => new THREE.MeshPhysicalMaterial({ color: '#D2D5D8', metalness: 1, roughness: 0.12, name: 'stainless polished' }));
}
// Powder-coated steel by catalogue colour name (frames).
export const FRAME = { zwart: '#1C1D1F', antraciet: '#3B3E42', wit: '#ECECE8', grijs: '#8E9296', zilver: '#B5B8BB', brons: '#5A4632', bruin: '#4A3628', goud: '#B8955A' };
export function powder(color = 'zwart', opts = {}) {
  const c = String(color).toLowerCase();
  if (c === 'chroom' || c === 'chrome') return M.chrome();
  if (c === 'rvs' || c === 'stainless') return stainless();
  if (c === 'galv' || c === 'verzinkt') return M.galvanised();
  if (c === 'alu' || c === 'aluminium') return M.aluminium({ roughness: 0.3 });
  const hex = FRAME[c] || M.resolveColor(color, '#1C1D1F');
  // white powder coat: a touch rougher so it does not glare
  const L = new THREE.Color(hex); const lum = 0.2126 * L.r + 0.7152 * L.g + 0.0722 * L.b;
  return M.steelPowder(hex, { roughness: opts.roughness ?? (lum > 0.6 ? 0.5 : 0.42), clearcoat: opts.clearcoat ?? (lum > 0.6 ? 0.12 : 0.25) });
}
// Blow-moulded HDPE with a granite speckle (folding tables): off-white with fine grey dots.
export function hdpeGranite(color = '#E3E3DF') {
  const hex = M.resolveColor(color, '#E3E3DF');
  return cached(`hdpeg:${hex}`, () => {
    const N = 512; const R = rng(77); const { noise } = makeNoise2(77);
    const d = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) { const v = 238 + Math.round(10 * noise((i % N) * 0.05, Math.floor(i / N) * 0.05)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    for (let s = 0; s < 1400; s++) {
      const x = Math.floor(R() * N), y = Math.floor(R() * N), r = R() < 0.8 ? 0 : 1, v = R() < 0.75 ? 120 + R() * 60 : 255;
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const o = (((y + yy + N) % N) * N + ((x + xx + N) % N)) * 4; d[o] = d[o + 1] = d[o + 2] = v; }
    }
    const map = dataTex(d, N, N, { name: 'granite' }); map.colorSpace = THREE.NoColorSpace; map.repeat.set(1 / 0.25, 1 / 0.25);
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, map, roughness: 0.55, specularIntensity: 0.45, clearcoat: 0.08, clearcoatRoughness: 0.5,
      normalMap: TX.stippleNormal({ size: 256, strength: 0.6, scale: 50, seed: 47 }).clone(), normalScale: new THREE.Vector2(0.06, 0.06), name: `hdpe granite ${hex}`,
    });
    m.normalMap.repeat.set(60, 60); m.normalMap.needsUpdate = true;
    return m;
  });
}
// Blow-moulded / injection-moulded HDPE (folding chair seat and back): satin, no texture.
export function hdpeSmooth(color = '#F1F1ED') {
  const hex = M.resolveColor(color, '#F1F1ED');
  return cached(`hdpes:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.42, specularIntensity: 0.5, clearcoat: 0.1, clearcoatRoughness: 0.4,
      normalMap: TX.stippleNormal({ size: 256, strength: 0.6, scale: 50, seed: 47 }).clone(), normalScale: new THREE.Vector2(0.05, 0.05), name: `hdpe ${hex}` });
    m.normalMap.repeat.set(80, 80); m.normalMap.needsUpdate = true;
    return m;
  });
}
// Moulded PP/PA plastic parts (caps, glides, belt guides).
export function plastic(color = '#151515', rough = 0.5) {
  return cached(`plastic:${color}:${rough}`, () => new THREE.MeshPhysicalMaterial({ color, roughness: rough, specularIntensity: 0.5, clearcoat: 0.05, name: `plastic ${color}` }));
}
// Woven polyester belt webbing (retractable barriers): fine twill, satin sheen.
export function beltWebbing(color = 'zwart') {
  const hex = M.resolveColor(color, '#1D1E20');
  return cached(`belt:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: 0.5, specularIntensity: 0.4, sheen: 0.6, sheenRoughness: 0.4,
      sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.25),
      normalMap: TX.twillNormal().clone(), normalScale: new THREE.Vector2(0.35, 0.35), side: THREE.DoubleSide, name: `belt ${hex}`,
    });
    m.normalMap.repeat.set(30, 30); m.normalMap.needsUpdate = true;
    m.userData.envSpec = 0.5;
    return m;
  });
}
// Repeating one-colour print along a strip: one tile = artwork + gap, aspect = tileLen / stripW.
export function stripPrintTexture({ d, vb, color = '#FFFFFF', tileLen = 0.5, stripW = 0.05, fill = 0.62 } = {}) {
  return cached(`strip:${d.length}:${d.slice(0, 32)}:${color}:${tileLen}:${stripW}:${fill}`, () => {
    const H = 256, W = Math.round(H * tileLen / stripW);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.clearRect(0, 0, W, H);
    const s = Math.min((H * fill) / vb[1], (W * 0.8) / vb[0]);
    g.translate((W - vb[0] * s) / 2, (H - vb[1] * s) / 2); g.scale(s, s);
    g.fillStyle = color; g.fill(new Path2D(d));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// ------------------------------------------------------------------------------------
// GEOMETRY
// Replace every interior corner of a polyline by a circular arc of radius r (clamped so
// two neighbouring fillets never overlap). Bent tube = sweep(filletPath(pts, r), circle).
export function filletPath(pts, r, segs = 8) {
  if (pts.length < 3 || r <= 0) return pts.map((p) => p.clone());
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const A = pts[i - 1], P = pts[i], B = pts[i + 1];
    const d1 = new THREE.Vector3().subVectors(P, A), d2 = new THREE.Vector3().subVectors(B, P);
    const l1 = d1.length(), l2 = d2.length(); d1.normalize(); d2.normalize();
    const th = Math.acos(THREE.MathUtils.clamp(d1.dot(d2), -1, 1));
    if (th < 1e-3) { out.push(P.clone()); continue; }
    let t = r * Math.tan(th / 2);
    const tMax = Math.min(i === 1 ? l1 : l1 / 2, i === pts.length - 2 ? l2 : l2 / 2) * 0.999;
    let rr = r; if (t > tMax) { t = tMax; rr = t / Math.tan(th / 2); }
    const S = P.clone().addScaledVector(d1, -t);
    const k = new THREE.Vector3().crossVectors(d1, d2).normalize();
    const C = S.clone().addScaledVector(new THREE.Vector3().crossVectors(k, d1).normalize(), rr);
    const v0 = S.clone().sub(C);
    const n = Math.max(2, Math.ceil(segs * th / (Math.PI / 2)));
    for (let s = 0; s <= n; s++) out.push(C.clone().add(v0.clone().applyAxisAngle(k, (th * s) / n)));
  }
  out.push(pts[pts.length - 1].clone());
  return out;
}

// Sweep a convex 2D profile ({x,y,nx,ny}[] as from G.circleProfile / roundedRectProfile)
// along a path with rotation-minimising (parallel-transport) frames. `up` sets the
// profile's x axis at the start. uv: u = perimeter (m), v = arc length (m).
export function sweep(path, profile, { closed = false, up = null, caps = true } = {}) {
  const n = path.length, m = profile.length;
  const T = [];
  for (let i = 0; i < n; i++) {
    const a = path[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = path[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    T.push(new THREE.Vector3().subVectors(b, a).normalize());
  }
  let N = up ? up.clone() : (Math.abs(T[0].y) < 0.95 ? V3(0, 1, 0) : V3(1, 0, 0));
  N.addScaledVector(T[0], -N.dot(T[0])).normalize();
  const Ns = [N.clone()];
  const q = new THREE.Quaternion();
  for (let i = 1; i < n; i++) {
    q.setFromUnitVectors(T[i - 1], T[i]);
    N = N.clone().applyQuaternion(q); N.addScaledVector(T[i], -N.dot(T[i])).normalize();
    Ns.push(N);
  }
  let per = 0; const acc = [0];
  for (let j = 0; j < m; j++) { const p = profile[j], r = profile[(j + 1) % m]; per += Math.hypot(r.x - p.x, r.y - p.y); acc.push(per); }
  const pos = [], nor = [], uv = [], idx = [];
  let len = 0;
  const rings = closed ? n + 1 : n;
  for (let ii = 0; ii < rings; ii++) {
    const i = ii % n;
    if (ii > 0) len += path[i].distanceTo(path[(ii - 1) % n]);
    const Nn = Ns[i], B = new THREE.Vector3().crossVectors(T[i], Nn);
    // mitre: scale the profile across the bend so the tube keeps its section (small angles)
    for (let j = 0; j <= m; j++) {
      const p = profile[j % m];
      pos.push(path[i].x + Nn.x * p.x + B.x * p.y, path[i].y + Nn.y * p.x + B.y * p.y, path[i].z + Nn.z * p.x + B.z * p.y);
      nor.push(Nn.x * p.nx + B.x * p.ny, Nn.y * p.nx + B.y * p.ny, Nn.z * p.nx + B.z * p.ny);
      uv.push(acc[j], len);
    }
  }
  const row = m + 1;
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < m; j++) {
    const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  if (caps && !closed) {
    for (const end of [0, n - 1]) {
      const Nn = Ns[end], B = new THREE.Vector3().crossVectors(T[end], Nn);
      const nrm = end === 0 ? T[0].clone().negate() : T[n - 1].clone();
      const base = pos.length / 3;
      for (let j = 0; j < m; j++) {
        const p = profile[j];
        pos.push(path[end].x + Nn.x * p.x + B.x * p.y, path[end].y + Nn.y * p.x + B.y * p.y, path[end].z + Nn.z * p.x + B.z * p.y);
        nor.push(nrm.x, nrm.y, nrm.z); uv.push(p.x, p.y);
      }
      for (let j = 1; j < m - 1; j++) { if (end === 0) idx.push(base, base + j + 1, base + j); else idx.push(base, base + j, base + j + 1); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
export function bentTube(points, radius, bendR = radius * 2.5, { segs = 16, closed = false, caps = true } = {}) {
  const path = closed ? points : filletPath(points, bendR);
  return sweep(path, G.circleProfile(radius, segs), { closed, caps });
}
// Closed ring (footrest) of radius R at height y, tube radius r.
export function ring(R, y, r, { segs = 96, cx = 0, cz = 0, prof = null } = {}) {
  const pts = []; for (let i = 0; i < segs; i++) { const a = (i / segs) * TAU; pts.push(V3(cx + Math.sin(a) * R, y, cz + Math.cos(a) * R)); }
  return sweep(pts, prof || G.circleProfile(r, 14), { closed: true });
}

// Box-projected uvs in metres (each triangle vertex projected on the plane of its
// dominant normal axis). `rotate`: swap u/v for faces whose grain should run along y.
export function uvBox(g, { scale = 1, offset = [0, 0, 0] } = {}) {
  const pos = g.attributes.position, nor = g.attributes.normal;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2));
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = (pos.getX(i) + offset[0]) * scale, y = (pos.getY(i) + offset[1]) * scale, z = (pos.getZ(i) + offset[2]) * scale;
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, x, z); else if (ax >= az) uv.setXY(i, z, y); else uv.setXY(i, x, y);
  }
  uv.needsUpdate = true;
  return g;
}
// uv for a board whose grain runs along local axis `along` ('x'|'y'|'z'): u = along, v = across.
export function uvGrain(g, along = 'x', { offset = 0 } = {}) {
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const p = [pos.getX(i), pos.getY(i), pos.getZ(i)], n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    const a = { x: 0, y: 1, z: 2 }[along];
    // across: the other axis with the smaller normal component (the face's in-plane axis)
    const others = [0, 1, 2].filter((k) => k !== a);
    const across = n[others[0]] < n[others[1]] ? others[0] : others[1];
    uv.setXY(i, p[a] + offset, p[across] + offset * 0.37);
  }
  uv.needsUpdate = true;
  return g;
}

// Cushion / upholstered block: rounded box (edge radius r) from a subdivided cube, with
// the top (and optionally bottom) face puffed up by `puff` metres in the middle, then
// welded so normals are smooth. Centred on the origin, size w x h x d.
export function cushion(w, h, d, { r = 0.02, puff = 0.01, puffBottom = 0, seg = [24, 8, 24], taper = 0 } = {}) {
  let g = new THREE.BoxGeometry(1, 1, 1, seg[0], seg[1], seg[2]);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const pos = g.attributes.position;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    // spread the cube's grid so more vertices land on the rounded edges
    const remap = (s, half) => { const a = Math.abs(s), s0 = 0.7; return Math.sign(s) * (a <= s0 ? (a / s0) * (half - r) : (half - r) + ((a - s0) / (1 - s0)) * r); };
    const X = remap(p.x * 2, w / 2), Y = remap(p.y * 2, h / 2), Z = remap(p.z * 2, d / 2);
    q.set(THREE.MathUtils.clamp(X, -hx, hx), THREE.MathUtils.clamp(Y, -hy, hy), THREE.MathUtils.clamp(Z, -hz, hz));
    const off = new THREE.Vector3(X - q.x, Y - q.y, Z - q.z);
    if (off.lengthSq() < 1e-12) off.set(0, Math.sign(Y) || 1, 0);
    off.normalize().multiplyScalar(r);
    let x = q.x + off.x, y = q.y + off.y, z = q.z + off.z;
    // puff: bell over the face, fades out over the edge radius
    const bell = Math.max(0, 1 - (x / (w / 2)) ** 2) * Math.max(0, 1 - (z / (d / 2)) ** 2);
    if (y > 0) y += puff * bell * Math.min(1, (y + hy) / (2 * hy + 1e-6) * 1.0);
    else if (puffBottom) y -= puffBottom * bell * Math.min(1, (-y + hy) / (2 * hy + 1e-6));
    // side faces bulge a little too (filled cushion)
    const sideBulge = puff * 0.35 * Math.max(0, 1 - (y / (h / 2)) ** 2);
    if (Math.abs(x) > hx) x += Math.sign(x) * sideBulge * Math.max(0, 1 - (z / (d / 2)) ** 2);
    if (Math.abs(z) > hz) z += Math.sign(z) * sideBulge * Math.max(0, 1 - (x / (w / 2)) ** 2);
    if (taper) { const t = 1 - taper * (y / h + 0.5); x *= 1 + (t - 1) * 0.5; }
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  uvBox(g);
  return g;
}

// Piping (welt cord) around a rounded rectangle at height y (w x d, corner radius r).
export function pipingPath(w, d, r, y, n = 12) {
  const pts = [];
  const cs = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, Math.PI / 2], [-w / 2 + r, -d / 2 + r, Math.PI], [w / 2 - r, -d / 2 + r, Math.PI * 1.5]];
  for (const [cx, cz, a0] of cs) for (let s = 0; s <= n; s++) { const t = a0 + (Math.PI / 2) * (s / n); pts.push(V3(cx + Math.cos(t) * r, y, cz + Math.sin(t) * r)); }
  // rotate so the path runs x->z consistently (sweep handles direction)
  return pts.map((p) => V3(p.x, p.y, -p.z));
}

// Orthonormal placement matrix from an origin and x/y axes.
export function basis(origin, xAxis, yAxis) {
  const x = xAxis.clone().normalize();
  const z = new THREE.Vector3().crossVectors(x, yAxis).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(origin);
}
export function boxAt(w, h, d, origin, xAxis = V3(1, 0, 0), yAxis = V3(0, 1, 0), r = 0.002) {
  return G.roundedBox(w, h, d, r).applyMatrix4(basis(origin, xAxis, yAxis));
}
// Lathe around an arbitrary axis: points [r, t] along `axis` from `origin`.
export function latheAt(points, origin, axis, segs = 32) {
  const g = G.lathe(points, segs);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), axis.clone().normalize());
  return g.applyMatrix4(new THREE.Matrix4().compose(origin, q, V3(1, 1, 1)));
}
// Small dome-head rivet / bolt head on a surface (normal n).
export function rivet(bins, mat, p, n, r = 0.004) {
  bins.add(mat, latheAt([[0.0001, r * 0.55], [r * 0.6, r * 0.5], [r * 0.95, r * 0.2], [r, 0.0], [0.0001, 0.0]].reverse(), p, n, 14));
}

// ------------------------------------------------------------------------------------
// CASTOR (zwenkwiel / bokwiel): top plate, swivel race, pressed-steel fork, axle bolt,
// wheel with rubber tyre and plastic centre, optional brake pedal. `at` is the centre
// of the top plate's upper face; the wheel stands on y = 0. Returns the mount height.
export function castorHeight(R = 0.0625) { return 2 * R + 0.032; }
export function castor(bins, { at, R = 0.0625, W = 0.032, swivel = true, brake = false, heading = 0, mats = {} }) {
  const steel = mats.steel || M.galvanised();
  const tyre = mats.tyre || M.rubber('#2B2C2E');
  const hub = mats.hub || plastic('#9A9C9E', 0.45);
  const Hm = castorHeight(R);
  const top = at.y;
  const base = V3(at.x, top - Hm, at.z); // floor point under the plate centre
  const rot = new THREE.Matrix4().makeRotationY(heading);
  const P = (x, y, z) => V3(x, y, z).applyMatrix4(rot).add(V3(at.x, 0, at.z));
  const trail = swivel ? R * 0.55 : 0;
  // plate
  bins.add(steel, G.roundedBox(R * 1.45, 0.004, R * 1.15, 0.0015).applyMatrix4(new THREE.Matrix4().makeRotationY(heading)).translate(at.x, top - 0.002, at.z));
  if (swivel) {
    bins.add(steel, G.lathe([[0.0001, 0], [R * 0.6, 0], [R * 0.62, 0.004], [R * 0.55, 0.011], [0.0001, 0.011]], 32).translate(at.x, top - 0.015, at.z));
  }
  // fork: two cheeks from under the race to the axle (trailing behind the king pin)
  const axY = R, forkTop = top - (swivel ? 0.016 : 0.004);
  for (const s of [-1, 1]) {
    const a = P(s * (W / 2 + 0.004), forkTop, 0), b = P(s * (W / 2 + 0.004), axY, -trail);
    bins.add(steel, G.flatBar(a, b, R * 0.62, 0.003, V3(0, 0, 1).applyMatrix4(rot)));
    bins.add(steel, G.tube(P(s * (W / 2 + 0.002), axY, -trail), P(s * (W / 2 + 0.009), axY, -trail), 0.006, 6));
  }
  bins.add(steel, G.roundedBox(W + 0.012, 0.004, R * 0.62, 0.0015).applyMatrix4(new THREE.Matrix4().makeRotationY(heading)).translate(...P(0, forkTop - 0.002, -trail * 0.15).toArray()));
  // wheel (axis across the fork)
  const ax = V3(1, 0, 0).applyMatrix4(rot);
  const c = P(0, axY, -trail);
  const tp = [[R * 0.62, -W / 2], [R * 0.86, -W / 2], [R * 0.96, -W * 0.42], [R, -W * 0.18], [R, W * 0.18], [R * 0.96, W * 0.42], [R * 0.86, W / 2], [R * 0.62, W / 2]];
  bins.add(tyre, latheAt(tp.map(([r, t]) => [r, t]).reverse(), c, ax, 40));
  bins.add(hub, latheAt([[0.0001, -W * 0.46], [R * 0.3, -W * 0.46], [R * 0.36, -W * 0.3], [R * 0.64, -W * 0.36], [R * 0.64, W * 0.36], [R * 0.36, W * 0.3], [R * 0.3, W * 0.46], [0.0001, W * 0.46]].reverse(), c, ax, 32));
  bins.add(steel, G.tube(c.clone().addScaledVector(ax, -W / 2 - 0.012), c.clone().addScaledVector(ax, W / 2 + 0.012), 0.004, 8));
  if (brake) {
    const pa = P(0, axY + R * 0.75, -trail - R * 0.2), pb = P(0, axY + R * 0.45, -trail - R * 1.15);
    bins.add(mats.pedal || plastic('#C4161C', 0.45), G.roundedBox(W * 0.9, 0.008, R * 0.55, 0.003).applyMatrix4(basis(pb, ax, V3(0, 1, 0))));
    bins.add(steel, G.flatBar(pa, pb, W * 0.5, 0.003, ax));
  }
  return Hm;
}

// Closed rounded-rectangle path (plan) at height y: L x W, corner radius rc.
export function rectPath(L, W, rc, y = 0, n = 10) {
  const pts = [];
  const cs = [[L / 2 - rc, W / 2 - rc, 0], [L / 2 - rc, -W / 2 + rc, -Math.PI / 2], [-L / 2 + rc, -W / 2 + rc, Math.PI], [-L / 2 + rc, W / 2 - rc, Math.PI / 2]];
  // clockwise seen from above (x right, z towards the viewer): starts at +x,+z corner
  const arcs = [[0, Math.PI / 2], [-Math.PI / 2, 0], [Math.PI, 3 * Math.PI / 2], [Math.PI / 2, Math.PI]];
  for (let k = 0; k < 4; k++) {
    const [cx, cz] = cs[k];
    const [a0, a1] = arcs[k];
    for (let s = 0; s <= n; s++) { const t = a1 - (a1 - a0) * (s / n); pts.push(V3(cx + Math.cos(t) * rc, y, cz + Math.sin(t) * rc)); }
  }
  return pts;
}
// Board / table top with a rounded-rectangle plan (corner radius rc) and rounded edges
// (radius re): a swept edge band + flat face plates. Top face at y = 0, bottom at -T.
// Returns { faces, band } so faces and edge can take different materials.
export function slab(L, W, T, { rc = 0.03, re = 0.006, n = 10 } = {}) {
  rc = Math.max(rc, re + 0.006);
  const e = re + 0.004;
  const path = rectPath(L - 2 * e, W - 2 * e, rc - e, -T / 2, n);
  const band = sweep(path, G.roundedRectProfile(T, 2 * e, re, 4), { closed: true });
  const plate = (y0, y1) => G.prism(G.roundedRectProfile(L - 2 * e - 0.003, W - 2 * e - 0.003, Math.max(0.002, rc - e - 0.0015), n), V3(0, y0, 0), V3(0, y1, 0), { side: V3(1, 0, 0) });
  const faces = G.merge([plate(-T + 0.0001, -0.0001)]);
  return { faces, band };
}
// Round board: disc of radius R, thickness T, edge radius re (lathe). Top at y = 0.
// Face uvs planar in metres (x, z); edge uv u = arc length, v = across the edge.
export function roundBoard(R, T, { re = 0.003, segs = 128 } = {}) {
  const prof = [[0.0001, 0], [R - re, 0]];
  for (let i = 1; i <= 5; i++) { const a = (Math.PI / 2) * (1 - i / 5); prof.push([R - re + Math.cos(a) * re, -re + Math.sin(a) * re]); }
  for (let i = 1; i <= 5; i++) { const a = -(Math.PI / 2) * (i / 5); prof.push([R - re + Math.cos(a) * re, -T + re + Math.sin(a) * re]); }
  prof.push([0.0001, -T]);
  const g = G.lathe(prof.reverse(), segs);
  const pos = g.attributes.position, uv = g.attributes.uv, nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(nor.getY(i)) > 0.7) uv.setXY(i, x + 0.4, z + 0.13);
    else uv.setXY(i, Math.atan2(x, z) * R + 2, y);
  }
  return g;
}
