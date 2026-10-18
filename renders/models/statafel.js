// Statafel (cocktail / standing table), height 110 cm, Ø60/70/80/85 cm.
//
// base: 'klap'   folding steel frame — central column, bottom hub with 4 (or 3) legs
//                and diagonal struts to a sliding collar; top folds on a hinge bracket
//       'kruis'  horeca: fixed flat 4-star base plate (cast aluminium/steel)
//       'rond'   horeca: fixed round steel base disc
// top:  'berken' | 'hout' (birch plywood 18 mm, lacquered, visible plies)
//       'hdpe' | 'hdpe-wit' | 'hdpe-grijs' (blow-moulded 45 mm, rounded rim)
//       'wit' | 'zwart' | 'antraciet' | 'houtlook' | 'graniet' (HPL / laminate; graniet = grey speckled stone look)
// shape: 'round' (default) | 'square' (width) | 'rect' (width x depth). Square tables stand on 4 splayed
//        square-tube legs ('stapel', stackable), rectangular ones on two folding leg frames.
// frame: 'zwart' | 'wit' | 'chroom' | 'alu' | 'antraciet'
// folded: true -> top flipped vertical, legs folded up along the column.
// noTop: true -> onderstel only (no blad; the cross bracket and hinge under the blad stay), for spare-part shots.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import { rng, makeNoise2 } from '../js/rng.js';

const LAMINATE = { wit: '#F2F2EE', zwart: '#1B1C1E', antraciet: '#3D4044', houtlook: '#8A6A48', graniet: '#FFFFFF' };
// Stone-look HPL (graniet): mid grey with fine dark and light speckles, as a colour map in metres (tile 0.25 m).
let _granite = null;
function graniteLaminate() {
  if (_granite) return _granite;
  const N = 512, R = rng(91), { noise } = makeNoise2(91);
  const d = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const v = 128 + Math.round(14 * noise((i % N) * 0.03, Math.floor(i / N) * 0.03));
    d[i * 4] = v; d[i * 4 + 1] = v - 2; d[i * 4 + 2] = v - 6; d[i * 4 + 3] = 255;
  }
  for (let k = 0; k < 9000; k++) {
    const x = Math.floor(R() * N), y = Math.floor(R() * N), r = R() < 0.85 ? 0 : 1;
    const v = R() < 0.55 ? 40 + R() * 40 : 190 + R() * 50;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      const o = (((y + yy + N) % N) * N + ((x + xx + N) % N)) * 4; d[o] = d[o + 1] = d[o + 2] = v;
    }
  }
  const map = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(4, 4); map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true;
  _granite = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', map, roughness: 0.42, specularIntensity: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.35, name: 'laminate graniet' });
  return _granite;
}
function topMaterial(top) {
  if (top === 'graniet') return graniteLaminate();
  return M.laminate(LAMINATE[top] || LAMINATE.wit);
}

const { V3 } = G;
const DEG = Math.PI / 180;

export function statafelDims(p = {}) {
  let D = Number(p.diameter ?? p.d ?? 0.8);
  if (D > 5) D /= 100; // accept cm
  const H = Number(p.height ?? 1.10) > 5 ? Number(p.height) / 100 : Number(p.height ?? 1.10);
  const top = (p.top || 'berken').toLowerCase();
  const T = top.startsWith('hdpe') ? 0.045 : 0.018;
  const base = (p.base || 'klap').toLowerCase();
  const nLegs = Number(p.legs ?? 4);
  const footR = base === 'klap' ? Math.min(0.40, 0.36 * (D / 0.8) ** 0.5) : base === 'kruis' ? 0.30 : 0.23;
  const footAngle = Number(p.footAngle ?? 45) * DEG;
  const feet = [];
  for (let i = 0; i < nLegs; i++) { const a = footAngle + (i / nLegs) * Math.PI * 2; feet.push([Math.sin(a) * footR, Math.cos(a) * footR, a]); }
  return { D, R: D / 2, H, T, top, base, nLegs, footR, footAngle, feet, colR: 0.025, hubY: 0.085, collarY: 0.44 };
}

function frameMaterial(frame) {
  const f = (frame || 'zwart').toLowerCase();
  if (f === 'chroom' || f === 'chrome' || f === 'rvs') return M.chrome();
  if (f === 'alu' || f === 'aluminium') return M.aluminium({ roughness: 0.28 });
  if (f === 'wit' || f === 'white') return M.steelPowder('#ECECE8', { roughness: 0.4 });
  if (f === 'antraciet') return M.steelPowder('#3B3E42');
  return M.steelPowder('#1C1D1F');
}

