// keel_web/src/modules/projects/pages/ProjectWorkspaceRedirect.tsx

// Resolves the default project canvas and redirects to the canvas-scoped workspace URL.

import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";

import { fetchProjectCanvases, projectsQueryKeys } from "../api";

export function ProjectWorkspaceRedirect() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);

  const canvasesQuery = useQuery({
    queryKey: projectsQueryKeys.canvases(projectId),
    queryFn: () => fetchProjectCanvases(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  if (!Number.isFinite(projectId) || projectId <= 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-400">
        Invalid project.
      </div>
    );
  }

  if (canvasesQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-stone-500">
        Loading workspace…
      </div>
    );
  }

  if (canvasesQuery.isError || !canvasesQuery.data?.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-red-400">
        Could not load workspace canvases.
      </div>
    );
  }

  const defaultCanvas =
    canvasesQuery.data.find((canvas) => canvas.is_default) ?? canvasesQuery.data[0];

  return (
    <Navigate
      to={`/projects/${projectId}/workspace/${defaultCanvas.canvas_id}`}
      replace
    />
  );
}
