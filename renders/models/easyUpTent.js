// Easy-up / pop-up partytent (vouwtent).
//
// Construction modelled after professional folding gazebos:
//  - telescopic hexagonal legs (Premium 40 -> 34 mm black powder-coated steel, Professional 50 -> 44 mm aluminium):
//    the wide outer tube hangs from the corner bracket, the narrower inner tube slides out
//    at the bottom; moulded collar, spring push-button in one of the adjustment holes;
//    square galvanised foot plates with peg holes and gussets;
//  - tall fixed corner bracket and a slider at the truss bottom: crisp injection-moulded
//    nylon on Premium (small edge radius, chamfered ends, stiffening ribs, embossed mark on
//    the slider), bigger cast aluminium with hex bolts on Professional;
//  - scissor trusses: flat rectangular profiles in an X-lattice (2-4 X's per span) with
//    domed pivot bolts, nylon node connectors, inner diagonal scissors to a centre hub;
//  - telescopic centre pole + four rafters per bay running to the mid-side connectors;
//  - ONE canopy piece (also over several bays): pyramid per bay, each face two half-panels
//    that dish ~9 cm (3 m bay, scales) between the rafter ridge and the taut hip seam, hips
//    sagging ~4 cm so the silhouettes bow inward, rafters bowing ~2 cm; soft tension ridges
//    fanning from every corner pocket and from the peak cap; taped + double-stitched hip
//    seams, reinforcement patches at the corners and apex; at the eave the roof cloth turns
//    down in one clean rounded fold and continues as the valance; soft valley over inner
//    trusses that sharpens towards the eave;
//  - valance as one continuous sewn skirt round a rounded rectangle (radius grows towards
//    the hem), slight outward flare, a belly between the legs, drape waves, a 3-6 mm festoon
//    in the hem between the attachment points, folded hem stitched 2 cm up;
//  - optional side walls hung from the roof edge (closed / PVC window / 2 church windows /
//    zip door with moulded-tooth zip, slider + puller, storm flap, webbing roll-up straps
//    with side-release buckles / opened door / panorama / rolled up), hem resting and
//    kinking on the ground, corner slots with velcro straps looped round the legs, drape
//    folds from the top tabs, a belly, tension wrinkles, and a contact proxy for the floor
//    halo along the hem;
//  - optional rubber-coated stackable weight plates on top of the foot plates.
// Units: metres. X = width (front side), Z = depth, front faces +Z.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as TX from '../js/textures.js';
import { makeNoise2, rng } from '../js/rng.js';
import { resolvePrint } from '../js/brandPrints.js';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';
import { STUDIO_ENV_DEFAULT } from '../js/studioEnv.js';

const { V3 } = G;

const SPEC = {
  premium: {
    // truss depth: the X crossings (pivot bolt) sit ~9 cm below the valance hem, so every
    // side reads as a scissor X-lattice, not as a zigzag of single bars
    leg: 0.040, inner: 0.034, eave: 2.10, trussDrop: 0.58, bar: [0.028, 0.013], valance: 0.21,
    bracket: 'nylon', bracketDrop: 0.235, plate: 0.13, rafter: 0.016,
  },
  professional: {
    leg: 0.050, inner: 0.044, eave: 2.14, trussDrop: 0.60, bar: [0.034, 0.016], valance: 0.22,
    bracket: 'alu', bracketDrop: 0.25, plate: 0.15, rafter: 0.019,
  },
};

const TAU = Math.PI * 2;
// material for contact proxies (never drawn: layer 3 is only seen by the floor contact pass)
const PROXY_MAT = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
// invisible in the beauty pass (writes neither colour nor depth) but seen by the floor's tight
// contact pass (layer 0, height override): a ground-hugging stand-in that shapes a contact shadow
const CONTACT_PROXY_MAT = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

// galvanised foot plate (pl x pl, 6 mm): 1 mm bevel all round, four 11 mm peg holes, uv in metres
const plateGeoCache = new Map();
function footPlateGeo(pl) {
  if (plateGeoCache.has(pl)) return plateGeoCache.get(pl);
  const bv = 0.001, h = pl / 2 - bv, r = 0.012 - bv;
  const sh = new THREE.Shape();
  sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.absarc(h - r, -h + r, r, -Math.PI / 2, 0, false);
  sh.lineTo(h, h - r); sh.absarc(h - r, h - r, r, 0, Math.PI / 2, false);
  sh.lineTo(-h + r, h); sh.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI, false);
  sh.lineTo(-h, -h + r); sh.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  for (const [hx, hz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const hp = new THREE.Path(); hp.absarc(hx * pl * 0.36, hz * pl * 0.36, 0.0055 + bv, 0, TAU, true); sh.holes.push(hp);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.006 - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, bv);
  g.rotateX(-Math.PI / 2);
  plateGeoCache.set(pl, g);
  return g;
}
// 3 mm triangular gusset welded between plate and socket: local x = radial (0 at the socket
// face), y = up, z = thickness (centred); slightly rounded, bevelled edges
function gussetGeo() {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0); sh.lineTo(0.03, 0); sh.lineTo(0.03, 0.0035); sh.lineTo(0.0035, 0.044); sh.lineTo(0, 0.044); sh.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 1, curveSegments: 2 });
  g.translate(0, 0, -0.001);
  return g;
}
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

