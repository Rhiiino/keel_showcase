// keel_web/src/modules/focus/hooks/useFocusConstellationNodeHoverZIndex.ts

import { useEffect, type RefObject } from "react";

export function useFocusConstellationNodeHoverZIndex(
  shellRef: RefObject<HTMLDivElement | null>,
  isNodeSurfaceHovered: boolean,
  isBadgeHovered: boolean,
): void {
  useEffect(() => {
    const flowNode = shellRef.current?.closest(".react-flow__node");
    if (!(flowNode instanceof HTMLElement)) {
      return;
    }

    flowNode.style.zIndex = isNodeSurfaceHovered || isBadgeHovered ? "1000" : "";
    return () => {
      flowNode.style.zIndex = "";
    };
  }, [isBadgeHovered, isNodeSurfaceHovered, shellRef]);
}
