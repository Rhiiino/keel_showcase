// keel_web/src/modules/projects/hooks/useProjectMediaDragPreviewUrl.ts

// Prefetch authenticated blob URLs for project media drag ghosts.

import { useQuery } from "@tanstack/react-query";

import { buildMediaContentUrl } from "../../media/api";
import {
  fetchProjectMediaBlob,
  projectsQueryKeys,
  type ProjectMedia,
} from "../api";
import { useProjectMediaObjectUrl } from "../lib/project/media";

export function useProjectMediaDragPreviewUrl(
  projectId: number,
  item: ProjectMedia,
  enabled: boolean,
): string | null {
  const shouldFetch =
    enabled &&
    (item.media_kind === "image" || item.media_kind === "video");

  const blobQuery = useQuery({
    queryKey: projectsQueryKeys.mediaBlob(item.mediaId),
    queryFn: () => fetchProjectMediaBlob(projectId, item.mediaId),
    enabled: shouldFetch,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const objectUrl = useProjectMediaObjectUrl(
    item.mediaId,
    blobQuery.data instanceof Blob ? blobQuery.data : undefined,
  );

  if (item.media_kind !== "image" && item.media_kind !== "video") {
    return null;
  }

  return objectUrl ?? buildMediaContentUrl(item.mediaId, item.updated_at);
}
