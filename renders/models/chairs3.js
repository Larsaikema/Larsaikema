// Stoelen, round 5 (furniture group). Called from chair.js / barStool.js for the styles below; the
// shared fold helper turns an X-frame chair (long front legs running up into the back posts, a rear
// U frame under the seat front) into its folded, flat state.
//
//   chair {style: 'bistro-klap', color, folded}
//        houten klapstoel bistro: solid beech, lacquered (eiken #B8915F, vintage hout #7A5C43, each part
//        its own tone) or stained black (zwart). Long front legs that run on up as the back posts, a
//        rear leg frame with a top rail under the seat front, round stretchers, a seat of six slats on
//        two side rails, three bent back slats. Seat 45 cm. Folded: about 6 cm thick, standing upright.
//   chair {style: 'kunststof', color, legs, stack}
//        stapelstoel kunststof: one-piece PP shell (seat with a front lip and a slight dish, a waist,
//        a back curved in plan, rolled rim, drainage hole) on a black Ø20 steel frame: side frames
//        (front leg, seat rail, rear leg), back uprights screwed to the shell, two cross bars, caps.
//        `stack` n: chairs stacked (each 6.5 cm up and 2.2 cm back, as they nest).
//   chair {style: 'polycarbonaat', color, translucent}
//        polycarbonate medallion chair with arms, moulded in one piece: cushion-shaped seat, tapered
//        front legs that rise into the arm supports, sabre rear legs, arms sweeping into an oval
//        medallion back (frame + panel) on a neck. translucent (transparant): clear PC rendered with a
//        Fresnel-weighted stochastic coverage (faces nearly clear, outlines and highlights read);
//        wit / zwart: glossy opaque PC.
//   chair {style: 'klapstoel', count, linked}
//        `count` chairs in a straight row (stoelverbinder in gebruik): side by side, with a black
//        plastic connector clipped round the front legs of each pair of neighbours.
//   barStool {style: 'klap', color, back, folded}  -> foldingBarStool()
//        inklapbare barkruk: Ø25 powder-coated steel X frame (front legs running up into the back
//        posts, rear U frame under the seat front), footrest on the front legs, black faux-leather
//        seat (38 x 36, 6 cm) and a low curved back pad; seat 76 cm. Folded: about 12 cm, upright.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

// ------------------------------------------------------------------ helpers
// tube whose radius follows rOf(t) (t = 0..1 along the path), parallel-transport frames
function taper(path, rOf, segs = 18) {
  const g = F.sweep(path, G.circleProfile(1, segs));
  const pos = g.attributes.position, n = path.length, row = segs + 1;
  const L = [0]; for (let i = 1; i < n; i++) L.push(L[i - 1] + path[i].distanceTo(path[i - 1]));
  const tot = L[n - 1] || 1, v = new THREE.Vector3();
  const scaleAbout = (idx, c, r) => { v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c); pos.setXYZ(idx, v.x, v.y, v.z); };
  for (let i = 0; i < n; i++) { const r = rOf(L[i] / tot); for (let j = 0; j < row; j++) scaleAbout(i * row + j, path[i], r); }
  let base = n * row;
  for (const [end, t] of [[0, 0], [n - 1, 1]]) { for (let j = 0; j < segs; j++) scaleAbout(base + j, path[end], rOf(t)); base += segs; }
  g.computeVertexNormals();
  return g;
}
// quadratic / cubic Bezier sampled
const bez = (pts, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n;
  if (pts.length === 3) { const [a, b, c] = pts; return a.clone().multiplyScalar((1 - t) ** 2).addScaledVector(b, 2 * t * (1 - t)).addScaledVector(c, t * t); }
  const [a, b, c, d] = pts;
  return a.clone().multiplyScalar((1 - t) ** 3).addScaledVector(b, 3 * t * (1 - t) ** 2).addScaledVector(c, 3 * t * t * (1 - t)).addScaledVector(d, t ** 3);
});
// crossing of two lines in the y-z plane (x ignored): returns the point on line A
function crossYZ(a0, a1, b0, b1) {
  const d1 = [a1.y - a0.y, a1.z - a0.z], d2 = [b1.y - b0.y, b1.z - b0.z];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  const t = ((b0.y - a0.y) * d2[1] - (b0.z - a0.z) * d2[0]) / den;
  return V3(0, a0.y + d1[0] * t, a0.z + d1[1] * t);
}
// rotate a group (geometry in world coordinates) about a pivot
function about(obj, pivot, q) {
  const w = new THREE.Group(); w.position.copy(pivot); w.quaternion.copy(q);
  obj.position.copy(pivot).negate(); w.add(obj); return w;
}
// Fold an X-frame chair flat. A (front legs + back), B (rear frame), Sg (seat) are groups built in the
// open state; A0/A1 the front leg's foot / top, B0/B1 the rear frame's foot / top; pivotS the seat's
// hinge on A. B swings onto A about the crossing (nested `bOff` behind A), the seat hangs along A
// (lifted `sOff`); then the flat chair is stood up with A leaning back `lean` degrees.
function foldFlat(A, B, Sg, { A0, A1, B0, B1, pivotS, bOff = 0.04, sOff = 0, lean = 6 }) {
  const dirA = A1.clone().sub(A0).setX(0).normalize(), dirB = B1.clone().sub(B0).setX(0).normalize();
  const nA = V3(0, -dirA.z, dirA.y).multiplyScalar(dirA.y > 0 ? 1 : -1); // towards the front of the A plane
  if (nA.z < 0) nA.negate();
  const P = crossYZ(A0, A1, B0, B1);
  const out = new THREE.Group();
  out.add(A);
  const bw = about(B, P, new THREE.Quaternion().setFromUnitVectors(dirB, dirA)); bw.position.addScaledVector(nA, -bOff); out.add(bw);
  const sw = about(Sg, pivotS, new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dirA)); sw.position.addScaledVector(nA, sOff); out.add(sw);
  // stand it up: A towards vertical, leaning back a little
  const tilt = Math.atan2(-dirA.z, dirA.y) - lean * DEG; // A leans back by atan2(-dz, dy); keep `lean` of it
  const stand = new THREE.Group(); stand.add(out); stand.rotation.x = tilt;
  const root = new THREE.Group(); root.add(stand);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  stand.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  return root;
}
const capFoot = (bins, mat, p, r, dir = V3(0, 1, 0)) => bins.add(mat, F.latheAt([[0.0001, 0], [r + 0.002, 0], [r + 0.0025, 0.012], [r + 0.001, 0.018], [0.0001, 0.018]], p, dir, 16));

