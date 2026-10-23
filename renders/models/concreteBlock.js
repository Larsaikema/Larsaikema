// Betonblok ballast (concrete ballast block for stretch/star/large tents).
//
// { weight, lifting, size }
//   weight   140 | 500 (default) | 1000 kg -> 40³ / 60³ / 80 x 80 x 65 cm (density ~2.35 t/m³)
//   lifting  'lepelgat' (default): recessed pocket in the top with a cast-in steel lifting
//            spoon (plate anchor with eye); 'oog': protruding rebar loop
//   forks    true (default for 500/1000): two fork-lift channels through the base
// Construction: wet-cast block, all edges chamfered 15 mm, steel-formwork faces with
// blowholes and laitance mottling; the spoon is a 12 mm galvanised plate anchor standing
// in a 60 mm deep pocket, its eye just proud of the top face.
// Round 4 accessories (on the 80 x 80 x 40 block of the accessory listing):
//   cover: {color}  fitted PVC-coated polyester hoes (folds at the corners, piping, corner seams,
//                   hook-and-loop hem band, slot in the top with the lifting loop through it)
//   seat: {wood}    glued-laminated hardwood zitblad 80 x 80 x 10 cm lying on the bare block
//   part: 'truss-baseplate', size 0.45, thickness   galvanised plate with M16 holes and four
//                   conical truss spigots (shown on its own)
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';
import * as F from '../js/furniture.js';
import * as L5 from '../js/partsLook5.js';
const M5 = L5;
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function chamferedRect(x0, x1, z0, z1, c) {
  // shape in (x, -z) for extrudeY (shape y -> -z)
  const s = new THREE.Shape();
  const P = [[x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c], [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]];
  // counter-clockwise in shape space (x, -z): three only normalises hole winding then
  P.reverse().forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  return s;
}

