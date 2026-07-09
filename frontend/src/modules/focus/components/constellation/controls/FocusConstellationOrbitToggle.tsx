// src/modules/focus/components/constellation/controls/FocusConstellationOrbitToggle.tsx

// Play/pause toggle for continuous constellation orbit animation.

import { FocusInstantTooltip } from "../../shared/FocusInstantTooltip";

type FocusConstellationOrbitToggleProps = {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M9 7.5v9l8-4.5-8-4.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <rect x="7" y="6" width="3" height="12" rx="0.75" />
      <rect x="14" y="6" width="3" height="12" rx="0.75" />
    </svg>
  );
}

export function FocusConstellationOrbitToggle({
  playing,
  onPlayingChange,
}: FocusConstellationOrbitToggleProps) {
  const label = playing ? "Pause orbit" : "Play orbit";

  return (
    <div className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] p-1">
      <FocusInstantTooltip label={label} placement="below">
        <button
          type="button"
          onClick={() => onPlayingChange(!playing)}
          aria-label={playing ? "Pause constellation orbit" : "Play constellation orbit"}
          aria-pressed={playing}
          className={[
            "inline-flex h-7 w-8 items-center justify-center rounded-lg transition",
            playing
              ? "bg-white/14 text-white/95"
              : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
          ].join(" ")}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </FocusInstantTooltip>
    </div>
  );
}
