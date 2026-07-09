// keel_web/src/modules/settings/components/BackgroundSettingsSection.tsx

// General settings — optional shell wallpaper image picker and toggle.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { ToggleSwitch } from "../../../components/ToggleSwitch";
import {
  buildMediaContentUrl,
  fetchMediaMetadata,
  uploadMedia,
  type MediaObject,
} from "../../media/api";
import {
  MediaImagePickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../media/components/pickers";
import {
  useBackgroundSettings,
  useBackgroundSettingsActions,
} from "./context";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function BackgroundSettingsSection() {
  const { enabled, mediaId, mediaUpdatedAt } = useBackgroundSettings();
  const { setShellBackground } = useBackgroundSettingsActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chooseButtonRef = useRef<HTMLButtonElement>(null);

  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey: ["settings", "shell-background", mediaId],
    queryFn: () => fetchMediaMetadata(mediaId!),
    enabled: mediaId != null && localPreviewUrl == null,
    staleTime: 60_000,
  });

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const previewUrl =
    localPreviewUrl ??
    (mediaId ? buildMediaContentUrl(mediaId, mediaUpdatedAt) : null);

  const hasImage = mediaId != null || localPreviewUrl != null;
  const isBusy = isUploading || mediaQuery.isLoading;

  const openSourceDialog = () => {
    const button = chooseButtonRef.current;
    if (!button) {
      return;
    }
    const rect = button.getBoundingClientRect();
    setSourceDialogAnchor({ x: rect.left, y: rect.bottom + 4 });
    setSourceDialogOpen(true);
  };

  const openFilePicker = () => {
    setSourceDialogOpen(false);
    fileInputRef.current?.click();
  };

  const applyMediaSelection = (media: MediaObject) => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setUploadError(null);
    setShellBackground({
      enabled: true,
      media_id: media.id,
      media_updated_at: media.updated_at,
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(blobUrl);
    setUploadError(null);
    setIsUploading(true);

    try {
      const media = await uploadMedia(file);
      URL.revokeObjectURL(blobUrl);
      setLocalPreviewUrl(null);
      applyMediaSelection(media);
    } catch {
      setUploadError("Upload failed. Try again or choose another image.");
      URL.revokeObjectURL(blobUrl);
      setLocalPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaSelected = (media: MediaObject) => {
    applyMediaSelection(media);
    setMediaDialogOpen(false);
  };

  const handleRemoveImage = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setUploadError(null);
    setShellBackground({
      enabled: false,
      media_id: null,
      media_updated_at: null,
    });
  };

  return (
    <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-100">Background</h3>
          <p className="mt-1 text-xs text-stone-500">
            Show a wallpaper behind page content. The nav rail and breadcrumb bar stay
            unchanged.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-stone-400">Show wallpaper</span>
          <ToggleSwitch
            checked={enabled}
            disabled={!hasImage || isBusy}
            ariaLabel="Show wallpaper"
            onChange={(nextEnabled) => setShellBackground({ enabled: nextEnabled })}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-800/80 bg-app-canvas">
        <div className="relative aspect-[16/9] w-full max-w-xl">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-stone-950/60 px-6 text-center text-sm text-stone-500">
              No wallpaper selected
            </div>
          )}
          {isBusy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-950/50 text-sm text-stone-300">
              {isUploading ? "Uploading…" : "Loading…"}
            </div>
          ) : null}
        </div>
      </div>

      {uploadError ? (
        <p className="text-xs text-rose-400">{uploadError}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          ref={chooseButtonRef}
          type="button"
          disabled={isBusy}
          onClick={openSourceDialog}
          className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-600 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Choose image
        </button>
        {hasImage ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleRemoveImage}
            className="text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-stone-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            Remove image
          </button>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <MediaSourceChoiceDialog
        open={sourceDialogOpen}
        title="Choose wallpaper"
        anchor={sourceDialogAnchor}
        disabled={isBusy}
        onSelectFromMedia={() => {
          setSourceDialogOpen(false);
          setMediaDialogOpen(true);
        }}
        onUpload={openFilePicker}
        onClose={() => {
          setSourceDialogOpen(false);
          setSourceDialogAnchor(null);
        }}
      />
      <MediaImagePickerDialog
        open={mediaDialogOpen}
        title="Select wallpaper"
        disabled={isBusy}
        onSelect={handleMediaSelected}
        onClose={() => setMediaDialogOpen(false)}
      />
    </section>
  );
}
