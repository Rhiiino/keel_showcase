// keel_web/src/modules/projects/components/workspace/settings/WorkspaceTransparencyToggle.tsx

// Toggle for transparent vs solid node backgrounds on the workspace canvas.

type WorkspaceTransparencyToggleProps = {
  active: boolean;
  onClick: () => void;
};

export function WorkspaceTransparencyToggle({
  active,
  onClick,
}: WorkspaceTransparencyToggleProps) {
  return (
    <button
      type="button"
      aria-label={active ? "Disable transparent background" : "Enable transparent background"}
      aria-pressed={active}
      title={active ? "Solid background" : "Transparent background"}
      onClick={onClick}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
        active
          ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50"
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-200",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d="M4 4h8v8H4zM12 12h8v8h-8z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M4 12h8M12 4v8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          opacity={active ? 1 : 0.5}
        />
      </svg>
    </button>
  );
}
