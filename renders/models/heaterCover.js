// Beschermhoes terrasheater: protective cover over a mushroom patio heater.
//
// heaterCover { color, zip, heater }
//   color   cover colour (default 'antraciet' charcoal 600D oxford; 'zwart', 'grijs', 'groen', '#hex')
//   zip     full-length zip on the front (true)
//   heater  false: leave the heater's foot out (it peeks out under the hem by default)
//
// Construction: 600D polyester oxford with a PU coating (js/partsKit oxford), cut as a tapered
// tube with a round top: Ø 89 cm over the reflector, Ø 50 cm at the hem, 2.2 m long. The top
// lies over the reflector cone and its cap (taut, a soft hollow between cap and rim), turns
// over the rolled rim and then hangs: long irregular vertical folds that start just under the
// rim, grow to mid-height and calm down where the drawstring gathers the hem into small pleats.
// Front: a full-length zip (tape, moulded coil, slider with a pull tab), drawstring in a hem
// channel with a barrel cord lock and knotted ends; a webbing loop on the top.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as L from '../js/lightKit.js';
import { heater } from './heater.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function heaterCover(p = {}) {
  const color = p.color || 'antraciet';
  const hex = { antraciet: '#3A3D41', zwart: '#1B1C1E', grijs: '#5E6266', groen: '#2C4032', beige: '#B9AC92' }[String(color).toLowerCase()] || color;
  const fab = K.oxford(hex, { sheen: 0.55, rough: 0.58 });
  const nz = L.noise;
  const zipAz = 20 * DEG;                       // the zip faces the heater's door side

  // profile (r, y) from the top centre over the reflector and down to the hem
  const yHem = 0.09, Rrim = 0.448, yRim = 2.13, Rhem = 0.252;
  const prof = [];
  prof.push([0.0, 2.305], [0.035, 2.302], [0.058, 2.288], [0.07, 2.27]);
  // over the reflector cone (cap edge -> rim), with a slight hollow
  for (let i = 1; i <= 14; i++) { const t = i / 14; const r = G.lerp(0.07, Rrim - 0.012, t); const y = G.lerp(2.262, yRim + 0.016, t) - 0.01 * Math.sin(Math.PI * t); prof.push([r, y]); }
  // around the rolled rim
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); prof.push([Rrim - 0.012 + Math.sin(a) * 0.012, yRim + 0.004 + Math.cos(a) * 0.012]); }
  // the skirt
  const yS = yRim - 0.01;
  for (let i = 1; i <= 60; i++) {
    const t = i / 60, y = G.lerp(yS, yHem, t);
    const f = Math.pow(t, 1.25) * (1 - 0.18 * Math.sin(Math.PI * t));
    prof.push([G.lerp(Rrim, Rhem, f), y]);
  }
  // arc-length table
  const S = [0]; for (let i = 1; i < prof.length; i++) S.push(S[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const Ltot = S[S.length - 1];
  const sRim = S[3 + 14 + 6];
  const at = (s) => {
    let j = 1; while (j < S.length - 1 && S[j] < s) j++;
    const t = (s - S[j - 1]) / Math.max(1e-9, S[j] - S[j - 1]);
    return [G.lerp(prof[j - 1][0], prof[j][0], t), G.lerp(prof[j - 1][1], prof[j][1], t)];
  };
  // fold displacement (radial) at angle a and height y on the skirt
  const fold = (a, s, y) => {
    if (s < sRim) return 0;
    const t = (yS - y) / (yS - yHem);                       // 0 under the rim .. 1 at the hem
    const grow = G.smoothstep(0, 0.22, t) * (1 - 0.55 * G.smoothstep(0.55, 1, t));
    const drift = 0.25 * nz.noise(y * 0.9, 3.1);
    let d = 0.042 * grow * (0.55 * Math.sin(8 * a + 1.3 + drift) + 0.45 * nz.noise(Math.cos(a) * 2.6 + 7.1, Math.sin(a) * 2.6 + y * 0.55));
    d += 0.011 * grow * Math.sin(13 * a + 0.4 + 2 * drift) * (0.6 + 0.4 * nz.noise(a * 2, y * 2));
    // gathered pleats at the drawstring
    const g = Math.exp(-(y - yHem) / 0.07);
    d += g * (0.0065 * Math.sin(34 * a + 0.8 * nz.noise(a * 3, 1)) - 0.004);
    // the zip stiffens the fabric along the front
    const dz = Math.abs(Math.atan2(Math.sin(a - zipAz), Math.cos(a - zipAz)));
    d *= G.smoothstep(0.03, 0.16, dz);
    return d;
  };
  const point = (u, s, o) => {
    const a = u * TAU;
    const [r, y] = at(s);
    const rr = r + (r > 0.05 ? fold(a, s, y) : 0);
    return o.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
  };
  const nu = 240, nv = 150;
  const skin = G.surface((u, v, o) => point(u, v * Ltot, o), nu, nv, { closedU: true, uvScale: [TAU * Rrim, Ltot], flipNormals: true });
  const bins = new G.PartBin();
  bins.add(fab, skin);
  // inner face of the hem (the turned-up channel seen from below)
  bins.add(fab, G.surface((u, v, o) => { point(u, Ltot - 0.0001, o); const k = 1 - 0.035 * v; o.x *= k; o.z *= k; o.y += 0.03 * v; return o; }, nu, 2, { closedU: true, uvScale: [TAU * Rhem, 0.03] }));

  // hem channel: a slightly proud band with a stitch line
  const darker = K.oxford(new THREE.Color(hex).multiplyScalar(0.82).getStyle(), { sheen: 0.4, rough: 0.6 });
  const band = G.surface((u, v, o) => { const s = Ltot - 0.028 + v * 0.028; point(u, s, o); const k = 1 + 0.004 / Math.hypot(o.x, o.z); o.x *= k; o.z *= k; return o; }, nu, 3, { closedU: true, uvScale: [TAU * Rhem, 0.03], flipNormals: true });
  bins.add(darker, band);

  // zip: tape + moulded coil + slider/pull (near the bottom, zip closed)
  const zipPts = (off, lift) => {
    const pts = [];
    for (let i = 0; i <= 260; i++) {
      const s = sRim + 0.11 + (Ltot - 0.035 - sRim - 0.11) * (i / 260);
      const q = point(zipAz / TAU + off / (TAU * at(s)[0]), s, V3());
      const k = 1 + lift / Math.hypot(q.x, q.z); q.x *= k; q.z *= k;
      pts.push(q);
    }
    return pts;
  };
  const tapeMat = K.cached('coverZipTape', () => new THREE.MeshPhysicalMaterial({ color: '#1A1B1D', roughness: 0.7, sheen: 0.5, sheenColor: new THREE.Color('#4a4b4f'), name: 'zip tape' }));
  const coilMat = K.cached('coverZipCoil', () => new THREE.MeshPhysicalMaterial({ color: '#111213', roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, name: 'zip coil' }));
  const tape = zipPts(0, 0.0012);
  const tapeFr = L.sweepProfile(tape, [[0, 0], [1e-4, 0], [0, 1e-4]], { caps: false }).frames;
  // tape: a flat strip lying on the cover (normal = outward radial)
  const nrm = tape.map((q) => V3(q.x, 0, q.z).normalize());
  const strip = K.strapAlong(tape, 0.026, 0.0012, { normals: nrm });
  bins.add(tapeMat, strip);
  bins.add(coilMat, K.strapAlong(zipPts(0, 0.0026), 0.0062, 0.0022, { normals: nrm }));
  void tapeFr;
  {
    const sS = Ltot - 0.2;
    const q = point(zipAz / TAU, sS, V3()); const n = V3(q.x, 0, q.z).normalize();
    const up = V3(0, 1, 0), side = V3().crossVectors(up, n);
    const zinc = K.zinc();
    const M4 = new THREE.Matrix4().makeBasis(side, up, n).setPosition(q.x + n.x * 0.004, q.y, q.z + n.z * 0.004);
    const body = G.roundedBox(0.014, 0.03, 0.006, 0.0025, 2); body.applyMatrix4(M4); bins.add(zinc, body);
    const bridge = G.roundedBox(0.006, 0.012, 0.004, 0.0015, 2); bridge.translate(0, -0.006, 0.0045); bridge.applyMatrix4(M4); bins.add(zinc, bridge);
    const tab = G.roundedBox(0.011, 0.034, 0.0022, 0.003, 2); tab.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.12)); tab.translate(0, -0.026, 0.007); tab.applyMatrix4(M4); bins.add(zinc, tab);
    // pull cord loop through the tab
    const loopPts = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; loopPts.push(V3(Math.sin(a) * 0.006, -0.05 - 0.018 * (1 - Math.cos(a)) * 0.9, 0.009 + 0.002 * Math.cos(a)).applyMatrix4(M4)); }
    bins.add(L.cableRubber('#2A2B2E', 0.7), L.sweepProfile(loopPts, L.circleProfile(0.0015, 6), { caps: false }).geo);
  }

  // drawstring: exits the channel at the front, barrel cord lock, knotted ends
  {
    const a0 = zipAz + 0.17;
    const q = point(a0 / TAU, Ltot - 0.014, V3()); const n = V3(q.x, 0, q.z).normalize();
    const cordMat = L.cableRubber('#1E1F21', 0.75);
    const tng = V3(Math.cos(a0), 0, -Math.sin(a0));
    for (const s of [-1, 1]) {
      const c = [q.clone().addScaledVector(n, 0.006).addScaledVector(tng, s * 0.004), q.clone().addScaledVector(n, 0.016).add(V3(0, -0.025, 0)).addScaledVector(tng, s * 0.003), q.clone().addScaledVector(n, 0.022).add(V3(0, -0.05, 0)).addScaledVector(tng, s * 0.0018)];
      bins.add(cordMat, L.sweepProfile(new THREE.CatmullRomCurve3(c).getSpacedPoints(16), L.circleProfile(0.0019, 8)).geo);
      const e = c[2].clone().add(V3(0, -0.026, 0.0));
      bins.add(cordMat, L.sweepProfile([c[2], e], L.circleProfile(0.0019, 8)).geo);
      const knot = new THREE.SphereGeometry(0.0042, 12, 8); knot.translate(e.x, e.y - 0.002, e.z); bins.add(cordMat, knot);
    }
    const lockC = q.clone().addScaledVector(n, 0.021).add(V3(0, -0.05, 0));
    const lock = G.lathe([[0.0001, -0.012], [0.0075, -0.012], [0.0082, -0.006], [0.0082, 0.006], [0.0075, 0.012], [0.0001, 0.012]], 24);
    lock.translate(lockC.x, lockC.y, lockC.z); bins.add(L.moulded('#111111', 0.45), lock);
    const btn = G.lathe([[0.0001, 0.012], [0.005, 0.012], [0.005, 0.017], [0.0001, 0.0175]], 16); btn.translate(lockC.x, lockC.y, lockC.z); bins.add(L.moulded('#111111', 0.45), btn);
  }

  // webbing loop on the top
  {
    const web = K.cached('coverWeb', () => new THREE.MeshPhysicalMaterial({ color: '#1C1D1F', roughness: 0.65, sheen: 0.6, sheenColor: new THREE.Color('#505256'), name: 'webbing' }));
    const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push(V3(-0.055 + 0.11 * t, 2.303 + 0.045 * Math.sin(Math.PI * t) ** 0.8, 0.0)); }
    bins.add(web, K.strapAlong(pts, 0.025, 0.0022, { normals: pts.map((_, i) => { const t = i / 30; return V3(-Math.cos(Math.PI * t) * 0.6, 1, 0).normalize(); }) }));
    for (const sx of [-1, 1]) { const tack = G.roundedBox(0.03, 0.002, 0.028, 0.002, 1); tack.translate(sx * 0.07, 2.304, 0); bins.add(web, tack); }
  }

  const group = new THREE.Group(); group.name = 'heaterCover';
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // the heater's foot under the hem (its upper parts are hidden by the cover)
  if (p.heater !== false) {
    const h = heater({ kind: 'gas', style: 'paddenstoel', on: false });
    h.object.traverse((o) => { if (o.isMesh) o.userData.noFrame = false; });
    group.add(h.object);
  }
  const zq = point(zipAz / TAU, Ltot - 0.25, V3());
  return {
    object: group,
    detail: { target: [zq.x, zq.y + 0.05, zq.z], size: 0.42, azimuth: 26, elevation: 10 },
    view: { hero: { elevation: 15 } },
    rig: { default: { contact: { strength: 0.7, h0: 0.012 }, groundAO: { strength: 0.8 } } },
    meta: { color: hex },
  };
}
