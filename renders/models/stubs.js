// Additional catalogue products. Simpler than the tent/statafel builders but
// built to the same rules (metres, Y up, front +Z, physically based materials),
// so they can already be rendered for the shop and refined later.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as TX from '../js/textures.js';
import { rng } from '../js/rng.js';
import { weightPlate } from './easyUpTent.js';

const { V3, lerp, clamp, smoothstep } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function wrap(group, detail, meta, view) { return { object: group, detail, meta, view }; }

// ---------------------------------------------------------------------------------
// Klaptafel: folding HDPE table (183x76 default) with folding steel legs.
export function klaptafel(p = {}) {
  const L = Number(p.length ?? 1.83), W = Number(p.width ?? 0.76), H = Number(p.height ?? 0.74);
  const top = M.hdpe(p.color === 'grijs' ? '#A4A6A8' : p.color === 'zwart' ? '#262729' : '#F0F0EC');
  const steel = M.steelPowder(p.frame === 'zwart' ? '#1C1D1F' : '#8E9296', { roughness: 0.38 });
  const rub = M.rubber();
  const bins = new G.PartBin();
  const T = 0.045;
  const slab = G.prism(G.roundedRectProfile(L, W, 0.035, 6), V3(0, H - T, 0), V3(0, H, 0), { side: V3(1, 0, 0) });
  bins.add(top, slab);
  // apron rim under the top
  bins.add(steel, G.prism(G.roundedRectProfile(L - 0.08, W - 0.08, 0.02, 3), V3(0, H - T - 0.03, 0), V3(0, H - T, 0), { side: V3(1, 0, 0), caps: false }));
  for (const s of [-1, 1]) {
    const x = s * (L / 2 - 0.16);
    const legTop = H - T - 0.02;
    // U leg frame: two uprights + foot bar
    for (const z of [-W / 2 + 0.07, W / 2 - 0.07]) bins.add(steel, G.tube(V3(x, 0.03, z), V3(x, legTop, z), 0.0127, 16));
    bins.add(steel, G.tube(V3(x, 0.03, -W / 2 + 0.07), V3(x, 0.03, W / 2 - 0.07), 0.0127, 16));
    bins.add(steel, G.tube(V3(x, legTop - 0.01, -W / 2 + 0.07), V3(x, legTop - 0.01, W / 2 - 0.07), 0.011, 12));
    // folding brace to the centre rail
    bins.add(steel, G.tube(V3(x, 0.32, 0), V3(s * 0.22, legTop - 0.005, 0), 0.0095, 12));
    bins.add(steel, G.tube(V3(x, 0.32, -W / 2 + 0.07), V3(x, 0.32, W / 2 - 0.07), 0.0095, 12));
    for (const z of [-W / 2 + 0.07, W / 2 - 0.07]) bins.add(rub, G.tube(V3(x, 0.0, z), V3(x, 0.03, z), 0.016, 16));
  }
  bins.add(steel, G.tube(V3(-0.25, H - T - 0.015, 0), V3(0.25, H - T - 0.015, 0), 0.012, 12));
  const g = new THREE.Group(); g.name = 'klaptafel'; bins.build(g);
  return wrap(g, { target: [L / 2 - 0.1, H - 0.05, W / 2], size: 0.5, azimuth: 35, elevation: 14 }, { L, W, H });
}

