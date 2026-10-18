// LED-lamp E27 (G45 globe) for prikkabels, as a studio packshot, lit or unlit.
//
// ledBulb { type, on, count, colors, color }
//   type   'melkglas' (opal frosted globe on a white neck) | 'filament' (clear glass, 4 LED filaments)
//          | 'gekleurd' (coated coloured glass: a set in rood, oranje, geel, groen, blauw)
//   on     lit (true): the globe glows, with a soft bloom and a warm (or coloured) pool on the floor
//   count  number of lamps (1; gekleurd: 5), colors: list of colour names for the set
//
// Construction (js/bulbKit.js g45): 45 mm globe, 78 mm overall; nickel-plated E27 shell with a
// real helical thread (3.6 mm pitch), black glass insulator and solder contact; opal and coloured
// lamps sit on a white PBT neck, the filament lamp has a glass stem with nickel support wires and
// four 26 mm filaments behind real (noise-free) glass. The lamps stand on their contact, as in a
// catalogue shot. Glow, bloom and floor pools come from js/lightGlow.js (no stochastic speckle).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import { GlowComp } from '../js/lightGlow.js';
import { g45, flushExtra } from '../js/bulbKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function ledBulb(p = {}) {
  const type = String(p.type || 'melkglas').toLowerCase();
  const on = p.on !== false;
  const kind = /fil|helder|clear/.test(type) ? 'filament' : /gekl|kleur|col/.test(type) ? 'colour' : 'opal';
  const colours = p.colors || (p.color ? [p.color] : ['rood', 'oranje', 'geel', 'groen', 'blauw']);
  const count = Math.max(1, Math.round(Number(p.count ?? (kind === 'colour' ? colours.length : 1))));
  // a set stands in two staggered rows, parallel to the hero camera's image plane, colours in
  // rainbow order from left to right (back, front, back, front, back)
  const spots = [];
  const rgt = V3(Math.cos(34 * DEG), 0, -Math.sin(34 * DEG)), fwd = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
  for (let k = 0; k < count; k++) {
    if (count === 1) { spots.push([0, 0]); break; }
    const t = (k - (count - 1) / 2) * 0.036, f = k % 2 === 1 ? 0.034 : -0.012;
    const q = rgt.clone().multiplyScalar(t).addScaledVector(fwd, f);
    spots.push([q.x, q.z]);
  }
  const GC = new GlowComp({ name: 'ledBulb' });
  const bins = new G.PartBin();
  const sources = [];
  spots.forEach(([x, z], k) => {
    const col = colours[k % colours.length];
    const M4 = new THREE.Matrix4().makeRotationY((17 + k * 71) * DEG).setPosition(x, 0, z);
    const r = g45(GC, bins, M4, { kind, on, color: col, bloomR: kind === 'colour' ? 0.06 : 0.075, bloom: kind === 'colour' ? 0.8 : 1 });
    if (on) {
      const c = new THREE.Color().setRGB(...r.light);
      const pc = kind === 'colour' ? c.clone().lerp(new THREE.Color(1, 1, 1), 0.15) : c.clone().lerp(new THREE.Color(1, 0.85, 0.65), 0.4);
      sources.push({ p: r.centre.clone().setY(r.centre.y * 0.95), I: 1, color: pc.toArray().map((v) => v * 1.15) });
    }
  });
  const group = new THREE.Group(); group.name = `ledBulb ${type} x${count}`;
  bins.build(group);
  flushExtra(bins, group);
  group.traverse((o) => { if (o.isMesh && o.material.name !== 'glass marker') { const nm = o.material.name || ''; o.castShadow = !/glass lit/.test(nm); o.receiveShadow = true; } });
  if (sources.length) {
    // the base and neck shade the floor right under each lamp: sources sit inside the globe
    GC.floorPool(sources, { pad: 0.16, res: 160, k: kind === 'colour' ? 0.0011 : 0.0009, max: 0.16, minH: 0.05 });
  }
  if (!GC.isEmpty()) group.add(GC.build(V3(0, 0.03, 0)));
  return {
    object: group,
    detail: { target: [spots[0][0], 0.03, spots[0][1]], size: 0.075, azimuth: 30, elevation: 10 },
    view: { hero: { elevation: 14 } },
    rig: { default: { exposure: on ? 1.0 : 'auto', contact: { strength: 0.8, h0: 0.004, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { type, count, on },
  };
}
