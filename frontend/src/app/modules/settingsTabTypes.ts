// keel_web/src/app/modules/settingsTabTypes.ts

// Shared settings tab registry types (used by manifests and the settings page).

import type { ComponentType } from "react";

import type { SettingsTabId } from "../../modules/settings/lib/config";

export type SettingsTabPanelProps = {
  nameDraft: string;
  onNameDraftChange: (nextName: string) => void;
  nameEditDisabled: boolean;
};

export type SettingsTabDefinition = {
  id: SettingsTabId;
  title: string;
  description: string;
  Panel: ComponentType<SettingsTabPanelProps>;
};
