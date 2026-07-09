// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/snap/workspaceSnapStorage.ts

// Browser persistence for workspace canvas shape snap toggle.

export const WORKSPACE_SNAP_ENABLED_STORAGE_KEY = "keel.projects.workspaceSnapEnabled";

export function readStoredWorkspaceSnapEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(WORKSPACE_SNAP_ENABLED_STORAGE_KEY);
    if (raw === "true") {
      return true;
    }
    if (raw === "false") {
      return false;
    }
  } catch {
    return false;
  }

  return false;
}
