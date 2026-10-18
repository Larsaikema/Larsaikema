// Onderdelen biertafel, bankettafel en klaptafel (furniture group, round 4).
// Called from biertafelset.js for { only: 'onderstel', part }:
//   part 'obt'   onderstelset biertafel (2 poten): two galvanised trapezoid leg frames for a 50 cm top,
//                each with its pressed hinge channel on the axle, plastic feet; the two folding braces
//                (klikslot) lie beside them
//        'obtb'  the same, extra breed (60-80 cm top)
//        'obb'   onderstelset bierbank (2 poten): the narrower, splayed bench frames
//        'ks'    klikslot: the folding brace with knee hinge, lock lever and end brackets
//        'bm5'   bouten en moeren (set van 5): galvanised carriage bolts M8 x 60, washers and nuts
//        'vb8'   vloerbeschermers (set van 8): black PE foot shoes that clip onto the Ø25 foot tube
//        'obk'   onderstelset bankettafel: two black U leg frames with their braces and locking rings
//        'ocf'   onderstelset conferentietafel: two black T legs (foot bar with glides, column, top bar
//                with the folding hinge plate)
//        'sp4'   stelpoot met schroefdop (set van 4): levelling feet (nylon base, M8 stud) + tube plugs
//        none    the hero: table and bench frames with a klikslot and bolts, as a tidy flat-lay
// Everything lies on the studio floor (flat-lay, hero 34-40 deg up) except the small sets, which
// get a closer framing.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { legFrame } from './biertafelset.js';

const { V3 } = G;
const DEG = Math.PI / 180;

// place everything in `tmp` on the floor: optional pre-rotation (frame plane -> floor), lift so it
// rests on y = 0, centre on (x, z) and turn by yaw
function place(bins, tmp, { x = 0, z = 0, yaw = 0, pre = null, lift = 0 } = {}) {
  const box = new THREE.Box3();
  for (const [, list] of tmp.bins) for (const g of list) { if (pre) g.applyMatrix4(pre); g.computeBoundingBox(); box.union(g.boundingBox); }
  const c = box.getCenter(V3());
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z).multiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y + lift, -c.z));
  for (const [mat, list] of tmp.bins) for (const g of list) bins.add(mat, g.applyMatrix4(m));
  return box.getSize(V3());
}
const flatPre = () => new THREE.Matrix4().makeRotationZ(-Math.PI / 2); // frame plane (x = 0) -> floor

