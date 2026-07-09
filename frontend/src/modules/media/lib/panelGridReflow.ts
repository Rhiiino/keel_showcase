// keel_web/src/modules/media/lib/panelGridReflow.ts

// Elastic resize and compact-on-remove for packed media panel grids.

import {
  clonePlacements,
  isPackedLayout,
  rectEndX,
  rectEndY,
  validatePanelGridLayout,
  type PanelGridLayoutMode,
  type PanelPlacement,
  type ResizeEdge,
} from "./panelGrid";

export function itemsTouchingEast(target: PanelPlacement, items: PanelPlacement[]): PanelPlacement[] {
  const east = rectEndX(target);
  return items.filter(
    (item) =>
      item.id !== target.id &&
      item.grid_x === east &&
      item.grid_y < rectEndY(target) &&
      rectEndY(item) > target.grid_y,
  );
}

export function itemsTouchingWest(target: PanelPlacement, items: PanelPlacement[]): PanelPlacement[] {
  return items.filter(
    (item) =>
      item.id !== target.id &&
      rectEndX(item) === target.grid_x &&
      item.grid_y < rectEndY(target) &&
      rectEndY(item) > target.grid_y,
  );
}

export function itemsTouchingSouth(target: PanelPlacement, items: PanelPlacement[]): PanelPlacement[] {
  const south = rectEndY(target);
  return items.filter(
    (item) =>
      item.id !== target.id &&
      item.grid_y === south &&
      item.grid_x < rectEndX(target) &&
      rectEndX(item) > target.grid_x,
  );
}

export function itemsTouchingNorth(target: PanelPlacement, items: PanelPlacement[]): PanelPlacement[] {
  return items.filter(
    (item) =>
      item.id !== target.id &&
      rectEndY(item) === target.grid_y &&
      item.grid_x < rectEndX(target) &&
      rectEndX(item) > target.grid_x,
  );
}

export function rowBandPeers(target: PanelPlacement, items: PanelPlacement[]): PanelPlacement[] {
  return items.filter(
    (item) => item.grid_y === target.grid_y && item.row_span === target.row_span,
  );
}

function uniquePlacements(items: PanelPlacement[]): PanelPlacement[] {
  const seen = new Set<string>();
  const unique: PanelPlacement[] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

export function itemsTouchingSouthOfBand(
  band: PanelPlacement[],
  items: PanelPlacement[],
): PanelPlacement[] {
  return uniquePlacements(band.flatMap((peer) => itemsTouchingSouth(peer, items)));
}

export function itemsTouchingNorthOfBand(
  band: PanelPlacement[],
  items: PanelPlacement[],
): PanelPlacement[] {
  return uniquePlacements(band.flatMap((peer) => itemsTouchingNorth(peer, items)));
}

function applyHorizontalDelta(
  items: PanelPlacement[],
  targetId: string,
  edge: "e" | "w",
  deltaCols: number,
  columnCount: number,
  layoutMode: PanelGridLayoutMode = "packed",
): PanelPlacement[] | null {
  if (deltaCols === 0) {
    return items;
  }

  const updated = clonePlacements(items);
  let target = updated.find((item) => item.id === targetId);
  if (!target) {
    return null;
  }

  if (edge === "e") {
    if (deltaCols > 0) {
      const neighbors = itemsTouchingEast(target, updated);
      if (neighbors.length === 0) {
        if (rectEndX(target) + deltaCols > columnCount) {
          return null;
        }
        target = { ...target, col_span: target.col_span + deltaCols };
      } else {
        const minCanTake = Math.min(...neighbors.map((neighbor) => neighbor.col_span - 1));
        if (deltaCols > minCanTake) {
          return null;
        }
        for (const neighbor of neighbors) {
          const index = updated.findIndex((item) => item.id === neighbor.id);
          updated[index] = {
            ...neighbor,
            grid_x: neighbor.grid_x + deltaCols,
            col_span: neighbor.col_span - deltaCols,
          };
        }
        target = { ...target, col_span: target.col_span + deltaCols };
      }
    } else {
      const shrink = -deltaCols;
      if (target.col_span - shrink < 1) {
        return null;
      }
      const neighbors = itemsTouchingEast(target, updated);
      target = { ...target, col_span: target.col_span - shrink };
      for (const neighbor of [...neighbors].sort((a, b) => a.grid_y - b.grid_y)) {
        const index = updated.findIndex((item) => item.id === neighbor.id);
        updated[index] = {
          ...neighbor,
          grid_x: neighbor.grid_x - shrink,
          col_span: neighbor.col_span + shrink,
        };
      }
    }
  } else if (deltaCols > 0) {
    const neighbors = itemsTouchingWest(target, updated);
    if (neighbors.length === 0) {
      if (target.grid_x - deltaCols < 0) {
        return null;
      }
      target = {
        ...target,
        grid_x: target.grid_x - deltaCols,
        col_span: target.col_span + deltaCols,
      };
    } else {
      const minCanTake = Math.min(...neighbors.map((neighbor) => neighbor.col_span - 1));
      if (deltaCols > minCanTake) {
        return null;
      }
      for (const neighbor of neighbors) {
        const index = updated.findIndex((item) => item.id === neighbor.id);
        updated[index] = {
          ...neighbor,
          col_span: neighbor.col_span - deltaCols,
        };
      }
      target = {
        ...target,
        grid_x: target.grid_x - deltaCols,
        col_span: target.col_span + deltaCols,
      };
    }
  } else {
    const shrink = -deltaCols;
    if (target.col_span - shrink < 1) {
      return null;
    }
    const neighbors = itemsTouchingWest(target, updated);
    target = {
      ...target,
      grid_x: target.grid_x + shrink,
      col_span: target.col_span - shrink,
    };
    for (const neighbor of [...neighbors].sort((a, b) => a.grid_y - b.grid_y)) {
      const index = updated.findIndex((item) => item.id === neighbor.id);
      updated[index] = {
        ...neighbor,
        col_span: neighbor.col_span + shrink,
      };
    }
  }

  const targetIndex = updated.findIndex((item) => item.id === targetId);
  updated[targetIndex] = target;
  return validatePanelGridLayout(updated, columnCount, layoutMode) ? updated : null;
}

function growRowBandSouth(
  updated: PanelPlacement[],
  band: PanelPlacement[],
  deltaRows: number,
): PanelPlacement[] | null {
  const neighbors = itemsTouchingSouthOfBand(band, updated);
  if (neighbors.length === 0) {
    for (const peer of band) {
      const index = updated.findIndex((item) => item.id === peer.id);
      updated[index] = { ...updated[index], row_span: updated[index].row_span + deltaRows };
    }
    return updated;
  }

  const minCanTake = Math.min(...neighbors.map((neighbor) => neighbor.row_span - 1));
  if (deltaRows > minCanTake) {
    return null;
  }

  for (const neighbor of neighbors) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    updated[index] = {
      ...neighbor,
      grid_y: neighbor.grid_y + deltaRows,
      row_span: neighbor.row_span - deltaRows,
    };
  }

  for (const peer of band) {
    const index = updated.findIndex((item) => item.id === peer.id);
    updated[index] = { ...updated[index], row_span: updated[index].row_span + deltaRows };
  }

  return updated;
}

