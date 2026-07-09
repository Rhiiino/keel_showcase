// keel_web/src/lib/keelPersona/loadingTimeline.ts

import { applyKeelPersonaLook } from "./applyLook";
import { KEEL_PERSONA_DESIGN_CANVAS_PX } from "./designCanvas";
import { resolveKeelEyeScaleMultiplier } from "./eyeScale";
import {
  KEEL_GAZE_GROUP_POSITIONS,
  extractGazeGroupId,
} from "./gazeTransition";
import { percentToPixel } from "./geometry/loadingIconGeometry";
import {
  isGazeEyeDot,
  isLeftGazeEyeDot,
  isStraightGazeEyeDot,
} from "./happyEyeMorph";
import {
  KEEL_BODY_SHIFT_DURATION_MS,
  KEEL_BODY_SHIFT_TRANSLATE_PX,
} from "./motionPlayback";
import type {
  KeelAnimationClip,
  KeelAnimationLayers,
  KeelAnimationStep,
  KeelPersonaDotElement,
  KeelPersonaElement,
} from "./types";

/**
 * Compiles a registered clip's step choreography into Web Animations API
 * keyframe tracks that play the entire loop on the compositor. Loading overlays
 * apply these tracks with `iterations: Infinity` so clips stay fluid even while
 * the host surface (WebGL scene build, hydration) blocks the main thread — the
 * per-step `setTimeout` clock used for the dev builder cannot survive that block.
 */

// ----- Constants
const SPAWN_MS = 120;
const DESPAWN_MS = 120;
const DROP_MS = 600;
const DROP_FROM_PX = -140;
const EYE_SCALE_MS = 400;
const SQUINT_MS = 80;
const SQUINT_SCALE_Y = 0.18;
const OPACITY_FADE_MS = 70;
const WIGGLE_DEG = 7;
const WIGGLE_PERIOD_MS = 785;
const SPIN_PERIOD_MS = 3000;
const SPIN_SAMPLES_PER_CYCLE = 12;
const BRANCH_POKE_X_PX = 52;
const BRANCH_POKE_Y_PX = 52;
const BRANCH_POKE_EASING = "cubic-bezier(0.45, 0, 0.55, 1)";
const STRAIGHT_EYE_BLINK_MS = 150;

const DROP_EASING = "cubic-bezier(0.34, 1.3, 0.64, 1)";
const POP_EASING = "cubic-bezier(0.33, 1, 0.68, 1)";
const EYE_EASING = "ease";
const GAZE_EASING = "cubic-bezier(0.45, 0, 0.55, 1)";
const HOP_SAMPLE_COUNT = 16;
const HOP_HEIGHT_PX = KEEL_PERSONA_DESIGN_CANVAS_PX * 0.06;
const HOP_LEAN_DEG = 2.5;
const HOP_COUNT = 3;

// ----- Public types
export type KeelLoadingTimelineTrack = {
  /** Target selector key placed on the element node via `data-keel-lp`. */
  elementId: string;
  keyframes: Keyframe[];
};

export type KeelLoadingTimeline = {
  durationMs: number;
  tracks: KeelLoadingTimelineTrack[];
  /** Whole-body hop track applied to the body-shift layer, or null when unused. */
  bodyKeyframes: Keyframe[] | null;
};


// ----- Step timing helpers
type StepWindow = {
  step: KeelAnimationStep;
  startMs: number;
  endMs: number;
};

function buildStepWindows(clip: KeelAnimationClip): { windows: StepWindow[]; durationMs: number } {
  const windows: StepWindow[] = [];
  let cursor = 0;

  for (const step of clip.steps) {
    const duration = Math.max(1, step.durationMs);
    windows.push({ step, startMs: cursor, endMs: cursor + duration });
    cursor += duration;
  }

  return { windows, durationMs: Math.max(1, cursor) };
}

function clampOffset(value: number): number {
  return Math.min(1, Math.max(0, value));
}


