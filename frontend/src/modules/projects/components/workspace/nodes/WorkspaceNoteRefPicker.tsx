// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteRefPicker.tsx

// `@` mention popover for inserting workspace note cross-references.

import type { WorkspaceNoteRefCandidate } from "../../../lib/workspace/note";

type WorkspaceNoteRefPickerProps = {
  open: boolean;
  candidates: WorkspaceNoteRefCandidate[];
  activeIndex: number;
  onSelect: (candidateId: string) => void;
};

export function WorkspaceNoteRefPicker({
  open,
  candidates,
  activeIndex,
  onSelect,
}: WorkspaceNoteRefPickerProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="nodrag nopan absolute bottom-3 left-6 right-6 z-[4] max-h-44 overflow-y-auto rounded-lg border border-stone-700/80 bg-stone-950/95 p-1 shadow-xl backdrop-blur-sm"
      role="listbox"
      aria-label="Link to note"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {candidates.map((candidate, index) => (
        <button
          key={candidate.id}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className={[
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
            index === activeIndex
              ? "bg-stone-800 text-stone-50"
              : "text-stone-200 hover:bg-stone-900",
          ].join(" ")}
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(candidate.id);
          }}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-stone-600/70"
            style={{ backgroundColor: candidate.borderColor }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{candidate.title}</span>
          <span className="shrink-0 font-mono text-[10px] text-stone-500">
            {candidate.id.slice(-6)}
          </span>
        </button>
      ))}
    </div>
  );
}
