// keel_web/src/modules/focus/lib/constellation/interaction.ts

// Pure drag-preview helpers for the focus constellation canvas.

import { isFocusContainerKind, type FocusNodeKind } from "../focus";
import type { ConstellationGraphIndexes, ConstellationLayoutNode } from "./graph";
import {
  collectGraphDescendantNodeIds,
  resolveConstellationNodePosition,
  resolveGraphNodeByIndexes,
} from "./graph/visibility";
import type { FocusConstellationFlowNode } from "../../components/constellation/node";

export function constellationFocusNodeKind(
  node: Pick<ConstellationLayoutNode, "kind" | "entryKind">,
): FocusNodeKind {
  if (node.entryKind === "record") {
    return "record";
  }
  if (node.kind === "list" || node.entryKind === "list_link") {
    return "list";
  }
  return "item";
}

/** List and record reference nodes may be unlinked from their parent in constellation. */
export function canConstellationUnlinkNode(
  nodeKind: FocusNodeKind,
  parentId: string | null,
  isOrigin: boolean,
): boolean {
  if (isOrigin || parentId === null) {
    return false;
  }
  return nodeKind === "list" || nodeKind === "record";
}

/** @alias canConstellationUnlinkNode — kind/parent checks are applied separately in drag handlers. */
export function canConstellationDragDetach(nodeKind: FocusNodeKind): boolean {
  return nodeKind === "list" || nodeKind === "record";
}

export function isConstellationSelectionModifier(
  event: Pick<MouseEvent, "shiftKey" | "metaKey" | "ctrlKey">,
): boolean {
  return event.shiftKey || event.metaKey || event.ctrlKey;
}

export function getSelectedConstellationNodeIds(
  nodes: ReadonlyArray<Pick<FocusConstellationFlowNode, "id" | "selected" | "data">>,
): string[] {
  return nodes
    .filter((node) => node.selected && !node.data.isOrigin)
    .map((node) => node.id);
}

export function snapshotConstellationSubtreePositions({
  rootId,
  indexes,
  liveNodes,
  storedPositions,
}: {
  rootId: string;
  indexes: ConstellationGraphIndexes;
  liveNodes: ReadonlyArray<Pick<FocusConstellationFlowNode, "id" | "position">>;
  storedPositions: ReadonlyMap<string, { x: number; y: number }>;
}): Map<string, { x: number; y: number }> {
  const liveById = new Map(
    liveNodes.map((node) => [node.id, node.position] as const),
  );
  const subtreeIds = [rootId, ...collectGraphDescendantNodeIds(rootId, indexes)];
  const positions = new Map<string, { x: number; y: number }>();

  for (const nodeId of subtreeIds) {
    const resolved = resolveConstellationNodePosition(
      nodeId,
      indexes,
      storedPositions,
      liveById,
    );
    if (resolved) {
      positions.set(nodeId, { ...resolved });
    }
  }

  return positions;
}

export function snapshotConstellationNodePositions(
  nodeIds: ReadonlyArray<string>,
  nodes: ReadonlyArray<Pick<FocusConstellationFlowNode, "id" | "position">>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  for (const nodeId of nodeIds) {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (node) {
      positions.set(nodeId, { ...node.position });
    }
  }
  return positions;
}

export function applyConstellationDragDelta<
  T extends { id: string; position: { x: number; y: number } },
>(
  nodes: T[],
  startPositions: ReadonlyMap<string, { x: number; y: number }>,
  delta: { x: number; y: number },
): T[] {
  if (delta.x === 0 && delta.y === 0) {
    return nodes;
  }

  return nodes.map((node) => {
    const startPosition = startPositions.get(node.id);
    if (!startPosition) {
      return node;
    }
    return {
      ...node,
      position: {
        x: startPosition.x + delta.x,
        y: startPosition.y + delta.y,
      },
    };
  });
}

export function applyLivePositionsToLayoutNodes<
  T extends { id: string; position: { x: number; y: number } },
>(
  layoutNodes: T[],
  liveNodes: ReadonlyArray<{ id: string; position: { x: number; y: number } }>,
): T[] {
  const positionsById = new Map(liveNodes.map((node) => [node.id, node.position]));
  return layoutNodes.map((node) => {
    const livePosition = positionsById.get(node.id);
    return livePosition ? { ...node, position: livePosition } : node;
  });
}

