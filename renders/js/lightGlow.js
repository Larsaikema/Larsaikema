// Noise-free light for the packshot engine (lighting group): glowing bulbs, see-through glass,
// bloom halos and light pools on the floor, without editing js/engine.js.
//
// Why. The engine composites every accumulated frame per pixel: alpha >= 0.5 is product
// (radiance, tone-mapped), alpha 0.25 is floor (received-light ratio), 0 is backdrop. Blended
// transparency does not exist, so the first lighting renders drew glass and glow by *stochastic
// coverage* (a pixel is opaque in a fraction of the frames). With 16-40 frames that leaves a
// visible speckle in every halo, glass bulb and flame.
//
// How. A product adds one `GlowComp`. Its full-screen combine mesh is drawn last in each beauty
// frame (transparent list, renderOrder 1000). Just before it draws (onBeforeRender) it
//   1. blits the beauty frame so far (product radiance + floor encoding) into a copy texture,
//   2. renders two private scenes with the same jittered camera:
//        inner  - what is seen *through* glass: env reflections of the glass walls (additive,
//                 rgb) with the walls' transmission multiplied into alpha, filament line glow,
//                 volume glow, flames (all additive radiance),
//        bloom  - lens glow around bright lights (additive radiance, not occluded),
//   3. writes, for every pixel that glass, bloom or a floor pool touches, the final radiance:
//        under * T + inner + bloom,
//      where `under` is the product radiance from the copy, or for floor/backdrop pixels the
//      radiance that tone-maps exactly to backdrop x shadow ratio (+ the light pool: backdrop x
//      irradiance), found with the inverse of the engine's Khronos-neutral tone curve.
// Glass is marked in the beauty pass by `marker` meshes (renderOrder 1, after all opaque parts):
// they keep the colour underneath and add 4 to alpha, so the combine pass knows which pixels are
// visible glass (depth-tested against everything in front) and what lies behind them.
// All light is analytic or geometric, so 1 frame or 40 give the same smooth result.
import * as THREE from 'three';

const MARK = 4.0;

// ---------------------------------------------------------------------------------------
// shared materials

const markerMats = new Map();
export function markerMaterial(side = THREE.FrontSide) {
  if (!markerMats.has(side)) markerMats.set(side, new THREE.ShaderMaterial({
    name: 'glass marker',
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
    fragmentShader: `void main() { gl_FragColor = vec4( 0.0, 0.0, 0.0, ${MARK.toFixed(1)} ); }`,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    depthWrite: false, side,
  }));
  return markerMats.get(side);
}

const additive = {
  transparent: true, depthTest: false, depthWrite: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
};

const multiply = {
  transparent: true, depthTest: false, depthWrite: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
  blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
};
// transmission of a glass wall (trans pass): a flat (r,g,b) factor
const transMats = new Map();
function wallTransMaterial(T, side) {
  const k = `${T.join(',')}:${side}`;
  if (!transMats.has(k)) transMats.set(k, new THREE.ShaderMaterial({
    name: 'glass transmission', side, ...multiply,
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
    fragmentShader: `void main() { gl_FragColor = vec4( ${T.map((v) => v.toFixed(4)).join(', ')}, 1.0 ); }`,
  }));
  return transMats.get(k);
}

// Glass wall seen from the camera: only the specular reflection of the studio (black base,
// dielectric), added; its transmission multiplies the alpha of the inner target.
const shellMats = new Map();
export function glassShellMaterial({ T = 0.93, env = 1.0, rough = 0.04, glow = null, glowI = 0, side = THREE.DoubleSide } = {}) {
  const k = `${T}:${env}:${rough}:${glow}:${glowI}:${side}`;
  if (!shellMats.has(k)) {
    const m = new THREE.MeshPhysicalMaterial({
      name: 'glass shell (inner pass)', color: 0x000000, metalness: 0, roughness: rough, ior: 1.5, specularIntensity: 1,
      envMapIntensity: env, emissive: glow ? new THREE.Color(glow) : new THREE.Color(0), emissiveIntensity: glowI,
      opacity: T, side, ...additive,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.SrcAlphaFactor,
    });
    shellMats.set(k, m);
  }
  return shellMats.get(k);
}

