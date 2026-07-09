// keel_web/src/modules/projects/lib/workspace/note/workspaceNotesGridLayout.ts

// Packed panel-grid placement helpers for the workspace notes grid overlay.

import {
  clonePlacements,
  isPackedLayout,
  rectEndX,
  rectEndY,
  type PanelPlacement,
} from "../../../../media/lib/panelGrid";
import {
  computePanelGridMetrics,
  panelGridBandHeightPx,
  panelGridDisplayRowUnitPx,
  PANEL_GRID_GAP_PX,
} from "../../../../media/lib/panelGridMetrics";

export const WORKSPACE_NOTES_GRID_COLUMN_COUNT = 12;
export const WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN = 4;
export const WORKSPACE_NOTES_GRID_PERSISTED_ROW_UNIT_PX = 48;
export const WORKSPACE_NOTES_GRID_INNER_SHELL_PADDING_PX = 8;
export const WORKSPACE_NOTES_GRID_TILE_HEIGHT_SLACK_PX = 10;

export type WorkspaceNotesGridPlacement = PanelPlacement;

export type WorkspaceNotesGridNoteMeasure = {
  id: string;
  heightByColSpan: Record<number, number>;
  minWidthPx: number;
};

export type BuildFitNotesGridPlacementsOptions = {
  notes: WorkspaceNotesGridNoteMeasure[];
  viewportWidthPx: number;
  viewportHeightPx: number;
  columnCount?: number;
  fixedOverheadPx?: number;
  gapPx?: number;
};



// ----- Parse and validate
export function parseNotesGridLayout(raw: unknown): WorkspaceNotesGridPlacement[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const parsed: WorkspaceNotesGridPlacement[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      !Number.isFinite(record.grid_x) ||
      !Number.isFinite(record.grid_y) ||
      !Number.isFinite(record.col_span) ||
      !Number.isFinite(record.row_span)
    ) {
      continue;
    }
    parsed.push({
      id: record.id,
      grid_x: Number(record.grid_x),
      grid_y: Number(record.grid_y),
      col_span: Math.max(1, Number(record.col_span)),
      row_span: Math.max(1, Number(record.row_span)),
    });
  }

  return parsed.length > 0 ? parsed : null;
}

export function serializeNotesGridLayout(
  placements: WorkspaceNotesGridPlacement[],
): WorkspaceNotesGridPlacement[] {
  return placements.map((item) => ({
    id: item.id,
    grid_x: item.grid_x,
    grid_y: item.grid_y,
    col_span: item.col_span,
    row_span: item.row_span,
  }));
}



// ----- Fit-to-viewport layout
export function notesGridTileWidthPx(
  colSpan: number,
  gridWidth: number,
  columnCount = WORKSPACE_NOTES_GRID_COLUMN_COUNT,
  gapPx = PANEL_GRID_GAP_PX,
): number {
  return tileBandWidthPx(colSpan, gridWidth, columnCount, gapPx);
}

function tileBandWidthPx(
  colSpan: number,
  gridWidth: number,
  columnCount: number,
  gapPx: number,
): number {
  const { columnWidth } = computePanelGridMetrics(gridWidth, columnCount, 1, gapPx);
  return colSpan * columnWidth + Math.max(0, colSpan - 1) * gapPx;
}

function minRowSpanForBandHeight(
  minHeightPx: number,
  rowUnitPx: number,
  gapPx: number,
): number {
  if (minHeightPx <= 0 || rowUnitPx <= 0) {
    return 1;
  }

  const paddedHeight = minHeightPx + WORKSPACE_NOTES_GRID_TILE_HEIGHT_SLACK_PX;
  return Math.max(1, Math.ceil((paddedHeight + gapPx) / (rowUnitPx + gapPx)));
}

function columnSlots(
  layoutColumnCount: number,
  columnCount: number,
): { grid_x: number; col_span: number }[] {
  const baseSpan = Math.floor(columnCount / layoutColumnCount);
  const remainder = columnCount % layoutColumnCount;
  const slots: { grid_x: number; col_span: number }[] = [];
  let gridX = 0;

  for (let index = 0; index < layoutColumnCount; index += 1) {
    const colSpan = baseSpan + (index < remainder ? 1 : 0);
    slots.push({ grid_x: gridX, col_span: colSpan });
    gridX += colSpan;
  }

  return slots;
}

