// keel_web/src/modules/projects/lib/workspace/panel/workspaceCanvasSettings.ts

// Presets for project workspace canvas appearance.

import type {
  ProjectWorkspaceSettings,
  ProjectWorkspaceSettingsPayload,
} from "../../../api";
import { parseNotesGridLayout, serializeNotesGridLayout, type WorkspaceNotesGridPlacement } from "../note/workspaceNotesGridLayout";

export type WorkspaceCanvasColorPreset = "default" | "slate" | "midnight";

export type WorkspaceCanvasConnectionStyle = "smooth" | "straight";

export type WorkspaceNoteColorStyle = "filled" | "soft" | "outline" | "bold";

export type WorkspaceNoteItalicColorPreset =
  | "slate"
  | "rose"
  | "amber"
  | "sky"
  | "emerald"
  | "violet"
  | "coral";

export type WorkspaceCanvasConfigPanelPosition = {
  x: number;
  y: number;
};

export type ProjectWorkspaceSettingsSnapshot = {
  canvas_color: WorkspaceCanvasColorPreset;
  snap_enabled: boolean;
  minimap_open: boolean;
  grid_dot_strength: number;
  config_open: boolean;
  config_position: WorkspaceCanvasConfigPanelPosition;
  text_font_scale: number;
  connection_style: WorkspaceCanvasConnectionStyle;
  note_color_style: WorkspaceNoteColorStyle;
  note_italic_color: WorkspaceNoteItalicColorPreset;
  notes_grid_layout: WorkspaceNotesGridPlacement[] | null;
};

export const WORKSPACE_CANVAS_COLOR_PRESETS: WorkspaceCanvasColorPreset[] = [
  "default",
  "slate",
  "midnight",
];

export const WORKSPACE_CANVAS_COLOR_DEFAULT: WorkspaceCanvasColorPreset = "default";

export const WORKSPACE_CANVAS_CONNECTION_STYLES: WorkspaceCanvasConnectionStyle[] = [
  "smooth",
  "straight",
];

export const WORKSPACE_CANVAS_CONNECTION_STYLE_DEFAULT: WorkspaceCanvasConnectionStyle =
  "smooth";

export const WORKSPACE_NOTE_COLOR_STYLES: WorkspaceNoteColorStyle[] = [
  "filled",
  "soft",
  "outline",
  "bold",
];

export const WORKSPACE_NOTE_COLOR_STYLE_DEFAULT: WorkspaceNoteColorStyle = "filled";

export const WORKSPACE_NOTE_ITALIC_COLOR_PRESETS: WorkspaceNoteItalicColorPreset[] = [
  "slate",
  "rose",
  "amber",
  "sky",
  "emerald",
  "violet",
  "coral",
];

export const WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT: WorkspaceNoteItalicColorPreset = "slate";

export const WORKSPACE_NOTE_ITALIC_COLOR_LABELS: Record<
  WorkspaceNoteItalicColorPreset,
  string
> = {
  slate: "Slate",
  rose: "Rose",
  amber: "Amber",
  sky: "Sky",
  emerald: "Emerald",
  violet: "Violet",
  coral: "Coral",
};

export const WORKSPACE_NOTE_ITALIC_COLOR_SPECS: Record<
  WorkspaceNoteItalicColorPreset,
  string
> = {
  slate: "#a8a29e",
  rose: "#fb7185",
  amber: "#fbbf24",
  sky: "#38bdf8",
  emerald: "#34d399",
  violet: "#a78bfa",
  coral: "#f97316",
};

/** Italic preview text is 50% of the note title size (50% smaller than title). */
export const WORKSPACE_NOTE_ITALIC_TITLE_SIZE_RATIO = 0.5;

export const WORKSPACE_CANVAS_CONNECTION_STYLE_LABELS: Record<
  WorkspaceCanvasConnectionStyle,
  string
