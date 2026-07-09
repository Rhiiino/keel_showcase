// keel_web/src/modules/coak/context/coakWorkspaceTypes.ts

import type { MediaObject } from "../../media/api";
import type {
  CoakCameraState,
  CoakItem,
  CoakPanelRect,
  CoakRecord,
  CoakTag,
  CoakWorkspaceTabId,
} from "../api";
import type { CoakItemEditorAnchor } from "../lib/tabs/constellation/coakItemEditorAnchor";
import type { CoakItemEditorNodeDragRequest } from "../lib/tabs/constellation/coakItemEditorDrag";
import type { CoakOptimizeLayoutMode } from "../lib/tabs/constellation/coakNodeLayout";
import type { CoakWorldAxis } from "../lib/tabs/constellation/coakNodePosition";
import type { CoakTreeNode } from "../lib/tabs/directory/coakTree";
import type { CoakWorkspaceLayout } from "../lib/panels/coakWindowLayout";

export type CoakGraphNode = {
  id: string;
  itemId: number | null;
  label: string;
  color: string;
  parentNodeId: string;
  position: [number, number, number];
  kind: CoakItem["kind"];
  tags: CoakTag[];
};

export type CoakConstellationOrbitRequest = {
  nodeId: string;
  token: number;
};

export type CoakGraphNodeContextMenuState = {
  nodeId: string;
  clientX: number;
  clientY: number;
};

export type CoakGraphCanvasContextMenuState = {
  clientX: number;
  clientY: number;
};

export type CoakChildRevolveSession = {
  parentNodeId: string;
  pivot: [number, number, number];
  railRadius: number;
  targetItemIds: number[];
};

export type CoakNodeRevolveSession = {
  nodeId: string;
  sourceItemId: number;
  pivot: [number, number, number];
  rotationAxis: [number, number, number];
  targetItemIds: number[];
  baselinePositions: Map<number, [number, number, number]>;
};

export type CoakNodeMoveSession = {
  sourceNodeId: string;
  sourceItemId: number;
  validTargetNodeIds: Set<string>;
};

export type CoakNodeSwapSession = {
  sourceNodeId: string;
  sourceItemId: number;
  validTargetNodeIds: Set<string>;
};

export const COAK_ORIGIN_POSITION: [number, number, number] = [0, 0, 0];

