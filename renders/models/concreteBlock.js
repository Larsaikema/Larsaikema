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

const { V3 } = G;

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
  const conc = K.concrete();
  const steel = K.hotDipGalv();
  const bins = new G.PartBin();
  const bev = 0.012, cV = 0.014; // edge chamfers: horizontal (bevel) and vertical (shape)
  const a = S / 2 - bev, b = Dz / 2 - bev;
  const hCh = forks ? 0.085 : 0, wCh = 0.15, zCh = Dz * 0.27;
  // upper block (with the pocket hole) from the channel roof to the top
  const top = chamferedRect(-a, a, -b, b, cV);
  const pw = 0.16, pd = 0.085, pocketDepth = 0.06;
  if (lifting === 'lepelgat') {
    const hole = new THREE.Path();
    hole.absellipse(0, 0, pw / 2, pd / 2, 0, Math.PI * 2, true);
    top.holes.push(hole);
  }
  const yTop0 = hCh;
  bins.add(conc, K.extrudeY(top, H - yTop0, { y0: yTop0, bevel: bev, bevelSegs: 1, curveSegs: 24 }));
  if (forks) {
    // three base strips between and outside the two fork channels; they overlap the upper
    // block by two bevels so no groove shows on the outer faces
    const zs = [[-Dz / 2, -zCh - wCh / 2], [-zCh + wCh / 2, zCh - wCh / 2], [zCh + wCh / 2, Dz / 2]];
    zs.forEach(([z0, z1], i) => {
      const sh = chamferedRect(-a, a, z0 + (i === 0 ? bev : bev), z1 - (i === 2 ? bev : bev), i === 1 ? 0.004 : cV * 0.5);
      bins.add(conc, K.extrudeY(sh, hCh + 2 * bev, { y0: 0, bevel: bev, bevelSegs: 1 }));
    });
  }
  // pocket floor + lifting spoon
  const extras = [];
  if (lifting === 'lepelgat') {
    const yF = H - pocketDepth;
    const floor = new THREE.Shape();
    floor.absellipse(0, 0, pw / 2 + 0.004, pd / 2 + 0.004, 0, Math.PI * 2, false);
    bins.add(conc, K.extrudeY(floor, 0.01, { y0: yF - 0.01, bevel: 0 }));
    // spoon: 12 mm plate standing across the pocket (x), rounded top with an eye, just proud of the top
    const sp = new THREE.Shape();
    const sw = 0.075, sTop = pocketDepth + 0.018, rTop = sw / 2;
    sp.moveTo(-sw / 2, -0.02); sp.lineTo(sw / 2, -0.02); sp.lineTo(sw / 2, sTop - rTop);
    sp.absarc(0, sTop - rTop, rTop, 0, Math.PI, false); sp.lineTo(-sw / 2, -0.02);
    const eye = new THREE.Path(); eye.absarc(0, sTop - rTop + 0.002, 0.017, 0, Math.PI * 2, true); sp.holes.push(eye);
    const g = new THREE.ExtrudeGeometry(sp, { depth: 0.012 - 0.003, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 32 });
    g.translate(0, 0, -0.006 + 0.0015);
    g.translate(0, yF, 0);
    bins.add(steel, g);
  } else {
    // protruding rebar loop
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI; pts.push(V3(Math.cos(t) * 0.07, H - 0.03 + Math.sin(t) * 0.09, 0)); }
    bins.add(steel, K.tubeAlong(pts, 0.008, 14));
  }
  const g = K.finish(bins, `concreteBlock ${wt}`, extras);
  return {
    object: g,
    detail: { target: [0, H - 0.01, 0], size: Math.min(0.42, S * 0.7), azimuth: 30, elevation: 38 },
    view: { hero: { elevation: 20 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.02, res: 1024, blur: 1.6 } } },
    meta: { weight: wt, size: [S, H, Dz] },
  };
}