function shrinkRowBandSouth(
  updated: PanelPlacement[],
  band: PanelPlacement[],
  shrink: number,
): PanelPlacement[] | null {
  const minRowSpan = Math.min(...band.map((peer) => peer.row_span));
  if (minRowSpan - shrink < 1) {
    return null;
  }

  const neighbors = itemsTouchingSouthOfBand(band, updated);
  for (const peer of band) {
    const index = updated.findIndex((item) => item.id === peer.id);
    updated[index] = { ...updated[index], row_span: updated[index].row_span - shrink };
  }

  for (const neighbor of [...neighbors].sort((left, right) => left.grid_x - right.grid_x)) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    updated[index] = {
      ...neighbor,
      grid_y: neighbor.grid_y - shrink,
      row_span: neighbor.row_span + shrink,
    };
  }

  return updated;
}

function growRowBandNorth(
  updated: PanelPlacement[],
  band: PanelPlacement[],
  deltaRows: number,
): PanelPlacement[] | null {
  const minGridY = Math.min(...band.map((peer) => peer.grid_y));
  if (minGridY - deltaRows < 0) {
    return null;
  }

  const neighbors = itemsTouchingNorthOfBand(band, updated);
  if (neighbors.length === 0) {
    for (const peer of band) {
      const index = updated.findIndex((item) => item.id === peer.id);
      updated[index] = {
        ...updated[index],
        grid_y: updated[index].grid_y - deltaRows,
        row_span: updated[index].row_span + deltaRows,
      };
    }
    return updated;
  }

  const minCanTake = Math.min(...neighbors.map((neighbor) => neighbor.row_span - 1));
  if (deltaRows > minCanTake) {
    return null;
  }

  for (const neighbor of neighbors) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    updated[index] = {
      ...neighbor,
      row_span: neighbor.row_span - deltaRows,
    };
  }

  for (const peer of band) {
    const index = updated.findIndex((item) => item.id === peer.id);
    updated[index] = {
      ...updated[index],
      grid_y: updated[index].grid_y - deltaRows,
      row_span: updated[index].row_span + deltaRows,
    };
  }

  return updated;
}

