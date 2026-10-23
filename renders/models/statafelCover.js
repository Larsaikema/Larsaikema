// Statafel covers, fitted over the parametric statafel (base 'klap', 4 legs).
//
// type 'stretch' : statafelrok of polyester-elastane single jersey (statafelLook.jerseyKnit: knit
//                  normal, macro grain + mottle, dye-tinted sheen, softened at grazing view). Construction: a
//                  round top panel sewn to the body on the shoulder of the blad edge (a fine pressed-in seam
//                  line, no welt); the jersey wraps the 18 mm edge as a rounded bullnose, leaves the lower
//                  arris in a funnel to a tight waist on the column and flares to the four feet (the ridges
//                  over the legs rounded to a constant bending radius).
//                  Fabric under tension: fine radial strain lines from the rim into the waist, irregular
//                  compression rumples at the waist, diagonal pull lines from the waist into each foot.
//                  Each foot sits in an elastic foot pocket (the fabric wraps the foot glide; pocket seam
//                  and the glide's sole just visible); between the feet the turned hem (2 cm, coverstitched,
//                  thin folded edge) lifts in a clean arch. Optional topcover (contrast colour / print):
//                  a separate cap over the blad and its edge, elastic edge just under the rim.
// type 'strik'   : loose woven polyester cover gathered at the waist with a sash tied in a bow,
//                  full skirt to the floor (strikCover.js: branching gathers all round, open bow loops,
//                  a knot band, twisted V-cut tails, all with real cloth thickness).
// type 'kleed'   : round tablecloth over the top, draping to the floor in folds; square: side (m) for a square
//                  kleed (140 x 140 cm on a Ø80 blad: shorter on the sides, four points that hang lower).
//
// Views: 'detail' = stretch: the rim (top seam, knit) and the upper funnel with its strain lines; strik:
// the bow. 'detail-voet' (stretch) = a foot pocket. 'detail-taille' (stretch) = the waist.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as SL from '../js/statafelLook.js';
import { rng } from '../js/rng.js';
import { statafel, statafelDims } from './statafel.js';
import { resolvePrint, artTexture, decalMaterial } from '../js/printDecal.js';
import { buildStrik as buildStrikR5 } from './strikCover.js';

const { V3, lerp, clamp, smoothstep } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const wrapA = (a) => a - TAU * Math.round(a / TAU);

// ---- profile helpers ------------------------------------------------------------
export function bezier(p0, p1, p2, p3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return pts;
}
export function arc(cx, cy, r, a0, a1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
export function concat(...lists) {
  const out = [];
  for (const l of lists) for (const p of l) { const q = out[out.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) out.push(p); }
  return out;
}
// resample a polyline to (roughly) uniform arc length; returns pts + cumulative s
export function resample(pts, step) {
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
// point on a resampled profile at arc length s (linear)
export function profAt(prof, s) {
  const n = prof.pts.length - 1;
  const f = clamp(s / prof.L) * n, i = Math.min(n - 1, Math.floor(f)), w = f - i;
  return [lerp(prof.pts[i][0], prof.pts[i + 1][0], w), lerp(prof.pts[i][1], prof.pts[i + 1][1], w)];
}

// The overlocked seam between the stretch rok's top panel and its body, seen from outside (round 5): a fine
// groove on the seam line, the seam allowance (pressed down onto the body) as a soft welt beside it, a smaller
// one on the top side, and slight puckering along the seam (knit sewn under tension). s = distance (m) from
// the seam line along the cloth, side = +1 body, -1 top panel; th = azimuth. Displacement along the normal (m).
export function seamD(s, side, th) {
  const welt = (side > 0 ? 0.0006 : 0.0003) * Math.exp(-(((s - (side > 0 ? 0.0018 : 0.0012)) / (side > 0 ? 0.0014 : 0.0009)) ** 2));
  const groove = -0.0005 * Math.exp(-((s / 0.00045) ** 2));
  const pucker = 0.00022 * Math.sin(th * 260 + 1.7 * Math.sin(th * 31) + 0.8 * Math.sin(th * 7)) * Math.exp(-s / 0.0028);
  return welt + groove + pucker;
}

// Revolve a profile [r,y] around Y; disp(theta, i, prof) -> [dr, dy].
export function revolve(prof, nTheta, disp = null, { theta0 = 0 } = {}) {
  const { pts, s } = prof;
  const nv = pts.length - 1;
  const g = G.surface((u, v, out) => {
    const i = Math.round(v * nv);
    const th = theta0 + u * TAU;
    let [r, y] = pts[i];
    if (disp) { const [dr, dy] = disp(th, i, prof); r += dr; y += dy; }
    out.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, nTheta, nv, { closedU: true, flipNormals: true });
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

// Grid mesh from a point function over (theta columns, row params): pf(theta, row, outVec3) and
// uvf(theta, row) -> [u, v]. Columns close around (last column = first + 2 pi). Normals outward when
// rows run down the profile (flip).
export function gridMesh(thetas, rows, pf, uvf, { flip = true, post = null } = {}) {
  const nu = thetas.length, nv = rows.length, cols = nu + 1;
  const pos = new Float32Array(cols * nv * 3), uv = new Float32Array(cols * nv * 2);
  const p = V3();
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      pf(thetas[i], rows[j], p);
      const k = j * cols + i;
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      const [a, b] = uvf(thetas[i], rows[j]); uv[k * 2] = a; uv[k * 2 + 1] = b;
    }
    const k0 = j * cols, k1 = j * cols + nu;
    pos[k1 * 3] = pos[k0 * 3]; pos[k1 * 3 + 1] = pos[k0 * 3 + 1]; pos[k1 * 3 + 2] = pos[k0 * 3 + 2];
    const [a, b] = uvf(thetas[0] + TAU, rows[j]); uv[k1 * 2] = a; uv[k1 * 2 + 1] = b;
  }
  const idx = [];
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu; i++) {
    const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  // post(pos, cols, nv, uv): a pass over the finished grid (e.g. smoothing, uv) before the normals are computed
  if (post) post(pos, cols, nv, uv);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let j = 0; j < nv; j++) {
    const a = j * cols, b = a + nu;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}
// Column angles with extra density where `dens(theta)` > 1 (periodic), starting at theta0.
function warpedThetas(n, dens, theta0 = 0) {
  const M = 4096, cdf = [0];
  for (let i = 0; i < M; i++) cdf.push(cdf[i] + dens(theta0 + ((i + 0.5) / M) * TAU));
  const tot = cdf[M], out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / n) * tot;
    while (j < M && cdf[j + 1] < target) j++;
    const w = (target - cdf[j]) / Math.max(1e-12, cdf[j + 1] - cdf[j]);
    out.push(theta0 + ((j + w) / M) * TAU);
  }
  return out;
}
// Rounded-box signed distance (half extents h, rounding r) in local coords q.
function sdRoundBox(qx, qy, qz, hx, hy, hz, r) {
  const dx = Math.abs(qx) - hx + r, dy = Math.abs(qy) - hy + r, dz = Math.abs(qz) - hz + r;
  const ox = Math.max(dx, 0), oy = Math.max(dy, 0), oz = Math.max(dz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(dx, dy, dz), 0) - r;
}

