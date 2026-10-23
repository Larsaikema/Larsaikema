// Buizenframe partytent (PE / PVC party tent with a galvanised steel tube frame), opslagtent
// variant, and the loose roof cover. Rebuilt round 2: the frame is the product's selling point,
// so it is modelled as a real kit and shown:
//  - galvanised 38 mm steel tubes (PE Basis 32 mm) pushed into welded connectors: legs every
//    2 m on both long sides, eave tubes, a rafter pair per leg pair up to the ridge, gable poles,
//    knee braces in both planes at every leg top, foot plates with peg holes and a peg;
//    connectors are welded nodes of short sleeves (one per tube direction) round a knuckle, each
//    sleeve with a knurled T-handle thumb screw (knevelbout). Premium / Professional lines add a
//    ground frame (tubes at floor level between the feet, 3-way ground connectors) and a ridge
//    reinforcement (a collar tie per truss and a second tube under the ridge);
//  - one roof cover with closed gable triangles: it lies on the rafters and sags between them (PE
//    more than PVC), welded panel seams over every rafter, a taped ridge seam, it rolls over the
//    eave tubes into a short valance flap tied to the eave tube with ball bungees;
//  - side walls per 2 m bay hung from the eave tube (hooks under the valance), hem resting on the
//    floor with a soft kick, a slot with a velcro join at every leg; PE with two church windows,
//    PVC with one wide window with two bars; a zipped door in the front long side (`door: 'open'`
//    rolls it up). In the hero the gable nearest the camera is rolled up under the eave
//    (`openGable`, default on with walls), so the frame inside reads: rafters, ridge, connectors,
//    knee braces, ground frame;
//  - `series`: 'basis' (PE 200 g/m2), '500', '550-premium' (ground frame + ridge reinforcement),
//    '550-compleet' (premium + storm straps over the roof to stakes with ratchets), '620'
//    (premium frame, 2.2 m side height);
//  - `stripes: 'wit'`: two-tone cloth (Grijs-wit, Rood-wit, ...): 50 cm lanes of `color` and
//    `stripes` over roof, valance, gables and walls, lined up from wall to roof;
//  - `frame: false` (the loose roof cover): shown on the bare frame without walls, so it reads as
//    the cloth it is (frame not included);
//  - `gableDoor: 'left' | 'right'` (the eindwand product): that gable is closed by one end wall
//    over the full width (the cover's gable triangle closes it up to the ridge) with a doorway in
//    the middle between two zips with welded reinforcement bands; `door: 'open'` rolls the door
//    panel up under the eave with two roll-up straps; eyelets in the bottom hem. The camera looks
//    at that gable from 70 degrees (hero and front), the long side receding.
//
//   { w (span), d (length), line: 'pe'|'pvc', series, color, stripes, walls: 'windows'|'closed'|'none',
//     door: 'closed'|'open'|'rolled', variant: 'party'|'opslag', frame: bool, openGable: bool, gableDoor }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';
import * as CK from '../js/clothKit.js';

const { V3 } = K;

// welded connector node: a knuckle with a sleeve per tube direction, a thumb screw on each
function connector(bins, steel, at, dirs, { rs = 0.0235, len = 0.11, screws = true, knob = null } = {}) {
  const kn = new THREE.SphereGeometry(rs * 1.18, 16, 10); kn.translate(at.x, at.y, at.z); bins.add(steel, kn);
  for (const d0 of dirs) {
    const d = d0.clone().normalize();
    const a = at.clone().addScaledVector(d, rs * 0.4), b = at.clone().addScaledVector(d, len);
    bins.add(steel, G.tube(a, b, rs, 18, { caps: true }));
    // weld bead at the knuckle
    const ring = new THREE.TorusGeometry(rs * 1.02, 0.0028, 6, 18);
    ring.lookAt(d); ring.translate(...a.clone().addScaledVector(d, 0.004).toArray()); bins.add(steel, ring);
    if (screws) {
      // thumb screw on the sleeve, on its upper / outer side
      let side = V3(0, 1, 0).addScaledVector(d, -d.y); if (side.lengthSq() < 0.01) side = V3(1, 0, 0).addScaledVector(d, -d.x);
      side.normalize();
      const p = at.clone().addScaledVector(d, len * 0.68);
      const s0 = p.clone().addScaledVector(side, rs), s1 = p.clone().addScaledVector(side, rs + 0.022);
      bins.add(knob || steel, G.tube(s0, s1, 0.0042, 8, { caps: true }));
      const T = V3().crossVectors(d, side).normalize();
      bins.add(knob || steel, G.tube(s1.clone().addScaledVector(T, -0.016), s1.clone().addScaledVector(T, 0.016), 0.0035, 8, { caps: true }));
    }
  }
}

