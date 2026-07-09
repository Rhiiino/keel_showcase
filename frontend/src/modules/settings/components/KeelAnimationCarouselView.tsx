// keel_web/src/modules/settings/components/KeelAnimationCarouselView.tsx

import { useCallback, useEffect, useRef, useState } from "react";

import type { KeelAnimationClip } from "../../../lib/keelPersona";
import { KeelAnimationSettingsCard } from "./KeelAnimationSettingsCard";

const SLOT_WIDTH_PX = 260;
const DRAG_THRESHOLD_PX = 8;
const FOCUSED_SCALE = 1.12;
const UNFOCUSED_SCALE = 0.82;
const UNFOCUSED_OPACITY = 0.5;
const SNAP_REST_MS = 150;
const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 700;

type KeelAnimationCarouselViewProps = {
  clips: KeelAnimationClip[];
};

type DragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
};


// ----- Carousel view
export function KeelAnimationCarouselView({ clips }: KeelAnimationCarouselViewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const programmaticFocusIndexRef = useRef<number | null>(null);
  const programmaticFocusTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
  });
  const suppressClickRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [edgePadPx, setEdgePadPx] = useState(0);

  const updateEdgePad = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    setEdgePadPx(Math.max(0, scroller.clientWidth / 2 - SLOT_WIDTH_PX / 2));
  }, []);

  const getMaxScrollLeft = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return 0;
    }
    return Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  }, []);

  const getTargetLeft = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current;
      const slot = slotRefs.current[index];
      if (!scroller || !slot) {
        return 0;
      }
      const slotCenter = slot.offsetLeft + slot.offsetWidth / 2;
      const ideal = slotCenter - scroller.clientWidth / 2;
      return Math.min(getMaxScrollLeft(), Math.max(0, ideal));
    },
    [getMaxScrollLeft],
  );

  const getNearestIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || clips.length === 0) {
      return 0;
    }

    const scrollCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    slotRefs.current.forEach((slot, index) => {
      if (!slot) {
        return;
      }
      const slotCenter = slot.offsetLeft + slot.offsetWidth / 2;
      const distance = Math.abs(slotCenter - scrollCenter);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, [clips.length]);

  const clearProgrammaticFocus = useCallback(() => {
    programmaticFocusIndexRef.current = null;
    if (programmaticFocusTimerRef.current !== null) {
      window.clearTimeout(programmaticFocusTimerRef.current);
      programmaticFocusTimerRef.current = null;
    }
  }, []);

  const lockProgrammaticFocus = useCallback(
    (index: number) => {
      clearProgrammaticFocus();
      programmaticFocusIndexRef.current = index;
      programmaticFocusTimerRef.current = window.setTimeout(() => {
        programmaticFocusTimerRef.current = null;
        programmaticFocusIndexRef.current = null;
      }, PROGRAMMATIC_SCROLL_TIMEOUT_MS);
    },
    [clearProgrammaticFocus],
  );

  const updateActive = useCallback(() => {
    if (clips.length === 0) {
      return;
    }

    const lockedIndex = programmaticFocusIndexRef.current;
    if (lockedIndex !== null) {
      setActiveIndex((current) => (current === lockedIndex ? current : lockedIndex));
      return;
    }

    const nextActive = getNearestIndex();
    setActiveIndex((current) => (current === nextActive ? current : nextActive));
  }, [clips.length, getNearestIndex]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        return;
      }

      if (behavior === "smooth") {
        lockProgrammaticFocus(index);
      } else {
        clearProgrammaticFocus();
      }

      setActiveIndex(index);
      scroller.scrollTo({ left: getTargetLeft(index), behavior });
    },
    [clearProgrammaticFocus, getTargetLeft, lockProgrammaticFocus],
  );

  const scheduleSnap = useCallback(() => {
    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current);
    }

    snapTimerRef.current = window.setTimeout(() => {
      snapTimerRef.current = null;
      const scroller = scrollerRef.current;
      if (!scroller || dragStateRef.current.pointerId !== null) {
        return;
      }

      const lockedIndex = programmaticFocusIndexRef.current;
      if (lockedIndex !== null) {
        const lockedTarget = getTargetLeft(lockedIndex);
        if (Math.abs(lockedTarget - scroller.scrollLeft) > 3) {
          return;
        }
        clearProgrammaticFocus();
      }

      const index = getNearestIndex();
      const target = getTargetLeft(index);
      if (Math.abs(target - scroller.scrollLeft) > 1) {
        scroller.scrollTo({ left: target, behavior: "smooth" });
      }
      setActiveIndex(index);
    }, SNAP_REST_MS);
  }, [clearProgrammaticFocus, getNearestIndex, getTargetLeft]);

  useEffect(() => {
    updateEdgePad();
    updateActive();
  }, [clips, updateActive, updateEdgePad]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    updateEdgePad();
    const observer = new ResizeObserver(() => updateEdgePad());
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [updateEdgePad]);

  useEffect(() => {
    if (activeIndex > clips.length - 1) {
      setActiveIndex(Math.max(0, clips.length - 1));
    }
  }, [activeIndex, clips.length]);

  // Trackpad/mouse-wheel: translate vertical wheel intent into horizontal scroll.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      clearProgrammaticFocus();
      const delta =
        Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) {
        return;
      }
      scroller.scrollLeft += delta;
      event.preventDefault();
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [clearProgrammaticFocus]);

  useEffect(() => {
    const onResize = () => {
      updateEdgePad();
      updateActive();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateActive, updateEdgePad]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current);
      }
      clearProgrammaticFocus();
    },
    [clearProgrammaticFocus],
  );

  const handleScroll = () => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      updateActive();
    });
    scheduleSnap();
  };

  // Mouse click-drag panning. Touch uses native `touch-action: pan-x` scrolling.
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType !== "mouse") {
      return;
    }

    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    clearProgrammaticFocus();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
      didDrag: false,
    };
    suppressClickRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const drag = dragStateRef.current;
    if (!scroller || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    if (!drag.didDrag && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      drag.didDrag = true;
      suppressClickRef.current = true;
      scroller.setPointerCapture(event.pointerId);
    }

    if (drag.didDrag) {
      const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      scroller.scrollLeft = Math.min(maxScroll, Math.max(0, drag.startScrollLeft - deltaX));
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const drag = dragStateRef.current;
    if (!scroller || drag.pointerId !== event.pointerId) {
      return;
    }

    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    const didDrag = drag.didDrag;
    dragStateRef.current.pointerId = null;

    if (didDrag) {
      scrollToIndex(getNearestIndex(), "smooth");
    }
  };

  const handleSlotClick = (index: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    scrollToIndex(index, "smooth");
  };

  return (
    <section aria-label="Animations carousel" className="w-full">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        className="flex cursor-grab touch-pan-x items-center overflow-x-auto overflow-y-visible overscroll-x-contain py-16 active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div aria-hidden className="shrink-0" style={{ width: edgePadPx }} />
        {clips.map((clip, index) => {
          const focused = index === activeIndex;
          return (
            <div
              key={clip.id}
              ref={(node) => {
                slotRefs.current[index] = node;
              }}
              role="button"
              tabIndex={0}
              aria-current={focused ? true : undefined}
              aria-label={`Focus ${clip.name}`}
              onClick={() => handleSlotClick(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSlotClick(index);
                }
              }}
              className="flex shrink-0 cursor-pointer select-none items-center justify-center overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-lime-300/50"
              style={{ width: SLOT_WIDTH_PX }}
            >
              <div
                className="pointer-events-none origin-center transition-[transform,opacity] duration-300 ease-out will-change-[transform,opacity]"
                style={{
                  transform: `scale(${focused ? FOCUSED_SCALE : UNFOCUSED_SCALE})`,
                  opacity: focused ? 1 : UNFOCUSED_OPACITY,
                }}
              >
                <KeelAnimationSettingsCard clip={clip} variant="carousel" focused={focused} />
              </div>
            </div>
          );
        })}
        <div aria-hidden className="shrink-0" style={{ width: edgePadPx }} />
      </div>
    </section>
  );
}
