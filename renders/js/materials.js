// Physically based material library for the packshot pipeline.
// Colours are sRGB hex (three converts to linear). All materials are cached by
// key so a batch of renders reuses compiled programs.
import * as THREE from 'three';
import * as TX from './textures.js';

export const COLORS = {
  // tent fabric / textile colours (sRGB, slightly desaturated vs. screen-pure so they read as dyed fabric)
  wit: '#F3F3F0', offwhite: '#EEEADF', creme: '#ECE3CF', champagne: '#E4D6BC', ivoor: '#EFE9DA',
  zwart: '#1D1E20', antraciet: '#3F4247', grijs: '#6E7276', donkergrijs: '#4A4D52', lichtgrijs: '#B9BBBD', zilver: '#BFC2C5',
  blauw: '#1E4E9E', koningsblauw: '#2048A8', donkerblauw: '#1B2A4C', marineblauw: '#1B2A4C', lichtblauw: '#78A9D6', turquoise: '#159FA3',
  rood: '#B5161E', bordeaux: '#6B1A27', roze: '#E27BA9', fuchsia: '#C2206E', paars: '#57297F', lila: '#A893C8',
  groen: '#1F6C3C', donkergroen: '#1E3B2B', lichtgroen: '#7DB744', limoen: '#9CC93A', olijf: '#6A6B3A', mint: '#A6D9C2',
  oranje: '#E2681B', geel: '#F1C21A', goud: '#C49A45', beige: '#D8CBB2', zand: '#CDBB98', taupe: '#8B7D6E', bruin: '#6A4A33', camel: '#B98A57',
};

export function resolveColor(c, fallback = '#888888') {
  if (!c) return fallback;
  if (typeof c !== 'string') return c;
  const k = c.toLowerCase().replace(/[\s_-]/g, '');
  if (COLORS[k]) return COLORS[k];
  if (/^#?[0-9a-f]{6}$/i.test(c)) return c.startsWith('#') ? c : '#' + c;
  return fallback;
}

const cache = new Map();
function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

// sRGB chroma (max - min channel, 0..1): neutral greys / black / white ~0, dyed colours > 0.2
const chromaOf = (hex) => { const c = new THREE.Color(hex).convertLinearToSRGB(); return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b); };
const lum = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };

// Polyester 600D-style tent fabric with PVC/PU coating: soft clearcoat-like sheen,
// fine weave. uv units are metres on all fabric geometry, so repeat = tiles per metre.
// Albedo is clamped to a physically plausible range for coated fabric: white PVC
// reflects ~80 % (not 90+ %, which melts into a light backdrop) and black coated
// polyester ~4-5 %: it reads black through its diffuse and shows gloss only as a
// reflection of the studio softboxes (the studio environment is dark elsewhere).
export function tentFabricBase(color) {
  const hex = resolveColor(color, COLORS.wit);
  const base = new THREE.Color(hex);
  const L = lum(hex);
  // white PVC-coated polyester reflects ~85 %: bright enough to read as white (not light
  // grey) next to a light backdrop, still below a 90 %+ paper white
  if (L > 0.85) base.multiplyScalar(0.85 / L);
  // black: the swatch itself (#1D1E20 = 1.2 %) is a hair darker than real black coated
  // polyester (the coating adds its own sheen on top). Only true blacks are lifted, and only to
  // 1.6 %: antraciet (5 %) and grijs (16 %) keep their swatch albedo, so zwart / antraciet /
  // grijs stay three clearly different products under the same light
  if (L < 0.016) base.multiplyScalar(0.016 / Math.max(L, 1e-4));
  return base;
}
// Weave tile: 32 threads of 1 mm -> 3.2 cm per tile (uv in metres on all fabric geometry).
export const WEAVE_REPEAT = 1 / 0.032;
export function tentFabric(color, { side = THREE.DoubleSide, translucent = true } = {}) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`tent:${hex}:${side}:${translucent}`, () => {
    const L = lum(hex);
    const base = tentFabricBase(hex);
    const dark = L < 0.1, light = L > 0.6;
    // PVC-coated polyester: a matte-satin coating (no clearcoat: a second sharp lobe makes
    // puddle-shaped softbox reflections), one broad soft sheen, fine isotropic plain weave
    const m = new THREE.MeshPhysicalMaterial({
      color: base,
      roughness: dark ? 0.58 : light ? 0.66 : 0.62,
      metalness: 0,
      specularIntensity: dark ? 0.55 : 0.45,
      // fibre sheen at grazing angles, tinted by the dye (never a white veil on black)
      sheen: dark ? 0.3 : 0.2,
      sheenRoughness: 0.6,
      sheenColor: dark ? base.clone().multiplyScalar(2.2) : new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), light ? 0.25 : 0.15),
      // 1 mm plain weave under the coating (~8 deg yarn slopes): readable in close-ups,
      // mip-averaged to a flat normal at catalogue distance
      normalMap: TX.plainWeaveNormal(),
      normalScale: new THREE.Vector2(0.7, 0.7),
      side,
    });
    m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(WEAVE_REPEAT, WEAVE_REPEAT); m.normalMap.needsUpdate = true;
    // reflections of the studio softboxes on the cloth (fraction of the scene environment):
    // kept low so dark and saturated roofs show one broad sheen, not mirror images
    m.userData.envSpec = dark ? 0.38 : light ? 0.35 : 0.3;
    // light fabric glows slightly when lit from the other side (roof seen from inside)
    m.userData.translucency = translucent ? 0.18 * Math.min(1, L * 1.4) : 0;
    m.name = `tentFabric ${hex}`;
    return m;
  });
}

