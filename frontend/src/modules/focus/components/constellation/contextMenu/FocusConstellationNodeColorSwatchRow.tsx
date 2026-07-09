// src/modules/focus/components/constellation/contextMenu/FocusConstellationNodeColorSwatchRow.tsx

import {
  FOCUS_NODE_COLOR_PRESETS,
  isFocusListCardColorSelected,
} from "../../../lib/appearance";

type FocusConstellationNodeColorSwatchRowProps = {
  currentColorHex: string | null;
  onSelect: (colorHex: string | null) => void;
};

export function FocusConstellationNodeColorSwatchRow({
  currentColorHex,
  onSelect,
}: FocusConstellationNodeColorSwatchRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
      {FOCUS_NODE_COLOR_PRESETS.map((preset) => {
        const selected = isFocusListCardColorSelected(currentColorHex, preset.hex);
        return (
          <button
            key={preset.id}
            type="button"
            title={preset.label}
            aria-label={`${preset.label} card color`}
            aria-pressed={selected}
            onClick={() => onSelect(preset.hex)}
            className={[
              "h-5 w-5 shrink-0 rounded-full border-2 transition",
              selected
                ? "border-white/80 ring-2 ring-white/25"
                : "border-white/20 hover:border-white/45",
            ].join(" ")}
            style={
              preset.hex
                ? { backgroundColor: preset.hex }
                : {
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  }
            }
          />
        );
      })}
    </div>
  );
}
