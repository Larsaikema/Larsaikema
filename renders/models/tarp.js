// Overkappingzeil op maat (made-to-measure cover sheet for a patio cover / pergola front).
// Default: clear PVC (0.5 mm) with welded 5 cm double hems on all four sides and aluminium
// eyelets every 50 cm in the hem. Round 2: shown the way it is used and photographed, standing
// on the studio floor: hung from the front beam of a timber pergola (beam and posts not
// included) with a ball bungee through every top eyelet, the bottom hem just off the floor.
// Between the eyelets the top edge scallops a little, lower down the sheet hangs in soft, long
// waves. The posts stand just behind the sheet, so the clear foil reads as clear: the timber
// shows through it, the foil adds a faint grey-green haze, one broad softbox reflection band
// (engine `sheet`) and milky weld lines; the hems are a double layer (more opaque).
// Opaque versions (PVC in a colour) use the tent cloth materials, same display.
//   { w, h (height of the sheet), color: 'transparant'|<colour>, eyelets: true|spacing,
//     display: 'hanging'|'roof' }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';

const { V3 } = K;

let whiteTex = null;
function white() {
  if (!whiteTex) { whiteTex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); whiteTex.needsUpdate = true; }
  return whiteTex;
}

export function tarp(p = {}) {
  const W = Number(p.w ?? 4), H = Number(p.h ?? p.d ?? 2.5);
  const clear = !p.color || /trans|clear|helder/i.test(String(p.color));
  const hex = clear ? '#DDE3E1' : K.col(p.color, M.COLORS.wit);
  const hem = 0.05;
  const spacing = typeof p.eyelets === 'number' ? p.eyelets : 0.5;
  let sheet;
  if (clear) {
    // clear foil with one broad softbox reflection band through its centre (uv in metres)
    sheet = K.clearPVC({ coverage: 0.16, tint: '#26302F' }).clone();
    sheet.alphaMap = white();
    sheet.userData = { ...sheet.userData, stochasticAlpha: 0.16, sheet: { L: 1, H: 1, c: [W / 2 - hem, (H - 2 * hem) * 0.55], strength: 0.28 } };
    sheet.name = 'clear pvc tarp';
  } else sheet = K.pvc(hex);
  const hemMat = clear ? K.clearPVC({ coverage: 0.55, tint: '#3A4644' }) : K.pvcPatch(hex);
  const eyeM = M.aluminium({ tone: '#C9CCD0', roughness: 0.28 });
  const wood = K.woodPole();
  const bungee = M.mouldedNylon('#1D1E20');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `tarp ${W}x${H}`;

  // pergola front: a 9 x 9 cm beam on two posts, the sheet hangs in front of it
  const beamY = H + 0.2, beamZ = 0, zS = 0.115; // sheet plane
  const yTop = H + 0.07, yBot = 0.07;
  const bw = 0.09;
  {
    const beam = G.roundedBox(W + 0.5, bw, bw, 0.006); beam.translate(0, beamY, beamZ); bins.add(wood, beam);
    for (const sx of [-1, 1]) {
      const px = sx * (W / 2 - 0.28);
      const post = G.roundedBox(bw, beamY + bw / 2, bw, 0.006); post.translate(px, (beamY + bw / 2) / 2, beamZ - 0.0); bins.add(wood, post);
      // galvanised post anchor at the foot
      const anc = G.roundedBox(bw + 0.012, 0.12, bw + 0.012, 0.002); anc.translate(px, 0.06, beamZ); bins.add(M.galvanised(), anc);
    }
  }
  // the hanging sheet: x across, y up; scallops between the top eyelets, long soft waves below
  const nE = Math.max(1, Math.round((W - 0.1) / spacing));
  const P = (x, y) => {
    const v = (y - yBot) / (yTop - yBot), f = 1 - v;
    const ex = ((x + W / 2 - 0.05) / ((W - 0.1) / nE)) % 1;
    const scal = 0.012 * Math.sin(Math.PI * Math.min(1, Math.max(0, ex))) * Math.exp(-(1 - v) * 9);
    const wv = (0.024 * Math.sin(x * 1.9 + 0.6) + 0.014 * Math.sin(x * 4.3 - 1.1) + 0.006 * Math.sin(x * 9.1 + 2.3)) * Math.pow(f, 0.9);
    return V3(x, y - scal, zS + wv + 0.012 * Math.sin(Math.PI * v) * 0.5);
  };
  const band = (xa, xb, ya, yb, mat, cast = true) => {
    const nu = Math.max(2, Math.round(Math.abs(xb - xa) / 0.03)), nv = Math.max(2, Math.round(Math.abs(yb - ya) / 0.04));
    const rows = [];
    for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) r.push(P(xa + (xb - xa) * (i / nu), ya + (yb - ya) * (j / nv))); rows.push(r); }
    const g = K.gridGeometry(rows);
    if (mat.alphaMap && !g.attributes.uv) g.setAttribute('uv', g.attributes.uv);
    return K.addMesh(group, g, mat, { cast, receive: true });
  };
  const xL = -W / 2, xR = W / 2;
  band(xL + hem, xR - hem, yBot + hem, yTop - hem, sheet, !clear);
  band(xL, xR, yTop - hem, yTop, hemMat, !clear);
  band(xL, xR, yBot, yBot + hem, hemMat, !clear);
  band(xL, xL + hem, yBot + hem, yTop - hem, hemMat, !clear);
  band(xR - hem, xR, yBot + hem, yTop - hem, hemMat, !clear);
  // weld lines along the inner edge of the hems
  const weldM = clear ? K.clearPVC({ coverage: 0.75, tint: '#A8B4B2' }) : M.tentThread(hex);
  const seg = (a, b, n = 80) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push(P(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t).add(V3(0, 0, 0.0016))); } return out; };
  for (const [a, b] of [[[xL + hem, yBot + hem], [xR - hem, yBot + hem]], [[xL + hem, yTop - hem], [xR - hem, yTop - hem]], [[xL + hem, yBot + hem], [xL + hem, yTop - hem]], [[xR - hem, yBot + hem], [xR - hem, yTop - hem]]]) bins.add(weldM, K.sweep(seg(a, b), 0.0016, 4));
  // eyelets every `spacing` along all edges, in the middle of the hem; ball bungees at the top
  if (p.eyelets !== false) {
    const pts = [];
    const nY = Math.max(1, Math.round((H - 0.1) / spacing));
    for (let i = 0; i <= nE; i++) { const x = xL + 0.05 + ((W - 0.1) * i) / nE; pts.push([x, yTop - hem / 2, true], [x, yBot + hem / 2, false]); }
    for (let j = 1; j < nY; j++) { const y = yBot + 0.05 + ((H - 0.1) * j) / nY; pts.push([xL + hem / 2, y, false], [xR - hem / 2, y, false]); }
    for (const [x, y, top] of pts) {
      const c = P(x, y);
      for (const s of [-1, 1]) {
        const ring = new THREE.TorusGeometry(0.0095, 0.0032, 8, 22);
        ring.scale(1, 1, 0.55);
        const cc = c.clone().add(V3(0, 0, s * 0.0016)); ring.translate(cc.x, cc.y, cc.z);
        bins.add(eyeM, ring);
      }
      bins.add(eyeM, G.tube(c.clone().add(V3(0, 0, -0.002)), c.clone().add(V3(0, 0, 0.002)), 0.0072, 18));
      if (top) {
        // ball bungee: cord through the eyelet, over the beam, ball in front
        const cord = [];
        const yb = beamY + bw / 2 + 0.006;
        cord.push(c.clone().add(V3(0, 0.0, 0.004)));
        for (let t = 0; t <= 12; t++) { const a = (t / 12) * Math.PI; cord.push(V3(x, beamY + Math.sin(a) * (bw / 2 + 0.006) * 0 + (yb - beamY) * Math.sin(a) + 0.0, beamZ + Math.cos(a) * (bw / 2 + 0.008))); }
        cord.push(c.clone().add(V3(0, -0.004, -0.004)));
        bins.add(bungee, K.sweep(cord, 0.0028, 6));
        const ball = new THREE.SphereGeometry(0.014, 12, 10); ball.translate(x + 0.012, c.y + 0.035, zS + 0.03); bins.add(bungee, ball);
      }
    }
  }
  bins.build(group);
  const rigBase = T2.tentRig2(clear ? '#B0B6B5' : hex);
  return {
    object: group,
    view: { hero: { azimuth: 30, elevation: 10 } },
    rig: { default: clear ? { ...rigBase, exposure: 0.78 } : rigBase },
    meta: { W, H, clear },
  };
}