// PVC-coated polyester canopy cloth (easy-up roofs, valances, side walls). Same albedo as
// tentFabric, plus what makes coated cloth read as cloth instead of clay:
//  - the 1 mm plain weave shows as relief once the camera resolves it (engine `weave` hook:
//    boosted close up, the coating's gloss varies over yarn crowns and flanks; at catalogue
//    distance it averages into a slightly more matte lobe instead of aliasing),
//  - an isotropic macro layer (coating grain, soft cockle, sparse slubs; textures.coatingMacroNormal),
//  - light coloured cloth transmits light: the underside of a white roof glows light grey,
//    with the frame and seams reading darker against it (engine `translucency`),
//  - a broad soft sheen on dark cloth (more env reflection, fibre sheen tinted by the dye),
//  - `interior`: inside a walled tent only shadowed light reaches the inward faces.
export function pvcCloth(color, { side = THREE.DoubleSide, translucent = true } = {}) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`pvcCloth:${hex}:${side}:${translucent}`, () => {
    const L = lum(hex);
    const dark = L < 0.1, light = L > 0.6;
    const m = tentFabric(hex, { side, translucent }).clone();
    // one PVC coating for every colour (white aside): the same broad soft sheen of the overhead
    // scrim lies on top of every dye, so black gets its form from that sheen (not from more
    // light), lit faces of coloured cloth turn a little lighter and less saturated, and
    // faces turned away keep the deeper dye
    m.roughness = light ? 0.62 : 0.5;
    m.specularIntensity = light ? 0.5 : 0.62;
    m.sheen = dark ? 0.35 : 0.25;
    m.sheenRoughness = dark ? 0.5 : 0.6;
    if (dark) m.sheenColor = m.color.clone().multiplyScalar(1.6);
    m.normalScale = new THREE.Vector2(1.1, 1.1);
    m.userData = {
      envSpec: light ? 0.32 : 0.5,
      // dyed cloth in shade reads deeper and a little more saturated (light that reaches a shaded
      // face has mostly bounced off the same dyed cloth); engine `dye` hook
      dye: chromaOf(hex) < 0.12 ? 0 : 0.35,
      // white: the underside glows light grey-white from the overhead light, faces turned from
      // the key a little less (the key's share is damped so the near face does not burn out)
      translucency: translucent ? (light ? 0.55 : 0.3 * Math.min(1, L * 1.4)) : 0,
      translKey: light ? 0.6 : 0.8, translSky: light ? 2.4 : 1.6,
      weave: { repeats: 16, boost: light ? 2.4 : 1.9, roughVar: 0.45, matte: 0.04 },
      macro: { tex: 'coatingMacro', scale: 1 / WEAVE_REPEAT, strength: dark ? 0.45 : 0.4, coat: 0.6, rough: 0.2 },
      interior: true,
    };
    m.name = `pvcCloth ${hex}`;
    return m;
  });
}

// Double layer of pvcCloth (reinforcement patches, tapes): same colour and coating, less
// translucent (reads slightly darker from below, like real patches against the light).
export function pvcPatch(color) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`pvcPatch:${hex}`, () => {
    const base = pvcCloth(hex);
    const m = base.clone();
    // a double layer carries a double coating: a touch glossier, so patches, tapes and seam welts
    // read through their different sheen (same colour: a different albedo reads as a smudge)
    m.roughness = Math.max(0.3, base.roughness - 0.1);
    m.specularIntensity = Math.min(1, base.specularIntensity + 0.12);
    m.userData = { ...JSON.parse(JSON.stringify(base.userData)), translucency: (base.userData.translucency || 0) * 0.45, envSpec: (base.userData.envSpec ?? 0.4) * 1.18 };
    delete m.userData.__hooked;
    m.name = `pvcPatch ${hex}`;
    return m;
  });
}

