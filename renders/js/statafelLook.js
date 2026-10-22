// Statafel family look: soft goods materials (stretch jersey, woven strik cloth), satin powder
// coat, and the studio rig every statafel / statafelrok packshot uses.
//
// Materials
//   jerseyKnit(color)  polyester-elastane single jersey (statafelrok stretch): 0.9 mm wales of V
//                      loops (knit normal, uv in metres; the engine `weave` hook boosts it in close-ups
//                      and fades it at catalogue distance), satin-glossy under tension: anisotropic lobe
//                      along the stretch (uv v), dye-tinted sheen, the engine `streak` field (tension
//                      streaks in the funnel, see withStreakEnd). {flat: true}: isotropic top panel.
//   wovenCloth(color)  woven polyester (strik hoes): fine plain weave + fabricMacro layer (yarn streaks
//                      and slubs that read at hero size), faint satin sheen.
//   satinPowder(color) powder coat without stipple noise: ~4 % black under a satin clear layer, so tubes
//                      carry broad soft highlights of the studio strips.
//   thread(color)      sewing thread for seams / hems (same dye, sheen).
// Rig
//   statafelRig({ albedoL, kind, folded }) -> rig hints { default, detail }: a large overhead
//   softbox for the floor shadow (pools under the product), a front-left modelling key at 38 deg,
//   a large frontal fill, a floor bounce card, a studio reflection map with defined softboxes
//   (dark elsewhere: black cloth keeps its depth, red keeps its hue), Neutral tone mapping, soft
//   contact occlusion under feet / hems, and per-product exposure.
import * as THREE from 'three';
import { makeNoise2, rng } from './rng.js';
import { resolveColor } from './materials.js';

const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const lumLin = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

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

// --------------------------------------------------------------------------- knit
// Fine single jersey (polyester-elastane), technical face: each loop shows as two short inclined legs
// (a V) whose ends tuck under the neighbouring courses. One tile = WALES x COURSES loops; WALE / COURSE are
// the physical loop pitches (m): ~17 wales/cm, a fine Lycra jersey. The relief is shallow and the legs are
// short rounded grains with per-loop jitter (position, tilt, height), so the close-up reads as a smooth
// knit with a fine isotropic texture, not as ribbed webbing.
export const KNIT = { WALES: 10, COURSES: 12, WALE: 0.00058, COURSE: 0.00046 };
export function knitNormal() {
  return cached('jerseyKnit4', () => {
    const N = 256, { WALES, COURSES } = KNIT;
    const cw = N / WALES, ch = N / COURSES;
    const R = rng(77), { noise } = makeNoise2(77);
    // per loop: x/y jitter, leg tilt jitter, height
    const L = [];
    for (let i = 0; i < WALES * COURSES; i++) L.push({ jx: (R() - 0.5) * 0.12, jy: (R() - 0.5) * 0.14, jt: (R() - 0.5) * 0.18, h: 0.8 + 0.35 * R(), h2: 0.8 + 0.35 * R() });
    const H = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let h = 0;
      const c0 = Math.floor(y / ch), w0 = Math.floor(x / cw);
      for (let dc = -1; dc <= 1; dc++) for (let dw = -1; dw <= 1; dw++) {
        const c = c0 + dc, w = w0 + dw;
        const id = (((c % COURSES) + COURSES) % COURSES) * WALES + (((w % WALES) + WALES) % WALES);
        const q = L[id];
        // loop centre (cell units), legs either side, inclined +-24 deg (V opening upwards)
        const lx = (x - w * cw) / cw - 0.5 - q.jx, ly = (y - c * ch) / ch - 0.5 - q.jy;
        for (const s of [-1, 1]) {
          const a = s * (0.42 + q.jt);
          const px = lx - s * 0.23, py = ly;
          // rotate into the leg frame (u along the leg, v across) in physical proportion
          const X = px * cw, Y = py * ch;
          const u = (X * Math.sin(a) + Y * Math.cos(a)) / (ch * 0.62), v = (X * Math.cos(a) - Y * Math.sin(a)) / (cw * 0.22);
          const d2 = u * u + v * v;
          if (d2 < 1) h = Math.max(h, Math.sqrt(1 - d2) * (s > 0 ? q.h : q.h2));
        }
      }
      // fibre fuzz
      H[y * N + x] = 0.55 * h + 0.05 * noise(x * 0.5, y * 0.5);
    }
    return dataTex(heightToNormal(H, N, N, 1.5), N, N, { name: 'jersey knit normal' });
  });
}

