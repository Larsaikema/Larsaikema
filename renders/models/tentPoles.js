// Palen stretchtent (stretch tent poles).
//
// { material, length, count }
//   material 'hout' (default): peeled sweet chestnut, Ø ~95 mm at the foot tapering to ~80 mm,
//            naturally a little bent and out of round, draw-knife facets, knots; a galvanised
//            steel band at both ends against splitting, a Ø 16 mm steel pin on top (fits the
//            tent's eyelet / pole connector) and a rubber foot cap
//   material 'alu': Ø 50 mm anodised aluminium tube with a moulded top cap with pin and a
//            rubber foot
// Shown lying on the floor side by side, slightly staggered, running diagonally through the frame.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import { makeNoise2 } from '../js/rng.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function woodPole(bins, mats, { L, seed }) {
  const nz = makeNoise2(seed);
  const nl = 260, nr = 56;
  const rows = [];
  // pole along +X from 0 (foot) to L (top); centre-line bends gently (two low-frequency waves)
  // a grown pole: never quite straight (two gentle bends and a slight dog-leg)
  const bendY = (s) => 0.014 * Math.sin(Math.PI * s / L) + 0.006 * nz.noise(s * 0.9, 3.1);
  const bendZ = (s) => 0.024 * Math.sin(Math.PI * s / L * 1.3 + 0.4) * (0.6 + 0.4 * nz.noise(s * 0.6, 7.3)) + 0.008 * nz.noise(s * 1.7, 9.1);
  const radius = (s, a) => {
    const base = 0.0475 - 0.008 * (s / L);
    const oor = 1 + 0.045 * Math.cos(2 * a + nz.noise(s * 0.5, 1.7) * 2) + 0.02 * nz.noise(Math.cos(a) * 2 + s * 3, Math.sin(a) * 2) + 0.012 * nz.noise(s * 4.5, a * 1.3);
    // draw-knife facets: flats along the pole
    const facet = 1 - 0.012 * Math.abs(Math.sin(a * 6 + nz.noise(s * 0.7, 4) * 2.5));
    // knots: low bumps where side branches were cut off
    let knot = 0;
    for (const [ks, ka] of [[0.62, 1.1], [1.48, 4.0], [2.2, 2.3], [0.25, 5.2], [1.05, 0.2], [2.62, 3.5]]) { const d = Math.hypot((s - ks) * 9, Math.atan2(Math.sin(a - ka), Math.cos(a - ka)) * 2.2); knot += 0.028 * Math.max(0, 1 - d) ** 1.5; }
    // ends slightly chamfered
    const endK = Math.min(1, s / 0.012, (L - s) / 0.012);
    return base * oor * facet * (1 + knot) * (0.93 + 0.07 * Math.min(1, endK));
  };
  for (let i = 0; i <= nl; i++) {
    const s = (i / nl) * L;
    const row = [];
    for (let j = 0; j <= nr; j++) {
      const a = (j / nr) * TAU;
      const r = radius(s, a);
      row.push(V3(s, Math.cos(a) * r + bendY(s), Math.sin(a) * r + bendZ(s)));
    }
    rows.push(row);
  }
  // rows along the length; u around: transpose
  const ring = [];
  for (let j = 0; j <= nr; j++) ring.push(rows.map((r) => r[j]));
  const g = K.gridGeometry(ring.map((col) => col), { closedU: false, flip: true });
  // uv: u = along (m) is in rows; remap to u = around (m), v = along (m) for the wood texture
  const uv = g.attributes.uv;
  for (let j = 0; j <= nr; j++) for (let i = 0; i <= nl; i++) { const k = j * (nl + 1) + i; uv.setXY(k, (j / nr) * TAU * 0.045, 0.05 + (i / nl) * L); }
  bins.add(mats.woodOf(seed), g);
  // end grain discs (sawn ends)
  for (const s of [0, L]) {
    const c = V3(s, bendY(s), bendZ(s));
    const disc = new THREE.CircleGeometry(radius(s, 0) * 0.94, 32);
    disc.rotateY(s === 0 ? -Math.PI / 2 : Math.PI / 2);
    disc.translate(c.x + (s === 0 ? -0.0002 : 0.0002), c.y, c.z);
    bins.add(mats.endGrain, disc);
  }
  // galvanised bands near both ends
  for (const [s0, s1] of [[0.02, 0.06], [L - 0.06, L - 0.02]]) {
    const r = radius((s0 + s1) / 2, 0) + 0.0035;
    const c0 = V3(s0, bendY(s0), bendZ(s0)), c1 = V3(s1, bendY(s1), bendZ(s1));
    bins.add(mats.galv, G.tube(c0, c1, r, 40));
  }
  // steel pin on top + rubber foot cap
  const ct = V3(L, bendY(L), bendZ(L));
  bins.add(mats.galv, G.tube(ct.clone().add(V3(-0.01, 0, 0)), ct.clone().add(V3(0.085, 0, 0)), 0.008, 18));
  bins.add(mats.galv, G.tube(ct.clone().add(V3(-0.001, 0, 0)), ct.clone().add(V3(0.005, 0, 0)), 0.03, 32)); // washer plate
  const cf = V3(0, bendY(0), bendZ(0));
  // rubber foot cap pushed over the foot: closed end beyond the sawn face, rim over the wood
  const rf = radius(0.03, 0) * 0.93;
  bins.add(mats.rubber, K.lathe([[0.0001, -0.03], [rf - 0.002, -0.03], [rf + 0.004, -0.026], [rf + 0.0062, -0.018], [rf + 0.0062, 0.032], [rf + 0.0045, 0.037], [rf + 0.0012, 0.038]], 48).rotateZ(-Math.PI / 2).translate(cf.x, cf.y, cf.z));
  // moulded ribs on the cap
  for (const x of [-0.008, 0.0, 0.008]) bins.add(mats.rubber, G.tube(V3(cf.x + x - 0.0015, cf.y, cf.z), V3(cf.x + x + 0.0015, cf.y, cf.z), rf + 0.0072, 48));
  return { L };
}

