// keel_web/src/modules/dev/lib/glassOverlayGeometry.ts

import type { CanvasPoint } from "./canvasPointer";

export const GLASS_OVERLAY_CORNER_HIT_RADIUS = 12;

export function createDefaultPentagon(
  centerX: number,
  centerY: number,
  radius = 80,
): CanvasPoint[] {
  const corners: CanvasPoint[] = [];
  for (let index = 0; index < 5; index += 1) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
    corners.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return corners;
}

export function pentagonCenter(corners: readonly CanvasPoint[]): CanvasPoint {
  return {
    x: corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length,
    y: corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length,
  };
}

export function translateCorners(
  corners: readonly CanvasPoint[],
  deltaX: number,
  deltaY: number,
): CanvasPoint[] {
  return corners.map((corner) => ({
    x: corner.x + deltaX,
    y: corner.y + deltaY,
  }));
}

export function cornersToClipPath(corners: readonly CanvasPoint[]): string {
  return `polygon(${corners.map((corner) => `${corner.x}px ${corner.y}px`).join(", ")})`;
}

export function findCornerIndex(
  corners: readonly CanvasPoint[],
  point: CanvasPoint,
): number | null {
  for (let index = 0; index < corners.length; index += 1) {
    const deltaX = corners[index].x - point.x;
    const deltaY = corners[index].y - point.y;
    if (
      deltaX * deltaX + deltaY * deltaY <=
      GLASS_OVERLAY_CORNER_HIT_RADIUS * GLASS_OVERLAY_CORNER_HIT_RADIUS
    ) {
      return index;
    }
  }
  return null;
}

export function isPointInPolygon(point: CanvasPoint, polygon: readonly CanvasPoint[]): boolean {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const prior = polygon[previous];
    const intersects =
      current.y > point.y !== prior.y > point.y &&
      point.x <
        ((prior.x - current.x) * (point.y - current.y)) / (prior.y - current.y) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function glassColorToRgba(color: string, alpha = 0.32): string {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : hex;
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  if (color.startsWith("hsl")) {
    const inner = color.slice(color.indexOf("(") + 1, color.lastIndexOf(")"));
    return `hsla(${inner}, ${alpha})`;
  }

  return color;
}
