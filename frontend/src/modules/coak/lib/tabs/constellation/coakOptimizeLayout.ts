// keel_web/src/modules/coak/lib/tabs/constellation/coakOptimizeLayout.ts

import type { CoakItem, CoakNodePosition } from "../../../api";
import { COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_DEFAULT } from "../settings/coakAutoOptimizeSettings";
import { COAK_CHILD_ORBIT_RADIUS, COAK_NODE_SPHERE_RADIUS } from "./coakGraphConstants";
import { clampCoakNodePosition } from "./coakNodePosition";
import {
  buildChildrenByParent,
  layoutDescendantsFromParent,
  siblingPositionAngledToParentLink,
  siblingPositionAroundParent,
  siblingPositionInlineToParentLink,
  siblingPositionOnParentPlane,
  type CoakInlineOptimizeAngle,
  type CoakOptimizeBranchAngle,
} from "./coakSiblingPositions";
import { distanceBetweenPositions } from "./coakVec3";

const ORIGIN: [number, number, number] = [0, 0, 0];

/** Derive every item position from hierarchy; siblings stay evenly spaced around their parent. */
export function buildAutoNodePositionMap(items: CoakItem[]): Map<number, [number, number, number]> {
  const childrenByParent = buildChildrenByParent(items);
  const positions = new Map<number, [number, number, number]>();
  layoutDescendantsFromParent(childrenByParent, null, ORIGIN, positions, COAK_CHILD_ORBIT_RADIUS, siblingPositionAroundParent);
  return positions;
}

/** Re-layout every descendant of a parent item around the parent's current position. */
export function buildSubtreeAutoPositionMap(
  items: CoakItem[],
  parentItemId: number | null,
  parentPosition: [number, number, number],
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): Map<number, [number, number, number]> {
  const childrenByParent = buildChildrenByParent(items);
  const positions = new Map<number, [number, number, number]>();
  layoutDescendantsFromParent(
    childrenByParent,
    parentItemId,
    parentPosition,
    positions,
    orbitRadius,
    siblingPositionAroundParent,
  );
  return positions;
}

/** Re-layout only a parent's direct children on a horizontal disk. */
export function buildDirectChildrenPlanePositionMap(
  items: CoakItem[],
  parentItemId: number | null,
  parentPosition: [number, number, number],
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): Map<number, [number, number, number]> {
  const childrenByParent = buildChildrenByParent(items);
  const children = childrenByParent.get(parentItemId) ?? [];
  const positions = new Map<number, [number, number, number]>();

  children.forEach((child, index) => {
    positions.set(
      child.id,
      siblingPositionOnParentPlane(parentPosition, index, children.length, orbitRadius),
    );
  });

  return positions;
}

/** Re-layout only a parent's direct children using a branch angle relative to its incoming link. */
export function buildDirectChildrenAngledOptimizePositionMap(
  items: CoakItem[],
  parentItemId: number | null,
  parentPosition: [number, number, number],
  grandparentPosition: [number, number, number],
  branchAngleDegrees: CoakOptimizeBranchAngle,
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): Map<number, [number, number, number]> {
  const childrenByParent = buildChildrenByParent(items);
  const children = childrenByParent.get(parentItemId) ?? [];
  const positions = new Map<number, [number, number, number]>();

  children.forEach((child, index) => {
    positions.set(
      child.id,
      siblingPositionAngledToParentLink(
        parentPosition,
        grandparentPosition,
        branchAngleDegrees,
        index,
        children.length,
        orbitRadius,
      ),
    );
  });

  return positions;
}

