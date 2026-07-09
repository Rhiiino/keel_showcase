// keel_web/src/modules/projects/components/workspace/canvas/WorkspaceToolbar.tsx

// Floating toolbar for workspace canvas actions.

type WorkspaceToolbarProps = {
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  notesGridOpen: boolean;
  onToggleNotesGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  saveStatus: "idle" | "pending" | "saved" | "error";
  onRetrySave?: () => void;
};

function saveStatusLabel(status: WorkspaceToolbarProps["saveStatus"]): string {
  switch (status) {
    case "pending":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed — click to retry";
    default:
      return "Unsaved changes";
  }
}

function SaveStatusIndicator({
  status,
  onRetrySave,
}: {
  status: WorkspaceToolbarProps["saveStatus"];
  onRetrySave?: () => void;
}) {
  const isSaved = status === "saved";
  const isError = status === "error";
  const label = saveStatusLabel(status);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!isError || !onRetrySave}
      onClick={isError ? onRetrySave : undefined}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-lg ring-1 backdrop-blur-sm transition",
        isSaved
          ? "border-emerald-500/40 bg-stone-950/90 text-emerald-400 ring-emerald-500/20"
          : "border-stone-700 bg-stone-950/90 text-stone-500 ring-stone-800/80",
        isError && onRetrySave ? "cursor-pointer hover:border-red-500/40 hover:text-red-400" : "cursor-default",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M6 12.5l3.5 3.5L18 8"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M9 7H5v4M5 11c1.5-3 4.5-5 8-5 4.4 0 8 3.6 8 8s-3.6 8-8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M15 7h4v4M19 11c-1.5-3-4.5-5-8-5-4.4 0-8 3.6-8 8s3.6 8 8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M4 8h16M4 16h16M8 4v16M16 4v16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SnapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M9 4v1M15 4v1M9 19v1M15 19v1M4 9h1M4 15h1M19 9h1M19 15h1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function WorkspaceToolbar({
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  notesGridOpen,
  onToggleNotesGrid,
  snapEnabled,
  onToggleSnap,
  saveStatus,
  onRetrySave,
}: WorkspaceToolbarProps) {
  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2">
      <SaveStatusIndicator status={saveStatus} onRetrySave={onRetrySave} />

      <div className="flex items-center gap-1 rounded-lg border border-stone-800 bg-stone-950/90 p-1 shadow-lg ring-1 ring-stone-800/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (⌘Z)"
          className={[
            "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
            canUndo
              ? "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
              : "cursor-not-allowed text-stone-600",
          ].join(" ")}
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (⌘⇧Z)"
          className={[
            "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
            canRedo
              ? "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
              : "cursor-not-allowed text-stone-600",
          ].join(" ")}
        >
          <RedoIcon />
        </button>
        <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
        <button
          type="button"
          onClick={onToggleNotesGrid}
          aria-label={notesGridOpen ? "Close notes grid" : "Open notes grid"}
          aria-pressed={notesGridOpen}
          title={notesGridOpen ? "Notes grid open (click to close)" : "Notes grid"}
          className={[
            "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
            notesGridOpen
              ? "bg-stone-800 text-sky-300/90 hover:bg-stone-700 hover:text-sky-200"
              : "text-stone-500 hover:bg-stone-800 hover:text-stone-300",
          ].join(" ")}
        >
          <GridIcon />
        </button>
        <button
          type="button"
          onClick={onToggleSnap}
          aria-label={snapEnabled ? "Snap on" : "Snap off"}
          aria-pressed={snapEnabled}
          title={snapEnabled ? "Snap on (click to disable)" : "Snap off (click to enable)"}
          className={[
            "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
            snapEnabled
              ? "bg-stone-800 text-amber-300/90 hover:bg-stone-700 hover:text-amber-200"
              : "text-stone-500 hover:bg-stone-800 hover:text-stone-300",
          ].join(" ")}
        >
          <SnapIcon />
        </button>
        <button
          type="button"
          onClick={onFitView}
          className="rounded-md px-3 py-1.5 text-xs text-stone-400 transition hover:bg-stone-800 hover:text-stone-200"
          title="Fit view"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
