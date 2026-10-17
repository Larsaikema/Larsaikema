// Procedural packshot-studio environment for reflections (used instead of the bright
// RoomEnvironment by products that need controlled reflections: black PVC fabric,
// hexagonal aluminium tubes). It is an HDR equirectangular map built analytically:
//
//   - a dark surround (black flags / unlit studio walls), so glossy dark surfaces
//     stay dark instead of mirroring a bright room,
//   - a light floor (the sweep) whose brightness varies with azimuth: a lit pool in
//     front of the set, darker at the sides, medium behind. Vertical metal facets
//     mirror different parts of it, so hex legs show alternating light/dark bands,
//   - a few soft-edged softboxes with a hot centre (overhead scrim, key box, rim strip,
//     bounce card), placed in CAMERA-RELATIVE angles: the engine rotates the map with
//     the camera azimuth, so highlights land on the same faces in every shot.
//
// Angles follow the engine's dirFromAzEl(): azimuth 0 = towards the camera (+Z),
// positive = camera-right (+X), elevation above the horizon.
import * as THREE from 'three';

const DEG = Math.PI / 180;

export const STUDIO_ENV_DEFAULT = {
  surround: 0.03,        // radiance of the dark studio
  ceiling: 0.05,         // a touch lighter straight up
  floor: { front: 0.55, side: 0.12, back: 0.32, frontWidth: 55, backWidth: 50 },
  boxes: [
    // overhead scrim, behind-left of the subject: mirrored by roof faces turned to the camera
    { az: -140, el: 55, w: 64, h: 18, I: 7.0, soft: 0.6, hot: 0.35, roll: 0 },
    // key softbox (camera-left, front)
    { az: -62, el: 38, w: 26, h: 34, I: 5.0, soft: 0.4, hot: 0.3 },
    // rim strip behind-right
    { az: 150, el: 28, w: 10, h: 40, I: 2.0, soft: 0.5, hot: 0.2 },
    // large white bounce card camera-right
    { az: 75, el: 12, w: 40, h: 30, I: 0.5, soft: 0.6, hot: 0.1 },
  ],
};

function dirFromAzEl(az, el) {
  return new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), Math.cos(az * DEG) * Math.cos(el * DEG));
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function boxFn(b) {
  const c = dirFromAzEl(b.az, b.el);
  let t1 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), c);
  if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0);
  t1.normalize();
  let t2 = new THREE.Vector3().crossVectors(c, t1).normalize();
  if (b.roll) {
    const r = b.roll * DEG, a = t1.clone(), bb = t2.clone();
    t1 = a.clone().multiplyScalar(Math.cos(r)).addScaledVector(bb, Math.sin(r));
    t2 = bb.clone().multiplyScalar(Math.cos(r)).addScaledVector(a, -Math.sin(r));
  }
  const hw = b.w / 2, hh = b.h / 2, soft = b.soft ?? 0.3, hot = b.hot ?? 0.3;
  return (d) => {
    const z = d.dot(c);
    if (z <= 0.05) return 0;
    const x = Math.atan2(d.dot(t1), z) / DEG, y = Math.atan2(d.dot(t2), z) / DEG;
    const ex = Math.abs(x) / hw, ey = Math.abs(y) / hh;
    if (ex > 1 + soft || ey > 1 + soft) return 0;
    // soft edge (diffusion fabric spill) and a hot centre
    const edge = (1 - sstep(1 - soft, 1 + soft, ex)) * (1 - sstep(1 - soft, 1 + soft, ey));
    const r2 = Math.min(1, ex * ex * 0.6 + ey * ey * 0.6);
    return b.I * edge * (1 - hot * r2);
  };
}

export function studioRadianceFn(opt = {}) {
  const O = { ...STUDIO_ENV_DEFAULT, ...opt, floor: { ...STUDIO_ENV_DEFAULT.floor, ...(opt.floor || {}) } };
  const boxes = (opt.boxes || STUDIO_ENV_DEFAULT.boxes).map(boxFn);
  const F = O.floor;
  return (d) => {
    let L;
    const az = Math.atan2(d.x, d.z) / DEG; // 0 = towards camera
    const el = Math.asin(Math.max(-1, Math.min(1, d.y))) / DEG;
    if (el < 0) {
      const a = Math.abs(az);
      const front = 1 - sstep(F.frontWidth * 0.5, F.frontWidth * 1.3, a);
      const back = sstep(180 - F.backWidth * 1.3, 180 - F.backWidth * 0.5, a);
      const fl = F.side + (F.front - F.side) * front + (F.back - F.side) * back;
      // floor pool fades into the dark surround towards the horizon
      L = O.surround + (fl - O.surround) * sstep(-2, -14, el);
    } else {
      L = O.surround + (O.ceiling - O.surround) * sstep(30, 90, el);
    }
    for (const f of boxes) L += f(d);
    return L;
  };
}

// Equirectangular float texture (row 0 = straight down, as three's equirectUv expects
// for an unflipped DataTexture).
export function studioEquirect(opt = {}, W = 1024, H = 512) {
  const fn = studioRadianceFn(opt);
  const data = new Float32Array(W * H * 4);
  const d = new THREE.Vector3();
  for (let row = 0; row < H; row++) {
    const v = (row + 0.5) / H;
    const lat = (v - 0.5) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let col = 0; col < W; col++) {
      const u = (col + 0.5) / W;
      const phi = (u - 0.5) * Math.PI * 2; // atan2(z, x)
      d.set(cl * Math.cos(phi), sl, cl * Math.sin(phi));
      const L = fn(d);
      const k = (row * W + col) * 4;
      data[k] = L; data[k + 1] = L; data[k + 2] = L; data[k + 3] = 1;
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
