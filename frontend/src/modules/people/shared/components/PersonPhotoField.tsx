// keel_web/src/modules/people/shared/components/PersonPhotoField.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { buildMediaContentUrl, type MediaObject } from "../../../media/api";
import {
  MediaImagePickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../../media/components/pickers";
import { personInitials } from "../lib/personDisplay";
import { PersonPhotoMenu } from "./PersonPhotoMenu";

type PersonPhotoFieldProps = {
  person: {
    first_name: string | null;
    last_name: string | null;
  };
  photo?: MediaObject | null;
  previewUrl?: string | null;
  disabled?: boolean;
  className?: string;
  photoLabel?: string;
  onPhotoSelected?: (file: File) => void;
  onMediaSelected?: (media: MediaObject) => void;
};

export function PersonPhotoField({
  person,
  photo = null,
  previewUrl = null,
  disabled = false,
  className = "h-32 w-32",
  photoLabel = "photo",
  onPhotoSelected,
  onMediaSelected,
}: PersonPhotoFieldProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const initials = personInitials(person.first_name, person.last_name);
  const choosePhotoLabel = `Choose ${photoLabel}`;

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const displayUrl =
    previewUrl ??
    localPreviewUrl ??
    (photo ? buildMediaContentUrl(photo.id, photo.updated_at) : null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || (!onPhotoSelected && !onMediaSelected)) {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onPhotoSelected) {
      return;
    }
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(URL.createObjectURL(file));
    onPhotoSelected(file);
  };

  const handleMediaSelected = (media: MediaObject) => {
    if (!onMediaSelected) {
      return;
    }
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    onMediaSelected(media);
    setMediaDialogOpen(false);
  };

  const isInteractive = Boolean((onPhotoSelected || onMediaSelected) && !disabled);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        disabled={disabled || (!onPhotoSelected && !onMediaSelected)}
        onClick={handleClick}
        title={isInteractive ? choosePhotoLabel : undefined}
        aria-label={isInteractive ? choosePhotoLabel : undefined}
        className={[
          "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-2 ring-white/[0.08] transition",
          isInteractive
            ? "cursor-pointer hover:ring-sky-300/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/50"
            : "",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            className={[
              "h-full w-full object-cover transition duration-200",
              isInteractive ? "group-hover:brightness-[0.72]" : "",
            ].join(" ")}
          />
        ) : (
          <span
            className={[
              "flex h-full w-full items-center justify-center bg-stone-800 text-2xl font-medium text-stone-300 transition duration-200",
              isInteractive ? "group-hover:bg-sky-950/70 group-hover:text-sky-100" : "",
            ].join(" ")}
          >
            {initials}
          </span>
        )}

        {isInteractive && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-stone-950/35 text-white opacity-0 transition duration-200 group-hover:opacity-100"
            aria-hidden
          >
            {displayUrl ? (
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 drop-shadow-sm"
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
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-9 w-9 drop-shadow-sm"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            )}
          </span>
        )}
      </button>

      {photo && (
        <PersonPhotoMenu
          disabled={disabled}
          onViewMedia={() => navigate(`/media/${photo.id}`)}
          className="absolute bottom-1 left-1/2 -translate-x-1/2"
        />
      )}

      {onPhotoSelected && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      <MediaSourceChoiceDialog
        open={sourceDialogOpen}
        title={choosePhotoLabel}
        anchor={sourceDialogAnchor}
        disabled={disabled}
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
        title={`Select ${photoLabel}`}
        disabled={disabled}
        onSelect={handleMediaSelected}
        onClose={() => setMediaDialogOpen(false)}
      />
    </div>
  );
}
