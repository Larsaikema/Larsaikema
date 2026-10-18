// Onderdelen prikkabel en lichtslang (spare parts for festoon cables), as a flat-lay.
//
// { parts: ['fitting', 'eindkap', 'dimmer'], color }
//   fitting   the same E27 prick socket as on our prikkabels (lightKit.festoonSocket: clamp
//             head with lid, screw boss and hanging eye, ribbed rubber sleeve with a soft lip)
//             on a short length of flat 2 x 1,5 mm² rubber cable; lying on its side with the
//             lamp opening towards the viewer: nickel-plated E27 thread, black insulator and
//             the brass centre contact inside; `color` 'wit' for the white version
//   eindkap   watertight rubber end cap (ribbed sleeve, closed dome, cable slot)
//   dimmer    plug-in dimmer: white housing with rounded edges, Schuko socket in front (recess,
//             two contact holes, earth clips), rotary knob with grip ribs and an orange
//             indicator on top, Schuko plug (round base, two pins) at the back
//   dimmer-ab plug-in dimmer with remote: the same white housing and socket without the knob (a small
//             status LED instead), the remote lying in front of it (rounded handset, on/off and
//             up/down keys, lens at the top)
//   timer     plug-in 24-hour timer: taller white housing, segment dial with 96 push tabs (a run of
//             them pushed in), arrow mark and centre hub in the upper half of the front, Schuko socket
//             below it, plug at the back
// A part named alone ('dimmer-ab', 'timer') is placed at the centre.
// Laid out as a tidy group.
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as K from '../js/partsKit.js';
import * as L from '../js/lightKit.js';
import * as SG from '../js/softGoods.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

