// keel_web/src/modules/focus/lib/constellation/settings/constants.ts

export const FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY =
  "keel.focus.constellationViewport";
export const FOCUS_CONSTELLATION_EXPANDED_IDS_STORAGE_KEY =
  "keel.focus.constellationExpandedIds";
export const FOCUS_CONSTELLATION_DRAG_OFFSETS_STORAGE_KEY =
  "keel.focus.constellationDragOffsets";
export const FOCUS_CONSTELLATION_NODE_POSITIONS_STORAGE_KEY =
  "keel.focus.constellationNodePositions";
export const FOCUS_CONSTELLATION_WORK_ORDER_BADGE_ANGLE_STORAGE_KEY_PREFIX =
  "keel.focus.constellationWorkOrderBadgeAngle.";
export const FOCUS_CONSTELLATION_STANDALONE_LIST_IDS_STORAGE_KEY =
  "keel.focus.constellationStandaloneListIds";
export const FOCUS_CONSTELLATION_UNLINK_DISTANCE_STORAGE_KEY =
  "keel.focus.constellationUnlinkDistance";
/** @deprecated Read fallback for renamed unlink-distance setting. */
export const FOCUS_CONSTELLATION_LINK_DISTANCE_STORAGE_KEY_LEGACY =
  "keel.focus.constellationLinkDistance";

export const FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN = 0.75;
export const FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX = 1.35;
export const FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT = 1;
export const FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STEP = 0.05;

export const FOCUS_CONSTELLATION_NODE_SIZE_MULTIPLIER_STORAGE_KEY =
  "keel.focus.constellationNodeSizeMultiplier";

/** Node-size multiple for preview break and list-link detach thresholds. */
export const FOCUS_CONSTELLATION_UNLINK_DISTANCE_MIN = 0.8;
export const FOCUS_CONSTELLATION_UNLINK_DISTANCE_MAX = 12;
export const FOCUS_CONSTELLATION_UNLINK_DISTANCE_DEFAULT = 2;
export const FOCUS_CONSTELLATION_UNLINK_DISTANCE_STEP = 0.1;

export type FocusConstellationNodeShape = "circle" | "hexagon";

export const FOCUS_CONSTELLATION_NODE_SHAPES: FocusConstellationNodeShape[] = [
  "circle",
  "hexagon",
];

export const FOCUS_CONSTELLATION_NODE_SHAPE_DEFAULT: FocusConstellationNodeShape =
  "circle";

export const FOCUS_CONSTELLATION_NODE_SHAPE_STORAGE_KEY =
  "keel.focus.constellationNodeShape";

export type FocusConstellationCanvasTone = "slate" | "black" | "ocean";

export const FOCUS_CONSTELLATION_CANVAS_TONES: FocusConstellationCanvasTone[] = [
  "slate",
  "black",
  "ocean",
];

export const FOCUS_CONSTELLATION_CANVAS_TONE_DEFAULT: FocusConstellationCanvasTone =
  "slate";

export const FOCUS_CONSTELLATION_CANVAS_TONE_STORAGE_KEY =
  "keel.focus.constellationCanvasTone";

export type FocusConstellationConnectionColor =
  | "silver"
  | "cyan"
  | "amber"
  | "violet"
  | "emerald"
  | "rose";

export const FOCUS_CONSTELLATION_CONNECTION_COLORS: FocusConstellationConnectionColor[] = [
  "silver",
  "cyan",
  "amber",
  "violet",
  "emerald",
  "rose",
];

export const FOCUS_CONSTELLATION_CONNECTION_COLOR_DEFAULT: FocusConstellationConnectionColor =
  "silver";

export const FOCUS_CONSTELLATION_CONNECTION_COLOR_STORAGE_KEY =
  "keel.focus.constellationConnectionColor";

export type FocusConstellationConnectionStyle = "flexible" | "straight";

export const FOCUS_CONSTELLATION_CONNECTION_STYLES: FocusConstellationConnectionStyle[] = [
  "flexible",
  "straight",
];

export const FOCUS_CONSTELLATION_CONNECTION_STYLE_DEFAULT: FocusConstellationConnectionStyle =
  "flexible";

export const FOCUS_CONSTELLATION_CONNECTION_STYLE_STORAGE_KEY =
  "keel.focus.constellationConnectionStyle";

