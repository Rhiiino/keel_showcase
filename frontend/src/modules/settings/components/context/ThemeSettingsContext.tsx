// keel_web/src/modules/settings/components/context/ThemeSettingsContext.tsx

// React context for the global app theme (server-backed with local bootstrap).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { patchSettings } from "../../api";
import {
  APP_THEMES,
  applyThemeToDocument,
  DEFAULT_THEME_ID,
  getThemeCanvasBgColor,
  getThemePageBgColor,
  readStoredThemeId,
  writeStoredThemeId,
  type AppThemeDefinition,
  type AppThemeId,
} from "../../lib/theme";

const SYNC_DEBOUNCE_MS = 400;

type ThemeSettingsContextValue = {
  themeId: AppThemeId;
  themes: AppThemeDefinition[];
  pageBgColor: string;
  canvasBgColor: string;
  setThemeId: (themeId: AppThemeId) => void;
  hydrateTheme: (themeId: AppThemeId) => void;
};

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<AppThemeId>(() => readStoredThemeId());
  const pendingPatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = useCallback((next: AppThemeId) => {
    writeStoredThemeId(next);
    applyThemeToDocument(next);
    setThemeIdState(next);
  }, []);

  const queueRemoteSave = useCallback((next: AppThemeId) => {
    if (pendingPatchRef.current) {
      clearTimeout(pendingPatchRef.current);
    }
    pendingPatchRef.current = setTimeout(() => {
      pendingPatchRef.current = null;
      void patchSettings({ theme: next }).catch(() => {});
    }, SYNC_DEBOUNCE_MS);
  }, []);

  const setThemeId = useCallback(
    (next: AppThemeId) => {
      applyTheme(next);
      queueRemoteSave(next);
    },
    [applyTheme, queueRemoteSave],
  );

  const hydrateTheme = useCallback(
    (next: AppThemeId) => {
      applyTheme(next);
    },
    [applyTheme],
  );

  const value = useMemo(
    () => ({
      themeId,
      themes: APP_THEMES,
      pageBgColor: getThemePageBgColor(themeId),
      canvasBgColor: getThemeCanvasBgColor(themeId),
      setThemeId,
      hydrateTheme,
    }),
    [hydrateTheme, setThemeId, themeId],
  );

  return (
    <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings(): Omit<ThemeSettingsContextValue, "hydrateTheme"> {
  const ctx = useContext(ThemeSettingsContext);
  if (ctx == null) {
    return {
      themeId: DEFAULT_THEME_ID,
      themes: APP_THEMES,
      pageBgColor: getThemePageBgColor(DEFAULT_THEME_ID),
      canvasBgColor: getThemeCanvasBgColor(DEFAULT_THEME_ID),
      setThemeId: () => {},
    };
  }
  const { hydrateTheme: _hydrateTheme, ...rest } = ctx;
  return rest;
}

export function useThemeSettingsActions(): Pick<
  ThemeSettingsContextValue,
  "setThemeId" | "hydrateTheme"
> {
  const ctx = useContext(ThemeSettingsContext);
  if (ctx == null) {
    throw new Error("useThemeSettingsActions must be used within ThemeSettingsProvider");
  }
  return {
    setThemeId: ctx.setThemeId,
    hydrateTheme: ctx.hydrateTheme,
  };
}
