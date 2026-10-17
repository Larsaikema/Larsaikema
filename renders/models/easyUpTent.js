// Easy-up / pop-up partytent (vouwtent).
//
// Construction modelled after professional folding gazebos:
//  - telescopic hexagonal aluminium legs (Premium 40 -> 34 mm, Professional 50 -> 44 mm):
//    the wide outer tube hangs from the corner bracket, the narrower inner tube slides out
//    at the bottom; moulded collar, spring push-button in one of the adjustment holes;
//    square galvanised foot plates with peg holes and gussets;
//  - tall fixed corner bracket (nylon on Premium, cast aluminium on Professional) whose
//    lower end shows below the valance, and a slider on the leg at the truss bottom;
//  - scissor trusses: flat rectangular profiles in an X-lattice (2-4 X's per span) with
//    domed pivot bolts, nylon node connectors, inner diagonal scissors to a centre hub;
//  - telescopic centre pole + four rafters per bay running to the mid-side connectors;
//  - ONE canopy piece (also over several bays): pyramid per bay with soft rafter ridges,
//    2-4 cm sag between rafters and hips, taped + double-stitched hip seams, reinforcement
//    patches at the corners and apex, tension wrinkles fanning from the corner pockets,
//    eave edge scalloping between the velcro attachments, soft valley over inner trusses;
//  - valance as a real fabric skirt: square sewn corner seams, piping where it meets the
//    roof, slight outward flare, gentle waves between legs, folded hem stitched 2 cm up;
//  - optional side walls hung from the roof edge (closed / PVC window / 2 church windows /
//    centred zip door with roll-up straps / opened door / panorama / rolled up), with
//    hem, ground gap, velcro tabs around the legs and tension wrinkles;
//  - optional stackable weight plates (slot + grip hole) on top of the foot plates.
// Units: metres. X = width (front side), Z = depth, front faces +Z.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as TX from '../js/textures.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;

