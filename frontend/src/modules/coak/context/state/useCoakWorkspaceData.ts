// keel_web/src/modules/coak/context/state/useCoakWorkspaceData.ts

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";

import {
  COAK_ORIGIN_NODE_ID,
  coakItemNodeId,
  coakQueryKeys,
  fetchCoakItems,
  fetchCoakRecord,
  parseCoakItemNodeId,
} from "../../api";
import { useCoakConfigurationSettings } from "../../hooks/workspace/useCoakConfigurationSettings";
import { useCoakWorkspacePersistence } from "../../hooks/workspace/useCoakWorkspacePersistence";
import { useCoakWorkspaceSettings } from "../../hooks/workspace/useCoakWorkspaceSettings";
import { buildResolvedNodePositionMap } from "../../lib/tabs/constellation/coakNodeLayout";
import { buildCoakTree, flattenVisibleCoakTree } from "../../lib/tabs/directory/coakTree";
import {
  readCoakAutoOptimizeConnectionAngle,
  readCoakAutoOptimizeConnectionDistance,
  readCoakAutoOptimizeLayoutEnabled,
} from "../../lib/tabs/settings/coakAutoOptimizeSettings";
import { readCoakItemEditorEnlargeEnabled } from "../../lib/tabs/settings/coakItemEditorEnlargeSettings";
import {
  resolveCoakNodeSphereRadius,
  resolveCoakOriginNodeRadius,
} from "../../lib/tabs/settings/coakNodeSizeSettings";
import { readCoakPersistentNodeModalsEnabled } from "../../lib/tabs/settings/coakPersistentNodeModalsSettings";
import { COAK_ORIGIN_POSITION, type CoakGraphNode } from "../coakWorkspaceTypes";

export function useCoakWorkspaceData(recordId: number) {
  const recordQuery = useQuery({
    queryKey: coakQueryKeys.record(recordId),
    queryFn: () => fetchCoakRecord(recordId),
  });

  const itemsQuery = useQuery({
    queryKey: coakQueryKeys.items(recordId),
    queryFn: () => fetchCoakItems(recordId),
  });

  const {
    workspaceState,
    workspaceHydrated,
    setNodePosition,
    setNodePositions,
    toggleFolderExpanded,
    expandFolders,
    collapseFolders,
    setCamera,
    pinItem,
    unpinItem,
    unpinAllItems,
  } = useCoakWorkspacePersistence(recordId);

  const {
    workspaceLayout,
    workspaceSettingsHydrated,
    setWindowRect,
    bringWindowToFront,
    getWindowZIndex,
    setActiveTab,
    moveTabBetweenWindows,
    tearOutTab,
    mergeWindows,
  } = useCoakWorkspaceSettings(recordId);

  const {
    configurationSettings,
    configurationSettingsHydrated,
    updateConfigurationSetting,
  } = useCoakConfigurationSettings(recordId);

  const items = itemsQuery.data ?? [];
  const tree = useMemo(() => buildCoakTree(items), [items]);

  const autoOptimizeLayoutEnabled = useMemo(
    () => readCoakAutoOptimizeLayoutEnabled(configurationSettings),
    [configurationSettings],
  );
  const autoOptimizeConnectionDistance = useMemo(
    () => readCoakAutoOptimizeConnectionDistance(configurationSettings),
    [configurationSettings],
  );
  const autoOptimizeConnectionAngle = useMemo(
    () => readCoakAutoOptimizeConnectionAngle(configurationSettings),
    [configurationSettings],
  );
  const persistentNodeModalsEnabled = useMemo(
    () => readCoakPersistentNodeModalsEnabled(configurationSettings),
    [configurationSettings],
  );
  const itemEditorEnlargeEnabled = useMemo(
    () => readCoakItemEditorEnlargeEnabled(configurationSettings),
    [configurationSettings],
  );
  const nodeSphereRadius = useMemo(
    () => resolveCoakNodeSphereRadius(configurationSettings),
    [configurationSettings],
  );
  const originNodeRadius = useMemo(
    () => resolveCoakOriginNodeRadius(configurationSettings),
    [configurationSettings],
  );
  const autoOptimizeLayoutEnabledRef = useRef(autoOptimizeLayoutEnabled);
  autoOptimizeLayoutEnabledRef.current = autoOptimizeLayoutEnabled;

  const pinnedItemIds = workspaceState.pinned_item_ids;
  const pinnedItemIdsSet = useMemo(() => new Set(pinnedItemIds), [pinnedItemIds]);
  const pinnedNodeIds = useMemo(
    () => pinnedItemIds.map((itemId) => coakItemNodeId(itemId)),
    [pinnedItemIds],
  );

  const isNodePinned = useCallback(
    (nodeId: string) => {
      const itemId = parseCoakItemNodeId(nodeId);
      return itemId != null && pinnedItemIdsSet.has(itemId);
    },
    [pinnedItemIdsSet],
  );

  const positionMap = useMemo(
    () => buildResolvedNodePositionMap(items, workspaceState.node_positions),
    [items, workspaceState.node_positions],
  );
  const positionMapRef = useRef(positionMap);
  positionMapRef.current = positionMap;

  const visibleItemIds = useMemo(
    () =>
      new Set(
        flattenVisibleCoakTree(tree, workspaceState.expanded_folder_ids).map((node) => node.id),
      ),
    [tree, workspaceState.expanded_folder_ids],
  );

  const graphNodes = useMemo((): CoakGraphNode[] => {
    const record = recordQuery.data;
    if (!record) {
      return [];
    }

    return items
      .filter((item) => visibleItemIds.has(item.id))
      .map((item) => ({
        id: coakItemNodeId(item.id),
        itemId: item.id,
        label: item.name,
        color: item.color_hex,
        parentNodeId:
          item.parent_id == null ? COAK_ORIGIN_NODE_ID : coakItemNodeId(item.parent_id),
        position: positionMap.get(item.id) ?? COAK_ORIGIN_POSITION,
        kind: item.kind,
        tags: item.tags ?? [],
      }));
  }, [items, positionMap, recordQuery.data, visibleItemIds]);

  return {
    recordId,
    recordQuery,
    itemsQuery,
    items,
    tree,
    graphNodes,
    workspaceState,
    workspaceHydrated,
    workspaceSettingsHydrated,
    setNodePosition,
    setNodePositions,
    toggleFolderExpanded,
    expandFolders,
    collapseFolders,
    setCamera,
    pinItem,
    unpinItem,
    unpinAllItems,
    workspaceLayout,
    setWindowRect,
    bringWindowToFront,
    getWindowZIndex,
    setActiveTab,
    moveTabBetweenWindows,
    tearOutTab,
    mergeWindows,
    configurationSettings,
    configurationSettingsHydrated,
    updateConfigurationSetting,
    autoOptimizeLayoutEnabled,
    autoOptimizeConnectionDistance,
    autoOptimizeConnectionAngle,
    autoOptimizeLayoutEnabledRef,
    persistentNodeModalsEnabled,
    itemEditorEnlargeEnabled,
    nodeSphereRadius,
    originNodeRadius,
    pinnedItemIds,
    pinnedItemIdsSet,
    pinnedNodeIds,
    isNodePinned,
    positionMap,
    positionMapRef,
  };
}

export type CoakWorkspaceData = ReturnType<typeof useCoakWorkspaceData>;
