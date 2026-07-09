// keel_web/src/lib/keelPersona/captions/index.ts

import { registerKeelCaptions } from "../resolveCaption";
import { BAKING_CAPTIONS } from "./baking";
import { DISGUISE_CAPTIONS } from "./disguise";
import { LOADING_CAPTIONS } from "./loading";
import { PIRATE_CAPTIONS } from "./pirate";
import { SAILOR_CAPTIONS } from "./sailor";
import { TESLA_CAPTIONS } from "./tesla";

export const DEFAULT_KEEL_CAPTIONS = [
  ...BAKING_CAPTIONS,
  ...LOADING_CAPTIONS,
  ...DISGUISE_CAPTIONS,
  ...PIRATE_CAPTIONS,
  ...SAILOR_CAPTIONS,
  ...TESLA_CAPTIONS,
];

export {
  BAKING_CAPTIONS,
  DISGUISE_CAPTIONS,
  LOADING_CAPTIONS,
  PIRATE_CAPTIONS,
  SAILOR_CAPTIONS,
  TESLA_CAPTIONS,
};

export function registerAllKeelCaptions(): void {
  registerKeelCaptions(DEFAULT_KEEL_CAPTIONS);
}
