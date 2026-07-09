// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelTabLayoutStorage.ts

// Browser persistence for status panel tab stack layout.

import type { StatusPanelTabId } from "./statusPanelConfig";
import {
  DEFAULT_STATUS_PANEL_TAB_LAYOUT,
  isStackedLayout,
  isValidTabId,
  normalizeTabLayout,
  type StatusPanelTabLayout,
} from "./statusPanelTabLayout";

export const STATUS_PANEL_TAB_LAYOUT_STORAGE_KEY = "keel.chat.statusPanelTabLayout";

export function readStoredTabLayout(): StatusPanelTabLayout {
  try {
    const raw = localStorage.getItem(STATUS_PANEL_TAB_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATUS_PANEL_TAB_LAYOUT;
    }

    const parsed = JSON.parse(raw) as { panes?: unknown; paneHeights?: unknown };
    if (!Array.isArray(parsed.panes)) {
      return DEFAULT_STATUS_PANEL_TAB_LAYOUT;
    }

    const paneHeights = Array.isArray(parsed.paneHeights)
      ? parsed.paneHeights.filter(
          (value): value is number =>
            typeof value === "number" && Number.isFinite(value) && value > 0,
        )
      : undefined;

    return normalizeTabLayout({
      panes: parsed.panes.filter(isValidTabId) as StatusPanelTabId[],
      paneHeights,
    });
  } catch {
    return DEFAULT_STATUS_PANEL_TAB_LAYOUT;
  }
}

export function writeStoredTabLayout(layout: StatusPanelTabLayout): void {
  try {
    localStorage.setItem(
      STATUS_PANEL_TAB_LAYOUT_STORAGE_KEY,
      JSON.stringify(normalizeTabLayout(layout)),
    );
  } catch {
    // ignore
  }
}

/** Keep stacked layout when switching to a tab already in stack; else single-tab view. */
export function layoutForTabSelection(
  layout: StatusPanelTabLayout,
  tabId: StatusPanelTabId,
): StatusPanelTabLayout {
  if (isStackedLayout(layout) && layout.panes.includes(tabId)) {
    return layout;
  }
  return normalizeTabLayout({ panes: [tabId] });
}
