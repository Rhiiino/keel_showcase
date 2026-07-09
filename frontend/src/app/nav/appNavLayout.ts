// src/app/nav/appNavLayout.ts

// Nav layout entries (items + user-managed separators), persistence, and reorder helpers.

import { mergeNavOrder, APP_NAV_ORDER_STORAGE_KEY } from "./appNavOrder";
import { buildDefaultNavLayout } from "./appNavLayoutDefaults";

/** Menu item + separator order (distinct from panel open/width in appNavStorage). */
export const APP_NAV_MENU_LAYOUT_STORAGE_KEY = "keel.app.navMenuLayout";

/** Legacy key — may hold menu layout array or panel dimensions from an earlier collision. */
const LEGACY_NAV_MENU_LAYOUT_STORAGE_KEY = "keel.app.navLayout";

export type NavLayoutItemEntry = {
  kind: "item";
  id: string;
};

export type NavLayoutSeparatorEntry = {
  kind: "separator";
  id: string;
};

export type NavLayoutEntry = NavLayoutItemEntry | NavLayoutSeparatorEntry;

export function layoutEntryKey(entry: NavLayoutEntry): string {
  return `${entry.kind}:${entry.id}`;
}

function isLayoutEntry(value: unknown): value is NavLayoutEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as { kind?: unknown; id?: unknown };
  if (entry.kind === "item" || entry.kind === "separator") {
    return typeof entry.id === "string";
  }
  return false;
}

export function mergeNavLayout(
  layout: readonly NavLayoutEntry[],
  registryIds: readonly string[],
): NavLayoutEntry[] {
  const registrySet = new Set(registryIds);
  const seenSeparatorIds = new Set<string>();

  const merged = layout.filter((entry) => {
    if (entry.kind === "separator") {
      if (seenSeparatorIds.has(entry.id)) {
        return false;
      }
      seenSeparatorIds.add(entry.id);
      return true;
    }
    return registrySet.has(entry.id);
  });

  const presentItemIds = new Set(
    merged
      .filter((entry): entry is NavLayoutItemEntry => entry.kind === "item")
      .map((entry) => entry.id),
  );

  for (const id of registryIds) {
    if (!presentItemIds.has(id)) {
      merged.push({ kind: "item", id });
    }
  }

  return merged;
}

function migrateLegacyNavOrder(
  storedIds: readonly string[],
  anchorLayout: readonly NavLayoutEntry[],
): NavLayoutEntry[] {
  const templateItemIds = anchorLayout
    .filter((entry): entry is NavLayoutItemEntry => entry.kind === "item")
    .map((entry) => entry.id);
  const mergedIds = mergeNavOrder(storedIds, templateItemIds);

  let orderCursor = 0;
  return anchorLayout.map((entry) => {
    if (entry.kind === "separator") {
      return entry;
    }
    const id = mergedIds[orderCursor];
    orderCursor += 1;
    return id ? { kind: "item", id } : entry;
  });
}

export function readStoredNavLayout(registryIds: readonly string[]): NavLayoutEntry[] {
  const anchorLayout = buildDefaultNavLayout(registryIds);

  try {
    for (const storageKey of [
      APP_NAV_MENU_LAYOUT_STORAGE_KEY,
      LEGACY_NAV_MENU_LAYOUT_STORAGE_KEY,
    ]) {
      const layoutRaw = localStorage.getItem(storageKey);
      if (!layoutRaw) {
        continue;
      }
      const parsed = JSON.parse(layoutRaw) as unknown;
      if (Array.isArray(parsed) && parsed.every(isLayoutEntry)) {
        return mergeNavLayout(parsed, registryIds);
      }
    }

    const legacyRaw = localStorage.getItem(APP_NAV_ORDER_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as unknown;
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        return mergeNavLayout(
          migrateLegacyNavOrder(parsed, anchorLayout),
          registryIds,
        );
      }
    }
  } catch {
    // ignore
  }

  return anchorLayout;
}

export function writeStoredNavLayout(layout: readonly NavLayoutEntry[]): void {
  try {
    localStorage.setItem(
      APP_NAV_MENU_LAYOUT_STORAGE_KEY,
      JSON.stringify([...layout]),
    );
  } catch {
    // Private browsing or quota — ignore.
  }
}

export function moveEntryInLayout(
  layout: readonly NavLayoutEntry[],
  draggedEntryKey: string,
  insertIndex: number,
): NavLayoutEntry[] {
  const fromIndex = layout.findIndex(
    (entry) => layoutEntryKey(entry) === draggedEntryKey,
  );
  if (fromIndex === -1) {
    return [...layout];
  }

  const next = [...layout];
  const [removed] = next.splice(fromIndex, 1);

  let targetIndex = insertIndex;
  if (fromIndex < insertIndex) {
    targetIndex -= 1;
  }
  targetIndex = Math.max(0, Math.min(targetIndex, next.length));

  if (fromIndex === targetIndex) {
    return [...layout];
  }

  next.splice(targetIndex, 0, removed);
  return next;
}

export function layoutSignature(layout: readonly NavLayoutEntry[]): string {
  return layout.map((entry) => layoutEntryKey(entry)).join("|");
}
