// Koelkasten (refrigeration for events and hospitality).
//
// { kind, door, color, litres, light, lid, wheels }
//   kind 'bar'           barkoelkast with a glass door (128 / 198 / 320 l: 50x52x85, 60x56x110, 60x60x173 cm by
//                        `litres`): black cabinet, black door frame round double glazing, vertical bar handle,
//                        lock, ventilation grille in the plinth with a small digital display, four feet. Inside:
//                        LED strips behind the door frame, chrome wire shelves, filled with 33 cl bottles and cans
//                        (light: false = LEDs off)
//   kind 'staand'        upright fridge with a closed door, ca. 60 x 65 x 185 cm, white or black: header strip with a
//                        digital controller, full-height door with a magnetic gasket line and a satin bar handle,
//                        plinth grille, adjustable feet
//   kind 'rvs'           stainless GN 2/1 fridge, ca. 70 x 82 x 200 cm (600 l): brushed AISI 304 body, top header
//                        with the digital controller and a vent grille, stainless legs; door 'dicht' (stainless,
//                        tube handle) or 'glas' (stainless frame, glazing; inside lit, white rilsan grids carrying
//                        GN 2/1 stainless pans)
//   kind 'kist'          chest cooler / freezer ca. 110 x 70 x 85 cm, white, lid open (`lid: 'open'`, default) or
//                        closed: grey breaker strip and liner, two white-coated wire baskets hanging on the rim,
//                        lid with a grey inner panel and gasket on two hinges, control panel with the koelen /
//                        vriezen switch and thermostat knob, lock, side vent grille
//   kind 'flessenkoeler' mobile bottle cooler ca. 200 x 75 x 90 cm (1000 l), black, three glass sliding lids in two
//                        tracks with grip strips, crates of bottles under the glass, controller on the front, on four
//                        Ø 100 castors (two with brake)
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const cached = K.cached;