function shrinkRowBandNorth(
  updated: PanelPlacement[],
  band: PanelPlacement[],
  shrink: number,
): PanelPlacement[] | null {
  const minRowSpan = Math.min(...band.map((peer) => peer.row_span));
  if (minRowSpan - shrink < 1) {
    return null;
  }

  const neighbors = itemsTouchingNorthOfBand(band, updated);
  for (const peer of band) {
    const index = updated.findIndex((item) => item.id === peer.id);
    updated[index] = {
      ...updated[index],
      grid_y: updated[index].grid_y + shrink,
      row_span: updated[index].row_span - shrink,
    };
  }

  for (const neighbor of [...neighbors].sort((left, right) => left.grid_x - right.grid_x)) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    updated[index] = {
      ...neighbor,
      row_span: neighbor.row_span + shrink,
    };
  }

  return updated;
}

function applyVerticalDelta(
  items: PanelPlacement[],
  targetId: string,
  edge: "n" | "s",
  deltaRows: number,
  columnCount: number,
  layoutMode: PanelGridLayoutMode = "packed",
): PanelPlacement[] | null {
  if (deltaRows === 0) {
    return items;
  }

  const updated = clonePlacements(items);
  const target = updated.find((item) => item.id === targetId);
  if (!target) {
    return null;
  }

  const band = rowBandPeers(target, updated);
  let next: PanelPlacement[] | null = updated;

  if (edge === "s") {
    if (deltaRows > 0) {
      next = growRowBandSouth(updated, band, deltaRows);
    } else {
      next = shrinkRowBandSouth(updated, band, -deltaRows);
    }
  } else if (deltaRows > 0) {
    next = growRowBandNorth(updated, band, deltaRows);
  } else {
    next = shrinkRowBandNorth(updated, band, -deltaRows);
  }

  return next && validatePanelGridLayout(next, columnCount, layoutMode) ? next : null;
}

export function applyElasticResize(
  items: PanelPlacement[],
  targetId: string,
  edge: ResizeEdge,
  deltaCols: number,
  deltaRows: number,
  columnCount: number,
  layoutMode: PanelGridLayoutMode = "packed",
): PanelPlacement[] | null {
  let result = clonePlacements(items);

  if (["e", "w", "ne", "nw", "se", "sw"].includes(edge) && deltaCols !== 0) {
    let horizontalEdge: "e" | "w" = "e";
    if (edge === "w" || edge === "nw" || edge === "sw") {
      horizontalEdge = "w";
    } else if (edge === "ne") {
      horizontalEdge = "w";
    } else if (edge === "se") {
      horizontalEdge = "e";
    }
    const next = applyHorizontalDelta(
      result,
      targetId,
      horizontalEdge,
      deltaCols,
      columnCount,
      layoutMode,
    );
    if (!next) {
      return null;
    }
    result = next;
  }

  if (["n", "s", "ne", "nw", "se", "sw"].includes(edge) && deltaRows !== 0) {
    const verticalEdge: "n" | "s" = edge === "n" || edge === "ne" || edge === "nw" ? "n" : "s";
    const next = applyVerticalDelta(
      result,
      targetId,
      verticalEdge,
      deltaRows,
      columnCount,
      layoutMode,
    );
    if (!next) {
      return null;
    }
    result = next;
  }

  return result;
}

function expandEastNeighborsIntoRemoved(
  items: PanelPlacement[],
  removed: PanelPlacement,
): PanelPlacement[] | null {
  const neighbors = itemsTouchingEast(removed, items);
  if (neighbors.length === 0) {
    return null;
  }

  const updated = clonePlacements(items);
  const delta = removed.col_span;
  for (const neighbor of neighbors) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    const current = updated[index];
    updated[index] = {
      ...current,
      grid_x: current.grid_x - delta,
      col_span: current.col_span + delta,
    };
  }
  return updated;
}

function expandWestNeighborsIntoRemoved(
  items: PanelPlacement[],
  removed: PanelPlacement,
): PanelPlacement[] | null {
  const neighbors = itemsTouchingWest(removed, items);
  if (neighbors.length === 0) {
    return null;
  }

  const updated = clonePlacements(items);
  const delta = removed.col_span;
  for (const neighbor of neighbors) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    const current = updated[index];
    updated[index] = {
      ...current,
      col_span: current.col_span + delta,
    };
  }
  return updated;
}

function expandNorthNeighborsIntoRemoved(
  items: PanelPlacement[],
  removed: PanelPlacement,
): PanelPlacement[] | null {
  const neighbors = itemsTouchingNorth(removed, items);
  if (neighbors.length === 0) {
    return null;
  }

  const updated = clonePlacements(items);
  const delta = removed.row_span;
  for (const neighbor of neighbors) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    const current = updated[index];
    updated[index] = {
      ...current,
      row_span: current.row_span + delta,
    };
  }
  return updated;
}

