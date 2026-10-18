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

// Isotropic plain weave of PVC-coated polyester tent cloth. Warp and weft are identical
// round yarns (1 thread = 1 mm, so the over/under repeat is 2 mm; one 512 px tile = 32
// threads = 3.2 cm, use repeat 1/0.032 per metre), each yarn rises where it crosses over
// and dips where it passes under. The coating fills the valleys (the height field is
// blurred and flattened), so the relief is low. Irregularity is per crossing in 2D (no
// long 1D yarn streaks), so the mip-averaged map stays isotropic and never turns into
// brushed-metal streaks at grazing angles. Heights in mm, texel = 1/16 mm.
export function plainWeaveNormal({ threads = 32, size = 512, relief = 0.07, seed = 7 } = {}) {
  return cached(`plainweave:${threads}:${size}:${relief}:${seed}`, () => {
    const R = rng(seed);
    const cell = size / threads; // texels per thread
    // per-crossing amplitude jitter (2D), per-thread width jitter (tiny)
    const jit = new Float32Array(threads * threads); for (let i = 0; i < jit.length; i++) jit[i] = 0.85 + 0.3 * R();
    const wj = new Float32Array(threads * 2); for (let i = 0; i < wj.length; i++) wj[i] = 0.92 + 0.12 * R();
    let h = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const gx = x / cell, gy = y / cell;
      const i = Math.floor(gx), j = Math.floor(gy);
      const fx = gx - i, fy = gy - j;
      const a = jit[(j % threads) * threads + (i % threads)];
      // yarn cross-sections (slightly flattened ellipses)
      const pw = Math.sqrt(Math.max(0, 1 - ((2 * fx - 1) / wj[i % threads]) ** 2));
      const pf = Math.sqrt(Math.max(0, 1 - ((2 * fy - 1) / wj[threads + (j % threads)]) ** 2));
      // undulation: warp i is on top at crossing (i, j) when i + j is even
      const zw = Math.cos(Math.PI * (gy - 0.5) + Math.PI * i);
      const zf = -Math.cos(Math.PI * (gx - 0.5) + Math.PI * j);
      const hw = 0.55 * pw + 0.45 * zw * a;
      const hf = 0.55 * pf + 0.45 * zf * a;
      h[y * size + x] = Math.max(hw, hf, -0.2);
    }
    // coating: blur (fills the gaps between yarns) twice with a radius of ~1/4 thread
    const r = Math.max(1, Math.round(cell / 4));
    for (let pass = 0; pass < 2; pass++) {
      const t = new Float32Array(size * size);
      for (let y = 0; y < size; y++) { let acc = 0; for (let k = -r; k <= r; k++) acc += h[y * size + ((k + size) % size)]; for (let x = 0; x < size; x++) { t[y * size + x] = acc / (2 * r + 1); acc += h[y * size + ((x + r + 1) % size)] - h[y * size + ((x - r + size) % size)]; } }
      for (let x = 0; x < size; x++) { let acc = 0; for (let k = -r; k <= r; k++) acc += t[((k + size) % size) * size + x]; for (let y = 0; y < size; y++) { h[y * size + x] = acc / (2 * r + 1); acc += t[((y + r + 1) % size) * size + x] - t[((y - r + size) % size) * size + x]; } }
    }
    // heights -> mm (relief), slope per texel: texel = 1 / cell mm
    for (let k = 0; k < h.length; k++) h[k] *= relief;
    return dataTex(heightToNormal(h, size, cell / 2), size, { key: 'plainweave' });
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

// Macro structure of coated polyester tent cloth, readable at catalogue size where the
// 1 mm weave itself is sub-pixel: yarn-tension streaks along warp and weft (1-6 mm wide,
// a few cm long), slubs, and a faint low-frequency cockle of the coating. 1 tile = 1 m
// (fabric uv is in metres), 1 texel = 1 mm. All components are lattice-free (blurred
// white noise in 1D, sums of integer-frequency waves in 2D), so the tile is seamless and
// the slope field has no grid lines. R,G = tangent-space slope (0.5 = flat),
// B = roughness modulation (0.5 = neutral). Used as a blended second normal layer.
export function fabricMacroNormal({ size = 1024, seed = 31 } = {}) {
  return cached(`fabricMacro:${size}:${seed}`, () => {
    const R = rng(seed);
    const N = size;
    // circular box blur (3 passes ~ gaussian) of a 1D signal
    const blur1 = (a, r) => {
      if (r < 1) return a;
      let src = a;
      for (let pass = 0; pass < 3; pass++) {
        const out = new Float32Array(N); let acc = 0;
        for (let i = -r; i <= r; i++) acc += src[(i + N) % N];
        for (let i = 0; i < N; i++) { out[i] = acc / (2 * r + 1); acc += src[(i + r + 1) % N] - src[(i - r + N) % N]; }
        src = out;
      }
      return src;
    };
    const norm = (a) => { let m = 0; for (const v of a) m += v * v; m = Math.sqrt(m / a.length) || 1; for (let i = 0; i < a.length; i++) a[i] /= m; return a; };
    const line = (r) => { const a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = R() * 2 - 1; return norm(blur1(a, r)); };
    // 2D tileable random field from integer-frequency waves (|k| in [k0,k1] cycles per tile)
    const field = (k0, k1, count, beta = 1) => {
      const f = new Float32Array(N * N);
      const cx = new Float32Array(N), sx = new Float32Array(N), cy = new Float32Array(N), sy = new Float32Array(N);
      for (let w = 0; w < count; w++) {
        const kk = k0 + (k1 - k0) * R(), th = R() * Math.PI * 2;
        const kx = Math.round(kk * Math.cos(th)), ky = Math.round(kk * Math.sin(th));
        if (kx === 0 && ky === 0) continue;
        const amp = Math.pow(Math.hypot(kx, ky) / k0, -beta);
        const ph = R() * Math.PI * 2;
        for (let i = 0; i < N; i++) { const a = (2 * Math.PI * kx * i) / N + ph; cx[i] = Math.cos(a); sx[i] = Math.sin(a); const b = (2 * Math.PI * ky * i) / N; cy[i] = Math.cos(b); sy[i] = Math.sin(b); }
        for (let y = 0; y < N; y++) { const c = cy[y] * amp, s2 = sy[y] * amp, o = y * N; for (let x = 0; x < N; x++) f[o + x] += cx[x] * c - sx[x] * s2; }
      }
      return norm(f);
    };
    const warp = [line(1), line(3), line(7)], weft = [line(1), line(3), line(8)];
    const modW = field(10, 40, 28), modF = field(10, 40, 28);       // streak segments 2.5-10 cm
    const cockle = field(4, 14, 30, 1.2);                             // coating cockle 7-25 cm
    const rough = field(6, 20, 24);
    const h = new Float32Array(N * N), rr = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const mw = Math.max(0, 0.45 + 0.55 * modW[i]), mf = Math.max(0, 0.45 + 0.55 * modF[i]);
      const sw = warp[0][x] * 0.35 + warp[1][x] * 0.45 + warp[2][x] * 0.6;
      const sf = weft[0][y] * 0.35 + weft[1][y] * 0.45 + weft[2][y] * 0.6;
      // heights in mm-ish units: streaks ~0.05 mm, cockle ~0.6 mm
      h[i] = 0.05 * (sw * mw + 0.85 * sf * mf) + 0.06 * cockle[i];
      rr[i] = 0.25 * rough[i] + 0.3 * sw * mw;
    }
    const out = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const xl = (x - 1 + N) % N, xr = (x + 1) % N, yu = (y - 1 + N) % N, yd = (y + 1) % N;
      // slope per mm (texel)
      const dx = (h[y * N + xr] - h[y * N + xl]) / 2, dy = (h[yd * N + x] - h[yu * N + x]) / 2;
      const i = (y * N + x) * 4;
      out[i] = Math.round(Math.min(255, Math.max(0, (-dx * 2 + 0.5) * 255)));
      out[i + 1] = Math.round(Math.min(255, Math.max(0, (-dy * 2 + 0.5) * 255)));
      out[i + 2] = Math.round(Math.min(255, Math.max(0, (0.5 + rr[y * N + x] * 0.25) * 255)));
      out[i + 3] = 255;
    }
    return dataTex(out, N, { key: 'fabricMacro' });
  });
}

