// Terrace and tent heaters, plus the loose infrared element.
//
// heater { kind: 'gas' | 'elektrisch', style, watt, on, clamp }
//   gas 'paddenstoel'  patio heater ("mushroom"), 2.25 m: round base with weighted foot ring,
//                      cylindrical bottle housing with door seam and control knob, pole,
//                      perforated emitter cylinder under a large dished reflector hat.
//   gas 'flame'        pyramid flame heater, 2.25 m: square foot housing, glass tube with a
//                      visible flame, four corner posts, square top reflector.
//   gas 'lounge'       low lounge heater (ca. 75 cm): bottle housing as the foot, short wide glass tube.
//   gas 'tafel'        table-top patio heater (0.9 m).
//   elektrisch         infrared heater for a party tent: extruded aluminium housing with
//                      cooling fins, polished reflector and a quartz tube element (glowing
//                      when on), wall bracket with a tilt joint and a pipe clamp for a
//                      tent leg (clamp: true, the default).
// heaterElement { watt }   the replacement quartz tube on its own: gold-coated rear half,
//                      ceramic end caps with leads.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';

const { V3 } = G;
const TAU = Math.PI * 2;

function glowMat(color = '#FF7A2A', intensity = 3) {
  return new THREE.MeshStandardMaterial({ color: '#2A1A12', emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.6, name: 'glow' });
}
function glassMat() {
  return new THREE.MeshPhysicalMaterial({ color: '#F4F7F8', roughness: 0.05, metalness: 0, transmission: 0.92, thickness: 0.004, ior: 1.47, transparent: true, opacity: 0.35, name: 'glass' });
}

function patio(bins, H, { table = false } = {}) {
  const steel = F.stainless({ roughness: 0.3 });
  const dark = F.powder('zwart');
  const rubber = F.plastic('#151515', 0.7);
  const s = H / 2.25;
  // base: dished round foot with a rubber ring
  const Rb = (table ? 0.2 : 0.3);
  bins.add(steel, G.lathe([[0.0001, 0.012], [Rb, 0.012], [Rb, 0.03], [Rb * 0.92, 0.05], [0.12, 0.07], [0.0001, 0.07]].reverse(), 72));
  bins.add(rubber, G.lathe([[Rb - 0.01, 0], [Rb + 0.004, 0], [Rb + 0.004, 0.014], [Rb - 0.01, 0.014]].reverse(), 72));
  let y = 0.07;
  if (!table) {
    // bottle housing
    const Rh = 0.21, Hh = 0.78;
    bins.add(steel, G.lathe([[0.0001, y], [Rh - 0.01, y], [Rh, y + 0.012], [Rh, y + Hh - 0.03], [Rh - 0.03, y + Hh], [0.04, y + Hh + 0.02], [0.0001, y + Hh + 0.02]].reverse(), 72));
    // door seam and knob, towards the hero camera
    const az = 34 * Math.PI / 180, n = V3(Math.sin(az), 0, Math.cos(az));
    for (const da of [-0.5, 0.5]) {
      const a = az + da, p0 = V3(Math.sin(a) * (Rh + 0.0008), y + 0.1, Math.cos(a) * (Rh + 0.0008));
      bins.add(dark, G.tube(p0, p0.clone().setY(y + Hh - 0.1), 0.0012, 6));
    }
    const kp = n.clone().multiplyScalar(Rh + 0.004).setY(y + Hh - 0.07);
    const knob = G.lathe([[0.0001, 0], [0.022, 0], [0.022, 0.018], [0.018, 0.024], [0.0001, 0.024]], 32);
    knob.rotateX(Math.PI / 2); knob.rotateY(az); knob.translate(kp.x, kp.y, kp.z);
    bins.add(dark, knob);
    y += Hh + 0.02;
  }
  // pole
  const yE = H - 0.36 * s;
  bins.add(steel, G.tube(V3(0, y, 0), V3(0, yE, 0), table ? 0.025 : 0.038, 32));
  // emitter: perforated cylinder (dark mesh look) between two rings
  const Re = table ? 0.07 : 0.1, He = table ? 0.16 : 0.24;
  bins.add(dark, G.lathe([[0.0001, yE], [Re + 0.01, yE], [Re + 0.01, yE + 0.02], [0.0001, yE + 0.02]].reverse(), 48));
  const mesh = new THREE.MeshStandardMaterial({ color: '#2B2D30', metalness: 0.6, roughness: 0.55, name: 'emitter mesh' });
  bins.add(mesh, new THREE.CylinderGeometry(Re, Re, He, 48, 1, true).translate(0, yE + 0.02 + He / 2, 0));
  bins.add(dark, G.lathe([[0.0001, yE + 0.02 + He], [Re + 0.01, yE + 0.02 + He], [Re + 0.01, yE + 0.04 + He], [0.0001, yE + 0.04 + He]].reverse(), 48));
  // reflector hat: dished cone with a rolled rim
  const Rr = table ? 0.3 : 0.41, yR = yE + 0.06 + He;
  bins.add(steel, G.lathe([[0.0001, yR + 0.11], [0.06, yR + 0.105], [Rr * 0.6, yR + 0.06], [Rr, yR], [Rr + 0.006, yR - 0.006], [Rr - 0.004, yR - 0.004],
    [Rr * 0.6, yR + 0.052], [0.06, yR + 0.097], [0.0001, yR + 0.1]], 96));
  // three stays from the hat to the emitter top
  for (let k = 0; k < 3; k++) {
    const a = k * TAU / 3 + 0.3;
    bins.add(steel, G.tube(V3(Math.sin(a) * (Re + 0.005), yE + 0.04 + He, Math.cos(a) * (Re + 0.005)), V3(Math.sin(a) * Rr * 0.55, yR + 0.055, Math.cos(a) * Rr * 0.55), 0.004, 8));
  }
  return { top: yR + 0.11, R: Rr };
}

