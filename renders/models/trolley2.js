// Transportkarren, round 4 (furniture group). Called from trolley.js for the kinds below.
//
//   'klapstoel'  chair cart for folded chairs standing upright in two lanes (chairStyle 'klapstoel', 30 = 2 x 15,
//                or 'wedding', 26 = 2 x 13): plywood deck dolly on Ø125 castors, U end frames (push grip on
//                one), a centre divider frame and side rails at 0.5 / 0.85 m; `loaded` chairs, `chairColor`.
//   'afzetpaal'  cart for 16 afzetpalen (ca. 150 x 75 x 110 cm): a steel tray as deck ("de bak onderin") with a
//                rubber mat, two comb rails at 0.72 m with eight rubber-lined post slots each, U end frames with a
//                grip; shown empty.
//   'kapstok'    cart for folded rolling coat racks (2 m): long low deck (ca. 210 x 90), two tall U end frames
//                (1.6 m) joined by a ridge beam, side rails; shown empty.
//   'koelkast'   plateau dolly for a standing fridge (ca. 75 x 75, 150 kg): carpeted deck with rubber corner
//                stops and four lashing eyes, two ratchet straps lying on it, castors with brake.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { castors4, endFrame, frameMat, sq, deckDolly } from './trolley.js';
import { foldedChair } from './chairs2.js';

const { V3 } = G;
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ folded chairs in two lanes
export function chairCart(bins, group, p) {
  const wedding = String(p.chairStyle || '').toLowerCase().startsWith('wed');
  const cap = wedding ? 26 : 30, perLane = cap / 2;
  const n = Math.max(0, Math.min(cap, Math.round(Number(p.loaded ?? 0))));
  const mat = frameMat(p.frame, 'grijs');
  const { object: proto, pitch } = foldedChair(wedding ? 'wedding' : 'klapstoel', p.chairColor || 'wit');
  const laneW = 0.5;
  const L = perLane * pitch + 0.14, W = 2 * laneW + 0.08, R = 0.0625;
  const { yTop } = deckDolly(bins, mat, { L, W, R });
  const yT = yTop + 0.95;
  for (const s of [-1, 1]) {
    endFrame(bins, mat, s * (L / 2 - 0.02), W / 2 - 0.03, yTop, yT, 0.0125, s < 0);
    for (const y of [yTop + 0.42, yTop + 0.78]) bins.add(mat, G.tube(V3(-L / 2 + 0.02, y, s * (W / 2 - 0.03)), V3(L / 2 - 0.02, y, s * (W / 2 - 0.03)), 0.0105, 14));
    bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(s * (L / 2 - 0.02), yTop + 0.002, W / 2 - 0.03));
    bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(s * (L / 2 - 0.02), yTop + 0.002, -W / 2 + 0.03));
  }
  // centre divider: posts at the ends, rails along
  for (const s of [-1, 1]) bins.add(mat, G.prism(sq(0.03), V3(s * (L / 2 - 0.02), yTop, 0), V3(s * (L / 2 - 0.02), yTop + 0.8, 0), { side: V3(1, 0, 0) }));
  for (const y of [yTop + 0.42, yTop + 0.78]) bins.add(mat, G.tube(V3(-L / 2 + 0.02, y, 0), V3(L / 2 - 0.02, y, 0), 0.0105, 14));
  if (n) {
    let left = n, first = true;
    for (const zl of [laneW / 2 + 0.02, -(laneW / 2 + 0.02)]) {
      const k = Math.min(perLane, left); left -= k;
      for (let i = 0; i < k; i++) {
        const c = first ? proto : proto.clone(); first = false;
        const h = new THREE.Group(); h.add(c);
        h.rotation.y = Math.PI / 2; // the chair's thin direction (z) runs along the cart (x), seats towards +x
        h.position.set(-L / 2 + 0.07 + pitch * (i + 0.5) - pitch * 0.15, yTop, zl);
        group.add(h);
      }
    }
  }
  return { L, W, H: yT, detailTarget: [L / 2 - 0.08, R, W / 2 - 0.07], view: n ? { hero: { azimuth: 36 } } : undefined };
}

