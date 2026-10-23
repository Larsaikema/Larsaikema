// Opblaasbare promotietent (inflatable X-frame gazebo) and its connection tunnel.
//
// Round 3 rebuild (art-director verdict: "reads as a footstool / side table"). What makes an
// inflatable read as one is the frame itself, so the frame is now the hero of the image:
//  - one continuous airtight TPU tube per corner inside a coated sleeve in the frame colour:
//    a FAT leg (Ø 34 cm on 3 x 3, Ø 40 on 4 x 4, Ø 50 on the 8 m hexagon) that stands up from a
//    domed foot, turns inward through a big elbow (radius 0.75-1.35 m) made of mitred gores
//    (welded gore seams across the bend, each a slight waist in the tube) and runs on as a
//    roof arch to a round hub at the apex, where all 4 (or 6) arches meet;
//  - the canopy hangs UNDER the arches: every face is a taut membrane (force-density form
//    finding) fixed along the flanks of the two arches either side, so each arch stands proud
//    of the roof as a fat round ridge; a disc under the hub closes the centre;
//  - the canopy edge between two legs is a tensioned arc (it rises and pulls in towards the
//    middle), piped, with a narrow border band (print area) hanging from it that follows the
//    arc: the side openings read as arches between the legs, never as a flat eave / lid;
//  - legs: webbing loop + D-ring + peg at every foot, guy ropes from a loop on every elbow,
//    a Boston valve on the leg nearest the camera; `legs: 'water'`: a black PVC water ballast
//    ring round every leg base (no pegs, no guy ropes);
//  - options: closed side walls in the arched openings (`walls: {back: 'closed'}`), a front
//    awning (`awning: 'front'`) on two poles, a full-colour printed canopy (`canopyPrint`), an
//    LED lamp under the hub (`light: {watt, on}`, with a low view from inside), the tunnel
//    (`opblaasbareTunnel`); a full-colour printed wall (`walls: {back: 'print'}` or
//    `wallPrint: {artwork, side}`): the sample design upright on the wall as seen from outside.
// Framing: guy ropes and stakes do not count for the auto-framing; a fixed footprint proxy
// (legs + 0.3 m) does, so every colour / leg variant of one size is framed identically.
// Units: metres, Y up, front +Z.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';
import * as LK from '../js/lightKit.js';
import { fixedView } from '../js/fixedView.js';

const { V3, TAU } = K;
const dirOf = (a) => V3(Math.sin(a), 0, Math.cos(a));
const Y = V3(0, 1, 0);
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function dims(p) {
  const hex = String(p.shape || '').toLowerCase().startsWith('hex') || Number(p.legs) === 6;
  const w = Number(p.w ?? p.diameter ?? (hex ? 8 : 3));
  if (hex) {
    const r = 0.23;
    return { N: 6, hex: true, w, r, Rc: w / 2 - r, Hc: Number(p.height ?? 4.9), yb: 2.5, Rb: 1.25, Ra: 2.4, vD: 0.34, bulge: 0.34, inset: 0.16, stop: 0.62, depth: 2.2, bandF: 0.3 };
  }
  const pro = w >= 3.9;
  const r = pro ? 0.18 : 0.15;
  // `height` is the crown height; a value below the elbow (the zijwand Pro spec passes its wall
  // height, 2.5 m) is not a crown height and keeps the standard tent (same as the Pro hero)
  const hWanted = Number(p.height);
  const Hc = Number.isFinite(hWanted) && hWanted >= (pro ? 3.0 : 2.9) ? hWanted : (pro ? 3.8 : 3.35);
  return {
    N: 4, hex: false, w, r, Rc: (w / 2 - r) * Math.SQRT2, Hc,
    yb: pro ? 2.15 : 2.05, Rb: pro ? 0.85 : 0.7, Ra: pro ? 1.4 : 1.0, vD: pro ? 0.24 : 0.2,
    bulge: pro ? 0.2 : 0.16, inset: pro ? 0.1 : 0.08, stop: pro ? 0.36 : 0.32, depth: pro ? 1.7 : 1.4, bandF: 0.3,
  };
}

// Shared geometry of the frame + canopy edge (used by the tent and the tunnel).
export function frameGeom(D) {
  const { N, r, Rc, Hc, yb, Rb, Ra } = D;
  const R = r + 0.004; // canopy attachment just off the tube skin
  const Yc = Hc - r;
  const yFoot = r * 0.62;
  const arch = T2.archCurve({ Rc, yb, Yc, Rb, Ra, yFoot });
  const ang = [], dk = [], Lk = [], C = [], nSide = [];
  for (let k = 0; k < N; k++) {
    const a = Math.PI / N + (k * TAU) / N;
    ang.push(a); dk.push(dirOf(a)); Lk.push(dirOf(a + Math.PI / 2)); C.push(dirOf(a).multiplyScalar(Rc));
    nSide.push(dirOf(a + Math.PI / N));
  }
  // frame on arch k at arc length s: centre A, outward normal Nv (in the arch plane), side Lk
  const at = (k, s) => {
    const a = arch.at(s);
    const A = dk[k].clone().multiplyScalar(a.rho).setY(a.y);
    const Nv = dk[k].clone().multiplyScalar(a.ty).add(V3(0, -a.tr, 0)).normalize();
    return { A, Nv, a };
  };
  // point on the skin of arch k at angle phi from the crown towards side sgn (+1: towards k+1)
  const skin = (k, s, phi, sgn = 1, rad = R) => {
    const h = at(k, s);
    return h.A.addScaledVector(h.Nv, rad * Math.cos(phi)).addScaledVector(Lk[k], sgn * rad * Math.sin(phi));
  };
  // arc length on the leg / elbow where the centre line is at height y
  const sOfY = (y) => {
    if (y <= yFoot) return 0;
    if (y <= yb) return y - yFoot;
    let lo = arch.sBend, hi = arch.total;
    for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (arch.at(m).y < y) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const phiA = (100 * Math.PI) / 180; // canopy fixed just below the flank of every arch
  const s0 = arch.sBend + D.bandF * (arch.sStraight - arch.sBend); // canopy corner on the elbow
  // canopy edge arc of side k (between arch k and k+1): u 0..1
  const e0 = (k) => skin(k, s0, phiA, 1), e1 = (k) => skin((k + 1) % N, s0, phiA, -1);
  const edge = (k, u) => {
    const a = e0(k), b = e1(k);
    const bump = Math.sin(Math.PI * u);
    return a.lerp(b, u).addScaledVector(nSide[k], -D.inset * Math.pow(bump, 0.9)).add(V3(0, D.bulge * Math.pow(bump, 0.85), 0));
  };
  // band (border) hanging from the edge: u along, f 0 (top) .. 1 (hem); its ends hug the legs
  const band = (k, u, f, out = 0.004) => {
    const yTop0 = e0(k).y;
    const base = edge(k, u).add(V3(0, -f * D.vD, 0)).addScaledVector(nSide[k], out);
    const y = yTop0 - f * D.vD;
    const dA = skin(k, sOfY(y), phiA * 0.92, 1).sub(e0(k).add(V3(0, -f * D.vD, 0)));
    const dB = skin((k + 1) % N, sOfY(y), phiA * 0.92, -1).sub(e1(k).add(V3(0, -f * D.vD, 0)));
    return base.addScaledVector(dA, 1 - sst(0, 0.16, u)).addScaledVector(dB, 1 - sst(0, 0.16, 1 - u));
  };
  return { R, Yc, yFoot, arch, ang, dk, Lk, C, nSide, at, skin, sOfY, phiA, s0, edge, band, e0, e1 };
}

// invisible framing proxy from a list of points (layer 5, like softGoods.frameProxy)
function pointsProxy(points) {
  const pos = []; for (const q of points) pos.push(q.x, q.y, q.z);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([0, 0, 0]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff00ff }));
  m.layers.set(5); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false;
  m.userData.frameProxy = true;
  return m;
}

