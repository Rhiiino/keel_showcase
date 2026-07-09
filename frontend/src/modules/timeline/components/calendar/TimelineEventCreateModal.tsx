// keel_web/src/modules/timeline/components/calendar/TimelineEventCreateModal.tsx

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { TimelineEventEditorPanel } from "../forms/TimelineEventEditorPanel";
import { useTimelineEventCreator } from "../../hooks/useTimelineEventCreator";

type TimelineEventCreateModalProps = {
  open: boolean;
  initialStartDate: string | null;
  onClose: () => void;
};

export function TimelineEventCreateModal({
  open,
  initialStartDate,
  onClose,
}: TimelineEventCreateModalProps) {
  const creator = useTimelineEventCreator({
    enabled: open,
    initialStartDate,
    onCreateSuccess: onClose,
  });

  const handleClose = useCallback(() => {
    creator.resetPendingUploads();
    onClose();
  }, [creator.resetPendingUploads, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  if (!open) {
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
        aria-label="Close event creator"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New timeline event"
        className="relative z-10 flex max-h-[min(90vh,56rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TimelineEventEditorPanel
            layout="modal"
            modalTitle="New event"
            showDelete={false}
            values={creator.values}
            contacts={creator.contacts}
            figures={creator.figures}
            media={creator.media}
            pendingUploads={creator.pendingUploads}
            pendingMediaSelections={creator.pendingMediaSelections}
            isLoading={creator.isLoading}
            isError={creator.isError}
            isReady={creator.isReady}
            isDirty={creator.isDirty}
            pending={creator.pending}
            canSave={creator.canSave}
            saveError={creator.saveError}
            errorMessage={creator.errorMessage}
            pageFileDragActive={creator.pageFileDragActive}
            onClose={handleClose}
            onChange={creator.setValues}
            onDiscard={creator.handleDiscard}
            onSave={creator.save}
            isSaving={creator.isSaving}
            onQueueUploads={creator.queueUploads}
            onQueueMediaSelections={creator.queueMediaSelections}
            onRemovePendingUpload={creator.removePendingUpload}
            onRemovePendingMedia={creator.removePendingMedia}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
