// keel_web/src/modules/coak/components/tabs/settings/CoakConnectionWidthSlider.tsx

import {
  COAK_CONNECTION_WIDTH_MAX,
  COAK_CONNECTION_WIDTH_MIN,
  COAK_CONNECTION_WIDTH_STEP,
} from "../../../lib/tabs/settings/coakConnectionWidthSettings";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";
import { CoakSettingsRangeField } from "./CoakSettingsRangeInput";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakConnectionWidthSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function CoakConnectionWidthSlider({ value, onChange }: CoakConnectionWidthSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CoakSettingsLabel info={COAK_SETTINGS_INFO.connectionWidth} className={SETTING_LABEL_CLASS}>
          Connection width
        </CoakSettingsLabel>
        <span className="text-[11px] tabular-nums text-stone-400">{value.toFixed(2)}</span>
      </div>
      <CoakSettingsRangeField
        min={COAK_CONNECTION_WIDTH_MIN}
        max={COAK_CONNECTION_WIDTH_MAX}
        step={COAK_CONNECTION_WIDTH_STEP}
        value={value}
        aria-label="Constellation connection width"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
