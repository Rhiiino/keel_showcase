// keel_web/src/modules/projects/components/workspace/canvas/useWorkspaceCanvasDeleteConfirm.ts

// Two-step delete confirmation for workspace canvas context menus.

import { useEffect, useRef, useState } from "react";

export const WORKSPACE_DELETE_CONFIRM_TIMEOUT_MS = 30_000;

export function useWorkspaceCanvasDeleteConfirm(resetKey: string | null) {
  const [deleteConfirmPending, setDeleteConfirmPending] = useState(false);
  const deleteConfirmTimerRef = useRef<number | null>(null);

  const clearDeleteConfirmTimer = () => {
    if (deleteConfirmTimerRef.current !== null) {
      window.clearTimeout(deleteConfirmTimerRef.current);
      deleteConfirmTimerRef.current = null;
    }
  };

  useEffect(() => {
    setDeleteConfirmPending(false);
    clearDeleteConfirmTimer();
  }, [resetKey]);

  useEffect(() => {
    if (!deleteConfirmPending) {
      clearDeleteConfirmTimer();
      return;
    }

    deleteConfirmTimerRef.current = window.setTimeout(() => {
      deleteConfirmTimerRef.current = null;
      setDeleteConfirmPending(false);
    }, WORKSPACE_DELETE_CONFIRM_TIMEOUT_MS);

    return clearDeleteConfirmTimer;
  }, [deleteConfirmPending]);

  return {
    deleteConfirmPending,
    setDeleteConfirmPending,
  };
}
