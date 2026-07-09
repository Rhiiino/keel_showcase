// keel_web/src/modules/projects/hooks/useWorkspaceRowInlineRename.ts

// Inline rename state for workspace file and folder list rows.

import { useEffect, useRef, useState } from "react";

type UseWorkspaceRowInlineRenameOptions = {
  value: string;
  onCommit: (name: string) => void;
  disabled?: boolean;
  autoEdit?: boolean;
  onAutoEditHandled?: () => void;
};

export function useWorkspaceRowInlineRename({
  value,
  onCommit,
  disabled = false,
  autoEdit = false,
  onAutoEditHandled,
}: UseWorkspaceRowInlineRenameOptions) {
  const [draftName, setDraftName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = draftName !== null;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!autoEdit || disabled) {
      return;
    }
    setDraftName(value);
    onAutoEditHandled?.();
    // Only react when autoEdit is requested for this row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEdit]);

  const startEditing = () => {
    if (disabled) {
      return;
    }
    setDraftName(value);
  };

  const discardEdit = () => {
    setDraftName(null);
  };

  const commitEdit = () => {
    if (draftName === null) {
      return;
    }
    const nextName = draftName.trim();
    setDraftName(null);
    if (!nextName || nextName === value) {
      return;
    }
    onCommit(nextName);
  };

  return {
    isEditing,
    draftName,
    setDraftName,
    inputRef,
    startEditing,
    discardEdit,
    commitEdit,
  };
}
