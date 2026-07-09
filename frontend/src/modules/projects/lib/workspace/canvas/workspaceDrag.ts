// HTML drag-and-drop helpers for dragging saved project media onto the canvas.

export const WORKSPACE_MEDIA_DRAG_PREFIX = "keel-workspace-media:";

export type WorkspaceMediaDragPayload = {
  mediaId: string;
  /** Project attachment row id — used when dropping onto folders in the side panel. */
  attachmentId: number;
  original_filename: string;
  media_kind: string;
  mime_type: string;
};

const WORKSPACE_MEDIA_DRAG_MIME = "application/x-keel-workspace-media";
const WORKSPACE_MEDIA_DRAG_MARKER = "text/x-keel-workspace-media";

/** In-memory payload — HTML5 dataTransfer is unreliable across panel → canvas drops. */
let activeWorkspaceMediaDrag: WorkspaceMediaDragPayload | null = null;

export function endWorkspaceMediaDrag(): void {
  activeWorkspaceMediaDrag = null;
}

export function hasWorkspaceMediaDrag(dataTransfer: DataTransfer | null): boolean {
  if (activeWorkspaceMediaDrag) {
    return true;
  }

  if (!dataTransfer) {
    return false;
  }

  if (dataTransfer.types.includes(WORKSPACE_MEDIA_DRAG_MARKER)) {
    return true;
  }
  if (dataTransfer.types.includes(WORKSPACE_MEDIA_DRAG_MIME)) {
    return true;
  }

  return (
    dataTransfer.types.includes("text/plain") &&
    !dataTransfer.types.includes("Files")
  );
}

export function isOsFileDrag(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes("Files") ?? false;
}
