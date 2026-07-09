// keel_web/src/modules/journal/components/forms/JournalEntryForm.tsx

import { ConfirmTrashButton } from "../../../media/components/shared/actions";
import {
  EntityMediaCarousel,
  type PendingMediaSelection,
  type PendingUpload,
} from "../../../media/components/EntityMediaCarousel";
import type { MediaObject } from "../../../media/api";
import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import type { JournalEntry, JournalEntryGalleryEntry } from "../../api";
import { todayDateInputValue } from "../../lib/journalDisplay";
import { JournalInlineTags } from "../tags/JournalInlineTags";

export type JournalEntryFormValues = {
  entryDate: string;
  content: string;
  tagIds: number[];
};

type JournalEntryFormProps = {
  values: JournalEntryFormValues;
  onChange: (values: JournalEntryFormValues) => void;
  disabled?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  media?: JournalEntryGalleryEntry[];
  pendingUploads?: PendingUpload[];
  pendingMediaSelections?: PendingMediaSelection[];
  onQueueUploads?: (files: FileList | File[]) => void;
  onQueueMediaSelections?: (media: MediaObject[]) => void;
  onRemovePendingUpload?: (clientId: string) => void;
  onRemovePendingMedia?: (clientId: string) => void;
  onDeleteMedia?: (attachmentId: number) => void;
  pageFileDragActive?: boolean;
};

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

export function JournalEntryForm({
  values,
  onChange,
  disabled = false,
  showDelete = false,
  onDelete,
  deleteDisabled = false,
  media = [],
  pendingUploads = [],
  pendingMediaSelections = [],
  onQueueUploads,
  onQueueMediaSelections,
  onRemovePendingUpload,
  onRemovePendingMedia,
  onDeleteMedia,
  pageFileDragActive = false,
}: JournalEntryFormProps) {
  const update = (patch: Partial<JournalEntryFormValues>) => {
    onChange({ ...values, ...patch });
  };

  return (
    <div className="space-y-8">
      <div>
        <FieldLabel>Date</FieldLabel>
        <input
          type="date"
          value={values.entryDate}
          disabled={disabled}
          onChange={(event) => update({ entryDate: event.target.value })}
          className="w-full max-w-md rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        />
      </div>

      <div>
        <FieldLabel>Tags</FieldLabel>
        <JournalInlineTags
          tagIdsDraft={values.tagIds}
          onTagIdsDraftChange={(tagIds) => update({ tagIds })}
          disabled={disabled}
        />
      </div>

      <div>
        <FieldLabel>Entry</FieldLabel>
        <AutoSizeTextarea
          value={values.content}
          disabled={disabled}
          placeholder="Write your journal entry…"
          onChange={(event) => update({ content: event.target.value })}
          className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          rows={8}
        />
      </div>

      {(onQueueUploads || onQueueMediaSelections || media.length > 0) && (
        <EntityMediaCarousel
          media={media}
          pendingUploads={pendingUploads}
          pendingMediaSelections={pendingMediaSelections}
          onQueueUploads={onQueueUploads}
          onQueueMediaSelections={onQueueMediaSelections}
          onRemovePending={onRemovePendingUpload}
          onRemovePendingMedia={onRemovePendingMedia}
          onDeleteMedia={onDeleteMedia}
          disabled={disabled}
          pageFileDragActive={pageFileDragActive}
        />
      )}

      {showDelete && onDelete ? (
        <div className="border-t border-stone-800 pt-8">
          <ConfirmTrashButton
            onConfirm={onDelete}
            disabled={deleteDisabled}
            ariaLabel="Delete journal entry"
            className="inline-flex"
          />
        </div>
      ) : null}
    </div>
  );
}

export function emptyJournalEntryFormValues(): JournalEntryFormValues {
  return {
    entryDate: todayDateInputValue(),
    content: "",
    tagIds: [],
  };
}

export function journalEntryToFormValues(
  entry: Pick<JournalEntry, "entry_date" | "content" | "tags">,
): JournalEntryFormValues {
  return {
    entryDate: entry.entry_date,
    content: entry.content,
    tagIds: entry.tags.map((tag) => tag.id),
  };
}

export function formValuesToCreatePayload(values: JournalEntryFormValues) {
  return {
    entry_date: values.entryDate,
    content: values.content.trim(),
    tag_ids: values.tagIds,
  };
}

export function formValuesToUpdatePayload(values: JournalEntryFormValues) {
  return {
    entry_date: values.entryDate,
    content: values.content.trim(),
    tag_ids: values.tagIds,
  };
}

export function isJournalFormValid(values: JournalEntryFormValues): boolean {
  return values.content.trim().length > 0 && values.entryDate.length > 0;
}
