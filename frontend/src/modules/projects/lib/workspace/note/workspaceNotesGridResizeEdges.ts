// keel_web/src/modules/projects/lib/workspace/note/workspaceNotesGridResizeEdges.ts

// Shared grid boundary segments for workspace notes grid edge resize.

import {
  rectEndX,
  rectEndY,
  type PanelPlacement,
  type ResizeEdge,
} from "../../../../media/lib/panelGrid";
import { computePanelGridMetrics } from "../../../../media/lib/panelGridMetrics";
import {
  itemsTouchingEast,
  itemsTouchingNorth,
  itemsTouchingSouth,
  itemsTouchingWest,
} from "../../../../media/lib/panelGridReflow";

export type GridResizeBoundaryOrientation = "vertical" | "horizontal";

export type GridResizeBoundarySegment = {
  id: string;
  orientation: GridResizeBoundaryOrientation;
  /** Vertical boundary column line, or horizontal boundary row line. */
  line: number;
  /** Inclusive grid column/row start on the span axis. */
  spanStart: number;
  /** Exclusive grid column/row end on the span axis. */
  spanEnd: number;
  targetItemId: string;
  edge: "n" | "s" | "e" | "w";
  participantIds: string[];
};

export const WORKSPACE_NOTES_GRID_EDGE_PROXIMITY_PX = 24;
export const WORKSPACE_NOTES_GRID_EDGE_HIT_PX = 14;
export const WORKSPACE_NOTES_GRID_EDGE_BAR_PX = 4;

type RowRange = { start: number; end: number };

function mergeRanges(ranges: RowRange[]): RowRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: RowRange[] = [{ ...sorted[0]! }];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    const last = merged[merged.length - 1]!;
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }
    merged.push({ ...current });
  }

  return merged;
}

function uncoveredRanges(totalStart: number, totalEnd: number, covered: RowRange[]): RowRange[] {
  const gaps: RowRange[] = [];
  let cursor = totalStart;

  for (const range of covered) {
    if (range.start > cursor) {
      gaps.push({ start: cursor, end: range.start });
    }
    cursor = Math.max(cursor, range.end);
  }

  if (cursor < totalEnd) {
    gaps.push({ start: cursor, end: totalEnd });
  }

  return gaps;
}

function addVerticalSegment(
  segments: Map<string, GridResizeBoundarySegment>,
  col: number,
  rowStart: number,
  rowEnd: number,
  targetItemId: string,
  edge: "e" | "w",
  participantIds: string[],
): void {
  if (rowEnd <= rowStart) {
    return;
  }

  const id = `v:${col}:${rowStart}:${rowEnd}`;
  if (segments.has(id)) {
    return;
  }

  segments.set(id, {
    id,
    orientation: "vertical",
    line: col,
    spanStart: rowStart,
    spanEnd: rowEnd,
    targetItemId,
    edge,
    participantIds,
  });
}

function addHorizontalSegment(
  segments: Map<string, GridResizeBoundarySegment>,
  row: number,
  colStart: number,
  colEnd: number,
  targetItemId: string,
  edge: "n" | "s",
  participantIds: string[],
): void {
  if (colEnd <= colStart) {
    return;
  }

  const id = `h:${row}:${colStart}:${colEnd}`;
  if (segments.has(id)) {
    return;
  }

  segments.set(id, {
    id,
    orientation: "horizontal",
    line: row,
    spanStart: colStart,
    spanEnd: colEnd,
    targetItemId,
    edge,
    participantIds,
  });
}

