// Parts group, round 3: materials and helpers that make the accessories read as what the
// shop sells (art-director review of 18 October 2026). Additive: js/softGoods.js and
// js/partsKit.js keep their behaviour for the other groups that import them.
//
//  - cloth600(): PU-coated 600D polyester as a photographer sees it: matte, a soft fibre sheen
//    at grazing angles, almost no mirror reflection (the round-2 600D read as glossy rubber).
//  - pvcSatin(): PVC tarpaulin (water bags, gutters): satin coated skin without the blotchy
//    coating cockle (the round-2 tarp looked dented).
//  - galvFine(): hot-dip galvanised steel with a fine, low-contrast spangle and no large
//    mottling (the round-2 spangle was blotchy and obviously procedural at catalogue size).
//  - castIron(): black-coated cast iron: sand-cast orange peel under a satin coat.
//  - plateLabelMat(): raised cast lettering whose faces are scuffed to bare grey iron, so a
//    weight marking reads on a black plate.
//  - chestnutPole(): one non-repeating 0.3 x 3.2 m wood texture per pole: honey-brown peeled
//    sweet chestnut with draw-knife facets, fine grain lines, inner-bark remnants and knots.
//  - ropeGeo() / ropeMat(): 3-strand twisted rope (strand relief + fibre twist), so a rope set
//    reads as rope, not as a smooth bungee cord.
import * as THREE from 'three';
import * as G from './geom.js';
import * as SG from './softGoods.js';
import * as K from './partsKit.js';
import { rng, makeNoise2 } from './rng.js';

const TAU = Math.PI * 2;
const V3 = G.V3;
const cache = new Map();
export function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

function unhook(m) { if (m.userData) delete m.userData.__hooked; return m; }

// ---------------------------------------------------------------------------------------
// cloth

// coated 600D: built on SG.fabric600 (basket-weave normal, yarn macro layer), then made matte
export function cloth600(hex = '#1B1B1D', { rough = 0.8, sheen = 0.55, env = 0.16, spec = 0.28 } = {}) {
  return cached(`l3-600:${hex}:${rough}:${sheen}:${env}:${spec}`, () => {
    const m = unhook(SG.fabric600(hex).clone());
    m.roughness = rough; m.specularIntensity = spec; m.sheen = sheen; m.sheenRoughness = 0.55;
    m.userData = { ...m.userData, envSpec: env, macro: { ...m.userData.macro, strength: 0.3, coat: 0.2, rough: 0.18 }, weave: { ...m.userData.weave, matte: 0.1 } };
    m.name = `600D matte ${hex}`;
    return m;
  });
}

// PVC tarpaulin, satin (no coating cockle)
export function pvcSatin(hex = '#1A1B1C', { rough = 0.46, coat = 0.22, env = null, weave = 0.25 } = {}) {
  return cached(`l3-pvc:${hex}:${rough}:${coat}:${env}:${weave}`, () => {
    const m = unhook(SG.pvcTarp(hex, { gloss: rough, weave }).clone());
    m.roughness = rough; m.clearcoat = coat; m.clearcoatRoughness = 0.3; m.specularIntensity = 0.5;
    const c = new THREE.Color(hex); const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    m.userData = { ...m.userData, envSpec: env ?? (L < 0.1 ? 0.4 : 0.3), macro: { ...m.userData.macro, strength: 0.1, coat: 0.15, rough: 0.08 } };
    m.name = `pvc satin ${hex}`;
    return m;
  });
}

// ---------------------------------------------------------------------------------------
// metals

// hot-dip galvanised: dull satin zinc, small low-contrast spangle facets, faint grey bloom
export function galvFine({ tone = '#B4B9BD', cell = 0.0035, pre = false } = {}) {
  return cached(`l3-galv:${tone}:${cell}:${pre}`, () => SG.procSurface(new THREE.MeshPhysicalMaterial({
    color: tone, metalness: 0.88, roughness: pre ? 0.3 : 0.38, side: THREE.DoubleSide, name: pre ? 'galv fine (pre)' : 'galv fine',
  }), pre
    ? { kind: 'galv', scale: 0.0012, bump: 0.008, albedo: 0.025, rough: 0.04, cell, mottle: 0.012, mottleAmt: 0.02 }
    : { kind: 'galv', scale: 0.0012, bump: 0.014, albedo: 0.035, rough: 0.05, cell, mottle: 0.012, mottleAmt: 0.025 }));
}

