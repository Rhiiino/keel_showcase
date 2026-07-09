// keel_web/src/app/nav/navWaveGlow.ts

// Resolves whether the nav menu accent wave glow animation is enabled.

import type { QueryClient } from "@tanstack/react-query";

import {
  settingsKeys,
  type UserSettingsPublic,
} from "../../modules/settings/api";

export const NAV_WAVE_GLOW_ENABLED_STORAGE_KEY = "keel.app.nav-wave-glow-enabled";

export const DEFAULT_NAV_WAVE_GLOW_ENABLED = true;

export function resolveNavWaveGlowEnabled(
  value: boolean | null | undefined,
): boolean {
  if (typeof value !== "boolean") {
    return DEFAULT_NAV_WAVE_GLOW_ENABLED;
  }
  return value;
}

export function readStoredNavWaveGlowEnabled(): boolean {
  try {
    const raw = localStorage.getItem(NAV_WAVE_GLOW_ENABLED_STORAGE_KEY);
    if (raw === "true") {
      return true;
    }
    if (raw === "false") {
      return false;
    }
    return DEFAULT_NAV_WAVE_GLOW_ENABLED;
  } catch {
    return DEFAULT_NAV_WAVE_GLOW_ENABLED;
  }
}

export function writeStoredNavWaveGlowEnabled(value: boolean): void {
  try {
    localStorage.setItem(NAV_WAVE_GLOW_ENABLED_STORAGE_KEY, String(value));
  } catch {
    // localStorage may be unavailable; server cache remains the source of truth.
  }
}

export function readNavWaveGlowEnabledFromCache(queryClient: QueryClient): boolean {
  const cached = queryClient.getQueryData<UserSettingsPublic>(settingsKeys.root());
  const fromServer = cached?.data.nav_wave_glow_enabled;
  if (typeof fromServer === "boolean") {
    return resolveNavWaveGlowEnabled(fromServer);
  }
  return readStoredNavWaveGlowEnabled();
}

export function applyNavWaveGlowEnabledPreference(
  queryClient: QueryClient,
  value: boolean,
): boolean {
  const resolved = resolveNavWaveGlowEnabled(value);
  writeStoredNavWaveGlowEnabled(resolved);
  queryClient.setQueryData<UserSettingsPublic>(settingsKeys.root(), (current) => ({
    data: {
      ...(current?.data ?? {}),
      nav_wave_glow_enabled: resolved,
    },
    updated_at: current?.updated_at ?? new Date().toISOString(),
  }));
  return resolved;
}
