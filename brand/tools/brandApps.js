// Brand application models for the Klapklaar brand sheet: a generic panel van with a printed wrap, a shipping
// carton with one-colour flexo print and branded paper tape, and a tent carry bag. Metres, Y up, the printed
// side faces +Z (towards the default camera). Artwork comes in as SVG path layers: [{ d, color, rule }] in a
// viewBox vb = [w, h].
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// one canvas with several coloured SVG path layers (+ optional background rectangles), mapped to a metric box
function artCanvas({ w, h, px = 2048, draw }) {
  const c = document.createElement('canvas');
  c.width = px; c.height = Math.round(px * h / w);
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  const s = c.width / w;                      // pixels per metre
  draw(g, s, c);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
// draw SVG layers at metric position (x, y = top-left in metres, canvas y down) and width wm
function drawArt(g, s, art, x, y, wm) {
  const k = (wm * s) / art.vb[0];
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  for (const L of art.layers) { g.fillStyle = L.color; g.fill(new Path2D(L.d), L.rule || 'nonzero'); }
  g.restore();
}

function paint(color = '#F1F1EE') {
  return cached(`paint:${color}`, () => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 0.6, name: 'van paint' }));
}
const darkPlastic = () => cached('dplast', () => new THREE.MeshPhysicalMaterial({ color: '#232527', roughness: 0.62, metalness: 0, specularIntensity: 0.4, name: 'trim' }));
const glass = () => cached('glass', () => new THREE.MeshPhysicalMaterial({ color: '#16191B', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 1.4, side: THREE.DoubleSide, name: 'glass' }));
const lens = () => cached('lens', () => new THREE.MeshPhysicalMaterial({ color: '#C9CDD0', roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, name: 'lens' }));

