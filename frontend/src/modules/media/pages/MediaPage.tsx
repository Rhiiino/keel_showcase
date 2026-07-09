// keel_web/src/modules/media/pages/MediaPage.tsx

// Media library — folders and files in list or carousel view.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import {
  createMediaFolder,
  deleteMediaFolder,
  deleteMedia,
  fetchMediaFolderContents,
  mediaQueryKeys,
  moveMediaFolder,
  moveMediaToFolder,
  updateMediaFilename,
  updateMediaFolderName,
  uploadMedia,
} from "../api";
import {
  MediaBreadcrumbs,
  MediaCarouselView,
  MediaListView,
  MediaViewToggle,
} from "../components/browse";
import { useMediaFileFolderDrag } from "../hooks/useMediaFileFolderDrag";
import { MAX_MEDIA_BYTES } from "../lib/media";
import {
  readMediaViewMode,
  writeMediaViewMode,
  type MediaViewMode,
} from "../lib/mediaView";

export function MediaPage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<MediaViewMode>(() => readMediaViewMode());
  const [actionError, setActionError] = useState<string | null>(null);
  const drag = useMediaFileFolderDrag();

  const contentsQuery = useQuery({
    queryKey: mediaQueryKeys.contents(folderId ?? null),
    queryFn: () => fetchMediaFolderContents(folderId ?? null),
  });

  const invalidateMedia = () => {
    void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
  };

  const handleActionError = (error: unknown) => {
    setActionError(
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Media action failed.",
    );
  };

  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteMediaFolder,
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const moveMutation = useMutation({
    mutationFn: ({
      mediaId,
      targetFolderId,
    }: {
      mediaId: string;
      targetFolderId: string | null;
    }) => moveMediaToFolder(mediaId, targetFolderId),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      drag.clearDropTarget();
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({
      folderId: targetFolderId,
      parentFolderId,
    }: {
      folderId: string;
      parentFolderId: string | null;
    }) => moveMediaFolder(targetFolderId, parentFolderId),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      drag.clearDropTarget();
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createMediaFolder(name, folderId ?? null),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const renameMediaMutation = useMutation({
    mutationFn: ({ mediaId, name }: { mediaId: string; name: string }) =>
      updateMediaFilename(mediaId, name),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      updateMediaFolderName(folderId, name),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        if (file.size > MAX_MEDIA_BYTES) {
          throw new Error(`"${file.name}" exceeds maximum upload size.`);
        }
        await uploadMedia(file, folderId ?? null);
      }
    },
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      invalidateMedia();
    },
    onError: handleActionError,
  });

  const handleViewModeChange = (next: MediaViewMode) => {
    setViewMode(next);
    writeMediaViewMode(next);
  };

  const folders = contentsQuery.data?.folders ?? [];
  const media = contentsQuery.data?.media ?? [];
  const breadcrumbs = contentsQuery.data?.breadcrumbs ?? [];
  const hasContents = folders.length > 0 || media.length > 0;

  const handleDropFileOnFolder = (mediaId: string, targetFolderId: string | null) => {
    const droppedItem = media.find((item) => item.id === mediaId);
    if (droppedItem?.folder_id === targetFolderId) {
      drag.clearDropTarget();
      return;
    }
    moveMutation.mutate({ mediaId, targetFolderId });
  };

  const handleDropFolderOnFolder = (
    droppedFolderId: string,
    targetParentFolderId: string | null,
  ) => {
    if (droppedFolderId === targetParentFolderId) {
      drag.clearDropTarget();
      return;
    }
    const droppedFolder = folders.find((folder) => folder.id === droppedFolderId);
    if (droppedFolder?.parent_folder_id === targetParentFolderId) {
      drag.clearDropTarget();
      return;
    }
    moveFolderMutation.mutate({
      folderId: droppedFolderId,
      parentFolderId: targetParentFolderId,
    });
  };

  const handleOpenFolderDuringDrag = (targetFolderId: string) => {
    navigate(`/media/folders/${targetFolderId}`);
  };

  return (
    <ListPageLayout
      title="Media"
      recordCount={
        contentsQuery.data ? folders.length + media.length : undefined
      }
      subtitle="Files stored in your Garage bucket."
      actions={
        <>
          <MediaViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
          <IconPlusButton
            onClick={() =>
              navigate(
                folderId ? `/media/new?folderId=${encodeURIComponent(folderId)}` : "/media/new",
              )
            }
            ariaLabel="Upload media"
            title="Upload media"
          />
        </>
      }
    >
      <RouteNoticeBanner />
      {contentsQuery.isLoading && (
        <p className="text-sm text-stone-500">Loading media…</p>
      )}
      {contentsQuery.isError && (
        <p className="text-sm text-red-400">Failed to load media.</p>
      )}
      {actionError ? <p className="mb-4 text-sm text-red-400">{actionError}</p> : null}

      {contentsQuery.data && (viewMode === "list" || hasContents) && (
        <>
          {viewMode === "list" ? (
            <MediaListView
                folders={folders}
                items={media}
                breadcrumbs={breadcrumbs}
                currentFolderId={folderId ?? null}
                onDelete={(mediaId) => deleteMutation.mutate(mediaId)}
                onDeleteFolder={(targetFolderId) =>
                  deleteFolderMutation.mutate(targetFolderId)
                }
                onRenameMedia={(mediaId, name) =>
                  renameMediaMutation.mutate({ mediaId, name })
                }
                onRenameFolder={(targetFolderId, name) =>
                  renameFolderMutation.mutate({ folderId: targetFolderId, name })
                }
                onCreateFolder={(name) => createFolderMutation.mutate(name)}
                onUploadFile={(files) => uploadMutation.mutate(files)}
                deleteDisabled={deleteMutation.isPending || moveMutation.isPending}
                folderDeleteDisabled={
                  deleteFolderMutation.isPending ||
                  moveMutation.isPending ||
                  moveFolderMutation.isPending
                }
                renameDisabled={
                  renameMediaMutation.isPending || renameFolderMutation.isPending
                }
                createFolderDisabled={createFolderMutation.isPending}
                uploadDisabled={uploadMutation.isPending}
                draggingMediaId={drag.draggingMediaId}
                draggingFolderId={drag.draggingFolderId}
                dropTargetKey={drag.dropTargetKey}
                onDragStart={drag.handleDragStart}
                onFolderDragStart={drag.handleFolderDragStart}
                onDragEnd={drag.handleDragEnd}
                onDragEnterFolder={drag.handleDragEnterFolder}
                onDragLeaveFolder={drag.handleDragLeaveFolder}
                onDropFileOnFolder={handleDropFileOnFolder}
                onDropFolderOnFolder={handleDropFolderOnFolder}
                onOpenFolderDuringDrag={handleOpenFolderDuringDrag}
            />
          ) : (
            <MediaCarouselView
                folders={folders}
                items={media}
                breadcrumbs={breadcrumbs}
                onDelete={(mediaId) => deleteMutation.mutate(mediaId)}
                deleteDisabled={deleteMutation.isPending || moveMutation.isPending}
                onRenameMedia={(mediaId, name) =>
                  renameMediaMutation.mutate({ mediaId, name })
                }
                onRenameFolder={(targetFolderId, name) =>
                  renameFolderMutation.mutate({ folderId: targetFolderId, name })
                }
                renameDisabled={
                  renameMediaMutation.isPending || renameFolderMutation.isPending
                }
                draggingMediaId={drag.draggingMediaId}
                draggingFolderId={drag.draggingFolderId}
                dropTargetKey={drag.dropTargetKey}
                onDragStart={drag.handleDragStart}
                onFolderDragStart={drag.handleFolderDragStart}
                onDragEnd={drag.handleDragEnd}
                onDragEnterFolder={drag.handleDragEnterFolder}
                onDragLeaveFolder={drag.handleDragLeaveFolder}
                onDropFileOnFolder={handleDropFileOnFolder}
                onDropFolderOnFolder={handleDropFolderOnFolder}
                onOpenFolderDuringDrag={handleOpenFolderDuringDrag}
            />
          )}
        </>
      )}

      {contentsQuery.data &&
        !hasContents &&
        viewMode !== "list" &&
        !contentsQuery.isLoading && (
          <div className="space-y-3">
            {breadcrumbs.length > 0 ? (
              <MediaBreadcrumbs breadcrumbs={breadcrumbs} />
            ) : null}
            <p className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-10 text-center text-sm text-stone-500">
              {folderId ? "This folder is empty." : "No media files yet."}
            </p>
          </div>
        )}
    </ListPageLayout>
  );
}
