// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelDrag.ts

// HTML drag-and-drop helpers for status panel tabs.

import type { DragEvent } from "react";

import type { StatusPanelTabId } from "./statusPanelConfig";
import {
  STATUS_PANEL_TAB_DRAG_MIME,
  isValidTabId,
} from "./statusPanelTabLayout";

export function setStatusPanelTabDragData(
  dataTransfer: DataTransfer,
  tabId: StatusPanelTabId,
): void {
  dataTransfer.setData(STATUS_PANEL_TAB_DRAG_MIME, tabId);
  dataTransfer.setData("text/plain", tabId);
  dataTransfer.effectAllowed = "move";
}

export function readStatusPanelTabDragData(
  dataTransfer: DataTransfer,
): StatusPanelTabId | null {
  const raw =
    dataTransfer.getData(STATUS_PANEL_TAB_DRAG_MIME) ||
    dataTransfer.getData("text/plain");
  return isValidTabId(raw) ? raw : null;
}

export function allowStatusPanelTabDrop(event: DragEvent): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}