// ---------------------------------------------------------------------------------
// Biertafelset: table (220 x 50/70) + 2 benches (220 x 25), spruce boards, folding legs.
export function biertafelset(p = {}) {
  const L = Number(p.length ?? 2.2), TW = Number(p.tableWidth ?? 0.5);
  const legColor = p.frame || 'galv';
  const wood = M.birchFace();
  const edge = M.birchEdge();
  const steel = legColor === 'galv' ? M.galvanised() : M.steelPowder(legColor);
  const g = new THREE.Group(); g.name = 'biertafelset';
  const piece = (w, h, z0) => {
    const bins = new G.PartBin();
    const T = 0.025;
    const boards = Math.max(2, Math.round(w / 0.125));
    const bw = w / boards;
    for (let i = 0; i < boards; i++) {
      const z = z0 - w / 2 + bw * (i + 0.5);
      const b = G.roundedBox(L, T, bw - 0.004, 0.003);
      // planar uv in metres for the wood grain
      const pos = b.attributes.position, uv = b.attributes.uv;
      for (let k = 0; k < pos.count; k++) uv.setXY(k, pos.getX(k) * 0.45 + i * 0.37, pos.getZ(k) * 2 + 0.5);
      b.translate(0, h - T / 2, z);
      bins.add(wood, b);
    }
    // cross battens + frame under the top
    for (const x of [-L / 2 + 0.12, L / 2 - 0.12]) {
      const bt = G.roundedBox(0.05, 0.03, w - 0.02, 0.004); bt.translate(x, h - 0.04, z0); bins.add(edge, bt);
      // folding trestle: two splayed tubes + foot bar
      const footW = w * 0.9;
      for (const s of [-1, 1]) bins.add(steel, G.tube(V3(x, h - 0.055, z0 + s * (w / 2 - 0.05)), V3(x + Math.sign(x) * 0.0, 0.02, z0 + s * (footW / 2)), 0.011, 12));
      bins.add(steel, G.tube(V3(x, 0.02, z0 - footW / 2 - 0.01), V3(x, 0.02, z0 + footW / 2 + 0.01), 0.013, 12));
      bins.add(steel, G.tube(V3(x, h * 0.45, z0), V3(Math.sign(x) * (L / 2 - 0.55), h - 0.055, z0), 0.008, 10));
    }
    bins.add(steel, G.tube(V3(-L / 2 + 0.55, h - 0.055, z0), V3(L / 2 - 0.55, h - 0.055, z0), 0.009, 10));
    bins.build(g);
  };
  piece(TW, 0.76, 0);
  piece(0.25, 0.47, TW / 2 + 0.38);
  piece(0.25, 0.47, -(TW / 2 + 0.38));
  return wrap(g, { target: [L / 2 - 0.15, 0.7, TW / 2], size: 0.6, azimuth: 35, elevation: 18 }, { L, TW });
}

// ---------------------------------------------------------------------------------
// Tentgewichten: the same stackable plates the easy-up tents show on their feet
// (radial slot to slide round the leg, bore for the foot socket, grip hole).
export function gewichten(p = {}) {
  const n = Number(p.count ?? 4), stacks = Number(p.stacks ?? 1);
  const iron = M.castIron(p.color === 'rood' ? '#8E1A1D' : '#2A2B2D');
  const bins = new G.PartBin();
  const h = 0.034;
  for (let sIdx = 0; sIdx < stacks; sIdx++) {
    for (let k = 0; k < n; k++) {
      const geo = weightPlate({ R: 0.125, h, slotHalf: 0.025, bore: 0.031 });
      geo.rotateY(-0.5 + sIdx * 0.9); // slot turned towards the camera
      geo.translate(sIdx * 0.3 - (stacks - 1) * 0.15, k * (h + 0.0025), 0);
      bins.add(iron, geo);
    }
  }
  const g = new THREE.Group(); g.name = 'gewichten'; bins.build(g);
  return wrap(g, { target: [0, n * h * 0.6, 0.1], size: 0.35, azimuth: 30, elevation: 25 }, { n });
}

