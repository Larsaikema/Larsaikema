// Barkruk / lage kruk.
//
// { style, height, color, back, stack, frame, seat }
//   style 'metaal'  stackable industrial steel stool: pressed round seat pan (rolled skirt,
//                   drainage holes), four splayed V-section legs of folded sheet riveted to the
//                   skirt, flat-bar footrest on the outside of the legs, plastic glides. The
//                   open V legs nest, so the stools stack at a 6 cm pitch.
//         'draad'    welded steel wire stool: round seat of a two-layer wire grid (Ø3.6 mm,
//                   24 mm pitch, gently dished, ends welded into an 8 mm rim rod), low curved
//                   wire backrest (rail + verticals + mid wire), four Ø11 rod legs, footrest ring.
//         'hout'     square seat 35 x 35 cm of multiplex with an oak top veneer (plies visible
//                   on the edge) on a square tube seat frame, four splayed Ø22 tube legs,
//                   square tube footrest, glides.
//         'rotan'    outdoor bar chair: powder-coated aluminium legs and footrest, seat rim and
//                   back loop wrapped with a flat PE strand, seat and back panels a real
//                   over-under weave of 7.5 mm flat strands (three tones).
//         'velours'  upholstered bar stool: velvet seat cushion (crowned, gathered corners,
//                   piping on the top and bottom seam), channel-tufted curved back, thin black
//                   steel legs with a square footrest.
//         'vat'      barkruk wijnvat: PE cask in oak look with hoops and a rimmed plank seat
//                   (models/barrelStool.js, `finish` as barrelTable).
//         'klap'     inklapbare barkruk with a low back, `folded` (models/chairs3.js).
//         'chroom'   chrome Ø25 tube frame (seat ring, four splayed legs, foot ring) with a
//                   round faux-leather (kunstleer) seat pad Ø36 with piping; stackable.
//   height   seat height (m): 0.76 bar (default), 0.65 counter, 0.45 low stool.
//   color    seat / shell colour (frame colour for 'metaal', 'draad', 'hout').
//   back     backrest (default: true for 'rotan', 'velours' and 'draad').
//   stack    n stools stacked (metaal / draad / chroom / velours).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';
import { rng, makeNoise2 } from '../js/rng.js';
import { barrelStool } from './barrelStool.js'; // round 5: style 'vat' (barkruk wijnvat)
import { foldingBarStool } from './chairs3.js'; // round 5: style 'klap' (inklapbare barkruk)

const { V3 } = G;
const DEG = Math.PI / 180;
const lumOf = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// velours as it photographs (mid tone of the pile; faces read darker, flanks lighter)
const VELVET = { grijs: '#8A8D90', camel: '#97693D', groen: '#2C5D45', marineblauw: '#1F2843', zwart: '#222224', antraciet: '#45484C', bordeaux: '#6A1F2A', roze: '#C98E98', zand: '#C8B596' };
const WICKER = { zwart: '#2E2C2A', bruin: '#6A4D36', grijs: '#8A8781', naturel: '#A88B62', wit: '#E4E0D6' };
const WICKER_FRAME = { zwart: '#1F1E1D', bruin: '#3A2C21', grijs: '#4F5154', naturel: '#3A2C21', wit: '#D9D8D3' };
// faux leather (PU kunstleer) as it photographs
const LEATHER = { zwart: '#1E1E20', wit: '#E6E3DC', antraciet: '#4C5055', grijs: '#7A7D80', bruin: '#5A3E2B', cognac: '#8A5A33' };

const legDirs = () => [45, 135, 225, 315].map((a) => V3(Math.sin(a * DEG), 0, Math.cos(a * DEG)));
const glideCap = (bins, mat, x, z, r) => bins.add(mat, G.lathe([[0.0001, 0.0], [r + 0.001, 0.0], [r + 0.0016, 0.003], [r + 0.0012, 0.016], [0.0001, 0.016]].reverse(), 20).translate(x, 0, z));

