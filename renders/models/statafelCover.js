// Statafel covers, fitted over the parametric statafel (base 'klap', 4 legs).
//
// type 'stretch' : statafelrok of polyester-elastane single jersey (statafelLook.jerseyKnit: knit
//                  normal, dye-tinted sheen). Construction: a round top panel sewn to the body on the
//                  upper arris of the blad (welt + edge stitching); the body hugs the 18 mm edge, leaves
//                  the lower arris in a funnel to a tight waist on the column and flares to the four feet.
//                  Fabric under tension: fine radial strain lines from the rim into the waist, irregular
//                  compression rumples at the waist, diagonal pull lines from the waist into each foot.
//                  Each foot sits in an elastic foot pocket (the fabric wraps the foot glide; pocket seam
//                  and the glide's sole just visible); between the feet the turned hem (2 cm, coverstitched,
//                  thin folded edge) lifts in a clean arch. Optional topcover (contrast colour / print):
//                  a separate cap over the blad and its edge, elastic edge just under the rim.
// type 'strik'   : loose woven polyester cover gathered at the waist with a sash tied in a bow,
//                  full skirt to the floor.
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

const { V3, lerp, clamp, smoothstep } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const wrapA = (a) => a - TAU * Math.round(a / TAU);

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
// point on a resampled profile at arc length s (linear)
function profAt(prof, s) {
  const n = prof.pts.length - 1;
  const f = clamp(s / prof.L) * n, i = Math.min(n - 1, Math.floor(f)), w = f - i;
  return [lerp(prof.pts[i][0], prof.pts[i + 1][0], w), lerp(prof.pts[i][1], prof.pts[i + 1][1], w)];
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
function gridMesh(thetas, rows, pf, uvf, { flip = true } = {}) {
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
      const r = buildStrik(group, S, p, color);
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
  rig.default.bounce = { azimuth: -28, elevation: -22, intensity: albedoL > 0.5 ? 3.8 : albedoL < 0.05 ? 3.1 : 1.9 };
  // white: exposed so the lit cloth sits at ~236-244 (not paper white at 248+): the folds keep their
  // gradation and the weave / sheen read; a moderate frontal fill keeps the side turned away from the key
  // open, the floor card lifts the downward drape
  if (albedoL > 0.5) { rig.default.fill = { ...rig.default.fill, intensity: 1.0 }; rig.default.exposure = 0.72; }
  if (albedoL < 0.05) rig.default.exposure *= 1.06;
  // a lighter topcover (or a printed one, white base) on a dark rok: expose for the lighter cloth so the
  // top keeps its shading instead of clipping to paper white; the dark rok stays readable at that exposure
  if (type !== 'kleed' && type !== 'strik' && type !== 'bow' && p.topcover) {
    const tcColor = p.topcoverPrint ? 'wit' : typeof p.topcover === 'string' ? p.topcover : p.topcoverColor || 'wit';
    const ca = SL.clothAlbedo(tcColor), tcL = ca.r * 0.2126 + ca.g * 0.7152 + ca.b * 0.0722;
    if (tcL > albedoL * 1.5) rig.default.exposure = Math.min(rig.default.exposure, SL.statafelRig({ albedoL: tcL, white: tcL > 0.5 }).default.exposure * 1.04);
  }
  return { object: group, detail, details, meta: { type, color, D: S.D, probes }, rig };
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

// =====================================================================================
// Stretch statafelrok
function buildStretch(group, S, p, color) {
  let mat = SL.jerseyKnit(color);
  if (p.knitLook) {
    // look-development override: {roughness, sheen, sheenColor (grey level or hex), normal, specularIntensity, envSpec}
    const k = p.knitLook;
    mat = mat.clone(); delete mat.userData.__hooked;
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
  const ra = 0.0045, cxo = R - ra, yTopC = H - ra, yBotC = H - T + ra, rc = ra + f;
  const seamA = 34 * DEG;                            // top seam on the upper arris
  const gDep = 52 * DEG;                             // the body leaves the lower arris at this angle

  // ---- upper profile (axisymmetric): seam -> edge -> lower arris -> funnel -> waist
  const arcU = arc(cxo, yTopC, rc, seamA, 0, 10);
  const arcL = arc(cxo, yBotC, rc, 0, -gDep, 14);
  const P0 = arcL[arcL.length - 1], d0 = [-Math.sin(gDep), -Math.cos(gDep)];
  const span = Math.hypot(rW - P0[0], yW - P0[1]);
  const funnel = bezier(P0, [P0[0] + d0[0] * span * 0.42, P0[1] + d0[1] * span * 0.42], [rW, yW + span * 0.44], [rW, yW], 160);
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
    const pw = 1 - smoothstep(dMax - 0.014, dMax + 0.03, ad);
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
  const info = { r: 0, y: 0, zone: 0, q: 0, t: 0, pw: 0, m: 0, dh: 0, dl: 0 };
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
      info.zone = 0; info.q = s <= sDep ? 0 : (s - sDep) / (Lup - sDep); info.t = 0; info.pw = 0; info.dh = 1; info.dl = footDelta(th);
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
  const rumples = Array.from({ length: 56 }, (_, i) => { const big = i < 9; return { th: Rg() * TAU, y: yW + (Rg() - 0.55) * (big ? 0.07 : 0.1), a: (Rg() < 0.66 ? 1 : -0.8) * (big ? 2.4 + 2.0 * Rg() : 0.6 + 1.8 * Rg()) * 1e-3, wt: big ? 0.18 + 0.25 * Rg() : 0.05 + 0.2 * Rg(), wy: big ? 0.035 + 0.03 * Rg() : 0.006 + 0.02 * Rg(), sh: (Rg() - 0.5) * (big ? 14 : 7) }; });
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
      pulls.push({ rad: true, th0: tf + s * (dMax + 0.03 + 0.22 * Rg() * (0.5 + i / 8)), th1: tf + s * dMax * (0.45 + 0.5 * Rg()), t0: tB - len, t1: tB - 0.006, a: (0.7 + 1.0 * Rg()) * 1e-3 * (i % 3 === 2 ? -0.7 : 1), w: 0.0028 + 0.004 * Rg(), bend: 1.3 + 0.8 * Rg() });
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
    if (zone === 0) d += strainD(th, q) + waveD(th, y) * smoothstep(0.05, 0.3, q);
    else {
      d += pullD(th, t, r) + waveD(th, y) * (1 - 0.7 * pw);
      // turned hem: 2 cm double layer (slightly proud) with a soft ridge at the fold line
      d += (1 - pw) * (0.00035 * smoothstep(0.0215, 0.0185, dh) + 0.00022 * Math.exp(-(((dh - 0.0205) / 0.0013) ** 2)));
      // the stretched hem ripples a little (coverstitch on knit): soft waves ~3-4 cm, dying out upwards
      d += (1 - pw) * 0.0011 * Math.sin(th * 52 + 1.4 * Math.sin(th * 7 + 0.5)) * Math.exp(-dh / 0.022) * smoothstep(0.1, 0.5, info.m);
      // elastic edge of the foot pocket: fine gathers
      if (pw > 0) {
        d += pw * 0.0006 * Math.sin((dl * r) / 0.0034 * TAU) * Math.exp(-dh / 0.005);
        // pocket seam: a sewn ridge round the corner
        d += pw * 0.0006 * Math.exp(-(((t - tB) / 0.004) ** 2));
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
      dmin = Math.min(dmin, sdRoundBox(a - cap.c, y - cap.H / 2, b, cap.L / 2, cap.H / 2, cap.W / 2, cap.r));
      // leg tube near its end (oval 30 x 16 approximated by a rounded box along the leg)
      const yl = S.hubY + (a - S.pivotR) * tanL;
      dmin = Math.min(dmin, sdRoundBox(a - (S.tipR - 0.05), y - yl, b, 0.05, 0.015, 0.008, 0.007));
    }
    return dmin;
  };
  const kPush = f + 0.0006, wPush = 0.0055; // a soft wrap over the leg end (the ridge highlight stays a satin band, not a hairline)
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
  for (let s = 0; s < Lup - 1e-6;) { rows.push(s / Lup); s += s < sDep + 0.012 ? 0.0014 : (Math.abs(profAt(up, s)[1] - yW) < 0.09 ? 0.003 : 0.0055); }
  rows.push(1);
  for (let t = 0.005; t < 1 - 1e-6;) { rows.push(1 + t); t += t > tB - 0.04 ? 0.0032 : t < 0.15 ? 0.005 : 0.0082; }
  rows.push(2);
  const uScale = 0.25;
  const bodyGeo = gridMesh(thetas, rows, finalPoint, (th, rho) => {
    if (rho <= 1) return [th * uScale, rho * Lup];
    hemAt(th, hm);
    return [th * uScale, Lup + (rho - 1) * (Math.hypot(hm.Er - rW, hm.Ey - yW) + Math.hypot(hm.Fr - hm.Er, hm.Fy - hm.Ey))];
  });
  group.add(G.mesh(bodyGeo, mat));

  // ---- top panel (flat over the blad, round the upper arris to the seam) --------------
  const topProf = resample(concat([[0, H + f], [cxo, H + f]], arc(cxo, yTopC, rc, Math.PI / 2, seamA, 10)), 0.004);
  const topGeo = revolve(topProf, 480);
  { const pos = topGeo.attributes.position, uv = topGeo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i)); }
  group.add(G.mesh(topGeo, matTop));
  // seam welt on the arris + a row of edge stitching on the side of the blad edge
  const sP = [cxo + Math.cos(seamA) * rc, yTopC + Math.sin(seamA) * rc];
  const nS = [Math.cos(seamA), Math.sin(seamA)];
  const welt = [];
  for (let i = 0; i < 720; i++) { const th = (i / 720) * TAU, rr = sP[0] + nS[0] * 0.0003; welt.push(V3(Math.sin(th) * rr, sP[1] + nS[1] * 0.0003, Math.cos(th) * rr)); }
  group.add(G.mesh(K.sweep(welt, K.circle(0.0012, 10), { closed: true, up: V3(0, 1, 0) }), matTop));
  {
    const pts = [], nn = [], rr = cxo + rc + 0.0002, ys = H - T * 0.42;
    for (let i = 0; i <= 1600; i++) { const th = (i / 1600) * TAU; pts.push(V3(Math.sin(th) * rr, ys, Math.cos(th) * rr)); nn.push(V3(Math.sin(th), 0, Math.cos(th))); }
    const st = SG.stitches(pts, nn, { len: 0.003, gap: 0.0012, w: 0.0009, h: 0.00045 });
    if (st) group.add(G.mesh(st, thr, { cast: false }));
  }

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
    group.add(G.mesh(K.sweep(edge, K.circle(0.00062, 8), { closed: true, normals: nn.slice(0, edge.length) }), matTop));
    for (const dh of [0.011, 0.017]) {
      const L1 = lineAt(hemRho(dh), 2400);
      const st = SG.stitches(L1.pts, L1.nn, { len: 0.0032, gap: 0.0013, w: 0.0009, h: 0.0004, lift: 0.00025 });
      if (st) group.add(G.mesh(st, thr, { cast: false }));
    }
    // pocket seams: round each foot corner at the bend
    for (const Lg of legs) {
      const Lps = lineAt((th) => { hemAt(th, hm); return hm.pw > 0.6 ? 1 + tB - 0.0015 : null; }, 220, Lg.a - dMax * 1.6, Lg.a + dMax * 1.6);
      if (Lps.pts.length > 4) { const st = SG.stitches(Lps.pts, Lps.nn, { len: 0.0028, gap: 0.0012, w: 0.0009, h: 0.0004, lift: 0.0003 }); if (st) group.add(G.mesh(st, thr, { cast: false })); }
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
    const rc2 = rc + o;
    const prof = concat([[0, H + f + o], [cxo, H + f + o]], arc(cxo, yTopC, rc2, Math.PI / 2, 0, 12), arc(cxo, yBotC, rc2, 0, -gDep, 14));
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


// =====================================================================================
// Strik (bow) cover: woven polyester. The cloth lies flat on the blad, falls over the edge and is
// gathered at the waist by a sash of the same cloth tied in a bow at the front.
//   upper drape: radial folds from just under the rim that branch into twice as many tight gathers
//                towards the sash; the gathered cloth puffs out above the sash and is pinched in under
//                its edge (the sash bites into the gathers); near the knot the folds converge
//   sash:        a band of the same cloth round the gathers: its own soft lengthwise folds, a slight
//                twist and wander in height, bumps where gather crests press against it, narrowing
//                and pleating into the knot
//   bow:         two loops of ONE layer of ribbon (open at the top and bottom, front and back strand
//                apart, edges thin, no hem bead), each pinched into the knot with fine pleats and one
//                diagonal pinch crease; a knot = a band wrapped round the loop roots (wrap folds, its
//                edges riding over the roots); two tails lying on the skirt (their edges touch the
//                cloth, the centre bridges the fold valleys), each ending in a clean swallow-tail cut
//   skirt:       gathers under the sash opening into broad soft folds (irregular widths and depths),
//                the hem reaching the floor and pooling a few cm onto it
function buildStrik(group, S, p, color) {
  const mat = SL.wovenCloth(color);
  const sashColor = p.sashColor || p.strikColor || color;
  const ribbon = sashColor === color ? mat : SL.wovenCloth(sashColor);
  const { R, H } = S;
  const f = 0.0025;
  const yS = Number(p.sashY ?? H - 0.40);          // sash centre height
  const sashW = 0.058;                             // sash band width
  const yBT = yS + sashW / 2, yBB = yS - sashW / 2;
  const rC = 0.064;                                 // gathered cloth radius under the band
  const rBand = rC + 0.0045;                        // sash band surface
  const tb = Number(p.bowAngle ?? 22) * DEG;        // bow position (azimuth)
  const Rg = rng(Number(p.seed ?? 7));

  // ---- profiles -------------------------------------------------------------------
  const top = topProfile(S, f, 8, 0.002);
  const P0 = top.end, d0 = top.dir;
  // drape: rim -> puff above the band (rC + 2.2 cm) -> tucked in under the band edge
  const yTk = yBT + 0.017;
  const drape = bezier(P0, [P0[0] + d0[0] * 0.06, P0[1] + d0[1] * 0.06], [rC + 0.07, yTk + 0.1], [rC + 0.022, yTk], 90);
  const tuck = bezier([rC + 0.022, yTk], [rC + 0.0172, yTk - 0.01], [rC + 0.003, yBT + 0.002], [rC, yBT - 0.008], 18);
  const upper = resample(concat(top.pts, drape, tuck), 0.0025);
  const topLen = resample(top.pts, 0.0025).L;
  const sTk = resample(concat(top.pts, drape), 0.0025).L;
  // skirt: out from under the band, a short puff, then the fall to the floor and a few cm of pooling
  // (one tangent-continuous chain: a kink here shows as stair-stepped pleats under the band)
  const yTkB = yBB - 0.02;
  const tuckB = bezier([rC, yBB + 0.008], [rC + 0.0015, yBB - 0.003], [rC + 0.007, yTkB + 0.009], [rC + 0.013, yTkB], 18);
  const fall = bezier([rC + 0.013, yTkB], [rC + 0.0262, yTkB - 0.0198], [R - 0.035, 0.25], [R + 0.012, 0.026], 140);
  // the hem just reaches the floor and kicks out ~1 cm onto it (no flat frill)
  const pool = bezier([R + 0.012, 0.026], [R + 0.0135, 0.012], [R + 0.0165, 0.0035], [R + 0.024, 0.0018], 14);
  const skirt = resample(concat(tuckB, fall, pool), 0.003);
  const sTkB = resample(tuckB, 0.003).L;
  const sPool = resample(concat(tuckB, fall), 0.003).L;

  // ---- fold fields ----------------------------------------------------------------
  // one warped base phase shared by all fields: broad folds = phase, gathers = 2 x phase (their crests
  // include the broad crests: folds branch), skirt folds = their own count with a slow drift
  const N1 = Number(p.folds ?? 10), N2 = Number(p.skirtFolds ?? 13);
  const wU = []; for (let k = 1; k <= 4; k++) wU.push({ k, a: (Rg() - 0.5) * 1.1 / k, p: Rg() * TAU });
  const wL = []; for (let k = 1; k <= 5; k++) wL.push({ k, a: (Rg() - 0.5) * 1.5 / k, p: Rg() * TAU, d: (Rg() - 0.5) * 1.4 });
  const minor = []; for (let k = 0; k < 5; k++) minor.push({ k: 21 + Math.floor(Rg() * 14), a: 0.12 + 0.2 * Rg(), p: Rg() * TAU, d: (Rg() - 0.5) * 3 });
  const amJ = []; for (let k = 1; k <= 5; k++) amJ.push({ k, a: (Rg() - 0.5) * 0.3, p: Rg() * TAU, d: (Rg() - 0.5) * 2 });
  const ph0 = Rg() * TAU, ph1 = Rg() * TAU;
  // convergence of the folds into the tie point near the sash
  const conv = (th, t) => { const d = wrapA(th - tb); return th - 0.42 * t * t * d * Math.exp(-((d / 0.9) ** 2)); };
  const phase = (th, ws, n, p0, t = 0) => { let ph = n * th + p0; for (const q of ws) ph += q.a * Math.sin(q.k * th + q.p + (q.d || 0) * t) * n / 3; return ph; };
  // fold shape: rounded crests, narrower (not V) valleys (+1 crest, -1 valley)
  const shape = (ph, sharp) => { const x = (1 - Math.cos(ph)) / 2; return 1 - 2 * Math.pow(x, sharp); };
  const ampJ = (th, t) => { let a = 1; for (const q of amJ) a += q.a * Math.sin(q.k * th + q.p + q.d * t); return Math.max(0.4, a); };
  // per-fold depth (each fold its own amplitude, blended smoothly from crest to crest)
  const fh = Array.from({ length: 64 }, () => 0.55 + 0.8 * Rg());
  const foldAmp = (ph, nf) => { const x = ph / TAU, i = Math.floor(x), w = x - i, ww = w * w * (3 - 2 * w); const m = (k) => fh[((k % nf) + nf) % nf]; return lerp(m(i), m(i + 1), ww); };
  // gathers at the sash (same field above and below: the crests run on under the band)
  const gather = (th) => { const ph = phase(conv(th, 1), wU, N1, ph0); return shape(2 * ph, 1.2) * foldAmp(2 * ph + 1.3, 2 * N1); };
  const GA = 0.0072; // gather depth next to the band

  // ---- upper drape ---------------------------------------------------------------
  const Lu = upper.L, nT = 900;
  const thetas = Array.from({ length: nT }, (_, i) => 200 * DEG + (i / nT) * TAU);
  const upperDisp = (th, s) => {
    if (s <= topLen) return 0;
    if (s >= sTk) {
      // tuck: gathers shrink as they disappear under the band edge
      const q = clamp((s - sTk) / (Lu - sTk));
      return (GA * (1 - smoothstep(0.15, 1, q)) + 0.0022) * gather(th);
    }
    const t = clamp((s - topLen) / (sTk - topLen));
    const thc = conv(th, t);
    const ph = phase(thc, wU, N1, ph0);
    const kG = smoothstep(0.5, 0.97, t);
    const broad = shape(ph, 1.6) * foldAmp(ph, N1) * ampJ(thc, t);
    const A = lerp(0.023 * smoothstep(0, 0.45, t), GA, kG);
    return A * lerp(broad, gather(th), kG);
  };
  const flatEnd = upper.s.findIndex((s) => s > S.R - 0.006);
  const upRows = upper.s.slice(Math.max(0, flatEnd - 1));
  const uR = R + 0.01; // u in metres of cloth (gathered cloth keeps the rim's circumference)
  const upGeo = gridMesh(thetas, upRows, (th, s, o) => {
    const [r0, y] = profAt(upper, s);
    const r = r0 + upperDisp(th, s);
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, (th, s) => [th * uR, s]);
  group.add(G.mesh(upGeo, mat));
  // flat top: planar uv (no pole in the weave), same surface as the drape's first rows
  {
    const tp = resample(concat([[0, upper.pts[0][1]]], upper.pts.slice(0, Math.max(2, flatEnd + 1))), 0.01);
    const g = revolve(tp, 360);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    group.add(G.mesh(g, mat));
  }

  // ---- skirt ----------------------------------------------------------------------
  const Ls = skirt.L;
  const skirtDisp = (th, s) => {
    if (s <= sTkB) {
      const q = clamp(s / sTkB);
      return (GA * smoothstep(0.0, 0.85, q) + 0.0022) * gather(th);
    }
    const t = clamp((s - sTkB) / (Ls - sTkB));
    const thc = conv(th, Math.max(0, 1 - t * 4));
    const phL = phase(thc, wL, N2, ph1, t);
    const kG = 1 - smoothstep(0.0, 0.3, t);
    let mn = 0; for (const q of minor) mn += q.a * Math.sin(q.k * thc + q.p + q.d * t);
    const broad = shape(phL, 1.25 + 0.15 * t) * foldAmp(phL + 2.1, N2) + 0.2 * mn * smoothstep(0.15, 0.7, t);
    const A = lerp(GA, 0.0175 + 0.007 * smoothstep(0.3, 1, t), smoothstep(0, 0.35, t));
    return A * ampJ(thc + 1.7, t) * lerp(broad, gather(th), kG);
  };
  // the foot glides hold the cloth out near the floor
  const sector = TAU / S.nLegs, footOut = S.cap.c + S.cap.L / 2 + 0.009;
  const footDelta = (th) => { let d = wrapA(th - S.footAngle); d = ((d % sector) + sector) % sector; if (d > sector / 2) d -= sector; return d; };
  const skirtRadius = (th, s, r0, y) => {
    let r = r0 + skirtDisp(th, s);
    const w = Math.exp(-(((footDelta(th) * footOut) / 0.034) ** 2)) * (1 - smoothstep(0.05, 0.14, y));
    if (r < footOut) r += (footOut - r) * w;
    return r;
  };
  // pooled hem: the fold crests that reach the floor stay round (lift a few mm), valleys lie flat
  const poolLift = (th, s) => {
    if (s <= sPool) return 0;
    const k = smoothstep(sPool, sPool + 0.03, s);
    return k * 0.003 * Math.max(0, skirtDisp(th, s) / 0.024);
  };
  const skGeo = gridMesh(thetas, skirt.s.map((s) => s), (th, s, o) => {
    const [r0, y] = profAt(skirt, s);
    const r = skirtRadius(th, s, r0, y);
    o.set(Math.sin(th) * r, y + poolLift(th, s), Math.cos(th) * r);
  }, (th, s) => [th * uR, Lu + 0.06 + s]);
  group.add(G.mesh(skGeo, mat));
  // skirt surface radius at (theta, y) on the fall (base profile inverted in y, plus folds)
  const skirtR = (th, y) => {
    const pts = skirt.pts;
    let i = 1; while (i < pts.length - 1 && pts[i][1] > y) i++;
    const w = clamp((pts[i - 1][1] - y) / Math.max(1e-9, pts[i - 1][1] - pts[i][1]));
    const s = lerp(skirt.s[i - 1], skirt.s[i], w), r0 = lerp(pts[i - 1][0], pts[i][0], w);
    return skirtRadius(th, s, r0, y);
  };

  // ---- sash band ------------------------------------------------------------------
  // u from the knot round (the seam hides under the knot), v across the band
  const sashFold = Array.from({ length: 4 }, () => ({ k: 2 + Math.floor(Rg() * 4), a: 0.5 + 0.8 * Rg(), p: Rg() * TAU }));
  group.add(G.mesh(G.surface((u, v, o) => {
    const th = tb + u * TAU;
    const dk = wrapA(th - tb), nearK = Math.exp(-((dk / 0.36) ** 2));
    // the band narrows and rises a little into the knot; elsewhere it wanders in height and width
    const w = sashW * (1 - 0.42 * nearK) * (1 + 0.05 * Math.sin(3 * th + 1.1));
    const yc = yS + 0.0028 * Math.sin(th + 0.7) + 0.0014 * Math.sin(2 * th + 2.3) + 0.003 * nearK;
    const vv = v * 2 - 1;
    // a slow twist: the band leans in / out a little (cone), most at the back
    const lean = 0.06 * Math.sin(th - tb + 2.2);
    // own soft folds running along the band, wandering across it
    let fold = 0; for (const q of sashFold) fold += q.a * Math.sin(Math.PI * vv * 1.3 + q.k * th + q.p);
    const gc = Math.max(0, gather(th));
    let r = rBand + 0.0007 * fold * (1 - vv * vv) * (1 - nearK)
      + 0.0013 * gc * (1 - vv * vv) * (1 - nearK)                                  // gather crests pressing out
      + lean * vv * w / 2
      - 0.0018 * nearK;                                                             // pulled tight into the knot
    // pleats converging into the knot
    r += nearK * 0.0022 * Math.sin(vv * Math.PI * 2.2 + dk * 9) * (1 - vv * vv);
    // the edges come down onto the gathered cloth and ride over each gather crest (no gap, no teeth)
    r = lerp(r, rC + 0.0026 * gc + 0.0014, Math.pow(Math.abs(vv), 4));
    const y = yc + vv * w / 2;
    o.set(Math.sin(th) * r, y, Math.cos(th) * r);
  }, 420, 18, { closedU: true, flipNormals: true }), ribbon));

  // ---- bow ------------------------------------------------------------------------
  const Y = V3(0, 1, 0);
  const nrm = V3(Math.sin(tb), 0, Math.cos(tb)), tan = V3(Math.cos(tb), 0, -Math.sin(tb));
  const knotC = nrm.clone().multiplyScalar(rBand + 0.0125).setY(yS + 0.003);
  // loop: one layer of ribbon folded into a loop: out from the knot on the front strand, round a soft
  // fold at the far end, back on the rear strand. Open at the top and bottom (the strands stand apart),
  // flat across the width with a slight cup and a twist along the strand; pinched into the knot (fine
  // pleats) with one diagonal pinch crease running from the knot towards the upper far corner.
  // side -1 left, +1 right; L loop length, beta lift, D strand separation, w1 width at the far end.
  const loop = (side, L, beta, D, w1, droop, out, seed, twist) => {
    const A = tan.clone().multiplyScalar(side * Math.cos(beta)).addScaledVector(Y, Math.sin(beta)).addScaledVector(nrm, out).normalize();
    const Nn = nrm.clone().addScaledVector(A, -nrm.dot(A)).normalize();
    const Bw = V3().crossVectors(A, Nn).normalize();
    const up = Bw.y >= 0 ? 1 : -1; // +xw = upper edge
    const Rl = rng(31 + seed);
    const pleatP = Rl() * TAU;
    const cr = { x1: 0.72 + 0.1 * Rl(), w1: 0.55 + 0.25 * Rl() };
    const NP = 220, NW = 30, w0 = 0.022;
    const rows = [];
    for (let j = 0; j <= NW; j++) {
      const xw = ((j / NW) * 2 - 1) * up;
      const ring = [];
      for (let i = 0; i < NP; i++) {
        const ph = (i / NP) * TAU, xs = (1 - Math.cos(ph)) / 2, sn = Math.sin(ph);
        const front = sn >= 0, sg = sn >= 0 ? 1 : -1;
        const w = lerp(w0, w1, smoothstep(0.0, 0.55, xs)) * (1 - 0.06 * smoothstep(0.85, 1, xs));
        // along the loop axis: the middle of the width runs out a little further (rounded end)
        const a = 0.009 + L * xs * (1 - 0.05 * xw * xw);
        // strand separation: a soft round fold at the far end; the front strand stands off more
        const g = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, xs * 1.02))), 0.5);
        let n = sg * g * (front ? D : D * 0.55);
        // twist along the strand (one edge forward) and a slight cup, edges curling outwards
        n += sg * twist * xw * (w / 2) * Math.sin(Math.PI * xs) * (front ? 1 : 0.6);
        n += sg * 0.0035 * (xw * xw - 0.35) * Math.sin(Math.PI * xs);
        // gathered at the knot: fine pleats across the width
        n += 0.0014 * Math.sin(xw * 6 + pleatP) * Math.pow(1 - smoothstep(0, 0.28, xs), 2);
        // pinch crease: a valley from the knot towards the far upper corner, a soft ridge beside it
        if (front) {
          const lx = xs / cr.x1, lw = (xw * up + 0.1) / cr.w1; // along / across the crease line
          const dist = (lw - lx) / Math.sqrt(1 + 1 / (cr.x1 * cr.x1));
          const fade = smoothstep(0.02, 0.12, xs) * (1 - smoothstep(0.55, 0.95, lx));
          n += (-0.0034 * Math.exp(-((dist / 0.1) ** 2)) + 0.0016 * Math.exp(-(((dist - 0.17) / 0.09) ** 2))) * fade;
        }
        // the edges wave a little
        const b = (w / 2) * xw + 0.0022 * Math.pow(Math.abs(xw), 4) * Math.sin(xs * 6.5 + side + (xw > 0 ? 0 : 2.1)) * Math.sin(Math.PI * xs);
        ring.push(knotC.clone().addScaledVector(A, a).addScaledVector(Nn, n + 0.002 + 0.003 * xs).addScaledVector(Bw, b).addScaledVector(Y, -droop * xs * xs));
      }
      rows.push(ring);
    }
    return K.gridGeometry(rows, { closedU: true, flip: side * up > 0 });
  };
  group.add(G.mesh(loop(-1, 0.13, 24 * DEG, 0.024, 0.07, 0.014, 0.16, 1, 0.18), ribbon));
  group.add(G.mesh(loop(1, 0.14, 15 * DEG, 0.026, 0.074, 0.02, 0.13, 2, -0.22), ribbon));
  // knot: a band wrapped round the loop roots (u round the bundle, v across the band along tan). Its
  // edges ride up over the roots (flare), two wrap folds run round it slightly askew, the face is
  // pulled a little concave where the band is tightest
  {
    const hy = 0.025, hn = 0.016, hw = 0.0185;
    group.add(G.mesh(G.surface((u, v, o) => {
      const ps = u * TAU, xw = v * 2 - 1;
      const c = Math.cos(ps), sn = Math.sin(ps);
      const flare = 1 + 0.13 * Math.pow(Math.abs(xw), 3) - 0.05 * Math.pow(Math.abs(xw), 8);
      let k = flare * (1 - 0.04 * (1 - xw * xw) * Math.max(0, c));
      // wrap folds: ridges round the band, drifting with ps (askew), a valley between them
      k += 0.075 * Math.exp(-(((xw + 0.42 + 0.2 * sn) / 0.19) ** 2)) + 0.055 * Math.exp(-(((xw - 0.33 + 0.16 * sn) / 0.15) ** 2)) + 0.03 * Math.exp(-(((xw - 0.78 - 0.1 * sn) / 0.1) ** 2));
      k -= 0.045 * Math.exp(-(((xw - 0.0 + 0.12 * sn) / 0.12) ** 2));
      const back = c < 0 ? 0.5 : 1; // pressed onto the sash at the back
      o.copy(knotC)
        .addScaledVector(tan, xw * hw * (1 + 0.06 * sn) + 0.0025 * sn)
        .addScaledVector(Y, sn * hy * k)
        .addScaledVector(nrm, c * hn * k * back);
    }, 96, 34, { closedU: true }), ribbon));
  }

  // tails: emerge from under the knot (a short twist), then lie on the sash and the skirt: edges down on
  // the cloth, the middle bridging the fold valleys (a ribbon is stiffer across than the skirt is
  // folded), each ending in a clean swallow-tail cut (columns of different length, so the cut is crisp)
  const tail = (side, len, drift, w1, seed) => {
    const NA = 120, NX = 24;
    const yTop = yS - 0.006;
    const notch = 0.034;
    const Rt = rng(50 + seed), sway = Rt() * TAU;
    const rows = [];
    for (let j = 0; j <= NX; j++) {
      const xw = (j / NX) * 2 - 1;
      const Lx = len - notch * (1 - Math.abs(xw));
      const row = [];
      for (let i = 0; i <= NA; i++) {
        const d = (i / NA) * Lx, u = d / len;
        const yRef = yTop - d;
        const w = lerp(0.026, w1, smoothstep(0, 0.2, u));
        const rsC = Math.max(0.06, yRef > yBB ? rBand : skirtR(tb, Math.max(0.01, yRef)));
        const thC = tb + side * (0.004 + drift * Math.pow(u, 0.85) + 0.004 * Math.sin(u * 5 + sway)) / rsC;
        // envelope of the cloth under the ribbon's width (ribbon stiffness: parabolic dilation)
        let env = -1;
        for (let k = 0; k <= 16; k++) {
          const x = (k / 16) * 2 - 1;
          const th = thC + x * (w / 2) / rsC;
          const rr = yRef > yBB - 0.004 ? rBand + 0.003 : skirtR(th, Math.max(0.006, yRef));
          env = Math.max(env, rr - 4 * ((xw - x) * w / 2) ** 2);
        }
        // twist where it leaves the knot: one edge forward, flattening out over 7 cm
        const tw = side * 0.55 * (1 - smoothstep(0.0, 0.07, d));
        const th = thC + xw * (w / 2) * Math.cos(tw) / rsC;
        // edges ~2 mm off the cloth (a soft contact shadow beside them), the middle a little more, one
        // soft lengthwise fold where the ribbon was pressed in the knot
        const lift = 0.002 + 0.0016 * (1 - xw * xw) + 0.007 * smoothstep(0.55, 1, u) ** 1.5 + 0.0012 * Math.exp(-(((xw - 0.25 * side) / 0.18) ** 2)) * smoothstep(0.02, 0.1, d) * (1 - smoothstep(0.2, 0.4, u)) + xw * (w / 2) * Math.sin(tw);
        const r = env + lift;
        row.push(V3(Math.sin(th) * r, yRef, Math.cos(th) * r));
      }
      rows.push(row);
    }
    return K.gridGeometry(rows, { closedU: false, flip: side > 0 });
  };
  group.add(G.mesh(tail(-1, 0.36, 0.075, 0.062, 1), ribbon));
  group.add(G.mesh(tail(1, 0.43, 0.105, 0.064, 2), ribbon));

  // ---- probes / views -----------------------------------------------------------------
  const pU = (thd, t) => { const s = topLen + t * (sTk - topLen); const [r0, y] = profAt(upper, s); const th = thd * DEG; const r = r0 + upperDisp(th, s); return [Math.sin(th) * r, y, Math.cos(th) * r]; };
  const pK = (thd, t) => { const s = sTkB + t * (Ls - sTkB); const [r0, y] = profAt(skirt, s); const th = thd * DEG; const r = skirtRadius(th, s, r0, y); return [Math.sin(th) * r, y, Math.cos(th) * r]; };
  const probes = {
    top: [[Math.sin(34 * DEG) * 0.15, H + f + 0.002, Math.cos(34 * DEG) * 0.15]],
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
    detail: { target: [knotC.x * 1.1, yS - 0.02, knotC.z * 1.1], size: 0.34, azimuth: 22, elevation: 8 },
  };
}

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