// ----- Keyframe builders
type KeyframeEntry = {
  offset: number;
  opacity: number;
  transform: string;
  easing?: string;
  transformOrigin?: string;
};

function pushKeyframe(entries: KeyframeEntry[], entry: KeyframeEntry): void {
  const offset = clampOffset(entry.offset);
  const last = entries[entries.length - 1];
  if (last && Math.abs(last.offset - offset) < 1e-6) {
    // Replace a coincident keyframe so the latest state wins at that instant.
    entries[entries.length - 1] = { ...entry, offset };
    return;
  }
  entries.push({ ...entry, offset });
}

function finalizeTrack(elementId: string, entries: KeyframeEntry[]): KeelLoadingTimelineTrack | null {
  if (entries.length === 0) {
    return null;
  }

  const ordered = [...entries].sort((left, right) => left.offset - right.offset);
  // Collapse any coincident offsets (WAAPI requires strictly ascending offsets);
  // the later state at a given instant wins.
  const sorted: KeyframeEntry[] = [];
  for (const entry of ordered) {
    const last = sorted[sorted.length - 1];
    if (last && Math.abs(last.offset - entry.offset) < 1e-6) {
      sorted[sorted.length - 1] = { ...entry, offset: last.offset };
    } else {
      sorted.push(entry);
    }
  }

  if (sorted[0]!.offset > 0) {
    sorted.unshift({ ...sorted[0]!, offset: 0 });
  }
  if (sorted[sorted.length - 1]!.offset < 1) {
    sorted.push({ ...sorted[sorted.length - 1]!, offset: 1, easing: undefined });
  }

  const keyframes: Keyframe[] = sorted.map((entry) => {
    const frame: Keyframe = {
      offset: entry.offset,
      opacity: entry.opacity,
      transform: entry.transform,
    };
    if (entry.easing) {
      frame.easing = entry.easing;
    }
    if (entry.transformOrigin) {
      frame.transformOrigin = entry.transformOrigin;
    }
    return frame;
  });

  return { elementId, keyframes };
}


// ----- Media element track (accessories: drop / spawn / despawn / wiggle / branch poke)
function mediaTransform(
  translateXPx: number,
  translateYPx: number,
  scale: number,
  rotateDeg: number,
): string {
  return `translate3d(${translateXPx}px, ${translateYPx}px, 0) scale(${scale}) rotate(${rotateDeg}deg)`;
}

function mediaSettledScale(visible: boolean): number {
  return visible ? 1 : 0;
}

function stepSpawnsGroup(
  layers: KeelAnimationLayers,
  groupId: string | undefined,
): boolean {
  return groupId !== undefined && (layers.spawnScaleGroupIds?.includes(groupId) ?? false);
}

function stepDespawnsGroup(
  layers: KeelAnimationLayers,
  groupId: string | undefined,
): boolean {
  return groupId !== undefined && (layers.despawnScaleGroupIds?.includes(groupId) ?? false);
}

