// keel_web/src/modules/settings/components/GeneralSettingsTabPanel.tsx

// Settings tab panel wrapper — loads user context for the general settings tab.

import { useQuery } from "@tanstack/react-query";

import type { SettingsTabPanelProps } from "../../../app/modules/settingsTabTypes";
import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
} from "../../auth/api";
import { GeneralSettingsTab } from "./GeneralSettingsTab";

export function GeneralSettingsTabPanel({
  nameDraft,
  onNameDraftChange,
  nameEditDisabled,
}: SettingsTabPanelProps) {
  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  return (
    <GeneralSettingsTab
      user={user ?? undefined}
      nameDraft={nameDraft}
      onNameDraftChange={onNameDraftChange}
      nameEditDisabled={nameEditDisabled}
    />
  );
}
