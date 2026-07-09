// keel_web/src/modules/media/pages/MediaCreatePage.tsx

// New media upload form.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { FormPageLayout } from "../../../views";
import { MediaForm } from "../components/forms";
import {
  mediaQueryKeys,
  updateMediaFilename,
  uploadMedia,
} from "../api";
import {
  MAX_MEDIA_BYTES,
  deriveMediaFileMetadata,
  type MediaKind,
} from "../lib/media";

export function MediaCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("folderId");
  const backHref = folderId ? `/media/folders/${folderId}` : "/media";

  const [filename, setFilename] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [byteSize, setByteSize] = useState<number | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = useCallback((file: File | null) => {
    setSelectedFile(file);
    if (!file) {
      setFilename("");
      setMimeType("");
      setByteSize(null);
      setMediaKind("");
      return;
    }

    const metadata = deriveMediaFileMetadata(file);
    setFilename(metadata.filename);
    setMimeType(metadata.mimeType);
    setByteSize(metadata.byteSize);
    setMediaKind(metadata.mediaKind);
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Choose a file to upload.");
      }

      const trimmedFilename = filename.trim();
      if (!trimmedFilename) {
        throw new Error("Enter a file name.");
      }

      if (selectedFile.size > MAX_MEDIA_BYTES) {
        throw new Error("File exceeds maximum upload size.");
      }

      const uploadFile =
        trimmedFilename === selectedFile.name
          ? selectedFile
          : new File([selectedFile], trimmedFilename, {
              type: selectedFile.type || "application/octet-stream",
            });

      const created = await uploadMedia(uploadFile, folderId);

      if (created.original_filename !== trimmedFilename) {
        return updateMediaFilename(created.id, trimmedFilename);
      }

      return created;
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
      navigate(`/media/${created.id}`);
    },
  });

  const canUpload = Boolean(selectedFile) && filename.trim().length > 0;

  const errorMessage = uploadMutation.isError
    ? uploadMutation.error instanceof ApiError
      ? uploadMutation.error.message
      : uploadMutation.error instanceof Error
        ? uploadMutation.error.message
        : "Failed to upload media."
    : null;

  return (
    <FormPageLayout
        backHref={backHref}
        backLabel="Back to media"
        headerAction={
          <button
            type="button"
            disabled={!canUpload || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-sky-400 disabled:opacity-50"
          >
            {uploadMutation.isPending ? "Uploading…" : "Upload"}
          </button>
        }
        errorMessage={errorMessage}
      >
        <MediaForm
          mode="create"
          title={selectedFile ? filename : "Upload media"}
          onTitleChange={selectedFile ? setFilename : undefined}
          titleEditable={Boolean(selectedFile)}
          titlePlaceholder="Untitled file"
          titleDisabled={uploadMutation.isPending}
          filename={filename}
          mimeType={mimeType}
          byteSize={byteSize}
          mediaKind={mediaKind}
          selectedFile={selectedFile}
          fieldsDisabled={uploadMutation.isPending}
          onFileChange={handleFileChange}
        />
      </FormPageLayout>
  );
}