// ---------------------------------------------------------------------------------
// Haringen: galvanised steel pegs with hook, laid out in a fan.
export function haringen(p = {}) {
  const n = Number(p.count ?? 6), len = Number(p.length ?? 0.3);
  const galv = M.galvanised();
  const cap = M.nylon('#C7372E');
  const bins = new G.PartBin();
  for (let i = 0; i < n; i++) {
    const a = (-30 + (60 * i) / Math.max(1, n - 1)) * DEG;
    const dir = V3(Math.sin(a), 0, -Math.cos(a));
    const base = V3((i - (n - 1) / 2) * 0.012, 0.005, 0.12);
    const tip = base.clone().addScaledVector(dir, len);
    // shaft resting on the floor (slightly lifted by the hook)
    const s0 = base.clone().setY(0.006), s1 = tip.clone().setY(0.005);
    bins.add(galv, G.tube(s0, s1.clone().addScaledVector(dir, -0.03), 0.004, 10));
    bins.add(galv, G.prism(G.circleProfile(0.004, 10).map((q) => q), s1.clone().addScaledVector(dir, -0.03), s1, {}));
    // hook
    const hook = G.surface((u, v, o) => {
      const t = u * Math.PI * 1.15;
      const c = base.clone().addScaledVector(dir, -0.018 + 0.018 * Math.cos(t)).setY(0.006 + 0.018 * Math.sin(t));
      const side = V3(dir.z, 0, -dir.x);
      const ang = v * TAU;
      o.copy(c).addScaledVector(side, Math.cos(ang) * 0.004).setY(c.y + Math.sin(ang) * 0.004);
    }, 20, 8);
    bins.add(galv, hook);
    bins.add(cap, G.tube(s0.clone().addScaledVector(dir, 0.01), s0.clone().addScaledVector(dir, 0.045), 0.0065, 12));
  }
  const g = new THREE.Group(); g.name = 'haringen'; bins.build(g);
  return wrap(g, { target: [0, 0.01, 0], size: 0.25, azimuth: 20, elevation: 40 }, { n }, { hero: { elevation: 38 } });
}

// ---------------------------------------------------------------------------------
// Spanbanden: coiled polyester strap with ratchet buckle.
export function spanbanden(p = {}) {
  const color = M.resolveColor(p.color || 'oranje');
  const strap = M.polyCloth(color, { satin: 0.2 });
  const steel = M.galvanised();
  const red = M.nylon('#B3221B');
  const bins = new G.PartBin();
  const w = 0.025, turns = 9, r0 = 0.03, pitch = 0.0022;
  const coil = G.surface((u, v, o) => {
    const t = u * turns * TAU;
    const r = r0 + (pitch * t) / TAU;
    o.set(Math.cos(t) * r, (v - 0.5) * w + w / 2 + 0.002, Math.sin(t) * r);
  }, turns * 48, 2);
  coil.rotateX(Math.PI / 2); coil.translate(0, 0.06, 0);
  bins.add(strap, coil);
  // loose tail to the ratchet
  const rOut = r0 + pitch * turns;
  const tail = G.surface((u, v, o) => {
    o.set(rOut + u * 0.18, 0.06 - rOut * 0 - u * 0.055 + Math.sin(u * Math.PI) * 0.01, (v - 0.5) * w);
  }, 20, 2);
  tail.translate(0, -0.0, 0); bins.add(strap, tail);
  // ratchet body
  const rb = G.roundedBox(0.11, 0.035, 0.05, 0.004); rb.translate(rOut + 0.24, 0.02, 0); bins.add(steel, rb);
  const hdl = G.roundedBox(0.09, 0.012, 0.04, 0.004); hdl.translate(rOut + 0.25, 0.043, 0); bins.add(red, hdl);
  bins.add(steel, G.tube(V3(rOut + 0.2, 0.02, -0.03), V3(rOut + 0.2, 0.02, 0.03), 0.012, 16));
  const g = new THREE.Group(); g.name = 'spanband'; bins.build(g);
  return wrap(g, { target: [rOut + 0.2, 0.03, 0], size: 0.2, azimuth: 25, elevation: 30 }, {});
}

