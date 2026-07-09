// stack_sandbox/frontend_web/src/modules/projects/lib/project/kanban/useKanbanProjectPointerDrag.ts

// Pointer-driven drag for moving Kanban cards between status rows.

import { useCallback, useEffect, useRef, useState } from "react";

import { isProjectStatus, type ProjectStatus } from "../projectStatus";

const DRAG_THRESHOLD_PX = 6;

type DragSession = {
  projectId: number;
  startX: number;
  startY: number;
  pointerId: number;
  active: boolean;
};

type UseKanbanProjectPointerDragOptions = {
  onDrop: (projectId: number, nextStatus: ProjectStatus) => void;
};

function readStatusFromPoint(clientX: number, clientY: number): ProjectStatus | null {
  const element = document.elementFromPoint(clientX, clientY);
  const row = element?.closest("[data-kanban-status]");
  if (!row) {
    return null;
  }

  const status = row.getAttribute("data-kanban-status");
  return status && isProjectStatus(status) ? status : null;
}

export function useKanbanProjectPointerDrag({
  onDrop,
}: UseKanbanProjectPointerDragOptions) {
  const [draggingProjectId, setDraggingProjectId] = useState<number | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<ProjectStatus | null>(
    null,
  );
  const sessionRef = useRef<DragSession | null>(null);
  const suppressClickRef = useRef<Set<number>>(new Set());
  const onDropRef = useRef(onDrop);

  onDropRef.current = onDrop;

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    setDraggingProjectId(null);
    setDropTargetStatus(null);
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current = null;
    };
  }, []);

  const handleCardPointerDown = useCallback(
    (projectId: number, event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      if ((event.target as HTMLElement).closest("[data-project-card-menu]")) {
        return;
      }

      sessionRef.current = {
        projectId,
        startX: event.clientX,
        startY: event.clientY,
        pointerId: event.pointerId,
        active: false,
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const session = sessionRef.current;
        if (!session || moveEvent.pointerId !== session.pointerId) {
          return;
        }

        if (!session.active) {
          const deltaX = moveEvent.clientX - session.startX;
          const deltaY = moveEvent.clientY - session.startY;
          if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
            return;
          }

          session.active = true;
          setDraggingProjectId(session.projectId);
        }

        setDropTargetStatus(readStatusFromPoint(moveEvent.clientX, moveEvent.clientY));
      };

      const finishPointer = (upEvent: PointerEvent) => {
        const session = sessionRef.current;
        if (!session || upEvent.pointerId !== session.pointerId) {
          return;
        }

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", finishPointer);
        window.removeEventListener("pointercancel", finishPointer);

        if (session.active) {
          const nextStatus = readStatusFromPoint(upEvent.clientX, upEvent.clientY);
          if (nextStatus) {
            onDropRef.current(session.projectId, nextStatus);
          }

          suppressClickRef.current.add(session.projectId);
          window.setTimeout(() => {
            suppressClickRef.current.delete(session.projectId);
          }, 150);
        }

        clearSession();
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", finishPointer);
      window.addEventListener("pointercancel", finishPointer);
    },
    [clearSession],
  );

  const shouldSuppressClick = useCallback((projectId: number) => {
    return suppressClickRef.current.has(projectId);
  }, []);

  return {
    draggingProjectId,
    dropTargetStatus,
    handleCardPointerDown,
    shouldSuppressClick,
  };
}
