// Studio packshot renderer: progressive accumulation on top of three.js WebGL.
//
// Every output image is the average of N frames. Each frame jitters
//   - the camera by a sub-pixel Gaussian offset  -> anti-aliasing,
//   - the key light inside a softbox-sized cone  -> soft, converged shadows,
//   - K "dome" lights over the upper hemisphere  -> ambient occlusion / sky light,
//   - stochastic transparency seeds              -> clean see-through PVC windows.
// The ground is a shadow catcher: it outputs the fraction of light it receives
// relative to an unoccluded floor, and the composite multiplies the configured
// backdrop colour by that ratio. So the backdrop is *exactly* the requested colour
// wherever there is no shadow, and products tone-map independently.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/environments/RoomEnvironment.js';
import { halton, squareToDisk, invNorm, r2 } from './rng.js';
import { setMaxAnisotropy, fabricMacroNormal, coatingMacroNormal } from './textures.js';
import { studioEquirect } from './studioEnv.js';

const DEG = Math.PI / 180;

// --- global shader patches -------------------------------------------------
// Scale only the *diffuse* part of image based lighting: the dome lights carry
// most ambient energy (with occlusion); IBL stays for reflections on metal/gloss.
let patched = false;
export function patchShaderChunks({ envDiffuse = 0.35 } = {}) {
  if (patched) return; patched = true;
  THREE.ShaderChunk.lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.replace(
    'iblIrradiance += getIBLIrradiance( geometryNormal );',
    `iblIrradiance += getIBLIrradiance( geometryNormal ) * ${envDiffuse.toFixed(4)};`);
}

export const globalUniforms = {
  uFrameSeed: { value: 0 },
  uKeyDirW: { value: new THREE.Vector3(0, 1, 0) },
  uKeyE: { value: 1 },
  uDomeE: { value: 1 },
  // Interior of an enclosure (walled tent): rig.interior sets a box (centre x/z, half
  // extents x/z) and a top height. Surfaces inside it that face inwards (wall insides, roof
  // underside) only keep the light that the shadow maps already occlude (key, dome); the
  // unshadowed fill/rim/bounce and the image-based light are scaled by uIntK (1 = off).
  uIntBox: { value: new THREE.Vector4(0, 0, 0, 0) },
  uIntY: { value: new THREE.Vector2(0, 0) },
  uIntK: { value: 1 },
  // openings of the enclosure (rig.interior.openings): light comes in through an open door or a
  // window, so inward faces near an opening keep more of the open-studio light (up to uIntNear.x)
  // than the far corners (uIntK), falling off over uIntNear.y metres. xy = position (x/z),
  // w = weight (0 = unused slot)
  uIntOpen: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, 0)) },
  uIntNear: { value: new THREE.Vector2(1, 1.5) },
  // soft interior ambient (radiance) mirrored by the inward faces: x near an opening, y in the far
  // corners. The inside of a tent is lit by the bright floor and the openings; dark cloth reads
  // only through that sheen (its diffuse is ~1-2 %), so without it the inside is a black void
  uIntAmb: { value: new THREE.Vector2(0, 0) },
};

// three's lights_fragment_begin with an extra factor on the *unshadowed* directional lights
// (fill, rim, bounce) for interior-facing fragments (see uIntK).
function lightsBeginInterior() {
  const src = THREE.ShaderChunk.lights_fragment_begin;
  const tail = '\t\t#endif\n\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 )';
  if (!src.includes(tail)) { console.warn('engine: lights_fragment_begin layout changed, interior term off'); return src; }
  return src.replace(tail, tail.replace('\t\t#endif\n', '\t\t#else\n\t\tdirectLight.color *= intK;\n\t\t#endif\n'));
}

