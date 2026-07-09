// keel_web/src/modules/timeline/components/calendar/TimelineEventEditModal.tsx

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { TimelineEventEditorPanel } from "../forms/TimelineEventEditorPanel";
import { useTimelineEventEditor } from "../../hooks/useTimelineEventEditor";

type TimelineEventEditModalProps = {
  eventId: number | null;
  onClose: () => void;
};

export function TimelineEventEditModal({ eventId, onClose }: TimelineEventEditModalProps) {
  const editor = useTimelineEventEditor(eventId, {
    enabled: eventId != null,
    onDeleteSuccess: onClose,
  });

  const handleClose = useCallback(() => {
    editor.resetPendingUploads();
    onClose();
  }, [editor.resetPendingUploads, onClose]);

  useEffect(() => {
    if (eventId == null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [eventId, handleClose]);

  if (eventId == null) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={handleClose}
    >
      <button
        type="button"
        aria-label="Close event editor"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit event: ${editor.eventDescription}`}
        className="relative z-10 flex max-h-[min(90vh,56rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TimelineEventEditorPanel
            layout="modal"
            values={editor.values}
            contacts={editor.contacts}
            figures={editor.figures}
            media={editor.media}
            pendingUploads={editor.pendingUploads}
            pendingMediaSelections={editor.pendingMediaSelections}
            isLoading={editor.isLoading}
            isError={editor.isError}
            isReady={editor.isReady}
            isDirty={editor.isDirty}
            pending={editor.pending}
            canSave={editor.canSave}
            saveError={editor.saveError}
            errorMessage={editor.errorMessage}
            pageFileDragActive={editor.pageFileDragActive}
            onClose={handleClose}
            onChange={editor.setValues}
            onDiscard={editor.handleDiscard}
            onSave={editor.save}
            isSaving={editor.isSaving}
            onDelete={editor.deleteEvent}
            onQueueUploads={editor.queueUploads}
            onQueueMediaSelections={editor.queueMediaSelections}
            onRemovePendingUpload={editor.removePendingUpload}
            onRemovePendingMedia={editor.removePendingMedia}
            onDeleteMedia={(attachmentId) => {
              void editor.handleDeleteMedia(attachmentId);
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
