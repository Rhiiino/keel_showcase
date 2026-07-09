// keel_web/src/modules/coak/components/tabs/settings/CoakAutoOptimizeConnectionAngleSlider.tsx

import {
  COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MAX,
  COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MIN,
  COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_STEP,
} from "../../../lib/tabs/settings/coakAutoOptimizeSettings";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";
import { CoakSettingsRangeField } from "./CoakSettingsRangeInput";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakAutoOptimizeConnectionAngleSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function CoakAutoOptimizeConnectionAngleSlider({
  value,
  onChange,
}: CoakAutoOptimizeConnectionAngleSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CoakSettingsLabel
          info={COAK_SETTINGS_INFO.autoOptimizeConnectionAngle}
          className={SETTING_LABEL_CLASS}
        >
          Connection angle
        </CoakSettingsLabel>
        <span className="text-[11px] tabular-nums text-stone-400">{value}°</span>
      </div>
      <CoakSettingsRangeField
        min={COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MIN}
        max={COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_MAX}
        step={COAK_AUTO_OPTIMIZE_CONNECTION_ANGLE_STEP}
        value={value}
        aria-label="Auto-optimize connection angle"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
