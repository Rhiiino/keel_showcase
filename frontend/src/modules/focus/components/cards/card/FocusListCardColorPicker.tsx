// src/modules/focus/components/cards/card/FocusListCardColorPicker.tsx

// Preset swatch picker for focus list card glass tint.

import { useEffect, useRef, useState } from "react";

import {
  FOCUS_LIST_CARD_COLOR_PRESETS,
  isFocusListCardColorSelected,
} from "../../../lib/appearance";

type FocusListCardColorPickerProps = {
  colorHex: string | null | undefined;
  onChange: (hex: string | null) => void;
  disabled?: boolean;
  variant?: "popover" | "inline";
  /** Popover palette button alignment; `start` expands swatches to the right. */
  popoverAlign?: "start" | "end";
};

const SWATCH_SIZE_CLASS = "h-6 w-6";
const RAIL_TRANSITION_MS = 280;

function PaletteIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c-4.5 0-8 3.2-8 7.2 0 2.2 1.1 4.1 2.8 5.3.6.4 1 1 1 1.7v.8c0 .8.7 1.5 1.5 1.5h1.2c.8 0 1.5-.7 1.5-1.5v-.4c0-.5.2-1 .6-1.3C17.2 15.4 20 12.5 20 8.5 20 4.5 16.5 1.5 12 3Z"
      />
      <circle cx="8.5" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SwatchButton({
  preset,
  selected,
  disabled,
  onSelect,
}: {
  preset: (typeof FOCUS_LIST_CARD_COLOR_PRESETS)[number];
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={preset.label}
      aria-label={`${preset.label} card color`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      className={[
        SWATCH_SIZE_CLASS,
        "shrink-0 rounded-full border-2 transition",
        selected
          ? "border-white/80 ring-2 ring-white/25"
          : "border-white/20 hover:border-white/45",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
      style={
        preset.hex
          ? { backgroundColor: preset.hex }
          : {
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            }
      }
    />
  );
}

function SwatchGrid({
  colorHex,
  onChange,
  disabled,
}: {
  colorHex: string | null | undefined;
  onChange: (hex: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FOCUS_LIST_CARD_COLOR_PRESETS.map((preset) => (
        <SwatchButton
          key={preset.id}
          preset={preset}
          selected={isFocusListCardColorSelected(colorHex, preset.hex)}
          disabled={disabled}
          onSelect={() => onChange(preset.hex)}
        />
      ))}
    </div>
  );
}

function HorizontalSwatchRail({
  open,
  colorHex,
  disabled,
  onSelectColor,
  expandDirection = "left",
}: {
  open: boolean;
  colorHex: string | null | undefined;
  disabled?: boolean;
  onSelectColor: (hex: string | null) => void;
  expandDirection?: "left" | "right";
}) {
  return (
    <div
      role="menu"
      aria-hidden={!open}
      className={[
        "flex items-center gap-1 overflow-hidden transition-[max-width,opacity,transform] ease-out",
        open
          ? "max-w-56 translate-x-0 opacity-100"
          : [
              "pointer-events-none max-w-0 opacity-0",
              expandDirection === "right" ? "-translate-x-2" : "translate-x-2",
            ].join(" "),
      ].join(" ")}
      style={{ transitionDuration: `${RAIL_TRANSITION_MS}ms` }}
      onClick={(event) => event.stopPropagation()}
    >
      {FOCUS_LIST_CARD_COLOR_PRESETS.map((preset) => (
        <SwatchButton
          key={preset.id}
          preset={preset}
          selected={isFocusListCardColorSelected(colorHex, preset.hex)}
          disabled={disabled || !open}
          onSelect={() => onSelectColor(preset.hex)}
        />
      ))}
    </div>
  );
}

export function FocusListCardColorPicker({
  colorHex,
  onChange,
  disabled = false,
  variant = "popover",
  popoverAlign = "end",
}: FocusListCardColorPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeRail = () => setOpen(false);

  const handleSelectColor = (hex: string | null) => {
    onChange(hex);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeRail();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (variant === "inline") {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">
          Card color
        </p>
        <div className="mt-2">
          <SwatchGrid colorHex={colorHex} onChange={onChange} disabled={disabled} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative flex w-fit items-center gap-1.5",
        popoverAlign === "start" ? "flex-row" : "flex-row-reverse",
      ].join(" ")}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="Choose list card color"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={[
          SWATCH_SIZE_CLASS,
          "relative z-10 inline-flex shrink-0 items-center justify-center rounded-md bg-stone-950/80 text-stone-200 ring-1 ring-stone-700/80 transition",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-stone-900 hover:text-stone-50",
        ].join(" ")}
      >
        <PaletteIcon />
      </button>

      <HorizontalSwatchRail
        open={open}
        colorHex={colorHex}
        disabled={disabled}
        onSelectColor={handleSelectColor}
        expandDirection={popoverAlign === "start" ? "right" : "left"}
      />
    </div>
  );
}
