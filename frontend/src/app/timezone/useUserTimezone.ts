// keel_web/src/app/timezone/useUserTimezone.ts

// Reads the user's preferred timezone from settings with local fallback.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchSettings, settingsKeys } from "../../modules/settings/api";
import {
  readUserTimezoneFromCache,
  syncActiveUserTimezone,
} from "./userTimezone";

export function useUserTimezone(): string {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  return useMemo(() => {
    const fromServer = settingsQuery.data?.data.timezone;
    if (typeof fromServer === "string" && fromServer.trim()) {
      return syncActiveUserTimezone(fromServer);
    }
    const resolved = readUserTimezoneFromCache(queryClient);
    syncActiveUserTimezone(resolved);
    return resolved;
  }, [queryClient, settingsQuery.data?.data.timezone, settingsQuery.dataUpdatedAt]);
}

export { detectBrowserTimezone, readStoredUserTimezone, resolveUserTimezone } from "./userTimezone";
