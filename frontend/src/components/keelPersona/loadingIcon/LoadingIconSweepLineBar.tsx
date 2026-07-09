// keel_web/src/components/keelPersona/loadingIcon/LoadingIconSweepLineBar.tsx

import {
  TESLA_PEAK_LINE_GLOW_BOX_SHADOW,
  TESLA_PEAK_LINE_WHITE_CORE,
} from "../../../lib/keelPersona/teslaPeakGlow";
import type { TeslaLineSweepClip } from "../../../lib/keelPersona/teslaLineSweep";

/** Slight thickness bump for Tesla lit bars (still reads as a line, not a tube). */
const TESLA_LINE_THICKNESS_SCALE = 1.7;

type LoadingIconSweepLineBarProps = {
  width: number;
  height: number;
  clip: TeslaLineSweepClip;
};

function resolveBrightReveal(clip: TeslaLineSweepClip): {
  visibleWidthPct: number;
  opacity: number;
} {
  if (clip === "hidden") {
    return { visibleWidthPct: 0, opacity: 0 };
  }
  if (clip === "full") {
    return { visibleWidthPct: 100, opacity: 1 };
  }
  if (clip.mode === "fadeIn") {
    return { visibleWidthPct: 100, opacity: clip.progress };
  }
  if (clip.mode === "fadeOut") {
    return { visibleWidthPct: 100, opacity: 1 - clip.progress };
  }
  return { visibleWidthPct: 100, opacity: 1 };
}

export function LoadingIconSweepLineBar({
  width,
  height,
  clip,
}: LoadingIconSweepLineBarProps) {
  if (clip === "hidden") {
    return <div className="relative overflow-visible" style={{ width, height }} />;
  }

  const { visibleWidthPct, opacity } = resolveBrightReveal(clip);
  const litHeight = Math.max(height * TESLA_LINE_THICKNESS_SCALE, height + 2);
  const revealScale = visibleWidthPct / 100;

  return (
    <div className="relative overflow-visible" style={{ width, height }}>
      <div
        className="absolute left-0 top-1/2 overflow-visible"
        style={{
          width,
          height: litHeight,
          opacity,
          transform: `translateY(-50%) scaleX(${revealScale})`,
          transformOrigin: "left center",
        }}
      >
        <div
          className="relative overflow-visible"
          style={{ width, height: litHeight, borderRadius: litHeight }}
        >
          <div
            style={{
              width,
              height: litHeight,
              borderRadius: litHeight,
              backgroundColor: TESLA_PEAK_LINE_WHITE_CORE,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: litHeight,
              backgroundColor: TESLA_PEAK_LINE_WHITE_CORE,
              boxShadow: TESLA_PEAK_LINE_GLOW_BOX_SHADOW,
            }}
          />
        </div>
      </div>
    </div>
  );
}