function hasPlacementOverlaps(items: PanelPlacement[]): boolean {
  const occupied = new Set<string>();

  for (const item of items) {
    for (let row = item.grid_y; row < rectEndY(item); row += 1) {
      for (let col = item.grid_x; col < item.grid_x + item.col_span; col += 1) {
        const key = `${col},${row}`;
        if (occupied.has(key)) {
          return true;
        }
        occupied.add(key);
      }
    }
  }

  return false;
}

export function notesGridMeasuredHeightForColSpan(
  measure: WorkspaceNotesGridNoteMeasure,
  colSpan: number,
): number {
  const spans = Object.keys(measure.heightByColSpan)
    .map(Number)
    .sort((left, right) => right - left);

  if (spans.length === 0) {
    return WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN * 48;
  }

  const exact = measure.heightByColSpan[colSpan];
  if (exact !== undefined) {
    return exact;
  }

  const fittingSpan = spans.find((span) => span <= colSpan);
  if (fittingSpan !== undefined) {
    return measure.heightByColSpan[fittingSpan]!;
  }

  return measure.heightByColSpan[spans[spans.length - 1]!]!;
}

function fitNotesGridColumnCount(noteCount: number): number {
  if (noteCount <= 1) {
    return 1;
  }
  if (noteCount === 2) {
    return 2;
  }
  if (noteCount <= 4) {
    return 2;
  }
  return 3;
}

function distributeNotesIntoColumns(
  notes: WorkspaceNotesGridNoteMeasure[],
  columnCount: number,
  slots: { grid_x: number; col_span: number }[],
): WorkspaceNotesGridNoteMeasure[][] {
  const columns = Array.from({ length: slots.length }, () => [] as WorkspaceNotesGridNoteMeasure[]);
  const columnHeights = Array.from({ length: slots.length }, () => 0);

  const ordered = [...notes].sort((left, right) => {
    const leftHeight = notesGridMeasuredHeightForColSpan(left, slots[0]?.col_span ?? columnCount);
    const rightHeight = notesGridMeasuredHeightForColSpan(right, slots[0]?.col_span ?? columnCount);
    return rightHeight - leftHeight || left.id.localeCompare(right.id);
  });

  for (const note of ordered) {
    let targetColumn = 0;
    for (let index = 1; index < slots.length; index += 1) {
      if (columnHeights[index]! < columnHeights[targetColumn]!) {
        targetColumn = index;
      }
    }

    const slot = slots[targetColumn]!;
    columns[targetColumn]!.push(note);
      columnHeights[targetColumn] =
      columnHeights[targetColumn]! + notesGridMeasuredHeightForColSpan(note, slot.col_span);
  }

  return columns;
}

function buildFitNotesGridPlacementsForColumns(
  notes: WorkspaceNotesGridNoteMeasure[],
  _viewportWidthPx: number,
  viewportHeightPx: number,
  columnCount: number,
  layoutColumnCount: number,
  gapPx: number,
): WorkspaceNotesGridPlacement[] {
  if (notes.length === 0) {
    return [];
  }

  const slots = columnSlots(layoutColumnCount, columnCount);
  const columns = distributeNotesIntoColumns(notes, columnCount, slots);
  const rowSpanById = new Map<string, number>(
    notes.map((note) => [note.id, WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN]),
  );

  const buildPlacements = (): WorkspaceNotesGridPlacement[] => {
    const placements: WorkspaceNotesGridPlacement[] = [];

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const columnNotes = columns[columnIndex]!;
      const slot = slots[columnIndex]!;
      let gridY = 0;

      for (const note of columnNotes) {
        const rowSpan = rowSpanById.get(note.id) ?? WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN;

        placements.push({
          id: note.id,
          grid_x: slot.grid_x,
          grid_y: gridY,
          col_span: slot.col_span,
          row_span: rowSpan,
        });
        gridY += rowSpan;
      }
    }

    return placements;
  };

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const placements = buildPlacements();
    const totalRows = Math.max(1, ...placements.map((item) => rectEndY(item)));
    const rowUnitPx = panelGridDisplayRowUnitPx(viewportHeightPx, totalRows, 0, gapPx);

    let changed = false;
    for (const placement of placements) {
      const note = notes.find((item) => item.id === placement.id);
      if (!note) {
        continue;
      }

      const minHeightPx = notesGridMeasuredHeightForColSpan(note, placement.col_span);
      const neededRowSpan = minRowSpanForBandHeight(minHeightPx, rowUnitPx, gapPx);
      if (rowSpanById.get(note.id) !== neededRowSpan) {
        rowSpanById.set(note.id, neededRowSpan);
        changed = true;
      }
    }

    if (!changed) {
      return placements;
    }
  }

  return buildPlacements();
}