// Jersey surface at catalogue distance (the loops themselves are sub-pixel there): a fine isotropic
// grain of ~1-1.5 mm (yarn and loop irregularity), a soft mottle of 0.6-3 cm (uneven stretch over the
// blad) and faint course bars (barre). Encoding as textures.fabricMacroNormal (R,G = slope, B = roughness
// modulation, 0.5 = neutral). 1 tile = JMACRO m, 512 texels (~0.5 mm).
export const JMACRO = 0.25;
function tileField(R, N, k0, k1, count, beta = 1) {
  const f = new Float32Array(N * N);
  const cx = new Float32Array(N), sx = new Float32Array(N), cy = new Float32Array(N), sy = new Float32Array(N);
  for (let w = 0; w < count; w++) {
    const kk = k0 + (k1 - k0) * R(), th = R() * Math.PI * 2;
    const kx = Math.round(kk * Math.cos(th)), ky = Math.round(kk * Math.sin(th));
    if (kx === 0 && ky === 0) continue;
    const amp = Math.pow(Math.hypot(kx, ky) / k0, -beta), ph = R() * Math.PI * 2;
    for (let i = 0; i < N; i++) { const a = (2 * Math.PI * kx * i) / N + ph; cx[i] = Math.cos(a); sx[i] = Math.sin(a); const b = (2 * Math.PI * ky * i) / N; cy[i] = Math.cos(b); sy[i] = Math.sin(b); }
    for (let y = 0; y < N; y++) { const c = cy[y] * amp, s2 = sy[y] * amp, o = y * N; for (let x = 0; x < N; x++) f[o + x] += cx[x] * c - sx[x] * s2; }
  }
  let m = 0; for (const v of f) m += v * v; m = Math.sqrt(m / f.length) || 1;
  for (let i = 0; i < f.length; i++) f[i] /= m;
  return f;
}
function blurTile(a, N, r, passes = 2) {
  let src = a;
  for (let p = 0; p < passes; p++) {
    const tmp = new Float32Array(N * N), out = new Float32Array(N * N);
    for (let y = 0; y < N; y++) { let acc = 0; for (let i = -r; i <= r; i++) acc += src[y * N + ((i + N) % N)]; for (let x = 0; x < N; x++) { tmp[y * N + x] = acc / (2 * r + 1); acc += src[y * N + ((x + r + 1) % N)] - src[y * N + ((x - r + N) % N)]; } }
    for (let x = 0; x < N; x++) { let acc = 0; for (let i = -r; i <= r; i++) acc += tmp[((i + N) % N) * N + x]; for (let y = 0; y < N; y++) { out[y * N + x] = acc / (2 * r + 1); acc += tmp[((y + r + 1) % N) * N + x] - tmp[((y - r + N) % N) * N + x]; } }
    src = out;
  }
  let m = 0; for (const v of src) m += v * v; m = Math.sqrt(m / src.length) || 1;
  for (let i = 0; i < src.length; i++) src[i] /= m;
  return src;
}
export function jerseyMacroNormal() {
  return cached('jerseyMacro', () => {
    const N = 512, R = rng(61);
    const white = new Float32Array(N * N); for (let i = 0; i < N * N; i++) white[i] = R() * 2 - 1;
    const grain = blurTile(white, N, 1, 2);                          // ~1-1.5 mm
    const mottle = tileField(R, N, 8, 40, 36, 1.1);                  // 6-30 mm
    const bars = new Float32Array(N); { let s = 0; for (let i = 0; i < N; i++) { s = 0.82 * s + (R() * 2 - 1); bars[i] = s; } }
    let bm = 0; for (const v of bars) bm += v * v; bm = Math.sqrt(bm / N); for (let i = 0; i < N; i++) bars[i] /= bm;
    const barMod = tileField(R, N, 3, 10, 12);
    const roughF = tileField(R, N, 6, 30, 24);
    const h = new Float32Array(N * N), rr = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      h[i] = 0.016 * grain[i] + 0.05 * mottle[i] + 0.006 * bars[y] * Math.max(0, 0.4 + 0.6 * barMod[i]);
      rr[i] = 0.35 * roughF[i] + 0.25 * grain[i];
    }
    const out = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const xl = (x - 1 + N) % N, xr = (x + 1) % N, yu = (y - 1 + N) % N, yd = (y + 1) % N;
      const dx = (h[y * N + xr] - h[y * N + xl]) / 2, dy = (h[yd * N + x] - h[yu * N + x]) / 2;
      const k = (y * N + x) * 4;
      out[k] = Math.round(Math.min(255, Math.max(0, (-dx * 2 + 0.5) * 255)));
      out[k + 1] = Math.round(Math.min(255, Math.max(0, (-dy * 2 + 0.5) * 255)));
      out[k + 2] = Math.round(Math.min(255, Math.max(0, (0.5 + rr[y * N + x] * 0.25) * 255)));
      out[k + 3] = 255;
    }
    return dataTex(out, N, N, { name: 'jersey macro normal' });
  });
}
// Dye / stretch mottle of a cloth panel as a colour multiplier (linear, mean ~0.975, +-1.5 %), one
// tile = 0.9 m (a whole blad): soft 1-6 cm clouds and a faint fine grain.
export const MOTTLE = 0.9;
export function clothMottle(amount = 1) {
  return cached(`clothMottle:${amount}`, () => {
    const N = 512, R = rng(67);
    const low = tileField(R, N, 15, 80, 48, 1.2);
    const white = new Float32Array(N * N); for (let i = 0; i < N * N; i++) white[i] = R() * 2 - 1;
    const grain = blurTile(white, N, 1, 1);
    const out = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      const v = Math.min(1, Math.max(0, 0.975 + amount * (0.011 * low[i] + 0.004 * grain[i])));
      const b = Math.round(v * 255);
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = b; out[i * 4 + 3] = 255;
    }
    return dataTex(out, N, N, { name: 'cloth mottle' });
  });
}

