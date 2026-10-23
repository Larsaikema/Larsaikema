// Tape voor loper en vloer: rolls of 50 mm tape (25 m) beside a cut piece of red event runner.
//
// { kinds: ['dubbelzijdig', 'gaffer'], runner (default true), runnerColor (default rood) }
//   dubbelzijdig  double-sided carpet tape on a 76 mm cardboard core, the outside a white release liner with a
//                 light blue print; standing on its edge, turned so the wound side face and the core read
//   gaffer        black cloth gaffer tape on a cardboard core, lying flat; a strip of it holds the front edge of
//                 the runner piece down (half on the felt, folded over the edge onto the floor)
//   runner        a 50 x 34 cm piece of needle-felt runner (the catalogue's loper material), 4,5 mm thick
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';
import * as F from '../js/furniture.js';
import { rng } from '../js/rng.js';
import { feltMat } from './tentFloor.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const AZ = 34;
const RIGHT = V3(Math.cos(AZ * DEG), 0, -Math.sin(AZ * DEG));
const FWD = V3(Math.sin(AZ * DEG), 0, Math.cos(AZ * DEG));
const cam = (u, v) => RIGHT.clone().multiplyScalar(u).addScaledVector(FWD, v);

function cardboard() {
  return K.cached('tr-card', () => SG.procSurface(new THREE.MeshPhysicalMaterial({ color: '#B08A5E', roughness: 0.86, specularIntensity: 0.25, name: 'cardboard core' }),
    { kind: 'stipple', scale: 0.0009, bump: 0.00001, albedo: 0.08, rough: 0.04 }));
}
// wound side face: layer lines every `pitch` m (radial uv: u = (r - r0) / 0.1)
function sideMat(hex, pitch = 0.0012, dark = 0.8) {
  return K.cached(`tr-side:${hex}:${pitch}:${dark}`, () => {
    const W = 2048, c = document.createElement('canvas'); c.width = W; c.height = 4;
    const g = c.getContext('2d'); const base = new THREE.Color(hex); const R = rng(9);
    for (let x = 0; x < W; x++) {
      const r = (x / W) * 0.1, f = (r / pitch) % 1;
      const col = base.clone().multiplyScalar(f < 0.25 ? dark : 1 - 0.04 * R());
      g.fillStyle = `#${col.getHexString()}`; g.fillRect(x, 0, 1, 4);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.55, specularIntensity: 0.5, name: `wound side ${hex}` });
  });
}
// release liner of the carpet tape: off-white paper with a repeated light blue print (u along the tape)
function linerMat() {
  return K.cached('tr-liner', () => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#F1F0EB'; g.fillRect(0, 0, 1024, 128);
    g.fillStyle = '#7FA3C9'; g.font = '700 38px Arial, Helvetica, sans-serif'; g.textBaseline = 'middle';
    for (let k = 0; k < 2; k++) g.fillText('TAPIJTTAPE  ↔  50 mm', 40 + k * 512, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    t.repeat.set(1 / 0.36, 1 / 0.05);
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.62, specularIntensity: 0.4, clearcoat: 0.1, name: 'release liner' });
  });
}
function gafferMat() {
  return K.cached('tr-gaffer', () => {
    const m = F.upholstery('#1A1A1C').clone();
    m.roughness = 0.78; m.sheen = 0.35; m.sheenColor = new THREE.Color('#4a4a4e');
    m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(70, 70); m.normalMap.needsUpdate = true;
    m.name = 'gaffer cloth';
    return m;
  });
}

