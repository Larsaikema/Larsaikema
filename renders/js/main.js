// Page entry: exposes window.renderSpec(spec) for the CLI (render.mjs) and an
// interactive preview when scene.html is opened with ?spec=<json>.
import * as THREE from 'three';
import { Studio } from './engine.js';
import { frameCamera } from './camera.js';
import { MODELS } from '../models/index.js';

let studio = null;
function getStudio() {
  if (!studio) { studio = new Studio(document.getElementById("c")); window.__studio = studio; }
  return studio;
}

// spec = { model, params?, ...params, angle, size, width, height, bg, samples, rig, items? }
export function buildScene(spec) {
  const root = new THREE.Group();
  const items = spec.items || [{ model: spec.model, params: spec.params || spec }];
  let detail = null, meta = [];
  for (const it of items) {
    const fn = MODELS[it.model];
    if (!fn) throw new Error(`unknown model "${it.model}". Known: ${Object.keys(MODELS).join(', ')}`);
    const res = fn(it.params || it);
    const obj = res.object || res;
    if (it.position) obj.position.set(...it.position);
    if (it.rotationY) obj.rotation.y = (it.rotationY * Math.PI) / 180;
    root.add(obj);
    if (!detail && res.detail) {
      detail = { ...res.detail };
      if (it.position) detail.target = detail.target.map((v, i) => v + it.position[i]);
    }
    meta.push(res.meta || {});
  }
  if (spec.rotationY) root.rotation.y = (spec.rotationY * Math.PI) / 180;
  return { root, detail: spec.detail || detail, meta };
}

window.renderSpec = async function renderSpec(spec) {
  const t0 = performance.now();
  const s = getStudio();
  const size = spec.size || 2000;
  const width = spec.width || size, height = spec.height || size;
  const { root, detail, meta } = buildScene(spec);
  const angle = spec.angle || 'hero';
  const view = frameCamera(root, angle, { aspect: width / height, detail, overrides: spec.camera || {} });
  const tBuild = performance.now() - t0;
  const res = await s.render(root, view, {
    width, height, samples: spec.samples || 40, bg: spec.bg || '#EFEDE8', rig: spec.rig || {},
    onProgress: (i, n, ms) => console.log(`[render] ${i}/${n} ${(ms / 1000).toFixed(1)}s`),
  });
  // dispose product geometry (materials/textures are cached for the batch)
  root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  s.scene.remove(root); s.root = null;
  return { ms: performance.now() - t0, buildMs: tBuild, renderMs: res.ms, view: { ...view, position: view.position.toArray(), target: view.target.toArray() }, meta };
};

window.grabImage = function grabImage(type = 'image/png', quality = 0.92) {
  return document.getElementById('c').toDataURL(type, quality);
};

window.__ready = true;

// interactive: scene.html?spec={"model":"easyUpTent"}&samples=8
const q = new URLSearchParams(location.search);
if (q.get('spec')) {
  const spec = JSON.parse(q.get('spec'));
  spec.samples = Number(q.get('samples') || spec.samples || 8);
  spec.size = Number(q.get('size') || spec.size || 1000);
  window.renderSpec(spec).then((r) => console.log('done', r));
}