function flame(bins, H, on) {
  const dark = F.powder('zwart');
  const low = H < 1;
  const Wb = low ? 0.5 : H > 1.6 ? 0.48 : 0.44, Hb = low ? 0.46 : H > 1.6 ? 0.42 : 0.3;
  // foot housing with a vented front and a knob
  bins.add(dark, G.roundedBox(Wb, Hb, Wb, 0.01, 3).translate(0, Hb / 2 + 0.01, 0));
  bins.add(F.plastic('#111', 0.7), G.roundedBox(Wb + 0.01, 0.012, Wb + 0.01, 0.004, 2).translate(0, 0.006, 0));
  const vent = new THREE.MeshStandardMaterial({ color: '#0E0F10', roughness: 0.8, name: 'vent' });
  for (let i = 0; i < 5; i++) bins.add(vent, G.roundedBox(Wb * 0.6, 0.008, 0.004, 0.002, 1).translate(0, Hb * 0.35 + i * 0.03, Wb / 2 + 0.001));
  // top cap with a small square reflector
  const Wt = Wb + 0.02, yT = H - 0.1;
  bins.add(dark, G.roundedBox(Wt, 0.05, Wt, 0.008, 3).translate(0, yT, 0));
  bins.add(dark, G.lathe([[0.0001, yT + 0.1], [0.12, yT + 0.08], [0.2, yT + 0.03], [0.0001, yT + 0.03]], 4, Math.PI / 4).translate(0, 0, 0));
  // four corner posts
  const c = Wb / 2 - 0.03;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bins.add(dark, G.tube(V3(sx * c, Hb + 0.01, sz * c), V3(sx * c, yT - 0.025, sz * c), 0.012, 12));
  // glass tube with a guard ring halfway
  const Rg = low ? 0.11 : H > 1.6 ? 0.06 : 0.08, y0 = Hb + 0.01, y1 = yT - 0.025;
  bins.add(glassMat(), new THREE.CylinderGeometry(Rg, Rg, y1 - y0, 48, 1, true).translate(0, (y0 + y1) / 2, 0));
  for (const yy of [y0 + (y1 - y0) * 0.5]) bins.add(dark, F.ring(Rg + 0.008, yy, 0.004));
  if (on !== false) {
    // flame: a twisting ribbon inside the tube, brightest at the bottom
    const pts = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * TAU * 2.2; pts.push(V3(Math.cos(a) * Rg * 0.35 * (1 - 0.4 * t), y0 + 0.04 + t * (y1 - y0) * 0.86, Math.sin(a) * Rg * 0.35 * (1 - 0.4 * t))); }
    bins.add(glowMat('#FF8A2E', 4.5), new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, Rg * 0.18, 10));
  }
  return { top: yT + 0.1, R: Wb / 2 };
}

