// Rectangular loose board (furniture group, round 5): werkblad voor de marktkraam and other
// rectangular table tops, lying flat on the floor. Called from tableTop.js when the spec gives a
// rectangle (`w` x `d`) or a plywood `finish`.
//
// { w, d, thickness, finish }
//   w x d      board size (2.0 x 1.0 m default; cm accepted), thickness 18 mm
//   finish     'multiplex-antislip' (default): birch plywood with a dark brown phenolic film on both
//              faces, the top face embossed with the hexagonal anti-slip pattern (8 mm cells), the sawn
//              edges sealed with brown acrylic over the plies |
//              'multiplex' / 'berken': clear-lacquered rotary-cut birch faces, plies on the edge
// The plies stay readable through the edge sealer (13 plies in 18 mm); arrises lightly eased.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as TX from '../js/textures.js';
import * as S from '../js/seatKit.js';
import * as U from '../js/upholstery2.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const cache = new Map();
const cached = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function tex(data, w, h, { srgb = false, repeat = [1, 1], name = '' } = {}) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.repeat.set(...repeat); t.needsUpdate = true; t.name = name;
  return t;
}

// hexagonal anti-slip emboss: raised hexagons (flat tops, bevelled flanks) in a honeycomb of pitch A.
// The tile holds 8 x 8 cells (8 rows keep the offset rows periodic); pixels are not square, the
// texture repeat restores the metres.
const A = 0.008;
function antislipNormal() {
  return cached('antislipN', () => {
    const W = 8 * A, Hh = 8 * A * Math.sqrt(3) / 2, N = 256;
    const H = new Float32Array(N * N);
    const rowH = A * Math.sqrt(3) / 2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i / N) * W, y = (j / N) * Hh;
      // nearest cell centre (check the three candidate rows)
      let best = 1e9;
      const r0 = Math.floor(y / rowH);
      for (let r = r0 - 1; r <= r0 + 1; r++) {
        const off = (((r % 2) + 2) % 2) * A / 2;
        const c0 = Math.round((x - off) / A);
        for (let c = c0 - 1; c <= c0 + 1; c++) {
          const cx = c * A + off, cy = r * rowH;
          const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
          // hexagon metric (pointy along y)
          const d = Math.max(dx, dx * 0.5 + dy * Math.sqrt(3) / 2);
          best = Math.min(best, d);
        }
      }
      H[j * N + i] = 1 - sstep(A * 0.3, A * 0.43, best);
    }
    // normals from the height (non-square texels: scale the y slope by the aspect)
    const out = new Uint8Array(N * N * 4);
    const sx = 0.9, sy = 0.9 * (W / Hh);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const xl = (i - 1 + N) % N, xr = (i + 1) % N, yu = (j - 1 + N) % N, yd = (j + 1) % N;
      const dx = (H[j * N + xr] - H[j * N + xl]) * sx, dy = (H[yd * N + i] - H[yu * N + i]) * sy;
      const l = Math.hypot(dx, dy, 1), k = (j * N + i) * 4;
      out[k] = Math.round((-dx / l * 0.5 + 0.5) * 255); out[k + 1] = Math.round((-dy / l * 0.5 + 0.5) * 255);
      out[k + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); out[k + 3] = 255;
    }
    return { n: tex(out, N, N, { repeat: [1 / W, 1 / Hh], name: 'antislip hex' }), H, N, W, Hh };
  });
}
// phenolic film: dark chocolate brown with a faint mottle (film weight), a few lighter scuffs
function filmAlbedo() {
  return cached('filmAlb', () => {
    const N = 1024, L = 1.0;
    const { noise, fbm } = makeNoise2(401);
    const d = new Uint8Array(N * N * 4);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i / N) * L, y = (j / N) * L;
      const k = 1 + fbm(x * 3, y * 3, 4) * 0.07 + fbm(x * 18 + 2, y * 18, 3) * 0.04 + noise(x * 300, y * 300) * 0.02;
      // (round 6: no hexagon term here any more: its 1 m tile did not match the emboss period and beat
      // against the normal map into moire)
      const kk = k;
      const o = (j * N + i) * 4;
      d[o] = 92 * kk; d[o + 1] = 62 * kk; d[o + 2] = 44 * kk; d[o + 3] = 255;
    }
    return tex(d, N, N, { srgb: true, repeat: [1 / L, 1 / L], name: 'phenolic film' });
  });
}
function antislipFilm() {
  return cached('antislipMat', () => {
    const m = new THREE.MeshPhysicalMaterial({
      map: filmAlbedo(), normalMap: antislipNormal().n, normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.4, specularIntensity: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.3, name: 'phenolic film antislip',
    });
    m.userData.albedoL = 0.06;
    return m;
  });
}
function sealedEdge() {
  return cached('sealedEdge', () => {
    const map = TX.plyEdgeAlbedo().clone(); map.repeat.set(4, 1); map.needsUpdate = true;
    const m = new THREE.MeshPhysicalMaterial({ map, color: '#7E5238', roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4, name: 'sealed ply edge' });
    m.userData.albedoL = 0.08;
    return m;
  });
}

