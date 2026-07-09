// keel_web/src/modules/games/hooks/useGameSession.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import {
  completeGameSession,
  createGameSession,
  gamesQueryKeys,
  patchGameSession,
  restartGameSession,
  type GameSession,
  type GameSessionCompleteResult,
} from "../api";

const AUTOSAVE_DEBOUNCE_MS = 400;

type UseGameSessionOptions = {
  gameKey: string;
  sessionId: string | null;
};

export function useGameSession({ gameKey, sessionId }: UseGameSessionOptions) {
  const queryClient = useQueryClient();
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<{
    sessionId: string;
    state: Record<string, unknown>;
    move_count: number;
  } | null>(null);

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all });
  }, [queryClient]);

  const startMutation = useMutation({
    mutationFn: (level: number) => createGameSession(gameKey, level),
    onSuccess: invalidateAll,
  });

  const patchMutation = useMutation({
    mutationFn: (payload: { sessionId: string; state: Record<string, unknown>; move_count: number }) =>
      patchGameSession(payload.sessionId, {
        state: payload.state,
        move_count: payload.move_count,
      }),
    onSuccess: invalidateAll,
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { sessionId: string; state: Record<string, unknown>; move_count: number }) =>
      completeGameSession(payload.sessionId, {
        state: payload.state,
        move_count: payload.move_count,
      }),
    onSuccess: invalidateAll,
  });

  const restartMutation = useMutation({
    mutationFn: (id: string) => restartGameSession(id),
    onSuccess: invalidateAll,
  });

  const flushSave = useCallback(async () => {
    const pending = pendingSaveRef.current;
    if (!pending) {
      return;
    }
    pendingSaveRef.current = null;
    await patchMutation.mutateAsync({
      sessionId: pending.sessionId,
      state: pending.state,
      move_count: pending.move_count,
    });
  }, [patchMutation]);

  const queueSave = useCallback(
    (state: Record<string, unknown>, moveCount: number) => {
      if (!sessionId) {
        return;
      }
      pendingSaveRef.current = { sessionId, state, move_count: moveCount };
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        void flushSave();
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [flushSave, sessionId],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const startLevel = useCallback(
    async (level: number): Promise<GameSession> => startMutation.mutateAsync(level),
    [startMutation],
  );

  const completeLevel = useCallback(
    async (
      state: Record<string, unknown>,
      moveCount: number,
    ): Promise<GameSessionCompleteResult> => {
      if (!sessionId) {
        throw new Error("No active session.");
      }
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      pendingSaveRef.current = null;
      return completeMutation.mutateAsync({
        sessionId,
        state,
        move_count: moveCount,
      });
    },
    [completeMutation, sessionId],
  );

  const restartLevel = useCallback(async (): Promise<GameSession> => {
    if (!sessionId) {
      throw new Error("No active session.");
    }
    return restartMutation.mutateAsync(sessionId);
  }, [restartMutation, sessionId]);

  return {
    startLevel,
    queueSave,
    flushSave,
    completeLevel,
    restartLevel,
    isStarting: startMutation.isPending,
    isRestarting: restartMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
}