// ------------------------------------------------------------------------------------------- van
export function bestelbus(p = {}) {
  const W = 2.0, bt = 0.07;               // body width, bevel
  const sh = new THREE.Shape();
  // side profile, x = length (rear -2.65 .. front 2.66), y up; wheel arches cut into the sill
  const fw = 1.78, rw = -1.6, wy = 0.37, ar = 0.47;
  const a0 = Math.asin((0.44 - wy) / ar);
  sh.moveTo(-2.65, 0.44);
  sh.lineTo(-2.65, 2.30); sh.quadraticCurveTo(-2.65, 2.42, -2.53, 2.42);
  sh.lineTo(1.05, 2.42); sh.quadraticCurveTo(1.42, 2.42, 1.53, 2.27);
  sh.lineTo(2.02, 1.45); sh.quadraticCurveTo(2.1, 1.31, 2.32, 1.25);
  sh.lineTo(2.52, 1.2); sh.quadraticCurveTo(2.66, 1.16, 2.66, 1.02);
  sh.lineTo(2.66, 0.56); sh.quadraticCurveTo(2.66, 0.44, 2.54, 0.44);
  sh.lineTo(fw + ar * Math.cos(a0), 0.44); sh.absarc(fw, wy, ar, a0, Math.PI - a0, false);
  sh.lineTo(rw + ar * Math.cos(a0), 0.44); sh.absarc(rw, wy, ar, a0, Math.PI - a0, false);
  sh.lineTo(-2.65, 0.44);
  const depth = W - 2 * bt;
  const body = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.05, bevelSegments: 5, curveSegments: 28 });
  body.translate(0, 0, -depth / 2);
  const bins = new G.PartBin();
  bins.add(paint(p.color || '#F1F1EE'), body);
  const zS = depth / 2 + bt;              // the flat side panel (shape outline) sits here
  // windscreen and cab side windows (slightly proud)
  const ws = new THREE.BufferGeometry();
  const nrm = new THREE.Vector2(0.88, 0.5).normalize().multiplyScalar(0.062);   // bevelSize 0.05 pushes the outer walls out
  const q = [[1.58, 2.22, -0.84], [1.58, 2.22, 0.84], [1.98, 1.52, 0.88], [1.98, 1.52, -0.88]].map(([x, y, z]) => V3(x + nrm.x, y + nrm.y, z));
  ws.setFromPoints([q[0], q[1], q[2], q[0], q[2], q[3]]); ws.computeVertexNormals();
  ws.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(12), 2));
  bins.add(glass(), ws);
  const win = new THREE.Shape();
  win.moveTo(0.98, 1.52); win.lineTo(0.98, 2.2); win.lineTo(1.43, 2.2); win.quadraticCurveTo(1.5, 2.19, 1.53, 2.12); win.lineTo(1.9, 1.55); win.lineTo(1.9, 1.52);
  for (const s of [1, -1]) {
    const g = new THREE.ShapeGeometry(win, 12); g.translate(0, 0, 0);
    if (s < 0) { g.scale(1, 1, -1); }
    g.translate(0, 0, s * (zS + 0.004));
    bins.add(glass(), g);
  }
  // door seams, handle, mirror, bumpers, lights
  const seam = (x0, y0, x1, y1) => { const g = G.flatBar(V3(x0, y0, zS + 0.002), V3(x1, y1, zS + 0.002), 0.008, 0.004, V3(0, 0, 1)); bins.add(darkPlastic(), g); };
  seam(0.93, 0.6, 0.93, 2.33); seam(-0.62, 0.6, -0.62, 2.33);
  const hb = G.roundedBox(0.2, 0.035, 0.03, 0.01); hb.translate(0.72, 1.32, zS + 0.012); bins.add(darkPlastic(), hb);
  const mirror = G.roundedBox(0.1, 0.24, 0.16, 0.025); mirror.translate(1.92, 1.66, zS + 0.12); bins.add(darkPlastic(), mirror);
  const stalk = G.roundedBox(0.06, 0.04, 0.14, 0.01); stalk.translate(1.93, 1.6, zS + 0.05); bins.add(darkPlastic(), stalk);
  const fb = G.roundedBox(0.2, 0.26, W + 0.04, 0.05); fb.translate(2.66, 0.55, 0); bins.add(darkPlastic(), fb);
  const rb = G.roundedBox(0.16, 0.22, W + 0.02, 0.04); rb.translate(-2.62, 0.53, 0); bins.add(darkPlastic(), rb);
  const sill = G.roundedBox(5.1, 0.12, W - 0.1, 0.02); sill.translate(0, 0.36, 0); bins.add(darkPlastic(), sill);
  for (const z of [0.66, -0.66]) { const lb = G.roundedBox(0.06, 0.15, 0.4, 0.03); lb.translate(2.705, 1.02, z); bins.add(lens(), lb); }
  const grille = G.roundedBox(0.05, 0.26, 0.86, 0.03); grille.translate(2.715, 0.86, 0); bins.add(darkPlastic(), grille);
  // wheel wells: dark liners following the arch, so the cut never shows the backdrop
  for (const x of [fw, rw]) {
    const liner = G.surface((u, v, t) => { const a = a0 + (Math.PI - 2 * a0) * u; t.set(x + (ar - 0.012) * Math.cos(a), wy + (ar - 0.012) * Math.sin(a), -W / 2 + 0.03 + (W - 0.06) * v); }, 24, 2);
    bins.add(cached('liner', () => new THREE.MeshStandardMaterial({ color: '#1A1B1C', roughness: 0.9, side: THREE.DoubleSide })), liner);
  }
  const g = new THREE.Group(); g.name = 'bestelbus';
  bins.build(g);
  // wheels
  const tyre = cached('tyreM', () => new THREE.MeshPhysicalMaterial({ color: '#141516', roughness: 0.86, specularIntensity: 0.3, name: 'tyre' }));
  const rim = M.aluminium({ tone: '#8F9499', roughness: 0.35 });
  const tprof = []; const R = 0.36, TW = 0.22;
  for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + Math.PI * i / 16; tprof.push([0.22 + (R - 0.22) * 0.55 + Math.cos(a) * (R - 0.22) * 0.45 + 0.0, Math.sin(a) * TW / 2]); }
  const tg = G.lathe([[0.215, -TW / 2], ...tprof.map(([r, y]) => [Math.max(r, 0.22), y]), [0.215, TW / 2]], 64);
  for (const x of [fw, rw]) for (const s of [1, -1]) {
    const t = tg.clone(); t.rotateX(Math.PI / 2); t.translate(x, wy, s * (W / 2 - 0.13));
    g.add(G.mesh(t, tyre));
    const rg = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 40); rg.rotateX(Math.PI / 2); rg.translate(x, wy, s * (W / 2 - 0.05));
    g.add(G.mesh(rg, rim));
    const hub = new THREE.CylinderGeometry(0.07, 0.07, 0.07, 24); hub.rotateX(Math.PI / 2); hub.translate(x, wy, s * (W / 2 - 0.03));
    g.add(G.mesh(hub, darkPlastic()));
  }
  // printed wrap on the +Z side: brand plinth band + luifel lock-up (artwork in metres on a canvas of the side box)
  if (p.wrap) {
    const x0 = -2.66, x1 = 2.67, y0 = 0.3, y1 = 2.43;
    const tex = artCanvas({ w: x1 - x0, h: y1 - y0, px: 4096, draw: (cg, s) => {
      const Y = (y) => (y1 - y);                                   // metres from the top of the canvas
      if (p.wrap.band) { cg.fillStyle = p.wrap.band.color; cg.fillRect(0, Y(p.wrap.band.top) * s, (x1 - x0) * s, (p.wrap.band.top - p.wrap.band.bottom) * s); }
      for (const a of p.wrap.art || []) drawArt(cg, s, a, a.x - x0, Y(a.top), a.width);
    } });
    const dg = new THREE.ShapeGeometry(sh, 24);
    const pos = dg.attributes.position, uv = dg.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) - y0) / (y1 - y0));
    dg.translate(0, 0, zS + 0.0025);
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, transparent: false, alphaTest: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, name: 'wrap' });
    g.add(G.mesh(dg, mat));
  }
  return { object: g, meta: { L: 5.32, W, H: 2.42 }, detail: { target: [0, 1.2, 1], size: 3, azimuth: -30, elevation: 8 } };
}