export function collectWorkspaceNotesGridResizeBoundaries(
  placements: PanelPlacement[],
): GridResizeBoundarySegment[] {
  const segments = new Map<string, GridResizeBoundarySegment>();

  for (const item of placements) {
    for (const neighbor of itemsTouchingEast(item, placements)) {
      const rowStart = Math.max(item.grid_y, neighbor.grid_y);
      const rowEnd = Math.min(rectEndY(item), rectEndY(neighbor));
      addVerticalSegment(segments, rectEndX(item), rowStart, rowEnd, item.id, "e", [
        item.id,
        neighbor.id,
      ]);
    }

    const westNeighbors = itemsTouchingWest(item, placements);
    if (westNeighbors.length === 0) {
      addVerticalSegment(segments, item.grid_x, item.grid_y, rectEndY(item), item.id, "w", [
        item.id,
      ]);
    } else {
      const covered = mergeRanges(
        westNeighbors.map((neighbor) => ({
          start: Math.max(item.grid_y, neighbor.grid_y),
          end: Math.min(rectEndY(item), rectEndY(neighbor)),
        })),
      );
      for (const gap of uncoveredRanges(item.grid_y, rectEndY(item), covered)) {
        addVerticalSegment(segments, item.grid_x, gap.start, gap.end, item.id, "w", [item.id]);
      }
    }

    const eastNeighbors = itemsTouchingEast(item, placements);
    if (eastNeighbors.length === 0) {
      addVerticalSegment(segments, rectEndX(item), item.grid_y, rectEndY(item), item.id, "e", [
        item.id,
      ]);
    } else {
      const covered = mergeRanges(
        eastNeighbors.map((neighbor) => ({
          start: Math.max(item.grid_y, neighbor.grid_y),
          end: Math.min(rectEndY(item), rectEndY(neighbor)),
        })),
      );
      for (const gap of uncoveredRanges(item.grid_y, rectEndY(item), covered)) {
        addVerticalSegment(segments, rectEndX(item), gap.start, gap.end, item.id, "e", [item.id]);
      }
    }

    for (const neighbor of itemsTouchingSouth(item, placements)) {
      const colStart = Math.max(item.grid_x, neighbor.grid_x);
      const colEnd = Math.min(rectEndX(item), rectEndX(neighbor));
      addHorizontalSegment(segments, rectEndY(item), colStart, colEnd, item.id, "s", [
        item.id,
        neighbor.id,
      ]);
    }

    const northNeighbors = itemsTouchingNorth(item, placements);
    if (northNeighbors.length === 0) {
      addHorizontalSegment(segments, item.grid_y, item.grid_x, rectEndX(item), item.id, "n", [
        item.id,
      ]);
    } else {
      const covered = mergeRanges(
        northNeighbors.map((neighbor) => ({
          start: Math.max(item.grid_x, neighbor.grid_x),
          end: Math.min(rectEndX(item), rectEndX(neighbor)),
        })),
      );
      for (const gap of uncoveredRanges(item.grid_x, rectEndX(item), covered)) {
        addHorizontalSegment(segments, item.grid_y, gap.start, gap.end, item.id, "n", [item.id]);
      }
    }

    const southNeighbors = itemsTouchingSouth(item, placements);
    if (southNeighbors.length === 0) {
      addHorizontalSegment(segments, rectEndY(item), item.grid_x, rectEndX(item), item.id, "s", [
        item.id,
      ]);
    } else {
      const covered = mergeRanges(
        southNeighbors.map((neighbor) => ({
          start: Math.max(item.grid_x, neighbor.grid_x),
          end: Math.min(rectEndX(item), rectEndX(neighbor)),
        })),
      );
      for (const gap of uncoveredRanges(item.grid_x, rectEndX(item), covered)) {
        addHorizontalSegment(segments, rectEndY(item), gap.start, gap.end, item.id, "s", [item.id]);
      }
    }
  }

  return [...segments.values()];
}

export function gridColumnLineLeftPx(
  line: number,
  columnCount: number,
  gridWidth: number,
  gapPx: number,
): number {
  if (gridWidth <= 0 || columnCount <= 0) {
    return 0;
  }
  if (line <= 0) {
    return 0;
  }
  if (line >= columnCount) {
    return gridWidth;
  }

  const { columnStep } = computePanelGridMetrics(gridWidth, columnCount, 1, gapPx);
  return line * columnStep - gapPx / 2;
}

export function gridRowLineTopPx(line: number, rowUnitPx: number, gapPx: number): number {
  if (line <= 0) {
    return 0;
  }

  const rowStep = rowUnitPx + gapPx;
  return line * rowStep - gapPx / 2;
}

