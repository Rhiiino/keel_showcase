// keel_web/src/app/nav/navMenuVisibility.ts

// Resolves per-item nav visibility from user settings (hidden items keep layout order).

import type { NavMenuVisibility } from "../../modules/settings/api";
import type { NavLayoutEntry } from "./appNavLayout";
import { layoutEntryKey } from "./appNavLayout";
import type { NavRenderRow } from "./useAppNavOrder";

export const APP_NAV_MENU_VISIBILITY_STORAGE_KEY = "keel.app.navMenuVisibility";

export function isNavItemHidden(
  itemId: string,
  visibility?: NavMenuVisibility | null,
): boolean {
  return visibility?.[itemId] === false;
}

export function buildNavMenuVisibilityPatch(
  itemId: string,
  visible: boolean,
): NavMenuVisibility {
  return { [itemId]: visible };
}

export function hasHiddenNavItems(
  visibility?: NavMenuVisibility | null,
): boolean {
  if (!visibility) {
    return false;
  }
  return Object.values(visibility).some((value) => value === false);
}

export function collapseOrphanSeparators(rows: NavRenderRow[]): NavRenderRow[] {
  const collapsed: NavRenderRow[] = [];

  for (const row of rows) {
    if (row.kind === "separator") {
      const previousIsItem =
        collapsed.length > 0 && collapsed[collapsed.length - 1]?.kind === "item";
      if (previousIsItem) {
        collapsed.push(row);
      }
      continue;
    }

    collapsed.push(row);
  }

  return collapsed;
}

export function filterNavDisplayRows(
  rows: readonly NavRenderRow[],
  visibility: NavMenuVisibility | null | undefined,
  showHidden: boolean,
): NavRenderRow[] {
  const filtered: NavRenderRow[] = [];

  for (const row of rows) {
    if (row.kind === "separator") {
      filtered.push(row);
      continue;
    }

    const hidden = isNavItemHidden(row.item.id, visibility);
    if (hidden && !showHidden) {
      continue;
    }

    if (hidden && showHidden) {
      filtered.push({
        ...row,
        hiddenPreview: true,
      });
      continue;
    }

    filtered.push(row);
  }

  return collapseOrphanSeparators(filtered);
}

export function resolveLayoutInsertIndexFromDisplay(
  layout: readonly NavLayoutEntry[],
  displayRows: readonly NavRenderRow[],
  displayInsertIndex: number,
): number {
  if (displayInsertIndex >= displayRows.length) {
    return layout.length;
  }

  const targetRow = displayRows[displayInsertIndex];
  const targetKey =
    targetRow.kind === "item"
      ? `item:${targetRow.item.id}`
      : `separator:${targetRow.id}`;
  const layoutIndex = layout.findIndex(
    (entry) => layoutEntryKey(entry) === targetKey,
  );
  return layoutIndex === -1 ? layout.length : layoutIndex;
}

export function readStoredNavMenuVisibility(): NavMenuVisibility | null {
  try {
    const raw = localStorage.getItem(APP_NAV_MENU_VISIBILITY_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const normalized: NavMenuVisibility = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof key === "string" && value === false) {
        normalized[key] = false;
      }
    }
    return Object.keys(normalized).length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

export function writeStoredNavMenuVisibility(
  visibility: NavMenuVisibility | null | undefined,
): void {
  try {
    if (!visibility || Object.keys(visibility).length === 0) {
      localStorage.removeItem(APP_NAV_MENU_VISIBILITY_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      APP_NAV_MENU_VISIBILITY_STORAGE_KEY,
      JSON.stringify(visibility),
    );
  } catch {
    // Private browsing or quota — ignore.
  }
}

export function visibilitySignature(
  visibility: NavMenuVisibility | null | undefined,
): string {
  if (!visibility) {
    return "";
  }
  return Object.keys(visibility)
    .sort()
    .map((key) => `${key}:${visibility[key] ? "1" : "0"}`)
    .join("|");
}