// ------------------------------------------------------------------ biertafel / bierbank leg frame
function bierLeg(mats, { W = 0.5, bench = false } = {}) {
  const t = new G.PartBin();
  const opts = bench
    ? { x: 0, inward: 1, yTop: 0.418, zTop: 0.08, zFoot: 0.17, yCross: 0.2, braceTo: 0.36, folded: true }
    : { x: 0, inward: 1, yTop: 0.705, zTop: W / 2 - 0.07, zFoot: W / 2 - 0.03, yCross: 0.36, braceTo: 0.5, folded: true };
  legFrame(t, mats, opts);
  // pressed hinge channel riding on the axle (its flanges either side of the frame plane)
  const half = opts.zTop + 0.03, y = opts.yTop;
  t.add(mats.steel, G.prism(G.roundedRectProfile(0.05, 0.004, 0.0015, 2), V3(0, y + 0.024, -half), V3(0, y + 0.024, half), { side: V3(1, 0, 0) }));
  for (const sx of [-1, 1]) t.add(mats.steel, G.prism(G.roundedRectProfile(0.004, 0.034, 0.0015, 2), V3(sx * 0.023, y + 0.009, -half), V3(sx * 0.023, y + 0.009, half), { side: V3(1, 0, 0) }));
  // two screw holes per flange end (dark)
  for (const s of [-1, 1]) t.add(mats.hole, G.tube(V3(0, y + 0.0262, s * (half - 0.02)), V3(0, y + 0.0268, s * (half - 0.02)), 0.0045, 12));
  return { bin: t, opts };
}
// folding brace with knee hinge and lock lever (klikslot); built lying flat, the two bars meet at the knee
// at `bend` degrees off straight (0 = stretched, as fitted; 60+ = folded into a V)
function klikslot(mats, { len = 0.5, bend = 10 } = {}) {
  const t = new G.PartBin();
  const h = (bend * DEG) / 2;
  const k = V3(0, 0, 0);
  const dA = V3(-Math.cos(h), 0, Math.sin(h)), dB = V3(Math.cos(h), 0, Math.sin(h));
  const a = k.clone().addScaledVector(dA, len / 2), b = k.clone().addScaledVector(dB, len / 2);
  const up = V3(0, 1, 0);
  const sideOf = (d) => V3(-d.z, 0, d.x);
  t.add(mats.steel, G.flatBar(a, k, 0.028, 0.004, sideOf(dA)).translate(0, 0.002, 0));
  t.add(mats.steel, G.flatBar(k, b, 0.028, 0.004, sideOf(dB)).translate(0, 0.006, 0));
  t.add(mats.steel, F.latheAt([[0.0001, 0], [0.008, 0], [0.008, 0.012], [0.0001, 0.012]], k.clone(), up, 16));
  // lock lever (grey nylon) on the upper bar next to the knee, the sliding lock sleeve on the lower bar
  const onB = (s0, y) => k.clone().addScaledVector(dB, s0).setY(y);
  const onA = (s0, y) => k.clone().addScaledVector(dA, s0).setY(y);
  t.add(mats.lever, G.roundedBox(0.07, 0.012, 0.03, 0.004).applyMatrix4(F.basis(onB(0.045, 0.013), dB, up)));
  t.add(mats.steel, G.roundedBox(0.04, 0.012, 0.036, 0.003).applyMatrix4(F.basis(onA(0.05, 0.006), dA, up)));
  // end fittings: an eye on the leg end, a small angle plate with two holes on the top end
  t.add(mats.steel, F.latheAt([[0.006, 0], [0.012, 0], [0.012, 0.004], [0.006, 0.004]], onA(len / 2 + 0.006, 0), up, 18));
  t.add(mats.steel, G.roundedBox(0.06, 0.004, 0.05, 0.002).applyMatrix4(F.basis(onB(len / 2 + 0.02, 0.002), dB, up)));
  t.add(mats.steel, G.roundedBox(0.004, 0.02, 0.05, 0.0015).applyMatrix4(F.basis(onB(len / 2 + 0.048, 0.01), dB, up)));
  for (const s of [-1, 1]) {
    const c = onB(len / 2 + 0.025, 0).addScaledVector(sideOf(dB), s * 0.013);
    t.add(mats.hole, G.tube(c.clone().setY(0.0038), c.clone().setY(0.0046), 0.0035, 12));
  }
  return t;
}
// galvanised carriage bolt M8 x 60 lying on its side, nut run onto the end, washer beside it
function boltSet(t, mats, x, z, yaw) {
  const T = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  const r = 0.004, L = 0.06, hr = 0.0095;
  const ax = V3(1, 0, 0);
  // dome head (lies on its rim, axis horizontal at head radius) + square neck + shank + thread rings
  const y = hr * 0.98;
  t.add(mats.bolt, F.latheAt([[0.0001, -0.0055], [0.004, -0.0052], [0.0068, -0.0042], [0.0086, -0.0025], [hr, -0.0008], [hr, 0.0], [0.0001, 0.0]], V3(0, y, 0), ax, 28).applyMatrix4(T));
  t.add(mats.bolt, G.prism(G.roundedRectProfile(0.008, 0.008, 0.0008, 1), V3(0, y, 0), V3(0.006, y, 0), { side: V3(0, 1, 0) }).applyMatrix4(T));
  t.add(mats.bolt, G.tube(V3(0.006, y, 0), V3(L, y, 0), r, 16).applyMatrix4(T));
  for (let k = 0; k < 20; k++) t.add(mats.bolt, new THREE.TorusGeometry(r, 0.00045, 4, 14).rotateY(Math.PI / 2).translate(0.03 + k * 0.00125 * 1.0, y, 0).applyMatrix4(T));
  // hex nut on the thread end
  t.add(mats.bolt, G.prism(G.roundedPolygonProfile(6, 0.013, 0.0006, 1, 0), V3(L - 0.012, y, 0), V3(L - 0.0055, y, 0), { side: V3(0, 1, 0) }).applyMatrix4(T));
  // washer lying flat next to the bolt
  t.add(mats.bolt, G.lathe([[0.0043, 0], [0.008, 0], [0.008, 0.0016], [0.0043, 0.0016]], 32).translate(0.03, 0, 0.022).applyMatrix4(T));
}
// PE foot shoe for the Ø25 foot tube: flat base, saddle groove on top, chamfered ends
function footShoe() {
  const L = 0.06, W = 0.036, H = 0.024, R = 0.0137;
  // cross-section in (z, y), counter-clockwise, extruded along x
  const pts = [[-W / 2 + 0.003, 0], [W / 2 - 0.003, 0], [W / 2, 0.003], [W / 2, H - 0.004], [W / 2 - 0.004, H], [R + 0.002, H]];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI; pts.push([R * Math.cos(a), H - R * Math.sin(a)]); }
  pts.push([-R - 0.002, H], [-W / 2 + 0.004, H], [-W / 2, H - 0.004], [-W / 2, 0.003]);
  const shape = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0012, bevelSegments: 2, curveSegments: 4 });
  g.rotateY(Math.PI / 2); g.translate(-L / 2, 0.0012, 0);
  return g;
}
// levelling foot with tube plug
function levelFoot(t, mats, x, z, plugOn = true) {
  t.add(mats.nylon, G.lathe([[0.0001, 0], [0.019, 0], [0.0205, 0.002], [0.02, 0.009], [0.016, 0.013], [0.007, 0.016], [0.0001, 0.017]], 40).translate(x, 0, z));
  t.add(mats.bolt, G.lathe([[0.0001, 0.012], [0.0065, 0.012], [0.0065, 0.019], [0.0001, 0.022]], 20).translate(x, 0, z));
  t.add(mats.bolt, G.tube(V3(x, 0.019, z), V3(x, 0.062, z), 0.004, 14));
  for (let k = 0; k < 24; k++) t.add(mats.bolt, new THREE.TorusGeometry(0.004, 0.00045, 4, 14).rotateX(Math.PI / 2).translate(x, 0.024 + k * 0.00125 * 1.3, z));
  t.add(mats.bolt, G.prism(G.roundedPolygonProfile(6, 0.013, 0.0006, 1, 0), V3(x, 0.022, z), V3(x, 0.0285, z), { side: V3(1, 0, 0) }));
  if (plugOn) {
    // tube plug (schroefdop): ribbed insert for a Ø25 tube with a collar, threaded on the stud
    const y0 = 0.046;
    t.add(mats.cap, G.lathe([[0.0001, y0], [0.0135, y0], [0.0135, y0 + 0.004], [0.0105, y0 + 0.0045], [0.0108, y0 + 0.009], [0.0098, y0 + 0.011], [0.0108, y0 + 0.015], [0.0098, y0 + 0.017], [0.0108, y0 + 0.021], [0.0095, y0 + 0.026], [0.0001, y0 + 0.026]], 32).translate(x, 0, z));
  }
}

