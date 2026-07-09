// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasInteraction.ts

import { useCallback, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useReactFlow } from "@xyflow/react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";
import type {
  FocusConstellationNodeContextMenuState,
} from "../../components/constellation/contextMenu";
import type {
  FocusConstellationPaneContextMenuState,
} from "../../components/constellation/contextMenu";
import { collectLineageExpansionLevels, standaloneRootLists } from "../../lib/constellation/graph";
import { isConstellationSelectionModifier } from "../../lib/constellation/interaction";
import type { ConstellationPoint } from "../../lib/constellation/layout";
import type { ManualOrbitState } from "./useFocusConstellationOrbitAnimation";
import type { useFocusConstellation } from "./useFocusConstellation";



// ----- Selection and context menus
export function useFocusConstellationCanvasInteraction({
  constellation,
  nodesLockedRef,
  manualOrbitRef,
  skipExpandAnimations,
  onCreateStandaloneList,
  onLinkStandaloneList,
  suppressNodeClickRef,
  referenceInspectorOpenRef,
  paneContextMenuDisabled = false,
  automationLocked = false,
}: {
  constellation: ReturnType<typeof useFocusConstellation>;
  nodesLockedRef: React.RefObject<boolean>;
  manualOrbitRef: React.RefObject<ManualOrbitState | null>;
  skipExpandAnimations: () => void;
  onCreateStandaloneList: (position: ConstellationPoint, title: string) => Promise<void>;
  onLinkStandaloneList: (position: ConstellationPoint, listId: number) => Promise<void>;
  suppressNodeClickRef: MutableRefObject<boolean>;
  referenceInspectorOpenRef: React.RefObject<boolean>;
  paneContextMenuDisabled?: boolean;
  automationLocked?: boolean;
}) {
  const automationLockedRef = useRef(automationLocked);
  automationLockedRef.current = automationLocked;
  const { indexes, expandedIds, toggleExpanded, expandLineage } = constellation;
  const { screenToFlowPosition } = useReactFlow();
  const selectionPointerHandledRef = useRef(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const selectedNodeIdsRef = useRef<ReadonlySet<string>>(selectedNodeIds);
  selectedNodeIdsRef.current = selectedNodeIds;
  const [nodeContextMenu, setNodeContextMenu] =
    useState<FocusConstellationNodeContextMenuState>(null);
  const [paneContextMenu, setPaneContextMenu] =
    useState<FocusConstellationPaneContextMenuState>(null);

  const contextMenuExcludedLinkedListIds = useMemo(() => {
    const targetListId = nodeContextMenu?.node.data.targetContainerId;
    if (targetListId === null || targetListId === undefined || !indexes) {
      return [];
    }
    const entries = indexes.entriesByListId.get(targetListId) ?? [];
    return entries.flatMap((entry) =>
      entry.kind === "list_link" && entry.linked_list_id !== null
        ? [entry.linked_list_id]
        : [],
    );
  }, [indexes, nodeContextMenu]);

  const paneContextMenuLinkableLists = useMemo(() => {
    if (!indexes) {
      return [];
    }
    return standaloneRootLists(indexes);
  }, [indexes]);

  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleSelectionPointerDown = useCallback(
    (nodeId: string, event: React.PointerEvent<HTMLElement>) => {
      if (referenceInspectorOpenRef.current) {
        return;
      }
      if (nodesLockedRef.current || manualOrbitRef.current) {
        return;
      }
      if (
        event.target instanceof Element &&
        (event.target.closest("[data-focus-work-order-badge='true']") ||
          event.target.closest("[data-focus-reference-icon='true']"))
      ) {
        return;
      }
      if (!isConstellationSelectionModifier(event)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      selectionPointerHandledRef.current = true;
      toggleNodeSelection(nodeId);
    },
    [manualOrbitRef, nodesLockedRef, referenceInspectorOpenRef, toggleNodeSelection],
  );

  const closeNodeContextMenu = useCallback(() => {
    setNodeContextMenu(null);
  }, []);

  const closePaneContextMenu = useCallback(() => {
    setPaneContextMenu(null);
  }, []);

  const closeAllContextMenus = useCallback(() => {
    setNodeContextMenu(null);
    setPaneContextMenu(null);
  }, []);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: FocusConstellationFlowNode) => {
      if (referenceInspectorOpenRef.current) {
        return;
      }
      if (suppressNodeClickRef.current) {
        suppressNodeClickRef.current = false;
        return;
      }
      if (
        event.target instanceof Element &&
        (event.target.closest("[data-focus-work-order-badge='true']") ||
          event.target.closest("[data-focus-reference-icon='true']"))
      ) {
        return;
      }
      if (nodesLockedRef.current || manualOrbitRef.current) {
        return;
      }
      if (isConstellationSelectionModifier(event)) {
        event.preventDefault();
        event.stopPropagation();
        setNodeContextMenu(null);
        setPaneContextMenu(null);
        if (selectionPointerHandledRef.current) {
          selectionPointerHandledRef.current = false;
          return;
        }
        toggleNodeSelection(node.id);
        return;
      }
      setNodeContextMenu(null);
      setPaneContextMenu(null);

      setSelectedNodeIds(new Set([node.id]));

      if (node.data.canExpand) {
        toggleExpanded(node.id);
      }
    },
    [manualOrbitRef, nodesLockedRef, referenceInspectorOpenRef, toggleExpanded, toggleNodeSelection],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FocusConstellationFlowNode) => {
      if (automationLockedRef.current) {
        return;
      }
      event.preventDefault();
      setPaneContextMenu(null);
      setNodeContextMenu({
        clientX: event.clientX,
        clientY: event.clientY,
        node,
      });
    },
    [],
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      if (paneContextMenuDisabled) {
        return;
      }
      event.preventDefault();
      setNodeContextMenu(null);
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setPaneContextMenu({
        clientX: event.clientX,
        clientY: event.clientY,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    [paneContextMenuDisabled, screenToFlowPosition],
  );

  const handlePaneCreateStandaloneList = useCallback(
    async (title: string) => {
      if (!paneContextMenu) {
        return;
      }
      await onCreateStandaloneList(
        {
          x: paneContextMenu.flowX,
          y: paneContextMenu.flowY,
        },
        title,
      );
    },
    [onCreateStandaloneList, paneContextMenu],
  );

  const handlePaneLinkStandaloneList = useCallback(
    async (listId: number) => {
      if (!paneContextMenu) {
        return;
      }
      await onLinkStandaloneList(
        {
          x: paneContextMenu.flowX,
          y: paneContextMenu.flowY,
        },
        listId,
      );
    },
    [onLinkStandaloneList, paneContextMenu],
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      closeAllContextMenus();
      if (isConstellationSelectionModifier(event)) {
        return;
      }
      setSelectedNodeIds((current) => (current.size === 0 ? current : new Set()));
    },
    [closeAllContextMenus],
  );

  const nodeHasShowableLineage = useCallback(
    (nodeId: string) => {
      if (!indexes) {
        return false;
      }
      return collectLineageExpansionLevels(nodeId, indexes, expandedIds).length > 0;
    },
    [expandedIds, indexes],
  );

  const handleShowLineage = useCallback(
    (node: FocusConstellationFlowNode) => {
      skipExpandAnimations();
      expandLineage(node.id);
    },
    [expandLineage, skipExpandAnimations],
  );

  return {
    selectedNodeIds,
    selectedNodeIdsRef,
    nodeContextMenu,
    paneContextMenu,
    contextMenuExcludedLinkedListIds,
    paneContextMenuLinkableLists,
    handleSelectionPointerDown,
    closeNodeContextMenu,
    closePaneContextMenu,
    closeAllContextMenus,
    onNodeClick,
    onNodeContextMenu,
    onPaneContextMenu,
    onPaneClick,
    handlePaneCreateStandaloneList,
    handlePaneLinkStandaloneList,
    nodeHasShowableLineage,
    handleShowLineage,
  };
}
