// Terrace and tent heaters, plus the loose infrared element.
//
// heater { kind: 'gas' | 'elektrisch', style, watt, on, clamp, color, mountedOn }
//   gas 'paddenstoel'  mushroom patio heater, 13 kW, 2.27 m, brushed stainless (color 'zwart' for
//                      black powder coat): spun base dish with a rubber edge and two transport wheels,
//                      bottle housing (Ø 43 cm, 10 kg propane) with a door (seams, lock knob) and vent
//                      slots, Ø 76 mm pole, control box with gas knob and piezo button, burner pan,
//                      perforated emitter screen (glowing red-orange when on) inside a guard of 12
//                      rods, Ø 86 cm spun reflector with a rolled rim on three stays, top cap.
//   gas 'flame'        pyramid flame heater, 9 kW, 2.27 m: tapered square bottle housing with a door
//                      and vents, quartz-glass tube (Ø 10 cm) with a swirling flame, four slanted
//                      posts with two tie frames, square hood. Black powder coat (color 'rvs').
//   gas 'lounge'       standing lounge heater, 1.15 m: the same flame column on a 5 kg bottle housing.
//   gas 'tafel'        table-top mushroom heater, 0.92 m: weighted round foot, emitter and Ø 56 cm
//                      reflector; gas hose with regulator.
//   elektrisch         infrared quartz heater (1500 W): extruded aluminium housing with cooling ribs,
//                      polished reflector trough, golden quartz-halogen tube (glowing when on), wire
//                      guard, end caps, U-bracket with tilt knobs; stands on its bracket, tilted up,
//                      with the leg clamp for an easy-up leg in front (clamp: false to leave it out).
//                      mountedOn 'leg': fitted on a vertical leg at the y axis (height 2.0 m).
//   on (default true): gas heaters glow / show the flame, the electric element glows.
// heaterElement { watt }   the replacement quartz tube on its own.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------
// materials

function rvs(rough = 0.19) {
  return L.cached(`htrRvs:${rough}`, () => new THREE.MeshPhysicalMaterial({ color: '#D9DCDF', metalness: 1, roughness: rough, name: 'stainless 304' }));
}
function frameMat(color) {
  const c = String(color || '').toLowerCase();
  if (c === 'rvs' || c === 'stainless' || c === 'zilver') return rvs(0.19);
  const hex = { zwart: '#1A1B1D', antraciet: '#34373B', brons: '#4A3B2C', grijs: '#6E7276', wit: '#E4E4E0' }[c] || '#1A1B1D';
  return L.diecast(hex, { rough: 0.5, coat: 0.25 });
}
function perforation() {
  return L.cached('htrPerf', () => {
    const W = 32, d = new Uint8Array(W * W * 4);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - W / 2, dy = y + 0.5 - W / 2, r = Math.hypot(dx, dy) / (W / 2);
      const v = r < 0.55 ? 0 : r < 0.68 ? Math.round(255 * (r - 0.55) / 0.13) : 255;
      const k = (y * W + x) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255;
    }
    const t = new THREE.DataTexture(d, W, W, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  });
}
function emitterMat(on, rep) {
  return L.cached(`htrEmit:${on}:${rep[0]}:${rep[1]}`, () => {
    const map = perforation().clone(); map.repeat.set(...rep); map.needsUpdate = true;
    const m = new THREE.MeshPhysicalMaterial({ color: on ? '#4A1E10' : '#5E6266', metalness: on ? 0.2 : 0.7, roughness: 0.55, map, name: on ? 'emitter screen lit' : 'emitter screen' });
    if (on) { m.emissive = new THREE.Color('#FF5216'); m.emissiveIntensity = 3.4; m.emissiveMap = map; }
    m.side = THREE.DoubleSide;
    return m;
  });
}
const rubberMat = () => L.cableRubber('#141414', 0.7);
const knobMat = () => L.moulded('#121212', 0.38);

// flat-shaded square frustum (for pyramid housings and hoods), centred on the y axis
function frustum(wb, wt, y0, y1) {
  const g = new THREE.CylinderGeometry(wt / Math.SQRT2, wb / Math.SQRT2, y1 - y0, 4, 1).toNonIndexed();
  g.rotateY(Math.PI / 4); g.translate(0, (y0 + y1) / 2, 0); g.computeVertexNormals();
  g.deleteAttribute('uv');
  return g;
}

// ---------------------------------------------------------------------------------------
// mushroom heaters (paddenstoel / tafel)

