// stack_sandbox/frontend_web/src/modules/projects/components/kanban/ProjectKanbanBoard.tsx

// Kanban board grouped by project status with drag-and-drop status changes.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  projectsQueryKeys,
  updateProject,
  type Project,
} from "../../api";
import { groupProjectsByStatus, resolveKanbanProjectStatus } from "../../lib/project/kanban";
import { PROJECT_STATUSES, type ProjectStatus } from "../../lib/project";
import { useKanbanProjectPointerDrag } from "../../lib/project/kanban";
import { ProjectKanbanStatusRow } from "./ProjectKanbanStatusRow";

type ProjectKanbanBoardProps = {
  projects: Project[];
};

export function ProjectKanbanBoard({ projects }: ProjectKanbanBoardProps) {
  const queryClient = useQueryClient();
  const grouped = useMemo(() => groupProjectsByStatus(projects), [projects]);

  const moveMutation = useMutation({
    mutationFn: ({
      projectId,
      status,
    }: {
      projectId: number;
      status: ProjectStatus;
    }) => updateProject(projectId, { status }),
    onMutate: async ({ projectId, status }) => {
      await queryClient.cancelQueries({ queryKey: projectsQueryKeys.list() });
      const previous = queryClient.getQueryData<Project[]>(
        projectsQueryKeys.list(),
      );
      queryClient.setQueryData<Project[]>(
        projectsQueryKeys.list(),
        (current) =>
          current?.map((project) =>
            project.id === projectId ? { ...project, status } : project,
          ) ?? [],
      );
      return { previous };
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(
        projectsQueryKeys.list(),
        (current) =>
          current?.map((project) =>
            project.id === updatedProject.id
              ? { ...project, ...updatedProject }
              : project,
          ) ?? [],
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsQueryKeys.list(), context.previous);
      }
    },
  });

  const handleDropProject = (projectId: number, nextStatus: ProjectStatus) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    const currentStatus = resolveKanbanProjectStatus(project.status);
    if (currentStatus === nextStatus) {
      return;
    }

    moveMutation.mutate({ projectId, status: nextStatus });
  };

  const {
    draggingProjectId,
    dropTargetStatus,
    handleCardPointerDown,
    shouldSuppressClick,
  } = useKanbanProjectPointerDrag({ onDrop: handleDropProject });

  return (
    <div className="space-y-6">
      {projects.length === 0 && (
        <p className="text-sm text-stone-500">
          No projects yet. Create one to get started.
        </p>
      )}

      {PROJECT_STATUSES.map((status) => (
        <ProjectKanbanStatusRow
          key={status}
          status={status}
          projects={grouped[status]}
          draggingProjectId={draggingProjectId}
          dropHighlighted={dropTargetStatus === status}
          onBoardPointerDown={handleCardPointerDown}
          shouldSuppressBoardClick={shouldSuppressClick}
        />
      ))}
    </div>
  );
}
