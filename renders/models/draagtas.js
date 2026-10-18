// Draagtas / wieltas / beschermhoes / opbergtas (soft bags for folded tents).
//
// { height, color, wheels, logo, shape }
//   shape 'upright' (default): bag for a folded easy-up standing on its end
//     wheels true  -> wieltas: 600D polyester body on a moulded base tray with two wheels in
//                     wheel wells at the back corners (tyre, spoked hub, axle cap, fender),
//                     two moulded feet at the front; U-zip round the front panel, piping on the
//                     four vertical seams and round the top panel, a binding band where the
//                     cloth meets the tray, padded top handle, two side carry handles with
//                     box-X stitched patches; `logo` -> KLAPKLAAR printed up the front panel.
//     wheels false -> beschermhoes: lighter 420D cover slid over the folded frame: the corner
//                     legs hold the corners, loose cloth falls in long drape folds, the top
//                     drapes over the corner brackets, a webbing strap with side-release
//                     buckle cinches the hem (gathered folds above it); legs and foot plates
//                     show below the hem.
//   shape 'duffel': opbergtas for an inflatable tent, lying; a rolled tent inside makes it a
//         soft, rounded body that slumps on the floor; circular-ish end panels with piping,
//         U-zip lid, two carry handles, two compression straps that cinch the body, a moulded
//         wheel end with two wheels, skids and a telescopic trolley handle.
// Cloth: SG.fabric600 (basket weave + yarn macro + dye-tinted sheen), folds from SG.creases,
// rows of raised stitches (SG.stitches), webbing straps, coil zip with sliders and pullers.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// closed polygon [[x, z], ...] with filleted corners (radius per vertex) -> [[x, z], ...]
function fillet(pts, rad, segs = 8) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const r = Array.isArray(rad) ? rad[i] : rad;
    if (!r) { out.push(p); continue; }
    const da = [a[0] - p[0], a[1] - p[1]], db = [b[0] - p[0], b[1] - p[1]];
    const la = Math.hypot(...da), lb = Math.hypot(...db);
    da[0] /= la; da[1] /= la; db[0] /= lb; db[1] /= lb;
    const ang = Math.acos(Math.max(-1, Math.min(1, da[0] * db[0] + da[1] * db[1])));
    const t = r / Math.tan(ang / 2);
    const p1 = [p[0] + da[0] * t, p[1] + da[1] * t], p2 = [p[0] + db[0] * t, p[1] + db[1] * t];
    const bis = [da[0] + db[0], da[1] + db[1]]; const lbis = Math.hypot(...bis); bis[0] /= lbis; bis[1] /= lbis;
    const dc = r / Math.sin(ang / 2);
    const c = [p[0] + bis[0] * dc, p[1] + bis[1] * dc];
    let a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]), a2 = Math.atan2(p2[1] - c[1], p2[0] - c[0]);
    let d = a2 - a1; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    for (let k = 0; k <= segs; k++) { const aa = a1 + d * (k / segs); out.push([c[0] + Math.cos(aa) * r, c[1] + Math.sin(aa) * r]); }
  }
  return out;
}
const shapeOf = (pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));

// wheel with its axle along +X, centred at the origin: tyre, spoked hub, axle cap
function wheel(R, w) {
  const tyre = K.lathe([[R - 0.013, -w / 2 + 0.002], [R - 0.006, -w / 2], [R - 0.0015, -w / 2 + 0.004], [R, -w / 2 + 0.011], [R, w / 2 - 0.011], [R - 0.0015, w / 2 - 0.004], [R - 0.006, w / 2], [R - 0.013, w / 2 - 0.002]], 72);
  const rim = K.lathe([[R - 0.012, w / 2 - 0.002], [R - 0.016, w / 2 - 0.004], [R - 0.017, -w / 2 + 0.004], [R - 0.012, -w / 2 + 0.002]].reverse(), 72);
  const hub = K.lathe([[0.0001, w / 2 - 0.001], [0.013, w / 2 - 0.001], [0.016, w / 2 - 0.006], [0.016, -w / 2 + 0.006], [0.013, -w / 2 + 0.001], [0.0001, -w / 2 + 0.001]].reverse(), 40);
  // web between hub and rim (recessed disc) + 6 spokes standing proud on both faces
  const web = K.lathe([[0.015, 0.003], [R - 0.016, 0.003], [R - 0.016, -0.003], [0.015, -0.003]].reverse(), 48);
  const parts = [rim, hub, web];
  for (let i = 0; i < 6; i++) {
    // lathe axis is Y: spokes lie in the XZ plane, radial along +X then turned about Y
    const a = (i / 6) * TAU + 0.26;
    const sp = G.roundedBox(R - 0.03, w - 0.014, 0.0085, 0.003);
    sp.translate(0.015 + (R - 0.03) / 2, 0, 0); sp.rotateY(a);
    parts.push(sp);
  }
  const hubG = G.merge(parts);
  // lathe axis Y -> X
  for (const g of [tyre, hubG]) g.rotateZ(-Math.PI / 2);
  const cap = K.lathe([[0.0001, 0.006], [0.0085, 0.006], [0.0095, 0.003], [0.0095, 0], [0.0001, 0]], 28); cap.rotateZ(-Math.PI / 2);
  return { tyre, hub: hubG, cap, w };
}

export function draagtas(p = {}) {
  const shape = String(p.shape || 'upright');
  const wheels = p.wheels === true || p.wheels === 'true';
  const color = p.color || 'zwart';
  const hex = M.resolveColor(color, '#1A1B1D');
  const fabHex = color === 'zwart' ? '#19191B' : hex;
  if (shape === 'duffel') return duffel(p, fabHex);
  if (!wheels) return cover(p, fabHex);
  return wheelBag(p, fabHex);
}

