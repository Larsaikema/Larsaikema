// Furniture group, round 6: soft goods that read as the cloth they are sold as (art direction 22 oct 2026:
// "the lycra covers show padded blocks, the velours ropes read as rubber hose, the velours stools as vinyl").
// Own file; seatKit.js / upholstery2.js stay as they are for the products already signed off.
//
//   velvetLux(hex, opts)  velours as it photographs: a cut pile, no specular coat. Faces turned to the
//                         camera print dark and saturated, flanks and anything seen at a grazing angle glow
//                         light and a little desaturated (the fibre sides catch the light: the velvet rim),
//                         a broad Charlie sheen in a pale tint of the dye, and "crush": soft irregular
//                         patches / streaks where the pile lies flatter, which flip light <-> dark with the
//                         viewing angle (stretched along uv v: down a rope, down an upholstered channel).
//                         uv in metres. Own onBeforeCompile + program cache key, no engine userData hooks.
//   lycraSatin(color)     polyester-elastane stretch jersey under tension (stoelhoes): satin-matte, a soft
//                         anisotropic sheen drawn out along uv u (the stretch direction), fine knit relief,
//                         sheen tinted with the dye; dark colours keep a cool grey sheen so black lycra is
//                         not rubber. userData.albedoL for seatKit.exposureFor().
//   strapWebbing(color)   polyester ratchet-strap webbing (35 mm): twill ribs along the strap, satin sheen.
//   pnoise(seed)          periodic value noise / fbm for tileable textures.
//
// Units metres, no Math.random().
import * as THREE from 'three';
import * as TX from './textures.js';
import { resolveColor } from './materials.js';
import { rng } from './rng.js';

const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function dataTex(data, w, h, { srgb = false, name = '' } = {}) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true; t.name = name;
  return t;
}
function heightToNormal(H, w, h, strength) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xl = (x - 1 + w) % w, xr = (x + 1) % w, yu = (y - 1 + h) % h, yd = (y + 1) % h;
    const dx = (H[y * w + xr] - H[y * w + xl]) * strength, dy = (H[yd * w + x] - H[yu * w + x]) * strength;
    const l = Math.hypot(dx, dy, 1), k = (y * w + x) * 4;
    out[k] = Math.round((-dx / l * 0.5 + 0.5) * 255); out[k + 1] = Math.round((-dy / l * 0.5 + 0.5) * 255);
    out[k + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); out[k + 3] = 255;
  }
  return out;
}