export function concreteBlock(p = {}) {
  if (p.part === 'truss-baseplate') return trussPlate(p);
  const wt = Number(p.weight ?? 500);
  // accessories (hoes / zitblad) are made for the 80 x 80 cm block family (500 kg: 80 x 80 x 40)
  const acc = !!(p.cover || p.seat);
  const dims = acc ? [0.8, 0.4, 0.8] : wt <= 200 ? [0.4, 0.4, 0.4] : wt <= 700 ? [0.6, 0.6, 0.6] : [0.8, 0.65, 0.8];
  const [S, H, Dz] = Array.isArray(p.size) ? [p.size[0], p.size[1], p.size[2]] : dims;
  const forks = p.forks ?? (acc ? false : wt > 200);
  const lifting = String(p.lifting || (p.seat ? 'none' : 'lepelgat'));
  const bins = new G.PartBin();
  // under a cover only the lifting loop shows: the block itself goes to a bin that is dropped
  const blockBins = p.cover ? new G.PartBin() : bins;
  const conc = SG.concreteSG({ tone: '#AAA8A2' });
  const steel = L3.galvFine({ cell: 0.004 });
  const bev = 0.012, cV = 0.014; // edge chamfers: horizontal (bevel) and vertical (shape)
  const a = S / 2 - bev, b = Dz / 2 - bev;
  const hCh = forks ? 0.085 : 0, wCh = 0.15, zCh = Dz * 0.27;
  // upper block (with the pocket hole) from the channel roof to the top
  const top = chamferedRect(-a, a, -b, b, cV);
  // lifting lug: a galvanised round-bar loop (Ø 20 mm) cast in, standing proud of a shallow
  // trowelled recess in the middle of the top
  const recR = 0.11, recD = 0.012;
  if (lifting !== 'none') {
    const hole = new THREE.Path(); hole.absarc(0, 0, recR, 0, Math.PI * 2, true); top.holes.push(hole);
  }
  const yTop0 = hCh;
  blockBins.add(conc, K.extrudeY(top, H - yTop0, { y0: yTop0, bevel: bev, bevelSegs: 1, curveSegs: 32 }));
  if (forks) {
    const zs = [[-Dz / 2, -zCh - wCh / 2], [-zCh + wCh / 2, zCh - wCh / 2], [zCh + wCh / 2, Dz / 2]];
    zs.forEach(([z0, z1], i) => {
      const sh = chamferedRect(-a, a, z0 + bev, z1 - bev, i === 1 ? 0.004 : cV * 0.5);
      blockBins.add(conc, K.extrudeY(sh, hCh + 2 * bev, { y0: 0, bevel: bev, bevelSegs: 1 }));
    });
  }
  const extras = [];
  if (lifting !== 'none') {
    // recess: dished floor, soft rim
    blockBins.add(conc, K.lathe([[recR + 0.002, H - 0.0005], [recR - 0.006, H - recD * 0.7], [recR - 0.02, H - recD], [0.0001, H - recD]].reverse(), 64));
    // the loop: legs go down into the block, arch above the top
    const lr = 0.01, span = 0.07, rise = 0.085;
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push(V3(-span, H - recD - 0.06 + (i / 12) * 0.06, 0));
    for (let i = 1; i <= 50; i++) { const t = Math.PI - (i / 50) * Math.PI; pts.push(V3(Math.cos(t) * span, H - recD + Math.sin(t) * rise, 0)); }
    for (let i = 1; i <= 12; i++) pts.push(V3(span, H - recD - (i / 12) * 0.06, 0));
    const loop = K.tubeAlong(pts, lr, 20);
    loop.rotateY(28 * DEG);
    bins.add(steel, loop);
    // grout collars where the legs leave the concrete
    for (const sx of [-1, 1]) {
      const c = K.lathe([[lr + 0.012, H - recD], [lr + 0.004, H - recD + 0.006], [lr + 0.0005, H - recD + 0.008]], 24);
      c.translate(sx * span, 0, 0); c.rotateY(28 * DEG); blockBins.add(conc, c);
    }
  }
  if (p.cover) blockCover(bins, { W: S + 0.012, H: H + 0.004, D: Dz + 0.012, color: (p.cover && p.cover.color) || 'zwart' });
  if (p.seat) woodSeat(bins, { W: S, D: Dz, T: 0.1, y0: H });
  const g = K.finish(bins, `concreteBlock ${wt}`, extras);
  return {
    object: g,
    detail: { target: [0, H - 0.01, 0], size: Math.min(0.42, S * 0.7), azimuth: 30, elevation: 38 },
    view: { hero: { elevation: acc ? 24 : 20, fill: acc ? 0.7 : 0.62 } },
    rig: p.cover ? L5.goodsRig({ tone: 'black', size: 0.62, extra: { contact: { strength: 0.95, h0: 0.01, res: 1024, blur: 1.4, wide: { h0: 0.04, sigma: 0.026, strength: 0.45 } } } })
      : { default: { contact: { strength: 0.95, h0: 0.012, res: 1024, blur: 1.4, wide: { h0: 0.05, sigma: 0.03, strength: 0.5 } }, groundAO: { strength: 0.85, maxZenith: 80 } } },
    meta: { weight: wt, size: [S, H, Dz] },
  };
}

// ---------------------------------------------------------------------------------------
// round 4 (22 Oct 2026): accessories for the block (hoes, zitblad, truss-voetplaat)

// point + outward normal on a rounded rectangle (half sizes a, b, corner radius r), u in [0, 1)
function rrAt(a, b, r, u) {
  const sa = a - r, sb = b - r;
  const L = 4 * sa + 4 * sb + TAU * r;
  let s = (((u % 1) + 1) % 1) * L;
  // start at the middle of the +z side, run towards +x (counter-clockwise seen from above is -)
  const segs = [
    ['line', V3(0, 0, b), V3(1, 0, 0), sa], ['arc', V3(sa, 0, sb), 0], ['line', V3(a, 0, sb), V3(0, 0, -1), 2 * sb],
    ['arc', V3(sa, 0, -sb), 1], ['line', V3(sa, 0, -b), V3(-1, 0, 0), 2 * sa], ['arc', V3(-sa, 0, -sb), 2],
    ['line', V3(-a, 0, -sb), V3(0, 0, 1), 2 * sb], ['arc', V3(-sa, 0, sb), 3], ['line', V3(-sa, 0, b), V3(1, 0, 0), sa],
  ];
  const arcLen = (TAU * r) / 4;
  for (const sg of segs) {
    const len = sg[0] === 'line' ? sg[3] : arcLen;
    if (s <= len + 1e-9) {
      if (sg[0] === 'line') { const p = sg[1].clone().addScaledVector(sg[2], s); const n = V3(-sg[2].z, 0, sg[2].x); return { p, n }; }
      // arcs: quadrant q, angle from the outward normal of the previous side
      const q = sg[2], a0 = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][q];
      const t = a0 - (s / Math.max(1e-9, arcLen)) * (Math.PI / 2);
      const n = V3(Math.cos(t), 0, Math.sin(t));
      return { p: sg[1].clone().addScaledVector(n, r), n };
    }
    s -= len;
  }
  return { p: V3(0, 0, b), n: V3(0, 0, 1) };
}

