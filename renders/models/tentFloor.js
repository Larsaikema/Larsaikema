// Tentvloer (floors for a tent on grass): loose-lay carpet tiles, and the roll-out plastic floor.
//
// { tiles, color, rolled }
//   tiles: true   tapijttegel 50 x 50 cm: a needle-felt top layer (mélange of fibres in the colour) on a
//                 black bitumen backing, 6,5 mm thick. A stack of ten, each a few mm and a fraction of a
//                 degree off the one below (the backing shows as a dark line between the felt layers), and
//                 one tile lying flat beside the stack. color: zwart | grijs | rood | blauw | groen
//   rolled: 'half' kunststof tentvloer: a 1 m wide polypropylene floor with an open grid (36 mm holes between
//                 12 mm ribs, solid 30 mm borders), 12 mm thick, half unrolled: about 1,6 m lies flat towards the
//                 camera, the rest is still wound in a roll at the back. It lies on a patch of mown lawn (the
//                 grass shows through the holes). color: grijs | zwart
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';
import * as F from '../js/furniture.js';
import { rng, makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const FELT = { zwart: '#1E1E21', grijs: '#6E7074', rood: '#9C1C24', blauw: '#1F3F86', groen: '#355F31', antraciet: '#36383C' };

// ------------------------------------------------------------------ needle felt
export function feltMat(hex) {
  return K.cached(`tf-felt:${hex}`, () => {
    const N = 512, base = new THREE.Color(hex);
    const c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d');
    const img = g.createImageData(N, N);
    const R = rng(41); const { noise } = makeNoise2(41);
    const lumB = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      // fibre mélange: fine random flecks lighter / darker than the base, a faint cloudy mottle
      const r = R();
      let k = 1 + 0.06 * noise(x * 0.02, y * 0.02) + (r < 0.04 ? 0.3 : r < 0.12 ? -0.3 : (r - 0.5) * 0.12);
      if (lumB < 0.05) k = 1 + (k - 1) * 1.4; // black felt: a few grey flecks
      const o = (y * N + x) * 4;
      const col = base.clone().multiplyScalar(Math.max(0.2, k));
      if (lumB < 0.05 && r < 0.03) col.lerp(new THREE.Color('#3a3c40'), 0.5);
      img.data[o] = Math.min(255, col.r * 255 * 1.0); img.data[o + 1] = Math.min(255, col.g * 255); img.data[o + 2] = Math.min(255, col.b * 255); img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.LinearSRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1 / 0.12, 1 / 0.12); map.anisotropy = 8;
    const m = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', map, roughness: 0.95, specularIntensity: 0.2, sheen: 0.35, sheenRoughness: 0.8,
      sheenColor: base.clone().lerp(new THREE.Color('#ffffff'), 0.12), name: `needle felt ${hex}`,
    });
    // the base colour lives in the map (linear values written as-is): keep the albedo product-true
    map.colorSpace = THREE.NoColorSpace;
    SG.procSurface(m, { kind: 'stipple', scale: 0.0007, bump: 0.00004, albedo: 0.0, rough: 0.05 });
    m.userData.albedoL = lumB;
    return m;
  });
}
function bitumenMat() {
  return K.cached('tf-bitumen', () => SG.procSurface(new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: 0.55, specularIntensity: 0.45, name: 'bitumen backing' }),
    { kind: 'stipple', scale: 0.0008, bump: 0.00002, albedo: 0.05, rough: 0.08 }));
}
function tile(B, felt, back, { S = 0.5, tf = 0.0035, tb = 0.003, at = V3(), yaw = 0 } = {}) {
  const m = new THREE.Matrix4().makeTranslation(at.x, at.y, at.z).multiply(new THREE.Matrix4().makeRotationY(yaw));
  const b = G.roundedBox(S, tb, S, 0.0012); b.translate(0, tb / 2, 0); b.applyMatrix4(m); B.add(back, b);
  const f = G.roundedBox(S - 0.0006, tf, S - 0.0006, 0.0016); f.translate(0, tb + tf / 2 - 0.0002, 0);
  F.uvBox(f, { offset: [at.x * 3.1 + 0.2, 0, at.z * 2.7] });
  f.applyMatrix4(m); B.add(felt, f);
}

