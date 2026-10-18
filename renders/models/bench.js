// Bank: upholstered bench on a solid oak frame.
//
// { length, depth, height, frame, seat }
//   length 1.8 m (default) / 1.4 / 1.2; depth 0.4; seat height 0.46
//   frame  'eiken' (oiled oak, default) | 'zwart' (black stained oak) | 'walnoot'
//   seat   fabric colour (antraciet, zand, ...): woven upholstery with piping
// Construction: 50 x 50 mm oak legs, 80 mm aprons morticed between them, an H-stretcher
// (two short end rails + a long centre rail), a padded seat (foam on a board) with piping
// along the top and bottom edges, glides under the legs.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';

const { V3 } = G;
const FABRIC = { antraciet: '#4A4D52', zand: '#C9B898', zandkleur: '#C9B898', grijs: '#8A8C8E', zwart: '#262628', beige: '#D3C6AE', groen: '#4C5E48', blauw: '#2B3A55' };

export function bench(p = {}) {
  let L = Number(p.length ?? 1.8), Dp = Number(p.depth ?? 0.4), H = Number(p.height ?? 0.46);
  if (L > 10) L /= 100; if (Dp > 5) Dp /= 100; if (H > 5) H /= 100;
  const fr = String(p.frame || 'eiken').toLowerCase();
  const stain = fr === 'zwart' ? '#1E1C1B' : fr === 'walnoot' ? '#5B3E2B' : null;
  const wd = S.woodMat('eiken', { stain, finish: 'mat', seed: 17 });
  const fab = U.wovenFabric(FABRIC[String(p.seat || 'antraciet').toLowerCase()] || M.resolveColor(p.seat, '#4A4D52'), { seed: 5 });
  const glide = F.plastic('#1B1B1B', 0.6);
  const bins = new G.PartBin();
  const Tc = 0.08, yFrame = H - Tc; // top of the wooden frame
  const lw = 0.05, inset = 0.03;
  const xl = L / 2 - inset - lw / 2, zl = Dp / 2 - inset - lw / 2;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const g = F.cushion(lw, yFrame - 0.004, lw, { r: 0.004, puff: 0, seg: [4, 20, 4] });
    F.uvGrain(g, 'y', { offset: sx * 0.3 + sz * 0.7 });
    bins.add(wd, g.translate(sx * xl, (yFrame - 0.004) / 2 + 0.004, sz * zl));
    bins.add(glide, G.roundedBox(0.04, 0.005, 0.04, 0.002).translate(sx * xl, 0.0025, sz * zl));
  }
  // aprons (80 x 22) flush with the outside of the legs minus 5 mm
  const ah = 0.08, at = 0.022;
  for (const s of [-1, 1]) {
    const g = F.cushion(2 * xl - lw + 0.002, ah, at, { r: 0.003, puff: 0, seg: [20, 4, 3] });
    F.uvGrain(g, 'x', { offset: 0.4 + s });
    bins.add(wd, g.translate(0, yFrame - ah / 2, s * (zl + lw / 2 - at / 2 - 0.005)));
    const e = F.cushion(at, ah, 2 * zl - lw + 0.002, { r: 0.003, puff: 0, seg: [3, 4, 10] });
    F.uvGrain(e, 'z', { offset: 0.9 + s });
    bins.add(wd, e.translate(s * (xl + lw / 2 - at / 2 - 0.005), yFrame - ah / 2, 0));
  }
  // H stretcher
  const sh = 0.045, st = 0.025, yS = 0.1;
  for (const s of [-1, 1]) {
    const e = F.cushion(st, sh, 2 * zl - lw + 0.002, { r: 0.003, puff: 0, seg: [3, 4, 10] });
    F.uvGrain(e, 'z', { offset: 2.1 + s });
    bins.add(wd, e.translate(s * xl, yS, 0));
  }
  const c = F.cushion(2 * xl - st, sh, st, { r: 0.003, puff: 0, seg: [20, 4, 3] });
  F.uvGrain(c, 'x', { offset: 3.3 });
  bins.add(wd, c.translate(0, yS, 0));
  // seat: padded block slightly overhanging the frame, piping top and bottom
  const SW = L - 0.01, SD = Dp;
  const seat = S.softBlock(SW, Tc, SD, { r: 0.02, crown: 0.012, belly: 0.004, gather: 0.002, uneven: 0.0012, seed: 8, seg: [Math.round(SW / 0.006), 14, 70] });
  U.puckerSeams(seat, { amp: 0.0014, pitch: 0.026, width: 0.015, seed: 8 });
  const yC = H - Tc / 2;
  bins.add(fab, seat.translate(0, yC, 0));
  for (const side of [1, -1]) bins.add(fab, F.sweep(S.weltPath(seat.userData.shape, side, { cr: 0.0035 }).map((q) => q.setY(q.y + yC)), G.circleProfile(0.0035, 10), { closed: true }));
  const group = new THREE.Group(); group.name = `bench ${L} ${fr} ${p.seat || 'antraciet'}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [L / 2 - 0.12, H - 0.06, Dp / 2], size: 0.4, azimuth: 40, elevation: 16 },
    meta: { L, Dp, H },
    rig: S.seatRig(group, { default: { groundAO: { maxZenith: 55 } } }),
  };
}
