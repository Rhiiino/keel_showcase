// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsTab.tsx

import { useRef } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { useCoakSettingsSearch } from "../../../hooks/tabs/settings/useCoakSettingsSearch";
import {
  COAK_CONFIGURATION_CONNECTION_COLOR_KEY,
  readCoakConnectionColor,
} from "../../../lib/tabs/settings/coakConnectionSettings";
import {
  COAK_CONFIGURATION_CONNECTION_WIDTH_KEY,
  clampCoakConnectionWidth,
  readCoakConnectionWidth,
} from "../../../lib/tabs/settings/coakConnectionWidthSettings";
import {
  COAK_CONFIGURATION_CONSTELLATION_BACKGROUND_KEY,
  readCoakConstellationBackgroundPreset,
} from "../../../lib/tabs/settings/coakBackgroundSettings";
import {
  COAK_CONFIGURATION_TITLE_COLOR_KEY,
  readCoakTitleColor,
} from "../../../lib/tabs/settings/coakTitleColorSettings";
import { CoakAutoOptimizeSettingsSection } from "./CoakAutoOptimizeSettingsSection";
import { CoakBackgroundPresetPicker } from "./CoakBackgroundPresetPicker";
import { CoakConnectionColorToggle } from "./CoakConnectionColorToggle";
import { CoakConnectionWidthSlider } from "./CoakConnectionWidthSlider";
import {
  COAK_CONFIGURATION_ITEM_EDITOR_ENLARGE_KEY,
  readCoakItemEditorEnlargeEnabled,
} from "../../../lib/tabs/settings/coakItemEditorEnlargeSettings";
import {
  COAK_CONFIGURATION_ORIGIN_PULSE_KEY,
  readCoakOriginPulseEnabled,
} from "../../../lib/tabs/settings/coakOriginPulseSettings";
import {
  COAK_CONFIGURATION_NODE_REVOLVE_SPEED_KEY,
  clampCoakNodeRevolveSpeed,
  readCoakNodeRevolveSpeed,
} from "../../../lib/tabs/settings/coakNodeRevolveSpeedSettings";
import {
  COAK_CONFIGURATION_PERSISTENT_NODE_MODALS_KEY,
  readCoakPersistentNodeModalsEnabled,
} from "../../../lib/tabs/settings/coakPersistentNodeModalsSettings";
import { CoakItemEditorEnlargeToggle } from "./CoakItemEditorEnlargeToggle";
import { CoakNodeRevolveSpeedSlider } from "./CoakNodeRevolveSpeedSlider";
import { CoakNodeVisualSettingsSection } from "./CoakNodeVisualSettingsSection";
import { CoakOriginPulseToggle } from "./CoakOriginPulseToggle";
import { CoakPersistentNodeModalsToggle } from "./CoakPersistentNodeModalsToggle";
import { CoakSettingsSearchBar } from "./CoakSettingsSearchBar";
import { CoakSettingsSearchProvider } from "./CoakSettingsSearchContext";
import { CoakSettingsSearchTarget } from "./CoakSettingsSearchTarget";
import { CoakSettingsSectionCard } from "./CoakSettingsSectionCard";
import { CoakTitleColorToggle } from "./CoakTitleColorToggle";

