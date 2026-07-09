// keel_web/src/modules/projects/components/workspace/panel/WorkspaceSidePanelReveal.tsx

// Floating control to reopen the workspace side panel after it is collapsed.

import type { PanelSide } from "../../../../../components/panels";

type WorkspaceSidePanelRevealProps = {
  panelSide: PanelSide;
  onOpen: () => void;
};

function FilesTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function PanelSideHint({ side }: { side: PanelSide }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-stone-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d={side === "left" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
    </svg>
  );
}

export function WorkspaceSidePanelReveal({
  panelSide,
  onOpen,
}: WorkspaceSidePanelRevealProps) {
  const isLeft = panelSide === "left";

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Open Files panel"
      aria-label="Open Files panel"
      className={[
        // Below WorkspaceToolbar (top-4 + ~2.25rem row + 0.5rem gap)
        "pointer-events-auto absolute top-[3.75rem] z-20",
        isLeft ? "left-4" : "right-4",
        "inline-flex items-center gap-1.5 rounded-lg border border-stone-800",
        "bg-stone-950/90 px-2.5 py-2 text-stone-300 shadow-lg",
        "ring-1 ring-stone-800/80 backdrop-blur-sm transition",
        "hover:bg-stone-900 hover:text-stone-100",
      ].join(" ")}
    >
      <FilesTabIcon className="h-4 w-4" />
      <PanelSideHint side={panelSide} />
    </button>
  );
}