// fitted cover over a W x H x D block (round 5: reads as sewn 600D cloth, not a moulded box):
// a top panel taut over the block with the soft packing creases of a new cover, piping in the
// top seam, side panels with a little slack (a belly low on each face, soft diagonal tension
// folds from the top corners, a horizontal packing crease), excess cloth bunching into folds at
// each bottom corner where the hem kicks out onto the floor, corner seams with two stitch rows,
// a folded hem band with two stitch rows, and a bound slot in the top for the lifting loop.
function blockCover(bins, { W, H, D, color = 'zwart', seed = 4 }) {
  const hex = color === 'zwart' ? '#1C1D1F' : M5.liftAlbedo(color).getStyle();
  const cloth = L5.cloth5(hex, { rough: 0.76, sheen: 0.75, spec: 0.3, env: 0.2 });
  const pipeM = L5.cloth5(hex, { rough: 0.6, sheen: 0.9, spec: 0.42, env: 0.3 });
  const thr = SG.thread('#55575D', { sheen: 0.7 });
  const nz = makeNoise2(seed);
  const a = W / 2, b = D / 2, rc = 0.024, re = 0.02;
  const fr = K.rrFractions(a, b, rc), P = fr.P;
  const Hw = H - re, eArc = (Math.PI / 2) * re, inner = Math.min(a, b) - re - 0.004;
  const corners = [fr.cFR, fr.cBR, fr.cBL, fr.cFL].map((f) => f * P);
  const faces = [fr.front, fr.right, fr.back, fr.left].map((f) => f * P);
  const wrap = (d) => ((d % P) + P * 1.5) % P - P / 2;
  // crease list on the walls in (s = perimeter metres, y): diagonal tension folds from the top
  // corners towards the middle of each face
  const R = (() => { let x = seed * 9301 + 49297; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); })();
  const cr = [];
  corners.forEach((sc) => {
    for (const sg of [-1, 1]) for (let k = 0; k < 2; k++) {
      const al = (48 + 14 * k + (R() - 0.5) * 10) * DEG;
      cr.push({ s0: sc + sg * (0.025 + 0.03 * k), y0: Hw - 0.012 - 0.03 * k, ds: sg * Math.cos(al), dy: -Math.sin(al), l: 0.16 + 0.12 * R(), w: 0.011 + 0.008 * R(), A: (0.0026 + 0.0016 * R()) * (k ? 0.8 : 1) });
    }
  });
  const creaseAt = (s, y) => {
    let v = 0;
    for (const c of cr) {
      const dsv = wrap(s - c.s0), dyv = y - c.y0;
      const al = dsv * c.ds + dyv * c.dy; if (al < 0 || al > c.l) continue;
      const ac = -dsv * c.dy + dyv * c.ds;
      const t = al / c.l;
      v += c.A * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.08)), 0.8) * (1 - 0.6 * t) * Math.exp(-((ac / c.w) ** 2));
    }
    return v;
  };
  const wallDisp = (s, y, face) => {
    let d = 0;
    // belly low on each face (cloth slack under its own weight)
    d += 0.005 * face * Math.pow(Math.max(0, 1 - y / H), 1.3);
    // excess cloth at the bottom corners: a bulge, two folds either side, the hem kicking out
    for (const sc of corners) {
      const dc = wrap(s - sc);
      if (Math.abs(dc) > 0.14) continue;
      const e = Math.pow(Math.max(0, 1 - y / 0.15), 1.7);
      d += e * (0.011 * Math.exp(-((dc / 0.045) ** 2)) + 0.0065 * (Math.exp(-(((dc - 0.05) / 0.011) ** 2)) + Math.exp(-(((dc + 0.055) / 0.012) ** 2))) - 0.003 * (Math.exp(-(((dc - 0.075) / 0.014) ** 2)) + Math.exp(-(((dc + 0.08) / 0.014) ** 2))));
      d += 0.016 * Math.exp(-((dc / 0.06) ** 2)) * Math.pow(Math.max(0, 1 - y / 0.045), 2);
    }
    // folded hem band (two layers) and the hem standing out a touch
    d += 0.0016 * (1 - K.sstep(0.028, 0.033, y)) + 0.003 * Math.pow(Math.max(0, 1 - y / 0.02), 2);
    // horizontal packing crease (the cover was folded in the box), alternating ridge / valley per face
    const fi = Math.round(((s / P) % 1) * 4) % 4;
    const yc = 0.215 + 0.008 * Math.sin(s * 2.7 + 1.1);
    const xh = Math.abs(y - yc) / 0.007;
    d += (fi % 2 ? -1 : 1) * 0.0017 * face * (xh < 1 ? (1 - xh) * (1 - xh) : 0) + 0.0008 * face * Math.exp(-(((y - yc) / 0.02) ** 2));
    // vertical packing crease in the middle of each face
    for (const sf of faces) { const df = Math.abs(wrap(s - sf)) / 0.006; if (df < 1) d += 0.0014 * (1 - df) * (1 - df) * K.sstep(0.05, 0.12, y) * (1 - K.sstep(Hw - 0.05, Hw, y)); }
    d += creaseAt(s, y);
    d += 0.0014 * nz.noise(s * 6.1 + 2.2, y * 7.3) * face;
    // taut over the top edge
    return d * (1 - 0.75 * K.sstep(Hw - 0.03, Hw, y));
  };
  const topDisp = (x, z) => {
    let d = 0.0012 + 0.0008 * (0.5 + 0.5 * nz.noise(x * 7 + 3.3, z * 7 + 1.1));
    // cross of packing creases (ridges standing up off the block)
    const r1 = Math.abs(z - 0.03 - 0.01 * Math.sin(x * 4)) / 0.006, r2 = Math.abs(x + 0.12 + 0.012 * Math.sin(z * 3.2)) / 0.007;
    if (r1 < 1) d += 0.0022 * (1 - r1) * (1 - r1);
    if (r2 < 1) d += 0.0017 * (1 - r2) * (1 - r2);
    // soft wrinkles radiating from the slot (the loop pulls the cloth up)
    const rr = Math.hypot(x, z), th = Math.atan2(z, x);
    if (rr > 0.09 && rr < 0.3) d += 0.0012 * Math.pow(Math.max(0, Math.sin(th * 7 + 0.6)), 3) * (1 - (rr - 0.09) / 0.21);
    return d * (1 - K.sstep(inner - 0.04, inner + 0.004, Math.max(Math.abs(x), Math.abs(z))));
  };
  // surface: wall rows (hem -> edge), edge arc, top rings (edge -> centre)
  const nu = 360;
  const ms = [];
  const nWall = 70, nEdge = 8, nTop = 22;
  for (let j = 0; j <= nWall; j++) ms.push(0.0015 + (Hw - 0.0015) * Math.pow(j / nWall, 0.92));
  for (let j = 1; j <= nEdge; j++) ms.push(Hw + eArc * (j / nEdge));
  for (let j = 1; j <= nTop; j++) ms.push(Hw + eArc + inner * Math.pow(j / nTop, 0.8));
  const point = (f, m) => {
    let d, y, ny, part;
    if (m <= Hw) { part = 'wall'; d = 0; y = m; ny = 0; }
    else if (m <= Hw + eArc) { part = 'edge'; const th = ((m - Hw) / eArc) * (Math.PI / 2); d = re - re * Math.cos(th); y = Hw + re * Math.sin(th); ny = Math.sin(th); }
    else { part = 'top'; d = re + (m - Hw - eArc); y = H; ny = 1; }
    const q = K.rrPoint(f, Math.max(0.002, a - d), Math.max(0.002, b - d), Math.max(0.002, rc - Math.min(d, rc) * 0.6));
    const hz = Math.sqrt(Math.max(0, 1 - ny * ny));
    const n = V3(q.nx * hz, ny, q.nz * hz).normalize();
    const p = V3(q.x, y, q.z);
    let o = 0;
    if (part === 'wall') o = wallDisp(f * P, y, K.rrPoint(f, a, b, rc).face);
    else if (part === 'top') o = topDisp(q.x, q.z);
    else o = 0.0004;
    return { p: p.addScaledVector(n, o), n, part };
  };
  const rows = ms.map((m) => { const row = []; for (let i = 0; i < nu; i++) row.push(point(i / nu, m).p); return row; });
  bins.add(cloth, K.gridGeometry(rows, { closedU: true, flip: true, uvRows: ms }));
  // surface normal at (f, m) by finite differences (for trims lying on the cloth)
  const at = (f, m, lift = 0) => {
    const e = 0.0015;
    const p = point(f, m).p;
    const pu = point(f + e / P, m).p.sub(point(f - e / P, m).p), pv = point(f, m + e).p.sub(point(f, Math.max(0.001, m - e)).p);
    const n = V3().crossVectors(pu, pv).normalize();
    if (n.dot(point(f, m).n) < 0) n.negate();
    return { p: p.addScaledVector(n, lift), n };
  };
  const line = (fn, n) => { const pts = [], nrm = []; for (let i = 0; i <= n; i++) { const q = fn(i / n); pts.push(q.p); nrm.push(q.n); } return { pts, nrm }; };
  // piping in the top seam (on the edge arc, 40 deg up), one stitch row on the wall just below
  {
    const mP = Hw + eArc * 0.45;
    const pp = line((t) => at(t, mP, 0.0026), 520);
    pp.pts.push(pp.pts[0].clone()); pp.nrm.push(pp.nrm[0].clone());
    bins.add(pipeM, K.tubeAlong(pp.pts, 0.0034, 12));
    const st = line((t) => at(t, Hw - 0.009, 0.0004), 520);
    bins.add(thr, SG.stitches(st.pts, st.nrm, { len: 0.0042, gap: 0.0022, w: 0.0012, h: 0.0006 }));
  }
  // corner seams: a raised seam allowance and two stitch rows
  for (const sc of corners) {
    const f0 = sc / P;
    const ridge = line((t) => at(f0, 0.036 + (Hw - 0.05) * t, 0.0009), 90);
    bins.add(pipeM, K.tubeAlong(ridge.pts, 0.0019, 8));
    for (const off of [-0.009, 0.009]) {
      const st = line((t) => at(f0 + off / P, 0.04 + (Hw - 0.06) * t, 0.0003), 120);
      bins.add(thr, SG.stitches(st.pts, st.nrm, { len: 0.0042, gap: 0.0022, w: 0.0011, h: 0.0005 }));
    }
  }
  // hem band stitch rows
  for (const yS of [0.007, 0.026]) {
    const st = line((t) => at(t, yS, 0.0003), 640);
    bins.add(thr, SG.stitches(st.pts, st.nrm, { len: 0.0042, gap: 0.0022, w: 0.0011, h: 0.0005 }));
  }
  // bound slot in the top for the lifting loop: binding tape round the opening + stitches
  const slotL = 0.17, slotW = 0.042;
  const sp = []; for (let i = 0; i <= 96; i++) { const t = (i / 96) * TAU; sp.push(V3(Math.cos(t) * slotL / 2, H + 0.0034, Math.sin(t) * slotW / 2)); }
  const slotRing = K.strapAlong(sp, 0.016, 0.0036, { up: V3(0, 1, 0), closed: true }); slotRing.rotateY(28 * DEG); bins.add(pipeM, slotRing);
  const ss = []; for (let i = 0; i <= 96; i++) { const t = (i / 96) * TAU; ss.push(V3(Math.cos(t) * (slotL / 2 + 0.006), H + 0.0054, Math.sin(t) * (slotW / 2 + 0.006))); }
  const ssn = ss.map(() => V3(0, 1, 0));
  const sg = SG.stitches(ss, ssn, { len: 0.0038, gap: 0.002, w: 0.001, h: 0.0005 }); sg.rotateY(28 * DEG); bins.add(thr, sg);
  const hole = new THREE.Shape(); hole.absellipse(0, 0, slotL / 2 - 0.004, slotW / 2 - 0.004, 0, TAU, false);
  const hg = new THREE.ShapeGeometry(hole, 32); hg.rotateX(-Math.PI / 2); hg.translate(0, H + 0.0022, 0); hg.rotateY(28 * DEG);
  bins.add(SG.moulded('#0A0A0A', { rough: 0.9 }), hg);
}