function buildSingleColumnFitNotesGridPlacements(
  notes: WorkspaceNotesGridNoteMeasure[],
  viewportHeightPx: number,
  columnCount: number,
  gapPx: number,
): WorkspaceNotesGridPlacement[] {
  const rowSpanById = new Map<string, number>(
    notes.map((note) => [note.id, WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN]),
  );

  const buildPlacements = (): WorkspaceNotesGridPlacement[] => {
    const placements: WorkspaceNotesGridPlacement[] = [];
    let gridY = 0;

    for (const note of notes) {
      const rowSpan = rowSpanById.get(note.id) ?? WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN;
      placements.push({
        id: note.id,
        grid_x: 0,
        grid_y: gridY,
        col_span: columnCount,
        row_span: rowSpan,
      });
      gridY += rowSpan;
    }

    return placements;
  };

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const placements = buildPlacements();
    const totalRows = Math.max(1, ...placements.map((item) => rectEndY(item)));
    const rowUnitPx = panelGridDisplayRowUnitPx(viewportHeightPx, totalRows, 0, gapPx);

    let changed = false;
    for (const note of notes) {
      const minHeightPx = notesGridMeasuredHeightForColSpan(note, columnCount);
      const neededRowSpan = minRowSpanForBandHeight(minHeightPx, rowUnitPx, gapPx);
      if (rowSpanById.get(note.id) !== neededRowSpan) {
        rowSpanById.set(note.id, neededRowSpan);
        changed = true;
      }
    }

    if (!changed) {
      return placements;
    }
  }

  return buildPlacements();
}

export function convertNotesGridPlacementsToPersistedRowUnit(
  placements: WorkspaceNotesGridPlacement[],
  viewportHeightPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): WorkspaceNotesGridPlacement[] {
  if (placements.length === 0 || viewportHeightPx <= 0) {
    return placements;
  }

  const totalRows = Math.max(1, ...placements.map((item) => rectEndY(item)));
  const displayRowUnitPx = panelGridDisplayRowUnitPx(viewportHeightPx, totalRows, 0, gapPx);
  const fixedRowUnitPx = WORKSPACE_NOTES_GRID_PERSISTED_ROW_UNIT_PX;

  const withRowSpans = placements.map((placement) => {
    const pixelHeight = panelGridBandHeightPx(placement.row_span, displayRowUnitPx, gapPx);
    const rowSpan = minRowSpanForBandHeight(pixelHeight, fixedRowUnitPx, gapPx);
    return { ...placement, row_span: rowSpan };
  });

  const columnKeys = [...new Set(withRowSpans.map((placement) => placement.grid_x))].sort(
    (left, right) => left - right,
  );
  const result: WorkspaceNotesGridPlacement[] = [];

  for (const gridX of columnKeys) {
    const columnPlacements = withRowSpans
      .filter((placement) => placement.grid_x === gridX)
      .sort((left, right) => left.grid_y - right.grid_y);
    let gridY = 0;

    for (const placement of columnPlacements) {
      result.push({ ...placement, grid_y: gridY });
      gridY += placement.row_span;
    }
  }

  return fillNotesGridPackedGaps(result);
}

export function notesGridLayoutLooksCollapsed(
  placements: WorkspaceNotesGridPlacement[],
  viewportHeightPx: number,
  gapPx = PANEL_GRID_GAP_PX,
): boolean {
  if (placements.length === 0 || viewportHeightPx <= 0) {
    return false;
  }

  const maxRow = Math.max(1, ...placements.map((item) => rectEndY(item)));
  const bandHeightPx = panelGridBandHeightPx(
    maxRow,
    WORKSPACE_NOTES_GRID_PERSISTED_ROW_UNIT_PX,
    gapPx,
  );
  return bandHeightPx < viewportHeightPx * 0.25;
}

