// keel_web/src/modules/media/hooks/useMediaPanelGridResize.ts

// Pointer-driven elastic resize with batch layout save on pointer-up.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { replaceMediaPanelLayout, type MediaPanelDetail, type MediaPanelItem } from "../api";
import {
  placementsToLayoutPayload,
  type PanelPlacement,
  type ResizeEdge,
} from "../lib/panelGrid";
import {
  computePanelGridMetrics,
  deltaFromPointer,
  PANEL_GRID_GAP_PX,
} from "../lib/panelGridMetrics";
import { applyElasticResize } from "../lib/panelGridReflow";
import { computeElasticResizePixelPreviews } from "../lib/panelGridElasticPreview";

type UseMediaPanelGridResizeOptions = {
  columnCount: number;
  rowUnitPx: number;
  panelId: string;
  onSaved?: (panel: MediaPanelDetail) => void;
  onError?: (message: string) => void;
};

export type ResizePreview = {
  itemId: string;
  edge: ResizeEdge;
  offsetX: number;
  offsetY: number;
  tileStyles: Record<string, CSSProperties>;
};

type ActiveResize = {
  itemId: string;
  edge: ResizeEdge;
  originStartX: number;
  originStartY: number;
  baseline: PanelPlacement[];
  initialPlacements: PanelPlacement[];
  pointerId: number;
};

function mergePlacementsIntoItems(
  items: MediaPanelItem[],
  placements: PanelPlacement[],
): MediaPanelItem[] {
  const byId = new Map(placements.map((placement) => [placement.id, placement]));
  return items.map((item) => {
    const placement = byId.get(item.id);
    if (!placement) {
      return item;
    }
    return {
      ...item,
      grid_x: placement.grid_x,
      grid_y: placement.grid_y,
      col_span: placement.col_span,
      row_span: placement.row_span,
    };
  });
}

function placementsEqual(left: PanelPlacement[], right: PanelPlacement[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (
      a.id !== b.id ||
      a.grid_x !== b.grid_x ||
      a.grid_y !== b.grid_y ||
      a.col_span !== b.col_span ||
      a.row_span !== b.row_span
    ) {
      return false;
    }
  }

  return true;
}

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
  columnCount: number,
  rowUnitPx: number,
  gridWidth: number,
  snap: "trunc" | "round",
): {
  next: PanelPlacement[] | null;
  remainderX: number;
  remainderY: number;
  columnStep: number;
  rowStep: number;
} {
  const { columnStep, rowStep } = computePanelGridMetrics(
    gridWidth,
    columnCount,
    rowUnitPx,
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
    snap,
  );

  const next =
    deltaCols === 0 && deltaRows === 0
      ? active.baseline
      : applyElasticResize(
          active.initialPlacements,
          active.itemId,
          active.edge,
          deltaCols,
          deltaRows,
          columnCount,
        );

  return {
    next,
    remainderX: totalOffsetX - deltaCols * columnStep,
    remainderY: totalOffsetY - deltaRows * rowStep,
    columnStep,
    rowStep,
  };
}

export function useMediaPanelGridResize({
  columnCount,
  rowUnitPx,
  panelId,
  onSaved,
  onError,
}: UseMediaPanelGridResizeOptions) {
  const [draftItems, setDraftItems] = useState<MediaPanelItem[] | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);
  const draftItemsRef = useRef<MediaPanelItem[] | null>(null);
  const activeResizeRef = useRef<ActiveResize | null>(null);
  const gridWidthRef = useRef<number>(0);

  useEffect(() => {
    draftItemsRef.current = draftItems;
  }, [draftItems]);

  const setGridWidth = useCallback((width: number) => {
    gridWidthRef.current = width;
  }, []);

  const toPlacements = useCallback((items: MediaPanelItem[]): PanelPlacement[] => {
    return items.map((item) => ({
      id: item.id,
      grid_x: item.grid_x,
      grid_y: item.grid_y,
      col_span: item.col_span,
      row_span: item.row_span,
    }));
  }, []);

  const syncDraftFromPlacements = useCallback((placements: PanelPlacement[]) => {
    setDraftItems((current) => {
      if (!current) {
        return current;
      }
      if (placementsEqual(placements, toPlacements(current))) {
        return current;
      }
      const merged = mergePlacementsIntoItems(current, placements);
      draftItemsRef.current = merged;
      return merged;
    });
  }, [toPlacements]);

  const finishResize = useCallback(async () => {
    const active = activeResizeRef.current;
    if (!active) {
      return;
    }

    const finalPlacements = active.baseline;
    const sourceItems = draftItemsRef.current;
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

    if (!sourceItems) {
      return;
    }

    const mergedItems = mergePlacementsIntoItems(sourceItems, finalPlacements);

    if (placementsEqual(finalPlacements, initialPlacements)) {
      setDraftItems(null);
      return;
    }

    const payload = placementsToLayoutPayload(toPlacements(mergedItems));
    try {
      const updatedPanel = await replaceMediaPanelLayout(panelId, payload);
      onSaved?.(updatedPanel);
      setDraftItems(null);
    } catch (error) {
      setDraftItems(mergedItems);
      onError?.(error instanceof Error ? error.message : "Failed to save layout.");
    }
  }, [onError, onSaved, panelId, toPlacements]);

  const startResize = useCallback(
    (
      items: MediaPanelItem[],
      itemId: string,
      edge: ResizeEdge,
      clientX: number,
      clientY: number,
      pointerId: number,
    ) => {
      activeResizeRef.current = {
        itemId,
        edge,
        originStartX: clientX,
        originStartY: clientY,
        baseline: toPlacements(items),
        initialPlacements: toPlacements(items),
        pointerId,
      };
      draftItemsRef.current = items;
      setDraftItems(items);
      setIsResizing(true);
      setResizePreview({ itemId, edge, offsetX: 0, offsetY: 0, tileStyles: {} });
      lockDocumentPointer();

      try {
        document.body.setPointerCapture(pointerId);
      } catch {
        // Some environments reject capture on body; window listeners still handle the drag.
      }
    },
    [toPlacements],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active || event.pointerId !== active.pointerId || gridWidthRef.current <= 0) {
        return;
      }

      event.preventDefault();

      const { next, remainderX, remainderY, columnStep, rowStep } = applyResizeFromOrigin(
        active,
        event.clientX,
        event.clientY,
        columnCount,
        rowUnitPx,
        gridWidthRef.current,
        "trunc",
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
        columnCount,
      );
      setResizePreview({
        itemId: active.itemId,
        edge: active.edge,
        offsetX: remainderX,
        offsetY: remainderY,
        tileStyles,
      });

      if (!next || placementsEqual(next, active.baseline)) {
        return;
      }

      active.baseline = next;
      syncDraftFromPlacements(next);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }

      event.preventDefault();

      if (gridWidthRef.current > 0) {
        const { next } = applyResizeFromOrigin(
          active,
          event.clientX,
          event.clientY,
          columnCount,
          rowUnitPx,
          gridWidthRef.current,
          "round",
        );

        if (next && !placementsEqual(next, active.baseline)) {
          active.baseline = next;
          const currentDraft = draftItemsRef.current;
          if (currentDraft) {
            const merged = mergePlacementsIntoItems(currentDraft, next);
            draftItemsRef.current = merged;
            setDraftItems(merged);
          }
        }
      }

      void finishResize();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [columnCount, finishResize, rowUnitPx, syncDraftFromPlacements]);

  return {
    draftItems,
    isResizing,
    resizePreview,
    startResize,
    setGridWidth,
  };
}
