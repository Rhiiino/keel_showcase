// keel_web/src/modules/coak/lib/tabs/settings/coakNodeVisualSettings.ts

import type { CoakItemKind } from "../../../api";
import {
  COAK_ITEM_KINDS,
  COAK_ITEM_KIND_LABELS,
  COAK_NODE_VISUAL_DEFAULTS,
} from "../../coakItemKindRegistry";

export type CoakNodeVisualStyle = "folder" | "note" | "wire" | "stripe" | "facet" | "ring";

export const COAK_NODE_VISUAL_STYLES: readonly CoakNodeVisualStyle[] = [
  "folder",
  "note",
  "wire",
  "stripe",
  "facet",
  "ring",
] as const;

export { COAK_ITEM_KINDS, COAK_ITEM_KIND_LABELS, COAK_NODE_VISUAL_DEFAULTS };

export const COAK_CONFIGURATION_NODE_VISUALS_KEY = "node_visuals";

export const COAK_NODE_VISUAL_PREVIEW_COLOR = "#60a5fa";

export function isCoakNodeVisualStyle(value: unknown): value is CoakNodeVisualStyle {
  return typeof value === "string" && COAK_NODE_VISUAL_STYLES.includes(value as CoakNodeVisualStyle);
}

export function readCoakNodeVisualOverrides(
  settings: Record<string, unknown>,
): Partial<Record<CoakItemKind, CoakNodeVisualStyle>> {
  const raw = settings[COAK_CONFIGURATION_NODE_VISUALS_KEY];
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const overrides: Partial<Record<CoakItemKind, CoakNodeVisualStyle>> = {};
  for (const kind of COAK_ITEM_KINDS) {
    const value = (raw as Record<string, unknown>)[kind];
    if (isCoakNodeVisualStyle(value)) {
      overrides[kind] = value;
    }
  }

  return overrides;
}

export function resolveCoakNodeVisualStyle(
  settings: Record<string, unknown>,
  kind: CoakItemKind,
): CoakNodeVisualStyle {
  return readCoakNodeVisualOverrides(settings)[kind] ?? COAK_NODE_VISUAL_DEFAULTS[kind];
}

export function readCoakNodeVisualSettings(
  settings: Record<string, unknown>,
): Record<CoakItemKind, CoakNodeVisualStyle> {
  return Object.fromEntries(
    COAK_ITEM_KINDS.map((kind) => [kind, resolveCoakNodeVisualStyle(settings, kind)]),
  ) as Record<CoakItemKind, CoakNodeVisualStyle>;
}

export function buildCoakNodeVisualSettingsUpdate(
  settings: Record<string, unknown>,
  kind: CoakItemKind,
  style: CoakNodeVisualStyle,
): Record<CoakItemKind, CoakNodeVisualStyle> {
  return {
    ...readCoakNodeVisualSettings(settings),
    [kind]: style,
  };
}