export function buildFitNotesGridPlacements({
  notes,
  viewportWidthPx,
  viewportHeightPx,
  columnCount = WORKSPACE_NOTES_GRID_COLUMN_COUNT,
  fixedOverheadPx: _fixedOverheadPx = 0,
  gapPx = PANEL_GRID_GAP_PX,
}: BuildFitNotesGridPlacementsOptions): WorkspaceNotesGridPlacement[] {
  if (notes.length === 0 || viewportWidthPx <= 0 || viewportHeightPx <= 0) {
    return notes.map((note, index) => ({
      id: note.id,
      grid_x: 0,
      grid_y: index * WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN,
      col_span: columnCount,
      row_span: WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN,
    }));
  }

  const layoutColumnCount = fitNotesGridColumnCount(notes.length);
  const candidates: WorkspaceNotesGridPlacement[][] = [];

  for (let columns = layoutColumnCount; columns >= 1; columns -= 1) {
    const candidate = buildFitNotesGridPlacementsForColumns(
      notes,
      viewportWidthPx,
      viewportHeightPx,
      columnCount,
      columns,
      gapPx,
    );
    if (!hasPlacementOverlaps(candidate)) {
      candidates.push(candidate);
    }
  }

  const singleColumn = buildSingleColumnFitNotesGridPlacements(
    notes,
    viewportHeightPx,
    columnCount,
    gapPx,
  );
  candidates.push(singleColumn);

  let best = candidates[0] ?? singleColumn;
  let bestRowCount = Math.max(1, ...best.map((item) => rectEndY(item)));
  let bestBandHeight = panelGridBandHeightPx(
    bestRowCount,
    panelGridDisplayRowUnitPx(viewportHeightPx, bestRowCount, 0, gapPx),
    gapPx,
  );

  for (const candidate of candidates.slice(1)) {
    const candidateRowCount = Math.max(1, ...candidate.map((item) => rectEndY(item)));
    const candidateRowUnitPx = panelGridDisplayRowUnitPx(
      viewportHeightPx,
      candidateRowCount,
      0,
      gapPx,
    );
    const candidateBandHeight = panelGridBandHeightPx(candidateRowCount, candidateRowUnitPx, gapPx);
    const candidateFitsViewport = candidateBandHeight <= viewportHeightPx + 1;
    const bestFitsViewport = bestBandHeight <= viewportHeightPx + 1;

    if (candidateFitsViewport && !bestFitsViewport) {
      best = candidate;
      bestRowCount = candidateRowCount;
      bestBandHeight = candidateBandHeight;
      continue;
    }

    if (candidateFitsViewport === bestFitsViewport && candidateRowCount <= bestRowCount) {
      best = candidate;
      bestRowCount = candidateRowCount;
      bestBandHeight = candidateBandHeight;
    }
  }

  return fillNotesGridPackedGaps(best, columnCount);
}



// ----- Packed gap fill
function findFirstEmptyGridCell(
  items: PanelPlacement[],
  columnCount: number,
): { col: number; row: number } | null {
  if (items.length === 0) {
    return null;
  }

  const maxRow = Math.max(1, ...items.map((item) => rectEndY(item)));
  const occupied = new Set<string>();

  for (const item of items) {
    for (let row = item.grid_y; row < rectEndY(item); row += 1) {
      for (let col = item.grid_x; col < rectEndX(item); col += 1) {
        occupied.add(`${col},${row}`);
      }
    }
  }

  for (let row = 0; row < maxRow; row += 1) {
    for (let col = 0; col < columnCount; col += 1) {
      if (!occupied.has(`${col},${row}`)) {
        return { col, row };
      }
    }
  }

  return null;
}

