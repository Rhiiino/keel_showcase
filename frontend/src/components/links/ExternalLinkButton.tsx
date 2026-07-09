// stack_sandbox/frontend_web/src/components/links/ExternalLinkButton.tsx

// Icon button that opens an external URL in a new tab (amber styling).

export function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v7h-7" />
      <path d="M3 10V3h7" />
    </svg>
  );
}

type ExternalLinkButtonProps = {
  href: string;
  ariaLabel: string;
  title?: string;
  disabled?: boolean;
  className?: string;
};

export function ExternalLinkButton({
  href,
  ariaLabel,
  title,
  disabled = false,
  className = "",
}: ExternalLinkButtonProps) {
  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-amber-400/90 ring-1 ring-amber-900/50 transition",
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:bg-amber-950/30 hover:text-amber-300",
        className,
      ].join(" ")}
    >
      <ExternalLinkIcon />
    </a>
  );
}