// black-coated cast iron: orange peel from the sand-cast skin under a satin powder coat
export function castIron(color = '#1E1F21') {
  return cached(`l3-iron:${color}`, () => SG.procSurface(new THREE.MeshPhysicalMaterial({
    color, metalness: 0.3, roughness: 0.5, specularIntensity: 0.65, clearcoat: 0.18, clearcoatRoughness: 0.45, side: THREE.DoubleSide, name: `cast iron ${color}`,
  }), { kind: 'cast', scale: 0.0026, bump: 0.00016, albedo: 0.08, rough: 0.14, mottle: 0.02, mottleAmt: 0.05 }));
}

// Raised cast lettering on a plate: a plane with uv 0..1 over (w x h). Letter faces are bare,
// scuffed grey iron (metallic, lighter), the field is the black coat; the letter relief comes
// from a normal map so the edges catch the key light.
export function plateLabelMat(text, { coat = '#1E1F21', w = 1024, h = 300 } = {}) {
  return cached(`l3-label:${text}:${coat}`, () => {
    const draw = (g, fill, bg) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = fill; g.textAlign = 'center'; g.textBaseline = 'middle';
      // same size and placement as K.embossTextNormal (the relief must sit on the paint)
      g.font = `900 ${Math.round(h * 0.62)}px "Arial Black", Arial, sans-serif`;
      const tw = g.measureText(text).width;
      if (tw > w * 0.9) g.font = g.font.replace(/\d+px/, `${Math.floor(h * 0.62 * w * 0.9 / tw)}px`);
      g.fillText(text, w / 2, h * 0.54);
    };
    const mk = (fill, bg, srgb) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), fill, bg);
      const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
      return t;
    };
    // albedo: coat colour off the letters, worn iron on them (multiplied by colour white)
    const map = mk('#8C9093', coat, true);
    // metalness (B) / roughness (G): letters metallic 0.85 rough 0.34; field 0.15 / 0.58
    const mr = (() => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      draw(g, 'rgb(0,87,217)', 'rgb(0,148,38)');
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
    })();
    // only the letters (+ a 2 px skirt for the relief edge) are drawn; the plate shows round them
    const alpha = (() => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      draw(g, '#ffffff', '#000000');
      g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.025; g.lineJoin = 'round';
      g.strokeText(text, w / 2, h * 0.54);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
    })();
    const m = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', map, metalnessMap: mr, roughnessMap: mr, metalness: 1, roughness: 1, specularIntensity: 0.6, alphaMap: alpha, alphaTest: 0.5,
      normalMap: K.embossTextNormal(text, { w: 1024, h: 300, strength: 6, font: '900 100px "Arial Black", Arial, sans-serif' }), normalScale: new THREE.Vector2(1.4, 1.4),
      transparent: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide, name: `plate label ${text}`,
    });
    return m;
  });
}

// ---------------------------------------------------------------------------------------
// wood: peeled sweet chestnut, one texture per pole (u = around in m, v = along in m)

