// Shared helpers for the lighting group (prikkabel, lichtslang, kerstverlichting, LED-lampen,
// vloedlicht, heaters): light that *glows* inside the packshot pipeline without touching the
// engine, plus the hardware every light shares (E27 lamps, festoon sockets, flat rubber cable,
// plugs).
//
// Glow. The engine composites per pixel: alpha >= 0.5 is product (tone-mapped), anything else
// is backdrop/floor, so blended transparency is not available. Glow is therefore rendered as
// *stochastic coverage*, exactly like the engine's PVC windows: a halo pixel is drawn (opaque,
// in the light's colour) in a fraction `a` of the accumulated frames and the backdrop/floor in
// the rest, so the average is mix(backdrop, glow, a). Coverage is stratified per pixel with a
// golden-ratio walk over the frame seed (decorrelated from the engine's PVC sequence by a salt).
//   - haloSpheres(): view-facing radial glow around point lights (bulbs, LEDs). Each halo is a
//     back-facing sphere (sits behind the lamp, so the lamp itself stays crisp); the fragment
//     computes the true distance between the view ray and the light centre, so the falloff is
//     perfectly round on screen from any camera.
//   - haloTube(): the same along a line light (rope light, quartz tube, flame).
//   - floorGlow(): light spill on the floor (point sources summed on a grid, cosine/r^2 law).
// Glow meshes never cast shadows, are excluded from framing and from the auto-exposure albedo,
// and skip the engine's contact-shadow height pass (they would otherwise darken the floor).
import * as THREE from 'three';
import * as G from './geom.js';
import { globalUniforms } from './engine.js';
import { makeNoise2 } from './rng.js';
import * as TX from './textures.js';

const { V3 } = G;
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

const cache = new Map();
export function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

// linear-light colour from an sRGB hex, times an intensity
export function lin(hex, k = 1) { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; }

// Typical light colours (sRGB) by name: LED warm white 2200-2700 K, coloured LEDs.
export const LIGHT = {
  warm: '#FFB45A', filament: '#FF9F45', warmwhite: '#FFC27A', wit: '#FFE9CC', koel: '#EAF2FF',
  rood: '#FF2414', oranje: '#FF6E0A', geel: '#FFC81E', groen: '#1FE04A', blauw: '#1F4DFF', roze: '#FF3C9E', paars: '#8A3CFF',
};
export function lightHex(c, fallback = LIGHT.warm) {
  if (!c) return fallback;
  const k = String(c).toLowerCase().replace(/[\s_-]/g, '');
  if (LIGHT[k]) return LIGHT[k];
  if (/^#?[0-9a-f]{6}$/i.test(c)) return c.startsWith('#') ? c : '#' + c;
  return fallback;
}

// ---------------------------------------------------------------------------------------
// glow meshes

const hashGLSL = 'float lkHash( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * 0.1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }';

// Mark a mesh as pure glow: no shadows, no framing, no albedo, no contact pass.
export function glowOnly(mesh) {
  mesh.castShadow = false; mesh.receiveShadow = false;
  mesh.userData.noFrame = true; mesh.userData.contactProxy = true; // contactProxy: skipped by productAlbedo
  mesh.renderOrder = 2;
  const own = mesh.material;
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
    // drawn only with its own material (the engine's contact pass uses an override material)
    geometry.setDrawRange(0, material === own ? Infinity : 0);
  };
  return mesh;
}

