// keel_web/src/modules/media/components/panels/MediaPanelToolbarActions.tsx

// Shared panel action buttons: edit and delete.

import { ConfirmTrashButton } from "../shared/actions";

type MediaPanelToolbarActionsProps = {
  editMode: boolean;
  busy?: boolean;
  onToggleEdit: () => void;
  onDeletePanel?: () => void;
};

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function MediaPanelToolbarActions({
  editMode,
  busy = false,
  onToggleEdit,
  onDeletePanel,
}: MediaPanelToolbarActionsProps) {
  const buttonClass = "inline-flex h-8 w-8 items-center justify-center rounded-lg transition";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        aria-label={editMode ? "Exit edit mode" : "Edit panel"}
        aria-pressed={editMode}
        onClick={onToggleEdit}
        className={[
          buttonClass,
          editMode
            ? "bg-stone-100 text-stone-950"
            : "text-stone-400 hover:bg-stone-900/70 hover:text-stone-200",
        ].join(" ")}
      >
        <PencilIcon />
      </button>
      {onDeletePanel ? (
        <ConfirmTrashButton
          disabled={busy}
          ariaLabel="Delete panel"
          onConfirm={onDeletePanel}
        />
      ) : null}
    </div>
  );
}