// Lockstitch topstitching along a dense polyline with per-sample surface normals. Each
// stitch is a tiny raised pillow of thread lying on the cloth, sunk into the cloth at both
// ends (the needle holes). Machine-sewn, but not vector-perfect: stitch length varies a few
// percent, the line wanders ~0.15 mm sideways, and every stitch carries a vertex colour that
// darkens towards its needle holes, so a tone-on-tone seam still reads as a fine dotted line.
let stitchSeed = 1;
let stitchAO = 1; // depth of the needle-hole shading (thread material's userData.threadAO)
function stitchGeo(samples, { dash = 0.0034, gap = 0.0011, width = 0.0010, lift = 0.0005, base = 0.00025, jitter = 0.08, wobble = 0.00015 } = {}) {
  if (samples.length < 2) return null;
  const acc = [0];
  for (let i = 1; i < samples.length; i++) acc.push(acc[i - 1] + samples[i].p.distanceTo(samples[i - 1].p));
  const total = acc[acc.length - 1];
  let seg = 1;
  const at = (s) => {
    if (seg > 1 && acc[seg - 1] > s) seg = 1;
    while (seg < acc.length - 1 && acc[seg] < s) seg++;
    const i = seg;
    const t = (s - acc[i - 1]) / Math.max(1e-9, acc[i] - acc[i - 1]);
    return { p: samples[i - 1].p.clone().lerp(samples[i].p, t), n: samples[i - 1].n.clone().lerp(samples[i].n, t).normalize() };
  };
  const R = rng(9173 + (stitchSeed++) * 31);
  const pos = [], idx = [], uv = [], col = [];
  const pitch = dash + gap;
  const count = Math.floor((total - 0.002) / pitch);
  if (count < 1) return null;
  const off = (total - count * pitch + gap) / 2;
  let drift = 0;
  for (let k = 0; k < count; k++) {
    const len = dash * (1 + (R() - 0.5) * 2 * jitter);
    const s0 = off + k * pitch + (R() - 0.5) * gap * 0.35, s1 = Math.min(total, s0 + len);
    const A = at(s0), Bp = at(s1);
    const t = Bp.p.clone().sub(A.p).normalize();
    const nrm = A.n.clone().add(Bp.n).normalize();
    const bi = V3().crossVectors(nrm, t).normalize();
    drift = drift * 0.7 + (R() - 0.5) * wobble;
    const b0 = pos.length / 3;
    const shade = 0.9 + 0.1 * R();
    for (let ia = 0; ia < 5; ia++) {
      const fa = ia / 4;
      const c = A.p.clone().lerp(Bp.p, fa).addScaledVector(bi, drift);
      // thread profile along the stitch: dives into the needle holes at both ends
      const along = Math.sin(Math.PI * fa);
      for (let ic = 0; ic < 3; ic++) {
        const fc = ic - 1;
        const h = -base * 0.6 + (base * 1.6 + lift) * Math.pow(along, 0.55) * (1 - 0.75 * fc * fc);
        const q = c.clone().addScaledVector(bi, fc * width / 2 * (0.55 + 0.45 * along)).addScaledVector(nrm, h);
        pos.push(q.x, q.y, q.z); uv.push(fa, fc);
        // needle-hole shading: dark where the thread dives in, light on the crown
        const ao = shade * (1 - 0.58 * stitchAO * (1 - Math.pow(along, 0.7))) * (1 - 0.18 * stitchAO * fc * fc);
        col.push(ao, ao, ao);
      }
    }
    for (let ia = 0; ia < 4; ia++) for (let ic = 0; ic < 2; ic++) {
      const a = b0 + ia * 3 + ic, b = a + 3, c = a + 1, d = b + 1;
      idx.push(a, b, c, c, b, d);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// merge stitch geometries keeping their vertex colours (G.merge keeps position/normal/uv only)
function mergeStitches(list) {
  const gs = list.filter(Boolean);
  return gs.length ? mergeGeometries(gs, false) : null;
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
  const fabric = M.pvcCloth(color);
  const thread = M.pvcThread(color);
  stitchAO = thread.userData.threadAO ?? 1;
  stitchSeed = 1; // deterministic stitch jitter, whatever the page rendered before
  // Frame tubes: Premium = black powder-coated steel (catalogue: 'zwart gepoedercoat staal 40 mm', the visible
  // difference to Professional), Professional = bare aluminium. p.frameFinish ('powder' | 'alu') overrides.
  const powder = (p.frameFinish || (kind === 'premium' ? 'powder' : 'alu')) === 'powder';
  // satin black powder coat (roughness 0.4 under a satin clear layer): every hex facet carries a
  // faint highlight strip from the studio's vertical strip boxes, so hex profile and the step from
  // outer to inner tube read at catalogue size instead of a flat black stick
  // Professional: brushed, clear-anodised aluminium: a satin metal with a long anisotropic streak
  // along the tube (brushing direction) and, on the hex legs, black flags in the studio's
  // reflection (engine envFlag) so the facets alternate light / dark like photographed metal;
  // 'aluminium Pro 50' reads as a different material from the black steel of Premium 40
  const anodised = (tone, roughness, flag) => {
    const m = M.aluminium({ tone, roughness }).clone();
    m.anisotropy = 0.85;
    m.userData = flag ? { envFlag: { k: 0.28, a0: 62, a1: 118 } } : {};
    m.name = `anodised aluminium${flag ? ' (flagged)' : ''}`;
    return m;
  };
  const alu = powder ? M.steelPowder('#1C1D1F', { roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.24 }) : anodised('#D3D7DB', 0.2, false);
  const aluLeg = powder ? alu : anodised('#D3D7DB', 0.2, true);
  const aluInner = powder ? M.steelPowder('#202124', { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }) : anodised('#C6CACF', 0.26, true);
  // Premium: injection-moulded glass-filled nylon; Professional: cast aluminium brackets
  const pro = S.bracket !== 'nylon';
  const bracketMat = pro ? M.castAluminium('#9A9FA4') : M.mouldedNylon('#161616');
  const nylon = M.mouldedNylon('#161616');
  const markMat = (() => {
    const m = bracketMat.clone(); m.normalMap = TX.embossNormal({ text: 'KLAPKLAAR', sub: pro ? 'PRO 50' : 'PREMIUM 40' }); m.normalScale = new THREE.Vector2(1, 1);
    m.userData = {}; m.name = `${bracketMat.name} mark`; return m;
  })();
  const galv = M.galvanised();
  const galvS = M.galvanisedSteel();
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
  // Hero azimuth: every paid wall option must be seen from the OUTSIDE. The hero camera
  // sees two adjacent sides from outside (34 = front+right, -34 = front+left,
  // 146 = back+right, -146 = back+left); pick the pair with the most valuable walls
  // (door > windows > closed), ties keep the catalogue default 34. spec.heroAzimuth wins.
  const wallValue = { half: 1.5, door: 3, 'door-open': 3, windows: 2.2, church: 2.2, churchwindows: 2.2, window2: 2.2, window: 2, panorama: 2, closed: 0.4, rolled: 0.3 };
  const sideTypes = (name) => { const v = walls[name]; if (!v || v === 'none' || v === 'open') return []; return Array.isArray(v) ? v : [v]; };
  let heroAz = 34;
  if (p.heroAzimuth != null) heroAz = Number(p.heroAzimuth);
  else if (Object.keys(walls).length) {
    let best = -1;
    for (const [az, sa, sb] of [[34, 'front', 'right'], [-34, 'front', 'left'], [146, 'back', 'right'], [-146, 'back', 'left']]) {
      const ts = [...sideTypes(sa), ...sideTypes(sb)];
      const score = ts.reduce((acc, t) => acc + (wallValue[t] || 0), 0) + 0.5 * new Set(ts.filter((t) => (wallValue[t] || 0) >= 2)).size;
      if (score > best + 1e-6) { best = score; heroAz = az; }
    }
  }
  const markDir = V3(Math.sin((heroAz * Math.PI) / 180), 0, Math.cos((heroAz * Math.PI) / 180));

  // ---- roof surface field ------------------------------------------------------------
  const roofOv = 0.022; // roof runs slightly past the frame
  const X0 = -w / 2 - roofOv, X1 = w / 2 + roofOv, Z0 = -d / 2 - roofOv, Z1 = d / 2 + roofOv;
  const roofX = [X0, ...xs.slice(1, -1), X1];
  const roofZ = [Z0, ...zs.slice(1, -1), Z1];
  const bays = [];
  for (let i = 0; i < nbx; i++) for (let j = 0; j < nbz; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    const bw = roofX[i + 1] - roofX[i], bd = roofZ[j + 1] - roofZ[j];
    const sb = Math.min(bw, bd);
    const rise = 0.30 * sb + 0.06;
    // dish between rafter and hip ~9 cm on a 3 m bay (scales with the bay), hips sag ~4 cm,
    // rafters bow ~2 cm under the cloth
    bays.push({ x0: roofX[i], x1: roofX[i + 1], z0: roofZ[j], z1: roofZ[j + 1], cx, cz, rise, peakY: eaveY + rise, sag: 0.030 * sb, hipSag: 0.013 * sb, bow: 0.0065 * sb });
  }
  const rn = makeNoise2(41);
  const rr = rng(4242);
  // outer roof corners: [x, z, inward sign x, inward sign z]
  const corners = [[X0, Z1, 1, -1], [X1, Z1, -1, -1], [X1, Z0, -1, 1], [X0, Z0, 1, 1]];
  // the canopy outline is a rectangle with tight corners (radius rcTop, the sewn corner of
  // the skirt): distance inside it
  const rcTop = 0.016;
  const patchL = 0.30; // corner reinforcement patch leg length
  const RX = (X1 - X0) / 2, RZ = (Z1 - Z0) / 2, RCX = (X0 + X1) / 2, RCZ = (Z0 + Z1) / 2;
  function edgeDist(x, z) {
    const qx = Math.abs(x - RCX) - (RX - rcTop), qz = Math.abs(z - RCZ) - (RZ - rcTop);
    const sd = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rcTop;
    return -sd;
  }
  // dish envelope along the fall line (0 at the apex and at the eave, where the cloth is
  // held by the truss), normalised to 1
  const dishRaw = (r) => Math.pow(r, 1.1) * (1 - Math.exp(-(1 - r) / 0.1));
  let dishMax = 0; for (let i = 0; i <= 200; i++) dishMax = Math.max(dishMax, dishRaw(i / 200));
  const dishEnv = (r) => (r >= 1 ? 0 : dishRaw(r) / dishMax);

  function bayHeight(b, x, z) {
    const du = x - b.cx, dv = z - b.cz;
    const hx = du < 0 ? b.cx - b.x0 : b.x1 - b.cx;
    const hz = dv < 0 ? b.cz - b.z0 : b.z1 - b.cz;
    const a = Math.abs(du) / hx, c = Math.abs(dv) / hz;
    // hip crease rounded over ~2 cm; round the peak cap the cloth is pulled over a round cap,
    // so the hips soften (~11 cm) and the circular apex patch reads as a circle, not a scallop
    // (the same softening widens the hip line of the panel dish below: one smooth round hip
    // within ~45 cm of the cap, no pinched crease where a sharp dish meets a round hip)
    const hipSoft = 0.09 * (1 - sstep(0.12, 0.5, Math.hypot(du, dv)));
    const kh = (0.024 + hipSoft) / Math.min(hx, hz);
    const m = smax(a, c, kh);
    const ea = 0.035 / Math.min(hx, hz); // rounded apex (fabric over the pole cap)
    const m2 = (Math.sqrt(m * m + ea * ea) - ea) / (Math.sqrt(1 + ea * ea) - ea);
    let h = eaveY + b.rise * (1 - m2);
    // the rafters bow a little under the cloth tension: each face is slightly concave
    h -= b.bow * Math.sin(Math.PI * Math.min(1, m));
    const major = Math.max(a, c), minor = Math.min(a, c);
    if (major < 1) {
      // t = 0 on the rafter line (face centre), 1 on the hip; both ends rounded: the cloth
      // rides over the rafter tube (~1.6 cm) and over the taut hip seam (~3 cm)
      const r = major;
      // the cloth is taut round the peak cap: the panel sag fades out over the top ~35 cm, so
      // the rafter ridges never stand above the panels next to the cap
      const apexFade = sstep(0.1, 0.38, r * (c >= a ? hz : hx));
      const q = minor / Math.max(major, 1e-6);
      const lat = (c >= a ? hx : hz) * r;
      const e1 = 0.016 / Math.max(lat, 0.04);
      let t = Math.min(1, sabs(q, e1) / (Math.sqrt(1 + e1 * e1) - e1));
      const e2 = (0.03 + hipSoft) / Math.max(lat, 0.04);
      t = 1 - Math.min(1, sabs(1 - t, e2) / (Math.sqrt(1 + e2 * e2) - e2));
      const across = 4 * t * (1 - t);
      const env = dishEnv(r) * apexFade;
      // each half-panel dishes between its rafter and hip; the hip seam carries the
      // corner-to-apex tension and only sags a little, so the silhouettes bow inward
      let sag = b.sag * env * across + b.hipSag * apexFade * Math.sin(Math.PI * Math.pow(r, 1.25)) * t * t;
      sag += 0.0022 * across * Math.min(1, env * 1.5) * rn.fbm(x * 2.3 + 11, z * 2.3 - 4, 3);
      h -= sag;
    }
    return h;
  }
  // soft tension ridges: 4 fanning from every corner pocket (around the hip direction) and
  // 3 per face from the peak cap, each a raised fold with shallow troughs that widens and
  // flattens as it runs out. Deterministic per tent.
  // corner pocket: 2 shallow, straight tension wrinkles on each face next to the hip (5-13 deg
  // off the hip line, 3.5-5 mm high, no troughs beside them), so the dish between rafter and hip
  // stays one smooth curve and the corner never reads as a funnel
  const cornerRidges = corners.map(([cx0, cz0]) => {
    const b = bays.slice().sort((p1, p2) => Math.hypot(p1.cx - cx0, p1.cz - cz0) - Math.hypot(p2.cx - cx0, p2.cz - cz0))[0];
    const hip = Math.atan2(Math.abs(b.cz - cz0), Math.abs(b.cx - cx0));
    return [-0.2, -0.09, 0.09, 0.2].map((o) => ({ ang: hip + o * (1 + (rr() - 0.5) * 0.3), len: 0.36 + 0.2 * rr(), amp: 0.0035 + 0.0015 * rr(), w0: 0.007 + 0.003 * rr(), plain: true }));
  });
  const apexRidges = bays.map(() => {
    const out = [];
    // (angles off the hip line by >= ~0.2 rad: a ridge on the hip itself pinched the hip seam
    // just behind the cap)
    for (let f = 0; f < 4; f++) for (const o of [-0.52, -0.26, 0.4]) out.push({ ang: f * Math.PI / 2 + Math.PI / 4 + o + (rr() - 0.5) * 0.12, len: 0.2 + 0.16 * rr(), amp: 0.0028 + 0.0016 * rr(), w0: 0.014 });
    return out;
  });
  function ridgeSum(list, rho, phi, startFade) {
    let s = 0;
    for (const rk of list) {
      let dphi = phi - rk.ang; dphi = Math.atan2(Math.sin(dphi), Math.cos(dphi));
      if (Math.abs(dphi) > 1.2) continue;
      const along = rho * Math.cos(dphi), dl = rho * Math.sin(dphi);
      if (along <= 0) continue;
      const wdt = rk.w0 + (rk.plain ? 0.012 : 0.035) * along;
      const g = (dl / wdt) ** 2;
      if (g > 12) continue;
      s += rk.amp * (rk.plain ? 1 : 1 - 0.55 * g) * Math.exp(-g) * startFade(along) * Math.exp(-along / rk.len);
    }
    return s;
  }
  function tensionRidges(x, z) {
    let s = 0;
    for (let ci = 0; ci < 4; ci++) {
      const [cx0, cz0, sx, sz] = corners[ci];
      const dx = (x - cx0) * sx, dz = (z - cz0) * sz;
      if (dx < -0.02 || dz < -0.02) continue;
      const rho = Math.hypot(dx, dz);
      if (rho > 1.6) continue;
      // the double-layer corner patch is stiff: the pocket's tension ridges only show beyond it,
      // so the patch outline and its stitching stay straight
      const stiff = 0.12 + 0.88 * sstep(patchL - 0.02, patchL + 0.12, dx + dz);
      s += stiff * ridgeSum(cornerRidges[ci], rho, Math.atan2(dz, dx), (al) => 1 - Math.exp(-al / 0.06));
    }
    for (let bi = 0; bi < bays.length; bi++) {
      const b = bays[bi];
      const dx = x - b.cx, dz = z - b.cz, rho = Math.hypot(dx, dz);
      if (rho < 0.08 || rho > 1.0) continue;
      s += ridgeSum(apexRidges[bi], rho, Math.atan2(dz, dx), (al) => sstep(0.2, 0.34, al));
    }
    return s;
  }
  // eave: the roof cloth is pulled taut over the truss top (a slight convex shoulder over the
  // last ~6 cm) and turns down in a crisp fold (radius 4 mm, vertical at the outline) into the
  // valance: one sewn edge, no bullnose
  const foldR = 0.004, shoulderW = 0.06, shoulderD = 0.0045;
  // eave scallops: the canopy edge is velcroed to the truss at the legs and at every top node of
  // the scissor (~1 m apart) and sags ~4 mm between those points; the valance hangs from the
  // edge, so the skirt follows the same shallow festoon (no dead-straight board)
  const pinsAlong = (ls) => {
    const out = [];
    for (let i = 0; i < ls.length - 1; i++) {
      const a2 = ls[i], b2 = ls[i + 1], n = Math.max(2, Math.round((b2 - a2) / 1.0)), gp = legAF / 2 + 0.024;
      out.push(a2); for (const v of linspace(a2 + gp, b2 - gp, n)) out.push(v);
    }
    out.push(ls[ls.length - 1]);
    return out.sort((a2, b2) => a2 - b2);
  };
  const pinsX = pinsAlong(xs), pinsZ = pinsAlong(zs);
  const scallop = (pins, s) => {
    for (let i = 0; i < pins.length - 1; i++) {
      const a2 = pins[i], b2 = pins[i + 1];
      if (s >= a2 && s <= b2) { const Ls = b2 - a2; return Math.min(1, Ls / 0.9) * Math.pow(Math.sin(Math.PI * (s - a2) / Math.max(1e-6, Ls)), 1.3); }
    }
    return 0;
  };
  const eaveDip = 0.004, eaveDipW = 0.22;
  function eaveSag(x, z, e) {
    if (e > eaveDipW) return 0;
    const dX = RX - Math.abs(x - RCX), dZ = RZ - Math.abs(z - RCZ);
    // near a corner blend both sides (the corner itself is pinned: scallop 0 beyond the legs)
    const wz = sstep(-0.05, 0.05, dX - dZ); // 1: front/back edge is the nearer one
    const sc = wz * scallop(pinsX, x) + (1 - wz) * scallop(pinsZ, z);
    const f = 1 - sstep(0, eaveDipW, e);
    return eaveDip * sc * f * f;
  }
  function H(x, z) {
    const e = edgeDist(x, z);
    // the soft valley between bays sharpens towards the eave (no bump in the eave line)
    const kv = 0.11 * sstep(0.0, 0.45, e);
    let h = null;
    for (const b of bays) { const hb = bayHeight(b, x, z); h = h === null ? hb : smax(h, hb, kv); }
    h += tensionRidges(x, z) * sstep(0.03, 0.13, e);
    if (e < shoulderW) { const q = 1 - Math.max(0, e) / shoulderW; h -= shoulderD * q * q * q; }
    h -= eaveSag(x, z, Math.max(0, e));
    if (e < foldR) { const k = foldR - Math.max(0, e); h -= foldR - Math.sqrt(Math.max(0, foldR * foldR - k * k)); }
    return h;
  }
  function roofNormal(x, z) {
    const e = 0.004;
    const dx = (H(x + e, z) - H(x - e, z)) / (2 * e), dz = (H(x, z + e) - H(x, z - e)) / (2 * e);
    return V3(-dx, 1, -dz).normalize();
  }
  // the canopy outline has soft corners (sewn round the corner pockets): points beyond
  // the corner arc are pulled onto it
  function clampRound(x, z, r = rcTop) {
    const cx = x < X0 + r ? X0 + r : x > X1 - r ? X1 - r : null;
    const cz = z < Z0 + r ? Z0 + r : z > Z1 - r ? Z1 - r : null;
    if (cx === null || cz === null) return [x, z];
    const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz);
    return l <= r ? [x, z] : [cx + (dx / l) * r, cz + (dz / l) * r];
  }
  // uv in metres measured ON the roof: horizontal distance across the fall line, slope
  // distance along it (per face), so the weave keeps its 1:1 aspect on the 33 deg faces;
  // the per-face seams lie under the hip and rafter tapes
  function roofUV(geo) {
    const P = geo.attributes.position, U = geo.attributes.uv || new THREE.BufferAttribute(new Float32Array(P.count * 2), 2);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i);
      let b = bays[0];
      for (const bb of bays) if (x >= bb.x0 - 1e-6 && x <= bb.x1 + 1e-6 && z >= bb.z0 - 1e-6 && z <= bb.z1 + 1e-6) { b = bb; break; }
      const hx = x < b.cx ? b.cx - b.x0 : b.x1 - b.cx, hz = z < b.cz ? b.cz - b.z0 : b.z1 - b.cz;
      const a = Math.abs(x - b.cx) / hx, c = Math.abs(z - b.cz) / hz;
      if (c >= a) U.setXY(i, x, -b.cz - (z - b.cz) * Math.hypot(hz, b.rise) / hz);
      else U.setXY(i, b.cx + (x - b.cx) * Math.hypot(hx, b.rise) / hx, -z);
    }
    geo.setAttribute('uv', U); U.needsUpdate = true;
    return geo;
  }
  const roofPt = (x0, z0, off = 0) => { const [x, z] = clampRound(x0, z0); const n = roofNormal(x, z); return V3(x, H(x, z), z).addScaledVector(n, off); };

  // roof canopy mesh: 1.2 cm grid, graded down to ~1 mm at the eave so the fold is round
  {
    const W = X1 - X0, D = Z1 - Z0;
    const graded = (L) => {
      const edge = [0, 0.0006, 0.0015, 0.0028, 0.0045, 0.0066, 0.0092, 0.0124, 0.0165, 0.022];
      const out = edge.slice();
      const n = Math.ceil((L - 2 * 0.022) / 0.012);
      for (let i = 1; i < n; i++) out.push(0.022 + (L - 0.044) * (i / n));
      for (let i = edge.length - 1; i >= 0; i--) out.push(L - edge[i]);
      return out;
    };
    const gx = graded(W), gz = graded(D);
    const geo = grid((u, v, o) => {
      const i = Math.round(u * (gx.length - 1)), j = Math.round(v * (gz.length - 1));
      const [x, z] = clampRound(X0 + gx[i], Z1 - gz[j]); o.set(x, H(x, z), z);
    }, gx.length - 1, gz.length - 1);
    roofUV(geo);
    bins.add(fabric, geo);
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

  // seam welt: the folded seam allowance under the tape stands up as a rounded bead down the
  // middle of the tape (width w, height h above the tape top `base`), with a faint gutter either
  // side where the stitching pulls the tape down. 6-7 mm wide: 2-3 px at 2000 px, so hip and
  // rafter lines read as sewn seams in the catalogue image, not as creases
  function roofWelt(fn, len, w, h, base) {
    const nu = Math.max(2, Math.ceil(len / 0.012));
    const P = (t) => fn(t);
    const perpAt = (t) => { const e = 1e-3; const a = P(Math.max(0, t - e)), b = P(Math.min(1, t + e)); const dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    const W = w * 1.8; // bead + gutters
    const geo = G.surface((u, v, o) => {
      const [x, z] = P(u); const [px, pz] = perpAt(u);
      const c = (v - 0.5) * W, k = Math.abs(c) / (w / 2);
      // end taper over the last 3 cm so the bead runs out into the tape
      const endF = sstep(0, 0.03 / len, u) * sstep(0, 0.03 / len, 1 - u);
      const bead = k < 1 ? Math.pow(1 - k * k, 0.65) : 0;
      const gutter = k > 0.85 ? -0.22 * Math.exp(-(((k - 1.15) / 0.2) ** 2)) : 0;
      const ramp = 1 - sstep(0.75, 1, Math.abs(c) / (W / 2));
      o.copy(roofPt(x + px * c, z + pz * c, base + endF * h * (bead + gutter) * ramp - 0.0002 * (1 - ramp)));
    }, nu, 14, { uvScale: [len, W] });
    const n0 = new THREE.Vector3(); geo.computeVertexNormals(); n0.fromBufferAttribute(geo.attributes.normal, 7 * (nu + 1) + 1);
    if (n0.y < 0) flipGeo(geo);
    bins.add(M.pvcPatch(color), geo);
  }

  // hip seam tapes (corner -> apex of every bay), valley seams between bays. Seams stop
  // where the eave fold starts (2 cm inside the outline): the fold stays one clean curve
  const apexR = 0.16;
  const clipT = (fn) => {
    let t0 = 0, t1 = 1;
    while (t0 < 0.5 && edgeDist(...fn(t0)) < 0.02) t0 += 0.002;
    while (t1 > 0.5 && edgeDist(...fn(t1)) < 0.02) t1 -= 0.002;
    return [t0, t1];
  };
  const seam = (fn, len, width, lift, opts, welt = null) => {
    const [t0, t1] = clipT(fn);
    roofRibbon((t) => fn(t0 + (t1 - t0) * t), len * (t1 - t0), width, lift, opts);
    if (welt) roofWelt((t) => fn(t0 + (t1 - t0) * t), len * (t1 - t0), welt[0], welt[1], lift);
  };
  for (const b of bays) {
    const bc = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]];
    for (const [x0, z0] of bc) {
      const L = Math.hypot(b.cx - x0, b.cz - z0);
      const tEnd = 1 - (apexR - 0.01) / L;
      seam((t) => { const tt = t * tEnd; return [x0 + (b.cx - x0) * tt, z0 + (b.cz - z0) * tt]; }, L * tEnd, 0.03, 0.0016, undefined, [0.0068, 0.0024]);
    }
  }
  // each roof face is sewn from two panels: a narrower felled seam runs down the rafter line
  for (const b of bays) {
    for (const [mx, mz] of [[b.cx, b.z0], [b.cx, b.z1], [b.x0, b.cz], [b.x1, b.cz]]) {
      const L = Math.hypot(b.cx - mx, b.cz - mz);
      const tEnd = 1 - (apexR - 0.01) / L;
      seam((t) => { const tt = t * tEnd; return [mx + (b.cx - mx) * tt, mz + (b.cz - mz) * tt]; }, L * tEnd, 0.022, 0.0012, { stitchInset: 0.004 }, [0.0052, 0.0017]);
    }
  }
  for (let i = 1; i < nbx; i++) seam((t) => [xs[i], Z0 + (Z1 - Z0) * t], Z1 - Z0, 0.034, 0.0016, undefined, [0.0068, 0.0024]);
  for (let j = 1; j < nbz; j++) seam((t) => [X0 + (X1 - X0) * t, zs[j]], X1 - X0, 0.034, 0.0016, undefined, [0.0068, 0.0024]);

  // corner reinforcement patches (rounded triangles) + apex patch + cap
  const patchMat = M.pvcPatch(color);
  const capMat = (() => {
    const m = patchMat.clone(); m.normalMap = null; m.roughness = patchMat.roughness;
    m.userData = { envSpec: patchMat.userData.envSpec, dye: patchMat.userData.dye || 0 };
    m.name = `peak cap ${color}`; return m;
  })();
  // rounded-triangle outline (legs along the two eaves, 3.5 cm corner radii) as a polar
  // function R(phi) around the roof corner; phi = 0 along the x eave, pi/2 along the z eave
  const pr = 0.035, pc = pr / Math.tan(Math.PI / 8);
  const outlinePts = [];
  for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * (Math.PI * 3 / 4); outlinePts.push([patchL - pc + pr * Math.cos(a), pr + pr * Math.sin(a)]); }
  for (let i = 1; i < 40; i++) { const t = i / 40; const A = outlinePts[24]; const Bq = [pr + pr * Math.cos(Math.PI / 4), patchL - pc + pr * Math.sin(Math.PI / 4)]; outlinePts.push([A[0] + (Bq[0] - A[0]) * t, A[1] + (Bq[1] - A[1]) * t]); }
  for (let i = 0; i <= 24; i++) { const a = Math.PI / 4 + (i / 24) * (Math.PI * 3 / 4); outlinePts.push([pr + pr * Math.cos(a), patchL - pc + pr * Math.sin(a)]); }
  const polar = outlinePts.map(([x, z]) => [Math.atan2(z, x), Math.hypot(x, z)]);
  const Rp = (phi) => {
    if (phi <= polar[0][0]) return polar[0][1];
    for (let i = 1; i < polar.length; i++) if (phi <= polar[i][0]) { const f = (phi - polar[i - 1][0]) / Math.max(1e-9, polar[i][0] - polar[i - 1][0]); return polar[i - 1][1] + (polar[i][1] - polar[i - 1][1]) * f; }
    return polar[polar.length - 1][1];
  };
  // the same outline grown inwards by d (for the stitch rows), as local [x, z] points
  const insetOutline = (d) => {
    const out = [];
    for (let i = 0; i < outlinePts.length; i++) {
      const a = outlinePts[Math.max(0, i - 1)], b2 = outlinePts[Math.min(outlinePts.length - 1, i + 1)];
      const tx = b2[0] - a[0], tz = b2[1] - a[1], l = Math.hypot(tx, tz) || 1;
      // the outline runs counter-clockwise round the patch: the inside is to the left
      out.push([outlinePts[i][0] - (tz / l) * d, outlinePts[i][1] + (tx / l) * d]);
    }
    return out;
  };
  for (const [ox, oz, sx, sz] of corners) {
    // the patch starts where the eave fold ends, so it lies flat on the roof
    const cx0 = ox + sx * (foldR + 0.004), cz0 = oz + sz * (foldR + 0.004);
    const ptAt = (phi, rr, off) => roofPt(cx0 + sx * Math.cos(phi) * rr, cz0 + sz * Math.sin(phi) * rr, off);
    const geo = G.surface((u, v, o) => {
      const phi = u * Math.PI / 2; const R = Rp(phi), rr = v * R;
      // the double layer feathers out on its free edge (no open step to catch a dark line)
      const edge = sstep(R - 0.004, R, rr);
      o.copy(ptAt(phi, rr, 0.0011 * (1 - edge) + 0.0002));
    }, 48, 18);
    roofUV(geo);
    geo.computeVertexNormals(); const n0 = V3().fromBufferAttribute(geo.attributes.normal, 49 * 9 + 24); if (n0.y < 0) flipGeo(geo);
    bins.add(patchMat, geo);
    // even double row of stitching 6 and 12 mm inside the free edge, ending at the eave seam
    for (const dIn of [0.006, 0.012]) {
      const smp = [];
      for (const [lx, lz] of insetOutline(dIn)) {
        if (lx < 0.014 || lz < 0.014) continue;
        const x = cx0 + sx * lx, z = cz0 + sz * lz;
        smp.push({ p: roofPt(x, z, 0.0011), n: roofNormal(x, z) });
      }
      stitches.push(stitchGeo(smp));
    }
  }
  for (const b of bays) {
    const ap = (phi, rr, off) => roofPt(b.cx + Math.cos(phi) * rr, b.cz + Math.sin(phi) * rr, off);
    const geo = G.surface((u, v, o) => {
      const rr = v * apexR; const edge = sstep(apexR - 0.004, apexR, rr);
      o.copy(ap(u * TAU, rr, 0.0013 * (1 - edge) + 0.0002));
    }, 96, 12);
    roofUV(geo);
    geo.computeVertexNormals(); const n0 = V3().fromBufferAttribute(geo.attributes.normal, 97 * 6 + 10); if (n0.y < 0) flipGeo(geo);
    bins.add(patchMat, geo);
    // circular patch: even double row of stitching 6 and 12 mm inside its edge
    for (const rr of [apexR - 0.006, apexR - 0.012]) {
      const smp = [];
      for (let i = 0; i <= 160; i++) { const phi = (i / 160) * TAU; const x = b.cx + Math.cos(phi) * rr, z = b.cz + Math.sin(phi) * rr; smp.push({ p: roofPt(x, z, 0.0013), n: roofNormal(x, z) }); }
      stitches.push(stitchGeo(smp));
    }
    // top cap over the pole: a low dome covered in the canopy cloth, smooth (no weave map: on a
    // 5 cm dome the cloth's uv-mapped weave read as a perforated grey part / a foreign knob);
    // profile from the rim up, so the lathe's normals face outwards
    const top = H(b.cx, b.cz);
    const cap = G.lathe([[0.058, 0.0], [0.053, 0.004], [0.042, 0.0085], [0.026, 0.012], [0.0001, 0.0135]], 40);
    cap.translate(b.cx, top - 0.0075, b.cz);
    bins.add(capMat, cap);
  }

  // ---- valance -------------------------------------------------------------------------
  // A thin sewn skirt round the canopy: four straight panels joined by sewn corner seams (the
  // outline corner is tight, rcTop, and the seam allowance makes every corner kick out a little
  // towards the hem). Taut along the roof seam, it relaxes downwards: a slight outward flare, a
  // soft belly between the legs, soft irregular vertical drape ripples that grow towards the
  // hem, and a shallow festoon in the hem between the points where it is pinned to the frame.
  // The hem is a 2 cm turned-up fold: from outside only its true ~2 mm edge shows, plus one
  // tone-on-tone stitch row 17 mm up.
  const drop = Number(p.valanceDrop ?? S.valance);
  const vn = makeNoise2(57);
  const sides = [
    { name: 'front', A: V3(X0, 0, Z1), dir: V3(1, 0, 0), n: V3(0, 0, 1), L: X1 - X0, legs: xs.map((x) => x - X0) },
    { name: 'right', A: V3(X1, 0, Z1), dir: V3(0, 0, -1), n: V3(1, 0, 0), L: Z1 - Z0, legs: zs.map((z) => Z1 - z) },
    { name: 'back', A: V3(X1, 0, Z0), dir: V3(-1, 0, 0), n: V3(0, 0, -1), L: X1 - X0, legs: xs.map((x) => X1 - x) },
    { name: 'left', A: V3(X0, 0, Z0), dir: V3(0, 0, 1), n: V3(-1, 0, 0), L: Z1 - Z0, legs: zs.map((z) => z - Z0) },
  ];
  const rcV = rcTop;
  const flare = (t) => 0.010 * Math.pow(t, 1.5);
  // between-pin shape (0 at legs/corners, 1 mid-span)
  function spanShape(side, s) {
    const pins = side.legs.slice().sort((a2, b2) => a2 - b2);
    for (let i = 0; i < pins.length - 1; i++) {
      const a2 = pins[i], b2 = pins[i + 1];
      if (s >= a2 && s <= b2 && b2 - a2 > 0.3) return Math.sin(Math.PI * (s - a2) / (b2 - a2));
    }
    return 0;
  }
  // soft vertical ripples: three irregular wavelengths (~20-70 cm) per side + value noise
  const ripW = sides.map((side, k) => { const R = rng(700 + k * 13); return [0.22, 0.36, 0.63].map((lam, i) => ({ lam: lam * (0.85 + 0.3 * R()), ph: R() * TAU, a: [0.42, 0.36, 0.22][i] })); });
  function valOffset(side, s, t) {
    const k = sides.indexOf(side);
    let pin = 1;
    for (const ls of side.legs) pin = Math.min(pin, sstep(0.0, 0.3, Math.abs(s - ls)));
    pin = Math.min(pin, sstep(0, 0.1, s), sstep(0, 0.1, side.L - s));
    // the top is sewn to the roof edge (offset 0): belly and ripples grow towards the hem
    const belly = 0.009 * Math.pow(spanShape(side, s), 1.4) * Math.pow(t, 1.2);
    let rip = 0;
    for (const wv of ripW[k]) rip += wv.a * Math.sin(s * TAU / wv.lam + wv.ph);
    rip += 0.3 * vn.noise(s * 4.3 + k * 7.1, 0.4 + t * 0.7);
    const ripple = 0.0045 * pin * Math.pow(t, 1.25) * rip;
    // corner kick: the seam allowance stiffens the corner, so it stands out towards the hem
    const sd = Math.min(s, side.L - s);
    const kick = 0.0075 * Math.pow(t, 1.6) * Math.exp(-sd / 0.06);
    return flare(t) + belly + ripple + kick;
  }
  // roof edge height above a point of the outline: the bottom of the eave fold, where the
  // roof cloth has turned vertical and continues as the valance
  const edgeY = (b) => H(b.x, b.z);
  // attachment points of the skirt along each side: the legs and the top connectors of the
  // scissor truss (~1 m apart); the hem dips 3-6 mm between them (shallow festoon)
  const attachS = sides.map((side) => {
    const pins = side.legs.slice().sort((a2, b2) => a2 - b2);
    const out = [0, side.L];
    for (let i = 0; i < pins.length - 1; i++) {
      const a2 = pins[i], b2 = pins[i + 1], Ls = b2 - a2;
      const n = Math.max(2, Math.round(Ls / 1.0));
      out.push(a2);
      const gp = legAF / 2 + 0.024; // scissor end gap (as in the truss below)
      for (const sN of linspace(a2 + gp, b2 - gp, n)) out.push(sN);
    }
    out.push(pins[pins.length - 1]);
    return [...new Set(out.map((v) => Math.round(v * 1e4) / 1e4))].sort((a2, b2) => a2 - b2);
  });
  function hemDip(k, s) {
    const at = attachS[k];
    for (let i = 0; i < at.length - 1; i++) {
      const a2 = at[i], b2 = at[i + 1];
      if (s >= a2 && s <= b2) { const Ls = b2 - a2; return 0.0018 * Math.min(1, Ls / 0.9) * Math.pow(Math.sin(Math.PI * (s - a2) / Math.max(1e-6, Ls)), 1.25); }
    }
    return 0;
  }
  // outline point of side k: part 'S' = straight run (f 0..1 between the corner arcs),
  // part 'C' = corner arc after side k (f 0..1 = angle 0..90 deg) -> {b, nrm, s}
  // the sewn corner of the skirt is tight at the roof (rcTop) and rounds off towards the hem
  // (~3 cm): no knife-sharp box corner
  const rcHem = 0.03;
  const rcAt = (t) => rcV + (rcHem - rcV) * Math.pow(t, 1.4);
  function valBase(k, part, f, t = 0) {
    const side = sides[k], rc = rcAt(t);
    if (part === 'S') {
      const s = rc + (side.L - 2 * rc) * f;
      return { b: side.A.clone().addScaledVector(side.dir, s), nrm: side.n.clone(), s };
    }
    const nx = sides[(k + 1) % 4], a2 = f * Math.PI / 2;
    const nrm = side.n.clone().multiplyScalar(Math.cos(a2)).addScaledVector(nx.n, Math.sin(a2));
    const c = nx.A.clone().addScaledVector(side.n, -rc).addScaledVector(nx.n, -rc);
    return { b: c.addScaledVector(nrm, rc), nrm, s: null };
  }
  const valTop = (k, part, f) => { const q = valBase(k, part, f); return edgeY(q.b); };
  const valDrop = (k, part, f) => { if (part !== 'S') return drop; const side = sides[k]; const s = valBase(k, part, f).s; return drop + hemDip(k, s) + 0.002 * spanShape(side, s); };
  function valPt(k, part, f, y, off = 0) {
    const yTop = valTop(k, part, f), dd = valDrop(k, part, f);
    const t = clamp01((yTop - y) / dd);
    const q = valBase(k, part, f, t);
    // corner arc: blend the offsets at the two straight ends so the skirt is continuous
    const sd = sides[k], nx = sides[(k + 1) % 4];
    const o = part === 'S' ? valOffset(sd, q.s, t) : (1 - f) * valOffset(sd, sd.L - rcV, t) + f * valOffset(nx, rcV, t);
    return q.b.addScaledVector(q.nrm, o + off).setY(y);
  }
  // straight-run helpers by metres along the side (valance print)
  const sideK = (side) => sides.indexOf(side);
  const sToF = (side, s) => clamp01((s - rcV) / (side.L - 2 * rcV));
  const valPoint = (side, s, y, off = 0) => valPt(sideK(side), 'S', sToF(side, s), y, off);
  const valTopY = (side, s) => valTop(sideK(side), 'S', sToF(side, s));
  const hemH = 0.02, hemT = 0.0009;
  // hem cross-section (offset, y): round edge of the fold (radius hemT), then the turned-up
  // inner layer; v = 0 continues the outer skirt surface
  const hemProf = (v, yb) => {
    if (v <= 0.5) { const a2 = (v / 0.5) * Math.PI; return [-hemT + hemT * Math.cos(a2), yb + hemT - hemT * Math.sin(a2)]; }
    return [-2 * hemT, yb + hemT + ((v - 0.5) / 0.5) * (hemH - hemT)];
  };
  const parts = [];
  for (let k = 0; k < 4; k++) { parts.push([k, 'S', Math.ceil(sides[k].L / 0.015), sides[k].L]); parts.push([k, 'C', 8, rcV * Math.PI / 2]); }
  // the 2 cm hem band seen from outside: double layer, stitched twice (5 and 13.5 mm up). The
  // stitch rows pull the cloth into two fine gutters, the cloth between them puffs a little and
  // the edge of the turned-up layer inside shows as a faint ridge at 19 mm: a band with two
  // lines that still reads after the downsample to 2000 px (the threads alone vanish)
  const hemRows = [0.005, 0.0135];
  const hemBand = (dy) => {
    const puff = 0.00045 * sstep(0, 0.002, dy) * (1 - sstep(hemH - 0.0022, hemH - 0.0002, dy));
    const ridge = 0.0003 * Math.exp(-(((dy - (hemH - 0.0014)) / 0.0009) ** 2));
    let gut = 0; for (const r of hemRows) gut -= 0.0006 * Math.exp(-(((dy - r) / 0.0008) ** 2));
    return puff + ridge + gut;
  };
  for (const [k, part, nu, len] of parts) {
    const outward = valBase(k, part, 0.5).nrm;
    const yBot = (u) => valTop(k, part, u) - valDrop(k, part, u);
    // rows: 16 over the skirt, 26 over the bottom 3.2 cm (hem band relief)
    const hb = 0.032 / drop, vRows = [];
    for (let i = 0; i <= 16; i++) vRows.push((1 - hb) * i / 16);
    for (let i = 1; i <= 26; i++) vRows.push(1 - hb + hb * i / 26);
    const geo = G.surface((u, v, o) => {
      const vv = vRows[Math.round(v * (vRows.length - 1))];
      const yT = valTop(k, part, u), yB = yBot(u) + hemT;
      const y = yT - vv * (yT - yB);
      o.copy(valPt(k, part, u, y, hemBand(y - yB)));
    }, nu, vRows.length - 1, { uvScale: [len, drop] });
    { const nn = V3().fromBufferAttribute(geo.attributes.normal, 10 * (nu + 1) + Math.floor(nu / 2)); if (nn.dot(outward) < 0) flipGeo(geo); }
    bins.add(fabric, geo);
    const hem = G.surface((u, v, o) => { const [off, y] = hemProf(v, yBot(u)); o.copy(valPt(k, part, u, y, off)); }, nu, 10, { uvScale: [len, hemH * 2] });
    // orient: at the bottom of the round edge the outside faces down
    { const nn = V3().fromBufferAttribute(hem.attributes.normal, 2 * (nu + 1) + Math.floor(nu / 2)); if (nn.y > 0) flipGeo(hem); }
    bins.add(fabric, hem);
  }
  // stitch rows all round: two on the hem (in their gutters), roof seam 7 mm below the eave fold
  const hemRowY = (r) => (k, part, u) => valTop(k, part, u) - valDrop(k, part, u) + hemT + r;
  for (const [yf, off] of [[hemRowY(hemRows[0]), hemBand(hemRows[0]) - 0.0002], [hemRowY(hemRows[1]), hemBand(hemRows[1]) - 0.0002], [(k, part, u) => valTop(k, part, u) - 0.007, 0]]) {
    const smp = [];
    for (const [k, part, , len] of parts) {
      const n = Math.max(3, Math.ceil(len / 0.006));
      for (let i = 0; i < n; i++) { const u = i / n; smp.push({ p: valPt(k, part, u, yf(k, part, u), off), n: valBase(k, part, u).nrm }); }
    }
    smp.push(smp[0]);
    stitches.push(stitchGeo(smp));
  }
  // sewn corner seams: a fine raised seam line down every corner of the skirt
  for (let k = 0; k < 4; k++) {
    const pts2 = [];
    const yT = valTop(k, 'C', 0.5) - 0.002;
    for (let i = 0; i <= 24; i++) pts2.push(valPt(k, 'C', 0.5, yT - (i / 24) * (drop - 0.004), -0.0003));
    bins.add(fabric, sweepTube(pts2, 0.0009, 8));
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
      const art = vp.text ? null : resolvePrint(vp);
      const tex = art ? artTexture(art, ink, cw, ch, vp.fill ?? 0.62)
        : TX.printTexture({ text: vp.text, color: ink, width: cw, height: ch, font: `${vp.weight || 800} ${Math.round(ch * 0.66)}px ${vp.font || '"Arial Black", "Helvetica Neue", Arial, sans-serif'}` });
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
    bins.add(aluLeg, G.prism(hexP(legAF), L(joinY), L(He - 0.03), { side }));
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
    // foot plate: hot-dip galvanised steel, 6 mm with 1 mm bevelled edges and four real
    // through-holes for pegs (the floor shows through); welded hex socket with a rolled top
    // edge, four 3 mm triangular gussets, an M8 bolt through the socket (head outside, nut and
    // thread end inside); an invisible contact proxy offset to the rear/away-from-key side
    // gives the plate a crisp contact shadow on its rear and side edges
    const pl = S.plate, sa = S.inner + 0.008;
    bins.add(galvS, footPlateGeo(pl).clone().translate(x, 0, z));
    bins.add(galvS, G.prism(hexP(sa, 0.1), L(0.005), L(0.075), { side }));
    bins.add(galvS, taperPrism(hexP(sa, 0.1), hexP(sa - 0.003, 0.14), L(0.075), L(0.078), side));
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const dx = Math.cos(a), dz = Math.sin(a);
      const r0 = sa / 2 * 0.95;
      const g = gussetGeo();
      g.applyMatrix4(new THREE.Matrix4().makeBasis(V3(dx, 0, dz), V3(0, 1, 0), V3(-dz, 0, dx)).setPosition(x + dx * r0, 0.0058, z + dz * r0));
      bins.add(galvS, g);
    }
    {
      const by = 0.048, o2 = out.clone(), t2 = V3(-out.z, 0, out.x);
      const head = G.prism(G.roundedPolygonProfile(6, 0.013, 0.0009, 1, Math.PI / 6), L(by).addScaledVector(o2, sa / 2 - 0.0004), L(by).addScaledVector(o2, sa / 2 + 0.0052), { side: t2 });
      bins.add(galv, head);
      bins.add(galv, G.tube(L(by).addScaledVector(o2, sa / 2 + 0.0052), L(by).addScaledVector(o2, sa / 2 + 0.0062), 0.0055, 16));
      bins.add(galv, G.prism(G.roundedPolygonProfile(6, 0.013, 0.0009, 1, Math.PI / 6), L(by).addScaledVector(o2, -sa / 2 + 0.0004), L(by).addScaledVector(o2, -sa / 2 - 0.0065), { side: t2 }));
      bins.add(galv, G.tube(L(by).addScaledVector(o2, -sa / 2 - 0.0065), L(by).addScaledVector(o2, -sa / 2 - 0.0095), 0.0039, 12));
    }
    {
      const away = V3(-markDir.x, 0, -markDir.z).normalize(), right = V3(markDir.z, 0, -markDir.x);
      const cp = new THREE.Mesh(new THREE.BoxGeometry(pl + 0.004, 0.0016, pl + 0.004).translate(x, 0.0008, z).translate(away.x * 0.007 + right.x * 0.005, 0, away.z * 0.007 + right.z * 0.005), CONTACT_PROXY_MAT);
      cp.castShadow = false; cp.receiveShadow = false; cp.userData.contactProxy = true; cp.userData.noFrame = true;
      group.add(cp);
    }
    // tall fixed corner bracket: top under the canopy, lower end visible below the valance.
    // Crisp moulded/cast block: small edge radius, chamfered ends, stiffening ribs on the
    // outer faces, an embossed mark; the Professional cast part is bigger and bolted.
    const bw = legAF + (pro ? 0.044 : 0.03);
    const bTop = He + 0.006, bBot = He - S.bracketDrop;
    mouldedBlock(bins, bracketMat, null, { x, z, w: bw, y0: bBot, y1: bTop, out, ribs: true, pro, chrome });
    // through-bolt of the bracket
    const tb = L(He - 0.07).addScaledVector(out, bw / 2 + (pro ? 0.004 : 0.002));
    bins.add(chrome, G.tube(tb.clone().addScaledVector(out, -0.002), tb.clone().addScaledVector(out, 0.003), 0.0055, 16));
    // slider at the truss bottom with spring pin + pull ring
    const sw = legAF + (pro ? 0.036 : 0.026);
    // the slider is fully visible below the valance: it carries the embossed mark, on the face turned to the hero camera
    mouldedBlock(bins, bracketMat, markMat, { x, z, w: sw, y0: trussBot - 0.048, y1: trussBot + 0.048, out, ribs: true, mark: markDir, pro, chrome });
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
  // Inside a fully walled tent the truss, its bolts and node blocks, the centre poles and rafters
  // only get the light that comes in through the openings: their own material copies are dimmed
  // in the enclosure (engine interiorSolid: env + unshadowed lights x 0.22, up to 0.55 right by an
  // open door), so through a window or the door the frame reads as dark satin steel in a dim room
  // with a few soft highlights, not as light-grey bars or glinting bolt heads lit by the studio.
  // The legs keep the studio light: they stand in the velcro corner slots, seen from outside.
  const enclosedFrame = Object.values(walls).filter((v) => v && !['none', 'open', 'rolled', 'half'].includes(Array.isArray(v) ? v[0] : v)).length >= 4;
  const insideWalls = (m) => {
    if (!enclosedFrame) return m;
    const c = m.clone();
    c.userData = { ...m.userData, interiorSolid: { k: 0.22, kNear: 0.55 } }; delete c.userData.__hooked;
    c.name = `${m.name} (inside walls)`;
    return c;
  };
  const tAlu = insideWalls(alu), tChrome = insideWalls(chrome), tNylon = insideWalls(nylon), tLug = insideWalls(bracketMat);
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
        bins.add(tLug, lug);
        const bc = E.clone().addScaledVector(dd, legAF / 2 + 0.032).setY(y);
        bins.add(tChrome, G.tube(bc.clone().addScaledVector(nrm, -(barT + 0.011)), bc.clone().addScaledVector(nrm, barT + 0.011), 0.0042, 10));
      }
    });
    const s0 = endGapA, s1 = Ls - endGapB;
    const nodes = linspace(s0, s1, n);
    const P = (s, y, off) => A.clone().addScaledVector(dir, s).addScaledVector(nrm, off).setY(y);
    const off = barT * 0.55;
    for (let k = 0; k < n; k++) {
      const sa = nodes[k], sb = nodes[k + 1];
      bins.add(tAlu, G.flatBar(P(sa, yTop, off), P(sb, yBot, off), barT, barW, nrm.clone()));
      bins.add(tAlu, G.flatBar(P(sa, yBot, -off), P(sb, yTop, -off), barT, barW, nrm.clone()));
      // pivot bolt at the crossing: shank + domed heads both sides
      const sm = (sa + sb) / 2, ym = (yTop + yBot) / 2;
      bins.add(tChrome, G.tube(P(sm, ym, -off * 2.3), P(sm, ym, off * 2.3), 0.0042, 12));
      bins.add(tChrome, boltHead(P(sm, ym, off * 2.0), nrm.clone()));
      bins.add(tChrome, boltHead(P(sm, ym, -off * 2.0), nrm.clone().negate()));
      if (k > 0) {
        for (const y of [yTop, yBot]) {
          const c = G.roundedBox(0.044, 0.036, barT * 2 + 0.012, 0.006);
          c.rotateY(rot);
          const cp = P(sa, y, 0); c.translate(cp.x, cp.y, cp.z);
          bins.add(tNylon, c);
          for (const sg of [-1, 1]) bins.add(tChrome, boltHead(P(sa, y, sg * (barT + 0.0065)), nrm.clone().multiplyScalar(sg)));
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
    bins.add(tNylon, G.prism(G.circleProfile(0.062, 28), V3(cx, hubTop - 0.03, cz), V3(cx, hubTop + 0.02, cz)));
    bins.add(tNylon, G.prism(G.circleProfile(0.057, 28), V3(cx, hubBot - 0.03, cz), V3(cx, hubBot + 0.02, cz)));
    const apexY = H(cx, cz);
    bins.add(tAlu, G.tube(V3(cx, hubBot - 0.03, cz), V3(cx, He + 0.25, cz), 0.016, 18));
    bins.add(tAlu, G.tube(V3(cx, He + 0.24, cz), V3(cx, apexY - 0.03, cz), 0.0125, 18));
    bins.add(tNylon, G.prism(G.circleProfile(0.03, 24), V3(cx, apexY - 0.05, cz), V3(cx, apexY - 0.018, cz)));
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
      bins.add(tAlu, sweepTube(pts, S.rafter / 2, 12));
    }
  }

  // ---- side walls -------------------------------------------------------------------------
  const wallColor = p.wallColor || color;
  const wallFabric = M.pvcCloth(wallColor);
  const wallThread = M.pvcThread(wallColor);
  const wallOff = (legAF + 0.03) / 2 + 0.008; // clear of the corner brackets and sliders
  const sideDefs = {
    front: { pts: xs.map((x) => [x, zs[nbz]]), n: V3(0, 0, 1) },
    back: { pts: xs.map((x) => [x, zs[0]]).reverse(), n: V3(0, 0, -1) },
    right: { pts: zs.map((z) => [xs[nbx], z]).reverse(), n: V3(1, 0, 0) },
    left: { pts: zs.map((z) => [xs[0], z]), n: V3(-1, 0, 0) },
  };
  const doors = []; // door panels (for the detail close-up)
  const lightIn = []; // windows [x, z, weight]: openings that let light into a walled tent
  // door state: 'half' (right leaf rolled up and strapped: an opening with the roll above it) or
  // 'closed' (zip, storm flap, door band). Default 'auto': closed in every catalogue view
  // except the detail close-up, which shows the rolled-up leaf and the view inside; the main
  // image never leads with a dark opening (the builder gets the view as p.__angle)
  const doorState = (p.doorState && p.doorState !== 'auto') ? p.doorState : (p.__angle === 'detail' ? 'half' : 'closed');
  const strapLegs = new Map(); // leg key -> [{edge point, outward normal of the wall}]
  const strapAt = (leg, E, nW, along, top = He) => { const k = leg.join(','); if (!strapLegs.has(k)) strapLegs.set(k, []); strapLegs.get(k).push({ E, nW, along, top }); };
  for (const [sideName, typeSpec] of Object.entries(walls)) {
    const def = sideDefs[sideName]; if (!def || !typeSpec || typeSpec === 'none' || typeSpec === 'open') continue;
    const types = Array.isArray(typeSpec) ? typeSpec : [typeSpec];
    for (let k = 0; k < def.pts.length - 1; k++) {
      const type = types[k % types.length];
      if (!type || type === 'none' || type === 'open') continue;
      // panels end on the leg centre lines: at a corner the two walls leave a narrow slot
      // in which the leg and the velcro straps round it are visible
      const a = V3(def.pts[k][0], 0, def.pts[k][1]).addScaledVector(def.n, wallOff);
      const b = V3(def.pts[k + 1][0], 0, def.pts[k + 1][1]).addScaledVector(def.n, wallOff);
      const along = b.clone().sub(a).normalize();
      // 'half': a half-height wall (bar / market stall front) strapped low between the legs
      const half = type === 'half';
      const wTop = half ? Number(p.halfWallHeight ?? 1.0) : He - 0.012;
      buildWall({ group, bins, fabric: wallFabric, thread: wallThread, a, b, n: def.n, top: wTop, type: half ? 'closed' : type, seed: k * 3 + sideName.length,
        print: p.wallPrint && typeof p.wallPrint === 'object' && (p.wallPrint.side || 'back') === sideName ? p.wallPrint : null, doorState });
      strapAt(def.pts[k], a, def.n, along.clone(), wTop);
      strapAt(def.pts[k + 1], b, def.n, along.clone().negate(), wTop);
      if (['window', 'windows', 'window2', 'church', 'churchwindows', 'panorama'].includes(type)) lightIn.push([(a.x + b.x) / 2, (a.z + b.z) / 2, type === 'panorama' ? 0.6 : 0.4]);
      if (type === 'door' || type === 'door-open') doors.push({ mid: a.clone().lerp(b, 0.5), n: def.n.clone(), along: along.clone(), side: sideName, half: type === 'door' && doorState === 'half', open: type === 'door-open' || doorState === 'half', w: Math.min(1.05, a.distanceTo(b) * 0.4) });
    }
  }
  // velcro straps: from every wall edge a 5 cm strap wraps round the leg (teardrop loop:
  // off the wall edge, round the far side of the leg, back), at three heights
  const strapFab = M.pvcPatch(wallColor);
  for (const [key, list] of strapLegs) {
    const [x, z] = key.split(',').map(Number);
    const C = V3(x, 0, z);
    list.forEach(({ E, nW, along, top }, li) => {
      for (const y of (top < 1.5 ? [0.3, top - 0.12] : [0.4, 1.1, 1.62])) {
        const rl = (y < joinY ? S.inner : legAF) / 2 + 0.003 + li * 0.0022;
        // start 4 cm onto the wall, run to the edge, then wrap round the leg
        const P0 = E.clone().addScaledVector(along, 0.04).addScaledVector(nW, 0.0035);
        const E1 = E.clone().addScaledVector(nW, 0.0035);
        const dE = V3(E1.x - C.x, 0, E1.z - C.z), D = dE.length(), th = Math.atan2(dE.z, dE.x);
        const al = Math.acos(Math.min(0.999, rl / D));
        const path = [P0, E1];
        // tangent point, round the far side of the leg, back to the other tangent point
        const nA = 28;
        for (let i = 0; i <= nA; i++) { const t = th + al + (i / nA) * (TAU - 2 * al); path.push(V3(C.x + Math.cos(t) * rl, 0, C.z + Math.sin(t) * rl)); }
        path.push(E1.clone().addScaledVector(nW, 0.0025), P0.clone().addScaledVector(nW, 0.0025));
        // resample densely (corners of the path are rounded by the loop itself)
        const pts = [];
        for (let i = 0; i < path.length - 1; i++) { const A = path[i], B = path[i + 1]; const m2 = Math.max(1, Math.ceil(A.distanceTo(B) / 0.004)); for (let j = 0; j < m2; j++) pts.push(A.clone().lerp(B, j / m2)); }
        pts.push(path[path.length - 1].clone());
        let acc = 0; const accs = pts.map((p2, i) => (acc += i ? p2.distanceTo(pts[i - 1]) : 0));
        const g = G.surface((u, v, o) => { const i = Math.round(u * (pts.length - 1)); o.copy(pts[i]).setY(y + (v - 0.5) * 0.05 * (1 - 0.06 * Math.sin(Math.PI * v))); }, pts.length - 1, 4);
        const U = g.attributes.uv; for (let i = 0; i < U.count; i++) { const iu = i % pts.length, iv = Math.floor(i / pts.length); U.setXY(i, accs[iu], iv / 4 * 0.05); }
        bins.add(strapFab, g);
      }
    });
  }

  // ---- weights ---------------------------------------------------------------------------
  // rubber-coated stackable plates lying ON the foot plate (raised by its 6 mm). On the leg
  // nearest to the camera the slot and the two grip holes face the camera (turned 24 deg aside),
  // so the buyer sees how a plate slides round the leg; on the other legs they face away (a
  // clean round stack). Semi-gloss coating: the bevels of each plate catch a highlight, so the
  // seam between stacked plates reads as a dark groove between two light edges; moulded lip and
  // an embossed '10 KG' pad on top, and a raised '10 KG' plaque on the rim facing the camera
  // (the side is what the hero camera sees)
  const wcount = typeof p.weights === 'object' && p.weights ? (p.weights.count ?? 1) : Number(p.weights || 0);
  if (wcount > 0) {
    const rubberW = (() => { const m = M.mouldedRubber('#242527').clone(); m.roughness = 0.5; m.specularIntensity = 0.75; m.sheen = 0.35; m.name = 'weight rubber'; return m; })();
    const padMat = (() => { const m = rubberW.clone(); m.normalMap = TX.embossNormal({ text: '10 KG', sub: 'KLAPKLAAR', w: 512, h: 222, strength: 2.6 }); m.normalScale = new THREE.Vector2(1, 1); m.userData = {}; m.name = 'weight label'; return m; })();
    const rimMat = weightRimLabelMat(rubberW);
    const plateH = 0.034, Rw = 0.125, plateTop = 0.006, bev = 0.003, gapW = 0.0025;
    const az = (heroAz * Math.PI) / 180;
    const camD = V3(Math.sin(az), 0, Math.cos(az)), camR = V3(camD.z, 0, -camD.x);
    const rotAway = Math.atan2(Math.cos(az), -Math.sin(az)); // local +X (slot) -> away from the camera
    const nearLeg = legPts.slice().sort((a2, b2) => (b2[0] * camD.x + b2[1] * camD.z) - (a2[0] * camD.x + a2[1] * camD.z))[0];
    for (const [x, z] of legPts) {
      const front = x === nearLeg[0] && z === nearLeg[1];
      // front leg: slot towards the camera, turned ~34 deg to the camera's left
      const rot = front ? rotAway + Math.PI - 0.6 : rotAway;
      // rim plaque: centred 20 deg to the camera's right on the front leg (clear of the slot),
      // straight at the camera elsewhere
      const labelAng = front ? 0.35 : 0;
      for (let k = 0; k < wcount; k++) {
        const y0 = plateTop + k * (plateH + gapW);
        const g = weightPlate({ R: Rw, h: plateH, slotHalf: (S.inner + 0.008) * 0.58 + 0.004, bore: 0.054, bevel: bev });
        g.rotateY(rot); g.translate(x, y0, z);
        bins.add(rubberW, g);
        // moulded lip round the top face
        const lip = G.lathe([[Rw - 0.016, 0], [Rw - 0.0135, 0.0022], [Rw - 0.0075, 0.0024], [Rw - 0.005, 0]], 72, Math.PI / 2 + rot + 0.32, TAU - 0.64);
        lip.translate(x, y0 + plateH - 0.0002, z);
        bins.add(rubberW, lip);
        // raised plaque on the rim (outer radius = Rw + bevel)
        {
          const Rr = Rw + bev + 0.0006, arc = 0.1 / Rr, hh = 0.0254, yc = y0 + plateH / 2;
          const dC = camD.clone().multiplyScalar(Math.cos(labelAng)).addScaledVector(camR, Math.sin(labelAng));
          const rC = V3(dC.z, 0, -dC.x);
          const geo = G.surface((u, v, o) => {
            const ph = (u - 0.5) * arc;
            o.set(x, yc + (v - 0.5) * hh, z).addScaledVector(dC, Math.cos(ph) * Rr).addScaledVector(rC, Math.sin(ph) * Rr);
          }, 24, 2);
          geo.computeVertexNormals();
          orientTo(geo, dC);
          const pm = new THREE.Mesh(geo, rimMat); pm.castShadow = false; pm.receiveShadow = true; group.add(pm);
        }
        if (k === wcount - 1) {
          // embossed label pad on the top plate, on the half facing the camera
          const PW = 0.06, PD = 0.026;
          const pad = G.roundedBox(PW, PD, 0.0012, 0.004, 3);
          pad.rotateX(-Math.PI / 2); pad.rotateY(az);
          const pc = V3(x, y0 + plateH + 0.0006, z).addScaledVector(front ? camD.clone().multiplyScalar(Math.cos(1.15)).addScaledVector(camR, Math.sin(1.15)) : camD, 0.085);
          pad.translate(pc.x, pc.y, pc.z);
          // planar uv over the pad face (0..1)
          const P = pad.attributes.position, U = pad.attributes.uv;
          const ex = V3(Math.cos(az), 0, -Math.sin(az)), ez = V3(Math.sin(az), 0, Math.cos(az));
          for (let i = 0; i < P.count; i++) { const dx = P.getX(i) - pc.x, dz = P.getZ(i) - pc.z; U.setXY(i, 0.5 + (dx * ex.x + dz * ex.z) / PW, 0.5 - (dx * ez.x + dz * ez.z) / PD); }
          const pm = new THREE.Mesh(pad, padMat); pm.castShadow = false; pm.receiveShadow = true; group.add(pm);
        }
      }
    }
  }

  bins.build(group);
  for (const m of bins.extra || []) group.add(m);
  // stitches as one mesh (no shadow casting: sub-mm)
  const sg = stitches.filter(Boolean);
  if (sg.length) { const m = new THREE.Mesh(mergeStitches(sg), thread); m.castShadow = false; m.receiveShadow = true; group.add(m); }

  // ---- framing hints -----------------------------------------------------------------------
  const fx = xs[nbx], fz = zs[nbz];
  const peak = Math.max(...bays.map((b) => H(b.cx, b.cz)));
  // enclosure: with three or four hanging walls the inside of the tent is a dim room: inward
  // faces lose most of the open studio's light (k) and the floor inside darkens, except near the
  // openings, where light comes in (kNear, floorNear, falling off over `fall` m); a soft interior
  // ambient (amb) keeps black cloth inside at ~15-25 instead of a black void. PVC windows read as
  // dark smoky foil with a reflection, never as frosted white panes
  const hanging = Object.values(walls).filter((v) => v && !['none', 'open', 'rolled', 'half'].includes(Array.isArray(v) ? v[0] : v)).length;
  const wallPlane = (legAF + 0.03) / 2 + 0.008; // = wallOff below: the walls hang this far outside the leg lines
  // Light comes in through the openings: an open door (rolled-up leaf) lets in the most, a PVC
  // window less; inward faces and the floor are lighter near them and fall off towards the far
  // corners (no black voids, no pitch-black inside behind a window)
  const openings = [...doors.filter((dd) => dd.open).map((dd) => [dd.mid.x + dd.along.x * (dd.half ? dd.w / 4 : 0), dd.mid.z + dd.along.z * (dd.half ? dd.w / 4 : 0), 1]), ...lightIn].slice(0, 6);
  const enclosure = hanging >= 3 ? {
    box: [(xs[0] + xs[nbx]) / 2, (zs[0] + zs[nbz]) / 2, (xs[nbx] - xs[0]) / 2 + 0.07, (zs[nbz] - zs[0]) / 2 + 0.07],
    floorBox: [(xs[0] + xs[nbx]) / 2, (zs[0] + zs[nbz]) / 2, (xs[nbx] - xs[0]) / 2 + wallPlane, (zs[nbz] - zs[0]) / 2 + wallPlane],
    top: peak + 0.05, feather: 0.14,
    k: 0.45, kNear: 1.0, amb: 0.75, ambNear: 1.8, floor: hanging >= 4 ? 0.04 : 0.1, floorNear: 0.35, fall: 1.4, openings,
  } : null;
  // detail close-up: the door (zip, storm flap, straps) when there is one, else the corner
  // bracket of the leg nearest to the hero camera
  let detail;
  if (doors.length) {
    const dd = doors[0];
    const naz = (Math.atan2(dd.n.x, dd.n.z) * 180) / Math.PI;
    // half-open door: centre a little towards the rolled leaf (zip + flap of the closed leaf on the
    // left, the opening and the strapped roll on the right)
    const sh = dd.half ? 0.1 : 0;
    detail = { target: [dd.mid.x + dd.n.x * 0.03 + dd.along.x * sh, dd.half ? 1.48 : 1.52, dd.mid.z + dd.n.z * 0.03 + dd.along.z * sh], size: 1.0, azimuth: naz + 24, elevation: 4, aperture: 0.0025 };
  } else {
    const sx = Math.sign(Math.sin((heroAz * Math.PI) / 180)) || 1, sz = Math.sign(Math.cos((heroAz * Math.PI) / 180)) || 1;
    detail = { target: [sx * (fx - 0.14), He - 0.38, sz * (fz + 0.02)], size: 0.92, azimuth: heroAz + 2, elevation: -4, aperture: 0.0085, shift: [walls.right && walls.right !== 'none' && walls.right !== 'open' ? 0.3 : 0.05, 0] };
  }
  // measurement probes (tools/check-tent-values.mjs): points on the roof face and the valance the
  // hero camera sees on its left (lit by the key) and right (turned away), and on the axis of the
  // leg nearest to the camera, outer and inner tube
  const probes = {};
  {
    const wrap = (a) => ((a + 540) % 360) - 180;
    const faceAz = { front: 0, right: 90, back: 180, left: -90 };
    const vis = Object.entries(faceAz).map(([nm, az]) => [nm, wrap(az - heroAz)]).filter(([, r]) => Math.abs(r) < 89);
    const pick = (sgn) => (vis.filter(([, r]) => Math.sign(r) === sgn).sort((a2, b2) => Math.abs(a2[1]) - Math.abs(b2[1]))[0] || [null])[0];
    const roofPts = (nm) => {
      const out = [];
      if (!nm) return out;
      const nv = { front: [0, 1], back: [0, -1], right: [1, 0], left: [-1, 0] }[nm];
      for (const b of bays) {
        const hx = (b.x1 - b.x0) / 2, hz = (b.z1 - b.z0) / 2;
        // only bays on that edge of the canopy
        if ((nv[1] > 0 && b.z1 < Z1 - 1e-6) || (nv[1] < 0 && b.z0 > Z0 + 1e-6) || (nv[0] > 0 && b.x1 < X1 - 1e-6) || (nv[0] < 0 && b.x0 > X0 + 1e-6)) continue;
        for (const f of [-0.32, -0.12, 0.12, 0.32]) for (const dq of [0.42, 0.62]) {
          const x = b.cx + (nv[0] ? nv[0] * hx * dq : f * hx), z = b.cz + (nv[1] ? nv[1] * hz * dq : f * hz);
          out.push([x, H(x, z) + 0.002, z]);
        }
      }
      return out;
    };
    const valPts = (nm) => {
      const side = sides.find((sd) => sd.name === nm); if (!side) return [];
      const out = [];
      for (const f of [0.18, 0.32, 0.46, 0.6, 0.74, 0.88]) { const s2 = side.L * f; const q = valPoint(side, s2, valTopY(side, s2) - drop * 0.45, 0.002); out.push([q.x, q.y, q.z]); }
      return out;
    };
    const lit = pick(-1), shade = pick(1);
    probes.roofLit = roofPts(lit); probes.roofShade = roofPts(shade);
    probes.valanceLit = valPts(lit); probes.valanceShade = valPts(shade);
    const cd = V3(Math.sin((heroAz * Math.PI) / 180), 0, Math.cos((heroAz * Math.PI) / 180));
    const near = legPts.slice().sort((a2, b2) => (b2[0] * cd.x + b2[1] * cd.z) - (a2[0] * cd.x + a2[1] * cd.z))[0];
    probes.legOuter = [1.3, 1.45, 1.6].map((y) => [near[0], y, near[1]]);
    probes.legInner = [0.35, 0.55, 0.75].map((y) => [near[0], y, near[1]]);
    // side walls: closed cloth low on the wall the hero sees on its left (lit) / right (turned
    // away): below every window type, clear of doors and of the corner straps
    const wallPts = (nm) => {
      const def = sideDefs[nm], types = sideTypes(nm), out = [];
      if (!def || !types.length) return out;
      for (let k = 0; k < def.pts.length - 1; k++) {
        const t = types[k % types.length];
        if (!t || ['rolled', 'none', 'open'].includes(t)) continue;
        const a2 = V3(def.pts[k][0], 0, def.pts[k][1]), b2 = V3(def.pts[k + 1][0], 0, def.pts[k + 1][1]);
        for (const f of [0.14, 0.24, 0.76, 0.86]) for (const y of [0.42, 0.62]) {
          const q = a2.clone().lerp(b2, f).addScaledVector(def.n, wallOff + 0.02);
          out.push([q.x, y, q.z]);
        }
      }
      return out;
    };
    probes.wallLit = wallPts(lit); probes.wallShade = wallPts(shade);
    // PVC window panes on the sides the hero sees (what the foil shows: the dim inside behind
    // smoky foil, never a white card of studio seen through a window on the far side)
    probes.windowPane = [lit, shade].filter(Boolean).flatMap((nm) => {
      const def = sideDefs[nm], types = sideTypes(nm), out = [];
      if (!def || !types.length) return out;
      for (let k = 0; k < def.pts.length - 1; k++) {
        const t = types[k % types.length];
        if (!['window', 'panorama'].includes(t)) continue;
        const a2 = V3(def.pts[k][0], 0, def.pts[k][1]), b2 = V3(def.pts[k + 1][0], 0, def.pts[k + 1][1]);
        for (const f of [0.36, 0.44, 0.56, 0.64]) for (const y of [1.0, 1.42]) {
          const q = a2.clone().lerp(b2, f).addScaledVector(def.n, wallOff);
          out.push([q.x, y, q.z]);
        }
      }
      return out;
    });
    // door on a side the hero sees: the doorway (rolled-up leaf: what shows through the
    // opening, i.e. the inside; closed: the right leaf of the door)
    probes.doorway = doors.filter((dd) => dd.side === lit || dd.side === shade).flatMap((dd) => [0.6, 0.95, 1.3, 1.55].map((y) => {
      const q = dd.mid.clone().addScaledVector(dd.along, dd.open && !dd.half ? 0 : dd.w / 4).addScaledVector(dd.n, dd.open ? 0 : 0.02);
      return [q.x, y, q.z];
    }));
  }
  return {
    object: group,
    // standard 2nd catalogue image: front-right corner from just below eave height,
    // shallow depth of field so the far side of the frame melts into the backdrop
    // (with a right-hand wall the corner moves right so the wall does not fill half the frame)
    detail,
    view: { hero: { azimuth: heroAz }, back: { azimuth: heroAz + 180 }, detail: { samples: 60 } },
    rig: {
      default: tentRig(colorHex, Object.values(walls).some((v) => v && v !== 'none' && v !== 'open'), enclosure),
      // close-up: the floor is in the canopy shadow everywhere, so no edge fade
      detail: tentDetailRig(colorHex, doors.length > 0),
      // straight-on view: a raking key from the left splits the face at the rafter (left half
      // light, right half shaded) so both dished half-panels and both hips read; no fill and
      // the sky tipped to the left keep the shaded right hip clear of the backdrop
      // (white: a more raking key and a lower exposure keep the shaded half-panels, right hip
      // included, clearly below the backdrop, so the right silhouette never melts into it)
      front: { key: { azimuth: -50, elevation: 30, distanceRel: 2.0, aimRel: [-0.1, 0.35, 0.6], angle: 40, penumbra: 0.8, ...(lumOf(colorHex) > 0.7 ? { azimuth: -74, elevation: 28, intensity: 5.4 } : {}) }, fill: { intensity: 0 }, dome: { intensity: 1.0, tilt: 45, tiltAzimuth: -90, ...(lumOf(colorHex) > 0.7 ? { tilt: 60 } : {}) }, ...(lumOf(colorHex) > 0.7 ? { exposure: 0.8 } : {}) },
    },
    meta: { w, d, kind, legs: legPts.length, eave: He, peak, valance: drop, trussDrop: S.trussDrop, probes },
  };
}

