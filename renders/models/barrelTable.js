// Statafel wijnvat: standing table in the shape of an oak wine barrel with a round top.
//
// { top, height, finish, staves }
//   top     top diameter (0.8 m default; cm accepted)
//   height  total height (1.05 m default)
//   finish  'houtlook' (toasted oak look, default) | 'donker' | 'naturel'
// The catalogue product is rotomoulded UV-stabilised PE with the wood grain, stave joints and
// hoops moulded in, painted in an oak tone: so the barrel reads as wood (grain along each stave,
// tone varying stave to stave, fine joints, black hoops with rivet heads), with the soft satin of
// coated plastic instead of raw timber. The top is one moulded Ø80 disc with five plank faces
// (grain along the planks, shallow moulded joints that stop short of the edge) and a continuous
// rounded edge. A screw-capped bung hole sits in the belly (fill with water or sand).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function barrelTable(p = {}) {
  let Dt = Number(p.top ?? p.diameter ?? 0.8); if (Dt > 5) Dt /= 100;
  let Htot = Number(p.height ?? 1.05); if (Htot > 5) Htot /= 100;
  const fin = String(p.finish || 'houtlook').toLowerCase();
  const tone = fin === 'donker' ? ['#5A3E28', '#4E3522', '#634530'] : fin === 'naturel' ? ['#B48C5E', '#A57E52', '#BE9868'] : ['#8E6743', '#7E5A39', '#9A7350', '#86613F'];
  // moulded + painted PE: satin, no clear lacquer
  const satin = (m) => { const c = m.clone(); c.clearcoat = 0.05; c.roughness = 0.58; c.normalScale = new THREE.Vector2(0.55, 0.55); c.userData = { ...m.userData }; delete c.userData.__hooked; return c; };
  const staveMats = tone.map((t, i) => satin(S.woodMat('eiken', { stain: t, finish: 'mat', seed: 40 + i })));
  const topMats = [0, 1, 2].map((i) => satin(S.woodMat('eiken', { stain: tone[i % tone.length], finish: 'mat', seed: 51 + i })));
  const jointMat = new THREE.MeshPhysicalMaterial({ color: '#2A1C12', roughness: 0.8, side: THREE.DoubleSide, name: 'moulded joint' });
  const edgeMat = satin(S.woodMat('eiken', { stain: tone[1], finish: 'mat', seed: 58 }));
  const hoopMat = M.steelPowder('#232425', { roughness: 0.55, clearcoat: 0.08 });
  const capMat = new THREE.MeshPhysicalMaterial({ color: '#3B2A1E', roughness: 0.5, specularIntensity: 0.4, name: 'bung cap' });
  const bins = new G.PartBin();
  const R = rng(9);
  const Tt = 0.035;
  const Hb = Htot - Tt;                  // barrel height (top rests on the chime)
  const Rhd = 0.3, Rbl = 0.355, th = 0.02;
  const rOf = (y) => { const t = (y - Hb / 2) / (Hb / 2); return Rhd + (Rbl - Rhd) * (1 - t * t); };
  const N = Number(p.staves ?? 28);
  const gap = 0.0012;
  // staves: unequal widths, each its own stretch of grain and tone
  const edges = [0]; for (let k = 1; k < N; k++) edges.push((k + (R() - 0.5) * 0.3) / N * TAU); edges.push(TAU);
  for (let k = 0; k < N; k++) {
    const a0 = edges[k], a1 = edges[k + 1];
    const mat = staveMats[Math.floor(R() * staveMats.length)];
    const bulge = (R() - 0.5) * 0.0016;
    const ang = (u, rad) => a0 + gap / rad + (a1 - a0 - 2 * gap / rad) * u;
    const outer = G.surface((u, v, o) => {
      const y = v * Hb, rad = rOf(y) + bulge, a = ang(u, rad);
      const c = Math.cos((u - 0.5) * (a1 - a0)) ** 0.3; // flat across the stave
      o.set(Math.sin(a) * rad * c, y, Math.cos(a) * rad * c);
    }, 5, 48);
    const pos = outer.attributes.position, uv = outer.attributes.uv;
    const voff = R() * 3, uoff = R() * 0.2, flip = R() < 0.5 ? -1 : 1;
    const w = (a1 - a0) * Rbl;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getY(i) * flip + voff, uv.getX(i) * w + uoff);
    bins.add(mat, outer);
    // stave side faces (the moulded joint walls)
    for (const u of [0, 1]) {
      const e = G.surface((s, v, o) => {
        const y = v * Hb, rad = rOf(y) + bulge, a = ang(u, rad), rr = rad - 0.004 * s;
        o.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      }, 1, 30, { flipNormals: u === 0 });
      bins.add(jointMat, e);
    }
  }
  // joint floor (dark) behind the staves, chime ring + head at the top, foot ring
  { const pr = []; for (let i = 0; i <= 40; i++) { const y = (i / 40) * Hb; pr.push([rOf(y) - 0.0035, y]); } bins.add(jointMat, G.lathe(pr, 128)); }
  bins.add(edgeMat, G.lathe([[rOf(0) - th, 0.0004], [rOf(0) + 0.0005, 0.0004]], 128));
  // hoops: [centre y fraction, width]; moulded, black, two rivets each
  const hoops = [[0.04, 0.045], [0.17, 0.05], [0.36, 0.055], [0.64, 0.055], [0.83, 0.05], [0.96, 0.045]];
  for (const [f, w] of hoops) {
    const yc = f * Hb, y0 = yc - w / 2, y1 = yc + w / 2, t = 0.0025;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const y = y0 + (y1 - y0) * (i / 8); const e = Math.min(1, Math.min(i, 8 - i) / 1.2); pts.push([rOf(y) + t * e + 0.0004, y]); }
    bins.add(hoopMat, G.lathe([[rOf(y0) - 0.001, y0], ...pts, [rOf(y1) - 0.001, y1]], 160));
    const a = 0.9 + f * 2.6;
    for (const dy of [-w * 0.22, w * 0.22]) {
      const y = yc + dy, rad = rOf(y) + t + 0.0004;
      const nn = V3(Math.sin(a), 0, Math.cos(a));
      F.rivet(bins, hoopMat, nn.clone().multiplyScalar(rad).setY(y), nn, 0.0045);
    }
  }
  // bung hole with a ribbed screw cap in the belly (towards the hero camera's left)
  {
    const a = 8 * DEG, y = Hb * 0.5, rad = rOf(y);
    const nn = V3(Math.sin(a), 0, Math.cos(a));
    const c = nn.clone().multiplyScalar(rad).setY(y);
    bins.add(jointMat, F.latheAt([[0.0001, -0.004], [0.034, -0.004], [0.034, 0.0005], [0.0001, 0.0005]].reverse(), c, nn, 40));
    const capP = [[0.0001, 0.0], [0.03, 0.0], [0.031, 0.004], [0.0305, 0.012], [0.028, 0.0145], [0.0001, 0.0145]];
    bins.add(capMat, F.latheAt(capP.slice().reverse(), c, nn, 48));
    for (let k = 0; k < 24; k++) { // grip ribs
      const b = (k / 24) * TAU;
      const t1 = new THREE.Vector3().crossVectors(nn, V3(0, 1, 0)).normalize(), t2 = V3(0, 1, 0);
      const d = t1.clone().multiplyScalar(Math.cos(b)).addScaledVector(t2, Math.sin(b));
      bins.add(capMat, F.boxAt(0.003, 0.009, 0.0025, c.clone().addScaledVector(nn, 0.0075).addScaledVector(d, 0.0312), d, nn, 0.0008));
    }
    bins.add(capMat, F.boxAt(0.034, 0.006, 0.004, c.clone().addScaledVector(nn, 0.016), new THREE.Vector3().crossVectors(nn, V3(0, 1, 0)).normalize(), nn, 0.0015));
  }
  // top: one moulded disc; five plank faces with shallow joints, continuous rounded edge
  const Rt = Dt / 2, re = 0.01, planks = 5, jw = 0.0025;
  const yT = Htot;
  const pw = (2 * (Rt - re)) / planks;
  for (let k = 0; k < planks; k++) {
    const z0 = -(Rt - re) + k * pw + (k ? jw / 2 : 0), z1 = -(Rt - re) + (k + 1) * pw - (k < planks - 1 ? jw / 2 : 0);
    const half = (z) => Math.sqrt(Math.max(0, (Rt - re) ** 2 - z * z));
    const face = G.surface((u, v, o) => { const z = z0 + (z1 - z0) * v; const hx = half(z); o.set(-hx + 2 * hx * u, yT, z); }, 48, 8, { flipNormals: true });
    const pos = face.attributes.position, uv = face.attributes.uv;
    const off = R() * 2, fl = R() < 0.5 ? -1 : 1;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * fl + off, pos.getZ(i) + off * 0.2);
    bins.add(topMats[k % topMats.length], face);
  }
  // joint floor 2 mm below the faces, and the rounded edge ring (top face from Rt - re out)
  bins.add(jointMat, G.lathe([[0.0001, yT - 0.002], [Rt - re + 0.0005, yT - 0.002]].reverse(), 96));
  {
    const prof = [[Rt - re - 0.0004, yT - 0.002], [Rt - re - 0.0004, yT]];
    for (let i = 1; i <= 8; i++) { const a = (Math.PI / 2) * (1 - i / 8); prof.push([Rt - re + Math.cos(a) * re, yT - re + Math.sin(a) * re]); }
    for (let i = 1; i <= 6; i++) { const a = -(Math.PI / 2) * (i / 6); prof.push([Rt - 0.005 + Math.cos(a) * 0.005, yT - Tt + 0.005 + Math.sin(a) * 0.005]); }
    prof.push([rOf(Hb) - 0.01, yT - Tt]);
    const ring = G.lathe(prof.reverse(), 192);
    const pos = ring.attributes.position, uv = ring.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, Math.atan2(pos.getX(i), pos.getZ(i)) * Rt + 3, pos.getY(i) * 2);
    bins.add(edgeMat, ring);
  }
  const group = new THREE.Group(); group.name = `barrelTable Ø${Dt}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [0.18, Hb * 0.62, 0.32], size: 0.45, azimuth: 30, elevation: 10 },
    meta: { Dt, Htot },
    rig: S.seatRig(group),
  };
}
