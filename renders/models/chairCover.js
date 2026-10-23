// Stretch stoelhoes (lycra) on the klapstoel, round 6 (furniture group). Called from chair.js for
// chair {style: 'klapstoel', cover: 'stretch', coverColor}.
//
// Art direction 22 oct 2026: the round-4 cover showed thick, smooth padded blocks for back and seat and
// plastic-looking legs: no fabric, no tension, no seams, nothing pulled tight over the frame. This cover
// is built as the sewn spandex product it is, over the klapstoel of chair.js (posts / A-tubes from the
// front feet up to the back top, raked 25 deg; rear U-legs pivoting under the seat front):
//   back sleeve  a thin sleeve (3 cm, 3.7 cm over the backrest) pulled over the backrest and both posts:
//                rounded top corners, the front and back panels meet in a sewn seam along both sides and
//                over the top; below the backrest the cloth spans post to post with nothing behind it and
//                is pulled in (a shallow concave waist, ~6 mm), with a soft ledge where it leaves the
//                backrest's lower edge; tension wrinkles fan up from the two bottom corners where the
//                sleeve is pulled down into the seat.
//   seat         taut over the seat (barely crowned), rolled front / side edges with the top seam, a skirt
//                that the elastic hem pulls in under the seat and that is drawn down into each leg sleeve,
//                so the hem hangs in arches between the legs (front, sides, back).
//   legs         four close sleeves over the tubes with a foot pocket; the extra length bunches into a few
//                soft rings just above the floor; flared into the skirt at the top.
//   frame        only the two low stretchers stay bare (as on the real product), in the frame colour.
// Material: fabric2.lycraSatin (satin-matte stretch jersey, anisotropic sheen along the stretch).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as F from '../js/furniture.js';
import * as U from '../js/upholstery2.js';
import { lycraHex } from '../js/fabric2.js';
import { jerseyKnit, jerseyEdge } from '../js/statafelLook.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// klapstoel geometry (chair.js)
const xA = 0.215, xB = 0.193;
const zA = (y) => 0.205 + (-0.175 - 0.205) * (y - 0.008) / (0.835 - 0.008);
const zU = (y) => -0.235 + (0.15 + 0.235) * (y - 0.008) / (0.415 - 0.008);

// ------------------------------------------------------------------ cloth
// The statafelrok's stretch jersey (statafelLook.jerseyKnit: same knit, macro mottle and satin lobe, so stoelhoes and
// statafelrok read as the same cloth), a little more matte for a chair: under the seat rig's strong key a dyed jersey
// at roughness 0.48 printed as patent vinyl (one hot gloss band across the back).
const jcache = new Map();
function coverJersey(hex) {
  if (jcache.has(hex)) return jcache.get(hex);
  const base = jerseyKnit(hex);
  const m = base.clone();
  m.userData = { ...base.userData, hex };
  delete m.userData.__hooked;
  // dyed (bordeaux, marineblauw: sRGB chroma > 0.12) before dark: both are below the jersey's "dark" albedo, and
  // the dark-cloth gloss (made for black) turned them into patent vinyl
  const cs = new THREE.Color(hex), chroma = Math.max(cs.r, cs.g, cs.b) - Math.min(cs.r, cs.g, cs.b);
  const dyed = chroma > 0.12;
  const L = m.userData.albedoL, dark = !dyed && L < 0.06;
  m.roughness = dark ? 0.48 : dyed ? 0.58 : 0.54;
  m.specularIntensity = dark ? 0.5 : dyed ? 0.3 : 0.4;
  m.sheen = dark ? 0.7 : 0.75; m.sheenRoughness = 0.5;
  if (dyed) m.sheenColor = m.color.clone().multiplyScalar(1.15); // fibre sheen in the dye, not black-lycra grey
  m.userData.envSpec = dark ? 0.6 : dyed ? 0.3 : 0.35;
  m.userData.grazing = { spec: 0.35, sheen: 0.9, w: 0.35 };
  m.name = `stoelhoes jersey ${hex}`;
  jcache.set(hex, m);
  return m;
}

