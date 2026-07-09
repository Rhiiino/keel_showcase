// keel_web/src/modules/coak/lib/graph/coakConnectionSettings.ts

import {
  FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX,
  FOCUS_CONSTELLATION_CONNECTION_COLORS,
  type FocusConstellationConnectionColor,
} from "../../../../focus/lib/focus";

export const COAK_CONFIGURATION_CONNECTION_COLOR_KEY = "connection_color";

export function isCoakConnectionColor(value: unknown): value is FocusConstellationConnectionColor {
  return (
    typeof value === "string" &&
    FOCUS_CONSTELLATION_CONNECTION_COLORS.includes(value as FocusConstellationConnectionColor)
  );
}

export function readCoakConnectionColor(
  settings: Record<string, unknown>,
): FocusConstellationConnectionColor {
  const raw = settings[COAK_CONFIGURATION_CONNECTION_COLOR_KEY];
  return isCoakConnectionColor(raw) ? raw : FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT;
}

export function resolveCoakConnectionColorHex(settings: Record<string, unknown>): string {
  return FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX[readCoakConnectionColor(settings)];
}
