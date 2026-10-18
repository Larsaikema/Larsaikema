// Stoelen, round 4 (furniture group): weddingstoel, stretch stoelhoes on the klapstoel, and the
// folded klapstoel / weddingstoel as they stand on a transport cart. Called from chair.js.
//
//   weddingChair(bins, color)      resin (PP with a steel core) folding chair: back posts from the floor
//                                  to the top rail, bowed top rail and lower back rail with five turned
//                                  spindles, seat frame, front legs, low stretchers, padded vinyl seat with
//                                  piping in the frame colour, glides. 82 cm high, seat 45 cm.
//   stretchCover(bins, coverColor) spandex cover over the klapstoel (chair.js klapstoel geometry): a taut
//                                  rounded sleeve over the back posts and backrest, a box over the seat with
//                                  a short skirt, and four leg sleeves with foot pockets; the lower stretchers
//                                  stay bare.
//   foldedChair(style, color)      a folded chair as a Group, thin along z (stacking direction), standing on
//                                  y = 0: { object, pitch } for trolley.js (kind 'klapstoel').
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

function resin(color) {
  const c = String(color || 'wit').toLowerCase();
  const hex = c === 'zwart' ? '#1C1C1E' : c === 'wit' ? '#EFEEE9' : M.resolveColor(color, '#EFEEE9');
  return cached(`resin:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.34, specularIntensity: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.3, name: `resin ${hex}` });
    m.userData.envSpec = 0.6;
    return m;
  });
}
const vinylHex = (color) => (String(color || 'wit').toLowerCase() === 'zwart' ? '#1E1E20' : '#ECEAE4');

// ------------------------------------------------------------------ weddingstoel (standing)
export function weddingChair(bins, color) {
  const mat = resin(color);
  const glide = F.plastic('#9A9C9E', 0.5);
  const prof = G.roundedRectProfile(0.03, 0.025, 0.009, 3);
  const xs = 0.205, ySeat = 0.405, H = 0.82;
  const zPost = (y) => -0.215 - 0.06 * (y / H); // raked back posts
  const bow = (x) => 0.018 * (1 - (x / xs) ** 2);
  for (const s of [-1, 1]) {
    bins.add(mat, F.sweep([V3(s * xs, 0.008, zPost(0)), V3(s * xs, H - 0.012, zPost(H))], prof, { up: V3(1, 0, 0) }));
    // rounded post tops
    bins.add(mat, F.latheAt([[0.0001, 0], [0.0145, 0], [0.0135, 0.008], [0.008, 0.013], [0.0001, 0.0145]], V3(s * xs, H - 0.012, zPost(H)), V3(0, 1, -0.07).normalize(), 18));
    // front legs: slight forward splay up to the seat front
    bins.add(mat, F.sweep([V3(s * (xs - 0.004), 0.008, 0.235), V3(s * (xs - 0.004), ySeat - 0.01, 0.195)], prof, { up: V3(1, 0, 0) }));
    for (const z of [zPost(0), 0.235]) bins.add(glide, G.lathe([[0.0001, 0], [0.012, 0], [0.0125, 0.008], [0.0001, 0.008]], 18).translate(s * xs, 0, z));
    // seat side rail and side stretcher
    bins.add(mat, G.prism(G.roundedRectProfile(0.022, 0.036, 0.007, 3), V3(s * (xs - 0.002), ySeat - 0.01, zPost(ySeat) + 0.01), V3(s * (xs - 0.002), ySeat - 0.01, 0.21), { side: V3(1, 0, 0) }));
    bins.add(mat, G.tube(V3(s * (xs - 0.003), 0.13, 0.226), V3(s * (xs - 0.003), 0.15, zPost(0.15) + 0.004), 0.009, 14));
    // hinge bolt caps on the posts
    bins.add(M.chrome(), F.latheAt([[0.0001, 0], [0.006, 0], [0.006, 0.002], [0.004, 0.004], [0.0001, 0.0045]], V3(s * (xs + 0.014), ySeat - 0.01, zPost(ySeat) + 0.012), V3(s, 0, 0), 14));
  }
  // front + back seat rails, low stretchers
  bins.add(mat, G.prism(G.roundedRectProfile(0.036, 0.022, 0.007, 3), V3(-xs, ySeat - 0.01, 0.205), V3(xs, ySeat - 0.01, 0.205), { side: V3(0, 1, 0) }));
  bins.add(mat, G.prism(G.roundedRectProfile(0.03, 0.02, 0.007, 3), V3(-xs, ySeat - 0.012, zPost(ySeat) + 0.016), V3(xs, ySeat - 0.012, zPost(ySeat) + 0.016), { side: V3(0, 1, 0) }));
  bins.add(mat, G.tube(V3(-xs, 0.12, 0.228), V3(xs, 0.12, 0.228), 0.009, 14));
  bins.add(mat, G.tube(V3(-xs, 0.15, zPost(0.15) + 0.002), V3(xs, 0.15, zPost(0.15) + 0.002), 0.009, 14));
  // back: bowed top rail, lower rail, five turned spindles
  const rail = (y, h, t) => {
    const pts = []; for (let i = 0; i <= 16; i++) { const x = -xs + (2 * xs * i) / 16; pts.push(V3(x, y, zPost(y) - bow(x))); }
    bins.add(mat, F.sweep(pts, G.roundedRectProfile(h, t, Math.min(h, t) * 0.4, 3), { up: V3(0, 1, 0) }));
  };
  rail(H - 0.045, 0.062, 0.024);
  rail(0.535, 0.03, 0.02);
  for (let i = 0; i < 5; i++) {
    const x = -0.12 + i * 0.06;
    const y0 = 0.55, y1 = H - 0.075;
    const prof2 = [[0.0001, 0], [0.0075, 0], [0.0065, 0.03], [0.0085, 0.06], [0.0062, 0.11], [0.0062, y1 - y0 - 0.11], [0.0085, y1 - y0 - 0.06], [0.0065, y1 - y0 - 0.03], [0.0075, y1 - y0], [0.0001, y1 - y0]];
    const a = V3(x, y0, zPost(y0) - bow(x)), b = V3(x, y1, zPost(y1) - bow(x));
    bins.add(mat, F.latheAt(prof2, a, b.clone().sub(a).normalize(), 16));
  }
  // padded seat in vinyl, piping on the top seam
  const W = 0.4, D = 0.385, T = 0.05;
  const seat = S.softBlock(W, T, D, { r: 0.02, crown: 0.01, belly: 0.003, gather: 0.0016, uneven: 0.0008, seed: 17, seg: [70, 12, 66] });
  const sy = ySeat + 0.008 + T / 2, sz = 0.0;
  const vinyl = S.leatherMat(vinylHex(color));
  bins.add(vinyl, seat.translate(0, sy, sz));
  bins.add(vinyl, F.sweep(S.weltPath(seat.userData.shape, 1, { cr: 0.0032 }).map((p) => p.add(V3(0, sy, sz))), G.circleProfile(0.0032, 10), { closed: true }));
  return { seatY: sy + T / 2, seatZ: 0 };
}

// ------------------------------------------------------------------ stretch cover on the klapstoel
export function stretchCover(bins, coverColor) {
  const fab = M.lycra(coverColor || 'wit');
  // klapstoel geometry (chair.js): A tubes from (x, 0.008, 0.205) to (x, 0.835, -0.175), seat top ~0.473
  const zA = (y) => 0.205 + (-0.175 - 0.205) * (y - 0.008) / (0.835 - 0.008);
  const tilt = Math.atan2(0.38, 0.827);
  // back sleeve over posts + backrest
  const yb0 = 0.47, yb1 = 0.875;
  const len = (yb1 - yb0) / Math.cos(tilt);
  const back = F.cushion(0.5, len, 0.11, { r: 0.036, puff: 0.0, seg: [36, 30, 10] });
  // taut fabric: the front and back faces pull in a little between the edges; then the sleeve follows
  // the backrest's curvature (R 0.42, as chair.js bends the klapstoel back panel)
  { const pp = back.attributes.position, Rb = 0.42;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i); let z = pp.getZ(i);
      const k = Math.max(0, 1 - (x / 0.25) ** 2) * Math.max(0, 1 - (y / (len / 2)) ** 2);
      z -= Math.sign(z) * 0.004 * k;
      const a = x / Rb, rad = Rb - z;
      pp.setXYZ(i, Math.sin(a) * rad, y, Rb - Math.cos(a) * rad);
    }
    back.computeVertexNormals(); }
  const yc = (yb0 + yb1) / 2;
  back.rotateX(-tilt).translate(0, yc, zA(yc) - 0.02);
  bins.add(fab, back);
  // seat box with a short skirt
  const seat = F.cushion(0.47, 0.072, 0.44, { r: 0.026, puff: 0.003, seg: [26, 8, 26] });
  bins.add(fab, seat.translate(0, 0.478 - 0.036, 0.012));
  // leg sleeves with foot pockets
  const sleeve = (a, b, r = 0.019) => {
    const L = a.distanceTo(b);
    const prof = [[0.0001, -0.004], [r + 0.002, -0.004], [r + 0.0035, 0.01], [r + 0.002, 0.03], [r, 0.05], [r - 0.002, L - 0.03], [r + 0.002, L], [0.0001, L + 0.004]];
    bins.add(fab, F.latheAt(prof, a, b.clone().sub(a).normalize(), 20));
  };
  for (const s of [-1, 1]) {
    sleeve(V3(s * 0.215, 0.004, 0.205), V3(s * 0.215, 0.41, zA(0.41)));
    const B0 = V3(s * 0.193, 0.004, -0.235), B1 = V3(s * 0.193, 0.415, 0.15);
    sleeve(B0, B0.clone().lerp(B1, 0.96), 0.018);
  }
}

// ------------------------------------------------------------------ folded chairs (for the cart)
export function foldedChair(style = 'klapstoel', color = 'wit') {
  const st = String(style).toLowerCase();
  const bins = new G.PartBin();
  let pitch;
  if (st === 'wedding') {
    const mat = resin(color), glide = F.plastic('#9A9C9E', 0.5);
    const prof = G.roundedRectProfile(0.03, 0.025, 0.009, 3);
    const xs = 0.205, H = 0.86;
    for (const s of [-1, 1]) {
      bins.add(mat, F.sweep([V3(s * xs, 0.008, 0), V3(s * xs, H - 0.012, 0)], prof, { up: V3(1, 0, 0) }));
      bins.add(mat, F.latheAt([[0.0001, 0], [0.0145, 0], [0.0135, 0.008], [0.008, 0.013], [0.0001, 0.0145]], V3(s * xs, H - 0.012, 0), V3(0, 1, 0), 18));
      // front legs folded up alongside the posts, in front
      bins.add(mat, F.sweep([V3(s * (xs - 0.03), 0.02, 0.024), V3(s * (xs - 0.03), 0.43, 0.024)], prof, { up: V3(1, 0, 0) }));
      bins.add(glide, G.lathe([[0.0001, 0], [0.012, 0], [0.0125, 0.008], [0.0001, 0.008]], 18).translate(s * xs, 0, 0));
      // seat frame side rails, now vertical
      bins.add(mat, G.prism(G.roundedRectProfile(0.022, 0.024, 0.007, 3), V3(s * (xs - 0.026), 0.42, 0.034), V3(s * (xs - 0.026), 0.8, 0.034), { side: V3(1, 0, 0) }));
    }
    for (const y of [H - 0.045, 0.555]) bins.add(mat, G.prism(G.roundedRectProfile(y > 0.7 ? 0.062 : 0.03, 0.022, 0.008, 3), V3(-xs, y, -0.002), V3(xs, y, -0.002), { side: V3(0, 1, 0) }));
    for (let i = 0; i < 5; i++) bins.add(mat, G.tube(V3(-0.12 + i * 0.06, 0.57, -0.002), V3(-0.12 + i * 0.06, H - 0.075, -0.002), 0.007, 12));
    bins.add(mat, G.tube(V3(-xs, 0.15, 0), V3(xs, 0.15, 0), 0.009, 14));
    bins.add(mat, G.tube(V3(-xs + 0.03, 0.06, 0.024), V3(xs - 0.03, 0.06, 0.024), 0.009, 14));
    // seat (with its cushion) folded up, standing in front of the back
    const seat = S.softBlock(0.38, 0.044, 0.37, { r: 0.018, crown: 0.006, belly: 0.002, gather: 0.001, uneven: 0.0006, seed: 19, seg: [40, 8, 40] });
    seat.rotateX(-Math.PI / 2).translate(0, 0.615, 0.066);
    bins.add(S.leatherMat(vinylHex(color)), seat);
    pitch = 0.096;
  } else {
    // klapstoel: the A tubes stand near vertical, the rear U legs fold up behind them, the seat swings
    // up between the posts in front of the backrest's lower edge
    const key = String(color).toLowerCase();
    const plast = F.hdpeSmooth(key === 'zwart' ? '#232426' : key === 'wit' ? '#F0F0EC' : M.resolveColor(color));
    const frame = key === 'wit' ? cached('wpow', () => new THREE.MeshPhysicalMaterial({ color: '#ECEBE6', roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3, name: 'powder white' })) : F.powder(key === 'zwart' ? 'zwart' : 'grijs');
    const cap = F.plastic('#1A1A1A', 0.6), r = 0.011;
    const H = 0.9;
    for (const s of [-1, 1]) {
      bins.add(frame, G.tube(V3(s * 0.215, 0.012, 0), V3(s * 0.215, H, -0.01), r, 16));
      bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0015, 0], [r + 0.002, 0.012], [0.0001, 0.012]], 16).translate(s * 0.215, 0, 0));
    }
    // rear U legs folded flat behind the A tubes
    bins.add(frame, F.sweep(F.filletPath([V3(-0.193, 0.03, -0.024), V3(-0.193, 0.46, -0.024), V3(0.193, 0.46, -0.024), V3(0.193, 0.03, -0.024)], 0.03), G.circleProfile(r * 0.92, 14)));
    for (const s of [-1, 1]) bins.add(cap, G.lathe([[0.0001, 0], [r + 0.0012, 0], [r + 0.0018, 0.012], [0.0001, 0.012]], 16).translate(s * 0.193, 0.02, -0.024));
    bins.add(frame, G.tube(V3(-0.215, 0.14, 0), V3(0.215, 0.14, 0), r * 0.8, 12));
    bins.add(frame, G.tube(V3(-0.193, 0.12, -0.024), V3(0.193, 0.12, -0.024), r * 0.8, 12));
    // seat standing up in front, backrest at the top
    const seat = S.softBlock(0.4, 0.032, 0.385, { r: 0.012, crown: -0.004, belly: 0, gather: 0, uneven: 0, seed: 3 });
    seat.rotateX(-Math.PI / 2).translate(0, 0.53, 0.024);
    bins.add(plast, seat);
    const back = S.softBlock(0.43, 0.165, 0.026, { r: 0.01, crown: 0, belly: 0.0015, gather: 0, uneven: 0, seg: [44, 16, 6], seed: 4 });
    bins.add(plast, back.translate(0, H - 0.1, 0.012));
    pitch = 0.062;
  }
  const g = new THREE.Group(); g.name = `folded ${st} ${color}`;
  bins.build(g);
  return { object: g, pitch };
}