// Studio rig for tents. Reflections come from the dark studio map with softboxes
// (js/studioEnv.js): black PVC stays black and only mirrors the overhead scrim, metal
// tubes show light/dark facet bands. The key is a softbox at a real distance (spot with
// inverse-square falloff), so every roof face gets its own value with a soft gradient.
function tentRig(colorHex, walled = false, enclosure = null) {
  const L = lumOf(colorHex);
  const white = L > 0.7, dark = L < 0.1;
  // softbox front-left (-38 deg world on the hero) at ~1.8x the product's half-diagonal: it
  // rakes across the front roof face, so the dish between rafter and hip reads as a
  // light-to-dark gradient. The beam is feathered (soft 40 deg cone on the front face): the
  // light falls off towards the left hip, the apex and the far face, so the lit side of a
  // white roof separates from the backdrop by its falloff instead of melting into it, and the
  // far face is modelled by the fill alone.
  const key0 = { azimuth: -72, elevation: 32, intensity: 4.86, cone: 10, distanceRel: 1.78, aimRel: [0.0, 0.4, 0.69], angle: 40, penumbra: 1.0 };
  // with side walls the beam is wider and aimed at the walls' half height, so the wall on the key
  // side gets the key down to its hem (it reads lighter than the wall turned away: the box corner
  // keeps its form)
  const key = walled ? { ...key0, angle: 60, aimRel: [0.0, 0.0, 0.69] } : key0;
  // Hanging walls are vertical: seen from 17 deg above they mirror the studio ~15 deg BELOW the
  // horizon, at twice their angle to the camera (camera-left wall: az ~-68, camera-right wall:
  // az ~+112). A large, very soft card there gives each wall one broad sheen gradient; black
  // cloth reads almost only through that sheen (its diffuse is 1.6 %), so with walls the card on
  // the key side is much stronger: lit wall ~40-45, wall turned away ~20 (the corner reads), and
  // drape folds, seams, hem and velcro slots show as changes in that sheen
  // The cards stand a little towards the camera from the walls' mirror direction, so each wall
  // mirrors the falling shoulder of its card: the sheen runs lighter towards the near end and
  // every drape fold (a few degrees of tilt) shifts it along that gradient into a soft light /
  // dark band
  const wallCards = walled ? [
    { az: -52, el: -15, w: 40, h: 40, I: dark ? 14 : white ? 3.4 : 7, soft: 0.5, hot: 0.3 },
    { az: 100, el: -15, w: 36, h: 36, I: dark ? 2.6 : 1.3, soft: 0.5, hot: 0.3 },
  ] : [
    { az: -62, el: -10, w: 64, h: 30, I: 3.4, soft: 0.95, hot: 0.6 },
    { az: 112, el: -10, w: 54, h: 28, I: 1.3, soft: 0.95, hot: 0.6 },
  ];
  return {
    env: 'studio', envIntensity: 1.0,
    // studio reflections (camera-relative): the default softboxes plus two large, very soft
    // cards low in front-left and front-right. Hanging walls and PVC windows mirror exactly
    // that band, so black cloth shows one broad sheen gradient per wall and every window a soft
    // reflection streak, on whichever sides the hero shows
    envStudio: { boxes: [...STUDIO_ENV_DEFAULT.boxes, ...wallCards,
      // two tall strip boxes left and right at product height: each facet of a hex leg mirrors
      // a different one (light / medium / dark facets plus thin edge glints)
      { az: -100, el: 2, w: 14, h: 64, I: 3.4, soft: 0.35, hot: 0.25 },
      { az: 136, el: 2, w: 12, h: 64, I: 1.4, soft: 0.35, hot: 0.25 }] },
    key,
    floorKey: { azimuth: -15, elevation: 80, cone: 16, intensity: 3.0 },
    keyShadow: 0.46,
    rim: { azimuth: -155, elevation: 35, intensity: 0.3 },
    // fill from behind-right: lifts the far roof face and valance without striking the
    // front face from the opposite side (that would cancel its dish gradient). Kept low (the
    // same as for white): faces turned away from the key fall to ~55 % of the lit face, so
    // dyed cloth gets its deeper shaded tone and black stays black on its far side
    fill: { azimuth: 100, elevation: 12, intensity: 3.0 },
    bounce: { intensity: 0.5 },
    // soft overhead dome, tipped towards the key so it models with it
    dome: { count: 2, intensity: 2.4, maxZenith: 62, tilt: 25, tiltAzimuth: -72 },
    exposure: white ? 0.52 : 'auto',
    interior: enclosure,
    // white cloth: a higher key aimed up the face towards the apex with a soft 38 deg beam, and an
    // exposure of 0.52 (at 0.58 the whole lit face sat in the tone curve's shoulder at ~248: a flat
    // moulded slab; a tighter 32.5 deg beam aimed lower spotlit the face and dropped its left
    // corner to ~165, a grey vignette), so the lit face peaks at ~246 high up by the rafter and
    // falls off evenly to ~230 along the eave and ~200-220 down the left hip (~190 at the very
    // corner): each dished half-panel reads, and the top-left outline reads against the backdrop
    // by its falloff, also at collection-grid size;
    // the vertical valance gets less of that key than the upward roof faces (clearly darker,
    // ~205-225), lifted a little by a low reflector card in front; the far face ~190-215
    ...(white ? {
      key: { ...key, azimuth: -70, elevation: 40, distanceRel: 2.3, aimRel: [0.28, 0.8, 0.4], angle: walled ? 50 : 38, intensity: 4.8 },
      fill: { azimuth: 100, elevation: 12, intensity: 2.2 },
      bounce: { azimuth: -20, elevation: -25, intensity: 1.5 },
      dome: { count: 2, intensity: 2.0, maxZenith: 62, tilt: 25, tiltAzimuth: -72 },
    } : {}),
    // white cloth: a late shoulder (the default filmic shoulder squashes the light-to-dark
    // gradient of the lit faces into flat paper white); the lit face peaks at ~248
    ...(white ? { toneMapping: 'neutral', shoulder: 0.88 } : {}),
    // the cloth itself limits its reflections (material envSpec), so the frame keeps the
    // same studio reflections whatever the canopy colour. Exposure: one fixed exposure (0.72)
    // for every dark and mid colour, so a swatch's value is the cloth's own value (zwart,
    // antraciet and grijs are three different products); only light colours (geel, lichtgrijs,
    // beige ...) are pulled down a little so they keep their lit-face gradient
    exposureAuto: { ref: 0.2, base: 0.64, power: 0.22, min: 0.45, max: 0.72 },
    // floor: the canopy footprint is a firm soft shadow; enclosed floor (inside walls)
    // keeps getting darker after the soft knee
    groundSplit: true,
    shadowFloor: 0.6,
    groundAO: { strength: walled ? 0.5 : 0.32, maxZenith: 75 },
    // tight contact line under plates and hems + a wide soft halo (plates, weights, and
    // the contact proxies along wall hems)
    contact: { res: 2048, h0: 0.03, strength: 1.0, blur: 2.6, wide: { h0: 0.05, sigma: 0.028, strength: 0.42 } },
    // black cloth gets NO extra light or exposure: it renders at its real value (lit roof ~40,
    // turned away ~20 sRGB) and takes its form from the coating's sheen of the overhead scrim
  };
}

