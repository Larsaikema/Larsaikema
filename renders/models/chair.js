// Stoelen.
//
// { style, color, frame }
//   style 'banquet'    stackable banquet chair: square steel tube frame (front legs, rear
//                      legs running on into raked back posts, side + rear stretchers), seat
//                      cushion (crowned, gathered corners, piping on the top seam) and a padded
//                      back with an arched top that fully encloses the back posts (piping on
//                      the front and rear seams), woven polyester, stacking bumpers, glides.
//                      color = fabric, frame = powder coat (default zwart).
//         'klapstoel'  folding chair: Ø22 steel tube X-frame (front legs run up into the
//                      back posts, rear U-legs pivot under the seat front), blow-moulded
//                      HDPE seat and curved backrest, pivot rivets, feet caps.
//         'crossback'  stackable bistro chair in lacquered beech (stained `color`): square
//                      legs, rear legs bent back into posts, aprons, solid seat, curved top
//                      rail and the two crossed back slats, stretchers; grain runs along
//                      every part.
//         'metaal'     stackable steel chair (Tolix A type): pressed seat pan with rolled
//                      skirt and drainage holes, V-section legs, rear legs running up to a
//                      curved back panel.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';
import { rng } from '../js/rng.js';
import { weddingChair, stretchCover } from './chairs2.js';

const { V3 } = G;
const DEG = Math.PI / 180;
// dyed polyester as it photographs: deep wine bordeaux, navy marineblauw, dark grey antraciet
const FABRIC = { zwart: '#29292B', antraciet: '#45484C', bordeaux: '#601B27', marineblauw: '#1F2539', grijs: '#7A7D80', wit: '#E8E6E0', creme: '#E3D9C4' };

// thin rectangle (len along direction (dx,dy) from (ox,oy), thickness t): convex profile
function rectAlong(ox, oy, dx, dy, len, t) {
  const l = Math.hypot(dx, dy); dx /= l; dy /= l;
  const nx = -dy, ny = dx;
  const P = [[0, -t / 2], [len, -t / 2], [len, t / 2], [0, t / 2]];
  const N = [[-dx - nx, -dy - ny], [dx - nx, dy - ny], [dx + nx, dy + ny], [-dx + nx, -dy + ny]];
  return P.map(([a, b], i) => { const nl = Math.hypot(...N[i]); return { x: ox + dx * a + nx * b, y: oy + dy * a + ny * b, nx: N[i][0] / nl, ny: N[i][1] / nl }; });
}
// V-section leg (two flanges at 90 deg, apex on the path, opening towards -out)
function vLeg(bins, mat, path, out, wf = 0.026, t = 0.0016) {
  const fp = F.filletPath(path, 0.05);
  for (const s of [-1, 1]) {
    const a = Math.PI + s * Math.PI / 4;
    bins.add(mat, F.sweep(fp, rectAlong(0, 0, Math.cos(a), Math.sin(a), wf, t), { up: out }));
    bins.add(mat, F.sweep(fp, G.circleProfile(0.0018, 8).map((q) => ({ ...q, x: q.x + Math.cos(a) * wf, y: q.y + Math.sin(a) * wf })), { up: out }));
  }
  bins.add(mat, F.sweep(fp, G.circleProfile(0.0016, 8), { up: out }));
}
const glideAt = (bins, mat, x, z, r = 0.012) => bins.add(mat, G.lathe([[0.0001, 0], [r, 0], [r + 0.001, 0.004], [r, 0.014], [0.0001, 0.014]].reverse(), 20).translate(x, 0, z));

