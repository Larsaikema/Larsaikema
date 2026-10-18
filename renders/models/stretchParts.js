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
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';

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
    // three 10 mm 3-strand twisted ropes, each with an eye splice round the stainless ring and
    // an eye splice through the eye of a stainless snap hook; laid out as a fan
    const rope = L3.ropeMat('#2A2C2F');
    const rr = 0.005;
    const ringC = V3(0, 0.0046, 0), RR = 0.032;
    const ring = new THREE.TorusGeometry(RR, 0.0046, 16, 56); ring.rotateX(Math.PI / 2); ring.translate(ringC.x, ringC.y, ringC.z); sub.add(mats.ss, ring);
    // eye splice: the rope comes in along `dir` to the eye point, wraps round a bar (centre c,
    // radius rb, in the floor plane) and runs back alongside itself for `tail` m, tapering
    const eyeSplice = (eye, dir, rb, tail, seed) => {
      const side = V3(-dir.z, 0, dir.x);
      const pts = [];
      const c = eye.clone().addScaledVector(dir, rb + rr);
      for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; pts.push(c.clone().addScaledVector(dir, Math.cos(a) * (rb + rr) * -1).addScaledVector(side, Math.sin(a) * (rb + rr)).setY(rr)); }
      const back = pts[pts.length - 1];
      for (let k = 1; k <= 12; k++) pts.push(back.clone().addScaledVector(dir, -tail * (k / 12)).addScaledVector(side, -rr * 1.6 * Math.min(1, k / 3)).setY(rr + 0.003 * Math.min(1, k / 4)));
      return pts;
    };
    [-36, 0, 36].forEach((ang, i) => {
      const a = (ang - 90) * DEG; // fan towards -z (back)
      const d = V3(Math.cos(a), 0, Math.sin(a));
      const side = V3(-d.z, 0, d.x);
      const L = 0.4 + (i === 1 ? 0.05 : 0);
      const start = ringC.clone().addScaledVector(d, RR).setY(rr);
      const end = ringC.clone().addScaledVector(d, L).setY(rr);
      // main rope with a gentle lie (not ruler-straight)
      const ctrl = [start.clone().addScaledVector(d, 0.03), ringC.clone().addScaledVector(d, L * 0.35).addScaledVector(side, (i - 1) * 0.012 + 0.008).setY(rr), ringC.clone().addScaledVector(d, L * 0.7).addScaledVector(side, -0.01).setY(rr), end.clone().addScaledVector(d, -0.06)];
      const main = K.smoothPath(ctrl, 80);
      sub.add(rope, L3.ropeGeo(main, rr, { phase: i * 1.3, up: V3(0, 1, 0) }));
      // splice round the ring and round the snap hook's eye
      const sp1 = eyeSplice(start.clone().addScaledVector(d, 0.0), d.clone().negate(), 0.0046, 0.07, i);
      sub.add(rope, L3.ropeGeo(K.smoothPath([main[0], ...sp1.slice().reverse().map((q) => q)].reverse(), 60), rr * 0.97, { phase: i * 0.7 + 0.4, up: V3(0, 1, 0) }));
      const sp2 = eyeSplice(end.clone().addScaledVector(d, -0.004), d, 0.0045, 0.075, i + 7);
      sub.add(rope, L3.ropeGeo(K.smoothPath([main[main.length - 1], ...sp2], 60), rr * 0.97, { phase: i * 0.9 + 1.1, up: V3(0, 1, 0) }));
      // whipping where the tails end
      for (const sp of [sp1, sp2]) { const q = sp[sp.length - 1], qq = sp[sp.length - 3]; const T = q.clone().sub(qq).normalize(); sub.add(L3.ropeMat('#141516'), G.tube(q.clone().addScaledVector(T, -0.012), q.clone().addScaledVector(T, 0.004), rr * 1.55, 16)); }
      // snap hook: its eye where the splice turns
      const hk = snapHookGeo();
      hk.applyMatrix4(new THREE.Matrix4().makeBasis(d, V3(0, 1, 0), V3().crossVectors(d, V3(0, 1, 0))).setPosition(end.clone().addScaledVector(d, 0.006).setY(0)));
      sub.add(mats.ss, hk);
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
  const g = K.finish(bins, 'stretchParts');
  return {
    object: g,
    detail: { target: [-0.1, 0.02, 0.08], size: 0.25, azimuth: 30, elevation: 35 },
    view: { hero: { elevation: 34 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.005, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { parts },
  };
}
