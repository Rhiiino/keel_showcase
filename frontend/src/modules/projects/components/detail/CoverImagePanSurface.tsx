// keel_web/src/modules/projects/components/detail/CoverImagePanSurface.tsx

// Drag-to-pan wrapper for the project form cover image preview.

import { useRef, type PointerEvent, type ReactNode } from "react";

import { shiftCoverImagePosition } from "../../lib/project/appearance";

type CoverImagePanSurfaceProps = {
  positionX: number;
  positionY: number;
  scale: number;
  disabled?: boolean;
  onPositionChange: (nextX: number, nextY: number) => void;
  children: ReactNode;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export function CoverImagePanSurface({
  positionX,
  positionY,
  scale,
  disabled = false,
  onPositionChange,
  children,
}: CoverImagePanSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const finishDrag = (pointerId: number) => {
    if (dragRef.current?.pointerId === pointerId) {
      dragRef.current = null;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: positionX,
      originY: positionY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const next = shiftCoverImagePosition(
      drag.originX,
      drag.originY,
      event.clientX - drag.startX,
      event.clientY - drag.startY,
      rect.width,
      rect.height,
      scale,
    );
    onPositionChange(next.positionX, next.positionY);
  };

  return (
    <div
      ref={containerRef}
      className={[
        "h-full w-full select-none",
        disabled ? "" : "cursor-grab touch-none active:cursor-grabbing",
      ].join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishDrag(event.pointerId)}
      onPointerCancel={(event) => finishDrag(event.pointerId)}
    >
      {children}
    </div>
  );
}
