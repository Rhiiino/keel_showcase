// stack_sandbox/frontend_web/src/modules/projects/components/kanban/ProjectKanbanStatusRow.tsx

// One status row on the projects Kanban board.

import type { Project } from "../../api";
import {
  projectStatusAccentColor,
  projectStatusLabel,
  type ProjectStatus,
} from "../../lib/project";
import { ProjectCard } from "../card";

type ProjectKanbanStatusRowProps = {
  status: ProjectStatus;
  projects: Project[];
  draggingProjectId: number | null;
  dropHighlighted: boolean;
  onBoardPointerDown: (
    projectId: number,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
  shouldSuppressBoardClick: (projectId: number) => boolean;
};

export function ProjectKanbanStatusRow({
  status,
  projects,
  draggingProjectId,
  dropHighlighted,
  onBoardPointerDown,
  shouldSuppressBoardClick,
}: ProjectKanbanStatusRowProps) {
  const accentColor = projectStatusAccentColor(status);
  const projectDragActive = draggingProjectId !== null;
  const isEmpty = projects.length === 0;

  return (
    <section
      data-kanban-status={status}
      className={[
        isEmpty ? "space-y-0" : "space-y-4",
        "transition duration-150",
        dropHighlighted && projectDragActive
          ? "rounded-lg bg-sky-500/[0.04]"
          : "",
      ].join(" ")}
    >
      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-sm font-medium text-stone-200">
            {projectStatusLabel(status)}
          </h2>
          <span className="text-sm tabular-nums text-stone-500">
            {projects.length}
          </span>
        </div>
        <div
          aria-hidden
          className="mt-2 h-px w-1/2 max-w-[50%]"
          style={{
            background: `linear-gradient(to right, ${accentColor}, transparent)`,
          }}
        />
      </div>

      {!isEmpty && (
        <div className="flex flex-wrap gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="w-full min-w-[14rem] max-w-[18rem] flex-1 sm:w-64 sm:flex-none"
            >
              <ProjectCard
                project={project}
                variant="board"
                isDragging={draggingProjectId === project.id}
                onBoardPointerDown={onBoardPointerDown}
                shouldSuppressBoardClick={shouldSuppressBoardClick}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