function buildMediaTrack(
  element: KeelPersonaElement,
  windows: StepWindow[],
  durationMs: number,
  visibilityByStep: boolean[],
): KeelLoadingTimelineTrack | null {
  const entries: KeyframeEntry[] = [];
  const groupId = element.groupId;

  windows.forEach((window, index) => {
    const layers = window.step.layers ?? {};
    const visible = visibilityByStep[index] ?? false;
    const wasVisible = index > 0 ? (visibilityByStep[index - 1] ?? false) : (visibilityByStep[windows.length - 1] ?? false);
    const start = window.startMs / durationMs;

    const spawning =
      visible && groupId !== undefined && (layers.spawnScaleGroupIds?.includes(groupId) ?? false);
    const despawning =
      groupId !== undefined && (layers.despawnScaleGroupIds?.includes(groupId) ?? false);
    const dropping =
      visible && groupId !== undefined && (layers.dropGroupIds?.includes(groupId) ?? false);
    const wiggling =
      visible && groupId !== undefined && (layers.groupWiggleIds?.includes(groupId) ?? false);
    const spinning =
      visible &&
      ((groupId !== undefined && (layers.groupSpinIds?.includes(groupId) ?? false)) ||
        (layers.elementSpinIds?.includes(element.id) ?? false));
    const branchPoking =
      visible &&
      !!layers.branchPoke &&
      groupId !== undefined &&
      (layers.branchPokeGroupIds ?? ["prop-branch"]).includes(groupId);

    if (spawning) {
      pushKeyframe(entries, { offset: start, opacity: 1, transform: mediaTransform(0, 0, 0, 0), easing: POP_EASING });
      pushKeyframe(entries, {
        offset: (window.startMs + SPAWN_MS) / durationMs,
        opacity: 1,
        transform: mediaTransform(0, 0, 1, 0),
      });
    } else if (despawning) {
      pushKeyframe(entries, { offset: start, opacity: 1, transform: mediaTransform(0, 0, 1, 0), easing: POP_EASING });
      pushKeyframe(entries, {
        offset: (window.startMs + DESPAWN_MS) / durationMs,
        opacity: 1,
        transform: mediaTransform(0, 0, 0, 0),
      });
    } else if (dropping) {
      pushKeyframe(entries, { offset: start, opacity: 1, transform: mediaTransform(0, DROP_FROM_PX, 1, 0), easing: DROP_EASING });
      pushKeyframe(entries, {
        offset: (window.startMs + DROP_MS) / durationMs,
        opacity: 1,
        transform: mediaTransform(0, 0, 1, 0),
      });
    } else if (branchPoking) {
      const stepMs = window.endMs - window.startMs;
      const pokeMarks = [0, 0.125, 0.25, 0.375, 0.5, 1] as const;
      const pokeOffsets = [
        [0, 0],
        [BRANCH_POKE_X_PX, BRANCH_POKE_Y_PX],
        [0, 0],
        [BRANCH_POKE_X_PX, BRANCH_POKE_Y_PX],
        [0, 0],
        [0, 0],
      ] as const;
      pokeMarks.forEach((mark, pokeIndex) => {
        const [xPx, yPx] = pokeOffsets[pokeIndex]!;
        pushKeyframe(entries, {
          offset: (window.startMs + stepMs * mark) / durationMs,
          opacity: 1,
          transform: mediaTransform(xPx, yPx, 1, 0),
          easing: pokeIndex === 0 ? BRANCH_POKE_EASING : undefined,
        });
      });
    } else if (wiggling) {
      // Oscillate rotation across the step so the wiggle plays on the compositor.
      const cycles = Math.max(1, Math.round((window.endMs - window.startMs) / WIGGLE_PERIOD_MS));
      const totalSamples = cycles * 4;
      for (let sample = 0; sample <= totalSamples; sample += 1) {
        const t = window.startMs + ((window.endMs - window.startMs) * sample) / totalSamples;
        const phase = (sample % 4) === 1 ? WIGGLE_DEG : (sample % 4) === 3 ? -WIGGLE_DEG : 0;
        pushKeyframe(entries, { offset: t / durationMs, opacity: 1, transform: mediaTransform(0, 0, 1, phase), easing: "ease-in-out" });
      }
    } else if (spinning) {
      const cycles = Math.max(1, Math.ceil((window.endMs - window.startMs) / SPIN_PERIOD_MS));
      const totalSamples = cycles * SPIN_SAMPLES_PER_CYCLE;
      for (let sample = 0; sample <= totalSamples; sample += 1) {
        const t = window.startMs + ((window.endMs - window.startMs) * sample) / totalSamples;
        const rotateDeg = (360 * sample) / totalSamples;
        pushKeyframe(entries, {
          offset: t / durationMs,
          opacity: 1,
          transform: mediaTransform(0, 0, 1, rotateDeg),
          transformOrigin: "0 0",
          easing: "linear",
        });
      }
    } else {
      // Settled hold (visible or hidden). Hidden accessories stay at scale(0) so
      // WAAPI does not crossfade scale while opacity is 0 before a spawn step.
      // Skip pre-step opacity fades beside spawn/despawn beats — they injected
      // scale(1) keyframes that interrupted pop-in/out tracks on corner props.
      const prevWindow = index > 0 ? windows[index - 1]! : windows[windows.length - 1]!;
      const nextWindow = index < windows.length - 1 ? windows[index + 1]! : windows[0]!;
      const prevLayers = prevWindow.step.layers ?? {};
      const nextLayers = nextWindow.step.layers ?? {};
      const spawnDespawnAdjacent =
        stepDespawnsGroup(prevLayers, groupId) ||
        stepSpawnsGroup(nextLayers, groupId) ||
        stepDespawnsGroup(nextLayers, groupId);
      const settledScale = mediaSettledScale(visible);

      if (visible !== wasVisible && index > 0 && !spawnDespawnAdjacent) {
        pushKeyframe(entries, {
          offset: Math.max(0, (window.startMs - OPACITY_FADE_MS) / durationMs),
          opacity: wasVisible ? 1 : 0,
          transform: mediaTransform(0, 0, mediaSettledScale(wasVisible), 0),
        });
      }
      pushKeyframe(entries, {
        offset: start,
        opacity: visible ? 1 : 0,
        transform: mediaTransform(0, 0, settledScale, 0),
      });
    }
  });

  return finalizeTrack(element.id, entries);
}


