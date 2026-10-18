// Afzetsysteem, rope line and parts (furniture group, round 4). Called from stanchion.js for
// every spec that is not a plain belt post: stanchion({ rope | head | only | parts, ... }).
//
//   head 'ovaal' (+ rope, pair, finish, span)
//        Afzetpaal voor koord: Ø51 tube on the same weighted Ø32 dome base, a collar and an oval
//        (urn) finial with four eyes (rings, axis radial) just under it. finish 'chroom' (default),
//        'messing' (messinglook), 'zwart', 'wit'. pair: two posts with a velours rope between them,
//        hooked into the facing eyes, hanging in a catenary (150 cm rope over 1.2 m: ~0.28 m sag).
//   only 'rope' (+ rope colour)
//        Afzetkoord velours: Ø32 velvet rope (upholstery2.velvetPile on a smooth tube) with a polished
//        chrome ferrule and a snap hook (J hook + spring gate) at each end, lying on the floor in a
//        loose horseshoe that opens towards the camera; higher hero angle so the arc reads.
//   parts [...] (onderdelen-afzetsysteem)
//        'wandhaak' | 'koord'   wall hook for a rope: domed rosette with a fixed eye, shown in the three
//                               finishes (chroom, messinglook, zwart) lying on their back, with screws + plugs
//        'wandunit' | 'm'       wall cassette with a retractable belt (black ABS case on a steel wall plate,
//                               belt mouth, belt pulled out onto the floor with its clip) + receiver plate;
//                               `beltLength` 2 | 3 puts a "2 m" / "3 m" label on the case
//        'bordhouder' | 'liggend' | 'staand'
//                               sign frame on the head of a belt post (RVS), tilted back 20 deg, black
//                               snap frame with a printed sign ("INGANG" + arrow); `format` 'A4' | 'A3',
//                               `orient` 'liggend' | 'staand' (from the token), `frameFinish` 'zwart' | 'rvs'
//        several parts -> a small group (post with sign holder, wall unit, wall hook).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';
import { post as beltPost } from './stanchion.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// polished brass-look (messinglook): warm yellow metal, a touch softer than chrome
export function brass() {
  return cached('brass', () => new THREE.MeshPhysicalMaterial({ color: '#D7B46A', metalness: 1, roughness: 0.16, name: 'brass look' }));
}
function finishMat(f) {
  const s = String(f || 'chroom').toLowerCase();
  if (s.startsWith('mess') || s === 'goud' || s === 'brass') return brass();
  if (s === 'zwart' || s === 'black') return F.powder('zwart');
  if (s === 'wit' || s === 'white') return U.powder('wit');
  if (s === 'rvs' || s === 'stainless') return F.stainlessPolished();
  return M.chrome();
}
// velours as it photographs (deep dyed pile; gold = mustard gold velvet)
const ROPE = { bordeaux: '#5A1420', rood: '#A0131B', zwart: '#1D1D20', blauw: '#1D3A86', groen: '#1B5833', goud: '#B48C42', wit: '#ECEAE3', grijs: '#80848A' };
function ropeMat(color) {
  const key = String(color || 'bordeaux').toLowerCase();
  const hex = ROPE[key] || M.resolveColor(color, ROPE.bordeaux);
  const L = new THREE.Color(hex); const lum = 0.2126 * L.r + 0.7152 * L.g + 0.0722 * L.b;
  // pale pile (wit, grijs): less fall-off face-on, or white velvet prints grey
  return lum > 0.5 ? U.velvetPile(hex, { face: 0.86, rimGain: 1.18, desat: 0.1 }) : U.velvetPile(hex, { face: 0.74, rimGain: 1.6 });
}

