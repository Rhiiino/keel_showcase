// stack_sandbox/frontend_web/src/app/nav/appNavStorage.ts

// Browser persistence for app nav layout: label panel open/closed and expanded width.

import {
  APP_NAV_DEFAULT_WIDTH,
  APP_NAV_MAX_WIDTH,
  APP_NAV_MIN_WIDTH,
} from "./appNavConfig";

export const APP_NAV_LAYOUT_STORAGE_KEY = "keel.app.navLayout";

/** Legacy key — boolean open/closed only. Read once as a fallback default. */
export const APP_NAV_LABELS_OPEN_STORAGE_KEY = "keel.app.navLabelsOpen";

type StoredNavLayout = {
  open?: unknown;
  width?: unknown;
};

function clampWidth(width: number): number {
  return Math.min(APP_NAV_MAX_WIDTH, Math.max(APP_NAV_MIN_WIDTH, width));
}

function parseOpen(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseWidth(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return clampWidth(Math.round(value));
}

function readLegacyOpen(defaultOpen: boolean): boolean {
  try {
    const raw = localStorage.getItem(APP_NAV_LABELS_OPEN_STORAGE_KEY);
    if (raw === "true") {
      return true;
    }
    if (raw === "false") {
      return false;
    }
  } catch {
    // ignore
  }
  return defaultOpen;
}

export function readStoredNavLayout(defaultOpen = true): {
  open: boolean;
  width: number;
} {
  try {
    const raw = localStorage.getItem(APP_NAV_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {
        open: readLegacyOpen(defaultOpen),
        width: APP_NAV_DEFAULT_WIDTH,
      };
    }

    const parsed = JSON.parse(raw) as StoredNavLayout;
    return {
      open: parseOpen(parsed.open) ?? readLegacyOpen(defaultOpen),
      width: parseWidth(parsed.width) ?? APP_NAV_DEFAULT_WIDTH,
    };
  } catch {
    return {
      open: readLegacyOpen(defaultOpen),
      width: APP_NAV_DEFAULT_WIDTH,
    };
  }
}

export function writeStoredNavLayout(layout: {
  open: boolean;
  width: number;
}): void {
  try {
    localStorage.setItem(
      APP_NAV_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        open: layout.open,
        width: clampWidth(layout.width),
      }),
    );
  } catch {
    // Private browsing or quota — ignore.
  }
}
