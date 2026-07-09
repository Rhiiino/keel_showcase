// keel_web/src/modules/timeline/components/plans/TimelinePlanItemEditorModal.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { InlineSaveDiscardActions } from "../../../../components/InlineSaveDiscardActions";
import { useTimelinePlanItemEditor } from "../../hooks/useTimelinePlanItemEditor";
import { formatTimelinePlanDateRange } from "../../lib/timelinePlanDisplay";
import type { TimelinePlanItem } from "../../api";
import { TimelinePlanItemForm } from "./TimelinePlanItemForm";

type TimelinePlanItemEditorModalProps = {
  open: boolean;
  planId: number;
  planStartDate: string;
  planEndDate: string;
  item: TimelinePlanItem | null;
  mode: "create" | "edit";
  onClose: () => void;
  /** When set, shows the parent plan title and date range above the item form. */
  planContext?: {
    title: string;
    startDate: string;
    endDate: string;
  } | null;
  planContextLoading?: boolean;
};

export function TimelinePlanItemEditorModal({
  open,
  planId,
  planStartDate,
  planEndDate,
  item,
  mode,
  onClose,
  planContext = null,
  planContextLoading = false,
}: TimelinePlanItemEditorModalProps) {
  const editor = useTimelinePlanItemEditor({
    planId,
    planStartDate,
    planEndDate,
    item,
    mode,
    onSaveSuccess: onClose,
    onDeleteSuccess: onClose,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const title = mode === "create" ? "Add plan item" : "Edit plan item";
  const showPlanContext = planContext != null || planContextLoading;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close plan item editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[min(90vh,56rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-50">{title}</h2>
          <div className="flex items-center gap-2">
            {editor.isDirty ? (
              <InlineSaveDiscardActions
                visible
                onDiscard={editor.handleDiscard}
                onSave={() => void editor.save()}
                isSaving={editor.isSaving}
                canSave={editor.canSave}
                saveError={editor.saveError}
              />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2.5 py-1.5 text-sm text-stone-400 transition hover:bg-stone-800 hover:text-stone-200"
            >
              Close
            </button>
          </div>
        </header>

        {showPlanContext ? (
          <div className="border-b border-stone-800/80 px-5 py-3">
            {planContextLoading && !planContext ? (
              <p className="text-sm text-stone-500">Loading plan…</p>
            ) : planContext ? (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-base font-medium text-stone-100">{planContext.title}</p>
                <p className="text-sm text-stone-500">
                  {formatTimelinePlanDateRange(planContext.startDate, planContext.endDate)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-400">Failed to load plan.</p>
            )}
          </div>
        ) : null}

        <div className="overflow-y-auto px-5 py-5">
          {planContextLoading ? (
            <p className="text-sm text-stone-500">Loading plan item…</p>
          ) : !planStartDate || !planEndDate ? (
            <p className="text-sm text-stone-500">Plan details are unavailable.</p>
          ) : (
            <TimelinePlanItemForm
            values={editor.values}
            onChange={editor.setValues}
            disabled={editor.pending}
            showDelete={mode === "edit"}
            onDelete={() => void editor.deleteItem()}
            deleteDisabled={editor.pending}
            showPromote={editor.canPromote}
            onPromote={() => void editor.promoteItem()}
            promoteDisabled={editor.pending}
            promoteError={editor.promoteError}
            linkedEventId={editor.linkedEventId}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