export type CoakRecordWorkspaceContextValue = {
  recordId: number;
  record: CoakRecord | undefined;
  items: CoakItem[];
  tree: CoakTreeNode[];
  graphNodes: CoakGraphNode[];
  expandedFolderIds: number[];
  isLoading: boolean;
  selectedNodeId: string | null;
  directorySearchQuery: string;
  directorySearchMatchIds: string[];
  constellationSearchQuery: string;
  constellationSearchMatchIds: string[];
  constellationSearchMatchIndex: number;
  isDirectorySearchActive: boolean;
  isConstellationSearchActive: boolean;
  isNodeSearchActive: boolean;
  preserveConstellationSelection: boolean;
  setDirectorySearchQuery: (query: string) => void;
  setConstellationSearchQuery: (query: string) => void;
  cycleConstellationSearchMatch: (direction: -1 | 1) => void;
  itemEditorNodeIds: string[];
  itemEditorAnchors: Record<string, CoakItemEditorAnchor>;
  itemEditorNodeDragRequest: CoakItemEditorNodeDragRequest | null;
  constellationNodeDragActive: boolean;
  setConstellationNodeDragActive: (active: boolean) => void;
  beginItemEditorNodeDrag: (request: Omit<CoakItemEditorNodeDragRequest, "token">) => void;
  clearItemEditorNodeDragRequest: () => void;
  constellationOrbitRequest: CoakConstellationOrbitRequest | null;
  cancelConstellationOrbit: () => void;
  graphNodeContextMenu: CoakGraphNodeContextMenuState | null;
  openGraphNodeContextMenu: (nodeId: string, clientX: number, clientY: number) => void;
  closeGraphNodeContextMenu: () => void;
  graphCanvasContextMenu: CoakGraphCanvasContextMenuState | null;
  openGraphCanvasContextMenu: (clientX: number, clientY: number) => void;
  closeGraphCanvasContextMenu: () => void;
  optimizeNodeChildren: (nodeId: string, layoutMode?: CoakOptimizeLayoutMode) => void;
  revealNodeChildren: (nodeId: string) => void;
  revealNodeLineage: (nodeId: string) => void;
  minimizeNodeChildren: (nodeId: string) => void;
  childRevolveSession: CoakChildRevolveSession | null;
  childRevolveDragActive: boolean;
  setChildRevolveDragActive: (active: boolean) => void;
  beginChildRevolve: (nodeId: string) => void;
  closeChildRevolve: () => void;
  applyChildRevolveRotation: (axis: CoakWorldAxis, deltaAngle: number) => void;
  nodeRevolveSession: CoakNodeRevolveSession | null;
  beginNodeRevolve: (nodeId: string) => void;
  closeNodeRevolve: () => void;
  applyNodeRevolveRotation: (deltaAngle: number) => void;
  nodeMoveSession: CoakNodeMoveSession | null;
  beginNodeMove: (nodeId: string) => void;
  closeNodeMove: () => void;
  commitNodeMove: (targetNodeId: string) => Promise<void>;
  isNodeMoveTarget: (nodeId: string) => boolean;
  nodeSwapSession: CoakNodeSwapSession | null;
  beginNodeSwap: (nodeId: string) => void;
  closeNodeSwap: () => void;
  commitNodeSwap: (targetNodeId: string) => Promise<void>;
  isNodeSwapTarget: (nodeId: string) => boolean;
  itemEditorTitleFocusNodeId: string | null;
  clearItemEditorTitleFocus: () => void;
  openItemEditor: (
    nodeId: string,
    options?: { orbit?: boolean; replace?: boolean; focusTitle?: boolean },
  ) => void;
  openItemEditors: (
    nodeIds: string[],
    options?: {
      orbit?: boolean;
      focusTitle?: boolean;
      expandAncestors?: boolean;
      allowPinnedFloating?: boolean;
    },
  ) => void;
  closeItemEditor: () => void;
  selectDirectoryNode: (nodeId: string) => void;
  setItemEditorAnchor: (nodeId: string, anchor: CoakItemEditorAnchor | null) => void;
  clearDirectorySelection: () => void;
  updateNodePosition: (nodeId: string, position: [number, number, number]) => void;
  resolveNodePosition: (nodeId: string) => [number, number, number];
  toggleFolderExpanded: (folderId: number) => void;
  createFolder: (name: string, parentId?: number | null) => Promise<void>;
  createNote: (name: string, parentId?: number | null) => Promise<void>;
  createFlash: (name: string, parentId?: number | null) => Promise<void>;
  createChildItem: (
    kind: "folder" | "note" | "flash",
    parentId: number,
  ) => Promise<CoakItem>;
  createChildItemAndOpenEditor: (
    kind: "folder" | "note" | "flash",
    parentId: number | null,
    options?: { focusTitle?: boolean; orbit?: boolean },
  ) => Promise<void>;
  attachFileToItem: (itemId: number, file: File) => Promise<void>;
  attachMediaToItem: (itemId: number, media: MediaObject) => Promise<void>;
  replaceItemFile: (itemId: number, file: File) => Promise<void>;
  replaceItemMedia: (itemId: number, media: MediaObject) => Promise<void>;
  removeItemFile: (itemId: number) => Promise<void>;
  renameItem: (itemId: number, name: string) => Promise<void>;
  promoteNoteToFolder: (itemId: number) => Promise<void>;
  recolorItem: (itemId: number, colorHex: string) => Promise<void>;
  updateItemTags: (itemId: number, tagIds: number[]) => Promise<void>;
  updateNoteBody: (itemId: number, noteBody: string) => Promise<void>;
  updateFlashContent: (
    itemId: number,
    content: { flash_front?: string; flash_back?: string },
  ) => Promise<void>;
  moveItem: (itemId: number, parentId: number | null, sortOrder?: number) => Promise<void>;
  reorderSiblings: (
    parentId: number | null,
    draggedId: number,
    insertIndex: number,
  ) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
  updateRecordName: (name: string) => Promise<void>;
  updateRecordColor: (colorHex: string) => Promise<void>;
  recordUpdatePending: boolean;
  bringWindowToFront: (windowId: string) => void;
  getWindowZIndex: (windowId: string) => number;
  setWindowRect: (windowId: string, rect: CoakPanelRect) => void;
  setActiveTab: (windowId: string, tabId: CoakWorkspaceTabId) => void;
  moveTabBetweenWindows: (
    tabId: CoakWorkspaceTabId,
    sourceWindowId: string,
    targetWindowId: string,
    targetIndex: number,
  ) => void;
  tearOutTab: (tabId: CoakWorkspaceTabId, sourceWindowId: string, rect: CoakPanelRect) => void;
  mergeWindows: (sourceWindowId: string, targetWindowId: string) => void;
  workspaceLayout: CoakWorkspaceLayout;
  workspaceHydrated: boolean;
  configurationSettings: Record<string, unknown>;
  configurationSettingsHydrated: boolean;
  autoOptimizeLayoutEnabled: boolean;
  nodeSphereRadius: number;
  originNodeRadius: number;
  persistentNodeModalsEnabled: boolean;
  itemEditorEnlargeEnabled: boolean;
  updateConfigurationSetting: (key: string, value: unknown) => void;
  setCamera: (camera: CoakCameraState | null) => void;
  workspaceCamera: CoakCameraState | null;
  pinnedItemIds: number[];
  pinnedNodeIds: string[];
  isNodePinned: (nodeId: string) => boolean;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  unpinAllNodes: () => void;
};
