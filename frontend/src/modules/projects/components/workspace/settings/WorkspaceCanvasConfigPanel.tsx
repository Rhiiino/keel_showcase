// keel_web/src/modules/projects/components/workspace/settings/WorkspaceCanvasConfigPanel.tsx

// Draggable workspace settings panel with position controlled by persisted settings.

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import type { WorkspaceCanvasConfigPanelPosition } from "../../../lib/workspace";

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
  position: WorkspaceCanvasConfigPanelPosition,
  panelWidth: number,
  panelHeight: number,
  boundsWidth: number,
  boundsHeight: number,
): WorkspaceCanvasConfigPanelPosition {
  const maxX = Math.max(0, boundsWidth - panelWidth);
  const maxY = Math.max(0, boundsHeight - panelHeight);
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
}

type WorkspaceCanvasConfigPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: WorkspaceCanvasConfigPanelPosition;
  onPositionChange: (position: WorkspaceCanvasConfigPanelPosition) => void;
  children: ReactNode;
};

export function WorkspaceCanvasConfigPanel({
  open,
  onOpenChange,
  position,
  onPositionChange,
  children,
}: WorkspaceCanvasConfigPanelProps) {
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
    (candidate: WorkspaceCanvasConfigPanelPosition) => {
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

  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    const handleResize = () => {
      const clamped = measureAndClamp(positionRef.current);
      if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
        onPositionChange(clamped);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureAndClamp, onPositionChange]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const current = positionRef.current;
      const clamped = measureAndClamp(current);
      if (clamped.x !== current.x || clamped.y !== current.y) {
        onPositionChange(clamped);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [measureAndClamp, onPositionChange, open]);

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

      onPositionChange(
        measureAndClamp({
          x: session.originX + deltaX,
          y: session.originY + deltaY,
        }),
      );
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
        onPositionChange(
          measureAndClamp({
            x: session.originX + (event.clientX - session.startClientX),
            y: session.originY + (event.clientY - session.startClientY),
          }),
        );
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
          <span className="whitespace-nowrap">Workspace settings</span>
          <ConfigPanelChevron open={open} />
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="workspace-config"
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
