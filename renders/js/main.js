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

// spec = { model, params?, ...params, angle, size, imageWidth, imageHeight, bg, samples, rig, camera, items? }
// Render options are reserved keys; everything else is passed to the model builder.
export const RENDER_KEYS = ['model', 'params', 'items', 'angle', 'size', 'imageWidth', 'imageHeight', 'bg', 'samples', 'rig', 'camera', 'detail', 'out', 'rotationY'];
function modelParams(o) {
  if (o.params) return o.params;
  const p = {}; for (const [k, v] of Object.entries(o)) if (!RENDER_KEYS.includes(k) && k !== 'position') p[k] = v;
  return p;
}
export function buildScene(spec) {
  const root = new THREE.Group();
  const items = spec.items || [{ model: spec.model, params: modelParams(spec) }];
  let detail = null, meta = [], view = null, rig = null;
  for (const it of items) {
    const fn = MODELS[it.model];
    if (!fn) throw new Error(`unknown model "${it.model}". Known: ${Object.keys(MODELS).join(', ')}`);
    const res = fn(modelParams(it));
    const obj = res.object || res;
    if (it.position) obj.position.set(...it.position);
    if (it.rotationY) obj.rotation.y = (it.rotationY * Math.PI) / 180;
    root.add(obj);
    if (!detail && res.detail) {
      detail = { ...res.detail };
      if (it.position) detail.target = detail.target.map((v, i) => v + it.position[i]);
    }
    meta.push(res.meta || {});
    if (!view && res.view) view = res.view;
    if (!rig && res.rig) rig = res.rig;
  }
  if (spec.rotationY) root.rotation.y = (spec.rotationY * Math.PI) / 180;
  return { root, detail: spec.detail ? { ...(detail || {}), ...spec.detail } : detail, meta, viewHints: view, rigHints: rig };
}

function mergeRig(a, b) {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' ? { ...out[k], ...v } : v;
  }
  return out;
}

window.renderSpec = async function renderSpec(spec) {
  const t0 = performance.now();
  const s = getStudio();
  const size = spec.size || 2000;
  const width = spec.imageWidth || size, height = spec.imageHeight || size;
  const { root, detail, meta, viewHints, rigHints } = buildScene(spec);
  const angle = spec.angle || 'hero';
  // product builders may suggest a better framing per angle; spec.camera always wins
  const overrides = { ...((viewHints && viewHints[angle]) || {}), ...(spec.camera || {}) };
  const view = frameCamera(root, angle, { aspect: width / height, detail, overrides });
  const tBuild = performance.now() - t0;
  // product builders may suggest a light rig (per angle); spec.rig always wins
  const rig = mergeRig(mergeRig(rigHints && rigHints.default, rigHints && rigHints[angle]), spec.rig);
  const samples = spec.samples || (overrides.samples) || 40;
  const res = await s.render(root, view, {
    width, height, samples, bg: spec.bg || '#EFEDE8', rig,
    onProgress: (i, n, ms) => console.log(`[render] ${i}/${n} ${(ms / 1000).toFixed(1)}s`),
  });
  // dispose product geometry (materials/textures are cached for the batch)
  root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  s.scene.remove(root); s.root = null;
  return { ms: performance.now() - t0, buildMs: tBuild, renderMs: res.ms, exposure: res.exposure, view: { ...view, position: view.position.toArray(), target: view.target.toArray() }, meta };
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
