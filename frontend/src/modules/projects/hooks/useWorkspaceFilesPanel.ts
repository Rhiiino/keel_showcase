// keel_web/src/modules/projects/hooks/useWorkspaceFilesPanel.ts

// Workspace files panel: uploads, library attach, folders, and drag moves.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

import { updateMediaAttachment, type MediaObject } from "../../media/api";
import {
  attachProjectMediaFromLibrary,
  createProjectFolder,
  deleteProjectFolder,
  fetchProjectFolders,
  projectsQueryKeys,
  updateProjectFolder,
  updateProjectMedia,
  uploadProjectMedia,
} from "../api";
import { useWorkspaceViewContext } from "../components/workspace/context/WorkspaceViewContext";
import {
  queuePendingMediaFiles,
  type PendingMediaUpload,
} from "../lib/project/media";
import {
  projectFolderTargetFromDropKey,
  type ProjectFolderTarget,
} from "../lib/project/media/projectFileFolderDrag";
import {
  ROOT_FOLDER_CRUMB,
  type FolderNavCrumb,
} from "../lib/project/media/projectFileFolderScope";
import type { MediaSourceChoiceAnchor } from "../../media/components/pickers";

type UseWorkspaceFilesPanelOptions = {
  projectId: number;
};

export function useWorkspaceFilesPanel({
  projectId,
}: UseWorkspaceFilesPanelOptions) {
  const queryClient = useQueryClient();
  const { deleteWorkspaceMedia } = useWorkspaceViewContext();
  const [pendingUploads, setPendingUploads] = useState<PendingMediaUpload[]>([]);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [folderNavStack, setFolderNavStack] = useState<FolderNavCrumb[]>([
    ROOT_FOLDER_CRUMB,
  ]);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [autoRenameFolderId, setAutoRenameFolderId] = useState<string | null>(null);
  const uploadInFlightRef = useRef(false);

  const currentFolderId = folderNavStack.at(-1)?.id ?? null;

  const foldersQuery = useQuery({
    queryKey: projectsQueryKeys.folders(projectId),
    queryFn: () => fetchProjectFolders(projectId, { all: true }),
    enabled: projectId > 0,
  });

  const uploadTarget = useMemo(
    (): ProjectFolderTarget => ({
      projectFolderId: currentFolderId,
      pendingFolderClientId: null,
    }),
    [currentFolderId],
  );

  const invalidateProjectFiles = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.media(projectId),
    });
    void queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.folders(projectId),
    });
  }, [projectId, queryClient]);

  const removePending = useCallback((clientId: string) => {
    setPendingUploads((current) =>
      current.filter((item) => item.clientId !== clientId),
    );
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[], target: ProjectFolderTarget = uploadTarget) => {
      if (uploadInFlightRef.current) {
        return;
      }

      const queued = queuePendingMediaFiles([], files, {
        projectFolderId: target.projectFolderId,
        pendingFolderClientId: target.pendingFolderClientId,
      });
      const rejected = queued.filter((item) => item.error);
      const accepted = queued.filter((item) => !item.error);

      if (rejected.length > 0) {
        setPendingUploads(rejected);
      } else {
        setPendingUploads([]);
      }

      if (accepted.length === 0) {
        return;
      }

      uploadInFlightRef.current = true;
      setUploadPending(true);
      setUploadError(null);

      const failures: PendingMediaUpload[] = [];

      for (const item of accepted) {
        try {
          await uploadProjectMedia(
            projectId,
            item.file,
            item.projectFolderId ?? null,
          );
        } catch {
          failures.push({
            ...item,
            error: "Upload failed. Try again.",
          });
        }
      }

      uploadInFlightRef.current = false;
      setUploadPending(false);

      if (failures.length > 0) {
        setPendingUploads((current) => [...current, ...failures]);
        setUploadError(
          failures.length === accepted.length
            ? "Upload failed. Try again."
            : "Some files could not be uploaded.",
        );
      }

      if (failures.length < accepted.length) {
        invalidateProjectFiles();
      }
    },
    [invalidateProjectFiles, projectId, uploadTarget],
  );

  const attachFromLibrary = useCallback(
    async (mediaObjects: MediaObject[]) => {
      if (mediaObjects.length === 0) {
        return;
      }

      setUploadError(null);
      setUploadPending(true);

      let failureCount = 0;
      for (const media of mediaObjects) {
        try {
          await attachProjectMediaFromLibrary(
            projectId,
            media.id,
            uploadTarget.projectFolderId,
          );
        } catch {
          failureCount += 1;
        }
      }

      setUploadPending(false);

      if (failureCount > 0) {
        setUploadError(
          failureCount === mediaObjects.length
            ? "Could not add files. Try again."
            : "Some files could not be added.",
        );
      }

      if (failureCount < mediaObjects.length) {
        invalidateProjectFiles();
      }
    },
    [invalidateProjectFiles, projectId, uploadTarget.projectFolderId],
  );

  const createFolderMutation = useMutation({
    mutationFn: () =>
      createProjectFolder(projectId, {
        name: "New folder",
        parent_folder_id: currentFolderId,
      }),
    onSuccess: (folder) => {
      invalidateProjectFiles();
      setSourceDialogOpen(false);
      setSourceDialogAnchor(null);
      setAutoRenameFolderId(folder.id);
    },
    onError: () => {
      setUploadError("Could not create folder. Try again.");
    },
  });

  const moveAttachmentMutation = useMutation({
    mutationFn: ({
      attachmentId,
      target,
    }: {
      attachmentId: number;
      target: ProjectFolderTarget;
    }) =>
      updateMediaAttachment(attachmentId, {
        project_folder_id: target.projectFolderId,
      }),
    onSuccess: () => {
      invalidateProjectFiles();
    },
    onError: () => {
      setUploadError("Could not move file to folder. Try again.");
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({
      folderId,
      target,
    }: {
      folderId: string;
      target: ProjectFolderTarget;
    }) =>
      updateProjectFolder(projectId, folderId, {
        parent_folder_id: target.projectFolderId,
      }),
    onSuccess: () => {
      invalidateProjectFiles();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => deleteWorkspaceMedia(mediaId),
    onMutate: () => setDeleteError(null),
    onSuccess: (_result, mediaId) => {
      invalidateProjectFiles();
      void queryClient.invalidateQueries({
        queryKey: [...projectsQueryKeys.all, "media-blob"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...projectsQueryKeys.all, "media-stl", projectId],
      });
      void queryClient.removeQueries({
        queryKey: projectsQueryKeys.mediaBlob(mediaId),
      });
      void queryClient.removeQueries({
        queryKey: projectsQueryKeys.mediaStlGeometry(projectId, mediaId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...projectsQueryKeys.all, "workspace", projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(projectId),
      });
    },
    onError: () => setDeleteError("Could not delete file. Try again."),
  });

  const deleteFile = useCallback(
    (mediaId: string) => {
      deleteMutation.mutate(mediaId);
    },
    [deleteMutation],
  );

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => deleteProjectFolder(projectId, folderId),
    onMutate: () => setDeleteError(null),
    onSuccess: (_result, folderId) => {
      setFolderNavStack((current) => {
        const deletedIndex = current.findIndex((crumb) => crumb.id === folderId);
        if (deletedIndex === -1) {
          return current;
        }
        return current.slice(0, deletedIndex);
      });
      invalidateProjectFiles();
    },
    onError: () => setDeleteError("Could not delete folder. Try again."),
  });

  const deleteFolder = useCallback(
    (folderId: string) => {
      deleteFolderMutation.mutate(folderId);
    },
    [deleteFolderMutation],
  );

  const renameFileMutation = useMutation({
    mutationFn: ({ mediaId, name }: { mediaId: string; name: string }) =>
      updateProjectMedia(projectId, mediaId, { original_filename: name }),
    onMutate: () => setUploadError(null),
    onSuccess: () => {
      invalidateProjectFiles();
    },
    onError: () => setUploadError("Could not rename file. Try again."),
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      updateProjectFolder(projectId, folderId, { name }),
    onMutate: () => setUploadError(null),
    onSuccess: (_result, variables) => {
      setFolderNavStack((current) =>
        current.map((crumb) =>
          crumb.id === variables.folderId ? { ...crumb, name: variables.name } : crumb,
        ),
      );
      invalidateProjectFiles();
    },
    onError: () => setUploadError("Could not rename folder. Try again."),
  });

  const renameFile = useCallback(
    (mediaId: string, name: string) => {
      renameFileMutation.mutate({ mediaId, name });
    },
    [renameFileMutation],
  );

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      renameFolderMutation.mutate({ folderId, name });
    },
    [renameFolderMutation],
  );

  const navigateToFolder = useCallback((folderId: string | null) => {
    setFolderNavStack((current) => {
      const index = current.findIndex((crumb) => crumb.id === folderId);
      if (index === -1) {
        return [ROOT_FOLDER_CRUMB];
      }
      return current.slice(0, index + 1);
    });
  }, []);

  const openFolder = useCallback((folderId: string, name: string) => {
    setFolderNavStack((current) => [...current, { id: folderId, name }]);
  }, []);

  const openSourceMenu = useCallback((anchor: MediaSourceChoiceAnchor) => {
    setSourceDialogAnchor(anchor);
    setSourceDialogOpen(true);
  }, []);

  const closeSourceMenu = useCallback(() => {
    setSourceDialogOpen(false);
    setSourceDialogAnchor(null);
  }, []);

  const clearAutoRenameFolder = useCallback(() => {
    setAutoRenameFolderId(null);
  }, []);

  const moveAttachment = useCallback(
    (attachmentId: number, target: ProjectFolderTarget) => {
      moveAttachmentMutation.mutate({ attachmentId, target });
    },
    [moveAttachmentMutation],
  );

  const moveFolder = useCallback(
    (folderId: string, target: ProjectFolderTarget) => {
      moveFolderMutation.mutate({ folderId, target });
    },
    [moveFolderMutation],
  );

  const moveToDropKey = useCallback(
    (attachmentId: number | null, folderId: string | null, dropKey: string) => {
      const target = projectFolderTargetFromDropKey(dropKey);
      if (attachmentId !== null) {
        moveAttachment(attachmentId, target);
        return;
      }
      if (folderId !== null) {
        moveFolder(folderId, target);
      }
    },
    [moveAttachment, moveFolder],
  );

  const controlsDisabled =
    uploadPending ||
    createFolderMutation.isPending ||
    moveAttachmentMutation.isPending ||
    moveFolderMutation.isPending ||
    deleteFolderMutation.isPending ||
    renameFileMutation.isPending ||
    renameFolderMutation.isPending;

  return {
    pendingUploads,
    uploadPending,
    uploadError,
    deleteError,
    deletingMediaId: deleteMutation.isPending
      ? (deleteMutation.variables ?? null)
      : null,
    deletingFolderId: deleteFolderMutation.isPending
      ? (deleteFolderMutation.variables ?? null)
      : null,
    queueFiles: uploadFiles,
    removePending,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    deletePending: deleteMutation.isPending || deleteFolderMutation.isPending,
    folderNavStack,
    navigateToFolder,
    openFolder,
    allFolders: foldersQuery.data ?? [],
    foldersLoading: foldersQuery.isLoading,
    currentFolderId,
    uploadTarget,
    sourceDialogOpen,
    sourceDialogAnchor,
    mediaPickerOpen,
    setMediaPickerOpen,
    openSourceMenu,
    closeSourceMenu,
    attachFromLibrary,
    createFolder: () => createFolderMutation.mutate(),
    createFolderPending: createFolderMutation.isPending,
    autoRenameFolderId,
    clearAutoRenameFolder,
    moveAttachment,
    moveFolder,
    moveToDropKey,
    controlsDisabled,
  };
}