function mushroom(bins, extra, { table = false, on, mat, color }) {
  const steel = mat;
  const seam = L.moulded('#2C2D2F', 0.6);
  const doorAz = 20 * DEG;
  const out = (a) => V3(Math.sin(a), 0, Math.cos(a));
  let yTop;
  let poleR, yC;
  if (!table) {
    // base: rubber edge ring + spun dish
    const Rb = 0.235;
    bins.add(rubberMat(), G.lathe([[Rb - 0.014, 0], [Rb + 0.003, 0], [Rb + 0.004, 0.013], [Rb - 0.014, 0.013]], 96));
    bins.add(steel, G.lathe([[Rb - 0.001, 0.011], [Rb + 0.0005, 0.02], [Rb - 0.006, 0.028], [0.205, 0.039], [0.15, 0.052], [0.0001, 0.058]], 96));
    // two wheels at the back
    for (const s of [-1, 1]) {
      const a = Math.PI + doorAz + s * 0.42, c = out(a).multiplyScalar(0.2).setY(0.034);
      const tang = V3(Math.cos(a), 0, -Math.sin(a));
      const wh = G.lathe([[0.0001, -0.012], [0.03, -0.012], [0.034, -0.008], [0.034, 0.008], [0.03, 0.012], [0.0001, 0.012]], 32);
      // axle along the tangent: lathe axis (y) -> tangent
      const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), tang);
      wh.applyQuaternion(q); wh.translate(c.x, c.y, c.z);
      bins.add(rubberMat(), wh);
      const hub = G.lathe([[0.0001, -0.0135], [0.013, -0.0135], [0.013, 0.0135], [0.0001, 0.0135]], 20); hub.applyQuaternion(q); hub.translate(c.x, c.y, c.z); bins.add(steel, hub);
    }
    // bottle housing with domed top and a collar for the pole
    const Rh = 0.2155, y0 = 0.034, y1 = 0.83;
    bins.add(steel, G.lathe([[0.199, y0], [0.212, y0 + 0.004], [Rh, y0 + 0.016], [Rh, y1 - 0.03], [0.212, y1 - 0.012], [0.193, y1], [0.1, y1 + 0.022], [0.05, y1 + 0.03], [0.046, y1 + 0.036], [0.046, y1 + 0.052], [0.0001, y1 + 0.053]], 128));
    // door: two vertical seams and two horizontal seams, lock knob
    const dw = 0.36; // half angle of the door (rad)
    for (const s of [-1, 1]) {
      const a = doorAz + s * dw;
      const p0 = out(a).multiplyScalar(Rh + 0.0004);
      bins.add(seam, G.tube(p0.clone().setY(y0 + 0.07), p0.clone().setY(y1 - 0.06), 0.0011, 6));
    }
    for (const yy of [y0 + 0.07, y1 - 0.06]) {
      const pts = []; for (let k = 0; k <= 24; k++) { const a = doorAz - dw + (2 * dw * k) / 24; pts.push(out(a).multiplyScalar(Rh + 0.0004).setY(yy)); }
      bins.add(seam, L.sweepProfile(pts, L.circleProfile(0.0011, 6)).geo);
    }
    const lk = out(doorAz + dw * 0.72).multiplyScalar(Rh).setY(y1 - 0.12);
    const lock = G.lathe([[0.0001, 0], [0.012, 0], [0.012, 0.006], [0.009, 0.009], [0.0001, 0.009]], 24);
    lock.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), out(doorAz + dw * 0.72))); lock.translate(lk.x, lk.y, lk.z); bins.add(knobMat(), lock);
    // vent slots: a row low and a row high around the back half
    const slot = L.moulded('#101010', 0.7);
    for (const yy of [y0 + 0.045, y1 - 0.035]) for (let k = 0; k < 9; k++) {
      const a = doorAz + Math.PI + (k - 4) * 0.21;
      const c = out(a).multiplyScalar(Rh + 0.0002).setY(yy);
      const g = G.roundedBox(0.032, 0.007, 0.0012, 0.0034, 2);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), out(a))); g.translate(c.x, c.y, c.z); bins.add(slot, g);
    }
    poleR = 0.038; yC = 1.76;
    bins.add(steel, G.tube(V3(0, y1 + 0.05, 0), V3(0, yC + 0.002, 0), poleR, 40));
    // pole joint collar halfway (two-part pole)
    bins.add(steel, G.lathe([[poleR + 0.0005, 1.3], [poleR + 0.004, 1.303], [poleR + 0.004, 1.332], [poleR + 0.0005, 1.335]], 40));
  } else {
    // weighted round foot, short pole
    bins.add(rubberMat(), G.lathe([[0.16, 0], [0.183, 0], [0.184, 0.01], [0.16, 0.01]], 80));
    bins.add(steel, G.lathe([[0.182, 0.008], [0.183, 0.022], [0.17, 0.035], [0.12, 0.056], [0.05, 0.068], [0.03, 0.072], [0.03, 0.09], [0.0001, 0.091]], 80));
    poleR = 0.024; yC = 0.55;
    bins.add(steel, G.tube(V3(0, 0.088, 0), V3(0, yC + 0.002, 0), poleR, 32));
    // gas hose from the foot to a regulator lying on the floor
    const hp = [V3(0.0, 0.03, -0.17), V3(0.02, 0.012, -0.24), V3(0.09, 0.008, -0.31), V3(0.2, 0.008, -0.3), V3(0.27, 0.008, -0.22)];
    const hose = new THREE.CatmullRomCurve3(hp, false, 'centripetal').getSpacedPoints(60);
    hose.forEach((q) => { q.y = Math.max(0.008, q.y); });
    bins.add(L.cableRubber('#1A1A1A', 0.6), L.sweepProfile(hose, L.circleProfile(0.007, 12)).geo);
    const e = hose[hose.length - 1], d = e.clone().sub(hose[hose.length - 3]).normalize();
    const reg = G.lathe([[0.0001, 0], [0.012, 0], [0.012, 0.03], [0.026, 0.034], [0.026, 0.05], [0.012, 0.054], [0.0001, 0.054]], 32);
    reg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d)); reg.translate(e.x, 0.026, e.z);
    bins.add(L.cached('brassReg', () => new THREE.MeshPhysicalMaterial({ color: '#B8975A', metalness: 1, roughness: 0.32, name: 'brass' })), reg);
    const dial = G.lathe([[0.0001, 0], [0.02, 0], [0.02, 0.012], [0.0001, 0.012]], 24); dial.translate(0, 0, 0);
    dial.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), V3(0, 1, 0))); dial.translate(e.x + d.x * 0.042, 0.052, e.z + d.z * 0.042);
    bins.add(knobMat(), dial);
  }
  const k = table ? 0.62 : 1;
  // control box with the gas knob and the piezo button, facing the door side
  bins.add(steel, G.lathe([[poleR + 0.001, yC], [0.085 * k, yC + 0.012], [0.088 * k, yC + 0.03], [0.088 * k, yC + 0.1 * k], [0.08 * k, yC + 0.112 * k], [0.04, yC + 0.116 * k]], 64));
  const cA = doorAz, cn = out(cA);
  const kn = G.lathe([[0.0001, 0], [0.023 * k, 0], [0.023 * k, 0.02 * k], [0.019 * k, 0.026 * k], [0.0001, 0.027 * k]], 32);
  kn.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), cn)); const kp = cn.clone().multiplyScalar(0.086 * k).setY(yC + 0.06 * k); kn.translate(kp.x, kp.y, kp.z); bins.add(knobMat(), kn);
  const bA = cA + 0.55, bn = out(bA);
  const bt = G.lathe([[0.0001, 0], [0.009 * k, 0], [0.009 * k, 0.008], [0.0001, 0.01]], 20);
  bt.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), bn)); const bp = bn.clone().multiplyScalar(0.086 * k).setY(yC + 0.06 * k); bt.translate(bp.x, bp.y, bp.z);
  bins.add(L.moulded('#B3261E', 0.4), bt);
  // burner pan, emitter screen, guard rods
  const yE0 = yC + 0.118 * k, He = (table ? 0.14 : 0.21), yE1 = yE0 + He, Re = table ? 0.066 : 0.105, Rg = table ? 0.095 : 0.15;
  bins.add(steel, G.lathe([[0.04, yE0], [Rg + 0.006, yE0 + 0.004], [Rg + 0.006, yE0 + 0.016], [0.0001, yE0 + 0.018]], 64));
  const emit = new THREE.CylinderGeometry(Re, Re, He - 0.03, 64, 1, true); emit.translate(0, (yE0 + yE1) / 2, 0);
  bins.add(emitterMat(on, [Math.round((TAU * Re) / 0.0045), Math.round((He - 0.03) / 0.0045)]), emit);
  // the screen's top cap (dark steel) and inner deflector
  bins.add(steel, G.lathe([[0.0001, yE1 - 0.016], [Re + 0.006, yE1 - 0.016], [Re + 0.006, yE1 - 0.004], [0.0001, yE1 - 0.002]], 48));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13, c = out(a).multiplyScalar(Rg);
    bins.add(steel, G.tube(c.clone().setY(yE0 + 0.014), c.clone().setY(yE1 + 0.004), table ? 0.0028 : 0.0038, 8));
  }
  for (const yy of [yE0 + 0.06, yE1 + 0.002]) { const t = new THREE.TorusGeometry(Rg, table ? 0.003 : 0.004, 8, 96); t.rotateX(Math.PI / 2); t.translate(0, yy, 0); bins.add(steel, t); }
  // reflector hat: thin spun cone with a rolled rim, on three stays
  const Rr = table ? 0.28 : 0.43, yR = yE1 + (table ? 0.03 : 0.05), hR = table ? 0.07 : 0.1;
  bins.add(steel, G.lathe([[0.0001, yR + hR - 0.012], [0.05, yR + hR - 0.016], [Rr * 0.55, yR + hR * 0.42], [Rr - 0.004, yR - 0.002], [Rr + 0.004, yR - 0.004], [Rr + 0.008, yR + 0.001], [Rr + 0.004, yR + 0.006], [Rr * 0.55, yR + hR * 0.42 + 0.008], [0.05, yR + hR - 0.006], [0.0001, yR + hR - 0.004]], 160));
  bins.add(steel, G.lathe([[0.0001, yR + hR - 0.006], [0.055, yR + hR - 0.006], [0.05, yR + hR + 0.012], [0.02, yR + hR + 0.026], [0.006, yR + hR + 0.04], [0.0001, yR + hR + 0.042]], 48));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5, c0 = out(a).multiplyScalar(Rg).setY(yE1 + 0.004), c1 = out(a).multiplyScalar(Rr * 0.5).setY(yR + hR * 0.42 + 0.004);
    bins.add(steel, G.tube(c0, c1, table ? 0.003 : 0.0045, 8));
  }
  yTop = yR + hR + 0.042;
  if (on) {
    const pts = []; for (let i = 0; i <= 12; i++) pts.push(V3(0, yE0 + 0.02 + (He - 0.04) * (i / 12), 0));
    extra.push(L.haloTube(pts, Re * 3.2, L.lin('#FF7A30', 1.2), 0.42, { core: 0.42, coreW: 0.75, radial: 24 }));
  }
  return { top: yTop, detailY: (yE0 + yE1) / 2 };
}

