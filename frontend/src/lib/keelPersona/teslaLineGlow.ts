// keel_web/src/lib/keelPersona/teslaLineGlow.ts

import { KEEL_PERSONA_PRESET_IDS } from "./presetIds";
import type { TeslaLineSweepClip } from "./teslaLineSweep";

/** Hold: persona + straight eyes only (eyes visible, not glowing). */
export const TESLA_EYES_ONLY_MS = 250;

/** Outer rings of both eyes fade in together. */
export const TESLA_OUTER_START_MS = TESLA_EYES_ONLY_MS;
export const TESLA_OUTER_FADE_MS = 550;

/** Inner rings of both eyes fade in after outer completes. */
export const TESLA_INNER_START_MS = TESLA_OUTER_START_MS + TESLA_OUTER_FADE_MS;
export const TESLA_INNER_FADE_MS = 550;

/** Mouth lines + eye-dot glow fade in together after both rings are lit. */
export const TESLA_CORE_START_MS = TESLA_INNER_START_MS + TESLA_INNER_FADE_MS;
export const TESLA_CORE_FADE_MS = 550;

/** Fully-charged hold before power-down. */
export const TESLA_LIT_HOLD_MS = 1500;

/** Everything powers down (lines + eye glow) back to the initial state. */
export const TESLA_POWER_DOWN_START_MS =
  TESLA_CORE_START_MS + TESLA_CORE_FADE_MS + TESLA_LIT_HOLD_MS;
export const TESLA_POWER_DOWN_MS = 700;

/** Short reset beat before the loop restarts. */
export const TESLA_END_HOLD_MS = 200;

/** Straight-gaze eye scale before glow charges (half of design size). */
export const TESLA_EYE_REST_SCALE = 0.5;

/** Straight-gaze eye scale at full glow. */
export const TESLA_EYE_LIT_SCALE = 1;

export const TESLA_LOOP_MS =
  TESLA_POWER_DOWN_START_MS + TESLA_POWER_DOWN_MS + TESLA_END_HOLD_MS;

const TESLA_MOUTH_IDS = new Set<string>([
  KEEL_PERSONA_PRESET_IDS.mouthOuterLine1,
  KEEL_PERSONA_PRESET_IDS.mouthOuterLine2,
  KEEL_PERSONA_PRESET_IDS.mouthOuterLine3,
  KEEL_PERSONA_PRESET_IDS.mouthOuterLine4,
  KEEL_PERSONA_PRESET_IDS.mouthOuterLine5,
  KEEL_PERSONA_PRESET_IDS.mouthInnerLine1,
  KEEL_PERSONA_PRESET_IDS.mouthInnerLine2,
  KEEL_PERSONA_PRESET_IDS.mouthInnerLine3,
  KEEL_PERSONA_PRESET_IDS.mouthInnerLine4,
  KEEL_PERSONA_PRESET_IDS.mouthInnerLine5,
]);

const TESLA_OUTER_IDS = new Set<string>([
  KEEL_PERSONA_PRESET_IDS.leftEyeLine1,
  KEEL_PERSONA_PRESET_IDS.leftEyeLine2,
  KEEL_PERSONA_PRESET_IDS.leftEyeLine3,
  KEEL_PERSONA_PRESET_IDS.leftEyeLine4,
  KEEL_PERSONA_PRESET_IDS.leftEyeLine5,
  KEEL_PERSONA_PRESET_IDS.rightEyeLine1,
  KEEL_PERSONA_PRESET_IDS.rightEyeLine2,
  KEEL_PERSONA_PRESET_IDS.rightEyeLine3,
  KEEL_PERSONA_PRESET_IDS.rightEyeLine4,
  KEEL_PERSONA_PRESET_IDS.rightEyeLine5,
]);

const TESLA_INNER_IDS = new Set<string>([
  KEEL_PERSONA_PRESET_IDS.leftInnerEyeLine1,
  KEEL_PERSONA_PRESET_IDS.leftInnerEyeLine2,
  KEEL_PERSONA_PRESET_IDS.leftInnerEyeLine3,
  KEEL_PERSONA_PRESET_IDS.leftInnerEyeLine4,
  KEEL_PERSONA_PRESET_IDS.leftInnerEyeLine5,
  KEEL_PERSONA_PRESET_IDS.rightInnerEyeLine1,
  KEEL_PERSONA_PRESET_IDS.rightInnerEyeLine2,
  KEEL_PERSONA_PRESET_IDS.rightInnerEyeLine3,
  KEEL_PERSONA_PRESET_IDS.rightInnerEyeLine4,
  KEEL_PERSONA_PRESET_IDS.rightInnerEyeLine5,
]);

export type TeslaLineRole = "mouth" | "outer" | "inner";

