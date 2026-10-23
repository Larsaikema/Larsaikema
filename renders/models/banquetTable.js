// Folding tables with a board top (furniture group, round 4): bankettafel (hout), klaptafel-hout
// vormen, conferentietafel and examentafel. Called from klaptafel.js whenever the spec names a
// board top (`top`); the blow-moulded HDPE klaptafel stays in klaptafel.js.
//
// { shape, length, width, diameter, height, top, frame, folded }
//   shape  'rechthoek' (default) | 'rond' | 'halfrond' | 'kwartrond' | 'ovaal' | 'vierkant'
//          rond / halfrond: `diameter` (1.53 default); kwartrond: outer radius `length` (1.52) and
//          depth `width` (0.76): a quarter annulus, four make a ring; ovaal: 2.43 x 1.22 ellipse;
//          vierkant: 1.4 x 1.4.
//   top    'hout' (multiplex 18 mm, birch face under a clear wear layer, plies on the edge) |
//          'berken' / '#D9B98C' (birch-decor melamine on chipboard, ABS edge in tone) |
//          'wit' | 'lichtgrijs' | colour / #hex (melamine 25 mm with ABS edge band)
//   frame  'u' (default: folding U leg frames, black powder coat, braces with locking rings) |
//          't' (conferentietafel: two folding T legs at the ends: foot bar with glides, column, top bar)
//   frameColor  powder coat colour of the frames (default zwart) | 'chroom' (chromed)
//   folded true: legs folded flat under the top, the table stood on its long edge, underside to the camera
//   count  > 1 (kwartrond): that many quarter rounds round one centre, `diameter` = ring (tableSets.js)
// Construction: the board outline is filleted (3 cm corners) and inset; the edge is one swept band with
// radiused arrises, the faces a flat plate; leg frames hinge in pressed brackets screwed to the underside.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';
import * as TX from '../js/textures.js';
import { tableRing } from './tableSets.js'; // round 5: `count` quarter rounds as a ring

const { V3 } = G;
const DEG = Math.PI / 180;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

