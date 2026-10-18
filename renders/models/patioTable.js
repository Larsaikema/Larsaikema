// Terrastafel (bistro / patio table) with a tilting top.
//
// { w, d, diameter, height, top, frame, base }
//   w x d  square/rectangular top (default 0.7 x 0.7 m); diameter -> round top
//   top    'zwart' | 'wit' | 'houtlook' | 'antraciet' (20 mm moulded outdoor laminate top
//          with rounded edges; houtlook = oak-print laminate)
//   frame  powder coat colour (default zwart)
//   base   'kruis' (default: cast 4-star foot with levelling glides) | 'rond' (cast disc)
// Construction: Ø60 steel column, flip-top mechanism (cross plate under the top, hinge
// head with a spring lever), height 74 cm.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;

function topMaterials(top) {
  const t = String(top || 'zwart').toLowerCase();
  if (t === 'houtlook' || t === 'hout' || t === 'eiken') {
    const face = S.woodMat('eiken', { stain: '#9C7A55', finish: 'lak', seed: 31 });
    return { face, edge: face };
  }
  const hex = t === 'wit' ? '#EDEDE9' : t === 'antraciet' ? '#3C3F43' : t === 'grijs' ? '#8D9093' : '#1E1F21';
  const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: t === 'wit' ? 0.42 : 0.36, specularIntensity: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.35, normalMap: null, name: `laminate ${hex}` });
  return { face: m, edge: m };
}

