// Overkappingzeil op maat (made-to-measure cover sheet for a patio cover / pergola roof).
// Default: clear PVC (0.5 mm) with welded 5 cm double hems on all four sides and aluminium
// eyelets every 50 cm in the hem. Shown as a cut-out the way it is used: stretched over a
// roof frame at a 14 deg fall, sagging a few cm between the eyelets and in the middle, so the
// clear sheet catches the softboxes as soft streaks. Opaque versions (PVC/PE in a colour) use
// the tent cloth materials.
//   { w, h (length along the fall), color: 'transparant'|<colour>, eyelets: true|spacing }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';

const { V3 } = K;

export function tarp(p = {}) {
  const W = Number(p.w ?? 4), H = Number(p.h ?? p.d ?? 2.5);
  const clear = !p.color || /trans|clear|helder/i.test(String(p.color));
  const hex = clear ? '#DDE3E1' : K.col(p.color, M.COLORS.wit);
  const sheet = clear ? K.clearPVC({ coverage: 0.22, tint: '#1F2827' }) : K.pvc(hex);
  const hemMat = clear ? K.clearPVC({ coverage: 0.5, tint: '#2E3A38' }) : K.pvcPatch(hex);
  const eyeM = M.aluminium({ tone: '#C9CCD0', roughness: 0.28 });
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `tarp ${W}x${H}`;
  const y0 = 0.035, hem = 0.05;
  // gentle hanging waves: deeper towards the bottom, nodes at the top eyelets
  const spacing = typeof p.eyelets === 'number' ? p.eyelets : 0.5;
  // local sheet coordinates (x across, y along the length). display 'roof': stretched over a
  // roof frame falling 14 deg towards the front, sagging between the eyelets and ~6 cm in the
  // middle; display 'hanging': hung from the top eyelets, soft drape folds lower down.
  const roofMode = String(p.display || 'hanging') === 'roof';
  const fall = roofMode ? 14 * Math.PI / 180 : Math.PI / 2;
  const P = (x, y) => {
    const u = (x + W / 2) / W, v = (y - y0) / H;
    if (!roofMode) {
      const f = 1 - v;
      const wv = 0.03 * Math.sin((x / spacing) * Math.PI * 2) * (0.2 + 0.8 * f) + 0.07 * Math.sin(x * 2.1 + 0.6) * Math.pow(f, 0.8) + 0.04 * Math.sin(x * 0.9 - 1.1) * f;
      return V3(x, y, wv);
    }
    const sagMid = 0.06 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
    const edge = Math.min(u, 1 - u, v, 1 - v);
    const scal = 0.008 * Math.abs(Math.sin(((u * W) / spacing) * Math.PI)) * Math.exp(-edge * 25) + 0.008 * Math.abs(Math.sin(((v * H) / spacing) * Math.PI)) * Math.exp(-edge * 25);
    const wav = 0.012 * Math.sin(x * 2.3 + y * 1.1) * Math.sin(Math.PI * v);
    const along = (v - 0.5) * H; // up the fall towards the back
    const down = sagMid + scal + wav;
    return V3(x, 2.4 + along * Math.sin(fall) - down * Math.cos(fall), -along * Math.cos(fall) - down * Math.sin(fall));
  };
  const nx = Math.round(W / 0.04), ny = Math.round(H / 0.05);
  const band = (xa, xb, ya, yb, mat, off = 0, cast = true) => {
    const rows = [];
    const nu = Math.max(2, Math.round(Math.abs(xb - xa) / 0.04)), nv = Math.max(2, Math.round(Math.abs(yb - ya) / 0.05));
    for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) { const x = xa + (xb - xa) * (i / nu), y = ya + (yb - ya) * (j / nv); r.push(P(x, y).add(V3(0, 0, off))); } rows.push(r); }
    const g = K.gridGeometry(rows);
    const m = K.addMesh(group, g, mat, { cast, receive: true });
    return m;
  };
  void nx; void ny;
  const xL = -W / 2, xR = W / 2, yB = y0, yT = y0 + H;
  // the clear sheet does not cast a solid shadow
  band(xL + hem, xR - hem, yB + hem, yT - hem, sheet, 0, !clear);
  // hems (double layer, welded)
  band(xL, xR, yT - hem, yT, hemMat, 0, !clear);
  band(xL, xR, yB, yB + hem, hemMat, 0, !clear);
  band(xL, xL + hem, yB + hem, yT - hem, hemMat, 0, !clear);
  band(xR - hem, xR, yB + hem, yT - hem, hemMat, 0, !clear);
  // weld lines (slightly milky)
  const weldM = K.clearPVC({ coverage: 0.7, tint: '#A8B4B2' });
  const line = (pts) => bins.add(clear ? weldM : M.tentThread(hex), K.sweep(pts, 0.0016, 4));
  const lift = V3(0, Math.cos(fall), Math.sin(fall)).multiplyScalar(0.0015);
  const seg = (a, b, n = 60) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push(P(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t).add(lift)); } return out; };
  line(seg([xL + hem, yB + hem], [xR - hem, yB + hem])); line(seg([xL + hem, yT - hem], [xR - hem, yT - hem]));
  line(seg([xL + hem, yB + hem], [xL + hem, yT - hem])); line(seg([xR - hem, yB + hem], [xR - hem, yT - hem]));
  // eyelets every `spacing` along all edges, centred in the hem
  if (p.eyelets !== false) {
    const pts = [];
    const nX = Math.max(1, Math.round((W - 0.1) / spacing)), nY = Math.max(1, Math.round((H - 0.1) / spacing));
    for (let i = 0; i <= nX; i++) { const x = xL + 0.05 + ((W - 0.1) * i) / nX; pts.push([x, yT - hem / 2], [x, yB + hem / 2]); }
    for (let j = 1; j < nY; j++) { const y = yB + 0.05 + ((H - 0.1) * j) / nY; pts.push([xL + hem / 2, y], [xR - hem / 2, y]); }
    for (const [x, y] of pts) {
      const c = P(x, y);
      const nrm = V3(0, Math.cos(fall), Math.sin(fall));
      const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), nrm);
      for (const s of [-1, 1]) {
        const ring = new THREE.TorusGeometry(0.0095, 0.0032, 8, 22);
        ring.scale(1, 1, 0.55); ring.applyQuaternion(q);
        const cc = c.clone().addScaledVector(nrm, s * 0.0015); ring.translate(cc.x, cc.y, cc.z);
        bins.add(eyeM, ring);
      }
      bins.add(eyeM, G.tube(c.clone().addScaledVector(nrm, -0.002), c.clone().addScaledVector(nrm, 0.002), 0.0072, 18));
    }
  }
  bins.build(group);
  return {
    object: group,
    view: { hero: { azimuth: 34, elevation: roofMode ? 20 : 10 } },
    rig: { default: roofMode
      // floating cut-out (like the loose roof covers): no floor shadow
      ? { ...K.tentRig('#B0B6B5'), exposure: 0.8, keyShadow: 0, groundAO: { strength: 0 }, contact: { strength: 0 } }
      : { ...K.tentRig('#B0B6B5'), exposure: 0.8, groundAO: { strength: 0.12 }, keyShadow: 0.1 } },
    meta: { W, H, clear },
  };
}
