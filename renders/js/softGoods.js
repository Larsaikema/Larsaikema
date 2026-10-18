// Shared helpers for the parts group, round 2: what makes soft goods read as stitched cloth
// and small hardware read as real metal / moulded plastic at catalogue size.
//
//  - procSurface(): seam-free, isotropic surface detail computed in world space in the
//    fragment shader (no uv seams, no swirl): moulded stipple, sand-cast grain, hot-dip
//    galvanised spangle, cast concrete. Albedo, roughness and a bump (surface gradient).
//  - fabric600(): 600D polyester oxford (basket weave normal map + yarn macro layer, a soft
//    dye-tinted sheen), hookTape()/loopTape(), thread(), pvcTarp() (glossy PVC tarpaulin).
//  - creases(): anisotropic fold field (ridges/valleys with a direction, length and taper),
//    the thing that makes a bag panel read as cloth instead of a moulded block.
//  - softBox(): a sewn bag body (rounded box, rounded panel edges, flat end panels) with
//    displacement and warp hooks; point(f, t) on its surface for zips, straps, stitches.
//  - stitches(): rows of thread stitches (each a little raised pillow) along a surface path.
//  - frameProxy(): invisible points that steer the auto-framing (layer 5, never rendered).
// Units metres, Y up, deterministic (seeded noise only).
import * as THREE from 'three';
import * as G from './geom.js';
import * as M from './materials.js';
import * as TX from './textures.js';
import * as K from './partsKit.js';
import { rng, makeNoise2 } from './rng.js';
import { globalUniforms } from './engine.js';

const V3 = G.V3;
const TAU = Math.PI * 2;
const cache = new Map();
export function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------------------
// procedural world-space surface detail

const PROC_GLSL = `
varying vec3 vSgPos;
uniform vec4 uSg0; // x scale (m per noise cell), y bump (m), z albedo variation, w roughness variation
uniform vec4 uSg1; // x cell size (spangle / pores), y mottle scale (m), z mottle amount, w pore amount
float sgH31( vec3 p ) { p = fract( p * 0.1031 ); p += dot( p, p.zyx + 31.32 ); return fract( ( p.x + p.y ) * p.z ); }
vec3 sgH33( vec3 p ) { p = fract( p * vec3( 0.1031, 0.1030, 0.0973 ) ); p += dot( p, p.yxz + 33.33 ); return fract( ( p.xxy + p.yxx ) * p.zyx ); }
float sgN( vec3 x ) { vec3 i = floor( x ), f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( sgH31( i ), sgH31( i + vec3( 1, 0, 0 ) ), f.x ), mix( sgH31( i + vec3( 0, 1, 0 ) ), sgH31( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( sgH31( i + vec3( 0, 0, 1 ) ), sgH31( i + vec3( 1, 0, 1 ) ), f.x ), mix( sgH31( i + vec3( 0, 1, 1 ) ), sgH31( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z ); }
float sgF( vec3 p ) { float s = 0.0, a = 0.5; for ( int i = 0; i < 4; i ++ ) { s += a * sgN( p ); p = p * 2.07 + 13.7; a *= 0.5; } return s / 0.9375; }
// Voronoi: x = cell hash, y = F1, z = F2 - F1, plus the cell's random unit vector
vec3 sgCellDir;
vec3 sgVor( vec3 x ) { vec3 i = floor( x ), f = fract( x ); float d1 = 8.0, d2 = 8.0, id = 0.0; vec3 cd = vec3( 0.0 );
  for ( int k = -1; k <= 1; k ++ ) for ( int j = -1; j <= 1; j ++ ) for ( int n = -1; n <= 1; n ++ ) {
    vec3 g = vec3( float( n ), float( j ), float( k ) ); vec3 o = sgH33( i + g ); vec3 r = g + o - f; float d = dot( r, r );
    if ( d < d1 ) { d2 = d1; d1 = d; id = sgH31( i + g + 3.7 ); cd = sgH33( i + g + 11.3 ); } else if ( d < d2 ) d2 = d; }
  sgCellDir = normalize( cd - 0.5 + 1e-4 );
  return vec3( id, sqrt( d1 ), sqrt( d2 ) - sqrt( d1 ) ); }
`;

