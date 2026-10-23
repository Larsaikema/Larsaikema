// Regengoot partytent (rain gutter between two tents).
//
// { length, color, width, mounted }
// A 42 cm wide length of PVC tarpaulin 650 g/m² (glossy coated skin over a coarse scrim,
// welded hems) with 30 mm hook tape stitched along both long edges (two stitch rows each):
// the tape grips the roof edges of the two tents, between them the gutter hangs as a channel
// and leads the water to the ends. Packshot (SG.stripPackshot): rolled up loosely at the back
// (the turns stack on the thick taped edges, so the roll ends are fuller than its waist and
// the hem spirals show), the free end comes off the top of the roll, drapes down and lies
// towards the viewer opened into its trough: flat bottom, steep walls, flanges with the hook
// tape; a welded end hem closes the free end.
// `mounted: true` (item scenes with two tents): the gutter as it hangs between two easy-ups.
// `clamps: 38` (round 4): the tube-frame gutter, ca. 35 cm wide PVC with welded edge hems (no hook
// tape) and its loose snap-on plastic clamps for 38 mm eave tubes, one per 50 cm, lying in a row
// in front of the open trough.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';
import * as K4 from '../js/partsKit4.js';
import * as L5 from '../js/partsLook5.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

export function rainGutter(p = {}) {
  const L = Number(p.length ?? 3);
  const width = Number(p.width ?? 0.42);
  const color = p.color || 'wit';
  const hex = M.resolveColor(color, '#F3F3F0');
  const light = new THREE.Color(hex).getHSL({}).l > 0.5;
  const cloth = light ? L3.pvcSatin(hex, { rough: 0.4, coat: 0.25, weave: 0.3 }) : L3.pvcSatin(hex === '#1A1A1A' || color === 'zwart' ? '#1E1F21' : hex, { rough: 0.4, coat: 0.25, weave: 0.3 });
  const hook = SG.hookTape(light ? '#CBCCC8' : '#1B1C1D');
  const thr = SG.thread(light ? '#E9E8E3' : '#34353A', { sheen: light ? 0.3 : 0.8 });
  if (p.mounted) return mountedGutter({ L, width: Math.min(width, 0.36), cloth, velcroMat: hook, eave: Number(p.eave ?? 2.14), gap: Number(p.gap ?? 0.1) });
  // round 5 (art direction 22 Oct): the gutter is shown doing its job, hanging between two roof
  // edges as a soft PVC channel, the rest of its length still rolled up on the rails behind
  if (p.display !== 'packshot') {
    const pvc = light ? L5.pvc5(hex, { rough: 0.42, coat: 0.2, weave: 0.3, min: 0 }) : L5.pvc5(color === 'zwart' ? '#1C1D1F' : hex, { rough: 0.42, coat: 0.2, weave: 0.3 });
    return hangingGutter({ L, W: p.clamps ? Number(p.width ?? 0.35) : width, cloth: pvc, hook, thr, light, color, clamps: p.clamps ? Number(p.clamps) / 1000 : 0 });
  }
  if (p.clamps) return tubeFrameGutter({ L, width: Number(p.width ?? 0.35), cloth, light, thr, tubeD: Number(p.clamps) / 1000, color });
  const { object } = L3.gutterPackshot({ L, W: width, cloth, hook, thr, T: Math.min(width > 0.5 ? 1.0 : 0.82, L * 0.3), tapeW: 0.03, seed: 9, rot: 50, flange: width > 0.5 ? 0.06 : 0.05 });
  return {
    object,
    detail: { target: [0.3, 0.05, 0.6], size: 0.4, azimuth: 40, elevation: 32 },
    view: { hero: { elevation: 28, azimuth: 30 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 }, ...(light ? { exposure: 0.68, toneMapping: 'neutral', shoulder: 0.88 } : { key: { intensity: 3.6 }, fill: { azimuth: 80, elevation: 16, intensity: 1.4 }, rim: { azimuth: 150, elevation: 34, intensity: 1.4 }, exposure: 1.25 }) } },
    meta: { L, color },
  };
}

