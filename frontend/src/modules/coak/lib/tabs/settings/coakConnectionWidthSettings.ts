// keel_web/src/modules/coak/lib/tabs/settings/coakConnectionWidthSettings.ts

export const COAK_CONFIGURATION_CONNECTION_WIDTH_KEY = "connection_width";

export const COAK_CONNECTION_WIDTH_MIN = 0.5;
export const COAK_CONNECTION_WIDTH_MAX = 6;
export const COAK_CONNECTION_WIDTH_STEP = 0.25;
export const COAK_CONNECTION_WIDTH_DEFAULT = 1.15;

export function clampCoakConnectionWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return COAK_CONNECTION_WIDTH_DEFAULT;
  }
  return Math.min(COAK_CONNECTION_WIDTH_MAX, Math.max(COAK_CONNECTION_WIDTH_MIN, value));
}

export function readCoakConnectionWidth(settings: Record<string, unknown>): number {
  const raw = settings[COAK_CONFIGURATION_CONNECTION_WIDTH_KEY];
  if (typeof raw !== "number") {
    return COAK_CONNECTION_WIDTH_DEFAULT;
  }
  return clampCoakConnectionWidth(raw);
}
