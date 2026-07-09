// keel_web/src/modules/focus/hooks/automation/useFocusAutomationSession.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  createFocusAutomationSession,
  fetchFocusAutomationSession,
  revokeFocusAutomationSession,
  type FocusAutomationSession,
} from "../../api/automation";
import { focusQueryKeys } from "../../api/queryKeys";

export function useFocusAutomationSession() {
  const queryClient = useQueryClient();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const sessionQuery = useQuery({
    queryKey: focusQueryKeys.automationSession(),
    queryFn: fetchFocusAutomationSession,
  });

  const session = sessionQuery.data ?? null;
  const isLive = Boolean(session && !session.revoked);

  const startMutation = useMutation({
    mutationFn: () => createFocusAutomationSession(),
    onSuccess: (created) => {
      setSessionToken(created.token);
      setTokenModalOpen(true);
      const { token: _discardedToken, ...sessionWithoutToken } = created;
      queryClient.setQueryData(
        focusQueryKeys.automationSession(),
        sessionWithoutToken satisfies FocusAutomationSession,
      );
    },
  });

  const endMutation = useMutation({
    mutationFn: revokeFocusAutomationSession,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: focusQueryKeys.automationSession() });
      queryClient.setQueryData(focusQueryKeys.automationSession(), null);
    },
    onSuccess: () => {
      setSessionToken(null);
      setTokenModalOpen(false);
      queryClient.setQueryData(focusQueryKeys.automationSession(), null);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: focusQueryKeys.automationSession() });
    },
  });

  const startSession = useCallback(async () => {
    await startMutation.mutateAsync();
  }, [startMutation]);

  const endSession = useCallback(async () => {
    await endMutation.mutateAsync();
  }, [endMutation]);

  const toggleSession = useCallback(async () => {
    if (isLive) {
      await endSession();
      return;
    }
    await startSession();
  }, [endSession, isLive, startSession]);

  return {
    session,
    isLive,
    sessionToken,
    tokenModalOpen,
    setTokenModalOpen,
    isStarting: startMutation.isPending,
    isEnding: endMutation.isPending,
    isBusy: startMutation.isPending || endMutation.isPending,
    startSession,
    endSession,
    toggleSession,
    refreshSession: sessionQuery.refetch,
  };
}