export function opblaasbareTent(p = {}) {
  const D = dims(p);
  const { N, r, yb, vD } = D;
  const F = frameGeom(D);
  const { R, Yc, arch, ang, dk, Lk, C, nSide, at, skin, sOfY, phiA, s0 } = F;
  const frameHex = K.col(p.color || 'wit', M.COLORS.wit);
  const canopyHex = K.col(p.canopyColor || p.color || 'wit', M.COLORS.wit);
  const print = p.canopyPrint || p.print || null;
  const tubeMat = K.pvc(frameHex, { translucent: false });
  const roofBase = K.pvc(canopyHex);
  const patchM = K.pvcPatch(print ? '#1C4A86' : canopyHex);
  const tubePatch = K.pvcPatch(frameHex);
  const threadC = M.tentThread(print ? '#1C4A86' : canopyHex), threadF = M.tentThread(frameHex);
  const dark = M.mouldedNylon('#141414');
  const steel = M.galvanised();
  const strapM = M.webbing('#151617');
  const bins = new G.PartBin();
  const loose = new G.PartBin(); // guy ropes + stakes: not framed
  const group = new THREE.Group(); group.name = `opblaasbareTent ${D.w} ${N}`;
  const water = String(p.legs || '').toLowerCase().startsWith('water');

  // ---- frame: N fat arches with gore seams across every elbow -----------------------------------
  const sB = arch.sBend, sS = arch.sStraight;
  const nG = D.hex ? 5 : 4;
  const gores = []; for (let g = 0; g <= nG; g++) gores.push(sB + ((sS - sB) * g) / nG);
  gores.push(sS + 0.55 * (arch.sApex - sS)); // one more where the straight run meets the round-over
  const pinch = (s) => { let d = 0; for (const sg of gores) d += Math.exp(-(((s - sg) / 0.022) ** 2)); return 1 - 0.045 * Math.min(1, d); };
  for (let k = 0; k < N; k++) {
    const pts = [], ss = [];
    for (let s = 0; s <= arch.total + 1e-6; s += 0.012) { const a = arch.at(Math.min(s, arch.total)); pts.push(dk[k].clone().multiplyScalar(a.rho).setY(a.y)); ss.push(s); }
    bins.add(tubeMat, K.sweep(pts, r, 48, { refUp: dk[k].clone(), rFn: (i) => r * pinch(ss[i]) }));
    // domed foot (squashed so it stands on the floor)
    bins.add(tubeMat, K.domeCap(pts[0], V3(0, -1, 0), r, F.yFoot / r - 0.004, 32));
    // gore seams: a welded welt round the tube in every waist
    for (const sg of gores) {
      const h = at(k, sg);
      const ring = [];
      for (let i = 0; i <= 64; i++) { const t = (i / 64) * TAU; ring.push(h.A.clone().addScaledVector(h.Nv, (r * pinch(sg) + 0.0018) * Math.cos(t)).addScaledVector(Lk[k], (r * pinch(sg) + 0.0018) * Math.sin(t))); }
      bins.add(tubePatch, K.sweep(ring, 0.0032, 6, { closed: true }));
    }
    // longitudinal sleeve seam on the inside of the leg up to the elbow: welt + two stitch rows
    const weld = [], st1 = [], st2 = [];
    for (let s = 0.08; s <= sB + 0.04; s += 0.04) {
      const h = at(k, s), inn = h.Nv.clone().negate();
      weld.push(h.A.clone().addScaledVector(inn, r + 0.0012));
      const t = 0.014 / r;
      st1.push(h.A.clone().addScaledVector(inn, (r + 0.0006) * Math.cos(t)).addScaledVector(Lk[k], (r + 0.0006) * Math.sin(t)));
      st2.push(h.A.clone().addScaledVector(inn, (r + 0.0006) * Math.cos(t)).addScaledVector(Lk[k], -(r + 0.0006) * Math.sin(t)));
    }
    bins.add(tubePatch, K.sweep(weld, 0.0034, 6));
    bins.add(threadF, K.sweep(st1, 0.0009, 4));
    bins.add(threadF, K.sweep(st2, 0.0009, 4));
    // welded ring where the domed foot joins the sleeve
    if (!water) {
      const C0 = C[k];
      const ring = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU; ring.push(V3(C0.x + Math.sin(a) * (r + 0.0014), F.yFoot + 0.012, C0.z + Math.cos(a) * (r + 0.0014))); }
      bins.add(tubePatch, K.sweep(ring, 0.003, 6, { closed: true }));
    }
  }
  // hub where the arches meet: a round inflated node with a reinforced top patch
  {
    const hub = new THREE.SphereGeometry(r * 1.2, 48, 24); hub.scale(1, 0.86, 1); hub.translate(0, Yc, 0);
    bins.add(tubeMat, hub);
    const capR = r * 0.62;
    const yTop = Yc + r * 1.2 * 0.86;
    const prof = []; for (let i = 0; i <= 12; i++) { const rr = (capR * i) / 12; prof.push([Math.max(1e-4, rr), yTop + 0.003 - (rr * rr) / (2 * r * 1.6)]); }
    prof.push([capR + 0.004, prof[prof.length - 1][1] - 0.006]);
    bins.add(tubePatch, G.lathe(prof.slice().reverse(), 48));
    for (const rr of [capR - 0.012]) {
      const ring = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU; ring.push(V3(Math.sin(a) * rr, yTop + 0.0035 - (rr * rr) / (2 * r * 1.6), Math.cos(a) * rr)); }
      bins.add(threadF, K.sweep(ring, 0.001, 4, { closed: true }));
    }
  }

  // ---- canopy faces: taut membranes hung under the arches ---------------------------------------
  // round 6: the faces run on to 62 % of the old stop radius, into the hub node: from under the
  // hub (LED view) their straight top edges left lens-shaped gaps and notches next to the arches
  const stopF = D.stop * 0.62;
  const s1 = arch.sAtRho(stopF);
  const NV = 48, NU = 36;
  const levels = []; for (let j = 0; j <= NV; j++) levels.push(s0 + ((s1 - s0) * j) / NV);
  const faces = [];
  const sag = -0.00004 * (D.w / 3);
  for (let k = 0; k < N; k++) {
    const k1 = (k + 1) % N;
    const left = levels.map((s) => skin(k, s, phiA, 1));
    const right = levels.map((s) => skin(k1, s, phiA, -1));
    const rows = T2.membranePatch(NU, NV, {
      pin: (i, j) => {
        if (j === 0) return F.edge(k, i / NU);
        if (i === 0) return left[j];
        if (i === NU) return right[j];
        if (j === NV) return left[j].clone().lerp(right[j], i / NU);
        return null;
      },
      init: (i, j) => left[j].clone().lerp(right[j], i / NU),
      load: [0, sag, 0],
      iters: 900,
      stress: 2,
    });
    faces.push(rows);
  }
  // two shallow tension wrinkles from each lower corner into the face (3-4 mm, tapering)
  for (let k = 0; k < N; k++) {
    const rows = faces[k];
    const nrm = rows.map((row, j) => row.map((_, i) => T2.gridNormal(rows, i, j)));
    const W0 = rows[0][0].distanceTo(rows[0][NU]), H0 = rows[0][0].distanceTo(rows[NV][0]);
    for (let j = 1; j < NV; j++) for (let i = 1; i < NU; i++) {
      const u = i / NU, v = j / NV;
      let d = 0;
      for (const side of [0, 1]) for (const [a0, len, amp] of [[0.62, 0.45, 0.0035], [1.0, 0.32, 0.0026]]) {
        const x = (side ? 1 - u : u) * W0, y = v * H0;
        const t = x * Math.cos(a0) + y * Math.sin(a0), dp = -x * Math.sin(a0) + y * Math.cos(a0);
        if (t < 0 || t > len * D.w) continue;
        const f = t / (len * D.w);
        d += amp * Math.exp(-((dp / 0.035) ** 2)) * Math.sin(Math.PI * Math.min(1, f * 1.4 + 0.08)) * (1 - f);
      }
      const e = Math.min(1, Math.min(i, NU - i, j) / 3);
      if (d > 0) rows[j][i].addScaledVector(nrm[j][i], d * e);
    }
  }
  // print uv: every face upright, the artwork's bottom at the edge
  const topFrac = faces[0][NV][0].distanceTo(faces[0][NV][NU]) / faces[0][0][0].distanceTo(faces[0][0][NU]);
  const faceUV = (i, j) => { const v = j / NV, wv = 1 - v * (1 - topFrac); return [0.5 + (i / NU - 0.5) * wv, 0.04 + 0.92 * v]; };
  const roofTex = print ? K.artwork('panel') : null;
  const roofMat = print ? K.printed(roofBase, roofTex, 'inflatable-roof3') : roofBase;
  for (let k = 0; k < N; k++) {
    if (print) {
      const uv = new Float32Array((NU + 1) * (NV + 1) * 2); let m = 0;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const t = faceUV(i, j); uv[m++] = t[0]; uv[m++] = t[1]; }
      K.addMesh(group, K.gridGeometry(faces[k], { uv1: uv }), roofMat);
    } else bins.add(roofBase, K.gridGeometry(faces[k]));
  }
  // centre disc under the hub (closes the canopy between the arch tops)
  {
    let yAvg = 0; for (let k = 0; k < N; k++) for (let i = 0; i <= NU; i++) yAvg += faces[k][NV][i].y;
    yAvg /= N * (NU + 1);
    const disc = G.lathe([[1e-4, yAvg + 0.01], [stopF * 1.05, yAvg - 0.004], [stopF * 1.08, yAvg - 0.02]], 48);
    bins.add(print ? K.pvc('#1C4A86') : roofBase, disc);
  }
  // seam where every face meets its arch (a welt tucked under the flank of the tube)
  for (let k = 0; k < N; k++) for (const [kk, sg] of [[k, 1], [(k + 1) % N, -1]]) {
    const pts = levels.map((s) => skin(kk, s, phiA - 0.12, sg, R + 0.002));
    bins.add(patchM, K.sweep(pts, 0.004, 6));
  }

  // ---- canopy edge: piping along the arc + the border band (print area) ---------------------------
  const valTex = print ? K.artwork('band') : null;
  const valMat = print ? K.printed(roofBase, valTex, 'inflatable-band3') : roofBase;
  const bandRows = [];
  for (let k = 0; k < N; k++) {
    const nx = 64, ny = 8, rows = [];
    for (let j = 0; j <= ny; j++) {
      const f = j / ny, row = [];
      for (let i = 0; i <= nx; i++) {
        const u = i / nx, bump = Math.sin(Math.PI * u);
        const wave = (0.003 * Math.sin(u * 23 + k * 1.7) + 0.002 * Math.sin(u * 51 + k)) * f * f * bump;
        row.push(F.band(k, u, f, 0.005 + 0.006 * f * bump + wave));
      }
      rows.push(row);
    }
    bandRows.push(rows);
    let uv = null;
    if (print) { uv = new Float32Array((nx + 1) * (ny + 1) * 2); let m = 0; for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { uv[m++] = i / nx; uv[m++] = 1 - j / ny; } }
    const g = K.gridGeometry(rows, { uv1: uv, flip: true }); // normals out of the tent
    if (print) K.addMesh(group, g, valMat); else bins.add(roofBase, g);
    // piping along the top, folded hem + double stitch at the bottom
    bins.add(patchM, K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.002, 0))), 0.0075, 8));
    const n = nSide[k];
    const hem = rows[ny].map((q) => q.clone().add(V3(0, 0.003, 0)).addScaledVector(n, -0.0012));
    bins.add(roofBase, K.sweep(hem, 0.0035, 6));
    for (const dy of [0.012, 0.022]) bins.add(threadC, K.sweep(rows[ny].map((q) => q.clone().add(V3(0, dy, 0)).addScaledVector(n, 0.0018)), 0.0009, 4));
  }

  // ---- feet: peg loops, or water ballast rings -----------------------------------------------------
  const blackPVC = K.pvc('#1B1C1E', { translucent: false });
  for (let k = 0; k < N; k++) {
    const C0 = C[k], n = dk[k];
    if (water) {
      const R1 = r + 0.17, H1 = 0.34;
      const prof = [[r + 0.003, 0.004], [R1 + 0.012, 0.004], [R1 + 0.03, 0.022], [R1 + 0.034, 0.09], [R1 + 0.022, H1 * 0.62], [R1 + 0.004, H1 - 0.04], [R1 - 0.02, H1 - 0.008], [R1 - 0.06, H1], [r + 0.03, H1 + 0.004], [r + 0.012, H1 + 0.03], [r + 0.003, H1 + 0.075]];
      const bag = G.lathe(prof, 64); bag.translate(C0.x, 0, C0.z); bins.add(blackPVC, bag);
      const lip = []; for (let i = 0; i <= 72; i++) { const a = (i / 72) * TAU; lip.push(V3(C0.x + Math.sin(a) * (R1 + 0.006), H1 - 0.03, C0.z + Math.cos(a) * (R1 + 0.006))); }
      bins.add(blackPVC, K.sweep(lip, 0.007, 6));
      const fc = C0.clone().addScaledVector(dirOf(ang[k] - 0.5), r + 0.1).setY(H1 - 0.006);
      bins.add(dark, G.lathe([[0.0001, 0.028], [0.026, 0.026], [0.03, 0.018], [0.03, 0.0], [0.038, 0.0], [0.038, -0.006]].reverse(), 32).translate(fc.x, fc.y, fc.z));
      const hd = dirOf(ang[k] + 0.6);
      const h0 = C0.clone().addScaledVector(hd, r + 0.05).setY(H1 + 0.002), h1 = C0.clone().addScaledVector(hd, R1 - 0.03).setY(H1 - 0.012);
      const hp = []; for (let i = 0; i <= 16; i++) { const t = i / 16; hp.push(h0.clone().lerp(h1, t).add(V3(0, 0.05 * Math.sin(Math.PI * t), 0))); }
      bins.add(strapM, T2.bandAlong(hp, hp.map(() => V3(-hd.z, 0, hd.x)), 0.03, 0.0025));
      for (const yy of [0.09, 0.22]) {
        const tab = []; for (let i = 0; i <= 10; i++) { const a = ang[k] + 1.2 - 0.18 + 0.36 * (i / 10); tab.push(C0.clone().addScaledVector(dirOf(a), R1 + 0.033).setY(yy)); }
        bins.add(strapM, T2.bandAlong(tab, tab.map((q) => V3(q.x - C0.x, 0, q.z - C0.z).normalize()), 0.04, 0.003));
      }
    } else {
      const a = C0.clone().addScaledVector(n, r * 0.92).setY(0.07);
      const ring = C0.clone().addScaledVector(n, r + 0.05).setY(0.035);
      const peg = C0.clone().addScaledVector(n, r + 0.3);
      bins.add(strapM, K.strapGeo(a, ring, 0.028, 0.002));
      const tor = new THREE.TorusGeometry(0.02, 0.0042, 8, 20); tor.rotateY(Math.atan2(n.x, n.z) + Math.PI / 2); tor.translate(ring.x, ring.y, ring.z); bins.add(steel, tor);
      bins.add(strapM, K.strapGeo(ring, peg.clone().setY(0.012), 0.025, 0.002));
      bins.add(steel, K.stakeGeo(peg, n.clone().negate(), { len: 0.05, r: 0.005 }));
    }
  }
  // guy ropes from a webbing loop on the outside of every elbow out to a stake
  if (!water) {
    const ropeM = K.ropeMat(K.lumOf(canopyHex) > 0.55 && !print ? '#E4E2DC' : '#232426');
    const sL = sB + 0.45 * (sS - sB);
    // skipGuys: 'left' / 'right' / 'front' / 'back' drops the ropes on that side (two tents
    // joined by a tunnel have no ropes across the tunnel)
    const skip = String(p.skipGuys || '').toLowerCase();
    const skipDir = { right: V3(1, 0, 0), left: V3(-1, 0, 0), front: V3(0, 0, 1), back: V3(0, 0, -1) }[skip];
    for (let k = 0; k < N; k++) {
      if (skipDir && dk[k].dot(skipDir) > 0.3) continue;
      const h = at(k, sL);
      const att = h.A.clone().addScaledVector(h.Nv, r + 0.004);
      const out = dk[k];
      const loopEnd = att.clone().addScaledVector(out, 0.05).add(V3(0, -0.02, 0));
      bins.add(strapM, K.strapGeo(att.clone().add(V3(0, 0.02, 0)), loopEnd, 0.025, 0.002));
      const tor = new THREE.TorusGeometry(0.016, 0.0035, 8, 18); tor.rotateY(ang[k] + Math.PI / 2); tor.translate(loopEnd.x, loopEnd.y, loopEnd.z); bins.add(steel, tor);
      const stake = C[k].clone().addScaledVector(out, 0.55 + 0.1 * D.w).setY(0);
      const ropeA = loopEnd.clone().addScaledVector(out, 0.014);
      loose.add(ropeM, K.rope(ropeA, stake.clone().setY(0.06), 0.0032, 0.004));
      const tp = ropeA.clone().lerp(stake.clone().setY(0.06), 0.62);
      const tg = G.roundedBox(0.012, 0.05, 0.02, 0.004); tg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), stake.clone().setY(0.06).sub(ropeA).normalize())); tg.translate(tp.x, tp.y, tp.z);
      loose.add(dark, tg);
      loose.add(steel, K.stakeGeo(stake, out.clone().negate(), { len: 0.08, r: 0.007 }));
    }
  }
  // Boston valve on the leg nearest the hero camera
  {
    const k = 0, C0 = C[k];
    const n = dirOf(ang[k] - 0.25);
    const y0 = water ? 0.62 : 0.55;
    const v0 = C0.clone().addScaledVector(n, r - 0.002).setY(y0);
    const q = new THREE.Quaternion().setFromUnitVectors(Y, n);
    const valve = G.lathe([[0.0001, 0.034], [0.022, 0.034], [0.028, 0.03], [0.03, 0.022], [0.03, 0.014], [0.036, 0.012], [0.046, 0.006], [0.05, 0.0], [0.05, -0.004]].reverse(), 40);
    valve.applyQuaternion(q); valve.translate(v0.x, v0.y, v0.z);
    bins.add(dark, valve);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      const rib = G.roundedBox(0.004, 0.012, 0.004, 0.0015);
      rib.translate(Math.cos(a) * 0.03, 0.026, Math.sin(a) * 0.03);
      rib.applyQuaternion(q); rib.translate(v0.x, v0.y, v0.z);
      bins.add(dark, rib);
    }
    const t0 = v0.clone().addScaledVector(n, 0.03).add(V3(0, -0.02, 0)), t1 = C0.clone().addScaledVector(n, r + 0.003).setY(y0 - 0.1);
    bins.add(dark, K.sweep(K.ropePts(t0, t1, 0.05, 8), 0.0025, 6));
  }

  // ---- side walls in the arched openings ------------------------------------------------------------
  // type 'closed': a plain wall; 'tunnel': a wall with an arched doorway where the
  // verbindingstunnel zips on (opblaasbareTunnel uses the same doorway profile, tunnelDoor())
  const walls = parseWalls(p.walls);
  const wallSides = [], wallType = {}, wallName = {};
  for (const [name, type] of Object.entries(walls)) {
    if (!type || type === 'none' || type === 'open') continue;
    const target = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 }[name];
    if (target == null) continue;
    let best = 0, bd = 9;
    nSide.forEach((n, k) => { const a = Math.atan2(n.x, n.z); const d = Math.abs(Math.atan2(Math.sin(a - target), Math.cos(a - target))); if (d < bd) { bd = d; best = k; } });
    if (!wallSides.includes(best)) { wallSides.push(best); wallType[best] = String(type); wallName[best] = name; }
  }
  // full-colour printed wall: type 'print', or `wallPrint: {artwork, side}` on that side
  const wpSide = p.wallPrint && typeof p.wallPrint === 'object' ? String(p.wallPrint.side || 'back') : null;
  const isPrintWall = (k) => wallType[k] === 'print' || (wpSide != null && wallName[k] === wpSide && wallType[k] !== 'tunnel');
  const wallPrintMat = wallSides.some(isPrintWall) ? K.printed(K.pvc(K.col(p.wallColor || 'wit', M.COLORS.wit)), K.artwork('panel'), 'inflatable-wall') : null;
  const wallMat = K.pvc(K.col(p.wallColor || p.canopyColor || p.color || 'wit', M.COLORS.wit));
  const wallPatch = K.pvcPatch(K.col(p.wallColor || p.canopyColor || p.color || 'wit', M.COLORS.wit));
  const zipM = M.zipTooth('#151516');
  const door = tunnelDoor(D, F);
  for (const k of wallSides) {
    const n = nSide[k], k1 = (k + 1) % N;
    const isTunnel = wallType[k] === 'tunnel';
    const nx = Math.round(D.w * 24), ny = 44;
    const top = (u) => F.band(k, u, 1, -0.012).add(V3(0, 0.03, 0)); // tucked behind the band hem
    const yEnd = top(0).y;
    const flank = (kk, sg, y) => {
      if (y <= yb) { const c = C[kk]; const d = dk[kk].clone().multiplyScalar(Math.cos(phiA * 0.95)).addScaledVector(Lk[kk], sg * Math.sin(phiA * 0.95)); return c.clone().addScaledVector(d, r + 0.006).setY(y); }
      return skin(kk, sOfY(y), phiA * 0.95, sg, r + 0.006);
    };
    // a doorway wall is held flat by the tunnel: less belly, no hem folds
    const bellyA = isTunnel ? 0.008 : 0.025, foldA = isTunnel ? 0.3 : 1;
    const wallPt = (u, y) => {
      const T = top(u);
      const fy = y / Math.max(0.01, T.y);
      const yy = Math.min(y, yEnd);
      const lin = flank(k, 1, yy).lerp(flank(k1, -1, yy), u).setY(y);
      const bump = Math.sin(Math.PI * u);
      const toTop = T.clone().setY(y).sub(lin).multiplyScalar(sst(0.5, 1, fy) * Math.min(1, bump * 3));
      const belly = bellyA * bump * Math.sin(Math.PI * Math.min(1, fy * 0.85 + 0.15));
      const folds = foldA * (0.008 * Math.sin(u * D.w * 4.1 + 0.7) + 0.005 * Math.sin(u * D.w * 9.7 + 2.1)) * (1 - fy) * bump;
      const kick = y < 0.05 ? (0.05 - y) * 0.45 : 0;
      return lin.add(toTop).addScaledVector(n, belly + folds + kick);
    };
    const Wopen = flank(k, 1, 1).distanceTo(flank(k1, -1, 1));
    const rows = [];
    for (let j = 0; j <= ny; j++) {
      const v = j / ny, row = [];
      for (let i = 0; i <= nx; i++) { const u = i / nx; row.push(wallPt(u, Math.max(0.004, v * top(u).y))); }
      rows.push(row);
    }
    const g = K.gridGeometry(rows);
    if (isTunnel) {
      // cut the doorway: drop every cell whose centre lies inside the profile (the trim below
      // covers the stepped cut edge)
      const keep = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const u = (i + 0.5) / nx, y = ((j + 0.5) / ny) * top(u).y;
        const yd = door.yAt((u - 0.5) * Wopen);
        if (yd > 0 && y < yd) continue;
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        keep.push(a, b, c, b, d, c);
      }
      g.setIndex(keep); g.computeVertexNormals();
    }
    if (wallPrintMat && isPrintWall(k)) {
      // the sample design upright on the wall as seen from outside: u left -> right, v up from the
      // hem to the crown of the arch
      const right = V3().crossVectors(n.clone().negate(), V3(0, 1, 0));
      const flipU = flank(k1, -1, 1).sub(flank(k, 1, 1)).dot(right) < 0;
      let yMax = 0; for (let i = 0; i <= nx; i++) yMax = Math.max(yMax, top(i / nx).y);
      const uv1 = new Float32Array((nx + 1) * (ny + 1) * 2); let m = 0;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const u = i / nx; uv1[m++] = flipU ? 1 - u : u; uv1[m++] = Math.min(1, rows[j][i].y / yMax); }
      const gp = K.gridGeometry(rows, { uv1 });
      if (isTunnel) gp.setIndex(g.index);
      gp.computeVertexNormals();
      K.addMesh(group, gp, wallPrintMat);
    } else bins.add(wallMat, g);
    // folded hem on the floor (interrupted by a doorway)
    const hemRuns = [[]];
    for (let i = 0; i <= nx; i++) {
      const inDoor = isTunnel && Math.abs((i / nx - 0.5) * Wopen) < door.hw;
      if (inDoor) { if (hemRuns[hemRuns.length - 1].length) hemRuns.push([]); continue; }
      hemRuns[hemRuns.length - 1].push(rows[0][i].clone().add(V3(0, 0.004, 0)));
    }
    for (const run of hemRuns) if (run.length > 1) bins.add(wallMat, K.sweep(run, 0.004, 5));
    // zips down both legs
    for (const [kk, sg] of [[k, 1], [k1, -1]]) {
      const zp = []; for (let i = 0; i <= 30; i++) { const y = 0.03 + ((yEnd - 0.06) * i) / 30; zp.push(flank(kk, sg, y).addScaledVector(n, 0.004)); }
      bins.add(zipM, K.sweep(zp, 0.0045, 5));
    }
    if (isTunnel) {
      // doorway: a 7 cm welded facing round the opening with the zip that takes the tunnel
      const outline = [];
      for (let i = 0; i <= 120; i++) { const [d, y] = door.sect(i / 120); outline.push(wallPt(0.5 + d / Wopen, Math.max(0.006, y))); }
      const off = (q, f) => q.clone().addScaledVector(n, f);
      // facing band, centred on the cut edge
      const fp = outline.map((q) => off(q, 0.003)), fn = outline.map(() => n.clone());
      bins.add(wallPatch, T2.bandAlong(fp, fn, 0.075, 0.003));
      bins.add(zipM, K.sweep(outline.map((q) => off(q, 0.0075)), 0.0048, 5));
    }
  }

  // ---- front awning (luifel): tensioned membrane on two poles ----------------------------------------
  if (p.awning) {
    let kF = 0; for (let k = 1; k < N; k++) if (nSide[k].z > nSide[kF].z) kF = k;
    const n = nSide[kF];
    const ea = F.band(kF, 0, 1), eb = F.band(kF, 1, 1);
    const along = eb.clone().sub(ea).normalize();
    const depth = D.depth, yOut = ea.y - 0.22;
    const poleA = ea.clone().addScaledVector(n, depth).addScaledVector(along, -0.1).setY(yOut);
    const poleB = eb.clone().addScaledVector(n, depth).addScaledVector(along, 0.1).setY(yOut);
    const nu = 44, nv = 22;
    const inner = (i) => F.band(kF, i / nu, 0.92, 0.012);
    const rowsA = T2.membranePatch(nu, nv, {
      pin: (i, j) => {
        if (j === 0) return inner(i);
        if (j === nv && i === 0) return poleA;
        if (j === nv && i === nu) return poleB;
        return null;
      },
      init: (i, j) => inner(i).lerp(poleA.clone().lerp(poleB, i / nu), j / nv),
      q: (i, j, dir) => {
        if (dir === 'u' && j === nv) return 9;
        if (dir === 'v' && (i === 0 || i === nu)) return 7;
        return 1;
      },
      load: [0, -0.00012, 0],
      iters: 1400,
    });
    let uvA = null;
    if (print) { uvA = new Float32Array((nu + 1) * (nv + 1) * 2); let m = 0; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { uvA[m++] = i / nu; uvA[m++] = 1 - j / nv; } }
    const awGeo = K.gridGeometry(rowsA, { uv1: uvA, flip: true }); // normals up
    if (print) K.addMesh(group, awGeo, valMat); else bins.add(roofBase, awGeo);
    const free = [];
    for (let j = 0; j <= nv; j++) free.push(rowsA[j][0]);
    for (let i = 1; i <= nu; i++) free.push(rowsA[nv][i]);
    for (let j = nv - 1; j >= 0; j--) free.push(rowsA[j][nu]);
    bins.add(patchM, K.sweep(free.map((q) => q.clone().add(V3(0, -0.002, 0))), 0.007, 8));
    bins.add(patchM, K.sweep(rowsA[0].map((q) => q.clone().add(V3(0, 0.003, 0))), 0.008, 8));
    const alu = M.aluminium({ roughness: 0.3 });
    const ropeM = K.ropeMat(K.lumOf(canopyHex) > 0.5 ? '#E6E4DE' : '#2A2B2D');
    for (const [topP, sgn] of [[poleA, -1], [poleB, 1]]) {
      const foot = topP.clone().setY(0);
      bins.add(alu, G.tube(foot.clone().setY(0.008), topP.clone().add(V3(0, -0.006, 0)), 0.016, 18, { caps: true }));
      bins.add(steel, G.tube(topP.clone().add(V3(0, -0.01, 0)), topP.clone().add(V3(0, 0.07, 0)), 0.005, 10, { caps: true }));
      bins.add(steel, K.footPlate(foot.x, foot.z, 0.1, 0.006));
      const grom = new THREE.TorusGeometry(0.014, 0.0035, 8, 20); grom.rotateX(Math.PI / 2); grom.translate(topP.x, topP.y + 0.004, topP.z); bins.add(steel, grom);
      for (const spread of [0.55, -0.15]) {
        const gd = n.clone().addScaledVector(along, sgn * spread).normalize();
        // the awning's guy ropes count for the framing (they are part of the product; noFrame
        // ropes ran out of the image at the left)
        const stake = foot.clone().addScaledVector(gd, 1.05);
        bins.add(ropeM, K.rope(topP.clone().add(V3(0, 0.05, 0)), stake.clone().setY(0.06), 0.0035, 0.004));
        bins.add(steel, K.stakeGeo(stake, gd.clone().negate(), { len: 0.07, r: 0.006 }));
      }
    }
  }

  // ---- LED lamp under the hub ------------------------------------------------------------------------
  let lampPos = null;
  const light = p.light ? (typeof p.light === 'object' ? p.light : { watt: 12, on: true }) : null;
  if (light) {
    const on = light.on !== false;
    const Rl = 0.11, Tl = 0.038;
    lampPos = V3(0, Yc - r * 1.05 - 0.32, 0);
    // anthracite die-cast housing: the fixture reads against the white canopy
    const housing = new THREE.MeshPhysicalMaterial({ color: '#2E3033', roughness: 0.45, metalness: 0.2, clearcoat: 0.3, name: 'lamp housing' });
    const lampG = G.lathe([[0.0001, Tl], [Rl - 0.01, Tl], [Rl, Tl - 0.008], [Rl, 0.008], [Rl - 0.008, 0.0], [0.0001, 0.0]].reverse(), 64);
    lampG.translate(lampPos.x, lampPos.y, lampPos.z);
    bins.add(housing, lampG);
    const diff = on
      ? new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#FFF4E8'), emissiveIntensity: 3.2, roughness: 0.5, name: 'diffuser on' })
      : new THREE.MeshPhysicalMaterial({ color: '#E9E8E4', roughness: 0.35, name: 'diffuser off' });
    const dg = G.lathe([[0.0001, -0.002], [Rl - 0.014, -0.0015], [Rl - 0.01, 0.002], [0.0001, 0.002]], 64);
    dg.translate(lampPos.x, lampPos.y, lampPos.z);
    bins.add(diff, dg);
    const hubY = Yc - r * 1.0;
    bins.add(strapM, K.strapGeo(lampPos.clone().add(V3(0, Tl, 0)), V3(0, hubY, 0), 0.025, 0.002, V3(1, 0, 0)));
    const cab = [];
    for (let s = arch.total - 0.3; s >= sB - 0.4; s -= 0.08) { const h = at(1, s); cab.push(h.A.clone().addScaledVector(h.Nv, -(r + 0.006))); }
    cab.unshift(lampPos.clone().add(V3(0.02, Tl * 0.5, 0)));
    bins.add(M.rubber('#E8E8E6'), K.sweep(cab, 0.003, 6));
    if (on) {
      const watt = Number(light.watt ?? 12);
      // 4000 K neutral white (the product spec), not a warm 3000 K cream
      group.add(T2.pointLight(lampPos.clone().add(V3(0, -0.05, 0)), { color: '#FFF0DE', intensity: 0.55 * watt, decay: 2 }));
      const halo = LK.haloSpheres([{ c: lampPos.clone().add(V3(0, -0.01, 0)), R: 0.36, color: LK.lin('#FFF3E6', 1.6), a: 0.45, core: 0.2, coreW: 0.7 }]);
      if (halo) group.add(halo);
      const fg = LK.floorGlow([{ p: lampPos, I: 0.9, color: LK.lin('#FFD9A8', 1.0) }], { box: 2.2, res: 90, k: 0.6, max: 0.22 });
      if (fg) group.add(fg);
    }
  }

  bins.build(group);
  const looseG = new THREE.Group(); loose.build(looseG); T2.noFrame(looseG); group.add(looseG);

  // framing: a fixed footprint (legs + 0.3 m) and the hub top, so every colour / leg variant of a
  // size is framed the same; the lamp view frames the lamp and the hub only
  let lowView = null;
  if (light) {
    group.traverse((o) => { if (o.isMesh) o.userData.noFrame = true; });
    // round 7 ("broken geometry: tubes cut flat by the near plane, the knot missing, the lamp's
    // rod ending in mid-air, not readable as the inside of a tent"): the camera now stands just
    // outside the open front, 25 cm off the floor, and looks up under the front band into the
    // tent: the front band across the top, the lamp burning under the hub with the four arches
    // converging on the knot, the lit canopy round it, the back arch and its legs down to the
    // floor inside. Nothing is closer than ~1 m, so nothing reaches the near plane. The camera
    // is fixed by a proxy rectangle square to the view (the auto-framing puts the camera exactly
    // where the rectangle fills the frame).
    const fv = fixedView(V3(0.55, 0.3, D.w / 2 + 1.15 * (D.w / 3)), V3(0, lampPos.y - 0.34, 0), { fov: 38, fill: 0.9 });
    group.add(fv.proxy);
    lowView = fv.view;
  } else {
    const pts = [];
    for (let k = 0; k < N; k++) for (let i = -2; i <= 2; i++) pts.push(C[k].clone().add(dirOf(ang[k] + i * 0.35).multiplyScalar(r + 0.3)));
    // the top of the frame box is the size's standard height, so a lower tent (waterpoten 3.2 m)
    // stands in exactly the same frame as its siblings instead of being zoomed in
    pts.push(V3(0, Math.max(D.Hc, dims({ w: D.w, shape: D.hex ? 'hex' : '' }).Hc) + 0.02, 0));
    group.add(pointsProxy(pts));
  }

  // the hexagon is seen almost square onto a flat side and from a little higher: from the
  // standard 34 / 17 its back arches stacked behind the front ones and it read as a 4-leg tent
  const az0 = D.hex ? 12 : 34;
  let heroAz = az0;
  const closedSides = wallSides.filter((k) => wallType[k] !== 'tunnel');
  if (closedSides.length && p.heroAzimuth == null) {
    // of the views that show the most walls from outside, the one with the walls on the key side
    // (image left, the softbox comes from camera left): a wall is the product of these pictures
    // and its colour must read, not sit in the shade of the arch
    let best = -1;
    for (const az of [az0, -az0, 180 - az0, az0 - 180]) {
      const cd = dirOf(az * Math.PI / 180), lit = dirOf((az - az0) * Math.PI / 180);
      const sc = closedSides.reduce((acc, k) => acc + (nSide[k].dot(cd) > 0.25 ? 1 : 0) + 0.01 * nSide[k].dot(lit), 0);
      if (sc > best) { best = sc; heroAz = az; }
    }
  } else if (p.heroAzimuth != null) heroAz = Number(p.heroAzimuth);

  const rigBase0 = T2.tentRig2(canopyHex, { walled: wallSides.length > 0, print: !!print });
  // the fat legs are vertical cylinders: a wider softbox bundle aimed a little lower than for an
  // easy-up roof lights them like the band; the roof keeps its values
  const rigBase = { ...rigBase0, key: { ...rigBase0.key, angle: Math.max(rigBase0.key.angle || 40, 50), aimRel: [0.1, 0.25, 0.6] } };
  const rig = { default: rigBase };
  if (K.lumOf(frameHex) > 0.7) rig.default = { ...rigBase, bounce: { azimuth: -10, elevation: -18, intensity: 3.5 } };
  if (light) {
    rig.low = {
      key: { intensity: 1.3 }, dome: { intensity: 0.9 }, fill: { intensity: 0.9 }, exposure: 0.3,
      groundAO: { strength: 0.2 }, edgeFade: 0.0,
    };
  }
  const kP = N === 4 ? 3 : 5;
  return {
    object: group,
    detail: { target: [C[0].x * 0.9, yb + 0.2, C[0].z * 0.9], size: 1.6, azimuth: heroAz, elevation: 12 },
    view: {
      hero: { azimuth: heroAz, elevation: D.hex ? 24 : 17 },
      back: { azimuth: heroAz + 180 },
      // straight up under the hub, square onto the X of the four arches, the lamp in the middle
      // (round 3's 24 / -38 / fov 62 showed a burnt-out roof and a tiny disc)
      // round 6: straight up under the hub read as an abstract upward crop with the lamp a small
      // disc: now from just inside the entrance, looking up ~24 deg at the lamp (diffuser and
      // housing both read), the hub with the arches converging above it, the lit canopy around
      ...(lowView ? { low: lowView } : {}),
    },
    rig,
    meta: {
      N, w: D.w, r, yb, Hc: D.Hc, alpha: (arch.alpha * 180) / Math.PI,
      probes: {
        roofLit: faces[kP][Math.round(NV * 0.35)][Math.round(NU * 0.35)].toArray(),
        legLit: C[0].clone().addScaledVector(dirOf(ang[0] - 0.5), r).setY(1.2).toArray(),
        band: bandRows[kP][4][24].toArray(),
      },
    },
  };
}