// ---------------------------------------------------------------------------------
// Wielset: pair of wheels on a bracket that clamps to the folded tent frame.
export function wielset(p = {}) {
  const tyre = M.rubber('#141414');
  const hub = M.nylon('#2C2D2F');
  const steel = M.galvanised();
  const bins = new G.PartBin();
  const R = 0.1, Wd = 0.045;
  for (const s of [-1, 1]) {
    const x = s * 0.2;
    const t = new THREE.TorusGeometry(R - 0.022, 0.024, 16, 48); t.rotateY(Math.PI / 2); t.translate(x, R, 0); bins.add(tyre, t);
    const hb = G.tube(V3(x - Wd / 2, R, 0), V3(x + Wd / 2, R, 0), R - 0.035, 32); bins.add(hub, hb);
    bins.add(steel, G.tube(V3(x - 0.03, R, 0), V3(x + 0.03, R, 0), 0.012, 16));
  }
  bins.add(steel, G.tube(V3(-0.22, R, 0), V3(0.22, R, 0), 0.009, 12));
  bins.add(steel, G.flatBar(V3(-0.17, R, 0), V3(-0.17, R + 0.22, -0.05), 0.04, 0.005, V3(1, 0, 0)));
  bins.add(steel, G.flatBar(V3(0.17, R, 0), V3(0.17, R + 0.22, -0.05), 0.04, 0.005, V3(1, 0, 0)));
  bins.add(steel, G.flatBar(V3(-0.19, R + 0.22, -0.05), V3(0.19, R + 0.22, -0.05), 0.05, 0.005, V3(0, 0, 1)));
  const g = new THREE.Group(); g.name = 'wielset'; bins.build(g);
  return wrap(g, { target: [0.2, R, 0.05], size: 0.3, azimuth: 40, elevation: 15 }, {});
}

// ---------------------------------------------------------------------------------
// Draagtas: wheeled carry bag for a folded easy-up.
export function draagtas(p = {}) {
  const Hh = Number(p.height ?? 1.55), Wd = 0.34, D = 0.3;
  const fab = M.tentFabric(p.color || 'zwart', { translucent: false });
  const tyre = M.rubber('#121212');
  const nylon = M.nylon('#1A1A1A');
  const bins = new G.PartBin();
  const g = new THREE.Group(); g.name = 'draagtas';
  // soft bag body: rounded box with slightly bulging faces
  const body = G.surface((u, v, o) => {
    const a = u * TAU;
    const sx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.25);
    const sz = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.25);
    const y = 0.07 + v * (Hh - 0.07);
    const bulge = 1 + 0.04 * Math.sin(Math.PI * v);
    const pinch = 1 - 0.1 * smoothstep(0.96, 1, v);
    o.set(sx * Wd / 2 * bulge * pinch, y, sz * D / 2 * bulge * pinch);
  }, 96, 60, { closedU: true });
  bins.add(fab, body);
  const lid = G.prism(G.roundedRectProfile(Wd * 0.9, D * 0.9, 0.06, 6), V3(0, Hh - 0.002, 0), V3(0, Hh + 0.012, 0), { side: V3(1, 0, 0) });
  bins.add(fab, lid);
  // zipper around the top + handle + wheels + base
  bins.add(nylon, G.prism(G.roundedRectProfile(Wd * 0.94, D * 0.94, 0.07, 6), V3(0, Hh - 0.06, 0), V3(0, Hh - 0.05, 0), { side: V3(1, 0, 0), caps: false }));
  const handle = G.surface((u, v, o) => { const t = u * Math.PI; o.set(-0.09 * Math.cos(t), Hh + 0.012 + 0.05 * Math.sin(t), (v - 0.5) * 0.04); }, 16, 2);
  bins.add(nylon, handle);
  const base = G.roundedBox(Wd + 0.01, 0.07, D + 0.01, 0.015); base.translate(0, 0.035, 0); bins.add(nylon, base);
  for (const s of [-1, 1]) {
    const t = new THREE.TorusGeometry(0.045, 0.016, 12, 32); t.rotateY(Math.PI / 2); t.translate(s * (Wd / 2 - 0.02), 0.06, -D / 2 + 0.02); bins.add(tyre, t);
  }
  bins.build(g);
  if (p.logo) {
    const tex = TX.printTexture({ text: p.logo, color: '#FFFFFF', width: 1024, height: 256, font: '800 150px "Arial Black", Arial, sans-serif' });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Wd * 0.8, Wd * 0.2), new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.4, roughness: 0.5 }));
    m.position.set(0, Hh * 0.72, D / 2 * 1.04 + 0.002); g.add(m);
  }
  return wrap(g, { target: [0, Hh - 0.1, D / 2], size: 0.4, azimuth: 30, elevation: 15 }, {});
}

