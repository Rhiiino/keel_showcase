// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNodeHandles.tsx

// Connection handles on workspace nodes. Visible when the card is selected (chrome
// shown), when the pointer is over the card, on connected sides, or while dragging a connection.
// Hidden when chrome is off.

import { Handle, Position, useConnection } from "@xyflow/react";

import {
  useWorkspaceNodeConnectedSides,
  type WorkspaceNodeSide,
} from "../../../hooks/useWorkspaceNodeConnectedSides";
import {
  shapeHandleAbsoluteStyle,
  WORKSPACE_SHAPE_PERIMETER_HANDLE_CLASS,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";

const SIDES: { id: WorkspaceNodeSide; position: Position }[] = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

const HANDLE_BASE_CLASS = [
  "!z-20 !h-12 !w-12 !min-w-0 !rounded-full !border-0 !bg-transparent",
  "!flex !items-center !justify-center",
  "[&::after]:content-[''] [&::after]:block",
  "[&::after]:rounded-full [&::after]:border [&::after]:border-stone-500",
  "[&::after]:bg-stone-400 [&::after]:transition",
].join(" ");

const HANDLE_VISIBLE_CLASS = [
  HANDLE_BASE_CLASS,
  "!pointer-events-auto",
  "[&::after]:h-4 [&::after]:w-4 [&::after]:opacity-80",
  "hover:[&::after]:opacity-100 hover:[&::after]:h-5 hover:[&::after]:w-5",
].join(" ");

const HANDLE_HINT_CLASS = [
  HANDLE_BASE_CLASS,
  "!pointer-events-none",
  "[&::after]:h-4 [&::after]:w-4 [&::after]:opacity-55",
].join(" ");

const HANDLE_INVISIBLE_CLASS = [
  HANDLE_BASE_CLASS,
  "!pointer-events-none opacity-0",
  "[&::after]:h-4 [&::after]:w-4 [&::after]:opacity-0",
].join(" ");

type WorkspaceNodeHandlesProps = {
  nodeId: string;
  selected: boolean;
  hideChrome: boolean;
  containerShape: WorkspaceContainerShape;
  width: number;
  height: number;
  hovered?: boolean;
  isConnectable?: boolean;
};

type HandleDisplay = "interactive" | "hint" | "hidden";

function resolveHandleDisplay(
  hideChrome: boolean,
  selected: boolean,
  connected: boolean,
  connecting: boolean,
  hovered: boolean,
): HandleDisplay {
  if (hideChrome) {
    return "hidden";
  }
  if (selected || connecting || hovered) {
    return "interactive";
  }
  if (connected) {
    return "hint";
  }
  return "hidden";
}

export function WorkspaceNodeHandles({
  nodeId,
  selected,
  hideChrome,
  containerShape,
  width,
  height,
  hovered = false,
  isConnectable = true,
}: WorkspaceNodeHandlesProps) {
  const connectedSides = useWorkspaceNodeConnectedSides(nodeId);
  const connecting = useConnection((state) => state.inProgress);
  const useShapeAnchors = containerShape !== "box" && width > 0 && height > 0;

  return (
    <>
      {SIDES.map((side) => {
        const connected = connectedSides.has(side.id);
        const display = resolveHandleDisplay(
          hideChrome,
          selected,
          connected,
          connecting,
          hovered,
        );
        const className =
          display === "interactive"
            ? HANDLE_VISIBLE_CLASS
            : display === "hint"
              ? HANDLE_HINT_CLASS
              : HANDLE_INVISIBLE_CLASS;
        const perimeterStyle = useShapeAnchors
          ? shapeHandleAbsoluteStyle(side.id, containerShape, width, height)
          : undefined;

        return (
          <Handle
            key={side.id}
            id={side.id}
            type="source"
            position={side.position}
            isConnectable={isConnectable}
            className={[
              className,
              perimeterStyle ? WORKSPACE_SHAPE_PERIMETER_HANDLE_CLASS : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={perimeterStyle}
          />
        );
      })}
    </>
  );
}