export function getTeslaLineRoleFromElement(
  elementId: string,
  elementName: string,
): TeslaLineRole | null {
  if (TESLA_MOUTH_IDS.has(elementId) || /^mouth\b/i.test(elementName)) {
    return "mouth";
  }

  if (TESLA_OUTER_IDS.has(elementId) || /^(?:left|right) outer eye \d$/i.test(elementName)) {
    return "outer";
  }

  if (TESLA_INNER_IDS.has(elementId) || /^(?:left|right) inner eye \d$/i.test(elementName)) {
    return "inner";
  }

  return null;
}

function clamp01(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

function loopTime(elapsedMs: number): number {
  return ((elapsedMs % TESLA_LOOP_MS) + TESLA_LOOP_MS) % TESLA_LOOP_MS;
}

function fadeInClip(t: number, startMs: number, durationMs: number): TeslaLineSweepClip {
  if (t < startMs) {
    return "hidden";
  }
  if (t >= startMs + durationMs) {
    return "full";
  }
  return {
    mode: "fadeIn",
    progress: clamp01((t - startMs) / durationMs),
  };
}

function applyPowerDown(clip: TeslaLineSweepClip, t: number): TeslaLineSweepClip {
  if (t < TESLA_POWER_DOWN_START_MS) {
    return clip;
  }
  if (t >= TESLA_POWER_DOWN_START_MS + TESLA_POWER_DOWN_MS) {
    return "hidden";
  }
  if (clip === "hidden") {
    return "hidden";
  }
  return {
    mode: "fadeOut",
    progress: clamp01((t - TESLA_POWER_DOWN_START_MS) / TESLA_POWER_DOWN_MS),
  };
}

function resolveTeslaLineGlowClipBeforePowerDown(
  role: TeslaLineRole,
  t: number,
): TeslaLineSweepClip {
  if (role === "outer") {
    return fadeInClip(t, TESLA_OUTER_START_MS, TESLA_OUTER_FADE_MS);
  }
  if (role === "inner") {
    return fadeInClip(t, TESLA_INNER_START_MS, TESLA_INNER_FADE_MS);
  }
  return fadeInClip(t, TESLA_CORE_START_MS, TESLA_CORE_FADE_MS);
}

export function getTeslaLineGlowClip(
  elementId: string,
  elementName: string,
  elapsedMs: number,
): TeslaLineSweepClip {
  const role = getTeslaLineRoleFromElement(elementId, elementName);
  if (!role) {
    return "hidden";
  }

  const t = loopTime(elapsedMs);
  return applyPowerDown(resolveTeslaLineGlowClipBeforePowerDown(role, t), t);
}

/**
 * Straight-gaze eye glow intensity (0 = white fill only, 1 = full white bloom).
 * Fades in with the mouth, then powers down with everything else.
 */
export function getTeslaEyeGlowIntensity(elapsedMs: number): number {
  const t = loopTime(elapsedMs);

  if (t < TESLA_CORE_START_MS) {
    return 0;
  }

  if (t < TESLA_CORE_START_MS + TESLA_CORE_FADE_MS) {
    return clamp01((t - TESLA_CORE_START_MS) / TESLA_CORE_FADE_MS);
  }

  if (t < TESLA_POWER_DOWN_START_MS) {
    return 1;
  }

  if (t < TESLA_POWER_DOWN_START_MS + TESLA_POWER_DOWN_MS) {
    return 1 - clamp01((t - TESLA_POWER_DOWN_START_MS) / TESLA_POWER_DOWN_MS);
  }

  return 0;
}

function lerpEyeScale(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp01(progress);
}

/**
 * Straight-gaze eye scale for The Tesla — half size on appear, grows with glow
 * fade-in, holds at full size, then shrinks back during power-down.
 */
export function getTeslaEyeScaleMultiplier(elapsedMs: number): number {
  const t = loopTime(elapsedMs);
  const rest = TESLA_EYE_REST_SCALE;
  const lit = TESLA_EYE_LIT_SCALE;

  if (t < TESLA_CORE_START_MS) {
    return rest;
  }

  if (t < TESLA_CORE_START_MS + TESLA_CORE_FADE_MS) {
    return lerpEyeScale(rest, lit, (t - TESLA_CORE_START_MS) / TESLA_CORE_FADE_MS);
  }

  if (t < TESLA_POWER_DOWN_START_MS) {
    return lit;
  }

  if (t < TESLA_POWER_DOWN_START_MS + TESLA_POWER_DOWN_MS) {
    return lerpEyeScale(lit, rest, (t - TESLA_POWER_DOWN_START_MS) / TESLA_POWER_DOWN_MS);
  }

  return rest;
}
