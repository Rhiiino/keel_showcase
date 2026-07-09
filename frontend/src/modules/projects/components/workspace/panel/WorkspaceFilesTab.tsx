// keel_web/src/modules/projects/components/workspace/panel/WorkspaceFilesTab.tsx

// Files tab: project folders and media with drag-and-drop upload and folder moves.

import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import {
  MediaObjectPickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../../../media/components/pickers";
import type { MediaObject } from "../../../../media/api";
import {
  fetchProjectMedia,
  formatByteSize,
  projectsQueryKeys,
  type ProjectFolder,
} from "../../../api";
import { useProjectFileFolderDrag } from "../../../hooks/useProjectFileFolderDrag";
import type { PendingMediaUpload } from "../../../lib/project/media";
import {
  hasProjectDragData,
  isOsFileDrag,
  projectFolderDropTargetKey,
  projectFolderTargetFromDropKey,
  type ProjectFolderTarget,
} from "../../../lib/project/media/projectFileFolderDrag";
import {
  attachmentMatchesFolder,
  folderMatchesParent,
  type FolderNavCrumb,
} from "../../../lib/project/media/projectFileFolderScope";
import {
  projectFolderDropTargetAttr,
  registerWorkspacePanelFolderDropHandler,
} from "../../../lib/project/media/projectFileFolderDragSession";
import { hasWorkspaceMediaDrag } from "../../../lib/workspace/canvas";
import { ProjectFolderBreadcrumb } from "../../media/ProjectFolderBreadcrumb";
import { useProjectFilesDropHandlers } from "../../media/useProjectFilesDropHandlers";
import { useWorkspaceViewContext } from "../context/WorkspaceViewContext";
import { WorkspaceFileFocusedPreview } from "./WorkspaceFileFocusedPreview";
import { WorkspaceFileListRow } from "./WorkspaceFileListRow";
import { WorkspaceFolderListRow } from "./WorkspaceFolderListRow";
import {
  WORKSPACE_FILE_LIST_HEADER_CLASS,
  WORKSPACE_FILE_LIST_ROW_LAYOUT_CLASS,
} from "./workspaceFileListStyles";

type WorkspaceFilesTabProps = {
  projectId: number;
  pendingUploads: PendingMediaUpload[];
  uploadPending: boolean;
  uploadError: string | null;
  onQueueFiles: (files: FileList | File[], target?: ProjectFolderTarget) => void;
  onRemovePending: (clientId: string) => void;
  onDeleteFile: (mediaId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFile: (mediaId: string, name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  deletePending: boolean;
  deletingMediaId: string | null;
  deletingFolderId: string | null;
  deleteError: string | null;
  folderNavStack: FolderNavCrumb[];
  onNavigateFolder: (folderId: string | null) => void;
  onOpenFolder: (folderId: string, name: string) => void;
  allFolders: ProjectFolder[];
  currentFolderId: string | null;
  uploadTarget: ProjectFolderTarget;
  sourceDialogOpen: boolean;
  sourceDialogAnchor: MediaSourceChoiceAnchor | null;
  mediaPickerOpen: boolean;
  onOpenSourceMenu: (anchor: MediaSourceChoiceAnchor) => void;
  onCloseSourceMenu: () => void;
  onOpenMediaPicker: () => void;
  onCloseMediaPicker: () => void;
  onAttachFromLibrary: (media: MediaObject[]) => void;
  onCreateFolder: () => void;
  autoRenameFolderId: string | null;
  onClearAutoRenameFolder: () => void;
  onMoveAttachment: (attachmentId: number, target: ProjectFolderTarget) => void;
  onMoveFolder: (folderId: string, target: ProjectFolderTarget) => void;
  controlsDisabled: boolean;
};

export function WorkspaceFilesTab({
  projectId,
  pendingUploads,
  uploadPending,
  uploadError,
  onQueueFiles,
  onRemovePending,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
  deletePending,
  deletingMediaId,
  deletingFolderId,
  deleteError,
  folderNavStack,
  onNavigateFolder,
  onOpenFolder,
  allFolders,
  currentFolderId,
  uploadTarget,
  sourceDialogOpen,
  sourceDialogAnchor,
  mediaPickerOpen,
  onOpenSourceMenu,
  onCloseSourceMenu,
  onOpenMediaPicker,
  onCloseMediaPicker,
  onAttachFromLibrary,
  onCreateFolder,
  autoRenameFolderId,
  onClearAutoRenameFolder,
  onMoveAttachment,
  onMoveFolder,
  controlsDisabled,
}: WorkspaceFilesTabProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [osFileDragActive, setOsFileDragActive] = useState(false);
  const [currentFolderDropTarget, setCurrentFolderDropTarget] = useState(false);
  const osDragDepthRef = useRef(0);
  const drag = useProjectFileFolderDrag();

  const {
    selectedCanvasMediaIds,
    canvasMediaCopyCounts,
    filesPanelFocusedMediaId,
    setFilesPanelFocusedMediaId,
    setFilesPanelFocusedNoteId,
  } = useWorkspaceViewContext();

  const highlightedMediaIds = useMemo(() => {
    const ids = new Set(selectedCanvasMediaIds);
    if (filesPanelFocusedMediaId !== null) {
      ids.add(filesPanelFocusedMediaId);
    }
    return ids;
  }, [selectedCanvasMediaIds, filesPanelFocusedMediaId]);

  const mediaQuery = useQuery({
    queryKey: projectsQueryKeys.media(projectId),
    queryFn: () => fetchProjectMedia(projectId),
    enabled: projectId > 0,
  });

  const dropHandlers = useProjectFilesDropHandlers({
    allFolders,
    folderParentMoveDrafts: {},
    onMoveAttachment,
    onMoveFolder,
    onMovePendingUpload: () => undefined,
    onMovePendingSelection: () => undefined,
    onMovePendingFolder: () => undefined,
    onDropComplete: drag.clearDropTarget,
  });

  useEffect(() => {
    registerWorkspacePanelFolderDropHandler((attachmentId, dropKey) => {
      onMoveAttachment(attachmentId, projectFolderTargetFromDropKey(dropKey));
      drag.clearDropTarget();
    });
    return () => registerWorkspacePanelFolderDropHandler(null);
  }, [drag.clearDropTarget, onMoveAttachment]);

  const currentFolderDropKey = projectFolderDropTargetKey(currentFolderId, null);

  const visibleFolders = useMemo(
    () =>
      allFolders.filter((folder) =>
        folderMatchesParent(folder, currentFolderId, []),
      ),
    [allFolders, currentFolderId],
  );

  const visibleMedia = useMemo(
    () =>
      (mediaQuery.data ?? []).filter((item) =>
        attachmentMatchesFolder(item.project_folder_id, currentFolderId),
      ),
    [currentFolderId, mediaQuery.data],
  );

  const visiblePendingUploads = useMemo(
    () =>
      pendingUploads.filter((item) =>
        attachmentMatchesFolder(item.projectFolderId, currentFolderId),
      ),
    [currentFolderId, pendingUploads],
  );

  const handlePanelDragEnter = useCallback((event: ReactDragEvent) => {
    if (hasWorkspaceMediaDrag(event.dataTransfer) || hasProjectDragData(event)) {
      return;
    }
    if (!isOsFileDrag(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    osDragDepthRef.current += 1;
    setOsFileDragActive(true);
  }, []);

  const handlePanelDragLeave = useCallback((event: ReactDragEvent) => {
    if (!isOsFileDrag(event)) {
      return;
    }
    event.preventDefault();
    const panel = panelRef.current;
    if (
      panel &&
      event.relatedTarget instanceof Node &&
      panel.contains(event.relatedTarget)
    ) {
      return;
    }
    osDragDepthRef.current = Math.max(0, osDragDepthRef.current - 1);
    if (osDragDepthRef.current === 0) {
      setOsFileDragActive(false);
    }
  }, []);

  const handlePanelDragOver = useCallback((event: ReactDragEvent) => {
    if (hasWorkspaceMediaDrag(event.dataTransfer) || hasProjectDragData(event)) {
      return;
    }
    if (!isOsFileDrag(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handlePanelDrop = useCallback(
    (event: ReactDragEvent) => {
      if (hasWorkspaceMediaDrag(event.dataTransfer) || hasProjectDragData(event)) {
        return;
      }

      const { files } = event.dataTransfer;
      if (!files || files.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      osDragDepthRef.current = 0;
      setOsFileDragActive(false);
      void onQueueFiles(files, uploadTarget);
    },
    [onQueueFiles, uploadTarget],
  );

  const handleDropOnFolderCard = (
    event: ReactDragEvent<HTMLElement>,
    dropKey: string,
  ) => {
    dropHandlers.handleDropOnDropKey(event, dropKey, []);
  };

  const handleDropIntoCurrentFolder = (event: ReactDragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentFolderDropTarget(false);
    dropHandlers.handleDropOnDropKey(event, currentFolderDropKey, []);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handlePanelContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (controlsDisabled) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("li, button, a, input, [role='menuitem']")) {
        return;
      }

      event.preventDefault();
      onOpenSourceMenu({
        x: event.clientX,
        y: event.clientY,
      });
    },
    [controlsDisabled, onOpenSourceMenu],
  );

  const focusedMediaItem =
    filesPanelFocusedMediaId !== null
      ? mediaQuery.data?.find((item) => item.mediaId === filesPanelFocusedMediaId)
      : undefined;

  const isEmpty =
    visibleFolders.length === 0 &&
    visibleMedia.length === 0 &&
    visiblePendingUploads.length === 0 &&
    !mediaQuery.isLoading &&
    !uploadPending;

  const showFileListHeader =
    visibleFolders.length > 0 || visibleMedia.length > 0;

  return (
    <>
      <div
        ref={panelRef}
        onDragEnter={handlePanelDragEnter}
        onDragLeave={handlePanelDragLeave}
        onDragOver={handlePanelDragOver}
        onDrop={handlePanelDrop}
        className="flex min-h-0 flex-1 flex-col"
      >
        {folderNavStack.length > 1 ? (
          <div className="shrink-0 border-b border-stone-800/60 px-3 py-2">
            <ProjectFolderBreadcrumb
              inline
              crumbs={folderNavStack}
              onNavigate={onNavigateFolder}
              disabled={controlsDisabled}
              isDragging={drag.isDragging}
              dropTargetKey={drag.dropTargetKey}
              onDragEnterFolder={drag.handleDragEnterFolder}
              onDragLeaveFolder={drag.handleDragLeaveFolder}
              onDropOnFolder={(event, crumb) =>
                dropHandlers.handleDropOnCrumb(event, crumb, [])
              }
            />
          </div>
        ) : null}

        {drag.isDragging && (
          <div
            className="mx-2 mt-2 px-1 py-1"
            {...{ [projectFolderDropTargetAttr]: currentFolderDropKey }}
            onDragOver={(event) => {
              if (!hasProjectDragData(event)) {
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setCurrentFolderDropTarget(true);
              drag.handleDragEnterFolder(currentFolderDropKey);
            }}
            onDragEnter={(event) => {
              if (!hasProjectDragData(event)) {
                return;
              }
              event.preventDefault();
              setCurrentFolderDropTarget(true);
              drag.handleDragEnterFolder(currentFolderDropKey);
            }}
            onDragLeave={(event) => {
              const relatedTarget = event.relatedTarget;
              if (
                relatedTarget instanceof Node &&
                event.currentTarget.contains(relatedTarget)
              ) {
                return;
              }
              setCurrentFolderDropTarget(false);
              drag.handleDragLeaveFolder(currentFolderDropKey);
            }}
            onDrop={handleDropIntoCurrentFolder}
            aria-label="Drop here to move into this folder"
          >
            <div
              className={[
                "h-1 rounded-full transition duration-200",
                currentFolderDropTarget || drag.dropTargetKey === currentFolderDropKey
                  ? "bg-lime-300/85 shadow-[0_0_14px_rgba(163,230,53,0.22)]"
                  : "bg-lime-300/35 shadow-[0_0_10px_rgba(163,230,53,0.12)]",
              ].join(" ")}
            />
          </div>
        )}

        <div
          onContextMenu={handlePanelContextMenu}
          className={[
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 transition",
            osFileDragActive
              ? "bg-sky-500/10 ring-1 ring-inset ring-sky-400/50"
              : "",
          ].join(" ")}
        >
          {uploadPending && (
            <p className="px-1 pb-2 text-[10px] uppercase tracking-wide text-stone-500">
              Uploading…
            </p>
          )}
          {osFileDragActive && !uploadPending && (
            <p className="px-1 pb-2 text-[10px] uppercase tracking-wide text-sky-300">
              Drop files to upload
            </p>
          )}

          {focusedMediaItem?.media_kind === "image" && (
            <WorkspaceFileFocusedPreview
              projectId={projectId}
              mediaId={focusedMediaItem.mediaId}
              filename={focusedMediaItem.original_filename}
            />
          )}

          {mediaQuery.isLoading && (
            <p className="px-2 py-4 text-center text-xs text-stone-500">Loading…</p>
          )}
          {mediaQuery.isError && (
            <p className="px-2 py-4 text-center text-xs text-red-400">
              Could not load files.
            </p>
          )}
          {isEmpty && (
            <p className="px-2 py-4 text-center text-xs text-stone-500">
              No files yet. Use + to add files or drag them here.
            </p>
          )}

          {showFileListHeader ? (
            <div
              className={`${WORKSPACE_FILE_LIST_ROW_LAYOUT_CLASS} ${WORKSPACE_FILE_LIST_HEADER_CLASS} px-0.5`}
              aria-hidden
            >
              <div className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">File</div>
              <div className="w-8 shrink-0 text-center">Canvas</div>
              <div className="w-7 shrink-0" />
            </div>
          ) : null}

          <ul className="space-y-2 px-0.5">
            {visibleFolders.map((folder) => {
              const dropKey = projectFolderDropTargetKey(folder.id, null);
              const isDeleting = deletePending && deletingFolderId === folder.id;
              return (
                <li key={folder.id}>
                  <WorkspaceFolderListRow
                    folder={folder}
                    disabled={controlsDisabled}
                    isDeleting={isDeleting}
                    isDragging={drag.draggingFolderId === folder.id}
                    isDropTarget={drag.dropTargetKey === dropKey}
                    draggingFolderId={drag.draggingFolderId}
                    dropTargetKey={dropKey}
                    onOpen={() => onOpenFolder(folder.id, folder.name)}
                    onDelete={() => onDeleteFolder(folder.id)}
                    onRename={(name) => onRenameFolder(folder.id, name)}
                    autoRename={autoRenameFolderId === folder.id}
                    onAutoRenameHandled={onClearAutoRenameFolder}
                    renameDisabled={controlsDisabled}
                    onDragStartFolder={drag.handleFolderDragStart}
                    onDragEnd={drag.handleDragEnd}
                    onDragEnterFolder={drag.handleDragEnterFolder}
                    onDragLeaveFolder={drag.handleDragLeaveFolder}
                    onDropOnFolder={(event) => handleDropOnFolderCard(event, dropKey)}
                    onOpenFolderDuringDrag={(folderId) => {
                      const folder = allFolders.find((item) => item.id === folderId);
                      if (folder) {
                        onOpenFolder(folder.id, folder.name);
                      }
                    }}
                  />
                </li>
              );
            })}

            {visibleMedia.map((item) => {
              const isCanvasSelection = highlightedMediaIds.has(item.mediaId);
              const isDeleting = deletePending && deletingMediaId === item.mediaId;

              return (
                <li key={item.id}>
                  <WorkspaceFileListRow
                    projectId={projectId}
                    item={item}
                    highlighted={isCanvasSelection}
                    disabled={controlsDisabled}
                    isDeleting={isDeleting}
                    isDragging={drag.draggingAttachmentId === item.id}
                    onDragStartAttachment={drag.handleAttachmentDragStart}
                    onDragEnd={drag.handleDragEnd}
                    onFocus={() => {
                      setFilesPanelFocusedNoteId(null);
                      setFilesPanelFocusedMediaId(item.mediaId);
                    }}
                    onDelete={() => onDeleteFile(item.mediaId)}
                    onRename={(name) => onRenameFile(item.mediaId, name)}
                    renameDisabled={controlsDisabled}
                    canvasCopyCount={canvasMediaCopyCounts[item.mediaId] ?? 0}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        {(visiblePendingUploads.length > 0 || uploadError || deleteError) && (
          <div className="border-t border-stone-800/80 p-3">
            {visiblePendingUploads.length > 0 && (
              <ul className="space-y-2">
                {visiblePendingUploads.map((item) => (
                  <li
                    key={item.clientId}
                    className="flex items-stretch gap-2.5 rounded-lg border border-stone-800/80 bg-gradient-to-br from-stone-950/95 to-stone-900/55 p-2 shadow-sm ring-1 ring-inset ring-white/[0.025]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-900/85 ring-1 ring-inset ring-white/[0.08]">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                        New
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
                      <span className="block truncate text-[13px] font-semibold text-stone-200">
                        {item.file.name}
                      </span>
                      {item.error ? (
                        <span className="truncate text-[11px] text-red-400">{item.error}</span>
                      ) : (
                        <span className="truncate text-[11px] text-stone-500">
                          {formatByteSize(item.file.size)}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemovePending(item.clientId)}
                      aria-label={`Remove ${item.file.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-lg text-stone-500 transition hover:bg-stone-800 hover:text-stone-200"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {(uploadError || deleteError) && (
              <p className="mt-2 text-[11px] text-red-400">{uploadError ?? deleteError}</p>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        accept="image/*,video/*,.stl,.obj,.gltf,.glb,.fbx,.3mf,.step,.stp,.iges,.igs"
        onChange={(event) => {
          const selected = event.target.files;
          if (selected && selected.length > 0) {
            void onQueueFiles(Array.from(selected), uploadTarget);
          }
          event.target.value = "";
        }}
      />

      <MediaSourceChoiceDialog
        open={sourceDialogOpen}
        title="Add to project files"
        anchor={sourceDialogAnchor}
        disabled={controlsDisabled}
        onSelectFromMedia={() => {
          onCloseSourceMenu();
          onOpenMediaPicker();
        }}
        onUpload={() => {
          onCloseSourceMenu();
          openFilePicker();
        }}
        onCreateFolder={onCreateFolder}
        onClose={onCloseSourceMenu}
      />

      <MediaObjectPickerDialog
        open={mediaPickerOpen}
        title="Select project files"
        selectLabel="Add files"
        disabled={controlsDisabled}
        multiSelect
        onSelect={(mediaObjects) => {
          onAttachFromLibrary(mediaObjects);
          onCloseMediaPicker();
        }}
        onClose={onCloseMediaPicker}
      />
    </>
  );
}
