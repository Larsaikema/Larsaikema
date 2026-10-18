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
    const placeEnd = (q0, q1, lift) => {
      const d = q0.clone().sub(q1).setY(0).normalize();          // outward
      // local -Y (body) -> outward, local +Y -> back along the cable, local Z -> up
      const yAxis = d.clone().negate();
      const zAxis = V3(0, 1, 0);
      const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
      return new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis).setPosition(q0.x, lift, q0.z);
    };
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
