// Loose parts without a model of their own (merchandising review 3: every Uitvoering of a mixed-parts product gets
// its own image), as flat-lays on the studio floor.
//
// { parts: 'kabel' | 'verlengkabel' | 'aansluitsnoer' | 'draaiharing', count }
//   kabel          flat 2-core rubber cable H05RN-F 2 x 1,5 mm² (the prikkabel cable), black, in a loose coil of
//                  ~3 turns with two cut ends (sold per metre)
//   verlengkabel   round 3-core rubber cable (Ø 8,5 mm), black, coiled in ~4 loose turns; a rubber Schuko plug on
//                  one end and a rubber coupler with a hinged splash lid on the other (IP44)
//   aansluitsnoer  power lead of the LED-lichtslang: 1,5 m round black lead in a loose S, a rubber plug on one end
//                  and the clear moulded connector (two copper pins inside) on the other
//   draaiharing    screw peg: Ø 8 mm galvanised steel rod, a closed eye on top, a straight shank and a helix of
//                  ~5 turns ending in a point; `count` pegs (default 4) lying side by side, a little fanned
//   haringtrekker  lever peg puller in use: a long Ø 16 mm galvanised peg standing in the floor with a bent hook head,
//                  the red powder-coated lever (25 mm square tube, black grip) slanting up from a notched claw under
//                  the hook, propped on a fulcrum leg with a foot plate
//   clips          25 black nail-in clips for flat cable (saddle 12 x 7 mm, steel nail through a side lug), knolled
//                  in five rows of five, lying on their side
//   stekkerdoos    black 3-way power strip, IP44: three sockets with closed hinged grey lids on top, the lead leaves
//                  one end through a strain relief and lies in a loose loop to a rubber plug
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as L from '../js/lightKit.js';
import * as SG from '../js/softGoods.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;

// loose flat coil on the floor: radius r0 -> r1 over `turns`, y = h (centre height of the cable)
function coil(turns, r0, r1, h, { tail = 0.1, seed = 3, n = 260, hub = false } = {}) {
  const R = rng(seed);
  const ctrl = [];
  const m = Math.round(turns * 10);
  for (let k = 0; k <= m; k++) {
    const t = k / m;
    const a = t * turns * TAU;
    const r = r0 + (r1 - r0) * t + 0.006 * Math.sin(7 * t + R());
    ctrl.push(V3(Math.cos(a) * r, h, Math.sin(a) * r));
  }
  // the inner end stays inside the coil (a lead across the turns would cut through them); the outer end leaves the coil
  // towards the viewer
  const last = ctrl[ctrl.length - 1];
  ctrl.push(V3(last.x + 0.03, h, last.z + tail * 0.6), V3(last.x + 0.06, h, last.z + tail));
  // hub: the inner end turns into the middle of the coil (where a plug can lie without touching the turns)
  if (hub) ctrl.unshift(V3(ctrl[0].x * 0.25, h, ctrl[0].z * 0.25 - 0.02));
  return K.smoothPath(ctrl, n);
}

// matrix for a plug/coupler lying on the floor at the end q0 of a lead (q1 a point further along it): local -Y (body)
// points outward, local +Y back along the lead, local Z up
function placeEnd(q0, q1, lift) {
  const d = q0.clone().sub(q1).setY(0).normalize();
  const yAxis = d.clone().negate();
  const zAxis = V3(0, 1, 0);
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
  return new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis).setPosition(q0.x, lift, q0.z);
}

// extruded plate in the XZ plane from a 2D outline (x, z), thickness t upwards from y0
function plateXZ(outline, t, y0, holes = []) {
  const sh = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1, curveSegments: 16 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, y0, 0);
  return geo;
}

