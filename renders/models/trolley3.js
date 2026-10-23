// Transportkarren, round 5 (furniture group). Called from trolley.js for the kinds below.
//
//   'marktkraam'  cart for 6 market stalls of 2 m (ca. 215 x 110 x 125 cm, galvanised steel): a tube base
//                 on four Ø160 swivel castors (two with brake), a slatted deck, tall U end frames (push grip
//                 on one) with two cross bars, and three stakes per side linked by a top rail. `loaded`
//                 stalls (0-6): the werkbladen (workBoard.js, antislip multiplex 200 x 100) stacked flat on
//                 the deck, the frame tubes (25 mm square, dark grey powder coat as marketStall.js) in two
//                 strapped bundles along the sides, and the folded PVC roof covers (`canopyColor`, default
//                 rood) in two stacks in the middle lane.
//   'steekwagen' / 'universeel': see sackTruck() / universalCart() below.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import { castors4, endFrame, frameMat, sq } from './trolley.js';
const DEG = Math.PI / 180;
import { workBoard } from './workBoard.js';
import { rng } from '../js/rng.js';

const { V3 } = G;

// a folded PVC roof cover: layers of cloth (each fold ~1.2 cm) with soft rounded edges, the folds a
// little uneven, one long side showing the rolled fold
function canopyPack(bins, mat, { x, y, z, w, d, layers, R }) {
  let yy = y;
  for (let i = 0; i < layers; i++) {
    const t = 0.011 + 0.002 * R();
    const g = F.cushion(w + (R() - 0.5) * 0.02, t, d + (R() - 0.5) * 0.016, { r: Math.min(0.0055, t * 0.48), puff: 0.0012, seg: [12, 3, 10] });
    g.rotateY((R() - 0.5) * 0.02);
    bins.add(mat, g.translate(x + (R() - 0.5) * 0.012, yy + t / 2, z + (R() - 0.5) * 0.01));
    yy += t * 0.94;
  }
  // the folded edge along the front: a soft roll over the layer ends
  const h = yy - y;
  bins.add(mat, G.tube(V3(x - w / 2 + 0.02, y + h / 2, z + d / 2 - 0.004), V3(x + w / 2 - 0.02, y + h / 2, z + d / 2 - 0.004), h / 2 * 0.98, 16));
  return yy;
}
// a bundle of square tubes lying along x, `cols` wide, rows stacked; two straps round it
function tubeBundle(bins, mats, { x0, x1, y, z, count, cols, s = 0.025, R }) {
  let k = 0, row = 0, ytop = y;
  while (k < count) {
    const n = Math.min(cols, count - k);
    for (let c = 0; c < n; c++) {
      const zz = z + (c - (n - 1) / 2) * (s + 0.0015);
      const yc = y + row * (s + 0.001) + s / 2;
      const dx0 = (R() - 0.5) * 0.03, dx1 = (R() - 0.5) * 0.03;
      bins.add(mats.tube, G.prism(G.roundedRectProfile(s, s, 0.003, 2), V3(x0 + dx0, yc, zz), V3(x1 + dx1, yc, zz), { side: V3(0, 1, 0) }));
      ytop = Math.max(ytop, yc + s / 2);
    }
    k += n; row++;
  }
  const hw = (Math.min(cols, count) * (s + 0.0015)) / 2 + 0.002;
  for (const xs of [x0 + (x1 - x0) * 0.22, x0 + (x1 - x0) * 0.78]) {
    const pts = [V3(xs, y - 0.001, z - hw), V3(xs, ytop + 0.001, z - hw), V3(xs, ytop + 0.001, z + hw), V3(xs, y - 0.001, z + hw)];
    bins.add(mats.strap, F.sweep(F.filletPath([...pts, pts[0]], 0.006), G.roundedRectProfile(0.0016, 0.025, 0.0006, 2), { closed: true, up: V3(1, 0, 0) }));
  }
  return ytop;
}