export function buildFrameTent(o) {
  const {
    span: W, length: L, eave: He, ridge: Hr, line = 'pvc', color = 'wit', walls = 'none', door = 'closed',
    gableFront = false, frame = true, bay: bayWanted = 2, frontGableDoor = false, ties = false, valance = 0.2,
    groundFrame = false, collar = false, straps = false, openGable = null, openFront = false,
    stripes = null, stripeW = 0.5, gableDoor = null,
  } = o;
  const hex = K.col(color, M.COLORS.wit);
  const pe = line === 'pe';
  const fab = pe ? K.peFabric(hex) : K.pvc(hex);
  // two-tone cloth ('Grijs-wit' = grey and white lanes): every cloth surface (roof, valance,
  // gable triangles, walls) alternates `color` / `stripes` in lanes of stripeW running from the
  // hem up over the ridge, so the lanes line up from wall to roof; the welded seams of the
  // cover sit on lane joins
  const stripeHex = stripes ? K.col(stripes, M.COLORS.wit) : null;
  const fab2 = stripeHex ? (pe ? K.peFabric(stripeHex) : K.pvc(stripeHex)) : null;
  const addCloth = (geo, axis) => {
    if (!fab2) { bins.add(fab, geo); return; }
    const P = geo.attributes.position, idx = geo.index.array, A = [], B = [];
    const span = axis === 'x' ? L : W, off = span / 2;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], cc = idx[t + 2];
      const v = axis === 'x' ? (P.getX(a) + P.getX(b) + P.getX(cc)) / 3 : (P.getZ(a) + P.getZ(b) + P.getZ(cc)) / 3;
      const k = Math.floor(Math.min(span - 1e-4, Math.max(0, v + off)) / stripeW);
      ((k & 1) ? B : A).push(a, b, cc);
    }
    if (A.length) { const g = geo.clone(); g.setIndex(A); bins.add(fab, g); }
    if (B.length) { const g = geo.clone(); g.setIndex(B); bins.add(fab2, g); }
  };
  // lane joins (+ extra samples) inserted into a uniform sampling of [a, b] along x or z
  const withJoins = (a, b, n, span) => {
    const out = []; for (let i = 0; i <= n; i++) out.push(a + ((b - a) * i) / n);
    if (fab2) for (let s = 0; s <= span + 1e-6; s += stripeW) { const v = s - span / 2; if (v > a + 1e-4 && v < b - 1e-4) out.push(v - 0.0015, v + 0.0015); }
    return out.sort((p, q) => p - q).filter((v, i, arr) => i === 0 || v - arr[i - 1] > 1e-4);
  };
  const seamM = pe ? K.peFabric(hex) : K.pvcPatch(hex);
  const thread = M.tentThread(hex);
  const steel = M.galvanised();
  const knobM = M.mouldedNylon('#161616');
  const clear = M.pvcWindow();
  const tapeMat = pe ? K.peFabric(hex) : K.pvcPatch(hex);
  const zipM = M.zipTooth('#1A1A1B');
  const strapM = M.webbing('#1A1A1B');
  const bungeeM = M.mouldedNylon('#202022');
  const eyeM = M.galvanised();
  const holeM = M.mouldedNylon('#0E0E0F');
  const bins = new G.PartBin();
  const inner = new THREE.Group();
  const r = pe ? 0.016 : 0.019, c = 0.012;
  const nb = Math.max(1, Math.round(L / bayWanted)), bay = L / nb;
  const xs = []; for (let i = 0; i <= nb; i++) xs.push(-L / 2 + i * bay);
  const hw = W / 2, rise = Hr - He;
  const roofY = (z) => He + r + c + rise * (1 - Math.abs(z) / hw); // cloth on the rafters
  const pitch = Math.atan2(rise, hw);

  // ---- frame ---------------------------------------------------------------------------------
  if (frame) {
    const T = (a, b, rr = r) => bins.add(steel, G.tube(a, b, rr, 16));
    for (const x of xs) {
      for (const sz of [-1, 1]) {
        const top = V3(x, He, sz * hw);
        T(V3(x, groundFrame ? 0.07 : 0.012, sz * hw), top.clone().add(V3(0, -0.02, 0)));
        // foot plate with peg holes and a peg
        bins.add(steel, K.footPlate(x, sz * hw, 0.12, 0.006));
        if (!groundFrame) bins.add(steel, G.tube(V3(x, 0.006, sz * hw), V3(x, 0.07, sz * hw), r * 1.25, 16));
        bins.add(steel, K.stakeGeo(V3(x + 0.04, 0, sz * (hw + 0.04)), V3(0, 0, -sz), { len: 0.025, r: 0.005 }));
        // rafter to the ridge
        const rt = V3(x, Hr, 0);
        const rd = rt.clone().sub(top).normalize();
        T(top.clone().addScaledVector(rd, 0.05), rt.clone().addScaledVector(rd, -0.05));
        // knee braces: leg -> rafter and leg -> eave tube (both directions along the eave)
        const legD = 0.5;
        T(V3(x, He - legD, sz * hw), top.clone().addScaledVector(rd, 0.62), r * 0.72);
        for (const sx of [-1, 1]) {
          if ((x === xs[0] && sx < 0) || (x === xs[nb] && sx > 0)) continue;
          T(V3(x, He - legD * 0.85, sz * (hw - 0.0)), V3(x + sx * 0.5, He, sz * hw), r * 0.72);
        }
        // eave node: down (leg), along the eave (one or two ways), up the rafter
        const dirs = [V3(0, -1, 0), rd];
        if (x > xs[0] + 1e-6) dirs.push(V3(-1, 0, 0));
        if (x < xs[nb] - 1e-6) dirs.push(V3(1, 0, 0));
        connector(bins, steel, top, dirs, { knob: knobM });
        if (groundFrame) {
          const g = V3(x, 0.07, sz * hw);
          const gd = [V3(0, 1, 0)];
          if (x > xs[0] + 1e-6) gd.push(V3(-1, 0, 0));
          if (x < xs[nb] - 1e-6) gd.push(V3(1, 0, 0));
          if (x === xs[0] || x === xs[nb]) gd.push(V3(0, 0, -sz));
          connector(bins, steel, g, gd, { len: 0.09, knob: knobM });
        }
      }
      // ridge node: both rafters + ridge tubes
      const rt = V3(x, Hr, 0);
      const rdA = V3(0, -rise, hw).normalize(), rdB = V3(0, -rise, -hw).normalize();
      const rdirs = [rdA, rdB];
      if (x > xs[0] + 1e-6) rdirs.push(V3(-1, 0, 0));
      if (x < xs[nb] - 1e-6) rdirs.push(V3(1, 0, 0));
      connector(bins, steel, rt, rdirs, { knob: knobM });
      // ridge reinforcement: a collar tie per truss
      if (collar) {
        const f = 0.5, yC = He + rise * f, zC = hw * (1 - f);
        T(V3(x, yC, -zC), V3(x, yC, zC), r * 0.85);
        for (const sz of [-1, 1]) { const cn = new THREE.SphereGeometry(r * 1.5, 12, 8); cn.translate(x, yC, sz * zC); bins.add(steel, cn); }
      }
      if (ties) T(V3(x, He - 0.03, -hw), V3(x, He - 0.03, hw), r * 0.9);
    }
    // eave and ridge tubes (between the connector sleeves)
    for (let i = 0; i < nb; i++) {
      for (const sz of [-1, 1]) T(V3(xs[i] + 0.06, He, sz * hw), V3(xs[i + 1] - 0.06, He, sz * hw));
      T(V3(xs[i] + 0.06, Hr, 0), V3(xs[i + 1] - 0.06, Hr, 0));
      if (collar) T(V3(xs[i] + 0.04, Hr - 0.11, 0), V3(xs[i + 1] - 0.04, Hr - 0.11, 0), r * 0.85);
      if (groundFrame) for (const sz of [-1, 1]) T(V3(xs[i] + 0.05, 0.07, sz * hw), V3(xs[i + 1] - 0.05, 0.07, sz * hw));
    }
    if (collar) for (const x of xs) T(V3(x, Hr - 0.11, 0), V3(x, Hr - 0.02, 0), r * 0.8);
    // gable poles (not in a door gable)
    for (const sx of [-1, 1]) {
      if (frontGableDoor && sx < 0) { T(V3(sx * L / 2, He - 0.02, -hw + 0.06), V3(sx * L / 2, He - 0.02, hw - 0.06), r * 0.95); continue; }
      if (W >= 3.9) {
        T(V3(sx * L / 2, groundFrame ? 0.07 : 0.012, 0), V3(sx * L / 2, Hr - 0.06, 0));
        bins.add(steel, K.footPlate(sx * L / 2, 0, 0.12, 0.006));
        if (groundFrame) {
          for (const sz of [-1, 1]) T(V3(sx * L / 2, 0.07, sz * 0.05), V3(sx * L / 2, 0.07, sz * (hw - 0.05)));
          connector(bins, steel, V3(sx * L / 2, 0.07, 0), [V3(0, 1, 0), V3(0, 0, 1), V3(0, 0, -1)], { len: 0.09, knob: knobM });
        }
      } else if (groundFrame) T(V3(sx * L / 2, 0.07, -hw + 0.05), V3(sx * L / 2, 0.07, hw - 0.05));
    }
  }

  // ---- roof cover ------------------------------------------------------------------------------
  // Round 6 ("hard slabs, no tension"): the cover is a tensioned membrane, not a plate.
  //  - every 2 m bay sags between its rafters, eave tube and ridge tube (first membrane mode,
  //    PVC ~4.5 cm, PE ~6.5 cm, each bay a little different), so every bay reads as its own
  //    panel with a soft trough and the rafters as crisp lines;
  //  - tension wrinkles fan out of the eave corners over every leg (where the straps pull the
  //    cover down) and, weaker, out of the ridge nodes: ridges along the pull, 15-22 cm apart,
  //    dying out within ~60 cm, zero on the supported edges;
  //  - the valance hangs from ball bungees every 50 cm: a pressed eyelet with the black ball at
  //    every bungee on a doubled hem band, the hem pulled in and up at each eyelet, a soft belly
  //    between them with pinch folds converging on the eyelet;
  //  - the gable triangles hang from the gable rafters with wrinkles fanning from the apex and
  //    the eave corners.
  const sagA = pe ? 0.095 : 0.075;
  const xe = L / 2 + r + c + 0.004; // gable cloth plane
  const Sl = Math.hypot(hw, rise); // slope length eave -> ridge
  const bayK = []; for (let i = 0; i < nb; i++) bayK.push(0.82 + 0.36 * CK.hash(i * 3.1 + (pe ? 7 : 1)));
  const bayOf = (x) => Math.min(nb - 1, Math.max(0, Math.floor((x + L / 2) / bay)));
  const sag = (x, z) => {
    const fx = ((x + L / 2) / bay) % 1, fu = 1 - Math.abs(z) / hw;
    const inBay = Math.abs(x) < L / 2 ? Math.sin(Math.PI * Math.min(1, Math.max(0, fx))) : 0;
    return sagA * bayK[bayOf(x)] * Math.pow(inBay, 0.8) * Math.sin(Math.PI * Math.min(1, Math.max(0, fu)));
  };
  // wrinkle fans per slope in (a = x, b = metres up the slope from the eave)
  const fans = [];
  const wA = pe ? 0.016 : 0.012, wLam = pe ? 0.17 : 0.22;
  xs.forEach((x, i) => {
    for (const sd of [-1, 1]) {
      if ((i === 0 && sd < 0) || (i === nb && sd > 0)) continue;
      const ph = CK.hash(i * 5.3 + sd) * 6.28;
      fans.push({ a: x, b: 0, da: sd * bay * 0.42, db: Sl * 0.58, A: wA, lam: wLam, reach: 0.8, spread: 0.6, phase: ph });
      fans.push({ a: x, b: Sl, da: sd * bay * 0.5, db: -Sl * 0.5, A: wA * 0.55, lam: wLam * 0.9, reach: 0.42, spread: 0.5, phase: ph + 1.3 });
    }
  });
  const wrinkle = CK.fanWrinkles(fans);
  const roofW = (x, z) => {
    if (Math.abs(x) >= L / 2) return 0;
    const fx = ((x + L / 2) / bay) % 1, b = (1 - Math.abs(z) / hw) * Sl;
    const win = Math.pow(Math.sin(Math.PI * fx), 0.6) * CK.sst(0, 0.06, b) * CK.sst(0, 0.05, Sl - b);
    return wrinkle(x, b) * win;
  };
  // a point of the cloth on a slope (sz = +-1): on the rafters, minus the sag, plus the wrinkles
  // along the slope normal
  const nSl = (sz) => V3(0, Math.cos(pitch), sz * Math.sin(pitch));
  const roofPt = (x, z, sz) => V3(x, roofY(z) - sag(x, z), z).addScaledVector(nSl(sz), roofW(x, z));
  // valance on ball bungees every 50 cm
  const bung0 = -L / 2 + 0.25, bungP = 0.5;
  const valOut = (x, f) => {
    const fe = CK.festoon(x, bung0, bungP);
    const bel = CK.sst(0, 1, fe.d);
    const lo = Math.pow(1 - f, 1.3);
    return 0.006 + lo * (0.003 + 0.013 * bel + 0.0028 * (1 - fe.d) * Math.cos(fe.ph * Math.PI * 2 * 3)) + 0.003 * Math.sin(x * 4.1) * (1 - f);
  };
  const valY = (x, f) => {
    const fe = CK.festoon(x, bung0, bungP);
    const lift = 0.009 * Math.pow(1 - fe.d, 2);
    return He - valance + lift + (valance - lift) * f;
  };
  const NZ = 60, NB = 8, NV = 12;
  const xCols = withJoins(-xe, xe, Math.max(120, nb * 60), L), NX = xCols.length - 1;
  const slopes = [];
  const cv = c + 0.004; // valance clearance outside the eave tube (walls hang inside it)
  for (const sz of [-1, 1]) {
    const rows = [];
    for (let j = 0; j <= NV + NB + NZ; j++) {
      const row = [];
      for (let i = 0; i <= NX; i++) {
        const x = xCols[i];
        let q;
        if (j <= NV) {
          const f = j / NV;
          q = V3(x, valY(x, f), sz * (hw + r + cv + valOut(x, f) * (1 - f * 0.999)));
        } else if (j <= NV + NB) {
          const b = ((j - NV) / NB) * (Math.PI / 2 - pitch);
          q = V3(x, He + (r + cv) * Math.sin(b), sz * (hw + (r + cv) * Math.cos(b)));
        } else {
          const f = (j - NV - NB) / NZ;
          const z = sz * hw * (1 - f);
          q = roofPt(x, z, sz);
          if (f < 0.04) q.y += (r + cv - (r + c)) * (1 - f / 0.04) * 0.0; // (continuity with the bend)
        }
        row.push(q);
      }
      rows.push(row);
    }
    if (sz < 0) for (const row of rows) row.reverse();
    addCloth(K.gridGeometry(rows), 'x');
    slopes.push(rows);
    // doubled hem band (4 cm) with the stitch line, the eyelets with their ball bungees
    const hemTop = 0.045 / valance;
    const band = [];
    for (let jj = 0; jj <= 3; jj++) {
      const f = (hemTop * jj) / 3, row = [];
      for (let i = 0; i <= NX; i++) { const x = xCols[i]; row.push(V3(x, valY(x, f), sz * (hw + r + cv + valOut(x, f) + 0.0013))); }
      band.push(row);
    }
    if (sz < 0) for (const row of band) row.reverse();
    addCloth(K.gridGeometry(band), 'x');
    addCloth(K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.003, 0))), 0.0045, 5), 'x');
    bins.add(thread, K.sweep(xCols.map((x) => V3(x, valY(x, hemTop) - 0.003, sz * (hw + r + cv + valOut(x, hemTop) + 0.0024))), 0.0011, 4));
    bins.add(thread, K.sweep(xCols.map((x) => V3(x, valY(x, 0.02 / valance), sz * (hw + r + cv + valOut(x, 0.02 / valance) + 0.0024))), 0.0011, 4));
    for (let x = bung0; x < L / 2; x += bungP) {
      const f = 0.026 / valance;
      const at = V3(x, valY(x, f), sz * (hw + r + cv + valOut(x, f) + 0.0016));
      const n = V3(0, 0, sz);
      bins.add(eyeM, CK.grommet(at, n, { R: 0.0115, r: 0.0062 }));
      bins.add(holeM, CK.grommetHole(at, n));
      if (frame) {
        const ball = new THREE.SphereGeometry(0.0105, 12, 9); ball.translate(x, at.y - 0.002, at.z + sz * 0.011); bins.add(bungeeM, ball);
        const cord = [at.clone().addScaledVector(n, 0.002), at.clone().addScaledVector(n, 0.009).add(V3(0, -0.001, 0))];
        bins.add(bungeeM, K.sweep(cord, 0.0028, 5));
      }
    }
  }
  // welded panel seams on top of every rafter (and the gable rafters), the taped ridge seam
  for (const x of xs) {
    for (const sz of [-1, 1]) {
      const pts = [], nrm = [];
      for (let t = 0; t <= 24; t++) { const z = sz * hw * (1 - t / 24); pts.push(V3(x, roofY(z) - sag(x, z) + 0.0012, z)); nrm.push(V3(0, Math.cos(pitch), sz * Math.sin(pitch))); }
      bins.add(seamM, T2.bandAlong(pts, nrm, 0.04, 0.0012));
    }
  }
  const ridge = []; for (let i = 0; i <= 60; i++) ridge.push(V3(-xe + (2 * xe * i) / 60, Hr + r + c + 0.002, 0));
  bins.add(tapeMat, K.sweep(ridge, 0.012, 8, { rFn: (ii, a) => (Math.sin(a) > 0 ? 0.012 : 0.004) }));
  // corner reinforcement patches (welded triangles over the four roof corners)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const rows = [];
    for (let j = 0; j <= 6; j++) {
      const row = [];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6, v = j / 6 * (1 - u);
        const x = sx * (L / 2 - 0.34 * u), z = sz * (hw - 0.36 * v);
        row.push(roofPt(x, z, sz).addScaledVector(nSl(sz), 0.0011));
      }
      rows.push(row);
    }
    // keep the patch normal facing out of the slope (the grid winding follows the corner)
    const gp = K.gridGeometry(rows), nn = gp.attributes.normal;
    if (nn.getY(0) < 0) { const ix = gp.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } gp.computeVertexNormals(); }
    bins.add(seamM, gp);
  }
  // gable triangles (part of the cover), with the bottom flap continuing the valance line
  const gPole = W >= 3.9;
  for (const sx of [-1, 1]) {
    const rows = [];
    const zCols = withJoins(-hw - r - cv, hw + r + cv, 72, W), NG = zCols.length - 1, NH = 44;
    const gf = [];
    for (const sz of [-1, 1]) {
      gf.push({ a: 0, b: Hr, da: sz * 0.62, db: -1, A: pe ? 0.007 : 0.0052, lam: 0.17, reach: 0.5, spread: 0.45, phase: 1.1 + sz + sx });
      gf.push({ a: sz * hw, b: He, da: -sz * 0.8, db: 0.55, A: pe ? 0.007 : 0.005, lam: 0.18, reach: 0.45, spread: 0.5, phase: 2.3 + sz * sx });
    }
    const gw = CK.fanWrinkles(gf);
    // the triangle bellies out between its supports (gable rafters on top, the gable pole in the
    // middle when there is one, the corner legs): two soft pillows either side of the pole, so a
    // gable seen head-on gets a gradient across each half instead of one flat value
    const gA = pe ? 0.04 : 0.03;
    const gP = (z, f) => {
      const zc = Math.max(-hw, Math.min(hw, z));
      const yTop = Math.max(roofY(zc), He + r + c);
      const y0 = He - valance;
      const y = y0 + (yTop - y0) * f;
      const below = yTop - y;
      const win = CK.sst(0, 0.07, below) * (gPole ? CK.sst(0.02, 0.12, Math.abs(z)) : 1) * CK.sst(0, 0.05, hw + r - Math.abs(z));
      const fz = gPole ? Math.min(1, Math.abs(z) / hw) : Math.min(1, Math.max(0, (z + hw) / (2 * hw)));
      const bulge = gA * Math.sin(Math.PI * fz) * Math.pow(Math.sin(Math.PI * Math.min(1, f * 1.15)), 0.8) * (1 + 0.15 * Math.sin(z * 2.3 + sx));
      return V3(sx * (xe + bulge + gw(z, y) * win), y, z);
    };
    for (let j = 0; j <= NH; j++) {
      const f = j / NH, row = [];
      for (let i = 0; i <= NG; i++) row.push(gP(zCols[i], f));
      rows.push(row);
    }
    // welded seams of the gable panels (vertical, 1 m apart)
    for (const zs of (gPole ? [-hw / 2, hw / 2] : [-hw / 3, hw / 3])) {
      const pts = [], nrm = [];
      for (let t = 0; t <= 30; t++) { const q = gP(zs, (t / 30) * 0.985); pts.push(q.clone().add(V3(sx * 0.0011, 0, 0))); nrm.push(V3(sx, 0, 0)); }
      bins.add(seamM, T2.bandAlong(pts, nrm, 0.035, 0.0011));
    }
    if (sx > 0) for (const row of rows) row.reverse();
    addCloth(K.gridGeometry(rows), 'z');
    addCloth(K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.003, 0))), 0.0045, 5), 'z');
    // hem band of the gable flap
    const band = [];
    for (let jj = 0; jj <= 2; jj++) { const row = []; for (const z of zCols) row.push(V3(sx * (xe + 0.0013), He - valance + (0.045 * jj) / 2, z)); band.push(row); }
    if (sx > 0) for (const row of band) row.reverse();
    addCloth(K.gridGeometry(band), 'z');
    bins.add(thread, K.sweep(zCols.map((z) => V3(sx * (xe + 0.0024), He - valance + 0.042, z)), 0.0011, 4));
    for (let z = -hw + 0.25; z < hw; z += 0.5) {
      const at = V3(sx * (xe + 0.0016), He - valance + 0.026, z), n = V3(sx, 0, 0);
      bins.add(eyeM, CK.grommet(at, n, { R: 0.0115, r: 0.0062 }));
      bins.add(holeM, CK.grommetHole(at, n));
    }
  }

  // ---- storm straps (550 compleet) ----------------------------------------------------------------
  if (straps && frame) {
    const strapC = M.webbing('#2B2D30');
    const ratchetM = M.galvanised();
    for (let i = 0; i < nb; i++) {
      const x = (xs[i] + xs[i + 1]) / 2;
      const pts = [], nrm = [];
      const out = 1.1;
      // front stake -> eave edge -> up the roof -> ridge -> down the back -> back stake
      const zs = [];
      for (let t = 0; t <= 10; t++) { const f = t / 10; pts.push(V3(x, (He + r + c + 0.01) * f, hw + out * (1 - f) + (r + c + 0.01) * f)); }
      // the strap lies on the cloth (round 6: it pressed nothing and floated over the sagging bay)
      for (let t = 1; t <= 24; t++) { const z = hw * (1 - t / 24); pts.push(roofPt(x, z, 1).addScaledVector(nSl(1), 0.005)); }
      for (let t = 1; t <= 24; t++) { const z = -hw * (t / 24); pts.push(roofPt(x, z, -1).addScaledVector(nSl(-1), 0.005)); }
      for (let t = 1; t <= 10; t++) { const f = t / 10; pts.push(V3(x, (He + r + c + 0.01) * (1 - f), -hw - (r + c + 0.01) - (out - r - c) * f)); }
      for (let k = 0; k < pts.length; k++) {
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
        const tdir = b.clone().sub(a).normalize();
        nrm.push(V3().crossVectors(V3(1, 0, 0), tdir).normalize().negate().multiplyScalar(-1));
      }
      bins.add(strapC, T2.bandAlong(pts, nrm, 0.035, 0.002));
      // ratchet on the front leg of the strap, stakes at both ends
      const rp = V3(x, 0.55, hw + out * (1 - 0.55 / (He + r + c)));
      const rg = G.roundedBox(0.06, 0.13, 0.035, 0.008); rg.rotateX(-Math.atan2(out, He)); rg.translate(rp.x, rp.y, rp.z + 0.01); bins.add(ratchetM, rg);
      for (const sz of [-1, 1]) bins.add(steel, K.stakeGeo(V3(x, 0, sz * (hw + out)), V3(0, 0, -sz), { len: 0.1, r: 0.008 }));
    }
  }

  // ---- walls -----------------------------------------------------------------------------------
  const wallType = walls === true ? 'closed' : walls;
  const panels = [];
  if (wallType && wallType !== 'none' && frame) {
    const doorBay = Math.min(nb - 1, Math.floor(nb / 2));
    for (let i = 0; i < nb; i++) {
      for (const sz of [-1, 1]) {
        const isDoor = !frontGableDoor && !gableDoor && sz > 0 && i === doorBay;
        if (!frontGableDoor && sz > 0 && openFront && nb >= 3 && i === doorBay - 1) {
          panels.push({ a: V3(xs[i], 0, hw + r + 0.012), b: V3(xs[i + 1], 0, hw + r + 0.012), out: V3(0, 0, 1), type: 'rolledwall', seed: i * 2 + 1 });
          continue;
        }
        // panels run outside the legs; +z panels left -> right as seen from the front
        const a = V3(sz > 0 ? xs[i] : xs[i + 1], 0, sz * (hw + r + 0.012)), b = V3(sz > 0 ? xs[i + 1] : xs[i], 0, sz * (hw + r + 0.012));
        panels.push({ a, b, out: V3(0, 0, sz), type: isDoor ? 'door' : wallType, seed: i * 2 + (sz > 0 ? 1 : 0) });
      }
    }
    for (const sx of [-1, 1]) {
      const gx = sx * (L / 2 + r + 0.012);
      const rolled = openGable === (sx > 0 ? 'right' : 'left');
      if (frontGableDoor && sx < 0) { panels.push({ a: V3(gx, 0, hw), b: V3(gx, 0, -hw), out: V3(sx, 0, 0), type: 'gabledoor', seed: 20 }); continue; }
      // eindwand: one wall over the full width of the gable (the cover's gable triangle closes it
      // up to the ridge) with a doorway in the middle between two vertical zips
      if (gableDoor === (sx > 0 ? 'right' : 'left')) { panels.push({ a: V3(gx, 0, sx > 0 ? hw : -hw), b: V3(gx, 0, sx > 0 ? -hw : hw), out: V3(sx, 0, 0), type: 'enddoor', seed: 40 + sx }); continue; }
      const halves = W >= 3.9 ? [[hw, 0], [0, -hw]] : [[hw, -hw]];
      for (const [z0, z1] of halves) {
        const a = V3(gx, 0, sx > 0 ? z0 : -z0), b = V3(gx, 0, sx > 0 ? z1 : -z1);
        panels.push({ a, b, out: V3(sx, 0, 0), type: rolled ? 'rolledwall' : wallType, seed: 30 + z0 + sx });
      }
    }
  }
  const wallTop = He - 0.04;
  for (const pn of panels) buildPanel(pn);
  function buildPanel({ a, b, out, type, seed = 0 }) {
    const len = a.distanceTo(b);
    const along = b.clone().sub(a).normalize();
    // samples along the panel between s0 < s1, with a vertex pair at every lane join of two-tone
    // cloth, so the rolled-up panels show clean bands (no saw teeth where a lane changes colour)
    const laneX = Math.abs(out.z) > 0.5;
    const sCols = (s0, s1, n) => {
      const o = []; for (let i = 0; i <= n; i++) o.push(s0 + ((s1 - s0) * i) / n);
      const c0 = laneX ? a.x : a.z, dc = laneX ? along.x : along.z, span = laneX ? L : W;
      if (fab2 && Math.abs(dc) > 1e-6) for (let k = 0; k * stripeW <= span + 1e-6; k++) {
        const sj = (k * stripeW - span / 2 - c0) / dc;
        if (sj > s0 + 0.004 && sj < s1 - 0.004) o.push(sj - 0.0015, sj + 0.0015);
      }
      return o.sort((p, q) => p - q).filter((v, i, arr) => i === 0 || v - arr[i - 1] > 1e-4);
    };
    // a rolled-up panel between s0 and s1 (radius noise in metres along the roll, not per sample)
    const rollAlong = (s0, s1, n, y, rollR) => {
      const ss = sCols(s0, s1, n);
      const rp = ss.map((sv) => P(sv, y).addScaledVector(out, rollR * 0.6));
      return K.sweep(rp, rollR, 18, { rFn: (ii, ang) => rollR * (1 + 0.07 * Math.sin(ang * 3 + ss[ii] * 12) + 0.04 * Math.sin(ss[ii] * 26)), capStart: true, capEnd: true });
    };
    const open = ((type === 'door' || type === 'gabledoor') && (door === 'open' || door === 'rolled')) || type === 'rolledwall';
    const H = open ? 0.0 : wallTop;
    const ph = seed * 1.7;
    // eindwand doorway: the panel between the two zips (d0..d1) rolls up under the eave
    const endDoor = type === 'enddoor';
    const endOpen = endDoor && (door === 'open' || door === 'rolled');
    const dw = Math.min(2.0, Math.max(1.2, len * 0.4)), d0 = len / 2 - dw / 2, d1 = len / 2 + dw / 2;
    // Round 6: the wall hangs from hooks every 50 cm on the eave tube: between two hooks the
    // cloth droops into a soft swag with fan folds converging on the hook (visible for ~40 cm
    // under the valance); broad, irregular vertical drape folds over the whole height (deeper
    // to the hem, PVC folds broad and shallow, PE narrower); a wind belly between the legs; the
    // hem kicks out where it rests on the floor. Under the valance the cloth stays behind it.
    const yVal = He - valance - 0.01;
    const P = (s, y) => {
      const t = s / len, f = Math.min(1, y / wallTop);
      const edge = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02));
      const belly = 0.022 * Math.sin(Math.PI * t) * Math.sin(Math.PI * Math.min(1, 0.12 + f * 0.88));
      const lo = (1 - f);
      const fs = pe ? 1.35 : 1;
      const n1 = CK.noise1(s * 1.6 * fs + ph, 3), n2 = CK.noise1(s * 3.4 * fs + ph * 1.3, 5), n3 = CK.noise1(s * 7.5 * fs + ph * 0.7, 9);
      const folds = (0.024 * n1 + 0.013 * n2 + (pe ? 0.006 : 0.004) * n3) * (0.3 + 0.7 * Math.pow(lo, 1.3)) * edge;
      const fe = CK.festoon(s, 0.25, 0.5), dt = wallTop - y;
      const swag = (0.016 * (CK.sst(0, 1, fe.d) - 0.3) + 0.006 * Math.cos(fe.ph * Math.PI * 4) * (1 - 0.6 * fe.d)) * Math.exp(-Math.max(0, dt - 0.12) / 0.3) * edge;
      const kick = y < 0.05 ? (0.05 - y) * 0.7 : 0;
      let d = belly + folds + swag + kick;
      if (y > yVal) d = Math.min(d, 0.007 * (1 - CK.sst(yVal, wallTop, y)) + 0.001);
      return a.clone().addScaledVector(along, s).addScaledVector(out, d).setY(Math.max(0.003, y));
    };
    const holes = [];
    if (type === 'windows') {
      if (pe) {
        const ww = Math.min(0.55, len * 0.26), wh = 0.86, y0 = 0.9;
        for (const cx of [len * 0.3, len * 0.7]) holes.push({ kind: 'church', cx, w: ww, y0, h: wh });
      } else {
        const ww = Math.min(1.4, len * 0.68), y0 = 0.95, wh = 0.7;
        holes.push({ kind: 'rect', cx: len / 2, w: ww, y0, h: wh, bars: 2 });
      }
    }
    const inside = (s, y) => holes.some((hl) => {
      const dx = s - hl.cx;
      if (Math.abs(dx) > hl.w / 2 || y < hl.y0) return false;
      if (hl.kind === 'rect') return y <= hl.y0 + hl.h;
      const rr = hl.w / 2, ys = hl.y0 + hl.h - rr;
      return y <= ys || dx * dx + (y - ys) * (y - ys) <= rr * rr;
    });
    if (H > 0) {
      const ds = 0.025, nx = Math.max(6, Math.round(len / ds)), ny = Math.max(6, Math.round(H / ds));
      const pos = [], uv = [];
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const s = (len * i) / nx, y = (H * j) / ny; const q = P(s, y); pos.push(q.x, q.y, q.z); uv.push(s, y); }
      const iw = [], iwin = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * (nx + 1) + i, sC = (len * (i + 0.5)) / nx, yC = (H * (j + 0.5)) / ny;
        if (endOpen && sC > d0 && sC < d1) continue;
        (inside(sC, yC) ? iwin : iw).push(k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1);
      }
      const mk = (idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
      const axis = Math.abs(out.z) > 0.5 ? 'x' : 'z';
      addCloth(mk(iw), axis);
      if (iwin.length) bins.add(clear, mk(iwin));
      // folded hem, side hems with the velcro join at the legs, hooks at the top
      if (endOpen) {
        for (const [s0, s1] of [[0, d0], [d1, len]]) addCloth(K.sweep([0, 0.25, 0.5, 0.75, 1].map((f) => P(s0 + (s1 - s0) * f, 0.006).addScaledVector(out, 0.002)), 0.005, 5), axis);
      } else addCloth(K.sweep([0, 0.25, 0.5, 0.75, 1].flatMap((f) => [f]).map((f) => P(len * f, 0.006).addScaledVector(out, 0.002)), 0.005, 5), axis);
      for (const s of [0.012, len - 0.012]) {
        const vp = []; for (let t = 0; t <= 16; t++) vp.push(P(s, 0.02 + ((H - 0.06) * t) / 16).addScaledVector(out, 0.0025));
        bins.add(tapeMat, T2.bandAlong(vp, vp.map(() => out.clone()), 0.028, 0.0016));
      }
      for (let s = 0.25; s < len; s += 0.5) {
        const hk = P(s, H - 0.02).addScaledVector(out, 0.004);
        bins.add(bungeeM, G.tube(hk, hk.clone().add(V3(0, 0.06, 0)).addScaledVector(out, -0.012), 0.0025, 6));
      }
      // window border tape + bars
      for (const hl of holes) {
        const loop = [];
        if (hl.kind === 'rect') {
          const x0 = hl.cx - hl.w / 2, x1 = hl.cx + hl.w / 2, y1 = hl.y0 + hl.h;
          for (const [s0, y0, s1, y1b] of [[x0, hl.y0, x1, hl.y0], [x1, hl.y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, hl.y0]]) for (let t = 0; t < 16; t++) loop.push([s0 + (s1 - s0) * t / 16, y0 + (y1b - y0) * t / 16]);
          for (let bI = 1; bI <= (hl.bars || 0); bI++) { const sb = x0 + (hl.w * bI) / (hl.bars + 1); const bar = []; for (let t = 0; t <= 8; t++) bar.push(P(sb, hl.y0 + (hl.h * t) / 8).addScaledVector(out, 0.003)); bins.add(tapeMat, K.sweep(bar, 0.011, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.004 : 0.016) })); }
        } else {
          const rr = hl.w / 2, ys = hl.y0 + hl.h - rr, x0 = hl.cx - rr, x1 = hl.cx + rr;
          for (let t = 0; t < 10; t++) loop.push([x0 + (x1 - x0) * t / 10, hl.y0]);
          for (let t = 0; t < 10; t++) loop.push([x1, hl.y0 + (ys - hl.y0) * t / 10]);
          for (let t = 0; t < 20; t++) { const an = (Math.PI * t) / 20; loop.push([hl.cx + Math.cos(an) * rr, ys + Math.sin(an) * rr]); }
          for (let t = 0; t < 10; t++) loop.push([x0, ys - (ys - hl.y0) * t / 10]);
          const vb = [], hb = [];
          for (let t = 0; t <= 8; t++) { vb.push(P(hl.cx, hl.y0 + (hl.h * t) / 8).addScaledVector(out, 0.003)); hb.push(P(x0 + (hl.w * t) / 8, ys).addScaledVector(out, 0.003)); }
          bins.add(tapeMat, K.sweep(vb, 0.008, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.003 : 0.011) }));
          bins.add(tapeMat, K.sweep(hb, 0.008, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.003 : 0.011) }));
        }
        loop.push(loop[0]);
        const pts = loop.map(([s, y]) => P(s, y).addScaledVector(out, 0.003));
        bins.add(tapeMat, K.sweep(pts, 0.012, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.004 : 0.02) }));
        bins.add(thread, K.sweep(loop.map(([s, y]) => P(s, y).addScaledVector(out, 0.0068)), 0.0009, 4));
      }
      if (type === 'door' || type === 'gabledoor') {
        const zx = len / 2, zp = []; for (let t = 0; t <= 24; t++) zp.push(P(zx, 0.02 + ((H - 0.08) * t) / 24).addScaledVector(out, 0.004));
        bins.add(zipM, K.sweep(zp, 0.005, 5));
        const fl = []; for (let t = 0; t <= 24; t++) fl.push(P(zx - 0.035, 0.02 + ((H - 0.08) * t) / 24).addScaledVector(out, 0.006));
        bins.add(tapeMat, T2.bandAlong(fl, fl.map(() => out.clone()), 0.06, 0.002));
      }
      if (endDoor) {
        // two vertical zips, each with a welded reinforcement band (doubled edge of the doorway)
        for (const [zx, sd] of [[d0, -1], [d1, 1]]) {
          const zp = [], bp = [];
          for (let t = 0; t <= 28; t++) {
            const y = 0.02 + ((H - 0.06) * t) / 28;
            zp.push(P(zx + sd * 0.006, y).addScaledVector(out, 0.004));
            bp.push(P(zx + sd * 0.03, y).addScaledVector(out, 0.0026));
          }
          bins.add(zipM, K.sweep(zp, 0.0045, 5));
          bins.add(tapeMat, T2.bandAlong(bp, bp.map(() => out.clone()), 0.05, 0.0018));
          bins.add(thread, K.sweep(bp.map((q) => q.clone().addScaledVector(along, sd * 0.019).addScaledVector(out, 0.0012)), 0.0008, 4));
        }
        // eyelets in the bottom hem for pegs (every 50 cm, not in the doorway)
        const eyeM = M.galvanised();
        for (let s = 0.2; s < len - 0.1; s += 0.5) {
          if (endOpen && s > d0 - 0.06 && s < d1 + 0.06) continue;
          const e = new THREE.TorusGeometry(0.009, 0.0026, 6, 14);
          const q = P(s, 0.045).addScaledVector(out, 0.003);
          e.lookAt(out); e.translate(q.x, q.y, q.z); bins.add(eyeM, e);
        }
        if (endOpen) {
          // the door panel rolled up to the top of the doorway, held by two roll-up straps
          const rollR = 0.065, y = wallTop - rollR - 0.03;
          addCloth(rollAlong(d0 + 0.01, d1 - 0.01, 30, y, rollR), laneX ? 'x' : 'z');
          for (const f of [0.22, 0.78]) {
            const s = d0 + dw * f, base = P(s, y);
            const loopPts = []; for (let t = 0; t <= 24; t++) { const an = (t / 24) * Math.PI * 2; loopPts.push(base.clone().addScaledVector(out, rollR * 0.6 + Math.cos(an) * (rollR + 0.004)).add(V3(0, Math.sin(an) * (rollR + 0.004), 0))); }
            bins.add(strapM, K.sweep(loopPts, 0.006, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.0015 : 0.012) }));
            bins.add(strapM, T2.bandAlong([base.clone().addScaledVector(out, 0.004).setY(y + rollR), base.clone().addScaledVector(out, 0.004).setY(wallTop - 0.005)], [out, out], 0.024, 0.0016));
          }
          const strip = [];
          for (let j = 0; j <= 2; j++) { const row = []; for (const sv of sCols(d0, d1, 16)) row.push(P(sv, y + rollR * 0.6 + ((wallTop - y - rollR * 0.6) * j) / 2)); strip.push(row); }
          addCloth(K.gridGeometry(strip), Math.abs(out.z) > 0.5 ? 'x' : 'z');
        }
      }
    }
    if (open) {
      // rolled up under the eave and tied with straps; a short top strip stays under the valance
      const rollR = 0.07, y = wallTop - rollR - 0.03;
      addCloth(rollAlong(0, len, 40, y, rollR), laneX ? 'x' : 'z');
      for (const f of (len > 2.5 ? [0.2, 0.5, 0.8] : [0.25, 0.75])) {
        const s = len * f, base = P(s, y);
        const loopPts = []; for (let t = 0; t <= 24; t++) { const an = (t / 24) * Math.PI * 2; loopPts.push(base.clone().addScaledVector(out, rollR * 0.6 + Math.cos(an) * (rollR + 0.004)).add(V3(0, Math.sin(an) * (rollR + 0.004), 0))); }
        bins.add(strapM, K.sweep(loopPts, 0.006, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.0015 : 0.012) }));
        bins.add(strapM, T2.bandAlong([base.clone().addScaledVector(out, 0.004).setY(y + rollR), base.clone().addScaledVector(out, 0.004).setY(wallTop - 0.005)], [out, out], 0.024, 0.0016));
      }
      const strip = [];
      for (let j = 0; j <= 2; j++) { const row = []; for (const sv of sCols(0, len, 24)) row.push(P(sv, y + rollR * 0.6 + ((wallTop - y - rollR * 0.6) * j) / 2)); strip.push(row); }
      addCloth(K.gridGeometry(strip), Math.abs(out.z) > 0.5 ? 'x' : 'z');
    }
  }

  bins.build(inner);
  const group = new THREE.Group();
  if (gableFront) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  return { group, hex, panels: panels.length, hanging: panels.filter((p) => p.type !== 'rolledwall').length };
}

