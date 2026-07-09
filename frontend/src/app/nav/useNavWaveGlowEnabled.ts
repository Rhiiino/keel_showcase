// keel_web/src/app/nav/useNavWaveGlowEnabled.ts

// Reads nav wave glow preference from settings cache with a localStorage fallback.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchSettings, settingsKeys } from "../../modules/settings/api";
import {
  readNavWaveGlowEnabledFromCache,
  resolveNavWaveGlowEnabled,
  writeStoredNavWaveGlowEnabled,
} from "./navWaveGlow";

export function useNavWaveGlowEnabled(): boolean {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  return useMemo(() => {
    const fromServer = settingsQuery.data?.data.nav_wave_glow_enabled;
    if (typeof fromServer === "boolean") {
      writeStoredNavWaveGlowEnabled(fromServer);
      return resolveNavWaveGlowEnabled(fromServer);
    }
    return readNavWaveGlowEnabledFromCache(queryClient);
  }, [
    queryClient,
    settingsQuery.data?.data.nav_wave_glow_enabled,
    settingsQuery.dataUpdatedAt,
  ]);
}
