// Tuinpaviljoen (aluminium garden pavilion / gazebo with a fixed frame).
//
// Construction: four 10 x 10 cm powder-coated aluminium corner posts on foot plates, a 16 cm
// deep box beam round the top (inner gutter lip and a curtain rail behind it), decorative
// corner braces, and a hip roof (25 deg) of twin-wall polycarbonate panels in aluminium
// glazing bars (bars every ~65 cm down the slope, heavier hip bars, a ridge cap). Twin-wall
// sheet: translucent opal-grey with the internal flutes running down the slope.
// `curtains: 'half-open'|'closed'|'open'` hangs pleated polyester curtains (sold separately)
// from the rail on all four sides, gathered towards the posts.
//   { w, d, color (frame), roof: 'polycarbonaat', curtains, curtainColor }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as TX from '../js/textures.js';

const { V3 } = K;

let pcMat = null;
function polycarbonate() {
  if (pcMat) return pcMat;
  // fluted twin-wall sheet: a stripe normal map across the flutes (8 mm pitch)
  const c = document.createElement('canvas'); c.width = 64; c.height = 4;
  const g = c.getContext('2d');
  for (let x = 0; x < 64; x++) { const v = 128 + 70 * Math.sin((x / 64) * Math.PI * 2 * 4); g.fillStyle = `rgb(${v | 0},128,255)`; g.fillRect(x, 0, 1, 4); }
  const nm = new THREE.CanvasTexture(c); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.colorSpace = THREE.NoColorSpace; nm.repeat.set(1 / 0.032, 1);
  pcMat = new THREE.MeshPhysicalMaterial({ color: '#D9DCDA', roughness: 0.3, specularIntensity: 0.9, clearcoat: 0.6, clearcoatRoughness: 0.12, normalMap: nm, normalScale: new THREE.Vector2(0.25, 0.25), side: THREE.DoubleSide, name: 'polycarbonate twin-wall' });
  pcMat.userData.stochasticAlpha = 0.82;
  pcMat.userData.translucency = 0.35;
  pcMat.userData.envSpec = 0.6;
  return pcMat;
}

