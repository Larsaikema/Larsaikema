// Frame-onderdelen easy-up (replacement frame parts), built to the same construction as
// models/easyUpTent.js so a spare part looks exactly like the one on the tent.
//
// { parts: [...] }  any of
//   'hoekstuk-premium'       corner bracket, glass-filled nylon (black), for 40 mm hex legs
//   'hoekstuk-professional'  corner bracket, cast aluminium, for 50 mm hex legs
//   'middenstuk-professional' mid-leg bracket (three truss directions), cast aluminium
//   'schuifstuk'             slider with spring push-pin and pull ring (Premium nylon by default;
//                            'schuifstuk-professional' for the cast version)
//   'voetplaat-premium' / 'voetplaat-professional'  galvanised foot plate with hex socket,
//                            gussets, four peg holes and a socket bolt
//   'staander-premium' / 'staander-professional'    complete leg: outer + inner hex tube,
//                            corner bracket, slider, collar, push button, foot plate (lies flat)
// Brackets: crisp moulded/cast block round the leg with chamfered ends, two stiffening ribs on
// each outer face, a raised mark plaque (KLAPKLAAR PREMIUM 40 / PRO 50), clevis lugs with
// through-bolts on the two inner faces for the scissor bars and a diagonal eye for the inner
// truss, a tapered post on top for the roof corner pocket; cast versions carry hex bolts.
// Several parts are laid out as a tidy group (staander on its own lies diagonally).
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as TX from '../js/textures.js';
import * as K from '../js/partsKit.js';
import * as SG from '../js/softGoods.js';
import * as L3 from '../js/partsLook3.js';

const { V3 } = G;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const SPEC = {
  premium: { leg: 0.040, inner: 0.034, bw: 0.070, sw: 0.066, bh: 0.165, plate: 0.13, bar: 0.013, eave: 2.10, trussDrop: 0.57 },
  professional: { leg: 0.050, inner: 0.044, bw: 0.094, sw: 0.086, bh: 0.19, plate: 0.15, bar: 0.016, eave: 2.14, trussDrop: 0.60 },
};

function mats(kind) {
  const pro = kind === 'professional';
  const body = pro ? SG.castSG('#9DA2A7', { rough: 0.46 }) : M.mouldedNylon('#161616');
  const mark = (() => {
    const m = pro ? new THREE.MeshPhysicalMaterial({ color: '#9DA2A7', metalness: 1, roughness: 0.42, name: 'cast mark' }) : body.clone();
    m.normalMap = TX.embossNormal({ text: 'KLAPKLAAR', sub: pro ? 'PRO 50' : 'PREMIUM 40' }); m.normalScale = new THREE.Vector2(1, 1);
    m.userData = {}; m.name = `${body.name} mark`; return m;
  })();
  return { body, mark, chrome: M.chrome(), zinc: K.zinc(), galv: L3.galvFine({ cell: 0.004 }), dark: M.rubber('#0B0B0B'), nylon: M.mouldedNylon('#161616'),
    // satin extruded aluminium: diffuse enough that the six facets of the hex tube each get
    // their own value under the studio lights (the brushed, mirror-like tube read as square)
    tube: pro ? SG.aluSG({ tone: '#C3C7CB', rough: 0.42 }) : SG.powderSG('#1C1D1F', { rough: 0.4 }),
    tubeInner: pro ? SG.aluSG({ tone: '#CACDD1', rough: 0.38 }) : SG.powderSG('#202124', { rough: 0.46 }) };
}

const hexP = (af, r = 0.07) => G.roundedPolygonProfile(6, af, af * r, 3, Math.PI / 6);

// rounded-square block with a hex bore, chamfered top/bottom (bevel), centred on the y axis
function blockWithBore(w, y0, y1, boreAF, { r = 0.004, bevel = 0.006 } = {}) {
  const sh = new THREE.Shape(G.roundedRectProfile(w - 2 * bevel, w - 2 * bevel, Math.max(0.001, r), 3).map((q) => new THREE.Vector2(q.x, q.y)));
  if (boreAF) {
    const hp = new THREE.Path();
    const R = boreAF / 2 / Math.cos(Math.PI / 6);
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; const x = Math.cos(a) * R, y = Math.sin(a) * R; if (i === 0) hp.moveTo(x, y); else hp.lineTo(x, y); }
    sh.holes.push(hp);
  }
  return K.extrudeY(sh, y1 - y0, { y0, bevel, bevelSegs: 1, curveSegs: 6 });
}

