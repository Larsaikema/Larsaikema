// Reparatieset tentdoek (repair kit for PVC or polyester tent fabric), as a flat-lay.
//
// { kind }
//   'pvc' (default): 30 ml tube of PVC glue (aluminium tube, crimped end, printed label, ribbed
//        black cap), three white PVC patches ~20 x 30 cm (slight curl), a grey abrasive pad and
//        an A6 step card ('Zo repareer je...')
//   'polyester': roll of transparent self-adhesive repair tape (5 cm x 1 m) on a core, four
//        round Ø 7,5 cm patches and the step card
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import { makeNoise2 } from '../js/rng.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

// PVC patch as a real sheet: top + bottom surface and the cut edge (0.9 mm), rounded corners,
// the calendered sheet's soft waviness and one corner curling up (memory of the roll)
function patchGeo(w, h, { curl = 0.012, corner = 0.02, seed = 1, lift = 0, th = 0.0009 }) {
  const nz = makeNoise2(seed * 5 + 1);
  const nu = 56, nv = 42;
  const top = [];
  for (let j = 0; j <= nv; j++) {
    const row = [];
    for (let i = 0; i <= nu; i++) {
      let x = -w / 2 + w * (i / nu), z = -h / 2 + h * (j / nv);
      const ax = Math.abs(x) - (w / 2 - corner), az = Math.abs(z) - (h / 2 - corner);
      if (ax > 0 && az > 0) { const d = Math.hypot(ax, az); if (d > corner) { const k = corner / d; x = Math.sign(x) * (w / 2 - corner + ax * k); z = Math.sign(z) * (h / 2 - corner + az * k); } }
      const c = K.sstep(0.5, 1, (x / (w / 2) + z / (h / 2)) / 2);
      const edge = Math.min(1, (w / 2 - Math.abs(x)) / 0.04, (h / 2 - Math.abs(z)) / 0.04);
      const wav = 0.0011 * (0.5 + 0.5 * nz.fbm(x * 9 + 1.3, z * 9, 2)) * (0.4 + 0.6 * (1 - edge));
      row.push(V3(x, lift + th + 0.0003 + curl * c * c + wav, z));
    }
    top.push(row);
  }
  const bottom = top.map((row) => row.map((q) => q.clone().add(V3(0, -th, 0))));
  const gT = K.gridGeometry(top, { closedU: false, flip: false });
  const gB = K.gridGeometry(bottom, { closedU: false, flip: true });
  // perimeter loop -> edge strip
  const per = [];
  for (let i = 0; i <= nu; i++) per.push([0, i]);
  for (let j = 1; j <= nv; j++) per.push([j, nu]);
  for (let i = nu - 1; i >= 0; i--) per.push([nv, i]);
  for (let j = nv - 1; j >= 1; j--) per.push([j, 0]);
  per.push(per[0]);
  const gE = K.gridGeometry([per.map(([j, i]) => top[j][i]), per.map(([j, i]) => bottom[j][i])], { closedU: false });
  for (const g of [gT, gB]) { const uv = g.attributes.uv; const P = g.attributes.position; for (let i = 0; i < P.count; i++) uv.setXY(i, P.getX(i), P.getZ(i)); }
  return G.merge([gT, gB, gE]);
}

function labelTex(kind) {
  return K.drawnTex(`repairLabel:${kind}`, 1024, 512, (g, w, h) => {
    g.fillStyle = '#F4F2EC'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E66414'; g.fillRect(0, h * 0.74, w, h * 0.1);
    g.fillStyle = '#1D2420'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 120px "Arial Black", Arial, sans-serif'; g.fillText('PVC-LIJM', w / 2, h * 0.36);
    g.font = '700 54px Arial, sans-serif'; g.fillText('voor tentdoek  ·  30 ml', w / 2, h * 0.6);
  });
}