> = {
  smooth: "Curved",
  straight: "Straight",
};

export const WORKSPACE_NOTE_COLOR_STYLE_LABELS: Record<WorkspaceNoteColorStyle, string> =
  {
    filled: "Filled",
    soft: "Soft",
    outline: "Outline",
    bold: "Bold",
  };

export const WORKSPACE_TEXT_FONT_SCALE_MIN = 0.75;
export const WORKSPACE_TEXT_FONT_SCALE_MAX = 50 / 14;
export const WORKSPACE_TEXT_FONT_SCALE_DEFAULT = 1;
export const WORKSPACE_TEXT_FONT_SCALE_STEP = 0.05;

export const WORKSPACE_GRID_DOT_STRENGTH_MIN = 0.35;
export const WORKSPACE_GRID_DOT_STRENGTH_MAX = 1.4;
export const WORKSPACE_GRID_DOT_STRENGTH_DEFAULT = 1;
export const WORKSPACE_GRID_DOT_STRENGTH_STEP = 0.05;

export const WORKSPACE_NOTE_TITLE_FONT_PX = 24;
export const WORKSPACE_NOTE_BODY_FONT_PX = 14;
export const WORKSPACE_EDGE_LABEL_FONT_PX = 12;

export const WORKSPACE_CANVAS_COLOR_LABELS: Record<
  WorkspaceCanvasColorPreset,
  string
> = {
  default: "Default",
  slate: "Slate",
  midnight: "Obsidian",
};

export const WORKSPACE_CANVAS_COLOR_SPECS: Record<
  WorkspaceCanvasColorPreset,
  { background: string; dots: string; dotGap: number; dotSize: number }
> = {
  default: {
    background: "#0a0b0a",
    dots: "#3f3f46",
    dotGap: 20,
    dotSize: 1,
  },
  slate: {
    background: "#141820",
    dots: "#52525b",
    dotGap: 20,
    dotSize: 1,
  },
  midnight: {
    background: "#1c2127",
    dots: "#5a6170",
    dotGap: 20,
    dotSize: 1,
  },
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

function isWorkspaceCanvasConnectionStyle(
  value: string,
): value is WorkspaceCanvasConnectionStyle {
  return (WORKSPACE_CANVAS_CONNECTION_STYLES as readonly string[]).includes(value);
}

function isWorkspaceNoteColorStyle(value: string): value is WorkspaceNoteColorStyle {
  return (WORKSPACE_NOTE_COLOR_STYLES as readonly string[]).includes(value);
}

function isWorkspaceNoteItalicColorPreset(
  value: string,
): value is WorkspaceNoteItalicColorPreset {
  return (WORKSPACE_NOTE_ITALIC_COLOR_PRESETS as readonly string[]).includes(value);
}

export function clampWorkspaceTextFontScale(value: number): number {
  if (!Number.isFinite(value)) {
    return WORKSPACE_TEXT_FONT_SCALE_DEFAULT;
  }
  return Math.min(
    WORKSPACE_TEXT_FONT_SCALE_MAX,
    Math.max(WORKSPACE_TEXT_FONT_SCALE_MIN, value),
  );
}

export function clampWorkspaceGridDotStrength(value: number): number {
  if (!Number.isFinite(value)) {
    return WORKSPACE_GRID_DOT_STRENGTH_DEFAULT;
  }
  return Math.min(
    WORKSPACE_GRID_DOT_STRENGTH_MAX,
    Math.max(WORKSPACE_GRID_DOT_STRENGTH_MIN, value),
  );
}

function hexToRgb(hex: string): RgbColor | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function mixRgb(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  };
}

