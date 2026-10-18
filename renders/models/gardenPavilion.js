// Tuinpaviljoen (aluminium garden pavilion / gazebo with a fixed frame).
//
// Construction: four 10 x 10 cm powder-coated aluminium corner posts on foot plates, a 16 cm
// deep box beam round the top (inner gutter lip and a curtain rail behind it), decorative
// corner braces, and a hip roof (25 deg) of twin-wall polycarbonate panels in aluminium
// glazing bars (bars every ~65 cm down the slope, heavier hip bars, a ridge cap). Twin-wall
// sheet: translucent opal-grey with the internal flutes running down the slope.
// `curtains: 'half-open'|'closed'|'open'` hangs pleated polyester curtains (sold separately)
// from the rail on all four sides, gathered towards the posts.
//   { w, d, color (frame), roof: 'polycarbonaat', curtains, curtainColor }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';
import * as TX from '../js/textures.js';
import * as SG from '../js/softGoods.js';

const { V3 } = K;

let pcMat = null;
function polycarbonate() {
  if (pcMat) return pcMat;
  // fluted twin-wall sheet: a stripe normal map across the flutes (8 mm pitch)
  const c = document.createElement('canvas'); c.width = 64; c.height = 4;
  const g = c.getContext('2d');
  for (let x = 0; x < 64; x++) { const v = 128 + 70 * Math.sin((x / 64) * Math.PI * 2 * 4); g.fillStyle = `rgb(${v | 0},128,255)`; g.fillRect(x, 0, 1, 4); }
  const nm = new THREE.CanvasTexture(c); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.colorSpace = THREE.NoColorSpace; nm.repeat.set(1 / 0.032, 1);
  pcMat = new THREE.MeshPhysicalMaterial({ color: '#D9DCDA', roughness: 0.3, specularIntensity: 0.9, clearcoat: 0.6, clearcoatRoughness: 0.12, normalMap: nm, normalScale: new THREE.Vector2(0.25, 0.25), side: THREE.DoubleSide, name: 'polycarbonate twin-wall' });
  pcMat.userData.stochasticAlpha = 0.82;
  pcMat.userData.translucency = 0.35;
  pcMat.userData.envSpec = 0.6;
  return pcMat;
}