const SPEC = {
  premium: {
    leg: 0.040, inner: 0.034, eave: 2.10, trussDrop: 0.50, bar: [0.028, 0.013], valance: 0.21,
    bracket: 'nylon', bracketDrop: 0.235, plate: 0.13, rafter: 0.016,
  },
  professional: {
    leg: 0.050, inner: 0.044, eave: 2.14, trussDrop: 0.56, bar: [0.034, 0.016], valance: 0.22,
    bracket: 'alu', bracketDrop: 0.25, plate: 0.15, rafter: 0.019,
  },
};

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const smax = (a, b, k) => { if (k <= 0) return Math.max(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
const sabs = (x, e) => Math.sqrt(x * x + e * e) - e;
function linspace(a, b, n) { const out = []; for (let i = 0; i <= n; i++) out.push(a + (b - a) * (i / n)); return out; }
function lumOf(hex) { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

function parseWalls(walls) {
  // accepts ["back:window", {side:'left', type:'window'}, ...] or {front:'door', back:'closed'}
  const out = {};
  if (!walls) return out;
  if (walls === 'all' || walls === true) return { front: 'closed', back: 'closed', left: 'closed', right: 'closed' };
  if (Array.isArray(walls)) {
    for (const w of walls) {
      if (typeof w === 'string') { const [side, type = 'closed'] = w.split(':'); out[side] = type; }
      else if (w && w.side) out[w.side] = w.type || 'closed';
    }
  } else if (typeof walls === 'object') Object.assign(out, walls);
  return out;
}

// ---------------------------------------------------------------------------------------
// small geometry helpers (all return BufferGeometry with position/normal/uv)

// Grid surface from a point function; normals from the mesh.
function grid(fn, nu, nv, { flip = false, uv = [1, 1] } = {}) {
  return G.surface(fn, nu, nv, { flipNormals: flip, uvScale: uv });
}

// Tube swept along a polyline of points (V3[]), circular cross-section.
function sweepTube(pts, r, radial = 10, closed = false) {
  const n = pts.length;
  const T = [], N = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.push(b.clone().sub(a).normalize());
  }
  // parallel-transport frames
  let ref = Math.abs(T[0].y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0);
  let nn = ref.clone().addScaledVector(T[0], -ref.dot(T[0])).normalize();
  for (let i = 0; i < n; i++) {
    if (i > 0) { nn.addScaledVector(T[i], -nn.dot(T[i])).normalize(); }
    N.push(nn.clone()); B.push(V3().crossVectors(T[i], nn).normalize());
  }
  return G.surface((u, v, o) => {
    const i = Math.min(n - 1, Math.round(u * (n - 1)));
    const a = v * TAU;
    o.copy(pts[i]).addScaledVector(N[i], Math.cos(a) * r).addScaledVector(B[i], Math.sin(a) * r);
  }, n - 1, radial, { closedU: closed });
}

// Dashed topstitching along a dense polyline with per-sample surface normals.
// Each stitch is a tiny raised pillow (thread lying on the cloth).
function stitchGeo(samples, { dash = 0.0042, gap = 0.0024, width = 0.0011, lift = 0.00055, base = 0.0004 } = {}) {
  if (samples.length < 2) return null;
  const acc = [0];
  for (let i = 1; i < samples.length; i++) acc.push(acc[i - 1] + samples[i].p.distanceTo(samples[i - 1].p));
  const total = acc[acc.length - 1];
  const at = (s) => {
    let i = 1; while (i < acc.length - 1 && acc[i] < s) i++;
    const t = (s - acc[i - 1]) / Math.max(1e-9, acc[i] - acc[i - 1]);
    return { p: samples[i - 1].p.clone().lerp(samples[i].p, t), n: samples[i - 1].n.clone().lerp(samples[i].n, t).normalize() };
  };
  const pos = [], idx = [], uv = [];
  const pitch = dash + gap;
  const count = Math.floor((total - 0.002) / pitch);
  const off = (total - count * pitch + gap) / 2;
  for (let k = 0; k < count; k++) {
    const s0 = off + k * pitch, s1 = s0 + dash;
    const A = at(s0), Bp = at(s1);
    const t = Bp.p.clone().sub(A.p).normalize();
    const nrm = A.n.clone().add(Bp.n).normalize();
    const bi = V3().crossVectors(nrm, t).normalize();
    const b0 = pos.length / 3;
    for (let ia = 0; ia < 3; ia++) {
      const fa = ia / 2;
      const c = A.p.clone().lerp(Bp.p, fa);
      for (let ic = 0; ic < 3; ic++) {
        const fc = ic - 1;
        const h = base + lift * (1 - fc * fc) * (ia === 1 ? 1 : 0.35);
        const q = c.clone().addScaledVector(bi, fc * width / 2).addScaledVector(nrm, h);
        pos.push(q.x, q.y, q.z); uv.push(fa, fc);
      }
    }
    for (let ia = 0; ia < 2; ia++) for (let ic = 0; ic < 2; ic++) {
      const a = b0 + ia * 3 + ic, b = a + 3, c = a + 1, d = b + 1;
      idx.push(a, b, c, c, b, d);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // make sure normals face along the surface normal (thread is seen from outside)
  return g;
}

// ---------------------------------------------------------------------------------------
export function easyUpTent(p = {}) {
  let w = Number(p.w ?? p.width ?? 3), d = Number(p.d ?? p.depth ?? 3);
  if (d > w && p.orient !== 'keep') [w, d] = [d, w]; // long side faces the camera
  const kind = (p.legs || p.frame || 'premium').toLowerCase().startsWith('pro') ? 'professional' : 'premium';
  const S = SPEC[kind];
  const He = Number(p.height ?? S.eave);
  const color = p.color || 'wit';
  const colorHex = M.resolveColor(color, M.COLORS.wit);
  const light = lumOf(colorHex) > 0.45;
  const fabric = M.tentFabric(color);
  const thread = M.tentThread(color);
  const alu = M.aluminium({ roughness: 0.26 });
  const aluInner = M.aluminium({ tone: '#C9CCD0', roughness: 0.34 });
  const bracketMat = S.bracket === 'nylon' ? M.nylon('#151515') : M.aluminium({ tone: '#B4B8BC', roughness: 0.46 });
  const nylon = M.nylon('#151515');
  const galv = M.galvanised();
  const dark = M.rubber('#0B0B0B');
  const chrome = M.chrome();
  const bins = new G.PartBin();
  const group = new THREE.Group();
  group.name = `easyUpTent ${w}x${d} ${kind} ${color}`;
  const stitches = []; // geometries with thread material

  const legAF = S.leg;
  const inset = legAF / 2 + 0.012;
  const nbx = w > 4.01 ? Math.ceil(w / 4) : 1;
  const nbz = d > 4.01 ? Math.ceil(d / 4) : 1;
  const xs = linspace(-w / 2 + inset, w / 2 - inset, nbx);
  const zs = linspace(-d / 2 + inset, d / 2 - inset, nbz);
  const trussTop = He - 0.035;
  const trussBot = He - S.trussDrop;
  const [barW, barT] = S.bar;
  const eaveY = He + 0.012;
  const walls = parseWalls(p.walls);

  // ---- roof surface field ------------------------------------------------------------
  const roofOv = 0.022; // roof runs slightly past the frame
  const X0 = -w / 2 - roofOv, X1 = w / 2 + roofOv, Z0 = -d / 2 - roofOv, Z1 = d / 2 + roofOv;
  const roofX = [X0, ...xs.slice(1, -1), X1];
  const roofZ = [Z0, ...zs.slice(1, -1), Z1];
  const bays = [];
  for (let i = 0; i < nbx; i++) for (let j = 0; j < nbz; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    const bw = roofX[i + 1] - roofX[i], bd = roofZ[j + 1] - roofZ[j];
    const rise = 0.30 * Math.min(bw, bd) + 0.06;
    bays.push({ x0: roofX[i], x1: roofX[i + 1], z0: roofZ[j], z1: roofZ[j + 1], cx, cz, rise, peakY: eaveY + rise, sag: 0.012 * Math.min(bw, bd) });
  }
  const rn = makeNoise2(41);
  // outer roof corners: [x, z, inward sign x, inward sign z]
  const corners = [[X0, Z1, 1, -1], [X1, Z1, -1, -1], [X1, Z0, -1, 1], [X0, Z0, 1, 1]];
  // attachment points along each outer edge: every ~0.5 m, always at corners and legs
  const edgeSpacing = (L) => L / Math.max(1, Math.round(L / 0.5));

  function bayHeight(b, x, z) {
    const du = x - b.cx, dv = z - b.cz;
    const hx = du < 0 ? b.cx - b.x0 : b.x1 - b.cx;
    const hz = dv < 0 ? b.cz - b.z0 : b.z1 - b.cz;
    const a = Math.abs(du) / hx, c = Math.abs(dv) / hz;
    const kh = 0.024 / Math.min(hx, hz); // hip crease rounded over ~2 cm
    const m = smax(a, c, kh);
    const ea = 0.035 / Math.min(hx, hz); // rounded apex (fabric over the pole cap)
    const m2 = (Math.sqrt(m * m + ea * ea) - ea) / (Math.sqrt(1 + ea * ea) - ea);
    let h = eaveY + b.rise * (1 - m2);
    const major = Math.max(a, c), minor = Math.min(a, c);
    if (major < 1) {
      // sag between the rafter (face centre line) and the hips
      const r = major;
      const q = minor / Math.max(major, 1e-6);
      const lat = (c >= a ? hx : hz) * r;
      const e = 0.016 / Math.max(lat, 0.04);
      const qa = Math.min(1, sabs(q, e) / (Math.sqrt(1 + e * e) - e));
      const across = 4 * qa * (1 - qa);
      const env = Math.pow(r, 1.6) * (1 - sstep(0.80, 1.0, r)) / 0.70;
      let sag = b.sag * env * across;
      sag += 0.0022 * across * Math.min(1, env * 1.5) * rn.fbm(x * 2.3 + 11, z * 2.3 - 4, 3);
      h -= sag;
    }
    return h;
  }
  function cornerWrinkles(x, z) {
    let s = 0;
    for (const [cx0, cz0, sx, sz] of corners) {
      const dx = (x - cx0) * sx, dz = (z - cz0) * sz;
      if (dx < 0 || dz < 0) continue;
      const rho = Math.hypot(dx, dz);
      if (rho > 1.0) continue;
      const phi = Math.atan2(dz, dx);
      const taper = Math.pow(Math.max(0, Math.sin(2 * phi)), 0.7);
      const radial = (1 - Math.exp(-rho / 0.05)) * Math.exp(-rho / 0.26);
      s += 0.0034 * radial * taper * Math.sin(phi * 24 + rn.noise(rho * 5 + cx0, phi * 2) * 1.6);
    }
    return s;
  }
  function edgeScallop(x, z) {
    // between velcro attachments the roof edge droops a few mm
    const dl = x - X0, dr = X1 - x, db = z - Z0, df = Z1 - z;
    let s = 0;
    const add = (dist, along, L) => {
      const sp = edgeSpacing(L);
      s += 0.0036 * Math.pow(Math.abs(Math.sin(Math.PI * along / sp)), 0.9) * Math.exp(-Math.max(0, dist) / 0.07);
    };
    add(df, x - X0, X1 - X0); add(db, x - X0, X1 - X0); add(dl, z - Z0, Z1 - Z0); add(dr, z - Z0, Z1 - Z0);
    return s;
  }
  function H(x, z) {
    let h = null;
    for (const b of bays) { const hb = bayHeight(b, x, z); h = h === null ? hb : smax(h, hb, 0.11); }
    return h + cornerWrinkles(x, z) - edgeScallop(x, z);
  }
  function roofNormal(x, z) {
    const e = 0.004;
    const dx = (H(x + e, z) - H(x - e, z)) / (2 * e), dz = (H(x, z + e) - H(x, z - e)) / (2 * e);
    return V3(-dx, 1, -dz).normalize();
  }
  const roofPt = (x, z, off = 0) => { const n = roofNormal(x, z); return V3(x, H(x, z), z).addScaledVector(n, off); };

  // roof canopy mesh
  {
    const W = X1 - X0, D = Z1 - Z0, cell = 0.012;
    const nu = Math.ceil(W / cell), nv = Math.ceil(D / cell);
    bins.add(fabric, grid((u, v, o) => { const x = X0 + W * u, z = Z1 - D * v; o.set(x, H(x, z), z); }, nu, nv, { uv: [W, D] }));
  }

  // ribbon lying on the roof along an XZ path (fn(t) -> [x, z]), width across, raised
  function roofRibbon(fn, len, width, lift, { segAcross = 6, stitchInset = 0.0045, stitch = true, step = 0.02 } = {}) {
    const nu = Math.max(2, Math.ceil(len / step));
    const P = (t) => { const [x, z] = fn(t); return [x, z]; };
    const perpAt = (t) => { const e = 1e-3; const a = P(Math.max(0, t - e)), b = P(Math.min(1, t + e)); const dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    const geo = G.surface((u, v, o) => {
      const [x, z] = P(u); const [px, pz] = perpAt(u);
      const c = (v - 0.5) * width;
      const k = Math.abs(2 * (v - 0.5));
      const off = lift * (1 - Math.pow(k, 6)) + 0.0002;
      o.copy(roofPt(x + px * c, z + pz * c, off));
    }, nu, segAcross, { uvScale: [len, width] });
    // orientation: make the ribbon face up
    const n0 = new THREE.Vector3(); geo.computeVertexNormals(); n0.fromBufferAttribute(geo.attributes.normal, 0);
    if (n0.y < 0) flipGeo(geo);
    bins.add(fabric, geo);
    if (stitch) {
      for (const sgn of [-1, 1]) {
        const smp = [];
        const n = Math.ceil(len / 0.01);
        for (let i = 0; i <= n; i++) {
          const t = i / n; const [x, z] = P(t); const [px, pz] = perpAt(t);
          const c = sgn * (width / 2 - stitchInset);
          const xx = x + px * c, zz = z + pz * c;
          smp.push({ p: roofPt(xx, zz, lift), n: roofNormal(xx, zz) });
        }
        stitches.push(stitchGeo(smp));
      }
    }
  }

  // hip seam tapes (corner -> apex of every bay), valley seams between bays
  const apexR = 0.16;
  for (const b of bays) {
    const bc = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]];
    for (const [x0, z0] of bc) {
      const L = Math.hypot(b.cx - x0, b.cz - z0);
      const tEnd = 1 - (apexR - 0.01) / L;
      roofRibbon((t) => { const tt = t * tEnd; return [x0 + (b.cx - x0) * tt, z0 + (b.cz - z0) * tt]; }, L * tEnd, 0.03, 0.0016);
    }
  }
  // each roof face is sewn from two panels: a narrower felled seam runs down the rafter line
  for (const b of bays) {
    for (const [mx, mz] of [[b.cx, b.z0], [b.cx, b.z1], [b.x0, b.cz], [b.x1, b.cz]]) {
      const L = Math.hypot(b.cx - mx, b.cz - mz);
      const tEnd = 1 - (apexR - 0.01) / L;
      roofRibbon((t) => { const tt = t * tEnd; return [mx + (b.cx - mx) * tt, mz + (b.cz - mz) * tt]; }, L * tEnd, 0.022, 0.0012, { stitchInset: 0.004 });
    }
  }
  for (let i = 1; i < nbx; i++) roofRibbon((t) => [xs[i], Z0 + (Z1 - Z0) * t], Z1 - Z0, 0.034, 0.0016);
  for (let j = 1; j < nbz; j++) roofRibbon((t) => [X0 + (X1 - X0) * t, zs[j]], X1 - X0, 0.034, 0.0016);

  // corner reinforcement patches (rounded triangles) + apex patch + cap
  const patchL = 0.30;
  const patchMat = M.tentPatch(color);
  for (const [cx0, cz0, sx, sz] of corners) {
    const R = (phi) => patchL / (Math.cos(phi) + Math.sin(phi));
    const ptAt = (phi, rr, off) => roofPt(cx0 + sx * Math.cos(phi) * rr, cz0 + sz * Math.sin(phi) * rr, off);
    const geo = G.surface((u, v, o) => {
      const phi = u * Math.PI / 2; const rr = v * R(phi);
      const edge = sstep(R(phi) - 0.0035, R(phi), rr);
      o.copy(ptAt(phi, rr, 0.0014 * (1 - edge) + 0.0002));
    }, 24, 14, { uvScale: [0.45, 0.3] });
    geo.computeVertexNormals(); const n0 = V3().fromBufferAttribute(geo.attributes.normal, 40); if (n0.y < 0) flipGeo(geo);
    bins.add(patchMat, geo);
    const smp = [];
    for (let i = 0; i <= 60; i++) {
      const phi = 0.06 + (i / 60) * (Math.PI / 2 - 0.12); const rr = R(phi) - 0.011;
      const x = cx0 + sx * Math.cos(phi) * rr, z = cz0 + sz * Math.sin(phi) * rr;
      smp.push({ p: roofPt(x, z, 0.0014), n: roofNormal(x, z) });
    }
    stitches.push(stitchGeo(smp));
  }
  for (const b of bays) {
    const ap = (phi, rr, off) => roofPt(b.cx + Math.cos(phi) * rr, b.cz + Math.sin(phi) * rr, off);
    const geo = G.surface((u, v, o) => {
      const rr = v * apexR; const edge = sstep(apexR - 0.004, apexR, rr);
      o.copy(ap(u * TAU, rr, 0.0015 * (1 - edge) + 0.0002));
    }, 48, 10, { uvScale: [1, 0.16] });
    geo.computeVertexNormals(); const n0 = V3().fromBufferAttribute(geo.attributes.normal, 60); if (n0.y < 0) flipGeo(geo);
    bins.add(patchMat, geo);
    for (const rr of [apexR - 0.012, 0.075]) {
      const smp = [];
      for (let i = 0; i <= 96; i++) { const phi = (i / 96) * TAU; const x = b.cx + Math.cos(phi) * rr, z = b.cz + Math.sin(phi) * rr; smp.push({ p: roofPt(x, z, 0.0015), n: roofNormal(x, z) }); }
      stitches.push(stitchGeo(smp));
    }
    // moulded top cap over the pole (fabric covered)
    const top = H(b.cx, b.cz);
    const cap = G.lathe([[0.0001, 0.03], [0.022, 0.027], [0.036, 0.018], [0.046, 0.006], [0.05, 0.0]], 40);
    cap.translate(b.cx, top - 0.012, b.cz);
    bins.add(fabric, cap);
  }

  // ---- valance -------------------------------------------------------------------------
  const drop = Number(p.valanceDrop ?? S.valance);
  const vn = makeNoise2(57);
  const legSOnSide = (side) => side.legs; // positions along the side (m) where legs pin the skirt
  const sides = [
    { name: 'front', A: V3(X0, 0, Z1), dir: V3(1, 0, 0), n: V3(0, 0, 1), L: X1 - X0, legs: xs.map((x) => x - X0) },
    { name: 'right', A: V3(X1, 0, Z1), dir: V3(0, 0, -1), n: V3(1, 0, 0), L: Z1 - Z0, legs: zs.map((z) => Z1 - z) },
    { name: 'back', A: V3(X1, 0, Z0), dir: V3(-1, 0, 0), n: V3(0, 0, -1), L: X1 - X0, legs: xs.map((x) => X1 - x) },
    { name: 'left', A: V3(X0, 0, Z0), dir: V3(0, 0, 1), n: V3(-1, 0, 0), L: Z1 - Z0, legs: zs.map((z) => z - Z0) },
  ];
  const flare = (t) => 0.014 * Math.pow(t, 1.4);
  function valPoint(side, s, y, off = 0) {
    // s: metres along the side (0..L, may run past the corners by the flare), y: absolute height
    const base = side.A.clone().addScaledVector(side.dir, Math.min(side.L, Math.max(0, s)));
    const yTop = H(base.x - side.n.x * 0.0005, base.z - side.n.z * 0.0005) - 0.002;
    const t = clamp01((yTop - y) / drop);
    const f = flare(t);
    let pin = 1;
    for (const ls of legSOnSide(side)) pin = Math.min(pin, sstep(0.0, 0.32, Math.abs(s - ls)));
    pin = Math.min(pin, sstep(0, 0.12, s), sstep(0, 0.12, side.L - s));
    const k = side.name.length * 1.7;
    const wave = pin * (0.25 + 0.75 * Math.pow(t, 1.1)) * (0.0072 * Math.sin(s * TAU / 0.86 + k) + 0.0032 * Math.sin(s * TAU / 0.37 + k * 2.3) + 0.0018 * vn.noise(s * 3.1 + k, 0.5));
    // corner: run past the end so neighbouring panels meet on one square seam line
    const ext = s < 0 ? s : s > side.L ? s - side.L : 0;
    return side.A.clone().addScaledVector(side.dir, Math.min(side.L, Math.max(0, s)) + ext).addScaledVector(side.n, f + wave + off).setY(y);
  }
  const valTopY = (side, s) => { const b = side.A.clone().addScaledVector(side.dir, Math.min(side.L, Math.max(0, s))); return H(b.x - side.n.x * 0.0005, b.z - side.n.z * 0.0005) - 0.002; };
  const hemH = 0.022;
  for (const side of sides) {
    const nu = Math.ceil(side.L / 0.02);
    // panel spans the corner extension: s from -flare to L + flare at each height
    const panel = (u, y, off) => {
      const yTop = valTopY(side, u * side.L);
      const t = clamp01((yTop - y) / drop);
      const f = flare(t);
      const s = -f + (side.L + 2 * f) * u;
      return valPoint(side, s, y, off);
    };
    const geo = G.surface((u, v, o) => {
      const yTop = valTopY(side, u * side.L);
      o.copy(panel(u, yTop - v * (drop - 0.0008), 0));
    }, nu, 14, { uvScale: [side.L, drop] });
    geo.computeVertexNormals();
    { const nn = V3().fromBufferAttribute(geo.attributes.normal, nu * 7); if (nn.dot(side.n) < 0) flipGeo(geo); }
    bins.add(fabric, geo);
    // folded hem (2.2 cm) at the bottom, outside and inside layer
    const yb = (u) => valTopY(side, u * side.L) - drop;
    const hem = G.surface((u, v, o) => {
      const y0 = yb(u);
      const prof = hemProfile(v, y0, hemH, 0.0011);
      o.copy(panel(u, prof[1], prof[0]));
    }, nu, 14, { uvScale: [side.L, hemH * 2] });
    hem.computeVertexNormals();
    bins.add(fabric, hem);
    // stitch lines: hem at 1.8 cm, roof seam 1.2 cm below the top
    for (const [yf, off] of [[(u) => yb(u) + 0.0175, 0.0011], [(u) => valTopY(side, u * side.L) - 0.012, 0]]) {
      const smp = [];
      const n = Math.ceil(side.L / 0.008);
      for (let i = 0; i <= n; i++) { const u = 0.004 + (i / n) * 0.992; smp.push({ p: panel(u, yf(u), off), n: side.n }); }
      stitches.push(stitchGeo(smp));
    }
  }
  // roof / valance junction: piping all round, square sewn corner seams
  {
    const pts = [];
    for (const side of sides) {
      const n = Math.ceil(side.L / 0.02);
      for (let i = 0; i < n; i++) {
        const s = (i / n) * side.L;
        pts.push(side.A.clone().addScaledVector(side.dir, s).addScaledVector(side.n, 0.0035).setY(valTopY(side, s) + 0.0015));
      }
    }
    pts.push(pts[0].clone());
    bins.add(fabric, sweepTube(pts, 0.0042, 8, true));
    for (const side of sides) {
      const pts2 = [];
      for (let i = 0; i <= 16; i++) {
        const yTop = valTopY(side, 0);
        const y = yTop - (i / 16) * (drop - 0.001);
        const t = clamp01((yTop - y) / drop);
        pts2.push(valPoint(side, -flare(t), y, 0).addScaledVector(side.n, 0.0012).addScaledVector(side.dir, -0.0012));
      }
      bins.add(fabric, sweepTube(pts2, 0.0026, 8));
    }
  }

  // optional valance print (decal following the skirt surface)
  if (p.valancePrint) {
    const vp = typeof p.valancePrint === 'string' ? { text: p.valancePrint } : p.valancePrint;
    const ink = M.resolveColor(vp.color, light ? '#1D1E20' : '#FFFFFF');
    const which = vp.sides || ['front', 'back', 'left', 'right'];
    const Hh = drop * 0.6;
    for (const side of sides.filter((s) => which.includes(s.name))) {
      // centred print zone (max ~14:1); canvas aspect = zone aspect so glyphs keep their shape
      const len = Math.min(side.L * 0.9, Hh * 14);
      const cw = 2048, ch = Math.round(cw * Hh / len);
      const tex = TX.printTexture({ text: vp.text, color: ink, width: cw, height: ch, font: `${vp.weight || 800} ${Math.round(ch * 0.66)}px ${vp.font || '"Arial Black", "Helvetica Neue", Arial, sans-serif'}` });
      const mat = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.45, side: THREE.FrontSide, name: 'valance print' });
      const s0 = (side.L - len) / 2;
      const geo = G.surface((u, v, o) => {
        const s = s0 + u * len;
        const yTop = valTopY(side, s);
        const yc = yTop - drop * 0.47;
        o.copy(valPoint(side, s, yc + (v - 0.5) * Hh, 0.0009));
      }, 120, 6);
      geo.computeVertexNormals();
      { const nn = V3().fromBufferAttribute(geo.attributes.normal, 200); if (nn.dot(side.n) < 0) flipGeo(geo); }
      const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.receiveShadow = true;
      group.add(m);
    }
  }

  // ---- legs ----------------------------------------------------------------------------
  const legPts = [];
  for (let i = 0; i <= nbx; i++) for (let j = 0; j <= nbz; j++) {
    if (i === 0 || i === nbx || j === 0 || j === nbz) legPts.push([xs[i], zs[j]]);
  }
  const joinY = 1.02;
  const hasWallAt = (x, z) => (walls.front && Math.abs(z - zs[nbz]) < 1e-6) || (walls.back && Math.abs(z - zs[0]) < 1e-6)
    || (walls.right && Math.abs(x - xs[nbx]) < 1e-6) || (walls.left && Math.abs(x - xs[0]) < 1e-6);
  const legOut = (x, z) => {
    const ox = Math.abs(Math.abs(x) - Math.abs(xs[nbx])) < 1e-6 ? Math.sign(x) : 0;
    const oz = Math.abs(Math.abs(z) - Math.abs(zs[nbz])) < 1e-6 ? Math.sign(z) : 0;
    return V3(ox, 0, oz).normalize();
  };
  const hexP = (af, r = 0.07) => G.roundedPolygonProfile(6, af, af * r, 3, Math.PI / 6);
  for (const [x, z] of legPts) {
    const out = legOut(x, z);
    const side = out.clone(); // a flat of the hex faces outward
    const L = (y) => V3(x, y, z);
    // outer (upper) tube from the collar into the corner bracket, inner (lower) tube
    bins.add(alu, G.prism(hexP(legAF), L(joinY), L(He - 0.03), { side }));
    bins.add(aluInner, G.prism(hexP(S.inner), L(0.05), L(joinY + 0.02), { side }));
    // moulded collar at the bottom end of the outer tube (with a chamfered lip)
    bins.add(nylon, taperPrism(hexP(legAF + 0.006, 0.12), hexP(legAF + 0.012, 0.12), L(joinY - 0.004), L(joinY + 0.012), side));
    bins.add(nylon, G.prism(hexP(legAF + 0.012, 0.12), L(joinY + 0.012), L(joinY + 0.05), { side }));
    bins.add(nylon, taperPrism(hexP(legAF + 0.012, 0.12), hexP(legAF + 0.002, 0.12), L(joinY + 0.05), L(joinY + 0.058), side));
    // spring push-button in the lowest adjustment hole + three empty holes above
    const face = legAF / 2;
    const btnY = joinY + 0.10;
    const bp = L(btnY).addScaledVector(out, face);
    bins.add(dark, G.tube(bp.clone().addScaledVector(out, -0.001), bp.clone().addScaledVector(out, 0.0006), 0.0062, 18));
    const dome = new THREE.SphereGeometry(0.0052, 18, 10, 0, TAU, 0, Math.PI / 2);
    dome.scale(1, 0.75, 1); dome.rotateX(Math.PI / 2); // dome axis +z
    orientAlong(dome, out); dome.translate(bp.x, bp.y, bp.z);
    bins.add(chrome, dome);
    for (let k = 1; k <= 3; k++) {
      const hp = L(btnY + k * 0.085).addScaledVector(out, face);
      bins.add(dark, G.tube(hp.clone().addScaledVector(out, -0.001), hp.clone().addScaledVector(out, 0.0005), 0.0047, 16));
    }
    // foot plate + hex socket + gussets + peg holes
    const pl = S.plate;
    bins.add(galv, G.prism(G.roundedRectProfile(pl, pl, 0.012, 3), L(0), L(0.006), { side: V3(1, 0, 0) }));
    bins.add(galv, G.prism(hexP(S.inner + 0.008, 0.1), L(0.005), L(0.078), { side }));
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const dx = Math.cos(a), dz = Math.sin(a);
      const r0 = (S.inner + 0.008) / 2;
      const g = G.prism(G.roundedRectProfile(0.004, 0.03, 0.001, 1), V3(x + dx * r0, 0.006, z + dz * r0), V3(x + dx * (r0 + 0.028), 0.006, z + dz * (r0 + 0.028)), { side: V3(-dz, 0, dx) });
      g.translate(0, 0.012, 0);
      bins.add(galv, g);
    }
    for (const [hx, hz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const px = x + hx * pl * 0.36, pz = z + hz * pl * 0.36;
      bins.add(dark, G.tube(V3(px, 0.0055, pz), V3(px, 0.0068, pz), 0.0055, 14));
    }
    // tall fixed corner bracket: top under the canopy, lower end visible below the valance
    const bw = legAF + 0.03;
    const bTop = He + 0.006, bBot = He - S.bracketDrop;
    bins.add(bracketMat, G.prism(G.roundedRectProfile(bw, bw, 0.009, 3), L(bBot + 0.02), L(bTop), { side: V3(1, 0, 0) }));
    bins.add(bracketMat, taperPrism(G.roundedRectProfile(bw - 0.012, bw - 0.012, 0.008, 3), G.roundedRectProfile(bw, bw, 0.009, 3), L(bBot), L(bBot + 0.02), V3(1, 0, 0)));
    // through-bolt of the bracket
    const tb = L(He - 0.07).addScaledVector(out, bw / 2);
    bins.add(chrome, G.tube(tb.clone().addScaledVector(out, -0.001), tb.clone().addScaledVector(out, 0.003), 0.0055, 16));
    // slider at the truss bottom with spring pin + pull ring
    const sw = legAF + 0.026;
    bins.add(bracketMat, G.prism(G.roundedRectProfile(sw, sw, 0.008, 3), L(trussBot - 0.045), L(trussBot + 0.045), { side: V3(1, 0, 0) }));
    const ringDir = hasWallAt(x, z) ? out.clone().negate() : out;
    const pinP = L(trussBot - 0.012).addScaledVector(ringDir, sw / 2);
    bins.add(chrome, G.tube(pinP.clone().addScaledVector(ringDir, -0.002), pinP.clone().addScaledVector(ringDir, 0.012), 0.0035, 12));
    const ring = new THREE.TorusGeometry(0.013, 0.0022, 8, 24);
    ring.rotateY(Math.atan2(ringDir.x, ringDir.z));
    const rc = pinP.clone().addScaledVector(ringDir, 0.013).setY(trussBot - 0.012 - 0.012);
    ring.translate(rc.x, rc.y, rc.z);
    bins.add(chrome, ring);
  }

  // ---- scissor trusses --------------------------------------------------------------------
  const spans = [];
  for (let i = 0; i < nbx; i++) { spans.push([[xs[i], zs[0]], [xs[i + 1], zs[0]]]); spans.push([[xs[i], zs[nbz]], [xs[i + 1], zs[nbz]]]); }
  for (let j = 0; j < nbz; j++) { spans.push([[xs[0], zs[j]], [xs[0], zs[j + 1]]]); spans.push([[xs[nbx], zs[j]], [xs[nbx], zs[j + 1]]]); }
  for (let i = 1; i < nbx; i++) for (let j = 0; j < nbz; j++) spans.push([[xs[i], zs[j]], [xs[i], zs[j + 1]]]);
  for (let j = 1; j < nbz; j++) for (let i = 0; i < nbx; i++) spans.push([[xs[i], zs[j]], [xs[i + 1], zs[j]]]);

  const boltHead = (c, dirN) => {
    const g = new THREE.SphereGeometry(0.0068, 16, 8, 0, TAU, 0, Math.PI / 2);
    g.scale(1, 0.55, 1); g.rotateX(Math.PI / 2); orientAlong(g, dirN); g.translate(c.x, c.y, c.z); return g;
  };
  function scissor(a, b, yTop, yBot, endGapA, endGapB, n, lugs = [true, true]) {
    const A = V3(a[0], 0, a[1]), B = V3(b[0], 0, b[1]);
    const dir = B.clone().sub(A); const Ls = dir.length(); dir.normalize();
    const nrm = V3(-dir.z, 0, dir.x);
    const rot = Math.atan2(dir.x, dir.z) + Math.PI / 2;
    [[A, dir, lugs[0]], [B, dir.clone().negate(), lugs[1]]].forEach(([E, dd, on]) => {
      if (!on) return;
      for (const y of [yTop, yBot]) {
        const lug = G.roundedBox(0.046, 0.034, barT * 2 + 0.016, 0.005);
        lug.rotateY(rot);
        const c = E.clone().addScaledVector(dd, legAF / 2 + 0.02).setY(y);
        lug.translate(c.x, c.y, c.z);
        bins.add(bracketMat, lug);
        const bc = E.clone().addScaledVector(dd, legAF / 2 + 0.032).setY(y);
        bins.add(chrome, G.tube(bc.clone().addScaledVector(nrm, -(barT + 0.011)), bc.clone().addScaledVector(nrm, barT + 0.011), 0.0042, 10));
      }
    });
    const s0 = endGapA, s1 = Ls - endGapB;
    const nodes = linspace(s0, s1, n);
    const P = (s, y, off) => A.clone().addScaledVector(dir, s).addScaledVector(nrm, off).setY(y);
    const off = barT * 0.55;
    for (let k = 0; k < n; k++) {
      const sa = nodes[k], sb = nodes[k + 1];
      bins.add(alu, G.flatBar(P(sa, yTop, off), P(sb, yBot, off), barT, barW, nrm.clone()));
      bins.add(alu, G.flatBar(P(sa, yBot, -off), P(sb, yTop, -off), barT, barW, nrm.clone()));
      // pivot bolt at the crossing: shank + domed heads both sides
      const sm = (sa + sb) / 2, ym = (yTop + yBot) / 2;
      bins.add(chrome, G.tube(P(sm, ym, -off * 2.3), P(sm, ym, off * 2.3), 0.0042, 12));
      bins.add(chrome, boltHead(P(sm, ym, off * 2.0), nrm.clone()));
      bins.add(chrome, boltHead(P(sm, ym, -off * 2.0), nrm.clone().negate()));
      if (k > 0) {
        for (const y of [yTop, yBot]) {
          const c = G.roundedBox(0.044, 0.036, barT * 2 + 0.012, 0.006);
          c.rotateY(rot);
          const cp = P(sa, y, 0); c.translate(cp.x, cp.y, cp.z);
          bins.add(nylon, c);
          for (const sg of [-1, 1]) bins.add(chrome, boltHead(P(sa, y, sg * (barT + 0.0065)), nrm.clone().multiplyScalar(sg)));
        }
      }
    }
    return { nodes, A, dir, P };
  }
  const gap = legAF / 2 + 0.024;
  for (const [a, b] of spans) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(2, Math.round(L / 1.0));
    scissor(a, b, trussTop, trussBot + 0.008, gap, gap, n);
  }

  // ---- per bay: diagonal trusses, hub, centre pole, rafters --------------------------------
  for (let i = 0; i < nbx; i++) for (let j = 0; j < nbz; j++) {
    const b = bays[i * nbz + j];
    const { cx, cz } = b;
    const hubTop = trussTop, hubBot = trussBot + 0.01;
    for (const [x, z] of [[xs[i], zs[j]], [xs[i + 1], zs[j]], [xs[i], zs[j + 1]], [xs[i + 1], zs[j + 1]]]) {
      const L = Math.hypot(cx - x, cz - z);
      const n = Math.max(2, Math.round(L / 1.0));
      scissor([x, z], [cx, cz], trussTop, hubBot, gap * 1.2, 0.075, n, [true, false]);
    }
    bins.add(nylon, G.prism(G.circleProfile(0.062, 28), V3(cx, hubTop - 0.03, cz), V3(cx, hubTop + 0.02, cz)));
    bins.add(nylon, G.prism(G.circleProfile(0.057, 28), V3(cx, hubBot - 0.03, cz), V3(cx, hubBot + 0.02, cz)));
    const apexY = H(cx, cz);
    bins.add(alu, G.tube(V3(cx, hubBot - 0.03, cz), V3(cx, He + 0.25, cz), 0.016, 18));
    bins.add(alu, G.tube(V3(cx, He + 0.24, cz), V3(cx, apexY - 0.03, cz), 0.0125, 18));
    bins.add(nylon, G.prism(G.circleProfile(0.03, 24), V3(cx, apexY - 0.05, cz), V3(cx, apexY - 0.018, cz)));
    // rafters from the pole top to the four mid-side connectors, just under the cloth
    const mids = [[cx, zs[j]], [cx, zs[j + 1]], [xs[i], cz], [xs[i + 1], cz]];
    for (const [mx, mz] of mids) {
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const x = mx + (cx - mx) * t, z = mz + (cz - mz) * t;
        pts.push(V3(x, Math.min(H(x, z) - S.rafter / 2 - 0.004, t < 0.02 ? trussTop + 0.02 : 99), z));
      }
      pts[0].y = trussTop + 0.02;
      bins.add(alu, sweepTube(pts, S.rafter / 2, 12));
    }
  }

  // ---- side walls -------------------------------------------------------------------------
  const wallColor = p.wallColor || color;
  const wallFabric = M.tentFabric(wallColor);
  const wallThread = M.tentThread(wallColor);
  const wallOff = (legAF + 0.03) / 2 + 0.008; // clear of the corner brackets and sliders
  const sideDefs = {
    front: { pts: xs.map((x) => [x, zs[nbz]]), n: V3(0, 0, 1) },
    back: { pts: xs.map((x) => [x, zs[0]]).reverse(), n: V3(0, 0, -1) },
    right: { pts: zs.map((z) => [xs[nbx], z]).reverse(), n: V3(1, 0, 0) },
    left: { pts: zs.map((z) => [xs[0], z]), n: V3(-1, 0, 0) },
  };
  const tabbedLegs = new Set();
  for (const [sideName, typeSpec] of Object.entries(walls)) {
    const def = sideDefs[sideName]; if (!def || !typeSpec || typeSpec === 'none' || typeSpec === 'open') continue;
    const types = Array.isArray(typeSpec) ? typeSpec : [typeSpec];
    for (let k = 0; k < def.pts.length - 1; k++) {
      const type = types[k % types.length];
      if (!type || type === 'none' || type === 'open') continue;
      const a = V3(def.pts[k][0], 0, def.pts[k][1]).addScaledVector(def.n, wallOff);
      const b = V3(def.pts[k + 1][0], 0, def.pts[k + 1][1]).addScaledVector(def.n, wallOff);
      const along = b.clone().sub(a).normalize();
      if (k === 0) a.addScaledVector(along, -wallOff);
      if (k === def.pts.length - 2) b.addScaledVector(along, wallOff);
      tabbedLegs.add(def.pts[k].join(',')); tabbedLegs.add(def.pts[k + 1].join(','));
      buildWall({ group, bins, fabric: wallFabric, thread: wallThread, a, b, n: def.n, top: He - 0.012, bottom: 0.045, type, seed: k * 3 + sideName.length, light: lumOf(M.resolveColor(wallColor)) > 0.45 });
    }
  }
  // velcro tabs: webbing loops around the legs that carry a wall
  for (const key of tabbedLegs) {
    const [x, z] = key.split(',').map(Number);
    for (const y of [0.42, 1.12, 1.62]) {
      const r = (y < joinY ? S.inner : legAF) / 2 + 0.003;
      const ring = G.prism(G.circleProfile(r, 20), V3(x, y - 0.019, z), V3(x, y + 0.019, z), { caps: false });
      bins.add(wallFabric, ring);
    }
  }

  // ---- weights ---------------------------------------------------------------------------
  const wcount = typeof p.weights === 'object' && p.weights ? (p.weights.count ?? 1) : Number(p.weights || 0);
  if (wcount > 0) {
    const iron = M.castIron('#2A2B2D');
    const plateH = 0.034;
    for (const [x, z] of legPts) {
      const out = legOut(x, z);
      for (let k = 0; k < wcount; k++) {
        const g = weightPlate({ R: 0.125, h: plateH, slotHalf: S.inner / 2 + 0.008, bore: (S.inner + 0.008) / Math.sqrt(3) + 0.006 });
        g.rotateY(Math.atan2(-out.z, out.x)); // slot opens towards the outside of the tent
        g.translate(x, 0.0065 + k * (plateH + 0.0025), z);
        bins.add(iron, g);
      }
    }
  }

  bins.build(group);
  // stitches as one mesh (no shadow casting: sub-mm)
  const sg = stitches.filter(Boolean);
  if (sg.length) { const m = new THREE.Mesh(G.merge(sg), thread); m.castShadow = false; m.receiveShadow = true; group.add(m); }

  // ---- framing hints -----------------------------------------------------------------------
  const fx = xs[nbx], fz = zs[nbz];
  const peak = Math.max(...bays.map((b) => H(b.cx, b.cz)));
  return {
    object: group,
    // standard 2nd catalogue image: front-right corner from just below eave height,
    // shallow depth of field so the far side of the frame melts into the backdrop
    // (with a right-hand wall the corner moves right so the wall does not fill half the frame)
    detail: { target: [fx - 0.14, He - 0.38, fz + 0.02], size: 0.92, azimuth: 36, elevation: -4, aperture: 0.0085, shift: [walls.right && walls.right !== 'none' && walls.right !== 'open' ? 0.3 : 0.05, 0] },
    view: { detail: { samples: 60 } },
    rig: {
      default: {
        // modelling key from the front-left at mid height: the two visible roof faces
        // separate clearly; the floor shadow is baked from an overhead softbox so it stays
        // inside the footprint and never runs off the frame
        key: { azimuth: -62, elevation: 40, intensity: 3.3, cone: 12 },
        floorKey: { azimuth: -15, elevation: 80, cone: 16, intensity: 3.0 },
        // rim from behind-left: lights edges/legs but not the shaded roof face
        rim: { azimuth: -155, elevation: 35, intensity: 0.6 },
        fill: { azimuth: 70, elevation: 8, intensity: 0.06 },
        // sky cap tipped towards the key = negative fill on the right: white roof keeps form
        dome: { count: 2, intensity: 1.3, maxZenith: 62, tilt: 30 },
        exposure: lumOf(colorHex) > 0.7 ? 0.78 : lumOf(colorHex) < 0.06 ? 0.74 : 'auto',
        // dark cloth reads through reflections: turn the room so the lit roof face mirrors
        // the bright side, and give the shaded walls a low raking fill so folds show
        ...(lumOf(colorHex) < 0.06 ? { envRotation: 300, fill: { azimuth: 85, elevation: 2, intensity: 0.6 }, dome: { count: 2, intensity: 1.3, maxZenith: 62, tilt: 20 } } : {}),
        shadowFloor: 0.70,
        groundAO: { strength: 0.55, maxZenith: 70 },
        contact: { res: 2048, h0: 0.006, strength: 0.85, blur: 0.9 },
      },
      // close-up: the floor is in the canopy shadow everywhere, so no edge fade
      detail: { edgeFade: 0 },
    },
    meta: { w, d, kind, legs: legPts.length, eave: He, peak, valance: drop, trussDrop: S.trussDrop },
  };
}

