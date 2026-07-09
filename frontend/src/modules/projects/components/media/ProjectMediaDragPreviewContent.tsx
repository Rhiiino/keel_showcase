// keel_web/src/modules/projects/components/media/ProjectMediaDragPreviewContent.tsx

// Thumbnail content for project media drag ghosts (no lazy-load / intersection observer).

import type { ProjectMediaKind } from "../../api";
import {
  projectMediaKindLabel,
  projectMediaKindPillClass,
} from "../../lib/project/media";

type ProjectMediaDragPreviewContentProps = {
  mediaKind: ProjectMediaKind;
  previewUrl?: string | null;
};

export function ProjectMediaDragPreviewContent({
  mediaKind,
  previewUrl,
}: ProjectMediaDragPreviewContentProps) {
  if (mediaKind === "image" && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
      />
    );
  }

  if (mediaKind === "video" && previewUrl) {
    return (
      <video
        src={previewUrl}
        muted
        playsInline
        preload="metadata"
        draggable={false}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <span
      className={[
        "rounded-full px-1.5 py-0.5 text-[8px] font-medium ring-1",
        projectMediaKindPillClass(mediaKind),
      ].join(" ")}
    >
      {projectMediaKindLabel(mediaKind)}
    </span>
  );
}
