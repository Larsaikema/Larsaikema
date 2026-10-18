// Regengoot partytent (rain gutter between two tents).
//
// { length, color, width, mounted }
// A 42 cm wide length of PVC tarpaulin 650 g/m² (glossy coated skin over a coarse scrim,
// welded hems) with 30 mm hook tape stitched along both long edges (two stitch rows each):
// the tape grips the roof edges of the two tents, between them the gutter hangs as a channel
// and leads the water to the ends. Packshot (SG.stripPackshot): rolled up loosely at the back
// (the turns stack on the thick taped edges, so the roll ends are fuller than its waist and
// the hem spirals show), the free end comes off the top of the roll, drapes down and lies
// towards the viewer opened into its trough: flat bottom, steep walls, flanges with the hook
// tape; a welded end hem closes the free end.
// `mounted: true` (item scenes with two tents): the gutter as it hangs between two easy-ups.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function rainGutter(p = {}) {
  const L = Number(p.length ?? 3);
  const width = Number(p.width ?? 0.42);
  const color = p.color || 'wit';
  const hex = M.resolveColor(color, '#F3F3F0');
  const light = new THREE.Color(hex).getHSL({}).l > 0.5;
  const cloth = light ? L3.pvcSatin(hex, { rough: 0.4, coat: 0.25, weave: 0.3 }) : L3.pvcSatin(hex === '#1A1A1A' || color === 'zwart' ? '#1E1F21' : hex, { rough: 0.4, coat: 0.25, weave: 0.3 });
  const hook = SG.hookTape(light ? '#CBCCC8' : '#1B1C1D');
  const thr = SG.thread(light ? '#E9E8E3' : '#34353A', { sheen: light ? 0.3 : 0.8 });
  if (p.mounted) return mountedGutter({ L, width: Math.min(width, 0.36), cloth, velcroMat: hook, eave: Number(p.eave ?? 2.14), gap: Number(p.gap ?? 0.1) });
  const { object } = L3.gutterPackshot({ L, W: width, cloth, hook, thr, T: Math.min(width > 0.5 ? 1.0 : 0.82, L * 0.3), tapeW: 0.03, seed: 9, rot: 50, flange: width > 0.5 ? 0.06 : 0.05 });
  return {
    object,
    detail: { target: [0.3, 0.05, 0.6], size: 0.4, azimuth: 40, elevation: 32 },
    view: { hero: { elevation: 28, azimuth: 30 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 }, ...(light ? { exposure: 0.68, toneMapping: 'neutral', shoulder: 0.88 } : { key: { intensity: 3.6 }, fill: { azimuth: 80, elevation: 16, intensity: 1.4 }, rim: { azimuth: 150, elevation: 34, intensity: 1.4 }, exposure: 1.25 }) } },
    meta: { L, color },
  };
}

// Mounted between two easy-ups standing side by side along z (tent edges at x = +-gap/2, eave
// height `eave`): both hook-tape rims lie on the roof edges, the middle sags into a channel
// between the valances. For item scenes such as two tents + a gutter.
function mountedGutter({ L, width, cloth, velcroMat, eave, gap }) {
  const bins = new G.PartBin();
  const half = width / 2, nw = 40, nl = 120;
  const rows = [];
  for (let j = 0; j <= nw; j++) {
    const w = -half + width * (j / nw);
    const row = [];
    for (let i = 0; i <= nl; i++) {
      const z = -L / 2 + L * (i / nl);
      const endLift = 0.03 * Math.pow(Math.abs(2 * z / L), 6);
      const ax = Math.abs(w);
      const inGap = ax < gap / 2 + 0.03;
      const sag = 0.07 * (1 - Math.pow(Math.min(1, ax / (gap / 2 + 0.03)), 2)) * (1 - 0.3 * Math.pow(2 * z / L, 2));
      const y = eave + 0.035 + (inGap ? -sag : 0.5 * (ax - gap / 2 - 0.03)) + endLift;
      row.push(V3(w, y, z));
    }
    rows.push(row);
  }
  const geo = K.gridGeometry(rows, { closedU: false, flip: true });
  bins.add(cloth, geo);
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= nl; i++) { const z = -L / 2 + L * (i / nl); const ax = half - 0.016; pts.push(V3(s * ax, eave + 0.035 + 0.5 * (ax - gap / 2 - 0.03) + 0.03 * Math.pow(Math.abs(2 * z / L), 6) + 0.0015, z)); }
    bins.add(velcroMat, K.strapAlong(pts, 0.025, 0.002, { up: V3(-s * 0.45, 1, 0).normalize() }));
  }
  const g = K.finish(bins, 'rainGutter mounted');
  return { object: g, meta: { mounted: true, L } };
}