// hem fold cross-section (offset, y) for v in [0,1]: outside layer down, round the edge, inside layer up
function hemProfile(v, y0, h, t) {
  const segs = [[t, y0 + h], [t, y0 + t * 1.3]];
  for (let i = 1; i < 6; i++) { const a = (i / 6) * Math.PI; segs.push([Math.cos(a) * t, y0 + t - Math.sin(a) * t * 1.05]); }
  segs.push([-t, y0 + t * 1.3], [-t, y0 + h]);
  const f = v * (segs.length - 1), i = Math.min(segs.length - 2, Math.floor(f)), w = f - i;
  return [segs[i][0] + (segs[i + 1][0] - segs[i][0]) * w, segs[i][1] + (segs[i + 1][1] - segs[i][1]) * w];
}

function flipGeo(geo) {
  const idx = geo.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  geo.index.needsUpdate = true;
  geo.computeVertexNormals();
}

// rotate geometry so its +Z axis points along dir
function orientAlong(geo, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dir.clone().normalize());
  geo.applyQuaternion(q);
}

// prism whose profile changes from pa (at a) to pb (at b); profiles need equal point counts
function taperPrism(pa, pb, a, b, side) {
  const g = G.prism(pa, a, b, { side });
  const g2 = G.prism(pb, a, b, { side });
  // second ring of g takes the positions of g2's second ring (same topology)
  const n = pa.length + 1;
  const P = g.attributes.position, P2 = g2.attributes.position;
  for (let i = 0; i < n; i++) P.setXYZ(n + i, P2.getX(n + i), P2.getY(n + i), P2.getZ(n + i));
  // cap at b
  const capStart = 2 * n + pa.length;
  for (let i = 0; i < pa.length; i++) P.setXYZ(capStart + i, P2.getX(capStart + i), P2.getY(capStart + i), P2.getZ(capStart + i));
  g.computeVertexNormals();
  return g;
}

