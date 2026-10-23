// Transportkarren, round 4 (furniture group). Called from trolley.js for the kinds below.
//
//   'klapstoel'  chair cart for folded chairs standing upright in two lanes (chairStyle 'klapstoel', 30 = 2 x 15,
//                or 'wedding', 26 = 2 x 13): plywood deck dolly on Ø125 castors, U end frames (push grip on
//                one), a centre divider frame and side rails at 0.5 / 0.85 m; `loaded` chairs, `chairColor`.
//                Loaded, one chair stands set up beside the 30 / 26 cart (the pakket shot); `beside: false` omits it.
//                More than 30 loaded: the long cart for 50 klapstoelen (2 x 25), shown without a chair beside it.
//   'afzetpaal'  cart for 16 afzetpalen (ca. 150 x 75 x 110 cm): a steel tray as deck ("de bak onderin") with a
//                rubber mat, two comb rails at 0.72 m with eight rubber-lined post slots each, U end frames with a
//                grip. Round 6: the product photo shows what the cart is for (alt text: "afzetpalen rechtop in
//                vakken"): `loaded` posts (RVS, black belt; 0 / absent = 8, every other slot, the Ø32 bases
//                stand on the mat without touching), `empty: true` = the bare cart.
//   'kapstok'    cart for folded rolling coat racks (2 m): long low deck (ca. 210 x 90), two tall U end frames
//                (1.6 m) joined by a ridge beam, side rails. Round 6: loaded with two folded rolling coat racks
//                standing upright (alt text), `empty: true` = the bare cart.
//   'koelkast'   plateau dolly for a standing fridge (ca. 75 x 75, 150 kg): carpeted deck with rubber corner
//                stops and four lashing eyes, two ratchet straps lying on it (round 6: real 35 mm webbing with
//                thickness and twill, the loose tails in soft loops; no flat stripes with hairpin bends),
//                castors with brake.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { castors4, endFrame, frameMat, sq, deckDolly } from './trolley.js';
import { foldedChair } from './chairs2.js';
import { chair } from './chair.js';
import { post as beltPost } from './stanchion.js';
import { strapWebbing } from '../js/fabric2.js';

const { V3 } = G;
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ folded chairs in two lanes
export function chairCart(bins, group, p) {
  const wedding = String(p.chairStyle || '').toLowerCase().startsWith('wed');
  // round 5: the long cart for 50 klapstoelen (2 x 25) when more than 30 are loaded
  const cap = wedding ? 26 : Number(p.loaded ?? 0) > 30 || Number(p.capacity) === 50 ? 50 : 30, perLane = cap / 2;
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
    // the pakket shot (round 5): one chair set up beside the loaded cart, front-right, turned towards the
    // camera (as the stapelstoel / barkruk pakketten); `beside: false` shows the cart alone
    if (p.beside === true || (p.beside == null && cap <= 30)) {
      const c = chair({ style: wedding ? 'wedding' : 'klapstoel', color: p.chairColor || 'wit' }).object;
      const h = new THREE.Group(); h.add(c);
      // round 7: ~30 cm clear of the cart's corner (it stood jammed against the end frame)
      h.rotation.y = -28 * DEG;
      h.position.set(L / 2 + 0.8, 0, W / 2 - 0.22);
      group.add(h);
    }
  }
  return { L, W, H: yT, detailTarget: [L / 2 - 0.08, R, W / 2 - 0.07], view: n ? { hero: { azimuth: 36 } } : undefined };
}