// Tone-on-tone sewing thread for pvcCloth: the same dye, a hair lighter than the cloth (on
// white it matches the cloth). It reads through relief, not colour: each stitch carries a
// vertex colour that darkens towards its needle holes (where the thread dives into the cloth).
export function pvcThread(color) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`pvcThread:${hex}`, () => {
    const L = lum(hex);
    const c = tentFabricBase(hex).clone();
    const dark = L < 0.1;
    if (dark) c.lerp(new THREE.Color().setRGB(0.1, 0.101, 0.106), 0.9);
    else if (L < 0.6) c.lerp(new THREE.Color('#ffffff'), 0.06);
    // on dark cloth most of what the eye sees is sheen: the thread gets the same sheen and
    // gloss as the cloth, so it reads a hair lighter, never as a dark dashed line
    const m = new THREE.MeshPhysicalMaterial({
      color: c, vertexColors: true, roughness: dark ? 0.5 : 0.62, specularIntensity: dark ? 0.7 : 0.4, sheen: dark ? 0.6 : 0.4, sheenRoughness: 0.45,
      sheenColor: dark ? c.clone().multiplyScalar(2.6) : c.clone(), side: THREE.DoubleSide, name: `pvcThread ${hex}`,
    });
    // coloured / white cloth: no white sheen or env glints on the tiny thread crowns (they
    // sparkle as white specks along a seam at catalogue size)
    if (!dark) m.specularIntensity = 0.25;
    m.userData.envSpec = dark ? 0.62 : 0.12;
    m.userData.threadAO = dark ? 0.55 : 1;
    m.userData.interior = true;
    return m;
  });
}

// Reinforcement patch (double layer): same cloth, a touch more matte and less translucent.
export function tentPatch(color) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`tentPatch:${hex}`, () => {
    const m = tentFabric(hex).clone();
    // a double layer of the same cloth: same colour and coating (a different finish reads
    // as a smudge at catalogue size); only a little less translucent
    m.roughness = Math.min(0.7, m.roughness + 0.04);
    m.userData = { envSpec: m.userData.envSpec, translucency: (m.userData.translucency || 0) * 0.4 }; // fresh: not yet hooked by the engine
    m.name = `tentPatch ${hex}`;
    return m;
  });
}

// Sewing thread on tent fabric: same hue, a touch darker on light cloth / lighter on
// dark cloth, so stitch lines read as a fine dashed line (like real topstitching).
export function tentThread(color) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`thread:${hex}`, () => {
    const L = lum(hex);
    const c = tentFabricBase(hex).clone();
    if (L > 0.5) c.multiplyScalar(0.72); else if (L < 0.1) c.lerp(new THREE.Color().setRGB(0.16, 0.16, 0.17), 0.8); else c.multiplyScalar(0.8);
    const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.7, specularIntensity: 0.3, sheen: 0.3, sheenRoughness: 0.5, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.15), side: THREE.DoubleSide, name: `thread ${hex}` });
    // tiny curved pillows: full-strength softbox reflections would sparkle as white specks
    m.userData.envSpec = 0.25;
    return m;
  });
}

// Polypropylene webbing (straps, zip tape): fine diagonal twill ribs (~1.2 mm), a soft
// dark sheen. uv in metres along/across the strap.
export function webbing(color = '#151617') {
  return cached(`webbing:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.6, sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color('#3c3d3f'),
      normalMap: TX.twillNormal().clone(), normalScale: new THREE.Vector2(0.55, 0.55), side: THREE.DoubleSide, name: `webbing ${color}`,
    });
    m.normalMap.repeat.set(9, 9); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Moulded acetal zip teeth: dark, smooth, satin-gloss (each tooth catches a highlight).
export function zipTooth(color = '#151516') {
  return cached(`ziptooth:${color}`, () => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.3, metalness: 0, specularIntensity: 0.8, clearcoat: 0.3, clearcoatRoughness: 0.25, name: `zip tooth ${color}`,
  }));
}

// Stretch lycra/spandex: tight knit, pronounced sheen that glints along curvature.
export function lycra(color) {
  const hex = resolveColor(color, COLORS.zwart);
  return cached(`lycra:${hex}`, () => {
    const L = lum(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: 0.56,
      metalness: 0,
      specularIntensity: 0.42,
      envMapIntensity: 0.7,
      sheen: 1.0,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), L < 0.05 ? 0.16 : L < 0.25 ? 0.14 : 0.28),
      normalMap: TX.knitNormal({ loops: 40 }).clone(),
      normalScale: new THREE.Vector2(0.35, 0.35),
      side: THREE.DoubleSide,
    });
    m.normalMap.repeat.set(160, 160); m.normalMap.needsUpdate = true;
    m.name = `lycra ${hex}`;
    return m;
  });
}

// Woven polyester (strik covers, kleden): matte with soft satin sheen.
export function polyCloth(color, { satin = 0.35 } = {}) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`poly:${hex}:${satin}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: 0.62,
      specularIntensity: 0.45,
      sheen: 0.7,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), satin),
      normalMap: TX.twillNormal().clone(),
      normalScale: new THREE.Vector2(0.3, 0.3),
      side: THREE.DoubleSide,
    });
    m.normalMap.repeat.set(60, 60); m.normalMap.needsUpdate = true;
    m.name = `polyCloth ${hex}`;
    return m;
  });
}