function cardTex() {
  return K.drawnTex('repairCard', 1024, 1448, (g, w, h) => {
    g.fillStyle = '#FBF8F1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E66414'; g.fillRect(0, 0, w, 26);
    g.fillStyle = '#1D2420'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = '800 78px "Arial Black", Arial, sans-serif'; g.fillText('Zo repareer je', 70, 170);
    g.font = '800 78px "Arial Black", Arial, sans-serif'; g.fillText('je tentdoek', 70, 260);
    const steps = [['1', 'Schuur rond het gat', 'en maak schoon en droog.'], ['2', 'Lijm op doek én lap,', 'laat 5 minuten aftrekken.'], ['3', 'Druk stevig aan.', 'Na 24 uur belastbaar.']];
    steps.forEach(([n, a, b], i) => {
      const y = 430 + i * 300;
      g.fillStyle = '#1D2420'; g.beginPath(); g.arc(120, y, 52, 0, TAU); g.fill();
      g.fillStyle = '#FBF8F1'; g.font = '800 64px Arial, sans-serif'; g.textAlign = 'center'; g.fillText(n, 120, y + 22);
      g.textAlign = 'left'; g.fillStyle = '#1D2420'; g.font = '700 50px Arial, sans-serif'; g.fillText(a, 210, y - 8);
      g.fillStyle = '#5D625C'; g.font = '400 44px Arial, sans-serif'; g.fillText(b, 210, y + 54);
    });
    g.fillStyle = '#5D625C'; g.font = '400 36px Arial, sans-serif'; g.fillText('Boven 10 °C verwerken.', 70, h - 90);
  });
}

function glueTube(bins, mats, { L = 0.105, r = 0.0135 }) {
  // along +X: cap at x = 0 .. crimped end at x = L (tube lying on its side, centre at y = r)
  const nu = 60, nv = 48;
  const crimp0 = L - 0.022;
  const bodyRows = [];
  for (let i = 0; i <= nu; i++) {
    const x = 0.026 + (L - 0.026) * (i / nu);
    const t = K.sstep(crimp0 - 0.012, L - 0.006, x);
    const row = [];
    for (let j = 0; j <= nv; j++) {
      const a = (j / nv) * TAU;
      // circle -> flat seam: width grows to pi*r/2, height shrinks
      const ry = r * (1 - t) + 0.0012 * t, rz = r * (1 - t) + (Math.PI * r / 2) * t;
      // squeezed a bit in the middle (a used tube)
      const sq = 1 - 0.06 * Math.exp(-((x - L * 0.55) ** 2) / 0.0006);
      row.push(V3(x, r + Math.sin(a) * ry * sq, Math.cos(a) * rz));
    }
    bodyRows.push(row);
  }
  // transpose: u around, v along
  const rows = []; for (let j = 0; j <= nv; j++) rows.push(bodyRows.map((rw) => rw[j]));
  const g = K.gridGeometry(rows, { closedU: false, flip: false });
  // uv for the label: u = along (0..1 over the printed part), v = around
  const uv = g.attributes.uv;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) uv.setXY(j * (nu + 1) + i, i / nu, j / nv + 0.25);
  bins.add(mats.label, g);
  // crimp ridges
  for (let k = 0; k < 4; k++) { const rg = G.roundedBox(0.0016, 0.0028, Math.PI * r * 0.98, 0.0006); rg.translate(L - 0.016 + k * 0.0035, r, 0); bins.add(mats.alu, rg); }
  // shoulder cone + neck + cap (lathe along +Y, then turned to -X)
  const lat = (pts) => { const lg = K.lathe(pts, 40); lg.rotateZ(Math.PI / 2); lg.translate(0.026, r, 0); return lg; };
  bins.add(mats.alu, lat([[r, 0], [r * 0.95, 0.002], [0.006, 0.008], [0.0055, 0.012], [0.0001, 0.012]].map(([a, b]) => [a, b])));
  const cap = K.lathe([[0.0001, -0.008], [0.0075, -0.008], [0.0085, -0.006], [0.0085, 0.012], [0.0075, 0.0135], [0.0001, 0.0135]].reverse(), 40);
  cap.rotateZ(Math.PI / 2); cap.translate(0.026 - 0.012 + 0.0, r, 0);
  bins.add(mats.cap, cap);
  for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; const rib = G.roundedBox(0.016, 0.0012, 0.0012, 0.0004); rib.translate(0.026 - 0.016, r + Math.cos(a) * 0.0088, Math.sin(a) * 0.0088); bins.add(mats.cap, rib); }
}