// stiffening ribs on a face (normal f), between y0 and y1
function ribs(bins, mat, f, w, y0, y1, pro) {
  const lat = V3(f.z, 0, -f.x);
  const rw = pro ? 0.0065 : 0.005, rd = pro ? 0.0042 : 0.0035;
  for (const sg of [-1, 1]) {
    const c = V3(0, (y0 + y1) / 2, 0).addScaledVector(f, w / 2 + rd / 2 - 0.0004).addScaledVector(lat, sg * w * 0.3);
    const rib = G.roundedBox(rw, (y1 - y0), rd, Math.min(rw, rd) * 0.35, 2);
    rib.applyMatrix4(new THREE.Matrix4().makeBasis(lat, V3(0, 1, 0), f).setPosition(c));
    bins.add(mat, rib);
  }
}

// clevis: two ears sticking out of face f at height y, bar gap g, through-bolt + nut
function clevis(bins, m, f, w, y, gap, pro) {
  const lat = V3(f.z, 0, -f.x);
  const L = pro ? 0.036 : 0.03, H = pro ? 0.04 : 0.034, T = pro ? 0.006 : 0.005;
  for (const sg of [-1, 1]) {
    const ear = G.roundedBox(T, H, L, 0.0025, 3);
    const c = V3(0, y, 0).addScaledVector(f, w / 2 + L / 2 - 0.002).addScaledVector(lat, sg * (gap / 2 + T / 2));
    ear.applyMatrix4(new THREE.Matrix4().makeBasis(lat, V3(0, 1, 0), f).setPosition(c));
    bins.add(m.body, ear);
  }
  const bc = V3(0, y, 0).addScaledVector(f, w / 2 + L * 0.62);
  const half = gap / 2 + T;
  bins.add(m.zinc, G.tube(bc.clone().addScaledVector(lat, -half - 0.003), bc.clone().addScaledVector(lat, half + 0.002), 0.004, 12));
  // domed head one side, hex nut the other
  const head = new THREE.SphereGeometry(0.0068, 16, 8, 0, TAU, 0, Math.PI / 2); head.scale(1, 0.5, 1);
  head.applyMatrix4(new THREE.Matrix4().makeBasis(f, lat.clone(), V3().crossVectors(f, lat)).setPosition(bc.clone().addScaledVector(lat, half)));
  // (sphere axis = local y -> lat)
  bins.add(m.chrome, head);
  const nut = K.hexNutGeo(0.011, 0.005, 0);
  nut.applyMatrix4(new THREE.Matrix4().makeBasis(f, lat.clone().negate(), V3().crossVectors(f, lat.clone().negate())).setPosition(bc.clone().addScaledVector(lat, -half - 0.0025)));
  bins.add(m.zinc, nut);
}

// raised mark plaque on face f
function plaque(extras, m, f, w, y) {
  const lat = V3(f.z, 0, -f.x);
  const pw = w * 0.5, ph = pw * 0.34;
  const pl = new THREE.BoxGeometry(pw, ph, 0.0011);
  pl.applyMatrix4(new THREE.Matrix4().makeBasis(lat, V3(0, 1, 0), f).setPosition(V3(0, y, 0).addScaledVector(f, w / 2 + 0.0005)));
  const mesh = new THREE.Mesh(pl, m.mark); mesh.castShadow = false; mesh.receiveShadow = true; extras.push(mesh);
}

function proBolts(bins, m, f, w, y0, y1) {
  const lat = V3(f.z, 0, -f.x);
  for (const yy of [y0 + (y1 - y0) * 0.3, y0 + (y1 - y0) * 0.72]) {
    const bc = V3(0, yy, 0).addScaledVector(f, w / 2 + 0.0004);
    bins.add(m.chrome, G.prism(G.roundedPolygonProfile(6, 0.011, 0.0008, 1, 0), bc, bc.clone().addScaledVector(f, 0.0045), { side: lat }));
  }
}

