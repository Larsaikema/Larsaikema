// Marktkraam (market stall), 2 m.
//
// Round 7 rebuild (art direction: "stiff CAD, not fabric": a rigid plate with a raised ridge
// strip and a dead-straight eave, no sag, no wrinkles, no lacing, ball bungees as black dots,
// die-cut kartel scallops, a corrugated-sheet skirt, bare square tube without joints, the
// 'zwart' frame indistinguishable from the #3A3D41 standard frame, no roof support visible
// under the open gable of the loose-kap shots).
//
// Frame (product copy: "stalen buizen met insteekverbindingen, gegalvaniseerd of zwart
// gepoedercoat"): round 32 mm steel tube, hot-dip galvanised by default (`frame: 'zwart'` =
// black powder coat). Every joint is a welded socket node (knuckle + one sleeve per tube, a weld
// bead, a chamfered mouth and a T-handle thumb screw on each sleeve): post tops, the apex of each
// gable, the middle rafter on the eave beams and the ridge. Each gable is an open truss (two
// rafters, a tie beam at eave height and a king post), so the roof support reads under the side
// flap. The counter liggers and the low rails hang on the posts in T-clamps (a sleeve round the
// post with its own thumb screw); the posts stand in sockets on foot plates; the overhanging
// rafter ends carry black end caps.
//
// Kap (PVC 500 g/m2): one cover over both slopes that LIES on the frame: it drapes over a round
// ridge tube (a soft crown, no raised strip), sags between the rafters (each 1 m bay ~3.5 cm,
// every bay a little different), the overhang between the rafter tips is a free roped edge that
// dips ~2.5 cm per bay and curves in, tension wrinkles fan out of every tied corner (rafter tips,
// eave and ridge nodes), the connector knuckles show as soft bumps under the cloth. It wraps
// round the gable rafters into side flaps and round the rope edge into the front flap (20 cm,
// "kartelrand langs voor- en zijkanten"); the back wraps the back eave beam into a short plain
// flap. Flaps hang free between their ties with a soft belly and vertical folds; the corners
// are split and laced (spiral lacing through three eyelet pairs). Elastics: ball bungees whose
// cord loops out of each eyelet with the ball hanging on it, the cloth pulled in at every tie.
// `valance: 'kartel'`: the flap hems are cut in round scallops with a bound edge (bias tape bead
// + stitch line following the scallop), each scallop with its own depth and a slight outward
// curl at its lowest point.
//
// Rok (`skirt: <colour>`): polyester 220 g/m2 knife-pleated skirt round the front and both sides
// of the counter, hung on a velcro band along the board edge; pressed flat under the band, the
// pleats open towards the hem (irregular widths and depths, creases that drift sideways), a
// slight A-line flare, an uneven hem with a stitched hem band, the pleats spread round the
// rounded corners.
//
//   { w (2|3), depth, canopyColor, frameColor | frame, canopyPrint, valance, only, skirt }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';
import * as CK from '../js/clothKit.js';

const { V3 } = K;
const TAU = Math.PI * 2;
const sst = CK.sst;
// grid surface with its normals turned to `out` (the engine's cloth shading - translucency,
// weave relief, sheen - reads the geometric normal, so every panel must face outwards)
const gridOut = (rows, out, opts = {}) => {
  const n = T2.gridNormal(rows, rows[0].length >> 1, rows.length >> 1);
  return K.gridGeometry(rows, { ...opts, flip: n.dot(out) < 0 });
};

