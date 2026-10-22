// Barkruk wijnvat: a bar stool in the shape of a small wine barrel (furniture group, round 5).
// Called from barStool.js for `style: 'vat'` (or 'wijnvat' / 'barrel').
//
// { height, finish, staves }
//   height  seat height (0.76 m default; cm accepted)
//   finish  'houtlook' (toasted oak look, default) | 'donker' | 'naturel' — the same tones as the
//           wijnvat-statafel (barrelTable.js), so table and stools read as one set
// The catalogue product is rotomoulded PE with the wood grain, the stave joints and the hoops moulded
// in and painted in an oak tone (like the table): an upright cask Ø 36 at the heads and Ø 43 at the
// bilge, 18 staves of unequal width (grain along each, tone per stave, darker towards the chimes),
// four black hoops with rivet heads, and a seat (zitting met kussenrand): a moulded three-plank
// disc a little wider than the head, with a fat rounded rim you sit on, resting on the chime.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { rng } from '../js/rng.js';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

const { V3 } = G;
const TAU = Math.PI * 2;

const TONES = {
  houtlook: ['#8E6743', '#7A5536', '#9C7650', '#84603F', '#6E4B30', '#A27C56'],
  donker: ['#5A3E28', '#4E3522', '#634530', '#553A26', '#47311F', '#6A4A33'],
  naturel: ['#B48C5E', '#A57E52', '#BE9868', '#AE8658', '#9C7448', '#C49F70'],
};

