// Procedural textures generated in JS (no image files): fabric weaves, knit,
// brushed metal, plywood, plastic orange-peel, print/valance artwork.
// Everything is cached by key so batch renders reuse GPU textures.
import * as THREE from 'three';
import { makeNoise2, rng } from './rng.js';

const cache = new Map();
let maxAniso = 8;
export function setMaxAnisotropy(n) { maxAniso = n; }

function dataTex(data, size, { srgb = false, repeat = [1, 1], key } = {}) {
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = maxAniso;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  t.name = key || '';
  return t;
}

// Height field (Float32, size x size, tileable) -> tangent-space normal map.
function heightToNormal(h, size, strength) {
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size, xr = (x + 1) % size, yu = (y - 1 + size) % size, yd = (y + 1) % size;
      const dx = (h[y * size + xr] - h[y * size + xl]) * strength;
      const dy = (h[yd * size + x] - h[yu * size + x]) * strength;
      let nx = -dx, ny = -dy, nz = 1;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const k = (y * size + x) * 4;
      out[k] = Math.round((nx * 0.5 + 0.5) * 255);
      out[k + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[k + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[k + 3] = 255;
    }
  }
  return out;
}

function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

// Plain weave (polyester oxford for tent fabric). `threads` warp/weft threads per tile.
export function weaveNormal({ threads = 24, size = 512, strength = 2.2, irregular = 0.35, seed = 3 } = {}) {
  return cached(`weave:${threads}:${size}:${strength}:${irregular}`, () => {
    const { noise, fbm } = makeNoise2(seed);
    const h = new Float32Array(size * size);
    const cell = size / threads;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x / cell, gy = y / cell;
        const ix = Math.floor(gx), iy = Math.floor(gy);
        const fx = gx - ix, fy = gy - iy;
        // thread cross-section profiles (slightly flattened yarns)
        const warp = Math.pow(Math.max(0, Math.sin(Math.PI * fx)), 0.6);
        const weft = Math.pow(Math.max(0, Math.sin(Math.PI * fy)), 0.6);
        const over = (ix + iy) % 2 === 0;
        // undulation: a thread rises where it crosses over, dips where under
        const wu = Math.sin(Math.PI * fy) * (over ? 1 : -1);
        const vu = Math.sin(Math.PI * fx) * (over ? -1 : 1);
        const hw = warp * (0.55 + 0.45 * wu);
        const hv = weft * (0.55 + 0.45 * vu);
        let v = Math.max(hw, hv);
        // yarn irregularity (slub) along each thread
        v += irregular * 0.25 * noise(ix * 3.1, y / cell * 0.7) + irregular * 0.25 * noise(x / cell * 0.7, iy * 2.7 + 50);
        v += 0.15 * fbm(x / size * 8, y / size * 8, 3);
        h[y * size + x] = v;
      }
    }
    return dataTex(heightToNormal(h, size, strength / cell * 4), size, { key: 'weave' });
  });
}

// Fine weft-knit (jersey) for lycra/spandex: tiny V loops, very subtle.
export function knitNormal({ loops = 40, size = 512, strength = 1.2, seed = 5 } = {}) {
  return cached(`knit:${loops}:${size}:${strength}`, () => {
    const { fbm } = makeNoise2(seed);
    const h = new Float32Array(size * size);
    const cw = size / loops, ch = cw * 0.8;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x / cw, gy = y / ch;
        const fx = gx - Math.floor(gx), fy = gy - Math.floor(gy);
        // two slanted legs of a knit loop (V shape)
        const l1 = Math.abs((fx - 0.25) - (fy - 0.5) * 0.35);
        const l2 = Math.abs((fx - 0.75) + (fy - 0.5) * 0.35);
        const v = Math.max(0, 1 - Math.min(l1, l2) * 5.5);
        h[y * size + x] = Math.sqrt(v) + 0.1 * fbm(x / size * 16, y / size * 16, 2);
      }
    }
    return dataTex(heightToNormal(h, size, strength / cw * 4), size, { key: 'knit' });
  });
}

// Satin-ish polyester (strik covers / kleden): fine twill diagonal + slight noise.
export function twillNormal({ lines = 90, size = 512, strength = 0.8, seed = 9 } = {}) {
  return cached(`twill:${lines}:${size}:${strength}`, () => {
    const { fbm } = makeNoise2(seed);
    const h = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const t = ((x + y * 0.5) / size) * lines;
      h[y * size + x] = Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 2), 2) + 0.2 * fbm(x / size * 12, y / size * 12, 3);
    }
    return dataTex(heightToNormal(h, size, strength / (size / lines) * 4), size, { key: 'twill' });
  });
}

// Brushed metal: normal map with fine streaks along U (tube length runs along V in prism uvs).
export function brushedNormal({ size = 512, strength = 0.6, seed = 11, alongV = true } = {}) {
  return cached(`brushed:${size}:${strength}:${alongV}`, () => {
    const R = rng(seed);
    const { noise } = makeNoise2(seed);
    const h = new Float32Array(size * size);
    const lineVals = new Float32Array(size);
    for (let i = 0; i < size; i++) lineVals[i] = R();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const across = alongV ? x : y, along = alongV ? y : x;
      const v = lineVals[across] * 0.6 + 0.4 * noise(across * 0.9, along / size * 6);
      h[y * size + x] = v;
    }
    return dataTex(heightToNormal(h, size, strength), size, { key: 'brushed' });
  });
}

