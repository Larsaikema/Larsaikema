// LED-lamp E27 (G45 globe) for prikkabels, as a studio packshot, lit or unlit.
//
// ledBulb { type, on, count, colors, color }
//   type   'melkglas' (opal frosted globe on a white neck) | 'filament' (clear glass, 4 LED filaments)
//          | 'gekleurd' (coated coloured glass: a set in rood, oranje, geel, groen, blauw)
//   on     lit (true): the globe glows, with a soft halo and a warm (or coloured) pool on the floor
//   count  number of lamps (1; gekleurd: 5), colors: list of colour names for the set
//
// Construction (js/lightKit.js lampG45): 45 mm globe, 78 mm overall; nickel-plated E27 shell
// with a real helical thread (3.6 mm pitch), black glass insulator and solder contact; opal and
// coloured lamps sit on a white PBT neck, the filament lamp has a glass stem with nickel support
// wires and four 26 mm filaments. The lamps stand on their contact, as in a catalogue shot.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;

export function ledBulb(p = {}) {
  const type = String(p.type || 'melkglas').toLowerCase();
  const on = p.on !== false;
  const kind = /fil|helder|clear/.test(type) ? 'filament' : /gekl|kleur|col/.test(type) ? 'colour' : 'opal';
  const colours = p.colors || (p.color ? [p.color] : ['rood', 'oranje', 'geel', 'groen', 'blauw']);
  const count = Math.max(1, Math.round(Number(p.count ?? (kind === 'colour' ? colours.length : 1))));
  // layout: one lamp at the origin; a set stands in a shallow arc (back row of 3, front row of 2)
  const spots = [];
  // a set stands in two staggered rows, parallel to the hero camera's image plane, colours in
  // rainbow order from left to right (back, front, back, front, back)
  const rgt = V3(Math.cos(34 * DEG), 0, -Math.sin(34 * DEG)), fwd = V3(Math.sin(34 * DEG), 0, Math.cos(34 * DEG));
  for (let k = 0; k < count; k++) {
    if (count === 1) { spots.push([0, 0]); break; }
    const t = (k - (count - 1) / 2) * 0.036, f = k % 2 === 1 ? 0.034 : -0.012;
    const q = rgt.clone().multiplyScalar(t).addScaledVector(fwd, f);
    spots.push([q.x, q.z]);
  }
  const order = spots.map((_, i) => i);
  const bins = new G.PartBin();
  const halos = [], sources = [];
  spots.forEach(([x, z], k) => {
    const col = colours[order[k] % colours.length];
    const lamp = L.lampG45({ kind, on, color: col });
    const M4 = new THREE.Matrix4().makeRotationY((17 + k * 71) * DEG).setPosition(x, 0, z);
    for (const [m, g] of lamp.parts) { g.applyMatrix4(M4); bins.add(m, g); }
    if (on) {
      const c = lamp.centre.clone().applyMatrix4(M4);
      const hex = kind === 'filament' ? '#FFB868' : lamp.lightHex;
      halos.push({ c, R: kind === 'colour' ? 0.062 : 0.075, color: L.lin(hex, kind === 'colour' ? 1.25 : 1.2), a: kind === 'colour' ? 0.55 : 0.62, core: 0.36, coreW: 0.65 });
      sources.push({ p: c.clone().setY(c.y * 0.9), I: 1, color: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), kind === 'colour' ? 0.25 : 0.55).toArray().map((v) => v * 1.15) });
    }
  });
  const group = new THREE.Group(); group.name = `ledBulb ${type} x${count}`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { const nm = o.material.name || ''; o.castShadow = !/glass lit|clear glass/.test(nm); o.receiveShadow = true; } });
  const hm = L.haloSpheres(halos); if (hm) group.add(hm);
  if (sources.length) {
    // the base and neck shade the floor right under each lamp: sources sit inside the globe,
    // and the coverage is capped so the floor never burns out
    const fg = L.floorGlow(sources, { box: 0.14, res: 140, k: kind === 'colour' ? 0.0016 : 0.0013, max: 0.2, minH: 0.045 });
    if (fg) group.add(fg);
  }
  return {
    object: group,
    detail: { target: [spots[0][0], 0.03, spots[0][1]], size: 0.075, azimuth: 30, elevation: 10 },
    view: { hero: { elevation: 14 } },
    rig: { default: { exposure: on ? 1.0 : 'auto', contact: { strength: 0.8, h0: 0.004, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { type, count, on },
  };
}
