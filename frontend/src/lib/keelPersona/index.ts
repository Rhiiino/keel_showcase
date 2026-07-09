// keel_web/src/lib/keelPersona/index.ts

export * from "./types";
export * from "./applyLook";
export * from "./captionBank";
export * from "./clipRegistry";
export * from "./resolveCaption";
export {
  getKeelPersonaCenterPointPivotOrigin,
} from "./elements/baseDesign";
export {
  KEEL_PERSONA_PROMOTED_BASE_OFFSET,
  KEEL_PERSONA_PROMOTED_ELEMENTS,
} from "./promotedDesign";
export {
  KEEL_PERSONA_PRELOAD_MEDIA,
  resolveKeelPersonaMediaSrc,
} from "./mediaAssets";
export { preloadKeelPersonaMedia, preloadKeelPersonaMediaUrls } from "./preloadKeelPersonaMedia";
export { isStraightGazeEyeDot, isGazeEyeDot } from "./happyEyeMorph";
export { extractGazeGroupId } from "./gazeTransition";

import { registerAllKeelCaptions } from "./captions/index";
import { registerAllKeelClips } from "./clips/index";

registerAllKeelClips();
registerAllKeelCaptions();
