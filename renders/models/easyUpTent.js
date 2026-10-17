// Easy-up / pop-up partytent (vouwtent).
//
// Construction modelled after professional folding gazebos:
//  - telescopic hexagonal aluminium legs (Premium 40 mm, Professional 50 mm) with a
//    height-adjust collar + push button, square galvanised foot plates with peg holes;
//  - nylon (Premium) or cast-aluminium (Professional) top corner brackets and sliders;
//  - scissor truss (X-lattice of flat rectangular tubes) between all legs just under
//    the roof edge, inner diagonal scissor trusses to a centre hub per bay;
//  - telescopic centre pole and four rafters per bay under a pyramid roof whose fabric
//    sags slightly between rafters and hips;
//  - ~25 cm valance (skirt) around the roof edge, optional print;
//  - optional side walls (closed, windows, door, door-open) and leg weights.
// Units: metres. X = width (front side), Z = depth, front faces +Z.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as TX from '../js/textures.js';

const { V3 } = G;

const SPEC = {
  premium: {
    leg: 0.040, inner: 0.034, eave: 2.10, trussDrop: 0.39, bar: [0.025, 0.012], valance: 0.25,
    bracket: 'nylon', plate: 0.13, rafter: 0.016,
  },
  professional: {
    leg: 0.050, inner: 0.044, eave: 2.14, trussDrop: 0.44, bar: [0.032, 0.015], valance: 0.27,
    bracket: 'alu', plate: 0.15, rafter: 0.019,
  },
};

function linspace(a, b, n) { const out = []; for (let i = 0; i <= n; i++) out.push(a + (b - a) * (i / n)); return out; }

function parseWalls(walls) {
  // accepts ["back:window", {side:'left', type:'window'}, ...] or {front:'door', back:'closed'}
  const out = {};
  if (!walls) return out;
  if (Array.isArray(walls)) {
    for (const w of walls) {
      if (typeof w === 'string') { const [side, type = 'closed'] = w.split(':'); out[side] = type; }
      else if (w && w.side) out[w.side] = w.type || 'closed';
    }
  } else if (typeof walls === 'object') Object.assign(out, walls);
  else if (walls === 'all' || walls === true) Object.assign(out, { front: 'closed', back: 'closed', left: 'closed', right: 'closed' });
  return out;
}

