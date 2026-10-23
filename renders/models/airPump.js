// Pomp voor opblaasbare tent (air pump for inflatable tents).
//
// { kind }
//   'elektrisch' (default): 230 V high-volume blower in a two-shell housing (anthracite base,
//        light-grey top shell with a moulded carry handle), analogue pressure gauge and rocker
//        switch on the front, vent slots on the sides, rubber feet, an outlet port with a
//        corrugated hose (≈1.2 m, loosely coiled on the floor) ending in a nozzle, power cord
//        with a Schuko plug, and three nozzle adapters laid in front.
//   'hand': double-action hand pump: cylinder with T-handle, foot plates, gauge and hose.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L5 from '../js/partsLook5.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function gaugeTex() {
  return K.drawnTex('pumpGauge', 512, 512, (g, w, h) => {
    const c = w / 2;
    g.fillStyle = '#F6F6F2'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    g.strokeStyle = '#1D2420'; g.lineCap = 'round';
    const a0 = 135 * DEG, a1 = 405 * DEG;
    for (let i = 0; i <= 40; i++) {
      const a = a0 + (a1 - a0) * (i / 40), big = i % 10 === 0, mid = i % 5 === 0;
      const r0 = c * (big ? 0.68 : mid ? 0.74 : 0.78), r1 = c * 0.86;
      g.lineWidth = big ? 9 : 5;
      g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); g.stroke();
    }
    // green band for the working pressure of the tents
    g.strokeStyle = '#2F8F5B'; g.lineWidth = 16; g.beginPath(); g.arc(c, c, c * 0.92, a0 + (a1 - a0) * 0.15, a0 + (a1 - a0) * 0.35); g.stroke();
    g.fillStyle = '#1D2420'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 46px Arial, sans-serif';
    ['0', '0,1', '0,2', '0,3', '0,4'].forEach((t, i) => { const a = a0 + (a1 - a0) * (i / 4); g.fillText(t, c + Math.cos(a) * c * 0.52, c + Math.sin(a) * c * 0.52); });
    g.font = '700 40px Arial, sans-serif'; g.fillText('bar', c, c * 1.42);
    // needle
    const an = a0 + (a1 - a0) * 0.22;
    g.strokeStyle = '#C23A1A'; g.lineWidth = 10; g.beginPath(); g.moveTo(c - Math.cos(an) * c * 0.12, c - Math.sin(an) * c * 0.12); g.lineTo(c + Math.cos(an) * c * 0.8, c + Math.sin(an) * c * 0.8); g.stroke();
    g.fillStyle = '#1D2420'; g.beginPath(); g.arc(c, c, 26, 0, TAU); g.fill();
  });
}

// corrugated hose along a path
function hoseGeo(pts, r = 0.016, pitch = 0.0075) {
  const F = K.pathFrames(pts);
  const rows = [];
  const nr = 18;
  for (let i = 0; i < pts.length; i++) {
    const k = 1 + 0.12 * Math.max(0, Math.sin((F.S[i] / pitch) * TAU)) ** 0.6;
    rows.push(Array.from({ length: nr }, (_, j) => { const a = (j / nr) * TAU; return pts[i].clone().addScaledVector(F.N[i], Math.cos(a) * r * k).addScaledVector(F.B[i], Math.sin(a) * r * k); }));
  }
  rows.push(rows[0]); // dummy to keep types happy
  rows.pop();
  // rows along the path, ring around: transpose -> u = around (closed), v = along
  return K.gridGeometry(rows, { closedU: true, flip: true });
}

