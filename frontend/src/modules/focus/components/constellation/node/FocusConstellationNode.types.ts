// src/modules/focus/components/constellation/node/FocusConstellationNode.types.ts

import type { Node } from "@xyflow/react";

import type { FocusTag } from "../../../api";
import type {
  FocusConstellationLabelFontKey,
  FocusConstellationListNodeStyle,
  FocusConstellationNodeShape,
  FocusEntryKind,
  FocusNodeKind,
  FocusNodeStatus,
} from "../../../lib/focus";
import type { ConstellationNodeKind } from "../../../lib/constellation/graph";

export type FocusConstellationNodeData = {
  title: string;
  notes: string;
  colorHex: string | null;
  titleFontKey: string | null;
  status: FocusNodeStatus;
  listNodeStyle: FocusConstellationListNodeStyle;
  nodeSize: number;
  titleSizePx: number;
  shape: FocusConstellationNodeShape;
  kind: ConstellationNodeKind;
  entityId: number;
  timerNodeId: number;
  entryKind?: FocusEntryKind | null;
  linkedListId?: number | null;
  listId?: number | null;
  nodeKind: FocusNodeKind;
  targetContainerId: number | null;
  referenceTargetType: string | null;
  referenceTargetId: string | null;
  referenceIsMissing: boolean;
  referenceMimeType: string | null;
  referenceMediaKind: string | null;
  referenceContentUpdatedAt: string | null;
  showReferenceContent: boolean;
  workOrder: number | null;
  tags: FocusTag[];
  workOrderBadgeAngle: number | null;
  labelFontKey: FocusConstellationLabelFontKey;
  parentId: string | null;
  isOrigin: boolean;
  isSelected: boolean;
  isOnHighlightedPath: boolean;
  isAutomationHighlighted: boolean;
  isExpanded: boolean;
  canExpand: boolean;
  hasOrbitHandle: boolean;
  onToggle: () => void;
  onWorkOrderChange: (workOrder: number) => void;
  onWorkOrderBadgeAngleChange: (angle: number) => void;
  onSelectionPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
};

export type FocusConstellationFlowNode = Node<
  FocusConstellationNodeData,
  "focusConstellation"
>;
