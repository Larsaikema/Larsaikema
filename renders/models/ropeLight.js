// LED-lichtslang (LED rope light), lying in a loose coil on the floor, lit or unlit.
//
// ropeLight { color, length, on, diameter, cord }
//   color     light colour: 'warmwit' or a light hex like '#F4E3BC' (warm white), 'koelwit', 'rood',
//             'oranje', 'geel', 'groen', 'blauw', 'roze', 'paars', or any '#hex'
//   length    m of rope (5)          diameter  tube diameter (0.013)
//   on        lit (true)              cord      'zwart' | 'wit' (power lead)
//
// Construction: 13 mm round clear PVC tube with two copper conductors and an LED every 27.8 mm
// (36 per metre). Lit, the tube glows in the LED colour with a brighter spot at every LED (an
// emissive pattern along the rope, uv in metres), a soft halo and a coloured pool of light on the
// floor; unlit, the clear tube shows the conductors and the LED chips. The rope is stiff: it
// lies in ~3.5 loose loops that drift as they are laid down, and where a loop crosses an
// earlier one it climbs over it (heights from a crossing search, ramped at the rope's bend
// stiffness). Power end: moulded clear connector with a 1.5 m lead and a Euro plug; the other
// end has a clear end cap.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function ledPatternTex(base = 0.3) {
  return L.cached(`ropeLed:${base}`, () => {
    const W = 128, H = 4, d = new Uint8Array(W * H * 4);
    for (let x = 0; x < W; x++) {
      const t = (x + 0.5) / W - 0.5;               // one LED period, LED at the centre
      const v = Math.min(1, base + (1 - base) * Math.exp(-(t * t) / (2 * 0.075 * 0.075)) + 0.18 * Math.exp(-(t * t) / (2 * 0.2 * 0.2)));
      for (let y = 0; y < H; y++) { const k = (y * W + x) * 4; d[k] = d[k + 1] = d[k + 2] = Math.round(v * 255); d[k + 3] = 255; }
    }
    const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
    return tex;
  });
}

// lit rope: the tube's own glow (emissive pattern) under a glossy PVC skin
function ropeLitMat(hex, perM) {
  return L.cached(`ropeLit:${hex}:${perM}`, () => {
    const map = ledPatternTex().clone(); map.repeat.set(perM, 1); map.needsUpdate = true;
    const c = new THREE.Color(hex);
    const m = new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(0.35), roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.08, specularIntensity: 0.6,
      emissive: c, emissiveIntensity: 1.6, emissiveMap: map, name: `rope light lit ${hex}`,
    });
    return L.litDiffuser(m, 0.55, 0.6);
  });
}
function ropeOffMats() {
  return L.cached('ropeOff', () => ({
    tube: L.clearGlass({ tint: '#F3F4F1', coverage: 0.38, salt: 5.1 }),
    core: new THREE.MeshPhysicalMaterial({ color: '#EDEDE8', roughness: 0.5, transmission: 0, name: 'rope core' }),
    copper: new THREE.MeshPhysicalMaterial({ color: '#C97B4A', metalness: 1, roughness: 0.35, name: 'copper' }),
    led: new THREE.MeshPhysicalMaterial({ color: '#F4E9C8', roughness: 0.3, name: 'led chip' }),
  }));
}

function lightOf(color) {
  if (!color) return '#FFD596';
  const k = String(color).toLowerCase().replace(/[\s_-]/g, '');
  if (k === 'warmwit' || k === 'warm') return '#FFD596';
  if (k === 'koelwit' || k === 'wit' || k === 'koud') return '#EEF3FF';
  if (L.LIGHT[k]) return L.LIGHT[k];
  if (/^#?[0-9a-f]{6}$/i.test(color)) {
    const c = new THREE.Color(color.startsWith('#') ? color : '#' + color);
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    // a near-white swatch colour means warm white LEDs
    if (lum > 0.6) return c.g > c.b * 1.12 ? '#FFD596' : '#EEF3FF';
    return color.startsWith('#') ? color : '#' + color;
  }
  return '#FFD596';
}

