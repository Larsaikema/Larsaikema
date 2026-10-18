// Wielset easy-up: four swivel castors with brake that slide onto the legs.
//
// { count }
// Each castor: a galvanised hex socket (fits 40 and 50 mm legs; 56 mm across flats, 12 cm
// tall) welded on a square top plate, a zinc wing bolt through the socket wall to clamp the
// leg, a ball-race swivel head, a pressed-steel fork, a Ø 100 mm wheel with a grey
// non-marking rubber tyre on a black polypropylene centre with roller bearing and axle nut,
// and a total-lock brake pedal at the back of the fork (red tread). The set of four stands
// as a tidy 2 x 2 group, wheels swivelled to slightly different headings.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function castor(bins, mats, { heading = 0, socketYaw = 0 }) {
  const R = 0.05, Wt = 0.032;
  const axleY = R;
  const forkTop = 2 * R + 0.022;      // swivel plate underside
  const offset = 0.032;               // swivel lead: axle trails the swivel axis
  const hd = heading;
  const fwd = V3(Math.sin(hd), 0, Math.cos(hd)), side = V3(Math.cos(hd), 0, -Math.sin(hd));
  const ax = fwd.clone().multiplyScalar(-offset); // axle centre (x, z)
  // wheel: tyre + centre + hub, axis along `side`
  const tyre = K.lathe([[R - 0.013, -Wt / 2], [R - 0.004, -Wt / 2], [R - 0.0005, -Wt / 2 + 0.005], [R, -Wt / 2 + 0.01], [R, Wt / 2 - 0.01], [R - 0.0005, Wt / 2 - 0.005], [R - 0.004, Wt / 2], [R - 0.013, Wt / 2]], 72);
  const centre = K.lathe([[0.0001, Wt / 2 - 0.006], [0.014, Wt / 2 - 0.006], [0.016, Wt / 2 - 0.009], [R - 0.013, Wt / 2 - 0.004], [R - 0.013, -Wt / 2 + 0.004], [0.016, -Wt / 2 + 0.009], [0.014, -Wt / 2 + 0.006], [0.0001, -Wt / 2 + 0.006]].reverse(), 48);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), side);
  for (const [g, m] of [[tyre, mats.tyre], [centre, mats.centre]]) { g.applyQuaternion(q); g.translate(ax.x, axleY, ax.z); bins.add(m, g); }
  // axle bolt + nuts
  const a0 = V3(ax.x, axleY, ax.z).addScaledVector(side, -(Wt / 2 + 0.008)), a1 = V3(ax.x, axleY, ax.z).addScaledVector(side, Wt / 2 + 0.008);
  bins.add(mats.zinc, G.tube(a0, a1, 0.0045, 14));
  for (const [pnt, s] of [[a0, -1], [a1, 1]]) { const n = K.hexNutGeo(0.013, 0.006, 0); n.applyMatrix4(new THREE.Matrix4().makeBasis(fwd, side.clone().multiplyScalar(s), V3().crossVectors(fwd, side.clone().multiplyScalar(s))).setPosition(pnt)); bins.add(mats.zinc, n); }
  // fork: two side plates from the swivel head down to the axle + the crown plate
  const crownY = forkTop - 0.004;
  for (const s of [-1, 1]) {
    const sp = new THREE.Shape();
    // profile in the (fwd, y) plane: tapers from the crown to a rounded lug round the axle
    sp.moveTo(0.03, crownY); sp.lineTo(-0.04, crownY); sp.lineTo(-offset - 0.016, axleY + 0.004);
    sp.absarc(-offset, axleY, 0.016, Math.PI, 0, false); sp.lineTo(0.03, crownY - 0.03); sp.closePath();
    const g = new THREE.ExtrudeGeometry(sp, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0008, bevelSegments: 1, curveSegments: 16 });
    g.translate(0, 0, -0.0015);
    // shape x -> fwd, shape y -> up, extrusion z -> side
    g.applyMatrix4(new THREE.Matrix4().makeBasis(fwd, V3(0, 1, 0), side.clone().negate()).setPosition(side.clone().multiplyScalar(s * (Wt / 2 + 0.005))));
    bins.add(mats.fork, g);
  }
  const crown = G.roundedBox(Wt + 0.016, 0.004, 0.07, 0.0015);
  crown.applyMatrix4(new THREE.Matrix4().makeBasis(side, V3(0, 1, 0), fwd).setPosition(fwd.clone().multiplyScalar(-0.005).setY(crownY)));
  bins.add(mats.fork, crown);
  // brake: lever on the back of the fork with a red tread pad
  const bp = fwd.clone().multiplyScalar(-0.058).setY(crownY - 0.012);
  const lever = G.roundedBox(0.022, 0.004, 0.035, 0.0015);
  lever.applyMatrix4(new THREE.Matrix4().makeBasis(side, V3(0, 1, 0), fwd).multiply(new THREE.Matrix4().makeRotationX(-0.35)).setPosition(bp));
  bins.add(mats.fork, lever);
  const pad = G.roundedBox(0.026, 0.006, 0.026, 0.002);
  pad.applyMatrix4(new THREE.Matrix4().makeBasis(side, V3(0, 1, 0), fwd).multiply(new THREE.Matrix4().makeRotationX(-0.35)).setPosition(bp.clone().addScaledVector(fwd, -0.012).add(V3(0, 0.006, 0))));
  bins.add(mats.brake, pad);
  // swivel head: two raceway plates + ball ring + kingpin
  bins.add(mats.zinc, K.lathe([[0.0001, forkTop - 0.001], [0.036, forkTop - 0.001], [0.038, forkTop + 0.002], [0.036, forkTop + 0.005], [0.0001, forkTop + 0.005]].reverse(), 48));
  bins.add(mats.zinc, K.lathe([[0.0001, forkTop + 0.005], [0.03, forkTop + 0.005], [0.031, forkTop + 0.009], [0.0001, forkTop + 0.009]].reverse(), 48));
  // top plate (square, rotated with the socket) + hex socket with bore + gussets
  const topY = forkTop + 0.009;
  const sy = socketYaw;
  const plate = G.roundedBox(0.09, 0.005, 0.09, 0.006); plate.rotateY(sy); plate.translate(0, topY + 0.0025, 0); bins.add(mats.galv, plate);
  const AF = 0.056, Ri = (0.0525) / 2 / Math.cos(Math.PI / 6), Ro = AF / 2 / Math.cos(Math.PI / 6);
  const sh = new THREE.Shape(); for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; if (i === 0) sh.moveTo(Math.cos(a) * Ro, Math.sin(a) * Ro); else sh.lineTo(Math.cos(a) * Ro, Math.sin(a) * Ro); }
  const hole = new THREE.Path(); for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; if (i === 0) hole.moveTo(Math.cos(a) * Ri, Math.sin(a) * Ri); else hole.lineTo(Math.cos(a) * Ri, Math.sin(a) * Ri); }
  sh.holes.push(hole);
  const sock = K.extrudeY(sh, 0.12, { y0: topY + 0.005, bevel: 0.001, bevelSegs: 1, curveSegs: 6 });
  sock.rotateY(sy + Math.PI / 6); bins.add(mats.galv, sock);
  // wing bolt through a flat of the socket, facing `socketYaw`
  const fdir = V3(Math.sin(sy + Math.PI / 2), 0, Math.cos(sy + Math.PI / 2));
  const bc = fdir.clone().multiplyScalar(AF / 2).setY(topY + 0.075);
  const nut = K.hexNutGeo(0.014, 0.007, 0.004);
  const l = V3().crossVectors(fdir, V3(0, 1, 0));
  nut.applyMatrix4(new THREE.Matrix4().makeBasis(l, fdir, V3().crossVectors(l, fdir)).setPosition(bc.clone().addScaledVector(fdir, 0.0035)));
  bins.add(mats.galv, nut);
  bins.add(mats.zinc, G.tube(bc.clone().addScaledVector(fdir, -0.004), bc.clone().addScaledVector(fdir, 0.016), 0.004, 12));
  const wn = K.wingNutGeo(1.2);
  wn.applyMatrix4(new THREE.Matrix4().makeBasis(V3(0, 1, 0), fdir, V3().crossVectors(V3(0, 1, 0), fdir)).setPosition(bc.clone().addScaledVector(fdir, 0.009)));
  bins.add(mats.zinc, wn);
}

