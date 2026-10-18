// Voetdoppen (set of 4 foot caps for statafel / klaptafel / barkruk).
//
// { count, type }
//   type 'statafel' (default): oval cap for the 30 x 16 mm oval foot tube of the folding
//        statafel; 'klaptafel': round cap for Ø 25 mm tube; 'barkruk': round cap Ø 22 mm
// Construction: injection-moulded black PE over-cap, 1.8 mm wall with a slight draft, a
// thicker 4 mm floor with a moulded wear ring underneath, rounded rim, four crush ribs on
// the inside that grip the tube. The set is shown as a tidy group: two caps upright (open
// side up, ribs visible), one upside down (wear ring), one on its side.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const TAU = Math.PI * 2;

// one cap, standing open side up, centred at the origin on y = 0
function capGeo({ ai, bi, H = 0.024, wall = 0.0018, floor = 0.004, nu = 72 }) {
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
      // rounded-oval (superellipse n = 2.4 for the flattened oval tube)
      const c = Math.cos(t), s = Math.sin(t), e = 2 / 2.4;
      row.push(V3(Math.sign(c) * Math.pow(Math.abs(c), e) * a, y, Math.sign(s) * Math.pow(Math.abs(s), e) * b));
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
  return G.merge([g, ...ribs]);
}

export function footCaps(p = {}) {
  const n = Number(p.count ?? 4);
  const type = String(p.type || 'statafel');
  const dims = type === 'klaptafel' ? { ai: 0.0127, bi: 0.0127, H: 0.026 } : type === 'barkruk' ? { ai: 0.0112, bi: 0.0112, H: 0.024 } : { ai: 0.0153, bi: 0.0083, H: 0.024 };
  const pe = SG.moulded('#161616', { rough: 0.42, clearcoat: 0.1 });
  const bins = new G.PartBin();
  const W = 2 * (dims.ai + 0.0018);
  const poses = [
    { pos: [-0.026, 0, 0.02], yaw: 0.35, flip: 0 },
    { pos: [0.026, 0, 0.026], yaw: -0.25, flip: 0 },
    { pos: [-0.022, 0, -0.03], yaw: 0.9, flip: 1 },    // upside down
    { pos: [0.03, 0, -0.026], yaw: -0.6, flip: 2 },    // on its side
  ];
  for (let i = 0; i < n; i++) {
    const ps = poses[i % poses.length];
    const g = capGeo(dims);
    if (ps.flip === 1) { g.rotateX(Math.PI); g.translate(0, dims.H, 0); }
    if (ps.flip === 2) { g.rotateX(Math.PI / 2); g.translate(0, dims.bi + 0.0018, 0); g.rotateZ(0); }
    g.rotateY(ps.yaw);
    const extra = i >= poses.length ? [Math.floor(i / poses.length) * (W + 0.03), 0, 0] : [0, 0, 0];
    g.translate(ps.pos[0] + extra[0], 0, ps.pos[2] + extra[2]);
    // rest exactly on the floor
    g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0);
    bins.add(pe, g);
  }
  const g = K.finish(bins, `footCaps ${type} ${n}`);
  return {
    object: g,
    detail: { target: [0.026, dims.H, 0.026], size: 0.06, azimuth: 30, elevation: 40 },
    view: { hero: { elevation: 30 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.0025, res: 1024, blur: 1.2 }, groundAO: { strength: 0.7, maxZenith: 80 } } },
    meta: { type, n },
  };
}
