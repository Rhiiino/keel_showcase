// src/modules/focus/components/forms/editors/FocusListEditor.tsx

// Full focus list editor — metadata, entries, reorder, and nested linked lists.

import { forwardRef } from "react";
import { useRecordNotFoundRedirect } from "../../../../../hooks/useRecordNotFoundRedirect";
import {
  useFocusListEditor,
  type FocusListEditorHandle,
} from "../../../hooks/useFocusListEditor";
import { FocusScopedConstellationIcon } from "../../shared/icons";
import { FocusReferenceRecordLink } from "../../shared/references";
import { FocusEntryAddForm } from "../entry";
import { FocusNodeTimeEntriesPanel } from "../timer";
import { FocusNodeTimerControls } from "../timer";
import { FocusListEditorBulkToolbar } from "./FocusListEditorBulkToolbar";
import { FocusListEditorEntryList } from "./FocusListEditorEntryList";
import { FocusListEditorHeader } from "./FocusListEditorHeader";

export type { FocusListEditorHandle };

type FocusListEditorProps = {
  listId: number;
  /** When true, only the open list refetches until the caller invalidates the full focus graph. */
  deferConstellationRefresh?: boolean;
};

export const FocusListEditor = forwardRef<FocusListEditorHandle, FocusListEditorProps>(
  function FocusListEditor({ listId, deferConstellationRefresh = false }, ref) {
    const {
      isLoading,
      fetchError,
      isRecordFetched,
      hasRecordData,
      list,
      headerProps,
      constellationAction,
      timerControlsProps,
      timeEntriesPanelProps,
      isTimeEntriesPanelOpen,
      addFormProps,
      bulkToolbarProps,
      entryListProps,
    } = useFocusListEditor({ listId, deferConstellationRefresh, ref });

    const redirecting = useRecordNotFoundRedirect({
      isLoading,
      error: fetchError,
      isFetched: isRecordFetched,
      hasData: hasRecordData,
      listPath: "/focus",
      notice: "That focus list could not be found.",
    });

    if (redirecting || isLoading) {
      return <p className="text-sm text-white/50">Loading list…</p>;
    }

    if (!list) {
      return null;
    }

    const referenceTarget = list.reference_target;
    const showReferenceLink = list.kind === "record" && referenceTarget !== null;

    return (
      <div
        className={[
          "grid gap-6 transition-[grid-template-columns] duration-200",
          isTimeEntriesPanelOpen ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : "grid-cols-1",
        ].join(" ")}
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-wrap items-center justify-end gap-2">
            {constellationAction ? (
              <button
                type="button"
                aria-label={constellationAction.label}
                title={constellationAction.label}
                onClick={constellationAction.onOpen}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/70 transition hover:bg-white/[0.08] hover:text-white/90"
              >
                <FocusScopedConstellationIcon />
              </button>
            ) : null}
            <FocusNodeTimerControls {...timerControlsProps} />
          </section>
          {showReferenceLink && referenceTarget ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-violet-200/55">
                Linked record
              </span>
              <FocusReferenceRecordLink
                targetType={referenceTarget.target_type}
                targetId={referenceTarget.target_id}
                title={referenceTarget.title}
                isMissing={referenceTarget.is_missing}
              />
            </div>
          ) : null}
          <FocusListEditorHeader {...headerProps} />
          <FocusEntryAddForm {...addFormProps} />
          {bulkToolbarProps ? (
            <FocusListEditorBulkToolbar {...bulkToolbarProps} />
          ) : null}
          <FocusListEditorEntryList {...entryListProps} />
        </div>
        {isTimeEntriesPanelOpen ? (
          <FocusNodeTimeEntriesPanel {...timeEntriesPanelProps} />
        ) : null}
      </div>
    );
  },
);