// -------------------------------------------------------------------------- banquet
function banquet(bins, color, frameColor) {
  const key = String(color).toLowerCase();
  const fab = U.wovenFabric(FABRIC[key] || M.resolveColor(color, '#3A3D41'));
  const frame = U.powder(frameColor);
  const glide = F.plastic('#151515', 0.6);
  const sq = G.roundedRectProfile(0.022, 0.022, 0.004, 3);
  const xs = 0.2, ySeat = 0.405, zF = 0.19, zB = -0.19;
  // back cushion first (the posts are sized to end inside it)
  const bw = 0.44, bh = 0.41, bt = 0.052, arch = 0.03, rake = 9 * DEG;
  const yb0 = ySeat + 0.085; // lower edge of the back
  const yc = yb0 + (bh / 2) * Math.cos(rake);
  const zPost = (y) => zB - Math.tan(rake) * (y - ySeat);
  const yTop = yb0 + bh * Math.cos(rake) - 0.045; // post ends 4.5 cm below the back's top edge
  for (const s of [-1, 1]) {
    bins.add(frame, G.prism(sq, V3(s * xs, 0.012, zF + 0.01), V3(s * xs, ySeat, zF), { side: V3(1, 0, 0) }));
    glideAt(bins, glide, s * xs, zF + 0.01, 0.012);
    const path = F.filletPath([V3(s * xs, 0.012, -0.235), V3(s * xs, ySeat, zB), V3(s * xs, yTop, zPost(yTop))], 0.06);
    bins.add(frame, F.sweep(path, sq, { up: V3(1, 0, 0) }));
    glideAt(bins, glide, s * xs, -0.235, 0.012);
    bins.add(glide, G.roundedBox(0.012, 0.03, 0.016, 0.004).translate(s * (xs + 0.016), ySeat + 0.045, zB - 0.006));
  }
  const rail = (a, b) => bins.add(frame, G.prism(G.roundedRectProfile(0.02, 0.02, 0.004, 3), a, b, { side: V3(0, 1, 0) }));
  rail(V3(-xs, ySeat - 0.01, zF), V3(xs, ySeat - 0.01, zF));
  rail(V3(-xs, ySeat - 0.01, zB), V3(xs, ySeat - 0.01, zB));
  for (const s of [-1, 1]) { rail(V3(s * xs, ySeat - 0.01, zF), V3(s * xs, ySeat - 0.01, zB)); rail(V3(s * xs, 0.15, zF + 0.006), V3(s * xs, 0.15, -0.222)); }
  rail(V3(-xs, 0.15, -0.222), V3(xs, 0.15, -0.222));
  // seat: board + foam + fabric, crowned, corners gathered, piping on the top seam
  const W = 0.455, D = 0.445, T = 0.066;
  const seat = S.softBlock(W, T, D, { r: 0.024, crown: 0.014, belly: 0.005, gather: 0.0026, uneven: 0.0012, seed: 11, seg: [92, 14, 90] });
  // the cloth ripples a little along the piped seam (sewn welt pulls it in)
  U.puckerSeams(seat, { amp: 0.0016, pitch: 0.026, width: 0.016, sides: [1], seed: 11 });
  const sy = ySeat + T / 2 + 0.003, sz = 0.006;
  bins.add(fab, seat.translate(0, sy, sz));
  bins.add(fab, F.sweep(S.weltPath(seat.userData.shape, 1, { cr: 0.0032 }).map((p) => p.add(V3(0, sy, sz))), G.circleProfile(0.0032, 10), { closed: true }));
  // back: built lying flat (thickness along y, height along z, top edge at -z), arched,
  // piping on both faces' seams, then stood up (+y -> +z) and raked like the posts
  const back = S.softBlock(bw, bt, bh, { r: 0.018, crown: 0.008, crownBottom: 0.004, belly: 0.003, gather: 0.0012, uneven: 0.001, seed: 12, seg: [88, 10, 82] });
  U.puckerSeams(back, { amp: 0.0013, pitch: 0.025, width: 0.014, sides: [1, -1], seed: 12 });
  const archF = (p) => { const k = Math.max(0, 1 - (p.x / (bw / 2)) ** 2) * THREE.MathUtils.smoothstep(-p.z, 0, bh / 2); p.z -= arch * k; return p; };
  { const pp = back.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < pp.count; i++) { v.fromBufferAttribute(pp, i); archF(v); pp.setXYZ(i, v.x, v.y, v.z); } back.computeVertexNormals(); }
  // rotateX(+90deg) maps +y -> +z (front) and -z -> +y (top); then tilt back by the rake
  const rot = new THREE.Matrix4().makeRotationX(-rake).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  const toWorld = (p) => p.clone().applyMatrix4(rot).add(V3(0, yc, zPost(yc)));
  const bp = back.attributes.position, tv = new THREE.Vector3();
  for (let i = 0; i < bp.count; i++) { tv.fromBufferAttribute(bp, i); const w = toWorld(tv); bp.setXYZ(i, w.x, w.y, w.z); }
  back.computeVertexNormals();
  bins.add(fab, back);
  for (const side of [1, -1]) bins.add(fab, F.sweep(S.weltPath(back.userData.shape, side, { cr: 0.003 }).map((p) => toWorld(archF(p))), G.circleProfile(0.003, 10), { closed: true }));
  return { seatY: ySeat + T, seatZ: 0 };
}

