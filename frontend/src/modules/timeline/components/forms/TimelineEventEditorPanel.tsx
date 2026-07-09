// keel_web/src/modules/timeline/components/forms/TimelineEventEditorPanel.tsx

import type { ReactNode } from "react";

import { FormPageLayout } from "../../../../views";
import { InlineSaveDiscardActions } from "../../../../components/InlineSaveDiscardActions";
import {
  TimelineEventForm,
  type TimelineEventFormValues,
} from "./TimelineEventForm";
import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineEventGalleryEntry } from "../../api";
import {
  type PendingMediaSelection,
  type PendingUpload,
} from "../TimelineMediaCarousel";

type TimelineEventEditorPanelProps = {
  layout: "page" | "modal";
  modalTitle?: string;
  showDelete?: boolean;
  values: TimelineEventFormValues | null;
  contacts: Contact[];
  figures: Figure[];
  media: TimelineEventGalleryEntry[];
  pendingUploads: PendingUpload[];
  pendingMediaSelections: PendingMediaSelection[];
  isLoading?: boolean;
  isError?: boolean;
  isReady?: boolean;
  isDirty?: boolean;
  pending?: boolean;
  canSave?: boolean;
  saveError?: string | null;
  errorMessage?: string | null;
  pageFileDragActive?: boolean;
  backHref?: string;
  onClose?: () => void;
  onChange: (values: TimelineEventFormValues) => void;
  onDiscard?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  onDelete?: () => void;
  onQueueUploads?: (files: FileList | File[]) => void;
  onQueueMediaSelections?: (media: PendingMediaSelection["media"][]) => void;
  onRemovePendingUpload?: (clientId: string) => void;
  onRemovePendingMedia?: (clientId: string) => void;
  onDeleteMedia?: (attachmentId: number) => void;
  headerAction?: ReactNode;
};

export function TimelineEventEditorPanel({
  layout,
  modalTitle = "Edit event",
  showDelete = true,
  values,
  contacts,
  figures,
  media,
  pendingUploads,
  pendingMediaSelections,
  isLoading = false,
  isError = false,
  isReady = false,
  isDirty = false,
  pending = false,
  canSave = true,
  saveError = null,
  errorMessage = null,
  pageFileDragActive = false,
  backHref = "/timeline",
  onClose,
  onChange,
  onDiscard,
  onSave,
  isSaving = false,
  onDelete,
  onQueueUploads,
  onQueueMediaSelections,
  onRemovePendingUpload,
  onRemovePendingMedia,
  onDeleteMedia,
  headerAction,
}: TimelineEventEditorPanelProps) {
  const showSaveDiscard = isDirty && onDiscard && onSave;

  const header = layout === "page" ? null : (
    <header className="flex items-center justify-between gap-4 border-b border-stone-800 px-5 py-4">
      <h2 className="text-lg font-semibold text-stone-50">{modalTitle}</h2>
      <div className="flex items-center gap-2">
        {showSaveDiscard ? (
          <InlineSaveDiscardActions
            visible
            onDiscard={onDiscard}
            onSave={onSave}
            isSaving={isSaving}
            canSave={canSave}
            saveError={saveError}
          />
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-sm text-stone-400 transition hover:bg-stone-800 hover:text-stone-200"
          >
            Close
          </button>
        ) : null}
      </div>
    </header>
  );

  const body = (() => {
    if (isLoading) {
      return <p className="text-sm text-stone-500">Loading…</p>;
    }
    if (isError || !isReady || !values) {
      return (
        <p className="text-sm text-stone-500">
          {errorMessage ?? "Timeline event not found."}
        </p>
      );
    }

    return (
      <TimelineEventForm
        values={values}
        contacts={contacts}
        figures={figures}
        onChange={onChange}
        disabled={pending}
        showDelete={showDelete}
        onDelete={onDelete}
        deleteDisabled={pending}
        media={media}
        pendingUploads={pendingUploads}
        pendingMediaSelections={pendingMediaSelections}
        onQueueUploads={onQueueUploads}
        onQueueMediaSelections={onQueueMediaSelections}
        onRemovePendingUpload={onRemovePendingUpload}
        onRemovePendingMedia={onRemovePendingMedia}
        onDeleteMedia={onDeleteMedia}
        pageFileDragActive={pageFileDragActive}
      />
    );
  })();

  if (layout === "page") {
    return (
      <FormPageLayout
        backHref={backHref}
        backLabel="Back to timeline"
        isDirty={isDirty}
        onDiscard={onDiscard}
        onSave={onSave}
        isSaving={isSaving}
        canSave={canSave}
        saveError={saveError}
        headerAction={headerAction}
        errorMessage={errorMessage && isReady ? errorMessage : null}
      >
        {body}
      </FormPageLayout>
    );
  }

  return (
    <>
      {header}
      <div className="px-5 py-5">{body}</div>
      {errorMessage && isReady ? (
        <p className="px-5 pb-5 text-sm text-red-400">{errorMessage}</p>
      ) : null}
    </>
  );
}
