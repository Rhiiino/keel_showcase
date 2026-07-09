// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/panel/workspacePanelStorage.ts

// Browser persistence for workspace files panel layout (localStorage).

import {
  WORKSPACE_PANEL_DEFAULT_SIDE,
  WORKSPACE_PANEL_DEFAULT_WIDTH,
  WORKSPACE_PANEL_MAX_WIDTH,
  WORKSPACE_PANEL_MIN_WIDTH,
  type WorkspacePanelSide,
} from "./workspacePanelConfig";

export const WORKSPACE_PANEL_LAYOUT_STORAGE_KEY = "keel.projects.workspacePanelLayout";

type StoredWorkspacePanelLayout = {
  side?: unknown;
  width?: unknown;
};

function clampWidth(width: number): number {
  return Math.min(
    WORKSPACE_PANEL_MAX_WIDTH,
    Math.max(WORKSPACE_PANEL_MIN_WIDTH, width),
  );
}

function parseSide(value: unknown): WorkspacePanelSide | null {
  return value === "left" || value === "right" ? value : null;
}

function parseWidth(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return clampWidth(Math.round(value));
}

export function readStoredWorkspacePanelLayout(): {
  side: WorkspacePanelSide;
  width: number;
} {
  try {
    const raw = localStorage.getItem(WORKSPACE_PANEL_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {
        side: WORKSPACE_PANEL_DEFAULT_SIDE,
        width: WORKSPACE_PANEL_DEFAULT_WIDTH,
      };
    }

    const parsed = JSON.parse(raw) as StoredWorkspacePanelLayout;
    return {
      side: parseSide(parsed.side) ?? WORKSPACE_PANEL_DEFAULT_SIDE,
      width: parseWidth(parsed.width) ?? WORKSPACE_PANEL_DEFAULT_WIDTH,
    };
  } catch {
    return {
      side: WORKSPACE_PANEL_DEFAULT_SIDE,
      width: WORKSPACE_PANEL_DEFAULT_WIDTH,
    };
  }
}

export function writeStoredWorkspacePanelLayout(layout: {
  side: WorkspacePanelSide;
  width: number;
}): void {
  try {
    localStorage.setItem(
      WORKSPACE_PANEL_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        side: layout.side,
        width: clampWidth(layout.width),
      }),
    );
  } catch {
    // Private browsing or quota — ignore.
  }
}
