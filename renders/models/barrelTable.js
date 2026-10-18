// Statafel wijnvat: standing table made from an oak wine barrel with a round top.
//
// { top, height, finish, staves, hoops }
//   top     top diameter (0.8 m default; cm accepted)
//   height  total height (1.05 m default)
//   finish  'houtlook' / 'eiken' (toasted oak, default) | 'donker' | 'naturel'
// Construction: ~28 oak staves (25 mm) with the bulge of a barrique, small joints between
// the staves, ends standing proud of the heads (chime); six black steel hoops (two chime,
// two quarter, two bilge) with riveted joints; a solid oak top glued from 5 planks with
// rounded arrises, screwed onto the top head.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;

// Disc of radius R glued from planks (along x), top at y = 0, thickness T, rounded arris.
function plankDisc(bins, R, T, mats, { planks = 5, re = 0.006, seed = 3 } = {}) {
  const Rn = rng(seed);
  const pw = (2 * R) / planks;
  for (let k = 0; k < planks; k++) {
    const mat = mats[k % mats.length];
    const z0 = -R + k * pw + 0.0002, z1 = -R + (k + 1) * pw - 0.0002;
    const half = (z) => Math.sqrt(Math.max(0, R * R - z * z));
    const off = Rn() * 2, flip = k % 2 ? -1 : 1;
    const face = (y, up) => {
      const g = G.surface((u, v, o) => {
        const z = z0 + (z1 - z0) * v;
        const hx = half(z) - re;
        o.set(-hx + 2 * hx * u, y, z);
      }, 40, 6, { flipNormals: up });
      const pos = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * flip + off, pos.getZ(i) + off * 0.3);
      return g;
    };
    bins.add(mat, face(0, true));
    bins.add(mat, face(-T, false));
    // rounded edge on both ends of the plank (arc segment of the disc edge)
    for (const sgn of [-1, 1]) {
      const g = G.surface((u, v, o) => {
        const z = z0 + (z1 - z0) * u;
        const a = -Math.PI / 2 + Math.PI * v; // around the arris profile: top -> bottom
        const yy = Math.sin(-a) * (T / 2 - 0.0005) - T / 2;
        const rr = re * Math.max(0, Math.cos(a)) + 0.0001;
        const rad = half(z) - re + rr;
        o.set(sgn * rad, yy, z);
      }, 10, 10, { flipNormals: sgn < 0 });
      const pos = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getZ(i) + off, pos.getY(i) * 3);
      bins.add(mat, g);
    }
  }
}