function hookMaterial(mat) {
  if (mat.userData.__hooked) return;
  mat.userData.__hooked = true;
  const stoch = mat.userData.stochasticAlpha;
  // translucency (strength) with optional translKey / translSky: the weights of the key and of the
  // overhead dome in the light arriving at the far side of the sheet (defaults 1, 0.8)
  const transl = mat.userData.translucency;
  const trKey = mat.userData.translKey ?? 1, trSky = mat.userData.translSky ?? 0.8;
  const macro = mat.userData.macro && mat.normalMap ? mat.userData.macro : null;
  const weave = mat.userData.weave && mat.normalMap ? mat.userData.weave : null;
  const envSpec = mat.userData.envSpec;
  // interiorSolid: {k, kNear}: frame parts (truss, bolts, pole) inside a fully walled tent. They
  // are dimmed whatever way they face (a truss facet turned to the camera, seen through a window
  // or the door, mirrors the dark inside of the tent, not the studio): environment light and the
  // unshadowed direct lights x k, up to kNear right by an opening. Positional test only (inside
  // the enclosure box), so the same parts outside an enclosure are untouched
  const solid = mat.userData.interiorSolid || null;
  const interior = !!mat.userData.interior || !!solid;
  // dye: dyed cloth turns deeper and more saturated where little light reaches it (the light
  // that does arrive has mostly bounced off the same dyed cloth); 0 = off
  const dye = mat.userData.dye || 0;
  // sheet: {L, H, c, strength} on alpha-mapped glazing (PVC windows): the reflection of a strip
  // softbox in a taut, slightly wavy foil: one broad soft band through the windows' centre
  // (L x H metres, c = [s, y] of the windows' centre)
  const sheet = mat.userData.sheet && mat.alphaMap ? mat.userData.sheet : null;
  // envFlag: {k, a0, a1}: black flags for bare metal (the photographer's trick for metal): the
  // environment reflection is scaled by k where the reflected ray points to a camera-relative
  // azimuth between a0 and a1 degrees (either side). A hex tube then shows light and dark facets
  // in turn (adjacent facets mirror directions 120 deg apart), whatever its orientation
  const envFlag = mat.userData.envFlag || null;
  if (stoch == null && !transl && !macro && !weave && envSpec == null && !interior && !dye && !sheet && !envFlag) return;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    Object.assign(shader.uniforms, globalUniforms);
    let fs = shader.fragmentShader;
    const head = `uniform float uFrameSeed; uniform vec3 uKeyDirW; uniform float uKeyE; uniform float uDomeE;
uniform vec4 uIntBox; uniform vec2 uIntY; uniform float uIntK; uniform vec4 uIntOpen[ 6 ]; uniform vec2 uIntNear; uniform vec2 uIntAmb;
float stochHash( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * 0.1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
`;
    fs = head + (interior ? 'varying vec3 vIntW;\n' : '') + (weave ? 'uniform vec4 uWeave;\n' : '') + fs;
    if (interior) {
      shader.vertexShader = 'varying vec3 vIntW;\n' + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
  vIntW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`);
    }
    if (stoch != null) {
      fs = fs.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
  // stratified over frames: each pixel walks a golden-ratio sequence from a random start
  if ( fract( stochHash( floor( gl_FragCoord.xy ) ) + uFrameSeed * 0.6180339887 ) > ${Number(stoch).toFixed(4)} ) discard;`);
    }
    if (macro) {
      // Second normal layer (fabric macro structure: yarn streaks, slubs, coating cockle),
      // blended onto the weave normal map; also tilts the clearcoat normal and modulates
      // roughness, so the coating's sheen breaks up like real coated cloth.
      shader.uniforms.tMacro = { value: macro.tex === 'fabricMacro' ? fabricMacroNormal() : macro.tex === 'coatingMacro' ? coatingMacroNormal() : macro.tex };
      shader.uniforms.uMacro = { value: new THREE.Vector4(macro.scale, macro.strength, macro.coat ?? 0.6, macro.rough ?? 0.25) };
      fs = fs.replace('void main() {', `uniform sampler2D tMacro; uniform vec4 uMacro;
void main() {
  vec3 macroS = texture2D( tMacro, vNormalMapUv * uMacro.x ).xyz * 2.0 - 1.0;
  vec2 macroD = macroS.xy * uMacro.y;`);
      fs = fs.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = clamp( roughnessFactor * ( 1.0 + macroS.z * uMacro.w ), 0.04, 1.0 );`);
      fs = fs.replace('#include <clearcoat_normal_fragment_begin>', `#ifdef USE_CLEARCOAT
  vec3 clearcoatNormal = normalize( tbn * vec3( macroD * uMacro.z, 1.0 ) );
#endif`);
    }
    if (macro || weave) {
      // weave: how many weave repeats fall on one pixel decides how much of the yarn relief the
      // camera resolves. Close up (< ~0.5 repeat/px) the relief is boosted and the coating's
      // gloss varies over the yarn crowns and flanks; further away the unresolved relief turns
      // into a slightly rougher, more matte lobe (Toksvig-like), never into aliasing sparkle.
      if (weave) shader.uniforms.uWeave = { value: new THREE.Vector4(weave.repeats ?? 16, weave.boost ?? 1.6, weave.roughVar ?? 0.35, weave.matte ?? 0.05) };
      fs = fs.replace('#include <normal_fragment_maps>', `#ifdef USE_NORMALMAP_TANGENTSPACE
  vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
  ${weave ? `vec2 wvFw = fwidth( vNormalMapUv );
  float wvRep = max( wvFw.x, wvFw.y ) * uWeave.x;
  float wvClose = 1.0 - smoothstep( 0.22, 0.85, wvRep );
  // unresolved weave (> ~1 repeat per pixel): flat, so mip residue never shows as a dot grid
  float wvFar = 1.0 - smoothstep( 0.6, 1.4, wvRep );
  mapN.xy *= normalScale * mix( 1.0, uWeave.y, wvClose ) * wvFar;
  float wvSlope = length( mapN.xy );
  roughnessFactor = clamp( roughnessFactor + uWeave.z * wvClose * ( wvSlope - 0.12 ), 0.08, 1.0 );
  roughnessFactor = sqrt( roughnessFactor * roughnessFactor + uWeave.w * ( 1.0 - wvClose ) );` : 'mapN.xy *= normalScale;'}
  ${macro ? 'mapN.xy += macroD;' : ''}
  normal = normalize( tbn * mapN );
#endif`);
    }
    if (solid) {
      fs = fs.replace('#include <lights_fragment_begin>', `float intK = 1.0; float intAmb = 0.0;
  if ( uIntK < 0.999 ) {
    vec2 qb = abs( vIntW.xz - uIntBox.xy ) - uIntBox.zw;
    float inBox = ( 1.0 - smoothstep( -0.03, 0.0, max( qb.x, qb.y ) ) ) * ( 1.0 - smoothstep( uIntY.y - 0.04, uIntY.y, vIntW.y ) );
    float opn = 0.0;
    for ( int oi = 0; oi < 6; oi ++ ) {
      vec4 o = uIntOpen[ oi ];
      if ( o.w > 0.0 ) opn = max( opn, o.w * exp( - length( vIntW.xz - o.xy ) / uIntNear.y ) );
    }
    intK = mix( 1.0, mix( ${Number(solid.k ?? 0.2).toFixed(4)}, ${Number(solid.kNear ?? 0.5).toFixed(4)}, opn ), inBox );
  }
${lightsBeginInterior()}`);
    } else if (interior) {
      // fragment inside the enclosure box AND facing inwards (wall inside, roof underside)?
      fs = fs.replace('#include <lights_fragment_begin>', `float intK = 1.0; float intAmb = 0.0;
  if ( uIntK < 0.999 ) {
    vec3 nWi = inverseTransformDirection( nonPerturbedNormal, viewMatrix );
    vec2 dq = vIntW.xz - uIntBox.xy;
    vec2 qb = abs( dq ) - uIntBox.zw;
    float inBox = ( 1.0 - smoothstep( -0.02, 0.04, max( qb.x, qb.y ) ) ) * ( 1.0 - smoothstep( uIntY.y - 0.04, uIntY.y, vIntW.y ) );
    vec2 nh = nWi.xz; float nhl = length( nh );
    float towards = nhl > 1e-4 ? dot( nh / nhl, -dq / max( length( dq ), 1e-4 ) ) : 0.0;
    float inward = max( smoothstep( 0.0, 0.35, towards ) * ( 1.0 - smoothstep( 0.35, 0.75, nWi.y ) ), smoothstep( 0.15, 0.55, -nWi.y ) );
    // light that comes in through the openings: brighter near an open door or a window
    float opn = 0.0;
    for ( int oi = 0; oi < 6; oi ++ ) {
      vec4 o = uIntOpen[ oi ];
      if ( o.w > 0.0 ) opn = max( opn, o.w * exp( - length( vIntW.xz - o.xy ) / uIntNear.y ) );
    }
    intK = mix( 1.0, mix( uIntK, uIntNear.x, opn ), inBox * inward );
    intAmb = mix( uIntAmb.y, uIntAmb.x, opn ) * inBox * inward;
  }
${lightsBeginInterior()}`);
    }
    if (envFlag) {
      fs = fs.replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
  {
    vec3 rFl = reflect( - geometryViewDir, geometryNormal );
    float azFl = abs( degrees( atan( rFl.x, rFl.z ) ) );
    float flag = smoothstep( ${Number(envFlag.a0 - 6).toFixed(2)}, ${Number(envFlag.a0 + 6).toFixed(2)}, azFl ) * ( 1.0 - smoothstep( ${Number(envFlag.a1 - 6).toFixed(2)}, ${Number(envFlag.a1 + 6).toFixed(2)}, azFl ) );
    radiance *= mix( 1.0, ${Number(envFlag.k).toFixed(4)}, flag );
  }`);
    }
    if (envSpec != null || interior) {
      // per-material strength of the environment *reflection* (scene.environmentIntensity
      // overrides material.envMapIntensity in three): cloth mirrors the softboxes only softly
      fs = fs.replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
  ${envSpec != null ? `radiance *= ${Number(envSpec).toFixed(4)};` : ''}
  ${interior ? `#if defined( RE_IndirectDiffuse )\n  iblIrradiance *= intK;\n  #endif\n  #if defined( RE_IndirectSpecular )\n  radiance = radiance * intK + vec3( intAmb * ${Number(envSpec ?? 1).toFixed(4)} );\n  #endif` : ''}`);
    }
    if (dye) {
      // received light E (luminance of the diffuse result / albedo luminance) against the light a
      // face turned to the key gets: in shade the diffuse result is filtered once more by the
      // normalised dye (one extra bounce off the same cloth): deeper, purer colour
      fs = fs.replace('#include <aomap_fragment>', `#include <aomap_fragment>
  {
    const vec3 LW = vec3( 0.2126, 0.7152, 0.0722 );
    vec3 dS = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
    float E = dot( dS, LW ) / max( dot( diffuseColor.rgb, LW ), 1e-4 );
    float Eref = ( uKeyE * 0.8 + uDomeE * 0.75 ) * RECIPROCAL_PI;
    float shadeF = 1.0 - smoothstep( 0.35, 1.0, E / max( Eref, 1e-4 ) );
    vec3 dyeN = diffuseColor.rgb / max( max( diffuseColor.r, max( diffuseColor.g, diffuseColor.b ) ), 1e-4 );
    vec3 tint = mix( vec3( 1.0 ), dyeN, ${Number(dye).toFixed(4)} * shadeF );
    reflectedLight.directDiffuse *= tint; reflectedLight.indirectDiffuse *= tint;
  }`);
    }
    if (sheet) {
      fs = fs.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    vec2 sp = vec2( vAlphaMapUv.x * ${Number(sheet.L).toFixed(4)}, vAlphaMapUv.y * ${Number(sheet.H).toFixed(4)} ) - vec2( ${Number((sheet.c || [0, 0])[0]).toFixed(4)}, ${Number((sheet.c || [0, 0])[1]).toFixed(4)} );
    // one broad, soft reflection of a strip softbox in a slightly wavy foil: a Gaussian band
    // (~35 cm wide) across the window centre at a shallow diagonal; the foil's long waves bend
    // it a little, so it reads as a reflection in taut plastic, not as a painted glare stripe
    // (optional per material: dir = band normal in the panel's (s, y) plane, sigma = band width,
    // wave = waviness scale, mod = brightness modulation along the band, off = offset)
    float wav = ${Number(sheet.wave ?? 1).toFixed(4)} * ( 0.045 * sin( sp.y * 4.3 + sp.x * 1.7 + 0.6 ) + 0.025 * sin( sp.x * 6.1 - sp.y * 2.9 + 1.9 ) );
    float dq = dot( sp, normalize( vec2( ${Number((sheet.dir || [0.42, 0.91])[0]).toFixed(4)}, ${Number((sheet.dir || [0.42, 0.91])[1]).toFixed(4)} ) ) ) + wav + ${Number(sheet.off ?? 0.04).toFixed(4)};
    float sgS = ${Number(sheet.sigma ?? 0.15).toFixed(4)};
    float bandS = exp( - dq * dq / ( 2.0 * sgS * sgS ) ) * ( 1.0 - ${Number(sheet.mod ?? 0.25).toFixed(4)} + ${Number(sheet.mod ?? 0.25).toFixed(4)} * sin( sp.x * 2.3 + sp.y * 1.1 ) );
    totalEmissiveRadiance += vec3( ${Number(sheet.strength).toFixed(4)} ) * bandS;
  }`);
    }
    if (transl) {
      // Light passing through thin fabric, seen from the shaded side.
      fs = fs.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    vec3 nW = inverseTransformDirection( normal, viewMatrix );
    vec3 nBack = -nW; // the other side of the sheet
    float through = uKeyE * ${Number(trKey).toFixed(4)} * max( 0.0, dot( nBack, uKeyDirW ) ) + uDomeE * max( 0.0, nBack.y ) * ${Number(trSky).toFixed(4)};
    float facingAway = max( 0.0, -dot( nW, uKeyDirW ) );
    totalEmissiveRadiance += diffuseColor.rgb * ${Number(transl).toFixed(4)} * through * RECIPROCAL_PI * mix( 0.6, 1.0, facingAway );
  }`);
    }
    shader.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => `hk:${stoch}:${transl}:${trKey}:${trSky}:${macro ? 'm' : ''}:${weave ? 'w' : ''}:${interior ? 'i' : ''}${solid ? `s${solid.k}/${solid.kNear}` : ''}:${envSpec}:${dye}:${sheet ? `${sheet.L}x${sheet.H}x${sheet.strength}x${sheet.c}x${sheet.dir || ''}x${sheet.sigma ?? ''}x${sheet.wave ?? ''}x${sheet.mod ?? ''}x${sheet.off ?? ''}` : ''}:${envFlag ? `${envFlag.k}/${envFlag.a0}/${envFlag.a1}` : ''}`;
  mat.needsUpdate = true;
}

