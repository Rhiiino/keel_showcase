// src/modules/focus/components/constellation/controls/FocusConstellationShapeToggle.tsx

// Segmented control for choosing the visual shape of constellation records.

import {
  FOCUS_CONSTELLATION_CANVAS_TONES,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS,
  FOCUS_CONSTELLATION_CONNECTION_COLORS,
  FOCUS_CONSTELLATION_CONNECTION_STYLE_LABELS,
  FOCUS_CONSTELLATION_CONNECTION_STYLES,
  FOCUS_CONSTELLATION_LIST_NODE_STYLE_LABELS,
  FOCUS_CONSTELLATION_LIST_NODE_STYLES,
  FOCUS_CONSTELLATION_NODE_SHAPES,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STEP,
  FOCUS_CONSTELLATION_TITLE_SIZE_MAX,
  FOCUS_CONSTELLATION_TITLE_SIZE_MIN,
  FOCUS_CONSTELLATION_TITLE_SIZE_STEP,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_MAX,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_MIN,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_STEP,
  clampFocusConstellationNodeSizeMultiplier,
  clampFocusConstellationTitleSize,
  clampFocusConstellationUnlinkDistance,
  type FocusConstellationCanvasTone,
  type FocusConstellationConnectionColor,
  type FocusConstellationConnectionStyle,
  type FocusConstellationListNodeStyle,
  type FocusConstellationNodeShape,
} from "../../../lib/focus";
import { buildFocusConstellationListNodePreviewStyle } from "../../../lib/constellation/listNodeStyle";
import { resolveFocusConstellationNodeSize } from "../../../lib/constellation/layout";

type FocusConstellationShapeToggleProps = {
  value: FocusConstellationNodeShape;
  onChange: (shape: FocusConstellationNodeShape) => void;
};

type FocusConstellationCanvasToneToggleProps = {
  value: FocusConstellationCanvasTone;
  onChange: (tone: FocusConstellationCanvasTone) => void;
};

const SHAPE_LABELS: Record<FocusConstellationNodeShape, string> = {
  circle: "Circle",
  hexagon: "Hexagon",
};

const TONE_LABELS: Record<FocusConstellationCanvasTone, string> = {
  slate: "Slate",
  black: "Black",
  ocean: "Ocean",
};

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlRowProps<T extends string> = {
  label: string;
  ariaLabel: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
};

function SegmentedControlRow<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
}: SegmentedControlRowProps<T>) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-left text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        {label}
      </span>
      <div
        className="inline-flex justify-self-start rounded-xl border border-white/12 bg-white/[0.04] p-1"
        role="group"
        aria-label={ariaLabel}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={[
                "inline-flex h-7 min-w-16 items-center justify-center rounded-lg px-3 text-xs font-medium transition",
                selected
                  ? "bg-white/14 text-white/95"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/75",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FocusConstellationShapeToggle({
  value,
  onChange,
}: FocusConstellationShapeToggleProps) {
  return (
    <SegmentedControlRow
      label="Node shape"
      ariaLabel="Constellation node shape"
      value={value}
      options={FOCUS_CONSTELLATION_NODE_SHAPES.map((shape) => ({
        value: shape,
        label: SHAPE_LABELS[shape],
      }))}
      onChange={onChange}
    />
  );
}

export function FocusConstellationCanvasToneToggle({
  value,
  onChange,
}: FocusConstellationCanvasToneToggleProps) {
  return (
    <SegmentedControlRow
      label="Canvas color"
      ariaLabel="Constellation canvas color"
      value={value}
      options={FOCUS_CONSTELLATION_CANVAS_TONES.map((tone) => ({
        value: tone,
        label: TONE_LABELS[tone],
      }))}
      onChange={onChange}
    />
  );
}

type FocusConstellationUnlinkDistanceSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

type FocusConstellationNodeSizeSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

type FocusConstellationTitleSizeSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

type FocusConstellationConnectionColorToggleProps = {
  value: FocusConstellationConnectionColor;
  onChange: (color: FocusConstellationConnectionColor) => void;
};

type FocusConstellationConnectionStyleToggleProps = {
  value: FocusConstellationConnectionStyle;
  onChange: (style: FocusConstellationConnectionStyle) => void;
};

type FocusConstellationListNodeStyleToggleProps = {
  value: FocusConstellationListNodeStyle;
  onChange: (style: FocusConstellationListNodeStyle) => void;
};