const SERIES = {
  basis: { line: 'pe', eave: 2.0, groundFrame: false, collar: false },
  500: { line: 'pvc', eave: 2.0, groundFrame: false, collar: false },
  '550-premium': { line: 'pvc', eave: 2.0, groundFrame: true, collar: true },
  '550-compleet': { line: 'pvc', eave: 2.0, groundFrame: true, collar: true, straps: true },
  620: { line: 'pvc', eave: 2.2, groundFrame: true, collar: true },
};

export function frameTent(p = {}) {
  let span = Number(p.w ?? 4), length = Number(p.d ?? 8);
  if (span > length) [span, length] = [length, span];
  const opslag = String(p.variant || '').toLowerCase().startsWith('opslag');
  const ser = SERIES[String(p.series || '').toLowerCase()] || null;
  const line = ser ? ser.line : (String(p.line || 'pvc').toLowerCase().startsWith('pe') ? 'pe' : 'pvc');
  const frame = p.frame !== false;
  const He = Number(p.eave ?? (ser ? ser.eave : 2.0));
  const Hr = Number(p.ridge ?? He + span * (opslag ? 0.27 : 0.25));
  // the loose roof cover is shown on the bare frame (no walls)
  const walls = !frame ? 'none' : opslag ? (p.walls ?? 'closed') : (p.walls ?? 'none');
  const walled = walls && walls !== 'none';
  // hero (no door state given): the door bay and the bay next to it rolled up, so the frame
  // inside reads (legs, knee braces, rafters, connectors, ground frame); `door: 'open'` rolls up
  // only the door (front view). Storage tents: the front gable is the roll-up door.
  const pro620 = !!ser && String(p.series) === '620' && walled && !opslag;
  // eindwand (`gableDoor: 'right' | 'left'`): that gable gets the end wall with its doorway, `door`
  // is the state of that doorway, and the camera looks at the gable (the long side recedes)
  // ('left' by default: seen from the front left the key light rakes over the end wall and the
  // long side recedes in the soft side light)
  const gableDoor = walled && !opslag && p.gableDoor ? (String(p.gableDoor) === 'right' ? 'right' : 'left') : null;
  const openFront = walled && !opslag && !gableDoor && p.door == null && p.openFront !== false && !pro620;
  const door = p.door || (openFront ? 'open' : 'closed');
  // 620 Professional: its selling point is the 2,2 m side height, which a side-by-side 3/4 view
  // of the same 4 x 8 m tent hardly shows (round 3: 550 Premium and 620 heroes were the same
  // picture). Its hero looks along the closed tent from low at the right gable, which is rolled
  // up: the tall opening, the frame inside and the long wall running away read as height
  const openGable = p.openGable || (pro620 && p.__angle !== 'front' ? 'right' : null);
  const { group, hex, panels, hanging } = buildFrameTent({
    span, length, eave: He, ridge: Hr, line, color: p.color || 'wit', walls, door, frame: true,
    gableFront: opslag, frontGableDoor: opslag, ties: opslag, openFront,
    groundFrame: ser ? ser.groundFrame : !!p.groundFrame, collar: ser ? ser.collar : !!p.collar, straps: ser ? !!ser.straps : !!p.straps,
    openGable, stripes: p.stripes || null, gableDoor,
  });
  group.name = `frameTent ${span}x${length} ${line}${opslag ? ' opslag' : ''}${ser ? ' ' + p.series : ''}`;
  // enclosure for the interior light (walls on three or four sides); openings: the rolled gable,
  // an open door
  let enclosure = null;
  if (walled && hanging >= 3) {
    const hx = (opslag ? span : length) / 2, hz = (opslag ? length : span) / 2;
    const openings = [];
    if (openGable) openings.push([length / 2, 0, 1]);
    if (door === 'open' || door === 'rolled') {
      if (gableDoor) openings.push([(gableDoor === 'left' ? -1 : 1) * length / 2, 0, 1]);
      else if (opslag) openings.push([0, length / 2, 1.2]);
      else if (openFront) openings.push([-1, span / 2, 1.2], [1, span / 2, 1.2]);
      else openings.push([0, span / 2, 1]);
    }
    enclosure = { box: [0, 0, hx + 0.07, hz + 0.07], floorBox: [0, 0, hx + 0.04, hz + 0.04], top: Hr + 0.05, feather: 0.14, k: 0.55, kNear: 1.0, amb: 0.8, ambNear: 1.7, floor: 0.4, floorNear: 0.8, fall: 2.8, openings };
  }
  const stripes0 = !!p.stripes;
  const rigW = T2.tentRig2(hex, { walled, enclosure });
  // long walled tents: the softbox beam wider and aimed at the walls' half height, a low card in
  // front, so the long wall on the key side reads white (not mid grey) and keeps its drape
  // Round 6 (white read as flat blown-out plates): the softbox rakes the long wall from further
  // round to the left (-88 deg from the camera), so the drape folds and the bay sag model, and the
  // flat front fill (low card, fill) is roughly halved; white gets exposure 0.56 (lit roof ~240-246,
  // lit wall ~230-242 with fold modulation, almost nothing above 248)
  const whiteC = K.lumOf(hex) > 0.7 && !stripes0;
  const rigD = walled
    ? { ...rigW, key: { ...rigW.key, azimuth: -88, aimRel: [0.05, 0.02, 0.62], angle: 66 }, bounce: { azimuth: -20, elevation: -22, intensity: whiteC ? 1.0 : 0.8 },
      fill: { ...rigW.fill, intensity: whiteC ? 1.3 : 2.2 }, ...(whiteC ? { exposure: 0.56 } : {}) }
    : { ...rigW, key: { ...rigW.key, azimuth: -84 }, ...(whiteC ? { exposure: 0.55, fill: { ...rigW.fill, intensity: 1.6 } } : {}) };
  // opslagtent hero: the long wall seen in the hero faces away from the softbox (+x, image
  // right) and read light grey (~158 white); a lower, more frontal fill from the right lights it to
  // the turned-away value of a white easy-up face (~210-220) and leaves the lit gable on top
  const rigO = opslag ? { ...rigD, fill: { azimuth: 75, elevation: 14, intensity: whiteC ? 3.6 : 3.0 } } : rigD;
  return {
    object: group,
    detail: { target: [length / 2, He - 0.2, span / 2], size: 1.2, azimuth: 30, elevation: 8 },
    view: gableDoor
      ? { hero: { azimuth: gableDoor === 'left' ? -70 : 70, elevation: 9 }, front: { azimuth: gableDoor === 'left' ? -70 : 70, elevation: 9 } }
      : { hero: pro620 ? { azimuth: 58, elevation: 9 } : frame ? { elevation: walled ? 15 : 17 } : { azimuth: 34, elevation: 18 }, front: { elevation: 6 } },
    rig: {
      default: rigO,
      // straight-on view of a walled tent: the walls face the camera, so the softbox comes
      // from front-left (not raking) and white cloth gets the easy-up front exposure
      front: gableDoor ? {} : { key: { ...rigD.key, azimuth: -38, elevation: 28, distanceRel: 2.0, aimRel: [-0.05, 0.3, 0.6], angle: 50, penumbra: 0.9 }, fill: { azimuth: 55, elevation: 10, intensity: 2.2 }, ...(whiteC ? { exposure: 0.56, bounce: { azimuth: -20, elevation: -22, intensity: 1.0 } } : {}) },
    },
    meta: { span, length, He, Hr, line, opslag, frame, series: p.series || null },
  };
}
