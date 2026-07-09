// keel_web/src/modules/coak/components/tabs/constellation/CoakConstellationSearchNavigator.tsx

import type { ReactNode } from "react";

function CoakConstellationSearchNavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-800/80 hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

type CoakConstellationSearchNavigatorProps = {
  currentIndex: number;
  matchCount: number;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function CoakConstellationSearchNavigator({
  currentIndex,
  matchCount,
  disabled = false,
  onPrevious,
  onNext,
}: CoakConstellationSearchNavigatorProps) {
  const canCycle = matchCount > 1 && !disabled;

  return (
    <div
      className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-full border border-stone-700/80 bg-stone-950/70 px-1 py-0.5 text-[10px] tabular-nums text-stone-300 shadow-lg shadow-black/20 backdrop-blur-sm"
      aria-label={`Search result ${currentIndex + 1} of ${matchCount}`}
    >
      <CoakConstellationSearchNavButton
        label="Previous search result"
        disabled={!canCycle}
        onClick={onPrevious}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" aria-hidden>
          <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </CoakConstellationSearchNavButton>
      <span className="min-w-[2.75rem] px-0.5 text-center leading-none">
        {currentIndex + 1}/{matchCount}
      </span>
      <CoakConstellationSearchNavButton label="Next search result" disabled={!canCycle} onClick={onNext}>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" aria-hidden>
          <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </CoakConstellationSearchNavButton>
    </div>
  );
}
