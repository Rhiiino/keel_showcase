// stack_sandbox/frontend_web/src/modules/chat/hooks/useStatusPanelTabLayout.ts

// Status panel tab stack state: dock / undock via drag-and-drop.

import { useCallback, useEffect, useState } from "react";

import type { StatusPanelTabId } from "../lib/status";
import {
  dockTabAtIndex,
  dockTabBelow,
  getPaneHeightFractions,
  isStackedLayout,
  normalizeTabLayout,
  setSingleTab,
  undockTab,
  withDividerHeights,
  type StatusPanelTabLayout,
} from "../lib/status";
import {
  layoutForTabSelection,
  readStoredTabLayout,
  writeStoredTabLayout,
} from "../lib/status";

export function useStatusPanelTabLayout(initialTabId: StatusPanelTabId) {
  const [layout, setLayoutState] = useState<StatusPanelTabLayout>(() =>
    readStoredTabLayout(),
  );
  const [activeTabId, setActiveTabId] = useState<StatusPanelTabId>(() => {
    const stored = readStoredTabLayout();
    return stored.panes.includes(initialTabId)
      ? initialTabId
      : (stored.panes[0] ?? initialTabId);
  });

  const setLayout = useCallback(
    (
      next:
        | StatusPanelTabLayout
        | ((current: StatusPanelTabLayout) => StatusPanelTabLayout),
    ) => {
      setLayoutState((current) =>
        normalizeTabLayout(typeof next === "function" ? next(current) : next),
      );
    },
    [],
  );

  useEffect(() => {
    writeStoredTabLayout(layout);
  }, [layout]);

  const selectTab = useCallback(
    (tabId: StatusPanelTabId) => {
      setActiveTabId(tabId);
      setLayout((current) => layoutForTabSelection(current, tabId));
    },
    [setLayout],
  );

  const focusTab = useCallback(
    (tabId: StatusPanelTabId) => {
      setActiveTabId(tabId);
      setLayout((current) => layoutForTabSelection(current, tabId));
    },
    [setLayout],
  );

  const dockTab = useCallback(
    (tabId: StatusPanelTabId, index?: number) => {
      setLayout((current) =>
        index === undefined
          ? dockTabBelow(current, tabId)
          : dockTabAtIndex(current, tabId, index),
      );
    },
    [setLayout],
  );

  const undockTabFromStack = useCallback(
    (tabId: StatusPanelTabId) => {
      setLayout((current) => {
        const next = undockTab(current, tabId);
        if (!isStackedLayout(next)) {
          setActiveTabId(next.panes[0]);
        }
        return next;
      });
    },
    [setLayout],
  );

  const resizePaneDivider = useCallback(
    (dividerIndex: number, topFraction: number, bottomFraction: number) => {
      setLayout((current) =>
        withDividerHeights(current, dividerIndex, topFraction, bottomFraction),
      );
    },
    [setLayout],
  );

  const collapseToSingleTab = useCallback(
    (tabId: StatusPanelTabId) => {
      setActiveTabId(tabId);
      setLayout(setSingleTab(tabId));
    },
    [setLayout],
  );

  return {
    layout,
    activeTabId,
    isStacked: isStackedLayout(layout),
    panes: layout.panes,
    paneHeightFractions: getPaneHeightFractions(layout),
    selectTab,
    focusTab,
    dockTab,
    undockTabFromStack,
    resizePaneDivider,
    collapseToSingleTab,
  };
}
