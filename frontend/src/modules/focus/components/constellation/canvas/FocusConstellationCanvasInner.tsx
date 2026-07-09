// src/modules/focus/components/constellation/canvas/FocusConstellationCanvasInner.tsx

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFocusConstellationCanvasDrag } from "../../../hooks/constellation/useFocusConstellationCanvasDrag";
import { useFocusConstellationCanvasEdges } from "../../../hooks/constellation/useFocusConstellationCanvasEdges";
import { useFocusConstellationCanvasInteraction } from "../../../hooks/constellation/useFocusConstellationCanvasInteraction";
import { useFocusConstellationCanvasNodes } from "../../../hooks/constellation/useFocusConstellationCanvasNodes";
import { useFocusConstellationCanvasOrbit } from "../../../hooks/constellation/useFocusConstellationCanvasOrbit";
import { useFocusConstellationCanvasRenderGraph } from "../../../hooks/constellation/useFocusConstellationCanvasRenderGraph";
import { useFocusConstellationCanvasViewport } from "../../../hooks/constellation/useFocusConstellationCanvasViewport";
import { useFocusConstellationNodeScreenCenter } from "../../../hooks/constellation/useFocusConstellationNodeScreenCenter";
import type { ManualOrbitState } from "../../../hooks/constellation/useFocusConstellationOrbitAnimation";
import { collectConstellationPathFromOrigin, buildScopedVisibleGraph } from "../../../lib/constellation/graph";
import { canConstellationUnlinkNode } from "../../../lib/constellation/interaction";
import { canOpenScopedConstellation } from "../../../lib/constellation/scope";
import { resolveFocusConstellationNodeSize } from "../../../lib/constellation/layout";
import { isFocusContainerKind } from "../../../lib/focus";
import { FocusConstellationAnimationProvider } from "./FocusConstellationAnimationContext";
import { FocusConstellationNodeHoverProvider } from "../node";
import { FocusReferenceInspectorInteractionProvider } from "../references";
import { FocusConstellationNodeNotesPreview } from "../node";
import { CANVAS_TONES } from "./FocusConstellationCanvas.constants";
import type { FocusConstellationCanvasProps } from "./FocusConstellationCanvas.types";
import { FocusConstellationCanvasFlow } from "./FocusConstellationCanvasFlow";
import { FocusConstellationCanvasStatus } from "./FocusConstellationCanvasStatus";
import { FocusConstellationNodeContextMenu } from "../contextMenu";
import { FocusConstellationPaneContextMenu } from "../contextMenu";
import type { FocusConstellationFlowNode } from "../node";

const EMPTY_HIGHLIGHTED_PATH_NODE_IDS: ReadonlySet<string> = new Set();
const EMPTY_AUTOMATION_HIGHLIGHTED_NODE_IDS: ReadonlySet<string> = new Set();



