// keel_web/src/modules/settings/api.ts

// API layer for per-user UI settings (GET/PATCH /settings).

import { apiFetch } from "../../lib/api";
import type { NavLayoutEntry } from "../../app/nav/appNavLayout";
import type { ProjectTitleFontKey } from "../projects/lib/project/appearance";
import type { AppThemeId } from "./lib/theme";
import type { TransitionSettings } from "./lib/transition";

export type ShellBackgroundSettings = {
  enabled: boolean;
  media_id: string | null;
  media_updated_at?: string | null;
};

export type HomeSlideshowSettings = {
  media_ids?: string[];
  interval_seconds?: number | null;
  paused?: boolean;
  paused_media_id?: string | null;
};

export type HomeCardLayoutEntry = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

/** Stored shape: only hidden cards appear as `{ [cardId]: false }`. */
export type HomeCardVisibility = Record<string, boolean>;

export type HomeCardVisibilityPatch = Record<string, boolean>;

export type NavPanelPrefs = {
  open?: boolean;
  width?: number;
};

export type EmailMailbox = "inbox" | "sent" | "junk" | "trash";

export type EmailLastFetchFilters = {
  mailbox?: EmailMailbox;
  from_or_to?: string;
  subject?: string;
  body?: string;
  max_results?: number | null;
};

export type EmailSettings = {
  lastFetchFilters?: Record<string, EmailLastFetchFilters>;
};

/** Stored shape: only hidden nav items appear as `{ [itemId]: false }`. */
export type NavMenuVisibility = Record<string, boolean>;

export type UserSettingsData = {
  nav_menu_layout?: NavLayoutEntry[];
  nav_menu_visibility?: NavMenuVisibility | null;
  nav_wave_glow_enabled?: boolean | null;
  nav_breadcrumb_max_entries?: number | null;
  timezone?: string | null;
  nav_panel?: NavPanelPrefs;
  theme?: AppThemeId | string;
  transitions?: TransitionSettings;
  home_greeting_font_key?: ProjectTitleFontKey | null;
  home_greeting_font_size_px?: number | null;
  home_quote_interval_seconds?: number | null;
  shell_background?: ShellBackgroundSettings | null;
  home_slideshow?: HomeSlideshowSettings | null;
  home_card_layout?: HomeCardLayoutEntry[] | null;
  home_card_visibility?: HomeCardVisibility | null;
  email?: EmailSettings;
};

export type UserSettingsPublic = {
  data: UserSettingsData;
  updated_at: string;
};

export type UserSettingsPatch = Partial<UserSettingsData>;

export const settingsKeys = {
  all: ["settings"] as const,
  root: () => [...settingsKeys.all, "root"] as const,
};

export function fetchSettings(): Promise<UserSettingsPublic> {
  return apiFetch<UserSettingsPublic>("/settings", {
    credentials: "include",
  });
}

export function patchSettings(
  payload: UserSettingsPatch,
): Promise<UserSettingsPublic> {
  return apiFetch<UserSettingsPublic>("/settings", {
    method: "PATCH",
    credentials: "include",
    body: payload,
  });
}
