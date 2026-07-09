// keel_web/src/modules/projects/pages/ProjectWorkspacePage.tsx

// Full-bleed Obsidian-style workspace canvas for a single project.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { isNotFound } from "../../../lib/apiErrors";
import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { NAVIGATION_PAGE_KEYS } from "../../../app/navigation/navigationStackConfig";
import { usePageNavigationState } from "../../../app/navigation/usePageNavigationState";
import {
  fetchProject,
  fetchProjectWorkspace,
  projectsQueryKeys,
} from "../api";
import {
  ProjectWorkspaceCanvas,
  WorkspaceCanvasColorToggle,
  WorkspaceCanvasConfigPanel,
  WorkspaceCanvasConnectionStyleToggle,
  WorkspaceCanvasMinimapToggle,
  WorkspaceCanvasTextFontSlider,
  WorkspaceGridDotStrengthSlider,
  WorkspaceMediaDragPreview,
  WorkspaceNoteColorStyleToggle,
  WorkspaceNoteItalicColorToggle,
  WorkspaceSidePanel,
  WorkspaceSidePanelReveal,
  WorkspaceViewProvider,
} from "../components/workspace";
import type { WorkspaceSidePanelTab } from "../components/workspace/panel/WorkspaceSidePanel";
import { useWorkspaceViewContext } from "../components/workspace/context/WorkspaceViewContext";
import { useProjectWorkspaceSettings } from "../hooks/useProjectWorkspaceSettings";
import { useWorkspaceCanvases } from "../hooks/useWorkspaceCanvases";
import { useWorkspaceFilesPanel } from "../hooks/useWorkspaceFilesPanel";
import { useWorkspacePanelLayout } from "../hooks/useWorkspacePanelLayout";
import { useWorkspaceProjectSummary } from "../hooks/useWorkspaceProjectSummary";
import { parseWorkspaceState } from "../lib/workspace";

export function ProjectWorkspacePage() {
  const { projectId: projectIdParam, canvasId: canvasIdParam } = useParams<{
    projectId: string;
    canvasId: string;
  }>();
  const projectId = Number(projectIdParam);
  const canvasId = Number(canvasIdParam);
  const invalidParams =
    !Number.isFinite(projectId) ||
    projectId <= 0 ||
    !Number.isFinite(canvasId) ||
    canvasId <= 0;

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidParams,
    listPath: "/projects",
    notice: "That workspace could not be found.",
  });

  if (redirecting) {
    return null;
  }

  return (
    <WorkspaceViewProvider>
      <ProjectWorkspacePageContent projectId={projectId} canvasId={canvasId} />
    </WorkspaceViewProvider>
  );
}

type ProjectWorkspacePageContentProps = {
  projectId: number;
  canvasId: number;
};

