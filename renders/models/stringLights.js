// LED string lights (kerstverlichting): a long thin wire with small LEDs, lying in loose loops
// on the floor, lit or unlit, with the lead to its plug-in transformer.
//
// stringLights { kind, count, length, on, color, wire, spacing }
//   kind     'kerst' (default): micro LEDs on dark green wire (twisted pair), 31 V plug-in
//            transformer; 'feest': the same on black wire
//   count    number of LEDs (100)        length  lit length in m (default count x spacing)
//   spacing  m between LEDs (0.10)       on      lit (true)
//   color    light colour: 'warmwit' (2400 K, default), 'koelwit', 'multi', or a light name/hex
//   wire     'groen' | 'zwart' | 'transparant'
//
// Construction: two 0.5 mm2 conductors twisted together (a ~3.2 mm wide twisted pair; at
// catalogue scale one 2.6 mm strand with a twist highlight), every 10 cm a moulded lamp holder
// (6.5 x 11 mm) with a 5 mm "strawberry" LED cap pointing away from the wire. The string is
// laid down in ~5 loose, drifting loops (a lying scribble rather than a neat coil) so the LEDs
// spread over the floor; where a loop crosses an earlier one it lies on top of it. Lit, every
// LED glows with a small halo and the floor picks up a warm pool of light.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as L from '../js/lightKit.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

function wireMat(w) {
  const k = String(w || 'groen').toLowerCase();
  if (k.startsWith('zw')) return L.cableRubber('#141515', 0.45);
  if (k.startsWith('tr')) return L.clearGlass({ tint: '#E9EDE6', coverage: 0.7, salt: 6.2 });
  return L.cached('xmasGreen', () => new THREE.MeshPhysicalMaterial({ color: '#1C3A24', roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.2, specularIntensity: 0.6, name: 'pvc wire green' }));
}

