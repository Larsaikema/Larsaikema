// Buizenframe partytent (PE / PVC party tent with a steel tube frame), opslagtent variant.
//
// Construction (classic 4 m span party tents, 2 m bays):
//  - galvanised steel tubes (PE Basis 32 mm, PVC 38 mm) pushed into welded connectors: legs
//    every 2 m on both long sides, eave tubes, a rafter pair per leg pair up to a ridge tube,
//    a gable pole in the middle of each closed gable, knee braces from the legs to the rafters,
//    foot plates; storage tents get an eave-level tie over the door gable;
//  - one roof cover with closed gable triangles: it lies on the rafters and sags a little
//    between them (PE more than PVC), rolls over the eave tubes into a short valance flap;
//  - side walls per bay hung from the eave tubes, hem resting on the ground: PE with two
//    church windows (arched top, cross bar), PVC with one wide window with two bars, a zipped
//    door bay in the front long side (`door: 'open'` rolls it up), storage tents a full-width
//    roll-up door in the front gable;
//  - `frame: false` shows the roof cover on its own (sold separately), in its pitched shape.
//
//   { w (span), d (length), line: 'pe'|'pvc', color, walls: 'windows'|'closed'|'none',
//     door: 'closed'|'open'|'rolled', variant: 'party'|'opslag', frame: bool }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';

const { V3 } = K;

