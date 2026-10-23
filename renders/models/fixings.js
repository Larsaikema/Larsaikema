// Bevestigingsmateriaal (fixings): small zinc-plated and brass hardware sold in sets, as tidy flat-lays
// on the studio floor (knolled rows, or a loose handful where the shop sells "een handvol").
//
// { parts, count, color }
//   dakhaak             roof hook for tube-frame tents: Ø 4 mm zinc-plated wire, a big open hook that
//                       drops over a Ø 38-40 mm tube, a straight shank and a small closed eye for the
//                       elastic; `count` (default 4) side by side, alternately mirrored
//   klittenband         self-adhesive hook-and-loop tape, 50 mm: a roll of hook tape and a roll of loop
//                       tape standing side by side on cardboard cores, each with its free end draped
//                       over the front onto the floor (hook / loop face up); `color` wit | zwart
//   oogbout             M6 eye bolt (bent 6 mm eye, rolled thread); alone = a loose handful (no nut)
//   vleugelmoer         with oogbout: the bolts carry an M6 wing nut
//   schroefoog          zinc-plated screw eye for wood; alone = a loose handful
//   oogbout + vleugelmoer + schroefoog   two knolled columns: eye bolts with wing nuts, screw eyes
//   oogbout-vleugelmoer ten eye bolts with wing nuts, two rows of five
//   schroefoog-elastiek three screw eyes, each with a black ball bungee looped through the eye
//   schroef             4,5 x 45 mm chipboard screws, countersunk torx head (T20), partial thread;
//                       `count` (default 10) side by side, heads aligned, a few turned
//   spanschroef         M6 hook-eye turnbuckles (open body), `count` (default 5) side by side
//   zeilring + ponsijzer + slagstempel   brass grommets (12 mm) with washers, the hole punch and the
//                       setting tool on a small beech board
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as K4 from '../js/partsKit4.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';
import * as F from '../js/furniture.js';
import { rng } from '../js/rng.js';

const { V3 } = G;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const AZ = 34; // hero azimuth: local +X turned by AZ runs across the frame, local +Z towards the camera
const RIGHT = V3(Math.cos(AZ * DEG), 0, -Math.sin(AZ * DEG));
const FWD = V3(Math.sin(AZ * DEG), 0, Math.cos(AZ * DEG));

// ------------------------------------------------------------------ materials
const zinc = () => SG.zincSG({ rough: 0.3 });
function brass() {
  return K.cached('fx-brass', () => SG.procSurface(new THREE.MeshPhysicalMaterial({ color: '#CDA75E', metalness: 1, roughness: 0.3, name: 'brass' }),
    { kind: 'stipple', scale: 0.0006, bump: 0.000004, albedo: 0.03, rough: 0.05 }));
}
function toolSteel() {
  return K.cached('fx-tool', () => SG.procSurface(new THREE.MeshPhysicalMaterial({ color: '#8E9398', metalness: 1, roughness: 0.36, name: 'tool steel' }),
    { kind: 'stipple', scale: 0.0008, bump: 0.000006, albedo: 0.04, rough: 0.06 }));
}
function cardboard() {
  return K.cached('fx-card', () => SG.procSurface(new THREE.MeshPhysicalMaterial({ color: '#B48E62', roughness: 0.86, specularIntensity: 0.25, name: 'cardboard core' }),
    { kind: 'stipple', scale: 0.0009, bump: 0.00001, albedo: 0.08, rough: 0.04 }));
}
// side face of a wound tape roll: the layers as fine concentric rings (radial uv: u = radius in m)
function rollSideMat(hex) {
  return K.cached(`fx-rollside:${hex}`, () => {
    const W = 1024, c = document.createElement('canvas'); c.width = W; c.height = 4;
    const g = c.getContext('2d');
    const base = new THREE.Color(hex);
    const R = rng(31);
    for (let x = 0; x < W; x++) {
      // one layer per 2 mm of tape (texture spans 0.1 m of radius): a darker glue / backing line per layer
      const r = (x / W) * 0.1, f = (r / 0.002) % 1;
      const line = f < 0.16 ? 0.62 : 1 - 0.05 * R();
      const col = base.clone().multiplyScalar(line);
      g.fillStyle = `#${col.getHexString()}`; g.fillRect(x, 0, 1, 4);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8;
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.8, specularIntensity: 0.3, sheen: 0.4, sheenRoughness: 0.7, sheenColor: base.clone().lerp(new THREE.Color('#fff'), 0.3), name: `roll side ${hex}` });
  });
}

