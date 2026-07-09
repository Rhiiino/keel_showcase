// keel_web/src/modules/media/lib/panelGridSplit.ts

// Split one panel tile to make room for a new item in edit mode.

import type { PanelPlacement } from "./panelGrid";

export type SplitZone = "top" | "bottom" | "left" | "right";

export function resolveSplitZone(
  relativeX: number,
  relativeY: number,
  width: number,
  height: number,
): SplitZone | null {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const fromCenterX = relativeX / width - 0.5;
  const fromCenterY = relativeY / height - 0.5;

  if (Math.abs(fromCenterY) >= Math.abs(fromCenterX)) {
    return fromCenterY < 0 ? "top" : "bottom";
  }

  return fromCenterX < 0 ? "left" : "right";
}

export function canSplitTile(item: PanelPlacement, zone: SplitZone): boolean {
  if (zone === "top" || zone === "bottom") {
    return item.row_span >= 2;
  }

  return item.col_span >= 2;
}

export type SplitPlacementResult = {
  existing: PanelPlacement;
  newSlot: Omit<PanelPlacement, "id">;
};

export function computeSplitPlacements(
  item: PanelPlacement,
  zone: SplitZone,
): SplitPlacementResult | null {
  if (!canSplitTile(item, zone)) {
    return null;
  }

  switch (zone) {
    case "top": {
      const newRows = Math.floor(item.row_span / 2);
      const existingRows = item.row_span - newRows;
      return {
        existing: {
          ...item,
          grid_y: item.grid_y + newRows,
          row_span: existingRows,
        },
        newSlot: {
          grid_x: item.grid_x,
          grid_y: item.grid_y,
          col_span: item.col_span,
          row_span: newRows,
        },
      };
    }
    case "bottom": {
      const existingRows = Math.floor(item.row_span / 2);
      const newRows = item.row_span - existingRows;
      return {
        existing: {
          ...item,
          row_span: existingRows,
        },
        newSlot: {
          grid_x: item.grid_x,
          grid_y: item.grid_y + existingRows,
          col_span: item.col_span,
          row_span: newRows,
        },
      };
    }
    case "left": {
      const newCols = Math.floor(item.col_span / 2);
      const existingCols = item.col_span - newCols;
      return {
        existing: {
          ...item,
          grid_x: item.grid_x + newCols,
          col_span: existingCols,
        },
        newSlot: {
          grid_x: item.grid_x,
          grid_y: item.grid_y,
          col_span: newCols,
          row_span: item.row_span,
        },
      };
    }
    case "right": {
      const existingCols = Math.floor(item.col_span / 2);
      const newCols = item.col_span - existingCols;
      return {
        existing: {
          ...item,
          col_span: existingCols,
        },
        newSlot: {
          grid_x: item.grid_x + existingCols,
          grid_y: item.grid_y,
          col_span: newCols,
          row_span: item.row_span,
        },
      };
    }
    default:
      return null;
  }
}