export function chestnutPole(seed = 1, { len = 3.2, circ = 0.3 } = {}) {
  return cached(`l3-chestnut:${seed}:${len}:${circ}`, () => {
    const W = 384, H = 3072; // ~0.8 mm across x ~1 mm along
    const nz = makeNoise2(seed * 7 + 3);
    const R = rng(seed * 13 + 5);
    const knots = [];
    for (let i = 0; i < 8; i++) knots.push([R() * W, R() * H, 5 + R() * 8]);
    const wrapDx = (a, b) => { let d = Math.abs(a - b); return Math.min(d, W - d); };
    // per-pixel layers
    const fac = new Float32Array(W * H), facE = new Float32Array(W * H), bk = new Float32Array(W * H), kn = new Float32Array(W * H), ring = new Float32Array(W * H);
    // draw-knife facets: long flat strips (stamped)
    for (let i = 0; i < 40; i++) {
      const fu = R() * W, fv = R() * H, fl = (0.06 + R() * 0.2) * H, fw = (0.04 + R() * 0.07) * W;
      for (let y = Math.max(0, Math.floor(fv - fl / 2)); y < Math.min(H, Math.ceil(fv + fl / 2)); y++) {
        const taper = 1 - Math.pow(Math.abs(y - fv) / (fl / 2), 4);
        for (let dx = -Math.ceil(fw); dx <= Math.ceil(fw); dx++) {
          const x = ((Math.round(fu) + dx) % W + W) % W, dd = Math.abs(dx) / fw; if (dd > 1) continue;
          const k = y * W + x;
          fac[k] = Math.max(fac[k], taper * (1 - dd * dd));
          facE[k] = Math.max(facE[k], taper * Math.exp(-(((1 - dd) * 14) ** 2)));
        }
      }
    }
    // inner-bark remnants: thin dark lenses along the grain
    for (let i = 0; i < 120; i++) {
      const bu = R() * W, bv = R() * H, bl = (0.004 + R() * 0.03) * H, bw = 1.5 + R() * 6, bs = 0.5 + R() * 0.5;
      for (let y = Math.max(0, Math.floor(bv - bl / 2)); y < Math.min(H, Math.ceil(bv + bl / 2)); y++) {
        const dv = Math.abs(y - bv) / (bl / 2); const wv = bw * (1 - dv * dv) + 0.01;
        for (let dx = -Math.ceil(wv); dx <= Math.ceil(wv); dx++) {
          const x = ((Math.round(bu) + dx) % W + W) % W, dd = Math.abs(dx) / wv; if (dd > 1) continue;
          const k = y * W + x; bk[k] = Math.max(bk[k], bs * (1 - dd) * (1 - dv * dv));
        }
      }
    }
    // knots: dark core with a ring of inner bark
    for (const [ku, kv, kr] of knots) {
      const ext = Math.ceil(kr * 2.2);
      for (let y = Math.max(0, Math.floor(kv - ext * 1.6)); y < Math.min(H, Math.ceil(kv + ext * 1.6)); y++) for (let dx = -ext; dx <= ext; dx++) {
        const x = ((Math.round(ku) + dx) % W + W) % W, d = Math.hypot(dx, (y - kv) / 1.6);
        const k = y * W + x;
        kn[k] = Math.max(kn[k], K.clamp01(1 - d / kr));
        ring[k] = Math.max(ring[k], Math.exp(-(((d - kr * 1.35) / (kr * 0.25)) ** 2)));
      }
    }
    const alb = new Uint8Array(W * H * 4), hm = new Float32Array(W * H);
    const base = [164, 124, 86]; // peeled sweet chestnut: warm tan-brown (sRGB)
    for (let y = 0; y < H; y++) {
      const v = y / H;
      const low = nz.fbm(v * 9.0, 3.3, 3);
      for (let x = 0; x < W; x++) {
        // grain lines wander and flow round the knots
        let du = 0;
        for (const [ku, kv, kr] of knots) { const dy = (y - kv) / 3.0; if (Math.abs(dy) > kr * 3) continue; const dx = wrapDx(x, ku); const s = kr * kr * 5; du += (x > ku ? 1 : -1) * kr * 1.4 * Math.exp(-(dx * dx + dy * dy) / s); }
        const ug = x + du + 5 * nz.noise(v * 14, x / W * 3);
        const line = Math.pow(0.5 + 0.5 * Math.sin(ug * 0.9 + 2.0 * nz.noise(ug * 0.05, v * 40)), 6);
        const line2 = Math.pow(0.5 + 0.5 * Math.sin(ug * 0.37 + 1.3), 10);
        const streak = nz.fbm(x / W * 60, v * 3.5, 2);
        const k1 = y * W + x;
        const sh = 1 + low * 0.22 + streak * 0.1 - line * 0.16 - line2 * 0.12 + fac[k1] * 0.08 - facE[k1] * 0.1 - kn[k1] * 0.55 - ring[k1] * 0.2;
        let r = base[0] * sh, g = base[1] * sh, b = base[2] * sh;
        const t = Math.min(1, bk[k1] * 1.4 + ring[k1] * 0.3);
        if (t > 0) { r = r * (1 - t) + 92 * t; g = g * (1 - t) + 56 * t; b = b * (1 - t) + 36 * t; }
        const k = k1 * 4;
        alb[k] = Math.max(0, Math.min(255, r)); alb[k + 1] = Math.max(0, Math.min(255, g)); alb[k + 2] = Math.max(0, Math.min(255, b)); alb[k + 3] = 255;
        hm[k1] = -line * 0.18 - line2 * 0.12 + fac[k1] * 0.25 - facE[k1] * 0.2 - bk[k1] * 0.35 + kn[k1] * 0.4 + streak * 0.05;
      }
    }
    const nb = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const xl = (x - 1 + W) % W, xr = (x + 1) % W, yu = Math.max(0, y - 1), yd = Math.min(H - 1, y + 1);
      const dx = (hm[y * W + xr] - hm[y * W + xl]) * 1.4, dy = (hm[yd * W + x] - hm[yu * W + x]) * 1.0;
      const l = Math.hypot(dx, dy, 1), k = (y * W + x) * 4;
      nb[k] = (-dx / l * 0.5 + 0.5) * 255; nb[k + 1] = (-dy / l * 0.5 + 0.5) * 255; nb[k + 2] = (1 / l * 0.5 + 0.5) * 255; nb[k + 3] = 255;
    }
    const mk = (data, srgb) => { const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.repeat.set(1 / circ, 1 / len); t.needsUpdate = true; return t; };
    return new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: mk(alb, true), normalMap: mk(nb, false), normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.66, specularIntensity: 0.35, sheen: 0.2, sheenRoughness: 0.5, sheenColor: new THREE.Color('#d8b088'), name: `chestnut pole ${seed}` });
  });
}