// ---------------------------------------------------------------------------------
// Prikkabel / festoon lights: cable in a gentle catenary with globe bulbs.
export function prikkabel(p = {}) {
  const n = Number(p.bulbs ?? 6), spacing = Number(p.spacing ?? 0.34);
  const span = (n - 1) * spacing;
  const sag = Number(p.sag ?? 0.25) * span / 4.5;
  const cable = M.rubber('#111111');
  const socket = M.rubber('#161616');
  const glass = new THREE.MeshPhysicalMaterial({ color: '#FFF4DC', roughness: 0.15, transmission: 0, emissive: new THREE.Color('#FFB866'), emissiveIntensity: p.on === false ? 0 : 2.2, specularIntensity: 0.8 });
  const filament = new THREE.MeshBasicMaterial({ color: '#FFE2A8' });
  const bins = new G.PartBin();
  const yTop = 1.2 + sag;
  const curve = (x) => yTop - sag * (1 - Math.pow((2 * x) / span, 2));
  const pts = [];
  for (let i = 0; i <= 120; i++) { const x = -span / 2 - 0.3 + (i / 120) * (span + 0.6); pts.push(V3(x, curve(Math.max(-span / 2, Math.min(span / 2, x))), 0)); }
  const path = new THREE.CatmullRomCurve3(pts);
  bins.add(cable, new THREE.TubeGeometry(path, 240, 0.004, 8));
  const g = new THREE.Group(); g.name = 'prikkabel';
  for (let i = 0; i < n; i++) {
    const x = -span / 2 + i * spacing, y = curve(x);
    bins.add(socket, G.tube(V3(x, y - 0.075, 0), V3(x, y + 0.004, 0), 0.016, 16));
    const bulb = G.lathe([[0.0001, 0.0], [0.02, 0.006], [0.0225, 0.025], [0.0222, 0.05], [0.014, 0.068], [0.011, 0.075]].map(([r, yy]) => [r, -yy]).reverse(), 32);
    // globe: sphere + neck
    const sph = new THREE.SphereGeometry(0.0225, 32, 16); sph.translate(x, y - 0.075 - 0.024, 0);
    bins.add(glass, sph);
    const fil = new THREE.SphereGeometry(0.004, 8, 6); fil.translate(x, y - 0.075 - 0.022, 0);
    bins.add(filament, fil);
    bulb.dispose();
  }
  bins.build(g, { cast: true, receive: true });
  g.traverse((o) => { if (o.isMesh && o.material === glass) o.castShadow = false; });
  return wrap(g, { target: [0, curve(0) - 0.08, 0], size: 0.4, azimuth: 20, elevation: 5 }, { n, span }, { hero: { azimuth: 18, elevation: 8 } });
}