// Stackable weight plate: round, radial slot to slide around the leg, central bore that
// clears the foot socket, grip hole on the opposite side. Local +X = slot direction.
export function weightPlate({ R = 0.125, h = 0.034, slotHalf = 0.026, bore = 0.033, bevel = 0.003 } = {}) {
  const sh = new THREE.Shape();
  const aR = Math.asin(slotHalf / R), aB = Math.asin(Math.min(0.99, slotHalf / bore));
  sh.moveTo(Math.cos(aR) * R, Math.sin(aR) * R);
  sh.absarc(0, 0, R, aR, TAU - aR, false);
  sh.lineTo(Math.cos(aB) * bore, -slotHalf);
  sh.absarc(0, 0, bore, -aB, aB, true);
  sh.lineTo(Math.cos(aR) * R, slotHalf);
  const grip = new THREE.Path();
  const gx = -(R - 0.04), gw = 0.05, gr = 0.014;
  grip.moveTo(gx + gr, -gw);
  grip.absarc(gx, -gw, gr, 0, -Math.PI, true);
  grip.lineTo(gx - gr, gw);
  grip.absarc(gx, gw, gr, Math.PI, 0, true);
  grip.lineTo(gx + gr, -gw);
  sh.holes.push(grip);
  const g = new THREE.ExtrudeGeometry(sh, { depth: h - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 56 });
  g.translate(0, 0, bevel);
  g.rotateX(-Math.PI / 2); // extrusion axis -> +Y, shape y -> -Z
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 4);
  return g;
}

