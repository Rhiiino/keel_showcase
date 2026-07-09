// keel_web/src/modules/media/components/shared/MediaPreview.tsx

// Inline preview for images and video; kind icon fallback otherwise.

import { useEffect, useState } from "react";

import {
  isImageMimeType,
  isVideoMimeType,
} from "../../lib/media";
import {
  panelTilePreviewStyle,
  type PanelTilePreview,
} from "../../lib/panelTilePreview";
import { MediaKindIcon } from "./icons";

type MediaPreviewProps = {
  srcUrl?: string | null;
  mimeType: string;
  mediaKind: string;
  alt: string;
  size?: "list" | "form" | "carousel" | "panel" | "fill";
  panelPreview?: PanelTilePreview;
};

const sizeClassName = {
  list: "h-12 w-12 rounded-lg",
  form: "aspect-[16/10] w-full max-w-xl rounded-2xl",
  carousel: "h-full w-full rounded-2xl",
  panel: "h-full w-full rounded-2xl",
  fill: "h-full w-full",
} as const;

export function MediaPreview({
  srcUrl = null,
  mimeType,
  mediaKind,
  alt,
  size = "list",
  panelPreview,
}: MediaPreviewProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [srcUrl]);

  const frameClass = [
    "overflow-hidden",
    size === "fill"
      ? "h-full w-full bg-stone-950/80"
      : "bg-stone-900/70 ring-1 ring-white/[0.08]",
    sizeClassName[size],
  ].join(" ");

  const mediaTransformStyle =
    size === "panel" && panelPreview ? panelTilePreviewStyle(panelPreview) : undefined;

  const mediaClassName = [
    "h-full w-full",
    size === "panel" ? "object-cover" : size === "list" ? "object-cover" : "object-cover",
  ].join(" ");

  if (!srcUrl || loadFailed) {
    return (
      <div className={[frameClass, "flex items-center justify-center"].join(" ")}>
        <MediaKindIcon
          mediaKind={mediaKind}
          className={size === "list" ? "h-5 w-5" : "h-8 w-8"}
        />
      </div>
    );
  }

  if (isImageMimeType(mimeType)) {
    return (
      <div className={frameClass}>
        <img
          src={srcUrl}
          alt={alt}
          className={mediaClassName}
          style={mediaTransformStyle}
          draggable={false}
          onError={() => setLoadFailed(true)}
        />
      </div>
    );
  }

  if (isVideoMimeType(mimeType)) {
    return (
      <div className={frameClass}>
        <video
          src={srcUrl}
          muted
          playsInline
          preload="metadata"
          className={mediaClassName}
          style={mediaTransformStyle}
          onError={() => setLoadFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={[frameClass, "flex items-center justify-center"].join(" ")}>
      <MediaKindIcon
        mediaKind={mediaKind}
        className={size === "list" ? "h-5 w-5" : "h-8 w-8"}
      />
    </div>
  );
}
