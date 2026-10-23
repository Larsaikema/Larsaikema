// Clamp-on lights and heaters shown *fitted* (lighting group, round 4): a piece of easy-up leg,
// the leg clamp round it and the product's U-bracket bolted to the clamp's stud as a fork.
//
//   easyUpLeg(bins, y0, y1, { mat })   hexagonal aluminium leg (40 mm across flats) with the row
//                                      of adjustment holes of an easy-up leg, along the y axis
//   forkBracket(xs, zb, { w, t, r })   the U-bracket turned into a fork: arms along -Z from the tilt
//                                      knobs at x = +-xs (z = 0) to a base strap at z = -zb
//                                      (one swept strap, rounded bends)
//   clampAt(bins, mat, wingMat, y)     the leg clamp (js/lightKit legClamp) round the y axis, its
//                                      ring centred at height y; returns the stud tip (V3, +Z)
//   LEG = { af, ringR }                leg size; the clamp ring's inner radius
// The leg is meant to run out of the frame (mark it noFrame): the picture is about the product.
import * as THREE from 'three';
import * as G from './geom.js';
import * as L from './lightKit.js';

const { V3 } = G;

export const LEG = { af: 0.04, ringR: 0.026 };

export function legMaterial() {
  return L.cached('pmLegAlu', () => new THREE.MeshPhysicalMaterial({ color: '#C3C7CB', metalness: 1, roughness: 0.34, anisotropy: 0.35, anisotropyRotation: Math.PI / 2, name: 'leg aluminium' }));
}

export function easyUpLeg(bins, y0, y1, { mat = legMaterial(), holes = true } = {}) {
  const prof = G.roundedPolygonProfile(6, LEG.af, 0.003, 3, 0);
  bins.add(mat, G.prism(prof, V3(0, y0, 0), V3(0, y1, 0), { side: V3(1, 0, 0) }));
  if (holes) {
    // adjustment holes on one flat (the hex has a corner on +X, so (cos 30, 0, +-sin 30) are flats)
    const hole = L.moulded('#0B0B0C', 0.6);
    const apo = LEG.af / 2;
    {
      const n = V3(Math.cos(Math.PI / 6), 0, Math.sin(Math.PI / 6));
      for (let y = y0 + 0.08; y < y1 - 0.04; y += 0.045) {
        const g = G.lathe([[0.0001, 0], [0.0032, 0], [0.0032, 0.0006], [0.0001, 0.0006]], 18);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), n));
        g.translate(n.x * (apo - 0.0002), y, n.z * (apo - 0.0002));
        bins.add(hole, g);
      }
    }
  }
}

// rectangle with rounded corners as a sweep profile ([x, y] pairs): x = thickness, y = width
function strapProfile(w, t) {
  const r = Math.min(t * 0.45, w * 0.2), pts = [];
  const cs = [[t / 2 - r, w / 2 - r, 0], [-t / 2 + r, w / 2 - r, Math.PI / 2], [-t / 2 + r, -w / 2 + r, Math.PI], [t / 2 - r, -w / 2 + r, Math.PI * 1.5]];
  for (const [cx, cy, a0] of cs) for (let s = 0; s <= 2; s++) { const a = a0 + (Math.PI / 2) * (s / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}

export function forkBracket(xs, zb, { w = 0.024, t = 0.003, r = 0.012 } = {}) {
  const pts = [];
  const seg = (a, b, n) => { for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push(a.clone().lerp(b, i / n)); };
  const arc = (c, a0, a1, n) => { for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push(V3(c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r)); } };
  seg(V3(-xs, 0, 0), V3(-xs, 0, -zb + r), 6);
  arc(V3(-xs + r, 0, -zb + r), Math.PI, Math.PI * 1.5, 8);
  seg(V3(-xs + r, 0, -zb), V3(xs - r, 0, -zb), 10);
  arc(V3(xs - r, 0, -zb + r), Math.PI * 1.5, Math.PI * 2, 8);
  seg(V3(xs, 0, -zb + r), V3(xs, 0, 0), 6);
  return L.sweepProfile(pts, strapProfile(w, t), { up: V3(0, 1, 0) }).geo;
}

export function clampAt(bins, mat, wingMat, y) {
  const cb = new G.PartBin(); L.legClamp(cb, mat, wingMat);
  const h = 0.03;
  for (const [m, list] of cb.bins) for (const g of list) { g.translate(0, y - h / 2, 0); bins.add(m, g); }
  return V3(0, y, LEG.ringR + 0.004 + 0.03);
}

// Round 5: a heater (or lamp) *hanging* from the clamp, so the mounting reads at a glance.
//   clampArm(bins, mat, knobMat, y, z1, { s })  a square steel arm (s x s) welded to the clamp's
//       stud plate at height y, running out along +Z to z1 + s, with a vertical M8 bolt at z = z1:
//       a star knob on top of the arm and a nut under the bracket strap. Returns the point under
//       the arm where the bracket strap's top sits (V3).
//   hangerBracket(xs, h, { w, t, r })  the product's U-bracket hanging *under* that arm, opening
//       down: arms from the tilt knobs at x = +-xs (y = 0, z = 0) up to a strap at y = h whose
//       flat side faces up (width along Z), rounded bends. Product frame: tilt axis = X.
export function starKnob(add, knobMat, { r = 0.016, h = 0.012, lobes = 5 } = {}) {
  // lobed star knob, axis +Y, base at y = 0
  add(knobMat, G.lathe([[0.0001, 0], [r * 0.62, 0], [r * 0.64, h * 0.85], [r * 0.5, h], [0.0001, h]], 28));
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const g = G.lathe([[0.0001, 0], [r * 0.36, 0], [r * 0.38, h * 0.7], [r * 0.3, h * 0.82], [0.0001, h * 0.82]], 18);
    g.translate(Math.cos(a) * r * 0.62, 0, Math.sin(a) * r * 0.62); add(knobMat, g);
  }
}

