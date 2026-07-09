// keel_web/src/modules/home/cards/quotes/HomeQuoteCard.tsx

// Rotating inspirational quote bank card for the home dashboard.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  DEFAULT_HOME_QUOTE_INTERVAL_SECONDS,
  resolveHomeQuoteIntervalSeconds,
} from "../../lib/quoteInterval";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../../../settings/api";
import { fetchQuotes, homeKeys } from "../../api";
import { HomeQuoteDisplay, quoteAccentBorderClass } from "./HomeQuoteDisplay";
import { HomeQuoteIntervalEditor } from "./HomeQuoteIntervalEditor";
import { FALLBACK_QUOTE } from "./lib/fallbackQuote";

export function HomeQuoteCard() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const quotesQuery = useQuery({
    queryKey: homeKeys.quotes(),
    queryFn: fetchQuotes,
  });

  const quoteIntervalSeconds = resolveHomeQuoteIntervalSeconds(
    settingsQuery.data?.data.home_quote_interval_seconds,
  );

  const saveIntervalMutation = useMutation({
    mutationFn: (nextSeconds: number) =>
      patchSettings({
        home_quote_interval_seconds:
          nextSeconds === DEFAULT_HOME_QUOTE_INTERVAL_SECONDS
            ? null
            : nextSeconds,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.root(), updated);
      setIsEditing(false);
    },
  });

  const quotes =
    quotesQuery.data && quotesQuery.data.length > 0
      ? quotesQuery.data
      : [FALLBACK_QUOTE];

  const isBusy =
    saveIntervalMutation.isPending
    || settingsQuery.isLoading
    || settingsQuery.isFetching;

  if (isEditing) {
    return (
      <HomeQuoteIntervalEditor
        intervalSeconds={quoteIntervalSeconds}
        accentBorderClass={quoteAccentBorderClass(0)}
        disabled={isBusy}
        isSaving={saveIntervalMutation.isPending}
        onCancel={() => setIsEditing(false)}
        onSave={(nextSeconds) => saveIntervalMutation.mutate(nextSeconds)}
      />
    );
  }

  return (
    <HomeQuoteDisplay
      quotes={quotes}
      intervalSeconds={quoteIntervalSeconds}
      onEdit={() => setIsEditing(true)}
      editDisabled={isBusy}
    />
  );
}
