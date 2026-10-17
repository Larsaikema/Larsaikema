// Statafel covers, fitted over the parametric statafel (base 'klap', 4 legs).
//
// type 'stretch' : lycra/spandex hugging the top, tapering to a tight waist on the
//                  column and flaring down over the four feet (hourglass), free hem
//                  arching up between the feet; optional separate topcover.
// type 'strik'   : loose woven polyester cover gathered at the waist with a sash
//                  tied in a bow, full skirt to the floor.
// type 'kleed'   : round tablecloth over the top, draping to the floor in folds.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import { rng } from '../js/rng.js';
import { statafel, statafelDims } from './statafel.js';

const { V3, lerp, clamp, smoothstep } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---- profile helpers ------------------------------------------------------------
function bezier(p0, p1, p2, p3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return pts;
}
function arc(cx, cy, r, a0, a1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
function concat(...lists) {
  const out = [];
  for (const l of lists) for (const p of l) { const q = out[out.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) out.push(p); }
  return out;
}
// resample a polyline to (roughly) uniform arc length; returns pts + cumulative s
function resample(pts, step) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = acc[acc.length - 1], n = Math.max(2, Math.ceil(L / step));
  const out = [], s = [];
  let j = 1;
  for (let i = 0; i <= n; i++) {
    const d = (i / n) * L;
    while (j < acc.length - 1 && acc[j] < d) j++;
    const t = (d - acc[j - 1]) / Math.max(1e-9, acc[j] - acc[j - 1]);
    out.push([lerp(pts[j - 1][0], pts[j][0], t), lerp(pts[j - 1][1], pts[j][1], t)]); s.push(d);
  }
  return { pts: out, s, L };
}

