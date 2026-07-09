// keel_web/src/modules/focus/pages/FocusConstellationPage.tsx

// Constellation graph view for the focus hub.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { FocusAutomationActivityPanel } from "../components/constellation/automation";
import { FocusAutomationModeButton } from "../components/constellation/automation";
import { FocusAutomationSessionModal } from "../components/constellation/automation";
import { FocusConstellationCanvas } from "../components/constellation/canvas";
import { FocusConstellationConfigPanel } from "../components/constellation/controls";
import { FocusConstellationOrbitToggle } from "../components/constellation/controls";
import { FocusConstellationSaveButton } from "../components/constellation/canvas";
import { FocusConstellationScopeBar } from "../components/constellation/controls";
import { FocusRecordPickerModal } from "../components/forms/modals";
import { FocusConstellationItemViewModal } from "../components/constellation/modals";
import { FocusConstellationListViewModal } from "../components/constellation/modals";
import type { FocusConstellationFlowNode } from "../components/constellation/node";
import {
  FocusConstellationCanvasToneToggle,
  FocusConstellationConnectionColorToggle,
  FocusConstellationConnectionStyleToggle,
  FocusConstellationListNodeStyleToggle,
  FocusConstellationNodeSizeSlider,
  FocusConstellationTitleSizeSlider,
  FocusConstellationNodeInfoToggle,
  FocusConstellationUnlinkDistanceSlider,
  FocusConstellationShapeToggle,
} from "../components/constellation/controls";
import { FocusHubChromeBar } from "../components/shared/hub";
import { FocusHubHeaderControls } from "../components/shared/hub";
import { FocusTagManager } from "../components/shared/tags";
import { useFocusBoard } from "../hooks/useFocusBoard";
import { useFocusConstellation } from "../hooks/constellation/useFocusConstellation";
import { useFocusConstellationScopedGraph } from "../hooks/constellation/useFocusConstellationScopedGraph";
import { useFocusScopedConstellationInit } from "../hooks/constellation/useFocusScopedConstellationInit";
import type { FocusConstellationNodeScreenCenterResolver } from "../hooks/constellation/useFocusConstellationNodeScreenCenter";
import { useFocusConstellationSettings } from "../hooks/constellation/useFocusConstellationSettings";
import { useFocusAutomationEndConfirm } from "../hooks/automation/useFocusAutomationEndConfirm";
import { useFocusAutomationLog } from "../hooks/automation/useFocusAutomationLog";
import { useFocusAutomationRealtime } from "../hooks/automation/useFocusAutomationRealtime";
import { useFocusAutomationSession } from "../hooks/automation/useFocusAutomationSession";
import { useFocusHubMutations } from "../hooks/useFocusHubMutations";
import { listNodeId, entryNodeId } from "../lib/constellation/graph";
import {
  resolveCanvasNodeIdForFocusNode,
  resolveCanvasNodeIdFromIndexes,
} from "../lib/automation/panToNode";
import type { FocusConstellationModalOrigin } from "../lib/constellation/modalOrigin";
import {
  clearFocusHubPendingScope,
  type FocusHubNavigationState,
  type FocusHubViewMode,
} from "../lib/focus";

type ConstellationModalLaunch<T> = {
  value: T;
  origin: FocusConstellationModalOrigin | null;
} | null;

type FocusConstellationPageProps = {
  viewMode: FocusHubViewMode;
  onViewModeChange: (mode: FocusHubViewMode) => void;
  scopeRootCanvasId: string | null;
  onOpenScopedConstellation: (canvasNodeId: string) => void;
  onClearScopedConstellation: () => void;
};

