// Watergewichtzakken (water weight bags, ~20 kg each).
//
// { count, color, filled }
// Each bag is a ring of PVC tarpaulin (650 g/m², HF-welded seams) that lies round a tent
// leg on the foot plate: Ø ~53 cm, 12 cm high when filled (~20 l), a radial slit lets it go
// round the leg and is closed with a hook-and-loop tab plus a webbing strap with a
// side-release buckle along the inner edge; welded flanges at the outer and inner seams and
// across the slit ends; a screw-cap filler spout on top opposite the slit. Set of four laid
// out 2 x 2, slits turned towards the viewer at slightly different angles.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function ringBag(bins, mats, { Rc = 0.16, w = 0.093, H = 0.12, hs = 0.05, gap = 7 * DEG, seed = 1 }) {
  const nz = makeNoise2(seed);
  const fl = 0.013; // welded flange width
  const phi0 = gap, phi1 = TAU - gap;
  const endTaper = 16 * DEG;
  const nu = 160, nv = 44;
  // cross-section around the tube: v in [0,1): top from outer seam to inner seam, bottom back
  const sec = (v, k) => {
    // k: 0 (flattened end seam) .. 1 (full section)
    const Hk = hs + (H - hs) * k, hsk = hs * (0.5 + 0.5 * k);
    if (v < 0.5) { const s = 1 - 4 * v; /* +1 outer .. -1 inner */ const y = hsk + (Hk - hsk) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 3.4)), 0.5); return [s * w * (0.6 + 0.4 * k), y]; }
    const s = -1 + 4 * (v - 0.5); const y = hsk * (1 - Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 7)), 0.4)); return [s * w * (0.6 + 0.4 * k) * (1 + 0.03 * Math.sin(Math.PI * Math.abs(s))), Math.max(0.0005, y * k + 0.0005 * (1 - k))];
  };
  const rows = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const row = [];
    for (let i = 0; i <= nu; i++) {
      const phi = phi0 + (phi1 - phi0) * (i / nu);
      const dEnd = Math.min(phi - phi0, phi1 - phi);
      const k = K.sstep(0, endTaper, dEnd) * 0.92 + 0.08;
      const [dr, y0] = sec(v, k);
      const wob = 0.004 * nz.fbm(phi * 3, v * 4, 2) * k;
      const r = Rc + dr + wob * Math.sign(dr);
      row.push(V3(Math.cos(phi) * r, y0 + (y0 > hs * 0.9 ? wob * 0.6 : 0), -Math.sin(phi) * r));
    }
    rows.push(row);
  }
  // rows: v around the section, columns along phi: transpose for gridGeometry (u along phi)
  bins.add(mats.pvc, K.gridGeometry(rows, { closedU: false, flip: false }));
  // welded flanges: outer and inner rings + end strips across the slit ends
  const flange = (rr0, rr1, y, a0, a1) => {
    const g = K.gridGeometry([0, 1].map((t) => Array.from({ length: 97 }, (_, i) => { const phi = a0 + (a1 - a0) * (i / 96); const r = rr0 + (rr1 - rr0) * t; return V3(Math.cos(phi) * r, y + 0.0015 * Math.sin(phi * 7 + t), -Math.sin(phi) * r); })), { closedU: false });
    return g;
  };
  for (const [r0, r1] of [[Rc + w * 1.0 - 0.002, Rc + w + fl], [Rc - w + 0.002, Rc - w - fl]]) {
    const f = flange(r0, r1, hs, phi0 + 2 * DEG, phi1 - 2 * DEG);
    bins.add(mats.pvc, f);
    // second layer (welded), thickness
    const f2 = f.clone(); f2.translate(0, -0.0016, 0); bins.add(mats.pvc, f2);
  }
  for (const pe of [phi0, phi1]) {
    const d = V3(Math.cos(pe), 0, -Math.sin(pe));
    const tdir = V3(-Math.sin(pe), 0, -Math.cos(pe)).multiplyScalar(pe < Math.PI ? -1 : 1);
    const strip = G.roundedBox(2 * w + 2 * fl - 0.004, 0.003, 0.016, 0.0012);
    strip.applyMatrix4(K.basisAt(d.clone().multiplyScalar(Rc).setY(hs * 0.75).addScaledVector(tdir, 0.004), d, V3(0, 1, 0), d.clone().cross(V3(0, 1, 0))));
    bins.add(mats.pvc, strip);
  }
  // hook-and-loop tab bridging the slit on top (near the outer edge)
  const tabR = Rc + w * 0.45;
  const tabPts = [];
  for (let i = 0; i <= 24; i++) {
    const phi = -gap * 2.2 + (gap * 4.4) * (i / 24);
    const r = tabR;
    // height follows the bag top, dipping over the gap
    const dEnd = Math.min(Math.abs(phi - phi0), Math.abs(phi - (phi1 - TAU)));
    const inGap = Math.abs(phi) < gap;
    const y = inGap ? H * 0.72 + 0.018 * (1 - Math.abs(phi) / gap) * 0 : H * (0.82 + 0.1 * K.sstep(0, 0.2, dEnd));
    tabPts.push(V3(Math.cos(phi) * r, y + 0.003, -Math.sin(phi) * r));
  }
  bins.add(mats.hook, K.strapAlong(K.smoothPath(tabPts, 40), 0.05, 0.003, { up: V3(0, 1, 0) }));
  // webbing strap with buckle along the inner edge, across the slit
  const sR = Rc - w * 0.55;
  const sp = [];
  for (let i = 0; i <= 40; i++) { const phi = -gap * 4 + gap * 8 * (i / 40); sp.push(V3(Math.cos(phi) * sR, H * 0.55, -Math.sin(phi) * sR)); }
  const spN = sp.map((q) => V3(q.x, 0, q.z).normalize().negate());
  bins.add(mats.web, K.strapAlong(sp, 0.025, 0.0022, { normals: spN }));
  const bk = K.buckleGeo(0.025);
  const bc = sp[20].clone().addScaledVector(spN[20], 0.004);
  bk.applyMatrix4(K.basisAt(bc, V3(0, 1, 0), spN[20], V3(0, 0, 1).cross(spN[20]).normalize().negate()));
  bins.add(mats.buckle, bk);
  // filler spout + screw cap opposite the slit
  const cp = V3(-Rc, H - 0.004, 0);
  bins.add(mats.pvc, K.lathe([[0.034, -0.002], [0.034, 0.002], [0.03, 0.003], [0.02, 0.004], [0.02, 0.0]], 48).translate(cp.x, cp.y, cp.z));
  const capProfile = [[0.0001, 0.032], [0.016, 0.032], [0.019, 0.03], [0.0195, 0.006], [0.0185, 0.003], [0.0001, 0.003]].reverse();
  bins.add(mats.cap, K.lathe(capProfile, 48).translate(cp.x, cp.y, cp.z));
  for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; const rib = G.roundedBox(0.0022, 0.022, 0.0016, 0.0005); rib.translate(Math.cos(a) * 0.0196, 0.018, Math.sin(a) * 0.0196); rib.rotateY(0); rib.translate(cp.x, cp.y, cp.z); bins.add(mats.cap, rib); }
  // contact proxy: the filled ring sits heavily on the floor
  return { outerR: Rc + w + fl };
}

