// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationNodeScreenCenter.ts

// Exposes a resolver that maps constellation node ids to screen-space centers.

import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, type MutableRefObject } from "react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import type { FocusConstellationModalOrigin } from "../../lib/constellation/modalOrigin";

export type FocusConstellationNodeScreenCenterResolver = (
  nodeId: string,
) => FocusConstellationModalOrigin | null;

export function useFocusConstellationNodeScreenCenter({
  nodesRef,
  onResolverReady,
}: {
  nodesRef: MutableRefObject<FocusConstellationFlowNode[]>;
  onResolverReady?: (resolver: FocusConstellationNodeScreenCenterResolver) => void;
}) {
  const { flowToScreenPosition } = useReactFlow();

  const resolveNodeScreenCenter = useCallback<FocusConstellationNodeScreenCenterResolver>(
    (nodeId) => {
      const node = nodesRef.current.find((candidate) => candidate.id === nodeId);
      if (!node) {
        return null;
      }

      return flowToScreenPosition({
        x: node.position.x,
        y: node.position.y,
      });
    },
    [flowToScreenPosition, nodesRef],
  );

  useEffect(() => {
    onResolverReady?.(resolveNodeScreenCenter);
  }, [onResolverReady, resolveNodeScreenCenter]);

  return resolveNodeScreenCenter;
}
