// keel_web/src/modules/settings/lib/background/shellBackgroundSettings.ts

// Shell wallpaper preference — localStorage bootstrap and normalization.

import type { ShellBackgroundSettings } from "../../api";

export const SHELL_BACKGROUND_STORAGE_KEY = "keel.app.shellBackground";

export const DEFAULT_SHELL_BACKGROUND: ShellBackgroundSettings = {
  enabled: false,
  media_id: null,
  media_updated_at: null,
};

export function normalizeShellBackground(
  value: Partial<ShellBackgroundSettings> | null | undefined,
): ShellBackgroundSettings {
  if (value == null) {
    return { ...DEFAULT_SHELL_BACKGROUND };
  }

  const mediaId =
    typeof value.media_id === "string" && value.media_id.trim()
      ? value.media_id.trim()
      : null;
  const mediaUpdatedAt =
    typeof value.media_updated_at === "string" && value.media_updated_at.trim()
      ? value.media_updated_at.trim()
      : null;

  return {
    enabled: mediaId != null ? Boolean(value.enabled) : false,
    media_id: mediaId,
    media_updated_at: mediaUpdatedAt,
  };
}

export function readStoredShellBackground(): ShellBackgroundSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SHELL_BACKGROUND };
  }

  try {
    const raw = window.localStorage.getItem(SHELL_BACKGROUND_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SHELL_BACKGROUND };
    }
    return normalizeShellBackground(JSON.parse(raw) as Partial<ShellBackgroundSettings>);
  } catch {
    return { ...DEFAULT_SHELL_BACKGROUND };
  }
}

export function writeStoredShellBackground(settings: ShellBackgroundSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeShellBackground(settings);
  if (
    !normalized.enabled &&
    normalized.media_id == null &&
    normalized.media_updated_at == null
  ) {
    window.localStorage.removeItem(SHELL_BACKGROUND_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    SHELL_BACKGROUND_STORAGE_KEY,
    JSON.stringify(normalized),
  );
}