function rgbToHex(color: RgbColor): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function resolveWorkspaceCanvasDotColor(
  preset: WorkspaceCanvasColorPreset,
  gridDotStrength: number,
): string {
  const clampedStrength = clampWorkspaceGridDotStrength(gridDotStrength);
  const tone = WORKSPACE_CANVAS_COLOR_SPECS[preset];
  const background = hexToRgb(tone.background);
  const dots = hexToRgb(tone.dots);
  if (!background || !dots) {
    return tone.dots;
  }

  if (clampedStrength < 1) {
    return rgbToHex(mixRgb(background, dots, clampedStrength));
  }

  return rgbToHex(mixRgb(dots, { r: 255, g: 255, b: 255 }, (clampedStrength - 1) / 2));
}

export function resolveWorkspaceTextFontSizes(textFontScale: number): {
  titlePx: number;
  bodyPx: number;
  labelPx: number;
  italicPx: number;
} {
  const scale = clampWorkspaceTextFontScale(textFontScale);
  const titlePx = Math.round(WORKSPACE_NOTE_TITLE_FONT_PX * scale);
  return {
    titlePx,
    bodyPx: Math.round(WORKSPACE_NOTE_BODY_FONT_PX * scale),
    labelPx: Math.round(WORKSPACE_EDGE_LABEL_FONT_PX * scale),
    italicPx: Math.round(titlePx * WORKSPACE_NOTE_ITALIC_TITLE_SIZE_RATIO),
  };
}

export function resolveWorkspaceNoteItalicColor(
  preset: WorkspaceNoteItalicColorPreset,
): string {
  return WORKSPACE_NOTE_ITALIC_COLOR_SPECS[preset];
}

function isWorkspaceCanvasColorPreset(
  value: string,
): value is WorkspaceCanvasColorPreset {
  return (WORKSPACE_CANVAS_COLOR_PRESETS as readonly string[]).includes(value);
}

export function snapshotFromWorkspaceSettings(
  settings: ProjectWorkspaceSettings,
): ProjectWorkspaceSettingsSnapshot {
  return {
    canvas_color: isWorkspaceCanvasColorPreset(settings.canvas_color)
      ? settings.canvas_color
      : WORKSPACE_CANVAS_COLOR_DEFAULT,
    snap_enabled: settings.snap_enabled,
    minimap_open: settings.minimap_open !== false,
    grid_dot_strength: clampWorkspaceGridDotStrength(
      settings.grid_dot_strength ?? WORKSPACE_GRID_DOT_STRENGTH_DEFAULT,
    ),
    config_open: settings.config_open,
    config_position: settings.config_position,
    text_font_scale: clampWorkspaceTextFontScale(settings.text_font_scale),
    connection_style: isWorkspaceCanvasConnectionStyle(settings.connection_style)
      ? settings.connection_style
      : WORKSPACE_CANVAS_CONNECTION_STYLE_DEFAULT,
    note_color_style: isWorkspaceNoteColorStyle(settings.note_color_style)
      ? settings.note_color_style
      : WORKSPACE_NOTE_COLOR_STYLE_DEFAULT,
    note_italic_color: isWorkspaceNoteItalicColorPreset(settings.note_italic_color)
      ? settings.note_italic_color
      : WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT,
    notes_grid_layout: parseNotesGridLayout(settings.notes_grid_layout),
  };
}

export function workspaceSettingsToPayload(
  settings: ProjectWorkspaceSettingsSnapshot,
): ProjectWorkspaceSettingsPayload {
  return {
    canvas_color: settings.canvas_color,
    snap_enabled: settings.snap_enabled,
    minimap_open: settings.minimap_open,
    grid_dot_strength: clampWorkspaceGridDotStrength(settings.grid_dot_strength),
    config_open: settings.config_open,
    config_position: settings.config_position,
    text_font_scale: clampWorkspaceTextFontScale(settings.text_font_scale),
    connection_style: settings.connection_style,
    note_color_style: settings.note_color_style,
    note_italic_color: settings.note_italic_color,
    notes_grid_layout: settings.notes_grid_layout
      ? serializeNotesGridLayout(settings.notes_grid_layout)
      : null,
  };
}
