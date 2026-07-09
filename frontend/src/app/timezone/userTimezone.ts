// keel_web/src/app/timezone/userTimezone.ts

// Resolves and caches the user's preferred IANA timezone from settings.

import type { QueryClient } from "@tanstack/react-query";

import {
  settingsKeys,
  type UserSettingsPublic,
} from "../../modules/settings/api";
import { isValidIanaTimeZone } from "./zonedDateTime";

export const USER_TIMEZONE_STORAGE_KEY = "keel.app.user-timezone";

let activeUserTimezone: string | null = null;

export function detectBrowserTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && isValidIanaTimeZone(detected)) {
      return detected;
    }
  } catch {
    // Fall through to UTC.
  }
  return "UTC";
}

export function resolveUserTimezone(value: string | null | undefined): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isValidIanaTimeZone(trimmed)) {
      return trimmed;
    }
  }
  return detectBrowserTimezone();
}

export function readStoredUserTimezone(): string | null {
  try {
    const raw = localStorage.getItem(USER_TIMEZONE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const trimmed = raw.trim();
    return isValidIanaTimeZone(trimmed) ? trimmed : null;
  } catch {
    return null;
  }
}

export function writeStoredUserTimezone(timeZone: string): void {
  try {
    localStorage.setItem(USER_TIMEZONE_STORAGE_KEY, resolveUserTimezone(timeZone));
  } catch {
    // localStorage may be unavailable; in-memory cache remains usable.
  }
}

export function syncActiveUserTimezone(timeZone: string | null | undefined): string {
  const resolved = resolveUserTimezone(timeZone ?? readStoredUserTimezone());
  activeUserTimezone = resolved;
  writeStoredUserTimezone(resolved);
  return resolved;
}

export function getUserTimezone(): string {
  if (activeUserTimezone) {
    return activeUserTimezone;
  }
  return resolveUserTimezone(readStoredUserTimezone());
}

export function readUserTimezoneFromCache(queryClient: QueryClient): string {
  const cached = queryClient.getQueryData<UserSettingsPublic>(settingsKeys.root());
  const fromServer = cached?.data.timezone;
  if (typeof fromServer === "string" && fromServer.trim()) {
    return resolveUserTimezone(fromServer);
  }
  return resolveUserTimezone(readStoredUserTimezone());
}

export function applyUserTimezonePreference(
  queryClient: QueryClient,
  timeZone: string,
): string {
  const resolved = resolveUserTimezone(timeZone);
  syncActiveUserTimezone(resolved);
  queryClient.setQueryData<UserSettingsPublic>(settingsKeys.root(), (current) => ({
    data: {
      ...(current?.data ?? {}),
      timezone: resolved,
    },
    updated_at: current?.updated_at ?? new Date().toISOString(),
  }));
  return resolved;
}
