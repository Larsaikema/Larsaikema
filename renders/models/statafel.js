// Statafel (cocktail / standing table), height 110 cm, Ø60/70/80/85 cm.
//
// base: 'klap'   folding steel frame: Ø50 column; at the bottom a hub with four clevises in which
//                the oval legs (30 x 16 mm) pivot on rivets; flat steel struts (18 x 4 mm) pinned
//                in clevis tabs on each leg and in clevises on a sliding collar higher up the
//                column, which a star knob locks. Folding slides the collar up and the legs swing
//                up along the column. Under the blad: a mounting plate with two crossing flat
//                support bars (pan-head Phillips screws), a tilt bracket of bent 4 mm steel (U-channel
//                welded to the plate, 3 mm bend radius into two cheeks) pivoting on a bolt through the
//                column head, and a spring lock pin with a black pull knob 31 mm from the bolt (the blad
//                tilts to vertical).
//       'kruis'  horeca: fixed flat 4-star base plate (cast aluminium/steel)
//       'rond'   horeca: fixed round steel base disc
// top:  'berken' | 'hout' (birch plywood 18 mm, lacquered rotary-cut face, plies on the edge)
//       'hdpe' | 'hdpe-wit' | 'hdpe-grijs' (blow-moulded 45 mm, rounded rim)
//       'wit' | 'zwart' | 'antraciet' | 'houtlook' | 'graniet' (HPL / laminate; graniet = grey speckled stone look)
// shape: 'round' (default) | 'square' (width) | 'rect' (width x depth). Square tables stand on 4 splayed
//        square-tube legs ('stapel', stackable), rectangular ones on two folding leg frames.
// frame: 'zwart' | 'wit' | 'chroom' | 'alu' | 'antraciet' (satin powder coat, no stipple)
// folded: true -> blad tilted vertical, legs folded up along the column. Folded, the table cannot stand on
//         its own (it would balance on the column end), so on its own it leans back against a VISIBLE wall
//         (a light studio flat a shade darker than the floor, tight cove, rig.wallTone): its column end
//         stands on the floor, the blad's rim rests against the wall; both touch points carry contact
//         shadows (engine wall catcher). lean: false gives the bare folded table upright (trolley loads).
// noTop: true -> onderstel only (no blad; the cross bracket and hinge stay), for spare-part shots.
//
// Detail views (angle 'detail' / 'detail-<name>'): klap base 'detail' = the folding mechanism (sliding
// collar with its star knob, struts with their pinned clevises, hub, foot glides); 'detail-scharnier'
// = the tilt bracket and hinge under the blad; 'detail-voet' = a foot glide.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as U from '../js/upholstery2.js';
import * as L from '../js/statafelLook.js';
import { rng, makeNoise2 } from '../js/rng.js';

const LAMINATE = { wit: '#F2F2EE', zwart: '#1B1C1E', antraciet: '#3D4044', houtlook: '#8A6A48', graniet: '#FFFFFF' };
// Stone-look HPL (graniet): mid grey with fine dark and light speckles, as a colour map in metres (tile 0.25 m).
let _granite = null;
function graniteLaminate() {
  if (_granite) return _granite;
  const N = 512, R = rng(91), { noise } = makeNoise2(91);
  const d = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const v = 128 + Math.round(14 * noise((i % N) * 0.03, Math.floor(i / N) * 0.03));
    d[i * 4] = v; d[i * 4 + 1] = v - 2; d[i * 4 + 2] = v - 6; d[i * 4 + 3] = 255;
  }
  for (let k = 0; k < 9000; k++) {
    const x = Math.floor(R() * N), y = Math.floor(R() * N), r = R() < 0.85 ? 0 : 1;
    const v = R() < 0.55 ? 40 + R() * 40 : 190 + R() * 50;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      const o = (((y + yy + N) % N) * N + ((x + xx + N) % N)) * 4; d[o] = d[o + 1] = d[o + 2] = v;
    }
  }
  const map = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(4, 4); map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true;
  _granite = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map, roughness: 0.42, specularIntensity: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.35, name: 'laminate graniet' });
  return _granite;
}
function topMaterial(top) {
  if (top === 'graniet') return graniteLaminate();
  return M.laminate(LAMINATE[top] || LAMINATE.wit);
}

const { V3 } = G;
const lerpN = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

// Birch veneer of the statafel blad: one physically scaled rotary-cut face (upholstery2.birchPly,
// 0.9 m tile = one blad, grain lines ~4 mm apart, low contrast), a clear face without pin knots (at
// catalogue size they read as dirt specks), under a satin lacquer: clearcoat 0.72 / 0.15, so the studio's
// soft back sheet shows as a lacquer sheen over the far half of the top.
const BIRCH_KNOTS = [];
const _lacq = new Map();
export function birchTopFace(seed = 5) {
  const m = U.birchPly({ seed, clean: true, knots: BIRCH_KNOTS });
  if (!_lacq.has(m)) {
    const c = m.clone();
    c.roughness = 0.42; c.clearcoat = 0.72; c.clearcoatRoughness = 0.15; c.name = 'birch plywood face (lacquered statafel top)';
    c.userData = { ...m.userData, envSpec: 0.7 };
    _lacq.set(m, c);
  }
  return _lacq.get(m);
}