// ---------------------------------------------------------------------------------------
// flame column heaters (pyramid / lounge)

function flameGeometry(y0, y1, R, seed = 1) {
  // a swirling flame: a tube around a helical centreline inside the glass, emissive colour by height
  const nz = L.noise;
  const N = 220, radial = 18;
  const pos = [], glow = [], idx = [];
  const turns = (y1 - y0) * 1.7 + 0.8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = y0 + t * (y1 - y0);
    const a = t * turns * TAU + seed;
    const rh = R * (0.18 + 0.16 * G.smoothstep(0, 0.3, t));
    const cx = Math.cos(a) * rh, cz = Math.sin(a) * rh;
    const rf = R * (0.14 + 0.36 * G.smoothstep(0, 0.12, t) * (1 - 0.55 * G.smoothstep(0.55, 1, t))) * (1 + 0.15 * nz.noise(t * 9 + seed, 1.7));
    // colour (linear, pre-exposure) and coverage by height
    let c, cov;
    if (t < 0.05) { c = [0.2, 0.35, 1.3]; cov = 0.5; }
    else if (t < 0.35) { const u = G.smoothstep(0.05, 0.14, t); c = [G.lerp(0.8, 2.3, u), G.lerp(0.55, 1.25, u), G.lerp(1.1, 0.22, u)]; cov = 0.92; }
    else { const u = G.smoothstep(0.35, 1, t); c = [G.lerp(2.3, 1.1, u), G.lerp(1.25, 0.2, u), G.lerp(0.22, 0.02, u)]; cov = G.lerp(0.92, 0.0, Math.pow(u, 1.5)); }
    for (let k = 0; k <= radial; k++) {
      const b = (k / radial) * TAU;
      // tongues: coverage varies round the flame and along it
      const tongue = 0.7 + 0.3 * nz.noise(Math.cos(b) * 1.3 + t * 11 + seed, Math.sin(b) * 1.3 + t * 3);
      pos.push(cx + Math.cos(b) * rf, y, cz + Math.sin(b) * rf);
      const cv = Math.max(0, Math.min(0.97, cov * tongue));
      glow.push(c[0] * cv, c[1] * cv, c[2] * cv, cv);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < N; i++) for (let k = 0; k < radial; k++) { const p0 = i * row + k; idx.push(p0, p0 + row, p0 + 1, p0 + 1, p0 + row, p0 + row + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
  g.setIndex(idx);
  return g;
}

function flameColumn(bins, extra, { H, W, Hb, Wt, R, on, mat, lounge = false }) {
  const body = mat;
  const seam = L.moulded('#0E0E0F', 0.6);
  // plinth, tapered housing, top plate
  bins.add(body, frustum(W + 0.02, W + 0.02, 0, 0.016));
  const Wh = W * 0.88;
  bins.add(body, frustum(W, Wh, 0.016, Hb));
  bins.add(body, frustum(Wh + 0.024, Wh + 0.024, Hb, Hb + 0.016));
  // door on the front face: the face leans back, so the seams follow the taper
  const face = (y, inset = 0) => { const w = G.lerp(W, Wh, (y - 0.016) / (Hb - 0.016)); return w / 2 + 0.0006 - inset; };
  const yd0 = 0.07, yd1 = Hb - 0.07;
  for (const s of [-1, 1]) {
    const a = V3(s * (face(yd0) - 0.06), yd0, face(yd0)), b = V3(s * (face(yd1) - 0.06), yd1, face(yd1));
    bins.add(seam, G.tube(a, b, 0.0012, 6));
  }
  for (const yy of [yd0, yd1]) bins.add(seam, G.tube(V3(-(face(yy) - 0.06), yy, face(yy)), V3(face(yy) - 0.06, yy, face(yy)), 0.0012, 6));
  // door handle (recessed pull) and vents on the side faces
  const hy = (yd0 + yd1) / 2 + 0.06;
  bins.add(knobMat(), G.roundedBox(0.012, 0.07, 0.008, 0.004, 2).translate(face(hy) - 0.09, hy, face(hy) + 0.002));
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
    const yy = 0.06 + k * 0.022, x = s * (face(yy) + 0.0002);
    const g = G.roundedBox(0.0014, 0.008, W * 0.42, 0.0035, 2); g.translate(x, yy, 0); bins.add(seam, g);
  }
  // burner bowl, glass tube with collars
  const yG0 = Hb + 0.016, yG1 = H - (lounge ? 0.11 : 0.19);
  bins.add(body, G.lathe([[R * 1.25, yG0], [R * 1.25, yG0 + 0.035], [R + 0.004, yG0 + 0.04], [R + 0.004, yG0 + 0.03], [0.0001, yG0 + 0.03]], 48));
  bins.add(body, G.lathe([[R + 0.004, yG1 - 0.03], [R * 1.25, yG1 - 0.026], [R * 1.25, yG1], [0.0001, yG1 + 0.001]], 48));
  const glass = L.clearGlass({ tint: '#F3F2EC', coverage: 0.2, salt: 4.4, emissive: on ? '#FF9A4A' : null, emissiveIntensity: on ? 0.25 : 0 });
  const tube = new THREE.CylinderGeometry(R, R, yG1 - yG0 - 0.06, 64, 1, true); tube.translate(0, (yG0 + yG1) / 2, 0);
  bins.add(glass, tube);
  // posts from the housing corners to the hood corners, two tie frames
  const c0 = Wh / 2 - 0.025, c1 = Wt / 2;
  const postAt = (sx, sz, y) => { const t = (y - Hb) / (yG1 - Hb); return V3(sx * G.lerp(c0, c1, t), y, sz * G.lerp(c0, c1, t)); };
  const sq = (w) => G.roundedRectProfile(w, w, w * 0.18, 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bins.add(body, G.prism(sq(lounge ? 0.018 : 0.022), postAt(sx, sz, Hb + 0.016), postAt(sx, sz, yG1 + 0.012), { side: V3(sx, 0, -sz).normalize() }));
  for (const f of lounge ? [0.5] : [0.36, 0.7]) {
    const y = G.lerp(Hb, yG1, f);
    const cs = [postAt(-1, -1, y), postAt(1, -1, y), postAt(1, 1, y), postAt(-1, 1, y)];
    for (let i = 0; i < 4; i++) bins.add(body, G.tube(cs[i], cs[(i + 1) % 4], 0.005, 8));
    // tube guard ring held by four spokes
    const rr = R + 0.012;
    const ring = new THREE.TorusGeometry(rr, 0.004, 8, 48); ring.rotateX(Math.PI / 2); ring.translate(0, y, 0); bins.add(body, ring);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; bins.add(body, G.tube(V3(Math.sin(a) * rr, y, Math.cos(a) * rr), cs[[2, 1, 0, 3][i]].clone(), 0.0035, 6)); }
  }
  // square hood: plate + shallow pyramid roof with a vent cap
  const Wr = Wt + (lounge ? 0.09 : 0.14);
  bins.add(body, frustum(Wt + 0.03, Wt + 0.03, yG1 + 0.012, yG1 + 0.03));
  bins.add(body, frustum(Wr, Wr, yG1 + 0.03, yG1 + 0.042));
  bins.add(body, frustum(Wr - 0.004, Wr * 0.32, yG1 + 0.042, H - 0.03));
  bins.add(body, frustum(Wr * 0.3, Wr * 0.26, H - 0.03, H));
  // control knob + igniter on the front of the housing top
  const kz = Wh / 2 + 0.002, ky = Hb - 0.035;
  const kn = G.lathe([[0.0001, 0], [0.021, 0], [0.021, 0.018], [0.017, 0.024], [0.0001, 0.025]], 32); kn.rotateX(Math.PI / 2); kn.translate(0.07, ky, kz); bins.add(knobMat(), kn);
  const bt = G.lathe([[0.0001, 0], [0.008, 0], [0.008, 0.008], [0.0001, 0.009]], 16); bt.rotateX(Math.PI / 2); bt.translate(0.12, ky, kz); bins.add(L.moulded('#B3261E', 0.4), bt);
  if (on) {
    extra.push(L.glowSurface(flameGeometry(yG0 + 0.04, yG1 - 0.05, R, 1.3)));
    const pts = []; for (let i = 0; i <= 16; i++) pts.push(V3(0, yG0 + 0.06 + (yG1 - yG0 - 0.16) * (i / 16), 0));
    extra.push(L.haloTube(pts, R * 2.6, L.lin('#FF8A3A', 1.25), 0.4, { core: 0.4, coreW: 0.7, radial: 24, aFn: (t) => 0.42 * (1 - 0.6 * t) }));
  }
  return { top: H, detailY: G.lerp(yG0, yG1, 0.35) };
}

// ---------------------------------------------------------------------------------------
// electric infrared heater

function electric(p) {
  const watt = Number(p.watt ?? 1500);
  const on = p.on !== false;
  const Lh = watt > 1800 ? 0.6 : 0.47, Hh = 0.096, Dh = 0.082;
  const alu = L.cached('htrAlu', () => new THREE.MeshPhysicalMaterial({ color: '#BCC0C4', metalness: 1, roughness: 0.36, name: 'anodised aluminium' }));
  const cap = L.moulded('#151515', 0.42);
  const bins = new G.PartBin();
  // extruded housing: back body with horizontal cooling ribs, open front with two lips
  const back = G.roundedBox(Lh, Hh, Dh * 0.62, 0.014, 4); back.translate(0, 0, -Dh * 0.19); bins.add(alu, back);
  for (let i = -3; i <= 3; i++) { const r = G.roundedBox(Lh - 0.004, 0.004, 0.012, 0.0015, 1); r.translate(0, i * 0.012, -Dh / 2 - 0.004); bins.add(alu, r); }
  for (const s of [-1, 1]) { const lip = G.roundedBox(Lh, 0.012, Dh * 0.42, 0.004, 2); lip.translate(0, s * (Hh / 2 - 0.006), Dh * 0.29); bins.add(alu, lip); }
  // reflector trough (polished), its inner face picks up the glow
  const refl = L.cached(`htrRefl:${on}`, () => new THREE.MeshPhysicalMaterial({ color: '#E9E1CC', metalness: 1, roughness: 0.14, emissive: new THREE.Color(on ? '#FF7A28' : '#000000'), emissiveIntensity: on ? 0.22 : 0, side: THREE.DoubleSide, name: 'reflector' }));
  bins.add(refl, G.surface((u, v, o) => { const yy = (v - 0.5) * (Hh - 0.022); o.set((u - 0.5) * (Lh - 0.03), yy, Dh * 0.33 - 0.06 * 0 - (1 - (yy / ((Hh - 0.022) / 2)) ** 2) * 0.026); }, 8, 24));
  // quartz-halogen tube (gold-coated back) in ceramic holders
  const zT = Dh * 0.33 - 0.012;
  const tubeG = new THREE.CylinderGeometry(0.0052, 0.0052, Lh - 0.05, 24); tubeG.rotateZ(Math.PI / 2); tubeG.translate(0, 0, zT);
  bins.add(on ? L.emissiveMat('#FF9A3A', 7, { color: '#FFD9A0', roughness: 0.25, name: 'halogen tube lit' }) : L.cached('htrTubeOff', () => new THREE.MeshPhysicalMaterial({ color: '#C9A15C', metalness: 0.7, roughness: 0.25, name: 'gold quartz tube' })), tubeG);
  const ceramic = L.moulded('#ECE9E1', 0.7);
  for (const s of [-1, 1]) { const h = G.roundedBox(0.016, 0.022, 0.02, 0.004, 2); h.translate(s * (Lh / 2 - 0.022), 0, zT); bins.add(ceramic, h); }
  // wire guard: vertical wires across the opening and two rails
  const wire = L.diecast('#1C1C1E', { rough: 0.4, coat: 0.2 });
  for (let i = 0; i <= 18; i++) { const x = -Lh / 2 + 0.03 + (i / 18) * (Lh - 0.06); bins.add(wire, G.tube(V3(x, -Hh / 2 + 0.01, Dh / 2 + 0.004), V3(x, Hh / 2 - 0.01, Dh / 2 + 0.004), 0.0011, 5)); }
  for (const yy of [-0.022, 0.022]) bins.add(wire, G.tube(V3(-Lh / 2 + 0.02, yy, Dh / 2 + 0.0055), V3(Lh / 2 - 0.02, yy, Dh / 2 + 0.0055), 0.0013, 6));
  // end caps
  for (const s of [-1, 1]) { const c = G.roundedBox(0.02, Hh + 0.012, Dh + 0.012, 0.007, 3); c.translate(s * (Lh / 2 + 0.008), 0, 0); bins.add(cap, c); }
  // U-bracket from the end caps, tilt knobs
  const body = L.diecast('#1B1C1E');
  const xs = Lh / 2 + 0.024, yb = Hh / 2 + 0.03;
  const strap = (a, b, side) => G.flatBar(a, b, 0.024, 0.003, side, 0.0012);
  for (const s of [-1, 1]) {
    bins.add(body, strap(V3(s * xs, 0.014, 0), V3(s * xs, -yb + 0.012, 0), V3(0, 0, 1)));
    const kb = G.lathe([[0.0001, -0.006], [0.012, -0.006], [0.012, 0.006], [0.0001, 0.006]], 24); kb.rotateZ(Math.PI / 2); kb.translate(s * (xs + 0.009), 0, 0); bins.add(cap, kb);
    const bend = new THREE.TorusGeometry(0.0105, 0.0015, 6, 10, Math.PI / 2); bend.scale(1, 1, 8); bend.rotateZ(s > 0 ? -Math.PI / 2 : Math.PI); bend.translate(s * (xs - 0.0105), -yb + 0.012, 0); bins.add(body, bend);
  }
  bins.add(body, strap(V3(-xs + 0.0105, -yb + 0.0015, 0), V3(xs - 0.0105, -yb + 0.0015, 0), V3(0, 0, 1)));
  // assemble: housing tilted up 18 degrees (stand) or down 30 (fitted)
  const mounted = p.mountedOn === 'leg';
  const tilt = mounted ? -30 * DEG : 18 * DEG;
  const headG = new THREE.Group(); bins.build(headG);
  // tilt only the housing parts: rebuild with the bracket separate is simpler -> tilt the lot and
  // counter-rotate the bracket meshes is not possible in merged bins, so tilt about the knob axis
  // by splitting: the bracket stays level (meshes named by material 'diecast' are the bracket)
  const tiltG = new THREE.Group(); const fixG = new THREE.Group();
  for (const m of [...headG.children]) { if (/diecast #1B1C1E/.test(m.material.name || '')) fixG.add(m); else tiltG.add(m); }
  tiltG.rotation.x = -tilt;
  const outer = new THREE.Group(); outer.add(tiltG, fixG);
  const extra = [];
  const bins2 = new G.PartBin();
  if (!mounted) {
    outer.position.y = yb;
    if (p.clamp !== false) {
      const cb = new G.PartBin(); L.legClamp(cb, body, cap);
      const cg = new THREE.Group(); cb.build(cg); cg.position.set(-Lh * 0.32, 0, Dh + 0.12); cg.rotation.y = 64 * DEG; extra.push(cg);
    }
    // cable from the right end cap to a plug on the floor
    const rub = L.cableRubber('#151515', 0.55);
    const s0 = V3(Lh / 2 + 0.012, -0.02, -0.03).applyAxisAngle(V3(1, 0, 0), -tilt).add(V3(0, yb, 0));
    const ctrl = [s0, s0.clone().add(V3(0.02, -0.03, -0.02)), V3(s0.x + 0.05, 0.004, s0.z - 0.08), V3(s0.x + 0.13, 0.004, s0.z - 0.05), V3(s0.x + 0.17, 0.004, s0.z + 0.05)];
    const cab = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(60);
    cab.forEach((q, i) => { if (i > 10) q.y = Math.max(0.0035, q.y); });
    bins2.add(rub, L.sweepProfile(cab, L.circleProfile(0.0035, 12)).geo);
    const e = cab[cab.length - 1], dE = e.clone().sub(cab[cab.length - 3]).setY(0).normalize();
    const parts = []; L.rubberPlug((m, g) => parts.push([m, g]), rub, L.e27Mats().nickel);
    const yAx = dE.clone().negate(), zAx = V3(0, 1, 0), xAx = V3().crossVectors(yAx, zAx);
    const M4 = new THREE.Matrix4().makeBasis(xAx, yAx, zAx).setPosition(e.x, 0.0186, e.z);
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins2.add(m, g); }
  } else {
    const hgt = Number(p.height ?? 2.0);
    const cb = new G.PartBin(); L.legClamp(cb, body, cap);
    const cg = new THREE.Group(); cb.build(cg); cg.position.y = hgt - 0.015; extra.push(cg);
    outer.position.set(0, hgt + yb - 0.03, 0.16);
  }
  const g2 = new THREE.Group(); bins2.build(g2); extra.push(g2);
  const group = new THREE.Group(); group.name = `heater elektrisch ${watt} W`;
  group.add(outer, ...extra);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = !/lit/.test(o.material.name || ''); o.receiveShadow = true; } });
  if (on) {
    group.updateMatrixWorld(true);
    const pts = []; for (let i = 0; i <= 10; i++) pts.push(V3(-Lh / 2 + 0.04 + (Lh - 0.08) * (i / 10), 0, zT).applyMatrix4(tiltG.matrixWorld));
    group.add(L.haloTube(pts, 0.075, L.lin('#FF9A40', 1.25), 0.55, { core: 0.3, coreW: 0.7, radial: 20 }));
    if (!mounted) {
      const src = pts.map((q) => ({ p: q.clone().add(V3(0, 0, 0.04)), I: 1, color: L.lin('#FFA050', 1.15) }));
      const fg = L.floorGlow(src, { box: 0.25, res: 140, k: 0.0009, max: 0.3, minH: 0.06 });
      if (fg) group.add(fg);
    }
  }
  return { object: group, detail: { target: mounted ? [0, Number(p.height ?? 2.0), 0.16] : [Lh * 0.25, yb, 0.02], size: 0.22, azimuth: 30, elevation: 12 }, meta: { kind: 'elektrisch', watt } };
}

