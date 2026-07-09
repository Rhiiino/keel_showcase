// keel_web/src/lib/keelPersona/designCanvas.ts

import { DEFAULT_KEEL_LOADING_ICON_SIZE_PX } from "./geometry/loadingIconGeometry";
import { DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX } from "./types";

/** Authoring resolution for preset geometry (keel.png + element coordinates). */
export const KEEL_PERSONA_DESIGN_CANVAS_PX = DEFAULT_KEEL_LOADING_ICON_SIZE_PX;

export function keelPersonaDisplayScale(
  displaySizePx: number = DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX,
): number {
  return displaySizePx / KEEL_PERSONA_DESIGN_CANVAS_PX;
}