export function tentPoles(p = {}) {
  const n = Number(p.count ?? 2);
  const L = Number(p.length ?? 3);
  const material = String(p.material || 'hout');
  const mats = { woodOf: (sd) => L3.chestnutPole(sd, { len: Math.max(3.2, L + 0.2), circ: TAU * 0.045 }), wood: K.chestnut(), endGrain: new THREE.MeshPhysicalMaterial({ color: '#B98A5A', roughness: 0.85, name: 'end grain' }), galv: L3.galvFine({ cell: 0.0035 }), rubber: SG.rubberSG('#161616', { rough: 0.72 }) };
  const bins = new G.PartBin();
  for (let i = 0; i < n; i++) {
    const sub = new G.PartBin();
    if (material === 'alu') {
      const alu = M.aluminium({ tone: '#BFC3C7', roughness: 0.4 });
      sub.add(alu, G.tube(V3(0, 0, 0), V3(L, 0, 0), 0.025, 40));
      sub.add(mats.rubber, G.tube(V3(-0.03, 0, 0), V3(0.03, 0, 0), 0.028, 32));
      sub.add(K.abs('#161616', 0.45), G.tube(V3(L - 0.04, 0, 0), V3(L + 0.01, 0, 0), 0.0275, 32));
      sub.add(mats.galv, G.tube(V3(L, 0, 0), V3(L + 0.08, 0, 0), 0.008, 18));
    } else woodPole(sub, mats, { L, seed: 31 + i * 17 });
    // rest on the floor: lowest point -> y = 0
    let yMin = Infinity; for (const [, list] of sub.bins) for (const g of list) { g.computeBoundingBox(); yMin = Math.min(yMin, g.boundingBox.min.y); }
    // side by side, parallel, the second one a little further along (ends do not line up)
    const m = new THREE.Matrix4().makeRotationY(0).setPosition(-L / 2 + i * 0.12, -yMin, (i - (n - 1) / 2) * 0.17);
    for (const [mat, list] of sub.bins) for (const g of list) { g.applyMatrix4(m); bins.add(mat, g); }
  }
  const g = K.finish(bins, `tentPoles ${material} ${L}`);
  g.rotation.y = -26 * DEG;
  const root = new THREE.Group(); root.add(g);
  return {
    object: root,
    detail: { target: [L * 0.4, 0.05, -0.2], size: 0.4, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 30 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.012, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { material, L, n },
  };
}
