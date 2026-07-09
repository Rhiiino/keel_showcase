// keel_web/src/modules/projects/hooks/useWorkspaceNotesGridResize.ts

// Elastic resize for workspace notes grid tiles with local layout persistence.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { computeElasticResizePixelPreviews } from "../../media/lib/panelGridElasticPreview";
import type { PanelPlacement, ResizeEdge } from "../../media/lib/panelGrid";
import {
  computePanelGridMetrics,
  deltaFromPointer,
  PANEL_GRID_GAP_PX,
} from "../../media/lib/panelGridMetrics";
import { applyElasticResize } from "../../media/lib/panelGridReflow";
import { placementsEqual } from "../lib/workspace/note/workspaceNotesGridLayout";

type UseWorkspaceNotesGridResizeOptions = {
  onPersist: (placements: PanelPlacement[]) => void;
};

export type WorkspaceNotesGridResizeMetrics = {
  columnCount: number;
  rowUnitPx: number;
  gridWidth: number;
};

export type WorkspaceNotesGridResizePreview = {
  itemId: string;
  edge: ResizeEdge;
  boundarySegmentId?: string;
  offsetX: number;
  offsetY: number;
  tileStyles: Record<string, CSSProperties>;
};

type ActiveResize = {
  itemId: string;
  edge: ResizeEdge;
  boundarySegmentId?: string;
  originStartX: number;
  originStartY: number;
  baseline: PanelPlacement[];
  initialPlacements: PanelPlacement[];
  pointerId: number;
  columnCount: number;
  rowUnitPx: number;
  gridWidth: number;
};

function lockDocumentPointer() {
  document.body.style.userSelect = "none";
  document.body.style.touchAction = "none";
}

function unlockDocumentPointer() {
  document.body.style.userSelect = "";
  document.body.style.touchAction = "";
}

function applyResizeFromOrigin(
  active: ActiveResize,
  clientX: number,
  clientY: number,
): {
  next: PanelPlacement[] | null;
  remainderX: number;
  remainderY: number;
  columnStep: number;
  rowStep: number;
} {
  const { columnStep, rowStep } = computePanelGridMetrics(
    active.gridWidth,
    active.columnCount,
    active.rowUnitPx,
    PANEL_GRID_GAP_PX,
  );

  const totalOffsetX = clientX - active.originStartX;
  const totalOffsetY = clientY - active.originStartY;
  const { deltaCols, deltaRows } = deltaFromPointer(
    active.originStartX,
    active.originStartY,
    clientX,
    clientY,
    columnStep,
    rowStep,
    "round",
  );

  const next = applyElasticResize(
    active.initialPlacements,
    active.itemId,
    active.edge,
    deltaCols,
    deltaRows,
    active.columnCount,
    "packed",
  );

  return {
    next,
    remainderX: totalOffsetX - deltaCols * columnStep,
    remainderY: totalOffsetY - deltaRows * rowStep,
    columnStep,
    rowStep,
  };
}

export function useWorkspaceNotesGridResize({
  onPersist,
}: UseWorkspaceNotesGridResizeOptions) {
  const [draftPlacements, setDraftPlacements] = useState<PanelPlacement[] | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<WorkspaceNotesGridResizePreview | null>(
    null,
  );
  const draftPlacementsRef = useRef<PanelPlacement[] | null>(null);
  const activeResizeRef = useRef<ActiveResize | null>(null);
  const gridWidthRef = useRef(0);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;

  useEffect(() => {
    draftPlacementsRef.current = draftPlacements;
  }, [draftPlacements]);

  const setGridWidth = useCallback((width: number) => {
    gridWidthRef.current = width;
  }, []);

  const finishResize = useCallback(() => {
    const active = activeResizeRef.current;
    if (!active) {
      return;
    }

    const finalPlacements = active.baseline;
    const initialPlacements = active.initialPlacements;

    activeResizeRef.current = null;
    setIsResizing(false);
    setResizePreview(null);
    unlockDocumentPointer();

    try {
      document.body.releasePointerCapture(active.pointerId);
    } catch {
      // Pointer capture may already be released.
    }

    if (placementsEqual(finalPlacements, initialPlacements)) {
      setDraftPlacements(null);
      return;
    }

    onPersistRef.current(finalPlacements);
    setDraftPlacements(null);
  }, []);

  const startResize = useCallback(
    (
      placements: PanelPlacement[],
      itemId: string,
      edge: ResizeEdge,
      clientX: number,
      clientY: number,
      pointerId: number,
      metrics: WorkspaceNotesGridResizeMetrics,
      boundarySegmentId?: string,
    ) => {
      if (metrics.gridWidth <= 0) {
        return;
      }

      activeResizeRef.current = {
        itemId,
        edge,
        boundarySegmentId,
        originStartX: clientX,
        originStartY: clientY,
        baseline: placements.map((item) => ({ ...item })),
        initialPlacements: placements.map((item) => ({ ...item })),
        pointerId,
        columnCount: metrics.columnCount,
        rowUnitPx: metrics.rowUnitPx,
        gridWidth: metrics.gridWidth,
      };
      draftPlacementsRef.current = placements;
      setDraftPlacements(placements);
      setIsResizing(true);
      setResizePreview({
        itemId,
        edge,
        boundarySegmentId,
        offsetX: 0,
        offsetY: 0,
        tileStyles: {},
      });
      lockDocumentPointer();

      try {
        document.body.setPointerCapture(pointerId);
      } catch {
        // Some environments reject capture on body; window listeners still handle the drag.
      }
    },
    [],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }

      event.preventDefault();

      const { next, remainderX, remainderY, columnStep, rowStep } = applyResizeFromOrigin(
        active,
        event.clientX,
        event.clientY,
      );

      const previewBase = next ?? active.baseline;
      const tileStyles = computeElasticResizePixelPreviews(
        previewBase,
        active.itemId,
        active.edge,
        remainderX,
        remainderY,
        columnStep,
        rowStep,
        active.columnCount,
      );
      setResizePreview({
        itemId: active.itemId,
        edge: active.edge,
        boundarySegmentId: active.boundarySegmentId,
        offsetX: remainderX,
        offsetY: remainderY,
        tileStyles,
      });

      if (!next || placementsEqual(next, active.baseline)) {
        return;
      }

      active.baseline = next;
      draftPlacementsRef.current = next;
      setDraftPlacements(next);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }

      event.preventDefault();

      const { next } = applyResizeFromOrigin(active, event.clientX, event.clientY);
      if (next) {
        active.baseline = next;
        draftPlacementsRef.current = next;
        setDraftPlacements(next);
      }

      finishResize();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [finishResize]);

  return {
    draftPlacements,
    isResizing,
    resizePreview,
    startResize,
    setGridWidth,
  };
}