export function FocusConstellationPage({
  viewMode,
  onViewModeChange,
  scopeRootCanvasId,
  onOpenScopedConstellation,
  onClearScopedConstellation,
}: FocusConstellationPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const board = useFocusBoard();
  const constellation = useFocusConstellation();
  const scopedGraph = useFocusConstellationScopedGraph(constellation, scopeRootCanvasId);
  const effectiveScopeRootCanvasId = scopedGraph.scopeRootCanvasId ?? scopeRootCanvasId;
  useFocusScopedConstellationInit({
    scopeRootCanvasId,
    constellation,
    onOpenScopedConstellation,
  });
  const constellationSettings = useFocusConstellationSettings();
  const {
    invalidate,
    createListMutation,
    deleteListMutation,
    reparentEntryMutation,
    promoteEntryToListMutation,
    updateNodeWorkOrderMutation,
    updateNodeStatusMutation,
    updateNodeTitleMutation,
    updateNodeColorMutation,
    updateNodeNotesMutation,
    updateNodeTagsMutation,
    updateNodeShowReferenceContentMutation,
    orphanListLinkMutation,
    connectStandaloneListMutation,
    createEntryMutation,
    createRecordMutation,
  } = useFocusHubMutations();

  const [constellationOrbitPlaying, setConstellationOrbitPlaying] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [constellationRecordAdd, setConstellationRecordAdd] =
    useState<ConstellationModalLaunch<FocusConstellationFlowNode>>(null);
  const [constellationViewList, setConstellationViewList] =
    useState<ConstellationModalLaunch<number>>(null);
  const [constellationViewItem, setConstellationViewItem] =
    useState<ConstellationModalLaunch<number>>(null);
  const [automationHighlightedFocusNodeIds, setAutomationHighlightedFocusNodeIds] = useState<
    number[]
  >([]);
  const [automationFrameRequest, setAutomationFrameRequest] = useState<{
    nodeIds: number[];
    tick: number;
  } | null>(null);
  const nodeScreenCenterRef = useRef<FocusConstellationNodeScreenCenterResolver>(() => null);
  const automationCanvasHandlersRef = useRef<{
    alignChildrenAround: (canvasNodeId: string) => void;
  } | null>(null);

  const automationSession = useFocusAutomationSession();
  const automationEndConfirm = useFocusAutomationEndConfirm(automationSession.isLive);
  const automationLog = useFocusAutomationLog();
  const constellationRef = useRef(constellation);
  constellationRef.current = constellation;

  const automationHighlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const nodeId of automationHighlightedFocusNodeIds) {
      const flowId = resolveCanvasNodeIdForFocusNode(
        nodeId,
        constellation.layoutNodes,
        constellation.indexes,
      );
      if (flowId) {
        ids.add(flowId);
      }
    }
    return ids;
  }, [
    automationHighlightedFocusNodeIds,
    constellation.indexes,
    constellation.layoutNodes,
  ]);

  useEffect(() => {
    if (!automationSession.isLive) {
      setAutomationHighlightedFocusNodeIds([]);
      setAutomationFrameRequest(null);
    }
  }, [automationSession.isLive]);

  const automationEnabledRef = useRef(automationSession.isLive);
  automationEnabledRef.current = automationSession.isLive;

  const handleAutomationFrameNodes = useCallback(
    (nodeIds: number[]) => {
      if (!automationEnabledRef.current || nodeIds.length === 0) {
        return;
      }
      if (scopeRootCanvasId) {
        onClearScopedConstellation();
      }
      setAutomationHighlightedFocusNodeIds(nodeIds);
      setAutomationFrameRequest({
        nodeIds,
        tick: Date.now(),
      });
    },
    [onClearScopedConstellation, scopeRootCanvasId],
  );

  const handleAutomationPanToNode = useCallback(
    (nodeId: number) => {
      handleAutomationFrameNodes([nodeId]);
    },
    [handleAutomationFrameNodes],
  );

  const handleAutomationSetNodeExpanded = useCallback((nodeId: number, expanded: boolean) => {
    if (!automationEnabledRef.current) {
      return;
    }
    constellationRef.current.applyAutomationCanvasExpansion(nodeId, expanded);
  }, []);

  const handleAutomationAlignChildren = useCallback((parentFocusNodeId: number) => {
    const indexes = constellationRef.current.indexes;
    if (!indexes) {
      return;
    }
    const canvasNodeId = resolveCanvasNodeIdFromIndexes(parentFocusNodeId, indexes);
    if (canvasNodeId) {
      automationCanvasHandlersRef.current?.alignChildrenAround(canvasNodeId);
    }
  }, []);

  const handleAutomationPositionsChanged = useCallback(
    (positions: ReadonlyArray<{ key: string; x: number; y: number }>) => {
      constellationRef.current.setNodePositionsBatch(
        positions.map((entry) => ({
          positionKey: entry.key,
          position: { x: entry.x, y: entry.y },
        })),
      );
    },
    [],
  );

  useFocusAutomationRealtime({
    enabled: automationSession.isLive,
    appendEntry: automationLog.appendEntry,
    onPanToNode: handleAutomationPanToNode,
    onFrameNodes: handleAutomationFrameNodes,
    onSetNodeExpanded: handleAutomationSetNodeExpanded,
    onAlignChildren: handleAutomationAlignChildren,
    onPositionsChanged: handleAutomationPositionsChanged,
  });

  const resolveNodeModalOrigin = useCallback(
    (node: FocusConstellationFlowNode): FocusConstellationModalOrigin | null =>
      nodeScreenCenterRef.current(node.id),
    [],
  );

  const handleNodeScreenCenterResolverReady = useCallback(
    (resolver: FocusConstellationNodeScreenCenterResolver) => {
      nodeScreenCenterRef.current = resolver;
    },
    [],
  );

  const constellationCanvasDirty =
    constellation.isStateDirty || constellationSettings.isDirty;
  const constellationCanvasSaving =
    constellation.isStateSaving || constellationSettings.isSaving;

  const handleOpenScopedConstellationFromNode = useCallback(
    (node: FocusConstellationFlowNode) => {
      onOpenScopedConstellation(node.id);
    },
    [onOpenScopedConstellation],
  );

  const handleDeleteNode = useCallback(
    (node: FocusConstellationFlowNode) => {
      if (node.data.isOrigin) {
        return;
      }
      if (effectiveScopeRootCanvasId === node.id) {
        onClearScopedConstellation();
      }
      if (node.data.kind === "list") {
        deleteListMutation.mutate(node.data.entityId);
        return;
      }
      if (node.data.kind === "entry") {
        orphanListLinkMutation.mutate(node.data.entityId);
      }
    },
    [
      deleteListMutation,
      onClearScopedConstellation,
      orphanListLinkMutation,
      effectiveScopeRootCanvasId,
    ],
  );

  const handleDetachNode = useCallback(
    async (entryId: number) => {
      await orphanListLinkMutation.mutateAsync(entryId);
      if (effectiveScopeRootCanvasId === entryNodeId(entryId)) {
        const entry = constellation.indexes
          ? [...constellation.indexes.entriesByListId.values()]
              .flat()
              .find((item) => item.id === entryId)
          : null;
        if (entry?.kind === "list_link" && entry.linked_list_id !== null) {
          onOpenScopedConstellation(listNodeId(entry.linked_list_id));
          return;
        }
        onClearScopedConstellation();
      }
    },
    [
      constellation.indexes,
      onClearScopedConstellation,
      onOpenScopedConstellation,
      orphanListLinkMutation,
      effectiveScopeRootCanvasId,
    ],
  );

  useEffect(() => {
    if (!scopeRootCanvasId || scopedGraph.isScoped) {
      return;
    }
    if (constellation.isLoading || !constellation.indexes) {
      return;
    }
    onClearScopedConstellation();
  }, [
    constellation.indexes,
    constellation.isLoading,
    onClearScopedConstellation,
    scopeRootCanvasId,
    scopedGraph.isScoped,
  ]);

  useEffect(() => {
    if (!scopedGraph.isScoped) {
      return;
    }

    clearFocusHubPendingScope();

    const navState = location.state as FocusHubNavigationState | null;
    if (navState?.scopeRootCanvasId) {
      navigate("/focus", { replace: true, state: null });
    }
  }, [location.state, navigate, scopedGraph.isScoped]);

  const handleSaveConstellationCanvas = useCallback(() => {
    void Promise.all([
      constellation.flushSave(),
      constellationSettings.flushSave(),
    ]);
  }, [constellation, constellationSettings]);

  if (constellationSettings.isLoading || !constellationSettings.settings) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center text-sm text-white/45">
        Loading constellation settings…
      </div>
    );
  }

  const {
    node_shape: constellationNodeShape,
    canvas_tone: constellationCanvasTone,
    connection_color: constellationConnectionColor,
    connection_style: constellationConnectionStyle,
    list_node_style: constellationListNodeStyle,
    label_font_key: constellationLabelFontKey,
    node_size_multiplier: constellationNodeSizeMultiplier,
    title_size_px: constellationTitleSize,
    unlink_distance_multiplier: constellationUnlinkDistance,
    config_open: constellationConfigOpen,
    config_position: constellationConfigPosition,
    notes_panel_position: constellationNotesPanelPosition,
    node_info_enabled: constellationNodeInfoEnabled,
  } = constellationSettings.settings;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <FocusConstellationCanvas
        constellation={constellation}
        nodeShape={constellationNodeShape}
        canvasTone={constellationCanvasTone}
        connectionColor={constellationConnectionColor}
        connectionStyle={constellationConnectionStyle}
        listNodeStyle={constellationListNodeStyle}
        labelFontKey={constellationLabelFontKey}
        titleSizePx={constellationTitleSize}
        nodeSizeMultiplier={constellationNodeSizeMultiplier}
        unlinkDistanceMultiplier={constellationUnlinkDistance}
        orbitPlaying={constellationOrbitPlaying}
        isConstellationScoped={scopedGraph.isScoped}
        scopeRootCanvasId={effectiveScopeRootCanvasId}
        onOpenScopedConstellation={handleOpenScopedConstellationFromNode}
        onReparentNode={(entryId, targetListId) =>
          reparentEntryMutation.mutateAsync({ entryId, targetListId }).then(() => undefined)
        }
        onDetachNode={(entryId) => handleDetachNode(entryId).then(() => undefined)}
        onConnectStandaloneList={(listId, targetListId) => {
          const title =
            constellation.indexes?.listsById.get(listId)?.title ?? "Linked list";
          return connectStandaloneListMutation
            .mutateAsync({ listId, targetListId, title })
            .then(() => undefined);
        }}
        addEntryPending={createEntryMutation.isPending}
        onCreateTask={async (node, title) => {
          const listId = node.data.targetContainerId;
          if (listId === null) {
            return;
          }
          await createEntryMutation.mutateAsync({
            title,
            list_id: listId,
            kind: "task",
            status: "limbo",
          });
          constellation.expandNode(node.id);
        }}
        onCreateLinkedList={async (node, title) => {
          const listId = node.data.targetContainerId;
          if (listId === null) {
            return;
          }
          await createEntryMutation.mutateAsync({
            title,
            list_id: listId,
            kind: "list_link",
            linked_list: {
              notes: "",
              tag_ids: [],
              node_color_hex: null,
            },
            status: "limbo",
          });
          constellation.expandNode(node.id);
        }}
        onLinkExistingList={async (node, linkedListId, title) => {
          const listId = node.data.targetContainerId;
          if (listId === null) {
            return;
          }
          await createEntryMutation.mutateAsync({
            title,
            list_id: listId,
            kind: "list_link",
            linked_list_id: linkedListId,
            status: "limbo",
          });
          constellation.expandNode(node.id);
        }}
        onAddRecord={(node) => {
          setConstellationRecordAdd({
            value: node,
            origin: resolveNodeModalOrigin(node),
          });
        }}
        onCreateStandaloneList={async (position, title) => {
          const list = await createListMutation.mutateAsync({ title, status: "limbo" });
          constellation.setNodePosition(listNodeId(list.id), position);
        }}
        onLinkStandaloneList={async (position, listId) => {
          constellation.setNodePosition(listNodeId(listId), position);
          await invalidate();
        }}
        standaloneAddPending={createListMutation.isPending}
        automationLocked={automationSession.isLive}
        automationPanRequest={automationFrameRequest}
        automationHighlightedNodeIds={automationHighlightedNodeIds}
        onViewNode={(node) => {
          const origin = resolveNodeModalOrigin(node);
          if (node.data.nodeKind === "item") {
            setConstellationViewItem({
              value: node.data.entityId,
              origin,
            });
            return;
          }
          if (node.data.targetContainerId !== null) {
            setConstellationViewList({
              value: node.data.targetContainerId,
              origin,
            });
          }
        }}
        onNodeScreenCenterResolverReady={handleNodeScreenCenterResolverReady}
        onAutomationHandlersReady={(handlers) => {
          automationCanvasHandlersRef.current = handlers;
        }}
        onPromoteNodeToList={(node) => {
          if (node.data.nodeKind === "item") {
            constellation.setNodePosition(listNodeId(node.data.entityId), node.position);
            promoteEntryToListMutation.mutate(node.data.entityId);
          }
        }}
        onUpdateWorkOrder={(nodeId, workOrder) =>
          updateNodeWorkOrderMutation
            .mutateAsync({ nodeId, workOrder })
            .then(() => undefined)
        }
        onUpdateNodeStatus={(nodeId, status) =>
          updateNodeStatusMutation
            .mutateAsync({ nodeId, status })
            .then(() => undefined)
        }
        onUpdateNodeTitle={(nodeId, title) =>
          updateNodeTitleMutation
            .mutateAsync({ nodeId, title })
            .then(() => undefined)
        }
        onUpdateNodeColor={(nodeId, colorHex) =>
          updateNodeColorMutation
            .mutateAsync({ nodeId, colorHex })
            .then(() => undefined)
        }
        onUpdateNodeNotes={(nodeId, notes) =>
          updateNodeNotesMutation
            .mutateAsync({ nodeId, notes })
            .then(() => undefined)
        }
        onUpdateNodeTags={(nodeId, tagIds) =>
          updateNodeTagsMutation
            .mutateAsync({ nodeId, tagIds })
            .then(() => undefined)
        }
        onUpdateNodeShowReferenceContent={(nodeId, showReferenceContent) =>
          updateNodeShowReferenceContentMutation
            .mutateAsync({ nodeId, showReferenceContent })
            .then(() => undefined)
        }
        notesPanelPosition={constellationNotesPanelPosition}
        onNotesPanelPositionChange={constellationSettings.setNotesPanelPosition}
        nodeInfoEnabled={constellationNodeInfoEnabled}
        onDeleteNode={handleDeleteNode}
        underlay={
          <FocusAutomationActivityPanel
            entries={automationLog.entries}
            isLive={automationSession.isLive}
          />
        }
        overlay={
          <>
            {scopedGraph.isScoped && scopedGraph.scopeRootTitle ? (
              <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-[min(100%-2rem,28rem)]">
                <FocusConstellationScopeBar
                  scopeTitle={scopedGraph.scopeRootTitle}
                  onBack={onClearScopedConstellation}
                />
              </div>
            ) : null}
            <FocusConstellationConfigPanel
              open={constellationConfigOpen}
              onOpenChange={constellationSettings.setConfigOpen}
              position={constellationConfigPosition}
              onPositionChange={constellationSettings.setConfigPosition}
            >
              <FocusConstellationShapeToggle
                value={constellationNodeShape}
                onChange={constellationSettings.setNodeShape}
              />
              <FocusConstellationCanvasToneToggle
                value={constellationCanvasTone}
                onChange={constellationSettings.setCanvasTone}
              />
              <FocusConstellationConnectionColorToggle
                value={constellationConnectionColor}
                onChange={constellationSettings.setConnectionColor}
              />
              <FocusConstellationConnectionStyleToggle
                value={constellationConnectionStyle}
                onChange={constellationSettings.setConnectionStyle}
              />
              <FocusConstellationListNodeStyleToggle
                value={constellationListNodeStyle}
                onChange={constellationSettings.setListNodeStyle}
              />
              <FocusConstellationUnlinkDistanceSlider
                value={constellationUnlinkDistance}
                onChange={constellationSettings.setUnlinkDistance}
              />
              <FocusConstellationNodeSizeSlider
                value={constellationNodeSizeMultiplier}
                onChange={constellationSettings.setNodeSizeMultiplier}
              />
              <FocusConstellationTitleSizeSlider
                value={constellationTitleSize}
                onChange={constellationSettings.setTitleSize}
              />
              <FocusConstellationNodeInfoToggle
                value={constellationNodeInfoEnabled}
                onChange={constellationSettings.setNodeInfoEnabled}
              />
            </FocusConstellationConfigPanel>
            <FocusHubChromeBar align="canvas">
              <div className="flex items-center gap-2">
                <FocusAutomationModeButton
                  isLive={automationSession.isLive}
                  endConfirmPending={automationEndConfirm.endConfirmPending}
                  disabled={automationSession.isBusy}
                  onClick={() => {
                    if (automationSession.isLive) {
                      if (automationEndConfirm.endConfirmPending) {
                        automationEndConfirm.clearEndConfirmTimer();
                        void automationSession.endSession();
                        return;
                      }
                      automationEndConfirm.setEndConfirmPending(true);
                      return;
                    }
                    void automationSession.startSession();
                  }}
                  onOpenSessionDetails={() => automationSession.setTokenModalOpen(true)}
                />
                <FocusConstellationSaveButton
                  saved={!constellationCanvasDirty}
                  saving={constellationCanvasSaving}
                  onSave={handleSaveConstellationCanvas}
                />
                <FocusConstellationOrbitToggle
                  playing={constellationOrbitPlaying}
                  onPlayingChange={setConstellationOrbitPlaying}
                />
                <FocusHubHeaderControls
                  viewMode={viewMode}
                  onViewModeChange={onViewModeChange}
                  onOpenTagManager={() => setTagManagerOpen(true)}
                />
              </div>
            </FocusHubChromeBar>
          </>
        }
      />

      <FocusAutomationSessionModal
        open={automationSession.tokenModalOpen}
        token={automationSession.sessionToken}
        tokenRecoverable={Boolean(automationSession.sessionToken)}
        onClose={() => automationSession.setTokenModalOpen(false)}
      />

      <FocusRecordPickerModal
        open={constellationRecordAdd !== null}
        origin={constellationRecordAdd?.origin ?? null}
        disabled={createRecordMutation.isPending}
        onClose={() => setConstellationRecordAdd(null)}
        onSelect={async (result) => {
          const parentNode = constellationRecordAdd?.value;
          const listId = parentNode?.data.targetContainerId;
          if (!parentNode || listId === null || listId === undefined) {
            return;
          }
          await createRecordMutation.mutateAsync({
            parentId: listId,
            result,
            status: "limbo",
          });
          constellation.expandNode(parentNode.id);
          setConstellationRecordAdd(null);
        }}
      />

      <FocusConstellationListViewModal
        open={constellationViewList !== null}
        listId={constellationViewList?.value ?? null}
        origin={constellationViewList?.origin ?? null}
        onClose={() => setConstellationViewList(null)}
      />

      <FocusConstellationItemViewModal
        open={constellationViewItem !== null}
        itemId={constellationViewItem?.value ?? null}
        origin={constellationViewItem?.origin ?? null}
        onClose={() => setConstellationViewItem(null)}
      />

      <FocusTagManager
        open={tagManagerOpen}
        onClose={() => {
          setTagManagerOpen(false);
          void board.refresh();
        }}
      />
    </div>
  );
}
