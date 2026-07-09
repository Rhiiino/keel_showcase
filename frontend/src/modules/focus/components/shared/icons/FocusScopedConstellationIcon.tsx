// src/modules/focus/components/shared/icons/FocusScopedConstellationIcon.tsx

export function FocusScopedConstellationIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="8" r="1.5" />
      <circle cx="17.5" cy="7" r="1.5" />
      <circle cx="18.5" cy="16.5" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
      <path d="M12 12L6.5 8M12 12L17.5 7M12 12L18.5 16.5M12 12L7 17" />
    </svg>
  );
}