// ----------------------------------------------------------------------------- metaal
function stoolMetal(bins, H, color) {
  const mat = U.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const bar = H > 0.6;
  const R = bar ? 0.165 : 0.155;
  // seat pan (outer surface from the centre outwards, round-over, skirt, rolled hem, inner surface back)
  const t = 0.0015, rr = 0.008, sk = 0.034;
  const out = [[0.0001, 0.0015], [R * 0.6, 0.0008], [R - rr - 0.002, -0.0005]];
  for (let i = 0; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); out.push([R - rr + Math.cos(a) * rr, -0.0005 - rr + Math.sin(a) * rr]); }
  out.push([R + 0.0012, -sk * 0.55], [R + 0.0025, -sk + 0.002]);
  for (let i = 0; i <= 6; i++) { const a = Math.PI - (Math.PI * i) / 6; out.push([R + 0.0025 + 0.0022 + Math.cos(a) * 0.0022, -sk + Math.sin(-Math.PI * i / 6) * 0.0022 - 0.0002]); }
  out.push([R + 0.0025 - t, -sk + 0.002], [R - t + 0.0012, -sk * 0.55], [R - t, -rr - 0.0005]);
  out.push([R - rr - 0.002, -0.0005 - t], [R * 0.6, 0.0008 - t], [0.0001, 0.0015 - t]);
  const pan = G.lathe(out.reverse(), 128);
  // drainage holes: centre, ring of 6, ring of 12 (alpha-cut, planar uv over the pan)
  const sz = 2 * (R + 0.01);
  // planar uv over the seat, the skirt unrolled radially (no stretched orange-peel on it)
  { const p = pan.attributes.position, uv = pan.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z) || 1e-6, k = (r + Math.max(0, -p.getY(i))) / r; uv.setXY(i, (x * k) / (sz * 1.25) + 0.5, (z * k) / (sz * 1.25) + 0.5); } }
  const holes = [[0, 0, 0.0042]];
  for (let k = 0; k < 6; k++) holes.push([Math.sin(k * 60 * DEG) * 0.045, Math.cos(k * 60 * DEG) * 0.045, 0.0042]);
  for (let k = 0; k < 12; k++) holes.push([Math.sin((k * 30 + 15) * DEG) * 0.095, Math.cos((k * 30 + 15) * DEG) * 0.095, 0.0042]);
  bins.add(S.holedSheet(mat, holes, sz * 1.25, `tolix2${R}`), pan.translate(0, H, 0));
  // legs: V-section (2 x 26 mm flanges at 90 deg, apex outwards), hemmed edges
  const wf = bar ? 0.026 : 0.024, ytop = H - 0.006, yfoot = 0.014;
  const Rf = bar ? 0.3 : 0.235;
  const rTop = R + 0.0025 + wf * 0.7071;
  const apex = (u, y) => { const f = (y - yfoot) / (ytop - yfoot); return u.clone().multiplyScalar(Rf + (rTop - Rf) * f).setY(y); };
  const yRing = bar ? 0.3 : 0.15;
  const dirs = legDirs();
  dirs.forEach((u) => {
    const A = apex(u, ytop), B = apex(u, yfoot);
    for (const s of [-1, 1]) {
      const d = u.clone().negate().applyAxisAngle(V3(0, 1, 0), s * 45 * DEG);
      bins.add(mat, G.flatBar(A.clone().addScaledVector(d, wf / 2), B.clone().addScaledVector(d, wf / 2), wf, 0.0016, d, 0.0007));
      bins.add(mat, G.tube(A.clone().addScaledVector(d, wf), B.clone().addScaledVector(d, wf), 0.0018, 8));
      for (const yy of [H - 0.012, H - 0.026]) {
        const pr = apex(u, yy).addScaledVector(d, wf * 0.55);
        const n = u.clone().applyAxisAngle(V3(0, 1, 0), s * 45 * DEG);
        F.rivet(bins, mat, pr.addScaledVector(n, 0.0009), n, 0.0035);
      }
    }
    bins.add(mat, G.tube(A, B, 0.0016, 8));
    const g0 = apex(u, 0.0).addScaledVector(u, -0.012);
    bins.add(glide, G.lathe([[0.0001, 0.0], [0.012, 0.0], [0.0135, 0.004], [0.013, 0.02], [0.0001, 0.02]].reverse(), 24).translate(g0.x, 0, g0.z));
  });
  for (let k = 0; k < 4; k++) {
    const a = apex(dirs[k], yRing), b = apex(dirs[(k + 1) % 4], yRing);
    const out1 = a.clone().add(b).setY(0).normalize();
    const e = b.clone().sub(a).normalize();
    bins.add(mat, G.flatBar(a.clone().addScaledVector(out1, 0.004).addScaledVector(e, -0.008), b.clone().addScaledVector(out1, 0.004).addScaledVector(e, 0.008), 0.024, 0.004, V3(0, 1, 0), 0.0015));
    F.rivet(bins, mat, a.clone().addScaledVector(out1, 0.0062).addScaledVector(e, 0.002), out1, 0.0035);
    F.rivet(bins, mat, b.clone().addScaledVector(out1, 0.0062).addScaledVector(e, -0.002), out1, 0.0035);
  }
  return { pitch: 0.06, seatR: R, footR: Rf, topY: H };
}