// ----- Canvas orchestrator
export function FocusConstellationCanvasInner({
  constellation,
  nodeShape,
  canvasTone,
  connectionColor,
  connectionStyle,
  listNodeStyle,
  labelFontKey,
  titleSizePx,
  nodeSizeMultiplier,
  unlinkDistanceMultiplier,
  onReparentNode,
  onDetachNode,
  onConnectStandaloneList,
  onDeleteNode,
  onCreateTask,
  onCreateLinkedList,
  onLinkExistingList,
  onAddRecord,
  addEntryPending = false,
  onViewNode,
  onOpenScopedConstellation,
  isConstellationScoped = false,
  scopeRootCanvasId = null,
  onPromoteNodeToList,
  onUpdateWorkOrder,
  onUpdateNodeStatus,
  onUpdateNodeTitle,
  onUpdateNodeColor,
  onUpdateNodeNotes,
  onUpdateNodeTags,
  onUpdateNodeShowReferenceContent,
  notesPanelPosition,
  onNotesPanelPositionChange,
  nodeInfoEnabled,
  onCreateStandaloneList,
  onLinkStandaloneList,
  standaloneAddPending = false,
  orbitPlaying = false,
  automationLocked = false,
  automationPanRequest = null,
  automationHighlightedNodeIds = EMPTY_AUTOMATION_HIGHLIGHTED_NODE_IDS,
  underlay,
  overlay,
  onNodeScreenCenterResolverReady,
  onAutomationHandlersReady,
}: FocusConstellationCanvasProps) {
  const nodeSize = resolveFocusConstellationNodeSize(nodeSizeMultiplier);
  const unlinkDistance = unlinkDistanceMultiplier * nodeSize;
  const previewTouchDistance = nodeSize * 1.05;
  const initialViewport = useMemo(() => constellation.viewport, [constellation.viewport]);
  const tone = CANVAS_TONES[canvasTone];

  const nodesRef = useRef<FocusConstellationFlowNode[]>([]);
  const nodesLockedRef = useRef(false);
  const manualOrbitRef = useRef<ManualOrbitState | null>(null);
  const suppressNodeClickRef = useRef(false);
  const referenceInspectorOpenRef = useRef(false);
  const skipExpandAnimationsRef = useRef<() => void>(() => {});
  const setNodesRef = useRef<React.Dispatch<React.SetStateAction<FocusConstellationFlowNode[]>>>(() => {});
  const commitPendingUnlinksRef = useRef<
    (edges: typeof constellation.edges, layoutNodes: typeof constellation.layoutNodes) => void
  >(() => {});
  const [isNodeDragging, setIsNodeDragging] = useState(false);

  const {
    indexes,
    edges,
    expandedIds,
    nodePositions,
    isLoading,
    isError,
    errorMessage,
    workOrderBadgeAngles,
    setWorkOrderBadgeAngle,
    isExpanded,
    canExpand,
    toggleExpanded,
    setNodePositionsBatch,
    preserveExpansionOnRelink,
    persistViewport,
  } = constellation;

  const {
    renderGraph,
    relationshipMutationPending,
    optimisticRelink,
    layoutNodesForRender,
    runRelationshipMutation,
    applyUnlinkPromotion,
  } = useFocusConstellationCanvasRenderGraph({
    constellation,
    nodesRef,
    indexes,
  });

  const interaction = useFocusConstellationCanvasInteraction({
    constellation,
    nodesLockedRef,
    manualOrbitRef,
    skipExpandAnimations: () => skipExpandAnimationsRef.current(),
    onCreateStandaloneList,
    onLinkStandaloneList,
    suppressNodeClickRef,
    referenceInspectorOpenRef,
    paneContextMenuDisabled: isConstellationScoped,
    automationLocked,
  });

  const {
    nodesLocked,
    animationValue,
    skipExpandAnimations,
    displayLayoutNodes,
    displayRenderGraph,
    alignChildrenAround,
    beginUnlink,
    cancelUnlinkForNode,
    commitPendingUnlinks,
    pendingUnlinkEdgeIds,
    unlinkCollapsingEdges,
  } = useFocusConstellationCanvasOrbit({
    renderGraph,
    layoutNodesForRender,
    expandedIds,
    graphEdges: edges,
    relationshipMutationPending,
    indexes,
    nodePositions,
    orbitPlaying,
    isNodeDragging,
    automationLocked,
    nodesRef,
    setNodes: (value) => setNodesRef.current(value),
    setNodePositionsBatch,
    closeAllContextMenus: interaction.closeAllContextMenus,
    suppressNodeClickRef,
    manualOrbitRef,
    applyUnlinkPromotion,
  });

  commitPendingUnlinksRef.current = commitPendingUnlinks;

  useEffect(() => {
    if (relationshipMutationPending) {
      return;
    }
    commitPendingUnlinksRef.current(constellation.edges, constellation.layoutNodes);
  }, [
    constellation.edges,
    constellation.layoutNodes,
    relationshipMutationPending,
  ]);

  nodesLockedRef.current = nodesLocked;
  skipExpandAnimationsRef.current = skipExpandAnimations;

  useEffect(() => {
    onAutomationHandlersReady?.({ alignChildrenAround });
  }, [alignChildrenAround, onAutomationHandlersReady]);

  const scopedGraphDisplay = useMemo(() => {
    if (!scopeRootCanvasId || !indexes) {
      return {
        layoutNodes: displayLayoutNodes,
        edges: displayRenderGraph.edges,
      };
    }

    const scoped = buildScopedVisibleGraph(
      scopeRootCanvasId,
      indexes,
      constellation.expandedIds,
    );
    if (!scoped) {
      return {
        layoutNodes: displayLayoutNodes,
        edges: displayRenderGraph.edges,
      };
    }

    const scopedNodeIds = scoped.nodesById;
    return {
      layoutNodes: displayLayoutNodes.filter((node) => scopedNodeIds.has(node.id)),
      edges: scoped.edges,
    };
  }, [
    constellation.expandedIds,
    displayLayoutNodes,
    displayRenderGraph.edges,
    indexes,
    scopeRootCanvasId,
  ]);

  const highlightedPath = useMemo(() => {
    if (interaction.selectedNodeIds.size !== 1) {
      return null;
    }
    const [targetNodeId] = interaction.selectedNodeIds;
    const path = collectConstellationPathFromOrigin(targetNodeId, displayLayoutNodes);
    if (path.orderedNodeIds.length === 0) {
      return null;
    }
    return path;
  }, [displayLayoutNodes, interaction.selectedNodeIds]);

  const { nodes, setNodes } = useFocusConstellationCanvasNodes({
    nodesRef,
    layoutNodesForRender: scopedGraphDisplay.layoutNodes,
    relationshipMutationPending,
    isNodeDragging,
    nodesLocked,
    automationLocked,
    nodeShape,
    listNodeStyle,
    labelFontKey,
    titleSizePx,
    nodeSize,
    selectedNodeIds: interaction.selectedNodeIds,
    highlightedPathNodeIds:
      highlightedPath?.nodeIds ?? EMPTY_HIGHLIGHTED_PATH_NODE_IDS,
    automationHighlightedNodeIds,
    workOrderBadgeAngles,
    setWorkOrderBadgeAngle,
    isExpanded,
    canExpand,
    toggleExpanded,
    onUpdateWorkOrder,
    handleSelectionPointerDown: interaction.handleSelectionPointerDown,
    scopeRootCanvasId,
  });

  setNodesRef.current = setNodes;

  useFocusConstellationNodeScreenCenter({
    nodesRef,
    onResolverReady: onNodeScreenCenterResolverReady,
  });

  const drag = useFocusConstellationCanvasDrag({
    nodesLockedRef,
    manualOrbitRef,
    nodesRef,
    setNodes,
    nodes,
    indexes,
    nodePositions,
    selectedNodeIdsRef: interaction.selectedNodeIdsRef,
    unlinkDistance,
    previewTouchDistance,
    runRelationshipMutation,
    setNodePositionsBatch,
    preserveExpansionOnRelink,
    onReparentNode,
    onDetachNode,
    onConnectStandaloneList,
    beginUnlink,
    cancelUnlinkForNode,
    onIsNodeDraggingChange: setIsNodeDragging,
  });

  const { flowEdges, onEdgesChange } = useFocusConstellationCanvasEdges({
    layoutNodesForRender: scopedGraphDisplay.layoutNodes,
    renderGraph: {
      ...displayRenderGraph,
      edges: scopedGraphDisplay.edges,
    },
    optimisticRelink,
    previewConnection: drag.previewConnection,
    pendingUnlinkEdgeIds,
    unlinkCollapsingEdges,
    nodeShape,
    connectionColor,
    connectionStyle,
    nodeSize,
    highlightedPathEdgePairs:
      highlightedPath && highlightedPath.orderedEdgePairs.length > 0
        ? highlightedPath.edgePairs
        : null,
  });

  const { containerRef, initializeCamera, onMoveEnd, resolvedInitialViewport, frameFocusNodeIds } =
    useFocusConstellationCanvasViewport({
      renderGraph,
      initialViewport,
      persistViewport,
      layoutNodesForRender: scopedGraphDisplay.layoutNodes,
    });

  const frameFocusNodeIdsRef = useRef(frameFocusNodeIds);
  frameFocusNodeIdsRef.current = frameFocusNodeIds;
  const lastHandledPanTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!automationLocked) {
      lastHandledPanTickRef.current = null;
      return;
    }
    if (!automationPanRequest || automationPanRequest.nodeIds.length === 0) {
      return;
    }
    if (lastHandledPanTickRef.current === automationPanRequest.tick) {
      return;
    }
    lastHandledPanTickRef.current = automationPanRequest.tick;
    frameFocusNodeIdsRef.current(automationPanRequest.nodeIds);
  }, [automationLocked, automationPanRequest]);

  useEffect(() => {
    if (!nodesLocked) {
      return;
    }
    interaction.closeAllContextMenus();
  }, [interaction.closeAllContextMenus, nodesLocked]);

  if (isLoading || isError || !indexes?.originList) {
    return (
      <FocusConstellationCanvasStatus
        canvasTone={canvasTone}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        hasOriginList={Boolean(indexes?.originList)}
      />
    );
  }

  return (
    <FocusReferenceInspectorInteractionProvider referenceInspectorOpenRef={referenceInspectorOpenRef}>
      <FocusConstellationNodeHoverProvider>
        <FocusConstellationAnimationProvider value={animationValue}>
        <div
          className="relative h-full min-h-0 flex-1 overflow-hidden"
          style={{ backgroundColor: tone.background }}
        >
          {underlay ? (
            <div className="pointer-events-none absolute inset-0 z-0">{underlay}</div>
          ) : null}

          <FocusConstellationCanvasFlow
          canvasTone={canvasTone}
          containerRef={containerRef}
          nodes={nodes}
          flowEdges={flowEdges}
          nodesLocked={nodesLocked}
          automationLocked={automationLocked}
          initialViewport={resolvedInitialViewport}
          onNodesChange={drag.onNodesChange}
          onNodeClick={interaction.onNodeClick}
          onNodeContextMenu={interaction.onNodeContextMenu}
          onPaneContextMenu={interaction.onPaneContextMenu}
          onPaneClick={interaction.onPaneClick}
          onMoveStart={interaction.closeAllContextMenus}
          onNodeDragStart={drag.onNodeDragStart}
          onNodeDrag={drag.onNodeDrag}
          onNodeDragStop={drag.onNodeDragStop}
          onEdgesChange={onEdgesChange}
          onInit={() => {
            requestAnimationFrame(() => {
              initializeCamera();
            });
          }}
          onMoveEnd={onMoveEnd}
        />

        {overlay ? (
          <div className="pointer-events-none absolute inset-0 z-10">
            {overlay}
          </div>
        ) : null}

        <FocusConstellationNodeNotesPreview
          enabled={nodeInfoEnabled}
          nodes={nodes}
          selectedNodeIds={interaction.selectedNodeIds}
          position={notesPanelPosition}
          onPositionChange={onNotesPanelPositionChange}
          onSaveNotes={onUpdateNodeNotes}
          onSaveWorkOrder={onUpdateWorkOrder}
          onSaveStatus={onUpdateNodeStatus}
          onSaveTitle={onUpdateNodeTitle}
          onSaveTags={onUpdateNodeTags}
          onSaveShowReferenceContent={onUpdateNodeShowReferenceContent}
        />

        <FocusConstellationNodeContextMenu
          menu={interaction.nodeContextMenu}
          onClose={interaction.closeNodeContextMenu}
          onShow={interaction.handleShowLineage}
          onCreateTask={onCreateTask}
          onCreateLinkedList={onCreateLinkedList}
          onLinkExistingList={onLinkExistingList}
          onAddRecord={onAddRecord}
          excludedLinkedListIds={interaction.contextMenuExcludedLinkedListIds}
          addPending={addEntryPending}
          onView={onViewNode}
          onOpenScopedConstellation={(node) => {
            onOpenScopedConstellation?.(node);
          }}
          onAlignChildren={(node) => {
            alignChildrenAround(node.id);
          }}
          onUnlink={(node) => {
            runRelationshipMutation(
              () => onDetachNode(node.data.entityId),
              undefined,
              {
                start: (completeAnimation) =>
                  beginUnlink(node, { onComplete: completeAnimation }),
              },
            );
          }}
          onPromoteToList={onPromoteNodeToList}
          onDelete={onDeleteNode}
          onStatusChange={(node, status) => {
            void onUpdateNodeStatus(node.data.entityId, status);
          }}
          onColorChange={(node, colorHex) => {
            void onUpdateNodeColor(node.data.entityId, colorHex);
          }}
          showStatus={
            interaction.nodeContextMenu ? !interaction.nodeContextMenu.node.data.isOrigin : false
          }
          showColor={
            interaction.nodeContextMenu
              ? !interaction.nodeContextMenu.node.data.isOrigin &&
                interaction.nodeContextMenu.node.data.nodeKind !== "item"
              : false
          }
          showLineage={
            interaction.nodeContextMenu
              ? isFocusContainerKind(interaction.nodeContextMenu.node.data.nodeKind)
              : false
          }
          showAlignChildren={
            interaction.nodeContextMenu
              ? scopedGraphDisplay.edges.filter(
                  (edge) => edge.source === interaction.nodeContextMenu?.node.id,
                ).length >= 2
              : false
          }
          showAdd={
            interaction.nodeContextMenu
              ? interaction.nodeContextMenu.node.data.targetContainerId !== null
              : false
          }
          showView={
            interaction.nodeContextMenu
              ? interaction.nodeContextMenu.node.data.nodeKind === "item" ||
                interaction.nodeContextMenu.node.data.targetContainerId !== null
              : false
          }
          showScopedConstellation={
            interaction.nodeContextMenu
              ? canOpenScopedConstellation(
                  interaction.nodeContextMenu.node.data.nodeKind,
                  interaction.nodeContextMenu.node.data.isOrigin,
                )
              : false
          }
          showUnlink={
            interaction.nodeContextMenu
              ? canConstellationUnlinkNode(
                  interaction.nodeContextMenu.node.data.nodeKind,
                  interaction.nodeContextMenu.node.data.parentId,
                  interaction.nodeContextMenu.node.data.isOrigin,
                )
              : false
          }
          showPromoteToList={
            interaction.nodeContextMenu
              ? interaction.nodeContextMenu.node.data.nodeKind === "item"
              : false
          }
          showDelete={
            interaction.nodeContextMenu ? !interaction.nodeContextMenu.node.data.isOrigin : false
          }
          canShow={
            interaction.nodeContextMenu
              ? interaction.nodeHasShowableLineage(interaction.nodeContextMenu.node.id)
              : false
          }
        />

        <FocusConstellationPaneContextMenu
          menu={interaction.paneContextMenu}
          onClose={interaction.closePaneContextMenu}
          linkableLists={interaction.paneContextMenuLinkableLists}
          pending={standaloneAddPending}
          onCreateStandaloneList={interaction.handlePaneCreateStandaloneList}
          onLinkStandaloneList={interaction.handlePaneLinkStandaloneList}
        />
        </div>
        </FocusConstellationAnimationProvider>
      </FocusConstellationNodeHoverProvider>
    </FocusReferenceInspectorInteractionProvider>
  );
}