// ---------------------------------------------------------------------------------
// Stretchtent: tensioned membrane on poles, scalloped edges, guy lines to stakes.
export function stretchtent(p = {}) {
  const W = Number(p.w ?? 10), D = Number(p.d ?? 7.5);
  const fab = M.lycra(p.color || 'zand');
  fab.side = THREE.DoubleSide;
  const poleMat = M.aluminium({ roughness: 0.35 });
  const rope = M.rubber('#2B2B2B');
  const bins = new G.PartBin();
  const poles = p.poles || [[-W * 0.22, 0, 4.6], [W * 0.22, 0, 4.6]];
  // anchor points on the perimeter (low corners)
  const anchors = p.anchors || [[-W / 2, -D / 2, 1.2], [0, -D / 2 - 0.4, 2.4], [W / 2, -D / 2, 1.2], [W / 2 + 0.4, 0, 2.2], [W / 2, D / 2, 1.2], [0, D / 2 + 0.4, 2.4], [-W / 2, D / 2, 1.2], [-W / 2 - 0.4, 0, 2.2]];
  // membrane as a height field over an ellipse-ish domain, scalloped by angle
  const nA = anchors.length;
  const angOf = (x, z) => Math.atan2(z / D, x / W);
  const anchorAng = anchors.map(([x, z]) => angOf(x, z));
  const height = (x, z) => {
    let h = 0, wsum = 0;
    for (const [px, pz, ph] of poles) { const d2 = ((x - px) ** 2 + (z - pz) ** 2); const w = Math.exp(-d2 / 6); h += ph * w; wsum += w; }
    return h;
  };
  const surf = G.surface((u, v, o) => {
    const a = -Math.PI + u * TAU;
    // edge radius: scallop between anchors (catenary-like inward arcs)
    let k = 0; while (k < nA - 1 && !(angBetween(a, anchorAng[k], anchorAng[(k + 1) % nA]))) k++;
    const A = anchors[k], B = anchors[(k + 1) % nA];
    const a0 = anchorAng[k], a1 = anchorAng[(k + 1) % nA];
    let t = angFrac(a, a0, a1);
    const ex = lerp(A[0], B[0], t), ez = lerp(A[1], B[1], t);
    const scallop = 0.16 * Math.sin(Math.PI * t);
    const edgeX = ex * (1 - scallop), edgeZ = ez * (1 - scallop);
    const edgeY = lerp(A[2], B[2], t) + 0.45 * Math.sin(Math.PI * t);
    const r = Math.pow(v, 0.9);
    const x = edgeX * r, z = edgeZ * r;
    // blend between the pole-lifted interior and the edge height
    const hIn = Math.max(height(x, z), 2.6);
    const y = lerp(hIn, edgeY, smoothstep(0.55, 1, r) ** 1.2) - 0.25 * Math.sin(Math.PI * r) * (1 - smoothstep(0.0, 0.4, Math.abs(r - 0.5)));
    o.set(x, y, z);
  }, 160, 50, { closedU: true });
  bins.add(fab, surf);
  for (const [px, pz, ph] of poles) bins.add(poleMat, G.tube(V3(px, 0, pz), V3(px, ph - 0.05, pz), 0.035, 20));
  for (const [ax, az, ay] of anchors) {
    const dir = V3(ax, 0, az).normalize();
    const stake = V3(ax, 0, az).addScaledVector(dir, 1.2);
    bins.add(rope, G.tube(V3(ax, ay, az), stake, 0.006, 6));
    bins.add(M.galvanised(), G.tube(stake.clone().setY(0), stake.clone().setY(0.06), 0.012, 10));
  }
  const g = new THREE.Group(); g.name = 'stretchtent'; bins.build(g);
  return wrap(g, { target: [poles[0][0], 3.5, poles[0][1]], size: 3, azimuth: 30, elevation: 10 }, { W, D }, { hero: { elevation: 20 } });
}
function normAng(a) { return ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; }
function angBetween(a, a0, a1) { const d = normAng(a1 - a0); const e = normAng(a - a0); return d > 0 ? e >= 0 && e <= d : e <= 0 && e >= d; }
function angFrac(a, a0, a1) { const d = normAng(a1 - a0); return clamp(normAng(a - a0) / (d || 1e-6)); }