// Revolve a profile [r,y] around Y; disp(theta, i, prof) -> [dr, dy].
function revolve(prof, nTheta, disp = null, { theta0 = 0 } = {}) {
  const { pts, s } = prof;
  const nv = pts.length - 1;
  const g = G.surface((u, v, out) => {
    const i = Math.round(v * nv);
    const th = theta0 + u * TAU;
    let [r, y] = pts[i];
    if (disp) { const [dr, dy] = disp(th, i, prof); r += dr; y += dy; }
    out.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, nTheta, nv, { closedU: true, flipNormals: true });
  // uv in metres: u around at mean radius, v along profile
  const uv = g.attributes.uv;
  const rMean = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  for (let j = 0; j <= nv; j++) for (let k = 0; k <= nTheta; k++) uv.setXY(j * (nTheta + 1) + k, (k / nTheta) * TAU * rMean, s[j]);
  return g;
}

// Fold field around the circle: broad rounded crests, narrow valleys, irregular
// fold widths (phase warping) and amplitudes; folds drift slightly with height t.
function foldField(count, seed, { sharp = 2.0, warp = 0.9, ampJitter = 0.35 } = {}) {
  const R = rng(seed);
  const h = [];
  for (let k = 1; k <= 4; k++) h.push({ k, a: (R() - 0.5) * warp / k, p: R() * TAU, d: (R() - 0.5) * 0.8 });
  const am = []; for (let k = 1; k <= 3; k++) am.push({ k, a: (R() - 0.5) * ampJitter, p: R() * TAU });
  const ph0 = R() * TAU;
  return (theta, t = 0) => {
    let phi = count * theta + ph0;
    for (const q of h) phi += q.a * Math.sin(q.k * theta + q.p + q.d * t) * count / 3;
    let amp = 1;
    for (const q of am) amp += q.a * Math.sin(q.k * theta * 2 + q.p);
    const x = (1 - Math.cos(phi)) / 2;          // 0 crest .. 1 valley
    return amp * (1 - 2 * Math.pow(x, sharp));  // +1 crest, -1 valley
  };
}

// ---- cover builders --------------------------------------------------------------
export function statafelCover(p = {}) {
  const type = (p.type || 'stretch').toLowerCase();
  const tableParams = { diameter: p.diameter ?? 0.8, height: p.height ?? 1.10, top: p.tableTop || 'berken', frame: p.frame || 'zwart', base: 'klap', legs: p.legs ?? 4, footAngle: p.footAngle ?? 45 };
  const S = statafelDims(tableParams);
  const group = new THREE.Group();
  const color = p.color || 'zwart';
  group.name = `statafelCover ${type} ${color}`;
  let detail;
  if (type === 'kleed') {
    buildKleed(group, S, p, color);
    detail = { target: [Math.sin(34 * DEG) * S.R * 0.9, S.H - 0.12, Math.cos(34 * DEG) * S.R * 0.9], size: 0.55, azimuth: 34, elevation: 14 };
  } else {
    const t = statafel(tableParams);
    group.add(t.object);
    if (type === 'strik' || type === 'bow') {
      buildStrik(group, S, p, color);
      detail = { target: [Math.sin(25 * DEG) * 0.2, S.H - 0.38, Math.cos(25 * DEG) * 0.2], size: 0.55, azimuth: 25, elevation: 6 };
    } else {
      buildStretch(group, S, p, color);
      detail = { target: [Math.sin(34 * DEG) * S.R * 0.6, S.H - 0.14, Math.cos(34 * DEG) * S.R * 0.6], size: 0.6, azimuth: 34, elevation: 12 };
    }
  }
  return { object: group, detail, meta: { type, color, D: S.D } };
}

function topProfile(S, f, gammaDeg, extraRim = 0) {
  // Fabric over the top: flat top, then follows the table edge (a box R x T with
  // small arrises) offset by the fabric thickness; corner radius grows with tension.
  const off = f + extraRim;
  const rc = 0.0045 + off;              // fabric corner radius
  const cxo = S.R - 0.0045;             // corner centres (table arris radius 4.5 mm)
  const yTopC = S.H - 0.0045, yBotC = S.H - S.T + 0.0045;
  const flat = [[0, S.H + off], [cxo * 0.5, S.H + off], [cxo, S.H + off]];
  const upperArc = arc(cxo, yTopC, rc, Math.PI / 2, 0, 8);
  const g = gammaDeg * DEG;
  const lowerArc = arc(cxo, yBotC, rc, 0, -g, 8);
  const pts = concat(flat, upperArc, lowerArc);
  return { pts, end: pts[pts.length - 1], dir: [-Math.sin(g), -Math.cos(g)] };
}

function buildStretch(group, S, p, color) {
  const mat = M.lycra(color);
  const f = 0.0025;
  const yW = Number(p.waistY ?? 0.60 * S.H);
  const rW = Number(p.waistR ?? 0.058);
  const top = topProfile(S, f, 48);
  const P0 = top.end, d0 = top.dir;
  const P3 = [rW, yW];
  const span = Math.hypot(P3[0] - P0[0], P3[1] - P0[1]);
  const funnel = bezier(P0, [P0[0] + d0[0] * span * 0.42, P0[1] + d0[1] * span * 0.42], [P3[0], P3[1] + span * 0.45], P3, 40);
  const upper = resample(concat(top.pts, funnel), 0.008);
  const wavesU = (th, i, prof) => {
    // fine compression wrinkles just above the waist
    const s = prof.s[i], L = prof.s[prof.s.length - 1];
    const k = Math.exp(-(L - s) / 0.07) * smoothstep(0, 0.25, (L - s) / 0.07 + 0.2);
    return [0.0018 * k * Math.sin(th * 22 + 2.3 * Math.sin(th * 5)), 0];
  };
  group.add(G.mesh(revolve(upper, 240, wavesU), mat));

  // lower: 4-lobed flare from the waist to the foot tips
  const n = S.nLegs, sector = TAU / n;
  const Rtip = S.footR + 0.062;
  const lift = Number(p.hemLift ?? 0.085);
  const a = 0.22;
  const g = (t) => (t < a ? (t * t) / (2 * a) : t - a / 2) / (1 - a / 2);
  const sabs = (x, e) => Math.sqrt(x * x + e * e) - e;
  const nT = 288, nV = 90;
  const lower = G.surface((u, v, out) => {
    const th = u * TAU;
    let dlt = th - S.footAngle;
    dlt = ((dlt % sector) + sector) % sector; if (dlt > sector / 2) dlt -= sector;
    const ad = sabs(dlt, 0.045);
    const m = clamp(ad / (sector / 2)); // 0 at a foot, 1 mid-panel
    const psi = sector / 2 - Math.min(sector / 2, ad);
    const rChord = (Rtip * Math.cos(sector / 2)) / Math.cos(psi);
    const rHem = rChord - 0.022 * m * m;
    const yHem = 0.004 + lift * (1 - Math.cos(Math.PI * m)) / 2;
    const t = v;
    let r = rW + (rHem - rW) * g(t);
    const y = yW + (yHem - yW) * t;
    // panels pull slightly concave between ridges
    r -= 0.016 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * Math.pow(m, 1.3);
    // waist wrinkles fading downward
    r += 0.0018 * Math.exp(-t / 0.09) * Math.sin(th * 22 + 2.3 * Math.sin(th * 5));
    // the fabric rounds over the foot cap near the floor
    out.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, nT, nV, { closedU: true, flipNormals: true });
  const uv = lower.attributes.uv;
  for (let j = 0; j <= nV; j++) for (let k = 0; k <= nT; k++) uv.setXY(j * (nT + 1) + k, (k / nT) * TAU * 0.2, (j / nV) * 0.75);
  group.add(G.mesh(lower, mat));
  // hem: rolled edge following the free border
  const hem = G.surface((u, v, out) => {
    const th = u * TAU;
    let dlt = th - S.footAngle;
    dlt = ((dlt % sector) + sector) % sector; if (dlt > sector / 2) dlt -= sector;
    const ad = sabs(dlt, 0.045);
    const m = clamp(ad / (sector / 2));
    const psi = sector / 2 - Math.min(sector / 2, ad);
    const r0 = (Rtip * Math.cos(sector / 2)) / Math.cos(psi) - 0.022 * m * m - 0.016 * Math.sin(Math.PI * Math.min(1, 1.15)) * Math.pow(m, 1.3);
    const y0 = 0.004 + lift * (1 - Math.cos(Math.PI * m)) / 2;
    const ang = v * TAU;
    out.set(Math.sin(th) * (r0 + Math.cos(ang) * 0.004), y0 + 0.004 + Math.sin(ang) * 0.004, Math.cos(th) * (r0 + Math.cos(ang) * 0.004));
  }, 288, 6, { closedU: true });
  group.add(G.mesh(hem, mat));

  if (p.topcover) {
    const tcColor = typeof p.topcover === 'string' ? p.topcover : p.topcoverColor || 'wit';
    const tmat = M.lycra(tcColor);
    const tp = topProfile(S, f + 0.0028, 92, 0.0015);
    const lip = [tp.end, [tp.end[0] - 0.012, tp.end[1] - 0.001], [S.R - 0.035, S.H - S.T - f - 0.006]];
    group.add(G.mesh(revolve(resample(concat(tp.pts, lip), 0.006), 240), tmat));
  }
}

function buildStrik(group, S, p, color) {
  const mat = M.polyCloth(color);
  const sashColor = p.sashColor || p.strikColor || color;
  const ribbon = sashColor === color ? mat : M.satinRibbon(sashColor);
  const f = 0.003;
  const yS = Number(p.sashY ?? S.H - 0.40);
  const rS = 0.105;
  const gathers = foldField(26, 7, { sharp: 1.4, warp: 0.6, ampJitter: 0.5 });
  const foldsU = foldField(13, 11, { sharp: 1.8, warp: 1.2, ampJitter: 0.6 });
  const foldsL = foldField(12, 23, { sharp: 2.6, warp: 1.3, ampJitter: 0.7 });
  const Aup = 0.022, Alow = 0.034;

  // top + upper drape to the sash
  const top = topProfile(S, f, 14, 0.002);
  const P0 = top.end, d0 = top.dir;
  const P3 = [rS, yS + 0.03];
  const span = Math.hypot(P3[0] - P0[0], P3[1] - P0[1]);
  const drape = bezier(P0, [P0[0] + d0[0] * span * 0.35, P0[1] + d0[1] * span * 0.35], [P3[0] + span * 0.28, P3[1] + span * 0.3], P3, 40);
  const upper = resample(concat(top.pts, drape), 0.008);
  const topLen = resample(top.pts, 0.008).L;
  group.add(G.mesh(revolve(upper, 220, (th, i, prof) => {
    const s = prof.s[i];
    const t = clamp((s - topLen) / (prof.L - topLen)); // 0 at rim, 1 at sash
    const amp = Aup * Math.pow(t, 1.1);
    const k = smoothstep(0.55, 1, t);
    return [amp * ((1 - k) * foldsU(th, t) + k * gathers(th, 0)), 0];
  }), mat));

  // lower skirt from the sash to the floor
  const Q0 = [rS, yS - 0.03];
  const Q3 = [S.R + 0.03, 0.006];
  const sp2 = Math.hypot(Q3[0] - Q0[0], Q3[1] - Q0[1]);
  const skirtPts = bezier(Q0, [Q0[0] + sp2 * 0.16, Q0[1] - sp2 * 0.2], [Q3[0] - 0.004, Q3[1] + sp2 * 0.5], Q3, 60);
  const skirt = resample(skirtPts, 0.01);
  const lowerAmp = (t) => 0.012 + (Alow - 0.012) * smoothstep(0, 0.6, t);
  group.add(G.mesh(revolve(skirt, 240, (th, i, prof) => {
    const t = prof.s[i] / prof.L;
    const k = smoothstep(0, 0.45, t);
    return [lowerAmp(t) * (k * foldsL(th, t) + (1 - k) * gathers(th, 0)), 0];
  }), mat));
  // hem bead
  const hemR = (th) => skirt.pts[skirt.pts.length - 1][0] + lowerAmp(1) * foldsL(th, 1) - 0.002;
  group.add(G.mesh(G.surface((u, v, o) => {
    const th = u * TAU, a = v * TAU, r = hemR(th) + Math.cos(a) * 0.003;
    o.set(Math.sin(th) * r, 0.006 + Math.sin(a) * 0.003, Math.cos(th) * r);
  }, 240, 6, { closedU: true }), mat));

  // sash band around the gathered waist
  const sashH = 0.058;
  const band = G.surface((u, v, o) => {
    const th = u * TAU;
    const y = yS - sashH / 2 + v * sashH;
    const r = rS + Aup * 0.9 + 0.006 + 0.004 * Math.sin(Math.PI * v) + 0.0015 * Math.sin(th * 9);
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, 160, 8, { closedU: true });
  group.add(G.mesh(band, ribbon));

  // bow at the front: knot, two puffed wings (flattened loops), two tails
  const tb = Number(p.bowAngle ?? 22) * DEG;
  const rBand = rS + Aup * 0.9 + 0.012;
  const ring = (th, r, y) => V3(Math.sin(th) * r, y, Math.cos(th) * r);
  const outAt = (th) => V3(Math.sin(th), 0, Math.cos(th));
  const knotC = ring(tb, rBand + 0.02, yS);
  const nrm = outAt(tb), tan = V3(Math.cos(tb), 0, -Math.sin(tb));
  group.add(G.mesh(G.surface((u, v, o) => {
    const th = u * TAU, ph = v * Math.PI;
    const x = Math.cos(th) * Math.sin(ph) * 0.03, y = Math.cos(ph) * 0.037, z = Math.sin(th) * Math.sin(ph) * 0.02;
    o.copy(knotC).addScaledVector(tan, x).addScaledVector(nrm, z).setY(knotC.y + y);
  }, 28, 16), ribbon));
  for (const side of [-1, 1]) {
    // wings stick out along the tangent (stiff, puffed loops), bending slightly back
    const L = side > 0 ? 0.15 : 0.14;
    const beta = (side > 0 ? 27 : 33) * DEG;
    const wing = G.surface((u, v, o) => {
      const ph = u * TAU;
      const xs = (1 - Math.cos(ph)) / 2;            // 0 at knot .. 1 at the fold
      const x = L * xs;
      const D = 0.008 + 0.04 * Math.pow(Math.sin(Math.PI * Math.min(1, xs * 1.04)), 0.7) + 0.008 * xs;
      const layer = Math.sin(ph);                    // + front layer, - back layer
      const W = 0.03 + 0.07 * smoothstep(0, 1, xs);
      o.copy(knotC)
        .addScaledVector(tan, side * (0.018 + x * Math.cos(beta)))
        .addScaledVector(nrm, D * layer + 0.012 - 0.9 * x * x)
        .setY(knotC.y + x * Math.sin(beta) + (v - 0.5) * W * (1 + 0.12 * layer));
    }, 64, 10);
    group.add(G.mesh(wing, ribbon));
  }
  // tails hanging over the skirt (rest on the fold crests), V-cut ends
  const skirtR = (y) => {
    let best = skirt.pts[0][0];
    for (let i = 1; i < skirt.pts.length; i++) { const [r0, y0] = skirt.pts[i - 1], [r1, y1] = skirt.pts[i]; if ((y0 - y) * (y1 - y) <= 0) { best = lerp(r0, r1, (y - y0) / ((y1 - y0) || 1e-9)); break; } }
    return best;
  };
  for (const side of [-1, 1]) {
    const len = side > 0 ? 0.44 : 0.4, W = 0.07;
    const tail = G.surface((u, v, o) => {
      const yy = yS - 0.025 - u * len;
      const spread = side * (0.014 + u * (side > 0 ? 0.075 : 0.055));
      const rr = Math.max(skirtR(yy) + lowerAmp(clamp((yS - 0.03 - yy) / (yS - 0.03))) * 1.05 + 0.006, rBand + 0.016 - u * 0.01);
      const th = tb + spread / rr;
      const twist = (side * 0.35 + 0.25 * Math.sin(u * 3.5)) * smoothstep(0, 0.3, u);
      const w = (v - 0.5) * W;
      const notch = smoothstep(0.86, 1, u) * (0.5 - Math.abs(v - 0.5)) * 0.09; // swallowtail V-cut
      const tg = V3(Math.cos(th), 0, -Math.sin(th));
      o.copy(ring(th, rr, yy - notch)).addScaledVector(tg, w * Math.cos(twist)).addScaledVector(outAt(th), w * Math.sin(twist) * 0.6 + 0.004);
    }, 40, 6);
    group.add(G.mesh(tail, ribbon));
  }
}

function buildKleed(group, S, p, color) {
  const mat = M.polyCloth(color, { satin: 0.25 });
  // hidden support: simple top disc so shadows/occlusion read right
  const f = 0.003;
  const top = topProfile(S, f, 2, 0.0015);
  const P0 = top.end;
  const drop = [];
  const yTopEdge = P0[1];
  const n = 70;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const y = lerp(yTopEdge, 0.004, t);
    const r = P0[0] + 0.004 + 0.09 * Math.pow(t, 1.5) + 0.045 * smoothstep(0.9, 1, t) ** 1.5;
    drop.push([r, y]);
  }
  const prof = resample(concat(top.pts, drop), 0.008);
  const topLen = resample(top.pts, 0.008).L;
  const folds = foldField(10, 5, { sharp: 1.8, warp: 1.1, ampJitter: 0.4 });
  group.add(G.mesh(revolve(prof, 300, (th, i, pr) => {
    const s = pr.s[i];
    const t = clamp((s - topLen) / (pr.L - topLen));
    const amp = 0.085 * Math.pow(t, 0.8) * smoothstep(0, 0.03, t);
    return [amp * folds(th, t), 0];
  }), mat));
}
