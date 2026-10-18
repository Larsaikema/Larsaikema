// Model registry: spec.model -> builder(params) -> { object, detail?, meta? }
import { easyUpTent } from './easyUpTent.js';
import { statafel } from './statafel.js';
import { statafelCover } from './statafelCover.js';
import * as stubs from './stubs.js';
// furniture group (biertafelset / klaptafel replace the stubs: listed after ...stubs)
import { barStool } from './barStool.js';
import { chair } from './chair.js';
import { biertafelset } from './biertafelset.js';
import { klaptafel } from './klaptafel.js';
import { patioTable } from './patioTable.js';
import { bench } from './bench.js';
import { barrelTable } from './barrelTable.js';
import { tableTop } from './tableTop.js';
import { trolley } from './trolley.js';
import { stanchion } from './stanchion.js';
// tents-other group (stretchtent / stertent / opblaasbareTent replace the stubs: listed after ...stubs)
import { opblaasbareTent, opblaasbareTunnel } from './opblaasbareTent.js';
import { frameTent } from './frameTent.js';
import { stretchtent } from './stretchtent.js';
import { stertent } from './stertent.js';
import { canopyRoof } from './canopyRoof.js';
import { marketStall } from './marketStall.js';
import { gardenPavilion } from './gardenPavilion.js';
import { carportTent } from './carportTent.js';
import { shadeSail } from './shadeSail.js';
import { tarp } from './tarp.js';
import { buffetCover } from './buffetCover.js';
import { heater, heaterElement } from './heater.js';
import { floodLight, tentLight } from './lights.js';

export const MODELS = {
  easyUpTent,
  statafel,
  statafelCover,
  ...stubs,
  barStool, chair, biertafelset, klaptafel, patioTable, bench, barrelTable, tableTop, trolley, stanchion,
  opblaasbareTent, opblaasbareTunnel, frameTent, stretchtent, stertent, canopyRoof, marketStall, gardenPavilion, carportTent, shadeSail, tarp,
  buffetCover, heater, heaterElement, floodLight, tentLight,
};