// glued-laminated hardwood seat 80 x 80 x 10 cm lying on the block (lamellas along x)
function woodSeat(bins, { W, D, T = 0.1, y0 }) {
  const n = 10, w = D / n;
  for (let i = 0; i < n; i++) {
    const mat = F.wood('eiken', { stain: ['#86563A', '#7C4F35', '#8F6042', '#80533A'][i % 4], finish: 'mat', seed: 11 + (i % 4) * 7 });
    const g = G.roundedBox(W, T, w - 0.0006, 0.0035, 2);
    g.translate(0, y0 + T / 2, -D / 2 + w * (i + 0.5));
    F.uvGrain(g, 'x', { offset: i * 0.37 });
    bins.add(mat, g);
    // end grain caps on both ends
    for (const s of [-1, 1]) { const e = G.roundedBox(0.0016, T - 0.006, w - 0.006, 0.0006); e.translate(s * (W / 2 + 0.0002), y0 + T / 2, -D / 2 + w * (i + 0.5)); bins.add(F.woodEnd('eiken', { stain: '#6E4630' }), e); }
  }
}

// truss base plate 45 x 45 cm (6 / 10 mm), hot-dip galvanised, four M16 holes, four welded
// conical coupler spigots on the 290 truss pattern (chords 239 mm apart), pin holes across
function trussPlate(p) {
  const S = Number(p.size ?? 0.45), T = Number(p.thickness ?? 0.01);
  const galv = L3.galvFine({ cell: 0.0045 });
  const bins = new G.PartBin();
  const sh = new THREE.Shape(G.roundedRectProfile(S, S, 0.018, 6).map((q) => new THREE.Vector2(q.x, q.y)));
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const h = new THREE.Path(); h.absarc(sx * (S / 2 - 0.035), sz * (S / 2 - 0.035), 0.009, 0, TAU, true); sh.holes.push(h); }
  bins.add(galv, K.extrudeY(sh, T, { y0: 0, bevel: 0.0012, bevelSegs: 1, curveSegs: 24 }));
  const half = 0.1195;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const c = V3(sx * half, T, sz * half);
    const spig = K.lathe([[0.0001, 0], [0.026, 0], [0.026, 0.026], [0.024, 0.03], [0.0165, 0.032], [0.0165, 0.04], [0.012, 0.085], [0.009, 0.092], [0.0001, 0.093]].reverse(), 40);
    spig.translate(c.x, c.y, c.z); bins.add(galv, spig);
    // fillet weld at the base
    const pts = [], nrm = [];
    for (let k = 0; k <= 40; k++) { const a = (k / 40) * TAU; pts.push(V3(c.x + Math.cos(a) * 0.0272, c.y + 0.0012, c.z + Math.sin(a) * 0.0272)); nrm.push(V3(Math.cos(a), 1, Math.sin(a)).normalize()); }
    bins.add(galv, K.sweep(pts, K.circle(0.0028, 10).map(([x, y]) => [x, y * 0.75]), { normals: nrm, closed: true }));
    // pin hole through the cone (dark), across the diagonal
    const d = V3(-sz, 0, sx).normalize();
    bins.add(SG.rubberSG('#0B0B0B'), G.tube(c.clone().add(V3(0, 0.06, 0)).addScaledVector(d, -0.0145), c.clone().add(V3(0, 0.06, 0)).addScaledVector(d, 0.0145), 0.0045, 14));
  }
  const g = K.finish(bins, 'truss baseplate');
  return {
    object: g,
    detail: { target: [half, 0.05, half], size: 0.15, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 30 } },
    rig: { default: { envIntensity: 1.0, contact: { strength: 0.9, h0: 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
    meta: { part: 'truss-baseplate', S, T },
  };
}
