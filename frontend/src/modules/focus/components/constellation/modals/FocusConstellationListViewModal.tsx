// src/modules/focus/components/constellation/modals/FocusConstellationListViewModal.tsx

// Modal list editor opened from a constellation list node's View action.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { focusQueryKeys } from "../../../api";
import type { FocusConstellationModalOrigin } from "../../../lib/constellation/modalOrigin";
import {
  FocusListEditor,
  type FocusListEditorHandle,
} from "../../forms/editors";
import { FocusConstellationNodeOriginModal } from "./FocusConstellationNodeOriginModal";

type FocusConstellationListViewModalProps = {
  open: boolean;
  listId: number | null;
  origin?: FocusConstellationModalOrigin | null;
  onClose: () => void;
};

export function FocusConstellationListViewModal({
  open,
  listId,
  origin = null,
  onClose,
}: FocusConstellationListViewModalProps) {
  const queryClient = useQueryClient();
  const editorRef = useRef<FocusListEditorHandle>(null);
  const lastListIdRef = useRef<number | null>(null);

  if (listId !== null) {
    lastListIdRef.current = listId;
  }

  const renderListId = listId ?? lastListIdRef.current;

  const refreshConstellation = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
  }, [queryClient]);

  const handleClose = useCallback(() => {
    const editor = editorRef.current;
    if (editor?.isFormDirty()) {
      const discard = window.confirm(
        "You have unsaved list changes. Discard them and close?",
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
      ariaLabel="View list"
      panelClassName="flex max-h-[90vh] w-full max-w-[56rem] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#141210] shadow-2xl"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-white/90">View list</h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white/80"
        >
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {renderListId !== null ? (
          <FocusListEditor
            ref={editorRef}
            listId={renderListId}
            deferConstellationRefresh
          />
        ) : null}
      </div>
    </FocusConstellationNodeOriginModal>
  );
}
