// keel_web/src/modules/coak/hooks/workspace/useCoakConfigurationSettings.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  coakQueryKeys,
  fetchCoakConfigurationSettings,
  updateCoakConfigurationSettings,
  type CoakConfigurationSettings,
  type CoakConfigurationSettingsPayload,
} from "../../api";

const SAVE_DEBOUNCE_MS = 400;

type ConfigurationSettingsSnapshot = {
  settings: Record<string, unknown>;
};

function toPayload(snapshot: ConfigurationSettingsSnapshot): CoakConfigurationSettingsPayload {
  return { settings: snapshot.settings };
}

function stableSerialize(snapshot: ConfigurationSettingsSnapshot): string {
  return JSON.stringify(toPayload(snapshot));
}

function snapshotFromSettings(
  settings: CoakConfigurationSettings,
): ConfigurationSettingsSnapshot {
  return { settings: settings.settings };
}

export function useCoakConfigurationSettings(recordId: number) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: coakQueryKeys.configurationSettings(recordId),
    queryFn: () => fetchCoakConfigurationSettings(recordId),
  });

  const [snapshot, setSnapshot] = useState<ConfigurationSettingsSnapshot>({ settings: {} });
  const [hydrated, setHydrated] = useState(false);
  const lastSavedRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.data || hydrated) {
      return;
    }
    const next = snapshotFromSettings(query.data);
    setSnapshot(next);
    lastSavedRef.current = stableSerialize(next);
    setHydrated(true);
  }, [hydrated, query.data]);

  const scheduleSave = useCallback(
    (next: ConfigurationSettingsSnapshot) => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        const serialized = stableSerialize(next);
        if (serialized === lastSavedRef.current) {
          return;
        }

        void updateCoakConfigurationSettings(recordId, toPayload(next))
          .then((saved) => {
            lastSavedRef.current = stableSerialize(snapshotFromSettings(saved));
            queryClient.setQueryData(coakQueryKeys.configurationSettings(recordId), saved);
          })
          .catch(() => {
            // Keep local state; a later edit will retry.
          });
      }, SAVE_DEBOUNCE_MS);
    },
    [queryClient, recordId],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const commitSnapshot = useCallback(
    (updater: (current: ConfigurationSettingsSnapshot) => ConfigurationSettingsSnapshot) => {
      setSnapshot((current) => {
        const next = updater(current);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateConfigurationSetting = useCallback(
    (key: string, value: unknown) => {
      commitSnapshot((current) => ({
        settings: {
          ...current.settings,
          [key]: value,
        },
      }));
    },
    [commitSnapshot],
  );

  return {
    configurationSettings: snapshot.settings,
    configurationSettingsHydrated: hydrated && !query.isLoading,
    updateConfigurationSetting,
    isLoading: query.isLoading,
  };
}