// ---- cover builders --------------------------------------------------------------
export function statafelCover(p = {}) {
  const type = (p.type || 'stretch').toLowerCase();
  const tableParams = { diameter: p.diameter ?? 0.8, height: p.height ?? 1.10, top: p.tableTop || 'berken', frame: p.frame || 'zwart', base: 'klap', legs: p.legs ?? 4, footAngle: p.footAngle ?? 45 };
  const S = statafelDims(tableParams);
  const group = new THREE.Group();
  const color = p.color || 'zwart';
  group.name = `statafelCover ${type} ${color}`;
  let detail, details, probes = {};
  if (type === 'kleed') {
    // drop (m): a short kleed (Ø130 on Ø80 = 25 cm overhang) instead of one to the floor; over: 'stretch' puts the
    // statafel with a stretchrok (underColor, no topcover) underneath, the way a statafelkleed is used
    if (p.over === 'stretch') {
      group.add(statafel(tableParams).object);
      buildStretch(group, S, { ...p, topcover: false, print: null }, p.underColor || 'zwart');
    }
    buildKleed(group, S, p, color);
    detail = { target: [Math.sin(34 * DEG) * S.R * 0.9, S.H - 0.12, Math.cos(34 * DEG) * S.R * 0.9], size: 0.55, azimuth: 34, elevation: 14 };
  } else {
    const t = statafel(tableParams);
    group.add(t.object);
    if (type === 'strik' || type === 'bow') {
      const r = buildStrikR5(group, S, p, color);
      detail = r.detail; probes = r.probes || {};
    } else {
      const r = buildStretch(group, S, p, color);
      detail = r.detail; details = r.details; probes = r.probes;
    }
  }
  // value control: exposure from the cover's albedo; white and black get their own fill balance
  const albedoL = SL.clothAlbedo(color).r * 0.2126 + SL.clothAlbedo(color).g * 0.7152 + SL.clothAlbedo(color).b * 0.0722;
  const rig = SL.statafelRig({ albedoL, white: albedoL > 0.5, black: albedoL < 0.05, chroma: SL.dyeChroma(color) });
  // soft goods: the parts that face down (the stretch funnel under the blad, the strik drape) sit in
  // the blad's shadow; a large white floor card front-left, below the product, opens them up
  rig.default.bounce = { azimuth: -28, elevation: -22, intensity: albedoL > 0.5 ? 2.0 : albedoL < 0.05 ? 3.2 : 1.9 };
  // white: exposed so the lit cloth sits at ~232-242 (not paper white at 248+) and the top (overhead box)
  // a touch above it; fill and floor card kept low, so the folds turned away from the key keep a real
  // midtone range (form) instead of being flattened to an even white
  // (the overhead box a little lower for white: the top stays at ~238-242 at this exposure while the floor card
  // lifts the drape under the blad, which faces down and sees little else)
  if (albedoL > 0.5) {
    rig.default.fill = { ...rig.default.fill, intensity: 0.75 }; rig.default.exposure = 0.74;
    rig.default.bounce = { ...rig.default.bounce, intensity: 3.5 };
    rig.default.overhead = { ...rig.default.overhead, intensity: 1.8 };
    // a softer key from further round to the side: the folds on the lit side are raked (modelling) instead of
    // being lit head-on to an even paper white
    rig.default.key = { ...rig.default.key, azimuth: -66, elevation: 34, intensity: 1.7 };
  }
  // strik (white woven cloth, round 5): about a third of a stop down and a raking key from further round, a weak
  // floor card: the lit side of the drape keeps fold shading and the rim and top separate from the backdrop
  if ((type === 'strik' || type === 'bow') && albedoL > 0.5) {
    rig.default.exposure = 0.75;
    rig.default.key = { ...rig.default.key, azimuth: -78, elevation: 26, intensity: 2.1 };
    rig.default.bounce = { ...rig.default.bounce, intensity: 2.2 };
    rig.default.fill = { ...rig.default.fill, intensity: 0.6 };
    rig.default.overhead = { ...rig.default.overhead, intensity: 1.0 };
  }
  // black: a stronger, closer overhead box, so the falloff over the top reads in the low values of black cloth
  if (albedoL < 0.05) { rig.default.exposure *= 1.06; rig.default.overhead = { ...rig.default.overhead, intensity: 2.6, distance: 1.05 }; if (type !== 'kleed') rig.default.envStudio = SL.STATAFEL_ENV_BLACK; }
  // a lighter topcover (or a printed one, white base) on a dark rok: expose for the lighter cloth so the
  // top keeps its shading instead of clipping to paper white; the dark rok stays readable at that exposure
  if (type !== 'kleed' && type !== 'strik' && type !== 'bow' && p.topcover) {
    const tcColor = p.topcoverPrint ? 'wit' : typeof p.topcover === 'string' ? p.topcover : p.topcoverColor || 'wit';
    const ca = SL.clothAlbedo(tcColor), tcL = ca.r * 0.2126 + ca.g * 0.7152 + ca.b * 0.0722;
    if (tcL > albedoL * 1.5) rig.default.exposure = Math.min(rig.default.exposure, SL.statafelRig({ albedoL: tcL, white: tcL > 0.5 }).default.exposure * 1.04);
  }
  return { object: group, detail, details, meta: { type, color, D: S.D, probes }, rig };
}