// ------------------------------------------------------------------ afzetpalen (16)
export function postCart(bins, group, p) {
  const mat = frameMat(p.frame, 'grijs');
  // round 7: tray 160 x 84 (was 150 x 75): ~7 cm of mat between every Ø32 base and the tray walls (at 1-2 cm the
  // bases' rims sat on the wall's edge in the hero and read as clipping through it)
  const L = 1.6, W = 0.84, R = 0.0625, yM = F.castorHeight(R);
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
  const rim = 0.05; // round 7: a 5 cm lip (was 9): the bases show standing on the mat, well inside it
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
  // 8 slots per comb, 16 cm apart: a post in every other slot leaves 32 cm for its base (Ø32), and the two
  // rows are staggered by one slot
  const slotX = (k) => -0.56 + k * 0.16;
  for (const s of [-1, 1]) endFrame(bins, mat, s * (L / 2 - 0.02), W / 2 - 0.02, yd, yT, 0.0125, s < 0);
  const lining = M.rubber('#1A1B1C');
  for (const s of [-1, 1]) {
    const zc = s * 0.19;
    bins.add(mat, G.prism(G.roundedRectProfile(0.09, 0.005, 0.002, 2), V3(-L / 2 + 0.02, yC, zc), V3(L / 2 - 0.02, yC, zc), { side: V3(0, 0, 1) }));
    bins.add(mat, G.prism(G.roundedRectProfile(0.005, 0.035, 0.002, 2), V3(-L / 2 + 0.02, yC - 0.018, zc + s * 0.045), V3(L / 2 - 0.02, yC - 0.018, zc + s * 0.045), { side: V3(0, 0, 1) }));
    for (let k = 0; k < 8; k++) {
      const x = slotX(k);
      // U slot opening towards the centre line, lined with rubber
      const ring = new THREE.TorusGeometry(0.036, 0.007, 8, 24, Math.PI).rotateX(Math.PI / 2).rotateY(s > 0 ? Math.PI : 0);
      bins.add(lining, ring.translate(x, yC + 0.004, zc - s * 0.012));
    }
  }
  // cross bars joining the comb rails to the end frames
  for (const s of [-1, 1]) bins.add(mat, G.tube(V3(s * (L / 2 - 0.02), yC, -W / 2 + 0.02), V3(s * (L / 2 - 0.02), yC, W / 2 - 0.02), 0.0105, 14));
  // the posts: upright in every other slot of each comb (staggered between the rows, so the Ø32 bases stand
  // on the mat without touching), RVS with a black belt cassette head
  const want = p.empty === true ? 0 : Math.max(0, Math.min(16, Math.round(Number(p.loaded) || 8)));
  if (want) {
    const pm = { tube: F.stainless(), polished: F.stainlessPolished(), rubber: M.rubber('#151515'), abs: F.plastic('#141414', 0.42), slot: F.plastic('#050505', 0.8) };
    const yMat = yt + 0.0075, slots = [];
    for (const [s, odd] of [[1, 0], [-1, 1]]) for (let k = odd; k < 8; k += 2) slots.push({ x: slotX(k), z: s * 0.19 - s * 0.012 });
    // fill the front row (+z, nearest the camera) last so the posts behind stay readable
    slots.sort((a, b) => a.z - b.z);
    for (const q of slots.slice(0, want)) {
      const tmp = new G.PartBin();
      beltPost(tmp, pm, 0, 0.99, { mouth: true, slotTowards: 1 });
      for (const [m, list] of tmp.bins) for (const g of list) bins.add(m, g.translate(q.x, yMat, q.z));
    }
  }
  return { L, W, H: Math.max(yT, yt + 1.0), detailTarget: [L / 2 - 0.1, R, W / 2 - 0.08], view: { hero: { elevation: 24 } } };
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
  // two folded rolling coat racks standing upright on the deck, one each side of the ridge, leaning in on it
  if (p.empty !== true) {
    const chrome = M.chrome(), cap = F.plastic('#161616', 0.6);
    const rk = { steel: M.galvanised(), tyre: M.rubber('#2A2B2D'), hub: F.plastic('#8E9194', 0.45) };
    for (const [zs, k] of [[1, 0], [-1, 1]]) {
      const tb = new G.PartBin();
      const Wr = 1.62, Hr = 1.28, rr = 0.016, xs = Wr / 2; // uprights telescoped in
      // frame in its own plane (x, y), z = 0: two uprights, the hanging rail on top, a low cross bar
      tb.add(chrome, F.sweep(F.filletPath([V3(-xs, 0.075, 0), V3(-xs, Hr, 0), V3(xs, Hr, 0), V3(xs, 0.075, 0)], 0.05), G.circleProfile(rr, 18)));
      tb.add(chrome, G.tube(V3(-xs, 0.32, 0), V3(xs, 0.32, 0), 0.0125, 14));
      // telescopic joints on the uprights (collar + knob)
      for (const x of [-xs, xs]) {
        tb.add(chrome, G.lathe([[rr + 0.001, 0.88], [rr + 0.004, 0.885], [rr + 0.004, 0.92], [rr + 0.001, 0.925]], 20).translate(x, 0, 0));
        tb.add(cap, F.latheAt([[0.0001, 0], [0.011, 0], [0.012, 0.01], [0.0001, 0.014]], V3(x, 0.9, rr + 0.003), V3(0, 0, 1), 12));
      }
      // the T-feet folded up flat against the uprights (foot bar vertical, castors at its ends)
      for (const x of [-xs, xs]) {
        const xf = x - Math.sign(x) * 0.045;
        tb.add(chrome, G.prism(G.roundedRectProfile(0.03, 0.024, 0.005, 3), V3(xf, 0.06, -0.022), V3(xf, 0.56, -0.022), { side: V3(1, 0, 0) }));
        tb.add(chrome, G.roundedBox(0.07, 0.05, 0.04, 0.006).translate(x - Math.sign(x) * 0.02, 0.1, -0.012));
        for (const y of [0.075, 0.545]) F.castor(tb, { at: V3(xf, y + 0.08 * (y < 0.3 ? -1 : 1), -0.022 - 0.03), R: 0.025, W: 0.02, swivel: true, heading: Math.PI / 2, mats: rk });
      }
      for (const x of [-xs, xs]) tb.add(cap, G.lathe([[0.0001, 0], [rr + 0.002, 0], [rr + 0.002, 0.012], [0.0001, 0.014]].reverse(), 18).translate(x, 0.062, 0));
      // the numbered hooks on the hanging rail (black J-hooks with a white number tag) and the hat shelf
      // folded up flat above the rail (a wire grid between two tubes), so the folded rack reads as a kapstok
      const hookM = F.plastic('#18191A', 0.45), tagM = F.plastic('#EDEBE5', 0.6);
      for (let i = 0; i < 18; i++) {
        const x = -0.72 + (1.44 * i) / 17;
        const hk = [V3(x, Hr - rr, 0.004), V3(x, Hr - 0.05, 0.012), V3(x, Hr - 0.085, 0.03), V3(x, Hr - 0.07, 0.05), V3(x, Hr - 0.05, 0.052)];
        tb.add(hookM, F.sweep(F.filletPath(hk, 0.012), G.circleProfile(0.0028, 8)));
        tb.add(tagM, G.roundedBox(0.018, 0.014, 0.003, 0.002).translate(x, Hr - 0.035, rr + 0.004));
      }
      for (const dy of [0.05, 0.21]) tb.add(chrome, G.tube(V3(-xs + 0.04, Hr + dy, 0), V3(xs - 0.04, Hr + dy, 0), 0.008, 12));
      for (let i = 0; i <= 15; i++) { const x = -xs + 0.06 + ((2 * xs - 0.12) * i) / 15; tb.add(chrome, G.tube(V3(x, Hr + 0.05, 0), V3(x, Hr + 0.21, 0), 0.0035, 6)); }
      for (const x of [-xs + 0.04, xs - 0.04]) tb.add(chrome, G.tube(V3(x, Hr - 0.01, 0), V3(x, Hr + 0.215, 0), 0.008, 10));
      const lean = zs * 2.2 * Math.PI / 180;
      const m = new THREE.Matrix4().makeRotationX(-lean).setPosition((k ? 0.04 : -0.03), yTop + 0.002, zs * 0.12);
      for (const [mm, list] of tb.bins) for (const g of list) bins.add(mm, g.applyMatrix4(m));
    }
  }
  return { L, W, H: yT, detailTarget: [L / 2 - 0.08, R, W / 2 - 0.07] };
}

