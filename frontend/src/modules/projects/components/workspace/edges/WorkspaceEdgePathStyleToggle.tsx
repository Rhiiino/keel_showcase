// keel_web/src/modules/projects/components/workspace/edges/WorkspaceEdgePathStyleToggle.tsx

// Cycle edge routing: curved, straight, or 90-degree on the workspace canvas.

import type { WorkspaceEdgePathStyle } from "../../../lib/workspace";

type WorkspaceEdgePathStyleToggleProps = {
  pathStyle: WorkspaceEdgePathStyle;
  onClick: () => void;
};

const CYCLE_LABEL: Record<
  WorkspaceEdgePathStyle,
  { aria: string; title: string }
> = {
  smooth: {
    aria: "Curved path — click for straight line",
    title: "Curved — click for straight",
  },
  straight: {
    aria: "Straight path — click for 90-degree path",
    title: "Straight — click for 90° turns",
  },
  orthogonal: {
    aria: "90-degree path — click for curved path",
    title: "90° turns — click for curve",
  },
};

export function WorkspaceEdgePathStyleToggle({
  pathStyle,
  onClick,
}: WorkspaceEdgePathStyleToggleProps) {
  const { aria, title } = CYCLE_LABEL[pathStyle];
  const active = pathStyle !== "smooth";

  return (
    <button
      type="button"
      aria-label={aria}
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition",
        active
          ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50"
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-200",
      ].join(" ")}
    >
      {pathStyle === "straight" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M5 19L19 5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ) : pathStyle === "orthogonal" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M5 18V8h6v4h8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M5 18C5 10 12 10 12 6s7 0 7 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