export function buildFrameTent(o) {
  const {
    span: W, length: L, eave: He, ridge: Hr, line = 'pvc', color = 'wit', walls = 'none', door = 'closed',
    gableFront = false, frame = true, bay: bayWanted = 2, frontGableDoor = false, ties = false, valance = 0.17,
  } = o;
  const hex = K.col(color, M.COLORS.wit);
  const pe = line === 'pe';
  const fab = pe ? K.peFabric(hex) : K.pvc(hex);
  const thread = M.tentThread(hex);
  const steel = M.galvanised();
  const clear = M.pvcWindow();
  const tapeMat = pe ? K.peFabric(hex) : K.pvcPatch(hex);
  const zipM = M.zipTooth('#1A1A1B');
  const strapM = M.webbing('#1A1A1B');
  const bins = new G.PartBin();
  const inner = new THREE.Group();
  const r = pe ? 0.016 : 0.019, c = 0.01;
  const nb = Math.max(1, Math.round(L / bayWanted)), bay = L / nb;
  const xs = []; for (let i = 0; i <= nb; i++) xs.push(-L / 2 + i * bay);
  const hw = W / 2, rise = Hr - He;
  const roofY = (z) => He + r + c + rise * (1 - Math.abs(z) / hw); // cloth on the rafters

  // ---- frame ---------------------------------------------------------------------------------
  if (frame) {
    const T = (a, b, rr = r) => bins.add(steel, G.tube(a, b, rr, 14));
    const sleeve = (a, dir, len = 0.11) => bins.add(steel, G.tube(a, a.clone().addScaledVector(dir, len), r * 1.32, 14, { caps: true }));
    for (const x of xs) {
      for (const sz of [-1, 1]) {
        const top = V3(x, He, sz * hw);
        T(V3(x, 0.01, sz * hw), top);
        bins.add(steel, K.footPlate(x, sz * hw, 0.12, 0.006));
        // rafter to the ridge
        const rt = V3(x, Hr, 0);
        T(top, rt);
        const rd = rt.clone().sub(top).normalize();
        sleeve(top, rd); sleeve(top, V3(0, -1, 0));
        sleeve(rt, rd.clone().negate());
        // knee brace
        const kb0 = V3(x, He - 0.42, sz * hw), kb1 = top.clone().addScaledVector(rd, 0.55);
        T(kb0, kb1, r * 0.75);
      }
      if (ties) T(V3(x, He - 0.01, -hw), V3(x, He - 0.01, hw), r * 0.9);
    }
    // eave and ridge tubes
    for (const sz of [-1, 1]) T(V3(-L / 2, He, sz * hw), V3(L / 2, He, sz * hw));
    T(V3(-L / 2, Hr, 0), V3(L / 2, Hr, 0));
    // gable poles (not in a door gable)
    for (const sx of [-1, 1]) {
      if (frontGableDoor && sx < 0) { T(V3(sx * L / 2, He - 0.02, -hw), V3(sx * L / 2, He - 0.02, hw), r * 0.95); continue; }
      if (W >= 3.9) { T(V3(sx * L / 2, 0.01, 0), V3(sx * L / 2, Hr, 0)); bins.add(steel, K.footPlate(sx * L / 2, 0, 0.12, 0.006)); }
    }
  }

  // ---- roof cover ------------------------------------------------------------------------------
  const sagA = pe ? 0.035 : 0.022;
  const xe = L / 2 + r + c; // gable cloth plane
  const sag = (x, z) => {
    const fx = ((x + L / 2) / bay) % 1, fu = 1 - Math.abs(z) / hw;
    const inBay = Math.abs(x) < L / 2 ? Math.sin(Math.PI * Math.min(1, Math.max(0, fx))) : 0;
    return sagA * inBay * Math.sin(Math.PI * Math.min(1, Math.max(0, fu)));
  };
  const NX = Math.max(40, nb * 24), NZ = 26, NB = 8, NV = 5;
  // one slope: rows along x, from the hem of the valance over the eave roll up to the ridge
  for (const sz of [-1, 1]) {
    const rows = [];
    for (let j = 0; j <= NV + NB + NZ; j++) {
      const row = [];
      for (let i = 0; i <= NX; i++) {
        const x = -xe + (2 * xe * i) / NX;
        let q;
        if (j <= NV) {
          const f = j / NV, y = He - valance + (He - (He - valance)) * f;
          const wave = 0.006 * Math.sin(x * 4.1 + sz) * (1 - f);
          q = V3(x, y, sz * (hw + r + c + wave));
        } else if (j <= NV + NB) {
          const b = ((j - NV) / NB) * (Math.PI / 2);
          q = V3(x, He + (r + c) * Math.sin(b), sz * (hw + (r + c) * Math.cos(b)));
        } else {
          const f = (j - NV - NB) / NZ;
          const z = sz * hw * (1 - f);
          q = V3(x, roofY(z) - sag(x, z), z);
        }
        row.push(q);
      }
      rows.push(row);
    }
    bins.add(fab, K.gridGeometry(rows));
    // valance hem
    bins.add(fab, K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.004, 0))), 0.005, 5));
    bins.add(thread, K.sweep(rows[0].map((q) => q.clone().add(V3(0, 0.022, sz * 0.0025))), 0.0011, 4));
  }
  // gable triangles (part of the cover), with the bottom flap continuing the valance line
  for (const sx of [-1, 1]) {
    const rows = [];
    const NG = 40, NH = 30;
    for (let j = 0; j <= NH; j++) {
      const f = j / NH, row = [];
      for (let i = 0; i <= NG; i++) {
        const z = -hw - r - c + ((2 * (hw + r + c)) * i) / NG;
        const yTop = Math.min(roofY(Math.max(-hw, Math.min(hw, z))), He + r + c) + Math.max(0, roofY(Math.max(-hw, Math.min(hw, z))) - (He + r + c));
        const y0 = He - valance;
        const y = y0 + (yTop - y0) * f;
        const bulge = 0.012 * Math.sin(Math.PI * i / NG) * Math.sin(Math.PI * f);
        row.push(V3(sx * (xe + bulge), y, z));
      }
      rows.push(row);
    }
    bins.add(fab, K.gridGeometry(rows));
  }
  // ridge seam
  const ridge = []; for (let i = 0; i <= 40; i++) ridge.push(V3(-xe + (2 * xe * i) / 40, Hr + r + c + 0.002, 0));
  bins.add(tapeMat, K.sweep(ridge, 0.009, 6));

  // ---- walls -----------------------------------------------------------------------------------
  const wallType = walls === true ? 'closed' : walls;
  const panels = [];
  if (wallType && wallType !== 'none' && frame) {
    const doorBay = Math.min(nb - 1, Math.floor(nb / 2));
    for (let i = 0; i < nb; i++) {
      for (const sz of [-1, 1]) {
        const isDoor = !frontGableDoor && sz > 0 && i === doorBay;
        panels.push({ a: V3(xs[i], 0, sz * (hw + r + 0.012)), b: V3(xs[i + 1], 0, sz * (hw + r + 0.012)), out: V3(0, 0, sz), type: isDoor ? 'door' : wallType });
      }
    }
    for (const sx of [-1, 1]) {
      const gx = sx * (L / 2 + r + 0.012);
      if (frontGableDoor && sx < 0) { panels.push({ a: V3(gx, 0, hw), b: V3(gx, 0, -hw), out: V3(sx, 0, 0), type: 'gabledoor' }); continue; }
      if (W >= 3.9) {
        panels.push({ a: V3(gx, 0, hw), b: V3(gx, 0, 0), out: V3(sx, 0, 0), type: wallType });
        panels.push({ a: V3(gx, 0, 0), b: V3(gx, 0, -hw), out: V3(sx, 0, 0), type: wallType });
      } else panels.push({ a: V3(gx, 0, hw), b: V3(gx, 0, -hw), out: V3(sx, 0, 0), type: wallType });
    }
  }
  const wallTop = He - 0.04;
  for (const pn of panels) buildPanel(pn);
  function buildPanel({ a, b, out, type }) {
    const len = a.distanceTo(b);
    const along = b.clone().sub(a).normalize();
    const open = (type === 'door' || type === 'gabledoor') && (door === 'open' || door === 'rolled');
    const H = open ? 0.0 : wallTop;
    const P = (s, y) => {
      const t = s / len, f = y / wallTop;
      const belly = 0.025 * Math.sin(Math.PI * t) * Math.sin(Math.PI * Math.min(1, 0.15 + f * 0.85));
      const folds = (0.008 * Math.sin(s * 5.7 + len) + 0.005 * Math.sin(s * 13.1 + 2)) * (1 - f);
      const kick = y < 0.04 ? (0.04 - y) * 0.7 : 0;
      return a.clone().addScaledVector(along, s).addScaledVector(out, belly + folds + kick).setY(Math.max(0.003, y));
    };
    // window shapes in panel coordinates
    const holes = [];
    if (type === 'windows') {
      if (pe) {
        const ww = Math.min(0.55, len * 0.26), wh = 0.86, y0 = 0.9;
        for (const cx of [len * 0.3, len * 0.7]) holes.push({ kind: 'church', cx, w: ww, y0, h: wh });
      } else {
        const ww = Math.min(1.5, len * 0.72), y0 = 0.98, wh = 0.72;
        holes.push({ kind: 'rect', cx: len / 2, w: ww, y0, h: wh, bars: 2 });
      }
    }
    const inside = (s, y) => holes.some((hl) => {
      const dx = s - hl.cx;
      if (Math.abs(dx) > hl.w / 2 || y < hl.y0) return false;
      if (hl.kind === 'rect') return y <= hl.y0 + hl.h;
      const rr = hl.w / 2, ys = hl.y0 + hl.h - rr;
      return y <= ys || dx * dx + (y - ys) * (y - ys) <= rr * rr;
    });
    if (H > 0) {
      const ds = 0.03, nx = Math.max(6, Math.round(len / ds)), ny = Math.max(6, Math.round(H / ds));
      const pos = [], uv = [];
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const s = (len * i) / nx, y = (H * j) / ny; const q = P(s, y); pos.push(q.x, q.y, q.z); uv.push(s, y); }
      const iw = [], iwin = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * (nx + 1) + i, sC = (len * (i + 0.5)) / nx, yC = (H * (j + 0.5)) / ny;
        (inside(sC, yC) ? iwin : iw).push(k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1);
      }
      const mk = (idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
      bins.add(fab, mk(iw));
      if (iwin.length) bins.add(clear, mk(iwin));
      // window border tape + bars
      for (const hl of holes) {
        const loop = [];
        if (hl.kind === 'rect') {
          const x0 = hl.cx - hl.w / 2, x1 = hl.cx + hl.w / 2, y1 = hl.y0 + hl.h;
          for (const [s0, y0, s1, y1b] of [[x0, hl.y0, x1, hl.y0], [x1, hl.y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, hl.y0]]) for (let t = 0; t < 16; t++) loop.push([s0 + (s1 - s0) * t / 16, y0 + (y1b - y0) * t / 16]);
          for (let bI = 1; bI <= (hl.bars || 0); bI++) { const sb = x0 + (hl.w * bI) / (hl.bars + 1); const bar = []; for (let t = 0; t <= 8; t++) bar.push(P(sb, hl.y0 + (hl.h * t) / 8).addScaledVector(out, 0.003)); bins.add(tapeMat, K.sweep(bar, 0.011, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.004 : 0.016) })); }
        } else {
          const rr = hl.w / 2, ys = hl.y0 + hl.h - rr, x0 = hl.cx - rr, x1 = hl.cx + rr;
          for (let t = 0; t < 10; t++) loop.push([x0 + (x1 - x0) * t / 10, hl.y0]);
          for (let t = 0; t < 10; t++) loop.push([x1, hl.y0 + (ys - hl.y0) * t / 10]);
          for (let t = 0; t < 20; t++) { const an = (Math.PI * t) / 20; loop.push([hl.cx + Math.cos(an) * rr, ys + Math.sin(an) * rr]); }
          for (let t = 0; t < 10; t++) loop.push([x0, ys - (ys - hl.y0) * t / 10]);
          // cross bars
          const vb = [], hb = [];
          for (let t = 0; t <= 8; t++) { vb.push(P(hl.cx, hl.y0 + (hl.h * t) / 8).addScaledVector(out, 0.003)); hb.push(P(x0 + (hl.w * t) / 8, ys).addScaledVector(out, 0.003)); }
          bins.add(tapeMat, K.sweep(vb, 0.008, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.003 : 0.011) }));
          bins.add(tapeMat, K.sweep(hb, 0.008, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.003 : 0.011) }));
        }
        loop.push(loop[0]);
        const pts = loop.map(([s, y]) => P(s, y).addScaledVector(out, 0.003));
        bins.add(tapeMat, K.sweep(pts, 0.012, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.004 : 0.02) }));
      }
      if (type === 'door' && !open) {
        // centre zip (two tapes + teeth line) with a storm flap
        const zx = len / 2, zp = []; for (let t = 0; t <= 20; t++) zp.push(P(zx, 0.02 + ((H - 0.08) * t) / 20).addScaledVector(out, 0.004));
        bins.add(zipM, K.sweep(zp, 0.005, 5));
        const fl = []; for (let t = 0; t <= 20; t++) fl.push(P(zx - 0.035, 0.02 + ((H - 0.08) * t) / 20).addScaledVector(out, 0.006));
        bins.add(tapeMat, K.sweep(fl, 0.012, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.003 : 0.03) }));
      }
    }
    if (open) {
      // rolled-up door: a roll of cloth under the eave, tied with straps
      const rollR = 0.075, y = wallTop - rollR - 0.02;
      const rp = []; for (let t = 0; t <= 30; t++) rp.push(P((len * t) / 30, y).addScaledVector(out, rollR * 0.5));
      bins.add(fab, K.sweep(rp, rollR, 16, { rFn: (ii, ang) => rollR * (1 + 0.06 * Math.sin(ang * 3 + ii * 0.7)) }));
      for (const f of (len > 2.5 ? [0.2, 0.5, 0.8] : [0.25, 0.75])) {
        const s = len * f, base = P(s, y);
        const loopPts = []; for (let t = 0; t <= 24; t++) { const an = (t / 24) * Math.PI * 2; loopPts.push(base.clone().addScaledVector(out, rollR * 0.5 + Math.cos(an) * (rollR + 0.004)).add(V3(0, Math.sin(an) * (rollR + 0.004), 0))); }
        bins.add(strapM, K.sweep(loopPts, 0.006, 4, { rFn: (ii, ang) => (Math.abs(Math.cos(ang)) > 0.7 ? 0.0015 : 0.012) }));
      }
      // a short top strip of the door stays under the valance
      const strip = [];
      for (let j = 0; j <= 2; j++) { const row = []; for (let i = 0; i <= 20; i++) row.push(P((len * i) / 20, y + rollR * 0.6 + ((wallTop - y - rollR * 0.6) * j) / 2)); strip.push(row); }
      bins.add(fab, K.gridGeometry(strip));
    }
  }

  bins.build(inner);
  const group = new THREE.Group();
  if (gableFront) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  return { group, hex, panels: panels.length };
}