// Mounted between two easy-ups standing side by side along z (tent edges at x = +-gap/2, eave
// height `eave`): both hook-tape rims lie on the roof edges, the middle sags into a channel
// between the valances. For item scenes such as two tents + a gutter.
function mountedGutter({ L, width, cloth, velcroMat, eave, gap }) {
  const bins = new G.PartBin();
  const half = width / 2, nw = 40, nl = 120;
  const rows = [];
  for (let j = 0; j <= nw; j++) {
    const w = -half + width * (j / nw);
    const row = [];
    for (let i = 0; i <= nl; i++) {
      const z = -L / 2 + L * (i / nl);
      const endLift = 0.03 * Math.pow(Math.abs(2 * z / L), 6);
      const ax = Math.abs(w);
      const inGap = ax < gap / 2 + 0.03;
      const sag = 0.07 * (1 - Math.pow(Math.min(1, ax / (gap / 2 + 0.03)), 2)) * (1 - 0.3 * Math.pow(2 * z / L, 2));
      const y = eave + 0.035 + (inGap ? -sag : 0.5 * (ax - gap / 2 - 0.03)) + endLift;
      row.push(V3(w, y, z));
    }
    rows.push(row);
  }
  const geo = K.gridGeometry(rows, { closedU: false, flip: true });
  bins.add(cloth, geo);
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= nl; i++) { const z = -L / 2 + L * (i / nl); const ax = half - 0.016; pts.push(V3(s * ax, eave + 0.035 + 0.5 * (ax - gap / 2 - 0.03) + 0.03 * Math.pow(Math.abs(2 * z / L), 6) + 0.0015, z)); }
    bins.add(velcroMat, K.strapAlong(pts, 0.025, 0.002, { up: V3(-s * 0.45, 1, 0).normalize() }));
  }
  const g = K.finish(bins, 'rainGutter mounted');
  return { object: g, meta: { mounted: true, L } };
}

