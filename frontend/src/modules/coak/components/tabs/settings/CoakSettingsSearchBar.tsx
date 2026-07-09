// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsSearchBar.tsx

import type { ChangeEvent } from "react";

import { CoakConstellationSearchNavigator } from "../constellation/CoakConstellationSearchNavigator";

type CoakSettingsSearchBarProps = {
  value: string;
  disabled?: boolean;
  matchCount: number;
  matchIndex: number;
  onChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function CoakSettingsSearchBar({
  value,
  disabled = false,
  matchCount,
  matchIndex,
  onChange,
  onPrevious,
  onNext,
}: CoakSettingsSearchBarProps) {
  const showNavigator = value.trim().length > 0 && matchCount > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m16 16 4 4" />
          </svg>
        </div>
        <input
          type="search"
          role="searchbox"
          value={value}
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          placeholder="Search settings…"
          aria-label="Search C.O.A.K. settings"
          className="h-8 w-full rounded-full border border-stone-700/80 bg-stone-950/70 py-1.5 pl-9 pr-3 text-xs text-stone-200 placeholder:text-stone-500 shadow-lg shadow-black/20 outline-none backdrop-blur-sm transition focus:border-stone-500 focus:bg-stone-900/80 disabled:opacity-60"
        />
      </div>
      {showNavigator ? (
        <CoakConstellationSearchNavigator
          currentIndex={matchIndex}
          matchCount={matchCount}
          disabled={disabled}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      ) : null}
    </div>
  );
}
