// keel_web/src/modules/projects/hooks/useWorkspaceNotesGridEdgeProximity.ts

// Tracks which shared grid resize boundary is near the pointer.

import { useCallback, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { PanelPlacement } from "../../media/lib/panelGrid";
import { PANEL_GRID_GAP_PX } from "../../media/lib/panelGridMetrics";
import {
  collectWorkspaceNotesGridResizeBoundaries,
  distanceToGridResizeBoundary,
  gridResizeBoundaryHitRect,
  WORKSPACE_NOTES_GRID_EDGE_PROXIMITY_PX,
  type GridResizeBoundarySegment,
} from "../lib/workspace/note/workspaceNotesGridResizeEdges";

type UseWorkspaceNotesGridEdgeProximityOptions = {
  placements: PanelPlacement[];
  columnCount: number;
  rowUnitPx: number;
  gridWidth: number;
  disabled?: boolean;
};

function segmentProximityPriority(
  segment: GridResizeBoundarySegment,
  pointerX: number,
  pointerY: number,
  columnCount: number,
  gridWidth: number,
  rowUnitPx: number,
): number {
  const distance = distanceToGridResizeBoundary(
    pointerX,
    pointerY,
    segment,
    columnCount,
    gridWidth,
    rowUnitPx,
    PANEL_GRID_GAP_PX,
  );
  if (distance > WORKSPACE_NOTES_GRID_EDGE_PROXIMITY_PX) {
    return Number.POSITIVE_INFINITY;
  }

  const hit = gridResizeBoundaryHitRect(
    segment,
    columnCount,
    gridWidth,
    rowUnitPx,
    PANEL_GRID_GAP_PX,
  );
  const withinX = pointerX >= hit.left && pointerX <= hit.left + hit.width;
  const withinY = pointerY >= hit.top && pointerY <= hit.top + hit.height;
  const axisBias =
    segment.orientation === "horizontal"
      ? withinX
        ? 0
        : 0.5
      : withinY
        ? 0
        : 0.5;

  return distance + axisBias;
}

function nearestBoundarySegment(
  pointerX: number,
  pointerY: number,
  segments: GridResizeBoundarySegment[],
  columnCount: number,
  gridWidth: number,
  rowUnitPx: number,
): GridResizeBoundarySegment | null {
  let nearest: { segment: GridResizeBoundarySegment; priority: number } | null = null;

  for (const segment of segments) {
    const priority = segmentProximityPriority(
      segment,
      pointerX,
      pointerY,
      columnCount,
      gridWidth,
      rowUnitPx,
    );
    if (!Number.isFinite(priority)) {
      continue;
    }
    if (!nearest || priority < nearest.priority) {
      nearest = { segment, priority };
    }
  }

  return nearest?.segment ?? null;
}

export function useWorkspaceNotesGridEdgeProximity({
  placements,
  columnCount,
  rowUnitPx,
  gridWidth,
  disabled = false,
}: UseWorkspaceNotesGridEdgeProximityOptions) {
  const [nearSegmentId, setNearSegmentId] = useState<string | null>(null);
  const segments = useMemo(
    () => collectWorkspaceNotesGridResizeBoundaries(placements),
    [placements],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || gridWidth <= 0) {
        setNearSegmentId(null);
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const nearest = nearestBoundarySegment(
        event.clientX - rect.left,
        event.clientY - rect.top,
        segments,
        columnCount,
        gridWidth,
        rowUnitPx,
      );
      setNearSegmentId(nearest?.id ?? null);
    },
    [columnCount, disabled, gridWidth, rowUnitPx, segments],
  );

  const handlePointerLeave = useCallback(() => {
    if (!disabled) {
      setNearSegmentId(null);
    }
  }, [disabled]);

  return {
    nearSegmentId,
    handlePointerMove,
    handlePointerLeave,
  };
}
