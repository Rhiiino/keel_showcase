// src/app/nav/useAppNavOrder.ts

// Ordered app nav layout (items + separators) with drag-reorder persistence.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../../modules/settings/api";
import type { AppNavItem } from "./appNavConfig";
import { buildDefaultNavLayout } from "./appNavLayoutDefaults";
import {
  layoutSignature,
  mergeNavLayout,
  readStoredNavLayout,
  writeStoredNavLayout,
  type NavLayoutEntry,
} from "./appNavLayout";

export type NavRenderRow =
  | { kind: "item"; key: string; item: AppNavItem; hiddenPreview?: boolean }
  | { kind: "separator"; key: string; id: string };

const SYNC_DEBOUNCE_MS = 400;

type UseAppNavOrderOptions = {
  /** When true, load/save nav layout via GET/PATCH /settings (requires session). */
  sync?: boolean;
};

export function useAppNavOrder(
  registryItems: readonly AppNavItem[],
  options: UseAppNavOrderOptions = {},
) {
  const syncEnabled = options.sync ?? false;

  const registryIds = useMemo(
    () => registryItems.map((item) => item.id),
    [registryItems],
  );

  const anchorLayout = useMemo(
    () => buildDefaultNavLayout(registryIds),
    [registryIds],
  );

  const [layout, setLayout] = useState<NavLayoutEntry[]>(() =>
    readStoredNavLayout(registryIds),
  );

  const syncGenerationRef = useRef(0);
  const pendingPatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUploadedLocalRef = useRef(false);

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
    enabled: syncEnabled,
    staleTime: 30_000,
    refetchOnWindowFocus: syncEnabled,
  });

  useEffect(() => {
    setLayout((current) => mergeNavLayout(current, registryIds));
  }, [anchorLayout, registryIds]);

  useEffect(() => {
    if (!syncEnabled || !settingsQuery.isSuccess) {
      return;
    }

    if (pendingPatchRef.current) {
      return;
    }

    const remoteLayout = settingsQuery.data.data.nav_menu_layout;
    if (remoteLayout && remoteLayout.length > 0) {
      const merged = mergeNavLayout(remoteLayout, registryIds);
      setLayout((current) => {
        if (layoutSignature(merged) === layoutSignature(current)) {
          return current;
        }
        writeStoredNavLayout(merged);
        return merged;
      });
      return;
    }

    if (hasUploadedLocalRef.current) {
      return;
    }

    const localLayout = readStoredNavLayout(registryIds);
    const hasCustomLayout =
      layoutSignature(localLayout) !== layoutSignature(anchorLayout);
    if (!hasCustomLayout) {
      return;
    }

    hasUploadedLocalRef.current = true;
    const generation = syncGenerationRef.current;
    void patchSettings({ nav_menu_layout: localLayout })
      .then(() => {
        if (generation !== syncGenerationRef.current) {
          return;
        }
        writeStoredNavLayout(localLayout);
      })
      .catch(() => {
        hasUploadedLocalRef.current = false;
      });
  }, [
    anchorLayout,
    settingsQuery.data,
    settingsQuery.isSuccess,
    registryIds,
    syncEnabled,
  ]);

  useEffect(() => {
    return () => {
      syncGenerationRef.current += 1;
      if (pendingPatchRef.current) {
        clearTimeout(pendingPatchRef.current);
      }
    };
  }, []);

  const queueRemoteSave = useCallback(
    (nextLayout: NavLayoutEntry[]) => {
      if (!syncEnabled) {
        return;
      }

      if (pendingPatchRef.current) {
        clearTimeout(pendingPatchRef.current);
      }

      pendingPatchRef.current = setTimeout(() => {
        pendingPatchRef.current = null;
        void patchSettings({ nav_menu_layout: nextLayout }).catch(() => {
          // Offline or transient failure — local cache remains source until next sync.
        });
      }, SYNC_DEBOUNCE_MS);
    },
    [syncEnabled],
  );

  const itemsById = useMemo(
    () => new Map(registryItems.map((item) => [item.id, item])),
    [registryItems],
  );

  const rows = useMemo((): NavRenderRow[] => {
    const resolved: NavRenderRow[] = [];
    for (const entry of layout) {
      if (entry.kind === "separator") {
        resolved.push({
          kind: "separator",
          key: `separator:${entry.id}`,
          id: entry.id,
        });
        continue;
      }

      const item = itemsById.get(entry.id);
      if (item) {
        resolved.push({
          kind: "item",
          key: `item:${entry.id}`,
          item,
        });
      }
    }
    return resolved;
  }, [itemsById, layout]);

  const items = useMemo(
    () =>
      rows
        .filter((row): row is Extract<NavRenderRow, { kind: "item" }> => row.kind === "item")
        .map((row) => row.item),
    [rows],
  );

  const reorderLayout = useCallback(
    (nextLayout: NavLayoutEntry[]) => {
      const merged = mergeNavLayout(nextLayout, registryIds);
      setLayout(merged);
      writeStoredNavLayout(merged);
      queueRemoteSave(merged);
    },
    [anchorLayout, queueRemoteSave, registryIds],
  );

  return { rows, items, layout, reorderLayout };
}