// Plain weave of fine polyester (strik cloth): 0.35 mm threads, 16 per tile.
export const WOVEN = { THREADS: 16, PITCH: 0.00035 };
export function wovenNormal() {
  return cached('wovenPoly', () => {
    const N = 256, n = WOVEN.THREADS, c = N / n;
    const { noise } = makeNoise2(83);
    const H = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = Math.floor(x / c), j = Math.floor(y / c);
      const fx = (x % c) / c, fy = (y % c) / c;
      const over = (i + j) % 2 === 0; // warp over weft
      const warp = Math.sin(Math.PI * fx), weft = Math.sin(Math.PI * fy);
      const crown = over ? warp * (0.6 + 0.4 * Math.sin(Math.PI * fy)) : weft * (0.6 + 0.4 * Math.sin(Math.PI * fx));
      H[y * N + x] = crown + 0.08 * noise(x * 0.11, y * 0.11);
    }
    return dataTex(heightToNormal(H, N, N, 1.2), N, N, { name: 'woven poly normal' });
  });
}

// --------------------------------------------------------------------------- materials
// Dyed albedo for knitted / woven polyester: black reflects ~3 %, white ~80 %.
export function clothAlbedo(color, { min = 0.03, max = 0.8 } = {}) {
  const hex = resolveColor(color, '#1D1E20');
  const c = new THREE.Color(hex);
  const L = lumLin(c);
  if (L < min) {
    // lift a near-black towards a neutral dark grey of luminance `min` (keeps a faint dye cast)
    const g = new THREE.Color().setRGB(min, min, min * 1.04);
    c.lerp(g, 1 - L / min);
  }
  if (L > max) c.multiplyScalar(max / L);
  return c;
}
const chroma = (c) => { const s = c.clone().convertLinearToSRGB(); return Math.max(s.r, s.g, s.b) - Math.min(s.r, s.g, s.b); };
// sRGB chroma (max - min channel) of a catalogue colour, 0 for neutrals, ~0.6 for rood
export const dyeChroma = (color) => chroma(new THREE.Color(resolveColor(color, '#1D1E20')));

