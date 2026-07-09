// keel_web/src/modules/home/cards/lib/homeCardVisibility.ts

// Resolves per-card visibility from user settings (hidden cards keep layout + config).

import type { HomeCardVisibilityPatch } from "../../../settings/api";
import type { HomeCardId } from "../../../../app/modules/homeCardTypes";

export function isHomeCardVisible(
  cardId: HomeCardId,
  visibility?: HomeCardVisibilityPatch | null,
): boolean {
  return visibility?.[cardId] !== false;
}

export function buildHomeCardVisibilityPatch(
  cardId: HomeCardId,
  visible: boolean,
): HomeCardVisibilityPatch {
  return { [cardId]: visible };
}