// ---- side wall panel -----------------------------------------------------------------------
// Layouts are centred per panel (between two legs):
//   closed | window (1 rectangular PVC window) | windows / church (2 arched windows with
//   cross bars) | door (centred vertical zip, roll-up straps) | door-open (rolled up) |
//   panorama (wide window) | rolled (whole wall rolled up under the valance)
function buildWall({ group, bins, fabric, thread, a, b, n, top, bottom, type, seed, light }) {
  const along = b.clone().sub(a); const L = along.length(); along.normalize();
  const Hh = top - bottom;
  const stitches = [];
  const nz = makeNoise2(100 + seed);
  if (type === 'window2' || type === 'church' || type === 'churchwindows') type = 'windows';
  if (type === 'rolled') { buildRolledWall({ bins, fabric, a, along, n, L, top }); return; }

  const disp = (s, y) => {
    const u = s / L, v = clamp01((y - bottom) / Hh);
    const pinS = Math.pow(Math.max(0, Math.sin(Math.PI * clamp01(u))), 0.5);
    const belly = 0.011 * Math.sin(Math.PI * clamp01(u)) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, v * 0.95 + 0.04))), 0.7);
    const folds = 0.0065 * pinS * (0.3 + 0.7 * Math.pow(1 - v, 1.3))
      * (Math.sin(s * TAU / 0.66 + seed) * 0.5 + Math.sin(s * TAU / 0.31 + seed * 2.1) * 0.3 + Math.sin(s * TAU / 0.17 + seed * 0.7) * 0.12 + 0.2 * nz.noise(s * 2.2, v));
    const tabSp = L / Math.max(1, Math.round(L / 0.3));
    const scallop = 0.0045 * Math.abs(Math.sin(Math.PI * s / tabSp)) * sstep(0.84, 1.0, v);
    let diag = 0;
    for (const [s0, sg] of [[0, 1], [L, -1]]) {
      const ds = (s - s0) * sg, dy = top - y;
      if (ds < 0) continue;
      const rho = Math.hypot(ds, dy);
      diag += 0.0028 * Math.sin(((ds - dy) / 0.06) * Math.PI) * Math.exp(-rho / 0.32) * (1 - Math.exp(-rho / 0.05));
    }
    return belly + folds + scallop + diag;
  };
  const point = (s, y, off = 0) => a.clone().addScaledVector(along, s).addScaledVector(n, disp(s, y) + off).setY(y);
  const flip = n.dot(V3().crossVectors(along, V3(0, 1, 0))) < 0;

  // layout (in wall coordinates s, y)
  const openings = []; // {kind:'rect'|'arch', s0, s1, y0, y1, r}
  const mid = L / 2;
  if (type === 'window') {
    const ww = Math.min(1.5, L - 1.1), y0 = 0.86, y1 = 1.56;
    openings.push({ kind: 'rect', s0: mid - ww / 2, s1: mid + ww / 2, y0, y1, r: 0.05 });
  } else if (type === 'windows') {
    const ww = 0.6, y0 = 0.80, y1 = 1.66, off = Math.min(0.66, L * 0.22);
    for (const c of [mid - off, mid + off]) openings.push({ kind: 'arch', s0: c - ww / 2, s1: c + ww / 2, y0, y1, r: ww / 2, bars: true });
  } else if (type === 'panorama') {
    openings.push({ kind: 'rect', s0: 0.35, s1: L - 0.35, y0: 0.82, y1: 1.62, r: 0.05 });
  }
  const doorOpen = type === 'door-open';
  const doorW = Math.min(1.4, L * 0.48), doorTop = 1.96;

  // mask: white = fabric
  let mat = fabric, mask = null;
  const needsMask = openings.length > 0 || doorOpen;
  const key = `${type}:${L.toFixed(3)}:${Hh.toFixed(3)}`;
  if (needsMask) {
    const Wp = 2048, Hp = Math.round(2048 * Hh / L);
    mask = TX.maskTexture(`wall2:${key}`, Wp, Hp, (g) => {
      const px = Wp / L, Y = (y) => (top - y) * px;
      g.fillStyle = '#fff'; g.fillRect(0, 0, Wp, Hp);
      g.fillStyle = '#000';
      for (const o of openings) { g.beginPath(); outlinePath(o).forEach(([s, y], i) => (i ? g.lineTo(s * px, Y(y)) : g.moveTo(s * px, Y(y)))); g.closePath(); g.fill(); }
      if (doorOpen) g.fillRect((mid - doorW / 2) * px, Y(doorTop), doorW * px, Hp);
      g.fillStyle = '#fff';
      for (const o of openings) if (o.bars) {
        const bw = 0.03 * px, cx = (o.s0 + o.s1) / 2;
        g.fillRect(cx * px - bw / 2, Y(o.y1), bw, (o.y1 - o.y0) * px);
        g.fillRect(o.s0 * px, Y(o.y0 + (o.y1 - o.y0) * 0.42) - bw / 2, (o.s1 - o.s0) * px, bw);
      }
    });
    mask.repeat.set(1 / L, 1 / Hh); mask.needsUpdate = true;
    mat = cloneWithMask(fabric, mask, key, false);
  }
  const nu = Math.ceil(L / 0.02), nv = Math.ceil(Hh / 0.03);
  const geo = G.surface((u, v, o) => o.copy(point(u * L, bottom + v * Hh, 0)), nu, nv, { flipNormals: flip, uvScale: [L, Hh] });
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  if (needsMask) group.add(m); else bins.add(fabric, geo);

  // bottom hem (5 cm, folded) with stitching; vertical edge bands
  const hem = G.surface((u, v, o) => { const pr = hemProfile(v, bottom, 0.05, 0.0012); o.copy(point(u * L, pr[1], pr[0])); }, nu, 14, { uvScale: [L, 0.1] });
  hem.computeVertexNormals(); bins.add(fabric, hem);
  const sline = (pts) => stitches.push(stitchGeo(pts.map(([s, y, off]) => ({ p: point(s, y, off), n }))));
  const hline = (y, off, s0 = 0.01, s1 = L - 0.01) => { const pts = []; const k = Math.ceil((s1 - s0) / 0.008); for (let i = 0; i <= k; i++) pts.push([s0 + (s1 - s0) * i / k, y, off]); sline(pts); };
  const vline = (s, y0, y1, off) => { const pts = []; const k = Math.ceil((y1 - y0) / 0.008); for (let i = 0; i <= k; i++) pts.push([s, y0 + (y1 - y0) * i / k, off]); sline(pts); };
  hline(bottom + 0.04, 0.0012);
  for (const [s0, s1] of [[0, 0.045], [L - 0.045, L]]) {
    const band = G.surface((u, v, o) => { const s = s0 + (s1 - s0) * u; const k = Math.abs(2 * u - 1); o.copy(point(s, bottom + 0.05 + v * (Hh - 0.06), 0.0011 * (1 - Math.pow(k, 8)))); }, 4, nv, { flipNormals: flip, uvScale: [0.045, Hh] });
    bins.add(fabric, band);
    vline((s0 + s1) / 2 + (s0 === 0 ? 0.012 : -0.012), bottom + 0.055, top - 0.02, 0.0011);
  }
  // top velcro band (visible from inside / below the valance edge)
  hline(top - 0.03, 0);

  // window frames: stitched fabric band round each opening, PVC behind
  for (const o of openings) {
    // band from 6 mm inside the hole edge (covers the PVC seam) to 32 mm onto the cloth
    const outline = outlinePath(o, 0);
    bins.add(fabric, ribbonOnWall(point, outline, 0.038, 0.0013, 0.013, flip));
    for (const dd of [0.0015, 0.025]) sline(offsetOutline(outline, dd).map(([s, y]) => [s, y, 0.0013]));
  }
  if (openings.length) {
    const pvc = cloneWithMask(M.pvcWindow(), mask, key, true);
    const g2 = G.surface((u, v, o) => o.copy(point(u * L, bottom + v * Hh, -0.0025)), nu, nv, { flipNormals: flip, uvScale: [L, Hh] });
    const pm = new THREE.Mesh(g2, pvc); pm.castShadow = false; pm.receiveShadow = true;
    group.add(pm);
  }

  // doors
  const zipMat = M.rubber('#121212');
  const strapMat = M.webbing('#141516');
  const zip = (s, y0, y1, off = 0.0016) => {
    // coil zipper tape with a raised coil down the middle
    bins.add(zipMat, G.surface((u, v, o) => o.copy(point(s + (v - 0.5) * 0.024, y0 + (y1 - y0) * u, off)), Math.ceil((y1 - y0) / 0.03), 2, { flipNormals: !flip }));
    const pts = []; const k = Math.ceil((y1 - y0) / 0.03); for (let i = 0; i <= k; i++) pts.push(point(s, y0 + (y1 - y0) * i / k, off + 0.002));
    bins.add(zipMat, sweepTube(pts, 0.0028, 8));
    vline(s - 0.016, y0 + 0.01, y1, 0.001); vline(s + 0.016, y0 + 0.01, y1, 0.001);
  };
  const strap = (s, y0, y1, buckleY) => {
    bins.add(strapMat, G.surface((u, v, o) => o.copy(point(s + (v - 0.5) * 0.025, y1 + (y0 - y1) * u, 0.0045 + 0.002 * Math.sin(Math.PI * u))), 12, 2, { flipNormals: flip }));
    const bk = G.roundedBox(0.034, 0.05, 0.009, 0.003);
    const c = point(s, buckleY, 0.009);
    bk.applyMatrix4(new THREE.Matrix4().makeBasis(along, V3(0, 1, 0), n).setPosition(c));
    bins.add(M.nylon('#111111'), bk);
    // box stitch where the strap is sewn on
    const bx = [[s - 0.011, y1 - 0.005], [s + 0.011, y1 - 0.005], [s + 0.011, y1 - 0.035], [s - 0.011, y1 - 0.035], [s - 0.011, y1 - 0.005]];
    const pts = []; for (let i = 0; i < bx.length - 1; i++) for (let k = 0; k < 6; k++) { const t = k / 6; pts.push([bx[i][0] + (bx[i + 1][0] - bx[i][0]) * t, bx[i][1] + (bx[i + 1][1] - bx[i][1]) * t, 0.0065]); }
    sline(pts);
  };
  if (type === 'door') {
    zip(mid, bottom + 0.005, doorTop);
    // slider + pull tab
    const sl = G.roundedBox(0.022, 0.042, 0.011, 0.003);
    sl.applyMatrix4(new THREE.Matrix4().makeBasis(along, V3(0, 1, 0), n).setPosition(point(mid, 1.06, 0.009)));
    bins.add(M.chrome(), sl);
    const pt = G.roundedBox(0.013, 0.055, 0.003, 0.0015);
    pt.applyMatrix4(new THREE.Matrix4().makeBasis(along, V3(0, 1, 0), n).setPosition(point(mid, 1.015, 0.015)));
    bins.add(M.chrome(), pt);
    // reinforcement triangle at the top of the zip
    const tri = G.surface((u, v, o) => { const yy = doorTop + 0.002 + v * 0.07; const half = (1 - v) * 0.06; o.copy(point(mid + (u - 0.5) * 2 * half, yy, 0.0013)); }, 8, 6, { flipNormals: flip });
    bins.add(fabric, tri);
    // two roll-up straps (one per door half), hanging from just below the valance
    for (const sg of [-1, 1]) strap(mid + sg * doorW * 0.32, top - 0.62, top - 0.17, top - 0.42);
  } else if (doorOpen) {
    for (const sg of [-1, 1]) zip(mid + sg * (doorW / 2 + 0.012), bottom + 0.005, doorTop);
    // rolled door above the opening with two straps around it
    const r0 = point(mid - doorW / 2 - 0.03, doorTop + 0.06, 0.055), r1 = point(mid + doorW / 2 + 0.03, doorTop + 0.06, 0.055);
    const roll = G.tube(r0, r1, 0.05, 28);
    bins.add(fabric, roll);
    for (const t of [0.22, 0.78]) {
      const tp = r0.clone().lerp(r1, t);
      const loop = G.surface((u, v, o) => {
        const ang = -Math.PI * 0.5 + u * Math.PI * 1.7;
        o.copy(tp).addScaledVector(n, Math.cos(ang) * 0.054).setY(tp.y + Math.sin(ang) * 0.054).addScaledVector(along, (v - 0.5) * 0.025);
      }, 20, 2);
      bins.add(strapMat, loop);
      bins.add(strapMat, G.flatBar(tp.clone().addScaledVector(n, -0.054).setY(tp.y + 0.004), tp.clone().addScaledVector(n, -0.052).setY(top - 0.17), 0.002, 0.025, n.clone()));
    }
  }
  const sg = stitches.filter(Boolean);
  if (sg.length) { const sm = new THREE.Mesh(G.merge(sg), thread); sm.castShadow = false; sm.receiveShadow = true; group.add(sm); }
}