// ------------------------------------------------------------------ bankettafel U frame (black)
function banquetU(mats, { W = 0.6, Hh = 0.68 } = {}) {
  const t = new G.PartBin();
  const r = 0.0127, zl = W / 2;
  // in the frame plane x = 0: axle at y = Hh, legs down to y = 0, cross tube low
  t.add(mats.steel, F.sweep(F.filletPath([V3(0, 0.02, -zl), V3(0, Hh, -zl), V3(0, Hh, zl), V3(0, 0.02, zl)], 0.05), G.circleProfile(r, 16)));
  t.add(mats.steel, G.tube(V3(0, 0.13, -zl), V3(0, 0.13, zl), 0.0095, 14));
  for (const s of [-1, 1]) {
    t.add(mats.cap, G.lathe([[0.0001, 0], [r + 0.003, 0], [r + 0.0035, 0.004], [r + 0.0025, 0.03], [0.0001, 0.03]], 18).translate(0, 0, s * zl));
    // hinge brackets on the axle
    t.add(mats.steel, G.roundedBox(0.03, 0.05, 0.004, 0.0015).translate(0, Hh + 0.012, s * (zl - 0.06)));
    // brace (two flat bars, knee rivet, locking ring) folded flat along the leg
    const a = V3(0, Hh * 0.42, s * (zl - 0.004)), b = V3(0, Hh - 0.02, s * (zl - 0.11)), k = a.clone().lerp(b, 0.5);
    t.add(mats.steel, G.flatBar(a, k, 0.02, 0.004, V3(1, 0, 0)));
    t.add(mats.steel, G.flatBar(k, b, 0.02, 0.004, V3(1, 0, 0)));
    const dirB = b.clone().sub(a).normalize();
    const ring = new THREE.TorusGeometry(0.013, 0.0035, 8, 20).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dirB));
    const rc = k.clone().addScaledVector(dirB, 0.03); ring.translate(rc.x, rc.y, rc.z);
    t.add(mats.steel, ring);
  }
  return t;
}
// conferentietafel T leg (black): foot bar with two glides, column, top bar with a hinge plate
function tLeg(mats, { D = 0.68, Hh = 0.71 } = {}) {
  const t = new G.PartBin();
  const ov = G.roundedRectProfile(0.07, 0.03, 0.012, 4);
  t.add(mats.steel, G.prism(ov, V3(0, 0.025, -D / 2), V3(0, 0.025, D / 2), { side: V3(1, 0, 0) }));
  for (const s of [-1, 1]) {
    t.add(mats.cap, G.roundedBox(0.072, 0.03, 0.016, 0.006).translate(0, 0.025, s * (D / 2 + 0.006)));
    t.add(mats.cap, G.lathe([[0.0001, 0], [0.014, 0], [0.015, 0.004], [0.012, 0.01], [0.0001, 0.01]], 20).translate(0, 0, s * (D / 2 - 0.05)));
  }
  t.add(mats.steel, G.prism(G.roundedRectProfile(0.08, 0.04, 0.006, 3), V3(0, 0.04, 0), V3(0, Hh - 0.03, 0), { side: V3(1, 0, 0) }));
  t.add(mats.steel, G.prism(G.roundedRectProfile(0.05, 0.03, 0.005, 3), V3(0, Hh - 0.015, -D / 2 + 0.03), V3(0, Hh - 0.015, D / 2 - 0.03), { side: V3(1, 0, 0) }));
  // folding hinge plate on top with holes
  t.add(mats.steel, G.roundedBox(0.09, 0.005, 0.2, 0.002).translate(0, Hh + 0.0025, 0));
  for (const s of [-1, 1]) for (const sx of [-1, 1]) t.add(mats.hole, G.tube(V3(sx * 0.03, Hh + 0.0048, s * 0.075), V3(sx * 0.03, Hh + 0.0056, s * 0.075), 0.0035, 12));
  t.add(mats.steel, G.tube(V3(-0.045, Hh - 0.004, -0.06), V3(-0.045, Hh - 0.004, 0.06), 0.006, 12));
  return t;
}