export function barrelStool(p = {}) {
  let H = Number(p.height ?? 0.76); if (H > 5) H /= 100;
  const fin = String(p.finish || 'houtlook').toLowerCase();
  const tone = TONES[fin] || TONES.houtlook;
  // moulded + painted PE: satin, no clear lacquer (as barrelTable.js)
  const satin = (m, rough = 0.58, vc = false) => { const c = m.clone(); c.clearcoat = 0.05; c.roughness = rough; c.normalScale = new THREE.Vector2(0.7, 0.7); c.vertexColors = vc; c.userData = { ...m.userData }; delete c.userData.__hooked; return c; };
  const staveMats = tone.map((t, i) => satin(S.woodMat('eiken', { stain: t, finish: 'mat', seed: 140 + i }), 0.5 + 0.035 * i, true));
  const staveGeo = new Map();
  const seatMats = [0, 2, 3].map((i) => satin(S.woodMat('eiken', { stain: tone[i], finish: 'mat', seed: 151 + i }), 0.52));
  const jointMat = new THREE.MeshPhysicalMaterial({ color: '#2A1C12', roughness: 0.8, side: THREE.DoubleSide, name: 'moulded joint' });
  const rimMat = satin(S.woodMat('eiken', { stain: tone[1], finish: 'mat', seed: 158 }), 0.5);
  const hoopMat = M.steelPowder('#202123', { roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.28 });
  const glide = F.plastic('#161616', 0.6);
  const bins = new G.PartBin();
  const R = rng(23);

  // ---------------- barrel body (staves) ----------------
  const Ts = 0.04;                         // seat thickness over the chime
  const y0 = 0.008;                        // on a ring of glides
  const Hb = H - Ts - y0;                  // cask height (chime to chime)
  const Rhd = 0.18, Rbl = 0.215;
  const rOf = (y) => { const t = ((y - y0) - Hb / 2) / (Hb / 2); return Rhd + (Rbl - Rhd) * (1 - t * t); };
  const N = Number(p.staves ?? 18);
  const gap = 0.001;
  const edges = [0]; for (let k = 1; k < N; k++) edges.push((k + (R() - 0.5) * 0.3) / N * TAU); edges.push(TAU);
  for (let k = 0; k < N; k++) {
    const a0 = edges[k], a1 = edges[k + 1];
    const mat = staveMats[Math.floor(R() * staveMats.length)];
    const bulge = (R() - 0.5) * 0.0012;
    const ang = (u, rad) => a0 + gap / rad + (a1 - a0 - 2 * gap / rad) * u;
    const outer = G.surface((u, v, o) => {
      const y = y0 + v * Hb, rad = rOf(y) + bulge, a = ang(u, rad);
      const c = Math.cos((u - 0.5) * (a1 - a0)) ** 0.3; // flat across the stave
      o.set(Math.sin(a) * rad * c, y, Math.cos(a) * rad * c);
    }, 5, 40);
    const pos = outer.attributes.position, uv = outer.attributes.uv;
    const voff = R() * 3, uoff = R() * 0.2, flip = R() < 0.5 ? -1 : 1;
    const w = (a1 - a0) * Rbl;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getY(i) * flip + voff, uv.getX(i) * w + uoff);
    const kS = 0.9 + 0.2 * R(), col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) - y0;
      const kk = kS * (1 - 0.2 * Math.exp(-y / 0.07) - 0.22 * Math.exp(-(Hb - y) / 0.06));
      col[i * 3] = kk; col[i * 3 + 1] = kk * 0.985; col[i * 3 + 2] = kk * 0.97;
    }
    outer.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (!staveGeo.has(mat)) staveGeo.set(mat, []);
    staveGeo.get(mat).push(outer);
    for (const u of [0, 1]) {
      const e = G.surface((s, v, o) => {
        const y = y0 + v * Hb, rad = rOf(y) + bulge, a = ang(u, rad), rr = rad - 0.003 * s;
        o.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      }, 1, 24, { flipNormals: u === 0 });
      bins.add(jointMat, e);
    }
  }
  { const pr = []; for (let i = 0; i <= 32; i++) { const y = y0 + (i / 32) * Hb; pr.push([rOf(y) - 0.003, y]); } bins.add(jointMat, G.lathe(pr, 96)); }
  // bottom head (closed) and a ring of four glides under the chime
  bins.add(rimMat, G.lathe([[0.0001, y0 + 0.012], [rOf(y0) - 0.012, y0 + 0.012], [rOf(y0) - 0.004, y0 + 0.0004], [rOf(y0) + 0.0004, y0 + 0.0004]], 96));
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) * (TAU / 4), rr = rOf(y0) - 0.03;
    bins.add(glide, G.lathe([[0.0001, 0], [0.016, 0], [0.017, 0.004], [0.015, y0 + 0.002], [0.0001, y0 + 0.002]], 18).translate(Math.sin(a) * rr, 0, Math.cos(a) * rr));
  }
  // hoops: [centre y fraction, width]; moulded, black, two rivets each
  const hoops = [[0.06, 0.04], [0.27, 0.045], [0.73, 0.045], [0.94, 0.04]];
  for (const [f, wd] of hoops) {
    const yc = y0 + f * Hb, ya = yc - wd / 2, yb = yc + wd / 2, t = 0.0022;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const y = ya + (yb - ya) * (i / 8); const e = Math.min(1, Math.min(i, 8 - i) / 1.2); pts.push([rOf(y) + t * e + 0.0004, y]); }
    bins.add(hoopMat, G.lathe([[rOf(ya) - 0.001, ya], ...pts, [rOf(yb) - 0.001, yb]], 128));
    const a = 0.7 + f * 2.2;
    for (const dy of [-wd * 0.22, wd * 0.22]) {
      const y = yc + dy, rad = rOf(y) + t + 0.0004;
      const nn = V3(Math.sin(a), 0, Math.cos(a));
      F.rivet(bins, hoopMat, nn.clone().multiplyScalar(rad).setY(y), nn, 0.004);
    }
  }

  // ---------------- seat: three-plank moulded disc with a fat rounded rim ----------------
  const yT = H;                             // seat top
  const Rs = rOf(y0 + Hb) + 0.022;          // a little proud of the head
  const rr = 0.016;                         // rim radius (kussenrand)
  const planks = 3, jw = 0.0025;
  const Rin = Rs - rr * 1.6;                // flat field inside the rim
  const pw = (2 * Rin) / planks;
  const yF = yT - 0.007;                    // field sits a little below the rim crown
  for (let k = 0; k < planks; k++) {
    const z0 = -Rin + k * pw + (k ? jw / 2 : 0), z1 = -Rin + (k + 1) * pw - (k < planks - 1 ? jw / 2 : 0);
    const half = (z) => Math.sqrt(Math.max(0, Rin * Rin - z * z));
    const face = G.surface((u, v, o) => { const z = z0 + (z1 - z0) * v; const hx = half(z); o.set(-hx + 2 * hx * u, yF, z); }, 40, 8, { flipNormals: true });
    const pos = face.attributes.position, uv = face.attributes.uv;
    const off = R() * 2, fl = R() < 0.5 ? -1 : 1;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * fl + off, pos.getZ(i) + off * 0.2);
    bins.add(seatMats[k % seatMats.length], face);
  }
  bins.add(jointMat, G.lathe([[0.0001, yF - 0.002], [Rin + 0.0005, yF - 0.002]].reverse(), 96));
  {
    // rim: from the field edge up over a fat rounded bead and down to the underside over the chime
    const prof = [[Rin - 0.0004, yF - 0.002], [Rin - 0.0004, yF]];
    const cx = Rs - rr, cy = yT - rr;
    for (let i = 0; i <= 14; i++) { const a = Math.PI * 0.92 - (Math.PI * 0.92 + Math.PI / 2) * (i / 14); prof.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    prof.push([cx + 0.002, yT - Ts + 0.004]);
    prof.push([rOf(y0 + Hb) - 0.008, yT - Ts]);
    const ring = G.lathe(prof.reverse(), 160);
    const pos = ring.attributes.position, uv = ring.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, Math.atan2(pos.getX(i), pos.getZ(i)) * Rs + 3, pos.getY(i) * 2);
    bins.add(rimMat, ring);
  }

  const group = new THREE.Group(); group.name = `barStool vat ${fin}`;
  bins.build(group);
  for (const [mat, list] of staveGeo) {
    const m = new THREE.Mesh(mergeGeometries(list, false), mat);
    m.castShadow = true; m.receiveShadow = true; m.name = 'staves';
    group.add(m);
  }
  return {
    object: group,
    detail: { target: [0.1, H - 0.03, 0.14], size: 0.3, azimuth: 34, elevation: 22 },
    meta: { style: 'vat', H, stack: 1, color: fin, pitch: 0, footR: Rbl },
    view: { hero: { fill: 0.72 } },
    rig: S.seatRig(group),
  };
}
