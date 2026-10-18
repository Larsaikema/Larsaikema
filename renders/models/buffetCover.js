// Stretch cover (lycra) for a rectangular folding table or a beer-table set.
//
// { length, width, height, color, kind: 'klaptafel' | 'biertafelset' }
//   klaptafel   default 183 x 76 x 74 cm HDPE folding table: the cover is tight over the
//               top, wraps the rounded edge and runs down the four sides to a foot pocket
//               on each leg; between the legs the hem arches up (higher on the long sides),
//               the side panels are drawn slightly inward by the tension.
//   print {svg|name, color, width (m), y (centre height, m)}: one-colour logo on the front panel.
//   biertafelset beer-table set: covers on the table (220 x 50, 76 cm high) and on the two
//               benches (220 x 25, 47 cm high), same construction ('bierbank' = one bench).
// The table itself is hidden by the cover, so only the cloth is built.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import { makeNoise2 } from '../js/rng.js';
import { resolvePrint, artTexture, decalMaterial } from '../js/printDecal.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function buffetCover(p = {}) {
  const kind = String(p.kind || 'klaptafel').toLowerCase();
  if (kind === 'biertafelset' && !p.single) {
    const W0 = Number(p.width ?? 0.5), L0 = Number(p.length ?? 2.2);
    const set = new THREE.Group(); set.name = `buffetCover biertafelset ${p.color || 'zwart'}`;
    const t = buffetCover({ ...p, single: true });
    set.add(t.object);
    for (const sz of [-1, 1]) {
      const b = buffetCover({ ...p, kind: 'bierbank', length: L0, width: 0.25, height: 0.47 });
      b.object.position.z = sz * (W0 / 2 + 0.3);
      set.add(b.object);
    }
    return { object: set, detail: t.detail, meta: { ...t.meta, set: true } };
  }
  const bank = kind === 'bierbank';
  const beer = kind.startsWith('bier');
  const L = Number(p.length ?? (beer ? 2.2 : 1.83)), W = Number(p.width ?? (beer ? 0.5 : 0.76));
  const H = Number(p.height ?? (beer ? 0.76 : 0.74));
  const T = beer ? 0.03 : 0.045;          // top thickness
  const f = 0.003;                          // fabric offset
  const color = p.color || 'zwart';
  const mat = M.lycra(color);
  const nz = makeNoise2(19);
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `buffetCover ${kind} ${color}`;

  // ---- top: the cloth over the slab and its rounded edge --------------------------------
  const rEdge = beer ? 0.008 : 0.02;
  const top = G.roundedBox(L + 2 * f, T + 2 * f, W + 2 * f, rEdge, 4);
  top.translate(0, H - T / 2, 0);
  bins.add(mat, top);

  // ---- skirt: perimeter (rounded rectangle) from the underside of the top to the hem ----
  // leg pockets: the U frames of a folding table stand ~9 cm in from the ends, the legs
  // close to the long edges
  const lx = L / 2 - (beer ? 0.18 : 0.09), lz = W / 2 - (bank ? 0.03 : beer ? 0.06 : 0.035);
  const rc = 0.03;                                  // plan corner radius of the cover
  const ax = L / 2 + f, az = W / 2 + f;
  const sides = [ // straight runs of the outline, counter-clockwise seen from above
    { a: V3(-ax + rc, 0, az), b: V3(ax - rc, 0, az), n: V3(0, 0, 1), long: true },
    { a: V3(ax, 0, az - rc), b: V3(ax, 0, -az + rc), n: V3(1, 0, 0), long: false },
    { a: V3(ax - rc, 0, -az), b: V3(-ax + rc, 0, -az), n: V3(0, 0, -1), long: true },
    { a: V3(-ax, 0, -az + rc), b: V3(-ax, 0, az - rc), n: V3(-1, 0, 0), long: false },
  ];
  // build a dense outline (with quarter-circle corners) and remember for each sample how
  // far it is (along the outline) from the nearest leg pocket and how long that bay is
  const outline = [];
  const corner = (c, a0) => { for (let i = 1; i < 8; i++) { const a = a0 + (i / 8) * 90 * DEG; outline.push({ P: V3(c.x + Math.cos(a) * rc, 0, c.z - Math.sin(a) * rc), n: V3(Math.cos(a), 0, -Math.sin(a)), side: -1 }); } };
  const corners = [V3(ax - rc, 0, az - rc), V3(ax - rc, 0, -az + rc), V3(-ax + rc, 0, -az + rc), V3(-ax + rc, 0, az - rc)];
  const startAngles = [-90 * DEG, 0, 90 * DEG, 180 * DEG];
  sides.forEach((s, k) => {
    const len = s.a.distanceTo(s.b), m = Math.max(8, Math.round(len / 0.02));
    for (let i = 0; i <= m; i++) outline.push({ P: s.a.clone().lerp(s.b, i / m), n: s.n.clone(), side: k });
    corner(corners[k], startAngles[k] + 0 * DEG);
  });
  outline.push({ ...outline[0], P: outline[0].P.clone(), n: outline[0].n.clone() }); // close
  // hem height: 0 at the leg pockets, arching up between them
  const archLong = bank ? 0.12 : beer ? 0.18 : 0.26, archShort = bank ? 0.05 : beer ? 0.1 : 0.16;
  const hemAt = (P) => {
    const ux = Math.abs(P.x), uz = Math.abs(P.z);
    // position along the long side between the two pockets, and along the short side
    const tLong = Math.min(1, Math.max(0, (lx - ux) / lx));     // 0 at a pocket, 1 at the middle
    const tShort = Math.min(1, Math.max(0, (lz - uz) / lz));
    const onLong = uz / az > ux / ax;
    const t = onLong ? tLong : tShort;
    const amp = onLong ? archLong : archShort;
    // flat-topped arch: steep near the pocket, broad over the middle
    const shape = Math.pow(Math.sin(Math.min(1, t * 1.25) * Math.PI / 2), 0.55);
    return 0.004 + amp * shape;
  };
  const nu = outline.length - 1, nv = 40;
  const yTop = H - T - f;
  const skirtPoint = (P, n, u, v, o) => {
    const ux = Math.abs(P.x), uz = Math.abs(P.z);
    const nearLeg = Math.exp(-(((Math.max(0, ux - lx)) / 0.06) ** 2 + ((Math.max(0, uz - lz)) / 0.06) ** 2)) * Math.exp(-(((ux - lx) / 0.12) ** 2 + ((uz - lz) / 0.12) ** 2) * 0.3);
    const pull = 0.018 * Math.sin(Math.PI * Math.min(1, v * 1.05)) * (1 - 0.6 * nearLeg) + 0.012 * v * v;
    const wob = 0.0025 * nz.noise(u * 40, v * 3) * Math.sin(Math.PI * v);
    return o.copy(P).addScaledVector(n, -pull + wob);
  };
  const geo = G.surface((u, v, o) => {
    const i = Math.round(u * nu);
    const { P, n } = outline[i];
    const hem = hemAt(P);
    const y = yTop - v * (yTop - hem);
    // leg pocket: near the pockets the cloth runs down to the floor round the leg, so the
    // panel bottom is pulled in to the leg line; between the pockets the panel is drawn
    // inward by the tension (deepest just above the arch)
    const ux = Math.abs(P.x), uz = Math.abs(P.z);
    const nearLeg = Math.exp(-(((Math.max(0, ux - lx)) / 0.06) ** 2 + ((Math.max(0, uz - lz)) / 0.06) ** 2)) * Math.exp(-(((ux - lx) / 0.12) ** 2 + ((uz - lz) / 0.12) ** 2) * 0.3);
    const pull = 0.018 * Math.sin(Math.PI * Math.min(1, v * 1.05)) * (1 - 0.6 * nearLeg) + 0.012 * v * v;
    const wob = 0.0025 * nz.noise(u * 40, v * 3) * Math.sin(Math.PI * v);
    o.copy(P).addScaledVector(n, -pull + wob).setY(y);
  }, nu, nv);
  geo.computeVertexNormals();
  bins.add(mat, geo);
  // folded hem: a soft rolled edge along the bottom of the skirt
  const hemPts = [];
  for (let i = 0; i < nu; i += 1) {
    const { P, n } = outline[i];
    hemPts.push(P.clone().addScaledVector(n, -0.018 * 0 - 0.012).setY(hemAt(P) + 0.002));
  }
  const hemCurve = new THREE.CatmullRomCurve3(hemPts, true);
  bins.add(mat, new THREE.TubeGeometry(hemCurve, nu * 2, 0.0035, 8, true));
  // foot pockets: the cloth closes round each foot in a small cup on the floor
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cup = G.lathe([[0.0001, 0], [0.03, 0], [0.033, 0.01], [0.028, 0.05], [0.02, 0.09]], 24);
    cup.translate(sx * (ax - 0.012), 0, sz * (az - 0.012));
    bins.add(mat, cup);
  }
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const art = p.print ? resolvePrint(p.print) : null;
  if (art) {
    // front panel (+z): outline index of x along the first straight run
    const a0 = -ax + rc, len = 2 * (ax - rc), m0 = Math.max(8, Math.round(len / 0.02));
    const hemMid = hemAt(V3(0, 0, az));
    let wP = Math.min(L * 0.6, Number(p.print.width ?? 0.9)), hP = wP * art.vb[1] / art.vb[0];
    const hMax = (yTop - hemMid) * 0.55;
    if (hP > hMax) { wP *= hMax / hP; hP = hMax; }
    const yc = Number(p.print.y ?? (yTop + hemMid) / 2 + 0.03);
    const tex = artTexture(art, M.resolveColor(p.print.color, '#FFFFFF'), 1024, Math.max(16, Math.round(1024 * hP / wP)));
    const nF = V3(0, 0, 1), tmp = V3();
    const decal = G.surface((u, v, o) => {
      const x = -wP / 2 + u * wP, y = yc - hP / 2 + v * hP;
      const P = V3(x, 0, az);
      const vs = (yTop - y) / (yTop - hemAt(P));
      const us = ((x - a0) / len) * m0 / nu;
      skirtPoint(P, nF, us, vs, tmp);
      o.copy(tmp).addScaledVector(nF, 0.0025).setY(y);
    }, 48, 12);
    decal.computeVertexNormals();
    group.add(G.mesh(decal, decalMaterial(tex), { cast: false }));
  }
  const detail = { target: [L * 0.32, H - 0.12, W / 2], size: 0.6, azimuth: 30, elevation: 12 };
  return { object: group, detail, meta: { kind, color, L, W, H } };
}
