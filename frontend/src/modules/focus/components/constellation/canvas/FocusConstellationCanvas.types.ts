// src/modules/focus/components/constellation/canvas/FocusConstellationCanvas.types.ts

import type { ReactNode } from "react";

import type { useFocusConstellation } from "../../../hooks/constellation/useFocusConstellation";
import type {
  FocusConstellationCanvasTone,
  FocusConstellationConfigPanelPosition,
  FocusConstellationConnectionColor,
  FocusConstellationConnectionStyle,
  FocusConstellationLabelFontKey,
  FocusConstellationListNodeStyle,
  FocusConstellationNodeShape,
  FocusNodeStatus,
} from "../../../lib/focus";
import type { ConstellationPoint } from "../../../lib/constellation/layout";
import type { FocusConstellationFlowNode } from "../node";

export type FocusConstellationCanvasProps = {
  constellation: ReturnType<typeof useFocusConstellation>;
  nodeShape: FocusConstellationNodeShape;
  canvasTone: FocusConstellationCanvasTone;
  connectionColor: FocusConstellationConnectionColor;
  connectionStyle: FocusConstellationConnectionStyle;
  listNodeStyle: FocusConstellationListNodeStyle;
  labelFontKey: FocusConstellationLabelFontKey;
  titleSizePx: number;
  nodeSizeMultiplier: number;
  unlinkDistanceMultiplier: number;
  onReparentNode: (nodeId: number, parentId: number) => Promise<void>;
  onDetachNode: (nodeId: number) => Promise<void>;
  onConnectStandaloneList: (
    listId: number,
    targetContainerId: number,
  ) => Promise<void>;
  onDeleteNode: (node: FocusConstellationFlowNode) => void;
  onCreateTask: (node: FocusConstellationFlowNode, title: string) => Promise<void>;
  onCreateLinkedList: (node: FocusConstellationFlowNode, title: string) => Promise<void>;
  onLinkExistingList: (
    node: FocusConstellationFlowNode,
    listId: number,
    title: string,
  ) => Promise<void>;
  onAddRecord: (node: FocusConstellationFlowNode) => void;
  addEntryPending?: boolean;
  onViewNode: (node: FocusConstellationFlowNode) => void;
  onOpenScopedConstellation?: (node: FocusConstellationFlowNode) => void;
  isConstellationScoped?: boolean;
  scopeRootCanvasId?: string | null;
  onPromoteNodeToList: (node: FocusConstellationFlowNode) => void;
  onUpdateWorkOrder: (nodeId: number, workOrder: number | null) => Promise<void>;
  onUpdateNodeStatus: (nodeId: number, status: FocusNodeStatus) => Promise<void>;
  onUpdateNodeTitle: (nodeId: number, title: string) => Promise<void>;
  onUpdateNodeColor: (nodeId: number, colorHex: string | null) => Promise<void>;
  onUpdateNodeNotes: (nodeId: number, notes: string) => Promise<void>;
  onUpdateNodeTags: (nodeId: number, tagIds: number[]) => Promise<void>;
  onUpdateNodeShowReferenceContent: (
    nodeId: number,
    showReferenceContent: boolean,
  ) => Promise<void>;
  notesPanelPosition: FocusConstellationConfigPanelPosition;
  onNotesPanelPositionChange: (position: FocusConstellationConfigPanelPosition) => void;
  nodeInfoEnabled: boolean;
  onCreateStandaloneList: (position: ConstellationPoint, title: string) => Promise<void>;
  onLinkStandaloneList: (position: ConstellationPoint, listId: number) => Promise<void>;
  standaloneAddPending?: boolean;
  orbitPlaying?: boolean;
  automationLocked?: boolean;
  automationPanRequest?: { nodeIds: number[]; tick: number } | null;
  automationHighlightedNodeIds?: ReadonlySet<string>;
  underlay?: ReactNode;
  overlay?: ReactNode;
  onNodeScreenCenterResolverReady?: (
    resolver: (nodeId: string) => { x: number; y: number } | null,
  ) => void;
  onAutomationHandlersReady?: (handlers: {
    alignChildrenAround: (canvasNodeId: string) => void;
  }) => void;
};

export type FocusConstellationDragSession = {
  nodeId: string;
  mode: "single" | "multi";
  startPosition: { x: number; y: number };
  lastPosition: { x: number; y: number };
  descendantIds: string[];
  descendantStartPositions: Map<string, { x: number; y: number }>;
  subtreeStartPositions?: Map<string, { x: number; y: number }>;
  selectedNodeIds: string[];
  selectedStartPositions: Map<string, { x: number; y: number }>;
  latchedTargetId: string | null;
  cancelled: boolean;
  detached: boolean;
  unlinkStarted: boolean;
};

export type FocusConstellationManualOrbitSession = {
  pivotNodeId: string;
  pivotPosition: { x: number; y: number };
  descendantIds: Set<string>;
  descendantStartPositions: Map<string, { x: number; y: number }>;
  startAngle: number;
  pointerStartAngle: number;
};

export type FocusConstellationRenderGraph = {
  layoutNodes: ReturnType<typeof useFocusConstellation>["layoutNodes"];
  edges: ReturnType<typeof useFocusConstellation>["edges"];
  expandedIds: ReturnType<typeof useFocusConstellation>["expandedIds"];
};

export type FocusConstellationOptimisticRelink = {
  draggedNodeId: string;
  newSourceId: string;
  oldSourceId: string | null;
};