export function frameTent(p = {}) {
  let span = Number(p.w ?? 4), length = Number(p.d ?? 8);
  if (span > length) [span, length] = [length, span];
  const opslag = String(p.variant || '').toLowerCase().startsWith('opslag');
  const line = String(p.line || 'pvc').toLowerCase().startsWith('pe') ? 'pe' : 'pvc';
  const frame = p.frame !== false;
  const He = Number(p.eave ?? 2.0);
  const Hr = Number(p.ridge ?? He + span * (opslag ? 0.27 : 0.25));
  const walls = opslag ? (p.walls ?? 'closed') : (p.walls ?? 'none');
  const door = p.door || (opslag ? 'closed' : 'closed');
  const { group, hex, panels } = buildFrameTent({
    span, length, eave: He, ridge: Hr, line, color: p.color || 'wit', walls, door, frame,
    gableFront: opslag, frontGableDoor: opslag, ties: opslag,
  });
  group.name = `frameTent ${span}x${length} ${line}${opslag ? ' opslag' : ''}`;
  const walled = panels > 0;
  return {
    object: group,
    detail: { target: [length / 2, He - 0.2, span / 2], size: 1.2, azimuth: 30, elevation: 8 },
    view: { hero: frame ? { elevation: walled ? 20 : 17 } : { azimuth: 56, elevation: 13 }, front: { elevation: 6 } },
    // the loose roof cover is shown as a cut-out in its pitched shape: no floor shadow under it
    rig: {
      default: { ...K.tentRig(hex, { walled }), ...(frame ? {} : { keyShadow: 0, groundAO: { strength: 0 }, contact: { strength: 0 } }) },
      // straight-on view of a walled tent: the walls face the camera, so the softbox comes
      // from front-left (not raking) and white cloth gets the easy-up front exposure
      front: { key: { azimuth: -38, elevation: 28, distanceRel: 2.0, aimRel: [-0.05, 0.3, 0.6], angle: 46, penumbra: 0.9 }, fill: { azimuth: 55, elevation: 10, intensity: 2.2 }, ...(K.lumOf(hex) > 0.7 ? { exposure: 0.74 } : {}) },
    },
    meta: { span, length, He, Hr, line, opslag, frame },
  };
}
