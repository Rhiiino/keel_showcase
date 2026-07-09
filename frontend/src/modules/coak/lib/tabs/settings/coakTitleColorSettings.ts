// keel_web/src/modules/coak/lib/tabs/settings/coakTitleColorSettings.ts

import {
  FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX,
  FOCUS_CONSTELLATION_CONNECTION_COLORS,
  type FocusConstellationConnectionColor,
} from "../../../../focus/lib/focus";

export type CoakTitleColor = FocusConstellationConnectionColor;

export const COAK_TITLE_COLORS = FOCUS_CONSTELLATION_CONNECTION_COLORS;

export const COAK_TITLE_COLOR_HEX = FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX;

export const COAK_TITLE_COLOR_DEFAULT: CoakTitleColor = "silver";

export const COAK_CONFIGURATION_TITLE_COLOR_KEY = "title_color";

export function isCoakTitleColor(value: unknown): value is CoakTitleColor {
  return (
    typeof value === "string" &&
    COAK_TITLE_COLORS.includes(value as CoakTitleColor)
  );
}

export function readCoakTitleColor(settings: Record<string, unknown>): CoakTitleColor {
  const raw = settings[COAK_CONFIGURATION_TITLE_COLOR_KEY];
  return isCoakTitleColor(raw) ? raw : COAK_TITLE_COLOR_DEFAULT;
}

export function resolveCoakTitleColorHex(settings: Record<string, unknown>): string {
  return COAK_TITLE_COLOR_HEX[readCoakTitleColor(settings)];
}
