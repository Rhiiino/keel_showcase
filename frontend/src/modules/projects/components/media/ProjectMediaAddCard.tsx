// stack_sandbox/frontend_web/src/modules/projects/components/media/ProjectMediaAddCard.tsx

// Add-file card matching the condensed media card grid size.

import type { MouseEvent } from "react";

import type { MediaSourceChoiceAnchor } from "../../../media/components/pickers";

type ProjectMediaAddCardProps = {
  onOpenSourceMenu: (anchor: MediaSourceChoiceAnchor) => void;
  disabled?: boolean;
};

export function ProjectMediaAddCard({
  onOpenSourceMenu,
  disabled = false,
}: ProjectMediaAddCardProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onOpenSourceMenu({
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={[
        "flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-dashed border-stone-700/80 bg-stone-950/20 text-stone-400 ring-1 ring-stone-800/30 transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-sky-400/50 hover:bg-sky-500/5 hover:text-sky-200",
      ].join(" ")}
      aria-label="Add file"
    >
      <div className="flex aspect-[16/10] items-center justify-center rounded-t-lg bg-stone-950/40">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <div className="h-[18px]" aria-hidden />
        <p className="mt-1.5 text-xs font-medium text-stone-500">Add file</p>
        <p className="mt-auto pt-2 text-[10px] text-transparent select-none" aria-hidden>
          —
        </p>
      </div>
    </button>
  );
}
