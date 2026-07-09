// keel_web/src/modules/projects/hooks/useWorkspaceProjectSummary.ts

// Project-level workspace summary: canvas count, file count, and note totals.

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchProjectMedia,
  fetchProjectWorkspace,
  projectsQueryKeys,
} from "../api";
import { countWorkspaceNotes } from "../lib/workspace";

type UseWorkspaceProjectSummaryOptions = {
  projectId: number;
  canvasIds: number[];
};

export function useWorkspaceProjectSummary({
  projectId,
  canvasIds,
}: UseWorkspaceProjectSummaryOptions) {
  const mediaQuery = useQuery({
    queryKey: projectsQueryKeys.media(projectId),
    queryFn: () => fetchProjectMedia(projectId),
    enabled: projectId > 0,
  });

  const workspaceQueries = useQueries({
    queries: canvasIds.map((canvasId) => ({
      queryKey: projectsQueryKeys.workspace(projectId, canvasId),
      queryFn: () => fetchProjectWorkspace(projectId, canvasId),
      enabled: projectId > 0 && canvasId > 0,
      staleTime: 30_000,
    })),
  });

  const noteCountByCanvasId = useMemo(() => {
    const counts = new Map<number, number>();
    canvasIds.forEach((canvasId, index) => {
      const workspace = workspaceQueries[index]?.data;
      counts.set(
        canvasId,
        workspace ? countWorkspaceNotes(workspace.state) : 0,
      );
    });
    return counts;
  }, [canvasIds, workspaceQueries]);

  const totalNoteCount = useMemo(
    () => [...noteCountByCanvasId.values()].reduce((sum, count) => sum + count, 0),
    [noteCountByCanvasId],
  );

  const isLoading =
    mediaQuery.isLoading || workspaceQueries.some((query) => query.isLoading);

  return {
    canvasCount: canvasIds.length,
    fileCount: mediaQuery.data?.length ?? 0,
    totalNoteCount,
    noteCountByCanvasId,
    isLoading,
  };
}
