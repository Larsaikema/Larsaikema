// Barkruk / lage kruk.
//
// { style, height, color, back, stack, frame, seat }
//   style 'metaal'  stackable industrial steel stool (Tolix type): pressed round seat pan
//                   with a rolled skirt, four splayed legs of folded V-section sheet with
//                   hemmed edges, riveted to the skirt, flat-bar footrest ring on the outside
//                   of the legs, plastic glides. Nests in a stack (pitch 6 cm).
//         'draad'    wire stool: welded wire grid seat (two layers of 4 mm wire, dished) in a
//                   8 mm rim ring, support ring, four Ø20 tube legs, wire footrest ring.
//         'hout'     solid oak round seat (32 mm, rounded arrises) on a steel mounting plate,
//                   four splayed Ø22 tube legs, Ø18 tube footrest ring, glides.
//         'rotan'    outdoor bar chair: powder-coated aluminium frame, seat and curved back
//                   woven with flat PE wicker strands; front footrest + stretchers.
//         'velours'  upholstered bar stool: velvet seat cushion with piping, curved channel-
//                   tufted back, thin steel legs with footrest ring.
//         'chroom'   the same frame in polished chrome with a faux-leather (kunstleer) seat
//                   cushion with piping, no back by default; stackable.
//   height   seat height (m): 0.76 bar (default), 0.65 counter, 0.45 low stool.
//   color    seat / shell colour (frame colour for 'metaal', 'draad', 'hout').
//   back     backrest (default: true for 'rotan' and 'velours').
//   stack    n stools stacked (metaal / draad / velours).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const VELVET = { grijs: '#7B7E82', camel: '#B07E4C', groen: '#2D5641', marineblauw: '#172039', zwart: '#222224', antraciet: '#45484C', bordeaux: '#6A1F2A', roze: '#C98E98', zand: '#C8B596' };
const WICKER = { zwart: '#2B2927', bruin: '#5E4532', grijs: '#7E7C77', naturel: '#A88B62', wit: '#E4E0D6' };
const WICKER_FRAME = { zwart: '#1F1E1D', bruin: '#3A2C21', grijs: '#55575A', naturel: '#3A2C21', wit: '#D9D8D3' };

// faux leather (PU kunstleer): smooth, low sheen, fine grain, a little clear-coat gloss
const LEATHER = { zwart: '#1F1F21', wit: '#E9E7E1', antraciet: '#3C3F43', grijs: '#7A7D80', bruin: '#5A3E2B', cognac: '#8A5A33' };
const leatherCache = new Map();
function fauxLeather(color) {
  const hex = LEATHER[String(color).toLowerCase()] || M.resolveColor(color, '#1F1F21');
  if (leatherCache.has(hex)) return leatherCache.get(hex);
  const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.5, metalness: 0, specularIntensity: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.42, name: `faux leather ${hex}` });
  leatherCache.set(hex, m);
  return m;
}

const legDirs = () => [45, 135, 225, 315].map((a) => V3(Math.sin(a * DEG), 0, Math.cos(a * DEG)));