// ------------------------------------------------------------------ inklapbare barkruk
export function foldingBarStool(p = {}) {
  let H = Number(p.height ?? 0.76); if (H > 5) H /= 100;
  const color = String(p.color || 'zwart').toLowerCase();
  const back = p.back !== false;
  const folded = !!p.folded;
  const frame = U.powder(color === 'wit' || color === 'white' ? 'wit' : color);
  const leather = S.leatherMat('#202022');
  const cap = F.plastic('#161616', 0.6);
  const r = 0.0125;
  const binA = new G.PartBin(), binB = new G.PartBin(), binS = new G.PartBin();
  // A: front legs running up into the back posts
  const xA = 0.215, yTop = back ? H + 0.27 : H + 0.02;
  const A0 = V3(xA, 0.012, 0.27), A1 = V3(xA - 0.008, yTop, -0.16);
  const zA = (y) => A0.z + (A1.z - A0.z) * (y - A0.y) / (A1.y - A0.y);
  const xAt = (y) => A0.x + (A1.x - A0.x) * (y - A0.y) / (A1.y - A0.y);
  for (const s of [-1, 1]) {
    const a0 = V3(s * A0.x, A0.y, A0.z), a1 = V3(s * A1.x, A1.y, A1.z);
    binA.add(frame, G.tube(a0, a1, r, 20));
    capFoot(binA, cap, a0.clone().setY(0), r);
    binA.add(cap, F.latheAt([[0.0001, 0], [r + 0.0012, 0], [r + 0.0012, 0.006], [0.0001, 0.009]], a1, a1.clone().sub(a0).normalize(), 16));
  }
  // footrest on the front legs: a flat, ribbed bar (the feet stand on it), and a stretcher under the back
  const yF = 0.3;
  binA.add(frame, G.prism(G.roundedRectProfile(0.03, 0.012, 0.004, 3), V3(-xAt(yF), yF, zA(yF) + 0.006), V3(xAt(yF), yF, zA(yF) + 0.006), { side: V3(0, 0, 1) }));
  for (const s of [-1, 1]) F.rivet(binA, M.chrome(), V3(s * (xAt(yF) + r), yF, zA(yF)), V3(s, 0, 0), 0.005);
  if (back) binA.add(frame, G.tube(V3(-xAt(H + 0.08), H + 0.08, zA(H + 0.08)), V3(xAt(H + 0.08), H + 0.08, zA(H + 0.08)), r * 0.8, 14));
  // B: rear U frame from the rear feet up to the seat front, low stretcher
  const W = 0.38, D = 0.36, T = 0.06, yS = H - T / 2, yRail = H - T - 0.013;
  const xB = 0.19, ySeatB = yRail - 0.013 - 0.0115;
  const B0 = V3(xB, 0.012, -0.29), B1 = V3(xB, ySeatB, 0.17);
  binB.add(frame, F.sweep(F.filletPath([V3(-xB, B0.y, B0.z), V3(-xB, B1.y, B1.z), V3(xB, B1.y, B1.z), V3(xB, B0.y, B0.z)], 0.035), G.circleProfile(r * 0.92, 18)));
  for (const s of [-1, 1]) capFoot(binB, cap, V3(s * xB, 0, B0.z), r * 0.92);
  const zB = (y) => B0.z + (B1.z - B0.z) * (y - B0.y) / (B1.y - B0.y);
  binB.add(frame, G.tube(V3(-xB, 0.16, zB(0.16)), V3(xB, 0.16, zB(0.16)), r * 0.8, 14));
  for (const s of [-1, 1]) {
    const P = crossYZ(A0, A1, B0, B1);
    F.rivet(binA, M.chrome(), V3(s * (xAt(P.y) + r), P.y, P.z), V3(s, 0, 0), 0.006);
  }
  // seat: faux leather pad on a board, two side rails hinged on A at the rear
  const seat = S.softBlock(W, T, D, { r: 0.022, crown: 0.008, crownBottom: 0, belly: 0.003, gather: 0.0012, uneven: 0.0006, seed: 7 });
  binS.add(leather, seat.translate(0, yS, 0.02));
  binS.add(F.plastic('#111111', 0.6), G.roundedBox(W - 0.05, 0.01, D - 0.03, 0.004).translate(0, H - T + 0.004, 0.02));
  for (const s of [-1, 1]) {
    binS.add(frame, G.prism(G.roundedRectProfile(0.012, 0.026, 0.003, 2), V3(s * (W / 2 - 0.012), yRail, -0.16), V3(s * (W / 2 - 0.012), yRail, 0.19), { side: V3(1, 0, 0) }));
  }
  const pivotS = V3(0, yRail, zA(yRail));
  for (const s of [-1, 1]) F.rivet(binS, M.chrome(), V3(s * (xAt(pivotS.y) + r), pivotS.y, pivotS.z), V3(s, 0, 0), 0.006);
  // back pad between the posts (curved in plan, raked with A)
  if (back) {
    const bw = 0.4, bh = 0.13, bt = 0.045, Rb = 0.42;
    const pad = S.softBlock(bw, bh, bt, { r: 0.016, crown: 0, belly: 0.004, gather: 0.001, uneven: 0, seg: [44, 16, 8], seed: 8 });
    const pp = pad.attributes.position;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i); const a = x / Rb, rad = Rb - z; pp.setXYZ(i, Math.sin(a) * rad, y, Rb - Math.cos(a) * rad); }
    pad.computeVertexNormals();
    const tilt = Math.atan2(A0.z - A1.z, A1.y - A0.y);
    const yb = yTop - 0.035 - bh / 2;
    binA.add(leather, pad.rotateX(-tilt).translate(0, yb, zA(yb) + 0.012));
  }
  const gA = new THREE.Group(), gB = new THREE.Group(), gS = new THREE.Group();
  binA.build(gA); binB.build(gB); binS.build(gS);
  let object;
  if (folded) object = foldFlat(gA, gB, gS, { A0, A1, B0, B1, pivotS, bOff: 0.045, sOff: 0.0, lean: 5 });
  else { object = new THREE.Group(); object.add(gA, gB, gS); }
  object.name = `barStool klap ${color}${folded ? ' folded' : ''}`;
  return {
    object,
    detail: folded ? { target: [0, 0.4, 0], size: 0.4, azimuth: 30, elevation: 10 } : { target: [0.18, H - 0.04, 0.12], size: 0.32, azimuth: 34, elevation: 22 },
    meta: { style: 'klap', H, stack: 1, color, folded },
    rig: (() => {
      const rr = S.seatRig(object);
      if (color === 'wit' || color === 'white') rr.default.exposure = Math.max(rr.default.exposure, 0.84);
      return rr;
    })(),
  };
}

