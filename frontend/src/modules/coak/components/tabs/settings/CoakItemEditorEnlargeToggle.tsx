// keel_web/src/modules/coak/components/tabs/settings/CoakItemEditorEnlargeToggle.tsx

import { ToggleSwitch } from "../../../../../components/ToggleSwitch";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakItemEditorEnlargeToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function CoakItemEditorEnlargeToggle({
  value,
  onChange,
}: CoakItemEditorEnlargeToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CoakSettingsLabel info={COAK_SETTINGS_INFO.itemEditorEnlarge} className={SETTING_LABEL_CLASS}>
        Enlarge editors on hover
      </CoakSettingsLabel>
      <ToggleSwitch
        checked={value}
        ariaLabel="Enlarge constellation item editors on hover and while editing"
        onChange={onChange}
      />
    </div>
  );
}
