// Draagtas / wieltas / beschermhoes / opbergtas (soft bags for folded tents).
//
// { height, color, wheels, logo, shape }
//   shape 'upright' (default): bag for a folded easy-up standing on its end, cross-section
//         37 x 35 cm (fits the folded 3 x 3 frame), `height` = overall height (1.55-1.75 m)
//     wheels true  -> wieltas: 600D polyester on a moulded base tray, two wheels in housings at
//                     the back, U-zip round the front panel (full length), padded top handle,
//                     two carry handles on the side, a lift handle low on the back above the
//                     wheels; `logo` true -> KLAPKLAAR wordmark printed up the front panel
//     wheels false -> beschermhoes: lighter coated polyester cover slid over the folded frame
//                     (the corner brackets push the top out), two side handles and a webbing
//                     strap with side-release buckle round the bottom
//   shape 'duffel': opbergtas for an inflatable tent lying on its side, `height` = length;
//         wheel end panel with two wheels and an extended telescopic trolley handle, U-zip lid,
//         two carry handles with a grip wrap, two compression straps with buckles
// Fabric: 600D polyester oxford with PU backing (basket weave normal map, uv in metres),
// piping on the long edges, webbing (twill) handles and straps, moulded zip chain.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function printMat(tex) {
  const m = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.48, specularIntensity: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, name: 'bag print' });
  return m;
}

function wheelGeo(R = 0.05, w = 0.034) {
  // tyre + rim profile, axis +Y (rotated later)
  const tyre = K.lathe([[R - 0.012, -w / 2], [R - 0.004, -w / 2], [R - 0.001, -w / 2 + 0.004], [R, -w / 2 + 0.01], [R, w / 2 - 0.01], [R - 0.001, w / 2 - 0.004], [R - 0.004, w / 2], [R - 0.012, w / 2]], 64);
  const hub = K.lathe([[0.0001, w / 2 - 0.004], [0.012, w / 2 - 0.004], [0.014, w / 2 - 0.007], [R - 0.012, w / 2 - 0.009], [R - 0.012, -w / 2 + 0.009], [0.014, -w / 2 + 0.007], [0.012, -w / 2 + 0.004], [0.0001, -w / 2 + 0.004]].reverse(), 48);
  return { tyre, hub };
}

