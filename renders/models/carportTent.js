// Carport / opslagtent with a fixed frame (vast frame): galvanised steel tube frame with a peaked
// roof, legs every 2.4 m, eave ties over every truss, knee braces and foot plates; a white PE
// roof cover with closed gables and a short valance, both long sides and the front gable open
// (drive in from the front). Built with the frame tent builder (models/frameTent.js).
//   { w (span, 3.3), d (length, 4.8), color, line: 'pe'|'pvc', walls }
import * as K from '../js/tentkit.js';
import * as T2 from '../js/tentkit2.js';
import { buildFrameTent } from './frameTent.js';

export function carportTent(p = {}) {
  let span = Number(p.w ?? 3.3), length = Number(p.d ?? 4.8);
  if (span > length) [span, length] = [length, span];
  const He = Number(p.eave ?? 2.05), Hr = Number(p.ridge ?? He + span * 0.24);
  const line = String(p.line || 'pe').toLowerCase().startsWith('pvc') ? 'pvc' : 'pe';
  const { group, hex, panels } = buildFrameTent({
    span, length, eave: He, ridge: Hr, line, color: p.color || 'wit', walls: p.walls || 'none', door: 'open',
    gableFront: true, frontGableDoor: true, ties: true, bay: 2.4, valance: 0.15,
  });
  group.name = `carportTent ${span}x${length}`;
  return {
    object: group,
    view: { hero: { elevation: 17 } },
    // the catalogue tent rig with the white key (as frameTent): white PE reads white, not light grey
    rig: { default: { ...T2.tentRig2(hex, { walled: panels > 0 }), ...(K.lumOf(hex) > 0.7 ? { exposure: 0.72 } : {}) } },
    meta: { span, length, He, Hr },
  };
}
