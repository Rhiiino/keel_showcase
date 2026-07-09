// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteRefPill.tsx

// Inline tag-style pill for a referenced workspace note in Markdown preview.

import { useStore } from "@xyflow/react";
import { type MouseEvent } from "react";

import {
  resolveWorkspaceNoteNode,
  resolveWorkspaceNoteRefLabel,
} from "../../../lib/workspace/note";
import { resolveNoteColors } from "../../../lib/workspace/node";
import { useWorkspaceOpenNoteReference } from "../context/WorkspaceCanvasContext";

type WorkspaceNoteRefPillProps = {
  noteId: string;
  alias?: string;
};

function WorkspaceNoteRefPaperclipIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0 opacity-85"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function WorkspaceNoteRefPill({ noteId, alias }: WorkspaceNoteRefPillProps) {
  const openNoteReference = useWorkspaceOpenNoteReference();
  const nodes = useStore((state) => state.nodes);

  const targetNode = resolveWorkspaceNoteNode(nodes, noteId);
  const label = resolveWorkspaceNoteRefLabel(targetNode, alias);
  const missing = targetNode === null;
  const { border, fill } = resolveNoteColors(targetNode?.data.color);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (missing) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    openNoteReference(noteId, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <button
      type="button"
      data-workspace-note-ref="true"
      onClick={handleClick}
      onPointerDown={(event) => event.stopPropagation()}
      disabled={missing}
      className={[
        "nodrag nopan pointer-events-auto mx-0.5 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 align-baseline text-[0.92em] font-medium leading-snug ring-1 transition",
        missing
          ? "cursor-default text-stone-500 line-through ring-stone-600/50 bg-stone-900/40"
          : "cursor-pointer text-stone-50 hover:brightness-110",
      ].join(" ")}
      style={
        missing
          ? undefined
          : {
              backgroundColor: `${fill}cc`,
              boxShadow: `inset 0 0 0 1px ${border}`,
            }
      }
      title={missing ? "Referenced note was deleted" : `Open note: ${label}`}
    >
      <WorkspaceNoteRefPaperclipIcon />
      <span className="truncate">{label}</span>
    </button>
  );
}
