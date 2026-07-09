// keel_web/src/modules/coak/lib/tabs/constellation/coakOriginPulse.ts

import { COAK_ORIGIN_NODE_ID } from "../../../api";

export const COAK_ORIGIN_PULSE_CYCLE_SECONDS = 2;
export const COAK_ORIGIN_PULSE_SHELL_COUNT = 4;
export const COAK_ORIGIN_PULSE_EXPAND_FACTOR = 1.55;
export const COAK_ORIGIN_VISUAL_SCALE = 1.42;
export const COAK_ORIGIN_PULSE_CONNECTION_TRAIL_FRACTION = 0.28;

export type CoakOriginPulseDistanceInput = {
  id: string;
  parentNodeId: string;
  position: [number, number, number];
};

export type CoakOriginPulseDistances = {
  nodeDistances: Map<string, number>;
  maxTerminalDistance: number;
};

function edgeLength(
  from: [number, number, number],
  to: [number, number, number],
): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  return Math.hypot(dx, dy, dz);
}

export function computeCoakOriginPulseDistances(
  graphNodes: CoakOriginPulseDistanceInput[],
  originPosition: [number, number, number] = [0, 0, 0],
): CoakOriginPulseDistances {
  const nodeDistances = new Map<string, number>();
  nodeDistances.set(COAK_ORIGIN_NODE_ID, 0);

  if (graphNodes.length === 0) {
    return { nodeDistances, maxTerminalDistance: 0 };
  }

  const nodeById = new Map(graphNodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string, string[]>();

  for (const node of graphNodes) {
    const siblings = childrenByParent.get(node.parentNodeId) ?? [];
    siblings.push(node.id);
    childrenByParent.set(node.parentNodeId, siblings);
  }

  const unresolved = new Set(graphNodes.map((node) => node.id));

  while (unresolved.size > 0) {
    let progressed = false;

    for (const node of graphNodes) {
      if (!unresolved.has(node.id)) {
        continue;
      }

      const parentDistance = nodeDistances.get(node.parentNodeId);
      if (parentDistance === undefined) {
        continue;
      }

      const parentPosition =
        node.parentNodeId === COAK_ORIGIN_NODE_ID
          ? originPosition
          : (nodeById.get(node.parentNodeId)?.position ?? originPosition);

      nodeDistances.set(
        node.id,
        parentDistance + edgeLength(parentPosition, node.position),
      );
      unresolved.delete(node.id);
      progressed = true;
    }

    if (!progressed) {
      break;
    }
  }

  const terminalNodes = graphNodes.filter((node) => !childrenByParent.has(node.id));
  const maxTerminalDistance =
    terminalNodes.length > 0
      ? Math.max(...terminalNodes.map((node) => nodeDistances.get(node.id) ?? 0))
      : 0;

  return { nodeDistances, maxTerminalDistance };
}

export function getCoakOriginPulsePhase(elapsed: number): number {
  return (elapsed / COAK_ORIGIN_PULSE_CYCLE_SECONDS) % 1;
}

export function getCoakOriginShellPulseState(
  elapsed: number,
  index: number,
): { scale: number; opacity: number } {
  const phase =
    ((elapsed / COAK_ORIGIN_PULSE_CYCLE_SECONDS) + index / COAK_ORIGIN_PULSE_SHELL_COUNT) % 1;
  const scale = 1 + phase * COAK_ORIGIN_PULSE_EXPAND_FACTOR;
  const opacity = (1 - phase) ** 1.6 * 0.34;
  return { scale, opacity };
}

export function getCoakConnectionPulseHighlight(
  phase: number,
  pointDistance: number,
  maxDistance: number,
): number {
  if (maxDistance <= 0 || pointDistance > phase * maxDistance) {
    return 0;
  }

  const trailDistance = maxDistance * COAK_ORIGIN_PULSE_CONNECTION_TRAIL_FRACTION;
  const distBehindFront = phase * maxDistance - pointDistance;
  if (trailDistance <= 0 || distBehindFront > trailDistance) {
    return 0;
  }

  return (1 - distBehindFront / trailDistance) ** 0.75;
}

export function getCoakOriginCoreBreathe(elapsed: number): number {
  return 0.5 + 0.5 * Math.sin((elapsed / COAK_ORIGIN_PULSE_CYCLE_SECONDS) * Math.PI * 2);
}
