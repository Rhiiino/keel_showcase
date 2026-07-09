// src/modules/focus/components/forms/editors/FocusListEditorHeader.tsx

// Focus list editor header — metadata fields and save/discard controls.

import { ProjectDetailInlineTitle } from "../../../../projects/components/detail";
import type { ProjectTitleFontKey } from "../../../../projects/lib/project/appearance";
import type { FocusNodeStatus } from "../../../lib/focus";
import { FocusListCardColorPicker } from "../../cards/card";
import { FocusListCardColorStripe } from "../../cards/card";
import { FocusListTagSelect } from "../fields";
import { FocusNodeStatusSelect } from "../fields";
import { FocusWorkOrderInput } from "../fields";

export type FocusListEditorHeaderProps = {
  listId: number;
  isFormDirty: boolean;
  canSaveForm: boolean;
  listPending: boolean;
  saveErrorMessage: string | null;
  titleDraft: string;
  onTitleDraftChange: (value: string) => void;
  titlePlaceholder?: string;
  saveDisabledMessage?: string;
  titleFontDraft: ProjectTitleFontKey;
  onTitleFontDraftChange: (value: ProjectTitleFontKey) => void;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  statusDraft: FocusNodeStatus;
  onStatusDraftChange: (value: FocusNodeStatus) => void;
  workOrderDraft: number | null;
  onWorkOrderDraftChange: (value: number | null) => void;
  tagIdsDraft: number[];
  onTagIdsDraftChange: (value: number[]) => void;
  nodeColorDraft: string | null;
  onNodeColorDraftChange: (value: string | null) => void;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
  savingLabel?: string;
};

export function FocusListEditorHeader({
  listId,
  isFormDirty,
  canSaveForm,
  listPending,
  saveErrorMessage,
  titleDraft,
  onTitleDraftChange,
  titlePlaceholder,
  saveDisabledMessage,
  titleFontDraft,
  onTitleFontDraftChange,
  notesDraft,
  onNotesDraftChange,
  statusDraft,
  onStatusDraftChange,
  workOrderDraft,
  onWorkOrderDraftChange,
  tagIdsDraft,
  onTagIdsDraftChange,
  nodeColorDraft,
  onNodeColorDraftChange,
  onDiscard,
  onSave,
  saveLabel = "Save",
  savingLabel = "Saving…",
}: FocusListEditorHeaderProps) {
  return (
    <header className="relative">
      <div
        className={[
          "absolute right-0 top-0 flex items-center gap-2 transition-opacity duration-150",
          isFormDirty
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onDiscard}
          disabled={listPending}
          tabIndex={isFormDirty ? 0 : -1}
          aria-hidden={!isFormDirty}
          className={[
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            listPending
              ? "cursor-not-allowed text-white/30"
              : "text-white/55 ring-1 ring-white/15 hover:bg-white/[0.05] hover:text-white/80",
          ].join(" ")}
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={listPending || !canSaveForm}
          tabIndex={isFormDirty ? 0 : -1}
          aria-hidden={!isFormDirty}
          className="rounded-lg bg-sky-500/90 px-4 py-1.5 text-sm font-medium text-stone-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {listPending ? savingLabel : saveLabel}
        </button>
      </div>

      {saveErrorMessage ? (
        <p className="mt-2 text-right text-sm text-rose-300">{saveErrorMessage}</p>
      ) : null}

      <div className={["min-w-0", isFormDirty ? "pr-40" : ""].join(" ")}>
        <ProjectDetailInlineTitle
          value={titleDraft}
          onChange={onTitleDraftChange}
          placeholder={titlePlaceholder}
          titleFontDraft={titleFontDraft}
          onTitleFontDraftChange={onTitleFontDraftChange}
          disabled={listPending}
          titleClassName="break-all text-2xl font-semibold"
          inputToneClassName="text-white/95 placeholder:text-white/30"
        />
        {saveDisabledMessage && isFormDirty && !canSaveForm ? (
          <p className="mt-2 text-xs text-amber-200/70">{saveDisabledMessage}</p>
        ) : null}
      </div>

      <div className="mt-4 flex items-stretch gap-4">
        <FocusListCardColorStripe colorHex={nodeColorDraft} />

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label
              htmlFor={`focus-list-notes-${listId}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Notes
            </label>
            <textarea
              id={`focus-list-notes-${listId}`}
              value={notesDraft}
              onChange={(event) => onNotesDraftChange(event.target.value)}
              disabled={listPending}
              rows={3}
              placeholder="Add notes for this list…"
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/85 focus:border-white/20 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={`focus-list-status-${listId}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Status
            </label>
            <FocusNodeStatusSelect
              id={`focus-list-status-${listId}`}
              value={statusDraft}
              disabled={listPending}
              onChange={onStatusDraftChange}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={`focus-list-work-order-${listId}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Work order
            </label>
            <FocusWorkOrderInput
              id={`focus-list-work-order-${listId}`}
              value={workOrderDraft}
              disabled={listPending}
              onChange={onWorkOrderDraftChange}
            />
          </div>

          <FocusListTagSelect
            selectedTagIds={tagIdsDraft}
            onChange={onTagIdsDraftChange}
            disabled={listPending}
            hideManageButton
          />

          <FocusListCardColorPicker
            variant="inline"
            colorHex={nodeColorDraft}
            disabled={listPending}
            onChange={onNodeColorDraftChange}
          />
        </div>
      </div>
    </header>
  );
}
