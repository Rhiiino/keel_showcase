// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelTabLayout.ts

// Tab pane stack layout for the status panel (single view vs vertical stack).

import type { StatusPanelTabId } from "./statusPanelConfig";
import { STATUS_PANEL_TAB_IDS } from "./statusPanelConfig";
import { statusPanelTabs } from "./statusPanelRegistry";

const VALID_TAB_IDS = new Set<StatusPanelTabId>(
  statusPanelTabs.map((tab) => tab.id),
);

export const MIN_STACKED_PANE_FRACTION = 0.15;

export type StatusPanelTabLayout = {
  /** Panes top-to-bottom. One entry = single-tab view; two or more = vertical stack. */
  panes: StatusPanelTabId[];
  /** Relative heights when stacked; same length as `panes`, sums to ~1. */
  paneHeights?: number[];
};

export const DEFAULT_STATUS_PANEL_TAB_LAYOUT: StatusPanelTabLayout = {
  panes: [STATUS_PANEL_TAB_IDS.general],
};

export function isValidTabId(value: unknown): value is StatusPanelTabId {
  return typeof value === "string" && VALID_TAB_IDS.has(value as StatusPanelTabId);
}

function equalPaneHeights(count: number): number[] {
  return Array.from({ length: count }, () => 1 / count);
}

function normalizePaneHeights(
  panes: StatusPanelTabId[],
  paneHeights: number[] | undefined,
): number[] | undefined {
  if (panes.length <= 1) {
    return undefined;
  }

  if (
    !paneHeights ||
    paneHeights.length !== panes.length ||
    !paneHeights.every((value) => typeof value === "number" && value > 0)
  ) {
    return equalPaneHeights(panes.length);
  }

  const sum = paneHeights.reduce((total, value) => total + value, 0);
  if (sum <= 0) {
    return equalPaneHeights(panes.length);
  }

  return paneHeights.map((value) => value / sum);
}

export function getPaneHeightFractions(layout: StatusPanelTabLayout): number[] {
  const { panes } = normalizeTabLayout(layout);
  if (panes.length <= 1) {
    return [1];
  }
  return normalizePaneHeights(panes, layout.paneHeights) ?? equalPaneHeights(panes.length);
}

export function normalizeTabLayout(
  layout: StatusPanelTabLayout,
): StatusPanelTabLayout {
  const seen = new Set<StatusPanelTabId>();
  const panes: StatusPanelTabId[] = [];

  for (const tabId of layout.panes) {
    if (!isValidTabId(tabId) || seen.has(tabId)) {
      continue;
    }
    seen.add(tabId);
    panes.push(tabId);
  }

  if (panes.length === 0) {
    return DEFAULT_STATUS_PANEL_TAB_LAYOUT;
  }

  if (panes.length === 1) {
    return { panes };
  }

  return {
    panes,
    paneHeights: normalizePaneHeights(panes, layout.paneHeights),
  };
}

export function withDividerHeights(
  layout: StatusPanelTabLayout,
  dividerIndex: number,
  topFraction: number,
  bottomFraction: number,
): StatusPanelTabLayout {
  const normalized = normalizeTabLayout(layout);
  if (
    dividerIndex <= 0 ||
    dividerIndex >= normalized.panes.length ||
    normalized.panes.length <= 1
  ) {
    return normalized;
  }

  const paneHeights = [...(normalized.paneHeights ?? equalPaneHeights(normalized.panes.length))];
  paneHeights[dividerIndex - 1] = topFraction;
  paneHeights[dividerIndex] = bottomFraction;

  return normalizeTabLayout({ ...normalized, paneHeights });
}

export function isStackedLayout(layout: StatusPanelTabLayout): boolean {
  return layout.panes.length > 1;
}

function redistributeAfterPaneRemoval(
  panes: StatusPanelTabId[],
  removedIndex: number,
  paneHeights: number[] | undefined,
): number[] | undefined {
  if (panes.length <= 1) {
    return undefined;
  }

  const fractions =
    paneHeights && paneHeights.length === panes.length + 1
      ? [...paneHeights]
      : equalPaneHeights(panes.length + 1);

  fractions.splice(removedIndex, 1);
  const sum = fractions.reduce((total, value) => total + value, 0);
  return fractions.map((value) => value / sum);
}

/** Append a tab below existing panes (no-op if already present). */
export function dockTabBelow(
  layout: StatusPanelTabLayout,
  tabId: StatusPanelTabId,
): StatusPanelTabLayout {
  if (!isValidTabId(tabId)) {
    return layout;
  }
  if (layout.panes.includes(tabId)) {
    return layout;
  }
  return normalizeTabLayout({ panes: [...layout.panes, tabId] });
}

/** Insert a tab at stack index (clamped). */
export function dockTabAtIndex(
  layout: StatusPanelTabLayout,
  tabId: StatusPanelTabId,
  index: number,
): StatusPanelTabLayout {
  if (!isValidTabId(tabId)) {
    return layout;
  }

  const without = layout.panes.filter((id) => id !== tabId);
  const next = [...without];
  const clampedIndex = Math.max(0, Math.min(index, next.length));
  next.splice(clampedIndex, 0, tabId);
  return normalizeTabLayout({ panes: next });
}

/** Remove tab from stack; keeps at least one pane. */
export function undockTab(
  layout: StatusPanelTabLayout,
  tabId: StatusPanelTabId,
): StatusPanelTabLayout {
  if (layout.panes.length <= 1) {
    return layout;
  }

  const removedIndex = layout.panes.indexOf(tabId);
  const panes = layout.panes.filter((id) => id !== tabId);
  if (panes.length <= 1) {
    return normalizeTabLayout({ panes });
  }

  return normalizeTabLayout({
    panes,
    paneHeights: redistributeAfterPaneRemoval(
      panes,
      removedIndex,
      layout.paneHeights,
    ),
  });
}

/** Switch single-tab view to one tab. */
export function setSingleTab(tabId: StatusPanelTabId): StatusPanelTabLayout {
  return normalizeTabLayout({ panes: [tabId] });
}

export function tabLabel(tabId: StatusPanelTabId): string {
  return statusPanelTabs.find((tab) => tab.id === tabId)?.label ?? tabId;
}

export const STATUS_PANEL_TAB_DRAG_MIME = "application/x-keel-status-tab";
