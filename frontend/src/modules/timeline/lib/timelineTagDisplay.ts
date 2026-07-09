// keel_web/src/modules/timeline/lib/timelineTagDisplay.ts

// Color helpers for timeline tag pills.

export const DEFAULT_TIMELINE_TAG_COLOR = "#06B6D4";

export const TIMELINE_TAG_PILL_TEXT_COLOR = "#FAFAF9";

/** Dark surface the pills sit on — keep in sync with list/table backgrounds. */
const TAG_PILL_SURFACE_RGB = { r: 12, g: 10, b: 9 };

/** How much of the selected tag color shows in the pill fill (0–1). */
const TAG_PILL_FILL_MIX = 0.44;

/** Slightly stronger mix for the ring so the hue stays readable. */
const TAG_PILL_BORDER_MIX = 0.62;

export function normalizeHexColor(colorHex: string): string {
  return colorHex.trim().toUpperCase();
}

function hexToRgb(colorHex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(colorHex);
  const match = /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/.exec(normalized);
  if (!match) {
    return null;
  }

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

function padHexChannel(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0").toUpperCase();
}

function mixHexWithSurface(colorHex: string, surfaceWeight: number): string {
  const rgb = hexToRgb(colorHex);
  if (!rgb) {
    return normalizeHexColor(colorHex);
  }

  const tagWeight = 1 - surfaceWeight;
  const r = Math.round(TAG_PILL_SURFACE_RGB.r * surfaceWeight + rgb.r * tagWeight);
  const g = Math.round(TAG_PILL_SURFACE_RGB.g * surfaceWeight + rgb.g * tagWeight);
  const b = Math.round(TAG_PILL_SURFACE_RGB.b * surfaceWeight + rgb.b * tagWeight);

  return `#${padHexChannel(r)}${padHexChannel(g)}${padHexChannel(b)}`;
}

export function timelineTagPillStyle(colorHex: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
  textShadow: string;
} {
  const normalized = normalizeHexColor(colorHex);
  return {
    backgroundColor: mixHexWithSurface(normalized, 1 - TAG_PILL_FILL_MIX),
    color: TIMELINE_TAG_PILL_TEXT_COLOR,
    borderColor: mixHexWithSurface(normalized, 1 - TAG_PILL_BORDER_MIX),
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.35)",
  };
}