// kind: 'stipple' (moulded plastic / rubber / powder coat), 'cast' (sand-cast metal),
// 'galv' (hot-dip galvanised spangle), 'concrete' (cast concrete with laitance + pores).
export function procSurface(mat, { kind = 'stipple', scale = 0.0012, bump = 0.00002, albedo = 0.04, rough = 0.06, cell = 0.006, mottle = 0.05, mottleAmt = 0.0, pores = 0.0 } = {}) {
  mat.userData.sgU0 = { value: new THREE.Vector4(scale, bump, albedo, rough) };
  mat.userData.sgU1 = { value: new THREE.Vector4(cell, mottle, mottleAmt, pores) };
  mat.defines = { ...(mat.defines || {}), [`SG_${kind.toUpperCase()}`]: '' };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    shader.uniforms.uSg0 = mat.userData.sgU0; shader.uniforms.uSg1 = mat.userData.sgU1;
    shader.vertexShader = 'varying vec3 vSgPos;\n' + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
  vSgPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`);
    let fs = shader.fragmentShader;
    fs = PROC_GLSL + fs;
    fs = fs.replace('void main() {', `void main() {
  vec3 sgP = vSgPos;
  float sgHgt = 0.0; float sgAlb = 1.0; float sgRgh = 0.0; vec3 sgTilt = vec3( 0.0 );
  {
    float n1 = sgF( sgP / uSg0.x );
    float mot = sgF( sgP / uSg1.y + 7.1 ) - 0.5;
#if defined( SG_STIPPLE )
    sgHgt = n1 * uSg0.y; sgAlb = 1.0 + ( n1 - 0.5 ) * uSg0.z + mot * uSg1.z; sgRgh = ( n1 - 0.5 ) * uSg0.w;
#elif defined( SG_CAST )
    float n2 = sgN( sgP / ( uSg0.x * 0.45 ) + 3.3 );
    sgHgt = ( n1 * 0.7 + n2 * 0.3 ) * uSg0.y; sgAlb = 1.0 + ( n1 - 0.5 ) * uSg0.z + mot * uSg1.z; sgRgh = ( n1 - 0.5 ) * uSg0.w;
#elif defined( SG_GALV )
    vec3 v = sgVor( sgP / uSg1.x );
    // every spangle crystal is a facet with its own tilt (normal perturbed per cell, below),
    // brightness and gloss; grain boundaries a hair darker; dull grey alloy mottling on top
    sgHgt = n1 * uSg0.x * 0.02;
    sgAlb = 1.0 + ( v.x - 0.5 ) * uSg0.z - ( 1.0 - smoothstep( 0.0, 0.05, v.z ) ) * 0.05 + mot * uSg1.z;
    sgRgh = ( fract( v.x * 7.31 ) - 0.5 ) * uSg0.w + max( mot, 0.0 ) * 0.4;
    sgTilt = sgCellDir * uSg0.y;
#elif defined( SG_CONCRETE )
    vec3 v = sgVor( sgP / uSg1.x );
    float pore = ( 1.0 - smoothstep( 0.1, 0.22, v.y ) ) * step( 0.82, v.x );
    float sand = sgN( sgP / ( uSg0.x * 0.35 ) + 1.7 );
    sgHgt = ( n1 * 0.6 + sand * 0.4 ) * uSg0.y - pore * uSg0.y * 3.0;
    sgAlb = 1.0 + ( n1 - 0.5 ) * uSg0.z + ( sand - 0.5 ) * uSg0.z * 0.6 + mot * uSg1.z - pore * uSg1.w;
    sgRgh = ( sand - 0.5 ) * uSg0.w + pore * 0.1;
#endif
  }`);
    fs = fs.replace('#include <color_fragment>', `#include <color_fragment>
  diffuseColor.rgb *= max( sgAlb, 0.0 );`);
    fs = fs.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = clamp( roughnessFactor + sgRgh, 0.04, 1.0 );`);
    fs = fs.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {
    // bump from the world-space height (surface gradient, Mikkelsen 2010)
    vec3 sgSx = dFdx( - vViewPosition ), sgSy = dFdy( - vViewPosition );
    vec2 sgD = vec2( dFdx( sgHgt ), dFdy( sgHgt ) );
    vec3 sgR1 = cross( sgSy, normal ), sgR2 = cross( normal, sgSx );
    float sgDet = dot( sgSx, sgR1 ) * faceDirection;
    vec3 sgGrad = sign( sgDet ) * ( sgD.x * sgR1 + sgD.y * sgR2 );
    normal = normalize( abs( sgDet ) * normal - sgGrad );
    // per-facet tilt (world -> view), no derivative spikes at facet borders
    vec3 sgT = ( viewMatrix * vec4( sgTilt, 0.0 ) ).xyz;
    normal = normalize( normal + sgT - normal * dot( sgT, normal ) );
  }`);
    shader.fragmentShader = fs;
  };
  const k0 = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => `sg:${kind}:${k0()}`;
  mat.needsUpdate = true;
  return mat;
}

// moulded plastic / rubber with a fine seam-free stipple (replaces stippleNormal's swirl)
export function moulded(color = '#161616', { rough = 0.5, spec = 0.5, clearcoat = 0, sheen = 0, scale = 0.0009, bump = 0.000012, name = 'moulded' } = {}) {
  return cached(`sg-moulded:${color}:${rough}:${spec}:${clearcoat}:${sheen}:${scale}:${bump}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, specularIntensity: spec, clearcoat, clearcoatRoughness: 0.35, side: THREE.DoubleSide,
    sheen, sheenRoughness: 0.6, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.2), name: `${name} ${color}`,
  }), { kind: 'stipple', scale, bump, albedo: 0.05, rough: 0.08 }));
}

// rubber tyre / soft PVC
export function rubberSG(color = '#151515', { rough = 0.7 } = {}) {
  return cached(`sg-rubber:${color}:${rough}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, specularIntensity: 0.45, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color('#4a4a4c'), side: THREE.DoubleSide, name: `rubber ${color}`,
  }), { kind: 'stipple', scale: 0.0006, bump: 0.000008, albedo: 0.06, rough: 0.08 }));
}

// powder coated steel (black): fine orange peel
export function powderSG(color = '#1C1D1F', { rough = 0.42 } = {}) {
  return cached(`sg-powder:${color}:${rough}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.32, specularIntensity: 0.5, name: `powder ${color}`,
  }), { kind: 'stipple', scale: 0.0012, bump: 0.000012, albedo: 0.03, rough: 0.05 }));
}

// anodised / mill-finish aluminium extrusion (uv-free: fine grain only)
export function aluSG({ tone = '#C9CDD1', rough = 0.32 } = {}) {
  return cached(`sg-alu:${tone}:${rough}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color: tone, metalness: 1, roughness: rough, name: 'aluminium sg',
  }), { kind: 'stipple', scale: 0.0007, bump: 0.000004, albedo: 0.02, rough: 0.05 }));
}

// sand-cast aluminium / cast iron
export function castSG(tone = '#A3A8AD', { metal = 1, rough = 0.5 } = {}) {
  return cached(`sg-cast:${tone}:${metal}:${rough}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color: tone, metalness: metal, roughness: rough, specularIntensity: 0.5, side: THREE.DoubleSide, name: 'cast sg',
  }), { kind: 'cast', scale: 0.0011, bump: 0.000035, albedo: 0.08, rough: 0.12, mottle: 0.03, mottleAmt: 0.06 }));
}