function electric(bins, p) {
  const watt = Number(p.watt ?? 1500);
  const L = watt > 1800 ? 0.72 : 0.6, D = 0.1, Hh = 0.085;
  const alu = M.aluminium({ roughness: 0.32 });
  const dark = F.powder('zwart');
  const g = new G.PartBin();
  // housing (extruded profile): rounded box with fins on the back
  const housing = G.roundedBox(L, Hh, D, 0.012, 3);
  g.add(alu, housing);
  for (let i = -3; i <= 3; i++) g.add(alu, G.roundedBox(L - 0.06, 0.004, 0.018, 0.0015, 1).translate(0, i * 0.011, -D / 2 - 0.008));
  // end caps
  for (const sx of [-1, 1]) g.add(dark, G.roundedBox(0.018, Hh + 0.01, D + 0.008, 0.006, 2).translate(sx * (L / 2 + 0.008), 0, 0));
  // reflector (polished) and element on the front face
  const refl = new THREE.MeshPhysicalMaterial({ color: '#E8E4DA', metalness: 1, roughness: 0.12, name: 'reflector' });
  g.add(refl, G.roundedBox(L - 0.04, Hh - 0.022, 0.004, 0.003, 1).translate(0, 0, D / 2 + 0.0005));
  const tube = new THREE.CylinderGeometry(0.0075, 0.0075, L - 0.07, 24); tube.rotateZ(Math.PI / 2); tube.translate(0, 0, D / 2 + 0.014);
  g.add(p.on === false ? new THREE.MeshPhysicalMaterial({ color: '#C9A15C', metalness: 0.8, roughness: 0.25 }) : glowMat('#FF5A1E', 3.2), tube);
  // guard wires
  for (const yy of [-0.022, 0, 0.022]) { const w = new THREE.CylinderGeometry(0.0012, 0.0012, L - 0.05, 8); w.rotateZ(Math.PI / 2); w.translate(0, yy, D / 2 + 0.026); g.add(dark, w); }
  for (const xx of [-L / 2 + 0.05, 0, L / 2 - 0.05]) for (const yy of [-0.03, 0.03]) g.add(dark, G.tube(V3(xx, yy, D / 2 + 0.002), V3(xx, yy, D / 2 + 0.026), 0.0012, 6));
  // bracket: U-yoke at the back with tilt knobs, arm to a pipe clamp
  g.add(dark, G.roundedBox(0.05, 0.012, 0.11, 0.003, 2).translate(0, Hh / 2 + 0.006, -0.02));
  const arm0 = V3(0, Hh / 2 + 0.012, -0.06), arm1 = V3(0, Hh / 2 + 0.012, -0.2);
  g.add(dark, G.tube(arm0, arm1, 0.012, 16));
  if (p.clamp !== false) {
    // two-part pipe clamp round a 40 mm leg stub
    const cz = -0.24, rr = 0.026;
    const clamp = new THREE.TorusGeometry(rr, 0.006, 10, 40); clamp.rotateX(Math.PI / 2); clamp.translate(0, Hh / 2 + 0.012, cz);
    g.add(dark, clamp);
    g.add(dark, G.roundedBox(0.03, 0.03, 0.02, 0.004, 2).translate(0, Hh / 2 + 0.012, cz - rr - 0.012));
    const knob = new THREE.CylinderGeometry(0.014, 0.014, 0.02, 24); knob.rotateX(Math.PI / 2); knob.translate(0, Hh / 2 + 0.012, cz - rr - 0.032);
    g.add(F.plastic('#121212', 0.6), knob);
    if (p.legStub) {
      const leg = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6); leg.translate(0, Hh / 2 + 0.012, cz);
      g.add(M.aluminium({ roughness: 0.3 }), leg);
    }
  }
  const group = new THREE.Group(); group.name = `heater elektrisch ${watt} W`;
  g.build(group);
  // tilt the heater 25 degrees down, as it hangs in a tent; lift it to a sensible height
  group.rotation.x = 0.0;
  const outer = new THREE.Group(); outer.add(group);
  group.rotation.x = 0.42;
  outer.position.y = 0.32;
  return outer;
}