// Satin ribbon for the sash/bow (shinier).
export function satinRibbon(color) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`satin:${hex}`, () => new THREE.MeshPhysicalMaterial({
    color: hex, roughness: 0.32, specularIntensity: 0.7, sheen: 1, sheenRoughness: 0.3,
    sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.4), side: THREE.DoubleSide, name: `satin ${hex}`,
  }));
}

// Anodised / brushed aluminium (tent legs). uv V runs along the tube.
export function aluminium({ tone = '#D5D8DB', roughness = 0.3 } = {}) {
  return cached(`alu:${tone}:${roughness}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: tone, metalness: 1, roughness,
      anisotropy: 0.55, anisotropyRotation: Math.PI / 2,
      normalMap: TX.brushedNormal().clone(), normalScale: new THREE.Vector2(0.12, 0.12),
    });
    m.normalMap.repeat.set(30, 4); m.normalMap.needsUpdate = true;
    m.name = 'aluminium';
    return m;
  });
}

export function steelPowder(color = '#1C1D1F', { roughness = 0.42, clearcoat = 0.25, clearcoatRoughness = 0.35 } = {}) {
  const hex = resolveColor(color, '#1C1D1F');
  return cached(`powder:${hex}:${roughness}:${clearcoat}:${clearcoatRoughness}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, metalness: 0.0, roughness, clearcoat, clearcoatRoughness,
      normalMap: TX.stippleNormal().clone(), normalScale: new THREE.Vector2(0.08, 0.08),
    });
    m.normalMap.repeat.set(40, 40); m.normalMap.needsUpdate = true;
    m.name = `powdercoat ${hex}`;
    return m;
  });
}

export function chrome() {
  return cached('chrome', () => new THREE.MeshStandardMaterial({ color: '#F4F5F7', metalness: 1, roughness: 0.06, name: 'chrome' }));
}

export function galvanised() {
  return cached('galv', () => {
    const m = new THREE.MeshStandardMaterial({
      color: '#AEB2B6', metalness: 0.85, roughness: 0.42,
      normalMap: TX.stippleNormal({ scale: 30 }).clone(), normalScale: new THREE.Vector2(0.035, 0.035), name: 'galvanised',
    });
    m.normalMap.repeat.set(40, 40); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Hot-dip galvanised steel (foot plates): metallic grey, mottled spangle gloss (roughness
// ~0.3-0.6 per zinc crystal) and a faint tone difference between crystals. uv in metres.
export function galvanisedSteel() {
  return cached('galvSteel', () => {
    const sp = TX.galvSpangle();
    const rough = sp.rough.clone(), tone = sp.tone.clone();
    for (const t of [rough, tone]) { t.repeat.set(10, 10); t.needsUpdate = true; }
    const m = new THREE.MeshPhysicalMaterial({
      color: '#B4B8BB', metalness: 0.8, roughness: 1.0, roughnessMap: rough, map: tone, specularIntensity: 0.8,
      normalMap: TX.stippleNormal({ scale: 30 }).clone(), normalScale: new THREE.Vector2(0.03, 0.03), name: 'galvanised steel',
    });
    m.normalMap.repeat.set(40, 40); m.normalMap.needsUpdate = true;
    return m;
  });
}

export function nylon(color = '#171717') {
  return cached(`nylon:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.58, metalness: 0, specularIntensity: 0.5,
      normalMap: TX.stippleNormal({ scale: 26 }).clone(), normalScale: new THREE.Vector2(0.12, 0.12), name: `nylon ${color}`,
    });
    m.normalMap.repeat.set(30, 30); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Injection-moulded glass-filled nylon (tent brackets, sliders, truss nodes): satin,
// no bump texture (a fine mould texture only shows as roughness).
export function mouldedNylon(color = '#161616') {
  return cached(`mnylon:${color}`, () => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.46, metalness: 0, specularIntensity: 0.55, clearcoat: 0.08, clearcoatRoughness: 0.5, name: `moulded nylon ${color}`,
  }));
}

// Cast aluminium (Professional brackets): satin grey with a fine sand-cast grain.
export function castAluminium(tone = '#9DA2A7') {
  return cached(`castalu:${tone}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: tone, metalness: 1, roughness: 0.48,
      normalMap: TX.stippleNormal({ size: 256, strength: 0.6, scale: 60, seed: 19 }).clone(), normalScale: new THREE.Vector2(0.06, 0.06), name: 'cast aluminium',
    });
    m.normalMap.repeat.set(60, 60); m.normalMap.needsUpdate = true;
    return m;
  });
}

export function rubber(color = '#121212') {
  return cached(`rubber:${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, name: 'rubber' }));
}

// Rubber-coated moulded weight plates: matte, fine moulded grain, faint sheen.
export function mouldedRubber(color = '#242527') {
  return cached(`mrubber:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.78, metalness: 0, specularIntensity: 0.45, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color('#4a4b4d'),
      normalMap: TX.stippleNormal({ size: 256, strength: 1.4, scale: 34, seed: 29 }).clone(), normalScale: new THREE.Vector2(0.22, 0.22), name: `moulded rubber ${color}`,
    });
    m.normalMap.repeat.set(70, 70); m.normalMap.needsUpdate = true;
    return m;
  });
}

