// keel_web/src/modules/coak/components/panels/CoakWorkspaceWindow.tsx

import { useCallback, useMemo, type RefObject } from "react";

import type { CoakTabDropIndicator } from "../../hooks/panels/useCoakWorkspaceTabDrag";
import type { CoakWorkspaceTabId, CoakWorkspaceWindow as CoakWorkspaceWindowModel } from "../../api";
import { findWindowHeaderDockTarget } from "../../hooks/panels/useCoakWorkspaceTabDrag";
import { coakTabLabel } from "../../lib/panels/coakWindowLayout";
import type { CoakPanelBounds } from "../../lib/panels/coakPanelGeometry";
import { resolveAnchorRect } from "../../lib/panels/coakPanelGeometry";
import { defaultCombinedWindowSize } from "../../lib/panels/coakWindowLayout";
import {
  CoakConstellationBreadcrumb,
  useCoakConstellationBreadcrumbVisible,
} from "../tabs/constellation/CoakConstellationBreadcrumb";
import { CoakDraggablePanel } from "./CoakDraggablePanel";
import { CoakWorkspaceTabBar } from "./CoakWorkspaceTabBar";
import { CoakWorkspaceTabContent } from "./CoakWorkspaceTabContent";

type CoakWorkspaceWindowProps = {
  window: CoakWorkspaceWindowModel;
  boundsRef: RefObject<HTMLDivElement | null>;
  draggingTabId: CoakWorkspaceTabId | null;
  dropIndicator: CoakTabDropIndicator | null;
  dockTargetWindowId: string | null;
  onSelectTab: (windowId: string, tabId: CoakWorkspaceTabId) => void;
  onSetWindowRect: (windowId: string, rect: CoakWorkspaceWindowModel["rect"]) => void;
  onMergeWindows: (sourceWindowId: string, targetWindowId: string) => void;
  bringWindowToFront: (windowId: string) => void;
  getWindowZIndex: (windowId: string) => number;
  onTabPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    tabId: CoakWorkspaceTabId,
    windowId: string,
  ) => void;
  onTabPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onTabPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onTabPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

function resolveInitialRect(
  window: CoakWorkspaceWindowModel,
  bounds: CoakPanelBounds,
): CoakWorkspaceWindowModel["rect"] | null {
  if (window.rect.width > 0 && window.rect.height > 0) {
    return window.rect;
  }

  const size = defaultCombinedWindowSize(bounds);
  const anchored = resolveAnchorRect("top-left", size, bounds);
  const centered = {
    x: Math.round((bounds.width - anchored.width) / 2),
    y: Math.round((bounds.height - anchored.height) / 2),
    width: anchored.width,
    height: anchored.height,
  };

  return {
    ...centered,
    z_index: window.rect.z_index,
  };
}

export function CoakWorkspaceWindow({
  window,
  boundsRef,
  draggingTabId,
  dropIndicator,
  dockTargetWindowId,
  onSelectTab,
  onSetWindowRect,
  onMergeWindows,
  bringWindowToFront,
  getWindowZIndex,
  onTabPointerDown,
  onTabPointerMove,
  onTabPointerUp,
  onTabPointerCancel,
}: CoakWorkspaceWindowProps) {
  const initialRect = useMemo(() => {
    const boundsElement = boundsRef.current;
    if (!boundsElement) {
      return window.rect.width > 0 && window.rect.height > 0 ? window.rect : null;
    }
    const boundsRect = boundsElement.getBoundingClientRect();
    return resolveInitialRect(window, {
      width: boundsRect.width,
      height: boundsRect.height,
    });
  }, [boundsRef, window]);

  const headerTitle =
    window.tabs.length === 1 ? coakTabLabel(window.tabs[0]) : "Workspace";

  const constellationTabActive = window.active_tab === "constellation";
  const showConstellationBreadcrumb = useCoakConstellationBreadcrumbVisible(
    constellationTabActive,
  );

  const handleHeaderDragEnd = useCallback(
    (clientX: number, clientY: number) => {
      const targetWindowId = findWindowHeaderDockTarget(clientX, clientY, window.id);
      if (targetWindowId) {
        onMergeWindows(window.id, targetWindowId);
      }
    },
    [onMergeWindows, window.id],
  );

  const headerContent = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <CoakWorkspaceTabBar
        windowId={window.id}
        tabs={window.tabs}
        activeTab={window.active_tab}
        draggingTabId={draggingTabId}
        dropIndicator={dropIndicator}
        className={showConstellationBreadcrumb ? "shrink-0" : "min-w-0 flex-1"}
        onSelectTab={(tabId) => onSelectTab(window.id, tabId)}
        onTabPointerDown={onTabPointerDown}
        onTabPointerMove={onTabPointerMove}
        onTabPointerUp={onTabPointerUp}
        onTabPointerCancel={onTabPointerCancel}
      />
      {constellationTabActive ? (
        <CoakConstellationBreadcrumb enabled={constellationTabActive} />
      ) : null}
    </div>
  );

  return (
    <CoakDraggablePanel
      windowId={window.id}
      title={headerTitle}
      ariaLabel={`Drag ${headerTitle} window`}
      boundsRef={boundsRef}
      initialAnchor="top-left"
      defaultSizeForBounds={defaultCombinedWindowSize}
      headerContent={headerContent}
      initialRect={initialRect}
      onRectChange={(rect) =>
        onSetWindowRect(window.id, { ...rect, z_index: getWindowZIndex(window.id) })
      }
      onHeaderDragEnd={handleHeaderDragEnd}
      bringWindowToFront={bringWindowToFront}
      getWindowZIndex={getWindowZIndex}
      isDockTarget={dockTargetWindowId === window.id}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CoakWorkspaceTabContent tabId={window.active_tab} />
      </div>
    </CoakDraggablePanel>
  );
}
