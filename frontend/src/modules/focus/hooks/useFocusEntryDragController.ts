// keel_web/src/modules/focus/hooks/useFocusEntryDragController.ts

// Native drag-and-drop controller for staged Focus entry tree moves.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../../lib/listReorder";
import type { FocusEntryContainerId } from "../lib/focusEntryTree";

const DWELL_DELAY_MS = 450;
const FLASH_MS = 180;
const FLASH_GAP_MS = 90;
const SCROLL_EDGE_PX = 64;
const SCROLL_MAX_PX_PER_FRAME = 18;

export type FocusEntryDropTarget = {
  containerId: FocusEntryContainerId;
  insertIndex: number;
};

export type FocusEntryDragRowRect = {
  entryId: number;
  top: number;
  bottom: number;
};

type HoverContainer = {
  entryId: number;
  containerId: FocusEntryContainerId;
  expanded: boolean;
} | null;

type UseFocusEntryDragControllerParams = {
  canMoveEntryToContainer: (entryId: number, containerId: FocusEntryContainerId) => boolean;
  moveEntry: (params: {
    nodeId: number;
    toParentId: FocusEntryContainerId;
    insertIndex: number;
  }) => void;
  onExpandContainer: (entryId: number, containerId: FocusEntryContainerId) => void;
};

