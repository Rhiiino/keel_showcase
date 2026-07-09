// stack_sandbox/frontend_web/src/modules/projects/components/media/ProjectFilesSection.tsx

// Files grid for project detail with draft uploads until Save.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MediaObjectPickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../../media/components/pickers";
import {
  fetchProjectMedia,
  projectsQueryKeys,
  type ProjectFolder,
} from "../../api";
import { useProjectFileFolderDrag } from "../../hooks/useProjectFileFolderDrag";
import {
  createPendingProjectFolder,
  effectiveAttachmentFolderTarget,
  effectiveFolderParentTarget,
  folderDisplayName,
  hasProjectDragData,
  isOsFileDrag,
  isFolderPendingDelete,
  projectFolderDropTargetKey,
  type PendingMediaSelection,
  type PendingMediaUpload,
  type PendingProjectFolder,
  type ProjectFolderTarget,
} from "../../lib/project/media";
import {
  isMediaPendingDelete,
  isCoverEligiblePendingFile,
  mediaDisplayFilename,
} from "../../lib/project/media";
import { isCoverEligibleMedia } from "../../lib/project/appearance";
import type { ProjectCoverAppearancePreview } from "./ProjectMediaPreview";
import { ProjectFolderBreadcrumb } from "./ProjectFolderBreadcrumb";
import { ProjectFolderCard } from "./ProjectFolderCard";
import { ProjectMediaAddCard } from "./ProjectMediaAddCard";
import { ProjectMediaCard } from "./ProjectMediaCard";
import { ProjectPendingFolderCard } from "./ProjectPendingFolderCard";
import { ProjectPendingMediaCard } from "./ProjectPendingMediaCard";
import { ProjectPendingMediaSelectionCard } from "./ProjectPendingMediaSelectionCard";
import { useProjectFilesDropHandlers } from "./useProjectFilesDropHandlers";

type FolderNavCrumb = {
  id: string | null;
  name: string;
};

type ProjectFilesSectionProps = {
  projectId: number;
  createMode?: boolean;
  coverMediaId: string | null;
  coverPendingClientId?: string | null;
  filenameDrafts?: Record<string, string>;
  onFilenameDraftChange?: (mediaId: string, nextFilename: string) => void;
  deleteDraftIds?: number[];
  onMarkDelete?: (attachmentId: number) => void;
  onRestoreDelete?: (attachmentId: number) => void;
  onMarkDeleteMany?: (attachmentIds: number[]) => void;
  onMarkCover?: (mediaId: string) => void;
  onMarkPendingCover?: (clientId: string) => void;
  pendingUploads?: PendingMediaUpload[];
  pendingMediaSelections?: PendingMediaSelection[];
  onQueueUploads?: (
    files: FileList | File[],
    target: {
      projectFolderId: string | null;
      pendingFolderClientId: string | null;
    },
  ) => void;
  onQueueMediaSelections?: (
    media: PendingMediaSelection["media"][],
    target: {
      projectFolderId: string | null;
      pendingFolderClientId: string | null;
    },
  ) => void;
  onRemovePendingUpload?: (clientId: string) => void;
  onRemovePendingMediaSelection?: (clientId: string) => void;
  folderNameDrafts?: Record<string, string>;
  onFolderNameDraftChange?: (folderId: string, nextName: string) => void;
  folderDeleteDraftIds?: string[];
  onMarkFolderDelete?: (folderId: string) => void;
  onRestoreFolderDelete?: (folderId: string) => void;
  pendingFolders?: PendingProjectFolder[];
  onQueuePendingFolder?: (folder: PendingProjectFolder) => void;
  onUpdatePendingFolder?: (clientId: string, nextName: string) => void;
  onRemovePendingFolder?: (clientId: string) => void;
  allFolders?: ProjectFolder[];
  folderParentMoveDrafts?: Record<string, ProjectFolderTarget>;
  mediaFolderMoveDrafts?: Record<number, ProjectFolderTarget>;
  onMoveAttachment?: (attachmentId: number, target: ProjectFolderTarget) => void;
  onMoveFolder?: (folderId: string, target: ProjectFolderTarget) => void;
  onMovePendingUpload?: (clientId: string, target: ProjectFolderTarget) => void;
  onMovePendingSelection?: (clientId: string, target: ProjectFolderTarget) => void;
  onMovePendingFolder?: (clientId: string, target: ProjectFolderTarget) => void;
  pageFileDragActive?: boolean;
  savePending?: boolean;
  coverAppearance?: ProjectCoverAppearancePreview;
};