// --- composite shaders ------------------------------------------------------
const quadVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }`;

const compositeFS = `
precision highp float;
uniform sampler2D tFrame;
uniform vec3 uBg;            // backdrop, linear
uniform float uExposure;
uniform float uShadowStrength;
uniform float uWeight;
uniform int uToneMap;        // 0 neutral, 1 agx, 2 aces, 3 linear
uniform float uShoulder;     // neutral: start of the highlight compression (Khronos default 0.76)
uniform float uEdgeFade;     // floor shadows fade to the exact backdrop within this fraction of the frame
uniform vec4 uBgShade;       // soft darker backdrop zone behind a light product (uv centre, uv radii)
uniform float uBgShadeK;     // its depth at the centre (0 = off); the frame edges stay the exact backdrop
varying vec2 vUv;
vec3 neutralTM( vec3 color ) {
  float StartCompression = uShoulder; const float Desaturation = 0.15;
  float x = min( color.r, min( color.g, color.b ) );
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max( color.r, max( color.g, color.b ) );
  if ( peak < StartCompression ) return color;
  float d = 1. - StartCompression;
  float newPeak = 1. - d * d / ( peak + d - StartCompression );
  color *= newPeak / peak;
  float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
  return mix( color, vec3( newPeak ), g );
}
vec3 agxContrast( vec3 x ) { vec3 x2 = x * x; vec3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; }
vec3 agxTM( vec3 color ) {
  const mat3 S2R = mat3( vec3( 0.6274, 0.0691, 0.0164 ), vec3( 0.3293, 0.9195, 0.0880 ), vec3( 0.0433, 0.0113, 0.8956 ) );
  const mat3 R2S = mat3( vec3( 1.6605, -0.1246, -0.0182 ), vec3( -0.5876, 1.1329, -0.1006 ), vec3( -0.0728, -0.0083, 1.1187 ) );
  const mat3 I = mat3( vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ), vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ), vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 ) );
  const mat3 O = mat3( vec3( 1.1271005818144368, -0.1413297634984383, -0.14132976349843826 ), vec3( -0.11060664309660323, 1.157823702216272, -0.11060664309660294 ), vec3( -0.016493938717834573, -0.016493938717834257, 1.2519364065950405 ) );
  color = S2R * color; color = I * color; color = max( color, 1e-10 ); color = log2( color );
  color = ( color + 12.47393 ) / ( 4.026069 + 12.47393 ); color = clamp( color, 0.0, 1.0 );
  color = agxContrast( color ); color = O * color; color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
  color = R2S * color; return clamp( color, 0.0, 1.0 );
}
vec3 acesTM( vec3 color ) {
  const mat3 ACESInputMat = mat3( vec3( 0.59719, 0.07600, 0.02840 ), vec3( 0.35458, 0.90834, 0.13383 ), vec3( 0.04823, 0.01566, 0.83777 ) );
  const mat3 ACESOutputMat = mat3( vec3( 1.60475, -0.10208, -0.00327 ), vec3( -0.53108, 1.10813, -0.07276 ), vec3( -0.07367, -0.00605, 1.07602 ) );
  color *= 1.0 / 0.6; color = ACESInputMat * color;
  vec3 a = color * ( color + 0.0245786 ) - 0.000090537; vec3 b = color * ( 0.983729 * color + 0.4329510 ) + 0.238081;
  color = ACESOutputMat * ( a / b ); return clamp( color, 0.0, 1.0 );
}
void main() {
  vec4 s = texture2D( tFrame, vUv );
  vec3 obj = max( s.rgb, vec3( 0.0 ) ) * uExposure;
  if ( uToneMap == 0 ) obj = neutralTM( obj );
  else if ( uToneMap == 1 ) obj = agxTM( obj );
  else if ( uToneMap == 2 ) obj = acesTM( obj );
  else obj = clamp( obj, 0.0, 1.0 );
  // alpha: 1 = product, 0.25 = floor (rgb = received light ratio), 0 = empty (backdrop)
  float ratio = s.a > 0.1 ? clamp( s.r, 0.0, 1.0 ) : 1.0;
  if ( uEdgeFade > 0.0 ) {
    float e = min( min( vUv.x, 1.0 - vUv.x ), min( vUv.y, 1.0 - vUv.y ) );
    ratio = mix( 1.0, ratio, smoothstep( 0.004, uEdgeFade, e ) );
  }
  float intF = ( s.a > 0.1 && s.a < 0.5 ) ? clamp( s.g, 0.0, 1.0 ) : 1.0;
  vec3 gnd = uBg * mix( 1.0, ratio, uShadowStrength ) * intF;
  if ( uBgShadeK > 0.0 ) {
    vec2 dz = ( vUv - uBgShade.xy ) / uBgShade.zw;
    float eS = min( min( vUv.x, 1.0 - vUv.x ), min( vUv.y, 1.0 - vUv.y ) );
    gnd *= 1.0 - uBgShadeK * exp( - dot( dz, dz ) ) * smoothstep( 0.0, 0.12, eS );
  }
  gl_FragColor = vec4( mix( gnd, obj, step( 0.5, s.a ) ) * uWeight, uWeight );
}`;

const outputFS = `
precision highp float;
uniform sampler2D tAccum;
uniform vec3 uBg;
varying vec2 vUv;
float h12( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * 0.1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
vec3 toSRGB( vec3 c ) { return mix( c * 12.92, 1.055 * pow( c, vec3( 1.0 / 2.4 ) ) - 0.055, step( 0.0031308, c ) ); }
void main() {
  vec4 a = texture2D( tAccum, vUv );
  vec3 c = a.rgb / max( a.a, 1e-6 );
  vec3 s = toSRGB( clamp( c, 0.0, 1.0 ) );
  // triangular dither, but keep the pure backdrop bit-exact
  float isBg = step( length( c - uBg ), 1.5e-4 );
  float d = ( h12( gl_FragCoord.xy ) + h12( gl_FragCoord.yx + 19.19 ) - 1.0 ) / 255.0;
  gl_FragColor = vec4( s + d * ( 1.0 - isBg ), 1.0 );
}`;

// Ground: received-light ratio from two baked floor maps (smooth, converged):
//   r = hemisphere visibility (contact shadow / AO), g = key softbox visibility.
const groundFS = `
uniform sampler2D uAO;
uniform vec4 uAOBox;        // x0, z0, 1/width, 1/depth
uniform float uAOStrength;
uniform float uKeyShare;
uniform sampler2D uContact;  // blurred contact-shadow term (1 = touching)
uniform float uContactStrength;
uniform sampler2D uContactW; // wide, soft contact/AO halo (incl. contact proxies along wall hems)
uniform float uContactWStrength;
uniform float uShadowFloor;  // lowest received-light ratio of the soft shadow (soft knee), 0 = off
uniform float uSplit;        // 1: the knee softens only the key shadow; sky occlusion multiplies after it
uniform float uAOEdge;       // groundAO.edgeFade: AO/key maps fade to 1 over this fraction at the bake border (0 = off)
uniform vec4 uIntBox;        // enclosure footprint (centre x/z, half extents x/z), see rig.interior
uniform vec2 uIntFloor;      // x: floor light factor inside the enclosure (1 = off), y: feather (m)
uniform vec4 uIntOpen[ 6 ];  // openings (see globalUniforms.uIntOpen)
uniform vec2 uIntNear;       // x: wall factor near an opening (unused here), y: fall-off (m)
uniform float uIntFloorNear; // floor light factor right inside an opening
varying vec3 vWorldPos;
void main() {
  vec2 aoUv = ( vWorldPos.xz - uAOBox.xy ) * uAOBox.zw;
  bool inside = aoUv.x > 0.0 && aoUv.x < 1.0 && aoUv.y > 0.0 && aoUv.y < 1.0;
  vec2 v = inside ? texture2D( uAO, aoUv ).rg : vec2( 1.0 );
  if ( inside && uAOEdge > 0.0 ) { vec2 e2 = min( aoUv, 1.0 - aoUv ); v = mix( vec2( 1.0 ), v, smoothstep( 0.0, uAOEdge, min( e2.x, e2.y ) ) ); }
  float c = inside ? texture2D( uContact, aoUv ).r : 0.0;
  // pow(): open floor ~ linear falloff, enclosed floor (inside a closed tent) goes properly dark
  float keyPart = 1.0 - uKeyShare * ( 1.0 - v.g );
  float skyPart = pow( max( v.r, 0.0 ), uAOStrength );
  float soft = uSplit > 0.5 ? keyPart : keyPart * skyPart;
  if ( uShadowFloor > 0.0 ) {
    float maxD = 1.0 - uShadowFloor;
    soft = 1.0 - maxD * ( 1.0 - exp( -( 1.0 - soft ) / maxD ) );
  }
  // split model: enclosed floor (inside walls) keeps getting darker after the knee
  if ( uSplit > 0.5 ) soft *= skyPart;
  float cw = ( inside && uContactWStrength > 0.0 ) ? texture2D( uContactW, aoUv ).r : 0.0;
  float ratio = soft * ( 1.0 - uContactStrength * c ) * ( 1.0 - uContactWStrength * cw );
  // floor inside a walled tent: the enclosure blocks the sky and the studio's open fill. Sent
  // separately (g) so it is not capped by the shadow strength like an open-floor shadow
  float intF = 1.0;
  if ( uIntFloor.x < 0.999 ) {
    vec2 qf = abs( vWorldPos.xz - uIntBox.xy ) - uIntBox.zw;
    float opn = 0.0;
    for ( int oi = 0; oi < 6; oi ++ ) {
      vec4 o = uIntOpen[ oi ];
      if ( o.w > 0.0 ) opn = max( opn, o.w * exp( - length( vWorldPos.xz - o.xy ) / uIntNear.y ) );
    }
    float fIn = mix( uIntFloor.x, max( uIntFloor.x, uIntFloorNear ), opn );
    intF = mix( 1.0, fIn, 1.0 - smoothstep( -0.25 * uIntFloor.y, 0.75 * uIntFloor.y, max( qf.x, qf.y ) ) );
  }
  gl_FragColor = vec4( ratio, intF, 0.0, 0.25 ); // alpha 0.25 marks 'floor'
}`;

// Wall catcher (userData.catcher meshes, e.g. the studio sweep a folded table leans against):
// like the floor it outputs the received-light ratio (alpha 0.25 = 'floor' in the composite), so
// it shows as the exact backdrop colour plus the product's shadows. Here the ratio comes from the
// per-frame shadow maps of the shadow-casting lights (key + dome), accumulated over the frames,
// plus `uAmb` of open-studio light that is never occluded, and analytic contact occlusion at the
// touch points (uC: xyz + radius).
const wallVS = `
#include <common>
#include <shadowmap_pars_vertex>
varying vec3 vWN; varying vec3 vWP;
void main() {
  vec3 objectNormal = normal;
  vec3 transformedNormal = normalMatrix * objectNormal;
  vec3 transformed = position;
  vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
  #include <shadowmap_vertex>
  vWN = normalize( transformedNormal );
  vWP = worldPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}`;
const wallFS = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
uniform float uAmb;
uniform vec4 uC[ 4 ];
uniform float uCK;
varying vec3 vWN; varying vec3 vWP;
void main() {
  vec3 n = normalize( vWN );
  float lit = 0.0, tot = 0.0;
  #if NUM_DIR_LIGHT_SHADOWS > 0
  DirectionalLight dl;
  DirectionalLightShadow dls;
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
    {
      dl = directionalLights[ i ];
      float e = max( dot( n, dl.direction ), 0.0 ) * dot( dl.color, vec3( 0.2126, 0.7152, 0.0722 ) );
      dls = directionalLightShadows[ i ];
      float sh = getShadow( directionalShadowMap[ i ], dls.shadowMapSize, dls.shadowIntensity, dls.shadowBias, dls.shadowRadius, vDirectionalShadowCoord[ i ] );
      lit += e * sh; tot += e;
    }
  }
  #pragma unroll_loop_end
  #endif
  float ratio = tot > 1e-5 ? mix( lit / tot, 1.0, uAmb ) : 1.0;
  for ( int k = 0; k < 4; k ++ ) {
    if ( uC[ k ].w > 0.0 ) { float d = length( vWP - uC[ k ].xyz ) / uC[ k ].w; ratio *= 1.0 - uCK * exp( - d * d ); }
  }
  gl_FragColor = vec4( ratio, 1.0, 0.0, 0.25 );
}`;

const groundVS = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4( position, 1.0 );
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// Floor AO bake: rendered in the floor quad's UV space; each pass adds the
// visibility of one hemisphere direction (cosine weighted) / N.
const aoBakeVS = `
#include <common>
#include <shadowmap_pars_vertex>
void main() {
  vec3 objectNormal = vec3( 0.0, 1.0, 0.0 );
  vec3 transformedNormal = normalMatrix * objectNormal;
  vec3 transformed = position;
  vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
  #include <shadowmap_vertex>
  gl_Position = vec4( uv * 2.0 - 1.0, 0.0, 1.0 );
}`;
const aoBakeFS = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
uniform float uWeight;
uniform vec2 uMask;
void main() {
  float v = 1.0;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
  DirectionalLightShadow dls = directionalLightShadows[ 0 ];
  v = getShadow( directionalShadowMap[ 0 ], dls.shadowMapSize, dls.shadowIntensity, dls.shadowBias, dls.shadowRadius, vDirectionalShadowCoord[ 0 ] );
  #endif
  gl_FragColor = vec4( v * uWeight * uMask, 0.0, uWeight );
}`;

// Contact shadow: lowest height of the product above each floor texel (rendered
// from below), turned into exp(-h/h0), then blurred (cf. drei ContactShadows).
const heightVS = `varying float vY; void main(){ vec4 wp = modelMatrix * vec4( position, 1.0 ); vY = wp.y; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const heightFS = `varying float vY; void main(){ gl_FragColor = vec4( vY, 0.0, 0.0, 1.0 ); }`;
const contactFS = `
uniform sampler2D tH; uniform float uH0; varying vec2 vUv;
void main(){ float h = texture2D( tH, vUv ).r; gl_FragColor = vec4( exp( -max( h, 0.0 ) / uH0 ), 0.0, 0.0, 1.0 ); }`;
const blurFS = `
uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){
  float w[5]; w[0] = 0.227027; w[1] = 0.1945946; w[2] = 0.1216216; w[3] = 0.054054; w[4] = 0.016216;
  vec4 acc = texture2D( tSrc, vUv ) * w[0];
  for ( int i = 1; i < 5; i ++ ) { acc += texture2D( tSrc, vUv + uDir * float( i ) ) * w[ i ]; acc += texture2D( tSrc, vUv - uDir * float( i ) ) * w[ i ]; }
  gl_FragColor = acc;
}`;

// --- light rig ----------------------------------------------------------------
// Area-weighted albedo luminance of the product (metals and textured parts count
// as mid-grey). Used for automatic per-product exposure, like a photographer
// exposing a white product differently from a black one. The backdrop is
// composited separately, so it stays exactly the configured colour.
export function productAlbedo(root) {
  let sum = 0, area = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || o.userData.contactProxy) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    let L = 0.25;
    if (m.color && !m.map && (m.metalness ?? 0) < 0.5) L = 0.2126 * m.color.r + 0.7152 * m.color.g + 0.0722 * m.color.b;
    else if (m.map) L = 0.45;
    const pos = o.geometry.attributes.position, idx = o.geometry.index;
    const n = idx ? idx.count : pos.count;
    const step = Math.max(3, Math.floor(n / 3 / 4000) * 3);
    let A = 0;
    for (let i = 0; i + 2 < n; i += step) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
      A += b.sub(a).cross(c.sub(a)).length() * 0.5 * (step / 3);
    }
    sum += L * A; area += A;
  });
  return area > 0 ? sum / area : 0.2;
}

