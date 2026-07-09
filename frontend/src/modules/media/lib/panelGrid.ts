// keel_web/src/modules/media/lib/panelGrid.ts

// Grid layout validation and coordinate helpers for media panels.

export type PanelPlacement = {
  id: string;
  grid_x: number;
  grid_y: number;
  col_span: number;
  row_span: number;
};

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const DEFAULT_FIRST_ITEM_COL_SPAN = 12;
export const DEFAULT_FIRST_ITEM_ROW_SPAN = 4;
export const DEFAULT_APPEND_ROW_SPAN = 3;

export function rectEndX(item: PanelPlacement): number {
  return item.grid_x + item.col_span;
}

export function rectEndY(item: PanelPlacement): number {
  return item.grid_y + item.row_span;
}

export function fitsContainer(item: PanelPlacement, columnCount: number): boolean {
  return (
    item.grid_x >= 0 &&
    item.grid_y >= 0 &&
    item.col_span >= 1 &&
    item.row_span >= 1 &&
    rectEndX(item) <= columnCount
  );
}

export function isPackedLayout(items: PanelPlacement[], columnCount: number): boolean {
  if (items.length === 0) {
    return true;
  }

  for (const item of items) {
    if (!fitsContainer(item, columnCount)) {
      return false;
    }
  }

  const maxRow = Math.max(...items.map((item) => rectEndY(item)));
  const occupied = new Set<string>();

  for (const item of items) {
    for (let row = item.grid_y; row < rectEndY(item); row += 1) {
      for (let col = item.grid_x; col < rectEndX(item); col += 1) {
        const key = `${col},${row}`;
        if (occupied.has(key)) {
          return false;
        }
        occupied.add(key);
      }
    }
  }

  return occupied.size === columnCount * maxRow;
}

export type PanelGridLayoutMode = "packed" | "nonOverlapping";

export function isNonOverlappingLayout(items: PanelPlacement[], columnCount: number): boolean {
  if (items.length === 0) {
    return true;
  }

  for (const item of items) {
    if (!fitsContainer(item, columnCount)) {
      return false;
    }
  }

  const occupied = new Set<string>();

  for (const item of items) {
    for (let row = item.grid_y; row < rectEndY(item); row += 1) {
      for (let col = item.grid_x; col < rectEndX(item); col += 1) {
        const key = `${col},${row}`;
        if (occupied.has(key)) {
          return false;
        }
        occupied.add(key);
      }
    }
  }

  return true;
}

export function validatePanelGridLayout(
  items: PanelPlacement[],
  columnCount: number,
  mode: PanelGridLayoutMode = "packed",
): boolean {
  return mode === "packed"
    ? isPackedLayout(items, columnCount)
    : isNonOverlappingLayout(items, columnCount);
}

export function clonePlacements(items: PanelPlacement[]): PanelPlacement[] {
  return items.map((item) => ({ ...item }));
}

export function placementForNewItem(
  items: PanelPlacement[],
  columnCount: number,
  colSpan = DEFAULT_FIRST_ITEM_COL_SPAN,
  rowSpan = DEFAULT_APPEND_ROW_SPAN,
): Omit<PanelPlacement, "id"> {
  if (items.length === 0) {
    return {
      grid_x: 0,
      grid_y: 0,
      col_span: Math.min(colSpan, columnCount),
      row_span: DEFAULT_FIRST_ITEM_ROW_SPAN,
    };
  }

  const maxRow = Math.max(...items.map((item) => rectEndY(item)));
  return {
    grid_x: 0,
    grid_y: maxRow,
    col_span: columnCount,
    row_span: rowSpan,
  };
}

export function placementsToLayoutPayload(items: PanelPlacement[]) {
  return items.map((item) => ({
    id: item.id,
    grid_x: item.grid_x,
    grid_y: item.grid_y,
    col_span: item.col_span,
    row_span: item.row_span,
  }));
}

export { deltaFromPointer } from "./panelGridMetrics";