// Surface of a PVC/PU coating on woven polyester, for pvcCloth's macro layer. Isotropic on
// purpose (1D yarn streaks read as brushed metal or linen under a raking light): a fine matte
// coating grain of ~2-5 mm, a soft cockle of the coated cloth (7-25 cm), and a few short,
// faint slubs along warp and weft. 1 tile = 1 m, 1 texel ~ 1 mm; same encoding as
// fabricMacroNormal (R,G = slope, B = roughness modulation).
export function coatingMacroNormal({ size = 1024, seed = 37 } = {}) {
  return cached(`coatingMacro3:${size}:${seed}`, () => {
    const R = rng(seed);
    const N = size;
    const blur2 = (a, r, passes = 3) => {
      let src = a;
      for (let p = 0; p < passes; p++) {
        const t = new Float32Array(N * N), o = new Float32Array(N * N);
        for (let y = 0; y < N; y++) { let acc = 0; for (let k = -r; k <= r; k++) acc += src[y * N + ((k + N) % N)]; for (let x = 0; x < N; x++) { t[y * N + x] = acc / (2 * r + 1); acc += src[y * N + ((x + r + 1) % N)] - src[y * N + ((x - r + N) % N)]; } }
        for (let x = 0; x < N; x++) { let acc = 0; for (let k = -r; k <= r; k++) acc += t[((k + N) % N) * N + x]; for (let y = 0; y < N; y++) { o[y * N + x] = acc / (2 * r + 1); acc += t[((y + r + 1) % N) * N + x] - t[((y - r + N) % N) * N + x]; } }
        src = o;
      }
      return src;
    };
    const norm = (a) => { let m = 0, s2 = 0; for (const v of a) m += v; m /= a.length; for (let i = 0; i < a.length; i++) { a[i] -= m; s2 += a[i] * a[i]; } s2 = Math.sqrt(s2 / a.length) || 1; for (let i = 0; i < a.length; i++) a[i] /= s2; return a; };
    const white = () => { const a = new Float32Array(N * N); for (let i = 0; i < a.length; i++) a[i] = R() * 2 - 1; return a; };
    const grain = norm(blur2(white(), 1));
    const grain2 = norm(blur2(white(), 3));
    // cockle: sum of integer-frequency waves (tileable), 4-14 cycles per metre
    const cockle = new Float32Array(N * N);
    for (let w = 0; w < 26; w++) {
      const kk = 4 + 10 * R(), th = R() * Math.PI * 2;
      const kx = Math.round(kk * Math.cos(th)), ky = Math.round(kk * Math.sin(th));
      if (!kx && !ky) continue;
      const amp = Math.pow(Math.hypot(kx, ky) / 4, -1.2), ph = R() * Math.PI * 2;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cockle[y * N + x] += amp * Math.sin((2 * Math.PI * (kx * x + ky * y)) / N + ph);
    }
    norm(cockle);
    // sparse short slubs along warp (x) and weft (y): 15-40 mm, ~1.5 mm wide, very low
    const slub = new Float32Array(N * N);
    for (let i = 0; i < 420; i++) {
      const cx = Math.floor(R() * N), cy = Math.floor(R() * N), len = 15 + 25 * R(), alongX = R() < 0.5, a = 0.5 + 0.5 * R();
      for (let t = -len / 2; t <= len / 2; t++) {
        const f = Math.cos((Math.PI * t) / len) ** 2;
        for (let wdt = -1; wdt <= 1; wdt++) {
          const x = (cx + (alongX ? Math.round(t) : wdt) + N) % N, y = (cy + (alongX ? wdt : Math.round(t)) + N) % N;
          slub[y * N + x] += a * f * (wdt === 0 ? 1 : 0.45);
        }
      }
    }
    const h = new Float32Array(N * N), rr = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) {
      // a taut coated roof is smooth: the relief is tiny (it mostly shows as gloss variation)
      h[i] = 0.012 * grain[i] + 0.006 * grain2[i] + 0.06 * cockle[i] + 0.02 * slub[i];
      rr[i] = 0.35 * grain2[i] + 0.25 * grain[i] - 0.3 * slub[i];
    }
    const out = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const xl = (x - 1 + N) % N, xr = (x + 1) % N, yu = (y - 1 + N) % N, yd = (y + 1) % N;
      const dx = (h[y * N + xr] - h[y * N + xl]) / 2, dy = (h[yd * N + x] - h[yu * N + x]) / 2;
      const i = (y * N + x) * 4;
      out[i] = Math.round(Math.min(255, Math.max(0, (-dx * 2 + 0.5) * 255)));
      out[i + 1] = Math.round(Math.min(255, Math.max(0, (-dy * 2 + 0.5) * 255)));
      out[i + 2] = Math.round(Math.min(255, Math.max(0, (0.5 + rr[y * N + x] * 0.2) * 255)));
      out[i + 3] = 255;
    }
    return dataTex(out, N, { key: 'coatingMacro' });
  });
}