// ------------------------------------------------------------------------ rope end hardware
const ROPE_R = 0.016;
// ferrule (end cap) from p0 along d (unit), returns the end point of the cap
function ferrule(bins, mat, p0, d) {
  const prof = [[0.0001, -0.004], [ROPE_R + 0.0016, -0.004], [ROPE_R + 0.0026, 0.0], [ROPE_R + 0.0026, 0.006], [ROPE_R + 0.0012, 0.009], [ROPE_R + 0.0012, 0.03],
    [ROPE_R + 0.0024, 0.033], [ROPE_R + 0.0024, 0.038], [ROPE_R + 0.0005, 0.043], [0.013, 0.05], [0.007, 0.056], [0.0045, 0.058], [0.0045, 0.064], [0.0001, 0.064]];
  bins.add(mat, F.latheAt(prof, p0, d, 40));
  return p0.clone().addScaledVector(d, 0.062);
}
// snap hook: shank along d, a J curl in the plane (d, n), spring gate closing it. Returns the
// centre of the curl (where an eye's wire passes through).
function snapHook(bins, mat, p0, d, n) {
  const P = (s, h) => p0.clone().addScaledVector(d, s).addScaledVector(n, h);
  const rr = 0.0034, R = 0.0135;
  const pts = [P(0, 0), P(0.022, 0)];
  for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 14; pts.push(P(0.022 + R * Math.cos(a), R + R * Math.sin(a))); }
  pts.push(P(0.006, 2 * R), P(0.003, 2 * R - 0.002));
  bins.add(mat, F.sweep(pts, G.circleProfile(rr, 12)));
  // tip bead and the gate (flat spring bar from the tip back onto the shank)
  bins.add(mat, F.latheAt([[0.0001, -0.0035], [0.0042, -0.0035], [0.0042, 0.0035], [0.0001, 0.0035]], P(0.003, 2 * R - 0.002), d, 12));
  const side = new THREE.Vector3().crossVectors(d, n).normalize();
  bins.add(mat, G.flatBar(P(0.004, 2 * R - 0.004), P(0.018, rr + 0.001), 0.0055, 0.0012, side));
  return P(0.022, R);
}

// ------------------------------------------------------------------------ post with oval head
function ropePost(bins, mat, x, z, { H = 1.0, eyes = [0, 90, 180, 270] } = {}) {
  const rT = 0.0255, Rb = 0.16;
  const rubber = M.rubber('#151515');
  bins.add(rubber, G.lathe([[0.0001, 0.0], [Rb - 0.004, 0.0], [Rb - 0.002, 0.003], [Rb - 0.004, 0.008], [0.0001, 0.008]], 72).translate(x, 0, z));
  const dome = [[Rb - 0.002, 0.007], [Rb, 0.008], [Rb - 0.003, 0.0115], [0.14, 0.018], [0.1, 0.03], [0.06, 0.042], [rT + 0.012, 0.05], [rT + 0.004, 0.0545], [0.0001, 0.0545]];
  bins.add(mat, G.lathe(dome, 96).translate(x, 0, z));
  const yTop = H - 0.12;
  bins.add(mat, G.tube(V3(x, 0.05, z), V3(x, yTop, z), rT, 48));
  // base collar, head collar with the eye ring, urn finial
  bins.add(mat, G.lathe([[rT, 0.05], [rT + 0.006, 0.053], [rT + 0.006, 0.062], [rT, 0.068]], 48).translate(x, 0, z));
  const yr = yTop + 0.02;
  bins.add(mat, G.lathe([[0.0001, yTop - 0.004], [rT + 0.002, yTop - 0.004], [rT + 0.008, yTop + 0.004], [rT + 0.008, yTop + 0.03], [rT + 0.002, yTop + 0.036], [0.022, yTop + 0.04], [0.0001, yTop + 0.04]], 48).translate(x, 0, z));
  const urn = [[0.0001, yTop + 0.038], [0.016, yTop + 0.038], [0.019, yTop + 0.046], [0.03, yTop + 0.058], [0.037, yTop + 0.075], [0.038, yTop + 0.09], [0.034, yTop + 0.104], [0.024, yTop + 0.114], [0.011, yTop + 0.12], [0.0001, yTop + 0.121]];
  bins.add(mat, G.lathe(urn, 64).translate(x, 0, z));
  // the eyes: four rings round the collar under the finial
  const eyeAt = {};
  for (const a of eyes) {
    const out = V3(Math.sin(a * DEG), 0, Math.cos(a * DEG));
    // horizontal ring sticking out of the collar: a hook in a vertical plane links through it
    const c = V3(x, yr, z).addScaledVector(out, rT + 0.008 + 0.0095 - 0.0012);
    const ring = new THREE.TorusGeometry(0.0095, 0.0028, 10, 28).rotateX(Math.PI / 2);
    ring.translate(c.x, c.y, c.z);
    bins.add(mat, ring);
    eyeAt[a] = { c, out };
  }
  return { eyeAt, H };
}

