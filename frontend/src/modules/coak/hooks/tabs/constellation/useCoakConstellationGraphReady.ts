// keel_web/src/modules/coak/hooks/tabs/constellation/useCoakConstellationGraphReady.ts

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_OVERLAY_MS = 300;
const OVERLAY_FADE_MS = 450;

type OverlayPhase = "visible" | "fading" | "hidden";

export type CoakConstellationGraphReadyState = {
  showLoadingOverlay: boolean;
  overlayFading: boolean;
  /** Mount the WebGL scene once API data is ready so it can warm up behind the overlay. */
  mountGraph: boolean;
  /** Reveal the warmed graph only after the overlay has fully dismissed. */
  revealGraph: boolean;
  markGraphPainted: () => void;
};

export function useCoakConstellationGraphReady(
  recordId: number | null | undefined,
  isLoading: boolean,
): CoakConstellationGraphReadyState {
  const [overlayPhase, setOverlayPhase] = useState<OverlayPhase>("visible");
  const [graphPainted, setGraphPainted] = useState(false);
  const overlayPhaseRef = useRef<OverlayPhase>("visible");
  const overlayShownAtRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const showOverlay = () => {
    clearTimers();
    overlayPhaseRef.current = "visible";
    setOverlayPhase("visible");
    overlayShownAtRef.current = performance.now();
  };

  const scheduleDismiss = () => {
    clearTimers();

    const shownAt = overlayShownAtRef.current ?? performance.now();
    const elapsed = performance.now() - shownAt;
    const remaining = Math.max(0, MIN_OVERLAY_MS - elapsed);

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      overlayPhaseRef.current = "fading";
      setOverlayPhase("fading");

      fadeTimerRef.current = window.setTimeout(() => {
        fadeTimerRef.current = null;
        overlayPhaseRef.current = "hidden";
        setOverlayPhase("hidden");
      }, OVERLAY_FADE_MS);
    }, remaining);
  };

  const markGraphPainted = useCallback(() => {
    setGraphPainted(true);
  }, []);

  useEffect(() => {
    setGraphPainted(false);
    showOverlay();
  }, [recordId]);

  useEffect(() => {
    if (isLoading) {
      showOverlay();
      return;
    }

    if (!graphPainted) {
      return;
    }

    scheduleDismiss();
    return clearTimers;
  }, [graphPainted, isLoading, recordId]);

  useEffect(
    () => () => {
      clearTimers();
    },
    [],
  );

  const showLoadingOverlay = overlayPhase !== "hidden";

  return {
    showLoadingOverlay,
    overlayFading: overlayPhase === "fading",
    mountGraph: !isLoading,
    revealGraph: !showLoadingOverlay,
    markGraphPainted,
  };
}
