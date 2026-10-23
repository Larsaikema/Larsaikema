// Strik (bow) statafel cover (statafelhoes met strik), round 5.
//
// Loose woven polyester cover: the cloth lies flat on the blad, falls over the edge and is gathered at the
// waist by a sash of the same cloth, tied in a bow; below the sash the skirt falls to the floor.
//
//   gathers   one branching fold field per side of the sash (branchingFolds): ~14 major folds of uneven width
//             and depth all the way round, each splitting into 1-3 tight gathers towards the sash (at its own
//             height: the folds branch irregularly), valleys narrower than the rounded crests, a slow drift
//             with height and fine secondary wrinkles. No region is left smooth, there is no seam between
//             a smooth and a pleated half.
//   skirt     the gathers under the sash open into folds that grow towards the floor (wider spread of widths,
//             some broad and shallow, some deep, each swelling and fading along its length, leaning a little);
//             each foot glide props the cloth out into a broad ridge. The hem reaches the floor and only just
//             pools (<= 3 mm): no flange, no rolled outline; the bottom 1-2 cm sit in the floor's shade
//             (material floorAO: a dark contact line).
//   sash      a band of the same cloth with real thickness (clothStrip: two faces + rounded edges) round the
//             gathers: soft lengthwise folds, riding over the gather crests at its edges (pushed out of the
//             cloth under it, so nothing shows through), bunching into the knot.
//   bow       two OPEN ribbon loops: each a strip with thickness folded back on itself (front strand out, a
//             rounded turn, back strand back into the knot), tipped so the camera sees into the loop (the
//             inner face of the back strand), gathered narrow with pleats where it is pinched into the knot,
//             a diagonal pinch crease and soft folds on the front strand; the knot is a short band wrapped
//             round the loop roots (flared edges, a diagonal wrap crease, uneven bulk, slightly rolled); two
//             tails start hidden behind the knot and hang over the band and the skirt (bridging the folds under
//             them: an envelope of the cloth across their width), with a soft twist hinged on the edge that lies
//             on the skirt (the other edge lifts off), a lengthwise fold and a clean V cut.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SL from '../js/statafelLook.js';
import { rng, makeNoise2 } from '../js/rng.js';
import { bezier, concat, resample, profAt, gridMesh, topProfile, revolve } from './statafelCover.js';

const { V3, lerp, clamp, smoothstep } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const wrapA = (a) => a - TAU * Math.round(a / TAU);
const ease = (x) => (1 - Math.cos(Math.PI * clamp(x))) / 2;
// smooth maximum (blend width k): a cloth layer laid over another rides over its crests without kinks
const smax = (a, b, k) => (a + b + Math.sqrt((a - b) * (a - b) + k * k)) / 2;

