// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceNotesGridResizeEdges.tsx

// Shared proximity-revealed resize bars between workspace notes grid tiles.

import { useMemo } from "react";

import type { PanelPlacement, ResizeEdge } from "../../../../media/lib/panelGrid";
import { PANEL_GRID_GAP_PX } from "../../../../media/lib/panelGridMetrics";
import type { WorkspaceNotesGridResizePreview } from "../../../hooks/useWorkspaceNotesGridResize";
import {
  collectWorkspaceNotesGridResizeBoundaries,
  gridResizeBoundaryHitRect,
  gridResizeBoundaryRect,
  isActiveGridResizeBoundary,
  WORKSPACE_NOTES_GRID_EDGE_BAR_PX,
} from "../../../lib/workspace/note/workspaceNotesGridResizeEdges";

type WorkspaceNotesGridResizeEdgesProps = {
  placements: PanelPlacement[];
  columnCount: number;
  rowUnitPx: number;
  gridWidth: number;
  edgeColor: string;
  nearSegmentId: string | null;
  resizePreview: WorkspaceNotesGridResizePreview | null;
  onResizeStart: (
    itemId: string,
    edge: ResizeEdge,
    clientX: number,
    clientY: number,
    pointerId: number,
    boundarySegmentId?: string,
  ) => void;
};

export function WorkspaceNotesGridResizeEdges({
  placements,
  columnCount,
  rowUnitPx,
  gridWidth,
  edgeColor,
  nearSegmentId,
  resizePreview,
  onResizeStart,
}: WorkspaceNotesGridResizeEdgesProps) {
  const segments = useMemo(
    () => collectWorkspaceNotesGridResizeBoundaries(placements),
    [placements],
  );

  if (gridWidth <= 0 || segments.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {segments.map((segment) => {
        const bar = gridResizeBoundaryRect(
          segment,
          columnCount,
          gridWidth,
          rowUnitPx,
          PANEL_GRID_GAP_PX,
        );
        const hit = gridResizeBoundaryHitRect(
          segment,
          columnCount,
          gridWidth,
          rowUnitPx,
          PANEL_GRID_GAP_PX,
        );
        const isActive = resizePreview
          ? isActiveGridResizeBoundary(
              segment,
              resizePreview.itemId,
              resizePreview.edge,
              resizePreview.boundarySegmentId,
            )
          : false;
        const isNear = nearSegmentId === segment.id;
        const isVisible = isNear || isActive;
        const cursor = segment.orientation === "vertical" ? "ew-resize" : "ns-resize";

        return (
          <button
            key={segment.id}
            type="button"
            aria-label="Resize notes grid boundary"
            aria-hidden={!isVisible}
            tabIndex={isVisible ? 0 : -1}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onResizeStart(
                segment.targetItemId,
                segment.edge,
                event.clientX,
                event.clientY,
                event.pointerId,
                segment.id,
              );
            }}
            className="absolute touch-none border-0 bg-transparent p-0 outline-none"
            style={{
              left: hit.left,
              top: hit.top,
              width: hit.width,
              height: hit.height,
              cursor,
              pointerEvents: isVisible ? "auto" : "none",
            }}
          >
            <span
              className="pointer-events-none absolute block transition-[opacity,box-shadow] duration-150"
              style={{
                left: bar.left - hit.left,
                top: bar.top - hit.top,
                width:
                  segment.orientation === "vertical"
                    ? WORKSPACE_NOTES_GRID_EDGE_BAR_PX
                    : bar.width,
                height:
                  segment.orientation === "horizontal"
                    ? WORKSPACE_NOTES_GRID_EDGE_BAR_PX
                    : bar.height,
                backgroundColor: edgeColor,
                opacity: isVisible ? 1 : 0,
                borderRadius: WORKSPACE_NOTES_GRID_EDGE_BAR_PX,
                boxShadow: isVisible
                  ? `0 0 8px ${edgeColor}, 0 0 16px color-mix(in srgb, ${edgeColor} 55%, transparent)`
                  : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
