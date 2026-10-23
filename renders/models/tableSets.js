// Table sets (furniture group, round 5): several board-top folding tables as one arrangement.
// Called from banquetTable.js when a spec names `count` > 1.
//
//   klaptafel {shape: 'kwartrond', count: 4, arrangement: 'cirkel', diameter, width, top}
//     four quarter-round tables (banquetTable.js kwartrond: outer radius = diameter / 2, depth `width`,
//     default 0.76) round one centre, forming a ring (Ø 305 cm with an open middle of Ø 153); a 6 mm
//     joint between neighbours as two real tables leave. Other counts / arrangements: the quarters
//     follow each other round the same centre (2 = a half ring, 3 = three quarters). Angle 'top' looks
//     straight down (89 deg), so the ring reads as a circle.
import * as THREE from 'three';
import * as S from '../js/seatKit.js';
import { banquetTable } from './banquetTable.js';

export function tableRing(p = {}) {
  const n = Math.max(1, Math.min(4, Math.round(Number(p.count))));
  let D = Number(p.diameter ?? 3.05); if (D > 10) D /= 100;
  const R1 = D / 2;
  const one = { ...p, shape: 'kwartrond', length: R1 }; delete one.count; delete one.arrangement; delete one.diameter;
  const group = new THREE.Group(); group.name = `klaptafel kwartrond x${n}`;
  const gap = 0.006;
  let first = null;
  for (let k = 0; k < n; k++) {
    const t = banquetTable(one);
    if (!first) first = t;
    // banquetTable puts the annulus centre at (-R1/2, -R1/2): move it to the origin, then turn round it
    const inner = new THREE.Group(); inner.add(t.object); t.object.position.set(R1 / 2, 0, R1 / 2);
    const wrap = new THREE.Group(); wrap.add(inner);
    wrap.rotation.y = -k * Math.PI / 2;
    // open the joints a little: push each quarter out along its bisector
    const a = Math.PI / 4 + k * Math.PI / 2;
    wrap.position.set(Math.cos(a) * gap, 0, Math.sin(a) * gap);
    group.add(wrap);
  }
  const top = String(p.top || 'hout').toLowerCase();
  return {
    object: group,
    detail: { target: [R1 * 0.7, 0.72, R1 * 0.7], size: 0.6, azimuth: 40, elevation: 20 },
    meta: { ...(first.meta || {}), count: n, arrangement: p.arrangement || 'cirkel', D },
    // round 6: 'top' really from above (89 deg; the 62 deg preset drew the Ø305 ring as an oval, while the
    // alt text says "van boven gezien")
    view: { top: { elevation: 89, azimuth: 0, fill: 0.84 } },
    rig: (() => {
      const r = S.seatRig(group, { default: { groundAO: { maxZenith: 50, strength: 0.5, blur: 4.5 }, shadowFloor: 0.76, keyShadow: 0.3, contact: { strength: 0.5 } } });
      if (top === 'hout' || top.includes('berk')) r.default.exposure = Math.max(r.default.exposure, 0.8);
      return r;
    })(),
  };
}
