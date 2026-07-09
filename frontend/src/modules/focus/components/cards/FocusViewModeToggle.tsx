// src/modules/focus/components/cards/FocusViewModeToggle.tsx

// Icon-only switch between Focus hub card grid and constellation view.

import type { FocusHubViewMode } from "../../lib/focus";
import { FocusInstantTooltip } from "../shared/FocusInstantTooltip";

type FocusViewModeToggleProps = {
  value: FocusHubViewMode;
  onChange: (mode: FocusHubViewMode) => void;
};

function CardsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ConstellationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="8" r="1.5" />
      <circle cx="17.5" cy="7" r="1.5" />
      <circle cx="18.5" cy="16.5" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
      <path d="M12 12L6.5 8M12 12L17.5 7M12 12L18.5 16.5M12 12L7 17" />
    </svg>
  );
}

const OPTIONS: Array<{
  mode: FocusHubViewMode;
  label: string;
  Icon: () => JSX.Element;
}> = [
  { mode: "cards", label: "Cards view", Icon: CardsIcon },
  { mode: "constellation", label: "Constellation view", Icon: ConstellationIcon },
];

export function FocusViewModeToggle({ value, onChange }: FocusViewModeToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] p-1"
      role="group"
      aria-label="Focus view mode"
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const selected = value === mode;
        return (
          <FocusInstantTooltip key={mode} label={label} placement="below">
            <button
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => onChange(mode)}
              className={[
                "inline-flex h-7 w-8 items-center justify-center rounded-lg transition",
                selected
                  ? "bg-white/14 text-white/95"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/75",
              ].join(" ")}
            >
              <Icon />
            </button>
          </FocusInstantTooltip>
        );
      })}
    </div>
  );
}