// ----------------------------------------------------------------------------- metaal
function stoolMetal(bins, H, color) {
  const mat = F.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const bar = H > 0.6;
  const R = bar ? 0.165 : 0.155;
  // seat pan (outer surface from the centre outwards, round-over, skirt, rolled hem, inner surface back)
  const t = 0.0015, rr = 0.008, sk = 0.034;
  const out = [[0.0001, 0.0015], [R * 0.6, 0.0008], [R - rr - 0.002, -0.0005]];
  for (let i = 0; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); out.push([R - rr + Math.cos(a) * rr, -0.0005 - rr + Math.sin(a) * rr]); }
  out.push([R + 0.0012, -sk * 0.55], [R + 0.0025, -sk + 0.002]);
  // rolled hem (outwards, 3 mm)
  for (let i = 0; i <= 6; i++) { const a = Math.PI - (Math.PI * i) / 6; out.push([R + 0.0025 + 0.0022 + Math.cos(a) * 0.0022, -sk + Math.sin(-Math.PI * i / 6) * 0.0022 - 0.0002]); }
  out.push([R + 0.0025 - t, -sk + 0.002], [R - t + 0.0012, -sk * 0.55], [R - t, -rr - 0.0005]);
  out.push([R - rr - 0.002, -0.0005 - t], [R * 0.6, 0.0008 - t], [0.0001, 0.0015 - t]);
  bins.add(mat, G.lathe(out.reverse(), 96).translate(0, H, 0));
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
      // two rivets through the flange into the skirt
      for (const yy of [H - 0.012, H - 0.026]) {
        const pr = apex(u, yy).addScaledVector(d, wf * 0.55);
        const n = u.clone().applyAxisAngle(V3(0, 1, 0), s * 45 * DEG);
        F.rivet(bins, mat, pr.addScaledVector(n, 0.0009), n, 0.0035);
      }
    }
    bins.add(mat, G.tube(A, B, 0.0016, 8)); // rounded apex
    // glide in the foot
    const g0 = apex(u, 0.0).addScaledVector(u, -0.012);
    bins.add(glide, G.lathe([[0.0001, 0.0], [0.012, 0.0], [0.0135, 0.004], [0.013, 0.02], [0.0001, 0.02]].reverse(), 24).translate(g0.x, 0, g0.z));
  });
  // footrest: four flat bars riveted on the outside of the legs
  for (let k = 0; k < 4; k++) {
    const a = apex(dirs[k], yRing), b = apex(dirs[(k + 1) % 4], yRing);
    const out1 = a.clone().add(b).setY(0).normalize();
    const e = b.clone().sub(a).normalize();
    bins.add(mat, G.flatBar(a.clone().addScaledVector(out1, 0.004).addScaledVector(e, -0.008), b.clone().addScaledVector(out1, 0.004).addScaledVector(e, 0.008), 0.024, 0.004, V3(0, 1, 0), 0.0015));
    F.rivet(bins, mat, a.clone().addScaledVector(out1, 0.0062).addScaledVector(e, 0.002), out1, 0.0035);
    F.rivet(bins, mat, b.clone().addScaledVector(out1, 0.0062).addScaledVector(e, -0.002), out1, 0.0035);
  }
  return { pitch: 0.06, seatR: R, footR: Rf };
}

// ----------------------------------------------------------------------------- draad
function stoolWire(bins, H, color) {
  const mat = F.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const Rs = 0.17, rim = 0.0045, w = 0.0022, dish = 0.012, sp = 0.026;
  const yRim = H - rim;
  bins.add(mat, F.ring(Rs, yRim, rim));
  const yd = (x, z) => yRim - 0.001 - dish * (1 - (x * x + z * z) / (Rs * Rs));
  // two crossing layers of straight wires, welded under/onto the rim
  for (let layer = 0; layer < 2; layer++) {
    for (let k = -6; k <= 6; k++) {
      const c = k * sp + (layer ? 0 : sp / 2);
      if (Math.abs(c) > Rs - 0.01) continue;
      const half = Math.sqrt(Rs * Rs - c * c) - 0.002;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const s = -half + (2 * half * i) / 12;
        const x = layer ? s : c, z = layer ? c : s;
        pts.push(V3(x, yd(x, z) + (layer ? w * 1.8 : 0), z));
      }
      bins.add(mat, F.sweep(pts, G.circleProfile(w, 8)));
    }
  }
  const yS = H - 0.032, rS = 0.135;
  bins.add(mat, F.ring(rS, yS, 0.0045));
  const Rf = H > 0.6 ? 0.275 : 0.22;
  const yRing = H > 0.6 ? 0.3 : 0.15;
  const legR = 0.0095;
  const legAt = (u, y) => { const f = (y - 0.012) / (yS + 0.01 - 0.012); return u.clone().multiplyScalar(Rf + (rS + 0.002 - Rf) * f).setY(y); };
  for (const u of legDirs()) {
    const A = legAt(u, H - 0.012), B = legAt(u, 0.012);
    bins.add(mat, G.tube(A, B, legR, 18));
    // short strut from the leg top to the rim
    bins.add(mat, G.tube(A, u.clone().multiplyScalar(Rs - 0.004).setY(yRim - 0.002), 0.004, 8));
    bins.add(glide, G.lathe([[0.0001, 0.0], [legR + 0.001, 0.0], [legR + 0.0015, 0.003], [legR + 0.001, 0.016], [0.0001, 0.016]].reverse(), 20).translate(B.x, 0, B.z));
  }
  const rr = legAt(V3(1, 0, 0), yRing).x + legR + 0.004;
  bins.add(mat, F.ring(rr, yRing, 0.0055));
  bins.add(mat, F.ring(legAt(V3(1, 0, 0), 0.09).x + legR + 0.003, 0.09, 0.004));
  return { pitch: 0.07, seatR: Rs, footR: Rf };
}