// ---------------------------------------------------------------------------------------

export function heater(p = {}) {
  const kind = String(p.kind || 'gas').toLowerCase();
  const on = p.on !== false;
  if (kind.startsWith('elek')) {
    const res = electric(p);
    return { ...res, view: { hero: { elevation: 17 } }, rig: { default: { exposure: on ? 1.05 : 'auto', contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } } };
  }
  const style = String(p.style || 'paddenstoel').toLowerCase();
  const bins = new G.PartBin();
  const extra = [];
  let info;
  if (style === 'flame' || style === 'pyramide' || style === 'piramide') info = flameColumn(bins, extra, { H: 2.27, W: 0.5, Hb: 0.66, Wt: 0.26, R: 0.05, on, mat: frameMat(p.color || 'zwart') });
  else if (style === 'lounge') info = flameColumn(bins, extra, { H: 1.15, W: 0.4, Hb: 0.44, Wt: 0.3, R: 0.045, on, mat: frameMat(p.color || 'zwart'), lounge: true });
  else if (style === 'tafel' || style === 'table') info = mushroom(bins, extra, { table: true, on, mat: frameMat(p.color || 'rvs') });
  else info = mushroom(bins, extra, { on, mat: frameMat(p.color || 'rvs') });
  const group = new THREE.Group(); group.name = `heater ${kind} ${style}`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { const nm = o.material.name || ''; o.castShadow = !/clear glass|lit/.test(nm); o.receiveShadow = true; } });
  for (const e of extra) group.add(e);
  const steelish = !/zwart|antraciet|brons/.test(String(p.color || (style === 'flame' || style === 'lounge' ? 'zwart' : 'rvs')));
  return {
    object: group,
    detail: { target: [0, info.detailY, 0], size: style === 'tafel' ? 0.4 : 0.55, azimuth: 30, elevation: 8 },
    view: { hero: { elevation: 15 } },
    // stainless reflects the studio: the dark studio map gives it real contrast (light and dark
    // bands) instead of a flat grey; a dimmer key keeps the white of the reflector off the clip
    rig: { default: { exposure: 1.0, env: steelish ? 'studio' : 'room', envIntensity: steelish ? 1.15 : 0.9, contact: { strength: 0.7, h0: 0.01 }, groundAO: { strength: 0.8 } } },
    meta: { kind, style, on },
  };
}

