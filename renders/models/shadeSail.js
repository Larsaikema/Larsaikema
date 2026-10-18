// Schaduwdoek (shade sail): knitted HDPE shade cloth (~185 g/m2, ~90 % shade), cut with
// concave edges, a doubled webbing hem with a rope inside along every edge, stainless D-rings
// at the reinforced corners. Shown tensioned in a hypar (two opposite corners higher) as a
// cut-out, with short tension lines from the corner rings; no posts (not included).
// Form found with the force-density method (js/tentkit.js): uniform stress, edge cables.
//   { shape: 'vierkant'|'driehoek'|'rechthoek', w, d, color }
import * as THREE from 'three';
import * as G from '../js/geom.js';
import * as M from '../js/materials.js';
import * as K from '../js/tentkit.js';

const { V3 } = K;

export function shadeSail(p = {}) {
  const shape = String(p.shape || 'vierkant').toLowerCase();
  let W = Number(p.w ?? 4), D = Number(p.d ?? (shape.startsWith('vier') || shape.startsWith('square') ? W : 3));
  if (shape.startsWith('vier') || shape.startsWith('square')) D = W;
  const hex = K.col(p.color || 'antraciet', M.COLORS.antraciet);
  const cloth = K.shadeCloth(hex);
  const hemC = new THREE.Color(hex).multiplyScalar(0.82);
  const hemMat = M.webbing('#' + hemC.getHexString());
  const ss = M.chrome();
  const ropeM = K.ropeMat('#1E1F21');
  const bins = new G.PartBin();
  const group = new THREE.Group(); group.name = `shadeSail ${shape} ${W}x${D}`;
  const tri = shape.startsWith('drie') || shape.startsWith('tri');
  const h = 0.05;
  const base = 2.3, lift = 0.6;
  let rows;
  const cornersOut = [];
  if (!tri) {
    const nu = Math.round(W / h), nv = Math.round(D / h);
    const id = (i, j) => j * (nu + 1) + i;
    const net = new K.Net((nu + 1) * (nv + 1));
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) net.set(id(i, j), (i / nu - 0.5) * W * 0.9, base + lift / 2, (j / nv - 0.5) * D * 0.9);
    const cs = [[0, nv, -1, 1, lift], [nu, nv, 1, 1, 0], [nu, 0, 1, -1, lift], [0, 0, -1, -1, 0]];
    for (const [i, j, sx, sz, dy] of cs) {
      const at = V3(sx * W / 2 * 0.96, base + dy, sz * D / 2 * 0.96);
      net.pin(id(i, j), at.x, at.y, at.z);
      cornersOut.push({ at, out: V3(sx, 0, sz).normalize() });
    }
    const R = (W * W) / (8 * 0.07 * W); // edge sag ~7 % of the span
    const kap = R / h;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const onV = i === 0 || i === nu, onU = j === 0 || j === nv;
      if (i < nu) net.edge(id(i, j), id(i + 1, j), onU ? kap : 1);
      if (j < nv) net.edge(id(i, j), id(i, j + 1), onV ? kap : 1);
    }
    net.solve({ iters: 900, omega: 1.9 });
    rows = [];
    for (let j = 0; j <= nv; j++) { const r = []; for (let i = 0; i <= nu; i++) r.push(net.get(id(i, j))); rows.push(r); }
    bins.add(cloth, K.gridGeometry(rows));
    const edge = [];
    for (let i = 0; i <= nu; i++) edge.push(rows[nv][i]);
    for (let j = nv - 1; j >= 0; j--) edge.push(rows[j][nu]);
    for (let i = nu - 1; i >= 0; i--) edge.push(rows[0][i]);
    for (let j = 1; j <= nv; j++) edge.push(rows[j][0]);
    addHem(edge);
  } else {
    // triangle: polar-free fan grid from corner A along the two other edges
    const A = V3(-W / 2, base + lift, D / 2), B = V3(W / 2, base, D / 2), C = V3(0, base + lift * 0.4, -D / 2);
    const n = Math.round(W / h);
    const ids = []; let cnt = 0;
    for (let j = 0; j <= n; j++) { ids.push([]); for (let i = 0; i <= n - j; i++) ids[j].push(cnt++); }
    const net = new K.Net(cnt);
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n - j; i++) {
      const a = i / n, b = j / n;
      const q = A.clone().multiplyScalar(1 - a - b).addScaledVector(B, a).addScaledVector(C, b);
      net.set(ids[j][i], q.x, q.y, q.z);
    }
    net.pin(ids[0][0], A.x, A.y, A.z); net.pin(ids[0][n], B.x, B.y, B.z); net.pin(ids[n][0], C.x, C.y, C.z);
    const kap = (W * W) / (8 * 0.07 * W) / h;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n - j; i++) {
      const e1 = j === 0, e2 = i === 0, e3 = i + j === n;
      if (i + 1 <= n - j) net.edge(ids[j][i], ids[j][i + 1], e1 ? kap : 1);
      if (j + 1 <= n - i) net.edge(ids[j][i], ids[j + 1][i], e2 ? kap : 1);
      if (i >= 1 && j + 1 <= n - (i - 1)) net.edge(ids[j][i], ids[j + 1][i - 1], e3 ? kap : 1);
    }
    net.solve({ iters: 900, omega: 1.9 });
    const pos = [], idx = [];
    for (let k = 0; k < cnt; k++) { const q = net.get(k); pos.push(q.x, q.y, q.z); }
    for (let j = 0; j < n; j++) for (let i = 0; i < n - j; i++) {
      idx.push(ids[j][i], ids[j][i + 1], ids[j + 1][i]);
      if (i + 1 <= n - j - 1) idx.push(ids[j][i + 1], ids[j + 1][i + 1], ids[j + 1][i]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const uv = []; for (let k = 0; k < cnt; k++) uv.push(pos[k * 3], pos[k * 3 + 2]);
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    bins.add(cloth, g);
    const edge = [];
    for (let i = 0; i <= n; i++) edge.push(net.get(ids[0][i]));
    for (let j = 1; j <= n; j++) edge.push(net.get(ids[j][n - j]));
    for (let j = n - 1; j >= 0; j--) edge.push(net.get(ids[j][0]));
    addHem(edge);
    for (const q of [A, B, C]) cornersOut.push({ at: q, out: q.clone().setY(0).normalize() });
  }
  function addHem(edge) {
    const thin = edge.filter((_, k) => k % 2 === 0); thin.push(thin[0].clone());
    bins.add(hemMat, K.sweep(thin, 0.012, 6, { rFn: (i, a) => 0.012 * (Math.abs(Math.sin(a)) > 0.7 ? 0.35 : 1) }));
  }
  // corners: reinforcement triangle, D-ring, short tension line
  for (const { at, out } of cornersOut) {
    const ring = new THREE.TorusGeometry(0.032, 0.005, 10, 24);
    ring.rotateX(Math.PI / 2); ring.rotateY(Math.atan2(out.x, out.z));
    const rp = at.clone().addScaledVector(out, 0.035);
    ring.translate(rp.x, rp.y, rp.z); bins.add(ss, ring);
    const end = rp.clone().addScaledVector(out, 0.45).add(V3(0, (at.y > base + 0.1 ? 0.06 : -0.02), 0));
    bins.add(ropeM, K.rope(rp.clone().addScaledVector(out, 0.03), end, 0.0045, 0.01));
  }
  bins.build(group);
  return {
    object: group,
    view: { hero: { elevation: 24 } },
    rig: { default: { ...K.tentRig(hex), keyShadow: 0, groundAO: { strength: 0 }, contact: { strength: 0 } } },
    meta: { shape, W, D },
  };
}
