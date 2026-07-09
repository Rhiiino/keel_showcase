// keel_web/src/modules/email/components/EmailAccountSettingsModal.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { InlineSaveDiscardActions } from "../../../components/InlineSaveDiscardActions";
import { useEmailAccountEditor } from "../hooks/useEmailAccountEditor";
import { EmailAccountForm } from "./EmailAccountForm";

type EmailAccountSettingsModalProps = {
  accountId: number | string;
  open: boolean;
  onClose: () => void;
  onDeleteSuccess?: () => void;
};

export function EmailAccountSettingsModal({
  accountId,
  open,
  onClose,
  onDeleteSuccess,
}: EmailAccountSettingsModalProps) {
  const editor = useEmailAccountEditor(accountId, {
    enabled: open,
    onDeleteSuccess,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editor.isDirty) {
          editor.handleDiscard();
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editor, onClose, open]);

  if (!open) {
    return null;
  }

  const handleDiscard = () => {
    editor.handleDiscard();
    onClose();
  };

  const handleSave = async () => {
    await editor.save();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-account-settings-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <div className="min-w-0">
            <h2 id="email-account-settings-title" className="text-lg font-medium text-stone-100">
              Account settings
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Update account details or manage Gmail connection.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-stone-700 px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-900"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {editor.isLoading ? (
            <p className="text-sm text-stone-500">Loading account…</p>
          ) : null}
          {editor.isError || !editor.values || !editor.account ? (
            <p className="text-sm text-red-400">
              {editor.errorMessage ?? "Email account not found."}
            </p>
          ) : (
            <EmailAccountForm
              values={editor.values}
              onChange={editor.setValues}
              disabled={editor.pending}
              account={editor.account}
              showDelete
              onDelete={() => void editor.deleteAccount()}
              deleteDisabled={editor.pending}
            />
          )}
        </div>

        {editor.values && editor.account ? (
          <div className="flex items-center justify-end gap-2 border-t border-stone-800 px-5 py-4">
            <InlineSaveDiscardActions
              visible={editor.isDirty}
              onDiscard={handleDiscard}
              onSave={() => void handleSave()}
              isSaving={editor.isSaving}
              canSave={editor.canSave}
              saveError={editor.saveError}
            />
            {!editor.isDirty ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-stone-400 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-200"
              >
                Done
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