function buildRolledWall({ bins, fabric, a, along, n, L, top }) {
  const y = top - 0.27;
  const r0 = a.clone().addScaledVector(along, 0.06).addScaledVector(n, 0.04).setY(y), r1 = a.clone().addScaledVector(along, L - 0.06).addScaledVector(n, 0.04).setY(y);
  bins.add(fabric, G.tube(r0, r1, 0.055, 28));
  const strapMat = M.webbing('#141516');
  for (const t of [0.15, 0.5, 0.85]) {
    const tp = r0.clone().lerp(r1, t);
    bins.add(strapMat, G.surface((u, v, o) => {
      const ang = -Math.PI * 0.5 + u * Math.PI * 1.7;
      o.copy(tp).addScaledVector(n, Math.cos(ang) * 0.059).setY(tp.y + Math.sin(ang) * 0.059).addScaledVector(along, (v - 0.5) * 0.025);
    }, 20, 2));
  }
}

// closed outline of an opening in wall coordinates [[s, y], ...] (counter-clockwise), grown by `grow`
function outlinePath(o, grow = 0) {
  const pts = [];
  const s0 = o.s0 - grow, s1 = o.s1 + grow, y0 = o.y0 - grow, y1 = o.y1 + grow;
  if (o.kind === 'arch') {
    const r = (s1 - s0) / 2, cx = (s0 + s1) / 2, cy = y1 - r;
    pts.push([s0, y0], [s1, y0]);
    for (let i = 0; i <= 10; i++) pts.push([s1, y0 + (cy - y0) * (i / 10)]);
    for (let i = 1; i <= 32; i++) { const a = (i / 32) * Math.PI; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    for (let i = 1; i <= 10; i++) pts.push([s0, cy - (cy - y0) * (i / 10)]);
  } else {
    const r = (o.r || 0) + grow;
    const cs = [[s1 - r, y0 + r, -Math.PI / 2], [s1 - r, y1 - r, 0], [s0 + r, y1 - r, Math.PI / 2], [s0 + r, y0 + r, Math.PI]];
    for (const [cx, cy, a0] of cs) for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  }
  // resample densely
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const k = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.008));
    for (let j = 0; j < k; j++) out.push([p[0] + (q[0] - p[0]) * j / k, p[1] + (q[1] - p[1]) * j / k]);
  }
  out.push(out[0].slice());
  return out;
}

