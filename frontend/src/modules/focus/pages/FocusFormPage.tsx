// keel_web/src/modules/focus/pages/FocusFormPage.tsx

// Individual focus list create/edit/view form page.

import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppShellContent } from "../../../app/shell/AppShellContent";
import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FocusListCreateEditor } from "../components/forms/editors";
import { FocusListEditor } from "../components/forms/editors";
import type { FocusListEditorHandle } from "../components/forms/editors";

const UNSAVED_FOCUS_FORM_MESSAGE =
  "You have unsaved Focus changes. Discard them and leave this form?";

export function FocusFormPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<FocusListEditorHandle>(null);
  const isCreateMode = listId === "new";
  const parsedListId = Number(listId);
  const invalidListId = !isCreateMode && (!Number.isFinite(parsedListId) || parsedListId <= 0);

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidListId,
    listPath: "/focus",
    notice: "That focus list could not be found.",
  });

  const handleBackToFocus = () => {
    if (!(editorRef.current?.isFormDirty() ?? false)) {
      navigate("/focus");
      return;
    }

    if (window.confirm(UNSAVED_FOCUS_FORM_MESSAGE)) {
      editorRef.current?.discardForm();
      navigate("/focus");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!(editorRef.current?.isFormDirty() ?? false)) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (redirecting) {
    return null;
  }

  return (
    <AppShellContent>
      <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-6 px-6 py-8">
        <button
          type="button"
          onClick={handleBackToFocus}
          className="self-start text-xs text-white/40 hover:text-white/65"
        >
          ← Back to Focus
        </button>

        {isCreateMode ? (
          <FocusListCreateEditor ref={editorRef} />
        ) : (
          <FocusListEditor ref={editorRef} listId={parsedListId} />
        )}
      </div>
    </AppShellContent>
  );
}
