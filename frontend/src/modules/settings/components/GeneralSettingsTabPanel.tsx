// keel_web/src/modules/settings/components/GeneralSettingsTabPanel.tsx

// Settings tab panel wrapper — loads user context for the general settings tab.

import { useQuery } from "@tanstack/react-query";

import type { SettingsTabPanelProps } from "../../../app/modules/settingsTabTypes";
import {
  authKeys,
  CURRENT_USER_STALE_TIME_MS,
  fetchCurrentUserWithTimeout,
} from "../../auth/api";
import { GeneralSettingsTab } from "./GeneralSettingsTab";

export function GeneralSettingsTabPanel({
  nameDraft,
  onNameDraftChange,
  nameEditDisabled,
}: SettingsTabPanelProps) {
  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchCurrentUserWithTimeout(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  return (
    <GeneralSettingsTab
      user={user}
      nameDraft={nameDraft}
      onNameDraftChange={onNameDraftChange}
      nameEditDisabled={nameEditDisabled}
    />
  );
}
