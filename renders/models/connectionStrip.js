// Verbindingsstrook easy-up (connection strip that closes the gap between two roofs).
//
// { length, color, width }
// A 30 cm strip of PVC-coated polyester 320 g/m² (the roof cloth, M.pvcCloth), hemmed along
// both long edges, with 30 mm hook tape stitched on top of each edge (two stitch rows) that
// grips the loop tape on the two roof edges. Packshot (SG.stripPackshot): rolled up loosely,
// the free end coming off the top of the roll and lying flat towards the viewer, tape up; the
// roll's turns stack on the taped edges (fuller ends, slight waist, hem spirals at the ends).
import * as THREE from 'three';
import * as M from '../js/materials.js';
import * as SG from '../js/softGoods.js';

export function connectionStrip(p = {}) {
  const L = Number(p.length ?? 3);
  const width = Number(p.width ?? 0.3);
  const color = p.color || 'wit';
  const hex = M.resolveColor(color, '#F3F3F0');
  const light = new THREE.Color(hex).getHSL({}).l > 0.5;
  const cloth = M.pvcCloth(color, { translucent: false });
  const hook = SG.hookTape(light ? '#CBCCC8' : '#1B1C1D');
  const thr = SG.thread(light ? '#E9E8E3' : '#34353A', { sheen: light ? 0.3 : 0.8 });
  const { object } = SG.stripPackshot({ kind: 'strip', L, W: width, cloth, hook, thr, T: Math.min(0.8, L * 0.28), tapeW: 0.03, seed: 5, rot: 50, curl: 0.024, humps: [[0.26, 0.022, 0.06, 0.35], [0.55, 0.012, 0.05, -0.2]], meander: 0.03 });
  return {
    object,
    detail: { target: [0.25, 0.01, 0.5], size: 0.3, azimuth: 40, elevation: 35 },
    view: { hero: { elevation: 28, azimuth: 30 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 }, ...(light ? { exposure: 0.68, toneMapping: 'neutral', shoulder: 0.88 } : { key: { intensity: 3.6 }, fill: { azimuth: 80, elevation: 16, intensity: 1.4 }, rim: { azimuth: 150, elevation: 34, intensity: 1.4 }, exposure: 1.25 }) } },
    meta: { L, color },
  };
}