export type UseFocusEntryDragControllerResult = {
  draggingEntryId: number | null;
  dropTarget: FocusEntryDropTarget | null;
  flashingEntryId: number | null;
  onDragStart: (
    entryId: number,
    sourceContainerId: FocusEntryContainerId,
  ) => (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (params: {
    containerId: FocusEntryContainerId;
    event: DragEvent<HTMLElement>;
    rowRects: FocusEntryDragRowRect[];
    hoverContainer: HoverContainer;
  }) => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

function findScrollContainer(element: Element | null): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    const canScroll =
      /(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight;
    if (canScroll) {
      return current;
    }
    current = current.parentElement;
  }
  return document.scrollingElement instanceof HTMLElement
    ? document.scrollingElement
    : document.documentElement;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useFocusEntryDragController({
  canMoveEntryToContainer,
  moveEntry,
  onExpandContainer,
}: UseFocusEntryDragControllerParams): UseFocusEntryDragControllerResult {
  const [draggingEntryId, setDraggingEntryId] = useState<number | null>(null);
  const [sourceContainerId, setSourceContainerId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<FocusEntryDropTarget | null>(null);
  const [flashingEntryId, setFlashingEntryId] = useState<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const dwellTargetRef = useRef<HoverContainer>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const scrollStateRef = useRef<{ element: HTMLElement; speed: number } | null>(null);

  const stopAutoScroll = useCallback(() => {
    scrollStateRef.current = null;
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const tickAutoScroll = useCallback(() => {
    const state = scrollStateRef.current;
    if (!state) {
      scrollFrameRef.current = null;
      return;
    }

    state.element.scrollTop += state.speed;
    scrollFrameRef.current = window.requestAnimationFrame(tickAutoScroll);
  }, []);

  const updateAutoScroll = useCallback(
    (clientY: number, element: HTMLElement) => {
      const scrollElement = findScrollContainer(element);
      if (!scrollElement) {
        stopAutoScroll();
        return;
      }

      const rect = scrollElement.getBoundingClientRect();
      const topDistance = clientY - rect.top;
      const bottomDistance = rect.bottom - clientY;
      const topSpeed =
        topDistance < SCROLL_EDGE_PX
          ? -((SCROLL_EDGE_PX - topDistance) / SCROLL_EDGE_PX) *
            SCROLL_MAX_PX_PER_FRAME
          : 0;
      const bottomSpeed =
        bottomDistance < SCROLL_EDGE_PX
          ? ((SCROLL_EDGE_PX - bottomDistance) / SCROLL_EDGE_PX) *
            SCROLL_MAX_PX_PER_FRAME
          : 0;
      const speed = topSpeed || bottomSpeed;

      if (Math.abs(speed) < 0.5) {
        stopAutoScroll();
        return;
      }

      scrollStateRef.current = { element: scrollElement, speed };
      if (scrollFrameRef.current === null) {
        scrollFrameRef.current = window.requestAnimationFrame(tickAutoScroll);
      }
    },
    [stopAutoScroll, tickAutoScroll],
  );

  const clearDwellTimer = useCallback(() => {
    if (dwellTimerRef.current !== null) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    dwellTargetRef.current = null;
  }, []);

  const startDwellTimer = useCallback(
    (hoverContainer: HoverContainer) => {
      if (
        !hoverContainer ||
        hoverContainer.expanded ||
        draggingEntryId === null ||
        !canMoveEntryToContainer(draggingEntryId, hoverContainer.containerId)
      ) {
        clearDwellTimer();
        return;
      }

      const currentTarget = dwellTargetRef.current;
      if (
        currentTarget?.entryId === hoverContainer.entryId &&
        currentTarget.containerId === hoverContainer.containerId
      ) {
        return;
      }

      clearDwellTimer();
      dwellTargetRef.current = hoverContainer;
      dwellTimerRef.current = window.setTimeout(() => {
        void (async () => {
          const target = dwellTargetRef.current;
          if (!target) {
            return;
          }

          for (let index = 0; index < 2; index += 1) {
            setFlashingEntryId(target.entryId);
            await sleep(FLASH_MS);
            setFlashingEntryId((current) =>
              current === target.entryId ? null : current,
            );
            if (index === 0) {
              await sleep(FLASH_GAP_MS);
            }
          }

          onExpandContainer(target.entryId, target.containerId);
          dwellTargetRef.current = null;
          dwellTimerRef.current = null;
        })();
      }, DWELL_DELAY_MS);
    },
    [canMoveEntryToContainer, clearDwellTimer, draggingEntryId, onExpandContainer],
  );

  const clearDragState = useCallback(() => {
    setDraggingEntryId(null);
    setSourceContainerId(null);
    setDropTarget(null);
    setFlashingEntryId(null);
    clearDwellTimer();
    stopAutoScroll();
  }, [clearDwellTimer, stopAutoScroll]);

  useEffect(() => clearDragState, [clearDragState]);

  const onDragStart = useCallback(
    (entryId: number, nextSourceContainerId: FocusEntryContainerId) =>
      (event: DragEvent<HTMLButtonElement>) => {
        setDraggingEntryId(entryId);
        setSourceContainerId(nextSourceContainerId);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(entryId));
        setTransparentDragImage(event.dataTransfer);
      },
    [],
  );

  const onDragOver = useCallback(
    ({
      containerId,
      event,
      rowRects,
      hoverContainer,
    }: {
      containerId: FocusEntryContainerId;
      event: DragEvent<HTMLElement>;
      rowRects: FocusEntryDragRowRect[];
      hoverContainer: HoverContainer;
    }) => {
      if (draggingEntryId === null) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = canMoveEntryToContainer(draggingEntryId, containerId)
        ? "move"
        : "none";
      updateAutoScroll(event.clientY, event.currentTarget);
      startDwellTimer(hoverContainer);

      if (!canMoveEntryToContainer(draggingEntryId, containerId)) {
        setDropTarget(null);
        return;
      }

      const nextIndex =
        rowRects.length > 0
          ? resolveInsertIndexFromPointer(event.clientY, rowRects)
          : 0;
      setDropTarget((current) =>
        current?.containerId === containerId && current.insertIndex === nextIndex
          ? current
          : { containerId, insertIndex: nextIndex },
      );
    },
    [
      canMoveEntryToContainer,
      draggingEntryId,
      startDwellTimer,
      updateAutoScroll,
    ],
  );

  const onDrop = useCallback(() => {
    const nodeId = draggingEntryId;
    const target = dropTarget;
    clearDragState();

    if (
      nodeId === null ||
      target === null ||
      sourceContainerId === null ||
      !canMoveEntryToContainer(nodeId, target.containerId)
    ) {
      return;
    }

    moveEntry({
      nodeId,
      toParentId: target.containerId,
      insertIndex: target.insertIndex,
    });
  }, [
    canMoveEntryToContainer,
    clearDragState,
    draggingEntryId,
    dropTarget,
    moveEntry,
    sourceContainerId,
  ]);

  return {
    draggingEntryId,
    dropTarget,
    flashingEntryId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd: clearDragState,
  };
}
