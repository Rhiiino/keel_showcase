// keel_web/src/modules/coak/components/CoakPanelResizeHandles.tsx

import type { CoakResizeHandle } from "../../lib/panels/coakPanelGeometry";

type CoakPanelResizeHandlesProps = {
  handles: CoakResizeHandle[];
  activeHandle: CoakResizeHandle | null;
  onPointerDown: (handle: CoakResizeHandle, event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
};

const HANDLE_CLASS =
  "absolute z-20 touch-none select-none bg-transparent hover:bg-lime-400/20";

const HANDLE_CONFIG: Record<
  CoakResizeHandle,
  { className: string; ariaLabel: string }
> = {
  n: {
    className: "left-3 right-3 top-0 h-2 cursor-ns-resize",
    ariaLabel: "Resize panel top edge",
  },
  s: {
    className: "bottom-0 left-3 right-3 h-2 cursor-ns-resize",
    ariaLabel: "Resize panel bottom edge",
  },
  e: {
    className: "bottom-3 right-0 top-3 w-2 cursor-ew-resize",
    ariaLabel: "Resize panel right edge",
  },
  w: {
    className: "bottom-3 left-0 top-3 w-2 cursor-ew-resize",
    ariaLabel: "Resize panel left edge",
  },
  ne: {
    className: "right-0 top-0 h-3 w-3 cursor-nesw-resize",
    ariaLabel: "Resize panel top-right corner",
  },
  nw: {
    className: "left-0 top-0 h-3 w-3 cursor-nwse-resize",
    ariaLabel: "Resize panel top-left corner",
  },
  se: {
    className: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize",
    ariaLabel: "Resize panel bottom-right corner",
  },
  sw: {
    className: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize",
    ariaLabel: "Resize panel bottom-left corner",
  },
};

export function CoakPanelResizeHandles({
  handles,
  activeHandle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CoakPanelResizeHandlesProps) {
  return (
    <>
      {handles.map((handle) => {
        const config = HANDLE_CONFIG[handle];
        return (
          <div
            key={handle}
            role="separator"
            aria-label={config.ariaLabel}
            aria-orientation={handle.length === 1 ? (handle === "n" || handle === "s" ? "horizontal" : "vertical") : undefined}
            className={[
              HANDLE_CLASS,
              config.className,
              activeHandle === handle ? "bg-lime-400/25" : "",
            ].join(" ")}
            onPointerDown={(event) => onPointerDown(handle, event)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
        );
      })}
    </>
  );
}
