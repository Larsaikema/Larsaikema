// Prikkabel (festoon cable) with E27 prick sockets and LED lamps.
//
// prikkabel { bulbs, spacing, sag, on, cable, lamp, lamps, plug, endCap, frame, hangEvery }
//   bulbs     number of sockets (10)            spacing  m between sockets along the cable (1.0)
//   sag       swag depth as a fraction of the swag length / 2 (0.25 -> ~0.37 m on a 3 m swag)
//   on        lamps lit (true)                   cable    'zwart' | 'wit'
//   lamp      'filament' (clear G45, LED filaments) | 'opal' | 'colour' (cycles rood/oranje/geel/groen/blauw)
//   lamps     false: sockets only                plug     Schuko-style rubber plug on the lead (true)
//   frame     how many metres of cable (from the plug end) the camera frames (default ~2 swags)
//
// Construction: flat 2-core rubber cable (H05RN-F 2 x 1.5 mm2, 12 x 6.4 mm) hung in swags from
// the moulded eye of every 2nd-5th socket (about every 2.5-3 m), so the run reads as a real
// festoon: it hangs in catenary-like swags with a small kink at each socket (the point load).
// Each socket is a two-part rubber clamp head around the cable (lid, cross-head screw, eye) on a
// sleeve with four sealing ribs and a soft lip that hugs the lamp's neck; it tilts with the
// cable. Lamps are G45 (45 mm globe) on a real helical E27 thread. The run recedes from the
// near end (front right, plug lead hanging down) to the back left; the camera frames the first
// swags and lets the rest of the cable continue into the distance, as a festoon is photographed.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;

const rubberPlug = (add, rub, pin) => L.rubberPlug(add, rub, pin);