export function gardenPavilion(p = {}) {
  let X = Number(p.w ?? 3), Z = Number(p.d ?? 4);
  if (Z > X) [X, Z] = [Z, X];
  const hex = K.col(p.color || 'antraciet', M.COLORS.antraciet);
  const alu = M.steelPowder(hex, { roughness: 0.4, clearcoat: 0.15 });
  const steel = M.galvanised();
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `gardenPavilion ${X}x${Z}`;
  const ps = 0.1, Hb = 2.22, bH = 0.16, bT = 0.05;
  const hx = X / 2, hz = Z / 2;
  const box = (cx, cy, cz, sx, sy, sz, r = 0.004) => { const g = G.roundedBox(sx, sy, sz, r); g.translate(cx, cy, cz); bins.add(alu, g); };

  // posts, foot plates, beam, braces
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (hx - ps / 2), z = sz * (hz - ps / 2);
    box(x, Hb / 2 + 0.004, z, ps, Hb, ps, 0.006);
    box(x, 0.005, z, 0.2, 0.01, 0.2, 0.003);
    for (const [dx, dz] of [[sx * -1, 0], [0, sz * -1]]) {
      const a = V3(x + dx * (ps / 2), Hb - 0.42, z + dz * (ps / 2)), b = V3(x + dx * 0.42, Hb - 0.005, z + dz * 0.42);
      bins.add(alu, G.prism(G.roundedRectProfile(0.035, 0.02, 0.003, 2), a, b, { side: V3(0, 0, 0).add(V3(dz, 0, -dx)).lengthSq() ? V3(-dz, 0, dx) : V3(1, 0, 0) }));
    }
  }
  for (const sz of [-1, 1]) box(0, Hb + bH / 2, sz * (hz - bT / 2), X, bH, bT);
  for (const sx of [-1, 1]) box(sx * (hx - bT / 2), Hb + bH / 2, 0, bT, bH, Z - 2 * bT);
  // curtain rail behind the beam
  for (const sz of [-1, 1]) box(0, Hb - 0.01, sz * (hz - 0.09), X - 0.2, 0.02, 0.025, 0.003);
  for (const sx of [-1, 1]) box(sx * (hx - 0.09), Hb - 0.01, 0, 0.025, 0.02, Z - 0.2, 0.003);

  // ---- hip roof ---------------------------------------------------------------------------------
  const ov = 0.05, yE = Hb + bH, rise = (hz + ov) * Math.tan(24 * Math.PI / 180);
  const RX = hx + ov, RZ = hz + ov, ridgeHalf = RX - RZ;
  const roofY = (x, z) => {
    const m = Math.max(Math.max(0, Math.abs(x) - ridgeHalf) / RZ, Math.abs(z) / RZ);
    return yE + 0.03 + rise * (1 - Math.min(1, m));
  };
  const pc = polycarbonate();
  // four faces as grids (panels), sheet sits 2 cm above the bar seats
  const face = (fn, nu, nv) => { const rows = []; for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) { const q = fn(i / nu, j / nv); r.push(q); } rows.push(r); } return K.gridGeometry(rows); };
  for (const sz of [-1, 1]) {
    // trapezoid: eave from -RX..RX, ridge from -ridgeHalf..ridgeHalf
    bins.add(pc, face((u, v) => { const z = sz * RZ * (1 - v); const half = ridgeHalf + (RX - ridgeHalf) * (1 - v); const x = -half + 2 * half * u; return V3(x, roofY(x, z), z); }, 24, 10));
  }
  for (const sx of [-1, 1]) {
    bins.add(pc, face((u, v) => { const half = RZ * (1 - v); const z = -half + 2 * half * u; const x = sx * (ridgeHalf + RZ * (1 - v)); return V3(x, roofY(x, z), z); }, 16, 10));
  }
  // glazing bars down the slopes, hip bars, ridge cap, eave trim
  const bar = (a, b, w = 0.045, t = 0.028) => bins.add(alu, G.prism(G.roundedRectProfile(w, t, 0.006, 2), a.clone().add(V3(0, 0.012, 0)), b.clone().add(V3(0, 0.012, 0)), { side: V3(b.z - a.z, 0, a.x - b.x).lengthSq() > 1e-6 ? V3(b.z - a.z, 0, a.x - b.x).normalize() : V3(1, 0, 0) }));
  const step = 0.66;
  const P = (x, z) => V3(x, roofY(x, z), z);
  for (const sz of [-1, 1]) {
    // common bars between the ridge ends, jack bars from the eave to the hips
    const n = Math.max(1, Math.round((2 * ridgeHalf) / step));
    for (let i = 0; i <= n; i++) { const xr = -ridgeHalf + (2 * ridgeHalf * i) / n; bar(P(xr, sz * RZ), P(xr, 0), 0.04, 0.024); }
    for (const sx of [-1, 1]) for (let k = 1; k <= 2; k++) { const xe = sx * (ridgeHalf + (RZ * k) / 3); bar(P(xe, sz * RZ), P(xe, sz * (RZ - (Math.abs(xe) - ridgeHalf))), 0.04, 0.024); }
  }
  for (const sx of [-1, 1]) for (const z of [-RZ / 2, 0, RZ / 2]) bar(P(sx * RX, z), P(sx * (ridgeHalf + RZ - Math.abs(z)), z), 0.04, 0.024);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = V3(sx * RX, 0, sz * RZ), b = V3(sx * ridgeHalf, 0, 0); a.y = roofY(a.x, a.z); b.y = roofY(b.x, b.z);
    bar(a, b, 0.06, 0.04);
  }
  { const a = V3(-ridgeHalf - 0.03, roofY(0, 0), 0), b = V3(ridgeHalf + 0.03, roofY(0, 0), 0); bar(a, b, 0.09, 0.05); }
  // eave trim
  for (const sz of [-1, 1]) bar(V3(-RX, roofY(RX, RZ), sz * RZ), V3(RX, roofY(RX, RZ), sz * RZ), 0.05, 0.035);
  for (const sx of [-1, 1]) bar(V3(sx * RX, roofY(RX, RZ), -RZ), V3(sx * RX, roofY(RX, RZ), RZ), 0.05, 0.035);
  // finials at the ridge ends
  for (const sx of [-1, 1]) { const s = new THREE.SphereGeometry(0.035, 16, 10); s.translate(sx * (ridgeHalf + 0.03), roofY(0, 0) + 0.06, 0); bins.add(alu, s); }

  // ---- curtains -----------------------------------------------------------------------------------
  const cur = p.curtains;
  if (cur && cur !== 'none') {
    const cloth = M.polyCloth(K.col(p.curtainColor || 'beige', M.COLORS.beige), { satin: 0.2 });
    const frac = cur === 'closed' ? 0.5 : cur === 'open' ? 0.12 : 0.3;
    const yTopC = Hb - 0.02;
    const sides = [
      { a: V3(-hx + 0.1, 0, hz - 0.09), b: V3(hx - 0.1, 0, hz - 0.09), out: V3(0, 0, 1) },
      { a: V3(hx - 0.09, 0, hz - 0.1), b: V3(hx - 0.09, 0, -hz + 0.1), out: V3(1, 0, 0) },
      { a: V3(hx - 0.1, 0, -hz + 0.09), b: V3(-hx + 0.1, 0, -hz + 0.09), out: V3(0, 0, -1) },
      { a: V3(-hx + 0.09, 0, -hz + 0.1), b: V3(-hx + 0.09, 0, hz - 0.1), out: V3(-1, 0, 0) },
    ];
    for (const sd of sides) {
      const L = sd.a.distanceTo(sd.b), along = sd.b.clone().sub(sd.a).normalize();
      for (const end of [0, 1]) {
        const w = L * frac;
        const s0 = end === 0 ? 0 : L - w, s1 = end === 0 ? w : L;
        const pleats = Math.max(4, Math.round(w / 0.11));
        const nx = pleats * 8, ny = 30;
        const rows = [];
        for (let j = 0; j <= ny; j++) {
          const y = yTopC * (1 - j / ny), row = [];
          for (let i = 0; i <= nx; i++) {
            const f = i / nx;
            // gathered: deep pleats, a little more open towards the hem; the hem pools 3 cm
            const s = s0 + (s1 - s0) * f;
            const amp = 0.04 + 0.02 * (j / ny);
            const off = amp * Math.sin(f * pleats * Math.PI * 2) + 0.008 * Math.sin(f * 37 + j * 0.3);
            const pool = y < 0.03 ? (0.03 - y) * 1.5 : 0;
            row.push(sd.a.clone().addScaledVector(along, s).addScaledVector(sd.out, off - 0.03 + pool).setY(Math.max(0.004, y)));
          }
          rows.push(row);
        }
        bins.add(cloth, K.gridGeometry(rows));
      }
    }
  }

  bins.build(group);
  return {
    object: group,
    detail: { target: [hx - 0.1, Hb, hz - 0.1], size: 0.9, azimuth: 30, elevation: 10 },
    view: { hero: { elevation: 17 } },
    rig: { default: { ...K.tentRig(hex, { walled: !!cur }), exposure: 'auto' } },
    meta: { X, Z },
  };
}