// ---------------------------------------------------------------------------------------
// rope: 3-strand twisted (lay length ~3.2 x diameter), fibre twist as a normal map

export function ropeGeo(pts, r, { lay = null, around = 30, step = null, phase = 0, up = null } = {}) {
  const P = SG.resample(pts, step || r * 0.45);
  const F = K.pathFrames(P, { up });
  const Lay = lay || r * 2 * 3.2;
  const rows = [];
  for (let i = 0; i < P.length; i++) {
    const s = F.S[i];
    const row = [];
    for (let j = 0; j < around; j++) {
      const th = (j / around) * TAU;
      const ph = th - (TAU * s) / Lay + phase;
      const psi = (((ph / (TAU / 3)) % 1) + 1) % 1;
      const rr = r * (0.8 + 0.2 * Math.pow(Math.sin(Math.PI * psi), 0.55));
      row.push(P[i].clone().addScaledVector(F.N[i], Math.cos(th) * rr).addScaledVector(F.B[i], Math.sin(th) * rr));
    }
    rows.push(row);
  }
  // rows along the path, columns around: transpose so the ring is u
  const g = K.gridGeometry(rows, { closedU: true, flip: true });
  // uv: u around (m at the strand surface), v along (m)
  const uv = g.attributes.uv, cols = around + 1;
  for (let i = 0; i < P.length; i++) for (let j = 0; j <= around; j++) uv.setXY(i * cols + j, (j / around) * TAU * r, F.S[i]);
  return g;
}

// fibre twist normal: fine diagonal yarn lines (opposite hand to the strand lay)
function ropeFibreNormal() {
  return cached('l3-ropefibre', () => {
    const S = 256, H = new Float32Array(S * S);
    const nz = makeNoise2(41);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const t = (x + y * 0.9) / S * 16 * TAU;
      H[y * S + x] = 0.5 + 0.5 * Math.sin(t + 0.6 * nz.noise(x / 9, y / 9)) + 0.15 * nz.noise(x / 3, y / 3);
    }
    const out = new Uint8Array(S * S * 4);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (H[y * S + (x + 1) % S] - H[y * S + (x - 1 + S) % S]) * 1.2, dy = (H[((y + 1) % S) * S + x] - H[((y - 1 + S) % S) * S + x]) * 1.2;
      const l = Math.hypot(dx, dy, 1), k = (y * S + x) * 4;
      out[k] = (-dx / l * 0.5 + 0.5) * 255; out[k + 1] = (-dy / l * 0.5 + 0.5) * 255; out[k + 2] = (1 / l * 0.5 + 0.5) * 255; out[k + 3] = 255;
    }
    const t = new THREE.DataTexture(out, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true;
    return t;
  });
}

export function ropeMat(hex = '#2C2E31', { tracer = null } = {}) {
  return cached(`l3-rope:${hex}:${tracer}`, () => {
    const n = ropeFibreNormal().clone(); n.repeat.set(1 / 0.012, 1 / 0.012); n.needsUpdate = true;
    const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.82, specularIntensity: 0.3, sheen: 0.7, sheenRoughness: 0.45, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.35), normalMap: n, normalScale: new THREE.Vector2(0.9, 0.9), side: THREE.DoubleSide, name: `rope ${hex}` });
    m.userData.envSpec = 0.2;
    return m;
  });
}

// ---------------------------------------------------------------------------------------
// misc

