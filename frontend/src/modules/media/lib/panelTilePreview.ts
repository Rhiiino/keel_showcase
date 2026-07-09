// keel_web/src/modules/media/lib/panelTilePreview.ts

// Zoom and focal-point math for panel tile media previews.

export type PanelTilePreview = {
  scale: number;
  focalX: number;
  focalY: number;
};

export const PANEL_TILE_PREVIEW_MIN_SCALE = 1;
export const PANEL_TILE_PREVIEW_MAX_SCALE = 5;
export const PANEL_TILE_PREVIEW_WHEEL_INTENSITY = 0.0015;

export function panelTilePreviewFromItem(item: {
  preview_scale?: number;
  preview_focal_x?: number;
  preview_focal_y?: number;
}): PanelTilePreview {
  return {
    scale: clampScale(item.preview_scale ?? 1),
    focalX: clampFocal(item.preview_focal_x ?? 0.5),
    focalY: clampFocal(item.preview_focal_y ?? 0.5),
  };
}

export function clampScale(value: number): number {
  return Math.min(PANEL_TILE_PREVIEW_MAX_SCALE, Math.max(PANEL_TILE_PREVIEW_MIN_SCALE, value));
}

export function clampFocal(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function zoomPanelTilePreviewTowardCursor(
  current: PanelTilePreview,
  deltaY: number,
  cursorX: number,
  cursorY: number,
): PanelTilePreview {
  const factor = Math.exp(-deltaY * PANEL_TILE_PREVIEW_WHEEL_INTENSITY);
  const previousScale = current.scale;
  const nextScale = clampScale(previousScale * factor);
  if (nextScale === previousScale) {
    return current;
  }

  const blend = 1 - previousScale / nextScale;
  return {
    scale: nextScale,
    focalX: clampFocal(current.focalX + (cursorX - current.focalX) * blend),
    focalY: clampFocal(current.focalY + (cursorY - current.focalY) * blend),
  };
}

export function panelTilePreviewStyle(preview: PanelTilePreview): {
  transform: string;
  transformOrigin: string;
} {
  return {
    transform: `scale(${preview.scale})`,
    transformOrigin: `${preview.focalX * 100}% ${preview.focalY * 100}%`,
  };
}

export function panelTilePreviewPayload(preview: PanelTilePreview) {
  return {
    preview_scale: preview.scale,
    preview_focal_x: preview.focalX,
    preview_focal_y: preview.focalY,
  };
}

export function panelTilePreviewEqual(left: PanelTilePreview, right: PanelTilePreview): boolean {
  return (
    Math.abs(left.scale - right.scale) < 0.0001 &&
    Math.abs(left.focalX - right.focalX) < 0.0001 &&
    Math.abs(left.focalY - right.focalY) < 0.0001
  );
}
