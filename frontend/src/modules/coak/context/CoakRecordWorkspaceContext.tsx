// keel_web/src/modules/coak/context/CoakRecordWorkspaceContext.tsx

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useCoakGraphSessions } from "./state/useCoakGraphSessions";
import { useCoakItemActions } from "./state/useCoakItemActions";
import { useCoakItemEditorState } from "./state/useCoakItemEditorState";
import { useCoakItemMutations } from "./state/useCoakItemMutations";
import { useCoakNodePositioning } from "./state/useCoakNodePositioning";
import { useCoakWorkspaceData } from "./state/useCoakWorkspaceData";
import { useCoakWorkspaceSearchState } from "./state/useCoakWorkspaceSearchState";
import type { CoakRecordWorkspaceContextValue } from "./coakWorkspaceTypes";

export type {
  CoakChildRevolveSession,
  CoakGraphNode,
  CoakGraphNodeContextMenuState,
  CoakGraphCanvasContextMenuState,
  CoakNodeMoveSession,
  CoakNodeRevolveSession,
  CoakNodeSwapSession,
} from "./coakWorkspaceTypes";

const CoakRecordWorkspaceContext = createContext<CoakRecordWorkspaceContextValue | null>(null);

type CoakRecordWorkspaceProviderProps = {
  recordId: number;
  children: ReactNode;
};

