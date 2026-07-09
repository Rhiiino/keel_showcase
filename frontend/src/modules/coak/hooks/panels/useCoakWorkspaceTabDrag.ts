// keel_web/src/modules/coak/hooks/panels/useCoakWorkspaceTabDrag.ts

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { CoakPanelRect, CoakWorkspaceTabId } from "../../api";
import type { CoakPanelBounds } from "../../lib/panels/coakPanelGeometry";
import { clampPanelPosition } from "../../lib/panels/coakPanelGeometry";
import { defaultTornOutWindowSize } from "../../lib/panels/coakWindowLayout";

const DRAG_THRESHOLD_PX = 6;

type TabDragSession = {
  pointerId: number;
  tabId: CoakWorkspaceTabId;
  sourceWindowId: string;
  startClientX: number;
  startClientY: number;
};

export type CoakTabDropIndicator = {
  windowId: string;
  index: number;
};

export type CoakTabDragPreview = {
  tabId: CoakWorkspaceTabId;
  clientX: number;
  clientY: number;
};

export type CoakWorkspaceTabDragHandlers = {
  onReorderTab: (windowId: string, tabId: CoakWorkspaceTabId, targetIndex: number) => void;
  onMoveTab: (
    tabId: CoakWorkspaceTabId,
    sourceWindowId: string,
    targetWindowId: string,
    targetIndex: number,
  ) => void;
  onTearOutTab: (tabId: CoakWorkspaceTabId, sourceWindowId: string, rect: CoakPanelRect) => void;
};

function findHeaderDockTarget(
  clientX: number,
  clientY: number,
  excludeWindowId: string,
): string | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    const header = element.closest("[data-coak-window-header]");
    if (!header) {
      continue;
    }
    const windowId = header.getAttribute("data-coak-window-id");
    if (windowId && windowId !== excludeWindowId) {
      return windowId;
    }
  }
  return null;
}

export function findTabDropTarget(
  clientX: number,
  clientY: number,
  draggingTabId?: CoakWorkspaceTabId | null,
): CoakTabDropIndicator | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    const dropZone = element.closest("[data-coak-tab-drop-zone]");
    if (!dropZone) {
      continue;
    }
    const windowId = dropZone.getAttribute("data-coak-window-id");
    if (!windowId) {
      continue;
    }

    const tabElements = [...dropZone.querySelectorAll<HTMLElement>("[data-coak-tab-id]")].filter(
      (tabElement) => tabElement.getAttribute("data-coak-tab-id") !== draggingTabId,
    );

    if (tabElements.length === 0) {
      return { windowId, index: 0 };
    }

    for (let index = 0; index < tabElements.length; index += 1) {
      const tabElement = tabElements[index];
      const rect = tabElement.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      if (clientX < midpoint) {
        return { windowId, index };
      }
    }

    return { windowId, index: tabElements.length };
  }

  return null;
}

function buildTornOutRect(
  tabId: CoakWorkspaceTabId,
  clientX: number,
  clientY: number,
  bounds: CoakPanelBounds,
  boundsElement: HTMLElement,
): CoakPanelRect {
  const size = defaultTornOutWindowSize(tabId, bounds);
  const boundsRect = boundsElement.getBoundingClientRect();
  const localX = clientX - boundsRect.left - size.width / 2;
  const localY = clientY - boundsRect.top - 24;
  const position = clampPanelPosition(
    { x: localX, y: localY },
    size.width,
    size.height,
    bounds.width,
    bounds.height,
  );

  return {
    ...position,
    width: size.width,
    height: size.height,
    z_index: 1,
  };
}

