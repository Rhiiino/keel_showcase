// keel_web/src/lib/keelPersona/teslaPeakGlow.ts

/** Solid white core at Tesla peak intensity (straight-gaze eyes). */
export const TESLA_PEAK_WHITE_CORE = "hsl(0, 0%, 100%)";

/** Softer white core for lit Tesla lines (avoids harsh bloom at peak). */
export const TESLA_PEAK_LINE_WHITE_CORE = "hsl(0, 0%, 96%)";

/** Peak white bloom for Tesla straight-gaze eyes. */
export const TESLA_PEAK_WHITE_GLOW_BOX_SHADOW =
  "0 0 10px 3px rgba(255, 255, 255, 1), 0 0 24px 8px rgba(255, 255, 255, 0.75), 0 0 40px 14px rgba(255, 255, 255, 0.4)";

/** Softer peak bloom for Tesla lit lines (mouth / eye rings). */
export const TESLA_PEAK_LINE_GLOW_BOX_SHADOW =
  "0 0 8px 2px rgba(255, 255, 255, 0.82), 0 0 20px 6px rgba(255, 255, 255, 0.52), 0 0 36px 12px rgba(255, 255, 255, 0.26)";