export function heater(p = {}) {
  const kind = String(p.kind || 'gas').toLowerCase();
  const style = String(p.style || (kind === 'gas' ? 'paddenstoel' : 'paneel')).toLowerCase();
  if (kind.startsWith('elek')) {
    const obj = electric(null, p);
    const wrap = new THREE.Group(); wrap.name = 'heater elektrisch'; wrap.add(obj);
    wrap.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { object: wrap, detail: { target: [0, 0.32, 0.03], size: 0.4, azimuth: 30, elevation: 10 }, meta: { kind, watt: p.watt ?? 1500 } };
  }
  const bins = new G.PartBin();
  let info;
  if (style === 'flame') info = flame(bins, 2.25, p.on);
  else if (style === 'lounge') info = flame(bins, 0.78, p.on);
  else if (style === 'tafel') info = patio(bins, 0.9, { table: true });
  else info = patio(bins, 2.25);
  const group = new THREE.Group(); group.name = `heater ${kind} ${style}`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = o.material?.name !== 'glass'; o.receiveShadow = true; } });
  return { object: group, detail: { target: [0, info.top - 0.3, 0], size: 0.9, azimuth: 30, elevation: 8 }, meta: { kind, style } };
}

export function heaterElement(p = {}) {
  const watt = Number(p.watt ?? 1500);
  const L = watt > 1800 ? 0.58 : 0.48, R = 0.0075;
  const bins = new G.PartBin();
  const quartz = new THREE.MeshPhysicalMaterial({ color: '#F5F2EA', roughness: 0.08, transmission: 0.7, thickness: 0.002, transparent: true, opacity: 0.6, name: 'quartz' });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#D8B26A', metalness: 1, roughness: 0.18, name: 'gold coating' });
  const ceramic = new THREE.MeshStandardMaterial({ color: '#EDEAE2', roughness: 0.75, name: 'ceramic' });
  const wire = new THREE.MeshStandardMaterial({ color: '#B8BBBE', metalness: 1, roughness: 0.3 });
  const tube = new THREE.CylinderGeometry(R, R, L, 32, 1, true); tube.rotateZ(Math.PI / 2);
  bins.add(quartz, tube);
  // gold reflector coating on the rear half of the tube
  const half = new THREE.CylinderGeometry(R + 0.0003, R + 0.0003, L - 0.01, 32, 1, true, Math.PI, Math.PI); half.rotateZ(Math.PI / 2);
  bins.add(gold, half);
  // coiled filament inside
  const pts = []; for (let i = 0; i <= 600; i++) { const t = i / 600, a = t * TAU * 90; pts.push(V3(-L / 2 + 0.02 + t * (L - 0.04), Math.cos(a) * R * 0.35, Math.sin(a) * R * 0.35)); }
  bins.add(new THREE.MeshStandardMaterial({ color: '#7A5A3A', metalness: 0.5, roughness: 0.4 }), new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1200, 0.0006, 4));
  for (const sx of [-1, 1]) {
    const cap = new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.028, 24); cap.rotateZ(Math.PI / 2); cap.translate(sx * (L / 2 + 0.012), 0, 0);
    bins.add(ceramic, cap);
    const lead = []; for (let i = 0; i <= 20; i++) { const t = i / 20; lead.push(V3(sx * (L / 2 + 0.026 + t * 0.05), -t * t * 0.03, 0)); }
    bins.add(wire, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lead), 30, 0.0009, 6));
  }
  const group = new THREE.Group(); group.name = `heaterElement ${watt} W`;
  bins.build(group);
  group.position.y = R + 0.0035;
  const wrap = new THREE.Group(); wrap.add(group);
  wrap.traverse((o) => { if (o.isMesh) { o.castShadow = o.material !== quartz; o.receiveShadow = true; } });
  return { object: wrap, detail: { target: [L / 2, 0.01, 0], size: 0.12, azimuth: 30, elevation: 20 }, meta: { watt } };
}