// -------------------------------------------------------------------------- klapstoel
function klapstoel(bins, color) {
  const key = String(color).toLowerCase();
  const plast = F.hdpeSmooth(key === 'zwart' ? '#232426' : key === 'wit' ? '#F0F0EC' : M.resolveColor(color));
  const frame = U.powder(key === 'zwart' ? 'zwart' : key === 'wit' ? 'wit' : 'grijs');
  const cap = F.plastic('#1A1A1A', 0.6);
  const r = 0.011;
  const xA = 0.215, xB = 0.193, ySeat = 0.445;
  const A0 = (s) => V3(s * xA, 0.008, 0.205), A1 = (s) => V3(s * xA, 0.835, -0.175);
  const zA = (y) => 0.205 + (-0.175 - 0.205) * (y - 0.008) / (0.835 - 0.008);
  for (const s of [-1, 1]) {
    bins.add(frame, G.tube(A0(s), A1(s), r, 18));
    bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0015, 0], [r + 0.002, 0.012], [0.0001, 0.012]].reverse(), 16).translate(A0(s).x, 0, A0(s).z));
    bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0012, 0], [r + 0.0012, 0.006], [0.0001, 0.009]].reverse(), 16).applyMatrix4(F.basis(A1(s), V3(1, 0, 0), A1(s).clone().sub(A0(s)))));
  }
  const B0 = (s) => V3(s * xB, 0.008, -0.235), B1 = (s) => V3(s * xB, ySeat - 0.03, 0.15);
  const uPath = F.filletPath([B0(-1), B1(-1), B1(1), B0(1)], 0.03);
  bins.add(frame, F.sweep(uPath, G.circleProfile(r * 0.92, 16)));
  for (const s of [-1, 1]) bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0012, 0], [r + 0.0018, 0.012], [0.0001, 0.012]].reverse(), 16).translate(B0(s).x, 0, B0(s).z));
  bins.add(frame, G.tube(V3(-xB, 0.11, -0.235 + (0.15 + 0.235) * (0.11 / (ySeat - 0.038))), V3(xB, 0.11, -0.235 + (0.15 + 0.235) * (0.11 / (ySeat - 0.038))), r * 0.8, 14));
  bins.add(frame, G.tube(V3(-xA, 0.13, zA(0.13)), V3(xA, 0.13, zA(0.13)), r * 0.8, 14));
  const W = 0.4, D = 0.385, T = 0.032;
  const seat = S.softBlock(W, T, D, { r: 0.012, crown: -0.006, belly: 0, gather: 0, uneven: 0, seed: 3 });
  bins.add(plast, seat.translate(0, ySeat + T / 2 - 0.004, 0.012));
  for (const s of [-1, 1]) {
    bins.add(frame, G.prism(G.roundedRectProfile(0.012, 0.024, 0.003, 2), V3(s * (W / 2 - 0.004), ySeat - 0.016, -0.17), V3(s * (W / 2 - 0.004), ySeat - 0.016, 0.19), { side: V3(1, 0, 0) }));
    const pA = V3(s * (xA + r), ySeat - 0.012, zA(ySeat - 0.012));
    F.rivet(bins, M.chrome(), pA, V3(s, 0, 0), 0.006);
    F.rivet(bins, M.chrome(), V3(s * (xB + r * 0.92), ySeat - 0.03, 0.15), V3(s, 0, 0), 0.005);
  }
  const bw = 0.43, bh = 0.165, bt = 0.026, Rb = 0.42;
  const back = S.softBlock(bw, bh, bt, { r: 0.01, crown: 0, belly: 0.0015, gather: 0, uneven: 0, seg: [44, 16, 6], seed: 4 });
  const pp = back.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
    const a = x / Rb, rad = Rb - z;
    pp.setXYZ(i, Math.sin(a) * rad, y, Rb - Math.cos(a) * rad);
  }
  back.computeVertexNormals();
  const tilt = Math.atan2(0.38, 0.827);
  const yb = 0.835 - 0.025 - bh / 2;
  back.rotateX(-tilt).translate(0, yb, zA(yb) - 0.005);
  bins.add(plast, back);
  return { seatY: ySeat + T, seatZ: 0 };
}

