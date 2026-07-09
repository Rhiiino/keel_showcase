// keel_web/src/modules/projects/components/workspace/settings/WorkspaceChromeToggle.tsx

// Toggle to hide card border and media filename chrome on the workspace canvas.

type WorkspaceChromeToggleProps = {
  active: boolean;
  onClick: () => void;
};

export function WorkspaceChromeToggle({ active, onClick }: WorkspaceChromeToggleProps) {
  return (
    <button
      type="button"
      aria-label={active ? "Show border and label" : "Hide border and label"}
      aria-pressed={active}
      title={active ? "Show border and label" : "Hide border and label"}
      onClick={onClick}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
        active
          ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50"
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-200",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeDasharray={active ? "3 2" : undefined}
        />
        {!active && (
          <path
            d="M8 16l3-4 2 2 3-5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
