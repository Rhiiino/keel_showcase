// keel_web/src/app/navigation/useNavigationBreadcrumbPins.ts

// Hook for pinning and unpinning breadcrumb locations.

import { useCallback, useState } from "react";

import {
  createPinnedBreadcrumb,
  pinnedBreadcrumbKey,
  readStoredBreadcrumbPins,
  writeStoredBreadcrumbPins,
  type PinnedBreadcrumb,
  type PinnedBreadcrumbInput,
} from "./breadcrumbPins";

export function useNavigationBreadcrumbPins() {
  const [pins, setPins] = useState<PinnedBreadcrumb[]>(() => readStoredBreadcrumbPins());

  const isPinned = useCallback(
    (pathname: string, search: string) =>
      pins.some((pin) => pinnedBreadcrumbKey(pathname, search) === pin.id),
    [pins],
  );

  const pin = useCallback(
    (entry: PinnedBreadcrumbInput) => {
      const key = pinnedBreadcrumbKey(entry.pathname, entry.search);
      setPins((previous) => {
        if (previous.some((item) => item.id === key)) {
          return previous;
        }
        const next = [...previous, createPinnedBreadcrumb(entry)];
        writeStoredBreadcrumbPins(next);
        return next;
      });
    },
    [],
  );

  const unpin = useCallback((pathname: string, search: string) => {
    const key = pinnedBreadcrumbKey(pathname, search);
    setPins((previous) => {
      const next = previous.filter((item) => item.id !== key);
      if (next.length === previous.length) {
        return previous;
      }
      writeStoredBreadcrumbPins(next);
      return next;
    });
  }, []);

  return {
    pins,
    isPinned,
    pin,
    unpin,
  };
}