/** Re-layout only a parent's direct children in a line at a fixed angle from its incoming link. */
export function buildDirectChildrenInlineOptimizePositionMap(
  items: CoakItem[],
  parentItemId: number | null,
  parentPosition: [number, number, number],
  grandparentPosition: [number, number, number],
  branchAngleDegrees: CoakInlineOptimizeAngle,
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
): Map<number, [number, number, number]> {
  const childrenByParent = buildChildrenByParent(items);
  const children = childrenByParent.get(parentItemId) ?? [];
  const positions = new Map<number, [number, number, number]>();

  children.forEach((child, index) => {
    positions.set(
      child.id,
      siblingPositionInlineToParentLink(
        parentPosition,
        grandparentPosition,
        branchAngleDegrees,
        index,
        orbitRadius,
      ),
    );
  });

  return positions;
}

/** Shortest parent→child center distance among a parent's direct children. */
export function shortestDirectChildConnectionDistance(
  items: CoakItem[],
  parentItemId: number | null,
  parentPosition: [number, number, number],
  resolvedPositions: Map<number, [number, number, number]>,
): number | null {
  const directChildren = items.filter((item) =>
    parentItemId == null ? item.parent_id == null : item.parent_id === parentItemId,
  );

  let shortest: number | null = null;
  for (const child of directChildren) {
    const childPosition = resolvedPositions.get(child.id);
    if (!childPosition) {
      continue;
    }

    const distance = distanceBetweenPositions(parentPosition, childPosition);
    if (shortest == null || distance < shortest) {
      shortest = distance;
    }
  }

  return shortest;
}

/** Stable signature of hierarchy shape for auto-optimize change detection. */
export function buildCoakTreeStructureSignature(items: CoakItem[]): string {
  return [...items]
    .sort((left, right) => left.id - right.id)
    .map((item) => `${item.id}:${item.parent_id ?? "null"}:${item.sort_order}`)
    .join("|");
}

/** Full-tree auto-optimize: sphere shell at origin; inline 180° for only children; configurable branch angle when siblings exist. */
export function buildAutoOptimizeTreePositionMap(
  items: CoakItem[],
  orbitRadius: number = COAK_CHILD_ORBIT_RADIUS,
  siblingBranchAngleDegrees: number = COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_DEFAULT,
  nodeSphereRadius: number = COAK_NODE_SPHERE_RADIUS,
): Map<number, [number, number, number]> {
  const childrenByParent = buildChildrenByParent(items);
  const positions = new Map<number, [number, number, number]>();

  function layoutChildren(
    parentItemId: number | null,
    parentPosition: [number, number, number],
    grandparentPosition: [number, number, number],
  ): void {
    const children = childrenByParent.get(parentItemId) ?? [];
    const childCount = children.length;

    children.forEach((child, index) => {
      let position: [number, number, number];

      if (parentItemId == null) {
        position = siblingPositionAroundParent(
          parentPosition,
          index,
          childCount,
          orbitRadius,
        );
      } else if (childCount <= 1) {
        position = siblingPositionInlineToParentLink(
          parentPosition,
          grandparentPosition,
          180,
          index,
          orbitRadius,
        );
      } else {
        position = siblingPositionAngledToParentLink(
          parentPosition,
          grandparentPosition,
          siblingBranchAngleDegrees,
          index,
          childCount,
          orbitRadius,
        );
      }

      const clamped = clampCoakNodePosition(position, nodeSphereRadius);
      positions.set(child.id, clamped);
      layoutChildren(child.id, clamped, parentPosition);
    });
  }

  layoutChildren(null, ORIGIN, ORIGIN);
  return positions;
}

/** Saved drag positions override auto-layout defaults for each item. */
export function buildResolvedNodePositionMap(
  items: CoakItem[],
  savedPositions: CoakNodePosition[],
): Map<number, [number, number, number]> {
  const autoMap = buildAutoNodePositionMap(items);
  const savedById = new Map<number, [number, number, number]>();

  for (const position of savedPositions) {
    savedById.set(position.item_id, [position.x, position.y, position.z]);
  }

  const resolved = new Map<number, [number, number, number]>();
  for (const item of items) {
    resolved.set(item.id, savedById.get(item.id) ?? autoMap.get(item.id) ?? ORIGIN);
  }

  return resolved;
}
