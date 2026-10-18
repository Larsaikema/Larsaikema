// Beschermhoes terrasheater: protective cover over a mushroom patio heater.
//
// heaterCover { color, zip, heater }
//   color   cover colour (default 'antraciet' charcoal 600D oxford; 'zwart', 'grijs', 'groen', '#hex')
//   zip     full-length zip on the front (true)
//   heater  false: leave the heater out (its foot sits under the hem by default)
//
// Construction: 600D polyester oxford with a PU coating (js/softGoods fabric600), cut as a tapered
// tube with a round top: Ø 89 cm over the reflector, Ø 52 cm at the hem, down to the floor (the
// heater's base is covered). The top lies over the reflector cone and its cap (taut, a soft
// hollow between cap and rim), turns over the rolled rim and then hangs: long irregular vertical
// folds that start just under the rim, grow to mid-height and calm down where the drawstring
// gathers the hem. What makes it read as cloth at catalogue size (round 4): four panel seams as
// raised ridges with a pucker groove and double rows of light-grey contrast stitching, the
// shoulder seam stitched round the top, the soft packing creases of a new cover (irregular
// horizontal folds and two vertical ones), a #8 coil zip down the front (black tape, glossy grey
// coil, two stitch rows, a large zinc slider with a cord pull), a round rolled hem with the cord
// inside, and the drawstring: light-grey cord out of an eyelet, a barrel cord lock lying on the
// floor in front of the hem, moulded end tips. A webbing loop on the top.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as L from '../js/lightKit.js';
import * as SG from '../js/softGoods.js';
import { heater } from './heater.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function heaterCover(p = {}) {
  const color = p.color || 'antraciet';
  const hex = { antraciet: '#3A3D41', zwart: '#1B1C1E', grijs: '#5E6266', groen: '#2C4032', beige: '#B9AC92' }[String(color).toLowerCase()] || color;
  // 600D oxford with the basket weave, yarn streaks and coating gloss of js/softGoods.js
  const fab = SG.fabric600(hex, { sheen: 0.62, rough: 0.6 });
  const nz = L.noise;
  const zipAz = 20 * DEG;                       // the zip faces the heater's door side
  // four skirt panels: seams at 90 degree steps, clear of the zip
  const SEAMS = [45, 135, 225, 315].map((d) => zipAz + d * DEG);

  // profile (r, y) from the top centre over the reflector and down to the hem
  const yHem = 0.026, Rrim = 0.448, yRim = 2.13, Rhem = 0.262;
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
  // packing creases (height, strength, tilt, phase): irregular, as a cover comes out of its bag
  const CREASES = [[0.27, 0.8, 0.012, 0.3], [0.55, 1.0, -0.018, 2.1], [0.9, 0.7, 0.01, 4.0], [1.18, 1.0, 0.022, 1.2], [1.52, 0.6, -0.01, 5.1], [1.81, 0.85, 0.015, 3.3]];
  // fold displacement (radial) at angle a and height y on the skirt
  const fold = (a, s, y) => {
    if (s < sRim) return 0;
    const t = (yS - y) / (yS - yHem);                       // 0 under the rim .. 1 at the hem
    const grow = G.smoothstep(0, 0.22, t) * (1 - 0.55 * G.smoothstep(0.55, 1, t));
    const drift = 0.25 * nz.noise(y * 0.9, 3.1);
    let d = 0.042 * grow * (0.55 * Math.sin(8 * a + 1.3 + drift) + 0.45 * nz.noise(Math.cos(a) * 2.6 + 7.1, Math.sin(a) * 2.6 + y * 0.55));
    d += 0.011 * grow * Math.sin(13 * a + 0.4 + 2 * drift) * (0.6 + 0.4 * nz.noise(a * 2, y * 2));
    // gathered pleats at the drawstring
    // soft round gathers where the drawstring pulls the hem in (22 around, irregular)
    const g = Math.exp(-(y - yHem) / 0.085);
    const ph = 22 * a + 1.1 * nz.noise(Math.cos(a) * 1.7, Math.sin(a) * 1.7);
    d += g * (0.0052 * (0.7 * Math.sin(ph) + 0.3 * Math.sin(2 * ph + 0.9)) - 0.0035);
    // packing creases: a new cover still shows where it was folded in its bag (horizontal
    // folds every ~31 cm, a little wavy, and two vertical ones), a soft ridge with a valley
    // beside it, so the cloth catches the light in thin lines
    {
      for (const [yc, amp, tilt, ph0] of CREASES) {
        const yy = y - yc - tilt * Math.sin(a - zipAz + ph0) - 0.008 * nz.noise(a * 2.2 + ph0, 5.3 + yc);
        // a crease runs out round the cover: strong on one side, gone on the other
        const reach = G.smoothstep(-0.2, 0.5, Math.cos(a - zipAz - ph0 * 2.1));
        const crease = Math.exp(-(yy * yy) / (2 * 0.0065 * 0.0065)) - 0.55 * Math.exp(-((yy + 0.014) ** 2) / (2 * 0.009 * 0.009));
        d += 0.0028 * amp * reach * crease * (0.7 + 0.3 * nz.noise(a * 4.1, yc * 3.7));
      }
      for (const ca of [zipAz + 1.35, zipAz - 1.75]) {
        const dc = Math.atan2(Math.sin(a - ca), Math.cos(a - ca)) * Math.max(0.2, at(s)[0]);
        d += 0.0022 * (Math.exp(-(dc * dc) / (2 * 0.006 * 0.006)) - 0.5 * Math.exp(-((dc - 0.012) ** 2) / (2 * 0.008 * 0.008))) * G.smoothstep(0.05, 0.2, t);
      }
    }
    // the zip stiffens the fabric along the front
    const dz = Math.abs(Math.atan2(Math.sin(a - zipAz), Math.cos(a - zipAz)));
    d *= G.smoothstep(0.03, 0.16, dz);
    // sewn panel seams: a narrow raised ridge (seam allowance under the cloth)
    for (const sa of SEAMS) {
      const da = Math.abs(Math.atan2(Math.sin(a - sa), Math.cos(a - sa))) * Math.max(0.2, Math.hypot(0, at(s)[0]));
      // a raised seam with a slight pucker groove either side
      d += (0.0034 * Math.exp(-(da * da) / (0.004 * 0.004)) - 0.0012 * Math.exp(-((Math.abs(da) - 0.009) ** 2) / (0.003 * 0.003))) * (1 - G.smoothstep(0.92, 1, t));
    }
    return d;
  };
  // shoulder seam: the round top panel is sewn to the skirt just under the reflector rim
  const sShoulder = sRim + 0.035;
  const point = (u, s, o) => {
    const a = u * TAU;
    const [r, y] = at(s);
    let rr = r + (r > 0.05 ? fold(a, s, y) : 0);
    rr += 0.0024 * Math.exp(-((s - sShoulder) ** 2) / (0.004 * 0.004));
    return o.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
  };
  // rows denser towards the hem (the gathers) and fine enough round the seams
  const nu = 512, nv = 380;
  const sOfV = (v) => Ltot * (1 - Math.pow(1 - v, 1.22));
  const skin = G.surface((u, v, o) => point(u, sOfV(v), o), nu, nv, { closedU: true, uvScale: [TAU * Rrim, Ltot], flipNormals: true });
  { const uvA = skin.attributes.uv; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uvA.setY(j * (nu + 1) + i, sOfV(j / nv)); }
  const bins = new G.PartBin();
  bins.add(fab, skin);

  // hem: the drawcord channel is a rolled, padded edge (round, ~14 mm) that finishes the cover
  // cleanly at the bottom; the cord runs inside it
  {
    const hemPts = [];
    for (let i = 0; i <= 720; i++) { const q = point(i / 720, Ltot - 0.006, V3()); const k = 1 + 0.002 / Math.hypot(q.x, q.z); q.x *= k; q.z *= k; hemPts.push(q); }
    hemPts[hemPts.length - 1].copy(hemPts[0]);
    bins.add(fab, L.sweepProfile(hemPts, L.circleProfile(0.007, 14), { caps: false }).geo);
  }

  // zip: tape + moulded coil + slider/pull (near the bottom, zip closed)
  const zipPts = (off, lift) => {
    const pts = [];
    for (let i = 0; i <= 260; i++) {
      const s = sRim + 0.11 + (Ltot - 0.022 - sRim - 0.11) * (i / 260);
      const q = point(zipAz / TAU + off / (TAU * at(s)[0]), s, V3());
      const k = 1 + lift / Math.hypot(q.x, q.z); q.x *= k; q.z *= k;
      pts.push(q);
    }
    return pts;
  };
  const tapeMat = K.cached('coverZipTape', () => new THREE.MeshPhysicalMaterial({ color: '#1A1B1D', roughness: 0.7, sheen: 0.5, sheenColor: new THREE.Color('#4a4b4f'), name: 'zip tape' }));
  // #8 coil zip: a black tape either side of a glossy moulded coil (a shade lighter, so the zip
  // reads as a zip on the charcoal cloth), stitched down with two rows
  const coilMat = K.cached('coverZipCoil2', () => new THREE.MeshPhysicalMaterial({ color: '#4B4E52', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.12, name: 'zip coil' }));
  const tape = zipPts(0, 0.0012);
  const tapeFr = L.sweepProfile(tape, [[0, 0], [1e-4, 0], [0, 1e-4]], { caps: false }).frames;
  // tape: a flat strip lying on the cover (normal = outward radial)
  const nrm = tape.map((q) => V3(q.x, 0, q.z).normalize());
  const strip = K.strapAlong(tape, 0.034, 0.0014, { normals: nrm });
  bins.add(tapeMat, strip);
  bins.add(coilMat, K.strapAlong(zipPts(0, 0.0032), 0.0085, 0.0028, { normals: nrm }));
  {
    const thrZ = SG.thread('#6E7176');
    for (const off of [-0.0135, 0.0135]) {
      const pts = zipPts(off, 0.0022);
      const g = SG.stitches(pts, nrm, { len: 0.0045, gap: 0.0018, w: 0.0013, h: 0.0006 }); if (g) bins.add(thrZ, g);
    }
  }
  void tapeFr;
  {
    const sS = Ltot - 0.26;
    const q = point(zipAz / TAU, sS, V3()); const n = V3(q.x, 0, q.z).normalize();
    const up = V3(0, 1, 0), side = V3().crossVectors(up, n);
    const zinc = K.zinc();
    const M4 = new THREE.Matrix4().makeBasis(side, up, n).setPosition(q.x + n.x * 0.005, q.y, q.z + n.z * 0.005);
    const body = G.roundedBox(0.02, 0.042, 0.008, 0.0035, 2); body.applyMatrix4(M4); bins.add(zinc, body);
    const bridge = G.roundedBox(0.008, 0.016, 0.005, 0.002, 2); bridge.translate(0, -0.008, 0.006); bridge.applyMatrix4(M4); bins.add(zinc, bridge);
    const tab = G.roundedBox(0.015, 0.046, 0.0026, 0.004, 2); tab.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.1)); tab.translate(0, -0.036, 0.009); tab.applyMatrix4(M4); bins.add(zinc, tab);
    // pull cord loop through the tab
    const loopPts = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; loopPts.push(V3(Math.sin(a) * 0.008, -0.066 - 0.024 * (1 - Math.cos(a)) * 0.9, 0.011 + 0.002 * Math.cos(a)).applyMatrix4(M4)); }
    bins.add(L.cableRubber('#8C8F93', 0.7), L.sweepProfile(loopPts, L.circleProfile(0.0019, 8), { caps: false }).geo);
  }

  // drawstring: both ends leave the hem channel through an eyelet at the front, run through a
  // barrel cord lock pushed up against the hem, and lie on the floor in a loose loop with
  // moulded end tips. Light grey cord, black lock: it reads against the cloth and the floor.
  {
    const a0 = zipAz + 0.2;
    const q = point(a0 / TAU, Ltot - 0.006, V3()); const n = V3(q.x, 0, q.z).normalize();
    const cordMat = L.cableRubber('#9A9DA1', 0.7);
    const tng = V3(Math.cos(a0), 0, -Math.sin(a0));
    const rc = 0.0024;
    // eyelet ring on the hem
    const eye = new THREE.TorusGeometry(0.0062, 0.0018, 8, 24); eye.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), n));
    eye.translate(q.x + n.x * 0.0075, q.y + 0.004, q.z + n.z * 0.0075); bins.add(K.zinc(), eye);
    // the lock lies on the floor in front of the hem, pointing away from the cover
    const lockC = q.clone().addScaledVector(n, 0.07).addScaledVector(tng, 0.012).setY(0.0122);
    const lockDir = n.clone().addScaledVector(tng, 0.25).normalize();
    for (const s2 of [-1, 1]) {
      const c = [
        q.clone().addScaledVector(n, 0.004).addScaledVector(tng, s2 * 0.0025).setY(q.y + 0.004),
        q.clone().addScaledVector(n, 0.02).addScaledVector(tng, s2 * 0.003 + 0.004).setY(0.008),
        lockC.clone().addScaledVector(lockDir, -0.03).addScaledVector(tng, s2 * 0.0026).setY(0.009),
        lockC.clone().addScaledVector(lockDir, -0.012).addScaledVector(tng, s2 * 0.0022),
        lockC.clone().addScaledVector(lockDir, 0.012).addScaledVector(tng, s2 * 0.0022),
        lockC.clone().addScaledVector(lockDir, 0.03).addScaledVector(tng, s2 * 0.004).setY(rc),
        lockC.clone().addScaledVector(lockDir, 0.055).addScaledVector(tng, s2 * 0.016 + 0.006).setY(rc),
        lockC.clone().addScaledVector(lockDir, 0.07).addScaledVector(tng, s2 * 0.03 + 0.016).setY(rc),
      ];
      const path = new THREE.CatmullRomCurve3(c, false, 'centripetal').getSpacedPoints(48);
      path.forEach((pp) => { pp.y = Math.max(rc, pp.y); });
      bins.add(cordMat, L.sweepProfile(path, L.circleProfile(rc, 10)).geo);
      // moulded end tip
      const e = path[path.length - 1], d = e.clone().sub(path[path.length - 3]).normalize();
      const tip = G.lathe([[0.0001, 0], [0.0033, 0], [0.0036, 0.004], [0.0031, 0.016], [0.0001, 0.017]], 16);
      tip.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d)); tip.translate(e.x, Math.max(0.0036, e.y), e.z);
      bins.add(L.moulded('#151515', 0.4), tip);
    }
    // barrel cord lock (spring toggle): black body, grey push button on top
    const lock = G.lathe([[0.0001, -0.021], [0.0102, -0.021], [0.0118, -0.013], [0.0118, 0.013], [0.0102, 0.021], [0.0001, 0.021]], 28);
    lock.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), lockDir)); lock.translate(lockC.x, lockC.y, lockC.z); bins.add(L.moulded('#121212', 0.42), lock);
    const btn = G.lathe([[0.0001, 0], [0.0062, 0], [0.0062, 0.005], [0.0054, 0.0068], [0.0001, 0.007]], 20);
    btn.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), lockDir.clone().negate())); const bp = lockC.clone().addScaledVector(lockDir, -0.0208); btn.translate(bp.x, bp.y, bp.z);
    bins.add(L.moulded('#6A6D71', 0.4), btn);
  }

  // webbing handle on the top: both ends sewn flat onto the cover (box stitch), the loop arches
  // ~4.5 cm between them; every point follows the cover's own top profile, so nothing floats
  {
    const web = K.cached('coverWeb2', () => new THREE.MeshPhysicalMaterial({ color: '#1C1D1F', roughness: 0.62, sheen: 0.7, sheenRoughness: 0.4, sheenColor: new THREE.Color('#55575c'), name: 'webbing' }));
    const thr = SG.thread('#4A4C51');
    const topAt = (r) => { // cover top surface height at radius r (top panel), and its slope dy/dr
      let j = 1; while (j < prof.length - 1 && prof[j][0] < r) j++;
      const t = (r - prof[j - 1][0]) / Math.max(1e-9, prof[j][0] - prof[j - 1][0]);
      return [G.lerp(prof[j - 1][1], prof[j][1], t), (prof[j][1] - prof[j - 1][1]) / Math.max(1e-9, prof[j][0] - prof[j - 1][0])];
    };
    const surfPt = (x, lift) => { const [y, dy] = topAt(Math.abs(x)); const nn = V3(-Math.sign(x || 1) * dy, 1, 0).normalize(); return { p: V3(x, y, 0).addScaledVector(nn, lift), n: nn }; };
    const th = 0.0022, wW = 0.025, xIn = 0.042, xOut = 0.088, hLoop = 0.046;
    // the arch (between the inner ends of the tabs)
    const arch = [], archN = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, x = -xIn + 2 * xIn * t;
      const base = surfPt(x, th / 2).p;
      const lift = hLoop * Math.pow(Math.sin(Math.PI * t), 0.8);
      arch.push(base.clone().add(V3(0, lift, 0)));
    }
    for (let i = 0; i <= 40; i++) { const a = arch[Math.max(0, i - 1)], b = arch[Math.min(40, i + 1)]; const T = b.clone().sub(a).normalize(); archN.push(V3(-T.y, T.x, 0).normalize().multiplyScalar(T.x >= 0 ? 1 : -1)); }
    bins.add(web, K.strapAlong(arch, wW, th, { normals: archN }));
    // the sewn-down ends: flat on the cover, folded edge towards the loop
    for (const sx of [-1, 1]) {
      const tab = [], tabN = [];
      for (let i = 0; i <= 12; i++) { const x = sx * (xIn - 0.004 + (xOut - xIn) * (i / 12)); const q = surfPt(x, th / 2 + 0.0004); tab.push(q.p); tabN.push(q.n); }
      if (sx < 0) { tab.reverse(); tabN.reverse(); }
      bins.add(web, K.strapAlong(tab, wW, th, { normals: tabN }));
      // box stitch with a cross: four sides + two diagonals, in the tab's own frame
      const box = [], c0 = sx * (xIn + 0.006), c1 = sx * (xOut - 0.006), hz = wW / 2 - 0.004;
      const P = (x, z) => { const q = surfPt(x, th + 0.0006); return { p: q.p.clone().setZ(z), n: q.n }; };
      for (const [a, b] of [[[c0, -hz], [c1, -hz]], [[c1, -hz], [c1, hz]], [[c1, hz], [c0, hz]], [[c0, hz], [c0, -hz]], [[c0, -hz], [c1, hz]], [[c0, hz], [c1, -hz]]]) {
        const pts = [], nrm = [];
        for (let i = 0; i <= 10; i++) { const t = i / 10; const q = P(G.lerp(a[0], b[0], t), G.lerp(a[1], b[1], t)); pts.push(q.p); nrm.push(q.n); }
        const g = SG.stitches(pts, nrm, { len: 0.003, gap: 0.0014, w: 0.0011, h: 0.0005 });
        if (g) box.push(g);
      }
      for (const g of box) bins.add(thr, g);
    }
  }

  // stitching: double rows along the panel seams, one row round the shoulder, the hem channel
  {
    const thr = SG.thread(new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.42).getStyle());
    const radial = (q) => V3(q.x, 0, q.z).normalize();
    const line = (fn, n) => { const pts = [], nrm = []; for (let i = 0; i <= n; i++) { const q = fn(i / n); pts.push(q); nrm.push(radial(q)); } return { pts, nrm }; };
    for (const sa of SEAMS) for (const off of [-0.0065, 0.0065]) {
      const { pts, nrm } = line((t) => { const sS = sShoulder + 0.012 + (Ltot - 0.04 - sShoulder - 0.012) * t; const r = at(sS)[0]; const q = point((sa + off / r) / TAU, sS, V3()); return q.addScaledVector(radial(q), 0.0004); }, 220);
      const g = SG.stitches(pts, nrm, { len: 0.0048, gap: 0.0018, w: 0.0016, h: 0.0008 }); if (g) bins.add(thr, g);
    }
    for (const [sS, n] of [[sShoulder + 0.008, 360], [Ltot - 0.022, 300]]) {
      const { pts, nrm } = line((t) => { const q = point(t, sS, V3()); return q.addScaledVector(radial(q), 0.0006); }, n);
      const g = SG.stitches(pts, nrm, { len: 0.0048, gap: 0.0018, w: 0.0016, h: 0.0008 }); if (g) bins.add(thr, g);
    }
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