// rope hanging between two eyes A and B (eye centres, outward dirs); sag at mid-span
function hangingRope(bins, rmat, hw, A, B, sag) {
  // the hook hangs from the top wire of the eye; the ferrule follows the rope's end tangent
  const topA = A.c.clone().addScaledVector(A.out, 0.0095), topB = B.c.clone().addScaledVector(B.out, 0.0095);
  const span = topA.distanceTo(topB);
  const ex = topB.clone().sub(topA).setY(0).normalize();
  // end tangent of a parabola with this sag over the rope's own span (iterate once)
  let s = span - 0.2, th = Math.atan(4 * sag / s);
  for (let k = 0; k < 3; k++) { const reach = 0.012 + 0.022 + 0.062; s = span - 2 * reach * Math.cos(th); th = Math.atan(4 * sag / s); }
  const ends = [];
  for (const [top, sgn] of [[topA, 1], [topB, -1]]) {
    // direction from the rope end towards the eye: back along the rope and up
    const d = ex.clone().multiplyScalar(-sgn * Math.cos(th)).add(V3(0, Math.sin(th), 0)).normalize();
    const n = new THREE.Vector3().crossVectors(d, new THREE.Vector3().crossVectors(V3(0, 1, 0), d)).normalize();
    // curl centre on the eye's top wire: hook start = curl - d*0.022 - n*0.0135
    const p0 = top.clone().addScaledVector(d, -0.022).addScaledVector(n, -0.0135);
    snapHook(bins, hw, p0, d, n);
    const fe = p0.clone().addScaledVector(d, -0.062);
    ferrule(bins, hw, fe, d);
    ends.push(fe.clone().addScaledVector(d, 0.004));
  }
  const [a, b] = ends;
  const pts = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = a.clone().lerp(b, t);
    p.y -= 4 * sag * t * (1 - t) + 0; // parabola through both ends
    pts.push(p);
  }
  bins.add(rmat, F.sweep(pts, G.circleProfile(ROPE_R, 22)));
}

function ropeLine(p) {
  const bins = new G.PartBin();
  const mat = finishMat(p.finish);
  const pair = p.pair === true || p.pair === 'true' || p.span != null;
  const span = Number(p.span ?? 1.2);
  const xs = pair ? [-span / 2, span / 2] : [0];
  const posts = xs.map((x) => ropePost(bins, mat, x, 0, { eyes: [90, 270, 0, 180] }));
  if (pair) hangingRope(bins, ropeMat(p.rope || 'bordeaux'), M.chrome(), posts[0].eyeAt[90], posts[1].eyeAt[270], Number(p.sag ?? 0.27));
  const group = new THREE.Group(); group.name = `afzetpaal koord ${p.finish || 'chroom'}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [xs[0] + 0.03, 0.9, 0.02], size: 0.24, azimuth: 40, elevation: 14 },
    meta: { kind: 'rope-post', pair, span },
    rig: S.seatRig(group, pair ? { default: { groundAO: { maxZenith: 60 } } } : {}),
  };
}

// ------------------------------------------------------------------------ loose rope on the floor
function looseRope(p) {
  const bins = new G.PartBin();
  const hw = M.chrome();
  const rmat = ropeMat(p.rope);
  // horseshoe opening towards the camera (+z, a little to the right): Catmull-Rom through a few
  // hand-placed points, resampled; the two legs splay and wander a little
  const ctrl = [[-0.3, 0.3], [-0.29, 0.12], [-0.25, -0.06], [-0.13, -0.19], [0.03, -0.215], [0.18, -0.15], [0.26, 0.0], [0.27, 0.16], [0.31, 0.31]];
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => V3(x, ROPE_R, z)), false, 'centripetal');
  const pts = curve.getSpacedPoints(120);
  const r0 = pts[0], r1 = pts[pts.length - 1];
  bins.add(rmat, F.sweep(pts, G.circleProfile(ROPE_R, 22)));
  // the ends: ferrule along the end tangent, the hook lying on its side, tipping down to the floor
  for (const [end, prev] of [[r0, pts[2]], [r1, pts[pts.length - 3]]]) {
    const d = end.clone().sub(prev).setY(0).normalize();
    const side = new THREE.Vector3().crossVectors(V3(0, 1, 0), d).normalize();
    const c0 = end.clone().setY(ROPE_R + 0.0026).addScaledVector(d, -0.004);
    const tip = ferrule(bins, hw, c0, d);
    const dd = d.clone().applyAxisAngle(side, 24 * DEG).normalize(); // shank tips down to the floor
    snapHook(bins, hw, tip.clone().addScaledVector(dd, -0.002), dd, side);
  }
  const group = new THREE.Group(); group.name = `afzetkoord velours ${p.rope || 'bordeaux'}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [r1.x, 0.02, r1.z], size: 0.2, azimuth: 30, elevation: 30 },
    meta: { kind: 'rope', color: p.rope },
    view: { hero: { azimuth: 24, elevation: 38, fill: 0.78 }, front: { elevation: 30 } },
    rig: S.seatRig(group, { default: { key: { azimuth: -40, elevation: 50 } } }),
  };
}