// shared bits ---------------------------------------------------------------------------------
function kit(fabHex, { coverCloth = false } = {}) {
  const dark = new THREE.Color(fabHex).getHSL({}).l < 0.2;
  return {
    dark,
    fab: SG.fabric600(fabHex, coverCloth ? { sheen: 0.8, rough: 0.52 } : {}),
    pipe: SG.fabric600(fabHex, { sheen: 0.9, rough: 0.5 }),
    web: M.webbing('#161719'),
    tape: M.webbing('#1B1C1E'),
    coil: SG.moulded('#121314', { rough: 0.32, spec: 0.7, scale: 0.0006 }),
    slider: SG.castSG('#3C3F43', { metal: 1, rough: 0.38 }),
    puller: SG.moulded('#141516', { rough: 0.55, spec: 0.5 }),
    thr: SG.thread(dark ? '#3A3B40' : new THREE.Color(fabHex).multiplyScalar(0.85).getStyle()),
    tray: SG.moulded('#141516', { rough: 0.5, spec: 0.55, scale: 0.0011, bump: 0.00002 }),
    tyre: SG.rubberSG('#141414', { rough: 0.66 }),
    hubM: SG.moulded('#6E7277', { rough: 0.4, spec: 0.55 }),
    zinc: SG.zincSG(),
  };
}

function darkRig(dark, extra = {}) {
  const base = { contact: { strength: 0.85, h0: 0.012, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } };
  if (!dark) return { default: { ...base, ...extra } };
  return { default: { ...base, key: { intensity: 4.2 }, fill: { azimuth: 80, elevation: 14, intensity: 2.0 }, rim: { azimuth: 150, elevation: 32, intensity: 1.8 }, exposure: 1.3, envIntensity: 1.1, ...extra } };
}

// zip along a surface path: two tapes, coil chain, two stitch rows, sliders with pullers
function addZip(bins, k, path, { sliders = [], tapeW = 0.032, flip = false } = {}) {
  const { pts, nrm } = path;
  const pp = SG.resample(pts, 0.004);
  // re-project normals by nearest original sample
  const nn = pp.map((q) => { let bi = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = pts[i].distanceToSquared(q); if (d < bd) { bd = d; bi = i; } } return nrm[bi]; });
  bins.add(k.tape, K.strapAlong(pp, tapeW, 0.0016, { normals: nn }));
  const lift = (o) => pp.map((q, i) => q.clone().addScaledVector(nn[i], o));
  bins.add(k.coil, K.strapAlong(lift(0.0016), 0.0062, 0.0028, { normals: nn }));
  // stitch rows on both tapes
  for (const s of [-1, 1]) {
    const off = pp.map((q, i) => {
      const a = pp[Math.max(0, i - 1)], b = pp[Math.min(pp.length - 1, i + 1)];
      const T = b.clone().sub(a).normalize(); const B = V3().crossVectors(T, nn[i]).normalize();
      return q.clone().addScaledVector(B, s * (tapeW / 2 - 0.004)).addScaledVector(nn[i], 0.0009);
    });
    bins.add(k.thr, SG.stitches(off, nn, { len: 0.0034, gap: 0.0016 }));
  }
  for (const si of sliders) {
    const i = Math.max(1, Math.min(pp.length - 2, Math.round(si * (pp.length - 1))));
    const T = pp[i + 1].clone().sub(pp[i - 1]).normalize(), N = nn[i];
    const B = V3().crossVectors(T, N).normalize();
    const c = pp[i].clone().addScaledVector(N, 0.005);
    const body = G.roundedBox(0.017, 0.0075, 0.03, 0.003); body.applyMatrix4(K.basisAt(c, B, N, T)); bins.add(k.slider, body);
    const bridge = G.roundedBox(0.006, 0.004, 0.014, 0.0015); bridge.applyMatrix4(K.basisAt(c.clone().addScaledVector(N, 0.0045).addScaledVector(T, -0.006), B, N, T)); bins.add(k.slider, bridge);
    // puller: a short metal link + moulded rubber pull hanging along the zip
    const pc = c.clone().addScaledVector(T, -0.03).addScaledVector(N, 0.0035);
    const pull = G.roundedBox(0.012, 0.004, 0.045, 0.0019); pull.applyMatrix4(K.basisAt(pc, B, N, T)); bins.add(k.puller, pull);
    const link = G.roundedBox(0.008, 0.003, 0.012, 0.0013); link.applyMatrix4(K.basisAt(c.clone().addScaledVector(T, -0.012).addScaledVector(N, 0.004), B, N, T)); bins.add(k.slider, link);
  }
}