// ----------------------------------------------------------------------------- draad
function stoolWire(bins, H, color, back) {
  const mat = U.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const Rr = 0.19, rimR = 0.004, wr = 0.0018, dish = 0.009, sp = 0.024;
  const yRim = H - rimR;
  bins.add(mat, F.ring(Rr, yRim, rimR, { segs: 160 }));
  const yd = (x, z) => yRim - 0.0006 - dish * Math.max(0, 1 - (x * x + z * z) / (Rr * Rr));
  // two welded layers: bottom wires along x, top wires along z resting on them; every end
  // runs into the rim rod
  const wire = G.circleProfile(wr, 10);
  for (let layer = 0; layer < 2; layer++) for (let k = -8; k <= 8; k++) {
    const c = k * sp;
    if (Math.abs(c) > Rr - 0.01) continue;
    const half = Math.sqrt((Rr - 0.0012) ** 2 - c * c);
    const pts = [];
    for (let i = 0; i <= 48; i++) { const s = -half + (2 * half * i) / 48; const x = layer ? c : s, z = layer ? s : c; pts.push(V3(x, yd(x, z) + (layer ? 2 * wr - 0.0002 : 0), z)); }
    bins.add(mat, F.sweep(pts, wire));
  }
  // support ring under the grid and legs
  const ySup = yRim - 0.045, rSup = 0.145;
  bins.add(mat, F.ring(rSup, ySup, 0.004, { segs: 128 }));
  const bar = H > 0.6;
  const Rf = bar ? 0.28 : 0.225, legR = 0.0055;
  const yTopLeg = yRim;
  const rTop = Rr + rimR + legR - 0.0005;
  const legAt = (u, y) => { const f = (y - 0.012) / (yTopLeg - 0.012); return u.clone().multiplyScalar(Rf + (rTop - Rf) * f).setY(y); };
  for (const u of legDirs()) {
    const A = legAt(u, yTopLeg), B = legAt(u, 0.012);
    bins.add(mat, G.tube(A, B, legR, 14));
    // the support ring is welded to the inside of each leg by a short wire spoke
    const L = legAt(u, ySup);
    bins.add(mat, G.tube(u.clone().multiplyScalar(rSup).setY(ySup), L.clone().addScaledVector(u, -legR * 0.6), 0.003, 8));
    glideCap(bins, glide, B.x, B.z, legR + 0.001);
  }
  const yRing = bar ? 0.3 : 0.16;
  bins.add(mat, F.ring(legAt(V3(1, 0, 0), yRing).x + legR + 0.0045, yRing, 0.005, { segs: 128 }));
  bins.add(mat, F.ring(legAt(V3(1, 0, 0), 0.08).x + legR + 0.0035, 0.08, 0.0035, { segs: 128 }));
  if (back) {
    // low curved back over the rear 110 deg: rail (Ø8) whose ends run down into the rim,
    // vertical wires 24 mm apart, one horizontal wire welded on their outside
    const a0 = 125 * DEG, a1 = 235 * DEG, hb = 0.16, flare = 0.014, yTop = yRim + hb;
    const rad = (y) => Rr + flare * (y - yRim) / hb;
    const P = (a, y) => V3(Math.sin(a) * rad(y), y, Math.cos(a) * rad(y));
    const rail = [P(a0, yRim)];
    for (let i = 0; i <= 24; i++) rail.push(P(a0 + ((a1 - a0) * i) / 24, yTop));
    rail.push(P(a1, yRim));
    bins.add(mat, F.sweep(F.filletPath(rail, 0.035, 8), G.circleProfile(rimR, 12)));
    const arcLen = (a1 - a0) * Rr;
    const nV = Math.round(arcLen / sp);
    for (let i = 1; i < nV; i++) {
      const a = a0 + ((a1 - a0) * i) / nV;
      const pts = []; for (let k = 0; k <= 8; k++) pts.push(P(a, yRim + (hb * k) / 8));
      bins.add(mat, F.sweep(pts, wire));
    }
    const yM = yRim + hb * 0.48;
    const mid = []; for (let i = 0; i <= 40; i++) { const a = a0 + 0.03 + ((a1 - a0 - 0.06) * i) / 40; const p = P(a, yM); const n = V3(Math.sin(a), 0, Math.cos(a)); mid.push(p.addScaledVector(n, 2 * wr - 0.0002)); }
    bins.add(mat, F.sweep(mid, wire));
  }
  return { pitch: 0.07, seatR: Rr, footR: Rf, topY: back ? yRim + 0.16 : H };
}

