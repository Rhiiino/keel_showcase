// src/modules/focus/components/constellation/contextMenu/useFocusConstellationDeleteConfirm.ts

import { useEffect, useRef, useState } from "react";

import { DELETE_CONFIRM_TIMEOUT_MS } from "./FocusConstellationContextMenuStyles";

export function useFocusConstellationDeleteConfirm(nodeId: string | number) {
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
  }, [nodeId]);

  useEffect(() => {
    if (!deleteConfirmPending) {
      clearDeleteConfirmTimer();
      return;
    }

    deleteConfirmTimerRef.current = window.setTimeout(() => {
      deleteConfirmTimerRef.current = null;
      setDeleteConfirmPending(false);
    }, DELETE_CONFIRM_TIMEOUT_MS);

    return clearDeleteConfirmTimer;
  }, [deleteConfirmPending]);

  return {
    deleteConfirmPending,
    setDeleteConfirmPending,
    clearDeleteConfirmTimer,
  };
}