// Embossed moulding mark (raised lettering on a plastic/cast part) as a normal map,
// drawn on a 2D canvas. The plaque geometry carries uv 0..1 over its face.
export function embossNormal({ text = 'KLAPKLAAR', sub = '', w = 512, h = 160, strength = 3.5 } = {}) {
  return cached(`emboss:${text}:${sub}:${w}:${h}:${strength}`, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${Math.round(h * (sub ? 0.42 : 0.56))}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    if ('letterSpacing' in g) g.letterSpacing = `${Math.round(h * 0.04)}px`;
    const tw = g.measureText(text).width;
    if (tw > w * 0.86) g.font = g.font.replace(/\d+px/, `${Math.floor(parseInt(/\d+px/.exec(g.font)[0], 10) * w * 0.86 / tw)}px`);
    g.fillText(text, w / 2, sub ? h * 0.38 : h * 0.53);
    if (sub) { g.font = `700 ${Math.round(h * 0.22)}px "Helvetica Neue", Arial, sans-serif`; g.fillText(sub, w / 2, h * 0.78); }
    // thin raised border
    g.strokeStyle = '#fff'; g.lineWidth = h * 0.045; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
    const src = g.getImageData(0, 0, w, h).data;
    // soften 1 px (draft angle) then height -> normal (non-tiling, clamp at the border)
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let a = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.min(w - 1, Math.max(0, x + dx)), yy = Math.min(h - 1, Math.max(0, y + dy)); a += src[(yy * w + xx) * 4]; n++; }
      H[y * w + x] = a / n / 255;
    }
    const out = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const xl = Math.max(0, x - 1), xr = Math.min(w - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(h - 1, y + 1);
      const dx = (H[y * w + xr] - H[y * w + xl]) * strength, dy = (H[yd * w + x] - H[yu * w + x]) * strength;
      let nx = -dx, ny = dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const k = ((h - 1 - y) * w + x) * 4; // canvas top -> v = 1
      out[k] = Math.round((nx * 0.5 + 0.5) * 255); out[k + 1] = Math.round((ny * 0.5 + 0.5) * 255); out[k + 2] = Math.round((nz * 0.5 + 0.5) * 255); out[k + 3] = 255;
    }
    const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = THREE.NoColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = maxAniso; t.flipY = false; t.needsUpdate = true;
    return t;
  });
}