// ------------------------------------------------------------------ houten klapstoel bistro
function bistroWood(color) {
  const c = String(color || 'eiken').toLowerCase();
  const black = c === 'zwart' || c === 'black';
  const vintage = c.includes('vintage') || c === '#7a5c43';
  const base = black ? '#141312' : c === 'eiken' || c === 'houtlook' ? '#B8915F' : M.resolveColor(color, '#B8915F');
  // vintage: each part its own tone (lighter, greyer, warmer), as the lacquered "vintage" finish comes
  const tones = vintage ? ['#7A5C43', '#8A6B4E', '#6C5040', '#857055', '#735A47'] : black ? [base, '#1A1816'] : [base, new THREE.Color(base).multiplyScalar(0.94).getStyle()];
  return tones.map((t, i) => S.woodMat('beuken', { stain: t, finish: black ? 'lak' : 'lak', seed: 60 + i }));
}
function bistroFolding(p) {
  const folded = !!p.folded;
  const mats = bistroWood(p.color);
  const R = rng(61);
  const wd = () => mats[Math.floor(R() * mats.length)];
  const part = (g) => S.uvJitter(S.swapUV(g), R, { du: 1.5, dv: 0.2 });
  const glide = F.plastic('#161616', 0.6);
  const binA = new G.PartBin(), binB = new G.PartBin(), binS = new G.PartBin();
  const ySeat = 0.45;
  // A: front legs -> back posts (34 x 24, rounded), slightly raked
  const xA = 0.215;
  const A0 = V3(xA, 0, 0.215), A1 = V3(xA - 0.01, 0.88, -0.19);
  const zA = (y) => A0.z + (A1.z - A0.z) * (y - A0.y) / (A1.y - A0.y);
  const xAt = (y) => A0.x + (A1.x - A0.x) * (y - A0.y) / (A1.y - A0.y);
  const memb = G.roundedRectProfile(0.024, 0.036, 0.007, 3);
  for (const s of [-1, 1]) {
    binA.add(wd(), part(F.sweep([V3(s * A0.x, A0.y, A0.z), V3(s * A1.x, A1.y, A1.z)], memb, { up: V3(1, 0, 0) })));
    binA.add(glide, G.roundedBox(0.024, 0.006, 0.036, 0.002).translate(s * A0.x, 0.003, A0.z));
  }
  // front stretcher (dowel) low between the front legs
  const yst = 0.14;
  binA.add(wd(), part(G.tube(V3(-xAt(yst) + 0.01, yst, zA(yst)), V3(xAt(yst) - 0.01, yst, zA(yst)), 0.011, 14)));
  // three bent back slats, following the rake, bowed back
  const tilt = Math.atan2(A0.z - A1.z, A1.y - A0.y);
  const bowR = 0.5;
  for (const [y, h] of [[0.575, 0.05], [0.68, 0.05], [0.795, 0.075]]) {
    const w = 2 * xAt(y) - 0.006;
    // a bent slat: the ends sit in the posts, the middle bows back (concave towards the sitter)
    const bowEnd = bowR - Math.sqrt(bowR * bowR - (w / 2) ** 2);
    const pts = Array.from({ length: 25 }, (_, i) => { const x = (i / 24 - 0.5) * w; return V3(x, 0, (bowR - Math.sqrt(bowR * bowR - x * x)) - bowEnd); });
    const band = F.sweep(pts, G.roundedRectProfile(0.016, h, 0.005, 3), { up: V3(0, 0, -1) });
    band.rotateX(-tilt).translate(0, y, zA(y) - 0.004);
    binA.add(wd(), S.uvJitter(band, R, { du: 1.0, dv: 0.1 }));
  }
  // B: rear legs with a top rail under the seat front and a low stretcher
  const xB = 0.19;
  const B0 = V3(xB, 0, -0.235), B1 = V3(xB, ySeat - 0.035 - 0.02 - 0.02, 0.155); // its rail just under the seat rails
  for (const s of [-1, 1]) {
    binB.add(wd(), part(F.sweep([V3(s * B0.x, B0.y, B0.z), V3(s * B1.x, B1.y, B1.z)], G.roundedRectProfile(0.022, 0.032, 0.006, 3), { up: V3(1, 0, 0) })));
    binB.add(glide, G.roundedBox(0.022, 0.006, 0.032, 0.002).translate(s * B0.x, 0.003, B0.z));
  }
  binB.add(wd(), part(G.prism(G.roundedRectProfile(0.04, 0.022, 0.006, 3), V3(-xB - 0.011, B1.y, B1.z), V3(xB + 0.011, B1.y, B1.z), { side: V3(0, 1, 0) })));
  const zB = (y) => B0.z + (B1.z - B0.z) * (y - B0.y) / (B1.y - B0.y);
  binB.add(wd(), part(G.tube(V3(-xB, 0.12, zB(0.12)), V3(xB, 0.12, zB(0.12)), 0.0105, 14)));
  // seat: two side rails (hinged on A at the rear) and six slats across, front slat rounded
  const yR = ySeat - 0.035;
  for (const s of [-1, 1]) binS.add(wd(), part(G.prism(G.roundedRectProfile(0.022, 0.034, 0.006, 3), V3(s * 0.178, yR + 0.003, -0.17), V3(s * 0.178, yR + 0.003, 0.185), { side: V3(1, 0, 0) })));
  const nS = 7, sw = 0.048, gap = (0.385 - nS * sw) / (nS - 1);
  for (let i = 0; i < nS; i++) {
    const z = 0.2 - sw / 2 - i * (sw + gap);
    const g = G.prism(G.roundedRectProfile(sw, 0.014, i === 0 ? 0.006 : 0.004, 3), V3(-0.192, ySeat - 0.007, z), V3(0.192, ySeat - 0.007, z), { side: V3(0, 1, 0) });
    binS.add(wd(), part(g));
  }
  const pivotS = V3(0, yR, zA(yR));
  for (const s of [-1, 1]) F.rivet(binS, M.chrome(), V3(s * (xAt(yR) + 0.012), yR, zA(yR)), V3(s, 0, 0), 0.005);
  const P = crossYZ(A0, A1, B0, B1);
  for (const s of [-1, 1]) F.rivet(binA, M.chrome(), V3(s * (xAt(P.y) + 0.012), P.y, P.z), V3(s, 0, 0), 0.005);
  const gA = new THREE.Group(), gB = new THREE.Group(), gS = new THREE.Group();
  binA.build(gA); binB.build(gB); binS.build(gS);
  if (folded) return { object: foldFlat(gA, gB, gS, { A0, A1, B0, B1, pivotS, bOff: 0.026, sOff: -0.004, lean: 5 }), seatY: 0.45 };
  const o = new THREE.Group(); o.add(gA, gB, gS);
  return { object: o, seatY: ySeat };
}

