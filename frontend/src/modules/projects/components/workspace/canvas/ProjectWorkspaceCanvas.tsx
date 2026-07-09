// keel_web/src/modules/projects/components/workspace/canvas/ProjectWorkspaceCanvas.tsx

// React Flow canvas for the project workspace with nodes, edges, and autosave.

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import { deleteProjectMediaByMediaId, type ProjectMedia } from "../../../api";
import {
  canvasMediaCopyCounts as deriveCanvasMediaCopyCounts,
  selectedCanvasMediaIds as deriveSelectedCanvasMediaIds,
  serializeCanvasMediaCopyCounts,
} from "../../../lib/workspace/canvas";
import { nodeReferencesMediaId } from "../../../lib/workspace/canvas";

import { useWorkspaceAutosave } from "../../../hooks/useWorkspaceAutosave";
import { useWorkspaceCanvasPasteFocus } from "../../../hooks/useWorkspaceCanvasPasteFocus";
import { useWorkspaceCanvasPasteUpload } from "../../../hooks/useWorkspaceCanvasPasteUpload";
import { useWorkspaceHistory } from "../../../hooks/useWorkspaceHistory";
import type { ProjectFolderTarget } from "../../../lib/project/media/projectFileFolderDrag";
import {
  applyWorkspaceNoteHiddenFlags,
  createMediaNode,
  createNoteNode,
  isWorkspaceNoteHidden,
  type ProjectWorkspaceState,
  type WorkspaceEdgeData,
  type WorkspaceNoteData,
  viewportFromFlow,
} from "../../../lib/workspace";
import { stripLegacyLabelAnchorNodes } from "../../../lib/workspace/edge";
import { getWorkspaceEdgeLabelPosition } from "../../../lib/workspace/edge";
import { getEdgeLabelText, resolveLabelBounds } from "../../../lib/workspace/edge";
import {
  WORKSPACE_CANVAS_COLOR_SPECS,
  resolveWorkspaceCanvasDotColor,
  type WorkspaceCanvasColorPreset,
  type WorkspaceCanvasConnectionStyle,
  type WorkspaceNoteColorStyle,
  type WorkspaceNoteItalicColorPreset,
} from "../../../lib/workspace";
import type { WorkspaceNotesGridPlacement } from "../../../lib/workspace/note/workspaceNotesGridLayout";
import {
  normalizeWorkspaceEdge,
  normalizeWorkspaceEdges,
} from "../../../lib/workspace/edge";
import { noteColorToStored, resolveNoteColors } from "../../../lib/workspace/node";
import {
  endWorkspaceMediaDrag,
  type WorkspaceMediaDragPayload,
} from "../../../lib/workspace/canvas";
import { registerWorkspaceMediaDropTarget } from "../../../lib/workspace";
import {
  clientPointInElementCenter,
  isEditablePasteTarget,
  isPointerOverElement,
  readClipboardFiles,
  readClipboardPlainText,
  setWorkspaceCanvasPasteTarget,
  isWorkspaceCanvasPasteTarget,
} from "../../../lib/workspace/canvas";
import {
  copyWorkspaceSelection,
  mergePastedWorkspace,
  parseWorkspaceClipboard,
  pasteOffsetAnchoredAt,
  pasteWorkspaceClipboard,
  serializeWorkspaceClipboard,
  type WorkspaceClipboardPayload,
} from "../../../lib/workspace/canvas";
import { WorkspaceCanvasProvider, type WorkspaceNoteReferenceOrigin } from "../context/WorkspaceCanvasContext";
import {
  WorkspaceCanvasContextMenu,
  type WorkspaceCanvasContextMenuState,
} from "./WorkspaceCanvasContextMenu";
import { WorkspaceEdge } from "../edges/WorkspaceEdge";
import { WorkspaceConnectionLine } from "./WorkspaceConnectionLine";
import {
  WorkspaceEdgeLabelEditor,
  type WorkspaceEdgeLabelEditSession,
} from "../edges/WorkspaceEdgeLabelEditor";
import { WorkspaceEdgeLabelBackdrops } from "../edges/WorkspaceEdgeLabelBackdrops";
import { WorkspaceSnapThread } from "./WorkspaceSnapThread";
import { WorkspaceMediaNode } from "../nodes/WorkspaceMediaNode";
import { WorkspaceNoteNode } from "../nodes/WorkspaceNoteNode";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { WorkspaceNoteReferenceModal } from "../overlays/WorkspaceNoteReferenceModal";
import { WorkspaceNotesGridOverlay } from "../overlays/WorkspaceNotesGridOverlay";
import {
  useWorkspaceViewContext,
  type WorkspacePanelNote,
} from "../context/WorkspaceViewContext";
import {
  findWorkspaceSnapCandidate,
  workspaceSnapCandidatesEqual,
  type WorkspaceSnapCandidate,
} from "../../../lib/workspace/snap";

const nodeTypes = {
  note: WorkspaceNoteNode,
  media: WorkspaceMediaNode,
};

const edgeTypes = {
  workspace: WorkspaceEdge,
};

function deriveWorkspacePanelNotes(nodes: Node[]): WorkspacePanelNote[] {
  return nodes.flatMap((node) => {
    if (node.type !== "note") {
      return [];
    }

    const data = node.data as Partial<WorkspaceNoteData>;
    const { border } = resolveNoteColors(data.color);
    return [
      {
        id: node.id,
        title: typeof data.title === "string" && data.title.trim() ? data.title : "Note",
        text: typeof data.text === "string" ? data.text : "",
        borderColor: border,
        hidden: isWorkspaceNoteHidden(data),
      },
    ];
  });
}

