// Normalize persisted workspace edges for React Flow (type, data.color, pathStyle).

import type { Edge } from "@xyflow/react";

import { stripEdgesAttachedToLabelAnchors } from "./workspaceEdgeCleanup";
import {
  buildWorkspaceEdgeClassName,
  workspaceEdgeInteractionWidth,
  workspaceEdgeZIndex,
} from "./workspaceEdgeMeta";
import { WORKSPACE_NOTE_COLORS } from "../node/workspaceNoteColors";
import type { WorkspaceEdgeData } from "../projectWorkspace";

const EDGE_COLOR_ALIASES: Record<string, string> = {
  blue: "#2563eb",
  green: "#16a34a",
  red: "#ef4444",
  orange: "#ea580c",
  yellow: "#ca8a04",
  purple: "#9333ea",
  stone: "#57534e",
  slate: "#64748b",
};

const NOTE_BORDER_HEX = new Set(
  WORKSPACE_NOTE_COLORS.map((color) => color.border.toLowerCase()),
);

function normalizeEdgeColorValue(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const lower = trimmed.toLowerCase();
  if (EDGE_COLOR_ALIASES[lower]) {
    return EDGE_COLOR_ALIASES[lower];
  }
  if (NOTE_BORDER_HEX.has(lower)) {
    return lower;
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return lower;
  }
  return trimmed;
}

function readStrokeFromStyle(style: unknown): string | undefined {
  if (!style || typeof style !== "object") {
    return undefined;
  }
  const stroke = (style as Record<string, unknown>).stroke;
  return typeof stroke === "string" ? stroke : undefined;
}

export function normalizeWorkspaceEdge(edge: Edge): Edge {
  const data = { ...(edge.data ?? {}) } as WorkspaceEdgeData;
  const fromData = normalizeEdgeColorValue(data.color);
  const fromStyle = normalizeEdgeColorValue(readStrokeFromStyle(edge.style));

  const color = fromData ?? fromStyle;
  if (color) {
    data.color = color;
  }

  if (
    data.pathStyle !== "orthogonal" &&
    data.pathStyle !== "straight" &&
    data.pathStyle !== "smooth"
  ) {
    delete data.pathStyle;
  }

  const normalized = { ...edge, type: "workspace" as const, data };
  const className = buildWorkspaceEdgeClassName(normalized);
  const zIndex = workspaceEdgeZIndex(normalized);
  const interactionWidth = workspaceEdgeInteractionWidth(normalized);

  return {
    ...normalized,
    ...(className ? { className } : {}),
    ...(zIndex !== undefined ? { zIndex } : {}),
    interactionWidth,
  };
}

export function normalizeWorkspaceEdges(edges: Edge[]): Edge[] {
  return stripEdgesAttachedToLabelAnchors(edges.map((edge) => normalizeWorkspaceEdge(edge)));
}