// ------------------------------------------------------------------ stapelstoel kunststof
const PP = { wit: '#EDEDE8', zwart: '#1F2022', antraciet: '#47494D', taupe: '#8C8173', groen: '#2D6A47', blauw: '#2A5C9E' };
function plasticShell(bins, mat) {
  // profile in (y, z) along s: front lip -> seat -> waist -> back
  const prof = [];
  const add = (pts) => { for (const q of pts) prof.push(q); };
  add(bez([V3(0, 0.418, 0.222), V3(0, 0.452, 0.226), V3(0, 0.455, 0.19)], 6));
  add(bez([V3(0, 0.455, 0.19), V3(0, 0.444, 0.02), V3(0, 0.452, -0.14)], 14).slice(1));
  add(bez([V3(0, 0.452, -0.14), V3(0, 0.46, -0.205), V3(0, 0.53, -0.215)], 8).slice(1));
  add(bez([V3(0, 0.53, -0.215), V3(0, 0.66, -0.235), V3(0, 0.84, -0.275)], 14).slice(1));
  const n = prof.length;
  const sAcc = [0]; for (let i = 1; i < n; i++) sAcc.push(sAcc[i - 1] + prof[i].distanceTo(prof[i - 1]));
  const sTot = sAcc[n - 1];
  const at = (v) => { const s = v * sTot; let i = 1; while (i < n - 1 && sAcc[i] < s) i++; const t = (s - sAcc[i - 1]) / (sAcc[i] - sAcc[i - 1] || 1); return prof[i - 1].clone().lerp(prof[i], t); };
  const tan = (v) => at(Math.min(1, v + 0.002)).sub(at(Math.max(0, v - 0.002))).normalize();
  const vSeatEnd = sAcc[6 + 14] / sTot, vBack = sAcc[n - 15] / sTot;
  const halfW = (v) => {
    let w = v < vSeatEnd ? 0.222 - 0.012 * v / vSeatEnd : v < vBack ? 0.21 : 0.21 + 0.012 * (v - vBack) / (1 - vBack);
    // rounded corners: 6 cm at the top of the back, 2 cm at the front lip (distances along the profile)
    const dT = (1 - v) * sTot, dF = v * sTot, rc = 0.06, rf = 0.02;
    if (dT < rc) w = w - rc + Math.sqrt(rc * rc - (rc - dT) ** 2);
    if (dF < rf) w = w - rf + Math.sqrt(rf * rf - (rf - dF) ** 2);
    return w;
  };
  const backness = (v) => (v <= vBack ? 0 : Math.min(1, (v - vBack) / 0.08));
  const Rb = 0.42, T = 0.0045;
  const point = (u, v, off, o) => {
    const P = at(v), t = tan(v), nrm = V3(0, -t.z, t.y); // normal in y-z: up on the seat, forward on the lip and back
    const x = (u - 0.5) * 2 * halfW(v);
    const curve = backness(v) * (Rb - Math.sqrt(Rb * Rb - x * x)) + (1 - backness(v)) * (v < vSeatEnd ? 0.006 * (x / 0.22) ** 2 : 0);
    // the back bows round the sitter: its sides come forward; the seat's sides rise a little (dish)
    o.set(x, P.y + nrm.y * off + (v < vSeatEnd ? curve : 0), P.z + nrm.z * off + (v >= vBack ? curve * backness(v) : 0));
  };
  const top = G.surface((u, v, o) => point(u, v, T / 2, o), 40, 80);
  const bot = G.surface((u, v, o) => point(u, v, -T / 2, o), 40, 80, { flipNormals: true });
  bins.add(mat, top); bins.add(mat, bot);
  // rolled rim round the outline
  // (the top and front edges sampled along u too: the back is curved in plan, a straight chord between
  // the corners would float in front of it)
  const rim = [];
  for (let i = 0; i <= 80; i++) { const o = V3(); point(1, i / 80, 0, o); rim.push(o); }
  for (let i = 1; i < 40; i++) { const o = V3(); point(1 - i / 40, 1, 0, o); rim.push(o); }
  for (let i = 80; i >= 0; i--) { const o = V3(); point(0, i / 80, 0, o); rim.push(o); }
  for (let i = 1; i < 40; i++) { const o = V3(); point(i / 40, 0, 0, o); rim.push(o); }
  const rimClosed = rim.filter((q, i) => i === 0 || q.distanceTo(rim[i - 1]) > 1e-4);
  bins.add(mat, F.sweep(rimClosed, G.circleProfile(0.0042, 10), { closed: true }));
  // drainage hole near the front of the seat
  const hp = V3(); point(0.5, 0.12, T / 2 + 0.0004, hp);
  bins.add(F.plastic('#0E0E0E', 0.8), G.lathe([[0.0001, 0], [0.0055, 0], [0.0055, 0.0006], [0.0001, 0.0006]].reverse(), 20).translate(hp.x, hp.y - 0.0003, hp.z));
  // a point on the shell at width x (m) and profile position v, offset off along the normal
  const at2 = (x, v, off) => { const o = V3(); point(0.5 + x / (2 * halfW(v)), v, off, o); return o; };
  return { at2, vBack, vSeatEnd, T };
}
function plasticChair(p) {
  const c = String(p.color || 'wit').toLowerCase();
  const mat = F.hdpeSmooth(PP[c] || M.resolveColor(c, PP.wit));
  const m2 = mat.clone(); m2.roughness = 0.5; m2.clearcoat = 0.05; m2.name = mat.name + ' pp';
  const frame = U.powder(String(p.legs || 'zwart').toLowerCase());
  const cap = F.plastic('#141414', 0.6);
  const bins = new G.PartBin();
  const sh = plasticShell(bins, m2);
  const r = 0.01, yRail = 0.43;
  for (const s of [-1, 1]) {
    // side frame: front foot -> seat rail -> rear foot, one bent tube
    const pts = [V3(s * 0.228, 0.012, 0.24), V3(s * 0.203, yRail, 0.18), V3(s * 0.203, yRail, -0.15), V3(s * 0.222, 0.012, -0.255)];
    bins.add(frame, F.sweep(F.filletPath(pts, 0.035), G.circleProfile(r, 16)));
    capFoot(bins, cap, V3(s * 0.228, 0, 0.24), r);
    capFoot(bins, cap, V3(s * 0.222, 0, -0.255), r);
    // back upright behind the shell, from the seat rail's rear bend, screwed to the back
    // following the back of the shell at x = 0.17, just behind it
    const up = [V3(s * 0.2, yRail, -0.12)];
    for (let i = 0; i <= 14; i++) { const v = sh.vSeatEnd - 0.05 + (0.86 - sh.vSeatEnd + 0.05) * (i / 14); up.push(sh.at2(s * 0.17, v, -(sh.T / 2 + r * 0.9 + 0.002))); }
    bins.add(frame, F.sweep(F.filletPath(up, 0.04), G.circleProfile(r * 0.9, 14)));
  }
  for (const z of [0.17, -0.14]) bins.add(frame, G.tube(V3(-0.203, yRail - 0.004, z), V3(0.203, yRail - 0.004, z), r * 0.9, 14));
  const g = new THREE.Group(); bins.build(g);
  return { object: g, seatY: 0.455, pitch: [0.065, -0.022] };
}

