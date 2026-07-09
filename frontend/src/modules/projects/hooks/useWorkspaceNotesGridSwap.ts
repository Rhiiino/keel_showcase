// keel_web/src/modules/projects/hooks/useWorkspaceNotesGridSwap.ts

// Two-step panel swap mode for the workspace notes grid overlay.

import { useCallback, useState } from "react";

import {
  swapNotesGridPlacements,
  type WorkspaceNotesGridPlacement,
} from "../lib/workspace/note/workspaceNotesGridLayout";

type UseWorkspaceNotesGridSwapOptions = {
  onPersist: (placements: WorkspaceNotesGridPlacement[]) => void;
};

export function useWorkspaceNotesGridSwap({ onPersist }: UseWorkspaceNotesGridSwapOptions) {
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

  const startSwap = useCallback((noteId: string) => {
    setSwapSourceId(noteId);
    setHoverTargetId(null);
  }, []);

  const cancelSwap = useCallback(() => {
    setSwapSourceId(null);
    setHoverTargetId(null);
  }, []);

  const completeSwap = useCallback(
    (placements: WorkspaceNotesGridPlacement[], targetId: string) => {
      if (!swapSourceId || swapSourceId === targetId) {
        return;
      }

      const swapped = swapNotesGridPlacements(placements, swapSourceId, targetId);
      onPersist(swapped);
      setSwapSourceId(null);
      setHoverTargetId(null);
    },
    [onPersist, swapSourceId],
  );

  return {
    swapSourceId,
    hoverTargetId,
    isSwapMode: swapSourceId !== null,
    startSwap,
    cancelSwap,
    completeSwap,
    setHoverTargetId,
  };
}
