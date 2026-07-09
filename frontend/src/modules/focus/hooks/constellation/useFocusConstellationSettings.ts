// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationSettings.ts

// Loads and saves focus constellation visual settings via the API.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchFocusConstellationSettings,
  focusQueryKeys,
  updateFocusConstellationSettings,
  type FocusConstellationSettings,
  type FocusConstellationSettingsPayload,
} from "../../api";
import {
  buildLegacyFocusConstellationSettings,
  clearLegacyFocusConstellationSettingsStorage,
  FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT,
  type FocusConstellationCanvasTone,
  type FocusConstellationConfigPanelPosition,
  type FocusConstellationConnectionColor,
  type FocusConstellationConnectionStyle,
  type FocusConstellationListNodeStyle,
  type FocusConstellationNodeShape,
  type FocusConstellationLabelFontKey,
  type FocusConstellationSettingsSnapshot,
} from "../../lib/focus";

const SAVE_DEBOUNCE_MS = 400;

function toPayload(settings: FocusConstellationSettingsSnapshot): FocusConstellationSettingsPayload {
  return {
    node_shape: settings.node_shape,
    canvas_tone: settings.canvas_tone,
    connection_color: settings.connection_color,
    connection_style: settings.connection_style,
    list_node_style: settings.list_node_style,
    label_font_key: settings.label_font_key,
    node_size_multiplier: settings.node_size_multiplier,
    title_size_px: settings.title_size_px,
    unlink_distance_multiplier: settings.unlink_distance_multiplier,
    config_open: settings.config_open,
    config_position: settings.config_position,
    notes_panel_position: settings.notes_panel_position,
    node_info_enabled: settings.node_info_enabled,
  };
}

function stableSerializeSettings(settings: FocusConstellationSettingsSnapshot): string {
  return JSON.stringify(toPayload(settings));
}

function snapshotFromSettings(settings: FocusConstellationSettings): FocusConstellationSettingsSnapshot {
  return {
    node_shape: settings.node_shape,
    canvas_tone: settings.canvas_tone,
    connection_color: settings.connection_color,
    connection_style: settings.connection_style,
    list_node_style: settings.list_node_style,
    label_font_key: settings.label_font_key as FocusConstellationLabelFontKey,
    node_size_multiplier: settings.node_size_multiplier,
    title_size_px: settings.title_size_px,
    unlink_distance_multiplier: settings.unlink_distance_multiplier,
    config_open: settings.config_open,
    config_position: settings.config_position,
    notes_panel_position:
      settings.notes_panel_position ?? FOCUS_CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT,
    node_info_enabled: settings.node_info_enabled ?? true,
  };
}



// ----- Constellation settings hook
export function useFocusConstellationSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: focusQueryKeys.constellationSettings(),
    queryFn: fetchFocusConstellationSettings,
  });

  const [settings, setSettings] = useState<FocusConstellationSettingsSnapshot | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const skipSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const latestSettingsRef = useRef<FocusConstellationSettingsSnapshot | null>(null);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!settingsQuery.data || isHydrated) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      let nextSettings = settingsQuery.data;

      if (!nextSettings.persisted) {
        const legacySettings = buildLegacyFocusConstellationSettings();
        try {
          nextSettings = await updateFocusConstellationSettings(toPayload(legacySettings));
          queryClient.setQueryData(focusQueryKeys.constellationSettings(), nextSettings);
          clearLegacyFocusConstellationSettingsStorage();
        } catch {
          nextSettings = { ...toPayload(legacySettings), persisted: false };
        }
      }

      if (cancelled) {
        return;
      }

      const hydratedSettings = snapshotFromSettings(nextSettings);
      setSettings(hydratedSettings);
      setSavedSnapshot(stableSerializeSettings(hydratedSettings));
      setIsHydrated(true);
      skipSaveRef.current = false;
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, queryClient, settingsQuery.data]);

  const currentSnapshot = settings ? stableSerializeSettings(settings) : null;

  const isDirty =
    isHydrated &&
    settings !== null &&
    (hasPendingSave ||
      isSaving ||
      (savedSnapshot !== null &&
        currentSnapshot !== null &&
        currentSnapshot !== savedSnapshot));

  const flushSave = useCallback(async () => {
    if (skipSaveRef.current || !isHydrated || !latestSettingsRef.current) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      setHasPendingSave(false);
    }

    setIsSaving(true);
    try {
      const saved = await updateFocusConstellationSettings(
        toPayload(latestSettingsRef.current),
      );
      queryClient.setQueryData(focusQueryKeys.constellationSettings(), saved);
      if (latestSettingsRef.current) {
        setSavedSnapshot(stableSerializeSettings(latestSettingsRef.current));
      }
    } catch {
      // Ignore transient save failures; the next change will retry.
    } finally {
      setIsSaving(false);
    }
  }, [isHydrated, queryClient]);

  const scheduleSave = useCallback(() => {
    if (skipSaveRef.current || !isHydrated) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    setHasPendingSave(true);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      setHasPendingSave(false);
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  }, [flushSave, isHydrated]);

  useEffect(() => {
    scheduleSave();
  }, [settings, scheduleSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      void flushSave();
    };
  }, [flushSave]);

  const updateSettings = useCallback(
    (patch: Partial<FocusConstellationSettingsSnapshot>) => {
      setSettings((current) => {
        if (!current) {
          return current;
        }
        return { ...current, ...patch };
      });
    },
    [],
  );

  return {
    settings,
    isLoading: settingsQuery.isLoading || !isHydrated,
    isError: settingsQuery.isError,
    flushSave,
    isDirty,
    isSaving,
    setNodeShape: (node_shape: FocusConstellationNodeShape) => updateSettings({ node_shape }),
    setCanvasTone: (canvas_tone: FocusConstellationCanvasTone) =>
      updateSettings({ canvas_tone }),
    setConnectionColor: (connection_color: FocusConstellationConnectionColor) =>
      updateSettings({ connection_color }),
    setConnectionStyle: (connection_style: FocusConstellationConnectionStyle) =>
      updateSettings({ connection_style }),
    setListNodeStyle: (list_node_style: FocusConstellationListNodeStyle) =>
      updateSettings({ list_node_style }),
    setNodeSizeMultiplier: (node_size_multiplier: number) =>
      updateSettings({ node_size_multiplier }),
    setTitleSize: (title_size_px: number) => updateSettings({ title_size_px }),
    setUnlinkDistance: (unlink_distance_multiplier: number) =>
      updateSettings({ unlink_distance_multiplier }),
    setConfigOpen: (config_open: boolean) => updateSettings({ config_open }),
    setConfigPosition: (config_position: FocusConstellationConfigPanelPosition) =>
      updateSettings({ config_position }),
    setNotesPanelPosition: (notes_panel_position: FocusConstellationConfigPanelPosition) =>
      updateSettings({ notes_panel_position }),
    setNodeInfoEnabled: (node_info_enabled: boolean) =>
      updateSettings({ node_info_enabled }),
  };
}
