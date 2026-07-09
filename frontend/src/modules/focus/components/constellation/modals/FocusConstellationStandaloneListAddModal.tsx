// src/modules/focus/components/constellation/modals/FocusConstellationStandaloneListAddModal.tsx

// Modal for adding a standalone list from empty constellation canvas space.

import type { FocusListCreatePayload } from "../../../api";
import { FocusEntryAddForm } from "../../forms/entry";

type FocusConstellationStandaloneListAddModalProps = {
  open: boolean;
  excludedLinkedListIds?: number[];
  onClose: () => void;
  onSubmitCreateList: (payload: FocusListCreatePayload) => Promise<unknown>;
  onSubmitLinkExistingList: (listId: number) => Promise<unknown>;
  disabled?: boolean;
};

export function FocusConstellationStandaloneListAddModal({
  open,
  excludedLinkedListIds = [],
  onClose,
  onSubmitCreateList,
  onSubmitLinkExistingList,
  disabled = false,
}: FocusConstellationStandaloneListAddModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#141210] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white/90">Add node</h2>
            <p className="mt-1 text-sm text-white/45">
              Create a new standalone list or link an existing unlinked list to the canvas.
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

        <FocusEntryAddForm
          variant="standalone"
          excludedLinkedListIds={excludedLinkedListIds}
          onSubmitCreateList={onSubmitCreateList}
          onSubmitLinkExistingList={onSubmitLinkExistingList}
          disabled={disabled}
          submitLabel="Add node"
          emptyLinkMessage="No unlinked lists are available to add."
        />
      </div>
    </div>
  );
}