// ----------------------------------------------------------------------------- hout
function stoolWood(bins, H, color, seat = 'eiken') {
  const mat = F.powder(color);
  const glide = F.plastic('#161616', 0.6);
  const woodMat = F.wood(seat === 'beuken' ? 'beuken' : 'eiken', { stain: seat === 'beuken' ? null : '#A9845B', seed: 11 });
  const Rs = 0.18, T = 0.032, r1 = 0.012, r2 = 0.006;
  const prof = [[0.0001, 0]];
  prof.push([Rs - r1, 0]);
  for (let i = 1; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); prof.push([Rs - r1 + Math.cos(a) * r1, -r1 + Math.sin(a) * r1]); }
  for (let i = 1; i <= 4; i++) { const a = -(Math.PI / 2) * (i / 4); prof.push([Rs - r2 + Math.cos(a) * r2, -T + r2 + Math.sin(a) * r2]); }
  prof.push([0.0001, -T]);
  const seatG = G.lathe(prof.reverse(), 96);
  // planar uv in metres (grain along x)
  const pos = seatG.attributes.position, uv = seatG.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) + 0.3, pos.getZ(i) + 0.11 + pos.getY(i) * 0.5);
  bins.add(woodMat, seatG.translate(0, H, 0));
  // mounting plate + screws
  const yP = H - T - 0.003;
  bins.add(mat, G.roundedBox(0.2, 0.004, 0.2, 0.004).rotateY(45 * DEG).translate(0, yP, 0));
  const Rf = H > 0.6 ? 0.255 : 0.215, rTop = 0.1, yTop = yP - 0.004;
  const yRing = H > 0.6 ? 0.29 : 0.15, legR = 0.011;
  const legAt = (u, y) => { const f = (y - 0.012) / (yTop - 0.012); return u.clone().multiplyScalar(Rf + (rTop - Rf) * f).setY(y); };
  for (const u of legDirs()) {
    const A = legAt(u, yTop), B = legAt(u, 0.012);
    bins.add(mat, G.tube(A, B, legR, 20));
    bins.add(mat, G.lathe([[0.0001, 0], [legR + 0.004, 0], [legR + 0.004, 0.006], [0.0001, 0.006]].reverse(), 20).translate(A.x, yTop - 0.006, A.z));
    bins.add(glide, G.lathe([[0.0001, 0.0], [legR + 0.001, 0.0], [legR + 0.0015, 0.003], [legR + 0.001, 0.016], [0.0001, 0.016]].reverse(), 20).translate(B.x, 0, B.z));
  }
  for (let k = 0; k < 4; k++) {
    const a = (45 + 90 * k) * DEG;
    F.rivet(bins, M.chrome(), V3(Math.sin(a) * 0.075, yP - 0.002, Math.cos(a) * 0.075), V3(0, -1, 0), 0.004);
  }
  bins.add(mat, F.ring(legAt(V3(1, 0, 0), yRing).x, yRing, 0.009));
  return { pitch: 0, seatR: Rs, footR: Rf };
}