export type GridResizeBoundaryRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function gridResizeBoundaryRect(
  segment: GridResizeBoundarySegment,
  columnCount: number,
  gridWidth: number,
  rowUnitPx: number,
  gapPx: number,
): GridResizeBoundaryRect {
  if (segment.orientation === "vertical") {
    const left = gridColumnLineLeftPx(segment.line, columnCount, gridWidth, gapPx);
    const top = gridRowLineTopPx(segment.spanStart, rowUnitPx, gapPx);
    const bottom = gridRowLineTopPx(segment.spanEnd, rowUnitPx, gapPx);
    return {
      left,
      top,
      width: WORKSPACE_NOTES_GRID_EDGE_BAR_PX,
      height: Math.max(0, bottom - top),
    };
  }

  const top = gridRowLineTopPx(segment.line, rowUnitPx, gapPx);
  const left = gridColumnLineLeftPx(segment.spanStart, columnCount, gridWidth, gapPx);
  const right = gridColumnLineLeftPx(segment.spanEnd, columnCount, gridWidth, gapPx);
  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: WORKSPACE_NOTES_GRID_EDGE_BAR_PX,
  };
}

export function gridResizeBoundaryHitRect(
  segment: GridResizeBoundarySegment,
  columnCount: number,
  gridWidth: number,
  rowUnitPx: number,
  gapPx: number,
): GridResizeBoundaryRect {
  const bar = gridResizeBoundaryRect(segment, columnCount, gridWidth, rowUnitPx, gapPx);
  const hitPad = WORKSPACE_NOTES_GRID_EDGE_HIT_PX;

  if (segment.orientation === "vertical") {
    return {
      left: bar.left - hitPad,
      top: bar.top,
      width: bar.width + hitPad * 2,
      height: bar.height,
    };
  }

  return {
    left: bar.left,
    top: bar.top - hitPad,
    width: bar.width,
    height: bar.height + hitPad * 2,
  };
}

export function distanceToGridResizeBoundary(
  pointerX: number,
  pointerY: number,
  segment: GridResizeBoundarySegment,
  columnCount: number,
  gridWidth: number,
  rowUnitPx: number,
  gapPx: number,
): number {
  const hit = gridResizeBoundaryHitRect(segment, columnCount, gridWidth, rowUnitPx, gapPx);
  const withinX = pointerX >= hit.left && pointerX <= hit.left + hit.width;
  const withinY = pointerY >= hit.top && pointerY <= hit.top + hit.height;

  if (segment.orientation === "horizontal") {
    if (withinX) {
      if (withinY) {
        return 0;
      }
      if (pointerY < hit.top) {
        return hit.top - pointerY;
      }
      return pointerY - (hit.top + hit.height);
    }
  } else if (withinY) {
    if (withinX) {
      return 0;
    }
    if (pointerX < hit.left) {
      return hit.left - pointerX;
    }
    return pointerX - (hit.left + hit.width);
  }

  const dx =
    pointerX < hit.left
      ? hit.left - pointerX
      : pointerX > hit.left + hit.width
        ? pointerX - (hit.left + hit.width)
        : 0;
  const dy =
    pointerY < hit.top
      ? hit.top - pointerY
      : pointerY > hit.top + hit.height
        ? pointerY - (hit.top + hit.height)
        : 0;
  return Math.hypot(dx, dy);
}

export function resolveCardinalResizeEdge(edge: ResizeEdge): "n" | "s" | "e" | "w" {
  switch (edge) {
    case "n":
    case "ne":
    case "nw":
      return "n";
    case "s":
    case "se":
    case "sw":
      return "s";
    case "w":
      return "w";
    default:
      return "e";
  }
}

export function isActiveGridResizeBoundary(
  segment: GridResizeBoundarySegment,
  activeItemId: string,
  activeEdge: ResizeEdge,
  activeSegmentId?: string,
): boolean {
  if (activeSegmentId) {
    return segment.id === activeSegmentId;
  }

  return (
    segment.targetItemId === activeItemId &&
    segment.edge === resolveCardinalResizeEdge(activeEdge)
  );
}
