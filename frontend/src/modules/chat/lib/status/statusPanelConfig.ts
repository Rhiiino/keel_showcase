// stack_sandbox/frontend_web/src/modules/chat/lib/status/statusPanelConfig.ts

// Status panel tab ids and types — add new tab ids here when extending the panel.

export const STATUS_PANEL_TAB_IDS = {
  general: "general",
  rules: "rules",
  log: "log",
} as const;

export type StatusPanelTabId =
  (typeof STATUS_PANEL_TAB_IDS)[keyof typeof STATUS_PANEL_TAB_IDS];

export type StatusPanelTab = {
  id: StatusPanelTabId;
  label: string;
};

/** Default / min / max width (px) for the resizable status panel. */
export const STATUS_PANEL_DEFAULT_WIDTH = 256;
export const STATUS_PANEL_MIN_WIDTH = 200;
export const STATUS_PANEL_MAX_WIDTH = 520;

/** Docked edge for the status panel relative to chat history. */
export type StatusPanelSide = "left" | "right";
export const STATUS_PANEL_DEFAULT_SIDE: StatusPanelSide = "left";
