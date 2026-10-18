// Tent lights.
//
// floodLight { watt, on, clamp }   LED floodlight for an easy-up leg: die-cast housing with
//                     cooling fins, frosted front glass (glowing when on), U-bracket with
//                     tilt knobs, short arm to a pipe clamp for a 40-50 mm leg.
// tentLight { watt, on }           LED light for an inflatable tent: round flat lamp (puck)
//                     with an opal diffuser, a webbing strap with a velcro end to hang it
//                     from the tent's inside loop, cable with an inline switch.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';

const { V3 } = G;

function glow(on, color = '#FFF1D6', intensity = 2.4) {
  return on === false
    ? new THREE.MeshPhysicalMaterial({ color: '#E9E8E4', roughness: 0.35, transmission: 0.2, name: 'diffuser off' })
    : new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.5, name: 'diffuser on' });
}

export function floodLight(p = {}) {
  const watt = Number(p.watt ?? 30);
  const W = watt > 40 ? 0.24 : 0.19, Hh = W * 0.82, D = 0.045;
  const body = F.powder('zwart');
  const bins = new G.PartBin();
  // housing with rounded edges, fins on the back
  bins.add(body, G.roundedBox(W, Hh, D, 0.008, 3));
  for (let i = -5; i <= 5; i++) bins.add(body, G.roundedBox(0.003, Hh - 0.03, 0.02, 0.001, 1).translate(i * (W - 0.03) / 10, 0, -D / 2 - 0.009));
  // front bezel + frosted glass
  bins.add(body, G.roundedBox(W - 0.006, Hh - 0.006, 0.004, 0.006, 2).translate(0, 0, D / 2 + 0.001));
  bins.add(glow(p.on, '#FFF4E0', 2.6), G.roundedBox(W - 0.028, Hh - 0.028, 0.003, 0.004, 2).translate(0, 0, D / 2 + 0.003));
  // U-bracket with tilt knobs
  const yb = -Hh / 2 - 0.035;
  for (const sx of [-1, 1]) {
    bins.add(body, G.roundedBox(0.006, 0.06, 0.03, 0.002, 1).translate(sx * (W / 2 + 0.006), -Hh / 2 - 0.005, 0));
    const knob = new THREE.CylinderGeometry(0.012, 0.012, 0.012, 20); knob.rotateZ(Math.PI / 2); knob.translate(sx * (W / 2 + 0.016), 0, 0);
    bins.add(F.plastic('#111', 0.6), knob);
  }
  bins.add(body, G.roundedBox(W + 0.018, 0.006, 0.03, 0.002, 1).translate(0, yb, 0));
  // cable gland and a short cable
  const pts = [V3(W / 2 - 0.02, -Hh / 2, -0.01), V3(W / 2, -Hh / 2 - 0.06, -0.03), V3(W / 2 + 0.06, -Hh / 2 - 0.12, -0.02), V3(W / 2 + 0.14, -Hh / 2 - 0.14, 0.02)];
  bins.add(M.rubber('#111111'), new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0035, 8));
  if (p.clamp !== false) {
    const arm0 = V3(0, yb, 0), arm1 = V3(0, yb, -0.11);
    bins.add(body, G.tube(arm0, arm1, 0.01, 16));
    const rr = 0.026, cz = -0.11 - rr;
    const ring = new THREE.TorusGeometry(rr, 0.006, 10, 40); ring.rotateX(Math.PI / 2); ring.translate(0, yb, cz);
    bins.add(body, ring);
    bins.add(body, G.roundedBox(0.03, 0.03, 0.02, 0.004, 2).translate(0, yb, cz - rr - 0.012));
    const knob = new THREE.CylinderGeometry(0.014, 0.014, 0.02, 24); knob.rotateX(Math.PI / 2); knob.translate(0, yb, cz - rr - 0.032);
    bins.add(F.plastic('#121212', 0.6), knob);
  }
  const inner = new THREE.Group(); inner.name = `floodLight ${watt} W`;
  bins.build(inner);
  inner.rotation.x = 0.35;           // tilted down a little, as it is aimed into the tent
  const group = new THREE.Group(); group.add(inner); group.position.y = 0.3;
  const outer = new THREE.Group(); outer.add(group);
  outer.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { object: outer, detail: { target: [0, 0.3, 0.02], size: 0.3, azimuth: 30, elevation: 10 }, meta: { watt } };
}

export function tentLight(p = {}) {
  const watt = Number(p.watt ?? 12);
  const R = 0.085, T = 0.032;
  const housing = new THREE.MeshPhysicalMaterial({ color: '#F1F0EC', roughness: 0.38, clearcoat: 0.3, name: 'housing' });
  const bins = new G.PartBin();
  // puck: rounded disc lying on its back, diffuser facing the camera side (up)
  bins.add(housing, G.lathe([[0.0001, 0], [R - 0.01, 0], [R, 0.008], [R, T - 0.008], [R - 0.008, T], [0.0001, T]].reverse(), 72));
  bins.add(glow(p.on, '#FFF3DE', 2.2), G.lathe([[0.0001, T + 0.002], [R - 0.016, T + 0.0015], [R - 0.012, T - 0.0005], [0.0001, T - 0.0005]], 72));
  // webbing strap over the back with a velcro end
  const web = F.beltWebbing('zwart');
  const strap = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; strap.push(V3(-R * 0.2 + t * 0.32, 0.003 + 0.004 * Math.sin(t * Math.PI), -R - 0.01 - t * 0.02)); }
  const sg = G.surface((u, v, o) => { const i = Math.round(u * 40); o.copy(strap[i]).setY(strap[i].y + 0.0012 * (v - 0.5)); o.z += (v - 0.5) * 0.025; }, 40, 2);
  bins.add(web, sg);
  // cable with an inline switch
  const pts = [V3(R * 0.7, 0.012, R * 0.6), V3(R + 0.06, 0.006, R + 0.04), V3(R + 0.16, 0.006, R + 0.02), V3(R + 0.26, 0.006, R + 0.08), V3(R + 0.36, 0.006, R + 0.06)];
  const cable = new THREE.CatmullRomCurve3(pts);
  bins.add(M.rubber('#202020'), new THREE.TubeGeometry(cable, 80, 0.0028, 8));
  const sw = cable.getPoint(0.55);
  bins.add(F.plastic('#1A1A1A', 0.5), G.roundedBox(0.05, 0.018, 0.024, 0.006, 3).translate(sw.x, 0.009, sw.z));
  const group = new THREE.Group(); group.name = `tentLight ${watt} W`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { object: group, detail: { target: [0, 0.02, 0], size: 0.25, azimuth: 30, elevation: 30 }, view: { hero: { azimuth: 30, elevation: 32 } }, meta: { watt } };
}
