// keel_web/src/modules/media/components/panels/contextMenu/useMediaPanelTileDeleteConfirm.ts

import { useEffect, useRef, useState } from "react";

import { DELETE_CONFIRM_TIMEOUT_MS } from "./MediaPanelTileContextMenuStyles";

export function useMediaPanelTileDeleteConfirm(itemId: string | null) {
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
  }, [itemId]);

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