// webbing handle between two surface points with box-X stitched patches
function addHandle(bins, k, A, B, { h = 0.045, w = 0.038, grip = null, patchL = 0.055 } = {}) {
  const along = B.p.clone().sub(A.p).normalize();
  const n = A.n.clone().add(B.n).normalize();
  const mid = A.p.clone().lerp(B.p, 0.5).addScaledVector(n, h);
  const ctrl = [A.p.clone().addScaledVector(along, -patchL * 0.5).addScaledVector(A.n, 0.0018), A.p.clone().addScaledVector(A.n, 0.0018), A.p.clone().addScaledVector(along, 0.02).addScaledVector(n, h * 0.55), mid, B.p.clone().addScaledVector(along, -0.02).addScaledVector(n, h * 0.55), B.p.clone().addScaledVector(B.n, 0.0018), B.p.clone().addScaledVector(along, patchL * 0.5).addScaledVector(B.n, 0.0018)];
  const pts = K.smoothPath(ctrl, 64);
  bins.add(k.web, K.strapAlong(pts, w, 0.0026, { up: n.clone() }));
  if (grip) bins.add(grip, K.tubeAlong(pts.slice(22, 43), 0.0135, 20));
  for (const e of [A, B]) {
    const side = V3().crossVectors(e.n, along).normalize();
    const c0 = e.p.clone().addScaledVector(e.n, 0.0033);
    const hw = w / 2 - 0.004, hl = patchL / 2 - 0.004;
    const corner = (sx, sz) => c0.clone().addScaledVector(side, sx * hw).addScaledVector(along, sz * hl);
    const box = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, 1)];
    const seq = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
    for (const [i0, i1] of seq) {
      const a = box[i0], b = box[i1];
      const line = []; const nl = [];
      for (let q = 0; q <= 12; q++) { line.push(a.clone().lerp(b, q / 12)); nl.push(e.n); }
      bins.add(k.thr, SG.stitches(line, nl, { len: 0.0032, gap: 0.0014, w: 0.001 }));
    }
  }
}

// piping (cord in a fold of cloth) along a path + one stitch row beside it
function addPiping(bins, k, pts, nrm, { r = 0.0042, stitchOff = 0.008, sideRef = null } = {}) {
  bins.add(k.pipe, K.tubeAlong(pts, r, 12));
  if (stitchOff) {
    const off = pts.map((q, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const T = b.clone().sub(a).normalize();
      let B = V3().crossVectors(T, nrm[i]).normalize();
      if (sideRef && B.dot(sideRef) < 0) B.negate();
      return q.clone().addScaledVector(B, stitchOff).addScaledVector(nrm[i], 0.0004 - r * 0.4);
    });
    bins.add(k.thr, SG.stitches(off, nrm, { len: 0.0036, gap: 0.0016 }));
  }
}

function printMat(tex) {
  return new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.5, specularIntensity: 0.45, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color('#e9e2d6'), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, name: 'bag print' });
}

