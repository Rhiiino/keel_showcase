// stack_sandbox/frontend_web/src/modules/projects/components/kanban/ProjectKanbanGrid.tsx

// Kanban view — status rows or flat card grid.

import type { Project } from "../../api";
import { ProjectKanbanBoard } from "./ProjectKanbanBoard";
import { ProjectKanbanFlatGrid } from "./ProjectKanbanFlatGrid";

type ProjectKanbanGridProps = {
  projects: Project[];
  groupByStatus: boolean;
};

export function ProjectKanbanGrid({
  projects,
  groupByStatus,
}: ProjectKanbanGridProps) {
  if (groupByStatus) {
    return <ProjectKanbanBoard projects={projects} />;
  }

  return <ProjectKanbanFlatGrid projects={projects} />;
}