export function topProfile(S, f, gammaDeg, extraRim = 0) {
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

// =====================================================================================
// Stretch statafelrok
function buildStretch(group, S, p, color) {
  let mat = SL.jerseyKnit(color);
  if (p.knitLook) {
    // look-development override: {roughness, sheen, sheenColor (grey level or hex), normal, specularIntensity, envSpec}
    const k = p.knitLook;
    const orig = mat;
    mat = mat.clone(); mat.userData = { ...orig.userData }; delete mat.userData.__hooked; // (clone() JSON-copies userData: the macro texture would be lost)
    if (k.roughness != null) mat.roughness = k.roughness;
    if (k.sheen != null) mat.sheen = k.sheen;
    if (k.sheenRoughness != null) mat.sheenRoughness = k.sheenRoughness;
    if (k.sheenColor != null) mat.sheenColor = typeof k.sheenColor === 'number' ? new THREE.Color().setRGB(k.sheenColor, k.sheenColor, k.sheenColor * 1.04) : new THREE.Color(k.sheenColor);
    if (k.normal != null) mat.normalScale.set(k.normal, k.normal);
    if (k.specularIntensity != null) mat.specularIntensity = k.specularIntensity;
    if (k.envSpec != null) mat.userData.envSpec = k.envSpec;
    if (k.boost != null) mat.userData.weave = { ...mat.userData.weave, boost: k.boost };
    if (k.anisotropy != null) mat.anisotropy = k.anisotropy;
    if (k.streak != null) mat.userData.streak = k.streak === false ? undefined : { ...mat.userData.streak, ...k.streak };
  }
  const thr = SL.thread(color);
  // the flat top panel and the seam welt: isotropic lobe, no streak field (planar uv)
  const matTop = p.knitLook ? mat : SL.jerseyKnit(color, { flat: true });
  const { R, H, T } = S;
  const f = 0.0022;                                  // fabric thickness / offset from the table
  const yW = Number(p.waistY ?? 0.6 * H), rW = Number(p.waistR ?? 0.056);
  const n = S.nLegs, sector = TAU / n;
  const Rg = rng(Number(p.seed ?? 11));
  // the jersey wraps the 18 mm blad edge as a rounded bullnose: under tension it bridges the 4.5 mm arrises
  // with larger radii (upper 8 mm, lower 9 mm; the birch's 2.5 mm arrises stay >= 0.3 mm inside), so the edge reads as one
  // soft rounded band (~22 mm, catching a soft highlight) instead of a thin plate on a cone
  const rhoU = 0.008, rhoL = 0.009;
  const cxU = R + f - rhoU, cyU = H + f - rhoU;      // upper bullnose arc centre
  const cxL = R + f - rhoL, cyL = H - T - f + rhoL;  // lower arc centre
  const seamA = 42 * DEG;                            // top seam on the shoulder of the bullnose
  const gDep = 52 * DEG;                             // the body leaves the lower arris at this angle

  // ---- upper profile (axisymmetric): seam -> edge -> lower arris -> funnel -> waist
  const arcU = arc(cxU, cyU, rhoU, seamA, 0, 14);
  const arcL = arc(cxL, cyL, rhoL, 0, -gDep, 18);
  const P0 = arcL[arcL.length - 1], d0 = [-Math.sin(gDep), -Math.cos(gDep)];
  const span = Math.hypot(rW - P0[0], yW - P0[1]);
  // densely sampled (0.3 mm): a 160-point polyline had a slope kink every ~4 mm, which the glossier jersey
  // mirrored as fine horizontal bands across the funnel
  const funnel = bezier(P0, [P0[0] + d0[0] * span * 0.42, P0[1] + d0[1] * span * 0.42], [rW, yW + span * 0.44], [rW, yW], 2400);
  const up = resample(concat(arcU, arcL, funnel), 0.0012);
  const sDep = resample(concat(arcU, arcL), 0.0012).L;
  const Lup = up.L;
  mat = SL.withStreakEnd(mat, Lup - 0.03, Lup + 0.05);

  // ---- feet, pockets, hem ------------------------------------------------------
  const footDelta = (th) => { let d = wrapA(th - S.footAngle); d = ((d % sector) + sector) % sector; if (d > sector / 2) d -= sector; return d; };
  const cap = S.cap;
  // Elastic foot pocket: in a foot's frame (a radial, b lateral) its walls run round the glide in a U
  // (open to the back, where the leg comes in) from the pocket seam (ySeam) down to the elastic edge
  // just above the floor (yPB); the skirt comes down onto the seam line from above.
  // seam just above the glide (4.6 cm): the pocket is a short elastic sock over the glide, not a box
  const ySeam = 0.056, yPB = 0.0085;
  const uTable = (front, A, B, back) => {
    const tab = [];
    const sFront = (Math.PI / 2) * A, sSide = (front - A) - back, tot = sFront + sSide;
    for (let i = 0; i <= 400; i++) {
      const d = (i / 400) * tot;
      let a, b2;
      if (d <= sFront) { const ph = d / A; a = front - A + A * Math.cos(ph); b2 = B * Math.sin(ph); }
      else { a = front - A - (d - sFront); b2 = B; }
      tab.push({ dl: Math.atan2(b2, a), r: Math.hypot(a, b2) });
    }
    return tab;
  };
  const tabR = (tab, ad) => {
    if (ad >= tab[tab.length - 1].dl) return tab[tab.length - 1].r;
    let i = 1; while (i < tab.length - 1 && tab[i].dl < ad) i++;
    const a0 = tab[i - 1], a1 = tab[i], w = clamp((ad - a0.dl) / Math.max(1e-9, a1.dl - a0.dl));
    return lerp(a0.r, a1.r, w);
  };
  const back = cap.c - cap.L / 2 - 0.006;
  const PKT = uTable(cap.c + cap.L / 2 + f + 0.0045, 0.021, cap.W / 2 + f + 0.005, back);   // at the seam (a little loose)
  const PKB = uTable(cap.c + cap.L / 2 + f + 0.0016, 0.019, cap.W / 2 + f + 0.0022, back); // elastic edge (hugs the glide)
  const dMax = PKT[PKT.length - 1].dl, rBack = PKT[PKT.length - 1].r;
  const lift = Number(p.hemLift ?? 0.115);
  const lamMax = lift / (yW - ySeam);
  const hc = sector / 2 - dMax;
  const tB = 0.88; // lower-zone parameter of the bend (pocket seam / start of the hem band)
  // per column: bend point E (end of the skirt proper), hem point F (bottom edge), pocket weight pw,
  // m = 0 at a pocket corner .. 1 mid-panel
  function hemAt(th, out) {
    const dl = footDelta(th), ad = Math.abs(dl);
    // free hem: chord between the pockets' back corners, lifted towards the waist in an arch
    // C1-smooth at the pocket corner (a kink in m or in max() here runs up the whole panel as a crease
    // line from the pocket to the waist, which caught the key as a hairline 'glass edge')
    const xm = (ad - dMax) / hc, km = 0.09;
    const m = Math.min(1, xm <= -km ? 0 : xm < km ? ((xm + km) ** 2) / (4 * km) : xm);
    const adS = (ad + dMax + Math.sqrt((ad - dMax) ** 2 + 0.0004)) / 2;
    const psi = sector / 2 - adS;
    const rCh = rBack * Math.cos(hc) / Math.cos(psi);
    // arch lift, a little different per panel (hand-sewn, stretched by hand)
    const lam = lamMax * (1 + 0.07 * Math.sin(2 * th + 0.6) + 0.04 * Math.sin(5 * th + 2.1)) * Math.pow(Math.sin((Math.PI / 2) * m), 0.8);
    const Fr = lerp(rCh, rW, lam), Fy = lerp(ySeam, yW, lam);
    let Er = rW + (Fr - rW) * 0.9, Ey = yW + (Fy - yW) * tB;
    let fr = Fr, fy = Fy;
    // pocket: the wall from the seam (E) down to the elastic edge (F), fading out over its back corner
    const pw = 1 - smoothstep(dMax - 0.018, dMax + 0.05, ad);
    if (pw > 0) {
      const ac = Math.min(ad, dMax);
      Er = lerp(Er, tabR(PKT, ac), pw); Ey = lerp(Ey, ySeam, pw);
      fr = lerp(fr, tabR(PKB, ac), pw); fy = lerp(fy, yPB + 0.003 * (ac / dMax) ** 2, pw);
    }
    out.Er = Er; out.Ey = Ey; out.Fr = fr; out.Fy = fy; out.pw = pw; out.m = m; out.dl = dl;
    return out;
  }
  const gOn = (t) => { const a = 0.2; return (t < a ? (t * t) / (2 * a) : t - a / 2) / (1 - a / 2); };

  // ---- base surface: rho in [0, 1] upper (s = rho * Lup), [1, 2] lower (t = rho - 1)
  const hm = { Er: 0, Ey: 0, Fr: 0, Fy: 0, pw: 0, m: 0, dl: 0 };
  const info = { r: 0, y: 0, zone: 0, s: 0, q: 0, t: 0, pw: 0, m: 0, dh: 0, dl: 0 };
  // lower profile (unrounded) at t in [0, 1]: waist -> bend E (tB) -> hem / pocket edge F
  const segPt = (t, o) => {
    const lEF = Math.hypot(hm.Fr - hm.Er, hm.Fy - hm.Ey);
    if (t <= tB) {
      const u = t / tB;
      o[0] = rW + (hm.Er - rW) * gOn(u);
      o[1] = yW + (hm.Ey - yW) * u;
      // panels pull slightly concave between the corner ridges
      // (eased in from the waist: no crease line where the skirt leaves the waist)
      o[0] -= 0.008 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * smoothstep(0, 0.3, u) * Math.pow(hm.m, 1.2);
      o[2] = lEF + (1 - u) * Math.hypot(hm.Er - rW, hm.Ey - yW) * 1.02;
    } else {
      const u = (t - tB) / (1 - tB);
      o[0] = lerp(hm.Er, hm.Fr, u); o[1] = lerp(hm.Ey, hm.Fy, u);
      // the pocket wall bellies a little over the glide, the elastic pulls its edge in
      o[0] += hm.pw * 0.0022 * Math.sin(Math.PI * u) - hm.pw * 0.0012 * smoothstep(0.85, 1, u);
      o[2] = (1 - u) * lEF;
    }
    return o;
  };
  const sA = [0, 0, 0], sB = [0, 0, 0], sC = [0, 0, 0];
  function base(th, rho, out) {
    let r, y;
    if (rho <= 1) {
      const s = rho * Lup;
      [r, y] = profAt(up, s);
      info.zone = 0; info.s = s; info.q = s <= sDep ? 0 : (s - sDep) / (Lup - sDep); info.t = 0; info.pw = 0; info.dh = 1; info.dl = footDelta(th);
    } else {
      const t = Math.min(1, rho - 1);
      hemAt(th, hm);
      segPt(t, sA); r = sA[0]; y = sA[1]; info.dh = sA[2];
      // pocket: the panel rolls over into the pocket wall on a soft radius (~2.5 cm), so the pocket is a
      // tapered sleeve over the glide, not a box with a hard rim at the seam
      if (hm.pw > 0.02) {
        const t1 = tB - 0.04 * hm.pw, t2 = tB + 0.05 * hm.pw;
        if (t > t1 && t < t2) {
          segPt(t1, sB); segPt(t2, sC);
          const w = (t - t1) / (t2 - t1), a = (1 - w) * (1 - w), b = 2 * w * (1 - w), c = w * w;
          r = a * sB[0] + b * hm.Er + c * sC[0];
          y = a * sB[1] + b * hm.Ey + c * sC[1];
        }
      }
      info.zone = 1; info.q = 1; info.t = t; info.pw = hm.pw; info.m = hm.m; info.dl = hm.dl;
    }
    info.r = r; info.y = y;
    out.set(Math.sin(th) * r, y, Math.cos(th) * r);
    return out;
  }

  // ---- tension detail (displacement along the normal, metres) ----------------------
  const strain = Array.from({ length: 56 }, () => ({ th: Rg() * TAU, q0: 0.02 + 0.5 * Rg(), a: (0.6 + 1.4 * Rg()) * 1e-3 * (Rg() < 0.85 ? 1 : -0.6), w: 0.008 + 0.02 * Rg() }));
  const strainD = (th, q) => {
    if (q <= 0) return 0;
    let d = 0;
    for (const Ls of strain) {
      const e = smoothstep(Ls.q0, Math.min(0.99, Ls.q0 + 0.3), q); if (e <= 0) continue;
      const x = wrapA(th - Ls.th) / Ls.w; if (x * x > 9) continue;
      d += Ls.a * e * (0.4 + 0.6 * q) * Math.exp(-x * x);
    }
    // fade out into the waist (no step where the funnel meets the skirt: the rumples take over)
    return d * (1 - smoothstep(0.86, 1.0, q));
  };
  // round 5: no large rumples (one read as a twisted lump on the waist), only fine compression wrinkles spread
  // evenly round the column (stratified azimuths), shallow enough not to smear into specular streaks
  const rumples = Array.from({ length: 64 }, (_, i) => ({ th: ((i + 0.2 + 0.6 * Rg()) / 64) * TAU, y: yW + (Rg() - 0.5) * 0.09, a: (Rg() < 0.62 ? 1 : -0.8) * (0.35 + 0.75 * Rg()) * 1e-3, wt: 0.04 + 0.12 * Rg(), wy: 0.008 + 0.018 * Rg(), sh: (Rg() - 0.5) * 6 }));
  const rumpleD = (th, y) => {
    const dyW = y - yW; if (Math.abs(dyW) > 0.13) return 0;
    let d = 0;
    for (const B of rumples) {
      const yy = (y - B.y) / B.wy; if (yy * yy > 9) continue;
      const x = (wrapA(th - B.th) - B.sh * (y - B.y)) / B.wt; if (x * x > 9) continue;
      d += B.a * Math.exp(-x * x - yy * yy);
    }
    return d * Math.exp(-((dyW / 0.075) ** 2));
  };
  const pulls = [];
  for (let k = 0; k < n; k++) {
    const tf = S.footAngle + k * sector;
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) pulls.push({ th0: tf + s * (0.1 + 0.62 * Rg()), th1: tf + s * (0.012 + 0.045 * Rg()), t0: 0.03 + 0.16 * Rg(), t1: 0.74 + 0.18 * Rg(), a: (0.6 + 1.4 * Rg()) * 1e-3, w: 0.0035 + 0.0065 * Rg(), bend: 0.55 + 0.8 * Rg() });
    // tension wrinkles fanning up from the pocket's shoulders into the panel (the elastic pocket pulls
    // the panel down round the glide): strongest at the pocket, fading out 8-20 cm up
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      const len = 0.09 + 0.16 * Rg();
      pulls.push({ rad: true, th0: tf + s * (dMax + 0.03 + 0.22 * Rg() * (0.5 + i / 8)), th1: tf + s * dMax * (0.45 + 0.5 * Rg()), t0: tB - len, t1: tB - 0.02, a: (0.35 + 0.45 * Rg()) * 1e-3 * (i % 3 === 2 ? -0.7 : 1), w: 0.004 + 0.005 * Rg(), bend: 1.3 + 0.8 * Rg() });
    }
  }
  const pullD = (th, t, r) => {
    let d = 0;
    for (const P of pulls) {
      if (t < P.t0 || t > P.t1) continue;
      const u = (t - P.t0) / (P.t1 - P.t0);
      const thL = P.th0 + (P.th1 - P.th0) * Math.pow(u, P.bend);
      const x = wrapA(th - thL) * r / P.w; if (x * x > 9) continue;
      // soft onset at the waist and soft fade into the pocket (no line where a pull starts); pocket
      // wrinkles grow towards the pocket instead
      const env = P.rad ? smoothstep(0, 0.75, u) * (1 - smoothstep(0.9, 1, u)) : smoothstep(0, 0.3, u) * (1 - smoothstep(0.75, 1, u));
      d += P.a * env * Math.exp(-x * x);
    }
    return d;
  };
  const waves = Array.from({ length: 8 }, () => ({ k: 2 + Math.floor(Rg() * 9), ky: (Rg() - 0.5) * 26, ph: Rg() * TAU, a: (0.12 + 0.3 * Rg()) * 1e-3 }));
  const waveD = (th, y) => { let d = 0; for (const w of waves) d += w.a * Math.sin(w.k * th + w.ky * y + w.ph); return d; };
  function disp(th) {
    const { zone, q, t, r, y, pw, dh, dl } = info;
    let d = 0;
    // seam where the top panel meets the body: a fine pressed-in line just under the shoulder (no welt)
    if (zone === 0) d += strainD(th, q) + waveD(th, y) * smoothstep(0.05, 0.3, q) + seamD(info.s, 1, th);
    else {
      d += pullD(th, t, r) + waveD(th, y) * (1 - pw);
      // turned hem: 2 cm double layer (slightly proud) with a soft ridge at the fold line
      d += (1 - pw) * (0.00035 * smoothstep(0.0215, 0.0185, dh) + 0.00022 * Math.exp(-(((dh - 0.0205) / 0.0013) ** 2)));
      // the stretched hem ripples a little (coverstitch on knit): soft waves ~3-4 cm, dying out upwards
      d += (1 - pw) * 0.0011 * Math.sin(th * 52 + 1.4 * Math.sin(th * 7 + 0.5)) * Math.exp(-dh / 0.022) * smoothstep(0.1, 0.5, info.m);
      // elastic edge of the foot pocket: fine gathers
      if (pw > 0) {
        const ph = (dl * r) / 0.0068 * TAU + 1.6 * Math.sin((dl * r) / 0.019 + 0.7) + 0.9 * Math.sin((dl * r) / 0.0071 + 2.3);
        d += pw * 0.00045 * (0.6 + 0.4 * Math.sin((dl * r) / 0.013 + 1.1)) * Math.sin(ph) * Math.exp(-dh / 0.0055);
        // pocket seam: a soft sewn ridge round the corner
        d += pw * 0.00035 * Math.exp(-(((t - tB) / 0.006) ** 2));
      }
      // the turned hem only on the free hem (pockets have their elastic edge)
      d *= 1;
    }
    d += rumpleD(th, y);
    return d;
  }

  // ---- final point: base + normal * disp, pushed out of the foot glides and leg ends
  const pa = V3(), pb = V3(), pc = V3(), nrm = V3(), du = V3(), dv = V3();
  const legs = S.feet.map(([, , a]) => ({ out: V3(Math.sin(a), 0, Math.cos(a)), side: V3(0, 1, 0).cross(V3(Math.sin(a), 0, Math.cos(a))).normalize(), a }));
  const tanL = Math.tan(S.legAng0);
  const sdfAt = (x, y, z) => {
    let dmin = 1;
    for (const Lg of legs) {
      const a = x * Lg.out.x + z * Lg.out.z, b = x * Lg.side.x + z * Lg.side.z;
      if (a < 0.25) continue;
      // foot glide
      // (rounded more than the moulded glide: the elastic pocket bridges its corners, no box ghosting through)
      dmin = Math.min(dmin, sdRoundBox(a - cap.c, y - cap.H / 2, b, cap.L / 2, cap.H / 2, cap.W / 2, 0.012));
      // leg tube near its end (oval 30 x 16 approximated by a rounded box along the leg)
      const yl = S.hubY + (a - S.pivotR) * tanL;
      dmin = Math.min(dmin, sdRoundBox(a - (S.tipR - 0.05), y - yl, b, 0.05, 0.015, 0.008, 0.007));
    }
    return dmin;
  };
  const kPush = f + 0.0006, wPush = 0.008; // a soft wrap over the leg end (the ridge highlight stays a satin band, not a hairline)
  function finalPoint(th, rho, out) {
    const e = 2e-4;
    const r1 = Math.min(2, rho + e), r0 = Math.max(0, rho - e);
    base(th + e, rho, pa); base(th - e, rho, pb); du.subVectors(pa, pb);
    base(th, r1, pa); base(th, r0, pb); dv.subVectors(pa, pb);
    nrm.crossVectors(dv, du).normalize();
    base(th, rho, out);
    const d = disp(th);
    out.addScaledVector(nrm, d);
    if (out.y < 0.13 && info.zone === 1) {
      const sd = sdfAt(out.x, out.y, out.z);
      if (sd < kPush + wPush) {
        const target = sd < kPush - wPush ? kPush : sd + ((kPush + wPush - sd) ** 2) / (4 * wPush);
        const h = 5e-4;
        const gx = sdfAt(out.x + h, out.y, out.z) - sdfAt(out.x - h, out.y, out.z);
        const gy = sdfAt(out.x, out.y + h, out.z) - sdfAt(out.x, out.y - h, out.z);
        const gz = sdfAt(out.x, out.y, out.z + h) - sdfAt(out.x, out.y, out.z - h);
        const gl = Math.hypot(gx, gy, gz) || 1;
        const push = target - sd;
        out.x += (gx / gl) * push; out.y += (gy / gl) * push; out.z += (gz / gl) * push;
      }
      if (out.y < 0.0015) out.y = 0.0015;
    }
    return out;
  }

  // ---- body mesh -----------------------------------------------------------------
  const footDens = (th) => 1 + 2.2 * Math.exp(-((footDelta(th) / 0.09) ** 2));
  const thetas = warpedThetas(Number(p.segments ?? 860), footDens, 214 * DEG);
  const rows = [];
  for (let s = 0; s < Lup - 1e-6;) {
    rows.push(s / Lup);
    // round 5: 2.2 mm rows down the funnel (at 5.5 mm the glossier jersey showed the rows as faint horizontal bands)
    const ds = s < 0.007 ? 0.0004 : s < sDep + 0.012 ? 0.0012 : 0.0022;
    // no sliver row just above the waist (a near-duplicate row gave noisy normals: a band and a speck there)
    if (Lup - (s + ds) < 0.5 * ds) break;
    s += ds;
  }
  rows.push(1);
  for (let t = 0.005; t < 1 - 1e-6;) { rows.push(1 + t); const dt = t > tB - 0.04 ? 0.0032 : 0.0036; if (1 - (t + dt) < 0.5 * dt) break; t += dt; }
  rows.push(2);
  const uScale = 0.25;
  // ridge rounding: the panels meet over each leg in a tension ridge from the waist to the pocket. Built from
  // the pocket's U section scaled towards the waist, that ridge got ever sharper upwards (a razor highlight);
  // jersey under tension bends with a roughly constant radius, so the radius is averaged across theta with a
  // physical kernel (sigma 9 mm of arc) near each ridge, from 10 cm above the floor to just under the waist
  const smoothRidges = (pos, cols) => {
    const nu = cols - 1, sig = 0.009;
    const rr = new Float64Array(nu), ang = new Float64Array(nu);
    for (let j = 0; j < rows.length; j++) {
      const rho = rows[j];
      if (rho <= 1.0) continue;
      for (let i = 0; i < nu; i++) { const k = (j * cols + i) * 3; rr[i] = Math.hypot(pos[k], pos[k + 2]); ang[i] = Math.atan2(pos[k], pos[k + 2]); }
      for (let i = 0; i < nu; i++) {
        const k = (j * cols + i) * 3, y = pos[k + 1];
        // (not in the pocket / hem band, where the stitch rows and the hem edge follow the unsmoothed surface)
        const wR = Math.exp(-((footDelta(thetas[i]) / 0.16) ** 2)) * smoothstep(0.065, 0.12, y) * (1 - smoothstep(yW - 0.16, yW - 0.04, y)) * (1 - smoothstep(tB - 0.14, tB - 0.05, rho - 1));
        if (wR < 1e-3) continue;
        const dMax = (3 * sig) / Math.max(0.03, rr[i]);
        let sw = 0, sr = 0;
        for (const dir of [-1, 1]) {
          for (let o = dir > 0 ? 0 : 1; o < nu; o++) {
            const q = (i + dir * o + nu * 4) % nu;
            const da = Math.abs(wrapA(ang[q] - ang[i]));
            if (da > dMax) break;
            const x = (da * rr[i]) / sig, w = Math.exp(-0.5 * x * x);
            sw += w; sr += w * rr[q];
          }
        }
        const rN = lerp(rr[i], sr / sw, wR), kk = rN / Math.max(1e-6, rr[i]);
        pos[k] *= kk; pos[k + 2] *= kk;
      }
    }
  };
  const bodyGeo = gridMesh(thetas, rows, finalPoint, (th, rho) => {
    if (rho <= 1) return [th * uScale, rho * Lup];
    hemAt(th, hm);
    return [th * uScale, Lup + (rho - 1) * (Math.hypot(hm.Er - rW, hm.Ey - yW) + Math.hypot(hm.Fr - hm.Er, hm.Fy - hm.Ey))];
  }, {
    post: (pos, cols, nv, uv) => {
      if (p.ridgeSmooth !== false) smoothRidges(pos, cols);
      // knit uv round each row by arc length (the same number of wales round every row, spread by the cloth's
      // own length): with uv u = theta, the flanks of the pocket ridges (a radial wall over a few degrees)
      // stretched the knit 10-50 x into glossy stripes along the ridge
      const nu = cols - 1, acc = new Float64Array(cols);
      for (let j = 0; j < nv; j++) {
        acc[0] = 0;
        for (let i = 1; i < cols; i++) { const a = (j * cols + i - 1) * 3, b = (j * cols + i) * 3; acc[i] = acc[i - 1] + Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]); }
        // round 5: u in metres (was: the same span on every row, which squeezed the knit 4-7 x round the
        // waist and stretched it on the rim: an anisotropic, streaky cloth)
        for (let i = 0; i <= nu; i++) uv[(j * cols + i) * 2] = acc[i];
      }
      // ... and v by arc length down each column below the waist (the pocket walls and the hem arch were
      // parametrised by straight chords, which squeezed the knit into bands on the pocket flanks)
      for (let i = 0; i < cols; i++) {
        let v = null;
        for (let j = 1; j < nv; j++) {
          if (rows[j] <= 1) continue;
          const a = ((j - 1) * cols + i) * 3, b = (j * cols + i) * 3;
          if (v === null) v = uv[((j - 1) * cols + i) * 2 + 1];
          v += Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]);
          uv[(j * cols + i) * 2 + 1] = v;
        }
      }
    },
  });
  // first row (the seam on the bullnose shoulder): the analytic normal, so the top panel and the body shade
  // as one surface across the seam (one-sided normals there showed as a light line under the top)
  { const n0 = bodyGeo.attributes.normal, p0 = bodyGeo.attributes.position, cols = thetas.length + 1;
    for (let i = 0; i < cols; i++) { const x = p0.getX(i), z = p0.getZ(i), l = Math.hypot(x, z) || 1; n0.setXYZ(i, (x / l) * Math.cos(seamA), Math.sin(seamA), (z / l) * Math.cos(seamA)); } }
  if (p.debugFaces) {
    // look-dev: front faces grey, back faces red (a back face in view = the panel folds over itself)
    const fm = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.7, side: THREE.FrontSide });
    const bm = new THREE.MeshStandardMaterial({ color: '#d02020', roughness: 0.7, side: THREE.BackSide });
    group.add(G.mesh(bodyGeo, fm)); group.add(G.mesh(bodyGeo, bm));
  } else group.add(G.mesh(bodyGeo, mat));

  // ---- top panel (flat over the blad, over the bullnose shoulder to the seam) -----------
  // profile without resampling: the flat in 40 rings (denser towards the rim), the shoulder arc in 14 steps
  const topPts = [];
  for (let i = 0; i <= 40; i++) topPts.push([cxU * (1 - (1 - i / 40) ** 1.6), H + f]);
  for (const q of arc(cxU, cyU, rhoU, Math.PI / 2, seamA, 14).slice(1)) topPts.push(q);
  const topS = [0]; for (let i = 1; i < topPts.length; i++) topS.push(topS[i - 1] + Math.hypot(topPts[i][0] - topPts[i - 1][0], topPts[i][1] - topPts[i - 1][1]));
  const topProf = { pts: topPts, s: topS, L: topS[topS.length - 1] };
  const nS = [Math.cos(seamA), Math.sin(seamA)];
  // on the body's own columns, and its seam ring IS the body's first row: two rings of different
  // tessellation left hairline T-junction slivers along the seam, through which the birch showed as specks
  const topGeo = gridMesh(thetas, topPts.map((_, j) => j), (th, j, o) => {
    const [r0, y0] = topPts[j];
    // profile normal: up on the flat, radial from the bullnose centre on the shoulder
    let nx = 0, ny = 1;
    if (r0 > cxU + 1e-6) { const l = Math.hypot(r0 - cxU, y0 - cyU) || 1; nx = (r0 - cxU) / l; ny = (y0 - cyU) / l; }
    const g = seamD(topProf.L - topProf.s[j], -1, th);
    const r = r0 + g * nx, y = y0 + g * ny;
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, () => [0, 0]);
  {
    const pos = topGeo.attributes.position, uv = topGeo.attributes.uv, nor = topGeo.attributes.normal;
    const bp = bodyGeo.attributes.position, cols = thetas.length + 1, last = topPts.length - 1;
    for (let i = 0; i < cols; i++) {
      const k = last * cols + i;
      pos.setXYZ(k, bp.getX(i), bp.getY(i), bp.getZ(i));
      const x = bp.getX(i), z = bp.getZ(i), l = Math.hypot(x, z) || 1;
      nor.setXYZ(k, (x / l) * nS[0], nS[1], (z / l) * nS[0]);
    }
    // planar uv in metres (no pole in the knit)
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    // winding check: the centre must face up
    if (nor.getY(cols + 1) < 0) { const idx = topGeo.index.array; for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; } topGeo.computeVertexNormals(); for (let i = 0; i < cols; i++) { const k = last * cols + i, x = bp.getX(i), z = bp.getZ(i), l = Math.hypot(x, z) || 1; nor.setXYZ(k, (x / l) * nS[0], nS[1], (z / l) * nS[0]); } }
  }
  group.add(G.mesh(topGeo, matTop));

  // ---- hem: thin folded edge, coverstitch rows, pocket seams ------------------------
  const tmp = V3();
  const lineAt = (rhoFn, nSamp, th0 = 0, th1 = TAU) => {
    const pts = [], nn = [];
    for (let i = 0; i <= nSamp; i++) {
      const th = th0 + (th1 - th0) * (i / nSamp);
      const rho = rhoFn(th);
      if (rho == null) continue;
      finalPoint(th, rho, tmp); pts.push(tmp.clone());
      // outward normal from neighbouring final points
      const a = finalPoint(th + 1e-3, rho, V3()), b = finalPoint(th - 1e-3, rho, V3());
      const c = finalPoint(th, Math.min(2, rho + 2e-3), V3()), d = finalPoint(th, Math.max(1, rho - 2e-3), V3());
      nn.push(V3().crossVectors(c.sub(d), a.sub(b)).normalize());
    }
    return { pts, nn };
  };
  // parameter of a line at distance dh from the bottom edge (along the profile)
  const hemRho = (dh) => (th) => {
    hemAt(th, hm);
    const lEF = Math.hypot(hm.Fr - hm.Er, hm.Fy - hm.Ey);
    if (dh <= lEF) return 1 + tB + (1 - tB) * (1 - dh / lEF);
    const lWE = Math.hypot(hm.Er - rW, hm.Ey - yW) * 1.02;
    return 1 + tB * (1 - Math.min(1, (dh - lEF) / lWE));
  };
  {
    const { pts, nn } = lineAt(() => 2, 2400);
    const edge = pts.map((q, i) => q.clone().addScaledVector(nn[i], -0.0005));
    edge.pop();
    group.add(G.mesh(K.sweep(edge, K.circle(0.00062, 8), { closed: true, normals: nn.slice(0, edge.length) }), SL.jerseyEdge(color)));
    for (const dh of [0.011, 0.017]) {
      const L1 = lineAt(hemRho(dh), 2400);
      const st = SG.stitches(L1.pts, L1.nn, { len: 0.0032, gap: 0.0013, w: 0.0008, h: 0.00016, lift: 0.00004 });
      if (st) group.add(G.mesh(st, thr, { cast: false }));
    }
    // pocket seams: round each foot corner at the bend
    for (const Lg of legs) {
      const Lps = lineAt((th) => { hemAt(th, hm); return hm.pw > 0.6 ? 1 + tB - 0.0015 : null; }, 220, Lg.a - dMax * 1.6, Lg.a + dMax * 1.6);
      if (Lps.pts.length > 4) { const st = SG.stitches(Lps.pts, Lps.nn, { len: 0.0028, gap: 0.0012, w: 0.0008, h: 0.00016, lift: 0.00004 }); if (st) group.add(G.mesh(st, thr, { cast: false })); }
    }
  }

  // ---- optional one-colour print (logo) on the flat part of a panel ---------------
  // print {svg|name, color, width (m), y (centre height, m), azimuth (deg) | 'panel-mid'}
  if (p.print) {
    const art = resolvePrint(p.print);
    if (art) {
      const radiusAt = (th, y) => {
        hemAt(th, hm);
        const u = clamp((yW - y) / (yW - hm.Ey));
        return rW + (hm.Er - rW) * gOn(u) - 0.008 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * smoothstep(0, 0.3, u) * Math.pow(hm.m, 1.2);
      };
      const wP = Number(p.print.width ?? 0.15), hP = wP * art.vb[1] / art.vb[0];
      const yc = Number(p.print.y ?? 0.3);
      let thC = typeof p.print.azimuth === 'number' ? p.print.azimuth * DEG : null;
      if (thC === null) {
        let best = 9;
        for (let k = 0; k < n; k++) {
          const mth = S.footAngle + sector / 2 + k * sector, dd = Math.abs(Math.atan2(Math.sin(mth - 34 * DEG), Math.cos(mth - 34 * DEG)));
          if (dd < best) { best = dd; thC = mth; }
        }
      }
      const tex = artTexture(art, M.resolveColor(p.print.color, '#FFFFFF'), 512, Math.max(16, Math.round(512 * hP / wP)));
      const decal = G.surface((u, v, out) => {
        const y = yc - hP / 2 + v * hP;
        let th = thC;
        for (let it = 0; it < 3; it++) th = thC + ((u - 0.5) * wP) / Math.max(0.04, radiusAt(th, y));
        const r = radiusAt(th, y) + 0.003;
        out.set(Math.sin(th) * r, y, Math.cos(th) * r);
      }, 32, 32);
      decal.computeVertexNormals();
      group.add(G.mesh(decal, decalMaterial(tex), { cast: false }));
    }
  }

  // ---- optional topcover: separate cap over the blad and its edge, elastic edge under the rim
  if (p.topcover) {
    const tcColor = typeof p.topcover === 'string' ? p.topcover : p.topcoverColor || 'wit';
    let tmat = SL.jerseyKnit(tcColor, { flat: true });
    const o = 0.0024; // lies on the rok
    const prof = concat([[0, H + f + o], [cxU, H + f + o]], arc(cxU, cyU, rhoU + o, Math.PI / 2, 0, 14), arc(cxL, cyL, rhoL + o, 0, -gDep, 16));
    const e0 = prof[prof.length - 1];
    prof.push([e0[0] + d0[0] * 0.016, e0[1] + d0[1] * 0.016]);
    const tp = resample(prof, 0.002);
    const tg = revolve(tp, 480, (th, i, pr) => {
      // elastic gathers in the last ~12 mm
      const sEnd = pr.L - pr.s[i];
      const k = Math.exp(-sEnd / 0.006);
      return [k * 0.0016 * Math.sin(th * 150 + 1.3 * Math.sin(th * 23)) * Math.sin(gDep), 0];
    });
    const uv = tg.attributes.uv, pos = tg.attributes.position;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    uv.needsUpdate = true;
    if (p.topcoverPrint) {
      // themed topcover (sublimation print): 'stripes-rwb' = rood, wit en blauw banen; 'voetbal' = black pentagons on white.
      const D2 = 2 * (R + 0.02);
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / D2 + 0.5, pos.getZ(i) / D2 + 0.5);
      tmat = tmat.clone();
      tmat.color = new THREE.Color('#FFFFFF');
      tmat.sheenColor = new THREE.Color('#FFFFFF').multiplyScalar(0.3);
      tmat.map = topcoverPrintTex(String(p.topcoverPrint));
      tmat.normalMap = null;
      tmat.userData = { ...tmat.userData, weave: undefined };
    }
    group.add(G.mesh(tg, tmat));
    // its folded edge (thin bead)
    const end = tp.pts[tp.pts.length - 1];
    const bead = [];
    for (let i = 0; i < 960; i++) { const th = (i / 960) * TAU; const rr = end[0] - 0.0006 + 0.0016 * Math.sin(th * 150 + 1.3 * Math.sin(th * 23)) * Math.sin(gDep); bead.push(V3(Math.sin(th) * rr, end[1] + 0.0004, Math.cos(th) * rr)); }
    group.add(G.mesh(K.sweep(bead, K.circle(0.0013, 8), { closed: true, up: V3(0, 1, 0) }), tmat));
  }

  // ---- views + probes --------------------------------------------------------------
  const ang = 34 * DEG;
  const pt = (th, rho) => finalPoint(th, rho, V3()).toArray();
  const probes = {
    top: [[Math.sin(ang) * 0.12, H + f, Math.cos(ang) * 0.12]],
    topNear: [[Math.sin(ang) * 0.3, H + f, Math.cos(ang) * 0.3]],
    // outline of the flat top at 0.85 R (tools/check-statafel-values.py: spread of the lit top)
    topRing: Array.from({ length: 32 }, (_, i) => [Math.sin((i / 32) * TAU) * R * 0.85, H + f, Math.cos((i / 32) * TAU) * R * 0.85]),
    funnelLit: [pt(-14 * DEG, 0.55), pt(-4 * DEG, 0.6)],
    funnelShade: [pt(96 * DEG, 0.55), pt(104 * DEG, 0.6)],
    skirtLit: [pt(0 * DEG, 1.35), pt(-8 * DEG, 1.45)],
    skirtFront: [pt(34 * DEG, 1.4)],
    skirtShade: [pt(90 * DEG, 1.35), pt(98 * DEG, 1.45)],
    floorFoot: [[Math.sin(S.footAngle) * (cap.c + cap.L / 2 + 0.012), 0.001, Math.cos(S.footAngle) * (cap.c + cap.L / 2 + 0.012)]],
    floorOpen: [[Math.sin(-30 * DEG) * 0.75, 0.001, Math.cos(-30 * DEG) * 0.75]],
  };
  const f0 = S.footAngle;
  return {
    probes,
    detail: { target: [Math.sin(ang) * (R - 0.02), H - 0.075, Math.cos(ang) * (R - 0.02)], size: 0.34, azimuth: 30, elevation: 14 },
    details: {
      voet: { target: [Math.sin(f0) * (cap.c - 0.01), 0.05, Math.cos(f0) * (cap.c - 0.01)], size: 0.2, azimuth: 26, elevation: 18 },
      taille: { target: [0, yW + 0.02, 0], size: 0.3, azimuth: 30, elevation: 8 },
    },
  };
}

