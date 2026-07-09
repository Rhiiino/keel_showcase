// keel_web/src/modules/media/lib/panelGridEdgeAppend.ts

// Compress existing tiles along a panel edge to make room for a new tile.

import {
  isPackedLayout,
  rectEndX,
  rectEndY,
  type PanelPlacement,
} from "./panelGrid";
import {
  PANEL_ADD_ZONE_BAND_ROWS,
  panelGridEdgeAppendColSpan,
} from "./panelGridMetrics";

export type PanelAddEdge = "top" | "bottom" | "left" | "right";

export type PanelEdgeAppendSide = "top" | "left" | "right";

export type PanelEdgeAppendPlan = {
  side: PanelEdgeAppendSide;
  newSlot: Omit<PanelPlacement, "id">;
  layoutUpdates: PanelPlacement[];
};

function trialLayoutAfterEdgeAppend(
  items: PanelPlacement[],
  plan: PanelEdgeAppendPlan,
): PanelPlacement[] {
  const updatesById = new Map(plan.layoutUpdates.map((item) => [item.id, item]));

  return [
    ...items.map((item) => updatesById.get(item.id) ?? item),
    { id: "new", ...plan.newSlot },
  ];
}

function finalizeEdgeAppendPlan(
  items: PanelPlacement[],
  columnCount: number,
  side: PanelEdgeAppendSide,
  newSlot: Omit<PanelPlacement, "id">,
  layoutUpdates: PanelPlacement[],
): PanelEdgeAppendPlan | null {
  const plan: PanelEdgeAppendPlan = { side, newSlot, layoutUpdates };
  const trial = trialLayoutAfterEdgeAppend(items, plan);
  if (!isPackedLayout(trial, columnCount)) {
    return null;
  }
  return plan;
}

export function computeTopEdgeAppendPlan(
  items: PanelPlacement[],
  columnCount: number,
  rowSpan = PANEL_ADD_ZONE_BAND_ROWS,
): PanelEdgeAppendPlan | null {
  if (items.length === 0 || rowSpan < 1) {
    return null;
  }

  const layoutUpdates: PanelPlacement[] = [];

  for (const item of items) {
    if (item.grid_y >= rowSpan) {
      continue;
    }

    const consumedRows = Math.min(rowSpan - item.grid_y, item.row_span);
    const remainingSpan = item.row_span - consumedRows;
    if (remainingSpan < 1) {
      return null;
    }

    layoutUpdates.push({
      ...item,
      grid_y: item.grid_y + consumedRows,
      row_span: remainingSpan,
    });
  }

  return finalizeEdgeAppendPlan(
    items,
    columnCount,
    "top",
    {
      grid_x: 0,
      grid_y: 0,
      col_span: columnCount,
      row_span: rowSpan,
    },
    layoutUpdates,
  );
}

export function computeLeftEdgeAppendPlan(
  items: PanelPlacement[],
  columnCount: number,
  colSpan = panelGridEdgeAppendColSpan(columnCount),
): PanelEdgeAppendPlan | null {
  if (items.length === 0 || colSpan < 1 || colSpan >= columnCount) {
    return null;
  }

  const maxRow = Math.max(...items.map((item) => rectEndY(item)));
  const layoutUpdates: PanelPlacement[] = [];

  for (const item of items) {
    if (item.grid_x >= colSpan) {
      continue;
    }

    const consumedCols = Math.min(colSpan - item.grid_x, item.col_span);
    const remainingSpan = item.col_span - consumedCols;
    if (remainingSpan < 1) {
      return null;
    }

    layoutUpdates.push({
      ...item,
      grid_x: item.grid_x + consumedCols,
      col_span: remainingSpan,
    });
  }

  return finalizeEdgeAppendPlan(
    items,
    columnCount,
    "left",
    {
      grid_x: 0,
      grid_y: 0,
      col_span: colSpan,
      row_span: maxRow,
    },
    layoutUpdates,
  );
}

export function computeRightEdgeAppendPlan(
  items: PanelPlacement[],
  columnCount: number,
  colSpan = panelGridEdgeAppendColSpan(columnCount),
): PanelEdgeAppendPlan | null {
  if (items.length === 0 || colSpan < 1 || colSpan >= columnCount) {
    return null;
  }

  const maxRow = Math.max(...items.map((item) => rectEndY(item)));
  const bandStart = columnCount - colSpan;
  const layoutUpdates: PanelPlacement[] = [];

  for (const item of items) {
    const itemEndX = rectEndX(item);
    if (itemEndX <= bandStart) {
      continue;
    }

    const overlapStart = Math.max(item.grid_x, bandStart);
    const consumedCols = itemEndX - overlapStart;
    const remainingSpan = item.col_span - consumedCols;
    if (remainingSpan < 1) {
      return null;
    }

    layoutUpdates.push({
      ...item,
      col_span: remainingSpan,
    });
  }

  return finalizeEdgeAppendPlan(
    items,
    columnCount,
    "right",
    {
      grid_x: bandStart,
      grid_y: 0,
      col_span: colSpan,
      row_span: maxRow,
    },
    layoutUpdates,
  );
}

export function computeEdgeAppendPlans(
  items: PanelPlacement[],
  columnCount: number,
): Partial<Record<PanelEdgeAppendSide, PanelEdgeAppendPlan>> {
  const top = computeTopEdgeAppendPlan(items, columnCount);
  const left = computeLeftEdgeAppendPlan(items, columnCount);
  const right = computeRightEdgeAppendPlan(items, columnCount);

  return {
    ...(top ? { top } : {}),
    ...(left ? { left } : {}),
    ...(right ? { right } : {}),
  };
}