export function barrelTable(p = {}) {
  let Dt = Number(p.top ?? p.diameter ?? 0.8); if (Dt > 5) Dt /= 100;
  let Htot = Number(p.height ?? 1.05); if (Htot > 5) Htot /= 100;
  const fin = String(p.finish || 'houtlook').toLowerCase();
  const tone = fin === 'donker' ? ['#5A3E28', '#4E3522', '#634530'] : fin === 'naturel' ? ['#B48C5E', '#A57E52', '#BE9868'] : ['#8C6440', '#7C5636', '#97704A', '#86603D'];
  const staveMats = tone.map((t, i) => F.wood('eiken', { stain: t, finish: 'mat', seed: 40 + i }));
  const topMats = [F.wood('eiken', { stain: tone[0], finish: 'lak', seed: 51 }), F.wood('eiken', { stain: tone[2] || tone[0], finish: 'lak', seed: 52 })];
  const endMat = F.woodEnd('eiken', { stain: tone[1] });
  const hoopMat = M.steelPowder('#242526', { roughness: 0.5, clearcoat: 0.15 });
  const bins = new G.PartBin();
  const Tt = 0.035;
  const Hb = Htot - Tt - 0.005;          // barrel height incl. chime
  const Rhd = 0.3, Rbl = 0.355, th = 0.026;
  const rOf = (y) => { const t = (y - Hb / 2) / (Hb / 2); return Rhd + (Rbl - Rhd) * (1 - t * t); };
  const N = Number(p.staves ?? 28);
  const Rn = rng(9);
  const gap = 0.0016;
  for (let k = 0; k < N; k++) {
    const w0 = (k / N) * TAU, w1 = ((k + 1) / N) * TAU;
    // staves are not all equally wide
    const jitter = (Rn() - 0.5) * 0.25 / N * TAU;
    const a0 = w0 + (k ? jitter * 0.5 : 0), a1 = w1 + (k < N - 1 ? 0 : 0);
    const mat = staveMats[Math.floor(Rn() * staveMats.length)];
    const ang = (u, R) => a0 + (gap / R) + (a1 - a0 - 2 * gap / R) * u;
    const outer = G.surface((u, v, o) => {
      const y = v * Hb, R = rOf(y), a = ang(u, R);
      // stave is slightly flat across its width (chord), bulging less at the edges
      const c = Math.cos((u - 0.5) * (a1 - a0)) ** 0.25;
      o.set(Math.sin(a) * R * c, y, Math.cos(a) * R * c);
    }, 4, 40);
    const pos = outer.attributes.position, uv = outer.attributes.uv;
    const voff = Rn() * 2;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getY(i) + voff, uv.getX(i) * 0.09 + k * 0.13);
    bins.add(mat, outer);
    // stave edges (visible in the joints)
    for (const u of [0, 1]) {
      const e = G.surface((s, v, o) => {
        const y = v * Hb, R = rOf(y), a = ang(u, R);
        const rr = R - th * s;
        o.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      }, 1, 30, { flipNormals: u === 0 });
      bins.add(endMat, e);
    }
  }
  // inner wall (charred inside) seen through the stave joints
  { const pr = []; for (let i = 0; i <= 24; i++) { const y = (i / 24) * Hb; pr.push([rOf(y) - th + 0.002, y]); } bins.add(M.rubber('#1E1611'), G.lathe(pr, 96)); }
  // end grain ring at the floor and the top
  bins.add(endMat, G.lathe([[rOf(0) - th, 0.0005], [rOf(0), 0.0005]], 96));
  bins.add(endMat, G.lathe([[rOf(Hb), Hb], [rOf(Hb) - th, Hb]], 96));
  bins.add(endMat, G.lathe([[0.0001, Hb - 0.03], [rOf(Hb) - th, Hb - 0.03]].reverse(), 64));
  // hoops: [centre y fraction, width]
  const hoops = [[0.035, 0.045], [0.16, 0.05], [0.36, 0.055], [0.64, 0.055], [0.84, 0.05], [0.965, 0.045]];
  for (const [f, w] of hoops) {
    const yc = f * Hb, y0 = yc - w / 2, y1 = yc + w / 2;
    const pts = [];
    const t = 0.0022;
    for (let i = 0; i <= 6; i++) { const y = y0 + (y1 - y0) * (i / 6); pts.push([rOf(y) + t, y]); }
    const prof = [[rOf(y0) - 0.001, y0], ...pts, [rOf(y1) - 0.001, y1]];
    bins.add(hoopMat, G.lathe(prof, 128));
    // two rivets at the joint
    const a = 2.2 + f * 3;
    for (const dy of [-w * 0.22, w * 0.22]) {
      const y = yc + dy, R = rOf(y) + t;
      const n = V3(Math.sin(a), 0, Math.cos(a));
      F.rivet(bins, hoopMat, n.clone().multiplyScalar(R).setY(y), n, 0.0045);
    }
  }
  // top: glued oak planks
  const topG = new G.PartBin();
  plankDisc(topG, Dt / 2, Tt, topMats, { planks: 5, re: 0.008 });
  for (const [mat, list] of topG.bins) for (const g of list) bins.add(mat, g.translate(0, Htot, 0));
  const group = new THREE.Group(); group.name = `barrelTable Ø${Dt}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [0.18, Hb * 0.62, 0.32], size: 0.45, azimuth: 30, elevation: 10 },
    meta: { Dt, Htot },
  };
}
