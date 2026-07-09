// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceNotesGridTileAddZones.tsx

// Per-tile edge hover plus zones for split-adding notes in the workspace notes grid.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import type { PanelPlacement } from "../../../../media/lib/panelGrid";
import {
  canSplitTile,
  type SplitZone,
} from "../../../../media/lib/panelGridSplit";

const EDGE_ADD_ZONE_RATIO = 0.15;

type WorkspaceNotesGridTileAddZonesProps = {
  placement: PanelPlacement;
  disabled?: boolean;
  onSplitAdd: (noteId: string, zone: SplitZone) => void;
  children: ReactNode;
};

function resolveEdgeAddZone(
  relativeX: number,
  relativeY: number,
  width: number,
  height: number,
): SplitZone | null {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const xRatio = relativeX / width;
  const yRatio = relativeY / height;
  const inTop = yRatio <= EDGE_ADD_ZONE_RATIO;
  const inBottom = yRatio >= 1 - EDGE_ADD_ZONE_RATIO;
  const inLeft = xRatio <= EDGE_ADD_ZONE_RATIO;
  const inRight = xRatio >= 1 - EDGE_ADD_ZONE_RATIO;

  if (!inTop && !inBottom && !inLeft && !inRight) {
    return null;
  }

  const candidates: { zone: SplitZone; distance: number }[] = [];
  if (inTop) {
    candidates.push({ zone: "top", distance: yRatio });
  }
  if (inBottom) {
    candidates.push({ zone: "bottom", distance: 1 - yRatio });
  }
  if (inLeft) {
    candidates.push({ zone: "left", distance: xRatio });
  }
  if (inRight) {
    candidates.push({ zone: "right", distance: 1 - xRatio });
  }

  candidates.sort((left, right) => left.distance - right.distance);
  return candidates[0]?.zone ?? null;
}

function NotesGridSplitAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add note on this side"
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-500/90 text-white shadow-lg transition hover:bg-sky-400"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

function SplitAddBandHorizontal({
  active,
  bandSizePx,
  onAdd,
}: {
  active: boolean;
  bandSizePx: number;
  onAdd: () => void;
}) {
  return (
    <div
      className={[
        "flex w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-sky-400/40 bg-sky-950/40 transition-[max-height,opacity] duration-300 ease-in-out",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      style={{
        height: bandSizePx,
        maxHeight: active ? bandSizePx : 0,
      }}
    >
      {active ? (
        <div className="pointer-events-auto">
          <NotesGridSplitAddButton onClick={onAdd} />
        </div>
      ) : null}
    </div>
  );
}

function SplitAddBandVertical({
  active,
  bandSizePx,
  onAdd,
}: {
  active: boolean;
  bandSizePx: number;
  onAdd: () => void;
}) {
  return (
    <div
      className={[
        "flex shrink-0 self-stretch items-center justify-center overflow-hidden rounded-lg border border-dashed border-sky-400/40 bg-sky-950/40 transition-[max-width,opacity] duration-300 ease-in-out",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      style={{
        width: bandSizePx,
        maxWidth: active ? bandSizePx : 0,
      }}
    >
      {active ? (
        <div className="pointer-events-auto">
          <NotesGridSplitAddButton onClick={onAdd} />
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceNotesGridTileAddZones({
  placement,
  disabled = false,
  onSplitAdd,
  children,
}: WorkspaceNotesGridTileAddZonesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeZone, setActiveZone] = useState<SplitZone | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      setContainerSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (disabled) {
      setActiveZone(null);
    }
  }, [disabled]);

  const handleAdd = useCallback(
    (zone: SplitZone) => {
      onSplitAdd(placement.id, zone);
      setActiveZone(null);
    },
    [onSplitAdd, placement.id],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) {
        setActiveZone(null);
        return;
      }

      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      const zone = resolveEdgeAddZone(
        event.clientX - bounds.left,
        event.clientY - bounds.top,
        bounds.width,
        bounds.height,
      );
      if (zone && canSplitTile(placement, zone)) {
        setActiveZone(zone);
        return;
      }

      setActiveZone(null);
    },
    [disabled, placement],
  );

  const handlePointerLeave = useCallback(() => {
    setActiveZone(null);
  }, []);

  const bandHeightPx = containerSize.height * EDGE_ADD_ZONE_RATIO;
  const bandWidthPx = containerSize.width * EDGE_ADD_ZONE_RATIO;
  const zonesEnabled = !disabled;

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full flex-row"
      onPointerMove={zonesEnabled ? handlePointerMove : undefined}
      onPointerLeave={zonesEnabled ? handlePointerLeave : undefined}
    >
      <SplitAddBandVertical
        active={zonesEnabled && activeZone === "left"}
        bandSizePx={bandWidthPx}
        onAdd={() => handleAdd("left")}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SplitAddBandHorizontal
          active={zonesEnabled && activeZone === "top"}
          bandSizePx={bandHeightPx}
          onAdd={() => handleAdd("top")}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden transition-[flex-grow] duration-300 ease-in-out">
          {children}
        </div>
        <SplitAddBandHorizontal
          active={zonesEnabled && activeZone === "bottom"}
          bandSizePx={bandHeightPx}
          onAdd={() => handleAdd("bottom")}
        />
      </div>
      <SplitAddBandVertical
        active={zonesEnabled && activeZone === "right"}
        bandSizePx={bandWidthPx}
        onAdd={() => handleAdd("right")}
      />
    </div>
  );
}
