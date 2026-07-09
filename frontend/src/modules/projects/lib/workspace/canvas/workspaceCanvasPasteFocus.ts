// keel_web/src/modules/projects/lib/workspace/canvas/workspaceCanvasPasteFocus.ts

// Tracks whether the project workspace canvas was the last pointer target for paste.

let canvasPasteTargetActive = false;

export function setWorkspaceCanvasPasteTarget(active: boolean): void {
  canvasPasteTargetActive = active;
}

export function isWorkspaceCanvasPasteTarget(): boolean {
  return canvasPasteTargetActive;
}