export const FOCUS_CONSTELLATION_CONNECTION_STYLE_LABELS: Record<
  FocusConstellationConnectionStyle,
  string
> = {
  flexible: "Flexible",
  straight: "Straight",
};

export type FocusConstellationListNodeStyle =
  | "glass"
  | "metallic"
  | "matte"
  | "prism"
  | "ember"
  | "classic";

/** @alias FocusConstellationListNodeStyle */
export type FocusConstellationNodeStyle = FocusConstellationListNodeStyle;

export const FOCUS_CONSTELLATION_LIST_NODE_STYLES: FocusConstellationListNodeStyle[] = [
  "glass",
  "metallic",
  "matte",
  "prism",
  "ember",
  "classic",
];

export const FOCUS_CONSTELLATION_LIST_NODE_STYLE_DEFAULT: FocusConstellationListNodeStyle =
  "glass";

export const FOCUS_CONSTELLATION_LIST_NODE_STYLE_STORAGE_KEY =
  "keel.focus.constellationListNodeStyle";

export const FOCUS_CONSTELLATION_LIST_NODE_STYLE_LABELS: Record<
  FocusConstellationListNodeStyle,
  string
> = {
  glass: "Glass",
  metallic: "Metallic",
  matte: "Matte",
  prism: "Prism",
  ember: "Ember",
  classic: "Classic",
};

export const FOCUS_CONSTELLATION_LABEL_FONT_STORAGE_KEY =
  "keel.focus.constellationLabelFont";

export const FOCUS_CONSTELLATION_TITLE_SIZE_MIN = 11;
export const FOCUS_CONSTELLATION_TITLE_SIZE_MAX = 44;
export const FOCUS_CONSTELLATION_TITLE_SIZE_DEFAULT = 11;
export const FOCUS_CONSTELLATION_TITLE_SIZE_STEP = 1;
export const FOCUS_CONSTELLATION_TITLE_SIZE_STORAGE_KEY =
  "keel.focus.constellationTitleSize";

export const FOCUS_CONSTELLATION_CONFIG_OPEN_STORAGE_KEY =
  "keel.focus.constellationConfigOpen";

export const FOCUS_CONSTELLATION_CONFIG_POSITION_STORAGE_KEY =
  "keel.focus.constellationConfigPosition";

export const FOCUS_CONSTELLATION_CONFIG_POSITION_DEFAULT = { x: 24, y: 32 };

export const FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_STORAGE_KEY =
  "keel.focus.constellationNotesPanelPosition";

export const FOCUS_CONSTELLATION_NODE_INFO_ENABLED_STORAGE_KEY =
  "keel.focus.constellationNodeInfoEnabled";

export const FOCUS_CONSTELLATION_NODE_INFO_ENABLED_DEFAULT = true;

export const FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT = { x: 20, y: 680 };

export const FOCUS_CONSTELLATION_NODE_INFO_PANEL_WIDTH_CLASS = "w-[min(100%,32rem)]";

export const FOCUS_CONSTELLATION_NODE_INFO_NOTES_MIN_HEIGHT_CLASS = "min-h-[6.5rem]";

export const FOCUS_CONSTELLATION_NODE_INFO_NOTES_MAX_HEIGHT_PX = 192;

export const FOCUS_CONSTELLATION_NODE_INFO_TIMER_RECORD_GRID_CLASS =
  "grid grid-cols-[minmax(0,1.36fr)_minmax(0,1.34fr)] gap-2";

export type FocusConstellationConfigPanelPosition = {
  x: number;
  y: number;
};

export const FOCUS_CONSTELLATION_CONNECTION_COLOR_HEX: Record<
  FocusConstellationConnectionColor,
  string
> = {
  silver: "#c0ccda",
  cyan: "#22d3ee",
  amber: "#fbbf24",
  violet: "#a78bfa",
  emerald: "#34d399",
  rose: "#fb7185",
};

export const FOCUS_CONSTELLATION_CONNECTION_COLOR_LABELS: Record<
  FocusConstellationConnectionColor,
  string
> = {
  silver: "Silver",
  cyan: "Cyan",
  amber: "Amber",
  violet: "Violet",
  emerald: "Emerald",
  rose: "Rose",
};