// ------------------------------------------------------------------ outlines (x, z) in metres
function arc(cx, cz, r, a0, a1, n) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } return o; }
// round the sharp corners of a closed polygon (start the polyline mid-way along the first edge)
function filletClosed(poly, r) {
  const n = poly.length;
  const mid = [(poly[0][0] + poly[1][0]) / 2, (poly[0][1] + poly[1][1]) / 2];
  const open = [mid]; for (let i = 1; i <= n; i++) open.push(poly[i % n]); open.push(mid);
  const out = F.filletPath(open.map(([x, z]) => V3(x, 0, z)), r, 6).map((v) => [v.x, v.z]);
  out.pop();
  // drop near-duplicates
  const clean = [out[0]];
  for (const q of out.slice(1)) { const l = clean[clean.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 1e-4) clean.push(q); }
  return clean;
}
function outlineFor(shape, d) {
  const rc = 0.03;
  if (shape === 'rond') return arc(0, 0, d.D / 2, 0, -2 * Math.PI, 180).slice(0, -1);
  if (shape === 'ovaal') { const o = []; for (let i = 0; i < 200; i++) { const a = -(i / 200) * 2 * Math.PI; o.push([(d.L / 2) * Math.cos(a), (d.W / 2) * Math.sin(a)]); } return o; }
  if (shape === 'halfrond') {
    // straight edge at the back (-z), the curve towards the camera; bbox centred on the origin
    const R = d.D / 2, z0 = -R / 2;
    const pts = [[-R, z0], [R, z0], ...arc(0, z0, R, 0, Math.PI, 90).slice(1, -1)];
    return filletClosed(pts.reverse(), rc);
  }
  if (shape === 'kwartrond') {
    const R1 = d.L, R0 = d.L - d.W;
    // annulus centre behind-left, the outer arc bows towards the hero camera
    const c = [-R1 * 0.5, -R1 * 0.5];
    const pts = [...arc(c[0], c[1], R1, 0, Math.PI / 2, 60), ...arc(c[0], c[1], R0, Math.PI / 2, 0, 40)];
    return filletClosed(pts.reverse(), rc);
  }
  // rechthoek / vierkant
  return F.rectPath(d.L, d.W, shape === 'vierkant' ? 0.03 : 0.025, 0, 6).map((v) => [v.x, v.z]);
}
const signedArea = (o) => { let a = 0; for (let i = 0; i < o.length; i++) { const p = o[i], q = o[(i + 1) % o.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
function inset(o, e) {
  const s = signedArea(o) > 0 ? 1 : -1, n = o.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = o[(i - 1 + n) % n], c = o[i], q = o[(i + 1) % n];
    let tx = q[0] - p[0], tz = q[1] - p[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    // left normal (-tz, tx) points inwards on a positive-area loop
    out.push([c[0] - s * tz * e, c[1] + s * tx * e]);
  }
  return out;
}

// ------------------------------------------------------------------ board (top at y = 0)
function board(o, T, { re = 0.003 } = {}) {
  const e = re + 0.003;
  const inner = inset(o, e);
  const path = inner.map(([x, z]) => V3(x, -T / 2, z));
  const band = F.sweep(path, G.roundedRectProfile(T, 2 * e, re, 4), { closed: true });
  // edge uv: u along the edge (m), v across the thickness (0 bottom .. 1 top)
  { const p = band.attributes.position, uv = band.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getY(i), (p.getY(i) + T) / T); }
  const plate = inset(o, e + 0.0015);
  const shape = new THREE.Shape(plate.map(([x, z]) => new THREE.Vector2(x, -z)));
  const faces = new THREE.ExtrudeGeometry(shape, { depth: T - 0.0002, bevelEnabled: false, curveSegments: 4 });
  faces.rotateX(-Math.PI / 2).translate(0, -T + 0.0001, 0);
  return { faces, band };
}

// ------------------------------------------------------------------ materials
function topMats(top) {
  const t = String(top || 'hout').toLowerCase();
  if (t === 'hout' || t === 'multiplex') {
    return { face: U.birchPly({ clean: true, seed: 7 }), edge: M.birchEdge(), T: 0.018, kind: 'hout' };
  }
  if (t === 'berken' || t === '#d9b98c' || t === 'birch') {
    // birch-decor melamine: the birch print, flatter and a touch warmer, ABS edge in tone
    const face = cached('melBirch', () => { const m = U.birchPly({ clean: true, seed: 11 }).clone(); m.clearcoat = 0.12; m.roughness = 0.55; m.color = new THREE.Color(1.0, 0.97, 0.92); m.name = 'melamine birch decor'; m.userData = { ...U.birchPly({ clean: true, seed: 11 }).userData }; return m; });
    const edge = cached('absBirch', () => new THREE.MeshPhysicalMaterial({ color: '#D2B48A', roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.3, name: 'ABS edge birch' }));
    return { face, edge, T: 0.025, kind: 'melamine' };
  }
  const hex = t === 'wit' ? '#EEEDE8' : t === 'lichtgrijs' ? '#B2B4B1' : M.resolveColor(top, '#EEEDE8'); // round 7: lichtgrijs darker (RAL 7035 look; #C9CAC6 printed as white)
  const face = cached(`mel:${hex}`, () => {
    const nm = TXstipple();
    return new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.46, specularIntensity: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.35, normalMap: nm, normalScale: new THREE.Vector2(0.08, 0.08), name: `melamine ${hex}` });
  });
  const edge = cached(`abs:${hex}`, () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex).multiplyScalar(0.96), roughness: 0.36, clearcoat: 0.3, clearcoatRoughness: 0.25, name: `ABS edge ${hex}` }));
  return { face, edge, T: 0.025, kind: 'melamine', hex };
}
function TXstipple() {
  return cached('melStipple', () => { const n = TX.stippleNormal({ size: 256, strength: 0.7, scale: 60, seed: 57 }).clone(); n.repeat.set(1 / 0.03, 1 / 0.03); n.needsUpdate = true; return n; });
}

