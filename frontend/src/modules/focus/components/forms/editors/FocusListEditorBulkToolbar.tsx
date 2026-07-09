// src/modules/focus/components/forms/editors/FocusListEditorBulkToolbar.tsx

// Bulk selection toolbar for focus list entry rows.

import { TrashIcon } from "../../shared/icons";

export type FocusListEditorBulkToolbarProps = {
  selectedCount: number;
  bulkDeletePending: boolean;
  onBulkDelete: () => void;
};

export function FocusListEditorBulkToolbar({
  selectedCount,
  bulkDeletePending,
  onBulkDelete,
}: FocusListEditorBulkToolbarProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <span className="text-sm text-white/60">
        {selectedCount} {selectedCount === 1 ? "entry" : "entries"} selected
      </span>
      <button
        type="button"
        disabled={bulkDeletePending}
        onClick={onBulkDelete}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-40"
      >
        <TrashIcon className="h-4 w-4" />
        Delete selected
      </button>
    </div>
  );
}
