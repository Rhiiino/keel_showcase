// keel_web/src/modules/projects/hooks/useWorkspaceNoteRefPicker.ts

// Detects `@` mention sessions in a note textarea and inserts wiki-link tokens.

import { useReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useState, type RefObject } from "react";

import {
  detectWorkspaceNoteRefMention,
  insertWorkspaceNoteRefToken,
  listWorkspaceNoteRefCandidates,
  type WorkspaceNoteRefCandidate,
  type WorkspaceNoteRefMentionSession,
} from "../lib/workspace/note";
import { resolveNoteColors } from "../lib/workspace/node";

type UseWorkspaceNoteRefPickerOptions = {
  noteId: string;
  text: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onTextChange: (nextText: string) => void;
};

type UseWorkspaceNoteRefPickerResult = {
  open: boolean;
  session: WorkspaceNoteRefMentionSession | null;
  candidates: WorkspaceNoteRefCandidate[];
  activeIndex: number;
  updateFromCursor: (cursor: number) => void;
  selectCandidate: (candidateId: string) => void;
  moveActiveIndex: (delta: number) => void;
  dismiss: () => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

export function useWorkspaceNoteRefPicker({
  noteId,
  text,
  textareaRef,
  onTextChange,
}: UseWorkspaceNoteRefPickerOptions): UseWorkspaceNoteRefPickerResult {
  const { getNodes } = useReactFlow();
  const [session, setSession] = useState<WorkspaceNoteRefMentionSession | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const candidates = useMemo(() => {
    if (!session) {
      return [];
    }

    return listWorkspaceNoteRefCandidates(getNodes(), {
      excludeNoteId: noteId,
      query: session.query,
    }).map((candidate) => {
      const { border } = resolveNoteColors(candidate.borderColor);
      return { ...candidate, borderColor: border };
    });
  }, [getNodes, noteId, session]);

  const open = session !== null && candidates.length > 0;

  const dismiss = useCallback(() => {
    setSession(null);
    setActiveIndex(0);
  }, []);

  const updateFromCursor = useCallback(
    (cursor: number) => {
      const nextSession = detectWorkspaceNoteRefMention(text, cursor);
      setSession(nextSession);
      setActiveIndex(0);
    },
    [text],
  );

  const selectCandidate = useCallback(
    (candidateId: string) => {
      if (!session) {
        return;
      }

      const { nextText, cursor } = insertWorkspaceNoteRefToken(text, session, candidateId);
      onTextChange(nextText);
      dismiss();

      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [dismiss, onTextChange, session, text, textareaRef],
  );

  const moveActiveIndex = useCallback(
    (delta: number) => {
      if (candidates.length === 0) {
        return;
      }
      setActiveIndex((current) => {
        const next = current + delta;
        if (next < 0) {
          return candidates.length - 1;
        }
        if (next >= candidates.length) {
          return 0;
        }
        return next;
      });
    },
    [candidates.length],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!open || !session) {
        return false;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActiveIndex(1);
        return true;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveIndex(-1);
        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const candidate = candidates[activeIndex];
        if (candidate) {
          selectCandidate(candidate.id);
        }
        return true;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return true;
      }

      return false;
    },
    [activeIndex, candidates, dismiss, moveActiveIndex, open, selectCandidate, session],
  );

  return {
    open,
    session,
    candidates,
    activeIndex,
    updateFromCursor,
    selectCandidate,
    moveActiveIndex,
    dismiss,
    handleKeyDown,
  };
}
