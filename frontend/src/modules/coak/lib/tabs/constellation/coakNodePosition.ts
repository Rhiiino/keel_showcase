// keel_web/src/modules/coak/lib/coakNodePosition.ts

import { Vector3 } from "three";

import { COAK_NODE_SPHERE_RADIUS } from "./coakGraphConstants";

const origin = new Vector3(0, 0, 0);
const direction = new Vector3();

/** Center-to-center distance when child and origin spheres touch. */
export function coakMinNodeDistanceFromOrigin(
  nodeRadius: number = COAK_NODE_SPHERE_RADIUS,
): number {
  return nodeRadius * 2;
}

export function coakNodeDistanceFromOrigin(
  position: [number, number, number],
): number {
  return new Vector3(...position).distanceTo(origin);
}

export function coakNodeDirectionFromPosition(
  position: [number, number, number],
  target: Vector3 = direction,
): Vector3 {
  target.set(position[0], position[1], position[2]);
  if (target.lengthSq() === 0) {
    target.set(0, 0, 1);
  } else {
    target.normalize();
  }
  return target;
}

export function coakNodePositionAtDistance(
  axis: [number, number, number],
  distance: number,
  nodeRadius: number = COAK_NODE_SPHERE_RADIUS,
): [number, number, number] {
  coakNodeDirectionFromPosition(axis, direction);
  const clampedDistance = Math.max(coakMinNodeDistanceFromOrigin(nodeRadius), distance);
  direction.multiplyScalar(clampedDistance);
  return [direction.x, direction.y, direction.z];
}

export function clampCoakNodePosition(
  position: [number, number, number],
  nodeRadius: number = COAK_NODE_SPHERE_RADIUS,
): [number, number, number] {
  const distance = coakNodeDistanceFromOrigin(position);
  const minDistance = coakMinNodeDistanceFromOrigin(nodeRadius);

  if (distance >= minDistance || distance === 0) {
    return position;
  }

  return coakNodePositionAtDistance(position, minDistance, nodeRadius);
}

/** Normalize wheel delta to pixel units across mouse wheel, trackpad, and page modes. */
export function normalizeCoakWheelDelta(event: WheelEvent): number {
  let delta = event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 16;
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= 800;
  }
  return delta;
}

/**
 * Move a node along its connection axis (line from origin through the node).
 * Positive delta extends; negative delta reels in, clamped at parent contact.
 */
export function adjustCoakNodeDistanceFromOrigin(
  position: [number, number, number],
  deltaDistance: number,
  nodeRadius: number = COAK_NODE_SPHERE_RADIUS,
): [number, number, number] {
  const currentDistance = coakNodeDistanceFromOrigin(position);
  const nextDistance = Math.max(
    coakMinNodeDistanceFromOrigin(nodeRadius),
    currentDistance + deltaDistance,
  );
  return coakNodePositionAtDistance(position, nextDistance, nodeRadius);
}



// ----- World-axis drag constraints

export type CoakWorldAxis = "x" | "y" | "z";

const worldAxisUnit = new Vector3();

export function coakWorldAxisUnitVector(axis: CoakWorldAxis, target: Vector3 = worldAxisUnit): Vector3 {
  target.set(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0);
  return target;
}

/** Project a point onto the world axis line through `axisOrigin`. */
export function projectCoakPositionOntoWorldAxis(
  position: [number, number, number] | Vector3,
  axisOrigin: Vector3,
  axis: CoakWorldAxis,
  target: Vector3 = direction,
): [number, number, number] {
  const point = position instanceof Vector3 ? position : new Vector3(...position);
  coakWorldAxisUnitVector(axis, worldAxisUnit);
  const scalar = point.clone().sub(axisOrigin).dot(worldAxisUnit);
  target.copy(axisOrigin).addScaledVector(worldAxisUnit, scalar);
  return [target.x, target.y, target.z];
}