export function easyUpTent(p = {}) {
  let w = Number(p.w ?? p.width ?? 3), d = Number(p.d ?? p.depth ?? 3);
  if (d > w && p.orient !== 'keep') [w, d] = [d, w]; // long side faces the camera
  const kind = (p.legs || p.frame || 'premium').toLowerCase().startsWith('pro') ? 'professional' : 'premium';
  const S = SPEC[kind];
  const He = Number(p.height ?? S.eave);
  const color = p.color || 'wit';
  const fabric = M.tentFabric(color);
  const alu = M.aluminium();
  const bracketMat = S.bracket === 'nylon' ? M.nylon('#151515') : M.aluminium({ tone: '#B9BDC1', roughness: 0.42 });
  const nylon = M.nylon('#151515');
  const galv = M.galvanised();
  const dark = M.rubber('#0B0B0B');
  const bins = new G.PartBin();
  const group = new THREE.Group();
  group.name = `easyUpTent ${w}x${d} ${kind} ${color}`;

  const legAF = S.leg;
  const inset = legAF / 2 + 0.012;
  const nbx = w > 4.01 ? Math.ceil(w / 4) : 1;
  const nbz = d > 4.01 ? Math.ceil(d / 4) : 1;
  const xs = linspace(-w / 2 + inset, w / 2 - inset, nbx);
  const zs = linspace(-d / 2 + inset, d / 2 - inset, nbz);
  const trussTop = He - 0.035;
  const trussBot = He - S.trussDrop;
  const [barW, barT] = S.bar;

  // ---- legs ------------------------------------------------------------------
  const legPts = [];
  for (let i = 0; i <= nbx; i++) for (let j = 0; j <= nbz; j++) {
    if (i === 0 || i === nbx || j === 0 || j === nbz) legPts.push([xs[i], zs[j]]);
  }
  const joinY = 1.0;
  for (const [x, z] of legPts) {
    const out = V3(Math.sign(x) || 0, 0, Math.sign(z) || 0).normalize(); // outward diagonal
    const side = V3(1, 0, 0);
    // outer upper tube + inner lower tube
    bins.add(alu, G.hexTube(V3(x, joinY - 0.01, z), V3(x, He - 0.06, z), legAF, { side }));
    bins.add(alu, G.hexTube(V3(x, 0.03, z), V3(x, joinY + 0.04, z), S.inner, { side }));
    // height-adjust collar with spring button
    bins.add(nylon, G.prism(G.roundedPolygonProfile(6, legAF + 0.012, 0.006, 3, Math.PI / 6), V3(x, joinY - 0.045, z), V3(x, joinY + 0.012, z), { side }));
    const bpos = V3(x, joinY - 0.016, z).addScaledVector(out, legAF / 2 + 0.006);
    bins.add(dark, G.tube(bpos.clone().addScaledVector(out, -0.004), bpos.clone().addScaledVector(out, 0.008), 0.0065, 14));
    // spare adjustment holes in the inner tube (below the collar)
    for (const hy of [joinY - 0.13, joinY - 0.25]) {
      const hp = V3(x, hy, z).addScaledVector(out, S.inner / 2 * 0.97);
      bins.add(dark, G.tube(hp.clone().addScaledVector(out, -0.001), hp.clone().addScaledVector(out, 0.0012), 0.0042, 12));
    }
    // foot plate + socket + peg holes
    const pl = S.plate;
    const plate = G.prism(G.roundedRectProfile(pl, pl, 0.012, 3), V3(x, 0, z), V3(x, 0.006, z), { side: V3(1, 0, 0) });
    bins.add(galv, plate);
    bins.add(galv, G.prism(G.roundedPolygonProfile(6, S.inner + 0.008, 0.004, 2, Math.PI / 6), V3(x, 0.005, z), V3(x, 0.075, z), { side }));
    // welded gussets
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const dx = Math.cos(a), dz = Math.sin(a);
      const r0 = (S.inner + 0.008) / 2;
      const g = G.prism(G.roundedRectProfile(0.004, 0.03, 0.001, 1), V3(x + dx * r0, 0.006, z + dz * r0), V3(x + dx * (r0 + 0.028), 0.006, z + dz * (r0 + 0.028)), { side: V3(-dz, 0, dx) });
      g.translate(0, 0.012, 0);
      bins.add(galv, g);
    }
    for (const s of [-1, 1]) {
      const hx = x + s * pl * 0.34, hz = z - s * pl * 0.34 * (Math.sign(x * z) || 1);
      bins.add(dark, G.tube(V3(hx, 0.0055, hz), V3(hx, 0.0068, hz), 0.006, 14));
    }
    // top corner bracket
    const bw = legAF + 0.034;
    const tb = G.roundedBox(bw, 0.11, bw, 0.008); tb.translate(x, He - 0.05, z);
    bins.add(bracketMat, tb);
    // slider
    const sb = G.roundedBox(bw - 0.004, 0.085, bw - 0.004, 0.008); sb.translate(x, trussBot + 0.005, z);
    bins.add(bracketMat, sb);
    // slider pull-pin ring on the outside
    const ringC = V3(x, trussBot - 0.02, z).addScaledVector(out, bw / 2 + 0.012);
    const ring = new THREE.TorusGeometry(0.014, 0.0022, 8, 24);
    ring.rotateY(Math.atan2(out.x, out.z)); ring.translate(ringC.x, ringC.y, ringC.z);
    bins.add(M.chrome(), ring);
  }

  // ---- scissor trusses ----------------------------------------------------------
  // A span runs between two legs; the X-lattice sits in the vertical plane through them.
  const spans = [];
  for (let i = 0; i < nbx; i++) { spans.push([[xs[i], zs[0]], [xs[i + 1], zs[0]]]); spans.push([[xs[i], zs[nbz]], [xs[i + 1], zs[nbz]]]); }
  for (let j = 0; j < nbz; j++) { spans.push([[xs[0], zs[j]], [xs[0], zs[j + 1]]]); spans.push([[xs[nbx], zs[j]], [xs[nbx], zs[j + 1]]]); }
  for (let i = 1; i < nbx; i++) for (let j = 0; j < nbz; j++) spans.push([[xs[i], zs[j]], [xs[i], zs[j + 1]]]);
  for (let j = 1; j < nbz; j++) for (let i = 0; i < nbx; i++) spans.push([[xs[i], zs[j]], [xs[i + 1], zs[j]]]);
  const midTops = []; // top connector at span midpoint (for rafters)

  function scissor(a, b, yTop, yBot, endGapA, endGapB, n, collectMid) {
    const A = V3(a[0], 0, a[1]), B = V3(b[0], 0, b[1]);
    const dir = B.clone().sub(A); const L = dir.length(); dir.normalize();
    const nrm = V3(-dir.z, 0, dir.x); // perpendicular in plane
    const s0 = endGapA, s1 = L - endGapB;
    const nodes = linspace(s0, s1, n);
    const P = (s, y, off) => A.clone().addScaledVector(dir, s).addScaledVector(nrm, off).setY(y);
    for (let k = 0; k < n; k++) {
      const sa = nodes[k], sb = nodes[k + 1];
      const off = barT * 0.55;
      bins.add(alu, G.flatBar(P(sa, yTop, off), P(sb, yBot, off), barT, barW, nrm.clone()));
      bins.add(alu, G.flatBar(P(sa, yBot, -off), P(sb, yTop, -off), barT, barW, nrm.clone()));
      // pivot bolt at the crossing
      const sm = (sa + sb) / 2, ym = (yTop + yBot) / 2;
      bins.add(M.chrome(), G.tube(P(sm, ym, -off * 2.2), P(sm, ym, off * 2.2), 0.006, 12));
      if (k > 0) {
        for (const y of [yTop, yBot]) {
          const c = G.roundedBox(0.045, 0.034, barT * 2 + 0.012, 0.006);
          c.rotateY(Math.atan2(dir.x, dir.z) + Math.PI / 2);
          const cp = P(sa, y, 0); c.translate(cp.x, cp.y, cp.z);
          bins.add(nylon, c);
        }
      }
    }
    if (collectMid && n % 2 === 0) midTops.push(P(nodes[n / 2], yTop + 0.012, 0));
    else if (collectMid) midTops.push(P((s0 + s1) / 2, yTop + 0.012, 0));
    return { A, B, dir, L };
  }

  const gap = legAF / 2 + 0.024;
  for (const [a, b] of spans) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(2, Math.round(L / 1.5));
    scissor(a, b, trussTop, trussBot + 0.01, gap, gap, n, true);
  }

  // ---- per bay: diagonal trusses, hub, centre pole, rafters ---------------------
  const bays = [];
  const roofX = linspace(-w / 2, w / 2, nbx).map((v, i, arr) => (i === 0 ? -w / 2 - 0.015 : i === arr.length - 1 ? w / 2 + 0.015 : xs[i]));
  const roofZ = linspace(-d / 2, d / 2, nbz).map((v, i, arr) => (i === 0 ? -d / 2 - 0.015 : i === arr.length - 1 ? d / 2 + 0.015 : zs[i]));
  for (let i = 0; i < nbx; i++) for (let j = 0; j < nbz; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    const bw = roofX[i + 1] - roofX[i], bd = roofZ[j + 1] - roofZ[j];
    const rise = 0.30 * Math.min(bw, bd) + 0.06;
    const peakY = He + 0.012 + rise;
    const hubTop = trussTop + 0.0, hubBot = trussBot + 0.06;
    for (const [x, z] of [[xs[i], zs[j]], [xs[i + 1], zs[j]], [xs[i], zs[j + 1]], [xs[i + 1], zs[j + 1]]]) {
      const L = Math.hypot(cx - x, cz - z);
      const n = Math.max(2, Math.round(L / 1.5));
      scissor([x, z], [cx, cz], trussTop, hubBot, gap * 1.2, 0.07, n, false);
    }
    // hubs
    bins.add(nylon, G.prism(G.circleProfile(0.06, 28), V3(cx, hubTop - 0.03, cz), V3(cx, hubTop + 0.02, cz)));
    bins.add(nylon, G.prism(G.circleProfile(0.055, 28), V3(cx, hubBot - 0.03, cz), V3(cx, hubBot + 0.02, cz)));
    // centre pole (telescopic) + cap
    bins.add(alu, G.tube(V3(cx, hubBot - 0.03, cz), V3(cx, He + 0.25, cz), 0.016, 18));
    bins.add(alu, G.tube(V3(cx, He + 0.24, cz), V3(cx, peakY - 0.05, cz), 0.0125, 18));
    bins.add(nylon, G.prism(G.circleProfile(0.032, 24), V3(cx, peakY - 0.06, cz), V3(cx, peakY - 0.03, cz)));
    // rafters from the pole top to the four side mid connectors of this bay
    const mids = [[cx, zs[j]], [cx, zs[j + 1]], [xs[i], cz], [xs[i + 1], cz]];
    for (const [mx, mz] of mids) {
      const a = V3(mx, trussTop + 0.02, mz), b = V3(cx, peakY - 0.05, cz);
      bins.add(alu, G.tube(a, b, S.rafter / 2, 12));
    }
    bays.push({ x0: roofX[i], x1: roofX[i + 1], z0: roofZ[j], z1: roofZ[j + 1], cx, cz, peakY, rise });
  }

  // ---- roof fabric -----------------------------------------------------------------
  const eaveY = He + 0.012;
  const roofGeoms = [];
  for (const bay of bays) {
    const P = V3(bay.cx, bay.peakY, bay.cz);
    const corners = [V3(bay.x0, eaveY, bay.z1), V3(bay.x1, eaveY, bay.z1), V3(bay.x1, eaveY, bay.z0), V3(bay.x0, eaveY, bay.z0)]; // FL, FR, BR, BL
    const size = Math.min(bay.x1 - bay.x0, bay.z1 - bay.z0);
    const sagAmp = 0.022 * (size / 3);
    for (let f = 0; f < 4; f++) {
      const c0 = corners[f], c1 = corners[(f + 1) % 4];
      const mid = c0.clone().add(c1).multiplyScalar(0.5);
      // the rafter meets the eave at the leg-line midpoint, slightly inside the edge
      for (const [ca, cb] of [[c0, mid], [c1, mid]]) {
        const flip = ca === c1;
        const g = G.surface((s, t, out) => {
          const e = ca.clone().lerp(cb, s);
          out.copy(e).lerp(P, t);
          const sag = sagAmp * Math.sin(Math.PI * s) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.85);
          // subtle diagonal tension wrinkles from the corner pocket
          const wr = 0.0022 * Math.sin(s * 34 + t * 9) * Math.exp(-s * 5) * Math.sin(Math.PI * t);
          out.y -= sag + wr;
          // slight inward pull of the fabric toward the peak line
          const inward = P.clone().setY(out.y).sub(out).normalize();
          out.addScaledVector(inward, sag * 0.35);
        }, 28, 36, { flipNormals: flip, uvScale: [ca.distanceTo(cb), ca.distanceTo(P)] });
        roofGeoms.push(g);
      }
    }
    // peak cap
    const cap = G.lathe([[0.0001, 0.026], [0.02, 0.022], [0.034, 0.012], [0.044, 0.0]], 32);
    cap.translate(P.x, P.y - 0.004, P.z);
    roofGeoms.push(cap);
  }
  for (const g of roofGeoms) bins.add(fabric, g);

  // roof edge hem (rounded bead) + valance around the outer perimeter
  const ov = 0.015;
  const X0 = -w / 2 - ov - 0.004, X1 = w / 2 + ov + 0.004, Z0 = -d / 2 - ov - 0.004, Z1 = d / 2 + ov + 0.004;
  const cr = 0.025;
  const loop = roundedRectPath(X0, X1, Z0, Z1, cr, 10);
  const drop = Number(p.valanceDrop ?? S.valance);
  const vTop = eaveY + 0.006, vBot = eaveY + 0.006 - drop;
  const per = loop.total;
  const valance = G.surface((u, v, out) => {
    const q = loop.at(u);
    const y = THREE.MathUtils.lerp(vBot, vTop, v);
    // gentle waves between velcro points (every ~0.5 m), stronger toward the hem
    const wave = 0.0035 * Math.sin((q.s / 0.5) * Math.PI * 2) * (1 - v) * (1 - v);
    out.set(q.x + q.nx * wave, y, q.z + q.nz * wave);
  }, Math.ceil(per / 0.04), 10, { uvScale: [per, drop] });
  bins.add(fabric, valance);
  // hem beads (top seam + bottom double hem)
  bins.add(fabric, loopTube(loop, vTop - 0.002, 0.0075, 0.0));
  bins.add(fabric, loopTube(loop, vBot + 0.004, 0.0045, 0.0015));

  // optional valance print
  if (p.valancePrint) {
    const vp = typeof p.valancePrint === 'string' ? { text: p.valancePrint } : p.valancePrint;
    const ink = M.resolveColor(vp.color, M.resolveColor(color) && lumOf(M.resolveColor(color)) > 0.5 ? '#1D1E20' : '#FFFFFF');
    const sides = vp.sides || ['front', 'back', 'left', 'right'];
    const H = drop * 0.62;
    for (const side of sides) {
      const len = side === 'front' || side === 'back' ? w : d;
      const cw = 2048, ch = Math.max(64, Math.round(cw * H / (len * 0.92)));
      const tex = TX.printTexture({ text: vp.text, color: ink, width: cw, height: ch, font: `${vp.weight || 800} ${Math.round(ch * 0.66)}px ${vp.font || '"Arial Black", "Helvetica Neue", Arial, sans-serif'}` });
      const mat = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.55, transparent: false, side: THREE.FrontSide });
      const plane = new THREE.PlaneGeometry(len * 0.92, H);
      const yc = (vTop + vBot) / 2 - 0.004;
      const m = new THREE.Mesh(plane, mat); m.castShadow = false; m.receiveShadow = true;
      if (side === 'front') m.position.set(0, yc, Z1 + 0.0035);
      if (side === 'back') { m.position.set(0, yc, Z0 - 0.0035); m.rotation.y = Math.PI; }
      if (side === 'right') { m.position.set(X1 + 0.0035, yc, 0); m.rotation.y = Math.PI / 2; }
      if (side === 'left') { m.position.set(X0 - 0.0035, yc, 0); m.rotation.y = -Math.PI / 2; }
      group.add(m);
    }
  }

  // ---- side walls -------------------------------------------------------------------
  const walls = parseWalls(p.walls);
  const wallColor = p.wallColor || color;
  const wallOff = legAF / 2 + 0.008;
  const sideDefs = {
    front: { pts: xs.map((x) => [x, zs[nbz]]), n: V3(0, 0, 1) },
    back: { pts: xs.map((x) => [x, zs[0]]).reverse(), n: V3(0, 0, -1) },
    right: { pts: zs.map((z) => [xs[nbx], z]).reverse(), n: V3(1, 0, 0) },
    left: { pts: zs.map((z) => [xs[0], z]), n: V3(-1, 0, 0) },
  };
  for (const [side, typeSpec] of Object.entries(walls)) {
    const def = sideDefs[side]; if (!def || !typeSpec || typeSpec === 'none') continue;
    const types = Array.isArray(typeSpec) ? typeSpec : [typeSpec];
    for (let k = 0; k < def.pts.length - 1; k++) {
      const type = types[k % types.length];
      const a = V3(def.pts[k][0], 0, def.pts[k][1]).addScaledVector(def.n, wallOff);
      const b = V3(def.pts[k + 1][0], 0, def.pts[k + 1][1]).addScaledVector(def.n, wallOff);
      const along = b.clone().sub(a).normalize();
      // extend panels at outer corners so adjacent walls overlap around the leg
      const isFirst = k === 0, isLast = k === def.pts.length - 2;
      if (isFirst) a.addScaledVector(along, -(wallOff + 0.004));
      if (isLast) b.addScaledVector(along, wallOff + 0.004);
      buildWall(group, bins, { a, b, n: def.n, top: He - 0.005, bottom: 0.025, type, color: wallColor, seed: k + side.length });
    }
  }

  // ---- weights ----------------------------------------------------------------------
  const wcount = typeof p.weights === 'object' && p.weights ? (p.weights.count ?? 1) : Number(p.weights || 0);
  if (wcount > 0) {
    const iron = M.castIron('#2A2B2D');
    const plateH = 0.032, rOut = 0.135;
    for (const [x, z] of legPts) {
      for (let k = 0; k < wcount; k++) {
        const y0 = 0.007 + k * (plateH + 0.002);
        const prof = [[0.026, y0], [rOut - 0.012, y0], [rOut - 0.002, y0 + 0.004], [rOut, y0 + plateH * 0.5], [rOut - 0.002, y0 + plateH - 0.004], [rOut - 0.012, y0 + plateH], [0.045, y0 + plateH], [0.04, y0 + plateH - 0.006], [0.026, y0 + plateH - 0.006]];
        const g = G.lathe(prof, 56); g.translate(x, 0, z);
        bins.add(iron, g);
      }
    }
  }

  bins.build(group);
  const fx = xs[nbx], fz = zs[nbz];
  return {
    object: group,
    detail: { target: [fx - 0.05, He - 0.17, fz - 0.02], size: 0.95, azimuth: 38, elevation: -4 },
    meta: { w, d, kind, legs: legPts.length, eave: He, peak: Math.max(...bays.map((b) => b.peakY)) },
  };
}

