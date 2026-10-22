// Afzetpaal (queue barrier post) with a retractable belt.
//
// { finish, belt, beltPrint, pair, span, beltLength, height }
//   finish     'rvs' (brushed stainless, default) | 'zwart' (black powder coat)
//   belt       belt colour (zwart default, rood, blauw, ...): 50 mm polyester webbing
//   beltPrint  print on the belt: {svg: "brand/tools/print-wordmark-klein.json" | name,
//              color} or {d, vb, color}; repeated along the belt on the visible face
//   pair       true: two posts with the belt pulled out between them (default span 1.7 m)
//   height     post height (0.99 m default)
// Construction: Ø63 mm tube on a weighted cast-iron base (Ø32 cm) under a stainless dome
// cover with a rubber floor ring; the cassette head has a moulded belt mouth (black ABS)
// and a four-way receiver band with clip slots; domed top cap. The belt end carries a
// stainless clip hooked into the receiving post.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { resolvePrint } from '../js/brandPrints.js';
import { stanchionParts } from './stanchionParts.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function post(bins, mats, x, H, { mouth = true, slotTowards = 1 } = {}) {
  const rT = 0.0315, Rb = 0.16;
  // rubber ring + dome base cover
  bins.add(mats.rubber, G.lathe([[0.0001, 0.0], [Rb - 0.004, 0.0], [Rb - 0.002, 0.003], [Rb - 0.004, 0.008], [0.0001, 0.008]].reverse(), 72).translate(x, 0, 0));
  const dome = [[0.0001, 0.0545], [rT + 0.004, 0.0545], [rT + 0.012, 0.05], [0.06, 0.042], [0.1, 0.03], [0.14, 0.018], [Rb - 0.003, 0.0115], [Rb, 0.008], [Rb - 0.002, 0.007]];
  bins.add(mats.polished, G.lathe(dome.reverse(), 96).translate(x, 0, 0));
  // tube
  const yHead = H - 0.07;
  bins.add(mats.tube, G.tube(V3(x, 0.05, 0), V3(x, yHead, 0), rT, 48));
  // collar ring at the base and under the head
  bins.add(mats.polished, G.lathe([[rT, 0.05], [rT + 0.004, 0.052], [rT + 0.004, 0.064], [rT, 0.066]], 48).translate(x, 0, 0));
  // head: black ABS receiver band with four clip slots, stainless top cap
  const y0 = yHead, y1 = H - 0.016;
  bins.add(mats.abs, G.lathe([[rT + 0.0008, y0], [rT + 0.0018, y0 + 0.003], [rT + 0.0018, y1 - 0.003], [rT + 0.0008, y1]], 48).translate(x, 0, 0));
  for (let k = 0; k < 4; k++) {
    const a = k * 90 * DEG + 45 * DEG;
    const n = V3(Math.sin(a), 0, Math.cos(a));
    bins.add(mats.slot, G.roundedBox(0.012, 0.03, 0.004, 0.0015).applyMatrix4(F.basis(n.clone().multiplyScalar(rT + 0.0014).add(V3(x, (y0 + y1) / 2 + 0.006, 0)), V3(0, 0, 1).cross(n).lengthSq() > 0.01 ? V3(0, 1, 0).cross(n) : V3(1, 0, 0), V3(0, 1, 0))));
  }
  bins.add(mats.polished, G.lathe([[0.0001, H], [0.012, H - 0.0005], [0.024, H - 0.004], [rT + 0.002, H - 0.01], [rT + 0.0025, y1 - 0.001], [rT + 0.0005, y1 - 0.002]].reverse(), 48).translate(x, 0, 0));
  if (mouth) {
    // belt mouth: moulded black guide facing the other post
    const yc = yHead - 0.03;
    bins.add(mats.abs, F.cushion(0.014, 0.068, 0.03, { r: 0.004, puff: 0, seg: [4, 8, 4] }).translate(x + slotTowards * (rT + 0.002), yc, 0));
    bins.add(mats.slot, G.roundedBox(0.004, 0.054, 0.006, 0.001).translate(x + slotTowards * (rT + 0.0085), yc, 0));
  }
  return { yBelt: yHead - 0.03, rT };
}

