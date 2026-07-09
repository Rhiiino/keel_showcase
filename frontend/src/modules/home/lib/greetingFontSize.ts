// keel_web/src/modules/home/lib/greetingFontSize.ts

// Resolves home greeting title size and derived font-picker trigger dimensions.

export const DEFAULT_HOME_GREETING_FONT_SIZE_PX = 36;
export const MIN_HOME_GREETING_FONT_SIZE_PX = 20;
export const MAX_HOME_GREETING_FONT_SIZE_PX = 72;

/** Font picker "Aa" label size relative to the greeting title. */
export const GREETING_FONT_PICKER_FONT_RATIO = 0.55;

export function resolveHomeGreetingFontSizePx(
  value: number | null | undefined,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_HOME_GREETING_FONT_SIZE_PX;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_HOME_GREETING_FONT_SIZE_PX,
    Math.max(MIN_HOME_GREETING_FONT_SIZE_PX, rounded),
  );
}

export function clampHomeGreetingFontSizePx(value: number): number {
  return resolveHomeGreetingFontSizePx(value);
}

export function greetingFontPickerDimensions(greetingFontSizePx: number): {
  fontSizePx: number;
  buttonSizePx: number;
} {
  const fontSizePx = Math.max(
    12,
    Math.round(greetingFontSizePx * GREETING_FONT_PICKER_FONT_RATIO),
  );
  const buttonSizePx = Math.max(28, Math.round(fontSizePx * 1.65));
  return { fontSizePx, buttonSizePx };
}

export function homeGreetingFontSizePatchValue(
  fontSizePx: number,
): number | null {
  const normalized = clampHomeGreetingFontSizePx(fontSizePx);
  return normalized === DEFAULT_HOME_GREETING_FONT_SIZE_PX ? null : normalized;
}
