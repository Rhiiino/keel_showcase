// keel_web/src/modules/coak/components/tabs/settings/CoakAutoOptimizeSettingsSection.tsx

import {
  COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_ANGLE_KEY,
  COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_DISTANCE_KEY,
  COAK_CONFIGURATION_AUTO_OPTIMIZE_LAYOUT_KEY,
  clampCoakAutoOptimizeConnectionAngle,
  clampCoakAutoOptimizeConnectionDistance,
  readCoakAutoOptimizeConnectionAngle,
  readCoakAutoOptimizeConnectionDistance,
  readCoakAutoOptimizeLayoutEnabled,
} from "../../../lib/tabs/settings/coakAutoOptimizeSettings";
import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { CoakAutoOptimizeConnectionAngleSlider } from "./CoakAutoOptimizeConnectionAngleSlider";
import { CoakAutoOptimizeConnectionDistanceSlider } from "./CoakAutoOptimizeConnectionDistanceSlider";
import { CoakAutoOptimizeToggle } from "./CoakAutoOptimizeToggle";
import { CoakSettingsSearchTarget } from "./CoakSettingsSearchTarget";

export function CoakAutoOptimizeSettingsSection() {
  const { configurationSettings, updateConfigurationSetting } = useCoakRecordWorkspace();

  const autoOptimizeLayoutEnabled = readCoakAutoOptimizeLayoutEnabled(configurationSettings);
  const connectionDistance = readCoakAutoOptimizeConnectionDistance(configurationSettings);
  const connectionAngle = readCoakAutoOptimizeConnectionAngle(configurationSettings);

  return (
    <>
      <CoakSettingsSearchTarget id="auto-optimize-enable">
        <CoakAutoOptimizeToggle
          value={autoOptimizeLayoutEnabled}
          onChange={(enabled) =>
            updateConfigurationSetting(COAK_CONFIGURATION_AUTO_OPTIMIZE_LAYOUT_KEY, enabled)
          }
        />
      </CoakSettingsSearchTarget>
      <CoakSettingsSearchTarget id="auto-optimize-connection-distance">
        <CoakAutoOptimizeConnectionDistanceSlider
          value={connectionDistance}
          onChange={(distance) =>
            updateConfigurationSetting(
              COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_DISTANCE_KEY,
              clampCoakAutoOptimizeConnectionDistance(distance),
            )
          }
        />
      </CoakSettingsSearchTarget>
      <CoakSettingsSearchTarget id="auto-optimize-connection-angle">
        <CoakAutoOptimizeConnectionAngleSlider
          value={connectionAngle}
          onChange={(angle) =>
            updateConfigurationSetting(
              COAK_CONFIGURATION_AUTO_OPTIMIZE_CONNECTION_ANGLE_KEY,
              clampCoakAutoOptimizeConnectionAngle(angle),
            )
          }
        />
      </CoakSettingsSearchTarget>
    </>
  );
}
