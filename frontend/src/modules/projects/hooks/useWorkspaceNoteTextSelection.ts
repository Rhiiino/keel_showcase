// keel_web/src/modules/projects/hooks/useWorkspaceNoteTextSelection.ts

// Tracks non-empty textarea selections and positions a floating formatting toolbar.

import { useCallback, useEffect, useState, type RefObject } from "react";

import {
  detectSelectionMarkdownFormats,
  getTextareaSelectionRect,
  hasNonEmptyTextRange,
  type WorkspaceNoteSelectionFormats,
  type WorkspaceNoteTextRange,
} from "../lib/workspace/note";

export type WorkspaceNoteTextSelectionState = WorkspaceNoteTextRange & {
  rect: DOMRect;
  formats: WorkspaceNoteSelectionFormats;
};

type UseWorkspaceNoteTextSelectionOptions = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  enabled: boolean;
  suppressed?: boolean;
};

type UseWorkspaceNoteTextSelectionResult = {
  selection: WorkspaceNoteTextSelectionState | null;
  refreshSelection: () => void;
  clearSelection: () => void;
};

export function useWorkspaceNoteTextSelection({
  textareaRef,
  text,
  enabled,
  suppressed = false,
}: UseWorkspaceNoteTextSelectionOptions): UseWorkspaceNoteTextSelectionResult {
  const [selection, setSelection] = useState<WorkspaceNoteTextSelectionState | null>(null);

  const refreshSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setSelection(null);
      return;
    }

    const isEditing = enabled || textarea === document.activeElement;
    if (!isEditing || suppressed) {
      setSelection(null);
      return;
    }

    const range: WorkspaceNoteTextRange = {
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0,
    };

    if (!hasNonEmptyTextRange(range)) {
      setSelection(null);
      return;
    }

    const rect = getTextareaSelectionRect(textarea, range.start, range.end);
    if (!rect) {
      setSelection(null);
      return;
    }

    setSelection((current) => {
      const next: WorkspaceNoteTextSelectionState = {
        ...range,
        rect,
        formats: detectSelectionMarkdownFormats(text, range),
      };

      if (
        current &&
        current.start === next.start &&
        current.end === next.end &&
        current.formats.bold === next.formats.bold &&
        current.formats.italic === next.formats.italic &&
        current.formats.strikethrough === next.formats.strikethrough &&
        current.formats.colorHex === next.formats.colorHex &&
        current.rect.left === next.rect.left &&
        current.rect.top === next.rect.top &&
        current.rect.width === next.rect.width &&
        current.rect.height === next.rect.height
      ) {
        return current;
      }

      return next;
    });
  }, [enabled, suppressed, text, textareaRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    if (!enabled || suppressed) {
      setSelection(null);
    }
  }, [enabled, suppressed]);

  useEffect(() => {
    if (!selection) {
      return;
    }

    let frameId = 0;
    const trackPosition = () => {
      refreshSelection();
      frameId = window.requestAnimationFrame(trackPosition);
    };

    frameId = window.requestAnimationFrame(trackPosition);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [refreshSelection, selection?.end, selection?.start]);

  return {
    selection,
    refreshSelection,
    clearSelection,
  };
}