// corner bracket (local: inner faces -X and -Z carry the truss lugs; rotate to taste)
function hoekstuk(bins, extras, kind, { inner = [V3(-1, 0, 0), V3(0, 0, -1)], outer = [V3(1, 0, 0), V3(0, 0, 1)], y0 = 0 } = {}) {
  const S = SPEC[kind], m = mats(kind), pro = kind === 'professional';
  const w = S.bw, h = S.bh;
  bins.add(m.body, blockWithBore(w, y0, y0 + h, S.leg + 0.001, { r: pro ? 0.0045 : 0.0032, bevel: pro ? 0.007 : 0.006 }));
  // top: tapered post for the roof corner pocket + cap
  bins.add(m.body, K.lathe([[0.0001, y0 + h + 0.032], [0.008, y0 + h + 0.031], [0.011, y0 + h + 0.026], [0.016, y0 + h + 0.004], [w * 0.36, y0 + h], [w * 0.36, y0 + h - 0.003]].reverse(), 32));
  bins.add(m.body, blockWithBore(w * 0.82, y0 + h - 0.004, y0 + h + 0.006, 0, { r: 0.006, bevel: 0.003 }));
  for (const f of outer) { ribs(bins, m.body, f, w, y0 + 0.012, y0 + h - 0.012, pro); if (pro) proBolts(bins, m, f, w, y0, y0 + h); }
  plaque(extras, m, outer[1], w, y0 + h * 0.62);
  // truss lugs near the top of both inner faces, inner-diagonal eye at the inner corner
  for (const f of inner) clevis(bins, m, f, w, y0 + h - 0.04, S.bar + 0.003, pro);
  const dg = inner[0].clone().add(inner[1]).normalize();
  const eye = G.roundedBox(0.008, 0.03, 0.03, 0.003);
  eye.applyMatrix4(new THREE.Matrix4().makeBasis(V3(dg.z, 0, -dg.x), V3(0, 1, 0), dg).setPosition(V3(0, y0 + h * 0.38, 0).addScaledVector(dg, w * 0.68)));
  bins.add(m.body, eye);
  const eb = V3(0, y0 + h * 0.38, 0).addScaledVector(dg, w * 0.68 + 0.006);
  const latd = V3(dg.z, 0, -dg.x);
  bins.add(m.zinc, G.tube(eb.clone().addScaledVector(latd, -0.009), eb.clone().addScaledVector(latd, 0.009), 0.0035, 12));
  // through-bolt of the bracket on an outer face
  const tb = V3(0, y0 + 0.035, 0).addScaledVector(outer[0], w / 2 + 0.002);
  bins.add(m.chrome, G.tube(tb.clone().addScaledVector(outer[0], -0.002), tb.clone().addScaledVector(outer[0], 0.003), 0.0055, 16));
  return { h: h + 0.032, w };
}

function schuifstuk(bins, extras, kind, { inner = [V3(-1, 0, 0), V3(0, 0, -1)], outer = [V3(1, 0, 0), V3(0, 0, 1)], y0 = 0, ringDir = null } = {}) {
  const S = SPEC[kind], m = mats(kind), pro = kind === 'professional';
  const w = S.sw, h = 0.096;
  bins.add(m.body, blockWithBore(w, y0, y0 + h, S.leg + 0.001, { r: pro ? 0.0045 : 0.0032, bevel: 0.006 }));
  for (const f of outer) ribs(bins, m.body, f, w, y0 + 0.01, y0 + h - 0.01, pro);
  plaque(extras, m, outer[1], w, y0 + h * 0.6);
  for (const f of inner) clevis(bins, m, f, w, y0 + h * 0.45, S.bar + 0.003, pro);
  // spring push-pin with pull ring on an outer face
  const rd = ringDir || outer[0];
  const pinP = V3(0, y0 + h * 0.36, 0).addScaledVector(rd, w / 2);
  bins.add(m.chrome, G.tube(pinP.clone().addScaledVector(rd, -0.002), pinP.clone().addScaledVector(rd, 0.012), 0.0035, 12));
  bins.add(m.body, G.tube(pinP.clone().addScaledVector(rd, -0.001), pinP.clone().addScaledVector(rd, 0.005), 0.0075, 18));
  const ring = new THREE.TorusGeometry(0.013, 0.0022, 8, 24);
  ring.rotateY(Math.atan2(rd.x, rd.z));
  const rc = pinP.clone().addScaledVector(rd, 0.013).setY(pinP.y - 0.012);
  ring.translate(rc.x, rc.y, rc.z);
  bins.add(m.chrome, ring);
  return { h, w };
}

