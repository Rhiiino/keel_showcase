// src/modules/focus/components/constellation/canvas/FocusConstellationSaveButton.tsx

// Manual save trigger for constellation canvas layout and settings.

import { FocusInstantTooltip } from "../../shared/FocusInstantTooltip";

type FocusConstellationSaveButtonProps = {
  saved: boolean;
  saving?: boolean;
  onSave: () => void;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M7.5 12.5 10.5 15.5 16.5 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FocusConstellationSaveButton({
  saved,
  saving = false,
  onSave,
}: FocusConstellationSaveButtonProps) {
  const label = saved ? "All changes saved" : "Save canvas changes";

  return (
    <FocusInstantTooltip label={label} placement="below">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        aria-label={saved ? "All canvas changes saved" : "Save canvas changes"}
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
          saved
            ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-400"
            : "border-white/12 bg-white/[0.04] text-white/40 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/65",
          saving ? "cursor-wait opacity-70" : "",
        ].join(" ")}
      >
        <CheckIcon />
      </button>
    </FocusInstantTooltip>
  );
}
