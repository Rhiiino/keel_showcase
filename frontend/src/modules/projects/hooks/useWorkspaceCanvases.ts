// keel_web/src/modules/projects/hooks/useWorkspaceCanvases.ts

// List, create, rename, delete, and switch project workspace canvases.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createProjectCanvas,
  deleteProjectCanvas,
  fetchProjectCanvases,
  projectsQueryKeys,
  updateProjectCanvas,
  type ProjectCanvas,
  type ProjectCanvasCreatePayload,
} from "../api";

type UseWorkspaceCanvasesOptions = {
  projectId: number;
  activeCanvasId: number;
  onBeforeSwitch?: () => void | Promise<void>;
};

export function useWorkspaceCanvases({
  projectId,
  activeCanvasId,
  onBeforeSwitch,
}: UseWorkspaceCanvasesOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [autoRenameCanvasId, setAutoRenameCanvasId] = useState<number | null>(null);

  const canvasesQuery = useQuery({
    queryKey: projectsQueryKeys.canvases(projectId),
    queryFn: () => fetchProjectCanvases(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const invalidateCanvases = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.canvases(projectId),
    });
  }, [projectId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (payload: ProjectCanvasCreatePayload) =>
      createProjectCanvas(projectId, payload),
    onSuccess: async (created) => {
      await invalidateCanvases();
      setAutoRenameCanvasId(created.canvas_id);
      await onBeforeSwitch?.();
      navigate(`/projects/${projectId}/workspace/${created.canvas_id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      canvasId,
      name,
      isDefault,
    }: {
      canvasId: number;
      name?: string;
      isDefault?: boolean;
    }) =>
      updateProjectCanvas(projectId, canvasId, {
        ...(name !== undefined ? { name } : {}),
        ...(isDefault !== undefined ? { is_default: isDefault } : {}),
      }),
    onSuccess: invalidateCanvases,
  });

  const deleteMutation = useMutation({
    mutationFn: (canvasId: number) => deleteProjectCanvas(projectId, canvasId),
    onSuccess: async (_result, deletedCanvasId) => {
      await invalidateCanvases();
      if (deletedCanvasId === activeCanvasId) {
        const remaining =
          queryClient
            .getQueryData<ProjectCanvas[]>(projectsQueryKeys.canvases(projectId))
            ?.filter((canvas) => canvas.canvas_id !== deletedCanvasId) ?? [];
        const fallback =
          remaining.find((canvas) => canvas.is_default) ?? remaining[0];
        if (fallback) {
          navigate(`/projects/${projectId}/workspace/${fallback.canvas_id}`);
        }
      }
    },
  });

  const switchCanvas = useCallback(
    async (canvasId: number) => {
      if (canvasId === activeCanvasId) {
        return;
      }
      await onBeforeSwitch?.();
      navigate(`/projects/${projectId}/workspace/${canvasId}`);
    },
    [activeCanvasId, navigate, onBeforeSwitch, projectId],
  );

  const createCanvas = useCallback(
    (payload: ProjectCanvasCreatePayload = {}) => {
      createMutation.mutate(payload);
    },
    [createMutation],
  );

  const renameCanvas = useCallback(
    (canvasId: number, name: string) => {
      updateMutation.mutate({ canvasId, name });
    },
    [updateMutation],
  );

  const setDefaultCanvas = useCallback(
    (canvasId: number) => {
      updateMutation.mutate({ canvasId, isDefault: true });
    },
    [updateMutation],
  );

  const deleteCanvas = useCallback(
    (canvasId: number) => {
      deleteMutation.mutate(canvasId);
    },
    [deleteMutation],
  );

  const clearAutoRenameCanvas = useCallback(() => {
    setAutoRenameCanvasId(null);
  }, []);

  return {
    canvases: canvasesQuery.data ?? [],
    isLoading: canvasesQuery.isLoading,
    isError: canvasesQuery.isError,
    refetch: canvasesQuery.refetch,
    createCanvas,
    renameCanvas,
    setDefaultCanvas,
    deleteCanvas,
    switchCanvas,
    createPending: createMutation.isPending,
    updatePending: updateMutation.isPending,
    deletePending: deleteMutation.isPending,
    autoRenameCanvasId,
    clearAutoRenameCanvas,
  };
}
