// Loose easy-up frame (los frame, sold without roof cloth): the easy-up builder's frame
// (legs, trusses, corner and mid brackets, sliders, foot plates) with every cloth and thread
// mesh taken away. { w, d, legs: 'premium' | 'professional' }
import * as K from '../js/tentkit.js';
import { easyUpTent } from './easyUpTent.js';

export function easyUpFrame(p = {}) {
  const res = easyUpTent({ ...p, color: 'antraciet', walls: null, valancePrint: null });
  const root = res.object, drop = [];
  root.traverse((o) => { if (o.isMesh && (K.isCloth(o.material) || K.isThread(o.material))) drop.push(o); });
  for (const o of drop) { o.parent.remove(o); o.geometry.dispose(); }
  root.name = `easyUpFrame ${p.w ?? 3}x${p.d ?? 3} ${p.legs || 'premium'}`;
  const rigs = { ...(res.rig || {}) };
  if (rigs.default) { rigs.default = { ...rigs.default, exposure: 'auto' }; delete rigs.default.toneMapping; delete rigs.default.shoulder; }
  return { ...res, object: root, rig: rigs, meta: { ...(res.meta || {}), frameOnly: true } };
}
