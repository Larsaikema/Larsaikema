// Luxe afzetpalen gala en galerie (furniture group, round 5). Called from stanchionParts.js for
// stanchion({ style: 'gala' | 'galerie', height, finish, rope, pair, span }).
//
//   style 'gala'     100 cm: a heavy cast-iron base Ø 35 cm (stepped dome with a bead, felt pad under it),
//                    a Ø 50 column with turned collars at the foot and under the head, a neck collar with
//                    two eyes (left / right) and a polished ball top (bolle kop) on a small cup.
//   style 'galerie'  60 or 90 cm (`height`): the same base, a Ø 40 column and a flat disc cap (platte kop)
//                    with the two eyes just under it; for an artwork or a stage, below eye level.
//   finish  'goud' (polished brass look), 'chroom' / '#C9CCCF' (chrome), 'zwart' (black powder coat)
//   rope    velours rope colour between the pair (stanchionParts.js rope, hooks and ferrules)
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as S from '../js/seatKit.js';
import * as F from '../js/furniture.js';
import { finishMat, ropeMat, hangingRope } from './stanchionParts.js';

const { V3 } = G;
const DEG = Math.PI / 180;

function galaPost(bins, mat, x, { H, galerie }) {
  const Rb = 0.175, rT = galerie ? 0.02 : 0.025;
  // felt pad under the base
  bins.add(F.plastic('#2A2826', 0.95), G.lathe([[0.0001, 0], [Rb - 0.006, 0], [Rb - 0.006, 0.004], [0.0001, 0.004]], 72).translate(x, 0, 0));
  // stepped cast dome with a bead ring
  const base = [[0.0001, 0.004], [Rb - 0.004, 0.004], [Rb, 0.008], [Rb, 0.016], [Rb - 0.006, 0.022], [0.15, 0.026], [0.142, 0.032], [0.142, 0.037], [0.13, 0.042],
    [0.1, 0.055], [0.075, 0.068], [0.058, 0.08], [0.052, 0.086], [0.054, 0.09], [0.054, 0.097], [0.046, 0.1], [rT + 0.012, 0.106], [rT + 0.012, 0.116], [rT + 0.004, 0.12], [0.0001, 0.12]];
  bins.add(mat, G.lathe(base, 120).translate(x, 0, 0));
  const yHead = galerie ? H - 0.03 : H - 0.11;
  bins.add(mat, G.tube(V3(x, 0.118, 0), V3(x, yHead - 0.03, 0), rT, 48));
  // collar under the head with the eye ring
  const collar = [[0.0001, yHead - 0.034], [rT + 0.002, yHead - 0.034], [rT + 0.007, yHead - 0.028], [rT + 0.007, yHead - 0.004], [rT + 0.011, yHead], [rT + 0.011, yHead + 0.01], [rT + 0.004, yHead + 0.016], [0.0001, yHead + 0.016]];
  bins.add(mat, G.lathe(collar, 64).translate(x, 0, 0));
  if (galerie) {
    // flat disc cap
    const cap = [[0.0001, yHead + 0.014], [0.034, yHead + 0.014], [0.036, yHead + 0.018], [0.036, yHead + 0.026], [0.033, yHead + 0.03], [0.0001, yHead + 0.03]];
    bins.add(mat, G.lathe(cap, 64).translate(x, 0, 0));
  } else {
    // cup and ball top
    const cup = [[0.0001, yHead + 0.014], [0.016, yHead + 0.014], [0.022, yHead + 0.022], [0.026, yHead + 0.032], [0.0001, yHead + 0.032]];
    bins.add(mat, G.lathe(cup, 48).translate(x, 0, 0));
    const ball = new THREE.SphereGeometry(0.043, 48, 32); ball.translate(x, yHead + 0.072, 0);
    bins.add(mat, ball);
  }
  // two eyes (left / right) on the collar
  const eyeAt = {};
  const ye = yHead + 0.005;
  for (const a of [90, 270]) {
    const out = V3(Math.sin(a * DEG), 0, Math.cos(a * DEG));
    const c = V3(x, ye, 0).addScaledVector(out, rT + 0.011 + 0.0095 - 0.0012);
    const ring = new THREE.TorusGeometry(0.0095, 0.0028, 10, 28).rotateX(Math.PI / 2);
    ring.translate(c.x, c.y, c.z);
    bins.add(mat, ring);
    eyeAt[a] = { c, out };
  }
  return { eyeAt };
}

export function galaPosts(p = {}) {
  const galerie = String(p.style).toLowerCase().startsWith('galer');
  let H = Number(p.height ?? (galerie ? 0.9 : 1.0)); if (H > 5) H /= 100;
  const mat = finishMat(p.finish || 'goud');
  const pair = p.pair === true || p.pair === 'true' || p.span != null;
  const span = Number(p.span ?? (galerie ? 1.1 : 1.2));
  const bins = new G.PartBin();
  const xs = pair ? [-span / 2, span / 2] : [0];
  const posts = xs.map((x) => galaPost(bins, mat, x, { H, galerie }));
  // brass hooks and ferrules on gold posts, chrome on the others
  const hw = String(p.finish || '').toLowerCase() === 'goud' ? mat : M.chrome();
  if (pair) hangingRope(bins, ropeMat(p.rope || 'bordeaux'), hw, posts[0].eyeAt[90], posts[1].eyeAt[270], Number(p.sag ?? (galerie ? Math.min(0.2, H * 0.3) : 0.27)));
  const group = new THREE.Group(); group.name = `afzetpaal ${galerie ? 'galerie' : 'gala'} ${p.finish || 'goud'}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [xs[0] + 0.03, H - 0.08, 0.02], size: 0.24, azimuth: 40, elevation: 14 },
    meta: { kind: galerie ? 'galerie' : 'gala', pair, span, H },
    // a low pair is wide and flat: a little more air round it
    view: galerie && H < 0.7 ? { hero: { fill: 0.78, elevation: 16 } } : undefined,
    rig: S.seatRig(group, pair ? { default: { groundAO: { maxZenith: 60 } } } : {}),
  };
}
