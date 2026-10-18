// Klaptafel: blow-moulded HDPE folding table.
//
// { length, width, height, shape, diameter, color, frame, folded }
//   shape 'rechthoek' (default, 183 x 76 x 74) | 'rond' (diameter 1.8 / 1.5 / 1.2)
//   color top colour (default granite off-white), frame powder coat (default grijs)
//   folded: legs folded flat under the top, table stood on its long edge with the
//           underside (tack-off dimples, rails, folded legs) towards the camera.
//
// Construction: 45 mm blow-moulded top with rounded edges and a grid of moulded tack-off
// dimples on the underside; two steel C-rails under the long edges; per end a U leg
// frame (Ø25 tube, lower cross tube, hinge axle in brackets on the rails), plastic feet;
// two folding braces per frame (flat bar, knee hinge with a locking ring) to the rails.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function klaptafel(p = {}) {
  const round = String(p.shape || '').toLowerCase().startsWith('rond');
  let L = Number(p.length ?? 1.83), W = Number(p.width ?? 0.76), H = Number(p.height ?? 0.74);
  let D = Number(p.diameter ?? 1.8);
  if (L > 10) L /= 100; if (W > 5) W /= 100; if (D > 5) D /= 100; if (H > 5) H /= 100;
  if (round) { L = D; W = D; }
  const folded = !!p.folded;
  // catalogue colour: lichtgrijs (blow-moulded HDPE, light warm grey with a fine speckle)
  const TOPS = { lichtgrijs: '#C3C4BF', grijs: '#A9AAA5', wit: '#E6E6E2' };
  const topHex = TOPS[String(p.color || 'lichtgrijs').toLowerCase()] || M.resolveColor(p.color, '#C3C4BF');
  const topMat = F.hdpeGranite(topHex);
  const dimple = F.hdpeGranite(new THREE.Color(topHex).multiplyScalar(0.96).getHexString().replace(/^/, '#'));
  const steel = F.powder(p.frame || 'grijs');
  const cap = F.plastic('#1A1A1A', 0.6);
  const T = 0.045;
  const bins = new G.PartBin();

  // ---------------- top (top face at y = 0 in the top's own frame) ----------------
  if (round) {
    const R = D / 2, re = 0.016;
    const prof = [[0.0001, 0], [R - re, 0]];
    for (let i = 1; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); prof.push([R - re + Math.cos(a) * re, -re + Math.sin(a) * re]); }
    for (let i = 1; i <= 6; i++) { const a = -(Math.PI / 2) * (i / 6); prof.push([R - re + Math.cos(a) * re, -T + re + Math.sin(a) * re]); }
    prof.push([R - 0.05, -T], [R - 0.06, -T + 0.008], [0.0001, -T + 0.008]);
    const g = G.lathe(prof.reverse(), 160);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i) + pos.getY(i));
    bins.add(topMat, g);
  } else {
    const { faces, band } = F.slab(L, W, T, { rc: 0.05, re: 0.016 });
    bins.add(topMat, faces); bins.add(topMat, band);
  }
  // underside tack-off dimples (moulded), on a grid
  const sp = 0.115;
  for (let ix = -20; ix <= 20; ix++) for (let iz = -10; iz <= 10; iz++) {
    const x = ix * sp + ((iz & 1) ? sp / 2 : 0), z = iz * sp * 0.866;
    const inside = round ? Math.hypot(x, z) < D / 2 - 0.12 : Math.abs(x) < L / 2 - 0.1 && Math.abs(z) < W / 2 - 0.09;
    if (!inside) continue;
    bins.add(dimple, G.lathe([[0.0001, 0.0], [0.011, 0.0], [0.015, 0.003], [0.0001, 0.003]].reverse(), 16).translate(x, -T - 0.0025, z));
  }

  // ---------------- frame (in the top's frame: underside at y = -T) ----------------
  const yR = -T - 0.012;
  const railZ = round ? 0.26 : W / 2 - 0.065;
  const railX = round ? D / 2 - 0.22 : L / 2 - 0.06;
  for (const s of [-1, 1]) {
    // C-channel rail (30 x 20) screwed into the top
    bins.add(steel, G.prism(G.roundedRectProfile(0.02, 0.03, 0.003, 2), V3(-railX, yR, s * railZ), V3(railX, yR, s * railZ), { side: V3(0, 1, 0) }));
  }
  const legX = round ? D / 2 - 0.42 : L / 2 - 0.14;
  const legLen = H - T - 0.026; // pivot axle to floor
  const r = 0.0127;
  for (const sx of [-1, 1]) {
    const px = sx * legX, py = yR - 0.004;
    // hinge brackets on the rails
    for (const s of [-1, 1]) bins.add(steel, G.roundedBox(0.05, 0.03, 0.004, 0.0015).translate(px, py + 0.002, s * (railZ - 0.012)));
    // leg direction: down when standing, along the underside (towards the centre) when folded
    const dir = folded ? V3(-sx, 0, 0) : V3(0, -1, 0);
    const zl = railZ - 0.03;
    const foot = (s) => V3(px, py, s * zl).addScaledVector(dir, legLen);
    // U frame: axle + two legs; lower cross tube
    const uPts = [V3(px, py, -zl), V3(px, py, zl)];
    bins.add(steel, G.tube(uPts[0].clone().setZ(-railZ + 0.018), uPts[1].clone().setZ(railZ - 0.018), 0.008, 12));
    for (const s of [-1, 1]) {
      bins.add(steel, G.tube(V3(px, py, s * zl), foot(s), r, 18));
      // plastic foot cap
      const f = foot(s);
      bins.add(cap, F.latheAt([[0.0001, 0], [r + 0.003, 0], [r + 0.0035, 0.004], [r + 0.0025, 0.03], [0.0001, 0.03]], f.clone().addScaledVector(dir, 0.008), dir.clone().negate(), 18));
    }
    const c0 = V3(px, py, -zl).addScaledVector(dir, legLen - 0.12), c1 = V3(px, py, zl).addScaledVector(dir, legLen - 0.12);
    bins.add(steel, G.tube(c0, c1, 0.0095, 14));
    // braces: from the legs (40 % down) to the rails towards the centre, knee hinge + ring
    for (const s of [-1, 1]) {
      const a = V3(px, py, s * (zl - 0.004)).addScaledVector(dir, legLen * 0.42);
      const b = V3(px - sx * (folded ? legLen * 0.42 + 0.33 : 0.42), py + 0.004, s * (railZ - 0.016));
      const k = a.clone().lerp(b, 0.5);
      bins.add(steel, G.flatBar(a, k, 0.02, 0.004, V3(0, 0, 1)));
      bins.add(steel, G.flatBar(k, b, 0.02, 0.004, V3(0, 0, 1)));
      bins.add(M.chrome(), F.latheAt([[0.0001, -0.005], [0.006, -0.005], [0.006, 0.005], [0.0001, 0.005]], k, V3(0, 0, 1), 12));
      // locking ring over the knee
      const dirB = b.clone().sub(a).normalize();
      const ring = new THREE.TorusGeometry(0.013, 0.0035, 8, 20);
      ring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dirB));
      const rc = k.clone().addScaledVector(dirB, 0.03); ring.translate(rc.x, rc.y, rc.z);
      bins.add(steel, ring);
    }
  }
  const top = new THREE.Group();
  bins.build(top);
  const group = new THREE.Group(); group.name = `klaptafel ${round ? 'rond ' + D : L + 'x' + W}${folded ? ' folded' : ''}`;
  if (!folded) {
    top.position.y = H;
    group.add(top);
  } else {
    // stand on the long edge, underside to the front (+z)
    const pivot = new THREE.Group();
    pivot.add(top);
    pivot.rotation.x = -Math.PI / 2;
    group.add(pivot);
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    pivot.position.y = -box.min.y;
    pivot.position.z = -(box.min.z + box.max.z) / 2;
  }
  return {
    object: group,
    detail: folded ? { target: [L / 2 - 0.25, W / 2, 0.05], size: 0.5, azimuth: 30, elevation: 10 }
      : { target: [L / 2 - 0.14, H - 0.15, W / 2 - 0.06], size: 0.45, azimuth: 40, elevation: 12 },
    meta: { L, W, H, round, folded },
    // a big round top makes a broad sky shadow: keep it soft and open (no dark blotch)
    rig: S.seatRig(group, { default: round && !folded
      ? { groundAO: { maxZenith: 50, strength: 0.5, blur: 4.5 }, shadowFloor: 0.76, keyShadow: 0.3, contact: { strength: 0.5 } }
      : { groundAO: { maxZenith: 55, blur: 3.0 }, shadowFloor: 0.72 } }),
  };
}
