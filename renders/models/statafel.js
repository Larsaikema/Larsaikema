// Statafel (cocktail / standing table), height 110 cm, Ø60/70/80/85 cm.
//
// base: 'klap'   folding steel frame — central column, bottom hub with 4 (or 3) legs
//                and diagonal struts to a sliding collar; top folds on a hinge bracket
//       'kruis'  horeca: fixed flat 4-star base plate (cast aluminium/steel)
//       'rond'   horeca: fixed round steel base disc
// top:  'berken' | 'hout' (birch plywood 18 mm, lacquered, visible plies)
//       'hdpe' | 'hdpe-wit' | 'hdpe-grijs' (blow-moulded 45 mm, rounded rim)
//       'wit' | 'zwart' (laminated board)
// frame: 'zwart' | 'wit' | 'chroom' | 'alu' | 'antraciet'
// folded: true -> top flipped vertical, legs folded up along the column.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';

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
  if (top.startsWith('hdpe')) {
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
  } else if (top === 'wit' || top === 'zwart') {
    const face = M.laminate(top === 'wit' ? '#F2F2EE' : '#1B1C1E');
    const edge = M.laminate(top === 'wit' ? '#EDEDE8' : '#151617');
    topBins.add(face, G.prism(G.circleProfile(R - 0.002, 128), V3(0, -0.0005, 0), V3(0, 0, 0)));
    topBins.add(face, G.prism(G.circleProfile(R - 0.002, 128), V3(0, -T, 0), V3(0, -T + 0.0005, 0)));
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
