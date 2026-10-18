// Loper per meter (event carpet runner, needle felt), packshot: rolled up loosely at the back, the free end coming off
// the top of the roll, draping down and lying flat towards the camera, so you see the width, the felt face and the
// thickness at the cut end.
//
// carpetRunner { width = 1 (m), length = 4 (m of runner in the shot), lying = 1.6 (m lying flat), color = 'rood' }
// Needle felt ~4.5 mm: matte, fibrous, no edge band (the roll's turns stack evenly). Built on softGoods.rollStrip.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as SG from '../js/softGoods.js';
import * as F from '../js/furniture.js';
import * as K from '../js/partsKit.js';

export function carpetRunner(p = {}) {
  const W = Number(p.width ?? 1);
  const L = Number(p.length ?? 4);
  const T = Number(p.lying ?? 1.6);
  const color = p.color || 'rood';
  const R = SG.rollStrip({ W, Ltot: L, T, tc: 0.0045, te: 0.0003, eb: 0.012, core: 0.05, flatten: 0.95, seed: 11, wave: 0.0009, foldAmp: 0.0015 });
  // needle felt: the coarse woven-upholstery material, matte, a touch darker so the felt does not read as satin
  const felt = F.upholstery(color, { coarse: true });
  const bins = new G.PartBin();
  bins.add(felt, R.geo);
  // the cut end: a thin strip that shows the felt's thickness
  const ed = [];
  for (let k = 0; k <= 80; k++) { const w = -W / 2 + 0.002 + (W - 0.004) * (k / 80); ed.push(R.at(w, 0.0015, 0.0002).p); }
  bins.add(felt, K.tubeAlong(ed, 0.0022, 6));
  const g = K.finish(bins, `carpetRunner ${W}x${L} ${color}`);
  g.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  g.rotation.y = (Number(p.rotationY ?? 55)) * Math.PI / 180;
  const root = new THREE.Group(); root.add(g);
  const light = new THREE.Color(M.resolveColor(color, '#B5161E')).getHSL({}).l > 0.5;
  return {
    object: root,
    detail: { target: [0.3, 0.01, 0.6], size: 0.4, azimuth: 40, elevation: 35 },
    view: { hero: { elevation: 26, azimuth: 30 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 }, ...(light ? {} : { exposure: 1.1 }) } },
    meta: { W, L, color },
  };
}
