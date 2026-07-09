// keel_web/src/modules/projects/lib/project/media/projectFileFolderDragSession.ts

// In-memory drag payload for project file/folder moves when HTML5 dataTransfer is unreliable.

import type { ProjectDragItem } from "./projectFileFolderDrag";

const PROJECT_FOLDER_DROP_ATTR = "data-project-folder-drop-key";

let activeDragItem: ProjectDragItem | null = null;
let activeDropTargetKey: string | null = null;
const sessionListeners = new Set<() => void>();

function notifySessionListeners(): void {
  sessionListeners.forEach((listener) => listener());
}

type PanelFolderDropHandler = (
  attachmentId: number,
  dropKey: string,
) => void;

let panelFolderDropHandler: PanelFolderDropHandler | null = null;

export function subscribeProjectFileFolderDragSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function getProjectFolderDropTargetKey(): string | null {
  return activeDropTargetKey;
}

export function setProjectFolderDropTargetKey(dropTargetKey: string | null): void {
  if (activeDropTargetKey === dropTargetKey) {
    return;
  }
  activeDropTargetKey = dropTargetKey;
  notifySessionListeners();
}

export function beginProjectFileFolderDrag(item: ProjectDragItem): void {
  activeDragItem = item;
  notifySessionListeners();
}

export function endProjectFileFolderDrag(): void {
  activeDragItem = null;
  activeDropTargetKey = null;
  notifySessionListeners();
}

export function getActiveProjectFileFolderDrag(): ProjectDragItem | null {
  return activeDragItem;
}

export function consumeActiveProjectFileFolderDrag(): ProjectDragItem | null {
  const item = activeDragItem;
  activeDragItem = null;
  if (item) {
    notifySessionListeners();
  }
  return item;
}

export function registerWorkspacePanelFolderDropHandler(
  handler: PanelFolderDropHandler | null,
): void {
  panelFolderDropHandler = handler;
}

export function projectFolderDropKeyAtPoint(clientX: number, clientY: number): string | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    const target = element.closest(`[${PROJECT_FOLDER_DROP_ATTR}]`);
    if (target instanceof HTMLElement) {
      const dropKey = target.getAttribute(PROJECT_FOLDER_DROP_ATTR);
      if (dropKey) {
        return dropKey;
      }
    }
  }
  return null;
}

export function tryWorkspacePanelFolderDrop(
  attachmentId: number,
  clientX: number,
  clientY: number,
): boolean {
  const dropKey =
    projectFolderDropKeyAtPoint(clientX, clientY) ?? getProjectFolderDropTargetKey();
  if (!dropKey || !panelFolderDropHandler) {
    return false;
  }
  panelFolderDropHandler(attachmentId, dropKey);
  setProjectFolderDropTargetKey(null);
  return true;
}

export const projectFolderDropTargetAttr = PROJECT_FOLDER_DROP_ATTR;