export function statafel(p = {}) {
  const shape = (p.shape || 'round').toLowerCase();
  if (shape === 'square' || shape === 'rect') return statafelSquare(p, shape);
  const S = statafelDims(p);
  const { R, H, T, top } = S;
  const folded = !!p.folded;
  const frame = frameMaterial(p.frame);
  const black = M.nylon('#141414');
  const rubber = M.rubber('#151515');
  const group = new THREE.Group();
  group.name = `statafel Ø${Math.round(S.D * 100)} ${top} ${p.frame || 'zwart'}${folded ? ' folded' : ''}`;
  const bins = new G.PartBin();

  // ---------------- top (built flat, centred at origin, top surface at y = 0) ---------
  const topGroup = new THREE.Group();
  const topBins = new G.PartBin();
  if (p.noTop) {
    // onderstel only (spare-part shot): no blad, the cross bracket and hinge stay
  } else if (top.startsWith('hdpe')) {
    const col = top.includes('grijs') ? '#9C9EA0' : top.includes('zwart') ? '#232426' : '#F0F0EC';
    const mat = M.hdpe(col);
    const r = 0.011;
    const prof = [[0.0, 0], [R - r, 0]];
    for (let i = 1; i <= 6; i++) { const a = (Math.PI / 2) * (1 - i / 6); prof.push([R - r + Math.cos(a) * r, -r + Math.sin(a) * r]); }
    prof.push([R - 0.0015, -T + 0.008], [R - 0.004, -T + 0.002], [R - 0.012, -T], [R - 0.03, -T], [R - 0.034, -T + 0.012], [0.05, -T + 0.012]);
    const g = G.lathe(prof.map(([x, y]) => [x, y]).reverse(), 128);
    topBins.add(mat, g);
    // moulded underside ribs (visible from low angles)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      const v = V3(Math.cos(a), 0, Math.sin(a));
      topBins.add(mat, G.flatBar(v.clone().multiplyScalar(-(R - 0.04)).setY(-T + 0.012), v.clone().multiplyScalar(R - 0.04).setY(-T + 0.012), 0.012, 0.016, V3(0, 1, 0).cross(v).normalize()));
    }
  } else if (LAMINATE[top]) {
    const face = topMaterial(top);
    const edge = top === 'graniet' ? M.laminate('#5E5B56') : M.laminate(top === 'wit' ? '#EDEDE8' : LAMINATE[top]);
    const f1 = G.prism(G.circleProfile(R - 0.002, 128), V3(0, -0.0005, 0), V3(0, 0, 0)); planarUv(f1);
    const f2 = G.prism(G.circleProfile(R - 0.002, 128), V3(0, -T, 0), V3(0, -T + 0.0005, 0)); planarUv(f2);
    topBins.add(face, f1); topBins.add(face, f2);
    topBins.add(edge, roundedDiscEdge(R, T, 0.002));
  } else {
    // birch plywood: faces + ply edge with small radius
    const face = M.birchFace();
    const edge = M.birchEdge();
    const disc = G.prism(G.circleProfile(R - 0.0025, 128), V3(0, -T + 0.0005, 0), V3(0, -0.0, 0), { caps: true });
    // uv for faces: planar in metres
    planarUv(disc);
    topBins.add(face, disc);
    topBins.add(edge, roundedDiscEdge(R, T, 0.0025));
  }
  // steel cross bracket + hinge plate under the top
  const by = -T - 0.004;
  const brW = R * 1.25;
  for (const a of [45, 135]) {
    const v = V3(Math.sin(a * DEG), 0, Math.cos(a * DEG));
    topBins.add(frame, G.flatBar(v.clone().multiplyScalar(-brW / 2).setY(by), v.clone().multiplyScalar(brW / 2).setY(by), 0.035, 0.006, V3(0, 1, 0).cross(v).normalize()));
  }
  const plate = G.roundedBox(0.15, 0.006, 0.15, 0.003); plate.translate(0, by - 0.006, 0); topBins.add(frame, plate);
  // hinge cheeks
  for (const s of [-1, 1]) {
    const ch = G.roundedBox(0.006, 0.05, 0.07, 0.002); ch.translate(s * 0.032, by - 0.032, 0); topBins.add(frame, ch);
  }
  topBins.add(M.chrome(), G.tube(V3(-0.04, by - 0.042, 0), V3(0.04, by - 0.042, 0), 0.006, 12));
  // locking knob
  topBins.add(black, G.tube(V3(0.035, by - 0.042, 0), V3(0.062, by - 0.042, 0), 0.012, 16));
  topBins.build(topGroup);

  const hingeY = H - T - 0.046; // hinge pin height (top surface at H when unfolded)
  if (!folded) {
    topGroup.position.set(0, H, 0);
  } else {
    // rotate about the hinge pin (X axis) so the top stands vertical, face to the front
    const pivot = new THREE.Group(); pivot.position.set(0, hingeY, 0);
    topGroup.position.set(0, H - hingeY, 0);
    pivot.add(topGroup); pivot.rotation.x = Math.PI / 2;
    group.add(pivot);
  }
  if (!folded) group.add(topGroup);

  // ---------------- column + hinge head --------------------------------------------
  const colTop = hingeY - 0.02;
  const colBot = S.base === 'klap' ? S.hubY - 0.03 : 0.012;
  bins.add(frame, G.tube(V3(0, colBot, 0), V3(0, colTop, 0), S.colR, 32));
  // head piece
  bins.add(frame, G.roundedBox(0.056, 0.05, 0.05, 0.004).translate(0, colTop + 0.012, 0));
  // end cap
  bins.add(black, G.tube(V3(0, colBot - 0.012, 0), V3(0, colBot + 0.002, 0), S.colR + 0.002, 32));

  // ---------------- base -------------------------------------------------------------
  if (S.base === 'klap') {
    const hubY = S.hubY;
    bins.add(frame, G.tube(V3(0, hubY - 0.035, 0), V3(0, hubY + 0.03, 0), S.colR + 0.009, 32));
    const legLen = S.footR - 0.045;
    // folded: legs swing up along the column
    const legAng0 = -6.5 * DEG;
    const legAng = folded ? 84 * DEG : legAng0; // angle above horizontal
    const strutAt = 0.48; // fraction along the leg where the strut attaches
    for (const [fx, fz, a] of S.feet) {
      const out = V3(Math.sin(a), 0, Math.cos(a));
      const side = V3(0, 1, 0).cross(out).normalize();
      const pivot = out.clone().multiplyScalar(S.colR + 0.018).setY(hubY);
      const dir = out.clone().multiplyScalar(Math.cos(legAng)).setY(Math.sin(legAng));
      const tip = pivot.clone().addScaledVector(dir, legLen);
      // lug on hub
      bins.add(frame, G.roundedBox(0.03, 0.03, 0.03, 0.004).applyMatrix4(new THREE.Matrix4().makeBasis(side, V3(0, 1, 0), out).setPosition(out.clone().multiplyScalar(S.colR + 0.01).setY(hubY))));
      // leg: oval tube
      bins.add(frame, G.prism(G.roundedRectProfile(0.016, 0.03, 0.0075, 4), pivot, tip, { side: out.clone().cross(dir).normalize() }));
      // foot cap (plastic glide), shaped like a shoe under the tip
      const footC = tip.clone().addScaledVector(dir, 0.012);
      const foot = G.roundedBox(0.028, 0.036, 0.058, 0.011);
      const fb = new THREE.Matrix4().makeBasis(side, V3(0, 1, 0), out);
      foot.applyMatrix4(fb);
      if (!folded) { foot.translate(footC.x, 0.018, footC.z); } else { foot.applyMatrix4(new THREE.Matrix4().makeRotationAxis(side, -(legAng - legAng0))); foot.translate(footC.x, footC.y, footC.z); }
      bins.add(rubber, foot);
      // strut from leg to sliding collar
      const sp = pivot.clone().addScaledVector(dir, legLen * strutAt);
      const strutLen = Math.hypot(S.colR + 0.018 + legLen * strutAt * Math.cos(legAng0) - (S.colR + 0.02), (S.collarY - hubY) - legLen * strutAt * Math.sin(legAng0));
      const dr = sp.clone().setY(0).length() - (S.colR + 0.02);
      const collarY = sp.y + Math.sqrt(Math.max(0, strutLen * strutLen - dr * dr));
      const cp = out.clone().multiplyScalar(S.colR + 0.02).setY(collarY);
      bins.add(frame, G.tube(sp.clone().addScaledVector(side, 0), cp, 0.0075, 14));
      bins.add(M.chrome(), G.tube(sp.clone().addScaledVector(side, -0.012), sp.clone().addScaledVector(side, 0.012), 0.004, 10));
      S._collarY = collarY;
    }
    const cy = S._collarY;
    bins.add(frame, G.tube(V3(0, cy - 0.03, 0), V3(0, cy + 0.03, 0), S.colR + 0.008, 32));
    // locking knob on the collar
    const ka = S.footAngle + Math.PI / S.nLegs;
    const kv = V3(Math.sin(ka), 0, Math.cos(ka));
    bins.add(black, G.tube(kv.clone().multiplyScalar(S.colR + 0.006).setY(cy), kv.clone().multiplyScalar(S.colR + 0.03).setY(cy), 0.004, 10));
    bins.add(black, G.lathe([[0.0001, 0.012], [0.012, 0.012], [0.014, 0.0], [0.0001, 0.0]].reverse(), 18).applyMatrix4(new THREE.Matrix4().makeBasis(V3(0, 1, 0).cross(kv).normalize(), kv, V3(0, 1, 0).cross(kv).normalize().cross(kv)).setPosition(kv.clone().multiplyScalar(S.colR + 0.028).setY(cy))));
  } else if (S.base === 'kruis') {
    // flat cast 4-star base with levelling glides
    const hubR = 0.06;
    bins.add(frame, G.lathe([[0.0001, 0.07], [S.colR + 0.006, 0.07], [hubR * 0.7, 0.045], [hubR, 0.012], [hubR, 0.0], [0.0001, 0.0]].reverse(), 48));
    for (const [, , a] of S.feet) {
      const out = V3(Math.sin(a), 0, Math.cos(a));
      const side = V3(0, 1, 0).cross(out).normalize();
      bins.add(frame, G.prism(G.roundedRectProfile(0.05, 0.022, 0.008, 3), out.clone().multiplyScalar(0.03).setY(0.026), out.clone().multiplyScalar(S.footR - 0.02).setY(0.018), { side }));
      const g = out.clone().multiplyScalar(S.footR - 0.03);
      bins.add(rubber, G.tube(g.clone().setY(0.0), g.clone().setY(0.01), 0.018, 18));
    }
  } else {
    // round base disc
    bins.add(frame, G.lathe([[0.0001, 0.0], [S.footR - 0.006, 0.0], [S.footR, 0.004], [S.footR - 0.004, 0.012], [S.colR + 0.04, 0.02], [S.colR + 0.006, 0.05], [0.0001, 0.05]], 96));
  }

  bins.build(group);
  if (folded) {
    // stand the folded table on its lowest point
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    group.children.forEach((c) => { c.position.y -= box.min.y; });
  }
  return {
    object: group,
    dims: S,
    detail: folded
      ? { target: [0, H * 0.62, 0.05], size: 0.75, azimuth: 30, elevation: 10 }
      : { target: [Math.sin(34 * DEG) * R * 0.75, H - 0.08, Math.cos(34 * DEG) * R * 0.75], size: 0.5, azimuth: 34, elevation: 16 },
    meta: { D: S.D, H, top, base: S.base, folded },
    view: folded ? { hero: { azimuth: 56, elevation: 12 } } : undefined,
  };
}