// ---------------------------------------------------------------------------------------------
// wieltas
function wheelBag(p, fabHex) {
  const k = kit(fabHex);
  const H = Number(p.height ?? 1.7);
  const W = 0.4, D = 0.38;
  const bins = new G.PartBin();
  const extras = [];
  // ---- moulded base tray with wheel wells at the back corners
  const A = W / 2 + 0.012, Bz = D / 2 + 0.012;
  const R = 0.062, ww = 0.038;
  const nw = ww + 0.014, nd = 2 * R + 0.012;
  const yTr0 = 0.014, yTr1 = 0.128, yTop = 0.152;
  const lower = fillet([[-A, Bz], [A, Bz], [A, -Bz + nd], [A - nw, -Bz + nd], [A - nw, -Bz], [-A + nw, -Bz], [-A + nw, -Bz + nd], [-A, -Bz + nd]], [0.05, 0.05, 0.008, 0.006, 0.012, 0.012, 0.006, 0.008]);
  bins.add(k.tray, K.extrudeY(shapeOf(lower), yTr1 - yTr0, { y0: yTr0, bevel: 0.006, bevelSegs: 3, curveSegs: 8 }));
  const upper = fillet([[-A, Bz], [A, Bz], [A, -Bz], [-A, -Bz]], [0.05, 0.05, 0.05, 0.05]);
  bins.add(k.tray, K.extrudeY(shapeOf(upper), yTop - yTr1 + 0.004, { y0: yTr1 - 0.004, bevel: 0.007, bevelSegs: 3, curveSegs: 10 }));
  // moulded rib round the tray just under the rim (catches a highlight line)
  const rib = fillet([[-A - 0.003, Bz + 0.003], [A + 0.003, Bz + 0.003], [A + 0.003, -Bz - 0.003], [-A - 0.003, -Bz - 0.003]], 0.053);
  const ribPts = rib.map(([x, z]) => V3(x, yTr1 - 0.016, z)); ribPts.push(ribPts[0].clone());
  bins.add(k.tray, K.tubeAlong(ribPts.filter((q) => !(q.z < -Bz + nd - 0.004 && Math.abs(q.x) > A - nw - 0.004)), 0.0028, 8));
  // front feet
  for (const sx of [-1, 1]) { const ft = G.roundedBox(0.07, 0.016, 0.045, 0.006); ft.translate(sx * (A - 0.07), 0.008, Bz - 0.045); bins.add(k.tyre, ft); }
  // wheels, fenders, axles
  for (const sx of [-1, 1]) {
    const cx = sx * (A - nw / 2), cz = -Bz + R * 0.92;
    const wh = wheel(R, ww);
    for (const g of [wh.tyre, wh.hub]) g.translate(cx, R, cz);
    bins.add(k.tyre, wh.tyre); bins.add(k.hubM, wh.hub);
    const cap = wh.cap.clone(); if (sx < 0) cap.rotateY(Math.PI); cap.translate(cx + sx * (ww / 2 - 0.0005), R, cz); bins.add(k.zinc, cap);
    // axle stub from the inner well wall
    bins.add(k.zinc, G.tube(V3(cx - sx * (nw / 2 + 0.002), R, cz), V3(cx - sx * (ww / 2 - 0.002), R, cz), 0.0065, 18));
    // fender over the wheel (lathe axis Y -> X), from the front of the well over the top to the back
    const hw = nw / 2;
    const fender = K.lathe([[R + 0.005, -hw], [R + 0.012, -hw], [R + 0.012, hw], [R + 0.005, hw]], 40, -Math.PI - 0.25, Math.PI * 0.95);
    fender.rotateZ(-Math.PI / 2); fender.translate(cx, R, cz); bins.add(k.tray, fender);
  }
  // ---- fabric body
  const y0 = yTop, re = 0.03, r = 0.06;
  const L = H - y0 - re - 0.012;
  const seed = 31;
  const P0 = K.rrFractions(W / 2, D / 2, r).P;
  const crWall = SG.creases(seed, [
    // long soft drape / tension folds
    { n: 34, u: [0, P0], v: [y0 + 0.05, y0 + L - 0.05], ang: Math.PI / 2, angJ: 0.14, len: [0.25, 0.75], wid: [0.03, 0.075], amp: [0.0018, 0.0055], sharp: 0.25 },
    // compression ripples above the tray and under the top
    { n: 40, u: [0, P0], v: [y0 + 0.03, y0 + 0.32], ang: 0, angJ: 0.35, len: [0.05, 0.16], wid: [0.01, 0.022], amp: [0.0016, 0.0045], sharp: 0.55 },
    { n: 20, u: [0, P0], v: [y0 + L - 0.3, y0 + L - 0.02], ang: 0, angJ: 0.5, len: [0.05, 0.14], wid: [0.01, 0.02], amp: [0.001, 0.0028], sharp: 0.55 },
    // the folded scissor arms inside: a few long diagonal ridges
    { n: 8, u: [0, P0], v: [y0 + 0.3, y0 + L - 0.3], ang: Math.PI / 2, angJ: 0.6, len: [0.3, 0.6], wid: [0.05, 0.09], amp: [0.002, 0.004], sharp: 0.1, sign: 1 },
  ], { periodU: P0 });
  const crTop = SG.creases(seed + 5, [{ n: 14, u: [-W / 2, W / 2], v: [-D / 2, D / 2], ang: 0, angJ: 1.6, len: [0.06, 0.18], wid: [0.012, 0.03], amp: [0.001, 0.003], sharp: 0.4 }]);
  const box = SG.softBox({
    W, D, L, r, re, y0, nu: 200, nWall: 230, nEdge: 8, nEnd: 10,
    disp: (q) => {
      if (q.part === 'wall') {
        const t = q.t;
        const bulge = 0.005 * q.face * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.4);
        return bulge + crWall(q.s, q.y) * (0.45 + 0.55 * q.face);
      }
      if (q.part === 'top' || q.part === 'topEdge') {
        // corner brackets push the corners up, the middle dips a little
        const cx = Math.abs(q.x) / (W / 2), cz = Math.abs(q.z) / (D / 2);
        const corner = Math.exp(-((1 - cx) ** 2 + (1 - cz) ** 2) / 0.08);
        return 0.006 * corner - 0.004 * (1 - cx * cx) * (1 - cz * cz) + crTop(q.x, q.z) * (q.part === 'top' ? 1 : 0.4);
      }
      return 0;
    },
  });
  bins.add(k.fab, box.geo);
  const fr = box.frac;
  // piping on the four vertical seams and round the top panel
  for (const fc of [fr.cFR, fr.cBR, fr.cBL, fr.cFL]) {
    const ft = []; for (let i = 0; i <= 120; i++) ft.push([fc, 0.012 + (i / 120) * 0.985]);
    const pth = SG.pathOn(box, ft, 0.002);
    addPiping(bins, k, pth.pts, pth.nrm, { stitchOff: 0 });
  }
  {
    const mT = box.mWall1 + (box.mTop0 - box.mWall1) * 0.55;
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = box.pointM(i / 240, mT, 0.002); pts.push(q.p); nrm.push(q.n); }
    addPiping(bins, k, pts, nrm, { stitchOff: 0.009, sideRef: V3(0, -1, 0) });
  }
  // binding band where the cloth meets the tray (webbing, two stitch rows)
  {
    const tb = (yTop + 0.012 - y0) / L;
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = box.point(i / 240, tb, 0.0016); pts.push(q.p); nrm.push(q.n); }
    bins.add(k.web, K.strapAlong(pts, 0.028, 0.0018, { normals: nrm }));
    for (const dy of [-0.0095, 0.0095]) bins.add(k.thr, SG.stitches(pts.map((q, i) => q.clone().add(V3(0, dy, 0)).addScaledVector(nrm[i], 0.001)), nrm));
  }
  // U zip round the front panel: up the left, across under the top seam, down the right
  {
    const inset = 0.035;
    const fL = 1 - (fr.faW - inset) / fr.P, fR = (fr.faW - inset) / fr.P;
    const tB = 0.05, tT = 0.968;
    const ft = [];
    for (let i = 0; i <= 90; i++) ft.push([fL, tB + (i / 90) * (tT - tB)]);
    for (let i = 1; i <= 24; i++) { const u = i / 24; ft.push([fL + (1 + fR - fL) * u, tT]); }
    for (let i = 1; i <= 90; i++) ft.push([fR, tT - (i / 90) * (tT - tB)]);
    addZip(bins, k, SG.pathOn(box, ft, 0.0012), { sliders: [0.47, 0.53] });
  }
  // top handle: webbing across the top panel with a padded grip
  {
    const a = box.pointM(0.25 * 0 + fr.left, box.mTop0 - 0.02, 0.0015);
    const b = box.pointM(fr.right, box.mTop0 - 0.02, 0.0015);
    addHandle(bins, k, a, b, { h: 0.06, w: 0.04, grip: k.tray, patchL: 0.07 });
  }
  // two carry handles on the right side
  for (const tc of [0.3, 0.64]) {
    addHandle(bins, k, box.point(fr.right, tc - 0.07, 0.0015), box.point(fr.right, tc + 0.07, 0.0015), { h: 0.042, w: 0.038 });
  }
  // lift handle low on the back, above the wheels
  addHandle(bins, k, box.point(fr.back - 0.07, 0.07, 0.0015), box.point(fr.back + 0.07, 0.07, 0.0015), { h: 0.035, w: 0.034 });
  // logo up the front panel
  if (p.logo) {
    const spec = typeof p.logo === 'object' ? p.logo : { svg: typeof p.logo === 'string' && /print-/.test(p.logo) ? p.logo : 'print-wordmark' };
    const { tex, aspect } = K.printTex(spec, { color: spec.color || '#F4EFE6', px: 2048 });
    const len = Math.min(0.56 * L, 0.82), wid = len / aspect;
    const t0 = 0.47 - len / L / 2, t1 = 0.47 + len / L / 2;
    const fw = wid / 2 / fr.P;
    const rows = []; const nu = 120, nv = 10;
    for (let j = 0; j <= nv; j++) {
      const row = []; const f = fw - (2 * fw) * (j / nv);
      for (let i = 0; i <= nu; i++) row.push(box.point(((f % 1) + 1) % 1, t0 + (t1 - t0) * (i / nu), 0.0007).p);
      rows.push(row);
    }
    const g = K.gridGeometry(rows, { closedU: false });
    const uv = g.attributes.uv;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uv.setXY(j * (nu + 1) + i, i / nu, j / nv);
    const m = new THREE.Mesh(g, printMat(tex)); m.castShadow = false; m.receiveShadow = true; extras.push(m);
  }
  const g = K.finish(bins, `wieltas ${H}`, extras);
  // turn a little so the right side (wheel in its well) and the front (zip, logo) both read
  g.rotation.y = -14 * DEG;
  const root = new THREE.Group(); root.add(g);
  const c = Math.cos(-14 * DEG), s = Math.sin(-14 * DEG);
  const wx = A - nw / 2, wz = -Bz + R;
  return {
    object: root,
    // detail: the right wheel in its well, the fender, tray rib and the binding band, from the right-back
    detail: { target: [wx * c + wz * s - 0.03, 0.12, -wx * s + wz * c + 0.04], size: 0.36, azimuth: 108, elevation: 14 },
    view: { hero: { elevation: 12, azimuth: 40 } },
    rig: darkRig(k.dark),
    meta: { shape: 'upright', height: H, wheels: true },
  };
}

