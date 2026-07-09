// keel_web/src/modules/home/cards/layout/HomeCardResizeHandles.tsx

// Edge and corner resize handles for resizable home dashboard cards.

import type { PointerEvent as ReactPointerEvent } from "react";

import type { HomeCardResizeHandle } from "./homeCardResize";
import { HOME_CARD_RESIZE_HANDLES } from "./homeCardResize";

type HomeCardResizeHandlesProps = {
  activeHandle: HomeCardResizeHandle | null;
  onPointerDown: (
    handle: HomeCardResizeHandle,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const HANDLE_CLASS =
  "absolute z-20 touch-none select-none bg-transparent hover:bg-stone-400/15";

const HANDLE_CONFIG: Record<
  HomeCardResizeHandle,
  { className: string; ariaLabel: string }
> = {
  n: {
    className: "left-3 right-3 top-0 h-2 cursor-ns-resize",
    ariaLabel: "Resize card top edge",
  },
  s: {
    className: "bottom-0 left-3 right-3 h-2 cursor-ns-resize",
    ariaLabel: "Resize card bottom edge",
  },
  e: {
    className: "bottom-3 right-0 top-3 w-2 cursor-ew-resize",
    ariaLabel: "Resize card right edge",
  },
  w: {
    className: "bottom-3 left-0 top-3 w-2 cursor-ew-resize",
    ariaLabel: "Resize card left edge",
  },
  ne: {
    className: "right-0 top-0 h-3 w-3 cursor-nesw-resize",
    ariaLabel: "Resize card top-right corner",
  },
  nw: {
    className: "left-0 top-0 h-3 w-3 cursor-nwse-resize",
    ariaLabel: "Resize card top-left corner",
  },
  se: {
    className: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize",
    ariaLabel: "Resize card bottom-right corner",
  },
  sw: {
    className: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize",
    ariaLabel: "Resize card bottom-left corner",
  },
};

export function HomeCardResizeHandles({
  activeHandle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: HomeCardResizeHandlesProps) {
  return (
    <>
      {HOME_CARD_RESIZE_HANDLES.map((handle) => {
        const config = HANDLE_CONFIG[handle];
        return (
          <div
            key={handle}
            data-home-card-resize-handle
            role="separator"
            aria-label={config.ariaLabel}
            className={[
              HANDLE_CLASS,
              config.className,
              activeHandle === handle ? "bg-stone-400/20" : "",
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
