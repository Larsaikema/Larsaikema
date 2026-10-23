// Onderdelen voor stoelen en barkrukken (spare parts per chair model), as packshots on the studio floor.
//
// { part, chair, color, count }
//   part 'zitting', chair 'barkruk-inklapbaar'  the loose seat of the folding bar stool: black faux-leather pad
//        (38 x 36 x 6 cm, as on barStool style 'klap') on its black moulded base plate. It lies a little behind
//        and to the left of the origin, so an `items` shot can put a set of foot caps in front of it
//   part 'zitting', chair 'klapstoel-wedding', color wit | zwart   the click-in seat of the weddingstoel: padded
//        vinyl cushion with piping (43 x 42 x 5 cm, as on chair style 'wedding') on the moulded resin seat panel
//        with its four snap lugs; tipped up against nothing: it lies flat, slightly turned
//   part 'onderbeugel', chair 'barkruk-inklapbaar'  the footrest bracket: a black powder-coated Ø 19 mm U tube
//        (44 cm across, 13 cm legs) with flattened, drilled ends that bolt to the clamps
//   part 'buisklem', count (default 2)  the bracket clamps: black moulded split clamps for the Ø 25 mm leg with
//        two ears, a zinc-plated M6 bolt and nut
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const AZ = 34;

function resin(color) {
  const c = String(color || 'wit').toLowerCase();
  const hex = c === 'zwart' ? '#1C1C1E' : c === 'wit' ? '#EFEEE9' : M.resolveColor(color, '#EFEEE9');
  return K.cached(`sp-resin:${hex}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.34, specularIntensity: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.3, name: `resin ${hex}` });
    m.userData.envSpec = 0.6;
    return m;
  });
}

function barStoolSeat(B) {
  const W = 0.38, D = 0.36, T = 0.06;
  const leather = S.leatherMat('#202022');
  const plate = F.plastic('#111111', 0.6);
  B.add(plate, G.roundedBox(W - 0.05, 0.012, D - 0.03, 0.004).translate(0, 0.006, 0));
  const seat = S.softBlock(W, T, D, { r: 0.022, crown: 0.008, crownBottom: 0.002, belly: 0.003, gather: 0.0012, uneven: 0.0006, seed: 7 });
  B.add(leather, seat.translate(0, 0.008 + T / 2, 0));
  return { W, D, H: 0.008 + T };
}

function weddingSeat(B, color) {
  const W = 0.43, D = 0.42, T = 0.05;
  const mat = resin(color);
  const vinylHex = String(color || 'wit').toLowerCase() === 'zwart' ? '#1E1E20' : '#ECEAE4';
  const vinyl = S.leatherMat(vinylHex);
  // moulded seat panel with a raised rim and four snap lugs underneath (the panel rests on the lugs)
  const yl = 0.012;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lug = G.roundedBox(0.03, yl, 0.012, 0.003); lug.translate(sx * 0.17, yl / 2, sz * 0.165); B.add(mat, lug);
    const hook = G.roundedBox(0.03, 0.004, 0.006, 0.0015); hook.translate(sx * 0.17, 0.002, sz * (0.165 + 0.007)); B.add(mat, hook);
  }
  B.add(mat, G.roundedBox(0.39, 0.012, 0.38, 0.005).translate(0, yl + 0.006, 0));
  B.add(mat, F.sweep(F.rectPath(0.405, 0.395, 0.03, yl + 0.012, 8), G.roundedRectProfile(0.008, 0.012, 0.003, 2), { closed: true }));
  const seat = S.softBlock(W, T, D, { r: 0.02, crown: 0.01, belly: 0.003, gather: 0.0016, uneven: 0.0008, seed: 17, seg: [70, 12, 66] });
  const sy = yl + 0.012 + T / 2;
  B.add(vinyl, seat.translate(0, sy, 0));
  B.add(vinyl, F.sweep(S.weltPath(seat.userData.shape, 1, { cr: 0.0032 }).map((q) => q.add(V3(0, sy, 0))), G.circleProfile(0.0032, 10), { closed: true }));
  return { W, D, H: sy + T / 2 };
}

function footrestBracket(B) {
  const steel = F.powder('zwart');
  const r = 0.0095, Wd = 0.44, Lg = 0.13;
  const x = Wd / 2 - r;
  const pts = F.filletPath([V3(-x, r, Lg - 0.02), V3(-x, r, 0), V3(x, r, 0), V3(x, r, Lg - 0.02)], 0.045, 12);
  B.add(steel, F.sweep(pts, G.circleProfile(r, 22)));
  // flattened, drilled ends
  for (const sx of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(-0.011, 0); sh.lineTo(0.011, 0); sh.lineTo(0.011, -0.03); sh.absarc(0, -0.03, 0.011, 0, Math.PI, true); sh.lineTo(-0.011, 0);
    const h = new THREE.Path(); h.absarc(0, -0.03, 0.0035, 0, TAU, true); sh.holes.push(h);
    const tab = K.extrudeY(sh, 0.005, { y0: 0, bevel: 0.0008, bevelSegs: 1, curveSegs: 24 });
    tab.translate(sx * x, 0, Lg - 0.022);
    B.add(steel, tab);
    // the squeeze from tube to flat
    B.add(steel, G.lathe([[0.0001, 0], [r, 0], [r * 0.7, 0.012], [0.004, 0.016], [0.0001, 0.016]], 22).rotateX(Math.PI / 2).translate(sx * x, r * 0.75, Lg - 0.022).scale(1, 0.8, 1));
  }
  return { W: Wd, D: Lg + 0.02, H: 2 * r };
}

// split clamp for the Ø 25 leg with two ears, M6 bolt and nut; lying flat, centred at the origin
function clamp(bin, plast, zinc, { open = 0 } = {}) {
  const Ri = 0.0128, Ro = 0.0178, e0 = 0.0016, e1 = 0.0062, ex = Ro + 0.013, H = 0.022;
  const ai = Math.asin(e0 / Ri), ao = Math.asin(e1 / Ro);
  const sh = new THREE.Shape();
  sh.moveTo(ex, e0); sh.lineTo(ex, e1); sh.lineTo(Math.cos(ao) * Ro, e1);
  sh.absarc(0, 0, Ro, ao, TAU - ao, false);
  sh.lineTo(ex, -e1); sh.lineTo(ex, -e0); sh.lineTo(Math.cos(ai) * Ri, -e0);
  sh.absarc(0, 0, Ri, -ai, ai - TAU, true);
  sh.lineTo(ex, e0);
  const body = K.extrudeY(sh, H, { y0: 0, bevel: 0.001, bevelSegs: 2, curveSegs: 64 });
  bin.add(plast, body);
  // moulded grip ribs round the outside
  for (let k = 0; k < 10; k++) { const a = Math.PI * 0.35 + (k / 9) * Math.PI * 1.3; const rib = G.roundedBox(0.0016, H * 0.7, 0.003, 0.0006); rib.rotateY(-a); rib.translate(Math.cos(a) * (Ro + 0.0005), H / 2, -Math.sin(a) * (Ro + 0.0005)); bin.add(plast, rib); }
  // M6 bolt through the ears (axis along shape y -> world -z), head on one side, nut on the other
  const bx = Ro + 0.0072, y = H / 2;
  bin.add(zinc, G.tube(V3(bx, y, -(e1 + 0.0035)), V3(bx, y, e1 + 0.009), 0.0029, 14));
  const head = K.hexNutGeo(0.01, 0.004, 0); head.rotateX(Math.PI / 2); head.translate(bx, y, -(e1 + 0.002)); bin.add(zinc, head);
  const nut = K.hexNutGeo(0.01, 0.005, 0.0029); nut.rotateX(Math.PI / 2); nut.translate(bx, y, e1 + 0.0025); bin.add(zinc, nut);
  const washer = G.lathe([[0.0032, 0], [0.006, 0], [0.006, 0.0012], [0.0032, 0.0012], [0.0032, 0]], 24); washer.rotateX(-Math.PI / 2); washer.translate(bx, y, e1); bin.add(zinc, washer);
  return bin;
}

export function seatParts(p = {}) {
  const part = String(p.part || 'zitting').toLowerCase();
  const chair = String(p.chair || 'barkruk-inklapbaar').toLowerCase();
  const B = new G.PartBin();
  let info, rig, view = { hero: { elevation: 26 } }, detail;
  if (part === 'zitting' && chair.includes('wedding')) {
    info = weddingSeat(B, p.color || 'wit');
    const white = String(p.color || 'wit').toLowerCase() !== 'zwart';
    rig = L5.goodsRig({ tone: white ? 'white' : 'black', size: 0.35 });
    detail = { target: [0.18, 0.05, 0.18], size: 0.16, azimuth: 30, elevation: 22 };
  } else if (part === 'zitting') {
    info = barStoolSeat(B);
    rig = L5.goodsRig({ tone: 'black', size: 0.35 });
    detail = { target: [0.16, 0.05, 0.16], size: 0.16, azimuth: 30, elevation: 22 };
  } else if (part === 'onderbeugel' || part === 'beugel') {
    info = footrestBracket(B);
    rig = L5.goodsRig({ tone: 'black', size: 0.3, extra: L5.flatLayRig().default });
    view = { hero: { elevation: 34 } };
    detail = { target: [0.2, 0.01, 0.1], size: 0.12, azimuth: 30, elevation: 30 };
  } else if (part === 'buisklem' || part === 'beugelklem' || part === 'klem') {
    const n = Math.max(1, Math.min(6, Math.round(Number(p.count ?? 2))));
    const plast = SG.moulded('#151516', { rough: 0.42, spec: 0.55 }), zinc = SG.zincSG({ rough: 0.3 });
    for (let k = 0; k < n; k++) {
      const sub = clamp(new G.PartBin(), plast, zinc);
      const yaw = (k % 2 ? 200 : -25) * DEG;
      const right = V3(Math.cos(AZ * DEG), 0, -Math.sin(AZ * DEG));
      const at = right.clone().multiplyScalar((k - (n - 1) / 2) * 0.062);
      const m = new THREE.Matrix4().makeTranslation(at.x, 0, at.z).multiply(new THREE.Matrix4().makeRotationY(yaw));
      for (const [mat, l] of sub.bins) for (const g of l) { g.applyMatrix4(m); B.add(mat, g); }
    }
    info = { W: 0.12, D: 0.05, H: 0.022 };
    rig = L5.goodsRig({ tone: 'black', size: 0.1, extra: { exposure: 1.1, ...L5.flatLayRig().default } });
    view = { hero: { elevation: 36 } };
    detail = { target: [0, 0.011, 0], size: 0.07, azimuth: 30, elevation: 30 };
  } else {
    throw new Error(`seatParts: unknown part ${part}`);
  }
  const g = K.finish(B, `seatParts ${part} ${chair}`);
  // the loose bar-stool seat sits behind and to the left of the origin, leaving the front right free for
  // the foot caps of the combined shot (an `items` spec without positions); framing recentres it alone
  if (part === 'zitting' && !chair.includes('wedding')) { g.rotation.y = 18 * DEG; g.position.set(-0.27, 0, -0.17); }
  else if (part === 'zitting') g.rotation.y = -12 * DEG;
  return { object: g, detail, view, rig, meta: { part, chair, ...info } };
}
