// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakItemNodeBodyEditor.tsx

import { useCallback, useEffect, useRef, useState } from "react";

import type { CoakItem } from "../../../../api";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useAutoResizeTextarea } from "../../../../hooks/tabs/constellation/useAutoResizeTextarea";
import {
  COAK_ITEM_EDITOR_SECTION_LABEL_CLASS,
  COAK_ITEM_EDITOR_TEXTAREA_CLASS,
} from "../../../../lib/tabs/constellation/coakItemEditorStyles";

type CoakItemNodeBodyEditorProps = {
  item: CoakItem;
  disabled?: boolean;
  open?: boolean;
  shouldFocus?: boolean;
  showSectionLabel?: boolean;
  ariaLabel?: string;
  placeholder?: string;
};

export function CoakItemNodeBodyEditor({
  item,
  disabled,
  open = true,
  shouldFocus = false,
  showSectionLabel = true,
  ariaLabel = "Node body",
  placeholder = "Write node body…",
}: CoakItemNodeBodyEditorProps) {
  const { updateNoteBody, isNodeSearchActive } = useCoakRecordWorkspace();
  const [draftBody, setDraftBody] = useState(item.note_body);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraftBody(item.note_body);
  }, [item.id, item.note_body]);

  useEffect(() => {
    if (!open || !shouldFocus || isNodeSearchActive) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      bodyTextareaRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isNodeSearchActive, item.id, open, shouldFocus]);

  const commitBody = useCallback(async () => {
    if (draftBody === item.note_body) {
      return;
    }
    await updateNoteBody(item.id, draftBody);
  }, [draftBody, item.id, item.note_body, updateNoteBody]);

  useAutoResizeTextarea(bodyTextareaRef, draftBody);

  return (
    <div className={showSectionLabel ? "min-h-0" : undefined}>
      {showSectionLabel ? (
        <p className={COAK_ITEM_EDITOR_SECTION_LABEL_CLASS}>Node body</p>
      ) : null}
      <textarea
        ref={bodyTextareaRef}
        value={draftBody}
        disabled={disabled}
        onChange={(event) => setDraftBody(event.target.value)}
        onBlur={() => {
          void commitBody();
        }}
        aria-label={ariaLabel}
        placeholder={placeholder}
        rows={1}
        className={COAK_ITEM_EDITOR_TEXTAREA_CLASS}
      />
    </div>
  );
}
