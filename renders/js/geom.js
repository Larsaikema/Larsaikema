// Geometry helpers for parametric product builders.
// Units are metres, Y is up, the product stands on y = 0, front faces +Z.
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _up = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// 2D profiles: arrays of {x, y, nx, ny} (counter-clockwise, convex).

export function roundedPolygonProfile(sides, acrossFlats, cornerRadius, segs = 3, rotation = 0) {
  const apothem = acrossFlats / 2;
  const cr = Math.min(cornerRadius, apothem * 0.9);
  const inner = apothem - cr; // apothem of the polygon traced by the corner-arc centres
  const R = inner / Math.cos(Math.PI / sides);
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    const cx = Math.cos(a) * R, cy = Math.sin(a) * R;
    const a0 = a - Math.PI / sides, a1 = a + Math.PI / sides;
    for (let s = 0; s <= segs; s++) {
      const t = a0 + (a1 - a0) * (s / segs);
      const nx = Math.cos(t), ny = Math.sin(t);
      pts.push({ x: cx + nx * cr, y: cy + ny * cr, nx, ny });
    }
  }
  return pts;
}

export function roundedRectProfile(w, h, r, segs = 3) {
  r = Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5);
  const pts = [];
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]];
  for (const [cx, cy, a0] of corners) {
    for (let s = 0; s <= segs; s++) {
      const t = a0 + (Math.PI / 2) * (s / segs);
      const nx = Math.cos(t), ny = Math.sin(t);
      pts.push({ x: cx + nx * r, y: cy + ny * r, nx, ny });
    }
  }
  return pts;
}

