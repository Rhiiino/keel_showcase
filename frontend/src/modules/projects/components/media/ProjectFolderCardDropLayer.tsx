// keel_web/src/modules/projects/components/media/ProjectFolderCardDropLayer.tsx

// Full-card drop capture during in-app file/folder drag — matches media list folder row highlight.

import { useEffect, useRef } from "react";
import type { DragEvent } from "react";

import {
  hasProjectDragData,
  PROJECT_FOLDER_DRAG_OPEN_DELAY_MS,
} from "../../lib/project/media";

type ProjectFolderCardDropLayerProps = {
  enabled: boolean;
  active: boolean;
  isDropTarget?: boolean;
  dropTargetKey?: string;
  onDragEnterFolder?: (dropTargetKey: string) => void;
  onDragLeaveFolder?: (dropTargetKey: string) => void;
  onDropOnFolder?: (event: DragEvent<HTMLElement>) => void;
  onOpenFolderDuringDrag?: () => void;
};

export function ProjectFolderCardDropLayer({
  enabled,
  active,
  isDropTarget = false,
  dropTargetKey,
  onDragEnterFolder,
  onDragLeaveFolder,
  onDropOnFolder,
  onOpenFolderDuringDrag,
}: ProjectFolderCardDropLayerProps) {
  const dragOpenTimerRef = useRef<number | null>(null);

  const clearDragOpenTimer = () => {
    if (dragOpenTimerRef.current !== null) {
      window.clearTimeout(dragOpenTimerRef.current);
      dragOpenTimerRef.current = null;
    }
  };

  useEffect(() => clearDragOpenTimer, []);

  if (!enabled) {
    return null;
  }

  const scheduleDragOpen = () => {
    if (!onOpenFolderDuringDrag || dragOpenTimerRef.current !== null) {
      return;
    }
    dragOpenTimerRef.current = window.setTimeout(() => {
      dragOpenTimerRef.current = null;
      onOpenFolderDuringDrag();
    }, PROJECT_FOLDER_DRAG_OPEN_DELAY_MS);
  };

  const markDropTarget = () => {
    if (dropTargetKey) {
      onDragEnterFolder?.(dropTargetKey);
    }
  };

  return (
    <div
      className={[
        "absolute inset-0 z-20 rounded-lg transition",
        active ? "" : "pointer-events-none",
        isDropTarget
          ? "bg-sky-500/[0.08] ring-2 ring-inset ring-sky-400/50"
          : "",
      ].join(" ")}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        markDropTarget();
        if (hasProjectDragData(event)) {
          scheduleDragOpen();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        markDropTarget();
        if (hasProjectDragData(event)) {
          scheduleDragOpen();
        }
      }}
      onDragLeave={(event) => {
        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
          return;
        }
        clearDragOpenTimer();
        if (dropTargetKey) {
          onDragLeaveFolder?.(dropTargetKey);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        clearDragOpenTimer();
        onDropOnFolder?.(event);
      }}
      aria-hidden
    />
  );
}