// ------------------------------------------------------------------ afzetpalen (16)
export function postCart(bins, group, p) {
  const mat = frameMat(p.frame, 'grijs');
  const L = 1.5, W = 0.75, R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.045;
  castors4(bins, [-L / 2 + 0.1, L / 2 - 0.1], [-W / 2 + 0.08, W / 2 - 0.08], yM, { R });
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(), V3(-L / 2, yd - 0.02, s * (W / 2 - 0.02)), V3(L / 2, yd - 0.02, s * (W / 2 - 0.02)), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(), V3(s * (L / 2 - 0.02), yd - 0.02, -W / 2 + 0.04), V3(s * (L / 2 - 0.02), yd - 0.02, W / 2 - 0.04), { side: V3(0, 1, 0) }));
  }
  for (const x of [-0.37, 0, 0.37]) bins.add(mat, G.prism(sq(0.03), V3(x, yd - 0.015, -W / 2 + 0.04), V3(x, yd - 0.015, W / 2 - 0.04), { side: V3(0, 1, 0) }));
  // the tray: floor plate + 9 cm folded rim, a ribbed rubber mat inside
  const yt = yd + 0.003;
  bins.add(mat, G.roundedBox(L - 0.02, 0.003, W - 0.02, 0.0012).translate(0, yt, 0));
  const rim = 0.09;
  for (const s of [-1, 1]) {
    bins.add(mat, G.roundedBox(L - 0.02, rim, 0.003, 0.0012).translate(0, yt + rim / 2, s * (W / 2 - 0.0115)));
    bins.add(mat, G.roundedBox(0.003, rim, W - 0.02, 0.0012).translate(s * (L / 2 - 0.0115), yt + rim / 2, 0));
    // rolled top edge of the rim
    bins.add(mat, G.tube(V3(-L / 2 + 0.01, yt + rim, s * (W / 2 - 0.0115)), V3(L / 2 - 0.01, yt + rim, s * (W / 2 - 0.0115)), 0.004, 10));
    bins.add(mat, G.tube(V3(s * (L / 2 - 0.0115), yt + rim, -W / 2 + 0.01), V3(s * (L / 2 - 0.0115), yt + rim, W / 2 - 0.01), 0.004, 10));
  }
  const rub = M.rubber('#232426');
  bins.add(rub, G.roundedBox(L - 0.05, 0.006, W - 0.05, 0.002).translate(0, yt + 0.0045, 0));
  for (let i = 0; i < 40; i++) bins.add(rub, G.roundedBox(0.008, 0.003, W - 0.07, 0.001).translate(-L / 2 + 0.05 + (i * (L - 0.1)) / 39, yt + 0.009, 0));
  // end frames with a grip, comb rails at 0.72 m with rubber-lined slots
  const yT = 1.1, yC = 0.72;
  for (const s of [-1, 1]) endFrame(bins, mat, s * (L / 2 - 0.02), W / 2 - 0.02, yd, yT, 0.0125, s < 0);
  const lining = M.rubber('#1A1B1C');
  for (const s of [-1, 1]) {
    const zc = s * 0.2;
    bins.add(mat, G.prism(G.roundedRectProfile(0.09, 0.005, 0.002, 2), V3(-L / 2 + 0.02, yC, zc), V3(L / 2 - 0.02, yC, zc), { side: V3(0, 0, 1) }));
    bins.add(mat, G.prism(G.roundedRectProfile(0.005, 0.035, 0.002, 2), V3(-L / 2 + 0.02, yC - 0.018, zc + s * 0.045), V3(L / 2 - 0.02, yC - 0.018, zc + s * 0.045), { side: V3(0, 0, 1) }));
    for (let k = 0; k < 8; k++) {
      const x = -L / 2 + 0.1 + (k * (L - 0.2)) / 7;
      // U slot opening towards the centre line, lined with rubber
      const ring = new THREE.TorusGeometry(0.036, 0.007, 8, 24, Math.PI).rotateX(Math.PI / 2).rotateY(s > 0 ? Math.PI : 0);
      bins.add(lining, ring.translate(x, yC + 0.004, zc - s * 0.012));
    }
  }
  // cross bars joining the comb rails to the end frames
  for (const s of [-1, 1]) bins.add(mat, G.tube(V3(s * (L / 2 - 0.02), yC, -W / 2 + 0.02), V3(s * (L / 2 - 0.02), yC, W / 2 - 0.02), 0.0105, 14));
  return { L, W, H: yT, detailTarget: [L / 2 - 0.1, R, W / 2 - 0.08] };
}

