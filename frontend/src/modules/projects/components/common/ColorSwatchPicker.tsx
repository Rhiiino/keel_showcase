// stack_sandbox/frontend_web/src/modules/projects/components/common/ColorSwatchPicker.tsx

// One row in the appearance color grid (info icon, label, swatch).

import { useRef } from "react";

type ColorSwatchPickerProps = {
  label: string;
  description: string;
  value: string;
  onChange: (nextHex: string) => void;
  disabled?: boolean;
};

export function ColorSwatchPicker({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: ColorSwatchPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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

      <p className="min-w-0 text-sm font-medium leading-none text-stone-200">
        {label}
      </p>

      <div className="flex items-center justify-start">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label={`${label}: ${value}`}
          className={[
            "relative shrink-0 rounded-full p-0.5 ring-1 ring-stone-700/80 transition",
            disabled ? "cursor-not-allowed opacity-50" : "hover:ring-stone-500",
          ].join(" ")}
        >
          <span
            className="block h-8 w-8 rounded-full ring-2 ring-stone-950/80"
            style={{ backgroundColor: value }}
            aria-hidden
          />
        </button>

        <input
          ref={inputRef}
          type="color"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
