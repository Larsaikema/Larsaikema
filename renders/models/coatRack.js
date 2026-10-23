// Kapstok verrijdbaar (rolling cloakroom rack), the open version of the folded racks on the trolley.js
// 'kapstok' cart: same chrome frame, T-feet with castors, telescopic collars with knobs, black J-hooks with white
// number tags and a wire hat shelf.
//
// { length (2 m), hooks (104), wheels (true), height (1.8) }
//   frame   Ø 32 chrome tube: two uprights joined by the top (hanging) rail with bent corners, a low cross bar,
//           a telescopic collar with a black star knob on each upright
//   feet    a T-foot under each upright (30 x 24 mm chrome bar, 60 cm deep) with a Ø 75 castor at both ends
//           (the two front ones with a red brake pedal)
//   hooks   `hooks` numbered J-hooks clipped on the rail, half facing the front and half the back, in staggered
//           pitch; each with a white tag printed with its number (1..n)
//   shelf   hat shelf above the rail: chrome wire grid (two side tubes, cross wires) on two brackets
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import * as K from '../js/partsKit.js';

const { V3 } = G;

// number tags: one texture atlas with 1..n, each tag maps to its own cell
function tagAtlas(n) {
  return K.cached(`cr-tags:${n}`, () => {
    const cols = 16, rows = Math.ceil(n / cols), cw = 64, ch = 48;
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch;
    const g = c.getContext('2d');
    g.fillStyle = '#F2F1EC'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1C1C1E'; g.font = '700 34px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) g.fillText(String(i + 1), (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch / 2 + 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = true;
    const m = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.5, specularIntensity: 0.4, name: 'number tags' });
    return { m, cols, rows };
  });
}

