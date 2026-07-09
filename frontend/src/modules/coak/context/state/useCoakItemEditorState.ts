// keel_web/src/modules/coak/context/state/useCoakItemEditorState.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { COAK_ORIGIN_NODE_ID, coakItemNodeId, parseCoakItemNodeId } from "../../api";
import type { CoakItemEditorAnchor } from "../../lib/tabs/constellation/coakItemEditorAnchor";
import type { CoakItemEditorNodeDragRequest } from "../../lib/tabs/constellation/coakItemEditorDrag";
import {
  collectCoakDescendantNodeIds,
  collectCoakDirectChildItemIds,
  collectCoakSubtreeFolderIds,
  isCoakFolderExpanded,
} from "../../lib/tabs/directory/coakTree";
import type { CoakConstellationOrbitRequest } from "../coakWorkspaceTypes";
import type { CoakWorkspaceData } from "./useCoakWorkspaceData";

type UseCoakItemEditorStateParams = Pick<
  CoakWorkspaceData,
  | "items"
  | "isNodePinned"
  | "pinnedItemIdsSet"
  | "toggleFolderExpanded"
  | "expandFolders"
  | "collapseFolders"
  | "workspaceState"
  | "autoOptimizeLayoutEnabledRef"
>;

export function useCoakItemEditorState({
  items,
  isNodePinned,
  pinnedItemIdsSet,
  toggleFolderExpanded,
  expandFolders,
  collapseFolders,
  workspaceState,
  autoOptimizeLayoutEnabledRef,
}: UseCoakItemEditorStateParams) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [itemEditorNodeIds, setItemEditorNodeIds] = useState<string[]>([]);
  const [itemEditorTitleFocusNodeId, setItemEditorTitleFocusNodeId] = useState<string | null>(
    null,
  );
  const [itemEditorAnchors, setItemEditorAnchors] = useState<
    Record<string, CoakItemEditorAnchor>
  >({});
  const [itemEditorNodeDragRequest, setItemEditorNodeDragRequest] =
    useState<CoakItemEditorNodeDragRequest | null>(null);
  const [constellationNodeDragActive, setConstellationNodeDragActive] = useState(false);
  const itemEditorNodeDragTokenRef = useRef(0);
  const [constellationOrbitRequest, setConstellationOrbitRequest] =
    useState<CoakConstellationOrbitRequest | null>(null);
  const constellationOrbitTokenRef = useRef(0);

  const setItemEditorAnchor = useCallback(
    (nodeId: string, anchor: CoakItemEditorAnchor | null) => {
      setItemEditorAnchors((current) => {
        if (anchor == null) {
          if (!(nodeId in current)) {
            return current;
          }

          const { [nodeId]: _removed, ...rest } = current;
          return rest;
        }

        const existing = current[nodeId];
        if (
          existing?.x === anchor.x &&
          existing?.y === anchor.y &&
          existing?.scale === anchor.scale
        ) {
          return current;
        }

        return { ...current, [nodeId]: anchor };
      });
    },
    [],
  );

  const beginItemEditorNodeDrag = useCallback(
    (request: Omit<CoakItemEditorNodeDragRequest, "token">) => {
      if (autoOptimizeLayoutEnabledRef.current) {
        return;
      }

      itemEditorNodeDragTokenRef.current += 1;
      setItemEditorNodeDragRequest({
        ...request,
        token: itemEditorNodeDragTokenRef.current,
      });
    },
    [autoOptimizeLayoutEnabledRef],
  );

  const clearItemEditorNodeDragRequest = useCallback(() => {
    setItemEditorNodeDragRequest(null);
  }, []);

  const clearItemEditorTitleFocus = useCallback(() => {
    setItemEditorTitleFocusNodeId(null);
  }, []);

  const applyItemEditorTitleFocus = useCallback(
    (nodeIds: string[], focusTitle?: boolean) => {
      if (focusTitle && nodeIds.length === 1) {
        setItemEditorTitleFocusNodeId(nodeIds[0]);
        return;
      }
      setItemEditorTitleFocusNodeId(null);
    },
    [],
  );

  const expandCoakItemAncestorFolders = useCallback(
    (nodeId: string) => {
      if (nodeId === COAK_ORIGIN_NODE_ID) {
        return;
      }

      const itemId = parseCoakItemNodeId(nodeId);
      if (itemId == null) {
        return;
      }

      let parentId = items.find((entry) => entry.id === itemId)?.parent_id ?? null;
      while (parentId != null) {
        if (!isCoakFolderExpanded(workspaceState.expanded_folder_ids, parentId)) {
          toggleFolderExpanded(parentId);
        }
        parentId = items.find((entry) => entry.id === parentId)?.parent_id ?? null;
      }
    },
    [items, toggleFolderExpanded, workspaceState.expanded_folder_ids],
  );

  const openItemEditors = useCallback(
    (
      nodeIds: string[],
      options?: {
        orbit?: boolean;
        focusTitle?: boolean;
        expandAncestors?: boolean;
        /** When true, pinned items also open as floating constellation editors (used by Reveal). */
        allowPinnedFloating?: boolean;
      },
    ) => {
      if (options?.expandAncestors !== false) {
        for (const nodeId of nodeIds) {
          expandCoakItemAncestorFolders(nodeId);
        }
      }

      const allowPinnedFloating = options?.allowPinnedFloating === true;
      const pinnedIds = allowPinnedFloating
        ? []
        : nodeIds.filter((nodeId) => {
            const itemId = parseCoakItemNodeId(nodeId);
            return itemId != null && pinnedItemIdsSet.has(itemId);
          });
      const floatingIds = allowPinnedFloating
        ? nodeIds
        : nodeIds.filter((nodeId) => {
            const itemId = parseCoakItemNodeId(nodeId);
            return itemId == null || !pinnedItemIdsSet.has(itemId);
          });

      if (pinnedIds.length > 0) {
        applyItemEditorTitleFocus(pinnedIds, options?.focusTitle);
      }

      if (floatingIds.length === 0) {
        setSelectedNodeId(nodeIds[0] ?? null);
        setItemEditorNodeIds([]);
        setItemEditorAnchors({});

        if (options?.orbit === false || nodeIds.length === 0) {
          setConstellationOrbitRequest(null);
          return;
        }

        if (nodeIds.length > 1) {
          setConstellationOrbitRequest(null);
          return;
        }

        constellationOrbitTokenRef.current += 1;
        setConstellationOrbitRequest({
          nodeId: nodeIds[0],
          token: constellationOrbitTokenRef.current,
        });
        return;
      }

      setSelectedNodeId(floatingIds[0] ?? null);
      setItemEditorNodeIds(floatingIds);
      if (pinnedIds.length === 0) {
        applyItemEditorTitleFocus(floatingIds, options?.focusTitle);
      }
      setItemEditorAnchors((current) => {
        const next: Record<string, CoakItemEditorAnchor> = {};
        for (const nodeId of floatingIds) {
          if (current[nodeId]) {
            next[nodeId] = current[nodeId];
          }
        }
        return next;
      });

      if (options?.orbit === false || floatingIds.length === 0) {
        setConstellationOrbitRequest(null);
        return;
      }

      if (floatingIds.length > 1) {
        setConstellationOrbitRequest(null);
        return;
      }

      constellationOrbitTokenRef.current += 1;
      setConstellationOrbitRequest({
        nodeId: floatingIds[0],
        token: constellationOrbitTokenRef.current,
      });
    },
    [applyItemEditorTitleFocus, expandCoakItemAncestorFolders, pinnedItemIdsSet],
  );

  const openItemEditor = useCallback(
    (
      nodeId: string,
      options?: { orbit?: boolean; replace?: boolean; focusTitle?: boolean },
    ) => {
      if (isNodePinned(nodeId)) {
        expandCoakItemAncestorFolders(nodeId);
        setSelectedNodeId(nodeId);
        setItemEditorNodeIds([]);
        setItemEditorAnchors({});
        applyItemEditorTitleFocus([nodeId], options?.focusTitle);

        if (options?.orbit === false) {
          setConstellationOrbitRequest(null);
          return;
        }

        constellationOrbitTokenRef.current += 1;
        setConstellationOrbitRequest({
          nodeId,
          token: constellationOrbitTokenRef.current,
        });
        return;
      }

      if (options?.replace === false) {
        expandCoakItemAncestorFolders(nodeId);

        setItemEditorNodeIds((current) => {
          if (current.includes(nodeId)) {
            const next = current.filter((id) => id !== nodeId);
            setSelectedNodeId(next[0] ?? null);
            setItemEditorTitleFocusNodeId(null);

            if (next.length === 0) {
              setItemEditorAnchors({});
              setConstellationOrbitRequest(null);
            } else {
              setItemEditorAnchors((anchors) => {
                if (!(nodeId in anchors)) {
                  return anchors;
                }

                const { [nodeId]: _removed, ...rest } = anchors;
                return rest;
              });
            }

            return next;
          }

          setSelectedNodeId(nodeId);
          const next = [...current, nodeId];
          applyItemEditorTitleFocus(next, options?.focusTitle);

          if (next.length > 1 || options?.orbit === false) {
            setConstellationOrbitRequest(null);
          } else {
            constellationOrbitTokenRef.current += 1;
            setConstellationOrbitRequest({
              nodeId,
              token: constellationOrbitTokenRef.current,
            });
          }

          return next;
        });

        return;
      }

      openItemEditors([nodeId], options);
    },
    [applyItemEditorTitleFocus, expandCoakItemAncestorFolders, isNodePinned, openItemEditors],
  );

  const cancelConstellationOrbit = useCallback(() => {
    setConstellationOrbitRequest(null);
  }, []);

  const closeItemEditor = useCallback(() => {
    setItemEditorNodeIds([]);
    setItemEditorAnchors({});
    setItemEditorTitleFocusNodeId(null);
    setSelectedNodeId(null);
    setConstellationOrbitRequest(null);
  }, []);

  const revealNodeChildren = useCallback(
    (nodeId: string) => {
      const childItemIds = collectCoakDirectChildItemIds(items, nodeId);
      if (childItemIds.length === 0) {
        return;
      }

      const childNodeIds = childItemIds.map((itemId) => coakItemNodeId(itemId));
      const expandedChildFolderIds = childItemIds.filter((itemId) => {
        const item = items.find((entry) => entry.id === itemId);
        return (
          item?.kind === "folder" &&
          isCoakFolderExpanded(workspaceState.expanded_folder_ids, itemId)
        );
      });

      if (nodeId !== COAK_ORIGIN_NODE_ID) {
        const itemId = parseCoakItemNodeId(nodeId);
        if (itemId != null) {
          const item = items.find((entry) => entry.id === itemId);
          if (
            item?.kind === "folder" &&
            !isCoakFolderExpanded(workspaceState.expanded_folder_ids, itemId)
          ) {
            expandFolders([itemId]);
            if (expandedChildFolderIds.length > 0) {
              collapseFolders(expandedChildFolderIds);
            }
          }
        }
      }

      openItemEditors(childNodeIds, {
        orbit: false,
        expandAncestors: false,
        allowPinnedFloating: true,
      });
    },
    [
      collapseFolders,
      expandFolders,
      items,
      openItemEditors,
      workspaceState.expanded_folder_ids,
    ],
  );

  const revealNodeLineage = useCallback(
    (nodeId: string) => {
      const descendantNodeIds = collectCoakDescendantNodeIds(items, nodeId);
      if (descendantNodeIds.length === 0) {
        return;
      }

      const folderIdsToExpand = collectCoakSubtreeFolderIds(items, nodeId).filter(
        (folderId) => !isCoakFolderExpanded(workspaceState.expanded_folder_ids, folderId),
      );
      expandFolders(folderIdsToExpand);
      openItemEditors(descendantNodeIds, {
        orbit: false,
        expandAncestors: false,
        allowPinnedFloating: true,
      });
    },
    [expandFolders, items, openItemEditors, workspaceState.expanded_folder_ids],
  );

  const minimizeNodeChildren = useCallback(
    (nodeId: string) => {
      const foldersToCollapse =
        nodeId === COAK_ORIGIN_NODE_ID
          ? items
              .filter((item) => item.parent_id == null && item.kind === "folder")
              .map((item) => item.id)
              .filter((folderId) =>
                isCoakFolderExpanded(workspaceState.expanded_folder_ids, folderId),
              )
          : (() => {
              const itemId = parseCoakItemNodeId(nodeId);
              if (itemId == null) {
                return [];
              }

              const item = items.find((entry) => entry.id === itemId);
              if (item?.kind !== "folder") {
                return [];
              }

              return isCoakFolderExpanded(workspaceState.expanded_folder_ids, itemId)
                ? [itemId]
                : [];
            })();

      if (foldersToCollapse.length === 0) {
        return;
      }

      collapseFolders(foldersToCollapse);

      const hiddenNodeIds = new Set<string>();
      for (const folderId of foldersToCollapse) {
        for (const descendantNodeId of collectCoakDescendantNodeIds(items, coakItemNodeId(folderId))) {
          hiddenNodeIds.add(descendantNodeId);
        }
      }

      setItemEditorNodeIds((current) => {
        const next = current.filter((id) => !hiddenNodeIds.has(id));
        if (next.length === current.length) {
          return current;
        }

        setSelectedNodeId(next[0] ?? null);
        setItemEditorTitleFocusNodeId(null);
        setItemEditorAnchors((anchors) => {
          const filtered: Record<string, CoakItemEditorAnchor> = {};
          for (const id of next) {
            if (anchors[id]) {
              filtered[id] = anchors[id];
            }
          }
          return filtered;
        });

        if (next.length === 0) {
          setConstellationOrbitRequest(null);
        }

        return next;
      });
    },
    [collapseFolders, items, workspaceState.expanded_folder_ids],
  );

  const hasMultiItemSelection = itemEditorNodeIds.length > 1;

  useEffect(() => {
    if (hasMultiItemSelection) {
      setConstellationOrbitRequest(null);
    }
  }, [hasMultiItemSelection]);

  const selectDirectoryNode = openItemEditor;
  const clearDirectorySelection = closeItemEditor;

  return {
    selectedNodeId,
    itemEditorNodeIds,
    setItemEditorNodeIds,
    itemEditorTitleFocusNodeId,
    itemEditorAnchors,
    setItemEditorAnchors,
    itemEditorNodeDragRequest,
    constellationNodeDragActive,
    setConstellationNodeDragActive,
    constellationOrbitRequest,
    setItemEditorAnchor,
    beginItemEditorNodeDrag,
    clearItemEditorNodeDragRequest,
    clearItemEditorTitleFocus,
    openItemEditor,
    openItemEditors,
    cancelConstellationOrbit,
    closeItemEditor,
    revealNodeChildren,
    revealNodeLineage,
    minimizeNodeChildren,
    selectDirectoryNode,
    clearDirectorySelection,
  };
}

export type CoakItemEditorState = ReturnType<typeof useCoakItemEditorState>;
