// keel_web/src/modules/home/cards/layout/HomeCardCanvas.tsx

// Free-form draggable canvas for home dashboard cards.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { getHomeCardComponent } from "../registry";
import type { HomeCardId } from "../../../../app/modules/homeCardTypes";
import {
  HomeCardCanvasInteractionContext,
  HomeCardSlotContext,
} from "./HomeCardCanvasContext";
import { HomeCardResizeHandles } from "./HomeCardResizeHandles";
import {
  getHomeCardSlotHeight,
  type HomeCardLayoutEntry,
} from "./homeCardLayout";
import {
  applyHomeCardResize,
  isHomeCardResizable,
  MIN_HOME_CARD_SIZE,
  resolveHomeCardSize,
  type HomeCardRect,
  type HomeCardResizeHandle,
  type HomeResizableCardId,
} from "./homeCardResize";

const DRAG_THRESHOLD_PX = 6;

type HomeCardCanvasProps = {
  layout: HomeCardLayoutEntry[];
  onMoveCard: (id: HomeCardId, x: number, y: number) => void;
  onResizeCard: (id: HomeCardId, rect: HomeCardRect) => void;
  onLayoutChangeEnd: () => void;
};

type DragState = {
  id: HomeCardId;
  offsetX: number;
  offsetY: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
};

type ResizeState = {
  id: HomeCardId;
  handle: HomeCardResizeHandle;
  pointerId: number;
  originRect: HomeCardRect;
  startClientX: number;
  startClientY: number;
};

function clearDragSessionListeners(
  onMove: (event: PointerEvent) => void,
  onEnd: (event: PointerEvent) => void,
) {
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", onEnd);
  window.removeEventListener("pointercancel", onEnd);
}

function getCanvasBounds(canvas: HTMLDivElement) {
  return {
    width: canvas.clientWidth,
    height: Math.max(canvas.clientHeight, 480),
  };
}


function shouldIgnoreHomeCardDrag(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(
    target.closest(
      "input, textarea, select, [data-home-card-no-drag]",
    ),
  );
}


function buildCardRect(entry: HomeCardLayoutEntry): HomeCardRect | null {
  const size = resolveHomeCardSize(entry.id, entry);
  if (!size) {
    return null;
  }
  return {
    x: entry.x,
    y: entry.y,
    width: size.width,
    height: size.height,
  };
}