function MultiSelectToggleButton({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={active ? "Exit multi-select mode" : "Select multiple files and folders"}
      aria-pressed={active}
      className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-md transition",
        active
          ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/40"
          : "text-stone-500 hover:bg-stone-900/60 hover:text-stone-300",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    </button>
  );
}

function folderMatchesParent(
  folder: ProjectFolder,
  currentFolderId: string | null,
  currentPendingFolderClientId: string | null,
  deleteDraftIds: string[],
  parentMoveDrafts: Record<string, ProjectFolderTarget>,
): boolean {
  if (deleteDraftIds.includes(folder.id)) {
    return false;
  }
  const parent = effectiveFolderParentTarget(folder, parentMoveDrafts);
  if (currentPendingFolderClientId) {
    return parent.pendingFolderClientId === currentPendingFolderClientId;
  }
  return (
    parent.projectFolderId === currentFolderId && !parent.pendingFolderClientId
  );
}

function pendingFolderMatchesParent(
  folder: PendingProjectFolder,
  currentFolderId: string | null,
  currentPendingFolderClientId: string | null,
): boolean {
  if (currentPendingFolderClientId) {
    return folder.parentPendingClientId === currentPendingFolderClientId;
  }
  return (
    folder.parentFolderId === currentFolderId && folder.parentPendingClientId === null
  );
}

function itemMatchesFolderScope(
  item: {
    projectFolderId?: string | null;
    pendingFolderClientId?: string | null;
  },
  currentFolderId: string | null,
  currentPendingFolderClientId: string | null,
): boolean {
  if (currentPendingFolderClientId) {
    return item.pendingFolderClientId === currentPendingFolderClientId;
  }
  return (
    (item.projectFolderId ?? null) === currentFolderId &&
    !item.pendingFolderClientId
  );
}