export function jerseyKnit(color, { normal = 0.32, flat = false } = {}) {
  const hex = resolveColor(color, '#1D1E20');
  return cached(`jersey4:${hex}:${normal}:${flat ? 'flat' : 'body'}`, () => {
    const base = clothAlbedo(hex);
    const L = lumLin(base), dark = L < 0.06, light = L > 0.5;
    const chr = chroma(base);
    // polyester-elastane jersey under tension: a satin-matte cloth. The stretched loops lie flat and aligned
    // with the pull, so the body's highlights are drawn out a little along the stretch (weak anisotropic lobe
    // along uv v = down the profile: rim -> waist -> feet); the flat top panel (planar uv, tension in all
    // directions) is isotropic. Specular and sheen fall off towards grazing view (engine `grazing` hook):
    // ridges and folds turned edge-on keep a soft satin band, never a chrome or glassy hairline.
    // Dye mottle (map, mean 0.975: colour compensated) and the jersey macro layer (fine grain, soft stretch
    // mottle, faint course bars) give the cloth its texture at catalogue distance, where the loops are sub-pixel.
    const m = new THREE.MeshPhysicalMaterial({
      color: base.clone().multiplyScalar(1 / 0.975), metalness: 0,
      roughness: flat ? (dark ? 0.62 : 0.6) : dark ? 0.62 : chr > 0.2 ? 0.6 : 0.62,
      specularIntensity: flat ? (dark ? 0.4 : 0.42) : dark ? 0.42 : chr > 0.2 ? 0.4 : 0.42,
      sheen: flat && dark ? 0.4 : 0.45, sheenRoughness: 0.5,
      // fibre sheen in the dye's own colour (black: a cool dark grey: Lycra, not rubber)
      sheenColor: dark ? new THREE.Color().setRGB(0.1, 0.102, 0.108) : base.clone().multiplyScalar(light ? 0.9 : 1.05),
      normalMap: knitNormal().clone(), normalScale: new THREE.Vector2(normal, normal),
      map: clothMottle(flat ? 1 : 0.6).clone(),
      side: THREE.DoubleSide, name: `jersey ${hex}${flat ? ' (top panel)' : ''}`,
    });
    if (!flat) { m.anisotropy = 0.12; m.anisotropyRotation = Math.PI / 2; }
    m.normalMap.repeat.set(1 / (KNIT.WALES * KNIT.WALE), 1 / (KNIT.COURSES * KNIT.COURSE)); m.normalMap.needsUpdate = true;
    m.map.repeat.set(1 / MOTTLE, 1 / MOTTLE); m.map.needsUpdate = true;
    m.userData = {
      envSpec: flat ? 0.42 : dark ? 0.5 : chr > 0.2 ? 0.42 : 0.46,
      // close-ups: the loops shade a little (cavity) and their crowns carry a little more sheen; at catalogue
      // distance the relief folds into a matte lobe (engine weave hook)
      weave: { repeats: KNIT.WALES, boost: 1.3, roughVar: 0.1, matte: 0.03, cav: dark ? 0.2 : 0.12, crown: dark ? 0.9 : 0.5 },
      macro: { tex: jerseyMacroNormal(), scale: (KNIT.WALES * KNIT.WALE) / JMACRO, strength: flat ? 1.0 : 0.8, coat: 0, rough: 0.1 },
      grazing: { spec: 0.3, sheen: 0.45, w: 0.45 },
      dye: chr > 0.2 ? 0.3 : 0,
      albedoL: L,
    };
    // tension streaks (engine streak hook) on the body: ~170 streaks round the rok (uv u = theta x 0.25 m,
    // so at the blad rim ~1.5 cm apart, converging into the waist), wandering slowly along the profile;
    // glossier and more specular, with a fine ridge across each. Start just under the lower blad arris
    // (v0..v1, in normal-map uv units along v: 0.03..0.07 m of profile)
    if (!flat) {
      const repU = 1 / (KNIT.WALES * KNIT.WALE), repV = 1 / (KNIT.COURSES * KNIT.COURSE);
      m.userData.streak = { fu: 95 / (Math.PI * 2 * 0.25 * repU), fv: 3.2 / repV, rough: 0.3, spec: dark ? 0.55 : 0.4, tilt: dark ? 0.4 : 0.3, v0: 0.035 * repV, v1: 0.075 * repV, seed: 3 };
    }
    return m;
  });
}

