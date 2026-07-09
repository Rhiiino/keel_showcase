// src/modules/focus/components/constellation/node/FocusConstellationOrbitHandle.tsx

// Hover-revealed arc for manual subtree rotation around a parent node.

import { useState } from "react";

import type { FocusConstellationNodeShape } from "../../../lib/focus";
import { originOrbitHandleStrokePaths } from "../../../lib/constellation/originOrbitHandle";

type FocusConstellationOrbitHandleProps = {
  nodeSize: number;
  shape: FocusConstellationNodeShape;
  visible: boolean;
  dragging: boolean;
  onDragStart: (clientX: number, clientY: number) => void;
};

export function FocusConstellationOrbitHandle({
  nodeSize,
  shape,
  visible,
  dragging,
  onDragStart,
}: FocusConstellationOrbitHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const strokePaths = originOrbitHandleStrokePaths(shape, nodeSize);
  const highlighted = isHovered || dragging;

  if (!visible) {
    return null;
  }

  return (
    <svg
      className={[
        "focus-constellation-orbit-handle nopan nodrag",
        dragging ? "focus-constellation-orbit-handle--dragging" : "",
        highlighted ? "focus-constellation-orbit-handle--hovered" : "",
      ].join(" ")}
      viewBox={`0 0 ${nodeSize} ${nodeSize}`}
      width={nodeSize}
      height={nodeSize}
      aria-hidden
      onPointerDown={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onDragStart(event.clientX, event.clientY);
      }}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
      }}
    >
      {strokePaths.map((path, index) => (
        <path
          key={index}
          d={path}
          className="focus-constellation-orbit-handle__hit"
          fill="none"
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        />
      ))}
      {strokePaths.map((path, index) => (
        <path
          key={`stroke-${index}`}
          d={path}
          className="focus-constellation-orbit-handle__stroke"
          fill="none"
        />
      ))}
    </svg>
  );
}