export function stanchion(p = {}) {
  // rope posts (ovaal head), the loose velours rope and the wall/sign parts: stanchionParts.js
  if (p.rope || p.head || p.parts || p.only || p.style) return stanchionParts(p);
  let H = Number(p.height ?? 0.99); if (H > 5) H /= 100;
  const finish = String(p.finish || 'rvs').toLowerCase();
  const pair = p.pair === true || p.pair === 'true' || p.span != null;
  const black = finish === 'zwart' || finish === 'black';
  const mats = {
    tube: black ? F.powder('zwart') : F.stainless(),
    polished: black ? F.powder('zwart') : F.stainlessPolished(),
    rubber: M.rubber('#151515'),
    abs: F.plastic('#141414', 0.42),
    slot: F.plastic('#050505', 0.8),
  };
  const beltMat = F.beltWebbing(p.belt || 'zwart');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `stanchion ${finish}${pair ? ' pair' : ''}`;
  const span = Number(p.span ?? 1.7);
  const xA = pair ? -span / 2 : 0, xB = span / 2;
  const { yBelt, rT } = post(bins, mats, xA, H, { mouth: true, slotTowards: 1 });
  const bw = 0.05, bt = 0.0012;
  if (pair) {
    post(bins, mats, xB, H, { mouth: false });
    // belt from the mouth of A to the clip at B (tensioned: a few mm of sag)
    const x0 = xA + rT + 0.012, x1 = xB - rT - 0.036;
    const sag = 0.006;
    const yAt = (x) => yBelt - sag * (1 - Math.pow((2 * (x - (x0 + x1) / 2)) / (x1 - x0), 2));
    const face = (z, front) => G.surface((u, v, o) => { const x = x0 + (x1 - x0) * u; o.set(x, yAt(x) - bw / 2 + bw * v, z); }, 60, 2, { flipNormals: !front });
    const fF = face(bt / 2, true), fB = face(-bt / 2, false);
    for (const g of [fF, fB]) { const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i)); }
    bins.add(beltMat, fF); bins.add(beltMat, fB);
    for (const s of [-1, 1]) bins.add(beltMat, F.sweep(Array.from({ length: 31 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / 30; return V3(x, yAt(x) + s * bw / 2, 0); }), G.roundedRectProfile(0.0008, bt, 0.0003, 1), { caps: true, up: V3(0, 1, 0) }));
    // clip: stainless body with a black tongue in the receiver slot
    const yc = yAt(x1);
    bins.add(mats.polished, F.cushion(0.03, bw + 0.012, 0.012, { r: 0.004, puff: 0, seg: [6, 8, 4] }).translate(x1 + 0.014, yc, 0));
    bins.add(mats.abs, G.roundedBox(0.012, 0.026, 0.004, 0.0015).translate(xB - rT - 0.002, yc + 0.006, 0));
    // print, repeated along the visible (front) face
    const art = resolvePrint(p.beltPrint);
    if (art) {
      const span0 = x1 - x0 - 0.04;
      const tileLen = span0 / Math.max(1, Math.round(span0 / Number(p.beltPrint.tile ?? 0.42)));
      const tex = F.stripPrintTexture({ d: art.d, vb: art.vb, color: art.color || p.beltPrint.color || '#FFFFFF', tileLen, stripW: bw, fill: 0.56 });
      const pm = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.48, sheen: 0.4, sheenRoughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, name: 'belt print' });
      const pr = G.surface((u, v, o) => { const x = x0 + 0.02 + (x1 - x0 - 0.04) * u; o.set(x, yAt(x) - bw / 2 + bw * v, bt / 2 + 0.0002); }, 60, 2, { flipNormals: false });
      const pos = pr.attributes.position, uv = pr.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0 - 0.02) / tileLen, uv.getY(i));
      const m = new THREE.Mesh(pr, pm); m.castShadow = false; m.receiveShadow = true; m.userData.noFrame = true;
      group.add(m);
    }
  } else {
    // belt retracted: clip parked in the mouth
    bins.add(mats.polished, F.cushion(0.026, bw + 0.012, 0.012, { r: 0.004, puff: 0, seg: [6, 8, 4] }).translate(xA + rT + 0.026, yBelt, 0));
    bins.add(beltMat, G.roundedBox(0.012, bw, bt * 2, 0.0004).translate(xA + rT + 0.008, yBelt, 0));
  }
  bins.build(group);
  return {
    object: group,
    detail: { target: [xA + 0.02, yBelt, 0.02], size: 0.22, azimuth: 40, elevation: 12 },
    meta: { finish, pair, span },
    rig: S.seatRig(group, pair ? { default: { groundAO: { maxZenith: 60 } } } : {}),
  };
}
