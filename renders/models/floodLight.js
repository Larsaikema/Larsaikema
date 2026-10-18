// LED-vloedlicht (LED floodlight) for party tents, with the leg clamp.
//
// floodLight { watt, on, clamp, color, mountedOn, height }
//   watt       20 | 30 | 50 | 100 (housing size follows the wattage; 30 W = 172 x 136 x 34 mm)
//   on         lit (true): the frosted front glows neutral-warm white with a soft halo
//   clamp      true: the pipe clamp for a 40-50 mm easy-up leg lies in front of the light
//   color      'zwart' (default) | 'wit' | 'grijs' housing
//   mountedOn  'leg': the light as fitted: clamp around a vertical leg on the y axis at `height`
//              (1.95 m), the lamp on its bracket pointing +Z, tilted 25 degrees down
//
// Construction: die-cast aluminium housing, powder-coated, with rounded corners, 13 vertical
// cooling fins on the back and a cast boss with an IP65 cable gland at the bottom; a 6 mm bezel
// frames a frosted tempered-glass diffuser over the SMD board. A U-bracket of 25 x 3 mm steel
// strap holds the housing with two tilt knobs; the light stands on that bracket (as it would on
// a table or the ground), tilted 12 degrees up. 1 m H05RN-F cable with a rubber plug. The clamp
// is two hinged steel half-rings (inner 52 mm) with a wing bolt and a welded M8 stud for the
// bracket.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';
import { GlowComp } from '../js/lightGlow.js';

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
// Emission of the lit front: the SMD array (8 x 6 LEDs) shows through the frosted glass as soft
// brighter spots, the panel falls off a little towards the bezel.
function smdTex(nx = 8, ny = 6) {
  return L.cached(`floodSmd:${nx}:${ny}`, () => {
    const W = 256, H = 192, d = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W, v = (y + 0.5) / H;
      const ex = Math.min(u, 1 - u), ey = Math.min(v, 1 - v);
      let e = 0.8 + 0.2 * G.smoothstep(0, 0.22, Math.min(ex, ey * 1.3));
      let spot = 0;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const cx = (i + 0.5) / nx, cy = (j + 0.5) / ny;
        const dx = (u - cx) * 1.0, dy = (v - cy) * (H / W);
        spot += Math.exp(-(dx * dx + dy * dy) / (2 * 0.026 * 0.026));
      }
      e *= 0.62 + 0.5 * Math.min(1, spot);
      const k = (y * W + x) * 4; const c = Math.round(Math.min(1, e) * 255);
      d[k] = d[k + 1] = d[k + 2] = c; d[k + 3] = 255;
    }
    const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
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

function head(bins, { watt, on, body, knobMat, tilt, GC, extra }) {
  const { W, H, D } = dims(watt);
  const parts = [];
  const add = (m, g) => parts.push([m, g]);
  // housing: rounded slab, slightly domed back
  add(body, G.roundedBox(W, H, D, 0.011, 4));
  // fins on the back
  const nF = 13;
  for (let i = 0; i < nF; i++) {
    const x = -W / 2 + 0.014 + (i / (nF - 1)) * (W - 0.028);
    const f = G.roundedBox(0.0026, H - 0.022, 0.016, 0.001, 1); f.translate(x, 0, -D / 2 - 0.0075); add(body, f);
  }
  // back plate under the fins and the cable boss at the bottom
  const bp = G.roundedBox(W - 0.02, H - 0.02, 0.004, 0.006, 2); bp.translate(0, 0, -D / 2 - 0.0015); add(body, bp);
  const boss = G.lathe([[0.0001, 0], [0.011, 0], [0.011, 0.012], [0.0001, 0.012]], 24); boss.rotateX(Math.PI); boss.translate(W * 0.22, -H / 2 + 0.0005, -D * 0.1); add(body, boss);
  const gland = G.lathe([[0.0001, 0], [0.0075, 0], [0.0075, 0.006], [0.0062, 0.008], [0.0062, 0.014], [0.0045, 0.017], [0.0001, 0.017]], 6); gland.rotateX(Math.PI); gland.translate(W * 0.22, -H / 2 - 0.0115, -D * 0.1); add(knobMat, gland);
  // bezel ring proud of the front, glass inset
  const bez = G.roundedBox(W - 0.002, H - 0.002, 0.004, 0.0105, 4); bez.translate(0, 0, D / 2 + 0.0012); add(body, bez);
  const glassW = W - 0.024, glassH = H - 0.024;
  const glass = G.roundedBox(glassW, glassH, 0.002, 0.004, 3); glass.translate(0, 0, D / 2 + 0.0034);
  const lit = on
    ? L.cached('floodLit', () => L.litDiffuser(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new THREE.Color('#FFEFD8'), emissiveIntensity: 5.5, name: 'flood diffuser lit' }), 0.7, 0.4))
    : L.cached('floodOff', () => new THREE.MeshPhysicalMaterial({ color: '#E8E8E4', roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.3, sheenColor: new THREE.Color('#ffffff'), name: 'flood diffuser' }));
  add(lit, glass);
  if (on) {
    // the glowing front face with the SMD spots, and the tempered cover glass over it (real,
    // noise-free reflections of the studio)
    const face = roundedPlane(glassW - 0.001, glassH - 0.001, 0.004); face.translate(0, 0, D / 2 + 0.00445);
    add(L.cached('floodFace', () => L.litDiffuser(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.3, emissive: new THREE.Color('#FFEFD8'), emissiveIntensity: 2.6, emissiveMap: smdTex(), name: 'flood front lit' }), 0.8, 0.4)), face);
  }
  const cover = roundedPlane(glassW + 0.003, glassH + 0.003, 0.0055); cover.translate(0, 0, D / 2 + 0.0052);
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

