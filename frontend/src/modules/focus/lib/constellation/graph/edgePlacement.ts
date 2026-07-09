// keel_web/src/modules/focus/lib/constellation/graph/edgePlacement.ts

import {
  FOCUS_CONSTELLATION_NODE_RADIUS,
  angleBetween,
  ringPosition,
  type ConstellationPoint,
} from "../layout";
import { chooseOutwardAngle } from "./outwardPlacement";
import type { ConstellationEdge, ConstellationLayoutNode } from "./types";

const DIRECTION_CANDIDATE_COUNT = 16;
const EDGE_CLEARANCE_MARGIN = 8;

export type EdgeSegment = {
  sourceId: string;
  targetId: string;
  start: ConstellationPoint;
  end: ConstellationPoint;
};

function edgePairKey(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`;
}

export function distancePointToSegment(
  point: ConstellationPoint,
  segmentStart: ConstellationPoint,
  segmentEnd: ConstellationPoint,
): number {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 0.001) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared,
    ),
  );
  const closestX = segmentStart.x + t * dx;
  const closestY = segmentStart.y + t * dy;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function nodeEdgeClearance(
  center: ConstellationPoint,
  nodeRadius: number,
  segment: EdgeSegment,
): number {
  return (
    distancePointToSegment(center, segment.start, segment.end) - nodeRadius - EDGE_CLEARANCE_MARGIN
  );
}

export function collectPlacedEdgeSegments(
  layoutById: Map<string, ConstellationLayoutNode>,
  edges: readonly ConstellationEdge[],
): EdgeSegment[] {
  const segments: EdgeSegment[] = [];
  for (const edge of edges) {
    const source = layoutById.get(edge.source);
    const target = layoutById.get(edge.target);
    if (!source || !target) {
      continue;
    }
    segments.push({
      sourceId: edge.source,
      targetId: edge.target,
      start: source.position,
      end: target.position,
    });
  }
  return segments;
}

function minEdgeClearanceForCandidate(
  candidate: ConstellationPoint,
  segments: readonly EdgeSegment[],
  excludeEdgeKey: string | null,
): number {
  let minClearance = Number.POSITIVE_INFINITY;
  for (const segment of segments) {
    if (excludeEdgeKey === edgePairKey(segment.sourceId, segment.targetId)) {
      continue;
    }
    minClearance = Math.min(minClearance, nodeEdgeClearance(candidate, FOCUS_CONSTELLATION_NODE_RADIUS, segment));
  }
  return minClearance;
}

function chooseEdgeAwareAngle(
  parentLayout: ConstellationLayoutNode,
  grandparent: ConstellationLayoutNode | null,
  placedNodes: Iterable<ConstellationLayoutNode>,
  edgeSegments: readonly EdgeSegment[],
  excludeEdgeKey: string | null,
  radius: number,
): number | null {
  const preferredAngles = [angleBetween({ x: 0, y: 0 }, parentLayout.position)];
  if (grandparent) {
    preferredAngles.push(angleBetween(grandparent.position, parentLayout.position));
  }

  let bestAngle: number | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < DIRECTION_CANDIDATE_COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / DIRECTION_CANDIDATE_COUNT;
    const candidate = {
      x: parentLayout.position.x + Math.cos(angle) * radius,
      y: parentLayout.position.y + Math.sin(angle) * radius,
    };
    const edgeClearance = minEdgeClearanceForCandidate(candidate, edgeSegments, excludeEdgeKey);
    if (edgeClearance < 0) {
      continue;
    }

    const outwardAngle = chooseOutwardAngle(parentLayout, grandparent, placedNodes, radius);
    const outwardBonus = outwardAngle !== null && Math.abs(angle - outwardAngle) < 0.001 ? 500 : 0;
    const preferredBonus = preferredAngles.reduce((score, preferred) => {
      const diff = Math.abs(angle - preferred);
      const wrapped = Math.min(diff, Math.PI * 2 - diff);
      return score + (Math.PI - wrapped) * 40;
    }, 0);

    const score = edgeClearance * 100 + preferredBonus + outwardBonus;
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

export function chooseEdgeAwareChildPosition(params: {
  parentLayout: ConstellationLayoutNode;
  grandparent: ConstellationLayoutNode | null;
  placedNodes: Iterable<ConstellationLayoutNode>;
  edgeSegments: readonly EdgeSegment[];
  childNodeId: string;
  radius: number;
  siblingIndex: number;
  siblingCount: number;
}): ConstellationPoint {
  const {
    parentLayout,
    grandparent,
    placedNodes,
    edgeSegments,
    childNodeId,
    radius,
    siblingIndex,
    siblingCount,
  } = params;
  const excludeEdgeKey = edgePairKey(parentLayout.id, childNodeId);
  const ringFallback = ringPosition(
    parentLayout.position,
    siblingIndex,
    siblingCount,
    radius,
  );

  const edgeAwareAngle = chooseEdgeAwareAngle(
    parentLayout,
    grandparent,
    placedNodes,
    edgeSegments,
    excludeEdgeKey,
    radius,
  );
  if (edgeAwareAngle !== null) {
    return {
      x: parentLayout.position.x + Math.cos(edgeAwareAngle) * radius,
      y: parentLayout.position.y + Math.sin(edgeAwareAngle) * radius,
    };
  }

  const outwardAngle = chooseOutwardAngle(parentLayout, grandparent, placedNodes, radius);
  if (outwardAngle !== null) {
    const outwardCandidate = {
      x: parentLayout.position.x + Math.cos(outwardAngle) * radius,
      y: parentLayout.position.y + Math.sin(outwardAngle) * radius,
    };
    if (minEdgeClearanceForCandidate(outwardCandidate, edgeSegments, excludeEdgeKey) >= 0) {
      return outwardCandidate;
    }
  }

  if (minEdgeClearanceForCandidate(ringFallback, edgeSegments, excludeEdgeKey) >= 0) {
    return ringFallback;
  }

  let bestCandidate = ringFallback;
  let bestClearance = minEdgeClearanceForCandidate(ringFallback, edgeSegments, excludeEdgeKey);
  for (let i = 0; i < DIRECTION_CANDIDATE_COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / DIRECTION_CANDIDATE_COUNT;
    const candidate = {
      x: parentLayout.position.x + Math.cos(angle) * radius,
      y: parentLayout.position.y + Math.sin(angle) * radius,
    };
    const clearance = minEdgeClearanceForCandidate(candidate, edgeSegments, excludeEdgeKey);
    if (clearance > bestClearance) {
      bestClearance = clearance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}