export function stringLights(p = {}) {
  const count = Math.max(2, Math.round(Number(p.count ?? 100)));
  const sp = Number(p.spacing ?? 0.1);
  const len = Number(p.length ?? count * sp);
  const on = p.on !== false;
  const kind = String(p.kind || 'kerst').toLowerCase();
  const wire = wireMat(p.wire || (kind === 'feest' ? 'zwart' : 'groen'));
  const holderMat = wire;
  const multi = /multi|kleur/i.test(String(p.color || ''));
  const lightHex = multi ? null : (String(p.color || '').toLowerCase().startsWith('koel') ? '#EAF1FF' : L.lightHex(p.color, '#FFB25E'));
  const nz = L.noise;
  const rw = 0.0013;

  // --- scribble of drifting loops on the floor ---------------------------------------------
  const raw = []; let acc = 0;
  const R0 = 0.2;
  for (let i = 0; i < 20000 && acc < len + 0.05; i++) {
    const th = i * 0.01;
    const k = th / TAU;
    // loop centres orbit slowly (a rosette), so the loops pile up in a round, open bundle
    const r = R0 * (0.82 + 0.3 * nz.noise(th * 0.3, 4.1) + 0.06 * Math.sin(th * 1.7));
    const ca = 0.6 + k * 2.35;
    const cx = 0.115 * Math.cos(ca) + 0.03 * nz.noise(k * 0.9, 7.7), cz = 0.1 * Math.sin(ca) + 0.03 * nz.noise(k * 0.9, 2.3);
    raw.push(V3(cx + Math.cos(th) * r * 1.05, 0, cz + Math.sin(th) * r * 0.9));
    if (raw.length > 1) acc += raw[raw.length - 1].distanceTo(raw[raw.length - 2]);
  }
  // centre it
  const cx0 = raw.reduce((a, q) => a + q.x, 0) / raw.length, cz0 = raw.reduce((a, q) => a + q.z, 0) / raw.length;
  raw.forEach((q) => { q.x -= cx0; q.z -= cz0; });
  const N = Math.round(len * 120);
  const { pts: flat } = L.resample(raw, N);
  const ds = len / (N - 1);
  // crossing heights (a wire crossing an earlier wire, and the lamp holders being thicker)
  const h = new Float32Array(N).fill(rw);
  const gap = Math.ceil(0.06 / ds);
  const lampS = []; for (let i = 0; i < count; i++) lampS.push(sp * 0.5 + i * sp);
  const lampIdx = lampS.map((s) => Math.min(N - 1, Math.round(s / ds)));
  const isLamp = new Uint8Array(N); lampIdx.forEach((i) => { for (let d = -1; d <= 1; d++) if (i + d >= 0 && i + d < N) isLamp[i + d] = 1; });
  const cellOf = (q) => `${Math.floor(q.x / 0.02)},${Math.floor(q.z / 0.02)}`;
  const grid = new Map();
  for (let i = 0; i < N; i++) {
    // look up earlier points nearby
    const gx = Math.floor(flat[i].x / 0.02), gz = Math.floor(flat[i].z / 0.02);
    for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) {
      const list = grid.get(`${gx + ax},${gz + az}`); if (!list) continue;
      for (const j of list) {
        if (j > i - gap) continue;
        const rj = isLamp[j] ? 0.0034 : rw, ri = isLamp[i] ? 0.0034 : rw;
        const dx = flat[i].x - flat[j].x, dz = flat[i].z - flat[j].z, d2 = dx * dx + dz * dz, R = rj + ri;
        if (d2 < R * R) { const lift = h[j] + Math.sqrt(R * R - d2); if (lift > h[i]) h[i] = lift; }
      }
    }
    const key = cellOf(flat[i]); if (!grid.has(key)) grid.set(key, []); grid.get(key).push(i);
  }
  const hh = Float32Array.from(h);
  const w = Math.ceil(0.03 / ds);
  for (let i = 0; i < N; i++) for (let j = Math.max(0, i - w); j <= Math.min(N - 1, i + w); j++) hh[i] = Math.max(hh[i], h[j] - 0.35 * Math.abs(i - j) * ds);
  const path = flat.map((q, i) => V3(q.x, hh[i], q.z));

  // --- wire, lamp holders, LEDs ----------------------------------------------------------------
  const bins = new G.PartBin();
  // twisted pair at catalogue scale: an oval strand whose long axis turns along the wire
  const { frames } = L.sweepProfile(path, [[0, 0], [1e-4, 0], [0, 1e-4]], { caps: false });
  // two 0.85 mm strands twisted together (pitch 22 mm)
  const fine = L.resample(path, Math.round(len / 0.0022)).pts;
  const ff = L.sweepProfile(fine, [[0, 0], [1e-4, 0], [0, 1e-4]], { caps: false }).frames;
  for (const ph of [0, Math.PI]) {
    const strand = fine.map((q, i) => { const a = (ff.S[i] / 0.022) * Math.PI * 2 + ph; return q.clone().addScaledVector(ff.B[i], Math.cos(a) * rw * 0.5).addScaledVector(ff.N[i], Math.sin(a) * rw * 0.42); });
    bins.add(wire, L.sweepProfile(strand, L.circleProfile(rw * 0.62, 8), { caps: false }).geo);
  }
  const ledOn = on ? L.emissiveMat('#FFBE6A', 5, { color: '#FFE2B0', roughness: 0.3, name: 'mini led lit' }) : null;
  const ledOff = L.clearGlass({ tint: '#F1EFE8', coverage: 0.6, salt: 2.2 });
  const chip = L.cached('ledChip', () => new THREE.MeshPhysicalMaterial({ color: '#E9D08A', roughness: 0.4, name: 'led chip' }));
  const halos = [], sources = [];
  const multiCols = ['#FF3A2A', '#FFB020', '#2FD45A', '#2F6BFF', '#FF4FB0'];
  lampIdx.forEach((i, k) => {
    const q = path[i], T = frames.T[i];
    // the LED points away from the wire: mostly up/outwards, rolled a little per lamp
    const up = V3(0, 1, 0).addScaledVector(T, -T.y).normalize();
    const sideV = V3().crossVectors(T, up).normalize();
    const roll = (nz.noise(k * 0.73, 3.3) * 1.6 + (k % 2 ? 0.5 : -0.5)) * 0.9;
    const dir = up.clone().multiplyScalar(Math.cos(roll)).addScaledVector(sideV, Math.sin(roll)).normalize();
    // lying on the floor a lamp tips over: no LED points below the horizon
    if (dir.y < 0.15) { dir.y = 0.15; dir.normalize(); }
    const base = q.clone().addScaledVector(dir, 0.0006);
    const hold = G.lathe([[0.0001, 0], [0.0029, 0], [0.0033, 0.0015], [0.0033, 0.0085], [0.003, 0.0105], [0.0026, 0.011], [0.0001, 0.011]], 20);
    const cap = G.lathe([[0.0001, 0.0098], [0.0025, 0.0098], [0.0026, 0.0125], [0.0022, 0.0162], [0.0012, 0.0182], [0.0001, 0.0186]], 20);
    const die = G.roundedBox(0.0012, 0.0006, 0.0012, 0.0002); die.translate(0, 0.0128, 0);
    const xA = V3().crossVectors(dir, Math.abs(dir.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize();
    const zA = V3().crossVectors(xA, dir);
    const M4 = new THREE.Matrix4().makeBasis(xA, dir, zA).setPosition(base.x, base.y - 0.0022 * Math.max(0, 1 - dir.y), base.z);
    hold.applyMatrix4(M4); cap.applyMatrix4(M4); die.applyMatrix4(M4);
    bins.add(holderMat, hold);
    const lc = multi ? multiCols[k % multiCols.length] : lightHex;
    if (on) {
      bins.add(multi ? L.emissiveMat(lc, 3, { color: '#FFFFFF', roughness: 0.3, name: 'mini led lit' }) : ledOn, cap);
      const c = V3(0, 0.0135, 0).applyMatrix4(M4);
      halos.push({ c, R: 0.032, color: L.lin(lc, 1.3), a: 0.85, core: 0.22, coreW: 0.62 });
      sources.push({ p: c, I: 1, color: L.lin(lc, 1.1) });
    } else { bins.add(ledOff, cap); bins.add(chip, die); }
  });

  // --- lead from the first lamp to the transformer --------------------------------------------
  const s0 = path[0], d0 = s0.clone().sub(path[4]).setY(0).normalize();
  const sideL = V3(-d0.z, 0, d0.x);
  const leadCtrl = [s0.clone(), s0.clone().addScaledVector(d0, 0.08).addScaledVector(sideL, 0.02), s0.clone().addScaledVector(d0, 0.18).addScaledVector(sideL, -0.03), s0.clone().addScaledVector(d0, 0.3).addScaledVector(sideL, 0.01)];
  const leadPts = new THREE.CatmullRomCurve3(leadCtrl.map((q) => q.setY(0.0016)), false, 'centripetal').getSpacedPoints(50);
  leadPts.forEach((q, i) => { q.y = 0.0016 + (0.012 - 0.0016) * G.smoothstep(0.82, 1, i / (leadPts.length - 1)); });
  bins.add(L.cableRubber('#151615', 0.5), L.sweepProfile(leadPts, L.circleProfile(0.0016, 10)).geo);
  {
    // plug-in transformer (31 V, IP44) lying on its back: rounded body, Schuko-style round face
    const e = leadPts[leadPts.length - 1], dE = e.clone().sub(leadPts[leadPts.length - 3]).setY(0).normalize();
    const zA = V3().crossVectors(dE, V3(0, 1, 0));
    const M4 = new THREE.Matrix4().makeBasis(dE, V3(0, 1, 0), zA).setPosition(e.x, 0, e.z);
    const body = L.moulded('#171717', 0.5);
    const parts = [];
    const box = G.roundedBox(0.072, 0.044, 0.058, 0.012, 4); box.translate(0.012 + 0.036, 0.022, 0); parts.push([body, box]);
    const face = G.lathe([[0.0001, 0], [0.019, 0], [0.0205, 0.004], [0.0205, 0.012], [0.0001, 0.012]], 40); face.rotateZ(-Math.PI / 2); face.translate(0.084, 0.022, 0); parts.push([body, face]);
    for (const s of [-1, 1]) { const pin = G.lathe([[0.0001, 0], [0.0024, 0], [0.0024, 0.017], [0.0016, 0.019], [0.0001, 0.0192]], 14); pin.rotateZ(-Math.PI / 2); pin.translate(0.096, 0.022, s * 0.0095); parts.push([L.e27Mats().nickel, pin]); }
    const relief = G.lathe([[0.0001, 0], [0.0024, 0], [0.003, 0.006], [0.0052, 0.012], [0.0001, 0.012]], 16); relief.rotateZ(-Math.PI / 2); relief.translate(0, 0.012, 0);
    parts.push([body, relief]);
    // ramp the lead up into the strain relief
    for (const [m, g] of parts) { g.applyMatrix4(M4); bins.add(m, g); }
  }

  const group = new THREE.Group(); group.name = `stringLights ${count} LED`;
  bins.build(group);
  group.traverse((o) => { if (o.isMesh) { const nm = o.material.name || ''; o.castShadow = !/lit|clear glass/.test(nm); o.receiveShadow = true; } });
  const hm = L.haloSpheres(halos, { detail: 2 }); if (hm) group.add(hm);
  if (sources.length) { const fg = L.floorGlow(sources, { box: 0.12, res: 220, k: 0.00045, max: 0.26, minH: 0.01 }); if (fg) group.add(fg); }
  const dP = path[lampIdx[Math.min(3, count - 1)]];
  return {
    object: group,
    detail: { target: [dP.x, dP.y + 0.006, dP.z], size: 0.12, azimuth: 30, elevation: 30 },
    view: { hero: { elevation: 38 } },
    rig: { default: { exposure: on ? 1.0 : 'auto', contact: { strength: 0.7, h0: 0.004, res: 1024, blur: 1.2 }, groundAO: { strength: 0.7, maxZenith: 80 } } },
    meta: { count, length: len, on },
  };
}
