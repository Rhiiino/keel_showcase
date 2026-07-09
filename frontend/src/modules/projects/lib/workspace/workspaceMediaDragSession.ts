// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/workspaceMediaDragSession.ts

// Pointer-based drag session for moving saved project media from the panel onto the canvas.
// More reliable than HTML5 DnD across React Flow in Chrome.

import type { PointerEvent as ReactPointerEvent } from "react";

import type { WorkspaceMediaDragPayload } from "./canvas/workspaceDrag";
import {
  beginProjectFileFolderDrag,
  endProjectFileFolderDrag,
  projectFolderDropKeyAtPoint,
  setProjectFolderDropTargetKey,
  tryWorkspacePanelFolderDrop,
} from "../project/media/projectFileFolderDragSession";

type DropHandler = (
  payload: WorkspaceMediaDragPayload,
  clientX: number,
  clientY: number,
) => void;

type DragSession = {
  payload: WorkspaceMediaDragPayload;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  onTap?: (payload: WorkspaceMediaDragPayload) => void;
};

const TAP_MOVE_THRESHOLD_PX = 8;

export type WorkspaceMediaDragPreviewState = {
  payload: WorkspaceMediaDragPayload;
  x: number;
  y: number;
};

let activeSession: DragSession | null = null;
let previewState: WorkspaceMediaDragPreviewState | null = null;
let dropTargetElement: HTMLElement | null = null;
let dropHandler: DropHandler | null = null;
const previewListeners = new Set<() => void>();

function notifyPreviewListeners(): void {
  previewListeners.forEach((listener) => listener());
}

function setPreviewState(next: WorkspaceMediaDragPreviewState | null): void {
  previewState = next;
  notifyPreviewListeners();
}

export function subscribeWorkspaceMediaDragPreview(listener: () => void): () => void {
  previewListeners.add(listener);
  return () => {
    previewListeners.delete(listener);
  };
}

export function getWorkspaceMediaDragPreview(): WorkspaceMediaDragPreviewState | null {
  return previewState;
}

function cleanupDocumentListeners(): void {
  document.removeEventListener("pointermove", handlePointerMove);
  document.removeEventListener("pointerup", handlePointerUp);
  document.removeEventListener("pointercancel", handlePointerUp);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  setPreviewState(null);
  setProjectFolderDropTargetKey(null);
}

function handlePointerMove(event: PointerEvent): void {
  if (!activeSession || event.pointerId !== activeSession.pointerId) {
    return;
  }

  if (!activeSession.moved) {
    const dx = event.clientX - activeSession.startX;
    const dy = event.clientY - activeSession.startY;
    if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
      activeSession.moved = true;
    }
  }

  setPreviewState({
    payload: activeSession.payload,
    x: event.clientX,
    y: event.clientY,
  });
  document.body.style.cursor = "copy";
  if (activeSession.payload.attachmentId > 0) {
    setProjectFolderDropTargetKey(
      projectFolderDropKeyAtPoint(event.clientX, event.clientY),
    );
  }
}

function isPointInsideElement(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function handlePointerUp(event: PointerEvent): void {
  if (!activeSession || event.pointerId !== activeSession.pointerId) {
    return;
  }

  const { payload, moved, onTap } = activeSession;
  let dropped = false;
  activeSession = null;
  cleanupDocumentListeners();

  if (payload.attachmentId > 0) {
    if (
      tryWorkspacePanelFolderDrop(payload.attachmentId, event.clientX, event.clientY)
    ) {
      dropped = true;
    }
    endProjectFileFolderDrag();
  }

  if (
    !dropped &&
    dropTargetElement &&
    dropHandler &&
    isPointInsideElement(dropTargetElement, event.clientX, event.clientY)
  ) {
    dropHandler(payload, event.clientX, event.clientY);
    dropped = true;
  }

  if (!moved && !dropped) {
    onTap?.(payload);
  }
}

export function registerWorkspaceMediaDropTarget(
  element: HTMLElement | null,
  handler: DropHandler | null,
): void {
  dropTargetElement = element;
  dropHandler = handler;
}

type BeginWorkspaceMediaPointerDragOptions = {
  /** Fired on pointer up when the gesture was a tap (no drag, no canvas drop). */
  onTap?: (payload: WorkspaceMediaDragPayload) => void;
};

export function beginWorkspaceMediaPointerDrag(
  payload: WorkspaceMediaDragPayload,
  event: ReactPointerEvent<HTMLElement>,
  options?: BeginWorkspaceMediaPointerDragOptions,
): void {
  if (event.button !== 0) {
    return;
  }

  beginWorkspaceMediaPointerDragAt(
    payload,
    event.pointerId,
    event.clientX,
    event.clientY,
    options,
  );
}

export function beginWorkspaceMediaPointerDragAt(
  payload: WorkspaceMediaDragPayload,
  pointerId: number,
  clientX: number,
  clientY: number,
  options?: BeginWorkspaceMediaPointerDragOptions,
): void {
  activeSession = {
    payload,
    pointerId,
    startX: clientX,
    startY: clientY,
    moved: false,
    onTap: options?.onTap,
  };
  if (payload.attachmentId > 0) {
    beginProjectFileFolderDrag({
      type: "attachment",
      id: String(payload.attachmentId),
    });
  }
  setPreviewState({
    payload,
    x: clientX,
    y: clientY,
  });
  document.body.style.userSelect = "none";
  document.body.style.cursor = "copy";

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
  document.addEventListener("pointercancel", handlePointerUp);
}

export function isWorkspaceMediaPointerDragActive(): boolean {
  return activeSession !== null;
}

export function cancelWorkspaceMediaPointerDrag(): void {
  if (activeSession?.payload.attachmentId) {
    endProjectFileFolderDrag();
  }
  activeSession = null;
  cleanupDocumentListeners();
}
