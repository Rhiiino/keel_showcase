// keel_web/src/modules/projects/components/media/projectMediaCardStyles.ts

// Draft-state border styling for project file and folder cards on the detail page.

/** Saved item marked for delete — visible until Save. */
export const PROJECT_MEDIA_CARD_PENDING_DELETE_CLASS =
  "border-red-500/80 ring-2 ring-inset ring-red-500/50";

/** Unsaved upload, library pick, or new folder — visible until Save. */
export const PROJECT_MEDIA_CARD_PENDING_ADD_CLASS =
  "border-emerald-500/80 ring-2 ring-inset ring-emerald-500/45";

export const PROJECT_MEDIA_CARD_BASE_CLASS =
  "group relative flex h-full flex-col overflow-visible rounded-lg border bg-stone-950/40 ring-1 transition";

export const PROJECT_MEDIA_CARD_DEFAULT_BORDER_CLASS =
  "border-stone-800/80 ring-stone-800/30 hover:border-stone-700/80 hover:bg-stone-950/60";