// Close-up rig: directional key (a near softbox has no visible falloff over 1 m). On a
// wall detail (door) the key rakes across the cloth from the side so zip, storm flap,
// outline tape and folds model; black cloth gets a little more exposure.
function tentDetailRig(colorHex, wallDetail) {
  const L = lumOf(colorHex), black = L < 0.06;
  // a near softbox has no visible falloff over a 1 m close-up: directional key; a lighter
  // back fill than the hero, so the far roof face keeps the key's dish gradient up close
  const r = { edgeFade: 0, key: { distanceRel: 0, distance: 0 }, fill: { intensity: 3.5 } };
  // white: the close-up keeps its own exposure (the hero's lower 0.52 is for the raked softbox)
  if (L > 0.7) r.exposure = 0.58;
  if (wallDetail) {
    r.key = { distanceRel: 0, distance: 0, azimuth: -88, elevation: 14, cone: 6 };
    r.fill = { azimuth: 60, elevation: 6, intensity: black ? 1.2 : 1.0 };
    // black: a touch more exposure than the hero (0.72); the wall mirrors the centre of the hero's
    // wall card here, so 0.75 keeps it at ~55 (more read as grey cloth, not black)
    if (black) r.exposure = 0.75;
  }
  return r;
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

// Moulded (nylon) or cast (aluminium) square block around a leg: crisp small-radius edges,
// 45-degree chamfers at both ends, two stiffening ribs on each outward face, optional
// embossed mark plaque on the outermost face, hex bolts on the cast version.
function mouldedBlock(bins, mat, markMat, { x, z, w, y0, y1, out, ribs = true, mark = null, pro = false, chrome }) {
  // mark: null or a direction (the mark goes on the outward face that looks most that way)
  const ch = Math.min(0.008, (y1 - y0) * 0.12), r = pro ? 0.0045 : 0.0032;
  const P = (wd) => G.roundedRectProfile(wd, wd, r, 2);
  const X = V3(1, 0, 0);
  bins.add(mat, G.prism(P(w), V3(x, y0 + ch, z), V3(x, y1 - ch, z), { side: X, caps: false }));
  bins.add(mat, taperPrism(P(w - 2 * ch * 0.8), P(w), V3(x, y0, z), V3(x, y0 + ch, z), X));
  bins.add(mat, taperPrism(P(w), P(w - 2 * ch * 0.8), V3(x, y1 - ch, z), V3(x, y1, z), X));
  if (!ribs) return;
  const faces = [V3(1, 0, 0), V3(-1, 0, 0), V3(0, 0, 1), V3(0, 0, -1)].filter((f) => f.dot(out) > 0.2);
  const rw = pro ? 0.0065 : 0.005, rd = pro ? 0.0042 : 0.0035;
  for (const f of faces) {
    const lat = V3(f.z, 0, -f.x);
    for (const sg of [-1, 1]) {
      const c = V3(x, 0, z).addScaledVector(f, w / 2 + rd / 2 - 0.0004).addScaledVector(lat, sg * w * 0.3);
      const rib = G.roundedBox(rw, (y1 - y0) - 2 * ch - 0.01, rd, Math.min(rw, rd) * 0.35, 2);
      rib.applyMatrix4(new THREE.Matrix4().makeBasis(lat, V3(0, 1, 0), f).setPosition(c.setY((y0 + y1) / 2)));
      bins.add(mat, rib);
    }
    if (pro) {
      // two hex bolts through the cast bracket
      for (const yy of [y0 + (y1 - y0) * 0.3, y0 + (y1 - y0) * 0.72]) {
        const bc = V3(x, yy, z).addScaledVector(f, w / 2 + 0.0004);
        const hx = G.prism(G.roundedPolygonProfile(6, 0.011, 0.0008, 1, 0), bc, bc.clone().addScaledVector(f, 0.0045), { side: lat });
        bins.add(chrome, hx);
      }
    }
  }
  if (mark && markMat) {
    // raised plaque between the ribs, upper part of the block
    const f = faces.slice().sort((a, b) => b.dot(mark) - a.dot(mark))[0];
    const lat = V3(f.z, 0, -f.x);
    const pw = w * 0.5, ph = pw * 0.34;
    const pl = new THREE.BoxGeometry(pw, ph, 0.0011);
    pl.applyMatrix4(new THREE.Matrix4().makeBasis(lat, V3(0, 1, 0), f).setPosition(V3(x, y1 - (y1 - y0) * 0.28, z).addScaledVector(f, w / 2 + 0.0005)));
    const m = new THREE.Mesh(pl, markMat); m.castShadow = false; m.receiveShadow = true;
    bins.extra = bins.extra || []; bins.extra.push(m);
  }
}

// Raised '10 KG' plaque moulded into the rim of a weight plate: a thin curved patch in the plate's
// rubber whose normal map carries the raised letters, the letter faces filled with light grey
// paint, so the weight reads at catalogue size. uv 0..1 over the patch.
let rimLabelCache = null;
function weightRimLabelMat(rubber) {
  if (rimLabelCache) return rimLabelCache;
  const w = 1024, h = 260;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  // base texel #303030 (0.0296 linear) x colour = the rubber; the letters carry a light grey
  // paint fill (albedo ~0.45) so '10 KG' reads at catalogue size
  g.fillStyle = '#303030'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#E1E1E1'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${Math.round(h * 0.72)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  if ('letterSpacing' in g) g.letterSpacing = `${Math.round(h * 0.04)}px`;
  g.fillText('10 KG', w / 2, h * 0.53);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const m = rubber.clone();
  m.color = rubber.color.clone().multiplyScalar(1 / 0.0296);
  m.map = map;
  m.normalMap = TX.embossNormal({ text: '10 KG', sub: '', w, h, strength: 3.2, fontScale: 0.72, border: false }); m.normalScale = new THREE.Vector2(1, 1);
  m.userData = {}; m.name = 'weight rim label';
  rimLabelCache = m;
  return m;
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
  // two grip holes either side of the slot (on the same side as the slot)
  for (const sg of [-1, 1]) {
    const c = 0.5 * Math.PI * 0.62 * sg, rc = R - 0.035, gr = 0.012, gl = 0.022;
    const cx = Math.cos(c) * rc, cy = Math.sin(c) * rc, tx = -Math.sin(c), ty = Math.cos(c);
    const grip = new THREE.Path();
    grip.moveTo(cx - tx * gl / 2 + Math.cos(c) * gr, cy - ty * gl / 2 + Math.sin(c) * gr);
    grip.absarc(cx - tx * gl / 2, cy - ty * gl / 2, gr, c, c + Math.PI, true);
    grip.absarc(cx + tx * gl / 2, cy + ty * gl / 2, gr, c + Math.PI, c + TAU, true);
    sh.holes.push(grip);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: h - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 72 });
  g.translate(0, 0, bevel);
  g.rotateX(-Math.PI / 2); // extrusion axis -> +Y, shape y -> -Z
  // uv in metres (shape uvs already are metres on the caps; sides get the same scale)
  return g;
}