// ---------------------------------------------------------------------------------------------
// beschermhoes (cover over the folded frame)
function cover(p, fabHex) {
  const k = kit(fabHex, { coverCloth: true });
  const H = Number(p.height ?? 1.55);
  const W = 0.4, D = 0.38;
  const bins = new G.PartBin();
  // folded frame: four corner legs (black hex inner tubes) on galvanised foot plates
  const legMat = SG.powderSG('#1C1D1F');
  const plate = SG.galvSG({ cell: 0.005 });
  const legIn = 0.04;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = sx * (W / 2 - legIn), z = sz * (D / 2 - legIn);
    bins.add(legMat, G.hexTube(V3(x, 0.004, z), V3(x, 0.2, z), 0.034));
    bins.add(legMat, G.hexTube(V3(x, 0.004, z), V3(x, 0.03, z), 0.044));
    bins.add(plate, G.prism(G.roundedRectProfile(0.12, 0.12, 0.012, 3), V3(x + sx * 0.022, 0, z + sz * 0.022), V3(x + sx * 0.022, 0.005, z + sz * 0.022), { side: V3(1, 0, 0) }));
  }
  // cover body: hem 9 cm above the floor; soft, well rounded top edge over the brackets
  const y0 = 0.09, re = 0.07, r = 0.06;
  const L = H - y0 - re - 0.01;
  const P0 = K.rrFractions(W / 2, D / 2, r).P;
  const fr0 = K.rrFractions(W / 2, D / 2, r);
  const yStrap = y0 + 0.055;
  const cr = SG.creases(17, [
    // deep drape folds hanging between the legs, growing towards the hem
    { n: 16, u: [0, P0], v: [y0 + 0.25, y0 + L - 0.2], ang: Math.PI / 2, angJ: 0.06, len: [0.7, 1.3], wid: [0.05, 0.1], amp: [0.008, 0.016], sharp: 0.35, sign: 1 },
    { n: 20, u: [0, P0], v: [y0 + 0.2, y0 + L - 0.25], ang: Math.PI / 2, angJ: 0.08, len: [0.3, 0.9], wid: [0.025, 0.055], amp: [0.004, 0.009], sharp: 0.5 },
    // diagonal drape from the top corners
    { n: 22, u: [0, P0], v: [y0 + L - 0.45, y0 + L - 0.02], ang: Math.PI / 2, angJ: 0.5, len: [0.15, 0.4], wid: [0.02, 0.045], amp: [0.003, 0.007], sharp: 0.4 },
    // small wrinkles all over (thin cloth)
    { n: 60, u: [0, P0], v: [y0 + 0.1, y0 + L - 0.05], ang: 0, angJ: 0.8, len: [0.04, 0.12], wid: [0.008, 0.018], amp: [0.0008, 0.002], sharp: 0.6 },
    // gathered folds above and below the strap
    { n: 46, u: [0, P0], v: [yStrap - 0.03, yStrap + 0.16], ang: Math.PI / 2, angJ: 0.18, len: [0.06, 0.2], wid: [0.012, 0.026], amp: [0.003, 0.007], sharp: 0.6 },
  ], { periodU: P0 });
  const crTop = SG.creases(23, [{ n: 22, u: [-W / 2, W / 2], v: [-D / 2, D / 2], ang: 0, angJ: 1.6, len: [0.08, 0.22], wid: [0.015, 0.035], amp: [0.002, 0.006], sharp: 0.4 }]);
  const box = SG.softBox({
    W, D, L, r, re, y0, nu: 220, nWall: 240, nEdge: 12, nEnd: 10,
    disp: (q) => {
      if (q.part === 'bot' || q.part === 'botEdge') return 0;
      if (q.part === 'wall') {
        const t = q.t;
        // cloth falls in between the corner legs (taut over the legs), widens to the hem
        const sagIn = -0.016 * q.face * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.02) / 0.96))), 0.5);
        const flare = 0.012 * Math.pow(1 - Math.min(1, t * 3), 2) * (0.4 + 0.6 * q.face);
        // the strap cinches the cloth
        const cinch = -0.012 * Math.exp(-(((q.y - yStrap) / 0.02) ** 2));
        return sagIn + flare + cinch + cr(q.s, q.y) * (0.2 + 0.8 * q.face);
      }
      // top: drapes over the corner brackets of the frame, sags in between
      const cx = Math.abs(q.x) / (W / 2), cz = Math.abs(q.z) / (D / 2);
      const corner = Math.exp(-((1 - cx) ** 2 + (1 - cz) ** 2) / 0.05);
      return 0.012 * corner - 0.018 * (1 - cx * cx) * (1 - cz * cz) + crTop(q.x, q.z) * (q.part === 'top' ? 1 : 0.6);
    },
  });
  // open bottom: drop the bottom panel rows -> rebuild a geometry from wall + top only
  const geo = box.geo;
  {
    // cut away the triangles of the bottom panel and bottom edge (rows below the wall start)
    const idx = geo.index.array; const pos = geo.attributes.position;
    const keep = [];
    for (let i = 0; i < idx.length; i += 3) {
      const ok = [idx[i], idx[i + 1], idx[i + 2]].every((v) => pos.getY(v) >= y0 - 0.0005);
      if (ok) keep.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    geo.setIndex(keep);
  }
  bins.add(k.fab, geo);
  const fr = box.frac;
  // rolled hem (double fold with a stitch row)
  {
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = box.point(i / 240, 0.002, 0.0006); pts.push(q.p); nrm.push(q.n); }
    bins.add(k.fab, K.tubeAlong(pts, 0.0035, 10));
    bins.add(k.thr, SG.stitches(pts.map((q, i) => q.clone().add(V3(0, 0.014, 0)).addScaledVector(nrm[i], 0.0004)), nrm));
  }
  // corner seams (flat-felled: a narrow ridge + two stitch rows)
  for (const fc of [fr.cFR, fr.cBR, fr.cBL, fr.cFL]) {
    const ft = []; for (let i = 0; i <= 120; i++) ft.push([fc, 0.01 + (i / 120) * 0.99]);
    const pth = SG.pathOn(box, ft, 0.0012);
    bins.add(k.pipe, K.tubeAlong(pth.pts, 0.0024, 8));
  }
  {
    const mT = box.mWall1 + (box.mTop0 - box.mWall1) * 0.5;
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = box.pointM(i / 240, mT, 0.0012); pts.push(q.p); nrm.push(q.n); }
    addPiping(bins, k, pts, nrm, { r: 0.0026, stitchOff: 0.007, sideRef: V3(0, -1, 0) });
  }
  // strap with side-release buckle round the bottom
  {
    const tS = (yStrap - y0) / L;
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = box.point(i / 240, tS, 0.0022); pts.push(q.p); nrm.push(q.n); }
    bins.add(k.web, K.strapAlong(pts, 0.025, 0.0022, { normals: nrm }));
    const q = box.point(0.0, tS, 0.0042);
    const T = box.point(0.01, tS).p.sub(box.point(-0.01, tS).p).normalize();
    const bk = K.buckleGeo(0.025);
    bk.applyMatrix4(K.basisAt(q.p.clone().addScaledVector(T, -0.03), V3().crossVectors(q.n, T).normalize().negate(), q.n, T));
    bins.add(SG.moulded('#151617', { rough: 0.42, spec: 0.6 }), bk);
  }
  // two stitched handles on the right side + one over the top
  for (const tc of [0.36, 0.66]) addHandle(bins, k, box.point(fr.right, tc - 0.065, 0.0012), box.point(fr.right, tc + 0.065, 0.0012), { h: 0.04, w: 0.036 });
  addHandle(bins, k, box.pointM(fr.left, box.mTop0 - 0.015, 0.0012), box.pointM(fr.right, box.mTop0 - 0.015, 0.0012), { h: 0.055, w: 0.038 });
  // a sewn-in label on the front near the hem
  {
    const q = box.point(0.0, 0.1, 0.0012);
    const lab = G.roundedBox(0.07, 0.0012, 0.03, 0.0005);
    const T = V3(0, 1, 0);
    lab.applyMatrix4(K.basisAt(q.p, V3().crossVectors(T, q.n).normalize(), q.n, T));
    bins.add(SG.fabric600('#2B2C2F', { sheen: 0.5 }), lab);
  }
  const g = K.finish(bins, `beschermhoes ${H}`);
  g.rotation.y = -10 * DEG;
  const root = new THREE.Group(); root.add(g);
  return {
    object: root,
    detail: { target: [0, H - 0.08, 0], size: 0.45, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 12, azimuth: 36 } },
    rig: darkRig(k.dark),
    meta: { shape: 'upright', height: H, wheels: false },
  };
}