// roll lying flat (axis +Y) on the floor: outer face material uses uv (u = around in m, v = across in m)
function roll(face, side, core, { W = 0.05, Ro = 0.06, Ri = 0.0395 } = {}) {
  const sub = new G.PartBin();
  const y0 = 0.0012;
  const outer = new THREE.CylinderGeometry(Ro, Ro, W - 0.001, 128, 1, true); outer.translate(0, y0 + W / 2, 0);
  { const uv = outer.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * TAU * Ro, uv.getY(i) * W); }
  sub.add(face, outer);
  for (const top of [true, false]) {
    const ring = new THREE.RingGeometry(Ri + 0.0026, Ro - 0.0005, 128, 1);
    const uv = ring.attributes.uv, pa = ring.attributes.position;
    for (let i = 0; i < pa.count; i++) uv.setXY(i, (Math.hypot(pa.getX(i), pa.getY(i)) - (Ri + 0.0026)) / 0.1, 0.5);
    ring.rotateX(top ? -Math.PI / 2 : Math.PI / 2); ring.translate(0, top ? y0 + W : y0, 0);
    sub.add(side, ring);
    const edge = new THREE.TorusGeometry(Ro - 0.0005, 0.0005, 6, 128); edge.rotateX(Math.PI / 2); edge.translate(0, top ? y0 + W - 0.0005 : y0 + 0.0005, 0);
    sub.add(face, edge);
  }
  const ch = W + 2 * y0;
  sub.add(core, K.lathe([[Ri - 0.0025, 0], [Ri + 0.0026, 0], [Ri + 0.0026, ch], [Ri - 0.0025, ch], [Ri - 0.0025, 0]], 96));
  return sub;
}
function place(B, sub, { at, yaw = 0, stand = false, lift = 0 }) {
  const geos = []; for (const [, l] of sub.bins) geos.push(...l);
  if (stand) for (const g of geos) g.rotateZ(Math.PI / 2);
  const bb = new THREE.Box3(); for (const g of geos) { g.computeBoundingBox(); bb.union(g.boundingBox); }
  const c = bb.getCenter(V3());
  const m = new THREE.Matrix4().makeTranslation(at.x, lift, at.z).multiply(new THREE.Matrix4().makeRotationY(yaw * DEG)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z));
  for (const [mat, l] of sub.bins) for (const g of l) { g.applyMatrix4(m); B.add(mat, g); }
}

export function tapeRoll(p = {}) {
  let kinds = p.kinds || ['dubbelzijdig', 'gaffer'];
  if (typeof kinds === 'string') kinds = [kinds];
  const B = new G.PartBin();
  const card = cardboard();
  const hasRunner = p.runner !== false;
  const T = 0.0045;
  // runner piece (back), a little turned
  const runnerYaw = AZ + 6;
  const rc = cam(0.0, -0.13);
  if (hasRunner) {
    const felt = feltMat(p.runnerColor ? F.upholstery(p.runnerColor).color.getHexString().replace(/^/, '#') : '#A11D25');
    const slab = G.roundedBox(0.5, T, 0.34, 0.0015);
    F.uvBox(slab, { offset: [0.13, 0, 0.41] });
    slab.translate(0, T / 2, 0); slab.rotateY(runnerYaw * DEG); slab.translate(rc.x, 0, rc.z);
    B.add(felt, slab);
  }
  const gaffer = gafferMat();
  if (kinds.includes('gaffer')) {
    // roll lying flat, front right
    place(B, roll(gaffer, sideMat('#2A2A2C', 0.0009, 0.55), card, { Ro: 0.058 }), { at: cam(0.17, 0.13), yaw: 20 });
    if (hasRunner) {
      // a strip taped along the runner's front edge: half on the felt, stepping down over the 4,5 mm edge, half
      // on the floor (the way gaffer holds a runner edge down)
      const ra = runnerYaw * DEG;
      const ax = V3(Math.cos(ra), 0, -Math.sin(ra)), az = V3(Math.sin(ra), 0, Math.cos(ra));
      const mid = rc.clone().addScaledVector(az, 0.17).addScaledVector(ax, 0.07);
      const t = 0.0004, len = 0.2;
      const pts = []; for (let i = 0; i <= 24; i++) pts.push(mid.clone().addScaledVector(ax, -len / 2 + (len * i) / 24).setY(0));
      const prof = [[-0.026, T + t], [-0.0012, T + t], [0.0022, t + 0.0006], [0.024, t], [0.024, 0.00005], [0.0016, 0.0002], [-0.0004, T + 0.00005], [-0.026, T + 0.00005]];
      const strip = K.sweep(pts, prof.slice().reverse(), { normals: pts.map(() => V3(0, 1, 0)) });
      B.add(gaffer, strip);
    }
  }
  if (kinds.includes('dubbelzijdig')) {
    // standing on its edge at the front left, turned so the side face shows
    place(B, roll(linerMat(), sideMat('#E9E6DC', 0.0011, 0.86), card, { Ro: 0.062 }), { at: cam(-0.13, 0.11), yaw: AZ + 52, stand: true });
  }
  const g = K.finish(B, `tapeRoll ${kinds.join('+')}`);
  return {
    object: g,
    detail: { target: [0, 0.03, 0.1], size: 0.16, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 30 } },
    rig: L5.goodsRig({ tone: 'mid', size: 0.35, extra: L5.flatLayRig().default }),
    meta: { kinds },
  };
}