// ----- Dot element track (eyes: gaze slide / eye scale / squint)
function dotTransform(dxPx: number, dyPx: number, scaleX: number, scaleY: number): string {
  return `translate(calc(-50% + ${dxPx}px), calc(-50% + ${dyPx}px)) scale(${scaleX}, ${scaleY})`;
}

function resolveGazeSlideOffset(
  element: KeelPersonaDotElement,
  fromGroupId: string | null,
): { dxPx: number; dyPx: number } | null {
  if (!fromGroupId) {
    return null;
  }
  const positions = KEEL_GAZE_GROUP_POSITIONS[fromGroupId];
  if (!positions) {
    return null;
  }
  const from = isLeftGazeEyeDot(element) ? positions.left : positions.right;
  return {
    dxPx: percentToPixel(from.xPct, KEEL_PERSONA_DESIGN_CANVAS_PX) - element.x,
    dyPx: percentToPixel(from.yPct, KEEL_PERSONA_DESIGN_CANVAS_PX) - element.y,
  };
}

function buildDotTrack(
  element: KeelPersonaDotElement,
  windows: StepWindow[],
  durationMs: number,
  visibilityByStep: boolean[],
): KeelLoadingTimelineTrack | null {
  const entries: KeyframeEntry[] = [];
  const straight = isStraightGazeEyeDot(element);
  const gazeEye = isGazeEyeDot(element);
  const leftEye = isLeftGazeEyeDot(element);

  windows.forEach((window, index) => {
    const layers: KeelAnimationLayers = window.step.layers ?? {};
    const visible = visibilityByStep[index] ?? false;
    const wasVisible = index > 0 ? (visibilityByStep[index - 1] ?? false) : (visibilityByStep[windows.length - 1] ?? false);
    const start = window.startMs / durationMs;

    const scale = straight ? resolveKeelEyeScaleMultiplier(element.id, layers) : 1;

    const squintSide = layers.squintEyeSide;
    const squinting =
      gazeEye && squintSide !== undefined && (squintSide === "left" ? leftEye : !leftEye);
    const scaleY = squinting ? SQUINT_SCALE_Y : 1;

    if (straight && layers.straightEyeBlink && visible) {
      const blinkMidMs = Math.min(
        (window.endMs - window.startMs) * 0.5,
        STRAIGHT_EYE_BLINK_MS * 0.5,
      );
      pushKeyframe(entries, {
        offset: start,
        opacity: 1,
        transform: dotTransform(0, 0, scale, 1),
        easing: GAZE_EASING,
      });
      pushKeyframe(entries, {
        offset: (window.startMs + blinkMidMs) / durationMs,
        opacity: 1,
        transform: dotTransform(0, 0, scale, SQUINT_SCALE_Y),
      });
      pushKeyframe(entries, {
        offset: window.endMs / durationMs,
        opacity: 1,
        transform: dotTransform(0, 0, scale, 1),
      });
      return;
    }

    // Gaze slide: this gaze eye becomes visible at a corner it wasn't at before.
    const prevStep = index > 0 ? windows[index - 1]!.step : windows[windows.length - 1]!.step;
    const currentGaze = extractGazeGroupId(window.step.look?.visibleGroupIds ?? []);
    const previousGaze = extractGazeGroupId(prevStep.look?.visibleGroupIds ?? []);
    const gazeSliding =
      !!layers.gazeTransition &&
      gazeEye &&
      visible &&
      !!currentGaze &&
      !!previousGaze &&
      currentGaze !== previousGaze;

    if (gazeSliding) {
      const offset = resolveGazeSlideOffset(element, previousGaze);
      if (offset) {
        pushKeyframe(entries, {
          offset: start,
          opacity: 1,
          transform: dotTransform(offset.dxPx, offset.dyPx, scale, scaleY),
          easing: GAZE_EASING,
        });
        pushKeyframe(entries, {
          offset: (window.startMs + KEEL_BODY_SHIFT_DURATION_MS) / durationMs,
          opacity: 1,
          transform: dotTransform(0, 0, scale, scaleY),
        });
        return;
      }
    }

    // Quick fade + scale/squint ease on entering this step.
    if (visible !== wasVisible && index > 0) {
      pushKeyframe(entries, {
        offset: Math.max(0, (window.startMs - OPACITY_FADE_MS) / durationMs),
        opacity: wasVisible ? 1 : 0,
        transform: dotTransform(0, 0, scale, scaleY),
      });
    }

    const easeMs = squinting ? SQUINT_MS : straight ? EYE_SCALE_MS : 0;
    pushKeyframe(entries, {
      offset: start,
      opacity: visible ? 1 : 0,
      transform: dotTransform(0, 0, scale, scaleY),
      easing: easeMs > 0 ? (squinting ? POP_EASING : EYE_EASING) : undefined,
    });
    if (easeMs > 0) {
      pushKeyframe(entries, {
        offset: (window.startMs + easeMs) / durationMs,
        opacity: visible ? 1 : 0,
        transform: dotTransform(0, 0, scale, scaleY),
      });
    }
  });

  return finalizeTrack(element.id, entries);
}


