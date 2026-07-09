// keel_web/src/modules/projects/components/workspace/nodes/workspaceNoteBodySelectionActions.ts

// Registry of selection-toolbar actions for workspace note body editing.

export type WorkspaceNoteBodySelectionAction = {
  id: string;
  label: string;
  onSelect: () => void;
};

export function buildWorkspaceNoteBodySelectionActions(handlers: {
  onCreateNote: () => void;
}): WorkspaceNoteBodySelectionAction[] {
  return [
    {
      id: "create-note",
      label: "Create note",
      onSelect: handlers.onCreateNote,
    },
  ];
}