// ------------------------------------------------------------------ lawn patch
function lawn(group, { x0, x1, z0, z1, flat = null, seed = 3, density = 9000 } = {}) {
  const R = rng(seed); const { noise } = makeNoise2(seed);
  const h0 = 0.012; // turf (soil + thatch) thickness
  // irregular rounded outline
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
  const outline = [];
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * TAU;
    const c = Math.cos(a), s = Math.sin(a);
    // superellipse (n = 6) with a little wobble
    const n = 6, rr = 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n);
    const w = 1 + 0.025 * noise(Math.cos(a) * 2 + 7, Math.sin(a) * 2) - 0.01;
    outline.push(new THREE.Vector2(cx + c * hx * rr * w, cz + s * hz * rr * w));
  }
  const inside = (x, z) => {
    let ins = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const a = outline[i], b = outline[j];
      if ((a.y > z) !== (b.y > z) && x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x) ins = !ins;
    }
    return ins;
  };
  // turf slab: thatch top, soil sides
  const sh = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, -p.y)));
  const slab = K.extrudeY(sh, h0, { y0: 0, bevel: 0.003, bevelSegs: 2, curveSegs: 4 });
  const N = 512;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g2 = cv.getContext('2d'); const img = g2.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = noise(x * 0.05, y * 0.05) * 0.5 + noise(x * 0.31, y * 0.29) * 0.5;
    const rr = R();
    const col = new THREE.Color('#3F5A22').lerp(new THREE.Color('#5E5530'), 0.35 + 0.3 * v).multiplyScalar(0.75 + 0.35 * rr);
    const o = (y * N + x) * 4; img.data[o] = col.r * 255; img.data[o + 1] = col.g * 255; img.data[o + 2] = col.b * 255; img.data[o + 3] = 255;
  }
  g2.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.repeat.set(1 / 0.3, 1 / 0.3);
  F.uvBox(slab);
  const thatch = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.92, specularIntensity: 0.2, name: 'lawn thatch' });
  group.add(G.mesh(slab, thatch));
  // blades
  const pos = [], col = [], nor = [];
  const areaN = Math.round(density * (x1 - x0) * (z1 - z0));
  const base = new THREE.Color('#2E4B1A'), tipA = new THREE.Color('#78A040'), tipB = new THREE.Color('#9AA24A');
  for (let i = 0; i < areaN; i++) {
    const x = x0 + (x1 - x0) * ((i * 0.7548776662466927 + 0.31) % 1), z = z0 + (z1 - z0) * ((i * 0.5698402909980532 + 0.77) % 1);
    if (!inside(x, z)) continue;
    let h = 0.022 + 0.026 * R() + 0.01 * noise(x * 7, z * 7);
    const fl = flat ? flat(x, z) : null;
    if (fl != null) h = Math.min(h, fl);
    if (h < 0.002) continue;
    const a = R() * TAU, lean = (0.25 + 0.5 * R()) * h, la = a + (R() - 0.5) * 1.2;
    const w = 0.0024 + 0.0012 * R();
    const sx = Math.cos(a) * w / 2, sz = Math.sin(a) * w / 2;
    const lx = Math.cos(la + Math.PI / 2) * lean, lz = Math.sin(la + Math.PI / 2) * lean;
    const y0 = h0 - 0.002;
    const P = [
      [x - sx, y0, z - sz], [x + sx, y0, z + sz],
      [x - sx * 0.7 + lx * 0.3, y0 + h * 0.55, z - sz * 0.7 + lz * 0.3], [x + sx * 0.7 + lx * 0.3, y0 + h * 0.55, z + sz * 0.7 + lz * 0.3],
      [x + lx, y0 + h * (1 - 0.25 * lean / h), z + lz],
    ];
    const tipC = tipA.clone().lerp(tipB, R() * 0.6).multiplyScalar(0.7 + 0.45 * R());
    const C = [base, base, base.clone().lerp(tipC, 0.6), base.clone().lerp(tipC, 0.6), tipC];
    const tri = [[0, 1, 2], [1, 3, 2], [2, 3, 4]];
    // normal: mostly up, tilted towards the blade face
    const fn = V3(-sz, 0, sx).normalize().multiplyScalar(0.55).add(V3(0, 1, 0)).normalize();
    for (const t of tri) for (const k of t) { pos.push(...P[k]); col.push(C[k].r, C[k].g, C[k].b); nor.push(fn.x, fn.y, fn.z); }
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  bg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const blades = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, specularIntensity: 0.35, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color('#9fb870'), side: THREE.DoubleSide, name: 'grass blades' });
  blades.userData.albedoL = 0.12;
  group.add(G.mesh(bg, blades));
  return h0;
}

