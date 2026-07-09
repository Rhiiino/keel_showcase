// src/modules/focus/components/constellation/modals/FocusConstellationItemViewModal.tsx

// Modal item editor opened from a constellation task node's View action.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { focusQueryKeys } from "../../../api";
import type { FocusConstellationModalOrigin } from "../../../lib/constellation/modalOrigin";
import {
  FocusItemEditor,
  type FocusItemEditorHandle,
} from "../../forms/editors";
import { FocusConstellationNodeOriginModal } from "./FocusConstellationNodeOriginModal";

type FocusConstellationItemViewModalProps = {
  open: boolean;
  itemId: number | null;
  origin?: FocusConstellationModalOrigin | null;
  onClose: () => void;
};

export function FocusConstellationItemViewModal({
  open,
  itemId,
  origin = null,
  onClose,
}: FocusConstellationItemViewModalProps) {
  const queryClient = useQueryClient();
  const editorRef = useRef<FocusItemEditorHandle>(null);
  const lastItemIdRef = useRef<number | null>(null);

  if (itemId !== null) {
    lastItemIdRef.current = itemId;
  }

  const renderItemId = itemId ?? lastItemIdRef.current;

  const refreshConstellation = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
  }, [queryClient]);

  const handleClose = useCallback(() => {
    const editor = editorRef.current;
    if (editor?.isFormDirty()) {
      const discard = window.confirm(
        "You have unsaved task changes. Discard them and close?",
      );
      if (!discard) {
        return;
      }
      editor.discardForm();
    }

    refreshConstellation();
    onClose();
  }, [onClose, refreshConstellation]);

  return (
    <FocusConstellationNodeOriginModal
      open={open}
      origin={origin}
      ariaLabel="View task"
      panelClassName="flex max-h-[90vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#141210] shadow-2xl"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-white/90">View task</h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white/80"
        >
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
        {renderItemId !== null ? (
          <FocusItemEditor ref={editorRef} itemId={renderItemId} deferConstellationRefresh />
        ) : null}
      </div>
    </FocusConstellationNodeOriginModal>
  );
}