// Tube-frame gutter (regengoot buizenframe): the strip packshot of SG.rollStrip with the trough
// section of L3.gutterPackshot, welded double hems along both edges instead of hook tape, and
// the snap-on clamps for the eave tubes (C-clip Ø tubeD with a slotted tongue) in front.
function tubeFrameGutter({ L, width: W, cloth, light, thr, tubeD = 0.038, color }) {
  const bins = new G.PartBin();
  const flange = 0.045;
  const tr = W / 2 - flange, r = (2 * tr) / Math.PI, fl = -8 * DEG;
  const sectionAt = (w) => {
    const a = Math.abs(w), s = Math.sign(w) || 1;
    if (a <= tr) { const th = a / r; return [s * r * Math.sin(th), r * (1 - Math.cos(th))]; }
    const d = a - tr;
    return [s * (r + d * Math.cos(fl)), r + d * Math.sin(fl)];
  };
  const section = (w, a, tt) => { const k = K.sstep(0.0, 0.5, tt); const [x, y] = sectionAt(w); return [w + (x - w) * k, y * k]; };
  const T = Math.min(0.82, L * 0.3);
  const R = SG.rollStrip({ W, Ltot: L, T, section, seed: 13, foldAmp: 0.0004, eb: 0.016, te: 0.0018, tc: 0.0009, wave: 0.0004 });
  bins.add(cloth, R.geo);
  const aMax = R.aEnd - 0.01;
  const along = (w, lift, a0 = 0.004, a1 = aMax, step = 0.005) => { const pts = [], nrm = []; for (let a = a0; a <= a1; a += step) { const q = R.at(w, a, lift); pts.push(q.p); nrm.push(q.n); } return { pts, nrm }; };
  for (const s of [-1, 1]) {
    // welded double hem: a rolled bead at the edge and the weld seam 25 mm in, with a stitch-free
    // heat-seal ridge
    const e = s * W / 2;
    const hem = along(e - s * 0.004, 0.0012, 0.002, aMax, 0.004);
    bins.add(cloth, K.tubeAlong(hem.pts, 0.0034, 10));
    const seal = along(e - s * 0.026, 0.0006, 0.006, R.aRoll + R.turn * 1.1, 0.004);
    bins.add(cloth, K.strapAlong(seal.pts, 0.006, 0.0009, { normals: seal.nrm }));
  }
  {
    const pts = [], nrm = [];
    for (let k = 0; k <= 80; k++) { const w = -W / 2 + 0.003 + (W - 0.006) * (k / 80); const q = R.at(w, 0.012, 0.0006); pts.push(q.p); nrm.push(q.n); }
    bins.add(cloth, K.strapAlong(pts, 0.022, 0.0012, { normals: nrm }));
  }
  const g = K.finish(bins, `gutter tube-frame ${L}`);
  g.traverse((o) => { if (o.isMesh && o.material === cloth) o.receiveShadow = true; });
  g.rotation.y = 50 * DEG;
  const root = new THREE.Group(); root.add(g);
  // clamps: one per 50 cm (shown: a row of four)
  const clip = SG.moulded(light ? '#ECEBE6' : '#3A3C40', { rough: 0.4, spec: 0.5 });
  const cb = new G.PartBin();
  const Ri = tubeD / 2 + 0.0005, t = 0.0042, h = 0.03, open = 70 * DEG;
  for (let k = 0; k < 4; k++) {
    const sub = new G.PartBin();
    // C-ring (opening towards +x), lathe phi: x = r sin(phi), z = r cos(phi)
    sub.add(clip, K.lathe([[Ri, 0], [Ri + t, 0], [Ri + t, h], [Ri, h], [Ri, 0]], 64, Math.PI / 2 + open / 2, TAU - open));
    // rounded lips at the opening
    for (const sg of [-1, 1]) { const a = Math.PI / 2 + sg * open / 2; const lip = G.tube(V3(Math.sin(a) * (Ri + t / 2), 0, Math.cos(a) * (Ri + t / 2)), V3(Math.sin(a) * (Ri + t / 2), h, Math.cos(a) * (Ri + t / 2)), t * 0.62, 12); sub.add(clip, lip); }
    // tongue at -x with a slot for the gutter hem
    const tg = new THREE.Shape(); tg.moveTo(0, 0); tg.lineTo(0.034, 0); tg.absarc(0.034, h / 2, h / 2, -Math.PI / 2, Math.PI / 2, false); tg.lineTo(0, h); tg.lineTo(0, 0);
    const sl = new THREE.Path(); sl.moveTo(0.012, 0.007); sl.lineTo(0.034, 0.007); sl.absarc(0.034, h / 2, 0.008, -Math.PI / 2, Math.PI / 2, false); sl.lineTo(0.012, h - 0.007); sl.lineTo(0.012, 0.007); tg.holes.push(sl);
    const tgG = new THREE.ExtrudeGeometry(tg, { depth: 0.0036, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1, curveSegments: 20 });
    tgG.translate(0, 0, -0.0018); tgG.rotateY(Math.PI); tgG.translate(-(Ri + t - 0.002), 0, 0);
    sub.add(clip, tgG);
    K4.placeBin(cb, sub, { x: 0, z: (k - 1.5) * 0.085, yaw: 90 + 34 + (k % 2 ? 4 : -3) });
  }
  // the row of clamps lies to the front right of the trough, across the frame
  const cg = new THREE.Group(); cb.build(cg);
  cg.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  cg.position.set(0.42, 0, 0.62); cg.rotation.y = -34 * DEG + Math.PI / 2;
  root.add(cg);
  return {
    object: root,
    detail: { target: [0.3, 0.05, 0.6], size: 0.4, azimuth: 40, elevation: 32 },
    view: { hero: { elevation: 30, azimuth: 30 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 }, ...(light ? { exposure: 0.68, toneMapping: 'neutral', shoulder: 0.88 } : { exposure: 1.0 }) } },
    meta: { L, color, clamps: tubeD },
  };
}