export type PendingUnlinkLayoutPromotion = {
  edgeId: string;
  detachedNodeId: string;
  appearingNodeId: string | null;
};

export function promoteUnlinkInLayoutNodes(
  layoutNodes: readonly ConstellationLayoutNode[],
  pending: PendingUnlinkLayoutPromotion,
  indexes: ConstellationGraphIndexes,
  liveNodes: ReadonlyArray<{ id: string; position: { x: number; y: number } }>,
): ConstellationLayoutNode[] {
  const detached = layoutNodes.find((node) => node.id === pending.detachedNodeId);
  if (!detached) {
    return [...layoutNodes];
  }

  const livePosition =
    liveNodes.find((node) => node.id === pending.detachedNodeId)?.position ?? detached.position;

  if (pending.appearingNodeId) {
    const listGraphNode = resolveGraphNodeByIndexes(pending.appearingNodeId, indexes);
    if (!listGraphNode) {
      return layoutNodes.filter((node) => node.id !== pending.detachedNodeId);
    }

    const listLayout: ConstellationLayoutNode = {
      ...listGraphNode,
      position: livePosition,
      collapsedPosition: detached.collapsedPosition,
      parentId: null,
      depth: detached.depth,
    };

    return [
      ...layoutNodes.filter((node) => node.id !== pending.detachedNodeId),
      listLayout,
    ];
  }

  return layoutNodes.map((node) =>
    node.id === pending.detachedNodeId
      ? { ...node, position: livePosition, parentId: null }
      : node,
  );
}

export function synthesizeAppearingUnlinkLayoutNode(
  appearingNodeId: string,
  detachedLayout: ConstellationLayoutNode,
  indexes: ConstellationGraphIndexes,
): ConstellationLayoutNode | null {
  const graphNode = resolveGraphNodeByIndexes(appearingNodeId, indexes);
  if (!graphNode) {
    return null;
  }

  return {
    ...graphNode,
    position: detachedLayout.position,
    collapsedPosition: detachedLayout.collapsedPosition,
    parentId: null,
    depth: detachedLayout.depth,
  };
}

export function nodeCenterDistance(
  a: { position: { x: number; y: number } },
  b: { position: { x: number; y: number } },
): number {
  return Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
}

export function isValidPreviewTarget(
  draggedNode: FocusConstellationFlowNode,
  candidate: FocusConstellationFlowNode,
): boolean {
  const draggedTargetContainerId = draggedNode.data.targetContainerId;
  const targetContainerId = candidate.data.targetContainerId;
  return !(
    candidate.id === draggedNode.id ||
    !isFocusContainerKind(candidate.data.nodeKind) ||
    targetContainerId === null ||
    targetContainerId === draggedTargetContainerId
  );
}

export function resolveStickyPreviewTarget(
  draggedNode: FocusConstellationFlowNode,
  latchedTargetId: string | null,
  nodes: FocusConstellationFlowNode[],
  unlinkDistance: number,
  previewTouchDistance: number,
): { target: FocusConstellationFlowNode | null; latchedTargetId: string | null } {
  let touchedTarget: FocusConstellationFlowNode | null = null;
  let touchedDistance = Number.POSITIVE_INFINITY;

  for (const node of nodes) {
    if (!isValidPreviewTarget(draggedNode, node)) {
      continue;
    }
    const distance = nodeCenterDistance(draggedNode, node);
    if (distance <= previewTouchDistance && distance < touchedDistance) {
      touchedDistance = distance;
      touchedTarget = node;
    }
  }

  if (touchedTarget) {
    return { target: touchedTarget, latchedTargetId: touchedTarget.id };
  }

  if (latchedTargetId) {
    const latched = nodes.find((node) => node.id === latchedTargetId);
    if (latched && isValidPreviewTarget(draggedNode, latched)) {
      const distance = nodeCenterDistance(draggedNode, latched);
      if (distance <= unlinkDistance) {
        return { target: latched, latchedTargetId };
      }
    }
  }

  return { target: null, latchedTargetId: null };
}