export function CoakSettingsTab() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    configurationSettings,
    configurationSettingsHydrated,
    updateConfigurationSetting,
  } = useCoakRecordWorkspace();
  const {
    query,
    setQuery,
    matchIds,
    matchIndex,
    activeMatchId,
    cycleMatch,
  } = useCoakSettingsSearch(scrollContainerRef);

  const connectionColor = readCoakConnectionColor(configurationSettings);
  const connectionWidth = readCoakConnectionWidth(configurationSettings);
  const titleColor = readCoakTitleColor(configurationSettings);
  const backgroundPreset = readCoakConstellationBackgroundPreset(configurationSettings);
  const persistentNodeModalsEnabled = readCoakPersistentNodeModalsEnabled(configurationSettings);
  const itemEditorEnlargeEnabled = readCoakItemEditorEnlargeEnabled(configurationSettings);
  const originPulseEnabled = readCoakOriginPulseEnabled(configurationSettings);
  const nodeRevolveSpeed = readCoakNodeRevolveSpeed(configurationSettings);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-stone-900/95">
      <div className="shrink-0 border-b border-stone-800/70 bg-stone-900/95 px-4 py-3 backdrop-blur-sm">
        <CoakSettingsSearchBar
          value={query}
          disabled={!configurationSettingsHydrated}
          matchCount={matchIds.length}
          matchIndex={matchIndex}
          onChange={setQuery}
          onPrevious={() => cycleMatch(-1)}
          onNext={() => cycleMatch(1)}
        />
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {!configurationSettingsHydrated ? (
          <p className="text-xs text-stone-500">Loading settings…</p>
        ) : (
          <CoakSettingsSearchProvider
            activeMatchId={activeMatchId}
            hasActiveQuery={query.trim().length > 0}
          >
            <section className="space-y-4">
              <CoakSettingsSectionCard
                title="Connection appearance"
                searchId="section-connection-appearance"
              >
                <CoakSettingsSearchTarget id="connection-color">
                  <CoakConnectionColorToggle
                    value={connectionColor}
                    onChange={(color) =>
                      updateConfigurationSetting(COAK_CONFIGURATION_CONNECTION_COLOR_KEY, color)
                    }
                  />
                </CoakSettingsSearchTarget>
                <CoakSettingsSearchTarget id="title-color">
                  <CoakTitleColorToggle
                    value={titleColor}
                    onChange={(color) =>
                      updateConfigurationSetting(COAK_CONFIGURATION_TITLE_COLOR_KEY, color)
                    }
                  />
                </CoakSettingsSearchTarget>
                <CoakSettingsSearchTarget id="connection-width">
                  <CoakConnectionWidthSlider
                    value={connectionWidth}
                    onChange={(width) =>
                      updateConfigurationSetting(
                        COAK_CONFIGURATION_CONNECTION_WIDTH_KEY,
                        clampCoakConnectionWidth(width),
                      )
                    }
                  />
                </CoakSettingsSearchTarget>
                <CoakSettingsSearchTarget id="origin-pulse">
                  <CoakOriginPulseToggle
                    value={originPulseEnabled}
                    onChange={(enabled) =>
                      updateConfigurationSetting(COAK_CONFIGURATION_ORIGIN_PULSE_KEY, enabled)
                    }
                  />
                </CoakSettingsSearchTarget>
                <CoakSettingsSearchTarget id="node-revolve-speed">
                  <CoakNodeRevolveSpeedSlider
                    value={nodeRevolveSpeed}
                    onChange={(speed) =>
                      updateConfigurationSetting(
                        COAK_CONFIGURATION_NODE_REVOLVE_SPEED_KEY,
                        clampCoakNodeRevolveSpeed(speed),
                      )
                    }
                  />
                </CoakSettingsSearchTarget>
              </CoakSettingsSectionCard>

              <CoakSettingsSectionCard
                title="Auto-optimize layout"
                searchId="section-auto-optimize-layout"
              >
                <CoakAutoOptimizeSettingsSection />
              </CoakSettingsSectionCard>

              <CoakSettingsSectionCard
                title="Constellation background"
                searchId="section-constellation-background"
              >
                <CoakSettingsSearchTarget id="constellation-background">
                  <CoakBackgroundPresetPicker
                    value={backgroundPreset}
                    onChange={(preset) =>
                      updateConfigurationSetting(
                        COAK_CONFIGURATION_CONSTELLATION_BACKGROUND_KEY,
                        preset,
                      )
                    }
                  />
                </CoakSettingsSearchTarget>
              </CoakSettingsSectionCard>

              <CoakSettingsSectionCard
                title="Constellation editors"
                searchId="section-constellation-editors"
              >
                <CoakSettingsSearchTarget id="persistent-node-modals">
                  <CoakPersistentNodeModalsToggle
                    value={persistentNodeModalsEnabled}
                    onChange={(enabled) =>
                      updateConfigurationSetting(
                        COAK_CONFIGURATION_PERSISTENT_NODE_MODALS_KEY,
                        enabled,
                      )
                    }
                  />
                </CoakSettingsSearchTarget>
                <CoakSettingsSearchTarget id="item-editor-enlarge">
                  <CoakItemEditorEnlargeToggle
                    value={itemEditorEnlargeEnabled}
                    onChange={(enabled) =>
                      updateConfigurationSetting(
                        COAK_CONFIGURATION_ITEM_EDITOR_ENLARGE_KEY,
                        enabled,
                      )
                    }
                  />
                </CoakSettingsSearchTarget>
              </CoakSettingsSectionCard>

              <CoakSettingsSectionCard title="Node visuals" searchId="section-node-visuals">
                <CoakNodeVisualSettingsSection />
              </CoakSettingsSectionCard>
            </section>
          </CoakSettingsSearchProvider>
        )}
      </div>
    </div>
  );
}
