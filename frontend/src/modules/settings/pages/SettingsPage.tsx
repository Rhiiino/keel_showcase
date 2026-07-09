// keel_web/src/modules/settings/pages/SettingsPage.tsx

// Global app settings with a tabbed layout.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { InlineSaveDiscardActions } from "../../../components/InlineSaveDiscardActions";
import { AppShellContent } from "../../../app/shell/AppShellContent";
import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
  patchCurrentUser,
} from "../../auth/api";
import { SettingsPageTabs } from "../components/SettingsPageTabs";
import { getSettingsTabs } from "../components/settingsTabRegistry";
import {
  DEFAULT_SETTINGS_TAB_ID,
  type SettingsTabId,
} from "../lib/config";

function SettingsTabPanel({
  tabId,
  nameDraft,
  onNameDraftChange,
  nameEditDisabled,
}: {
  tabId: SettingsTabId;
  nameDraft: string;
  onNameDraftChange: (nextName: string) => void;
  nameEditDisabled: boolean;
}) {
  const tab = getSettingsTabs().find((entry) => entry.id === tabId);
  if (!tab) {
    return null;
  }

  const Panel = tab.Panel;
  return (
    <Panel
      nameDraft={nameDraft}
      onNameDraftChange={onNameDraftChange}
      nameEditDisabled={nameEditDisabled}
    />
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>(DEFAULT_SETTINGS_TAB_ID);
  const activeTab = getSettingsTabs().find((tab) => tab.id === activeTabId);

  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (user) {
      setNameDraft(user.display_name);
    }
  }, [user?.display_name, user?.id]);

  const isNameDirty = useMemo(() => {
    if (!user) {
      return false;
    }
    return nameDraft.trim() !== user.display_name;
  }, [nameDraft, user]);

  const canSaveName = nameDraft.trim().length > 0;

  const saveNameMutation = useMutation({
    mutationFn: () =>
      patchCurrentUser({ display_name: nameDraft.trim() }),
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(authKeys.me(), updatedUser);
      setNameDraft(updatedUser.display_name);
    },
  });

  const handleDiscardName = () => {
    if (user) {
      setNameDraft(user.display_name);
    }
    saveNameMutation.reset();
  };

  const handleSaveName = () => {
    if (!canSaveName || !isNameDirty) {
      return;
    }
    saveNameMutation.mutate();
  };

  const showProfileActions = activeTabId === "general" && isNameDirty;

  return (
    <AppShellContent>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
        <header className="flex shrink-0 items-start justify-between gap-4 overflow-visible">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-50">
              Settings
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Global app preferences. More categories will appear here over time.
            </p>
          </div>
          <InlineSaveDiscardActions
            visible={showProfileActions}
            onDiscard={handleDiscardName}
            onSave={handleSaveName}
            isSaving={saveNameMutation.isPending}
            canSave={canSaveName}
            saveError={
              saveNameMutation.isError
                ? saveNameMutation.error.message
                : null
            }
          />
        </header>

        <div className="flex min-h-0 flex-1 gap-8 overflow-hidden">
          <SettingsPageTabs
            tabs={getSettingsTabs()}
            activeId={activeTabId}
            onSelect={setActiveTabId}
          />

          <div
            role="tabpanel"
            aria-label={activeTab?.title ?? "Settings"}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-stone-800/60 pl-8"
          >
            <SettingsTabPanel
              tabId={activeTabId}
              nameDraft={nameDraft}
              onNameDraftChange={setNameDraft}
              nameEditDisabled={saveNameMutation.isPending}
            />
          </div>
        </div>
      </div>
    </AppShellContent>
  );
}