function expandSouthNeighborsIntoRemoved(
  items: PanelPlacement[],
  removed: PanelPlacement,
): PanelPlacement[] | null {
  const neighbors = itemsTouchingSouth(removed, items);
  if (neighbors.length === 0) {
    return null;
  }

  const updated = clonePlacements(items);
  const delta = removed.row_span;
  for (const neighbor of neighbors) {
    const index = updated.findIndex((item) => item.id === neighbor.id);
    const current = updated[index];
    updated[index] = {
      ...current,
      grid_y: current.grid_y - delta,
      row_span: current.row_span + delta,
    };
  }
  return updated;
}

function expandPrimaryNeighborIntoRemoved(
  items: PanelPlacement[],
  removed: PanelPlacement,
): PanelPlacement[] | null {
  const updated = clonePlacements(items);
  const neighbors = [
    ...itemsTouchingEast(removed, updated),
    ...itemsTouchingWest(removed, updated),
    ...itemsTouchingSouth(removed, updated),
    ...itemsTouchingNorth(removed, updated),
  ];
  if (neighbors.length === 0) {
    return null;
  }

  const primary = neighbors.reduce((largest, item) =>
    item.col_span * item.row_span > largest.col_span * largest.row_span ? item : largest,
  );
  const index = updated.findIndex((item) => item.id === primary.id);

  if (primary.grid_x === removed.grid_x && primary.col_span === removed.col_span) {
    updated[index] =
      primary.grid_y < removed.grid_y
        ? { ...primary, row_span: primary.row_span + removed.row_span }
        : { ...primary, grid_y: removed.grid_y, row_span: primary.row_span + removed.row_span };
  } else if (primary.grid_y === removed.grid_y && primary.row_span === removed.row_span) {
    updated[index] =
      primary.grid_x < removed.grid_x
        ? { ...primary, col_span: primary.col_span + removed.col_span }
        : { ...primary, grid_x: removed.grid_x, col_span: primary.col_span + removed.col_span };
  } else {
    return null;
  }

  return updated;
}

export function repackPanelGrid(
  items: PanelPlacement[],
  columnCount: number,
): PanelPlacement[] {
  if (items.length === 0) {
    return items;
  }

  const ordered = [...items].sort(
    (left, right) =>
      left.grid_y - right.grid_y || left.grid_x - right.grid_x || left.id.localeCompare(right.id),
  );
  const occupied = new Set<string>();
  const repacked: PanelPlacement[] = [];
  const totalArea = ordered.reduce((sum, item) => sum + item.col_span * item.row_span, 0);
  const maxScanY =
    Math.max(...ordered.map((item) => item.row_span)) +
    Math.ceil(totalArea / columnCount) +
    Math.max(...ordered.map((item) => item.row_span));

  for (const item of ordered) {
    let placed = false;
    for (let y = 0; y <= maxScanY; y += 1) {
      for (let x = 0; x < columnCount; x += 1) {
        if (x + item.col_span > columnCount) {
          continue;
        }

        let fits = true;
        for (let row = y; row < y + item.row_span; row += 1) {
          for (let col = x; col < x + item.col_span; col += 1) {
            if (occupied.has(`${col},${row}`)) {
              fits = false;
              break;
            }
          }
          if (!fits) {
            break;
          }
        }
        if (!fits) {
          continue;
        }

        repacked.push({
          id: item.id,
          grid_x: x,
          grid_y: y,
          col_span: item.col_span,
          row_span: item.row_span,
        });
        for (let row = y; row < y + item.row_span; row += 1) {
          for (let col = x; col < x + item.col_span; col += 1) {
            occupied.add(`${col},${row}`);
          }
        }
        placed = true;
        break;
      }
      if (placed) {
        break;
      }
    }

    if (!placed) {
      return items;
    }
  }

  return isPackedLayout(repacked, columnCount) ? repacked : items;
}

export function compactAfterRemove(
  items: PanelPlacement[],
  removed: PanelPlacement,
  columnCount: number,
): PanelPlacement[] {
  if (items.length === 0) {
    return items;
  }

  const expanders = [
    () => expandEastNeighborsIntoRemoved(items, removed),
    () => expandWestNeighborsIntoRemoved(items, removed),
    () => expandNorthNeighborsIntoRemoved(items, removed),
    () => expandSouthNeighborsIntoRemoved(items, removed),
    () => expandPrimaryNeighborIntoRemoved(items, removed),
  ];

  for (const expand of expanders) {
    const candidate = expand();
    if (!candidate || !isPackedLayout(candidate, columnCount)) {
      continue;
    }
    return candidate;
  }

  return repackPanelGrid(items, columnCount);
}