function voetplaat(bins, kind, { y0 = 0 } = {}) {
  const S = SPEC[kind], m = mats(kind);
  const pl = S.plate;
  const sh = new THREE.Shape(G.roundedRectProfile(pl, pl, 0.012, 4).map((q) => new THREE.Vector2(q.x, q.y)));
  for (const [hx, hz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) { const hp = new THREE.Path(); hp.absarc(hx * pl * 0.36, hz * pl * 0.36, 0.0055, 0, TAU, true); sh.holes.push(hp); }
  bins.add(m.galv, K.extrudeY(sh, 0.006, { y0, bevel: 0.0012, bevelSegs: 1, curveSegs: 16 }));
  // hex socket (tube with a bore) + gussets + socket bolt
  const sAF = S.inner + 0.008;
  const sock = new THREE.Shape();
  const R = sAF / 2 / Math.cos(Math.PI / 6), Ri = (S.inner + 0.001) / 2 / Math.cos(Math.PI / 6);
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; if (i === 0) sock.moveTo(Math.cos(a) * R, Math.sin(a) * R); else sock.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
  const hole = new THREE.Path(); for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; if (i === 0) hole.moveTo(Math.cos(a) * Ri, Math.sin(a) * Ri); else hole.lineTo(Math.cos(a) * Ri, Math.sin(a) * Ri); }
  sock.holes.push(hole);
  bins.add(m.galv, K.extrudeY(sock, 0.075, { y0: y0 + 0.005, bevel: 0.0008, bevelSegs: 1, curveSegs: 6 }));
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const dx = Math.cos(a), dz = Math.sin(a);
    const r0 = sAF / 2 * 0.98;
    const gs = new THREE.Shape(); gs.moveTo(0, 0); gs.lineTo(0.03, 0); gs.lineTo(0, 0.04); gs.closePath();
    const g = new THREE.ExtrudeGeometry(gs, { depth: 0.004, bevelEnabled: false });
    g.translate(0, 0, -0.002);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(V3(dx, 0, dz), V3(0, 1, 0), V3(-dz, 0, dx)).setPosition(V3(dx * r0, y0 + 0.006, dz * r0)));
    bins.add(m.galv, g);
  }
  // socket bolt (M8, through two faces) with nut
  const by = y0 + 0.05;
  bins.add(m.zinc, G.tube(V3(0, by, -sAF / 2 - 0.006), V3(0, by, sAF / 2 + 0.008), 0.004, 12));
  const hd = K.hexNutGeo(0.013, 0.0055, 0); hd.rotateX(Math.PI / 2); hd.translate(0, by, sAF / 2 + 0.004); bins.add(m.zinc, hd);
  const nt = K.hexNutGeo(0.013, 0.0065, 0); nt.rotateX(Math.PI / 2); nt.translate(0, by, -sAF / 2 - 0.004); bins.add(m.zinc, nt);
  return { w: pl };
}

// complete leg standing upright at the origin (lay it down afterwards)
function staander(bins, extras, kind, { collapsed = false } = {}) {
  const S = SPEC[kind], m = mats(kind);
  const He = S.eave, joinY = 1.02;
  // collapsed (as it ships): the inner tube slid up into the outer tube, 12 cm still showing
  const lift = collapsed ? joinY - 0.17 : 0;
  const L = (y) => V3(0, y, 0);
  const side = V3(1, 0, 0);
  bins.add(m.tube, G.prism(hexP(S.leg), L(joinY), L(He - 0.03), { side }));
  bins.add(m.tubeInner, G.prism(hexP(S.inner), L(0.05 + lift), L(joinY + 0.02 + lift), { side }));
  bins.add(m.nylon, G.prism(hexP(S.leg + 0.012, 0.12), L(joinY - 0.004), L(joinY + 0.05), { side }));
  const btnY = joinY + 0.1, out = V3(0, 0, 1), face = S.leg / 2;
  const bp = L(btnY).addScaledVector(out, face);
  bins.add(m.dark, G.tube(bp.clone().addScaledVector(out, -0.001), bp.clone().addScaledVector(out, 0.0006), 0.0062, 18));
  const dome = new THREE.SphereGeometry(0.0052, 18, 10, 0, TAU, 0, Math.PI / 2); dome.scale(1, 0.75, 1); dome.rotateX(Math.PI / 2); dome.translate(bp.x, bp.y, bp.z + 0.0005); bins.add(m.chrome, dome);
  for (let k = 1; k <= 3; k++) { const hp = L(btnY + k * 0.085).addScaledVector(out, face); bins.add(m.dark, G.tube(hp.clone().addScaledVector(out, -0.001), hp.clone().addScaledVector(out, 0.0005), 0.0047, 16)); }
  // adjustment holes in the inner tube below the collar
  for (let k = 0; k < 4; k++) { const yh = joinY - 0.06 - k * 0.085 + lift; if (yh > joinY - 0.03) continue; const hp = L(yh).addScaledVector(out, S.inner / 2); bins.add(m.dark, G.tube(hp.clone().addScaledVector(out, -0.001), hp.clone().addScaledVector(out, 0.0005), 0.0047, 16)); }
  voetplaat(bins, kind, { y0: lift });
  const bh = SPEC[kind].bh;
  hoekstuk(bins, extras, kind, { y0: He + 0.006 - bh });
  schuifstuk(bins, extras, kind, { y0: He - S.trussDrop - 0.048, ringDir: V3(0, 0, 1) });
  return { length: He + 0.04 - lift, lift };
}

