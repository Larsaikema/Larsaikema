// Zandzakken voor partytent (set of fillable sand bags for tent legs).
//
// { count, color, filled }
// Each bag (filled with ~10 kg sand): 55 x 25 cm, PVC-coated 600D polyester, top and
// bottom panel sewn together with a welt seam round the edge, a zip along the top with a
// covering flap (zip puller pokes out at one end), a webbing grab loop on one short end and
// two 5 cm hook-and-loop straps sewn on a long edge that wrap round the leg (shown lying
// open on the floor, hook side up). Filled, the bag is a soft pillow: flat on the floor,
// domed, with a sandy lumpiness and sag. `filled: false` shows the bags folded flat.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;

// pillow: plan superellipse (a, b, exponent pe), seam height hs, top height Ht
function pillow({ a = 0.275, b = 0.125, pe = 3.2, hs = 0.042, Ht = 0.088, seed = 1, lump = 0.0035 }) {
  const nz = makeNoise2(seed);
  const se = (th, s) => {
    const c = Math.cos(th), si = Math.sin(th), e = 2 / pe;
    return [Math.sign(c) * Math.pow(Math.abs(c), e) * a * s, Math.sign(si) * Math.pow(Math.abs(si), e) * b * s];
  };
  const topY = (rho, x, z) => hs + (Ht - hs) * Math.pow(Math.max(0, 1 - Math.pow(rho, 3.2)), 0.55) + lump * nz.fbm(x * 9 + seed, z * 9, 3) * (1 - Math.pow(rho, 3)) - 0.006 * Math.sin(Math.PI * rho) * Math.abs(Math.sin(4 * Math.atan2(z / b, x / a)));
  const botY = (rho) => hs * (1 - Math.pow(Math.max(0, 1 - Math.pow(rho, 7)), 0.42));
  const nu = 120, nr = 22;
  const rows = [];
  for (let j = 0; j <= nr; j++) {
    const rho = Math.max(0.001, Math.pow(j / nr, 0.7));
    const row = [];
    for (let i = 0; i < nu; i++) { const th = (i / nu) * TAU; const [x, z] = se(th, rho); row.push(V3(x, topY(rho, x, z), z)); }
    rows.push(row);
  }
  for (let j = nr - 1; j >= 0; j--) {
    const rho = Math.max(0.001, Math.pow(j / nr, 0.45));
    // the lower panel bulges out a little below the seam before curving under
    const s = rho * (1 + 0.045 * Math.sin(Math.PI * Math.min(1, (1 - rho) * 6)) * (rho > 0.8 ? 1 : 0));
    const row = [];
    for (let i = 0; i < nu; i++) { const th = (i / nu) * TAU; const [x, z] = se(th, s); row.push(V3(x, Math.max(0.0005, botY(rho)), z)); }
    rows.push(row);
  }
  const geo = K.gridGeometry(rows, { closedU: true, flip: true });
  const seam = [];
  for (let i = 0; i <= nu; i++) { const th = (i / nu) * TAU; const [x, z] = se(th, 1.004); seam.push(V3(x, hs, z)); }
  const rhoOf = (x, z) => Math.pow(Math.pow(Math.abs(x / a), pe) + Math.pow(Math.abs(z / b), pe), 1 / pe);
  const surfY = (x, z) => topY(Math.min(1, rhoOf(x, z)), x, z);
  return { geo, seam, surfY, se, a, b, hs };
}

