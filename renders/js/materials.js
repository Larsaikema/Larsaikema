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

const lum = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };

// Polyester 600D-style tent fabric with PVC/PU coating: soft clearcoat-like sheen,
// fine weave. uv units are metres on all fabric geometry, so repeat = tiles per metre.
// Albedo is clamped to a physically plausible range for coated fabric: white PVC
// reflects ~80-85 % (not 90+ %, which melts into a light backdrop) and "black"
// coated polyester still reflects ~6-7 % with a visible sheen.
export function tentFabricBase(color) {
  const hex = resolveColor(color, COLORS.wit);
  const base = new THREE.Color(hex);
  const L = lum(hex);
  if (L > 0.80) base.multiplyScalar(0.80 / L);
  if (L < 0.06) base.lerp(new THREE.Color().setRGB(0.066, 0.067, 0.071), Math.min(1, (0.06 - L) / 0.06 + 0.35));
  return base;
}
export function tentFabric(color, { side = THREE.DoubleSide, translucent = true } = {}) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`tent:${hex}:${side}:${translucent}`, () => {
    const L = lum(hex);
    const base = tentFabricBase(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: base,
      roughness: 0.5,
      metalness: 0,
      specularIntensity: 0.55,
      clearcoat: L < 0.1 ? 0.35 : 0.22,     // PVC coating: broad soft highlight
      clearcoatRoughness: 0.45,
      sheen: L < 0.1 ? 0.6 : 0.3,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), L < 0.1 ? 0.35 : 0.25),
      // 600D oxford relief (~10 deg yarn slopes): readable in close-ups, mip-averaged away at catalogue distance
      normalMap: TX.weaveNormal({ threads: 24, strength: 8 }),
      normalScale: new THREE.Vector2(1, 1),
      side,
    });
    // 600D oxford: ~0.6 mm yarns in a 2x2 basket weave -> ~1.2 mm pattern, visible in close-ups
    m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(36, 36); m.normalMap.needsUpdate = true;
    // light fabric glows slightly when lit from the other side (roof seen from inside)
    m.userData.translucency = translucent ? 0.18 * Math.min(1, L * 1.4) : 0;
    m.name = `tentFabric ${hex}`;
    return m;
  });
}

// Reinforcement patch (double layer): same cloth, a touch more matte and less translucent.
export function tentPatch(color) {
  const hex = resolveColor(color, COLORS.wit);
  return cached(`tentPatch:${hex}`, () => {
    const m = tentFabric(hex).clone();
    const L = lum(hex);
    m.roughness = 0.62; m.clearcoat = 0.08; m.color.multiplyScalar(L > 0.5 ? 0.975 : 1.12);
    m.userData = { translucency: (m.userData.translucency || 0) * 0.4 }; // fresh: not yet hooked by the engine
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
    return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.6, sheenRoughness: 0.4, sheenColor: new THREE.Color('#ffffff').multiplyScalar(0.3), side: THREE.DoubleSide, name: `thread ${hex}` });
  });
}

// Polypropylene webbing (straps, velcro tabs) and moulded plastic hardware.
export function webbing(color = '#151617') {
  return cached(`webbing:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.62, sheen: 0.5, sheenRoughness: 0.45, sheenColor: new THREE.Color('#5a5a5a'),
      normalMap: TX.twillNormal().clone(), normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide, name: `webbing ${color}`,
    });
    m.normalMap.repeat.set(120, 120); m.normalMap.needsUpdate = true;
    return m;
  });
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

export function steelPowder(color = '#1C1D1F', { roughness = 0.42, clearcoat = 0.25 } = {}) {
  const hex = resolveColor(color, '#1C1D1F');
  return cached(`powder:${hex}:${roughness}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex, metalness: 0.0, roughness, clearcoat, clearcoatRoughness: 0.35,
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

export function rubber(color = '#121212') {
  return cached(`rubber:${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, name: 'rubber' }));
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

// Clear PVC window foil. Rendered with stochastic transparency (see engine).
export function pvcWindow() {
  return cached('pvc', () => {
    // clear PVC foil transmits ~70 %: 30 % stochastic coverage of a cool grey glossy sheet
    const m = new THREE.MeshPhysicalMaterial({ color: '#3E474E', roughness: 0.08, metalness: 0, specularIntensity: 1.0, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 0.9, side: THREE.DoubleSide, name: 'pvc window' });
    m.userData.stochasticAlpha = 0.32;
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