// ------------------------------------------------------------------ bins and placement
const geosOf = (bin) => { const out = []; for (const [, l] of bin.bins) out.push(...l); return out; };
function xform(bin, m) { for (const g of geosOf(bin)) g.applyMatrix4(m); return bin; }
function boxOf(bin) { const bb = new THREE.Box3(); for (const g of geosOf(bin)) { g.computeBoundingBox(); bb.union(g.boundingBox); } return bb; }
// rest a loose part the way it falls: the stable down direction nearest `pref` onto -Y, then on the floor
function settle(bin, pref = V3(0, -1, 0), { margin = 0.0015 } = {}) {
  const { down } = L5.stableDown(geosOf(bin), pref, { n: 900, stride: 3, margin });
  xform(bin, new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(down.clone().normalize(), V3(0, -1, 0))));
  const bb = boxOf(bin);
  return xform(bin, new THREE.Matrix4().makeTranslation(0, -bb.min.y, 0));
}
// put a part (local frame, long axis +X) on the floor: bbox centre at `at`, turned by yaw (deg)
function put(B, sub, { at = V3(), yaw = AZ } = {}) {
  const bb = boxOf(sub), c = bb.getCenter(V3());
  const m = new THREE.Matrix4().makeTranslation(at.x, 0, at.z)
    .multiply(new THREE.Matrix4().makeRotationY(yaw * DEG))
    .multiply(new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z));
  for (const [mat, list] of sub.bins) for (const g of list) { g.applyMatrix4(m); B.add(mat, g); }
}
const cam = (u, v) => RIGHT.clone().multiplyScalar(u).addScaledVector(FWD, v);
// knolled grid: items[r][c] (sub-bins, long axis +X), columns across the frame, rows front to back
function grid(B, rows, { gapU = 0.02, gapV = 0.014 } = {}) {
  const ext = rows.map((row) => row.map((s) => { const b = boxOf(s); return [b.max.x - b.min.x, b.max.z - b.min.z]; }));
  const nC = Math.max(...rows.map((r) => r.length));
  const colW = Array.from({ length: nC }, (_, c) => Math.max(0, ...ext.map((r) => (r[c] ? r[c][0] : 0))));
  const rowD = ext.map((r) => Math.max(...r.map((e) => e[1])));
  const totU = colW.reduce((a, b) => a + b, 0) + gapU * (nC - 1);
  const totV = rowD.reduce((a, b) => a + b, 0) + gapV * (rows.length - 1);
  let v = -totV / 2;
  rows.forEach((row, ri) => {
    let u = -totU / 2;
    row.forEach((s, ci) => { put(B, s, { at: cam(u + colW[ci] / 2, v + rowD[ri] / 2) }); u += colW[ci] + gapU; });
    v += rowD[ri] + gapV;
  });
}
// a loose handful: random yaw, no two parts touching (point samples on a hash grid), inside an ellipse
function scatter(B, makePart, n, { rx = 0.11, rz = 0.085, clear = 0.0035, seed = 5 } = {}) {
  const R = rng(seed);
  const cell = 0.006, hash = new Map();
  const key = (x, z) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
  let placed = 0;
  for (let i = 0; i < n * 3 && placed < n; i++) {
    const sub = makePart(i);
    const bb = boxOf(sub), c = bb.getCenter(V3());
    xform(sub, new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z));
    // footprint samples
    const pts = [];
    for (const g of geosOf(sub)) { const pa = g.attributes.position; const st = Math.max(1, Math.floor(pa.count / 220)); for (let k = 0; k < pa.count; k += st) pts.push([pa.getX(k), pa.getZ(k)]); }
    let ok = false, yaw = 0, px = 0, pz = 0;
    for (let tries = 0; tries < 80 && !ok; tries++) {
      yaw = R() * TAU;
      const a = R() * TAU, rr = Math.sqrt(R()) * (0.35 + 0.65 * Math.min(1, placed / 4));
      px = Math.cos(a) * rx * rr; pz = Math.sin(a) * rz * rr;
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      ok = true;
      for (const [x, z] of pts) {
        const wx = x * cy + z * sy + px, wz = -x * sy + z * cy + pz;
        const gx = Math.floor(wx / cell), gz = Math.floor(wz / cell);
        for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) {
          const l = hash.get(`${gx + dx},${gz + dz}`);
          if (l) for (const [qx, qz] of l) if ((qx - wx) ** 2 + (qz - wz) ** 2 < clear * clear) { ok = false; break; }
        }
        if (!ok) break;
      }
    }
    if (!ok) continue;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (const [x, z] of pts) { const wx = x * cy + z * sy + px, wz = -x * sy + z * cy + pz; const k = key(wx, wz); if (!hash.has(k)) hash.set(k, []); hash.get(k).push([wx, wz]); }
    const m = new THREE.Matrix4().makeTranslation(px, 0, pz).multiply(new THREE.Matrix4().makeRotationY(yaw));
    for (const [mat, list] of sub.bins) for (const g of list) { g.applyMatrix4(m); B.add(mat, g); }
    placed++;
  }
}

