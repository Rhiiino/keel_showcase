// Types and helpers for the per-project Obsidian-style workspace canvas.

import type { Edge, Node, Viewport } from "@xyflow/react";

import { DEFAULT_WORKSPACE_NOTE_COLOR } from "./node/workspaceNoteColors";
import { normalizeWorkspaceEdges } from "./edge/workspaceEdgeNormalize";
import type { WorkspaceContainerShape } from "./node/workspaceNodeShape";

export type { WorkspaceContainerShape } from "./node/workspaceNodeShape";

export type WorkspaceViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkspaceEdgeData = {
  label?: string;
  /** True while the label field is open on the canvas. */
  editingLabel?: boolean;
  /** Measured label box (flow px) for on-canvas label chips. */
  labelWidth?: number;
  labelHeight?: number;
  /** `smooth` = curve; `straight` = direct line; `orthogonal` = 90-degree steps. */
  pathStyle?: WorkspaceEdgePathStyle;
  color?: string;
};

export type WorkspaceEdgePathStyle = "smooth" | "straight" | "orthogonal";

export type WorkspaceNoteData = {
  title?: string;
  text: string;
  color?: string;
  transparent?: boolean;
  hideChrome?: boolean;
  /** When true, the note is omitted from the canvas and notes grid (still listed in the side panel). */
  hidden?: boolean;
  containerShape?: WorkspaceContainerShape;
};

export type WorkspaceMediaData = {
  media_id: string;
  original_filename?: string;
  media_kind?: string;
  mime_type?: string;
  /** Border/fill palette color (same presets as workspace notes). */
  color?: string;
  transparent?: boolean;
  hideChrome?: boolean;
  containerShape?: WorkspaceContainerShape;
  /** Intrinsic width/height ratio, set once when media metadata is known. */
  mediaAspectRatio?: number;
};

export type ProjectWorkspaceState = {
  version: 1;
  viewport: WorkspaceViewport;
  nodes: Node[];
  edges: Edge[];
};

export function createEmptyWorkspaceState(): ProjectWorkspaceState {
  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: [],
  };
}

export function parseWorkspaceState(raw: unknown): ProjectWorkspaceState {
  if (!raw || typeof raw !== "object") {
    return createEmptyWorkspaceState();
  }

  const obj = raw as Record<string, unknown>;
  const viewportRaw = obj.viewport;
  const viewport =
    viewportRaw &&
    typeof viewportRaw === "object" &&
    typeof (viewportRaw as WorkspaceViewport).x === "number" &&
    typeof (viewportRaw as WorkspaceViewport).y === "number" &&
    typeof (viewportRaw as WorkspaceViewport).zoom === "number"
      ? (viewportRaw as WorkspaceViewport)
      : { x: 0, y: 0, zoom: 1 };

  const rawNodes = Array.isArray(obj.nodes) ? (obj.nodes as Node[]) : [];
  const nodes = rawNodes.filter((node) => node.type !== "edgeLabelAnchor" && !node.id.startsWith("edge-anchor-"));
  const rawEdges = Array.isArray(obj.edges) ? (obj.edges as Edge[]) : [];
  const edges = normalizeWorkspaceEdges(rawEdges);

  return {
    version: 1,
    viewport,
    nodes,
    edges,
  };
}

export function countWorkspaceNotes(raw: unknown): number {
  return parseWorkspaceState(raw).nodes.filter((node) => node.type === "note").length;
}

export function isWorkspaceNoteHidden(data: Partial<WorkspaceNoteData> | undefined): boolean {
  return Boolean(data?.hidden);
}

export function applyWorkspaceNoteHiddenFlags(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    if (node.type !== "note") {
      return node;
    }

    const hidden = isWorkspaceNoteHidden(node.data as WorkspaceNoteData);
    if (node.hidden === hidden) {
      return node;
    }

    return { ...node, hidden };
  });
}



export function workspaceStateToPayload(state: ProjectWorkspaceState): ProjectWorkspaceState {
  return {
    version: 1,
    viewport: state.viewport,
    nodes: state.nodes,
    edges: state.edges,
  };
}

export function createNoteNode(
  position: { x: number; y: number },
  options?: { text?: string; title?: string },
): Node<WorkspaceNoteData> {
  const text = options?.text?.trim() ?? "";
  const title =
    options?.title?.trim() ||
    (text ? text.split(/\r?\n/)[0]?.slice(0, 48) || "Note" : "Note");

  return {
    id: `note-${crypto.randomUUID()}`,
    type: "note",
    position,
    data: {
      title,
      text,
      color: DEFAULT_WORKSPACE_NOTE_COLOR.border,
      transparent: false,
    },
    style: { width: 240, height: 160 },
  };
}

export function createMediaNode(
  position: { x: number; y: number },
  media: {
    mediaId: string;
    original_filename: string;
    media_kind: string;
    mime_type: string;
  },
): Node<WorkspaceMediaData> {
  const defaultSize =
    media.media_kind === "model_3d"
      ? { width: 280, height: 220 }
      : media.media_kind === "image"
        ? { width: 320, height: 240 }
        : { width: 260, height: 140 };

  return {
    id: `media-${crypto.randomUUID()}`,
    type: "media",
    position,
    data: {
      media_id: media.mediaId,
      original_filename: media.original_filename,
      media_kind: media.media_kind,
      mime_type: media.mime_type,
      color: DEFAULT_WORKSPACE_NOTE_COLOR.border,
    },
    style: defaultSize,
  };
}

export function viewportFromFlow(viewport: Viewport): WorkspaceViewport {
  return { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
}
