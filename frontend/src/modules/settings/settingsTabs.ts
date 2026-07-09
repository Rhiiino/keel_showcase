// keel_web/src/modules/settings/settingsTabs.ts

// Core settings sidebar tab contributions for the module manifest.

import type { SettingsTabDefinition } from "../../app/modules/settingsTabTypes";
import { AnimationsSettingsTab } from "./components/AnimationsSettingsTab";
import { GeneralSettingsTabPanel } from "./components/GeneralSettingsTabPanel";
import { HomeCardsSettingsTab } from "./components/HomeCardsSettingsTab";
import { ThemesSettingsTab } from "./components/ThemesSettingsTab";

export const settingsCoreTabs: SettingsTabDefinition[] = [
  {
    id: "general",
    title: "General",
    description: "Transitions and motion.",
    Panel: GeneralSettingsTabPanel,
  },
  {
    id: "home-cards",
    title: "Home Cards",
    description: "Show or hide home dashboard cards.",
    Panel: HomeCardsSettingsTab,
  },
  {
    id: "themes",
    title: "Themes",
    description: "Global color palettes.",
    Panel: ThemesSettingsTab,
  },
  {
    id: "animations",
    title: "Animations",
    description: "Registered Keel Persona clips and quips.",
    Panel: AnimationsSettingsTab,
  },
];