// ----------------------------------------------------------------------------- rotan
// Outdoor wicker bar chair: aluminium frame fully wrapped in flat PE strands (legs, seat
// rim, footrest, back loop); seat and back panels woven over-under inside the rims.
function chairRattan(bins, H, color, back) {
  const key = String(color).toLowerCase();
  const hex = WICKER[key] || color;
  const weave = F.peRattan(hex), wrap = F.peRattanWrap(hex);
  const cap = M.steelPowder(WICKER_FRAME[key] || '#2A2A2A', { roughness: 0.45 });
  const W = 0.46, D = 0.44, rc = 0.07, rRim = 0.017;
  const ySeat = H - rRim;
  // seat rim + dished woven seat
  bins.add(wrap, F.sweep(F.rectPath(W - 2 * rRim, D - 2 * rRim, rc, ySeat, 10), G.circleProfile(rRim, 16), { closed: true }));
  bins.add(weave, F.cushion(W - 2 * rRim - 0.006, 0.018, D - 2 * rRim - 0.006, { r: 0.007, puff: -0.006, seg: [32, 4, 32] }).translate(0, ySeat + 0.001, 0));
  // legs (wrapped Ø29 tube), slightly splayed, aluminium foot caps
  const legR = 0.0145;
  const legs = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const A = V3(sx * (W / 2 - 0.055), ySeat, sz * (D / 2 - 0.055)), B = V3(sx * (W / 2 - 0.055) * 1.13, 0.02, sz * (D / 2 - 0.055) * 1.13);
    bins.add(wrap, G.tube(A, B, legR, 18));
    bins.add(cap, G.lathe([[0.0001, 0], [legR + 0.0012, 0], [legR + 0.0016, 0.004], [legR + 0.0012, 0.022], [0.0001, 0.022]].reverse(), 18).translate(B.x, 0, B.z));
    legs.push([A, B]);
  }
  const at = (i, y) => { const [A, B] = legs[i]; return B.clone().lerp(A, (y - B.y) / (A.y - B.y)); };
  const yF = H > 0.6 ? 0.27 : 0.14;
  for (let k = 0; k < 4; k++) bins.add(wrap, G.tube(at(k, yF), at((k + 1) % 4, yF), 0.011, 14));
  if (back) {
    const hw = 0.19, bh = 0.37, rf = 0.075, Rb = 0.5, rec = 10 * Math.PI / 180;
    const zR = -(D / 2 - rRim);
    const top = ySeat + bh;
    const toW = (x, y) => V3(x, y, zR + (Rb - Math.sqrt(Rb * Rb - x * x)) - (y - ySeat) * Math.tan(rec));
    // wrapped back loop (inverted U, rounded top corners), bent and reclined
    const loop2d = F.filletPath([V3(-hw, ySeat, 0), V3(-hw, top, 0), V3(hw, top, 0), V3(hw, ySeat, 0)], rf, 10);
    const dense = [];
    for (let i = 0; i < loop2d.length - 1; i++) { const a = loop2d[i], b = loop2d[i + 1]; const n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.02)); for (let k = 0; k < n; k++) dense.push(a.clone().lerp(b, k / n)); }
    dense.push(loop2d[loop2d.length - 1]);
    bins.add(wrap, F.sweep(dense.map((p) => toW(p.x, p.y)), G.circleProfile(0.015, 14)));
    // woven panel inside the loop, corners clipped to the loop's fillets
    const y0 = ySeat + 0.05, y1 = top - 0.012, x0 = hw - 0.012, cy = top - rf, cx = hw - rf, rin = rf - 0.012;
    const at2 = (u, v) => {
      let x = -x0 + 2 * x0 * u, y = y0 + (y1 - y0) * v;
      if (Math.abs(x) > cx && y > cy) { const dx = Math.abs(x) - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > rin) { x = Math.sign(x) * (cx + dx * rin / d); y = cy + dy * rin / d; } }
      return [x, y];
    };
    for (const side of [1, -1]) {
      const g = G.surface((u, v, o) => { const [x, y] = at2(u, v); o.copy(toW(x, y)).add(V3(0, 0, side * 0.006)); }, 36, 30, { flipNormals: side < 0 });
      const pos = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));
      bins.add(weave, g);
    }
  }
  return { pitch: 0, seatR: 0.25, footR: 0.3 };
}