export const DEFAULT_RIG = {
  exposure: 'auto',             // number, or 'auto' = per-product exposure from albedo
  exposureAuto: { ref: 0.2, base: 0.86, power: 0.22, min: 0.6, max: 1.25 },
  toneMapping: 'neutral',
  envIntensity: 0.9,          // IBL (RoomEnvironment) strength, mostly visible on metals / gloss
  key: { azimuth: -48, elevation: 56, intensity: 3.0, cone: 10, mapSize: 2048, radius: 1.6 },
  dome: { count: 2, intensity: 1.6, maxZenith: 62, mapSize: 1024, radius: 3 },
  fill: { azimuth: 72, elevation: 18, intensity: 0.35 },
  rim: { azimuth: 160, elevation: 38, intensity: 0.6 },
  bounce: { intensity: 0.5 },   // floor bounce from below (unshadowed, tinted by backdrop)
  groundAmbient: 0.25,          // share of floor light that never gets occluded (open studio)
  groundAO: { strength: 0.8, samples: 64, keySamples: 64, res: 1024, maxZenith: 84, mapSize: 1024, blur: 2.2 },
  contact: { strength: 0.62, h0: 0.03, res: 512, blur: 1.6 }, // crisp contact shadow under feet / hems // baked floor contact shadow
  shadowStrength: 0.92,
  shadowFloor: 0,               // e.g. 0.7: open-floor shadow never darker than 70 % of the backdrop
  groundSplit: false,           // true: shadowFloor softens only the key shadow, sky occlusion (groundAO) multiplies after
  edgeFade: 0.07,               // floor shadow fades to the exact backdrop colour near the frame edges
  floorKey: null,               // {azimuth, elevation, cone}: direction of the key's *floor* shadow (default = key)
  envRotation: null,            // degrees: yaw of the reflection environment relative to the camera (null = fixed)
  env: 'room',                  // 'room' (three RoomEnvironment) or 'studio' (dark studio + softboxes, js/studioEnv.js;
                                // always camera-relative). envStudio: overrides for the studio map.
  envStudio: null,
  interior: null,               // {box:[cx, cz, hx, hz], top, k, floor, floorBox, feather}: enclosure (walled tent).
                                // Inward-facing surfaces inside the box keep only shadowed light (k scales fill/rim/
                                // bounce + IBL); the floor inside floorBox (default box: the wall planes) is
                                // multiplied by `floor`, fading out over `feather` m across the wall line.
                                // openings [[x, z, weight], ...] (max 6: open doors, windows): near an opening
                                // inward faces keep up to `kNear` and the floor up to `floorNear` of the open-
                                // studio light, falling off over `fall` m (light that comes in through it); `amb` (far)
                                // to `ambNear`: a soft interior radiance the inward faces mirror (x their envSpec)
};

