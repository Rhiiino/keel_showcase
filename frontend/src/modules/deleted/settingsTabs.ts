// keel_web/src/modules/deleted/settingsTabs.ts

// Recently deleted settings tab contribution for the module manifest.

import type { SettingsTabDefinition } from "../../app/modules/settingsTabTypes";
import { RecentlyDeletedSettingsTab } from "./components/RecentlyDeletedSettingsTab";

export const deletedSettingsTabs: SettingsTabDefinition[] = [
  {
    id: "recently-deleted",
    title: "Recently Deleted",
    description: "Restore or permanently delete trashed records.",
    Panel: RecentlyDeletedSettingsTab,
  },
];