// bloom passes accumulate premultiplied colour in rgb and coverage in alpha
const additiveA = { ...additive, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };

// halo / volume / line glows: analytic, per pixel, from the view ray (camera position + the
// fragment's world position on a back face of a convex proxy, so each pixel is shaded once)
const haloVS = `attribute vec3 aCenter; attribute vec4 aGlow; attribute vec3 aShape;
varying vec3 vW; varying vec3 vC; varying vec4 vG; varying vec3 vS;
void main() {
  vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz;
  vC = ( modelMatrix * vec4( aCenter, 1.0 ) ).xyz; vG = aGlow; vS = aShape;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
let haloMat = null;
function haloMaterial() {
  if (!haloMat) haloMat = new THREE.ShaderMaterial({
    name: 'bloom halo', vertexShader: haloVS, side: THREE.BackSide, ...additiveA,
    fragmentShader: `varying vec3 vW; varying vec3 vC; varying vec4 vG; varying vec3 vS;
void main() {
  vec3 d = normalize( vW - cameraPosition );
  vec3 oc = vC - cameraPosition;
  float x = length( oc - d * dot( oc, d ) ) / vS.x;
  // tight core + wide tail, windowed to zero at the proxy sphere
  float q = vS.z * exp( - x * x / ( vS.y * vS.y ) ) + ( 1.0 - vS.z ) * exp( - x * x / 0.12 );
  q *= 1.0 - smoothstep( 0.6, 1.0, x );
  float a = vG.a * q;
  gl_FragColor = vec4( vG.rgb * a, a );
}`,
  });
  return haloMat;
}
// attenuation of a glowing medium (trans pass): exp(-sigma_rgb * chord / R), sigma in aGlow.rgb
let volTransMat = null;
function volumeTransMaterial() {
  if (!volTransMat) volTransMat = new THREE.ShaderMaterial({
    name: 'volume attenuation', vertexShader: haloVS, side: THREE.BackSide, ...multiply,
    fragmentShader: `varying vec3 vW; varying vec3 vC; varying vec4 vG; varying vec3 vS;
void main() {
  vec3 d = normalize( vW - cameraPosition );
  vec3 oc = vC - cameraPosition;
  float x = length( oc - d * dot( oc, d ) ) / vS.x;
  if ( x >= 1.0 ) discard;
  // chord through the sphere, softened at the rim (no crease where two hazes overlap)
  float chord = 2.0 * pow( 1.0 - x * x, 1.25 );
  gl_FragColor = vec4( exp( - vG.rgb * vG.a * chord ), 1.0 );
}`,
  });
  return volTransMat;
}
// volume glow of a lit glass globe: brightness ~ chord length through the sphere (aShape.x = R)
let volMat = null;
function volumeMaterial() {
  if (!volMat) volMat = new THREE.ShaderMaterial({
    name: 'volume glow', vertexShader: haloVS, side: THREE.BackSide, ...additive,
    fragmentShader: `varying vec3 vW; varying vec3 vC; varying vec4 vG; varying vec3 vS;
void main() {
  vec3 d = normalize( vW - cameraPosition );
  vec3 oc = vC - cameraPosition;
  float x = length( oc - d * dot( oc, d ) ) / vS.x;
  if ( x >= 1.0 ) discard;
  float chord = sqrt( 1.0 - x * x );
  float q = pow( chord, vS.y ) + vS.z * exp( - x * x / 0.08 );
  gl_FragColor = vec4( vG.rgb * vG.a * q, 1.0 );
}`,
  });
  return volMat;
}
// line glow (LED filaments, heating wires): distance between the view ray and a segment
// attributes: aA, aB (segment ends), aGlow (rgb, intensity), aShape (sigma core, sigma wide, wide weight)
let lineMat = null;
function lineMaterial() {
  if (!lineMat) lineMat = new THREE.ShaderMaterial({
    name: 'line glow', side: THREE.BackSide, ...additive,
    vertexShader: `attribute vec3 aA; attribute vec3 aB; attribute vec4 aGlow; attribute vec3 aShape;
