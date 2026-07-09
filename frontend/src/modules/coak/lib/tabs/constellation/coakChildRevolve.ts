// keel_web/src/modules/coak/lib/graph/coakChildRevolve.ts

import { COAK_ORIGIN_NODE_ID, type CoakItem } from "../../../api";
import { collectCoakDescendantItemIds } from "../directory/coakTree";
import {
  COAK_CHILD_REVOLVE_RAIL_RADIUS_PADDING,
  COAK_NODE_SPHERE_RADIUS,
  COAK_ORIGIN_NODE_RADIUS,
} from "./coakGraphConstants";
import type { CoakWorldAxis } from "./coakNodePosition";

const ORIGIN: [number, number, number] = [0, 0, 0];

/** Matches `CoakOriginNode` visual scale so Revolve rings hug the rendered origin sphere. */
const COAK_ORIGIN_NODE_VISUAL_SCALE = 1.14;



// ----- Target collection

export function collectCoakChildRevolveTargetItemIds(
  items: CoakItem[],
  parentNodeId: string,
): number[] {
  if (parentNodeId === COAK_ORIGIN_NODE_ID) {
    return items.map((item) => item.id);
  }

  const parentItemId = Number.parseInt(parentNodeId.slice(5), 10);
  if (!Number.isFinite(parentItemId)) {
    return [];
  }

  return collectCoakDescendantItemIds(items, parentItemId);
}



// ----- Layout

export function resolveCoakChildRevolvePivot(
  parentNodeId: string,
  resolveNodePosition: (nodeId: string) => [number, number, number],
): [number, number, number] {
  if (parentNodeId === COAK_ORIGIN_NODE_ID) {
    return ORIGIN;
  }

  return resolveNodePosition(parentNodeId);
}

export function resolveCoakChildRevolveParentSphereRadius(
  parentNodeId: string,
  nodeSphereRadius: number = COAK_NODE_SPHERE_RADIUS,
  originNodeRadius: number = COAK_ORIGIN_NODE_RADIUS,
): number {
  if (parentNodeId === COAK_ORIGIN_NODE_ID) {
    return originNodeRadius * COAK_ORIGIN_NODE_VISUAL_SCALE;
  }

  return nodeSphereRadius;
}

export function computeCoakChildRevolveRailRadius(
  parentNodeId: string,
  nodeSphereRadius: number = COAK_NODE_SPHERE_RADIUS,
  originNodeRadius: number = COAK_ORIGIN_NODE_RADIUS,
): number {
  return (
    resolveCoakChildRevolveParentSphereRadius(
      parentNodeId,
      nodeSphereRadius,
      originNodeRadius,
    ) * COAK_CHILD_REVOLVE_RAIL_RADIUS_PADDING
  );
}



// ----- Rotation math

export function normalizeCoakRevolveAngleDelta(delta: number): number {
  let next = delta;

  while (next > Math.PI) {
    next -= Math.PI * 2;
  }

  while (next < -Math.PI) {
    next += Math.PI * 2;
  }

  return next;
}

export function computeCoakRevolveAngleOnPlane(
  pointX: number,
  pointY: number,
  pointZ: number,
  pivot: [number, number, number],
  axis: CoakWorldAxis,
): number {
  const dx = pointX - pivot[0];
  const dy = pointY - pivot[1];
  const dz = pointZ - pivot[2];

  if (axis === "x") {
    return Math.atan2(dy, dz);
  }

  if (axis === "y") {
    return Math.atan2(dz, dx);
  }

  return Math.atan2(dy, dx);
}

export function rotateCoakPositionAroundAxis(
  position: [number, number, number],
  pivot: [number, number, number],
  axis: CoakWorldAxis,
  angle: number,
): [number, number, number] {
  let x = position[0] - pivot[0];
  let y = position[1] - pivot[1];
  let z = position[2] - pivot[2];

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  if (axis === "x") {
    const nextY = y * cos - z * sin;
    const nextZ = y * sin + z * cos;
    return [x + pivot[0], nextY + pivot[1], nextZ + pivot[2]];
  }

  if (axis === "y") {
    const nextX = x * cos + z * sin;
    const nextZ = -x * sin + z * cos;
    return [nextX + pivot[0], y + pivot[1], nextZ + pivot[2]];
  }

  const nextX = x * cos - y * sin;
  const nextY = x * sin + y * cos;
  return [nextX + pivot[0], nextY + pivot[1], z + pivot[2]];
}