// hot-dip galvanised steel: spangle crystals ~4-9 mm, dull matte grey, faint mottling.
// Pre-galvanised (sendzimir) tube: smaller, fainter crystals, brighter satin (pre: true).
export function galvSG({ tone = '#B6BBBF', cell = 0.0055, dull = 0.35, pre = false } = {}) {
  return cached(`sg-galv:${tone}:${cell}:${dull}:${pre}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color: tone, metalness: 0.92, roughness: dull, side: THREE.DoubleSide, name: pre ? 'sendzimir galvanised' : 'hot-dip galvanised',
  }), pre
    ? { kind: 'galv', scale: 0.0012, bump: 0.025, albedo: 0.05, rough: 0.06, cell, mottle: 0.05, mottleAmt: 0.05 }
    : { kind: 'galv', scale: 0.0015, bump: 0.05, albedo: 0.09, rough: 0.1, cell, mottle: 0.035, mottleAmt: 0.08 }));
}

// zinc-plated steel (bolts, axle caps, eyelets): bright, bluish satin
export function zincSG({ rough = 0.26 } = {}) {
  return cached(`sg-zinc:${rough}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color: '#CDD2D7', metalness: 1, roughness: rough, side: THREE.DoubleSide, name: 'zinc sg',
  }), { kind: 'stipple', scale: 0.0005, bump: 0.000003, albedo: 0.03, rough: 0.05 }));
}

// cast concrete: fine sand grain, subtle laitance mottling, sparse small blowholes
export function concreteSG({ tone = '#A9A7A1' } = {}) {
  return cached(`sg-concrete:${tone}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color: tone, metalness: 0, roughness: 0.9, specularIntensity: 0.3, name: 'concrete sg',
  }), { kind: 'concrete', scale: 0.0016, bump: 0.00014, albedo: 0.12, rough: 0.06, cell: 0.009, mottle: 0.08, mottleAmt: 0.16, pores: 0.5 }));
}

// ---------------------------------------------------------------------------------------
// textile materials

// basket-weave normal (600D: 2+2 yarn groups) built on a seamless lattice
function basketNormal() {
  return cached('sg-basket', () => {
    const S = 256, threads = 16; // 16 yarns per tile; tile = 16 x 0.62 mm ~ 1 cm
    const cell = S / threads;
    const R = rng(97);
    const jit = new Float32Array(threads * threads); for (let i = 0; i < jit.length; i++) jit[i] = 0.8 + 0.4 * R();
    const H = new Float32Array(S * S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
      // basket weave: pairs of yarns go over/under together
      const over = ((i >> 1) + (j >> 1)) % 2 === 0;
      const pw = Math.sqrt(Math.max(0, 1 - (2 * fx - 1) ** 2)), pf = Math.sqrt(Math.max(0, 1 - (2 * fy - 1) ** 2));
      const a = jit[(j % threads) * threads + (i % threads)];
      const hw = (over ? 1 : 0.35) * pw * a, hf = (over ? 0.35 : 1) * pf * a;
      H[y * S + x] = Math.max(hw, hf);
    }
    // soften (coating)
    const T = new Float32Array(S * S);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let s = 0; for (let k = -1; k <= 1; k++) s += H[y * S + ((x + k + S) % S)]; T[y * S + x] = s / 3;
      }
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let s = 0; for (let k = -1; k <= 1; k++) s += T[((y + k + S) % S) * S + x]; H[y * S + x] = s / 3;
      }
    }
    const out = new Uint8Array(S * S * 4);
    const st = 2.2;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (H[y * S + (x + 1) % S] - H[y * S + (x - 1 + S) % S]) * st, dy = (H[((y + 1) % S) * S + x] - H[((y - 1 + S) % S) * S + x]) * st;
      const l = Math.hypot(dx, dy, 1), k = (y * S + x) * 4;
      out[k] = (-dx / l * 0.5 + 0.5) * 255; out[k + 1] = (-dy / l * 0.5 + 0.5) * 255; out[k + 2] = (1 / l * 0.5 + 0.5) * 255; out[k + 3] = 255;
    }
    const t = new THREE.DataTexture(out, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  });
}
export const BASKET_TILE = 0.0099; // m per basketNormal tile

// 600D polyester oxford with PU/PVC backing. Black reads as a deep charcoal with a soft,
// dye-tinted fibre sheen and a gentle gloss (not a dead matte block, not plastic).
export function fabric600(color = '#1A1B1D', { sheen = 0.7, rough = 0.58, env = null, tone = 1 } = {}) {
  const hex = M.resolveColor(color, '#1A1B1D');
  return cached(`sg-600d:${hex}:${sheen}:${rough}:${env}:${tone}`, () => {
    const c = new THREE.Color(hex).multiplyScalar(tone);
    const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const dark = L < 0.05;
    const m = new THREE.MeshPhysicalMaterial({
      color: c, roughness: rough, metalness: 0, specularIntensity: dark ? 0.55 : 0.4,
      sheen, sheenRoughness: 0.42, sheenColor: dark ? new THREE.Color('#5a5c61') : c.clone().lerp(new THREE.Color('#ffffff'), 0.3),
      normalMap: basketNormal().clone(), normalScale: new THREE.Vector2(0.9, 0.9), side: THREE.DoubleSide, name: `600D ${hex}`,
    });
    m.normalMap.repeat.set(1 / BASKET_TILE, 1 / BASKET_TILE); m.normalMap.needsUpdate = true;
    m.userData = {
      envSpec: env ?? (dark ? 0.42 : 0.25),
      weave: { repeats: 8, boost: 1.4, roughVar: 0.3, matte: 0.06 },
      macro: { tex: 'fabricMacro', scale: BASKET_TILE, strength: dark ? 0.55 : 0.4, coat: 0.5, rough: 0.25 },
    };
    return m;
  });
}

// sewing thread (bonded polyester): a hair lighter than dark cloth so a row of stitches
// reads as a fine beaded line, tone-on-tone on light cloth
export function thread(color = '#2E2F33', { sheen = 0.8 } = {}) {
  return cached(`sg-thread:${color}:${sheen}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.48, specularIntensity: 0.5, sheen, sheenRoughness: 0.35, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.25), side: THREE.DoubleSide, name: `thread ${color}` });
    m.userData.envSpec = 0.35;
    return m;
  });
}