// ------------------------------------------------------------------ parts (local: long axis +X, on the floor)
// M6 eye bolt (bent 6 mm wire eye, Ø 19 mm outside), 50 mm rolled thread; optional wing nut on the thread
function eyeBolt(mats, { nut = false } = {}) {
  const sub = new G.PartBin();
  const shank = 0.05;
  const { yc } = K4.eyeBolt(sub, { metal: mats.zinc }, { R: 0.0092, d: 0.006, shank, thread: 0.006 });
  if (nut) {
    const w = K.wingNutGeo(0.62);       // axis +Y, base at y = 0
    w.rotateZ(-Math.PI / 2);            // axis +X
    w.rotateX(Math.PI / 2);             // wings flat (spanning z)
    w.translate(shank - 0.024, yc, 0);
    sub.add(mats.zinc, w);
  }
  return settle(sub);
}
// screw eye for wood: 4 mm wire eye, 40 mm gimlet-point screw
function screwEye(mats) {
  const sub = new G.PartBin();
  K4.eyeBolt(sub, { metal: mats.zinc }, { R: 0.0072, d: 0.004, shank: 0.04, thread: 0.0046, screw: true });
  return settle(sub);
}
// hexalobular (torx) outline, radius by angle
const torxR = (a, Rm = 0.00165, A = 0.00032) => Rm + A * Math.cos(6 * a) + A * 0.18 * Math.cos(18 * a);
// 4,5 x 45 chipboard screw: countersunk head (top face at x = 0, facing -X) with a T20 recess, partial thread
function torxScrew(mat, { L = 0.045, d = 0.0045, head = 0.0088 } = {}) {
  const sub = new G.PartBin();
  const r = d / 2, hr = head / 2, hh = 0.0034, rs = 0.00158, rc = 0.00148, tl = 0.028, tip = 0.005;
  const prof = [[hr, 0], [hr, 0.0004], [rs * 1.1, hh], [rs, hh + 0.0006], [rs, L - tl], [rc, L - tl + 0.0012], [rc, L - tip]];
  for (let i = 1; i <= 6; i++) { const t = i / 6; prof.push([Math.max(0.0001, rc * (1 - t) ** 1.2), L - tip + tip * t]); }
  const body = K.lathe(prof, 28);
  body.rotateZ(-Math.PI / 2);          // lathe +Y -> +X
  sub.add(mat, body);
  // head face with the recess
  const outline = []; for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU; const rr = torxR(a); outline.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr)); }
  const face = new THREE.Shape(); face.absarc(0, 0, hr, 0, TAU, false);
  face.holes.push(new THREE.Path(outline.slice().reverse()));
  const fg = new THREE.ShapeGeometry(face, 40); fg.rotateY(-Math.PI / 2);   // normal -> -X, shape (x, y) -> (0, y, x)
  sub.add(mat, fg);
  const depth = 0.0024;
  const pos = [], nor = [], idx = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU, rr = torxR(a), y = Math.sin(a) * rr, z = Math.cos(a) * rr;
    const da = 0.001, y2 = Math.sin(a + da) * torxR(a + da), z2 = Math.cos(a + da) * torxR(a + da);
    const ty = y2 - y, tz = z2 - z, tl2 = Math.hypot(ty, tz);
    const ny = tz / tl2, nz = -ty / tl2;       // in-plane normal pointing inwards (towards the axis)
    const sgn = ny * y + nz * z > 0 ? -1 : 1;
    pos.push(0, y, z, depth, y, z); nor.push(0, ny * sgn, nz * sgn, 0, ny * sgn, nz * sgn);
  }
  for (let i = 0; i < 72; i++) { const a = i * 2, b = ((i + 1) % 72) * 2; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const wall = new THREE.BufferGeometry();
  wall.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  wall.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  wall.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  wall.setIndex(idx);
  sub.add(mat, wall);
  const floor = new THREE.ShapeGeometry(new THREE.Shape(outline), 4); floor.rotateY(-Math.PI / 2); floor.translate(depth, 0, 0);
  sub.add(mat, floor);
  // sharp single-start thread on the last 28 mm
  const pts = [], pitch = 0.0021, x0 = L - tl + 0.0008, turns = (tl - 0.0016) / pitch;
  for (let i = 0; i <= turns * 28; i++) {
    const t = i / 28, x = x0 + t * pitch, a = t * TAU;
    const fade = Math.min(1, (L - x) / tip);
    const core = x > L - tip ? rc * fade : rc;
    const rr = core + 0.00005;
    pts.push(V3(x, Math.cos(a) * rr, Math.sin(a) * rr));
  }
  const hgt = r - rc - 0.00005;
  sub.add(mat, K.sweep(pts, [[hgt, 0], [-0.0003, 0.00048], [-0.0003, -0.00048]], { up: V3(1, 0, 0), scale: (i) => { const x = pts[i].x; const f = Math.min(1, (L - x) / tip * 1.3, (x - x0) / 0.002); return [Math.max(0.15, f), 1]; } }));
  return sub;
}
// roof hook: Ø 4 mm wire, closed eye, shank, open hook for a Ø 38-40 mm tube (long axis +X)
function roofHook(mat) {
  const sub = new G.PartBin();
  const r = 0.002;
  const pts = K4.planarPath([['line', 0.002], ['arc', 0.0062, 318], ['line', 0.048], ['arc', 0.0218, -228], ['line', 0.007]], { y: r, step: 0.0008, heading: 42 });
  sub.add(mat, K4.bar(pts, r, 14));
  return sub;
}
// M6 hook-eye turnbuckle
function turnbuckle(mat) {
  const sub = new G.PartBin();
  K4.turnbuckle(sub, { metal: mat }, { M: 0.006, body: 0.085 });
  return sub;
}