export function clampArm(bins, mat, knobMat, y, z1, { s = 0.022 } = {}) {
  const z0 = LEG.ringR + 0.004 + 0.003;
  bins.add(mat, G.prism(G.roundedRectProfile(s, s, s * 0.16, 2), V3(0, y, z0), V3(0, y, z1 + s * 0.9), { side: V3(1, 0, 0) }));
  // end plug
  bins.add(knobMat, G.roundedBox(s * 0.92, s * 0.92, 0.003, 0.0015, 2).translate(0, y, z1 + s * 0.9 + 0.0012));
  // weld bead round the arm where it meets the stud plate
  bins.add(mat, G.prism(G.roundedRectProfile(s + 0.004, s + 0.004, s * 0.2, 2), V3(0, y, z0), V3(0, y, z0 + 0.004), { side: V3(1, 0, 0) }));
  // bolt: washer + star knob on top, threaded end and nut under the strap
  const shell = L.e27Mats().shell;
  bins.add(shell, G.lathe([[0.0001, 0], [0.0095, 0], [0.0095, 0.0016], [0.0001, 0.0016]], 24).translate(0, y + s / 2, z1));
  const kb = []; starKnob((m, g) => kb.push([m, g]), knobMat);
  for (const [m, g] of kb) bins.add(m, g.translate(0, y + s / 2 + 0.0016, z1));
  const yS = y - s / 2 - 0.0035;               // under the strap (3 mm) + washer
  bins.add(shell, G.tube(V3(0, yS - 0.012, z1), V3(0, y, z1), 0.004, 12));
  bins.add(shell, G.lathe([[0.0001, 0], [0.0075, 0], [0.0075, 0.0065], [0.0001, 0.0065]], 6).translate(0, yS - 0.0075, z1));
  return V3(0, y - s / 2, z1);
}

export function hangerBracket(xs, h, { w = 0.024, t = 0.003, r = 0.012 } = {}) {
  const pts = [];
  const seg = (a, b, n) => { for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push(a.clone().lerp(b, i / n)); };
  const arc = (c, a0, a1, n) => { for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push(V3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 0)); } };
  seg(V3(-xs, 0, 0), V3(-xs, h - r, 0), 6);
  arc(V3(-xs + r, h - r, 0), Math.PI, Math.PI / 2, 8);
  seg(V3(-xs + r, h, 0), V3(xs - r, h, 0), 12);
  arc(V3(xs - r, h - r, 0), Math.PI / 2, 0, 8);
  seg(V3(xs, h - r, 0), V3(xs, 0, 0), 6);
  return L.sweepProfile(pts, strapProfile(w, t), { up: V3(0, 0, 1) }).geo;
}
