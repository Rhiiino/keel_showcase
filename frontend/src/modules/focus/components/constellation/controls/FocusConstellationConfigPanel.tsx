// src/modules/focus/components/constellation/controls/FocusConstellationConfigPanel.tsx

// Draggable constellation settings panel with persisted position and fold state.

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import type { FocusConstellationConfigPanelPosition } from "../../../lib/focus";

const DRAG_THRESHOLD_PX = 4;

function ConfigPanelChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "-rotate-90" : "rotate-90"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function clampPanelPosition(
  position: FocusConstellationConfigPanelPosition,
  panelWidth: number,
  panelHeight: number,
  boundsWidth: number,
  boundsHeight: number,
): FocusConstellationConfigPanelPosition {
  const maxX = Math.max(0, boundsWidth - panelWidth);
  const maxY = Math.max(0, boundsHeight - panelHeight);
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
}

type FocusConstellationConfigPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: FocusConstellationConfigPanelPosition;
  onPositionChange: (position: FocusConstellationConfigPanelPosition) => void;
  children: ReactNode;
};

export function FocusConstellationConfigPanel({
  open,
  onOpenChange,
  position,
  onPositionChange,
  children,
}: FocusConstellationConfigPanelProps) {
  const boundsRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const measureAndClamp = useCallback(
    (candidate: FocusConstellationConfigPanelPosition) => {
      const bounds = boundsRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!bounds || !panel) {
        return candidate;
      }
      return clampPanelPosition(
        candidate,
        panel.width,
        panel.height,
        bounds.width,
        bounds.height,
      );
    },
    [],
  );

  useEffect(() => {
    const handleResize = () => {
      const clamped = measureAndClamp(position);
      if (clamped.x !== position.x || clamped.y !== position.y) {
        onPositionChange(clamped);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureAndClamp, onPositionChange, position]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const clamped = measureAndClamp(position);
      if (clamped.x !== position.x || clamped.y !== position.y) {
        onPositionChange(clamped);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, measureAndClamp, onPositionChange, position]);

  const finishDragSession = useCallback(() => {
    dragSessionRef.current = null;
  }, []);

  const handleHeaderPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }

      dragSessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: position.x,
        originY: position.y,
        moved: false,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position.x, position.y],
  );

  const handleHeaderPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      const deltaX = event.clientX - session.startClientX;
      const deltaY = event.clientY - session.startClientY;
      if (!session.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }

      session.moved = true;
      event.preventDefault();

      const next = measureAndClamp({
        x: session.originX + deltaX,
        y: session.originY + deltaY,
      });
      onPositionChange(next);
    },
    [measureAndClamp, onPositionChange],
  );

  const handleHeaderPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (session.moved) {
        const next = measureAndClamp({
          x: session.originX + (event.clientX - session.startClientX),
          y: session.originY + (event.clientY - session.startClientY),
        });
        onPositionChange(next);
      } else {
        onOpenChange(!open);
      }

      finishDragSession();
    },
    [finishDragSession, measureAndClamp, onOpenChange, onPositionChange, open],
  );

  const handleHeaderPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (session.moved) {
        onPositionChange(
          measureAndClamp({
            x: session.originX,
            y: session.originY,
          }),
        );
      }

      finishDragSession();
    },
    [finishDragSession, measureAndClamp, onPositionChange],
  );

  return (
    <div ref={boundsRef} className="pointer-events-none absolute inset-0">
      <div
        ref={panelRef}
        className="pointer-events-auto absolute w-fit max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md"
        style={{ left: position.x, top: position.y }}
      >
        <button
          type="button"
          aria-expanded={open}
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={handleHeaderPointerCancel}
          className={[
            "flex w-full cursor-grab touch-none select-none items-center justify-between gap-3 rounded-xl text-left text-xs font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white/90 active:cursor-grabbing",
            open ? "mb-3 px-2 py-1.5" : "px-2.5 py-2",
          ].join(" ")}
        >
          <span className="whitespace-nowrap">Constellation settings</span>
          <ConfigPanelChevron open={open} />
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="focus-constellation-config"
              initial={{ height: 0, opacity: 0, y: -6 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-3">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
