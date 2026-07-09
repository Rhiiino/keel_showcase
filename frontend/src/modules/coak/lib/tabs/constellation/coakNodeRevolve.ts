// keel_web/src/modules/coak/lib/tabs/constellation/coakNodeRevolve.ts

import { COAK_ORIGIN_NODE_ID, coakItemNodeId, parseCoakItemNodeId, type CoakItem } from "../../../api";
import { COAK_ORIGIN_POSITION } from "../../../context/coakWorkspaceTypes";
import { collectCoakDescendantItemIds } from "../directory/coakTree";

const MIN_OFFSET_LENGTH = 1e-6;



// ----- Connection axis

export function computeCoakNodeRevolveConnectionAxis(
  nodePosition: [number, number, number],
  parentPosition: [number, number, number],
): [number, number, number] | null {
  let dx = nodePosition[0] - parentPosition[0];
  let dy = nodePosition[1] - parentPosition[1];
  let dz = nodePosition[2] - parentPosition[2];
  const length = Math.hypot(dx, dy, dz);
  if (length < MIN_OFFSET_LENGTH) {
    return null;
  }

  return [dx / length, dy / length, dz / length];
}



// ----- Rotation math

export function rotateCoakPositionAroundArbitraryAxis(
  position: [number, number, number],
  pivot: [number, number, number],
  axis: [number, number, number],
  angle: number,
): [number, number, number] {
  let x = position[0] - pivot[0];
  let y = position[1] - pivot[1];
  let z = position[2] - pivot[2];

  const [axisX, axisY, axisZ] = axis;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = axisX * x + axisY * y + axisZ * z;
  const crossX = axisY * z - axisZ * y;
  const crossY = axisZ * x - axisX * z;
  const crossZ = axisX * y - axisY * x;

  const rotatedX = x * cos + crossX * sin + axisX * dot * (1 - cos);
  const rotatedY = y * cos + crossY * sin + axisY * dot * (1 - cos);
  const rotatedZ = z * cos + crossZ * sin + axisZ * dot * (1 - cos);

  return [rotatedX + pivot[0], rotatedY + pivot[1], rotatedZ + pivot[2]];
}



// ----- Session helpers

export function collectCoakNodeRevolveTargetItemIds(
  items: CoakItem[],
  sourceItemId: number,
): number[] {
  return [sourceItemId, ...collectCoakDescendantItemIds(items, sourceItemId)];
}

export function captureCoakNodeRevolveBaselinePositions(
  targetItemIds: number[],
  resolvePosition: (itemId: number) => [number, number, number] | undefined,
): Map<number, [number, number, number]> {
  const baselinePositions = new Map<number, [number, number, number]>();

  for (const itemId of targetItemIds) {
    const position = resolvePosition(itemId);
    if (position) {
      baselinePositions.set(itemId, [...position]);
    }
  }

  return baselinePositions;
}

export function resolveCoakNodeRevolveParentPosition(
  parentNodeId: string,
  resolveNodePosition: (nodeId: string) => [number, number, number],
): [number, number, number] {
  if (parentNodeId === COAK_ORIGIN_NODE_ID) {
    return COAK_ORIGIN_POSITION;
  }

  return resolveNodePosition(parentNodeId);
}

export function resolveCoakNodeRevolveParentNodeId(
  item: CoakItem,
): string {
  return item.parent_id == null ? COAK_ORIGIN_NODE_ID : coakItemNodeId(item.parent_id);
}

export function parseCoakRevolveSourceItemId(nodeId: string): number | null {
  return parseCoakItemNodeId(nodeId);
}
