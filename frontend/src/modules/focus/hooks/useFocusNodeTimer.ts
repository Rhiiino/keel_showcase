// keel_web/src/modules/focus/hooks/useFocusNodeTimer.ts

// Focus node timer queries, mutations, and live elapsed-second display.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  endFocusNodeTimer,
  fetchFocusNodeTimeEntries,
  fetchFocusNodeTimerState,
  focusQueryKeys,
  pauseFocusNodeTimer,
  resumeFocusNodeTimer,
  startFocusNodeTimer,
} from "../api";

type UseFocusNodeTimerParams = {
  nodeId: number;
  historyEnabled: boolean;
};

export function useFocusNodeTimer({
  nodeId,
  historyEnabled,
}: UseFocusNodeTimerParams) {
  const queryClient = useQueryClient();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const timerQuery = useQuery({
    queryKey: focusQueryKeys.nodeTimer(nodeId),
    queryFn: () => fetchFocusNodeTimerState(nodeId),
    enabled: Number.isFinite(nodeId) && nodeId > 0,
  });

  const historyQuery = useQuery({
    queryKey: focusQueryKeys.nodeTimeEntries(nodeId),
    queryFn: () => fetchFocusNodeTimeEntries(nodeId),
    enabled: historyEnabled && Number.isFinite(nodeId) && nodeId > 0,
  });

  const activeEntry = timerQuery.data?.active_entry ?? null;
  const isRunning = activeEntry?.status === "running";

  useEffect(() => {
    if (!isRunning) {
      setNowMs(Date.now());
      return;
    }

    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  const elapsedSeconds = useMemo(() => {
    const base = timerQuery.data?.elapsed_seconds ?? 0;
    if (!isRunning || timerQuery.dataUpdatedAt === 0) {
      return base;
    }
    return base + Math.max(Math.floor((nowMs - timerQuery.dataUpdatedAt) / 1000), 0);
  }, [isRunning, nowMs, timerQuery.data?.elapsed_seconds, timerQuery.dataUpdatedAt]);

  const updateTimerState = (result: Awaited<ReturnType<typeof fetchFocusNodeTimerState>>) => {
    queryClient.setQueryData(focusQueryKeys.nodeTimer(nodeId), result);
    void queryClient.invalidateQueries({ queryKey: focusQueryKeys.nodeTimeEntries(nodeId) });
  };

  const startMutation = useMutation({
    mutationFn: () => startFocusNodeTimer(nodeId),
    onSuccess: updateTimerState,
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseFocusNodeTimer(nodeId),
    onSuccess: updateTimerState,
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeFocusNodeTimer(nodeId),
    onSuccess: updateTimerState,
  });

  const endMutation = useMutation({
    mutationFn: () => endFocusNodeTimer(nodeId),
    onSuccess: updateTimerState,
  });

  const actionError =
    startMutation.error ??
    pauseMutation.error ??
    resumeMutation.error ??
    endMutation.error ??
    null;

  return {
    timerState: timerQuery.data,
    activeEntry,
    elapsedSeconds,
    timeEntries: historyQuery.data ?? [],
    isTimerLoading: timerQuery.isLoading,
    isHistoryLoading: historyQuery.isLoading,
    isHistoryError: historyQuery.isError,
    timerActionPending:
      startMutation.isPending ||
      pauseMutation.isPending ||
      resumeMutation.isPending ||
      endMutation.isPending,
    timerErrorMessage: actionError instanceof Error ? actionError.message : null,
    onStartTimer: () => startMutation.mutate(),
    onPauseTimer: () => pauseMutation.mutate(),
    onResumeTimer: () => resumeMutation.mutate(),
    onEndTimer: () => endMutation.mutate(),
  };
}