function haloMaterial(salt = 17.3) {
  return cached(`halo:${salt}`, () => new THREE.ShaderMaterial({
    name: 'glow halo',
    uniforms: { uFrameSeed: globalUniforms.uFrameSeed, uSalt: { value: salt } },
    vertexShader: `attribute vec3 aCenter; attribute vec4 aGlow; attribute vec3 aShape;
varying vec3 vW; varying vec3 vC; varying vec4 vG; varying vec3 vS;
void main() {
  vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz;
  vC = ( modelMatrix * vec4( aCenter, 1.0 ) ).xyz; vG = aGlow; vS = aShape;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: `uniform float uFrameSeed; uniform float uSalt;
varying vec3 vW; varying vec3 vC; varying vec4 vG; varying vec3 vS;
${hashGLSL}
void main() {
  // distance between the view ray through this pixel and the light centre, / halo radius
  vec3 d = normalize( vW - cameraPosition );
  vec3 oc = vC - cameraPosition;
  float x = length( oc - d * dot( oc, d ) ) / vS.x;
  // two Gaussians (tight core + wide tail), windowed to zero at the sphere
  float q = vS.z * exp( - x * x / ( vS.y * vS.y ) ) + ( 1.0 - vS.z ) * exp( - x * x / ( 0.16 ) );
  float a = vG.a * q * ( 1.0 - smoothstep( 0.7, 1.0, x ) );
  float h = fract( lkHash( floor( gl_FragCoord.xy ) + uSalt ) + uFrameSeed * 0.6180339887 );
  if ( h >= min( a, 0.97 ) ) discard;
  gl_FragColor = vec4( vG.rgb, 1.0 );
}`,
    side: THREE.BackSide, depthWrite: true,
  }));
}

// halos: [{ c: V3 (centre), R (halo radius m), color: [r,g,b] linear HDR, a (peak coverage 0..1),
//           core (relative width of the core gaussian, default 0.22), coreW (weight of the core, 0.6) }]
// floor: halo geometry never dips below the floor (its far side would be hidden by the floor)
export function haloSpheres(halos, { salt = 17.3, detail = 3, floor = 0.0006 } = {}) {
  if (!halos.length) return null;
  const pos = [], idx = [], cen = [], glow = [], shape = [];
  const base = new THREE.IcosahedronGeometry(1, detail);
  const bp = base.attributes.position;
  const nonIdx = !base.index;
  for (const h of halos) {
    const off = pos.length / 3;
    for (let i = 0; i < bp.count; i++) {
      // circumscribe: icosphere vertices on radius R / cos(edge) so the faces enclose the sphere
      pos.push(h.c.x + bp.getX(i) * h.R * 1.04, Math.max(floor, h.c.y + bp.getY(i) * h.R * 1.04), h.c.z + bp.getZ(i) * h.R * 1.04);
      cen.push(h.c.x, h.c.y, h.c.z);
      glow.push(h.color[0], h.color[1], h.color[2], h.a);
      shape.push(h.R, h.core ?? 0.22, h.coreW ?? 0.6);
    }
    if (nonIdx) for (let i = 0; i < bp.count; i++) idx.push(off + i);
    else for (let i = 0; i < base.index.count; i++) idx.push(off + base.index.getX(i));
  }
  base.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCenter', new THREE.Float32BufferAttribute(cen, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
  g.setAttribute('aShape', new THREE.Float32BufferAttribute(shape, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, haloMaterial(salt));
  m.name = 'glow halos';
  return glowOnly(m);
}

// Halo along a polyline (line light). pts: V3[], R: halo radius, color linear, a: peak coverage.
export function haloTube(pts, R, color, a, { core = 0.22, coreW = 0.6, radial = 20, salt = 23.9, aFn = null, floor = 0.0006 } = {}) {
  const pos = [], idx = [], cen = [], glow = [], shape = [];
  const n = pts.length;
  const T = pts.map((p, i) => pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize());
  let nrm = Math.abs(T[0].y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  nrm.addScaledVector(T[0], -nrm.dot(T[0])).normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) { const q = new THREE.Quaternion().setFromUnitVectors(T[i - 1], T[i]); nrm.applyQuaternion(q); nrm.addScaledVector(T[i], -nrm.dot(T[i])).normalize(); }
    const b = V3().crossVectors(T[i], nrm);
    const ai = aFn ? aFn(i / (n - 1)) : a;
    for (let k = 0; k <= radial; k++) {
      const t = (k / radial) * TAU;
      const p = pts[i].clone().addScaledVector(nrm, Math.cos(t) * R * 1.03).addScaledVector(b, Math.sin(t) * R * 1.03);
      pos.push(p.x, Math.max(floor, p.y), p.z); cen.push(pts[i].x, pts[i].y, pts[i].z);
      glow.push(color[0], color[1], color[2], ai); shape.push(R, core, coreW);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < radial; k++) {
    const p0 = i * row + k, p1 = p0 + 1, p2 = p0 + row, p3 = p2 + 1;
    idx.push(p0, p1, p2, p1, p3, p2); // outward winding: BackSide draws the far wall
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCenter', new THREE.Float32BufferAttribute(cen, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
  g.setAttribute('aShape', new THREE.Float32BufferAttribute(shape, 3));
  g.setIndex(idx);
  // the tube's inside faces are its back faces from outside: render both and let depth sort
  const mat = haloMaterial(salt);
  const m = new THREE.Mesh(g, mat);
  m.name = 'glow tube';
  return glowOnly(m);
}

function floorMaterial(salt = 41.7) {
  return cached(`floorglow:${salt}`, () => new THREE.ShaderMaterial({
    name: 'floor glow',
    uniforms: { uFrameSeed: globalUniforms.uFrameSeed, uSalt: { value: salt } },
    vertexShader: `attribute vec4 aGlow; varying vec4 vG;
void main() { vG = aGlow; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: `uniform float uFrameSeed; uniform float uSalt; varying vec4 vG;
${hashGLSL}
void main() {
  float h = fract( lkHash( floor( gl_FragCoord.xy ) + uSalt ) + uFrameSeed * 0.6180339887 );
  if ( h >= min( vG.a, 0.95 ) ) discard;
  gl_FragColor = vec4( vG.rgb / max( vG.a, 1e-4 ), 1.0 );
}`,
    side: THREE.DoubleSide, depthWrite: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
}

// Any geometry as self-luminous glow (flames, glowing gas): attribute aGlow = premultiplied
// rgb (linear HDR) * coverage, coverage in a. Drawn opaque in a fraction `a` of the frames.
function surfaceGlowMaterial(salt = 53.1) {
  return cached(`surfglow:${salt}`, () => new THREE.ShaderMaterial({
    name: 'surface glow',
    uniforms: { uFrameSeed: globalUniforms.uFrameSeed, uSalt: { value: salt } },
    vertexShader: `attribute vec4 aGlow; varying vec4 vG;
void main() { vG = aGlow; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: `uniform float uFrameSeed; uniform float uSalt; varying vec4 vG;
${hashGLSL}
void main() {
  float h = fract( lkHash( floor( gl_FragCoord.xy ) + uSalt + ( gl_FrontFacing ? 0.0 : 13.1 ) ) + uFrameSeed * 0.6180339887 );
  if ( h >= min( vG.a, 0.97 ) ) discard;
  gl_FragColor = vec4( vG.rgb / max( vG.a, 1e-4 ), 1.0 );
}`,
    side: THREE.DoubleSide, depthWrite: true,
  }));
}
export function glowSurface(geo, { salt = 53.1 } = {}) {
  const m = new THREE.Mesh(geo, surfaceGlowMaterial(salt));
  m.name = 'surface glow';
  return glowOnly(m);
}

// Light spill on the floor. sources: [{ p: V3 (light position), I (strength), color: [r,g,b] linear }].
// Coverage at a floor point = k * sum I * h / (h^2 + r^2)^1.5 (Lambert + inverse square), the
// colour the intensity-weighted mean. `occl(x, z)` optionally scales a source's contribution.
export function floorGlow(sources, { box = null, res = 160, k = 1, max = 0.6, color = null, y = 0.0012, minH = 0.01 } = {}) {
  if (!sources.length) return null;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const s of sources) { x0 = Math.min(x0, s.p.x); x1 = Math.max(x1, s.p.x); z0 = Math.min(z0, s.p.z); z1 = Math.max(z1, s.p.z); }
  const pad = box ? box : 0.3;
  x0 -= pad; x1 += pad; z0 -= pad; z1 += pad;
  const nx = res, nz = Math.max(8, Math.round(res * (z1 - z0) / (x1 - x0)));
  const pos = [], glow = [], idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * (i / nx), z = z0 + (z1 - z0) * (j / nz);
    let E = 0, r = 0, g = 0, b = 0;
    for (const s of sources) {
      const h = Math.max(minH, s.p.y), dx = x - s.p.x, dz = z - s.p.z;
      const e = s.I * h / Math.pow(h * h + dx * dx + dz * dz, 1.5);
      E += e; r += e * s.color[0]; g += e * s.color[1]; b += e * s.color[2];
    }
    const a = Math.min(max, k * E);
    const c = color || (E > 0 ? [r / E, g / E, b / E] : [1, 1, 1]);
    pos.push(x, y, z);
    // premultiplied by coverage so linear interpolation stays smooth; the shader divides by a
    glow.push(c[0] * a, c[1] * a, c[2] * a, a);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b2 = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b2, b2, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, floorMaterial());
  m.name = 'floor glow';
  return glowOnly(m);
}

// ---------------------------------------------------------------------------------------
// materials

// Stochastic see-through for any built-in material (glass, clear PVC): drawn in a fraction
// `coverage` of the frames. Front and back faces use different sequences, so a glass bulb's
// near and far wall both add reflections.
export function stochastic(mat, coverage, salt = 7.7) {
  mat.userData.lkCov = { value: coverage };
  mat.userData.lkSalt = { value: salt };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    shader.uniforms.uFrameSeed = globalUniforms.uFrameSeed;
    shader.uniforms.uLkCov = mat.userData.lkCov;
    shader.uniforms.uLkSalt = mat.userData.lkSalt;
    shader.fragmentShader = `uniform float uFrameSeed; uniform float uLkCov; uniform float uLkSalt;\n${hashGLSL}\n` + shader.fragmentShader.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
  {
    float lkS = uLkSalt + ( gl_FrontFacing ? 0.0 : 31.7 );
    if ( fract( lkHash( floor( gl_FragCoord.xy ) + lkS ) + uFrameSeed * 0.6180339887 ) >= uLkCov ) discard;
  }`);
  };
  mat.customProgramCacheKey = () => `lkstoch:${mat.type}`;
  mat.needsUpdate = true;
  return mat;
}

// Self-lit diffuser (opal glass, frosted lens, rope-light PVC): emissive that is brighter where
// the surface faces the camera (light scattered through more material at grazing angles is
// dimmer), edge = relative brightness at the silhouette.
export function litDiffuser(mat, edge = 0.55, power = 0.6) {
  mat.userData.lkEdge = { value: new THREE.Vector2(edge, power) };
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    shader.uniforms.uLkEdge = mat.userData.lkEdge;
    shader.fragmentShader = 'uniform vec2 uLkEdge;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance *= mix( uLkEdge.x, 1.0, pow( abs( dot( normal, normalize( vViewPosition ) ) ), uLkEdge.y ) );`);
  };
  const k0 = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => `lkdiff:${k0()}`;
  mat.needsUpdate = true;
  return mat;
}

// Clear glass (bulb envelopes, lamp glass): glossy dielectric, stochastic coverage.
export function clearGlass({ tint = '#F4F1EA', coverage = 0.24, emissive = null, emissiveIntensity = 0, salt = 7.7 } = {}) {
  return cached(`lkglass:${tint}:${coverage}:${emissive}:${emissiveIntensity}:${salt}`, () => stochastic(new THREE.MeshPhysicalMaterial({
    color: tint, roughness: 0.04, metalness: 0, specularIntensity: 1, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.03,
    emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0), emissiveIntensity, envMapIntensity: 1.4,
    side: THREE.DoubleSide, name: 'clear glass',
  }), coverage, salt));
}

export function emissiveMat(hex, intensity, { color = '#FFFFFF', roughness = 0.4, name = 'emitter' } = {}) {
  return cached(`lkem:${hex}:${intensity}:${color}:${roughness}`, () => new THREE.MeshStandardMaterial({
    color, emissive: new THREE.Color(hex), emissiveIntensity: intensity, roughness, metalness: 0, name,
  }));
}

// Nickel-plated aluminium E27 shell, solder contact, black glass insulator.
export function e27Mats() {
  return cached('e27mats', () => ({
    shell: new THREE.MeshPhysicalMaterial({ color: '#C9CCD0', metalness: 1, roughness: 0.26, name: 'e27 shell' }),
    solder: new THREE.MeshPhysicalMaterial({ color: '#B8B4AA', metalness: 1, roughness: 0.35, name: 'solder' }),
    insulator: new THREE.MeshPhysicalMaterial({ color: '#0D0D0E', roughness: 0.12, clearcoat: 0.6, name: 'black glass' }),
    nickel: new THREE.MeshPhysicalMaterial({ color: '#BFC2C4', metalness: 1, roughness: 0.3, name: 'nickel wire' }),
  }));
}

// Flexible rubber (H05RN-F cable, festoon sockets): matte with a faint sheen.
export function cableRubber(color = '#141414', rough = 0.6) {
  return cached(`lkrub:${color}:${rough}`, () => new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, specularIntensity: 0.45, sheen: 0.2, sheenRoughness: 0.6,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#888888'), 0.35), name: `cable rubber ${color}`,
  }));
}

// Powder-coated die-cast aluminium / steel for small hardware (lamp housings, brackets): a fine
// orange-peel at ~2 mm (uv in metres), satin clearcoat.
export function diecast(color = '#1B1C1E', { rough = 0.46, coat = 0.3 } = {}) {
  const hex = new THREE.Color(color).getHexString();
  return cached(`lkdc:${hex}:${rough}:${coat}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, roughness: rough, metalness: 0, specularIntensity: 0.55, clearcoat: coat, clearcoatRoughness: 0.32,
      normalMap: TX.stippleNormal({ size: 256, strength: 0.8, scale: 40, seed: 83 }).clone(), normalScale: new THREE.Vector2(0.05, 0.05), name: `diecast ${color}`,
    });
    m.normalMap.repeat.set(220, 220); m.normalMap.needsUpdate = true;
    return m;
  });
}

// Moulded PVC / PP plastics (plugs, controllers, end caps).
export function moulded(color = '#151515', rough = 0.42, extra = {}) {
  return cached(`lkpl:${color}:${rough}:${JSON.stringify(extra)}`, () => new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, specularIntensity: 0.5, clearcoat: 0.1, clearcoatRoughness: 0.4, name: `moulded ${color}`, ...extra,
  }));
}

// ---------------------------------------------------------------------------------------
// geometry

// Swept closed profile ([x, y] pairs, x along the binormal, y along the normal) along a path,
// with parallel-transported frames starting from `up`. Returns { geo, frames }.
export function sweepProfile(pts, profile, { up = V3(0, 1, 0), caps = true, uvLen = true } = {}) {
  const n = pts.length, m = profile.length;
  const T = [], N = [], B = [], S = [0];
  for (let i = 0; i < n; i++) {
    T.push(pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize());
    if (i > 0) S.push(S[i - 1] + pts[i].distanceTo(pts[i - 1]));
  }
  let nn = up.clone().addScaledVector(T[0], -up.dot(T[0]));
  if (nn.lengthSq() < 1e-8) nn = V3(1, 0, 0).addScaledVector(T[0], -T[0].x);
  nn.normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) { const q = new THREE.Quaternion().setFromUnitVectors(T[i - 1], T[i]); nn.applyQuaternion(q); nn.addScaledVector(T[i], -nn.dot(T[i])).normalize(); }
    N.push(nn.clone()); B.push(V3().crossVectors(T[i], nn).normalize());
  }
  // perimeter for uv.y
  const per = [0]; for (let k = 1; k <= m; k++) { const a = profile[k - 1], b = profile[k % m]; per.push(per[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < n; i++) for (let k = 0; k <= m; k++) {
    const [x, y] = profile[k % m];
    const p = pts[i].clone().addScaledVector(B[i], x).addScaledVector(N[i], y);
    pos.push(p.x, p.y, p.z); uv.push(uvLen ? S[i] : i / (n - 1), per[k]);
  }
  const row = m + 1;
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < m; k++) {
    const a = i * row + k, b = a + 1, c = a + row, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  if (caps) {
    for (const [i, flip] of [[0, false], [n - 1, true]]) {
      const c0 = pos.length / 3;
      pos.push(pts[i].x, pts[i].y, pts[i].z); uv.push(S[i], 0);
      for (let k = 0; k < m; k++) { const [x, y] = profile[k]; const p = pts[i].clone().addScaledVector(B[i], x).addScaledVector(N[i], y); pos.push(p.x, p.y, p.z); uv.push(S[i], 0); }
      for (let k = 0; k < m; k++) { const a = c0 + 1 + k, b = c0 + 1 + ((k + 1) % m); if (flip) idx.push(c0, b, a); else idx.push(c0, a, b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // the seam: average normals of the duplicated column
  const nA = g.attributes.normal;
  for (let i = 0; i < n; i++) {
    const a = i * row, b = a + m;
    const x = nA.getX(a) + nA.getX(b), y = nA.getY(a) + nA.getY(b), z = nA.getZ(a) + nA.getZ(b), l = Math.hypot(x, y, z) || 1;
    nA.setXYZ(a, x / l, y / l, z / l); nA.setXYZ(b, x / l, y / l, z / l);
  }
  return { geo: g, frames: { T, N, B, S } };
}

export const circleProfile = (r, n = 16) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * TAU) * r, Math.sin((i / n) * TAU) * r]);
// stadium (flat cable): width w along x, thickness t along y
export function stadiumProfile(w, t, n = 10) {
  const r = t / 2, c = w / 2 - r, out = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; out.push([c + Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (i / n) * Math.PI; out.push([-c + Math.cos(a) * r, Math.sin(a) * r]); }
  return out;
}

// Arc-length resampling of a polyline (n points evenly spaced).
export function resample(pts, n) {
  const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = S[S.length - 1], out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * L;
    while (j < pts.length - 2 && S[j + 1] < s) j++;
    const t = (s - S[j]) / Math.max(1e-9, S[j + 1] - S[j]);
    out.push(pts[j].clone().lerp(pts[j + 1], Math.min(1, Math.max(0, t))));
  }
  return { pts: out, L };
}
// point + tangent at arc length s on a polyline
export function atLength(pts, s) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].distanceTo(pts[i - 1]);
    if (acc + d >= s || i === pts.length - 1) {
      const t = Math.min(1, Math.max(0, (s - acc) / Math.max(1e-9, d)));
      return { p: pts[i - 1].clone().lerp(pts[i], t), t: pts[i].clone().sub(pts[i - 1]).normalize(), i };
    }
    acc += d;
  }
  return { p: pts[pts.length - 1].clone(), t: V3(1, 0, 0), i: pts.length - 1 };
}
export function polyLength(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; }

// ---------------------------------------------------------------------------------------
// E27 lamps (G45 globe). Local frame: axis +Y, the base contact at the origin, glass tip at
// y = 0.078. kind: 'filament' (clear glass, 4 LED filaments on a glass stem), 'opal' (frosted
// "melkglas" globe on a white plastic neck), 'colour' (coated coloured glass on the neck).
// Returns { parts: [[material, geometry]...], glowCentre (local V3), halo radius hint }.
export const G45 = { L: 0.078, R: 0.0225, yc: 0.0555, shellTop: 0.0275 };

export function e27Base(add, mats) {
  // solder contact + black glass insulator
  add(mats.solder, G.lathe([[0.0001, 0], [0.0026, 0.0001], [0.0034, 0.0009], [0.0035, 0.0019], [0.0001, 0.0021]], 20));
  add(mats.insulator, G.lathe([[0.0001, 0.0016], [0.0062, 0.0016], [0.0092, 0.003], [0.0108, 0.0052], [0.0112, 0.0058], [0.0001, 0.0058]], 32));
  // threaded shell: real helix (pitch 3.6 mm), rounded crests, rolled bottom shoulder
  const p = 0.00363, y0 = 0.0056, y1 = G45.shellTop, rMin = 0.01214, rMaj = 0.01322;
  add(mats.shell, G.surface((u, v, o) => {
    const y = y0 + v * (y1 - y0);
    const a = u * TAU;
    const ph = y / p - u;
    let r = rMin + (rMaj - rMin) * (0.5 + 0.5 * Math.cos(TAU * ph));
    // flat land at both ends (bottom shoulder rolled in, top crimp)
    const eb = G.smoothstep(0, 0.0022, y - y0), et = G.smoothstep(0, 0.0024, y1 - y);
    r = G.lerp(0.0118, r, eb); r = G.lerp(0.01295, r, et);
    o.set(Math.cos(a) * r, y, Math.sin(a) * r);
  }, 64, 72, { closedU: true, flipNormals: true }));
}

export function globeProfile(neck = 'glass') {
  const pts = [];
  // neck: glass enters the shell (glass) or sits on a plastic collar (opal/colour)
  const ys = neck === 'glass' ? [[0.0122, 0.0262], [0.0124, 0.0295], [0.0131, 0.0322], [0.0146, 0.0352], [0.0164, 0.0381]] : [[0.0134, 0.0392], [0.0156, 0.0398]];
  for (const [r, y] of ys) pts.push([r, y]);
  const { R, yc } = G45;
  const r0 = pts[pts.length - 1][0];
  const th0 = Math.asin(Math.min(0.999, r0 / R));
  for (let i = 1; i <= 26; i++) {
    const th = th0 + (Math.PI - th0) * (i / 26);
    pts.push([Math.max(0.0001, R * Math.sin(th)), yc - R * Math.cos(th)]);
  }
  return pts;
}

export function lampG45({ kind = 'filament', on = true, color = null, glassIntensity = null } = {}) {
  const mats = e27Mats();
  const parts = [];
  const add = (m, g) => parts.push([m, g]);
  e27Base(add, mats);
  const lightCol = kind === 'colour' ? lightHex(color, LIGHT.rood) : (kind === 'opal' ? LIGHT.warmwhite : LIGHT.filament);
  if (kind === 'filament') {
    // clear envelope (glows faintly when on: light scattered at both glass walls)
    add(clearGlass({ tint: '#F6F2E8', coverage: 0.3, emissive: on ? '#FFB060' : null, emissiveIntensity: on ? 0.9 : 0 }), G.lathe(globeProfile('glass'), 64));
    // glass stem (exhaust tube + flare) and nickel support wires
    const stemG = clearGlass({ tint: '#EEF0EC', coverage: 0.45, salt: 3.3 });
    add(stemG, G.lathe([[0.0001, 0.026], [0.0085, 0.026], [0.0075, 0.03], [0.0032, 0.034], [0.0026, 0.043], [0.0034, 0.0446], [0.0001, 0.0452]], 24));
    const top = V3(0, 0.0672, 0);
    add(mats.nickel, G.tube(V3(0, 0.0445, 0), top, 0.00035, 6));
    const fil = on ? emissiveMat('#FF9535', 9, { color: '#E8A040', roughness: 0.6, name: 'led filament lit' })
      : cached('lkfiloff', () => new THREE.MeshPhysicalMaterial({ color: '#E2A646', roughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color('#FFE2A8'), name: 'led filament (phosphor)' }));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      const b = V3(Math.cos(a) * 0.0042, 0.0418, Math.sin(a) * 0.0042), t = V3(Math.cos(a) * 0.0088, 0.0662, Math.sin(a) * 0.0088);
      // filament strip: 1.1 x 0.5 mm, width facing outwards
      const dir = t.clone().sub(b).normalize();
      const side = V3(-Math.sin(a), 0, Math.cos(a));
      add(fil, G.prism(G.roundedRectProfile(0.0011, 0.0005, 0.0002, 2), b, t, { side }));
      // lead wire from the stem flare to the filament foot, hook from the top wire to the head
      add(mats.nickel, G.tube(V3(Math.cos(a) * 0.0028, 0.0436, Math.sin(a) * 0.0028), b.clone().addScaledVector(dir, 0.0004), 0.0003, 5));
      add(mats.nickel, G.tube(top, t.clone().addScaledVector(dir, -0.0004), 0.00028, 5));
    }
  } else {
    // white PBT neck collar between base and globe
    const neckM = moulded('#F1EFEA', 0.45);
    add(neckM, G.lathe([[0.0122, 0.0262], [0.0134, 0.0275], [0.0138, 0.032], [0.0146, 0.0372], [0.0152, 0.0392], [0.0136, 0.0402], [0.0001, 0.0402]], 48));
    let glass;
    if (kind === 'opal') {
      glass = on
        ? cached('lkopal:on', () => litDiffuser(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.1, emissive: new THREE.Color('#FFCF8F'), emissiveIntensity: 6, name: 'opal glass lit' }), 0.42, 0.75))
        : cached('lkopal:off', () => new THREE.MeshPhysicalMaterial({ color: '#F3F1EC', roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.08, sheen: 0.3, sheenColor: new THREE.Color('#ffffff'), name: 'opal glass' }));
    } else {
      const hex = lightCol;
      const base = new THREE.Color(hex).multiplyScalar(0.55);
      glass = on
        ? cached(`lkcol:on:${hex}`, () => litDiffuser(new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.06, emissive: new THREE.Color(hex), emissiveIntensity: glassIntensity ?? 1.15, name: `coloured glass lit ${hex}` }), 0.4, 0.7))
        : cached(`lkcol:off:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.06, name: `coloured glass ${hex}` }));
    }
    add(glass, G.lathe(globeProfile('collar'), 64));
  }
  return { parts, lightHex: lightCol, centre: V3(0, G45.yc, 0) };
}

