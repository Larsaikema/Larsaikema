// Biertafelset (Bierzeltgarnitur): 1 table + 2 benches.
//
// { length, tableWidth, frame, only, height }
//   length      2.2 (default) / 2.0 / 1.8 m
//   tableWidth  0.5 (default) or 0.7 m (breed blad); benches 0.25 m
//   frame       'galv' (verzinkt, default) | colour name (powder coat)
//   only        'tafel' | 'bank' -> a single piece
//
// Construction (as built by the German/Dutch makers): tops of glued solid spruce
// (vurenhout) lamellas, 25 mm (table) / 28 mm (bench), clear lacquered, slightly rounded
// arrises; two longitudinal battens under the table top; per leg a pressed-steel hinge
// bracket screwed across the underside. Legs: Ø25 steel tube bent to a trapezoid frame
// (hinge axle on top, foot tube on the floor with plastic feet), a cross tube and a flat
// steel folding brace running from the cross tube to a bracket towards the centre.
// Table 76 cm, benches 47 cm high.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as F from '../js/furniture.js';
import * as S from '../js/seatKit.js';
import { rng } from '../js/rng.js';

const { V3 } = G;

// One top made of lamellas along x. Returns the lamella geometries per material bin.
function lamellaTop(bins, L, W, T, y, z0, wood, { n = null, seed = 1 } = {}) {
  const R = rng(seed);
  const count = n || Math.max(2, Math.round(W / 0.085));
  const lw = W / count;
  for (let i = 0; i < count; i++) {
    const z = z0 - W / 2 + lw * (i + 0.5);
    const edgeR = 0.004;
    const g = F.cushion(L, T, lw - 0.0004, { r: edgeR, puff: 0, seg: [36, 4, 6] });
    F.uvGrain(g, 'x', { offset: R() * 3 });
    // shift the texture across per lamella (a different board), flip every other one
    const uv = g.attributes.uv;
    const off = R() * 0.25, flip = i % 2 ? -1 : 1;
    for (let k = 0; k < uv.count; k++) uv.setY(k, uv.getY(k) * flip + off + i * 0.11);
    g.translate(0, y - T / 2, z);
    bins.add(wood, g);
  }
}

// Folding trapezoid leg with hinge axle, cross tube and brace. x: leg plane, inward: +1/-1 (towards centre)
function legFrame(bins, mats, { x, inward, yTop, zTop, zFoot, yCross, braceTo }) {
  const r = 0.0125;
  const yf = 0.018 + r;
  const pts = [V3(x, yTop, 0), V3(x, yTop, zTop), V3(x, yf, zFoot), V3(x, yf, -zFoot), V3(x, yTop, -zTop), V3(x, yTop, 0.0001)];
  bins.add(mats.steel, F.sweep(F.filletPath(pts, 0.035, 8), G.circleProfile(r, 16)));
  // plastic feet under the foot tube
  for (const s of [-1, 1]) bins.add(mats.cap, F.cushion(0.05, 0.02, 0.034, { r: 0.007, puff: 0, seg: [6, 4, 6] }).translate(x, 0.01, s * (zFoot - 0.03)));
  // cross tube
  const zc = zFoot + (zTop - zFoot) * (yCross - yf) / (yTop - yf);
  bins.add(mats.steel, G.tube(V3(x, yCross, -zc), V3(x, yCross, zc), 0.009, 12));
  // folding brace: flat bar from the cross tube up to the brace bracket, with a hinge knuckle
  const a = V3(x, yCross, 0), b = V3(braceTo, yTop + 0.012, 0);
  const mid = a.clone().lerp(b, 0.45);
  bins.add(mats.steel, G.flatBar(a, mid, 0.028, 0.004, V3(0, 0, 1)));
  bins.add(mats.steel, G.flatBar(mid, b, 0.028, 0.004, V3(0, 0, 1)));
  bins.add(mats.steel, G.tube(mid.clone().setZ(-0.02), mid.clone().setZ(0.02), 0.007, 12));
  bins.add(mats.lever, G.roundedBox(0.07, 0.012, 0.03, 0.004).translate(mid.x + inward * 0.03, mid.y + 0.016, 0));
  // bracket for the brace under the top
  bins.add(mats.steel, G.roundedBox(0.06, 0.02, 0.05, 0.002).translate(braceTo, yTop + 0.018, 0));
}

