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
import * as SG from '../js/softGoods.js';
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
  // welded flanges round the outer and inner seam; they follow the tube where it narrows and
  // flattens towards the slit ends (no flange sticking out past a pinched end)
  const kAt = (phi) => K.sstep(0, endTaper, Math.max(0, Math.min(phi - phi0, phi1 - phi))) * 0.92 + 0.08;
  const flange = (side, a0, a1) => {
    const rows = [0, 1].map((t) => Array.from({ length: 121 }, (_, i) => {
      const phi = a0 + (a1 - a0) * (i / 120);
      const k = kAt(phi), ww = w * (0.6 + 0.4 * k);
      const r = side > 0 ? Rc + ww - 0.002 + (fl * k + 0.002) * t : Rc - ww + 0.002 - (fl * k + 0.002) * t;
      const y = hs * (0.5 + 0.5 * k);
      return V3(Math.cos(phi) * r, y + 0.0015 * Math.sin(phi * 7 + t) * k, -Math.sin(phi) * r);
    }));
    return K.gridGeometry(rows, { closedU: false });
  };
  for (const side of [1, -1]) {
    const f = flange(side, phi0 + 0.5 * DEG, phi1 - 0.5 * DEG);
    bins.add(mats.pvc, f);
    const f2 = f.clone(); f2.translate(0, -0.0016, 0); bins.add(mats.pvc, f2);
  }
  // surface height of the top at (phi, r) (same section as the body, without the wobble)
  const topY = (phi, r) => {
    const dEnd = Math.min(phi - phi0, phi1 - phi);
    const k = K.sstep(0, endTaper, Math.max(0, dEnd)) * 0.92 + 0.08;
    const Hk = hs + (H - hs) * k, hsk = hs * (0.5 + 0.5 * k);
    const sN = (r - Rc) / (w * (0.6 + 0.4 * k));
    if (Math.abs(sN) >= 1) return hsk;
    return hsk + (Hk - hsk) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(sN), 3.4)), 0.5);
  };
  // closures across the slit, lying on the top: a hook-and-loop tab (inner) and a webbing strap
  // with a side-release buckle (outer); over the gap they span straight, sagging a little
  const across = (r, half, lift) => {
    const pts = [];
    const pA = (phi) => V3(Math.cos(phi) * r, topY(phi, r) + lift, -Math.sin(phi) * r);
    for (let i = 0; i <= 30; i++) { const phi = phi0 + 0.002 + half * (1 - i / 30); pts.push(pA(phi)); }
    const a = pA(phi0 + 0.002), b = pA(phi1 - 0.002);
    for (let i = 1; i < 10; i++) { const q = a.clone().lerp(b, i / 10); q.y -= 0.006 * Math.sin(Math.PI * i / 10); pts.push(q); }
    for (let i = 0; i <= 30; i++) { const phi = phi1 - 0.002 - half * (i / 30); pts.push(pA(phi)); }
    return pts;
  };
  const tab = across(Rc - w * 0.18, 0.2, 0.0025);
  bins.add(mats.hook, K.strapAlong(tab, 0.05, 0.003, { up: V3(0, 1, 0) }));
  const str = across(Rc + w * 0.5, 0.26, 0.0022);
  bins.add(mats.web, K.strapAlong(str, 0.025, 0.0022, { up: V3(0, 1, 0) }));
  {
    const i = Math.round(str.length * 0.62);
    const T = str[i + 1].clone().sub(str[i - 1]).normalize();
    const bk = K.buckleGeo(0.025);
    bk.applyMatrix4(K.basisAt(str[i].clone().add(V3(0, 0.001, 0)), V3().crossVectors(V3(0, 1, 0), T).normalize(), V3(0, 1, 0), T));
    bins.add(mats.buckle, bk);
  }
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
  const pvc = SG.pvcTarp(p.color && p.color !== 'zwart' ? p.color : '#18191A', { gloss: 0.3, weave: 0.35 });
  const mats = { pvc, hook: SG.hookTape('#1B1C1D'), web: M.webbing('#141516'), buckle: SG.moulded('#151617', { rough: 0.42, spec: 0.6 }), cap: SG.moulded('#1E1F21', { rough: 0.35, spec: 0.6 }) };
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
    rig: { default: { contact: { strength: 0.85, h0: 0.01, res: 1024, blur: 1.4 }, groundAO: { strength: 0.8, maxZenith: 80 }, key: { intensity: 3.6 }, fill: { azimuth: 80, elevation: 16, intensity: 1.4 }, rim: { azimuth: 150, elevation: 34, intensity: 1.4 }, exposure: 1.2 } },
    meta: { n, filled },
  };
}
