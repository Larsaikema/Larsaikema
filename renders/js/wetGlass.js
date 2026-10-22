// Water drops on glass and a silicone sealing ring for outdoor (IP65) lamps, on top of the
// noise-free glow compositor (js/lightGlow.js). Lighting group only.
//
// waterDrops(GC, { centre, R, view, seed, ... }) beads a lamp globe (sphere `centre`, radius `R`,
// product-local coordinates) with water: ~40 drops of 0.4-2 mm footprint radius, most of them small,
// plus a few larger drops that have started to run (stretched down the glass, heavier at the
// bottom). Each drop is a spherical cap (height ~0.55 x footprint radius: a beaded coating) and is
// drawn the way the compositor draws glass, so nothing is stochastic:
//   beauty pass  a glass marker (the pixel shows what is behind and inside the globe),
//   inner pass   1) a *multiply* lens term: the light seen through the drop (filament glow, amber
//                   haze, the far wall) is darkened towards the rim, where a real drop refracts the
//                   dark surroundings, and lifted a little in the middle, where it focuses the glow;
//                2) the drop's own surface reflection of the studio (tiny crisp highlights);
//   trans pass   the same lens term on the transmitted backdrop.
// Drops are only placed on the half of the globe that faces the camera (`view`: unit vector from
// the globe towards the camera), and not on the neck.
//
// sealRing(add, mat) - ribbed silicone sleeve over the glass neck of a G45 filament lamp (lamp
// frame: axis +Y, contact at the origin, js/lightKit.js G45): three sealing lips that seat in the
// rubber collar of a festoon socket.
import * as THREE from 'three';
import * as G from './geom.js';
import { rng } from './rng.js';
import { glassShellMaterial } from './lightGlow.js';

const { V3 } = G;

