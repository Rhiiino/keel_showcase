// src/app/nav/appNavLayoutDefaults.ts

// Default nav layout template — item slots plus section separators.
// Separators are draggable and editable in the nav UI; edit ids here to change the defaults.

import type { NavLayoutEntry } from "./appNavLayout";

/** Separator between catalog/reference modules and daily-use features. */
export const NAV_SEPARATOR_CATALOG = "sep-catalog";

/** Separator before lab / experimental nav items. */
export const NAV_SEPARATOR_LAB = "sep-lab";

export function buildDefaultNavLayout(registryItemIds: readonly string[]): NavLayoutEntry[] {
  const has = (id: string) => registryItemIds.includes(id);

  const entries: NavLayoutEntry[] = [];

  const pushItem = (id: string) => {
    if (has(id)) {
      entries.push({ kind: "item", id });
    }
  };

  pushItem("home");
  pushItem("chat");
  pushItem("agents");
  pushItem("intelligence");

  if (
    has("projects") ||
    has("finance") ||
    has("media") ||
    has("people") ||
    has("timeline") ||
    has("journal") ||
    has("jobs") ||
    has("services") ||
    has("focus")
  ) {
    entries.push({ kind: "separator", id: NAV_SEPARATOR_CATALOG });
  }

  pushItem("projects");
  pushItem("finance");
  pushItem("media");
  pushItem("people");
  pushItem("timeline");
  pushItem("journal");
  pushItem("jobs");
  pushItem("services");
  pushItem("focus");

  if (has("coak")) {
    entries.push({ kind: "separator", id: NAV_SEPARATOR_LAB });
    pushItem("coak");
  }

  return entries;
}