// Print for a themed topcover, drawn on a canvas (cached per kind). Colours: the catalogue's rood / wit / blauw swatches.
const _tcPrint = new Map();
function topcoverPrintTex(kind) {
  if (_tcPrint.has(kind)) return _tcPrint.get(kind);
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  if (kind === 'voetbal') {
    g.fillStyle = M.resolveColor('wit', '#F3F3F0'); g.fillRect(0, 0, N, N);
    g.fillStyle = M.resolveColor('zwart', '#1D1E20');
    const pent = (cx, cy, r, rot) => { g.beginPath(); for (let k = 0; k < 5; k++) { const a = rot + k * 2 * Math.PI / 5 - Math.PI / 2; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } g.closePath(); g.fill(); };
    const step = N / 2.6;
    for (let row = -1; row < 6; row++) for (let col = -1; col < 6; col++) {
      const cx = col * step + (row % 2 ? step / 2 : 0) + step * 0.3, cy = row * step * 0.88 + step * 0.35;
      pent(cx, cy, step * 0.27, (row + col) % 2 ? 0 : Math.PI / 5);
    }
    // seams between the panels: thin dark lines from each pentagon
    g.strokeStyle = 'rgba(29,30,32,0.6)'; g.lineWidth = N / 260;
    for (let row = -1; row < 6; row++) for (let col = -1; col < 6; col++) {
      const cx = col * step + (row % 2 ? step / 2 : 0) + step * 0.3, cy = row * step * 0.88 + step * 0.35;
      for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5 - Math.PI / 2; g.beginPath(); g.moveTo(cx + step * 0.27 * Math.cos(a), cy + step * 0.27 * Math.sin(a)); g.lineTo(cx + step * 0.5 * Math.cos(a), cy + step * 0.5 * Math.sin(a)); g.stroke(); }
    }
  } else {
    // stripes-rwb: three equal horizontal bands, rood / wit / blauw
    const cols = [M.resolveColor('rood', '#B5161E'), M.resolveColor('wit', '#F3F3F0'), M.resolveColor('blauw', '#1E4E9E')];
    cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, (i * N) / 3, N, N / 3 + 1); });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  _tcPrint.set(kind, t);
  return t;
}