export function circleProfile(r, segs = 24) {
  const pts = [];
  for (let i = 0; i < segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    pts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, nx: Math.cos(t), ny: Math.sin(t) });
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Extrude a profile from a to b. `side` orients the profile's x axis (projected
// perpendicular to the axis). Smooth normals from the profile, flat caps.
export function prism(profile, a, b, { side = null, caps = true, uvScale = 1 } = {}) {
  const axis = new THREE.Vector3().subVectors(b, a);
  const len = axis.length();
  axis.normalize();
  let px = side ? side.clone() : (Math.abs(axis.y) < 0.95 ? _up.clone() : new THREE.Vector3(1, 0, 0));
  px.addScaledVector(axis, -px.dot(axis)).normalize();
  const py = new THREE.Vector3().crossVectors(axis, px).normalize();
  const n = profile.length;
  const pos = [], nor = [], uv = [], idx = [];
  // perimeter length for uv
  let per = 0; const acc = [0];
  for (let i = 0; i < n; i++) { const p = profile[i], q = profile[(i + 1) % n]; per += Math.hypot(q.x - p.x, q.y - p.y); acc.push(per); }
  for (let ring = 0; ring < 2; ring++) {
    const o = ring === 0 ? a : b;
    for (let i = 0; i <= n; i++) {
      const p = profile[i % n];
      pos.push(o.x + px.x * p.x + py.x * p.y, o.y + px.y * p.x + py.y * p.y, o.z + px.z * p.x + py.z * p.y);
      nor.push(px.x * p.nx + py.x * p.ny, px.y * p.nx + py.y * p.ny, px.z * p.nx + py.z * p.ny);
      uv.push((acc[i] / uvScale), (ring * len) / uvScale);
    }
  }
  const row = n + 1;
  for (let i = 0; i < n; i++) idx.push(i, i + 1, row + i + 1, i, row + i + 1, row + i);
  if (caps) {
    for (let ring = 0; ring < 2; ring++) {
      const o = ring === 0 ? a : b;
      const nrm = ring === 0 ? axis.clone().negate() : axis;
      const base = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const p = profile[i];
        pos.push(o.x + px.x * p.x + py.x * p.y, o.y + px.y * p.x + py.y * p.y, o.z + px.z * p.x + py.z * p.y);
        nor.push(nrm.x, nrm.y, nrm.z); uv.push(p.x / uvScale, p.y / uvScale);
      }
      for (let i = 1; i < n - 1; i++) {
        if (ring === 0) idx.push(base, base + i + 1, base + i); else idx.push(base, base + i, base + i + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export const tube = (a, b, r, segs = 20, opts = {}) => prism(circleProfile(r, segs), a, b, opts);
export const hexTube = (a, b, acrossFlats, opts = {}) =>
  prism(roundedPolygonProfile(6, acrossFlats, acrossFlats * 0.07, 3, Math.PI / 6), a, b, opts);
export const flatBar = (a, b, w, t, side, r = null) =>
  prism(roundedRectProfile(w, t, r ?? Math.min(w, t) * 0.35, 3), a, b, { side });

// Rounded box centred at the origin.
export function roundedBox(w, h, d, r = 0.004, segs = 3) {
  return prism(roundedRectProfile(w, h, r, segs), V3(0, 0, -d / 2), V3(0, 0, d / 2), { side: V3(1, 0, 0) });
}

// ---------------------------------------------------------------------------
// Parametric surface: fn(u, v, target) writes a point. Returns indexed geometry
// with smooth normals. closedU joins the u = 0 / u = 1 seam for normals.
export function surface(fn, nu, nv, { closedU = false, uvScale = [1, 1], flipNormals = false } = {}) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const uvs = new Float32Array((nu + 1) * (nv + 1) * 2);
  const p = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const k = j * (nu + 1) + i;
      fn(i / nu, j / nv, p);
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      uvs[k * 2] = (i / nu) * uvScale[0]; uvs[k * 2 + 1] = (j / nv) * uvScale[1];
    }
  }
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    if (flipNormals) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (closedU) {
    const n = g.attributes.normal;
    for (let j = 0; j <= nv; j++) {
      const a = j * (nu + 1), b = a + nu;
      const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return g;
}

// Lathe from an array of [r, y] pairs (smooth normals).
export function lathe(points, segs = 64, phiStart = 0, phiLength = Math.PI * 2) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segs, phiStart, phiLength);
}

// Merge geometries (all must share the same attribute set: position/normal/uv).
export function merge(list) {
  const clean = list.filter(Boolean).map((g) => {
    const gi = g.index ? g : g;
    if (!gi.attributes.uv) {
      gi.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gi.attributes.position.count * 2), 2));
    }
    for (const k of Object.keys(gi.attributes)) if (!['position', 'normal', 'uv'].includes(k)) gi.deleteAttribute(k);
    return gi.index ? gi : gi;
  });
  // mergeGeometries needs all indexed or all non-indexed
  const anyIndexed = clean.some((g) => g.index);
  const norm = clean.map((g) => (anyIndexed && !g.index ? indexify(g) : g));
  return mergeGeometries(norm, false);
}

function indexify(g) {
  const n = g.attributes.position.count;
  const idx = new Array(n); for (let i = 0; i < n; i++) idx[i] = i;
  g.setIndex(idx); return g;
}

export function transformed(geom, { position = null, rotation = null, scale = null, matrix = null } = {}) {
  const m = matrix ? matrix.clone() : new THREE.Matrix4();
  if (!matrix) {
    const q = new THREE.Quaternion();
    if (rotation) q.setFromEuler(new THREE.Euler(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0, rotation[3] || 'XYZ'));
    m.compose(position ? (position.isVector3 ? position : V3(...position)) : V3(), q, scale ? (scale.isVector3 ? scale : V3(...scale)) : V3(1, 1, 1));
  }
  geom.applyMatrix4(m);
  return geom;
}

// Mesh factory with shadow flags on.
export function mesh(geometry, material, { cast = true, receive = true, name = '' } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast; m.receiveShadow = receive; m.name = name;
  return m;
}

// Group helper: collect geometries per material, merge into one mesh per material.
export class PartBin {
  constructor() { this.bins = new Map(); }
  add(material, geom) {
    if (!geom) return;
    if (!this.bins.has(material)) this.bins.set(material, []);
    this.bins.get(material).push(geom);
  }
  build(group, opts = {}) {
    for (const [mat, list] of this.bins) {
      const g = merge(list);
      group.add(mesh(g, mat, opts));
    }
    return group;
  }
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
