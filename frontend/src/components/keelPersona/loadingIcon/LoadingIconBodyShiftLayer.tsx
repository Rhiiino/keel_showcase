// keel_web/src/components/keelPersona/loadingIcon/LoadingIconBodyShiftLayer.tsx

import { useEffect, useRef, type ReactNode } from "react";

import {
  KEEL_BODY_SHIFT_TRANSLATE_PX,
  buildKeelBodyShiftKeyframes,
  type KeelBodyShiftPlayback,
} from "../../../lib/keelPersona/motionPlayback";

type LoadingIconBodyShiftLayerProps = {
  playback: KeelBodyShiftPlayback;
  children: ReactNode;
};

/**
 * Plays directional hop travel as a Web Animations API transform animation so
 * it stays smooth on the compositor even when the main thread is busy.
 */
export function LoadingIconBodyShiftLayer({
  playback,
  children,
}: LoadingIconBodyShiftLayerProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const settledTranslateRef = useRef(0);
  const animationRef = useRef<Animation | null>(null);
  const previousStepIndexRef = useRef<number | null>(null);
  const previousDirectionRef = useRef<KeelBodyShiftPlayback["direction"]>(undefined);
  const previousPlayingRef = useRef(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }

    if (!playback.isPlaying) {
      animationRef.current?.cancel();
      animationRef.current = null;
      settledTranslateRef.current = 0;
      previousStepIndexRef.current = null;
      previousDirectionRef.current = undefined;
      previousPlayingRef.current = false;
      return;
    }

    const playbackStarted = !previousPlayingRef.current;

    if (
      playbackStarted ||
      (playback.stepIndex === 0 && previousStepIndexRef.current !== 0)
    ) {
      animationRef.current?.cancel();
      animationRef.current = null;
      settledTranslateRef.current = 0;
    }

    if (playback.direction && playback.direction !== previousDirectionRef.current) {
      const sign = playback.direction === "right" ? 1 : -1;
      const fromPx = settledTranslateRef.current;
      const toPx = fromPx + sign * KEEL_BODY_SHIFT_TRANSLATE_PX;

      animationRef.current?.cancel();
      animationRef.current = node.animate(
        buildKeelBodyShiftKeyframes(fromPx, toPx, sign),
        {
          duration: playback.durationMs,
          easing: "linear",
          fill: "forwards",
        },
      );
      settledTranslateRef.current = toPx;
    }

    previousStepIndexRef.current = playback.stepIndex;
    previousDirectionRef.current = playback.direction;
    previousPlayingRef.current = true;
  }, [playback]);

  useEffect(() => {
    return () => {
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, []);

  return (
    <div ref={nodeRef} className="pointer-events-none absolute inset-0">
      {children}
    </div>
  );
}
