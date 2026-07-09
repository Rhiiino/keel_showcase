// keel_web/src/components/keelPersona/elements/KeelPersonaLineElement.tsx

import type { PointerEvent } from "react";

import type { KeelPersonaLineElement } from "../../../lib/keelPersona";
import type { TeslaLineSweepClip } from "../../../lib/keelPersona/teslaLineSweep";
import { LoadingIconSweepLineBar } from "../loadingIcon/LoadingIconSweepLineBar";

type KeelPersonaLineElementProps = {
  element: KeelPersonaLineElement;
  teslaGlowClip?: TeslaLineSweepClip;
  isFocused: boolean;
  onBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onRotatePointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onContextMenu: (elementId: string, event: React.MouseEvent<HTMLElement>) => void;
};

export function KeelPersonaLineElementView({
  element,
  teslaGlowClip,
  isFocused,
  onBodyPointerDown,
  onRotatePointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: KeelPersonaLineElementProps) {
  const radians = (element.angle * Math.PI) / 180;
  const rotateHandleX = element.x + Math.cos(radians) * (element.length / 2);
  const rotateHandleY = element.y + Math.sin(radians) * (element.length / 2);
  const teslaActive = teslaGlowClip !== undefined;

  return (
    <div
      className="pointer-events-none absolute overflow-visible"
      style={{ left: element.x, top: element.y, zIndex: element.zIndex }}
    >
      <div
        className={`pointer-events-auto absolute touch-none overflow-visible ${
          isFocused ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        }`}
        style={{
          transform: `translate(-50%, -50%) rotate(${element.angle}deg)`,
        }}
        onPointerDown={(event) => onBodyPointerDown(element.id, event)}
        onPointerMove={(event) => onPointerMove(element.id, event)}
        onPointerUp={(event) => onPointerUp(element.id, event)}
        onPointerCancel={(event) => onPointerUp(element.id, event)}
        onContextMenu={(event) => onContextMenu(element.id, event)}
      >
        <div className={`overflow-visible ${isFocused ? "ring-2 ring-amber-300/80" : ""}`}>
          {teslaActive ? (
            <LoadingIconSweepLineBar
              width={element.length}
              height={element.thickness}
              clip={teslaGlowClip ?? "hidden"}
            />
          ) : (
            <div
              style={{
                width: element.length,
                height: element.thickness,
                borderRadius: element.thickness,
                backgroundColor: element.color,
              }}
            />
          )}
        </div>
      </div>

      {isFocused ? (
        <div
          className="pointer-events-auto absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-white/80 bg-sky-300/90 shadow-sm touch-none active:cursor-grabbing"
          style={{ left: rotateHandleX - element.x, top: rotateHandleY - element.y }}
          onPointerDown={(event) => onRotatePointerDown(element.id, event)}
          onPointerMove={(event) => onPointerMove(element.id, event)}
          onPointerUp={(event) => onPointerUp(element.id, event)}
          onPointerCancel={(event) => onPointerUp(element.id, event)}
          onContextMenu={(event) => onContextMenu(element.id, event)}
        />
      ) : null}
    </div>
  );
}