// ------------------------------------------------------------------------ wall hook (koord)
function wallHook(bins, mat, x, z, rotY = 0) {
  const T = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, 0, z);
  const R = 0.033;
  // domed rosette lying on its back, boss in the middle, eye ring standing up on a neck
  const ros = [[0.0001, 0], [R - 0.002, 0], [R, 0.002], [R - 0.001, 0.005], [R - 0.008, 0.009], [0.016, 0.0115], [0.0115, 0.0125], [0.0115, 0.022], [0.0095, 0.025], [0.0001, 0.0255]];
  bins.add(mat, G.lathe(ros, 64).applyMatrix4(T));
  const ring = new THREE.TorusGeometry(0.0125, 0.0032, 12, 32);
  ring.translate(0, 0.0255 + 0.0125 + 0.0012, 0);
  bins.add(mat, ring.applyMatrix4(T));
  // two countersunk screw holes (dark) in the rosette
  const hole = F.plastic('#0C0C0D', 0.7);
  for (const s of [-1, 1]) bins.add(hole, G.lathe([[0.0001, 0], [0.0028, 0], [0.0028, 0.0041], [0.0001, 0.0041]], 16).translate(s * 0.0225, 0.006, 0).applyMatrix4(T));
}
function screwsAndPlugs(bins, x, z, rotY = 0) {
  const T = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, 0, z);
  const steel = M.chrome(), plug = F.plastic('#9EA1A3', 0.55);
  for (let i = 0; i < 2; i++) {
    const zz = i * 0.03;
    // screw lying along x: countersunk head + ribbed shank
    bins.add(steel, F.latheAt([[0.0001, 0], [0.0038, 0], [0.0038, 0.0008], [0.0019, 0.003], [0.0019, 0.031], [0.0005, 0.035], [0.0001, 0.035]], V3(0, 0.0038, zz), V3(1, 0, 0), 14).applyMatrix4(T));
    for (let k = 0; k < 13; k++) bins.add(steel, new THREE.TorusGeometry(0.00195, 0.0004, 4, 12).rotateY(Math.PI / 2).translate(0.006 + k * 0.0021, 0.0038, zz).applyMatrix4(T));
    // plug lying beside it
    bins.add(plug, F.latheAt([[0.0001, 0], [0.003, 0], [0.0034, 0.004], [0.0031, 0.008], [0.0035, 0.012], [0.0031, 0.016], [0.0035, 0.02], [0.0031, 0.024], [0.0042, 0.026], [0.0042, 0.028], [0.0001, 0.028]], V3(0.05, 0.0036, zz + 0.006), V3(1, 0, 0), 14).applyMatrix4(T));
  }
}

