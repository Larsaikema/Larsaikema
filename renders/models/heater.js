// Terrace and tent heaters, plus the loose infrared element.
//
// heater { kind: 'gas' | 'elektrisch', style, watt, on, clamp, color, mountedOn }
//   gas 'paddenstoel'  mushroom patio heater, 13 kW, 2.27 m, brushed stainless (color 'zwart' for
//                      black powder coat): spun base dish with a rubber edge and two transport wheels,
//                      bottle housing (Ø 43 cm, 10 kg propane) with a door (seams, lock knob) and vent
//                      slots, Ø 76 mm pole, control box with gas knob and piezo button, burner pan,
//                      perforated emitter screen (glowing red-orange when on) inside a guard of 12
//                      rods, Ø 86 cm spun reflector with a rolled rim on three stays, top cap.
//   gas 'flame'        pyramid flame heater, 9 kW, 2.27 m: tapered square bottle housing with a door
//                      and vents, quartz-glass tube (Ø 10 cm) with a swirling flame, four slanted
//                      posts with two tie frames, square hood. Black powder coat (color 'rvs').
//   gas 'lounge'       standing lounge heater, 1.15 m: the same flame column on a 5 kg bottle housing.
//   gas 'tafel'        table-top mushroom heater, 0.92 m: weighted round foot, emitter and Ø 56 cm
//                      reflector; gas hose with regulator.
//   elektrisch         infrared quartz heater (1500 W): extruded aluminium housing with cooling ribs,
//                      polished reflector trough, golden quartz-halogen tube (glowing when on), wire
//                      guard, end caps, U-bracket with tilt knobs. Default (clamp): shown *fitted*:
//                      the leg clamp round a piece of hexagonal easy-up leg (running out of the
//                      frame), the bracket bolted to its stud as a fork, the heater tilted 12 deg
//                      down; seen from a little above, so the clamp shows behind the housing.
//                      mountedOn 'leg': the same at the y axis without the leg (a tent provides it).
//                      clamp false: standing on its bracket on the floor, tilted up.
//   on (default true): gas heaters glow / show the flame, the electric element glows.
//
// Switched on (round 4). The hot parts are designed in the engine's *output* space, so they keep
// their colour through the neutral tone curve (js/heatGlow.js ember ramp: the emitter screen is a
// saturated orange with a hotter yellow-orange band, not a pale peach), and they light what is
// round them (js/heatGlow.js spill: an emissive term in the neighbouring materials): the
// reflector's underside turns orange, the guard rods (heat-tinted, darker steel) get orange
// flanks, the burner pan and control box shine; the flame lights the posts, the tie frames and
// the housing's top plate; the quartz tube fills its gold trough with light. Plus a bloom round
// the hot part and a warm pool on the floor (js/lightGlow.js). The mushroom heaters are seen from
// eye height (elevation 3-4 deg), under the reflector's rim, as in a photo of a heater that is on.
// heaterElement { watt }   the replacement quartz tube on its own.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';
import { GlowComp } from '../js/lightGlow.js';
import { spill, EMBER_GLSL } from '../js/heatGlow.js';
import * as PM from '../js/poleMount.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------
// materials

