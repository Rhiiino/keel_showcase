// keel_web/src/modules/coak/lib/tabs/constellation/coakSiblingPositions.ts

import type { CoakItem } from "../../../api";
import {
  COAK_CHILD_ORBIT_RADIUS,
  COAK_NODE_SPHERE_RADIUS,
  COAK_OPTIMIZE_INLINE_GAP,
} from "./coakGraphConstants";
import { coakNodeDirectionFromPosition } from "./coakNodePosition";
import {
  addVec3,
  crossVec3,
  normalizeVec3,
  pickPerpendicularAxis,
  rotateVec3AroundAxis,
  scaleVec3,
  subtractVec3,
} from "./coakVec3";

const ORIGIN: [number, number, number] = [0, 0, 0];

export type CoakOptimizeBranchAngle = 90 | 120;
export type CoakInlineOptimizeAngle = 90 | 120 | 180;
export type CoakOptimizeLayoutMode = CoakOptimizeBranchAngle | { inline: CoakInlineOptimizeAngle };

function sortCoakItems(left: CoakItem, right: CoakItem): number {
  if (left.sort_order !== right.sort_order) {
    return left.sort_order - right.sort_order;
  }
  return left.id - right.id;
}

export function buildChildrenByParent(items: CoakItem[]): Map<number | null, CoakItem[]> {
  const itemIds = new Set(items.map((item) => item.id));
  const childrenByParent = new Map<number | null, CoakItem[]>();

  for (const item of items) {
    const parentId =
      item.parent_id != null && itemIds.has(item.parent_id) ? item.parent_id : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(item);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(sortCoakItems);
  }

  return childrenByParent;
}

function branchAngleDirectionFromIncomingLink(
  towardGrandparent: [number, number, number],
  branchAngleDegrees: number,
): [number, number, number] {
  const radians = (branchAngleDegrees * Math.PI) / 180;
  const tangent = pickPerpendicularAxis(towardGrandparent);
  return normalizeVec3(
    addVec3(
      scaleVec3(towardGrandparent, Math.cos(radians)),
      scaleVec3(tangent, Math.sin(radians)),
    ),
  );
}

/** Parent toward grandparent (incoming link direction at the parent). */
function parentTowardGrandparentDirection(
  parentPosition: [number, number, number],
  grandparentPosition: [number, number, number],
): [number, number, number] {
  return normalizeVec3(subtractVec3(grandparentPosition, parentPosition));
}

/**
 * Place one child so its connection meets the incoming parent link at `branchAngleDegrees`
 * (90° = disk perpendicular to the link; 120° = arc in the link plane).
 */
export function siblingPositionAngledToParentLink(
  parentPosition: [number, number, number],
  grandparentPosition: [number, number, number],
  branchAngleDegrees: number,
  index: number,
  total: number,
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): [number, number, number] {
  const towardGrandparent = parentTowardGrandparentDirection(
    parentPosition,
    grandparentPosition,
  );
  const tangent = pickPerpendicularAxis(towardGrandparent);

  if (branchAngleDegrees === 90) {
    const bitangent = normalizeVec3(crossVec3(towardGrandparent, tangent));

    if (total <= 1) {
      return addVec3(parentPosition, scaleVec3(tangent, orbitRadius));
    }

    const angle = (Math.PI * 2 * index) / total;
    const offset = addVec3(
      scaleVec3(tangent, Math.cos(angle) * orbitRadius),
      scaleVec3(bitangent, Math.sin(angle) * orbitRadius),
    );
    return addVec3(parentPosition, offset);
  }

  const radians = (branchAngleDegrees * Math.PI) / 180;
  const sinBranch = Math.sin(radians);
  const cosBranch = Math.cos(radians);
  const baseDirection = normalizeVec3(
    addVec3(
      scaleVec3(towardGrandparent, cosBranch),
      scaleVec3(tangent, sinBranch),
    ),
  );

  if (total <= 1) {
    return addVec3(parentPosition, scaleVec3(baseDirection, orbitRadius));
  }

  const azimuth = (Math.PI * 2 * index) / total;
  const direction = normalizeVec3(
    rotateVec3AroundAxis(baseDirection, towardGrandparent, azimuth),
  );
  return addVec3(parentPosition, scaleVec3(direction, orbitRadius));
}

