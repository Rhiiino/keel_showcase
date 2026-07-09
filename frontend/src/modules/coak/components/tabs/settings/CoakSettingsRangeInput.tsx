// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsRangeInput.tsx

import type { ComponentPropsWithoutRef } from "react";

const COAK_SETTINGS_RANGE_INPUT_CLASS =
  "h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent " +
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-stone-800/90 " +
  "[&::-webkit-slider-thumb]:-mt-[3px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-stone-600/70 [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-stone-100 [&::-webkit-slider-thumb]:to-stone-300 [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.45)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 " +
  "hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-105 " +
  "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-stone-800/90 " +
  "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-stone-600/70 [&::-moz-range-thumb]:bg-stone-200 [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.45)] " +
  "focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-amber-500/45 focus-visible:[&::-moz-range-thumb]:ring-2 focus-visible:[&::-moz-range-thumb]:ring-amber-500/45 " +
  "disabled:cursor-not-allowed disabled:opacity-40";

type CoakSettingsRangeInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export function CoakSettingsRangeInput({ className = "", ...props }: CoakSettingsRangeInputProps) {
  return (
    <input
      type="range"
      className={`${COAK_SETTINGS_RANGE_INPUT_CLASS} ${className}`.trim()}
      {...props}
    />
  );
}

export function CoakSettingsRangeField({
  className = "",
  ...props
}: CoakSettingsRangeInputProps) {
  return (
    <div className="rounded-md bg-stone-900/45 px-2 py-2.5 ring-1 ring-inset ring-stone-800/60">
      <CoakSettingsRangeInput className={className} {...props} />
    </div>
  );
}