// Outer edge band of a disc (from y = -T to 0) with rounded arrises of radius r.
function roundedDiscEdge(R, T, r) {
  const prof = [];
  const seg = 4;
  for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / seg); prof.push([R - r + Math.cos(a) * r, -T + r + Math.sin(a) * r]); }
  for (let i = 0; i <= seg; i++) { const a = (Math.PI / 2) * (i / seg); prof.push([R - r + Math.cos(a) * r, -r + Math.sin(a) * r]); }
  const g = G.lathe(prof, 128);
  // uv: u around (metres), v across thickness 0..1
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getX(i), pos.getZ(i));
    uv.setXY(i, (ang + Math.PI) * R, (pos.getY(i) + T) / T);
  }
  return g;
}

function planarUv(g) {
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) + 0.5, pos.getZ(i) + 0.5);
}


// ---------------------------------------------------------------------------------------
// Square (stackable, 4 splayed square-tube legs) and rectangular (two folding leg frames) statafels.
function statafelSquare(p, shape) {
  const W = Number(p.width ?? 0.7) > 5 ? Number(p.width) / 100 : Number(p.width ?? 0.7);
  const Dp = shape === 'rect' ? (Number(p.depth ?? 0.6) > 5 ? Number(p.depth) / 100 : Number(p.depth ?? 0.6)) : W;
  const H = Number(p.height ?? 1.1) > 5 ? Number(p.height) / 100 : Number(p.height ?? 1.1);
  const top = (p.top || 'zwart').toLowerCase();
  const T = top === 'berken' || top === 'hout' ? 0.018 : 0.012;   // compact HPL 12 mm, birch ply 18 mm
  const frame = frameMaterial(p.frame);
  const glide = M.rubber('#151515');
  const group = new THREE.Group();
  group.name = `statafel ${shape} ${Math.round(W * 100)}x${Math.round(Dp * 100)} ${top}`;
  const bins = new G.PartBin();
  const r = 0.004;
  // top slab
  const slab = G.roundedBox(W, T, Dp, r);
  slab.translate(0, H - T / 2, 0);
  planarUv(slab);
  if (top === 'berken' || top === 'hout') bins.add(M.birchFace(), slab);
  else bins.add(topMaterial(top), slab);
  const tube = (a, b, w = 0.03) => G.prism(G.roundedRectProfile(w, w, 0.003, 2), a, b, { side: V3(0, 0, 1).cross(b.clone().sub(a).normalize()).lengthSq() > 1e-6 ? V3(0, 0, 1) : V3(1, 0, 0) });
  const yU = H - T - 0.002;
  if (shape === 'square') {
    // apron frame under the top + 4 legs splaying outward (stackable: the next table's legs slide outside these)
    const ix = W / 2 - 0.05, iz = Dp / 2 - 0.05;
    const corners = [[ix, iz], [-ix, iz], [-ix, -iz], [ix, -iz]];
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = corners[i], [x1, z1] = corners[(i + 1) % 4];
      bins.add(frame, G.prism(G.roundedRectProfile(0.02, 0.04, 0.003, 2), V3(x0, yU - 0.02, z0), V3(x1, yU - 0.02, z1), { side: V3(0, 1, 0) }));
    }
    const splay = 0.07;
    for (const [x, z] of corners) {
      const a = V3(x, yU, z), b = V3(x + Math.sign(x) * splay, 0.012, z + Math.sign(z) * splay);
      bins.add(frame, G.prism(G.roundedRectProfile(0.03, 0.03, 0.003, 2), a, b, { side: V3(1, 0, 0) }));
      bins.add(glide, G.roundedBox(0.034, 0.012, 0.034, 0.003).translate(b.x, 0.006, b.z));
    }
  } else {
    // two folding leg frames near the ends: two uprights, a foot bar on the floor and a rail under the top
    const fx = W / 2 - 0.12, fz = Dp / 2 - 0.07;
    for (const sx of [-1, 1]) {
      const x = sx * fx;
      for (const sz of [-1, 1]) bins.add(frame, G.tube(V3(x, 0.03, sz * fz), V3(x, yU, sz * fz), 0.016, 20));
      bins.add(frame, G.prism(G.roundedRectProfile(0.04, 0.03, 0.004, 2), V3(x, 0.018, -(Dp / 2 - 0.02)), V3(x, 0.018, Dp / 2 - 0.02), { side: V3(1, 0, 0) }));
      bins.add(frame, G.prism(G.roundedRectProfile(0.03, 0.03, 0.003, 2), V3(x, yU - 0.015, -fz), V3(x, yU - 0.015, fz), { side: V3(1, 0, 0) }));
      for (const sz of [-1, 1]) bins.add(glide, G.roundedBox(0.05, 0.008, 0.04, 0.003).translate(x, 0.004, sz * (Dp / 2 - 0.04)));
    }
    // folding brace between the frames
    bins.add(frame, G.tube(V3(-fx, 0.45, 0), V3(fx, 0.45, 0), 0.011, 16));
  }
  bins.build(group);
  const R = Math.max(W, Dp) / 2;
  return {
    object: group,
    dims: { W, D: Dp, H, top, shape },
    detail: { target: [W / 2 - 0.05, H - 0.04, Dp / 2 - 0.05], size: 0.45, azimuth: 34, elevation: 16 },
    meta: { W, D: Dp, H, top, shape, R },
  };
}