// ------------------------------------------------------------------ bare frame parts
export function coveredFrame(bins, frameColor) {
  const key = String(frameColor || 'wit').toLowerCase();
  const frame = U.powder(key === 'zwart' ? 'zwart' : key === 'wit' ? 'wit' : 'grijs');
  const r = 0.0088;
  bins.add(frame, G.tube(V3(-xB, 0.11, zU(0.11)), V3(xB, 0.11, zU(0.11)), r, 14));
  bins.add(frame, G.tube(V3(-xA, 0.13, zA(0.13)), V3(xA, 0.13, zA(0.13)), r, 14));
}

// ------------------------------------------------------------------ back sleeve
const eT = V3(0, 0.827, -0.38).normalize();
const eN = V3(0, -eT.z, eT.y);
const O = V3(0, 0.474, zA(0.474));
const W0 = 0.231, T_TOP = 0.414, RC = 0.026, T0 = -0.04;
// round 7: the post tops (2.5 cm above the backrest's top edge) hold the sleeve up at its corners; between them the
// cloth bridges the backrest in a shallow dip, and tension folds run down from each post top
const XP = 0.215;
const topSag = (x, t) => 0.016 * Math.max(0, 1 - (x / (XP + 0.004)) ** 2) ** 1.4 * sstep(T_TOP - 0.07, T_TOP, t);
const bw = (x, t, n) => O.clone().add(V3(x, 0, 0)).addScaledVector(eT, t).addScaledVector(eN, n);
const H0 = (t) => 0.0145 + 0.0038 * sstep(0.15, 0.2, t) * (1 - sstep(0.36, 0.395, t));
// (the foot of the sleeve, inside the seat cover, is drawn in a little so it cannot poke out under the edge roll)
const Wt = (t) => { const tc = T_TOP - RC; const w0 = W0 - 0.012 * sstep(0.012, -0.03, t); return t <= tc ? w0 : W0 - RC + Math.sqrt(Math.max(0, RC * RC - (t - tc) ** 2)); };
const Ht = (t) => { const h = H0(t), tc = T_TOP - h; return t <= tc ? h : Math.sqrt(Math.max(0, h * h - (t - tc) ** 2)); };
const curveN = (x, t) => sstep(0.06, 0.24, t) * 1.1 * (1 - Math.cos(x / 1.1)); // the sleeve follows the curved backrest
// lower zone: nothing behind the cloth between the posts, it is pulled in towards the centre plane
const pull = (t) => 0.0115 * sstep(-0.01, 0.06, t) * (1 - sstep(0.125, 0.185, t));

