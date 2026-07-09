// keel_web/src/modules/media/components/browse/MediaPasteUploadDialog.tsx

// Confirmation dialog for pasted files on the media browse page.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  deriveMediaFileMetadata,
  formatByteSize,
  mediaKindLabel,
} from "../../lib/media";
import {
  MediaFolderDestinationPicker,
  type MediaPasteUploadDestination,
} from "../pickers/MediaFolderDestinationPicker";
import { MediaPreview } from "../shared/MediaPreview";

export type MediaPasteUploadConfirmPayload = {
  filename: string;
  destination: MediaPasteUploadDestination;
};

type MediaPasteUploadDialogProps = {
  file: File | null;
  defaultFolderId?: string | null;
  title?: string;
  description?: string;
  disabled?: boolean;
  errorMessage?: string | null;
  onConfirm: (payload: MediaPasteUploadConfirmPayload) => void;
  onClose: () => void;
};

export function MediaPasteUploadDialog({
  file,
  defaultFolderId = null,
  title = "Add pasted file",
  description = "Review the file, choose a folder, and edit the name before uploading.",
  disabled = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: MediaPasteUploadDialogProps) {
  const filenameInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [destination, setDestination] = useState<MediaPasteUploadDestination>({
    type: "existing",
    folderId: defaultFolderId,
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const resetToken = file ? `${file.name}:${file.size}:${file.lastModified}` : "";

  const handleDestinationChange = useCallback((next: MediaPasteUploadDestination) => {
    setDestination(next);
  }, []);

  const handleDraftingNewFolderChange = useCallback((isDrafting: boolean) => {
    setIsCreatingFolder(isDrafting);
  }, []);

  useEffect(() => {
    if (!file) {
      setFilename("");
      setPreviewUrl(null);
      setDestination({ type: "existing", folderId: defaultFolderId });
      setIsCreatingFolder(false);
      return;
    }

    setFilename(file.name);
    setDestination({ type: "existing", folderId: defaultFolderId });
    setIsCreatingFolder(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [defaultFolderId, file]);

  useEffect(() => {
    if (!file) {
      return;
    }
    filenameInputRef.current?.focus();
    filenameInputRef.current?.select();
  }, [file]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [disabled, file, onClose]);

  if (!file) {
    return null;
  }

  const metadata = deriveMediaFileMetadata(file);
  const newFolderNameMissing = isCreatingFolder && destination.type !== "create";
  const canConfirm = filename.trim().length > 0 && !disabled && !newFolderNameMissing;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <button
        type="button"
        aria-label="Close upload dialog"
        className="absolute inset-0 cursor-default"
        disabled={disabled}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="media-paste-upload-title"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl"
      >
        <div className="border-b border-stone-800 px-5 py-4">
          <h2 id="media-paste-upload-title" className="text-lg font-semibold text-stone-50">
            {title}
          </h2>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <MediaPreview
            srcUrl={previewUrl}
            mimeType={metadata.mimeType}
            mediaKind={metadata.mediaKind}
            alt={filename || file.name}
            size="form"
          />

          <div>
            <label
              htmlFor="media-paste-filename"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone-500"
            >
              File name
            </label>
            <input
              id="media-paste-filename"
              ref={filenameInputRef}
              value={filename}
              disabled={disabled}
              onChange={(event) => setFilename(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canConfirm) {
                  event.preventDefault();
                  onConfirm({ filename: filename.trim(), destination });
                }
              }}
              className="w-full rounded-lg bg-stone-900/80 px-3 py-2 text-sm text-stone-100 outline-none ring-1 ring-stone-700 focus:ring-sky-500/50 disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-stone-500">
              {mediaKindLabel(metadata.mediaKind)} · {formatByteSize(metadata.byteSize)}
            </p>
          </div>

          <MediaFolderDestinationPicker
            defaultFolderId={defaultFolderId}
            resetToken={resetToken}
            disabled={disabled}
            onDestinationChange={handleDestinationChange}
            onDraftingNewFolderChange={handleDraftingNewFolderChange}
          />

          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-800 px-5 py-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-400 hover:text-stone-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm({ filename: filename.trim(), destination })}
            className="btn-accent-subtle"
          >
            {disabled ? "Uploading…" : "Add file"}
          </button>
        </div>
      </div>
    </div>
  );
}
