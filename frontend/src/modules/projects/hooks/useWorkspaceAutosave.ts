// stack_sandbox/frontend_web/src/modules/projects/hooks/useWorkspaceAutosave.ts

// Debounced workspace persistence with flush-on-unmount and save status.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { projectsQueryKeys, saveProjectWorkspace } from "../api";
import {
  type ProjectWorkspaceState,
  workspaceStateToPayload,
} from "../lib/workspace";

const DEBOUNCE_MS = 800;

export type WorkspaceSaveStatus = "idle" | "pending" | "saved" | "error";

type UseWorkspaceAutosaveOptions = {
  projectId: number;
  canvasId: number;
  enabled: boolean;
};

export function useWorkspaceAutosave({
  projectId,
  canvasId,
  enabled,
}: UseWorkspaceAutosaveOptions) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<WorkspaceSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef<ProjectWorkspaceState | null>(null);
  const hasLoadedRef = useRef(false);
  const pausedRef = useRef(false);
  const saveEpochRef = useRef(0);

  const mutation = useMutation({
    mutationFn: (state: ProjectWorkspaceState) =>
      saveProjectWorkspace(
        projectId,
        canvasId,
        workspaceStateToPayload(state),
      ),
    onMutate: () => setStatus("pending"),
  });

  const mutateIfCurrent = useCallback(
    (state: ProjectWorkspaceState) => {
      const epoch = saveEpochRef.current;
      mutation.mutate(state, {
        onSuccess: (response) => {
          if (epoch !== saveEpochRef.current) {
            return;
          }
          queryClient.setQueryData(
            projectsQueryKeys.workspace(projectId, canvasId),
            response,
          );
          void queryClient.invalidateQueries({
            queryKey: projectsQueryKeys.canvases(projectId),
          });
          setStatus("saved");
        },
        onError: () => {
          if (epoch !== saveEpochRef.current) {
            return;
          }
          setStatus("error");
        },
      });
    },
    [mutation, canvasId, projectId, queryClient],
  );

  const flushSave = useCallback(() => {
    if (!enabled || !hasLoadedRef.current || !latestStateRef.current) {
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    mutateIfCurrent(latestStateRef.current);
  }, [enabled, mutateIfCurrent]);

  const scheduleSave = useCallback(
    (state: ProjectWorkspaceState) => {
      if (!enabled || pausedRef.current) {
        return;
      }
      hasLoadedRef.current = true;
      latestStateRef.current = state;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (latestStateRef.current) {
          mutateIfCurrent(latestStateRef.current);
        }
      }, DEBOUNCE_MS);
    },
    [enabled, mutateIfCurrent],
  );

  const markLoaded = useCallback(() => {
    hasLoadedRef.current = true;
  }, []);

  const pauseAutosave = useCallback(() => {
    pausedRef.current = true;
    saveEpochRef.current += 1;
    mutation.reset();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [mutation]);

  const resumeAutosave = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const syncFromServer = useCallback((state: ProjectWorkspaceState) => {
    hasLoadedRef.current = true;
    latestStateRef.current = state;
    saveEpochRef.current += 1;
    mutation.reset();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus("saved");
  }, [mutation]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (enabled && hasLoadedRef.current && latestStateRef.current) {
        void saveProjectWorkspace(
          projectId,
          canvasId,
          workspaceStateToPayload(latestStateRef.current),
        );
      }
    };
  }, [canvasId, enabled, projectId]);

  return {
    status,
    scheduleSave,
    flushSave,
    markLoaded,
    pauseAutosave,
    resumeAutosave,
    syncFromServer,
    retry: flushSave,
  };
}
