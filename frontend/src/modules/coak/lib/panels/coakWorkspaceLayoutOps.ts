// keel_web/src/modules/coak/lib/panels/coakWorkspaceLayoutOps.ts

import type { CoakPanelRect } from "../../api";
import type { CoakWorkspaceLayout, CoakWorkspaceTabId } from "./coakWorkspaceLayoutModel";
import {
  createCoakWindowId,
  findCoakWindow,
  removeEmptyWindows,
} from "./coakWorkspaceLayoutModel";

export function setWindowRectInLayout(
  layout: CoakWorkspaceLayout,
  windowId: string,
  rect: CoakPanelRect,
): CoakWorkspaceLayout {
  return {
    ...layout,
    windows: layout.windows.map((window) =>
      window.id === windowId ? { ...window, rect } : window,
    ),
  };
}

export function setActiveTabInLayout(
  layout: CoakWorkspaceLayout,
  windowId: string,
  tabId: CoakWorkspaceTabId,
): CoakWorkspaceLayout {
  return {
    ...layout,
    windows: layout.windows.map((window) =>
      window.id === windowId && window.tabs.includes(tabId)
        ? { ...window, active_tab: tabId }
        : window,
    ),
  };
}

export function bringWindowToFrontInLayout(
  layout: CoakWorkspaceLayout,
  windowId: string,
): CoakWorkspaceLayout {
  return {
    ...layout,
    window_order: [...layout.window_order.filter((id) => id !== windowId), windowId],
  };
}

export function reorderTabInLayout(
  layout: CoakWorkspaceLayout,
  windowId: string,
  tabId: CoakWorkspaceTabId,
  targetIndex: number,
): CoakWorkspaceLayout {
  return {
    ...layout,
    windows: layout.windows.map((window) => {
      if (window.id !== windowId) {
        return window;
      }
      const fromIndex = window.tabs.indexOf(tabId);
      if (fromIndex < 0) {
        return window;
      }
      const tabs = [...window.tabs];
      tabs.splice(fromIndex, 1);
      let insertIndex = targetIndex;
      if (fromIndex < targetIndex) {
        insertIndex = Math.max(0, targetIndex - 1);
      }
      insertIndex = Math.max(0, Math.min(insertIndex, tabs.length));
      tabs.splice(insertIndex, 0, tabId);
      return { ...window, tabs };
    }),
  };
}

export function moveTabBetweenWindowsInLayout(
  layout: CoakWorkspaceLayout,
  tabId: CoakWorkspaceTabId,
  sourceWindowId: string,
  targetWindowId: string,
  targetIndex: number,
): CoakWorkspaceLayout {
  if (sourceWindowId === targetWindowId) {
    return reorderTabInLayout(layout, sourceWindowId, tabId, targetIndex);
  }

  let removed = false;
  const withoutTab = layout.windows.map((window) => {
    if (window.id !== sourceWindowId) {
      return window;
    }
    if (!window.tabs.includes(tabId)) {
      return window;
    }
    removed = true;
    const tabs = window.tabs.filter((candidate) => candidate !== tabId);
    const activeTab = tabs.includes(window.active_tab) ? window.active_tab : tabs[0] ?? tabId;
    return { ...window, tabs, active_tab: activeTab };
  });

  if (!removed) {
    return layout;
  }

  const withTab = withoutTab.map((window) => {
    if (window.id !== targetWindowId) {
      return window;
    }
    const fromIndex = sourceWindowId === targetWindowId ? window.tabs.indexOf(tabId) : -1;
    const tabs = window.tabs.filter((candidate) => candidate !== tabId);
    let insertIndex = Math.max(0, Math.min(targetIndex, tabs.length));
    if (fromIndex >= 0 && fromIndex < insertIndex) {
      insertIndex = Math.max(0, insertIndex - 1);
    }
    tabs.splice(insertIndex, 0, tabId);
    return { ...window, tabs, active_tab: tabId };
  });

  return removeEmptyWindows({
    ...layout,
    windows: withTab,
  });
}

export function tearOutTabInLayout(
  layout: CoakWorkspaceLayout,
  tabId: CoakWorkspaceTabId,
  sourceWindowId: string,
  rect: CoakPanelRect,
): CoakWorkspaceLayout {
  const newWindowId = createCoakWindowId();
  const withoutTab = layout.windows.map((window) => {
    if (window.id !== sourceWindowId || !window.tabs.includes(tabId)) {
      return window;
    }
    const tabs = window.tabs.filter((candidate) => candidate !== tabId);
    const activeTab = tabs.includes(window.active_tab) ? window.active_tab : tabs[0] ?? tabId;
    return { ...window, tabs, active_tab: activeTab };
  });

  const nextLayout = removeEmptyWindows({
    ...layout,
    windows: [
      ...withoutTab,
      {
        id: newWindowId,
        rect,
        tabs: [tabId],
        active_tab: tabId,
      },
    ],
    window_order: [...layout.window_order, newWindowId],
  });

  return bringWindowToFrontInLayout(nextLayout, newWindowId);
}

export function mergeWindowsInLayout(
  layout: CoakWorkspaceLayout,
  sourceWindowId: string,
  targetWindowId: string,
): CoakWorkspaceLayout {
  if (sourceWindowId === targetWindowId) {
    return layout;
  }

  const source = findCoakWindow(layout, sourceWindowId);
  const target = findCoakWindow(layout, targetWindowId);
  if (!source || !target) {
    return layout;
  }

  const mergedTabs = [...target.tabs];
  for (const tab of source.tabs) {
    if (!mergedTabs.includes(tab)) {
      mergedTabs.push(tab);
    }
  }

  const withoutSource = layout.windows
    .filter((window) => window.id !== sourceWindowId)
    .map((window) =>
      window.id === targetWindowId
        ? {
            ...window,
            tabs: mergedTabs,
            active_tab: window.active_tab,
          }
        : window,
    );

  return {
    windows: withoutSource,
    window_order: layout.window_order.filter((id) => id !== sourceWindowId),
  };
}
