// keel_web/src/modules/focus/lib/focus/nodeDomain.ts

export type FocusNodeKind = "item" | "list" | "record";
export type FocusNodeStatus = "active" | "paused" | "completed" | "archived" | "limbo";
/** @deprecated Use FocusNodeStatus */
export type FocusListStatus = FocusNodeStatus;
/** @deprecated Use FocusNodeStatus */
export type FocusItemStatus = FocusNodeStatus;
/** @deprecated Use FocusItemStatus */
export type FocusEntryStatus = FocusItemStatus;

/** @deprecated Use FocusNodeKind */
export type FocusEntryKind = "task" | "list_link" | "record";

export const DEFAULT_FOCUS_TAG_COLOR = "#06B6D4";

export const FOCUS_NODE_STATUSES: FocusNodeStatus[] = [
  "active",
  "paused",
  "completed",
  "archived",
  "limbo",
];

/** @deprecated Use FOCUS_NODE_STATUSES */
export const FOCUS_LIST_STATUSES = FOCUS_NODE_STATUSES;

/** @deprecated Use FOCUS_NODE_STATUSES */
export const FOCUS_ITEM_STATUSES = FOCUS_NODE_STATUSES;

/** @deprecated Use FOCUS_ITEM_STATUSES */
export const FOCUS_ENTRY_STATUSES = FOCUS_NODE_STATUSES;

/** @deprecated Use FOCUS_NODE_KINDS */
export const FOCUS_ENTRY_KINDS: FocusEntryKind[] = ["task", "list_link", "record"];

export const FOCUS_NODE_STATUS_LABELS: Record<FocusNodeStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
  limbo: "Limbo",
};

export const FOCUS_NODE_STATUS_COLORS: Record<FocusNodeStatus, string> = {
  active: "#38BDF8",
  paused: "#FBBF24",
  completed: "#34D399",
  archived: "#A78BFA",
  limbo: "#94A3B8",
};

export const FOCUS_NODE_STATUS_GLOW_RGB: Partial<
  Record<FocusNodeStatus, { r: number; g: number; b: number }>
> = {
  active: { r: 56, g: 189, b: 248 },
  paused: { r: 251, g: 191, b: 36 },
  completed: { r: 52, g: 211, b: 153 },
  archived: { r: 167, g: 139, b: 250 },
};

/** @deprecated Use FOCUS_NODE_STATUS_LABELS */
export const FOCUS_LIST_STATUS_LABELS = FOCUS_NODE_STATUS_LABELS;

/** @deprecated Use FOCUS_NODE_STATUS_LABELS */
export const FOCUS_ITEM_STATUS_LABELS = FOCUS_NODE_STATUS_LABELS;

/** @deprecated Use FOCUS_ITEM_STATUS_LABELS */
export const FOCUS_ENTRY_STATUS_LABELS = FOCUS_NODE_STATUS_LABELS;

export const FOCUS_NODE_KINDS: FocusNodeKind[] = ["item", "list", "record"];

export const FOCUS_NODE_KIND_LABELS: Record<FocusNodeKind, string> = {
  item: "Task",
  list: "List",
  record: "Record",
};

/** @deprecated Use FOCUS_NODE_KIND_LABELS */
export const FOCUS_ENTRY_KIND_LABELS: Record<FocusEntryKind, string> = {
  task: "Task",
  list_link: "List",
  record: "Record",
};

export function isFocusNodeStatus(value: string): value is FocusNodeStatus {
  return value in FOCUS_NODE_STATUS_LABELS;
}

/** @deprecated Use isFocusNodeStatus */
export function isFocusListStatus(value: string): value is FocusListStatus {
  return isFocusNodeStatus(value);
}

/** @deprecated Use isFocusNodeStatus */
export function isFocusItemStatus(value: string): value is FocusItemStatus {
  return isFocusNodeStatus(value);
}

export function isFocusNodeKind(value: string): value is FocusNodeKind {
  return value in FOCUS_NODE_KIND_LABELS;
}

/** @deprecated Use isFocusItemStatus */
export function isFocusEntryStatus(value: string): value is FocusEntryStatus {
  return isFocusNodeStatus(value);
}

/** @deprecated Use isFocusNodeKind */
export function isFocusEntryKind(value: string): value is FocusEntryKind {
  return value in FOCUS_ENTRY_KIND_LABELS;
}

export function isFocusContainerKind(kind: FocusNodeKind): boolean {
  return kind === "list" || kind === "record";
}

type FocusNodeTitleSource = {
  kind: string;
  title: string;
  reference_target?: { title: string } | null;
};

export function focusNodeDisplayTitle(node: FocusNodeTitleSource): string {
  if (isFocusNodeKind(node.kind) && node.kind === "record" && node.reference_target?.title) {
    return node.reference_target.title;
  }
  return node.title;
}

/** @deprecated Use focusNodeDisplayTitle */
export function focusEntryDisplayTitle(node: FocusNodeTitleSource): string {
  return focusNodeDisplayTitle(node);
}

export function focusNodeColor(node: {
  kind: string;
  node_color_hex?: string | null;
}): string | null {
  if (isFocusNodeKind(node.kind) && isFocusContainerKind(node.kind)) {
    return node.node_color_hex ?? null;
  }
  return null;
}

/** @deprecated Use focusNodeColor */
export function focusEntryLinkedListNodeColor(node: {
  kind: string;
  node_color_hex?: string | null;
}): string | null {
  return focusNodeColor(node);
}
