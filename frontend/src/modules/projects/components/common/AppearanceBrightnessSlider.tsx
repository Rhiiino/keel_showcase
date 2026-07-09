// stack_sandbox/frontend_web/src/modules/projects/components/common/AppearanceBrightnessSlider.tsx

// Slider row for 3D cover model brightness in the appearance grid.

import {
  coverModelBrightnessToPercent,
  coverModelPercentToBrightness,
  resolveCoverModelBrightness,
} from "../../lib/project/appearance";

type AppearanceBrightnessSliderProps = {
  label: string;
  description: string;
  value: number;
  onChange: (nextBrightness: number) => void;
  disabled?: boolean;
};

export function AppearanceBrightnessSlider({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: AppearanceBrightnessSliderProps) {
  const brightness = resolveCoverModelBrightness(value);
  const percent = coverModelBrightnessToPercent(brightness);

  return (
    <div className="contents">
      <div className="group/info relative flex items-center justify-self-start">
        <button
          type="button"
          aria-label={`About ${label}`}
          className={[
            "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold leading-none text-stone-500 ring-1 ring-stone-600/80 transition",
            disabled
              ? "opacity-50"
              : "hover:text-stone-300 hover:ring-stone-500",
          ].join(" ")}
        >
          i
        </button>

        <div
          role="tooltip"
          className={[
            "pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-44 rounded-lg border border-stone-800 bg-stone-950 px-2.5 py-2 text-[11px] leading-relaxed text-stone-400 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition",
            "group-hover/info:opacity-100 group-focus-within/info:opacity-100",
          ].join(" ")}
        >
          {description}
        </div>
      </div>

      <label className="min-w-0 text-sm text-stone-300" htmlFor="cover-model-brightness">
        {label}
      </label>

      <div className="flex w-full max-w-[9rem] flex-col gap-1 justify-self-end">
        <input
          id="cover-model-brightness"
          type="range"
          min={50}
          max={200}
          step={5}
          value={percent}
          disabled={disabled}
          onChange={(event) =>
            onChange(coverModelPercentToBrightness(Number.parseInt(event.target.value, 10)))
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-800 accent-lime-400 disabled:opacity-40"
        />
        <span className="text-right text-[10px] tabular-nums text-stone-500">{percent}%</span>
      </div>
    </div>
  );
}