export function statafelDims(p = {}) {
  let D = Number(p.diameter ?? p.d ?? 0.8);
  if (D > 5) D /= 100; // accept cm
  const H = Number(p.height ?? 1.10) > 5 ? Number(p.height) / 100 : Number(p.height ?? 1.10);
  const top = (p.top || 'berken').toLowerCase();
  const T = top.startsWith('hdpe') ? 0.045 : 0.018;
  const base = (p.base || 'klap').toLowerCase();
  const nLegs = Number(p.legs ?? 4);
  const footR = base === 'klap' ? Math.min(0.40, 0.36 * (D / 0.8) ** 0.5) : base === 'kruis' ? 0.30 : 0.23;
  const footAngle = Number(p.footAngle ?? 45) * DEG;
  const feet = [];
  for (let i = 0; i < nLegs; i++) { const a = footAngle + (i / nLegs) * Math.PI * 2; feet.push([Math.sin(a) * footR, Math.cos(a) * footR, a]); }
  const colR = 0.025, hubY = 0.085;
  // klap frame: leg pivot (hub clevis pin) radius, leg length to the tube end, tube-end height
  const pivotR = colR + 0.023;
  const legLen = footR - 0.035;
  const tipY = 0.026;
  const legAng0 = -Math.asin((hubY - tipY) / legLen);
  // foot glide: a moulded boot over the tube end, sole flat on the floor (radial length L, height H, width W)
  const cap = { L: 0.05, H: 0.046, W: 0.025, r: 0.007 };
  const tipR = pivotR + legLen * Math.cos(legAng0);
  cap.c = tipR + 0.004; // radial centre of the glide
  // hinge bolt 48 mm under the blad: the folded mounting plate clears the column
  const hingeY = H - T - 0.048;
  return { D, R: D / 2, H, T, top, base, nLegs, footR, footAngle, feet, colR, hubY, collarY: 0.44, pivotR, legLen, tipY, legAng0, cap, tipR, hingeY };
}

function frameMaterial(frame) {
  const f = (frame || 'zwart').toLowerCase();
  if (f === 'chroom' || f === 'chrome' || f === 'rvs') return M.chrome();
  if (f === 'alu' || f === 'aluminium') return M.aluminium({ roughness: 0.28 });
  if (f === 'wit' || f === 'white') return L.satinPowder('#ECECE8', { roughness: 0.4 });
  if (f === 'antraciet') return L.satinPowder('#3B3E42');
  return L.satinPowder('#1C1D1F');
}

// basis matrix from x (side), y, z axes at origin o
const basis = (o, x, y, z) => new THREE.Matrix4().makeBasis(x, y, z).setPosition(o);
// domed rivet head / pin end on a face: centre c, face normal n, radius r
function rivetHead(c, n, r = 0.0042, h = 0.0018) {
  const prof = []; for (let i = 0; i <= 6; i++) { const a = (Math.PI / 2) * (i / 6); prof.push([Math.max(1e-5, Math.cos(a) * r), Math.sin(a) * h]); }
  prof.push([1e-5, h]);
  const g = G.lathe(prof.reverse(), 18);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), n.clone().normalize());
  g.applyQuaternion(q); g.translate(c.x, c.y, c.z);
  return g;
}
// pan-head screw (Phillips) on a face: centre c on the face, face normal n (pointing out of the face):
// a low cylindrical head with a rounded top, and a cross recess (dark, slightly sunk look)
function panHead(bins, metal, dark, c, n, r = 0.0042, h = 0.0024) {
  const prof = [[1e-5, 0], [r, 0], [r, h * 0.45]];
  for (let i = 1; i <= 6; i++) { const a = (Math.PI / 2) * (i / 6); prof.push([Math.max(1e-5, r - 0.0012 + Math.cos(a) * 0.0012 * 1.0 - (1 - Math.cos(a)) * 0), h * 0.45 + Math.sin(a) * h * 0.4]); }
  prof.push([r * 0.55, h * 0.98], [1e-5, h]);
  const g = G.lathe(prof.reverse(), 28);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), n.clone().normalize());
  g.applyQuaternion(q); g.translate(c.x, c.y, c.z);
  bins.add(metal, g);
  for (const rot of [0, Math.PI / 2]) {
    const x = G.roundedBox(r * 1.15, 0.0008, 0.0007, 0.0002, 1).rotateY(rot + 0.4).translate(0, h * 0.97, 0);
    x.applyQuaternion(q); x.translate(c.x, c.y, c.z);
    bins.add(dark, x);
  }
}
// clevis plate (cheek): a flat plate of thickness t centred at c, spanning `len` along a and `hgt` along b,
// rounded end at the pin side; lateral normal s
function plate(c, a, b, s, len, hgt, t, r = 0.004) {
  const g = G.roundedBox(len, hgt, t, Math.min(r, hgt / 2 - 1e-4, len / 2 - 1e-4));
  const x = a.clone().normalize(), y = b.clone().addScaledVector(x, -b.dot(x)).normalize();
  g.applyMatrix4(basis(c, x, y, V3().crossVectors(x, y))); // right-handed (s only names the plate normal)
  return g;
}
// star knob (6 lobes), axis n, back face at c
function starKnob(c, n, { R0 = 0.016, lobe = 0.0045, th = 0.013, lobes = 6 } = {}) {
  const prof = []; // rounded cross-section: [radial fraction 0..1, z]
  const rr = 0.004;
  prof.push([0, 0]);
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / 5); prof.push([1 + (Math.cos(a) - 1) * rr / R0, rr + Math.sin(a) * rr]); }
  for (let i = 0; i <= 5; i++) { const a = (Math.PI / 2) * (i / 5); prof.push([1 + (Math.cos(a) - 1) * rr / R0, th - rr + Math.sin(a) * rr]); }
  prof.push([0.55, th + 0.0012]); prof.push([0, th + 0.0016]);
  const rows = prof.map(([f, z]) => {
    const row = [];
    for (let i = 0; i < 96; i++) {
      const ph = (i / 96) * TAU;
      const rad = R0 - lobe + lobe * Math.pow(0.5 + 0.5 * Math.cos(ph * lobes), 0.7) * 1.15;
      row.push(V3(Math.cos(ph) * rad * f, Math.sin(ph) * rad * f, z));
    }
    return row;
  });
  const g = K.gridGeometry(rows, { closedU: true, flip: false });
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), n.clone().normalize());
  g.applyQuaternion(q); g.translate(c.x, c.y, c.z);
  return g;
}