export function biertafelParts(p = {}) {
  const part = String(p.part || '').toLowerCase();
  const black = F.powder('zwart');
  const mats = {
    steel: M.galvanised(), cap: F.plastic('#1B1B1B', 0.6), lever: F.plastic('#C8C9C6', 0.45),
    hole: F.plastic('#0A0A0B', 0.8), bolt: M.galvanised(), nylon: F.plastic('#161617', 0.55),
  };
  const bmats = { ...mats, steel: black };
  const bins = new G.PartBin();
  let view = { hero: { azimuth: 26, elevation: 38, fill: 0.78 } };
  let name = `onderdelen ${part || 'onderstel'}`;
  const legPair = (W, bench, z0, x0 = 0) => {
    for (const k of [0, 1]) {
      const { bin } = bierLeg(mats, { W, bench });
      place(bins, bin, { pre: flatPre(), x: x0 + (k - 0.5) * (bench ? 0.06 : 0.08), z: z0 + (k - 0.5) * (bench ? 0.36 + 0.1 : W - 0.0 + 0.12), yaw: 0 });
    }
  };
  if (part === 'obt' || part === 'obtb') {
    const W = part === 'obtb' ? 0.7 : 0.5;
    legPair(W, false, 0);
    place(bins, klikslot(mats), { x: 0.06, z: W + 0.2, yaw: 0.05 });
    place(bins, klikslot(mats), { x: 0.0, z: W + 0.3, yaw: -0.03 });
  } else if (part === 'obb') {
    legPair(0.25, true, 0);
    place(bins, klikslot(mats, { len: 0.36 }), { x: 0.02, z: 0.42, yaw: 0.04 });
    place(bins, klikslot(mats, { len: 0.36 }), { x: -0.02, z: 0.5, yaw: -0.03 });
  } else if (part === 'ks') {
    // shown half folded (the knee bent into a wide V): the knee, lever and both end fittings read
    place(bins, klikslot(mats, { len: 0.46, bend: 62 }), { x: 0, z: 0, yaw: 0.2 });
    view = { hero: { azimuth: 30, elevation: 44, fill: 0.74 } };
  } else if (part === 'bm5') {
    const t = new G.PartBin();
    for (let i = 0; i < 5; i++) boltSet(t, mats, -0.03 + i * 0.002, -0.08 + i * 0.04, -0.3 + i * 0.12);
    place(bins, t, {});
    view = { hero: { azimuth: 28, elevation: 40, fill: 0.7 } };
  } else if (part === 'vb8') {
    const t = new G.PartBin();
    for (let i = 0; i < 8; i++) {
      const g = footShoe();
      const row = Math.floor(i / 4), col = i % 4;
      if (i === 7) g.rotateX(Math.PI / 2).translate(0, 0.018, 0); // one on its side: the groove shows in profile
      g.rotateY((col - 1.5) * 0.08 + row * 0.1).translate(-0.12 + col * 0.08, 0, -0.045 + row * 0.09);
      t.add(mats.cap, g);
    }
    place(bins, t, {});
    view = { hero: { azimuth: 26, elevation: 36, fill: 0.72 } };
  } else if (part === 'obk') {
    for (const k of [0, 1]) place(bins, banquetU(bmats), { pre: flatPre(), x: (k - 0.5) * 0.08, z: (k - 0.5) * 0.74 });
  } else if (part === 'ocf') {
    for (const k of [0, 1]) place(bins, tLeg(bmats), { pre: flatPre(), x: (k - 0.5) * 0.06, z: (k - 0.5) * 0.78 });
  } else if (part === 'sp4') {
    const t = new G.PartBin();
    levelFoot(t, mats, -0.05, -0.03, true); levelFoot(t, mats, 0.03, -0.045, true);
    levelFoot(t, mats, -0.03, 0.05, true); levelFoot(t, mats, 0.055, 0.04, false);
    // one plug lying beside the foot without it
    t.add(mats.cap, F.latheAt([[0.0001, 0], [0.0135, 0], [0.0135, 0.004], [0.0105, 0.0045], [0.0108, 0.009], [0.0098, 0.011], [0.0108, 0.015], [0.0098, 0.017], [0.0108, 0.021], [0.0095, 0.026], [0.0001, 0.026]], V3(0.1, 0.0135, 0.0), V3(-1, 0, 0.3).normalize(), 32));
    place(bins, t, {});
    view = { hero: { azimuth: 28, elevation: 26, fill: 0.72 } };
  } else {
    // hero: table frames, bench frames, a klikslot and the bolts, as a tidy flat-lay
    legPair(0.5, false, -0.05, -0.22);
    legPair(0.25, true, -0.08, 0.62);
    place(bins, klikslot(mats), { x: -0.18, z: 0.62, yaw: 0.04 });
    const t = new G.PartBin();
    for (let i = 0; i < 3; i++) boltSet(t, mats, 0, i * 0.035, -0.2 + i * 0.15);
    place(bins, t, { x: 0.55, z: 0.5, yaw: 0.3 });
    view = { hero: { azimuth: 24, elevation: 40, fill: 0.8 } };
    name = 'onderdelen biertafel en klaptafel';
  }
  const group = new THREE.Group(); group.name = name;
  bins.build(group);
  return {
    object: group,
    detail: { target: [0, 0.02, 0], size: 0.25, azimuth: 30, elevation: 30 },
    meta: { kind: 'biertafel-parts', part },
    view,
    rig: S.seatRig(group, { default: { groundAO: { maxZenith: 60 } } }),
  };
}