function rvs(rough = 0.19) {
  // brushed 304: anisotropic with the grain along the parts' length (uv v), so on the housing
  // and the pole the studio's strip lights become long vertical highlights between dark bands
  return L.cached(`htrRvs:${rough}`, () => new THREE.MeshPhysicalMaterial({ color: '#D9DCDF', metalness: 1, roughness: rough, anisotropy: 0.4, anisotropyRotation: Math.PI / 2, name: 'stainless 304' }));
}
function frameMat(color) {
  const c = String(color || '').toLowerCase();
  if (c === 'rvs' || c === 'stainless' || c === 'zilver') return rvs(0.19);
  const hex = { zwart: '#1A1B1D', antraciet: '#34373B', brons: '#4A3B2C', grijs: '#6E7276', wit: '#E4E4E0' }[c] || '#1A1B1D';
  return L.diecast(hex, { rough: 0.5, coat: 0.25 });
}
function perforation() {
  return L.cached('htrPerf', () => {
    const W = 32, d = new Uint8Array(W * W * 4);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - W / 2, dy = y + 0.5 - W / 2, r = Math.hypot(dx, dy) / (W / 2);
      const v = r < 0.55 ? 0 : r < 0.68 ? Math.round(255 * (r - 0.55) / 0.13) : 255;
      const k = (y * W + x) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255;
    }
    const t = new THREE.DataTexture(d, W, W, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  });
}
// Glowing emitter screen of a mushroom heater, as a texture over the whole cylinder (u around,
// v up). The screen is a perforated steel sheet (holes ~1.3 mm on a 3.2 mm staggered pitch, too
// fine to read as dots at catalogue size: it gives the glow a fine grain), rolled into a tube
// with embossed stiffening ribs every ~2.4 cm, three vertical seam straps, and dark rolled rims
// top and bottom. Heat: a hot band a little above the middle, cooler towards the rims, slow
// hot/cool patches, the ribs and straps a touch cooler (more metal, less flame behind them).
// r = heat (0..1, the ember ramp of js/heatGlow.js), g = diffuse mask (unlit), b = rib relief.
function emitterTex(circ, height) {
  return L.cached(`htrEmitTex3:${circ.toFixed(3)}:${height.toFixed(3)}`, () => {
    const W = 1024, H = Math.max(128, Math.round((W * height) / circ));
    const d = new Uint8Array(W * H * 4);
    const pitch = 0.0032, Nu = Math.round(circ / pitch), Nv = Math.round(height / (pitch * 0.866));
    const nRib = Math.max(3, Math.round(height / 0.024));
    const nz = L.noise;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W, v = (y + 0.5) / H;
      const hv = v * Nv, row = Math.floor(hv), fv = hv - row - 0.5;
      const hu = u * Nu + (row % 2 ? 0.5 : 0), fu = hu - Math.floor(hu) - 0.5;
      const hole = 1 - G.smoothstep(0.17, 0.25, Math.hypot(fu, fv));
      let seam = 0;
      for (const s0 of [0.08, 0.413, 0.746]) { const du = Math.abs(((u - s0 + 1.5) % 1) - 0.5) * circ; seam = Math.max(seam, 1 - G.smoothstep(0.0045, 0.006, du)); }
      const rim = 1 - G.smoothstep(0.03, 0.06, v) * G.smoothstep(0.97, 0.94, v);
      // embossed ribs: a raised ring (cooler crest, slightly hotter flanks)
      const rv = (v - 0.06) / 0.88 * nRib, rf = rv - Math.round(rv);
      const rib = (v > 0.07 && v < 0.93) ? Math.exp(-(rf * rf) / (2 * 0.06 * 0.06)) : 0;
      let heat = 0.42 + 0.58 * Math.exp(-Math.pow((v - 0.56) / 0.27, 2));
      heat *= 0.8 + 0.2 * nz.noise(u * 9.1, v * 2.6) + 0.06 * Math.sin(u * TAU * 3 + 0.6);
      heat *= (1 - 0.6 * seam) * (1 - 0.92 * rim) * (1 - 0.16 * rib);
      heat *= 1 + 0.05 * hole;                  // the holes show the flame behind: a touch hotter
      const e = Math.max(0, Math.min(1, heat));
      const k = (y * W + x) * 4;
      d[k] = Math.round(e * 255);
      d[k + 1] = Math.round((1 - hole * 0.45) * (1 - 0.4 * seam) * (1 - 0.25 * rib) * 255);
      d[k + 2] = Math.round(rib * 255);
      d[k + 3] = 255;
    }
    const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  });
}
function emitterMat(on, circ, height) {
  return L.cached(`htrEmit3:${on}:${circ.toFixed(3)}:${height.toFixed(3)}`, () => {
    const tex = emitterTex(circ, height);
    const m = new THREE.MeshPhysicalMaterial({ color: on ? '#1C110D' : '#8C9094', metalness: on ? 0.15 : 0.75, roughness: on ? 0.62 : 0.5, name: on ? 'emitter screen lit' : 'emitter screen' });
    m.userData.emTex = { value: tex };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tEm = m.userData.emTex;
      sh.uniforms.uOn = { value: on ? 1 : 0 };
      sh.vertexShader = sh.vertexShader.replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\nvarying vec2 vEmUv;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvEmUv = uv;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tEm; uniform float uOn; varying vec2 vEmUv;\n' + EMBER_GLSL)
        .replace('#include <map_fragment>', `#include <map_fragment>
  vec4 emT = texture2D( tEm, vEmUv );
  diffuseColor.rgb *= mix( 0.35, 1.0, emT.g );`)
        .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
  if ( uOn > 0.5 ) radiance *= 0.12;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if ( uOn > 0.5 ) totalEmissiveRadiance += ember( emT.r );`);
    };
    m.customProgramCacheKey = () => `htrEmit3:${on}`;
    m.side = THREE.DoubleSide;
    return m;
  });
}
const rubberMat = () => L.cableRubber('#141414', 0.7);
const knobMat = () => L.moulded('#121212', 0.38);

// flat-shaded square frustum (for pyramid housings and hoods), centred on the y axis
function frustum(wb, wt, y0, y1) {
  const g = new THREE.CylinderGeometry(wt / Math.SQRT2, wb / Math.SQRT2, y1 - y0, 4, 1).toNonIndexed();
  g.rotateY(Math.PI / 4); g.translate(0, (y0 + y1) / 2, 0); g.computeVertexNormals();
  g.deleteAttribute('uv');
  return g;
}

// ---------------------------------------------------------------------------------------
// mushroom heaters (paddenstoel / tafel)

function mushroom(bins, extra, { table = false, on, mat, color, GC }) {
  const steel = mat;
  const seam = L.moulded('#2C2D2F', 0.6);
  const doorAz = 20 * DEG;
  const out = (a) => V3(Math.sin(a), 0, Math.cos(a));
  let yTop;
  let poleR, yC;
  if (!table) {
    // base: rubber edge ring + spun dish
    const Rb = 0.235;
    bins.add(rubberMat(), G.lathe([[Rb - 0.014, 0], [Rb + 0.003, 0], [Rb + 0.004, 0.013], [Rb - 0.014, 0.013]], 96));
    bins.add(steel, G.lathe([[Rb - 0.001, 0.011], [Rb + 0.0005, 0.02], [Rb - 0.006, 0.028], [0.205, 0.039], [0.15, 0.052], [0.0001, 0.058]], 96));
    // two wheels at the back
    for (const s of [-1, 1]) {
      const a = Math.PI + doorAz + s * 0.42, c = out(a).multiplyScalar(0.2).setY(0.034);
      const tang = V3(Math.cos(a), 0, -Math.sin(a));
      const wh = G.lathe([[0.0001, -0.012], [0.03, -0.012], [0.034, -0.008], [0.034, 0.008], [0.03, 0.012], [0.0001, 0.012]], 32);
      // axle along the tangent: lathe axis (y) -> tangent
      const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), tang);
      wh.applyQuaternion(q); wh.translate(c.x, c.y, c.z);
      bins.add(rubberMat(), wh);
      const hub = G.lathe([[0.0001, -0.0135], [0.013, -0.0135], [0.013, 0.0135], [0.0001, 0.0135]], 20); hub.applyQuaternion(q); hub.translate(c.x, c.y, c.z); bins.add(steel, hub);
    }
    // bottle housing with domed top and a collar for the pole
    const Rh = 0.2155, y0 = 0.034, y1 = 0.83;
    bins.add(steel, G.lathe([[0.199, y0], [0.212, y0 + 0.004], [Rh, y0 + 0.016], [Rh, y1 - 0.03], [0.212, y1 - 0.012], [0.193, y1], [0.1, y1 + 0.022], [0.05, y1 + 0.03], [0.046, y1 + 0.036], [0.046, y1 + 0.052], [0.0001, y1 + 0.053]], 128));
    // door: two vertical seams and two horizontal seams, lock knob
    const dw = 0.36; // half angle of the door (rad)
    for (const s of [-1, 1]) {
      const a = doorAz + s * dw;
      const p0 = out(a).multiplyScalar(Rh + 0.0004);
      bins.add(seam, G.tube(p0.clone().setY(y0 + 0.07), p0.clone().setY(y1 - 0.06), 0.0011, 6));
    }
    for (const yy of [y0 + 0.07, y1 - 0.06]) {
      const pts = []; for (let k = 0; k <= 24; k++) { const a = doorAz - dw + (2 * dw * k) / 24; pts.push(out(a).multiplyScalar(Rh + 0.0004).setY(yy)); }
      bins.add(seam, L.sweepProfile(pts, L.circleProfile(0.0011, 6)).geo);
    }
    const lk = out(doorAz + dw * 0.72).multiplyScalar(Rh).setY(y1 - 0.12);
    const lock = G.lathe([[0.0001, 0], [0.012, 0], [0.012, 0.006], [0.009, 0.009], [0.0001, 0.009]], 24);
    lock.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), out(doorAz + dw * 0.72))); lock.translate(lk.x, lk.y, lk.z); bins.add(knobMat(), lock);
    // vent slots: a row low and a row high around the back half
    const slot = L.moulded('#101010', 0.7);
    for (const yy of [y0 + 0.045, y1 - 0.035]) for (let k = 0; k < 9; k++) {
      const a = doorAz + Math.PI + (k - 4) * 0.21;
      const c = out(a).multiplyScalar(Rh + 0.0002).setY(yy);
      const g = G.roundedBox(0.032, 0.007, 0.0012, 0.0034, 2);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), out(a))); g.translate(c.x, c.y, c.z); bins.add(slot, g);
    }
    poleR = 0.038; yC = 1.76;
    bins.add(steel, G.tube(V3(0, y1 + 0.05, 0), V3(0, yC + 0.002, 0), poleR, 40));
    // pole joint collar halfway (two-part pole)
    bins.add(steel, G.lathe([[poleR + 0.0005, 1.3], [poleR + 0.004, 1.303], [poleR + 0.004, 1.332], [poleR + 0.0005, 1.335]], 40));
  } else {
    // weighted round foot, short pole
    bins.add(rubberMat(), G.lathe([[0.16, 0], [0.183, 0], [0.184, 0.01], [0.16, 0.01]], 80));
    bins.add(steel, G.lathe([[0.182, 0.008], [0.183, 0.022], [0.17, 0.035], [0.12, 0.056], [0.05, 0.068], [0.03, 0.072], [0.03, 0.09], [0.0001, 0.091]], 80));
    poleR = 0.024; yC = 0.55;
    bins.add(steel, G.tube(V3(0, 0.088, 0), V3(0, yC + 0.002, 0), poleR, 32));
    // gas hose from the foot to a regulator lying on the floor
    const hp = [V3(0.0, 0.03, -0.17), V3(0.02, 0.012, -0.24), V3(0.09, 0.008, -0.31), V3(0.2, 0.008, -0.3), V3(0.27, 0.008, -0.22)];
    const hose = new THREE.CatmullRomCurve3(hp, false, 'centripetal').getSpacedPoints(60);
    hose.forEach((q) => { q.y = Math.max(0.008, q.y); });
    bins.add(L.cableRubber('#1A1A1A', 0.6), L.sweepProfile(hose, L.circleProfile(0.007, 12)).geo);
    const e = hose[hose.length - 1], d = e.clone().sub(hose[hose.length - 3]).normalize();
    const reg = G.lathe([[0.0001, 0], [0.012, 0], [0.012, 0.03], [0.026, 0.034], [0.026, 0.05], [0.012, 0.054], [0.0001, 0.054]], 32);
    reg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d)); reg.translate(e.x, 0.026, e.z);
    bins.add(L.cached('brassReg', () => new THREE.MeshPhysicalMaterial({ color: '#B8975A', metalness: 1, roughness: 0.32, name: 'brass' })), reg);
    const dial = G.lathe([[0.0001, 0], [0.02, 0], [0.02, 0.012], [0.0001, 0.012]], 24); dial.translate(0, 0, 0);
    dial.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), V3(0, 1, 0))); dial.translate(e.x + d.x * 0.042, 0.052, e.z + d.z * 0.042);
    bins.add(knobMat(), dial);
  }
  const k = table ? 0.62 : 1;
  // burner pan, emitter screen, guard rods (positions first: the head's metal takes the glow)
  const yE0 = yC + 0.118 * k, He = (table ? 0.14 : 0.21), yE1 = yE0 + He, Re = table ? 0.066 : 0.105, Rg = table ? 0.095 : 0.15;
  const Rr = table ? 0.28 : 0.43, yR = yE1 + (table ? 0.03 : 0.05), hR = table ? 0.07 : 0.1;
  // lit: every part of the head is also lit by the screen (js/heatGlow.js spill): the reflector's
  // underside turns orange, the guard rods get orange flanks, the burner pan and the control box
  // shine; the reflector's top and the rest of the heater keep the studio light only
  // the guard, the burner pan and the screen's cap are heat-tinted (darker, a little bronze),
  // so the rods read as dark bars against the glow, with orange flanks
  const tinted = steel.metalness === 1 ? L.cached('htrRvsTint', () => new THREE.MeshPhysicalMaterial({ color: '#8F8A84', metalness: 1, roughness: 0.3, anisotropy: 0.3, anisotropyRotation: Math.PI / 2, name: 'heat-tinted stainless' })) : steel;
  const hot = on ? L.cached(`htrHot:${table}:${tinted.uuid}`, () => spill(tinted, [
    { a: V3(0, yE0 + 0.025, 0), b: V3(0, yE1 - 0.02, 0), color: [1.0, 0.3, 0.06], I: 1.9, R: Re * 1.25, p: 1, wrap: 0.25 },
  ], { key: `htr${table}`, env: 0.28 })) : steel;
  // the screen's cap, its bottom ring and the burner pan: heat-blued, dark steel (in the reflector's
  // shade), so no bright studio band frames the glow
  const capDark = steel.metalness === 1 ? L.cached('htrRvsDark', () => new THREE.MeshPhysicalMaterial({ color: '#4A4440', metalness: 1, roughness: 0.42, name: 'heat-blued steel' })) : steel;
  const hotDark = on ? L.cached(`htrHotDark:${table}:${capDark.uuid}`, () => spill(capDark, [
    { a: V3(0, yE0 + 0.025, 0), b: V3(0, yE1 - 0.02, 0), color: [1.0, 0.3, 0.06], I: 1.6, R: Re * 1.2, p: 1, wrap: 0.25 },
  ], { key: `htrD${table}`, env: 0.35 })) : steel;
  const hotRefl = on ? L.cached(`htrHotR:${table}:${steel.uuid}`, () => spill(steel, [
    // the reflector mirrors the screen: a broad orange ring round the centre of its underside
    { a: V3(0, yE0 + 0.03, 0), b: V3(0, yE1 - 0.01, 0), color: [1.0, 0.32, 0.07], I: 3.4, R: Re * 1.8, p: 0.8, wrap: 0.1 },
  ], { key: `htrR${table}`, env: 0.14 })) : steel;
  // control box with the gas knob and the piezo button, facing the door side
  const hotBox = on ? L.cached(`htrHotBox:${table}:${steel.uuid}`, () => spill(steel, [
    { a: V3(0, yE0 + 0.025, 0), b: V3(0, yE1 - 0.02, 0), color: [1.0, 0.3, 0.06], I: 1.6, R: Re * 1.1, p: 1, wrap: 0.2 },
  ], { key: `htrB${table}`, env: 0.8 })) : steel;
  bins.add(hotBox, G.lathe([[poleR + 0.001, yC], [0.085 * k, yC + 0.012], [0.088 * k, yC + 0.03], [0.088 * k, yC + 0.1 * k], [0.08 * k, yC + 0.112 * k], [0.04, yC + 0.116 * k]], 64));
  const cA = doorAz, cn = out(cA);
  // gas control knob: chrome bezel, black knob with a grip fin and a white pointer, so it reads
  // as a knob (not a hole) from any angle; piezo ignition button in a chrome collar beside it
  const chrome = L.cached('htrChrome', () => new THREE.MeshPhysicalMaterial({ color: '#E2E4E6', metalness: 1, roughness: 0.12, name: 'chrome' }));
  const white = L.moulded('#F2F1EC', 0.4);
  const mount = (g, dirV, r, y) => { g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dirV)); const pp = dirV.clone().multiplyScalar(r).setY(y); g.translate(pp.x, pp.y, pp.z); return g; };
  const ky = yC + 0.06 * k, kr = 0.086 * k;
  bins.add(chrome, mount(G.lathe([[0.017 * k, -0.002], [0.027 * k, -0.002], [0.0285 * k, 0.002], [0.027 * k, 0.005], [0.0185 * k, 0.005], [0.017 * k, 0.003]], 48), cn, kr, ky));
  bins.add(knobMat(), mount(G.lathe([[0.0001, 0], [0.021 * k, 0], [0.0215 * k, 0.006 * k], [0.02 * k, 0.014 * k], [0.017 * k, 0.017 * k], [0.0001, 0.0185 * k]], 48), cn, kr, ky));
  {
    // grip fin across the knob face, turned to "ON" (~35 degrees)
    const fin = G.roundedBox(0.034 * k, 0.009 * k, 0.012 * k, 0.003 * k, 3);
    const ptr = G.roundedBox(0.011 * k, 0.0022 * k, 0.0014 * k, 0.0006 * k, 1); ptr.translate(0.009 * k, 0, 0.0064 * k);
    for (const [m, g] of [[knobMat(), fin], [white, ptr]]) {
      g.rotateZ(35 * DEG); g.translate(0, 0, 0.0185 * k + 0.004 * k);
      // local z -> outward normal cn
      const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), cn);
      g.applyQuaternion(q); const pp = cn.clone().multiplyScalar(kr).setY(ky); g.translate(pp.x, pp.y, pp.z);
      bins.add(m, g);
    }
  }
  const bA = cA + 0.5, bn = out(bA);
  bins.add(chrome, mount(G.lathe([[0.0075 * k, -0.001], [0.0115 * k, -0.001], [0.012 * k, 0.003], [0.0075 * k, 0.004]], 32), bn, kr - 0.002, ky));
  bins.add(L.moulded('#B3261E', 0.32), mount(G.lathe([[0.0001, 0], [0.0074 * k, 0], [0.0074 * k, 0.006], [0.006 * k, 0.0085], [0.0001, 0.009]], 24), bn, kr - 0.002, ky));
  bins.add(hotDark, G.lathe([[0.04, yE0], [Rg + 0.006, yE0 + 0.004], [Rg + 0.006, yE0 + 0.016], [0.0001, yE0 + 0.018]], 64));
  const emit = new THREE.CylinderGeometry(Re, Re, He - 0.03, 96, 1, true); emit.translate(0, (yE0 + yE1) / 2, 0);
  bins.add(emitterMat(on, TAU * Re, He - 0.03), emit);
  // the screen's domed top cap and the bottom ring (dark steel)
  bins.add(hotDark, G.lathe([[0.0001, yE1 - 0.016], [Re + 0.006, yE1 - 0.016], [Re + 0.006, yE1 - 0.004], [0.0001, yE1 - 0.002]], 48));
  bins.add(hotDark, G.lathe([[Re - 0.002, yE0 + 0.012], [Re + 0.005, yE0 + 0.012], [Re + 0.005, yE0 + 0.022], [Re - 0.002, yE0 + 0.022]], 64));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13, c = out(a).multiplyScalar(Rg);
    bins.add(hot, G.tube(c.clone().setY(yE0 + 0.014), c.clone().setY(yE1 + 0.004), table ? 0.0028 : 0.0038, 10));
  }
  for (const yy of [yE0 + 0.06, yE1 + 0.002]) { const t = new THREE.TorusGeometry(Rg, table ? 0.003 : 0.004, 8, 96); t.rotateX(Math.PI / 2); t.translate(0, yy, 0); bins.add(hot, t); }
  // reflector hat: thin spun cone with a rolled rim, on three stays. Underside (lit by the
  // screen) and top are separate surfaces, so only the underside takes the glow
  bins.add(hotRefl, G.lathe([[0.0001, yR + hR - 0.012], [0.05, yR + hR - 0.016], [Rr * 0.55, yR + hR * 0.42], [Rr - 0.004, yR - 0.002], [Rr + 0.004, yR - 0.004], [Rr + 0.008, yR + 0.001]], 160));
  bins.add(steel, G.lathe([[Rr + 0.008, yR + 0.001], [Rr + 0.004, yR + 0.006], [Rr * 0.55, yR + hR * 0.42 + 0.008], [0.05, yR + hR - 0.006], [0.0001, yR + hR - 0.004]], 160));
  bins.add(steel, G.lathe([[0.0001, yR + hR - 0.006], [0.055, yR + hR - 0.006], [0.05, yR + hR + 0.012], [0.02, yR + hR + 0.026], [0.006, yR + hR + 0.04], [0.0001, yR + hR + 0.042]], 48));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5, c0 = out(a).multiplyScalar(Rg).setY(yE1 + 0.004), c1 = out(a).multiplyScalar(Rr * 0.5).setY(yR + hR * 0.42 + 0.004);
    bins.add(hot, G.tube(c0, c1, table ? 0.003 : 0.0045, 8));
  }
  yTop = yR + hR + 0.042;
  if (on) {
    // bloom round the glowing screen (noise-free, js/lightGlow.js): an orange core hugging the
    // screen and a wide warm tail that spreads under the reflector
    const pts = []; for (let i = 0; i <= 12; i++) pts.push(V3(0, yE0 + 0.02 + (He - 0.04) * (i / 12), 0));
    GC.haloTube(pts, Re * 3.4, [1.25, 0.4, 0.08], 0.62, { core: 0.42, coreW: 0.72, radial: 28, iFn: (t) => 0.62 * (0.55 + 0.45 * Math.exp(-Math.pow((t - 0.58) / 0.5, 2))) });
    GC.halo({ c: V3(0, (yE0 + yE1) / 2, 0), R: Re * 6.5, color: [1.2, 0.42, 0.1], I: 0.22, core: 0.5, coreW: 0.4 });
    // warm light on the floor round the heater; the bottle housing (or the foot) shades the
    // floor right under it
    const yS = (yE0 + yE1) / 2, Rsh = table ? 0.17 : 0.215, ySh = table ? 0.07 : 0.88, pad = table ? 0.9 : 1.7;
    const occl = (x, z, s) => {
      const r = Math.hypot(x, z), rs = Rsh * s.p.y / Math.max(0.05, s.p.y - ySh);
      return G.smoothstep(rs * 0.82, rs * 1.25, r) * G.smoothstep(pad, pad * 0.45, r);
    };
    GC.floorPool([{ p: V3(0, yS, 0), I: 1, color: [1.25, 0.46, 0.12] }], { pad, res: 200, k: table ? 0.22 : 1.1, max: table ? 0.2 : 0.17, minH: 0.05, occl });
  }
  return { top: yTop, detailY: (yE0 + yE1) / 2 };
}

// ---------------------------------------------------------------------------------------
// flame column heaters (pyramid / lounge)

function flameGeometry(y0, y1, R, seed = 1) {
  // a swirling flame: a tube around a helical centreline inside the glass, emissive colour by height
  const nz = L.noise;
  const N = 220, radial = 18;
  const pos = [], glow = [], idx = [];
  const turns = (y1 - y0) * 1.7 + 0.8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = y0 + t * (y1 - y0);
    const a = t * turns * TAU + seed;
    const rh = R * (0.18 + 0.16 * G.smoothstep(0, 0.3, t));
    const cx = Math.cos(a) * rh, cz = Math.sin(a) * rh;
    const rf = R * (0.16 + 0.46 * G.smoothstep(0, 0.12, t) * (1 - 0.5 * G.smoothstep(0.55, 1, t))) * (1 + 0.18 * nz.noise(t * 9 + seed, 1.7));
    // colour (linear, pre-exposure) and coverage by height
    let c, cov;
    if (t < 0.05) { c = [0.2, 0.35, 1.3]; cov = 0.5; }
    else if (t < 0.35) { const u = G.smoothstep(0.05, 0.14, t); c = [G.lerp(0.8, 2.1, u), G.lerp(0.55, 0.9, u), G.lerp(1.1, 0.12, u)]; cov = 0.92; }
    else { const u = G.smoothstep(0.35, 1, t); c = [G.lerp(2.1, 1.2, u), G.lerp(0.9, 0.16, u), G.lerp(0.12, 0.02, u)]; cov = G.lerp(0.92, 0.0, Math.pow(u, 1.5)); }
    for (let k = 0; k <= radial; k++) {
      const b = (k / radial) * TAU;
      // tongues: coverage varies round the flame and along it
      const tongue = 0.7 + 0.3 * nz.noise(Math.cos(b) * 1.3 + t * 11 + seed, Math.sin(b) * 1.3 + t * 3);
      pos.push(cx + Math.cos(b) * rf, y, cz + Math.sin(b) * rf);
      const cv = Math.max(0, Math.min(0.97, cov * tongue));
      glow.push(c[0] * cv, c[1] * cv, c[2] * cv, cv);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < N; i++) for (let k = 0; k < radial; k++) { const p0 = i * row + k; idx.push(p0, p0 + row, p0 + 1, p0 + 1, p0 + row, p0 + row + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 4));
  g.setIndex(idx);
  return g;
}

function flameTransMat() {
  return L.cached('htrFlameTrans', () => new THREE.ShaderMaterial({
    name: 'flame attenuation', side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: 'attribute vec4 aGlow; varying float vC; void main() { vC = aGlow.a; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 ); }',
    fragmentShader: 'varying float vC; void main() { gl_FragColor = vec4( vec3( 1.0 - 0.5 * vC ), 1.0 ); }',
  }));
}

function flameColumn(bins, extra, { H, W, Hb, Wt, R, on, mat, lounge = false, GC }) {
  const body = mat;
  const seam = L.moulded('#0E0E0F', 0.6);
  // lit: the flame lights the posts, tie frames, collars, the housing's top plate and the hood's
  // underside (js/heatGlow.js spill); the housing sides and the hood's top keep the studio light
  const yF0 = Hb + 0.016 + 0.06, yF1 = H - (lounge ? 0.11 : 0.19) - 0.08;
  const hot = on ? L.cached(`htrFlameHot:${lounge}:${body.uuid}`, () => spill(body, [
    { a: V3(0, yF0, 0), b: V3(0, G.lerp(yF0, yF1, 0.55), 0), color: [1.0, 0.42, 0.11], I: 0.85, R: 0.13, p: 1.6, wrap: 0.1 },
    { a: V3(0, G.lerp(yF0, yF1, 0.55), 0), b: V3(0, yF1, 0), color: [1.0, 0.36, 0.08], I: 0.45, R: 0.13, p: 1.6, wrap: 0.1 },
  ], { key: `fl${lounge}` })) : body;
  // plinth, tapered housing, top plate
  bins.add(body, frustum(W + 0.02, W + 0.02, 0, 0.016));
  const Wh = W * 0.88;
  bins.add(body, frustum(W, Wh, 0.016, Hb));
  bins.add(hot, frustum(Wh + 0.024, Wh + 0.024, Hb, Hb + 0.016));
  // door on the front face: the face leans back, so the seams follow the taper
  const face = (y, inset = 0) => { const w = G.lerp(W, Wh, (y - 0.016) / (Hb - 0.016)); return w / 2 + 0.0006 - inset; };
  const yd0 = 0.07, yd1 = Hb - 0.07;
  for (const s of [-1, 1]) {
    const a = V3(s * (face(yd0) - 0.06), yd0, face(yd0)), b = V3(s * (face(yd1) - 0.06), yd1, face(yd1));
    bins.add(seam, G.tube(a, b, 0.0012, 6));
  }
  for (const yy of [yd0, yd1]) bins.add(seam, G.tube(V3(-(face(yy) - 0.06), yy, face(yy)), V3(face(yy) - 0.06, yy, face(yy)), 0.0012, 6));
  // door handle (recessed pull) and vents on the side faces
  const hy = (yd0 + yd1) / 2 + 0.06;
  bins.add(knobMat(), G.roundedBox(0.012, 0.07, 0.008, 0.004, 2).translate(face(hy) - 0.09, hy, face(hy) + 0.002));
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
    const yy = 0.06 + k * 0.022, x = s * (face(yy) + 0.0002);
    const g = G.roundedBox(0.0014, 0.008, W * 0.42, 0.0035, 2); g.translate(x, yy, 0); bins.add(seam, g);
  }
  // burner bowl, glass tube with collars
  const yG0 = Hb + 0.016, yG1 = H - (lounge ? 0.11 : 0.19);
  bins.add(hot, G.lathe([[R * 1.25, yG0], [R * 1.25, yG0 + 0.035], [R + 0.004, yG0 + 0.04], [R + 0.004, yG0 + 0.03], [0.0001, yG0 + 0.03]], 48));
  bins.add(hot, G.lathe([[R + 0.004, yG1 - 0.03], [R * 1.25, yG1 - 0.026], [R * 1.25, yG1], [0.0001, yG1 + 0.001]], 48));
  // quartz tube: real (noise-free) glass, the flame is seen through it
  const tube = new THREE.CylinderGeometry(R, R, yG1 - yG0 - 0.06, 64, 1, true); tube.translate(0, (yG0 + yG1) / 2, 0);
  // (lit: the hot glass and the burner's soot dim the backdrop seen through it a little, so the
  // flame keeps its colour against the light studio)
  extra.push(GC.glass(tube, { T: on ? [0.8, 0.72, 0.62] : [0.93, 0.93, 0.92], env: 1.1, rough: 0.03, markerSide: THREE.DoubleSide }));
  // posts from the housing corners to the hood corners, two tie frames
  const c0 = Wh / 2 - 0.025, c1 = Wt / 2;
  const postAt = (sx, sz, y) => { const t = (y - Hb) / (yG1 - Hb); return V3(sx * G.lerp(c0, c1, t), y, sz * G.lerp(c0, c1, t)); };
  const sq = (w) => G.roundedRectProfile(w, w, w * 0.18, 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bins.add(hot, G.prism(sq(lounge ? 0.018 : 0.022), postAt(sx, sz, Hb + 0.016), postAt(sx, sz, yG1 + 0.012), { side: V3(sx, 0, -sz).normalize() }));
  for (const f of lounge ? [0.5] : [0.36, 0.7]) {
    const y = G.lerp(Hb, yG1, f);
    const cs = [postAt(-1, -1, y), postAt(1, -1, y), postAt(1, 1, y), postAt(-1, 1, y)];
    for (let i = 0; i < 4; i++) bins.add(hot, G.tube(cs[i], cs[(i + 1) % 4], 0.005, 8));
    // tube guard ring held by four spokes
    const rr = R + 0.012;
    const ring = new THREE.TorusGeometry(rr, 0.004, 8, 48); ring.rotateX(Math.PI / 2); ring.translate(0, y, 0); bins.add(hot, ring);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; bins.add(hot, G.tube(V3(Math.sin(a) * rr, y, Math.cos(a) * rr), cs[[2, 1, 0, 3][i]].clone(), 0.0035, 6)); }
  }
  // square hood: plate + shallow pyramid roof with a vent cap
  const Wr = Wt + (lounge ? 0.09 : 0.14);
  bins.add(hot, frustum(Wt + 0.03, Wt + 0.03, yG1 + 0.012, yG1 + 0.03));
  bins.add(hot, frustum(Wr, Wr, yG1 + 0.03, yG1 + 0.042));
  bins.add(body, frustum(Wr - 0.004, Wr * 0.32, yG1 + 0.042, H - 0.03));
  bins.add(body, frustum(Wr * 0.3, Wr * 0.26, H - 0.03, H));
  // control knob + igniter on the front of the housing top
  const kz = Wh / 2 + 0.002, ky = Hb - 0.035;
  const kn = G.lathe([[0.0001, 0], [0.021, 0], [0.021, 0.018], [0.017, 0.024], [0.0001, 0.025]], 32); kn.rotateX(Math.PI / 2); kn.translate(0.07, ky, kz); bins.add(knobMat(), kn);
  const bt = G.lathe([[0.0001, 0], [0.008, 0], [0.008, 0.008], [0.0001, 0.009]], 16); bt.rotateX(Math.PI / 2); bt.translate(0.12, ky, kz); bins.add(L.moulded('#B3261E', 0.4), bt);
  if (on) {
    // the flame: additive light inside the glass (no speckle), plus a warm bloom round the tube
    const fg = flameGeometry(yG0 + 0.04, yG1 - 0.05, R, 1.3);
    GC.surface(fg);
    // the flame is a dense glowing gas: it hides what lies behind it (trans pass), so its colour
    // is not washed out by the light backdrop seen through the tube
    GC.transRoot.add(new THREE.Mesh(fg, flameTransMat()));
    // the hot gas fills the tube with a soft amber glow, strongest low down
    const yf0 = yG0 + 0.08, yf1 = yG1 - 0.08;
    // (two overlapping segments: their soft round ends blend, no joints)
    GC.line({ a: V3(0, yf0, 0), b: V3(0, yf1, 0), color: [1.0, 0.42, 0.08], I: 0.16, s1: R * 0.32, s2: R * 0.8, w2: 0.5 });
    GC.line({ a: V3(0, yf0 + 0.02, 0), b: V3(0, G.lerp(yf0, yf1, 0.5), 0), color: [1.0, 0.46, 0.1], I: 0.2, s1: R * 0.3, s2: R * 0.75, w2: 0.45 });
    const pts = []; for (let i = 0; i <= 16; i++) pts.push(V3(0, yG0 + 0.06 + (yG1 - yG0 - 0.16) * (i / 16), 0));
    GC.haloTube(pts, R * 4.6, [1.25, 0.5, 0.12], 0.62, { core: 0.36, coreW: 0.72, radial: 28, iFn: (t) => 0.62 * (1 - 0.6 * t) * G.smoothstep(0, 0.12, t) });
    // warm light on the floor round the housing (the housing shades the floor under it)
    const yS = G.lerp(yG0, yG1, 0.4), pad = lounge ? 1.0 : 1.4, half = W / 2 + 0.01;
    const occl = (x, z, s) => {
      const r = Math.max(Math.abs(x), Math.abs(z)), rs = half * s.p.y / Math.max(0.05, s.p.y - Hb);
      return G.smoothstep(rs * 0.8, rs * 1.2, r) * G.smoothstep(pad, pad * 0.45, Math.hypot(x, z));
    };
    GC.floorPool([{ p: V3(0, yS, 0), I: 1, color: [1.25, 0.5, 0.13] }], { pad, res: 200, k: lounge ? 0.5 : 0.9, max: 0.16, minH: 0.05, occl });
  }
  return { top: H, detailY: G.lerp(yG0, yG1, 0.35) };
}

// ---------------------------------------------------------------------------------------
// electric infrared heater

function electric(p, GC) {
  const watt = Number(p.watt ?? 1500);
  const on = p.on !== false;
  const Lh = watt > 1800 ? 0.6 : 0.47, Hh = 0.096, Dh = 0.082;
  // shown fitted (default with the clamp): on a piece of easy-up leg, through the clamp and the
  // bracket; mountedOn 'leg': the same at the y axis without the leg (a tent provides it);
  // clamp false: standing on its bracket on the floor
  const mountedTent = p.mountedOn === 'leg';
  const fitted = mountedTent || p.clamp !== false;
  const zT = Dh * 0.33 - 0.012;
  const tubeA = V3(-Lh / 2 + 0.03, 0, zT), tubeB = V3(Lh / 2 - 0.03, 0, zT);
  // lit: the polished trough mirrors the tube (a gold-orange band round it), the lips, holders
  // and end caps pick up its light (js/heatGlow.js spill)
  const tubeSpill = (I, R, env, key, p0 = 1, wrap = 0) => [{ a: tubeA, b: tubeB, color: [1.0, 0.5, 0.14], I, R, p: p0, wrap }];
  const aluBase = L.cached('htrAlu', () => new THREE.MeshPhysicalMaterial({ color: '#BCC0C4', metalness: 1, roughness: 0.36, name: 'anodised aluminium' }));
  const alu = on ? L.cached('htrAluHot', () => spill(aluBase, tubeSpill(1.2, 0.03, 0.8, 'alu', 1, 0.2), { key: 'eAlu', env: 0.8 })) : aluBase;
  const capBase = L.moulded('#151515', 0.42);
  const cap = on ? L.cached('htrCapHot', () => spill(capBase, tubeSpill(0.8, 0.025), { key: 'eCap' })) : capBase;
  const bins = new G.PartBin();
  // extruded housing: back body with horizontal cooling ribs, open front with two lips
  // (the back body ends behind the trough's deepest point, z = 0.001)
  const back = G.roundedBox(Lh, Hh, Dh / 2 - 0.0015, 0.014, 4); back.translate(0, 0, -(Dh / 2 + 0.0015) / 2); bins.add(aluBase, back);
  for (let i = -3; i <= 3; i++) { const r = G.roundedBox(Lh - 0.004, 0.004, 0.012, 0.0015, 1); r.translate(0, i * 0.012, -Dh / 2 - 0.004); bins.add(aluBase, r); }
  for (const s of [-1, 1]) { const lip = G.roundedBox(Lh, 0.012, Dh * 0.42, 0.004, 2); lip.translate(0, s * (Hh / 2 - 0.006), Dh * 0.29); bins.add(alu, lip); }
  // reflector trough (polished)
  const reflBase = L.cached('htrRefl2', () => new THREE.MeshPhysicalMaterial({ color: '#E9E1CC', metalness: 1, roughness: 0.14, side: THREE.DoubleSide, name: 'reflector' }));
  // lit: the trough is a gold mirror full of the tube's light: a bright gold band next to the
  // tube, deep orange towards the lips (its studio reflection is dimmed, the glow carries)
  const refl = on ? L.cached('htrReflHot2', () => spill(new THREE.MeshPhysicalMaterial({ color: '#9C7A44', metalness: 1, roughness: 0.3, side: THREE.DoubleSide, name: 'reflector lit' }), [
    { a: tubeA, b: tubeB, color: [1.0, 0.34, 0.055], I: 2.1, R: 0.03, p: 0.5, wrap: 0.2, twoSided: true },
    { a: tubeA, b: tubeB, color: [1.0, 0.52, 0.13], I: 1.3, R: 0.01, p: 0.5, wrap: 0.2, twoSided: true },
  ], { key: 'eRefl2', env: 0.08 })) : reflBase;
  bins.add(refl, G.surface((u, v, o) => { const yy = (v - 0.5) * (Hh - 0.022); o.set((u - 0.5) * (Lh - 0.03), yy, Dh * 0.33 - (1 - (yy / ((Hh - 0.022) / 2)) ** 2) * 0.026); }, 8, 24));
  // quartz-halogen tube (gold-coated back) in ceramic holders: lit, a white-hot gold core
  const tubeG = new THREE.CylinderGeometry(0.0052, 0.0052, Lh - 0.05, 24); tubeG.rotateZ(Math.PI / 2); tubeG.translate(0, 0, zT);
  bins.add(on ? L.cached('htrTubeLit2', () => new THREE.MeshStandardMaterial({ color: '#2A1A0C', emissive: new THREE.Color().setRGB(1.0, 0.56, 0.17), emissiveIntensity: 2.7, roughness: 0.3, name: 'halogen tube lit' })) : L.cached('htrTubeOff', () => new THREE.MeshPhysicalMaterial({ color: '#C9A15C', metalness: 0.7, roughness: 0.25, name: 'gold quartz tube' })), tubeG);
  const ceramic = on ? L.cached('htrCeramicHot', () => spill(L.moulded('#ECE9E1', 0.7), tubeSpill(0.6, 0.02), { key: 'eCer' })) : L.moulded('#ECE9E1', 0.7);
  for (const s of [-1, 1]) { const h = G.roundedBox(0.016, 0.022, 0.02, 0.004, 2); h.translate(s * (Lh / 2 - 0.022), 0, zT); bins.add(ceramic, h); }
  // wire guard: vertical wires across the opening and two rails (dark bars over the glow)
  const wire = L.diecast('#1C1C1E', { rough: 0.4, coat: 0.2 });
  for (let i = 0; i <= 18; i++) { const x = -Lh / 2 + 0.03 + (i / 18) * (Lh - 0.06); bins.add(wire, G.tube(V3(x, -Hh / 2 + 0.01, Dh / 2 + 0.004), V3(x, Hh / 2 - 0.01, Dh / 2 + 0.004), 0.0011, 5)); }
  for (const yy of [-0.022, 0.022]) bins.add(wire, G.tube(V3(-Lh / 2 + 0.02, yy, Dh / 2 + 0.0055), V3(Lh / 2 - 0.02, yy, Dh / 2 + 0.0055), 0.0013, 6));
  // end caps
  for (const s of [-1, 1]) { const c = G.roundedBox(0.02, Hh + 0.012, Dh + 0.012, 0.007, 3); c.translate(s * (Lh / 2 + 0.008), 0, 0); bins.add(cap, c); }
  const body = L.diecast('#1B1C1E');
  const xs = Lh / 2 + 0.024;
  // tilt knobs on the end caps (part of the head)
  for (const s of [-1, 1]) { const kb = G.lathe([[0.0001, -0.006], [0.012, -0.006], [0.012, 0.006], [0.0001, 0.006]], 24); kb.rotateZ(Math.PI / 2); kb.translate(s * (xs + 0.009), 0, 0); bins.add(capBase, kb); }
  const headG = new THREE.Group(); bins.build(headG);
  const group = new THREE.Group(); group.name = `heater elektrisch ${watt} W`;
  const bins2 = new G.PartBin();
  const rub = L.cableRubber('#151515', 0.55);
  let tiltDeg, glowWorld = null;
  if (fitted) {
    // clamp round the leg (y axis) at hc, the bracket as a fork from the stud to the knobs
    const hc = mountedTent ? Number(p.height ?? 2.0) : 1.9;
    const stud = PM.clampAt(bins2, body, capBase, hc);
    const zb = 0.072;
    const fork = PM.forkBracket(xs, zb); fork.translate(0, hc, stud.z - 0.002 + zb); bins2.add(body, fork);
    tiltDeg = mountedTent ? 22 : 12;                // pointing a little down, at the people
    headG.rotation.x = tiltDeg * DEG;
    headG.position.set(0, hc, stud.z - 0.002 + zb);
    if (!mountedTent) {
      // the leg: runs out of the frame both ways
      const legB = new G.PartBin(); PM.easyUpLeg(legB, hc - 1.2, hc + 0.9);
      const legG = new THREE.Group(); legB.build(legG); SG.noFrame(legG); group.add(legG);
      // cable from the right end cap, hanging down along the leg
      const hm = new THREE.Matrix4().compose(headG.position, new THREE.Quaternion().setFromEuler(headG.rotation), V3(1, 1, 1));
      const s0 = V3(Lh / 2 + 0.012, -0.03, -0.03).applyMatrix4(hm);
      const ctrl = [s0, s0.clone().add(V3(0.01, -0.05, -0.01)), V3(s0.x - 0.02, hc - 0.2, s0.z - 0.06), V3(0.05, hc - 0.45, 0.06), V3(0.035, hc - 0.9, 0.035)];
      const cab = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(80);
      const cg = new THREE.Group(); const cb = new G.PartBin(); cb.add(rub, L.sweepProfile(cab, L.circleProfile(0.0035, 12)).geo); cb.build(cg);
      // the first few cm count for the framing (the cable gland), the rest hangs out of the frame
      SG.noFrame(cg); group.add(cg);
    }
  } else {
    // standing on its bracket (U opening up, base on the floor), tilted up
    const yb = Hh / 2 + 0.03;
    const strap = (a, b, side) => G.flatBar(a, b, 0.024, 0.003, side, 0.0012);
    for (const s of [-1, 1]) {
      bins2.add(body, strap(V3(s * xs, yb + 0.014, 0), V3(s * xs, 0.012, 0), V3(0, 0, 1)));
      const bend = new THREE.TorusGeometry(0.0105, 0.0015, 6, 10, Math.PI / 2); bend.scale(1, 1, 8); bend.rotateZ(s > 0 ? -Math.PI / 2 : Math.PI); bend.translate(s * (xs - 0.0105), 0.012, 0); bins2.add(body, bend);
    }
    bins2.add(body, strap(V3(-xs + 0.0105, 0.0015, 0), V3(xs - 0.0105, 0.0015, 0), V3(0, 0, 1)));
    tiltDeg = -18;
    headG.rotation.x = tiltDeg * DEG; headG.position.y = yb;
    const s0 = V3(Lh / 2 + 0.012, -0.02, -0.03).applyAxisAngle(V3(1, 0, 0), tiltDeg * DEG).add(V3(0, yb, 0));
    const ctrl = [s0, s0.clone().add(V3(0.02, -0.03, -0.02)), V3(s0.x + 0.05, 0.004, s0.z - 0.08), V3(s0.x + 0.13, 0.004, s0.z - 0.05), V3(s0.x + 0.17, 0.004, s0.z + 0.05)];
    const cab = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(60);
    cab.forEach((q, i) => { if (i > 10) q.y = Math.max(0.0035, q.y); });
    bins2.add(rub, L.sweepProfile(cab, L.circleProfile(0.0035, 12)).geo);
    const e = cab[cab.length - 1], dE = e.clone().sub(cab[cab.length - 3]).setY(0).normalize();
    const parts = []; L.rubberPlug((m, g) => parts.push([m, g]), rub, L.e27Mats().nickel);
    const yAx = dE.clone().negate(), zAx = V3(0, 1, 0), xAx = V3().crossVectors(yAx, zAx);
    const M4 = new THREE.Matrix4().makeBasis(xAx, yAx, zAx).setPosition(e.x, 0.0186, e.z);
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins2.add(m, g); }
  }
  const g2 = new THREE.Group(); bins2.build(g2);
  group.add(headG, g2);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = !/lit/.test(o.material.name || ''); o.receiveShadow = true; } });
  // the hero: the fitted heater turned towards the camera, the leg behind it
  const rotY = fitted && !mountedTent ? -4 * DEG : 0;
  group.rotation.y = rotY;
  group.updateMatrixWorld(true);
  if (on) {
    const toW = (q) => q.clone().applyMatrix4(headG.matrixWorld);
    const pts = []; for (let i = 0; i <= 12; i++) pts.push(toW(V3(-Lh / 2 + 0.04 + (Lh - 0.08) * (i / 12), 0, zT + 0.01)));
    // bloom: a hot gold core along the tube and a wide orange tail
    GC.haloTube(pts, 0.08, [1.3, 0.56, 0.12], 0.72, { core: 0.32, coreW: 0.72, radial: 24 });
    GC.haloTube(pts, 0.22, [1.2, 0.44, 0.1], 0.46, { core: 0.5, coreW: 0.5, radial: 24 });
    glowWorld = pts;
    if (!fitted) {
      const src = pts.map((q) => ({ p: q.clone().add(V3(0, 0, 0.04)), I: 1, color: [1.2, 0.62, 0.26] }));
      GC.floorPool(src, { pad: 0.34, res: 160, k: 0.0012, max: 0.3, minH: 0.07 });
    }
  }
  void glowWorld;
  const outer = new THREE.Group(); outer.add(group);
  const dT = fitted ? V3(Lh * 0.2, 0, zT).applyMatrix4(headG.matrixWorld) : V3(Lh * 0.25, Hh / 2 + 0.03, 0.02);
  return {
    object: outer,
    detail: { target: dT.toArray(), size: 0.22, azimuth: 30, elevation: 12 },
    view: fitted && !mountedTent ? { hero: { elevation: 24 } } : { hero: { elevation: 17 } },
    meta: { kind: 'elektrisch', watt, fitted },
  };
}

// ---------------------------------------------------------------------------------------

export function heater(p = {}) {
  const kind = String(p.kind || 'gas').toLowerCase();
  const on = p.on !== false;
  const GC = new GlowComp({ name: 'heater' });
  if (kind.startsWith('elek')) {
    const res = electric(p, GC);
    if (!GC.isEmpty()) res.object.add(GC.build(V3(0, 0.05, 0)));
    return { ...res, rig: { default: { exposure: on ? 1.05 : 'auto', contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } } };
  }
  const style = String(p.style || 'paddenstoel').toLowerCase();
  const bins = new G.PartBin();
  const extra = [];
  let info;
  if (style === 'flame' || style === 'pyramide' || style === 'piramide') info = flameColumn(bins, extra, { H: 2.27, W: 0.5, Hb: 0.66, Wt: 0.26, R: 0.05, on, mat: frameMat(p.color || 'zwart'), GC });
  else if (style === 'lounge') info = flameColumn(bins, extra, { H: 1.15, W: 0.4, Hb: 0.44, Wt: 0.3, R: 0.045, on, mat: frameMat(p.color || 'zwart'), lounge: true, GC });
  else if (style === 'tafel' || style === 'table') info = mushroom(bins, extra, { table: true, on, mat: frameMat(p.color || 'rvs'), GC });
  else info = mushroom(bins, extra, { on, mat: frameMat(p.color || 'rvs'), GC });
  const group = new THREE.Group(); group.name = `heater ${kind} ${style}`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { const nm = o.material.name || ''; o.castShadow = !/clear glass|lit/.test(nm); o.receiveShadow = true; } });
  for (const e of extra) group.add(e);
  if (!GC.isEmpty()) group.add(GC.build(V3(0, 0.05, 0)));
  const mushroomStyle = !(style === 'flame' || style === 'pyramide' || style === 'piramide' || style === 'lounge');
  const steelish = !/zwart|antraciet|brons/.test(String(p.color || (style === 'flame' || style === 'lounge' ? 'zwart' : 'rvs')));
  return {
    object: group,
    detail: { target: [0, info.detailY, 0], size: style === 'tafel' ? 0.4 : 0.55, azimuth: 30, elevation: 8 },
    // mushroom heaters: from a little under the reflector's rim, so its underside (orange from the
    // glowing screen) is in the picture, as in a photo of a heater that is on
    view: { hero: { elevation: mushroomStyle ? (style === 'tafel' || style === 'table' ? 4 : 3) : 15 } },
    // stainless reflects the studio: the dark studio map gives it real contrast (light and dark
    // bands) instead of a flat grey; a dimmer key keeps the white of the reflector off the clip
    rig: { default: { exposure: 1.0, env: steelish ? 'studio' : 'room', envIntensity: steelish ? 1.15 : 0.9, contact: { strength: 0.7, h0: 0.01 }, groundAO: { strength: 0.8 } } },
    meta: { kind, style, on },
  };
}

export function heaterElement(p = {}) {
  const watt = Number(p.watt ?? 1500);
  const L2 = watt > 1800 ? 0.58 : 0.48, R = 0.0075;
  const bins = new G.PartBin();
  const quartz = new THREE.MeshPhysicalMaterial({ color: '#F5F2EA', roughness: 0.08, transmission: 0.7, thickness: 0.002, transparent: true, opacity: 0.6, name: 'quartz' });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#D8B26A', metalness: 1, roughness: 0.18, name: 'gold coating' });
  const ceramic = new THREE.MeshStandardMaterial({ color: '#EDEAE2', roughness: 0.75, name: 'ceramic' });
  const wire = new THREE.MeshStandardMaterial({ color: '#B8BBBE', metalness: 1, roughness: 0.3 });
  const tube = new THREE.CylinderGeometry(R, R, L2, 32, 1, true); tube.rotateZ(Math.PI / 2);
  bins.add(quartz, tube);
  // gold reflector coating on the rear half of the tube
  const half = new THREE.CylinderGeometry(R + 0.0003, R + 0.0003, L2 - 0.01, 32, 1, true, Math.PI, Math.PI); half.rotateZ(Math.PI / 2);
  bins.add(gold, half);
  // coiled filament inside
  const pts = []; for (let i = 0; i <= 600; i++) { const t = i / 600, a = t * TAU * 90; pts.push(V3(-L2 / 2 + 0.02 + t * (L2 - 0.04), Math.cos(a) * R * 0.35, Math.sin(a) * R * 0.35)); }
  bins.add(new THREE.MeshStandardMaterial({ color: '#7A5A3A', metalness: 0.5, roughness: 0.4 }), new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1200, 0.0006, 4));
  for (const sx of [-1, 1]) {
    const cap = new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.028, 24); cap.rotateZ(Math.PI / 2); cap.translate(sx * (L2 / 2 + 0.012), 0, 0);
    bins.add(ceramic, cap);
    const lead = []; for (let i = 0; i <= 20; i++) { const t = i / 20; lead.push(V3(sx * (L2 / 2 + 0.026 + t * 0.05), -t * t * 0.03, 0)); }
    bins.add(wire, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lead), 30, 0.0009, 6));
  }
  const group = new THREE.Group(); group.name = `heaterElement ${watt} W`;
  bins.build(group);
  group.position.y = R + 0.0035;
  const wrap = new THREE.Group(); wrap.add(group);
  wrap.traverse((o) => { if (o.isMesh) { o.castShadow = o.material !== quartz; o.receiveShadow = true; } });
  return { object: wrap, detail: { target: [L2 / 2, 0.01, 0], size: 0.12, azimuth: 30, elevation: 20 }, meta: { watt } };
}
