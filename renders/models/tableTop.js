// Los statafelblad (loose table top for a statafel), shown lying on the floor.
//
// { diameter, top, thickness }
//   diameter 0.7 / 0.8 (default) / 0.85 m (cm accepted)
//   top      'wit' (default) | 'zwart' | 'antraciet' | 'berken' | 'hdpe' | 'hdpe-grijs'
// Construction (catalogue: 18 mm): HPL-faced board (wit / zwart / antraciet) with a 2 mm ABS
// edge band (kantenband) whose arrises are radiused and that stands a few tenths proud of the
// face, so a fine shadow line separates face and band; the HPL face has a fine matte suede
// texture with a soft satin sheen. Birch plywood 18 mm (berken): rotary-cut birch face (upholstery2.birchPly),
// plies on the edge.
// On the underside four pre-drilled holes for the statafel's hinge bracket. The hero is shot a
// little higher (32 deg) so the round reads as a board with an edge, not as a white ellipse.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as TX from '../js/textures.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';

const { V3 } = G;
const HPL = { wit: ['#F1F0EB', '#E3E2DC'], zwart: ['#1B1C1E', '#141517'], antraciet: ['#3A3D41', '#33363A'] };
const cache = new Map();
function hpl(hex) {
  if (cache.has(hex)) return cache.get(hex);
  const nm = TX.stippleNormal({ size: 256, strength: 0.7, scale: 60, seed: 53 }).clone();
  nm.repeat.set(1 / 0.02, 1 / 0.02); nm.needsUpdate = true;
  const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.42, specularIntensity: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.22, normalMap: nm, normalScale: new THREE.Vector2(0.12, 0.12), name: `HPL ${hex}` });
  cache.set(hex, m);
  return m;
}

export function tableTop(p = {}) {
  let D = Number(p.diameter ?? p.d ?? 0.8); if (D > 5) D /= 100;
  const R = D / 2;
  const top = String(p.top || 'wit').toLowerCase();
  const bins = new G.PartBin();
  let T;
  if (top.startsWith('hdpe')) {
    T = 0.045;
    const mat = F.hdpeGranite(top.includes('grijs') ? '#9C9EA0' : '#E6E6E2');
    bins.add(mat, F.roundBoard(R, T, { re: 0.012 }).translate(0, T, 0));
  } else if (top === 'berken' || top === 'hout') {
    T = Number(p.thickness ?? 0.018);
    // rotary-cut birch face (planar uv in metres, grain slightly off the camera axes), plies on the edge
    const face = U.birchPly(), edge = M.birchEdge();
    bins.add(face, U.planarUV(G.prism(G.circleProfile(R - 0.0025, 192), V3(0, 0.0005, 0), V3(0, T, 0)), { rot: 0.22 }));
    // edge ring only (radiused arrises, plies across the thickness); the faces are the birch prism
    const re = 0.0025, prof = [[R - 0.004, T]];
    for (let i = 0; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); prof.push([R - re + Math.cos(a) * re, T - re + Math.sin(a) * re]); }
    for (let i = 1; i <= 6; i++) { const a = -(Math.PI / 2) * (i / 6); prof.push([R - re + Math.cos(a) * re, re + Math.sin(a) * re]); }
    prof.push([R - 0.004, 0]);
    const e = G.lathe(prof.reverse(), 192);
    const pos = e.attributes.position, uv = e.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, Math.atan2(pos.getX(i), pos.getZ(i)) * R, pos.getY(i) / T);
    bins.add(edge, e);
  } else {
    T = Number(p.thickness ?? 0.018);
    const [fc, bc] = HPL[top] || HPL.wit;
    const face = hpl(fc);
    const band = new THREE.MeshPhysicalMaterial({ color: bc, roughness: 0.34, specularIntensity: 0.6, clearcoat: 0.45, clearcoatRoughness: 0.2, name: 'ABS edge band' });
    const shadowLine = new THREE.MeshPhysicalMaterial({ color: '#57534C', roughness: 0.7, name: 'band joint' });
    const eb = 0.002, re = 0.0016;
    // HPL faces (top and bottom) inside the band, planar uv in metres
    const faceG = G.prism(G.circleProfile(R - eb - 0.0006, 256), V3(0, 0.0003, 0), V3(0, T - 0.0002, 0));
    { const p2 = faceG.attributes.position, uv = faceG.attributes.uv; for (let i = 0; i < p2.count; i++) uv.setXY(i, p2.getX(i), p2.getZ(i)); }
    bins.add(face, faceG);
    // joint between face and band: a 0.6 mm dark gap, 0.4 mm deep
    bins.add(shadowLine, G.lathe([[R - eb - 0.0007, T - 0.0006], [R - eb + 0.0001, T - 0.0006]], 256));
    // ABS band: radiused arrises, 0.2 mm proud of the faces
    const prof = [];
    const x0 = R - eb;
    prof.push([x0, T + 0.0002]);
    for (let i = 0; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); prof.push([R - re + Math.cos(a) * re, T + 0.0002 - re + Math.sin(a) * re]); }
    for (let i = 1; i <= 6; i++) { const a = -(Math.PI / 2) * (i / 6); prof.push([R - re + Math.cos(a) * re, re - 0.0002 + Math.sin(a) * re]); }
    prof.push([x0, -0.0002]);
    bins.add(band, G.lathe(prof.reverse(), 256));
    // pre-drilled holes for the hinge bracket (underside)
    for (const [x, z] of [[-0.12, -0.05], [0.12, -0.05], [-0.12, 0.05], [0.12, 0.05]]) bins.add(shadowLine, G.tube(V3(x, 0.0, z), V3(x, 0.0004, z), 0.0025, 12));
  }
  const group = new THREE.Group(); group.name = `tableTop Ø${D} ${top}`;
  bins.build(group);
  return {
    object: group,
    detail: { target: [Math.sin(0.6) * R, T, Math.cos(0.6) * R], size: 0.16, azimuth: 34, elevation: 22 },
    meta: { D, top, T },
    view: { hero: { elevation: 32 }, front: { elevation: 24 } },
    // the key as a softbox at a real distance (falloff), lower and from the front-left: the face
    // carries a soft gradient and a white top is exposed a little above the backdrop, so it
    // reads as a lit board with an edge band rather than a flat white ellipse
    rig: (() => {
      const r = S.seatRig(group, { default: { key: { azimuth: -30, elevation: 40, distanceRel: 1.4, aimRel: [-0.3, 0, 0.3] } } });
      if (top === 'wit' || top.startsWith('hdpe')) r.default.exposure = Math.max(r.default.exposure, 0.76);
      // pale lacquered birch: exposed as the light wood it is
      if (top === 'berken' || top === 'hout') r.default.exposure = Math.max(r.default.exposure, 0.8);
      return r;
    })(),
  };
}