export function marketStall(p = {}) {
  const W = Number(p.w ?? 2), D = Number(p.depth ?? 1.2);
  const hex = K.col(p.canopyColor || p.color || 'rood', M.COLORS.rood);
  const print = p.canopyPrint || p.print || null;
  const fab = K.pvc(hex);
  const patch = K.pvcPatch(hex);
  const thread = M.tentThread(hex);
  const frameName = String(p.frameColor || (typeof p.frame === 'string' ? p.frame : '') || 'verzinkt');
  const galv = frameName === '' || /verzink|galva|gegalv|zink|zilver|standaard/i.test(frameName);
  const steel = galv ? M.galvanised() : M.steelPowder(K.col(frameName, M.COLORS.zwart), { roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.3 });
  const knobM = M.mouldedNylon(galv ? '#17181A' : '#2B2C2F');
  const capM = M.mouldedNylon('#121213');
  const cordM = M.mouldedNylon('#19191B');
  const ballM = M.mouldedNylon('#101011');
  const eyeM = M.galvanised(), holeM = M.mouldedNylon('#0B0B0C');
  const kapOnly = String(p.only || '') === 'kap';
  const kartel = /kartel|scallop/i.test(String(p.valance || ''));
  const wood = M.birchFace(), edge = M.birchEdge();
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `marketStall ${W}`;

  // ---- dimensions ----------------------------------------------------------------------------
  const hw = W / 2, hd = D / 2;
  const rt = 0.016, rs = rt + 0.0032;          // tube, socket sleeve
  const yA = 2.47;                              // rafter centre line at the apex
  const kS = 0.34 / hd;                         // roof slope (29.5 deg)
  const th = Math.atan(kS), cT = Math.cos(th), sT = Math.sin(th);
  const ov = 0.25, tip = hd + ov;               // front overhang
  const yR = (z) => yA - kS * Math.abs(z);      // rafter centre line
  const yN = yR(hd);                            // nodes on the post tops
  const cg = 0.005, Rc = rt + cg;               // cloth over a tube
  const zc = Rc * sT;
  // cloth line over the rafters: straight slopes, a round crown over the ridge tube
  const yTop0 = (z) => (Math.abs(z) < zc ? yA + Math.sqrt(Rc * Rc - z * z) : yA + Rc / cT - kS * Math.abs(z));
  const vH = 0.2;                               // flap height (kartelrand ca. 20 cm)
  const yT = 0.868;                             // counter top surface

  // ---- frame ---------------------------------------------------------------------------------
  const tube = (a, b, r = rt) => bins.add(steel, G.tube(a, b, r, 22, { caps: true }));
  const nrm = (x, y, z) => V3(x, y, z).normalize();
  // thumb screw on a sleeve: a short stem and a T-handle, on side `side` of the sleeve axis d
  const thumb = (at, d, side) => {
    const s0 = at.clone().addScaledVector(side, rs - 0.001), s1 = at.clone().addScaledVector(side, rs + 0.017);
    bins.add(knobM, G.tube(s0, s1, 0.0036, 10, { caps: true }));
    const Tt = V3().crossVectors(d, side).normalize();
    bins.add(knobM, G.tube(s1.clone().addScaledVector(Tt, -0.014), s1.clone().addScaledVector(Tt, 0.014), 0.0034, 10, { caps: true }));
    const hub = new THREE.SphereGeometry(0.0052, 10, 8); hub.translate(s1.x, s1.y, s1.z); bins.add(knobM, hub);
  };
  // welded socket node: knuckle + sleeves; `screwAway` pushes the thumb screws away from a
  // direction (the cloth above the roof nodes)
  const node = (at, dirs, { len = 0.072, screws = true, screwAway = V3(0, 1, 0), ball = true } = {}) => {
    if (ball) { const kn = new THREE.SphereGeometry(rs * 1.14, 22, 14); kn.translate(at.x, at.y, at.z); bins.add(steel, kn); }
    for (const d0 of dirs) {
      const d = d0.clone().normalize();
      const a = at.clone().addScaledVector(d, rs * 0.35), b = at.clone().addScaledVector(d, len);
      bins.add(steel, G.tube(a, b, rs, 22, { caps: true }));
      // mouth lip and weld bead
      const lip = new THREE.TorusGeometry(rs - 0.0004, 0.0013, 6, 22); lip.lookAt(d); lip.translate(b.x, b.y, b.z); bins.add(steel, lip);
      const wb = new THREE.TorusGeometry(rs * 1.02, 0.0024, 6, 22); wb.lookAt(d); const wp = at.clone().addScaledVector(d, rs * 0.75); wb.translate(wp.x, wp.y, wp.z); bins.add(steel, wb);
      if (screws) {
        let side = screwAway.clone().negate().addScaledVector(d, -screwAway.clone().negate().dot(d));
        if (side.lengthSq() < 0.01) side = V3(1, 0, 0).addScaledVector(d, -d.x);
        side.normalize();
        thumb(at.clone().addScaledVector(d, len * 0.66), d, side);
      }
    }
  };
  // T-clamp on a post at height y: a sleeve round the post plus a sleeve for the rail
  const clamp = (x, y, z, railDirs, screwSide) => {
    const c = V3(x, y, z);
    bins.add(steel, G.tube(c.clone().add(V3(0, -0.045, 0)), c.clone().add(V3(0, 0.045, 0)), rs, 22, { caps: true }));
    for (const yy of [-0.045, 0.045]) { const lip = new THREE.TorusGeometry(rs - 0.0004, 0.0013, 6, 22); lip.lookAt(V3(0, 1, 0)); lip.translate(x, y + yy, z); bins.add(steel, lip); }
    for (const d0 of railDirs) {
      const d = d0.clone().normalize();
      const a = c.clone().addScaledVector(d, rs * 0.6), b = c.clone().addScaledVector(d, 0.068);
      bins.add(steel, G.tube(a, b, rs, 22, { caps: true }));
      const lip = new THREE.TorusGeometry(rs - 0.0004, 0.0013, 6, 22); lip.lookAt(d); lip.translate(b.x, b.y, b.z); bins.add(steel, lip);
      const wb = new THREE.TorusGeometry(rs * 1.02, 0.0024, 6, 22); wb.lookAt(d); const wp = c.clone().addScaledVector(d, rs * 1.05); wb.translate(wp.x, wp.y, wp.z); bins.add(steel, wb);
    }
    thumb(c.clone().add(V3(0, 0.02, 0)), V3(0, 1, 0), screwSide.clone().normalize());
  };
  const up = V3(0, 1, 0), dn = V3(0, -1, 0);
  const upF = nrm(0, kS, -1), upB = nrm(0, kS, 1), dnF = nrm(0, -kS, 1), dnB = nrm(0, -kS, -1);
  const sk = 0.02; // tubes run this far into each sleeve
  // posts (continuous from the foot socket to the top node) with foot plates and sockets
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * hw, z = sz * hd;
    bins.add(steel, K.footPlate(x, z, 0.12, 0.006));
    bins.add(steel, G.tube(V3(x, 0.006, z), V3(x, 0.105, z), rs, 22, { caps: true }));
    const lip = new THREE.TorusGeometry(rs - 0.0004, 0.0013, 6, 22); lip.lookAt(up); lip.translate(x, 0.105, z); bins.add(steel, lip);
    // four gussets on the foot plate
    for (const [gx, gz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const g = G.roundedBox(0.003, 0.035, 0.03, 0.001); g.translate(0, 0.0235, rs + 0.015);
      g.rotateY(Math.atan2(gx, gz)); g.translate(x, 0, z); bins.add(steel, g);
    }
    tube(V3(x, 0.02, z), V3(x, yN - rs * 0.4, z));
    const dirs = [dn, V3(-sx, 0, 0), V3(0, 0, -sz), sz > 0 ? upF : upB];
    if (sz > 0) dirs.push(dnF);
    node(V3(x, yN, z), dirs, { screwAway: V3(sx * 0.2, 1, sz * 0.2) });
  }
  // apex nodes of the gables and the middle rafter on the ridge, the ridge tube
  for (const sx of [-1, 1]) node(V3(sx * hw, yA, 0), [dnF, dnB, V3(-sx, 0, 0), dn], { screwAway: V3(0, 1, 0) });
  node(V3(0, yA, 0), [dnF, dnB, V3(1, 0, 0), V3(-1, 0, 0)], { screwAway: V3(0, 1, 0) });
  tube(V3(-hw + sk, yA, 0), V3(-sk, yA, 0)); tube(V3(sk, yA, 0), V3(hw - sk, yA, 0));
  // middle rafter on the eave beams (T nodes), eave beams front and back
  for (const sz of [-1, 1]) {
    const dirs = [V3(1, 0, 0), V3(-1, 0, 0), sz > 0 ? upF : upB];
    if (sz > 0) dirs.push(dnF);
    node(V3(0, yN, sz * hd), dirs, { screwAway: V3(0, 1, 0) });
    tube(V3(-hw + sk, yN, sz * hd), V3(-sk, yN, sz * hd)); tube(V3(sk, yN, sz * hd), V3(hw - sk, yN, sz * hd));
  }
  // rafters: back eave -> apex -> front eave -> overhang tip (end cap)
  const rafPt = (x, z) => V3(x, yR(z), z);
  for (const x of [-hw, 0, hw]) {
    const off = sk * cT;
    tube(rafPt(x, -hd + off), rafPt(x, -off)); tube(rafPt(x, off), rafPt(x, hd - off));
    // the rafter ends ~3 cm inside the cloth's roped front edge (the cover wraps over its cap)
    const tipP = rafPt(x, tip - 0.034 * cT);
    tube(rafPt(x, hd + off), tipP);
    const cap = G.tube(tipP.clone().addScaledVector(dnF, -0.004), tipP.clone().addScaledVector(dnF, 0.016), rt + 0.0016, 22, { caps: true }); bins.add(capM, cap);
    bins.add(capM, K.domeCap(tipP.clone().addScaledVector(dnF, 0.016), dnF, rt + 0.0016, 0.45, 18));
  }
  // gable trusses: tie beam at eave height + king post
  for (const sx of [-1, 1]) {
    const x = sx * hw;
    node(V3(x, yN, 0), [V3(0, 0, 1), V3(0, 0, -1), up], { len: 0.06, screwAway: V3(-sx, 0, 0), ball: false });
    tube(V3(x, yN, -hd + sk), V3(x, yN, -sk)); tube(V3(x, yN, sk), V3(x, yN, hd - sk));
    tube(V3(x, yN + sk, 0), V3(x, yA - sk, 0));
  }
  // counter liggers and low rails on T-clamps (the side rails 4 mm inside the post line, so the
  // board edge and the skirt pass outside them)
  const xr = hw - 0.004;
  const yL = yT - 0.018 - rt;
  for (const yy of (kapOnly ? [0.3] : [yL, 0.3])) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const dirs = [V3(0, 0, -sz)];
        if (sz < 0) dirs.push(V3(-sx, 0, 0));
        clamp(sx * hw, yy, sz * hd, dirs, V3(sx, 0, sz * 0.4));
      }
      tube(V3(sx * xr, yy, -hd + 0.05), V3(sx * xr, yy, hd - 0.05));
    }
    tube(V3(-hw + 0.05, yy, -hd), V3(hw - 0.05, yy, -hd));
  }

  // ---- counter top (werkblad 200 x 100, 18 mm multiplex on the side liggers) -----------------
  const xT = hw + 0.016, zF = hd - 0.06, zBk = zF - 1.0;
  if (!kapOnly) {
    const tD = zF - zBk;
    const top = G.roundedBox(2 * xT, 0.018, tD, 0.0025);
    { const P = top.attributes.position, U = top.attributes.uv; for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) * 0.8 + 0.3, P.getZ(i) * 0.8); }
    top.translate(0, yT - 0.009, (zF + zBk) / 2);
    bins.add(wood, top);
    const lip = G.roundedBox(2 * xT + 0.001, 0.0185, 0.003, 0.001); lip.translate(0, yT - 0.009, zF + 0.0001); bins.add(edge, lip);
  }

  // ---- kap: shape --------------------------------------------------------------------------
  const sagA = 0.056;
  const bayOf = (x) => Math.min(1, Math.max(0, Math.floor((x + hw) / hw)));
  const fxOf = (x) => (x + hw) / hw - bayOf(x);
  const Sx = (x) => (Math.abs(x) >= hw ? 0 : Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, fxOf(x)))), 0.85));
  // along the slope: zero on the ridge tube and on the eave beams (the cloth rests on them),
  // a broad trough between them, and on the overhang a free roped edge that dips
  const gz = (z) => {
    if (z > hd) { const fo = Math.min(1, (z - hd) / ov); return 0.72 * Math.pow(Math.sin((Math.PI / 2) * fo), 1.25); }
    const f = Math.min(1, Math.abs(z) / hd);
    return Math.pow(Math.sin(Math.PI * f), 0.8);
  };
  const bayK = (x, z) => (z >= 0 ? [0.93, 1.07] : [1.05, 0.9])[bayOf(x)];
  // tension wrinkles out of every tied corner, in (a = x, b = z)
  const fans = [];
  for (const xr0 of [-hw, 0, hw]) for (const sd of [-1, 1]) {
    if ((xr0 <= -hw + 1e-6 && sd < 0) || (xr0 >= hw - 1e-6 && sd > 0)) continue;
    const ph = CK.hash(xr0 * 3.7 + sd * 1.3) * TAU;
    fans.push({ a: xr0, b: tip, da: sd * 0.62, db: -1, A: 0.012, lam: 0.13, reach: 0.4, spread: 0.6, phase: ph, w0: 0.03 });
    fans.push({ a: xr0, b: hd, da: sd * 0.75, db: -0.7, A: 0.0065, lam: 0.12, reach: 0.3, spread: 0.55, phase: ph + 1.1 });
    fans.push({ a: xr0, b: -hd, da: sd * 0.7, db: 0.75, A: 0.007, lam: 0.12, reach: 0.34, spread: 0.55, phase: ph + 2.3 });
    fans.push({ a: xr0, b: 0, da: sd * 0.7, db: 1, A: 0.0045, lam: 0.11, reach: 0.26, spread: 0.5, phase: ph + 0.7 });
    fans.push({ a: xr0, b: 0, da: sd * 0.7, db: -1, A: 0.0045, lam: 0.11, reach: 0.26, spread: 0.5, phase: ph + 1.9 });
  }
  const wr = CK.fanWrinkles(fans);
  const wrink = (x, z) => (Math.abs(x) >= hw ? 0 : wr(x, z) * Math.pow(Math.sin(Math.PI * fxOf(x)), 0.5) * sst(0, 0.05, Math.abs(z) - zc));
  // the socket knuckles under the cloth (middle rafter on the ridge and the eave beams)
  const bumps = (x, z) => {
    let b = 0;
    for (const z0 of [0, hd, -hd]) b += 0.0035 * Math.exp(-(x * x + (z - z0) * (z - z0)) / (2 * 0.028 * 0.028));
    return b;
  };
  const roofY = (x, z) => yTop0(z) - sagA * bayK(x, z) * Sx(x) * gz(z) + wrink(x, z) * 0.95 + bumps(x, z);
  // the roped front edge: dips with the sag and curves in between the rafter tips
  const zEdge = (x) => tip - 0.013 * Math.pow(Sx(x), 1.2);

  // ---- kap: flap helpers -------------------------------------------------------------------
  // kartel: hem lift (0 at the bottom of a scallop, Dk at a cusp); s along the hem, pitch P,
  // first cusp at s0; per-scallop depth jitter
  const Dk = 0.072;
  const scal = (s, s0, P, seed) => {
    const t = (s - s0) / P, k = Math.floor(t), u = t - k, q = 2 * u - 1;
    const dk = Dk * (0.94 + 0.12 * CK.hash(k * 7.1 + seed));
    return { lift: dk * (1 - Math.pow(Math.max(0, 1 - q * q), 0.62)), q, k, low: Math.pow(Math.max(0, 1 - q * q), 1.5) };
  };
  // flap offset outwards (belly between ties, pinch at ties, soft vertical folds); s along the
  // flap, f 0 (top) .. 1 (hem), ties at first + n * pitch
  const flapOut = (s, f, tie0, tieP, seed) => {
    const fe = CK.festoon(s, tie0, tieP);
    const lo = Math.pow(f, 1.15);
    const fold = 0.0068 * CK.noise1(s * 3.3 + seed, seed) + 0.0032 * CK.noise1(s * 8.7 + 2 * seed, seed + 3);
    const pinch = 0.0032 * (1 - fe.d) * Math.cos(fe.ph * Math.PI * 7) * (1 - fe.d);
    return 0.0015 + lo * (0.0105 * sst(0, 1, fe.d) + fold * (0.6 + 0.4 * f) + pinch) - 0.003 * (1 - fe.d) * Math.pow(1 - fe.d, 3) * (1 - f) * 0.5;
  };

  // ---- kap: roof slopes (front with overhang, back), gable bends and side flaps -----------
  const NX = kartel ? 240 : 160, NC = 6, NZf = 70, NZb = 46, NB = 9, NF = 18;
  const zRow = (j, zEnd, nz) => (j <= NC ? (j / NC) * zc * Math.sign(zEnd) : Math.sign(zEnd) * zc + ((j - NC) / (nz - NC)) * (zEnd - Math.sign(zEnd) * zc));
  const roofRows = (zEndFn, nz) => {
    const rows = [];
    for (let j = 0; j <= nz; j++) {
      const row = [];
      for (let i = 0; i <= NX; i++) { const x = -hw + (2 * hw * i) / NX; const z = zRow(j, zEndFn(x), nz); row.push(V3(x, roofY(x, z), z)); }
      rows.push(row);
    }
    return rows;
  };
  const frontRows = roofRows(zEdge, NZf);
  const backRows = roofRows(() => -hd, NZb);
  // side flaps: arc length along the sloped hem from the front corner (front slope) and from
  // the apex (back slope); 4 + 3 scallops
  const sFront = tip / cT, sBack = (hd + Rc) / cT;
  const sideHem = (z) => {
    const s = z >= 0 ? (tip - z) / cT : sFront + (-z) / cT; // 0 at the front corner
    if (!kartel) return { lift: 0, s, q: 0, low: 0 };
    return { ...(z >= 0 ? scal(s, 0, sFront / 4, 3.1) : scal(s, sFront, sBack / 3, 5.3)), s };
  };
  const sideTie0 = 0.07, sideTieP = (sFront + sBack - 0.14) / 6;
  const gapC = 0.007;
  const sidePiece = (sx, zEnd, nz) => {
    // columns: bend (phi 0 -> 90 deg round the gable rafter), then the flap down to the hem
    const rows = [];
    for (let j = 0; j <= nz; j++) {
      // the back piece runs on past the back eave beam to the back face of the cover
      const z = zRow(j, zEnd < 0 ? -(hd + Rc - gapC) : zEnd, nz);
      const row = [];
      const yr = yR(z), yt = yTop0(z);
      for (let i = 0; i <= NB; i++) {
        const ph = ((i / NB) * Math.PI) / 2;
        row.push(V3(sx * (hw + Rc * Math.sin(ph)), yr + (yt - yr) * Math.cos(ph), z));
      }
      const hm = sideHem(z);
      const hemY = yt - vH + hm.lift;
      for (let k = 1; k <= NF; k++) {
        const f = k / NF;
        let out = flapOut(hm.s, f, sideTie0, sideTieP, sx > 0 ? 11 : 17);
        if (kartel) out += f * f * f * (0.0055 * hm.low - 0.0022 * (1 - hm.low));
        row.push(V3(sx * (hw + Rc + out), yr - f * (yr - hemY), z));
      }
      rows.push(row);
    }
    return rows;
  };
  const sides = [];
  for (const sx of [-1, 1]) {
    // right side: columns run outwards from the roof; left side mirrored (reverse for winding)
    sides.push(sidePiece(sx, tip, NZf));
    sides.push(sidePiece(sx, -hd, NZb));
  }
  // back: the cloth wraps the back eave beam into a short plain flap
  const backWrap = [];
  {
    const last = backRows[backRows.length - 1];
    const NW = 8, NBF = 8, vB = 0.1;
    for (let k = 1; k <= NW + NBF; k++) {
      const row = [];
      for (let i = 0; i <= NX; i++) {
        const P0 = last[i], rb = P0.y - yN;
        let q;
        if (k <= NW) { const ph = ((k / NW) * Math.PI) / 2; q = V3(P0.x, yN + rb * Math.cos(ph), -hd - rb * Math.sin(ph)); }
        else {
          const f = (k - NW) / NBF;
          const out = 0.002 + f * (0.005 * sst(0, 1, CK.festoon(P0.x, -hw + 0.06, (2 * hw - 0.12) / 3).d) + 0.002 * CK.noise1(P0.x * 4.1, 23));
          q = V3(P0.x, yN - f * vB, -hd - rb - out);
        }
        row.push(q);
      }
      backWrap.push(row);
    }
    backWrap.unshift(last);
  }
  // front flap: round the rope edge (bead) and down to the hem
  const xF = hw + Rc - gapC;
  // front flap columns: exactly the roof's columns (no cracks along the roped edge) plus the
  // corner columns round the gable rafter ends
  const xCols = [];
  for (let k = 1; k <= 4; k++) xCols.push(-hw - ((xF - hw) * (5 - k)) / 4);
  for (let i = 0; i <= NX; i++) xCols.push(-hw + (2 * hw * i) / NX);
  for (let k = 1; k <= 4; k++) xCols.push(hw + ((xF - hw) * k) / 4);
  const NXF = xCols.length - 1;
  const frontScP = (2 * xF) / 8;
  const frontTie0 = -hw, frontTieP = hw;
  const edgeAt = (x) => {
    if (Math.abs(x) <= hw) { const z = zEdge(x); return V3(x, roofY(x, z), z); }
    const ph = Math.asin(Math.min(1, (Math.abs(x) - hw) / Rc));
    const yr = yR(tip);
    return V3(x, yr + (yTop0(tip) - yr) * Math.cos(ph), tip);
  };
  const rb = 0.0065;
  const tS = V3(0, -sT, cT), nS = V3(0, cT, sT);
  const fBead = [], fFlap = [];
  const NBd = 6;
  const hemF = [];
  for (let i = 0; i <= NXF; i++) {
    const x = xCols[i];
    const E = edgeAt(x);
    const C = E.clone().addScaledVector(nS, -rb);
    const col = [];
    for (let k = 0; k <= NBd; k++) { const b = ((k / NBd) * (Math.PI / 2 - th)); col.push(C.clone().addScaledVector(nS, rb * Math.cos(b)).addScaledVector(tS, rb * Math.sin(b))); }
    fBead.push(col);
    const B = col[NBd];
    const Eh = edgeAt(Math.max(-hw, Math.min(hw, x)));
    const hs = kartel ? scal(x, -xF, frontScP, 9.7) : { lift: 0, low: 0 };
    const hy = Eh.y - vH + hs.lift;
    hemF.push(hy);
    const fc = [];
    for (let k = 1; k <= NF; k++) {
      const f = k / NF;
      let out = flapOut(x, f, frontTie0, frontTieP, 29);
      if (kartel) out += f * f * f * (0.0055 * hs.low - 0.0022 * (1 - hs.low));
      fc.push(V3(x, B.y - f * (B.y - hy), B.z + out));
    }
    fFlap.push(fc);
  }
  // rows[j][i] for the front flap (j: bead + flap downwards)
  const frontFlapRows = [];
  for (let k = 0; k <= NBd; k++) frontFlapRows.push(fBead.map((c) => c[k]));
  for (let k = 0; k < NF; k++) frontFlapRows.push(fFlap.map((c) => c[k]));

  // ---- kap: meshes -------------------------------------------------------------------------
  if (print) {
    const roofMat = K.printed(fab, K.artwork('panel'), 'stall-roof7'), bandMat = K.printed(fab, K.artwork('band'), 'stall-band7');
    const nz = frontRows.length - 1, nu = frontRows[0].length - 1;
    const uvS = new Float32Array((nz + 1) * (nu + 1) * 2); let m = 0;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nu; i++) { uvS[m++] = 0.02 + 0.96 * (i / nu); uvS[m++] = 0.94 - 0.88 * (frontRows[j][i].z / tip); }
    K.addMesh(group, gridOut(frontRows, nS, { uv1: uvS }), roofMat);
    const nr = frontFlapRows.length - 1, nc = frontFlapRows[0].length - 1;
    const uvV = new Float32Array((nr + 1) * (nc + 1) * 2); m = 0;
    for (let j = 0; j <= nr; j++) for (let i = 0; i <= nc; i++) { uvV[m++] = 0.02 + 0.96 * (i / nc); uvV[m++] = 0.92 - 0.84 * Math.min(1, Math.max(0, (yTop0(tip) - frontFlapRows[j][i].y) / vH)); }
    K.addMesh(group, gridOut(frontFlapRows, V3(0, 0, 1), { uv1: uvV }), bandMat);
  } else {
    bins.add(fab, gridOut(frontRows, nS));
    bins.add(fab, gridOut(frontFlapRows, V3(0, 0, 1)));
  }
  bins.add(fab, gridOut(backRows, V3(0, cT, -sT)));
  bins.add(fab, gridOut(backWrap, V3(0, 0, -1)));
  sides.forEach((sd, k) => bins.add(fab, gridOut(sd, V3(k < 2 ? -1 : 1, 0, 0))));

  // ---- kap: hems, binding, stitch lines ----------------------------------------------------
  // hem edges as a thin bead (the cloth has a thickness), the kartel hem bound with a bias tape
  // bead and a stitch line following every scallop
  const hemR = kartel ? 0.0032 : 0.0024;
  const hemMat = kartel ? patch : fab;
  const frontHem = fFlap.map((c) => c[NF - 1].clone().add(V3(0, 0.0012, 0.0004)));
  bins.add(hemMat, K.sweep(frontHem, hemR, 6));
  const sideHemPts = (s) => s.map((row) => row[row.length - 1].clone().add(V3(0, 0.0012, 0)));
  for (let k = 0; k < sides.length; k++) bins.add(hemMat, K.sweep(sideHemPts(sides[k]), hemR, 6));
  // vertical edges of the split corners (cloth thickness) and of the side flaps at the back
  for (const sx of [-1, 1]) {
    const s = sides[sx < 0 ? 0 : 2];
    const endRow = s[s.length - 1];
    bins.add(fab, K.sweep(endRow.slice(NB).map((q) => q.clone()), 0.0016, 5));
    const ci = sx < 0 ? 0 : fFlap.length - 1;
    bins.add(fab, K.sweep([fBead[ci][NBd], ...fFlap[ci]].map((q) => q.clone()), 0.0016, 5));
  }
  // stitch lines above the hem (kartel: following the scallop, 10 mm in; plain: a doubled hem
  // band of 3 cm with two stitch rows)
  // front flap rows at a height d above the hem: interpolate along each column
  const colAt = (colPts, yWant) => {
    for (let k = colPts.length - 1; k > 0; k--) {
      const a = colPts[k], b = colPts[k - 1];
      if ((a.y - yWant) * (b.y - yWant) <= 0) { const t = (yWant - a.y) / (b.y - a.y || 1e-9); return a.clone().lerp(b, t); }
    }
    return colPts[0].clone();
  };
  const stitchRow = (cols, dUp) => cols.map((c) => colAt(c, c[c.length - 1].y + dUp));
  const frontCols = fFlap.map((c, i) => [fBead[i][NBd], ...c]);
  const liftOut = (pts, v) => pts.map((q) => q.clone().add(v));
  if (kartel) {
    bins.add(thread, K.sweep(liftOut(stitchRow(frontCols, 0.011), V3(0, 0, 0.0016)), 0.00095, 4));
  } else {
    for (const d of [0.006, 0.026]) bins.add(thread, K.sweep(liftOut(stitchRow(frontCols, d), V3(0, 0, 0.0016)), 0.00095, 4));
    // doubled hem band (3 cm): a second layer just outside the flap (a printed flap is printed
    // through to the hem, so no unprinted band there)
    if (!print) {
      const band = [];
      for (let jj = 0; jj <= 2; jj++) band.push(frontCols.map((c) => { const hy = c[c.length - 1].y; return colAt(c, hy + 0.0005 + (0.03 * jj) / 2).add(V3(0, 0, 0.0009)); }));
      bins.add(patch, gridOut(band, V3(0, 0, 1)));
    }
  }
  for (let k = 0; k < sides.length; k++) {
    const sx = k < 2 ? -1 : 1;
    const cols = sides[k].map((row) => row.slice(NB));
    if (kartel) bins.add(thread, K.sweep(liftOut(stitchRow(cols, 0.011), V3(sx * 0.0016, 0, 0)), 0.00095, 4));
    else {
      for (const d of [0.006, 0.026]) bins.add(thread, K.sweep(liftOut(stitchRow(cols, d), V3(sx * 0.0016, 0, 0)), 0.00095, 4));
      const band = [];
      for (let jj = 0; jj <= 2; jj++) band.push(cols.map((c) => { const hy = c[c.length - 1].y; return colAt(c, hy + 0.0005 + (0.03 * jj) / 2).add(V3(sx * 0.0009, 0, 0)); }));
      bins.add(patch, gridOut(band, V3(sx, 0, 0)));
    }
  }
  // back flap hem
  bins.add(fab, K.sweep(backWrap[backWrap.length - 1].map((q) => q.clone().add(V3(0, 0.001, 0))), 0.0022, 5));
  // ---- elastics: ball bungees, eyelets, spiral lacing at the split corners -----------------
  // eyelet on the cloth at `at` (normal n); the elastic loops out of the eyelet and the ball
  // hangs on it a few cm lower, resting on the cloth; the cloth is pulled in round it
  const ballTie = (at, n, { drop = 0.024, ball = 0.0105 } = {}) => {
    bins.add(eyeM, CK.grommet(at, n, { R: 0.0105, r: 0.0058 }));
    bins.add(holeM, CK.grommetHole(at, n, { r: 0.006 }));
    const side = V3().crossVectors(n, V3(0, 1, 0)).normalize();
    const bc = at.clone().addScaledVector(n, ball * 0.92).add(V3(0, -drop, 0));
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const q = at.clone().addScaledVector(side, s * 0.0024 * Math.sin(Math.PI * Math.min(1, t * 1.2)))
          .addScaledVector(n, 0.0026 + (ball * 0.6) * t + 0.003 * Math.sin(Math.PI * t))
          .add(V3(0, -(drop - ball * 0.75) * t, 0));
        pts.push(q);
      }
      bins.add(cordM, K.sweep(pts, 0.0021, 6));
    }
    const sp = new THREE.SphereGeometry(ball, 16, 12); sp.translate(bc.x, bc.y, bc.z); bins.add(ballM, sp);
  };
  // front flap: at the three rafter tips (the outer two just inside the laced corners)
  for (const x of [-hw + 0.075, 0, hw - 0.075]) {
    let i = 0; xCols.forEach((xc, k) => { if (Math.abs(xc - x) < Math.abs(xCols[i] - x)) i = k; });
    const q = colAt(frontCols[i], frontCols[i][0].y - 0.04);
    ballTie(q.clone().add(V3(0, 0, 0.0018)), V3(0, 0, 1));
  }
  // side flaps: ties every ~27 cm along the sloped edge
  for (const sx of [-1, 1]) {
    for (let s = sideTie0; s < sFront + sBack - 0.05; s += sideTieP) {
      const z = s <= sFront ? tip - s * cT : -(s - sFront) * cT;
      const piece = sides[(sx < 0 ? 0 : 2) + (z >= 0 ? 0 : 1)];
      // nearest row
      let best = 0, bd = 1e9; piece.forEach((row, j) => { const d = Math.abs(row[0].z - z); if (d < bd) { bd = d; best = j; } });
      const col = piece[best].slice(NB);
      const q = colAt(col, col[0].y - 0.035);
      ballTie(q.clone().add(V3(sx * 0.0018, 0, 0)), V3(sx, 0, 0));
    }
  }
  // back flap: ties round the back eave beam
  for (const x of [-hw + 0.06, -hw / 2, hw / 2, hw - 0.06]) {
    const i = Math.round(((x + hw) / (2 * hw)) * NX);
    const row = backWrap[backWrap.length - 4];
    ballTie(row[i].clone().add(V3(0, 0, -0.0018)), V3(0, 0, -1), { drop: 0.018 });
  }
  // spiral lacing at the two front corners: eyelets on the side flap's front edge and on the
  // front flap's side edge, the cord crossing the split corner on the outside
  for (const sx of [-1, 1]) {
    const piece = sides[sx < 0 ? 0 : 2];
    const sCol = piece[piece.length - 3].slice(NB);  // 2 rows in from the front edge
    const fi = sx < 0 ? 3 : frontCols.length - 4;   // 3 columns in from the side edge
    const fCol = frontCols[fi];
    const yTopC = Math.min(sCol[0].y, fCol[0].y), yHemC = Math.max(sCol[sCol.length - 1].y, fCol[fCol.length - 1].y);
    const hgt = yTopC - yHemC;
    const sEy = [], fEy = [];
    for (const f of [0.2, 0.5, 0.8]) sEy.push(colAt(sCol, yTopC - f * hgt).add(V3(sx * 0.0018, 0, 0)));
    for (const f of [0.35, 0.65, 0.92]) fEy.push(colAt(fCol, yTopC - f * hgt).add(V3(0, 0, 0.0018)));
    for (const e of sEy) { bins.add(eyeM, CK.grommet(e, V3(sx, 0, 0), { R: 0.0085, r: 0.0047 })); bins.add(holeM, CK.grommetHole(e, V3(sx, 0, 0), { r: 0.0048 })); }
    for (const e of fEy) { bins.add(eyeM, CK.grommet(e, V3(0, 0, 1), { R: 0.0085, r: 0.0047 })); bins.add(holeM, CK.grommetHole(e, V3(0, 0, 1), { r: 0.0048 })); }
    const corner = V3(sx * (hw + Rc + 0.004), 0, tip + rb + 0.004);
    for (let k = 0; k < 3; k++) {
      const a = sEy[k], b = fEy[k];
      const cm = V3(corner.x, (a.y + b.y) / 2, corner.z);
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        // quadratic through the corner, lifted off the cloth
        const q = a.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(cm, 2 * t * (1 - t)).addScaledVector(b, t * t);
        pts.push(q);
      }
      pts[0] = a.clone().add(V3(sx * 0.001, 0, 0)); pts[12] = b.clone().add(V3(0, 0, 0.001));
      bins.add(cordM, K.sweep(pts, 0.0022, 6));
    }
    // the cord's knotted tail under the last eyelet
    const e = fEy[2];
    bins.add(cordM, K.sweep([e.clone().add(V3(0, 0, 0.002)), e.clone().add(V3(sx * -0.004, -0.02, 0.004)), e.clone().add(V3(sx * -0.002, -0.045, 0.003))], 0.002, 5));
    const kn = new THREE.SphereGeometry(0.0042, 10, 8); kn.translate(e.x + sx * -0.002, e.y - 0.047, e.z + 0.003); bins.add(cordM, kn);
  }

  // ---- skirt (rok) round the counter -------------------------------------------------------
  if (p.skirt && !kapOnly) {
    const sHex = K.col(p.skirt, M.COLORS.wit);
    let skM = K.polyesterFabric(sHex);
    const skT = M.tentThread(sHex);
    if (K.lumOf(sHex) < 0.05) {
      // black polyester: the pleats read through the fibre sheen on their flanks (with the
      // white kap's exposure the plain cloth sat at ~7/255 and read as a black box)
      const m = skM.clone();
      m.sheen = 0.8; m.sheenRoughness = 0.42; m.roughness = 0.56;
      m.sheenColor = skM.color.clone().multiplyScalar(4.2);
      m.userData = { ...JSON.parse(JSON.stringify(skM.userData || {})), envSpec: 0.5 }; delete m.userData.__hooked;
      m.name = skM.name + ' rok';
      skM = m;
    }
    const rcS = 0.03;                             // rounded corners of the hang line
    const x0 = xT + 0.006, zf0 = zF + 0.006;
    // plan path: right side (back -> front), front (right -> left), left side (front -> back)
    const plan = [];
    const pushL = (a, b, n) => { for (let i = 0; i < n; i++) { const t = i / n; plan.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } };
    const pushArc = (cx, cz, a0, a1, n) => { for (let i = 0; i < n; i++) { const a = a0 + ((a1 - a0) * i) / n; plan.push([cx + rcS * Math.cos(a), cz + rcS * Math.sin(a)]); } };
    pushL([x0, zBk], [x0, zf0 - rcS], 60);
    pushArc(x0 - rcS, zf0 - rcS, 0, Math.PI / 2, 10);
    pushL([x0 - rcS, zf0], [-x0 + rcS, zf0], 120);
    pushArc(-x0 + rcS, zf0 - rcS, Math.PI / 2, Math.PI, 10);
    pushL([-x0, zf0 - rcS], [-x0, zBk], 60);
    plan.push([-x0, zBk]);
    // resample by arc length
    const acc = [0]; for (let i = 1; i < plan.length; i++) acc.push(acc[i - 1] + Math.hypot(plan[i][0] - plan[i - 1][0], plan[i][1] - plan[i - 1][1]));
    const tot = acc[acc.length - 1];
    const at = (t) => {
      let i = 1; while (i < plan.length - 1 && acc[i] < t) i++;
      const f = (t - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
      const x = plan[i - 1][0] + (plan[i][0] - plan[i - 1][0]) * f, z = plan[i - 1][1] + (plan[i][1] - plan[i - 1][1]) * f;
      const tx = plan[i][0] - plan[i - 1][0], tz = plan[i][1] - plan[i - 1][1], l = Math.hypot(tx, tz) || 1;
      return { x, z, nx: tz / l, nz: -tx / l };
    };
    // corner arc lengths (pleats spread there)
    const c1 = acc[60] + (Math.PI / 2) * rcS * 0.5, c2 = acc[60 + 10 + 120] + (Math.PI / 2) * rcS * 0.5;
    // irregular knife pleats (~8.5 cm), each with its own width, depth and sideways drift
    let seed = 23; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const edges = [0]; while (edges[edges.length - 1] < tot + 0.2) edges.push(edges[edges.length - 1] + 0.085 * (0.7 + 0.6 * rnd()));
    const amp = edges.map(() => 0.45 + 1.1 * rnd()), drift = edges.map(() => (rnd() - 0.5) * 0.036);
    const sharp = edges.map(() => 0.8 + 0.1 * rnd());
    // some pleats fall open towards the hem, some stay closed (pressed knife pleats are never
    // all alike once the skirt hangs)
    const open = edges.map(() => (rnd() < 0.3 ? 0.45 : 1) * (0.8 + 0.4 * rnd()));
    const pleat = (t, v) => {
      // the crease positions drift sideways towards the hem
      let k = 0; while (k < edges.length - 2 && edges[k + 1] + drift[k + 1] * v < t) k++;
      const e0 = edges[k] + drift[k] * v, e1 = edges[k + 1] + drift[k + 1] * v;
      const fr = Math.min(1, Math.max(0, (t - e0) / (e1 - e0)));
      const a = sharp[k] - 0.12 * v * open[k];  // the fold opens towards the hem
      // knife pleat: a flat panel from the inner fold out to the outer fold, then the narrow
      // return under the fold; the folds slightly rounded
      const tri = fr < a ? fr / a : (1 - fr) / (1 - a);
      const cs = fr < a ? 0.5 - 0.5 * Math.cos((Math.PI * fr) / a) : 0.5 + 0.5 * Math.cos((Math.PI * (fr - a)) / (1 - a));
      const pr = 0.72 * tri + 0.28 * cs;
      return { pr, A: amp[k] * (0.55 + 0.45 * (1 - v) + v * 0.45 * open[k]) };
    };
    const yTopS = yT - 0.044, yHem = yT - 0.75;
    const nC = Math.round(tot / 0.0055), nR = 40;
    const rows = [];
    for (let j = 0; j <= nR; j++) {
      const v = j / nR, row = [];
      for (let i = 0; i <= nC; i++) {
        const t = (i / nC) * tot, a = at(t);
        const pl = pleat(t, v);
        const corner = Math.min(Math.abs(t - c1), Math.abs(t - c2));
        const cw = 0.55 + 0.45 * sst(0.0, 0.07, corner);
        const A = (0.0035 + 0.0175 * Math.pow(v, 0.85)) * pl.A * cw;
        // + a slow sway of the whole skirt (25-40 cm waves, growing towards the hem): the light
        // runs over it through the pleats, so it hangs as cloth and not as a pressed sheet
        const d = 0.004 + A * pl.pr + 0.016 * Math.pow(v, 1.6) + 0.0095 * Math.pow(v, 1.25) * CK.noise1(t * 2.7 + 0.4, 31) + 0.0035 * v * CK.noise1(t * 6.1, 37);
        // the hem: crowns hang a little lower, slow wave
        const yv = yTopS - (yTopS - yHem) * v - (v > 0.97 ? (0.004 * pl.pr * pl.A + 0.003 * CK.noise1(t * 3.1, 41)) * ((v - 0.97) / 0.03) : 0);
        row.push(V3(a.x + a.nx * d, yv, a.z + a.nz * d));
      }
      rows.push(row);
    }
    bins.add(skM, K.gridGeometry(rows));
    // hem: a folded hem with a little thickness and a stitch line 2 cm up
    bins.add(skM, K.sweep(rows[nR].map((q) => q.clone().add(V3(0, 0.0025, 0))), 0.0028, 5));
    const jS = Math.round(nR * (1 - 0.02 / (yTopS - yHem)));
    bins.add(skT, K.sweep(rows[jS].map((q, i) => { const a = at((i / nC) * tot); return q.clone().add(V3(a.nx * 0.0012, 0, a.nz * 0.0012)); }), 0.0008, 4));
    // velcro band along the board edge, the pleats pressed under it, two stitch rows
    const bRows = [];
    for (let j = 0; j <= 2; j++) {
      const y = yT + 0.001 - (0.046 * j) / 2, row = [];
      for (let i = 0; i <= 200; i++) { const a = at((i / 200) * tot); row.push(V3(a.x + a.nx * 0.0105, y, a.z + a.nz * 0.0105)); }
      bRows.push(row);
    }
    bins.add(skM, K.gridGeometry(bRows));
    bins.add(skM, K.sweep(bRows[2].map((q) => q.clone()), 0.0022, 5));
    bins.add(skM, K.sweep(bRows[0].map((q) => q.clone()), 0.0018, 5));
    for (const yy of [0.006, 0.04]) bins.add(skT, K.sweep(bRows[0].map((q, i) => { const a = at((i / 200) * tot); return V3(q.x + a.nx * 0.0011, yT + 0.001 - yy, q.z + a.nz * 0.0011); }), 0.0008, 4));
  }

  bins.build(group);

  // ---- light -------------------------------------------------------------------------------
  const rig0 = K.tentRig(hex, { print: !!print });
  const white = K.lumOf(hex) > 0.7 && !print;
  const stallRig = {
    ...rig0, key: { ...rig0.key, azimuth: kapOnly ? -60 : -84 },
    ...(white ? { exposure: kapOnly ? 0.6 : (p.skirt ? 0.58 : 0.55), fill: { ...rig0.fill, intensity: kapOnly ? 2.6 : 2.2 } } : {}),
    ...(p.skirt && !kapOnly ? { key: { ...rig0.key, azimuth: -84, aimRel: [0.05, -0.12, 0.69], angle: 64 } } : {}),
  };
  return {
    object: group,
    detail: { target: [hw - 0.05, yN - 0.1, hd + 0.1], size: 0.75, azimuth: 30, elevation: 16 },
    // the loose cover is seen from the front left, so it never repeats the complete stall's hero
    view: { hero: kapOnly ? { azimuth: -34, elevation: 20 } : { elevation: 17 } },
    rig: { default: stallRig },
    meta: { W, D, frame: galv ? 'verzinkt' : frameName },
  };
}
