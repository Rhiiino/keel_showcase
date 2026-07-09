// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/edge/workspaceEdgeLabel.ts

// Label text and bounds for workspace connection labels.

import type { Edge } from "@xyflow/react";

import type { WorkspaceEdgeData } from "../projectWorkspace";

export const LABEL_MIN_WIDTH = 72;
export const LABEL_MAX_WIDTH = 200;
export const LABEL_MIN_HEIGHT = 22;

export function getEdgeLabelText(edge: Pick<Edge, "data">): string {
  return ((edge.data as WorkspaceEdgeData | undefined)?.label ?? "").trim();
}

export function edgeHasVisibleLabel(edge: Pick<Edge, "data">): boolean {
  return getEdgeLabelText(edge).length > 0;
}

export function edgeIsEditingLabel(edge: Edge): boolean {
  return Boolean((edge.data as WorkspaceEdgeData | undefined)?.editingLabel);
}

export function estimateLabelBounds(label: string): { width: number; height: number } {
  const trimmed = label.trim();
  if (!trimmed) {
    return { width: 0, height: 0 };
  }

  const charWidth = 7;
  const width = Math.min(
    LABEL_MAX_WIDTH,
    Math.max(LABEL_MIN_WIDTH, Math.ceil(trimmed.length * charWidth) + 12),
  );
  return { width, height: LABEL_MIN_HEIGHT };
}

export function resolveLabelBounds(
  edge: Edge,
): { width: number; height: number } | null {
  const data = edge.data as WorkspaceEdgeData | undefined;
  if (
    typeof data?.labelWidth === "number" &&
    typeof data?.labelHeight === "number" &&
    data.labelWidth > 0 &&
    data.labelHeight > 0
  ) {
    return { width: data.labelWidth, height: data.labelHeight };
  }

  const label = getEdgeLabelText(edge);
  if (!label && !edgeIsEditingLabel(edge)) {
    return null;
  }
  if (!label) {
    return { width: LABEL_MIN_WIDTH, height: LABEL_MIN_HEIGHT };
  }

  return estimateLabelBounds(label);
}