export function statafel(p = {}) {
  const shape = (p.shape || 'round').toLowerCase();
  if (shape === 'square' || shape === 'rect') return statafelSquare(p, shape);
  const S = statafelDims(p);
  const { R, H, T, top } = S;
  const folded = !!p.folded;
  const frame = frameMaterial(p.frame);
  const black = L.blackPlastic('#141414', 0.45);
  const glideMat = L.blackPlastic('#151515', 0.6);
  const zinc = L.zincSteel();
  // screw heads: passivated zinc, duller than the bright bolt (no glinting crescents under the blad)
  const zincDull = L.zincSteel({ tone: '#AEB2B5', roughness: 0.42 });
  const recess = L.blackPlastic('#0B0B0C', 0.6);
  const group = new THREE.Group();
  group.name = `statafel Ø${Math.round(S.D * 100)} ${top} ${p.frame || 'zwart'}${folded ? ' folded' : ''}`;
  const bins = new G.PartBin();

  // ---------------- top (built flat, centred at origin, top surface at y = 0) ---------
  const topGroup = new THREE.Group();
  const topBins = new G.PartBin();
  if (p.noTop) {
    // onderstel only (spare-part shot): no blad, the cross bracket and hinge stay
  } else if (top.startsWith('hdpe')) {
    const col = top.includes('grijs') ? '#9C9EA0' : top.includes('zwart') ? '#232426' : '#F0F0EC';
    const mat = M.hdpe(col);
    const r = 0.011;
    const prof = [[0.0, 0], [R - r, 0]];
    for (let i = 1; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); prof.push([R - r + Math.cos(a) * r, -r + Math.sin(a) * r]); }
    prof.push([R - 0.0015, -T + 0.008], [R - 0.004, -T + 0.002], [R - 0.012, -T], [R - 0.03, -T], [R - 0.034, -T + 0.012], [0.05, -T + 0.012]);
    const g = G.lathe(prof.map(([x, y]) => [x, y]).reverse(), 128);
    topBins.add(mat, g);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      const v = V3(Math.cos(a), 0, Math.sin(a));
      topBins.add(mat, G.flatBar(v.clone().multiplyScalar(-(R - 0.04)).setY(-T + 0.012), v.clone().multiplyScalar(R - 0.04).setY(-T + 0.012), 0.012, 0.016, V3(0, 1, 0).cross(v).normalize()));
    }
  } else if (LAMINATE[top]) {
    const face = topMaterial(top);
    const edge = top === 'graniet' ? M.laminate('#5E5B56') : M.laminate(top === 'wit' ? '#EDEDE8' : LAMINATE[top]);
    const f1 = G.prism(G.circleProfile(R - 0.002, 128), V3(0, -0.0005, 0), V3(0, 0, 0)); planarUv(f1);
    const f2 = G.prism(G.circleProfile(R - 0.002, 128), V3(0, -T, 0), V3(0, -T + 0.0005, 0)); planarUv(f2);
    topBins.add(face, f1); topBins.add(face, f2);
    topBins.add(edge, roundedDiscEdge(R, T, 0.002));
  } else {
    // birch plywood: rotary-cut faces (one veneer, physically scaled, both faces), ply edge
    const face = birchTopFace(5), under = birchTopFace(11);
    const f1 = G.prism(G.circleProfile(R - 0.0025, 192), V3(0, -0.0006, 0), V3(0, 0, 0), { caps: true });
    const f2 = G.prism(G.circleProfile(R - 0.0025, 192), V3(0, -T, 0), V3(0, -T + 0.0006, 0), { caps: true });
    U.planarUV(f1, { rot: 0.35 }); U.planarUV(f2, { rot: 1.2 });
    topBins.add(face, f1); topBins.add(under, f2);
    topBins.add(M.birchEdge(), roundedDiscEdge(R, T, 0.0025));
  }
  // ---- under the blad: two crossing flat support bars, mounting plate, hinge cheeks
  const by = -T;                       // underside of the blad
  const brW = R * 1.25;
  for (const a of [45, 135]) {
    const v = V3(Math.sin(a * DEG), 0, Math.cos(a * DEG));
    const yb = by - 0.0026 - (a === 135 ? 0.005 : 0);
    topBins.add(frame, G.flatBar(v.clone().multiplyScalar(-brW / 2).setY(yb), v.clone().multiplyScalar(brW / 2).setY(yb), 0.03, 0.005, V3(0, 1, 0).cross(v).normalize()));
    // screws through the bar ends into the blad
    for (const s of [-1, 1]) panHead(topBins, zincDull, recess, v.clone().multiplyScalar(s * (brW / 2 - 0.018)).setY(yb - 0.0025), V3(0, -1, 0), 0.004, 0.0022);
  }
  const yPl = by - 0.0102 - 0.002;     // mounting plate under the crossing
  topBins.add(frame, G.roundedBox(0.14, 0.004, 0.14, 0.003).translate(0, yPl, 0));
  for (const [x, z] of [[0.052, 0.052], [-0.052, 0.052], [0.052, -0.052], [-0.052, -0.052]]) panHead(topBins, zincDull, recess, V3(x, yPl - 0.002, z), V3(0, -1, 0), 0.0045, 0.0024);
  // tilt bracket: one 4 mm steel U-channel welded under the mounting plate; its two cheeks are bent down
  // (inner bend radius 3 mm) either side of the column head and carry the hinge bolt and, 31 mm away
  // (ahead of and below the bolt), the spring lock pin with its pull knob
  const hingeRel = S.hingeY - H; // pivot height relative to the top surface
  {
    const t = 0.004, ri = 0.003, ro = ri + t, xi = 0.0315, hz = 0.036;
    const cx = xi - ri, cy = yPl - 0.002 - t - ri;       // bend centres (x = +-cx)
    topBins.add(frame, G.roundedBox(2 * cx + 0.0004, t, 2 * hz, 0.0006, 1).translate(0, cy + ri + t / 2, 0));
    for (const s of [-1, 1]) {
      // bend: outer and inner quarter cylinders + end caps (smooth normals)
      const bend = (rad, flip) => G.surface((u, v, o) => { const a = (Math.PI / 2) * u; o.set(s * (cx + Math.cos(a) * rad), cy + Math.sin(a) * rad, -hz + 2 * hz * v); }, 12, 2, { flipNormals: flip !== (s < 0) });
      topBins.add(frame, bend(ro, false)); topBins.add(frame, bend(ri, true));
      for (const zz of [-hz, hz]) topBins.add(frame, G.surface((u, v, o) => { const a = (Math.PI / 2) * u, rr = lerpN(ri, ro, v); o.set(s * (cx + Math.cos(a) * rr), cy + Math.sin(a) * rr, zz); }, 12, 1, { flipNormals: (zz > 0) !== (s < 0) }));
      // fillet weld along the bracket / plate joint (a slightly rippled bead)
      const wp = [];
      for (let i = 0; i <= 120; i++) { const z = -hz + 0.002 + (2 * hz - 0.004) * (i / 120); wp.push(V3(s * (cx + ro * 0.62), yPl - 0.002 - 0.0012, z)); }
      topBins.add(frame, K.sweep(wp, K.circle(0.0019, 12), { up: V3(0, 1, 0), scale: (i) => 1 + 0.045 * Math.sin(i * 1.4) * Math.sin(i * 0.11 + 0.5) }));
    }
    // cheek outline in its own plane (z across, y down): a plate round the pivot and the lock pin
    const hy = hingeRel, yL = hy - 0.024, zL = 0.02, yTop = cy + 0.0004;
    const sh = new THREE.Shape();
    sh.moveTo(-0.034, yTop);
    sh.lineTo(0.034, yTop);
    sh.lineTo(0.034, yL);
    sh.absarc(zL, yL, 0.012, 0, -Math.PI / 2, true);
    sh.lineTo(-0.01, yL - 0.012);
    sh.absarc(-0.01, yL, 0.012, -Math.PI / 2, -Math.PI, true);
    sh.lineTo(-0.034, hy);
    sh.lineTo(-0.034, yTop);
    const bv = 0.0006;
    for (const s of [-1, 1]) {
      const g = new THREE.ExtrudeGeometry(sh, { depth: t - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 2, curveSegments: 18 });
      g.translate(0, 0, bv);
      g.rotateY(-Math.PI / 2);                          // shape x -> world z, extrusion -> -x
      g.translate(s > 0 ? xi + t : -xi, 0, 0);
      topBins.add(frame, g);
    }
    // spring lock pin: threaded bush + jam nut on the +x cheek, pin through into the column head, pull knob
    topBins.add(zinc, G.tube(V3(xi + t, yL, zL), V3(xi + t + 0.0075, yL, zL), 0.006, 24));
    topBins.add(zinc, K.hexNutGeo(0.012, 0.0035, 0).rotateZ(Math.PI / 2).translate(xi + t + 0.0018, yL, zL));
    topBins.add(zinc, G.tube(V3(xi + t + 0.0075, yL, zL), V3(xi + t + 0.012, yL, zL), 0.0028, 16));
    topBins.add(black, G.lathe([[1e-4, 0], [0.0045, 0], [0.0045, 0.005], [0.0095, 0.008], [0.0102, 0.0115], [0.0085, 0.0152], [1e-4, 0.016]].reverse(), 32).rotateZ(-Math.PI / 2).translate(xi + t + 0.012, yL, zL));
  }
  topBins.build(topGroup);

  const hingeY = S.hingeY;
  let pivotGroup = null;
  if (!folded) {
    topGroup.position.set(0, H, 0);
    group.add(topGroup);
  } else {
    // rotate about the hinge bolt (X axis) so the blad stands vertical, face to the front (+z)
    pivotGroup = new THREE.Group(); pivotGroup.position.set(0, hingeY, 0);
    topGroup.position.set(0, H - hingeY, 0);
    pivotGroup.add(topGroup); pivotGroup.rotation.x = Math.PI / 2;
    group.add(pivotGroup);
  }

  // ---------------- column + head ---------------------------------------------------
  const colTop = hingeY + 0.018;
  const colBot = S.base === 'klap' ? S.hubY - 0.045 : 0.012;
  bins.add(frame, G.tube(V3(0, colBot, 0), V3(0, colTop - 0.026, 0), S.colR, 40));
  // head: welded block between the hinge cheeks, pivot bolt with hex head and nut
  bins.add(frame, G.roundedBox(0.056, 0.05, 0.06, 0.005).translate(0, colTop - 0.025, 0));
  bins.add(zinc, G.tube(V3(-0.042, hingeY, 0), V3(0.042, hingeY, 0), 0.004, 14));
  bins.add(zinc, K.hexNutGeo(0.013, 0.0055, 0).rotateZ(Math.PI / 2).translate(0.0395, hingeY, 0));
  bins.add(zinc, K.hexNutGeo(0.013, 0.0065, 0.004).rotateZ(Math.PI / 2).translate(-0.0395, hingeY, 0));
  // bottom plug
  bins.add(black, G.lathe([[1e-4, colBot - 0.004], [S.colR - 0.003, colBot - 0.004], [S.colR + 0.0012, colBot - 0.001], [S.colR + 0.0012, colBot + 0.004], [1e-4, colBot + 0.004]].reverse(), 40));

  // ---------------- base -------------------------------------------------------------
  const probes = {};
  if (S.base === 'klap') {
    const hubY = S.hubY;
    const hubR = S.colR + 0.008;
    bins.add(frame, G.tube(V3(0, hubY - 0.04, 0), V3(0, hubY + 0.035, 0), hubR, 40));
    const legAng = folded ? 86 * DEG : S.legAng0;
    const aS = S.legLen * 0.45, eS = 0.021;         // strut pin on the leg: along / above the leg axis
    const collarR = S.colR + 0.005, rcp = collarR + 0.015;
    // strut length from the open geometry (collar pin at S.collarY)
    const pinOnLeg = (ang) => [S.pivotR + Math.cos(ang) * aS - Math.sin(ang) * eS, hubY + Math.sin(ang) * aS + Math.cos(ang) * eS];
    const pl0 = pinOnLeg(S.legAng0);
    const Ls = Math.hypot(rcp - pl0[0], S.collarY - pl0[1]);
    const pl = pinOnLeg(legAng);
    const cY = pl[1] + Math.sqrt(Math.max(0, Ls * Ls - (rcp - pl[0]) ** 2));
    for (const [, , a] of S.feet) {
      const out = V3(Math.sin(a), 0, Math.cos(a));
      const side = V3(0, 1, 0).cross(out).normalize();   // lateral (horizontal, perpendicular to the leg plane)
      const P = (r, y) => out.clone().multiplyScalar(r).setY(y);
      const dir = out.clone().multiplyScalar(Math.cos(legAng)).setY(Math.sin(legAng));
      const upN = out.clone().multiplyScalar(-Math.sin(legAng)).setY(Math.cos(legAng)); // in-plane normal above the leg
      const pivot = P(S.pivotR, hubY);
      const tip = pivot.clone().addScaledVector(dir, S.legLen);
      // hub clevis: two cheeks either side of the leg, rivet through
      for (const s of [-1, 1]) {
        bins.add(frame, plate(P(hubR + 0.011, hubY).addScaledVector(side, s * 0.0098), out, V3(0, 1, 0), side, 0.034, 0.034, 0.003, 0.008));
        bins.add(zinc, rivetHead(pivot.clone().addScaledVector(side, s * 0.0113), side.clone().multiplyScalar(s)));
      }
      // leg: oval tube 30 x 16 from just behind the pivot to the tube end
      bins.add(frame, G.prism(G.roundedRectProfile(0.016, 0.03, 0.0075, 5), pivot.clone().addScaledVector(dir, -0.011), tip, { side }));
      // foot glide: moulded boot over the tube end, flat sole
      const capC = out.clone().multiplyScalar(S.cap.c);
      const boot = G.roundedBox(S.cap.W, S.cap.H, S.cap.L, S.cap.r);
      boot.applyMatrix4(basis(V3(capC.x, S.cap.H / 2, capC.z), side, V3(0, 1, 0), out));
      if (folded) {
        // the boot rides on the tube end: rotate it with the leg about the pivot pin
        const m = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)
          .premultiply(new THREE.Matrix4().makeRotationAxis(side, -(legAng - S.legAng0)))
          .premultiply(new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z));
        boot.applyMatrix4(m);
      }
      bins.add(glideMat, boot);
      // strut clevis tabs on the leg, strut (flat bar 18 x 4), collar clevis
      const sp = pivot.clone().addScaledVector(dir, aS).addScaledVector(upN, eS);
      const cp = P(rcp, cY);
      for (const s of [-1, 1]) {
        bins.add(frame, plate(pivot.clone().addScaledVector(dir, aS).addScaledVector(upN, 0.0125).addScaledVector(side, s * 0.0037), dir, upN, side, 0.03, 0.026, 0.0025, 0.007));
        bins.add(zinc, rivetHead(sp.clone().addScaledVector(side, s * 0.005), side.clone().multiplyScalar(s), 0.0036, 0.0015));
        bins.add(frame, plate(P(collarR + 0.012, cY).addScaledVector(side, s * 0.0037), out, V3(0, 1, 0), side, 0.026, 0.026, 0.0025, 0.007));
        bins.add(zinc, rivetHead(cp.clone().addScaledVector(side, s * 0.005), side.clone().multiplyScalar(s), 0.0036, 0.0015));
      }
      const sd = cp.clone().sub(sp).normalize();
      const sw = side.clone().cross(sd).normalize(); // in-plane width direction of the strut
      bins.add(frame, G.prism(G.roundedRectProfile(0.0042, 0.018, 0.0018, 3), sp.clone().addScaledVector(sd, -0.009), cp.clone().addScaledVector(sd, 0.009), { side }));
      void sw;
      if (!folded && Math.abs(a - S.footAngle) < 1e-6) probes.floorFoot = [[capC.x + out.x * (S.cap.L / 2 + 0.006), 0.001, capC.z + out.z * (S.cap.L / 2 + 0.006)]];
    }
    // sliding collar with a welded boss and a star knob (pointing to the front, between two legs)
    bins.add(frame, G.tube(V3(0, cY - 0.028, 0), V3(0, cY + 0.028, 0), collarR, 40));
    for (const dy of [-0.028, 0.028]) bins.add(frame, G.lathe([[collarR - 0.001, dy - 0.0015], [collarR + 0.0012, dy], [collarR - 0.001, dy + 0.0015]].map(([r, y]) => [r, y + cY]), 40));
    const ka = S.footAngle - Math.PI / S.nLegs;
    const kv = V3(Math.sin(ka), 0, Math.cos(ka));
    bins.add(frame, G.tube(kv.clone().multiplyScalar(collarR - 0.003).setY(cY), kv.clone().multiplyScalar(collarR + 0.009).setY(cY), 0.0085, 24));
    bins.add(zinc, G.tube(kv.clone().multiplyScalar(collarR + 0.009).setY(cY), kv.clone().multiplyScalar(collarR + 0.013).setY(cY), 0.004, 14));
    bins.add(black, starKnob(kv.clone().multiplyScalar(collarR + 0.012).setY(cY), kv));
    S._collarY = cY;
  } else if (S.base === 'kruis') {
    const hubR = 0.06;
    bins.add(frame, G.lathe([[0.0001, 0.07], [S.colR + 0.006, 0.07], [hubR * 0.7, 0.045], [hubR, 0.012], [hubR, 0.0], [0.0001, 0.0]].reverse(), 48));
    for (const [, , a] of S.feet) {
      const out = V3(Math.sin(a), 0, Math.cos(a));
      const side = V3(0, 1, 0).cross(out).normalize();
      bins.add(frame, G.prism(G.roundedRectProfile(0.05, 0.022, 0.008, 3), out.clone().multiplyScalar(0.03).setY(0.026), out.clone().multiplyScalar(S.footR - 0.02).setY(0.018), { side }));
      const g = out.clone().multiplyScalar(S.footR - 0.03);
      bins.add(glideMat, G.tube(g.clone().setY(0.0), g.clone().setY(0.01), 0.018, 18));
    }
  } else {
    bins.add(frame, G.lathe([[0.0001, 0.0], [S.footR - 0.006, 0.0], [S.footR, 0.004], [S.footR - 0.004, 0.012], [S.colR + 0.04, 0.02], [S.colR + 0.006, 0.05], [0.0001, 0.05]], 96));
  }

  bins.build(group);
  if (!folded) {
    probes.top = [[Math.sin(34 * DEG) * 0.12, H + 0.0002, Math.cos(34 * DEG) * 0.12], [Math.sin(10 * DEG) * 0.25, H + 0.0002, Math.cos(10 * DEG) * 0.25]];
    probes.floorOpen = [[Math.sin(-30 * DEG) * 0.75, 0.001, Math.cos(-30 * DEG) * 0.75]];
  }

  const det = S.base === 'klap' ? klapDetails(S) : {};
  const view = {};
  let rig = L.statafelRig({ albedoL: top === 'berken' || top === 'hout' ? 0.55 : top.startsWith('hdpe') || top === 'wit' ? 0.75 : 0.12 });
  if (top === 'berken' || top === 'hout') { rig.default.exposure = 0.975; }
  if (S.base === 'klap') {
    // bare frame: the studio gets its back sheet and strip boxes (statafelLook.STATAFEL_ENV_KAAL) so the
    // lacquered top and the black powder coat carry soft reflections, and the floor shadow of the big
    // overhead box is kept tight enough (cone 9 deg) that every leg, strut and foot glide lays its own
    // soft shadow; contact occlusion reaches up the 3-8 cm the legs float above the floor, with a dark
    // line at each glide
    rig.default.envStudio = L.STATAFEL_ENV_KAAL;
    rig.default.floorKey = { azimuth: -20, elevation: 80, cone: 6 };
    rig.default.keyShadow = 0.55;
    // more sky directions and less blur than the covers: thin legs keep a defined shadow instead of being
    // smeared into the pool (160 directions keep the discrete copies of the legs from showing)
    rig.default.groundAO = { ...rig.default.groundAO, samples: 160, keySamples: 128, sigma: 0.004, blur: 1.0 };
    rig.default.contact = { strength: 0.75, h0: 0.02, res: 1024, blur: 1.8, wide: { strength: 0.65, h0: 0.08, sigma: 0.006 } };
    rig.detail = { ...rig.detail, contact: { strength: 0.75, h0: 0.02, res: 1024, blur: 1.5, wide: { strength: 0.65, h0: 0.08, sigma: 0.005 } } };
  }
  let meta = { D: S.D, H, top, base: S.base, folded, probes };
  let object = group;
  if (folded) {
    group.updateMatrixWorld(true);
    if (p.lean === false) {
      // stand the bare folded table on its lowest point (trolley loads)
      const box = new THREE.Box3().setFromObject(group);
      group.children.forEach((c) => { c.position.y -= box.min.y; });
    } else {
      const res = leanAgainstSweep(group, S, p);
      object = res.object;
      Object.assign(view, res.view);
      rig = L.statafelRig({ albedoL: 0.45 });
      rig.default.exposure = 0.8;
      // one high overhead box: the wall shadow and the floor shadow come from the same light
      rig.default.key = { azimuth: -32, elevation: 56, intensity: 2.1, cone: 18, mapSize: 2048, radius: 2.5 };
      rig.default.floorKey = null;
      rig.default.wallAmbient = 0.42;
      // baked studio sweep (engine _bakeWall): uniform hemisphere samples, cove-weighted floor + wall
      rig.default.groundAO = { ...rig.default.groundAO, samples: 160, wallSamples: 160, wallRes: 512 };
      // a VISIBLE wall (a light studio flat a shade darker than the floor, with a tight cove): the table
      // reads as leaning against something real, its shadow lands on a surface the buyer can see
      rig.default.cove = 0.03;
      rig.default.wallTone = { base: 0.925, top: 0.035, height: 1.6 };
      rig.default.envStudio = L.STATAFEL_ENV_KAAL;
      meta = { ...meta, contacts: res.contacts };
    }
  }
  return {
    object,
    dims: S,
    detail: folded ? { target: [0, H * 0.45, 0.05], size: 0.75, azimuth: 20, elevation: 10 } : det.detail,
    details: folded ? undefined : det.details,
    meta,
    view: Object.keys(view).length ? view : undefined,
    rig,
  };
}

