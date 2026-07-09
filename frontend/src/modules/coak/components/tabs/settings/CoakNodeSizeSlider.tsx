// keel_web/src/modules/coak/components/tabs/settings/CoakNodeSizeSlider.tsx

import {
  COAK_NODE_SIZE_SCALE_MAX,
  COAK_NODE_SIZE_SCALE_MIN,
  COAK_NODE_SIZE_SCALE_STEP,
  formatCoakNodeSizeScaleLabel,
} from "../../../lib/tabs/settings/coakNodeSizeSettings";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";
import { CoakSettingsRangeField } from "./CoakSettingsRangeInput";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakNodeSizeSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function CoakNodeSizeSlider({ value, onChange }: CoakNodeSizeSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CoakSettingsLabel info={COAK_SETTINGS_INFO.nodeSize} className={SETTING_LABEL_CLASS}>
          Node size
        </CoakSettingsLabel>
        <span className="text-[11px] tabular-nums text-stone-400">
          {formatCoakNodeSizeScaleLabel(value)}
        </span>
      </div>
      <CoakSettingsRangeField
        min={COAK_NODE_SIZE_SCALE_MIN}
        max={COAK_NODE_SIZE_SCALE_MAX}
        step={COAK_NODE_SIZE_SCALE_STEP}
        value={value}
        aria-label="Constellation node size"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
