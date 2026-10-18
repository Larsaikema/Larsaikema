// Stretchtent (and hypar stretch shade sail).
//
// One continuous sail of stretch fabric (knitted polyester with a PU back coating) pulled over
// tall centre poles and lifted at the edge by perimeter poles. The shape is form-found with the
// force-density method (js/tentkit.js Net): uniform membrane stress, an edge webbing that pulls
// every free edge into a concave arc, the centre poles pushing up sharp peaks through a
// reinforced pole cup, perimeter poles leaning outward with two guy ropes each in a V to steel
// stakes, the corners pulled down to the ground with ratchet straps (`anchors: true`) or rope.
//
//   { w, d, color, poles: 'hout'|'alu', anchors: bool, shape: 'tent'|'hypar' }
//   6 x 6:  one centre pole 3.9 m, four perimeter poles 2.4 m on the side centres, corners down
//   larger: two centre poles 4.4 m, six perimeter poles (two per long side, one per short side)
//   hypar:  square sail on four leaning poles, two opposite corners high (3.3 m), two low (2.3 m)
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';

const { V3 } = K;

export function stretchtent(p = {}) {
  let W = Number(p.w ?? p.width ?? 6), D = Number(p.d ?? p.depth ?? 6);
  if (D > W) [W, D] = [D, W]; // long side to the camera
  const hypar = String(p.shape || '').toLowerCase() === 'hypar';
  const hex = K.col(p.color || 'zand', M.COLORS.zand);
  const fab = K.stretchFabric(hex);
  const wood = String(p.poles || 'hout').toLowerCase().startsWith('h') || p.poles === 'wood';
  const poleMat = wood ? K.woodPole() : M.aluminium({ roughness: 0.32 });
  const poleR = wood ? 0.045 : 0.032;
  const steel = M.galvanised();
  const ropeM = K.ropeMat('#2A2B2D');
  const strapM = M.webbing('#161718');
  const capM = M.mouldedNylon('#1A1A1A');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `stretchtent ${W}x${D}`;

  // ---- layout: fixed points of the sail --------------------------------------------------
  const h = 0.07; // grid spacing of the form-finding net (m of cloth)
  const nu = Math.max(40, Math.round(W / h)), nv = Math.max(40, Math.round(D / h));
  const id = (i, j) => j * (nu + 1) + i;
  const net = new K.Net((nu + 1) * (nv + 1));
  const poles = []; // { foot, top, r, guys:[dir...], kind }
  const corners = []; // { node, at, stake }
  const pins = [];
  const hw = W / 2, hd = D / 2;
  if (hypar) {
    const lean = 0.32;
    const cs = [[-1, 1, 3.3], [1, 1, 2.3], [1, -1, 3.3], [-1, -1, 2.3]]; // front-left high, front-right low ...
    for (const [sx, sz, H] of cs) {
      const out = V3(sx, 0, sz).normalize();
      const top = V3(sx * (hw - 0.15), H, sz * (hd - 0.15));
      const foot = top.clone().addScaledVector(out, -lean).setY(0);
      poles.push({ foot, top, guys: [out.clone().applyAxisAngle(V3(0, 1, 0), 0.5), out.clone().applyAxisAngle(V3(0, 1, 0), -0.5)], kind: 'corner' });
      // sail corner hangs 25 cm in from the pole top on a short strap
      const at = top.clone().addScaledVector(out, -0.42).add(V3(0, -0.12, 0));
      const i = sx < 0 ? 0 : nu, j = sz < 0 ? 0 : nv;
      pins.push({ node: id(i, j), at });
      corners.push({ node: id(i, j), at, to: top.clone().add(V3(0, -0.06, 0)), short: true });
    }
  } else {
    const big = W * D > 48;
    const Hc = big ? 4.4 : 3.8, Hp = 2.4;
    const centre = big ? [[-W * 0.19, 0], [W * 0.19, 0]] : [[0, 0]];
    for (const [x, z] of centre) poles.push({ foot: V3(x, 0, z), top: V3(x, Hc, z), centre: true });
    // perimeter poles at the side centres (big: two per long side)
    const per = big
      ? [[-W * 0.25, hd], [W * 0.25, hd], [W * 0.25, -hd], [-W * 0.25, -hd], [hw, 0], [-hw, 0]]
      : [[0, hd], [0, -hd], [hw, 0], [-hw, 0]];
    for (const [x, z] of per) {
      const out = Math.abs(z) === hd ? V3(0, 0, Math.sign(z)) : V3(Math.sign(x), 0, 0);
      const top = V3(x * 0.98 + out.x * 0.15, Hp, z * 0.98 + out.z * 0.15);
      const foot = top.clone().addScaledVector(out, -0.38).setY(0);
      poles.push({ foot, top, guys: [out.clone().applyAxisAngle(V3(0, 1, 0), 0.6), out.clone().applyAxisAngle(V3(0, 1, 0), -0.6)], kind: 'edge' });
      const i = Math.round((x / W + 0.5) * nu), j = Math.round((z / D + 0.5) * nv);
      pins.push({ node: id(Math.min(nu, Math.max(0, i)), Math.min(nv, Math.max(0, j))), at: top.clone().add(V3(0, -0.05, 0)) });
    }
    // corners pulled down to the ground
    for (const [sx, sz] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
      const at = V3(sx * (hw - 0.35), 0.42, sz * (hd - 0.35));
      const i = sx < 0 ? 0 : nu, j = sz < 0 ? 0 : nv;
      pins.push({ node: id(i, j), at });
      const out = V3(sx, 0, sz).normalize();
      corners.push({ node: id(i, j), at, to: at.clone().addScaledVector(out, 0.75).setY(0.02) });
    }
    // centre poles: the pole cup and the reinforced patch round it (r ~ 22 cm) push the cloth
    // up into a rounded peak
    const cupR = 0.22;
    for (const pl of poles.filter((q) => q.centre)) {
      const ci = (pl.top.x / W + 0.5) * nu, cj = (pl.top.z / D + 0.5) * nv;
      const rr = cupR / h;
      for (let j = Math.floor(cj - rr - 1); j <= Math.ceil(cj + rr + 1); j++) for (let i = Math.floor(ci - rr - 1); i <= Math.ceil(ci + rr + 1); i++) {
        const dd = Math.hypot(i - ci, j - cj) * h;
        if (dd > cupR) continue;
        const t = dd / cupR;
        pins.push({ node: id(i, j), at: V3(pl.top.x + (i - ci) * h * 0.8, pl.top.y + 0.03 - 0.2 * t * t, pl.top.z + (j - cj) * h * 0.8) });
      }
    }
  }

  // ---- form finding -----------------------------------------------------------------------
  // initial guess: flat sheet at mid height
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) net.set(id(i, j), (i / nu - 0.5) * W * 0.9, 2.2, (j / nv - 0.5) * D * 0.9);
  for (const pn of pins) net.pin(pn.node, pn.at.x, pn.at.y, pn.at.z);
  const R = hypar ? 7.5 : 2.6; // edge radius (cable tension / membrane stress) in metres
  const kap = R / h;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const onV = i === 0 || i === nu, onU = j === 0 || j === nv;
    if (i < nu) net.edge(id(i, j), id(i + 1, j), onU ? kap : 1);
    if (j < nv) net.edge(id(i, j), id(i, j + 1), onV ? kap : 1);
    if (i < nu && j < nv) { net.edge(id(i, j), id(i + 1, j + 1), 0.25); net.edge(id(i + 1, j), id(i, j + 1), 0.25); }
  }
  // small self weight so the free cloth between supports is not perfectly taut
  for (let k = 0; k < net.n; k++) net.addLoad(k, 0, -0.0025, 0);
  net.solve({ iters: hypar ? 700 : 1100, omega: 1.9 });

  const rows = [];
  for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) r.push(net.get(id(i, j))); rows.push(r); }
  bins.add(fab, K.gridGeometry(rows));
  // edge webbing (hem with the reinforcement band): a flattened tube along the free edges
  const edgePts = [];
  for (let i = 0; i <= nu; i++) edgePts.push(rows[nv][i]);
  for (let j = nv - 1; j >= 0; j--) edgePts.push(rows[j][nu]);
  for (let i = nu - 1; i >= 0; i--) edgePts.push(rows[0][i]);
  for (let j = 1; j <= nv; j++) edgePts.push(rows[j][0]);
  const thin = edgePts.filter((_, k) => k % 2 === 0); thin.push(thin[0].clone());
  bins.add(fab, K.sweep(thin, 0.011, 8));

  // ---- poles, guys, stakes, straps ---------------------------------------------------------
  for (const pl of poles) {
    const top = pl.top.clone();
    if (pl.centre) {
      // pole and its steel top ferrule stay just under the cloth cup (the cup is ~2 cm higher)
      bins.add(poleMat, G.tube(pl.foot.clone().setY(0.012), top.clone().add(V3(0, -0.03, 0)), poleR * 1.15, 24));
      bins.add(steel, G.tube(top.clone().add(V3(0, -0.4, 0)), top.clone().add(V3(0, -0.015, 0)), poleR * 1.2, 20, { caps: true }));
      bins.add(steel, K.footPlate(pl.foot.x, pl.foot.z, 0.2, 0.012));
      continue;
    }
    bins.add(poleMat, G.tube(pl.foot.clone().setY(0.01), top.clone().add(V3(0, -0.02, 0)), poleR, 22));
    // steel pin through the cloth loop + ferrule
    const dirP = top.clone().sub(pl.foot).normalize();
    bins.add(steel, G.tube(top.clone().addScaledVector(dirP, -0.12), top.clone().addScaledVector(dirP, 0.0), poleR * 1.12, 18, { caps: true }));
    bins.add(steel, G.tube(top.clone(), top.clone().addScaledVector(dirP, 0.09), 0.009, 10, { caps: true }));
    bins.add(capM, G.tube(pl.foot.clone().setY(0), pl.foot.clone().setY(0.03), poleR * 1.25, 18, { caps: true }));
    for (const gd of pl.guys) {
      const ropeTop = top.clone().addScaledVector(dirP, 0.04);
      const stake = top.clone().setY(0).addScaledVector(gd, hypar ? top.y * 0.42 + 0.3 : top.y * 0.5 + 0.35);
      bins.add(ropeM, K.rope(ropeTop, stake.clone().setY(0.1), 0.0045, 0.006));
      bins.add(steel, K.stakeGeo(stake, gd.clone().negate()));
    }
  }
  for (const c of corners) {
    if (c.short) {
      // hypar: stainless D-ring on the corner + short ratchet strap to the pole top
      const ring = new THREE.TorusGeometry(0.03, 0.005, 8, 20); ring.rotateX(Math.PI / 2); ring.translate(c.at.x, c.at.y, c.at.z);
      bins.add(M.chrome(), ring);
      bins.add(strapM, K.strapGeo(c.at, c.to, 0.03));
      continue;
    }
    if (p.anchors) {
      const mid = c.at.clone().lerp(c.to, 0.62);
      bins.add(strapM, K.strapGeo(c.at, c.to, 0.035));
      bins.add(steel, K.ratchetGeo(mid, c.to.clone().sub(c.at)));
    } else {
      bins.add(ropeM, K.rope(c.at, c.to.clone().setY(0.09), 0.006, 0.004));
    }
    bins.add(steel, K.stakeGeo(c.to.clone().setY(0), c.to.clone().sub(c.at).setY(0).negate()));
  }
  bins.build(group);

  const top0 = poles[0].top;
  const lum = K.lumOf(hex);
  return {
    object: group,
    detail: { target: [top0.x, top0.y - 0.6, top0.z], size: 1.6, azimuth: 30, elevation: -8 },
    view: { low: { azimuth: 28, elevation: 3 } },
    // the catalogue tent light (current easy-up rig): white stretch cloth reads white (lit sail
    // ~240-248), not light grey; stretch fabric is matte, so the white key is not tempered
    rig: { default: T2.tentRig2(hex) },
    meta: { W, D, hypar, poles: poles.length },
  };
}
