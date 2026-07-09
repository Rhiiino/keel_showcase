// keel_web/src/hooks/keelPersona/useKeelLoadingPlayback.ts

import { useEffect, type RefObject } from "react";

import type { KeelLoadingTimeline } from "../../lib/keelPersona/loadingTimeline";

/** Data attribute placed on element nodes so the timeline can target them. */
export const KEEL_LOADING_ELEMENT_ATTR = "data-keel-lp";
/** Data attribute placed on the body-shift layer for the whole-body hop track. */
export const KEEL_LOADING_BODY_ATTR = "data-keel-lp-body";

/**
 * Plays a compiled loading timeline on the compositor via the Web Animations
 * API. Every track loops with `iterations: Infinity` so the clip keeps playing
 * even while the host surface blocks the main thread during a WebGL scene build.
 */
export function useKeelLoadingPlayback(
  stageRef: RefObject<HTMLElement | null>,
  timeline: KeelLoadingTimeline | null,
  enabled: boolean,
): void {
  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !timeline || !stage) {
      return;
    }

    const animations: Animation[] = [];

    const play = (target: Element, keyframes: Keyframe[]) => {
      const animation = target.animate(keyframes, {
        duration: timeline.durationMs,
        iterations: Infinity,
        easing: "linear",
      });
      animations.push(animation);
    };

    for (const track of timeline.tracks) {
      const node = stage.querySelector(
        `[${KEEL_LOADING_ELEMENT_ATTR}="${CSS.escape(track.elementId)}"]`,
      );
      if (node) {
        play(node, track.keyframes);
      }
    }

    if (timeline.bodyKeyframes) {
      const bodyNode = stage.querySelector(`[${KEEL_LOADING_BODY_ATTR}]`);
      if (bodyNode) {
        play(bodyNode, timeline.bodyKeyframes);
      }
    }

    return () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };
  }, [stageRef, timeline, enabled]);
}