// Strik (bow) cover: see strikCover.js (round 5).

function buildKleed(group, S, p, color) {
  const mat = M.polyCloth(color, { satin: 0.25 });
  // hidden support: simple top disc so shadows/occlusion read right
  const f = 0.003;
  const top = topProfile(S, f, 2, 0.0015);
  const P0 = top.end;
  const drop = [];
  const yTopEdge = P0[1];
  // p.drop: hang length in m below the blad edge (short kleed over a rok); default: to the floor
  // p.square: side (m) of a square kleed; the cloth then reaches sq/2 from the centre on the sides and sq/2·√2 at the
  // points, so the profile is built for the points and cut shorter per angle (rot: angle of a point, degrees)
  const sq = Number(p.square || 0);
  const rot = Number(p.squareRot ?? 45) * DEG;
  const reach = sq ? (th) => (sq / 2) / Math.max(Math.abs(Math.cos(th - rot + Math.PI / 4)), Math.abs(Math.sin(th - rot + Math.PI / 4))) : null;
  const dropLen = sq ? Math.max(0.05, sq / 2 * Math.SQRT2 - S.R) : Number(p.drop || 0);
  const yEnd = dropLen ? Math.max(0.004, yTopEdge - dropLen) : 0.004;
  const kS = clamp((yTopEdge - yEnd) / Math.max(0.01, yTopEdge - 0.004), 0.2, 1);
  const n = dropLen ? 36 : 70;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const y = lerp(yTopEdge, yEnd, t);
    const r = P0[0] + 0.004 + (0.09 * Math.pow(t, 1.5) + 0.045 * smoothstep(0.9, 1, t) ** 1.5) * kS;
    drop.push([r, y]);
  }
  const prof = resample(concat(top.pts, drop), 0.008);
  const topLen = resample(top.pts, 0.008).L;
  const folds = foldField(10, 5, { sharp: 1.8, warp: 1.1, ampJitter: 0.4 });
  const nv = prof.pts.length - 1;
  group.add(G.mesh(revolve(prof, sq ? 480 : 300, (th, i, pr) => {
    // square kleed: points past the cloth's reach at this angle collapse onto the hem (interpolated, so the hem is smooth)
    let q = pr.pts[i], s = pr.s[i];
    if (sq) {
      const fi = clamp(reach(th) / pr.L) * nv;
      if (i > fi) {
        const k0 = Math.min(nv - 1, Math.floor(fi)), w = fi - k0;
        q = [lerp(pr.pts[k0][0], pr.pts[k0 + 1][0], w), lerp(pr.pts[k0][1], pr.pts[k0 + 1][1], w)];
        s = lerp(pr.s[k0], pr.s[k0 + 1], w);
      }
    }
    const t = clamp((s - topLen) / (pr.L - topLen));
    const amp = 0.085 * (dropLen ? Math.max(0.35, kS) : 1) * Math.pow(t, 0.8) * smoothstep(0, 0.03, t);
    return [q[0] - pr.pts[i][0] + amp * folds(th, t), q[1] - pr.pts[i][1]];
  }), mat));
}