// ------------------------------------------------------------------------ wall unit with belt
function labelTex(text) {
  return cached(`azlabel:${text}`, () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#F2F1EC'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#1A1A1C'; g.font = '700 74px "DejaVu Sans", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  });
}
function wallUnit(bins, group, x, z, { beltColor = 'zwart', len = 2, rotY = 0 } = {}) {
  const T = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, 0, z);
  const abs = F.plastic('#18181A', 0.4), plate = F.powder('zwart'), slot = F.plastic('#050505', 0.8);
  const belt = F.beltWebbing(beltColor);
  // wall plate (vertical, back) and the case in front of it; the unit stands on the plate's lower edge
  const W = 0.1, Hc = 0.15, D = 0.07;
  bins.add(plate, G.roundedBox(0.084, 0.205, 0.004, 0.002).translate(0, 0.1025, -D / 2 - 0.002).applyMatrix4(T));
  for (const sy of [0.025, 0.18]) bins.add(slot, G.lathe([[0.0001, 0], [0.0035, 0], [0.0035, 0.0016], [0.0001, 0.0016]], 12).rotateX(Math.PI / 2).translate(0, sy, -D / 2 + 0.0002).applyMatrix4(T));
  const yc = 0.028 + Hc / 2;
  bins.add(abs, F.cushion(W, Hc, D, { r: 0.016, puff: 0, seg: [10, 14, 10] }).translate(0, yc, 0).applyMatrix4(T));
  // belt mouth on the right side, clip parked in it is replaced by the belt pulled out
  bins.add(slot, G.roundedBox(0.006, 0.058, 0.012, 0.002).translate(W / 2 + 0.001, yc + 0.02, 0).applyMatrix4(T));
  bins.add(abs, F.cushion(0.016, 0.07, 0.03, { r: 0.005, puff: 0, seg: [4, 8, 4] }).translate(W / 2 + 0.004, yc + 0.02, 0).applyMatrix4(T));
  // label on the front: "2 m" / "3 m"
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.025), new THREE.MeshPhysicalMaterial({ map: labelTex(`${len} m`), roughness: 0.55, name: 'label' }));
  lab.position.set(0, yc - 0.035, D / 2 + 0.0006); lab.applyMatrix4(T); lab.castShadow = false; lab.receiveShadow = true;
  group.add(lab);
  // belt: out of the mouth, a soft bend down to the floor, then lying flat curving to the right
  const bw = 0.05, bt = 0.0012;
  const yM = yc + 0.02;
  const x0 = W / 2 + 0.012;
  // on the floor the belt lies on its face: build the standing part as a ribbon, the lying part separately
  const ribbon = (pts, up) => {
    const L = []; for (const q of pts) L.push(q);
    return G.surface((u, v, o) => {
      const f = u * (L.length - 1), i = Math.min(L.length - 2, Math.floor(f)), t = f - i;
      const q = L[i].clone().lerp(L[i + 1], t);
      const n = up(u);
      o.copy(q).addScaledVector(n, (v - 0.5) * bw);
    }, (L.length - 1) * 4, 2);
  };
  // standing part: belt plane vertical (width along y at the mouth, then twisting onto the floor)
  const stand = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; stand.push(V3(x0 + 0.11 * t, yM * (1 - t) ** 1.6 + bt, 0.01 * t)); }
  const g1 = ribbon(stand, (u) => { const a = u * Math.PI / 2; return V3(0, Math.cos(a), -Math.sin(a)).normalize(); });
  const lie = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; lie.push(V3(x0 + 0.11 + 0.2 * t, bt, 0.01 + 0.09 * t * t)); }
  const g2 = ribbon(lie, () => V3(0, 0, -1));
  // the webbing material is double sided: one ribbon per stretch (a flipped copy z-fought with it)
  for (const g of [g1, g2]) bins.add(belt, g.applyMatrix4(T));
  // clip at the belt end, lying flat
  const e = lie[lie.length - 1], ed = e.clone().sub(lie[lie.length - 3]).normalize();
  const clip = F.cushion(0.03, 0.008, bw + 0.012, { r: 0.0035, puff: 0, seg: [6, 4, 8] });
  clip.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.atan2(-ed.z, ed.x))).translate(e.x + ed.x * 0.014, 0.004, e.z + ed.z * 0.014);
  bins.add(F.stainlessPolished(), clip.applyMatrix4(T));
  // receiver plate for the clip (goes on the opposite wall), lying in front
  const rp = new THREE.Matrix4().makeRotationY(-0.35).setPosition(-0.03, 0, 0.12).premultiply(T);
  bins.add(plate, G.roundedBox(0.05, 0.004, 0.11, 0.002).translate(0, 0.002, 0).applyMatrix4(rp));
  bins.add(slot, G.roundedBox(0.03, 0.006, 0.012, 0.002).translate(0, 0.006, 0.012).applyMatrix4(rp));
  bins.add(abs, G.roundedBox(0.036, 0.012, 0.03, 0.004).translate(0, 0.01, 0.012).applyMatrix4(rp));
}

