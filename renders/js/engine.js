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
import { setMaxAnisotropy } from './textures.js';

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
};

function hookMaterial(mat) {
  if (mat.userData.__hooked) return;
  mat.userData.__hooked = true;
  const stoch = mat.userData.stochasticAlpha;
  const transl = mat.userData.translucency;
  if (stoch == null && !transl) return;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    Object.assign(shader.uniforms, globalUniforms);
    let fs = shader.fragmentShader;
    const head = `uniform float uFrameSeed; uniform vec3 uKeyDirW; uniform float uKeyE; uniform float uDomeE;
float stochHash( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * 0.1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
`;
    fs = head + fs;
    if (stoch != null) {
      fs = fs.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
  if ( stochHash( gl_FragCoord.xy + vec2( uFrameSeed * 17.0, uFrameSeed * 31.0 ) ) > ${Number(stoch).toFixed(4)} ) discard;`);
    }
    if (transl) {
      // Light passing through thin fabric, seen from the shaded side.
      fs = fs.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    vec3 nW = inverseTransformDirection( normal, viewMatrix );
    vec3 nBack = -nW; // the other side of the sheet
    float through = uKeyE * max( 0.0, dot( nBack, uKeyDirW ) ) + uDomeE * max( 0.0, nBack.y ) * 0.8;
    float facingAway = max( 0.0, -dot( nW, uKeyDirW ) );
    totalEmissiveRadiance += diffuseColor.rgb * ${Number(transl).toFixed(4)} * through * RECIPROCAL_PI * mix( 0.6, 1.0, facingAway );
  }`);
    }
    shader.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => `hk:${stoch}:${transl}`;
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
varying vec2 vUv;
vec3 neutralTM( vec3 color ) {
  const float StartCompression = 0.8 - 0.04; const float Desaturation = 0.15;
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
  vec3 gnd = uBg * mix( 1.0, ratio, uShadowStrength );
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

// Ground: weighted shadow occlusion -> ratio of received light.
const groundFS = `
#include <common>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
uniform float uW[ 8 ];
uniform sampler2D uAO;      // baked floor visibility (1 = open sky)
uniform vec4 uAOBox;        // x0, z0, 1/width, 1/depth
uniform float uAOStrength;
varying vec3 vWorldPos;
void main() {
  float occl = 0.0;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
  DirectionalLightShadow dls;
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
    dls = directionalLightShadows[ i ];
    occl += uW[ i ] * ( 1.0 - getShadow( directionalShadowMap[ i ], dls.shadowMapSize, dls.shadowIntensity, dls.shadowBias, dls.shadowRadius, vDirectionalShadowCoord[ i ] ) );
  }
  #pragma unroll_loop_end
  #endif
  vec2 aoUv = ( vWorldPos.xz - uAOBox.xy ) * uAOBox.zw;
  float vis = ( aoUv.x > 0.0 && aoUv.x < 1.0 && aoUv.y > 0.0 && aoUv.y < 1.0 ) ? texture2D( uAO, aoUv ).r : 1.0;
  float ratio = ( 1.0 - occl ) * ( 1.0 - uAOStrength * ( 1.0 - vis ) );
  gl_FragColor = vec4( vec3( ratio ), 0.25 ); // alpha 0.25 marks 'floor'
}`;

const groundVS = THREE.ShaderLib.shadow.vertexShader
  .replace('void main() {', 'varying vec3 vWorldPos;\nvoid main() {')
  .replace('#include <shadowmap_vertex>', '#include <shadowmap_vertex>\n\tvWorldPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');

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
void main() {
  float v = 1.0;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
  DirectionalLightShadow dls = directionalLightShadows[ 0 ];
  v = getShadow( directionalShadowMap[ 0 ], dls.shadowMapSize, dls.shadowIntensity, dls.shadowBias, dls.shadowRadius, vDirectionalShadowCoord[ 0 ] );
  #endif
  gl_FragColor = vec4( v * uWeight, 0.0, 0.0, uWeight );
}`;

// --- light rig ----------------------------------------------------------------
export const DEFAULT_RIG = {
  exposure: 0.92,
  toneMapping: 'neutral',
  envIntensity: 0.9,          // IBL (RoomEnvironment) strength, mostly visible on metals / gloss
  key: { azimuth: -48, elevation: 58, intensity: 2.5, cone: 10, mapSize: 2048, radius: 1.6 },
  dome: { count: 2, intensity: 2.3, maxZenith: 62, mapSize: 1024, radius: 3 },
  fill: { azimuth: 72, elevation: 18, intensity: 0.35 },
  rim: { azimuth: 160, elevation: 38, intensity: 0.6 },
  bounce: { intensity: 0.5 },   // floor bounce from below (unshadowed, tinted by backdrop)
  groundAmbient: 0.25,          // share of floor light that never gets occluded (open studio)
  groundAO: { strength: 0.72, samples: 96, res: 768, maxZenith: 84 }, // baked floor contact shadow
  shadowStrength: 0.92,
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
    this.dome = [0, 1, 2, 3, 4, 5].map(() => this._dirLight(true));
    this.fill = this._dirLight(false);
    this.rim = this._dirLight(false);
    this.bounce = this._dirLight(false);

    // ground shadow catcher
    const gm = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { uW: { value: new Array(8).fill(0) }, uAO: { value: null }, uAOBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uAOStrength: { value: 0 } }]),
      vertexShader: groundVS,
      fragmentShader: groundFS,
      lights: true,
    });
    this.groundMat = gm;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), gm);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.castShadow = false;
    this.scene.add(this.ground);

    this.camera = new THREE.PerspectiveCamera(24, 1, 0.05, 500);
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.compositeMat = new THREE.ShaderMaterial({
      uniforms: { tFrame: { value: null }, uBg: { value: new THREE.Vector3() }, uExposure: { value: 1 }, uShadowStrength: { value: 0.9 }, uWeight: { value: 1 }, uToneMap: { value: 0 } },
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
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { uWeight: { value: 0 } }]),
      vertexShader: aoBakeVS, fragmentShader: aoBakeFS, lights: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    this.aoPlane = new THREE.Mesh(new THREE.BufferGeometry(), this.aoMat);
    this.aoPlane.frustumCulled = false; this.aoPlane.receiveShadow = true; this.aoPlane.castShadow = false;
    this.aoPlane.layers.set(1);
    this.aoScene.add(this.aoPlane);
    this.aoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    this.aoCam.layers.set(1);
    this.aoRT = null;
  }

  // Bake floor visibility under/around the product (contact shadows / AO).
  _bakeGroundAO(root, box, opt) {
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
      this._fitShadow(this.aoLight, d, box, 1024, 2.0);
      this.aoMat.uniforms.uWeight.value = 1 / N;
      r.render(this.aoScene, this.aoCam);
    }
    if (parent) parent.add(root); else this.aoScene.remove(root);
    const gu = this.groundMat.uniforms;
    gu.uAO.value = this.aoRT.texture;
    gu.uAOBox.value.set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0));
    gu.uAOStrength.value = opt.strength;
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

    // product
    if (this.root && this.root !== root) this.scene.remove(this.root);
    this.root = root; this.scene.add(root);
    root.updateMatrixWorld(true);
    root.traverse((o) => { if (o.isMesh) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(hookMaterial); } });
    const box = new THREE.Box3().setFromObject(root);
    box.min.y = Math.min(box.min.y, 0);
    const ao = { ...DEFAULT_RIG.groundAO, ...(rig.groundAO || {}) };
    if (ao.strength > 0) this._bakeGroundAO(root, box, ao); else this.groundMat.uniforms.uAOStrength.value = 0;

    // camera
    const cam = this.camera;
    cam.fov = view.fov; cam.aspect = width / height;
    cam.near = Math.max(0.02, view.distance * 0.05); cam.far = view.distance * 6 + 50;
    cam.position.copy(view.position); cam.up.set(0, 1, 0); cam.lookAt(view.target);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();

    const bgLin = srgbHexToLinear(bg);
    this.compositeMat.uniforms.uBg.value.copy(bgLin);
    this.outputMat.uniforms.uBg.value.copy(bgLin);
    this.compositeMat.uniforms.uExposure.value = R.exposure;
    this.compositeMat.uniforms.uShadowStrength.value = R.shadowStrength;
    this.compositeMat.uniforms.uToneMap.value = { neutral: 0, agx: 1, aces: 2, linear: 3 }[R.toneMapping] ?? 0;
    this.compositeMat.uniforms.tFrame.value = this.rt.texture;
    this.outputMat.uniforms.tAccum.value = this.accum.texture;

    const camAz = view.azimuth ?? 0;
    const K = R.dome.count;
    this._ensureDome(K);
    const keyBase = dirFromAzEl(camAz + R.key.azimuth, R.key.elevation);
    const fillDir = dirFromAzEl(camAz + R.fill.azimuth, R.fill.elevation);
    const rimDir = dirFromAzEl(camAz + R.rim.azimuth, R.rim.elevation);
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
    setStatic(this.bounce, new THREE.Vector3(0.15, -1, 0.25).normalize(), R.bounce.intensity, bounceColor);

    // clear accumulation
    r.setRenderTarget(this.accum);
    r.setClearColor(0x000000, 0); r.clear(true, false, false);
    this.quadScene.clear();

    const N = Math.max(1, samples | 0);
    const tmpKey = new THREE.Vector3();
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      // sub-pixel Gaussian jitter (sigma ~0.42 px)
      const jx = THREE.MathUtils.clamp(invNorm((halton(i + 1, 2) + 0.5 / N) % 1) * 0.42, -1.5, 1.5);
      const jy = THREE.MathUtils.clamp(invNorm((halton(i + 1, 3) + 0.5 / N) % 1) * 0.42, -1.5, 1.5);
      cam.setViewOffset(width, height, jx, jy, width, height);

      // key light inside a cone (softbox)
      const [dx, dy] = squareToDisk(...r2(i, [0.137, 0.711]));
      const t1 = new THREE.Vector3().crossVectors(keyBase, new THREE.Vector3(0, 1, 0)).normalize();
      const t2 = new THREE.Vector3().crossVectors(t1, keyBase).normalize();
      const ct = Math.tan(R.key.cone * DEG);
      tmpKey.copy(keyBase).addScaledVector(t1, dx * ct).addScaledVector(t2, dy * ct).normalize();
      this.key.intensity = R.key.intensity;
      this._fitShadow(this.key, tmpKey, box, R.key.mapSize, R.key.radius);

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
        domeDirs.push(d);
        const l = this.dome[k];
        l.intensity = R.dome.intensity / K;
        this._fitShadow(l, d, box, R.dome.mapSize, R.dome.radius);
      }

      // floor weights: share of the unoccluded floor irradiance per shadow caster
      const casters = [[this.key, tmpKey], ...domeDirs.map((d, k) => [this.dome[k], d])];
      let Etot = 0;
      const e = casters.map(([l, d]) => l.intensity * Math.max(0, d.y));
      Etot += e.reduce((a, b) => a + b, 0);
      Etot += R.fill.intensity * Math.max(0, fillDir.y) + R.rim.intensity * Math.max(0, rimDir.y);
      Etot *= 1 + R.groundAmbient;
      const W = this.groundMat.uniforms.uW.value;
      for (let k = 0; k < 8; k++) W[k] = k < e.length ? e[k] / Etot : 0;

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

    // output to canvas
    r.setRenderTarget(null);
    this.quadScene.add(this.outputQuad);
    r.render(this.quadScene, this.quadCam);
    this.quadScene.remove(this.outputQuad);
    return { ms: performance.now() - t0 };
  }
}