// ------------------------------------------------------------------ polycarbonaat medaillonstoel
// Clear polycarbonate (round 6). The round-5 stochastic coverage printed as a grainy pencil sketch at
// preview sample counts. Now noise-free and analytic: the chair is opaque to the compositor but shows what
// lies behind it. Per fragment the view ray is followed straight through (thin-wall approximation) to the
// floor or the backdrop: backdrop colour x the floor shading under the chair (a soft Gaussian like the
// baked floor shadow), x a transmission that falls from ~94 % face-on to ~55 % at grazing angles (the
// outlines of clear PC read darker: longer path, total internal reflection), with a faint cool tint.
// That target colour is pushed back through the engine's Khronos-neutral curve and exposure, so after
// tone mapping the clear faces land exactly on the backdrop colour. On top: real clearcoat reflections
// and highlights of the studio (diffuse = 0). `bg` must be the job's backdrop (catalogue Linnen #ECE4D6).
export const CLEAR_EXPOSURE = 0.86;
const CLEAR_GLSL_FN = `
uniform vec3 uBgLin; uniform float uExpo; uniform vec4 uShC; uniform float uShK; uniform vec3 uTint; uniform vec2 uTr; uniform float uHid;
varying vec3 vPcW;
vec3 pcNeutral( vec3 color ) {
  float x = min( color.r, min( color.g, color.b ) );
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max( color.r, max( color.g, color.b ) );
  if ( peak < 0.76 ) return color;
  float d = 0.24; float newPeak = 1. - d * d / ( peak + d - 0.76 );
  color *= newPeak / peak;
  float g = 1. - 1. / ( 0.15 * ( peak - newPeak ) + 1. );
  return mix( color, vec3( newPeak ), g );
}
`;
function clearPC({ bg = '#ECE4D6', sheet = false, hidden = false } = {}) {
  const key = `clearPC:${bg}:${sheet}:${hidden}`;
  if (clearPC.cache && clearPC.cache[key]) return clearPC.cache[key];
  const m = new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.05, metalness: 0, specularIntensity: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.04, envMapIntensity: 0.4, emissive: '#ffffff', side: hidden ? THREE.FrontSide : THREE.DoubleSide, name: `clear polycarbonate (see-through${sheet ? ', sheet' : ''}${hidden ? ', behind' : ''})` });
  if (hidden) { m.depthFunc = THREE.GreaterDepth; m.depthWrite = false; }
  const bgLin = new THREE.Color(bg); // THREE.Color from hex is linear in r186 (colour management on)
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBgLin = { value: new THREE.Vector3(bgLin.r, bgLin.g, bgLin.b) };
    sh.uniforms.uExpo = { value: CLEAR_EXPOSURE };
    sh.uniforms.uShC = { value: new THREE.Vector4(0, -0.02, 0.3, 0.32) }; // floor shadow centre x, z and radii
    sh.uniforms.uShK = { value: 0.2 };
    sh.uniforms.uTint = { value: new THREE.Vector3(0.86, 0.93, 1.0) };
    sh.uniforms.uTr = { value: sheet ? new THREE.Vector2(0.87, 0.7) : new THREE.Vector2(0.86, 0.16) };
    sh.uniforms.uHid = { value: hidden ? 0.88 : 1.0 };
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vPcW;\nvoid main() {')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vPcW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${CLEAR_GLSL_FN}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    vec3 Vw = normalize( vPcW - cameraPosition );
    float fl = 1.0;
    if ( Vw.y < -0.001 ) {
      float tt = - vPcW.y / Vw.y; vec2 hit = vPcW.xz + Vw.xz * tt;
      vec2 dd = ( hit - uShC.xy ) / uShC.zw; fl = 1.0 - uShK * exp( - dot( dd, dd ) );
    }
    float ndv = abs( dot( normalize( vNormal ), normalize( vViewPosition ) ) );
    float edge = smoothstep( 0.22, 0.9, 1.0 - ndv );
    vec3 tr = mix( vec3( uTr.x ), uTint * uTr.y, edge );
    vec3 target = uBgLin * fl * tr * uHid;
    vec3 xx = target;
    for ( int k = 0; k < 8; k ++ ) xx += target - pcNeutral( xx );
    totalEmissiveRadiance = max( xx, vec3( 0.0 ) ) / uExpo;
  }`);
  };
  m.customProgramCacheKey = () => 'clearPC-v2';
  m.userData.albedoL = 0.5;
  clearPC.cache = { ...(clearPC.cache || {}), [key]: m };
  return m;
}
function polyChair(p) {
  const c = String(p.color || 'transparant').toLowerCase();
  const clear = p.translucent === true || c.includes('trans') || c === '#e9eef0';
  const sheetMat = clear ? clearPC({ sheet: true }) : null;
  const mat = clear ? clearPC()
    : new THREE.MeshPhysicalMaterial({ color: c === 'zwart' ? '#141516' : c === 'wit' ? '#F2F2EE' : M.resolveColor(c, '#F2F2EE'), roughness: 0.16, specularIntensity: 0.7, clearcoat: 1.0, clearcoatRoughness: 0.08, side: THREE.DoubleSide, name: `polycarbonate ${c}` });
  const bins = new G.PartBin();
  const ySeat = 0.46, T = 0.05;
  // seat: cushion-shaped, slightly wider at the front
  const seat = F.cushion(0.46, T, 0.43, { r: 0.022, puff: 0.006, seg: [28, 6, 28], taper: 0.03 });
  bins.add(sheetMat || mat, seat.translate(0, ySeat - T / 2, 0.01));
  // medallion plane (see the back below), needed by the rear posts
  const toWorldB = (x, y, z = 0) => { const rk = 12 * DEG; return V3(x, 0.73 + y * Math.cos(rk) + z * Math.sin(rk), -0.215 - y * Math.sin(rk) + z * Math.cos(rk)); };
  // front legs: tapered, rising past the seat into the arm supports
  for (const s of [-1, 1]) {
    const front = bez([V3(s * 0.212, 0.0, 0.205), V3(s * 0.205, 0.3, 0.2), V3(s * 0.2, 0.46, 0.19), V3(s * 0.225, 0.635, 0.16)], 20);
    bins.add(mat, taper(front, (t) => 0.0125 + 0.008 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2) - (t > 0.75 ? (t - 0.75) * 0.02 : 0)));
    // sabre rear legs (round 7): moulded on through the seat's rear corners into two short posts that carry the
    // medallion at its lower flanks, as on the real chair (the round-6 back stood on one central neck, which in
    // clear PC read as a medallion balanced on a stem)
    const rear = bez([V3(s * 0.222, 0.0, -0.285), V3(s * 0.215, 0.12, -0.25), V3(s * 0.205, 0.28, -0.2), V3(s * 0.19, ySeat - 0.02, -0.168)], 18);
    const t0 = -Math.PI / 2 + s * 0.78;
    const top = toWorldB(0.17 * Math.cos(t0) * 1.02, 0.205 * Math.sin(t0) * 1.02);
    const post = bez([V3(s * 0.19, ySeat - 0.02, -0.168), V3(s * 0.178, ySeat + 0.05, -0.174), top], 10);
    const full = rear.concat(post.slice(1));
    const nR = rear.length, nAll = full.length;
    bins.add(mat, taper(full, (t) => { const k = t * (nAll - 1) / (nR - 1); return k <= 1 ? 0.02 - 0.007 * k : 0.013 - 0.002 * Math.min(1, (k - 1) * (nR - 1) / (nAll - nR)); }));
    // arm: from the front support, out and back into the medallion's side
    // (ends on the medallion's outer face, not through it)
    const arm = bez([V3(s * 0.225, 0.635, 0.16), V3(s * 0.262, 0.665, 0.02), V3(s * 0.24, 0.69, -0.13), V3(s * 0.186, 0.7, -0.205)], 22);
    bins.add(mat, taper(arm, (t) => 0.015 + 0.004 * Math.sin(t * Math.PI)));
  }
  // medallion back: oval frame (tube) and a thin panel, raked back, on a neck above the seat's rear
  const rake = 12 * DEG, cy = 0.73, cz = -0.215, a = 0.17, b = 0.205;
  // back plane: up = (0, cos, -sin) (raked back), normal = (0, sin, cos) (towards the sitter)
  const toWorld = (x, y, z = 0) => V3(x, cy + y * Math.cos(rake) + z * Math.sin(rake), cz - y * Math.sin(rake) + z * Math.cos(rake));
  const ring = [];
  for (let i = 0; i < 72; i++) { const t = (i / 72) * Math.PI * 2; ring.push(toWorld(a * Math.cos(t), b * Math.sin(t))); }
  bins.add(mat, F.sweep(ring, G.roundedRectProfile(0.03, 0.022, 0.009, 3), { closed: true }));
  const panel = G.surface((u, v, o) => {
    const t = u * Math.PI * 2, rr = v * 0.97;
    const x = a * rr * Math.cos(t), y = b * rr * Math.sin(t);
    const bow = 0.02 * (1 - (x / a) ** 2) * (1 - rr * rr * 0.3);
    o.copy(toWorld(x, y, -bow));
  }, 48, 8, { closedU: true });
  bins.add(sheetMat || mat, panel);

  const g = new THREE.Group(); bins.build(g);
  if (clear) {
    // what lies behind a clear part shows through it: a second, depth-inverted copy of every front face
    // that is hidden behind another part, drawn a little darker (seen through two walls)
    const meshes = []; g.traverse((m) => { if (m.isMesh) { m.castShadow = true; meshes.push(m); } });
    for (const m of meshes) {
      const h = new THREE.Mesh(m.geometry, clearPC({ sheet: m.material === sheetMat, hidden: true }));
      h.renderOrder = 10; h.castShadow = false; h.receiveShadow = false; h.userData.noFrame = true;
      g.add(h);
    }
  }
  return { object: g, seatY: ySeat, clear };
}

// ------------------------------------------------------------------ connected row (stoelverbinder)
function rowConnector(bins, mat, c1, c2, axis) {
  // two clip rings round the tubes (axis = the tube direction) and a bridge between them
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), axis);
  for (const c of [c1, c2]) {
    const t = new THREE.TorusGeometry(0.0142, 0.0032, 8, 28).applyQuaternion(q);
    bins.add(mat, t.translate(c.x, c.y, c.z));
    const t2 = new THREE.TorusGeometry(0.0142, 0.0032, 8, 28).applyQuaternion(q).translate(c.x, c.y, c.z).translate(...axis.clone().multiplyScalar(0.012).toArray());
    bins.add(mat, t2);
  }
  const mid = c1.clone().add(c2).multiplyScalar(0.5).addScaledVector(axis, 0.006);
  const side = c2.clone().sub(c1).normalize();
  bins.add(mat, F.boxAt(c1.distanceTo(c2), 0.026, 0.009, mid.clone().add(V3(0, 0, 0.0)), side, axis, 0.003));
}

export function chairRow(p, chairFn) {
  const n = Math.max(1, Math.round(Number(p.count)));
  const one = { ...p }; delete one.count; delete one.linked;
  const pitch = Number(p.pitch ?? 0.457);
  const group = new THREE.Group(); group.name = `chair row ${n}`;
  let first = null;
  for (let i = 0; i < n; i++) {
    const c = chairFn(one);
    if (!first) first = c;
    c.object.position.x = (i - (n - 1) / 2) * pitch;
    group.add(c.object);
  }
  if (p.linked) {
    // klapstoel front legs (chair.js): A tubes from (±0.215, 0.008, 0.205) to (±0.215, 0.835, -0.175)
    const A0 = V3(0.215, 0.008, 0.205), A1 = V3(0.215, 0.835, -0.175);
    const axis = A1.clone().sub(A0).normalize();
    const y = 0.2, t = (y - A0.y) / (A1.y - A0.y), z = A0.z + (A1.z - A0.z) * t;
    const bins = new G.PartBin(), mat = F.plastic('#1B1B1C', 0.45);
    for (let i = 0; i < n - 1; i++) {
      const x0 = (i - (n - 1) / 2) * pitch;
      rowConnector(bins, mat, V3(x0 + 0.215, y, z), V3(x0 + pitch - 0.215, y, z), axis);
    }
    const gc = new THREE.Group(); bins.build(gc); group.add(gc);
  }
  return {
    object: group,
    detail: { target: [pitch / 2, 0.2, 0.13], size: 0.18, azimuth: 20, elevation: 8 },
    meta: { ...(first.meta || {}), count: n, linked: !!p.linked },
    rig: (() => { const r = S.seatRig(group); if (first.rig && first.rig.default && first.rig.default.exposure) r.default.exposure = Math.max(r.default.exposure, first.rig.default.exposure); return r; })(),
  };
}

// ------------------------------------------------------------------ dispatch from chair.js
export function chair3(style, p) {
  const st = String(style).toLowerCase();
  let info;
  if (st.startsWith('bistro')) info = bistroFolding(p);
  else if (st === 'kunststof' || st === 'pp' || st === 'plastic') info = plasticChair(p);
  else info = polyChair(p);
  let object = info.object;
  const stack = Math.max(1, Math.round(Number(p.stack ?? 1)));
  if (stack > 1 && info.pitch) {
    const g = new THREE.Group();
    for (let k = 0; k < stack; k++) { const c = k === 0 ? object : object.clone(); c.position.set(0, k * info.pitch[0], k * info.pitch[1]); g.add(c); }
    object = g;
  }
  object.name = `chair ${st} ${p.color || ''}${p.folded ? ' folded' : ''}${stack > 1 ? ' x' + stack : ''}`;
  const c = String(p.color || '').toLowerCase();
  return {
    object,
    detail: p.folded ? { target: [0, 0.4, 0], size: 0.4, azimuth: 30, elevation: 10 } : { target: [0.12, info.seatY - 0.02, 0.17], size: 0.36, azimuth: 34, elevation: 18 },
    meta: { style: st, color: p.color, folded: !!p.folded, stack },
    // clear PC (round 7): a more frontal hero, so both arms stand free beside the medallion instead of one of them
    // crossing it (in a see-through chair that read as a missing arm and a medallion on one stem)
    view: info.clear ? { hero: { azimuth: 12, elevation: 18 } } : undefined,
    rig: (() => {
      const r = S.seatRig(object);
      if (c === 'wit') r.default.exposure = Math.max(r.default.exposure, 0.84);
      // clear polycarbonate: expose for the backdrop and the highlights, not for a "mid grey" chair
      if (info.clear) r.default.exposure = CLEAR_EXPOSURE;
      return r;
    })(),
  };
}
