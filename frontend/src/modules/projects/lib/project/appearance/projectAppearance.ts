// Shared appearance defaults and color helpers for project covers and Kanban cards.

export const DEFAULT_COVER_GLOW_COLOR_HEX = "#84CC16";
export const DEFAULT_COVER_MODEL_COLOR_HEX = "#A8B5A0";
export const DEFAULT_COVER_MODEL_BRIGHTNESS = 1;
export const MIN_COVER_MODEL_BRIGHTNESS = 0.5;
export const MAX_COVER_MODEL_BRIGHTNESS = 2;
export const DEFAULT_COVER_IMAGE_SCALE = 1;
export const MIN_COVER_IMAGE_SCALE = 0.25;
export const MAX_COVER_IMAGE_SCALE = 3;
export const DEFAULT_COVER_IMAGE_POSITION_X = 50;
export const DEFAULT_COVER_IMAGE_POSITION_Y = 50;
export const MIN_COVER_IMAGE_POSITION = 0;
export const MAX_COVER_IMAGE_POSITION = 100;
export const DEFAULT_KANBAN_CARD_COLOR_HEX = "#1C1917";

function normalizeHex(colorHex: string | null | undefined, fallback: string): string {
  if (!colorHex) {
    return fallback;
  }
  return colorHex.trim().toUpperCase();
}

export function resolveCoverGlowColor(colorHex: string | null | undefined): string {
  return normalizeHex(colorHex, DEFAULT_COVER_GLOW_COLOR_HEX);
}

export function resolveCoverModelColor(colorHex: string | null | undefined): string {
  return normalizeHex(colorHex, DEFAULT_COVER_MODEL_COLOR_HEX);
}

export function resolveCoverModelBrightness(
  value: number | string | null | undefined,
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) {
    return DEFAULT_COVER_MODEL_BRIGHTNESS;
  }
  return Math.min(
    MAX_COVER_MODEL_BRIGHTNESS,
    Math.max(MIN_COVER_MODEL_BRIGHTNESS, numeric),
  );
}

export function coverModelBrightnessToPercent(brightness: number): number {
  return Math.round(resolveCoverModelBrightness(brightness) * 100);
}

export function coverModelPercentToBrightness(percent: number): number {
  const clamped = Math.min(200, Math.max(50, Math.round(percent)));
  return clamped / 100;
}

export function resolveCoverImageScale(
  value: number | string | null | undefined,
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) {
    return DEFAULT_COVER_IMAGE_SCALE;
  }
  return Math.min(
    MAX_COVER_IMAGE_SCALE,
    Math.max(MIN_COVER_IMAGE_SCALE, numeric),
  );
}

export function coverImageScaleToPercent(scale: number): number {
  return Math.round(resolveCoverImageScale(scale) * 100);
}

export function coverImagePercentToScale(percent: number): number {
  const clamped = Math.min(300, Math.max(25, Math.round(percent)));
  return clamped / 100;
}

export function resolveCoverImagePositionX(
  value: number | string | null | undefined,
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) {
    return DEFAULT_COVER_IMAGE_POSITION_X;
  }
  return Math.min(
    MAX_COVER_IMAGE_POSITION,
    Math.max(MIN_COVER_IMAGE_POSITION, numeric),
  );
}

export function resolveCoverImagePositionY(
  value: number | string | null | undefined,
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) {
    return DEFAULT_COVER_IMAGE_POSITION_Y;
  }
  return Math.min(
    MAX_COVER_IMAGE_POSITION,
    Math.max(MIN_COVER_IMAGE_POSITION, numeric),
  );
}

/** Shift cover focal point from a drag delta (container px, current scale). */
export function shiftCoverImagePosition(
  positionX: number,
  positionY: number,
  deltaX: number,
  deltaY: number,
  containerWidth: number,
  containerHeight: number,
  scale: number,
): { positionX: number; positionY: number } {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return {
      positionX: resolveCoverImagePositionX(positionX),
      positionY: resolveCoverImagePositionY(positionY),
    };
  }

  const zoom = resolveCoverImageScale(scale);
  const nextX =
    resolveCoverImagePositionX(positionX) -
    (deltaX / containerWidth) * 100 / zoom;
  const nextY =
    resolveCoverImagePositionY(positionY) -
    (deltaY / containerHeight) * 100 / zoom;

  return {
    positionX: resolveCoverImagePositionX(nextX),
    positionY: resolveCoverImagePositionY(nextY),
  };
}

export function coverImageFrameStyle(
  scale: number,
  positionX: number,
  positionY: number,
): { transform: string; transformOrigin: string } {
  const resolvedScale = resolveCoverImageScale(scale);
  const resolvedPositionX = resolveCoverImagePositionX(positionX);
  const resolvedPositionY = resolveCoverImagePositionY(positionY);
  return {
    transform: `scale(${resolvedScale})`,
    transformOrigin: `${resolvedPositionX}% ${resolvedPositionY}%`,
  };
}

export function resolveKanbanCardColor(colorHex: string | null | undefined): string {
  return normalizeHex(colorHex, DEFAULT_KANBAN_CARD_COLOR_HEX);
}

export function kanbanCardBorderRgba(
  colorHex: string | null | undefined,
  alpha: number,
): string {
  const rgb = hexToRgb(resolveKanbanCardColor(colorHex));
  if (!rgb) {
    return `rgba(28, 25, 23, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function hexToRgb(colorHex: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i.exec(colorHex);
  if (!match) {
    return null;
  }

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

export function coverGlowRgba(
  colorHex: string | null | undefined,
  alpha: number,
): string {
  const rgb = hexToRgb(resolveCoverGlowColor(colorHex));
  if (!rgb) {
    return `rgba(132, 204, 22, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export type CoverGlowStyle = {
  outer: string;
  inner: string;
};

export function coverGlowStyle(colorHex: string | null | undefined): CoverGlowStyle {
  return {
    outer: coverGlowRgba(colorHex, 0.38),
    inner: coverGlowRgba(colorHex, 0.22),
  };
}

/** Soft radial glow for borderless detail-page 3D covers. */
export function coverHeroRadialGradient(
  colorHex: string | null | undefined,
): string {
  const core = coverGlowRgba(colorHex, 0.42);
  const mid = coverGlowRgba(colorHex, 0.16);
  const edge = coverGlowRgba(colorHex, 0.04);
  return `radial-gradient(circle at 50% 50%, ${core} 0%, ${mid} 28%, ${edge} 52%, transparent 72%)`;
}
