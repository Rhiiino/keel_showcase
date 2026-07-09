// keel_web/src/modules/projects/components/workspace/edges/WorkspaceEdgeLabelBackdrops.tsx

// Opaque label chips on edges (text + backdrop) so strokes do not show through.

import { EdgeLabelRenderer, type Edge, type Node } from "@xyflow/react";

import { getWorkspaceEdgeLabelPosition } from "../../../lib/workspace/edge";
import {
  edgeHasVisibleLabel,
  getEdgeLabelText,
  resolveLabelBounds,
} from "../../../lib/workspace/edge";
import { stripLegacyLabelAnchorNodes } from "../../../lib/workspace/edge";
import { useThemeSettings } from "../../../../settings/components/context";
import {
  useWorkspaceBeginLabelEdit,
  useWorkspaceConnectionStyle,
  useWorkspaceTextFontSizes,
} from "../context/WorkspaceCanvasContext";

type WorkspaceEdgeLabelBackdropsProps = {
  nodes: Node[];
  edges: Edge[];
  editingEdgeId: string | null;
};

export function WorkspaceEdgeLabelBackdrops({
  nodes,
  edges,
  editingEdgeId,
}: WorkspaceEdgeLabelBackdropsProps) {
  const { canvasBgColor } = useThemeSettings();
  const beginLabelEdit = useWorkspaceBeginLabelEdit();
  const connectionStyle = useWorkspaceConnectionStyle();
  const { labelPx } = useWorkspaceTextFontSizes();
  const contentNodes = stripLegacyLabelAnchorNodes(nodes);
  const nodesById = new Map(contentNodes.map((node) => [node.id, node] as const));

  const plates = edges
    .filter((edge) => edgeHasVisibleLabel(edge) && edge.id !== editingEdgeId)
    .map((edge) => {
      const position = getWorkspaceEdgeLabelPosition(
        edge,
        nodesById,
        edges,
        connectionStyle,
      );
      const bounds = resolveLabelBounds(edge);
      if (!position || !bounds) {
        return null;
      }

      return (
        <div
          key={`label-backdrop-${edge.id}`}
          className="nodrag nopan box-border flex items-center justify-center rounded border border-stone-700 px-1.5 py-0.5 text-center text-stone-200"
          style={{
            position: "absolute",
            transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
            width: bounds.width,
            height: bounds.height,
            fontSize: labelPx,
            backgroundColor: canvasBgColor,
            pointerEvents: "auto",
            cursor: "text",
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            beginLabelEdit(edge.id);
          }}
        >
          {getEdgeLabelText(edge)}
        </div>
      );
    })
    .filter((plate) => plate !== null);

  if (plates.length === 0) {
    return null;
  }

  return <EdgeLabelRenderer>{plates}</EdgeLabelRenderer>;
}
