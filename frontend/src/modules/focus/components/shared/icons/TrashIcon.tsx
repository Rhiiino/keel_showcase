// src/modules/focus/components/shared/icons/TrashIcon.tsx

// Trash can icon for focus delete actions.

type TrashIconProps = {
  className?: string;
};

export function TrashIcon({ className = "h-4 w-4" }: TrashIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
