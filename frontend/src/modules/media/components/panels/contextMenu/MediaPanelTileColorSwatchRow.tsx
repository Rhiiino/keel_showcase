// keel_web/src/modules/media/components/panels/contextMenu/MediaPanelTileColorSwatchRow.tsx

import {
  isMediaPanelTileBorderSelected,
  MEDIA_PANEL_TILE_BORDER_PRESETS,
} from "../../../lib/panelTileBorderColors";

type MediaPanelTileColorSwatchRowProps = {
  currentColorHex: string | null | undefined;
  onSelect: (colorHex: string | null) => void;
};

export function MediaPanelTileColorSwatchRow({
  currentColorHex,
  onSelect,
}: MediaPanelTileColorSwatchRowProps) {
  return (
    <div className="scrollbar-hidden flex flex-row items-center gap-1.5 overflow-x-auto px-3 py-2">
      {MEDIA_PANEL_TILE_BORDER_PRESETS.map((preset) => {
        const selected = isMediaPanelTileBorderSelected(currentColorHex, preset.hex);
        return (
          <button
            key={preset.id}
            type="button"
            title={preset.label}
            aria-label={`${preset.label} tile border`}
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