// small text print as a decal patch lying on a surface: rows of points from fn(u, v) (u, v in
// 0..1 over the patch); returns a mesh with an alpha-tested print material
export function decalOn(fn, tex, { nu = 24, nv = 8, rough = 0.5, name = 'print' } = {}) {
  const rows = [];
  for (let j = 0; j <= nv; j++) { const row = []; for (let i = 0; i <= nu; i++) row.push(fn(i / nu, j / nv)); rows.push(row); }
  const g = K.gridGeometry(rows, { closedU: false });
  const uv = g.attributes.uv;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uv.setXY(j * (nu + 1) + i, i / nu, 1 - j / nv);
  const m = new THREE.Mesh(g, cached(`l3-decal:${tex.uuid}:${rough}`, () => new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.4, roughness: rough, specularIntensity: 0.4, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, name })));
  m.castShadow = false; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------------------
// rain gutter packshot: rolled PVC strip whose free end lies opened into a round U trough
// (the way it hangs between two roofs), hook tape on both flanges, welded hems; no packing
// folds on the trough (PVC 650 g/m² is stiff and smooth). Based on SG.rollStrip.
export function gutterPackshot({ L = 3, W = 0.42, cloth, hook, thr, T = 0.8, tapeW = 0.03, seed = 9, rot = 50, flange = 0.05 }) {
  const bins = new G.PartBin();
  const tr = W / 2 - flange;                     // half arc length of the trough
  const r = (2 * tr) / Math.PI;                  // semicircle radius
  const fl = -8 * Math.PI / 180;                 // flanges droop outwards a little
  const sectionAt = (w) => {
    const a = Math.abs(w), s = Math.sign(w) || 1;
    if (a <= tr) { const th = a / r; return [s * r * Math.sin(th), r * (1 - Math.cos(th))]; }
    const d = a - tr;
    return [s * (r + d * Math.cos(fl)), r + d * Math.sin(fl)];
  };
  const section = (w, a, tt) => {
    const k = K.sstep(0.0, 0.5, tt);
    const [x, y] = sectionAt(w);
    return [w + (x - w) * k, y * k];
  };
  const R = SG.rollStrip({ W, Ltot: L, T, section, seed, foldAmp: 0.0004, eb: tapeW + 0.004, te: 0.0024, tc: 0.0009, wave: 0.0004 });
  bins.add(cloth, R.geo);
  const aMax = R.aRoll + R.turn * 1.15;
  const along = (w, lift, a0 = 0.004, a1 = aMax, step = 0.005) => {
    const pts = [], nrm = [];
    for (let a = a0; a <= a1; a += step) { const q = R.at(w, a, lift); pts.push(q.p); nrm.push(q.n); }
    return { pts, nrm };
  };
  for (const s of [-1, 1]) {
    const e = s * W / 2;
    const wm = e - s * (0.004 + tapeW / 2);
    const band = along(wm, 0.0012);
    bins.add(hook, K.strapAlong(band.pts, tapeW, 0.0022, { normals: band.nrm }));
    for (const dw of [tapeW / 2 - 0.0028, -(tapeW / 2 - 0.0028)]) {
      const st = along(wm + dw, 0.0026, 0.012, aMax - 0.01, 0.003);
      bins.add(thr, SG.stitches(st.pts, st.nrm, { len: 0.0034, gap: 0.0016, w: 0.0009, h: 0.0004 }));
    }
    const hem = along(e - s * 0.0012, 0.0002, 0.002, R.aEnd - 0.01, 0.006);
    bins.add(cloth, K.tubeAlong(hem.pts, 0.0012, 6));
  }
  {
    const pts = [], nrm = [];
    for (let k = 0; k <= 120; k++) { const w = -W / 2 + 0.003 + (W - 0.006) * (k / 120); const q = R.at(w, 0.012, 0.0006); pts.push(q.p); nrm.push(q.n); }
    bins.add(cloth, K.strapAlong(pts, 0.022, 0.0012, { normals: nrm }));
    const ed = []; for (let k = 0; k <= 120; k++) { const w = -W / 2 + 0.002 + (W - 0.004) * (k / 120); ed.push(R.at(w, 0.0015, 0.0002).p); }
    bins.add(cloth, K.tubeAlong(ed, 0.0012, 6));
  }
  const g = K.finish(bins, `gutter ${L}`);
  g.rotation.y = rot * Math.PI / 180;
  const root = new THREE.Group(); root.add(g);
  return { object: root, R };
}