export function HomeCardCanvas({
  layout,
  onMoveCard,
  onResizeCard,
  onLayoutChangeEnd,
}: HomeCardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<HomeCardId, HTMLDivElement>());
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const suppressNextClickRef = useRef(false);
  const onMoveCardRef = useRef(onMoveCard);
  const onResizeCardRef = useRef(onResizeCard);
  const onLayoutChangeEndRef = useRef(onLayoutChangeEnd);
  onMoveCardRef.current = onMoveCard;
  onResizeCardRef.current = onResizeCard;
  onLayoutChangeEndRef.current = onLayoutChangeEnd;

  const [pendingDragId, setPendingDragId] = useState<HomeCardId | null>(null);
  const [draggingId, setDraggingId] = useState<HomeCardId | null>(null);
  const [resizingId, setResizingId] = useState<HomeCardId | null>(null);
  const [activeResizeHandle, setActiveResizeHandle] =
    useState<HomeCardResizeHandle | null>(null);
  const [cardHeights, setCardHeights] = useState<Partial<Record<HomeCardId, number>>>(
    {},
  );

  const interactingCardId = pendingDragId ?? draggingId ?? resizingId;

  useEffect(() => {
    const observers: ResizeObserver[] = [];

    for (const entry of layout) {
      const node = cardRefs.current.get(entry.id);
      if (!node) {
        continue;
      }
      const observer = new ResizeObserver(() => {
        setCardHeights((current) => ({
          ...current,
          [entry.id]: node.offsetHeight,
        }));
      });
      observer.observe(node);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
    };
  }, [layout]);

  const canvasMinHeight = useMemo(() => {
    const bottoms = layout.map(
      (entry) => entry.y + (cardHeights[entry.id] ?? getHomeCardSlotHeight(entry)),
    );
    return Math.max(480, ...bottoms, 0) + 48;
  }, [cardHeights, layout]);

  const handleWindowPointerMoveRef = useRef((event: PointerEvent) => {
    const dragState = dragStateRef.current;
    const canvas = canvasRef.current;
    if (!dragState || !canvas || event.pointerId !== dragState.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startClientX;
    const deltaY = event.clientY - dragState.startClientY;

    if (!dragState.moved) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }
      dragState.moved = true;
      setDraggingId(dragState.id);
      setPendingDragId(null);
    }

    event.preventDefault();

    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left - dragState.offsetX;
    const y = event.clientY - canvasRect.top - dragState.offsetY;
    onMoveCardRef.current(dragState.id, x, y);
  });

  const handleWindowPointerUpRef = useRef((event: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    if (dragState.moved) {
      event.preventDefault();
      onLayoutChangeEndRef.current();
      suppressNextClickRef.current = true;
    }

    dragStateRef.current = null;
    setDraggingId(null);
    setPendingDragId(null);
    clearDragSessionListeners(
      handleWindowPointerMoveRef.current,
      handleWindowPointerUpRef.current,
    );
  });

  useEffect(
    () => () => {
      if (dragStateRef.current) {
        clearDragSessionListeners(
          handleWindowPointerMoveRef.current,
          handleWindowPointerUpRef.current,
        );
        dragStateRef.current = null;
      }
    },
    [],
  );

  const handleCardPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, entry: HomeCardLayoutEntry) => {
      if (event.button !== 0 || resizeStateRef.current) {
        return;
      }

      if ((event.target as HTMLElement).closest("[data-home-card-resize-handle]")) {
        return;
      }

      if (shouldIgnoreHomeCardDrag(event.target)) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      dragStateRef.current = {
        id: entry.id,
        offsetX: event.clientX - canvasRect.left - entry.x,
        offsetY: event.clientY - canvasRect.top - entry.y,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        moved: false,
      };
      setPendingDragId(entry.id);

      window.addEventListener("pointermove", handleWindowPointerMoveRef.current);
      window.addEventListener("pointerup", handleWindowPointerUpRef.current);
      window.addEventListener("pointercancel", handleWindowPointerUpRef.current);
    },
    [],
  );

  const handleResizePointerDown = useCallback(
    (
      entry: HomeCardLayoutEntry,
      handle: HomeCardResizeHandle,
      event: ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (event.button !== 0 || dragStateRef.current) {
        return;
      }

      const originRect = buildCardRect(entry);
      const canvas = canvasRef.current;
      if (!originRect || !canvas) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      resizeStateRef.current = {
        id: entry.id,
        handle,
        pointerId: event.pointerId,
        originRect,
        startClientX: event.clientX,
        startClientY: event.clientY,
      };
      setResizingId(entry.id);
      setActiveResizeHandle(handle);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handleResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = resizeStateRef.current;
      const canvas = canvasRef.current;
      if (!session || !canvas || event.pointerId !== session.pointerId) {
        return;
      }

      event.preventDefault();

      const mins = MIN_HOME_CARD_SIZE[session.id as HomeResizableCardId];
      const nextRect = applyHomeCardResize(
        session.originRect,
        session.handle,
        event.clientX - session.startClientX,
        event.clientY - session.startClientY,
        mins.width,
        mins.height,
        getCanvasBounds(canvas),
      );

      onResizeCardRef.current(session.id, nextRect);
    },
    [],
  );

  const finishResizePointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = resizeStateRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      onLayoutChangeEndRef.current();
      resizeStateRef.current = null;
      setResizingId(null);
      setActiveResizeHandle(null);
    },
    [],
  );

  const handleClickCapture = useCallback((event: ReactMouseEvent) => {
    if (suppressNextClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClickRef.current = false;
    }
  }, []);

  return (
    <HomeCardCanvasInteractionContext.Provider value={{ interactingCardId }}>
      <div
        ref={canvasRef}
        className="relative w-full"
        style={{ minHeight: canvasMinHeight }}
        onClickCapture={handleClickCapture}
      >
        {layout.map((entry) => {
          const Card = getHomeCardComponent(entry.id);
          if (!Card) {
            return null;
          }

          const resizable = isHomeCardResizable(entry.id);
          const size = resolveHomeCardSize(entry.id, entry);
          const slotContext =
            resizable && size
              ? ({
                  fillSlot: true as const,
                  width: size.width,
                  height: size.height,
                })
              : null;

          return (
            <div
              key={entry.id}
              ref={(node) => {
                if (node) {
                  cardRefs.current.set(entry.id, node);
                } else {
                  cardRefs.current.delete(entry.id);
                }
              }}
              className={[
                "group/card-slot absolute",
                resizable ? "" : "w-full max-w-lg",
                draggingId === entry.id || resizingId === entry.id
                  ? "z-30"
                  : "z-10",
                draggingId === entry.id ? "cursor-grabbing" : "cursor-grab",
              ].join(" ")}
              style={{
                left: entry.x,
                top: entry.y,
                width: size?.width,
                height: size?.height,
                touchAction:
                  draggingId === entry.id || resizingId === entry.id
                    ? "none"
                    : undefined,
              }}
              onPointerDown={(event) => handleCardPointerDown(event, entry)}
            >
              {resizable ? (
                <HomeCardResizeHandles
                  activeHandle={resizingId === entry.id ? activeResizeHandle : null}
                  onPointerDown={(handle, event) =>
                    handleResizePointerDown(entry, handle, event)
                  }
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={finishResizePointer}
                  onPointerCancel={finishResizePointer}
                />
              ) : null}

              <HomeCardSlotContext.Provider value={slotContext}>
                <div
                  className={
                    resizable
                      ? "flex h-full min-h-0 flex-col overflow-hidden [&>:first-child]:!mt-0"
                      : "[&>:first-child]:!mt-0"
                  }
                >
                  <Card />
                </div>
              </HomeCardSlotContext.Provider>
            </div>
          );
        })}
      </div>
    </HomeCardCanvasInteractionContext.Provider>
  );
}
