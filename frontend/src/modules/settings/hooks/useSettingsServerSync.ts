// keel_web/src/modules/settings/hooks/useSettingsServerSync.ts

// Hydrates theme and transitions from GET /settings after login; one-time localStorage migration.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../api";
import {
  useThemeSettingsActions,
} from "../components/context/ThemeSettingsContext";
import {
  useBackgroundSettingsActions,
} from "../components/context/BackgroundSettingsContext";
import {
  useTransitionSettingsActions,
} from "../components/context/TransitionSettingsContext";
import {
  resolveThemeId,
  readStoredThemeId,
} from "../lib/theme";
import {
  normalizeShellBackground,
  readStoredShellBackground,
} from "../lib/background";
import {
  DEFAULT_TRANSITION_SETTINGS,
  readStoredTransitionSettings,
} from "../lib/transition";
import {
  readStoredNavBreadcrumbMaxEntries,
  resolveNavigationBreadcrumbMaxEntries,
  writeStoredNavBreadcrumbMaxEntries,
} from "../../../app/navigation/breadcrumbMaxEntries";
import {
  detectBrowserTimezone,
  readStoredUserTimezone,
  syncActiveUserTimezone,
} from "../../../app/timezone";

export function useSettingsServerSync() {
  const hydratedRef = useRef(false);
  const { hydrateTheme } = useThemeSettingsActions();
  const { hydrateShellBackground } = useBackgroundSettingsActions();
  const { replaceSettings } = useTransitionSettingsActions();

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!settingsQuery.isSuccess || hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;

    const data = settingsQuery.data.data;
    const patch: Record<string, unknown> = {};

    const resolvedTheme = resolveThemeId(data.theme);
    if (resolvedTheme) {
      hydrateTheme(resolvedTheme);
      if (data.theme !== resolvedTheme) {
        patch.theme = resolvedTheme;
      }
    } else {
      const localTheme = readStoredThemeId();
      hydrateTheme(localTheme);
      patch.theme = localTheme;
    }

    if (data.transitions) {
      replaceSettings({
        enabled: data.transitions.enabled ?? DEFAULT_TRANSITION_SETTINGS.enabled,
        menu: { ...DEFAULT_TRANSITION_SETTINGS.menu, ...data.transitions.menu },
        page: { ...DEFAULT_TRANSITION_SETTINGS.page, ...data.transitions.page },
      });
    } else {
      const localTransitions = readStoredTransitionSettings();
      replaceSettings(localTransitions);
      patch.transitions = localTransitions;
    }

    if (data.shell_background) {
      hydrateShellBackground(normalizeShellBackground(data.shell_background));
    } else {
      const localShellBackground = readStoredShellBackground();
      hydrateShellBackground(localShellBackground);
      if (
        localShellBackground.enabled ||
        localShellBackground.media_id != null
      ) {
        patch.shell_background = localShellBackground;
      }
    }

    if (typeof data.nav_breadcrumb_max_entries === "number") {
      writeStoredNavBreadcrumbMaxEntries(data.nav_breadcrumb_max_entries);
    } else {
      const localMaxEntries = readStoredNavBreadcrumbMaxEntries();
      if (
        localMaxEntries !== resolveNavigationBreadcrumbMaxEntries(undefined)
      ) {
        patch.nav_breadcrumb_max_entries = localMaxEntries;
      }
    }

    if (typeof data.timezone === "string" && data.timezone.trim()) {
      syncActiveUserTimezone(data.timezone);
    } else {
      const localTimeZone = readStoredUserTimezone() ?? detectBrowserTimezone();
      syncActiveUserTimezone(localTimeZone);
      patch.timezone = localTimeZone;
    }

    if (Object.keys(patch).length > 0) {
      void patchSettings(patch).catch(() => {
        // Server sync is best-effort; local state remains usable.
      });
    }
  }, [hydrateShellBackground, hydrateTheme, replaceSettings, settingsQuery.data, settingsQuery.isSuccess]);
}
