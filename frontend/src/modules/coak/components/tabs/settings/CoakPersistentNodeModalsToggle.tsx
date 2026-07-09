// keel_web/src/modules/coak/components/tabs/settings/CoakPersistentNodeModalsToggle.tsx

import { ToggleSwitch } from "../../../../../components/ToggleSwitch";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakPersistentNodeModalsToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function CoakPersistentNodeModalsToggle({
  value,
  onChange,
}: CoakPersistentNodeModalsToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CoakSettingsLabel info={COAK_SETTINGS_INFO.persistentNodeModals} className={SETTING_LABEL_CLASS}>
        Always show node editors
      </CoakSettingsLabel>
      <ToggleSwitch
        checked={value}
        ariaLabel="Always show constellation node editors"
        onChange={onChange}
      />
    </div>
  );
}