// ------------------------------------------------------------------------ sign holder on a post
function signTex(orient) {
  return cached(`azsign:${orient}`, () => {
    const land = orient !== 'staand';
    const c = document.createElement('canvas'); c.width = land ? 1188 : 840; c.height = land ? 840 : 1188;
    const g = c.getContext('2d');
    g.fillStyle = '#F5F3EE'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1C1D20';
    const cx = c.width / 2;
    g.font = `800 ${land ? 210 : 170}px "DejaVu Sans", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('INGANG', cx, c.height * (land ? 0.38 : 0.3));
    // arrow pictogram
    const ay = c.height * (land ? 0.72 : 0.66), aw = land ? 380 : 360, ah = land ? 120 : 120;
    g.beginPath();
    g.moveTo(cx - aw / 2, ay - ah * 0.22); g.lineTo(cx + aw / 2 - ah * 0.9, ay - ah * 0.22); g.lineTo(cx + aw / 2 - ah * 0.9, ay - ah * 0.62);
    g.lineTo(cx + aw / 2, ay); g.lineTo(cx + aw / 2 - ah * 0.9, ay + ah * 0.62); g.lineTo(cx + aw / 2 - ah * 0.9, ay + ah * 0.22); g.lineTo(cx - aw / 2, ay + ah * 0.22);
    g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  });
}
function signHolder(bins, group, x, z, { format = 'A4', orient = 'liggend', finish = 'zwart', H = 0.99 } = {}) {
  const fmat = finish === 'rvs' ? F.stainlessPolished() : F.powder('zwart');
  const A3 = String(format).toUpperCase() === 'A3';
  let w = A3 ? 0.42 : 0.297, h = A3 ? 0.297 : 0.21;
  if (orient === 'staand') [w, h] = [h, w];
  const pf = 0.016, ft = 0.012; // snap-frame profile: 16 mm wide, 12 mm deep
  const tilt = 20 * DEG;
  // stem from the post top, hinge knuckle, bracket plate behind the frame
  const yH = H + 0.035;
  bins.add(fmat, G.tube(V3(x, H - 0.004, z), V3(x, yH, z), 0.009, 18));
  bins.add(fmat, G.tube(V3(x - 0.03, yH, z), V3(x + 0.03, yH, z), 0.009, 18));
  // the frame in its own plane: u across (x), v up the face, n out of the face
  const n = V3(0, Math.sin(tilt), Math.cos(tilt)), up = V3(0, Math.cos(tilt), -Math.sin(tilt));
  // the frame sits in front of the knuckle: the hinge and stem stay behind the sign
  const c0 = V3(x, yH + 0.012, z + 0.03).addScaledVector(up, h / 2 + pf - 0.03);
  const toW = (u, v, d) => c0.clone().add(V3(u, 0, 0)).addScaledVector(up, v).addScaledVector(n, d);
  // back plate and bracket
  bins.add(fmat, G.roundedBox(w + 2 * pf - 0.006, h + 2 * pf - 0.006, 0.003, 0.003).applyMatrix4(F.basis(toW(0, 0, -ft / 2 + 0.0015), V3(1, 0, 0), up)));
  bins.add(fmat, G.roundedBox(0.07, 0.07, 0.006, 0.003).applyMatrix4(F.basis(toW(0, -h / 2 - pf + 0.035, -ft / 2 - 0.003), V3(1, 0, 0), up)));
  for (const s of [-1, 1]) bins.add(fmat, G.roundedBox(0.006, 0.045, 0.03, 0.002).translate(x + s * 0.02, yH + 0.012, z + 0.008));
  // frame: rounded profile swept round the rectangle
  const path = F.rectPath(w + pf, h + pf, 0.006, 0, 6).map((q) => toW(q.x, q.z, 0));
  bins.add(fmat, F.sweep(path, G.roundedRectProfile(ft, pf, 0.005, 3), { closed: true, up: n }));
  // sign insert under a clear-ish cover (satin paper print)
  const sm = new THREE.MeshPhysicalMaterial({ map: signTex(orient), roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.12, name: 'sign insert' });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm);
  pl.applyMatrix4(F.basis(toW(0, 0, ft / 2 - 0.004), V3(1, 0, 0), up));
  pl.castShadow = true; pl.receiveShadow = true;
  group.add(pl);
  return { top: c0.y + h / 2 + pf };
}

function partsScene(p) {
  const toks = (Array.isArray(p.parts) ? p.parts : [p.parts]).map((s) => String(s).toLowerCase());
  const has = (...k) => toks.some((t) => k.some((q) => t.includes(q)));
  const wantHook = has('wandhaak', 'koord');
  const wantUnit = has('wandunit', 'unit') || toks.includes('m') || has('trekband');
  const wantSign = has('bordhouder', 'liggend', 'staand');
  const bins = new G.PartBin();
  const group = new THREE.Group();
  const finishes = ['chroom', 'messing', 'zwart'];
  const many = [wantHook, wantUnit, wantSign].filter(Boolean).length > 1;
  let view = null, detail = null;
  if (many) {
    // group shot as a flat-lay, so every part is shown at its own size next to the others: the sign
    // holder lying face up (frame, hinge and stem), the wall unit standing on its plate edge with the
    // belt out, two wall hooks (chroom, zwart) with screws and plugs
    const sub = new THREE.Group(), tb = new G.PartBin();
    signHolder(tb, sub, 0, 0, { format: 'A4', orient: 'liggend', H: 0 });
    tb.build(sub);
    sub.rotation.x = -70 * DEG; sub.updateMatrixWorld(true);
    const sb = new THREE.Box3().setFromObject(sub), sc = sb.getCenter(V3());
    const holder = new THREE.Group(); holder.add(sub);
    sub.position.set(-sc.x, -sb.min.y, -sc.z);
    holder.rotation.y = 0.12; holder.position.set(-0.17, 0, -0.04);
    group.add(holder);
    wallUnit(bins, group, 0.21, -0.06, { len: 2, rotY: -0.35 });
    wallHook(bins, M.chrome(), 0.0, 0.2, 0.3);
    wallHook(bins, finishMat('zwart'), 0.1, 0.25, 1.1);
    screwsAndPlugs(bins, -0.16, 0.19, -0.1);
    view = { hero: { azimuth: 28, elevation: 36, fill: 0.8 } };
    detail = { target: [0.2, 0.1, 0.05], size: 0.3, azimuth: 30, elevation: 16 };
    group.name = 'onderdelen afzetsysteem';
  } else if (wantSign) {
    const orient = p.orient || (has('staand') ? 'staand' : 'liggend');
    beltPostAt(bins, beltMats(p.postFinish), 0, 0);
    signHolder(bins, group, 0, 0, { format: p.format || 'A4', orient, finish: p.frameFinish || 'zwart' });
    detail = { target: [0, 1.15, 0], size: 0.5, azimuth: 30, elevation: 12 };
    group.name = `bordhouder ${p.format || 'A4'} ${orient}`;
  } else if (wantUnit) {
    wallUnit(bins, group, 0, 0, { len: Number(p.beltLength ?? p.length ?? 2) > 2.5 ? 3 : 2, beltColor: p.belt || 'zwart' });
    view = { hero: { elevation: 22, fill: 0.74 } };
    detail = { target: [0.05, 0.1, 0.03], size: 0.2, azimuth: 30, elevation: 16 };
    group.name = 'wandunit trekband';
  } else {
    // three finishes in a loose diagonal row, screws and plugs beside the chrome one
    finishes.forEach((f, i) => wallHook(bins, finishMat(f), -0.085 + i * 0.085, -0.03 + i * 0.03, 0.2 + i * 0.35));
    screwsAndPlugs(bins, -0.06, 0.07, -0.15);
    view = { hero: { elevation: 34, fill: 0.72 } };
    detail = { target: [0, 0.02, 0], size: 0.12, azimuth: 30, elevation: 30 };
    group.name = 'wandhaak koord';
  }
  bins.build(group);
  return { object: group, detail, meta: { kind: 'stanchion-parts', parts: toks }, view, rig: S.seatRig(group) };
}
// a belt post (stanchion.js) at (x, z), belt retracted
function beltPostAt(bins, mats, x, z, H = 0.99) {
  const tmp = new G.PartBin();
  beltPost(tmp, mats, x, H, { mouth: true, slotTowards: 1 });
  for (const [m, list] of tmp.bins) for (const g of list) bins.add(m, g.translate(0, 0, z));
  // the clip parked in the mouth
  bins.add(mats.polished, F.cushion(0.026, 0.062, 0.012, { r: 0.004, puff: 0, seg: [6, 8, 4] }).translate(x + 0.0315 + 0.026, H - 0.1, z));
}
function beltMats(finish = 'rvs') {
  const black = finish === 'zwart';
  return { tube: black ? F.powder('zwart') : F.stainless(), polished: black ? F.powder('zwart') : F.stainlessPolished(), rubber: M.rubber('#151515'), abs: F.plastic('#141414', 0.42), slot: F.plastic('#050505', 0.8) };
}

export function stanchionParts(p = {}) {
  if (p.parts) return partsScene(p);
  if (String(p.only || '').toLowerCase() === 'rope' || (p.rope && !p.pair && !p.head)) return looseRope(p);
  return ropeLine(p);
}
