// Voetdoppen (set of 4 foot caps for statafel / klaptafel / barkruk).
//
// { count, type }
//   type 'statafel' (default): oval cap for the 30 x 16 mm oval foot tube of the folding
//        statafel; 'klaptafel': round cap for Ø 25 mm tube; 'barkruk': round cap Ø 22 mm
// { shape: 'rond' | 'vierkant' | 'ovaal', size (mm), count, angle: 'schuin' } (round 4): caps for
//   chair and bar-stool tubes; 'schuin' = angled sole for rear legs (one shown upside down so the
//   slanted sole reads); a pair is shown upright + upside down
// Construction: injection-moulded black PE over-cap, 1.8 mm wall with a slight draft, a
// thicker 4 mm floor with a moulded wear ring underneath, rounded rim, four crush ribs on
// the inside that grip the tube. The set is shown as a tidy group: two caps upright (open
// side up, ribs visible), one upside down (wear ring), one on its side.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';

const { V3 } = G;
const TAU = Math.PI * 2;

// one cap, standing open side up, centred at the origin on y = 0
function capGeo({ ai, bi, H = 0.024, wall = 0.0018, floor = 0.004, nu = 96, n = 2.4, tilt = 0 }) {
  // profile: [offset from the inner oval (+ = outward), y]
  const prof = [];
  const ao = wall;
  // centre of the floor underside -> wear ring -> chamfer -> outer wall -> rim -> inner wall -> floor top -> centre
  prof.push([-bi + 0.0002, 0.0006]);
  prof.push([-0.004, 0.0006]); prof.push([-0.0035, 0.0]); prof.push([-0.0015, 0.0]); prof.push([-0.001, 0.0006]); // wear ring
  prof.push([ao - 0.0008, 0.0006]); prof.push([ao, 0.0014]);
  prof.push([ao - 0.0003, H - 0.0009]);
  for (let i = 1; i <= 5; i++) { const a = (i / 5) * Math.PI; prof.push([ao / 2 + Math.cos(a) * (ao / 2 - 0.00015), H - 0.0009 + Math.sin(a) * 0.0008]); }
  prof.push([0, floor + 0.001]); prof.push([-0.0008, floor]);
  prof.push([-bi + 0.0002, floor]);
  const rows = prof.map(([d, y]) => {
    const row = [];
    for (let i = 0; i < nu; i++) {
      const t = (i / nu) * TAU;
      const a = Math.max(1e-4, ai + d), b = Math.max(1e-4, bi + d);
      // rounded-oval (superellipse n = 2.4 for the flattened oval tube; ~6 for a square tube)
      const c = Math.cos(t), s = Math.sin(t), e = 2 / n;
      const px = Math.sign(c) * Math.pow(Math.abs(c), e) * a, pz = Math.sign(s) * Math.pow(Math.abs(s), e) * b;
      // angled sole (rear legs that meet the floor at an angle): the bottom is sheared, the rim stays level
      row.push(V3(px, y, pz));
    }
    return row;
  });
  const g = K.gridGeometry(rows, { closedU: true, flip: true });
  // crush ribs on the inner wall (on the long sides)
  const ribs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * ai * 0.45, z = sz * (bi * 0.93);
    const r = G.roundedBox(0.0012, H - floor - 0.004, 0.0012, 0.0004);
    r.translate(x, floor + (H - floor - 0.004) / 2, z);
    ribs.push(r);
  }
  const out = G.merge([g, ...ribs]);
  if (tilt) {
    // angled sole (rear legs that meet the floor at an angle): shear the bottom, the rim stays level
    const pa = out.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setY(i, y + Math.tan(tilt) * (x + ai + wall) * Math.max(0, 1 - y / H)); }
    pa.needsUpdate = true; out.computeVertexNormals();
  }
  return out;
}

export function footCaps(p = {}) {
  const n = Number(p.count ?? 4);
  const type = String(p.type || 'statafel');
  // round 5: the statafel cap is the rectangular boot over the end of the statafel's foot tube
  // (the same glide as on models/statafel.js: ~46 x 25 mm, 50 mm deep), not an oval
  let dims = type === 'klaptafel' ? { ai: 0.0127, bi: 0.0127, H: 0.026 } : type === 'barkruk' ? { ai: 0.0112, bi: 0.0112, H: 0.024 } : { ai: 0.0212, bi: 0.0106, H: 0.05, n: 9, floor: 0.005 };
  // round 4: chair / bar stool caps by tube shape and size (mm): shape rond | vierkant | ovaal
  if (p.shape) {
    const mm = Number(p.size ?? 25) / 1000;
    const sh = String(p.shape);
    dims = sh === 'vierkant' ? { ai: mm / 2, bi: mm / 2, H: 0.022, n: 6 }
      : sh === 'ovaal' ? { ai: mm / 2, bi: mm * 0.27, H: 0.02 }
      : { ai: mm / 2, bi: mm / 2, H: mm > 0.023 ? 0.024 : 0.021, n: 2 };
    if (p.angle === 'schuin' || p.tilt) dims.tilt = (Number(p.tilt) || 18) * Math.PI / 180;
  }
  const pe = L5.pe5('#161616', { rough: 0.4, spec: 0.55 });
  const bins = new G.PartBin();
  const W = 2 * (dims.ai + 0.0018);
  const poses = [
    { pos: [-0.026, 0, 0.02], yaw: 0.35, flip: 0 },
    { pos: [0.026, 0, 0.026], yaw: -0.25, flip: 0 },
    { pos: [-0.022, 0, -0.03], yaw: 0.9, flip: 1 },    // upside down
    { pos: [0.03, 0, -0.026], yaw: -0.6, flip: 2 },    // on its side
  ];
  const poses2 = [{ pos: [-0.022, 0, 0.004], yaw: 0.35, flip: 0 }, { pos: [0.024, 0, -0.004], yaw: -0.5, flip: 1 }];
  for (let i = 0; i < n; i++) {
    const ps = n === 2 ? poses2[i] : poses[i % poses.length];
    const g = capGeo(dims);
    if (ps.flip === 1) { g.rotateX(Math.PI); g.translate(0, dims.H, 0); }
    if (ps.flip === 2) { g.rotateX(Math.PI / 2); g.translate(0, dims.bi + 0.0018, 0); }
    g.rotateY(ps.yaw);
    const extra = i >= poses.length ? [Math.floor(i / poses.length) * (W + 0.03), 0, 0] : [0, 0, 0];
    // the layout was drawn for ~30 mm caps: spread it for bigger ones so they do not touch
    const sp = Math.max(1, (Math.max(W, dims.H * 0.9) + 0.012) / 0.044);
    g.translate(ps.pos[0] * sp + extra[0], 0, ps.pos[2] * sp + extra[2]);
    // rest exactly on the floor
    g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0);
    bins.add(pe, g);
  }
  const g = K.finish(bins, `footCaps ${type} ${n}`);
  return {
    object: g,
    detail: { target: [0.026, dims.H, 0.026], size: 0.06, azimuth: 30, elevation: 40 },
    view: { hero: { elevation: 30 } },
    // round 5: black PE lit like the catalogue's black products (was crushed to ~16)
    rig: L5.goodsRig({ tone: 'black', size: 0.12, extra: { exposure: 1.1, contact: { strength: 0.9, h0: 0.0025, res: 1024, blur: 1.1, wide: { strength: 0.4, h0: 0.008, sigma: 0.006 } } } }),
    meta: { type, n },
  };
}
