// keel_web/src/modules/focus/lib/constellation/settings/storage.ts

import {
  DEFAULT_TITLE_FONT_KEY,
  resolveProjectTitleFontKey,
  type ProjectTitleFontKey,
} from "../../../../projects/lib/project/appearance";
import {
  FOCUS_CONSTELLATION_CANVAS_TONE_DEFAULT,
  FOCUS_CONSTELLATION_CANVAS_TONE_STORAGE_KEY,
  FOCUS_CONSTELLATION_CANVAS_TONES,
  FOCUS_CONSTELLATION_CONFIG_OPEN_STORAGE_KEY,
  FOCUS_CONSTELLATION_CONFIG_POSITION_DEFAULT,
  FOCUS_CONSTELLATION_CONFIG_POSITION_STORAGE_KEY,
  FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT,
  FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_STORAGE_KEY,
  FOCUS_CONSTELLATION_NODE_INFO_ENABLED_DEFAULT,
  FOCUS_CONSTELLATION_NODE_INFO_ENABLED_STORAGE_KEY,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX,
  FOCUS_CONSTELLATION_CONNECTION_COLOR_STORAGE_KEY,
  FOCUS_CONSTELLATION_CONNECTION_STYLE_DEFAULT,
  FOCUS_CONSTELLATION_CONNECTION_STYLE_STORAGE_KEY,
  FOCUS_CONSTELLATION_CONNECTION_STYLES,
  FOCUS_CONSTELLATION_LABEL_FONT_STORAGE_KEY,
  FOCUS_CONSTELLATION_LINK_DISTANCE_STORAGE_KEY_LEGACY,
  FOCUS_CONSTELLATION_LIST_NODE_STYLE_DEFAULT,
  FOCUS_CONSTELLATION_LIST_NODE_STYLE_STORAGE_KEY,
  FOCUS_CONSTELLATION_LIST_NODE_STYLES,
  FOCUS_CONSTELLATION_NODE_SHAPE_DEFAULT,
  FOCUS_CONSTELLATION_NODE_SHAPE_STORAGE_KEY,
  FOCUS_CONSTELLATION_NODE_SHAPES,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STEP,
  FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STORAGE_KEY,
  FOCUS_CONSTELLATION_TITLE_SIZE_DEFAULT,
  FOCUS_CONSTELLATION_TITLE_SIZE_MAX,
  FOCUS_CONSTELLATION_TITLE_SIZE_MIN,
  FOCUS_CONSTELLATION_TITLE_SIZE_STEP,
  FOCUS_CONSTELLATION_TITLE_SIZE_STORAGE_KEY,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_DEFAULT,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_MAX,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_MIN,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_STEP,
  FOCUS_CONSTELLATION_UNLINK_DISTANCE_STORAGE_KEY,
  type FocusConstellationCanvasTone,
  type FocusConstellationConfigPanelPosition,
  type FocusConstellationConnectionColor,
  type FocusConstellationConnectionStyle,
  type FocusConstellationListNodeStyle,
  type FocusConstellationNodeShape,
} from "./constants";

export function isFocusConstellationConnectionColor(
  value: string,
): value is FocusConstellationConnectionColor {
  return value in FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX;
}

export function isFocusConstellationConnectionStyle(
  value: string,
): value is FocusConstellationConnectionStyle {
  return (FOCUS_CONSTELLATION_CONNECTION_STYLES as readonly string[]).includes(value);
}

export function readStoredFocusConstellationConnectionStyle(): FocusConstellationConnectionStyle {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_CONNECTION_STYLE_STORAGE_KEY);
    if (!raw || !isFocusConstellationConnectionStyle(raw)) {
      return FOCUS_CONSTELLATION_CONNECTION_STYLE_DEFAULT;
    }
    return raw;
  } catch {
    return FOCUS_CONSTELLATION_CONNECTION_STYLE_DEFAULT;
  }
}

export function isFocusConstellationListNodeStyle(
  value: string,
): value is FocusConstellationListNodeStyle {
  return (FOCUS_CONSTELLATION_LIST_NODE_STYLES as readonly string[]).includes(value);
}

export function readStoredFocusConstellationListNodeStyle(): FocusConstellationListNodeStyle {
  try {
    const raw = window.localStorage.getItem(
      FOCUS_CONSTELLATION_LIST_NODE_STYLE_STORAGE_KEY,
    );
    if (raw === "wood") {
      return "matte";
    }
    if (raw === "frosted" || raw === "neon") {
      return "glass";
    }
    if (!raw || !isFocusConstellationListNodeStyle(raw)) {
      return FOCUS_CONSTELLATION_LIST_NODE_STYLE_DEFAULT;
    }
    return raw;
  } catch {
    return FOCUS_CONSTELLATION_LIST_NODE_STYLE_DEFAULT;
  }
}