// ---------------------------------------------------------------------------------------------
// Round 5: the gutter hanging between two roof edges (rails at eave height, cut ends in front,
// running on out of the frame behind). The strip lies over both rails and sags between them into
// a soft channel (parabolic, depth varying a little along the length, small tension wrinkles at
// the rails), wraps over each rail and its edge flap hangs down outside it with the hook tape
// (easy-up / stretch) or the welded hem gripped by snap clamps (tube frame, Ø 38). In front the
// free end overhangs the rails and droops a little; behind, the channel flattens out and the rest
// of the length is still rolled up, the roll resting on the rails.
const NOFLOOR = { shadowStrength: 0, keyShadow: 0, groundAO: { strength: 0, samples: 8, keySamples: 8 }, contact: { strength: 0 } };
function hangingGutter({ L, W, cloth, hook, thr, light, color, clamps = 0 }) {
  const bins = new G.PartBin();
  const extras = [];
  const tubeFrame = clamps > 0;
  const rho = tubeFrame ? clamps / 2 : 0.0125;           // rail radius
  const tc = 0.0016;                                       // strip thickness + clearance over the rail
  const rp = rho + tc;                                     // strip wraps the rail at this radius
  const tapeW = 0.03;
  const yR = 2.12;                                         // rail centre height (eave)
  const g = Math.min(W * 0.62, W - 2 * (0.06 + rho));      // rail centre distance
  // trough: parabola z in [-zc, zc], depth dep; tangent onto the rail at angle phi (from the rail
  // centre, 2nd quadrant on the +z rail)
  const dep0 = Math.min(0.11, W * 0.2);
  const section = (dep) => {
    // find zc so that the parabola's end is tangent to the rail circle centred at (g/2, 0)
    let zc = g / 2 - rp * 0.5, phi = 0;
    for (let it = 0; it < 30; it++) {
      phi = Math.PI - Math.atan2(zc, 2 * Math.max(1e-4, dep)); // tan(phi) = -zc / (2 dep)
      const cz = zc - rp * Math.cos(phi);
      zc += (g / 2 - cz) * 0.8;
    }
    const yTopC = -rp * Math.sin(phi);                     // rail centre y relative to the trough rim
    // polyline (half section, z >= 0) by arc length from the middle
    const pts = [[0, -dep]];
    const N1 = 40;
    for (let i = 1; i <= N1; i++) { const z = (i / N1) * zc; pts.push([z, -dep * (1 - (z / zc) ** 2)]); }
    // over the top of the rail to its outer shoulder (45 deg), then a short flap sticking out and
    // down along the tangent: the rail stays visible under the edge, the hook tape lies on top
    const N2 = 30, aEnd = Math.PI / 4;
    for (let i = 1; i <= N2; i++) { const a = phi - (i / N2) * (phi - aEnd); pts.push([g / 2 + rp * Math.cos(a), yTopC + rp * Math.sin(a)]); }
    const tx = Math.sin(aEnd), ty = -Math.cos(aEnd);
    const e0 = pts[pts.length - 1];
    for (let i = 1; i <= 24; i++) { const d = 0.12 * (i / 24); pts.push([e0[0] + tx * d, e0[1] + ty * d - 0.08 * d * d]); }
    const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const at = (w) => {
      const s = Math.min(Math.abs(w), S[S.length - 1]);
      let i = 1; while (i < S.length - 1 && S[i] < s) i++;
      const f = (s - S[i - 1]) / Math.max(1e-9, S[i] - S[i - 1]);
      const z = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
      return [Math.sign(w || 1) * z, y - yTopC];            // y relative to the rail centre
    };
    return { at, yTopC, zc };
  };
  const secs = {};
  const secAt = (dep) => { const k = Math.round(dep * 2000); if (!secs[k]) secs[k] = section(k / 2000); return secs[k]; };
  const flatY = rp;                                        // strip lying flat on the rail tops
  // where the channel runs into the roll the strip lies flat across the rail tops
  const flatAt = (w) => [w, rp];
  // along the strip: free end a = 0 .. rail ends at a = xr0 .. channel .. roll from a = aRoll
  const xr0 = -0.15, aRoll = 1.2, trans = 0.34;
  const Lr = Math.max(0.6, L - aRoll);
  const pitch = 0.0018 + (tubeFrame ? 0 : 0.0006);
  const core = 0.016;
  const Rout = Math.sqrt(core * core + (pitch * Lr) / Math.PI);
  const yRollC = flatY + Rout + 0.0004;
  const nzn = makeNoise2(31);
  // centreline + cross-section blend per a
  const pos = (w, a) => {
    if (a <= aRoll) {
      const kRoll = 1 - K.sstep(aRoll - trans, aRoll - 0.02, a);
      // the free end flops open a little (no stiffening fold at the cut), the sag breathes along
      // the length
      const dep = dep0 * (1 + 0.1 * Math.sin(a * 4.1 + 0.7) + 0.05 * Math.sin(a * 9.3 + 2.0)) * (1 - 0.18 * Math.max(0, 1 - a / 0.12));
      const sec = secAt(Math.max(0.004, dep));
      const [zt, yt] = sec.at(w);
      const [zf, yf] = flatAt(w);
      const k = kRoll;
      let z = zf + (zt - zf) * k, y = yf + (yt - yf) * k;
      // free end beyond the rails: droops
      if (a < xr0) { const u = 1 - a / xr0; y -= 0.05 * u * u + 0.012 * u * u * (Math.abs(w) / (W / 2)); }
      // tension wrinkles where the channel hangs from the rails, soft ripples along the bottom
      const aw = Math.abs(w) / (W / 2);
      // (only on the free channel: where the strip lies on the rails it must not move, or the rail
      // shows through it)
      const free = 1 - K.sstep(sec.zc * 0.6, sec.zc * 0.92, Math.abs(zt));
      y += 0.0009 * Math.sin(a * 13 + w * 7) * Math.exp(-(((aw - 0.5) / 0.15) ** 2)) * k * free;
      y += 0.0012 * nzn.noise(a * 4 + 1.1, w * 6) * k * free;
      // never inside a rail (the flat / channel blend near the roll cut through them)
      for (const sr of [-1, 1]) {
        const dz = z - sr * g / 2, d = Math.hypot(dz, y);
        if (d < rp && d > 1e-6) { z = sr * g / 2 + (dz / d) * rp; y = (y / d) * rp; }
      }
      return V3(a, yR + y, z);
    }
    // roll: from the bottom of the roll, round and in
    const s = a - aRoll;
    const r = Math.max(core, Math.sqrt(Math.max(core * core, Rout * Rout - (pitch * s) / Math.PI)));
    const psi = -Math.PI / 2 + ((Rout - r) * TAU) / pitch;
    // the thicker taped edges stack: the middle of each turn sags in a little
    const edge = K.sstep(W / 2 - tapeW - 0.006, W / 2 - tapeW + 0.002, Math.abs(w));
    const rr = r - (tubeFrame ? 0 : 0.0012 * (1 - edge)) * K.sstep(0, 0.06, s);
    return V3(aRoll + rr * Math.cos(psi), yR + yRollC + rr * Math.sin(psi), w + 0.0012 * nzn.noise(s * 3, 2.2));
  };
  // sample a: dense on the channel, then the roll
  const As = [];
  for (let a = 0; a < aRoll; a += 0.006) As.push(a);
  const nR = Math.ceil(Lr / 0.004);
  for (let i = 0; i <= nR; i++) As.push(aRoll + (i / nR) * Lr);
  const ws = [];
  const nw = 72;
  for (let j = 0; j <= nw; j++) { const u = j / nw; ws.push((W / 2) * Math.sign(u - 0.5) * Math.pow(Math.abs(2 * u - 1), 0.8)); }
  const rows = ws.map((w) => As.map((a) => pos(w, a)));
  bins.add(cloth, K.gridGeometry(rows, { closedU: false, flip: true }));
  // surface frame at (w, a)
  let faceSign = 1;
  const at = (w, a, lift = 0) => {
    const e = 0.002;
    const p0 = pos(w, a);
    const pa = pos(w, a + e).sub(pos(w, Math.max(0, a - e))), pw = pos(w + e, a).sub(pos(w - e, a));
    const n = V3().crossVectors(pw, pa).normalize().multiplyScalar(faceSign);
    return { p: p0.addScaledVector(n, lift), n };
  };
  // orient the surface frame so that the top face (channel side) is +n
  { const q = at(0, 0.6); faceSign = q.n.y < 0 ? -1 : 1; }
  const along = (w, lift, a0, a1, step = 0.006) => { const pts = [], nrm = []; for (let a = a0; a <= a1; a += step) { const q = at(w, a, lift); pts.push(q.p); nrm.push(q.n); } return { pts, nrm }; };
  const aTapeEnd = aRoll + Math.min(Lr, TAU * Rout * 1.05);
  // a band lying on the cloth (rows across its width from the surface frame), with rounded edges
  const band = (wc, bw, lift, a0, a1, step = 0.005) => {
    const rowsB = [];
    const nW = 6;
    for (let j = 0; j <= nW; j++) {
      const u = j / nW, w = wc - bw / 2 + bw * u;
      const lf = lift * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, Math.max(0, u * 1.2 - 0.1))));
      const row = []; for (let a = a0; a <= a1; a += step) row.push(at(w, a, lf).p);
      rowsB.push(row);
    }
    return K.gridGeometry(rowsB, { closedU: false, flip: true });
  };
  for (const sg of [-1, 1]) {
    const e = sg * W / 2;
    if (!tubeFrame) {
      // hook tape on the top face of the edge flap (over the rail, sticking out) + 2 stitch rows
      const wm = e - sg * (0.004 + tapeW / 2);
      // the tape follows the cloth across its width too (it wraps the rail): a conforming band
      bins.add(hook, band(wm, tapeW, 0.0011, 0.004, aTapeEnd));
      for (const dw of [tapeW / 2 - 0.0028, -(tapeW / 2 - 0.0028)]) {
        const st = along(wm + dw, 0.0026, 0.012, aTapeEnd - 0.01, 0.003);
        bins.add(thr, SG.stitches(st.pts, st.nrm, { len: 0.0034, gap: 0.0016, w: 0.0009, h: 0.0004 }));
      }
    } else {
      // welded double hem: a rolled bead at the edge and the heat-seal 25 mm in
      const hem = along(e - sg * 0.004, 0.0012, 0.002, aTapeEnd, 0.004);
      bins.add(cloth, K.tubeAlong(hem.pts, 0.0034, 10));
      bins.add(cloth, band(e - sg * 0.026, 0.006, 0.0006, 0.006, aTapeEnd));
    }
  }
  // welded end hem across the free end
  {
    const pts = [], nrm = [];
    for (let k = 0; k <= 120; k++) { const w = -W / 2 + 0.003 + (W - 0.006) * (k / 120); const q = at(w, 0.012, 0.0007); pts.push(q.p); nrm.push(q.n); }
    bins.add(cloth, K.strapAlong(pts, 0.022, 0.0012, { normals: nrm }));
    const ed = []; for (let k = 0; k <= 120; k++) { const w = -W / 2 + 0.002 + (W - 0.004) * (k / 120); ed.push(at(w, 0.0016, 0.0002).p); }
    bins.add(cloth, K.tubeAlong(ed, 0.0012, 6));
  }
  // rails: cut ends in front with end caps, running on out of the frame behind the roll
  const railMat = tubeFrame ? L3.galvFine({ tone: '#BEC3C7', cell: 0.003, pre: true }) : SG.aluSG({ tone: '#C6CACE', rough: 0.34 });
  const capMat = SG.moulded('#161616', { rough: 0.5 });
  const xEnd = 4.2;
  for (const sg of [-1, 1]) {
    const z = sg * g / 2;
    const near = G.tube(V3(xr0, yR, z), V3(aRoll + 0.4, yR, z), rho, 40);
    bins.add(railMat, near);
    const far = G.tube(V3(aRoll + 0.4, yR, z), V3(xEnd, yR, z), rho, 40);
    const fm = K.meshOf(far, railMat); fm.userData.noFrame = true; extras.push(fm);
    const cap = K.lathe([[0.0001, 0], [rho + 0.0008, 0], [rho + 0.0012, 0.003], [rho + 0.0008, 0.009], [rho * 0.9, 0.009]], 40);
    cap.rotateZ(Math.PI / 2); cap.translate(xr0 + 0.0005, yR, z); bins.add(capMat, cap);
  }
  // snap clamps on the tube-frame rails: a C-clip round tube + hem, one per 50 cm
  if (tubeFrame) {
    const clip = SG.moulded(light ? '#ECEBE6' : '#3A3C40', { rough: 0.4, spec: 0.5 });
    const Ri = rp + 0.0035, t = 0.0042, h = 0.03, open = 80 * DEG;
    for (const x of [0.22, 0.62, 0.98]) for (const sg of [-1, 1]) {
      // the opening faces down-outwards, the clip round the top of the rail over the gutter
      const c = K.lathe([[Ri, -h / 2], [Ri + t, -h / 2], [Ri + t, h / 2], [Ri, h / 2], [Ri, -h / 2]], 64, 0, TAU - open);
      // lathe axis y -> world x (along the rail); the gap centred at the bottom outside
      c.rotateZ(-Math.PI / 2);
      c.rotateX(sg > 0 ? open / 2 + Math.PI / 4 : open / 2 + 3 * Math.PI / 4);
      c.translate(x, yR, sg * g / 2);
      bins.add(clip, c);
    }
  }
  const grp = new THREE.Group();
  bins.build(grp);
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  extras.forEach((e) => grp.add(e));
  // frame on the channel, the free end and the roll
  grp.add(SG.frameProxy([xr0 - 0.02, yR - dep0 - 0.06, -W / 2 - 0.03], [aRoll + Rout + 0.08, yR + 2 * Rout + 0.04, W / 2 + 0.03]));
  grp.rotation.y = 84 * DEG;
  const root = new THREE.Group(); root.add(grp);
  root.traverse((o) => { if (o.isMesh && o.userData.frameProxy) o.userData.noFrame = false; });
  return {
    object: root,
    detail: { target: [0, yR - 0.03, 0.2], size: 0.4, azimuth: 30, elevation: 26 },
    view: { hero: { elevation: 26, azimuth: 30, fill: 0.84 } },
    // hung at eave height: no floor in the picture, so no floor shadows (they fell as streaks of
    // the rails across the bottom of the frame)
    rig: light
      ? L5.goodsRig({ tone: 'white', size: 0.8, exposure: 0.62, extra: { shoulder: 0.88, overhead: { intensity: 1.4 }, ...NOFLOOR } })
      : L5.goodsRig({ tone: 'black', size: 0.8, extra: NOFLOOR }),
    meta: { L, color, clamps },
  };
}
