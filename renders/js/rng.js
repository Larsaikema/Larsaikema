// Deterministic random helpers. Nothing in the pipeline may use Math.random():
// the same spec must always produce the same pixels.

export function halton(index, base) {
  let f = 1, r = 0, i = index;
  while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); }
  return r;
}

// Small seeded PRNG (mulberry32).
export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Concentric (Shirley) mapping of the unit square to the unit disk: keeps stratification.
export function squareToDisk(u, v) {
  const a = 2 * u - 1, b = 2 * v - 1;
  if (a === 0 && b === 0) return [0, 0];
  let r, phi;
  if (Math.abs(a) > Math.abs(b)) { r = a; phi = (Math.PI / 4) * (b / a); }
  else { r = b; phi = Math.PI / 2 - (Math.PI / 4) * (a / b); }
  return [r * Math.cos(phi), r * Math.sin(phi)];
}

// Approximate inverse normal CDF (for Gaussian pixel-filter jitter).
export function invNorm(p) {
  p = Math.min(Math.max(p, 1e-6), 1 - 1e-6);
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155211881];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425, ph = 1 - pl;
  let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= ph) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

// 2D value noise + fbm, seeded, for procedural textures and fabric displacement.
export function makeNoise2(seed = 7) {
  const R = rng(seed);
  const N = 256, perm = new Uint8Array(N * 2), grad = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; grad[i] = R() * 2 - 1; }
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < N; i++) perm[i + N] = perm[i];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const v00 = grad[perm[X + perm[Y]]], v10 = grad[perm[X + 1 + perm[Y]]];
    const v01 = grad[perm[X + perm[Y + 1]]], v11 = grad[perm[X + 1 + perm[Y + 1]]];
    const u = fade(xf), v = fade(yf);
    return (v00 * (1 - u) + v10 * u) * (1 - v) + (v01 * (1 - u) + v11 * u) * v;
  }
  function fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
    let s = 0, a = 1, f = 1, n = 0;
    for (let o = 0; o < oct; o++) { s += a * noise(x * f, y * f); n += a; a *= gain; f *= lac; }
    return s / n;
  }
  return { noise, fbm };
}

// R2 low-discrepancy sequence (Roberts 2018): well distributed in 2D for any N.
// `offset` applies a Cranley-Patterson rotation so different uses decorrelate.
const R2_G = 1.32471795724474602596;
export function r2(n, offset = [0, 0]) {
  const a1 = 1 / R2_G, a2 = 1 / (R2_G * R2_G);
  return [(0.5 + offset[0] + n * a1) % 1, (0.5 + offset[1] + n * a2) % 1];
}
