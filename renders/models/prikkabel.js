// Prikkabel (festoon cable) with E27 prick sockets and LED lamps, as a catalogue flat-lay.
//
// prikkabel { bulbs, spacing, on, cable, lamp, lamps, plug, sag }
//   bulbs     number of sockets (10)            spacing  m between sockets along the cable (1.0)
//   on        lamps lit (true)                   cable    'zwart' | 'wit'
//   lamp      'filament' (clear G45, LED filaments) | 'opal' | 'colour' (cycles rood/oranje/geel/groen/blauw)
//   lamps     false: sockets only                plug     moulded rubber plug on the lead (true)
//   sag       ignored (kept for old specs: the run now lies on the floor)
//
// Staging. Like every other product in the catalogue the whole run stands centred in the frame
// on the studio floor, with its own floor shadow: the cable is laid out in a loose serpentine
// (rows across the picture joined by round turns, a little natural wander), every socket and
// lamp lying on its side next to the cable, the lamps pointing towards the camera so each one
// reads as "socket with a bulb". The plug lead starts at the front right, the end cap finishes
// the last row at the back. The rows, their spacing and the number of rows follow from the cable
// length so the layout always fills ~80 % of a square (hero) or a 1800 x 1100 banner (front).
//
// Construction: flat 2-core rubber cable (H05RN-F 2 x 1.5 mm2, 11.8 x 6.4 mm) lying flat on the
// floor and twisting onto its edge into each socket head (the socket pierces the flat face, so a
// socket lying on its side turns the cable through 90 degrees over ~15 cm). Each socket is a
// two-part rubber clamp head (lid, cross-head screw, moulded eye) on a sleeve with four sealing
// ribs and a soft lip; head, lip and globe rest on the floor (the axis rises ~4 degrees). Lamps
// are G45 filament LEDs (js/bulbKit.js): real noise-free glass, white-hot filaments in an amber
// haze when lit, a soft bloom and a warm pool of light on the floor in front of each lamp.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';
import { GlowComp } from '../js/lightGlow.js';
import { g45, flushExtra, FIL } from '../js/bulbKit.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const UP = V3(0, 1, 0);

const CABLE = { w: 0.0118, t: 0.0064 };
const HEAD_Y = 0.015;                       // height of the socket head centre (head lies on its 30 mm side)
const TILT = Math.asin((G45R() - HEAD_Y) / 0.11); // socket axis rises so head, lip and globe touch the floor
function G45R() { return 0.0225; }

// --- the serpentine in the camera's floor frame: a = across (to the right), b = depth (away) ---
function serpentine(n, sp, { aspect = 1, elev = 40, gT = 0.5, tail = 0.2 }) {
  const first = 0.14;                             // first socket this far into the first row
  const Lrow = first + (n - 1) * sp + tail + 0.05; // cable from the start of row 0 to the end cap
  const s = Math.sin(elev * DEG);
  let best = null;
  for (let K = 2; K <= 7; K++) {
    // visual width (W + g) ~ aspect * visual height ((K-1) g sin(elev)), and the length budget
    const c = aspect * 1.04 * (K - 1) * s - 1;
    if (c < 0.6) continue;
    const g = Lrow / (K * c + (K - 1) * Math.PI / 2);
    const W = c * g;
    const score = Math.abs(Math.log(g / gT)) + (W < 0.6 ? 2 : 0) + (g < 0.3 ? 2 : 0);
    if (!best || score < best.score) best = { K, g, W, score };
  }
  if (!best) best = { K: 2, g: 0.6, W: Math.max(0.6, (Lrow - Math.PI * 0.3) / 2) };
  const { K, g, W } = best;
  const pts = [];
  const b0 = -((K - 1) * g) / 2;
  // lead: from the plug (front right) in a soft curve into the right end of row 0
  const plug = [W / 2 + 0.12, b0 - 0.5];
  const leadCtl = [plug, [W / 2 + 0.2, b0 - 0.33], [W / 2 + 0.2, b0 - 0.12], [W / 2 + 0.1, b0 - 0.01], [W / 2, b0]];
  const lc = new THREE.CatmullRomCurve3(leadCtl.map(([a, b]) => V3(a, 0, b)), false, 'centripetal').getSpacedPoints(40);
  for (const q of lc) pts.push([q.x, q.z]);
  for (let k = 0; k < K; k++) {
    const b = b0 + k * g;
    const dir = k % 2 === 0 ? -1 : 1;            // row 0 runs right -> left
    const aS = dir < 0 ? W / 2 : -W / 2, aE = -aS;
    const N = Math.max(8, Math.round(W / 0.02));
    // rows bow gently (alternating), so the run looks laid by hand, not ruled
    const bow = (k % 2 ? 1 : -1) * Math.min(0.05, g * 0.1);
    for (let i = 1; i <= N; i++) { const u = i / N; pts.push([aS + (aE - aS) * u, b + bow * Math.sin(Math.PI * u)]); }
    if (k < K - 1) {
      // half turn round the end, bulging outwards
      const r = g / 2, cA = aE, cB = b + r;
      const M = 40;
      for (let i = 1; i < M; i++) {
        const t = (i / M) * Math.PI;
        pts.push([cA + dir * Math.sin(t) * r, cB - Math.cos(t) * r]);
      }
    } else {
      // the tail runs on a little past the row end
      const M = 10; for (let i = 1; i <= M; i++) pts.push([aE + dir * tail * (i / M), b]);
    }
  }
  return { pts, K, g, W, first: lengthOf(lc.map((q) => [q.x, q.z])) + first };
}
function lengthOf(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }

