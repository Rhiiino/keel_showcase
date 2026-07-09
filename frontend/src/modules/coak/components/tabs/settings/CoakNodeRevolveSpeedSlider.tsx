// keel_web/src/modules/coak/components/tabs/settings/CoakNodeRevolveSpeedSlider.tsx

import {
  COAK_NODE_REVOLVE_SPEED_MAX,
  COAK_NODE_REVOLVE_SPEED_MIN,
  COAK_NODE_REVOLVE_SPEED_STEP,
} from "../../../lib/tabs/settings/coakNodeRevolveSpeedSettings";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";
import { CoakSettingsRangeField } from "./CoakSettingsRangeInput";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakNodeRevolveSpeedSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function CoakNodeRevolveSpeedSlider({
  value,
  onChange,
}: CoakNodeRevolveSpeedSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CoakSettingsLabel info={COAK_SETTINGS_INFO.nodeRevolveSpeed} className={SETTING_LABEL_CLASS}>
          Spin speed
        </CoakSettingsLabel>
        <span className="text-[11px] tabular-nums text-stone-400">{value.toFixed(1)} rad/s</span>
      </div>
      <CoakSettingsRangeField
        min={COAK_NODE_REVOLVE_SPEED_MIN}
        max={COAK_NODE_REVOLVE_SPEED_MAX}
        step={COAK_NODE_REVOLVE_SPEED_STEP}
        value={value}
        aria-label="Constellation Spin speed"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
