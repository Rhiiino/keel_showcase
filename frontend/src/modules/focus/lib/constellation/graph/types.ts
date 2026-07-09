// keel_web/src/modules/focus/lib/constellation/graph/types.ts

import type { FocusEntryKind, FocusNodeStatus } from "../../focus";
import type { FocusTag } from "../../../api";
import type { ConstellationPoint } from "../layout";

export type ConstellationNodeKind = "list" | "entry";

export type ConstellationGraphNode = {
  id: string;
  kind: ConstellationNodeKind;
  entityId: number;
  title: string;
  notes: string;
  colorHex: string | null;
  titleFontKey: string | null;
  status: FocusNodeStatus;
  workOrder: number | null;
  tags: FocusTag[];
  isOrigin: boolean;
  entryKind?: FocusEntryKind;
  linkedListId?: number | null;
  listId?: number;
  referenceTargetType?: string | null;
  referenceTargetId?: string | null;
  referenceIsMissing?: boolean;
  referenceMimeType?: string | null;
  referenceMediaKind?: string | null;
  referenceContentUpdatedAt?: string | null;
  showReferenceContent?: boolean;
};

export type ConstellationGraphIndexes = {
  listsById: Map<number, import("../../../api").FocusList>;
  entriesByListId: Map<number, import("../../../api").FocusEntry[]>;
  originList: import("../../../api").FocusList | null;
};

export type ConstellationLayoutNode = ConstellationGraphNode & {
  position: ConstellationPoint;
  collapsedPosition: ConstellationPoint | null;
  parentId: string | null;
  depth: number;
};

export type ConstellationEdge = {
  id: string;
  source: string;
  target: string;
};

export type PositionKeyInput = {
  kind: ConstellationNodeKind;
  entryKind?: FocusEntryKind | null;
  linkedListId?: number | null;
  listId?: number | null;
  entityId: number;
};
