// keel_web/src/app/navigation/usePrefetchPinnedNavigationLabels.ts

// Prefetches record data for pinned breadcrumb paths on mount and when pins change.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { PinnedBreadcrumb } from "./breadcrumbPins";
import { prefetchPinnedNavigationLabels } from "./prefetchPinnedNavigationLabels";

export function usePrefetchPinnedNavigationLabels(
  pins: readonly PinnedBreadcrumb[],
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pins.length === 0) {
      return;
    }

    prefetchPinnedNavigationLabels(queryClient, pins);
  }, [pins, queryClient]);
}
