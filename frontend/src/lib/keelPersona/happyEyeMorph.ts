// keel_web/src/lib/keelPersona/happyEyeMorph.ts

import type { KeelPersonaDotElement } from "./types";

// Morph timings live in the `keel-happy-eye-morph` and `keel-squint-eye` CSS
// keyframes (src/index.css) so playback runs off the main thread.

export const KEEL_LEFT_EYE_STRAIGHT_ID = "preset-left-eye-straight";
export const KEEL_RIGHT_EYE_STRAIGHT_ID = "preset-right-eye-straight";

export const KEEL_LEFT_EYE_IDS = new Set<string>([
  KEEL_LEFT_EYE_STRAIGHT_ID,
  "preset-left-eye-bottom-left",
  "preset-left-eye-bottom-right",
  "preset-left-eye-top-left",
  "preset-left-eye-top-right",
]);

export const KEEL_RIGHT_EYE_IDS = new Set<string>([
  KEEL_RIGHT_EYE_STRAIGHT_ID,
  "preset-right-eye-bottom-left",
  "preset-right-eye-bottom-right",
  "preset-right-eye-top-left",
  "preset-right-eye-top-right",
]);

const STRAIGHT_GAZE_EYE_DOT_IDS = new Set<string>([
  KEEL_LEFT_EYE_STRAIGHT_ID,
  KEEL_RIGHT_EYE_STRAIGHT_ID,
]);

export function isGazeEyeDot(element: KeelPersonaDotElement): boolean {
  return (
    element.slot === "eyes" &&
    (element.tags?.includes("gaze") ?? false) &&
    (KEEL_LEFT_EYE_IDS.has(element.id) || KEEL_RIGHT_EYE_IDS.has(element.id))
  );
}

export function isStraightGazeEyeDot(element: KeelPersonaDotElement): boolean {
  if (STRAIGHT_GAZE_EYE_DOT_IDS.has(element.id)) {
    return true;
  }

  return (
    element.groupId === "gaze-straight" &&
    element.slot === "eyes" &&
    (element.tags?.includes("gaze") ?? false)
  );
}

export function isLeftGazeEyeDot(element: KeelPersonaDotElement): boolean {
  return KEEL_LEFT_EYE_IDS.has(element.id);
}