export function useCoakWorkspaceTabDrag(
  handlers: CoakWorkspaceTabDragHandlers,
  boundsRef: RefObject<HTMLDivElement | null>,
) {
  const sessionRef = useRef<TabDragSession | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const boundsRefStable = useRef(boundsRef);
  boundsRefStable.current = boundsRef;

  const [draggingTabId, setDraggingTabId] = useState<CoakWorkspaceTabId | null>(null);
  const [dragPreview, setDragPreview] = useState<CoakTabDragPreview | null>(null);
  const [dropIndicator, setDropIndicator] = useState<CoakTabDropIndicator | null>(null);

  const finishSessionRef = useRef<() => void>(() => {});

  const handleDocumentPointerMoveRef = useRef((event: PointerEvent) => {
    const session = sessionRef.current;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    const deltaX = event.clientX - session.startClientX;
    const deltaY = event.clientY - session.startClientY;
    if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
      return;
    }

    setDraggingTabId(session.tabId);
    setDragPreview({
      tabId: session.tabId,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    setDropIndicator(findTabDropTarget(event.clientX, event.clientY, session.tabId));
  });

  const handleDocumentPointerUpRef = useRef((event: PointerEvent) => {
    const session = sessionRef.current;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    const moved =
      Math.hypot(event.clientX - session.startClientX, event.clientY - session.startClientY) >=
      DRAG_THRESHOLD_PX;

    if (moved) {
      const dropTarget = findTabDropTarget(event.clientX, event.clientY, session.tabId);

      if (dropTarget) {
        handlersRef.current.onMoveTab(
          session.tabId,
          session.sourceWindowId,
          dropTarget.windowId,
          dropTarget.index,
        );
      } else {
        const headerTarget = findHeaderDockTarget(
          event.clientX,
          event.clientY,
          session.sourceWindowId,
        );
        if (headerTarget) {
          const tabBar = document.querySelector(
            `[data-coak-tab-drop-zone][data-coak-window-id="${headerTarget}"]`,
          );
          const tabCount = tabBar?.querySelectorAll("[data-coak-tab-id]").length ?? 0;
          handlersRef.current.onMoveTab(
            session.tabId,
            session.sourceWindowId,
            headerTarget,
            tabCount,
          );
        } else {
          const boundsElement = boundsRefStable.current.current;
          if (boundsElement) {
            const boundsRect = boundsElement.getBoundingClientRect();
            handlersRef.current.onTearOutTab(
              session.tabId,
              session.sourceWindowId,
              buildTornOutRect(
                session.tabId,
                event.clientX,
                event.clientY,
                { width: boundsRect.width, height: boundsRect.height },
                boundsElement,
              ),
            );
          }
        }
      }
    }

    finishSessionRef.current();
  });

  finishSessionRef.current = () => {
    document.removeEventListener("pointermove", handleDocumentPointerMoveRef.current);
    document.removeEventListener("pointerup", handleDocumentPointerUpRef.current);
    document.removeEventListener("pointercancel", handleDocumentPointerUpRef.current);
    sessionRef.current = null;
    setDraggingTabId(null);
    setDragPreview(null);
    setDropIndicator(null);
  };

  useEffect(() => {
    return () => {
      finishSessionRef.current();
    };
  }, []);

  const handleTabPointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      tabId: CoakWorkspaceTabId,
      sourceWindowId: string,
    ) => {
      if (event.button !== 0) {
        return;
      }

      finishSessionRef.current();

      sessionRef.current = {
        pointerId: event.pointerId,
        tabId,
        sourceWindowId,
        startClientX: event.clientX,
        startClientY: event.clientY,
      };

      document.addEventListener("pointermove", handleDocumentPointerMoveRef.current);
      document.addEventListener("pointerup", handleDocumentPointerUpRef.current);
      document.addEventListener("pointercancel", handleDocumentPointerUpRef.current);

      event.stopPropagation();
    },
    [],
  );

  const handleTabPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    handleDocumentPointerMoveRef.current(event.nativeEvent);
  }, []);

  const handleTabPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    handleDocumentPointerUpRef.current(event.nativeEvent);
  }, []);

  const handleTabPointerCancel = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    handleDocumentPointerUpRef.current(event.nativeEvent);
  }, []);

  return {
    draggingTabId,
    dragPreview,
    dropIndicator,
    handleTabPointerDown,
    handleTabPointerMove,
    handleTabPointerUp,
    handleTabPointerCancel,
  };
}

export function findWindowHeaderDockTarget(
  clientX: number,
  clientY: number,
  sourceWindowId: string,
): string | null {
  return findHeaderDockTarget(clientX, clientY, sourceWindowId);
}
