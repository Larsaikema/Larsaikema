// Beschermplaat statafel (transparent table-top protector), optionally printed.
//
// { diameter, thickness, print, onCover, tableDiameter }
//   diameter   0.68 / 0.78 / 0.83 m (for Ø 70 / 80 / 85 cm tops)
//   print      {svg|name, color}: artwork printed on the UNDERSIDE (mirrored there, reads
//              right way round from above), opaque ink; the unprinted part stays clear
//   onCover    {type:'stretch'|'strik', color, topcover}: shown lying on a statafel with that
//              cover (table and cover are not part of the product; built by statafelCover)
// The plate: 2 mm flexible clear PVC with a rounded edge, glass-like transmission; its edge
// reads as a thin greenish-grey line and the studio softboxes reflect in the top. Hero view
// is a little higher than the catalogue default so the top is visible.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import { statafelCover } from './statafelCover.js';
import { statafel } from './statafel.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function protectionDisc(p = {}) {
  let D = Number(p.diameter ?? 0.78); if (D > 5) D /= 100;
  const T = Number(p.thickness ?? 0.002);
  const tableD = Number(p.tableDiameter ?? (D < 0.72 ? 0.7 : D < 0.81 ? 0.8 : 0.85));
  const group = new THREE.Group(); group.name = 'protectionDisc';
  let yTop = 0;
  if (p.onCover !== false) {
    const oc = typeof p.onCover === 'object' && p.onCover ? p.onCover : { type: 'stretch', color: 'zwart' };
    const res = oc.type ? statafelCover({ ...oc, diameter: tableDiameterOk(tableD) }) : statafel({ diameter: tableD });
    group.add(res.object);
    res.object.updateMatrixWorld(true);
    // top of the cover: highest point within the inner half of the top
    yTop = topHeight(res.object, tableD / 2 * 0.5);
  }
  const R = D / 2;
  // the plate: 2 mm clear flexible PVC. What a camera sees of it: the studio softbox mirrored
  // in its top as a broad soft band (drawn as a reflection map, per-pixel hashed coverage so
  // the cover shows through everywhere else), a faint grey-green tint, and the polished edge
  // as a crisp light rim round the top (an ellipse that outlines the disc).
  const reflTex = K.drawnTex('disc-reflection', 1024, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const band = (x0, y0, x1, y1, a, wd) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5 - wd, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5 - wd * 0.35, `rgba(255,255,255,${a})`); gr.addColorStop(0.5 + wd * 0.35, `rgba(255,255,255,${a})`);
      gr.addColorStop(0.5 + wd, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    };
    band(0.1 * w, 0.0, 0.62 * w, 1.0 * h, 0.62, 0.2);
    band(0.42 * w, 0.0, 0.98 * w, 1.0 * h, 0.22, 0.07);
    // faint overall sheen growing towards the far side (grazing reflection)
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.04)'); gr.addColorStop(1, 'rgba(255,255,255,0.2)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const discTop = new THREE.CircleGeometry(R - T / 2, 128);
  discTop.rotateX(-Math.PI / 2);
  discTop.rotateY(-30 * DEG);
  discTop.translate(0, yTop + T + 0.0004, 0);
  // reflection added on top of whatever lies below (additive, no noise)
  const topMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.64, 0.64), map: reflTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, name: 'clear pvc reflection' });
  const tm = new THREE.Mesh(discTop, topMat); tm.castShadow = false; tm.receiveShadow = false; tm.renderOrder = 3; group.add(tm);
  // a faint tint over the whole plate (hashed coverage ~12 %)
  const tint = new THREE.CircleGeometry(R - T / 2, 128); tint.rotateX(-Math.PI / 2); tint.translate(0, yTop + T + 0.0002, 0);
  const tintMat = SG.stochasticCover(new THREE.MeshPhysicalMaterial({ color: '#9FB3AE', roughness: 0.08, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.05, name: 'clear pvc tint' }), { constant: 0.1, salt: 9.7 });
  const tim = new THREE.Mesh(tint, tintMat); tim.castShadow = false; tim.receiveShadow = true;
  // polished edge: rounded rim + its vertical face (opaque, light grey-green glass look)
  const prof = [[R - T * 0.9, 0]];
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI; prof.push([R - T / 2 + Math.cos(a) * T / 2, T / 2 + Math.sin(a) * T / 2]); }
  prof.push([R - T * 0.9, T]);
  const edge = K.lathe(prof, 200);
  edge.translate(0, yTop + 0.0004, 0);
  const em = new THREE.Mesh(edge, K.cached('discEdge2', () => new THREE.MeshPhysicalMaterial({ color: '#D7E3DF', roughness: 0.06, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04, emissive: '#5E6B67', emissiveIntensity: 0.35, side: THREE.DoubleSide, name: 'pvc edge' })));
  em.castShadow = true; em.receiveShadow = true; group.add(em);
  if (p.print) {
    const spec = typeof p.print === 'object' ? p.print : { svg: p.print };
    const { tex, aspect } = K.printTex(spec, { color: spec.color || '#C83812', px: 2048 });
    // logo centred, about 45 % of the diameter; printed on the underside
    const s = D * 0.45;
    const w = aspect >= 1 ? s : s * aspect, h = aspect >= 1 ? s / aspect : s;
    const pg = new THREE.PlaneGeometry(w, h);
    pg.rotateX(-Math.PI / 2);
    // text up = away from the viewer (-z) so it reads from the front
    pg.translate(0, yTop + 0.0004 + 0.0003, 0);
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.45, roughness: 0.5, side: THREE.DoubleSide, name: 'disc print' });
    const m = new THREE.Mesh(pg, mat); m.castShadow = false; m.receiveShadow = true; group.add(m);
  }
  // frame the table top (the product), not the whole table: the cover/table do not take part
  // in the framing, a proxy box spans the plate and the upper part of the cover
  if (p.onCover !== false) {
    group.children.forEach((c) => { if (c !== tm && c !== tim && c !== em) SG.noFrame(c); });
    group.add(SG.frameProxy([-tableD / 2 - 0.01, yTop - 0.3, -tableD / 2 - 0.01], [tableD / 2 + 0.01, yTop + 0.005, tableD / 2 + 0.01]));
  }
  return {
    object: group,
    detail: { target: [Math.sin(34 * DEG) * R * 0.85, yTop, Math.cos(34 * DEG) * R * 0.85], size: 0.3, azimuth: 34, elevation: 22 },
    view: { hero: { elevation: 32, fill: 0.92 } },
    meta: { D, yTop },
  };
}

function tableDiameterOk(d) { return d; }

function topHeight(obj, rMax) {
  let y = 0;
  const v = new THREE.Vector3();
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 20000));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (v.x * v.x + v.z * v.z < rMax * rMax && v.y > y) y = v.y;
    }
  });
  return y;
}