export function sandbag(p = {}) {
  const n = Number(p.count ?? 4);
  const filled = p.filled !== false;
  const fab = K.oxford(p.color && p.color !== 'zwart' ? p.color : '#19191B');
  const web = M.webbing('#141516');
  const hook = K.velcro('hook', '#18191A');
  const tooth = M.zipTooth('#121213');
  const slider = K.abs('#2A2C2F', 0.32);
  const bins = new G.PartBin();
  // layout: 2 x 2, long axis along x, straps of the front row towards the viewer, back row turned round
  const pitchX = 0.6, pitchZ = 0.285;
  for (let i = 0; i < n; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const P = pillow({ seed: 11 + i * 7, Ht: filled ? 0.088 - (i % 3) * 0.004 : 0.012, hs: filled ? 0.042 : 0.006, lump: filled ? 0.0035 : 0.001 });
    const sub = new G.PartBin();
    sub.add(fab, P.geo);
    sub.add(fab, K.tubeAlong(P.seam, 0.0042, 10));
    // zip flap along the top: a 5 cm strip lying on the dome with a turned edge
    const flapPts = [], flapN = [];
    for (let k = 0; k <= 40; k++) {
      const x = -0.19 + 0.38 * (k / 40), z = -0.035;
      const y = P.surfY(x, z) + 0.0025;
      flapPts.push(V3(x, y, z));
      const e = 0.004; const nx = -(P.surfY(x + e, z) - P.surfY(x - e, z)) / (2 * e), nzv = -(P.surfY(x, z + e) - P.surfY(x, z - e)) / (2 * e);
      flapN.push(V3(nx, 1, nzv).normalize());
    }
    sub.add(fab, K.strapAlong(flapPts, 0.055, 0.0028, { normals: flapN }));
    // stitch line along the flap edge
    sub.add(web, K.strapAlong(flapPts.map((q, k) => q.clone().addScaledVector(flapN[k], 0.0016).add(V3(0, 0, 0.022))), 0.0016, 0.0008, { normals: flapN }));
    // zip chain peeking out at the end of the flap + slider and puller
    const zx = 0.2, zy = P.surfY(zx, -0.035);
    const zc = G.roundedBox(0.03, 0.004, 0.008, 0.0015); zc.translate(zx + 0.005, zy + 0.001, -0.035); sub.add(tooth, zc);
    const sl = G.roundedBox(0.03, 0.009, 0.019, 0.003); sl.translate(zx + 0.012, zy + 0.004, -0.035); sl.rotateZ(0); sub.add(slider, sl);
    const tab = G.roundedBox(0.04, 0.0035, 0.012, 0.0015); tab.rotateZ(-0.35); tab.translate(zx + 0.04, zy - 0.004, -0.035); sub.add(slider, tab);
    // grab loop on the +x short end
    const lx = P.a + 0.003;
    const loop = K.smoothPath([V3(lx - 0.01, P.hs + 0.01, -0.03), V3(lx + 0.012, P.hs + 0.012, -0.024), V3(lx + 0.03, P.hs + 0.004, 0), V3(lx + 0.012, P.hs + 0.012, 0.024), V3(lx - 0.01, P.hs + 0.01, 0.03)], 30);
    sub.add(web, K.strapAlong(loop, 0.025, 0.0024, { up: V3(1, 0.3, 0).normalize() }));
    // two velcro straps from the front long seam, lying open on the floor (hook side up)
    for (const sx of [-0.12, 0.12]) {
      const z0 = P.b * 0.98;
      const strap = K.smoothPath([V3(sx, P.hs + 0.004, z0 - 0.01), V3(sx, P.hs * 0.55, z0 + 0.012), V3(sx, 0.006, z0 + 0.04), V3(sx + 0.004, 0.0022, z0 + 0.1), V3(sx + 0.008, 0.0022, z0 + 0.16)], 40);
      const nrm = strap.map((q, k) => { const a = strap[Math.max(0, k - 1)], b2 = strap[Math.min(strap.length - 1, k + 1)]; const T = b2.clone().sub(a).normalize(); return V3(0, 1, 0).addScaledVector(T, -T.y).normalize(); });
      sub.add(hook, K.strapAlong(strap, 0.05, 0.0026, { normals: nrm }));
    }
    const yaw = (row === 1 ? Math.PI : 0) + (i % 2 ? 0.035 : -0.03);
    const x = (col - 0.5) * pitchX + (row ? 0.02 : 0), z = (0.5 - row) * pitchZ;
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(m); bins.add(mat, geo); }
  }
  const g = K.finish(bins, `sandbag ${n}`);
  return {
    object: g,
    detail: { target: [0.18, 0.06, 0.2], size: 0.4, azimuth: 30, elevation: 28 },
    view: { hero: { elevation: 26 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.01, res: 1024, blur: 1.4 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
    meta: { n, filled },
  };
}