// ------------------------------------------------------------------ hook and loop tape rolls
// hook tape: rows of moulded hooks along the tape (normal map, u along the tape, v across, metres)
function hookRowsNormal() {
  return K.cached('fx-hookrows', () => {
    const N = 256, d = new Uint8Array(N * N * 4), R = rng(7);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      // 8 rows per tile across (v), hooks every ~1 mm along (u) as short bumps
      const fv = (y / N) * 8, fu = (x / N) * 10 + (Math.floor(fv) % 2) * 0.5;
      const sv = Math.sin(fv * TAU), su = Math.sin(fu * TAU);
      const ny = sv * 0.55, nx = su * 0.35 * (0.5 + 0.5 * Math.cos(fv * TAU));
      const o = (y * N + x) * 4;
      d[o] = Math.round((nx * 0.5 + 0.5) * 255); d[o + 1] = Math.round((ny * 0.5 + 0.5) * 255); d[o + 2] = 255; d[o + 3] = 255;
      if (R() < 0) d[o] = 0;
    }
    const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
    t.repeat.set(1 / 0.01, 1 / 0.0104); t.anisotropy = 8;
    return t;
  });
}
function hookFace(hex) {
  return K.cached(`fx-hookface:${hex}`, () => {
    const m = SG.hookTape(hex).clone();
    m.normalMap = hookRowsNormal(); m.normalScale = new THREE.Vector2(0.9, 0.9);
    m.roughness = 0.55; m.specularIntensity = 0.7;
    m.userData = { ...m.userData }; delete m.userData.__hooked;
    m.name = `hook rows ${hex}`;
    return m;
  });
}
// a roll of 50 mm tape lying flat on its cardboard core (axis +Y), the free end leaving the roll
// tangentially towards the camera (+Z), rolling over onto its back so it lies flat, face up
function tapeRoll(face, side, core, { W = 0.05, Ro = 0.064, Ri = 0.0395, t = 0.0022, tail = 0.15, bend = 0 } = {}) {
  const sub = new G.PartBin();
  const y0 = 0.0015; // the core stands 1,5 mm proud of the tape on both sides
  const outer = new THREE.CylinderGeometry(Ro, Ro, W - 0.0012, 120, 1, true); outer.translate(0, y0 + W / 2, 0);
  { const uv = outer.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * TAU * Ro, uv.getY(i) * W); }
  sub.add(face, outer);
  for (const top of [true, false]) {
    const ring = new THREE.RingGeometry(Ri + 0.0028, Ro - 0.0006, 120, 1);
    const uv = ring.attributes.uv, pa = ring.attributes.position;
    for (let i = 0; i < pa.count; i++) uv.setXY(i, (Math.hypot(pa.getX(i), pa.getY(i)) - (Ri + 0.0028)) / 0.1, 0.5);
    ring.rotateX(top ? -Math.PI / 2 : Math.PI / 2); ring.translate(0, top ? y0 + W : y0, 0);
    sub.add(side, ring);
    const edge = new THREE.TorusGeometry(Ro - 0.0006, 0.0006, 6, 120); edge.rotateX(Math.PI / 2); edge.translate(0, top ? y0 + W - 0.0006 : y0 + 0.0006, 0);
    sub.add(face, edge);
  }
  const ch = W + 2 * y0;
  const cprof = [[Ri - 0.0026, 0], [Ri + 0.0028, 0], [Ri + 0.0028, ch], [Ri - 0.0026, ch], [Ri - 0.0026, 0]];
  sub.add(core, K.lathe(cprof, 96));
  // free end
  const n = 160, path = [], nrm = [];
  const Lt = 0.07 + tail;
  for (let i = 0; i <= n; i++) {
    const sArc = (i / n) * Lt;
    const th = (Math.PI / 2) * G.smoothstep(0.004, 0.07, sArc);
    const flat = G.smoothstep(0.05, 0.12, sArc);
    const x = (Ro - t / 2) + (W / 2) * Math.sin(th) + bend * flat * (sArc - 0.08) ** 2 * 6;
    const y = (y0 + W / 2) * Math.cos(th) + (t / 2) * Math.sin(th);
    path.push(V3(x, y, sArc)); nrm.push(V3(Math.cos(th), Math.sin(th), 0));
  }
  const strap = K.sweep(path, K.rrect(W - 0.0012, t, t * 0.45, 2), { normals: nrm });
  { const uv = strap.attributes.uv; for (let i = 0; i < uv.count; i++) { const a = uv.getX(i), b = uv.getY(i); uv.setXY(i, b, a); } }
  sub.add(face, strap);
  return sub;
}