function dirFromAzEl(azDeg, elDeg) {
  const az = azDeg * DEG, el = elDeg * DEG;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
}

function srgbHexToLinear(hex) {
  const c = new THREE.Color(hex); // ColorManagement converts sRGB -> linear working space
  return new THREE.Vector3(c.r, c.g, c.b);
}

export class Studio {
  constructor(canvas) {
    patchShaderChunks();
    this.canvas = canvas;
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = true;
    r.toneMapping = THREE.NoToneMapping;
    r.autoClear = false; // we accumulate into a render target; clears are explicit
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer = r;
    setMaxAnisotropy(Math.min(8, r.capabilities.getMaxAnisotropy()));

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentRotation = new THREE.Euler(0, 0, 0);

    // lights: shadow casters first (three sorts casters first, keep our order stable)
    this.lightGroup = new THREE.Group();
    this.scene.add(this.lightGroup);
    this.key = this._dirLight(true);
    // optional spot key (rig.key.distance): a softbox at a real distance, so light falls
    // off across large products (gradient over a tent roof instead of flat faces)
    this.keySpot = new THREE.SpotLight(0xffffff, 0, 0, Math.PI / 6, 0.6, 2);
    this.keySpot.castShadow = true;
    this.keySpot.visible = false;
    this.lightGroup.add(this.keySpot, this.keySpot.target);
    this.envCache = new Map();
    this.dome = [0, 1, 2, 3, 4, 5].map(() => this._dirLight(true));
    this.fill = this._dirLight(false);
    this.rim = this._dirLight(false);
    this.bounce = this._dirLight(false);

    // ground shadow catcher
    const gm = new THREE.ShaderMaterial({
      uniforms: { uAO: { value: null }, uAOEdge: { value: 0 }, uAOBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uAOStrength: { value: 0 }, uKeyShare: { value: 0 }, uContact: { value: null }, uContactStrength: { value: 0 }, uContactW: { value: null }, uContactWStrength: { value: 0 }, uShadowFloor: { value: 0 }, uSplit: { value: 0 }, uIntBox: { value: new THREE.Vector4() }, uIntFloor: { value: new THREE.Vector2(1, 0.1) }, uIntOpen: globalUniforms.uIntOpen, uIntNear: globalUniforms.uIntNear, uIntFloorNear: { value: 0 } },
      vertexShader: groundVS,
      fragmentShader: groundFS,
    });
    this.groundMat = gm;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), gm);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.castShadow = false;
    this.scene.add(this.ground);
    // wall catcher material (see wallFS)
    this.wallMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { uAmb: { value: 0.4 }, uC: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uCK: { value: 0.35 } }]),
      vertexShader: wallVS, fragmentShader: wallFS, lights: true,
    });

    this.camera = new THREE.PerspectiveCamera(24, 1, 0.05, 500);
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.compositeMat = new THREE.ShaderMaterial({
      uniforms: { tFrame: { value: null }, uBg: { value: new THREE.Vector3() }, uExposure: { value: 1 }, uShadowStrength: { value: 0.9 }, uWeight: { value: 1 }, uToneMap: { value: 0 }, uShoulder: { value: 0.76 }, uEdgeFade: { value: 0.07 }, uBgShade: { value: new THREE.Vector4(0.5, 0.5, 0.3, 0.3) }, uBgShadeK: { value: 0 } },
      vertexShader: quadVS, fragmentShader: compositeFS,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      depthTest: false, depthWrite: false,
    });
    this.outputMat = new THREE.ShaderMaterial({
      uniforms: { tAccum: { value: null }, uBg: { value: new THREE.Vector3() } },
      vertexShader: quadVS, fragmentShader: outputFS, depthTest: false, depthWrite: false,
    });
    this.compositeQuad = new THREE.Mesh(quadGeo, this.compositeMat);
    this.outputQuad = new THREE.Mesh(quadGeo, this.outputMat);
    this.quadScene = new THREE.Scene();
    this.rt = null; this.accum = null;

    // floor AO bake setup
    this.aoScene = new THREE.Scene();
    this.aoLight = new THREE.DirectionalLight(0xffffff, 0);
    this.aoLight.castShadow = true;
    this.aoLight.layers.set(1);                 // gathered by the AO camera (layer 1)
    this.aoLight.shadow.camera.layers.set(0);   // ...but its shadow pass renders the product (layer 0)
    this.aoLight.shadow.camera.layers.enable(2); // non-zero extra bit => three uses these layers for the shadow pass
    this.aoScene.add(this.aoLight, this.aoLight.target);
    this.aoMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { uWeight: { value: 0 }, uMask: { value: new THREE.Vector2(1, 0) } }]),
      vertexShader: aoBakeVS, fragmentShader: aoBakeFS, lights: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    this.aoPlane = new THREE.Mesh(new THREE.BufferGeometry(), this.aoMat);
    this.aoPlane.frustumCulled = false; this.aoPlane.receiveShadow = true; this.aoPlane.castShadow = false;
    this.aoPlane.layers.set(1);
    this.aoScene.add(this.aoPlane);
    this.aoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    this.heightMat = new THREE.ShaderMaterial({ vertexShader: heightVS, fragmentShader: heightFS, side: THREE.DoubleSide });
    this.contactMat = new THREE.ShaderMaterial({ uniforms: { tH: { value: null }, uH0: { value: 0.03 } }, vertexShader: quadVS, fragmentShader: contactFS, depthTest: false, depthWrite: false });
    this.blurMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: quadVS, fragmentShader: blurFS, depthTest: false, depthWrite: false });
    this.contactCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 20);
    this.contactRTs = null;
    this.aoCam.layers.set(1);
    this.aoRT = null;
  }

  // Bake floor visibility under/around the product (contact shadows / AO).
  _bakeGroundAO(root, box, opt, keyBase = null, keyCone = 10, keySamples = 0) {
    const r = this.renderer;
    const res = opt.res | 0;
    if (!this.aoRT || this.aoRT.width !== res) {
      this.aoRT?.dispose();
      this.aoRT = new THREE.WebGLRenderTarget(res, res, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    }
    const size = box.getSize(new THREE.Vector3());
    const m = Math.max(0.25, size.y * 0.9) + 0.05 * Math.max(size.x, size.z);
    const x0 = box.min.x - m, x1 = box.max.x + m, z0 = box.min.z - m, z1 = box.max.z + m;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0.0005, z0, x1, 0.0005, z0, x1, 0.0005, z1, x0, 0.0005, z1], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    geo.setIndex([0, 2, 1, 0, 3, 2]);
    this.aoPlane.geometry.dispose(); this.aoPlane.geometry = geo;
    const parent = root.parent;
    this.aoScene.add(root);
    r.setRenderTarget(this.aoRT);
    r.setClearColor(0x000000, 0); r.clear(true, false, false);
    const N = opt.samples | 0;
    const cosMax = Math.cos(opt.maxZenith * DEG);
    const d = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const [u1, u2] = r2(i, [0.61, 0.17]);
      const sin2 = u1 * (1 - cosMax * cosMax);
      const st = Math.sqrt(sin2), ct = Math.sqrt(1 - sin2), ph = u2 * Math.PI * 2;
      d.set(st * Math.cos(ph), ct, st * Math.sin(ph));
      this._fitShadow(this.aoLight, d, box, opt.mapSize || 1024, 2.0);
      this.aoMat.uniforms.uWeight.value = 1 / N;
      this.aoMat.uniforms.uMask.value.set(1, 0);
      r.render(this.aoScene, this.aoCam);
    }
    // key softbox shadow on the floor: many directions inside the key cone
    if (keyBase && keySamples > 0) {
      const t1 = new THREE.Vector3().crossVectors(keyBase, new THREE.Vector3(0, 1, 0)).normalize();
      const t2 = new THREE.Vector3().crossVectors(t1, keyBase).normalize();
      const ct = Math.tan(keyCone * DEG);
      for (let i = 0; i < keySamples; i++) {
        const [dx, dy] = squareToDisk(...r2(i, [0.29, 0.83]));
        d.copy(keyBase).addScaledVector(t1, dx * ct).addScaledVector(t2, dy * ct).normalize();
        this._fitShadow(this.aoLight, d, box, 2048, 1.5);
        this.aoMat.uniforms.uWeight.value = 1 / keySamples;
        this.aoMat.uniforms.uMask.value.set(0, 1);
        r.render(this.aoScene, this.aoCam);
      }
    } else {
      // no key bake: mark the key channel fully visible
      this.aoMat.uniforms.uWeight.value = 1;
      this.aoMat.uniforms.uMask.value.set(0, 1);
      this.aoLight.castShadow = false; r.render(this.aoScene, this.aoCam); this.aoLight.castShadow = true;
    }
    // smooth the baked map: removes the streaks of thin parts from discrete directions
    if (opt.blur > 0) {
      if (!this.aoTmp || this.aoTmp.width !== res) { this.aoTmp?.dispose(); this.aoTmp = new THREE.WebGLRenderTarget(res, res, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); }
      const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blurMat); const qs = new THREE.Scene(); qs.add(q);
      this.blurMat.uniforms.tSrc.value = this.aoRT.texture; this.blurMat.uniforms.uDir.value.set(opt.blur / res, 0);
      r.setRenderTarget(this.aoTmp); r.render(qs, this.quadCam);
      this.blurMat.uniforms.tSrc.value = this.aoTmp.texture; this.blurMat.uniforms.uDir.value.set(0, opt.blur / res);
      r.setRenderTarget(this.aoRT); r.render(qs, this.quadCam);
      // groundAO.sigma (m): an extra wide Gaussian (doubling tap spacing, no banding) that merges the
      // discrete shadow copies of tall products into one smooth pool
      if (opt.sigma > 0) {
        const texel = (x1 - x0) / res, target = opt.sigma / texel;
        let varAcc = 0;
        for (let k = 1; varAcc < target * target && k <= 64; k *= 2) {
          this.blurMat.uniforms.tSrc.value = this.aoRT.texture; this.blurMat.uniforms.uDir.value.set(k / res, 0);
          r.setRenderTarget(this.aoTmp); r.render(qs, this.quadCam);
          this.blurMat.uniforms.tSrc.value = this.aoTmp.texture; this.blurMat.uniforms.uDir.value.set(0, k / res);
          r.setRenderTarget(this.aoRT); r.render(qs, this.quadCam);
          varAcc += 2.85 * k * k;
        }
      }
      q.geometry.dispose();
    }
    // contact shadow map
    const C = { ...DEFAULT_RIG.contact, ...(opt.contact || {}) };
    if (C.strength > 0) {
      const cr = C.res | 0;
      if (!this.contactRTs || this.contactRTs[0].width !== cr) {
        this.contactRTs?.forEach((t) => t.dispose());
        const mk = (depth) => new THREE.WebGLRenderTarget(cr, cr, { type: THREE.HalfFloatType, depthBuffer: depth, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
        this.contactRTs = [mk(true), mk(false), mk(false), mk(false)];
      }
      const [hRT, aRT, bRT, wRT] = this.contactRTs;
      const cc = this.contactCam;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      cc.left = x0 - cx; cc.right = x1 - cx; cc.bottom = z0 - cz; cc.top = z1 - cz;
      cc.position.set(cx, -0.05, cz); cc.up.set(0, 0, 1); cc.lookAt(cx, 1, cz);
      cc.near = 0.001; cc.far = box.max.y + 1; cc.updateProjectionMatrix(); cc.updateMatrixWorld();
      cc.layers.set(0);
      const prevOverride = this.aoScene.overrideMaterial;
      this.aoScene.overrideMaterial = this.heightMat;
      r.setRenderTarget(hRT); r.setClearColor(0x000000, 1);
      r.setClearColor(new THREE.Color(100, 100, 100), 1); r.clear(true, true, false);
      const sh = r.shadowMap.enabled; r.shadowMap.enabled = false;
      r.render(this.aoScene, cc);
      r.shadowMap.enabled = sh;
      this.aoScene.overrideMaterial = prevOverride;
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.contactMat);
      const qs = new THREE.Scene(); qs.add(quad);
      this.contactMat.uniforms.tH.value = hRT.texture; this.contactMat.uniforms.uH0.value = C.h0;
      r.setRenderTarget(aRT); r.render(qs, this.quadCam);
      quad.material = this.blurMat;
      for (let pass = 0; pass < 2; pass++) {
        this.blurMat.uniforms.tSrc.value = aRT.texture; this.blurMat.uniforms.uDir.value.set(C.blur / cr, 0);
        r.setRenderTarget(bRT); r.render(qs, this.quadCam);
        this.blurMat.uniforms.tSrc.value = bRT.texture; this.blurMat.uniforms.uDir.value.set(0, C.blur / cr);
        r.setRenderTarget(aRT); r.render(qs, this.quadCam);
      }
      // wide, soft halo: a second height pass that also sees the contact proxies (layer 3:
      // invisible ground-hugging strips a model adds along e.g. wall hems), exp(-h/h0w),
      // blurred to a Gaussian of `sigma` metres with doubling tap spacing (no banding)
      const Wd = C.wide;
      if (Wd && Wd.strength > 0) {
        cc.layers.enable(3);
        this.aoScene.overrideMaterial = this.heightMat;
        r.setRenderTarget(hRT); r.setClearColor(new THREE.Color(100, 100, 100), 1); r.clear(true, true, false);
        const sh2 = r.shadowMap.enabled; r.shadowMap.enabled = false;
        r.render(this.aoScene, cc);
        r.shadowMap.enabled = sh2;
        this.aoScene.overrideMaterial = prevOverride;
        cc.layers.set(0);
        quad.material = this.contactMat;
        this.contactMat.uniforms.tH.value = hRT.texture; this.contactMat.uniforms.uH0.value = Wd.h0 ?? 0.05;
        r.setRenderTarget(wRT); r.render(qs, this.quadCam);
        quad.material = this.blurMat;
        const texel = (x1 - x0) / cr;
        const target = (Wd.sigma ?? 0.03) / texel;
        let varAcc = 0;
        for (let k = 1; varAcc < target * target && k <= 64; k *= 2) {
          this.blurMat.uniforms.tSrc.value = wRT.texture; this.blurMat.uniforms.uDir.value.set(k / cr, 0);
          r.setRenderTarget(bRT); r.render(qs, this.quadCam);
          this.blurMat.uniforms.tSrc.value = bRT.texture; this.blurMat.uniforms.uDir.value.set(0, k / cr);
          r.setRenderTarget(wRT); r.render(qs, this.quadCam);
          varAcc += 2.85 * k * k;
        }
        this.groundMat.uniforms.uContactW.value = wRT.texture;
        this.groundMat.uniforms.uContactWStrength.value = Wd.strength;
      } else {
        this.groundMat.uniforms.uContactWStrength.value = 0;
      }
      quad.geometry.dispose();
      this.groundMat.uniforms.uContact.value = aRT.texture;
      this.groundMat.uniforms.uContactStrength.value = C.strength;
    } else {
      this.groundMat.uniforms.uContactStrength.value = 0;
      this.groundMat.uniforms.uContactWStrength.value = 0;
    }
    if (parent) parent.add(root); else this.aoScene.remove(root);
    const gu = this.groundMat.uniforms;
    gu.uAOEdge.value = opt.edgeFade || 0;
    gu.uAO.value = this.aoRT.texture;
    gu.uAOBox.value.set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0));
  }

  _dirLight(cast) {
    const l = new THREE.DirectionalLight(0xffffff, 1);
    l.castShadow = cast;
    this.lightGroup.add(l);
    this.lightGroup.add(l.target);
    return l;
  }

  _ensureDome(n) {
    if (n > this.dome.length) throw new Error(`dome.count max ${this.dome.length}`);
    this.dome.forEach((l, i) => { l.visible = i < n; });
  }

  _ensureTargets(w, h) {
    if (this.rt && this.rt.width === w && this.rt.height === h) return;
    this.rt?.dispose(); this.accum?.dispose();
    this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.accum = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  }

  // Fit an orthographic shadow camera tightly around the product bounds.
  _fitShadow(light, dir, box, mapSize, radiusTexels, cone = 0) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    light.position.copy(center).addScaledVector(dir, size * 2 + 2);
    light.target.position.copy(center);
    light.updateMatrixWorld(); light.target.updateMatrixWorld();
    const cam = light.shadow.camera;
    cam.up.set(0, 1, 0);
    if (Math.abs(dir.y) > 0.92) cam.up.set(0, 0, -1);
    cam.position.copy(light.position); cam.lookAt(center); cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    const p = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
      p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(inv);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z);
    }
    const pad = 0.02 * size;
    cam.left = x0 - pad; cam.right = x1 + pad; cam.bottom = y0 - pad; cam.top = y1 + pad;
    // far must reach the floor where shadows land beyond the product's box
    cam.near = Math.max(0.01, -z1 - pad); cam.far = -z0 + pad + size * 4 / Math.max(0.15, Math.abs(dir.y));
    cam.updateProjectionMatrix();
    light.shadow.mapSize.set(mapSize, mapSize);
    const texel = Math.max(cam.right - cam.left, cam.top - cam.bottom) / mapSize;
    light.shadow.radius = radiusTexels;
    light.shadow.bias = -0.00025;
    light.shadow.normalBias = texel * 1.4;
    light.shadow.needsUpdate = true;
    if (light.shadow.map && (light.shadow.map.width !== mapSize)) { light.shadow.map.dispose(); light.shadow.map = null; }
  }

  /**
   * Render `root` (THREE.Object3D) with camera `view` = {position, target, fov, azimuth}.
   * Leaves the final sRGB image on the canvas.
   */
  async render(root, view, { width = 2000, height = 2000, samples = 40, bg = '#EFEDE8', rig = {}, onProgress = null } = {}) {
    const R = { ...DEFAULT_RIG, ...rig, key: { ...DEFAULT_RIG.key, ...(rig.key || {}) }, dome: { ...DEFAULT_RIG.dome, ...(rig.dome || {}) }, fill: { ...DEFAULT_RIG.fill, ...(rig.fill || {}) }, rim: { ...DEFAULT_RIG.rim, ...(rig.rim || {}) }, bounce: { ...DEFAULT_RIG.bounce, ...(rig.bounce || {}) } };
    const r = this.renderer;
    r.setSize(width, height, false);
    this._ensureTargets(width, height);
    this.scene.environmentIntensity = R.envIntensity;
    if (R.env === 'studio') {
      const k = JSON.stringify(R.envStudio || {});
      if (!this.envCache.has(k)) {
        const eq = studioEquirect(R.envStudio || {});
        const pm = new THREE.PMREMGenerator(r);
        this.envCache.set(k, pm.fromEquirectangular(eq).texture);
        pm.dispose(); eq.dispose();
      }
      this.scene.environment = this.envCache.get(k);
      // studio map is authored camera-relative
      this.scene.environmentRotation.set(0, ((R.envRotation || 0) + (view.azimuth ?? 0)) * DEG, 0);
    } else {
      this.scene.environment = this.envTex;
      // envRotation: yaw of the reflection environment relative to the camera (degrees)
      this.scene.environmentRotation.set(0, ((R.envRotation || 0) + (view.azimuth ?? 0)) * DEG * (R.envRotation == null ? 0 : 1), 0);
    }

    // product
    if (this.root && this.root !== root) this.scene.remove(this.root);
    this.root = root; this.scene.add(root);
    root.updateMatrixWorld(true);
    // wall catchers (userData.catcher): moved out of the product for the bounds and floor bakes, and
    // rendered with the wall shadow-catcher material (restored to their parent after the render)
    const catchers = [];
    root.traverse((o) => { if (o.isMesh && o.userData.catcher) catchers.push({ o, parent: o.parent, mat: o.material }); });
    for (const c of catchers) {
      this.scene.attach(c.o);
      c.o.material = this.wallMat; c.o.castShadow = false; c.o.receiveShadow = true;
      const W = this.wallMat.uniforms;
      W.uAmb.value = R.wallAmbient ?? 0.4; W.uCK.value = R.wallContact ?? 0.35;
      const cs = c.o.userData.contacts || [];
      W.uC.value.forEach((v, k) => { const q = cs[k]; if (q) { const p = new THREE.Vector3(q[0], q[1], q[2]).applyMatrix4(c.parent.matrixWorld); v.set(p.x, p.y, p.z, q[3]); } else v.set(0, 0, 0, 0); });
    }
    root.updateMatrixWorld(true);
    root.traverse((o) => { if (o.isMesh) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(hookMaterial); } });
    const box = new THREE.Box3().setFromObject(root);
    box.min.y = Math.min(box.min.y, 0);

    // camera
    const cam = this.camera;
    cam.fov = view.fov; cam.aspect = width / height;
    cam.near = Math.max(0.02, view.distance * 0.05); cam.far = view.distance * 6 + 50;
    cam.position.copy(view.position); cam.up.set(0, 1, 0); cam.lookAt(view.target);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();

    const bgLin = srgbHexToLinear(bg);
    this.compositeMat.uniforms.uBg.value.copy(bgLin);
    this.outputMat.uniforms.uBg.value.copy(bgLin);
    let exposure = R.exposure;
    if (exposure === 'auto' || exposure == null) {
      const EA = { ...DEFAULT_RIG.exposureAuto, ...(rig.exposureAuto || {}) };
      const L = Math.max(0.005, productAlbedo(root));
      exposure = THREE.MathUtils.clamp(EA.base * Math.pow(EA.ref / L, EA.power), EA.min, EA.max);
    }
    this.lastExposure = exposure;
    this.compositeMat.uniforms.uExposure.value = exposure;
    this.compositeMat.uniforms.uShadowStrength.value = R.shadowStrength;
    this.compositeMat.uniforms.uToneMap.value = { neutral: 0, agx: 1, aces: 2, linear: 3 }[R.toneMapping] ?? 0;
    // neutral only: a later shoulder keeps more of the top range linear (white products)
    this.compositeMat.uniforms.uShoulder.value = R.shoulder ?? 0.76;
    this.compositeMat.uniforms.tFrame.value = this.rt.texture;
    this.outputMat.uniforms.tAccum.value = this.accum.texture;

    const camAz = view.azimuth ?? 0;
    const K = R.dome.count;
    this._ensureDome(K);
    const keyBase = dirFromAzEl(camAz + R.key.azimuth, R.key.elevation);
    const fillDir = dirFromAzEl(camAz + R.fill.azimuth, R.fill.elevation);
    const rimDir = dirFromAzEl(camAz + R.rim.azimuth, R.rim.elevation);
    // bake floor maps (AO + key softbox shadow) once for this view
    const ao = { ...DEFAULT_RIG.groundAO, ...(rig.groundAO || {}), contact: { ...DEFAULT_RIG.contact, ...(rig.contact || {}) } };
    // the floor shadow may come from a different (more overhead) direction than the
    // modelling key: classic packshot practice, keeps the shadow inside the footprint
    const FK = R.floorKey ? { ...R.key, ...R.floorKey } : R.key;
    const floorKeyDir = dirFromAzEl(camAz + FK.azimuth, FK.elevation);
    const eKey = FK.intensity * Math.max(0, floorKeyDir.y);
    const eRest = R.dome.intensity * 0.78 + R.fill.intensity * Math.max(0, fillDir.y) + R.rim.intensity * Math.max(0, rimDir.y);
    const keyShare = R.keyShadow ?? (eKey / (eKey + eRest)) * (1 - R.groundAmbient);
    this._bakeGroundAO(root, box, ao, floorKeyDir, FK.cone, ao.keySamples ?? 64);
    this.groundMat.uniforms.uAOStrength.value = ao.strength;
    this.groundMat.uniforms.uShadowFloor.value = R.shadowFloor || 0;
    this.groundMat.uniforms.uSplit.value = R.groundSplit ? 1 : 0;
    this.compositeMat.uniforms.uEdgeFade.value = R.edgeFade || 0;
    // backdropShade {at: [x, y, z] world, rx, ry (fractions of the frame), k}: a soft, slightly
    // darker zone of the sweep behind a light product (the photographer keeps the backdrop light
    // off the area behind a white canopy so its lit outline stays), fading to the exact backdrop
    // colour towards the frame edges
    if (R.backdropShade && R.backdropShade.k > 0) {
      const BS = R.backdropShade, q = new THREE.Vector3(...(BS.at || [0, 0, 0])).project(cam);
      this.compositeMat.uniforms.uBgShade.value.set((q.x + 1) / 2, (q.y + 1) / 2, BS.rx ?? 0.35, BS.ry ?? 0.25);
      this.compositeMat.uniforms.uBgShadeK.value = BS.k;
    } else this.compositeMat.uniforms.uBgShadeK.value = 0;
    this.groundMat.uniforms.uKeyShare.value = keyShare;
    const IN = R.interior;
    if (IN && IN.box) {
      globalUniforms.uIntBox.value.set(...IN.box);
      globalUniforms.uIntY.value.set(0, IN.top ?? box.max.y);
      globalUniforms.uIntK.value = IN.k ?? 0.12;
      this.groundMat.uniforms.uIntBox.value.set(...(IN.floorBox || IN.box));
      this.groundMat.uniforms.uIntFloor.value.set(IN.floor ?? 0.3, IN.feather ?? 0.12);
      // openings: [[x, z, weight], ...] (world), kNear on inward faces / floorNear on the floor
      // right inside an opening, falling off over `fall` m
      const ops = IN.openings || [];
      globalUniforms.uIntOpen.value.forEach((v, i) => { const o = ops[i]; if (o) v.set(o[0], o[1], 0, o[2] ?? 1); else v.set(0, 0, 0, 0); });
      globalUniforms.uIntNear.value.set(IN.kNear ?? (IN.k ?? 0.12), IN.fall ?? 1.5);
      globalUniforms.uIntAmb.value.set(IN.ambNear ?? 0, IN.amb ?? 0);
      this.groundMat.uniforms.uIntFloorNear.value = IN.floorNear ?? (IN.floor ?? 0.3);
    } else {
      globalUniforms.uIntK.value = 1;
      globalUniforms.uIntAmb.value.set(0, 0);
      this.groundMat.uniforms.uIntFloor.value.set(1, 0.1);
    }
    const bgC = new THREE.Color(bg);
    const bounceColor = new THREE.Color(1, 1, 1).lerp(bgC, 0.6);

    // static lights
    const setStatic = (l, dir, I, color = null) => {
      l.intensity = I; if (color) l.color.copy(color); else l.color.set(0xffffff);
      l.position.copy(box.getCenter(new THREE.Vector3())).addScaledVector(dir, 20); l.target.position.copy(box.getCenter(new THREE.Vector3()));
      l.updateMatrixWorld(); l.target.updateMatrixWorld();
    };
    setStatic(this.fill, fillDir, R.fill.intensity);
    setStatic(this.rim, rimDir, R.rim.intensity);
    // bounce: from below (floor bounce) by default; bounce.azimuth/elevation (camera-relative,
    // elevation < 0 = from below) turn it into a low front reflector card
    const bounceDir = R.bounce.elevation != null ? dirFromAzEl(camAz + (R.bounce.azimuth ?? 0), R.bounce.elevation) : new THREE.Vector3(0.15, -1, 0.25).normalize();
    setStatic(this.bounce, bounceDir, R.bounce.intensity, bounceColor);

    // clear accumulation
    r.setRenderTarget(this.accum);
    r.setClearColor(0x000000, 0); r.clear(true, false, false);
    this.quadScene.clear();

    const N = Math.max(1, samples | 0);
    const tmpKey = new THREE.Vector3();
    // spot key: key.distance (m) or key.distanceRel (x half-diagonal of the product box);
    // aim: key.aim (world) or key.aimRel [right, up, towards camera] (x half-diagonal,
    // camera-yaw frame) so the falloff lands on the same faces for every size and view
    const boxR = box.getSize(new THREE.Vector3()).length() / 2;
    const keyDist = R.key.distance || (R.key.distanceRel ? R.key.distanceRel * boxR : 0);
    const useSpot = keyDist > 0;
    this.keySpot.visible = useSpot; this.key.visible = !useSpot;
    const keyAim = box.getCenter(new THREE.Vector3());
    if (R.key.aim) keyAim.set(...R.key.aim);
    else if (R.key.aimRel) {
      const a = camAz * DEG, [ax, ay, az] = R.key.aimRel;
      keyAim.add(new THREE.Vector3(Math.cos(a) * ax * boxR + Math.sin(a) * az * boxR, ay * boxR, -Math.sin(a) * ax * boxR + Math.cos(a) * az * boxR));
    }
    const spotAuto = useSpot ? Math.atan((boxR * 1.15) / keyDist) / DEG : 30;
    // dome.tilt: tip the sky cap towards the key side (like negative fill on the far
    // side): the faces turned away from the key get less sky, so white products keep form
    let domeTiltQ = null;
    if (R.dome.tilt) {
      const toward = dirFromAzEl(camAz + (R.dome.tiltAzimuth ?? R.key.azimuth), 90 - R.dome.tilt);
      domeTiltQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), toward);
    }
    const t0 = performance.now();
    // depth of field (detail close-ups): view.aperture = lens radius in metres,
    // view.focus = focus distance (default: distance to the target)
    const aperture = view.aperture || 0;
    const focus = view.focus || view.position.distanceTo(view.target);
    const camRight = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const camUp = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const fpx = (height / 2) / Math.tan((view.fov * DEG) / 2);
    const eye0 = view.position.clone();
    for (let i = 0; i < N; i++) {
      // sub-pixel Gaussian jitter (sigma ~0.42 px)
      let jx = THREE.MathUtils.clamp(invNorm((halton(i + 1, 2) + 0.5 / N) % 1) * 0.42, -1.5, 1.5);
      let jy = THREE.MathUtils.clamp(invNorm((halton(i + 1, 3) + 0.5 / N) % 1) * 0.42, -1.5, 1.5);
      if (aperture > 0) {
        const [ax, ay] = squareToDisk(...r2(i, [0.52, 0.09]));
        const ox = ax * aperture, oy = ay * aperture;
        cam.position.copy(eye0).addScaledVector(camRight, ox).addScaledVector(camUp, oy);
        cam.updateMatrixWorld();
        // lens shift so points on the focus plane stay put
        jx -= (ox * fpx) / focus; jy += (oy * fpx) / focus;
      }
      cam.setViewOffset(width, height, jx, jy, width, height);

      // key light inside a cone (softbox)
      const [dx, dy] = squareToDisk(...r2(i, [0.137, 0.711]));
      const t1 = new THREE.Vector3().crossVectors(keyBase, new THREE.Vector3(0, 1, 0)).normalize();
      const t2 = new THREE.Vector3().crossVectors(t1, keyBase).normalize();
      const ct = Math.tan(R.key.cone * DEG);
      tmpKey.copy(keyBase).addScaledVector(t1, dx * ct).addScaledVector(t2, dy * ct).normalize();
      if (useSpot) {
        // softbox at distance D: jittered position, aimed at the aim point; intensity in
        // candela so the illuminance at the aim point equals key.intensity
        const sp = this.keySpot, Dk = keyDist;
        sp.position.copy(keyAim).addScaledVector(tmpKey, Dk);
        sp.target.position.copy(keyAim);
        sp.updateMatrixWorld(); sp.target.updateMatrixWorld();
        sp.intensity = R.key.intensity * Dk * Dk;
        sp.decay = 2; sp.distance = 0;
        sp.angle = (R.key.angle ?? spotAuto) * DEG; sp.penumbra = R.key.penumbra ?? 0.8;
        const sc = sp.shadow.camera;
        sc.near = Math.max(0.05, Dk - boxR * 1.2); sc.far = Dk + boxR * 3;
        sp.shadow.mapSize.set(R.key.mapSize, R.key.mapSize);
        sp.shadow.radius = R.key.radius; sp.shadow.bias = -0.0002; sp.shadow.normalBias = 0.004;
        sp.shadow.needsUpdate = true;
      } else {
        this.key.intensity = R.key.intensity;
        this._fitShadow(this.key, tmpKey, box, R.key.mapSize, R.key.radius);
      }

      // dome: cosine-weighted directions inside a zenith cap, stratified over frames
      const domeDirs = [];
      const cosMax = Math.cos(R.dome.maxZenith * DEG);
      for (let k = 0; k < K; k++) {
        const s = i * K + k + 1;
        const [u1, u2] = r2(s, [0.373, 0.291]);
        // cosine-weighted within the cap: sin^2(theta) uniform in [0, sin^2 max]
        const sin2 = u1 * (1 - cosMax * cosMax);
        const st = Math.sqrt(sin2), ctz = Math.sqrt(1 - sin2);
        const ph = u2 * Math.PI * 2;
        const d = new THREE.Vector3(st * Math.cos(ph), ctz, st * Math.sin(ph));
        if (domeTiltQ) d.applyQuaternion(domeTiltQ);
        domeDirs.push(d);
        const l = this.dome[k];
        l.intensity = R.dome.intensity / K;
        this._fitShadow(l, d, box, R.dome.mapSize, R.dome.radius);
      }

      globalUniforms.uFrameSeed.value = i + 1;
      globalUniforms.uKeyDirW.value.copy(tmpKey);
      globalUniforms.uKeyE.value = R.key.intensity;
      globalUniforms.uDomeE.value = R.dome.intensity;

      // beauty frame
      r.setRenderTarget(this.rt);
      r.setClearColor(0xffffff, 0);
      r.clear(true, true, false);
      r.render(this.scene, cam);

      // accumulate
      this.compositeMat.uniforms.uWeight.value = 1 / N;
      r.setRenderTarget(this.accum);
      this.quadScene.add(this.compositeQuad);
      r.render(this.quadScene, this.quadCam);
      this.quadScene.remove(this.compositeQuad);

      if (onProgress && (i % 4 === 3 || i === N - 1)) {
        // force sync so progress is honest
        const px = new Float32Array(4); r.readRenderTargetPixels(this.accum, 0, 0, 1, 1, px);
        onProgress(i + 1, N, performance.now() - t0);
        await new Promise((res) => setTimeout(res, 0));
      }
    }
    cam.clearViewOffset();
    cam.position.copy(eye0); cam.updateMatrixWorld();
    for (const c of catchers) { c.parent.attach(c.o); c.o.material = c.mat; }

    // output to canvas
    r.setRenderTarget(null);
    this.quadScene.add(this.outputQuad);
    r.render(this.quadScene, this.quadCam);
    this.quadScene.remove(this.outputQuad);
    return { ms: performance.now() - t0, exposure: this.lastExposure };
  }
}
