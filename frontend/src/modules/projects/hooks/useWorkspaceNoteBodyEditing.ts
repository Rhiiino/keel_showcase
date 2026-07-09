// keel_web/src/modules/projects/hooks/useWorkspaceNoteBodyEditing.ts

// Note body draft state, formatting toolbar, and context-menu actions for canvas note cards.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  formatWorkspaceNoteRefToken,
  insertMarkdownCheckboxAtLine,
  insertMarkdownSeparatorAtLine,
  replaceTextRange,
  toggleMarkdownTaskItemAtLine,
  type WorkspaceNoteTextRange,
} from "../lib/workspace/note";
import { buildWorkspaceNoteBodyContextMenuActions } from "../components/workspace/nodes/workspaceNoteBodyContextMenuActions";
import { buildWorkspaceNoteBodySelectionActions } from "../components/workspace/nodes/workspaceNoteBodySelectionActions";
import {
  useWorkspaceCreateLinkedNote,
  useWorkspaceRequestSave,
} from "../components/workspace/context/WorkspaceCanvasContext";
import { useWorkspaceNoteRefPicker } from "./useWorkspaceNoteRefPicker";
import { useWorkspaceNoteTextSelection } from "./useWorkspaceNoteTextSelection";

type UseWorkspaceNoteBodyEditingOptions = {
  noteId: string;
  bodyText: string;
  selected: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  updateNodeData: (id: string, data: { text: string }) => void;
};

