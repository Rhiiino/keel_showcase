// keel_web/src/modules/projects/components/workspace/settings/WorkspaceCanvasTextFontSlider.tsx

// Slider for scaling note and connection label text on the project workspace canvas.

import {
  WORKSPACE_TEXT_FONT_SCALE_MAX,
  WORKSPACE_TEXT_FONT_SCALE_MIN,
  WORKSPACE_TEXT_FONT_SCALE_STEP,
  clampWorkspaceTextFontScale,
  resolveWorkspaceTextFontSizes,
} from "../../../lib/workspace";

type WorkspaceCanvasTextFontSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function WorkspaceCanvasTextFontSlider({
  value,
  onChange,
}: WorkspaceCanvasTextFontSliderProps) {
  const clampedValue = clampWorkspaceTextFontScale(value);
  const { bodyPx } = resolveWorkspaceTextFontSizes(clampedValue);

  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Text size
      </span>
      <div className="flex min-w-[12rem] items-center gap-2.5 justify-self-start">
        <input
          type="range"
          min={WORKSPACE_TEXT_FONT_SCALE_MIN}
          max={WORKSPACE_TEXT_FONT_SCALE_MAX}
          step={WORKSPACE_TEXT_FONT_SCALE_STEP}
          value={clampedValue}
          aria-label="Workspace canvas text size"
          onChange={(event) => {
            onChange(
              clampWorkspaceTextFontScale(Number.parseFloat(event.target.value)),
            );
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
        />
        <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-white/55">
          {bodyPx}px
        </span>
      </div>
    </div>
  );
}