export function prikkabel(p = {}) {
  const n = Math.max(1, Math.round(Number(p.bulbs ?? 10)));
  const sp = Number(p.spacing ?? 1.0);
  const on = p.on !== false;
  const white = /wit|white/i.test(String(p.cable || p.color || ''));
  const lamps = p.lamps !== false;
  const lampKind = String(p.lamp || 'filament').toLowerCase();
  const rub = white ? L.cableRubber('#E9E8E3', 0.52) : L.cableRubber('#161616', 0.58);
  const pinMat = L.e27Mats().nickel;
  const per = Math.max(1, Math.round(Number(p.hangEvery ?? Math.max(2, Math.round(2.6 / sp)))));
  const sagF = Number(p.sag ?? 0.25);
  const Y0 = 2.4;
  const lead = 0.06;                       // cable beyond the first / last socket inside the run

  // --- the run: hanging sockets (indices) and swags between them --------------------------
  const hang = []; for (let i = 0; i < n; i += per) hang.push(i); if (hang[hang.length - 1] !== n - 1) hang.push(n - 1);
  // 2D profile (x along the run, y up): parabola per swag, cable length conserved
  const prof = []; // { s (arc length from socket 0), x, y }
  let x0 = 0;
  const sock2d = new Array(n);
  for (let h = 0; h < hang.length - 1; h++) {
    const i0 = hang[h], i1 = hang[h + 1];
    const Lc = (i1 - i0) * sp;
    const D = Math.min(Lc * 0.42, sagF * 0.6 * Lc);
    const c = (Lc + Math.sqrt(Math.max(0, Lc * Lc - (32 * D * D) / 3))) / 2;
    // sample the parabola densely, then place sockets by arc length
    const pts = []; const N = 400;
    for (let k = 0; k <= N; k++) { const t = k / N; pts.push(V3(x0 + c * t, Y0 - 4 * D * t * (1 - t), 0)); }
    const len = L.polyLength(pts);
    for (let i = i0; i <= i1; i++) {
      const s = ((i - i0) / Math.max(1, i1 - i0)) * len;
      const a = L.atLength(pts, s);
      sock2d[i] = { x: a.p.x, y: a.p.y, tx: a.t.x, ty: a.t.y, hang: i === i0 || i === i1 };
    }
    for (const q of pts) prof.push(q);
    x0 += c;
  }
  if (n === 1) sock2d[0] = { x: 0, y: Y0, tx: 1, ty: 0, hang: true };

  // run direction in the world: recedes to the back left as seen from the hero camera
  const runAz = (p.runAz ?? 233) * DEG;          // direction of travel (world yaw, 180 = -Z)
  const u = V3(Math.sin(runAz), 0, Math.cos(runAz)).normalize();
  const side = V3().crossVectors(V3(0, 1, 0), u).normalize();
  const zf = (x) => 0.035 * Math.sin((x / sp) * 1.7 + 0.4) * G.smoothstep(0, sp * 0.6, x);
  const W = (x, y, z = 0) => V3(0, 0, 0).addScaledVector(u, x).addScaledVector(side, z).setY(y);

  // sockets in 3D (tilted with the cable; hanging sockets level)
  const sockets = sock2d.map((s, i) => {
    let tx = s.tx, ty = s.ty;
    if (s.hang) { tx = 1; ty = 0; }
    const tl = Math.hypot(tx, ty);
    tx /= tl; ty /= tl;
    // a very slight lateral wander so the run is not ruler-straight
    const z = zf(s.x);
    return { i, p: W(s.x, s.y, z), dir: V3().addScaledVector(u, tx).setY(ty).normalize(), hang: s.hang };
  });

  // --- cable path: profile points, straightened through each socket head -----------------
  const path = [];
  const sOf = []; // arc position of every socket along the run (for framing)
  const headHalf = 0.024;
  // build from the profile, skipping samples within a socket head
  const profW = prof.map((q) => ({ x: q.x, y: q.y }));
  let si = 0;
  const xs = sock2d.map((s) => s.x);
  for (let k = 0; k < profW.length; k++) {
    const q = profW[k];
    // insert sockets passed
    while (si < n && xs[si] <= q.x + 1e-9) {
      const S = sockets[si];
      const a = S.p.clone().addScaledVector(S.dir, -headHalf), b = S.p.clone().addScaledVector(S.dir, headHalf);
      path.push(a, S.p.clone(), b);
      si++;
    }
    // skip samples close to a socket
    let near = false;
    for (let j = Math.max(0, si - 1); j <= Math.min(n - 1, si); j++) if (Math.abs(q.x - xs[j]) < headHalf * 1.6) near = true;
    if (!near) {
      path.push(W(q.x, q.y, zf(q.x)));
    }
  }
  while (si < n) { const S = sockets[si]; path.push(S.p.clone().addScaledVector(S.dir, -headHalf), S.p.clone(), S.p.clone().addScaledVector(S.dir, headHalf)); si++; }
  // de-duplicate / order by projection on u (all points are monotonic in x)
  path.sort((a, b) => a.dot(u) - b.dot(u));
  const clean = [path[0]];
  for (const q of path) if (q.distanceTo(clean[clean.length - 1]) > 0.004) clean.push(q);

  // lead at the plug end: leaves the first socket towards the camera and hangs down to the plug
  const P0 = sockets[0].p;
  const leadPts = [];
  const leadCtrl = [[0, 0, 0], [-0.03, -0.004, -0.004], [-0.058, -0.028, -0.03], [-0.07, -0.085, -0.06], [-0.07, -0.16, -0.075], [-0.064, -0.24, -0.08], [-0.058, -0.3, -0.078]];
  for (const [x, y, z] of leadCtrl) leadPts.push(P0.clone().addScaledVector(u, x - headHalf).addScaledVector(side, z).setY(P0.y + y));
  const leadCurve = new THREE.CatmullRomCurve3(leadPts, false, 'centripetal').getSpacedPoints(60);
  // tail at the far end: a short end with a rubber end cap
  const Pn = sockets[n - 1].p;
  const tailCurve = new THREE.CatmullRomCurve3([0, 0.06, 0.13, 0.2].map((x, k) => Pn.clone().addScaledVector(u, headHalf + x).setY(Pn.y - [0, 0.008, 0.035, 0.08][k])), false, 'centripetal').getSpacedPoints(16);
  const fullPts = [...leadCurve.slice().reverse(), ...clean.slice(1), ...tailCurve.slice(1)];

  // --- framing split: what lies within `frame` metres of the plug end is framed ------------
  const swag = per * sp;
  const frameLen = Number(p.frame ?? Math.min((n - 1) * sp + 0.2, Math.max(2.4, swag * 1.1)));
  const fr = { bins: new G.PartBin(), extra: [] }, far = { bins: new G.PartBin(), extra: [] };
  const sAlong = (q) => q.clone().sub(P0).dot(u);  // projected distance from the first socket
  const binFor = (x) => (x <= frameLen ? fr : far);

  // cable: split the swept path in two meshes at frameLen (overlap 1 sample)
  const cut = fullPts.findIndex((q) => sAlong(q) > frameLen);
  const partA = cut < 0 ? fullPts : fullPts.slice(0, cut + 1);
  const partB = cut < 0 ? null : fullPts.slice(cut);
  fr.bins.add(rub, L.flatCable(partA, rub));
  if (partB && partB.length > 1) far.bins.add(rub, L.flatCable(partB, rub));
  // end cap on the tail
  {
    const e = tailCurve[tailCurve.length - 1], d = e.clone().sub(tailCurve[tailCurve.length - 2]).normalize();
    const cap = G.lathe([[0.0001, -0.006], [0.0098, -0.006], [0.0108, -0.002], [0.0108, 0.026], [0.0094, 0.031], [0.0001, 0.032]], 32);
    cap.applyMatrix4(new THREE.Matrix4().makeBasis(...basisFromY(d)).setPosition(e));
    binFor(sAlong(e)).bins.add(rub, cap);
  }
  // plug at the end of the lead
  if (p.plug !== false) {
    const e = leadCurve[leadCurve.length - 1], d = e.clone().sub(leadCurve[leadCurve.length - 3]).normalize();
    const parts = []; rubberPlug((m, g) => parts.push([m, g]), rub, pinMat);
    const M4 = new THREE.Matrix4().makeBasis(...basisFromY(d.clone().negate())).setPosition(e);
    for (const [m, g] of parts) { g.applyMatrix4(M4); fr.bins.add(m, g); }
  }

  // sockets + lamps + glow
  const halos = [];
  const colours = ['rood', 'oranje', 'geel', 'groen', 'blauw'];
  for (const S of sockets) {
    const tgt = binFor(sAlong(S.p));
    // socket frame: x along the cable, y up (perpendicular to the cable in the vertical plane)
    const x = S.dir.clone(), y = V3(0, 1, 0).addScaledVector(x, -x.y).normalize(), z = V3().crossVectors(x, y);
    const M4 = new THREE.Matrix4().makeBasis(x, y, z).setPosition(S.p);
    for (const [m, g] of L.festoonSocket(rub)) { g.applyMatrix4(M4); tgt.bins.add(m, g); }
    if (!lamps) continue;
    const kind = lampKind.startsWith('col') || lampKind.startsWith('gekl') ? 'colour' : lampKind.startsWith('opal') || lampKind.startsWith('melk') ? 'opal' : 'filament';
    const lamp = L.lampG45({ kind, on, color: colours[S.i % colours.length] });
    // lamp hangs from the socket: lamp +Y -> socket -Y, contact inside the sleeve
    const LM = new THREE.Matrix4().makeBasis(x.clone().negate(), y.clone().negate(), z).setPosition(S.p.clone().addScaledVector(y, L.SOCKET.lampContact));
    for (const [m, g] of lamp.parts) { g.applyMatrix4(LM); tgt.bins.add(m, g); }
    if (on) {
      const c = lamp.centre.clone().applyMatrix4(LM);
      const col = L.lin(kind === 'filament' ? '#FFB868' : lamp.lightHex, kind === 'filament' ? 1.25 : 1.15);
      halos.push({ c, R: 0.12, color: col, a: kind === 'filament' ? 0.8 : 0.82, core: 0.26, coreW: 0.6 });
    }
  }

  const group = new THREE.Group(); group.name = `prikkabel ${n} x E27`;
  fr.bins.build(group);
  const farG = new THREE.Group(); far.bins.build(farG);
  farG.traverse((o) => { if (o.isMesh) o.userData.noFrame = true; });
  group.add(farG);
  group.traverse((o) => { if (o.isMesh) { const nm = o.material.name || ''; o.castShadow = !/glass/.test(nm); o.receiveShadow = true; } });
  const hm = L.haloSpheres(halos); if (hm) group.add(hm);

  // detail: the second lamp (or the first) with its socket
  const dS = sockets[Math.min(1, n - 1)].p;
  return {
    object: group,
    detail: { target: [dS.x, dS.y - 0.075, dS.z], size: 0.36, azimuth: 24, elevation: 6 },
    view: { hero: { azimuth: 34, elevation: 12, offsetY: 0.1 }, front: { elevation: 4, offsetY: 0.06 } },
    rig: { default: { exposure: on ? 1.0 : 'auto', contact: { strength: 0 }, groundAO: { strength: 0.4 } } },
    meta: { n, spacing: sp, per, frameLen },
  };
}

function basisFromY(yAxis) {
  const y = yAxis.clone().normalize();
  const ref = Math.abs(y.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  const x = V3().crossVectors(y, ref).normalize();
  const z = V3().crossVectors(x, y).normalize();
  return [x, y, z];
}
