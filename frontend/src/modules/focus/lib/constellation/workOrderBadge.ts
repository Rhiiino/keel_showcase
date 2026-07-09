// keel_web/src/modules/focus/lib/constellation/workOrderBadge.ts

import type { FocusConstellationNodeShape } from "../focus";
import { shapePerimeterPoint } from "./layout";

export const BADGE_DEFAULT_ANGLE_RADIANS = Math.PI / 2;

export function workOrderBadgeOffset(
  angle: number,
  nodeSize: number,
  shape: FocusConstellationNodeShape,
): { x: number; y: number } {
  const radius = nodeSize / 2;
  const toward = {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
  const point = shapePerimeterPoint(shape, { x: 0, y: 0 }, toward, radius);
  return { x: point.x, y: point.y };
}