export function patioTable(p = {}) {
  let Wt = Number(p.w ?? 0.7), Dt = Number(p.d ?? Wt), H = Number(p.height ?? 0.75);
  if (Wt > 5) Wt /= 100; if (Dt > 5) Dt /= 100; if (H > 5) H /= 100;
  const round = p.diameter != null;
  let Dm = Number(p.diameter ?? 0.7); if (Dm > 5) Dm /= 100;
  const frame = F.powder(p.frame || 'zwart');
  const lever = F.plastic('#161616', 0.5);
  const glide = F.plastic('#141414', 0.6);
  const { face, edge } = topMaterials(p.top);
  const bins = new G.PartBin();
  const T = 0.012; // compact HPL 12 mm
  // top
  if (round) {
    const g = F.roundBoard(Dm / 2, T, { re: 0.004 });
    bins.add(face, g.translate(0, H, 0));
  } else {
    const { faces, band } = F.slab(Wt, Dt, T, { rc: 0.035, re: 0.004 });
    S.swapUV(band); // decor grain runs along the edge, not across it
    bins.add(face, faces.translate(0, H, 0)); bins.add(edge, band.translate(0, H, 0));
  }
  // flip-top mechanism (tilt-top): cross plates under the top, a cast hinge head on the column (two
  // cheeks with the pivot bolt and chrome caps, the top's bracket between them) and the release lever
  // that points out towards the front-right (the hero camera), so the hinge reads in the hero.
  const yU = H - T;
  for (const a of [45, 135]) {
    const v = V3(Math.sin(a * DEG), 0, Math.cos(a * DEG));
    const len = Math.min(Wt, Dt, round ? Dm : 9) * 0.62;
    bins.add(frame, G.flatBar(v.clone().multiplyScalar(-len / 2).setY(yU - 0.003), v.clone().multiplyScalar(len / 2).setY(yU - 0.003), 0.035, 0.005, V3(0, 1, 0).cross(v).normalize()));
  }
  bins.add(frame, G.roundedBox(0.13, 0.006, 0.13, 0.003).translate(0, yU - 0.008, 0));
  // top bracket (U channel hanging from the plate) between the cheeks
  bins.add(frame, G.roundedBox(0.05, 0.05, 0.11, 0.004).translate(0, yU - 0.036, 0));
  const yP = yU - 0.06; // pivot axis (along x)
  for (const s of [-1, 1]) {
    // cast cheek: rounded plate, wider at the bottom where it grips the column
    bins.add(frame, F.cushion(0.009, 0.1, 0.12, { r: 0.004, puff: 0, seg: [3, 10, 12] }).translate(s * 0.032, yP - 0.012, -0.004));
    bins.add(M.chrome(), F.latheAt([[0.0001, 0], [0.011, 0], [0.011, 0.002], [0.008, 0.006], [0.0001, 0.007]], V3(s * 0.037, yP, -0.01), V3(s, 0, 0), 20));
  }
  bins.add(M.chrome(), G.tube(V3(-0.04, yP, -0.01), V3(0.04, yP, -0.01), 0.006, 12));
  // release lever: steel arm from the head with a black moulded paddle, pointing to the front-right
  const ld = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
  const l0 = V3(0, yP - 0.03, 0).addScaledVector(ld, 0.03), l1 = V3(0, yP - 0.045, 0).addScaledVector(ld, 0.12);
  bins.add(frame, G.flatBar(l0, l1, 0.018, 0.005, V3(0, 1, 0)));
  bins.add(lever, F.cushion(0.03, 0.014, 0.07, { r: 0.006, puff: 0, seg: [4, 4, 8] }).applyMatrix4(new THREE.Matrix4().makeRotationY(34 * DEG)).translate(...V3(0, yP - 0.05, 0).addScaledVector(ld, 0.15).toArray()));
  // column
  const colR = 0.03, yHead = yP - 0.07;
  bins.add(frame, G.lathe([[0.0001, yHead - 0.03], [colR + 0.004, yHead - 0.03], [colR + 0.008, yHead - 0.02], [colR + 0.008, yHead + 0.02], [0.034, yHead + 0.04], [0.0001, yHead + 0.04]], 32));
  bins.add(frame, G.tube(V3(0, 0.06, 0), V3(0, yHead - 0.03, 0), colR, 32));
  // base
  const base = String(p.base || 'kruis').toLowerCase();
  if (base === 'rond') {
    const R = 0.23;
    bins.add(frame, G.lathe([[0.0001, 0.0], [R - 0.006, 0.0], [R, 0.004], [R - 0.004, 0.012], [colR + 0.05, 0.022], [colR + 0.006, 0.065], [0.0001, 0.065]], 96));
  } else {
    // cast hub + four tapered flat legs with levelling glides
    bins.add(frame, G.lathe([[0.0001, 0.085], [colR + 0.004, 0.085], [0.05, 0.06], [0.055, 0.02], [0.05, 0.008], [0.0001, 0.008]].reverse(), 48));
    const footR = 0.31;
    for (const a of [45, 135, 225, 315]) {
      const out = V3(Math.sin(a * DEG), 0, Math.cos(a * DEG));
      const side = V3(0, 1, 0).cross(out).normalize();
      const pts = [];
      // tapered: profile height 40 -> 22 mm, width 45 -> 32 mm (approximated by two prisms)
      bins.add(frame, G.prism(G.roundedRectProfile(0.045, 0.036, 0.008, 3), out.clone().multiplyScalar(0.035).setY(0.042), out.clone().multiplyScalar(footR * 0.55).setY(0.034), { side }));
      bins.add(frame, G.prism(G.roundedRectProfile(0.036, 0.026, 0.007, 3), out.clone().multiplyScalar(footR * 0.55).setY(0.034), out.clone().multiplyScalar(footR - 0.012).setY(0.028), { side }));
      bins.add(frame, G.lathe([[0.0001, 0], [0.019, 0], [0.019, 0.012], [0.0001, 0.012]].reverse(), 20).translate(...out.clone().multiplyScalar(footR - 0.02).setY(0.016).toArray()));
      const g = out.clone().multiplyScalar(footR - 0.02);
      bins.add(glide, G.lathe([[0.0001, 0], [0.021, 0], [0.022, 0.006], [0.018, 0.012], [0.0001, 0.012]].reverse(), 24).translate(g.x, 0, g.z));
      bins.add(M.chrome(), G.tube(g.clone().setY(0.011), g.clone().setY(0.03), 0.005, 8));
    }
  }
  const group = new THREE.Group(); group.name = `patioTable ${p.top || 'zwart'}`;
  bins.build(group);
  const cR = round ? Dm / 2 : Math.min(Wt, Dt) / 2;
  return {
    object: group,
    detail: { target: [cR * 0.7, H - 0.02, cR * 0.7], size: 0.35, azimuth: 40, elevation: 18 },
    meta: { Wt, Dt, H, round },
    // a wide, low product: 74 % instead of 80 % of the frame, so it does not crowd the tile
    // and seen from a little lower (12 deg) than the other furniture, so the tilt-top hinge head and its
    // release lever under the top are in the hero (the selling point: the top tilts up)
    view: { hero: { fill: 0.74, elevation: 12 } },
    rig: S.seatRig(group),
  };
}