// ------------------------------------------------------------------ folding U leg frame
// c: axle centre (top frame), a: unit along the axle, w: unit towards the table centre (fold side),
// half: half axle length, legLen: axle to floor (standing). Folded: legs lie along +w.
function uFrame(bins, mats, { c, a, w, half, legLen, folded = false, reach = 0.4 }) {
  const r = 0.0127;
  const down = folded ? w.clone() : V3(0, -1, 0);
  const P = (s, t) => c.clone().addScaledVector(a, s * (half - 0.03)).addScaledVector(down, t);
  // axle between the brackets
  bins.add(mats.steel, G.tube(c.clone().addScaledVector(a, -half), c.clone().addScaledVector(a, half), 0.008, 12));
  for (const s of [-1, 1]) {
    // pressed hinge bracket screwed to the underside
    const bc = c.clone().addScaledVector(a, s * (half - 0.012)).add(V3(0, 0.01, 0));
    bins.add(mats.steel, G.roundedBox(0.004, 0.032, 0.05, 0.0015).applyMatrix4(F.basis(bc, a, V3(0, 1, 0))));
    bins.add(mats.steel, G.roundedBox(0.03, 0.004, 0.06, 0.0015).applyMatrix4(F.basis(bc.clone().add(V3(0, 0.004, 0)).addScaledVector(a, s * 0.016), a, V3(0, 1, 0))));
    // leg
    bins.add(mats.steel, G.tube(P(s, 0), P(s, legLen - 0.008), r, 18));
    const f = P(s, legLen);
    bins.add(mats.cap, F.latheAt([[0.0001, 0], [r + 0.003, 0], [r + 0.0035, 0.004], [r + 0.0025, 0.03], [0.0001, 0.03]], f, down.clone().negate(), 18));
  }
  bins.add(mats.steel, G.tube(P(-1, legLen - 0.12), P(1, legLen - 0.12), 0.0095, 14));
  // braces: from the legs (42 % down) to brackets under the top towards the centre; knee + ring
  for (const s of [-1, 1]) {
    const A = P(s, legLen * 0.42).addScaledVector(a, -s * 0.004);
    const B = c.clone().addScaledVector(a, s * (half - 0.05)).addScaledVector(w, folded ? legLen * 0.42 + 0.3 : reach).add(V3(0, 0.006, 0));
    const K = A.clone().lerp(B, 0.5);
    bins.add(mats.steel, G.flatBar(A, K, 0.02, 0.004, a));
    bins.add(mats.steel, G.flatBar(K, B, 0.02, 0.004, a));
    bins.add(mats.chrome, F.latheAt([[0.0001, -0.005], [0.006, -0.005], [0.006, 0.005], [0.0001, 0.005]], K, a, 12));
    const dirB = B.clone().sub(A).normalize();
    const ring = new THREE.TorusGeometry(0.013, 0.0035, 8, 20).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dirB));
    const rc = K.clone().addScaledVector(dirB, 0.03); ring.translate(rc.x, rc.y, rc.z);
    bins.add(mats.steel, ring);
    bins.add(mats.steel, G.roundedBox(0.03, 0.006, 0.04, 0.0015).applyMatrix4(F.basis(B.clone().add(V3(0, 0.006, 0)), a, V3(0, 1, 0))));
  }
}
// T leg (conferentietafel), standing at x across z (depth D), top bar under the board at yU
function tLeg(bins, mats, { x, D, yU, inward }) {
  const yb = yU - 0.03;
  bins.add(mats.steel, G.prism(G.roundedRectProfile(0.05, 0.03, 0.005, 3), V3(x, yb, -D / 2 + 0.04), V3(x, yb, D / 2 - 0.04), { side: V3(1, 0, 0) }));
  bins.add(mats.steel, G.roundedBox(0.09, 0.006, 0.22, 0.002).translate(x + inward * 0.02, yU - 0.012, 0));
  bins.add(mats.steel, G.tube(V3(x + inward * 0.05, yU - 0.018, -0.09), V3(x + inward * 0.05, yU - 0.018, 0.09), 0.006, 12));
  bins.add(mats.steel, G.prism(G.roundedRectProfile(0.04, 0.08, 0.006, 3), V3(x, 0.05, 0), V3(x, yb - 0.015, 0), { side: V3(1, 0, 0) }));
  // foot bar (oval 70 x 30) with end caps and two levelling glides
  const Df = D - 0.04;
  bins.add(mats.steel, G.prism(G.roundedRectProfile(0.07, 0.03, 0.012, 4), V3(x, 0.027, -Df / 2), V3(x, 0.027, Df / 2), { side: V3(1, 0, 0) }));
  for (const s of [-1, 1]) {
    bins.add(mats.cap, G.roundedBox(0.072, 0.032, 0.014, 0.006).translate(x, 0.027, s * (Df / 2 + 0.005)));
    bins.add(mats.cap, G.lathe([[0.0001, 0], [0.016, 0], [0.017, 0.004], [0.014, 0.012], [0.0001, 0.012]], 20).translate(x, 0, s * (Df / 2 - 0.05)));
  }
}