// Orange-peel / fine stipple for HDPE plastic tops and powder coat.
export function stippleNormal({ size = 256, strength = 1.0, scale = 18, seed = 13 } = {}) {
  return cached(`stipple:${size}:${strength}:${scale}`, () => {
    const { fbm } = makeNoise2(seed);
    const h = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      // tileable via torus mapping of the noise domain
      const a = (x / size) * Math.PI * 2, b = (y / size) * Math.PI * 2;
      h[y * size + x] = fbm(Math.cos(a) * scale / 6 + 10, Math.sin(a) * scale / 6 + Math.cos(b) * scale / 6 + 20 + Math.sin(b) * scale / 6, 4);
    }
    return dataTex(heightToNormal(h, size, strength * 6), size, { key: 'stipple' });
  });
}

// Low-frequency fabric unevenness (large soft undulations), tileable.
export function softWrinkleNormal({ size = 512, strength = 0.8, seed = 17 } = {}) {
  return cached(`softwrinkle:${size}:${strength}:${seed}`, () => {
    const { fbm } = makeNoise2(seed);
    const h = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const a = (x / size) * Math.PI * 2, b = (y / size) * Math.PI * 2;
      h[y * size + x] = fbm(Math.cos(a) * 1.2 + 3, Math.sin(a) * 1.2 + Math.cos(b) * 1.2 + 7 + Math.sin(b) * 1.2, 4);
    }
    return dataTex(heightToNormal(h, size, strength * 30), size, { key: 'softwrinkle' });
  });
}

// Birch plywood face (albedo, sRGB): pale, fine grain + soft figure.
export function birchAlbedo({ size = 1024, seed = 21, tone = [229, 211, 180] } = {}) {
  return cached(`birch:${size}:${seed}:${tone}`, () => {
    const { noise, fbm } = makeNoise2(seed);
    const out = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const warp = fbm(u * 3, v * 0.6, 4) * 0.08;
      const grain = Math.sin((u + warp) * 220 + fbm(u * 12, v * 2, 3) * 6);
      const fine = noise(u * 900, v * 20) * 0.5;
      const figure = fbm(u * 6, v * 1.5, 4);
      let k = 1 + grain * 0.035 + fine * 0.03 + figure * 0.08;
      const i = (y * size + x) * 4;
      out[i] = Math.min(255, tone[0] * k); out[i + 1] = Math.min(255, tone[1] * k); out[i + 2] = Math.min(255, tone[2] * k * 0.98); out[i + 3] = 255;
    }
    return dataTex(out, size, { srgb: true, key: 'birch' });
  });
}

// Plywood edge: alternating veneer plies across V (v = 0..1 over thickness).
export function plyEdgeAlbedo({ plies = 13, size = 512, seed = 23, tone = [222, 200, 164] } = {}) {
  return cached(`plyedge:${plies}:${size}`, () => {
    const { noise } = makeNoise2(seed);
    const out = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = y / size;
      const ply = Math.floor(v * plies);
      const f = v * plies - ply;
      const glue = Math.max(0, 1 - Math.min(f, 1 - f) * 18); // dark glue line
      const cross = ply % 2 === 1;
      let k = (cross ? 0.9 : 1.0) + noise(x / size * (cross ? 400 : 30), ply * 5.3) * 0.06 - glue * 0.25;
      const i = (y * size + x) * 4;
      out[i] = tone[0] * k; out[i + 1] = tone[1] * k; out[i + 2] = tone[2] * k; out[i + 3] = 255;
    }
    return dataTex(out, size, { srgb: true, key: 'plyedge' });
  });
}

// Canvas texture with print artwork (valance logo, wall print).
export function printTexture({ text = '', color = '#ffffff', bg = null, font = '700 120px "Helvetica Neue", Arial, sans-serif', width = 2048, height = 160, repeatX = 1, letterSpacing = 6 } = {}) {
  const key = `print:${text}:${color}:${bg}:${font}:${width}:${height}`;
  return cached(key, () => {
    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    const g = c.getContext('2d');
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, width, height); } else { g.clearRect(0, 0, width, height); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
    if ('letterSpacing' in g) g.letterSpacing = `${letterSpacing}px`;
    // shrink to fit (keep 6% side margins)
    const w = g.measureText(text).width;
    if (w > width * 0.88) { const m = /(\d+)px/.exec(font); if (m) { g.font = font.replace(/\d+px/, `${Math.floor(Number(m[1]) * width * 0.88 / w)}px`); } }
    g.fillText(text, width / 2, height / 2 + height * 0.04);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    t.wrapS = THREE.RepeatWrapping; t.repeat.set(repeatX, 1);
    return t;
  });
}

// Mask texture drawn with a callback on a 2D canvas (white = keep). Linear data.
export function maskTexture(key, w, h, draw) {
  return cached(`mask:${key}`, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace; t.anisotropy = maxAniso;
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  });
}