export function useWorkspaceNoteBodyEditing({
  noteId,
  bodyText,
  selected,
  textareaRef,
  updateNodeData,
}: UseWorkspaceNoteBodyEditingOptions) {
  const requestSave = useWorkspaceRequestSave();
  const createLinkedNote = useWorkspaceCreateLinkedNote();
  const [bodyDraft, setBodyDraft] = useState(bodyText ?? "");
  const [bodyFocused, setBodyFocused] = useState(false);
  const [bodyContextMenu, setBodyContextMenu] = useState<{
    clientX: number;
    clientY: number;
    cursor: number;
  } | null>(null);
  const bodyFocusedRef = useRef(false);

  const noteRefPicker = useWorkspaceNoteRefPicker({
    noteId,
    text: bodyDraft,
    textareaRef,
    onTextChange: setBodyDraft,
  });

  const textSelection = useWorkspaceNoteTextSelection({
    textareaRef,
    text: bodyDraft,
    enabled: bodyFocused,
    suppressed: noteRefPicker.open,
  });

  useEffect(() => {
    if (!bodyFocusedRef.current) {
      setBodyDraft(bodyText ?? "");
    }
  }, [bodyText]);

  const commitBody = useCallback(
    (value: string) => {
      if (value === bodyText) {
        return;
      }
      updateNodeData(noteId, { text: value });
      requestSave();
    },
    [bodyText, noteId, requestSave, updateNodeData],
  );

  const releaseBodyFocus = useCallback(() => {
    bodyFocusedRef.current = false;
    setBodyFocused(false);
    textareaRef.current?.blur();
  }, [textareaRef]);

  const focusBody = useCallback(() => {
    if (!selected) {
      return;
    }
    bodyFocusedRef.current = true;
    setBodyFocused(true);
  }, [selected]);

  useEffect(() => {
    if (!bodyFocused) {
      return;
    }
    textareaRef.current?.focus();
  }, [bodyFocused, textareaRef]);

  const applyBodyTextEdit = useCallback(
    (nextText: string, nextCursor: number) => {
      const textarea = textareaRef.current;
      setBodyDraft(nextText);
      noteRefPicker.dismiss();
      textSelection.clearSelection();

      if (nextText !== bodyText) {
        updateNodeData(noteId, { text: nextText });
        requestSave();
      }

      requestAnimationFrame(() => {
        textarea?.focus();
        textarea?.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [bodyText, noteId, noteRefPicker, requestSave, textSelection, textareaRef, updateNodeData],
  );

  const handleAddSeparator = useCallback(
    (cursor: number) => {
      const { nextText, nextCursor } = insertMarkdownSeparatorAtLine(bodyDraft, cursor);
      applyBodyTextEdit(nextText, nextCursor);
    },
    [applyBodyTextEdit, bodyDraft],
  );

  const handleAddCheckbox = useCallback(
    (cursor: number) => {
      const { nextText, nextCursor } = insertMarkdownCheckboxAtLine(bodyDraft, cursor);
      applyBodyTextEdit(nextText, nextCursor);
    },
    [applyBodyTextEdit, bodyDraft],
  );

  const handleToggleTaskLine = useCallback(
    (lineIndex: number) => {
      const result = toggleMarkdownTaskItemAtLine(bodyDraft, lineIndex);
      if (!result) {
        return;
      }

      setBodyDraft(result.nextText);
      if (result.nextText !== bodyText) {
        updateNodeData(noteId, { text: result.nextText });
        requestSave();
      }
    },
    [bodyDraft, bodyText, noteId, requestSave, updateNodeData],
  );

  const applyBodySelectionEdit = useCallback(
    (
      recipe: (
        text: string,
        range: WorkspaceNoteTextRange,
      ) => { nextText: string; nextStart: number; nextEnd: number },
    ) => {
      if (!textSelection.selection) {
        return;
      }

      const range: WorkspaceNoteTextRange = {
        start: textSelection.selection.start,
        end: textSelection.selection.end,
      };
      const { nextText, nextStart, nextEnd } = recipe(bodyDraft, range);
      const textarea = textareaRef.current;

      setBodyDraft(nextText);
      noteRefPicker.dismiss();

      if (nextText !== bodyText) {
        updateNodeData(noteId, { text: nextText });
        requestSave();
      }

      requestAnimationFrame(() => {
        textarea?.focus();
        textarea?.setSelectionRange(nextStart, nextEnd);
        textSelection.refreshSelection();
      });
    },
    [
      bodyDraft,
      bodyText,
      noteId,
      noteRefPicker,
      requestSave,
      textSelection,
      textareaRef,
      updateNodeData,
    ],
  );

  const handleCreateNoteFromSelection = useCallback(() => {
    if (!textSelection.selection) {
      return;
    }

    const range: WorkspaceNoteTextRange = {
      start: textSelection.selection.start,
      end: textSelection.selection.end,
    };
    const selectedText = bodyDraft.slice(range.start, range.end).trim();
    if (!selectedText) {
      return;
    }

    const newNoteId = createLinkedNote(noteId, { title: selectedText });
    const token = formatWorkspaceNoteRefToken(newNoteId, selectedText);
    const { nextText, nextStart, nextEnd } = replaceTextRange(bodyDraft, range, token);
    const textarea = textareaRef.current;

    setBodyDraft(nextText);
    noteRefPicker.dismiss();
    textSelection.clearSelection();

    if (nextText !== bodyText) {
      updateNodeData(noteId, { text: nextText });
      requestSave();
    }

    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(nextStart, nextEnd);
    });
  }, [
    bodyDraft,
    bodyText,
    createLinkedNote,
    noteId,
    noteRefPicker,
    requestSave,
    textSelection,
    textareaRef,
    updateNodeData,
  ]);

  const openBodyContextMenu = useCallback((clientX: number, clientY: number, cursor: number) => {
    setBodyContextMenu({ clientX, clientY, cursor });
  }, []);

  const closeBodyContextMenu = useCallback(() => {
    setBodyContextMenu(null);
  }, []);

  const syncSelectionFromTextarea = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;

      if (end > start) {
        noteRefPicker.dismiss();
      } else {
        noteRefPicker.updateFromCursor(start);
      }

      textSelection.refreshSelection();
    },
    [noteRefPicker, textSelection],
  );

  const syncSelectionAfterPointer = useCallback(
    (textarea: HTMLTextAreaElement) => {
      requestAnimationFrame(() => {
        syncSelectionFromTextarea(textarea);
      });
    },
    [syncSelectionFromTextarea],
  );

  const bodyContextMenuActions = buildWorkspaceNoteBodyContextMenuActions({
    onAddSeparator: () => {
      if (bodyContextMenu) {
        handleAddSeparator(bodyContextMenu.cursor);
      }
    },
    onAddCheckbox: () => {
      if (bodyContextMenu) {
        handleAddCheckbox(bodyContextMenu.cursor);
      }
    },
  });

  const bodySelectionActions = buildWorkspaceNoteBodySelectionActions({
    onCreateNote: handleCreateNoteFromSelection,
  });

  return {
    bodyDraft,
    setBodyDraft,
    bodyFocused,
    bodyFocusedRef,
    bodyContextMenu,
    noteRefPicker,
    textSelection,
    commitBody,
    releaseBodyFocus,
    focusBody,
    openBodyContextMenu,
    closeBodyContextMenu,
    syncSelectionFromTextarea,
    syncSelectionAfterPointer,
    applyBodySelectionEdit,
    handleToggleTaskLine,
    bodyContextMenuActions,
    bodySelectionActions,
  };
}
