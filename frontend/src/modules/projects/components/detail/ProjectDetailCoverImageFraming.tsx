// keel_web/src/modules/projects/components/detail/ProjectDetailCoverImageFraming.tsx

// Zoom control shown on the cover image preview.

import {
  coverImagePercentToScale,
  coverImageScaleToPercent,
  resolveCoverImageScale,
} from "../../lib/project/appearance";

type ProjectDetailCoverImageFramingProps = {
  scale: number;
  onScaleChange: (nextScale: number) => void;
  disabled?: boolean;
};

export function ProjectDetailCoverImageFraming({
  scale,
  onScaleChange,
  disabled = false,
}: ProjectDetailCoverImageFramingProps) {
  const scalePercent = coverImageScaleToPercent(resolveCoverImageScale(scale));

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-stone-800/80 bg-stone-950/88 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <label
          htmlFor="cover-image-zoom"
          className="w-[4.5rem] shrink-0 text-[11px] font-medium text-stone-400"
        >
          Zoom
        </label>
        <input
          id="cover-image-zoom"
          type="range"
          min={25}
          max={300}
          step={5}
          value={scalePercent}
          disabled={disabled}
          onChange={(event) =>
            onScaleChange(coverImagePercentToScale(Number.parseInt(event.target.value, 10)))
          }
          className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-stone-800 accent-sky-400 disabled:opacity-40"
        />
        <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-stone-500">
          {scalePercent}%
        </span>
      </div>
    </div>
  );
}
