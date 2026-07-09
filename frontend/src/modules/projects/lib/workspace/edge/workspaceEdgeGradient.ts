// keel_web/src/modules/projects/lib/workspace/edge/workspaceEdgeGradient.ts

// Directional gradient stroke for workspace connections (source → target).

export const WORKSPACE_EDGE_GRADIENT_SOURCE_OPACITY = 0.95;
export const WORKSPACE_EDGE_GRADIENT_TARGET_OPACITY = 0.14;
export const WORKSPACE_EDGE_GRADIENT_SELECTED_SOURCE_OPACITY = 1;
export const WORKSPACE_EDGE_GRADIENT_SELECTED_TARGET_OPACITY = 0.72;

export function sanitizeWorkspaceEdgeGradientId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