export function banquetTable(p = {}) {
  if (Number(p.count) > 1) return tableRing(p);
  const shapeIn = String(p.shape || 'rechthoek').toLowerCase();
  const shape = shapeIn.startsWith('rond') ? 'rond' : shapeIn.startsWith('half') ? 'halfrond' : shapeIn.startsWith('kwart') ? 'kwartrond'
    : shapeIn.startsWith('ova') ? 'ovaal' : shapeIn.startsWith('vier') ? 'vierkant' : 'rechthoek';
  const num = (v, d, big = 5) => { let x = Number(v ?? d); if (x > big) x /= 100; return x; };
  let L = num(p.length, 1.83, 10), W = num(p.width, 0.76), H = num(p.height, 0.74), D = num(p.diameter, 1.53);
  if (shape === 'ovaal') { L = num(p.length, 2.43, 10); W = num(p.width, 1.22); }
  if (shape === 'vierkant') { L = num(p.length, 1.4, 10); W = L; }
  if (shape === 'kwartrond') { L = num(p.length, 1.52, 10); W = num(p.width, 0.76); }
  const tm = topMats(p.top);
  const T = tm.T;
  const folded = !!p.folded;
  const frameKind = String(p.frame || 'u').toLowerCase();
  // frameColor (round 5): powder coat colour of the leg frames, or 'chroom' (verchroomd T-onderstel)
  const fcol = String(p.frameColor || (['u', 't', ''].includes(frameKind) ? 'zwart' : frameKind)).toLowerCase();
  const chromed = fcol === 'chroom' || fcol === 'chrome' || fcol === 'verchroomd';
  const mats = { steel: chromed ? M.chrome() : F.powder(fcol), cap: F.plastic('#1A1A1A', 0.6), chrome: M.chrome() };
  const o = outlineFor(shape, { L, W, D });
  const bins = new G.PartBin();
  const { faces, band } = board(o, T);
  if (tm.kind === 'hout' || tm.face.name.includes('birch')) U.planarUV(faces, { rot: 0.0 });
  else { const pp = faces.attributes.position, uv = faces.attributes.uv; for (let i = 0; i < pp.count; i++) uv.setXY(i, pp.getX(i), pp.getZ(i)); }
  bins.add(tm.face, faces); bins.add(tm.edge, band);
  // ---------------- frame, in the top's frame (underside at y = -T)
  const yA = -T - 0.016;                  // axle height below the top face
  const legLen = H - T - 0.016;           // axle to floor
  const frames = [];
  if (frameKind === 't') {
    // T legs are built standing on the floor (world frame), then moved into the top's frame
    const tb = new G.PartBin();
    for (const s of [-1, 1]) tLeg(tb, mats, { x: s * (L / 2 - 0.09), D: W, yU: H - T, inward: -s });
    for (const [m, list] of tb.bins) for (const g of list) bins.add(m, g.translate(0, -H, 0));
  } else if (shape === 'rechthoek' || shape === 'vierkant') {
    const lx = L / 2 - (shape === 'vierkant' ? 0.2 : 0.14), half = W / 2 - 0.07;
    for (const s of [-1, 1]) frames.push({ c: V3(s * lx, yA, 0), a: V3(0, 0, 1), w: V3(-s, 0, 0), half, reach: Math.min(0.4, lx - 0.06) });
  } else if (shape === 'rond') {
    const lx = D / 2 - 0.42;
    for (const s of [-1, 1]) frames.push({ c: V3(s * lx, yA, 0), a: V3(0, 0, 1), w: V3(-s, 0, 0), half: 0.27, reach: Math.min(0.4, lx - 0.06) });
  } else if (shape === 'ovaal') {
    const lx = L / 2 - 0.45, half = (W / 2) * Math.sqrt(1 - (lx / (L / 2)) ** 2) - 0.1;
    for (const s of [-1, 1]) frames.push({ c: V3(s * lx, yA, 0), a: V3(0, 0, 1), w: V3(-s, 0, 0), half });
  } else if (shape === 'halfrond') {
    const R = D / 2, z0 = -R / 2;
    frames.push({ c: V3(0, yA, z0 + 0.13), a: V3(1, 0, 0), w: V3(0, 0, 1), half: R - 0.22, reach: 0.18 });
    const zf = z0 + 0.56, half = Math.sqrt(R * R - 0.56 * 0.56) - 0.14;
    frames.push({ c: V3(0, yA, zf), a: V3(1, 0, 0), w: V3(0, 0, -1), half, reach: 0.18 });
  } else if (shape === 'kwartrond') {
    const R1 = L, R0 = L - W, c = [-R1 * 0.5, -R1 * 0.5], rm = (R0 + R1) / 2;
    for (const [ang, sgn] of [[14, 1], [76, -1]]) {
      const t = ang * DEG;
      const rad = V3(Math.cos(t), 0, Math.sin(t)), tan = V3(-Math.sin(t), 0, Math.cos(t)).multiplyScalar(sgn);
      frames.push({ c: V3(c[0] + rad.x * rm, yA, c[1] + rad.z * rm), a: rad, w: tan, half: W / 2 - 0.08 });
    }
  }
  for (const f of frames) uFrame(bins, mats, { ...f, legLen, folded });
  const top = new THREE.Group();
  bins.build(top);
  const group = new THREE.Group(); group.name = `banquetTable ${shape} ${p.top || 'hout'}${folded ? ' folded' : ''}`;
  if (!folded) { top.position.y = H; group.add(top); }
  else {
    const pivot = new THREE.Group(); pivot.add(top); pivot.rotation.x = -Math.PI / 2; group.add(pivot);
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    pivot.position.y = -box.min.y; pivot.position.z = -(box.min.z + box.max.z) / 2;
  }
  const white = tm.hex && new THREE.Color(tm.hex).getHSL({}).l > 0.85;
  return {
    object: group,
    detail: folded ? { target: [L / 2 - 0.25, W / 2, 0.05], size: 0.5, azimuth: 30, elevation: 10 }
      : { target: [shape === 'rechthoek' ? L / 2 - 0.12 : 0.3, H - 0.1, 0.3], size: 0.45, azimuth: 40, elevation: 14 },
    meta: { shape, L, W, D, H, top: p.top, frame: frameKind, frameColor: fcol, folded },
    // round 7: the single kwartrond hero is a high bird's-eye view (its alt text: "opgezet, van boven gezien"):
    // the quarter-ring top reads as a shape, the legs still show it stands
    view: shape === 'kwartrond' && !folded ? { hero: { elevation: 58, azimuth: 24 } }
      : shape === 'halfrond' || shape === 'rond' || shape === 'ovaal' || shape === 'vierkant'
      ? { hero: { elevation: 22 } } : undefined,
    rig: (() => {
      const big = shape !== 'rechthoek' || L > 1.5;
      // chrome T legs stay in the default (bright room) environment: their columns and foot bars are
      // flat-faced, and in the dark studio map (barStool chroom) those faces mirror the black surround and
      // read as gunmetal
      const r = S.seatRig(group, { default: big && !folded
        ? { groundAO: { maxZenith: 50, strength: 0.5, blur: 4.5 }, shadowFloor: 0.76, keyShadow: 0.3, contact: { strength: 0.5 } }
        : { groundAO: { maxZenith: 55, blur: 3.0 }, shadowFloor: 0.72 } });
      if (white) r.default.exposure = Math.max(r.default.exposure, 0.8);
      if (tm.kind === 'hout' || (p.top && String(p.top).toLowerCase().includes('berk')) || String(p.top).toLowerCase() === '#d9b98c') r.default.exposure = Math.max(r.default.exposure, 0.8);
      return r;
    })(),
  };
}