// Detail views of the klap frame (see header).
function klapDetails(S) {
  const ka = S.footAngle - Math.PI / S.nLegs;
  const cY = S._collarY ?? S.collarY;
  const f0 = S.footAngle; // the foot nearest the hero camera
  return {
    // folding mechanism: collar + star knob in the upper part of the frame, struts and clevises,
    // hub and two foot glides below
    detail: { target: [Math.sin(ka) * 0.06 + 0.03, cY * 0.52, Math.cos(ka) * 0.06 + 0.1], size: 0.58, azimuth: 18, elevation: 16, shift: [0, -0.02] },
    details: {
      scharnier: { target: [0.02, S.hingeY + 0.004, 0.0], size: 0.2, azimuth: 52, elevation: -14 },
      voet: { target: [Math.sin(f0) * S.cap.c, 0.03, Math.cos(f0) * S.cap.c], size: 0.15, azimuth: 30, elevation: 20 },
      kraag: { target: [Math.sin(ka) * 0.03, cY, Math.cos(ka) * 0.03], size: 0.16, azimuth: 16, elevation: 10 },
    },
  };
}

// Folded table leaning back against a visible studio wall. The table is turned (yaw) so the camera
// sees the mechanism side at three-quarters (column, folded legs, hinge cheeks, lock knob) in
// front of the blad, whose rim rests against the sweep; the column end stands on the floor.
// Adds an invisible wall catcher (userData.catcher) that the engine renders as backdrop + shadows.
function leanAgainstSweep(group, S, p) {
  const yaw = Number(p.leanYaw ?? 8) * DEG, tilt = Number(p.leanTilt ?? 11) * DEG;
  const holder = new THREE.Group();
  holder.name = group.name + ' leaning';
  const inner = new THREE.Group();
  inner.add(group);
  // blad face to the sweep (-z), mechanism to the camera
  inner.rotation.y = Math.PI + yaw;
  const tiltG = new THREE.Group(); tiltG.add(inner); tiltG.rotation.x = -tilt;
  holder.add(tiltG);
  holder.updateMatrixWorld(true);
  // ground it: lowest vertex on y = 0
  const pts = [];
  const v = new THREE.Vector3();
  holder.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); pts.push(v.clone()); }
  });
  let minY = Infinity, minZ = Infinity, floorPt = null, wallPt = null;
  for (const q of pts) { if (q.y < minY) { minY = q.y; floorPt = q; } if (q.z < minZ) { minZ = q.z; wallPt = q; } }
  tiltG.position.y -= minY;
  floorPt = floorPt.clone().setY(0); wallPt = wallPt.clone().setY(wallPt.y - minY);
  // centre the footprint on x
  const shiftX = -(floorPt.x + wallPt.x) / 2;
  tiltG.position.x += shiftX; floorPt.x += shiftX; wallPt.x += shiftX;
  const zWall = minZ - 0.0004;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4).translate(0, 2, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  wall.position.set(0, 0, zWall);
  wall.userData = { catcher: true, noFrame: true, contacts: [[wallPt.x, wallPt.y, zWall, 0.05]] };
  wall.castShadow = false; wall.receiveShadow = true; wall.name = 'sweep (shadow catcher)';
  holder.add(wall);
  return {
    object: holder,
    contacts: { floor: floorPt.toArray(), wall: wallPt.toArray() },
    // hero from further round (the blad as an ellipse, column and folded legs in front of it: the mass
    // reads as one leaning package, the wall recedes so its corner with the floor shows the lean)
    view: { hero: { azimuth: 52, elevation: 12, fill: 0.84 }, front: { azimuth: 0, elevation: 6 }, side: { azimuth: 90, elevation: 6 } },
  };
}