function backSleeve(bins, fab, noise) {
  const nu = 220, nv = 150;
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  const wr = [];
  // tension wrinkles from the bottom corners: [angle from vertical (deg), length (m), amplitude]
  for (const [a, L, A] of [[18, 0.13, 0.0026], [36, 0.17, 0.0034], [54, 0.12, 0.0024], [70, 0.09, 0.0016]]) wr.push({ a: a * DEG, L, A });
  for (let j = 0; j <= nv; j++) {
    // denser rows near the top (round over) and the bottom
    const vv = j / nv;
    const t = T0 + (T_TOP - T0) * (vv < 0.9 ? vv / 0.9 * 0.93 : 0.93 + (vv - 0.9) / 0.1 * 0.07);
    const W = Wt(t), H = Math.max(1e-5, Ht(t)), w = Math.max(0, W - H);
    const per = 4 * w + 2 * Math.PI * H;
    for (let i = 0; i <= nu; i++) {
      const s = (i / nu) * per;
      let x, n, side; // side: +1 front sheet, -1 back sheet, 0 on a rounded end
      if (s < 2 * w) { x = -w + s; n = H; side = 1; }
      else if (s < 2 * w + Math.PI * H) { const f = (s - 2 * w) / H; x = w + H * Math.sin(f); n = H * Math.cos(f); side = 0; }
      else if (s < 4 * w + Math.PI * H) { x = w - (s - 2 * w - Math.PI * H); n = -H; side = -1; }
      else { const f = (s - 4 * w - Math.PI * H) / H; x = -w - H * Math.sin(f); n = -H * Math.cos(f); side = 0; }
      // sheets pulled in below the backrest (zero on the rounded ends round the posts)
      const sw = w > 0 ? Math.max(0, 1 - (x / w) ** 2) : 0;
      if (side !== 0) n -= side * pull(t) * Math.pow(sw, 1.2);
      // tension wrinkles fanning up from the bottom corners (front sheet, a weaker copy on the back)
      if (side !== 0 && t < 0.2) {
        let rdg = 0;
        for (const sx of [-1, 1]) for (const q of wr) {
          const dx = -sx * Math.sin(q.a), dt = Math.cos(q.a);
          const px = x - sx * (w - 0.004), pt = t - 0.0;
          const al = px * dx + pt * dt, dl = Math.abs(px * dt - pt * dx);
          if (al <= 0) continue;
          rdg += q.A * Math.exp(-((dl / (0.0045 + 0.012 * al)) ** 2)) * sstep(0.0, 0.02, al) * (1 - sstep(q.L * 0.45, q.L, al)) * (1 + 0.3 * noise(al * 30, q.a * 7 + sx));
        }
        n += side * rdg * (side > 0 ? 1 : 0.6);
      }
      // a faint unevenness of the cloth (no perfect CG plane)
      n += side * 0.0004 * noise(x * 14, t * 11) * sw;
      // folds from the post tops: the sleeve hangs from them and is pulled down onto the seat
      if (side !== 0 && t > T_TOP - 0.2) {
        let rdg = 0;
        for (const sx of [-1, 1]) for (const [a0, L, A] of [[12, 0.16, 0.0019], [30, 0.13, 0.0023], [50, 0.1, 0.0016], [68, 0.07, 0.001]]) {
          const a = a0 * DEG, dx = -sx * Math.sin(a), dt = -Math.cos(a);
          const px = x - sx * (XP - 0.002), pt = t - (T_TOP - 0.012);
          const al = px * dx + pt * dt, dl = Math.abs(px * dt - pt * dx);
          if (al <= 0) continue;
          rdg += A * Math.exp(-((dl / (0.004 + 0.02 * al)) ** 2)) * sstep(0.0, 0.025, al) * (1 - sstep(L * 0.4, L, al)) * (1 + 0.3 * noise(al * 25, a0 + sx * 5));
        }
        n += side * rdg * (side > 0 ? 1 : 0.7);
      }
      n += curveN(x, t);
      const P = bw(x, t - topSag(x, t), n);
      const k = j * (nu + 1) + i;
      pos[k * 3] = P.x; pos[k * 3 + 1] = P.y; pos[k * 3 + 2] = P.z;
      uv[k * 2] = s; uv[k * 2 + 1] = t;
    }
  }
  const g = gridGeo(pos, uv, nu, nv, true);
  bins.add(fab, g);
  // the sewn seam where front and back panels meet: along both sides and over the top
  const seam = [];
  const outline = [];
  const N = 90, cx = W0 - RC, ct = T_TOP - RC;
  const tS = 0.016; // the seam starts above the sleeve's drawn-in foot
  for (let k = 0; k <= N; k++) outline.push([-W0, tS + (ct - tS) * (k / N)]);
  for (let k = 1; k <= 30; k++) { const a = Math.PI - (k / 30) * (Math.PI / 2); outline.push([-cx + RC * Math.cos(a), ct + RC * Math.sin(a)]); }
  for (let k = 1; k < 60; k++) outline.push([-cx + (2 * cx * k) / 60, T_TOP]);
  for (let k = 0; k <= 30; k++) { const a = Math.PI / 2 - (k / 30) * (Math.PI / 2); outline.push([cx + RC * Math.cos(a), ct + RC * Math.sin(a)]); }
  for (let k = 1; k <= N; k++) outline.push([W0, ct - (ct - tS) * (k / N)]);
  for (const [x, t] of outline) seam.push(bw(x, t - topSag(x, t), curveN(x, t)));
  // the corner pieces above use the outline of Wt(t), so the seam sits exactly on the rounded ends;
  // push it out by its own radius minus a little (stitched welt, not floating)
  const sr = 0.0007;
  const out = seam.map((p, k) => {
    const a = seam[Math.max(0, k - 1)], b = seam[Math.min(seam.length - 1, k + 1)];
    const tg = b.clone().sub(a).normalize();
    const o = new THREE.Vector3().crossVectors(tg, eN).normalize();
    // o points away from the sleeve's centre line: make sure
    const c = O.clone().addScaledVector(eT, 0.2);
    if (o.dot(p.clone().sub(c)) < 0) o.negate();
    return p.clone().addScaledVector(o, sr * 0.3);
  });
  // round 7: a fine overlocked seam in a slightly darker thread, half sunk into the cloth (a line, not piping)
  bins.add(seamThread(fab.userData.hex), F.sweep(out, G.circleProfile(sr, 6)));
}
function seamThread(hex) {
  const key = `seam:${hex}`;
  if (jcache.has(key)) return jcache.get(key);
  const c = new THREE.Color(hex); const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const m = new THREE.MeshStandardMaterial({ color: L < 0.05 ? c.clone().multiplyScalar(1.6) : c.clone().multiplyScalar(0.72), roughness: 0.85, metalness: 0, name: `seam thread ${hex}` });
  m.userData.albedoL = L * 0.72;
  jcache.set(key, m);
  return m;
}

