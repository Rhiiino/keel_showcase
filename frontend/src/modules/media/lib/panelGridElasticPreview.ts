// keel_web/src/modules/media/lib/panelGridElasticPreview.ts

// Pixel-accurate multi-tile preview styles during elastic panel resize drags.

import type { CSSProperties } from "react";

import { rectEndX, type PanelPlacement, type ResizeEdge } from "./panelGrid";
import {
  itemsTouchingEast,
  itemsTouchingNorthOfBand,
  itemsTouchingSouthOfBand,
  itemsTouchingWest,
  rowBandPeers,
} from "./panelGridReflow";

export type ElasticResizeTileStyles = Record<string, CSSProperties>;

type ResizePreviewLayer = "growing" | "shrinking";

const RESIZE_PREVIEW_Z_GROWING = 30;
const RESIZE_PREVIEW_Z_SHRINKING = 50;

function mergeTileStyle(
  styles: ElasticResizeTileStyles,
  itemId: string,
  patch: CSSProperties,
  layer: ResizePreviewLayer,
): void {
  const nextZ = layer === "shrinking" ? RESIZE_PREVIEW_Z_SHRINKING : RESIZE_PREVIEW_Z_GROWING;
  const previousZ =
    typeof styles[itemId]?.zIndex === "number" ? Number(styles[itemId]?.zIndex) : 0;

  styles[itemId] = {
    ...(styles[itemId] ?? {}),
    ...patch,
    zIndex: Math.max(previousZ, nextZ),
    transition: "none",
  };
}

function resolveHorizontalEdge(edge: ResizeEdge): "e" | "w" | null {
  if (edge === "e" || edge === "se") {
    return "e";
  }
  if (edge === "w" || edge === "sw") {
    return "w";
  }
  if (edge === "ne" || edge === "nw") {
    return "w";
  }
  return null;
}

function resolveVerticalEdge(edge: ResizeEdge): "n" | "s" | null {
  if (edge === "n" || edge === "ne" || edge === "nw") {
    return "n";
  }
  if (edge === "s" || edge === "se" || edge === "sw") {
    return "s";
  }
  return null;
}

function applyEastGrowPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  growPx: number,
  columnStep: number,
  columnCount: number,
): void {
  if (growPx <= 0) {
    return;
  }

  const neighbors = itemsTouchingEast(target, items);
  let applied = 0;

  if (neighbors.length === 0) {
    applied = Math.min(growPx, Math.max(0, columnCount - rectEndX(target)) * columnStep);
  } else {
    const minCapacity = Math.min(
      ...neighbors.map((neighbor) => Math.max(0, neighbor.col_span - 1) * columnStep),
    );
    applied = Math.min(growPx, minCapacity);
    if (applied > 0) {
      for (const neighbor of neighbors) {
        mergeTileStyle(
          styles,
          neighbor.id,
          {
            width: `calc(100% - ${applied}px)`,
            marginLeft: `${applied}px`,
          },
          "shrinking",
        );
      }
    }
  }

  if (applied > 0) {
    mergeTileStyle(
      styles,
      target.id,
      {
        width: `calc(100% + ${applied}px)`,
      },
      "growing",
    );
  }
}

function applyEastShrinkPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  shrinkPx: number,
  columnStep: number,
): void {
  if (shrinkPx <= 0) {
    return;
  }

  const maxShrink = Math.max(0, target.col_span - 1) * columnStep;
  const applied = Math.min(shrinkPx, maxShrink);
  if (applied <= 0) {
    return;
  }

  mergeTileStyle(
    styles,
    target.id,
    {
      width: `calc(100% - ${applied}px)`,
    },
    "shrinking",
  );

  for (const neighbor of itemsTouchingEast(target, items)) {
    mergeTileStyle(
      styles,
      neighbor.id,
      {
        width: `calc(100% + ${applied}px)`,
        marginLeft: `${-applied}px`,
      },
      "growing",
    );
  }
}

function applyWestGrowPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  growPx: number,
  columnStep: number,
): void {
  if (growPx <= 0) {
    return;
  }

  const neighbors = itemsTouchingWest(target, items);
  let applied = 0;

  if (neighbors.length === 0) {
    applied = Math.min(growPx, target.grid_x * columnStep);
  } else {
    const minCapacity = Math.min(
      ...neighbors.map((neighbor) => Math.max(0, neighbor.col_span - 1) * columnStep),
    );
    applied = Math.min(growPx, minCapacity);
    if (applied > 0) {
      for (const neighbor of neighbors) {
        mergeTileStyle(
          styles,
          neighbor.id,
          {
            width: `calc(100% - ${applied}px)`,
          },
          "shrinking",
        );
      }
    }
  }

  if (applied > 0) {
    mergeTileStyle(
      styles,
      target.id,
      {
        width: `calc(100% + ${applied}px)`,
        marginLeft: `${-applied}px`,
      },
      "growing",
    );
  }
}

function applyWestShrinkPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  shrinkPx: number,
  columnStep: number,
): void {
  if (shrinkPx <= 0) {
    return;
  }

  const maxShrink = Math.max(0, target.col_span - 1) * columnStep;
  const applied = Math.min(shrinkPx, maxShrink);
  if (applied <= 0) {
    return;
  }

  mergeTileStyle(
    styles,
    target.id,
    {
      width: `calc(100% - ${applied}px)`,
      marginLeft: `${applied}px`,
    },
    "shrinking",
  );

  for (const neighbor of itemsTouchingWest(target, items)) {
    mergeTileStyle(
      styles,
      neighbor.id,
      {
        width: `calc(100% + ${applied}px)`,
      },
      "growing",
    );
  }
}

function applySouthGrowPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  growPx: number,
  rowStep: number,
): void {
  if (growPx <= 0) {
    return;
  }

  const band = rowBandPeers(target, items);
  const neighbors = itemsTouchingSouthOfBand(band, items);
  let applied = 0;

  if (neighbors.length === 0) {
    applied = growPx;
  } else {
    const minCapacity = Math.min(
      ...neighbors.map((neighbor) => Math.max(0, neighbor.row_span - 1) * rowStep),
    );
    applied = Math.min(growPx, minCapacity);
    if (applied > 0) {
      for (const neighbor of neighbors) {
        mergeTileStyle(
          styles,
          neighbor.id,
          {
            height: `calc(100% - ${applied}px)`,
            marginTop: `${applied}px`,
          },
          "shrinking",
        );
      }
    }
  }

  if (applied > 0) {
    for (const peer of band) {
      mergeTileStyle(
        styles,
        peer.id,
        {
          height: `calc(100% + ${applied}px)`,
        },
        "growing",
      );
    }
  }
}

function applySouthShrinkPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  shrinkPx: number,
  rowStep: number,
): void {
  if (shrinkPx <= 0) {
    return;
  }

  const band = rowBandPeers(target, items);
  const minRowSpan = Math.min(...band.map((peer) => peer.row_span));
  const maxShrink = Math.max(0, minRowSpan - 1) * rowStep;
  const applied = Math.min(shrinkPx, maxShrink);
  if (applied <= 0) {
    return;
  }

  for (const peer of band) {
    mergeTileStyle(
      styles,
      peer.id,
      {
        height: `calc(100% - ${applied}px)`,
      },
      "shrinking",
    );
  }

  for (const neighbor of itemsTouchingSouthOfBand(band, items)) {
    mergeTileStyle(
      styles,
      neighbor.id,
      {
        height: `calc(100% + ${applied}px)`,
        marginTop: `${-applied}px`,
      },
      "growing",
    );
  }
}

function applyNorthGrowPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  growPx: number,
  rowStep: number,
): void {
  if (growPx <= 0) {
    return;
  }

  const band = rowBandPeers(target, items);
  const minGridY = Math.min(...band.map((peer) => peer.grid_y));
  const neighbors = itemsTouchingNorthOfBand(band, items);
  let applied = 0;

  if (neighbors.length === 0) {
    applied = Math.min(growPx, minGridY * rowStep);
  } else {
    const minCapacity = Math.min(
      ...neighbors.map((neighbor) => Math.max(0, neighbor.row_span - 1) * rowStep),
    );
    applied = Math.min(growPx, minCapacity);
    if (applied > 0) {
      for (const neighbor of neighbors) {
        mergeTileStyle(
          styles,
          neighbor.id,
          {
            height: `calc(100% - ${applied}px)`,
          },
          "shrinking",
        );
      }
    }
  }

  if (applied > 0) {
    for (const peer of band) {
      mergeTileStyle(
        styles,
        peer.id,
        {
          height: `calc(100% + ${applied}px)`,
          marginTop: `${-applied}px`,
        },
        "growing",
      );
    }
  }
}

function applyNorthShrinkPreview(
  styles: ElasticResizeTileStyles,
  items: PanelPlacement[],
  target: PanelPlacement,
  shrinkPx: number,
  rowStep: number,
): void {
  if (shrinkPx <= 0) {
    return;
  }

  const band = rowBandPeers(target, items);
  const minRowSpan = Math.min(...band.map((peer) => peer.row_span));
  const maxShrink = Math.max(0, minRowSpan - 1) * rowStep;
  const applied = Math.min(shrinkPx, maxShrink);
  if (applied <= 0) {
    return;
  }

  for (const peer of band) {
    mergeTileStyle(
      styles,
      peer.id,
      {
        height: `calc(100% - ${applied}px)`,
        marginTop: `${applied}px`,
      },
      "shrinking",
    );
  }

  for (const neighbor of itemsTouchingNorthOfBand(band, items)) {
    mergeTileStyle(
      styles,
      neighbor.id,
      {
        height: `calc(100% + ${applied}px)`,
      },
      "growing",
    );
  }
}

export function computeElasticResizePixelPreviews(
  items: PanelPlacement[],
  targetId: string,
  edge: ResizeEdge,
  offsetX: number,
  offsetY: number,
  columnStep: number,
  rowStep: number,
  columnCount: number,
): ElasticResizeTileStyles {
  const target = items.find((item) => item.id === targetId);
  if (!target) {
    return {};
  }

  const styles: ElasticResizeTileStyles = {};
  const horizontalEdge = resolveHorizontalEdge(edge);
  const verticalEdge = resolveVerticalEdge(edge);

  if (horizontalEdge === "e") {
    applyEastGrowPreview(styles, items, target, Math.max(0, offsetX), columnStep, columnCount);
    applyEastShrinkPreview(styles, items, target, Math.max(0, -offsetX), columnStep);
  } else if (horizontalEdge === "w") {
    applyWestGrowPreview(styles, items, target, Math.max(0, -offsetX), columnStep);
    applyWestShrinkPreview(styles, items, target, Math.max(0, offsetX), columnStep);
  }

  if (verticalEdge === "s") {
    applySouthGrowPreview(styles, items, target, Math.max(0, offsetY), rowStep);
    applySouthShrinkPreview(styles, items, target, Math.max(0, -offsetY), rowStep);
  } else if (verticalEdge === "n") {
    applyNorthGrowPreview(styles, items, target, Math.max(0, -offsetY), rowStep);
    applyNorthShrinkPreview(styles, items, target, Math.max(0, offsetY), rowStep);
  }

  return styles;
}
