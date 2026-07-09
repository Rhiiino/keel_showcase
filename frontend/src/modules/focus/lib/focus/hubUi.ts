// keel_web/src/modules/focus/lib/focus/hubUi.ts

/** UI mode for adding a child on the list detail form. */
export type FocusEntryAddMode = "task" | "create_list" | "link_existing" | "add_record";

export const FOCUS_ENTRY_ADD_MODES: FocusEntryAddMode[] = [
  "task",
  "create_list",
  "link_existing",
  "add_record",
];

export const FOCUS_STANDALONE_LIST_ADD_MODES: FocusEntryAddMode[] = [
  "create_list",
  "link_existing",
];

export const FOCUS_ENTRY_ADD_MODE_LABELS: Record<FocusEntryAddMode, string> = {
  task: "New task",
  create_list: "Create list",
  link_existing: "Link existing list",
  add_record: "Add record",
};

export type FocusHubViewMode = "cards" | "constellation";

export const FOCUS_HUB_VIEW_MODES: FocusHubViewMode[] = ["cards", "constellation"];

export const FOCUS_HUB_VIEW_MODE_STORAGE_KEY = "keel.focus.hubViewMode";

export const FOCUS_HUB_PENDING_SCOPE_CANVAS_ID_STORAGE_KEY =
  "keel.focus.hubPendingScopeCanvasId";

export const FOCUS_UNSAVED_FORM_NAV_MESSAGE =
  "You have unsaved Focus changes. Discard them and leave this form?";

export type FocusHubNavigationState = {
  scopeRootCanvasId?: string | null;
};

export function stashFocusHubPendingScope(canvasNodeId: string): void {
  try {
    window.sessionStorage.setItem(
      FOCUS_HUB_PENDING_SCOPE_CANVAS_ID_STORAGE_KEY,
      canvasNodeId,
    );
  } catch {
    // Ignore storage failures.
  }
}

export function readFocusHubPendingScope(): string | null {
  try {
    return window.sessionStorage.getItem(FOCUS_HUB_PENDING_SCOPE_CANVAS_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearFocusHubPendingScope(): void {
  try {
    window.sessionStorage.removeItem(FOCUS_HUB_PENDING_SCOPE_CANVAS_ID_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

/** @deprecated Prefer router location state; kept for non-consuming reads. */
export function consumeFocusHubPendingScope(): string | null {
  const scope = readFocusHubPendingScope();
  if (scope) {
    clearFocusHubPendingScope();
  }
  return scope;
}

/** Matches AppShellContent horizontal padding for hub chrome alignment. */
export const FOCUS_HUB_SHELL_CHROME_PADDING_CLASS =
  "px-6 pt-8 sm:px-10 sm:pt-10 lg:px-12";

/** Centered hub content band used by cards view and constellation chrome. */
export const FOCUS_HUB_CONTENT_WIDTH_CLASS = "mx-auto w-full max-w-[100rem]";
