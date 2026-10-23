// Stoelverbinder (row connectors that lock the legs of neighbouring chairs into a straight row).
//
// { kinds: ['klapstoel', 'stapelstoel', ...] }   one connector per kind, side by side on the floor
//   klapstoel   injection-moulded black PP double clip for the Ø 25 mm front legs of the klapstoel: two C clips
//               (openings to the front, rounded lead-in lips) 36 mm apart on a ribbed web, 22 mm high; it
//               lies on its flat side so the figure-of-eight reads
//   stapelstoel zinc-plated 20 x 2,5 mm steel strip bent into a double hook: two inverted U hooks for the Ø 22
//               side rails of two metal stacking chairs, joined by a flat bridge; standing on its edge
//   banquet     same strip connector, a little wider (banquetstoel)
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as K4 from '../js/partsKit4.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const AZ = 34;

// C clip outline (shape plane): centre (cx, cy), inner / outer radius, opening `gap` (rad) centred on angle `dir`
function cClip(cx, cy, Ri, Ro, gap, dir) {
  const s = new THREE.Shape();
  const a0 = dir + gap / 2, a1 = dir - gap / 2 + TAU;
  const rm = (Ri + Ro) / 2, rr = (Ro - Ri) / 2 + 0.0004;
  s.moveTo(cx + Math.cos(a0) * Ro, cy + Math.sin(a0) * Ro);
  s.absarc(cx, cy, Ro, a0, a1, false);
  // rounded lip at the end, flared a little outwards
  s.absarc(cx + Math.cos(a1) * (rm + 0.0006), cy + Math.sin(a1) * (rm + 0.0006), rr, a1, a1 + Math.PI, false);
  s.absarc(cx, cy, Ri, a1, a0, true);
  s.absarc(cx + Math.cos(a0) * (rm + 0.0006), cy + Math.sin(a0) * (rm + 0.0006), rr, a0 + Math.PI, a0 + TAU, false);
  return s;
}

function plasticLinker(B, mat) {
  const sub = new G.PartBin();
  const H = 0.022, Ri = 0.0128, Ro = 0.0158, sep = 0.036;
  // openings towards shape +y (-> -z after extrudeY: towards the back) ... we turn the part afterwards
  for (const sx of [-1, 1]) sub.add(mat, K.extrudeY(cClip(sx * sep / 2, 0, Ri, Ro, 78 * DEG, Math.PI / 2), H, { bevel: 0.0008, bevelSegs: 2, curveSegs: 48 }));
  // web between the clips (behind the centres, away from the openings) with two ribs
  const web = new THREE.Shape(); const wx = sep / 2 - Ro * 0.6, wy0 = -Ro + 0.0005, wy1 = -0.004;
  web.moveTo(-wx, wy0); web.lineTo(wx, wy0); web.lineTo(wx, wy1); web.lineTo(-wx, wy1); web.lineTo(-wx, wy0);
  sub.add(mat, K.extrudeY(web, H, { bevel: 0.0008, bevelSegs: 2 }));
  const rib = new THREE.Shape(); rib.moveTo(-0.0012, wy1 - 0.001); rib.lineTo(0.0012, wy1 - 0.001); rib.lineTo(0.0012, 0.006); rib.lineTo(-0.0012, 0.006); rib.lineTo(-0.0012, wy1 - 0.001);
  sub.add(mat, K.extrudeY(rib, H * 0.8, { y0: H * 0.1, bevel: 0.0004, bevelSegs: 1 }));
  // a moulded grip tab on the back of the web
  const tab = new THREE.Shape(); tab.moveTo(-0.008, wy0 + 0.0004); tab.lineTo(0.008, wy0 + 0.0004); tab.quadraticCurveTo(0.009, wy0 - 0.006, 0.0, wy0 - 0.0065); tab.quadraticCurveTo(-0.009, wy0 - 0.006, -0.008, wy0 + 0.0004);
  sub.add(mat, K.extrudeY(tab, 0.004, { y0: H / 2 - 0.002, bevel: 0.0006, bevelSegs: 1 }));
  // openings towards the camera
  for (const [, l] of sub.bins) for (const g of l) g.rotateY(Math.PI);
  return sub;
}

function steelLinker(B, mat, { gauge = 0.022 } = {}) {
  const sub = new G.PartBin();
  const w = 0.02, t = 0.0025, rh = gauge / 2 + t / 2 + 0.0008;
  const pts = K4.planarPath([
    ['arc', 0.006, -25], ['line', 0.014], ['arc', rh, -180], ['line', 0.016], ['arc', 0.006, 90],
    ['line', 0.03],
    ['arc', 0.006, 90], ['line', 0.016], ['arc', rh, -180], ['line', 0.014], ['arc', 0.006, -25],
  ], { y: w / 2, step: 0.0008, heading: 115 });
  // strip standing on its edge: width along +Y, thickness in the floor plane
  sub.add(mat, K.sweep(pts, K.rrect(t, w, t * 0.45, 2), { normals: pts.map(() => V3(0, 1, 0)) }));
  return sub;
}

const boxOf = (bin) => { const bb = new THREE.Box3(); for (const [, l] of bin.bins) for (const g of l) { g.computeBoundingBox(); bb.union(g.boundingBox); } return bb; };

export function chairLinker(p = {}) {
  let kinds = p.kinds || [p.kind || 'klapstoel'];
  if (typeof kinds === 'string') kinds = [kinds];
  const B = new G.PartBin();
  const pp = SG.moulded('#161617', { rough: 0.42, spec: 0.55 });
  const zinc = SG.zincSG({ rough: 0.3 });
  const parts = kinds.map((k) => {
    const s = String(k).toLowerCase();
    if (s.startsWith('klap') || s.includes('kunststof')) return plasticLinker(B, pp);
    return steelLinker(B, zinc, { gauge: s.startsWith('banq') ? 0.025 : 0.022 });
  });
  // side by side across the frame (camera right), a little apart, the second one slightly turned
  const right = V3(Math.cos(AZ * DEG), 0, -Math.sin(AZ * DEG));
  const widths = parts.map((s) => { const b = boxOf(s); return Math.max(b.max.x - b.min.x, b.max.z - b.min.z); });
  const gap = 0.018;
  const tot = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let u = -tot / 2;
  parts.forEach((s, i) => {
    const bb = boxOf(s), c = bb.getCenter(V3());
    const at = right.clone().multiplyScalar(u + widths[i] / 2);
    const yaw = (AZ + (i % 2 ? -18 : 12)) * DEG;
    const m = new THREE.Matrix4().makeTranslation(at.x, 0, at.z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z));
    for (const [mat, l] of s.bins) for (const g of l) { g.applyMatrix4(m); B.add(mat, g); }
    u += widths[i] + gap;
  });
  const g = K.finish(B, `chairLinker ${kinds.join('+')}`);
  return {
    object: g,
    detail: { target: [0, 0.01, 0], size: 0.08, azimuth: 30, elevation: 35 },
    view: { hero: { elevation: 42 } },
    rig: L5.goodsRig({ tone: 'black', size: 0.12, extra: { exposure: 1.1, ...L5.flatLayRig().default } }),
    meta: { kinds },
  };
}
