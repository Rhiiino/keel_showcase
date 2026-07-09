// keel_web/src/components/keelPersona/KeelAnimationComposer.tsx

import type { ReactNode } from "react";

import type { KeelAnimationLayers } from "../../lib/keelPersona";
import type { KeelBodyShiftPlayback } from "../../lib/keelPersona/motionPlayback";
import { DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX } from "../../lib/keelPersona/types";
import { KEEL_LOADING_BODY_ATTR } from "../../hooks/keelPersona";
import { LoadingIconBodyShiftLayer } from "./loadingIcon/LoadingIconBodyShiftLayer";
import { LoadingIconWobbleLayer } from "./loadingIcon/LoadingIconWobbleLayer";

const IDLE_BODY_SHIFT: KeelBodyShiftPlayback = {
  direction: undefined,
  durationMs: 0,
  stepIndex: 0,
  isPlaying: false,
};

type KeelAnimationComposerProps = {
  layers: KeelAnimationLayers;
  pivotOriginPct: string;
  size?: number;
  bodyShift?: KeelBodyShiftPlayback;
  children: ReactNode;
  staticOverlay?: ReactNode;
  /**
   * Loading compositor mode: the body-shift hop is driven by the WAAPI loading
   * timeline on a tagged passive layer instead of the per-step WAAPI player.
   */
  compositorLoading?: boolean;
};

export function KeelAnimationComposer({
  layers,
  pivotOriginPct: _pivotOriginPct,
  size = DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX,
  bodyShift = IDLE_BODY_SHIFT,
  children,
  staticOverlay,
  compositorLoading = false,
}: KeelAnimationComposerProps) {
  const wobbleWrapped = (
    <LoadingIconWobbleLayer enabled={!!layers.wobble}>{children}</LoadingIconWobbleLayer>
  );

  return (
    <div className="relative shrink-0 overflow-visible" style={{ width: size, height: size }}>
      {compositorLoading ? (
        <div className="pointer-events-none absolute inset-0" {...{ [KEEL_LOADING_BODY_ATTR]: "" }}>
          {wobbleWrapped}
        </div>
      ) : (
        <LoadingIconBodyShiftLayer playback={bodyShift}>{wobbleWrapped}</LoadingIconBodyShiftLayer>
      )}
      {staticOverlay}
    </div>
  );
}