// ------------------------------------------------------------------ roll-out grid floor
function gridFloor(B, mat, { W = 1.0, T = 0.012, Lf = 1.6, turns = 4, r0 = 0.085, pitch = 0.048, rib = 0.012, border = 0.03, y0 = 0 } = {}) {
  const gap = 0.0015, k = (T + gap) / TAU;
  const Rout = r0 + turns * (T + gap) + T;     // outer radius of the roll
  const Rc = y0 + Rout;                         // roll centre height (roll stands on the floor)
  // strip centre line by arc length: s = 0 at the cut end (front), the flat part runs back to the roll
  // (z = 0), then the spiral winds inwards (phi from the bottom, back, over the top)
  const phiMax = turns * TAU;
  const rAt = (phi) => Rout - T / 2 - k * phi;
  // tabulate the spiral by arc length
  const sp = [{ phi: 0, s: 0 }];
  const dphi = 4 * DEG;
  for (let phi = dphi; phi <= phiMax + 1e-6; phi += dphi) sp.push({ phi, s: sp[sp.length - 1].s + rAt(phi - dphi / 2) * dphi });
  const Ls = sp[sp.length - 1].s, Stot = Lf + Ls;
  const at = (s) => {
    if (s <= Lf) return { p: V3(0, y0 + T / 2, Lf - s), t: V3(0, 0, -1), n: V3(0, 1, 0) };
    const u = s - Lf;
    let i = 1; while (i < sp.length - 1 && sp[i].s < u) i++;
    const a = sp[i - 1], b = sp[i], f = (u - a.s) / Math.max(1e-9, b.s - a.s);
    const phi = a.phi + (b.phi - a.phi) * f, r = rAt(phi);
    const c = Math.cos(phi), sn = Math.sin(phi);
    return { p: V3(0, Rc - r * c, -r * sn), t: V3(0, -sn, -c).normalize().multiplyScalar(1), n: V3(0, c, sn) };
  };
  // fix tangent sign: d/dphi of (Rc - r c, -r s) = (r s, -r c) -> (y: sn, z: -c)
  const at2 = (s) => { const q = at(s); if (s > Lf) { const c = q.n.y, sn = q.n.z; q.t = V3(0, sn, -c); } return q; };
  // sample the centre line: the flat part needs two points, the spiral every 4 degrees
  const samples = [0, Lf * 0.5]; for (const e of sp) samples.push(Lf + e.s);
  const frames = samples.map(at2);
  // longitudinal ribs and the two solid borders
  const xs = [];
  const inner = W / 2 - border;
  const nRib = Math.round((2 * inner) / pitch);
  for (let j = 1; j < nRib; j++) xs.push([-inner + (2 * inner * j) / nRib, rib]);
  xs.push([-W / 2 + border / 2, border], [W / 2 - border / 2, border]);
  for (const [x, w] of xs) {
    const pts = frames.map((f) => f.p.clone().add(V3(x, 0, 0)));
    const g = K.sweep(pts, K.rrect(w, T, Math.min(w, T) * 0.3, 2), { normals: frames.map((f) => f.n) });
    B.add(mat, g);
  }
  // transverse ribs every `pitch` along the strip (the first one closes the cut end)
  const nT = Math.floor(Stot / ((2 * inner) / nRib));
  const step = (2 * inner) / nRib;
  for (let i = 0; i <= nT; i++) {
    const s = Math.min(Stot - 0.004, 0.004 + i * step);
    const f = at2(s);
    const g = G.prism(G.roundedRectProfile(rib, T, 0.0022, 2), f.p.clone().add(V3(-W / 2 + 0.002, 0, 0)), f.p.clone().add(V3(W / 2 - 0.002, 0, 0)), { side: f.t });
    B.add(mat, g);
  }
  return { Rout, Rc };
}

export function tentFloor(p = {}) {
  const color = String(p.color || 'grijs').toLowerCase();
  const group = new THREE.Group();
  const B = new G.PartBin();
  if (p.tiles) {
    const felt = feltMat(FELT[color] || FELT.grijs), back = bitumenMat();
    const R = rng(12);
    const n = Math.max(1, Math.round(Number(p.count ?? 10)));
    const th = 0.0065;
    for (let i = 0; i < n; i++) {
      const at = V3((R() - 0.5) * 0.008, i * th, (R() - 0.5) * 0.008);
      tile(B, felt, back, { at, yaw: (R() - 0.5) * 1.6 * DEG });
    }
    // one tile beside the stack, on the floor in front to the right
    tile(B, felt, back, { at: V3(0.43, 0, 0.36), yaw: -14 * DEG });
    B.build(group);
    group.name = `tentFloor tiles ${color}`;
    const dark = color === 'zwart' || color === 'antraciet';
    return {
      object: group,
      detail: { target: [0.2, n * th, 0.2], size: 0.18, azimuth: 30, elevation: 24 },
      view: { hero: { elevation: 24 } },
      rig: L5.goodsRig({ tone: dark ? 'black' : 'mid', size: 0.6 }),
      meta: { tiles: true, color, count: n },
    };
  }
  // roll-out grid floor on a lawn patch
  const hex = color === 'zwart' ? '#232427' : '#7B7E81';
  const pp = SG.moulded(hex, { rough: 0.5, spec: 0.5 });
  const W = 1.0, Lf = 1.55;
  const turf = 0.012;
  const { Rout } = gridFloor(B, pp, { W, Lf, y0: turf + 0.0015 });
  B.build(group);
  // lawn: blades under the floor are flattened below the floor, under the roll kept short
  lawn(group, {
    x0: -W / 2 - 0.2, x1: W / 2 + 0.2, z0: -2 * Rout - 0.2, z1: Lf + 0.22, seed: 5, density: 9000,
    flat: (x, z) => {
      if (Math.abs(x) > W / 2 + 0.004) return null;
      if (z > -0.004 && z < Lf + 0.004) return 0.009;               // under the flat part: pressed flat
      if (z <= 0 && z > -Rout) return Math.max(0.003, Rout - Math.sqrt(Rout * Rout - z * z) - 0.001); // under the roll
      return null;
    },
  });
  group.name = `tentFloor roll ${color}`;
  return {
    object: group,
    detail: { target: [0.3, 0.02, Lf - 0.2], size: 0.35, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 26 } },
    rig: L5.goodsRig({ tone: color === 'zwart' ? 'black' : 'mid', size: 1.2 }),
    meta: { color, rolled: p.rolled || 'half' },
  };
}