export function gardenPavilion(p = {}) {
  if (String(p.part || '') === 'footings') return footings(p);
  let X = Number(p.w ?? 3), Z = Number(p.d ?? 4);
  if (Z > X) [X, Z] = [Z, X];
  const hex = K.col(p.color || 'antraciet', M.COLORS.antraciet);
  const alu = M.steelPowder(hex, { roughness: 0.4, clearcoat: 0.15 });
  const steel = M.galvanised();
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `gardenPavilion ${X}x${Z}`;
  const ps = 0.1, Hb = 2.22, bH = 0.16, bT = 0.05;
  const hx = X / 2, hz = Z / 2;
  const box = (cx, cy, cz, sx, sy, sz, r = 0.004) => { const g = G.roundedBox(sx, sy, sz, r); g.translate(cx, cy, cz); bins.add(alu, g); };

  // posts, foot plates, beam, braces
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (hx - ps / 2), z = sz * (hz - ps / 2);
    box(x, Hb / 2 + 0.004, z, ps, Hb, ps, 0.006);
    box(x, 0.005, z, 0.2, 0.01, 0.2, 0.003);
    for (const [dx, dz] of [[sx * -1, 0], [0, sz * -1]]) {
      const a = V3(x + dx * (ps / 2), Hb - 0.42, z + dz * (ps / 2)), b = V3(x + dx * 0.42, Hb - 0.005, z + dz * 0.42);
      bins.add(alu, G.prism(G.roundedRectProfile(0.035, 0.02, 0.003, 2), a, b, { side: V3(0, 0, 0).add(V3(dz, 0, -dx)).lengthSq() ? V3(-dz, 0, dx) : V3(1, 0, 0) }));
    }
  }
  for (const sz of [-1, 1]) box(0, Hb + bH / 2, sz * (hz - bT / 2), X, bH, bT);
  for (const sx of [-1, 1]) box(sx * (hx - bT / 2), Hb + bH / 2, 0, bT, bH, Z - 2 * bT);
  // curtain rail behind the beam
  for (const sz of [-1, 1]) box(0, Hb - 0.01, sz * (hz - 0.09), X - 0.2, 0.02, 0.025, 0.003);
  for (const sx of [-1, 1]) box(sx * (hx - 0.09), Hb - 0.01, 0, 0.025, 0.02, Z - 0.2, 0.003);

  // ---- hip roof ---------------------------------------------------------------------------------
  const ov = 0.05, yE = Hb + bH, rise = (hz + ov) * Math.tan(24 * Math.PI / 180);
  const RX = hx + ov, RZ = hz + ov, ridgeHalf = RX - RZ;
  const roofY = (x, z) => {
    const m = Math.max(Math.max(0, Math.abs(x) - ridgeHalf) / RZ, Math.abs(z) / RZ);
    return yE + 0.03 + rise * (1 - Math.min(1, m));
  };
  const pc = polycarbonate();
  // four faces as grids (panels), sheet sits 2 cm above the bar seats
  const face = (fn, nu, nv) => { const rows = []; for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) { const q = fn(i / nu, j / nv); r.push(q); } rows.push(r); } return K.gridGeometry(rows); };
  for (const sz of [-1, 1]) {
    // trapezoid: eave from -RX..RX, ridge from -ridgeHalf..ridgeHalf
    bins.add(pc, face((u, v) => { const z = sz * RZ * (1 - v); const half = ridgeHalf + (RX - ridgeHalf) * (1 - v); const x = -half + 2 * half * u; return V3(x, roofY(x, z), z); }, 24, 10));
  }
  for (const sx of [-1, 1]) {
    bins.add(pc, face((u, v) => { const half = RZ * (1 - v); const z = -half + 2 * half * u; const x = sx * (ridgeHalf + RZ * (1 - v)); return V3(x, roofY(x, z), z); }, 16, 10));
  }
  // glazing bars down the slopes, hip bars, ridge cap, eave trim
  const bar = (a, b, w = 0.045, t = 0.028) => bins.add(alu, G.prism(G.roundedRectProfile(w, t, 0.006, 2), a.clone().add(V3(0, 0.012, 0)), b.clone().add(V3(0, 0.012, 0)), { side: V3(b.z - a.z, 0, a.x - b.x).lengthSq() > 1e-6 ? V3(b.z - a.z, 0, a.x - b.x).normalize() : V3(1, 0, 0) }));
  const step = 0.66;
  const P = (x, z) => V3(x, roofY(x, z), z);
  for (const sz of [-1, 1]) {
    // common bars between the ridge ends, jack bars from the eave to the hips
    const n = Math.max(1, Math.round((2 * ridgeHalf) / step));
    for (let i = 0; i <= n; i++) { const xr = -ridgeHalf + (2 * ridgeHalf * i) / n; bar(P(xr, sz * RZ), P(xr, 0), 0.04, 0.024); }
    for (const sx of [-1, 1]) for (let k = 1; k <= 2; k++) { const xe = sx * (ridgeHalf + (RZ * k) / 3); bar(P(xe, sz * RZ), P(xe, sz * (Math.abs(xe) - ridgeHalf)), 0.04, 0.024); }
  }
  for (const sx of [-1, 1]) for (const z of [-RZ / 2, 0, RZ / 2]) bar(P(sx * RX, z), P(sx * (ridgeHalf + Math.abs(z)), z), 0.04, 0.024);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = V3(sx * RX, 0, sz * RZ), b = V3(sx * ridgeHalf, 0, 0); a.y = roofY(a.x, a.z); b.y = roofY(b.x, b.z);
    bar(a, b, 0.06, 0.04);
  }
  { const a = V3(-ridgeHalf - 0.03, roofY(0, 0), 0), b = V3(ridgeHalf + 0.03, roofY(0, 0), 0); bar(a, b, 0.09, 0.05); }
  // eave trim
  for (const sz of [-1, 1]) bar(V3(-RX, roofY(RX, RZ), sz * RZ), V3(RX, roofY(RX, RZ), sz * RZ), 0.05, 0.035);
  for (const sx of [-1, 1]) bar(V3(sx * RX, roofY(RX, RZ), -RZ), V3(sx * RX, roofY(RX, RZ), RZ), 0.05, 0.035);
  // finials at the ridge ends
  for (const sx of [-1, 1]) { const s = new THREE.SphereGeometry(0.035, 16, 10); s.translate(sx * (ridgeHalf + 0.03), roofY(0, 0) + 0.06, 0); bins.add(alu, s); }

  // ---- curtains -----------------------------------------------------------------------------------
  // Round 4 (round 3 read as hourglass shapes with regular corrugated pleats flaring outside the
  // footprint). Every side has two panels drawn to the posts. A panel column u (0 at the post,
  // 1 at the leading edge) runs from its ring on the rail, sweeps in to the tie-back bundle at
  // 1.05 m and falls from there to a hem that is narrower than the stack at the rail. The fold
  // depth follows from the cloth: a panel has 1.8x fullness, so where its columns are pressed
  // together (the tie-back) the folds go deep and where they spread they flatten. Fold widths
  // and depths are irregular and the folds wander a little with height. The cloth stays inside
  // the rail line (never past the beam), the hem kicks in, not out.
  const cur = p.curtains;
  if (cur && cur !== 'none') {
    const cloth = M.polyCloth(K.col(p.curtainColor || 'beige', M.COLORS.beige), { satin: 0.2 });
    const tieM = M.polyCloth(K.col(p.curtainColor || 'beige', M.COLORS.beige), { satin: 0.25 });
    const ringM = M.aluminium({ tone: '#BFC3C7', roughness: 0.35 });
    const frac = cur === 'closed' ? 0.5 : cur === 'open' ? 0.12 : 0.24;
    const tied = cur !== 'closed';
    const yTopC = Hb - 0.02, yTie = 1.05;
    const sides = [
      { a: V3(-hx + 0.1, 0, hz - 0.09), b: V3(hx - 0.1, 0, hz - 0.09), out: V3(0, 0, 1) },
      { a: V3(hx - 0.09, 0, hz - 0.1), b: V3(hx - 0.09, 0, -hz + 0.1), out: V3(1, 0, 0) },
      { a: V3(hx - 0.1, 0, -hz + 0.09), b: V3(-hx + 0.1, 0, -hz + 0.09), out: V3(0, 0, -1) },
      { a: V3(-hx + 0.09, 0, -hz + 0.1), b: V3(-hx + 0.09, 0, hz - 0.1), out: V3(-1, 0, 0) },
    ];
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const sm = (t) => t * t * (3 - 2 * t);
    sides.forEach((sd, si) => {
      const Ls = sd.a.distanceTo(sd.b), along = sd.b.clone().sub(sd.a).normalize();
      for (const end of [0, 1]) {
        // tied: below the band the cloth falls as a narrow column that only opens a little to the
        // hem (no hourglass)
        const wTop = Ls * frac, wTie = Math.min(0.16, wTop * 0.32), wHem = tied ? Math.max(wTie * 1.7, wTop * 0.36) : wTop * 1.04;
        const fullness = 1.8;
        const nF = Math.max(5, Math.round(wTop / 0.11));
        // irregular fold widths: cumulative random widths -> fold coordinate phi(u)
        const cw = [0]; for (let k = 0; k < nF; k++) cw.push(cw[k] + 0.5 + 1.0 * rnd());
        const amp = []; for (let k = 0; k <= nF + 1; k++) amp.push(0.5 + 1.0 * rnd());
        const wander = []; for (let k = 0; k <= nF + 1; k++) wander.push((rnd() - 0.5) * 1.6);
        const phiOf = (u) => {
          const x = u * cw[nF]; let k = 0; while (k < nF - 1 && cw[k + 1] < x) k++;
          return k + (x - cw[k]) / (cw[k + 1] - cw[k]);
        };
        const sAt = (u, y) => {
          const sTop = 0.025 + u * wTop, sTie = 0.04 + u * wTie, sHem = 0.035 + u * wHem;
          if (!tied) return sTop + (sHem - sTop) * sm((yTopC - y) / yTopC);
          if (y >= yTie) return sTop + (sTie - sTop) * sm((yTopC - y) / (yTopC - yTie));
          return sTie + (sHem - sTie) * Math.sin((Math.PI / 2) * ((yTie - y) / yTie));
        };
        const nx = nF * 12, ny = 64;
        const rows = [];
        for (let j = 0; j <= ny; j++) {
          const y = yTopC * (1 - j / ny), row = [];
          // horizontal room per fold vs cloth per fold -> fold depth (half the leftover cloth)
          const room = (sAt(1, y) - sAt(0, y)) / nF, clothPer = (wTop * fullness) / nF;
          const depth = 0.5 * Math.sqrt(Math.max(0, (clothPer / 2) ** 2 - (room / 2) ** 2));
          const vNorm = 1 - y / yTopC;
          for (let i = 0; i <= nx; i++) {
            const u = i / nx, f = phiOf(u), k = Math.min(nF, Math.floor(f)), fr = f - k;
            const A = amp[k] * (1 - sm(fr)) + amp[k + 1] * sm(fr);
            const ph = (f + (wander[k] * (1 - sm(fr)) + wander[k + 1] * sm(fr)) * 0.25 * vNorm) * Math.PI * 2;
            // edge columns lie flat against the post / leading edge a little
            const edge = Math.min(1, Math.min(u, 1 - u) * nF * 0.9 + 0.35);
            let z = depth * A * Math.sin(ph) * edge - depth * 0.9;
            const kick = y < 0.03 ? -(0.03 - y) * 1.2 : 0;
            z = Math.min(0.03, z) + kick;
            const s = sAt(u, y), ss = end === 0 ? s : Ls - s;
            row.push(sd.a.clone().addScaledVector(along, ss).addScaledVector(sd.out, z - 0.02).setY(Math.max(0.004, y)));
          }
          if (end === 1) row.reverse();
          rows.push(row);
        }
        bins.add(cloth, K.gridGeometry(rows));
        // hem: a folded edge along the bottom row
        bins.add(cloth, K.sweep(rows[ny].map((q) => q.clone().setY(Math.max(0.006, q.y + 0.004))), 0.004, 5));
        // rings on the rail at every fold crest
        for (let k = 0; k <= nF; k++) {
          const u = cw[k] / cw[nF];
          const sLoc = sAt(u, yTopC), ss = end === 0 ? sLoc : Ls - sLoc;
          const rp = sd.a.clone().addScaledVector(along, ss).addScaledVector(sd.out, -0.035).setY(yTopC + 0.012);
          const ring = new THREE.TorusGeometry(0.014, 0.0025, 6, 14); ring.lookAt(along); ring.translate(rp.x, rp.y, rp.z); bins.add(ringM, ring);
        }
        if (tied) {
          // tie-back band round the bundle, hooked to the post
          const room = sAt(1, yTie) - sAt(0, yTie), clothPer = (wTop * fullness) / nF;
          const dTie = 0.5 * Math.sqrt(Math.max(0, (clothPer / 2) ** 2 - (room / nF / 2) ** 2));
          const sMid = (sAt(0, yTie) + sAt(1, yTie)) / 2, ss = end === 0 ? sMid : Ls - sMid;
          const c0 = sd.a.clone().addScaledVector(along, ss).addScaledVector(sd.out, -0.02 - dTie * 0.9).setY(yTie);
          const ra = room / 2 + 0.018, rb = dTie * 1.35 + 0.018;
          const band = [];
          for (let t = 0; t <= 40; t++) { const a = (t / 40) * Math.PI * 2; band.push(c0.clone().addScaledVector(along, Math.cos(a) * ra).addScaledVector(sd.out, Math.sin(a) * rb).setY(yTie + 0.004 * Math.sin(a * 3))); }
          bins.add(tieM, T2.bandAlong(band, band.map((q) => q.clone().sub(c0).setY(0).normalize()), 0.055, 0.004));
        }
      }
      void si;
    });
  }

  bins.build(group);
  return {
    object: group,
    detail: { target: [hx - 0.1, Hb, hz - 0.1], size: 0.9, azimuth: 30, elevation: 10 },
    view: { hero: { elevation: 17 } },
    rig: { default: { ...K.tentRig(hex, { walled: !!cur }), exposure: 'auto' } },
    meta: { X, Z },
  };
}