// ------------------------------------------------------------------ zeilringen set
function grommet(mat, { R = 0.015, ri = 0.0062, h = 0.0058 } = {}) {
  // flange + barrel, axis +Y, flange on the floor
  const prof = [[ri, h], [ri, 0.0006], [ri + 0.0004, 0], [R - 0.0008, 0], [R, 0.0005], [R - 0.0006, 0.0011], [ri + 0.0018, 0.0011], [ri + 0.0011, 0.0016], [ri + 0.0011, h - 0.0003], [ri + 0.0005, h]];
  return K.lathe(prof.concat([prof[0]]), 56);
}
function washer(mat, { R = 0.015, ri = 0.0079 } = {}) {
  // dished ring: bottom outwards, rim, top inwards, inner edge down (lathe normals follow the profile direction)
  const prof = [[ri + 0.0004, 0.0012], [R - 0.0004, 0], [R, 0.0003], [R - 0.0006, 0.0009], [ri + 0.0004, 0.0021], [ri, 0.0017], [ri + 0.0004, 0.0012]];
  return K.lathe(prof, 56);
}

// ------------------------------------------------------------------ builder
export function fixings(p = {}) {
  let parts = p.parts || ['oogbout'];
  if (typeof parts === 'string') parts = [parts];
  const has = (k) => parts.includes(k);
  const mats = { zinc: zinc() };
  const B = new G.PartBin();
  let view = { hero: { elevation: 38 } };
  let detail = { target: [0, 0.01, 0], size: 0.1, azimuth: 30, elevation: 35 };
  let rig = L5.flatLayRig();

  if (has('dakhaak')) {
    const n = Math.max(1, Math.min(8, Math.round(Number(p.count ?? 4))));
    // long axis towards the camera, two by two, alternately mirrored
    const hooks = [];
    for (let k = 0; k < n; k++) { const h = roofHook(mats.zinc); xform(h, new THREE.Matrix4().makeRotationY(Math.PI / 2 + (k % 2 ? Math.PI : 0))); hooks.push(h); }
    const rows = []; const per = n > 4 ? Math.ceil(n / 2) : 2;
    for (let k = 0; k < n; k += per) rows.push(hooks.slice(k, k + per));
    grid(B, rows, { gapU: 0.018, gapV: 0.016 });
    view = { hero: { elevation: 46 } };
  } else if (has('klittenband')) {
    const white = String(p.color || 'wit').toLowerCase().startsWith('w');
    const hex = white ? '#EEEDE8' : '#1A1B1D';
    const hook = hookFace(hex), loop = SG.loopTape(hex);
    const card = cardboard();
    // hook tape roll left, loop tape roll right, both lying flat, the free ends towards the camera
    const a = tapeRoll(hook, rollSideMat(white ? '#E2E0DA' : '#202123'), card, { tail: 0.13, bend: 0.0 });
    const b = tapeRoll(loop, rollSideMat(white ? '#ECEAE5' : '#252628'), card, { tail: 0.1, bend: -0.25 });
    put(B, a, { at: cam(-0.07, 0.0), yaw: AZ });
    put(B, b, { at: cam(0.075, -0.035), yaw: AZ });
    view = { hero: { elevation: 36 } };
    detail = { target: [0, 0.02, 0.08], size: 0.12, azimuth: 30, elevation: 32 };
    if (!white) rig = L5.goodsRig({ tone: 'black', size: 0.2, exposure: 1.08, extra: L5.flatLayRig().default });
  } else if (has('zeilring') || has('ponsijzer') || has('slagstempel')) {
    const steel = toolSteel(), br = brass();
    // beech board 30 x 16 x 2 cm
    const board = F.slab(0.3, 0.16, 0.02, { rc: 0.006, re: 0.0025 });
    const wd = F.wood('beuken', { finish: 'mat', seed: 7 });
    for (const g of [board.faces, board.band]) { F.uvGrain(g, 'x', { offset: 0.21 }); g.translate(0, 0.02, 0); B.add(wd, g); }
    const top = 0.02;
    // hole punch (ponsijzer): Ø 20 bar, chamfered striking head, hollow cutting end Ø 12 with an ejection slot
    const punch = new G.PartBin();
    const pp = [[0.0001, 0], [0.0085, 0], [0.0098, 0.0015], [0.0098, 0.108], [0.0092, 0.112], [0.0078, 0.118], [0.0078, 0.136], [0.0063, 0.1395], [0.0059, 0.1395], [0.0059, 0.122], [0.0001, 0.122]];
    const pg = K.lathe(pp, 40); pg.rotateZ(-Math.PI / 2); pg.translate(0, 0.0098, 0); punch.add(steel, pg);
    // knurled grip band
    for (let k = 0; k < 18; k++) { const t = new THREE.TorusGeometry(0.0099, 0.00045, 4, 40); t.rotateY(Math.PI / 2); t.translate(0.04 + k * 0.0022, 0.0098, 0); punch.add(steel, t); }
    // setting tool (slagstempel): Ø 20 bar, a rounded flaring pin that curls the barrel
    const setter = new G.PartBin();
    const sp = [[0.0001, 0], [0.0085, 0], [0.0098, 0.0015], [0.0098, 0.098], [0.0094, 0.101], [0.0074, 0.104], [0.0062, 0.106], [0.0056, 0.112], [0.0052, 0.116], [0.0042, 0.1185], [0.0024, 0.1198], [0.0001, 0.12]];
    const sg = K.lathe(sp, 40); sg.rotateZ(-Math.PI / 2); sg.translate(0, 0.0098, 0); setter.add(steel, sg);
    for (let k = 0; k < 18; k++) { const t = new THREE.TorusGeometry(0.0099, 0.00045, 4, 40); t.rotateY(Math.PI / 2); t.translate(0.035 + k * 0.0022, 0.0098, 0); setter.add(steel, t); }
    // tools lie across the board, the punch behind the setter
    const lay = (bin, x, z, yaw) => { const bb = boxOf(bin), c = bb.getCenter(V3()); const m = new THREE.Matrix4().makeTranslation(x, top, z).multiply(new THREE.Matrix4().makeRotationY(yaw * DEG)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z)); for (const [mm, l] of bin.bins) for (const g of l) { g.applyMatrix4(m); B.add(mm, g); } };
    lay(punch, -0.075, -0.005, -58);
    lay(setter, -0.025, 0.002, -50);
    // grommets and washers on the front right of the board, a few on their back (barrel up)
    const R = rng(23);
    const spots = [[0.085, -0.05], [0.115, -0.024], [0.08, -0.014], [0.107, 0.012], [0.073, 0.024], [0.126, 0.044], [0.097, 0.05], [0.064, 0.058], [0.05, -0.05], [0.13, -0.058]];
    spots.forEach(([x, z], i) => {
      const g = i % 3 === 2 ? washer(br) : grommet(br);
      if (i % 3 === 1) { g.rotateX(Math.PI); g.translate(0, 0.0058, 0); }
      g.rotateY(R() * TAU); g.translate(x, top, z);
      B.add(br, g);
    });
    // one grommet set off the board, front left on the floor
    { const g = grommet(br); g.translate(-0.12, 0, 0.115); B.add(br, g); const w = washer(br); w.translate(-0.085, 0, 0.122); B.add(br, w); }
    // the board lies with its long side across the frame
    xform(B, new THREE.Matrix4().makeRotationY(AZ * DEG));
    view = { hero: { elevation: 40 } };
    detail = { target: [0.06, 0.03, 0.03], size: 0.12, azimuth: 30, elevation: 40 };
  } else if (has('schroef')) {
    const n = Math.max(1, Math.min(20, Math.round(Number(p.count ?? 10))));
    // one row, heads aligned front left, the points running away to the back right, so the torx recesses face
    // the camera; each screw rests the way it falls (head rim + thread crests), turned about its axis
    const psi = AZ + 45;                                   // yaw of the screw axis (head -> point)
    const dirE = V3(Math.cos((psi - 90) * DEG), 0, -Math.sin((psi - 90) * DEG)); // across the row
    for (let k = 0; k < n; k++) {
      const s = torxScrew(mats.zinc);
      const bb0 = boxOf(s), c0 = bb0.getCenter(V3());
      xform(s, new THREE.Matrix4().makeTranslation(0, -c0.y, -c0.z));
      xform(s, new THREE.Matrix4().makeRotationX((k * 1.7) % TAU));
      settle(s);
      const bb = boxOf(s);
      // head (x = min) on the row line
      const at = dirE.clone().multiplyScalar((k - (n - 1) / 2) * 0.0132);
      const m = new THREE.Matrix4().makeTranslation(at.x, 0, at.z).multiply(new THREE.Matrix4().makeRotationY((psi + ((k * 7) % 5) - 2) * DEG)).multiply(new THREE.Matrix4().makeTranslation(-bb.min.x, -bb.min.y, -(bb.min.z + bb.max.z) / 2));
      for (const [mm, l] of s.bins) for (const g of l) { g.applyMatrix4(m); B.add(mm, g); }
    }
    view = { hero: { elevation: 34 } };
    detail = { target: [0, 0.005, 0.02], size: 0.06, azimuth: 30, elevation: 30 };
  } else if (has('spanschroef')) {
    const n = Math.max(1, Math.min(8, Math.round(Number(p.count ?? 5))));
    const rows = []; for (let k = 0; k < n; k++) rows.push([turnbuckle(mats.zinc)]);
    // alternate hook / eye ends
    rows.forEach((r, k) => { if (k % 2) xform(r[0], new THREE.Matrix4().makeRotationY(Math.PI)); });
    grid(B, rows, { gapV: 0.012 });
    view = { hero: { elevation: 44 } };
  } else if (has('schroefoog-elastiek')) {
    const cord = SG.rubberSG('#161616', { rough: 0.82 });
    const ballMat = SG.moulded('#161616', { rough: 0.36, spec: 0.55 });
    const rows = [];
    for (let k = 0; k < 3; k++) {
      const sub = new G.PartBin();
      // screw eye (eye at -X, gimlet point at +X), tilted up on the cord that runs under its eye
      const R = 0.0072, rw = 0.002, L = 0.04, rc = 0.003;
      const eb = new G.PartBin();
      const { yc } = K4.eyeBolt(eb, { metal: mats.zinc }, { R, d: 2 * rw, shank: L, thread: 0.0046, screw: true });
      const ex = -R - rw * 0.6, xw = ex - R;             // eye centre, far side of the ring
      const yw = rc + rc + rw + 0.0002;                  // ring wire centre on top of the cord
      const th = Math.asin((yw - yc) / (L - xw));
      xform(eb, new THREE.Matrix4().makeTranslation(-L, 0, 0).premultiply(new THREE.Matrix4().makeRotationZ(-th)).premultiply(new THREE.Matrix4().makeTranslation(L, 0, 0)));
      for (const [m, l] of eb.bins) for (const g of l) sub.add(m, g);
      // the bungee: its loop wraps round the far side of the ring wire, both strands run back to the ball
      const W = V3(xw * Math.cos(th) + 0, yw, 0); W.x = L - (L - xw) * Math.cos(th);
      const rho = rw + rc + 0.0003;
      const xb = W.x - 0.095 - k * 0.006;
      const around = [];
      for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 1.15; around.push(V3(W.x + Math.cos(a) * rho, W.y + Math.sin(a) * rho, 0)); }
      const ctrl = [
        V3(xb, rc, 0.0),
        V3(xb + 0.025, rc, 0.016), V3(W.x - 0.045, rc, 0.012), V3(W.x - 0.016, rc, 0.003),
        ...around,
        V3(W.x - 0.012, W.y + rho - 0.001, -0.002), V3(W.x - 0.03, rc + 0.003, -0.008), V3(W.x - 0.05, rc, -0.014), V3(xb + 0.025, rc, -0.015),
      ];
      const pts = K.smoothPath(ctrl, 160, true);
      sub.add(cord, K.tubeAlong(pts, rc, 12, { closed: true, up: V3(0, 1, 0) }));
      const ball = new THREE.SphereGeometry(0.0125, 32, 24); ball.translate(xb - 0.006, 0.0125, 0); sub.add(ballMat, ball);
      rows.push([sub]);
    }
    grid(B, rows, { gapV: 0.016 });
    view = { hero: { elevation: 42 } };
  } else if (has('oogbout-vleugelmoer')) {
    const rows = [];
    for (let r = 0; r < 5; r++) rows.push([eyeBolt(mats, { nut: true }), eyeBolt(mats, { nut: true })]);
    grid(B, rows, { gapU: 0.03, gapV: 0.01 });
    view = { hero: { elevation: 42 } };
  } else if (has('oogbout') && (has('vleugelmoer') || has('schroefoog'))) {
    const rows = [];
    for (let r = 0; r < 3; r++) rows.push([eyeBolt(mats, { nut: has('vleugelmoer') }), screwEye(mats)]);
    grid(B, rows, { gapU: 0.03, gapV: 0.012 });
    view = { hero: { elevation: 42 } };
  } else if (has('oogbout')) {
    scatter(B, () => eyeBolt(mats), 14, { rx: 0.1, rz: 0.08, seed: 9 });
    view = { hero: { elevation: 44 } };
  } else if (has('schroefoog')) {
    scatter(B, () => screwEye(mats), 16, { rx: 0.085, rz: 0.065, seed: 4 });
    view = { hero: { elevation: 44 } };
  } else {
    throw new Error(`fixings: unknown parts ${parts.join(',')}`);
  }
  const g = K.finish(B, `fixings ${parts.join('+')}`);
  return { object: g, detail, view, rig, meta: { parts } };
}
