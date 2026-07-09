// keel_web/src/lib/keelPersona/motionPlayback.ts

import { extractGazeGroupId, resolveGazeTravelDirection } from "./gazeTransition";
import { KEEL_PERSONA_DESIGN_CANVAS_PX } from "./designCanvas";
import type {
  KeelAnimationClip,
  KeelAnimationLayers,
  KeelBodyShiftDirection,
  KeelPersonaLook,
  KeelSquintEyeSide,
} from "./types";

export const KEEL_BODY_SHIFT_DURATION_MS = 750;
export const KEEL_BODY_SHIFT_TRANSLATE_RATIO = 0.25;
export const KEEL_BODY_SHIFT_HOP_HEIGHT_RATIO = 0.06;
export const KEEL_BODY_SHIFT_HOP_LEAN_DEG = 2.5;

export const KEEL_BODY_SHIFT_TRANSLATE_PX =
  KEEL_PERSONA_DESIGN_CANVAS_PX * KEEL_BODY_SHIFT_TRANSLATE_RATIO;
const KEEL_BODY_SHIFT_HOP_HEIGHT_PX =
  KEEL_PERSONA_DESIGN_CANVAS_PX * KEEL_BODY_SHIFT_HOP_HEIGHT_RATIO;
const KEEL_BODY_SHIFT_HOP_COUNT = 3;
const KEEL_BODY_SHIFT_KEYFRAME_SAMPLES = 48;

/**
 * Per-step motion command for the body shift layer. Consumed by
 * `LoadingIconBodyShiftLayer`, which plays the hop as a Web Animations API
 * transform animation on the compositor (no per-frame JS).
 */
export type KeelBodyShiftPlayback = {
  direction: KeelBodyShiftDirection | undefined;
  durationMs: number;
  stepIndex: number;
  isPlaying: boolean;
};

/**
 * Per-step gaze travel descriptor. The element stack mounts blend dots at the
 * destination and slides them in with a CSS animation.
 */
export type KeelGazeBlendState = {
  fromGroupId: string;
  toGroupId: string;
  durationMs: number;
};

export type KeelPersonaStepMotion = {
  bodyShift: KeelBodyShiftPlayback;
  gazeBlend: KeelGazeBlendState | null;
  squintEyeSide: KeelSquintEyeSide | undefined;
};

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

type HopMotionSample = {
  horizontalFactor: number;
  verticalPx: number;
  leanFactor: number;
};

function sampleDirectionalHop(progress: number): HopMotionSample {
  if (progress <= 0) {
    return { horizontalFactor: 0, verticalPx: 0, leanFactor: 0 };
  }

  if (progress >= 1) {
    return { horizontalFactor: 1, verticalPx: 0, leanFactor: 0 };
  }

  const scaledProgress = progress * KEEL_BODY_SHIFT_HOP_COUNT;
  const hopIndex = Math.min(KEEL_BODY_SHIFT_HOP_COUNT - 1, Math.floor(scaledProgress));
  const localProgress = scaledProgress - hopIndex;
  const segmentStart = hopIndex / KEEL_BODY_SHIFT_HOP_COUNT;
  const segmentEnd = (hopIndex + 1) / KEEL_BODY_SHIFT_HOP_COUNT;
  const arc = Math.sin(localProgress * Math.PI);

  return {
    horizontalFactor:
      segmentStart + (segmentEnd - segmentStart) * easeOutCubic(localProgress),
    verticalPx: -arc * KEEL_BODY_SHIFT_HOP_HEIGHT_PX,
    leanFactor: arc,
  };
}

function getPreviousStepGazeGroup(
  clip: KeelAnimationClip | null,
  stepIndex: number,
): string | null {
  if (!clip || stepIndex <= 0) {
    return null;
  }

  const previousStep = clip.steps[stepIndex - 1];
  if (!previousStep) {
    return null;
  }

  return extractGazeGroupId(previousStep.look?.visibleGroupIds ?? []);
}

type ResolveKeelPersonaStepMotionOptions = {
  clip: KeelAnimationClip | null;
  stepIndex: number;
  stepDurationMs: number;
  layers: KeelAnimationLayers;
  currentLook: Partial<KeelPersonaLook> | null;
  isPlaying: boolean;
};

/**
 * Derive per-step motion descriptors from the active clip step. Pure and
 * cheap — called once per step change; all tweening happens in CSS/WAAPI.
 */
export function resolveKeelPersonaStepMotion({
  clip,
  stepIndex,
  stepDurationMs,
  layers,
  currentLook,
  isPlaying,
}: ResolveKeelPersonaStepMotionOptions): KeelPersonaStepMotion {
  const durationMs = stepDurationMs > 0 ? stepDurationMs : 250;

  if (!isPlaying) {
    return {
      bodyShift: { direction: undefined, durationMs, stepIndex, isPlaying: false },
      gazeBlend: null,
      squintEyeSide: undefined,
    };
  }

  const currentGazeGroup = extractGazeGroupId(currentLook?.visibleGroupIds ?? []);
  const previousGazeGroup = getPreviousStepGazeGroup(clip, stepIndex);

  const gazeBlendActive =
    !!layers.gazeTransition &&
    !!previousGazeGroup &&
    !!currentGazeGroup &&
    previousGazeGroup !== currentGazeGroup;

  const direction = gazeBlendActive
    ? resolveGazeTravelDirection(previousGazeGroup, currentGazeGroup)
    : layers.bodyShiftDirection;

  return {
    bodyShift: { direction, durationMs, stepIndex, isPlaying: true },
    gazeBlend: gazeBlendActive
      ? {
          fromGroupId: previousGazeGroup,
          toGroupId: currentGazeGroup,
          durationMs,
        }
      : null,
    squintEyeSide: layers.squintEyeSide,
  };
}

/**
 * Sample the triple-hop travel curve into WAAPI transform keyframes so the
 * compositor can play the whole trajectory without main-thread involvement.
 */
export function buildKeelBodyShiftKeyframes(
  fromPx: number,
  toPx: number,
  sign: 1 | -1,
): Keyframe[] {
  const frames: Keyframe[] = [];

  for (let index = 0; index <= KEEL_BODY_SHIFT_KEYFRAME_SAMPLES; index += 1) {
    const hop = sampleDirectionalHop(index / KEEL_BODY_SHIFT_KEYFRAME_SAMPLES);
    const translateXPx = fromPx + (toPx - fromPx) * hop.horizontalFactor;
    const rotateDeg = sign * KEEL_BODY_SHIFT_HOP_LEAN_DEG * hop.leanFactor;

    frames.push({
      transform: `translate3d(${translateXPx}px, ${hop.verticalPx}px, 0) rotate(${rotateDeg}deg)`,
    });
  }

  return frames;
}