// Outer edge band of a disc (from y = -T to 0) with rounded arrises of radius r.
function roundedDiscEdge(R, T, r) {
  const prof = [];
  const seg = 4;
  for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / seg); prof.push([R - r + Math.cos(a) * r, -T + r + Math.sin(a) * r]); }
  for (let i = 0; i <= seg; i++) { const a = (Math.PI / 2) * (i / seg); prof.push([R - r + Math.cos(a) * r, -r + Math.sin(a) * r]); }
  const g = G.lathe(prof, 192);
  // uv: u around (metres), v across thickness 0..1
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getX(i), pos.getZ(i));
    uv.setXY(i, (ang + Math.PI) * R, (pos.getY(i) + T) / T);
  }
  return g;
}

function planarUv(g) {
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) + 0.5, pos.getZ(i) + 0.5);
}



// ---------------------------------------------------------------------------------------
// Square (stackable, 4 splayed square-tube legs) and rectangular (two folding leg frames) statafels.
function statafelSquare(p, shape) {
  const W = Number(p.width ?? 0.7) > 5 ? Number(p.width) / 100 : Number(p.width ?? 0.7);
  const Dp = shape === 'rect' ? (Number(p.depth ?? 0.6) > 5 ? Number(p.depth) / 100 : Number(p.depth ?? 0.6)) : W;
  const H = Number(p.height ?? 1.1) > 5 ? Number(p.height) / 100 : Number(p.height ?? 1.1);
  const top = (p.top || 'zwart').toLowerCase();
  const T = top === 'berken' || top === 'hout' ? 0.018 : 0.012;   // compact HPL 12 mm, birch ply 18 mm
  const frame = frameMaterial(p.frame);
  const glide = M.rubber('#151515');
  const group = new THREE.Group();
  group.name = `statafel ${shape} ${Math.round(W * 100)}x${Math.round(Dp * 100)} ${top}`;
  const bins = new G.PartBin();
  const r = 0.004;
  // top slab
  const slab = G.roundedBox(W, T, Dp, r);
  slab.translate(0, H - T / 2, 0);
  planarUv(slab);
  if (top === 'berken' || top === 'hout') bins.add(birchTopFace(5), slab);
  else bins.add(topMaterial(top), slab);
  const tube = (a, b, w = 0.03) => G.prism(G.roundedRectProfile(w, w, 0.003, 2), a, b, { side: V3(0, 0, 1).cross(b.clone().sub(a).normalize()).lengthSq() > 1e-6 ? V3(0, 0, 1) : V3(1, 0, 0) });
  const yU = H - T - 0.002;
  if (shape === 'square') {
    // apron frame under the top + 4 legs splaying outward (stackable: the next table's legs slide outside these)
    const ix = W / 2 - 0.05, iz = Dp / 2 - 0.05;
    const corners = [[ix, iz], [-ix, iz], [-ix, -iz], [ix, -iz]];
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = corners[i], [x1, z1] = corners[(i + 1) % 4];
      bins.add(frame, G.prism(G.roundedRectProfile(0.02, 0.04, 0.003, 2), V3(x0, yU - 0.02, z0), V3(x1, yU - 0.02, z1), { side: V3(0, 1, 0) }));
    }
    const splay = 0.07;
    for (const [x, z] of corners) {
      const a = V3(x, yU, z), b = V3(x + Math.sign(x) * splay, 0.012, z + Math.sign(z) * splay);
      bins.add(frame, G.prism(G.roundedRectProfile(0.03, 0.03, 0.003, 2), a, b, { side: V3(1, 0, 0) }));
      bins.add(glide, G.roundedBox(0.034, 0.012, 0.034, 0.003).translate(b.x, 0.006, b.z));
    }
  } else {
    // two folding leg frames near the ends: two uprights, a foot bar on the floor and a rail under the top
    const fx = W / 2 - 0.12, fz = Dp / 2 - 0.07;
    for (const sx of [-1, 1]) {
      const x = sx * fx;
      for (const sz of [-1, 1]) bins.add(frame, G.tube(V3(x, 0.03, sz * fz), V3(x, yU, sz * fz), 0.016, 20));
      bins.add(frame, G.prism(G.roundedRectProfile(0.04, 0.03, 0.004, 2), V3(x, 0.018, -(Dp / 2 - 0.02)), V3(x, 0.018, Dp / 2 - 0.02), { side: V3(1, 0, 0) }));
      bins.add(frame, G.prism(G.roundedRectProfile(0.03, 0.03, 0.003, 2), V3(x, yU - 0.015, -fz), V3(x, yU - 0.015, fz), { side: V3(1, 0, 0) }));
      for (const sz of [-1, 1]) bins.add(glide, G.roundedBox(0.05, 0.008, 0.04, 0.003).translate(x, 0.004, sz * (Dp / 2 - 0.04)));
    }
    // folding brace between the frames
    bins.add(frame, G.tube(V3(-fx, 0.45, 0), V3(fx, 0.45, 0), 0.011, 16));
  }
  bins.build(group);
  const R = Math.max(W, Dp) / 2;
  return {
    object: group,
    dims: { W, D: Dp, H, top, shape },
    detail: { target: [W / 2 - 0.05, H - 0.04, Dp / 2 - 0.05], size: 0.45, azimuth: 34, elevation: 16 },
    meta: { W, D: Dp, H, top, shape, R },
  };
}