// ----------------------------------------------------------------------------- hout
function stoolWood(bins, H, color) {
  const mat = U.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const veneer = S.woodMat('eiken', { stain: '#B8935F', seed: 11 });
  const W = 0.35, T = 0.018;
  const board = S.plyBoard(W, W, T, { rc: 0.028 });
  S.uvJitter(board.faces, rng(17), { du: 0.6, dv: 0.15, flip: false });
  bins.add(veneer, board.faces.translate(0, H, 0)); bins.add(M.birchEdge(), board.edge.translate(0, H, 0));
  // seat frame: square ring of 20 x 20 tube under the board, inset 3 cm
  const fs = W - 0.06, yF = H - T - 0.01;
  bins.add(mat, F.sweep(F.rectPath(fs, fs, 0.014, yF, 6), G.roundedRectProfile(0.02, 0.02, 0.004, 3), { closed: true }));
  const bar = H > 0.6;
  const legR = 0.011, half = bar ? 0.235 : 0.205;
  const top = (sx, sz) => V3(sx * (fs / 2 + legR - 0.002), H - T - 0.001, sz * (fs / 2 + legR - 0.002));
  const foot = (sx, sz) => V3(sx * half, 0.012, sz * half);
  const at = (sx, sz, y) => { const a = top(sx, sz), b = foot(sx, sz); return b.clone().lerp(a, (y - b.y) / (a.y - b.y)); };
  const cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (const [sx, sz] of cs) {
    bins.add(mat, G.tube(top(sx, sz), foot(sx, sz), legR, 20));
    const f = foot(sx, sz); glideCap(bins, glide, f.x, f.z, legR + 0.0005);
  }
  const yR = bar ? 0.29 : 0.15;
  for (let k = 0; k < 4; k++) { const [ax, az] = cs[k], [bx, bz] = cs[(k + 1) % 4]; bins.add(mat, G.tube(at(ax, az, yR), at(bx, bz, yR), 0.008, 16)); }
  // four screws through the frame into the board (seen from below only)
  for (const [sx, sz] of cs) F.rivet(bins, M.galvanised(), V3(sx * 0.1, yF - 0.01, sz * 0.1), V3(0, -1, 0), 0.0035);
  return { pitch: 0, seatR: W / 2, footR: half * 1.41, topY: H };
}

