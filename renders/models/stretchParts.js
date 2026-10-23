// Onderdelen stretchtent (spare parts for stretch tents), as a tidy flat-lay.
//
// { parts: ['spanband', 'touwenset', 'paalverbinder', 'oogmoeren'] }
//   spanband      35 mm polyester ratchet strap (6 m): the webbing rolled into a flat coil, its
//                 tail through a zinc-plated ratchet (side plates, toothed spindle wheels,
//                 lever with moulded grip, release catch) and a short fixed end with a J-hook
//   touwenset     three-point rope set: three 10 mm braided ropes spliced to a stainless ring,
//                 each ending in an eye splice with a stainless snap hook (carabiner)
//   paalverbinder galvanised pole cap (fits the Ø 80-100 mm pole top) with an M12 threaded
//                 stud and an M12 eye nut on top
//   oogmoeren     four M12 eye nuts
// Round 4 (22 Oct 2026), knolled across the frame when combined:
//   ronde-haring  round galvanised peg Ø 25 mm, `length` (default 1.0 m), beaten head, cone tip,
//                 welded ring flat on the floor
//   haringtrekker lever puller: 40 x 40 powder-coated lever with rubber grip and rocker foot, a
//                 short galvanised chain with grab hook, lying next to a 100 cm round peg
//   paaldop       pole-top cap; `kind: 'rubber'` = heavy ribbed rubber cap (tipped on its side so
//                 the 12 mm wall reads), default moulded PE cap
//   voetplaat     centre-pole foot plate 400 x 400 x 8 mm, welded cup with gussets, peg holes
//   haak          four galvanised S-hooks
//   spanschroef / karabijn / muuroog   RVS 316 shade-sail fixings: open-body hook-eye
//                 turnbuckle M8, 8 mm snap hook with spring gate, screw eye with nylon wall plug
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';
import * as K4 from '../js/partsKit4.js';
import * as L5 from '../js/partsLook5.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function ropeMat(color = '#3A3D41') {
  return K.cached(`rope:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.75, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color('#8a8d91'), normalMap: M.webbing().normalMap, normalScale: new THREE.Vector2(1.4, 1.4), name: `rope ${color}` });
    return m;
  });
}

// eye nut (DIN 582 style): ring on a collar with a threaded bore, axis +Y, base at y = 0
function eyeNutGeo(s = 1) {
  const parts = [];
  parts.push(K.lathe([[0.007 * s, 0], [0.0125 * s, 0], [0.0135 * s, 0.002 * s], [0.012 * s, 0.009 * s], [0.0085 * s, 0.012 * s], [0.007 * s, 0.012 * s]], 32));
  const ring = new THREE.TorusGeometry(0.0145 * s, 0.0045 * s, 14, 40); ring.translate(0, 0.012 * s + 0.0145 * s, 0);
  parts.push(ring);
  return G.merge(parts);
}

// stainless snap hook (carabiner), long axis +X, eye at x = 0, lying flat (plane XZ)
function snapHookGeo() {
  const pts = [];
  const L = 0.07, Wd = 0.026;
  // D-shaped body
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    let x, z;
    if (t < 0.25) { const a = Math.PI + (t / 0.25) * Math.PI / 2; x = 0.012 + Math.cos(a) * 0.012; z = Math.sin(a) * Wd / 2 + 0.0; }
    else if (t < 0.5) { const u = (t - 0.25) / 0.25; x = 0.012 + u * (L - 0.024); z = -Wd / 2; }
    else if (t < 0.75) { const a = -Math.PI / 2 + ((t - 0.5) / 0.25) * Math.PI; x = L - 0.012 + Math.cos(a) * 0.012; z = Math.sin(a) * Wd / 2; }
    else { const u = (t - 0.75) / 0.25; x = L - 0.012 - u * (L - 0.024); z = Wd / 2 * (1 - 0.15 * Math.sin(Math.PI * u)); }
    pts.push(V3(x, 0.004, z));
  }
  const body = K.tubeAlong(pts, 0.0038, 12);
  return body;
}

function ratchetStrap(bins, mats) {
  // the long strap rolled up on its edge (a disc of wound webbing, layers visible on top),
  // its outer end leaves the roll tangentially, twists down flat onto the floor and runs into
  // the ratchet's spindle; the ratchet lies closed (lever folded over the base); the short
  // fixed end loops round the rear cross bar and ends in a J-hook. One continuous strap.
  const w = 0.035, th = 0.0017, turns = 9, r0 = 0.024, pitch = 0.0024;
  const spiral = [], sn = [];
  const nS = turns * 72;
  for (let i = 0; i <= nS; i++) {
    const t = (i / nS) * turns * TAU;
    const r = r0 + (pitch * t) / TAU;
    spiral.push(V3(Math.cos(t) * r, w / 2 + 0.0004, Math.sin(t) * r));
    sn.push(V3(Math.cos(t), 0, Math.sin(t)));
  }
  bins.add(mats.web, K.strapAlong(spiral, w, th, { normals: sn }));
  const rOut = r0 + pitch * turns;
  // ratchet frame (lying on the floor), centred at (rx, *, zc), long axis +X
  const zc = 0.075, rx = rOut + 0.21;
  const xs = rx - 0.03, ys = 0.021;         // spindle
  const xb = rx + 0.048, yb = 0.011;         // rear cross bar
  // long strap: tangential exit (+z), twist to flat, along +x, up onto the spindle drum
  const ctrl = [V3(rOut, w / 2, -0.004), V3(rOut, w / 2, 0.012), V3(rOut + 0.006, w * 0.4, 0.04), V3(rOut + 0.03, 0.006, zc - 0.006), V3(rOut + 0.07, 0.0012, zc), V3(xs - 0.07, 0.0012, zc), V3(xs - 0.04, 0.008, zc), V3(xs - 0.012, ys + 0.012, zc)];
  const tail = K.smoothPath(ctrl, 120);
  const tn = tail.map((q, i) => {
    const a = tail[Math.max(0, i - 1)], b = tail[Math.min(tail.length - 1, i + 1)];
    const T = b.clone().sub(a).normalize();
    // twist: on edge (normal horizontal, away from the roll) -> flat (normal up)
    const k = Math.min(1, Math.max(0, (q.z - 0.004) / (zc - 0.012)));
    const side = V3(1, 0, 0);
    const n = side.clone().multiplyScalar(1 - k * k * (3 - 2 * k)).add(V3(0, 1, 0).multiplyScalar(k * k * (3 - 2 * k)));
    return n.addScaledVector(T, -n.dot(T)).normalize();
  });
  bins.add(mats.web, K.strapAlong(tail, w, th, { normals: tn }));
  // side plates of the base (vertical, along x) with a rounded front end
  const plate = (len, h, r) => { const sh = new THREE.Shape(); sh.moveTo(-len / 2 + r, -h / 2); sh.lineTo(len / 2 - r, -h / 2); sh.absarc(len / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false); sh.lineTo(len / 2, h / 2 - r); sh.absarc(len / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false); sh.lineTo(-len / 2 + h / 2, h / 2); sh.absarc(-len / 2 + h / 2, 0, h / 2, Math.PI / 2, Math.PI * 1.5, false); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.0022, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 1, curveSegments: 14 }); g.translate(0, 0, -0.0011); return g; };
  for (const sz of [-1, 1]) {
    const bp = plate(0.105, 0.026, 0.004); bp.translate(rx, 0.0135, zc + sz * 0.0255); bins.add(mats.steel, bp);
    // toothed spindle wheels just inside the plates
    const gear = new THREE.Shape();
    for (let k = 0; k <= 64; k++) { const a = (k / 64) * TAU; const r = k % 4 < 2 ? 0.0165 : 0.0135; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (k === 0) gear.moveTo(x, y); else gear.lineTo(x, y); }
    const gg = new THREE.ExtrudeGeometry(gear, { depth: 0.0028, bevelEnabled: false }); gg.translate(xs, ys, zc + sz * 0.0215 - 0.0014); bins.add(mats.steel, gg);
    // lever plates folded down over the base, slightly inside
    const lp = plate(0.105, 0.022, 0.004); lp.rotateZ(0.12); lp.translate(rx + 0.022, 0.033, zc + sz * 0.0195); bins.add(mats.steel, lp);
  }
  // spindle + the strap wound on it, cross bars, release catch
  bins.add(mats.steel, G.tube(V3(xs, ys, zc - 0.031), V3(xs, ys, zc + 0.031), 0.0055, 16));
  bins.add(mats.web, G.tube(V3(xs, ys, zc - w / 2), V3(xs, ys, zc + w / 2), 0.0115, 28));
  bins.add(mats.steel, G.tube(V3(xb, yb, zc - 0.028), V3(xb, yb, zc + 0.028), 0.0038, 12));
  bins.add(mats.steel, G.tube(V3(rx + 0.012, 0.004, zc - 0.026), V3(rx + 0.012, 0.004, zc + 0.026), 0.0032, 12));
  const catchG = G.roundedBox(0.026, 0.0022, 0.034, 0.001); catchG.rotateZ(0.12); catchG.translate(rx + 0.03, 0.04, zc); bins.add(mats.steel, catchG);
  // moulded grip over the lever end
  const grip = G.roundedBox(0.04, 0.02, 0.052, 0.008); grip.rotateZ(0.12); grip.translate(rx + 0.076, 0.039, zc); bins.add(mats.grip, grip);
  // short fixed end: wraps round the rear bar (sewn loop), drops to the floor, J-hook at the end
  const loop = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.5 - (i / 24) * Math.PI * 1.25; loop.push(V3(xb + Math.cos(a) * 0.0065, yb + Math.sin(a) * 0.0065, zc)); }
  const fe = K.smoothPath([V3(xb - 0.012, yb + 0.0065, zc), V3(xb, yb + 0.0068, zc), V3(xb + 0.012, yb + 0.002, zc), V3(xb + 0.04, 0.0014, zc + 0.004), V3(xb + 0.1, 0.0012, zc + 0.012), V3(xb + 0.15, 0.0012, zc + 0.014)], 60);
  const feN = fe.map((q, i) => { const a = fe[Math.max(0, i - 1)], b = fe[Math.min(fe.length - 1, i + 1)]; const T = b.clone().sub(a).normalize(); return V3(0, 1, 0).addScaledVector(T, -T.y).normalize(); });
  bins.add(mats.web, K.strapAlong(fe, w * 0.94, th, { normals: feN }));
  // sewn end: a stitched box near the hook (darker double layer)
  const he = fe[fe.length - 1];
  const sew = G.roundedBox(0.045, 0.0016, w * 0.95, 0.0006); sew.translate(he.x - 0.03, 0.0028, he.z); bins.add(mats.web, sew);
  // J-hook: flat strap eye + bent hook, plastic dipped
  const hk = [];
  for (let i = 0; i <= 10; i++) hk.push(V3(he.x - 0.004 + i * 0.004, 0.006, he.z));
  for (let i = 1; i <= 26; i++) { const a = -Math.PI / 2 + (i / 26) * Math.PI * 1.2; hk.push(V3(he.x + 0.05 + Math.cos(a) * 0.017, 0.006, he.z + 0.017 + Math.sin(a) * 0.017)); }
  bins.add(mats.steel, K.tubeAlong(hk, 0.0046, 12));
  bins.add(mats.grip, K.tubeAlong(hk.slice(13), 0.0054, 12));
  return { rx };
}

export function stretchParts(p = {}) {
  let parts = p.parts || ['spanband', 'touwenset', 'paalverbinder'];
  if (typeof parts === 'string') parts = [parts];
  const mats = { web: M.webbing('#1E2023'), steel: SG.zincSG(), grip: SG.moulded('#B8261D', { rough: 0.42, spec: 0.55 }), ss: SG.aluSG({ tone: '#D3D6D9', rough: 0.2 }), galv: L3.galvFine({ cell: 0.0035 }), rope: ropeMat('#3A3D41') };
  const bins = new G.PartBin();
  const place = (sub, m) => { for (const [mat, list] of sub.bins) for (const g of list) { g.applyMatrix4(m); bins.add(mat, g); } };
  if (parts.includes('spanband')) {
    const sub = new G.PartBin();
    ratchetStrap(sub, mats);
    place(sub, new THREE.Matrix4().makeRotationY(-14 * DEG).setPosition(-0.32, 0, 0.08));
  }
  if (parts.includes('touwenset')) {
    const sub = new G.PartBin();
    // Round 5: three 10 mm 3-strand ropes, each ONE continuous rope: its tail lies alongside the
    // standing part at the ring, the eye goes round the ring wire (the ring rests on the three
    // eyes), the rope runs out to a stainless DIN 5299 carabiner with a spring gate (K4.snapHook,
    // no more open J-hooks), round the carabiner's eye and back alongside itself; both tail ends
    // sit inside a black heat-shrink sleeve that binds tail and standing part (no open rope ends).
    const rope = L3.ropeMat('#2A2C2F');
    const sleeveM = SG.moulded('#141516', { rough: 0.5, spec: 0.5 });
    const rr = 0.005, wr = 0.0046, RR = 0.032;
    const yc = wr + 2 * rr - 0.0006;           // ring wire centre: resting on the rope eyes
    const ringC = V3(0, yc, 0);
    const ring = new THREE.TorusGeometry(RR, wr, 16, 64); ring.rotateX(Math.PI / 2); ring.translate(0, yc, 0); sub.add(mats.ss, ring);
    // flattened capsule along a floor line from A to B (black heat-shrink over tail + standing part)
    const sleeve = (A, B, w, sd) => {
      const L = A.distanceTo(B);
      const g = K.lathe([[0.0001, 0], [w * 0.75, 0.001], [w, 0.0045], [w, L - 0.0045], [w * 0.75, L - 0.001], [0.0001, L]], 28);
      g.scale(1, 1, (rr * 1.12) / w);
      const d = B.clone().sub(A).normalize();
      // lathe: x across (sd), y along (d), z up (squashed); sd x d = up (right-handed)
      g.applyMatrix4(new THREE.Matrix4().makeBasis(sd, d, V3().crossVectors(sd, d)).setPosition(A));
      return g;
    };
    [-38, 0, 38].forEach((ang, i) => {
      const a = (ang - 90) * DEG;
      const d = V3(Math.cos(a), 0, Math.sin(a)), up = V3(0, 1, 0);
      const sd = V3(-d.z, 0, d.x);
      const Lr = 0.42 + (i === 1 ? 0.04 : 0);
      const Pr = ringC.clone().addScaledVector(d, RR);           // ring wire where the eye wraps it
      const R0 = wr + rr;
      const yb = rr;
      const oT = 1.75 * rr, oS = -0.35 * rr;                     // sideways offsets: tail, standing part
      const tail = 0.075;
      const pts = [];
      // ring end: tail on the floor beside the standing part, in under the wire, up inside the
      // ring, over the top, down the outside
      for (let k = 0; k <= 14; k++) pts.push(Pr.clone().addScaledVector(d, R0 + tail * (1 - k / 14)).addScaledVector(sd, oT).setY(yb));
      for (let k = 1; k <= 30; k++) {
        const t = k / 30, ph = -Math.PI / 2 - t * Math.PI * 1.5;
        pts.push(Pr.clone().addScaledVector(d, Math.cos(ph) * R0).addScaledVector(up, Math.sin(ph) * R0).addScaledVector(sd, oT + (oS - oT) * K.sstep(0, 1, t)));
      }
      // standing part: down to the floor and out to the carabiner with a gentle lie
      const out0 = pts[pts.length - 1];
      const hookE = ringC.clone().addScaledVector(d, Lr).setY(0);
      const hwr = 0.0035, hy = hwr + 2 * rr - 0.0006, R1 = hwr + rr;
      const Ph = hookE.clone().setY(hy);
      const ctrl = [out0, Pr.clone().addScaledVector(d, R0 + 0.035).addScaledVector(sd, oS).setY(yb),
        ringC.clone().addScaledVector(d, Lr * 0.45).addScaledVector(sd, oS + (i - 1) * 0.008 + 0.005).setY(yb),
        ringC.clone().addScaledVector(d, Lr * 0.75).addScaledVector(sd, oS - 0.006).setY(yb),
        Ph.clone().addScaledVector(d, -tail - 0.02).addScaledVector(sd, oS).setY(yb),
        Ph.clone().addScaledVector(d, -0.012).addScaledVector(sd, oS).setY(yb)];
      pts.push(...K.smoothPath(ctrl, 110).slice(1));
      // carabiner end: under the eye wire, up inside the eye, over the top, down and back as the tail
      for (let k = 0; k <= 30; k++) {
        const t = k / 30, ph = -Math.PI / 2 + t * Math.PI * 1.62;
        pts.push(Ph.clone().addScaledVector(d, Math.cos(ph) * R1).addScaledVector(up, Math.sin(ph) * R1).addScaledVector(sd, oS + (oT - oS) * K.sstep(0, 1, t)));
      }
      const t0 = pts[pts.length - 1];
      for (let k = 1; k <= 14; k++) pts.push(Ph.clone().addScaledVector(d, -R1 - 0.01 - tail * (k / 14)).addScaledVector(sd, oT).setY(yb + (t0.y - yb) * Math.max(0, 1 - k / 3)));
      sub.add(rope, L3.ropeGeo(K.smoothPath(pts, 560), rr, { phase: i * 1.3, up: V3(0, 1, 0) }));
      // sleeves over both tail ends
      const mid = (oT + oS) / 2;
      const ringTailEnd = Pr.clone().addScaledVector(d, R0 + tail).addScaledVector(sd, mid).setY(yb);
      sub.add(sleeveM, sleeve(ringTailEnd.clone().addScaledVector(d, 0.006), ringTailEnd.clone().addScaledVector(d, -0.026), rr * 2.2, sd.clone().negate()));
      const hookTailEnd = Ph.clone().addScaledVector(d, -R1 - 0.01 - tail).addScaledVector(sd, mid).setY(yb);
      sub.add(sleeveM, sleeve(hookTailEnd.clone().addScaledVector(d, -0.006), hookTailEnd.clone().addScaledVector(d, 0.026), rr * 2.2, sd));
      // the carabiner (DIN 5299 with spring gate): eye wire at Ph, resting on the rope eye, nose
      // tipped down onto the floor
      const hk = new G.PartBin();
      K4.snapHook(hk, { metal: mats.ss }, { L: 0.09, d: 2 * hwr });
      const tilt = Math.atan2(hy - hwr, 0.085);
      const Mh = new THREE.Matrix4().makeBasis(d, up, V3().crossVectors(d, up)).multiply(new THREE.Matrix4().makeRotationZ(-tilt));
      Mh.setPosition(Ph.x, hy - hwr, Ph.z);
      for (const [m, list] of hk.bins) for (const g of list) { g.applyMatrix4(Mh); sub.add(m, g); }
    });
    place(sub, new THREE.Matrix4().makeRotationY(28 * DEG).setPosition(0.12, 0, 0.12));
  }
  if (parts.includes('paalverbinder')) {
    const sub = new G.PartBin();
    // pole cap: cup Ø 104 mm, 60 mm deep, standing on its rim (opening down), stud + eye nut on top
    sub.add(mats.galv, K.lathe([[0.049, 0], [0.052, 0], [0.052, 0.06], [0.046, 0.066], [0.012, 0.066], [0.012, 0.062], [0.045, 0.06], [0.049, 0.003]].reverse(), 64));
    sub.add(mats.galv, K.lathe([[0.0001, 0.066], [0.016, 0.066], [0.0175, 0.069], [0.0001, 0.069]].reverse(), 32));
    // welded stud with thread
    const stud = G.tube(V3(0, 0.066, 0), V3(0, 0.13, 0), 0.006, 16); sub.add(mats.steel, stud);
    for (let k = 0; k < 18; k++) { const t = new THREE.TorusGeometry(0.006, 0.0006, 4, 16); t.rotateX(Math.PI / 2); t.translate(0, 0.072 + k * 0.00175 * 1.8, 0); sub.add(mats.steel, t); }
    const en = eyeNutGeo(1.15); en.translate(0, 0.098, 0); sub.add(mats.galv, en);
    // four bolt holes round the cup wall (screws into the pole)
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.4; const h = G.tube(V3(Math.cos(a) * 0.0515, 0.03, Math.sin(a) * 0.0515), V3(Math.cos(a) * 0.0535, 0.03, Math.sin(a) * 0.0535), 0.0035, 10); sub.add(SG.rubberSG('#0E0E0E'), h); }
    place(sub, new THREE.Matrix4().makeRotationY(0).setPosition(0.3, 0, 0.26));
  }
  if (parts.includes('oogmoeren')) {
    // four eye nuts standing on their collars in a tidy 2 x 2, rings turned a little apart
    const solo = parts.length === 1;
    for (let i = 0; i < 4; i++) {
      const en = eyeNutGeo(1.15); en.rotateY((34 + 90 + [0, 14, -10, 22][i]) * DEG);
      const cx = (i % 2 ? 0.024 : -0.024) + (solo ? 0 : 0.0), cz = (i < 2 ? -0.024 : 0.024) + (solo ? 0 : 0.3);
      en.translate(cx, 0, cz); bins.add(mats.galv, en);
      // threaded bore visible in the collar from above (dark)
      bins.add(SG.rubberSG('#0C0C0C'), G.tube(V3(cx, 0.0005, cz), V3(cx, 0.0016, cz), 0.0058, 18));
    }
  }
  // ---- round 4 (22 Oct): the rest of the stretch-tent spare parts + the shade-sail fixing set.
  // Knolled along the camera axes (hero azimuth 34 deg): each part's long axis runs across the
  // frame, parts stacked front to back.
  const NEW = ['ronde-haring', 'haringtrekker', 'paaldop', 'voetplaat', 'haak', 'spanschroef', 'karabijn', 'muuroog'];
  const newParts = parts.filter((x) => NEW.includes(x));
  const view = { hero: { elevation: 34 } };
  if (newParts.length) {
    const ss = SG.aluSG({ tone: '#D5D8DB', rough: 0.18 });
    const galv = L3.galvFine({ cell: 0.0035 });
    const across = 34; // yaw that lays local +X across the hero frame (camera right)
    let zRow = 0;
    const rows = [];
    for (const name of newParts) {
      const sub = new G.PartBin();
      let yaw = across, gap = 0.03;
      if (name === 'ronde-haring') {
        const L = Number(p.length ?? 1.0);
        K4.roundPeg(sub, { metal: galv }, { L, D: 0.025, R: 0.034, rw: 0.0055, seed: 5 });
        yaw = -31; view.hero = { elevation: 30 };
      } else if (name === 'haringtrekker') {
        // lever (40 x 40 square tube, powder coated) with a rubber grip, a welded rocker foot near
        // the working end and a short galvanised chain with a grab hook that loops round the peg;
        // lying on its side next to a 100 cm round peg
        const red = SG.powderSG('#9C1F17', { rough: 0.42 });
        const Ll = 1.25, s = 0.04;
        const lev = G.roundedBox(Ll, s, s, 0.004, 2); lev.translate(Ll / 2, s / 2, 0); sub.add(red, lev);
        for (const x of [0.0, Ll]) { const cap = G.roundedBox(0.004, s - 0.004, s - 0.004, 0.0015); cap.translate(x, s / 2, 0); sub.add(SG.rubberSG('#121212'), cap); }
        const grip = K.lathe([[0.0001, 0], [0.0305, 0], [0.0315, 0.004], [0.0315, 0.2], [0.0295, 0.205], [0.0001, 0.205]], 32); grip.rotateZ(-Math.PI / 2); grip.translate(Ll - 0.2, s / 2 + 0.001, 0);
        for (let k = 0; k < 14; k++) { const t = new THREE.TorusGeometry(0.0317, 0.0011, 6, 28); t.rotateY(Math.PI / 2); t.translate(Ll - 0.19 + k * 0.013, s / 2 + 0.001, 0); sub.add(SG.rubberSG('#151515'), t); }
        sub.add(SG.rubberSG('#151515', { rough: 0.78 }), grip);
        // rocker foot: a welded frame of 10 mm plate in the lever's plane (flat on the floor now):
        // a curved runner joined to the lever by two legs, with a lightening cut-out
        const rk = new THREE.Shape();
        rk.moveTo(0.05, 0); rk.lineTo(0.31, 0); rk.absarc(0.18, 0.02, 0.135, -0.15, Math.PI + 0.15, true); rk.lineTo(0.05, 0);
        const cut = new THREE.Path(); cut.moveTo(0.09, -0.016); cut.lineTo(0.27, -0.016); cut.absarc(0.18, 0.02, 0.108, -0.33, Math.PI + 0.33, true); cut.lineTo(0.09, -0.016); rk.holes.push(cut);
        const rkG = new THREE.ExtrudeGeometry(rk, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1, curveSegments: 40 });
        // shape y -> -z (the runner lies out on the +z side of the lever), extrusion -> up
        rkG.rotateX(-Math.PI / 2); rkG.translate(0, 0.001, s / 2 - 0.0005);
        sub.add(red, rkG);
        // chain from an eye at the lever's working end, grab hook at its end
        const eye = new THREE.TorusGeometry(0.014, 0.004, 12, 32); eye.rotateX(Math.PI / 2); eye.translate(-0.012, 0.004, 0); sub.add(galv, eye);
        K4.chain(sub, galv, [V3(-0.025, 0, 0.0), V3(-0.09, 0, 0.03), V3(-0.14, 0, 0.11), V3(-0.12, 0, 0.19), V3(-0.05, 0, 0.225)], { d: 0.008, link: 0.042 });
        const hk = K4.planarPath([['line', 0.03], ['arc', 0.02, 200], ['line', 0.012]], { y: 0.006, step: 0.0015, start: V3(-0.045, 0, 0.232), heading: 8 });
        sub.add(galv, K4.bar(hk, 0.006, 14));
        // the round peg it pulls, lying alongside
        const pegBin = new G.PartBin();
        K4.roundPeg(pegBin, { metal: galv }, { L: 1.0, D: 0.025, R: 0.034, rw: 0.0055, seed: 8 });
        for (const [mat, list] of pegBin.bins) for (const g of list) { g.translate(0.05, 0, 0.26); sub.add(mat, g); }
        yaw = -31; view.hero = { elevation: 32 };
      } else if (name === 'paaldop') {
        const rubber = String(p.kind || '').startsWith('rub');
        if (rubber) {
          // heavy rubber cap for a centre pole: Ø 125, 75 high, 12 mm wall, grip ribs, raised boss
          const m = SG.rubberSG('#141414', { rough: 0.72 });
          const Ro = 0.0625, H = 0.075, w = 0.012;
          const prof = [[Ro - w, 0], [Ro - 0.002, 0], [Ro, 0.003], [Ro, H - 0.022]];
          for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; prof.push([Ro - 0.022 + Math.cos(a) * 0.022, H - 0.022 + Math.sin(a) * 0.022]); }
          prof.push([0.019, H], [0.0165, H + 0.008], [0.0085, H + 0.008], [0.0075, H - 0.004], [0.0075, H - 0.016], [Ro - w - 0.012, H - 0.016]);
          for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 - (i / 6) * Math.PI / 2; prof.push([Ro - w - 0.012 + Math.cos(a) * 0.012, H - 0.028 + Math.sin(a) * 0.012]); }
          prof.push([Ro - w, 0.002], [Ro - w, 0]);
          sub.add(m, K.lathe(prof.reverse(), 72));
          // moulded reinforcing bead round the skirt
          { const t = new THREE.TorusGeometry(Ro + 0.0004, 0.0022, 10, 72); t.rotateX(Math.PI / 2); t.translate(0, 0.006, 0); sub.add(m, t); }
          // tipped over onto its side, opening towards the camera's left: the thick wall reads
          const geos = []; for (const [, l] of sub.bins) geos.push(...l);
          for (const g of geos) { g.rotateX(-Math.PI / 2 - 0.12); }
          yaw = -10;
        } else {
          // moulded PE cap: Ø 104, 62 high, 3.5 mm wall, a full rounded crown, bolt hole in the top
          const m = SG.moulded('#181818', { rough: 0.4, spec: 0.5 });
          const Ro = 0.052, H = 0.062, w = 0.0035, rc = 0.03;
          const prof = [[Ro - w, 0], [Ro - 0.0008, 0], [Ro, 0.0012], [Ro, H - rc]];
          for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; prof.push([Ro - rc + Math.cos(a) * rc, H - rc + Math.sin(a) * rc]); }
          prof.push([0.0105, H], [0.0085, H - 0.0015], [0.0075, H - w]);
          for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 - (i / 12) * Math.PI / 2; prof.push([Math.max(0.0075, Ro - rc + Math.cos(a) * (rc - w)), H - rc + Math.sin(a) * (rc - w)]); }
          prof.push([Ro - w, 0.001], [Ro - w, 0]);
          sub.add(m, K.lathe(prof.reverse(), 80));
          yaw = 0;
        }
        view.hero = { elevation: 30 };
      } else if (name === 'voetplaat') {
        // 400 x 400 x 8 mm plate, welded cup (Ø 133 x 60) with four gussets, four peg holes
        const S = 0.4, T = 0.008;
        const sh = new THREE.Shape(G.roundedRectProfile(S, S, 0.025, 6).map((q) => new THREE.Vector2(q.x, q.y)));
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const h = new THREE.Path(); h.absarc(sx * 0.155, sz * 0.155, 0.011, 0, TAU, true); sh.holes.push(h); }
        { const h = new THREE.Path(); h.absarc(0, 0, 0.012, 0, TAU, true); sh.holes.push(h); }
        sub.add(galv, K.extrudeY(sh, T, { y0: 0, bevel: 0.001, bevelSegs: 1, curveSegs: 24 }));
        const Rc = 0.0665, wc = 0.005, Hc = 0.06;
        sub.add(galv, K.lathe([[Rc - wc, T + 0.0005], [Rc - wc, T + Hc - 0.001], [Rc - wc + 0.001, T + Hc], [Rc - 0.001, T + Hc], [Rc, T + Hc - 0.001], [Rc, T]], 72));
        // fillet welds round the cup
        for (const [rr, yy, nn] of [[Rc + 0.001, T + 0.001, 1]]) {
          const pts = [], nrm = [];
          for (let k = 0; k <= 72; k++) { const a = (k / 72) * TAU; pts.push(V3(Math.cos(a) * rr, yy, Math.sin(a) * rr)); nrm.push(V3(Math.cos(a), 1, Math.sin(a)).normalize()); }
          sub.add(galv, K.sweep(pts, K.circle(0.0028, 10).map(([a, b]) => [a, b * 0.75]), { normals: nrm, closed: true }));
        }
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * TAU + Math.PI / 4;
          const gs = new THREE.Shape(); gs.moveTo(0, 0); gs.lineTo(0.07, 0); gs.lineTo(0.0, 0.045); gs.lineTo(0, 0);
          const gg = new THREE.ExtrudeGeometry(gs, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1 });
          gg.translate(0, 0, -0.003);
          const d = V3(Math.cos(a), 0, Math.sin(a));
          gg.applyMatrix4(new THREE.Matrix4().makeBasis(d, V3(0, 1, 0), V3().crossVectors(d, V3(0, 1, 0))).setPosition(d.clone().multiplyScalar(Rc - 0.001).setY(T)));
          sub.add(galv, gg);
        }
        yaw = 12; view.hero = { elevation: 30 };
      } else if (name === 'haak') {
        // four galvanised S-hooks (10 mm bar, 12 cm) side by side, long axis towards the camera,
        // alternately mirrored, spaced by their measured width (round 4 ran them through each other)
        let x = 0; const hooks = [];
        for (let k = 0; k < 4; k++) {
          const g = K4.sHook(0.01, 0.12, { open: 26 });
          g.computeBoundingBox();
          const bb = g.boundingBox;
          if (bb.max.x - bb.min.x > bb.max.z - bb.min.z) g.rotateY(Math.PI / 2);
          if (k % 2) g.rotateY(Math.PI);
          g.computeBoundingBox();
          const w = g.boundingBox.max.x - g.boundingBox.min.x;
          g.translate(x - g.boundingBox.min.x, 0, (k % 2) * 0.008);
          x += w + 0.022;
          hooks.push(g);
        }
        for (const g of hooks) { g.translate(-(x - 0.022) / 2, 0, 0); sub.add(galv, g); }
        yaw = across; view.hero = { elevation: 52 };
      } else if (name === 'spanschroef') {
        K4.turnbuckle(sub, { metal: ss }, { M: 0.008, body: 0.11 });
        yaw = across;
      } else if (name === 'karabijn') {
        K4.snapHook(sub, { metal: ss }, { L: 0.08, d: 0.008 });
        yaw = across;
      } else if (name === 'muuroog') {
        K4.eyeBolt(sub, { metal: ss }, { R: 0.011, d: 0.0075, shank: 0.06, thread: 0.008, screw: true });
        const plug = new G.PartBin();
        K4.wallPlug(plug, SG.moulded('#C8C3B6', { rough: 0.5 }), { D: 0.01, L: 0.05 });
        for (const [mat, list] of plug.bins) for (const g of list) { g.translate(0.012, 0, 0.032); sub.add(mat, g); }
        yaw = across;
      }
      rows.push({ sub, yaw, name });
    }
    // stack rows front to back along the camera's depth axis
    const fwd = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
    const depth = [];
    for (const r of rows) {
      const tmp = new G.PartBin();
      const box = K4.placeBin(tmp, r.sub, { yaw: r.yaw });
      depth.push({ tmp, box });
    }
    // depth of each row measured along fwd
    // extent of each row along the camera's depth axis, from its vertices (a long part lying
    // across the frame has a big axis-aligned box but is shallow in depth)
    const ext = depth.map(({ tmp }) => {
      let lo = Infinity, hi = -Infinity;
      for (const [, list] of tmp.bins) for (const g of list) { const pa = g.attributes.position; for (let i = 0; i < pa.count; i += 3) { const d = pa.getX(i) * fwd.x + pa.getZ(i) * fwd.z; if (d < lo) lo = d; if (d > hi) hi = d; } }
      return [lo, hi];
    });
    const gap = 0.03;
    const total = ext.reduce((a, [lo, hi]) => a + (hi - lo), 0) + gap * (rows.length - 1);
    let cur = -total / 2;
    depth.forEach(({ tmp }, i) => {
      const [lo, hi] = ext[i];
      const off = fwd.clone().multiplyScalar(cur - lo);
      for (const [mat, list] of tmp.bins) for (const g of list) { g.translate(off.x, 0, off.z); bins.add(mat, g); }
      cur += hi - lo + gap;
    });
    if (newParts.length > 1) view.hero = { elevation: 36 };
  }
  const g = K.finish(bins, 'stretchParts');
  return {
    object: g,
    detail: { target: [-0.1, 0.02, 0.08], size: 0.25, azimuth: 30, elevation: 35 },
    view,
    rig: L5.flatLayRig(),
    meta: { parts },
  };
}
