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
// Single jersey, technical face: columns (wales) of V-shaped loops. One tile = WALES x COURSES
// loops; WALE / COURSE are the physical loop pitches (m).
export const KNIT = { WALES: 8, COURSES: 10, WALE: 0.0009, COURSE: 0.00072 };
export function knitNormal() {
  return cached('jerseyKnit', () => {
    const N = 256, { WALES, COURSES } = KNIT;
    const cw = N / WALES, ch = N / COURSES;
    const R = rng(77), { noise } = makeNoise2(77);
    // per-loop height jitter (yarn tension varies loop to loop)
    const jit = []; for (let i = 0; i < WALES * COURSES * 2; i++) jit.push(0.85 + 0.3 * R());
    const H = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let h = 0;
      // a loop's legs reach a little into the neighbouring courses: test the 3 nearest
      for (let dc = -1; dc <= 1; dc++) {
        const c = Math.floor(y / ch) + dc, wv = Math.floor(x / cw);
        for (let dw = -1; dw <= 1; dw++) {
          const w = wv + dw;
          const lx = (x - w * cw) / cw, ly = (y - c * ch) / ch; // 0..1 inside the cell
          if (ly < -0.25 || ly > 1.25 || lx < -0.6 || lx > 1.6) continue;
          const id = ((((c % COURSES) + COURSES) % COURSES) * WALES + (((w % WALES) + WALES) % WALES)) * 2;
          for (const s of [-1, 1]) {
            // leg centre line: from the loop base (0.5, 0) out to (0.5 + s 0.32, 1.1), slightly curved
            const t = Math.min(1.15, Math.max(-0.15, ly));
            const cx = 0.5 + s * (0.06 + 0.26 * t + 0.05 * Math.sin(Math.PI * t));
            const d = Math.abs(lx - cx) * cw / (ch * 0.9);
            const wid = 0.24;
            const along = 1 - Math.pow(Math.abs(t - 0.5) / 0.68, 4);
            const v = Math.max(0, 1 - (d / wid) ** 2) * Math.max(0, along);
            h = Math.max(h, Math.sqrt(v) * jit[id + (s > 0 ? 1 : 0)]);
          }
        }
      }
      H[y * N + x] = h + 0.06 * noise(x * 0.35, y * 0.35);
    }
    return dataTex(heightToNormal(H, N, N, 2.6), N, N, { name: 'jersey knit normal' });
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

export function jerseyKnit(color, { normal = 0.6, flat = false } = {}) {
  const hex = resolveColor(color, '#1D1E20');
  return cached(`jersey3:${hex}:${normal}:${flat ? 'flat' : 'body'}`, () => {
    const base = clothAlbedo(hex);
    const L = lumLin(base), dark = L < 0.06, light = L > 0.5;
    const chr = chroma(base);
    // polyester-elastane jersey under tension is a satin-glossy cloth: the stretched loops lie flat and
    // aligned with the pull, so the highlights of the studio boxes are drawn out into streaks along the
    // stretch (anisotropic lobe, long axis along the uv v = down the profile: rim -> waist -> feet). The
    // flat top panel (planar uv, tension in all directions) keeps an isotropic lobe.
    const m = new THREE.MeshPhysicalMaterial({
      color: base, metalness: 0,
      roughness: flat ? (dark ? 0.64 : 0.6) : dark ? 0.6 : chr > 0.2 ? 0.57 : 0.6,
      specularIntensity: flat ? (dark ? 0.36 : 0.42) : dark ? 0.46 : chr > 0.2 ? 0.42 : 0.46,
      sheen: flat && dark ? 0.45 : 0.55, sheenRoughness: 0.42,
      // fibre sheen in the dye's own colour (black: a cool dark grey: Lycra, not rubber)
      sheenColor: dark ? new THREE.Color().setRGB(0.12, 0.122, 0.13) : base.clone().multiplyScalar(light ? 1.0 : 1.15),
      normalMap: knitNormal().clone(), normalScale: new THREE.Vector2(normal, normal),
      side: THREE.DoubleSide, name: `jersey ${hex}${flat ? ' (top panel)' : ''}`,
    });
    if (!flat) { m.anisotropy = 0.3; m.anisotropyRotation = Math.PI / 2; }
    m.normalMap.repeat.set(1 / (KNIT.WALES * KNIT.WALE), 1 / (KNIT.COURSES * KNIT.COURSE)); m.normalMap.needsUpdate = true;
    m.userData = {
      envSpec: flat ? 0.4 : dark ? 0.55 : chr > 0.2 ? 0.45 : 0.5,
      // close-ups: loops shade (cavity) and their crowns carry the fibre sheen, so even black jersey
      // shows its wales; at catalogue distance the relief folds into a matte lobe (engine weave hook)
      weave: { repeats: KNIT.WALES, boost: 2.8, roughVar: 0.3, matte: 0.04, cav: dark ? 0.6 : 0.35, crown: dark ? 3.5 : 1.4 },
      dye: chr > 0.2 ? 0.3 : 0,
      albedoL: L,
    };
    // tension streaks (engine streak hook) on the body: ~170 streaks round the rok (uv u = theta x 0.25 m,
    // so at the blad rim ~1.5 cm apart, converging into the waist), wandering slowly along the profile;
    // glossier and more specular, with a fine ridge across each. Start just under the lower blad arris
    // (v0..v1, in normal-map uv units along v: 0.03..0.07 m of profile)
    if (!flat) {
      const repU = 1 / (KNIT.WALES * KNIT.WALE), repV = 1 / (KNIT.COURSES * KNIT.COURSE);
      m.userData.streak = { fu: 95 / (Math.PI * 2 * 0.25 * repU), fv: 3.2 / repV, rough: 0.36, spec: dark ? 0.7 : 0.5, tilt: dark ? 0.45 : 0.35, v0: 0.03 * repV, v1: 0.07 * repV, seed: 3 };
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
