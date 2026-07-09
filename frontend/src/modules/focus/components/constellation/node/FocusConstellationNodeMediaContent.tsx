// src/modules/focus/components/constellation/node/FocusConstellationNodeMediaContent.tsx

// Full-bleed media preview for Media object reference nodes in constellation view.

import { buildMediaContentUrl } from "../../../../media/api";
import { MediaPreview } from "../../../../media/components/shared/MediaPreview";
import { HEXAGON_CLIP_PATH } from "./FocusConstellationNode.constants";
import type { FocusConstellationNodeShape } from "../../../lib/focus";

type FocusConstellationNodeMediaContentProps = {
  mediaId: string;
  mimeType: string | null;
  mediaKind: string | null;
  title: string;
  contentUpdatedAt: string | null;
  shape: FocusConstellationNodeShape;
};

export function FocusConstellationNodeMediaContent({
  mediaId,
  mimeType,
  mediaKind,
  title,
  contentUpdatedAt,
  shape,
}: FocusConstellationNodeMediaContentProps) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        shape === "circle" ? "rounded-full" : "",
      ].join(" ")}
      style={shape === "hexagon" ? { clipPath: HEXAGON_CLIP_PATH } : undefined}
    >
      <MediaPreview
        srcUrl={buildMediaContentUrl(mediaId, contentUpdatedAt)}
        mimeType={mimeType ?? "application/octet-stream"}
        mediaKind={mediaKind ?? "other"}
        alt={title}
        size="fill"
      />
    </div>
  );
}