// periodic value noise (integer periods px, py), smooth quintic fade
export function pnoise(seed) {
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

// ============================================================================ velvet
// One tile = VEL_TILE m. R: crush field (patches 2-8 cm, drawn out 2.5x along v), G: pile grain (~1.5 mm,
// isotropic, no lattice: summed rotated octaves), B: streak field (fine sheen streaks along v, 3-6 mm wide).
export const VEL_TILE = 0.24;
function velvetTextures(seed = 41, iso = false) {
  return cached(`vellux:${seed}:${iso}`, () => {
    const N = 512, P = pnoise(seed), Q = pnoise(seed + 71), Sx = pnoise(seed + 13);
    const tex = new Uint8Array(N * N * 4), alb = new Uint8Array(N * N * 4);
    // fine grain: blurred white noise (periodic), two passes of a 3x3 box
    const R = rng(seed + 5);
    let gr = new Float32Array(N * N); for (let i = 0; i < N * N; i++) gr[i] = R() * 2 - 1;
    for (let pass = 0; pass < 2; pass++) {
      const o = new Float32Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += gr[((y + dy + N) % N) * N + ((x + dx + N) % N)];
        o[y * N + x] = s / 9;
      }
      gr = o;
    }
    let gm = 0; for (const v of gr) gm = Math.max(gm, Math.abs(v)); gm = gm || 1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u0 = x / N, v0 = y / N, k = (y * N + x) * 4;
      const wu = u0 + 0.06 * P.fbm(u0 * 3 + 5, v0 * 3 + 1, 3, 3, 3), wv = v0 + 0.06 * Q.fbm(u0 * 3 + 2, v0 * 3 + 9, 3, 3, 3);
      // crush: anisotropic patches (more cycles across u than along v)
      // iso (round 7, upholstery): round crush clouds, no direction (stretched patches read as satin streaks)
      const crush = iso ? 0.5 + 0.8 * P.fbm(wu * 4 + 1.7, wv * 4 + 3.1, 4, 4, 4) : 0.5 + 0.75 * P.fbm(wu * 6 + 1.7, wv * 2 + 3.1, 6, 2, 4);
      // streaks along v
      const streak = 0.5 + 0.9 * Sx.fbm(wu * 48 + 0.3, wv * 4 + 7.7, 48, 4, 2);
      const grain = 0.5 + 0.5 * gr[y * N + x] / gm;
      tex[k] = Math.round(clamp01(crush) * 255);
      tex[k + 1] = Math.round(clamp01(grain) * 255);
      tex[k + 2] = Math.round(clamp01(streak) * 255);
      tex[k + 3] = 255;
      const a = 0.95 + 0.05 * (clamp01(crush) - 0.5) - 0.02 * (grain - 0.5);
      alb[k] = alb[k + 1] = alb[k + 2] = Math.round(clamp01(a) * 255); alb[k + 3] = 255;
    }
    const pile = dataTex(tex, N, N, { name: 'velvet lux pile' });
    const map = dataTex(alb, N, N, { name: 'velvet lux crush' });
    for (const t of [pile, map]) t.repeat.set(1 / VEL_TILE, 1 / VEL_TILE);
    return { pile, map, mean: 0.95 };
  });
}
const VELVET_LUX_GLSL = `
{
  // velours (fabric2.velvetLux): view-dependent albedo of a cut pile + crush that flips with the view
  vec3 Vv = normalize( vViewPosition );
  float NdV = clamp( dot( nonPerturbedNormal, Vv ), 0.0, 1.0 );
  vec4 pl = texture2D( tVelPile, vMapUv * uVL2.w );
  vec4 pg = texture2D( tVelPile, vMapUv );
  pl.g = pg.g;
  float crush = ( pl.r - 0.5 ) * 2.0;
  float streak = ( pl.b - 0.5 ) * 2.0;
  // crushed pile lies flatter: it shows its sides face-on (lighter) and its tips at grazing (darker)
  float rim = pow( 1.0 - NdV, uVL.y );
  float faceK = uVL.x * ( 1.0 + uVL.w * crush + uVL2.z * streak );
  float rimK = uVL.z * ( 1.0 - 0.6 * uVL.w * crush );
  float kv = mix( faceK, rimK, rim ) * ( 1.0 + uVL2.y * ( pl.g - 0.5 ) );
  vec3 base = diffuseColor.rgb;
  float lumV = dot( base, vec3( 0.2126, 0.7152, 0.0722 ) );
  diffuseColor.rgb = mix( base, vec3( lumV ), uVL2.x * rim ) * kv;
}
`;
// face: albedo factor head-on; rim: at grazing; rimPow: how narrow the glowing rim is; crush: patch
// strength; desat: rim desaturation; grain: fibre grain; streak: fine sheen streaks along v; crushScale: < 1 =
// larger crush patches (the grain keeps its size)
export function velvetLux(hex, { face = 0.58, rim = 2.3, rimPow = 2.0, crush = 0.16, desat = 0.4, grain = 0.18, streak = 0.05, sheen = 0.9, sheenRough = 0.34, sheenTint = 0.45, crushScale = 1, vertexColors = false, seed = 41, iso = false } = {}) {
  const key = `velLux:${hex}:${face}:${rim}:${rimPow}:${crush}:${desat}:${grain}:${streak}:${sheen}:${sheenRough}:${sheenTint}:${crushScale}:${vertexColors}:${seed}:${iso}`;
  return cached(key, () => {
    const t = velvetTextures(seed, iso);
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(1 / t.mean), map: t.map, roughness: 1.0, metalness: 0, specularIntensity: 0.0,
      sheen, sheenRoughness: sheenRough, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), sheenTint).multiplyScalar(0.85),
      vertexColors, name: `velvet lux ${hex}`,
    });
    m.envMapIntensity = 0.6;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tVelPile = { value: t.pile };
      sh.uniforms.uVL = { value: new THREE.Vector4(face, rimPow, rim, crush) };
      sh.uniforms.uVL2 = { value: new THREE.Vector4(desat, grain, streak, crushScale) };
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform sampler2D tVelPile; uniform vec4 uVL; uniform vec4 uVL2;\nvoid main() {')
        .replace('#include <lights_physical_fragment>', `${VELVET_LUX_GLSL}\n#include <lights_physical_fragment>`);
    };
    m.customProgramCacheKey = () => 'velvetLux-v1';
    m.userData.albedoL = lumOf(c) * (face * 0.72 + rim * 0.28);
    return m;
  });
}

