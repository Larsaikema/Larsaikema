// Model registry: spec.model -> builder(params) -> { object, detail?, meta? }
import { easyUpTent } from './easyUpTent.js';
import { statafel } from './statafel.js';
import { statafelCover } from './statafelCover.js';
import * as stubs from './stubs.js';

export const MODELS = {
  easyUpTent,
  statafel,
  statafelCover,
  ...stubs,
};
