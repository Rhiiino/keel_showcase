// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasRenderGraph.ts

import { useCallback, useLayoutEffect, useState, type MutableRefObject } from "react";

import type {
  FocusConstellationOptimisticRelink,
  FocusConstellationRenderGraph,
} from "../../components/constellation/canvas";
import type { ConstellationGraphIndexes } from "../../lib/constellation/graph";
import {
  applyLivePositionsToLayoutNodes,
  promoteUnlinkInLayoutNodes,
  type PendingUnlinkLayoutPromotion,
} from "../../lib/constellation/interaction";
import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import type { useFocusConstellation } from "./useFocusConstellation";

type RelationshipMutationAnimation = {
  start: (completeAnimation: () => void) => boolean;
};



// ----- Render graph snapshot
export function useFocusConstellationCanvasRenderGraph({
  constellation,
  nodesRef,
  indexes,
}: {
  constellation: ReturnType<typeof useFocusConstellation>;
  nodesRef: MutableRefObject<FocusConstellationFlowNode[]>;
  indexes: ConstellationGraphIndexes | null;
}) {
  const { layoutNodes, edges } = constellation;
  const [relationshipMutationPending, setRelationshipMutationPending] = useState(false);
  const [optimisticRelink, setOptimisticRelink] =
    useState<FocusConstellationOptimisticRelink | null>(null);
  const [renderGraph, setRenderGraph] = useState<FocusConstellationRenderGraph>(() => ({
    layoutNodes,
    edges,
    expandedIds: constellation.expandedIds,
  }));

  // Sync before paint so expand/collapse waves start on the same frame new nodes mount.
  useLayoutEffect(() => {
    if (relationshipMutationPending) {
      setRenderGraph((current) => ({
        ...current,
        expandedIds: constellation.expandedIds,
      }));
      return;
    }
    setRenderGraph({
      layoutNodes,
      edges,
      expandedIds: constellation.expandedIds,
    });
  }, [constellation.expandedIds, edges, layoutNodes, relationshipMutationPending]);

  const layoutNodesForRender = relationshipMutationPending
    ? renderGraph.layoutNodes
    : layoutNodes;

  const applyUnlinkPromotion = useCallback(
    (pending: PendingUnlinkLayoutPromotion) => {
      if (!indexes) {
        return;
      }

      setRenderGraph((current) => ({
        expandedIds: current.expandedIds,
        edges: current.edges.filter((edge) => edge.id !== pending.edgeId),
        layoutNodes: promoteUnlinkInLayoutNodes(
          applyLivePositionsToLayoutNodes(current.layoutNodes, nodesRef.current),
          pending,
          indexes,
          nodesRef.current,
        ),
      }));
    },
    [indexes, nodesRef],
  );

  const runRelationshipMutation = useCallback(
    (
      operation: () => Promise<void>,
      relink?: FocusConstellationOptimisticRelink,
      animation?: RelationshipMutationAnimation,
    ) => {
      setRenderGraph((current) => ({
        ...current,
        layoutNodes: applyLivePositionsToLayoutNodes(
          current.layoutNodes,
          nodesRef.current,
        ),
      }));
      setOptimisticRelink(relink ?? null);
      setRelationshipMutationPending(true);

      let mutationComplete = false;
      let animationComplete = animation === undefined;

      const finalize = () => {
        if (!mutationComplete || !animationComplete) {
          return;
        }
        setRelationshipMutationPending(false);
        setOptimisticRelink(null);
      };

      if (animation) {
        const started = animation.start(() => {
          animationComplete = true;
          finalize();
        });
        if (!started) {
          animationComplete = true;
        }
      }

      void operation().finally(() => {
        mutationComplete = true;
        finalize();
      });
    },
    [nodesRef],
  );

  return {
    renderGraph,
    relationshipMutationPending,
    optimisticRelink,
    layoutNodesForRender,
    runRelationshipMutation,
    applyUnlinkPromotion,
  };
}
