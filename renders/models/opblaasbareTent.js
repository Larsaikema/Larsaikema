// Opblaasbare promotietent (inflatable X-frame gazebo) and its connection tunnel.
//
// Construction (inflatable event tents of the X-frame type, rebuilt round 2):
//  - one airtight TPU bladder frame inside sewn, coated polyester sleeves in the frame colour:
//    N legs (4, or 6 on the hexagon) that stand straight up to ~2.1 m, bend inward with a
//    generous radius and continue as hip arches that meet at the apex (an X, or a six-point
//    star). Tube diameter 26 cm on 3 x 3, 32 cm on 4 x 4, 42 cm on the 8 m hexagon. There is no
//    eave beam: the canopy edge between the legs is held by its own tension;
//  - every leg sleeve has a sewn longitudinal seam (welt + two stitch rows) on the inside, a
//    welded ring seam above a dark anti-wear base patch, a closed domed foot with a webbing
//    loop, D-ring and peg strap; one leg carries the Boston valve (flange, screw cap, tether);
//  - one canopy pulled over the frame: over every hip arch it wraps the tube (a rounded
//    ridge, taped hip seam on top), the faces between the hips are taut membranes (force-density
//    form finding: they relax to a straighter profile than the hips and dish a little), at each
//    leg top the canopy forms a pocket round the bend. A piped eave edge all round, a vertical
//    valance (print area) between the legs with a double-stitched hem, the valance ends tied to
//    the legs with two velcro straps across the exposed leg corner; a round reinforced top patch;
//  - `legs: 'water'`: a black PVC water ballast ring round every leg base (welded equator seam,
//    fill cap, velcro closure) instead of pegs;
//  - optional: closed side walls between the legs (`walls: {back: 'closed'}`), a front awning
//    (`awning: 'front'`): a tensioned membrane with concave free edges and a kedder hem on two
//    aluminium poles with V guy ropes; a full-colour printed canopy (`canopyPrint`, every face and
//    valance upright, seams on the hips); `light: {watt, on}`: LED lamp under the apex (with a
//    low viewpoint from inside looking up at it); and the tunnel (`opblaasbareTunnel`).
// Units: metres, Y up, front +Z.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';
import * as LK from '../js/lightKit.js';

const { V3, TAU } = K;
const dirOf = (a) => V3(Math.sin(a), 0, Math.cos(a));
const Y = V3(0, 1, 0);

function dims(p) {
  const hex = String(p.shape || '').toLowerCase().startsWith('hex') || Number(p.legs) === 6;
  const w = Number(p.w ?? p.diameter ?? (hex ? 8 : 3));
  if (hex) {
    const r = 0.19;
    return { N: 6, w, r, Rc: w / 2 - r, Hc: Number(p.height ?? 4.9), yb: 2.62, Rb: 0.5, Ra: 1.9, vD: 0.36, depth: 2.2, cap: 0.5, stop: 0.42 };
  }
  const pro = w >= 3.9;
  const r = pro ? 0.14 : 0.115;
  return {
    N: 4, w, r, Rc: (w / 2 - r) * Math.SQRT2, Hc: Number(p.height ?? (pro ? 3.75 : 3.3)),
    yb: pro ? 2.24 : 2.16, Rb: pro ? 0.3 : 0.25, Ra: pro ? 1.2 : 0.9, vD: pro ? 0.28 : 0.25,
    depth: pro ? 1.7 : 1.4, cap: pro ? 0.38 : 0.33, stop: pro ? 0.31 : 0.27,
  };
}

