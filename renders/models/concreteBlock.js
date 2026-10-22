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
    rig: { default: { contact: { strength: 0.95, h0: 0.012, res: 1024, blur: 1.4, wide: { h0: 0.05, sigma: 0.03, strength: 0.5 } }, groundAO: { strength: 0.85, maxZenith: 80 } } },
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

// fitted cover over a W x H x D block: sides with soft folds fanning from the bottom corners,
// rounded top edge with piping, vertical corner seams, hook-and-loop hem band, and a hemmed
// slot in the top the lifting loop comes through
function blockCover(bins, { W, H, D, color = 'zwart', seed = 4 }) {
  const hex = color === 'zwart' ? '#1C1D1F' : color;
  const cloth = L3.pvcSatin(hex, { rough: 0.55, coat: 0.15, weave: 0.35 });
  const nz = makeNoise2(seed);
  const a = W / 2, b = D / 2, rc = 0.03, re = 0.022, nu = 320;
  const rowsP = [];
  const ring = (y, inset, k) => {
    const row = [];
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const { p, n } = rrAt(a - inset, b - inset, Math.max(0.004, rc - inset), u);
      // folds: near each corner (u = 1/8, 3/8, ...) a few soft vertical folds that fade upwards
      let d = 0;
      if (k > 0) {
        for (let c = 0; c < 4; c++) {
          const uc = (c + 0.5) / 4;
          const du = ((u - uc + 1.5) % 1) - 0.5;
          const env = Math.exp(-Math.pow(du / 0.035, 2));
          d += env * (0.0045 * Math.sin(du * 260 + c * 1.7) + 0.0025);
        }
        // fabric slack: position-based (seamless round the ring)
        d += 0.0016 * nz.noise(p.x * 9 + p.z * 5.3, y * 6 + p.z * 3.1) + 0.0010 * Math.sin((p.x + p.z) * 38 + y * 9);
        d *= k;
      }
      row.push(p.addScaledVector(n, d).setY(y));
    }
    return row;
  };
  // hem flares a little onto the floor, folds strongest at the bottom
  const nv = 34;
  for (let j = 0; j <= nv; j++) {
    const t = j / nv, y = 0.002 + (H - re - 0.002) * t;
    const flare = 0.008 * Math.pow(1 - Math.min(1, y / 0.05), 2);
    const row = ring(y, -flare, Math.pow(1 - t, 1.4) * 0.9 + 0.1);
    rowsP.push(row);
  }
  for (let k = 1; k <= 8; k++) { const th = (k / 8) * Math.PI / 2; rowsP.push(ring(H - re + Math.sin(th) * re, re * (1 - Math.cos(th)), 0)); }
  for (let k = 1; k <= 10; k++) { const t = k / 10; rowsP.push(ring(H + 0.0008 * Math.sin(Math.PI * t), re + (Math.min(a, b) - re - 0.004) * t, 0)); }
  bins.add(cloth, K.gridGeometry(rowsP, { closedU: true, flip: true }));
  // piping round the top edge
  const pip = []; for (let i = 0; i <= nu; i++) { const { p, n } = rrAt(a - re * 0.32, b - re * 0.32, rc - re * 0.32, i / nu); pip.push(p.addScaledVector(n, 0.0016).setY(H - re * 0.32 + 0.0012)); }
  bins.add(cloth, K.tubeAlong(pip, 0.0032, 10, { closed: true }));
  // vertical corner seams
  for (let c = 0; c < 4; c++) {
    const u = (c + 0.5) / 4, pts = [];
    for (let j = 0; j <= 30; j++) { const y = 0.05 + (H - re - 0.05) * (j / 30); const { p, n } = rrAt(a, b, rc, u); pts.push(p.addScaledVector(n, 0.0012).setY(y)); }
    bins.add(cloth, K.tubeAlong(pts, 0.0018, 8));
  }
  // hem band (hook-and-loop band sewn round the bottom): follows the cloth surface of the
  // matching rows (same folds), so it sits on the cover instead of cutting through it
  const band = L3.cloth600('#141516', { rough: 0.85 });
  const rowAt = (j) => rowsP[Math.max(0, Math.min(nv, j))];
  const jB = Math.round(((0.03 - 0.002) / (H - re - 0.002)) * nv);
  const bp = [], bn = [];
  for (let i = 0; i < nu; i++) {
    const q = rowAt(jB)[i], q1 = rowAt(jB)[(i + 1) % nu], qu = rowAt(jB + 1)[i];
    const n = V3().crossVectors(q1.clone().sub(q), qu.clone().sub(q)).normalize();
    const out = rrAt(a, b, rc, i / nu).n; if (n.dot(out) < 0) n.negate();
    bp.push(q.clone().addScaledVector(n, 0.0022)); bn.push(n);
  }
  bins.add(band, K.strapAlong(bp, 0.05, 0.0018, { normals: bn, closed: true }));
  const thr = SG.thread('#3A3B3F', { sheen: 0.7 });
  for (const off of [-0.021, 0.021]) {
    const st = bp.map((q, i) => q.clone().addScaledVector(bn[i], 0.0012).add(V3(0, off, 0)));
    bins.add(thr, SG.stitches([...st, st[0]], [...bn, bn[0]], { len: 0.004, gap: 0.0022, w: 0.0011, h: 0.0005 }));
  }
  // slot in the top for the lifting loop: a hemmed opening with two flaps
  const slotL = 0.17, slotW = 0.04;
  const sp = []; for (let i = 0; i <= 64; i++) { const t = (i / 64) * TAU; sp.push(V3(Math.cos(t) * slotL / 2, H + 0.0035, Math.sin(t) * slotW / 2)); }
  const slotRing = K.tubeAlong(sp, 0.0042, 10, { closed: true }); slotRing.rotateY(28 * DEG); bins.add(cloth, slotRing);
  const hole = new THREE.Shape(); hole.absellipse(0, 0, slotL / 2 - 0.002, slotW / 2 - 0.002, 0, TAU, false);
  const hg = new THREE.ShapeGeometry(hole, 32); hg.rotateX(-Math.PI / 2); hg.translate(0, H + 0.0025, 0); hg.rotateY(28 * DEG);
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
