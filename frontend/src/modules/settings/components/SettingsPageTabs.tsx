// keel_web/src/modules/settings/components/SettingsPageTabs.tsx

// Vertical tab list for the settings page.

import type { SettingsTabDefinition } from "./settingsTabRegistry";
import type { SettingsTabId } from "../lib/config";

type SettingsPageTabsProps = {
  tabs: SettingsTabDefinition[];
  activeId: SettingsTabId;
  onSelect: (id: SettingsTabId) => void;
};

export function SettingsPageTabs({ tabs, activeId, onSelect }: SettingsPageTabsProps) {
  return (
    <nav className="flex w-44 shrink-0 flex-col gap-0.5" aria-label="Settings sections">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tab.id)}
            className={[
              "rounded-lg px-3 py-2.5 text-left text-sm transition",
              active
                ? "bg-stone-800/80 font-semibold text-stone-50 ring-1 ring-stone-700/80"
                : "text-stone-400 hover:bg-stone-900/80 hover:text-stone-200",
            ].join(" ")}
          >
            {tab.title}
          </button>
        );
      })}
    </nav>
  );
}