export function lightParts(p = {}) {
  let parts = p.parts || ['fitting', 'eindkap', 'dimmer'];
  if (typeof parts === 'string') parts = [parts];
  const white = p.color === 'wit';
  const rub = L.cableRubber(white ? '#E9E9E6' : '#161616', 0.6);
  const e27 = L.e27Mats();
  const brass = K.cached('lp-brass', () => new THREE.MeshPhysicalMaterial({ color: '#C9A75C', metalness: 1, roughness: 0.3, name: 'brass' }));
  const plastic = SG.moulded('#EFEFEB', { rough: 0.34, spec: 0.5, clearcoat: 0.15, scale: 0.0008, bump: 0.000006 });
  const grey = SG.moulded('#D8D8D4', { rough: 0.45, spec: 0.45 });
  const dark = SG.moulded('#1C1C1C', { rough: 0.5 });
  const pin = SG.aluSG({ tone: '#D2C8A8', rough: 0.25 });
  const zinc = SG.zincSG();
  const g = new THREE.Group(); g.name = 'lightParts';
  const B = new G.PartBin();
  const add = (mat, geo, m) => { if (m) geo.applyMatrix4(m); B.add(mat, geo); };
  if (parts.includes('fitting')) {
    // socket lying on its side: sleeve (-Y) -> world +Z, cable along X, hanging eye up (proper rotation)
    const yc = 0.0214;
    const T = new THREE.Matrix4().makeBasis(V3(-1, 0, 0), V3(0, 0, -1), V3(0, -1, 0)).setPosition(0, yc, 0);
    T.premultiply(new THREE.Matrix4().makeRotationY(-22 * DEG).setPosition(-0.075, 0, 0.0));
    for (const [m, geo] of L.festoonSocket(rub)) add(m, geo, T);
    // inside the lamp opening: E27 thread, insulator, centre contact
    const thread = []; for (let i = 0; i <= 12; i++) thread.push([0.0136 + (i % 2) * 0.0011, -0.0842 + i * 0.00045]);
    add(e27.shell, K.lathe(thread, 40), T);
    add(e27.insulator, K.lathe([[0.0001, -0.0789], [0.0132, -0.0789], [0.0132, -0.0794], [0.0001, -0.0794]], 40), T);
    add(brass, K.lathe([[0.0001, -0.0802], [0.0035, -0.0802], [0.0038, -0.0796], [0.0001, -0.0796]], 20), T);
    // flat cable through the head: horizontal at the head, dropping to the floor either side
    const ctrl = [V3(-0.16, 0.0032, 0.03), V3(-0.08, 0.0034, 0.012), V3(-0.04, 0.012, 0.002), V3(-0.02, yc, 0), V3(0.02, yc, 0), V3(0.04, 0.012, -0.002), V3(0.08, 0.0034, -0.014), V3(0.15, 0.0032, -0.026)];
    const pts = K.smoothPath(ctrl, 80).map((q) => q.applyMatrix4(new THREE.Matrix4().makeRotationY(-22 * DEG).setPosition(-0.075, 0, 0)));
    add(rub, L.flatCable(pts, rub));
    // cut ends of the cable: two copper cores visible
    for (const [e, d] of [[pts[0], pts[0].clone().sub(pts[1]).normalize()], [pts[pts.length - 1], pts[pts.length - 1].clone().sub(pts[pts.length - 2]).normalize()]]) {
      const side = V3().crossVectors(d, V3(0, 1, 0)).normalize();
      for (const s of [-1, 1]) add(K.cached('lp-copper', () => new THREE.MeshPhysicalMaterial({ color: '#C77C4A', metalness: 1, roughness: 0.35, name: 'copper' })), G.tube(e.clone().addScaledVector(side, s * 0.0028).addScaledVector(d, -0.001), e.clone().addScaledVector(side, s * 0.0028).addScaledVector(d, 0.0004), 0.0007, 10));
    }
  }
  if (parts.includes('eindkap')) {
    const solo1 = parts.length === 1;
    // alone: open end (with the cable slot) turned towards the camera's left, in the centre
    const T = new THREE.Matrix4().makeRotationY((solo1 ? 64 : 28) * DEG).setPosition(solo1 ? -0.02 : 0.07, 0.0125, solo1 ? 0 : 0.12);
    // smooth profile: open rim, straight ribbed sleeve, round dome (lathe axis Y, then -> +X)
    const prof = [[0.0086, -0.0005], [0.0104, -0.0019], [0.0117, -0.0012], [0.0123, 0.0015], [0.0125, 0.006]];
    for (let k = 0; k <= 14; k++) { const a = (k / 14) * Math.PI / 2; prof.push([0.0125 * Math.cos(a) + 0.0 * k, 0.03 + 0.016 * Math.sin(a)]); }
    prof.push([0.0001, 0.046]);
    const cap = K.lathe(prof, 72);
    cap.rotateZ(-Math.PI / 2);
    add(rub, cap, T);
    for (let k = 0; k < 3; k++) { const t = new THREE.TorusGeometry(0.0127, 0.001, 10, 64); t.rotateY(Math.PI / 2); t.translate(0.011 + k * 0.0075, 0, 0); add(rub, t, T); }
    // the bore inside the open end and the slot the flat cable goes into (dark)
    const bore = K.lathe([[0.0001, 0.006], [0.0086, 0.006], [0.0086, -0.0004]], 48); bore.rotateZ(-Math.PI / 2); add(dark, bore, T);
    const slot = G.roundedBox(0.0008, 0.0064, 0.0118, 0.0028); slot.translate(0.0045, 0, 0); add(SG.moulded('#060606', { rough: 0.8 }), slot, T);
  }
  if (parts.includes('dimmer')) {
    // standing on its bottom face, socket face towards the camera
    const T = new THREE.Matrix4().makeRotationY(-14 * DEG).setPosition(0.14, 0, -0.07);
    const W = 0.066, H = 0.066, D = 0.044;
    const body = G.roundedBox(W, H, D, 0.011, 4); body.translate(0, H / 2, 0); add(plastic, body, T);
    // parting line round the front bezel
    const bz = G.roundedBox(W - 0.004, H - 0.004, 0.003, 0.0095, 4); bz.translate(0, H / 2, D / 2 - 0.0005); add(plastic, bz, T);
    // Schuko socket: recess floor, rim, two holes, earth clips
    const zf = D / 2 + 0.001;
    const rim = new THREE.TorusGeometry(0.0195, 0.0016, 10, 48); rim.translate(0, H / 2, zf); add(plastic, rim, T);
    const floor = K.lathe([[0.0001, -0.002], [0.0185, -0.002], [0.0185, 0.0], [0.0001, 0.0]], 48); floor.rotateX(Math.PI / 2); floor.translate(0, H / 2, zf); add(grey, floor, T);
    for (const s of [-1, 1]) add(dark, G.tube(V3(s * 0.0095, H / 2, zf + 0.0001), V3(s * 0.0095, H / 2, zf + 0.0012), 0.0028, 16), T);
    for (const s of [-1, 1]) { const clip = G.roundedBox(0.009, 0.0032, 0.0035, 0.001); clip.translate(0, H / 2 + s * 0.0172, zf + 0.0006); add(zinc, clip, T); }
    // rotary knob on top with grip ribs and an indicator
    const kc = V3(0.008, H, -0.002);
    const knob = K.lathe([[0.0001, 0.0105], [0.0105, 0.0105], [0.0112, 0.0095], [0.0112, 0.001], [0.0001, 0.001]].reverse(), 40);
    knob.translate(kc.x, kc.y, kc.z); add(grey, knob, T);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; const rib = G.roundedBox(0.0012, 0.008, 0.0012, 0.0004); rib.translate(kc.x + Math.cos(a) * 0.0113, kc.y + 0.0055, kc.z + Math.sin(a) * 0.0113); add(grey, rib, T); }
    const ind = G.roundedBox(0.0016, 0.001, 0.007, 0.0004); ind.translate(kc.x, kc.y + 0.011, kc.z + 0.004); add(SG.moulded('#E2681B', { rough: 0.4 }), ind, T);
    // Schuko plug at the back: round base + two pins
    const base = K.lathe([[0.0001, 0], [0.018, 0], [0.0185, 0.004], [0.0175, 0.011], [0.0001, 0.011]], 40); base.rotateX(-Math.PI / 2); base.translate(0, H / 2, -D / 2 + 0.001); add(plastic, base, T);
    for (const s of [-1, 1]) {
      const pg = K.lathe([[0.0001, 0], [0.0024, 0], [0.0024, 0.0175], [0.0016, 0.0188], [0.0001, 0.019]], 16); pg.rotateX(-Math.PI / 2); pg.translate(s * 0.0095, H / 2, -D / 2 - 0.01); add(pin, pg, T);
    }
  }
  // shared housing of the plug-in parts (dimmer-ab, timer): body, bezel, Schuko socket at height ys, plug at the back
  const housing = (T, W, H, D, ys) => {
    const body = G.roundedBox(W, H, D, 0.011, 4); body.translate(0, H / 2, 0); add(plastic, body, T);
    const bz = G.roundedBox(W - 0.004, H - 0.004, 0.003, 0.0095, 4); bz.translate(0, H / 2, D / 2 - 0.0005); add(plastic, bz, T);
    const zf = D / 2 + 0.001;
    const rim = new THREE.TorusGeometry(0.0195, 0.0016, 10, 48); rim.translate(0, ys, zf); add(plastic, rim, T);
    const floor = K.lathe([[0.0001, -0.002], [0.0185, -0.002], [0.0185, 0.0], [0.0001, 0.0]], 48); floor.rotateX(Math.PI / 2); floor.translate(0, ys, zf); add(grey, floor, T);
    for (const s of [-1, 1]) add(dark, G.tube(V3(s * 0.0095, ys, zf + 0.0001), V3(s * 0.0095, ys, zf + 0.0012), 0.0028, 16), T);
    for (const s of [-1, 1]) { const clip = G.roundedBox(0.009, 0.0032, 0.0035, 0.001); clip.translate(0, ys + s * 0.0172, zf + 0.0006); add(zinc, clip, T); }
    const base = K.lathe([[0.0001, 0], [0.018, 0], [0.0185, 0.004], [0.0175, 0.011], [0.0001, 0.011]], 40); base.rotateX(-Math.PI / 2); base.translate(0, ys, -D / 2 + 0.001); add(plastic, base, T);
    for (const s of [-1, 1]) {
      const pg = K.lathe([[0.0001, 0], [0.0024, 0], [0.0024, 0.0175], [0.0016, 0.0188], [0.0001, 0.019]], 16); pg.rotateX(-Math.PI / 2); pg.translate(s * 0.0095, ys, -D / 2 - 0.01); add(pin, pg, T);
    }
    return zf;
  };
  const solo = parts.length === 1;
  if (parts.includes('dimmer-ab')) {
    const T = new THREE.Matrix4().makeRotationY(-16 * DEG).setPosition(solo ? -0.03 : 0.14, 0, solo ? -0.03 : -0.07);
    const W = 0.066, H = 0.066, D = 0.044;
    housing(T, W, H, D, H / 2);
    // status LED on top
    add(SG.moulded('#E2681B', { rough: 0.3, spec: 0.7 }), K.lathe([[0.0001, 0.0015], [0.0022, 0.0015], [0.0024, 0.0], [0.0001, 0.0]].reverse(), 20).translate(0.016, H, 0.008), T);
    // remote lying in front, slightly turned
    const R = new THREE.Matrix4().makeRotationY(24 * DEG).setPosition(solo ? 0.06 : 0.2, 0, solo ? 0.07 : 0.03);
    const hand = G.roundedBox(0.04, 0.011, 0.105, 0.0055, 4); hand.translate(0, 0.0055, 0); add(SG.moulded('#2A2B2D', { rough: 0.42, spec: 0.55 }), hand, R);
    const keyMat = SG.moulded('#D8D8D4', { rough: 0.5 });
    const keys = [[-0.009, 0.03, '#3E9A4A'], [0.009, 0.03, '#C2302A'], [0, 0.006, null], [0, -0.014, null]];
    for (const [x, z, c] of keys) {
      const k = G.roundedBox(0.012, 0.0024, 0.012, 0.0035, 3); k.translate(x, 0.0118, z); add(c ? SG.moulded(c, { rough: 0.45 }) : keyMat, k, R);
    }
    const lens = G.roundedBox(0.012, 0.004, 0.006, 0.002, 2); lens.translate(0, 0.006, -0.051); add(SG.moulded('#5A1A1A', { rough: 0.15, spec: 0.9 }), lens, R);
  }
  if (parts.includes('timer')) {
    const T = new THREE.Matrix4().makeRotationY(-14 * DEG).setPosition(solo ? 0 : 0.2, 0, solo ? 0 : -0.06);
    const W = 0.064, H = 0.104, D = 0.05;
    const zf = housing(T, W, H, D, 0.03);
    // dial: recessed ring, 96 tabs (06:00-23:00 pushed in), arrow mark, centre hub
    const yc = 0.073, Rd = 0.023;
    const ring = K.lathe([[0.0001, 0.0], [Rd + 0.003, 0.0], [Rd + 0.003, 0.0015], [0.0001, 0.0015]], 64); ring.rotateX(Math.PI / 2); ring.translate(0, yc, zf - 0.0005); add(grey, ring, T);
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * TAU;
      const pushed = k >= 24 && k < 92;
      const tab = G.roundedBox(0.0011, 0.0045, pushed ? 0.0012 : 0.0028, 0.0003);
      tab.translate(0, Rd - 0.0022, 0); tab.rotateZ(-a); tab.translate(0, yc, zf + 0.001 + (pushed ? 0 : 0.0008));
      add(pushed ? SG.moulded('#2F6FB0', { rough: 0.4 }) : plastic, tab, T);
    }
    const hub = K.lathe([[0.0001, 0], [0.0175, 0], [0.0175, 0.0035], [0.0165, 0.0045], [0.0001, 0.0045]], 48); hub.rotateX(Math.PI / 2); hub.translate(0, yc, zf + 0.0015); add(plastic, hub, T);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; const tk = G.roundedBox(0.0006, k % 6 === 0 ? 0.004 : 0.0022, 0.0004, 0.0001); tk.translate(0, 0.0145, 0); tk.rotateZ(-a); tk.translate(0, yc, zf + 0.0062); add(dark, tk, T); }
    const arrow = G.roundedBox(0.003, 0.006, 0.0012, 0.0006); arrow.translate(0, yc + Rd + 0.0055, zf + 0.0006); add(SG.moulded('#E2681B', { rough: 0.4 }), arrow, T);
  }
  B.build(g);
  return {
    object: g,
    detail: { target: [-0.075, 0.02, 0.06], size: 0.12, azimuth: 20, elevation: 22 },
    view: { hero: { elevation: 30 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.004, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 }, envIntensity: 1.0 } },
    meta: { parts },
  };
}
