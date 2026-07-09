// keel_web/src/modules/settings/components/context/TransitionSettingsContext.tsx

// React context for app-wide transition settings (server-backed with local bootstrap).

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
  DEFAULT_TRANSITION_SETTINGS,
  readStoredTransitionSettings,
  writeStoredTransitionSettings,
  type TransitionPresetConfig,
  type TransitionSettings,
} from "../../lib/transition";

const SYNC_DEBOUNCE_MS = 400;

export type TransitionSettingsPatch = {
  enabled?: boolean;
  menu?: Partial<TransitionPresetConfig>;
  page?: Partial<TransitionPresetConfig>;
};

type TransitionSettingsContextValue = {
  settings: TransitionSettings;
  updateSettings: (patch: TransitionSettingsPatch) => void;
  replaceSettings: (next: TransitionSettings) => void;
};

const TransitionSettingsContext = createContext<TransitionSettingsContextValue | null>(
  null,
);

export function TransitionSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TransitionSettings>(() =>
    readStoredTransitionSettings(),
  );
  const pendingPatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueRemoteSave = useCallback((next: TransitionSettings) => {
    if (pendingPatchRef.current) {
      clearTimeout(pendingPatchRef.current);
    }
    pendingPatchRef.current = setTimeout(() => {
      pendingPatchRef.current = null;
      void patchSettings({ transitions: next }).catch(() => {});
    }, SYNC_DEBOUNCE_MS);
  }, []);

  const replaceSettings = useCallback(
    (next: TransitionSettings) => {
      writeStoredTransitionSettings(next);
      setSettings(next);
    },
    [],
  );

  const updateSettings = useCallback(
    (patch: TransitionSettingsPatch) => {
      setSettings((current) => {
        const next: TransitionSettings = {
          ...current,
          ...patch,
          menu: patch.menu ? { ...current.menu, ...patch.menu } : current.menu,
          page: patch.page ? { ...current.page, ...patch.page } : current.page,
        };
        writeStoredTransitionSettings(next);
        queueRemoteSave(next);
        return next;
      });
    },
    [queueRemoteSave],
  );

  const value = useMemo(
    () => ({ settings, updateSettings, replaceSettings }),
    [settings, updateSettings, replaceSettings],
  );

  return (
    <TransitionSettingsContext.Provider value={value}>
      {children}
    </TransitionSettingsContext.Provider>
  );
}

export function useTransitionSettings(): TransitionSettings {
  const ctx = useContext(TransitionSettingsContext);
  if (ctx == null) {
    return DEFAULT_TRANSITION_SETTINGS;
  }
  return ctx.settings;
}

export function useTransitionSettingsActions(): Pick<
  TransitionSettingsContextValue,
  "updateSettings" | "replaceSettings"
> {
  const ctx = useContext(TransitionSettingsContext);
  if (ctx == null) {
    throw new Error(
      "useTransitionSettingsActions must be used within TransitionSettingsProvider",
    );
  }
  return {
    updateSettings: ctx.updateSettings,
    replaceSettings: ctx.replaceSettings,
  };
}
