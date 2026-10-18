// Los statafelblad (loose table top for a statafel), shown lying on the floor.
//
// { diameter, top, thickness }
//   diameter 0.6 / 0.7 / 0.8 (default) / 0.85 m (cm accepted)
//   top      'wit' (default) | 'zwart' | 'berken' | 'hdpe' | 'hdpe-grijs'
// Construction: 25 mm melamine-faced board (wit / zwart) with a 2 mm ABS edge band
// (kantenband) whose arrises are radiused, a few tenths proud of the faces; birch
// plywood 18 mm with visible plies (berken); blow-moulded 45 mm (hdpe). On the underside
// four threaded inserts for the statafel's mounting cross.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';

const { V3 } = G;

export function tableTop(p = {}) {
  let D = Number(p.diameter ?? p.d ?? 0.8); if (D > 5) D /= 100;
  const R = D / 2;
  const top = String(p.top || 'wit').toLowerCase();
  const bins = new G.PartBin();
  let T;
  if (top.startsWith('hdpe')) {
    T = 0.045;
    const mat = F.hdpeGranite(top.includes('grijs') ? '#9C9EA0' : '#E6E6E2');
    const g = F.roundBoard(R, T, { re: 0.012 });
    bins.add(mat, g.translate(0, T, 0));
  } else if (top === 'berken' || top === 'hout') {
    T = 0.018;
    const face = M.birchFace(), edge = M.birchEdge();
    bins.add(face, G.prism(G.circleProfile(R - 0.0025, 160), V3(0, 0.0005, 0), V3(0, T, 0)).translate(0, 0, 0));
    const e = F.roundBoard(R, T, { re: 0.0025, segs: 160 });
    const pos = e.attributes.position, uv = e.attributes.uv, nor = e.attributes.normal;
    for (let i = 0; i < pos.count; i++) if (Math.abs(nor.getY(i)) < 0.7) uv.setXY(i, Math.atan2(pos.getX(i), pos.getZ(i)) * R, (pos.getY(i) + T) / T);
    bins.add(edge, e.translate(0, T, 0));
  } else {
    T = Number(p.thickness ?? 0.025);
    const black = top === 'zwart';
    const face = M.laminate(black ? '#1B1C1E' : '#F1F1ED');
    const band = new THREE.MeshPhysicalMaterial({ color: black ? '#161719' : '#ECECE7', roughness: 0.3, specularIntensity: 0.6, clearcoat: 0.4, clearcoatRoughness: 0.25, name: 'ABS edge band' });
    const eb = 0.002, re = 0.0018;
    // faces (melamine) inside the band
    bins.add(face, G.prism(G.circleProfile(R - eb, 192), V3(0, 0.0004, 0), V3(0, T - 0.0002, 0)));
    // ABS band: lathe with radiused arrises, proud by 0.2 mm
    const prof = [];
    const x0 = R - eb - 0.0002;
    prof.push([x0, T + 0.0002]);
    for (let i = 0; i <= 5; i++) { const a = (Math.PI / 2) * (1 - i / 5); prof.push([R - re + Math.cos(a) * re, T + 0.0002 - re + Math.sin(a) * re]); }
    for (let i = 1; i <= 5; i++) { const a = -(Math.PI / 2) * (i / 5); prof.push([R - re + Math.cos(a) * re, re + Math.sin(a) * re]); }
    prof.push([x0, 0.0]);
    bins.add(band, G.lathe(prof.reverse(), 192));
    // threaded inserts on the underside (visible only from below)
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      bins.add(M.galvanised(), G.tube(V3(Math.sin(a) * 0.12, 0.0, Math.cos(a) * 0.12), V3(Math.sin(a) * 0.12, 0.001, Math.cos(a) * 0.12), 0.006, 12));
    }
  }
  const group = new THREE.Group(); group.name = `tableTop Ø${D} ${top}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [Math.sin(0.6) * R, T, Math.cos(0.6) * R], size: 0.18, azimuth: 34, elevation: 22 },
    meta: { D, top, T },
    view: { hero: { elevation: 30 }, front: { elevation: 24 } },
  };
}
