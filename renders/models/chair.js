// Stoelen.
//
// { style, color, frame }
//   style 'banquet'    stackable banquet chair: square steel tube frame (front legs, rear
//                      legs running on into raked back posts, side + rear stretchers),
//                      upholstered seat cushion with piping, upholstered back with an
//                      arched top that covers the back frame, stacking bumpers, glides.
//                      color = fabric, frame = powder coat (default zwart).
//         'klapstoel'  folding chair: Ø22 steel tube X-frame (front legs run up into the
//                      back posts, rear U-legs pivot under the seat front), blow-moulded
//                      HDPE seat and curved backrest, pivot rivets, feet caps.
//         'crossback'  stackable bistro chair in beech (stained `color`): square legs,
//                      rear legs bent back into posts, seat frame, solid seat, curved top
//                      rail and the two crossed back slats, stretchers.
//         'metaal'     stackable steel chair (Tolix A type): pressed seat pan with rolled
//                      skirt, V-section legs, rear legs running up to a curved back panel.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';

const { V3 } = G;
const DEG = Math.PI / 180;
// dyed polyester as it photographs: deep wine bordeaux, navy marineblauw, dark grey antraciet
const FABRIC = { zwart: '#202022', antraciet: '#35383C', bordeaux: '#4E121D', marineblauw: '#141C33', grijs: '#7A7D80', wit: '#E8E6E0', creme: '#E3D9C4' };

// thin rectangle (len along direction (dx,dy) from (ox,oy), thickness t): convex profile
function rectAlong(ox, oy, dx, dy, len, t) {
  const l = Math.hypot(dx, dy); dx /= l; dy /= l;
  const nx = -dy, ny = dx; // normal to the strip
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
  const fab = F.upholstery(FABRIC[String(color).toLowerCase()] || color);
  const frame = F.powder(frameColor);
  const glide = F.plastic('#151515', 0.6);
  const sq = G.roundedRectProfile(0.022, 0.022, 0.004, 3);
  const xs = 0.2, ySeat = 0.405, zF = 0.19, zB = -0.19;
  // front legs
  for (const s of [-1, 1]) {
    bins.add(frame, G.prism(sq, V3(s * xs, 0.012, zF + 0.01), V3(s * xs, ySeat, zF), { side: V3(1, 0, 0) }));
    glideAt(bins, glide, s * xs, zF + 0.01, 0.012);
  }
  // rear legs -> back posts (raked)
  const yTop = 0.9;
  for (const s of [-1, 1]) {
    const path = F.filletPath([V3(s * xs, 0.012, -0.235), V3(s * xs, ySeat, zB), V3(s * xs, yTop, zB - 0.075)], 0.06);
    bins.add(frame, F.sweep(path, sq, { up: V3(1, 0, 0) }));
    glideAt(bins, glide, s * xs, -0.235, 0.012);
    // stacking bumper on the post behind the seat
    bins.add(glide, G.roundedBox(0.012, 0.03, 0.016, 0.004).translate(s * (xs + 0.016), ySeat + 0.05, zB - 0.012));
  }
  // seat frame + stretchers
  const rail = (a, b) => bins.add(frame, G.prism(G.roundedRectProfile(0.02, 0.02, 0.004, 3), a, b, { side: V3(0, 1, 0) }));
  rail(V3(-xs, ySeat - 0.01, zF), V3(xs, ySeat - 0.01, zF));
  rail(V3(-xs, ySeat - 0.01, zB), V3(xs, ySeat - 0.01, zB));
  for (const s of [-1, 1]) { rail(V3(s * xs, ySeat - 0.01, zF), V3(s * xs, ySeat - 0.01, zB)); rail(V3(s * xs, 0.15, zF + 0.006), V3(s * xs, 0.15, -0.222)); }
  rail(V3(-xs, 0.15, -0.222), V3(xs, 0.15, -0.222));
  // seat cushion (on a board) with piping
  const W = 0.45, D = 0.44, T = 0.065;
  bins.add(fab, F.cushion(W, T, D, { r: 0.022, puff: 0.01, seg: [26, 10, 26] }).translate(0, ySeat + T / 2 + 0.004, 0.005));
  bins.add(fab, F.sweep(F.pipingPath(W - 0.004, D - 0.004, 0.024, ySeat + T - 0.008).map((p) => p.setZ(p.z + 0.005)), G.circleProfile(0.003, 8), { closed: true }));
  // upholstered back with arched top, covering the back frame
  const bw = 0.44, bh = 0.4, bt = 0.05;
  const back = F.cushion(bw, bh, bt, { r: 0.02, puff: 0.006, seg: [26, 22, 8] });
  const pp = back.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), y = pp.getY(i);
    if (y > 0) pp.setY(i, y + 0.03 * (1 - (2 * x / bw) ** 2) * (y / (bh / 2)));
  }
  back.computeVertexNormals();
  const rake = Math.atan2(0.075, yTop - ySeat);
  back.rotateX(-rake).translate(0, ySeat + 0.09 + bh / 2, zB - 0.035);
  bins.add(fab, back);
  return { seatY: ySeat + T, seatZ: 0 };
}