// rubber coupler (contactdoos) with a hinged lid; local: lead enters at the origin from +Y, body to -Y
function coupler(add, rub, lid) {
  add(rub, G.lathe([[0.0001, 0], [0.0062, 0], [0.0085, -0.012], [0.0135, -0.024], [0.0215, -0.036], [0.0235, -0.05], [0.0235, -0.074], [0.0001, -0.074]], 40));
  for (let k = 0; k < 5; k++) { const t = new THREE.TorusGeometry(0.0084 - k * 0.0006, 0.0011, 6, 24); t.rotateX(Math.PI / 2); t.translate(0, -0.006 - k * 0.0028, 0); add(rub, t); }
  // splash lid closed over the socket face, hinge lug on one side
  const l = G.lathe([[0.0001, -0.074], [0.0228, -0.074], [0.0232, -0.077], [0.0215, -0.081], [0.0001, -0.081]], 40); add(lid, l);
  const hinge = G.roundedBox(0.012, 0.012, 0.008, 0.002); hinge.translate(0, -0.07, 0.024); add(lid, hinge);
}

export function miscParts(p = {}) {
  let parts = p.parts || ['kabel'];
  if (typeof parts === 'string') parts = [parts];
  const part = parts[0];
  const g = new THREE.Group(); g.name = `miscParts ${part}`;
  const B = new G.PartBin();
  const add = (mat, geo, m) => { if (m) geo.applyMatrix4(m); B.add(mat, geo); };
  const rub = L.cableRubber('#161616', 0.6);
  const pin = SG.aluSG({ tone: '#D2C8A8', rough: 0.25 });
  let detail = { target: [0, 0.01, 0], size: 0.14, azimuth: 20, elevation: 35 };

  if (part === 'kabel') {
    const pts = coil(3.1, 0.085, 0.13, 0.0032, { seed: 5 });
    add(rub, L.flatCable(pts, rub));
    // the copper cores show at the two cut ends
    const cu = K.cached('mp-cu', () => new THREE.MeshPhysicalMaterial({ color: '#C2763C', metalness: 1, roughness: 0.32, name: 'copper' }));
    for (const [a, b] of [[pts[0], pts[1]], [pts[pts.length - 1], pts[pts.length - 2]]]) {
      const d = a.clone().sub(b).normalize();
      for (const s of [-1, 1]) {
        const side = V3(-d.z, 0, d.x).multiplyScalar(s * 0.0029);
        const c = new THREE.CylinderGeometry(0.0009, 0.0009, 0.004, 10);
        c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d));
        c.translate(a.x + side.x + d.x * 0.0015, 0.0032, a.z + side.z + d.z * 0.0015);
        add(cu, c);
      }
    }
  } else if (part === 'verlengkabel' || part === 'aansluitsnoer') {
    const ext = part === 'verlengkabel';
    const r = ext ? 0.00425 : 0.0032;
    const pts = ext ? coil(4.2, 0.115, 0.16, r, { seed: 11, tail: 0.14, hub: true })
      : coil(2.2, 0.055, 0.075, r, { seed: 7, tail: 0.08, hub: true, n: 180 });
    add(rub, K.tubeAlong(pts, r, 14, { up: V3(0, 1, 0) }));
    // plug on the first end, lying on the floor pointing away from the cable
    const T0 = placeEnd(pts[0], pts[4], 0.0189);
    L.rubberPlug((m, geo) => add(m, geo, T0), rub, pin);
    const n = pts.length - 1;
    if (ext) {
      const T1 = placeEnd(pts[n], pts[n - 4], 0.0235);
      coupler((m, geo) => add(m, geo, T1), rub, SG.moulded('#1C1C1C', { rough: 0.45 }));
    } else {
      // clear moulded connector with two copper pins, the far end of the lead
      const T1 = placeEnd(pts[n], pts[n - 4], 0.0085);
      const clear = L.clearGlass({ tint: '#EEF2F0', coverage: 0.5 });
      add(clear, G.lathe([[0.0001, 0], [0.0042, 0], [0.0075, -0.008], [0.0085, -0.014], [0.0085, -0.042], [0.0078, -0.045], [0.0001, -0.045]], 32), T1);
      const cu = K.cached('mp-cu2', () => new THREE.MeshPhysicalMaterial({ color: '#C2763C', metalness: 1, roughness: 0.3, name: 'copper' }));
      for (const s of [-1, 1]) { const c = new THREE.CylinderGeometry(0.0007, 0.0007, 0.03, 10); c.translate(s * 0.0028, -0.03, 0); add(cu, c, T1); }
    }
    detail = { target: [pts[0].x, 0.015, pts[0].z], size: ext ? 0.12 : 0.09, azimuth: 25, elevation: 30 };
  } else if (part === 'draaiharing') {
    const galv = SG.galvSG ? SG.galvSG({ cell: 0.006, dull: 0.4 }) : SG.zincSG();
    const n = Math.max(1, Math.min(6, Math.round(Number(p.count ?? 4))));
    const rr = 0.004;
    for (let i = 0; i < n; i++) {
      // one peg lying along X (eye at x = 0, point at x = 0.3), helix axis along X; lifted so the helix rests on the floor
      const Rh = 0.022, Lh = 0.2, turns = 5;
      const pts = [];
      pts.push(V3(0.02, 0, 0), V3(0.09, 0, 0));
      for (let k = 0; k <= 160; k++) {
        const t = k / 160;
        const a = t * turns * TAU;
        const fade = Math.min(1, t * 6);                          // shank flows into the helix
        const taper = 1 - 0.55 * Math.pow(t, 3);                  // helix narrows towards the point
        pts.push(V3(0.1 + t * Lh, Math.sin(a) * Rh * fade * taper, Math.cos(a) * Rh * fade * taper - (1 - fade) * 0));
      }
      const path = K.smoothPath(pts, 320);
      const geo = K.tubeAlong(path, rr, 10, { up: V3(0, 1, 0) });
      // closed eye on top of the shank
      const eye = new THREE.TorusGeometry(0.018, rr, 10, 40); eye.rotateY(Math.PI / 2); eye.translate(0, 0, 0);
      eye.rotateZ(Math.PI / 2); eye.translate(0.002, 0, 0);
      const peg = K.mergeRaw([geo, eye]);
      const tip = new THREE.ConeGeometry(rr, 0.012, 10); tip.rotateZ(-Math.PI / 2);
      const end = path[path.length - 1]; tip.translate(end.x + 0.006, end.y, end.z);
      const one = K.mergeRaw([peg, tip]);
      const M4 = new THREE.Matrix4().makeRotationY((i - (n - 1) / 2) * 0.12).setPosition(-0.15, Rh + rr, (i - (n - 1) / 2) * 0.062);
      add(galv, one, M4);
    }
    detail = { target: [0, 0.03, 0], size: 0.2, azimuth: 25, elevation: 35 };
  } else if (part === 'haringtrekker') {
    const galv = SG.galvSG ? SG.galvSG({ cell: 0.006, dull: 0.4 }) : SG.zincSG();
    const paint = L.diecast('#A3241B', { rough: 0.5, coat: 0.35 });
    const grip = L.cableRubber('#151515', 0.75);
    // the peg: Ø 16 mm, 26 cm above the floor, the top bent over into a hook away from the lever (-X)
    const rp = 0.008, top = 0.26, Rh = 0.026;
    const pp = [V3(0, -0.02, 0), V3(0, top * 0.5, 0), V3(0, top, 0)];
    for (let k = 1; k <= 14; k++) { const a = (k / 14) * Math.PI * 1.05; pp.push(V3(-Rh + Math.cos(a) * Rh, top + Math.sin(a) * Rh, 0)); }
    add(galv, K.tubeAlong(K.smoothPath(pp, 120), rp, 16, { up: V3(0, 0, 1) }));
    const end = pp[pp.length - 1];
    add(galv, G.lathe([[0.0001, 0], [rp, 0], [rp * 0.96, 0.002], [0.0001, 0.0025]], 16).translate(end.x, end.y - 0.0025, end.z));
    // claw: 6 mm plate under the hook with a U-notch round the peg
    const cy = 0.2, ct = 0.006, w = 0.022, nr = rp + 0.0018;
    const outline = [[0.07, -w], [0.07, w], [-0.028, w], [-0.028, nr]];
    for (let k = 0; k <= 12; k++) { const a = Math.PI / 2 - (k / 12) * Math.PI; outline.push([Math.cos(a) * nr, Math.sin(a) * nr]); }
    outline.push([-0.028, -nr], [-0.028, -w]);
    add(paint, plateXZ(outline.map(([x, z]) => [x, z]), ct, cy));
    // lever: 25 mm square tube from the claw up to the grip
    const a = V3(0.05, cy + ct + 0.0125, 0), b = V3(0.64, 0.5, 0);
    add(paint, G.prism(G.roundedRectProfile(0.025, 0.025, 0.003, 2), a, b, { side: V3(0, 0, 1) }));
    const dir = b.clone().sub(a).normalize();
    const g0 = b.clone().addScaledVector(dir, -0.13);
    add(grip, G.prism(G.roundedRectProfile(0.034, 0.034, 0.012, 4), g0, b.clone().addScaledVector(dir, 0.006), { side: V3(0, 0, 1) }));
    for (let k = 1; k < 9; k++) {                                    // grip ribs
      const c = g0.clone().addScaledVector(dir, k * 0.0145);
      add(grip, G.prism(G.roundedRectProfile(0.0365, 0.0365, 0.013, 4), c.clone().addScaledVector(dir, -0.002), c.clone().addScaledVector(dir, 0.002), { side: V3(0, 0, 1) }));
    }
    // fulcrum leg with a foot plate, a little behind the claw
    const s = 0.11, top0 = a.clone().addScaledVector(dir, s / Math.cos(Math.atan2(dir.y, dir.x)) - 0.005);
    const foot = V3(top0.x + 0.03, 0.005, 0);
    add(paint, G.prism(G.roundedRectProfile(0.02, 0.02, 0.003, 2), top0.clone().setY(top0.y - 0.008), foot, { side: V3(0, 0, 1) }));
    const fp = G.roundedBox(0.075, 0.006, 0.05, 0.0025, 2); fp.translate(foot.x + 0.01, 0.003, 0); add(paint, fp);
    detail = { target: [0, 0.21, 0], size: 0.13, azimuth: 30, elevation: 22 };
  } else if (part === 'clips') {
    const clipMat = L.moulded('#1B1B1C', 0.48);
    const nail = SG.zincSG({ rough: 0.3 });
    // one clip, nail along local Y (head up): U-saddle over a 12 x 7 mm flat cable plus a lug with the nail
    const oneClip = () => {
      const o = [[-0.0085, 0], [-0.0085, 0.0095], [0.0085, 0.0095], [0.0085, 0], [0.0062, 0], [0.0062, 0.0071], [-0.0062, 0.0071], [-0.0062, 0]];
      const sh = new THREE.Shape(o.map(([x, y]) => new THREE.Vector2(x, y)));
      const saddle = new THREE.ExtrudeGeometry(sh, { depth: 0.007, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 1 });
      saddle.translate(0, 0, -0.0035);
      const lug = G.roundedBox(0.006, 0.0095, 0.007, 0.0012, 2); lug.translate(0.0112, 0.00475, 0);
      const plastic = K.mergeRaw([saddle.toNonIndexed(), lug.toNonIndexed()]);
      const steel = K.mergeRaw([
        G.lathe([[0.0001, 0.0095], [0.0019, 0.0095], [0.0019, 0.0103], [0.0001, 0.0106]], 14).translate(0.0112, 0, 0).toNonIndexed(),
        G.lathe([[0.0001, -0.012], [0.0008, -0.0104], [0.0008, 0.0096], [0.0001, 0.0096]], 10).translate(0.0112, 0, 0).toNonIndexed(),
      ]);
      return { plastic, steel };
    };
    const R = rng(29);
    const putClip = (x, z, yaw, side, lift) => {
      const { plastic, steel } = oneClip();
      const m = new THREE.Matrix4();
      // lying on a side: nail horizontal (rotate about X), or upside down on the saddle top (nail up in the air)
      const lie = side ? new THREE.Matrix4().makeRotationX(side * Math.PI / 2) : new THREE.Matrix4().makeRotationZ(Math.PI);
      m.multiply(new THREE.Matrix4().makeTranslation(x, 0, z)).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(lie);
      for (const g2 of [plastic, steel]) g2.applyMatrix4(m);
      const lo = Math.min(K.minY(plastic), K.minY(steel));
      for (const g2 of [plastic, steel]) g2.translate(0, lift - lo, 0);
      add(clipMat, plastic); add(nail, steel);
    };
    // the 25 clips knolled in five rows of five, lying on their side with the nails along the rows; the middle row turned
    // over so both faces show
    for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
      putClip((col - 2) * 0.03, (row - 2) * 0.031, 0.02 * (R() - 0.5), row === 2 ? -1 : 1, 0);
    }
    detail = { target: [0, 0.006, 0], size: 0.06, azimuth: 20, elevation: 40 };
  } else if (part === 'stekkerdoos') {
    const body = L.moulded('#19191A', 0.46);
    const lidMat = L.moulded('#4A4D51', 0.42);
    const BLn = 0.25, BH = 0.04, BD = 0.072;
    const box = G.roundedBox(BLn, BH, BD, 0.012, 4); box.translate(0, BH / 2, 0); add(body, box);
    for (const x of [-0.075, 0, 0.075]) {
      add(body, G.lathe([[0.0001, BH - 0.002], [0.0255, BH - 0.002], [0.0255, BH + 0.004], [0.024, BH + 0.0052], [0.0001, BH + 0.0052]], 48).translate(x, 0, 0));
      add(lidMat, G.lathe([[0.0001, BH + 0.0052], [0.0262, BH + 0.0052], [0.0268, BH + 0.0072], [0.0245, BH + 0.0098], [0.012, BH + 0.0108], [0.0001, BH + 0.011]], 48).translate(x, 0, 0));
      const hinge = G.roundedBox(0.03, 0.009, 0.008, 0.003, 2); hinge.translate(x, BH + 0.0045, -0.028); add(lidMat, hinge);
      const tab = G.roundedBox(0.014, 0.004, 0.007, 0.0015, 2); tab.translate(x, BH + 0.0085, 0.0285); add(lidMat, tab);
    }
    // strain relief at -X, the lead lies in a loose loop in front to the plug
    const relief = G.lathe([[0.0001, 0], [0.011, 0], [0.0095, 0.012], [0.0068, 0.026], [0.0052, 0.034], [0.0001, 0.034]], 24);
    relief.rotateZ(Math.PI / 2); relief.translate(-BLn / 2 + 0.002, 0.019, 0); add(body, relief);
    const r = 0.0042;
    const ctrl = [V3(-BLn / 2 - 0.03, 0.019, 0), V3(-BLn / 2 - 0.06, 0.012, 0.004), V3(-BLn / 2 - 0.1, r, 0.03), V3(-BLn / 2 - 0.11, r, 0.1),
      V3(-0.12, r, 0.15), V3(-0.02, r, 0.155), V3(0.06, r, 0.14), V3(0.11, r, 0.125)];
    const pts = K.smoothPath(ctrl, 160);
    add(body, K.tubeAlong(pts, r, 14, { up: V3(0, 1, 0) }));
    const n = pts.length - 1;
    L.rubberPlug((m, geo) => add(m, geo, placeEnd(pts[n], pts[n - 4], 0.0189)), body, pin);
    detail = { target: [0, BH, 0], size: 0.12, azimuth: 25, elevation: 38 };
  } else {
    throw new Error(`miscParts: unknown part ${part}`);
  }
  B.build(g);
  return {
    object: g,
    detail,
    view: { hero: { elevation: 34 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.004, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 }, envIntensity: 1.0 } },
    meta: { parts },
  };
}
