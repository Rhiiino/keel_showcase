// keel_web/src/modules/media/components/forms/MediaForm.tsx

// Shared media form layout for create and detail views.

import { useCallback, useEffect, useRef, useState } from "react";

import type { MediaAttachment } from "../../api";
import {
  deriveMediaFileMetadata,
  isVideoMimeType,
  type MediaKind,
} from "../../lib/media";
import { MediaAttachmentListView } from "../attachments";
import { MediaPreviewCopyButton } from "../shared/actions";
import { MediaPreview } from "../shared/MediaPreview";
import { MediaFormVideoPreview } from "./MediaFormVideoPreview";
import { MediaInlineTitle } from "./MediaInlineTitle";
import { MediaMetadataPanel } from "./MediaMetadataPanel";

export type MediaFormMode = "create" | "detail";

type MediaFormProps = {
  mode: MediaFormMode;
  title: string;
  onTitleChange?: (value: string) => void;
  titleEditable?: boolean;
  titlePlaceholder?: string;
  titleDisabled?: boolean;
  mediaId?: string;
  filename: string;
  mimeType: string;
  byteSize: number | null;
  mediaKind: MediaKind | "";
  mediaStatus?: string;
  selectedFile: File | null;
  previewContentUrl?: string | null;
  attachments?: MediaAttachment[];
  fieldsDisabled?: boolean;
  previewReplaceable?: boolean;
  onFileChange: (file: File | null) => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
};

const chooseFileButtonClassName =
  "rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-stone-100 transition hover:border-sky-400/35 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

function PlusIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CameraIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}

export function MediaForm({
  mode,
  title,
  onTitleChange,
  titleEditable = false,
  titlePlaceholder,
  titleDisabled = false,
  mediaId,
  filename,
  mimeType,
  byteSize,
  mediaKind,
  mediaStatus = "ready",
  selectedFile,
  previewContentUrl = null,
  attachments = [],
  fieldsDisabled = false,
  previewReplaceable = false,
  onFileChange,
  onDelete,
  deleteDisabled = false,
}: MediaFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const isPreviewInteractive =
    !fieldsDisabled && (mode === "create" || previewReplaceable);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(null);
      return;
    }

    const canPreview =
      selectedFile.type.startsWith("image/") || selectedFile.type.startsWith("video/");
    if (!canPreview) {
      setLocalPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";
      onFileChange(file);
    },
    [onFileChange],
  );

  const openFilePicker = useCallback(() => {
    if (!isPreviewInteractive) {
      return;
    }
    fileInputRef.current?.click();
  }, [isPreviewInteractive]);

  const hasStagedFile = selectedFile !== null;
  const previewMimeType =
    hasStagedFile && selectedFile
      ? selectedFile.type || "application/octet-stream"
      : mimeType;
  const previewKind =
    hasStagedFile && selectedFile
      ? deriveMediaFileMetadata(selectedFile).mediaKind
      : mediaKind || "other";
  const effectivePreviewUrl = hasStagedFile
    ? localPreviewUrl
    : mode === "detail"
      ? previewContentUrl
      : localPreviewUrl;
  const hasPreviewContent = Boolean(effectivePreviewUrl);
  const showMetadata =
    mode === "detail" || (mode === "create" && selectedFile !== null);
  const previewPickerLabel =
    mode === "create" ? "Choose file to upload" : "Choose replacement file";

  const copySource =
    selectedFile !== null
      ? { kind: "file" as const, file: selectedFile }
      : mode === "detail" && mediaId && mediaStatus === "ready"
        ? { kind: "media" as const, mediaId, mimeType: previewMimeType }
        : null;
  const copyDisabled = fieldsDisabled || copySource === null;
  const isVideoPreview =
    isVideoMimeType(previewMimeType) && Boolean(effectivePreviewUrl);
  const previewAlt = filename || "Media preview";
  const copyButton = (
    <MediaPreviewCopyButton copySource={copySource} disabled={copyDisabled} />
  );

  const previewElement = isVideoPreview ? (
    <MediaFormVideoPreview
      localSrcUrl={hasStagedFile ? localPreviewUrl : null}
      remoteMediaId={
        !hasStagedFile && mode === "detail" && mediaId ? mediaId : undefined
      }
      mimeType={previewMimeType}
      alt={previewAlt}
      copyButton={copyButton}
      replaceInteractive={
        isPreviewInteractive
          ? {
              onReplace: openFilePicker,
              label: previewPickerLabel,
              hasContent: hasPreviewContent,
            }
          : undefined
      }
    />
  ) : (
    <MediaPreview
      srcUrl={effectivePreviewUrl}
      mimeType={previewMimeType}
      mediaKind={previewKind}
      alt={previewAlt}
      size="form"
    />
  );

  const previewWithCopyButton = isVideoPreview ? (
    previewElement
  ) : (
    <div className="relative max-w-xl">
      {previewElement}
      {copyButton}
    </div>
  );

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] md:items-start">
        {showMetadata ? (
          <MediaMetadataPanel
            mimeType={previewMimeType}
            byteSize={byteSize}
            mediaKind={previewKind}
            mediaId={mode === "detail" ? mediaId : undefined}
            filename={filename}
            downloadDisabled={
              mode !== "detail" || mediaStatus !== "ready" || fieldsDisabled
            }
            onDelete={mode === "detail" ? onDelete : undefined}
            deleteDisabled={deleteDisabled || fieldsDisabled}
            deleteResetKey={filename}
          />
        ) : (
          <div className="hidden md:block" aria-hidden />
        )}

        <div className="space-y-4">
          {isPreviewInteractive && !isVideoPreview ? (
            <div className="relative max-w-xl rounded-2xl">
              <button
                type="button"
                disabled={!isPreviewInteractive}
                onClick={openFilePicker}
                aria-label={previewPickerLabel}
                title={previewPickerLabel}
                className={[
                  "group relative block w-full rounded-2xl text-left transition duration-200",
                  isPreviewInteractive
                    ? "cursor-pointer hover:ring-2 hover:ring-sky-300/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/50"
                    : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "transition duration-200",
                    isPreviewInteractive && hasPreviewContent
                      ? "group-hover:brightness-[0.72]"
                      : "",
                  ].join(" ")}
                >
                  {previewElement}
                </div>

                {isPreviewInteractive && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-stone-950/35 text-white opacity-0 transition duration-200 group-hover:opacity-100">
                    {hasPreviewContent ? (
                      <CameraIcon className="h-8 w-8 drop-shadow-sm" />
                    ) : (
                      <PlusIcon className="h-9 w-9 drop-shadow-sm" />
                    )}
                  </span>
                )}
              </button>
              {copyButton}
            </div>
          ) : (
            previewWithCopyButton
          )}

          <MediaInlineTitle
            value={title}
            onChange={onTitleChange}
            editable={titleEditable}
            placeholder={titlePlaceholder}
            disabled={titleDisabled}
          />

          {isPreviewInteractive ? (
            <>
              <input
                ref={fileInputRef}
                id="media-file"
                type="file"
                disabled={fieldsDisabled}
                onChange={handleFileInputChange}
                className="hidden"
              />
              {mode === "create" ? (
                <>
                  <button
                    type="button"
                    disabled={fieldsDisabled}
                    onClick={openFilePicker}
                    className={chooseFileButtonClassName}
                  >
                    Choose file
                  </button>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {mode === "detail" ? (
        <section className="mt-10 border-t border-white/[0.06] pt-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
            Attachments
          </h2>
          <div className="mt-4">
            <MediaAttachmentListView attachments={attachments} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