export function repairKit(p = {}) {
  const kind = String(p.kind || 'pvc');
  const bins = new G.PartBin();
  const extras = [];
  const white = K.cached('rk-pvc2', () => {
    const m = SG.pvcTarp('#F0F0EB', { gloss: 0.14, weave: 1.6 }).clone();
    m.clearcoat = 0.7; m.clearcoatRoughness = 0.12; m.userData = { ...m.userData, envSpec: 0.7 }; delete m.userData.__hooked;
    // the polyester scrim shows through the white coating as a faint grid (2 x 2 cm tile, 1.25 mm pitch)
    const tex = K.drawnTex('rk-scrim', 512, 512, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      const n = 16, d = w / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle = 'rgba(120,118,110,0.10)'; g.fillRect(i * d, 0, d * 0.42, h); g.fillRect(0, i * d, w, d * 0.42);
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / 0.02, 1 / 0.02); tex.colorSpace = THREE.SRGBColorSpace;
    m.map = tex; m.needsUpdate = true;
    return m;
  });
  // patches (or round patches for polyester)
  // a tidy fanned stack: each patch shifted and turned a little so all three edges read
  const patchPos = [[-0.085, -0.03, 16], [-0.055, -0.005, 4], [-0.025, 0.02, -8]];
  patchPos.forEach(([x, z, rot], i) => {
    const g = kind === 'polyester' ? null : patchGeo(0.2, 0.3, { curl: i === 2 ? 0.022 : 0, seed: i, lift: i * 0.0011 });
    if (!g) return;
    g.rotateY(rot * DEG); g.translate(x, 0, z);
    bins.add(white, g);
  });
  if (kind === 'polyester') {
    for (let i = 0; i < 4; i++) { const d = new THREE.CircleGeometry(0.0375, 48); d.rotateX(-Math.PI / 2); d.translate(-0.12 + i * 0.085, 0.0006, 0.12); bins.add(white, d); }
    // tape roll
    const roll = K.lathe([[0.019, 0], [0.034, 0], [0.034, 0.05], [0.019, 0.05]], 64);
    roll.translate(0.05, 0, -0.05); bins.add(K.cached('tapeRoll', () => new THREE.MeshPhysicalMaterial({ color: '#E8ECEA', roughness: 0.15, transmission: 0.6, thickness: 0.01, clearcoat: 1, name: 'tape' })), roll);
  }
  // glue tube lying across the patches
  if (kind !== 'polyester') {
    const sub = new G.PartBin();
    const tex = labelTex(kind);
    const mats = { label: K.cached('glueLabel', () => new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.35, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3, side: THREE.DoubleSide, name: 'glue tube label' })), alu: SG.aluSG({ tone: '#C8CBCE', rough: 0.32 }), cap: SG.moulded('#141414', { rough: 0.4, spec: 0.55 }) };
    glueTube(sub, mats, {});
    const m = new THREE.Matrix4().makeRotationY(-28 * DEG).setPosition(-0.075, 0.0046, 0.03);
    for (const [mat, list] of sub.bins) for (const g of list) { g.applyMatrix4(m); bins.add(mat, g); }
    // abrasive pad
    const pad = G.roundedBox(0.07, 0.012, 0.1, 0.004); pad.rotateY(-6 * DEG); pad.translate(0.155, 0.006, -0.1);
    bins.add(K.cached('abrasive2', () => SG.procSurface(new THREE.MeshPhysicalMaterial({ color: '#7E8083', roughness: 0.95, name: 'abrasive' }), { kind: 'concrete', scale: 0.0006, bump: 0.0002, albedo: 0.25, rough: 0.05, cell: 0.0015, mottle: 0.01, mottleAmt: 0.05, pores: 0.3 })), pad);
  }
  // A6 step card
  const card = G.roundedBox(0.105, 0.0006, 0.148, 0.0003);
  const P = card.attributes.position, U = card.attributes.uv;
  for (let i = 0; i < P.count; i++) U.setXY(i, 0.5 + P.getX(i) / 0.105, 0.5 - P.getZ(i) / 0.148);
  card.rotateY(-6 * DEG); card.translate(0.15, 0.0003, 0.065);
  bins.add(K.cached('repairCardMat', () => K.paper(cardTex())), card);
  const g = K.finish(bins, `repairKit ${kind}`, extras);
  return {
    object: g,
    detail: { target: [-0.03, 0.01, 0.05], size: 0.16, azimuth: 30, elevation: 40 },
    view: { hero: { elevation: 48 } },
    rig: { default: { contact: { strength: 0.8, h0: 0.004, res: 1024, blur: 1.2 }, groundAO: { strength: 0.7, maxZenith: 80 }, exposure: 0.78, toneMapping: 'neutral', shoulder: 0.88 } },
    meta: { kind },
  };
}