export function coatRack(p = {}) {
  const L = Number(p.length ?? 2.0), Hr = Number(p.height ?? 1.8) - 0.18;
  const n = Math.max(2, Math.round(Number(p.hooks ?? 104)));
  const chrome = M.chrome(), knob = F.plastic('#161616', 0.55), hookM = F.plastic('#18191A', 0.42);
  const B = new G.PartBin();
  const R = 0.0375, yM = F.castorHeight(R);
  const xs = L / 2 - 0.05, rr = 0.016, Df = 0.6;
  const yFoot = yM + 0.012;
  // T-feet with castors
  const mats = { steel: M.galvanised(), tyre: M.rubber('#2A2B2D'), hub: F.plastic('#8E9194', 0.45) };
  for (const sx of [-1, 1]) {
    B.add(chrome, G.prism(G.roundedRectProfile(0.03, 0.024, 0.005, 3), V3(sx * xs, yFoot, -Df / 2), V3(sx * xs, yFoot, Df / 2), { side: V3(1, 0, 0) }));
    for (const sz of [-1, 1]) {
      B.add(knob, G.roundedBox(0.032, 0.026, 0.006, 0.003).translate(sx * xs, yFoot, sz * (Df / 2 + 0.003)));
      F.castor(B, { at: V3(sx * xs, yM, sz * (Df / 2 - 0.035)), R, W: 0.024, swivel: true, brake: sz > 0, heading: sx * Math.PI / 2 + 0.2 * sz, mats });
    }
    // socket on the foot the upright stands in
    B.add(chrome, G.lathe([[0.0001, 0], [rr + 0.006, 0], [rr + 0.006, 0.05], [rr + 0.003, 0.056], [0.0001, 0.056]], 28).translate(sx * xs, yFoot + 0.012, 0));
  }
  // frame: uprights + top rail in one bent tube, low cross bar
  const y0 = yFoot + 0.06;
  B.add(chrome, F.sweep(F.filletPath([V3(-xs, y0, 0), V3(-xs, Hr, 0), V3(xs, Hr, 0), V3(xs, y0, 0)], 0.06, 12), G.circleProfile(rr, 24)));
  B.add(chrome, G.tube(V3(-xs, 0.3, 0), V3(xs, 0.3, 0), 0.0125, 18));
  // telescopic collars with star knobs
  for (const sx of [-1, 1]) {
    B.add(chrome, G.lathe([[rr + 0.001, 0.93], [rr + 0.0045, 0.935], [rr + 0.0045, 0.975], [rr + 0.001, 0.98]], 24).translate(sx * xs, 0, 0));
    const kb = F.latheAt([[0.0001, 0], [0.004, 0], [0.004, 0.012], [0.0001, 0.012]], V3(sx * xs, 0.955, rr + 0.004), V3(0, 0, 1), 12);
    B.add(chrome, kb);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const lobe = new THREE.SphereGeometry(0.008, 12, 8).scale(1, 1, 0.7).translate(Math.cos(a) * 0.011, Math.sin(a) * 0.011, 0);
      lobe.translate(sx * xs, 0.955, rr + 0.022); B.add(knob, lobe);
    }
    B.add(knob, new THREE.CylinderGeometry(0.013, 0.013, 0.012, 24).rotateX(Math.PI / 2).translate(sx * xs, 0.955, rr + 0.022));
  }
  // hat shelf: two side tubes, cross wires, two brackets on the uprights
  const ys = Hr + 0.14, zs = 0.17;
  for (const sz of [-1, 1]) B.add(chrome, G.tube(V3(-xs + 0.02, ys, sz * zs), V3(xs - 0.02, ys, sz * zs), 0.008, 14));
  const nw = 44;
  for (let i = 0; i <= nw; i++) { const x = -xs + 0.04 + ((2 * xs - 0.08) * i) / nw; B.add(chrome, G.tube(V3(x, ys + 0.009, -zs), V3(x, ys + 0.009, zs), 0.0026, 8)); }
  for (const t of [-0.5, 0, 0.5]) B.add(chrome, G.tube(V3(-xs + 0.03, ys + 0.004, t * zs), V3(xs - 0.03, ys + 0.004, t * zs), 0.003, 8));
  for (const sx of [-1, 1]) {
    const x = sx * (xs - 0.03);
    for (const sz of [-1, 1]) B.add(chrome, F.sweep(F.filletPath([V3(sx * xs, Hr - 0.1, 0), V3(x, ys - 0.02, sz * zs * 0.8), V3(x, ys, sz * zs)], 0.02, 6), G.circleProfile(0.006, 10)));
  }
  // numbered J-hooks: half on the front, half on the back, staggered
  const { m: tagM, cols, rows } = tagAtlas(n);
  const per = Math.ceil(n / 2);
  const span = 2 * xs - 0.16;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? -1 : 1;
    const j = Math.floor(i / 2);
    const x = -span / 2 + (span * (j + (side < 0 ? 0.5 : 0))) / per;
    const zz = side;
    // clip round the rail, stem down, J curl outwards
    const pts = [V3(x, Hr + rr + 0.002, -zz * 0.004), V3(x, Hr + rr * 0.3, zz * (rr + 0.003)), V3(x, Hr - 0.045, zz * (rr + 0.004)), V3(x, Hr - 0.085, zz * (rr + 0.03)), V3(x, Hr - 0.07, zz * (rr + 0.055)), V3(x, Hr - 0.05, zz * (rr + 0.058))];
    B.add(hookM, F.sweep(F.filletPath(pts, 0.012, 6), G.circleProfile(0.0028, 8)));
    // tag on the stem, facing out
    const tg = new THREE.PlaneGeometry(0.02, 0.015);
    const cu = i % cols, cv = Math.floor(i / cols);
    const uv = tg.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (cu + uv.getX(k)) / cols, 1 - (cv + 1 - uv.getY(k)) / rows);
    if (zz < 0) tg.rotateY(Math.PI);
    tg.translate(x, Hr - 0.03, zz * (rr + 0.0075));
    B.add(tagM, tg);
    const back = G.roundedBox(0.021, 0.016, 0.002, 0.0008).translate(x, Hr - 0.03, zz * (rr + 0.0063));
    B.add(F.plastic('#EDEBE5', 0.6), back);
  }
  const g = K.finish(B, `coatRack ${L} ${n}`);
  return {
    object: g,
    detail: { target: [xs - 0.25, Hr - 0.04, 0.05], size: 0.35, azimuth: 30, elevation: 8 },
    view: { hero: { elevation: 14 } },
    rig: S.seatRig(g),
    meta: { L, hooks: n },
  };
}
