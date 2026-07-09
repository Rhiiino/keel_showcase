// keel_web/src/modules/timeline/pages/TimelineEventPage.tsx

import { useNavigate, useParams } from "react-router-dom";

import { useEditorRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { TimelineEventEditorPanel } from "../components/forms/TimelineEventEditorPanel";
import { FormPageLayout } from "../../../views";
import { useTimelineEventEditor } from "../hooks/useTimelineEventEditor";

export function TimelineEventPage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const editor = useTimelineEventEditor(eventId, {
    onDeleteSuccess: () => navigate("/timeline"),
  });

  const redirecting = useEditorRecordNotFoundRedirect(editor, {
    listPath: "/timeline",
    notice: "That timeline event could not be found.",
  });

  if (redirecting || editor.isLoading) {
    return (
      <FormPageLayout backHref="/timeline" backLabel="Back to timeline">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  return (
    <TimelineEventEditorPanel
      layout="page"
      values={editor.values}
      contacts={editor.contacts}
      figures={editor.figures}
      media={editor.media}
      pendingUploads={editor.pendingUploads}
      pendingMediaSelections={editor.pendingMediaSelections}
      isReady={editor.isReady}
      isDirty={editor.isDirty}
      pending={editor.pending}
      canSave={editor.canSave}
      saveError={editor.saveError}
      errorMessage={editor.errorMessage}
      pageFileDragActive={editor.pageFileDragActive}
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
  );
}