// ------------------------------------------------------------------ koelkast plateau
function ratchetStrap(bins, mats, pts, { w = 0.035, y, t = 0.0018 }) {
  // a 35 mm webbing strap lying flat on the deck along a smooth curve through the (x, z) points: real
  // thickness (sweep of a thin rounded section, flat side down), soft bends, a tiny lift where it crosses
  // itself is not needed (the paths do not cross)
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V3(x, y + t / 2, z)), false, 'centripetal', 0.5);
  const path = curve.getSpacedPoints(Math.max(40, Math.round(curve.getLength() / 0.006)));
  const g = F.sweep(path, G.roundedRectProfile(t, w, t * 0.45, 2), { up: V3(0, 1, 0) });
  // uv in metres for the twill: u across... the sweep gives (perimeter, length): swap so u runs along
  { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const a = uv.getX(i), b = uv.getY(i); uv.setXY(i, b, a); } }
  bins.add(mats.strap, g);
  return { path, curve };
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
  // two ratchet straps: hooked into the front eyes, lying back across the deck to the ratchet, the loose
  // tail curling round in a wide soft loop (no hairpins)
  const mats = { strap: strapWebbing('#E0661B') };
  for (const sx of [-1, 1]) {
    const e = eyes.find((q) => q.x * sx > 0 && q.z > 0);
    const x0 = e.x;
    const pts = [[x0, W / 2 - 0.004], [x0 - sx * 0.006, 0.22], [x0 - sx * 0.012, 0.05], [x0 - sx * 0.01, -0.09], [x0 + sx * 0.012, -0.19], [x0 + sx * 0.055, -0.25], [x0 + sx * 0.11, -0.28], [x0 + sx * 0.165, -0.275]];
    const { curve } = ratchetStrap(bins, mats, pts, { y: yTop + (sx > 0 ? 0.0006 : 0) });
    // J hook through the eye (up over the deck edge)
    const hk = [V3(x0, yTop + 0.004, W / 2 - 0.03), V3(x0, yTop + 0.007, W / 2), V3(x0, yd + 0.03, W / 2 + 0.03), V3(x0, yd - 0.004, W / 2 + 0.02)];
    bins.add(eye, F.sweep(F.filletPath(hk, 0.012), G.circleProfile(0.004, 10)));
    // ratchet on the strap where it lies straight (about a third of the way back), aligned with it
    const u = 0.33, rc = curve.getPointAt(u), tg = curve.getTangentAt(u).setY(0).normalize();
    const rot = new THREE.Matrix4().makeRotationY(Math.atan2(tg.x, tg.z));
    const at = (dx, dy, dz) => V3(dx, dy, dz).applyMatrix4(rot).add(rc);
    bins.add(eye, G.roundedBox(0.05, 0.02, 0.09, 0.004).applyMatrix4(rot).translate(...at(0, 0.012, 0).toArray()));
    bins.add(F.plastic('#1A1A1A', 0.6), G.roundedBox(0.044, 0.014, 0.075, 0.006).applyMatrix4(rot).translate(...at(0, 0.026, -0.03).toArray()));
    bins.add(eye, G.tube(at(-0.03, 0.016, 0.03), at(0.03, 0.016, 0.03), 0.009, 14));
  }
  return { L, W, H: yTop + 0.03, detailTarget: [L / 2 - 0.09, R, W / 2 - 0.09], view: { hero: { elevation: 30 } } };
}