// ----------------------------------------------------------------------------- rotan
// Outdoor wicker bar chair: aluminium legs + footrest (powder coat), seat rim and back loop
// wrapped with flat PE strand, seat and back a real over-under weave.
function chairRattan(bins, H, color, back) {
  const key = String(color).toLowerCase();
  const hex = WICKER[key] || M.resolveColor(color, '#2E2C2A');
  const mats = S.rattanMats(hex);
  const alu = M.steelPowder(WICKER_FRAME[key] || '#2A2A2A', { roughness: 0.45, clearcoat: 0.15 });
  const cap = F.plastic('#1A1A1A', 0.6);
  const W = 0.46, D = 0.44, rc = 0.07, rRim = 0.014;
  const ySeat = H - rRim;
  const Wi = W - 2 * rRim, Di = D - 2 * rRim;
  bins.add(mats[0], S.ribbedTube(F.rectPath(Wi, Di, rc, ySeat, 14), rRim, { closed: true, pitch: 0.0078 }));
  // seat weave: dished 6 mm, strand ends run into the rim tube
  const dish = 0.006;
  const inRR = (x, z, w, d, r) => { const qx = Math.abs(x) - (w / 2 - r), qz = Math.abs(z) - (d / 2 - r); return qx <= 0 || qz <= 0 ? Math.abs(x) <= w / 2 && Math.abs(z) <= d / 2 : Math.hypot(qx, qz) <= r; };
  S.weavePanel(bins, mats, (s, t) => {
    const x = -Wi / 2 + s, z = Di / 2 - t;
    const b = Math.max(0, 1 - (2 * x / Wi) ** 2) * Math.max(0, 1 - (2 * z / Di) ** 2);
    return { p: V3(x, ySeat - 0.001 - dish * b, z), n: V3(0, 1, 0) };
  }, Wi, Di, { clip: (s, t) => inRR(-Wi / 2 + s, Di / 2 - t, Wi + 0.006, Di + 0.006, rc + 0.003), seed: 5 });
  // legs: Ø25 aluminium, slightly splayed, under the rim corners
  const legR = 0.0125;
  const legs = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const A = V3(sx * (W / 2 - 0.05), ySeat - rRim * 0.6, sz * (D / 2 - 0.05)), B = V3(sx * (W / 2 - 0.05) * 1.12, 0.022, sz * (D / 2 - 0.05) * 1.12);
    bins.add(alu, G.tube(A, B, legR, 20));
    bins.add(cap, G.lathe([[0.0001, 0], [legR + 0.0012, 0], [legR + 0.0016, 0.004], [legR + 0.0012, 0.022], [0.0001, 0.022]].reverse(), 18).translate(B.x, 0, B.z));
    legs.push([A, B]);
  }
  const at = (i, y) => { const [A, B] = legs[i]; return B.clone().lerp(A, (y - B.y) / (A.y - B.y)); };
  const yF = H > 0.6 ? 0.27 : 0.14;
  for (let k = 0; k < 4; k++) bins.add(alu, G.tube(at(k, yF), at((k + 1) % 4, yF), 0.0105, 16));
  if (back) {
    const hw = 0.19, bh = 0.37, rf = 0.075, Rb = 0.5, rec = 10 * DEG, lr = 0.013;
    const zR = -(D / 2 - rRim);
    const top = ySeat + bh;
    const toW = (x, y) => V3(x, y, zR + (Rb - Math.sqrt(Rb * Rb - x * x)) - (y - ySeat) * Math.tan(rec));
    const nW = (x, y) => { const e = 0.002; const p = toW(x, y), px = toW(x + e, y), py = toW(x, y + e); return px.sub(p).cross(py.sub(p)).normalize(); };
    const loop2d = F.filletPath([V3(-hw, ySeat, 0), V3(-hw, top, 0), V3(hw, top, 0), V3(hw, ySeat, 0)], rf, 12);
    bins.add(mats[0], S.ribbedTube(S.densify(loop2d, 0.01).map((p) => toW(p.x, p.y)), lr, { pitch: 0.0078 }));
    // bottom rail of the back panel (strand ends run into it)
    const y0 = ySeat + 0.06;
    bins.add(mats[0], S.ribbedTube(S.densify([V3(-hw, y0, 0), V3(hw, y0, 0)], 0.01).map((p) => toW(p.x, p.y)), 0.011, { pitch: 0.0078 }));
    const cy = top - rf, cx = hw - rf;
    S.weavePanel(bins, mats, (s, t) => {
      const x = -hw + s, y = y0 + t;
      return { p: toW(x, y), n: nW(x, y) };
    }, 2 * hw, top - y0, {
      clip: (s, t) => { const x = Math.abs(-hw + s), y = y0 + t; if (x > cx && y > cy) return Math.hypot(x - cx, y - cy) <= rf + 0.002; return true; }, seed: 9,
    });
  }
  return { pitch: 0, seatR: 0.25, footR: 0.3, topY: back ? ySeat + 0.37 : H };
}

