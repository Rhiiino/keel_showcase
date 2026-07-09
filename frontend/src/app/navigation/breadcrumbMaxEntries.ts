// keel_web/src/app/navigation/breadcrumbMaxEntries.ts

// Resolves how many breadcrumb entries the navigation stack retains.

import type { QueryClient } from "@tanstack/react-query";

import {
  settingsKeys,
  type UserSettingsPublic,
} from "../../modules/settings/api";

export const NAV_BREADCRUMB_MAX_ENTRIES_STORAGE_KEY =
  "keel.app.nav-breadcrumb-max";

export const DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES = 5;
export const MIN_NAV_BREADCRUMB_MAX_ENTRIES = 1;
export const MAX_NAV_BREADCRUMB_MAX_ENTRIES = 10;

export const NAV_BREADCRUMB_MAX_ENTRY_OPTIONS = Array.from(
  { length: MAX_NAV_BREADCRUMB_MAX_ENTRIES - MIN_NAV_BREADCRUMB_MAX_ENTRIES + 1 },
  (_, index) => MIN_NAV_BREADCRUMB_MAX_ENTRIES + index,
);

export function resolveNavigationBreadcrumbMaxEntries(
  value: number | null | undefined,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_NAV_BREADCRUMB_MAX_ENTRIES,
    Math.max(MIN_NAV_BREADCRUMB_MAX_ENTRIES, rounded),
  );
}

export function readStoredNavBreadcrumbMaxEntries(): number {
  try {
    const raw = localStorage.getItem(NAV_BREADCRUMB_MAX_ENTRIES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES;
    }
    const parsed = Number.parseInt(raw, 10);
    return resolveNavigationBreadcrumbMaxEntries(parsed);
  } catch {
    return DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES;
  }
}

export function writeStoredNavBreadcrumbMaxEntries(value: number): void {
  try {
    localStorage.setItem(
      NAV_BREADCRUMB_MAX_ENTRIES_STORAGE_KEY,
      String(resolveNavigationBreadcrumbMaxEntries(value)),
    );
  } catch {
    // localStorage may be unavailable; server cache remains the source of truth.
  }
}

export function readNavigationBreadcrumbMaxEntriesFromCache(
  queryClient: QueryClient,
): number {
  const cached = queryClient.getQueryData<UserSettingsPublic>(settingsKeys.root());
  const fromServer = cached?.data.nav_breadcrumb_max_entries;
  if (typeof fromServer === "number") {
    return resolveNavigationBreadcrumbMaxEntries(fromServer);
  }
  return readStoredNavBreadcrumbMaxEntries();
}

export function applyNavBreadcrumbMaxEntriesPreference(
  queryClient: QueryClient,
  value: number,
): number {
  const resolved = resolveNavigationBreadcrumbMaxEntries(value);
  writeStoredNavBreadcrumbMaxEntries(resolved);
  queryClient.setQueryData<UserSettingsPublic>(settingsKeys.root(), (current) => ({
    data: {
      ...(current?.data ?? {}),
      nav_breadcrumb_max_entries: resolved,
    },
    updated_at: current?.updated_at ?? new Date().toISOString(),
  }));
  return resolved;
}
