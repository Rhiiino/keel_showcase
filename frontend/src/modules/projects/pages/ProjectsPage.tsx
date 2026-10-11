// stack_sandbox/frontend_web/src/modules/projects/pages/ProjectsPage.tsx

// Projects module main page — Kanban-style card grid and create flow.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageTitle } from "../../../views/list/primitives/ListPageTitle";
import { fetchProjects, projectsQueryKeys } from "../api";
import { ProjectKanbanGrid, ProjectKanbanGroupToggle } from "../components/kanban";
import {
  readKanbanGroupByStatus,
  writeKanbanGroupByStatus,
} from "../lib/project/kanban";

export function ProjectsPage() {
  const navigate = useNavigate();
  const [groupByStatus, setGroupByStatus] = useState(() =>
    readKanbanGroupByStatus(),
  );

  const projectsQuery = useQuery({
    queryKey: projectsQueryKeys.list(),
    queryFn: fetchProjects,
  });

  const handleGroupByStatusChange = (next: boolean) => {
    setGroupByStatus(next);
    writeKanbanGroupByStatus(next);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4">
          <div>
            <ListPageTitle
              title="Projects"
              recordCount={projectsQuery.data?.length}
            />
            <p className="mt-1 max-w-xl text-sm text-stone-500">
              {groupByStatus
                ? "Browse projects by status. Drag a card between rows to update its state."
                : "Browse all projects in a single gallery. Status appears on each card."}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <ProjectKanbanGroupToggle
              groupByStatus={groupByStatus}
              onChange={handleGroupByStatusChange}
            />
            <IconPlusButton
              onClick={() => navigate("/projects/new")}
              ariaLabel="New project"
            />
          </div>
        </header>

        <RouteNoticeBanner />

        <div className="mt-8 min-h-0 flex-1">
          {projectsQuery.isLoading && (
            <p className="py-12 text-center text-sm text-stone-500">
              Loading projects…
            </p>
          )}

          {projectsQuery.isError && (
            <p className="py-12 text-center text-sm text-red-400">
              Failed to load projects.
            </p>
          )}

          {projectsQuery.data && (
            <ProjectKanbanGrid
              projects={projectsQuery.data}
              groupByStatus={groupByStatus}
            />
          )}
        </div>
    </div>
  );
}