// The body material with its streak field ending at the waist (v2..v3, in metres of profile): the
// strain streaks belong to the funnel; below the waist the pull lines (geometry) carry the sheen.
export function withStreakEnd(mat, v2, v3) {
  if (!mat.userData.streak) return mat;
  const repV = 1 / (KNIT.COURSES * KNIT.COURSE);
  return cached(`streakEnd:${mat.uuid}:${v2.toFixed(4)}:${v3.toFixed(4)}`, () => {
    const m = mat.clone();
    m.userData = { ...mat.userData, streak: { ...mat.userData.streak, v2: v2 * repV, v3: v3 * repV } };
    delete m.userData.__hooked;
    return m;
  });
}

export function wovenCloth(color) {
  const hex = resolveColor(color, '#F3F3F0');
  return cached(`woven3:${hex}`, () => {
    const base = clothAlbedo(hex, { min: 0.03, max: 0.78 });
    const L = lumLin(base), dark = L < 0.06, light = L > 0.5, chr = chroma(base);
    // polyester gabardine-like strik cloth: fine plain weave (sub-pixel at hero size) plus a macro layer
    // that does read at catalogue size (engine macro hook, textures.fabricMacroNormal: yarn-tension streaks
    // 1-6 mm along warp and weft, slubs, a soft cockle; it also varies the gloss), a faint satin sheen
    const m = new THREE.MeshPhysicalMaterial({
      color: base, roughness: 0.6, metalness: 0, specularIntensity: dark ? 0.6 : 0.55,
      sheen: 0.55, sheenRoughness: 0.42,
      sheenColor: dark ? new THREE.Color().setRGB(0.08, 0.08, 0.085) : base.clone(),
      normalMap: wovenNormal().clone(), normalScale: new THREE.Vector2(0.45, 0.45),
      side: THREE.DoubleSide, name: `woven poly ${hex}`,
    });
    m.normalMap.repeat.set(1 / (WOVEN.THREADS * WOVEN.PITCH), 1 / (WOVEN.THREADS * WOVEN.PITCH)); m.normalMap.needsUpdate = true;
    m.userData = {
      envSpec: light ? 0.42 : dark ? 0.55 : 0.4,
      weave: { repeats: WOVEN.THREADS, boost: 1.8, roughVar: 0.2, matte: 0.04 },
      macro: { tex: 'fabricMacro', scale: WOVEN.THREADS * WOVEN.PITCH, strength: light ? 0.75 : 0.55, coat: 0.4, rough: 0.3 },
      dye: chr > 0.2 ? 0.3 : 0, albedoL: L,
    };
    return m;
  });
}

