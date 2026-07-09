// keel_web/src/modules/media/pages/MediaDetailPage.tsx

// Media detail form for one stored object.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";
import { MediaForm } from "../components/forms";
import {
  buildMediaContentUrl,
  deleteMedia,
  fetchMediaAttachments,
  fetchMediaMetadata,
  mediaQueryKeys,
  replaceMediaContent,
  updateMediaFilename,
} from "../api";
import {
  MAX_MEDIA_BYTES,
  deriveMediaFileMetadata,
  formatByteSize,
  isMediaKind,
  type MediaKind,
} from "../lib/media";

export function MediaDetailPage() {
  const { mediaId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filename, setFilename] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [byteSize, setByteSize] = useState<number | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind | "">("");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [fileSelectionError, setFileSelectionError] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey: mediaQueryKeys.detail(mediaId),
    queryFn: () => fetchMediaMetadata(mediaId),
    enabled: mediaId.length > 0,
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: mediaId.length === 0,
    isLoading: mediaQuery.isLoading,
    error: mediaQuery.error,
    isFetched: mediaQuery.isFetched,
    hasData: Boolean(mediaQuery.data),
    listPath: "/media",
    notice: "That media item could not be found.",
  });

  const attachmentsQuery = useQuery({
    queryKey: mediaQueryKeys.attachments(mediaId),
    queryFn: () => fetchMediaAttachments(mediaId),
    enabled: mediaId.length > 0 && Boolean(mediaQuery.data),
  });

  const applyServerMetadata = useCallback((media: NonNullable<typeof mediaQuery.data>) => {
    setFilename(media.original_filename);
    setMimeType(media.mime_type);
    setByteSize(media.byte_size);
    setMediaKind(isMediaKind(media.media_kind) ? media.media_kind : "");
  }, []);

  useEffect(() => {
    if (!mediaQuery.data) {
      return;
    }

    applyServerMetadata(mediaQuery.data);
    setReplacementFile(null);
    setFileSelectionError(null);
  }, [applyServerMetadata, mediaQuery.data]);

  const previewContentUrl = useMemo(() => {
    if (!mediaQuery.data || mediaQuery.data.status !== "ready" || replacementFile) {
      return null;
    }
    return buildMediaContentUrl(mediaQuery.data.id, mediaQuery.data.updated_at);
  }, [mediaQuery.data, replacementFile]);

  const handleReplacementFileChange = useCallback((file: File | null) => {
    setFileSelectionError(null);

    if (!file) {
      setReplacementFile(null);
      if (mediaQuery.data) {
        applyServerMetadata(mediaQuery.data);
      }
      return;
    }

    if (file.size > MAX_MEDIA_BYTES) {
      setFileSelectionError(`File must be ${formatByteSize(MAX_MEDIA_BYTES)} or smaller.`);
      return;
    }

    const metadata = deriveMediaFileMetadata(file);
    setReplacementFile(file);
    setMimeType(metadata.mimeType);
    setByteSize(metadata.byteSize);
    setMediaKind(metadata.mediaKind);
  }, [applyServerMetadata, mediaQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedFilename = filename.trim();
      if (!trimmedFilename) {
        throw new Error("Enter a file name.");
      }

      if (replacementFile) {
        if (replacementFile.size > MAX_MEDIA_BYTES) {
          throw new Error("File exceeds maximum upload size.");
        }

        const uploadFile =
          trimmedFilename === replacementFile.name
            ? replacementFile
            : new File([replacementFile], trimmedFilename, {
                type: replacementFile.type || "application/octet-stream",
              });

        return replaceMediaContent(mediaId, uploadFile, trimmedFilename);
      }

      if (mediaQuery.data && trimmedFilename !== mediaQuery.data.original_filename) {
        return updateMediaFilename(mediaId, trimmedFilename);
      }

      throw new Error("No changes to save.");
    },
    onSuccess: () => {
      setReplacementFile(null);
      setFileSelectionError(null);
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMedia(mediaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
      navigate("/media");
    },
  });

  const isDirty =
    mediaQuery.data !== undefined &&
    (replacementFile !== null ||
      filename.trim() !== mediaQuery.data.original_filename);

  const canSave = isDirty && filename.trim().length > 0 && !fileSelectionError;

  const discardChanges = () => {
    if (!mediaQuery.data) {
      return;
    }
    applyServerMetadata(mediaQuery.data);
    setReplacementFile(null);
    setFileSelectionError(null);
  };

  const saveError = saveMutation.isError
    ? saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "Failed to save media."
    : null;

  const errorMessage =
    fileSelectionError ??
    (deleteMutation.isError
      ? deleteMutation.error instanceof ApiError
        ? deleteMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : "Failed to delete media."
      : null);

  if (redirecting || mediaQuery.isLoading) {
    return (
      <FormPageLayout backHref="/media" backLabel="Back to media">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!mediaQuery.data) {
    return null;
  }

  const pending = saveMutation.isPending || deleteMutation.isPending;
  const previewReplaceable = mediaQuery.data.status === "ready";
  const backHref = mediaQuery.data.folder_id
    ? `/media/folders/${mediaQuery.data.folder_id}`
    : "/media";

  return (
    <FormPageLayout
        backHref={backHref}
        backLabel="Back to media"
        isDirty={isDirty}
        onDiscard={discardChanges}
        onSave={() => saveMutation.mutate()}
        isSaving={saveMutation.isPending}
        canSave={canSave}
        saveError={saveError}
        errorMessage={errorMessage}
      >
        <MediaForm
          mode="detail"
          title={filename}
          onTitleChange={setFilename}
          titleEditable
          titlePlaceholder={mediaQuery.data.original_filename}
          titleDisabled={pending}
          mediaId={mediaId}
          filename={filename}
          mimeType={mimeType}
          byteSize={byteSize}
          mediaKind={mediaKind}
          mediaStatus={mediaQuery.data.status}
          selectedFile={replacementFile}
          previewContentUrl={previewContentUrl}
          previewReplaceable={previewReplaceable}
          attachments={attachmentsQuery.data ?? []}
          fieldsDisabled={pending}
          onFileChange={handleReplacementFileChange}
          onDelete={() => deleteMutation.mutate()}
          deleteDisabled={pending}
        />
      </FormPageLayout>
  );
}