export function ropeLight(p = {}) {
  const len = Number(p.length ?? 5);
  const on = p.on !== false;
  const D = Number(p.diameter ?? 0.013), rr = D / 2;
  const hex = lightOf(p.color);
  const perM = 36;
  const nz = L.noise;

  // --- coil path in the floor plane -------------------------------------------------------
  const R0 = Number(p.coilRadius ?? Math.min(0.24, 0.12 + len * 0.02));
  const drift = V3(0.05, 0, 0.03);       // the loops drift as they are laid down
  const raw = [];
  const theta0 = 120 * DEG;
  let acc = 0;
  for (let i = 0; i <= 4000; i++) {
    const th = theta0 + i * 0.012;
    const k = (th - theta0) / TAU;
    const r = R0 * (1 + 0.1 * nz.noise(th * 0.55, 1.3) + 0.05 * Math.sin(th * 2.1 + 0.7)) * (1 - 0.035 * k);
    raw.push(V3(Math.cos(th) * r * 1.03 + drift.x * k, 0, Math.sin(th) * r * 0.97 + drift.z * k));
    if (raw.length > 1) acc += raw[raw.length - 1].distanceTo(raw[raw.length - 2]);
    if (acc > len + 0.02) break;
  }
  const { pts: flat } = L.resample(raw, Math.round(len * 160));
  // heights: climb over earlier loops (crossings), ramped by the rope's stiffness
  const n = flat.length, ds = len / (n - 1);
  const h = new Float32Array(n).fill(rr);
  const gap = Math.ceil(0.12 / ds);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i - gap; j++) {
      const dx = flat[i].x - flat[j].x, dz = flat[i].z - flat[j].z, d2 = dx * dx + dz * dz;
      if (d2 < 4 * rr * rr * 1.1) {
        const lift = h[j] + Math.sqrt(Math.max(0, 4 * rr * rr * 1.1 - d2));
        if (lift > h[i]) h[i] = lift;
      }
    }
  }
  // cone dilation (slope) then a light smoothing: the rope arches over a crossing
  const slope = 0.28, hh = Float32Array.from(h);
  for (let i = 0; i < n; i++) { const w = Math.ceil(0.08 / ds); for (let j = Math.max(0, i - w); j <= Math.min(n - 1, i + w); j++) hh[i] = Math.max(hh[i], h[j] - slope * Math.abs(i - j) * ds); }
  const hs = Float32Array.from(hh);
  for (let pass = 0; pass < 3; pass++) for (let i = 1; i < n - 1; i++) hs[i] = Math.max(rr, (hs[i - 1] + 2 * hs[i] + hs[i + 1]) / 4);
  const path = flat.map((q, i) => V3(q.x, Math.max(hs[i], h[i] - 0.0006), q.z));

  // --- the rope ----------------------------------------------------------------------------
  const bins = new G.PartBin();
  const ring = L.circleProfile(rr, 20);
  const { geo: ropeGeo } = L.sweepProfile(path, ring, { caps: false });
  if (on) bins.add(ropeLitMat(hex, perM), ropeGeo);
  else {
    const O = ropeOffMats();
    bins.add(O.tube, ropeGeo);
    // inside: a pale PVC core with two copper conductors and an LED chip every 27.8 mm
    bins.add(O.core, L.sweepProfile(path, L.circleProfile(rr * 0.42, 10), { caps: false }).geo);
    const fr = L.sweepProfile(path, [[0, 0]], { caps: false }).frames;
    for (const s of [-1, 1]) bins.add(O.copper, L.sweepProfile(path.map((q, i) => q.clone().addScaledVector(fr.B[i], s * rr * 0.55)), L.circleProfile(0.0007, 6), { caps: false }).geo);
    for (let s = 0.014; s < len - 0.01; s += 1 / perM) {
      const a = L.atLength(path, s);
      const chip = G.roundedBox(0.0035, 0.0012, 0.003, 0.0004); chip.translate(a.p.x, a.p.y + rr * 0.45, a.p.z); bins.add(O.led, chip);
    }
  }
  // clear end cap and power connector (moulded clear PVC sleeve), lead + Euro plug
  const clearPVC = L.clearGlass({ tint: '#F2F3EF', coverage: 0.55, salt: 9.4 });
  const endA = path[path.length - 1], dA = endA.clone().sub(path[path.length - 4]).normalize();
  bins.add(clearPVC, L.sweepProfile([endA.clone().addScaledVector(dA, -0.004), endA.clone().addScaledVector(dA, 0.018)], L.circleProfile(rr + 0.0012, 20)).geo);
  const s0 = path[0], d0 = s0.clone().sub(path[3]).normalize();      // outward at the power end
  const conA = s0.clone().addScaledVector(d0, -0.006), conB = s0.clone().addScaledVector(d0, 0.042);
  const conMat = L.moulded('#E9ECE8', 0.3, { transmission: 0 });
  bins.add(conMat, L.sweepProfile([conA, conB], L.circleProfile(rr + 0.0016, 20)).geo);
  const taper = [conB, conB.clone().addScaledVector(d0, 0.016)];
  bins.add(conMat, L.sweepProfile(taper, L.circleProfile(rr * 0.7, 18)).geo);
  // lead: leaves the coil towards the front left and lies in a loose S on the floor
  const cordMat = /wit|white/i.test(String(p.cord || '')) ? L.cableRubber('#ECEBE6', 0.5) : L.cableRubber('#161616', 0.55);
  const rc = 0.0028;
  const side = V3(-d0.z, 0, d0.x);
  const ctrl = [taper[1], taper[1].clone().addScaledVector(d0, 0.06)];
  const lead = Number(p.leadShown ?? 0.3);
  for (const [f, sx] of [[0.3, 0.035], [0.65, -0.02], [1, 0.03]]) ctrl.push(taper[1].clone().addScaledVector(d0, 0.06 + f * lead).addScaledVector(side, sx));
  const cordPts = new THREE.CatmullRomCurve3(ctrl.map((q, i) => q.clone().setY(i === 0 ? taper[1].y : rc)), false, 'centripetal').getSpacedPoints(80);
  // drop from the connector height to the floor
  const plugY = 0.0106;
  cordPts.forEach((q, i) => { const t = i / (cordPts.length - 1); q.y = G.lerp(taper[1].y, rc, G.smoothstep(0, 0.18, t)) + (plugY - rc) * G.smoothstep(0.86, 1, t); });
  bins.add(cordMat, L.sweepProfile(cordPts, L.circleProfile(rc, 12)).geo);
  {
    const e = cordPts[cordPts.length - 1], dE = e.clone().sub(cordPts[cordPts.length - 3]).setY(0).normalize();
    const parts = []; L.euroPlug((m, g) => parts.push([m, g]), L.moulded('#151515', 0.45), L.e27Mats().nickel);
    // plug lies flat: its local +X along the lead direction, wide side flat on the floor
    const yAx = V3(0, 1, 0), xAx = dE, zAx = V3().crossVectors(xAx, yAx);
    const M4 = new THREE.Matrix4().makeBasis(xAx, yAx, zAx).setPosition(e.x, plugY, e.z);
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins.add(m, g); }
  }

  const group = new THREE.Group(); group.name = `ropeLight ${len} m ${hex}`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { const nm = o.material.name || ''; o.castShadow = !/rope light lit|clear glass/.test(nm); o.receiveShadow = true; } });
  if (on) {
    const col = L.lin(hex, 1);
    const pk = Math.max(...col);
    const glowCol = col.map((v) => (v / pk) * 1.2);
    const ht = L.haloTube(L.resample(path, Math.round(len * 40)).pts, 0.028, glowCol, 0.3, { core: 0.3, coreW: 0.7, radial: 14 });
    group.add(ht);
    const src = L.resample(path, Math.round(len * 24)).pts.map((q) => ({ p: q.clone().setY(q.y + 0.004), I: 1, color: glowCol }));
    const fg = L.floorGlow(src, { box: 0.16, res: 200, k: 0.0007, max: 0.26, minH: 0.012 });
    if (fg) group.add(fg);
  }
  // detail: a stretch of the outer loop nearest the hero camera
  const dP = L.atLength(path, len * 0.08).p;
  return {
    object: group,
    detail: { target: [dP.x, dP.y, dP.z], size: 0.14, azimuth: 30, elevation: 24 },
    view: { hero: { elevation: 38, fill: 0.74 } },
    rig: { default: { exposure: on ? 1.0 : 'auto', contact: { strength: 0.75, h0: 0.006, res: 1024, blur: 1.4 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { length: len, color: hex, on },
  };
}
