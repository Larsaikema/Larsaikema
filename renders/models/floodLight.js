// LED-vloedlicht (LED floodlight) for party tents, with the leg clamp.
//
// floodLight { watt, on, clamp, color, mountedOn, height }
//   watt       20 | 30 | 50 | 100 (housing size follows the wattage; 30 W = 172 x 136 x 34 mm)
//   on         lit (true): the 8 x 6 SMD LEDs burn white behind the clear cover glass, each with a
//              soft glow on the board round it; a warm-white bloom round the lens
//   clamp      true (default): shown *fitted*: the leg clamp round a piece of hexagonal easy-up
//              leg (running out of the frame), the bracket bolted to its stud as a fork, the lamp
//              tilted 18 deg down and turned a little to its left, so the cooling fins on its back
//              and the clamp are in the picture. false: standing on its bracket on the floor
//   color      'zwart' (default) | 'wit' | 'grijs' housing
//   mountedOn  'leg': as fitted, at the y axis without the leg (a tent provides it), at `height`
//
// Construction: die-cast aluminium housing, powder-coated, with rounded corners, 13 deep vertical
// cooling fins on the back and a cast boss with an IP65 cable gland at the bottom; a raised frame
// holds the tempered cover glass (real, noise-free reflection) over a recessed aluminium LED
// board. A U-bracket of 25 x 3 mm steel strap holds the housing with two star knobs. 1 m H05RN-F
// cable. The clamp is two hinged steel half-rings (inner 52 mm) with a wing bolt and a welded M8
// stud for the bracket.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';
import { GlowComp } from '../js/lightGlow.js';
import * as PM from '../js/poleMount.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function dims(watt) {
  if (watt <= 20) return { W: 0.15, H: 0.118, D: 0.032 };
  if (watt <= 30) return { W: 0.172, H: 0.136, D: 0.034 };
  if (watt <= 50) return { W: 0.214, H: 0.168, D: 0.038 };
  return { W: 0.29, H: 0.226, D: 0.046 };
}