export function hdpe(color = '#F1F1ED') {
  const hex = resolveColor(color, '#F1F1ED');
  return cached(`hdpe:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, roughness: 0.5, metalness: 0, specularIntensity: 0.5, clearcoat: 0.1, clearcoatRoughness: 0.5,
      normalMap: TX.stippleNormal({ scale: 22 }).clone(), normalScale: new THREE.Vector2(0.22, 0.22), name: `hdpe ${hex}`,
    });
    m.normalMap.repeat.set(10, 10); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Lacquered birch plywood face; uv in metres.
export function birchFace() {
  return cached('birchFace', () => {
    const map = TX.birchAlbedo().clone(); map.repeat.set(1.1, 1.1); map.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({ map, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, specularIntensity: 0.5, name: 'birch face' });
  });
}
export function birchEdge() {
  return cached('birchEdge', () => {
    const map = TX.plyEdgeAlbedo().clone(); map.repeat.set(6, 1); map.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({ map, roughness: 0.62, clearcoat: 0.2, clearcoatRoughness: 0.5, name: 'birch edge' });
  });
}

// Melamine / HPL coloured board (black or white tops).
export function laminate(color) {
  const hex = resolveColor(color, '#1D1E20');
  return cached(`laminate:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.38, specularIntensity: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.3, name: `laminate ${hex}` }));
}

// Clear PVC window foil (rendered with stochastic transparency, see engine): ~70 %
// transmission, a faint milky haze (lifts a dark interior seen through it), a glossy
// surface with slight waviness so the studio softbox reflects in it as an uneven streak.
export function pvcWindow() {
  return cached('pvc', () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#5C656B', roughness: 0.1, metalness: 0, specularIntensity: 1.0, clearcoat: 0.8, clearcoatRoughness: 0.06,
      envMapIntensity: 1.2, side: THREE.DoubleSide, name: 'pvc window',
      normalMap: TX.softWrinkleNormal().clone(), normalScale: new THREE.Vector2(0.06, 0.06),
    });
    m.normalMap.repeat.set(1.3, 1.3); m.normalMap.needsUpdate = true;
    m.userData.stochasticAlpha = 0.38;
    return m;
  });
}

export function castIron(color = '#2B2C2E') {
  return cached(`castiron:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, metalness: 0.15, roughness: 0.62, clearcoat: 0.15,
      normalMap: TX.stippleNormal({ scale: 40 }).clone(), normalScale: new THREE.Vector2(0.12, 0.12), name: 'cast iron',
    });
    m.normalMap.repeat.set(24, 24); m.normalMap.needsUpdate = true;
    return m;
  });
}

export function printMaterial(tex, { roughness = 0.6 } = {}) {
  return new THREE.MeshPhysicalMaterial({ map: tex, transparent: false, alphaTest: 0.5, roughness, side: THREE.DoubleSide, name: 'print' });
}

export function basic(color, opts = {}) {
  return cached(`basic:${color}:${JSON.stringify(opts)}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts }));
}
