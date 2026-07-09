// keel_web/src/modules/coak/components/tabs/settings/CoakConnectionColorToggle.tsx

import {
  FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS,
  FOCUS_CONSTELLATION_CONNECTION_COLORS,
  type FocusConstellationConnectionColor,
} from "../../../../focus/lib/focus";
import { COAK_SETTINGS_INFO } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

const SETTING_LABEL_CLASS =
  "text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500";

type CoakConnectionColorToggleProps = {
  value: FocusConstellationConnectionColor;
  onChange: (value: FocusConstellationConnectionColor) => void;
};

export function CoakConnectionColorToggle({ value, onChange }: CoakConnectionColorToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <CoakSettingsLabel
        info={COAK_SETTINGS_INFO.connectionColor}
        className={`shrink-0 ${SETTING_LABEL_CLASS}`}
      >
        Connection color
      </CoakSettingsLabel>
      <div
        className="inline-flex flex-wrap gap-1.5"
        role="group"
        aria-label="Constellation connection color"
      >
        {FOCUS_CONSTELLATION_CONNECTION_COLORS.map((color) => {
          const selected = value === color;
          const swatch = FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX[color];
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