export function workBoard(p = {}) {
  let L = Number(p.w ?? p.length ?? 2.0), W = Number(p.d ?? p.width ?? 1.0), T = Number(p.thickness ?? 0.018);
  if (L > 10) L /= 100; if (W > 10) W /= 100; if (T > 0.2) T /= 1000;
  if (W > L) [L, W] = [W, L];
  const fin = String(p.finish || 'multiplex-antislip').toLowerCase();
  const antislip = fin.includes('antislip') || fin.includes('film');
  const bins = new G.PartBin();
  const { faces, band } = F.slab(L, W, T, { rc: 0.006, re: 0.0015 });
  if (antislip) {
    bins.add(antislipFilm(), faces.translate(0, T, 0));
  } else {
    bins.add(U.birchPly({ clean: true }), U.planarUV(faces.translate(0, T, 0), { rot: 0.0 }));
  }
  // edge: uv u along the perimeter, v across the thickness (0..1 = the plies)
  {
    const pos = band.attributes.position, uv = band.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) + pos.getZ(i), Math.min(1, Math.max(0, (pos.getY(i) + T) / T)));
    uv.needsUpdate = true;
    bins.add(antislip ? sealedEdge() : M.birchEdge(), band.translate(0, T, 0));
  }
  const group = new THREE.Group(); group.name = `workBoard ${L}x${W} ${fin}`;
  bins.build(group);
  // round 7: the hero frames the whole board (art direction: the product was cropped off the left edge); the near
  // two-thirds crop is still available with frameNear: true
  if (antislip && p.frameNear === true) {
    // round 6: the 8 mm hexagons were ~4 px at catalogue size (invisible, and beating into moire). Frame the
    // nearer two thirds of the board (the far end runs out of the picture), so the near corner with the
    // sealed ply edge and the emboss reads; a lower, raking key makes every hexagon catch light.
    group.traverse((o) => { if (o.isMesh) o.userData.noFrame = true; });
    const pos = [];
    for (const x of [-L / 2 + L * 0.45, L / 2]) for (const y of [0, T]) for (const z of [-W / 2, W / 2]) pos.push(x, y, z);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex([0, 0, 0]);
    const proxy = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff00ff }));
    proxy.layers.set(5); proxy.castShadow = false; proxy.receiveShadow = false; proxy.frustumCulled = false; proxy.userData.frameProxy = true;
    group.add(proxy);
  }
  return {
    object: group,
    detail: { target: [L / 2 - 0.05, T, W / 2 - 0.05], size: 0.18, azimuth: 34, elevation: 26 },
    meta: { L, W, T, finish: fin },
    // a long flat board: seen from a little higher so the face (and its hexagon emboss) reads
    view: { hero: antislip ? { elevation: 30, fill: 0.9 } : { elevation: 36, fill: 0.84 }, front: { elevation: 24 } },
    rig: (() => {
      const r = S.seatRig(group, { default: { key: antislip ? { azimuth: -50, elevation: 24, distanceRel: 1.4, aimRel: [0.1, 0, 0.3] } : { azimuth: -30, elevation: 40, distanceRel: 1.4, aimRel: [-0.3, 0, 0.3] } } });
      // dark brown film: expose for the board, not for a mid grey
      if (antislip) r.default.exposure = Math.min(Math.max(r.default.exposure, 1.0), 1.15);
      return r;
    })(),
  };
}
