// keel_web/src/modules/settings/components/ProfilePictureField.tsx

// Clickable profile picture with upload-from-device or pick-from-media.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "../../auth/components/UserAvatar";
import { authKeys, patchCurrentUser } from "../../auth/api";
import {
  buildMediaContentUrl,
  uploadMedia,
  type MediaObject,
} from "../../media/api";
import {
  MediaImagePickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../media/components/pickers";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type ProfilePictureFieldProps = {
  displayName: string;
  pictureUrl: string | null;
  disabled?: boolean;
};

export function ProfilePictureField({
  displayName,
  pictureUrl,
  disabled = false,
}: ProfilePictureFieldProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const savePictureMutation = useMutation({
    mutationFn: (nextPictureUrl: string) =>
      patchCurrentUser({ picture_url: nextPictureUrl }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.me(), updatedUser);
      setUploadError(null);
    },
    onError: () => {
      setUploadError("Could not update profile picture. Try again.");
    },
  });

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const isBusy = savePictureMutation.isPending;
  const previewUrl = localPreviewUrl ?? pictureUrl;
  const controlsDisabled = disabled || isBusy;

  const applyPictureUrl = async (nextPictureUrl: string) => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    await savePictureMutation.mutateAsync(nextPictureUrl);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (controlsDisabled) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setSourceDialogAnchor({ x: rect.left, y: rect.bottom + 4 });
    setSourceDialogOpen(true);
  };

  const openFilePicker = () => {
    setSourceDialogOpen(false);
    fileInputRef.current?.click();
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

    try {
      const media = await uploadMedia(file);
      await applyPictureUrl(buildMediaContentUrl(media.id, media.updated_at));
    } catch {
      URL.revokeObjectURL(blobUrl);
      setLocalPreviewUrl(null);
      setUploadError("Upload failed. Try again or choose another image.");
    }
  };

  const handleMediaSelected = async (media: MediaObject) => {
    setMediaDialogOpen(false);
    setUploadError(null);
    try {
      await applyPictureUrl(buildMediaContentUrl(media.id, media.updated_at));
    } catch {
      setUploadError("Could not update profile picture. Try again.");
    }
  };

  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={controlsDisabled}
        onClick={handleClick}
        title="Change profile picture"
        aria-label="Change profile picture"
        className={[
          "group relative rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/50",
          controlsDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ].join(" ")}
      >
        <UserAvatar
          displayName={displayName}
          pictureUrl={previewUrl}
          size="md"
        />
        {!controlsDisabled ? (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-stone-950/35 text-white opacity-0 transition duration-200 group-hover:opacity-100"
            aria-hidden
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 drop-shadow-sm"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 13a3 3 0 100-6 3 3 0 000 6z"
              />
            </svg>
          </span>
        ) : null}
        {isBusy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-stone-950/50 text-xs text-stone-200">
            Saving…
          </span>
        ) : null}
      </button>

      {uploadError ? (
        <p className="mt-2 max-w-[8rem] text-center text-[11px] text-rose-400">
          {uploadError}
        </p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />

      <MediaSourceChoiceDialog
        open={sourceDialogOpen}
        title="Change profile picture"
        anchor={sourceDialogAnchor}
        disabled={controlsDisabled}
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
        title="Select profile picture"
        disabled={controlsDisabled}
        onSelect={(media) => void handleMediaSelected(media)}
        onClose={() => setMediaDialogOpen(false)}
      />
    </div>
  );
}
