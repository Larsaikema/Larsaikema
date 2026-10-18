// Marktkraam (market stall), 2 m.
//
// Construction: powder-coated square steel tube frame (25 mm) with four posts on foot plates,
// three rafters (the two gables + one in the middle) over a ridge, front and back eave beams,
// the rafters run on past the front posts as a 25 cm overhang; a PVC canopy (kap) with closed
// gable triangles, a front valance (luifel) and a short back valance; a birch plywood work top
// (werkblad, 18 mm) on two brackets between the front posts with a front rail, side rails and a
// low back rail for stiffness. `canopyPrint` prints a full-colour sample on the front roof
// slope and a band on the front valance.
// Round 4 options: `frame` / `frameColor` (e.g. 'zwart'), `valance: 'kartel'` (scalloped valances
// front and back), `only: 'kap'` (the loose roof cover product: the cover on a bare stall frame
// without the counter, seen from the front left), `skirt: <colour>` (the stall skirt: a gathered
// polyester skirt round the front and both sides of the counter, velcro band at the top).
//   { w (2|3), depth, canopyColor, frameColor | frame, canopyPrint, valance, only, skirt }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';

const { V3 } = K;

export function marketStall(p = {}) {
  const W = Number(p.w ?? 2), D = Number(p.depth ?? 1.2);
  const hex = K.col(p.canopyColor || p.color || 'rood', M.COLORS.rood);
  const print = p.canopyPrint || p.print || null;
  const fabBase = K.pvc(hex);
  const steel = M.steelPowder(K.col(p.frameColor || (typeof p.frame === 'string' ? p.frame : null) || '#3A3D41'), { roughness: 0.45 });
  const kapOnly = String(p.only || '') === 'kap';
  const kartel = /kartel|scallop/i.test(String(p.valance || ''));
  const wood = M.birchFace(), edge = M.birchEdge();
  const thread = M.tentThread(hex);
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `marketStall ${W}`;
  const s = 0.025; // square tube
  const He = 2.12, Hr = 2.5, ov = 0.28; // eave, ridge, front overhang
  const hd = D / 2, hw = W / 2;
  const slope = (Hr - He) / hd;
  const sq = (a, b, w = s) => bins.add(steel, G.prism(G.roundedRectProfile(w, w, 0.003, 2), a, b, { side: V3(0, 1, 0).cross(b.clone().sub(a).normalize()).lengthSq() > 1e-4 ? V3(0, 1, 0) : V3(1, 0, 0) }));

  // ---- frame -----------------------------------------------------------------------------------
  // every roof member sits just under the cloth: rafters follow the cloth line, the ridge and
  // eave beams hang under the rafters, the posts carry the eave beams
  const c = 0.016;
  const yCloth = (z) => (z >= 0 ? Hr - slope * z : Hr + slope * z) + c;
  const rafY = (z) => yCloth(z) - c - s / 2 - 0.003;
  const beamY = rafY(hd) - s;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (hw - s / 2), z = sz * hd;
    sq(V3(x, 0.006, z), V3(x, beamY + s / 2, z));
    bins.add(steel, K.footPlate(x, z, 0.1, 0.006));
  }
  for (const x of [-(hw - s / 2), 0, hw - s / 2]) {
    // rafter: back eave -> ridge -> front overhang tip
    const back = V3(x, rafY(-hd), -hd), ridge = V3(x, rafY(0), 0), tip = V3(x, rafY(hd + ov), hd + ov);
    sq(back, ridge); sq(ridge, tip);
  }
  for (const z of [-hd, hd]) sq(V3(-hw, beamY, z), V3(hw, beamY, z));
  sq(V3(-hw, rafY(0) - s, 0), V3(hw, rafY(0) - s, 0));
  sq(V3(-hw, rafY(hd + ov) - s * 0.8, hd + ov - 0.01), V3(hw, rafY(hd + ov) - s * 0.8, hd + ov - 0.01), 0.02);
  // counter: brackets, rails, top (not on the bare frame that shows the loose roof cover)
  const yT = 0.9, tD = 0.55, tz0 = hd - tD + 0.12;
  if (!kapOnly) {
  for (const sx of [-1, 1]) {
    const x = sx * (hw - s / 2);
    sq(V3(x, yT - 0.025, hd), V3(x, yT - 0.025, -hd));           // side rail
    sq(V3(x, yT - 0.2, hd), V3(x, yT - 0.035, hd - 0.17), 0.018); // bracket strut
  }
  sq(V3(-hw, yT - 0.025, hd), V3(hw, yT - 0.025, hd));            // front rail
  sq(V3(-hw, 0.3, -hd), V3(hw, 0.3, -hd), 0.02);                  // low back rail
  const top = G.roundedBox(W - 0.01, 0.018, tD, 0.002);
  { const P = top.attributes.position, U = top.attributes.uv; for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) * 0.8 + 0.3, P.getZ(i) * 0.8); }
  top.translate(0, yT + 0.009, tz0 + tD / 2 - 0.12 + 0.06);
  bins.add(wood, top);
  const lip = G.roundedBox(W - 0.008, 0.02, 0.004, 0.0015); lip.translate(0, yT + 0.009, tz0 + tD - 0.06 + 0.002); bins.add(edge, lip);
  }
  // ---- skirt (rok) round the counter ---------------------------------------------------------------
  if (p.skirt && !kapOnly) {
    const sHex = K.col(p.skirt, M.COLORS.wit);
    const sk = K.polyesterFabric(sHex), skBand = K.polyesterFabric(sHex);
    const zF = tz0 + tD / 2 - 0.12 + 0.06 + tD / 2 + 0.006, zB = tz0 + tD / 2 - 0.12 + 0.06 - tD / 2 + 0.03;
    const xS = hw + 0.004;
    // path round the counter: right side (back -> front), front (right -> left), left side (front -> back)
    const path = [[xS, zB], [xS, zF], [-xS, zF], [-xS, zB]];
    const segs = []; let tot = 0;
    for (let i = 0; i < 3; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1]; const L = Math.hypot(bx - ax, bz - az); segs.push({ ax, az, bx, bz, L, t0: tot }); tot += L; }
    const at = (t) => { for (const sg of segs) if (t <= sg.t0 + sg.L + 1e-9) { const f = (t - sg.t0) / sg.L; return { x: sg.ax + (sg.bx - sg.ax) * f, z: sg.az + (sg.bz - sg.az) * f, nx: (sg.bz - sg.az) / sg.L, nz: -(sg.bx - sg.ax) / sg.L }; } const sg = segs[2]; return { x: sg.bx, z: sg.bz, nx: (sg.bz - sg.az) / sg.L, nz: -(sg.bx - sg.ax) / sg.L }; };
    // gathered folds: irregular pitch ~8 cm, deeper towards the hem; at the corners the folds open
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const nF = Math.round(tot / 0.075), cw = [0]; for (let k = 0; k < nF; k++) cw.push(cw[k] + 0.6 + 0.8 * rnd());
    const amp = []; for (let k = 0; k <= nF + 1; k++) amp.push(0.6 + 0.8 * rnd());
    const yTop = yT - 0.002, yBot = 0.025, band = 0.045;
    const nx = nF * 10, ny = 30, rows = [];
    for (let j = 0; j <= ny; j++) {
      const y = yTop - band - (yTop - band - yBot) * (j / ny), v = j / ny, row = [];
      for (let i = 0; i <= nx; i++) {
        const t = (i / nx) * tot, a = at(t);
        const fi = (i / nx) * cw[nF]; let k = 0; while (k < nF - 1 && cw[k + 1] < fi) k++;
        const fr = (fi - cw[k]) / (cw[k + 1] - cw[k]);
        const A = (amp[k] * (1 - fr) + amp[k + 1] * fr) * (0.012 + 0.014 * v);
        const d = A * Math.sin((k + fr) * Math.PI * 2) + 0.014 + 0.01 * v;
        row.push(V3(a.x + a.nx * d, y, a.z + a.nz * d));
      }
      rows.push(row);
    }
    // normals of the path point outwards (right side +x, front +z, left side -x)
    bins.add(sk, K.gridGeometry(rows));
    bins.add(sk, K.sweep(rows[ny].map((q) => q.clone().setY(yBot + 0.004)), 0.004, 5));
    // flat velcro band along the counter edge, the skirt gathered under it
    const bRows = [];
    for (let j = 0; j <= 1; j++) { const y = yTop - band * j, row = []; for (let i = 0; i <= 120; i++) { const a = at((i / 120) * tot); row.push(V3(a.x + a.nx * 0.026, y, a.z + a.nz * 0.026)); } bRows.push(row); }
    bins.add(skBand, K.gridGeometry(bRows));
    bins.add(M.tentThread(sHex), K.sweep(bRows[1].map((q) => q.clone().add(V3(0, 0.006, 0))), 0.0009, 4));
  }

  // ---- canopy ----------------------------------------------------------------------------------
  const xe = hw + 0.012;
  const sagA = 0.008;
  const yAt = yCloth;
  // the cloth dips a little between the rafters, zero over the ridge, eave beams and rafters
  const sag = (x, z) => { const az = Math.abs(z); const fz = az <= hd ? az / hd : (az - hd) / ov; return sagA * Math.abs(Math.sin(Math.PI * (x + hw) / (W / 2))) * Math.sin(Math.PI * Math.min(1, fz)); };
  const NX = 40, NZ = 20;
  const slopeRows = (z0, z1) => { const rows = []; for (let j = 0; j <= NZ; j++) { const z = z0 + (z1 - z0) * (j / NZ), row = []; for (let i = 0; i <= NX; i++) { const x = -xe + (2 * xe * i) / NX; row.push(V3(x, yAt(z) - sag(x, z), z)); } rows.push(row); } return rows; };
  const frontRows = slopeRows(hd + ov + 0.01, 0), backRows = slopeRows(0, -hd - 0.01);
  const vH = 0.24;
  // kartelrand: the hem is a row of round scallops (25 cm pitch, 9 cm deep) instead of a straight edge
  const NXv = kartel ? 160 : NX;
  const pitch = (2 * xe) / Math.max(1, Math.round((2 * xe) / 0.25));
  const hemLift = (x) => { if (!kartel) return 0; const u = (((x + xe) / pitch) % 1 + 1) % 1, q = (u - 0.5) * 2; return 0.09 * (1 - Math.sqrt(Math.max(0, 1 - q * q))); };
  const valRows = (zEdge, yEdge, out) => { const rows = []; for (let j = 0; j <= 8; j++) { const f = j / 8, row = []; for (let i = 0; i <= NXv; i++) { const x = -xe + (2 * xe * i) / NXv; const yb = yEdge - vH + hemLift(x); row.push(V3(x, yb + (yEdge - yb) * f + 0.004 * Math.sin(x * 9) * (1 - f), zEdge + out * (0.006 + 0.008 * (1 - f)))); } rows.push(row); } return rows; };
  const fEdgeY = yAt(hd + ov + 0.01), bEdgeY = yAt(-hd - 0.01);
  const fVal = valRows(hd + ov + 0.01, fEdgeY, 1), bVal = valRows(-hd - 0.01, bEdgeY, -1);
  if (print) {
    const roofMat = K.printed(fabBase, K.artwork('panel'), 'stall-roof'), bandMat = K.printed(fabBase, K.artwork('band'), 'stall-band');
    const uvSlope = new Float32Array((NZ + 1) * (NX + 1) * 2); let m = 0;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { uvSlope[m++] = i / NX; uvSlope[m++] = 0.08 + 0.84 * (j / NZ); }
    const uvVal = new Float32Array(9 * (NXv + 1) * 2); m = 0;
    for (let j = 0; j <= 8; j++) for (let i = 0; i <= NXv; i++) { uvVal[m++] = i / NXv; uvVal[m++] = j / 8; }
    K.addMesh(group, K.gridGeometry(frontRows, { uv1: uvSlope }), roofMat);
    K.addMesh(group, K.gridGeometry(fVal, { uv1: uvVal }), bandMat);
  } else { bins.add(fabBase, K.gridGeometry(frontRows)); bins.add(fabBase, K.gridGeometry(fVal)); }
  bins.add(fabBase, K.gridGeometry(backRows)); bins.add(fabBase, K.gridGeometry(bVal));
  // gable triangles (closed), slightly tensioned
  for (const sx of [-1, 1]) {
    const rows = [];
    for (let j = 0; j <= 14; j++) { const f = j / 14, row = []; for (let i = 0; i <= 24; i++) { const z = -hd - 0.01 + ((2 * hd + ov + 0.02) * i) / 24; const yTop = yAt(z), yBot = Math.min(yTop, He + 0.01); row.push(V3(sx * (xe + 0.002), yBot + (yTop - yBot) * f, z)); } rows.push(row); }
    bins.add(fabBase, K.gridGeometry(rows));
  }
  // hems + stitch lines of the valances
  for (const rows of [fVal, bVal]) {
    bins.add(fabBase, K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.004, 0))), 0.0045, 5));
    bins.add(thread, K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.02, Math.sign(q.z) * 0.0028))), 0.001, 4));
  }
  // ridge cap
  const rp = []; for (let i = 0; i <= 20; i++) rp.push(V3(-xe + (2 * xe * i) / 20, Hr + c + 0.002, 0));
  bins.add(K.pvcPatch(hex), K.sweep(rp, 0.008, 6));

  bins.build(group);
  return {
    object: group,
    detail: { target: [hw - 0.2, yT, hd], size: 0.7, azimuth: 30, elevation: 20 },
    // the loose cover is seen from the front left, so it never repeats the complete stall's hero
    view: { hero: kapOnly ? { azimuth: -34, elevation: 20 } : { elevation: 17 } },
    // white kap: a touch more exposure than the generic white tent rig, so it reads white (~248) like the easy-up
    rig: { default: { ...K.tentRig(hex, { print: !!print }), ...(K.lumOf(hex) > 0.7 && !print ? { exposure: 0.6 } : {}) } },
    meta: { W, D },
  };
}
