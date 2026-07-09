// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/canvas/workspaceClipboard.ts

// Copy/paste helpers for selected workspace canvas nodes (notes and media cards).

import type { Edge, Node } from "@xyflow/react";

import { isLegacyLabelAnchorNode } from "../edge/workspaceEdgeCleanup";
import { normalizeWorkspaceEdge } from "../edge/workspaceEdgeNormalize";

export type WorkspaceClipboardPayload = {
  nodes: Node[];
  edges: Edge[];
};

export const WORKSPACE_PASTE_OFFSET = { x: 40, y: 40 } as const;

export const WORKSPACE_CLIPBOARD_PREFIX = "keel-workspace-clipboard:";

export function serializeWorkspaceClipboard(
  payload: WorkspaceClipboardPayload,
): string {
  return `${WORKSPACE_CLIPBOARD_PREFIX}${JSON.stringify(payload)}`;
}

export function parseWorkspaceClipboard(raw: string): WorkspaceClipboardPayload | null {
  const json = raw.startsWith(WORKSPACE_CLIPBOARD_PREFIX)
    ? raw.slice(WORKSPACE_CLIPBOARD_PREFIX.length)
    : raw;

  try {
    const parsed = JSON.parse(json) as WorkspaceClipboardPayload;
    if (!Array.isArray(parsed?.nodes)) {
      return null;
    }
    return {
      nodes: parsed.nodes,
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    };
  } catch {
    return null;
  }
}

export function pasteOffsetAnchoredAt(
  payload: WorkspaceClipboardPayload,
  anchor: { x: number; y: number },
  generation: number,
): { x: number; y: number } {
  const minX = Math.min(...payload.nodes.map((node) => node.position.x));
  const minY = Math.min(...payload.nodes.map((node) => node.position.y));
  const generationOffset = Math.max(0, generation - 1);

  return {
    x:
      anchor.x -
      minX +
      WORKSPACE_PASTE_OFFSET.x * generationOffset,
    y:
      anchor.y -
      minY +
      WORKSPACE_PASTE_OFFSET.y * generationOffset,
  };
}

export function copyWorkspaceSelection(
  nodes: Node[],
  edges: Edge[],
): WorkspaceClipboardPayload | null {
  const selectedNodes = nodes.filter(
    (node) => node.selected && !isLegacyLabelAnchorNode(node),
  );
  if (selectedNodes.length === 0) {
    return null;
  }

  const selectedIds = new Set(selectedNodes.map((node) => node.id));
  const selectedEdges = edges.filter(
    (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
  );

  return {
    nodes: structuredClone(
      selectedNodes.map((node) => ({
        ...node,
        selected: false,
      })),
    ),
    edges: structuredClone(selectedEdges),
  };
}

function newNodeId(type: string | undefined): string {
  if (type === "media") {
    return `media-${crypto.randomUUID()}`;
  }
  return `note-${crypto.randomUUID()}`;
}

export function pasteWorkspaceClipboard(
  payload: WorkspaceClipboardPayload,
  offset: { x: number; y: number },
): WorkspaceClipboardPayload {
  const idMap = new Map<string, string>();

  const nodes = payload.nodes.map((node) => {
    const newId = newNodeId(node.type);
    idMap.set(node.id, newId);
    return {
      ...structuredClone(node),
      id: newId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: true,
    };
  });

  const edges = payload.edges.map((edge) => {
    const source = idMap.get(edge.source);
    const target = idMap.get(edge.target);
    if (!source || !target) {
      return null;
    }
    return normalizeWorkspaceEdge({
      ...structuredClone(edge),
      id: `edge-${crypto.randomUUID()}`,
      source,
      target,
      selected: false,
    });
  });

  return {
    nodes,
    edges: edges.filter((edge): edge is Edge => edge !== null),
  };
}

export function mergePastedWorkspace(
  nodes: Node[],
  edges: Edge[],
  pasted: WorkspaceClipboardPayload,
): { nodes: Node[]; edges: Edge[] } {
  const deselectedNodes = nodes.map((node) => ({
    ...node,
    selected: false,
  }));
  const deselectedEdges = edges.map((edge) => ({
    ...edge,
    selected: false,
  }));

  return {
    nodes: [...deselectedNodes, ...pasted.nodes],
    edges: [...deselectedEdges, ...pasted.edges],
  };
}
