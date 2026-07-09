// src/modules/focus/components/constellation/modals/FocusConstellationEntryAddModal.tsx

// Modal for adding a task or linked list from the constellation context menu.

import { useRef } from "react";

import type { FocusEntryCreatePayload, FocusReferenceSearchResult } from "../../../api";
import type { FocusConstellationModalOrigin } from "../../../lib/constellation/modalOrigin";
import { FocusEntryAddForm } from "../../forms/entry";
import { FocusConstellationNodeOriginModal } from "./FocusConstellationNodeOriginModal";

type FocusConstellationEntryAddModalProps = {
  open: boolean;
  parentTitle: string;
  listId: number | null;
  origin?: FocusConstellationModalOrigin | null;
  excludedLinkedListIds?: number[];
  onClose: () => void;
  onSubmit: (payload: FocusEntryCreatePayload) => Promise<unknown>;
  onAddRecord?: (result: FocusReferenceSearchResult) => Promise<unknown>;
  disabled?: boolean;
};

export function FocusConstellationEntryAddModal({
  open,
  parentTitle,
  listId,
  origin = null,
  excludedLinkedListIds = [],
  onClose,
  onSubmit,
  onAddRecord,
  disabled = false,
}: FocusConstellationEntryAddModalProps) {
  const lastListIdRef = useRef<number | null>(null);

  if (listId !== null) {
    lastListIdRef.current = listId;
  }

  const renderListId = listId ?? lastListIdRef.current;

  return (
    <FocusConstellationNodeOriginModal
      open={open && renderListId !== null}
      origin={origin}
      ariaLabel="Add entry"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white/90">Add entry</h2>
          <p className="mt-1 text-sm text-white/45">
            Add to <span className="text-white/70">{parentTitle}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white/80 disabled:opacity-40"
        >
          Close
        </button>
      </div>

      {renderListId !== null ? (
        <FocusEntryAddForm
          listId={renderListId}
          excludedLinkedListIds={excludedLinkedListIds}
          onSubmit={onSubmit}
          onAddRecord={onAddRecord}
          disabled={disabled}
        />
      ) : null}
    </FocusConstellationNodeOriginModal>
  );
}
