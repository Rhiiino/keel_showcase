// keel_web/src/modules/projects/components/workspace/settings/WorkspaceGridDotStrengthSlider.tsx

// Slider for controlling workspace canvas grid dot prominence.

import {
  WORKSPACE_GRID_DOT_STRENGTH_MAX,
  WORKSPACE_GRID_DOT_STRENGTH_MIN,
  WORKSPACE_GRID_DOT_STRENGTH_STEP,
  clampWorkspaceGridDotStrength,
} from "../../../lib/workspace";

type WorkspaceGridDotStrengthSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function WorkspaceGridDotStrengthSlider({
  value,
  onChange,
}: WorkspaceGridDotStrengthSliderProps) {
  const clampedValue = clampWorkspaceGridDotStrength(value);

  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Grid dots
      </span>
      <div className="flex min-w-[12rem] items-center gap-2.5 justify-self-start">
        <input
          type="range"
          min={WORKSPACE_GRID_DOT_STRENGTH_MIN}
          max={WORKSPACE_GRID_DOT_STRENGTH_MAX}
          step={WORKSPACE_GRID_DOT_STRENGTH_STEP}
          value={clampedValue}
          aria-label="Workspace canvas grid dot brightness"
          onChange={(event) => {
            onChange(
              clampWorkspaceGridDotStrength(Number.parseFloat(event.target.value)),
            );
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
        />
        <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-white/55">
          {Math.round(clampedValue * 100)}%
        </span>
      </div>
    </div>
  );
}
