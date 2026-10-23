// G45 E27 lamps that read as *lit* (lighting group), built on js/lightGlow.js.
//
// g45(GC, bins, M4, { kind, on, color }) adds one lamp, transformed by M4 (lamp frame: axis +Y,
// contact at the origin, glass tip at y = 0.078), to `bins` (beauty pass) and to the glow
// compositor `GC`:
//   filament  clear globe and stem are real glass (marker + reflection shell, no speckle): you see
//             the four LED filaments, the stem and whatever lies behind through them. Lit, the
//             filaments burn near-white at the core and amber at the flanks (emissive strips plus
//             an analytic line glow inside the glass), the globe fills with a warm volume glow
//             and a soft amber bloom surrounds the lamp. Unlit: phosphor-yellow strips.
//   opal      frosted "melkglas" globe on a white neck: a self-lit diffuser when on.
//   colour    coated coloured glass on the neck (rood, oranje, geel, groen, blauw ...).
// Returns { centre (world V3), axis (world V3), light: [r,g,b] linear }.
import * as THREE from 'three';
import * as G from './geom.js';
import * as L from './lightKit.js';
import { kelvin } from './lightGlow.js';
import { spill } from './heatGlow.js';

const { V3 } = G;
const TAU = Math.PI * 2;

export const G45 = L.G45;
// LED filament light (extra warm white, ~2200-2400 K) as it photographs against a light backdrop:
// a white-hot yellow core, an amber glow round the strip, a golden haze in the globe and bloom
export const FIL = {
  core: [1.0, 0.74, 0.40],
  glow: [1.0, 0.52, 0.13],
  haze: [1.0, 0.6, 0.2],
  bloom: [1.0, 0.56, 0.17],
  sigma: [0.04, 0.24, 0.75],   // amber haze in the lit globe: absorbs blue, then green (per radius)
};

// A coated (coloured) or tinted opal globe that is *switched on* (round 5). The old lit coating was a
// glossy diffuser with emissive ~0.85: the studio light still shaded it (a dark side lower right),
// the clearcoat mirrored every softbox, and nothing in it was brighter than the colour, so it read
// as an unlit candy ball. A lit coloured lamp photographs the other way round: the light comes from
// inside, so there is no dark side; the middle of the globe (where you look through the most lit
// coating) is a hot, paler core and the rim stays deep and saturated; the coating is matte, so the
// studio leaves at most one soft sheen. Here: albedo almost black (studio shading drops out), no
// clearcoat, a weak rough specular, and an emissive that runs from `rim` x edge at the silhouette to
// `core` facing the camera (pow(facing, p)). Colours are linear radiance; the core is set above the
// tone curve's shoulder on purpose (it whitens a little, like a photographed light), the rim below.
// map (optional): an emissive pattern (grey) that multiplies the result (rope light: an LED every 27.8 mm)
export function glowGlobeMat(key, { rim, core, edge = 0.7, p = 1.8, albedo = 0.05, spec = 0.12, rough = 0.42, map = null, name = null }) {
  return L.cached(`bk:gg:${key}:${rim}:${core}:${edge}:${p}:${albedo}:${spec}:${rough}:${map ? map.uuid : ''}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setRGB(rim[0] * albedo, rim[1] * albedo, rim[2] * albedo), roughness: rough, metalness: 0,
      specularIntensity: spec, envMapIntensity: 0.35, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1, name: name || `coloured glass lit ${key}`,
    });
    if (map) m.emissiveMap = map;
    m.userData.gg = { uGgRim: { value: new THREE.Vector3(...rim) }, uGgCore: { value: new THREE.Vector3(...core) }, uGgShape: { value: new THREE.Vector2(edge, p) } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.gg);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uGgRim; uniform vec3 uGgCore; uniform vec2 uGgShape;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    float ggF = pow( clamp( abs( dot( normal, normalize( vViewPosition ) ) ), 0.0, 1.0 ), uGgShape.y );
    totalEmissiveRadiance = mix( uGgRim * uGgShape.x, uGgCore, ggF ) * totalEmissiveRadiance;
  }`);
    };
    m.customProgramCacheKey = () => `bkGlowGlobe${map ? 'm' : ''}`;
    m.needsUpdate = true;
    return m;
  });
}

// colours of a lit coloured lamp: rim (saturated, below the shoulder) and core (hotter, paler)
export function glowColours(light, { warm = false } = {}) {
  const [r, g, b] = light;
  // 2000 K: golden amber (not the orange lamp): an amber rim, a pale gold core
  if (warm) return { rim: [0.95, 0.48, 0.1], core: [2.3, 1.72, 0.7], halo: [1.15, 0.6, 0.16] };
  // the core: the colour pushed past the shoulder plus a little light of a neighbouring, lighter
  // hue, as a camera sees a bright LED (red -> orange-white, blue -> sky/cyan-white, green ->
  // yellow-green), so it reads as the hot middle of the same colour, not as a white or grey spot
  const cool = b > r && b > g, green = g > r && g > b;
  const tint = cool ? [0.12, 0.42, 0.55] : green ? [0.3, 0.45, 0.12] : [0.32, 0.36, 0.12];
  const w = 0.32;
  return {
    rim: [r * 0.92, g * 0.92, b * 0.92],
    core: [r * 2.35 + w * tint[0], g * 2.35 + w * tint[1], b * 2.35 + w * tint[2]],
    halo: [r * 1.15, g * 1.15, b * 1.15],
  };
}

