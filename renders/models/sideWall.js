// Losse zijwand (side wall panel) for a stretchtent or a veranda / terrasoverkapping, packshot standing upright.
//
// sideWall { length = 3, height = 2.3, color = 'zwart', type = 'panorama' | 'window' | 'closed', zips = true,
//            poles = 0 | 2 (stretch startwand: two wooden poles), rail = false (top rail for an overkapping) }
// PVC panel (M.pvcCloth, opaque) with welded hems, hanging from eyelets on a top rope (poles) or a top rail, a soft drape
// (a few cm of belly, waves towards the hem that rests on the floor), a clear PVC window (panorama: almost the full width,
// window: a centred rectangle) built as a real opening in the panel, and a dark zip along both sides.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;

export function sideWall(p = {}) {
  const L = Number(p.length ?? 3), H = Number(p.height ?? 2.3);
  const color = p.color || 'zwart';
  const type = String(p.type || 'panorama');
  const nz = makeNoise2(17);
  const cloth = M.pvcCloth(color, { translucent: false });
  const win = M.pvcWindow();
  const bins = new G.PartBin();
  const yTop = H, y0 = 0.0;
  // drape: belly between the hang points, irregular vertical folds, stronger towards the hem
  const dz = (x, y) => {
    const t = 1 - (y - y0) / (yTop - y0);
    return 0.025 * Math.sin(Math.PI * (x / L + 0.5)) * (0.4 + 0.6 * t) + 0.012 * t * nz.fbm(x * 2.2, 3.1, 2);
  };
  // window rectangle (in panel coordinates, x from -L/2..L/2, y from 0..H)
  const wx = type === 'panorama' ? L / 2 - 0.22 : Math.min(0.75, L / 2 - 0.3);
  const wy0 = type === 'panorama' ? 0.75 : 0.9, wy1 = type === 'panorama' ? H - 0.35 : Math.min(H - 0.4, 1.6);
  const rect = (x0, x1, y0r, y1r, mat, nx = 24, ny = 24) => {
    bins.add(mat, G.surface((u, v, o) => { const x = x0 + (x1 - x0) * u, y = y0r + (y1r - y0r) * v; o.set(x, y, dz(x, y)); }, nx, ny));
  };
  if (type === 'closed') {
    rect(-L / 2, L / 2, y0, yTop, cloth, 48, 40);
  } else {
    rect(-L / 2, L / 2, y0, wy0, cloth, 48, 12);            // below the window
    rect(-L / 2, L / 2, wy1, yTop, cloth, 48, 8);           // above
    rect(-L / 2, -wx, wy0, wy1, cloth, 6, 20);              // left of the window
    rect(wx, L / 2, wy0, wy1, cloth, 6, 20);                // right
    rect(-wx, wx, wy0, wy1, win, 40, 20);                   // clear PVC window
    // welded window frame: a slightly raised band round the opening
    const band = (a, b) => bins.add(cloth, G.tube(V3(a[0], a[1], dz(a[0], a[1]) + 0.002), V3(b[0], b[1], dz(b[0], b[1]) + 0.002), 0.004, 8));
    band([-wx, wy0], [wx, wy0]); band([-wx, wy1], [wx, wy1]); band([-wx, wy0], [-wx, wy1]); band([wx, wy0], [wx, wy1]);
  }
  // hems: welded edge all round
  const hem = (a, b) => bins.add(cloth, G.tube(V3(a[0], a[1], dz(a[0], a[1])), V3(b[0], b[1], dz(b[0], b[1])), 0.006, 8));
  hem([-L / 2, yTop - 0.02], [L / 2, yTop - 0.02]); hem([-L / 2, 0.01], [L / 2, 0.01]);
  // zips along both sides
  if (p.zips !== false) {
    const tooth = M.zipTooth('#121213');
    for (const s of [-1, 1]) {
      const x = s * (L / 2 - 0.03);
      bins.add(tooth, G.tube(V3(x, 0.04, dz(x, 0.04) + 0.003), V3(x, yTop - 0.06, dz(x, yTop - 0.06) + 0.003), 0.004, 8));
    }
  }
  // eyelets along the top
  const ring = M.aluminium({ tone: '#C9CCD0', roughness: 0.28 });
  const n = Math.max(3, Math.round(L / 0.5));
  for (let i = 0; i <= n; i++) {
    const x = -L / 2 + 0.06 + (L - 0.12) * (i / n);
    bins.add(ring, F.ring(0.011, 0, 0.0025, { segs: 20 }).rotateX(Math.PI / 2).translate(x, yTop - 0.04, dz(x, yTop - 0.04) + 0.002));
  }
  const poles = Number(p.poles || 0);
  if (poles) {
    const wood = F.wood('eiken');
    for (const s of [-1, 1]) bins.add(wood, G.tube(V3(s * (L / 2 + 0.06), 0, 0), V3(s * (L / 2 + 0.06), H + 0.12, 0), 0.045, 20));
    // top rope between the poles, through the eyelets
    bins.add(M.webbing('#2A2B2D'), G.tube(V3(-L / 2 - 0.06, yTop - 0.04, 0), V3(L / 2 + 0.06, yTop - 0.04, 0), 0.005, 8));
  }
  if (p.rail) {
    bins.add(M.aluminium(), G.roundedBox(L + 0.2, 0.06, 0.06, 0.004).translate(0, yTop + 0.02, 0));
  }
  const g = new THREE.Group(); g.name = `sideWall ${type} ${L}x${H} ${color}`; bins.build(g);
  g.rotation.y = (Number(p.rotationY ?? -18)) * Math.PI / 180;
  const root = new THREE.Group(); root.add(g);
  return {
    object: root,
    detail: { target: [L / 2 - 0.05, 1.0, 0], size: 0.5, azimuth: 30, elevation: 8 },
    view: { hero: { elevation: 10, azimuth: 26 } },
    meta: { L, H, color, type },
  };
}