// ---------------------------------------------------------------------------------------------
// opbergtas (duffel) for an inflatable tent
function duffel(p, fabHex) {
  const k = kit(fabHex);
  const Lb = Number(p.height ?? 1.0);
  const bins = new G.PartBin();
  // bag axis along world X. Built as a softBox standing along +Y, then laid down: local y -> +X
  const Wv = 0.44, Dd = 0.46; // local x -> world -y (vertical), local z -> world z
  const re = 0.06, r = 0.15;
  const endL = 0.03; // wheel end board thickness
  const L = Lb - 2 * re - endL;
  const P0 = K.rrFractions(Wv / 2, Dd / 2, r).P;
  const cr = SG.creases(41, [
    { n: 34, u: [0, P0], v: [0.02, L - 0.02], ang: 0, angJ: 0.5, len: [0.08, 0.3], wid: [0.015, 0.04], amp: [0.002, 0.006], sharp: 0.45 },
    { n: 16, u: [0, P0], v: [0.0, L], ang: Math.PI / 2, angJ: 0.35, len: [0.15, 0.45], wid: [0.03, 0.06], amp: [0.002, 0.005], sharp: 0.25 },
  ], { periodU: P0 });
  const crEnd = SG.creases(43, [{ n: 22, u: [-Wv / 2, Wv / 2], v: [-Dd / 2, Dd / 2], ang: 0, angJ: 1.6, len: [0.05, 0.14], wid: [0.012, 0.03], amp: [0.002, 0.005], sharp: 0.45 }]);
  const straps = [0.25, 0.75];
  const y0 = 0;
  const box = SG.softBox({
    W: Wv, D: Dd, L, r, re, y0, nu: 200, nWall: 160, nEdge: 9, nEnd: 10,
    disp: (q) => {
      if (q.part === 'wall') {
        const t = q.t;
        let cinch = 0;
        for (const ts of straps) cinch -= 0.012 * Math.exp(-(((t - ts) * L / 0.03) ** 2)) * (0.3 + 0.7 * q.face);
        return 0.016 * q.face * Math.pow(Math.sin(Math.PI * t), 0.6) + cinch + cr(q.s, q.y) * (0.5 + 0.5 * q.face);
      }
      return crEnd(q.x, q.z) * (q.part === 'top' || q.part === 'bot' ? 1 : 0.5) + (q.part === 'top' || q.part === 'bot' ? 0.008 : 0);
    },
    // gravity: the soft body slumps on the floor (in standing-local coords: local x is vertical
    // after laying down, local +x = world down)
    warp: (pp) => {
      const v = -pp.x; // world height above the bag's centre line
      const h = v / (Wv / 2 + 0.02);
      const squash = 1 - 0.1 * Math.max(0, h);                    // the top sags
      const spread = 1 + 0.07 * Math.max(0, 1 - Math.abs(h + 0.7)); // sides bulge low down
      return V3(pp.x * (h > 0 ? squash : 1 - 0.04 * Math.max(0, -h)), pp.y, pp.z * spread);
    },
  });
  // lay down: local (x, y, z) -> world (y - L/2 ... ) : world X = local y, world Y = -local x + lift
  const lift = Wv / 2 + 0.018;
  const Mx = new THREE.Matrix4().set(0, 1, 0, -L / 2 - endL / 2, -1, 0, 0, lift, 0, 0, 1, 0, 0, 0, 0, 1);
  const NM = new THREE.Matrix3().getNormalMatrix(Mx);
  const pt = (f, t, l = 0) => { const q = box.point(((f % 1) + 1) % 1, t, l); return { p: q.p.applyMatrix4(Mx), n: q.n.applyMatrix3(NM).normalize() }; };
  const ptM = (f, m, l = 0) => { const q = box.pointM(((f % 1) + 1) % 1, m, l); return { p: q.p.applyMatrix4(Mx), n: q.n.applyMatrix3(NM).normalize() }; };
  bins.add(k.fab, box.geo.clone().applyMatrix4(Mx));
  const fr = box.frac; // world: fr.left (local -x) = top, fr.right = bottom, 0 = front (+z), fr.back = back
  // piping round both end panels
  for (const mm of [box.mBot + (box.mWall0 - box.mBot) * 0.5, box.mWall1 + (box.mTop0 - box.mWall1) * 0.5]) {
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = ptM(i / 240, mm, 0.002); pts.push(q.p); nrm.push(q.n); }
    addPiping(bins, k, pts, nrm, { stitchOff: 0.009, sideRef: V3(mm < box.mWall0 ? 1 : -1, 0, 0) });
  }
  // U zip lid on the top
  {
    const fA = fr.left - 0.08, fB = fr.left + 0.08;
    const ft = [];
    for (let i = 0; i <= 50; i++) ft.push([fA, 0.06 + (i / 50) * 0.88]);
    for (let i = 1; i <= 16; i++) { const u = i / 16; ft.push([fA + (fB - fA) * u, 0.94]); }
    for (let i = 1; i <= 50; i++) ft.push([fB, 0.94 - (i / 50) * 0.88]);
    const pts = [], nrm = [];
    for (const [f, t] of ft) { const q = pt(f, t, 0.0012); pts.push(q.p); nrm.push(q.n); }
    addZip(bins, k, { pts, nrm }, { sliders: [0.43, 0.57] });
  }
  // two carry handles across the top
  for (const tc of [0.38, 0.62]) addHandle(bins, k, pt(fr.left - 0.13, tc, 0.0015), pt(fr.left + 0.13, tc, 0.0015), { h: 0.06, w: 0.038, grip: k.tray });
  // compression straps round the girth, buckle on the front
  for (const ts of straps) {
    const pts = [], nrm = [];
    for (let i = 0; i <= 240; i++) { const q = pt(i / 240, ts, 0.0026); pts.push(q.p); nrm.push(q.n); }
    bins.add(k.web, K.strapAlong(pts, 0.025, 0.0024, { normals: nrm }));
    for (const dw of [-0.0085, 0.0085]) bins.add(k.thr, SG.stitches(pts.map((q, i) => q.clone().add(V3(dw, 0, 0)).addScaledVector(nrm[i], 0.0013)).filter((_, i) => i < 30 || i > 210), nrm.filter((_, i) => i < 30 || i > 210)));
    const q = pt(0.035, ts, 0.0048);
    const T = pt(0.04, ts).p.sub(pt(0.03, ts).p).normalize();
    const bk = K.buckleGeo(0.025);
    bk.applyMatrix4(K.basisAt(q.p, V3().crossVectors(q.n, T).normalize().negate(), q.n, T));
    bins.add(SG.moulded('#151617', { rough: 0.42, spec: 0.6 }), bk);
  }
  // wheel end (+X): a moulded wheel base across the bottom of the end panel (narrow at the
  // floor so the wheels sit beside it), wheels under fenders, an external alu trolley frame up
  // the end panel into a moulded top bracket, telescopic extension with a rubber grip
  const xE = L / 2 + re - endL / 2 + 0.006; // ~ the fabric end panel
  const zw = Dd / 2 - 0.045, R = 0.058, wW = 0.036;
  const zb = zw - wW / 2 - 0.012;
  const bx0 = xE - 0.03, bx1 = xE + 0.04;
  const base = fillet([[-zb, 0.014], [zb, 0.014], [zb, 0.128], [Dd / 2 - 0.035, 0.165], [Dd / 2 - 0.05, 0.205], [-(Dd / 2 - 0.05), 0.205], [-(Dd / 2 - 0.035), 0.165], [-zb, 0.128]], [0.012, 0.012, 0.02, 0.02, 0.025, 0.025, 0.02, 0.02]);
  {
    const sh = new THREE.Shape(base.map(([z, y]) => new THREE.Vector2(z, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: bx1 - bx0 - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 10 });
    g.rotateY(Math.PI / 2); g.translate(bx0 + 0.006, 0, 0);
    bins.add(k.tray, g);
  }
  const xw = xE + 0.022;
  for (const sz of [-1, 1]) {
    const wh = wheel(R, wW);
    for (const g of [wh.tyre, wh.hub]) { g.rotateY(Math.PI / 2); g.translate(xw, R, sz * zw); }
    bins.add(k.tyre, wh.tyre); bins.add(k.hubM, wh.hub);
    const cap = wh.cap.clone(); cap.rotateY(sz > 0 ? -Math.PI / 2 : Math.PI / 2); cap.translate(xw, R, sz * (zw + wW / 2 - 0.0005)); bins.add(k.zinc, cap);
    bins.add(k.zinc, G.tube(V3(xw, R, sz * (zb - 0.004)), V3(xw, R, sz * (zw - wW / 2 + 0.002)), 0.0065, 16));
    const fender = K.lathe([[R + 0.005, -wW / 2 - 0.004], [R + 0.012, -wW / 2 - 0.004], [R + 0.012, wW / 2 + 0.004], [R + 0.005, wW / 2 + 0.004]], 36, Math.PI * 0.42, Math.PI * 0.85);
    fender.rotateX(Math.PI / 2); fender.translate(xw, R, sz * zw);
    bins.add(k.tray, fender);
  }
  // two rubber feet under the far end
  for (const sz of [-1, 1]) { const sk = G.roundedBox(0.06, 0.018, 0.04, 0.007); sk.translate(-L / 2 + 0.02, 0.009, sz * (Dd / 2 - 0.12)); bins.add(k.tyre, sk); }
  // trolley frame
  const xt = xE + 0.026, yT = Wv - 0.01, ext = 0.36, tz = 0.095;
  const alu = SG.aluSG({ tone: '#BFC3C7', rough: 0.36 });
  for (const sz of [-1, 1]) {
    bins.add(alu, G.tube(V3(xt, 0.2, sz * tz), V3(xt, yT + 0.02, sz * tz), 0.0115, 24));
    bins.add(alu, G.tube(V3(xt, yT, sz * tz), V3(xt, yT + ext * 0.55, sz * tz), 0.0098, 24));
    bins.add(k.tray, G.tube(V3(xt, yT + ext * 0.55 - 0.006, sz * tz), V3(xt, yT + ext * 0.55 + 0.012, sz * tz), 0.0122, 24));
    bins.add(alu, G.tube(V3(xt, yT + ext * 0.55, sz * tz), V3(xt, yT + ext, sz * tz), 0.0084, 24));
  }
  {
    const br = G.roundedBox(0.04, 0.05, 2 * tz + 0.06, 0.012); br.translate(xt - 0.006, yT + 0.005, 0); bins.add(k.tray, br);
    const gb = K.tubeAlong(K.smoothPath([V3(xt, yT + ext - 0.01, -tz), V3(xt, yT + ext + 0.02, -tz + 0.01), V3(xt, yT + ext + 0.025, 0), V3(xt, yT + ext + 0.02, tz - 0.01), V3(xt, yT + ext - 0.01, tz)], 40), 0.016, 24);
    bins.add(SG.rubberSG('#161616', { rough: 0.6 }), gb);
  }
  const g = K.finish(bins, `opbergtas duffel ${Lb}`);
  return {
    object: g,
    detail: { target: [L / 2, 0.12, Dd / 2 - 0.05], size: 0.4, azimuth: 50, elevation: 12 },
    view: { hero: { elevation: 16 } },
    rig: darkRig(k.dark),
    meta: { shape: 'duffel', length: Lb },
  };
}

export { kit, darkRig, addZip, addHandle, addPiping, wheel, fillet };