function filamentMat(on) {
  return on
    ? L.cached('bk:fil:on', () => new THREE.MeshStandardMaterial({ color: '#FFE2B0', emissive: new THREE.Color().setRGB(...FIL.core), emissiveIntensity: 9, roughness: 0.6, name: 'led filament lit' }))
    : L.cached('bk:fil:off', () => new THREE.MeshPhysicalMaterial({ color: '#E7B04C', roughness: 0.42, sheen: 0.5, sheenColor: new THREE.Color('#FFE6B0'), name: 'led filament (phosphor)' }));
}

export function g45(GC, bins, M4, { kind = 'filament', on = true, color = null, bloom = 1, volume = 1, bloomR = 0.085, K = null, glassI = 1.15, coatRough = 0.06, glow = null } = {}) {
  const mats = L.e27Mats();
  const xf = (g) => g.applyMatrix4(M4);
  const add = (m, g) => bins.add(m, xf(g));
  L.e27Base(add, mats);
  const centre = V3(0, G45.yc, 0).applyMatrix4(M4);
  const axis = V3(0, 1, 0).transformDirection(M4);
  let light = FIL.bloom;
  if (kind === 'filament') {
    // globe + stem as real glass
    const globe = xf(G.lathe(L.globeProfile('glass'), 72));
    bins.extra = bins.extra || [];
    bins.extra.push(GC.glass(globe, { T: 0.95, env: 1.25, rough: 0.035 }));
    const stem = xf(G.lathe([[0.0001, 0.026], [0.0085, 0.026], [0.0075, 0.03], [0.0032, 0.034], [0.0026, 0.043], [0.0034, 0.0446], [0.0001, 0.0452]], 28));
    bins.extra.push(GC.glass(stem, { T: 0.9, env: 0.8, rough: 0.05 }));
    // support wire, filaments, lead wires
    const top = V3(0, 0.0672, 0);
    add(mats.nickel, G.tube(V3(0, 0.0445, 0), top, 0.00035, 6));
    const fil = filamentMat(on);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      const b = V3(Math.cos(a) * 0.0042, 0.0418, Math.sin(a) * 0.0042), t = V3(Math.cos(a) * 0.0088, 0.0662, Math.sin(a) * 0.0088);
      const dir = t.clone().sub(b).normalize();
      const side = V3(-Math.sin(a), 0, Math.cos(a));
      add(fil, G.prism(G.roundedRectProfile(0.0012, 0.0006, 0.00025, 2), b, t, { side }));
      add(mats.nickel, G.tube(V3(Math.cos(a) * 0.0028, 0.0436, Math.sin(a) * 0.0028), b.clone().addScaledVector(dir, 0.0004), 0.0003, 5));
      add(mats.nickel, G.tube(top, t.clone().addScaledVector(dir, -0.0004), 0.00028, 5));
      if (on) {
        // the burning strip: a tight white-hot core and a wider amber glow, seen through the glass
        const A = b.clone().applyMatrix4(M4), B = t.clone().applyMatrix4(M4);
        // (round 5: brighter and tighter, so the four strips read through clear glass instead of
        // a milky amber fill)
        GC.line({ a: A, b: B, color: FIL.core, I: 9, s1: 0.0007, s2: 0.0016, w2: 0.4 });
        GC.line({ a: A, b: B, color: FIL.glow, I: 1.3, s1: 0.0028, s2: 0.0065, w2: 0.32 });
      }
    }
    if (on) {
      // the haze fills the globe and runs down into the neck (outside the glass it is masked)
      // (round 5: a thinner haze; the old one filled the globe like milk glass)
      GC.volume({ c: centre.clone().addScaledVector(axis, 0.002), R: G45.R * 0.99, color: FIL.haze, I: 0.04 * volume, p: 1.6, core: 0.9, sigma: FIL.sigma.map((v) => v * 0.45 * volume) });
      GC.volume({ c: V3(0, 0.035, 0).applyMatrix4(M4), R: 0.0145, color: FIL.haze, I: 0.03 * volume, p: 1.2, core: 0, sigma: FIL.sigma.map((v) => v * 0.4 * volume) });
      if (bloom > 0) {
        // bloom: a tight golden glow hugging the globe and a soft amber tail (one wide halo at full
        // strength saturated into a flat airbrushed disc); kept low over the glass itself, which
        // the combine veils with the bloom colour
        const b = Math.min(bloom, 1.6);
        GC.halo({ c: centre, R: bloomR * 0.45, color: [1.25, 0.84, 0.4], I: 0.46 * b, core: 0.6, coreW: 0.3 });
        GC.halo({ c: centre, R: bloomR, color: FIL.bloom.map((v) => v * 1.15), I: 0.2 * b, core: 0.25, coreW: 0.45 });
      }
    }
  } else {
    let neckM = L.moulded('#F1EFEA', 0.45);
    const neckG = G.lathe([[0.0122, 0.0262], [0.0134, 0.0275], [0.0138, 0.032], [0.0146, 0.0372], [0.0152, 0.0392], [0.0136, 0.0402], [0.0001, 0.0402]], 48);
    let glass;
    const warmK = kind === 'opal' && K && K < 2500;
    if (on && (kind === 'colour' || warmK)) {
      // switched-on coloured (or 2000 K) lamp: lit from inside (glowGlobeMat), a coloured neck
      // collar where the globe sits on it, a wide halo in the lamp's colour
      if (warmK) light = kelvin(K);
      else { const lc = new THREE.Color(L.lightHex(color, L.LIGHT.rood)); light = [lc.r, lc.g, lc.b]; }
      const gc = glowColours(light, { warm: warmK });
      const o = glow || {};
      const core = gc.core.map((v) => v * (o.core ?? 1));
      glass = glowGlobeMat(warmK ? `k${K}` : L.lightHex(color, L.LIGHT.rood), { rim: gc.rim, core, edge: o.edge ?? 0.72, p: o.p ?? 1.8 });
      // the neck's upper edge and the top of the E27 crimp catch the globe's light
      const src = V3(0, G45.yc - G45.R * 0.55, 0).applyMatrix4(M4);
      const sk = `${gc.rim}@${src.toArray().map((v) => v.toFixed(4))}`;
      neckM = L.cached(`bk:neck:${sk}`, () => spill(L.moulded('#F1EFEA', 0.45), [{ a: src, color: gc.halo, I: 0.85, R: 0.011, p: 1, wrap: 0.35 }], { key: 'bkn', env: 0.85 }));
      add(neckM, neckG);
      add(glass, G.lathe(L.globeProfile('collar'), 64));
      if (bloom > 0) {
        // a tight bright ring of light round the globe and a wide soft tail, in the lamp's colour
        const b = Math.min(bloom, 1.3);
        GC.halo({ c: centre, R: bloomR, color: gc.halo, I: 0.72 * b, core: 0.42, coreW: 0.42 });
        GC.halo({ c: centre, R: bloomR * 1.25, color: gc.halo, I: 0.16 * b, core: 0.2, coreW: 0.5 });
      }
      return { centre, axis, light: gc.halo.map((v) => v / 1.15) };
    }
    add(neckM, neckG);
    if (kind === 'opal') {
      // K: colour temperature of an opal lamp (default 2700 K; the 2000 K "extra warm" lamp of the
      // coloured series glows a deeper amber)
      light = kelvin(K || 2700);
      const warm = K && K < 2500;
      // 2000 K: a warm-tinted diffuser at a lower level, so the tone curve keeps it golden amber
      // (a white diffuser at 6 x washed out to salmon)
      const em = warm ? '#FFB534' : '#FFCF8F', emI = warm ? 2.5 : 6;
      glass = on
        ? L.cached(`bk:opal:on:${em}`, () => L.litDiffuser(new THREE.MeshPhysicalMaterial({ color: warm ? '#F2D59A' : '#FFFFFF', roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.1, emissive: new THREE.Color(em), emissiveIntensity: emI, name: 'opal glass lit' }), warm ? 0.5 : 0.42, 0.75))
        : L.cached('bk:opal:off', () => new THREE.MeshPhysicalMaterial({ color: '#F3F1EC', roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.08, sheen: 0.3, sheenColor: new THREE.Color('#ffffff'), name: 'opal glass' }));
    } else {
      const hex = L.lightHex(color, L.LIGHT.rood);
      const lc = new THREE.Color(hex); light = [lc.r, lc.g, lc.b];
      const base = new THREE.Color(hex).multiplyScalar(0.55);
      glass = on
        // lit: the coating's own colour must survive the tone curve, so the white studio reflection
        // is kept small (specular 0.3, a thin clearcoat, env 0.5): a broad white sheen over a red
        // globe made it read coral, a blue one lavender; the clearcoat keeps one crisp highlight
        ? L.cached(`bk:col:on:${hex}:${glassI}:${coatRough}`, () => L.litDiffuser(new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.34, specularIntensity: 0.3, clearcoat: 0.4, clearcoatRoughness: coatRough, envMapIntensity: 0.5, emissive: new THREE.Color(hex), emissiveIntensity: glassI, name: `coloured glass lit ${hex}` }), 0.4, 0.7))
        : L.cached(`bk:col:off:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.06, name: `coloured glass ${hex}` }));
    }
    add(glass, G.lathe(L.globeProfile('collar'), 64));
    if (on && bloom > 0) GC.halo({ c: centre, R: bloomR, color: light.map((v) => v * 1.2), I: 0.5 * bloom, core: 0.32, coreW: 0.55 });
  }
  return { centre, axis, light };
}

// Add the marker meshes collected by g45 (bins.extra) to a group.
export function flushExtra(bins, group) {
  for (const m of bins.extra || []) group.add(m);
  bins.extra = [];
}