export function marketCart(bins, group, p) {
  const n = Math.max(0, Math.min(6, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'galv');
  const L = 2.15, W = 1.1, R = 0.08, yM = F.castorHeight(R);
  const yb = yM + 0.045;                      // base rail centre
  castors4(bins, [-L / 2 + 0.16, L / 2 - 0.16], [-W / 2 + 0.11, W / 2 - 0.11], yM, { R });
  // base: two long rails 60 x 40, seven cross members, castor plates sit under the rails
  for (const s of [-1, 1]) bins.add(mat, G.prism(sq(0.06, 0.04), V3(-L / 2, yb, s * (W / 2 - 0.03)), V3(L / 2, yb, s * (W / 2 - 0.03)), { side: V3(0, 1, 0) }));
  for (let i = 0; i <= 6; i++) {
    const x = -L / 2 + 0.03 + ((L - 0.06) * i) / 6;
    bins.add(mat, G.prism(sq(0.04), V3(x, yb, -W / 2 + 0.06), V3(x, yb, W / 2 - 0.06), { side: V3(0, 1, 0) }));
  }
  // slatted deck: 30 x 20 slats along the cart on the cross members
  const ySl = yb + 0.02 + 0.01;
  for (let i = 0; i < 8; i++) {
    const z = -W / 2 + 0.07 + ((W - 0.14) * i) / 7;
    bins.add(mat, G.prism(sq(0.03, 0.02), V3(-L / 2 + 0.05, ySl, z), V3(L / 2 - 0.05, ySl, z), { side: V3(0, 1, 0) }));
  }
  const deck = ySl + 0.01;
  // tall U end frames (Ø27), push grip on the -x end, two cross bars each
  const yT = 1.25;
  for (const s of [-1, 1]) {
    const x = s * (L / 2 - 0.02);
    endFrame(bins, mat, x, W / 2 - 0.03, yb, yT, 0.0135, s < 0);
    for (const y of [deck + 0.3, deck + 0.68]) bins.add(mat, G.tube(V3(x, y, -(W / 2 - 0.03)), V3(x, y, W / 2 - 0.03), 0.0105, 14));
  }
  // side stakes (rongen) with a top rail: keep the long tubes and boards on the cart
  const yS = deck + 0.62;
  for (const s of [-1, 1]) {
    const z = s * (W / 2 - 0.03);
    for (const x of [-0.62, 0, 0.62]) bins.add(mat, G.prism(sq(0.03), V3(x, yb, z), V3(x, yS, z), { side: V3(1, 0, 0) }));
    bins.add(mat, G.tube(V3(-L / 2 + 0.02, yS, z), V3(L / 2 - 0.02, yS, z), 0.0105, 14));
  }
  // brake labels / castor plates are in castors4; a galvanised kick plate on the brake end
  if (n) {
    const Rr = rng(77);
    // werkbladen flat on the deck
    const board = workBoard({ w: 2.0, d: 1.0, finish: 'multiplex-antislip', frameNear: false }).object;
    let y = deck;
    for (let i = 0; i < n; i++) {
      const b = i === 0 ? board : board.clone();
      b.position.set((Rr() - 0.5) * 0.012, y, (Rr() - 0.5) * 0.01);
      group.add(b); y += 0.0185;
    }
    // frame tubes (4 posts + 3 beams per stall, ~2.05 m) in two strapped bundles along the sides
    const tubes = { tube: M.steelPowder('#3A3D41', { roughness: 0.45 }), strap: F.beltWebbing('zwart') };
    const per = Math.ceil((7 * n) / 2);
    for (const s of [-1, 1]) tubeBundle(bins, tubes, { x0: -0.99, x1: 0.99, y, z: s * 0.38, count: s < 0 ? per : 7 * n - per, cols: 6, R: Rr });
    // the rafters (6 per stall, ~0.7 m) in a short bundle across the middle, between the cover stacks
    tubeBundle(bins, tubes, { x0: -0.36, x1: 0.36, y, z: 0, count: 6 * n, cols: 9, R: Rr });
    // folded roof covers in two stacks either side of the rafter bundle
    const cloth = M.pvcCloth ? M.pvcCloth(p.canopyColor || 'rood', { translucent: false }) : M.tentFabric(p.canopyColor || 'rood', { translucent: false });
    const kA = Math.ceil(n / 2), kB = n - kA;
    let ya = y, yb2 = y;
    for (let i = 0; i < kA; i++) ya = canopyPack(bins, cloth, { x: -0.66, y: ya, z: 0, w: 0.52, d: 0.46, layers: 5, R: Rr }) + 0.001;
    for (let i = 0; i < kB; i++) yb2 = canopyPack(bins, cloth, { x: 0.66, y: yb2, z: 0, w: 0.52, d: 0.46, layers: 5, R: Rr }) + 0.001;
  }
  return { L, W, H: yT, detailTarget: [L / 2 - 0.16, R, W / 2 - 0.11], view: { hero: { elevation: n ? 26 : 22 } } };
}

// ------------------------------------------------------------------ steekwagen voor stapelstoelen
//   'steekwagen'  hand truck for one stack of ~12 stacking chairs: black powder-coated Ø25 frame (two
//                 uprights bending back into a closed handle loop at ~125 cm, three cross bars), a 40 x 30
//                 steel scoop (schep) at the foot, two pneumatic wheels Ø 26 cm on an axle behind the
//                 frame. Shown standing on scoop and wheels. `loaded`: a stack of metal chairs (chair.js
//                 `chairStyle` metaal, `chairColor`) on the scoop, backs against the frame.
export function sackTruck(bins, group, p, { chair }) {
  const n = Math.max(0, Math.min(14, Math.round(Number(p.loaded ?? 0))));
  const mat = F.powder(p.frame || 'zwart');
  const tyre = M.rubber('#1E1F21'), hub = F.plastic('#9A9C9E', 0.45), steel = M.galvanised();
  const W = 0.52, Hh = 1.25, r = 0.0125;
  const lean = 6 * DEG; // the frame leans back a little when it stands on scoop + wheels
  const zAt = (y) => -Math.tan(lean) * y;
  // uprights: from the scoop up, bending back at the top into the handle loop
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.02);
    const pts = [V3(x, 0.02, 0.0), V3(x, Hh - 0.12, zAt(Hh - 0.12)), V3(x * 0.92, Hh - 0.02, zAt(Hh - 0.12) - 0.09)];
    bins.add(mat, F.sweep(F.filletPath(pts, 0.08), G.circleProfile(r, 18)));
  }
  // handle loop across the top, with grips
  const yH = Hh - 0.02, zH = zAt(Hh - 0.12) - 0.09;
  bins.add(mat, G.tube(V3(-(W / 2 - 0.02) * 0.92, yH, zH), V3((W / 2 - 0.02) * 0.92, yH, zH), r, 18));
  for (const s of [-1, 1]) bins.add(F.plastic('#151515', 0.7), G.tube(V3(s * 0.08, yH, zH), V3(s * 0.2, yH, zH), r + 0.004, 18));
  for (const y of [0.32, 0.62, 0.92]) bins.add(mat, G.tube(V3(-(W / 2 - 0.02), y, zAt(y)), V3(W / 2 - 0.02, y, zAt(y)), r * 0.8, 14));
  // scoop: steel plate with a bent-up back flange welded to the uprights. Round 7: 50 x 48 cm, the footprint of a
  // stacking chair (feet at +-24 cm), so the loaded stack stands ON the scoop with all four feet; at 40 x 30 the
  // stack stood on the floor straddling it (art direction 22 oct)
  const SW = 0.52, SD = 0.5;
  bins.add(mat, G.roundedBox(SW, 0.006, SD, 0.002).translate(0, 0.003, SD / 2));
  bins.add(mat, G.roundedBox(SW + 0.02, 0.05, 0.006, 0.002).translate(0, 0.028, 0.0));
  // a turned-down front lip (stiffens the plate, lets it slide under a stack)
  bins.add(mat, G.roundedBox(SW, 0.012, 0.006, 0.002).rotateX(-0.5).translate(0, 0.004, SD - 0.001));
  // axle bracket and two pneumatic wheels behind the frame
  const R = 0.13, yA = R, zW = -0.13;
  for (const s of [-1, 1]) bins.add(mat, G.flatBar(V3(s * (W / 2 - 0.02), 0.2, zAt(0.2)), V3(s * (W / 2 - 0.02), yA, zW), 0.03, 0.006, V3(1, 0, 0)));
  bins.add(steel, G.tube(V3(-(W / 2 + 0.07), yA, zW), V3(W / 2 + 0.07, yA, zW), 0.009, 14));
  for (const s of [-1, 1]) {
    const x = s * (W / 2 + 0.035), tw = 0.075;
    const tyreG = new THREE.TorusGeometry(R - 0.036, 0.036, 16, 64).rotateY(Math.PI / 2).scale(tw / 0.072, 1, 1).translate(x, yA, zW);
    bins.add(tyre, tyreG);
    bins.add(hub, F.latheAt([[0.0001, -0.03], [0.07, -0.03], [0.075, -0.02], [0.075, 0.02], [0.07, 0.03], [0.0001, 0.03]], V3(x, yA, zW), V3(1, 0, 0), 40));
    bins.add(steel, F.latheAt([[0.0001, -0.036], [0.02, -0.036], [0.02, 0.036], [0.0001, 0.036]], V3(x, yA, zW), V3(1, 0, 0), 20));
  }
  if (n) {
    const proto = chair({ style: p.chairStyle || 'metaal', color: p.chairColor || 'zwart' }).object;
    const pitch = 0.055;
    for (let i = 0; i < n; i++) {
      const c = i === 0 ? proto : proto.clone();
      // backs against the frame (chair front +z away from it), on the scoop
      c.position.set(0, 0.006 + i * pitch, 0.25);
      group.add(c);
    }
  }
  return { L: W, W: 0.5, H: Hh, detailTarget: [W / 2 + 0.03, R, zW], view: { hero: { azimuth: n ? 38 : 40 } } };
}