// ============================================================================ lycra
// catalogue lycra colours as dyed stretch jersey photographs (linear albedo targets via the swatch)
const LYCRA = { wit: '#F1F0EB', creme: '#EDE3CC', champagne: '#D5C8B1', zilver: '#B9BCC0', antraciet: '#3E4146', zwart: '#1E1F21', bordeaux: '#5A1220', marineblauw: '#1A2443' };
export function lycraHex(color) {
  const k = String(color || 'wit').toLowerCase();
  return LYCRA[k] || resolveColor(color, LYCRA.wit);
}
export function lycraSatin(color, { aniso = 0.15, knit = 0.32 } = {}) {
  const hex = lycraHex(color);
  return cached(`lycraSatin:${hex}:${aniso}:${knit}`, () => {
    const c = new THREE.Color(hex);
    let L = lumOf(c);
    // black jersey reflects ~3 %: lift a near-black so the form (sheen) reads
    if (L < 0.028) { c.lerp(new THREE.Color().setRGB(0.028, 0.028, 0.03), 1 - L / 0.028); L = lumOf(c); }
    if (L > 0.8) c.multiplyScalar(0.8 / L), L = 0.8;
    const dark = L < 0.08, light = L > 0.45, silver = String(color).toLowerCase() === 'zilver';
    const m = new THREE.MeshPhysicalMaterial({
      color: c, metalness: 0,
      roughness: silver ? 0.46 : dark ? 0.52 : light ? 0.58 : 0.55,
      specularIntensity: silver ? 0.6 : dark ? 0.42 : 0.34,
      sheen: dark ? 0.6 : 0.65, sheenRoughness: 0.45,
      sheenColor: dark ? new THREE.Color().setRGB(0.11, 0.112, 0.12) : c.clone().lerp(new THREE.Color('#ffffff'), light ? 0.12 : 0.3),
      normalMap: TX.knitNormal({ loops: 40 }).clone(), normalScale: new THREE.Vector2(knit, knit),
      side: THREE.DoubleSide, name: `lycra satin ${hex}`,
    });
    m.anisotropy = aniso; m.anisotropyRotation = 0;
    // knit tile: 40 loops of ~0.6 mm
    m.normalMap.repeat.set(1 / 0.024, 1 / 0.024); m.normalMap.needsUpdate = true;
    m.envMapIntensity = silver ? 1.0 : 0.75;
    m.userData.albedoL = L;
    return m;
  });
}

// ============================================================================ strap webbing
// 35 mm polyester webbing: twill ribs (along u = along the strap), satin, dyed
function twillTex() {
  return cached('strapTwill', () => {
    const W = 64, H = 256, Hh = new Float32Array(W * H), P = pnoise(5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = ((x + y * 0.25) % 4) / 4; // diagonal twill ribs, 4 texel pitch
      Hh[y * W + x] = Math.sin(d * Math.PI) ** 2 + 0.15 * P.noise(x * 0.5, y * 0.05, 32, 13);
    }
    return dataTex(heightToNormal(Hh, W, H, 0.8), W, H, { name: 'strap twill' });
  });
}
export function strapWebbing(color = '#E0661B') {
  const hex = resolveColor(color, '#E0661B');
  return cached(`strapWeb:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.5, specularIntensity: 0.45, sheen: 0.5, sheenRoughness: 0.4, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.3), normalMap: twillTex().clone(), normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide, name: `strap webbing ${hex}` });
    // texture: 64 texels across = 8 mm, 256 along = 32 mm (uv in metres)
    m.normalMap.repeat.set(1 / 0.008, 1 / 0.032); m.normalMap.needsUpdate = true;
    m.userData.albedoL = lumOf(new THREE.Color(hex));
    return m;
  });
}
