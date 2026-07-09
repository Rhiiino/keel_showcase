// src/modules/focus/components/cards/card/FocusListCardItemsToggle.tsx

// Bottom-right control to expand or collapse inline list items on a card.

type FocusListCardItemsToggleProps = {
  expanded: boolean;
  onClick: () => void;
  disabled?: boolean;
  listTitle: string;
};

export function FocusListCardItemsToggle({
  expanded,
  onClick,
  disabled = false,
  listTitle,
}: FocusListCardItemsToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      aria-expanded={expanded}
      aria-label={
        expanded
          ? `Hide items for ${listTitle}`
          : `Show items for ${listTitle}`
      }
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-lg transition",
        "text-white/45 ring-1 ring-white/10 bg-white/[0.04]",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-white/[0.08] hover:text-white/80 hover:ring-white/18",
        expanded ? "bg-white/[0.08] text-white/75 ring-white/18" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={[
          "h-3.5 w-3.5 transition-transform duration-150",
          expanded ? "rotate-180" : "",
        ].join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