// hook tape: dense moulded nylon hooks -> matte, bristly, faint glints; loop tape: fuzzy, flat
export function hookTape(color = '#18191A') {
  return cached(`sg-hook:${color}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color, roughness: 0.82, metalness: 0, specularIntensity: 0.6, sheen: 0.5, sheenRoughness: 0.8, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.3), side: THREE.DoubleSide, name: `hook tape ${color}`,
  }), { kind: 'stipple', scale: 0.0005, bump: 0.00004, albedo: 0.22, rough: 0.12 }));
}
export function loopTape(color = '#18191A') {
  return cached(`sg-loop:${color}`, () => procSurface(new THREE.MeshPhysicalMaterial({
    color, roughness: 0.95, metalness: 0, specularIntensity: 0.2, sheen: 1, sheenRoughness: 0.75, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.25), side: THREE.DoubleSide, name: `loop tape ${color}`,
  }), { kind: 'stipple', scale: 0.0009, bump: 0.00003, albedo: 0.15, rough: 0.05 }));
}

// PVC tarpaulin (650 g/m²: water bags, gutters): a glossy coated skin over a coarse
// polyester scrim whose weave shows through faintly; the coating carries soft cockles.
export function pvcTarp(color = '#151617', { gloss = 0.32, weave = 0.35 } = {}) {
  const hex = M.resolveColor(color, '#151617');
  return cached(`sg-tarp:${hex}:${gloss}:${weave}`, () => {
    const c = new THREE.Color(hex);
    const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    if (L > 0.8) c.multiplyScalar(0.84 / L);
    const m = new THREE.MeshPhysicalMaterial({
      color: c, roughness: gloss, metalness: 0, specularIntensity: 0.65, clearcoat: 0.35, clearcoatRoughness: gloss * 0.8,
      normalMap: TX.plainWeaveNormal().clone(), normalScale: new THREE.Vector2(weave, weave), side: THREE.DoubleSide, name: `pvc tarp ${hex}`,
    });
    m.normalMap.repeat.set(1 / 0.032 / 1.6, 1 / 0.032 / 1.6); m.normalMap.needsUpdate = true; // coarse 1.6 mm scrim
    m.userData = {
      envSpec: L < 0.1 ? 0.55 : 0.4,
      weave: { repeats: 16, boost: 1.5, roughVar: 0.2, matte: 0.03 },
      macro: { tex: 'coatingMacro', scale: 0.032 * 1.6, strength: 0.6, coat: 0.8, rough: 0.2 },
    };
    return m;
  });
}

// ---------------------------------------------------------------------------------------
// crease field: sum of tapered ridges/valleys in a 2D surface coordinate system (m)

// families: [{ n, u: [u0, u1], v: [v0, v1], ang (rad, 0 = along u), angJ, len: [a, b],
//              wid: [a, b], amp: [a, b] (signed ok), sharp (0 round .. 1 sharp), skew (taper
//              towards the +end, 0 symmetric), sign (1 ridges, -1 valleys, 0 mixed) }]
// periodU: wrap u (closed perimeter). Returns f(u, v) -> displacement (m).
export function creases(seed, families, { periodU = 0 } = {}) {
  const R = rng(seed);
  const list = [];
  for (const F of families) {
    for (let i = 0; i < F.n; i++) {
      const rr = (a) => (Array.isArray(a) ? a[0] + (a[1] - a[0]) * R() : a);
      const ang = (F.ang ?? 0) + (R() * 2 - 1) * (F.angJ ?? 0);
      const sgn = F.sign === 1 ? 1 : F.sign === -1 ? -1 : (R() < 0.5 ? -1 : 1);
      list.push({ u: rr(F.u), v: rr(F.v), c: Math.cos(ang), s: Math.sin(ang), hl: rr(F.len) / 2, hw: rr(F.wid) / 2, A: rr(F.amp) * sgn, sharp: F.sharp ?? 0.3, skew: F.skew ?? 0, mask: F.mask || null });
    }
  }
  return (u, v) => {
    let sum = 0;
    for (const k of list) {
      let du = u - k.u;
      if (periodU) { du = ((du % periodU) + periodU * 1.5) % periodU - periodU / 2; }
      const dv = v - k.v;
      const al = du * k.c + dv * k.s;
      if (al < -k.hl || al > k.hl) continue;
      const ac = -du * k.s + dv * k.c;
      const tt = (al / k.hl + 1) / 2; // 0..1 along
      const wTaper = k.skew ? (1 - k.skew * tt) : 1;
      const w = k.hw * Math.max(0.15, wTaper);
      const x = Math.abs(ac) / w;
      if (x > 3) continue;
      const env = Math.pow(Math.sin(Math.PI * tt), 0.7) * (k.skew ? Math.pow(1 - tt * 0.85 * Math.sign(k.skew), 1) : 1);
      const round = Math.exp(-2.2 * x * x), sharp = x < 1 ? (1 - x) * (1 - x) : 0;
      let val = k.A * env * (round * (1 - k.sharp) + sharp * k.sharp);
      if (k.mask) val *= k.mask(u, v);
      sum += val;
    }
    return sum;
  };
}

// ---------------------------------------------------------------------------------------
// stitches along a path on a surface: pts[i], nrm[i] (surface normals). Each stitch is a
// raised pillow of thread `len` long with a `gap` (needle hole) between stitches.
export function stitches(pts, nrm, { len = 0.0036, gap = 0.0016, w = 0.0011, h = 0.0006, lift = 0.0002, start = 0.002, end = 0.002 } = {}) {
  const n = pts.length;
  if (n < 2) return null;
  const S = [0];
  for (let i = 1; i < n; i++) S.push(S[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = S[n - 1];
  let seg = 0;
  const sample = (s) => {
    while (seg < n - 2 && S[seg + 1] < s) seg++;
    while (seg > 0 && S[seg] > s) seg--;
    const t = (s - S[seg]) / Math.max(1e-9, S[seg + 1] - S[seg]);
    const p = pts[seg].clone().lerp(pts[seg + 1], t);
    const nn = nrm[seg].clone().lerp(nrm[seg + 1], t).normalize();
    const T = pts[seg + 1].clone().sub(pts[seg]).normalize();
    return { p, n: nn, T };
  };
  const pos = [], idx = [];
  const NA = 4; // segments along a stitch
  for (let s0 = start; s0 + len <= total - end; s0 += len + gap) {
    const base = pos.length / 3;
    for (let a = 0; a <= NA; a++) {
      const q = sample(s0 + (a / NA) * len);
      const B = V3().crossVectors(q.T, q.n).normalize();
      const bump = Math.sin(Math.PI * (a / NA));
      const hh = lift + h * Math.pow(bump, 0.6);
      const ww = w * 0.5 * (0.55 + 0.45 * bump);
      const c = q.p.clone().addScaledVector(q.n, lift * 0.5);
      // cross-section: left edge, crown, right edge
      const L = c.clone().addScaledVector(B, -ww);
      const C = q.p.clone().addScaledVector(q.n, hh);
      const Rr = c.clone().addScaledVector(B, ww);
      pos.push(L.x, L.y, L.z, C.x, C.y, C.z, Rr.x, Rr.y, Rr.z);
    }
    for (let a = 0; a < NA; a++) {
      const r0 = base + a * 3, r1 = r0 + 3;
      idx.push(r0, r1, r0 + 1, r0 + 1, r1, r1 + 1, r0 + 1, r1 + 1, r0 + 2, r0 + 2, r1 + 1, r1 + 2);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// polyline resample at a fixed spacing (keeps ends)
export function resample(pts, step) {
  const out = [pts[0].clone()];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1].clone(); const b = pts[i];
    let d = a.distanceTo(b);
    while (acc + d >= step) {
      const t = (step - acc) / d;
      a = a.clone().lerp(b, t); out.push(a.clone());
      d = a.distanceTo(b); acc = 0;
    }
    acc += d;
  }
  if (out[out.length - 1].distanceTo(pts[pts.length - 1]) > step * 0.3) out.push(pts[pts.length - 1].clone());
  return out;
}

// ---------------------------------------------------------------------------------------
// softBox: sewn bag body standing along +Y. Cross-section W x D (rounded rect, radius r),
// body wall from y0 to y0 + L, rounded panel edges of radius re into flat end panels.
// Surface coordinates: f = perimeter fraction (0 = middle of the +Z face, running towards
// +X), m = meridian arc length from the bottom centre over the edge, up the wall, over the
// top edge to the top centre. t = (m - mWall0) / L is 0..1 on the wall, < 0 / > 1 on the
// bottom / top (edge + panel).
// disp(info) -> offset along the base normal; info = { f, s (perimeter m), m, t, y, part
// ('bot','botEdge','wall','topEdge','top'), face (1 mid-face .. 0 corner), x, z, nx, nz }.
// warp(p) -> p' optional global deformation (slump), applied last.
export function softBox({ W, D, L, r = 0.04, re = 0.03, y0 = 0, nu = 160, nWall = 140, nEdge = 7, nEnd = 9, disp = null, warp = null, topInset = 0, botInset = 0 } = {}) {
  const a = W / 2, b = D / 2;
  const frac = K.rrFractions(a, b, r), P = frac.P;
  const inner = Math.min(a, b) - re - 0.003;
  const eArc = (Math.PI / 2) * re;
  const mBot = inner, mWall0 = inner + eArc, mWall1 = mWall0 + L, mTop0 = mWall1 + eArc, mEnd = mTop0 + inner;
  // base point at (f, m)
  const base = (f, m) => {
    let part, d, y, ny;
    if (m <= mBot) { part = 'bot'; d = re + (mBot - m); y = y0 - re; ny = -1; }
    else if (m <= mWall0) { part = 'botEdge'; const th = ((m - mBot) / eArc) * (Math.PI / 2); d = re - re * Math.sin(th); y = y0 - re * Math.cos(th); ny = -Math.cos(th); }
    else if (m <= mWall1) { part = 'wall'; d = 0; y = y0 + (m - mWall0); ny = 0; }
    else if (m <= mTop0) { part = 'topEdge'; const th = ((m - mWall1) / eArc) * (Math.PI / 2); d = re - re * Math.cos(th); y = y0 + L + re * Math.sin(th); ny = Math.sin(th); }
    else { part = 'top'; d = re + (m - mTop0); y = y0 + L + re; ny = 1; }
    const q = K.rrPoint(f, Math.max(1e-3, a - d), Math.max(1e-3, b - d), Math.max(1e-4, r - Math.min(d, r) * 0.6));
    const hz = Math.sqrt(Math.max(0, 1 - ny * ny));
    const n = V3(q.nx * hz, ny, q.nz * hz).normalize();
    const p = V3(q.x, y, q.z);
    const face = K.rrPoint(f, a, b, r).face;
    return { p, n, part, face, x: q.x, z: q.z, nx: q.nx, nz: q.nz };
  };
  const full = (f, m) => {
    const B = base(f, m);
    let o = 0;
    if (disp) o = disp({ f, s: (((f % 1) + 1) % 1) * P, m, t: B.part === 'wall' ? Math.min(1, Math.max(0, (m - mWall0) / L)) : (m - mWall0) / L, y: B.p.y, part: B.part, face: B.face, x: B.x, z: B.z, nx: B.nx, nz: B.nz });
    const p = B.p.addScaledVector(B.n, o);
    return warp ? warp(p) : p;
  };
  // meridian samples: denser on the edges
  const ms = [];
  for (let k = 0; k <= nEnd; k++) ms.push((k / nEnd) * mBot);
  for (let k = 1; k <= nEdge; k++) ms.push(mBot + (k / nEdge) * eArc);
  for (let k = 1; k <= nWall; k++) ms.push(mWall0 + (k / nWall) * L);
  for (let k = 1; k <= nEdge; k++) ms.push(mWall1 + (k / nEdge) * eArc);
  for (let k = 1; k <= nEnd; k++) ms.push(mTop0 + (k / nEnd) * inner);
  ms[0] = 0.0005;
  ms[ms.length - 1] = mEnd - 0.0005;
  const rows = ms.map((m) => { const row = []; for (let i = 0; i < nu; i++) row.push(full(i / nu, m)); return row; });
  const geo = K.gridGeometry(rows, { closedU: true, flip: false, uvRows: ms });
  // uv u: perimeter metres (gridGeometry measured it), v: meridian metres
  const pointM = (f, m, lift = 0) => {
    const e = 0.0015;
    const p = full(f, m);
    const pu = full(f + e / P, m).sub(full(f - e / P, m));
    const pv = full(f, Math.min(mEnd - 1e-4, m + e)).sub(full(f, Math.max(1e-4, m - e)));
    const n = V3().crossVectors(pu, pv).normalize();
    const Bn = base(f, m).n;
    if (n.dot(Bn) < 0) n.negate();
    return { p: p.addScaledVector(n, lift), n };
  };
  const point = (f, t, lift = 0) => pointM(f, mWall0 + t * L, lift);
  return { geo, point, pointM, frac, P, L, a, b, r, re, y0, mBot, mWall0, mWall1, mTop0, mEnd, base, full };
}

// a path on a softBox given (f, t) samples -> { pts, nrm }
export function pathOn(box, ft, lift = 0) {
  const pts = [], nrm = [];
  for (const [f, t] of ft) { const q = box.point(((f % 1) + 1) % 1, t, lift); pts.push(q.p); nrm.push(q.n); }
  return { pts, nrm };
}

// ---------------------------------------------------------------------------------------
// invisible framing proxy: a degenerate mesh (no area -> no exposure weight) on layer 5,
// which no render or shadow pass draws; camera.collectPoints sees its vertices.
export function frameProxy(min, max) {
  const pos = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) pos.push(x, y, z);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([0, 0, 0]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff00ff }));
  m.layers.set(5); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false;
  m.userData.frameProxy = true;
  return m;
}
// mark every mesh of an object as not framing (camera ignores it)
export function noFrame(obj) { obj.traverse((o) => { if (o.isMesh) o.userData.noFrame = true; }); return obj; }

// ---------------------------------------------------------------------------------------
// small helpers
export function seededNoise(seed) { return makeNoise2(seed); }
export function ftPath(n, fn) { const out = []; for (let k = 0; k <= n; k++) out.push(fn(k / n)); return out; }

// ---------------------------------------------------------------------------------------
// rollStrip: a coated-cloth strip rolled up loosely, sitting on the floor, its free end
// coming off the top of the roll, draping down in front of it and lying flat towards +Z
// (top face = the face carrying the hook tape: outward on the roll, up on the floor).
// The roll's layers stack on the thicker edge bands (cloth + hook tape), so the middle of
// each turn sags in a little; turns telescope a few mm sideways, the roll is a touch
// flattened by its weight. section(w, a, tt) -> [x, offsetAlongNormal] shapes the cross-
// section of the lying part (tt = 0 where it leaves the drape .. 1 at the free end).
// Returns { geo, at(w, a, lift) -> {p, n}, aTail (end of the flat part), aRoll (start of
// the roll), aEnd, Rout, zf (where the strip meets the floor), turn (length of one turn) }.
export function rollStrip({ W = 0.3, Ltot = 3, T = 1.0, tc = 0.0007, te = 0.0026, eb = 0.03, core = 0.022, flatten = 0.94, section = null, seed = 1, wave = 0.0018, nw = 56, psi0 = 64 * Math.PI / 180, curl = 0, foldAmp = 0.003, humps = null, meander = 0 } = {}) {
  const nz = makeNoise2(seed);
  const pitch = tc + te;
  // drape length depends on the roll radius: iterate
  let Ld = 0.12, Lr = 0, Rout = 0, Rc = 0, bez = null;
  for (let it = 0; it < 3; it++) {
    Lr = Ltot - T - Ld;
    Rout = Math.sqrt(core * core + (pitch * Lr) / Math.PI);
    Rc = Rout * flatten + tc;
    const P0 = new THREE.Vector2(Rout * Math.cos(psi0), Rc + Rout * Math.sin(psi0) * flatten);
    const t0 = new THREE.Vector2(Math.sin(psi0), -Math.cos(psi0) * flatten).normalize();
    const Pf = new THREE.Vector2(P0.x + Rout * 1.15 + 0.02, tc / 2 + 0.0008);
    const h = P0.distanceTo(Pf) * 0.42;
    bez = new THREE.CubicBezierCurve(P0, P0.clone().addScaledVector(t0, h), Pf.clone().add(new THREE.Vector2(-h, 0)), Pf);
    Ld = bez.getLength();
  }
  const zf = bez.v3.x;
  // centreline samples from the free end (a = 0) into the roll: {z, y}
  const S = [];
  const nT = Math.ceil(T / 0.008);
  for (let i = 0; i <= nT; i++) S.push({ z: zf + T * (1 - i / nT), y: tc / 2 + 0.0008, part: 0 });
  const nD = Math.ceil(Ld / 0.004);
  const dp = bez.getSpacedPoints(nD).reverse(); // from the floor point up to the roll
  for (let i = 1; i <= nD; i++) S.push({ z: dp[i].x, y: dp[i].y, part: 1 });
  const nR = Math.ceil(Lr / 0.0045);
  for (let i = 1; i <= nR; i++) {
    const s = (i / nR) * Lr;
    const r = Math.sqrt(Math.max(core * core * 0.9, Rout * Rout - (pitch * s) / Math.PI));
    const psi = psi0 + ((Rout - r) * TAU) / pitch;
    S.push({ z: r * Math.cos(psi), y: Rc + r * Math.sin(psi) * flatten, part: 2 });
  }
  let acc = 0;
  for (let i = 0; i < S.length; i++) { if (i) acc += Math.hypot(S[i].z - S[i - 1].z, S[i].y - S[i - 1].y); S[i].a = acc; }
  // tangent (towards the roll) and top-face normal n = (dy, -dz) in (z, y)
  for (let i = 0; i < S.length; i++) {
    const A = S[Math.max(0, i - 1)], B = S[Math.min(S.length - 1, i + 1)];
    let dz = B.z - A.z, dy = B.y - A.y; const l = Math.hypot(dz, dy) || 1; dz /= l; dy /= l;
    S[i].nz = dy; S[i].ny = -dz;
  }
  const aTail = T, aRoll = T + Ld, aEnd = acc;
  const edge = (w) => sstep(W / 2 - eb - 0.006, W / 2 - eb + 0.004, Math.abs(w));
  // packing folds across the strip (shallow ridges with a crisp crest, slightly skewed) and a
  // few soft lengthwise undulations of cloth relaxing on the floor
  const FR = rng(seed * 13 + 1);
  const fl = [];
  for (let a = 0.12 + FR() * 0.1; a < T + Ld; a += 0.24 + FR() * 0.16) fl.push({ a, sk: (FR() - 0.5) * 0.5, amp: 0.0016 + FR() * 0.0026, wd: 0.012 + FR() * 0.014 });
  const folds = (w, a) => {
    let v = 0;
    for (const f of fl) { const d = (a - f.a - w * f.sk) / f.wd; if (Math.abs(d) < 3) { const x = Math.abs(d); v += f.amp * (x < 1 ? 1 - x * x * (0.6 + 0.4 * x) : 0) + f.amp * 0.25 * Math.exp(-x * x); } }
    v += 0.0018 * (0.5 + 0.5 * nz.fbm(a * 3.1 + 5.5, w * 9 + 2.2, 2));
    return v * foldAmp / 0.003;
  };
  const turnLen = TAU * Rout;
  const tele = (a) => (a > aRoll ? 0.0016 * nz.noise((a - aRoll) / turnLen * 1.0 + 3.3, 7.1) : 0);
  const pos = (w, q) => {
    const tt = q.part === 0 ? 1 - q.a / T : 0;
    let lx = w, off = 0;
    if (section && q.part === 0) { const o = section(w, q.a, Math.max(0, Math.min(1, tt))); lx = o[0]; off = o[1]; }
    // on the roll the thin middle of each turn sags in between the thick edges
    if (q.part === 2) off -= te * 0.75 * (1 - edge(w)) * sstep(0, 0.05, q.a - aRoll);
    if (q.part !== 2) off += folds(w, q.a);
    if (q.part === 1) off -= te * 0.4 * (1 - edge(w)) * sstep(0, 1, (q.a - aTail) / Math.max(1e-6, aRoll - aTail));
    let y = q.y + off * q.ny, z = q.z + off * q.nz;
    if (q.part === 0) {
      y += wave * (0.55 + 0.45 * nz.fbm(q.a * 2.5 + 1.3, w * 3 + 0.7, 2));
      // memory of the roll: the free end curls up a little
      if (curl && q.a < 0.16) { const u = 1 - q.a / 0.16; y += curl * u * u; z += curl * 0.35 * u * u * u; }
      // soft ripples where the cloth has not settled flat (lifts off the floor, skewed across)
      if (humps) for (const [ha, hh, hw, sk] of humps) { const d = (q.a - ha - w * sk) / hw; if (Math.abs(d) < 2.5) y += hh * Math.exp(-d * d * 1.6); }
    }
    const mx = q.part === 0 ? meander * Math.sin((q.a / T) * Math.PI * 1.2 + 0.4) * Math.min(1, (T - q.a) / 0.15) : 0;
    return V3(lx + tele(q.a) + mx, y, z);
  };
  const lerpS = (a) => {
    let lo = 0, hi = S.length - 1;
    if (a <= 0) hi = 1; else if (a >= S[hi].a) lo = hi - 1;
    else while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid].a <= a) lo = mid; else hi = mid; }
    const A = S[lo], B = S[hi]; const f = Math.min(1, Math.max(0, (a - A.a) / Math.max(1e-9, B.a - A.a)));
    const nzv = A.nz + (B.nz - A.nz) * f, nyv = A.ny + (B.ny - A.ny) * f; const nl = Math.hypot(nzv, nyv) || 1;
    return { z: A.z + (B.z - A.z) * f, y: A.y + (B.y - A.y) * f, nz: nzv / nl, ny: nyv / nl, a, part: f < 0.5 ? A.part : B.part };
  };
  const rows = [];
  const ws = [];
  for (let j = 0; j <= nw; j++) {
    // denser near the edges (hook tape, hem)
    const u = j / nw; const w = (W / 2) * Math.sign(u - 0.5) * Math.pow(Math.abs(2 * u - 1), 0.85);
    ws.push(w);
    rows.push(S.map((q) => pos(w, q)));
  }
  const geo = K.gridGeometry(rows, { closedU: false, flip: true });
  const uv = geo.attributes.uv, cols = S.length;
  for (let j = 0; j <= nw; j++) for (let i = 0; i < cols; i++) uv.setXY(j * cols + i, S[i].a, ws[j] + W / 2);
  const at = (w, a, lift = 0) => {
    const e = 0.002;
    const p = pos(w, lerpS(a));
    const pa = pos(w, lerpS(a + e)).sub(pos(w, lerpS(Math.max(0, a - e))));
    const pw = pos(w + e, lerpS(a)).sub(pos(w - e, lerpS(a)));
    const n = V3().crossVectors(pa, pw).normalize();
    const ref = lerpS(a);
    if (n.y * ref.ny + n.z * ref.nz < 0) n.negate();
    return { p: p.addScaledVector(n, lift), n };
  };
  return { geo, at, aTail, aRoll, aEnd, Rout, Rc, zf, turn: turnLen, W };
}

// Packshot of a rolled strip (verbindingsstrook / regengoot): roll + drape + lying end, hook
// tape stitched along both long edges (two stitch rows each), hemmed / welded edges, a welded
// end hem. kind 'gutter' opens the lying end into a trough (flat bottom, steep walls, flanges
// carrying the hook tape).
export function stripPackshot({ kind = 'strip', L = 3, W = 0.3, cloth, hook, thr, T = 1.0, tapeW = 0.03, seed = 5, rot = 70, curl = 0, humps = null, meander = 0 }) {
  const bins = new G.PartBin();
  let section = null;
  if (kind === 'gutter') {
    // cross-section by arc length: angle profile theta(|w|), integrated
    const N = 400, half = W / 2;
    const th = (u) => {
      const d = 58 * Math.PI / 180, fl = 14 * Math.PI / 180;
      if (u < 0.022) return 0;
      if (u < 0.07) return d * sstep(0.022, 0.07, u);
      if (u < 0.112) return d;
      if (u < 0.142) return d + (fl - d) * sstep(0.112, 0.142, u);
      return fl;
    };
    const X = [0], Y = [0];
    for (let i = 1; i <= N; i++) { const u = (i / N) * half, t = th(u - half / N / 2); X.push(X[i - 1] + Math.cos(t) * half / N); Y.push(Y[i - 1] + Math.sin(t) * half / N); }
    const xs = (u) => { const f = Math.min(N, (Math.abs(u) / half) * N); const i = Math.floor(f), g = f - i; const j = Math.min(N, i + 1); return [X[i] + (X[j] - X[i]) * g, Y[i] + (Y[j] - Y[i]) * g]; };
    section = (w, a, tt) => {
      const k = sstep(0.0, 0.42, tt);
      const [x, y] = xs(w);
      return [w + (Math.sign(w) * x - w) * k, y * k];
    };
  }
  const R = rollStrip({ W, Ltot: L, T, section, seed, curl, humps, meander, foldAmp: kind === 'gutter' ? 0.0016 : 0.003, eb: tapeW + 0.004, te: 0.0024, tc: kind === 'gutter' ? 0.0008 : 0.0005, wave: kind === 'gutter' ? 0.0012 : 0.0022 });
  bins.add(cloth, R.geo);
  const aMax = R.aRoll + R.turn * 1.15;
  const along = (w, lift, a0 = 0.004, a1 = aMax, step = 0.005) => {
    const pts = [], nrm = [];
    for (let a = a0; a <= a1; a += step) { const q = R.at(w, a, lift); pts.push(q.p); nrm.push(q.n); }
    return { pts, nrm };
  };
  for (const s of [-1, 1]) {
    const e = s * W / 2;
    // hook tape on the top face along the edge
    const wm = e - s * (0.004 + tapeW / 2);
    const band = along(wm, 0.0012);
    bins.add(hook, K.strapAlong(band.pts, tapeW, 0.0022, { normals: band.nrm }));
    for (const dw of [tapeW / 2 - 0.0028, -(tapeW / 2 - 0.0028)]) {
      const st = along(wm + dw, 0.0026, 0.012, aMax - 0.01, 0.003);
      bins.add(thr, stitches(st.pts, st.nrm, { len: 0.0034, gap: 0.0016, w: 0.0009, h: 0.0004 }));
    }
    // hem: the folded / welded edge, a little thicker, all the way into the roll (spiral at the ends)
    const hem = along(e - s * 0.0012, 0.0002, 0.002, R.aEnd - 0.01, 0.006);
    bins.add(cloth, K.tubeAlong(hem.pts, 0.0011, 6));
  }
  // welded end hem across the free end
  {
    const pts = [], nrm = [];
    for (let k = 0; k <= 80; k++) { const w = -W / 2 + 0.003 + (W - 0.006) * (k / 80); const q = R.at(w, 0.012, 0.0006); pts.push(q.p); nrm.push(q.n); }
    bins.add(cloth, K.strapAlong(pts, 0.022, 0.0012, { normals: nrm }));
    const ed = []; for (let k = 0; k <= 80; k++) { const w = -W / 2 + 0.002 + (W - 0.004) * (k / 80); ed.push(R.at(w, 0.0015, 0.0002).p); }
    bins.add(cloth, K.tubeAlong(ed, 0.0011, 6));
  }
  const g = K.finish(bins, `${kind} ${L}`);
  g.traverse((o) => { if (o.isMesh && o.material === cloth) o.receiveShadow = true; });
  g.rotation.y = rot * Math.PI / 180;
  const root = new THREE.Group(); root.add(g);
  return { object: root, R };
}

// Per-pixel stochastic coverage, stratified over the accumulated frames (like the engine's PVC
// windows): coverage = map alpha * k (or a constant). For clear materials whose visible part
// is a reflection pattern (table protector, foil).
export function stochasticCover(mat, { k = 1, constant = null, salt = 3.3 } = {}) {
  mat.userData.scCov = { value: new THREE.Vector3(k, constant == null ? -1 : constant, salt) };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    shader.uniforms.uFrameSeed = globalUniforms.uFrameSeed;
    shader.uniforms.uScCov = mat.userData.scCov;
    shader.fragmentShader = 'uniform float uFrameSeed; uniform vec3 uScCov;\nfloat scHash( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * 0.1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }\n' + shader.fragmentShader.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
  {
    float cov = uScCov.y >= 0.0 ? uScCov.y : ${mat.map ? 'texture2D( map, vMapUv ).a * uScCov.x' : 'uScCov.x'};
    if ( fract( scHash( floor( gl_FragCoord.xy ) + uScCov.z ) + uFrameSeed * 0.6180339887 ) >= cov ) discard;
  }`);
  };
  const k0 = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => `sc:${!!mat.map}:${k0()}`;
  mat.defines = { ...(mat.defines || {}), SG_STOCH_COVER: '' };
  mat.needsUpdate = true;
  return mat;
}
