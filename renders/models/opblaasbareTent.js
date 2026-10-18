// Opblaasbare promotietent (inflatable gazebo) and its connection tunnel.
//
// Construction (inflatable event tents of the X-frame type):
//  - an airtight TPU bladder frame inside sewn polyester/PVC sleeves in the frame colour:
//    4 legs (or 6 on the hexagon), all one tube diameter (30 cm on 3 x 3, 35 cm on 4 x 4,
//    48 cm on the 8 m hexagon), straight eave beams between the leg tops and roof arches
//    that continue from every leg along the hip to the apex hub;
//  - one printed canopy that is pulled over the frame: it rolls over the eave beams into a
//    vertical valance (the print area) and is laced/velcroed to the arches, so the roof faces
//    dish gently between the arch ridges; the valance wraps round the legs at the corners;
//  - feet: closed, rounded tube ends with a webbing loop and D-ring pegged to the ground, or
//    `legs: 'water'`: a water ballast bag (black PVC, fill cap) round every leg base;
//  - a Boston valve on one leg, a zip seam on the inside of every leg sleeve;
//  - optional: closed side walls zipped between the legs (`walls: {back: 'closed'}`), a front
//    awning on two aluminium poles with guy ropes (`awning: 'front'`), a full-colour printed
//    canopy (`canopyPrint`), and a connection tunnel (`opblaasbareTunnel`).
// Units: metres, Y up, front +Z.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';

const { V3, TAU } = K;

function dims(p) {
  const hex = String(p.shape || '').toLowerCase().startsWith('hex') || Number(p.legs) === 6;
  const w = Number(p.w ?? p.diameter ?? (hex ? 8 : 3));
  if (hex) return { N: 6, w, r: 0.24, ye: 2.95, Hc: Number(p.height ?? 4.9), Rc: w / 2 - 0.24 };
  const r = w >= 3.9 ? 0.18 : 0.15;
  const ye = w >= 3.9 ? 2.6 : 2.4;
  return { N: 4, w, r, ye, Hc: Number(p.height ?? (w >= 3.9 ? 3.7 : 3.2)), Rc: (w / 2 - r) * Math.SQRT2 };
}

