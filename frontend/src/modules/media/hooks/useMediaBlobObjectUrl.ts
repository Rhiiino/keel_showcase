// keel_web/src/modules/media/hooks/useMediaBlobObjectUrl.ts

// Credentialed media blob fetch + object URL for inline video playback.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { fetchMediaBlob, mediaQueryKeys } from "../api";

export function useMediaBlobObjectUrl(
  mediaId: string | undefined,
  mimeType: string,
  localSrcUrl: string | null | undefined,
): {
  srcUrl: string | null;
  isLoading: boolean;
  isError: boolean;
} {
  const blobQuery = useQuery({
    queryKey: [...mediaQueryKeys.detail(mediaId ?? ""), "blob"] as const,
    queryFn: () => fetchMediaBlob(mediaId!),
    enabled: Boolean(mediaId) && !localSrcUrl,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(localSrcUrl ?? null);

  useEffect(() => {
    if (localSrcUrl) {
      setObjectUrl(localSrcUrl);
      return;
    }

    if (!blobQuery.data) {
      setObjectUrl(null);
      return;
    }

    const blob =
      blobQuery.data.type === mimeType
        ? blobQuery.data
        : new Blob([blobQuery.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blobQuery.data, localSrcUrl, mimeType]);

  return {
    srcUrl: objectUrl,
    isLoading: Boolean(mediaId) && !localSrcUrl && blobQuery.isLoading,
    isError: Boolean(mediaId) && !localSrcUrl && blobQuery.isError,
  };
}