export function waterBag(p = {}) {
  const n = Number(p.count ?? 4);
  const filled = p.filled !== false;
  const pvc = K.pvcTarp(p.color && p.color !== 'zwart' ? p.color : '#141516');
  const mats = { pvc, hook: K.velcro('hook', '#18191A'), web: M.webbing('#141516'), buckle: K.abs('#151516', 0.4), cap: K.abs('#1E1F21', 0.35) };
  const bins = new G.PartBin();
  const cols = 2, pitch = 0.56;
  for (let i = 0; i < n; i++) {
    const sub = new G.PartBin();
    ringBag(sub, mats, { seed: 3 + i * 5, H: filled ? 0.12 - (i % 2) * 0.006 : 0.012, hs: filled ? 0.05 : 0.005 });
    const c = i % cols, r = Math.floor(i / cols);
    // slit (local +X) towards the viewer's front-left, a little different per bag
    const yaw = (-120 + [0, 22, -14, 30][i % 4]) * DEG;
    const x = (c - 0.5) * pitch + (r ? 0.03 : 0), z = (0.5 - r) * pitch * 0.96;
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(m); bins.add(mat, geo); }
  }
  const g = K.finish(bins, `waterBag ${n}`);
  return {
    object: g,
    detail: { target: [-0.1, 0.1, 0.25], size: 0.4, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 26 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.01, res: 1024, blur: 1.4 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
    meta: { n, filled },
  };
}