const legClamp = (bins, mat, wingMat) => L.legClamp(bins, mat, wingMat);

export function floodLight(p = {}) {
  const watt = Number(p.watt ?? 30);
  const on = p.on !== false;
  const bodyHex = { zwart: '#1B1C1E', wit: '#E6E6E2', grijs: '#7D8186', antraciet: '#3A3D41' }[String(p.color || 'zwart').toLowerCase()] || '#1B1C1E';
  const body = L.diecast(bodyHex);
  const knobMat = L.moulded('#111111', 0.5);
  const bins = new G.PartBin();
  const mounted = p.mountedOn === 'leg';
  const tilt = mounted ? -25 * DEG : 12 * DEG;
  const GC = new GlowComp({ name: 'floodLight' });
  const extraGeo = [];
  const hd = head(bins, { watt, on, body, knobMat, tilt, GC, extra: extraGeo });
  const group = new THREE.Group(); group.name = `floodLight ${watt} W`;
  const headG = new THREE.Group(); bins.build(headG);
  const outer = new THREE.Group(); outer.add(headG);
  const bins2 = new G.PartBin();
  // cable from the gland: down to the floor, then a loose curve to the plug
  const rub = L.cableRubber('#151515', 0.55);
  const Mt = new THREE.Matrix4().makeRotationX(-tilt);
  const g0 = V3(hd.W * 0.22, -hd.H / 2 - 0.028, -hd.D * 0.1).applyMatrix4(Mt);
  if (!mounted) {
    headG.position.y = hd.yb;
    const g0w = g0.clone().setY(g0.y + hd.yb);
    const ctrl = [g0w, g0w.clone().add(V3(0.004, -0.02, -0.008)), V3(g0w.x + 0.02, 0.004, g0w.z - 0.07), V3(g0w.x + 0.1, 0.004, g0w.z - 0.1), V3(g0w.x + 0.17, 0.004, g0w.z - 0.04), V3(g0w.x + 0.19, 0.004, g0w.z + 0.05)];
    const cab = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(70);
    cab.forEach((q, i) => { if (i > 8) q.y = Math.max(0.0035, q.y); });
    bins2.add(rub, L.sweepProfile(cab, L.circleProfile(0.0035, 12)).geo);
    const e = cab[cab.length - 1], dE = e.clone().sub(cab[cab.length - 3]).setY(0).normalize();
    // plug lying on its side on the floor, pins pointing along the cable
    const parts = []; L.rubberPlug((m, g) => parts.push([m, g]), rub, L.e27Mats().nickel);
    const yAx = dE.clone().negate(), zAx = V3(0, 1, 0), xAx = V3().crossVectors(yAx, zAx);
    const M4 = new THREE.Matrix4().makeBasis(xAx, yAx, zAx).setPosition(e.x, 0.0186, e.z);
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins2.add(m, g); }
    if (p.clamp !== false) {
      const cb = new G.PartBin(); legClamp(cb, body, knobMat);
      const cg = new THREE.Group(); cb.build(cg);
      cg.position.set(-hd.W * 0.5, 0, hd.D + 0.085); cg.rotation.y = 60 * DEG;
      outer.add(cg);
    }
  } else {
    // fitted on a leg: clamp ring around the y axis at `height`, light 0.11 m out along +Z
    const hgt = Number(p.height ?? 1.95);
    const cb = new G.PartBin(); legClamp(cb, body, knobMat);
    const cg = new THREE.Group(); cb.build(cg); cg.position.y = hgt - 0.015; outer.add(cg);
    headG.rotation.x = 0; headG.position.set(0, hgt + hd.yb - 0.04, 0.14);
  }
  const g2 = new THREE.Group(); bins2.build(g2); outer.add(g2);
  group.add(outer);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = !/lit/.test(o.material.name || ''); o.receiveShadow = true; } });
  // the cover glass, baked into the product frame (the glow passes see world geometry)
  headG.updateMatrix();
  for (const g of extraGeo) { g.applyMatrix4(headG.matrix); group.add(GC.glass(g, { T: 0.94, env: 1.0, rough: 0.03 })); }
  if (on) {
    group.updateMatrixWorld(true);
    const Mt2 = new THREE.Matrix4().makeRotationX(-tilt);
    const c = V3(0, 0, hd.D / 2 + 0.004).applyMatrix4(Mt2).applyMatrix4(headG.matrixWorld);
    const n = V3(0, 0, 1).applyMatrix4(Mt2).transformDirection(headG.matrixWorld);
    GC.halo({ c: c.clone().addScaledVector(n, 0.01), R: hd.W * 0.95, color: [1.25, 1.1, 0.88], I: 0.6, core: 0.55, coreW: 0.75 });
    if (!mounted) {
      // a soft pool of light on the floor in front of the lens
      const src = [];
      for (let k = 1; k <= 6; k++) src.push({ p: c.clone().addScaledVector(n.clone().setY(0).normalize(), 0.04 + k * 0.05).setY(c.y * 1.1), I: 1 / k, color: [1.2, 1.08, 0.9] });
      GC.floorPool(src, { pad: 0.3, res: 160, k: 0.0028, max: 0.24, minH: 0.05 });
    }
  }
  if (!GC.isEmpty() || extraGeo.length) group.add(GC.build(V3(0, 0.02, 0)));
  const tgt = mounted ? [0, Number(p.height ?? 1.95), 0.14] : [0, hd.yb, 0.01];
  return {
    object: group,
    detail: { target: tgt, size: hd.W * 1.6, azimuth: 38, elevation: 14 },
    view: { hero: { elevation: 17 } },
    rig: { default: { exposure: on ? 1.05 : 'auto', contact: { strength: 0.8, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { watt, on },
  };
}
