// Voetgewichten easy-up: stackable cast-iron foot weights (2 x 7,5 kg = 15 kg per leg).
//
// { count, stacks, kg, color, layout }
//   count   plates per stack (2 = one 15 kg foot weight)
//   stacks  number of stacks (4 = set van 4)
//   kg      weight cast into each plate (7.5 default)
//   color   coating (default black)
// Plate (catalogue spec): cast iron, black coated, Ø 25 cm, ~2.2 cm thick; a radial slot
// (54 mm) runs from the edge to the centre bore (Ø 60 mm) so the plate slides round the
// leg and rests on the foot plate; two grip holes either side of the slot. Cast details:
// a raised outer rim and hub ring on the top face, draft-rounded edges, sand-cast grain
// under the satin coating, raised lettering '7,5 KG' and the brand on the top face.
// The slots of a set face the viewer slightly turned, so every stack shows how it fits.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as TX from '../js/textures.js';

const { V3 } = G;
const TAU = Math.PI * 2;

function coatedIron(color = '#1C1D1F') {
  return K.cached(`coatedIron:${color}`, () => {
    const m = new THREE.MeshPhysicalMaterial({
      color, metalness: 0, roughness: 0.5, specularIntensity: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.42,
      normalMap: TX.stippleNormal({ size: 256, strength: 1.5, scale: 34, seed: 101 }).clone(), normalScale: new THREE.Vector2(0.16, 0.16), name: `coated cast iron ${color}`,
    });
    m.normalMap.repeat.set(45, 45); m.normalMap.needsUpdate = true;
    return m;
  });
}

// plate outline with slot + bore + grip holes; local +X = slot direction
export function plateShape({ R = 0.125, slotHalf = 0.027, bore = 0.03 } = {}) {
  const sh = new THREE.Shape();
  const aR = Math.asin(slotHalf / R), aB = Math.asin(Math.min(0.99, slotHalf / bore));
  sh.moveTo(Math.cos(aR) * R, Math.sin(aR) * R);
  sh.absarc(0, 0, R, aR, TAU - aR, false);
  sh.lineTo(Math.cos(aB) * bore, -slotHalf);
  sh.absarc(0, 0, bore, -aB, aB - TAU, true);
  sh.lineTo(Math.cos(aR) * R, slotHalf);
  for (const sg of [-1, 1]) {
    const c = sg * 0.62 * Math.PI * 0.5, rc = R - 0.037, gr = 0.0115, gl = 0.026;
    const cx = Math.cos(c) * rc, cy = Math.sin(c) * rc, tx = -Math.sin(c), ty = Math.cos(c);
    const grip = new THREE.Path();
    grip.moveTo(cx - tx * gl / 2 + Math.cos(c) * gr, cy - ty * gl / 2 + Math.sin(c) * gr);
    grip.absarc(cx - tx * gl / 2, cy - ty * gl / 2, gr, c, c + Math.PI, true);
    grip.absarc(cx + tx * gl / 2, cy + ty * gl / 2, gr, c + Math.PI, c + TAU, true);
    sh.holes.push(grip);
  }
  return sh;
}

// ring band on the top face (annulus with the slot cut out), as a separate raised moulding
function ringShape(r0, r1, slotHalf) {
  const sh = new THREE.Shape();
  const a1 = Math.asin(slotHalf / r1), a0 = Math.asin(Math.min(0.99, slotHalf / r0));
  sh.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
  sh.absarc(0, 0, r1, a1, TAU - a1, false);
  sh.lineTo(Math.cos(a0) * r0, -Math.sin(a0) * r0);
  sh.absarc(0, 0, r0, -a0, a0 - TAU, true);
  sh.closePath();
  return sh;
}

export function weightPlateGeo({ R = 0.125, h = 0.022, slotHalf = 0.027, bore = 0.03 } = {}) {
  const bev = 0.0028;
  const base = K.extrudeY(plateShape({ R, slotHalf, bore }), h, { bevel: bev, bevelSegs: 3, curveSegs: 96 });
  // raised rim and hub ring (1.6 mm) on top
  const rim = K.extrudeY(ringShape(R - 0.011, R - 0.0035, slotHalf + 0.0035), 0.0022, { y0: h - 0.0006, bevel: 0.0007, bevelSegs: 2, curveSegs: 96 });
  const hub = K.extrudeY(ringShape(bore + 0.0035, bore + 0.011, slotHalf + 0.0035), 0.002, { y0: h - 0.0006, bevel: 0.0007, bevelSegs: 2, curveSegs: 64 });
  return { base, rim, hub };
}

