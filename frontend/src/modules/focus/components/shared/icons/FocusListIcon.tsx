// src/modules/focus/components/shared/icons/FocusListIcon.tsx

// Small list icon for linked-list entry rows.

type FocusListIconProps = {
  className?: string;
};

export function FocusListIcon({ className = "h-3.5 w-3.5" }: FocusListIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      />
    </svg>
  );
}
