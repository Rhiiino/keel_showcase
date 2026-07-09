// keel_web/src/modules/coak/lib/panels/coakWorkspaceLayoutModel.ts

import type { CoakPanelRect, CoakWorkspaceSettings, CoakWorkspaceWindow } from "../../api";
import { normalizeCoakPanelId } from "./coakPanelSettings";

export const COAK_ALL_TAB_IDS = [
  "constellation",
  "general",
  "directory",
  "tags",
  "settings",
] as const;

export type CoakWorkspaceTabId = (typeof COAK_ALL_TAB_IDS)[number];

export type CoakWorkspaceLayout = {
  windows: CoakWorkspaceWindow[];
  window_order: string[];
};

const TAB_LABELS: Record<CoakWorkspaceTabId, string> = {
  constellation: "Constellation",
  general: "General",
  directory: "Directory",
  tags: "Tags",
  settings: "Settings",
};

export function coakTabLabel(tabId: CoakWorkspaceTabId): string {
  return TAB_LABELS[tabId];
}

export function isCoakWorkspaceTabId(value: string): value is CoakWorkspaceTabId {
  return (COAK_ALL_TAB_IDS as readonly string[]).includes(value);
}

export function createCoakWindowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `win-${crypto.randomUUID()}`;
  }
  return `win-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultWorkspaceLayout(): CoakWorkspaceLayout {
  const windowId = createCoakWindowId();
  return {
    windows: [
      {
        id: windowId,
        rect: { x: 0, y: 0, width: 0, height: 0, z_index: 1 },
        tabs: [...COAK_ALL_TAB_IDS],
        active_tab: "constellation",
      },
    ],
    window_order: [windowId],
  };
}

function parseWindowRect(raw: unknown): CoakPanelRect | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const x = record.x;
  const y = record.y;
  const width = record.width;
  const height = record.height;
  const zIndex = record.z_index ?? 1;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number"
  ) {
    return null;
  }
  return {
    x,
    y,
    width,
    height,
    z_index: typeof zIndex === "number" ? zIndex : 1,
  };
}

function parseWindow(raw: unknown): CoakWorkspaceWindow | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length === 0) {
    return null;
  }

  const rect = parseWindowRect(record.rect);
  if (!rect) {
    return null;
  }

  const tabsRaw = record.tabs;
  if (!Array.isArray(tabsRaw)) {
    return null;
  }

  const tabs: CoakWorkspaceTabId[] = [];
  for (const tab of tabsRaw) {
    if (typeof tab === "string" && isCoakWorkspaceTabId(tab) && !tabs.includes(tab)) {
      tabs.push(tab);
    }
  }
  if (tabs.length === 0) {
    return null;
  }

  const activeRaw = record.active_tab;
  const activeTab =
    typeof activeRaw === "string" && tabs.includes(activeRaw as CoakWorkspaceTabId)
      ? (activeRaw as CoakWorkspaceTabId)
      : tabs[0];

  return {
    id: record.id,
    rect,
    tabs,
    active_tab: activeTab,
  };
}

function reconcileTabCoverage(windows: CoakWorkspaceWindow[]): CoakWorkspaceWindow[] {
  const assigned = new Set<CoakWorkspaceTabId>();
  const nextWindows: CoakWorkspaceWindow[] = [];

  for (const window of windows) {
    const tabs = window.tabs.filter((tab) => {
      if (assigned.has(tab)) {
        return false;
      }
      assigned.add(tab);
      return true;
    });
    if (tabs.length === 0) {
      continue;
    }
    nextWindows.push({
      ...window,
      tabs,
      active_tab: tabs.includes(window.active_tab) ? window.active_tab : tabs[0],
    });
  }

  const missingTabs = COAK_ALL_TAB_IDS.filter((tab) => !assigned.has(tab));
  if (missingTabs.length === 0) {
    return nextWindows.length > 0 ? nextWindows : createDefaultWorkspaceLayout().windows;
  }

  if (nextWindows.length === 0) {
    return createDefaultWorkspaceLayout().windows;
  }

  const primary = nextWindows[0];
  const mergedTabs = [...primary.tabs];
  for (const tab of missingTabs) {
    if (!mergedTabs.includes(tab)) {
      mergedTabs.push(tab);
    }
  }

  nextWindows[0] = {
    ...primary,
    tabs: mergedTabs,
    active_tab: mergedTabs.includes(primary.active_tab) ? primary.active_tab : mergedTabs[0],
  };

  return nextWindows;
}

export function normalizeWindowOrder(
  windows: CoakWorkspaceWindow[],
  rawOrder: unknown,
): string[] {
  const windowIds = new Set(windows.map((window) => window.id));
  const order: string[] = [];

  if (Array.isArray(rawOrder)) {
    for (const item of rawOrder) {
      if (typeof item === "string" && windowIds.has(item) && !order.includes(item)) {
        order.push(item);
      }
    }
  }

  for (const window of windows) {
    if (!order.includes(window.id)) {
      order.push(window.id);
    }
  }

  return order;
}

function migrateLegacyPanels(
  panels: CoakWorkspaceSettings["panels"],
  panelOrder: string[] | undefined,
): CoakWorkspaceLayout {
  const constellationRect = panels?.constellation;
  const directoryRect = panels?.directory;

  if (!constellationRect && !directoryRect) {
    return createDefaultWorkspaceLayout();
  }

  const windows: CoakWorkspaceWindow[] = [];
  const legacyOrder = panelOrder ?? ["constellation", "directory"];

  if (constellationRect) {
    const id = createCoakWindowId();
    windows.push({
      id,
      rect: constellationRect,
      tabs: ["constellation"],
      active_tab: "constellation",
    });
  }

  if (directoryRect) {
    const id = createCoakWindowId();
    windows.push({
      id,
      rect: directoryRect,
      tabs: ["general", "directory", "settings"],
      active_tab: "directory",
    });
  }

  if (windows.length === 0) {
    return createDefaultWorkspaceLayout();
  }

  if (windows.length === 1) {
    windows[0] = {
      ...windows[0],
      tabs: [...COAK_ALL_TAB_IDS],
      active_tab: windows[0].tabs.includes("constellation") ? "constellation" : windows[0].active_tab,
    };
  }

  const orderFromLegacy: string[] = [];
  for (const legacyId of legacyOrder) {
    const normalized = normalizeCoakPanelId(legacyId);
    if (normalized === "constellation" && windows[0]?.tabs.includes("constellation")) {
      if (!orderFromLegacy.includes(windows[0].id)) {
        orderFromLegacy.push(windows[0].id);
      }
    }
    if (normalized === "directory") {
      const directoryWindow = windows.find((window) => window.tabs.includes("directory"));
      if (directoryWindow && !orderFromLegacy.includes(directoryWindow.id)) {
        orderFromLegacy.push(directoryWindow.id);
      }
    }
  }

  const reconciled = reconcileTabCoverage(windows);
  return {
    windows: reconciled,
    window_order: normalizeWindowOrder(reconciled, orderFromLegacy),
  };
}

export function normalizeCoakWorkspaceLayout(settings: CoakWorkspaceSettings): CoakWorkspaceLayout {
  if (Array.isArray(settings.windows) && settings.windows.length > 0) {
    const parsed = settings.windows
      .map((window) => parseWindow(window))
      .filter((window): window is CoakWorkspaceWindow => window != null);
    if (parsed.length > 0) {
      const reconciled = reconcileTabCoverage(parsed);
      return {
        windows: reconciled,
        window_order: normalizeWindowOrder(reconciled, settings.window_order),
      };
    }
  }

  const legacyLayout = migrateLegacyPanels(settings.panels, settings.panel_order);
  const hasLegacyPanels =
    settings.panels != null && Object.keys(settings.panels).length > 0;

  if (!settings.persisted && !hasLegacyPanels) {
    return createDefaultWorkspaceLayout();
  }

  return legacyLayout;
}

export function sanitizeLayoutForPersist(layout: CoakWorkspaceLayout): CoakWorkspaceLayout {
  return {
    window_order: [...layout.window_order],
    windows: layout.windows.map((window) => ({
      ...window,
      tabs: [...window.tabs],
      active_tab: window.tabs.includes(window.active_tab) ? window.active_tab : window.tabs[0],
      rect: {
        x: window.rect.x,
        y: window.rect.y,
        width: Math.max(0, window.rect.width),
        height: Math.max(0, window.rect.height),
        z_index: Math.max(1, Math.round(window.rect.z_index) || 1),
      },
    })),
  };
}

export function layoutToWorkspaceSettingsPayload(layout: CoakWorkspaceLayout): {
  windows: CoakWorkspaceWindow[];
  window_order: string[];
} {
  const sanitized = sanitizeLayoutForPersist(layout);
  return {
    windows: sanitized.windows,
    window_order: sanitized.window_order,
  };
}

export function findCoakWindow(
  layout: CoakWorkspaceLayout,
  windowId: string,
): CoakWorkspaceWindow | undefined {
  return layout.windows.find((window) => window.id === windowId);
}

export function getCoakWindowZIndex(layout: CoakWorkspaceLayout, windowId: string): number {
  const index = layout.window_order.indexOf(windowId);
  return index >= 0 ? index + 1 : 1;
}

export function defaultCombinedWindowSize(bounds: { width: number; height: number }): {
  width: number;
  height: number;
} {
  return {
    width: Math.round(bounds.width * 0.72),
    height: Math.round(bounds.height * 0.82),
  };
}

export function defaultTornOutWindowSize(
  tabId: CoakWorkspaceTabId,
  bounds: { width: number; height: number },
): { width: number; height: number } {
  if (tabId === "constellation") {
    return {
      width: Math.round(bounds.width * 0.5),
      height: Math.round(bounds.height * 0.45),
    };
  }
  return {
    width: Math.round(bounds.width * 0.34),
    height: Math.round(bounds.height * 0.5),
  };
}

export function removeEmptyWindows(layout: CoakWorkspaceLayout): CoakWorkspaceLayout {
  const windows = layout.windows.filter((window) => window.tabs.length > 0);
  if (windows.length === 0) {
    return createDefaultWorkspaceLayout();
  }
  return {
    windows,
    window_order: normalizeWindowOrder(windows, layout.window_order),
  };
}
