// Light that a hot or bright part throws on the parts round it (lighting group, round 4).
//
// Why. A glowing heater screen, a quartz tube or a flame only reads as *switched on* when the
// metal round it picks up its colour: the underside of the reflector hood turns orange, the guard
// rods get an orange edge, the burner pan and the reflector trough shine. The engine's lights are
// the studio's; product point lights would only add a highlight on metal (no diffuse) and change
// every shader's light count. So the spill is an emissive term instead, added in the material:
//
//   spill(material, sources, { key })  -> a clone of `material` that also emits
//     sum_i  colour_i * I_i * facing^p * R_i^2 / (R_i^2 + d_i^2)
//   d_i: distance from the fragment to source i (a segment A-B, or a point when A = B),
//   facing: max(0, n . direction to the closest point on the segment) (Lambert-like; `wrap`
//   lets light reach a little round the curve, for thin rods and rims).
//   Sources are in the mesh's own (object) frame: the frame the part's geometry was built in, so
//   a tilted lamp head or a rotated product carries its light along.
//
// Also: ember(h) colour ramp for glowing steel (deep red -> orange -> yellow-orange), designed in
// the engine's *output* space so the glow keeps its colour through the neutral tone curve
// (an emissive of 6 x orange tone-maps to a pale peach: that was the "pink plastic" heater).
import * as THREE from 'three';

const MAXS = 6;

// sources: [{ a: V3, b: V3 (optional, = a), color: [r,g,b], I, R, p (facing power, 1), wrap (0),
//            twoSided (false: |n . l|, for sheet parts whose normals may face either way) }]
// env: scale of the studio reflection (radiance) on this material: hot metal next to a glowing
// part is photographed darker than the bare studio would make it, so the glow carries
// (done in this shader, not with the engine's userData.envSpec: the engine's hook would replace
// this material's program cache key)
export function spill(base, sources, { key = '', env = 1 } = {}) {
  const m = base.clone();
  delete m.userData.__hooked;
  m.name = `${base.name || 'material'} +spill`;
  const n = Math.min(MAXS, sources.length);
  const A = [], B = [], C = [], S = [];
  for (let i = 0; i < MAXS; i++) {
    const s = sources[Math.min(i, n - 1)] || { a: new THREE.Vector3(), color: [0, 0, 0], I: 0, R: 1 };
    const a = s.a.clone(), b = (s.b || s.a).clone();
    A.push(a); B.push(b);
    C.push(new THREE.Vector3(s.color[0] * (i < n ? s.I : 0), s.color[1] * (i < n ? s.I : 0), s.color[2] * (i < n ? s.I : 0)));
    S.push(new THREE.Vector4(s.R ?? 0.2, s.p ?? 1, s.wrap ?? 0, s.twoSided ? 1 : 0));
  }
  m.userData.spillU = { uSpA: { value: A }, uSpB: { value: B }, uSpC: { value: C }, uSpS: { value: S } };
  const prev = base.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(m, sh, r);
    Object.assign(sh.uniforms, m.userData.spillU);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSpW; varying vec3 vSpN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vSpW = transformed; vSpN = objectNormal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
  radiance *= ${Number(env).toFixed(4)};`)
      .replace('#include <common>', `#include <common>
varying vec3 vSpW; varying vec3 vSpN;
uniform vec3 uSpA[ ${MAXS} ]; uniform vec3 uSpB[ ${MAXS} ]; uniform vec3 uSpC[ ${MAXS} ]; uniform vec4 uSpS[ ${MAXS} ];`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    // object-space normal of this fragment (flipped on the back of double-sided parts)
    vec3 nW = normalize( vSpN ) * ( gl_FrontFacing ? 1.0 : -1.0 );
    for ( int i = 0; i < ${MAXS}; i ++ ) {
      vec3 ab = uSpB[ i ] - uSpA[ i ];
      float t = clamp( dot( vSpW - uSpA[ i ], ab ) / max( dot( ab, ab ), 1e-8 ), 0.0, 1.0 );
      vec3 q = uSpA[ i ] + ab * t - vSpW;
      float d2 = dot( q, q );
      vec3 l = q * inversesqrt( max( d2, 1e-10 ) );
      float w = uSpS[ i ].z;
      float nl = dot( nW, l ); if ( uSpS[ i ].w > 0.5 ) nl = abs( nl );
      float f = pow( clamp( ( nl + w ) / ( 1.0 + w ), 0.0, 1.0 ), uSpS[ i ].y );
      float R2 = uSpS[ i ].x * uSpS[ i ].x;
      totalEmissiveRadiance += uSpC[ i ] * f * R2 / ( R2 + d2 );
    }
  }`);
  };
  const k0 = base.customProgramCacheKey ? base.customProgramCacheKey.bind(base) : () => '';
  m.customProgramCacheKey = () => `spill:${k0()}:${key}:${env}`;
  m.needsUpdate = true;
  return m;
}

// glowing steel colour by temperature-ish h (0..1), as linear radiance that tone-maps to a
// saturated glow: 0.25 dull red, 0.6 red-orange, 1 orange with a yellow edge
export const EMBER_GLSL = `
vec3 ember( float h ) {
  h = clamp( h, 0.0, 1.0 );
  vec3 c0 = vec3( 0.16, 0.012, 0.003 );
  vec3 c1 = vec3( 0.62, 0.06, 0.010 );
  vec3 c2 = vec3( 1.16, 0.22, 0.030 );
  vec3 c3 = vec3( 1.75, 0.70, 0.140 );
  return h < 0.35 ? mix( c0, c1, h / 0.35 ) : h < 0.72 ? mix( c1, c2, ( h - 0.35 ) / 0.37 ) : mix( c2, c3, ( h - 0.72 ) / 0.28 );
}`;
