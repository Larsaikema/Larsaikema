// Tentelastieken met bal (ball bungees): a loop of 6 mm round elastic cord with a woven sheath, both
// ends held in a moulded Ø25 mm plastic ball. A loose group of loops lying on the floor, a few
// overlapping, every ball turned a little differently.
//
// { count, color, ball }
//   count  loops in the group (default 6)
//   color  cord colour (default zwart), ball: ball colour (default zwart)
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as M from '../js/materials.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;

export function tentElastics(p = {}) {
  const n = Math.max(1, Math.min(12, Math.round(Number(p.count ?? 6))));
  const cord = SG.rubberSG(M.resolveColor(p.color || 'zwart', '#161616'), { rough: 0.82 });
  const ballMat = SG.moulded(M.resolveColor(p.ball || 'zwart', '#161616'), { rough: 0.36, spec: 0.55 });
  const R = rng(17);
  const B = new G.PartBin();
  const r = 0.003, Rb = 0.0125;
  for (let i = 0; i < n; i++) {
    // ball position on a loose spiral, loop pointing away from it
    const a0 = (i / n) * TAU + R() * 0.5;
    const c = V3(Math.cos(a0) * (0.05 + 0.03 * (i % 2)), 0, Math.sin(a0) * (0.05 + 0.03 * (i % 2)));
    const dir = a0 + Math.PI * (0.85 + 0.3 * R());
    const len = 0.11 + 0.02 * R(), wid = 0.034 + 0.01 * R();
    const ctrl = [];
    const m = 14;
    for (let k = 0; k <= m; k++) {
      const t = k / m;                       // 0 and 1 at the ball, 0.5 at the far end of the loop
      const u = Math.sin(Math.PI * t);
      const along = len * u + 0.004 * Math.sin(5 * t + i);
      const across = wid * Math.sin(TAU * t) * (0.7 + 0.3 * u);
      const x = c.x + Math.cos(dir) * along - Math.sin(dir) * across;
      const z = c.z + Math.sin(dir) * along + Math.cos(dir) * across;
      const lift = (i % 3 === 0 && t > 0.3 && t < 0.7) ? 0.006 : 0;   // some loops cross over others
      ctrl.push(V3(x, r + lift, z));
    }
    const pts = K.smoothPath(ctrl, 90, true);
    B.add(cord, K.tubeAlong(pts, r, 12, { closed: true, up: V3(0, 1, 0) }));
    const ball = new THREE.SphereGeometry(Rb, 32, 24);
    ball.translate(c.x, Rb, c.z);
    B.add(ballMat, ball);
  }
  const g = K.finish(B, 'tentElastics');
  return {
    object: g,
    detail: { target: [0, 0.01, 0], size: 0.12, azimuth: 30, elevation: 40 },
    view: { hero: { elevation: 38 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.003, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 }, envIntensity: 1.0 } },
    meta: { count: n },
  };
}