export function clampFocusConstellationTitleSize(value: number): number {
  const rounded = Math.round(value / FOCUS_CONSTELLATION_TITLE_SIZE_STEP)
    * FOCUS_CONSTELLATION_TITLE_SIZE_STEP;
  return Math.min(
    FOCUS_CONSTELLATION_TITLE_SIZE_MAX,
    Math.max(FOCUS_CONSTELLATION_TITLE_SIZE_MIN, rounded),
  );
}

export function readStoredFocusConstellationTitleSize(): number {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_TITLE_SIZE_STORAGE_KEY);
    if (!raw) {
      return FOCUS_CONSTELLATION_TITLE_SIZE_DEFAULT;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      return FOCUS_CONSTELLATION_TITLE_SIZE_DEFAULT;
    }
    return clampFocusConstellationTitleSize(parsed);
  } catch {
    return FOCUS_CONSTELLATION_TITLE_SIZE_DEFAULT;
  }
}

export function readStoredFocusConstellationLabelFont(): ProjectTitleFontKey {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_LABEL_FONT_STORAGE_KEY);
    return resolveProjectTitleFontKey(raw);
  } catch {
    return DEFAULT_TITLE_FONT_KEY;
  }
}

/** Default uses each node's title_font_key; any other setting overrides all labels. */
export function resolveFocusConstellationNodeLabelFont(
  constellationLabelFont: ProjectTitleFontKey,
  nodeTitleFontKey: string | null,
): string | null {
  if (constellationLabelFont !== DEFAULT_TITLE_FONT_KEY) {
    return constellationLabelFont;
  }
  return nodeTitleFontKey;
}

export function readStoredFocusConstellationConfigOpen(): boolean {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_CONFIG_OPEN_STORAGE_KEY);
    if (raw === "false") {
      return false;
    }
    if (raw === "true") {
      return true;
    }
    return true;
  } catch {
    return true;
  }
}

export function readStoredFocusConstellationConfigPosition(): FocusConstellationConfigPanelPosition {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_CONFIG_POSITION_STORAGE_KEY);
    if (!raw) {
      return FOCUS_CONSTELLATION_CONFIG_POSITION_DEFAULT;
    }
    const parsed = JSON.parse(raw) as Partial<FocusConstellationConfigPanelPosition>;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return { x: parsed.x, y: parsed.y };
    }
    return FOCUS_CONSTELLATION_CONFIG_POSITION_DEFAULT;
  } catch {
    return FOCUS_CONSTELLATION_CONFIG_POSITION_DEFAULT;
  }
}

export function readStoredFocusConstellationNotesPanelPosition(): FocusConstellationConfigPanelPosition {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_STORAGE_KEY);
    if (!raw) {
      return FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT;
    }
    const parsed = JSON.parse(raw) as Partial<FocusConstellationConfigPanelPosition>;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return { x: parsed.x, y: parsed.y };
    }
    return FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT;
  } catch {
    return FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT;
  }
}

export function readStoredFocusConstellationNodeInfoEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_NODE_INFO_ENABLED_STORAGE_KEY);
    if (raw === "false") {
      return false;
    }
    if (raw === "true") {
      return true;
    }
    return FOCUS_CONSTELLATION_NODE_INFO_ENABLED_DEFAULT;
  } catch {
    return FOCUS_CONSTELLATION_NODE_INFO_ENABLED_DEFAULT;
  }
}

export function isFocusConstellationNodeShape(
  value: string,
): value is FocusConstellationNodeShape {
  return (FOCUS_CONSTELLATION_NODE_SHAPES as readonly string[]).includes(value);
}

export function isFocusConstellationCanvasTone(
  value: string,
): value is FocusConstellationCanvasTone {
  return (FOCUS_CONSTELLATION_CANVAS_TONES as readonly string[]).includes(value);
}

export function readStoredFocusConstellationNodeShape(): FocusConstellationNodeShape {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_NODE_SHAPE_STORAGE_KEY);
    if (!raw || !isFocusConstellationNodeShape(raw)) {
      return FOCUS_CONSTELLATION_NODE_SHAPE_DEFAULT;
    }
    return raw;
  } catch {
    return FOCUS_CONSTELLATION_NODE_SHAPE_DEFAULT;
  }
}

export function readStoredFocusConstellationCanvasTone(): FocusConstellationCanvasTone {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_CANVAS_TONE_STORAGE_KEY);
    if (raw === "glow") {
      return "ocean";
    }
    if (raw === "light") {
      return "black";
    }
    if (!raw || !isFocusConstellationCanvasTone(raw)) {
      return FOCUS_CONSTELLATION_CANVAS_TONE_DEFAULT;
    }
    return raw;
  } catch {
    return FOCUS_CONSTELLATION_CANVAS_TONE_DEFAULT;
  }
}

