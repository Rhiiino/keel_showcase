// keel_web/src/modules/projects/components/workspace/nodes/workspaceNoteBodyContextMenuActions.tsx

// Registry of right-click actions shown while editing a workspace note body.

import type { ReactNode } from "react";

export type WorkspaceNoteBodyContextMenuAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
};

function WorkspaceNoteBodySeparatorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-stone-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 12h16" strokeLinecap="round" />
    </svg>
  );
}

function WorkspaceNoteBodyCheckboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-stone-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export function buildWorkspaceNoteBodyContextMenuActions(handlers: {
  onAddSeparator: () => void;
  onAddCheckbox: () => void;
}): WorkspaceNoteBodyContextMenuAction[] {
  return [
    {
      id: "add-separator",
      label: "Add separator",
      icon: <WorkspaceNoteBodySeparatorIcon />,
      onSelect: handlers.onAddSeparator,
    },
    {
      id: "add-checkbox",
      label: "Add checkbox",
      icon: <WorkspaceNoteBodyCheckboxIcon />,
      onSelect: handlers.onAddCheckbox,
    },
  ];
}