function lumOf(hex) { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

// Rounded rectangle path in XZ, counter-clockwise seen from above starting front-left.
function roundedRectPath(x0, x1, z0, z1, r, segs) {
  const pts = [];
  // order: front edge (z1) left->right, right edge front->back, back edge right->left, left edge back->front
  const corners = [[x1 - r, z1 - r, Math.PI / 2, 0], [x1 - r, z0 + r, 0, -Math.PI / 2], [x0 + r, z0 + r, -Math.PI / 2, -Math.PI], [x0 + r, z1 - r, Math.PI, Math.PI / 2]];
  pts.push([x0 + r, z1, 0, 1]);
  for (const [cx, cz, a0, a1] of corners) {
    for (let i = 0; i <= segs; i++) { const a = a0 + (a1 - a0) * (i / segs); pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r, Math.cos(a), Math.sin(a)]); }
  }
  pts.push([x0 + r, z1, 0, 1]);
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1];
  function at(u) {
    const s = u * total;
    let i = 1; while (i < acc.length - 1 && acc[i] < s) i++;
    const t = (s - acc[i - 1]) / Math.max(1e-9, acc[i] - acc[i - 1]);
    const A = pts[i - 1], B = pts[i];
    const nx = A[2] + (B[2] - A[2]) * t, nz = A[3] + (B[3] - A[3]) * t; const nl = Math.hypot(nx, nz) || 1;
    return { x: A[0] + (B[0] - A[0]) * t, z: A[1] + (B[1] - A[1]) * t, nx: nx / nl, nz: nz / nl, s };
  }
  return { at, total };
}