// -------------------------------------------------------------------------- crossback
function crossback(bins, color) {
  const c = String(color || 'naturel').toLowerCase();
  const stain = c === 'naturel' || c === 'houtlook' ? '#9A7650' : c === 'zwart' ? '#141312' : M.resolveColor(color, '#8A6A48');
  const R = rng(21);
  const mats = [S.woodMat('beuken', { stain, seed: 21 }), S.woodMat('beuken', { stain, seed: 22 })];
  const wd = () => mats[Math.floor(R() * 2)];
  const part = (g) => S.uvJitter(S.swapUV(g), R, { du: 1.5, dv: 0.2 }); // grain along the part
  const glide = F.plastic('#151515', 0.6);
  const leg = G.roundedRectProfile(0.034, 0.034, 0.006, 3);
  const ySeat = 0.445, xs = 0.2, zF = 0.185, zB = -0.185;
  for (const s of [-1, 1]) {
    bins.add(wd(), part(F.sweep([V3(s * (xs + 0.008), 0.0, zF + 0.012), V3(s * xs, ySeat, zF)], leg, { up: V3(1, 0, 0) })));
    const path = F.filletPath([V3(s * (xs - 0.004), 0.0, -0.225), V3(s * xs, ySeat - 0.02, zB), V3(s * (xs - 0.012), 0.885, -0.265)], 0.12, 10);
    bins.add(wd(), part(F.sweep(path, G.roundedRectProfile(0.034, 0.032, 0.006, 3), { up: V3(1, 0, 0) })));
    glideAt(bins, glide, s * (xs + 0.008), zF + 0.012, 0.011);
    glideAt(bins, glide, s * (xs - 0.004), -0.225, 0.011);
  }
  const apron = (a, b, h = 0.055, t = 0.02) => {
    const dir = b.clone().sub(a).normalize();
    const side = Math.abs(dir.x) > 0.5 ? V3(0, 0, 1) : V3(1, 0, 0);
    bins.add(wd(), part(G.prism(G.roundedRectProfile(t, h, 0.003, 2), a, b, { side })));
  };
  apron(V3(-xs, ySeat - 0.035, zF - 0.004), V3(xs, ySeat - 0.035, zF - 0.004));
  apron(V3(-xs, ySeat - 0.035, zB + 0.004), V3(xs, ySeat - 0.035, zB + 0.004));
  for (const s of [-1, 1]) apron(V3(s * (xs - 0.004), ySeat - 0.035, zF), V3(s * (xs - 0.004), ySeat - 0.035, zB));
  for (const s of [-1, 1]) bins.add(wd(), part(G.tube(V3(s * (xs + 0.004), 0.17, zF + 0.006), V3(s * (xs - 0.003), 0.17, -0.212), 0.0095, 12)));
  bins.add(wd(), part(G.tube(V3(-xs - 0.005, 0.11, zF + 0.008), V3(xs + 0.005, 0.11, zF + 0.008), 0.0095, 12)));
  bins.add(wd(), part(G.tube(V3(-xs, 0.2, -0.213), V3(xs, 0.2, -0.213), 0.0095, 12)));
  // solid seat (two glued boards, grain side to side), rounded arrises
  const seat = S.softBlock(0.44, 0.022, 0.43, { r: 0.007, crown: 0, belly: 0, gather: 0, uneven: 0, seg: [44, 4, 44], seed: 5 });
  S.uvJitter(seat, R, { du: 0.5, dv: 0.1, flip: false });
  bins.add(mats[0], seat.translate(0, ySeat + 0.011, 0.004));
  const zPost = (y) => -0.185 + (-0.265 + 0.185) * (y - (ySeat - 0.02)) / (0.885 - (ySeat - 0.02));
  const bow = (x) => 0.028 * (1 - (x / xs) ** 2);
  const railPath = []; for (let i = 0; i <= 16; i++) { const x = -xs + (2 * xs * i) / 16; railPath.push(V3(x, 0.835, zPost(0.835) - bow(x))); }
  bins.add(wd(), part(F.sweep(railPath, G.roundedRectProfile(0.07, 0.02, 0.008, 3), { up: V3(0, 1, 0) })));
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18; const x = s * (-xs + 0.012 + (2 * xs - 0.024) * t); const y = 0.5 + (0.8 - 0.5) * t;
      pts.push(V3(x, y, zPost(y) - bow(x) + 0.001 * s));
    }
    bins.add(wd(), part(F.sweep(pts, G.roundedRectProfile(0.036, 0.014, 0.005, 2), { up: V3(0, 0, -1) })));
  }
  const low = Array.from({ length: 17 }, (_, i) => { const x = -xs + (2 * xs * i) / 16; return V3(x, 0.49, zPost(0.49) - bow(x) * 0.6); });
  bins.add(wd(), part(F.sweep(low, G.roundedRectProfile(0.03, 0.018, 0.006, 3), { up: V3(0, 1, 0) })));
  return { seatY: ySeat + 0.022, seatZ: 0 };
}

