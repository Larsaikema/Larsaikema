// Zitkussen voor stoel en barkruk (seat pad), packshot lying on the floor.
//
// seatCushion { color = 'antraciet', w = 0.40, d = 0.40, h = 0.045, ties = true }
// Square pad with rounded corners and a slightly domed top, woven upholstery cover with piping on the top and bottom seams,
// and two strikbandjes (ties) at the back corners that lie loose on the floor.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as F from '../js/furniture.js';
import * as K from '../js/partsKit.js';

const { V3 } = G;

export function seatCushion(p = {}) {
  const w = Number(p.w ?? 0.40), d = Number(p.d ?? 0.40), h = Number(p.h ?? 0.045);
  const color = p.color || 'antraciet';
  const cover = F.upholstery(color);
  const bins = new G.PartBin();
  const r = 0.035;
  bins.add(cover, F.cushion(w, h, d, { r: 0.012, puff: 0.012, seg: [28, 6, 28] }).translate(0, h / 2, 0));
  // piping on the top and bottom seams
  for (const y of [h - 0.004, 0.006]) {
    const path = F.pipingPath(w - 0.004, d - 0.004, r, y, 10);
    path.push(path[0].clone());
    bins.add(cover, K.tubeAlong(path, 0.0028, 8));
  }
  // two ties from the back corners, lying loose on the floor
  if (p.ties !== false) {
    for (const s of [-1, 1]) {
      const x0 = s * (w / 2 - 0.03), z0 = -d / 2 + 0.01;
      const ctrl = [V3(x0, h * 0.45, z0), V3(x0 + s * 0.02, 0.012, z0 - 0.05), V3(x0 + s * 0.06, 0.0035, z0 - 0.14), V3(x0 + s * 0.04, 0.0035, z0 - 0.26)];
      const pts = K.smoothPath(ctrl, 48);
      bins.add(cover, K.strapAlong(pts, 0.015, 0.0025, { up: V3(0, 1, 0) }));
    }
  }
  const g = K.finish(bins, `seatCushion ${color}`);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.rotation.y = (Number(p.rotationY ?? 20)) * Math.PI / 180;
  const root = new THREE.Group(); root.add(g);
  return {
    object: root,
    detail: { target: [0, h, d / 2], size: 0.18, azimuth: 30, elevation: 25 },
    view: { hero: { elevation: 30, azimuth: 34 } },
    rig: K.smallRig(),
    meta: { w, d, h, color },
  };
}
