// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuColorPalette.tsx

import {
  FOCUS_NODE_COLOR_PRESETS,
  isFocusListCardColorSelected,
} from "../../../../../focus/lib/appearance";

const DEFAULT_NODE_COLOR_HEX = "#FBBF24";

type CoakGraphNodeContextMenuColorPaletteProps = {
  colorHex: string | null | undefined;
  disabled?: boolean;
  onChange: (colorHex: string) => void;
};

export function CoakGraphNodeContextMenuColorPalette({
  colorHex,
  disabled = false,
  onChange,
}: CoakGraphNodeContextMenuColorPaletteProps) {
  return (
    <div className="border-b border-stone-800 px-2 py-2">
      <span className="mb-1.5 block text-[9px] font-medium uppercase tracking-[0.16em] text-stone-500">
        Color
      </span>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Node color"
        onClick={(event) => event.stopPropagation()}
      >
        {FOCUS_NODE_COLOR_PRESETS.map((preset) => {
          const selected = isFocusListCardColorSelected(colorHex, preset.hex);
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${preset.label} node color`}
              title={preset.label}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(preset.hex ?? DEFAULT_NODE_COLOR_HEX);
              }}
              className={[
                "h-5 w-5 shrink-0 rounded-full border transition",
                selected
                  ? "border-white/80 ring-2 ring-stone-200/80 ring-offset-1 ring-offset-stone-950"
                  : "border-white/15 hover:border-white/40",
                disabled ? "cursor-not-allowed opacity-50" : "",
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
    </div>
  );
}
