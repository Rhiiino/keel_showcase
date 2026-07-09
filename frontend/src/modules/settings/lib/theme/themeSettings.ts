// stack_sandbox/frontend_web/src/modules/settings/lib/theme/themeSettings.ts

// Global app theme registry and localStorage persistence.

export const THEME_SETTINGS_STORAGE_KEY = "keel.app.theme";

export type AppThemeId =
  | "forest"
  | "ember"
  | "sage"
  | "parchment"
  | "midnight"
  | "obsidian"
  | "sepia"
  | "signal"
  | "rainy_night";

export type AppThemeDefinition = {
  id: AppThemeId;
  name: string;
  description: string;
  /** When true, the theme renders animated effects (e.g. rain) app-wide. */
  dynamic?: boolean;
  /** Page backdrop hex for inline styles (e.g. cover edge fades). */
  pageBgColor: string;
  /** Workspace / label backdrop hex. */
  canvasBgColor: string;
};

export const LEGACY_THEME_ID_MAP: Record<string, AppThemeId> = {
  "theme-one": "forest",
  "theme-two": "ember",
  "theme-three": "sage",
  "theme-four": "parchment",
};

export const APP_THEMES: AppThemeDefinition[] = [
  {
    id: "forest",
    name: "Forest",
    description:
      "Warm forest dark — the default Keel look with olive blacks, soft depth, and lime accents.",
    pageBgColor: "#050705",
    canvasBgColor: "#0a0b0a",
  },
  {
    id: "ember",
    name: "Ember",
    description:
      "Warm charcoal with sand surfaces and amber highlights — dark, not light mode.",
    pageBgColor: "#151310",
    canvasBgColor: "#1c1a17",
  },
  {
    id: "sage",
    name: "Sage",
    description:
      "Cool sage graphite with muted green-gray surfaces and emerald highlights.",
    pageBgColor: "#0c0f0e",
    canvasBgColor: "#121614",
  },
  {
    id: "parchment",
    name: "Parchment",
    description:
      "Soft light parchment with sage-tinted surfaces, rounded chrome, and teal accents.",
    pageBgColor: "#c8ccc4",
    canvasBgColor: "#bcc2b8",
  },
  {
    id: "midnight",
    name: "Midnight",
    description:
      "Deep navy grounds with cool blue-violet accents and blue-tinted ambient shadows.",
    pageBgColor: "#080c18",
    canvasBgColor: "#0c1224",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description:
      "OLED black with flat surfaces, sharp corners, minimal gradient, and cyan accents.",
    pageBgColor: "#000000",
    canvasBgColor: "#040404",
  },
  {
    id: "sepia",
    name: "Sepia",
    description:
      "Warm vintage brown palette with copper accents, wider corners, and paper-like warmth.",
    pageBgColor: "#18120e",
    canvasBgColor: "#201812",
  },
  {
    id: "signal",
    name: "Signal",
    description:
      "High-contrast dark with bold borders, sharp geometry, and vivid coral accent rings.",
    pageBgColor: "#040404",
    canvasBgColor: "#080808",
  },
  {
    id: "rainy_night",
    name: "Rainy night",
    description:
      "Deep black grounds with cool blue highlights and layered falling rain — Keel's first dynamic theme.",
    dynamic: true,
    pageBgColor: "#020202",
    canvasBgColor: "#060606",
  },
];

export const DEFAULT_THEME_ID: AppThemeId = "forest";

const THEME_IDS = new Set<AppThemeId>(APP_THEMES.map((theme) => theme.id));

export function isAppThemeId(value: unknown): value is AppThemeId {
  return typeof value === "string" && THEME_IDS.has(value as AppThemeId);
}

/** Maps legacy theme IDs and validates against the current registry. */
export function resolveThemeId(value: unknown): AppThemeId | null {
  if (typeof value !== "string") {
    return null;
  }

  const mapped = LEGACY_THEME_ID_MAP[value] ?? value;
  return isAppThemeId(mapped) ? mapped : null;
}

export function getAppThemeDefinition(themeId: AppThemeId): AppThemeDefinition {
  return APP_THEMES.find((theme) => theme.id === themeId) ?? APP_THEMES[0];
}

export function getThemePageBgColor(themeId: AppThemeId): string {
  return getAppThemeDefinition(themeId).pageBgColor;
}

export function getThemeCanvasBgColor(themeId: AppThemeId): string {
  return getAppThemeDefinition(themeId).canvasBgColor;
}

export function isDynamicAppTheme(themeId: AppThemeId): boolean {
  return getAppThemeDefinition(themeId).dynamic === true;
}

export function readStoredThemeId(): AppThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID;
  }

  try {
    const raw = window.localStorage.getItem(THEME_SETTINGS_STORAGE_KEY);
    const resolved = resolveThemeId(raw);
    if (resolved) {
      if (raw !== resolved) {
        writeStoredThemeId(resolved);
      }
      return resolved;
    }
  } catch {
    // ignore quota / privacy errors
  }

  return DEFAULT_THEME_ID;
}

export function writeStoredThemeId(themeId: AppThemeId): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_SETTINGS_STORAGE_KEY, themeId);
  } catch {
    // ignore
  }
}

/** Applies `data-app-theme` on `<html>` so CSS variables drive Tailwind colors. */
export function applyThemeToDocument(themeId: AppThemeId): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-app-theme", themeId);
}
