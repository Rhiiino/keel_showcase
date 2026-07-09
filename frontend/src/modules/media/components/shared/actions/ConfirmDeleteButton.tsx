// keel_web/src/modules/media/components/shared/actions/ConfirmDeleteButton.tsx

// Text delete button with two-step confirmation for form footers.

import { useConfirmDeleteAction } from "../../../../../hooks/useConfirmDeleteAction";

type ConfirmDeleteButtonProps = {
  onConfirm: () => void;
  disabled?: boolean;
  resetKey?: string | number;
  label?: string;
  confirmLabel?: string;
  compact?: boolean;
};

export function ConfirmDeleteButton({
  onConfirm,
  disabled = false,
  resetKey,
  label = "Delete",
  confirmLabel = "Confirm delete",
  compact = false,
}: ConfirmDeleteButtonProps) {
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(resetKey);

  return (
    <div ref={containerRef} className={compact ? "" : "border-t border-white/[0.06] pt-8"}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          handleClick(onConfirm);
        }}
        className={[
          "rounded-lg px-4 py-2.5 text-sm font-medium transition",
          disabled
            ? "cursor-not-allowed text-stone-600 opacity-50"
            : confirmPending
              ? "bg-red-950/50 text-red-200 ring-1 ring-red-800/60 hover:bg-red-950/70"
              : "text-red-400 ring-1 ring-red-900/40 hover:bg-red-950/30 hover:text-red-300",
        ].join(" ")}
      >
        {confirmPending ? confirmLabel : label}
      </button>
    </div>
  );
}
