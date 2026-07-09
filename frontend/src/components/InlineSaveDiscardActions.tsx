// stack_sandbox/frontend_web/src/components/InlineSaveDiscardActions.tsx

// Save and discard controls that slide in from the right when edits are pending.

type InlineSaveDiscardActionsProps = {
  visible: boolean;
  onDiscard: () => void;
  onSave: () => void;
  isSaving?: boolean;
  canSave?: boolean;
  saveError?: string | null;
  className?: string;
};

export function InlineSaveDiscardActions({
  visible,
  onDiscard,
  onSave,
  isSaving = false,
  canSave = true,
  saveError = null,
  className = "",
}: InlineSaveDiscardActionsProps) {
  if (!visible) {
    return null;
  }

  const disabled = isSaving;

  return (
    <div
      className={[
        "flex shrink-0 flex-col items-end gap-1.5 py-1 pl-4 pr-2 animate-slide-in-right",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={disabled}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            disabled
              ? "cursor-not-allowed text-stone-600"
              : "text-stone-400 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-200",
          ].join(" ")}
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={disabled || !canSave}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            disabled || !canSave
              ? "cursor-not-allowed bg-stone-900/60 text-stone-600 ring-1 ring-stone-800/80"
              : "bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/30 hover:bg-lime-400/25",
          ].join(" ")}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
      {saveError ? (
        <p className="max-w-[16rem] text-right text-[11px] text-red-400">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}
