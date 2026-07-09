// keel_web/src/modules/projects/components/workspace/panel/workspaceCanvasListStyles.ts

// Shared grid layout for the workspace side panel Canvas tab.

export const WORKSPACE_CANVAS_LIST_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_1.25rem] items-center gap-x-2";

export const WORKSPACE_CANVAS_LIST_HEADER_CLASS =
  "px-0.5 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500";

export function formatCanvasUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
