// Furniture group, round 3: materials that read as the real thing at catalogue size.
//
//   velvetPile(hex)    velours: a pile, not a coating. View-dependent albedo (faces turned to the
//                      camera darker and richer, flanks and edges seen at a grazing angle lighter and
//                      a little desaturated, the way fibre sides catch light), pile-lean patches whose
//                      value flips with the viewing direction (the "crush" of real velvet), a fine
//                      fibre-tip grain, broad soft Charlie sheen. No specular coat at all.
//   wovenFabric(hex)   woven polyester upholstery (banquet chairs, bench pads): plain weave of
//                      heathered yarns (two-tone fibres, slubs, per-yarn tone), so the cloth carries a
//                      fine tweedy grain at 0.5-1 mm/px; cloth shading: rough, low specular, a fuzz rim
//                      at grazing angles, large-scale mottle that breaks the tile repeat.
//   powder(color)      powder coat; 'wit' is a warm white satin (low env reflection) that reads as
//                      white paint, not as aluminium. Other colours: furniture.js powder().
//   birchPly()         rotary-cut birch plywood face (lacquered): long meandering low-contrast grain
//                      lines along the sheet, broad soft wavy figure, sparse pin knots and flecks, one
//                      oval veneer patch; planar uv in metres over a 0.9 m tile (one tile per top).
//   puckerSeams(geo)   small ripples in the cloth along the piped seams of a seatKit softBlock.
//   cavityColors(geo)  vertex colours (ambient occlusion) from a per-vertex function.
//
// The velvet and fabric materials carry their own onBeforeCompile and program cache key and none
// of the engine's userData hooks (so the engine leaves them alone). userData.albedoL is set for
// seatKit.exposureFor(). Units metres; no Math.random().
import * as THREE from 'three';
import * as F from './furniture.js';
import * as TX from './textures.js';
import { rng, makeNoise2 } from './rng.js';