// ---- side wall panel -----------------------------------------------------------------------
// Layouts are centred per panel (between two legs):
//   closed | window (1 rectangular PVC window) | windows / church (2 arched windows with
//   cross bars) | door (centred vertical zip, roll-up straps) | door-open (rolled up) |
//   panorama (wide window) | rolled (whole wall rolled up under the valance)
// one-colour SVG artwork (brandPrints) centred on a transparent canvas of the print zone's aspect
const artTexCache = new Map();
function artTexture(art, color, cw, ch, fill) {
  const key = `${art.d.length}:${art.d.slice(0, 24)}:${color}:${cw}:${ch}:${fill}`;
  if (artTexCache.has(key)) return artTexCache.get(key);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'); g.clearRect(0, 0, cw, ch);
  const s = Math.min((ch * fill) / art.vb[1], (cw * 0.86) / art.vb[0]);
  g.translate((cw - art.vb[0] * s) / 2, (ch - art.vb[1] * s) / 2); g.scale(s, s);
  g.fillStyle = color; g.fill(new Path2D(art.d));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  artTexCache.set(key, t);
  return t;
}

function buildWall({ group, bins, fabric, thread, a, b, n, top, type, seed, print = null, doorState = 'half' }) {
  stitchAO = thread.userData.threadAO ?? 1;
  const along = b.clone().sub(a); const L = along.length(); along.normalize();
  const Hh = top; // the panel's (s, y) frame starts at the ground: y is the real height
  const stitches = [];
  const nz = makeNoise2(100 + seed);
  if (type === 'window2' || type === 'church' || type === 'churchwindows') type = 'windows';
  if (type === 'rolled') { buildRolledWall({ bins, fabric, a, along, n, L, top }); return; }

  // ---- hang of the cloth ----------------------------------------------------------------
  // hem: the panel is a few cm too long, so between the legs the hem rests on the ground and
  // kinks outward irregularly; near the legs (velcro straps) it is lifted ~4 cm
  const edgeLift = (s) => 0.022 * (1 - sstep(0.0, 0.26, Math.min(s, L - s)));
  const bottomAt = (s) => {
    const irr = Math.max(0, nz.noise(s * 2.7 + 3.1, 0.37) + 0.15) * 0.011 + Math.max(0, nz.noise(s * 7.3 - 2, 5.1)) * 0.004;
    return 0.0015 + edgeLift(s) + irr * (1 - sstep(0.0, 0.03, edgeLift(s)));
  };
  const restAt = (s) => 1 - clamp01((bottomAt(s) - 0.0015) / 0.01);
  const tabSp = L / Math.max(1, Math.round(L / 0.3)); // velcro tabs along the top edge
  const disp = (s, y) => {
    const u = s / L, v = clamp01(y / Hh);
    const pinS = Math.pow(Math.max(0, Math.sin(Math.PI * clamp01(u))), 0.5);
    // the panel hangs in a soft belly between the two legs
    const belly = 0.03 * Math.sin(Math.PI * clamp01(u)) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, v * 0.95 + 0.04))), 0.7);
    // broad vertical drape folds, irregular in spacing and depth (value noise, not sines),
    // freer and slightly fanning out towards the hem
    const sd = s + 0.06 * (1 - v) * nz.noise(s * 0.9 + 4, 2.2);
    // (deep enough that the hero's wall sheen breaks into soft light/dark drape bands at 2000 px:
    // ~5-8 deg slopes; still broad, 15-50 cm apart, no fine vertical streaks)
    const folds = 0.026 * pinS * (0.4 + 0.6 * Math.pow(1 - v, 1.1)) * (0.6 + 0.4 * nz.noise(sd * 0.7 + 9, 6.6))
      * (nz.noise(sd * 1.9 + seed, 0.3 + v * 0.35) * 0.6 + nz.noise(sd * 3.6 - seed, 1.7 + v * 0.6) * 0.3 + nz.noise(sd * 6.1 + 2 * seed, 2.9 + v * 0.8) * 0.1);
    // each top tab pulls a narrow vertical fold that runs ~0.8 m down; the cloth between
    // the tabs sags into a shallow scallop
    const ph = s / tabSp - Math.round(s / tabSp);
    const tabFold = 0.007 * pinS * Math.exp(-(((ph * tabSp) / 0.045) ** 2)) * Math.exp(-(top - y) / 0.6);
    const vfold = -0.002 * pinS * Math.cos(TAU * ph) * Math.exp(-(top - y) / 0.25);
    const scallop = 0.006 * Math.abs(Math.sin(Math.PI * s / tabSp)) * sstep(0.88, 1.0, v) + tabFold + vfold;
    let diag = 0;
    for (const [s0, sg] of [[0, 1], [L, -1]]) {
      const ds = (s - s0) * sg, dy = top - y;
      if (ds < 0) continue;
      const rho = Math.hypot(ds, dy);
      diag += 0.002 * Math.sin(((ds - dy) / 0.11) * Math.PI) * Math.exp(-rho / 0.28) * (1 - Math.exp(-rho / 0.05));
    }
    // where the hem rests on the ground the last few cm kink outward
    const yb = bottomAt(s), kz = 0.075;
    const kink = y < yb + kz ? 0.018 * restAt(s) * (0.55 + 0.45 * nz.noise(s * 5.1, 9.3)) * Math.pow(1 - (y - yb) / kz, 2) : 0;
    let d = belly + folds + scallop + diag + kink;
    // behind the valance the panel hangs close to the roof edge: outward displacement is
    // capped (softly) so drape folds never push through the skirt
    const kTop = sstep(top - 0.5, top - 0.24, y);
    if (kTop > 0) { const x = d - 0.004; d -= kTop * 0.5 * (x + Math.sqrt(x * x + 1.6e-5)); }
    return d;
  };
  const point = (s, y, off = 0) => a.clone().addScaledVector(along, s).addScaledVector(n, disp(s, y) + off).setY(y);
  const flip = n.dot(V3().crossVectors(along, V3(0, 1, 0))) < 0;
  // local frame on the cloth (tangent s, tangent y, normal) for small hardware
  const frameAt = (s, y, off) => {
    const e = 0.004;
    const ts = point(s + e, y).sub(point(s - e, y)).normalize();
    const ty = point(s, y + e).sub(point(s, y - e)).normalize();
    const nn = V3().crossVectors(ts, ty).normalize(); if (nn.dot(n) < 0) nn.negate();
    const ty2 = V3().crossVectors(nn, ts).normalize();
    return new THREE.Matrix4().makeBasis(ts, ty2, nn).setPosition(point(s, y, off));
  };
  // uv in metres: x along the panel, y = height above the ground (window/door masks use it)
  const metricUV = (geo, sOf) => {
    const P = geo.attributes.position, U = geo.attributes.uv;
    for (let i = 0; i < P.count; i++) U.setXY(i, sOf(i), P.getY(i));
    U.needsUpdate = true; return geo;
  };
  // optional one-colour print (wallPrint {svg|name, color, width}) centred on the panel, following its drape
  const art = print ? resolvePrint(print) : null;
  if (art && type !== 'rolled') {
    let wP = Math.min(L * 0.78, Number(print.width ?? L * 0.7)), hP = wP * art.vb[1] / art.vb[0];
    if (hP > top * 0.42) { wP *= (top * 0.42) / hP; hP = top * 0.42; }
    const yc = Number(print.y ?? Math.min(top * 0.56, top - 0.45 - hP / 2));
    const ink = M.resolveColor(print.color, '#1D1E20');
    const tex = artTexture(art, ink, 1024, Math.max(16, Math.round(1024 * hP / wP)), 0.98);
    const s0 = (L - wP) / 2;
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.55, side: THREE.DoubleSide, name: 'wall print' });
    // outside face; with print.both also the inside face (mirrored in s so it reads from inside)
    for (const sg of print.both ? [1, -1] : [1]) {
      const geo = G.surface((u, v, o) => o.copy(point(s0 + (sg > 0 ? u : 1 - u) * wP, yc - hP / 2 + v * hP, 0.0022 * sg)), 64, 24);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.receiveShadow = true;
      group.add(m);
    }
  }

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
  const doorW = Math.min(1.05, L * 0.4), doorTop = Math.min(1.8, top - 0.27); // door head clear of the valance
  // door 'half' (default): the right leaf is unzipped (centre zip + a zip along the right edge of
  // the doorway), rolled up to the door head and strapped; the left leaf stays closed with its
  // zip, storm flap and hanging strap. From the hero camera the door reads as a door (a dark
  // opening with a roll of cloth above it), and the closed leaf still shows how it closes
  const doorHalf = type === 'door' && doorState === 'half';
  const dHalf = { s0: mid + 0.004, s1: mid + doorW / 2 - 0.026, rollY: doorTop - 0.04, r: 0.041 };
  // bottom hem and its stitching run only where there is cloth down to the ground
  const hemSpans = doorHalf ? [[0, dHalf.s0], [dHalf.s1, L]] : doorOpen ? [[0, mid - doorW / 2], [mid + doorW / 2, L]] : [[0, L]];

  // mask: white = fabric (canvas covers y = top .. 0)
  let mat = fabric, mask = null;
  const needsMask = openings.length > 0 || doorOpen || doorHalf;
  const key = `${type}${doorHalf ? '-half' : ''}:${L.toFixed(3)}:${Hh.toFixed(3)}`;
  if (needsMask) {
    const Wp = 2048, Hp = Math.round(2048 * Hh / L);
    mask = TX.maskTexture(`wall3:${key}`, Wp, Hp, (g) => {
      const px = Wp / L, Y = (y) => (top - y) * px;
      g.fillStyle = '#fff'; g.fillRect(0, 0, Wp, Hp);
      g.fillStyle = '#000';
      for (const o of openings) { g.beginPath(); outlinePath(o).forEach(([s, y], i) => (i ? g.lineTo(s * px, Y(y)) : g.moveTo(s * px, Y(y)))); g.closePath(); g.fill(); }
      if (doorOpen) g.fillRect((mid - doorW / 2) * px, Y(doorTop), doorW * px, Hp);
      if (doorHalf) g.fillRect(dHalf.s0 * px, Y(dHalf.rollY + 0.004), (dHalf.s1 - dHalf.s0) * px, Hp);
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
  const nu = Math.ceil(L / 0.015), nv = Math.ceil(Hh / 0.025);
  const yAt = (u, v) => { const yb = bottomAt(u * L) + 0.05; return yb + (top - yb) * v; };
  const geo = G.surface((u, v, o) => o.copy(point(u * L, yAt(u, v), 0)), nu, nv, { flipNormals: flip });
  metricUV(geo, (i) => (i % (nu + 1)) / nu * L);
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  if (needsMask) group.add(m); else bins.add(fabric, geo);

  // bottom hem (5 cm, folded) with stitching; vertical edge bands
  for (const [h0, h1] of hemSpans) {
    const nuh = Math.max(2, Math.ceil((h1 - h0) / 0.015));
    const hem = G.surface((u, v, o) => { const sh = h0 + (h1 - h0) * u; const pr = hemProfile(v, bottomAt(sh), 0.05, 0.0012); o.copy(point(sh, pr[1], pr[0])); }, nuh, 14);
    metricUV(hem, (i) => h0 + (i % (nuh + 1)) / nuh * (h1 - h0));
    hem.computeVertexNormals();
    // the outer layer must face outwards (an inward normal biases its shadow lookup behind the
    // wall and paints a dark band along the hem)
    { const nn = V3().fromBufferAttribute(hem.attributes.normal, 1 * (nuh + 1) + Math.floor(nuh / 2)); if (nn.dot(n) < 0) flipGeo(hem); }
    bins.add(fabric, hem);
  }
  const sline = (pts) => stitches.push(stitchGeo(pts.map(([s, y, off]) => ({ p: point(s, y, off), n }))));
  const hlineF = (yf, off, s0 = 0.01, s1 = L - 0.01) => { const pts = []; const k = Math.ceil((s1 - s0) / 0.008); for (let i = 0; i <= k; i++) { const s = s0 + (s1 - s0) * i / k; pts.push([s, yf(s), off]); } sline(pts); };
  const hline = (y, off, s0, s1) => hlineF(() => y, off, s0, s1);
  const vline = (s, y0, y1, off) => { const pts = []; const k = Math.ceil((y1 - y0) / 0.008); for (let i = 0; i <= k; i++) pts.push([s, y0 + (y1 - y0) * i / k, off]); sline(pts); };
  for (const [h0, h1] of hemSpans) hlineF((s) => bottomAt(s) + 0.04, 0.0012, Math.max(0.01, h0 + 0.006), Math.min(L - 0.01, h1 - 0.006));
  for (const [s0, s1] of [[0, 0.045], [L - 0.045, L]]) {
    const yb = Math.max(bottomAt(s0), bottomAt(s1)) + 0.05;
    const band = G.surface((u, v, o) => { const s = s0 + (s1 - s0) * u; const k = Math.abs(2 * u - 1); o.copy(point(s, yb + v * (top - yb - 0.01), 0.0011 * (1 - Math.pow(k, 8)))); }, 4, nv, { flipNormals: flip });
    metricUV(band, (i) => s0 + (s1 - s0) * (i % 5) / 4);
    bins.add(fabric, band);
    vline((s0 + s1) / 2 + (s0 === 0 ? 0.012 : -0.012), yb + 0.005, top - 0.02, 0.0011);
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
    const pvc = cloneWithMask(windowFoil(), mask, key, true);
    const yW = openings.reduce((acc, o) => acc + (o.y0 + o.y1) / 2, 0) / openings.length;
    pvc.userData.sheet = { L, H: Hh, c: [mid, yW], strength: 0.16 };
    const g2 = G.surface((u, v, o) => o.copy(point(u * L, yAt(u, v), -0.0025)), nu, nv, { flipNormals: flip });
    metricUV(g2, (i) => (i % (nu + 1)) / nu * L);
    const pm = new THREE.Mesh(g2, pvc); pm.castShadow = false; pm.receiveShadow = true;
    group.add(pm);
  }

  // ---- door hardware ---------------------------------------------------------------------
  const tapeMat = M.webbing('#1D1E20');
  const strapMat = M.webbing('#141516');
  const toothMat = M.zipTooth();
  // acetal buckle: satin-gloss so its edges, ribs and release tabs catch the raking light
  const buckleMat = (() => { const m = M.mouldedNylon('#1b1b1c').clone(); m.roughness = 0.32; m.specularIntensity = 0.9; m.clearcoat = 0.35; m.clearcoatRoughness = 0.3; m.name = 'buckle acetal'; return m; })();
  const sliderMat = M.castAluminium('#4E5357');
  // flat sewn tape of cloth (door outline / reinforcement) lying on the wall: a flat top at
  // the tape thickness `lift`, its edges stepping down over ~1 mm (no pillow, no padding)
  const band = (s0, s1, y0, y1, lift = 0.0007, mat2 = fabric) => {
    const W = Math.abs(s1 - s0), Hb = Math.abs(y1 - y0);
    const across = (n, Ls) => { const e = Math.min(0.0012, Ls / 4); const out = [0, e * 0.35, e, e * 1.8]; const m = Math.max(2, Math.ceil((Ls - 3.6 * e) / 0.01)); for (let i = 1; i < m; i++) out.push(e * 1.8 + (Ls - 3.6 * e) * i / m); out.push(Ls - e * 1.8, Ls - e, Ls - e * 0.35, Ls); return out; };
    const us = across(0, W), vs = across(0, Hb);
    const hAt = (d) => lift * sstep(0, 0.0011, d);
    const g = G.surface((u, v, o) => {
      const a = us[Math.round(u * (us.length - 1))], b2 = vs[Math.round(v * (vs.length - 1))];
      const dEdge = Math.min(a, W - a, b2, Hb - b2);
      o.copy(point(Math.min(s0, s1) + a, Math.min(y0, y1) + b2, hAt(dEdge) + 0.0003));
    }, us.length - 1, vs.length - 1, { flipNormals: flip });
    metricUV(g, (i) => Math.min(s0, s1) + us[i % us.length]);
    bins.add(mat2, g);
  };
  // woven webbing with real thickness: flat top, rounded selvedges, along a vertical run
  // (s fixed, y0 -> y1) lying `lift` off the cloth, with edge stitching on its top face
  const webbingRun = (s, y0, y1, w, t, lift, { mat: wm = strapMat, stitch = true, bulge = 0 } = {}) => {
    const prof = [];
    for (let i = 0; i <= 4; i++) { const a2 = Math.PI - (i / 4) * Math.PI / 2; prof.push([-w / 2 + t / 2 + Math.cos(a2) * t / 2, t / 2 + Math.sin(a2) * t / 2]); }
    for (let i = 0; i <= 4; i++) { const a2 = Math.PI / 2 - (i / 4) * Math.PI / 2; prof.push([w / 2 - t / 2 + Math.cos(a2) * t / 2, t / 2 + Math.sin(a2) * t / 2]); }
    const len = Math.abs(y1 - y0), nuw = Math.max(2, Math.ceil(len / 0.01));
    const lifted = (u) => lift + bulge * Math.sin(Math.PI * u);
    const g = G.surface((u, v, o) => {
      const j = Math.min(prof.length - 1, Math.round(v * (prof.length - 1)));
      o.copy(point(s + prof[j][0], y0 + (y1 - y0) * u, lifted(u) + prof[j][1]));
    }, nuw, prof.length - 1);
    // uv: along the strap / across the strap, metres
    const U = g.attributes.uv; for (let i = 0; i < U.count; i++) { const iu = i % (nuw + 1), iv = Math.floor(i / (nuw + 1)); U.setXY(i, iv / (prof.length - 1) * (w + t), iu / nuw * len); }
    g.computeVertexNormals();
    orientTo(g, n);
    bins.add(wm, g);
    if (stitch) for (const sg of [-1, 1]) {
      const pts = []; const k = Math.ceil(len / 0.006);
      for (let i = 0; i <= k; i++) { const u = i / k; pts.push([s + sg * (w / 2 - 0.0028), y0 + (y1 - y0) * u, lifted(u) + t]); }
      sline(pts);
    }
  };
  // side-release buckle (25 mm webbing), joint at height yB: female below, male above
  const buckle = (s, yB, lift) => {
    const F = frameAt(s, yB, lift);
    const put = (g2) => { g2.applyMatrix4(F); bins.add(buckleMat, g2); };
    const box = (w, h, d, x, y, z, r = 0.0018) => { const g2 = G.roundedBox(w, h, d, r, 2); g2.translate(x, y, z + d / 2); return g2; };
    // female housing with a raised centre rib and a strap bar at its foot
    put(taperBox(0.035, 0.031, 0.0092, 0.0084, 0.0, -0.016, 0));
    put(box(0.007, 0.022, 0.0012, 0, -0.016, 0.0088, 0.0005));
    put(box(0.031, 0.0045, 0.006, 0, -0.0355, 0.0006, 0.0015));
    // the male prongs' release tabs, pressed out through windows on both sides
    for (const sg of [-1, 1]) {
      put(box(0.0042, 0.012, 0.0062, sg * 0.0185, -0.0075, 0.0012, 0.0012));
      for (let r = 0; r < 3; r++) put(box(0.0012, 0.009, 0.0008, sg * (0.0186 + 0.0012), -0.0075 + (r - 1) * 0.0001, 0.0062 + 0.0006 * r, 0.0003));
    }
    // male: tapered tongue plate with a slot for the upper strap and a top bar
    put(taperBox(0.031, 0.027, 0.0068, 0.0064, 0.0, 0.0065, 0.0004, 0.013));
    put(box(0.029, 0.0042, 0.0068, 0, 0.0228, 0.0004, 0.0016));
    for (const sg of [-1, 1]) put(box(0.0035, 0.008, 0.0068, sg * 0.0127, 0.0166, 0.0004, 0.0012));
  };
  // a tapered rounded block (width w0 at the bottom -> w1 at the top), height h, depth d
  function taperBox(w0, w1, d0, d1, x, y, z, h = 0.03) {
    const g2 = G.roundedBox(w0, h, 1, Math.min(0.0032, h * 0.3), 3);
    const P = g2.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const ty = (P.getY(i) + h / 2) / h, w = w0 + (w1 - w0) * ty, d = d0 + (d1 - d0) * ty;
      P.setXYZ(i, P.getX(i) * (w / w0) + x, P.getY(i) + y, (P.getZ(i) + 0.5) * d + z);
    }
    g2.computeVertexNormals(); return g2;
  }
  // #8 moulded-tooth zip: two woven tapes, interlocking teeth down the middle
  const zip = (s, y0, y1, off = 0.0014, zsides = [-1, 1]) => {
    for (const sg of zsides) webbingRun(s + sg * 0.0085, y0, y1, 0.0145, 0.0008, off, { mat: tapeMat, stitch: false });
    const pitch = 0.0034, count = Math.floor((y1 - y0 - 0.004) / pitch);
    for (let k = 0; k < count; k++) for (const sg of zsides) {
      const yy = y0 + 0.002 + (k + (sg > 0 ? 0.5 : 0)) * pitch;
      const tooth = G.roundedBox(0.0058, 0.0024, 0.0026, 0.0008, 1);
      tooth.translate(sg * 0.0011, 0, 0.0013);
      tooth.applyMatrix4(frameAt(s, yy, off + 0.0008));
      bins.add(toothMat, tooth);
    }
    for (const sg of zsides) vline(s + sg * 0.019, y0 + 0.01, y1, 0.001);
  };
  const slider = (s, yS, off) => {
    const F = frameAt(s, yS, off);
    const put = (g2, mtl = sliderMat) => { g2.applyMatrix4(F); bins.add(mtl, g2); };
    // body: wedge, wide where the two rows enter (top), narrow at the closed chain
    put(taperBox(0.0125, 0.0175, 0.0075, 0.0068, 0, 0, 0.0008, 0.026));
    // bridge and the puller hanging from it, tipped a little off the cloth
    put(G.roundedBox(0.006, 0.014, 0.004, 0.0015, 2).translate(0, 0.002, 0.0092));
    const tab = new THREE.Shape();
    tab.moveTo(-0.0055, 0); tab.lineTo(0.0055, 0); tab.lineTo(0.0068, -0.03); tab.absarc(0, -0.03, 0.0068, 0, -Math.PI, true); tab.lineTo(-0.0055, 0);
    const hole = new THREE.Path(); hole.absellipse(0, -0.031, 0.0032, 0.0042, 0, TAU, false); tab.holes.push(hole);
    const tg = new THREE.ExtrudeGeometry(tab, { depth: 0.0016, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 2, curveSegments: 18 });
    tg.rotateX(-0.08); tg.translate(0, -0.002, 0.0098);
    put(tg);
    // pull cord loop through the tab
    const cord = []; for (let i = 0; i <= 24; i++) { const a2 = (i / 24) * TAU; cord.push(V3(Math.sin(a2) * 0.005, -0.031 - 0.022 * (1 - Math.cos(a2)) / 2, 0.0112 + 0.0025 * (1 - Math.cos(a2)) / 2)); }
    put(sweepTube(cord, 0.0016, 8, true), strapMat);
  };
  // the released door leaf rolled up (outside) to the door head: a slightly irregular, a little
  // flattened roll of cloth whose ends show the spiral of the rolled layers, held by the leaf's
  // own strap, which runs down from its box stitch, loops round the roll and closes with the buckle
  function rolledLeaf(sStrap, yTop) {
    const { s0, s1, rollY, r } = dHalf, len = s1 - s0, off = r + 0.003;
    const rr = rng(311 + seed);
    const wob = [rr() * TAU, rr() * TAU];
    const radAt = (u, th) => r * (1 + 0.05 * Math.sin(th * 2 + wob[0]) + 0.035 * Math.sin(u * Math.PI * 3 + wob[1])) * (1 - 0.06 * Math.sin(Math.PI * u));
    const ctr = (sx) => point(sx, rollY, off).addScaledVector(n, 0);
    const up = V3(0, 1, 0);
    const body = G.surface((v, u, o) => {
      const sx = s0 + 0.006 + (len - 0.012) * u, th = v * TAU, R = radAt(u, th);
      // sag: the roll hangs a little lower between strap and ends (soft cloth)
      const sag = 0.004 * Math.sin(Math.PI * u);
      o.copy(ctr(sx)).addScaledVector(n, Math.cos(th) * R).addScaledVector(up, Math.sin(th) * R * 0.9 - sag);
    }, 40, Math.ceil(len / 0.012), { closedU: true });
    // the surface winds so its normals face outwards
    { const N = body.attributes.normal, P = body.attributes.position; const c0 = ctr(s0 + len / 2); let dd = 0; for (let i = 0; i < N.count; i += 7) dd += (P.getX(i) - c0.x) * N.getX(i) + (P.getY(i) - c0.y) * N.getY(i) + (P.getZ(i) - c0.z) * N.getZ(i); if (dd < 0) flipGeo(body); }
    metricUV(body, (i) => (i % 41) / 40 * TAU * r);
    bins.add(fabric, body);
    // ends: a recessed disc and the spiral edge of the rolled layers
    for (const [sx, sgn] of [[s0 + 0.006, -1], [s1 - 0.006, 1]]) {
      const c = ctr(sx);
      const disc = new THREE.CircleGeometry(r * 0.96, 32);
      disc.applyMatrix4(new THREE.Matrix4().makeBasis(n.clone(), V3(0, 0.9, 0), along.clone().multiplyScalar(sgn)).setPosition(c.clone().addScaledVector(along, -sgn * 0.003)));
      orientTo(disc, along.clone().multiplyScalar(sgn));
      bins.add(fabric, disc);
      const sp = [];
      for (let i = 0; i <= 160; i++) { const t = i / 160, th = t * 4.2 * TAU, R = (0.007 + (r * 0.93 - 0.007) * t); sp.push(c.clone().addScaledVector(along, -sgn * 0.0005).addScaledVector(n, Math.cos(th) * R).addScaledVector(up, Math.sin(th) * R * 0.9)); }
      bins.add(fabric, sweepTube(sp, 0.0011, 6));
    }
    // strap: box-stitched on below the valance, down the wall to the roll, a loop round it
    webbingRun(sStrap, rollY + r * 0.6, yTop, 0.025, 0.0016, 0.0016, { bulge: 0.0008 });
    const bx = [[sStrap - 0.009, yTop - 0.006], [sStrap + 0.009, yTop - 0.006], [sStrap + 0.009, yTop - 0.034], [sStrap - 0.009, yTop - 0.034], [sStrap - 0.009, yTop - 0.006], [sStrap + 0.009, yTop - 0.034]];
    const pts = []; for (let i = 0; i < bx.length - 1; i++) for (let k = 0; k < 6; k++) { const t = k / 6; pts.push([bx[i][0] + (bx[i + 1][0] - bx[i][0]) * t, bx[i][1] + (bx[i + 1][1] - bx[i][1]) * t, 0.0034]); }
    sline(pts);
    const uS = (sStrap - s0 - 0.006) / (len - 0.012);
    const loop = G.surface((v, w2, o) => {
      const th = -Math.PI / 2 - 0.25 + v * (TAU - 0.1), R = radAt(uS, th) + 0.0022;
      o.copy(ctr(sStrap + (w2 - 0.5) * 0.025)).addScaledVector(n, Math.cos(th) * R).addScaledVector(up, Math.sin(th) * R * 0.9 - 0.004 * Math.sin(Math.PI * uS));
    }, 48, 2);
    { const N = loop.attributes.normal, P = loop.attributes.position; const c0 = ctr(sStrap); let dd = 0; for (let i = 0; i < N.count; i++) dd += (P.getX(i) - c0.x) * N.getX(i) + (P.getY(i) - c0.y) * N.getY(i) + (P.getZ(i) - c0.z) * N.getZ(i); if (dd < 0) flipGeo(loop); }
    const U = loop.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, (i % 49) / 48 * TAU * r, Math.floor(i / 49) / 2 * 0.025);
    bins.add(strapMat, loop);
    // buckle on the front of the roll
    buckle(sStrap, rollY - 0.004, off + r * 0.93 + 0.0025);
  }
  if (type === 'door') {
    // door outline: a sewn reinforcement band (3 cm, double stitched) round the doorway
    const dl = mid - doorW / 2, dr = mid + doorW / 2, bw2 = 0.02, y0d = bottomAt(mid) + 0.055;
    band(dl - bw2, dl + bw2, y0d, doorTop - bw2, 0.0007); band(dr - bw2, dr + bw2, y0d, doorTop - bw2, 0.0007);
    band(dl - bw2, dr + bw2, doorTop - bw2, doorTop + bw2, 0.0007);
    for (const x of [dl, dr]) { vline(x - 0.014, y0d + 0.005, doorTop + (x === dl ? 0.014 : 0.014), 0.001); vline(x + 0.014, y0d + 0.005, doorTop - 0.014, 0.001); }
    hline(doorTop + 0.014, 0.001, dl - 0.014, dr + 0.014); hline(doorTop - 0.014, 0.001, dl + 0.014, dr - 0.014);
    zip(mid, y0d - 0.04, doorTop, 0.0014, doorHalf ? [-1] : [-1, 1]);
    // the right edge of the doorway carries the second zip of the released leaf (wall side only)
    if (doorHalf) zip(dHalf.s1, y0d - 0.04, doorTop - 0.02, 0.0014, [1]);
    // storm flap: a flat 5 cm band of cloth sewn on the left of the zip; it lies almost flat,
    // its free edge (a 2 mm folded hem) stands only ~3 mm off the zip tape, throwing a fine
    // shadow line onto the teeth
    {
      const f0 = mid - 0.064, f1 = mid - 0.013, y0f = y0d + 0.005, y1f = doorTop - 0.016;
      const so = (u) => 0.0009 + 0.0026 * u * u;
      const nfu = 12, nfv = Math.ceil((y1f - y0f) / 0.02);
      const fg = G.surface((u, v, o) => o.copy(point(f0 + (f1 - f0) * u, y0f + (y1f - y0f) * v, so(u))), nfu, nfv, { flipNormals: flip });
      metricUV(fg, (i) => f0 + (f1 - f0) * (i % (nfu + 1)) / nfu);
      bins.add(fabric, fg);
      // folded free edge: the hem's 2 mm rounded edge, from the flap down towards the zip tape
      const rim = []; for (let i = 0; i <= nfv; i++) { const v = i / nfv; rim.push(point(f1 - 0.0004, y0f + (y1f - y0f) * v, so(1) - 0.001)); }
      bins.add(fabric, sweepTube(rim, 0.001, 8));
      vline(f0 + 0.006, y0f + 0.01, y1f - 0.01, so(0.12));
      const sp = []; const k = Math.ceil((y1f - y0f) / 0.006);
      for (let i = 0; i <= k; i++) { const v = i / k; sp.push([f1 - 0.007, y0f + 0.01 + (y1f - y0f - 0.02) * v, so(1 - 0.007 / (f1 - f0))]); }
      sline(sp);
    }
    slider(doorHalf ? mid - 0.004 : mid, doorHalf ? y0d + 0.06 : 1.3, 0.0024);
    // reinforcement triangle at the top of the zip
    const tri = G.surface((u, v, o) => { const yy = doorTop + 0.002 + v * 0.07; const half = (1 - v) * 0.06; o.copy(point(mid + (u - 0.5) * 2 * half, yy, 0.0013)); }, 8, 6, { flipNormals: flip });
    bins.add(fabric, tri);
    // two roll-up straps (one per door half): sewn on just below the valance (box stitch),
    // closed with a side-release buckle, short tail below
    for (const sg of [-1, 1]) {
      const s = mid + sg * doorW * 0.32, yTop = top - 0.17, yB = top - 0.43;
      if (doorHalf && sg > 0) { rolledLeaf(s, yTop); continue; }
      webbingRun(s, yB + 0.027, yTop, 0.025, 0.0016, 0.0016, { bulge: 0.0012 });
      webbingRun(s, yB - 0.2, yB - 0.034, 0.025, 0.0016, 0.0016, { bulge: 0.001 });
      buckle(s, yB, 0.0022);
      const bx = [[s - 0.009, yTop - 0.006], [s + 0.009, yTop - 0.006], [s + 0.009, yTop - 0.034], [s - 0.009, yTop - 0.034], [s - 0.009, yTop - 0.006], [s + 0.009, yTop - 0.034]];
      const pts = []; for (let i = 0; i < bx.length - 1; i++) for (let k = 0; k < 6; k++) { const t = k / 6; pts.push([bx[i][0] + (bx[i + 1][0] - bx[i][0]) * t, bx[i][1] + (bx[i + 1][1] - bx[i][1]) * t, 0.0034]); }
      sline(pts);
    }
  } else if (doorOpen) {
    for (const sg of [-1, 1]) zip(mid + sg * (doorW / 2 + 0.012), bottomAt(mid) + 0.02, doorTop);
    // rolled door above the opening with two straps around it
    const r0 = point(mid - doorW / 2 - 0.03, doorTop + 0.06, 0.055), r1 = point(mid + doorW / 2 + 0.03, doorTop + 0.06, 0.055);
    const roll = G.tube(r0, r1, 0.05, 28);
    bins.add(fabric, roll);
    for (const t of [0.22, 0.78]) {
      const tp = r0.clone().lerp(r1, t);
      const loop = G.surface((u, v, o) => {
        const ang = -Math.PI * 0.5 + u * Math.PI * 1.7;
        o.copy(tp).addScaledVector(n, Math.cos(ang) * 0.054).setY(tp.y + Math.sin(ang) * 0.054).addScaledVector(along, (v - 0.5) * 0.025);
      }, 20, 2, { uvScale: [0.29, 0.025] });
      bins.add(strapMat, loop);
      bins.add(strapMat, G.flatBar(tp.clone().addScaledVector(n, -0.054).setY(tp.y + 0.004), tp.clone().addScaledVector(n, -0.052).setY(top - 0.17), 0.002, 0.025, n.clone()));
    }
  }
  // contact proxy (seen only by the floor's wide contact pass, render layer 3): a strip
  // along the hem whose height grows with the distance from it, so the floor gets a soft
  // ambient-occlusion halo of ~10-25 cm along the wall foot, inside and out
  {
    const W = 0.32, nuP = Math.ceil((L + 0.1) / 0.02);
    const pg = G.surface((u, v, o) => {
      const s = -0.05 + u * (L + 0.1), d = (v - 0.5) * 2 * W;
      const sc = Math.min(L, Math.max(0, s));
      const p0 = point(sc, bottomAt(sc) + 0.002).addScaledVector(along, s - sc);
      const endFade = Math.max(0, -s, s - L) / 0.05;
      o.set(p0.x + n.x * d, 0.003 + 0.3 * Math.abs(d) + 0.04 * endFade, p0.z + n.z * d);
    }, nuP, 32);
    const pm = new THREE.Mesh(pg, PROXY_MAT);
    pm.layers.set(3); pm.castShadow = false; pm.receiveShadow = false;
    pm.userData.contactProxy = true; pm.userData.noFrame = true;
    group.add(pm);
  }
  const sg = stitches.filter(Boolean);
  if (sg.length) { const sm = new THREE.Mesh(mergeStitches(sg), thread); sm.castShadow = false; sm.receiveShadow = true; group.add(sm); }
  return { bottomAt, point, L };
}