// ----------------------------------------------------------------------------- velours
function stoolVelvet(bins, H, color, back, frameColor = 'zwart', extra = []) {
  const key = String(color).toLowerCase();
  const hex = VELVET[key] || M.resolveColor(color, '#7E8184');
  const light = lumOf(hex) > 0.12;
  // light velvets (camel, grijs) get a gentler rim so the flanks do not go chalky
  const vopt = light ? { face: 0.72, rimGain: 1.48, desat: 0.3, lean: 0.08 } : { desat: 0.38 };
  const vel = U.velvetPile(hex, vopt);
  const frame = U.powder(frameColor);
  const glide = F.plastic('#161616', 0.6);
  const W = 0.44, D = 0.42, T = 0.078;
  const seat = S.softBlock(W, T, D, { r: 0.03, crown: 0.014, belly: 0.005, gather: 0.0022, uneven: 0.001, seed: 4, seg: [64, 14, 62] });
  U.puckerSeams(seat, { amp: 0.0008, pitch: 0.026, width: 0.012, seed: 4 });
  const yC = H - T / 2 - 0.008;
  const shape = seat.userData.shape;
  bins.add(vel, seat.translate(0, yC, 0));
  for (const side of [1, -1]) bins.add(vel, F.sweep(S.weltPath(shape, side, { cr: 0.0034 }).map((p) => p.setY(p.y + yC)), G.circleProfile(0.0034, 12), { closed: true }));
  const yB = H - T - 0.008;
  bins.add(frame, G.roundedBox(0.32, 0.016, 0.3, 0.004).translate(0, yB - 0.006, 0));
  const legR = 0.0095, Rf = 0.285, rTop = 0.19, yTop = yB - 0.014;
  const legAt = (u, y) => { const f = (y - 0.012) / (yTop - 0.012); return u.clone().multiplyScalar(Rf + (rTop - Rf) * f).setY(y); };
  for (const u of legDirs()) {
    const A = legAt(u, yTop), B = legAt(u, 0.012);
    bins.add(frame, G.tube(A, B, legR, 18));
    glideCap(bins, glide, B.x, B.z, legR);
  }
  const yF = H > 0.6 ? 0.28 : 0.15;
  const corners = legDirs().map((u) => legAt(u, yF));
  for (let k = 0; k < 4; k++) bins.add(frame, G.tube(corners[k], corners[(k + 1) % 4], 0.0085, 14));
  if (back) {
    // channel-tufted back: built lying flat (thickness along y, front face +y, top edge at -z),
    // five vertical channels (8.6 cm) whose fabric is stitched down into sharp seams and
    // pillows out between them; piping on the front seam; then stood up, curved round Rb and
    // raked back. Seams get a little ambient occlusion (vertex colours, own mesh).
    const bw = 0.43, bh = 0.31, bt = 0.058, Rb = 0.42, nC = 5, cw = bw / nC, Dch = 0.012;
    const panel = S.softBlock(bw, bt, bh, { r: 0.02, crown: 0.004, crownBottom: 0.002, belly: 0.003, gather: 0, uneven: 0.0004, seg: [344, 10, 120], seed: 7 });
    const S0 = panel.userData.shape;
    const { noise } = makeNoise2(23);
    const seamX = []; for (let k = 1; k < nC; k++) seamX.push(-bw / 2 + k * cw);
    const chan = (x, z) => {
      // returns [offset along +y (m), seam proximity 0..1]
      let ds = Infinity; for (const sx of seamX) ds = Math.min(ds, Math.abs(x - (sx + 0.0006 * noise(sx * 40, z * 25))));
      const s = 1 - Math.min(1, ds / (cw / 2)); // 0 channel centre, 1 seam
      const hgt = Math.pow(Math.max(0, 1 - s * s), 0.55);
      // pinch towards the piped edge (top / bottom) and the side rims
      const ez = S0.hz + S0.r * 0.5 - Math.abs(z), ex = S0.hx + S0.r * 0.5 - Math.abs(x);
      const pinch = sstep(0.0, 0.03, ez) * sstep(0.0, 0.02, ex);
      const wob = 1 + 0.12 * noise(Math.round((x + bw / 2) / cw) * 3.1, z * 9);
      return [(-Dch * (1 - hgt) * (0.45 + 0.55 * pinch) + 0.0035 * hgt * pinch * wob) , Math.exp(-((ds / 0.006) ** 2)) * (0.5 + 0.5 * pinch)];
    };
    const pp = panel.attributes.position;
    const occ = new Float32Array(pp.count);
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      if (y > 0) {
        const fy = sstep(0, bt / 2 + 0.004, y);
        const [dy, sp] = chan(x, z);
        pp.setY(i, y + dy * fy);
        occ[i] = sp * fy;
      }
    }
    panel.computeVertexNormals();
    const welt = S.weltPath(S0, 1, { cr: 0.0034, n: 12 }).map((p) => { const [dy] = chan(p.x, p.z); return p.setY(p.y + dy * 0.15); });
    // stand up (+y -> +z front, -z -> +y top), curve round Rb, rake, place
    const rake = 12 * DEG;
    const yb = H + 0.05 + bh / 2, zb = -D / 2 + 0.02;
    const place = (v) => {
      let x = v.x, y = -v.z, z = v.y; // stood up
      const a = x / Rb, rad = Rb - z;
      x = Math.sin(a) * rad; z = Rb - Math.cos(a) * rad;
      const c = Math.cos(-rake), s = Math.sin(-rake);
      return V3(x, y * c - z * s + yb, y * s + z * c + zb);
    };
    const tv = new THREE.Vector3();
    for (let i = 0; i < pp.count; i++) { tv.fromBufferAttribute(pp, i); const w = place(tv); pp.setXYZ(i, w.x, w.y, w.z); }
    panel.computeVertexNormals();
    U.cavityColors(panel, (i) => 1 - 0.55 * occ[i]);
    extra.push(U.meshOf(panel, U.velvetPile(hex, { ...vopt, vertexColors: true }), 'velvet back'));
    bins.add(vel, F.sweep(welt.map(place), G.circleProfile(0.0034, 12), { closed: true }));
    for (const s of [-1, 1]) {
      const a = V3(s * 0.11, yB - 0.01, -0.13), b = V3(s * 0.11, H + 0.02, -D / 2 - 0.02), c = V3(s * 0.11, H + 0.13, -D / 2 - 0.035);
      bins.add(frame, F.sweep(F.filletPath([a, b, c], 0.04), G.roundedRectProfile(0.03, 0.006, 0.002, 2), { up: V3(1, 0, 0) }));
    }
  }
  return { pitch: 0.05, seatR: 0.24, footR: Rf, topY: back ? H + 0.36 : H };
}

