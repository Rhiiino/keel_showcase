// keel_web/src/modules/focus/hooks/useFocusEntryDragTree.ts

// Working tree for staged Focus entry moves in the list editor.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { fetchFocusList, focusQueryKeys, type FocusEntry } from "../api";
import {
  cloneFocusEntryTree,
  collectFocusEntryPendingMoves,
  getFocusEntryContainerId,
  isContainerDescendantOfEntry,
  moveFocusEntryInTree,
  sortFocusEntries,
  type FocusEntryContainerId,
  type FocusEntryPendingMove,
  type FocusEntryTreeChildren,
} from "../lib/focusEntryTree";

type ContainerLoadState = "idle" | "loading" | "loaded" | "error";

type UseFocusEntryDragTreeParams = {
  rootContainerId: FocusEntryContainerId;
  rootEntries: FocusEntry[];
};

type MoveEntryParams = {
  nodeId: number;
  toParentId: FocusEntryContainerId;
  insertIndex: number;
};

export type UseFocusEntryDragTreeResult = {
  children: FocusEntryTreeChildren;
  pendingMoves: FocusEntryPendingMove[];
  hasPendingMoves: boolean;
  getEntries: (containerId: FocusEntryContainerId) => FocusEntry[];
  getContainerIdForEntry: (entry: FocusEntry) => number | null;
  getContainerLoadState: (containerId: FocusEntryContainerId) => ContainerLoadState;
  loadContainer: (containerId: FocusEntryContainerId) => Promise<void>;
  moveEntry: (params: MoveEntryParams) => void;
  canMoveEntryToContainer: (entryId: number, containerId: FocusEntryContainerId) => boolean;
  discardMoves: () => void;
  markSnapshotCurrent: () => void;
};

function buildInitialTree(
  rootContainerId: FocusEntryContainerId,
  rootEntries: FocusEntry[],
): FocusEntryTreeChildren {
  return new Map([[rootContainerId, sortFocusEntries(rootEntries)]]);
}

function rootEntriesKey(entries: FocusEntry[]): string {
  return entries
    .map((entry) => `${entry.id}:${entry.list_id}:${entry.sort_order}`)
    .join("|");
}

export function useFocusEntryDragTree({
  rootContainerId,
  rootEntries,
}: UseFocusEntryDragTreeParams): UseFocusEntryDragTreeResult {
  const queryClient = useQueryClient();
  const [children, setChildren] = useState<FocusEntryTreeChildren>(() =>
    buildInitialTree(rootContainerId, rootEntries),
  );
  const [snapshot, setSnapshot] = useState<FocusEntryTreeChildren>(() =>
    buildInitialTree(rootContainerId, rootEntries),
  );
  const [loadStates, setLoadStates] = useState(
    () => new Map<FocusEntryContainerId, ContainerLoadState>([[rootContainerId, "loaded"]]),
  );
  const previousRootContainerId = useRef(rootContainerId);

  const rootKey = rootEntriesKey(rootEntries);

  const pendingMoves = useMemo(
    () => collectFocusEntryPendingMoves({ current: children, snapshot }),
    [children, snapshot],
  );
  const hasPendingMoves = pendingMoves.length > 0;

  useEffect(() => {
    if (previousRootContainerId.current !== rootContainerId) {
      previousRootContainerId.current = rootContainerId;
      const rootTree = buildInitialTree(rootContainerId, rootEntries);
      setChildren(rootTree);
      setSnapshot(cloneFocusEntryTree(rootTree));
      setLoadStates(new Map([[rootContainerId, "loaded"]]));
      return;
    }

    if (hasPendingMoves) {
      return;
    }

    const rootTree = buildInitialTree(rootContainerId, rootEntries);
    const rootRows = rootTree.get(rootContainerId) ?? [];
    setChildren((current) => {
      const next = cloneFocusEntryTree(current);
      next.set(rootContainerId, rootRows);
      return next;
    });
    setSnapshot((current) => {
      const next = cloneFocusEntryTree(current);
      next.set(rootContainerId, rootRows);
      return next;
    });
    setLoadStates((current) => new Map(current).set(rootContainerId, "loaded"));
  }, [hasPendingMoves, rootContainerId, rootKey, rootEntries]);

  const getEntries = useCallback(
    (containerId: FocusEntryContainerId) => children.get(containerId) ?? [],
    [children],
  );

  const getContainerLoadState = useCallback(
    (containerId: FocusEntryContainerId) => loadStates.get(containerId) ?? "idle",
    [loadStates],
  );

  const loadContainer = useCallback(
    async (containerId: FocusEntryContainerId) => {
      const state = loadStates.get(containerId);
      if (state === "loaded" || state === "loading") {
        return;
      }

      setLoadStates((current) => new Map(current).set(containerId, "loading"));
      try {
        const list = await queryClient.fetchQuery({
          queryKey: focusQueryKeys.list(containerId),
          queryFn: () => fetchFocusList(containerId),
        });
        const entries = sortFocusEntries(list.entries);
        setChildren((current) => {
          const next = cloneFocusEntryTree(current);
          next.set(containerId, entries);
          return next;
        });
        setSnapshot((current) => {
          const next = cloneFocusEntryTree(current);
          next.set(containerId, entries);
          return next;
        });
        setLoadStates((current) => new Map(current).set(containerId, "loaded"));
      } catch {
        setLoadStates((current) => new Map(current).set(containerId, "error"));
      }
    },
    [loadStates, queryClient],
  );

  const moveEntry = useCallback(
    ({ nodeId, toParentId, insertIndex }: MoveEntryParams) => {
      setChildren((current) =>
        moveFocusEntryInTree({
          children: current,
          nodeId,
          toParentId,
          insertIndex,
        }),
      );
      setLoadStates((current) => new Map(current).set(toParentId, "loaded"));
    },
    [],
  );

  const canMoveEntryToContainer = useCallback(
    (entryId: number, containerId: FocusEntryContainerId) =>
      !isContainerDescendantOfEntry({ children, entryId, containerId }),
    [children],
  );

  const discardMoves = useCallback(() => {
    setChildren(cloneFocusEntryTree(snapshot));
  }, [snapshot]);

  const markSnapshotCurrent = useCallback(() => {
    setSnapshot(cloneFocusEntryTree(children));
  }, [children]);

  return {
    children,
    pendingMoves,
    hasPendingMoves,
    getEntries,
    getContainerIdForEntry: getFocusEntryContainerId,
    getContainerLoadState,
    loadContainer,
    moveEntry,
    canMoveEntryToContainer,
    discardMoves,
    markSnapshotCurrent,
  };
}