function table(bins, mats, L, W, H, z0) {
  const T = 0.025;
  lamellaTop(bins, L, W, T, H, z0, mats.wood, { seed: 7 });
  const yU = H - T;
  // longitudinal battens under the long edges
  for (const s of [-1, 1]) {
    const g = F.cushion(L - 0.06, 0.022, 0.045, { r: 0.004, puff: 0, seg: [24, 3, 4] });
    F.uvGrain(g, 'x', { offset: 1.3 + s });
    bins.add(mats.wood, g.translate(0, yU - 0.011, z0 + s * (W / 2 - 0.05)));
  }
  const xl = L / 2 - 0.2;
  for (const s of [-1, 1]) {
    // hinge bracket: pressed U-channel across the width, screwed into the battens
    const x = s * xl;
    bins.add(mats.steel, G.prism(G.roundedRectProfile(0.05, 0.004, 0.0015, 2), V3(x, yU - 0.002, z0 - W / 2 + 0.03), V3(x, yU - 0.002, z0 + W / 2 - 0.03), { side: V3(1, 0, 0) }));
    for (const sx of [-1, 1]) bins.add(mats.steel, G.prism(G.roundedRectProfile(0.004, 0.034, 0.0015, 2), V3(x + sx * 0.023, yU - 0.019, z0 - W / 2 + 0.03), V3(x + sx * 0.023, yU - 0.019, z0 + W / 2 - 0.03), { side: V3(1, 0, 0) }));
    const legW = W / 2 - 0.07;
    const g = new G.PartBin();
    legFrame(g, mats, { x: 0, inward: -s, yTop: yU - 0.03, zTop: legW, zFoot: legW + 0.04, yCross: 0.36, braceTo: -s * 0.5 });
    for (const [mat, list] of g.bins) for (const geo of list) bins.add(mat, geo.translate(x, 0, z0));
  }
}

function bench(bins, mats, L, W, H, z0) {
  const T = 0.028;
  lamellaTop(bins, L, W, T, H, z0, mats.wood, { n: 2, seed: 13 + Math.round(z0 * 10) });
  const yU = H - T;
  // central batten under the bench top
  const gb = F.cushion(L - 0.1, 0.02, 0.05, { r: 0.004, puff: 0, seg: [24, 3, 4] });
  F.uvGrain(gb, 'x', { offset: 2.2 });
  bins.add(mats.wood, gb.translate(0, yU - 0.01, z0));
  const xl = L / 2 - 0.18;
  for (const s of [-1, 1]) {
    const x = s * xl;
    bins.add(mats.steel, G.prism(G.roundedRectProfile(0.05, 0.004, 0.0015, 2), V3(x, yU - 0.002, z0 - W / 2 + 0.02), V3(x, yU - 0.002, z0 + W / 2 - 0.02), { side: V3(1, 0, 0) }));
    const g = new G.PartBin();
    legFrame(g, mats, { x: 0, inward: -s, yTop: yU - 0.024, zTop: W / 2 - 0.045, zFoot: 0.17, yCross: 0.2, braceTo: -s * 0.36 });
    for (const [mat, list] of g.bins) for (const geo of list) bins.add(mat, geo.translate(x, 0, z0));
  }
}

export function biertafelset(p = {}) {
  let L = Number(p.length ?? 2.2); if (L > 10) L /= 100;
  let TW = Number(p.tableWidth ?? p.width ?? 0.5); if (TW > 5) TW /= 100;
  const only = p.only ? String(p.only).toLowerCase() : null;
  const frame = String(p.frame || 'galv').toLowerCase();
  const mats = {
    wood: S.woodMat('vuren', { seed: 5 }),
    steel: frame === 'galv' || frame === 'verzinkt' ? M.galvanised() : F.powder(frame),
    cap: F.plastic('#1B1B1B', 0.6),
    lever: F.plastic('#C8C9C6', 0.45),
  };
  const bins = new G.PartBin();
  const HT = Number(p.height ?? 0.76), HB = 0.47;
  const gap = TW / 2 + 0.29;
  if (only === 'bank' || only === 'bench') bench(bins, mats, L, 0.25, HB, 0);
  else if (only === 'tafel' || only === 'table') table(bins, mats, L, TW, HT, 0);
  else {
    table(bins, mats, L, TW, HT, 0);
    bench(bins, mats, L, 0.25, HB, gap);
    bench(bins, mats, L, 0.25, HB, -gap);
  }
  const group = new THREE.Group(); group.name = `biertafelset ${L}x${TW}${only ? ' ' + only : ''}`;
  bins.build(group);
  const single = only === 'bank' || only === 'bench';
  return {
    object: group,
    detail: { target: [L / 2 - 0.2, (single ? HB : HT) - 0.15, single ? 0.05 : TW / 2], size: 0.55, azimuth: 40, elevation: 12 },
    meta: { L, TW, only },
    rig: S.seatRig(group, { default: { groundAO: { maxZenith: 55 } } }),
  };
}