const TAU = Math.PI * 2;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function dataTex(data, w, h, { srgb = false, wrap = THREE.RepeatWrapping, name = '' } = {}) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = wrap;
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
// periodic value noise (integer periods), for tileable textures
function pnoise(seed) {
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
export const PILE_TILE = 0.26;
function pileTextures(seed = 13) {
  return cached(`pile2:${seed}`, () => {
    const N = 512, P = pnoise(seed), Q = pnoise(seed + 101);
    const pile = new Uint8Array(N * N * 4), alb = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u0 = x / N, v0 = y / N, k = (y * N + x) * 4;
      // periodic domain warp: breaks the lattice alignment of the value noise (no plaid)
      const u = u0 + 0.09 * P.fbm(u0 * 2 + 11, v0 * 2 + 5, 2, 2, 3), v = v0 + 0.09 * Q.fbm(u0 * 2 + 3, v0 * 2 + 17, 2, 2, 3);
      // pile lean: mostly "down" the cloth, wandering in soft patches; magnitude = how flat it lies
      const th = -Math.PI / 2 + 1.4 * P.fbm(u * 3, v * 3, 3, 3, 3) + 0.5 * Q.fbm(u * 6 + 2, v * 6 + 7, 6, 6, 2);
      const mag = clamp01(0.25 + 0.9 * (0.5 + 0.8 * P.fbm(u * 4 + 7.3, v * 4 + 1.7, 4, 4, 3)));
      // crush: soft patches of 3-10 cm
      const crush = 0.5 + 0.6 * P.fbm(u * 4 + 3, v * 4 + 9, 4, 4, 4);
      // fibre-tip grain (~1 mm)
      const fine = 0.5 + 0.4 * Q.noise(u0 * 230, v0 * 230, 230, 230) + 0.2 * Q.noise(u0 * 97 + 5, v0 * 97, 97, 97);
      pile[k] = Math.round(clamp01(0.5 + 0.5 * mag * Math.cos(th)) * 255);
      pile[k + 1] = Math.round(clamp01(0.5 + 0.5 * mag * Math.sin(th)) * 255);
      pile[k + 2] = Math.round(clamp01(crush) * 255);
      pile[k + 3] = Math.round(clamp01(fine) * 255);
      const a = 0.91 + 0.09 * clamp01(crush) - 0.03 * (fine - 0.5);
      alb[k] = alb[k + 1] = alb[k + 2] = Math.round(clamp01(a) * 255); alb[k + 3] = 255;
    }
    const pileT = dataTex(pile, N, N, { name: 'velvet pile' });
    const map = dataTex(alb, N, N, { name: 'velvet crush' });
    for (const t of [pileT, map]) t.repeat.set(1 / PILE_TILE, 1 / PILE_TILE);
    return { pile: pileT, map, mean: 0.94 };
  });
}
const VELVET_GLSL = `
{
  // velours: view-dependent albedo of a cut pile (see upholstery2.js)
  vec3 Vv = normalize( vViewPosition );
  float NdV = clamp( dot( nonPerturbedNormal, Vv ), 0.0, 1.0 );
  vec4 pl = texture2D( tPile, vMapUv );
  vec3 q0 = dFdx( - vViewPosition ), q1 = dFdy( - vViewPosition );
  vec2 st0 = dFdx( vMapUv ), st1 = dFdy( vMapUv );
  vec3 q1p = cross( q1, nonPerturbedNormal ), q0p = cross( nonPerturbedNormal, q0 );
  vec3 Tg = q1p * st0.x + q0p * st1.x, Bg = q1p * st0.y + q0p * st1.y;
  float dtg = max( dot( Tg, Tg ), dot( Bg, Bg ) );
  float sct = dtg == 0.0 ? 0.0 : inversesqrt( dtg );
  Tg *= sct; Bg *= sct;
  vec2 vt = vec2( dot( Vv, Tg ), dot( Vv, Bg ) );
  vec2 lean = pl.xy * 2.0 - 1.0;
  float along = dot( lean, vt ) + 0.5 * ( pl.z - 0.5 );
  float rim = pow( 1.0 - NdV, uVel.y );
  float kv = mix( uVel.x, uVel.z, rim ) * ( 1.0 + uVel.w * along ) * ( 1.0 + uVel2.y * ( pl.w - 0.5 ) );
  vec3 base = diffuseColor.rgb;
  float lumV = dot( base, vec3( 0.2126, 0.7152, 0.0722 ) );
  diffuseColor.rgb = mix( base, vec3( lumV ), uVel2.x * rim ) * kv;
}
`;
// face: albedo factor seen head-on; rimGain: at a grazing angle; lean: strength of the pile patches
export function velvetPile(hex, { face = 0.68, rimPow = 1.5, rimGain = 1.7, lean = 0.14, desat = 0.28, fine = 0.16, sheen = 0.55, vertexColors = false, seed = 13 } = {}) {
  return cached(`velvetPile:${hex}:${face}:${rimPow}:${rimGain}:${lean}:${desat}:${sheen}:${vertexColors}:${seed}`, () => {
    const t = pileTextures(seed);
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(1 / t.mean), map: t.map, roughness: 1.0, metalness: 0, specularIntensity: 0.02,
      sheen, sheenRoughness: 0.42, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.35).multiplyScalar(0.8),
      vertexColors, name: `velvet pile ${hex}`,
    });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tPile = { value: t.pile };
      sh.uniforms.uVel = { value: new THREE.Vector4(face, rimPow, rimGain, lean) };
      sh.uniforms.uVel2 = { value: new THREE.Vector4(desat, fine, 0, 0) };
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform sampler2D tPile; uniform vec4 uVel; uniform vec4 uVel2;\nvoid main() {')
        .replace('#include <lights_physical_fragment>', `${VELVET_GLSL}\n#include <lights_physical_fragment>`);
    };
    m.customProgramCacheKey = () => 'velvetPile-v1';
    // mean albedo as the camera sees it (mostly face-on, some rim)
    m.userData.albedoL = lumOf(c) * (face * 0.7 + rimGain * 0.3);
    return m;
  });
}