export function thread(color) {
  const hex = resolveColor(color, '#1D1E20');
  return cached(`sfthread:${hex}`, () => {
    const base = clothAlbedo(hex);
    const L = lumLin(base), dark = L < 0.06;
    const c = dark ? base.clone().multiplyScalar(1.25) : base.clone().multiplyScalar(0.92);
    const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, specularIntensity: 0.45, sheen: 0.6, sheenRoughness: 0.4, sheenColor: dark ? new THREE.Color().setRGB(0.1, 0.1, 0.105) : c.clone(), side: THREE.DoubleSide, name: `thread ${hex}` });
    m.userData = { envSpec: 0.3, albedoL: L };
    return m;
  });
}

// Satin powder coat: no stipple (it read as mottled noise on the black column).
export function satinPowder(color = '#1C1D1F', { roughness = 0.36 } = {}) {
  const hex = resolveColor(color, '#1C1D1F');
  return cached(`satinPowder2:${hex}:${roughness}`, () => {
    const c = new THREE.Color(hex), dark = lumLin(c) < 0.05;
    // black satin powder coat: ~4 % albedo (#26282B, not a void) under a satin clear layer that carries
    // broad soft reflections of the studio strips, so the oval legs and the column keep their form
    const m = new THREE.MeshPhysicalMaterial({
      color: dark ? new THREE.Color('#222427') : c, metalness: 0, roughness: dark ? 0.45 : roughness, specularIntensity: dark ? 0.5 : 0.7,
      clearcoat: dark ? 0.8 : 0.3, clearcoatRoughness: dark ? 0.13 : 0.3, name: `satin powder ${hex}`,
    });
    m.userData = { envSpec: dark ? 0.8 : 0.6 };
    return m;
  });
}

// Black PE / nylon parts (foot glides, knobs): satin, slightly glossier than rubber.
export function blackPlastic(color = '#151515', rough = 0.42) {
  return cached(`sfPlastic:${color}:${rough}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: 0, specularIntensity: 0.55, clearcoat: 0.1, clearcoatRoughness: 0.4, name: `black plastic ${color}` });
    m.userData = { envSpec: 0.9 };
    return m;
  });
}
export function zincSteel({ tone = '#C9CCCF', roughness = 0.28 } = {}) {
  return cached(`sfZinc:${tone}:${roughness}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: tone, metalness: 1, roughness, name: 'zinc plated steel' });
    m.userData = { envSpec: 0.9 };
    return m;
  });
}

// --------------------------------------------------------------------------- rig
// Studio reflection map (camera-relative; see js/studioEnv.js): dark surround, a big overhead
// scrim, the key box front-left, a large frontal fill card, a narrow rim strip behind-right and a
// light floor pool in front. The area behind the product at camera height (what a flat top
// mirrors from the hero angle) stays dim, so a red top keeps its hue and a black top its depth.
export const STATAFEL_ENV = {
  surround: 0.04, ceiling: 0.06,
  floor: { front: 0.5, side: 0.16, back: 0.22, frontWidth: 60, backWidth: 50 },
  boxes: [
    { az: -10, el: 72, w: 70, h: 40, I: 3.2, soft: 0.6, hot: 0.3 },      // overhead scrim
    { az: -50, el: 36, w: 30, h: 36, I: 3.6, soft: 0.45, hot: 0.3 },     // key box front-left
    { az: 28, el: 8, w: 48, h: 34, I: 1.1, soft: 0.6, hot: 0.15 },       // frontal fill card right
    { az: 150, el: 30, w: 10, h: 40, I: 1.4, soft: 0.5, hot: 0.2 },      // rim strip behind-right
    { az: -150, el: 22, w: 26, h: 18, I: 0.45, soft: 0.6, hot: 0.1 },    // dim reflector behind-left
  ],
};

