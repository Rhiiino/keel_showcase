// src/modules/focus/components/shared/hub/FocusHubHeaderControls.tsx

// Shared hub header controls for switching views and opening tag manager.

import type { FocusHubViewMode } from "../../../lib/focus";
import { FocusViewModeToggle } from "../../cards/FocusViewModeToggle";
import { FocusInstantTooltip } from "../FocusInstantTooltip";

type FocusHubHeaderControlsProps = {
  viewMode: FocusHubViewMode;
  onViewModeChange: (mode: FocusHubViewMode) => void;
  onOpenTagManager: () => void;
  onCreateNode?: () => void;
};

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TagsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H5a2 2 0 0 0-2 2v4m0 4v2a2 2 0 0 0 2 2h4m4 0h4a2 2 0 0 0 2-2v-4m0-4V5a2 2 0 0 0-2-2h-4"
      />
      <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FocusHubHeaderControls({
  viewMode,
  onViewModeChange,
  onOpenTagManager,
  onCreateNode,
}: FocusHubHeaderControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {onCreateNode ? (
        <FocusInstantTooltip label="Create focus node" placement="below">
          <button
            type="button"
            onClick={onCreateNode}
            aria-label="Create focus node"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-100 transition hover:border-sky-200/35 hover:bg-sky-400/16 hover:text-white"
          >
            <PlusIcon />
          </button>
        </FocusInstantTooltip>
      ) : null}
      <FocusViewModeToggle value={viewMode} onChange={onViewModeChange} />
      <FocusInstantTooltip label="Manage tags" placement="below">
        <button
          type="button"
          onClick={onOpenTagManager}
          aria-label="Manage tags"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-white/75 transition hover:bg-white/[0.08] hover:text-white/90"
        >
          <TagsIcon />
        </button>
      </FocusInstantTooltip>
    </div>
  );
}
