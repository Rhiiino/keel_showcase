// keel_web/src/modules/coak/components/tabs/settings/CoakOriginPulseToggle.tsx

import { ToggleSwitch } from "../../../../../components/ToggleSwitch";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakOriginPulseToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function CoakOriginPulseToggle({ value, onChange }: CoakOriginPulseToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CoakSettingsLabel info={COAK_SETTINGS_INFO.originPulse} className={SETTING_LABEL_CLASS}>
        Origin pulse
      </CoakSettingsLabel>
      <ToggleSwitch
        checked={value}
        ariaLabel="Animate origin node and connection pulse"
        onChange={onChange}
      />
    </div>
  );
}
