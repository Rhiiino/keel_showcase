// keel_web/src/modules/coak/components/tabs/settings/CoakBackgroundPresetPicker.tsx

import {
  COAK_CONSTELLATION_BACKGROUND_LABELS,
  COAK_CONSTELLATION_BACKGROUND_PRESETS,
  type CoakConstellationBackgroundPreset,
} from "../../../lib/tabs/settings/coakBackgroundSettings";
import { coakSpaceBackgroundStyle } from "../../../lib/workspace/coakCanvasTone";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakBackgroundPresetPickerProps = {
  value: CoakConstellationBackgroundPreset;
  onChange: (value: CoakConstellationBackgroundPreset) => void;
};

export function CoakBackgroundPresetPicker({ value, onChange }: CoakBackgroundPresetPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <CoakSettingsLabel
        info={COAK_SETTINGS_INFO.constellationBackground}
        className={`shrink-0 ${SETTING_LABEL_CLASS}`}
      >
        Background
      </CoakSettingsLabel>
      <div
        className="inline-flex flex-wrap gap-2"
        role="group"
        aria-label="Constellation background preset"
      >
        {COAK_CONSTELLATION_BACKGROUND_PRESETS.map((preset) => {
        const selected = value === preset;
        const label = COAK_CONSTELLATION_BACKGROUND_LABELS[preset];

        return (
          <button
            key={preset}
            type="button"
            aria-pressed={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(preset)}
            className={[
              "h-10 w-16 overflow-hidden rounded-md border transition",
              selected
                ? "border-stone-200/80 ring-2 ring-stone-200/80 ring-offset-1 ring-offset-stone-900"
                : "border-stone-800/80 hover:border-stone-600/80",
            ].join(" ")}
            style={coakSpaceBackgroundStyle(preset)}
          />
        );
        })}
      </div>
    </div>
  );
}
