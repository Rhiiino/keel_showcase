// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/edge/workspaceEdgeCleanup.ts

// Strip legacy label-anchor nodes and edges from workspace canvas state.

import type { Edge, Node } from "@xyflow/react";

const LEGACY_ANCHOR_NODE_TYPE = "edgeLabelAnchor";
const LEGACY_ANCHOR_NODE_ID_PREFIX = "edge-anchor-";

export function isLegacyLabelAnchorNode(node: Pick<Node, "id" | "type">): boolean {
  return (
    node.type === LEGACY_ANCHOR_NODE_TYPE || node.id.startsWith(LEGACY_ANCHOR_NODE_ID_PREFIX)
  );
}

export function isLegacyLabelAnchorEndpoint(nodeId: string): boolean {
  return nodeId.startsWith(LEGACY_ANCHOR_NODE_ID_PREFIX);
}

export function stripLegacyLabelAnchorNodes(nodes: Node[]): Node[] {
  return nodes.filter((node) => !isLegacyLabelAnchorNode(node));
}

export function stripEdgesAttachedToLabelAnchors(edges: Edge[]): Edge[] {
  const filtered = edges.filter(
    (edge) =>
      !isLegacyLabelAnchorEndpoint(edge.source) &&
      !isLegacyLabelAnchorEndpoint(edge.target),
  );
  return filtered.length === edges.length ? edges : filtered;
}
