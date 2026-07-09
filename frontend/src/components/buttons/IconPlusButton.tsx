// keel_web/src/components/buttons/IconPlusButton.tsx

// Compact icon-only add button used across list page headers.

type IconPlusButtonProps = {
  onClick: () => void;
  ariaLabel: string;
  title?: string;
  disabled?: boolean;
  className?: string;
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

export function IconPlusButton({
  onClick,
  ariaLabel,
  title,
  disabled = false,
  className = "",
}: IconPlusButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-100 transition",
        "hover:border-sky-200/35 hover:bg-sky-400/16 hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
    >
      <PlusIcon />
    </button>
  );
}