export function opblaasbareTent(p = {}) {
  const D = dims(p);
  const { N, r, Rc, Hc, yb, Rb, Ra, vD } = D;
  const c = 0.012, R = r + c; // cloth clearance over the tubes
  const Yc = Hc - R;
  const arch = T2.archCurve({ Rc, yb, Yc, Rb, Ra, yFoot: r * 0.8 });
  const frameHex = K.col(p.color || 'wit', M.COLORS.wit);
  const canopyHex = K.col(p.canopyColor || p.color || 'wit', M.COLORS.wit);
  const print = p.canopyPrint || p.print || null;
  const tubeMat = K.pvc(frameHex, { translucent: false });
  const roofBase = K.pvc(canopyHex);
  const patchM = K.pvcPatch(print ? '#1C4A86' : canopyHex);
  const tubePatch = K.pvcPatch(frameHex);
  const threadC = M.tentThread(print ? '#1C4A86' : canopyHex), threadF = M.tentThread(frameHex);
  const veloM = M.webbing('#17181A');
  const baseHex = '#2A2B2E';
  const baseM = K.pvc(baseHex, { translucent: false });
  const dark = M.mouldedNylon('#141414');
  const steel = M.galvanised();
  const strapM = M.webbing('#151617');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `opblaasbareTent ${D.w} ${N}`;

  // ---- layout ---------------------------------------------------------------------------------
  const ang = [], dk = [], Lk = [], C = [];
  for (let k = 0; k < N; k++) {
    const a = Math.PI / N + (k * TAU) / N;
    ang.push(a); dk.push(dirOf(a)); Lk.push(dirOf(a + Math.PI / 2)); C.push(dirOf(a).multiplyScalar(Rc));
  }
  const nSide = []; for (let k = 0; k < N; k++) nSide.push(dirOf(ang[k] + Math.PI / N));
  const cosHalf = Math.cos(Math.PI / N);

  // hip frame at arc length s on hip k
  function hip(k, s) {
    const a = arch.at(s);
    const A = dk[k].clone().multiplyScalar(a.rho).setY(a.y);
    const Nv = dk[k].clone().multiplyScalar(a.ty).add(V3(0, -a.tr, 0)).normalize();
    const th = Math.atan2(a.ty, -a.tr); // tangent angle above horizontal
    const beta = Math.atan2(Math.sin(th), Math.cos(th) * cosHalf); // face pitch
    const nf = nSide[k].clone().multiplyScalar(Math.sin(beta)).add(V3(0, Math.cos(beta), 0));
    const phiD = Math.atan2(nf.dot(Lk[k]), nf.dot(Nv));
    return { A, Nv, phiD, a };
  }
  const onTube = (h, k, phi, rad = R) => h.A.clone().addScaledVector(h.Nv, rad * Math.cos(phi)).addScaledVector(Lk[k], rad * Math.sin(phi));

  // canopy levels: from the bend start (eave) to the stop radius under the top patch
  const s0 = arch.sBend, s1 = arch.sAtRho(D.stop);
  const NVl = 56, NU = 40, NPHI = 10;
  const levels = []; for (let j = 0; j <= NVl; j++) levels.push(s0 + ((s1 - s0) * j) / NVl);
  const hips = []; // hips[k][j]
  for (let k = 0; k < N; k++) hips.push(levels.map((s) => hip(k, s)));

  // ---- canopy: hip strips (cloth over the tube) -------------------------------------------------
  const strips = [];
  for (let k = 0; k < N; k++) {
    const rows = [];
    for (let j = 0; j <= NVl; j++) {
      const h = hips[k][j], row = [];
      for (let i = 0; i <= NPHI; i++) row.push(onTube(h, k, -h.phiD + (2 * h.phiD * i) / NPHI));
      rows.push(row);
    }
    strips.push(rows);
  }
  // ---- canopy faces: taut membranes between the hips ---------------------------------------------
  const faces = [];
  const sagLoad = -0.00005 * (D.w / 3);
  for (let k = 0; k < N; k++) {
    const k1 = (k + 1) % N;
    const left = (j) => strips[k][j][NPHI], right = (j) => strips[k1][j][0];
    const rows = T2.membranePatch(NU, NVl, {
      pin: (i, j) => {
        if (i === 0) return left(j);
        if (i === NU) return right(j);
        if (j === 0 || j === NVl) return left(j).clone().lerp(right(j), i / NU);
        return null;
      },
      init: (i, j) => left(j).clone().lerp(right(j), i / NU),
      load: [0, sagLoad, 0],
      iters: 700,
      stress: 3,
    });
    faces.push(rows);
  }

  // shallow tension wrinkles from the corner pockets into every face (two per corner, straight,
  // tapering, 3-4 mm), displaced along the face normal; the boundaries stay where they are
  for (let k = 0; k < N; k++) {
    const rows = faces[k];
    const nrm = rows.map((row, j) => row.map((_, i) => T2.gridNormal(rows, i, j)));
    const W0 = rows[0][0].distanceTo(rows[0][NU]);
    const lines = [];
    for (const side of [0, 1]) for (const [ang0, len, amp] of [[0.5, 0.42, 0.0036], [0.95, 0.3, 0.0028]]) lines.push({ side, ang0, len, amp });
    for (let j = 1; j < NVl; j++) for (let i = 1; i < NU; i++) {
      const u = i / NU, v = j / NVl;
      // face-local coordinates in metres: x across from the nearer corner, y up the face
      let d = 0;
      for (const L of lines) {
        const x = (L.side ? 1 - u : u) * W0, y = v * (s1 - s0);
        const c = Math.cos(L.ang0), sn = Math.sin(L.ang0);
        const t = x * c + y * sn, dp = -x * sn + y * c;
        if (t < 0 || t > L.len * D.w) continue;
        const f = t / (L.len * D.w);
        d += L.amp * Math.exp(-((dp / 0.03) ** 2)) * Math.sin(Math.PI * Math.min(1, f * 1.4 + 0.08)) * (1 - f);
      }
      const edge = Math.min(1, Math.min(i, NU - i, j) / 3);
      if (d > 0) rows[j][i].addScaledVector(nrm[j][i], d * edge);
    }
  }

  // uv1 (print) for faces and strips: every face upright, the artwork's bottom at the eave
  const topFrac = faces[0][NVl][0].distanceTo(faces[0][NVl][NU]) / faces[0][0][0].distanceTo(faces[0][0][NU]);
  const faceUV = (i, j) => { const v = j / NVl, wv = 1 - v * (1 - topFrac); return [0.5 + (i / NU - 0.5) * wv, 0.02 + 0.96 * v]; };
  const roofTex = print ? K.artwork(N === 6 ? 'panel' : 'panel') : null;
  const roofMat = print ? K.printed(roofBase, roofTex, 'inflatable-roof2') : roofBase;
  for (let k = 0; k < N; k++) {
    if (print) {
      const uv = new Float32Array((NU + 1) * (NVl + 1) * 2); let m = 0;
      for (let j = 0; j <= NVl; j++) for (let i = 0; i <= NU; i++) { const t = faceUV(i, j); uv[m++] = t[0]; uv[m++] = t[1]; }
      K.addMesh(group, K.gridGeometry(faces[k], { uv1: uv }), roofMat);
      // strip k: the half towards face k takes face k's left edge, the other half face k-1's right edge
      const uvS = new Float32Array((NPHI + 1) * (NVl + 1) * 2); m = 0;
      for (let j = 0; j <= NVl; j++) for (let i = 0; i <= NPHI; i++) { const t = i >= NPHI / 2 ? faceUV(0, j) : faceUV(NU, j); uvS[m++] = t[0]; uvS[m++] = t[1]; }
      K.addMesh(group, K.gridGeometry(strips[k], { uv1: uvS }), roofMat);
    } else {
      bins.add(roofBase, K.gridGeometry(faces[k]));
      bins.add(roofBase, K.gridGeometry(strips[k]));
    }
  }
  // taped hip seam on every ridge crest + two stitch rows, up to the top patch
  for (let k = 0; k < N; k++) {
    const crest = [], nrm = [], sL = [], sR = [];
    for (let j = 0; j <= NVl; j++) {
      const h = hips[k][j];
      crest.push(onTube(h, k, 0, R + 0.0016)); nrm.push(h.Nv.clone());
      sL.push(onTube(h, k, -0.011 / R, R + 0.0009)); sR.push(onTube(h, k, 0.011 / R, R + 0.0009));
    }
    bins.add(patchM, T2.bandAlong(crest, nrm, 0.026, 0.0012, { lift: -0.0012 }));
    bins.add(patchM, K.sweep(crest, 0.0032, 6));
    bins.add(threadC, K.sweep(sL, 0.001, 4));
    bins.add(threadC, K.sweep(sR, 0.001, 4));
  }
  // top patch: a round double layer over the apex, stitched twice
  {
    const prof = [];
    const nP = 24;
    const yTop = (rho) => { const s = arch.sAtRho(Math.max(0.001, rho)); const a = arch.at(s); return a.y + R * (-a.tr) + 0.004; };
    for (let i = 0; i <= nP; i++) { const rho = (D.cap * i) / nP; prof.push([Math.max(0.0001, rho), yTop(rho)]); }
    const yr = yTop(D.cap);
    prof.push([D.cap + 0.006, yr - 0.008], [D.cap + 0.004, yr - 0.03]);
    const capG = G.lathe(prof.slice().reverse(), 64);
    bins.add(patchM, capG);
    for (const rr of [D.cap - 0.012, D.cap - 0.032]) {
      const ring = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU; ring.push(V3(Math.sin(a) * rr, yTop(rr) + 0.0012, Math.cos(a) * rr)); }
      bins.add(threadC, K.sweep(ring, 0.001, 4));
    }
  }

  // ---- eave: piping round the whole canopy edge ----------------------------------------------------
  const eave = [];
  for (let k = 0; k < N; k++) {
    for (let i = 0; i < NPHI; i++) eave.push(strips[k][0][i]);
    for (let i = 0; i < NU; i++) eave.push(faces[k][0][i]);
  }
  eave.push(eave[0].clone());
  bins.add(patchM, K.sweep(eave.map((q) => q.clone().add(V3(0, -0.002, 0))), 0.0065, 8, { closed: true }));

  // ---- valances (print area) between the legs ------------------------------------------------------
  const valTex = print ? K.artwork('band') : null;
  const valMat = print ? K.printed(roofBase, valTex, 'inflatable-band2') : roofBase;
  const valEnds = [];
  for (let k = 0; k < N; k++) {
    const a = faces[k][0][0], b = faces[k][0][NU];
    const n = nSide[k];
    const nx = 60, ny = 10, L = a.distanceTo(b);
    const rows = [];
    for (let j = 0; j <= ny; j++) {
      const f = j / ny, row = [];
      for (let i = 0; i <= nx; i++) {
        const u = i / nx, x = u * L;
        const lo = 1 - f;
        const wave = (0.004 * Math.sin(x * 9.3 + k * 1.7) + 0.003 * Math.sin(x * 21.1 + k)) * lo * lo * Math.sin(Math.PI * u);
        const flare = 0.008 * lo * Math.sin(Math.PI * u);
        const fest = 0.006 * Math.sin(Math.PI * u) * lo;
        row.push(a.clone().lerp(b, u).addScaledVector(n, flare + wave + 0.0015).setY(yb - vD + fest + (vD - fest) * f - 0.002));
      }
      rows.push(row);
    }
    let uv = null;
    if (print) { uv = new Float32Array((nx + 1) * (ny + 1) * 2); let m = 0; for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { uv[m++] = i / nx; uv[m++] = j / ny; } }
    const g = K.gridGeometry(rows, { uv1: uv });
    if (print) K.addMesh(group, g, valMat); else bins.add(roofBase, g);
    // folded hem + double stitch, vertical end hems
    const hem = rows[0].map((q) => q.clone().add(V3(0, 0.003, 0)).addScaledVector(n, -0.001));
    bins.add(roofBase, K.sweep(hem, 0.0035, 6));
    for (const dy of [0.012, 0.022]) bins.add(threadC, K.sweep(rows[0].map((q, i) => q.clone().add(V3(0, dy, 0)).addScaledVector(n, 0.0016 + 0.0002 * Math.sin(i))), 0.0009, 4));
    for (const i of [0, nx]) bins.add(roofBase, K.sweep(rows.map((row) => row[i].clone().addScaledVector(n, 0.001)), 0.004, 6));
    valEnds.push({ a, b, n, rows });
  }

  // ---- frame tubes --------------------------------------------------------------------------------
  const legPts = [];
  for (let k = 0; k < N; k++) {
    const pts = [], frs = [];
    const ds = 0.025;
    for (let s = 0; s <= arch.total + 1e-6; s += ds) {
      const a = arch.at(Math.min(s, arch.total));
      pts.push(dk[k].clone().multiplyScalar(a.rho).setY(a.y));
      frs.push(a);
    }
    bins.add(tubeMat, K.sweep(pts, r, 36, { refUp: dk[k].clone() }));
    legPts.push({ pts, frs });
    // longitudinal sleeve seam on the inside of the leg: welt + two stitch rows
    const weld = [], st1 = [], st2 = [];
    for (let s = 0.14; s <= arch.sBend + 0.5; s += 0.04) {
      const a = arch.at(s);
      const A = dk[k].clone().multiplyScalar(a.rho).setY(a.y);
      const Nv = dk[k].clone().multiplyScalar(a.ty).add(V3(0, -a.tr, 0)).normalize();
      const inn = Nv.clone().negate();
      weld.push(A.clone().addScaledVector(inn, r + 0.0012));
      const t = 0.012 / r;
      st1.push(A.clone().addScaledVector(inn, (r + 0.0006) * Math.cos(t)).addScaledVector(Lk[k], (r + 0.0006) * Math.sin(t)));
      st2.push(A.clone().addScaledVector(inn, (r + 0.0006) * Math.cos(t)).addScaledVector(Lk[k], -(r + 0.0006) * Math.sin(t)));
    }
    bins.add(tubePatch, K.sweep(weld, 0.0034, 6));
    bins.add(threadF, K.sweep(st1, 0.0009, 4));
    bins.add(threadF, K.sweep(st2, 0.0009, 4));
    // welded ring seam where the domed foot end joins the sleeve
    const C0 = C[k];
    const water = String(p.legs || '').toLowerCase().startsWith('water');
    if (!water) {
      const yR = r * 0.8 + 0.01;
      const ring = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU; ring.push(V3(C0.x + Math.sin(a) * (r + 0.0012), yR, C0.z + Math.cos(a) * (r + 0.0012))); }
      bins.add(tubePatch, K.sweep(ring, 0.0028, 6));
      const ring2 = ring.map((q) => q.clone().add(V3(0, 0.016, 0)));
      bins.add(threadF, K.sweep(ring2.map((q) => { const d = V3(q.x - C0.x, 0, q.z - C0.z).normalize(); return q.clone().addScaledVector(d, -0.0004); }), 0.0009, 4));
    }
  }

  // ---- feet: peg loops, or water ballast rings ------------------------------------------------------
  const water = String(p.legs || '').toLowerCase().startsWith('water');
  const blackPVC = K.pvc('#1B1C1E', { translucent: false });
  for (let k = 0; k < N; k++) {
    const C0 = C[k], n = dk[k];
    if (water) {
      // water ballast bag: a PVC cylinder wrapped round the leg base (velcro seam), welded top
      // edge with a lip, carry handle, fill cap; it bulges a little at the bottom under its load
      const R1 = r + 0.17, H1 = 0.34;
      const prof = [[r + 0.003, 0.004], [R1 + 0.012, 0.004], [R1 + 0.03, 0.022], [R1 + 0.034, 0.09], [R1 + 0.022, H1 * 0.62], [R1 + 0.004, H1 - 0.04], [R1 - 0.02, H1 - 0.008], [R1 - 0.06, H1], [r + 0.03, H1 + 0.004], [r + 0.012, H1 + 0.03], [r + 0.003, H1 + 0.075]];
      const bag = G.lathe(prof, 64); bag.translate(C0.x, 0, C0.z); bins.add(blackPVC, bag);
      // welded lip round the top edge
      const lip = []; for (let i = 0; i <= 72; i++) { const a = (i / 72) * TAU; lip.push(V3(C0.x + Math.sin(a) * (R1 + 0.006), H1 - 0.03, C0.z + Math.cos(a) * (R1 + 0.006))); }
      bins.add(blackPVC, K.sweep(lip, 0.007, 6, { rFn: (i, a) => (Math.abs(Math.sin(a)) > 0.7 ? 0.0022 : 0.009) }));
      // fill cap on top, towards the outside
      const fc = C0.clone().addScaledVector(dirOf(ang[k] - 0.5), r + 0.1).setY(H1 - 0.006);
      bins.add(dark, G.lathe([[0.0001, 0.028], [0.026, 0.026], [0.03, 0.018], [0.03, 0.0], [0.038, 0.0], [0.038, -0.006]].reverse(), 32).translate(fc.x, fc.y, fc.z));
      // carry handle: a webbing loop on top
      const hd = dirOf(ang[k] + 0.6);
      const h0 = C0.clone().addScaledVector(hd, r + 0.05).setY(H1 + 0.002), h1 = C0.clone().addScaledVector(hd, R1 - 0.03).setY(H1 - 0.012);
      const hp = []; for (let i = 0; i <= 16; i++) { const t = i / 16; hp.push(h0.clone().lerp(h1, t).add(V3(0, 0.05 * Math.sin(Math.PI * t), 0))); }
      bins.add(strapM, T2.bandAlong(hp, hp.map(() => V3(-hd.z, 0, hd.x)), 0.03, 0.0025));
      // velcro closure seam on the side, two strap tabs
      const sd = dirOf(ang[k] + 1.2);
      const z0 = C0.clone().addScaledVector(sd, R1 + 0.032);
      for (const yy of [0.09, 0.22]) {
        const tab = []; for (let i = 0; i <= 10; i++) { const a = ang[k] + 1.2 - 0.18 + 0.36 * (i / 10); tab.push(C0.clone().addScaledVector(dirOf(a), R1 + 0.033 - 0.012 * Math.abs(yy - 0.09) * 0).setY(yy)); }
        bins.add(strapM, T2.bandAlong(tab, tab.map((q) => V3(q.x - C0.x, 0, q.z - C0.z).normalize()), 0.04, 0.003));
      }
      bins.add(blackPVC, K.sweep([z0.clone().setY(0.02), z0.clone().setY(H1 * 0.5), z0.clone().setY(H1 - 0.05)], 0.006, 6));
    } else {
      // webbing loop sewn on the base patch, D-ring, strap to a peg
      const a = C0.clone().addScaledVector(n, r + 0.004).setY(0.1);
      const ring = C0.clone().addScaledVector(n, r + 0.05).setY(0.045);
      const peg = C0.clone().addScaledVector(n, r + 0.36);
      bins.add(strapM, K.strapGeo(a, ring, 0.028, 0.002));
      const tor = new THREE.TorusGeometry(0.02, 0.0042, 8, 20); tor.rotateY(Math.atan2(n.x, n.z) + Math.PI / 2); tor.rotateZ(0.0); tor.translate(ring.x, ring.y, ring.z); bins.add(steel, tor);
      bins.add(strapM, K.strapGeo(ring, peg.clone().setY(0.012), 0.025, 0.002));
      bins.add(steel, K.stakeGeo(peg, n.clone().negate(), { len: 0.05, r: 0.005 }));
    }
  }
  // guy ropes: a webbing loop with a D-ring sewn on every corner pocket, a rope with a
  // tensioner out to a stake (water legs: none, the ballast holds the tent on hard ground)
  if (!water) {
    const ropeM = K.ropeMat(K.lumOf(canopyHex) > 0.55 && !print ? '#E4E2DC' : '#232426');
    for (let k = 0; k < N; k++) {
      const h = hips[k][2];
      const att = onTube(h, k, 0, R + 0.004);
      const out = dk[k];
      const loopEnd = att.clone().addScaledVector(out, 0.05).add(V3(0, -0.02, 0));
      bins.add(strapM, K.strapGeo(att.clone().add(V3(0, 0.02, 0)), loopEnd, 0.025, 0.002));
      const tor = new THREE.TorusGeometry(0.016, 0.0035, 8, 18); tor.rotateY(ang[k] + Math.PI / 2); tor.translate(loopEnd.x, loopEnd.y, loopEnd.z); bins.add(steel, tor);
      const stake = C[k].clone().addScaledVector(out, 0.5 + 0.11 * D.w).setY(0);
      const ropeA = loopEnd.clone().addScaledVector(out, 0.014);
      bins.add(ropeM, K.rope(ropeA, stake.clone().setY(0.06), 0.0032, 0.004));
      // tensioner a third of the way down
      const tp = ropeA.clone().lerp(stake.clone().setY(0.06), 0.62);
      const tg = G.roundedBox(0.012, 0.05, 0.02, 0.004); tg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), stake.clone().setY(0.06).sub(ropeA).normalize())); tg.translate(tp.x, tp.y, tp.z);
      bins.add(dark, tg);
      bins.add(steel, K.stakeGeo(stake, out.clone().negate(), { len: 0.08, r: 0.007 }));
    }
  }

  // Boston valve on the leg nearest the hero camera, turned a little towards it
  {
    const k = 0, C0 = C[k];
    const n = dirOf(ang[k] - 0.2);
    const y0 = water ? 0.62 : 0.5;
    const v0 = C0.clone().addScaledVector(n, r - 0.002).setY(y0);
    const q = new THREE.Quaternion().setFromUnitVectors(Y, n);
    const valve = G.lathe([[0.0001, 0.034], [0.022, 0.034], [0.028, 0.03], [0.03, 0.022], [0.03, 0.014], [0.036, 0.012], [0.046, 0.006], [0.05, 0.0], [0.05, -0.004]].reverse(), 40);
    valve.applyQuaternion(q); valve.translate(v0.x, v0.y, v0.z);
    bins.add(dark, valve);
    // ribbed cap edge
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      const rib = G.roundedBox(0.004, 0.012, 0.004, 0.0015);
      rib.translate(Math.cos(a) * 0.03, 0.026, Math.sin(a) * 0.03);
      rib.applyQuaternion(q); rib.translate(v0.x, v0.y, v0.z);
      bins.add(dark, rib);
    }
    // tether strap from the cap down to the sleeve
    const t0 = v0.clone().addScaledVector(n, 0.03).add(V3(0, -0.02, 0)), t1 = C0.clone().addScaledVector(n, r + 0.003).setY(y0 - 0.1);
    bins.add(dark, K.sweep(K.ropePts(t0, t1, 0.05, 8), 0.0025, 6));
  }

  // ---- side walls -----------------------------------------------------------------------------
  const walls = parseWalls(p.walls);
  const wallSides = [];
  for (const [name, type] of Object.entries(walls)) {
    if (!type || type === 'none' || type === 'open') continue;
    const target = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 }[name];
    if (target == null) continue;
    let best = 0, bd = 9;
    nSide.forEach((n, k) => { const a = Math.atan2(n.x, n.z); const d = Math.abs(Math.atan2(Math.sin(a - target), Math.cos(a - target))); if (d < bd) { bd = d; best = k; } });
    wallSides.push(best);
  }
  const wallMat = K.pvc(canopyHex);
  for (const k of wallSides) {
    const n = nSide[k], k1 = (k + 1) % N;
    const along = C[k1].clone().sub(C[k]).normalize();
    const off = R - 0.016;
    const e = Math.sqrt(Math.max(0, r * r - off * off)) + 0.004;
    const pa = C[k].clone().addScaledVector(n, off).addScaledVector(along, e), pb = C[k1].clone().addScaledVector(n, off).addScaledVector(along, -e);
    const yTop = yb - 0.01, Lw = pa.distanceTo(pb);
    const nx = Math.round(Lw * 30), ny = 40;
    const rows = [];
    for (let j = 0; j <= ny; j++) {
      const row = [];
      for (let i = 0; i <= nx; i++) {
        const s = i / nx, y = (j / ny) * yTop, fy = y / yTop, x = s * Lw;
        const belly = 0.03 * Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, fy * 0.85 + 0.15));
        const folds = (0.009 * Math.sin(x * 4.1 + 0.7) + 0.006 * Math.sin(x * 9.7 + 2.1) + 0.003 * Math.sin(x * 17.3)) * (1 - fy) * Math.sin(Math.PI * s);
        const kick = y < 0.05 ? (0.05 - y) * 0.5 : 0;
        row.push(pa.clone().lerp(pb, s).addScaledVector(n, belly + folds + kick).setY(Math.max(0.004, y)));
      }
      rows.push(row);
    }
    bins.add(wallMat, K.gridGeometry(rows));
    bins.add(wallMat, K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.004, 0))), 0.004, 5));
    // zips along both legs
    for (const [e0, sgn] of [[pa, 1], [pb, -1]]) {
      const zp = []; for (let i = 0; i <= 20; i++) zp.push(e0.clone().addScaledVector(along, sgn * 0.006).addScaledVector(n, 0.004).setY(0.03 + ((yTop - 0.06) * i) / 20));
      bins.add(dark, K.sweep(zp, 0.0045, 5));
    }
  }

  // ---- front awning (luifel): tensioned membrane on two poles ------------------------------------
  if (p.awning) {
    let kF = 0; for (let k = 1; k < N; k++) if (nSide[k].z > nSide[kF].z) kF = k;
    const n = nSide[kF];
    const ea = faces[kF][0][0], eb = faces[kF][0][NU];
    const along = eb.clone().sub(ea).normalize();
    const depth = D.depth, yOut = yb - 0.2;
    const poleA = ea.clone().addScaledVector(n, depth).addScaledVector(along, -0.12).setY(yOut);
    const poleB = eb.clone().addScaledVector(n, depth).addScaledVector(along, 0.12).setY(yOut);
    const nu = 44, nv = 22;
    const inner = (i) => ea.clone().lerp(eb, i / nu).addScaledVector(n, 0.004).add(V3(0, 0.004, 0));
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
    const awGeo = K.gridGeometry(rowsA, { uv1: uvA });
    if (print) K.addMesh(group, awGeo, valMat); else bins.add(roofBase, awGeo);
    // kedder hem along the free edges, a seam tape along the eave
    const free = [];
    for (let j = 0; j <= nv; j++) free.push(rowsA[j][0]);
    for (let i = 1; i <= nu; i++) free.push(rowsA[nv][i]);
    for (let j = nv - 1; j >= 0; j--) free.push(rowsA[j][nu]);
    bins.add(patchM, K.sweep(free.map((q) => q.clone().add(V3(0, -0.002, 0))), 0.007, 8));
    bins.add(patchM, K.sweep(rowsA[0].map((q) => q.clone().add(V3(0, 0.003, 0))), 0.008, 8));
    const alu = M.aluminium({ roughness: 0.3 });
    const ropeM = K.ropeMat(K.lumOf(canopyHex) > 0.5 ? '#E6E4DE' : '#2A2B2D');
    for (const [top, sgn] of [[poleA, -1], [poleB, 1]]) {
      const foot = top.clone().setY(0);
      bins.add(alu, G.tube(foot.clone().setY(0.008), top.clone().add(V3(0, -0.006, 0)), 0.016, 18, { caps: true }));
      bins.add(steel, G.tube(top.clone().add(V3(0, -0.01, 0)), top.clone().add(V3(0, 0.07, 0)), 0.005, 10, { caps: true }));
      bins.add(steel, K.footPlate(foot.x, foot.z, 0.1, 0.006));
      const grom = new THREE.TorusGeometry(0.014, 0.0035, 8, 20); grom.rotateX(Math.PI / 2); grom.translate(top.x, top.y + 0.004, top.z); bins.add(steel, grom);
      for (const spread of [0.55, -0.15]) {
        const gd = n.clone().addScaledVector(along, sgn * spread).normalize();
        const stake = foot.clone().addScaledVector(gd, 1.25);
        bins.add(ropeM, K.rope(top.clone().add(V3(0, 0.05, 0)), stake.clone().setY(0.06), 0.0035, 0.004));
        bins.add(steel, K.stakeGeo(stake, gd.clone().negate(), { len: 0.07, r: 0.006 }));
      }
    }
  }

  // ---- LED lamp under the apex -----------------------------------------------------------------
  let lampPos = null;
  const light = p.light ? (typeof p.light === 'object' ? p.light : { watt: 12, on: true }) : null;
  if (light) {
    const on = light.on !== false;
    const Rl = 0.09, Tl = 0.034;
    lampPos = V3(0, Yc - r - 0.3, 0);
    const housing = new THREE.MeshPhysicalMaterial({ color: '#EEEDE9', roughness: 0.4, clearcoat: 0.3, name: 'lamp housing' });
    const lampG = G.lathe([[0.0001, Tl], [Rl - 0.01, Tl], [Rl, Tl - 0.008], [Rl, 0.008], [Rl - 0.008, 0.0], [0.0001, 0.0]].reverse(), 64);
    lampG.translate(lampPos.x, lampPos.y, lampPos.z);
    bins.add(housing, lampG);
    const diff = on
      ? new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#FFE9C8'), emissiveIntensity: 3.2, roughness: 0.5, name: 'diffuser on' })
      : new THREE.MeshPhysicalMaterial({ color: '#E9E8E4', roughness: 0.35, name: 'diffuser off' });
    const dg = G.lathe([[0.0001, -0.002], [Rl - 0.014, -0.0015], [Rl - 0.01, 0.002], [0.0001, 0.002]], 64);
    dg.translate(lampPos.x, lampPos.y, lampPos.z);
    bins.add(diff, dg);
    // hanging strap to the loop under the apex hub
    const hubY = Yc - r * 0.95;
    bins.add(strapM, K.strapGeo(lampPos.clone().add(V3(0, Tl, 0)), V3(0, hubY, 0), 0.025, 0.002, V3(1, 0, 0)));
    // cable down one arch to the leg
    const cab = [];
    for (let s = arch.total - 0.25; s >= arch.sBend - 0.4; s -= 0.08) { const a = arch.at(s); cab.push(dk[1].clone().multiplyScalar(a.rho).setY(a.y).addScaledVector(dk[1].clone().multiplyScalar(a.ty).add(V3(0, -a.tr, 0)).normalize(), -(r + 0.006))); }
    cab.unshift(lampPos.clone().add(V3(0.02, Tl * 0.5, 0)));
    bins.add(M.rubber('#E8E8E6'), K.sweep(cab, 0.003, 6));
    if (on) {
      const watt = Number(light.watt ?? 12);
      const pl = T2.pointLight(lampPos.clone().add(V3(0, -0.05, 0)), { color: '#FFDDB0', intensity: 0.8 * watt, decay: 2 });
      group.add(pl);
      const halo = LK.haloSpheres([{ c: lampPos.clone().add(V3(0, -0.01, 0)), R: 0.42, color: LK.lin('#FFE6C0', 2.0), a: 0.55, core: 0.2, coreW: 0.7 }]);
      if (halo) group.add(halo);
      const fg = LK.floorGlow([{ p: lampPos, I: 0.9, color: LK.lin('#FFD9A8', 1.0) }], { box: 2.2, res: 90, k: 0.6, max: 0.22 });
      if (fg) group.add(fg);
    }
  }

  bins.build(group);

  // framing for the lamp view: everything but a box round the lamp and the apex is ignored
  if (light) {
    group.traverse((o) => { if (o.isMesh) o.userData.noFrame = true; });
    group.add(T2.frameProxy([-0.3, lampPos.y - 0.3, -0.3], [0.3, lampPos.y + 0.3, 0.3]));
  }

  // hero: see every walled side from outside (34 front+right, -34 front+left, 146, -146)
  let heroAz = 34;
  if (wallSides.length && p.heroAzimuth == null) {
    let best = -1;
    for (const az of [34, -34, 146, -146]) {
      const cd = dirOf(az * Math.PI / 180);
      const sc = wallSides.reduce((acc, k) => acc + (nSide[k].dot(cd) > 0.25 ? 1 : 0), 0);
      if (sc > best) { best = sc; heroAz = az; }
    }
  } else if (p.heroAzimuth != null) heroAz = Number(p.heroAzimuth);

  const rigBase0 = K.tentRig(canopyHex, { walled: wallSides.length > 0, print: !!print });
  // the legs are tall vertical cylinders: a wider softbox bundle aimed lower than for an easy-up
  // roof lights them like the valances (the roof keeps its own values)
  const rigBase = { ...rigBase0, key: { ...rigBase0.key, angle: 54, aimRel: [0.0, 0.16, 0.69] } };
  const rig = { default: rigBase };
  // white frame tubes are vertical cylinders: a low reflector card in front lifts their lit
  // side to the value of a white valance (the roof keeps its own values)
  if (K.lumOf(frameHex) > 0.7) rig.default = { ...rigBase, bounce: { azimuth: -10, elevation: -18, intensity: 5.5 } };
  if (light) {
    rig.low = {
      key: { intensity: 2.4 }, dome: { intensity: 1.5 }, fill: { intensity: 1.4 }, exposure: 0.62,
      groundAO: { strength: 0.2 }, edgeFade: 0.0,
    };
  }
  return {
    object: group,
    detail: { target: [C[0].x, yb - 0.25, C[0].z], size: 1.3, azimuth: heroAz, elevation: 8 },
    view: {
      hero: { azimuth: heroAz, elevation: wallSides.length ? 20 : 17 },
      back: { azimuth: heroAz + 180 },
      ...(light ? { low: { azimuth: 24, elevation: -38, fov: 62, fill: 0.42 } } : {}),
    },
    rig,
    meta: {
      N, w: D.w, r, yb, Hc, alpha: (arch.alpha * 180) / Math.PI,
      probes: {
        roofLit: faces[N === 4 ? 3 : 5][Math.round(NVl * 0.4)][Math.round(NU * 0.35)].toArray(),
        legLit: C[0].clone().addScaledVector(dirOf(ang[0] - 0.5), r).setY(1.2).toArray(),
        valance: valEnds[N === 4 ? 3 : 5].a.clone().lerp(valEnds[N === 4 ? 3 : 5].b, 0.4).setY(yb - vD * 0.5).addScaledVector(valEnds[N === 4 ? 3 : 5].n, 0.01).toArray(),
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
// Verbindingstunnel: an inflatable corridor between the side openings of two tents standing in
// line along X (two `opblaasbareTent`s of width tentW at x = -/+ (tentW/2 + gap/2 + ...)).
// It fills the opening between the tents' legs: two inflated U-arches stand inside the tents'
// openings right next to their legs, the tunnel roof tucks up behind the valances, and the
// walls are zipped to the tent legs (zip tapes down both ends). Barrel vault over straight
// walls, a soft sag and a few tension wrinkles between the arches.
//   { length (gap between the valances, m), color, tentW (3) }
export function opblaasbareTunnel(p = {}) {
  const tentW = Number(p.tentW ?? 3);
  const Dt = dims({ w: tentW });
  const hex = K.col(p.color || 'wit', M.COLORS.wit);
  const fab = K.pvc(hex);
  const tubeMat = K.pvc(hex, { translucent: false });
  const patchM = K.pvcPatch(hex);
  const threadM = M.tentThread(hex);
  const zipM = M.zipTooth('#151516');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'opblaasbareTunnel';
  const side = tentW / 2 - Dt.r; // leg centre line from the tent centre
  const gap = Number(p.length ?? 1.4);
  // tent centres at +-(side + Dt.r + 0.012 + gap/2): the facing leg centre lines at xL
  const xLeg = gap / 2 + Dt.r + 0.012;
  const rt = 0.085;
  const hw = side - Dt.r - rt - 0.004; // arches stand right next to the tent legs
  const xA = xLeg + 0.02; // arch planes just inside the tents
  const Htop = Dt.yb - Dt.vD + 0.16, wallH = Htop - hw * 0.42;
  const sect = (u) => {
    // u 0..1: ground on -z, up the wall, over the vault, down to the ground on +z
    const La = Math.PI * Math.sqrt((hw * hw + (Htop - wallH) ** 2) / 2) / 2;
    const tot = 2 * wallH + 2 * La;
    const s = u * tot;
    if (s < wallH) return [-hw, s];
    if (s > tot - wallH) return [hw, tot - s];
    const a = Math.PI * (1 - (s - wallH) / (2 * La));
    return [Math.cos(a) * hw, wallH + Math.sin(a) * (Htop - wallH)];
  };
  const nU = 72, nX = 30;
  const rows = [];
  for (let j = 0; j <= nX; j++) {
    const x = -xA - 0.05 + ((2 * xA + 0.1) * j) / nX;
    const mid = 1 - Math.min(1, Math.abs(x) / xA);
    const row = [];
    for (let i = 0; i <= nU; i++) {
      const [z, y] = sect(i / nU);
      const top = Math.max(0, (y - wallH) / (Htop - wallH));
      const sag = 0.03 * mid * mid * (0.4 + 0.6 * top);
      const wr = 0.004 * Math.sin(i * 0.9 + j * 0.4) * mid * (1 - top);
      const k = 1 - (sag + wr) / Math.max(0.6, Math.hypot(z, (y - wallH) * 0.6) + 0.4);
      row.push(V3(x, Math.max(0.004, y > wallH ? wallH + (y - wallH) * (1 - sag * 1.5) - sag * 0.3 : y), z * k));
    }
    rows.push(row);
  }
  bins.add(fab, K.gridGeometry(rows));
  // hem at the ground
  for (const i of [0, nU]) bins.add(fab, K.sweep(rows.map((row) => row[i].clone().setY(0.006)), 0.005, 5));
  // inflated U-arches inside both tent openings, with a seam welt on top
  for (const sx of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 64; i++) { const [z, y] = sect(i / 64); pts.push(V3(sx * xA, Math.max(rt * 0.8, y - rt - 0.012), z * (1 - (rt + 0.012) / hw))); }
    bins.add(tubeMat, K.sweep(pts, rt, 24, { capStart: true, capEnd: true }));
    // zip tapes where the tunnel walls meet the tent: down both sides
    for (const sz of [-1, 1]) {
      const zp = []; for (let t = 0; t <= 24; t++) { const y = 0.03 + ((Dt.yb - Dt.vD - 0.03) * t) / 24; zp.push(V3(sx * (xLeg - Dt.r - 0.03), y, sz * (hw + 0.006))); }
      bins.add(zipM, K.sweep(zp, 0.005, 5));
      bins.add(patchM, T2.bandAlong(zp.map((q) => q.clone().add(V3(sx * -0.03, 0, sz * 0.002))), zp.map(() => V3(0, 0, sz)), 0.045, 0.002));
    }
  }
  // sewn seam along the vault crest
  const crest = rows.map((row) => row[nU / 2].clone().add(V3(0, 0.003, 0)));
  bins.add(patchM, K.sweep(crest, 0.0035, 6));
  bins.add(threadM, K.sweep(crest.map((q) => q.clone().add(V3(0, 0.0, 0.012))), 0.0009, 4));
  bins.add(threadM, K.sweep(crest.map((q) => q.clone().add(V3(0, 0.0, -0.012))), 0.0009, 4));
  bins.build(group);
  return { object: group, rig: { default: K.tentRig(hex) }, meta: { gap } };
}