// ------------------------------------------------------------------ kapstokken
export function rackCart(bins, group, p) {
  const mat = frameMat(p.frame, 'grijs');
  const L = 2.1, W = 0.9, R = 0.0625;
  const { yTop } = deckDolly(bins, mat, { L, W, R });
  const yT = yTop + 1.55;
  for (const s of [-1, 1]) {
    endFrame(bins, mat, s * (L / 2 - 0.03), W / 2 - 0.05, yTop, yT, 0.014, false);
    bins.add(mat, G.tube(V3(s * (L / 2 - 0.03), yTop + 0.75, -(W / 2 - 0.05)), V3(s * (L / 2 - 0.03), yTop + 0.75, W / 2 - 0.05), 0.0105, 14));
    bins.add(mat, G.tube(V3(-L / 2 + 0.03, yTop + 0.55, s * (W / 2 - 0.05)), V3(L / 2 - 0.03, yTop + 0.55, s * (W / 2 - 0.05)), 0.0105, 14));
    for (const zz of [-1, 1]) bins.add(mat, G.roundedBox(0.05, 0.004, 0.05, 0.002).translate(s * (L / 2 - 0.03), yTop + 0.002, zz * (W / 2 - 0.05)));
  }
  // ridge beam over the full length and a push grip on one end frame
  bins.add(mat, G.prism(sq(0.04), V3(-L / 2 + 0.03, yT, 0), V3(L / 2 - 0.03, yT, 0), { side: V3(0, 1, 0) }));
  bins.add(F.plastic('#1A1A1A', 0.7), G.tube(V3(-L / 2 + 0.03, yTop + 1.0, -0.22), V3(-L / 2 + 0.03, yTop + 1.0, 0.22), 0.017, 18));
  bins.add(mat, G.tube(V3(-L / 2 + 0.03, yTop + 1.0, -(W / 2 - 0.05)), V3(-L / 2 + 0.03, yTop + 1.0, W / 2 - 0.05), 0.0105, 14));
  return { L, W, H: yT, detailTarget: [L / 2 - 0.08, R, W / 2 - 0.07] };
}

