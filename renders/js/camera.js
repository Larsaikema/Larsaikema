// Camera presets + automatic framing. Every product in the catalogue is framed by
// the same rules: fixed lens, fixed view direction per preset, product centred
// with an identical margin, so the shop grid looks consistent.
import * as THREE from 'three';

const DEG = Math.PI / 180;

// azimuth: degrees from the front (+Z) towards the right (+X); elevation above horizon.
export const PRESETS = {
  hero:   { azimuth: 34, elevation: 17, fov: 22, fill: 0.80 },
  front:  { azimuth: 0, elevation: 6, fov: 22, fill: 0.80 },
  side:   { azimuth: 90, elevation: 6, fov: 22, fill: 0.80 },
  back:   { azimuth: 180 + 34, elevation: 17, fov: 22, fill: 0.80 },
  top:    { azimuth: 0, elevation: 62, fov: 22, fill: 0.80 },
  low:    { azimuth: 28, elevation: 3, fov: 26, fill: 0.84 },
  detail: { azimuth: 30, elevation: 14, fov: 22, fill: 1.0 },
};

function collectPoints(root, max = 24000) {
  const pts = [];
  root.updateMatrixWorld(true);
  let total = 0;
  root.traverse((o) => { if (o.isMesh && o.visible && !o.userData.noFrame) total += o.geometry.attributes.position.count; });
  const stride = Math.max(1, Math.floor(total / max));
  const v = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || o.userData.noFrame) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += stride) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); pts.push(v.clone()); }
  });
  return pts;
}

/**
 * Compute a camera for `root` using `preset` (name or object).
 * opts.detail: {target:[x,y,z], size, azimuth?, elevation?} from the product builder.
 * Returns {position, target, fov, azimuth, elevation, distance}.
 */
export function frameCamera(root, presetName = 'hero', { aspect = 1, detail = null, overrides = {} } = {}) {
  const preset = { ...(PRESETS[presetName] || PRESETS.hero), ...overrides };
  const fov = preset.fov;
  const tanV = Math.tan((fov * DEG) / 2), tanH = tanV * aspect;

  if (presetName === 'detail' && detail) {
    const az = (detail.azimuth ?? preset.azimuth) * DEG, el = (detail.elevation ?? preset.elevation) * DEG;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const target = new THREE.Vector3(...detail.target);
    const dist = (detail.size / 2) / Math.min(tanV, tanH) / (preset.fill || 1);
    const position = target.clone().addScaledVector(dir, dist);
    // optional framing shift in the image plane (fractions of the half-frame), keeps the eye where it is
    if (detail.shift) {
      const cam = new THREE.PerspectiveCamera(fov, aspect, 0.01, 100); cam.position.copy(position); cam.lookAt(target); cam.updateMatrixWorld();
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const [sx, sy] = detail.shift;
      const off = right.multiplyScalar(-sx * dist * tanH).add(up.multiplyScalar(-sy * dist * tanV));
      target.add(off); position.add(off);
    }
    return { position, target, fov, azimuth: detail.azimuth ?? preset.azimuth, elevation: detail.elevation ?? preset.elevation, distance: dist, aperture: detail.aperture || 0, focus: detail.focus || dist };
  }

  const az = preset.azimuth * DEG, el = preset.elevation * DEG;
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const pts = collectPoints(root);
  const box = new THREE.Box3().setFromPoints(pts);
  const target = box.getCenter(new THREE.Vector3());
  let dist = box.getSize(new THREE.Vector3()).length() / (2 * tanV);
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.01, 1000);
  const fill = preset.fill;
  const v = new THREE.Vector3();
  for (let it = 0; it < 8; it++) {
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      v.copy(p).project(cam);
      if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x; if (v.y < y0) y0 = v.y; if (v.y > y1) y1 = v.y;
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + (preset.offsetY || 0);
    const ext = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
    // shift the target in the image plane so the projected bounds are centred
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    target.addScaledVector(right, cx * dist * tanH).addScaledVector(up, cy * dist * tanV);
    dist *= ext / fill;
  }
  cam.position.copy(target).addScaledVector(dir, dist);
  return { position: cam.position.clone(), target, fov, azimuth: preset.azimuth, elevation: preset.elevation, distance: dist };
}
