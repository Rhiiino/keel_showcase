// keel_web/src/modules/focus/lib/constellation/graph/outwardPlacement.ts

import { angleBetween, type ConstellationPoint } from "../layout";
import type { ConstellationLayoutNode } from "./types";

const OUTWARD_DIRECTION_CANDIDATE_COUNT = 16;

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function angleDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, Math.PI * 2 - diff);
}

function distance(a: ConstellationPoint, b: ConstellationPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function openDirectionScore(
  candidate: ConstellationPoint,
  candidateAngle: number,
  preferredAngles: number[],
  placedNodes: Iterable<ConstellationLayoutNode>,
): number {
  let nearestDistance = Number.POSITIVE_INFINITY;
  let crowdingPenalty = 0;

  for (const node of placedNodes) {
    const nodeDistance = distance(candidate, node.position);
    nearestDistance = Math.min(nearestDistance, nodeDistance);
    crowdingPenalty += 1 / Math.max(nodeDistance, 1);
  }

  const preferredAngleBonus = preferredAngles.reduce((score, angle) => {
    return score + (Math.PI - angleDistance(candidateAngle, angle));
  }, 0);

  return nearestDistance + preferredAngleBonus * 70 - crowdingPenalty * 4800;
}

export function chooseOutwardAngle(
  parentLayout: ConstellationLayoutNode,
  grandparent: ConstellationLayoutNode | null,
  placedNodes: Iterable<ConstellationLayoutNode>,
  radius: number,
): number | null {
  const preferredAngles = [
    angleBetween({ x: 0, y: 0 }, parentLayout.position),
  ];

  if (grandparent) {
    preferredAngles.push(angleBetween(grandparent.position, parentLayout.position));
  }

  let bestAngle: number | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < OUTWARD_DIRECTION_CANDIDATE_COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / OUTWARD_DIRECTION_CANDIDATE_COUNT;
    const candidate = {
      x: parentLayout.position.x + Math.cos(angle) * radius,
      y: parentLayout.position.y + Math.sin(angle) * radius,
    };
    const score = openDirectionScore(candidate, angle, preferredAngles, placedNodes);

    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}