// ---------------------------------------------------------------------------------------
// Branching fold field round a circle. nMajor folds (spans of lognormal-ish widths), each holding 1..subMax
// gathers. eval(m, h) returns f(theta) in [-1, 1] (+ crest, - valley) for merge state m (0 = every gather
// separate, as next to the sash; 1 = merged into the major folds) and height parameter h (slow drift). Each
// major fold merges over its own range of m, so the folds branch at different heights.
export function branchingFolds(seed, { nMajor = 14, theta0 = 0, widthVar = 0.55, subMax = 3, mergeSpread = 0.36, drift = 0.06, gamma = 1.55, ampMin = 0.5, heightMod = 0 } = {}) {
  const R = rng(seed);
  const gaps = []; let sum = 0;
  for (let i = 0; i < nMajor; i++) { const g = Math.exp((R() * 2 - 1) * widthVar); gaps.push(g); sum += g; }
  const bounds = [theta0];
  for (let i = 0; i < nMajor; i++) bounds.push(bounds[i] + (gaps[i] / sum) * TAU);
  const meanSpan = TAU / nMajor;
  const folds = [];
  for (let k = 0; k < nMajor; k++) {
    const a0 = bounds[k], span = bounds[k + 1] - a0;
    const nSub = clamp(Math.round((0.7 + 1.7 * R()) * (span / meanSpan)), 1, subMax);
    const cuts = []; let cs = 0;
    for (let j = 0; j < nSub; j++) { const w = 0.55 + 0.9 * R(); cuts.push(w); cs += w; }
    const subs = []; let ac = 0;
    for (let j = 0; j < nSub; j++) { const pos = (ac + cuts[j] * (0.3 + 0.4 * R())) / cs; ac += cuts[j]; subs.push({ a: a0 + span * (0.1 + 0.8 * pos), v: 0.4 + 0.6 * R() }); }
    const subV = [];
    for (let j = 0; j < nSub - 1; j++) subV.push({ w: 0.35 + 0.3 * R(), v: -(0.15 + 0.6 * R()) });
    // ampMin < 0.5: some folds stay broad and shallow, others are deep (cloth, not a fluted lampshade);
    // heightMod: each fold's depth swells and fades along its length at its own rate
    folds.push({ a0, span, c: a0 + span * (0.36 + 0.28 * R()), E: ampMin + (1 - ampMin) * R(), subs, subV, o: (R() - 0.5) * mergeSpread, d: (R() - 0.5) * 2 * drift, vd: -(ampMin + (1 - ampMin) * R()), vdB: -(0.45 + 0.5 * R()), hf: 0.6 + 1.2 * R(), hp: R() * TAU });
  }
  const cache = new Map();
  function extrema(m, h) {
    const key = `${m.toFixed(4)}|${h.toFixed(4)}`;
    let ex = cache.get(key);
    if (ex) return ex;
    ex = [];
    for (let k = 0; k < nMajor; k++) {
      const F = folds[k], Fp = folds[(k - 1 + nMajor) % nMajor];
      const mk = ease((m + F.o - 0.2) / 0.6);
      const dk = F.d * h;
      const hm = 1 + heightMod * Math.sin(TAU * F.hf * h + F.hp), hmp = 1 + heightMod * Math.sin(TAU * Fp.hf * h + Fp.hp);
      ex.push({ a: F.a0 + ((F.d + Fp.d) / 2) * h, v: lerp(F.vdB, F.vd, mk) * (hm + hmp) / 2 });
      for (let j = 0; j < F.subs.length; j++) {
        const s = F.subs[j];
        ex.push({ a: lerp(s.a, F.c, mk) + dk, v: lerp(s.v, F.E * hm, mk) });
        if (j < F.subV.length) {
          const sv = F.subV[j], s2 = F.subs[j + 1];
          ex.push({ a: lerp(lerp(s.a, s2.a, sv.w), F.c, mk) + dk, v: lerp(sv.v, F.E * hm, mk) });
        }
      }
    }
    for (let i = 1; i < ex.length; i++) if (ex[i].a < ex[i - 1].a) ex[i].a = ex[i - 1].a;
    if (cache.size > 4096) cache.clear();
    cache.set(key, ex);
    return ex;
  }
  return {
    eval(m, h) {
      const ex = extrema(m, h), n = ex.length, a0 = ex[0].a;
      return (theta) => {
        const x = ((theta - a0) % TAU + TAU) % TAU + a0;
        let lo = 0, hi = n; // ex[lo].a <= x < ex[hi].a (ex[n] = ex[0] + TAU)
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ex[mid].a <= x) lo = mid; else hi = mid; }
        const e0 = ex[lo], a1 = hi < n ? ex[hi].a : a0 + TAU, v1 = hi < n ? ex[hi].v : ex[0].v;
        const w = (x - e0.a) / Math.max(1e-9, a1 - e0.a);
        // rounded crests, narrower valleys
        const k = e0.v > v1 ? ease(Math.pow(w, gamma)) : ease(1 - Math.pow(1 - w, gamma));
        return e0.v + (v1 - e0.v) * k;
      };
    },
  };
}

// ---------------------------------------------------------------------------------------
// Cloth strip with real thickness. mid(u, v, out) sets the mid-surface point for u in [0, 1] (nu segments),
// v in [-1, 1] (nv segments). Front and back faces sit at +-t/2 along the local normal; rounded edges close
// the strip at v = -1 and v = +1, and at u = 0 / u = 1 when capU0 / capU1. closedU: u wraps round.
export function clothStrip(mid, nu, nv, t, { closedU = false, capU0 = false, capU1 = false, edgeSegs = 5 } = {}) {
  const P = [];
  const tmp = V3();
  for (let j = 0; j <= nu; j++) {
    const row = [];
    for (let i = 0; i <= nv; i++) { mid(closedU && j === nu ? 0 : j / nu, (i / nv) * 2 - 1, tmp); row.push(tmp.clone()); }
    P.push(row);
  }
  const N = [], Du = [], Dv = [];
  for (let j = 0; j <= nu; j++) {
    const nr = [], ur = [], vr = [];
    const jp = j < nu ? j + 1 : (closedU ? 1 : j), jm = j > 0 ? j - 1 : (closedU ? nu - 1 : j);
    for (let i = 0; i <= nv; i++) {
      const ip = Math.min(nv, i + 1), im = Math.max(0, i - 1);
      const du = V3().subVectors(P[jp][i], P[jm][i]), dv = V3().subVectors(P[j][ip], P[j][im]);
      const n = V3().crossVectors(du, dv);
      if (n.lengthSq() < 1e-20) n.set(0, 1, 0);
      nr.push(n.normalize()); ur.push(du.normalize()); vr.push(dv.normalize());
    }
    N.push(nr); Du.push(ur); Dv.push(vr);
  }
  const h = t / 2;
  const front = P.map((row, j) => row.map((p, i) => p.clone().addScaledVector(N[j][i], h)));
  const back = P.map((row, j) => row.map((p, i) => p.clone().addScaledVector(N[j][i], -h)));
  const parts = [K.gridGeometry(front, { flip: false }), K.gridGeometry(back, { flip: true })];
  const ring = (p, n, e, k) => { const a = (Math.PI * k) / edgeSegs; return p.clone().addScaledVector(n, h * Math.cos(a)).addScaledVector(e, h * Math.sin(a)); };
  // edges along u at v = -1 and v = +1
  for (const [i, sgn] of [[0, -1], [nv, 1]]) {
    const rows = [];
    for (let j = 0; j <= nu; j++) { const r = []; for (let k = 0; k <= edgeSegs; k++) r.push(ring(P[j][i], N[j][i], Dv[j][i].clone().multiplyScalar(sgn), k)); rows.push(r); }
    parts.push(K.gridGeometry(rows, { flip: sgn > 0 }));
  }
  // end caps along v at u = 0 / u = 1
  for (const [j, sgn, on] of [[0, -1, capU0], [nu, 1, capU1]]) {
    if (!on) continue;
    const rows = [];
    for (let i = 0; i <= nv; i++) { const r = []; for (let k = 0; k <= edgeSegs; k++) r.push(ring(P[j][i], N[j][i], Du[j][i].clone().multiplyScalar(sgn), k)); rows.push(r); }
    parts.push(K.gridGeometry(rows, { flip: sgn < 0 }));
  }
  return G.merge(parts);
}

