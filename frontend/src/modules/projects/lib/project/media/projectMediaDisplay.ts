// stack_sandbox/frontend_web/src/modules/projects/lib/project/media/projectMediaDisplay.ts

// Labels and styling for project media kinds.

import type { ProjectMedia } from "../../../api";

export function projectMediaKindLabel(kind: ProjectMedia["media_kind"]): string {
  switch (kind) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "model_3d":
      return "3D model";
    default:
      return "File";
  }
}

export function projectMediaKindBadge(kind: string): string {
  switch (kind) {
    case "image":
      return "IMG";
    case "video":
      return "VID";
    case "model_3d":
      return "3D";
    default:
      return "FILE";
  }
}

export function projectMediaKindPillClass(kind: ProjectMedia["media_kind"]): string {
  switch (kind) {
    case "image":
      return "bg-sky-500/20 text-sky-200 ring-sky-400/30";
    case "video":
      return "bg-violet-500/20 text-violet-200 ring-violet-400/30";
    case "model_3d":
      return "bg-lime-500/20 text-lime-200 ring-lime-400/30";
    default:
      return "bg-stone-500/20 text-stone-300 ring-stone-500/30";
  }
}
