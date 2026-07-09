// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceNoteReferenceModal.tsx

// Full-screen editable preview for a referenced workspace note card.

import { useStore } from "@xyflow/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { resolveWorkspaceNoteNode } from "../../../lib/workspace/note";
import type { WorkspaceNoteData } from "../../../lib/workspace";
import type { WorkspaceNoteReferenceOrigin } from "../context/WorkspaceCanvasContext";
import { WorkspaceEditableNoteCard } from "./WorkspaceEditableNoteCard";
import {
  workspaceNoteReferenceBackdropTransition,
  workspaceNoteReferenceCardTransition,
  workspaceNoteReferenceCardVariants,
} from "./workspaceNoteReferenceMotion";

type WorkspaceNoteReferenceModalProps = {
  noteId: string;
  origin: WorkspaceNoteReferenceOrigin | null;
  onClose: () => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function WorkspaceNoteReferenceModal({
  noteId,
  origin,
  onClose,
}: WorkspaceNoteReferenceModalProps) {
  const reducedMotion = usePrefersReducedMotion();
  const cardVariants = useMemo(
    () => workspaceNoteReferenceCardVariants(origin, reducedMotion),
    [origin, reducedMotion],
  );
  const cardTransition = useMemo(
    () => workspaceNoteReferenceCardTransition(reducedMotion),
    [reducedMotion],
  );

  const targetNode = useStore((state) => resolveWorkspaceNoteNode(state.nodes, noteId));

  const handleClose = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
    window.requestAnimationFrame(() => {
      onClose();
    });
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, [contenteditable='true']")
      ) {
        return;
      }
      handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  if (!targetNode) {
    return null;
  }

  const data = targetNode.data as WorkspaceNoteData;
  const title = (data.title ?? "").trim() || "Note";
  const canvasNodeWidth =
    typeof targetNode.width === "number" && targetNode.width > 0
      ? targetNode.width
      : typeof targetNode.style?.width === "number" && targetNode.style.width > 0
        ? targetNode.style.width
        : 280;

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden bg-black/85 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Note: ${title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={workspaceNoteReferenceBackdropTransition()}
      onClick={handleClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-6 top-6 z-[101] rounded-md bg-stone-900/80 px-3 py-1.5 text-sm text-stone-200 ring-1 ring-stone-700 hover:bg-stone-800"
        >
          Close
        </button>

        <motion.div
          className="nodrag nopan w-fit max-h-[calc(100vh-3rem)] max-w-[calc(100vw-3rem)]"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={cardTransition}
        >
          <WorkspaceEditableNoteCard
            noteId={noteId}
            data={data}
            minWidth={canvasNodeWidth}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
