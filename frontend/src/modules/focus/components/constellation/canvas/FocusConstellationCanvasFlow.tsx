// src/modules/focus/components/constellation/canvas/FocusConstellationCanvasFlow.tsx

import { Background, BackgroundVariant, ReactFlow, type Edge, type EdgeChange, type NodeChange, type OnNodeDrag } from "@xyflow/react";

import type { FocusConstellationFlowNode } from "../node";
import { CANVAS_TONES, edgeTypes, nodeTypes } from "./FocusConstellationCanvas.constants";
import type { FocusConstellationCanvasProps } from "./FocusConstellationCanvas.types";

type FocusConstellationCanvasFlowProps = {
  canvasTone: FocusConstellationCanvasProps["canvasTone"];
  containerRef: React.RefObject<HTMLDivElement>;
  nodes: FocusConstellationFlowNode[];
  flowEdges: Edge[];
  nodesLocked: boolean;
  automationLocked?: boolean;
  initialViewport: { x: number; y: number; zoom: number };
  onNodesChange: (changes: NodeChange<FocusConstellationFlowNode>[]) => void;
  onNodeClick: (event: React.MouseEvent, node: FocusConstellationFlowNode) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: FocusConstellationFlowNode) => void;
  onPaneContextMenu: (event: MouseEvent | React.MouseEvent) => void;
  onPaneClick: (event: React.MouseEvent) => void;
  onMoveStart: () => void;
  onNodeDragStart: OnNodeDrag<FocusConstellationFlowNode>;
  onNodeDrag: OnNodeDrag<FocusConstellationFlowNode>;
  onNodeDragStop: OnNodeDrag<FocusConstellationFlowNode>;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onInit: () => void;
  onMoveEnd: (event: unknown, viewport: { x: number; y: number; zoom: number }) => void;
};

export function FocusConstellationCanvasFlow({
  canvasTone,
  containerRef,
  nodes,
  flowEdges,
  nodesLocked,
  automationLocked = false,
  initialViewport,
  onNodesChange,
  onNodeClick,
  onNodeContextMenu,
  onPaneContextMenu,
  onPaneClick,
  onMoveStart,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onEdgesChange,
  onInit,
  onMoveEnd,
}: FocusConstellationCanvasFlowProps) {
  const tone = CANVAS_TONES[canvasTone];

  return (
    <div ref={containerRef} className="absolute inset-0 z-[1]">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onMoveStart={onMoveStart}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        panOnDrag
        panOnScroll={false}
        zoomOnScroll={!automationLocked}
        zoomOnPinch={!automationLocked}
        zoomOnDoubleClick={false}
        nodesDraggable={!nodesLocked}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        selectionKeyCode={null}
        nodeOrigin={[0.5, 0.5]}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={initialViewport}
        onInit={onInit}
        onMoveEnd={onMoveEnd}
        proOptions={{ hideAttribution: true }}
        className="focus-constellation-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={tone.dotGap}
          size={tone.dotSize}
          color={tone.dots}
        />
      </ReactFlow>
    </div>
  );
}