export function heaterElement(p = {}) {
  const watt = Number(p.watt ?? 1500);
  const L2 = watt > 1800 ? 0.58 : 0.48, R = 0.0075;
  const bins = new G.PartBin();
  const quartz = new THREE.MeshPhysicalMaterial({ color: '#F5F2EA', roughness: 0.08, transmission: 0.7, thickness: 0.002, transparent: true, opacity: 0.6, name: 'quartz' });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#D8B26A', metalness: 1, roughness: 0.18, name: 'gold coating' });
  const ceramic = new THREE.MeshStandardMaterial({ color: '#EDEAE2', roughness: 0.75, name: 'ceramic' });
  const wire = new THREE.MeshStandardMaterial({ color: '#B8BBBE', metalness: 1, roughness: 0.3 });
  const tube = new THREE.CylinderGeometry(R, R, L2, 32, 1, true); tube.rotateZ(Math.PI / 2);
  bins.add(quartz, tube);
  // gold reflector coating on the rear half of the tube
  const half = new THREE.CylinderGeometry(R + 0.0003, R + 0.0003, L2 - 0.01, 32, 1, true, Math.PI, Math.PI); half.rotateZ(Math.PI / 2);
  bins.add(gold, half);
  // coiled filament inside
  const pts = []; for (let i = 0; i <= 600; i++) { const t = i / 600, a = t * TAU * 90; pts.push(V3(-L2 / 2 + 0.02 + t * (L2 - 0.04), Math.cos(a) * R * 0.35, Math.sin(a) * R * 0.35)); }
  bins.add(new THREE.MeshStandardMaterial({ color: '#7A5A3A', metalness: 0.5, roughness: 0.4 }), new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1200, 0.0006, 4));
  for (const sx of [-1, 1]) {
    const cap = new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.028, 24); cap.rotateZ(Math.PI / 2); cap.translate(sx * (L2 / 2 + 0.012), 0, 0);
    bins.add(ceramic, cap);
    const lead = []; for (let i = 0; i <= 20; i++) { const t = i / 20; lead.push(V3(sx * (L2 / 2 + 0.026 + t * 0.05), -t * t * 0.03, 0)); }
    bins.add(wire, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lead), 30, 0.0009, 6));
  }
  const group = new THREE.Group(); group.name = `heaterElement ${watt} W`;
  bins.build(group);
  group.position.y = R + 0.0035;
  const wrap = new THREE.Group(); wrap.add(group);
  wrap.traverse((o) => { if (o.isMesh) { o.castShadow = o.material !== quartz; o.receiveShadow = true; } });
  return { object: wrap, detail: { target: [L2 / 2, 0.01, 0], size: 0.12, azimuth: 30, elevation: 20 }, meta: { watt } };
}