// ----- Generic (line / overlay) opacity-only track
function buildGenericTrack(
  element: KeelPersonaElement,
  windows: StepWindow[],
  durationMs: number,
  visibilityByStep: boolean[],
): KeelLoadingTimelineTrack | null {
  const entries: KeyframeEntry[] = [];
  windows.forEach((window, index) => {
    const visible = visibilityByStep[index] ?? false;
    pushKeyframe(entries, {
      offset: window.startMs / durationMs,
      opacity: visible ? 1 : 0,
      transform: "translate(0px, 0px)",
    });
  });
  return finalizeTrack(element.id, entries);
}


// ----- Body hop track
function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

function bodyHopTransform(translateXPx: number, verticalPx: number, rotateDeg: number): string {
  return `translate3d(${translateXPx}px, ${verticalPx}px, 0) rotate(${rotateDeg}deg)`;
}

function buildBodyKeyframes(
  clip: KeelAnimationClip,
  windows: StepWindow[],
  durationMs: number,
): Keyframe[] | null {
  const usesHop = clip.steps.some(
    (step) => step.layers?.gazeTransition || step.layers?.bodyShiftDirection,
  );
  if (!usesHop) {
    return null;
  }

  const entries: KeyframeEntry[] = [];
  let settledPx = 0;

  windows.forEach((window, index) => {
    const layers = window.step.layers ?? {};
    const start = window.startMs / durationMs;

    let direction = layers.bodyShiftDirection;
    if (!direction && layers.gazeTransition) {
      // Derive travel direction from gaze centers, matching runtime playback.
      const prev = index > 0 ? windows[index - 1]!.step : windows[windows.length - 1]!.step;
      const fromGaze = extractGazeGroupId(prev.look?.visibleGroupIds ?? []);
      const toGaze = extractGazeGroupId(window.step.look?.visibleGroupIds ?? []);
      if (fromGaze && toGaze && KEEL_GAZE_GROUP_POSITIONS[fromGaze] && KEEL_GAZE_GROUP_POSITIONS[toGaze]) {
        const fromCenter =
          (KEEL_GAZE_GROUP_POSITIONS[fromGaze]!.left.xPct + KEEL_GAZE_GROUP_POSITIONS[fromGaze]!.right.xPct) / 2;
        const toCenter =
          (KEEL_GAZE_GROUP_POSITIONS[toGaze]!.left.xPct + KEEL_GAZE_GROUP_POSITIONS[toGaze]!.right.xPct) / 2;
        direction = toCenter >= fromCenter ? "right" : "left";
      }
    }

    if (direction) {
      const sign = direction === "right" ? 1 : -1;
      const fromPx = settledPx;
      const toPx = fromPx + sign * KEEL_BODY_SHIFT_TRANSLATE_PX;
      for (let sample = 0; sample <= HOP_SAMPLE_COUNT; sample += 1) {
        const progress = sample / HOP_SAMPLE_COUNT;
        const scaled = progress * HOP_COUNT;
        const hopIndex = Math.min(HOP_COUNT - 1, Math.floor(scaled));
        const localProgress = scaled - hopIndex;
        const segStart = hopIndex / HOP_COUNT;
        const segEnd = (hopIndex + 1) / HOP_COUNT;
        const arc = Math.sin(localProgress * Math.PI);
        const horizontal = segStart + (segEnd - segStart) * easeOutCubic(localProgress);
        const translateX = fromPx + (toPx - fromPx) * horizontal;
        const t = window.startMs + (window.endMs - window.startMs) * progress;
        pushKeyframe(entries, {
          offset: t / durationMs,
          opacity: 1,
          transform: bodyHopTransform(translateX, -arc * HOP_HEIGHT_PX, sign * HOP_LEAN_DEG * arc),
          easing: "linear",
        });
      }
      settledPx = toPx;
    } else {
      pushKeyframe(entries, {
        offset: start,
        opacity: 1,
        transform: bodyHopTransform(settledPx, 0, 0),
      });
    }
  });

  const track = finalizeTrack("__body__", entries);
  return track ? track.keyframes : null;
}


