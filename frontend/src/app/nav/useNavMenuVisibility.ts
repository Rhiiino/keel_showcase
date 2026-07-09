// keel_web/src/app/nav/useNavMenuVisibility.ts

// Nav item visibility (hide/unhide) with localStorage and optional settings sync.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchSettings,
  patchSettings,
  settingsKeys,
  type NavMenuVisibility,
} from "../../modules/settings/api";
import {
  hasHiddenNavItems,
  readStoredNavMenuVisibility,
  visibilitySignature,
  writeStoredNavMenuVisibility,
} from "./navMenuVisibility";

type UseNavMenuVisibilityOptions = {
  /** When true, load/save visibility via GET/PATCH /settings (requires session). */
  sync?: boolean;
};

function normalizeVisibility(
  value: NavMenuVisibility | null | undefined,
): NavMenuVisibility | null {
  if (!value) {
    return null;
  }
  const normalized: NavMenuVisibility = {};
  for (const [key, visible] of Object.entries(value)) {
    if (visible === false) {
      normalized[key] = false;
    }
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

function applyVisibilityFromServer(
  value: NavMenuVisibility | null | undefined,
): NavMenuVisibility | null {
  const normalized = normalizeVisibility(value);
  writeStoredNavMenuVisibility(normalized);
  return normalized;
}

export function useNavMenuVisibility(
  options: UseNavMenuVisibilityOptions = {},
) {
  const syncEnabled = options.sync ?? false;
  const queryClient = useQueryClient();

  const [visibility, setVisibility] = useState<NavMenuVisibility | null>(() =>
    readStoredNavMenuVisibility(),
  );

  const hasUploadedLocalRef = useRef(false);

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    enabled: syncEnabled,
    staleTime: 30_000,
    refetchOnWindowFocus: syncEnabled,
  });

  const syncPatchToServer = useCallback(
    (patch: NavMenuVisibility) => {
      if (!syncEnabled) {
        return;
      }

      void patchSettings({ nav_menu_visibility: patch })
        .then((updated) => {
          queryClient.setQueryData(settingsKeys.root(), updated);
          setVisibility(applyVisibilityFromServer(updated.data.nav_menu_visibility));
        })
        .catch(() => {
          // Offline or transient failure — local cache remains source until next sync.
        });
    },
    [queryClient, syncEnabled],
  );

  useEffect(() => {
    if (!syncEnabled || !settingsQuery.isSuccess) {
      return;
    }

    const remoteRaw = settingsQuery.data.data.nav_menu_visibility;
    if (remoteRaw !== undefined) {
      const remoteVisibility = normalizeVisibility(remoteRaw);
      setVisibility((current) => {
        if (visibilitySignature(remoteVisibility) === visibilitySignature(current)) {
          return current;
        }
        writeStoredNavMenuVisibility(remoteVisibility);
        return remoteVisibility;
      });
      return;
    }

    if (!hasUploadedLocalRef.current) {
      const localVisibility = readStoredNavMenuVisibility();
      if (localVisibility) {
        hasUploadedLocalRef.current = true;
        void patchSettings({ nav_menu_visibility: localVisibility })
          .then((updated) => {
            queryClient.setQueryData(settingsKeys.root(), updated);
            setVisibility(applyVisibilityFromServer(updated.data.nav_menu_visibility));
          })
          .catch(() => {
            hasUploadedLocalRef.current = false;
          });
        return;
      }
    }

    setVisibility((current) => {
      if (current === null) {
        return current;
      }
      writeStoredNavMenuVisibility(null);
      return null;
    });
  }, [queryClient, settingsQuery.data, settingsQuery.isSuccess, syncEnabled]);

  const hideItem = useCallback(
    (itemId: string) => {
      setVisibility((current) => {
        const optimistic: NavMenuVisibility = { ...(current ?? {}), [itemId]: false };
        writeStoredNavMenuVisibility(optimistic);
        syncPatchToServer({ [itemId]: false });
        return optimistic;
      });
    },
    [syncPatchToServer],
  );

  const unhideItem = useCallback(
    (itemId: string) => {
      setVisibility((current) => {
        if (current?.[itemId] !== false) {
          return current;
        }

        const next = { ...current };
        delete next[itemId];
        const optimistic = Object.keys(next).length > 0 ? next : null;
        writeStoredNavMenuVisibility(optimistic);
        syncPatchToServer({ [itemId]: true });
        return optimistic;
      });
    },
    [syncPatchToServer],
  );

  const hasHiddenItemsValue = useMemo(
    () => hasHiddenNavItems(visibility),
    [visibility],
  );

  return {
    visibility,
    hideItem,
    unhideItem,
    hasHiddenItems: hasHiddenItemsValue,
  };
}