export function CoakRecordWorkspaceProvider({
  recordId,
  children,
}: CoakRecordWorkspaceProviderProps) {
  const data = useCoakWorkspaceData(recordId);
  const mutations = useCoakItemMutations(recordId);

  const editor = useCoakItemEditorState({
    items: data.items,
    isNodePinned: data.isNodePinned,
    pinnedItemIdsSet: data.pinnedItemIdsSet,
    toggleFolderExpanded: data.toggleFolderExpanded,
    expandFolders: data.expandFolders,
    collapseFolders: data.collapseFolders,
    workspaceState: data.workspaceState,
    autoOptimizeLayoutEnabledRef: data.autoOptimizeLayoutEnabledRef,
  });

  const search = useCoakWorkspaceSearchState({
    tree: data.tree,
    openItemEditor: editor.openItemEditor,
    openItemEditors: editor.openItemEditors,
    closeItemEditor: editor.closeItemEditor,
    cancelConstellationOrbit: editor.cancelConstellationOrbit,
  });

  const actions = useCoakItemActions({
    items: data.items,
    toggleFolderExpanded: data.toggleFolderExpanded,
    workspaceState: data.workspaceState,
    pinItem: data.pinItem,
    unpinItem: data.unpinItem,
    unpinAllItems: data.unpinAllItems,
    createItemMutation: mutations.createItemMutation,
    updateItemMutation: mutations.updateItemMutation,
    deleteItemMutation: mutations.deleteItemMutation,
    updateRecordMutation: mutations.updateRecordMutation,
    openItemEditor: editor.openItemEditor,
    setItemEditorNodeIds: editor.setItemEditorNodeIds,
    setItemEditorAnchors: editor.setItemEditorAnchors,
  });

  const sessions = useCoakGraphSessions({
    items: data.items,
    positionMapRef: data.positionMapRef,
    autoOptimizeLayoutEnabledRef: data.autoOptimizeLayoutEnabledRef,
    autoOptimizeLayoutEnabled: data.autoOptimizeLayoutEnabled,
    setNodePositions: data.setNodePositions,
    moveItem: actions.moveItem,
    updateItemMutation: mutations.updateItemMutation,
    nodeSphereRadius: data.nodeSphereRadius,
    originNodeRadius: data.originNodeRadius,
  });

  const positioning = useCoakNodePositioning({
    items: data.items,
    graphNodes: data.graphNodes,
    positionMap: data.positionMap,
    positionMapRef: data.positionMapRef,
    autoOptimizeLayoutEnabledRef: data.autoOptimizeLayoutEnabledRef,
    autoOptimizeLayoutEnabled: data.autoOptimizeLayoutEnabled,
    autoOptimizeConnectionDistance: data.autoOptimizeConnectionDistance,
    autoOptimizeConnectionAngle: data.autoOptimizeConnectionAngle,
    nodeSphereRadius: data.nodeSphereRadius,
    configurationSettingsHydrated: data.configurationSettingsHydrated,
    workspaceHydrated: data.workspaceHydrated,
    setNodePosition: data.setNodePosition,
    setNodePositions: data.setNodePositions,
    closeChildRevolve: sessions.closeChildRevolve,
    closeNodeRevolve: sessions.closeNodeRevolve,
  });

  const preserveConstellationSelection = search.isNodeSearchActive;

  const value = useMemo<CoakRecordWorkspaceContextValue>(
    () => ({
      recordId: data.recordId,
      record: data.recordQuery.data,
      items: data.items,
      tree: data.tree,
      graphNodes: data.graphNodes,
      expandedFolderIds: data.workspaceState.expanded_folder_ids,
      isLoading: data.recordQuery.isLoading || data.itemsQuery.isLoading,
      selectedNodeId: editor.selectedNodeId,
      directorySearchQuery: search.directorySearchQuery,
      directorySearchMatchIds: search.directorySearchMatchIds,
      constellationSearchQuery: search.constellationSearchQuery,
      constellationSearchMatchIds: search.constellationSearchMatchIds,
      constellationSearchMatchIndex: search.constellationSearchMatchIndex,
      isDirectorySearchActive: search.isDirectorySearchActive,
      isConstellationSearchActive: search.isConstellationSearchActive,
      isNodeSearchActive: search.isNodeSearchActive,
      preserveConstellationSelection,
      setDirectorySearchQuery: search.setDirectorySearchQuery,
      setConstellationSearchQuery: search.setConstellationSearchQuery,
      cycleConstellationSearchMatch: search.cycleConstellationSearchMatch,
      itemEditorNodeIds: editor.itemEditorNodeIds,
      itemEditorTitleFocusNodeId: editor.itemEditorTitleFocusNodeId,
      clearItemEditorTitleFocus: editor.clearItemEditorTitleFocus,
      itemEditorAnchors: editor.itemEditorAnchors,
      itemEditorNodeDragRequest: editor.itemEditorNodeDragRequest,
      constellationNodeDragActive: editor.constellationNodeDragActive,
      setConstellationNodeDragActive: editor.setConstellationNodeDragActive,
      beginItemEditorNodeDrag: editor.beginItemEditorNodeDrag,
      clearItemEditorNodeDragRequest: editor.clearItemEditorNodeDragRequest,
      constellationOrbitRequest: editor.constellationOrbitRequest,
      cancelConstellationOrbit: editor.cancelConstellationOrbit,
      graphNodeContextMenu: sessions.graphNodeContextMenu,
      openGraphNodeContextMenu: sessions.openGraphNodeContextMenu,
      closeGraphNodeContextMenu: sessions.closeGraphNodeContextMenu,
      graphCanvasContextMenu: sessions.graphCanvasContextMenu,
      openGraphCanvasContextMenu: sessions.openGraphCanvasContextMenu,
      closeGraphCanvasContextMenu: sessions.closeGraphCanvasContextMenu,
      optimizeNodeChildren: positioning.optimizeNodeChildren,
      revealNodeChildren: editor.revealNodeChildren,
      revealNodeLineage: editor.revealNodeLineage,
      minimizeNodeChildren: editor.minimizeNodeChildren,
      childRevolveSession: sessions.childRevolveSession,
      childRevolveDragActive: sessions.childRevolveDragActive,
      setChildRevolveDragActive: sessions.setChildRevolveDragActive,
      beginChildRevolve: sessions.beginChildRevolve,
      closeChildRevolve: sessions.closeChildRevolve,
      applyChildRevolveRotation: sessions.applyChildRevolveRotation,
      nodeRevolveSession: sessions.nodeRevolveSession,
      beginNodeRevolve: sessions.beginNodeRevolve,
      closeNodeRevolve: sessions.closeNodeRevolve,
      applyNodeRevolveRotation: sessions.applyNodeRevolveRotation,
      nodeMoveSession: sessions.nodeMoveSession,
      beginNodeMove: sessions.beginNodeMove,
      closeNodeMove: sessions.closeNodeMove,
      commitNodeMove: sessions.commitNodeMove,
      isNodeMoveTarget: sessions.isNodeMoveTarget,
      nodeSwapSession: sessions.nodeSwapSession,
      beginNodeSwap: sessions.beginNodeSwap,
      closeNodeSwap: sessions.closeNodeSwap,
      commitNodeSwap: sessions.commitNodeSwap,
      isNodeSwapTarget: sessions.isNodeSwapTarget,
      openItemEditor: editor.openItemEditor,
      openItemEditors: editor.openItemEditors,
      closeItemEditor: editor.closeItemEditor,
      selectDirectoryNode: editor.selectDirectoryNode,
      setItemEditorAnchor: editor.setItemEditorAnchor,
      clearDirectorySelection: editor.clearDirectorySelection,
      updateNodePosition: positioning.updateNodePosition,
      resolveNodePosition: positioning.resolveNodePosition,
      toggleFolderExpanded: data.toggleFolderExpanded,
      createFolder: actions.createFolder,
      createNote: actions.createNote,
      createFlash: actions.createFlash,
      createChildItem: actions.createChildItem,
      createChildItemAndOpenEditor: actions.createChildItemAndOpenEditor,
      attachFileToItem: actions.attachFileToItem,
      attachMediaToItem: actions.attachMediaToItem,
      replaceItemFile: actions.replaceItemFile,
      replaceItemMedia: actions.replaceItemMedia,
      removeItemFile: actions.removeItemFile,
      renameItem: actions.renameItem,
      promoteNoteToFolder: actions.promoteNoteToFolder,
      recolorItem: actions.recolorItem,
      updateItemTags: actions.updateItemTags,
      updateNoteBody: actions.updateNoteBody,
      updateFlashContent: actions.updateFlashContent,
      moveItem: actions.moveItem,
      reorderSiblings: actions.reorderSiblings,
      deleteItem: actions.deleteItem,
      updateRecordName: actions.updateRecordName,
      updateRecordColor: actions.updateRecordColor,
      recordUpdatePending: mutations.recordUpdatePending,
      bringWindowToFront: data.bringWindowToFront,
      getWindowZIndex: data.getWindowZIndex,
      setWindowRect: data.setWindowRect,
      setActiveTab: data.setActiveTab,
      moveTabBetweenWindows: data.moveTabBetweenWindows,
      tearOutTab: data.tearOutTab,
      mergeWindows: data.mergeWindows,
      workspaceLayout: data.workspaceLayout,
      workspaceHydrated: data.workspaceHydrated && data.workspaceSettingsHydrated,
      configurationSettings: data.configurationSettings,
      configurationSettingsHydrated: data.configurationSettingsHydrated,
      autoOptimizeLayoutEnabled: data.autoOptimizeLayoutEnabled,
      nodeSphereRadius: data.nodeSphereRadius,
      originNodeRadius: data.originNodeRadius,
      persistentNodeModalsEnabled: data.persistentNodeModalsEnabled,
      itemEditorEnlargeEnabled: data.itemEditorEnlargeEnabled,
      updateConfigurationSetting: data.updateConfigurationSetting,
      setCamera: data.setCamera,
      workspaceCamera: data.workspaceState.camera,
      pinnedItemIds: data.pinnedItemIds,
      pinnedNodeIds: data.pinnedNodeIds,
      isNodePinned: data.isNodePinned,
      pinNode: actions.pinNode,
      unpinNode: actions.unpinNode,
      unpinAllNodes: actions.unpinAllNodes,
    }),
    [
      actions,
      data,
      editor,
      mutations.recordUpdatePending,
      positioning,
      preserveConstellationSelection,
      search,
      sessions,
    ],
  );

  return (
    <CoakRecordWorkspaceContext.Provider value={value}>
      {children}
    </CoakRecordWorkspaceContext.Provider>
  );
}

export function useCoakRecordWorkspace() {
  const context = useContext(CoakRecordWorkspaceContext);
  if (!context) {
    throw new Error("useCoakRecordWorkspace must be used within CoakRecordWorkspaceProvider");
  }
  return context;
}