// ----- Compiler entry point
export function buildKeelLoadingTimeline(
  clip: KeelAnimationClip,
  unionElements: readonly KeelPersonaElement[],
): KeelLoadingTimeline {
  const { windows, durationMs } = buildStepWindows(clip);

  const visibilityByElement = new Map<string, boolean[]>();
  for (const element of unionElements) {
    visibilityByElement.set(element.id, []);
  }
  windows.forEach((window) => {
    const looked = applyKeelPersonaLook(unionElements, window.step.look);
    for (const element of looked) {
      visibilityByElement.get(element.id)?.push(element.visible);
    }
  });

  const tracks: KeelLoadingTimelineTrack[] = [];
  for (const element of unionElements) {
    if (element.tags?.includes("pivot")) {
      continue;
    }
    const visibility = visibilityByElement.get(element.id) ?? [];
    let track: KeelLoadingTimelineTrack | null;
    if (element.kind === "dot") {
      track = buildDotTrack(element, windows, durationMs, visibility);
    } else if (element.kind === "media-image") {
      track = buildMediaTrack(element, windows, durationMs, visibility);
    } else {
      track = buildGenericTrack(element, windows, durationMs, visibility);
    }
    if (track) {
      tracks.push(track);
    }
  }

  return {
    durationMs,
    tracks,
    bodyKeyframes: buildBodyKeyframes(clip, windows, durationMs),
  };
}