export function easyUpParts(p = {}) {
  let parts = p.parts || ['hoekstuk-premium', 'hoekstuk-professional', 'voetplaat-professional', 'schuifstuk'];
  if (typeof parts === 'string') parts = [parts];
  const group = new THREE.Group(); group.name = 'easyUpParts';
  const bins = new G.PartBin();
  const extras = [];
  const kindOf = (s) => (/prof/.test(s) ? 'professional' : 'premium');
  // single complete leg: lies on the floor diagonally (foot plate edge + bracket support it)
  if (parts.length === 1 && /^staander/.test(parts[0])) {
    const kind = kindOf(parts[0]);
    const sub = new G.PartBin(); const subEx = [];
    const collapsed = p.collapsed !== false;
    const { length, lift } = staander(sub, subEx, kind, { collapsed });
    const S = SPEC[kind];
    // lay down: leg axis along +X (foot at -X), spun 30 deg about its axis so a flat of the hex
    // tube faces up (three faces read: lit top flat, two flanks), resting on the foot plate edge
    // and the bracket (found from the geometry)
    const lay = new THREE.Group();
    const inner = new THREE.Group();
    sub.build(inner); subEx.forEach((e) => inner.add(e));
    inner.rotation.set((p.spin ?? 30) * DEG, 0, -Math.PI / 2);
    inner.position.x = -length / 2 - lift;
    lay.add(inner); lay.updateMatrixWorld(true);
    let foot = { y: Infinity, x: 0 }, head = { y: Infinity, x: 0 };
    const v = new THREE.Vector3();
    inner.traverse((o) => {
      if (!o.isMesh) return;
      const pa = o.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
        if (v.x < -length / 2 + 0.3 && v.y < foot.y) foot = { y: v.y, x: v.x };
        if (v.x > length / 2 - 0.4 && v.y < head.y) head = { y: v.y, x: v.x };
      }
    });
    const phi = Math.atan((head.y - foot.y) / (foot.x - head.x));
    lay.rotation.z = phi;
    lay.position.y = -(foot.x * Math.sin(phi) + foot.y * Math.cos(phi)) + 0.0005;
    // runs corner to corner in the hero frame (bracket end nearest the camera, bottom right)
    lay.rotation.y = (p.yaw ?? -29) * DEG;
    group.add(lay);
    return {
      object: group,
      detail: { target: [0.75, 0.06, 0.35], size: 0.4, azimuth: 30, elevation: 25 },
      // a corner of the hex tube up: two lit flanks meet in a ridge and the hex reads; low
      // enough that the bracket, slider and foot socket show their sides
      view: { hero: { elevation: 24 } },
      rig: { default: { env: 'studio', envIntensity: 1.0, contact: { strength: 0.85, h0: 0.008, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
      meta: { parts, kind },
    };
  }
  // set: tidy grid on the floor
  const slots = [[-0.085, -0.09], [0.1, -0.08], [-0.1, 0.11], [0.09, 0.12], [-0.28, 0.0], [0.28, 0.0]];
  parts.forEach((name, i) => {
    const kind = kindOf(name);
    const sub = new G.PartBin(); const subEx = [];
    const [x, z] = slots[i % slots.length];
    // lugs on +X (seen side-on) and -Z, ribs + mark on +Z (towards the camera) and -X
    const inner = [V3(1, 0, 0), V3(0, 0, -1)], outer = [V3(-1, 0, 0), V3(0, 0, 1)];
    if (/^hoekstuk|^middenstuk/.test(name)) hoekstuk(sub, subEx, kind, { inner, outer });
    else if (/^schuifstuk/.test(name)) schuifstuk(sub, subEx, /prof/.test(name) ? 'professional' : 'premium', { inner, outer, ringDir: V3(0, 0, 1) });
    else if (/^voetplaat/.test(name)) voetplaat(sub, kind);
    const mtx = new THREE.Matrix4().makeRotationY((i % 2 ? -12 : 10) * DEG).setPosition(x, 0, z);
    for (const [mat, list] of sub.bins) for (const geo of list) { geo.applyMatrix4(mtx); bins.add(mat, geo); }
    subEx.forEach((e) => { e.geometry.applyMatrix4(mtx); extras.push(e); });
  });
  bins.build(group); extras.forEach((e) => group.add(e));
  return {
    object: group,
    detail: { target: [0.1, 0.12, -0.08], size: 0.25, azimuth: 30, elevation: 20 },
    view: { hero: { elevation: 20 } },
    rig: { default: { contact: { strength: 0.85, h0: 0.006, res: 1024, blur: 1.2 }, groundAO: { strength: 0.75, maxZenith: 80 } } },
    meta: { parts },
  };
}
