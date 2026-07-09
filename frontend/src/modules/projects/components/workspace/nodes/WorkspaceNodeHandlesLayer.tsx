// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNodeHandlesLayer.tsx

// Connection handles rendered above node drag surfaces so edge proximity affordances stay draggable.

import type { WorkspaceContainerShape } from "../../../lib/workspace/node";
import type { WorkspaceNodeMeasuredSize } from "./WorkspaceNodeContainer";
import { WorkspaceNodeHandles } from "./WorkspaceNodeHandles";

type WorkspaceNodeHandlesLayerProps = {
  nodeId: string;
  selected: boolean;
  hideChrome: boolean;
  containerShape: WorkspaceContainerShape;
  nodeSize: WorkspaceNodeMeasuredSize;
  hovered: boolean;
  isConnectable?: boolean;
};

export function WorkspaceNodeHandlesLayer({
  nodeId,
  selected,
  hideChrome,
  containerShape,
  nodeSize,
  hovered,
  isConnectable,
}: WorkspaceNodeHandlesLayerProps) {
  if (nodeSize.width <= 0 || nodeSize.height <= 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-visible">
      <WorkspaceNodeHandles
        nodeId={nodeId}
        selected={selected}
        hideChrome={hideChrome}
        containerShape={containerShape}
        width={nodeSize.width}
        height={nodeSize.height}
        hovered={hovered}
        isConnectable={isConnectable}
      />
    </div>
  );
}