// ------------------------------------------------------------------ materials
const cabinetMat = (c) => {
  const s = String(c || 'wit').toLowerCase();
  if (s === 'rvs' || s === 'stainless') return F.stainless({ roughness: 0.26 });
  if (s === 'zwart' || s === 'black') return M.steelPowder('#1B1C1E', { roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.25 });
  return M.steelPowder('#EDEDEA', { roughness: 0.3, clearcoat: 0.45, clearcoatRoughness: 0.2 });
};
const abs = (hex, rough = 0.42) => cached(`fr-abs:${hex}:${rough}`, () => SG.moulded(hex, { rough, spec: 0.5 }));
const rubber = () => M.rubber('#2A2B2D');
function glassMat(tint = '#2B3337', cover = 0.2) {
  return cached(`fr-glass:${tint}:${cover}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: tint, roughness: 0.04, metalness: 0, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.5, side: THREE.DoubleSide, name: 'glazing' });
    m.userData.stochasticAlpha = cover;
    return m;
  });
}
function emitter(hex = '#EEF4FF', I = 2.2) {
  return cached(`fr-em:${hex}:${I}`, () => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color(hex), emissiveIntensity: I, roughness: 0.5, name: 'led strip' }));
}
function bottleGlass(hex) {
  return cached(`fr-bglass:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.07, metalness: 0, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color(hex), emissiveIntensity: 0.25, name: `bottle glass ${hex}` }));
}
const paper = (hex) => cached(`fr-label:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.55, specularIntensity: 0.4, name: `label ${hex}` }));
const capMat = (hex = '#C8A04A') => cached(`fr-cap:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: 0.3, name: `crown cap ${hex}` }));
const canMat = (hex) => cached(`fr-can:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.75, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.15, name: `can ${hex}` }));
function displayMat(text, { fg = '#7FD3FF', bg = '#0A0B0C' } = {}) {
  return cached(`fr-disp:${text}:${fg}`, () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 96);
    g.fillStyle = fg; g.font = '700 70px "DejaVu Sans Mono", "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 52);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.6, roughness: 0.15, name: `display ${text}` });
  });
}

// ------------------------------------------------------------------ helpers
const box = (w, h, d, x, y, z, r = 0.004) => { const g = G.roundedBox(w, h, d, Math.min(r, w / 2.2, h / 2.2, d / 2.2)); g.translate(x, y, z); return g; };
// louvred grille in a recess on a face at z = zf (facing +Z), centre (x, y), w x h, horizontal slats
function grilleZ(B, back, slat, { x, y, w, h, zf, n = 7 }) {
  B.add(back, box(w, h, 0.004, x, y, zf - 0.012));
  const p = h / n;
  for (let i = 0; i < n; i++) B.add(slat, box(w - 0.004, p * 0.45, 0.012, x, y - h / 2 + p * (i + 0.5), zf - 0.006, 0.002));
}
// louvred grille on a side face at x = xf (facing +X)
function grilleX(B, back, slat, { z, y, w, h, xf, n = 7 }) {
  B.add(back, box(0.004, h, w, xf - 0.004, y, z));
  const p = h / n;
  for (let i = 0; i < n; i++) B.add(slat, box(0.006, p * 0.45, w - 0.004, xf - 0.001, y - h / 2 + p * (i + 0.5), z, 0.0015));
}
// small digital controller: dark window with digits, two buttons
function controller(B, { x, y, zf, text = '3.5', w = 0.085, h = 0.034, fg }) {
  B.add(abs('#121314', 0.3), box(w + 0.02, h + 0.014, 0.006, x, y, zf + 0.002, 0.003));
  const pl = new THREE.PlaneGeometry(w * 0.62, h * 0.8); pl.translate(x - w * 0.16, y, zf + 0.0052);
  B.add(displayMat(text, { fg }), pl);
  for (const k of [0, 1]) B.add(abs('#3A3C3F', 0.35), G.lathe([[0.0001, 0], [0.0042, 0], [0.0042, 0.002], [0.0036, 0.0028], [0.0001, 0.003]], 20).rotateX(Math.PI / 2).translate(x + w * 0.26 + k * 0.012 - 0.006, y - 0.003 + k * 0.006, zf + 0.005));
}
// adjustable foot (black PP) under a cabinet, top at y
function foot(B, x, z, y) {
  B.add(abs('#151617', 0.5), G.lathe([[0.0001, 0], [0.018, 0], [0.019, 0.003], [0.016, 0.01], [0.009, 0.012], [0.009, y], [0.0001, y]], 24).translate(x, 0, z));
}
// vertical bar handle with two standoffs on a face at z = zf
function barHandle(B, mat, { x, y0, y1, zf, r = 0.0105, off = 0.045 }) {
  const pts = [V3(x, y0, zf), V3(x, y0, zf + off), V3(x, y1, zf + off), V3(x, y1, zf)];
  B.add(mat, F.sweep(F.filletPath(pts, 0.022), G.circleProfile(r, 20)));
}
// 33 cl long-neck bottle, base at the origin
function bottle(B, glass, label, cap, at) {
  const R = 0.0295;
  const prof = [[0.0001, 0.003], [R - 0.006, 0], [R - 0.0015, 0.0012], [R, 0.006], [R, 0.135], [R - 0.003, 0.15], [0.0175, 0.168], [0.0128, 0.186], [0.0118, 0.212], [0.0134, 0.214], [0.0134, 0.221], [0.0118, 0.223], [0.0001, 0.223]];
  B.add(glass, G.lathe(prof, 40).translate(at.x, at.y, at.z));
  if (label) {
    const l = new THREE.CylinderGeometry(R + 0.0004, R + 0.0004, 0.072, 40, 1, true); l.translate(at.x, at.y + 0.085, at.z); B.add(label, l);
    const n = new THREE.CylinderGeometry(0.0134, 0.0124, 0.024, 28, 1, true); n.translate(at.x, at.y + 0.196, at.z); B.add(label, n);
  }
  B.add(cap, G.lathe([[0.0001, 0.0068], [0.0142, 0.0068], [0.0146, 0.003], [0.0142, 0], [0.0001, 0]].reverse(), 28).translate(at.x, at.y + 0.2205, at.z));
}
// 33 cl can, base at the origin
function can(B, body, top, at) {
  const R = 0.033, H = 0.115;
  B.add(body, G.lathe([[0.0001, 0.004], [R - 0.008, 0], [R - 0.003, 0.0015], [R, 0.009], [R, H - 0.013], [R - 0.006, H - 0.003], [0.0001, H - 0.003]], 40).translate(at.x, at.y, at.z));
  B.add(top, G.lathe([[0.0001, H - 0.003], [R - 0.006, H - 0.003], [R - 0.0055, H], [R - 0.0065, H + 0.0002], [0.0001, H - 0.001]], 36).translate(at.x, at.y, at.z));
}
// chrome wire shelf in the xz plane at height y, w x d
function wireShelf(B, mat, { w, d, y, z = 0, pitch = 0.022 }) {
  B.add(mat, F.sweep(F.rectPath(w, d, 0.01, y, 6).map((p) => p.add(V3(0, 0, z))), G.circleProfile(0.003, 10), { closed: true }));
  const n = Math.floor(w / pitch);
  for (let i = 1; i < n; i++) { const x = -w / 2 + (w * i) / n; B.add(mat, G.tube(V3(x, y + 0.0038, z - d / 2 + 0.003), V3(x, y + 0.0038, z + d / 2 - 0.003), 0.0016, 6)); }
  for (const t of [-0.3, 0.3]) B.add(mat, G.tube(V3(-w / 2 + 0.004, y + 0.0005, z + t * d), V3(w / 2 - 0.004, y + 0.0005, z + t * d), 0.0022, 8));
}
// open box made of five inward panels: interior liner of a cabinet (x0..x1, y0..y1, z0..z1, open at z1)
function liner(B, mat, { x0, x1, y0, y1, z0, z1, t = 0.004, open = 'front' }) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  B.add(mat, box(w, h, t, cx, cy, z0 - t / 2, 0.001));
  if (open === 'top') {
    B.add(mat, box(w, h, t, cx, cy, z1 + t / 2, 0.001));
    B.add(mat, box(t, h, d, x0 - t / 2, cy, cz, 0.001));
    B.add(mat, box(t, h, d, x1 + t / 2, cy, cz, 0.001));
    B.add(mat, box(w, t, d, cx, y0 - t / 2, cz, 0.001));
    return;
  }
  B.add(mat, box(t, h, d, x0 - t / 2, cy, cz, 0.001));
  B.add(mat, box(t, h, d, x1 + t / 2, cy, cz, 0.001));
  B.add(mat, box(w, t, d, cx, y0 - t / 2, cz, 0.001));
  B.add(mat, box(w, t, d, cx, y1 + t / 2, cz, 0.001));
}
// cabinet shell open at the front (z1): back, sides, top and bottom slabs; ts = side, tt = top, tb = bottom thickness
function shellFront(B, mat, { W, y0, y1, z0, z1, ts = 0.045, tt = 0.07, tb = 0.1, r = 0.006 }) {
  const h = y1 - y0, d = z1 - z0, cz = (z0 + z1) / 2;
  B.add(mat, box(W, h, 0.03, 0, y0 + h / 2, z0 + 0.015, r));
  for (const sx of [-1, 1]) B.add(mat, box(ts, h, d, sx * (W / 2 - ts / 2), y0 + h / 2, cz, r));
  B.add(mat, box(W, tt, d, 0, y1 - tt / 2, cz, r));
  B.add(mat, box(W, tb, d, 0, y0 + tb / 2, cz, r));
}
// cabinet walls open at the top: a rounded-rectangle ring extruded from y0 to y1 (wall thickness t) + a floor slab
function shellTop(B, mat, { W, D, y0, y1, t = 0.06, rc = 0.03 }) {
  const sh = new THREE.Shape(G.roundedRectProfile(W, D, rc, 6).map((q) => new THREE.Vector2(q.x, q.y)));
  sh.holes.push(new THREE.Path(G.roundedRectProfile(W - 2 * t, D - 2 * t, Math.max(0.006, rc - t * 0.5), 6).map((q) => new THREE.Vector2(q.x, q.y)).reverse()));
  B.add(mat, K.extrudeY(sh, y1 - y0, { y0, bevel: 0.004, bevelSegs: 2, curveSegs: 8 }));
  B.add(mat, box(W - 0.01, 0.03, D - 0.01, 0, y0 + 0.015, 0, 0.01));
}
// dark gasket line round a door (four strips in the plane z), outer size w x h centred on (cx, cy)
function gasket(B, mat, { w, h, cx = 0, cy, z, t = 0.01 }) {
  B.add(mat, box(w, t, 0.004, cx, cy + h / 2 - t / 2, z, 0.001));
  B.add(mat, box(w, t, 0.004, cx, cy - h / 2 + t / 2, z, 0.001));
  B.add(mat, box(t, h, 0.004, cx - w / 2 + t / 2, cy, z, 0.001));
  B.add(mat, box(t, h, 0.004, cx + w / 2 - t / 2, cy, z, 0.001));
}
function lamp(group, x, y, z, I = 0.3, color = '#F2F6FF') {
  const l = new THREE.PointLight(color, I, 0, 2); l.position.set(x, y, z); l.castShadow = false; group.add(l);
}
function buildGlass(group, geos, mat) {
  for (const g of geos) { const m = G.mesh(g, mat, { cast: false, receive: false }); group.add(m); }
}

// ------------------------------------------------------------------ kinds
function barFridge(B, group, p) {
  const L = Number(p.litres ?? 198);
  const [W, D, H] = L <= 140 ? [0.5, 0.52, 0.85] : L <= 250 ? [0.6, 0.56, 1.1] : [0.6, 0.6, 1.73];
  const black = cabinetMat('zwart'), frame = abs('#141516', 0.4), slat = abs('#1A1B1C', 0.5);
  const yb = 0.03, yd0 = 0.125, dt = 0.05, zf = D / 2 - dt;   // feet, door bottom, door thickness, cabinet front
  // cabinet shell (sides, top, back) and plinth
  shellFront(B, black, { W, y0: yb, y1: H, z0: -D / 2, z1: zf, ts: 0.045, tt: 0.07, tb: 0.17 - yb });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) foot(B, sx * (W / 2 - 0.05), sz * (D / 2 - 0.08), yb + 0.002);
  grilleZ(B, abs('#0E0F10', 0.6), slat, { x: -0.06, y: (yb + yd0) / 2 + 0.006, w: W - 0.2, h: yd0 - yb - 0.03, zf: zf + dt - 0.004, n: 6 });
  B.add(black, box(W, yd0 - yb - 0.004, dt - 0.006, 0, (yb + yd0) / 2, zf + (dt - 0.006) / 2, 0.004));
  controller(B, { x: W / 2 - 0.075, y: (yb + yd0) / 2 + 0.004, zf: zf + dt - 0.006, text: '4.0' });
  // door: frame round the glazing
  const fy0 = yd0, fy1 = H - 0.005, fx = W / 2 - 0.002;
  const sw = 0.048, tw = 0.06, bw = 0.075;
  const zc = zf + dt / 2;
  B.add(frame, box(sw, fy1 - fy0, dt, -fx + sw / 2, (fy0 + fy1) / 2, zc, 0.006));
  B.add(frame, box(sw, fy1 - fy0, dt, fx - sw / 2, (fy0 + fy1) / 2, zc, 0.006));
  B.add(frame, box(2 * fx - 2 * sw + 0.01, tw, dt, 0, fy1 - tw / 2, zc, 0.006));
  B.add(frame, box(2 * fx - 2 * sw + 0.01, bw, dt, 0, fy0 + bw / 2, zc, 0.006));
  // gasket shadow line between door and cabinet
  gasket(B, abs('#0B0B0C', 0.7), { w: W - 0.006, h: fy1 - fy0 - 0.004, cy: (fy0 + fy1) / 2, z: zf + 0.001 });
  // handle (brushed alu bar) on the right stile, lock under it
  barHandle(B, F.stainless({ roughness: 0.3 }), { x: fx - sw / 2, y0: fy0 + 0.3 * (fy1 - fy0), y1: fy0 + 0.72 * (fy1 - fy0), zf: zf + dt, r: 0.008, off: 0.035 });
  B.add(M.chrome(), G.lathe([[0.0001, 0], [0.008, 0], [0.008, 0.004], [0.0065, 0.006], [0.0001, 0.006]], 24).rotateX(Math.PI / 2).translate(fx - sw / 2, fy0 + 0.04, zf + dt));
  // glazing (double: two panes)
  const gx = fx - sw + 0.004, gy0 = fy0 + bw - 0.004, gy1 = fy1 - tw + 0.004;
  const panes = [];
  for (const dz of [dt - 0.008, 0.012]) { const g = new THREE.PlaneGeometry(2 * gx, gy1 - gy0); g.translate(0, (gy0 + gy1) / 2, zf + dz); panes.push(g); }
  // interior
  const ix0 = -W / 2 + 0.045, ix1 = W / 2 - 0.045, iy0 = 0.17, iy1 = H - 0.07, iz0 = -D / 2 + 0.05, iz1 = zf;
  liner(B, abs('#5E6266', 0.35), { x0: ix0, x1: ix1, y0: iy0, y1: iy1, z0: iz0, z1: iz1 });
  // LED strips behind the door frame (top and both stiles)
  const lit = p.light !== false;
  const led = lit ? emitter('#EAF2FF', 2.4) : abs('#DDDDDD', 0.4);
  B.add(led, box(ix1 - ix0 - 0.02, 0.008, 0.008, 0, iy1 - 0.01, iz1 - 0.012, 0.002));
  for (const x of [ix0 + 0.006, ix1 - 0.006]) B.add(led, box(0.006, iy1 - iy0 - 0.06, 0.008, x, (iy0 + iy1) / 2, iz1 - 0.016, 0.002));
  if (lit) { lamp(group, 0, iy1 - 0.05, iz1 - 0.08, 0.16); lamp(group, 0, (iy0 + iy1) / 2, iz1 - 0.04, 0.12); lamp(group, 0, iy0 + 0.12, iz1 - 0.06, 0.08); }
  // shelves and stock
  const chrome = M.chrome();
  const iw = ix1 - ix0, idp = iz1 - iz0;
  const levels = [];
  let y = iy0;
  while (y + 0.24 < iy1) { levels.push(y); y += 0.258; }
  const R = rng(17);
  const kinds = [
    { glass: bottleGlass('#3E1D06'), label: paper('#EDE2C4'), cap: capMat('#C8A04A') },
    { glass: bottleGlass('#163E1A'), label: paper('#F2F0EA'), cap: capMat('#B9BDC2') },
    { cans: true, body: canMat('#B52025'), top: canMat('#C9CDD1') },
    { glass: bottleGlass('#3A1A05'), label: paper('#A51F26'), cap: capMat('#C8A04A') },
  ];
  levels.forEach((ly, li) => {
    if (li > 0) wireShelf(B, chrome, { w: iw - 0.006, d: idp - 0.02, y: ly - 0.004, z: (iz0 + iz1) / 2 });
    const kd = kinds[li % kinds.length];
    const pitch = kd.cans ? 0.068 : 0.062;
    const nx = Math.floor((iw - 0.01) / pitch);
    for (let r = 0; r < 3; r++) for (let i = 0; i < nx; i++) {
      const x = -((nx - 1) * pitch) / 2 + i * pitch + (r % 2) * 0.004;
      const z = iz1 - 0.05 - r * (pitch + 0.004);
      if (kd.cans) {
        const top = R() < 0.5 ? canMat('#1F4FA8') : kd.body;
        can(B, top, kd.top, V3(x, ly, z));
        if (ly + 0.25 < (levels[li + 1] ?? iy1)) can(B, kd.body, kd.top, V3(x, ly + 0.116, z));
      } else bottle(B, kd.glass, kd.label, kd.cap, V3(x, ly, z));
    }
  });
  buildGlass(group, panes, glassMat('#273036', 0.18));
  return { W, D, H, rig: L5.goodsRig({ tone: 'black', size: Math.hypot(W, H, D) / 2, exposure: 1.18 }), detail: { target: [W / 2 - 0.05, H * 0.6, D / 2], size: 0.35, azimuth: 30, elevation: 10 } };
}

function uprightFridge(B, group, p) {
  const W = 0.6, D = 0.65, H = 1.85;
  const col = String(p.color || 'wit').toLowerCase();
  const cab = cabinetMat(col);
  const black = col === 'zwart';
  const yb = 0.025, yd0 = 0.105, dt = 0.06, zf = D / 2 - dt, hh = 0.09;
  B.add(cab, box(W, H - yb, D - dt, 0, yb + (H - yb) / 2, -dt / 2, 0.006));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) foot(B, sx * (W / 2 - 0.05), sz * (D / 2 - 0.08), yb + 0.002);
  // plinth with grille
  B.add(cab, box(W, yd0 - yb - 0.004, dt - 0.006, 0, (yb + yd0) / 2, zf + (dt - 0.006) / 2, 0.004));
  grilleZ(B, abs('#0E0F10', 0.6), abs(black ? '#1A1B1C' : '#2A2B2D', 0.5), { x: 0, y: (yb + yd0) / 2, w: W - 0.12, h: yd0 - yb - 0.032, zf: zf + dt - 0.006, n: 5 });
  // header strip with the controller
  B.add(cab, box(W, hh, dt - 0.006, 0, H - hh / 2, zf + (dt - 0.006) / 2, 0.005));
  controller(B, { x: W / 2 - 0.11, y: H - hh / 2, zf: zf + dt - 0.006, text: '3.0', fg: '#FF5A3C' });
  // door
  const y0 = yd0 + 0.004, y1 = H - hh - 0.004;
  B.add(cab, box(W - 0.004, y1 - y0, dt, 0, (y0 + y1) / 2, zf + dt / 2, 0.012));
  gasket(B, abs('#4A4C4F', 0.7), { w: W - 0.02, h: y1 - y0 - 0.016, cy: (y0 + y1) / 2, z: zf + 0.0005 });
  barHandle(B, M.aluminium({ roughness: 0.32 }), { x: W / 2 - 0.045, y0: y0 + 0.62, y1: y0 + 1.12, zf: zf + dt, r: 0.0095, off: 0.04 });
  // hinge caps (left)
  for (const yy of [y0 - 0.004, y1 + 0.004]) B.add(abs(black ? '#121314' : '#9EA1A4', 0.4), box(0.04, 0.008, 0.03, -W / 2 + 0.03, yy, zf + dt / 2, 0.002));
  return { W, D, H, rig: L5.goodsRig({ tone: black ? 'black' : 'white', size: Math.hypot(W, H, D) / 2 }), detail: { target: [W / 2 - 0.05, H - 0.1, D / 2], size: 0.3, azimuth: 30, elevation: 12 } };
}

function rvsFridge(B, group, p) {
  const W = 0.7, D = 0.82, H = 2.0;
  const rvs = F.stainless({ roughness: 0.26 }), rvs2 = F.stainless({ roughness: 0.34 });
  const glassDoor = String(p.door || 'dicht').toLowerCase().startsWith('gl');
  const yl = 0.13, hh = 0.165, dt = 0.07, zf = D / 2 - dt;
  // legs: Ø 40 stainless tubes with adjustable bullet feet
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (W / 2 - 0.06), z = sz * (D / 2 - 0.08);
    B.add(rvs2, G.lathe([[0.0001, 0], [0.012, 0], [0.014, 0.012], [0.009, 0.03], [0.02, 0.032], [0.02, yl], [0.0001, yl]], 28).translate(x, 0, z));
  }
  if (glassDoor) shellFront(B, rvs, { W, y0: yl, y1: H, z0: -D / 2, z1: zf, ts: 0.05, tt: hh + 0.06, tb: 0.11, r: 0.004 });
  else B.add(rvs, box(W, H - yl, D - dt, 0, yl + (H - yl) / 2, -dt / 2, 0.004));
  // header: front panel with the controller and a vent slot grille
  B.add(rvs, box(W, hh, dt - 0.004, 0, H - hh / 2, zf + (dt - 0.004) / 2, 0.004));
  controller(B, { x: -W / 2 + 0.16, y: H - hh / 2, zf: zf + dt - 0.004, text: '2.0', w: 0.1, h: 0.04, fg: '#FF4A30' });
  for (let i = 0; i < 9; i++) B.add(abs('#0C0C0D', 0.6), box(0.012, 0.075, 0.004, W / 2 - 0.26 + i * 0.024, H - hh / 2, zf + dt - 0.004, 0.005));
  // bottom panel under the door
  B.add(rvs, box(W, 0.05, dt - 0.004, 0, yl + 0.025, zf + (dt - 0.004) / 2, 0.003));
  const y0 = yl + 0.054, y1 = H - hh - 0.004;
  const zc = zf + dt / 2;
  if (!glassDoor) {
    B.add(rvs, box(W - 0.006, y1 - y0, dt, 0, (y0 + y1) / 2, zc, 0.008));
  } else {
    const sw = 0.065;
    B.add(rvs, box(sw, y1 - y0, dt, -W / 2 + 0.003 + sw / 2, (y0 + y1) / 2, zc, 0.006));
    B.add(rvs, box(sw, y1 - y0, dt, W / 2 - 0.003 - sw / 2, (y0 + y1) / 2, zc, 0.006));
    B.add(rvs, box(W - 0.006 - 2 * sw + 0.01, sw, dt, 0, y1 - sw / 2, zc, 0.006));
    B.add(rvs, box(W - 0.006 - 2 * sw + 0.01, sw + 0.02, dt, 0, y0 + (sw + 0.02) / 2, zc, 0.006));
    const gx = W / 2 - sw - 0.002, gy0 = y0 + sw + 0.016, gy1 = y1 - sw + 0.004;
    const panes = [];
    for (const dz of [dt - 0.01, 0.014]) { const g = new THREE.PlaneGeometry(2 * gx, gy1 - gy0); g.translate(0, (gy0 + gy1) / 2, zf + dz); panes.push(g); }
    buildGlass(group, panes, glassMat('#2A3034', 0.16));
    // inside: stainless liner, LED in the ceiling, white rilsan GN 2/1 grids with stainless pans
    const ix0 = -W / 2 + 0.05, ix1 = W / 2 - 0.05, iy0 = yl + 0.11, iy1 = H - hh - 0.06, iz0 = -D / 2 + 0.06, iz1 = zf;
    liner(B, rvs2, { x0: ix0, x1: ix1, y0: iy0, y1: iy1, z0: iz0, z1: iz1 });
    B.add(emitter('#EEF4FF', 2.2), box(ix1 - ix0 - 0.08, 0.008, 0.03, 0, iy1 - 0.006, iz1 - 0.06, 0.003));
    lamp(group, 0, iy1 - 0.08, iz1 - 0.12, 0.3); lamp(group, 0, (iy0 + iy1) / 2, iz1 - 0.06, 0.18); lamp(group, 0, iy0 + 0.25, iz1 - 0.08, 0.12);
    const rils = abs('#EEEEEA', 0.35);
    // tray guides on the side walls
    const n = 5;
    for (let k = 0; k < n; k++) {
      const yy = iy0 + 0.12 + k * ((iy1 - iy0 - 0.2) / (n - 1));
      for (const sx of [-1, 1]) B.add(rvs2, box(0.018, 0.012, iz1 - iz0 - 0.04, sx * ((ix1 - ix0) / 2 - 0.009), yy - 0.006, (iz0 + iz1) / 2, 0.002));
      wireShelf(B, rils, { w: ix1 - ix0 - 0.006, d: iz1 - iz0 - 0.06, y: yy, z: (iz0 + iz1) / 2 - 0.01, pitch: 0.03 });
      // GN 2/1 pan (650 x 530, 65 deep) on the grid: rim flange, tapered sides, rounded corners
      const pw = 0.53, pd = 0.6, ph = k % 2 ? 0.065 : 0.1;
      const panY = yy + 0.006;
      const prof = G.roundedRectProfile(pw, pd, 0.03, 4);
      const rim = F.sweep(F.rectPath(pw + 0.02, pd + 0.02, 0.035, panY + ph, 6), G.roundedRectProfile(0.003, 0.02, 0.0012, 2), { closed: true });
      B.add(rvs2, rim);
      const wall = []; for (let j = 0; j <= 1; j++) { const s = j ? 1 : 0.94; wall.push(prof.map((q) => V3(q.x * s, panY + (j ? ph : 0), q.y * s + (iz0 + iz1) / 2 - 0.01))); }
      const wg = K.gridGeometry([[...wall[0], wall[0][0]], [...wall[1], wall[1][0]]].map((r) => r), { flip: false });
      B.add(F.stainless({ roughness: 0.2 }), wg);
      const bottom = G.prism(G.roundedRectProfile(pw * 0.94, pd * 0.94, 0.028, 4), V3(0, panY, (iz0 + iz1) / 2 - 0.01), V3(0, panY + 0.002, (iz0 + iz1) / 2 - 0.01), { side: V3(1, 0, 0) });
      B.add(F.stainless({ roughness: 0.2 }), bottom);
      if (k === 1 || k === 3) {
        // cherry tomatoes heaped in the pan
        const R = rng(30 + k), tom = cached('fr-tomato', () => new THREE.MeshPhysicalMaterial({ color: '#B8221A', roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, name: 'tomato' }));
        const cz = (iz0 + iz1) / 2 - 0.01;
        for (let a = 0; a < 15; a++) for (let b = 0; b < 17; b++) {
          const x = -pw / 2 + 0.03 + a * 0.034 + (b % 2) * 0.017 + (R() - 0.5) * 0.006, z = cz - pd / 2 + 0.03 + b * 0.032 + (R() - 0.5) * 0.006;
          if (Math.abs(x) > pw * 0.44 || Math.abs(z - cz) > pd * 0.44) continue;
          const rr = 0.014 + R() * 0.003;
          B.add(tom, new THREE.SphereGeometry(rr, 14, 10).scale(1, 0.9, 1).translate(x, panY + rr + 0.002 + (R() < 0.3 ? 0.012 : 0), z));
        }
      }
    }
  }
  // handle: stainless tube on the right, gasket line
  barHandle(B, M.chrome(), { x: W / 2 - 0.05, y0: y0 + 0.62, y1: y0 + 1.08, zf: zf + dt, r: 0.011, off: 0.05 });
  gasket(B, abs('#1E1F21', 0.7), { w: W - 0.01, h: y1 - y0 - 0.01, cy: (y0 + y1) / 2, z: zf + 0.0005 });
  for (const yy of [y0 + 0.08, y1 - 0.08]) B.add(rvs2, box(0.02, 0.06, 0.012, -W / 2 + 0.006, yy, zf + dt / 2, 0.003));
  return { W, D, H, rig: L5.goodsRig({ tone: 'mid', size: Math.hypot(W, H, D) / 2, extra: { envIntensity: 1.15 } }), detail: { target: [-W / 2 + 0.16, H - 0.08, D / 2], size: 0.3, azimuth: 30, elevation: 8 } };
}

function chestFreezer(B, group, p) {
  const W = 1.1, D = 0.7, Hb = 0.79, lidT = 0.065;
  const white = cabinetMat('wit'), grey = abs('#B9BCBF', 0.4), liner0 = abs('#E9EAE8', 0.35), gasket = M.rubber('#8C8F92');
  const open = String(p.lid || 'open') !== 'dicht' && p.lid !== 'closed';
  // feet
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) foot(B, sx * (W / 2 - 0.06), sz * (D / 2 - 0.06), 0.024);
  const yb = 0.022;
  // body: outer shell as four walls + floor (the top is open)
  const wt = 0.075, r = 0.012;
  const sh = new THREE.Shape(G.roundedRectProfile(W, D, 0.03, 6).map((q) => new THREE.Vector2(q.x, q.y)));
  const hole = new THREE.Path(G.roundedRectProfile(W - 2 * wt, D - 2 * wt, 0.02, 6).map((q) => new THREE.Vector2(q.x, q.y)).reverse());
  sh.holes.push(hole);
  const walls = K.extrudeY(sh, Hb - yb - 0.02, { y0: yb, bevel: 0.004, bevelSegs: 2, curveSegs: 8 });
  B.add(white, walls);
  B.add(white, box(W - 0.01, 0.03, D - 0.01, 0, yb + 0.015, 0, 0.01));
  // breaker strip (grey) round the opening at the top, liner inside
  const bs = new THREE.Shape(G.roundedRectProfile(W - 0.004, D - 0.004, 0.028, 6).map((q) => new THREE.Vector2(q.x, q.y)));
  bs.holes.push(new THREE.Path(G.roundedRectProfile(W - 2 * wt + 0.012, D - 2 * wt + 0.012, 0.018, 6).map((q) => new THREE.Vector2(q.x, q.y)).reverse()));
  B.add(grey, K.extrudeY(bs, 0.022, { y0: Hb - 0.022, bevel: 0.004, bevelSegs: 2, curveSegs: 8 }));
  const ix = W / 2 - wt, iz = D / 2 - wt;
  liner(B, liner0, { x0: -ix + 0.004, x1: ix - 0.004, y0: 0.13, y1: Hb - 0.03, z0: -iz + 0.004, z1: iz - 0.004 });
  B.add(liner0, box(2 * ix - 0.008, 0.004, 0.006, 0, (0.13 + Hb) / 2, iz - 0.004, 0.001)); // (front wall of the liner)
  B.add(liner0, box(2 * ix - 0.01, Hb - 0.03 - 0.13, 0.004, 0, (0.13 + Hb - 0.03) / 2, iz - 0.002, 0.001));
  // compressor step at the right end inside
  B.add(liner0, box(0.28, 0.2, 2 * iz - 0.012, ix - 0.145, 0.23, 0, 0.004));
  // two white-coated wire baskets hanging on the front and back rim
  const wire = abs('#F2F2EE', 0.35);
  for (const bx of [-0.08, 0.22]) {
    const bw = 0.27, bd = 2 * iz + 0.03, bh = 0.2, ytop = Hb - 0.006;
    const zr = bd / 2 - 0.035;
    // top frame resting on the breaker strip, hooked ends
    B.add(wire, F.sweep(F.rectPath(bw, bd, 0.012, ytop, 5).map((q) => q.add(V3(bx, 0, 0))), G.circleProfile(0.003, 10), { closed: true }));
    B.add(wire, F.sweep(F.rectPath(bw - 0.01, 2 * zr, 0.012, ytop - bh, 5).map((q) => q.add(V3(bx, 0, 0))), G.circleProfile(0.003, 10), { closed: true }));
    for (let i = 0; i <= 9; i++) { const x = bx - bw / 2 + 0.005 + (i * (bw - 0.01)) / 9; for (const sz of [-1, 1]) B.add(wire, G.tube(V3(x, ytop - bh, sz * zr), V3(x, ytop, sz * (zr + (i === 0 || i === 9 ? 0.03 : 0.0))), 0.0018, 6)); B.add(wire, G.tube(V3(x, ytop - bh, -zr), V3(x, ytop - bh, zr), 0.0018, 6)); }
    for (let k = 1; k <= 3; k++) { const yy = ytop - bh + (bh * k) / 4; B.add(wire, F.sweep(F.rectPath(bw - 0.008, 2 * zr + 0.004, 0.012, yy, 5).map((q) => q.add(V3(bx, 0, 0))), G.circleProfile(0.0018, 6), { closed: true })); }
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) B.add(wire, G.tube(V3(bx + sx * (bw / 2 - 0.02), ytop, sz * (bd / 2 - 0.02)), V3(bx + sx * (bw / 2 - 0.02), ytop - 0.02, sz * (bd / 2 + 0.002)), 0.0025, 6));
  }
  // control panel on the front right: koelen / vriezen switch, knob, two LEDs
  const zF = D / 2;
  B.add(abs('#D6D8DA', 0.35), box(0.16, 0.06, 0.006, W / 2 - 0.15, Hb - 0.08, zF + 0.002, 0.004));
  B.add(abs('#2A2B2D', 0.4), box(0.026, 0.016, 0.008, W / 2 - 0.19, Hb - 0.08, zF + 0.006, 0.003));
  B.add(abs('#F4F4F2', 0.35), G.lathe([[0.0001, 0], [0.014, 0], [0.014, 0.01], [0.012, 0.014], [0.0001, 0.014]], 28).rotateX(Math.PI / 2).translate(W / 2 - 0.12, Hb - 0.08, zF + 0.004));
  B.add(emitter('#5CFF7A', 1.8), new THREE.SphereGeometry(0.003, 10, 8).translate(W / 2 - 0.085, Hb - 0.07, zF + 0.006));
  B.add(emitter('#FFB040', 1.4), new THREE.SphereGeometry(0.003, 10, 8).translate(W / 2 - 0.085, Hb - 0.09, zF + 0.006));
  // side vent grille (right end, low)
  grilleX(B, abs('#2B2C2E', 0.6), abs('#C9CBCD', 0.5), { z: 0, y: 0.17, w: 0.3, h: 0.12, xf: W / 2 + 0.003, n: 6 });
  // lid: hinged at the back top edge
  const lid = new G.PartBin();
  lid.add(white, box(W, lidT, D, 0, lidT / 2, 0, 0.018));
  lid.add(abs('#C7CACC', 0.4), box(W - 2 * wt + 0.02, 0.025, D - 2 * wt + 0.02, 0, -0.012, 0, 0.012)); // inner panel (plug)
  lid.add(gasket, F.sweep(F.rectPath(W - 0.05, D - 0.05, 0.03, -0.004, 6), G.roundedRectProfile(0.016, 0.012, 0.004, 2), { closed: true }));
  // grip recess and lock on the front edge
  lid.add(abs('#B9BCBF', 0.4), box(0.3, 0.02, 0.012, 0, lidT * 0.45, D / 2 + 0.002, 0.004));
  lid.add(M.chrome(), G.lathe([[0.0001, 0], [0.008, 0], [0.008, 0.005], [0.006, 0.007], [0.0001, 0.007]], 20).rotateX(Math.PI / 2).translate(W / 2 - 0.12, lidT * 0.5, D / 2));
  // hinges
  for (const hx of [-W / 2 + 0.2, W / 2 - 0.2]) { B.add(grey, box(0.06, 0.03, 0.04, hx, Hb - 0.01, -D / 2 - 0.012, 0.004)); lid.add(grey, box(0.06, 0.03, 0.03, hx, lidT / 2, -D / 2 - 0.012, 0.004)); }
  const ang = open ? 82 * DEG : 0;
  const m = new THREE.Matrix4().makeTranslation(0, Hb, -D / 2 - 0.02).multiply(new THREE.Matrix4().makeRotationX(-ang)).multiply(new THREE.Matrix4().makeTranslation(0, 0, D / 2 + 0.02));
  for (const [mm, l] of lid.bins) for (const g of l) { g.applyMatrix4(m); B.add(mm, g); }
  return { W, D, H: Hb + lidT, rig: L5.goodsRig({ tone: 'white', size: 0.8 }), view: { hero: { elevation: 24 } }, detail: { target: [W / 2 - 0.15, Hb - 0.08, D / 2], size: 0.25, azimuth: 30, elevation: 15 } };
}

function bottleCooler(B, group, p) {
  const W = 2.0, D = 0.75, H = 0.9;
  const black = cabinetMat('zwart'), alu = SG.aluSG({ tone: '#5E6368', rough: 0.4 }), trim = abs('#141516', 0.45);
  const Rw = 0.05, yM = F.castorHeight(Rw);
  const y0 = yM + 0.004;
  // base frame on four castors (two with brake)
  const mats = { steel: M.galvanised(), tyre: M.rubber('#2A2B2D'), hub: F.plastic('#8E9194', 0.45) };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.castor(B, { at: V3(sx * (W / 2 - 0.12), yM, sz * (D / 2 - 0.1)), R: Rw, swivel: true, brake: sx > 0, heading: sx * Math.PI / 2 + 0.1 * sz, mats });
  B.add(trim, box(W - 0.06, 0.035, D - 0.06, 0, y0 + 0.0175, 0, 0.004));
  const yt = H - 0.03;    // top of the cabinet walls (lid frame above)
  const yb0 = y0 + 0.035;
  shellTop(B, black, { W, D, y0: yb0, y1: yt, t: 0.06, rc: 0.02 });
  B.add(black, box(W - 0.1, yt - 0.42 - yb0, D - 0.1, 0, (yb0 + yt - 0.42) / 2, 0, 0.004));
  // rubber bumper along the bottom
  B.add(M.rubber('#202123'), F.sweep(F.rectPath(W + 0.012, D + 0.012, 0.02, yb0 + 0.03, 8), G.roundedRectProfile(0.024, 0.016, 0.006, 2), { closed: true }));
  // controller on the front right, vent grille on the right end
  controller(B, { x: W / 2 - 0.16, y: yt - 0.09, zf: D / 2, text: '4.0' });
  grilleX(B, abs('#0E0F10', 0.6), abs('#1C1D1E', 0.5), { z: 0, y: yb0 + 0.2, w: 0.42, h: 0.22, xf: W / 2 + 0.002, n: 8 });
  // top frame (aluminium) with two tracks; three glass lids
  const ft = 0.03;
  B.add(trim, F.sweep(F.rectPath(W - 0.004, D - 0.004, 0.012, yt + ft / 2, 6), G.roundedRectProfile(ft, 0.05, 0.004, 2), { closed: true }));
  B.add(alu, box(0.012, 0.014, D - 0.06, 0, yt + 0.004, 0, 0.002));
  const lidL = (W - 0.1) / 3 + 0.05, lidD = D - 0.07;
  const lids = [[-W / 2 + 0.05 + lidL / 2, 0], [0, 1], [W / 2 - 0.05 - lidL / 2, 0]];
  const panes = [];
  for (const [cx, track] of lids) {
    const ly = yt + 0.006 + track * 0.022;
    // lid frame (aluminium) and a black grip strip on the front
    B.add(alu, F.sweep(F.rectPath(lidL, lidD, 0.01, ly + 0.008, 6).map((q) => q.add(V3(cx, 0, 0))), G.roundedRectProfile(0.016, 0.018, 0.003, 2), { closed: true }));
    B.add(trim, box(0.22, 0.014, 0.03, cx + (track ? 0.2 : (cx < 0 ? 0.18 : -0.18)), ly + 0.02, lidD / 2 - 0.035, 0.005));
    B.add(M.chrome(), G.lathe([[0.0001, 0], [0.006, 0], [0.006, 0.004], [0.0001, 0.005]], 16).translate(cx + (track ? -0.25 : 0), ly + 0.016, lidD / 2 - 0.02));
    const g = new THREE.PlaneGeometry(lidL - 0.03, lidD - 0.03); g.rotateX(-Math.PI / 2); g.translate(cx, ly + 0.01, 0);
    panes.push(g);
  }
  buildGlass(group, panes, glassMat('#2C3438', 0.2));
  // inside: liner, LED strip, crates of bottles standing on a raised floor
  const ix = W / 2 - 0.06, iz = D / 2 - 0.06;
  liner(B, abs('#5A5E62', 0.4), { x0: -ix, x1: ix, y0: yt - 0.42, y1: yt - 0.002, z0: -iz, z1: iz, open: 'top' });
  B.add(abs('#3F4246', 0.4), box(2 * ix, 0.004, 0.004, 0, yt - 0.003, iz, 0.001));
  B.add(emitter('#EEF4FF', 2.0), box(2 * ix - 0.1, 0.006, 0.012, 0, yt - 0.012, -iz + 0.01, 0.002));
  lamp(group, -0.5, yt - 0.05, 0, 0.12); lamp(group, 0.5, yt - 0.05, 0, 0.12);
  const crateCols = ['#E3B21E', '#B5242A', '#2F6B32', '#E3B21E', '#1F4C9A', '#B5242A', '#2F6B32', '#E3B21E'];
  const kinds = [
    [bottleGlass('#3E1D06'), paper('#EDE2C4'), capMat('#C8A04A')],
    [bottleGlass('#163E1A'), paper('#F2F0EA'), capMat('#B9BDC2')],
  ];
  const cw = 0.42, cd = 0.3, ch = 0.29, yc = yt - 0.42;
  let k = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const cx = -ix + 0.02 + cw / 2 + i * (cw + 0.04), cz = -iz + 0.02 + cd / 2 + j * (cd + 0.02);
    if (cx + cw / 2 > ix) continue;
    const cr = abs(crateCols[k % crateCols.length], 0.5);
    // open crate: walls with hand holes
    for (const sz of [-1, 1]) B.add(cr, box(cw, ch, 0.008, cx, yc + ch / 2, cz + sz * (cd / 2 - 0.004), 0.003));
    for (const sx of [-1, 1]) B.add(cr, box(0.008, ch, cd, cx + sx * (cw / 2 - 0.004), yc + ch / 2, cz, 0.003));
    const kd = kinds[k % 2];
    for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) bottle(B, kd[0], kd[1], kd[2], V3(cx - cw / 2 + 0.035 + a * 0.07, yc + 0.01, cz - cd / 2 + 0.037 + b * 0.075));
    k++;
  }
  return { W, D, H, rig: L5.goodsRig({ tone: 'black', size: Math.hypot(W, H, D) / 2, exposure: 1.18 }), view: { hero: { elevation: 28 } }, detail: { target: [W / 2 - 0.2, H, D / 2], size: 0.4, azimuth: 30, elevation: 25 } };
}

export function fridge(p = {}) {
  const kind = String(p.kind || 'staand').toLowerCase();
  const group = new THREE.Group(); group.name = `fridge ${kind}`;
  const B = new G.PartBin();
  let info;
  if (kind === 'bar') info = barFridge(B, group, p);
  else if (kind === 'rvs') info = rvsFridge(B, group, p);
  else if (kind === 'kist') info = chestFreezer(B, group, p);
  else if (kind === 'flessenkoeler') info = bottleCooler(B, group, p);
  else info = uprightFridge(B, group, p);
  B.build(group);
  return {
    object: group,
    detail: info.detail,
    view: info.view || { hero: { elevation: 14 } },
    rig: info.rig,
    meta: { kind, W: info.W, D: info.D, H: info.H },
  };
}