export function readStoredFocusConstellationConnectionColor(): FocusConstellationConnectionColor {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_CONNECTION_COLOR_STORAGE_KEY);
    if (!raw || !isFocusConstellationConnectionColor(raw)) {
      return FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT;
    }
    return raw;
  } catch {
    return FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT;
  }
}

export function clampFocusConstellationNodeSizeMultiplier(value: number): number {
  const rounded =
    Math.round(value / FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STEP)
    * FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STEP;
  return Math.min(
    FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX,
    Math.max(FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN, rounded),
  );
}

export function readStoredFocusConstellationNodeSizeMultiplier(): number {
  try {
    const raw = window.localStorage.getItem(
      FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STORAGE_KEY,
    );
    if (!raw) {
      return FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      return FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT;
    }
    return clampFocusConstellationNodeSizeMultiplier(parsed);
  } catch {
    return FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT;
  }
}

export function clampFocusConstellationUnlinkDistance(value: number): number {
  const rounded = Math.round(value / FOCUS_CONSTELLATION_UNLINK_DISTANCE_STEP)
    * FOCUS_CONSTELLATION_UNLINK_DISTANCE_STEP;
  return Math.min(
    FOCUS_CONSTELLATION_UNLINK_DISTANCE_MAX,
    Math.max(FOCUS_CONSTELLATION_UNLINK_DISTANCE_MIN, rounded),
  );
}

export function readStoredFocusConstellationUnlinkDistance(): number {
  try {
    const raw =
      window.localStorage.getItem(FOCUS_CONSTELLATION_UNLINK_DISTANCE_STORAGE_KEY)
      ?? window.localStorage.getItem(FOCUS_CONSTELLATION_LINK_DISTANCE_STORAGE_KEY_LEGACY);
    if (!raw) {
      return FOCUS_CONSTELLATION_UNLINK_DISTANCE_DEFAULT;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      return FOCUS_CONSTELLATION_UNLINK_DISTANCE_DEFAULT;
    }
    return clampFocusConstellationUnlinkDistance(parsed);
  } catch {
    return FOCUS_CONSTELLATION_UNLINK_DISTANCE_DEFAULT;
  }
}

export type FocusConstellationSettingsSnapshot = {
  node_shape: FocusConstellationNodeShape;
  canvas_tone: FocusConstellationCanvasTone;
  connection_color: FocusConstellationConnectionColor;
  connection_style: FocusConstellationConnectionStyle;
  list_node_style: FocusConstellationListNodeStyle;
  label_font_key: ProjectTitleFontKey;
  node_size_multiplier: number;
  title_size_px: number;
  unlink_distance_multiplier: number;
  config_open: boolean;
  config_position: FocusConstellationConfigPanelPosition;
  notes_panel_position: FocusConstellationConfigPanelPosition;
  node_info_enabled: boolean;
};

export function buildLegacyFocusConstellationSettings(): FocusConstellationSettingsSnapshot {
  return {
    node_shape: readStoredFocusConstellationNodeShape(),
    canvas_tone: readStoredFocusConstellationCanvasTone(),
    connection_color: readStoredFocusConstellationConnectionColor(),
    connection_style: readStoredFocusConstellationConnectionStyle(),
    list_node_style: readStoredFocusConstellationListNodeStyle(),
    label_font_key: readStoredFocusConstellationLabelFont(),
    node_size_multiplier: readStoredFocusConstellationNodeSizeMultiplier(),
    title_size_px: readStoredFocusConstellationTitleSize(),
    unlink_distance_multiplier: readStoredFocusConstellationUnlinkDistance(),
    config_open: readStoredFocusConstellationConfigOpen(),
    config_position: readStoredFocusConstellationConfigPosition(),
    notes_panel_position: readStoredFocusConstellationNotesPanelPosition(),
    node_info_enabled: readStoredFocusConstellationNodeInfoEnabled(),
  };
}

export function clearLegacyFocusConstellationSettingsStorage(): void {
  try {
    window.localStorage.removeItem(FOCUS_CONSTELLATION_NODE_SHAPE_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_CANVAS_TONE_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_CONNECTION_COLOR_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_CONNECTION_STYLE_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_LIST_NODE_STYLE_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_LABEL_FONT_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_TITLE_SIZE_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_UNLINK_DISTANCE_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_CONFIG_OPEN_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_CONFIG_POSITION_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_NODE_INFO_ENABLED_STORAGE_KEY);
    window.localStorage.removeItem(FOCUS_CONSTELLATION_LINK_DISTANCE_STORAGE_KEY_LEGACY);
  } catch {
    // Ignore storage failures.
  }
}