// ---------------------------------------------------------------------------------
// Stertent: central king pole, N star points raised on side poles and guyed.
export function stertent(p = {}) {
  const Dm = Number(p.diameter ?? 10), N = Number(p.points ?? 6);
  const fab = M.tentFabric(p.color || 'wit');
  const poleMat = M.aluminium({ roughness: 0.35 });
  const rope = M.rubber('#2B2B2B');
  const bins = new G.PartBin();
  const R = Dm / 2, Hc = Number(p.height ?? 5.0), Hp = 2.1;
  const surf = G.surface((u, v, o) => {
    const a = u * TAU;
    const k = Math.round((a / TAU) * N) % N;
    const local = a - (k / N) * TAU; // distance to the nearest point
    const m = Math.abs(normAng(local)) / (Math.PI / N); // 0 at point, 1 mid-edge
    const rEdge = R * (1 - 0.2 * Math.sin((m * Math.PI) / 2) ** 2);
    const yEdge = Hp - 0.55 * m * m;
    const r = v * rEdge;
    const yLin = lerp(Hc, yEdge, v);
    const sag = 0.35 * Math.sin(Math.PI * v) * (0.3 + 0.7 * m);
    o.set(Math.sin(a) * r, yLin - sag, Math.cos(a) * r);
  }, N * 40, 60, { closedU: true });
  bins.add(fab, surf);
  bins.add(poleMat, G.tube(V3(0, 0, 0), V3(0, Hc - 0.02, 0), 0.05, 24));
  for (let k = 0; k < N; k++) {
    const a = (k / N) * TAU;
    const d = V3(Math.sin(a), 0, Math.cos(a));
    const top = d.clone().multiplyScalar(R).setY(Hp);
    bins.add(poleMat, G.tube(top.clone().setY(0), top.clone().setY(Hp + 0.12), 0.025, 14));
    const stake = d.clone().multiplyScalar(R + 1.6);
    bins.add(rope, G.tube(top.clone().setY(Hp + 0.1), stake, 0.006, 6));
    bins.add(M.galvanised(), G.tube(stake.clone().setY(0), stake.clone().setY(0.06), 0.012, 10));
  }
  const g = new THREE.Group(); g.name = 'stertent'; bins.build(g);
  return wrap(g, { target: [0, Hc - 0.6, 0], size: 2.0, azimuth: 30, elevation: 5 }, { Dm, N });
}

// ---------------------------------------------------------------------------------
// Opblaasbare tent: inflatable spider tent — tubular legs arching to a central ring.
export function opblaasbareTent(p = {}) {
  const S = Number(p.w ?? p.diameter ?? 5), N = Number(p.legs ?? 4);
  const tube = M.tentFabric(p.color || 'wit', { translucent: false });
  const canopy = M.tentFabric(p.canopyColor || p.color || 'wit');
  const bins = new G.PartBin();
  const H = Number(p.height ?? 3.2), rLeg = 0.24;
  const legCurve = (k) => {
    const a = (k / N) * TAU + Math.PI / N;
    const d = V3(Math.sin(a), 0, Math.cos(a));
    const foot = d.clone().multiplyScalar(S * 0.62);
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const r = lerp(S * 0.62, 0.35, Math.pow(t, 1.6));
      const y = Math.sin((t * Math.PI) / 2) * (H - 0.35) + 0.25 * t * t;
      pts.push(d.clone().multiplyScalar(r).setY(y + rLeg * (1 - t) * 0.8));
    }
    return { curve: new THREE.CatmullRomCurve3(pts), d, foot };
  };
  for (let k = 0; k < N; k++) {
    const { curve, foot } = legCurve(k);
    bins.add(tube, new THREE.TubeGeometry(curve, 80, rLeg, 24));
    const fp = new THREE.CylinderGeometry(rLeg * 1.25, rLeg * 1.35, 0.12, 24); fp.translate(foot.x, 0.06, foot.z); bins.add(tube, fp);
  }
  const top = new THREE.SphereGeometry(0.5, 32, 16, 0, TAU, 0, Math.PI / 2); top.scale(1, 0.55, 1); top.translate(0, H - 0.1, 0); bins.add(tube, top);
  // canopy between the legs with a valance
  const can = G.surface((u, v, o) => {
    const a = u * TAU;
    const r = lerp(0.4, S * 0.5, v);
    const y = H - 0.05 - (H - 2.35) * Math.pow(v, 1.3) - 0.12 * Math.sin(Math.PI * v);
    o.set(Math.sin(a) * r, y, Math.cos(a) * r);
  }, 160, 30, { closedU: true });
  bins.add(canopy, can);
  const val = G.surface((u, v, o) => { const a = u * TAU; const r = S * 0.5; o.set(Math.sin(a) * r, 2.35 - 0.12 - v * 0.35, Math.cos(a) * r); }, 160, 4, { closedU: true });
  bins.add(canopy, val);
  const g = new THREE.Group(); g.name = 'opblaasbareTent'; bins.build(g);
  return wrap(g, { target: [0, H - 0.4, S * 0.25], size: 1.6, azimuth: 30, elevation: 10 }, { S, N });
}
