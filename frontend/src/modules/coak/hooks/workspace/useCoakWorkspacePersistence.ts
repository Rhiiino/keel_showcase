// keel_web/src/modules/coak/hooks/useCoakWorkspacePersistence.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  COAK_WORKSPACE_STATE_VERSION,
  coakQueryKeys,
  fetchCoakWorkspaceState,
  updateCoakWorkspaceState,
  type CoakCameraState,
  type CoakNodePosition,
  type CoakWorkspaceState,
  type CoakWorkspaceStatePayload,
} from "../../api";

const SAVE_DEBOUNCE_MS = 400;

type WorkspaceStateSnapshot = {
  state_version: number;
  node_positions: CoakNodePosition[];
  expanded_folder_ids: number[];
  pinned_item_ids: number[];
  camera: CoakCameraState | null;
};

function toPayload(snapshot: WorkspaceStateSnapshot): CoakWorkspaceStatePayload {
  return {
    state_version: COAK_WORKSPACE_STATE_VERSION,
    node_positions: snapshot.node_positions,
    expanded_folder_ids: snapshot.expanded_folder_ids,
    pinned_item_ids: snapshot.pinned_item_ids,
    camera: snapshot.camera,
  };
}

function stableSerialize(snapshot: WorkspaceStateSnapshot): string {
  return JSON.stringify(toPayload(snapshot));
}

function snapshotFromState(state: CoakWorkspaceState): WorkspaceStateSnapshot {
  return {
    state_version: COAK_WORKSPACE_STATE_VERSION,
    node_positions: state.node_positions,
    expanded_folder_ids: state.expanded_folder_ids,
    pinned_item_ids: state.pinned_item_ids ?? [],
    camera: state.camera,
  };
}

