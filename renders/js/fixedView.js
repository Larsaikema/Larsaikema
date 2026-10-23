// Fixed camera through the auto-framing (tents-other group, round 7).
//
// camera.js frames a product by its points: it centres their projected bounds and moves the
// camera along the preset direction until the larger half-extent fills `fill` of the frame. A
// rectangle square to the view direction, centred on the aim point, with half size
// dist * tan(fov / 2) * fill, is therefore framed from exactly `dist`: the camera lands on the
// wanted eye. Used for views from inside / under a product (LED lamp in an inflatable tent,
// under a stretch tent's sail), where the product's own bounds would put the eye in the wrong
// place (inside a tube, behind a pole) or frame the whole tent from far away.
//
//   const fv = fixedView(eye, aim, { fov: 62, fill: 0.9 });
//   group.traverse((o) => { if (o.isMesh) o.userData.noFrame = true; });
//   group.add(fv.proxy);            // invisible, only read by the framing
//   return { ..., view: { low: fv.view } };
import * as THREE from 'three';

export function fixedView(eye, aim, { fov = 50, fill = 0.9 } = {}) {
  const dv = eye.clone().sub(aim);
  const dist = dv.length();
  dv.normalize();
  const half = dist * Math.tan(((fov / 2) * Math.PI) / 180) * fill;
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dv).normalize();
  const up = new THREE.Vector3().crossVectors(dv, right).normalize();
  const pos = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const q = aim.clone().addScaledVector(right, a * half).addScaledVector(up, b * half);
    pos.push(q.x, q.y, q.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const proxy = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff00ff }));
  // layer 5: never rendered (same convention as softGoods.frameProxy)
  proxy.layers.set(5); proxy.castShadow = false; proxy.receiveShadow = false; proxy.frustumCulled = false;
  proxy.userData.frameProxy = true;
  const view = {
    azimuth: (Math.atan2(dv.x, dv.z) * 180) / Math.PI,
    elevation: (Math.asin(dv.y) * 180) / Math.PI,
    fov, fill,
  };
  return { proxy, view, dist };
}
