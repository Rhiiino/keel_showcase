// keel_web/src/modules/projects/components/workspace/panel/WorkspaceFileThumbnail.tsx

// File-row preview for workspace media (images show a live preview).

import { useQuery } from "@tanstack/react-query";

import { MediaKindIcon } from "../../../../media/components/shared/icons";
import { fetchProjectMediaBlob, projectsQueryKeys } from "../../../api";
import { useProjectMediaObjectUrl } from "../../../lib/project/media";
import { WORKSPACE_FILE_PANEL_PREVIEW_CLASS } from "./workspaceFilePanelRowStyles";

type WorkspaceFileThumbnailProps = {
  projectId: number;
  mediaId: string;
  mediaKind: string;
  highlighted?: boolean;
};

function ImageThumbnail({ projectId, mediaId }: { projectId: number; mediaId: string }) {
  const blobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(mediaId),
    queryFn: () => fetchProjectMediaBlob(projectId, mediaId),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const objectUrl = useProjectMediaObjectUrl(
    mediaId,
    blobQuery.data instanceof Blob ? blobQuery.data : undefined,
  );

  if (blobQuery.isLoading || !objectUrl) {
    return (
      <span className="flex h-full w-full animate-pulse items-center justify-center bg-stone-800/80">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          Loading
        </span>
      </span>
    );
  }

  if (blobQuery.isError) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-stone-800/80">
        <MediaKindIcon mediaKind="image" className="h-6 w-6 opacity-60" />
      </span>
    );
  }

  return (
    <img
      src={objectUrl}
      alt=""
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}

export function WorkspaceFileThumbnail({
  projectId,
  mediaId,
  mediaKind,
  highlighted = false,
}: WorkspaceFileThumbnailProps) {
  return (
    <span
      className={[
        WORKSPACE_FILE_PANEL_PREVIEW_CLASS,
        highlighted ? "ring-sky-400/40" : "",
        mediaKind === "image" ? "bg-stone-900" : "bg-stone-900/90",
      ].join(" ")}
    >
      {mediaKind === "image" ? (
        <ImageThumbnail projectId={projectId} mediaId={mediaId} />
      ) : (
        <MediaKindIcon mediaKind={mediaKind} className="h-6 w-6" />
      )}
    </span>
  );
}