// -------------------------------------------------------------------------- metaal
function chairMetal(bins, color) {
  const mat = U.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const W = 0.4, D = 0.38, rc = 0.035, sk = 0.034, ySeat = 0.455;
  const path = F.pipingPath(W, D, rc, 0, 10);
  // top plate with drainage holes
  const plate = G.prism(G.roundedRectProfile(W - 0.004, D - 0.004, rc - 0.002, 8), V3(0, ySeat - 0.0015, 0), V3(0, ySeat, 0), { side: V3(1, 0, 0) });
  const sz = W + 0.02;
  { const p = plate.attributes.position, uv = plate.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / sz + 0.5, p.getZ(i) / sz + 0.5); }
  const holes = [[0, 0, 0.0035]];
  for (let k = 0; k < 6; k++) holes.push([Math.sin(k * 60 * DEG) * 0.05, Math.cos(k * 60 * DEG) * 0.05, 0.0035]);
  for (const [hx, hz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) holes.push([hx * 0.11, hz * 0.1, 0.0035]);
  bins.add(S.holedSheet(mat, holes, sz, 'chairA'), plate);
  bins.add(mat, F.sweep(path.map((p) => p.clone().setY(ySeat - 0.004)), G.circleProfile(0.004, 10), { closed: true }));
  bins.add(mat, F.sweep(path.map((p) => p.clone().setY(ySeat - 0.004 - sk / 2)), G.roundedRectProfile(sk, 0.0016, 0.0006, 2), { closed: true }));
  bins.add(mat, F.sweep(path.map((p) => p.clone().multiply(V3(1.004, 1, 1.004)).setY(ySeat - 0.004 - sk)), G.circleProfile(0.0024, 8), { closed: true }));
  const cx = W / 2 - 0.012, cz = D / 2 - 0.012;
  for (const [sx, sz2] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const out = V3(sx, 0, sz2).normalize();
    const top = V3(sx * cx, ySeat - 0.006, sz2 * cz).addScaledVector(out, 0.016);
    const foot = V3(sx * (cx + 0.05), 0.012, sz2 * (cz + 0.06));
    let pathL = [foot, top];
    if (sz2 < 0) pathL = [foot, top, V3(sx * (cx - 0.006), 0.84, -(cz + 0.07)).addScaledVector(out, 0.012)];
    vLeg(bins, mat, pathL, out, 0.026);
    glideAt(bins, glide, foot.x - out.x * 0.012, foot.z - out.z * 0.012, 0.011);
    for (const yy of [ySeat - 0.012, ySeat - 0.026]) F.rivet(bins, mat, top.clone().setY(yy).addScaledVector(out, -0.014), out, 0.0035);
  }
  const bw = 0.38, bh = 0.2, Rb = 0.32;
  const yb0 = 0.62, yb1 = yb0 + bh;
  const zAt = (y) => -(cz + 0.016 * 0.707) + (-(cz + 0.07) + (cz + 0.016 * 0.707)) * (y - ySeat) / (0.84 - ySeat) - 0.008;
  const panel = G.surface((u, v, o) => {
    const x = (u - 0.5) * bw, y = yb0 + v * bh;
    o.set(Rb * Math.sin(x / Rb), y, zAt(y) + (Rb - Rb * Math.cos(x / Rb)));
  }, 40, 10);
  const back2 = panel.clone(); back2.translate(0, 0, -0.0015);
  const idx = back2.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  back2.computeVertexNormals();
  bins.add(mat, panel); bins.add(mat, back2);
  const edge = (y) => Array.from({ length: 21 }, (_, i) => { const x = (i / 20 - 0.5) * bw; return V3(Rb * Math.sin(x / Rb), y, zAt(y) + (Rb - Rb * Math.cos(x / Rb))); });
  bins.add(mat, F.sweep(edge(yb1), G.circleProfile(0.005, 10)));
  bins.add(mat, F.sweep(edge(yb0), G.circleProfile(0.003, 8)));
  return { seatY: ySeat, seatZ: 0 };
}