function tryExpandPlacementIntoEmptyCell(
  items: PanelPlacement[],
  empty: { col: number; row: number },
): PanelPlacement[] | null {
  const updated = clonePlacements(items);

  const north = updated.find(
    (item) =>
      rectEndY(item) === empty.row &&
      item.grid_x <= empty.col &&
      empty.col < rectEndX(item),
  );
  if (north) {
    const index = updated.findIndex((item) => item.id === north.id);
    updated[index] = { ...north, row_span: north.row_span + 1 };
    return updated;
  }

  const south = updated.find(
    (item) =>
      item.grid_y === empty.row + 1 &&
      item.grid_x <= empty.col &&
      empty.col < rectEndX(item),
  );
  if (south) {
    const index = updated.findIndex((item) => item.id === south.id);
    updated[index] = { ...south, grid_y: south.grid_y - 1, row_span: south.row_span + 1 };
    return updated;
  }

  const west = updated.find(
    (item) =>
      rectEndX(item) === empty.col &&
      item.grid_y <= empty.row &&
      empty.row < rectEndY(item),
  );
  if (west) {
    const index = updated.findIndex((item) => item.id === west.id);
    updated[index] = { ...west, col_span: west.col_span + 1 };
    return updated;
  }

  const east = updated.find(
    (item) =>
      item.grid_x === empty.col + 1 &&
      item.grid_y <= empty.row &&
      empty.row < rectEndY(item),
  );
  if (east) {
    const index = updated.findIndex((item) => item.id === east.id);
    updated[index] = { ...east, grid_x: east.grid_x - 1, col_span: east.col_span + 1 };
    return updated;
  }

  return null;
}

export function fillNotesGridPackedGaps(
  items: WorkspaceNotesGridPlacement[],
  columnCount = WORKSPACE_NOTES_GRID_COLUMN_COUNT,
): WorkspaceNotesGridPlacement[] {
  if (items.length === 0 || isPackedLayout(items, columnCount)) {
    return items;
  }

  let result = clonePlacements(items);
  const maxIterations = columnCount * Math.max(1, ...result.map((item) => rectEndY(item))) * 4;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (isPackedLayout(result, columnCount)) {
      return result;
    }

    const empty = findFirstEmptyGridCell(result, columnCount);
    if (!empty) {
      return result;
    }

    const expanded = tryExpandPlacementIntoEmptyCell(result, empty);
    if (!expanded) {
      return result;
    }
    result = expanded;
  }

  return result;
}

export function normalizeNotesGridPlacements(
  items: WorkspaceNotesGridPlacement[],
  columnCount = WORKSPACE_NOTES_GRID_COLUMN_COUNT,
): WorkspaceNotesGridPlacement[] {
  return fillNotesGridPackedGaps(items, columnCount);
}



// ----- Sync with canvas notes
export function syncNotesGridPlacements(
  noteIds: string[],
  stored: WorkspaceNotesGridPlacement[] | null,
  columnCount = WORKSPACE_NOTES_GRID_COLUMN_COUNT,
): WorkspaceNotesGridPlacement[] | null {
  if (noteIds.length === 0) {
    return [];
  }

  if (!stored || stored.length === 0) {
    return null;
  }

  const noteIdSet = new Set(noteIds);
  const merged = stored
    .filter((item) => noteIdSet.has(item.id))
    .map((item) => ({ ...item }));

  for (const noteId of noteIds) {
    if (merged.some((item) => item.id === noteId)) {
      continue;
    }

    const maxRow = merged.reduce((max, item) => Math.max(max, rectEndY(item)), 0);
    merged.push({
      id: noteId,
      grid_x: 0,
      grid_y: maxRow,
      col_span: columnCount,
      row_span: WORKSPACE_NOTES_GRID_DEFAULT_ROW_SPAN,
    });
  }

  return merged;
}

export function swapNotesGridPlacements(
  placements: WorkspaceNotesGridPlacement[],
  sourceId: string,
  targetId: string,
): WorkspaceNotesGridPlacement[] {
  if (sourceId === targetId) {
    return placements;
  }

  const source = placements.find((item) => item.id === sourceId);
  const target = placements.find((item) => item.id === targetId);
  if (!source || !target) {
    return placements;
  }

  return placements.map((item) => {
    if (item.id === sourceId) {
      return {
        ...item,
        grid_x: target.grid_x,
        grid_y: target.grid_y,
        col_span: target.col_span,
        row_span: target.row_span,
      };
    }
    if (item.id === targetId) {
      return {
        ...item,
        grid_x: source.grid_x,
        grid_y: source.grid_y,
        col_span: source.col_span,
        row_span: source.row_span,
      };
    }
    return item;
  });
}

export function placementsEqual(
  left: WorkspaceNotesGridPlacement[],
  right: WorkspaceNotesGridPlacement[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort((a, b) => a.id.localeCompare(b.id));
  const sortedRight = [...right].sort((a, b) => a.id.localeCompare(b.id));

  for (let index = 0; index < sortedLeft.length; index += 1) {
    const a = sortedLeft[index]!;
    const b = sortedRight[index]!;
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
