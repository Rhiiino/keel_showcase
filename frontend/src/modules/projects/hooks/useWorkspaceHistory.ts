// stack_sandbox/frontend_web/src/modules/projects/hooks/useWorkspaceHistory.ts

// Undo/redo stack for workspace canvas nodes and edges.

import { useCallback, useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";

const MAX_HISTORY = 50;

export type WorkspaceCanvasSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

function cloneSnapshot(nodes: Node[], edges: Edge[]): WorkspaceCanvasSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function snapshotsEqual(a: WorkspaceCanvasSnapshot, b: WorkspaceCanvasSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useWorkspaceHistory(initialNodes: Node[], initialEdges: Edge[]) {
  const pastRef = useRef<WorkspaceCanvasSnapshot[]>([]);
  const futureRef = useRef<WorkspaceCanvasSnapshot[]>([]);
  const presentRef = useRef<WorkspaceCanvasSnapshot>(
    cloneSnapshot(initialNodes, initialEdges),
  );
  const isApplyingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const recordChange = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (isApplyingRef.current) {
        return;
      }

      const next = cloneSnapshot(nodes, edges);
      if (snapshotsEqual(presentRef.current, next)) {
        return;
      }

      pastRef.current.push(presentRef.current);
      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current.shift();
      }
      presentRef.current = next;
      futureRef.current = [];
      syncFlags();
    },
    [syncFlags],
  );

  const undo = useCallback((): WorkspaceCanvasSnapshot | null => {
    if (pastRef.current.length === 0) {
      return null;
    }

    futureRef.current.push(presentRef.current);
    presentRef.current = pastRef.current.pop()!;
    syncFlags();
    return cloneSnapshot(presentRef.current.nodes, presentRef.current.edges);
  }, [syncFlags]);

  const redo = useCallback((): WorkspaceCanvasSnapshot | null => {
    if (futureRef.current.length === 0) {
      return null;
    }

    pastRef.current.push(presentRef.current);
    presentRef.current = futureRef.current.pop()!;
    syncFlags();
    return cloneSnapshot(presentRef.current.nodes, presentRef.current.edges);
  }, [syncFlags]);

  const applySnapshot = useCallback((snapshot: WorkspaceCanvasSnapshot) => {
    isApplyingRef.current = true;
    presentRef.current = cloneSnapshot(snapshot.nodes, snapshot.edges);
    isApplyingRef.current = false;
  }, []);

  const resetTo = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      isApplyingRef.current = true;
      pastRef.current = [];
      futureRef.current = [];
      presentRef.current = cloneSnapshot(nodes, edges);
      isApplyingRef.current = false;
      syncFlags();
    },
    [syncFlags],
  );

  return {
    recordChange,
    undo,
    redo,
    applySnapshot,
    resetTo,
    canUndo,
    canRedo,
  };
}