export function chair(p = {}) {
  const style = String(p.style || 'banquet').toLowerCase();
  const color = p.color || 'zwart';
  const bins = new G.PartBin();
  let info;
  if (style === 'wedding' || style === 'weddingstoel') info = weddingChair(bins, color);
  else if (style === 'klapstoel' || style === 'folding') {
    if (p.cover) {
      // the cover goes on a white chair under pale lycra, a black one under dark lycra (the bare
      // low stretchers then match the cover)
      const L = new THREE.Color(M.resolveColor(p.coverColor || 'wit', '#F3F3F0')); const lum = 0.2126 * L.r + 0.7152 * L.g + 0.0722 * L.b;
      info = klapstoel(bins, p.color || (lum > 0.3 ? 'wit' : 'zwart'));
      stretchCover(bins, p.coverColor || 'wit');
    } else info = klapstoel(bins, color);
  }
  else if (style === 'crossback' || style === 'cross-back') info = crossback(bins, color);
  else if (style === 'metaal' || style === 'metal') info = chairMetal(bins, color);
  else info = banquet(bins, color, p.frame || 'zwart');
  const group = new THREE.Group(); group.name = `chair ${style} ${color}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [0.12, info.seatY - 0.02, 0.17], size: 0.36, azimuth: 34, elevation: 18 },
    meta: { style, color, cover: p.cover || null },
    rig: (() => {
      const r = S.seatRig(group);
      // dyed fabric (bordeaux, navy): expose for the colour, not for black, or it turns bright
      const c = String(color).toLowerCase();
      if (style === 'banquet' && c !== 'zwart' && c !== 'antraciet') r.default.exposure = Math.min(r.default.exposure, 0.9);
      // white powder coat / white HDPE: exposed as white (auto exposure would print it ~205 grey)
      if (c === 'wit' && (style === 'metaal' || style === 'metal' || style === 'klapstoel' || style === 'folding' || style === 'wedding')) r.default.exposure = Math.max(r.default.exposure, 0.84);
      // stretch covers: pale lycra exposed as the pale colour it is, dyed colours for the colour
      if (p.cover) {
        const cc = String(p.coverColor || 'wit').toLowerCase();
        const L = new THREE.Color(M.resolveColor(cc, '#F3F3F0')); const lum = 0.2126 * L.r + 0.7152 * L.g + 0.0722 * L.b;
        if (lum > 0.45) r.default.exposure = Math.max(r.default.exposure, 0.84);
        else if (cc !== 'zwart' && cc !== 'antraciet') r.default.exposure = Math.min(r.default.exposure, 0.95);
      }
      return r;
    })(),
  };
}