function loopTube(loop, y, r, out) {
  const segs = Math.ceil(loop.total / 0.03);
  return G.surface((u, v, o) => {
    const q = loop.at(u);
    const a = v * Math.PI * 2;
    o.set(q.x + q.nx * (out + Math.cos(a) * r), y + Math.sin(a) * r, q.z + q.nz * (out + Math.cos(a) * r));
  }, segs, 8, { closedU: false });
}

// ---- side wall panel ------------------------------------------------------------------
function buildWall(group, bins, { a, b, n, top, bottom, type, color, seed }) {
  const along = b.clone().sub(a); const L = along.length(); along.normalize();
  const Hh = top - bottom;
  const wallFabric = M.tentFabric(color);
  const needsMask = type === 'window' || type === 'windows' || type === 'door-open' || type === 'panorama';
  let mat = wallFabric;
  let mask = null;
  const key = `${type}:${L.toFixed(2)}:${Hh.toFixed(2)}`;
  if (needsMask) {
    mask = TX.maskTexture(`wall:${key}`, 1024, Math.round(1024 * Hh / L), (g, W, H) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#000';
      const px = W / L; // px per metre
      if (type === 'window' || type === 'windows') {
        const nw = Math.max(1, Math.round(L / 1.0));
        const ww = 0.56, wh = 0.86, y0 = Hh - 1.82; // window from 0.96 m..1.82 m above ground (canvas y from top)
        for (let i = 0; i < nw; i++) {
          const cx = ((i + 0.5) / nw) * L;
          const x = (cx - ww / 2) * px, yTop = (Hh - (1.82 - bottom)) * px, wpx = ww * px, hpx = wh * px;
          // church window: arched top
          g.beginPath();
          const r = wpx / 2;
          g.moveTo(x, yTop + r); g.arc(x + r, yTop + r, r, Math.PI, 0); g.lineTo(x + wpx, yTop + hpx); g.lineTo(x, yTop + hpx); g.closePath(); g.fill();
          // fabric mullions (cross)
          g.fillStyle = '#fff';
          const mb = 0.035 * px;
          g.fillRect(x + wpx / 2 - mb / 2, yTop, mb, hpx);
          g.fillRect(x, yTop + hpx * 0.52 - mb / 2, wpx, mb);
          g.fillStyle = '#000';
        }
      } else if (type === 'panorama') {
        const x = 0.12 * px, yTop = (Hh - (1.85 - bottom)) * px;
        g.fillRect(x, yTop, W - 2 * x, 0.95 * px);
      } else if (type === 'door-open') {
        const dw = Math.min(1.5, L * 0.5);
        const x = (L / 2 - dw / 2) * px, yTop = (Hh - (1.92 - bottom)) * px;
        g.fillRect(x, yTop, dw * px, H - yTop + 2);
      }
    });
    mat = cloneFabricWithMask(wallFabric, mask, key);
  }
  const amp = 0.006;
  const nu = Math.ceil(L / 0.03), nv = Math.ceil(Hh / 0.05);
  const fn = (u, v, out, extra = 0) => {
    const s = u * L, y = bottom + v * Hh;
    // vertical drape folds, pinned at the top edge and at the legs
    const pin = Math.sin(Math.PI * u) ** 0.5;
    const fold = amp * (Math.sin(s * 5.1 + seed) * 0.6 + Math.sin(s * 11.3 + seed * 2.1) * 0.4) * pin * (1 - v) ** 1.5;
    out.copy(a).addScaledVector(along, s).addScaledVector(n, fold + extra).setY(y);
  };
  const geo = G.surface((u, v, o) => fn(u, v, o), nu, nv, { uvScale: [1, 1], flipNormals: n.dot(V3().crossVectors(along, V3(0, 1, 0))) < 0 });
  // uv in metres for the weave: add second set by scaling (mask uses 0..1)
  scaleUv(geo, L, Hh);
  if (mask) { mask.repeat.set(1 / L, 1 / Hh); mask.needsUpdate = true; }
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  if (needsMask) { group.add(m); } else { bins.add(mat, geo); }
  // bottom hem bead + top velcro strip shadow line
  const hem = G.tube(a.clone().setY(bottom + 0.006).addScaledVector(n, 0.002), b.clone().setY(bottom + 0.006).addScaledVector(n, 0.002), 0.005, 8);
  bins.add(wallFabric, hem);

  if (type === 'window' || type === 'windows' || type === 'panorama') {
    const pvc = cloneWindowWithMask(M.pvcWindow(), mask, key);
    const g2 = G.surface((u, v, o) => fn(u, v, o, -0.003), nu, nv, { flipNormals: n.dot(V3().crossVectors(along, V3(0, 1, 0))) < 0 });
    scaleUv(g2, L, Hh);
    const pm = new THREE.Mesh(g2, pvc); pm.castShadow = false; pm.receiveShadow = true;
    group.add(pm);
  }
  if (type === 'door' || type === 'door-open') {
    const zipMat = M.rubber('#141414');
    if (type === 'door') {
      // centre zipper with slider
      const c = a.clone().addScaledVector(along, L / 2);
      bins.add(zipMat, G.flatBar(c.clone().setY(bottom + 0.01).addScaledVector(n, 0.004), c.clone().setY(1.95).addScaledVector(n, 0.004), 0.014, 0.003, along.clone()));
      const sl = G.roundedBox(0.018, 0.045, 0.008, 0.003); sl.translate(0, 0, 0);
      const slm = new THREE.Matrix4().makeBasis(along, V3(0, 1, 0), n).setPosition(c.clone().setY(0.62).addScaledVector(n, 0.008));
      sl.applyMatrix4(slm); bins.add(M.chrome(), sl);
      // fabric cover flap over the zip
      bins.add(wallFabric, G.flatBar(c.clone().setY(bottom + 0.02).addScaledVector(n, 0.007).addScaledVector(along, 0.012), c.clone().setY(1.95).addScaledVector(n, 0.007).addScaledVector(along, 0.012), 0.03, 0.002, along.clone()));
    } else {
      // rolled-up door above the opening with two ties
      const dw = Math.min(1.5, L * 0.5);
      const c = a.clone().addScaledVector(along, L / 2);
      const r0 = c.clone().addScaledVector(along, -dw / 2).setY(1.97).addScaledVector(n, 0.05);
      const r1 = c.clone().addScaledVector(along, dw / 2).setY(1.97).addScaledVector(n, 0.05);
      const roll = G.tube(r0, r1, 0.045, 28); scaleUv(roll, 0.3, dw);
      bins.add(wallFabric, roll);
      for (const t of [0.2, 0.8]) {
        const tp = r0.clone().lerp(r1, t);
        const tie = G.surface((u, v, o) => {
          const ang = -Math.PI * 0.5 + u * Math.PI * 1.65;
          o.copy(tp).addScaledVector(n, Math.cos(ang) * 0.049).setY(tp.y + Math.sin(ang) * 0.049).addScaledVector(along, (v - 0.5) * 0.03);
        }, 18, 2);
        bins.add(wallFabric, tie);
        bins.add(wallFabric, G.flatBar(tp.clone().addScaledVector(n, -0.049).setY(tp.y + 0.005), tp.clone().addScaledVector(n, -0.05).setY(tp.y + 0.16), 0.002, 0.03, n.clone()));
      }
      // zip edges along the opening
      for (const s of [-1, 1]) {
        const e = c.clone().addScaledVector(along, s * dw / 2).addScaledVector(n, 0.003);
        bins.add(zipMat, G.flatBar(e.clone().setY(bottom + 0.01), e.clone().setY(1.92), 0.012, 0.003, along.clone()));
      }
      bins.add(zipMat, G.flatBar(c.clone().addScaledVector(along, -dw / 2).setY(1.925).addScaledVector(n, 0.003), c.clone().addScaledVector(along, dw / 2).setY(1.925).addScaledVector(n, 0.003), 0.012, 0.003, V3(0, 1, 0)));
    }
  }
}

function scaleUv(geo, su, sv) {
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
}

const maskMatCache = new Map();
function cloneFabricWithMask(base, mask, key) {
  const k = base.uuid + key;
  if (maskMatCache.has(k)) return maskMatCache.get(k);
  const m = base.clone();
  m.alphaMap = mask; m.alphaTest = 0.5; m.transparent = false;
  // weave scale: mask uv is 0..1 over the wall; the weave repeat is per metre on other parts.
  m.userData = { ...base.userData };
  maskMatCache.set(k, m); return m;
}
function cloneWindowWithMask(base, mask, key) {
  const k = base.uuid + key;
  if (maskMatCache.has(k)) return maskMatCache.get(k);
  const inv = mask.clone();
  // invert: draw into a new canvas
  const src = mask.image; const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  inv.image = c; inv.repeat.copy(mask.repeat); inv.needsUpdate = true;
  const m = base.clone(); m.alphaMap = inv; m.alphaTest = 0.5; m.userData = { ...base.userData };
  maskMatCache.set(k, m); return m;
}
