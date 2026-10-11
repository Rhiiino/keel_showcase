// stack_sandbox/frontend_web/src/modules/agents/components/CreateSubAgentTile.tsx

// Last-slot tile that starts a new draft sub-agent (same action as the old header +).

type CreateSubAgentTileProps = {
  onCreate: () => void;
};

export function CreateSubAgentTile({ onCreate }: CreateSubAgentTileProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      title="New sub-agent"
      aria-label="New sub-agent"
      className={[
        "group relative flex aspect-square w-40 shrink-0 flex-col overflow-hidden rounded-xl text-left sm:w-48",
        "border border-dashed border-stone-600/55",
        "bg-gradient-to-br from-stone-800/60 via-stone-900/80 to-stone-950",
        "shadow-[inset_0_2px_0_rgba(255,255,255,0.06),inset_0_-3px_6px_rgba(0,0,0,0.35),0_6px_20px_rgba(0,0,0,0.3)]",
        "transition duration-200",
        "hover:border-violet-400/45 hover:bg-stone-900/90",
        "hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-3px_6px_rgba(0,0,0,0.3),0_10px_28px_rgba(0,0,0,0.45)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40",
      ].join(" ")}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4 sm:p-5">
        <span
          className={[
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-stone-950/70 text-stone-400 ring-1 ring-stone-600/60",
            "transition group-hover:text-violet-300 group-hover:ring-violet-400/35",
          ].join(" ")}
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-7 w-7"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </span>
        <span className="text-sm font-medium text-stone-400 transition group-hover:text-stone-200">
          New sub-agent
        </span>
      </div>
    </button>
  );
}
