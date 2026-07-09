// keel_web/src/modules/dev/components/keelPersona/elements/KeelPersonaGlassOverlayElement.tsx

import type { PointerEvent } from "react";

import { cornersToClipPath, glassColorToRgba } from "../../../lib/keelPersona/geometry/glassOverlayGeometry";
import type { KeelPersonaGlassOverlayElement } from "../../../lib/keelPersona";
import type { CanvasPoint } from "../../../lib/keelPersona/geometry/canvasPointer";

type KeelPersonaGlassOverlayElementProps = {
  element: KeelPersonaGlassOverlayElement;
  isFocused: boolean;
  displayCorners?: readonly CanvasPoint[];
  onBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onCornerPointerDown: (
    elementId: string,
    cornerIndex: number,
    event: PointerEvent<HTMLElement>,
  ) => void;
  onPointerMove: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onContextMenu: (elementId: string, event: React.MouseEvent<HTMLElement>) => void;
};

export function KeelPersonaGlassOverlayElementView({
  element,
  isFocused,
  displayCorners,
  onBodyPointerDown,
  onCornerPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: KeelPersonaGlassOverlayElementProps) {
  const corners = displayCorners ?? element.corners;
  const clipPath = cornersToClipPath(corners);

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: element.zIndex }}>
      <div
        className={`pointer-events-auto absolute inset-0 touch-none ${
          isFocused ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        }`}
        style={{ clipPath }}
        onPointerDown={(event) => onBodyPointerDown(element.id, event)}
        onPointerMove={(event) => onPointerMove(element.id, event)}
        onPointerUp={(event) => onPointerUp(element.id, event)}
        onPointerCancel={(event) => onPointerUp(element.id, event)}
        onContextMenu={(event) => onContextMenu(element.id, event)}
      >
        <div
          className={`h-full w-full border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${
            isFocused ? "ring-1 ring-amber-300/70" : ""
          }`}
          style={{
            backgroundColor: glassColorToRgba(element.color),
            backdropFilter: "blur(10px) saturate(1.25)",
            WebkitBackdropFilter: "blur(10px) saturate(1.25)",
          }}
        />
      </div>

      {isFocused
        ? corners.map((corner, index) => (
            <div
              key={`${element.id}-corner-${index}`}
              className="pointer-events-auto absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border border-white/80 bg-sky-300/90 shadow-sm touch-none"
              style={{ left: corner.x, top: corner.y }}
              onPointerDown={(event) => onCornerPointerDown(element.id, index, event)}
              onPointerMove={(event) => onPointerMove(element.id, event)}
              onPointerUp={(event) => onPointerUp(element.id, event)}
              onPointerCancel={(event) => onPointerUp(element.id, event)}
              onContextMenu={(event) => onContextMenu(element.id, event)}
            />
          ))
        : null}
    </div>
  );
}
