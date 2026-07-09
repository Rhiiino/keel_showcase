// keel_web/src/modules/focus/lib/constellation/childAlignment.ts

import {
  FOCUS_CONSTELLATION_NESTED_COLLAPSED_RADIUS,
  ringPosition,
  type ConstellationPoint,
} from "./layout";



// ----- Even child placement
export type AlignChildInput = {
  id: string;
  position: ConstellationPoint;
  workOrder: number | null;
};

export function computeEvenChildTargets(
  parentPosition: ConstellationPoint,
  children: readonly AlignChildInput[],
): Map<string, ConstellationPoint> {
  const targets = new Map<string, ConstellationPoint>();
  if (children.length === 0) {
    return targets;
  }

  const sorted = [...children].sort(
    (left, right) => (left.workOrder ?? 0) - (right.workOrder ?? 0),
  );

  const maxRadius = sorted.reduce((longest, child) => {
    const distance = Math.hypot(child.position.x - parentPosition.x, child.position.y - parentPosition.y);
    return Math.max(longest, distance);
  }, 0);
  const radius = Math.max(maxRadius, FOCUS_CONSTELLATION_NESTED_COLLAPSED_RADIUS);

  sorted.forEach((child, index) => {
    targets.set(child.id, ringPosition(parentPosition, index, sorted.length, radius));
  });

  return targets;
}