// ------------------------------------------------------------------ koelkast plateau
function ratchetStrap(bins, mats, pts, { w = 0.025, y }) {
  // flat strap lying on the deck along a polyline (x, z), a ratchet buckle and a J hook at the start
  const path = pts.map(([x, z]) => V3(x, y, z));
  const sm = G.surface((u, v, o) => {
    const f = u * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), t = f - i;
    const q = path[i].clone().lerp(path[i + 1], t);
    const d = path[i + 1].clone().sub(path[i]).normalize();
    const nrm = V3(-d.z, 0, d.x);
    o.copy(q).addScaledVector(nrm, (v - 0.5) * w);
  }, (path.length - 1) * 6, 2, { flipNormals: true });
  bins.add(mats.strap, sm);
  return path;
}
export function fridgeCart(bins, group, p) {
  const mat = frameMat(p.frame, 'grijs');
  const L = 0.75, W = 0.75, R = 0.0625, yM = F.castorHeight(R);
  const yd = yM + 0.035;
  castors4(bins, [-L / 2 + 0.09, L / 2 - 0.09], [-W / 2 + 0.09, W / 2 - 0.09], yM, { R });
  for (const s of [-1, 1]) {
    bins.add(mat, G.prism(sq(0.03), V3(-L / 2 + 0.03, yd - 0.015, s * (W / 2 - 0.09)), V3(L / 2 - 0.03, yd - 0.015, s * (W / 2 - 0.09)), { side: V3(0, 1, 0) }));
    bins.add(mat, G.prism(sq(0.03), V3(s * (L / 2 - 0.09), yd - 0.015, -W / 2 + 0.03), V3(s * (L / 2 - 0.09), yd - 0.015, W / 2 - 0.03), { side: V3(0, 1, 0) }));
  }
  // deck: 18 mm board covered in grey needle felt carpet, rubber bumper round the edge
  const carpet = S.fabricMat('#4A4C4F', { seed: 15 });
  const deck = F.slab(L, W, 0.018, { rc: 0.03, re: 0.004 });
  { for (const g of [deck.faces, deck.band]) S.uvBoxAlong(g, 'x'); }
  bins.add(carpet, deck.faces.translate(0, yd + 0.018, 0)); bins.add(carpet, deck.band.translate(0, yd + 0.018, 0));
  const yTop = yd + 0.018;
  bins.add(M.rubber('#1C1D1E'), F.sweep(F.rectPath(L + 0.006, W + 0.006, 0.033, yd + 0.009), G.roundedRectProfile(0.024, 0.012, 0.005, 3), { closed: true }));
  // rubber corner stops and four lashing eyes on the side rails
  const rub = M.rubber('#1C1D1E');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bins.add(rub, G.roundedBox(0.06, 0.016, 0.06, 0.006).translate(sx * (L / 2 - 0.05), yTop + 0.008, sz * (W / 2 - 0.05)));
  const eye = M.galvanised();
  const eyes = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const c = V3(sx * 0.17, yd + 0.005, sz * (W / 2 + 0.012));
    bins.add(eye, new THREE.TorusGeometry(0.014, 0.004, 8, 20).translate(c.x, c.y, c.z));
    eyes.push(c);
  }
  // two ratchet straps: hooked into the front eyes, lying across the deck, ratchet on the deck, tail loose
  const mats = { strap: F.beltWebbing('#E0661B') };
  for (const sx of [-1, 1]) {
    const e = eyes.find((q) => q.x * sx > 0 && q.z > 0);
    const x0 = e.x;
    const pts = [[x0, W / 2 - 0.01], [x0 - sx * 0.01, 0.2], [x0 - sx * 0.03, 0.0], [x0 - sx * 0.02, -0.16], [x0 + sx * 0.04, -0.26], [x0 + sx * 0.1, -0.22], [x0 + sx * 0.11, -0.1]];
    ratchetStrap(bins, mats, pts, { y: yTop + 0.0016 + (sx > 0 ? 0.0012 : 0) });
    // J hook through the eye (up over the deck edge)
    const hk = [V3(x0, yTop + 0.003, W / 2 - 0.03), V3(x0, yTop + 0.006, W / 2), V3(x0, yd + 0.03, W / 2 + 0.03), V3(x0, yd - 0.004, W / 2 + 0.02)];
    bins.add(eye, F.sweep(F.filletPath(hk, 0.012), G.circleProfile(0.004, 10)));
    // ratchet: steel body, black handle, on the strap at z ~ -0.05
    const rc = V3(x0 - sx * 0.025, yTop + 0.016, -0.05);
    bins.add(eye, G.roundedBox(0.05, 0.022, 0.09, 0.004).translate(rc.x, rc.y, rc.z));
    bins.add(F.plastic('#1A1A1A', 0.6), G.roundedBox(0.04, 0.014, 0.07, 0.006).translate(rc.x, rc.y + 0.016, rc.z - 0.03));
    bins.add(eye, G.tube(V3(rc.x - 0.03, rc.y + 0.004, rc.z + 0.03), V3(rc.x + 0.03, rc.y + 0.004, rc.z + 0.03), 0.009, 14));
  }
  return { L, W, H: yTop + 0.03, detailTarget: [L / 2 - 0.09, R, W / 2 - 0.09], view: { hero: { elevation: 30 } } };
}
