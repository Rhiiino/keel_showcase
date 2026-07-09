// keel_web/src/modules/settings/lib/config/settingsTabsConfig.ts

// Tab identifiers for the settings page.

export type SettingsTabId =
  | "general"
  | "home-cards"
  | "themes"
  | "animations"
  | "recently-deleted";

export const DEFAULT_SETTINGS_TAB_ID: SettingsTabId = "general";
