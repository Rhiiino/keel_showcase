// keel_web/src/modules/coak/lib/coakPanelGeometry.ts

export type CoakPanelPosition = {
  x: number;
  y: number;
};

export type CoakPanelSize = {
  width: number;
  height: number;
};

export type CoakPanelRect = CoakPanelPosition & CoakPanelSize;

export type CoakResizeHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export type CoakPanelBounds = {
  width: number;
  height: number;
};

export const COAK_PANEL_MIN_WIDTH = 180;
export const COAK_PANEL_MIN_HEIGHT = 120;

export function clampPanelPosition(
  position: CoakPanelPosition,
  panelWidth: number,
  panelHeight: number,
  boundsWidth: number,
  boundsHeight: number,
): CoakPanelPosition {
  const maxX = Math.max(0, boundsWidth - panelWidth);
  const maxY = Math.max(0, boundsHeight - panelHeight);
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
}

export function clampPanelRect(
  rect: CoakPanelRect,
  minWidth: number,
  minHeight: number,
  bounds: CoakPanelBounds,
): CoakPanelRect {
  const width = Math.min(Math.max(minWidth, rect.width), bounds.width);
  const height = Math.min(Math.max(minHeight, rect.height), bounds.height);
  const position = clampPanelPosition(
    { x: rect.x, y: rect.y },
    width,
    height,
    bounds.width,
    bounds.height,
  );

  return {
    ...position,
    width,
    height,
  };
}

export function applyFreeResize(
  origin: CoakPanelRect,
  handle: CoakResizeHandle,
  deltaX: number,
  deltaY: number,
  minWidth: number,
  minHeight: number,
  bounds: CoakPanelBounds,
): CoakPanelRect {
  let { x, y, width, height } = origin;

  if (handle.includes("e")) {
    width += deltaX;
  }
  if (handle.includes("w")) {
    x += deltaX;
    width -= deltaX;
  }
  if (handle.includes("s")) {
    height += deltaY;
  }
  if (handle.includes("n")) {
    y += deltaY;
    height -= deltaY;
  }

  return clampPanelRect({ x, y, width, height }, minWidth, minHeight, bounds);
}

export function resolveAnchorRect(
  anchor: "top-left" | "top-right",
  size: CoakPanelSize,
  bounds: CoakPanelBounds,
): CoakPanelRect {
  if (anchor === "top-right") {
    return clampPanelRect(
      {
        x: bounds.width - size.width,
        y: 0,
        width: size.width,
        height: size.height,
      },
      COAK_PANEL_MIN_WIDTH,
      COAK_PANEL_MIN_HEIGHT,
      bounds,
    );
  }

  return {
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
  };
}
