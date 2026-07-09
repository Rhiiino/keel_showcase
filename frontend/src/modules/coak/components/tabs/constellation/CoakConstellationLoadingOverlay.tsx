// keel_web/src/modules/coak/components/tabs/constellation/CoakConstellationLoadingOverlay.tsx

import { memo } from "react";

import { KeelPersonaPlayer } from "../../../../../components/keelPersona";
import { useKeelClipMediaReady, useRandomKeelClip } from "../../../../../hooks/keelPersona";

type CoakConstellationLoadingOverlayProps = {
  fading?: boolean;
};

export const CoakConstellationLoadingOverlay = memo(function CoakConstellationLoadingOverlay({
  fading = false,
}: CoakConstellationLoadingOverlayProps) {
  const clipId = useRandomKeelClip();
  const mediaReady = useKeelClipMediaReady(clipId, true);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center"
      aria-hidden={fading}
    >
      <div
        className={`coak-constellation-loading-backdrop absolute inset-0 transition-opacity duration-[450ms] ease-out ${
          fading ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />
      <div
        className={`relative flex flex-col items-center gap-3 overflow-visible transition-opacity duration-[450ms] ease-out ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        <KeelPersonaPlayer
          clipId={clipId}
          size={220}
          waitForMedia
          mediaReady={mediaReady}
          loadingPlayback
        />
      </div>
    </div>
  );
});
