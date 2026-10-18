// Betonblok ballast (concrete ballast block for stretch/star/large tents).
//
// { weight, lifting, size }
//   weight   140 | 500 (default) | 1000 kg -> 40³ / 60³ / 80 x 80 x 65 cm (density ~2.35 t/m³)
//   lifting  'lepelgat' (default): recessed pocket in the top with a cast-in steel lifting
//            spoon (plate anchor with eye); 'oog': protruding rebar loop
//   forks    true (default for 500/1000): two fork-lift channels through the base
// Construction: wet-cast block, all edges chamfered 15 mm, steel-formwork faces with
// blowholes and laitance mottling; the spoon is a 12 mm galvanised plate anchor standing
// in a 60 mm deep pocket, its eye just proud of the top face.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const DEG = Math.PI / 180;

function chamferedRect(x0, x1, z0, z1, c) {
  // shape in (x, -z) for extrudeY (shape y -> -z)
  const s = new THREE.Shape();
  const P = [[x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c], [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]];
  // counter-clockwise in shape space (x, -z): three only normalises hole winding then
  P.reverse().forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  return s;
}

export function concreteBlock(p = {}) {
  const wt = Number(p.weight ?? 500);
  const dims = wt <= 200 ? [0.4, 0.4, 0.4] : wt <= 700 ? [0.6, 0.6, 0.6] : [0.8, 0.65, 0.8];
  const [S, H, Dz] = p.size ? [p.size[0], p.size[1], p.size[2]] : dims;
  const forks = p.forks ?? wt > 200;
  const lifting = String(p.lifting || 'lepelgat');
  const conc = SG.concreteSG({ tone: '#AAA8A2' });
  const steel = SG.galvSG({ cell: 0.006, dull: 0.42 });
  const bins = new G.PartBin();
  const bev = 0.012, cV = 0.014; // edge chamfers: horizontal (bevel) and vertical (shape)
  const a = S / 2 - bev, b = Dz / 2 - bev;
  const hCh = forks ? 0.085 : 0, wCh = 0.15, zCh = Dz * 0.27;
  // upper block (with the pocket hole) from the channel roof to the top
  const top = chamferedRect(-a, a, -b, b, cV);
  // lifting lug: a galvanised round-bar loop (Ø 20 mm) cast in, standing proud of a shallow
  // trowelled recess in the middle of the top
  const recR = 0.11, recD = 0.012;
  if (lifting === 'lepelgat' || lifting === 'oog') {
    const hole = new THREE.Path(); hole.absarc(0, 0, recR, 0, Math.PI * 2, true); top.holes.push(hole);
  }
  const yTop0 = hCh;
  bins.add(conc, K.extrudeY(top, H - yTop0, { y0: yTop0, bevel: bev, bevelSegs: 1, curveSegs: 32 }));
  if (forks) {
    const zs = [[-Dz / 2, -zCh - wCh / 2], [-zCh + wCh / 2, zCh - wCh / 2], [zCh + wCh / 2, Dz / 2]];
    zs.forEach(([z0, z1], i) => {
      const sh = chamferedRect(-a, a, z0 + bev, z1 - bev, i === 1 ? 0.004 : cV * 0.5);
      bins.add(conc, K.extrudeY(sh, hCh + 2 * bev, { y0: 0, bevel: bev, bevelSegs: 1 }));
    });
  }
  const extras = [];
  {
    // recess: dished floor, soft rim
    bins.add(conc, K.lathe([[recR + 0.002, H - 0.0005], [recR - 0.006, H - recD * 0.7], [recR - 0.02, H - recD], [0.0001, H - recD]].reverse(), 64));
    // the loop: legs go down into the block, arch above the top
    const lr = 0.01, span = 0.07, rise = 0.085;
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push(V3(-span, H - recD - 0.06 + (i / 12) * 0.06, 0));
    for (let i = 1; i <= 50; i++) { const t = Math.PI - (i / 50) * Math.PI; pts.push(V3(Math.cos(t) * span, H - recD + Math.sin(t) * rise, 0)); }
    for (let i = 1; i <= 12; i++) pts.push(V3(span, H - recD - (i / 12) * 0.06, 0));
    const loop = K.tubeAlong(pts, lr, 20);
    loop.rotateY(28 * DEG);
    bins.add(steel, loop);
    // grout collars where the legs leave the concrete
    for (const sx of [-1, 1]) {
      const c = K.lathe([[lr + 0.012, H - recD], [lr + 0.004, H - recD + 0.006], [lr + 0.0005, H - recD + 0.008]], 24);
      c.translate(sx * span, 0, 0); c.rotateY(28 * DEG); bins.add(conc, c);
    }
  }
  const g = K.finish(bins, `concreteBlock ${wt}`, extras);
  return {
    object: g,
    detail: { target: [0, H - 0.01, 0], size: Math.min(0.42, S * 0.7), azimuth: 30, elevation: 38 },
    view: { hero: { elevation: 20, fill: 0.62 } },
    rig: { default: { contact: { strength: 0.95, h0: 0.012, res: 1024, blur: 1.4, wide: { h0: 0.05, sigma: 0.03, strength: 0.5 } }, groundAO: { strength: 0.85, maxZenith: 80 } } },
    meta: { weight: wt, size: [S, H, Dz] },
  };
}