export function useCoakWorkspacePersistence(recordId: number) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: coakQueryKeys.workspaceState(recordId),
    queryFn: () => fetchCoakWorkspaceState(recordId),
    refetchOnMount: "always",
  });

  const [snapshot, setSnapshot] = useState<WorkspaceStateSnapshot>({
    state_version: COAK_WORKSPACE_STATE_VERSION,
    node_positions: [],
    expanded_folder_ids: [],
    pinned_item_ids: [],
    camera: null,
  });
  const [hydrated, setHydrated] = useState(false);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const hydratedRef = useRef(hydrated);
  hydratedRef.current = hydrated;
  const lastSavedRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const flushSave = useCallback(
    (next: WorkspaceStateSnapshot) => {
      const serialized = stableSerialize(next);
      if (serialized === lastSavedRef.current) {
        return;
      }

      void updateCoakWorkspaceState(recordId, toPayload(next))
        .then((saved) => {
          lastSavedRef.current = stableSerialize(snapshotFromState(saved));
          queryClient.setQueryData(coakQueryKeys.workspaceState(recordId), saved);
        })
        .catch(() => {
          // Keep local state; a later edit will retry.
        });
    },
    [queryClient, recordId],
  );

  const scheduleSave = useCallback(
    (next: WorkspaceStateSnapshot) => {
      if (!hydratedRef.current) {
        return;
      }

      clearSaveTimer();
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        flushSave(next);
      }, SAVE_DEBOUNCE_MS);
    },
    [clearSaveTimer, flushSave],
  );

  useEffect(() => {
    if (!query.data || hydrated) {
      return;
    }

    clearSaveTimer();
    const next = snapshotFromState(query.data);
    const localPins = snapshotRef.current.pinned_item_ids;
    if (localPins.length > 0) {
      next.pinned_item_ids = [...new Set([...next.pinned_item_ids, ...localPins])];
    }
    setSnapshot(next);
    snapshotRef.current = next;
    lastSavedRef.current = stableSerialize(next);
    setHydrated(true);
    if (localPins.length > 0) {
      flushSave(next);
    }
  }, [clearSaveTimer, flushSave, hydrated, query.data]);

  useEffect(() => {
    return () => {
      clearSaveTimer();
      if (hydratedRef.current) {
        flushSave(snapshotRef.current);
      }
    };
  }, [clearSaveTimer, flushSave]);

  const commitSnapshot = useCallback(
    (
      updater: (current: WorkspaceStateSnapshot) => WorkspaceStateSnapshot,
      options?: { immediate?: boolean },
    ) => {
      setSnapshot((current) => {
        const next = updater(current);
        snapshotRef.current = next;
        if (options?.immediate) {
          clearSaveTimer();
          flushSave(next);
        } else {
          scheduleSave(next);
        }
        return next;
      });
    },
    [clearSaveTimer, flushSave, scheduleSave],
  );

  const setNodePosition = useCallback(
    (itemId: number, position: [number, number, number]) => {
      commitSnapshot((current) => {
        const existing = current.node_positions.filter((entry) => entry.item_id !== itemId);
        return {
          ...current,
          node_positions: [
            ...existing,
            { item_id: itemId, x: position[0], y: position[1], z: position[2] },
          ],
        };
      });
    },
    [commitSnapshot],
  );

  const setNodePositions = useCallback(
    (updates: Map<number, [number, number, number]>) => {
      if (updates.size === 0) {
        return;
      }

      commitSnapshot((current) => {
        const byId = new Map(
          current.node_positions.map((entry) => [entry.item_id, entry] as const),
        );

        for (const [itemId, position] of updates) {
          byId.set(itemId, {
            item_id: itemId,
            x: position[0],
            y: position[1],
            z: position[2],
          });
        }

        return {
          ...current,
          node_positions: [...byId.values()],
        };
      });
    },
    [commitSnapshot],
  );

  const toggleFolderExpanded = useCallback(
    (folderId: number) => {
      commitSnapshot((current) => {
        const expanded = new Set(current.expanded_folder_ids);
        if (expanded.has(folderId)) {
          expanded.delete(folderId);
        } else {
          expanded.add(folderId);
        }
        return {
          ...current,
          expanded_folder_ids: [...expanded],
        };
      });
    },
    [commitSnapshot],
  );

  const expandFolders = useCallback(
    (folderIds: number[]) => {
      if (folderIds.length === 0) {
        return;
      }

      commitSnapshot((current) => {
        const expanded = new Set(current.expanded_folder_ids);
        for (const folderId of folderIds) {
          expanded.add(folderId);
        }
        return {
          ...current,
          expanded_folder_ids: [...expanded],
        };
      });
    },
    [commitSnapshot],
  );

  const collapseFolders = useCallback(
    (folderIds: number[]) => {
      if (folderIds.length === 0) {
        return;
      }

      commitSnapshot((current) => {
        const expanded = new Set(current.expanded_folder_ids);
        for (const folderId of folderIds) {
          expanded.delete(folderId);
        }
        return {
          ...current,
          expanded_folder_ids: [...expanded],
        };
      });
    },
    [commitSnapshot],
  );

  const setCamera = useCallback(
    (camera: CoakCameraState | null) => {
      commitSnapshot((current) => ({ ...current, camera }));
    },
    [commitSnapshot],
  );

  const pinItem = useCallback(
    (itemId: number) => {
      commitSnapshot(
        (current) => {
          if (current.pinned_item_ids.includes(itemId)) {
            return current;
          }
          return {
            ...current,
            pinned_item_ids: [itemId, ...current.pinned_item_ids],
          };
        },
        { immediate: true },
      );
    },
    [commitSnapshot],
  );

  const unpinItem = useCallback(
    (itemId: number) => {
      commitSnapshot(
        (current) => ({
          ...current,
          pinned_item_ids: current.pinned_item_ids.filter((id) => id !== itemId),
        }),
        { immediate: true },
      );
    },
    [commitSnapshot],
  );

  const unpinAllItems = useCallback(() => {
    commitSnapshot(
      (current) => ({
        ...current,
        pinned_item_ids: [],
      }),
      { immediate: true },
    );
  }, [commitSnapshot]);

  const setPinnedItemIds = useCallback(
    (pinnedItemIds: number[]) => {
      commitSnapshot((current) => ({
        ...current,
        pinned_item_ids: pinnedItemIds,
      }));
    },
    [commitSnapshot],
  );

  return {
    workspaceState: snapshot,
    workspaceHydrated: hydrated && !query.isLoading,
    setNodePosition,
    setNodePositions,
    toggleFolderExpanded,
    expandFolders,
    collapseFolders,
    setCamera,
    pinItem,
    unpinItem,
    unpinAllItems,
    setPinnedItemIds,
    isLoading: query.isLoading,
  };
}