export function airPump(p = {}) {
  const kind = String(p.kind || 'elektrisch');
  const bins = new G.PartBin();
  const extras = [];
  const base = SG.moulded('#2E3135', { rough: 0.5 }), shell = SG.moulded('#C7C9CC', { rough: 0.42 }), black = SG.moulded('#151515', { rough: 0.5 }), rub = SG.rubberSG('#141414', { rough: 0.8 });
  const hoseMat = SG.moulded('#1A1B1C', { rough: 0.45, clearcoat: 0.2 });
  // body: lower base + upper shell (rounded boxes), parting line between
  const W = 0.27, D = 0.17, H1 = 0.075, H2 = 0.1;
  // round 5: dense rounded corners and bevels with smooth (creased) normals: ExtrudeGeometry is
  // flat-shaded per triangle, which showed the low-poly corners at 1200 px
  const lower = K.extrudeY(new THREE.Shape(G.roundedRectProfile(W - 0.02, D - 0.02, 0.028, 24).map((q) => new THREE.Vector2(q.x, q.y))), H1, { y0: 0.012, bevel: 0.01, bevelSegs: 10, curveSegs: 24 });
  bins.add(base, L5.creased(lower, 50));
  const upper = K.extrudeY(new THREE.Shape(G.roundedRectProfile(W - 0.006 - 0.044, D - 0.006 - 0.044, 0.014, 24).map((q) => new THREE.Vector2(q.x, q.y))), H2, { y0: 0.012 + H1 + 0.002, bevel: 0.022, bevelSegs: 16, curveSegs: 24 });
  bins.add(shell, L5.creased(upper, 50));
  const yTop = 0.012 + H1 + 0.002 + H2;
  // moulded carry handle on top
  const hp = []; for (let i = 0; i <= 40; i++) { const t = i / 40; hp.push(V3(-0.09 + 0.18 * t, yTop - 0.01 + 0.055 * Math.sin(Math.PI * t) ** 0.6, 0)); }
  bins.add(shell, K.sweep(hp, K.rrect(0.03, 0.022, 0.009, 8).map(([x, y]) => [x, y]), { up: V3(0, 0, 1) }));
  // vent slots on both short sides
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { const sl = G.roundedBox(0.004, 0.006, 0.09, 0.002); sl.translate(s * (W / 2 + 0.0005), 0.04 + k * 0.012, 0); bins.add(black, sl); }
  // rubber feet
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) bins.add(rub, G.tube(V3(x * (W / 2 - 0.035), 0, z * (D / 2 - 0.03)), V3(x * (W / 2 - 0.035), 0.013, z * (D / 2 - 0.03)), 0.011, 20));
  // front panel: gauge + rocker switch
  const fz = D / 2 - 0.004;
  const bezel = K.lathe([[0.034, -0.002], [0.037, 0.004], [0.036, 0.01], [0.031, 0.011]], 48); bezel.rotateX(Math.PI / 2); bezel.translate(-0.05, 0.139, fz); bins.add(black, bezel);
  const dial = new THREE.CircleGeometry(0.031, 48); dial.translate(-0.05, 0.139, fz + 0.006);
  const dm = new THREE.Mesh(dial, K.cached('gaugeDial', () => new THREE.MeshPhysicalMaterial({ map: gaugeTex(), roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.05, name: 'gauge dial' }))); dm.castShadow = false; extras.push(dm);
  const sw = G.roundedBox(0.03, 0.04, 0.012, 0.004, 6); sw.translate(0.055, 0.136, fz + 0.003); bins.add(black, sw);
  const rk = G.roundedBox(0.024, 0.017, 0.008, 0.003, 6); rk.rotateX(-0.25); rk.translate(0.055, 0.145, fz + 0.01); bins.add(SG.moulded('#B3231C', { rough: 0.35 }), rk);
  const rk2 = G.roundedBox(0.024, 0.017, 0.006, 0.003, 6); rk2.rotateX(0.2); rk2.translate(0.055, 0.127, fz + 0.009); bins.add(SG.moulded('#8E1B16', { rough: 0.4 }), rk2);
  // outlet port on the right side (+x), hose from it
  const op = V3(W / 2 + 0.002, 0.07, -0.02);
  bins.add(black, G.tube(op.clone().add(V3(-0.01, 0, 0)), op.clone().add(V3(0.03, 0, 0)), 0.022, 48));
  bins.add(black, G.tube(op.clone().add(V3(0.02, 0, 0)), op.clone().add(V3(0.05, 0, 0)), 0.019, 32));
  // hose: out of the port, down to the floor, a loose loop round to the front, nozzle at the end
  const ctrl = [op.clone().add(V3(0.05, 0, 0)), op.clone().add(V3(0.12, -0.03, 0)), V3(0.3, 0.018, -0.02), V3(0.42, 0.018, 0.1), V3(0.38, 0.018, 0.26), V3(0.2, 0.018, 0.3), V3(0.08, 0.018, 0.22), V3(0.12, 0.018, 0.12), V3(0.25, 0.018, 0.08), V3(0.36, 0.018, 0.16)];
  const hpth = K.smoothPath(ctrl, 400);
  bins.add(hoseMat, hoseGeo(hpth, 0.0165));
  const hend = hpth[hpth.length - 1], hdir = hend.clone().sub(hpth[hpth.length - 3]).normalize();
  const noz = K.lathe([[0.0185, 0], [0.019, 0.03], [0.014, 0.04], [0.011, 0.075], [0.009, 0.08], [0.0001, 0.08]], 32);
  noz.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), hdir)); noz.translate(hend.x, hend.y, hend.z); bins.add(SG.moulded('#8E9194', { rough: 0.4 }), noz);
  // power cord from the back to a Schuko plug
  const cord = K.smoothPath([V3(-W / 2 + 0.05, 0.03, -D / 2 - 0.005), V3(-W / 2 + 0.03, 0.006, -D / 2 - 0.06), V3(-0.3, 0.004, -0.06), V3(-0.36, 0.004, 0.06), V3(-0.3, 0.004, 0.16)], 200);
  bins.add(black, K.tubeAlong(cord, 0.0035, 10));
  const pe = cord[cord.length - 1], pd = pe.clone().sub(cord[cord.length - 3]).normalize();
  const plug = K.lathe([[0.004, 0], [0.012, 0.012], [0.02, 0.03], [0.0195, 0.042], [0.0001, 0.042]], 32);
  plug.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), pd)); plug.translate(pe.x, pe.y + 0.016, pe.z); bins.add(black, plug);
  for (const s of [-1, 1]) { const pin = G.tube(V3(0, 0, 0), V3(0, 0.019, 0), 0.0024, 12); pin.translate(s * 0.0095, 0.042, 0); pin.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), pd)); pin.translate(pe.x, pe.y + 0.016, pe.z); bins.add(SG.zincSG(), pin); }
  // three nozzle adapters in front
  const adapters = [[[0.012, 0], [0.012, 0.03], [0.008, 0.04], [0.006, 0.07], [0.0001, 0.07]], [[0.016, 0], [0.016, 0.02], [0.012, 0.03], [0.012, 0.05], [0.0001, 0.05]], [[0.011, 0], [0.011, 0.025], [0.005, 0.035], [0.004, 0.06], [0.0001, 0.06]]];
  adapters.forEach((prof, i) => {
    const a = K.lathe(prof, 32); a.rotateZ(Math.PI / 2); a.rotateY((-30 + i * 25) * DEG);
    a.computeBoundingBox(); a.translate(-0.12 + i * 0.075, -a.boundingBox.min.y, 0.2 + (i % 2) * 0.02);
    bins.add(SG.moulded(['#8E9194', '#2E3135', '#C7C9CC'][i], { rough: 0.45 }), a);
  });
  const g = K.finish(bins, `airPump ${kind}`, extras);
  return {
    object: g,
    detail: { target: [-0.03, 0.135, D / 2], size: 0.2, azimuth: 25, elevation: 12 },
    view: { hero: { elevation: 24 } },
    rig: L5.flatLayRig({ contact: { h0: 0.005 } }),
    meta: { kind },
  };
}