export function wielset(p = {}) {
  const n = Number(p.count ?? 4);
  const mats = {
    tyre: SG.rubberSG('#55585C', { rough: 0.7 }), centre: SG.moulded('#1A1B1C', { rough: 0.45 }), zinc: SG.zincSG(), fork: SG.zincSG({ rough: 0.34 }),
    galv: SG.zincSG({ rough: 0.34 }), brake: SG.moulded('#B3231C', { rough: 0.5 }),
  };
  const bins = new G.PartBin();
  const pitch = 0.17;
  const heads = [40, -25, 70, 10];
  for (let i = 0; i < n; i++) {
    const sub = new G.PartBin();
    // wing bolts face the viewer (camera at ~34 deg)
    castor(sub, mats, { heading: heads[i % 4] * DEG, socketYaw: (34 - 90 + (i % 2 ? 12 : -10)) * DEG });
    const c = i % 2, r = Math.floor(i / 2);
    const x = (c - 0.5) * pitch + (r ? -0.012 : 0.012), z = (0.5 - r) * pitch;
    for (const [mat, list] of sub.bins) for (const g of list) { g.translate(x, 0, z); bins.add(mat, g); }
  }
  const g = K.finish(bins, `wielset ${n}`);
  return {
    object: g,
    detail: { target: [pitch / 2, 0.08, pitch / 2], size: 0.24, azimuth: 30, elevation: 12 },
    view: { hero: { elevation: 18 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { n },
  };
}
