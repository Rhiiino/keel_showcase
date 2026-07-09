// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasNodes.ts

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import { positionKeyForNode, targetContainerIdForNode } from "../../lib/constellation/graph";
import { constellationFocusNodeKind } from "../../lib/constellation/interaction";
import type { ConstellationLayoutNode } from "../../lib/constellation/graph";
import type {
  FocusConstellationLabelFontKey,
  FocusConstellationListNodeStyle,
  FocusConstellationNodeShape,
} from "../../lib/focus";
import type { useFocusConstellation } from "./useFocusConstellation";

const EMPTY_AUTOMATION_HIGHLIGHTED_NODE_IDS: ReadonlySet<string> = new Set();



// ----- Flow nodes
export function useFocusConstellationCanvasNodes({
  nodesRef: externalNodesRef,
  layoutNodesForRender,
  relationshipMutationPending,
  isNodeDragging,
  nodesLocked,
  automationLocked = false,
  nodeShape,
  listNodeStyle,
  labelFontKey,
  titleSizePx,
  nodeSize,
  selectedNodeIds,
  highlightedPathNodeIds,
  automationHighlightedNodeIds = EMPTY_AUTOMATION_HIGHLIGHTED_NODE_IDS,
  workOrderBadgeAngles,
  setWorkOrderBadgeAngle,
  isExpanded,
  canExpand,
  toggleExpanded,
  onUpdateWorkOrder,
  handleSelectionPointerDown,
  scopeRootCanvasId = null,
}: {
  nodesRef: MutableRefObject<FocusConstellationFlowNode[]>;
  layoutNodesForRender: ConstellationLayoutNode[];
  relationshipMutationPending: boolean;
  isNodeDragging: boolean;
  nodesLocked: boolean;
  automationLocked?: boolean;
  nodeShape: FocusConstellationNodeShape;
  listNodeStyle: FocusConstellationListNodeStyle;
  labelFontKey: FocusConstellationLabelFontKey;
  titleSizePx: number;
  nodeSize: number;
  selectedNodeIds: ReadonlySet<string>;
  highlightedPathNodeIds: ReadonlySet<string>;
  automationHighlightedNodeIds: ReadonlySet<string>;
  workOrderBadgeAngles: ReturnType<typeof useFocusConstellation>["workOrderBadgeAngles"];
  setWorkOrderBadgeAngle: ReturnType<typeof useFocusConstellation>["setWorkOrderBadgeAngle"];
  isExpanded: ReturnType<typeof useFocusConstellation>["isExpanded"];
  canExpand: ReturnType<typeof useFocusConstellation>["canExpand"];
  toggleExpanded: ReturnType<typeof useFocusConstellation>["toggleExpanded"];
  onUpdateWorkOrder: (nodeId: number, workOrder: number | null) => Promise<void>;
  handleSelectionPointerDown: (
    nodeId: string,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
  scopeRootCanvasId?: string | null;
}) {
  const [workOrderOverrides, setWorkOrderOverrides] = useState<Map<string, number>>(
    () => new Map(),
  );
  const workOrderSaveTimersRef = useRef<Map<string, number>>(new Map());
  const pendingWorkOrderSavesRef = useRef<
    Map<string, { nodeId: number; workOrder: number }>
  >(new Map());
  const prevLayoutPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const derivedNodes = useMemo<FocusConstellationFlowNode[]>(() => {
    return layoutNodesForRender.map((node) => {
      const positionKey = positionKeyForNode(node);
      const isScopeAnchor =
        scopeRootCanvasId !== null && node.id === scopeRootCanvasId;
      const isPositionLocked = node.isOrigin || isScopeAnchor;
      const isSelected = selectedNodeIds.has(node.id) && !isPositionLocked;
      const isOnHighlightedPath = highlightedPathNodeIds.has(node.id);
      const isAutomationHighlighted = automationHighlightedNodeIds.has(node.id);
      const timerNodeId =
        node.entryKind === "list_link" && node.linkedListId != null
          ? node.linkedListId
          : node.entityId;
      return {
        id: node.id,
        type: "focusConstellation",
        position: node.position,
        draggable: !nodesLocked && !isPositionLocked,
        selectable: !nodesLocked && !isPositionLocked,
        connectable: false,
        selected: isSelected,
        style: automationLocked ? { pointerEvents: "none" } : undefined,
        data: {
          isSelected,
          isOnHighlightedPath,
          isAutomationHighlighted,
          title: node.title,
          notes: node.notes,
          colorHex: node.colorHex,
          titleFontKey: node.titleFontKey,
          status: node.status,
          listNodeStyle,
          nodeSize,
          titleSizePx,
          shape: nodeShape,
          kind: node.kind,
          entityId: node.entityId,
          timerNodeId,
          entryKind: node.entryKind ?? null,
          linkedListId: node.linkedListId ?? null,
          listId: node.listId ?? null,
          nodeKind: constellationFocusNodeKind(node),
          targetContainerId: targetContainerIdForNode(node),
          referenceTargetType: node.referenceTargetType ?? null,
          referenceTargetId: node.referenceTargetId ?? null,
          referenceIsMissing: node.referenceIsMissing ?? false,
          referenceMimeType: node.referenceMimeType ?? null,
          referenceMediaKind: node.referenceMediaKind ?? null,
          referenceContentUpdatedAt: node.referenceContentUpdatedAt ?? null,
          showReferenceContent: node.showReferenceContent ?? false,
          workOrder: workOrderOverrides.get(node.id) ?? node.workOrder ?? null,
          tags: node.tags,
          workOrderBadgeAngle: workOrderBadgeAngles.get(positionKey) ?? null,
          labelFontKey,
          parentId: node.parentId,
          isOrigin: node.isOrigin,
          isExpanded: isExpanded(node.id),
          canExpand: canExpand(node.id),
          hasOrbitHandle: canExpand(node.id),
          onToggle: () => toggleExpanded(node.id),
          onWorkOrderChange: (workOrder) => {
            setWorkOrderOverrides((current) => {
              const next = new Map(current);
              next.set(node.id, workOrder);
              return next;
            });
            pendingWorkOrderSavesRef.current.set(node.id, {
              nodeId: node.entityId,
              workOrder,
            });
            const existingTimer = workOrderSaveTimersRef.current.get(node.id);
            if (existingTimer !== undefined) {
              window.clearTimeout(existingTimer);
            }
            const timer = window.setTimeout(() => {
              const pending = pendingWorkOrderSavesRef.current.get(node.id);
              if (!pending) {
                return;
              }
              pendingWorkOrderSavesRef.current.delete(node.id);
              workOrderSaveTimersRef.current.delete(node.id);
              void onUpdateWorkOrder(pending.nodeId, pending.workOrder).catch(() => {
                setWorkOrderOverrides((current) => {
                  const next = new Map(current);
                  next.delete(node.id);
                  return next;
                });
              });
            }, 180);
            workOrderSaveTimersRef.current.set(node.id, timer);
          },
          onWorkOrderBadgeAngleChange: (angle) => {
            setWorkOrderBadgeAngle(positionKey, angle);
          },
          onSelectionPointerDown: (event) => {
            handleSelectionPointerDown(node.id, event);
          },
        },
      };
    });
  }, [
    automationHighlightedNodeIds,
    canExpand,
    handleSelectionPointerDown,
    highlightedPathNodeIds,
    isExpanded,
    labelFontKey,
    layoutNodesForRender,
    listNodeStyle,
    nodeSize,
    nodeShape,
    nodesLocked,
    scopeRootCanvasId,
    automationLocked,
    onUpdateWorkOrder,
    selectedNodeIds,
    setWorkOrderBadgeAngle,
    titleSizePx,
    toggleExpanded,
    workOrderBadgeAngles,
    workOrderOverrides,
  ]);

  const [nodes, setNodes] = useState<FocusConstellationFlowNode[]>(derivedNodes);
  const internalNodesRef = useRef(nodes);
  internalNodesRef.current = nodes;
  externalNodesRef.current = nodes;

  useLayoutEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((node) => [node.id, node] as const));
      const currentByPositionKey = new Map(
        current.map((node) => [positionKeyForNode(node.data), node] as const),
      );
      const nextLayoutPositions = new Map(
        layoutNodesForRender.map((node) => [node.id, node.position] as const),
      );

      const merged = derivedNodes.map((node) => {
        const existing =
          currentById.get(node.id) ??
          currentByPositionKey.get(positionKeyForNode(node.data));
        const layoutPosition = nextLayoutPositions.get(node.id) ?? node.position;
        const previousLayoutPosition = prevLayoutPositionsRef.current.get(node.id);

        let position = layoutPosition;

        if (existing) {
          if (isNodeDragging || relationshipMutationPending) {
            position = existing.position;
          } else if (previousLayoutPosition) {
            const layoutMoved =
              previousLayoutPosition.x !== layoutPosition.x ||
              previousLayoutPosition.y !== layoutPosition.y;
            position = layoutMoved ? layoutPosition : existing.position;
          } else {
            position = existing.position;
          }
        }

        // Carry React Flow's measured dimensions forward. Without this, every
        // rebuilt node object lacks `measured`, which makes React Flow reset the
        // node's `handleBounds` and drop all connected edges until a re-measure.
        // Newly revealed nodes also need a default size so edges can attach
        // immediately on expand/lineage reveal.
        const measured = existing?.measured ?? {
          width: node.data.nodeSize,
          height: node.data.nodeSize,
        };
        return { ...node, position, measured };
      });

      prevLayoutPositionsRef.current = nextLayoutPositions;
      return merged;
    });
  }, [derivedNodes, isNodeDragging, layoutNodesForRender, relationshipMutationPending]);

  useEffect(() => {
    if (workOrderOverrides.size === 0) {
      return;
    }
    setWorkOrderOverrides((current) => {
      let changed = false;
      const next = new Map(current);
      for (const node of layoutNodesForRender) {
        const override = next.get(node.id);
        if (override !== undefined && override === node.workOrder) {
          next.delete(node.id);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [layoutNodesForRender, workOrderOverrides.size]);

  useEffect(() => {
    return () => {
      for (const timer of workOrderSaveTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      workOrderSaveTimersRef.current.clear();
      pendingWorkOrderSavesRef.current.clear();
    };
  }, []);

  return {
    nodes,
    setNodes,
    nodesRef: internalNodesRef,
  };
}