function selectedCanvasNoteIds(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "note" && node.selected)
    .map((node) => node.id);
}

type ProjectWorkspaceCanvasProps = {
  projectId: number;
  canvasId: number;
  initialState: ProjectWorkspaceState;
  canvasColorPreset: WorkspaceCanvasColorPreset;
  snapEnabled: boolean;
  minimapOpen: boolean;
  gridDotStrength: number;
  textFontScale: number;
  connectionStyle: WorkspaceCanvasConnectionStyle;
  noteColorStyle: WorkspaceNoteColorStyle;
  noteItalicColor: WorkspaceNoteItalicColorPreset;
  onToggleSnap: () => void;
  notesGridLayout: WorkspaceNotesGridPlacement[] | null;
  onNotesGridLayoutChange: (layout: WorkspaceNotesGridPlacement[]) => void;
  pasteUploadTarget: ProjectFolderTarget;
  overlay?: ReactNode;
  onAutosaveHandlersChange?: (handlers: { flushSave: () => void } | null) => void;
};

function ProjectWorkspaceCanvasInner({
  projectId,
  canvasId,
  initialState,
  canvasColorPreset,
  snapEnabled,
  minimapOpen,
  gridDotStrength,
  textFontScale,
  connectionStyle,
  noteColorStyle,
  noteItalicColor,
  onToggleSnap,
  notesGridLayout,
  onNotesGridLayoutChange,
  pasteUploadTarget,
  overlay,
  onAutosaveHandlersChange,
}: ProjectWorkspaceCanvasProps) {
  const {
    screenToFlowPosition,
    fitView,
    getNodes,
    getEdges,
    getViewport,
    setViewport: setFlowViewport,
    updateNodeData,
  } = useReactFlow();
  const initialContentNodes = useMemo(
    () => applyWorkspaceNoteHiddenFlags(stripLegacyLabelAnchorNodes(initialState.nodes)),
    [initialState.nodes],
  );
  const initialEdges = useMemo(
    () => normalizeWorkspaceEdges(initialState.edges),
    [initialState.edges],
  );
  const [nodes, setNodes] = useState<Node[]>(initialContentNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [viewport, setViewport] = useState(initialState.viewport);
  const [labelEdit, setLabelEdit] = useState<WorkspaceEdgeLabelEditSession | null>(null);
  const labelEditRef = useRef<WorkspaceEdgeLabelEditSession | null>(null);
  const [contextMenu, setContextMenu] = useState<WorkspaceCanvasContextMenuState | null>(null);
  const [noteReference, setNoteReference] = useState<{
    noteId: string;
    origin: WorkspaceNoteReferenceOrigin | null;
  } | null>(null);
  const [notesGridOpen, setNotesGridOpen] = useState(false);
  const [snapCandidate, setSnapCandidate] = useState<WorkspaceSnapCandidate | null>(null);
  const snapCandidateRef = useRef<WorkspaceSnapCandidate | null>(null);
  const snapEnabledRef = useRef(snapEnabled);
  snapEnabledRef.current = snapEnabled;
  const contextMenuNotePositionRef = useRef<{ x: number; y: number } | null>(null);
  const noteBodyEditingIdRef = useRef<string | null>(null);
  const clipboardRef = useRef<WorkspaceClipboardPayload | null>(null);
  const pasteGenerationRef = useRef(1);
  const canvasPointerRef = useRef<{ x: number; y: number } | null>(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const horizontalPanSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  nodesRef.current = nodes;
  edgesRef.current = edges;
  labelEditRef.current = labelEdit;

  const history = useWorkspaceHistory(initialContentNodes, initialState.edges);
  const {
    registerDeleteWorkspaceMedia,
    registerWorkspaceNoteActions,
    filesPanelFocusedMediaId,
    setFilesPanelFocusedMediaId,
    filesPanelFocusedNoteId,
    setFilesPanelFocusedNoteId,
    setSelectedCanvasMediaIds,
    setSelectedCanvasNoteIds,
    setWorkspaceNotes,
    setCanvasMediaCopyCounts,
  } = useWorkspaceViewContext();

  const selectedMediaIdsKeyRef = useRef<string>("");
  const selectedNoteIdsKeyRef = useRef<string>("");
  const workspaceNotesKeyRef = useRef<string>("");
  const canvasMediaCopyCountsKeyRef = useRef<string>("");
  useEffect(() => {
    // Only push selection into the page-level context when it actually changes.
    // This effect runs on every `nodes` update (i.e. every drag frame); pushing a
    // fresh array each time would re-render the whole workspace subtree and make
    // node dragging jitter.
    const ids = deriveSelectedCanvasMediaIds(nodes);
    const key = ids.join(",");
    if (key === selectedMediaIdsKeyRef.current) {
      return;
    }
    selectedMediaIdsKeyRef.current = key;
    setSelectedCanvasMediaIds(ids);
  }, [nodes, setSelectedCanvasMediaIds]);

  useEffect(() => {
    const counts = deriveCanvasMediaCopyCounts(nodes);
    const key = serializeCanvasMediaCopyCounts(counts);
    if (key === canvasMediaCopyCountsKeyRef.current) {
      return;
    }
    canvasMediaCopyCountsKeyRef.current = key;
    setCanvasMediaCopyCounts(counts);
  }, [nodes, setCanvasMediaCopyCounts]);

  useEffect(() => {
    const ids = selectedCanvasNoteIds(nodes);
    const key = ids.join(",");
    if (key !== selectedNoteIdsKeyRef.current) {
      selectedNoteIdsKeyRef.current = key;
      setSelectedCanvasNoteIds(ids);
    }

    const notes = deriveWorkspacePanelNotes(nodes);
    const notesKey = JSON.stringify(notes);
    if (notesKey !== workspaceNotesKeyRef.current) {
      workspaceNotesKeyRef.current = notesKey;
      setWorkspaceNotes(notes);
    }
  }, [nodes, setSelectedCanvasNoteIds, setWorkspaceNotes]);

  useEffect(() => {
    if (
      filesPanelFocusedNoteId !== null &&
      !nodes.some((node) => node.id === filesPanelFocusedNoteId)
    ) {
      setFilesPanelFocusedNoteId(null);
    }
  }, [filesPanelFocusedNoteId, nodes, setFilesPanelFocusedNoteId]);

  const { status, scheduleSave, markLoaded, retry, flushSave } = useWorkspaceAutosave({
    projectId,
    canvasId,
    enabled: true,
  });

  useEffect(() => {
    onAutosaveHandlersChange?.({ flushSave });
    return () => {
      onAutosaveHandlersChange?.(null);
    };
  }, [flushSave, onAutosaveHandlersChange]);

  const emitSave = useCallback(
    (
      nextNodes: Node[],
      nextEdges: Edge[],
      nextViewport: ProjectWorkspaceState["viewport"] = viewport,
      trackHistory = true,
    ) => {
      const contentNodes = stripLegacyLabelAnchorNodes(nextNodes);
      const sanitizedEdges = normalizeWorkspaceEdges(nextEdges);
      if (trackHistory) {
        history.recordChange(contentNodes, sanitizedEdges);
      }
      setViewport((current) =>
        current.x === nextViewport.x &&
        current.y === nextViewport.y &&
        current.zoom === nextViewport.zoom
          ? current
          : nextViewport,
      );
      scheduleSave({
        version: 1,
        viewport: nextViewport,
        nodes: contentNodes,
        edges: sanitizedEdges,
      });
    },
    [history, scheduleSave, viewport],
  );

  const patchEdges = useCallback(
    (recipe: (edges: Edge[]) => Edge[], options?: { save?: boolean }) => {
      setEdges((currentEdges) => {
        const nextEdges = recipe(currentEdges);
        if (nextEdges === currentEdges) {
          return currentEdges;
        }

        const sanitized = normalizeWorkspaceEdges(nextEdges);
        const content = stripLegacyLabelAnchorNodes(nodesRef.current);
        if (options?.save !== false) {
          emitSave(content, sanitized);
        }
        return sanitized;
      });
    },
    [emitSave],
  );

  const requestSave = useCallback(() => {
    emitSave(
      getNodes(),
      getEdges(),
      viewportFromFlow(getViewport()),
    );
  }, [emitSave, getNodes, getEdges, getViewport]);

  const restoreSnapshot = useCallback(
    (snapshot: { nodes: Node[]; edges: Edge[] }) => {
      history.applySnapshot(snapshot);
      const contentNodes = stripLegacyLabelAnchorNodes(snapshot.nodes);
      const sanitizedEdges = normalizeWorkspaceEdges(snapshot.edges);
      setNodes(contentNodes);
      setEdges(sanitizedEdges);
      emitSave(contentNodes, sanitizedEdges, viewport, false);
    },
    [emitSave, history, viewport],
  );

  const handleUndo = useCallback(() => {
    const snapshot = history.undo();
    if (snapshot) {
      restoreSnapshot(snapshot);
    }
  }, [history, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = history.redo();
    if (snapshot) {
      restoreSnapshot(snapshot);
    }
  }, [history, restoreSnapshot]);

  useEffect(() => {
    markLoaded();
  }, [markLoaded]);

  const deleteWorkspaceMediaOnCanvas = useCallback(
    async (mediaId: string) => {
      const contentNodes = stripLegacyLabelAnchorNodes(getNodes());
      const removedNodeIds = new Set(
        contentNodes
          .filter((node) => nodeReferencesMediaId(node, mediaId))
          .map((node) => node.id),
      );
      const nextNodes = contentNodes.filter((node) => !removedNodeIds.has(node.id));
      const nextEdges = normalizeWorkspaceEdges(getEdges()).filter(
        (edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target),
      );

      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedCanvasMediaIds(deriveSelectedCanvasMediaIds(nextNodes));
      if (filesPanelFocusedMediaId === mediaId) {
        setFilesPanelFocusedMediaId(null);
      }
      emitSave(nextNodes, nextEdges);
      await deleteProjectMediaByMediaId(projectId, mediaId);
    },
    [
      emitSave,
      filesPanelFocusedMediaId,
      getEdges,
      getNodes,
      projectId,
      setFilesPanelFocusedMediaId,
      setSelectedCanvasMediaIds,
    ],
  );

  useEffect(() => {
    registerDeleteWorkspaceMedia(deleteWorkspaceMediaOnCanvas);
    return () => {
      registerDeleteWorkspaceMedia(null);
    };
  }, [registerDeleteWorkspaceMedia, deleteWorkspaceMediaOnCanvas]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) {
      return;
    }

    const flowRoot = container.querySelector<HTMLElement>(".react-flow");
    if (!flowRoot) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      const normalize = event.deltaMode === 1 ? 20 : 1;
      const deltaX = Math.abs(event.deltaX) * normalize;
      const deltaY = Math.abs(event.deltaY) * normalize;
      const shiftScroll = event.shiftKey && deltaY > 0 && deltaX === 0;

      const isHorizontalPan =
        (deltaX > 0 && deltaX >= deltaY) || shiftScroll;

      if (!isHorizontalPan) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const panDeltaX = shiftScroll
        ? event.deltaY * normalize
        : event.deltaX * normalize;

      const current = getViewport();
      const panSpeed = 0.5;
      setFlowViewport(
        {
          x: current.x - (panDeltaX * panSpeed) / current.zoom,
          y: current.y,
          zoom: current.zoom,
        },
        { duration: 0 },
      );

      if (horizontalPanSaveTimeoutRef.current) {
        clearTimeout(horizontalPanSaveTimeoutRef.current);
      }
      horizontalPanSaveTimeoutRef.current = setTimeout(() => {
        emitSave(
          nodesRef.current,
          edgesRef.current,
          viewportFromFlow(getViewport()),
          false,
        );
        horizontalPanSaveTimeoutRef.current = null;
      }, 150);
    };

    flowRoot.addEventListener("wheel", handleWheel, { passive: false, capture: true });

    return () => {
      flowRoot.removeEventListener("wheel", handleWheel, { capture: true });
      if (horizontalPanSaveTimeoutRef.current) {
        clearTimeout(horizontalPanSaveTimeoutRef.current);
      }
    };
  }, [emitSave, getViewport, setFlowViewport]);

  const clearSnapPreview = useCallback(() => {
    snapCandidateRef.current = null;
    setSnapCandidate(null);
  }, []);

  const handleToggleSnap = useCallback(() => {
    if (snapEnabledRef.current) {
      clearSnapPreview();
    }
    onToggleSnap();
  }, [clearSnapPreview, onToggleSnap]);

  const onNodeDrag = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (!snapEnabledRef.current) {
        clearSnapPreview();
        return;
      }

      const candidate = findWorkspaceSnapCandidate(node, nodesRef.current);
      snapCandidateRef.current = candidate;
      setSnapCandidate((current) =>
        workspaceSnapCandidatesEqual(current, candidate) ? current : candidate,
      );
    },
    [clearSnapPreview],
  );

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      const candidate = snapCandidateRef.current;
      clearSnapPreview();

      if (!snapEnabledRef.current || !candidate || candidate.draggedNodeId !== node.id) {
        return;
      }

      setNodes((current) => {
        const next = current.map((item) =>
          item.id === node.id
            ? { ...item, position: candidate.snappedPosition }
            : item,
        );
        emitSave(next, edgesRef.current);
        return next;
      });
    },
    [clearSnapPreview, emitSave],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const isInteractionInProgress = changes.some(
        (change) =>
          (change.type === "position" && change.dragging === true) ||
          (change.type === "dimensions" && change.resizing === true),
      );

      setNodes((current) => {
        const next = stripLegacyLabelAnchorNodes(
          applyNodeChanges(changes, current),
        );

        const meaningful = changes.some((change) => change.type !== "select");
        if (meaningful && !isInteractionInProgress) {
          emitSave(next, edgesRef.current);
        }
        return next;
      });
    },
    [emitSave],
  );

  const handleSelectNoteColor = useCallback(
    (nodeId: string, borderHex: string) => {
      updateNodeData(nodeId, { color: noteColorToStored(borderHex) });
      requestSave();
    },
    [updateNodeData, requestSave],
  );

  const commitLabelEdit = useCallback(
    (draft: string, size?: { width?: number; height?: number }) => {
      const session = labelEditRef.current;
      if (!session) {
        return;
      }

      setLabelEdit(null);
      const trimmed = draft.trim();

      patchEdges((currentEdges) =>
        currentEdges.map((item) => {
          const data = (item.data ?? {}) as WorkspaceEdgeData;
          if (item.id !== session.edgeId) {
            return { ...item, data: { ...data, editingLabel: false } };
          }
          return {
            ...item,
            selected: true,
            data: {
              ...data,
              label: trimmed,
              editingLabel: false,
              labelWidth: size?.width ?? data.labelWidth,
              labelHeight: size?.height ?? data.labelHeight,
            },
          };
        }),
      );
    },
    [patchEdges],
  );

  const cancelLabelEdit = useCallback(() => {
    const session = labelEditRef.current;
    if (!session) {
      return;
    }

    setLabelEdit(null);
    patchEdges(
      (currentEdges) =>
        currentEdges.map((item) => {
          const data = (item.data ?? {}) as WorkspaceEdgeData;
          return { ...item, data: { ...data, editingLabel: false } };
        }),
      { save: false },
    );
  }, [patchEdges]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const session = labelEditRef.current;
      if (session) {
        const deselectsEdited = changes.some(
          (change) =>
            change.type === "select" &&
            "id" in change &&
            change.id === session.edgeId &&
            !change.selected,
        );
        if (deselectsEdited) {
          commitLabelEdit(session.draft);
        }
      }

      setEdges((currentEdges) => {
        let nextEdges = applyEdgeChanges(changes, currentEdges);
        const activeEdit = labelEditRef.current;
        if (activeEdit) {
          nextEdges = nextEdges.map((item) => {
            if (item.id !== activeEdit.edgeId) {
              return item;
            }
            const data = (item.data ?? {}) as WorkspaceEdgeData;
            return { ...item, data: { ...data, editingLabel: true } };
          });
        }

        const content = stripLegacyLabelAnchorNodes(nodesRef.current);
        const sanitized = normalizeWorkspaceEdges(nextEdges);
        if (changes.some((change) => change.type !== "select")) {
          emitSave(content, sanitized);
        }
        return sanitized;
      });
    },
    [commitLabelEdit, emitSave],
  );

  const beginLabelEdit = useCallback(
    (edgeId: string) => {
      const edge = edgesRef.current.find((item) => item.id === edgeId);
      if (!edge) {
        return;
      }

      const contentNodes = stripLegacyLabelAnchorNodes(nodesRef.current);
      const nodesById = new Map(contentNodes.map((node) => [node.id, node] as const));
      const position = getWorkspaceEdgeLabelPosition(
        edge,
        nodesById,
        edgesRef.current,
        connectionStyle,
      );
      if (!position) {
        return;
      }

      const text = getEdgeLabelText(edge);
      const bounds = resolveLabelBounds(edge);
      const width = bounds?.width ?? 72;
      const height = bounds?.height ?? 22;

      setLabelEdit({
        edgeId: edge.id,
        draft: text,
        originalLabel: text,
        x: position.x,
        y: position.y,
        width,
        height,
      });

      patchEdges(
        (currentEdges) =>
          currentEdges.map((item) => {
            const data = (item.data ?? {}) as WorkspaceEdgeData;
            if (item.id === edge.id) {
              return {
                ...item,
                selected: true,
                data: { ...data, editingLabel: true },
              };
            }
            return { ...item, selected: false, data: { ...data, editingLabel: false } };
          }),
        { save: false },
      );
    },
    [connectionStyle, patchEdges],
  );

  const onEdgeDoubleClick = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      event.stopPropagation();
      beginLabelEdit(edge.id);
    },
    [beginLabelEdit],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) => {
        const nextEdges = addEdge(
          normalizeWorkspaceEdge({
            ...connection,
            id: `edge-${crypto.randomUUID()}`,
            type: "workspace",
            data: { label: "" },
          }),
          currentEdges,
        );
        const content = stripLegacyLabelAnchorNodes(nodesRef.current);
        const sanitized = normalizeWorkspaceEdges(nextEdges);
        emitSave(content, sanitized);
        return sanitized;
      });
    },
    [emitSave],
  );

  const onMoveEnd = useCallback(
    (_event: unknown, nextViewport: Viewport) => {
      emitSave(
        nodesRef.current,
        edgesRef.current,
        viewportFromFlow(nextViewport),
        false,
      );
    },
    [emitSave],
  );

  const flowCenter = useCallback(() => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, [screenToFlowPosition]);

  const placeMediaNodes = useCallback(
    (mediaItems: ProjectMedia[], positions: { x: number; y: number }[]) => {
      setNodes((current) => {
        const content = [...stripLegacyLabelAnchorNodes(current)];
        mediaItems.forEach((media, index) => {
          const position = positions[index];
          if (!position) {
            return;
          }
          content.push(
            createMediaNode(position, {
              mediaId: media.mediaId,
              original_filename: media.original_filename,
              media_kind: media.media_kind,
              mime_type: media.mime_type,
            }),
          );
        });
        emitSave(content, edgesRef.current);
        return content;
      });
    },
    [emitSave],
  );

  const { pasteFilesAt } = useWorkspaceCanvasPasteUpload({
    projectId,
    pasteUploadTarget,
    screenToFlowPosition,
    placeMediaNodes,
  });

  useWorkspaceCanvasPasteFocus({
    containerRef: canvasContainerRef,
    onPointerPosition: (position) => {
      canvasPointerRef.current = position;
    },
  });

  const handleAddNote = useCallback(() => {
    const position = flowCenter();
    const note = createNoteNode(position);
    setFilesPanelFocusedMediaId(null);
    setFilesPanelFocusedNoteId(note.id);
    setNodes((current) => {
      const content = [...stripLegacyLabelAnchorNodes(current), note];
      emitSave(content, edgesRef.current);
      return content;
    });
  }, [emitSave, flowCenter, setFilesPanelFocusedMediaId, setFilesPanelFocusedNoteId]);

  const handleCreateNoteFromGrid = useCallback(() => {
    const position = flowCenter();
    const note = createNoteNode(position);
    setFilesPanelFocusedMediaId(null);
    setFilesPanelFocusedNoteId(note.id);
    setNodes((current) => {
      const content = [...stripLegacyLabelAnchorNodes(current), note];
      emitSave(content, edgesRef.current);
      return content;
    });
    return note.id;
  }, [emitSave, flowCenter, setFilesPanelFocusedMediaId, setFilesPanelFocusedNoteId]);

  const handleAddNoteAt = useCallback(
    (clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      const note = createNoteNode(position);
      setFilesPanelFocusedMediaId(null);
      setFilesPanelFocusedNoteId(note.id);
      setNodes((current) => {
        const content = [...stripLegacyLabelAnchorNodes(current), note];
        emitSave(content, edgesRef.current);
        return content;
      });
    },
    [emitSave, screenToFlowPosition, setFilesPanelFocusedMediaId, setFilesPanelFocusedNoteId],
  );

  const openCanvasContextMenu = useCallback(
    (event: ReactMouseEvent | globalThis.MouseEvent) => {
      event.preventDefault();
      contextMenuNotePositionRef.current = { x: event.clientX, y: event.clientY };
      setContextMenu({
        kind: "pane",
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [],
  );

  const showNoteContextMenu = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      if (noteBodyEditingIdRef.current === nodeId) {
        return;
      }
      contextMenuNotePositionRef.current = null;
      setContextMenu({
        kind: "note",
        clientX,
        clientY,
        nodeId,
      });
    },
    [],
  );

  const setNoteBodyEditing = useCallback((nodeId: string | null) => {
    noteBodyEditingIdRef.current = nodeId;
  }, []);

  const openNoteReference = useCallback(
    (noteId: string, origin?: WorkspaceNoteReferenceOrigin) => {
      setNoteReference({ noteId, origin: origin ?? null });
    },
    [],
  );

  const closeNoteReference = useCallback(() => {
    setNoteReference(null);
  }, []);

  const toggleNotesGrid = useCallback(() => {
    setNotesGridOpen((open) => {
      if (!open) {
        setNoteReference(null);
      }
      return !open;
    });
  }, []);

  const closeNotesGrid = useCallback(() => {
    setNotesGridOpen(false);
  }, []);

  const openNoteContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      if (node.type !== "note") {
        return;
      }
      if (noteBodyEditingIdRef.current === node.id) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      showNoteContextMenu(node.id, event.clientX, event.clientY);
    },
    [showNoteContextMenu],
  );

  const deleteNoteNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => {
        const content = stripLegacyLabelAnchorNodes(current).filter(
          (node) => node.id !== nodeId,
        );
        const nextEdges = normalizeWorkspaceEdges(edgesRef.current).filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        );
        setEdges(nextEdges);
        emitSave(content, nextEdges);
        return content;
      });
    },
    [emitSave],
  );

  const createLinkedNote = useCallback(
    (sourceNoteId: string, options: { title: string }) => {
      const title = options.title.trim() || "Note";
      const sourceNode = stripLegacyLabelAnchorNodes(getNodes()).find(
        (node) => node.id === sourceNoteId && node.type === "note",
      );
      const position = sourceNode
        ? {
            x: sourceNode.position.x + 280,
            y: sourceNode.position.y,
          }
        : flowCenter();
      const note = createNoteNode(position, { title, text: "" });

      setFilesPanelFocusedMediaId(null);
      setFilesPanelFocusedNoteId(note.id);
      setNodes((current) => {
        const content = [...stripLegacyLabelAnchorNodes(current), note];
        emitSave(content, edgesRef.current);
        return content;
      });

      return note.id;
    },
    [emitSave, flowCenter, getNodes, setFilesPanelFocusedMediaId, setFilesPanelFocusedNoteId],
  );

  const renameNoteNode = useCallback(
    (nodeId: string, title: string) => {
      const trimmed = title.trim() || "Note";
      setNodes((current) => {
        let changed = false;
        const next = stripLegacyLabelAnchorNodes(current).map((node) => {
          if (node.id !== nodeId || node.type !== "note") {
            return node;
          }

          const data = node.data as WorkspaceNoteData;
          const currentTitle = data.title?.trim() || "Note";
          if (currentTitle === trimmed) {
            return node;
          }

          changed = true;
          return {
            ...node,
            data: {
              ...data,
              title: trimmed,
            },
          };
        });

        if (changed) {
          emitSave(next, edgesRef.current);
        }
        return next;
      });
    },
    [emitSave],
  );

  const toggleNoteVisibility = useCallback(
    (nodeId: string) => {
      setNodes((current) => {
        let changed = false;
        const next = applyWorkspaceNoteHiddenFlags(
          stripLegacyLabelAnchorNodes(current).map((node) => {
            if (node.id !== nodeId || node.type !== "note") {
              return node;
            }

            const data = node.data as WorkspaceNoteData;
            const hidden = !isWorkspaceNoteHidden(data);
            changed = true;
            return {
              ...node,
              hidden,
              selected: hidden ? false : node.selected,
              data: {
                ...data,
                hidden,
              },
            };
          }),
        );

        if (changed) {
          emitSave(next, edgesRef.current);
        }
        return next;
      });
    },
    [emitSave],
  );

  useEffect(() => {
    registerWorkspaceNoteActions({
      addNote: handleAddNote,
      renameNote: renameNoteNode,
      deleteNote: deleteNoteNode,
      toggleNoteVisibility,
    });

    return () => registerWorkspaceNoteActions(null);
  }, [deleteNoteNode, handleAddNote, registerWorkspaceNoteActions, renameNoteNode, toggleNoteVisibility]);

  const handleContextMenuAddNote = useCallback(() => {
    const point = contextMenuNotePositionRef.current;
    if (point) {
      handleAddNoteAt(point.x, point.y);
    } else {
      handleAddNote();
    }
    contextMenuNotePositionRef.current = null;
  }, [handleAddNote, handleAddNoteAt]);

  const placeMediaNode = useCallback(
    (payload: WorkspaceMediaDragPayload, clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      setNodes((current) => {
        const content = [
          ...stripLegacyLabelAnchorNodes(current),
          createMediaNode(position, {
            mediaId: payload.mediaId,
            original_filename: payload.original_filename,
            media_kind: payload.media_kind,
            mime_type: payload.mime_type,
          }),
        ];
        emitSave(content, edgesRef.current);
        return content;
      });
      endWorkspaceMediaDrag();
    },
    [emitSave, screenToFlowPosition],
  );

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) {
      return;
    }

    registerWorkspaceMediaDropTarget(container, placeMediaNode);

    return () => {
      registerWorkspaceMediaDropTarget(null, null);
    };
  }, [placeMediaNode]);

  const handleFitView = useCallback(() => {
    void fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleCopySelection = useCallback(() => {
    const payload = copyWorkspaceSelection(getNodes(), getEdges());
    if (!payload) {
      return;
    }
    clipboardRef.current = payload;
    pasteGenerationRef.current = 1;
    const serialized = serializeWorkspaceClipboard(payload);
    void navigator.clipboard?.writeText(serialized).catch(() => {
      /* System clipboard is optional; in-memory ref still works for paste. */
    });
  }, [getNodes, getEdges]);

  const resolvePasteAnchor = useCallback(
    (clientX: number, clientY: number) => {
      return screenToFlowPosition({ x: clientX, y: clientY });
    },
    [screenToFlowPosition],
  );

  const applyPastedWorkspace = useCallback(
    (payload: WorkspaceClipboardPayload, anchor: { x: number; y: number }) => {
      const generation = pasteGenerationRef.current;
      const pasted = pasteWorkspaceClipboard(
        payload,
        pasteOffsetAnchoredAt(payload, anchor, generation),
      );
      pasteGenerationRef.current = generation + 1;

      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const merged = mergePastedWorkspace(
        stripLegacyLabelAnchorNodes(currentNodes),
        currentEdges,
        pasted,
      );
      const contentNodes = stripLegacyLabelAnchorNodes(merged.nodes);
      const sanitizedEdges = normalizeWorkspaceEdges(merged.edges);
      setNodes(contentNodes);
      setEdges(sanitizedEdges);
      emitSave(contentNodes, sanitizedEdges);
    },
    [emitSave, getEdges, getNodes],
  );

  const handlePasteTextAt = useCallback(
    (text: string, clientX: number, clientY: number) => {
      const position = resolvePasteAnchor(clientX, clientY);
      setNodes((current) => {
        const content = [
          ...stripLegacyLabelAnchorNodes(current),
          createNoteNode(position, { text }),
        ];
        emitSave(content, edgesRef.current);
        return content;
      });
    },
    [emitSave, resolvePasteAnchor],
  );

  const handleCanvasPaste = useCallback(
    (event: ClipboardEvent) => {
      if (isEditablePasteTarget(event.target)) {
        return;
      }

      const container = canvasContainerRef.current;
      if (!container) {
        return;
      }

      const tracked = canvasPointerRef.current;
      const pointer =
        tracked && isPointerOverElement(container, tracked.x, tracked.y)
          ? tracked
          : clientPointInElementCenter(container);

      const dataTransfer = event.clipboardData;
      if (!dataTransfer) {
        return;
      }

      const files = readClipboardFiles(dataTransfer);
      if (files.length > 0) {
        if (!isWorkspaceCanvasPasteTarget()) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        void pasteFilesAt(files, pointer.x, pointer.y);
        return;
      }

      const plain = dataTransfer.getData("text/plain");
      const workspacePayload = plain ? parseWorkspaceClipboard(plain) : null;
      if (workspacePayload?.nodes.length) {
        event.preventDefault();
        clipboardRef.current = workspacePayload;
        applyPastedWorkspace(workspacePayload, resolvePasteAnchor(pointer.x, pointer.y));
        return;
      }

      const text = readClipboardPlainText(dataTransfer);
      if (text) {
        event.preventDefault();
        handlePasteTextAt(text, pointer.x, pointer.y);
        return;
      }

      const fallback = clipboardRef.current;
      if (fallback?.nodes.length) {
        event.preventDefault();
        applyPastedWorkspace(fallback, resolvePasteAnchor(pointer.x, pointer.y));
      }
    },
    [
      applyPastedWorkspace,
      handlePasteTextAt,
      pasteFilesAt,
      resolvePasteAnchor,
    ],
  );

  const trackCanvasPointer = useCallback((event: ReactMouseEvent) => {
    canvasPointerRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && key === "c") {
        const selectedCount = getNodes().filter((node) => node.selected).length;
        if (selectedCount > 0) {
          event.preventDefault();
          handleCopySelection();
        }
        return;
      }
      if (mod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (mod && (key === "y" || (key === "z" && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopySelection, handleRedo, handleUndo, getNodes]);

  useEffect(() => {
    window.addEventListener("paste", handleCanvasPaste, true);
    return () => window.removeEventListener("paste", handleCanvasPaste, true);
  }, [handleCanvasPaste]);

  const defaultViewport = useMemo(
    () => initialState.viewport,
    [initialState.viewport],
  );

  const isEmpty = nodes.length === 0;

  const isEditingEdgeLabel = labelEdit !== null;
  const canvasTone = WORKSPACE_CANVAS_COLOR_SPECS[canvasColorPreset];
  const canvasDotColor = resolveWorkspaceCanvasDotColor(
    canvasColorPreset,
    gridDotStrength,
  );

  const onPaneClick = useCallback(() => {
    const session = labelEditRef.current;
    if (session) {
      const input = document.querySelector<HTMLInputElement>(
        "[data-workspace-edge-label-input='true']",
      );
      commitLabelEdit(session.draft, {
        width: input ? Math.ceil(input.offsetWidth) : undefined,
        height: input ? Math.ceil(input.offsetHeight) : undefined,
      });
      return;
    }

    setWorkspaceCanvasPasteTarget(true);
    setFilesPanelFocusedMediaId(null);
    setFilesPanelFocusedNoteId(null);
    setNoteReference(null);
    setNotesGridOpen(false);
  }, [commitLabelEdit, setFilesPanelFocusedMediaId, setFilesPanelFocusedNoteId]);

  return (
    <WorkspaceCanvasProvider
      projectId={projectId}
      requestSave={requestSave}
      onSelectNoteColor={handleSelectNoteColor}
      patchEdges={patchEdges}
      beginLabelEdit={beginLabelEdit}
      openNoteContextMenu={showNoteContextMenu}
      openNoteReference={openNoteReference}
      deleteNote={deleteNoteNode}
      createLinkedNote={createLinkedNote}
      setNoteBodyEditing={setNoteBodyEditing}
      filesPanelFocusedMediaId={filesPanelFocusedMediaId}
      filesPanelFocusedNoteId={filesPanelFocusedNoteId}
      textFontScale={textFontScale}
      connectionStyle={connectionStyle}
      noteColorStyle={noteColorStyle}
      noteItalicColor={noteItalicColor}
    >
      <div
        ref={canvasContainerRef}
        className="relative h-full w-full"
        onMouseMove={trackCanvasPointer}
      >
        <WorkspaceToolbar
          onFitView={handleFitView}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          notesGridOpen={notesGridOpen}
          onToggleNotesGrid={toggleNotesGrid}
          snapEnabled={snapEnabled}
          onToggleSnap={handleToggleSnap}
          saveStatus={status}
          onRetrySave={retry}
        />

        {overlay ? (
          <div className="pointer-events-none absolute inset-0 z-10">{overlay}</div>
        ) : null}

        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
            <p className="rounded-lg border border-stone-800/60 bg-stone-950/60 px-4 py-2 text-sm text-stone-500 backdrop-blur-sm">
              Right-click to add a note, drag files from the panel, or paste text and files at the cursor (⌘V).
            </p>
          </div>
        )}

        <WorkspaceCanvasContextMenu
          menu={contextMenu}
          onClose={() => {
            setContextMenu(null);
            contextMenuNotePositionRef.current = null;
          }}
          onAddNote={handleContextMenuAddNote}
          onDeleteNote={deleteNoteNode}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onPaneClick={onPaneClick}
          onNodeClick={() => setWorkspaceCanvasPasteTarget(true)}
          onMoveEnd={onMoveEnd}
          onPaneContextMenu={openCanvasContextMenu}
          onNodeContextMenu={openNoteContextMenu}
          onEdgeContextMenu={openCanvasContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={80}
          elevateEdgesOnSelect
          elementsSelectable
          selectNodesOnDrag={false}
          edgesFocusable
          defaultViewport={defaultViewport}
          defaultEdgeOptions={{
            type: "workspace",
            data: { label: "" },
          }}
          connectionLineComponent={WorkspaceConnectionLine}
          minZoom={0.1}
          maxZoom={2}
          fitView={false}
          zoomOnDoubleClick={false}
          deleteKeyCode={["Backspace", "Delete"]}
          className={[
            "workspace-project-canvas",
            isEditingEdgeLabel ? "workspace-edge-label-editing" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ backgroundColor: canvasTone.background }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={canvasTone.dotGap}
            size={canvasTone.dotSize}
            color={canvasDotColor}
          />
          <Controls className="!border-stone-700 !bg-stone-950/90 !shadow-lg [&>button]:!border-stone-700 [&>button]:!bg-stone-900 [&>button]:!fill-stone-300 [&>button:hover]:!bg-stone-800" />
          {minimapOpen ? (
            <MiniMap
              className="!border-stone-700 !bg-stone-950/90"
              nodeColor="#52525b"
              maskColor="rgba(5, 7, 5, 0.75)"
            />
          ) : null}
          <WorkspaceEdgeLabelBackdrops
            nodes={nodes}
            edges={edges}
            editingEdgeId={labelEdit?.edgeId ?? null}
          />
          <WorkspaceSnapThread candidate={snapCandidate} />
          {labelEdit ? (
            <WorkspaceEdgeLabelEditor
              session={labelEdit}
              onDraftChange={(draft) =>
                setLabelEdit((current) => (current ? { ...current, draft } : current))
              }
              onLayoutChange={(width, height) => {
                setLabelEdit((current) =>
                  current ? { ...current, width, height } : current,
                );
                const edgeId = labelEditRef.current?.edgeId;
                if (!edgeId) {
                  return;
                }
                patchEdges(
                  (currentEdges) =>
                    currentEdges.map((item) => {
                      if (item.id !== edgeId) {
                        return item;
                      }
                      const data = (item.data ?? {}) as WorkspaceEdgeData;
                      return {
                        ...item,
                        data: { ...data, labelWidth: width, labelHeight: height },
                      };
                    }),
                  { save: false },
                );
              }}
              onCommit={commitLabelEdit}
              onCancel={cancelLabelEdit}
            />
          ) : null}
        </ReactFlow>

        <AnimatePresence>
          {noteReference ? (
            <WorkspaceNoteReferenceModal
              key={noteReference.noteId}
              noteId={noteReference.noteId}
              origin={noteReference.origin}
              onClose={closeNoteReference}
            />
          ) : null}
          {notesGridOpen ? (
            <WorkspaceNotesGridOverlay
              key="notes-grid-overlay"
              savedLayout={notesGridLayout}
              onLayoutChange={onNotesGridLayoutChange}
              onCreateNote={handleCreateNoteFromGrid}
              onClose={closeNotesGrid}
              edgeColor={canvasDotColor}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </WorkspaceCanvasProvider>
  );
}

export function ProjectWorkspaceCanvas(props: ProjectWorkspaceCanvasProps) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <ProjectWorkspaceCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}

export type { ProjectWorkspaceCanvasProps };
