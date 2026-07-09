// keel_web/src/modules/coak/components/tabs/settings/CoakNodeVisualSettingsSection.tsx

import { useMemo } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import {
  buildCoakNodeVisualSettingsUpdate,
  COAK_CONFIGURATION_NODE_VISUALS_KEY,
  COAK_ITEM_KINDS,
  COAK_NODE_VISUAL_PREVIEW_COLOR,
  readCoakNodeVisualSettings,
  type CoakNodeVisualStyle,
} from "../../../lib/tabs/settings/coakNodeVisualSettings";
import {
  clampCoakNodeSizeScale,
  COAK_CONFIGURATION_NODE_SIZE_SCALE_KEY,
  readCoakNodeSizeScale,
} from "../../../lib/tabs/settings/coakNodeSizeSettings";
import type { CoakItemKind } from "../../../api";
import { CoakNodeSizeSlider } from "./CoakNodeSizeSlider";
import { CoakNodeVisualStylePicker } from "./CoakNodeVisualStylePicker";
import { CoakSettingsSearchTarget } from "./CoakSettingsSearchTarget";

export function CoakNodeVisualSettingsSection() {
  const { record, configurationSettings, updateConfigurationSetting } = useCoakRecordWorkspace();

  const nodeVisuals = useMemo(
    () => readCoakNodeVisualSettings(configurationSettings),
    [configurationSettings],
  );

  const handleChange = (kind: CoakItemKind, style: CoakNodeVisualStyle) => {
    updateConfigurationSetting(
      COAK_CONFIGURATION_NODE_VISUALS_KEY,
      buildCoakNodeVisualSettingsUpdate(configurationSettings, kind, style),
    );
  };

  const nodeSizeScale = readCoakNodeSizeScale(configurationSettings);
  const previewColor = record?.color_hex ?? COAK_NODE_VISUAL_PREVIEW_COLOR;

  return (
    <div className="space-y-4">
      <CoakSettingsSearchTarget id="node-size">
        <CoakNodeSizeSlider
          value={nodeSizeScale}
          onChange={(scale) =>
            updateConfigurationSetting(
              COAK_CONFIGURATION_NODE_SIZE_SCALE_KEY,
              clampCoakNodeSizeScale(scale),
            )
          }
        />
      </CoakSettingsSearchTarget>
      {COAK_ITEM_KINDS.map((kind) => (
        <CoakSettingsSearchTarget key={kind} id={`node-visual-${kind}`}>
          <CoakNodeVisualStylePicker
            kind={kind}
            value={nodeVisuals[kind]}
            previewColor={previewColor}
            onChange={(style) => handleChange(kind, style)}
          />
        </CoakSettingsSearchTarget>
      ))}
    </div>
  );
}
