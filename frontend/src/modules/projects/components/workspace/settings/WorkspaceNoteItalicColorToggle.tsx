// keel_web/src/modules/projects/components/workspace/settings/WorkspaceNoteItalicColorToggle.tsx

// Color palette for workspace-wide italic text in note card Markdown preview.
import {
  WORKSPACE_NOTE_ITALIC_COLOR_LABELS,
  WORKSPACE_NOTE_ITALIC_COLOR_PRESETS,
  WORKSPACE_NOTE_ITALIC_COLOR_SPECS,
  type WorkspaceNoteItalicColorPreset,
} from "../../../lib/workspace";

type WorkspaceNoteItalicColorToggleProps = {
  value: WorkspaceNoteItalicColorPreset;
  onChange: (value: WorkspaceNoteItalicColorPreset) => void;
};

export function WorkspaceNoteItalicColorToggle({
  value,
  onChange,
}: WorkspaceNoteItalicColorToggleProps) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Italic color
      </span>
      <div
        role="group"
        aria-label="Workspace note italic text color"
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] p-1.5"
      >
        {WORKSPACE_NOTE_ITALIC_COLOR_PRESETS.map((preset) => {
          const selected = preset === value;
          const label = WORKSPACE_NOTE_ITALIC_COLOR_LABELS[preset];
          return (
            <button
              key={preset}
              type="button"
              aria-label={`Italic color: ${label}`}
              aria-pressed={selected}
              title={label}
              onClick={() => onChange(preset)}
              className={[
                "h-5 w-5 rounded-full ring-1 transition",
                selected
                  ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-stone-950"
                  : "ring-stone-600/80 hover:ring-stone-400",
              ].join(" ")}
              style={{ backgroundColor: WORKSPACE_NOTE_ITALIC_COLOR_SPECS[preset] }}
            />
          );
        })}
      </div>
    </div>
  );
}