// ---------------------------------------------------------------------------------------
// Festoon "prik" socket for flat cable (E27). Local frame: the cable runs along X through the
// clamp head at y = 0, the socket hangs down (-Y), lamp opening at y = -0.084. The lamp's
// contact sits at y = -0.0525 (so its glass leaves the rubber lip at the shell top).
export const SOCKET = { lip: -0.084, lampContact: -0.0545 };
export function festoonSocket(rub, { screw = null } = {}) {
  const parts = [];
  const add = (m, g) => parts.push([m, g]);
  // clamp head: lower body + lid with a parting groove, rounded
  const body = G.roundedBox(0.046, 0.022, 0.03, 0.0065, 4); body.translate(0, -0.0085, 0); add(rub, body);
  const lid = G.roundedBox(0.044, 0.0095, 0.0285, 0.0042, 3); lid.translate(0, 0.0078, 0); add(rub, lid);
  // the lid's two lugs over the cable ends + centre screw boss with a cross-head screw
  const boss = G.lathe([[0.0001, 0.0122], [0.0058, 0.0122], [0.0058, 0.0148], [0.0049, 0.0156], [0.0001, 0.0156]], 24); add(rub, boss);
  add(screw || moulded('#2A2A2A', 0.35), G.lathe([[0.0001, 0.0153], [0.0032, 0.0153], [0.0034, 0.0158], [0.0001, 0.0163]], 16));
  // sleeve with four sealing ribs and a soft flared lip
  add(rub, G.lathe([[0.0001, -0.0195], [0.0188, -0.0195], [0.0196, -0.022], [0.0196, -0.071], [0.0204, -0.075], [0.0213, -0.0795], [0.0211, -0.083], [0.0184, -0.0845], [0.0168, -0.0835], [0.0162, -0.079], [0.0001, -0.079]].reverse(), 48));
  for (let k = 0; k < 4; k++) { const t = new THREE.TorusGeometry(0.0198, 0.00095, 6, 40); t.rotateX(Math.PI / 2); t.translate(0, -0.03 - k * 0.0085, 0); add(rub, t); }
  // a small moulded hanging eye on the back of the head (for a support wire or cable tie)
  const eye = new THREE.TorusGeometry(0.0055, 0.0018, 8, 20); eye.translate(0, 0.0005, -0.0175); add(rub, eye);
  return parts;
}

