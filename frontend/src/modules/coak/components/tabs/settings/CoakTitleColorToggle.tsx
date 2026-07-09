// keel_web/src/modules/coak/components/tabs/settings/CoakTitleColorToggle.tsx

import { FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS } from "../../../../focus/lib/focus";
import {
  COAK_TITLE_COLOR_HEX,
  COAK_TITLE_COLORS,
  type CoakTitleColor,
} from "../../../lib/tabs/settings/coakTitleColorSettings";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakTitleColorToggleProps = {
  value: CoakTitleColor;
  onChange: (value: CoakTitleColor) => void;
};

export function CoakTitleColorToggle({ value, onChange }: CoakTitleColorToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <CoakSettingsLabel
        info={COAK_SETTINGS_INFO.titleColor}
        className={`shrink-0 ${SETTING_LABEL_CLASS}`}
      >
        Title color
      </CoakSettingsLabel>
      <div
        className="inline-flex flex-wrap gap-1.5"
        role="group"
        aria-label="Constellation title color"
      >
        {COAK_TITLE_COLORS.map((color) => {
          const selected = value === color;
          const swatch = COAK_TITLE_COLOR_HEX[color];
          return (
            <button
              key={color}
              type="button"
              aria-pressed={selected}
              aria-label={FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS[color]}
              title={FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS[color]}
              onClick={() => onChange(color)}
              className={[
                "h-6 w-6 rounded-full transition",
                selected
                  ? "ring-2 ring-stone-200/80 ring-offset-1 ring-offset-stone-900"
                  : "hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: swatch }}
            />
          );
        })}
      </div>
    </div>
  );
}