const lensVS = `attribute vec3 aBase; varying vec3 vN; varying vec3 vW; varying vec3 vB;
void main() {
  vec4 w = modelMatrix * vec4( position, 1.0 ); vW = w.xyz;
  vN = normalize( mat3( modelMatrix ) * normal );
  vB = normalize( mat3( modelMatrix ) * aBase );
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// the lens term: a water bead refracts the dark surroundings where its surface is steep (outer
// ~30 % of its radius: a dark ring), passes the light behind it where it is flat, and focuses the
// glow a little in the middle; seen edge-on (on the globe's silhouette) the whole bead darkens
const lensFS = (rim, mid) => `varying vec3 vN; varying vec3 vW; varying vec3 vB;
void main() {
  vec3 n = normalize( vN );
  float slope = dot( n, normalize( vB ) );
  float c = abs( dot( n, normalize( cameraPosition - vW ) ) );
  float f = mix( ${rim.toFixed(3)}, 1.0, smoothstep( 0.6, 0.9, slope ) );
  f *= mix( 0.55, 1.0, smoothstep( 0.05, 0.45, c ) );
  f *= mix( 1.0, ${mid.toFixed(3)}, smoothstep( 0.93, 0.995, slope ) );
  gl_FragColor = vec4( vec3( f ), 1.0 );
}`;
const lensMats = new Map();
function lensMaterial(rim, mid) {
  const k = `${rim}:${mid}`;
  if (!lensMats.has(k)) lensMats.set(k, new THREE.ShaderMaterial({
    name: 'water drop lens', vertexShader: lensVS, fragmentShader: lensFS(rim, mid), side: THREE.FrontSide,
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  }));
  return lensMats.get(k);
}

// one drop: a spherical cap on the sphere (centre C, radius R) at unit direction d, footprint
// radius a, height h, stretched by s along the downhill tangent (s > 1: a running drop whose
// lower end is fuller)
function dropGeo(C, R, d, a, h, s = 1) {
  const Rc = (a * a + h * h) / (2 * h);
  const prof = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const r = a * (1 - i / n);
    prof.push([Math.max(0.00001, r), Math.sqrt(Math.max(0, Rc * Rc - r * r)) - (Rc - h)]);
  }
  prof[0][1] = -0.00012; // the foot sinks into the curved glass (sagitta of a 2 mm drop: 0.09 mm)
  const g = G.lathe(prof, 20);
  // downhill tangent on the globe
  let t = V3(0, -1, 0).addScaledVector(d, d.y);
  if (t.lengthSq() < 1e-8) t = V3(1, 0, 0);
  t.normalize();
  if (s !== 1) {
    // stretch along local X (-> downhill), fuller at the lower end: x' = x * s, bulge where x > 0
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const lo = Math.max(0, x / a); // 0 (top half) .. 1 (lowest point)
      pos.setX(i, x * s + (s - 1) * a * 0.35);
      pos.setY(i, y * (1 + 0.25 * (s - 1) * lo));
    }
    g.computeVertexNormals();
  }
  const b = new THREE.Vector3().crossVectors(t, d);
  const M = new THREE.Matrix4().makeBasis(t, d, b);
  M.setPosition(C.clone().addScaledVector(d, R));
  g.applyMatrix4(M);
  // the glass normal under the bead (the lens term measures the bead's slope against it)
  const n = g.attributes.position.count, base = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { base[i * 3] = d.x; base[i * 3 + 1] = d.y; base[i * 3 + 2] = d.z; }
  g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
  return g;
}

// G.merge drops custom attributes: concatenate position / normal / aBase (all indexed lathes)
function mergeWithBase(list) {
  const out = new THREE.BufferGeometry();
  const P = [], N = [], B = [], I = [];
  let off = 0;
  for (const g of list) {
    const gi = g.index ? g : g;
    P.push(...gi.attributes.position.array); N.push(...gi.attributes.normal.array); B.push(...gi.attributes.aBase.array);
    if (gi.index) for (const k of gi.index.array) I.push(k + off);
    else for (let k = 0; k < gi.attributes.position.count; k++) I.push(k + off);
    off += gi.attributes.position.count;
  }
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  out.setAttribute('aBase', new THREE.Float32BufferAttribute(B, 3));
  out.setIndex(I);
  return out;
}

export function waterDrops(GC, {
  centre, R, view, seed = 7, count = 40, runs = 3, minFacing = 0.12, minY = -0.5,
  aMin = 0.0005, aMax = 0.002, rim = 0.22, mid = 1.3, env = 3.2, rough = 0.02,
} = {}) {
  const rnd = rng(seed);
  const placed = [];
  const fits = (d, a) => placed.every((q) => d.angleTo(q.d) * R > (a + q.a) * 1.15 + 0.0003);
  const pick = (a, tries = 80) => {
    for (let k = 0; k < tries; k++) {
      // uniform on the sphere
      const z = 2 * rnd() - 1, ph = rnd() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      const d = V3(s * Math.cos(ph), z, s * Math.sin(ph));
      if (d.dot(view) < minFacing || d.y < minY) continue;
      if (fits(d, a)) return d;
    }
    return null;
  };
  const geos = [];
  // a few larger drops that have started to run (on the flanks, not dead centre)
  for (let k = 0; k < runs; k++) {
    const a = aMax * (0.85 + 0.25 * rnd());
    const d = pick(a * 1.6);
    if (!d || d.dot(view) > 0.92) continue;
    const s = 1.35 + 0.4 * rnd();
    placed.push({ d, a: a * s });
    geos.push(dropGeo(centre, R, d, a, a * 0.62, s));
  }
  // beads: many small, few large
  for (let k = 0; k < count; k++) {
    const a = aMin + (aMax - aMin) * 0.8 * Math.pow(rnd(), 2.3);
    const d = pick(a);
    if (!d) continue;
    placed.push({ d, a });
    geos.push(dropGeo(centre, R, d, a, a * (0.5 + 0.12 * rnd())));
  }
  if (!geos.length) return null;
  const geo = mergeWithBase(geos);
  const lens = new THREE.Mesh(geo, lensMaterial(rim, mid)); lens.renderOrder = 5; lens.frustumCulled = false;
  GC.innerRoot.add(lens);
  const tr = new THREE.Mesh(geo, lensMaterial(Math.max(rim, 0.4), 1.0)); tr.renderOrder = 5; tr.frustumCulled = false;
  GC.transRoot.add(tr);
  const shell = new THREE.Mesh(geo, glassShellMaterial({ T: 1, env, rough, side: THREE.FrontSide }));
  shell.renderOrder = 6; shell.frustumCulled = false;
  GC.innerRoot.add(shell);
  const marker = GC.marker(geo);
  marker.name = 'water drops marker';
  return { marker, count: placed.length };
}

// silicone sealing sleeve with three lips over the glass neck of a G45 filament lamp
export function sealRing(add, mat) {
  // glass neck (js/lightKit.js globeProfile 'glass'): r 12.2 mm at y 26.2 -> 14.6 mm at y 35.2
  const prof = [
    [0.0119, 0.0262], [0.0139, 0.0262], [0.0146, 0.0266], [0.0148, 0.0272],
    [0.0150, 0.0278], [0.0156, 0.0282], [0.0156, 0.0287], [0.0150, 0.0291],
    [0.0152, 0.0299], [0.0158, 0.0303], [0.0158, 0.0308], [0.0152, 0.0312],
    [0.0154, 0.0320], [0.0161, 0.0324], [0.0161, 0.0329], [0.0156, 0.0334],
    [0.0156, 0.0339], [0.0151, 0.0344], [0.0141, 0.0341], [0.0130, 0.0322], [0.0123, 0.0290], [0.0119, 0.0262],
  ];
  add(mat, G.lathe(prof, 72));
}