// ----------------------------------------------------------------------------- chroom
// Chrome Ø25 tube frame, round faux-leather seat pad Ø36 with piping.
function stoolChrome(bins, H, color) {
  const key = String(color).toLowerCase();
  const leather = S.leatherMat(LEATHER[key] || M.resolveColor(color, '#1E1E20'));
  const chrome = M.chrome();
  const black = F.plastic('#141414', 0.55);
  const R = 0.18, h = 0.07;
  const yS = H - h;
  const cu = S.roundCushion(R, h, { r: 0.024, crown: 0.009, seed: 3 });
  bins.add(leather, cu.geo.translate(0, yS, 0));
  bins.add(leather, F.sweep(cu.welt(1, 0.0032).map((p) => p.setY(p.y + yS)), G.circleProfile(0.0032, 10), { closed: true }));
  // seat pan under the pad (black moulded) + chrome seat ring
  bins.add(black, G.lathe([[0.0001, 0], [R - 0.022, 0], [R - 0.018, 0.006], [R - 0.02, 0.012], [0.0001, 0.012]].reverse(), 96).translate(0, yS - 0.012, 0));
  const legR = 0.0125, yRing = yS - 0.03, rRing = 0.125;
  bins.add(chrome, F.ring(rRing, yRing, 0.011, { segs: 128 }));
  const bar = H > 0.6;
  const Rf = bar ? 0.3 : 0.24, rTop = rRing + 0.011 + legR - 0.002, yTop = yS - 0.014;
  const legAt = (u, y) => { const f = (y - 0.012) / (yTop - 0.012); return u.clone().multiplyScalar(Rf + (rTop - Rf) * f).setY(y); };
  for (const u of legDirs()) {
    const A = legAt(u, yTop), B = legAt(u, 0.012);
    // the leg's top is bent inwards under the seat pan and welded to the ring
    const C = A.clone().addScaledVector(u, -0.04).setY(yS - 0.016);
    bins.add(chrome, F.bentTube([B, A, C], legR, 0.03, { segs: 18 }));
    bins.add(black, G.lathe([[0.0001, 0.0], [legR + 0.0012, 0.0], [legR + 0.002, 0.004], [legR + 0.0014, 0.022], [0.0001, 0.022]].reverse(), 20).translate(B.x, 0, B.z));
  }
  const yF = bar ? 0.3 : 0.15;
  bins.add(chrome, F.ring(legAt(V3(1, 0, 0), yF).x + legR + 0.0095 - 0.002, yF, 0.0095, { segs: 160 }));
  return { pitch: 0.075, seatR: R, footR: Rf, topY: H + 0.009 };
}

