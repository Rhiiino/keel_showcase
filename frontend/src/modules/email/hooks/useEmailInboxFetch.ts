// keel_web/src/modules/email/hooks/useEmailInboxFetch.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../../../lib/api";
import { fetchSettings, patchSettings, settingsKeys } from "../../settings/api";
import {
  fetchEmailMessageDetail,
  fetchEmailMessages,
  type EmailMessageDetail,
  type EmailMessageSummary,
} from "../api";
import {
  defaultEmailInboxFetchFilters,
  emailInboxFetchFiltersFromPreferences,
  emailInboxFetchFiltersToPayload,
  emailInboxFetchFiltersToPreferences,
  type EmailInboxFetchFilters,
} from "../lib/emailInboxDisplay";

type UseEmailInboxFetchOptions = {
  accountId: number | string;
  enabled?: boolean;
};

export function useEmailInboxFetch({ accountId, enabled = true }: UseEmailInboxFetchOptions) {
  const queryClient = useQueryClient();
  const accountIdString = String(accountId);
  const [filters, setFilters] = useState<EmailInboxFetchFilters>(defaultEmailInboxFetchFilters());
  const [messages, setMessages] = useState<EmailMessageSummary[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    enabled,
  });

  useEffect(() => {
    setMessages([]);
    setHasFetched(false);
    setSelectedMessageId(null);
    setFiltersHydrated(false);
    setFilters(defaultEmailInboxFetchFilters());
  }, [accountIdString]);

  useEffect(() => {
    if (!enabled || filtersHydrated || !settingsQuery.data) {
      return;
    }

    const saved = settingsQuery.data.data.email?.lastFetchFilters?.[accountIdString];
    setFilters(emailInboxFetchFiltersFromPreferences(saved));
    setFiltersHydrated(true);
  }, [accountIdString, enabled, filtersHydrated, settingsQuery.data]);

  const fetchMutation = useMutation({
    mutationFn: async () => {
      const payload = emailInboxFetchFiltersToPayload(filters);
      return fetchEmailMessages(accountIdString, payload);
    },
    onSuccess: async (response) => {
      setMessages(response.messages);
      setHasFetched(true);

      const currentSettings = settingsQuery.data ?? (await fetchSettings());
      const existingFilters = currentSettings.data.email?.lastFetchFilters ?? {};
      await patchSettings({
        email: {
          lastFetchFilters: {
            ...existingFilters,
            [accountIdString]: emailInboxFetchFiltersToPreferences(filters),
          },
        },
      });
      void queryClient.invalidateQueries({ queryKey: settingsKeys.root() });
    },
  });

  const detailQuery = useQuery({
    queryKey: selectedMessageId
      ? ["email", "message-detail", accountIdString, selectedMessageId]
      : ["email", "message-detail", "idle"],
    queryFn: () => fetchEmailMessageDetail(accountIdString, selectedMessageId as string),
    enabled: Boolean(selectedMessageId),
  });

  const fetchError = fetchMutation.isError
    ? fetchMutation.error instanceof ApiError
      ? fetchMutation.error.message
      : fetchMutation.error instanceof Error
        ? fetchMutation.error.message
        : "Failed to fetch messages."
    : null;

  const detailError = detailQuery.isError
    ? detailQuery.error instanceof ApiError
      ? detailQuery.error.message
      : detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "Failed to load message."
    : null;

  const openMessage = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
  }, []);

  const closeMessage = useCallback(() => {
    setSelectedMessageId(null);
  }, []);

  const selectedSummary = messages.find((message) => message.id === selectedMessageId) ?? null;

  return {
    filters,
    setFilters,
    messages,
    hasFetched,
    fetchMessages: () => fetchMutation.mutateAsync(),
    isFetching: fetchMutation.isPending,
    fetchError,
    selectedMessageId,
    selectedSummary,
    selectedDetail: (detailQuery.data ?? null) as EmailMessageDetail | null,
    isDetailLoading: detailQuery.isLoading,
    detailError,
    openMessage,
    closeMessage,
    isSettingsLoading: settingsQuery.isLoading,
  };
}
