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
  if (p.clamps) return tubeFrameGutter({ L, width: Number(p.width ?? 0.35), cloth, light, thr, tubeD: Number(p.clamps) / 1000, color });
  if (p.mounted) return mountedGutter({ L, width: Math.min(width, 0.36), cloth, velcroMat: hook, eave: Number(p.eave ?? 2.14), gap: Number(p.gap ?? 0.1) });
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