// ============================================================================ woven fabric
export const WEAVE_TILE = 0.056;
function weaveTextures(seed = 3) {
  return cached(`weave4:${seed}`, () => {
    const N = 1024, threads = 64, cell = N / threads; // 0.875 mm yarns
    const P = pnoise(seed), Q = pnoise(seed + 57), R = rng(seed * 7 + 3);
    const H = new Float32Array(N * N), A = new Float32Array(N * N), Rg = new Float32Array(N * N);
    const tw = new Float32Array(threads), tf = new Float32Array(threads);
    for (let i = 0; i < threads; i++) { tw[i] = R() - 0.5; tf[i] = R() - 0.5; }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
      const over = (i + j) % 2 === 0; // warp (along y, index i) over weft (along x, index j)
      // weft slubs: thicker, lighter stretches of 3-10 mm along the weft yarn
      const slub = Math.max(0, Q.noise(x / N * 9, j * 3.17, 9, threads * 4) * 1.6 - 0.35);
      const ww = 1 + 0.35 * slub; // weft width factor
      const pw = Math.sqrt(Math.max(0, 1 - (2 * fx - 1) ** 2)), pf = Math.sqrt(Math.max(0, 1 - ((2 * fy - 1) / ww) ** 2));
      const zw = Math.sin(Math.PI * fy) * (over ? 1 : -1), zf = Math.sin(Math.PI * fx) * (over ? -1 : 1);
      const hw = 0.62 * pw + 0.38 * zw, hf = 0.62 * pf + 0.38 * zf + 0.25 * slub;
      const warpTop = hw >= hf;
      const h = Math.max(hw, hf);
      // heathered yarn: fibres of two tones twisted together -> short light/dark dashes along the yarn
      const melW = P.noise(i * 5.31, y / N * 70, threads * 5, 70), melF = P.noise(x / N * 70, j * 5.31 + 0.5, 70, threads * 5);
      const mel = warpTop ? melW : melF;
      const yarn = warpTop ? tw[i] : tf[j] + 0.6 * slub;
      const heather = P.fbm(x / N * 18, y / N * 18, 18, 18, 3);
      // 2 x 2 yarn blocks (~1.75 mm) of their own tone: the grain that still resolves at ~1 mm/px
      const blk = Q.hash(Math.floor(i / 2) + 7, Math.floor(j / 2) + 13);
      const gap = Math.min(pw, pf) < 0.2 && Math.max(pw, pf) < 0.45 ? 1 : 0;
      const k = y * N + x;
      H[k] = h * 0.5 + 0.15 * slub + 0.12 * blk;
      A[k] = 0.9 + 0.12 * yarn + 0.14 * mel + 0.14 * heather + 0.13 * blk + 0.1 * (warpTop ? 0 : slub) - 0.12 * gap - 0.05 * (1 - h);
      Rg[k] = 0.97 - 0.08 * Math.max(0, h);
    }
    let mean = 0; for (let k = 0; k < N * N; k++) mean += A[k]; mean /= N * N;
    const grey = (vals, scale = 1) => { const d = new Uint8Array(N * N * 4); for (let k = 0; k < N * N; k++) { const v = Math.round(clamp01(vals[k] * scale) * 255); d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = v; d[k * 4 + 3] = 255; } return d; };
    const map = dataTex(grey(A, 1 / 1.25), N, N, { name: 'weave heather' });
    const nrm = dataTex(heightToNormal(H, N, N, 1.6), N, N, { name: 'weave normal' });
    const rough = dataTex(grey(Rg), N, N, { name: 'weave rough' });
    for (const t of [map, nrm, rough]) t.repeat.set(1 / WEAVE_TILE, 1 / WEAVE_TILE);
    // large-scale mottle on its own (non-integer) scale: breaks the tile repeat
    const Nm = 256, mot = new Uint8Array(Nm * Nm * 4), PM = pnoise(seed + 9);
    for (let y = 0; y < Nm; y++) for (let x = 0; x < Nm; x++) { const v = 0.5 + 0.5 * PM.fbm(x / Nm * 6, y / Nm * 6, 6, 6, 4); const k = (y * Nm + x) * 4; mot[k] = mot[k + 1] = mot[k + 2] = Math.round(clamp01(v) * 255); mot[k + 3] = 255; }
    const mottle = dataTex(mot, Nm, Nm, { name: 'weave mottle' });
    return { map, nrm, rough, mottle, mean: mean / 1.25 };
  });
}
const FABRIC_GLSL = `
{
  // woven cloth: fuzz at grazing angles, slightly darker face-on, large-scale mottle
  vec3 Vv = normalize( vViewPosition );
  float NdV = clamp( dot( nonPerturbedNormal, Vv ), 0.0, 1.0 );
  float fz = pow( 1.0 - NdV, uFab.y );
  float mot = texture2D( tMottle, vMapUv * uFab.w ).r - 0.5;
  float kf = mix( uFab.x, uFab2.x, fz ) * ( 1.0 + uFab.z * mot );
  float lumF = dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( lumF ), uFab2.y * fz ) * kf;
}
`;
export function wovenFabric(hex, { face = 0.95, fuzzPow = 2.4, fuzzGain = 1.3, mottle = 0.12, desat = 0.2, normal = 0.7, sheen = 0.35, seed = 3 } = {}) {
  return cached(`woven:${hex}:${face}:${fuzzPow}:${fuzzGain}:${mottle}:${normal}:${sheen}:${seed}`, () => {
    const t = weaveTextures(seed);
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(1 / t.mean), map: t.map, normalMap: t.nrm, normalScale: new THREE.Vector2(normal, normal),
      roughnessMap: t.rough, roughness: 1.0, metalness: 0, specularIntensity: 0.22,
      sheen, sheenRoughness: 0.8, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.25), name: `woven fabric ${hex}`,
    });
    // mottle tile ~0.41 m (map repeat is 1 / 0.056 per metre)
    const motScale = WEAVE_TILE / 0.41;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tMottle = { value: t.mottle };
      sh.uniforms.uFab = { value: new THREE.Vector4(face, fuzzPow, mottle, motScale) };
      sh.uniforms.uFab2 = { value: new THREE.Vector4(fuzzGain, desat, 0, 0) };
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform sampler2D tMottle; uniform vec4 uFab; uniform vec4 uFab2;\nvoid main() {')
        .replace('#include <lights_physical_fragment>', `${FABRIC_GLSL}\n#include <lights_physical_fragment>`);
    };
    m.customProgramCacheKey = () => 'wovenFabric-v1';
    m.userData.albedoL = lumOf(c) * (face * 0.8 + fuzzGain * 0.2);
    return m;
  });
}