// ----------------------------------------------------------------------------- velours
function stoolVelvet(bins, H, color, back, frameColor = 'zwart', opts = {}) {
  const key = String(color).toLowerCase();
  const vel = opts.seatMat || F.velvet(VELVET[key] || color);
  const frame = opts.frameMat || F.powder(frameColor);
  const glide = F.plastic('#161616', 0.6);
  const W = 0.44, D = 0.42, T = 0.075;
  const seat = F.cushion(W, T, D, { r: 0.028, puff: 0.012, puffBottom: 0.0, seg: [26, 10, 26] });
  seat.translate(0, H - T / 2 - 0.006, 0);
  bins.add(vel, seat);
  // piping round the top edge
  bins.add(vel, F.sweep(F.pipingPath(W - 0.012, D - 0.012, 0.03, H - 0.022), G.circleProfile(0.0035, 8), { closed: true }));
  // base board + frame under the cushion
  const yB = H - T - 0.006;
  bins.add(frame, G.roundedBox(0.32, 0.018, 0.3, 0.004).translate(0, yB - 0.009, 0));
  const legR = 0.0095, Rf = 0.285, rTop = 0.19, yTop = yB - 0.018;
  const legAt = (u, y) => { const f = (y - 0.012) / (yTop - 0.012); return u.clone().multiplyScalar(Rf + (rTop - Rf) * f).setY(y); };
  for (const u of legDirs()) {
    const A = legAt(u, yTop), B = legAt(u, 0.012);
    bins.add(frame, G.tube(A, B, legR, 18));
    bins.add(glide, G.lathe([[0.0001, 0.0], [legR + 0.001, 0.0], [legR + 0.0015, 0.003], [legR + 0.001, 0.016], [0.0001, 0.016]].reverse(), 20).translate(B.x, 0, B.z));
  }
  const yF = H > 0.6 ? 0.28 : 0.15;
  // square footrest of round tube welded to the legs
  const corners = legDirs().map((u) => legAt(u, yF));
  for (let k = 0; k < 4; k++) bins.add(frame, G.tube(corners[k], corners[(k + 1) % 4], 0.0085, 14));
  if (back) {
    const bw = 0.43, bh = 0.3, bt = 0.06, Rb = 0.42;
    const panel = F.cushion(bw, bh, bt, { r: 0.024, puff: 0.012, puffBottom: 0, seg: [110, 22, 8] });
    const pp = panel.attributes.position;
    // channel tufting on the front face: 5 vertical grooves
    for (let i = 0; i < pp.count; i++) {
      let x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      if (z > 0) {
        let g = 0;
        for (let c = -2; c <= 2; c++) g = Math.max(g, Math.exp(-(((x - c * 0.075) / 0.007) ** 2)));
        const fadeY = 1 - Math.pow(Math.abs(y) / (bh / 2), 6);
        z -= 0.009 * g * Math.max(0, fadeY) * Math.min(1, z / (bt / 2));
      }
      const a = x / Rb, rad = Rb - z;
      pp.setXYZ(i, Math.sin(a) * rad, y, Rb - Math.cos(a) * rad - Rb + Rb);
    }
    panel.computeVertexNormals();
    // the bending above put the panel's centre at z = 0 with the front towards +z
    const tilt = -12 * DEG;
    panel.rotateX(tilt);
    panel.translate(0, H + 0.05 + bh / 2, -D / 2 + 0.02);
    bins.add(vel, panel);
    // two flat steel back supports from the seat frame up behind the back
    for (const s of [-1, 1]) {
      const a = V3(s * 0.11, yB - 0.01, -0.13), b = V3(s * 0.11, H + 0.02, -D / 2 - 0.02), c = V3(s * 0.11, H + 0.13, -D / 2 - 0.035);
      bins.add(frame, F.sweep(F.filletPath([a, b, c], 0.04), G.roundedRectProfile(0.03, 0.006, 0.002, 2), { up: V3(1, 0, 0) }));
    }
  }
  return { pitch: 0.05, seatR: 0.24, footR: Rf };
}

export function barStool(p = {}) {
  const style = String(p.style || 'metaal').toLowerCase();
  let H = Number(p.height ?? (style === 'rotan' || style === 'velours' ? 0.75 : 0.76));
  if (H > 5) H /= 100;
  const color = p.color || 'zwart';
  const back = p.back ?? (style === 'rotan' || style === 'velours');
  const stack = Math.max(1, Math.round(Number(p.stack ?? 1)));
  const bins = new G.PartBin();
  let info;
  if (style === 'draad' || style === 'wire') info = stoolWire(bins, H, color);
  else if (style === 'hout' || style === 'wood') info = stoolWood(bins, H, p.frame || color, p.seat);
  else if (style === 'rotan' || style === 'rattan') info = chairRattan(bins, H, color, back);
  else if (style === 'velours' || style === 'velvet') info = stoolVelvet(bins, H, color, back, p.frame || 'zwart');
  else if (style === 'chroom' || style === 'chrome') info = stoolVelvet(bins, H, color, back, 'zwart', { seatMat: fauxLeather(color), frameMat: M.chrome() });
  else info = stoolMetal(bins, H, color);
  const one = new THREE.Group(); one.name = `barStool ${style}`;
  bins.build(one);
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
    meta: { style, H, stack, color },
  };
}