function inlineChildStepDistance(orbitRadius: number): number {
  const minimumStep = 2 * COAK_NODE_SPHERE_RADIUS + COAK_OPTIMIZE_INLINE_GAP;
  return Math.max(minimumStep, orbitRadius);
}

/**
 * Place direct children in a line at a fixed angle from the incoming parent link,
 * stacked one after another with slight spacing between nodes.
 */
export function siblingPositionInlineToParentLink(
  parentPosition: [number, number, number],
  grandparentPosition: [number, number, number],
  branchAngleDegrees: CoakInlineOptimizeAngle,
  index: number,
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): [number, number, number] {
  const towardGrandparent = parentTowardGrandparentDirection(
    parentPosition,
    grandparentPosition,
  );
  const outgoingDirection = branchAngleDirectionFromIncomingLink(
    towardGrandparent,
    branchAngleDegrees,
  );
  const distanceFromParent =
    index === 0 ? orbitRadius : orbitRadius + index * inlineChildStepDistance(orbitRadius);

  return addVec3(parentPosition, scaleVec3(outgoingDirection, distanceFromParent));
}

export function layoutDescendantsFromParent(
  childrenByParent: Map<number | null, CoakItem[]>,
  parentId: number | null,
  parentPosition: [number, number, number],
  positions: Map<number, [number, number, number]>,
  orbitRadius: number,
  siblingPosition: (
    parentPosition: [number, number, number],
    index: number,
    total: number,
    orbitRadius: number,
  ) => [number, number, number],
): void {
  const children = childrenByParent.get(parentId) ?? [];
  children.forEach((child, index) => {
    const position = siblingPosition(
      parentPosition,
      index,
      children.length,
      orbitRadius,
    );
    positions.set(child.id, position);
    layoutDescendantsFromParent(
      childrenByParent,
      child.id,
      position,
      positions,
      orbitRadius,
      siblingPosition,
    );
  });
}

/** Evenly space one sibling on a sphere shell around its parent. */
export function siblingPositionAroundParent(
  parentPosition: [number, number, number],
  index: number,
  total: number,
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): [number, number, number] {
  if (total <= 1) {
    if (
      parentPosition[0] === ORIGIN[0] &&
      parentPosition[1] === ORIGIN[1] &&
      parentPosition[2] === ORIGIN[2]
    ) {
      return [orbitRadius, 0, 0];
    }

    const direction = coakNodeDirectionFromPosition(parentPosition);
    return [
      parentPosition[0] + direction.x * orbitRadius,
      parentPosition[1] + direction.y * orbitRadius,
      parentPosition[2] + direction.z * orbitRadius,
    ];
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = goldenAngle * index;
  const y = 1 - (index / (total - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));

  return [
    parentPosition[0] + orbitRadius * Math.cos(theta) * radiusAtY,
    parentPosition[1] + orbitRadius * y,
    parentPosition[2] + orbitRadius * Math.sin(theta) * radiusAtY,
  ];
}

/** Evenly space siblings on a horizontal disk centered on the parent (same Y, circle in XZ). */
export function siblingPositionOnParentPlane(
  parentPosition: [number, number, number],
  index: number,
  total: number,
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): [number, number, number] {
  const [parentX, parentY, parentZ] = parentPosition;

  if (total <= 1) {
    return [parentX + orbitRadius, parentY, parentZ];
  }

  const angle = (Math.PI * 2 * index) / total;

  return [
    parentX + orbitRadius * Math.cos(angle),
    parentY,
    parentZ + orbitRadius * Math.sin(angle),
  ];
}