// grid surface from flat arrays (rows j, columns i), optionally closed in u (weld normals)
function gridGeo(pos, uv, nu, nv, closedU = false) {
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (closedU) {
    const n = g.attributes.normal;
    for (let j = 0; j <= nv; j++) {
      const a = j * (nu + 1), b = a + nu;
      const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return g;
}

// ------------------------------------------------------------------ seat with skirt
const X0 = 0.234, ZF = 0.222, ZR = -0.196, RCP = 0.045, RE = 0.017, YS = 0.48;
const ZC = (ZF + ZR) / 2, D0 = (ZF - ZR) / 2;
// rounded rectangle (half sizes hx, hz, corner radius rc) centred at (0, ZC): point + outward normal at
// perimeter fraction s, starting at the front centre and running towards +x (counter-clockwise from above)
function rrect(hx, hz, rc, s) {
  const lx = 2 * (hx - rc), lz = 2 * (hz - rc), la = (Math.PI * rc) / 2;
  const P = 2 * lx + 2 * lz + 4 * la;
  let d = (((s % 1) + 1) % 1) * P;
  const segs = [
    ['l', lx / 2, (u) => [u, hz, 0, 1]],
    ['a', la, (u) => { const a = Math.PI / 2 - u / rc; return [hx - rc + rc * Math.cos(a), hz - rc + rc * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    ['l', lz, (u) => [hx, hz - rc - u, 1, 0]],
    ['a', la, (u) => { const a = -u / rc; return [hx - rc + rc * Math.cos(a), -(hz - rc) + rc * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    ['l', lx, (u) => [hx - rc - u, -hz, 0, -1]],
    ['a', la, (u) => { const a = -Math.PI / 2 - u / rc; return [-(hx - rc) + rc * Math.cos(a), -(hz - rc) + rc * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    ['l', lz, (u) => [-hx, -(hz - rc) + u, -1, 0]],
    ['a', la, (u) => { const a = Math.PI - u / rc; return [-(hx - rc) + rc * Math.cos(a), hz - rc + rc * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    ['l', lx / 2, (u) => [-(hx - rc) + u, hz, 0, 1]],
  ];
  for (const [, len, f] of segs) { if (d <= len + 1e-9) { const [x, z, nx, nz] = f(Math.min(d, len)); return { x, z: z + ZC, nx, nz, P }; } d -= len; }
  const [x, z, nx, nz] = segs[segs.length - 1][2](segs[segs.length - 1][1]);
  return { x, z: z + ZC, nx, nz, P };
}
// Round 7 (art direction 22 oct: "a rigid padded chair, no stretched fabric, no tension over the frame"): the skirt
// is no longer a short valance on a seat block. The cover is one body with four leg pockets: the cloth runs from
// the seat's edge roll down into a funnel (gusset) round each leg, ~9 cm under the seat, and between the legs the
// elastic hem is pulled up into high arches (the apex ~3 cm under the edge). Drag folds fan up from every gusset.
// Leg tubes: the U-legs leave the seat under its front corners, the A-posts at the sides.
export const LEGS = [
  { x: xB, zf: (y) => zU(y), yG: 0.398, corner: true },
  { x: xA, zf: (y) => zA(y), yG: 0.392, corner: false },
  { x: -xA, zf: (y) => zA(y), yG: 0.392, corner: false },
  { x: -xB, zf: (y) => zU(y), yG: 0.398, corner: true },
];
const RG = 0.021; // radius of the funnel's neck round a leg (the leg pocket's mouth)
const GW = 0.052; // half width of a gusset along the seat perimeter (m)
function seatCover(bins, fab, noise) {
  const nu = 360, nv = 120, vA = 0.4, vB = 0.55;
  const P = rrect(X0, D0, RCP, 0).P;
  // anchor of each leg on the perimeter: a U-leg at the 45 deg point of its front corner, a post at the side
  const S = 4000;
  const anchors = LEGS.map((L) => {
    const C = V3(L.x, L.yG, L.zf(L.yG));
    let best = 0, bd = 1e9;
    for (let k = 0; k < S; k++) {
      const q = rrect(X0, D0, RCP, k / S);
      const tx = L.corner ? Math.sign(L.x) * (X0 - RCP + RCP * Math.SQRT1_2) : L.x;
      const tz = L.corner ? ZF - RCP + RCP * Math.SQRT1_2 : L.zf(L.yG);
      const dd = (q.x - (L.corner ? tx : Math.sign(L.x) * X0)) ** 2 + (q.z - tz) ** 2;
      if (dd < bd) { bd = dd; best = k / S; }
    }
    return { s: best, C, L };
  }).sort((p, q) => p.s - q.s);
  const wrap = (d) => { d = ((d % 1) + 1) % 1; return d > 0.5 ? d - 1 : d; };
  const gw = GW / P;
  const yTop = YS - RE;
  // perimeter tangent (direction of increasing s) at fraction s
  const tang = (s) => { const a = rrect(X0, D0, RCP, s - 1e-4), b = rrect(X0, D0, RCP, s + 1e-4); const t = V3(b.x - a.x, 0, b.z - a.z); return t.normalize(); };
  // hem point at perimeter fraction s: a half ring round the leg inside a gusset, a high arch between gussets
  function gussetPt(an, u) {
    const out = rrect(X0, D0, RCP, an.s);
    const n = V3(out.nx, 0, out.nz).normalize(), t = tang(an.s);
    const th = u * (Math.PI / 2) * 0.98;
    return an.C.clone().addScaledVector(n, RG * Math.cos(th)).addScaledVector(t, RG * Math.sin(th));
  }
  const hemAt = (s) => {
    for (const an of anchors) {
      const d = wrap(s - an.s);
      if (Math.abs(d) <= gw) return { p: gussetPt(an, d / gw), g: d / gw, an };
    }
    // in an arch: between gusset edge a+ (end of anchor k) and b- (start of anchor k+1)
    for (let k = 0; k < anchors.length; k++) {
      const a = anchors[k], b = anchors[(k + 1) % anchors.length];
      const sa = a.s + gw; let sb = b.s - gw; if (sb < sa) sb += 1;
      let ss = s; if (ss < sa) ss += 1;
      if (ss >= sa && ss <= sb) {
        const f = (ss - sa) / (sb - sa), span = (sb - sa) * P;
        const Ea = gussetPt(a, 1), Eb = gussetPt(b, -1);
        const pin = (q) => { const o = rrect(X0, D0, RCP, q); return V3(o.x - o.nx * 0.013, 0, o.z - o.nz * 0.013); };
        const base = pin(ss);
        const wa = Math.pow(1 - f, 2.2), wb = Math.pow(f, 2.2);
        const p = base.clone().addScaledVector(Ea.clone().sub(pin(sa)).setY(0), wa).addScaledVector(Eb.clone().sub(pin(sb)).setY(0), wb);
        // short arches (between a front-corner pocket and the post pocket on a side) stay low: drawn up high
        // they opened a small dark hole under the seat
        const yA = Math.min(yTop - 0.03, Math.min(Ea.y, Eb.y) + (span < 0.16 ? 0.12 : 0.5) * span);
        const yy = Ea.y * (1 - f) + Eb.y * f;
        p.y = yy + (yA - yy) * Math.pow(Math.sin(Math.PI * f), 0.55);
        return { p, g: null, f, span };
      }
    }
    return { p: V3(0, yTop - 0.05, 0), g: null };
  };
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  const sleeveZ = O.z;
  const hems = [];
  for (let i = 0; i <= nu; i++) hems.push(hemAt(i / nu));
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    for (let i = 0; i <= nu; i++) {
      const s = i / nu;
      const out = rrect(X0, D0, RCP, s), inn = rrect(X0 - RE, D0 - RE, RCP - RE, s);
      let x, y, z;
      if (v <= vA) {
        const r = v / vA;
        x = inn.x * r; z = ZC + (inn.z - ZC) * r;
        // taut over the seat board: nearly flat, the cloth drawn a little into the board's rim
        y = YS + 0.0016 * (1 - r ** 4) - 0.0012 * sstep(0.8, 1, r) * (1 - sstep(0.97, 1, r));
        // pull ridges towards the back sleeve's bottom corners (the sleeve drags the seat panel up)
        for (const sx of [-1, 1]) {
          const dx = x - sx * (W0 - 0.012), dz = z - sleeveZ;
          if (dz > 0) {
            const ang = Math.atan2(dx * -sx, dz), rad = Math.hypot(dx, dz);
            const rid = Math.cos(ang * 6 + 1.3 * sx) * Math.exp(-rad / 0.085) * sstep(0.008, 0.03, rad);
            y += 0.0024 * Math.max(0, rid);
          }
        }
        // drag from the front corners into the leg pockets: shallow ridges running diagonally to each corner
        for (const an of anchors) {
          if (!an.L.corner) continue;
          const cx = Math.sign(an.L.x) * (X0 - 0.02), cz = ZF - 0.02;
          const dx = x - cx, dz = z - cz, rad = Math.hypot(dx, dz);
          const ang = Math.atan2(dz, dx * Math.sign(an.L.x));
          const rid = Math.cos(ang * 7 + 0.7) * Math.exp(-rad / 0.085) * sstep(0.006, 0.02, rad);
          y += 0.0022 * Math.max(0, rid);
        }
        y += 0.0004 * noise(x * 16, z * 16);
      } else if (v <= vB) {
        const th = ((v - vA) / (vB - vA)) * (Math.PI / 2);
        x = inn.x + out.nx * RE * Math.sin(th); z = inn.z + out.nz * RE * Math.sin(th);
        y = YS - RE * (1 - Math.cos(th));
      } else {
        const f = (v - vB) / (1 - vB);
        const H = hems[i].p;
        const top = V3(out.x, yTop, out.z);
        // ruled from the edge roll to the hem, eased so it leaves the roll vertically
        const fe = 1 - Math.pow(1 - f, 1.6);
        x = top.x + (H.x - top.x) * fe; z = top.z + (H.z - top.z) * fe;
        y = top.y + (H.y - top.y) * f;
        // the stretched panel is drawn in a little between the roll and the hem (tension), most mid-arch
        const n = V3(out.nx, 0, out.nz);
        let k = -0.004 * Math.sin(Math.PI * f) * (hems[i].g == null ? Math.pow(Math.sin(Math.PI * (hems[i].f || 0)), 0.5) : 0);
        // drag folds fanning up from each gusset neck into the panel (3 per side, the inner ones longer)
        for (const an of anchors) {
          const ds = wrap(s - an.s) * P;
          const up = Math.max(0, y - an.C.y);
          for (const sg of [-1, 1]) for (const [ang, A, Lf] of [[16, 0.0048, 0.11], [34, 0.0042, 0.1], [54, 0.003, 0.075], [72, 0.0018, 0.05]]) {
            const a2 = ang * DEG, dx = sg * Math.sin(a2), dy = Math.cos(a2);
            const al = ds * dx + up * dy, dl = Math.abs(ds * dy - up * dx);
            if (al > 0.006) k += A * Math.exp(-((dl / (0.0035 + 0.07 * al)) ** 2)) * sstep(0.006, 0.02, al) * (1 - sstep(Lf * 0.45, Lf, al)) * (1 + 0.25 * noise(al * 30, ang + sg * 3 + an.s * 10));
          }
        }
        x += n.x * k; z += n.z * k;
      }
      const kk = j * (nu + 1) + i;
      pos[kk * 3] = x; pos[kk * 3 + 1] = y; pos[kk * 3 + 2] = z;
      if (v <= vA) { uv[kk * 2] = x; uv[kk * 2 + 1] = z; } else { uv[kk * 2] = s * P; uv[kk * 2 + 1] = y; }
    }
  }
  bins.add(fab, gridGeo(pos, uv, nu, nv, true));
  // the rolled elastic hem along each arch (not round the leg pockets: those are sewn on flat)
  // the top seam on the edge roll (seat panel to skirt), fine and half sunk
  {
    const sp = [];
    for (let k = 0; k <= 480; k++) {
      const s = k / 480, out = rrect(X0, D0, RCP, s), inn = rrect(X0 - RE, D0 - RE, RCP - RE, s);
      const th = 30 * DEG;
      sp.push(V3(inn.x + out.nx * (RE * Math.sin(th) + 0.0002), YS - RE * (1 - Math.cos(th)) + 0.0002, inn.z + out.nz * (RE * Math.sin(th) + 0.0002)));
    }
    bins.add(seamThread(fab.userData.hex), F.sweep(sp, G.circleProfile(0.0007, 6), { closed: true }));
  }
  const edge = jerseyEdge(fab.userData.hex);
  let run = [];
  const flush = () => { if (run.length > 3) bins.add(edge, F.sweep(run, G.circleProfile(0.0022, 10))); run = []; };
  for (let k = 0; k <= 720; k++) {
    const s = k / 720, h = hemAt(s);
    if (h.g != null) { flush(); continue; }
    const out = rrect(X0, D0, RCP, s);
    run.push(h.p.clone().add(V3(-out.nx * 0.0012, 0.0016, -out.nz * 0.0012)));
  }
  flush();
}

// ------------------------------------------------------------------ leg sleeves
// From the foot pocket up to the gusset neck (radius RG at yG, then on inside the funnel); the extra length
// bunches in soft, uneven rings above the foot, and two long shallow twist folds run down the tube.
function legSleeve(bins, fab, foot, top, { r = 0.0148, seed = 1, noise, neck = RG, seamAng = 0.4 }) {
  const axis = top.clone().sub(foot); const L = axis.length(); axis.normalize();
  const prof = [];
  for (let k = 0; k <= 7; k++) { const a = (k / 7) * (Math.PI / 2); prof.push([Math.max(0.0001, (r + 0.0022) * Math.sin(a)), 0.012 * (1 - Math.cos(a))]); }
  let h = 0.012;
  while (h < L) {
    h = Math.min(L, h + 0.0035);
    const ring = h < 0.1 ? Math.max(0, Math.sin(h * 2 * Math.PI / (0.016 + 0.006 * noise(h * 30, seed)))) ** 2 * 0.0013 * (1 - h / 0.1) * (0.6 + 0.4 * noise(h * 70, seed + 7)) : 0;
    const flare = (neck - r) * sstep(L - 0.075, L - 0.004, h) ** 1.3;
    prof.push([r + 0.0016 * Math.max(0, 1 - h / 0.05) + ring + flare + 0.0003 * noise(h * 25 + seed, 3.3), h]);
  }
  prof.push([neck * 1.05, L + 0.012], [neck * 0.6, L + 0.02]);
  const rOf = (hq) => { for (let k = 1; k < prof.length; k++) if (prof[k][1] >= hq) { const [r0, h0] = prof[k - 1], [r1, h1] = prof[k]; return r0 + (r1 - r0) * ((hq - h0) / Math.max(1e-6, h1 - h0)); } return prof[prof.length - 1][0]; };
  const g = F.latheAt(prof.slice().reverse(), foot, axis, 36);
  // twist folds: a slow helical ridge pair (cloth turned a little when pulled on)
  const pos = g.attributes.position, tmp = V3(0, 0, 0);
  const side = V3(1, 0, 0).sub(axis.clone().multiplyScalar(axis.x)).normalize(), side2 = new THREE.Vector3().crossVectors(axis, side);
  // round 7: deeper, slower twist folds (the sleeves read as painted tubes)
  const twist = (ang, hh) => {
    if (hh < 0.02 || hh > L - 0.03) return 0;
    const amp = 0.003 * sstep(0.02, 0.08, hh) * (1 - sstep(L - 0.1, L - 0.03, hh)) * (0.55 + 0.45 * noise(hh * 6, seed * 3));
    return amp * Math.max(0, Math.cos(2 * (ang - hh * (5 + seed % 3) - seed))) ** 3;
  };
  for (let i = 0; i < pos.count; i++) {
    tmp.fromBufferAttribute(pos, i).sub(foot);
    const hh = tmp.dot(axis); const rv = tmp.clone().addScaledVector(axis, -hh); const rr = rv.length();
    if (rr < 1e-4 || hh < 0.02 || hh > L - 0.03) continue;
    const ang = Math.atan2(rv.dot(side2), rv.dot(side));
    rv.multiplyScalar((rr + twist(ang, hh)) / rr);
    const P2 = foot.clone().addScaledVector(axis, hh).add(rv);
    pos.setXYZ(i, P2.x, P2.y, P2.z);
  }
  g.computeVertexNormals();
  bins.add(fab, g);
  // the sleeve's sewn seam down its outer back side (a fine, half-sunk thread line)
  const sp = [];
  for (let hq = 0.016; hq <= L + 0.004; hq += 0.004) {
    const rr = rOf(hq) + twist(seamAng, hq) + 0.0002;
    const dir = side.clone().multiplyScalar(Math.cos(seamAng)).addScaledVector(side2, Math.sin(seamAng));
    sp.push(foot.clone().addScaledVector(axis, hq).addScaledVector(dir, rr));
  }
  bins.add(seamThread(fab.userData.hex), F.sweep(sp, G.circleProfile(0.0006, 6)));
}

export function stretchCoverFull(bins, coverColor) {
  const hex = lycraHex(coverColor || 'wit');
  const fab = coverJersey(hex);
  const { noise } = makeNoise2(29);
  backSleeve(bins, fab, noise);
  seatCover(bins, fab, noise);
  for (const s of [-1, 1]) {
    // front: the A-tubes from the front foot up to the seat side
    legSleeve(bins, fab, V3(s * xA, 0.012, zA(0.012)), V3(s * xA, LEGS[1].yG, zA(LEGS[1].yG)), { seed: 2 + s, noise, seamAng: s > 0 ? 0.5 : Math.PI - 0.5 });
    // rear U-legs: from the rear foot up under the seat front
    legSleeve(bins, fab, V3(s * xB, 0.012, zU(0.012)), V3(s * xB, LEGS[0].yG, zU(LEGS[0].yG)), { seed: 5 + s, noise, r: 0.0142, seamAng: s > 0 ? -0.5 : Math.PI + 0.5 });
  }
}