export function opblaasbareTent(p = {}) {
  const D = dims(p);
  const { N, r, ye, Hc, Rc } = D;
  const frameHex = K.col(p.color || 'wit', M.COLORS.wit);
  const canopyHex = K.col(p.canopyColor || p.color || 'wit', M.COLORS.wit);
  const print = p.canopyPrint || p.print || null;
  const tubeMat = K.pvc(frameHex, { translucent: false });
  const roofBase = K.pvc(canopyHex);
  const roofMat = print ? K.printed(roofBase, K.artwork('panel'), 'inflatable-roof') : roofBase;
  const valMat = print ? K.printed(roofBase, K.artwork('band'), 'inflatable-band') : roofBase;
  const thread = M.tentThread(frameHex);
  const dark = M.mouldedNylon('#151515');
  const blackPVC = K.pvc('#1D1E20', { translucent: false });
  const steel = M.galvanised();
  const strapM = M.webbing('#151617');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `opblaasbareTent ${D.w} ${N}`;
  const c = 0.012; // cloth gap over the tubes
  const dirOf = (a) => V3(Math.sin(a), 0, Math.cos(a));

  // ---- frame layout -------------------------------------------------------------------------
  const corners = [];
  for (let k = 0; k < N; k++) corners.push(dirOf(Math.PI / N + (k * TAU) / N).multiplyScalar(Rc));
  // side k runs from corner k-1 to corner k?  -> use side k between corners k and k+1 (CCW in
  // azimuth: increasing angle), its outward normal at angle (k + 1) * TAU / N
  const sides = [];
  for (let k = 0; k < N; k++) {
    const a = corners[k], b = corners[(k + 1) % N];
    const n = dirOf(((k + 1) * TAU) / N);
    sides.push({ a, b, n, mid: a.clone().add(b).multiplyScalar(0.5), len: a.distanceTo(b) });
  }
  const eTop = ye + r + c; // cloth on top of the eave beams
  const hemY = ye - r - 0.1;
  const dish = 0.024 * D.w;
  const prof = (s) => 1 - Math.pow(1 - s, 1.75);

  // ---- outline of the canopy (valance line): offset of the leg polygon by r + c, rounded
  // round every leg. Each sample: plan point, outward normal, tube centre point, side, t.
  const out = [];
  const nSide = N === 4 ? 48 : 40, nArc = 10;
  for (let k = 0; k < N; k++) {
    const sd = sides[k];
    // corner arc round corner k from the previous side normal to this side normal
    const nPrev = sides[(k - 1 + N) % N].n;
    const a0 = Math.atan2(nPrev.x, nPrev.z), a1raw = Math.atan2(sd.n.x, sd.n.z);
    let a1 = a1raw; while (a1 < a0) a1 += TAU;
    for (let i = 0; i < nArc; i++) {
      const a = a0 + ((a1 - a0) * i) / nArc, n = dirOf(a);
      out.push({ p: corners[k].clone().addScaledVector(n, r + c), n, tube: corners[k].clone(), side: k, t: -1, corner: true });
    }
    for (let i = 0; i < nSide; i++) {
      const f = i / nSide, tube = sd.a.clone().lerp(sd.b, f);
      out.push({ p: tube.clone().addScaledVector(sd.n, r + c), n: sd.n.clone(), tube, side: k, t: f * 2 - 1, corner: false });
    }
  }
  out.push(out[0]);

  // dish of the roof between the arch ridges: zero on the hips (t = +-1) and at the corners
  const dishAt = (o, s) => (o.corner ? 0 : dish * Math.pow(1 - o.t * o.t, 1.3) * Math.sin(Math.PI * Math.pow(s, 0.85)) * (1 - 0.35 * s));
  const hipY = (s) => eTop + (Hc - eTop) * prof(s); // cloth height on a hip (over an arch)
  const cornerDirs = corners.map((C) => C.clone().normalize());
  const roofPt = (o, s) => {
    let y = hipY(s) - dishAt(o, s);
    const q = o.tube.clone().multiplyScalar(1 - s);
    if (!o.corner) {
      // the cloth rides over the arch tubes: near a hip it cannot drop below the tube top, so
      // every arch shows as a rounded ridge (smooth max over the tube's cross-section)
      for (const cd of [cornerDirs[o.side], cornerDirs[(o.side + 1) % N]]) {
        const along = q.x * cd.x + q.z * cd.z;
        const d = Math.abs(q.x * cd.z - q.z * cd.x);
        const R = r + c;
        if (d >= R || along <= 0) continue;
        const sh = Math.min(1, Math.max(0, 1 - along / Rc));
        const yt = hipY(sh) - R + Math.sqrt(R * R - d * d);
        const kk = 0.035, hh = Math.max(kk - Math.abs(y - yt), 0) / kk;
        y = Math.max(y, yt) + hh * hh * kk * 0.25;
      }
    }
    return q.setY(y);
  };

  // ---- canopy cloth: valance + rollover (one grid), roof (one grid) ---------------------------
  const NV = 10, NB = 8, NRf = 44;
  const valRows = [], roofRows = [];
  for (let j = 0; j <= NV + NB; j++) {
    const row = [];
    for (const o of out) {
      let q;
      if (j <= NV) {
        // valance: hem (with a light festoon between the legs) up to the beam centre
        const f = j / NV;
        const fest = o.corner ? 0 : 0.012 * (1 - o.t * o.t);
        const y = hemY + fest + (ye - hemY - fest) * f;
        const flare = 0.01 * (1 - f) * (o.corner ? 0 : 1);
        q = o.p.clone().addScaledVector(o.n, flare).setY(y);
      } else {
        const b = ((j - NV) / NB) * (Math.PI / 2);
        q = o.tube.clone().addScaledVector(o.n, (r + c) * Math.cos(b)).setY(ye + (r + c) * Math.sin(b));
      }
      row.push(q);
    }
    valRows.push(row);
  }
  for (let j = 0; j <= NRf; j++) {
    const s = (j / NRf) * 0.985;
    roofRows.push(out.map((o) => roofPt(o, s)));
  }
  if (!print) {
    bins.add(roofBase, K.gridGeometry(valRows, { closedU: true }));
    bins.add(roofBase, K.gridGeometry(roofRows, { closedU: true }));
  } else {
    // printed canopy: one panel per face (half a corner arc on each end), so every face and
    // valance side carries the artwork upright without a uv seam across the hips
    const per = nArc + nSide, M0 = out.length - 1;
    for (let k = 0; k < N; k++) {
      const idx = [], ts = [];
      for (let q = k * per + nArc / 2; q <= (k + 1) * per + nArc / 2; q++) {
        const ii = q % M0, o = out[ii];
        idx.push(ii);
        ts.push(o.corner ? (q < k * per + nArc ? -1 : 1) : o.t);
      }
      const sub = (rowsAll) => rowsAll.map((row) => idx.map((ii) => row[ii]));
      const vR = sub(valRows), rR = sub(roofRows);
      const uvV = new Float32Array(vR.length * idx.length * 2), uvR = new Float32Array(rR.length * idx.length * 2);
      let m = 0;
      for (let j = 0; j < vR.length; j++) for (const t of ts) { uvV[m++] = (t + 1) / 2; uvV[m++] = Math.min(1, j / NV); }
      m = 0;
      for (let j = 0; j <= NRf; j++) { const sj = (j / NRf) * 0.985; for (const t of ts) { uvR[m++] = 0.5 + 0.5 * t * (1 - sj); uvR[m++] = sj; } }
      K.addMesh(group, K.gridGeometry(vR, { uv1: uvV }), valMat);
      K.addMesh(group, K.gridGeometry(rR, { uv1: uvR }), roofMat);
    }
  }
  // folded hem at the bottom of the valance + stitch line 2 cm up
  const hemPts = valRows[0].map((q, i) => q.clone().addScaledVector(out[i].n, -0.002).add(V3(0, 0.004, 0)));
  bins.add(roofBase, K.sweep(hemPts, 0.005, 6));
  bins.add(M.tentThread(canopyHex), K.sweep(valRows[0].map((q, i) => q.clone().addScaledVector(out[i].n, 0.0025).add(V3(0, 0.02, 0))), 0.0011, 4));
  // apex cap (sewn top with the valve hub)
  const capY = roofRows[NRf][0].y;
  const cap = G.lathe([[0.0001, capY + 0.07], [0.12, capY + 0.055], [0.2, capY + 0.02], [0.24, capY - 0.02]], 32);
  bins.add(roofBase, cap);

  // ---- frame tubes ----------------------------------------------------------------------------
  const legs = [];
  for (let k = 0; k < N; k++) {
    const C = corners[k];
    // leg + arch: straight up to the eave beam, then along the hip to the apex hub
    const pts = [];
    const nL = 14;
    const foot = C.clone().setY(r * 0.55);
    for (let i = 0; i <= nL; i++) pts.push(foot.clone().setY(r * 0.55 + (ye - r * 0.55) * (i / nL)));
    const hipO = { tube: C, corner: true, t: 1 };
    for (let i = 1; i <= 26; i++) {
      const s = (i / 26) * 0.93;
      const q = roofPt(hipO, s); q.y -= r + c;
      pts.push(q);
    }
    const leg = K.sweep(pts, r, 28, { capStart: true });
    bins.add(tubeMat, leg);
    legs.push({ C, pts });
    // zip seam on the inside of the leg sleeve
    const inward = C.clone().setY(0).normalize().negate();
    const seam = [];
    for (let i = 0; i <= 12; i++) seam.push(C.clone().addScaledVector(inward, r + 0.0015).setY(0.12 + ((hemY - 0.15) * i) / 12));
    bins.add(dark, K.sweep(seam, 0.004, 5));
  }
  for (const sd of sides) {
    const along = sd.b.clone().sub(sd.a).normalize();
    bins.add(tubeMat, G.tube(sd.a.clone().addScaledVector(along, r * 0.4).setY(ye), sd.b.clone().addScaledVector(along, -r * 0.4).setY(ye), r, 28));
  }
  // apex hub
  const hub = new THREE.SphereGeometry(r * 1.05, 24, 14); hub.scale(1, 0.7, 1); hub.translate(0, Hc - r - c - 0.02, 0); bins.add(tubeMat, hub);
  // valve on the front-right leg, facing out
  {
    const C = corners[0], n = C.clone().setY(0).normalize();
    const v0 = C.clone().addScaledVector(n, r - 0.004).setY(0.62);
    bins.add(dark, G.tube(v0, v0.clone().addScaledVector(n, 0.03), 0.034, 24, { caps: true }));
    bins.add(dark, G.tube(v0.clone().addScaledVector(n, 0.03), v0.clone().addScaledVector(n, 0.045), 0.026, 24, { caps: true }));
  }

  // ---- feet -----------------------------------------------------------------------------------
  const water = String(p.legs || '').toLowerCase().startsWith('water');
  for (const { C } of legs) {
    const n = C.clone().setY(0).normalize();
    if (water) {
      const R1 = r + 0.1, H1 = 0.36;
      const bag = G.lathe([[r + 0.004, 0.0], [R1 - 0.05, 0.0], [R1 - 0.012, 0.012], [R1, 0.06], [R1 + 0.006, H1 * 0.5], [R1, H1 - 0.06], [R1 - 0.03, H1 - 0.01], [R1 - 0.07, H1], [r + 0.004, H1 + 0.005]], 40);
      bag.translate(C.x, 0, C.z); bins.add(blackPVC, bag);
      // fill cap on top, facing out
      const fc = C.clone().addScaledVector(n, r + 0.05).setY(H1 - 0.005);
      bins.add(dark, G.tube(fc, fc.clone().setY(H1 + 0.025), 0.03, 20, { caps: true }));
      // two straps over the bag to the leg sleeve
      for (const s of [-1, 1]) {
        const side = V3(-n.z, 0, n.x).multiplyScalar(s);
        const a = C.clone().addScaledVector(side, r * 0.98).setY(H1 + 0.12), b = C.clone().addScaledVector(side, R1 + 0.002).setY(H1 * 0.55);
        bins.add(strapM, K.strapGeo(a, b, 0.03, 0.002, n));
      }
    } else {
      // webbing loop + D-ring + strap to a peg, pointing outward
      const a = C.clone().addScaledVector(n, r * 0.92).setY(0.09);
      const ring = a.clone().addScaledVector(n, 0.06).setY(0.05);
      const peg = a.clone().addScaledVector(n, 0.3);
      bins.add(strapM, K.strapGeo(a, ring, 0.03, 0.002));
      const tor = new THREE.TorusGeometry(0.022, 0.0045, 8, 18); tor.rotateY(Math.atan2(n.x, n.z)); tor.translate(ring.x, ring.y, ring.z); bins.add(steel, tor);
      bins.add(strapM, K.strapGeo(ring, peg.clone().setY(0.03), 0.025, 0.002));
      bins.add(steel, K.stakeGeo(peg, n.clone().negate(), { len: 0.06, r: 0.005 }));
    }
  }

  // ---- side walls -----------------------------------------------------------------------------
  const walls = parseWalls(p.walls);
  const wallSides = [];
  for (const [name, type] of Object.entries(walls)) {
    if (!type || type === 'none' || type === 'open') continue;
    const target = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 }[name];
    if (target == null) continue;
    let best = 0, bd = 9;
    sides.forEach((sd, k) => { const a = Math.atan2(sd.n.x, sd.n.z); const d = Math.abs(Math.atan2(Math.sin(a - target), Math.cos(a - target))); if (d < bd) { bd = d; best = k; } });
    wallSides.push(best);
  }
  const wallMat = K.pvc(canopyHex);
  for (const k of wallSides) {
    const sd = sides[k];
    const along = sd.b.clone().sub(sd.a).normalize();
    const pa = sd.a.clone().addScaledVector(along, r * 0.9), pb = sd.b.clone().addScaledVector(along, -r * 0.9);
    const yTop = ye - r * 0.75;
    const nx = 40, ny = 24, Lw = pa.distanceTo(pb);
    const rows = [];
    for (let j = 0; j <= ny; j++) {
      const row = [];
      for (let i = 0; i <= nx; i++) {
        const s = i / nx, y = (j / ny) * yTop;
        const belly = 0.035 * Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, y / yTop * 0.9 + 0.1));
        const fold = 0.01 * Math.sin(s * Lw * 5.3 + 0.7) * (1 - y / yTop) + 0.006 * Math.sin(s * Lw * 11.7) * (1 - y / yTop);
        const kick = y < 0.05 ? (0.05 - y) * 0.6 : 0;
        row.push(pa.clone().lerp(pb, s).addScaledVector(sd.n, belly + fold + kick).setY(Math.max(0.003, y)));
      }
      rows.push(row);
    }
    bins.add(wallMat, K.gridGeometry(rows));
    // zips along the legs
    for (const e of [pa, pb]) bins.add(dark, G.tube(e.clone().addScaledVector(sd.n, 0.004).setY(0.03), e.clone().addScaledVector(sd.n, 0.004).setY(yTop), 0.006, 6));
  }

  // ---- front awning (luifel) on two aluminium poles -------------------------------------------
  if (p.awning) {
    const sd = sides[N === 4 ? 3 : 5]; // side facing +Z
    const front = sides.reduce((b, s) => (s.n.z > b.n.z ? s : b), sd);
    const along = front.b.clone().sub(front.a).normalize();
    const half = front.len / 2 - 0.05;
    const depth = N === 4 ? 1.3 : 1.8;
    const yIn = eTop - 0.02, yOut = ye - 0.25;
    const base = front.mid.clone().addScaledVector(front.n, r + c);
    const rowsA = [];
    for (let j = 0; j <= 16; j++) {
      const v = j / 16, row = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40 * 2 - 1;
        const sag = 0.05 * (1 - u * u) * Math.sin(Math.PI * v) + 0.03 * (1 - u * u) * v;
        const scallop = 0.06 * (1 - u * u) * v * v; // the free outer edge curves in between the poles
        row.push(base.clone().addScaledVector(along, u * half).addScaledVector(front.n, depth * v - scallop).setY(yIn + (yOut - yIn) * v - sag));
      }
      rowsA.push(row);
    }
    const awMat = print ? K.printed(roofBase, K.artwork('band'), 'awning') : roofBase;
    const uvA = print ? (() => { const a = new Float32Array(17 * 41 * 2); let k = 0; for (let j = 0; j <= 16; j++) for (let i = 0; i <= 40; i++) { a[k++] = i / 40; a[k++] = 1 - j / 16; } return a; })() : null;
    const awGeo = K.gridGeometry(rowsA, { uv1: uvA });
    if (print) K.addMesh(group, awGeo, awMat); else bins.add(roofBase, awGeo);
    // outer hem tube (kedder) and the poles
    bins.add(roofBase, K.sweep(rowsA[16], 0.012, 8));
    const alu = M.aluminium({ roughness: 0.3 });
    const ropeM = K.ropeMat('#2A2B2D');
    for (const u of [-1, 1]) {
      const topP = rowsA[16][u < 0 ? 0 : 40].clone();
      const footP = topP.clone().setY(0);
      bins.add(alu, G.tube(footP.clone().setY(0.005), topP.clone().add(V3(0, 0.1, 0)), 0.016, 14, { caps: true }));
      bins.add(steel, K.footPlate(footP.x, footP.z, 0.1, 0.006));
      const gd = front.n.clone().addScaledVector(along, u * 0.6).normalize();
      const stake = footP.clone().addScaledVector(gd, 1.3);
      bins.add(ropeM, K.rope(topP.clone().add(V3(0, 0.06, 0)), stake.clone().setY(0.08), 0.004, 0.006));
      bins.add(steel, K.stakeGeo(stake, gd.clone().negate(), { len: 0.08, r: 0.006 }));
    }
  }

  bins.build(group);

  // hero: see every walled side from outside (34 front+right, -34 front+left, 146, -146)
  let heroAz = 34;
  if (wallSides.length && p.heroAzimuth == null) {
    let best = -1;
    for (const az of [34, -34, 146, -146]) {
      const cd = dirOf(az * Math.PI / 180);
      const sc = wallSides.reduce((acc, k) => acc + (sides[k].n.dot(cd) > 0.25 ? 1 : 0), 0);
      if (sc > best) { best = sc; heroAz = az; }
    }
  } else if (p.heroAzimuth != null) heroAz = Number(p.heroAzimuth);
  return {
    object: group,
    detail: { target: [corners[0].x, ye - 0.3, corners[0].z], size: 1.2, azimuth: heroAz, elevation: 6 },
    view: { hero: { azimuth: heroAz, elevation: wallSides.length ? 20 : 17 }, back: { azimuth: heroAz + 180 } },
    rig: { default: K.tentRig(canopyHex, { walled: wallSides.length > 0, print: !!print }) },
    meta: { N, w: D.w, r, ye, Hc },
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
// Verbindingstunnel: a short inflatable corridor between the side openings of two tents
// (placed between two `opblaasbareTent`s, along X). Two inflated U-arches at the ends, a
// barrel-vault canvas with straight walls zipped to the tents.
//   { length, color, width?, height? }
export function opblaasbareTunnel(p = {}) {
  const L = Number(p.length ?? 1.4), Wd = Number(p.width ?? 2.0), H = Number(p.height ?? 2.08);
  const hex = K.col(p.color || 'wit', M.COLORS.wit);
  const fab = K.pvc(hex);
  const tubeMat = K.pvc(hex, { translucent: false });
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'opblaasbareTunnel';
  const rt = 0.1, ov = 0.16; // tube radius, overlap into the tent openings
  const hw = Wd / 2;
  const wallH = H - hw * 0.62;
  // cross-section: vertical walls, an elliptical vault on top
  const sect = (u) => {
    // u in [0,1] from the ground on -z, over the top, to the ground on +z
    const Lw = wallH, La = (Math.PI / 2) * (hw + (H - wallH)) / 2 * 2, tot = 2 * Lw + La;
    const s = u * tot;
    if (s < Lw) return [-hw, s];
    if (s > Lw + La) return [hw, tot - s];
    const a = Math.PI * (1 - (s - Lw) / La);
    return [Math.cos(a) * hw, wallH + Math.sin(a) * (H - wallH)];
  };
  const nU = 48, nX = 16;
  const rows = [];
  for (let j = 0; j <= nX; j++) {
    const x = -L / 2 - ov + ((L + 2 * ov) * j) / nX;
    const end = Math.min(1, Math.abs(x) / (L / 2));
    const row = [];
    for (let i = 0; i <= nU; i++) {
      const [z, y] = sect(i / nU);
      const sag = 0.035 * (1 - end * end);
      const k = 1 - sag / Math.max(0.5, Math.hypot(z, y - 0.6));
      row.push(V3(x, Math.max(0.004, y * (y > wallH ? k : 1)), z * k));
    }
    rows.push(row);
  }
  bins.add(fab, K.gridGeometry(rows));
  for (const sx of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 40; i++) { const [z, y] = sect(i / 40); pts.push(V3(sx * (L / 2 - 0.02), Math.max(rt * 0.6, y - rt * 0.4), z * (1 - rt / hw * 0.4))); }
    bins.add(tubeMat, K.sweep(pts, rt, 18));
  }
  bins.build(group);
  return { object: group, rig: { default: K.tentRig(hex) }, meta: { L } };
}
