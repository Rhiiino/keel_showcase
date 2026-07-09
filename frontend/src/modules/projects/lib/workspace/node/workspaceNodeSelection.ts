// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/node/workspaceNodeSelection.ts

// Shared selected-state chrome for workspace canvas cards.

export const WORKSPACE_SELECTED_GLOW_CLASS =
  "shadow-[0_0_0_1px_rgba(56,189,248,0.38),0_0_18px_rgba(56,189,248,0.22)]";

/** Bright white stroke for Files-tab focus glow on shaped SVG outlines. */
export const WORKSPACE_FILES_PANEL_GLOW_STROKE = "#f8fafc";

/** Box-shadow glow for Files-tab focus on box-shaped cards. */
export function workspaceFilesPanelGlowBoxShadow(): string {
  return "0 0 0 2px rgba(248, 250, 252, 0.95), 0 0 14px rgba(255, 255, 255, 0.75), 0 0 24px rgba(255, 255, 255, 0.45)";
}

export function workspaceNodeSelectionClass(
  selected: boolean,
  baseShadowClass = "shadow-lg",
): string {
  return selected ? WORKSPACE_SELECTED_GLOW_CLASS : baseShadowClass;
}

export function workspaceNodeShadowClass(
  selected: boolean,
  hideChrome: boolean,
): string {
  if (hideChrome) {
    return "shadow-none";
  }
  return workspaceNodeSelectionClass(selected);
}
