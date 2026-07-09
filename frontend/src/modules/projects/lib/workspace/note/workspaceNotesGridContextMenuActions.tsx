// keel_web/src/modules/projects/lib/workspace/note/workspaceNotesGridContextMenuActions.tsx

// Registry of right-click actions for workspace notes grid tiles.

import type { ReactNode } from "react";

export type WorkspaceNotesGridContextMenuAction = {
  id: string;
  label: string;
  confirmLabel?: string;
  icon?: ReactNode;
  destructive?: boolean;
  onSelect: () => void;
};

function WorkspaceNotesGridSwapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-stone-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M7 7h10l-3-3M17 17H7l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkspaceNotesGridDeleteIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-red-400/90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6H16" />
      <path d="M8 6V4.6C8 4.1 8.4 3.6 9 3.6H11C11.6 3.6 12 4.1 12 4.6V6" />
      <path d="M5.7 6L6.2 15.4C6.2 15.9 6.6 16.4 7.2 16.4H12.8C13.4 16.4 13.8 15.9 13.8 15.4L14.3 6" />
      <path d="M8.5 9V13.4" />
      <path d="M11.5 9V13.4" />
    </svg>
  );
}

export function buildWorkspaceNotesGridContextMenuActions(handlers: {
  onSwap: () => void;
  onDelete: () => void;
}): WorkspaceNotesGridContextMenuAction[] {
  return [
    {
      id: "swap",
      label: "Swap",
      icon: <WorkspaceNotesGridSwapIcon />,
      onSelect: handlers.onSwap,
    },
    {
      id: "delete",
      label: "Delete",
      confirmLabel: "Confirm delete",
      icon: <WorkspaceNotesGridDeleteIcon />,
      destructive: true,
      onSelect: handlers.onDelete,
    },
  ];
}