// Bare table (statafel kaal, folded): the same studio plus what a furniture photographer adds for
// a lacquered top on a black frame: a broad, soft white sheet behind and above the set (the top mirrors
// it as a soft lacquer sheen over its far half; the upper faces of the legs and struts mirror it as a
// satin highlight) and two tall strip boxes left and right (vertical highlights down the column and
// along the leg sides). A covered table keeps STATAFEL_ENV (dark behind: a red top keeps its hue).
export const STATAFEL_ENV_KAAL = {
  ...STATAFEL_ENV,
  boxes: [
    ...STATAFEL_ENV.boxes,
    { az: 180, el: 16, w: 120, h: 22, I: 1.5, soft: 0.8, hot: 0.15 },    // soft sheet behind the set
    { az: -105, el: 6, w: 14, h: 70, I: 2.2, soft: 0.5, hot: 0.25 },     // strip box left
    { az: 112, el: 4, w: 12, h: 70, I: 1.4, soft: 0.5, hot: 0.2 },       // strip box right
  ],
};

export function statafelRig({ albedoL = 0.2, folded = false, white = false, black = false, chroma = 0 } = {}) {
  // exposure: gentler than the engine's auto curve (fabric products differ more in albedo than in
  // what the eye accepts as "correctly exposed")
  const exposure = white ? 0.86 : Math.min(1.28, Math.max(0.62, 0.84 * Math.pow(0.2 / Math.max(0.01, albedoL), 0.13)));
  const def = {
    exposure,
    // Neutral tone mapping; for saturated dyes a gentler toe (Khronos' toe pushes the minor channels of
    // a red to 0: digital pure red instead of dyed cloth), neutrals keep the standard toe (deep black)
    toneMapping: 'neutral', shoulder: white ? 0.84 : 0.8, toe: chroma > 0.25 ? 0.5 : 1,
    env: 'studio', envStudio: STATAFEL_ENV, envIntensity: 1.0,
    // modelling key: front-left, 38 deg up (horizontal faces get sin 38 = 0.62 of it, faces turned to it
    // 0.8): the top no longer outshines the skirt
    key: { azimuth: -46, elevation: 38, intensity: 2.0, cone: 14, mapSize: 2048, radius: 2.5 },
    // the floor shadow comes from the big overhead box: it pools under / just behind the product
    floorKey: { azimuth: -25, elevation: 78, cone: 24 },
    dome: { count: 3, intensity: 1.3, maxZenith: 70, mapSize: 1024, radius: 12 },
    // large frontal fill (camera-right, near eye level) and a floor bounce card
    fill: { azimuth: 26, elevation: 10, intensity: black ? 1.25 : 0.95 },
    rim: { azimuth: 155, elevation: 32, intensity: 0.55 },
    bounce: { azimuth: 6, elevation: -24, intensity: 0.7 },
    // big overhead softbox a little behind the set, 2.2 m from the blad centre (engine rig.overhead): every
    // horizontal top gets the most light of the product, falling off softly towards its front edge (1.1 : 0.67
    // between the far and the near rim), plus a broad, low-contrast sheen of the box on the far half
    overhead: { azimuth: 172, elevation: 62, distance: 2.2, intensity: 1.3, size: 14, angle: 60, penumbra: 1, mapSize: 1024, radius: 2 },
    groundAmbient: 0.3,
    // sky occlusion up to 66 deg from the zenith (a studio, not an open field), 96 + 96 directions,
    // smoothed to one pool (sigma 2.5 cm), faded out at the bake border (no step in the sweep)
    groundAO: { strength: 1.0, samples: 96, keySamples: 96, res: 1024, maxZenith: 66, mapSize: 512, blur: 2, sigma: 0.025, edgeFade: 0.18 },
    contact: { strength: 0.62, h0: 0.012, res: 1024, blur: 1.4, wide: { strength: 0.32, h0: 0.035, sigma: 0.028 } },
    shadowStrength: 0.9,
    edgeFade: 0.06,
  };
  // close-ups: the floor in view lies in the product's shadow pool; no fade to the backdrop at the frame edge
  const detail = { edgeFade: 0, key: { cone: 12 }, contact: { strength: 0.62, h0: 0.012, res: 1024, blur: 1.2, wide: { strength: 0.3, h0: 0.035, sigma: 0.02 } } };
  return { default: def, detail };
}