// arc-length resampling of a 2D polyline, with per-point tangent and arc length
function resample2(p, step) {
  const S = [0]; for (let i = 1; i < p.length; i++) S.push(S[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const L = S[S.length - 1], n = Math.max(2, Math.round(L / step) + 1), out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * L;
    while (j < p.length - 2 && S[j + 1] < s) j++;
    const t = (s - S[j]) / Math.max(1e-9, S[j + 1] - S[j]);
    out.push({ a: p[j][0] + (p[j + 1][0] - p[j][0]) * t, b: p[j][1] + (p[j + 1][1] - p[j][1]) * t, s });
  }
  return { pts: out, L };
}

// sweep a closed profile along points with given normals (profile y along N, x along T x N)
function sweepN(P, N, profile) {
  const n = P.length, m = profile.length;
  const pos = [], uv = [], idx = [];
  const T = P.map((p, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  let s = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) s += P[i].distanceTo(P[i - 1]);
    const nn = N[i].clone().addScaledVector(T[i], -N[i].dot(T[i])).normalize();
    const bb = V3().crossVectors(T[i], nn);
    for (let k = 0; k <= m; k++) {
      const [x, y] = profile[k % m];
      const q = P[i].clone().addScaledVector(bb, x).addScaledVector(nn, y);
      pos.push(q.x, q.y, q.z); uv.push(s, k / m);
    }
  }
  const row = m + 1;
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < m; k++) { const a = i * row + k, b = a + 1, c = a + row, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const nA = g.attributes.normal;
  for (let i = 0; i < n; i++) { const a = i * row, b = a + m; const x = nA.getX(a) + nA.getX(b), y = nA.getY(a) + nA.getY(b), z = nA.getZ(a) + nA.getZ(b), l = Math.hypot(x, y, z) || 1; nA.setXYZ(a, x / l, y / l, z / l); nA.setXYZ(b, x / l, y / l, z / l); }
  return g;
}

export function prikkabel(p = {}) {
  const n = Math.max(1, Math.round(Number(p.bulbs ?? 10)));
  const sp = Number(p.spacing ?? 1.0);
  const on = p.on !== false;
  const white = /wit|white/i.test(String(p.cable || p.color || ''));
  const lamps = p.lamps !== false;
  const lampKind = String(p.lamp || 'filament').toLowerCase();
  const kind = lampKind.startsWith('col') || lampKind.startsWith('gekl') ? 'colour' : lampKind.startsWith('opal') || lampKind.startsWith('melk') ? 'opal' : 'filament';
  const rub = white ? L.cableRubber('#E9E8E3', 0.52) : L.cableRubber('#161616', 0.58);
  const pinMat = L.e27Mats().nickel;
  const angle = p.__angle || 'hero';
  const banner = angle === 'front';
  const camAz = (banner ? 0 : 34) * DEG;
  const elev = banner ? 28 : 30;
  const right = V3(Math.cos(camAz), 0, -Math.sin(camAz)), away = V3(-Math.sin(camAz), 0, -Math.cos(camAz));
  const nz = makeNoise2(31 + n);

  // --- layout -------------------------------------------------------------------------
  const lay = serpentine(n, sp, { aspect: banner ? 1.62 : 0.9, elev });
  const R2 = resample2(lay.pts, 0.01);
  // natural wander perpendicular to the run (a few cm, long waves), none at the ends
  const sock = []; for (let i = 0; i < n; i++) sock.push(lay.first + i * sp);
  const wpts = R2.pts.map((q, i, arr) => {
    const qn = arr[Math.min(arr.length - 1, i + 1)], qp = arr[Math.max(0, i - 1)];
    const ta = qn.a - qp.a, tb = qn.b - qp.b, tl = Math.hypot(ta, tb) || 1;
    const w = 0.028 * nz.noise(q.s * 0.9, 0.3) + 0.012 * nz.noise(q.s * 2.7, 4.1);
    const fade = G.smoothstep(0, 0.4, q.s) * G.smoothstep(0, 0.3, R2.L - q.s);
    return { a: q.a - (tb / tl) * w * fade, b: q.b + (ta / tl) * w * fade, s: q.s };
  });
  const toW = (a, b, y = 0) => V3().addScaledVector(right, a).addScaledVector(away, b).setY(y);
  const P2 = wpts.map((q) => toW(q.a, q.b));
  const at = (s) => {
    const i = Math.min(P2.length - 2, Math.max(0, Math.floor((s / R2.L) * (P2.length - 1))));
    const t = (s / R2.L) * (P2.length - 1) - i;
    const p0 = P2[i].clone().lerp(P2[i + 1], t);
    const tan = P2[Math.min(P2.length - 1, i + 2)].clone().sub(P2[Math.max(0, i - 1)]).setY(0).normalize();
    return { p: p0, t: tan, i };
  };
  // the layout's centre (in the floor plane) for the curvature test
  const ctr = P2.reduce((acc, q) => acc.add(q), V3()).multiplyScalar(1 / P2.length);

  // --- sockets: position, outward (lamp) direction --------------------------------------
  const sockets = sock.map((s, i) => {
    const { p: q, t } = at(s);
    let o = V3().crossVectors(UP, t).normalize();  // perpendicular in the floor plane
    // towards the camera, or (in a turn, where the cable runs in depth) away from the layout centre
    const towardsCam = -o.dot(away), outward = o.dot(q.clone().sub(ctr).setY(0).normalize());
    if (towardsCam + 0.55 * outward < 0) o.negate();
    return { i, s, p: q, t, o };
  });

  // --- cable: height and twist near sockets, plug and end cap ----------------------------
  const flatY = CABLE.t / 2 + 0.0004;
  const plugY = 0.0189, capY = 0.0108;
  const P = [], N = [];
  for (let k = 0; k < P2.length; k++) {
    const s = wpts[k].s;
    let wTw = 0, oS = null, best = 1e9;
    for (const S of sockets) { const d = Math.abs(s - S.s); if (d < best) { best = d; oS = S.o; } }
    wTw = 1 - G.smoothstep(0.03, 0.17, best);
    const wLift = 1 - G.smoothstep(0.02, 0.11, best);
    let y = G.lerp(flatY, HEAD_Y, wLift);
    // lead rises into the plug, tail into the end cap
    if (p.plug !== false) y = Math.max(y, G.lerp(flatY, plugY, 1 - G.smoothstep(0.0, 0.09, s)));
    y = Math.max(y, G.lerp(flatY, capY, 1 - G.smoothstep(0.0, 0.07, R2.L - s)));
    P.push(P2[k].clone().setY(y));
    // normal: up when lying flat, -outward (on its edge) inside a socket head
    const nn = oS ? UP.clone().lerp(oS.clone().negate(), wTw).normalize() : UP.clone();
    N.push(nn);
  }
  const bins = new G.PartBin();
  bins.add(rub, sweepN(P, N, L.stadiumProfile(CABLE.w, CABLE.t, 6)));

  // end cap on the tail
  {
    const e = P[P.length - 1], d = e.clone().sub(P[P.length - 4]).normalize();
    const cap = G.lathe([[0.0001, -0.006], [0.0098, -0.006], [0.0108, -0.002], [0.0108, 0.026], [0.0094, 0.031], [0.0001, 0.032]], 32);
    cap.applyMatrix4(new THREE.Matrix4().makeBasis(...basisFromY(d)).setPosition(e.clone().setY(capY)));
    bins.add(rub, cap);
  }
  // plug lying on its side at the start of the lead
  if (p.plug !== false) {
    const e = P[0], T0 = P[3].clone().sub(P[0]).setY(0).normalize();
    const parts = []; L.rubberPlug((m, g) => parts.push([m, g]), rub, pinMat);
    const Y = T0.clone(), Z = V3().crossVectors(UP, Y).normalize(), X = V3().crossVectors(Y, Z).normalize();
    const M4 = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(e.clone().setY(plugY));
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins.add(m, g); }
  }

  // sockets + lamps
  const GC = new GlowComp({ name: 'prikkabel' });
  const sources = [];
  const colours = ['rood', 'oranje', 'geel', 'groen', 'blauw'];
  for (const S of sockets) {
    const yL = S.o.clone().multiplyScalar(Math.cos(TILT)).addScaledVector(UP, Math.sin(TILT)).negate();
    let x = S.t.clone();
    let z = V3().crossVectors(x, yL);
    if (z.y > 0) { x.negate(); z = V3().crossVectors(x, yL); }
    z.normalize();
    const head = S.p.clone().setY(HEAD_Y);
    const M4 = new THREE.Matrix4().makeBasis(x, yL, z).setPosition(head);
    for (const [m, g] of L.festoonSocket(rub)) { g.applyMatrix4(M4); bins.add(m, g); }
    if (!lamps) continue;
    const LM = new THREE.Matrix4().makeBasis(x.clone().negate(), yL.clone().negate(), z).setPosition(head.clone().addScaledVector(yL, L.SOCKET.lampContact));
    const r = g45(GC, bins, LM, { kind, on, color: colours[S.i % colours.length], bloomR: 0.095, bloom: 1.1 });
    if (on) {
      const col = kind === 'filament' ? [1.25, 0.72, 0.3] : r.light.map((v) => v * 1.2);
      sources.push({ p: r.centre.clone(), I: 1, color: col, axis: r.axis.clone() });
    }
  }

  const group = new THREE.Group(); group.name = `prikkabel ${n} x E27`;
  bins.build(group);
  flushExtra(bins, group);
  group.traverse((o) => { if (o.isMesh && o.material.name !== 'glass marker') { const nm = o.material.name || ''; o.castShadow = !/glass/.test(nm); o.receiveShadow = true; } });
  if (sources.length) {
    // light falls forward and sideways out of each lamp; the socket shades the floor behind it
    const occl = (x, z, s) => {
      const dx = x - s.p.x, dz = z - s.p.z, l = Math.hypot(dx, dz) || 1;
      const f = (dx * s.axis.x + dz * s.axis.z) / l;
      return 0.18 + 0.82 * G.smoothstep(-0.55, 0.35, f);
    };
    GC.floorPool(sources, { pad: 0.45, res: 256, k: 0.0036, max: 0.26, minH: 0.07, occl });
  }
  if (!GC.isEmpty()) group.add(GC.build(ctr.clone().setY(0.02)));

  // detail: the middle of the layout
  return {
    object: group,
    // collection close-up: the middle rows, from a little higher, framed between two sockets
    detail: { target: [ctr.x, 0.02, ctr.z], size: 1.0, azimuth: 26, elevation: 36, shift: [0.04, 0.06] },
    view: { hero: { azimuth: 34, elevation: elev }, front: { azimuth: 0, elevation: elev }, top: { azimuth: 34, elevation: 62 } },
    rig: {
      default: {
        exposure: on ? 1.0 : 'auto',
        contact: { strength: 0.75, h0: 0.006, res: 1024, blur: 1.3 },
        groundAO: { strength: 0.7, maxZenith: 80 },
        shadowFloor: 0.66,
      },
    },
    meta: { n, spacing: sp, rows: lay.K, gap: lay.g, rowW: lay.W, sockets: sockets.map((S) => [S.p.x, S.p.z].map((v) => +v.toFixed(3))) },
  };
}

function basisFromY(yAxis) {
  const y = yAxis.clone().normalize();
  const ref = Math.abs(y.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  const x = V3().crossVectors(y, ref).normalize();
  const z = V3().crossVectors(x, y).normalize();
  return [x, y, z];
}