// Flat 2-core rubber cable (H05RN-F 2 x 1.5 mm2), stadium 12 x 6.4 mm.
export function flatCable(pts, rub, { w = 0.0118, t = 0.0064 } = {}) {
  return sweepProfile(pts, stadiumProfile(w, t, 6), { up: V3(0, 1, 0) }).geo;
}

// Euro plug (class II) on a round lead, pins along +X; base of the strain relief at the origin.
export function euroPlug(add, matBody, matPin, { L = 0.05 } = {}) {
  add(matBody, G.lathe([[0.0001, 0], [0.0032, 0], [0.0036, 0.01], [0.0048, 0.016], [0.0066, 0.02], [0.0098, 0.026], [0.0108, 0.03], [0.0108, L - 0.004], [0.0094, L], [0.0001, L]], 40).rotateZ(-Math.PI / 2).scale(1, 1, 1.35));
  for (const s of [-1, 1]) {
    add(matPin, G.lathe([[0.0001, L], [0.002, L], [0.002, L + 0.017], [0.0016, L + 0.0188], [0.0001, L + 0.019]], 16).rotateZ(-Math.PI / 2).translate(0, 0, s * 0.0095));
  }
}

// Rubber plug (Schuko-style body, two pins) on a round lead. Local: the lead enters at the
// origin from +Y, the body extends to -Y, pins point down.
export function rubberPlug(add, rub, pin) {
  // local: cable enters at the origin along +Y... the plug body extends to -Y (pins point down)
  add(rub, G.lathe([[0.0001, -0.072], [0.0172, -0.072], [0.0186, -0.069], [0.0189, -0.05], [0.0175, -0.036], [0.0135, -0.024], [0.0085, -0.012], [0.0062, 0], [0.0001, 0]], 40));
  for (let k = 0; k < 5; k++) { const t = new THREE.TorusGeometry(0.0084 - k * 0.0006, 0.0011, 6, 24); t.rotateX(Math.PI / 2); t.translate(0, -0.006 - k * 0.0028, 0); add(rub, t); }
  // two contact pins (4.8 mm, 19 mm apart) + grip flats on the sides
  for (const s of [-1, 1]) add(pin, G.lathe([[0.0001, -0.0915], [0.0016, -0.0912], [0.0024, -0.0898], [0.0024, -0.0725], [0.0001, -0.0725]], 16).translate(s * 0.0095, 0, 0));
  for (const s of [-1, 1]) { const f = G.roundedBox(0.004, 0.026, 0.016, 0.0018, 2); f.translate(0, -0.052, s * 0.0178); add(rub, f); }
}

