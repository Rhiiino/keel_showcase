// stack_sandbox/frontend_web/src/modules/projects/components/kanban/ProjectKanbanGroupToggle.tsx

// Compact header control to toggle status-row vs flat gallery Kanban layout.

type ProjectKanbanGroupToggleProps = {
  groupByStatus: boolean;
  onChange: (groupByStatus: boolean) => void;
};

function StatusRowsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
    </svg>
  );
}

function GalleryGridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

export function ProjectKanbanGroupToggle({
  groupByStatus,
  onChange,
}: ProjectKanbanGroupToggleProps) {
  const title = groupByStatus
    ? "Grouped by status — switch to gallery"
    : "Gallery view — group by status";

  return (
    <button
      type="button"
      onClick={() => onChange(!groupByStatus)}
      aria-label={title}
      title={title}
      aria-pressed={groupByStatus}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-stone-700 transition",
        groupByStatus
          ? "bg-stone-900/50 text-stone-200"
          : "text-stone-400 hover:bg-stone-900/60 hover:text-stone-100",
      ].join(" ")}
    >
      {groupByStatus ? <StatusRowsIcon /> : <GalleryGridIcon />}
    </button>
  );
}
