// keel_web/src/modules/projects/components/workspace/settings/WorkspaceCanvasConnectionStyleToggle.tsx

// Segmented control for workspace canvas connection routing style.

import {
  WORKSPACE_CANVAS_CONNECTION_STYLE_LABELS,
  WORKSPACE_CANVAS_CONNECTION_STYLES,
  type WorkspaceCanvasConnectionStyle,
} from "../../../lib/workspace";

type WorkspaceCanvasConnectionStyleToggleProps = {
  value: WorkspaceCanvasConnectionStyle;
  onChange: (value: WorkspaceCanvasConnectionStyle) => void;
};

export function WorkspaceCanvasConnectionStyleToggle({
  value,
  onChange,
}: WorkspaceCanvasConnectionStyleToggleProps) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Connections
      </span>
      <div
        role="group"
        aria-label="Workspace connection style"
        className="inline-flex rounded-xl border border-white/12 bg-white/[0.04] p-1"
      >
        {WORKSPACE_CANVAS_CONNECTION_STYLES.map((style) => {
          const selected = style === value;
          return (
            <button
              key={style}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(style)}
              className={[
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                selected
                  ? "bg-white/14 text-white/95"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/75",
              ].join(" ")}
            >
              {WORKSPACE_CANVAS_CONNECTION_STYLE_LABELS[style]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
