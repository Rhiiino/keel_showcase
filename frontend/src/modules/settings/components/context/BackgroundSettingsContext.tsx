// keel_web/src/modules/settings/components/context/BackgroundSettingsContext.tsx

// React context for the optional shell wallpaper (server-backed with local bootstrap).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { patchSettings, type ShellBackgroundSettings } from "../../api";
import {
  normalizeShellBackground,
  readStoredShellBackground,
  writeStoredShellBackground,
} from "../../lib/background";

const SYNC_DEBOUNCE_MS = 400;

type BackgroundSettingsContextValue = {
  shellBackground: ShellBackgroundSettings;
  enabled: boolean;
  mediaId: string | null;
  mediaUpdatedAt: string | null;
  setShellBackground: (next: Partial<ShellBackgroundSettings>) => void;
  hydrateShellBackground: (next: ShellBackgroundSettings) => void;
};

const BackgroundSettingsContext =
  createContext<BackgroundSettingsContextValue | null>(null);

function applyShellBackground(next: ShellBackgroundSettings): ShellBackgroundSettings {
  const normalized = normalizeShellBackground(next);
  writeStoredShellBackground(normalized);
  return normalized;
}

export function BackgroundSettingsProvider({ children }: { children: ReactNode }) {
  const [shellBackground, setShellBackgroundState] = useState<ShellBackgroundSettings>(
    () => readStoredShellBackground(),
  );
  const pendingPatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueRemoteSave = useCallback((next: ShellBackgroundSettings) => {
    if (pendingPatchRef.current) {
      clearTimeout(pendingPatchRef.current);
    }
    pendingPatchRef.current = setTimeout(() => {
      pendingPatchRef.current = null;
      void patchSettings({ shell_background: next }).catch(() => {});
    }, SYNC_DEBOUNCE_MS);
  }, []);

  const setShellBackground = useCallback(
    (patch: Partial<ShellBackgroundSettings>) => {
      setShellBackgroundState((current) => {
        const next = applyShellBackground({ ...current, ...patch });
        queueRemoteSave(next);
        return next;
      });
    },
    [queueRemoteSave],
  );

  const hydrateShellBackground = useCallback((next: ShellBackgroundSettings) => {
    const normalized = applyShellBackground(next);
    setShellBackgroundState(normalized);
  }, []);

  const value = useMemo(
    () => ({
      shellBackground,
      enabled: shellBackground.enabled,
      mediaId: shellBackground.media_id,
      mediaUpdatedAt: shellBackground.media_updated_at ?? null,
      setShellBackground,
      hydrateShellBackground,
    }),
    [hydrateShellBackground, setShellBackground, shellBackground],
  );

  return (
    <BackgroundSettingsContext.Provider value={value}>
      {children}
    </BackgroundSettingsContext.Provider>
  );
}

export function useBackgroundSettings(): Omit<
  BackgroundSettingsContextValue,
  "hydrateShellBackground" | "setShellBackground"
> {
  const ctx = useContext(BackgroundSettingsContext);
  if (ctx == null) {
    return {
      shellBackground: readStoredShellBackground(),
      enabled: false,
      mediaId: null,
      mediaUpdatedAt: null,
    };
  }
  const { hydrateShellBackground: _hydrate, setShellBackground: _set, ...rest } = ctx;
  return rest;
}

export function useBackgroundSettingsActions(): Pick<
  BackgroundSettingsContextValue,
  "setShellBackground" | "hydrateShellBackground"
> {
  const ctx = useContext(BackgroundSettingsContext);
  if (ctx == null) {
    throw new Error(
      "useBackgroundSettingsActions must be used within BackgroundSettingsProvider",
    );
  }
  return {
    setShellBackground: ctx.setShellBackground,
    hydrateShellBackground: ctx.hydrateShellBackground,
  };
}
