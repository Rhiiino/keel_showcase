// keel_web/src/modules/coak/components/tabs/settings/CoakAutoOptimizeConnectionDistanceSlider.tsx

import {
  COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MAX,
  COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MIN,
  COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_STEP,
} from "../../../lib/tabs/settings/coakAutoOptimizeSettings";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";
import { CoakSettingsRangeField } from "./CoakSettingsRangeInput";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakAutoOptimizeConnectionDistanceSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function CoakAutoOptimizeConnectionDistanceSlider({
  value,
  onChange,
}: CoakAutoOptimizeConnectionDistanceSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CoakSettingsLabel
          info={COAK_SETTINGS_INFO.autoOptimizeConnectionDistance}
          className={SETTING_LABEL_CLASS}
        >
          Connection distance
        </CoakSettingsLabel>
        <span className="text-[11px] tabular-nums text-stone-400">{value.toFixed(2)}</span>
      </div>
      <CoakSettingsRangeField
        min={COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MIN}
        max={COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_MAX}
        step={COAK_AUTO_OPTIMIZE_CONNECTION_DISTANCE_STEP}
        value={value}
        aria-label="Auto-optimize connection distance"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
