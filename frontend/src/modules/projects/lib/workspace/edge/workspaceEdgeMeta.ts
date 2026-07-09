// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/edge/workspaceEdgeMeta.ts

// Edge layering + class names for labeled workspace connections.

import type { Edge } from "@xyflow/react";

import { edgeHasVisibleLabel } from "./workspaceEdgeLabel";

export const WORKSPACE_LABELED_CARRIER_EDGE_CLASS = "workspace-labeled-carrier";

export function buildWorkspaceEdgeClassName(edge: Edge): string | undefined {
  if (edgeHasVisibleLabel(edge)) {
    return WORKSPACE_LABELED_CARRIER_EDGE_CLASS;
  }
  return undefined;
}

export function workspaceEdgeZIndex(_edge: Edge): number | undefined {
  return undefined;
}

/** Narrower hit target on labeled carriers so the label plate can receive clicks. */
export function workspaceEdgeInteractionWidth(
  edge: Pick<Edge, "data">,
): number {
  if (edgeHasVisibleLabel(edge)) {
    return 8;
  }
  return 24;
}