function ProjectWorkspacePageContent({
  projectId,
  canvasId,
}: ProjectWorkspacePageContentProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeSidePanelTab, setActiveSidePanelTab] =
    useState<WorkspaceSidePanelTab>("general");
  const canvasFlushRef = useRef<(() => void) | null>(null);
  const { resetWorkspacePanelState, workspaceNotes } = useWorkspaceViewContext();
  const workspaceSettings = useProjectWorkspaceSettings(projectId, canvasId);

  const flushBeforeCanvasSwitch = useCallback(async () => {
    canvasFlushRef.current?.();
    await workspaceSettings.flushSave();
  }, [workspaceSettings.flushSave]);

  const canvases = useWorkspaceCanvases({
    projectId,
    activeCanvasId: canvasId,
    onBeforeSwitch: flushBeforeCanvasSwitch,
  });

  useEffect(() => {
    resetWorkspacePanelState();
  }, [canvasId, resetWorkspacePanelState]);

  usePageNavigationState(NAVIGATION_PAGE_KEYS.projectWorkspace, {
    capture: () => ({ panelOpen, activeSidePanelTab }),
    restore: (state) => {
      if (state && typeof state.panelOpen === "boolean") {
        setPanelOpen(state.panelOpen);
      }
      if (
        state &&
        (state.activeSidePanelTab === "general" ||
          state.activeSidePanelTab === "files" ||
          state.activeSidePanelTab === "notes" ||
          state.activeSidePanelTab === "canvas")
      ) {
        setActiveSidePanelTab(state.activeSidePanelTab);
      }
    },
  });

  useEffect(() => {
    setActiveSidePanelTab("general");
  }, [projectId]);

  const filesPanel = useWorkspaceFilesPanel({ projectId });
  const panelLayout = useWorkspacePanelLayout();
  const canvasIds = useMemo(
    () => canvases.canvases.map((canvas) => canvas.canvas_id),
    [canvases.canvases],
  );
  const projectSummary = useWorkspaceProjectSummary({
    projectId,
    canvasIds,
  });
  const noteCountByCanvasId = useMemo(() => {
    const counts = new Map(projectSummary.noteCountByCanvasId);
    counts.set(canvasId, workspaceNotes.length);
    return counts;
  }, [canvasId, projectSummary.noteCountByCanvasId, workspaceNotes.length]);
  const totalNoteCount = useMemo(
    () => [...noteCountByCanvasId.values()].reduce((sum, count) => sum + count, 0),
    [noteCountByCanvasId],
  );

  const projectQuery = useQuery({
    queryKey: projectsQueryKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const projectRedirecting = useRecordNotFoundRedirect({
    isLoading: projectQuery.isLoading,
    error: projectQuery.error,
    isFetched: projectQuery.isFetched,
    hasData: Boolean(projectQuery.data),
    listPath: "/projects",
    notice: "That project could not be found.",
  });

  const workspaceQuery = useQuery({
    queryKey: projectsQueryKeys.workspace(projectId, canvasId),
    queryFn: () => fetchProjectWorkspace(projectId, canvasId),
    enabled:
      Number.isFinite(projectId) &&
      projectId > 0 &&
      Number.isFinite(canvasId) &&
      canvasId > 0 &&
      Boolean(projectQuery.data),
  });

  const workspaceRedirecting = useRecordNotFoundRedirect({
    isLoading: workspaceQuery.isLoading,
    error: workspaceQuery.error,
    isFetched: workspaceQuery.isFetched,
    hasData: Boolean(workspaceQuery.data),
    listPath: `/projects/${projectId}`,
    notice: "That workspace could not be found.",
  });

  if (projectRedirecting || workspaceRedirecting) {
    return null;
  }

  const isLoading =
    projectQuery.isLoading ||
    workspaceQuery.isLoading ||
    workspaceSettings.isLoading ||
    canvases.isLoading;
  const isError =
    (projectQuery.isError && !isNotFound(projectQuery.error)) ||
    (workspaceQuery.isError && !isNotFound(workspaceQuery.error)) ||
    workspaceSettings.isError ||
    canvases.isError;

  const sidePanelElement = (
    <WorkspaceSidePanel
      projectId={projectId}
      activeCanvasId={canvasId}
      project={projectQuery.data ?? null}
      projectLoading={projectQuery.isLoading}
      open={panelOpen}
      onOpenChange={setPanelOpen}
      width={panelLayout.width}
      side={panelLayout.side}
      isResizing={panelLayout.isResizing}
      isRepositioning={panelLayout.isRepositioning}
      onResizePointerDown={panelLayout.onResizePointerDown}
      onRepositionPointerDown={panelLayout.onRepositionPointerDown}
      pendingUploads={filesPanel.pendingUploads}
      uploadPending={filesPanel.uploadPending}
      uploadError={filesPanel.uploadError}
      onQueueFiles={filesPanel.queueFiles}
      onRemovePending={filesPanel.removePending}
      onDeleteFile={filesPanel.deleteFile}
      onDeleteFolder={filesPanel.deleteFolder}
      onRenameFile={filesPanel.renameFile}
      onRenameFolder={filesPanel.renameFolder}
      deletePending={filesPanel.deletePending}
      deletingMediaId={filesPanel.deletingMediaId}
      deletingFolderId={filesPanel.deletingFolderId}
      deleteError={filesPanel.deleteError}
      folderNavStack={filesPanel.folderNavStack}
      onNavigateFolder={filesPanel.navigateToFolder}
      onOpenFolder={filesPanel.openFolder}
      allFolders={filesPanel.allFolders}
      currentFolderId={filesPanel.currentFolderId}
      uploadTarget={filesPanel.uploadTarget}
      sourceDialogOpen={filesPanel.sourceDialogOpen}
      sourceDialogAnchor={filesPanel.sourceDialogAnchor}
      mediaPickerOpen={filesPanel.mediaPickerOpen}
      onOpenSourceMenu={filesPanel.openSourceMenu}
      onCloseSourceMenu={filesPanel.closeSourceMenu}
      onOpenMediaPicker={() => filesPanel.setMediaPickerOpen(true)}
      onCloseMediaPicker={() => filesPanel.setMediaPickerOpen(false)}
      onAttachFromLibrary={(media) => void filesPanel.attachFromLibrary(media)}
      onCreateFolder={filesPanel.createFolder}
      autoRenameFolderId={filesPanel.autoRenameFolderId}
      onClearAutoRenameFolder={filesPanel.clearAutoRenameFolder}
      onMoveAttachment={filesPanel.moveAttachment}
      onMoveFolder={filesPanel.moveFolder}
      controlsDisabled={filesPanel.controlsDisabled}
      canvases={canvases.canvases}
      canvasesLoading={canvases.isLoading}
      canvasesDeletePending={canvases.deletePending}
      onCreateCanvas={() => {
        setActiveSidePanelTab("canvas");
        canvases.createCanvas();
      }}
      onSelectCanvas={(nextCanvasId) => void canvases.switchCanvas(nextCanvasId)}
      onRenameCanvas={canvases.renameCanvas}
      onDeleteCanvas={canvases.deleteCanvas}
      onSetDefaultCanvas={canvases.setDefaultCanvas}
      autoRenameCanvasId={canvases.autoRenameCanvasId}
      onClearAutoRenameCanvas={canvases.clearAutoRenameCanvas}
      canvasCount={projectSummary.canvasCount}
      totalNoteCount={totalNoteCount}
      fileCount={projectSummary.fileCount}
      summaryLoading={projectSummary.isLoading}
      noteCountByCanvasId={noteCountByCanvasId}
      activeTab={activeSidePanelTab}
      onActiveTabChange={setActiveSidePanelTab}
    />
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <WorkspaceMediaDragPreview />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {panelLayout.side === "left" && sidePanelElement}

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-app/80 text-sm text-stone-500">
              Loading workspace…
            </div>
          )}
          {isError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-app/90 p-6 text-center">
              <p className="text-sm text-red-400">Could not load workspace.</p>
              <button
                type="button"
                onClick={() => {
                  void projectQuery.refetch();
                  void workspaceQuery.refetch();
                  void workspaceSettings.refetch();
                  void canvases.refetch();
                }}
                className="rounded-md bg-stone-800 px-3 py-1.5 text-xs text-stone-200 hover:bg-stone-700"
              >
                Retry
              </button>
            </div>
          )}
          {workspaceQuery.data && workspaceSettings.settings && !isError && (
            <ProjectWorkspaceCanvas
              key={canvasId}
              projectId={projectId}
              canvasId={canvasId}
              initialState={parseWorkspaceState(workspaceQuery.data.state)}
              canvasColorPreset={workspaceSettings.settings.canvas_color}
              snapEnabled={workspaceSettings.settings.snap_enabled}
              minimapOpen={workspaceSettings.settings.minimap_open}
              gridDotStrength={workspaceSettings.settings.grid_dot_strength}
              textFontScale={workspaceSettings.settings.text_font_scale}
              connectionStyle={workspaceSettings.settings.connection_style}
              noteColorStyle={workspaceSettings.settings.note_color_style}
              noteItalicColor={workspaceSettings.settings.note_italic_color}
              onToggleSnap={() =>
                workspaceSettings.setSnapEnabled(!workspaceSettings.settings?.snap_enabled)
              }
              notesGridLayout={workspaceSettings.settings.notes_grid_layout}
              onNotesGridLayoutChange={workspaceSettings.setNotesGridLayout}
              pasteUploadTarget={filesPanel.uploadTarget}
              onAutosaveHandlersChange={(handlers) => {
                canvasFlushRef.current = handlers?.flushSave ?? null;
              }}
              overlay={
                <WorkspaceCanvasConfigPanel
                  open={workspaceSettings.settings.config_open}
                  onOpenChange={workspaceSettings.setConfigOpen}
                  position={workspaceSettings.settings.config_position}
                  onPositionChange={workspaceSettings.setConfigPosition}
                >
                  <WorkspaceCanvasColorToggle
                    value={workspaceSettings.settings.canvas_color}
                    onChange={workspaceSettings.setCanvasColor}
                  />
                  <WorkspaceCanvasTextFontSlider
                    value={workspaceSettings.settings.text_font_scale}
                    onChange={workspaceSettings.setTextFontScale}
                  />
                  <WorkspaceCanvasMinimapToggle
                    value={workspaceSettings.settings.minimap_open}
                    onChange={workspaceSettings.setMinimapOpen}
                  />
                  <WorkspaceGridDotStrengthSlider
                    value={workspaceSettings.settings.grid_dot_strength}
                    onChange={workspaceSettings.setGridDotStrength}
                  />
                  <WorkspaceNoteColorStyleToggle
                    value={workspaceSettings.settings.note_color_style}
                    onChange={workspaceSettings.setNoteColorStyle}
                  />
                  <WorkspaceNoteItalicColorToggle
                    value={workspaceSettings.settings.note_italic_color}
                    onChange={workspaceSettings.setNoteItalicColor}
                  />
                  <WorkspaceCanvasConnectionStyleToggle
                    value={workspaceSettings.settings.connection_style}
                    onChange={workspaceSettings.setConnectionStyle}
                  />
                </WorkspaceCanvasConfigPanel>
              }
            />
          )}
          {!panelOpen && (
            <WorkspaceSidePanelReveal
              panelSide={panelLayout.side}
              onOpen={() => setPanelOpen(true)}
            />
          )}
        </div>

        {panelLayout.side === "right" && sidePanelElement}
      </div>
    </div>
  );
}