// ------------------------------------------------------------------------------------------- carton + bag
function kraft() {
  return cached('kraft', () => {
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const g = c.getContext('2d'); g.fillStyle = '#B88B5C'; g.fillRect(0, 0, 1024, 1024);
    const r = rng(41);
    for (let i = 0; i < 26000; i++) {     // short fibres + mottling
      const x = r() * 1024, y = r() * 1024, l = 2 + r() * 9, a = r() * Math.PI;
      const v = r(); g.strokeStyle = v < 0.5 ? `rgba(120,82,45,${0.05 + r() * 0.08})` : `rgba(222,186,140,${0.05 + r() * 0.08})`;
      g.lineWidth = 0.6 + r() * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 2.2);
    return t;
  });
}
function decal(group, tex, w, h, pos, rotY = 0, rotX = 0, rough = 0.85) {
  const g = new THREE.PlaneGeometry(w, h);
  if (rotX) g.rotateX(rotX);
  if (rotY) g.rotateY(rotY);
  g.translate(...pos);
  group.add(G.mesh(g, new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: 0.5, roughness: rough, name: 'print' }), { cast: false }));
}
export function verpakking(p = {}) {
  const g = new THREE.Group(); g.name = 'verpakking';
  const L = 0.64, H = 0.44, D = 0.44;
  const box = G.roundedBox(L, H, D, 0.006);
  // uv in metres for the kraft texture: planar per dominant axis
  const pos = box.attributes.position, nor = box.attributes.normal, uv = box.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (nx > 0.6) uv.setXY(i, z, y); else if (ny > 0.6) uv.setXY(i, x, z); else uv.setXY(i, x, y);
  }
  box.translate(0, H / 2, 0);
  const km = new THREE.MeshPhysicalMaterial({ map: kraft(), roughness: 0.9, specularIntensity: 0.25, name: 'kraft' });
  g.add(G.mesh(box, km));
  // flap seam on top
  const seam = G.roundedBox(L - 0.01, 0.002, 0.004, 0.0008); seam.translate(0, H + 0.001, 0);
  g.add(G.mesh(seam, cached('seamM', () => new THREE.MeshStandardMaterial({ color: '#5E4128', roughness: 0.9 }))));
  // branded paper tape over the seam, down both short sides
  if (p.tape) {
    const tw = 0.075;
    const tex = artCanvas({ w: 1.2, h: tw, px: 4096, draw: (cg, s) => {
      cg.fillStyle = p.tape.color; cg.fillRect(0, 0, 1.2 * s, tw * s);
      for (let x = 0.03; x < 1.2; x += p.tape.art.width + 0.07) drawArt(cg, s, p.tape.art, x, (tw - p.tape.art.width * p.tape.art.vb[1] / p.tape.art.vb[0]) / 2, p.tape.art.width);
    } });
    const tm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, name: 'tape' });
    const top = new THREE.PlaneGeometry(L + 0.002, tw); top.rotateX(-Math.PI / 2); top.translate(0, H + 0.0025, 0);
    const uvt = top.attributes.uv; for (let i = 0; i < uvt.count; i++) uvt.setX(i, uvt.getX(i) * (L / 1.2));
    g.add(G.mesh(top, tm, { cast: false }));
    for (const s of [1, -1]) {
      const sd = new THREE.PlaneGeometry(0.12, tw); sd.rotateZ(Math.PI / 2); sd.rotateY(s * Math.PI / 2); sd.translate(s * (L / 2 + 0.0025), H - 0.06, 0);
      g.add(G.mesh(sd, tm, { cast: false }));
    }
  }
  // one-colour flexo print: luifel lock-up on the long side, the mark on the short side
  if (p.side) {
    const a = p.side; const h = a.width * a.vb[1] / a.vb[0];
    const tex = artCanvas({ w: a.width, h, px: 2048, draw: (cg, s) => drawArt(cg, s, a, 0, 0, a.width) });
    decal(g, tex, a.width, h, [0, H * 0.52, D / 2 + 0.0015]);
  }
  if (p.end) {
    const a = p.end; const h = a.width * a.vb[1] / a.vb[0];
    const tex = artCanvas({ w: a.width, h, px: 1024, draw: (cg, s) => drawArt(cg, s, a, 0, 0, a.width) });
    decal(g, tex, a.width, h, [L / 2 + 0.0015, H * 0.5, 0], Math.PI / 2);
  }
  // shipping label on top (black on white: thermal printer)
  if (p.label) {
    const lw = 0.1, lh = 0.15;
    const tex = artCanvas({ w: lw, h: lh, px: 600, draw: (cg, s, c) => {
      cg.fillStyle = '#FBFBF8'; cg.fillRect(0, 0, c.width, c.height);
      cg.fillStyle = '#111'; const m = 0.006 * s;
      drawArt(cg, s, p.label.art, 0.008, 0.008, 0.015);
      for (let i = 0; i < 4; i++) cg.fillRect(0.03 * s, (0.01 + i * 0.006) * s, (0.05 - i * 0.008) * s, 0.0028 * s);
      cg.fillRect(m, 0.04 * s, c.width - 2 * m, 0.0012 * s);
      for (let i = 0; i < 5; i++) cg.fillRect(0.008 * s, (0.05 + i * 0.008) * s, (0.07 - (i % 2) * 0.02) * s, 0.0032 * s);
      const r = rng(7); let x = 0.008;
      while (x < lw - 0.01) { const bw = (0.0006 + r() * 0.0018); cg.fillRect(x * s, 0.105 * s, bw * s, 0.034 * s); x += bw + 0.0006 + r() * 0.0014; }
    } });
    const lg = new THREE.PlaneGeometry(lw, lh); lg.rotateX(-Math.PI / 2); lg.rotateY(-0.12); lg.translate(-0.15, H + 0.003, 0.04);
    g.add(G.mesh(lg, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, name: 'label' }), { cast: false }));
  }
  // tent carry bag lying in front
  if (p.bag) {
    const bL = 1.42, bH = 0.27, bD = 0.3;
    const bag = G.roundedBox(bL, bH, bD, 0.1, 6); bag.translate(0, bH / 2, 0);
    const bp = bag.attributes.position;
    for (let i = 0; i < bp.count; i++) {        // soft, slightly slumped bag
      const x = bp.getX(i), y = bp.getY(i);
      bp.setY(i, y * (1 - 0.08 * Math.pow(Math.abs(x) / (bL / 2), 4)));
    }
    bag.computeVertexNormals();
    const bg = new THREE.Group();
    bg.add(G.mesh(bag, M.polyCloth('#1D1E20', { satin: 0.2 })));
    const a = p.bag.art; const h = a.width * a.vb[1] / a.vb[0];
    const tex = artCanvas({ w: a.width, h, px: 2048, draw: (cg, s) => drawArt(cg, s, a, 0, 0, a.width) });
    decal(bg, tex, a.width, h, [0.05, bH * 0.5, bD / 2 + 0.002], 0, 0, 0.6);
    bg.position.set(...(p.bag.position || [-0.78, 0, -0.42])); bg.rotation.y = p.bag.rotationY ?? 0.22;
    g.add(bg);
  }
  return { object: g, meta: { L, H, D }, detail: { target: [0, 0.3, 0.2], size: 0.8, azimuth: 30, elevation: 20 } };
}
