// stack_sandbox/frontend_web/src/modules/projects/components/common/WorkspaceCanvasIcon.tsx

// Canvas / workspace grid icon used in nav links and kanban cards.

type WorkspaceCanvasIconProps = {
  className?: string;
};

export function WorkspaceCanvasIcon({
  className = "h-3.5 w-3.5",
}: WorkspaceCanvasIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 17h7" />
      <path d="M17.5 14v7" />
    </svg>
  );
}