export function barStool(p = {}) {
  const style = String(p.style || 'metaal').toLowerCase();
  if (style === 'vat' || style === 'wijnvat' || style === 'barrel') return barrelStool(p);
  if (style === 'klap' || style === 'inklapbaar' || style === 'folding') return foldingBarStool(p);
  let H = Number(p.height ?? (style === 'rotan' || style === 'velours' ? 0.75 : 0.76));
  if (H > 5) H /= 100;
  const color = p.color || 'zwart';
  const back = p.back ?? (style === 'rotan' || style === 'velours' || style === 'draad' || style === 'wire');
  const stack = Math.max(1, Math.round(Number(p.stack ?? 1)));
  const bins = new G.PartBin();
  const extra = []; // meshes outside the bins (vertex colours)
  let info;
  if (style === 'draad' || style === 'wire') info = stoolWire(bins, H, color, back);
  else if (style === 'hout' || style === 'wood') info = stoolWood(bins, H, p.frame || color);
  else if (style === 'rotan' || style === 'rattan') info = chairRattan(bins, H, color, back);
  else if (style === 'velours' || style === 'velvet') info = stoolVelvet(bins, H, color, back, p.frame || 'zwart', extra);
  else if (style === 'chroom' || style === 'chrome') info = stoolChrome(bins, H, color);
  else info = stoolMetal(bins, H, color);
  const one = new THREE.Group(); one.name = `barStool ${style}`;
  bins.build(one);
  for (const m of extra) one.add(m);
  const group = new THREE.Group(); group.name = `barStool ${style} ${color}${stack > 1 ? ' x' + stack : ''}`;
  const pitch = info.pitch || 0.06;
  for (let k = 0; k < stack; k++) {
    const g = k === 0 ? one : one.clone();
    g.position.y = k * pitch;
    group.add(g);
  }
  const topY = H + (stack - 1) * pitch;
  return {
    object: group,
    detail: { target: [Math.sin(34 * DEG) * info.seatR * 0.8, topY - 0.03, Math.cos(34 * DEG) * info.seatR * 0.8], size: 0.32, azimuth: 34, elevation: 22 },
    meta: { style, H, stack, color, pitch, footR: info.footR },
    // chrome only reads as chrome with something dark and something bright to mirror: the
    // studio environment (black flags, softboxes, scrim) instead of the grey room
    rig: (() => {
      const r = S.seatRig(group, style === 'chroom' || style === 'chrome' ? { default: { env: 'studio' } } : {});
      const c = String(color).toLowerCase();
      // white powder coat is exposed as white (the auto exposure would print it ~205 grey)
      if ((c === 'wit' || c === 'white') && style !== 'chroom' && style !== 'chrome' && style !== 'rotan' && style !== 'rattan') r.default.exposure = Math.max(r.default.exposure, 0.84);
      // velours: expose for the colour of the pile (rich, not washed out)
      if (style === 'velours' || style === 'velvet') r.default.exposure = Math.min(r.default.exposure, 0.92);
      return r;
    })(),
  };
}
