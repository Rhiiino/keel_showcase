// src/modules/focus/components/constellation/node/FocusConstellationNodeHoverContext.tsx

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { FocusTag } from "../../../api";
import type { FocusNodeStatus } from "../../../lib/focus";



export type FocusConstellationHoveredNodeInfo = {
  title: string;
  notes: string;
  status: FocusNodeStatus;
  workOrder: number | null;
  tags: FocusTag[];
  timerNodeId: number;
  referenceTargetType: string | null;
  referenceTargetId: string | null;
  referenceIsMissing: boolean;
};

type FocusConstellationNodeHoverContextValue = {
  hoveredNodeInfo: FocusConstellationHoveredNodeInfo | null;
  reportNodeHover: (nodeId: string, payload: FocusConstellationHoveredNodeInfo | null) => void;
};

const FocusConstellationNodeHoverContext =
  createContext<FocusConstellationNodeHoverContextValue | null>(null);



export function FocusConstellationNodeHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredNodeInfo, setHoveredNodeInfo] =
    useState<FocusConstellationHoveredNodeInfo | null>(null);
  const activeNodeIdRef = useRef<string | null>(null);

  const reportNodeHover = useCallback(
    (nodeId: string, payload: FocusConstellationHoveredNodeInfo | null) => {
      if (payload === null) {
        if (activeNodeIdRef.current !== nodeId) {
          return;
        }
        activeNodeIdRef.current = null;
        setHoveredNodeInfo(null);
        return;
      }

      activeNodeIdRef.current = nodeId;
      setHoveredNodeInfo(payload);
    },
    [],
  );

  const value = useMemo(
    () => ({ hoveredNodeInfo, reportNodeHover }),
    [hoveredNodeInfo, reportNodeHover],
  );

  return (
    <FocusConstellationNodeHoverContext.Provider value={value}>
      {children}
    </FocusConstellationNodeHoverContext.Provider>
  );
}



export function useFocusConstellationNodeHover() {
  const context = useContext(FocusConstellationNodeHoverContext);
  if (!context) {
    throw new Error(
      "useFocusConstellationNodeHover must be used within FocusConstellationNodeHoverProvider",
    );
  }
  return context;
}