export function ProjectFilesSection({
  projectId,
  createMode = false,
  coverMediaId,
  coverPendingClientId = null,
  filenameDrafts = {},
  onFilenameDraftChange,
  deleteDraftIds = [],
  onMarkDelete,
  onRestoreDelete,
  onMarkDeleteMany,
  onMarkCover,
  onMarkPendingCover,
  pendingUploads = [],
  pendingMediaSelections = [],
  onQueueUploads,
  onQueueMediaSelections,
  onRemovePendingUpload,
  onRemovePendingMediaSelection,
  folderNameDrafts = {},
  onFolderNameDraftChange,
  folderDeleteDraftIds = [],
  onMarkFolderDelete,
  onRestoreFolderDelete,
  pendingFolders = [],
  onQueuePendingFolder,
  onUpdatePendingFolder,
  onRemovePendingFolder,
  allFolders = [],
  folderParentMoveDrafts = {},
  mediaFolderMoveDrafts = {},
  onMoveAttachment,
  onMoveFolder,
  onMovePendingUpload,
  onMovePendingSelection,
  onMovePendingFolder,
  pageFileDragActive = false,
  savePending = false,
  coverAppearance,
}: ProjectFilesSectionProps) {
  const [sectionDragOver, setSectionDragOver] = useState(false);
  const [currentFolderDropTarget, setCurrentFolderDropTarget] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<number[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedPendingFolderClientIds, setSelectedPendingFolderClientIds] = useState<
    string[]
  >([]);
  const [folderNavStack, setFolderNavStack] = useState<FolderNavCrumb[]>([
    { id: null, name: "Files" },
  ]);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const drag = useProjectFileFolderDrag();
  const canMoveItems = Boolean(
    onMoveAttachment ||
      onMoveFolder ||
      onMovePendingUpload ||
      onMovePendingSelection ||
      onMovePendingFolder,
  );
  const dropHandlers = useProjectFilesDropHandlers({
    allFolders,
    folderParentMoveDrafts,
    onMoveAttachment: onMoveAttachment ?? (() => undefined),
    onMoveFolder: onMoveFolder ?? (() => undefined),
    onMovePendingUpload: onMovePendingUpload ?? (() => undefined),
    onMovePendingSelection: onMovePendingSelection ?? (() => undefined),
    onMovePendingFolder: onMovePendingFolder ?? (() => undefined),
    onDropComplete: drag.clearDropTarget,
  });

  const currentFolderId = folderNavStack.at(-1)?.id ?? null;
  const currentPendingFolderClientId =
    currentFolderId?.startsWith("pending:") === true
      ? currentFolderId.slice("pending:".length)
      : null;
  const resolvedCurrentFolderId = currentPendingFolderClientId
    ? null
    : currentFolderId;

  const mediaQuery = useQuery({
    queryKey: projectsQueryKeys.media(projectId),
    queryFn: () => fetchProjectMedia(projectId),
    enabled: !createMode && projectId > 0,
  });

  const currentFolderDropKey = projectFolderDropTargetKey(
    resolvedCurrentFolderId,
    currentPendingFolderClientId,
  );

  const dropHighlight =
    !drag.isDragging && (pageFileDragActive || sectionDragOver);

  useEffect(() => {
    if (!drag.isDragging) {
      return;
    }
    dragDepthRef.current = 0;
    setSectionDragOver(false);
  }, [drag.isDragging]);
  const controlsDisabled = savePending;

  const visibleFolders = useMemo(
    () =>
      allFolders.filter((folder) =>
        folderMatchesParent(
          folder,
          resolvedCurrentFolderId,
          currentPendingFolderClientId,
          folderDeleteDraftIds,
          folderParentMoveDrafts,
        ),
      ),
    [
      allFolders,
      currentPendingFolderClientId,
      folderDeleteDraftIds,
      folderParentMoveDrafts,
      resolvedCurrentFolderId,
    ],
  );

  const visiblePendingFolders = useMemo(
    () =>
      pendingFolders.filter((folder) =>
        pendingFolderMatchesParent(
          folder,
          resolvedCurrentFolderId,
          currentPendingFolderClientId,
        ),
      ),
    [currentPendingFolderClientId, pendingFolders, resolvedCurrentFolderId],
  );

  const visibleMedia = useMemo(
    () =>
      (mediaQuery.data ?? []).filter((item) => {
        const target = effectiveAttachmentFolderTarget(item, mediaFolderMoveDrafts);
        return itemMatchesFolderScope(
          {
            projectFolderId: target.projectFolderId,
            pendingFolderClientId: target.pendingFolderClientId,
          },
          resolvedCurrentFolderId,
          currentPendingFolderClientId,
        );
      }),
    [
      currentPendingFolderClientId,
      mediaFolderMoveDrafts,
      mediaQuery.data,
      resolvedCurrentFolderId,
    ],
  );

  const visiblePendingUploads = useMemo(
    () =>
      pendingUploads.filter((item) =>
        itemMatchesFolderScope(
          {
            projectFolderId: item.projectFolderId,
            pendingFolderClientId: item.pendingFolderClientId,
          },
          resolvedCurrentFolderId,
          currentPendingFolderClientId,
        ),
      ),
    [
      currentPendingFolderClientId,
      pendingUploads,
      resolvedCurrentFolderId,
    ],
  );

  const visiblePendingSelections = useMemo(
    () =>
      pendingMediaSelections.filter((item) =>
        itemMatchesFolderScope(item, resolvedCurrentFolderId, currentPendingFolderClientId),
      ),
    [
      currentPendingFolderClientId,
      pendingMediaSelections,
      resolvedCurrentFolderId,
    ],
  );

  const uploadTarget = useMemo(
    () => ({
      projectFolderId: resolvedCurrentFolderId,
      pendingFolderClientId: currentPendingFolderClientId,
    }),
    [currentPendingFolderClientId, resolvedCurrentFolderId],
  );

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        onQueueUploads?.(files, uploadTarget);
      }
    },
    [onQueueUploads, uploadTarget],
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    if (!isOsFileDrag(event) || hasProjectDragData(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setSectionDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (!isOsFileDrag(event) || hasProjectDragData(event)) {
      return;
    }
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setSectionDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!isOsFileDrag(event) || hasProjectDragData(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setSectionDragOver(true);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (!isOsFileDrag(event) || hasProjectDragData(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setSectionDragOver(false);

      if (event.dataTransfer.files.length > 0 && onQueueUploads) {
        onQueueUploads(event.dataTransfer.files, uploadTarget);
      }
    },
    [onQueueUploads, uploadTarget],
  );

  const selectableMediaCount = visibleMedia.filter(
    (item) => !isMediaPendingDelete(item.id, deleteDraftIds),
  ).length;
  const selectableFolderCount =
    visibleFolders.filter((folder) => !isFolderPendingDelete(folder.id, folderDeleteDraftIds))
      .length + visiblePendingFolders.length;
  const selectableItemCount = selectableMediaCount + selectableFolderCount;
  const selectedItemCount =
    selectedAttachmentIds.length +
    selectedFolderIds.length +
    selectedPendingFolderClientIds.length;

  const openFolder = (folderId: string, name: string) => {
    setFolderNavStack((current) => [...current, { id: folderId, name }]);
  };

  const openPendingFolder = (clientId: string, name: string) => {
    openFolder(`pending:${clientId}`, name);
  };

  const openFolderDuringDrag = (folderId: string) => {
    const folder = allFolders.find((item) => item.id === folderId);
    if (folder) {
      openFolder(folder.id, folderDisplayName(folder, folderNameDrafts));
    }
  };

  const openPendingFolderDuringDrag = (clientId: string) => {
    const folder = pendingFolders.find((item) => item.clientId === clientId);
    if (folder) {
      openPendingFolder(clientId, folder.name);
    }
  };

  const handleDropOnFolderCard = (
    event: React.DragEvent<HTMLElement>,
    dropKey: string,
  ) => {
    dropHandlers.handleDropOnDropKey(event, dropKey, pendingFolders);
  };

  const handleDropIntoCurrentFolder = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentFolderDropTarget(false);
    dropHandlers.handleDropOnDropKey(event, currentFolderDropKey, pendingFolders);
  };

  const fileCount =
    visibleMedia.length +
    visiblePendingUploads.filter((item) => !item.error).length +
    visiblePendingSelections.length;
  const showGrid =
    visibleFolders.length > 0 ||
    visiblePendingFolders.length > 0 ||
    visibleMedia.length > 0 ||
    visiblePendingUploads.length > 0 ||
    visiblePendingSelections.length > 0 ||
    Boolean(onQueueUploads);

  const toggleMultiSelectMode = () => {
    setMultiSelectMode((current) => {
      if (current) {
        setSelectedAttachmentIds([]);
        setSelectedFolderIds([]);
        setSelectedPendingFolderClientIds([]);
      }
      return !current;
    });
  };

  const toggleSelectedAttachment = (attachmentId: number) => {
    setSelectedAttachmentIds((current) =>
      current.includes(attachmentId)
        ? current.filter((id) => id !== attachmentId)
        : [...current, attachmentId],
    );
  };

  const toggleSelectedFolder = (folderId: string) => {
    setSelectedFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  };

  const toggleSelectedPendingFolder = (clientId: string) => {
    setSelectedPendingFolderClientIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId],
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItemCount === 0) {
      return;
    }
    if (selectedAttachmentIds.length > 0) {
      onMarkDeleteMany?.(selectedAttachmentIds);
    }
    for (const folderId of selectedFolderIds) {
      onMarkFolderDelete?.(folderId);
    }
    for (const clientId of selectedPendingFolderClientIds) {
      onRemovePendingFolder?.(clientId);
    }
    setSelectedAttachmentIds([]);
    setSelectedFolderIds([]);
    setSelectedPendingFolderClientIds([]);
    setMultiSelectMode(false);
  };

  const navigateToFolder = (folderId: string | null) => {
    setFolderNavStack((current) => {
      const index = current.findIndex((crumb) => crumb.id === folderId);
      if (index === -1) {
        return [{ id: null, name: "Files" }];
      }
      return current.slice(0, index + 1);
    });
  };

  const openSourceMenu = (anchor: MediaSourceChoiceAnchor) => {
    setSourceDialogAnchor(anchor);
    setSourceDialogOpen(true);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCreateFolder = () => {
    const folder = createPendingProjectFolder(
      resolvedCurrentFolderId,
      currentPendingFolderClientId,
    );
    onQueuePendingFolder?.(folder);
    setSourceDialogOpen(false);
    setSourceDialogAnchor(null);
  };

  return (
    <section
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={[
        "relative rounded-xl transition duration-200",
        dropHighlight
          ? "bg-sky-500/5 ring-2 ring-sky-400/40 ring-offset-2 ring-offset-app"
          : "",
      ].join(" ")}
    >
      {dropHighlight && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-sky-500/5">
          <p className="rounded-full bg-stone-950/80 px-4 py-2 text-sm text-sky-200 ring-1 ring-sky-400/40">
            Drop files to upload
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MultiSelectToggleButton
          active={multiSelectMode}
          disabled={controlsDisabled || selectableItemCount === 0}
          onClick={toggleMultiSelectMode}
        />

        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
          Files
          {!mediaQuery.isLoading && (
            <span className="tracking-normal text-stone-600"> ({fileCount})</span>
          )}
        </h2>

        {multiSelectMode && selectedItemCount > 0 && (
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={handleDeleteSelected}
            className="rounded-md px-2 py-1 text-xs text-red-300 ring-1 ring-red-900/40 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete ({selectedItemCount})
          </button>
        )}

        <div className="ml-auto min-w-0">
          <ProjectFolderBreadcrumb
            inline
            crumbs={folderNavStack}
            onNavigate={navigateToFolder}
            disabled={controlsDisabled}
            isDragging={drag.isDragging}
            dropTargetKey={drag.dropTargetKey}
            onDragEnterFolder={drag.handleDragEnterFolder}
            onDragLeaveFolder={drag.handleDragLeaveFolder}
            onDropOnFolder={(event, crumb) =>
              dropHandlers.handleDropOnCrumb(event, crumb, pendingFolders)
            }
          />
        </div>
      </div>

      {drag.isDragging && canMoveItems && (
        <div
          className="mt-2 px-1 py-1"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setCurrentFolderDropTarget(true);
            drag.handleDragEnterFolder(currentFolderDropKey);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setCurrentFolderDropTarget(true);
            drag.handleDragEnterFolder(currentFolderDropKey);
          }}
          onDragLeave={(event) => {
            const relatedTarget = event.relatedTarget;
            if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
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

      {mediaQuery.isLoading && (
        <p className="mt-4 text-sm text-stone-500">Loading files…</p>
      )}

      {mediaQuery.isError && (
        <p className="mt-4 text-sm text-red-400">Failed to load files.</p>
      )}

      {showGrid && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleFolders.map((folder) => {
            const pendingDelete = isFolderPendingDelete(
              folder.id,
              folderDeleteDraftIds,
            );
            const displayName = folderDisplayName(folder, folderNameDrafts);
            const dropKey = projectFolderDropTargetKey(folder.id);
            return (
              <li key={folder.id}>
                <ProjectFolderCard
                  folder={folder}
                  filename={displayName}
                  onFilenameChange={
                    onFolderNameDraftChange
                      ? (nextName) => onFolderNameDraftChange(folder.id, nextName)
                      : undefined
                  }
                  pendingDelete={pendingDelete}
                  onMarkDelete={
                    onMarkFolderDelete ? () => onMarkFolderDelete(folder.id) : undefined
                  }
                  onRestoreDelete={
                    onRestoreFolderDelete
                      ? () => onRestoreFolderDelete(folder.id)
                      : undefined
                  }
                  onOpen={() => openFolder(folder.id, displayName)}
                  disabled={controlsDisabled}
                  multiSelectMode={multiSelectMode}
                  selected={selectedFolderIds.includes(folder.id)}
                  onToggleSelect={() => toggleSelectedFolder(folder.id)}
                  isDragging={drag.draggingFolderId === folder.id}
                  isDropTarget={drag.dropTargetKey === dropKey}
                  draggingFolderId={drag.draggingFolderId}
                  dropTargetKey={dropKey}
                  onDragStartFolder={
                    canMoveItems ? drag.handleFolderDragStart : undefined
                  }
                  onDragEnd={drag.handleDragEnd}
                  onDragEnterFolder={drag.handleDragEnterFolder}
                  onDragLeaveFolder={drag.handleDragLeaveFolder}
                  onDropOnFolder={(event) => handleDropOnFolderCard(event, dropKey)}
                  onOpenFolderDuringDrag={openFolderDuringDrag}
                  fileDragActive={drag.isDragging && canMoveItems}
                />
              </li>
            );
          })}

          {visiblePendingFolders.map((folder) => {
            const dropKey = projectFolderDropTargetKey(null, folder.clientId);
            return (
              <li key={folder.clientId}>
                <ProjectPendingFolderCard
                  folder={folder}
                  onNameChange={(nextName) =>
                    onUpdatePendingFolder?.(folder.clientId, nextName)
                  }
                  onOpen={() => openPendingFolder(folder.clientId, folder.name)}
                  onRemove={() => onRemovePendingFolder?.(folder.clientId)}
                  disabled={controlsDisabled}
                  multiSelectMode={multiSelectMode}
                  selected={selectedPendingFolderClientIds.includes(folder.clientId)}
                  onToggleSelect={() => toggleSelectedPendingFolder(folder.clientId)}
                  isDragging={drag.draggingPendingFolderClientId === folder.clientId}
                  isDropTarget={drag.dropTargetKey === dropKey}
                  draggingPendingFolderClientId={drag.draggingPendingFolderClientId}
                  dropTargetKey={dropKey}
                  onDragStartFolder={
                    canMoveItems ? drag.handlePendingFolderDragStart : undefined
                  }
                  onDragEnd={drag.handleDragEnd}
                  onDragEnterFolder={drag.handleDragEnterFolder}
                  onDragLeaveFolder={drag.handleDragLeaveFolder}
                  onDropOnFolder={(event) => handleDropOnFolderCard(event, dropKey)}
                  onOpenFolderDuringDrag={openPendingFolderDuringDrag}
                  fileDragActive={drag.isDragging && canMoveItems}
                />
              </li>
            );
          })}

          {visibleMedia.map((item) => {
            const pendingDelete = isMediaPendingDelete(item.id, deleteDraftIds);
            return (
              <li key={item.id}>
                <ProjectMediaCard
                  projectId={projectId}
                  item={item}
                  isCover={coverMediaId === item.mediaId}
                  coverAppearance={coverAppearance}
                  draftMode
                  filename={mediaDisplayFilename(item, filenameDrafts)}
                  onFilenameChange={
                    onFilenameDraftChange
                      ? (nextFilename) =>
                          onFilenameDraftChange(item.mediaId, nextFilename)
                      : undefined
                  }
                  pendingDelete={pendingDelete}
                  onMarkDelete={
                    onMarkDelete ? () => onMarkDelete(item.id) : undefined
                  }
                  onRestoreDelete={
                    onRestoreDelete ? () => onRestoreDelete(item.id) : undefined
                  }
                  onMakeCover={
                    onMarkCover ? () => onMarkCover(item.mediaId) : undefined
                  }
                  canMakeCover={isCoverEligibleMedia(item)}
                  multiSelectMode={multiSelectMode}
                  selected={selectedAttachmentIds.includes(item.id)}
                  onToggleSelect={() => toggleSelectedAttachment(item.id)}
                  disabled={controlsDisabled}
                  isDragging={drag.draggingAttachmentId === item.id}
                  onDragStartAttachment={
                    canMoveItems ? drag.handleAttachmentDragStart : undefined
                  }
                  onDragEnd={drag.handleDragEnd}
                />
              </li>
            );
          })}

          {visiblePendingUploads.map((item) => (
            <li key={item.clientId}>
              <ProjectPendingMediaCard
                item={item}
                isCover={coverPendingClientId === item.clientId}
                canMakeCover={isCoverEligiblePendingFile(item.file)}
                onMakeCover={
                  onMarkPendingCover
                    ? () => onMarkPendingCover(item.clientId)
                    : undefined
                }
                disabled={controlsDisabled}
                onRemove={() => onRemovePendingUpload?.(item.clientId)}
                isDragging={drag.draggingPendingUploadClientId === item.clientId}
                onDragStartUpload={
                  canMoveItems ? drag.handlePendingUploadDragStart : undefined
                }
                onDragEnd={drag.handleDragEnd}
              />
            </li>
          ))}

          {visiblePendingSelections.map((item) => (
            <li key={item.clientId}>
              <ProjectPendingMediaSelectionCard
                item={item}
                disabled={controlsDisabled}
                onRemove={() => onRemovePendingMediaSelection?.(item.clientId)}
                isDragging={drag.draggingPendingSelectionClientId === item.clientId}
                onDragStartSelection={
                  canMoveItems ? drag.handlePendingSelectionDragStart : undefined
                }
                onDragEnd={drag.handleDragEnd}
              />
            </li>
          ))}

          {onQueueUploads && (
            <li>
              <ProjectMediaAddCard
                onOpenSourceMenu={openSourceMenu}
                disabled={controlsDisabled}
              />
            </li>
          )}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        accept="image/*,video/*,.stl,.obj,.gltf,.glb,.fbx,.3mf,.step,.stp,.iges,.igs"
        onChange={(event) => {
          const selected = event.target.files;
          if (selected && selected.length > 0) {
            handleFilesSelected(Array.from(selected));
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
          setSourceDialogOpen(false);
          setSourceDialogAnchor(null);
          setMediaPickerOpen(true);
        }}
        onUpload={() => {
          setSourceDialogOpen(false);
          setSourceDialogAnchor(null);
          openFilePicker();
        }}
        onCreateFolder={handleCreateFolder}
        onClose={() => {
          setSourceDialogOpen(false);
          setSourceDialogAnchor(null);
        }}
      />

      <MediaObjectPickerDialog
        open={mediaPickerOpen}
        title="Select project files"
        selectLabel="Add files"
        disabled={controlsDisabled}
        multiSelect
        onSelect={(mediaObjects) => {
          onQueueMediaSelections?.(mediaObjects, uploadTarget);
          setMediaPickerOpen(false);
        }}
        onClose={() => setMediaPickerOpen(false)}
      />
    </section>
  );
}

export type { FolderNavCrumb };