// Leg clamp for a 40-50 mm easy-up leg: two hinged steel half-rings (inner 52 mm) with closing
// lugs, a wing bolt and a welded M8 stud for a lamp/heater bracket. Lying flat, ring axis
// vertical, origin at the ring centre on the floor; the stud points +Z.
export function legClamp(bins, mat, wingMat) {
  // hinged ring clamp lying flat (axis vertical), origin at the ring centre on the floor
  const Ri = 0.026, t = 0.004, h = 0.03;
  bins.add(mat, G.lathe([[Ri, 0], [Ri + t, 0], [Ri + t, h], [Ri, h]], 64).translate(0, 0, 0));
  bins.add(mat, G.lathe([[Ri, h], [Ri, 0]], 64)); // inner face (closes the ring wall)
  // hinge knuckles at -X, closing lugs + wing bolt at +X, stud plate at +Z (towards the light)
  const kn = G.lathe([[0.0001, 0], [0.0055, 0], [0.0055, h], [0.0001, h]], 16); kn.translate(-(Ri + t + 0.003), 0, 0); bins.add(mat, kn);
  for (const s of [-1, 1]) { const lug = G.roundedBox(0.018, h, 0.004, 0.0012, 2); lug.translate(Ri + t + 0.008, h / 2, s * 0.0035); bins.add(mat, lug); }
  const bolt = G.tube(V3(Ri + t + 0.01, h / 2, -0.012), V3(Ri + t + 0.01, h / 2, 0.012), 0.003, 12); bins.add(e27Mats().shell, bolt);
  const wn = G.lathe([[0.0001, 0], [0.006, 0], [0.0065, 0.002], [0.0055, 0.01], [0.0001, 0.011]], 20); wn.rotateX(Math.PI / 2); wn.translate(Ri + t + 0.01, h / 2, 0.012); bins.add(wingMat, wn);
  for (const s of [-1, 1]) { const wing = G.roundedBox(0.004, 0.016, 0.005, 0.0018, 2); wing.translate(Ri + t + 0.01 + s * 0.0085, h / 2 + 0.004, 0.018); wing.rotateZ(0); bins.add(wingMat, wing); }
  const plate = G.roundedBox(0.03, h * 0.8, 0.005, 0.002, 2); plate.translate(0, h / 2, Ri + t + 0.0025); bins.add(mat, plate);
  bins.add(e27Mats().shell, G.tube(V3(0, h / 2, Ri + t + 0.005), V3(0, h / 2, Ri + t + 0.03), 0.004, 12));
  const nut = G.lathe([[0.0001, 0], [0.0075, 0], [0.0075, 0.0065], [0.0001, 0.0065]], 6); nut.rotateX(Math.PI / 2); nut.translate(0, h / 2, Ri + t + 0.03); bins.add(e27Mats().shell, nut);
}

// Deterministic noise for natural cable lay
export const noise = makeNoise2(97);
