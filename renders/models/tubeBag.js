// Opbergtassenset voor buizenframe-partytenten (storage bag set).
//
// { count, color, width }
// Three black bags of PVC-coated 600D polyester: a long tube bag (~230 cm, for tubes up to
// 216 cm) with a zip along its full length, end handles and two carry handles; a small
// fittings bag (couplers, bolts) and a canvas bag for the roof and walls, both duffels with
// a U-zip lid and two carry handles. Laid out as a 3/4 group: the long bag diagonally at the
// back, the two duffels in front. Bags are filled (tubes give the long bag a flatter,
// slightly lumpy section).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function tubeBag(p = {}) {
  const n = Number(p.count ?? 3);
  const fab = K.oxford(p.color && p.color !== 'zwart' ? p.color : '#19191B');
  const mats = { tape: M.webbing('#1C1D1F'), tooth: M.zipTooth('#121213'), slider: K.abs('#2A2C2F', 0.32), web: M.webbing('#141516'), fab };
  const bins = new G.PartBin();
  const place = (x, z, yaw) => new THREE.Matrix4().makeRotationY(yaw * DEG).setPosition(x, 0, z);
  // 1. long tube bag
  {
    const L = 2.3, W = 0.2, D = 0.27;
    const b = K.lyingBag(bins, fab, { L, W, D, r: 0.06, re: 0.05, bulge: 0.012, wrinkle: 0.005, seed: 21, matrix: place(-0.05, -0.32, -24) });
    const T = K.bagTools(bins, b.pt, mats);
    const fr = b.frac;
    // full-length zip along the top, slightly to the front
    const ft = []; for (let k = 0; k <= 80; k++) ft.push([fr.left - 0.035, 0.03 + 0.94 * (k / 80)]);
    T.zip(ft, { sliders: [0.93] });
    T.handle([fr.left - 0.05, 0.35], [fr.left + 0.05, 0.35], 0.05);
    T.handle([fr.left - 0.05, 0.65], [fr.left + 0.05, 0.65], 0.05);
  }
  if (n >= 2) {
    // 2. canvas bag (roof + walls), duffel 75 x 40 x 36
    const L = 0.75, W = 0.36, D = 0.4;
    const b = K.lyingBag(bins, fab, { L, W, D, r: 0.075, re: 0.045, bulge: 0.025, wrinkle: 0.006, seed: 23, matrix: place(-0.42, 0.33, 14) });
    const T = K.bagTools(bins, b.pt, mats);
    const fr = b.frac;
    const fA = fr.left - 0.07, fB = fr.left + 0.07;
    const ft = [];
    for (let k = 0; k <= 30; k++) ft.push([fA, 0.08 + (k / 30) * 0.84]);
    for (let k = 1; k <= 12; k++) { const u = k / 12; ft.push([fA + (fB - fA) * u, 0.92]); }
    for (let k = 1; k <= 30; k++) ft.push([fB, 0.92 - (k / 30) * 0.84]);
    T.zip(ft, { sliders: [0.45, 0.55] });
    T.handle([fr.left - 0.1, 0.36], [fr.left + 0.1, 0.36], 0.06);
    T.handle([fr.left - 0.1, 0.64], [fr.left + 0.1, 0.64], 0.06);
  }
  if (n >= 3) {
    // 3. fittings bag, 50 x 28 x 30, heavy (couplers): lower, wider
    const L = 0.5, W = 0.27, D = 0.3;
    const b = K.lyingBag(bins, fab, { L, W, D, r: 0.06, re: 0.04, bulge: 0.022, wrinkle: 0.005, seed: 25, matrix: place(0.42, 0.36, -18) });
    const T = K.bagTools(bins, b.pt, mats);
    const fr = b.frac;
    const fA = fr.left - 0.055, fB = fr.left + 0.055;
    const ft = [];
    for (let k = 0; k <= 24; k++) ft.push([fA, 0.08 + (k / 24) * 0.84]);
    for (let k = 1; k <= 10; k++) { const u = k / 10; ft.push([fA + (fB - fA) * u, 0.92]); }
    for (let k = 1; k <= 24; k++) ft.push([fB, 0.92 - (k / 24) * 0.84]);
    T.zip(ft, { sliders: [0.5] });
    T.handle([fr.left - 0.08, 0.5], [fr.left + 0.08, 0.5], 0.055, { grip: true });
  }
  const g = K.finish(bins, `tubeBag set ${n}`);
  return {
    object: g,
    detail: { target: [0.42, 0.25, 0.36], size: 0.45, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 22 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.012, res: 1024, blur: 1.4 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
    meta: { n },
  };
}