// offset a closed CCW outline outward by d (negative = inward)
function offsetOutline(pts, d) {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n - 1) % (n - 1)], b = pts[(i + 1) % (n - 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1;
    return [p[0] + (ty / l) * d, p[1] - (tx / l) * d];
  });
}

// band of width `width` centred on outline offset `centre` (outward), lying on the wall
function ribbonOnWall(point, outline, width, lift, centre, flip) {
  const m = outline.length - 1;
  const lines = [offsetOutline(outline, centre - width / 2), offsetOutline(outline, centre), offsetOutline(outline, centre + width / 2)];
  const geo = G.surface((u, v, o) => {
    const i = Math.min(m, Math.round(u * m));
    const f = v * 2, j = Math.min(1, Math.floor(f)), t = f - j;
    const A = lines[j][i], B = lines[j + 1][i];
    const k = Math.abs(2 * v - 1);
    o.copy(point(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, lift * (1 - Math.pow(k, 6)) + 0.0002));
  }, m, 2, { flipNormals: !flip, uvScale: [m * 0.008, width] });
  return geo;
}

const maskMatCache = new Map();
function cloneWithMask(base, mask, key, invert) {
  const k = base.uuid + key + invert;
  if (maskMatCache.has(k)) return maskMatCache.get(k);
  let tex = mask;
  if (invert) {
    // inverted mask on a *new* canvas texture (Texture.clone() would share the image source)
    const src = mask.image; const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = mask.anisotropy; tex.repeat.copy(mask.repeat);
    tex.wrapS = mask.wrapS; tex.wrapT = mask.wrapT;
  }
  const m = base.clone(); m.alphaMap = tex; m.alphaTest = 0.5; m.transparent = false; m.userData = { ...base.userData }; delete m.userData.__hooked;
  maskMatCache.set(k, m); return m;
}
