// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteDeleteButton.tsx

// Two-step delete control for the workspace note toolbar.

import { useWorkspaceCanvasDeleteConfirm } from "../canvas/useWorkspaceCanvasDeleteConfirm";

type WorkspaceNoteDeleteButtonProps = {
  nodeId: string;
  onDelete: () => void;
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
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

function QuestionMarkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8.2 7.4C8.5 6.2 9.4 5.4 10.6 5.4C12 5.4 13.1 6.5 13.1 7.9C13.1 9.1 12.4 9.8 11.2 10.6C10.5 11.1 10 11.8 10 12.7" />
      <circle cx="10" cy="15.2" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WorkspaceNoteDeleteButton({
  nodeId,
  onDelete,
}: WorkspaceNoteDeleteButtonProps) {
  const { deleteConfirmPending, setDeleteConfirmPending } =
    useWorkspaceCanvasDeleteConfirm(nodeId);

  return (
    <button
      type="button"
      aria-label={deleteConfirmPending ? "Confirm delete note" : "Delete note"}
      title={deleteConfirmPending ? "Confirm delete" : "Delete note"}
      onClick={() => {
        if (deleteConfirmPending) {
          onDelete();
          return;
        }
        setDeleteConfirmPending(true);
      }}
      className={[
        "inline-flex h-7 w-7 items-center justify-center gap-0.5 rounded-md transition",
        deleteConfirmPending
          ? "bg-red-950/50 text-red-200 ring-1 ring-red-400/50"
          : "text-red-400 hover:bg-red-950/40 hover:text-red-300",
      ].join(" ")}
    >
      <TrashIcon />
      {deleteConfirmPending ? <QuestionMarkIcon /> : null}
    </button>
  );
}
