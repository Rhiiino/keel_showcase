// keel_web/src/lib/keelPersona/elements/baseDesign.ts

import {
  DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX,
  type KeelPersonaElement,
} from "../types";

const DEFAULT_CENTER_POINT_X_PCT = 50;
const DEFAULT_CENTER_POINT_Y_PCT = 50;

export function getKeelPersonaCenterPointPivotOrigin(
  elements: readonly KeelPersonaElement[],
  iconSizePx: number = DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX,
): string {
  const anchor = elements.find(
    (element) =>
      element.id === "preset-center-point" ||
      (element.kind === "dot" && element.tags?.includes("pivot")),
  );

  if (anchor && anchor.kind === "dot") {
    const xPct = Math.round((anchor.x / iconSizePx) * 1000) / 10;
    const yPct = Math.round((anchor.y / iconSizePx) * 1000) / 10;
    return `${xPct}% ${yPct}%`;
  }

  return `${DEFAULT_CENTER_POINT_X_PCT}% ${DEFAULT_CENTER_POINT_Y_PCT}%`;
}
