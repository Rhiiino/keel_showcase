// keel_web/src/app/navigation/useNavigationBreadcrumbMaxEntries.ts

// Reads the breadcrumb max from settings cache with a localStorage fallback.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { fetchSettings, settingsKeys } from "../../modules/settings/api";
import {
  readNavigationBreadcrumbMaxEntriesFromCache,
  readStoredNavBreadcrumbMaxEntries,
  resolveNavigationBreadcrumbMaxEntries,
  writeStoredNavBreadcrumbMaxEntries,
} from "./breadcrumbMaxEntries";

export function useNavigationBreadcrumbMaxEntries(): number {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  return useMemo(() => {
    const fromServer = settingsQuery.data?.data.nav_breadcrumb_max_entries;
    if (typeof fromServer === "number") {
      writeStoredNavBreadcrumbMaxEntries(fromServer);
      return resolveNavigationBreadcrumbMaxEntries(fromServer);
    }
    return readNavigationBreadcrumbMaxEntriesFromCache(queryClient);
  }, [
    queryClient,
    settingsQuery.data?.data.nav_breadcrumb_max_entries,
    settingsQuery.dataUpdatedAt,
  ]);
}

export function useNavigationBreadcrumbMaxEntriesRefValue(): () => number {
  const queryClient = useQueryClient();
  return useCallback(
    () => readNavigationBreadcrumbMaxEntriesFromCache(queryClient),
    [queryClient],
  );
}

export { readStoredNavBreadcrumbMaxEntries };