function parseWalls(walls) {
  const out = {};
  if (!walls) return out;
  if (walls === 'all' || walls === true) return { front: 'closed', back: 'closed', left: 'closed', right: 'closed' };
  if (typeof walls === 'string') { for (const w of walls.split(',')) { const [s, t = 'closed'] = w.split(':'); out[s.trim()] = t; } return out; }
  if (Array.isArray(walls)) { for (const w of walls) { if (typeof w === 'string') { const [s, t = 'closed'] = w.split(':'); out[s] = t; } } return out; }
  return { ...walls };
}

// ---------------------------------------------------------------------------------------------
// Doorway of the verbindingstunnel, shared by the tent wall (walls: {right: 'tunnel'}) and the
// tunnel itself: straight jambs up to wallH, then a half ellipse to Htop under the band hem.
// d: horizontal offset from the middle of the opening; sect(u) walks the outline from the
// floor on the left over the top to the floor on the right.
export function tunnelDoor(D, F) {
  const bandLow = F.band(0, 0.5, 1).y;
  const Htop = Math.min(2.2, bandLow - 0.16);
  const hw = Math.min(0.82, (D.w / 2 - D.r) * 0.62);
  const wallH = Math.max(0.8, Htop - hw * 1.15);
  const ry = Htop - wallH;
  const yAt = (d) => { const a = Math.abs(d) / hw; return a >= 1 ? -1 : wallH + ry * Math.sqrt(1 - a * a); };
  const La = (Math.PI * Math.sqrt((hw * hw + ry * ry) / 2)) / 2;
  const tot = 2 * wallH + 2 * La;
  const sect = (u) => {
    const s = u * tot;
    if (s <= wallH) return [-hw, s];
    if (s >= tot - wallH) return [hw, tot - s];
    const a = Math.PI * (1 - (s - wallH) / (2 * La));
    return [Math.cos(a) * hw, wallH + Math.sin(a) * ry];
  };
  return { hw, wallH, Htop, ry, yAt, sect, tot };
}