// ------------------------------------------------------------------ universele transportkar
//   'universeel'  galvanised plateau on four Ø125 castors (two with brake) with a push bar; per stack two
//                 adjustable hoops (beugels, ~155 cm, sliding in floor rails, a ratchet strap hanging from
//                 one). `stacks` 1 (60 x 60) | 2 (120 x 60). `loaded: 'mixed'` (2 stacks): a stack of
//                 metal stacking chairs and a stack of metal bar stools, the hoops slid against them and
//                 strapped.
export function universalCart(bins, group, p, { chair, barStool }) {
  const stacks = Number(p.stacks ?? 1) >= 2 ? 2 : 1;
  const loaded = p.loaded && p.loaded !== 0 && p.loaded !== '0';
  const mat = M.galvanised();
  const L = 0.6 * stacks, Wd = 0.6, R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.03;
  castors4(bins, [-L / 2 + 0.07, L / 2 - 0.07], [-Wd / 2 + 0.07, Wd / 2 - 0.07], yM, { R });
  // plateau: chequer-plate deck on a box-section frame
  bins.add(mat, G.prism(sq(0.04, 0.03), V3(-L / 2 + 0.02, yd - 0.015, -Wd / 2 + 0.02), V3(L / 2 - 0.02, yd - 0.015, -Wd / 2 + 0.02), { side: V3(0, 1, 0) }));
  bins.add(mat, G.prism(sq(0.04, 0.03), V3(-L / 2 + 0.02, yd - 0.015, Wd / 2 - 0.02), V3(L / 2 - 0.02, yd - 0.015, Wd / 2 - 0.02), { side: V3(0, 1, 0) }));
  for (const x of [-L / 2 + 0.02, L / 2 - 0.02, ...(stacks === 2 ? [0] : [])]) bins.add(mat, G.prism(sq(0.04, 0.03), V3(x, yd - 0.015, -Wd / 2 + 0.02), V3(x, yd - 0.015, Wd / 2 - 0.02), { side: V3(0, 1, 0) }));
  bins.add(mat, G.roundedBox(L, 0.004, Wd, 0.002).translate(0, yd + 0.002, 0));
  const yTop = yd + 0.004;
  // push bar at -x (round 6: it stood beside the deck with its legs ending in mid-air): the U handle stands in
  // two square sockets welded on the deck's end member, with a locking bolt through each socket
  const xh = -L / 2 + 0.03, zh = Wd / 2 - 0.06;
  endFrame(bins, F.powder('zwart'), xh, zh, yTop + 0.012, yTop + 0.95, 0.0125, true);
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(0.036), V3(xh, yTop, s * zh), V3(xh, yTop + 0.13, s * zh), { side: V3(1, 0, 0) }));
    bins.add(mat, G.roundedBox(0.06, 0.006, 0.06, 0.002).translate(xh, yTop + 0.003, s * zh));
    bins.add(M.chrome(), G.tube(V3(xh, yTop + 0.09, s * zh - 0.026), V3(xh, yTop + 0.09, s * zh + 0.026), 0.0045, 10));
    for (const e of [-1, 1]) bins.add(M.chrome(), G.lathe([[0.0001, 0], [0.0075, 0], [0.0075, 0.004], [0.0001, 0.005]], 6).rotateX(e * Math.PI / 2).translate(xh, yTop + 0.09, s * zh + e * 0.026));
  }
  // hoops: per stack two inverted U frames across x, sliding in two floor rails along z
  const hoopH = 1.55;
  const mats2 = { hoop: F.powder('zwart'), rail: mat, strap: F.beltWebbing('zwart'), buckle: M.chrome() };
  const items = [];
  for (let k = 0; k < stacks; k++) {
    const xc = stacks === 1 ? 0.03 : (k === 0 ? -0.3 : 0.3) + 0.015;
    // the floor rails the hoops slide in
    for (const xr of [xc - 0.2, xc + 0.2]) bins.add(mats2.rail, G.prism(sq(0.03, 0.02), V3(xr, yTop + 0.01, -Wd / 2 + 0.03), V3(xr, yTop + 0.01, Wd / 2 - 0.03), { side: V3(0, 1, 0) }));
    const zIn = loaded ? 0.266 : 0.285; // slid in against the stack (chair feet reach ±0.25)
    for (const zs of [-1, 1]) {
      const z = zs * zIn;
      const pts = [V3(xc - 0.2, yTop + 0.02, z), V3(xc - 0.2, yTop + hoopH, z), V3(xc + 0.2, yTop + hoopH, z), V3(xc + 0.2, yTop + 0.02, z)];
      bins.add(mats2.hoop, F.sweep(F.filletPath(pts, 0.06), G.circleProfile(0.0125, 16)));
      for (const xr of [xc - 0.2, xc + 0.2]) bins.add(mats2.hoop, G.roundedBox(0.05, 0.03, 0.05, 0.004).translate(xr, yTop + 0.025, z));
      // adjuster knob
      bins.add(F.plastic('#151515', 0.6), F.latheAt([[0.0001, 0], [0.016, 0], [0.018, 0.012], [0.0001, 0.016]], V3(xc + 0.2, yTop + 0.06, z + zs * 0.025), V3(0, 0, zs), 18));
    }
    items.push(xc);
    // the strap: buckled round the stack when loaded, else hanging from the back hoop
    if (loaded) {
      const y = yTop + 0.75, hw = 0.275;
      const loop = [V3(xc - hw, y, -zIn), V3(xc + hw, y, -zIn), V3(xc + hw, y, zIn), V3(xc - hw, y, zIn)];
      bins.add(mats2.strap, F.sweep(F.filletPath([...loop, loop[0]], 0.03), G.roundedRectProfile(0.0016, 0.035, 0.0006, 2), { closed: true, up: V3(0, 1, 0) }));
      bins.add(mats2.buckle, G.roundedBox(0.05, 0.045, 0.012, 0.004).translate(xc + 0.05, y, zIn + 0.006));
    } else {
      const pts = [V3(xc + 0.12, yTop + hoopH - 0.02, -0.285), V3(xc + 0.13, yTop + 1.1, -0.293), V3(xc + 0.12, yTop + 0.7, -0.287)];
      bins.add(mats2.strap, F.sweep(pts, G.roundedRectProfile(0.0016, 0.035, 0.0006, 2), { up: V3(0, 0, 1) }));
      bins.add(mats2.buckle, G.roundedBox(0.045, 0.05, 0.012, 0.004).translate(xc + 0.12, yTop + 0.68, -0.287));
    }
  }
  if (loaded) {
    // stack 1: metal stacking chairs, stack 2: metal bar stools
    const kinds = stacks === 2 ? ['stoel', 'kruk'] : ['stoel'];
    kinds.forEach((kind, k) => {
      const xc = items[k];
      if (kind === 'stoel') {
        const proto = chair({ style: 'metaal', color: p.chairColor || 'zwart' }).object;
        for (let i = 0; i < 12; i++) { const c = i === 0 ? proto : proto.clone(); c.rotation.y = Math.PI / 2; c.position.set(xc, yTop + i * 0.055, 0); group.add(c); }
      } else {
        const st = barStool({ style: 'metaal', color: p.stoolColor || 'zwart', stack: 8 }).object;
        st.position.set(xc, yTop, 0); group.add(st);
      }
    });
  }
  return { L, W: Wd, H: yTop + hoopH, detailTarget: [L / 2 - 0.07, R, Wd / 2 - 0.07], view: { hero: { azimuth: 34 } } };
}
