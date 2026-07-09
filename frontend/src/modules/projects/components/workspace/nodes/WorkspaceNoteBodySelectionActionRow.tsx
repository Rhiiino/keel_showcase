// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteBodySelectionActionRow.tsx

// Scalable action row for the workspace note body selection toolbar.

import type { WorkspaceNoteBodySelectionAction } from "./workspaceNoteBodySelectionActions";

type WorkspaceNoteBodySelectionActionRowProps = {
  actions: WorkspaceNoteBodySelectionAction[];
};

export function WorkspaceNoteBodySelectionActionRow({
  actions,
}: WorkspaceNoteBodySelectionActionRowProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5 border-t border-stone-800 pt-1">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onMouseDown={(event) => {
            // Keep the note textarea focused so blur does not revert the edit.
            event.preventDefault();
          }}
          onClick={() => {
            action.onSelect();
          }}
          className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs text-stone-200 transition hover:bg-stone-800"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
