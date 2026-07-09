// stack_sandbox/frontend_web/src/modules/projects/hooks/useWorkspaceNodeConnectedSides.ts

// Which sides of a workspace node have at least one connected edge.

import { useNodeConnections } from "@xyflow/react";
import { useMemo } from "react";

export type WorkspaceNodeSide = "top" | "right" | "bottom" | "left";

const VALID_SIDES = new Set<string>(["top", "right", "bottom", "left"]);

function normalizeHandleSide(handleId: string | null): WorkspaceNodeSide | null {
  if (!handleId) {
    return null;
  }
  const base = handleId.replace(/-target$/, "");
  if (VALID_SIDES.has(base)) {
    return base as WorkspaceNodeSide;
  }
  if (VALID_SIDES.has(handleId)) {
    return handleId as WorkspaceNodeSide;
  }
  return null;
}

export function useWorkspaceNodeConnectedSides(nodeId: string): Set<WorkspaceNodeSide> {
  const connections = useNodeConnections({ id: nodeId });

  return useMemo(() => {
    const sides = new Set<WorkspaceNodeSide>();

    for (const connection of connections) {
      if (connection.source === nodeId) {
        const side = normalizeHandleSide(connection.sourceHandle);
        if (side) {
          sides.add(side);
        }
      }
      if (connection.target === nodeId) {
        const side = normalizeHandleSide(connection.targetHandle);
        if (side) {
          sides.add(side);
        }
      }
    }

    return sides;
  }, [connections, nodeId]);
}
