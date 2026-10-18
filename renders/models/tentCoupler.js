// Koppelset easy-up: two double clamps that lock the legs of two tents together.
//
// { line, count }
//   line  'professional' (50 mm hex legs, default) | 'premium' (40 mm)
//   count clamps in the set (2)
// Each clamp: two cast aluminium hexagonal collars (5.5 mm wall, flats facing each other)
// joined by a web; each collar is split at its outer flat, with two lugs and a zinc-plated
// wing bolt + hex nut that close it round the leg. Height 60 mm. The set lies as a tidy pair:
// one clamp standing, one lying on its side, shown a little smaller in frame (small part).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

// wing bolt: threaded shank along +Y from 0 to len, wing head at the top (two rounded wings
// in the XY plane, 3 mm thick, on a round boss)
function wingBolt(len, s = 1) {
  const parts = [];
  parts.push(G.tube(V3(0, -0.002, 0), V3(0, len, 0), 0.0039 * s, 14));
  for (let k = 0; k < Math.floor(len / 0.00125); k++) { const t = new THREE.TorusGeometry(0.0039 * s, 0.00045, 4, 14); t.rotateX(Math.PI / 2); t.translate(0, k * 0.00125, 0); parts.push(t); }
  parts.push(K.lathe([[0.0001, len], [0.0085 * s, len], [0.009 * s, len + 0.002 * s], [0.0068 * s, len + 0.012 * s], [0.0045 * s, len + 0.0135 * s], [0.0001, len + 0.0135 * s]], 28));
  for (const sg of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(0.004 * s, 0.001 * s); sh.lineTo(0.013 * s, 0.003 * s);
    sh.quadraticCurveTo(0.021 * s, 0.005 * s, 0.0205 * s, 0.013 * s);
    sh.quadraticCurveTo(0.019 * s, 0.02 * s, 0.012 * s, 0.017 * s);
    sh.lineTo(0.004 * s, 0.0115 * s); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.0026 * s, bevelEnabled: true, bevelThickness: 0.0006 * s, bevelSize: 0.0006 * s, bevelSegments: 2, curveSegments: 14 });
    g.translate(0, 0, -0.0013 * s);
    if (sg < 0) g.rotateY(Math.PI);
    g.translate(0, len, 0);
    parts.push(g);
  }
  return G.merge(parts);
}

// double clamp: two hexagonal collars side by side (flats facing each other, joined by a cast
// web), each split at its outer flat with two lugs and a wing bolt + nut to tighten it
function clamp(bins, mats, { AF = 0.05, H = 0.06 } = {}) {
  const t = 0.0055, gap = 0.003;
  const ai = (AF + 0.001) / 2, ao = ai + t; // apothems
  const ri = ai / Math.cos(Math.PI / 6), ro = ao / Math.cos(Math.PI / 6);
  const c = ao + 0.002;
  const quad = (pts) => { const sh = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z))); sh.closePath(); return sh; };
  for (const sx of [-1, 1]) {
    const cx = sx * c;
    // hex with flats facing +-x: vertices at 30 + k*60 deg
    for (let k = 0; k < 6; k++) {
      const a0 = (30 + k * 60) * DEG, a1 = (90 + k * 60) * DEG;
      const mid = (60 + k * 60) % 360; // direction of this flat
      const iv0 = [cx + Math.cos(a0) * ri, Math.sin(a0) * ri], iv1 = [cx + Math.cos(a1) * ri, Math.sin(a1) * ri];
      const ov0 = [cx + Math.cos(a0) * ro, Math.sin(a0) * ro], ov1 = [cx + Math.cos(a1) * ro, Math.sin(a1) * ro];
      const outerFlat = (sx > 0 && mid === 0) || (sx < 0 && mid === 180);
      if (!outerFlat) { bins.add(mats.alu, K.extrudeY(quad([iv0, iv1, ov1, ov0]), H, { bevel: 0.0012, bevelSegs: 2 })); continue; }
      // split flat: two halves with a gap, each with a lug
      const xm = cx + sx * ai, xo = cx + sx * ao;
      for (const sz of [-1, 1]) {
        const zEnd = sz * ri / 2, zG = sz * gap / 2;
        bins.add(mats.alu, K.extrudeY(quad(sz * sx > 0 ? [[xm, zG], [xm, zEnd], [xo, zEnd], [xo, zG]] : [[xm, zEnd], [xm, zG], [xo, zG], [xo, zEnd]]), H, { bevel: 0.0012, bevelSegs: 2 }));
        const lug = G.roundedBox(0.017, H * 0.62, 0.0062, 0.0022, 3);
        lug.translate(xo + sx * 0.0075, H / 2, sz * (gap / 2 + 0.0031));
        bins.add(mats.alu, lug);
      }
      // wing bolt through both lugs (+z side head), hex nut at the back
      const bx = xo + sx * 0.0095;
      const wb = wingBolt(0.03, 1.05); wb.rotateX(Math.PI / 2); // +Y -> +Z? rotateX(+90): y -> z
      wb.translate(bx, H / 2, -0.016);
      bins.add(mats.zinc, wb);
      const nut = K.hexNutGeo(0.013, 0.0065, 0.0); nut.rotateX(Math.PI / 2); nut.translate(bx, H / 2, -(gap / 2 + 0.0062 + 0.0033));
      bins.add(mats.zinc, nut);
    }
  }
  // cast web between the two collars + a rib on top and bottom
  const web = G.roundedBox(2 * (c - ao) + 0.004, H, ai * 1.0, 0.0015, 2); web.translate(0, H / 2, 0); bins.add(mats.alu, web);
}

export function tentCoupler(p = {}) {
  const pro = String(p.line || 'professional') !== 'premium';
  const AF = pro ? 0.0505 : 0.0405;
  const n = Number(p.count ?? 2);
  const mats = { alu: SG.castSG('#B2B7BC', { rough: 0.44 }), zinc: SG.zincSG() };
  const bins = new G.PartBin();
  const H = 0.06;
  const poses = [
    // one clamp standing, wing bolts towards the camera side
    { m: new THREE.Matrix4().makeRotationY(-8 * DEG).setPosition(-0.05, 0, -0.06) },
    // one lying on its side in front (collar axes horizontal), lugs up
    { m: new THREE.Matrix4().makeRotationY(24 * DEG).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).setPosition(0.07, 0, 0.1) },
  ];
  for (let i = 0; i < n; i++) {
    const sub = new G.PartBin();
    clamp(sub, mats, { AF, H });
    const pose = poses[i % 2].m.clone();
    if (i >= 2) pose.premultiply(new THREE.Matrix4().makeTranslation(0.2 * Math.floor(i / 2), 0, 0));
    let yMin = Infinity;
    for (const [, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(pose); geo.computeBoundingBox(); yMin = Math.min(yMin, geo.boundingBox.min.y); }
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.translate(0, -yMin, 0); bins.add(mat, geo); }
  }
  const g = K.finish(bins, `tentCoupler ${pro ? 50 : 40}`);
  return {
    object: g,
    detail: { target: [0, H / 2, 0], size: 0.16, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 30, fill: 0.64 } },
    rig: { default: { env: 'studio', envIntensity: 1.0, contact: { strength: 0.85, h0: 0.005, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { pro, n },
  };
}
