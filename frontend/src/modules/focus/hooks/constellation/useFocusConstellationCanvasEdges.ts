// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasEdges.ts

import { type Edge, type EdgeChange } from "@xyflow/react";
import { useCallback, useMemo } from "react";

import type {
  FocusConstellationOptimisticRelink,
  FocusConstellationRenderGraph,
} from "../../components/constellation/canvas";
import type {
  FocusConstellationConnectionColor,
  FocusConstellationConnectionStyle,
  FocusConstellationNodeShape,
} from "../../lib/focus";
import { constellationEdgePairKey } from "../../lib/constellation/graph";
import type { ConstellationLayoutNode } from "../../lib/constellation/graph";



// ----- Flow edges
export function useFocusConstellationCanvasEdges({
  layoutNodesForRender,
  renderGraph,
  optimisticRelink,
  previewConnection,
  pendingUnlinkEdgeIds,
  unlinkCollapsingEdges,
  nodeShape,
  connectionColor,
  connectionStyle,
  nodeSize,
  highlightedPathEdgePairs,
}: {
  layoutNodesForRender: ConstellationLayoutNode[];
  renderGraph: FocusConstellationRenderGraph;
  optimisticRelink: FocusConstellationOptimisticRelink | null;
  previewConnection: { source: string; target: string } | null;
  pendingUnlinkEdgeIds: ReadonlySet<string>;
  unlinkCollapsingEdges: readonly { id: string; source: string; target: string }[];
  nodeShape: FocusConstellationNodeShape;
  connectionColor: FocusConstellationConnectionColor;
  connectionStyle: FocusConstellationConnectionStyle;
  nodeSize: number;
  highlightedPathEdgePairs: ReadonlySet<string> | null;
}) {
  const computedFlowEdges = useMemo<Edge[]>(() => {
    const hasActivePathHighlight = highlightedPathEdgePairs !== null;
    // Endpoint positions here are only fallbacks used when React Flow's internal
    // node is briefly missing; the edge reads live positions via useInternalNode.
    // Deliberately not keyed off the live `nodes` array so the edge set stays
    // referentially stable during drag (edges follow nodes via the store).
    const positionsById = new Map(
      layoutNodesForRender.map((node) => [node.id, node.position] as const),
    );

    const draggedNodeId = previewConnection?.target ?? null;

    let graphEdges = renderGraph.edges.filter(
      (edge) => !pendingUnlinkEdgeIds.has(edge.id),
    );
    for (const edge of unlinkCollapsingEdges) {
      if (!graphEdges.some((candidate) => candidate.id === edge.id)) {
        graphEdges.push(edge);
      }
    }

    if (optimisticRelink) {
      graphEdges = graphEdges.filter(
        (edge) =>
          !(
            optimisticRelink.oldSourceId &&
            edge.source === optimisticRelink.oldSourceId &&
            edge.target === optimisticRelink.draggedNodeId
          ),
      );
      const hasOptimisticEdge = graphEdges.some(
        (edge) =>
          edge.source === optimisticRelink.newSourceId &&
          edge.target === optimisticRelink.draggedNodeId,
      );
      if (!hasOptimisticEdge) {
        graphEdges = [
          ...graphEdges,
          {
            id: `optimistic:${optimisticRelink.newSourceId}->${optimisticRelink.draggedNodeId}`,
            source: optimisticRelink.newSourceId,
            target: optimisticRelink.draggedNodeId,
          },
        ];
      }
    }

    const visibleEdges: Edge[] = graphEdges
      .filter((edge) => edge.target !== draggedNodeId)
      .map((edge) => {
        const sourcePosition = positionsById.get(edge.source);
        const targetPosition = positionsById.get(edge.target);
        const edgePairKey = constellationEdgePairKey(edge.source, edge.target);
        const isPathHighlighted = highlightedPathEdgePairs?.has(edgePairKey) ?? false;

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "focusConstellation",
          data: {
            shape: nodeShape,
            sourcePosition,
            targetPosition,
            connectionColor,
            connectionStyle,
            nodeSize,
            isPathHighlighted,
            isPathDimmed: hasActivePathHighlight && !isPathHighlighted,
          },
          animated: false,
        };
      });

    if (previewConnection) {
      visibleEdges.push({
        id: `preview:${previewConnection.source}->${previewConnection.target}`,
        source: previewConnection.source,
        target: previewConnection.target,
        type: "focusConstellation",
        data: { shape: nodeShape, connectionColor, connectionStyle, nodeSize, isPreview: true },
        animated: false,
      });
    }

    return visibleEdges;
  }, [
    connectionColor,
    connectionStyle,
    highlightedPathEdgePairs,
    layoutNodesForRender,
    nodeShape,
    nodeSize,
    optimisticRelink,
    pendingUnlinkEdgeIds,
    previewConnection,
    renderGraph.edges,
    unlinkCollapsingEdges,
  ]);

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Edges are fully derived from the constellation graph. React Flow can emit
    // transient remove events before newly revealed nodes are measured; applying
    // those changes would drop connections until a full refresh.
  }, []);

  return { flowEdges: computedFlowEdges, onEdgesChange };
}
