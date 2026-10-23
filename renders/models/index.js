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
import { banquetTable } from './banquetTable.js'; // furniture round 4: board-top folding tables (also via klaptafel {top})
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
import { tentLight } from './lights.js';
import { floodLight } from './floodLight.js'; // lighting group (replaces lights.js floodLight)
import { easyUpFrame } from './easyUpFrame.js';
// parts group (draagtas / gewichten / haringen / wielset replace the stubs: listed after ...stubs)
import { draagtas } from './draagtas.js';
import { easyUpParts } from './easyUpParts.js';
import { connectionStrip } from './connectionStrip.js';
import { rainGutter } from './rainGutter.js';
import { tentCoupler } from './tentCoupler.js';
import { tubeFittings } from './tubeFittings.js';
import { tentPoles } from './tentPoles.js';
import { footCaps } from './footCaps.js';
import { haringen } from './haringen.js';
import { gewichten } from './gewichten.js';
import { wielset } from './wielset.js';
import { sandbag } from './sandbag.js';
import { waterBag } from './waterBag.js';
import { concreteBlock } from './concreteBlock.js';
import { protectionDisc } from './protectionDisc.js';
import { repairKit } from './repairKit.js';
import { airPump } from './airPump.js';
import { tubeBag } from './tubeBag.js';
import { stretchParts } from './stretchParts.js';
import { lightParts } from './lightParts.js';
// lighting group (prikkabel replaces the stub: listed after ...stubs)
import { prikkabel } from './prikkabel.js';
import { ropeLight } from './ropeLight.js';
import { stringLights } from './stringLights.js';
import { ledBulb } from './ledBulb.js';
import { heaterCover } from './heaterCover.js';
// catalog fixes (merchandising review): loper and zitkussen packshots
import { carpetRunner } from './carpetRunner.js';
import { seatCushion } from './seatCushion.js';
import { sideWall } from './sideWall.js';
// merchandising review 3: tentelastieken as their own product
import { tentElastics } from './tentElastics.js';
// merchandising review 3: per-Uitvoering images of the mixed-parts products (kabel, verlengkabel, aansluitsnoer, draaiharing)
import { miscParts } from './miscParts.js';
// open catalogue jobs without a model: fixings, floors, refrigeration, chair parts, mobile bench table, coat rack, tape
import { fixings } from './fixings.js';
import { tentFloor } from './tentFloor.js';
import { fridge } from './fridge.js';
import { seatParts } from './seatParts.js';
import { foldTable } from './foldTable.js';
import { tapeRoll } from './tapeRoll.js';
import { coatRack } from './coatRack.js';
import { chairLinker } from './chairLinker.js';

export const MODELS = {
  easyUpTent,
  statafel,
  statafelCover,
  ...stubs,
  barStool, chair, biertafelset, klaptafel, patioTable, bench, barrelTable, tableTop, trolley, stanchion,
  banquetTable,
  opblaasbareTent, opblaasbareTunnel, frameTent, stretchtent, stertent, canopyRoof, marketStall, gardenPavilion, carportTent, shadeSail, tarp,
  buffetCover, heater, heaterElement, floodLight, tentLight, easyUpFrame,
  draagtas, easyUpParts, connectionStrip, rainGutter, tentCoupler, tubeFittings, tentPoles, footCaps, haringen, gewichten,
  wielset, sandbag, waterBag, concreteBlock, protectionDisc, repairKit, airPump, tubeBag, stretchParts, lightParts,
  prikkabel, ropeLight, stringLights, ledBulb, heaterCover,
  carpetRunner, seatCushion, sideWall, tentElastics, miscParts,
  fixings, tentFloor, fridge, seatParts, foldTable, tapeRoll, coatRack, chairLinker,
};
