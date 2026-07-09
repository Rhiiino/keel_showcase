// keel_web/src/modules/projects/hooks/useProjectWorkspaceSettings.ts

// Loads and saves per-project workspace canvas UI settings via the API.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchProjectWorkspaceSettings,
  projectsQueryKeys,
  updateProjectWorkspaceSettings,
  type ProjectWorkspaceApiResponse,
} from "../api";
import {
  snapshotFromWorkspaceSettings,
  workspaceSettingsToPayload,
  type ProjectWorkspaceSettingsSnapshot,
  type WorkspaceCanvasColorPreset,
  type WorkspaceCanvasConfigPanelPosition,
  type WorkspaceCanvasConnectionStyle,
  type WorkspaceNoteColorStyle,
  type WorkspaceNoteItalicColorPreset,
} from "../lib/workspace";

const SAVE_DEBOUNCE_MS = 400;

function stableSerializeSettings(settings: ProjectWorkspaceSettingsSnapshot): string {
  return JSON.stringify(workspaceSettingsToPayload(settings));
}

function isSettingsSnapshotDirty(
  settings: ProjectWorkspaceSettingsSnapshot,
  savedSnapshot: string | null,
): boolean {
  if (savedSnapshot === null) {
    return true;
  }
  return stableSerializeSettings(settings) !== savedSnapshot;
}



// ----- Workspace settings hook
export function useProjectWorkspaceSettings(projectId: number, canvasId: number) {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: projectsQueryKeys.workspaceSettings(projectId, canvasId),
    queryFn: () => fetchProjectWorkspaceSettings(projectId, canvasId),
    enabled:
      Number.isFinite(projectId) &&
      projectId > 0 &&
      Number.isFinite(canvasId) &&
      canvasId > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [settings, setSettings] = useState<ProjectWorkspaceSettingsSnapshot | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const skipSaveRef = useRef(true);
  const skipNextScheduleSaveRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const latestSettingsRef = useRef<ProjectWorkspaceSettingsSnapshot | null>(null);
  const savedSnapshotRef = useRef<string | null>(null);
  const projectIdRef = useRef(projectId);
  const canvasIdRef = useRef(canvasId);

  useEffect(() => {
    projectIdRef.current = projectId;
    canvasIdRef.current = canvasId;
  }, [canvasId, projectId]);

  useEffect(() => {
    setSettings(null);
    setIsHydrated(false);
    setSavedSnapshot(null);
    setHasPendingSave(false);
    setIsSaving(false);
    latestSettingsRef.current = null;
    savedSnapshotRef.current = null;
    skipSaveRef.current = true;
    skipNextScheduleSaveRef.current = false;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, [canvasId, projectId]);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    savedSnapshotRef.current = savedSnapshot;
  }, [savedSnapshot]);

  useEffect(() => {
    if (
      !settingsQuery.isSuccess ||
      settingsQuery.isFetching ||
      !settingsQuery.data ||
      isHydrated
    ) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      const nextSettings = settingsQuery.data;

      if (cancelled) {
        return;
      }

      const hydratedSettings = snapshotFromWorkspaceSettings(nextSettings);
      const hydratedSnapshot = stableSerializeSettings(hydratedSettings);
      skipNextScheduleSaveRef.current = true;
      setSettings(hydratedSettings);
      setSavedSnapshot(hydratedSnapshot);
      savedSnapshotRef.current = hydratedSnapshot;
      setIsHydrated(true);
      skipSaveRef.current = false;
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    canvasId,
    isHydrated,
    projectId,
    queryClient,
    settingsQuery.data,
    settingsQuery.isFetching,
    settingsQuery.isSuccess,
  ]);

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

    const nextSnapshot = stableSerializeSettings(latestSettingsRef.current);
    if (savedSnapshotRef.current === nextSnapshot) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      setHasPendingSave(false);
    }

    setIsSaving(true);
    try {
      const saved = await updateProjectWorkspaceSettings(
        projectIdRef.current,
        canvasIdRef.current,
        workspaceSettingsToPayload(latestSettingsRef.current),
      );
      queryClient.setQueryData(
        projectsQueryKeys.workspaceSettings(
          projectIdRef.current,
          canvasIdRef.current,
        ),
        saved,
      );
      queryClient.setQueryData<ProjectWorkspaceApiResponse>(
        projectsQueryKeys.workspace(projectIdRef.current, canvasIdRef.current),
        (current) =>
          current
            ? { ...current, settings: saved }
            : current,
      );
      if (
        latestSettingsRef.current &&
        stableSerializeSettings(latestSettingsRef.current) === nextSnapshot
      ) {
        setSavedSnapshot(nextSnapshot);
        savedSnapshotRef.current = nextSnapshot;
      }
    } catch {
      // Ignore transient save failures; the next change will retry.
    } finally {
      setIsSaving(false);
    }
  }, [isHydrated, queryClient]);

  const scheduleSave = useCallback(() => {
    if (skipSaveRef.current || !isHydrated || !latestSettingsRef.current) {
      return;
    }

    if (skipNextScheduleSaveRef.current) {
      skipNextScheduleSaveRef.current = false;
      return;
    }

    if (!isSettingsSnapshotDirty(latestSettingsRef.current, savedSnapshotRef.current)) {
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
    (patch: Partial<ProjectWorkspaceSettingsSnapshot>) => {
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
    isLoading:
      settingsQuery.isLoading || settingsQuery.isFetching || !isHydrated,
    isError: settingsQuery.isError,
    refetch: settingsQuery.refetch,
    flushSave,
    isDirty,
    isSaving,
    setCanvasColor: (canvas_color: WorkspaceCanvasColorPreset) =>
      updateSettings({ canvas_color }),
    setSnapEnabled: (snap_enabled: boolean) => updateSettings({ snap_enabled }),
    setMinimapOpen: (minimap_open: boolean) => updateSettings({ minimap_open }),
    setGridDotStrength: (grid_dot_strength: number) =>
      updateSettings({ grid_dot_strength }),
    setConfigOpen: (config_open: boolean) => updateSettings({ config_open }),
    setConfigPosition: (config_position: WorkspaceCanvasConfigPanelPosition) =>
      updateSettings({ config_position }),
    setTextFontScale: (text_font_scale: number) => updateSettings({ text_font_scale }),
    setConnectionStyle: (connection_style: WorkspaceCanvasConnectionStyle) =>
      updateSettings({ connection_style }),
    setNoteColorStyle: (note_color_style: WorkspaceNoteColorStyle) =>
      updateSettings({ note_color_style }),
    setNoteItalicColor: (note_italic_color: WorkspaceNoteItalicColorPreset) =>
      updateSettings({ note_italic_color }),
    setNotesGridLayout: (
      notes_grid_layout: ProjectWorkspaceSettingsSnapshot["notes_grid_layout"],
    ) => updateSettings({ notes_grid_layout }),
  };
}
