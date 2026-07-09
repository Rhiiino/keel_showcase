// keel_web/src/modules/projects/components/workspace/settings/WorkspaceCanvasColorToggle.tsx

// Segmented control for project workspace canvas color presets.

import {
  WORKSPACE_CANVAS_COLOR_LABELS,
  WORKSPACE_CANVAS_COLOR_PRESETS,
  type WorkspaceCanvasColorPreset,
} from "../../../lib/workspace";

type WorkspaceCanvasColorToggleProps = {
  value: WorkspaceCanvasColorPreset;
  onChange: (value: WorkspaceCanvasColorPreset) => void;
};

export function WorkspaceCanvasColorToggle({
  value,
  onChange,
}: WorkspaceCanvasColorToggleProps) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Canvas color
      </span>
      <div
        role="group"
        aria-label="Workspace canvas color"
        className="inline-flex rounded-xl border border-white/12 bg-white/[0.04] p-1"
      >
        {WORKSPACE_CANVAS_COLOR_PRESETS.map((preset) => {
          const selected = preset === value;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(preset)}
              className={[
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                selected
                  ? "bg-white/14 text-white/95"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/75",
              ].join(" ")}
            >
              {WORKSPACE_CANVAS_COLOR_LABELS[preset]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