// Radius of a revolved-ish cloth mesh (columns at uniform theta from theta0, rows going down) at (theta, y):
// per-column linear interpolation in y over rows [j0, j1] (y decreasing). -Infinity outside the rows' range.
function columnLookup(geo, nT, theta0, j0, j1) {
  const P = geo.attributes.position, cols = nT + 1;
  const colR = (i, y) => {
    const yTop = P.getY(j0 * cols + i), yBot = P.getY(j1 * cols + i);
    if (y > yTop || y < yBot) return -Infinity;
    let lo = j0, hi = j1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P.getY(mid * cols + i) >= y) lo = mid; else hi = mid; }
    const ka = lo * cols + i, kb = hi * cols + i;
    const ya = P.getY(ka), yb = P.getY(kb), q = clamp((ya - y) / Math.max(1e-9, ya - yb));
    return lerp(Math.hypot(P.getX(ka), P.getZ(ka)), Math.hypot(P.getX(kb), P.getZ(kb)), q);
  };
  return (theta, y) => {
    const f = ((((theta - theta0) % TAU) + TAU) % TAU) / TAU * nT;
    const i0 = Math.floor(f) % nT, i1 = (i0 + 1) % nT, w = f - Math.floor(f);
    const a = colR(i0, y), b = colR(i1, y);
    if (a === -Infinity || b === -Infinity) return Math.max(a, b);
    return lerp(a, b, w);
  };
}

// push a point radially out to at least rMin
function pushOut(p, rMin) {
  const r = Math.hypot(p.x, p.z);
  if (r < rMin && r > 1e-6) { const k = rMin / r; p.x *= k; p.z *= k; }
  return p;
}