// ============================================================================ powder coat
// Warm white satin powder coat: reads as white paint (not aluminium): a slightly warm albedo,
// rough enough that the studio is not mirrored along thin legs, a faint orange peel.
export function whitePowder() {
  return cached('whitePowder3', () => {
    const nm = TX.stippleNormal({ size: 256, strength: 0.6, scale: 50, seed: 47 }).clone();
    nm.repeat.set(70, 70); nm.needsUpdate = true;
    const m = new THREE.MeshPhysicalMaterial({
      color: '#F3F1EB', roughness: 0.56, metalness: 0, specularIntensity: 0.32, clearcoat: 0.0,
      normalMap: nm, normalScale: new THREE.Vector2(0.05, 0.05), name: 'powder coat white (warm satin)',
    });
    m.userData.envSpec = 0.45;
    return m;
  });
}
export function powder(color = 'zwart', opts = {}) {
  const c = String(color).toLowerCase();
  if (c === 'wit' || c === 'white') return whitePowder();
  return F.powder(color, opts);
}

// ============================================================================ birch plywood
// Rotary-cut birch face, lacquered. uv in metres, one tile = BIRCH_TILE (a whole statafel top).
export const BIRCH_TILE = 0.9;
function birchTexture(seed = 5) {
  return cached(`birchPly2:${seed}`, () => {
    const N = 1536, L = BIRCH_TILE;
    const { noise, fbm } = makeNoise2(seed);
    const n2 = makeNoise2(seed + 31);
    const R = rng(seed * 13 + 1);
    const data = new Uint8Array(N * N * 4), Hh = new Float32Array(N * N);
    const base = [226, 204, 166], late = [204, 176, 132], warm = [216, 182, 138];
    // pin knots and one oval veneer patch
    const knots = []; for (let i = 0; i < 4; i++) knots.push({ a: R() * L, c: R() * L, r: 0.0012 + 0.0016 * R() });
    const patch = { a: 0.25 + 0.4 * R(), c: 0.3 + 0.3 * R(), ra: 0.038, rc: 0.016, k: 0.97 + 0.04 * R() };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const a = (x / N) * L, c = (y / N) * L; // a: along the grain
      // meander of the growth layers, cut by the peeler: slow in a, larger across
      const w = 0.03 * fbm(a * 1.3, c * 2.2, 4) + 0.007 * fbm(a * 7, c * 9, 3);
      const b = c + w;
      // broad soft wavy figure (bands 1-5 cm, elongated along the grain)
      const fig = fbm(a * 1.6, b * 22, 4);
      // grain lines: thin, irregular spacing, low contrast
      const lineP = b * 260 + 3 * fbm(a * 4, b * 40, 3);
      const fl = lineP - Math.floor(lineP);
      const line = sstep(0.72, 0.9, fl) * (1 - sstep(0.92, 1.0, fl)) * (0.5 + 0.5 * noise(Math.floor(lineP) * 1.7, a * 2.5));
      // short dark flecks along the grain
      const fleck = Math.max(0, n2.noise(a * 160, b * 1500) - 0.62) * 2.2;
      let t = clamp01(0.5 + 0.9 * fig);
      let col = [0, 1, 2].map((ch) => base[ch] + (late[ch] - base[ch]) * (0.42 * line + 0.6 * Math.max(0, fig)) + (warm[ch] - base[ch]) * 0.4 * Math.max(0, -fig));
      let k = 1 + 0.035 * n2.fbm(a * 0.8, c * 0.8, 3) - 0.07 * fleck - 0.03 * line;
      // knots: dark core, darker ring of distorted grain
      let kn = 0;
      for (const q of knots) { const d = Math.hypot((a - q.a) / 1.8, c - q.c); kn = Math.max(kn, 1 - sstep(q.r * 0.6, q.r * 1.4, d)); k -= 0.06 * Math.exp(-((d / (q.r * 3)) ** 2)); }
      // oval patch: its own grain offset and tone, a fine glue line
      const pe = Math.hypot((a - patch.a) / patch.ra, (c - patch.c) / patch.rc);
      if (pe < 1) { k *= patch.k; col = col.map((v, ch) => v + (late[ch] - base[ch]) * 0.15 * fbm(a * 3 + 9, c * 40, 2)); }
      k -= 0.045 * Math.exp(-(((pe - 1) / 0.035) ** 2));
      const i = (y * N + x) * 4;
      for (let ch = 0; ch < 3; ch++) data[i + ch] = Math.max(0, Math.min(255, col[ch] * k * (1 - 0.55 * kn) - kn * ch * 6));
      data[i + 3] = 255;
      Hh[y * N + x] = -0.4 * fleck - 0.15 * line + 0.0 * t;
    }
    const map = dataTex(data, N, N, { srgb: true, name: 'birch ply face' });
    const bump = dataTex(heightToNormal(Hh, N, N, 0.8), N, N, { name: 'birch ply bump' });
    map.repeat.set(1 / L, 1 / L); bump.repeat.set(1 / L, 1 / L);
    return { map, bump };
  });
}
export function birchPly({ seed = 5 } = {}) {
  return cached(`birchPlyMat:${seed}`, () => {
    const { map, bump } = birchTexture(seed);
    const m = new THREE.MeshPhysicalMaterial({
      map, normalMap: bump, normalScale: new THREE.Vector2(0.25, 0.25), roughness: 0.5, specularIntensity: 0.5,
      clearcoat: 0.32, clearcoatRoughness: 0.34, name: 'birch plywood face (rotary cut, lacquered)',
    });
    m.userData.envSpec = 0.6;
    m.userData.albedoL = 0.6;
    return m;
  });
}
// planar uv in metres (x, z) for a horizontal face, offset so the tile centre is at the origin
export function planarUV(g, { ox = BIRCH_TILE / 2, oz = BIRCH_TILE / 2, rot = 0 } = {}) {
  const p = g.attributes.position;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(p.count * 2), 2));
  const uv = g.attributes.uv, cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); uv.setXY(i, x * cr - z * sr + ox, x * sr + z * cr + oz); }
  uv.needsUpdate = true; return g;
}