// -------------------------------------------------------------------------- klapstoel
function klapstoel(bins, color) {
  const key = String(color).toLowerCase();
  const plast = F.hdpeSmooth(key === 'zwart' ? '#232426' : key === 'wit' ? '#F0F0EC' : M.resolveColor(color));
  const frame = F.powder(key === 'zwart' ? 'zwart' : key === 'wit' ? 'wit' : 'grijs');
  const cap = F.plastic('#1A1A1A', 0.6);
  const r = 0.011;
  const xA = 0.215, xB = 0.193, ySeat = 0.445;
  const A0 = (s) => V3(s * xA, 0.008, 0.205), A1 = (s) => V3(s * xA, 0.835, -0.175);
  const zA = (y) => 0.205 + (-0.175 - 0.205) * (y - 0.008) / (0.835 - 0.008);
  for (const s of [-1, 1]) {
    bins.add(frame, G.tube(A0(s), A1(s), r, 18));
    bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0015, 0], [r + 0.002, 0.012], [0.0001, 0.012]].reverse(), 16).translate(A0(s).x, 0, A0(s).z));
    bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0012, 0], [r + 0.0012, 0.006], [0.0001, 0.009]].reverse(), 16).translate(0, 0, 0).applyMatrix4(F.basis(A1(s), V3(1, 0, 0), A1(s).clone().sub(A0(s)))));
  }
  // rear U-legs: from the rear feet up to the pivot under the seat front, joined at the top
  const B0 = (s) => V3(s * xB, 0.008, -0.235), B1 = (s) => V3(s * xB, ySeat - 0.03, 0.15);
  const uPath = F.filletPath([B0(-1), B1(-1), B1(1), B0(1)], 0.03);
  bins.add(frame, F.sweep(uPath, G.circleProfile(r * 0.92, 16)));
  for (const s of [-1, 1]) bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0012, 0], [r + 0.0018, 0.012], [0.0001, 0.012]].reverse(), 16).translate(B0(s).x, 0, B0(s).z));
  // lower stretchers
  bins.add(frame, G.tube(V3(-xB, 0.11, -0.235 + (0.15 + 0.235) * (0.11 / (ySeat - 0.038))), V3(xB, 0.11, -0.235 + (0.15 + 0.235) * (0.11 / (ySeat - 0.038))), r * 0.8, 14));
  bins.add(frame, G.tube(V3(-xA, 0.13, zA(0.13)), V3(xA, 0.13, zA(0.13)), r * 0.8, 14));
  // seat (moulded HDPE, dished, with a stiffening rim) on two side rails
  const W = 0.4, D = 0.385, T = 0.032;
  const seat = F.cushion(W, T, D, { r: 0.012, puff: -0.006, seg: [24, 6, 24] });
  bins.add(plast, seat.translate(0, ySeat + T / 2 - 0.004, 0.012));
  for (const s of [-1, 1]) {
    bins.add(frame, G.prism(G.roundedRectProfile(0.012, 0.024, 0.003, 2), V3(s * (W / 2 - 0.004), ySeat - 0.016, -0.17), V3(s * (W / 2 - 0.004), ySeat - 0.016, 0.19), { side: V3(1, 0, 0) }));
    // pivot rivets
    const pA = V3(s * (xA + r), ySeat - 0.012, zA(ySeat - 0.012));
    F.rivet(bins, M.chrome(), pA, V3(s, 0, 0), 0.006);
    F.rivet(bins, M.chrome(), V3(s * (xB + r * 0.92), ySeat - 0.03, 0.15), V3(s, 0, 0), 0.005);
  }
  // curved backrest between the posts
  const bw = 0.43, bh = 0.165, bt = 0.026, Rb = 0.42;
  const back = F.cushion(bw, bh, bt, { r: 0.01, puff: 0.002, seg: [28, 10, 6] });
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
  const stain = color && String(color).toLowerCase() !== 'naturel' ? (String(color).toLowerCase() === 'zwart' ? '#1C1A19' : color) : null;
  const wd = F.wood('beuken', { stain, seed: 21 });
  const glide = F.plastic('#151515', 0.6);
  const leg = G.roundedRectProfile(0.034, 0.034, 0.006, 3);
  const ySeat = 0.445, xs = 0.2, zF = 0.185, zB = -0.185;
  const legU = (g) => F.uvGrain(g, 'y');
  for (const s of [-1, 1]) {
    // front leg, slightly splayed
    bins.add(wd, F.sweep([V3(s * (xs + 0.008), 0.0, zF + 0.012), V3(s * xs, ySeat, zF)], leg, { up: V3(1, 0, 0) }));
    // rear leg running up into the back post with a bend at seat level
    const path = F.filletPath([V3(s * (xs - 0.004), 0.0, -0.225), V3(s * xs, ySeat - 0.02, zB), V3(s * (xs - 0.012), 0.885, -0.265)], 0.12, 10);
    bins.add(wd, F.sweep(path, G.roundedRectProfile(0.034, 0.032, 0.006, 3), { up: V3(1, 0, 0) }));
    glideAt(bins, glide, s * (xs + 0.008), zF + 0.012, 0.011);
    glideAt(bins, glide, s * (xs - 0.004), -0.225, 0.011);
  }
  // aprons
  const apron = (a, b, h = 0.055, t = 0.02) => bins.add(wd, G.prism(G.roundedRectProfile(t, h, 0.003, 2), a, b, { side: V3(0, 0, 1).cross(b.clone().sub(a).normalize()).lengthSq() > 0.1 ? V3(0, 1, 0).cross(b.clone().sub(a).normalize()) : V3(1, 0, 0) }));
  apron(V3(-xs, ySeat - 0.035, zF - 0.004), V3(xs, ySeat - 0.035, zF - 0.004));
  apron(V3(-xs, ySeat - 0.035, zB + 0.004), V3(xs, ySeat - 0.035, zB + 0.004));
  for (const s of [-1, 1]) apron(V3(s * (xs - 0.004), ySeat - 0.035, zF), V3(s * (xs - 0.004), ySeat - 0.035, zB));
  // stretchers (round)
  for (const s of [-1, 1]) bins.add(wd, G.tube(V3(s * (xs + 0.004), 0.17, zF + 0.006), V3(s * (xs - 0.003), 0.17, -0.212), 0.0095, 12));
  bins.add(wd, G.tube(V3(-xs - 0.005, 0.11, zF + 0.008), V3(xs + 0.005, 0.11, zF + 0.008), 0.0095, 12));
  bins.add(wd, G.tube(V3(-xs, 0.2, -0.213), V3(xs, 0.2, -0.213), 0.0095, 12));
  // solid seat with rounded edges, grain side to side
  const seat = F.cushion(0.44, 0.022, 0.43, { r: 0.008, puff: 0, seg: [24, 4, 24] });
  F.uvGrain(seat, 'x', { offset: 0.21 });
  bins.add(wd, seat.translate(0, ySeat + 0.011, 0.004));
  // back: curved top rail and the X, bowed backwards in the middle
  const zPost = (y) => -0.185 + (-0.265 + 0.185) * (y - (ySeat - 0.02)) / (0.885 - (ySeat - 0.02));
  const bow = (x) => 0.028 * (1 - (x / xs) ** 2);
  const railPath = []; for (let i = 0; i <= 16; i++) { const x = -xs + (2 * xs * i) / 16; railPath.push(V3(x, 0.835, zPost(0.835) - bow(x))); }
  bins.add(wd, F.sweep(railPath, G.roundedRectProfile(0.07, 0.02, 0.008, 3), { up: V3(0, 1, 0) }));
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18; const x = s * (-xs + 0.012 + (2 * xs - 0.024) * t); const y = 0.5 + (0.8 - 0.5) * t;
      pts.push(V3(x, y, zPost(y) - bow(x) + 0.001 * s));
    }
    bins.add(wd, F.sweep(pts, G.roundedRectProfile(0.036, 0.014, 0.005, 2), { up: V3(0, 0, -1) }));
  }
  bins.add(wd, F.sweep([-1, 1].flatMap(() => []).concat(Array.from({ length: 17 }, (_, i) => { const x = -xs + (2 * xs * i) / 16; return V3(x, 0.49, zPost(0.49) - bow(x) * 0.6); })), G.roundedRectProfile(0.03, 0.018, 0.006, 3), { up: V3(0, 1, 0) }));
  return { seatY: ySeat + 0.022, seatZ: 0 };
}

