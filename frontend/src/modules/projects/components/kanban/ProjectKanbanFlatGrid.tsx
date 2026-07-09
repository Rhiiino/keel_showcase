// stack_sandbox/frontend_web/src/modules/projects/components/kanban/ProjectKanbanFlatGrid.tsx

// Flat Kanban gallery — all project cards without status row grouping.

import type { Project } from "../../api";
import { ProjectCard } from "../card";

type ProjectKanbanFlatGridProps = {
  projects: Project[];
};

export function ProjectKanbanFlatGrid({ projects }: ProjectKanbanFlatGridProps) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No projects yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} variant="board" showStatus />
      ))}
    </div>
  );
}