// The lamp head + bracket. Local frame: the tilt axis is the X axis at the origin, the light
// faces +Z; the bracket's U opens upwards, its base plate at y = -yb.
// The LED board behind the clear cover glass: an aluminium-core board with an 8 x 6 grid of
// SMD LEDs (yellow phosphor in a white package). Texture channels: r = emission (lit: the LED
// cores burn white, a soft glow spreads round each one over the board, the board itself stays
// fairly dark so the grid reads), g = diffuse (board grey, package white, phosphor), b = phosphor.
function ledBoardTex(nx = 8, ny = 6, aspect = 1.3) {
  return L.cached(`floodLed2:${nx}:${ny}:${aspect.toFixed(2)}`, () => {
    const W = 640, H = Math.round(640 / aspect), d = new Uint8Array(W * H * 4);
    const px = 1 / nx, py = 1 / ny;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W, v = (y + 0.5) / H;
      const i = Math.min(nx - 1, Math.floor(u / px)), j = Math.min(ny - 1, Math.floor(v / py));
      const du = (u - (i + 0.5) * px) * aspect, dv = v - (j + 0.5) * py;   // square units (board height = 1)
      const pk = 0.034, ph = 0.024;                     // package / phosphor half size
      const box = Math.max(Math.abs(du), Math.abs(dv));
      const inPkg = box < pk ? 1 : 0, inPh = Math.hypot(du, dv) < ph ? 1 : 0;
      const r2 = du * du + dv * dv;
      // emission: hot core, soft glow on the board round it, a faint even board glow
      let e = inPh ? 1 : 0;
      e = Math.max(e, 0.55 * Math.exp(-r2 / (2 * 0.026 * 0.026)) + 0.16 * Math.exp(-r2 / (2 * 0.06 * 0.06)) + 0.05);
      const edge = Math.min(u, 1 - u, v, 1 - v);
      e *= 0.85 + 0.15 * G.smoothstep(0, 0.06, edge);
      const k = (y * W + x) * 4;
      d[k] = Math.round(Math.min(1, e) * 255);
      d[k + 1] = Math.round((inPh ? 0.85 : inPkg ? 0.95 : 0.42) * 255);
      d[k + 2] = inPh ? 255 : 0;
      d[k + 3] = 255;
    }
    const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  });
}
function ledBoardMat(on, aspect) {
  return L.cached(`floodBoard:${on}:${aspect.toFixed(2)}`, () => {
    const tex = ledBoardTex(8, 6, aspect);
    const m = new THREE.MeshPhysicalMaterial({ color: '#A9ADB1', metalness: 0.35, roughness: 0.45, name: on ? 'led board lit' : 'led board' });
    m.userData.tB = { value: tex };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.tB = m.userData.tB;
      sh.vertexShader = sh.vertexShader.replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\nvarying vec2 vBUv;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvBUv = uv;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tB; varying vec2 vBUv;')
        .replace('#include <map_fragment>', `#include <map_fragment>
  vec4 bT = texture2D( tB, vBUv );
  diffuseColor.rgb = mix( diffuseColor.rgb * bT.g, vec3( 0.98, 0.82, 0.32 ) * 0.85, bT.b );`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  ${on ? 'totalEmissiveRadiance += vec3( 1.0, 0.9, 0.74 ) * ( 3.4 * pow( bT.r, 1.6 ) );' : ''}`);
    };
    m.customProgramCacheKey = () => `floodBoard:${on}`;
    return m;
  });
}
function roundedPlane(w, h, r) {
  const sh = new THREE.Shape(); const x0 = -w / 2, y0 = -h / 2;
  sh.moveTo(x0 + r, y0); sh.lineTo(x0 + w - r, y0); sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); sh.lineTo(x0 + w, y0 + h - r);
  sh.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); sh.lineTo(x0 + r, y0 + h); sh.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
  const g = new THREE.ShapeGeometry(sh, 8);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

function head(bins, { watt, on, body, knobMat, tilt, GC, extra, fork = false }) {
  const { W, H, D } = dims(watt);
  const parts = [];
  const add = (m, g) => parts.push([m, g]);
  // housing: rounded slab, slightly domed back
  add(body, G.roundedBox(W, H, D, 0.011, 4));
  // fins on the back
  const nF = 13;
  for (let i = 0; i < nF; i++) {
    const x = -W / 2 + 0.014 + (i / (nF - 1)) * (W - 0.028);
    // fins taper towards their tips and are shorter at the ends (cast shape)
    const hF = (H - 0.02) * (0.86 + 0.14 * Math.sin(Math.PI * (i + 0.5) / nF));
    const f = G.roundedBox(0.0028, hF, 0.024, 0.0012, 2); f.translate(x, 0, -D / 2 - 0.0115); add(body, f);
  }
  // back plate under the fins and the cable boss at the bottom
  const bp = G.roundedBox(W - 0.02, H - 0.02, 0.004, 0.006, 2); bp.translate(0, 0, -D / 2 - 0.0015); add(body, bp);
  const boss = G.lathe([[0.0001, 0], [0.011, 0], [0.011, 0.012], [0.0001, 0.012]], 24); boss.rotateX(Math.PI); boss.translate(W * 0.22, -H / 2 + 0.0005, -D * 0.1); add(body, boss);
  const gland = G.lathe([[0.0001, 0], [0.0075, 0], [0.0075, 0.006], [0.0062, 0.008], [0.0062, 0.014], [0.0045, 0.017], [0.0001, 0.017]], 6); gland.rotateX(Math.PI); gland.translate(W * 0.22, -H / 2 - 0.0115, -D * 0.1); add(knobMat, gland);
  // bezel ring proud of the front, glass inset
  const bez = G.roundedBox(W - 0.002, H - 0.002, 0.004, 0.0105, 4); bez.translate(0, 0, D / 2 + 0.0012); add(body, bez);
  const glassW = W - 0.024, glassH = H - 0.024;
  // recessed LED board (8 x 6 SMD LEDs) inside a polished reflector frame, under clear glass
  const face = roundedPlane(glassW, glassH, 0.004); face.translate(0, 0, D / 2 + 0.0034);
  add(ledBoardMat(on, glassW / glassH), face);
  // a raised frame round the board holds the cover glass (the board sits 2.5 mm under it)
  {
    const rr = (sh, w, h, r) => { const x0 = -w / 2, y0 = -h / 2; sh.moveTo(x0 + r, y0); sh.lineTo(x0 + w - r, y0); sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); sh.lineTo(x0 + w, y0 + h - r); sh.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); sh.lineTo(x0 + r, y0 + h); sh.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0); return sh; };
    const outerS = rr(new THREE.Shape(), W - 0.002, H - 0.002, 0.0105);
    outerS.holes.push(rr(new THREE.Path(), glassW, glassH, 0.004));
    const ring = new THREE.ExtrudeGeometry(outerS, { depth: 0.0028, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 2, curveSegments: 8 });
    ring.translate(0, 0, D / 2 + 0.0026);
    add(body, ring);
  }
  const cover = roundedPlane(glassW + 0.002, glassH + 0.002, 0.0045); cover.translate(0, 0, D / 2 + 0.0056);
  extra.push(cover);
  // tilt knobs (star knobs) on both sides, and the bracket arms
  for (const sx of [-1, 1]) {
    const k = G.lathe([[0.0001, 0], [0.0045, 0], [0.0045, 0.006], [0.0001, 0.006]], 16); k.rotateZ(sx * -Math.PI / 2); k.translate(sx * (W / 2 + 0.004), 0, 0); add(knobMat, k);
    const star = [];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; star.push(G.roundedBox(0.009, 0.0075, 0.012, 0.0035, 2).translate(0, Math.cos(a) * 0.009, Math.sin(a) * 0.009)); }
    star.push(G.lathe([[0.0001, -0.006], [0.0115, -0.006], [0.0115, 0.006], [0.0001, 0.006]], 24).rotateZ(Math.PI / 2));
    for (const sg of star) { sg.translate(sx * (W / 2 + 0.019), 0, 0); add(knobMat, sg); }
  }
  // housing tilted about X
  const Mt = new THREE.Matrix4().makeRotationX(-tilt);
  for (const [m, g] of parts) { g.applyMatrix4(Mt); bins.add(m, g); }
  for (const g of extra) g.applyMatrix4(Mt);
  // U-bracket (not tilted): two arms from the tilt axis down to the base plate
  const yb = H / 2 + 0.024;
  if (fork) return { yb, W, H, D, xs: W / 2 + 0.0085 };
  const strap = (a, b, side) => G.flatBar(a, b, 0.024, 0.003, side, 0.0012);
  const xs = W / 2 + 0.0085;
  for (const sx of [-1, 1]) {
    bins.add(body, strap(V3(sx * xs, 0.018, 0), V3(sx * xs, -yb + 0.012, 0), V3(0, 0, 1)));
    const ring = G.lathe([[0.0001, -0.0015], [0.012, -0.0015], [0.012, 0.0015], [0.0001, 0.0015]], 24); ring.rotateZ(Math.PI / 2); ring.translate(sx * xs, 0.018, 0); bins.add(body, ring);
  }
  bins.add(body, strap(V3(-xs + 0.0105, -yb + 0.0015, 0), V3(xs - 0.0105, -yb + 0.0015, 0), V3(0, 0, 1)));
  // rounded bends at the bottom corners
  for (const sx of [-1, 1]) {
    const bend = new THREE.TorusGeometry(0.0105, 0.0015, 6, 10, Math.PI / 2);
    bend.scale(1, 1, 8); // 24 mm wide strap
    bend.rotateZ(sx > 0 ? -Math.PI / 2 : Math.PI);
    bend.translate(sx * (xs - 0.0105), -yb + 0.012, 0);
    bins.add(body, bend);
  }
  return { yb, W, H, D };
}


export function floodLight(p = {}) {
  const watt = Number(p.watt ?? 30);
  const on = p.on !== false;
  const bodyHex = { zwart: '#1B1C1E', wit: '#E6E6E2', grijs: '#7D8186', antraciet: '#3A3D41' }[String(p.color || 'zwart').toLowerCase()] || '#1B1C1E';
  const body = L.diecast(bodyHex);
  const knobMat = L.moulded('#111111', 0.5);
  const bins = new G.PartBin();
  // shown fitted (default with the clamp): on a piece of easy-up leg, through the clamp and the
  // bracket as a fork; mountedOn 'leg': the same at the y axis without the leg (a tent provides
  // it); clamp false: standing on its bracket
  const mountedTent = p.mountedOn === 'leg';
  const fitted = mountedTent || p.clamp !== false;
  const tilt = fitted ? -18 * DEG : 12 * DEG;
  const GC = new GlowComp({ name: 'floodLight' });
  const extraGeo = [];
  const hd = head(bins, { watt, on, body, knobMat, tilt, GC, extra: extraGeo, fork: fitted });
  const group = new THREE.Group(); group.name = `floodLight ${watt} W`;
  const headG = new THREE.Group(); bins.build(headG);
  const outer = new THREE.Group(); outer.add(headG);
  const bins2 = new G.PartBin();
  const rub = L.cableRubber('#151515', 0.55);
  const Mt = new THREE.Matrix4().makeRotationX(-tilt);
  const g0 = V3(hd.W * 0.22, -hd.H / 2 - 0.028, -hd.D * 0.1).applyMatrix4(Mt);
  if (!fitted) {
    headG.position.y = hd.yb;
    const g0w = g0.clone().setY(g0.y + hd.yb);
    const ctrl = [g0w, g0w.clone().add(V3(0.004, -0.02, -0.008)), V3(g0w.x + 0.02, 0.004, g0w.z - 0.07), V3(g0w.x + 0.1, 0.004, g0w.z - 0.1), V3(g0w.x + 0.17, 0.004, g0w.z - 0.04), V3(g0w.x + 0.19, 0.004, g0w.z + 0.05)];
    const cab = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(70);
    cab.forEach((q, i) => { if (i > 8) q.y = Math.max(0.0035, q.y); });
    bins2.add(rub, L.sweepProfile(cab, L.circleProfile(0.0035, 12)).geo);
    const e = cab[cab.length - 1], dE = e.clone().sub(cab[cab.length - 3]).setY(0).normalize();
    const parts = []; L.rubberPlug((m, g) => parts.push([m, g]), rub, L.e27Mats().nickel);
    const yAx = dE.clone().negate(), zAx = V3(0, 1, 0), xAx = V3().crossVectors(yAx, zAx);
    const M4 = new THREE.Matrix4().makeBasis(xAx, yAx, zAx).setPosition(e.x, 0.0186, e.z);
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins2.add(m, g); }
  } else {
    // clamp round the leg (y axis) at hc, the bracket as a fork from the stud to the tilt knobs
    const hc = mountedTent ? Number(p.height ?? 1.95) : 1.9;
    const stud = PM.clampAt(bins2, body, knobMat, hc);
    const zb = 0.05;
    const fork = PM.forkBracket(hd.xs, zb); fork.translate(0, hc, stud.z - 0.002 + zb); bins2.add(body, fork);
    headG.position.set(0, hc, stud.z - 0.002 + zb);
    if (!mountedTent) {
      const legB = new G.PartBin(); PM.easyUpLeg(legB, hc - 1.2, hc + 0.9);
      const legG = new THREE.Group(); legB.build(legG); SG.noFrame(legG); outer.add(legG);
      // cable from the gland, hanging down along the leg (out of the frame)
      const s0 = g0.clone().add(headG.position);
      const ctrl = [s0, s0.clone().add(V3(0, -0.05, -0.01)), V3(s0.x * 0.5, hc - 0.25, s0.z * 0.4), V3(0.04, hc - 0.6, 0.05), V3(0.03, hc - 1.0, 0.035)];
      const cab = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(80);
      const cg = new THREE.Group(); const cb = new G.PartBin(); cb.add(rub, L.sweepProfile(cab, L.circleProfile(0.0035, 12)).geo); cb.build(cg);
      SG.noFrame(cg); outer.add(cg);
    }
  }
  const g2 = new THREE.Group(); bins2.build(g2); outer.add(g2);
  group.add(outer);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = !/lit/.test(o.material.name || ''); o.receiveShadow = true; } });
  // the hero: turned a little to its left, so the fins and the bracket side are in the picture
  if (fitted && !mountedTent) outer.rotation.y = -14 * DEG;
  group.updateMatrixWorld(true);
  // the cover glass, baked into the product frame (the glow passes see world geometry)
  for (const g of extraGeo) { g.applyMatrix4(headG.matrixWorld); group.add(GC.glass(g, { T: 0.94, env: 1.0, rough: 0.03 })); }
  if (on) {
    const c = V3(0, 0, hd.D / 2 + 0.004).applyMatrix4(Mt).applyMatrix4(headG.matrixWorld);
    const n = V3(0, 0, 1).applyMatrix4(Mt).transformDirection(headG.matrixWorld);
    // bloom: a bright warm-white core over the lens and a wide soft tail
    GC.halo({ c: c.clone().addScaledVector(n, 0.01), R: hd.W * 0.9, color: [1.3, 1.16, 0.92], I: 0.55, core: 0.5, coreW: 0.7 });
    GC.halo({ c: c.clone().addScaledVector(n, 0.02), R: hd.W * 2.2, color: [1.25, 1.08, 0.82], I: 0.28, core: 0.5, coreW: 0.4 });
    if (!fitted) {
      // a soft pool of light on the floor in front of the lens
      const src = [];
      for (let k = 1; k <= 6; k++) src.push({ p: c.clone().addScaledVector(n.clone().setY(0).normalize(), 0.04 + k * 0.05).setY(c.y * 1.1), I: 1 / k, color: [1.2, 1.08, 0.9] });
      GC.floorPool(src, { pad: 0.3, res: 160, k: 0.0028, max: 0.24, minH: 0.05 });
    }
  }
  if (!GC.isEmpty() || extraGeo.length) group.add(GC.build(V3(0, 0.02, 0)));
  const tgt = fitted ? V3(0, 0, hd.D / 2).applyMatrix4(headG.matrixWorld).toArray() : [0, hd.yb, 0.01];
  return {
    object: group,
    detail: { target: tgt, size: hd.W * 1.6, azimuth: 38, elevation: 14 },
    view: { hero: { elevation: fitted && !mountedTent ? 20 : 17 } },
    rig: { default: { exposure: on ? 1.05 : 'auto', contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { watt, on, fitted },
  };
}