// -------------------------------------------------------------------------- metaal
function chairMetal(bins, color) {
  const mat = F.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const W = 0.4, D = 0.38, rc = 0.035, sk = 0.034, ySeat = 0.455;
  const path = F.pipingPath(W, D, rc, 0, 10);
  // top plate
  bins.add(mat, G.prism(G.roundedRectProfile(W - 0.004, D - 0.004, rc - 0.002, 8), V3(0, ySeat - 0.0015, 0), V3(0, ySeat, 0), { side: V3(1, 0, 0) }));
  bins.add(mat, F.sweep(path.map((p) => p.clone().setY(ySeat - 0.004)), G.circleProfile(0.004, 10), { closed: true }));
  bins.add(mat, F.sweep(path.map((p) => p.clone().setY(ySeat - 0.004 - sk / 2)), G.roundedRectProfile(sk, 0.0016, 0.0006, 2), { closed: true }));
  bins.add(mat, F.sweep(path.map((p) => p.clone().multiply(V3(1.004, 1, 1.004)).setY(ySeat - 0.004 - sk)), G.circleProfile(0.0024, 8), { closed: true }));
  // legs at the corners: V section, apex outwards (diagonal)
  const cx = W / 2 - 0.012, cz = D / 2 - 0.012;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const out = V3(sx, 0, sz).normalize();
    const top = V3(sx * cx, ySeat - 0.006, sz * cz).addScaledVector(out, 0.016);
    const foot = V3(sx * (cx + 0.05), 0.012, sz * (cz + 0.06));
    let pathL = [foot, top];
    if (sz < 0) {
      const backTop = V3(sx * (cx - 0.006), 0.84, -(cz + 0.07)).addScaledVector(out, 0.012);
      pathL = [foot, top, backTop];
    }
    vLeg(bins, mat, pathL, out, 0.026);
    glideAt(bins, glide, foot.x - out.x * 0.012, foot.z - out.z * 0.012, 0.011);
    for (const yy of [ySeat - 0.012, ySeat - 0.026]) F.rivet(bins, mat, top.clone().setY(yy).addScaledVector(out, -0.014), out, 0.0035);
  }
  // curved back panel between the rear posts, rolled top edge
  const bw = 0.38, bh = 0.2, Rb = 0.32;
  const yb0 = 0.62, yb1 = yb0 + bh;
  const zAt = (y) => -(cz + 0.016 * 0.707) + (-(cz + 0.07) + (cz + 0.016 * 0.707)) * (y - ySeat) / (0.84 - ySeat) - 0.008;
  const panel = G.surface((u, v, o) => {
    const x = (u - 0.5) * bw, y = yb0 + v * bh;
    o.set(Rb * Math.sin(x / Rb), y, zAt(y) - (Rb - Rb * Math.cos(x / Rb)) * -1 - 0.0);
  }, 40, 10);
  const back2 = panel.clone(); back2.translate(0, 0, -0.0015);
  // back face: flip winding
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
  if (style === 'klapstoel' || style === 'folding') info = klapstoel(bins, color);
  else if (style === 'crossback' || style === 'cross-back') info = crossback(bins, color);
  else if (style === 'metaal' || style === 'metal') info = chairMetal(bins, color);
  else info = banquet(bins, color, p.frame || 'zwart');
  const group = new THREE.Group(); group.name = `chair ${style} ${color}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [0.12, info.seatY - 0.02, 0.17], size: 0.36, azimuth: 34, elevation: 18 },
    meta: { style, color },
  };
}
