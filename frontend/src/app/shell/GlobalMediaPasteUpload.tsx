// keel_web/src/app/shell/GlobalMediaPasteUpload.tsx

// App-wide paste-to-media confirmation dialog for authenticated shell routes.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { ApiError } from "../../lib/api";
import {
  createMediaFolder,
  mediaQueryKeys,
  updateMediaFilename,
  uploadMedia,
} from "../../modules/media/api";
import {
  MediaPasteUploadDialog,
  type MediaPasteUploadConfirmPayload,
} from "../../modules/media/components/browse";
import { useMediaPasteUpload } from "../../modules/media/hooks/useMediaPasteUpload";
import { MAX_MEDIA_BYTES } from "../../modules/media/lib/media";
import {
  isMediaModulePath,
  mediaFolderIdFromPath,
  shouldUseGlobalMediaPaste,
} from "./globalMediaPasteRoutes";

async function resolveUploadFolderId(
  destination: MediaPasteUploadConfirmPayload["destination"],
): Promise<string | null> {
  if (destination.type === "existing") {
    return destination.folderId;
  }
  const folder = await createMediaFolder(destination.name, destination.parentFolderId);
  return folder.id;
}

export function GlobalMediaPasteUpload() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [pasteError, setPasteError] = useState<string | null>(null);

  const pasteEnabled = useMemo(
    () => shouldUseGlobalMediaPaste(location.pathname),
    [location.pathname],
  );
  const dropEnabled = useMemo(
    () => isMediaModulePath(location.pathname),
    [location.pathname],
  );
  const folderId = useMemo(
    () => mediaFolderIdFromPath(location.pathname),
    [location.pathname],
  );

  const pasteUpload = useMediaPasteUpload({
    pasteEnabled,
    dropEnabled,
  });

  const uploadDialogTitle =
    pasteUpload.pendingSource === "drop" ? "Add dropped file" : "Add pasted file";

  const pasteUploadMutation = useMutation({
    mutationFn: async ({ file, filename, destination }: MediaPasteUploadConfirmPayload & { file: File }) => {
      const trimmedFilename = filename.trim();
      if (!trimmedFilename) {
        throw new Error("Enter a file name.");
      }
      if (file.size > MAX_MEDIA_BYTES) {
        throw new Error("File exceeds maximum upload size.");
      }

      const uploadFile =
        trimmedFilename === file.name
          ? file
          : new File([file], trimmedFilename, {
              type: file.type || "application/octet-stream",
            });

      const targetFolderId = await resolveUploadFolderId(destination);
      const created = await uploadMedia(uploadFile, targetFolderId);

      if (created.original_filename !== trimmedFilename) {
        return updateMediaFilename(created.id, trimmedFilename);
      }

      return created;
    },
    onMutate: () => {
      setPasteError(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
      pasteUpload.dismissPending();
    },
    onError: (error) => {
      setPasteError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to upload file.",
      );
    },
  });

  return (
    <MediaPasteUploadDialog
      file={pasteUpload.pendingFile}
      defaultFolderId={folderId}
      title={uploadDialogTitle}
      disabled={pasteUploadMutation.isPending}
      errorMessage={pasteError}
      onConfirm={(payload) => {
        if (!pasteUpload.pendingFile) {
          return;
        }
        pasteUploadMutation.mutate({
          file: pasteUpload.pendingFile,
          ...payload,
        });
      }}
      onClose={() => {
        if (pasteUploadMutation.isPending) {
          return;
        }
        setPasteError(null);
        pasteUpload.dismissPending();
      }}
    />
  );
}