varying vec3 vW; varying vec3 vA; varying vec3 vB; varying vec4 vG; varying vec3 vS;
void main() {
  vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz;
  vA = ( modelMatrix * vec4( aA, 1.0 ) ).xyz; vB = ( modelMatrix * vec4( aB, 1.0 ) ).xyz;
  vG = aGlow; vS = aShape;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: `varying vec3 vW; varying vec3 vA; varying vec3 vB; varying vec4 vG; varying vec3 vS;
void main() {
  vec3 o = cameraPosition, d = normalize( vW - cameraPosition );
  vec3 u = vB - vA, w0 = vA - o;
  float A = dot( u, u ), B = dot( u, d ), Dd = dot( u, w0 ), E = dot( d, w0 );
  float den = A - B * B;
  float s = den > 1e-12 ? clamp( ( B * E - Dd ) / den, 0.0, 1.0 ) : 0.0;
  vec3 p = vA + s * u - o;
  float r = length( p - d * dot( p, d ) );
  float q = exp( - r * r / ( 2.0 * vS.x * vS.x ) ) + vS.z * exp( - r * r / ( 2.0 * vS.y * vS.y ) );
  gl_FragColor = vec4( vG.rgb * vG.a * q, 1.0 );
}`,
  });
  return lineMat;
}
// any geometry with a per-vertex additive radiance (flames): aGlow.rgb * aGlow.a
let surfMat = null;
function surfaceMaterial() {
  if (!surfMat) surfMat = new THREE.ShaderMaterial({
    name: 'surface glow', side: THREE.DoubleSide, ...additive,
    vertexShader: `attribute vec4 aGlow; varying vec4 vG;
void main() { vG = aGlow; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: `uniform float uK; varying vec4 vG;
void main() { gl_FragColor = vec4( vG.rgb * uK, 1.0 ); }`,
    uniforms: { uK: { value: 1 } },
  });
  return surfMat;
}

// ---------------------------------------------------------------------------------------
// combine pass

const combineFS = `
precision highp float;
uniform sampler2D tA, tIn, tBl, tPool, tTr;
uniform vec3 uHas;            // inner, bloom, pool present
uniform vec4 uPoolBox;        // x0, z0, 1/w, 1/d
uniform vec2 uRes;
uniform mat4 uProjInv, uCamWorld;
uniform vec3 uCamPos;
uniform vec3 uBg;
uniform float uExposure, uShadowStrength, uShoulder, uEdgeFade;
uniform int uToneMap;
uniform float uBloomK;
vec3 neutralInv( vec3 o ) {
  const float D = 0.15;
  float S = uShoulder, d = 1.0 - S;
  vec3 c1 = o;
  float np = max( o.r, max( o.g, o.b ) );
  if ( np >= S ) {
    np = min( np, 0.9993 );
    float peak = d * d / ( 1.0 - np ) - d + S;
    float g = 1.0 - 1.0 / ( D * ( peak - np ) + 1.0 );
    vec3 c2 = ( o - g * np ) / max( 1.0 - g, 1e-4 );
    c1 = c2 * peak / np;
  }
  float y = max( min( c1.r, min( c1.g, c1.b ) ), 0.0 );
  float off = y >= 0.04 ? 0.04 : sqrt( y / 6.25 ) - y;
  return c1 + off;
}
vec3 neutralTM( vec3 color ) {
  float S = uShoulder; const float Desaturation = 0.15;
  float x = min( color.r, min( color.g, color.b ) );
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max( color.r, max( color.g, color.b ) );
  if ( peak < S ) return color;
  float d = 1. - S;
  float newPeak = 1. - d * d / ( peak + d - S );
  color *= newPeak / peak;
  float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
  return mix( color, vec3( newPeak ), g );
}
vec3 toOutput( vec3 rad ) { vec3 c = max( rad, 0.0 ) * uExposure; return uToneMap == 3 ? clamp( c, 0.0, 1.0 ) : neutralTM( c ); }
vec3 toRadiance( vec3 o ) {
  o = clamp( o, 0.0, 0.9993 );
  vec3 c = uToneMap == 3 ? o : neutralInv( o );
  return max( c, 0.0 ) / uExposure;
}
// soft limit for light added to the backdrop (keeps the inverse tone curve finite)
vec3 softCap( vec3 c ) {
  const float k = 0.86;
  return mix( c, k + ( 0.995 - k ) * ( 1.0 - exp( - ( c - k ) / ( 0.995 - k ) ) ), step( k, c ) );
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 s = texture2D( tA, uv );
  float nG = floor( ( s.a + 0.01 ) / ${MARK.toFixed(1)} );
  float a0 = s.a - ${MARK.toFixed(1)} * nG;
  vec3 inner = vec3( 0.0 ), trans = vec3( 1.0 );
  if ( nG > 0.5 && uHas.x > 0.5 ) { inner = texture2D( tIn, uv ).rgb; trans = texture2D( tTr, uv ).rgb; }
  // bloom: premultiplied colour (rgb) and coverage (a), mixed towards the light's colour in
  // output space (as a photographed glow), not added (which would only wash out to white)
  vec4 bl = uHas.y > 0.5 ? texture2D( tBl, uv ) : vec4( 0.0 );
  bool prod = a0 >= 0.5;
  vec4 pool = vec4( 0.0 );
  if ( !prod && uHas.z > 0.5 ) {
    vec4 pv = uProjInv * vec4( uv * 2.0 - 1.0, 1.0, 1.0 );
    vec3 dW = normalize( ( uCamWorld * vec4( pv.xyz / pv.w, 0.0 ) ).xyz );
    if ( dW.y < -1e-4 ) {
      vec3 P = uCamPos + dW * ( - uCamPos.y / dW.y );
      vec2 pu = ( P.xz - uPoolBox.xy ) * uPoolBox.zw;
      if ( pu.x > 0.0 && pu.x < 1.0 && pu.y > 0.0 && pu.y < 1.0 ) pool = texture2D( tPool, pu );
    }
  }
  if ( nG < 0.5 && bl.a < 1e-4 && pool.a < 1e-4 ) discard;
  vec3 o;
  if ( prod || nG > 0.5 ) {
    vec3 rad = prod ? s.rgb : vec3( 0.0 );
    if ( !prod ) {
      float ratio = a0 > 0.1 ? clamp( s.r, 0.0, 1.0 ) : 1.0;
      float intF = ( a0 > 0.1 && a0 < 0.5 ) ? clamp( s.g, 0.0, 1.0 ) : 1.0;
      rad = toRadiance( uBg * mix( 1.0, ratio, uShadowStrength ) * intF );
    }
    o = toOutput( rad * trans + inner );
  } else {
    float ratio = a0 > 0.1 ? clamp( s.r, 0.0, 1.0 ) : 1.0;
    if ( uEdgeFade > 0.0 ) {
      float e = min( min( uv.x, 1.0 - uv.x ), min( uv.y, 1.0 - uv.y ) );
      ratio = mix( 1.0, ratio, smoothstep( 0.004, uEdgeFade, e ) );
    }
    float intF = ( a0 > 0.1 && a0 < 0.5 ) ? clamp( s.g, 0.0, 1.0 ) : 1.0;
    o = uBg * mix( 1.0, ratio, uShadowStrength ) * intF;
    // the pool: the floor takes on the light's colour (rgb = mean colour, a = strength)
    if ( pool.a > 1e-4 ) o = mix( o, toOutput( pool.rgb ), clamp( pool.a, 0.0, 0.95 ) );
  }
  if ( bl.a > 1e-4 ) {
    float k = prod && nG < 0.5 ? 0.12 : ( nG > 0.5 ? 0.45 : 1.0 );
    vec3 c = toOutput( bl.rgb / bl.a );
    o = mix( o, c, clamp( bl.a, 0.0, 0.95 ) * k );
  }
  vec3 rad = toRadiance( o );
  gl_FragColor = vec4( rad, 1.0 );
}`;

function halfTex(w, h, data) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}
const BLACK = halfTex(1, 1, new Uint16Array([0, 0, 0, 0]));

let targets = null; // shared by all GlowComps (one render at a time)
function ensureTargets(w, h) {
  if (targets && targets.w === w && targets.h === h) return targets;
  if (targets) { targets.copy.dispose(); targets.inner.dispose(); targets.bloom.dispose(); targets.trans.dispose(); }
  const mk = () => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  targets = { w, h, copy: mk(), inner: mk(), bloom: mk(), trans: mk() };
  return targets;
}

export class GlowComp {
  constructor({ name = 'glow' } = {}) {
    this.name = name;
    this.innerScene = new THREE.Scene(); this.bloomScene = new THREE.Scene(); this.transScene = new THREE.Scene();
    this.innerRoot = new THREE.Group(); this.bloomRoot = new THREE.Group(); this.transRoot = new THREE.Group();
    for (const r of [this.innerRoot, this.bloomRoot, this.transRoot]) r.matrixAutoUpdate = false;
    this.innerScene.add(this.innerRoot); this.bloomScene.add(this.bloomRoot); this.transScene.add(this.transRoot);
    this.pool = null; this.bloomK = 1;
    this.halos = []; this.vols = []; this.lines = [];
  }

  isEmpty() {
    return !this.pool && !this.halos.length && !this.vols.length && !this.lines.length
      && !this.innerRoot.children.length && !this.bloomRoot.children.length;
  }

  // --- glass ---------------------------------------------------------------------------
  // visible-glass marker for the beauty pass (add the returned mesh to the product)
  marker(geo, { side = THREE.FrontSide } = {}) {
    const m = new THREE.Mesh(geo, markerMaterial(side));
    m.renderOrder = 1; m.castShadow = false; m.receiveShadow = false; m.name = 'glass marker';
    m.userData.contactProxy = true; // not counted in the auto-exposure albedo
    return m;
  }
  // glass wall: marker in the beauty pass + reflection/transmission shell in the inner pass
  // opts.T: transmission (number or [r,g,b]); env, rough: reflection
  glass(geo, opts = {}) {
    const T = Array.isArray(opts.T) ? opts.T : [opts.T ?? 0.93, opts.T ?? 0.93, opts.T ?? 0.93];
    const shell = new THREE.Mesh(geo, glassShellMaterial({ ...opts, T: 1 }));
    this.innerRoot.add(shell);
    this.transRoot.add(new THREE.Mesh(geo, wallTransMaterial(T, opts.side ?? THREE.DoubleSide)));
    return this.marker(geo, { side: opts.markerSide ?? THREE.FrontSide });
  }
  // any additive mesh seen through glass (e.g. a flame): material must be additive
  addInner(mesh) { this.innerRoot.add(mesh); return mesh; }
  addBloom(mesh) { this.bloomRoot.add(mesh); return mesh; }

  // --- analytic glows ------------------------------------------------------------------
  // bloom halo: { c: V3, R, color: [r,g,b] radiance (tone-mapped), I: peak mix towards it (0..1),
  //   core (rel. width), coreW }
  halo(h) { this.halos.push(h); }
  // volume glow inside a glass globe (inner pass): { c, R, color, I, p (chord exponent), core,
  //   sigma: [r,g,b] attenuation per radius of the glowing haze (trans pass), optional }
  volume(v) { this.vols.push(v); }
  // line glow (inner pass): { a: V3, b: V3, color, I, s1, s2, w2 }
  line(l) { this.lines.push(l); }
  // flame / glowing gas: geometry with aGlow (premultiplied rgb, coverage) -> inner pass
  surface(geo, { inner = true } = {}) {
    const m = new THREE.Mesh(geo, surfaceMaterial());
    (inner ? this.innerRoot : this.bloomRoot).add(m);
    return m;
  }
  // bloom along a polyline: pts V3[], R, color, I (or iFn(t)), core, coreW
  haloTube(pts, R, color, I, { core = 0.3, coreW = 0.7, radial = 20, iFn = null } = {}) {
    const pos = [], idx = [], cen = [], glow = [], shape = [];
    const n = pts.length;
    const T = pts.map((p, i) => pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize());
    let nrm = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    nrm.addScaledVector(T[0], -nrm.dot(T[0])).normalize();
    for (let i = 0; i < n; i++) {
      if (i > 0) { const q = new THREE.Quaternion().setFromUnitVectors(T[i - 1], T[i]); nrm.applyQuaternion(q); nrm.addScaledVector(T[i], -nrm.dot(T[i])).normalize(); }
      const b = new THREE.Vector3().crossVectors(T[i], nrm);
      const Ii = iFn ? iFn(i / Math.max(1, n - 1)) : I;
      for (let k = 0; k <= radial; k++) {
        const t = (k / radial) * Math.PI * 2;
        const p = pts[i].clone().addScaledVector(nrm, Math.cos(t) * R * 1.03).addScaledVector(b, Math.sin(t) * R * 1.03);
        pos.push(p.x, p.y, p.z); cen.push(pts[i].x, pts[i].y, pts[i].z);
        glow.push(color[0], color[1], color[2], Ii); shape.push(R, core, coreW);
      }
    }
    const row = radial + 1;
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < radial; k++) {
      const p0 = i * row + k, p1 = p0 + 1, p2 = p0 + row, p3 = p2 + 1;
      idx.push(p0, p1, p2, p1, p3, p2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aCenter', new THREE.Float32BufferAttribute(cen, 3));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
    g.setAttribute('aShape', new THREE.Float32BufferAttribute(shape, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, haloMaterial()); m.frustumCulled = false;
    this.bloomRoot.add(m);
    return m;
  }

  // --- floor light pool ----------------------------------------------------------------
  // sources: [{ p: V3, I, color: [r,g,b] (radiance) }]; E = sum I * h / (h^2 + r^2)^1.5 (Lambert +
  // 1/r^2); the floor is mixed towards the light colour by k * E, capped softly at `max`;
  // `occl(x, z, s)` optionally scales a source at a floor point.
  floorPool(sources, { pad = 0.4, res = 192, k = 1, max = 0.5, minH = 0.01, occl = null } = {}) {
    if (!sources.length) return;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const s of sources) { x0 = Math.min(x0, s.p.x); x1 = Math.max(x1, s.p.x); z0 = Math.min(z0, s.p.z); z1 = Math.max(z1, s.p.z); }
    x0 -= pad; x1 += pad; z0 -= pad; z1 += pad;
    const span = Math.max(x1 - x0, z1 - z0);
    const nx = Math.max(16, Math.round(res * (x1 - x0) / span)), nz = Math.max(16, Math.round(res * (z1 - z0) / span));
    const data = new Uint16Array(nx * nz * 4);
    const H = THREE.DataUtils.toHalfFloat;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + (x1 - x0) * ((i + 0.5) / nx), z = z0 + (z1 - z0) * ((j + 0.5) / nz);
      let r = 0, g = 0, b = 0, E = 0;
      for (const s of sources) {
        const h = Math.max(minH, s.p.y), dx = x - s.p.x, dz = z - s.p.z;
        let e = s.I * h / Math.pow(h * h + dx * dx + dz * dz, 1.5);
        if (occl) e *= occl(x, z, s);
        E += e; r += e * s.color[0]; g += e * s.color[1]; b += e * s.color[2];
      }
      // rgb: mean light colour (radiance units, tone-mapped in the combine); a: strength, capped softly
      const a = max * (1 - Math.exp(-(k * E) / max));
      const o = (j * nx + i) * 4, iE = E > 1e-9 ? 1 / E : 0;
      data[o] = H(r * iE); data[o + 1] = H(g * iE); data[o + 2] = H(b * iE); data[o + 3] = H(a);
    }
    this.pool = { tex: halfTex(nx, nz, data), box: new THREE.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)) };
  }

  // --- build -----------------------------------------------------------------------------
  _buildAnalytic() {
    const ico = new THREE.IcosahedronGeometry(1, 2);
    const bp = ico.attributes.position;
    const sphereSet = (list, mat, root, scale = 1.06) => {
      if (!list.length) return;
      const pos = [], cen = [], glow = [], shape = [];
      for (const h of list) for (let i = 0; i < bp.count; i++) {
        pos.push(h.c.x + bp.getX(i) * h.R * scale, h.c.y + bp.getY(i) * h.R * scale, h.c.z + bp.getZ(i) * h.R * scale);
        cen.push(h.c.x, h.c.y, h.c.z);
        glow.push(h.color[0], h.color[1], h.color[2], h.I);
        shape.push(h.R, h.core ?? h.p ?? 0.25, h.coreW ?? h.rim ?? 0.6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aCenter', new THREE.Float32BufferAttribute(cen, 3));
      g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
      g.setAttribute('aShape', new THREE.Float32BufferAttribute(shape, 3));
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; root.add(m);
    };
    sphereSet(this.halos, haloMaterial(), this.bloomRoot);
    sphereSet(this.vols.map((v) => ({ ...v, core: v.p ?? 0.7, coreW: v.core ?? 0.0 })), volumeMaterial(), this.innerRoot, 1.0);
    sphereSet(this.vols.filter((v) => v.sigma).map((v) => ({ ...v, color: v.sigma, I: 1 })), volumeTransMaterial(), this.transRoot, 1.0);
    ico.dispose();
    if (this.lines.length) {
      // a box around each segment, enlarged by 3.5 sigma (wide)
      const pos = [], A = [], B = [], glow = [], shape = [], idx = [];
      const box = new THREE.BoxGeometry(1, 1, 1);
      const bpos = box.attributes.position, bidx = box.index;
      for (const l of this.lines) {
        const a = l.a, b = l.b, u = b.clone().sub(a), len = u.length(); u.normalize();
        const ref = Math.abs(u.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const v = new THREE.Vector3().crossVectors(u, ref).normalize(), w = new THREE.Vector3().crossVectors(u, v);
        const rr = 3.5 * Math.max(l.s1 ?? 0.0006, (l.w2 ?? 0) > 0 ? (l.s2 ?? 0.003) : 0);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const off = pos.length / 3;
        for (let i = 0; i < bpos.count; i++) {
          const p = mid.clone().addScaledVector(u, bpos.getX(i) * (len + 2 * rr)).addScaledVector(v, bpos.getY(i) * 2 * rr).addScaledVector(w, bpos.getZ(i) * 2 * rr);
          pos.push(p.x, p.y, p.z); A.push(a.x, a.y, a.z); B.push(b.x, b.y, b.z);
          glow.push(l.color[0], l.color[1], l.color[2], l.I); shape.push(l.s1 ?? 0.0006, l.s2 ?? 0.003, l.w2 ?? 0);
        }
        for (let i = 0; i < bidx.count; i++) idx.push(off + bidx.getX(i));
      }
      box.dispose();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
      g.setAttribute('aShape', new THREE.Float32BufferAttribute(shape, 3));
      g.setIndex(idx);
      const m = new THREE.Mesh(g, lineMaterial()); m.frustumCulled = false; this.innerRoot.add(m);
    }
  }

  // The combine mesh. `centre`: a point inside the product (the mesh's bounds collapse to it, so
  // it never changes the engine's product box / shadow fitting).
  build(centre = new THREE.Vector3(0, 0.01, 0)) {
    this._buildAnalytic();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    geo.boundingBox = new THREE.Box3(centre.clone(), centre.clone());
    geo.boundingSphere = new THREE.Sphere(centre.clone(), 0);
    const hasInner = this.innerRoot.children.length > 0, hasBloom = this.bloomRoot.children.length > 0;
    const mat = new THREE.ShaderMaterial({
      name: 'glow combine',
      uniforms: {
        tA: { value: null }, tIn: { value: BLACK }, tTr: { value: BLACK }, tBl: { value: BLACK }, tPool: { value: this.pool ? this.pool.tex : BLACK },
        uHas: { value: new THREE.Vector3(hasInner ? 1 : 0, hasBloom ? 1 : 0, this.pool ? 1 : 0) },
        uPoolBox: { value: this.pool ? this.pool.box : new THREE.Vector4(0, 0, 1, 1) },
        uRes: { value: new THREE.Vector2(1, 1) }, uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
        uBg: { value: new THREE.Vector3(0.84, 0.78, 0.67) }, uExposure: { value: 1 }, uShadowStrength: { value: 0.92 }, uShoulder: { value: 0.76 }, uEdgeFade: { value: 0.07 }, uToneMap: { value: 0 },
        uBloomK: { value: this.bloomK },
      },
      vertexShader: 'void main() { gl_Position = vec4( position.xy, 0.0, 1.0 ); }',
      fragmentShader: combineFS,
      transparent: true, blending: THREE.NoBlending, depthTest: false, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `${this.name} combine`;
    mesh.frustumCulled = false; mesh.renderOrder = 1000; mesh.castShadow = false; mesh.receiveShadow = false;
    mesh.userData.noFrame = true; mesh.userData.contactProxy = true;
    const self = this;
    const prevClear = new THREE.Color();
    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const rt = renderer.getRenderTarget();
      if (material !== mat || !rt || !camera.isPerspectiveCamera) { geometry.setDrawRange(0, 0); return; }
      geometry.setDrawRange(0, Infinity);
      const T = ensureTargets(rt.width, rt.height);
      const gl = renderer.getContext(), state = renderer.state, props = renderer.properties;
      // 1. copy the beauty frame so far
      renderer.initRenderTarget(T.copy);
      const srcFB = props.get(rt).__webglFramebuffer, dstFB = props.get(T.copy).__webglFramebuffer;
      state.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFB);
      state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFB);
      gl.blitFramebuffer(0, 0, rt.width, rt.height, 0, 0, rt.width, rt.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, srcFB);
      state.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFB);
      // 2. inner + bloom passes with the same (jittered) camera
      const wm = mesh.matrixWorld;
      self.innerRoot.matrix.copy(wm); self.bloomRoot.matrix.copy(wm); self.transRoot.matrix.copy(wm);
      const st = window.__studio;
      if (st) {
        for (const sc of [self.innerScene]) {
          sc.environment = st.scene.environment; sc.environmentRotation.copy(st.scene.environmentRotation); sc.environmentIntensity = st.scene.environmentIntensity;
        }
      }
      renderer.getClearColor(prevClear); const prevAlpha = renderer.getClearAlpha();
      const prevAuto = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
      if (hasInner) {
        renderer.setRenderTarget(T.inner); renderer.setClearColor(0x000000, 1); renderer.clear(true, false, false);
        renderer.render(self.innerScene, camera);
        renderer.setRenderTarget(T.trans); renderer.setClearColor(0xffffff, 1); renderer.clear(true, false, false);
        renderer.render(self.transScene, camera);
      }
      if (hasBloom) {
        renderer.setRenderTarget(T.bloom); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
        renderer.render(self.bloomScene, camera);
      }
      renderer.shadowMap.autoUpdate = prevAuto;
      renderer.setClearColor(prevClear, prevAlpha);
      renderer.setRenderTarget(rt);
      // 3. uniforms
      const u = mat.uniforms;
      u.tA.value = T.copy.texture;
      if (hasInner) { u.tIn.value = T.inner.texture; u.tTr.value = T.trans.texture; }
      if (hasBloom) u.tBl.value = T.bloom.texture;
      u.uRes.value.set(rt.width, rt.height);
      u.uProjInv.value.copy(camera.projectionMatrixInverse);
      u.uCamWorld.value.copy(camera.matrixWorld);
      u.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
      if (st) {
        const cu = st.compositeMat.uniforms;
        u.uBg.value.copy(cu.uBg.value); u.uExposure.value = cu.uExposure.value; u.uShadowStrength.value = cu.uShadowStrength.value;
        u.uShoulder.value = cu.uShoulder.value; u.uEdgeFade.value = cu.uEdgeFade.value; u.uToneMap.value = cu.uToneMap.value;
      }
    };
    return mesh;
  }
}

// colour helpers
export function linCol(hex, k = 1) { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; }
// approximate blackbody colour (linear sRGB, normalised to max 1) for a CCT in kelvin
export function kelvin(K) {
  const t = K / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
  const c = new THREE.Color().setRGB(Math.min(255, Math.max(0, r)) / 255, Math.min(255, Math.max(0, g)) / 255, Math.min(255, Math.max(0, b)) / 255, THREE.SRGBColorSpace);
  const m = Math.max(c.r, c.g, c.b);
  return [c.r / m, c.g / m, c.b / m];
}
