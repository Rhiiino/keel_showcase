// src/modules/focus/components/constellation/canvas/FocusConstellationAnimationContext.tsx

// Provides expand / reveal animation state to constellation nodes and edges.

import { createContext, useContext, type ReactNode } from "react";

import {
  settledEdgeVisual,
  settledNodeVisual,
  type EdgeVisualState,
  type NodeVisualState,
} from "../../../lib/constellation/animation";

type FocusConstellationAnimationContextValue = {
  getNodeVisual: (nodeId: string) => NodeVisualState;
  getEdgeVisual: (edgeId: string) => EdgeVisualState;
  showOrbitHandle: boolean;
  activeOrbitHandleNodeId: string | null;
  onOrbitHandleDragStart: (nodeId: string, clientX: number, clientY: number) => void;
};

const noop = () => undefined;

const FocusConstellationAnimationContext =
  createContext<FocusConstellationAnimationContextValue>({
    getNodeVisual: () => settledNodeVisual(),
    getEdgeVisual: () => settledEdgeVisual(),
    showOrbitHandle: false,
    activeOrbitHandleNodeId: null,
    onOrbitHandleDragStart: noop,
  });

type FocusConstellationAnimationProviderProps = {
  value: FocusConstellationAnimationContextValue;
  children: ReactNode;
};

export function FocusConstellationAnimationProvider({
  value,
  children,
}: FocusConstellationAnimationProviderProps) {
  return (
    <FocusConstellationAnimationContext.Provider value={value}>
      {children}
    </FocusConstellationAnimationContext.Provider>
  );
}

export function useFocusConstellationAnimation() {
  return useContext(FocusConstellationAnimationContext);
}