export function FocusConstellationListNodeStyleToggle({
  value,
  onChange,
}: FocusConstellationListNodeStyleToggleProps) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-left text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Node style
      </span>
      <div
        className="inline-flex flex-wrap gap-1.5 justify-self-start"
        role="group"
        aria-label="Constellation list node style"
      >
        {FOCUS_CONSTELLATION_LIST_NODE_STYLES.map((style) => {
          const selected = value === style;
          return (
            <button
              key={style}
              type="button"
              aria-pressed={selected}
              aria-label={FOCUS_CONSTELLATION_LIST_NODE_STYLE_LABELS[style]}
              title={FOCUS_CONSTELLATION_LIST_NODE_STYLE_LABELS[style]}
              onClick={() => onChange(style)}
              className={[
                "h-7 w-7 rounded-full transition",
                selected
                  ? "ring-2 ring-white/70 ring-offset-1 ring-offset-black/40"
                  : "hover:scale-105",
              ].join(" ")}
              style={buildFocusConstellationListNodePreviewStyle(style)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FocusConstellationTitleSizeSlider({
  value,
  onChange,
}: FocusConstellationTitleSizeSliderProps) {
  const clampedValue = clampFocusConstellationTitleSize(value);

  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-left text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Title size
      </span>
      <div className="flex min-w-[12rem] items-center gap-2.5 justify-self-start">
        <input
          type="range"
          min={FOCUS_CONSTELLATION_TITLE_SIZE_MIN}
          max={FOCUS_CONSTELLATION_TITLE_SIZE_MAX}
          step={FOCUS_CONSTELLATION_TITLE_SIZE_STEP}
          value={clampedValue}
          aria-label="Constellation title size"
          onChange={(event) => {
            onChange(
              clampFocusConstellationTitleSize(
                Number.parseFloat(event.target.value),
              ),
            );
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
        />
        <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-white/55">
          {clampedValue}px
        </span>
      </div>
    </div>
  );
}

export function FocusConstellationConnectionStyleToggle({
  value,
  onChange,
}: FocusConstellationConnectionStyleToggleProps) {
  return (
    <SegmentedControlRow
      label="Connections"
      ariaLabel="Constellation connection style"
      value={value}
      options={FOCUS_CONSTELLATION_CONNECTION_STYLES.map((style) => ({
        value: style,
        label: FOCUS_CONSTELLATION_CONNECTION_STYLE_LABELS[style],
      }))}
      onChange={onChange}
    />
  );
}

export function FocusConstellationConnectionColorToggle({
  value,
  onChange,
}: FocusConstellationConnectionColorToggleProps) {
  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-left text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Connection color
      </span>
      <div
        className="inline-flex flex-wrap gap-1.5 justify-self-start"
        role="group"
        aria-label="Constellation connection color"
      >
        {FOCUS_CONSTELLATION_CONNECTION_COLORS.map((color) => {
          const selected = value === color;
          const swatch = FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX[color];
          return (
            <button
              key={color}
              type="button"
              aria-pressed={selected}
              aria-label={FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS[color]}
              title={FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS[color]}
              onClick={() => onChange(color)}
              className={[
                "h-6 w-6 rounded-full transition",
                selected ? "ring-2 ring-white/70 ring-offset-1 ring-offset-black/40" : "hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: swatch }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FocusConstellationNodeSizeSlider({
  value,
  onChange,
}: FocusConstellationNodeSizeSliderProps) {
  const clampedValue = clampFocusConstellationNodeSizeMultiplier(value);
  const nodeSizePx = resolveFocusConstellationNodeSize(clampedValue);

  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-left text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Node size
      </span>
      <div className="flex min-w-[12rem] items-center gap-2.5 justify-self-start">
        <input
          type="range"
          min={FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN}
          max={FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX}
          step={FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STEP}
          value={clampedValue}
          aria-label="Constellation node size"
          onChange={(event) => {
            onChange(
              clampFocusConstellationNodeSizeMultiplier(
                Number.parseFloat(event.target.value),
              ),
            );
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
        />
        <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-white/55">
          {nodeSizePx}px
        </span>
      </div>
    </div>
  );
}

export function FocusConstellationUnlinkDistanceSlider({
  value,
  onChange,
}: FocusConstellationUnlinkDistanceSliderProps) {
  const clampedValue = clampFocusConstellationUnlinkDistance(value);

  return (
    <div className="grid grid-cols-[6.5rem_auto] items-center gap-x-5">
      <span className="text-left text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        Unlink distance
      </span>
      <div className="flex min-w-[12rem] items-center gap-2.5 justify-self-start">
        <input
          type="range"
          min={FOCUS_CONSTELLATION_UNLINK_DISTANCE_MIN}
          max={FOCUS_CONSTELLATION_UNLINK_DISTANCE_MAX}
          step={FOCUS_CONSTELLATION_UNLINK_DISTANCE_STEP}
          value={clampedValue}
          aria-label="Constellation unlink distance"
          onChange={(event) => {
            onChange(clampFocusConstellationUnlinkDistance(Number.parseFloat(event.target.value)));
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
        />
        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/55">
          {clampedValue.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}

type FocusConstellationNodeInfoToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function FocusConstellationNodeInfoToggle({
  value,
  onChange,
}: FocusConstellationNodeInfoToggleProps) {
  return (
    <SegmentedControlRow
      label="Info panel"
      ariaLabel="Constellation node info panel"
      value={value ? "on" : "off"}
      options={[
        { value: "on", label: "On" },
        { value: "off", label: "Off" },
      ]}
      onChange={(next) => onChange(next === "on")}
    />
  );
}
