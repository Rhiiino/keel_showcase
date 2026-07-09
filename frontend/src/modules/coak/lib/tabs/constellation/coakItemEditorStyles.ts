// keel_web/src/modules/coak/lib/tabs/constellation/coakItemEditorStyles.ts

import type { CoakItemKind } from "../../../api";

export const COAK_ITEM_EDITOR_SHELL_CLASS =
  "relative overflow-hidden rounded-xl border border-stone-600/50 bg-stone-950 shadow-[0_16px_48px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.05)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] ring-1 ring-stone-800/60";

export const COAK_ITEM_EDITOR_INNER_CLASS =
  "relative z-10 flex min-h-0 flex-col gap-3 bg-stone-950 p-3.5";

export const COAK_ITEM_EDITOR_HEADER_CLASS =
  "flex items-start gap-2 border-b border-stone-800/80 pb-3";

export const COAK_ITEM_EDITOR_KIND_CHIP_CLASS =
  "mb-1.5 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]";

export const COAK_ITEM_EDITOR_TITLE_INPUT_CLASS =
  "w-full rounded-md border border-stone-700/60 bg-stone-900 px-2.5 py-1.5 text-sm font-medium text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-stone-600 focus:bg-stone-900 focus:ring-2 focus:ring-lime-400/15 disabled:cursor-not-allowed disabled:opacity-60";

export const COAK_ITEM_EDITOR_TEXTAREA_CLASS =
  "w-full resize-none overflow-hidden rounded-md border border-stone-700/60 bg-stone-900 px-2.5 py-2 text-sm leading-relaxed text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-stone-600 focus:bg-stone-900 focus:ring-2 focus:ring-lime-400/15 disabled:cursor-not-allowed disabled:opacity-60";

export const COAK_ITEM_EDITOR_FILE_MENU_BUTTON_CLASS =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-stone-700/60 bg-stone-900 text-stone-300 transition hover:border-stone-600 hover:bg-stone-800 hover:text-stone-100 focus-visible:ring-2 focus-visible:ring-lime-400/15 disabled:cursor-not-allowed disabled:opacity-50";

export const COAK_ITEM_EDITOR_SECTION_LABEL_CLASS =
  "mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400";

export const COAK_ITEM_EDITOR_FOLDER_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md border border-stone-700/70 bg-stone-900 px-2.5 py-1.5 text-left text-xs text-stone-200 transition hover:border-stone-600 hover:bg-stone-800 hover:text-stone-50 disabled:cursor-not-allowed disabled:opacity-60";

export const COAK_ITEM_EDITOR_FOLDER_ROW_TITLE_CLASS =
  "block min-w-0 flex-1 bg-transparent text-xs text-stone-200 outline-none placeholder:text-stone-500 focus:text-stone-50 disabled:cursor-not-allowed disabled:opacity-60";

export const COAK_ITEM_EDITOR_FOLDER_ROW_ACTION_CLASS =
  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition disabled:cursor-not-allowed disabled:opacity-50";

export const COAK_ITEM_EDITOR_FOLDER_ROW_DELETE_CLASS =
  "text-red-400 hover:bg-red-950/40 hover:text-red-300";

export const COAK_ITEM_EDITOR_FOLDER_ROW_CONFIRM_CLASS =
  "text-amber-300 hover:bg-amber-950/40 hover:text-amber-200";

export const COAK_ITEM_EDITOR_FOLDER_ADD_ROW_CLASS =
  "flex w-full items-center justify-center rounded-md border border-dashed border-stone-700/70 bg-stone-900/60 px-2.5 py-1.5 text-stone-400 transition hover:border-stone-600 hover:bg-stone-800/80 hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-60";

export const COAK_ITEM_EDITOR_FOLDER_ADD_MENU_CLASS =
  "absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-md border border-stone-700/80 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80";

export const COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS =
  "overflow-hidden rounded-lg border border-stone-700/70 bg-stone-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export const COAK_ITEM_EDITOR_KIND_CHIP: Record<
  CoakItemKind,
  { label: string; className: string }
> = {
  note: {
    label: "Note",
    className: "bg-sky-950 text-sky-300 ring-1 ring-sky-800/50",
  },
  flash: {
    label: "Flash",
    className: "bg-amber-950 text-amber-300 ring-1 ring-amber-800/50",
  },
  folder: {
    label: "Folder",
    className: "bg-stone-800 text-stone-200 ring-1 ring-stone-700/60",
  },
};

export function coakItemEditorKindShellClass(kind: CoakItemKind): string {
  switch (kind) {
    case "note":
      return "border-sky-900/30 shadow-[0_16px_48px_rgba(0,0,0,0.62),0_0_24px_rgba(56,189,248,0.06)]";
    case "folder":
      return "border-amber-900/25 shadow-[0_16px_48px_rgba(0,0,0,0.62),0_0_24px_rgba(245,158,11,0.05)]";
    case "flash":
      return "border-[color-mix(in_srgb,var(--coak-flash-accent)_38%,rgb(68_64_60))] shadow-[0_16px_48px_rgba(0,0,0,0.62),0_0_24px_color-mix(in_srgb,var(--coak-flash-accent)_14%,transparent)]";
  }
}

export function coakItemEditorKindAccentBarClass(kind: CoakItemKind): string {
  switch (kind) {
    case "note":
      return "from-sky-400/35 via-sky-400/10 to-transparent";
    case "folder":
      return "from-amber-400/30 via-amber-400/8 to-transparent";
    case "flash":
      return "from-[color-mix(in_srgb,var(--coak-flash-accent)_45%,transparent)] via-[color-mix(in_srgb,var(--coak-flash-accent)_12%,transparent)] to-transparent";
  }
}
