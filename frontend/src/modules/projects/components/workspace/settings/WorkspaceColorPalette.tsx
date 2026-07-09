// keel_web/src/modules/projects/components/workspace/settings/WorkspaceColorPalette.tsx

// Shared preset color swatches for workspace notes, edges, and other canvas elements.

import {
  WORKSPACE_NOTE_COLORS,
  normalizeNoteColor,
} from "../../../lib/workspace/node";

type WorkspaceColorPaletteProps = {
  currentColor: string;
  onSelectColor: (hex: string) => void;
};

export function WorkspaceColorPalette({
  currentColor,
  onSelectColor,
}: WorkspaceColorPaletteProps) {
  const normalizedCurrent = normalizeNoteColor(currentColor);

  return (
    <>
      {WORKSPACE_NOTE_COLORS.map((color) => {
        const active = normalizedCurrent === normalizeNoteColor(color.border);
        return (
          <button
            key={color.id}
            type="button"
            aria-label={`Color: ${color.label}`}
            aria-pressed={active}
            title={color.label}
            onClick={() => onSelectColor(color.border)}
            className={[
              "h-5 w-5 rounded-full ring-1 transition",
              active
                ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-stone-950"
                : "ring-stone-600/80 hover:ring-stone-400",
            ].join(" ")}
            style={{ backgroundColor: color.border }}
          />
        );
      })}
    </>
  );
}
