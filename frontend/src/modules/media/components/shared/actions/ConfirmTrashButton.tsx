// keel_web/src/modules/media/components/shared/actions/ConfirmTrashButton.tsx

// Red trash icon with two-step delete confirmation.

import { useConfirmDeleteAction } from "../../../../../hooks/useConfirmDeleteAction";

type ConfirmTrashButtonProps = {
  onConfirm: () => void;
  disabled?: boolean;
  resetKey?: string | number;
  ariaLabel?: string;
  className?: string;
};

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
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

export function ConfirmTrashButton({
  onConfirm,
  disabled = false,
  resetKey,
  ariaLabel = "Delete",
  className = "",
}: ConfirmTrashButtonProps) {
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(resetKey);

  return (
    <div ref={containerRef} className={className}>
      <button
        type="button"
        disabled={disabled}
        aria-label={confirmPending ? "Confirm delete" : ariaLabel}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) {
            return;
          }
          handleClick(onConfirm);
        }}
        className={[
          "inline-flex h-8 w-8 items-center justify-center gap-0.5 rounded-lg transition",
          disabled
            ? "cursor-not-allowed text-stone-600 opacity-40"
            : confirmPending
              ? "bg-red-950/50 text-red-300 ring-1 ring-red-800/60"
              : "text-red-400/80 hover:bg-red-950/30 hover:text-red-300",
        ].join(" ")}
      >
        <TrashIcon />
        {confirmPending ? <QuestionMarkIcon /> : null}
      </button>
    </div>
  );
}
