// keel_web/src/modules/coak/components/modals/CoakConstellationItemEditorOverlay.tsx

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { CoakConstellationItemEditorFrame } from "./CoakConstellationItemEditorFrame";

export function CoakConstellationItemEditorOverlay() {
  const {
    itemEditorNodeIds,
    itemEditorAnchors,
    graphNodes,
    persistentNodeModalsEnabled,
    isNodePinned,
  } = useCoakRecordWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousNodeIdsRef = useRef<string[]>([]);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [dismissingNodeIds, setDismissingNodeIds] = useState<string[]>([]);

  const activeEditorNodeIds = useMemo(() => {
    const candidateIds = persistentNodeModalsEnabled
      ? graphNodes.map((node) => node.id)
      : itemEditorNodeIds;
    const floatingEditorIds = new Set(itemEditorNodeIds);
    return candidateIds.filter(
      (nodeId) => !isNodePinned(nodeId) || floatingEditorIds.has(nodeId),
    );
  }, [graphNodes, isNodePinned, itemEditorNodeIds, persistentNodeModalsEnabled]);

  useEffect(() => {
    const previousNodeIds = previousNodeIdsRef.current;
    const removedNodeIds = previousNodeIds.filter(
      (nodeId) => !activeEditorNodeIds.includes(nodeId),
    );

    if (removedNodeIds.length > 0) {
      setDismissingNodeIds((current) => [...new Set([...current, ...removedNodeIds])]);
    }

    previousNodeIdsRef.current = activeEditorNodeIds;
  }, [activeEditorNodeIds]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setBounds({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const visibleNodeIds = useMemo(
    () => [...new Set([...activeEditorNodeIds, ...dismissingNodeIds])],
    [activeEditorNodeIds, dismissingNodeIds],
  );

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[500]">
      {visibleNodeIds.map((nodeId) => (
        <CoakConstellationItemEditorFrame
          key={nodeId}
          nodeId={nodeId}
          anchor={itemEditorAnchors[nodeId] ?? null}
          open={activeEditorNodeIds.includes(nodeId)}
          bounds={bounds}
          onExitComplete={() => {
            setDismissingNodeIds((current) => current.filter((id) => id !== nodeId));
          }}
        />
      ))}
    </div>
  );
}
