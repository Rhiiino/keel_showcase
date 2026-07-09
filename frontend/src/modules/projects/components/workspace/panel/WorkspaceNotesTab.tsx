// keel_web/src/modules/projects/components/workspace/panel/WorkspaceNotesTab.tsx

// Notes tab: live note cards from the project workspace canvas.

import { useMemo } from "react";

import { useWorkspaceViewContext } from "../context/WorkspaceViewContext";
import { WorkspaceNoteListRow } from "./WorkspaceNoteListRow";

type WorkspaceNotesTabProps = {
  disabled?: boolean;
};

export function WorkspaceNotesTab({ disabled = false }: WorkspaceNotesTabProps) {
  const {
    workspaceNotes,
    selectedCanvasNoteIds,
    filesPanelFocusedNoteId,
    setFilesPanelFocusedNoteId,
    setFilesPanelFocusedMediaId,
    renameWorkspaceNote,
    deleteWorkspaceNote,
    toggleWorkspaceNoteVisibility,
  } = useWorkspaceViewContext();

  const highlightedNoteIds = useMemo(() => {
    const ids = new Set(selectedCanvasNoteIds);
    if (filesPanelFocusedNoteId !== null) {
      ids.add(filesPanelFocusedNoteId);
    }
    return ids;
  }, [filesPanelFocusedNoteId, selectedCanvasNoteIds]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 py-2"
      aria-label="Notes"
    >
      {workspaceNotes.length === 0 ? (
        <p className="px-2 py-4 text-center text-xs text-stone-500">
          No notes yet. Use + to add a note card.
        </p>
      ) : (
        <ul className="space-y-2 px-0.5">
          {workspaceNotes.map((note) => (
            <li key={note.id}>
              <WorkspaceNoteListRow
                note={note}
                highlighted={highlightedNoteIds.has(note.id)}
                disabled={disabled}
                onFocus={() => {
                  setFilesPanelFocusedMediaId(null);
                  setFilesPanelFocusedNoteId(note.id);
                }}
                onRename={(name) => renameWorkspaceNote(note.id, name)}
                onToggleVisibility={() => toggleWorkspaceNoteVisibility(note.id)}
                onDelete={() => deleteWorkspaceNote(note.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
