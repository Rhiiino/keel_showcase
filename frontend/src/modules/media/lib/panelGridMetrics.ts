// keel_web/src/modules/media/lib/panelGridMetrics.ts

// Pixel metrics for panel CSS grids (column width, row height, pointer deltas).

export const PANEL_GRID_GAP_PX = 6;
export const PANEL_GRID_SHELL_PADDING_PX = 8;
export const PANEL_ADD_ZONE_BAND_ROWS = 2;
export const PANEL_EMPTY_SHELL_BAND_ROWS = 4;
export const PANEL_EDGE_APPEND_MIN_COL_SPAN = 2;

export function panelGridEdgeAppendColSpan(columnCount: number): number {
  if (columnCount <= PANEL_EDGE_APPEND_MIN_COL_SPAN) {
    return PANEL_EDGE_APPEND_MIN_COL_SPAN;
  }
  return Math.max(PANEL_EDGE_APPEND_MIN_COL_SPAN, Math.floor(columnCount / 6));
}

export function panelGridEdgeBandWidthPx(
  gridWidth: number,
  columnCount: number,
  colSpan: number,
  gapPx = PANEL_GRID_GAP_PX,
): number {
  const metrics = computePanelGridMetrics(gridWidth, columnCount, 1, gapPx);
  if (metrics.columnWidth <= 0 || colSpan <= 0) {
    return 0;
  }
  return colSpan * metrics.columnWidth + Math.max(0, colSpan - 1) * gapPx;
}
export const PANEL_GRID_ADD_ZONE_HOVER_PROXIMITY_PX = 56;
export const PANEL_GRID_BOTTOM_SCROLL_EXTRA_PX = 48;

export type PanelGridMetrics = {
  columnWidth: number;
  columnStep: number;
  rowStep: number;
};

export function computePanelGridMetrics(
  gridWidth: number,
  columnCount: number,
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): PanelGridMetrics {
  if (gridWidth <= 0 || columnCount <= 0) {
    return { columnWidth: 0, columnStep: 1, rowStep: rowUnitPx + gapPx };
  }

  const totalGap = gapPx * Math.max(columnCount - 1, 0);
  const columnWidth = (gridWidth - totalGap) / columnCount;
  const safeColumnWidth = Math.max(columnWidth, 1);
  return {
    columnWidth: safeColumnWidth,
    columnStep: safeColumnWidth + (columnCount > 1 ? gapPx : 0),
    rowStep: rowUnitPx + gapPx,
  };
}

export function deltaFromPointer(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  columnStep: number,
  rowStep: number,
  snap: "trunc" | "round" = "trunc",
): { deltaCols: number; deltaRows: number } {
  const snapFn = snap === "round" ? Math.round : Math.trunc;
  const deltaCols = snapFn((currentX - startX) / columnStep);
  const deltaRows = snapFn((currentY - startY) / rowStep);
  return { deltaCols, deltaRows };
}

export function pixelDeltaFromPointer(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
): { offsetX: number; offsetY: number } {
  return {
    offsetX: currentX - startX,
    offsetY: currentY - startY,
  };
}



// ----- Panel shell metrics
export function panelGridBandHeightPx(
  rowCount: number,
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): number {
  if (rowCount <= 0) {
    return 0;
  }
  return rowCount * rowUnitPx + Math.max(0, rowCount - 1) * gapPx;
}

export function panelGridViewportContentHeightPx(
  rowCount: number,
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
  paddingPx = PANEL_GRID_SHELL_PADDING_PX,
): number {
  return paddingPx * 2 + panelGridBandHeightPx(rowCount, rowUnitPx, gapPx);
}

export function panelGridFirstRowBand(items: { grid_y: number; row_span: number }[]): number {
  const topRowItems = items.filter((item) => item.grid_y === 0);
  if (topRowItems.length === 0) {
    return 1;
  }
  return Math.max(1, ...topRowItems.map((item) => item.row_span));
}

export function panelGridViewportMinHeightPx(
  items: { grid_y: number; row_span: number }[],
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
  paddingPx = PANEL_GRID_SHELL_PADDING_PX,
): number {
  const firstRowBand = panelGridFirstRowBand(items);
  return paddingPx * 2 + panelGridBandHeightPx(firstRowBand, rowUnitPx, gapPx);
}

export const PANEL_VIEWPORT_HANDLE_HEIGHT_PX = 12;

export const PANEL_GRID_MIN_ROW_UNIT_PX = 16;

export function panelGridRowUnitPxForBandHeight(
  bandHeightPx: number,
  rowCount: number,
  gapPx = PANEL_GRID_GAP_PX,
  minRowUnitPx = PANEL_GRID_MIN_ROW_UNIT_PX,
): number {
  if (rowCount <= 0 || bandHeightPx <= 0) {
    return minRowUnitPx;
  }
  const gaps = Math.max(0, rowCount - 1) * gapPx;
  const rowUnit = (bandHeightPx - gaps) / rowCount;
  return Math.max(minRowUnitPx, rowUnit);
}

export function panelGridDisplayRowUnitPx(
  viewportInnerHeightPx: number,
  rowCount: number,
  fixedOverheadPx: number,
  gapPx = PANEL_GRID_GAP_PX,
  minRowUnitPx = PANEL_GRID_MIN_ROW_UNIT_PX,
): number {
  const bandHeight = Math.max(0, viewportInnerHeightPx - fixedOverheadPx);
  return panelGridRowUnitPxForBandHeight(bandHeight, rowCount, gapPx, minRowUnitPx);
}

export function panelGridAddZoneHeightPx(
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): number {
  return panelGridBandHeightPx(PANEL_ADD_ZONE_BAND_ROWS, rowUnitPx, gapPx);
}

export function panelGridOuterBottomMarginPx(
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): number {
  return (
    panelGridAddZoneHeightPx(rowUnitPx, gapPx) +
    PANEL_GRID_ADD_ZONE_HOVER_PROXIMITY_PX +
    PANEL_GRID_BOTTOM_SCROLL_EXTRA_PX
  );
}

export function panelGridEmptyShellMinHeightPx(
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
  paddingPx = PANEL_GRID_SHELL_PADDING_PX,
): number {
  return paddingPx * 2 + panelGridBandHeightPx(PANEL_EMPTY_SHELL_BAND_ROWS, rowUnitPx, gapPx);
}

export function panelGridRowsForBandHeightPx(
  bandHeightPx: number,
  rowUnitPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): number {
  if (bandHeightPx <= 0 || rowUnitPx <= 0) {
    return 0;
  }
  const rowStep = rowUnitPx + gapPx;
  return Math.max(1, Math.floor((bandHeightPx + gapPx) / rowStep));
}

export type PanelGapAppendPlacement = {
  grid_x: number;
  grid_y: number;
  col_span: number;
  row_span: number;
};

export function panelGridGapAppendPlacement(
  items: { grid_y: number; row_span: number }[],
  columnCount: number,
  emptyBandHeightPx: number,
  rowUnitPx: number,
): PanelGapAppendPlacement | null {
  const rowSpan = panelGridRowsForBandHeightPx(emptyBandHeightPx, rowUnitPx);
  if (rowSpan <= 0) {
    return null;
  }

  const maxRow =
    items.length === 0
      ? 0
      : Math.max(1, ...items.map((item) => item.grid_y + item.row_span));

  return {
    grid_x: 0,
    grid_y: maxRow,
    col_span: columnCount,
    row_span: rowSpan,
  };
}
