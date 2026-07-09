// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelStorage.ts

// Browser persistence for chat status panel layout (localStorage).

import {
  STATUS_PANEL_DEFAULT_SIDE,
  STATUS_PANEL_DEFAULT_WIDTH,
  STATUS_PANEL_MAX_WIDTH,
  STATUS_PANEL_MIN_WIDTH,
  type StatusPanelSide,
} from "./statusPanelConfig";

export const STATUS_PANEL_LAYOUT_STORAGE_KEY = "keel.chat.statusPanelLayout";

type StoredStatusPanelLayout = {
  side?: unknown;
  width?: unknown;
};

function clampWidth(width: number): number {
  return Math.min(STATUS_PANEL_MAX_WIDTH, Math.max(STATUS_PANEL_MIN_WIDTH, width));
}

function parseSide(value: unknown): StatusPanelSide | null {
  return value === "left" || value === "right" ? value : null;
}

function parseWidth(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return clampWidth(Math.round(value));
}

export function readStoredStatusPanelLayout(): {
  side: StatusPanelSide;
  width: number;
} {
  try {
    const raw = localStorage.getItem(STATUS_PANEL_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {
        side: STATUS_PANEL_DEFAULT_SIDE,
        width: STATUS_PANEL_DEFAULT_WIDTH,
      };
    }

    const parsed = JSON.parse(raw) as StoredStatusPanelLayout;
    return {
      side: parseSide(parsed.side) ?? STATUS_PANEL_DEFAULT_SIDE,
      width: parseWidth(parsed.width) ?? STATUS_PANEL_DEFAULT_WIDTH,
    };
  } catch {
    return {
      side: STATUS_PANEL_DEFAULT_SIDE,
      width: STATUS_PANEL_DEFAULT_WIDTH,
    };
  }
}

export function writeStoredStatusPanelLayout(
  layout: { side: StatusPanelSide; width: number },
): void {
  try {
    localStorage.setItem(
      STATUS_PANEL_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        side: layout.side,
        width: clampWidth(layout.width),
      }),
    );
  } catch {
    // Private browsing or quota — ignore.
  }
}
