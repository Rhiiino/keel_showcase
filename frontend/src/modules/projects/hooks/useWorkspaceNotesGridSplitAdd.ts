// keel_web/src/modules/projects/hooks/useWorkspaceNotesGridSplitAdd.ts

// Split-add a new note tile in the workspace notes grid without growing the container.

import { useCallback } from "react";

import { computeSplitPlacements, type SplitZone } from "../../media/lib/panelGridSplit";
import type { WorkspaceNotesGridPlacement } from "../lib/workspace/note/workspaceNotesGridLayout";

type UseWorkspaceNotesGridSplitAddOptions = {
  placements: WorkspaceNotesGridPlacement[];
  onCreateNote: () => string;
  onPersist: (placements: WorkspaceNotesGridPlacement[]) => void;
  onFocusNewNote: (noteId: string) => void;
};

export function useWorkspaceNotesGridSplitAdd({
  placements,
  onCreateNote,
  onPersist,
  onFocusNewNote,
}: UseWorkspaceNotesGridSplitAddOptions) {
  const handleSplitAdd = useCallback(
    (sourceId: string, zone: SplitZone) => {
      const source = placements.find((item) => item.id === sourceId);
      if (!source) {
        return;
      }

      const split = computeSplitPlacements(source, zone);
      if (!split) {
        return;
      }

      const newNoteId = onCreateNote();
      const nextPlacements: WorkspaceNotesGridPlacement[] = [
        ...placements.map((item) =>
          item.id === sourceId ? { ...split.existing, id: sourceId } : item,
        ),
        { ...split.newSlot, id: newNoteId },
      ];

      onPersist(nextPlacements);
      onFocusNewNote(newNoteId);
    },
    [onCreateNote, onFocusNewNote, onPersist, placements],
  );

  return { handleSplitAdd };
}
