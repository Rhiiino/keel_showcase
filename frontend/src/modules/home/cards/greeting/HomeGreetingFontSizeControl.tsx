// keel_web/src/modules/home/cards/greeting/HomeGreetingFontSizeControl.tsx

// Hover-only stepper for home greeting font size (minus, input, plus).

import { useEffect, useState } from "react";

import {
  clampHomeGreetingFontSizePx,
  MAX_HOME_GREETING_FONT_SIZE_PX,
  MIN_HOME_GREETING_FONT_SIZE_PX,
} from "../../lib/greetingFontSize";

type HomeGreetingFontSizeControlProps = {
  fontSizePx: number;
  disabled?: boolean;
  className?: string;
  onChange: (nextFontSizePx: number) => void;
};

const controlButtonClass = [
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
  "border border-stone-800 bg-stone-950/80 text-stone-300 transition",
  "hover:bg-stone-900 hover:text-stone-100",
  "disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

export function HomeGreetingFontSizeControl({
  fontSizePx,
  disabled = false,
  className = "",
  onChange,
}: HomeGreetingFontSizeControlProps) {
  const [draftValue, setDraftValue] = useState(String(fontSizePx));

  useEffect(() => {
    setDraftValue(String(fontSizePx));
  }, [fontSizePx]);

  const commitDraft = () => {
    const parsed = Number.parseInt(draftValue, 10);
    if (!Number.isFinite(parsed)) {
      setDraftValue(String(fontSizePx));
      return;
    }
    onChange(clampHomeGreetingFontSizePx(parsed));
  };

  const decrement = () => {
    onChange(clampHomeGreetingFontSizePx(fontSizePx - 1));
  };

  const increment = () => {
    onChange(clampHomeGreetingFontSizePx(fontSizePx + 1));
  };

  return (
    <div
      className={[
        "flex shrink-0 items-center gap-1 transition-opacity duration-200",
        "opacity-0 pointer-events-none",
        "group-hover/greeting:opacity-100 group-hover/greeting:pointer-events-auto",
        "group-focus-within/greeting:opacity-100 group-focus-within/greeting:pointer-events-auto",
        className,
      ].join(" ")}
      data-home-card-no-drag
    >
      <button
        type="button"
        aria-label="Decrease greeting font size"
        disabled={disabled || fontSizePx <= MIN_HOME_GREETING_FONT_SIZE_PX}
        onClick={decrement}
        className={controlButtonClass}
      >
        <span aria-hidden className="text-base leading-none">
          −
        </span>
      </button>

      <input
        type="number"
        inputMode="numeric"
        min={MIN_HOME_GREETING_FONT_SIZE_PX}
        max={MAX_HOME_GREETING_FONT_SIZE_PX}
        step={1}
        value={draftValue}
        disabled={disabled}
        aria-label="Greeting font size in pixels"
        onChange={(event) => setDraftValue(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className={[
          "h-8 w-14 rounded-md border border-stone-800 bg-stone-950/80",
          "px-1 text-center text-sm tabular-nums text-stone-100",
          "focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-700",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        ].join(" ")}
      />

      <button
        type="button"
        aria-label="Increase greeting font size"
        disabled={disabled || fontSizePx >= MAX_HOME_GREETING_FONT_SIZE_PX}
        onClick={increment}
        className={controlButtonClass}
      >
        <span aria-hidden className="text-base leading-none">
          +
        </span>
      </button>
    </div>
  );
}
