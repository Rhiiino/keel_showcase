// keel_web/src/modules/projects/components/workspace/panel/workspaceFilePanelRowStyles.ts

// Shared card styling for workspace side panel rows.

type WorkspaceFilePanelRowStyleOptions = {
  highlighted?: boolean;
  isDropTarget?: boolean;
  canDrag?: boolean;
  isDeleting?: boolean;
  isDragging?: boolean;
  interactive?: boolean;
};

export function workspaceFilePanelRowClassName({
  highlighted = false,
  isDropTarget = false,
  canDrag = false,
  isDeleting = false,
  isDragging = false,
  interactive = true,
}: WorkspaceFilePanelRowStyleOptions): string {
  return [
    "group/row flex touch-none select-none items-stretch gap-2.5 rounded-lg border p-2 shadow-sm transition",
    "bg-gradient-to-br from-stone-950/95 via-stone-950/75 to-stone-900/55",
    "ring-1 ring-inset ring-white/[0.025]",
    highlighted
      ? "border-sky-400/45 bg-sky-500/10 from-sky-950/45 via-sky-950/20 to-stone-900/55 ring-sky-400/40 shadow-[0_0_18px_rgba(56,189,248,0.08)]"
      : isDropTarget
        ? "border-sky-400/50 bg-sky-500/15 from-sky-950/35 via-sky-950/15 to-stone-900/55 ring-sky-400/45"
        : "border-stone-800/80 hover:border-stone-700/90 hover:from-stone-900/90 hover:via-stone-900/65 hover:to-stone-900/45 hover:ring-white/[0.05]",
    interactive ? "hover:-translate-y-px hover:shadow-md" : "",
    canDrag ? "cursor-grab active:cursor-grabbing" : interactive ? "cursor-pointer" : "",
    isDeleting ? "opacity-60" : "",
    isDragging ? "opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const WORKSPACE_FILE_PANEL_PREVIEW_CLASS =
  "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-900/85 shadow-inner ring-1 ring-inset ring-white/[0.08]";

export const WORKSPACE_FILE_PANEL_TITLE_CLASS =
  "block truncate text-[13px] font-semibold leading-snug text-stone-100";

export const WORKSPACE_FILE_PANEL_META_CLASS = "truncate text-[11px] leading-snug text-stone-500";

export const WORKSPACE_FILE_PANEL_RENAME_INPUT_CLASS =
  "w-full rounded-lg bg-stone-950/90 px-2 py-1 text-sm font-medium text-stone-100 outline-none ring-1 ring-sky-500/60";
