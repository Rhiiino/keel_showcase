// stack_sandbox/frontend_web/src/modules/projects/lib/project/kanban/projectKanbanBoard.ts

// Group projects by status for the Kanban board rows.

import type { Project } from "../../../api";
import {
  PROJECT_STATUSES,
  isProjectStatus,
  type ProjectStatus,
} from "../projectStatus";

export function resolveKanbanProjectStatus(status: string): ProjectStatus {
  return isProjectStatus(status) ? status : "planning";
}

export function groupProjectsByStatus(
  projects: Project[],
): Record<ProjectStatus, Project[]> {
  const grouped = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, [] as Project[]]),
  ) as Record<ProjectStatus, Project[]>;

  for (const project of projects) {
    const status = resolveKanbanProjectStatus(project.status);
    grouped[status].push(project);
  }

  return grouped;
}