// ============================================================================ upholstery geometry
// Ripples in the cloth along the top (and bottom) piped seam of a seatKit softBlock geometry
// (geo.userData.shape): amplitude amp (m) fading over `width` from the seam, wavelength ~pitch.
export function puckerSeams(geo, { amp = 0.0011, pitch = 0.024, width = 0.014, sides = [1, -1], seed = 3 } = {}) {
  const S = geo.userData.shape; if (!S) return geo;
  const { noise } = makeNoise2(seed);
  const pos = geo.attributes.position; geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  const ys = S.hy + S.r * 0.7071, rs = S.r * 0.7071;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const qx = Math.max(-S.hx, Math.min(S.hx, x)), qz = Math.max(-S.hz, Math.min(S.hz, z));
    const dx = x - qx, dz = z - qz, dh = Math.hypot(dx, dz);
    let rho, alongX;
    if (dh > 1e-5) { rho = dh; alongX = Math.abs(dz) >= Math.abs(dx); }
    else { const ex = S.hx - Math.abs(x), ez = S.hz - Math.abs(z); rho = -Math.min(ex, ez); alongX = ez < ex; }
    let d = 0;
    for (const side of sides) {
      const dist = Math.hypot(rho - rs, side * y - ys);
      const f = Math.exp(-((dist / width) ** 1.5));
      if (f < 1e-3) continue;
      const s = alongX ? x : z;
      const ph = (s / pitch) * TAU + 2.2 * noise(s * 9 + side * 3, (alongX ? Math.sign(z) : Math.sign(x)) * 5);
      const a = amp * (0.55 + 0.45 * noise(s * 14 + 7, side + (alongX ? 2 : 4)));
      // fades towards the corners (the gathered corner folds take over there)
      d += a * f * Math.sin(ph) * sstep(0.0, 0.05, alongX ? S.hx - Math.abs(x) : S.hz - Math.abs(z));
    }
    if (d) pos.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
  return geo;
}
// vertex colours from f(i, x, y, z) -> occlusion factor 0..1 (1 = open)
export function cavityColors(geo, f) {
  const pos = geo.attributes.position, n = pos.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = f(i, pos.getX(i), pos.getY(i), pos.getZ(i)); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
// a mesh outside the PartBin (PartBin merge drops vertex colours)
export function meshOf(geo, mat, name = '') { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.name = name; return m; }