export function gewichten(p = {}) {
  const n = Number(p.count ?? 2), stacks = Number(p.stacks ?? 4);
  const kg = Number(p.kg ?? 7.5);
  const iron = coatedIron(p.color === 'rood' ? '#7E1A1C' : p.color && p.color.startsWith('#') ? p.color : '#1C1D1F');
  const R = 0.125, h = 0.022;
  const bins = new G.PartBin();
  const extras = [];
  const label = String(kg).replace('.', ',') + ' KG';
  const markMat = (() => { const m = iron.clone(); m.normalMap = K.embossTextNormal(label, { w: 512, h: 150, strength: 5 }); m.normalScale = new THREE.Vector2(1.6, 1.6); m.name = 'plate label'; return m; })();
  const brandMat = (() => { const m = iron.clone(); m.normalMap = K.embossTextNormal('KLAPKLAAR', { w: 640, h: 110, strength: 4 }); m.normalScale = new THREE.Vector2(1.4, 1.4); m.name = 'plate brand'; return m; })();
  // layout: stacks in a grid (2 x 2 for four), slot towards the viewer's left-front
  const cols = stacks <= 2 ? stacks : Math.ceil(Math.sqrt(stacks));
  const rowsN = Math.ceil(stacks / cols);
  const pitch = 2 * R + 0.035;
  const slotYaw = (p.slotYaw ?? -100) * Math.PI / 180; // world yaw of the slot (+X rotated)
  for (let s = 0; s < stacks; s++) {
    const ci = s % cols, ri = Math.floor(s / cols);
    const x = (ci - (cols - 1) / 2) * pitch + (ri % 2) * 0.012, z = (ri - (rowsN - 1) / 2) * pitch;
    const yawS = slotYaw + (s * 0.37 % 1 - 0.5) * 0.35;
    for (let k = 0; k < n; k++) {
      const y0 = k * (h + 0.0028); // the rim of the lower plate holds the next one 2.8 mm up
      const yaw = yawS + (k ? 0.06 * (k % 2 ? 1 : -1) : 0);
      const { base, rim, hub } = weightPlateGeo({ R, h, slotHalf: 0.027, bore: 0.03 });
      for (const g of [base, rim, hub]) { g.rotateY(yaw); g.translate(x, y0, z); bins.add(iron, g); }
      if (k === n - 1) {
        // cast lettering on the half facing away from the slot
        const opp = yaw + Math.PI;
        const dir = V3(Math.cos(opp), 0, -Math.sin(opp));
        const tang = V3(-dir.z, 0, dir.x);
        const put = (mat, w, hgt, dist) => {
          const pg = new THREE.PlaneGeometry(w, hgt);
          pg.rotateX(-Math.PI / 2);
          const c = V3(x, y0 + h + 0.0003, z).addScaledVector(dir, dist);
          // text on the far half, its top towards the rim: reads upright from the front
          pg.applyMatrix4(new THREE.Matrix4().makeBasis(tang.clone(), V3(0, 1, 0), dir.clone().negate()).setPosition(c));
          const m = new THREE.Mesh(pg, mat); m.castShadow = false; m.receiveShadow = true; extras.push(m);
        };
        put(markMat, 0.07, 0.0205, 0.069);
        put(brandMat, 0.06, 0.0105, 0.0475);
      }
    }
  }
  const g = K.finish(bins, `gewichten ${stacks}x${n}`, extras);
  return {
    object: g,
    detail: { target: [pitch / 2, n * h, pitch / 2], size: 0.32, azimuth: 30, elevation: 32 },
    view: { hero: { elevation: 24 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.008, res: 1024, blur: 1.4 }, groundAO: { strength: 0.8, maxZenith: 80 } } },
    meta: { stacks, perStack: n, kg },
  };
}