// flip a geometry's winding if its mean normal points away from dir
function orientTo(geo, dir) {
  const N = geo.attributes.normal; let sx = 0, sy = 0, sz = 0;
  for (let i = 0; i < N.count; i++) { sx += N.getX(i); sy += N.getY(i); sz += N.getZ(i); }
  if (sx * dir.x + sy * dir.y + sz * dir.z < 0) flipGeo(geo);
  return geo;
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
    }, 20, 2, { uvScale: [0.32, 0.025] }));
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

// Clear PVC window foil for side walls: nearly colourless, a faint smoky haze, glossy with a
// slight waviness, so it reads dark (the closed tent is dim inside) with a soft reflection
// streak of the studio cards, never as a frosted white pane.
let windowFoilMat = null;
function windowFoil() {
  if (windowFoilMat) return windowFoilMat;
  const m = M.pvcWindow().clone();
  // dark smoky foil: no clearcoat (a second, mirror-sharp lobe made every window a glossy glass
  // icon); its reflections are damped (envSpec) so the studio cards show as a soft sheen
  m.color.set('#121618'); m.roughness = 0.14; m.clearcoat = 0; m.specularIntensity = 0.8;
  // a taut foil: only a long, gentle waviness (a strong wrinkle map mirrors the studio as marble)
  m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(0.55, 0.55); m.normalMap.needsUpdate = true; m.normalScale = new THREE.Vector2(0.011, 0.011);
  // smoky clear foil: ~70 % see-through (the dim inside, the opposite wall and the frame show
  // through), plus the reflection of a strip softbox as one soft, slightly wavy band
  // (engine `sheet`, set per panel in buildWall: metric size of the panel)
  m.userData = { stochasticAlpha: 0.3, interior: true, envSpec: 0.35 };
  m.name = 'pvc window foil';
  windowFoilMat = m;
  return m;
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
