// keel_web/src/lib/keelPersona/eyeScale.ts

import {
  KEEL_LEFT_EYE_STRAIGHT_ID,
  KEEL_RIGHT_EYE_STRAIGHT_ID,
} from "./happyEyeMorph";
import type { KeelAnimationLayers } from "./types";

export function resolveKeelEyeScaleMultiplier(
  elementId: string,
  layers: Pick<KeelAnimationLayers, "eyeScale" | "eyeScaleLeft" | "eyeScaleRight">,
): number {
  const sharedScale = layers.eyeScale ?? 1;
  const hasAsymmetricScale =
    layers.eyeScaleLeft !== undefined || layers.eyeScaleRight !== undefined;

  if (!hasAsymmetricScale) {
    return sharedScale;
  }

  if (elementId === KEEL_LEFT_EYE_STRAIGHT_ID) {
    return layers.eyeScaleLeft ?? sharedScale;
  }

  if (elementId === KEEL_RIGHT_EYE_STRAIGHT_ID) {
    return layers.eyeScaleRight ?? sharedScale;
  }

  return sharedScale;
}
