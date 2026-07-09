// keel_web/src/modules/coak/components/tabs/settings/CoakAutoOptimizeToggle.tsx

import { ToggleSwitch } from "../../../../../components/ToggleSwitch";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakAutoOptimizeToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function CoakAutoOptimizeToggle({ value, onChange }: CoakAutoOptimizeToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CoakSettingsLabel info={COAK_SETTINGS_INFO.autoOptimizeLayout} className={SETTING_LABEL_CLASS}>
        Enable
      </CoakSettingsLabel>
      <ToggleSwitch
        checked={value}
        ariaLabel="Auto-optimize constellation layout"
        onChange={onChange}
      />
    </div>
  );
}
