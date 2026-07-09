// stack_sandbox/frontend_web/src/modules/projects/components/kanban/ProjectKanbanBorderPreview.tsx

// Top-left Kanban card border accent on the project detail display view.

import {
  kanbanCardBorderRgba,
  resolveKanbanCardColor,
} from "../../lib/project/appearance";

type ProjectKanbanBorderPreviewProps = {
  colorHex: string | null | undefined;
};

export function ProjectKanbanBorderPreview({
  colorHex,
}: ProjectKanbanBorderPreviewProps) {
  const color = resolveKanbanCardColor(colorHex);
  const mid = kanbanCardBorderRgba(colorHex, 0.55);
  const soft = kanbanCardBorderRgba(colorHex, 0.2);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute left-4 top-4 h-0.5 w-[min(52%,22rem)] sm:left-5 sm:top-5"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${mid} 42%, ${soft} 68%, transparent 100%)`,
        }}
      />

      <div
        className="absolute left-4 top-4 w-0.5 h-[min(42vh,18rem)] sm:left-5 sm:top-5"
        style={{
          background: `linear-gradient(to bottom, ${color} 0%, ${mid} 38%, ${soft} 62%, transparent 100%)`,
        }}
      />

      <div
        className="absolute left-4 top-4 h-3 w-3 rounded-tl-md sm:left-5 sm:top-5"
        style={{
          borderTop: `2px solid ${color}`,
          borderLeft: `2px solid ${color}`,
          boxShadow: `0 0 18px ${kanbanCardBorderRgba(colorHex, 0.35)}`,
        }}
      />
    </div>
  );
}