// =====================================================================================
export function buildStrik(group, S, p, color) {
  const base = SL.wovenCloth(color);
  // the bottom 1-2 cm of the skirt sit in the floor's shade (dark contact line, no lit outline at the hem)
  const mat = base.clone(); mat.userData = { ...base.userData, floorAO: { h: 0.016, k: 0.3 } }; delete mat.userData.__hooked;
  const sashColor = p.sashColor || p.strikColor || color;
  const ribbon = sashColor === color ? base : SL.wovenCloth(sashColor);
  const { R, H } = S;
  const f = 0.0025;
  const yS = Number(p.sashY ?? H - 0.40);           // sash centre height
  const sashW = 0.056;                              // sash band width
  const yBT = yS + sashW / 2, yBB = yS - sashW / 2;
  const rC = 0.062;                                 // gathered cloth radius under the band
  const tSash = 0.0012;                             // sash / bow strip thickness (a doubled strip of the cloth)
  const rB0 = rC + 0.0052;                          // sash mid-surface
  const tb = Number(p.bowAngle ?? 24) * DEG;        // bow azimuth
  const Rg = rng(Number(p.seed ?? 7));
  const { fbm } = makeNoise2(Number(p.seed ?? 7) + 40);

  // ---- upper drape profile: top -> over the edge -> down and in -> gathered puff -> under the band
  const top = topProfile(S, f, 6, 0.002);
  const P0 = top.end, d0 = top.dir;
  const yTk = yBT + 0.016;
  const drape = bezier(P0, [P0[0] + d0[0] * 0.075, P0[1] + d0[1] * 0.075], [rC + 0.085, yTk + 0.115], [rC + 0.02, yTk], 1200);
  const tuck = bezier([rC + 0.02, yTk], [rC + 0.0135, yTk - 0.008], [rC + 0.0015, yBT + 0.003], [rC, yBT - 0.009], 22);
  const upper = resample(concat(top.pts, drape, tuck), 0.0022);
  const topLen = resample(top.pts, 0.0022).L;
  const sTk = resample(concat(top.pts, drape), 0.0022).L;
  const Lu = upper.L;

  const upF = branchingFolds(101 + Math.floor(Rg() * 1000), { nMajor: 14, theta0: Rg() * TAU, widthVar: 0.6, subMax: 3, mergeSpread: 0.4, drift: 0.07 });
  const skF = branchingFolds(202 + Math.floor(Rg() * 1000), { nMajor: 13, theta0: Rg() * TAU, widthVar: 0.8, subMax: 3, mergeSpread: 0.4, drift: 0.16, ampMin: 0.25, heightMod: 0.35 });
  const GA = 0.0072; // gather depth next to the band

  // upper drape displacement at arc length s (theta via the field evaluator)
  const upAt = (s) => {
    if (s <= topLen) return null;
    if (s >= sTk) {
      const q = clamp((s - sTk) / (Lu - sTk));
      return { A: lerp(GA, 0.0016, smoothstep(0.0, 1.0, q)), F: upF.eval(0, 1), wr: 1 - smoothstep(0, 0.8, q) };
    }
    const t = clamp((s - topLen) / (sTk - topLen));
    const A = lerp(0.026 * smoothstep(0.02, 0.42, t), GA, smoothstep(0.55, 1.0, t));
    return { A, F: upF.eval(1 - smoothstep(0.42, 0.93, t), t), wr: smoothstep(0.05, 0.4, t) };
  };
  const nT = Number(p.segments ?? 960), th0 = 200 * DEG;
  const thetas = Array.from({ length: nT }, (_, i) => th0 + (i / nT) * TAU);
  const flatEnd = upper.s.findIndex((s) => s > S.R - 0.006);
  const upRows = upper.s.slice(Math.max(0, flatEnd - 1));
  const uR = R + 0.01; // uv u in metres of cloth
  let rowCache = { s: -1, d: null };
  const upGeo = gridMesh(thetas, upRows, (th, s, o) => {
    const [r0, y] = profAt(upper, s);
    if (rowCache.s !== s) rowCache = { s, d: upAt(s) };
    const d = rowCache.d;
    let r = r0;
    if (d) {
      r += d.A * d.F(th);
      // fine secondary wrinkles along the folds (cloth, not a moulded surface)
      r += 0.0016 * d.wr * fbm(th * 9 + 3.1, y * 7.5, 3);
    }
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, (th, s) => [th * uR, s]);
  group.add(G.mesh(upGeo, mat));
  {
    const tp = resample(concat([[0, upper.pts[0][1]]], upper.pts.slice(0, Math.max(2, flatEnd + 1))), 0.01);
    const g = revolve(tp, 360);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    group.add(G.mesh(g, mat));
  }
  // first drape row below the blad's lower arris (y decreasing from here on)
  const jUp0 = upRows.findIndex((s) => profAt(upper, s)[1] < H - S.T - 0.004);
  const upR = columnLookup(upGeo, nT, th0, Math.max(0, jUp0), upRows.length - 1);

  // ---- skirt ------------------------------------------------------------------------
  const sector = TAU / S.nLegs, footOut = S.cap.c + S.cap.L / 2 + 0.008;
  const footDelta = (th) => { let d = wrapA(th - S.footAngle); d = ((d % sector) + sector) % sector; if (d > sector / 2) d -= sector; return d; };
  const footW = (th) => Math.exp(-(((footDelta(th) * footOut) / 0.065) ** 2));
  const rF = Number(p.hemR ?? 0.355);
  const NT = 14, NF = 170, NP = 4;
  const yT0 = yBB + 0.009, yT1 = yBB - 0.017;
  const colProf = (th) => {
    const fw = footW(th);
    const slack = 0.5 + 0.5 * Math.sin(2 * th + 0.4) * Math.sin(5 * th + 1.7);
    const rFl = lerp(rF + 0.025 * slack, footOut + 0.012, fw);
    const tk = bezier([rC, yT0], [rC + 0.0012, yBB - 0.004], [rC + 0.006, yT1 + 0.008], [rC + 0.012, yT1], NT);
    const c2 = [lerp(rFl - 0.055, rFl - 0.07, fw), lerp(0.24, 0.3, fw)];
    const fall = bezier([rC + 0.012, yT1], [rC + 0.027, yT1 - 0.021], c2, [rFl, 0.0013], NF);
    // slack cloth between the feet just pools: <= 3 mm on the floor
    const pl = 0.0003 + 0.003 * (1 - fw) * slack;
    const pe = fall[fall.length - 1], pool = [];
    for (let i = 1; i <= NP; i++) pool.push([pe[0] + pl * (i / NP), 0.0012]);
    return [...tk, ...fall.slice(1), ...pool];
  };
  const nRows = NT + 1 + NF + NP;
  const rowS = (j) => (j <= NT ? 0 : Math.min(1, (j - NT) / NF));
  const colCache = new Map();
  const getCol = (th) => { let c = colCache.get(th); if (!c) { c = colProf(th); colCache.set(th, c); } return c; };
  let skCache = { j: -1, F: null };
  const skirtPt = (th, j, o) => {
    const c = getCol(th);
    let [r, y] = c[j];
    const s = rowS(j);
    if (skCache.j !== j) {
      // gathers under the band (merged state 0) opening into folds that merge and grow towards the floor
      const m = j <= NT ? 0 : smoothstep(0.03, 0.4, s);
      skCache = { j, F: skF.eval(m, s) };
    }
    const fw = footW(th);
    let A;
    if (j <= NT) A = lerp(0.0016, GA, smoothstep(0.35, 1.0, j / NT));
    else A = lerp(GA, 0.016, smoothstep(0.0, 0.2, s)) + 0.012 * smoothstep(0.15, 0.85, s);
    let F = skCache.F(th);
    // a foot glide props the cloth out: a crest over the foot near the floor, the folds pulled taut there
    const kf = fw * smoothstep(0.35, 0.95, s);
    F = lerp(F, 0.6, kf);
    A *= 1 - 0.35 * kf;
    r += A * F;
    if (j > NT) r += 0.0018 * smoothstep(0.03, 0.3, s) * fbm(th * 7 + 11.3, y * 5.5, 3);
    // turned hem (2.5 cm): its doubled cloth is a touch proud of the skirt
    r += 0.0004 * smoothstep(0.028, 0.024, y) * smoothstep(0.0, 0.004, y);
    // never inside a foot glide
    const w = fw * (1 - smoothstep(0.05, 0.12, y));
    if (w > 0) r = lerp(r, smax(r, footOut, 0.012), w);
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  };
  const skGeo = gridMesh(thetas, Array.from({ length: nRows }, (_, j) => j), skirtPt, (th, j) => [th * uR, Lu + 0.06 + j * 0.004], {
    post: (pos, cols, nv, uv) => {
      for (let i = 0; i < cols; i++) {
        let acc = Lu + 0.06; uv[i * 2 + 1] = acc;
        for (let j = 1; j < nv; j++) { const a = ((j - 1) * cols + i) * 3, b = (j * cols + i) * 3; acc += Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]); uv[(j * cols + i) * 2 + 1] = acc; }
      }
    },
  });
  group.add(G.mesh(skGeo, mat));
  const skR = columnLookup(skGeo, nT, th0, 0, NT + NF);
  // the cloth surface (drape above / skirt below the band) at (theta, y)
  const clothR = (th, y) => Math.max(upR(th, y), skR(th, y));

  // ---- sash band ------------------------------------------------------------------------
  const sashFold = Array.from({ length: 4 }, () => ({ k: 2 + Math.floor(Rg() * 4), a: 0.5 + 0.8 * Rg(), p: Rg() * TAU }));
  const bandY = (th) => { const nk = Math.exp(-((wrapA(th - tb) / 0.3) ** 2)); return { nk, w: sashW * (1 - 0.3 * nk) * (1 + 0.04 * Math.sin(3 * th + 1.1)), yc: yS + 0.0024 * Math.sin(th + 0.7) + 0.0011 * Math.sin(2 * th + 2.3) + 0.0018 * nk }; };
  const bandMid = (u, v, o) => {
    const th = tb + u * TAU;
    const dk = wrapA(th - tb);
    const { nk, w, yc } = bandY(th);
    let fold = 0; for (const q of sashFold) fold += q.a * Math.sin(Math.PI * v * 1.25 + q.k * th + q.p);
    let r = rB0 + 0.0006 * fold * (1 - v * v) * (1 - nk) - 0.00025 * v ** 4
      + nk * 0.002 * Math.sin(v * Math.PI * 2.1 + dk * 10) * (1 - v * v); // bunching into the knot
    const y = yc + v * w / 2;
    // never into the cloth it is tied round: rides over the gather crests at its edges
    const rc = clothR(th, y);
    if (rc > -1) r = smax(r, rc + tSash / 2 + 0.0008, 0.0025);
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  };
  group.add(G.mesh(clothStrip(bandMid, 720, 14, tSash, { closedU: true }), ribbon));
  const bandR = (th, y) => {
    const { w, yc } = bandY(th);
    if (Math.abs(y - yc) > w / 2 + 0.002) return -Infinity;
    return Math.max(rB0 + 0.0022, clothR(th, y)) + tSash;
  };
  const outerR = (th, y) => Math.max(clothR(th, y), bandR(th, y));

  // ---- bow ------------------------------------------------------------------------------
  const Y = V3(0, 1, 0);
  const nrm = V3(Math.sin(tb), 0, Math.cos(tb)), tan = V3(Math.cos(tb), 0, -Math.sin(tb));
  const knotC = nrm.clone().multiplyScalar(rB0 + 0.0165).setY(yS + 0.002);
  const thOf = (q) => Math.atan2(q.x, q.z);

  // open loop: strip (u along the ribbon: knot -> front strand -> turn -> back strand -> knot, v across)
  const loopMid = (L) => {
    const A = tan.clone().multiplyScalar(L.side * Math.cos(L.beta)).addScaledVector(Y, Math.sin(L.beta)).addScaledVector(nrm, L.out).normalize();
    let Nn = nrm.clone().addScaledVector(A, -nrm.dot(A)).normalize();
    let W0 = V3().crossVectors(A, Nn).normalize();
    if (W0.y < 0) W0.negate();
    // tip the loop about its axis: its upper opening turns towards the camera (the inner face of the back strand shows)
    const W = W0.clone().multiplyScalar(Math.cos(L.rho)).addScaledVector(Nn, Math.sin(L.rho)).normalize();
    Nn = V3().crossVectors(W, A).normalize();
    if (Nn.dot(nrm) < 0) Nn.negate();
    const Rl = rng(31 + L.seed), pp = Rl() * TAU, pq = Rl() * TAU, cr = { a0: 0.1 + 0.05 * Rl(), v0: 0.65, a1: 0.82, v1: -0.5 + 0.2 * Rl() };
    const C = V3(), Wv = V3(), nR = V3();
    return (u, v, o) => {
      const phi = u * TAU, sn = Math.sin(phi);
      const a = (L.Lx * (1 - Math.cos(phi))) / 2, al = a / L.Lx;
      const pinch = Math.pow(al, 0.42);
      const z = (sn >= 0 ? 1 : 0.7) * sn * (L.D / 2) * pinch + L.delta * Math.cos(phi / 2);
      C.copy(knotC).addScaledVector(A, a + 0.003).addScaledVector(Nn, z).addScaledVector(Y, -L.droop * al * al - (sn < 0 ? 0.004 * Math.sin(Math.PI * al) : 0));
      // the strip flares a little and turns on its length towards the far end
      const tw = L.twist * Math.sin(Math.PI * al) * (sn >= 0 ? 1 : 0.6);
      Wv.copy(W).multiplyScalar(Math.cos(tw)).addScaledVector(Nn, Math.sin(tw));
      // fans out of the knot over most of the loop, fullest just before the turn
      const w = lerp(0.018, L.w1, smoothstep(0.0, 0.62, al)) * (1 + 0.08 * smoothstep(0.6, 0.95, al)) * (sn >= 0 ? 1 : lerp(1, 0.9, Math.sin(Math.PI * al)));
      // the ribbon's own outward normal: strands -> +-Nn, turn -> +A
      nR.copy(Nn).multiplyScalar(Math.cos(phi / 2)).addScaledVector(A, Math.sin(phi / 2)).normalize();
      let dn = 0;
      // soft cloth: each strand cups outwards across its width (the loop has volume, not a flat strap)
      dn += L.cup * (1 - v * v) * Math.sin(Math.PI * Math.min(1, al * 1.15)) * (sn >= 0 ? 1 : 0.6);
      // pinched into the knot: the width gathered into pleats
      dn += 0.0024 * (1 - smoothstep(0.0, 0.42, al)) * Math.sin(v * Math.PI * 2.6 + pp + (sn >= 0 ? 0 : 1.3));
      // soft lengthwise folds over the loop
      dn += 0.0013 * Math.sin(v * 3.4 + pq + al * 2.6) * Math.sin(Math.PI * Math.min(1, al * 1.3));
      // pinch crease on the front strand: a valley from the knot towards the far lower corner, a ridge beside it
      if (sn > 0) {
        const ex = cr.a1 - cr.a0, ey = cr.v1 - cr.v0, l = Math.hypot(ex, ey);
        const dist = ((al - cr.a0) * ey - (v - cr.v0) * ex) / l;
        const along = ((al - cr.a0) * ex + (v - cr.v0) * ey) / (l * l);
        const fade = smoothstep(-0.05, 0.15, along) * (1 - smoothstep(0.75, 1.1, along)) * Math.sqrt(Math.max(0, 1 - v * v));
        dn += (-0.0032 * Math.exp(-((dist / 0.1) ** 2)) + 0.0014 * Math.exp(-(((dist + 0.16) / 0.08) ** 2))) * fade * sn;
      }
      // irregular soft creases (cloth, not a moulded strip)
      dn += 0.0011 * fbm(al * 6 + L.seed * 3.1, v * 1.6 + (sn >= 0 ? 0 : 5.3), 3) * Math.sin(Math.PI * Math.min(1, al * 1.2));
      // edges wave a little
      const ew = 0.0015 * Math.pow(Math.abs(v), 4) * Math.sin(al * 9 + L.seed + (v > 0 ? 0 : 2.1)) * Math.sin(Math.PI * al);
      // rounded far end: the corners of the turn roll back towards the knot
      const roll = -0.3 * w * v * v * smoothstep(0.72, 1, al);
      o.copy(C).addScaledVector(Wv, (v * w) / 2 + ew).addScaledVector(nR, dn).addScaledVector(A, roll);
      // never into the drape behind it
      const rMin = outerR(thOf(o), o.y) + tSash / 2 + 0.0008;
      if (rMin > -1) pushOut(o, rMin);
      return o;
    };
  };
  const loops = [
    { side: -1, Lx: 0.135, beta: 21 * DEG, out: 0.18, D: 0.05, w1: 0.066, droop: 0.014, rho: 29 * DEG, delta: 0.005, twist: 0.25, cup: 0.0045, seed: 1 },
    { side: 1, Lx: 0.145, beta: 14 * DEG, out: 0.15, D: 0.054, w1: 0.068, droop: 0.02, rho: 25 * DEG, delta: 0.005, twist: -0.3, cup: 0.005, seed: 2 },
  ];
  for (const L of loops) group.add(G.mesh(clothStrip(loopMid(L), 150, 22, tSash), ribbon));

  // knot: a short band wrapped round the loop roots (u round, v across along the sash)
  {
    const hy = 0.025, hz = 0.016, hw = 0.019;
    const Rk = rng(77);
    const lump = Array.from({ length: 5 }, () => ({ k: 1 + Math.floor(Rk() * 3), a: (Rk() - 0.5) * 0.06, p: Rk() * TAU, q: (Rk() - 0.5) * 3 }));
    const knotMid = (u, v, o) => {
      const ps = u * TAU + Math.PI, c = Math.cos(ps), sn = Math.sin(ps); // seam at the back (hidden)
      // flared edges over the loop roots, pulled tight in the middle of the front
      let k = 1 + 0.1 * Math.pow(Math.abs(v), 3) - 0.05 * (1 - v * v) * Math.max(0, sn * sn);
      // a diagonal wrap crease across the front and a soft ridge beside it
      const xd = v - (0.55 * sn + 0.05);
      k += (-0.075 * Math.exp(-((xd / 0.17) ** 2)) + 0.045 * Math.exp(-(((xd - 0.34) / 0.15) ** 2))) * Math.max(0, c);
      for (const q of lump) k += q.a * Math.sin(q.k * ps + q.p + q.q * v);
      const back = c < 0 ? 0.5 : 1;
      // the band sits a little rolled (not square to the sash) and bulges over the bundle inside it
      const roll = 0.14, yy = sn * hy * k, xx = v * hw * (1 + 0.07 * sn) + 0.0022 * sn;
      o.copy(knotC)
        .addScaledVector(tan, xx * Math.cos(roll) - yy * Math.sin(roll) * 0.35)
        .addScaledVector(Y, yy * Math.cos(roll) + xx * Math.sin(roll))
        .addScaledVector(nrm, c * hz * k * back * (1 + 0.12 * (1 - v * v)));
      return o;
    };
    group.add(G.mesh(clothStrip(knotMid, 120, 18, tSash, { closedU: true }), ribbon));
  }

  // tails: from under the knot over the band and down the skirt; soft twist, lengthwise fold, clean V cut
  const tailMid = (T) => {
    const Rt = rng(50 + T.seed), foldX = (Rt() - 0.5) * 0.7, sway = Rt() * TAU;
    const yTop = yS + 0.01; // well up behind the knot band
    const C = V3(), Tn = V3(), Nr = V3(), B = V3();
    const center = (d, out) => {
      const yy = yTop - d;
      const r0 = Math.max(rB0 + 0.006, outerR(tb, Math.max(0.01, yy)));
      const th = tb + T.side * (0.0095 + T.drift * Math.pow(d / T.len, 0.85) + 0.01 * Math.sin((d / T.len) * 4 + sway) * smoothstep(0.05, 0.3, d / T.len)) / r0;
      const rr = Math.max(0.05, outerR(th, Math.max(0.01, yy)));
      // swings clear of the band under the knot, then rests on the skirt
      const lift = 0.0016 + T.top + 0.008 * (1 - smoothstep(0.0, 0.085, d)) + T.off * smoothstep(0.5, 1, d / T.len);
      return out.set(Math.sin(th) * (rr + lift), yy, Math.cos(th) * (rr + lift));
    };
    const cA = V3(), cB = V3();
    return (u, v, o) => {
      // V cut: the strip ends on a V (notch in the middle), straight cut edges
      const dEnd = T.len - T.notch * (1 - Math.abs(v));
      const d = u * dEnd;
      center(d, C);
      center(Math.min(T.len, d + 0.003), cA); center(Math.max(0, d - 0.003), cB);
      Tn.subVectors(cA, cB).normalize();
      Nr.set(C.x, 0, C.z).normalize(); Nr.addScaledVector(Tn, -Nr.dot(Tn)).normalize();
      B.crossVectors(Tn, Nr).normalize();
      const s = d / T.len;
      // twist: a quarter turn out of the knot, flat over the band, then a soft turn towards the end
      const tw = T.side * (0.3 * (1 - smoothstep(0.0, 0.06, d)) + T.twEnd * smoothstep(0.3, 0.95, s));
      const w = lerp(0.018, T.w1, smoothstep(0, 0.2, s)) * (1 - 0.1 * Math.sin(Math.PI * smoothstep(0.1, 0.8, s)));
      const xw = (v * w) / 2;
      // the twist hinges on the edge that lies on the skirt: the other edge lifts off (nothing turns into the
      // cloth under it, so no corner is pushed out into a spike)
      const hinge = (xw * Math.sign(tw) + w / 2) * Math.sin(Math.abs(tw));
      // lengthwise soft fold and slightly curled edges
      const dn = 0.003 * Math.exp(-(((v - foldX) / 0.32) ** 2)) * smoothstep(0.06, 0.2, s) * (1 - 0.5 * smoothstep(0.7, 1, s))
        + 0.0012 * Math.pow(Math.abs(v), 4);
      o.copy(C).addScaledVector(B, xw * Math.cos(tw)).addScaledVector(Nr, dn + hinge);
      // a ribbon bridges the folds under it: envelope of the cloth across its width, falling off with the
      // distance from this point (stiffness), so the strip lies over the crests without spikes at its corners
      const yy = Math.max(0.006, o.y), thP = thOf(o), rP = Math.hypot(o.x, o.z);
      let env = -Infinity;
      for (let k = 0; k <= 12; k++) {
        const ds = ((k / 12) * 2 - 1) * (w * 0.6);
        const rk = outerR(thP + ds / Math.max(0.05, rP), yy);
        if (rk > -1) env = Math.max(env, rk - 9 * ds * ds);
      }
      if (env > -1) pushOut(o, env + tSash / 2 + 0.0009);
      return o;
    };
  };
  const tails = [
    { side: -1, len: 0.34, drift: 0.05, w1: 0.054, notch: 0.024, twEnd: -0.45, off: 0.004, top: 0.0026, seed: 1 },
    { side: 1, len: 0.41, drift: 0.085, w1: 0.056, notch: 0.024, twEnd: 0.35, off: 0.003, top: 0, seed: 2 },
  ];
  for (const T of tails) group.add(G.mesh(clothStrip(tailMid(T), 170, 20, tSash, { capU0: true, capU1: true }), ribbon));

  // ---- probes / views ---------------------------------------------------------------------
  const pU = (thd, t) => { const s = topLen + t * (sTk - topLen); const [, y] = profAt(upper, s); const th = thd * DEG; const r = upR(th, y); return [Math.sin(th) * r, y, Math.cos(th) * r]; };
  const pK = (thd, t) => { const o = V3(); skirtPt(thd * DEG, NT + Math.round(t * NF), o); return o.toArray(); };
  const probes = {
    top: [[Math.sin(34 * DEG) * 0.15, H + f + 0.002, Math.cos(34 * DEG) * 0.15]],
    topRing: Array.from({ length: 32 }, (_, i) => [Math.sin((i / 32) * TAU) * R * 0.85, H + f + 0.002, Math.cos((i / 32) * TAU) * R * 0.85]),
    upperLit: [pU(-20, 0.35), pU(-6, 0.45), pU(4, 0.35)],
    upperFront: [pU(40, 0.4), pU(50, 0.5)],
    upperShade: [pU(90, 0.4), pU(100, 0.5)],
    skirtLit: [pK(-15, 0.5), pK(-5, 0.6)],
    skirtFront: [pK(40, 0.45), pK(55, 0.55)],
    skirtShade: [pK(95, 0.5), pK(105, 0.6)],
    bow: [knotC.toArray()],
    floorOpen: [[Math.sin(-30 * DEG) * 0.75, 0.001, Math.cos(-30 * DEG) * 0.75]],
  };
  return {
    probes,
    detail: { target: [knotC.x * 1.1, yS - 0.02, knotC.z * 1.1], size: 0.34, azimuth: 26, elevation: 8 },
  };
}
