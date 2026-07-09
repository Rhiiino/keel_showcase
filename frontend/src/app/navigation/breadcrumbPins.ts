// keel_web/src/app/navigation/breadcrumbPins.ts

// Persists pinned breadcrumb locations in localStorage.

import { locationKey } from "./resolveNavigationLabel";

export const NAV_BREADCRUMB_PINS_STORAGE_KEY = "keel.app.nav-breadcrumb-pins";

export type PinnedBreadcrumb = {
  id: string;
  pathname: string;
  search: string;
  hash: string;
  /** Label captured when the location was pinned — used after refresh until live data loads. */
  label?: string;
  pinnedAt: number;
};

export type PinnedBreadcrumbInput = Pick<
  PinnedBreadcrumb,
  "pathname" | "search" | "hash" | "label"
>;

export function pinnedBreadcrumbKey(pathname: string, search: string): string {
  return locationKey(pathname, search);
}

export function pinnedBreadcrumbLocation(
  entry: Pick<PinnedBreadcrumb, "pathname" | "search" | "hash">,
): string {
  return `${entry.pathname}${entry.search}${entry.hash}`;
}

function isPinnedBreadcrumb(value: unknown): value is PinnedBreadcrumb {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<PinnedBreadcrumb>;
  return (
    typeof record.id === "string" &&
    typeof record.pathname === "string" &&
    typeof record.search === "string" &&
    typeof record.hash === "string" &&
    (record.label === undefined || typeof record.label === "string") &&
    typeof record.pinnedAt === "number"
  );
}

export function readStoredBreadcrumbPins(): PinnedBreadcrumb[] {
  try {
    const raw = localStorage.getItem(NAV_BREADCRUMB_PINS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPinnedBreadcrumb);
  } catch {
    return [];
  }
}

export function writeStoredBreadcrumbPins(pins: PinnedBreadcrumb[]): void {
  try {
    localStorage.setItem(NAV_BREADCRUMB_PINS_STORAGE_KEY, JSON.stringify(pins));
  } catch {
    // localStorage may be unavailable.
  }
}

export function createPinnedBreadcrumb(
  entry: PinnedBreadcrumbInput,
): PinnedBreadcrumb {
  return {
    id: pinnedBreadcrumbKey(entry.pathname, entry.search),
    pathname: entry.pathname,
    search: entry.search,
    hash: entry.hash,
    label: entry.label,
    pinnedAt: Date.now(),
  };
}
