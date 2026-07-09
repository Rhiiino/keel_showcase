// keel_web/src/modules/journal/pages/JournalEntryPage.tsx

import { useNavigate, useParams } from "react-router-dom";

import { useEditorRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";
import { JournalEntryForm } from "../components/forms/JournalEntryForm";
import { useJournalEntryEditor } from "../hooks/useJournalEntryEditor";

export function JournalEntryPage() {
  const { entryId = "" } = useParams();
  const navigate = useNavigate();
  const editor = useJournalEntryEditor(entryId, {
    onDeleteSuccess: () => navigate("/journal"),
  });

  const redirecting = useEditorRecordNotFoundRedirect(editor, {
    listPath: "/journal",
    notice: "That journal entry could not be found.",
  });

  if (redirecting || editor.isLoading) {
    return (
      <FormPageLayout backHref="/journal" backLabel="Back to journal">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!editor.values) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/journal"
      backLabel="Back to journal"
      isDirty={editor.isDirty}
      onDiscard={editor.handleDiscard}
      onSave={editor.save}
      isSaving={editor.isSaving}
      canSave={editor.canSave}
      saveError={editor.saveError}
      errorMessage={editor.errorMessage && editor.isReady ? editor.errorMessage : null}
    >
      <JournalEntryForm
        values={editor.values}
        onChange={editor.setValues}
        disabled={editor.pending}
        showDelete
        onDelete={editor.deleteEntry}
        deleteDisabled={editor.pending}
        media={editor.media}
        pendingUploads={editor.pendingUploads}
        pendingMediaSelections={editor.pendingMediaSelections}
        onQueueUploads={editor.queueUploads}
        onQueueMediaSelections={editor.queueMediaSelections}
        onRemovePendingUpload={editor.removePendingUpload}
        onRemovePendingMedia={editor.removePendingMedia}
        onDeleteMedia={(attachmentId) => {
          void editor.handleDeleteMedia(attachmentId);
        }}
        pageFileDragActive={editor.pageFileDragActive}
      />
    </FormPageLayout>
  );
}
