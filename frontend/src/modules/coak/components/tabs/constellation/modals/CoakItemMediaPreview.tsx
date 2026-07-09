// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakItemMediaPreview.tsx

import { useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  buildMediaContentUrl,
  fetchMediaMetadata,
  mediaQueryKeys,
} from "../../../../../media/api";
import { MediaPreview } from "../../../../../media/components/shared/MediaPreview";
import { isImageMimeType } from "../../../../../media/lib/media";
import { CoakItemFileActionsMenuPanel } from "../../../shared/CoakItemFileActionsMenuPanel";
import { COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS } from "../../../../lib/tabs/constellation/coakItemEditorStyles";

type CoakItemMediaPreviewFileActions = {
  disabled?: boolean;
  confirmDeletePending?: boolean;
  onUploadFromDevice: () => void;
  onUploadFromMedia: () => void;
  onRemoveFile: () => void | boolean;
};

type CoakItemMediaPreviewProps = {
  mediaId: string;
  alt: string;
  fileActions?: CoakItemMediaPreviewFileActions;
};

function CoakItemMediaPreviewFrame({
  children,
  fileActions,
  interactive,
}: {
  children: ReactNode;
  fileActions?: CoakItemMediaPreviewFileActions;
  interactive: boolean;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!interactive || !fileActions) {
    return <div className={COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS}>{children}</div>;
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={fileActions.disabled}
        aria-label="File options for attached image"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen((current) => !current);
        }}
        className={[
          COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
          "block w-full cursor-pointer text-left transition",
          "hover:border-stone-600 hover:ring-2 hover:ring-lime-400/15",
          "focus-visible:border-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
      >
        {children}
      </button>
      <CoakItemFileActionsMenuPanel
        open={menuOpen}
        anchorRef={anchorRef}
        disabled={fileActions.disabled}
        hasAttachedFile
        confirmDeletePending={fileActions.confirmDeletePending}
        onUploadFromDevice={fileActions.onUploadFromDevice}
        onUploadFromMedia={fileActions.onUploadFromMedia}
        onRemoveFile={fileActions.onRemoveFile}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}

export function CoakItemMediaPreview({ mediaId, alt, fileActions }: CoakItemMediaPreviewProps) {
  const mediaQuery = useQuery({
    queryKey: mediaQueryKeys.detail(mediaId),
    queryFn: () => fetchMediaMetadata(mediaId),
  });

  const media = mediaQuery.data;
  const previewUrl =
    media?.id != null && media.status === "ready"
      ? buildMediaContentUrl(media.id, media.updated_at)
      : null;
  const showImagePreview = media != null && isImageMimeType(media.mime_type);
  const interactive = fileActions != null && media != null;

  if (mediaQuery.isLoading) {
    return (
      <div
        className={[
          COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
          "flex aspect-[4/3] items-center justify-center text-xs text-stone-500",
        ].join(" ")}
      >
        Loading preview…
      </div>
    );
  }

  if (mediaQuery.isError) {
    return (
      <div
        className={[
          COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
          "flex aspect-[4/3] items-center justify-center px-3 text-center text-xs text-stone-500",
        ].join(" ")}
      >
        Preview unavailable
      </div>
    );
  }

  if (media && media.status !== "ready") {
    return (
      <div
        className={[
          COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
          "flex aspect-[4/3] items-center justify-center text-xs text-stone-500",
        ].join(" ")}
      >
        Processing upload…
      </div>
    );
  }

  if (showImagePreview && previewUrl) {
    return (
      <CoakItemMediaPreviewFrame fileActions={fileActions} interactive={interactive}>
        <img
          src={previewUrl}
          alt={alt}
          className="pointer-events-none max-h-52 w-full bg-stone-950 object-contain"
        />
      </CoakItemMediaPreviewFrame>
    );
  }

  if (media) {
    return (
      <CoakItemMediaPreviewFrame fileActions={fileActions} interactive={interactive}>
        <MediaPreview
          srcUrl={previewUrl}
          mimeType={media.mime_type}
          mediaKind={media.media_kind}
          alt={alt}
          size="form"
        />
      </CoakItemMediaPreviewFrame>
    );
  }

  return (
    <div
      className={[
        COAK_ITEM_EDITOR_MEDIA_FRAME_CLASS,
        "flex aspect-[4/3] items-center justify-center text-xs text-stone-500",
      ].join(" ")}
    >
      Preview unavailable
    </div>
  );
}