// Verbindingstunnel (round 4: the art director read the round-3 box as "a flat box between two
// open-sided tents"). The tunnel is a vaulted corridor (jambs + half-ellipse vault, Quonset
// profile) between two tents of width tentW standing in line along X, `length` metres between
// their facing legs (tent centres at x = -/+ (tentW / 2 + length / 2)). Both tents carry a wall
// with an arched doorway on the facing side (walls: {right|left: 'tunnel'}); the tunnel zips
// into those doorways. Two fat inflated arches (the "2 luchtbogen", one with the valve) stand
// just inside its ends as ribs on the outside of the cloth; the cloth sags between them.
//   { length (m between the facing legs' skins), color, tentW (3) }
export function opblaasbareTunnel(p = {}) {
  const tentW = Number(p.tentW ?? 3);
  const Dt = dims({ w: tentW });
  const Ft = frameGeom(Dt);
  const door = tunnelDoor(Dt, Ft);
  const hex = K.col(p.color || 'wit', M.COLORS.wit);
  const fab = K.pvc(hex);
  const tubeMat = K.pvc(hex, { translucent: false });
  const patchM = K.pvcPatch(hex);
  const threadM = M.tentThread(hex);
  const dark = M.mouldedNylon('#141414');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'opblaasbareTunnel';
  const gap = Number(p.length ?? 1.4);
  const c0 = gap / 2 + tentW / 2; // tent centres at x = +-c0
  // plane of the doorway wall (side k = 0 of a tent faces +x)
  const fl = (kk, sg) => Ft.C[kk].clone().addScaledVector(Ft.dk[kk].clone().multiplyScalar(Math.cos(Ft.phiA * 0.95)).addScaledVector(Ft.Lk[kk], sg * Math.sin(Ft.phiA * 0.95)), Dt.r + 0.006);
  const dW = fl(0, 1).add(fl(1, -1)).multiplyScalar(0.5).x;
  const xE = c0 - dW - 0.004;                // cloth ends just inside the doorway facing
  const rt = 0.095, xa = xE - 0.17;          // arches just inside the ends
  const { wallH, ry } = door;
  // outward normal of the profile at u
  const nrmAt = (u) => {
    const [a0, b0] = door.sect(Math.max(0, u - 0.004)), [a1, b1] = door.sect(Math.min(1, u + 0.004));
    const tz = a1 - a0, ty = b1 - b0, l = Math.hypot(tz, ty) || 1;
    return [-ty / l, tz / l]; // (z, y), pointing out of the tunnel
  };
  const nU = 112, nX = 44;
  const rows = [];
  for (let j = 0; j <= nX; j++) {
    const x = -xE + (2 * xE * j) / nX;
    // sag: deep between the arches, a little between an arch and the doorway
    let sg;
    if (Math.abs(x) <= xa) sg = 0.04 * Math.sin((Math.PI * (x + xa)) / (2 * xa));
    else sg = 0.012 * Math.sin((Math.PI * (Math.abs(x) - xa)) / (xE - xa));
    const row = [];
    for (let i = 0; i <= nU; i++) {
      const u = i / nU, [d, y] = door.sect(u), [nz, ny] = nrmAt(u);
      const topW = Math.max(0, (y - wallH) / ry);                      // 0 on the jambs, 1 at the crown
      const low = Math.min(1, y / 0.25);                                // hem rests on the floor
      const wr = 0.004 * Math.sin(i * 0.37 + j * 0.9) * Math.sin(Math.PI * j / nX);
      const inw = sg * (0.55 + 0.45 * topW) * low + wr;
      row.push(V3(x, Math.max(0.004, y - ny * inw), d - nz * inw));
    }
    rows.push(row);
  }
  bins.add(fab, K.gridGeometry(rows));
  // hems on the floor along both sides
  for (const i of [0, nU]) bins.add(fab, K.sweep(rows.map((row) => row[i].clone().setY(0.006)), 0.005, 5));
  // two inflated arches: ribs on the outside of the cloth, gore welts on the round-over
  for (const sx of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const u = i / 140, [d, y] = door.sect(u), [nz, ny] = nrmAt(u);
      pts.push(V3(sx * xa, y + ny * (rt + 0.002), d + nz * (rt + 0.002)));
    }
    const arc = pts.filter((q) => q.y >= rt * 0.55);
    bins.add(tubeMat, K.sweep(arc, rt, 36, { capStart: true, capEnd: true }));
    for (const q of [arc[0], arc[arc.length - 1]]) bins.add(tubeMat, K.domeCap(q, V3(0, -1, 0), rt, 0.6, 24));
    for (const f of [0.3, 0.42, 0.5, 0.58, 0.7]) {
      const i = Math.round(f * (arc.length - 1)), c = arc[i];
      const t = arc[Math.min(arc.length - 1, i + 1)].clone().sub(arc[Math.max(0, i - 1)]).normalize();
      const a = V3(1, 0, 0), b = V3().crossVectors(t, a).normalize();
      const ring = []; for (let k = 0; k <= 48; k++) { const an = (k / 48) * TAU; ring.push(c.clone().addScaledVector(a, (rt + 0.0016) * Math.cos(an)).addScaledVector(b, (rt + 0.0016) * Math.sin(an))); }
      bins.add(patchM, K.sweep(ring, 0.0026, 5, { closed: true }));
    }
    // Boston valve on the near jamb of the right arch
    if (sx > 0) {
      const i = Math.round(0.9 * (arc.length - 1)), c = arc[i];
      const n = V3(0, 0, 1);
      const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), n);
      const valve = G.lathe([[0.0001, 0.03], [0.02, 0.03], [0.026, 0.024], [0.026, 0.012], [0.034, 0.008], [0.04, 0.0], [0.04, -0.004]].reverse(), 32);
      valve.applyQuaternion(q); valve.translate(c.x, 0.7, c.z + rt - 0.004);
      bins.add(dark, valve);
    }
  }
  // sewn seam along the vault crest
  const crest = rows.map((row) => row[nU / 2].clone().add(V3(0, 0.003, 0)));
  bins.add(patchM, K.sweep(crest, 0.0035, 6));
  bins.add(threadM, K.sweep(crest.map((q) => q.clone().add(V3(0, 0.0, 0.012))), 0.0009, 4));
  bins.add(threadM, K.sweep(crest.map((q) => q.clone().add(V3(0, 0.0, -0.012))), 0.0009, 4));
  // welt where the jambs turn into the vault (one each side)
  for (const u of [door.wallH / door.tot, 1 - door.wallH / door.tot]) {
    const i = Math.round(u * nU);
    bins.add(patchM, K.sweep(rows.map((row) => row[i].clone()), 0.003, 5));
  }
  bins.build(group);
  return { object: group, rig: { default: T2.tentRig2(hex) }, meta: { gap, xE, door: { hw: door.hw, wallH: door.wallH, Htop: door.Htop } } };
}