// ---------------------------------------------------------------------------------------------
// Funderingsset tuinpaviljoen (`part: 'footings'`): the three ways to fix a post, side by side
// on the studio floor, framed as one close-up (angle 'detail'):
//  - betonpoer: a 30 x 30 x 30 cm cast concrete footing with a galvanised foot plate and post
//    shoe (10 x 10 cm socket) bolted on top;
//  - verstelbare voet: a galvanised base plate, an M20 threaded rod with two nuts (0-8 cm) and a
//    top plate with the post shoe;
//  - grondanker: a 60 cm galvanised auger anchor (rod, 1.5-turn helix blade, point) with the
//    plate and shoe on top, lying on the floor in front.
//   { part: 'footings', kinds: ['poer', 'stelvoet', 'grondanker'] }
function footings(p) {
  const kinds = (Array.isArray(p.kinds) && p.kinds.length ? p.kinds : ['poer', 'stelvoet', 'grondanker']).map(String);
  const galv = M.galvanised();
  const conc = SG.concreteSG({ tone: '#ACAAA4' });
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = 'gardenPavilion footings';
  const box = (mat, cx, cy, cz, sx, sy, sz, r = 0.002) => { const g = G.roundedBox(sx, sy, sz, r); g.translate(cx, cy, cz); bins.add(mat, g); };
  // post shoe: foot plate + square socket (3 mm walls) + 4 bolts with washers; `rot` turns it
  // about its own vertical axis, `q` (quaternion) lays it down for the anchor
  const shoe = (base, { plate = 0.17, socketH = 0.11, q = null } = {}) => {
    const parts = [];
    const add = (geo) => parts.push(geo);
    const t = 0.008, w = 0.108, wall = 0.003;
    let g = G.roundedBox(plate, t, plate, 0.002); g.translate(0, t / 2, 0); add(g);
    for (const [dx, dz, sx, sz] of [[0, (w - wall) / 2, w, wall], [0, -(w - wall) / 2, w, wall], [(w - wall) / 2, 0, wall, w - 2 * wall], [-(w - wall) / 2, 0, wall, w - 2 * wall]]) {
      g = G.roundedBox(sx, socketH, sz, 0.0012); g.translate(dx, t + socketH / 2, dz); add(g);
    }
    // through-bolt across the socket
    g = G.tube(V3(-w / 2 - 0.012, t + socketH * 0.6, 0), V3(w / 2 + 0.012, t + socketH * 0.6, 0), 0.005, 12, { caps: true }); add(g);
    for (const sx of [-1, 1]) { g = G.hexTube(V3(sx * (w / 2 + 0.002), t + socketH * 0.6, 0), V3(sx * (w / 2 + 0.011), t + socketH * 0.6, 0), 0.016); add(g); }
    // plate bolts
    const o = plate / 2 - 0.022;
    for (const [bx, bz] of [[o, o], [-o, o], [o, -o], [-o, -o]]) {
      g = new THREE.CylinderGeometry(0.011, 0.011, 0.002, 20); g.translate(bx, t + 0.001, bz); add(g);
      g = G.hexTube(V3(bx, t + 0.002, bz), V3(bx, t + 0.011, bz), 0.017); add(g);
    }
    for (const geo of parts) { if (q) geo.applyQuaternion(q); geo.translate(base.x, base.y, base.z); bins.add(galv, geo); }
  };
  const xs = { poer: -0.36, stelvoet: 0.02, grondanker: 0.3 };
  // betonpoer
  if (kinds.includes('poer')) {
    const x0 = xs.poer, S = 0.3;
    box(conc, x0, S / 2, 0, S, S, S, 0.01);
    shoe(V3(x0, S, 0));
  }
  // verstelbare voet
  if (kinds.includes('stelvoet')) {
    const x0 = xs.stelvoet;
    let g = G.roundedBox(0.16, 0.008, 0.16, 0.002); g.translate(x0, 0.004, 0); bins.add(galv, g);
    for (const [bx, bz] of [[0.058, 0.058], [-0.058, 0.058], [0.058, -0.058], [-0.058, -0.058]]) {
      const ring = new THREE.TorusGeometry(0.0075, 0.0018, 6, 18); ring.rotateX(Math.PI / 2); ring.translate(x0 + bx, 0.0085, bz); bins.add(M.mouldedNylon('#2A2B2D'), ring);
    }
    // threaded rod: a ridged lathe (thread crests every 2.5 mm)
    const prof = []; const H0 = 0.008, H1 = 0.15;
    for (let y = H0; y <= H1 + 1e-6; y += 0.00125) prof.push([0.0088 + (Math.round((y - H0) / 0.00125) % 2 ? 0.0012 : 0), y]);
    g = G.lathe(prof, 20); g.translate(x0, 0, 0); bins.add(galv, g);
    // weld collar on the base, two nuts with washers
    g = new THREE.CylinderGeometry(0.016, 0.019, 0.012, 24); g.translate(x0, 0.014, 0); bins.add(galv, g);
    for (const yn of [0.085, 0.132]) {
      g = G.hexTube(V3(x0, yn, 0), V3(x0, yn + 0.016, 0), 0.03); bins.add(galv, g);
      g = new THREE.CylinderGeometry(0.02, 0.02, 0.0025, 24); g.translate(x0, yn - 0.0015, 0); bins.add(galv, g);
    }
    shoe(V3(x0, 0.15, 0), { plate: 0.14, socketH: 0.09 });
  }
  // grondanker, lying on the floor, point to the front-left
  if (kinds.includes('grondanker')) {
    const len = 0.6, rr = 0.011;
    const dir = V3(-0.8, 0, 0.6).normalize(); // from the head (right, back) to the point (left, front)
    const head = V3(xs.grondanker + 0.3, 0, 0.1);
    const axisY = 0.088; // the shoe's plate edge holds the rod off the floor a little
    const a = head.clone().setY(axisY), b = head.clone().addScaledVector(dir, len).setY(rr);
    const ad = b.clone().sub(a).normalize();
    bins.add(galv, G.tube(a, b.clone().addScaledVector(ad, -0.05), rr, 18, { caps: true }));
    // point
    const pt = G.lathe([[rr, 0], [rr * 0.7, 0.03], [0.0015, 0.05], [0.0001, 0.052]], 18);
    pt.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), ad)); const pb = b.clone().addScaledVector(ad, -0.05); pt.translate(pb.x, pb.y, pb.z); bins.add(galv, pt);
    // helix blade: 1.5 turns, 10 cm diameter, near the point
    const side = V3().crossVectors(ad, V3(0, 1, 0)).normalize(), up = V3().crossVectors(side, ad).normalize();
    const rows = [];
    const turns = 1.5, s0 = len - 0.22, s1 = len - 0.07, nT = 72;
    for (const rad of [rr, 0.05]) {
      const row = [];
      for (let i = 0; i <= nT; i++) {
        const t = i / nT, an = t * turns * Math.PI * 2, sAlong = s0 + (s1 - s0) * t;
        const c = a.clone().addScaledVector(ad, sAlong);
        row.push(c.addScaledVector(side, Math.cos(an) * rad).addScaledVector(up, Math.sin(an) * rad));
      }
      rows.push(row);
    }
    bins.add(galv, K.gridGeometry(rows));
    bins.add(galv, K.gridGeometry(rows.map((r) => r.map((q) => q.clone())).reverse()));
    bins.add(galv, K.sweep(rows[1], 0.0022, 6));
    // head: shoe turned so its socket points back along the rod (plate square to the rod)
    const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), ad.clone().negate());
    shoe(a.clone().addScaledVector(ad, 0.0), { plate: 0.15, socketH: 0.09, q });
  }
  bins.build(group);
  return {
    object: group,
    detail: { target: [0.14, 0.14, 0.12], size: 1.35, azimuth: 26, elevation: 24, aperture: 0 },
    view: { hero: { azimuth: 26, elevation: 24 } },
    rig: { default: { ...K.tentRig('#9A9EA2'), exposure: 'auto' } },
    meta: { part: 'footings', kinds },
  };
}