export function draagtas(p = {}) {
  const shape = String(p.shape || 'upright');
  const wheels = p.wheels === true || p.wheels === 'true';
  const color = p.color || 'zwart';
  const hex = M.resolveColor(color, '#1A1B1D');
  const fabHex = color === 'zwart' ? '#18191B' : hex;
  const isCover = shape === 'upright' && !wheels;
  const fab = K.oxford(fabHex, isCover ? { sheen: 0.4, rough: 0.58 } : {});
  const pipeMat = fab;
  const web = M.webbing('#141516');
  const tape = M.webbing('#1C1D1F');
  const tooth = M.zipTooth('#121213');
  const slider = K.abs('#2A2C2F', 0.32);
  const tray = K.abs('#141415', 0.55);
  const tyreMat = K.softRubber('#151515', 0.62);
  const hubMat = K.abs('#3A3C3F', 0.4);
  const axle = K.zinc();
  const bins = new G.PartBin();
  const extras = [];
  const group = new THREE.Group();

  // ---------------------------------------------------------------------------------
  // body frame: upright -> identity; duffel -> bag axis along world X, bag-local +x down
  let bag, Mx = new THREE.Matrix4(), Hh, W, D;
  if (shape === 'duffel') {
    const Lb = Number(p.height ?? 1.0);
    W = 0.42; D = 0.46; // W -> vertical, D -> depth
    bag = K.softBag({ W, D, L: Lb - 0.08, r: 0.085, re: 0.04, y0: 0, bulge: 0.026, wrinkle: 0.006, seed: 7, topDome: 0.006, bottomBulge: 0 });
    // bag-local (x, y, z) -> world: y along +X, x down
    const lift = W / 2 + 0.022; // skid strips
    Mx.set(0, 1, 0, -(Lb - 0.08) / 2,
      -1, 0, 0, lift,
      0, 0, 1, 0,
      0, 0, 0, 1);
    Hh = W + lift;
  } else {
    Hh = Number(p.height ?? 1.55);
    W = 0.37; D = 0.35;
    // cover: the hem stops 7 cm above the floor, the folded frame's legs and foot plates show below
    const y0 = wheels ? 0.09 : 0.075;
    const L = Hh - y0 - 0.035;
    // the cover hangs on the four corner legs of the folded frame: faces fall slightly in
    // between the legs (negative bulge) with long vertical drape folds
    bag = K.softBag({ W, D, L, r: isCover ? 0.03 : 0.035, re: wheels ? 0.03 : 0.03, y0, bulge: isCover ? -0.012 : 0.009, wrinkle: isCover ? 0.009 : 0.0032, seed: isCover ? 5 : 3, topDome: isCover ? -0.004 : 0.012, bottomBulge: wheels ? 0.6 : 0.0 });
  }
  const NM = new THREE.Matrix3().getNormalMatrix(Mx);
  const pt = (f, t, lift = 0) => { const q = bag.point(f, t, lift); return { p: q.p.applyMatrix4(Mx), n: q.n.applyMatrix3(NM).normalize() }; };
  const bodyGeo = bag.geo.clone().applyMatrix4(Mx);
  bins.add(fab, bodyGeo);
  const fr = bag.frac;

  // piping along the four long edges
  for (const fc of [fr.cFR, fr.cBR, fr.cBL, fr.cFL]) {
    const pts = []; for (let k = 0; k <= 60; k++) pts.push(pt(fc, 0.004 + (k / 60) * 0.992, 0.0015).p);
    bins.add(pipeMat, K.tubeAlong(pts, 0.0038, 10));
  }

  // zip with tape, chain, sliders and pullers along a path of (f, t) samples
  const zip = (ft, { sliders = [] } = {}) => {
    const S = ft.map(([f, t]) => pt(f, t, 0.0012));
    const pts = S.map((s) => s.p), nrm = S.map((s) => s.n);
    bins.add(tape, K.strapAlong(pts, 0.03, 0.0014, { normals: nrm }));
    const pts2 = S.map((s) => s.p.clone().addScaledVector(s.n, 0.0016));
    bins.add(tooth, K.strapAlong(pts2, 0.0068, 0.0026, { normals: nrm }));
    for (const si of sliders) {
      const i = Math.round(si * (pts.length - 1));
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const T = b.clone().sub(a).normalize(), N = nrm[i];
      const Bv = V3().crossVectors(T, N).normalize();
      const c = pts[i].clone().addScaledVector(N, 0.006);
      const body = G.roundedBox(0.019, 0.009, 0.032, 0.003);
      body.applyMatrix4(K.basisAt(c, Bv, N, T)); bins.add(slider, body);
      // puller: flat tab hanging from the slider bridge
      const tab = G.roundedBox(0.012, 0.0035, 0.04, 0.0015);
      const tc = c.clone().addScaledVector(T, -0.026).addScaledVector(N, 0.004);
      tab.applyMatrix4(K.basisAt(tc, Bv, N, T)); bins.add(slider, tab);
    }
  };

  // webbing handle between two surface points (f0,t0) -> (f1,t1), loop height h
  const handle = (A, B, h = 0.04, { grip = false, w = 0.038 } = {}) => {
    const a = pt(A[0], A[1], 0.0015), b = pt(B[0], B[1], 0.0015);
    const along = b.p.clone().sub(a.p).normalize();
    const n = a.n.clone().add(b.n).normalize();
    const mid = a.p.clone().lerp(b.p, 0.5).addScaledVector(n, h);
    const ctrl = [a.p.clone().addScaledVector(along, -0.035), a.p, a.p.clone().addScaledVector(along, 0.02).addScaledVector(n, h * 0.5), mid, b.p.clone().addScaledVector(along, -0.02).addScaledVector(n, h * 0.5), b.p, b.p.clone().addScaledVector(along, 0.035)];
    const pts = K.smoothPath(ctrl, 48);
    bins.add(web, K.strapAlong(pts, w, 0.0024, { up: n.clone() }));
    // stitched reinforcement patches at both ends
    for (const e of [a, b]) {
      const patch = G.roundedBox(w + 0.006, 0.0016, 0.05, 0.0008);
      patch.applyMatrix4(K.basisAt(e.p.clone().addScaledVector(e.n, 0.0006), V3().crossVectors(e.n, along).normalize(), e.n, along));
      bins.add(web, patch);
    }
    if (grip) {
      const gp = pts.filter((_, i) => i > 16 && i < 32).map((q) => q.clone());
      bins.add(fab, K.tubeAlong(gp, 0.013, 18));
    }
  };

  if (shape === 'duffel') {
    const Lb = Number(p.height ?? 1.0);
    // top panel = bag-local -x face (fraction fr.left); front = +z (fraction 0)
    // U zip on the top panel: along both long edges of the top face + across the far end
    const fA = fr.left - 0.075, fB = fr.left + 0.075;
    const ftz = [];
    for (let k = 0; k <= 30; k++) ftz.push([fA, 0.06 + (k / 30) * 0.88]);
    for (let k = 1; k <= 12; k++) { const u = k / 12; ftz.push([fA + (fB - fA) * u, 0.94 + Math.sin(u * Math.PI) * 0.02]); }
    for (let k = 1; k <= 30; k++) ftz.push([fB, 0.94 - (k / 30) * 0.88]);
    zip(ftz, { sliders: [0.36, 0.64] });
    // two carry handles across the top panel + grip wrap
    handle([fr.left - 0.11, 0.38], [fr.left + 0.11, 0.38], 0.06, { grip: false });
    handle([fr.left - 0.11, 0.62], [fr.left + 0.11, 0.62], 0.06, { grip: false });
    // compression straps round the girth with buckles on the front
    for (const t of [0.24, 0.76]) {
      const pts = [], nrm = [];
      for (let k = 0; k <= 120; k++) { const q = pt(k / 120, t, 0.0025); pts.push(q.p); nrm.push(q.n); }
      bins.add(web, K.strapAlong(pts, 0.025, 0.0022, { normals: nrm }));
      const q = pt(0.0, t, 0.004);
      const bk = K.buckleGeo(0.025);
      const T = pt(0.01, t).p.sub(pt(-0.01, t).p).normalize();
      bk.applyMatrix4(K.basisAt(q.p, V3().crossVectors(q.n, T).normalize().negate(), q.n, T));
      bins.add(K.abs('#151516', 0.4), bk);
    }
    // wheel end (+X): moulded end board, two wheels at the bottom corners, trolley handle
    const xb = Lb / 2 - 0.004, xE = Lb / 2 + 0.006;
    const board = G.roundedBox(0.024, W * 0.84, D * 0.8, 0.05);
    board.translate(xb, W / 2 + 0.022, 0); bins.add(tray, board);
    const R = 0.055;
    for (const sz of [-1, 1]) {
      const { tyre, hub } = wheelGeo(R, 0.036);
      for (const g of [tyre, hub]) { g.rotateX(Math.PI / 2); g.translate(xE, R, sz * (D / 2 - 0.045)); }
      bins.add(tyreMat, tyre); bins.add(hubMat, hub);
      // housing arch over the wheel
      const arch = K.lathe([[R + 0.006, -0.024], [R + 0.016, -0.024], [R + 0.016, 0.024], [R + 0.006, 0.024]], 32, Math.PI * 0.05, Math.PI * 1.1);
      arch.rotateX(Math.PI / 2); arch.rotateZ(-Math.PI / 2 + 0.2); arch.translate(xE, R, sz * (D / 2 - 0.045));
      bins.add(tray, arch);
      bins.add(axle, G.tube(V3(xE, R, sz * (D / 2 - 0.045) - sz * 0.03), V3(xE, R, sz * (D / 2 - 0.045) + sz * 0.0205), 0.0075, 16));
    }
    // skid strips under the far end
    for (const sz of [-1, 1]) { const sk = G.roundedBox(0.14, 0.024, 0.03, 0.006); sk.translate(-Lb / 2 + 0.14, 0.012, sz * (D / 2 - 0.08)); bins.add(tray, sk); }
    // telescopic trolley handle: two alu tubes out of the board top, black grip bar
    const yTop = W * 0.92 + 0.022 - 0.004, ext = 0.34, tz = 0.11;
    const alu = M.aluminium({ tone: '#AEB2B6', roughness: 0.42 });
    for (const sz of [-1, 1]) {
      bins.add(tray, G.tube(V3(xb, yTop - 0.01, sz * tz), V3(xb, yTop + 0.015, sz * tz), 0.014, 20));
      bins.add(alu, G.tube(V3(xb, yTop, sz * tz), V3(xb, yTop + ext * 0.55, sz * tz), 0.0105, 20));
      bins.add(alu, G.tube(V3(xb, yTop + ext * 0.55, sz * tz), V3(xb, yTop + ext, sz * tz), 0.0088, 20));
      bins.add(tray, G.tube(V3(xb, yTop + ext * 0.55 - 0.004, sz * tz), V3(xb, yTop + ext * 0.55 + 0.012, sz * tz), 0.0125, 20));
    }
    const gb = G.roundedBox(0.032, 0.034, 2 * tz + 0.05, 0.012); gb.translate(xb, yTop + ext + 0.012, 0); bins.add(tray, gb);
    const g = K.finish(bins, `opbergtas duffel ${Lb}`, extras);
    return {
      object: g,
      detail: { target: [Lb / 2 - 0.05, 0.12, D / 2 - 0.05], size: 0.4, azimuth: 50, elevation: 12 },
      view: { hero: { elevation: 18 } },
      rig: { default: { contact: { strength: 0.85, h0: 0.012, res: 1024, blur: 1.4 } } },
      meta: { shape, length: Lb },
    };
  }

  // ---------------------------------------------------------------------------------
  // upright bags
  const yb = bag.y0;
  if (wheels) {
    // base tray (moulded, wraps the bottom 8 cm) and front feet
    const trayH = 0.085;
    const tr = K.extrudeY(new THREE.Shape(G.roundedRectProfile(W + 0.014, D + 0.014, 0.04, 6).map((q) => new THREE.Vector2(q.x, q.y))), trayH, { y0: 0.014, bevel: 0.006, bevelSegs: 2, curveSegs: 8 });
    bins.add(tray, tr);
    for (const sx of [-1, 1]) { const ft = G.roundedBox(0.05, 0.016, 0.035, 0.005); ft.translate(sx * (W / 2 - 0.06), 0.008, D / 2 - 0.045); bins.add(tray, ft); }
    // wheels in housings at the two back corners (axle along x)
    const R = 0.05;
    for (const sx of [-1, 1]) {
      const cx = sx * (W / 2 - 0.03), cz = -D / 2 - 0.004;
      const { tyre, hub } = wheelGeo(R, 0.034);
      for (const g of [tyre, hub]) { g.rotateZ(Math.PI / 2); g.translate(cx, R, cz); }
      bins.add(tyreMat, tyre); bins.add(hubMat, hub);
      const arch = K.lathe([[R + 0.005, -0.022], [R + 0.014, -0.022], [R + 0.014, 0.022], [R + 0.005, 0.022]], 32, 0, Math.PI * 1.05);
      // arch over the top and inside of the wheel: lathe axis -> x
      arch.rotateZ(Math.PI / 2); arch.rotateX(-Math.PI * 0.02); arch.translate(cx, R, cz);
      bins.add(tray, arch);
      bins.add(tray, G.tube(V3(cx - sx * 0.024, R, cz), V3(cx - sx * 0.018, R, cz), R - 0.004, 32));
      bins.add(axle, G.tube(V3(cx + sx * 0.012, R, cz), V3(cx + sx * 0.0195, R, cz), 0.009, 20));
    }
  } else {
    // cover: strap with side-release buckle round the bottom
    const t = 0.035;
    const pts = [], nrm = [];
    for (let k = 0; k <= 120; k++) { const q = pt(k / 120, t, 0.0022); pts.push(q.p); nrm.push(q.n); }
    bins.add(web, K.strapAlong(pts, 0.025, 0.0022, { normals: nrm }));
    const q = pt(0.03, t, 0.0035);
    const T = pt(0.04, t).p.sub(pt(0.02, t).p).normalize();
    const bk = K.buckleGeo(0.025);
    bk.applyMatrix4(K.basisAt(q.p, V3().crossVectors(q.n, T).normalize().negate(), q.n, T));
    bins.add(K.abs('#151516', 0.4), bk);
    // hem: rolled edge round the open bottom of the cover
    const hem = []; for (let k = 0; k <= 120; k++) hem.push(pt(k / 120, 0.0, 0.002).p);
    bins.add(fab, K.tubeAlong(hem, 0.005, 10));
    // folded frame below the hem: four black hex legs (inner tubes) with galvanised foot plates
    const legMat = M.steelPowder('#1C1D1F', { roughness: 0.42 });
    const galv = M.galvanised();
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const x = sx * (W / 2 - 0.035), z = sz * (D / 2 - 0.035);
      bins.add(legMat, G.hexTube(V3(x, 0.006, z), V3(x, bag.y0 + 0.08, z), 0.034));
      bins.add(galv, G.prism(G.roundedRectProfile(0.13, 0.13, 0.012, 3), V3(x + sx * 0.02, 0, z + sz * 0.02), V3(x + sx * 0.02, 0.006, z + sz * 0.02), { side: V3(1, 0, 0) }));
      bins.add(galv, G.hexTube(V3(x, 0.005, z), V3(x, 0.07, z), 0.042));
    }
  }
  // top handle across the top (padded grip), webbing over the top end
  {
    const yT = bag.ytop;
    const a = V3(-W * 0.3, yT - 0.002, 0), b = V3(W * 0.3, yT - 0.002, 0);
    const ctrl = [V3(-W / 2 - 0.004, yT - 0.06, 0), V3(-W / 2 + 0.01, yT - 0.006, 0), a, V3(0, yT + 0.055, 0), b, V3(W / 2 - 0.01, yT - 0.006, 0), V3(W / 2 + 0.004, yT - 0.06, 0)];
    const pts = K.smoothPath(ctrl, 64);
    bins.add(web, K.strapAlong(pts, 0.04, 0.0025, { up: V3(0, 1, 0) }));
    const gp = pts.filter((_, i) => i > 22 && i < 42);
    bins.add(wheels ? tray : fab, K.tubeAlong(gp, 0.015, 18));
  }
  // carry handles on the right side (+x face)
  handle([fr.right, 0.52], [fr.right, 0.66], 0.045);
  handle([fr.right, 0.24], [fr.right, 0.38], 0.045);
  if (wheels) {
    // lift handle low on the back, above the wheels
    handle([fr.back + 0.06, 0.06], [fr.back - 0.06, 0.06], 0.035, { w: 0.032 });
    // U zip round the front panel: up the left, across the top, down the right
    const fl = 1 - (fr.faW - 0.02) / fr.P, frr = (fr.faW - 0.02) / fr.P;
    const ft = [];
    for (let k = 0; k <= 50; k++) ft.push([fl, 0.03 + (k / 50) * 0.94]);
    for (let k = 1; k <= 16; k++) { const u = k / 16; ft.push([fl + (frr + 1 - fl) * u, 0.97]); }
    for (let k = 1; k <= 50; k++) ft.push([frr, 0.97 - (k / 50) * 0.94]);
    // fractions across the seam: normalise to [0,1)
    zip(ft.map(([f, t]) => [((f % 1) + 1) % 1, t]), { sliders: [0.5, 0.56] });
  }
  // logo up the front panel
  if (p.logo) {
    const spec = typeof p.logo === 'object' ? p.logo : { svg: typeof p.logo === 'string' && /print-/.test(p.logo) ? p.logo : 'print-wordmark' };
    const { tex, aspect } = K.printTex(spec, { color: spec.color || '#FBF6EC', px: 2048 });
    const len = Math.min(0.62 * bag.L, 0.85), wid = len / aspect;
    const t0 = 0.5 - len / bag.L / 2, t1 = 0.5 + len / bag.L / 2;
    const fw = wid / 2 / fr.P;
    const rows = [];
    const nu = 80, nv = 8;
    for (let j = 0; j <= nv; j++) {
      const row = [];
      const f = fw - (2 * fw) * (j / nv);
      for (let i = 0; i <= nu; i++) row.push(pt(((f % 1) + 1) % 1, t0 + (t1 - t0) * (i / nu), 0.0009).p);
      rows.push(row);
    }
    const g = K.gridGeometry(rows, { closedU: false });
    const uv = g.attributes.uv;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uv.setXY(j * (nu + 1) + i, i / nu, j / nv);
    const m = new THREE.Mesh(g, printMat(tex)); m.castShadow = false; m.receiveShadow = true; extras.push(m);
  }
  const g = K.finish(bins, `draagtas ${shape} ${Hh}`, extras);
  group.add(g);
  return {
    object: group,
    // wheel bag: wheels + low lift handle from behind-right; cover: the top handle
    detail: wheels
      ? { target: [W * 0.1, 0.11, -D / 2], size: 0.5, azimuth: 148, elevation: 10 }
      : { target: [0, bag.ytop - 0.05, 0], size: 0.45, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 14 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.012, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { shape, height: Hh, wheels },
  };
}
