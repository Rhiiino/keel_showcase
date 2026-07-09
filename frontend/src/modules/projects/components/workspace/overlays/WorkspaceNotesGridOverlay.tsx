// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceNotesGridOverlay.tsx

// Full-screen grid view of all workspace note cards with elastic tile resize.

import { useStore } from "@xyflow/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  isNonOverlappingLayout,
  isPackedLayout,
  rectEndY,
  type ResizeEdge,
} from "../../../../media/lib/panelGrid";
import {
  panelGridDisplayRowUnitPx,
  PANEL_GRID_GAP_PX,
} from "../../../../media/lib/panelGridMetrics";
import { repackPanelGrid } from "../../../../media/lib/panelGridReflow";
import {
  useWorkspaceNotesGridResize,
  type WorkspaceNotesGridResizePreview,
} from "../../../hooks/useWorkspaceNotesGridResize";
import type { WorkspaceNoteData } from "../../../lib/workspace";
import { isWorkspaceNoteHidden } from "../../../lib/workspace";
import { resolveWorkspaceNoteNode } from "../../../lib/workspace/note";
import {
  collectNotesGridMeasuresFromLayer,
  WORKSPACE_NOTES_GRID_MEASURE_COL_SPANS,
} from "../../../lib/workspace/note/workspaceNotesGridMeasure";
import {
  buildFitNotesGridPlacements,
  convertNotesGridPlacementsToPersistedRowUnit,
  normalizeNotesGridPlacements,
  notesGridLayoutLooksCollapsed,
  notesGridTileWidthPx,
  placementsEqual,
  syncNotesGridPlacements,
  WORKSPACE_NOTES_GRID_COLUMN_COUNT,
  WORKSPACE_NOTES_GRID_INNER_SHELL_PADDING_PX,
  WORKSPACE_NOTES_GRID_PERSISTED_ROW_UNIT_PX,
  type WorkspaceNotesGridPlacement,
} from "../../../lib/workspace/note/workspaceNotesGridLayout";
import { useWorkspaceNotesGridEdgeProximity } from "../../../hooks/useWorkspaceNotesGridEdgeProximity";
import { useWorkspaceNotesGridSplitAdd } from "../../../hooks/useWorkspaceNotesGridSplitAdd";
import { useWorkspaceNotesGridSwap } from "../../../hooks/useWorkspaceNotesGridSwap";
import { buildWorkspaceNotesGridContextMenuActions } from "../../../lib/workspace/note/workspaceNotesGridContextMenuActions";
import { useWorkspaceDeleteNote } from "../context/WorkspaceCanvasContext";
import { workspaceNoteReferenceBackdropTransition } from "./workspaceNoteReferenceMotion";
import { WorkspaceEditableNoteCard } from "./WorkspaceEditableNoteCard";
import {
  WorkspaceNotesGridContextMenu,
  type WorkspaceNotesGridContextMenuState,
} from "./WorkspaceNotesGridContextMenu";
import { WorkspaceNotesGridResizeEdges } from "./WorkspaceNotesGridResizeEdges";
import { WorkspaceNotesGridTile } from "./WorkspaceNotesGridTile";

type WorkspaceNotesGridOverlayProps = {
  savedLayout: WorkspaceNotesGridPlacement[] | null;
  onLayoutChange: (placements: WorkspaceNotesGridPlacement[]) => void;
  onCreateNote: () => string;
  onClose: () => void;
  edgeColor: string;
};

function resolvePersistedNotesGridLayout(
  nextPlacements: WorkspaceNotesGridPlacement[],
  fallback: WorkspaceNotesGridPlacement[],
  columnCount: number,
): WorkspaceNotesGridPlacement[] | null {
  const alreadyValid =
    isNonOverlappingLayout(nextPlacements, columnCount) &&
    isPackedLayout(nextPlacements, columnCount);
  const normalized = alreadyValid
    ? nextPlacements
    : normalizeNotesGridPlacements(nextPlacements);

  if (isNonOverlappingLayout(normalized, columnCount)) {
    return normalized;
  }

  const repacked = repackPanelGrid(normalized, columnCount) as WorkspaceNotesGridPlacement[];
  if (isNonOverlappingLayout(repacked, columnCount)) {
    return repacked;
  }

  return fallback.length > 0 &&
    isNonOverlappingLayout(fallback, columnCount)
    ? fallback
    : null;
}

function bottomResizeOverflowPx(
  resizePreview: WorkspaceNotesGridResizePreview | null,
  placements: WorkspaceNotesGridPlacement[],
): number {
  if (!resizePreview?.edge.includes("s")) {
    return 0;
  }

  const maxRow = placements.reduce((max, item) => Math.max(max, rectEndY(item)), 0);
  const target = placements.find((item) => item.id === resizePreview.itemId);
  if (!target || rectEndY(target) < maxRow) {
    return 0;
  }

  return Math.max(0, resizePreview.offsetY);
}

function NotesGridEditModeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function WorkspaceNotesGridOverlay({
  savedLayout,
  onLayoutChange,
  onCreateNote,
  onClose,
  edgeColor,
}: WorkspaceNotesGridOverlayProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellSize, setShellSize] = useState({ width: 0, height: 0 });
  const [gridAreaSize, setGridAreaSize] = useState({ width: 0, height: 0 });
  const [placements, setPlacements] = useState<WorkspaceNotesGridPlacement[]>([]);
  const [gridWidthPx, setGridWidthPx] = useState(0);
  const [fitLayoutGeneration, setFitLayoutGeneration] = useState(0);
  const appliedFitGenerationRef = useRef(0);
  const onLayoutChangeRef = useRef(onLayoutChange);
  onLayoutChangeRef.current = onLayoutChange;
  const savedLayoutRef = useRef(savedLayout);
  savedLayoutRef.current = savedLayout;
  const isResizingRef = useRef(false);
  const measureLayerRef = useRef<HTMLDivElement>(null);
  const savedLayoutKey =
    savedLayout
      ?.map(
        (item) =>
          `${item.id}:${item.grid_x},${item.grid_y},${item.col_span},${item.row_span}`,
      )
      .join("|") ?? "";
  const [contextMenu, setContextMenu] = useState<WorkspaceNotesGridContextMenuState>(null);
  const [gridEditMode, setGridEditMode] = useState(false);
  const [pendingFocusNoteId, setPendingFocusNoteId] = useState<string | null>(null);
  const [layoutEstablished, setLayoutEstablished] = useState(() => Boolean(savedLayoutKey));
  const onCreateNoteRef = useRef(onCreateNote);
  onCreateNoteRef.current = onCreateNote;
  const deleteNote = useWorkspaceDeleteNote();

  const noteNodes = useStore(
    (state) =>
      state.nodes.filter(
        (node) => node.type === "note" && !isWorkspaceNoteHidden(node.data as WorkspaceNoteData),
      ),
    (left, right) =>
      left.length === right.length &&
      left.every((node, index) => node.id === right[index]?.id && node === right[index]),
  );
  const noteIds = useMemo(() => noteNodes.map((node) => node.id), [noteNodes]);
  const noteIdsKey = noteIds.join("|");
  const randomLayoutRef = useRef<{
    noteIdsKey: string;
    layout: WorkspaceNotesGridPlacement[];
  } | null>(null);

  const gridContentWidthPx = useMemo(() => {
    if (gridAreaSize.width > 0) {
      return Math.max(0, gridAreaSize.width - WORKSPACE_NOTES_GRID_INNER_SHELL_PADDING_PX * 2);
    }
    if (shellSize.width <= 0) {
      return 0;
    }
    return Math.max(0, shellSize.width - WORKSPACE_NOTES_GRID_INNER_SHELL_PADDING_PX * 2);
  }, [gridAreaSize.width, shellSize.width]);

  const gridInnerHeightPx = useMemo(() => {
    if (gridAreaSize.height > 0) {
      return Math.max(0, gridAreaSize.height - WORKSPACE_NOTES_GRID_INNER_SHELL_PADDING_PX * 2);
    }
    if (shellSize.height <= 0) {
      return 0;
    }
    return Math.max(0, shellSize.height - WORKSPACE_NOTES_GRID_INNER_SHELL_PADDING_PX * 2);
  }, [gridAreaSize.height, shellSize.height]);

  const gridViewportHeightPx = gridInnerHeightPx;

  const shouldRunManualFit = fitLayoutGeneration > appliedFitGenerationRef.current;
  const needsInitialFitLayout =
    !layoutEstablished && placements.length === 0 && !savedLayoutKey && !shouldRunManualFit;
  const showMeasureLayer =
    noteNodes.length > 0 &&
    gridViewportHeightPx > 0 &&
    gridContentWidthPx > 0 &&
    (shouldRunManualFit || needsInitialFitLayout);

  useLayoutEffect(() => {
    const runInitialFit = needsInitialFitLayout;
    const runManualFit = shouldRunManualFit;
    if ((!runInitialFit && !runManualFit) || isResizingRef.current) {
      return;
    }
    if (noteNodes.length === 0 || gridViewportHeightPx <= 0 || gridContentWidthPx <= 0) {
      return;
    }

    const layer = measureLayerRef.current;
    if (!layer) {
      return;
    }

    const measures = collectNotesGridMeasuresFromLayer(layer);
    if (measures.length !== noteNodes.length) {
      return;
    }

    const fit = buildFitNotesGridPlacements({
      notes: measures,
      viewportWidthPx: gridContentWidthPx,
      viewportHeightPx: gridViewportHeightPx,
    });
    const persisted = convertNotesGridPlacementsToPersistedRowUnit(fit, gridViewportHeightPx);

    if (runManualFit) {
      appliedFitGenerationRef.current = fitLayoutGeneration;
    }

    randomLayoutRef.current = { noteIdsKey, layout: persisted };
    setLayoutEstablished(true);
    setPlacements((current) => (placementsEqual(current, persisted) ? current : persisted));
    onLayoutChangeRef.current(persisted);
  }, [
    fitLayoutGeneration,
    gridContentWidthPx,
    gridViewportHeightPx,
    needsInitialFitLayout,
    noteIdsKey,
    noteNodes.length,
    shouldRunManualFit,
  ]);

  const persistLayout = useCallback(
    (nextPlacements: WorkspaceNotesGridPlacement[]) => {
      const resolved = resolvePersistedNotesGridLayout(
        nextPlacements,
        placements,
        WORKSPACE_NOTES_GRID_COLUMN_COUNT,
      );
      if (!resolved) {
        return;
      }

      setLayoutEstablished(true);
      setPlacements(resolved);
      randomLayoutRef.current = {
        noteIdsKey: resolved.map((item) => item.id).join("|"),
        layout: resolved,
      };
      onLayoutChangeRef.current(resolved);
    },
    [placements],
  );

  const {
    swapSourceId,
    hoverTargetId,
    isSwapMode,
    startSwap,
    cancelSwap,
    completeSwap,
    setHoverTargetId,
  } = useWorkspaceNotesGridSwap({ onPersist: persistLayout });

  const { draftPlacements, isResizing, resizePreview, startResize, setGridWidth } =
    useWorkspaceNotesGridResize({
      onPersist: persistLayout,
    });

  const activePlacements = draftPlacements ?? placements;
  const isResizingTile = resizePreview !== null || isResizing;
  isResizingRef.current = isResizing;

  const activeMaxRow = useMemo(
    () => activePlacements.reduce((max, item) => Math.max(max, rectEndY(item)), 0),
    [activePlacements],
  );
  const gridRowCount = Math.max(activeMaxRow, 1);

  const rowUnitPx = useMemo(() => {
    if (gridInnerHeightPx <= 0) {
      return WORKSPACE_NOTES_GRID_PERSISTED_ROW_UNIT_PX;
    }
    return panelGridDisplayRowUnitPx(gridInnerHeightPx, gridRowCount, 0, PANEL_GRID_GAP_PX);
  }, [gridInnerHeightPx, gridRowCount]);

  const resizeDisplayMetricsRef = useRef<{ rowUnitPx: number } | null>(null);

  useLayoutEffect(() => {
    if (isResizing) {
      if (!resizeDisplayMetricsRef.current) {
        resizeDisplayMetricsRef.current = { rowUnitPx };
      }
      return;
    }
    resizeDisplayMetricsRef.current = null;
  }, [isResizing, rowUnitPx]);

  const displayRowUnitPx = resizeDisplayMetricsRef.current?.rowUnitPx ?? rowUnitPx;

  const { nearSegmentId, handlePointerMove, handlePointerLeave } =
    useWorkspaceNotesGridEdgeProximity({
      placements: activePlacements,
      columnCount: WORKSPACE_NOTES_GRID_COLUMN_COUNT,
      rowUnitPx: displayRowUnitPx,
      gridWidth: gridWidthPx,
      disabled: isResizingTile || isSwapMode,
    });

  const handleFocusNewNote = useCallback((noteId: string) => {
    setPendingFocusNoteId(noteId);
  }, []);

  const { handleSplitAdd } = useWorkspaceNotesGridSplitAdd({
    placements: activePlacements,
    onCreateNote: () => onCreateNoteRef.current(),
    onPersist: persistLayout,
    onFocusNewNote: handleFocusNewNote,
  });

  useEffect(() => {
    if (isResizingRef.current) {
      return;
    }

    const ids = noteIdsKey.length > 0 ? noteIdsKey.split("|") : [];

    if (ids.length === 0) {
      setPlacements((current) => (current.length === 0 ? current : []));
      randomLayoutRef.current = null;
      return;
    }

    const sessionLayout = randomLayoutRef.current;
    if (sessionLayout?.noteIdsKey === noteIdsKey) {
      const normalized = normalizeNotesGridPlacements(sessionLayout.layout);
      setPlacements((current) => (placementsEqual(current, normalized) ? current : normalized));
      return;
    }

    if (savedLayoutKey) {
      const stored = savedLayoutRef.current;
      if (stored && stored.length > 0) {
        if (gridInnerHeightPx <= 0) {
          return;
        }

        if (notesGridLayoutLooksCollapsed(stored, gridInnerHeightPx)) {
          setFitLayoutGeneration((current) => current + 1);
          return;
        }

        const synced = normalizeNotesGridPlacements(syncNotesGridPlacements(ids, stored) ?? []);
        randomLayoutRef.current = { noteIdsKey, layout: synced };
        setLayoutEstablished(true);
        setPlacements((current) => (placementsEqual(current, synced) ? current : synced));
      }
    }
  }, [gridInnerHeightPx, noteIdsKey, savedLayoutKey]);

  const gridResizeOverflowBottomPx = bottomResizeOverflowPx(resizePreview, activePlacements);

  useEffect(() => {
    const shellNode = shellRef.current;
    if (!shellNode) {
      return;
    }

    const updateSize = () => {
      setShellSize({
        width: shellNode.clientWidth,
        height: shellNode.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(shellNode);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const gridAreaNode = gridAreaRef.current;
    if (!gridAreaNode) {
      return;
    }

    const updateSize = () => {
      setGridAreaSize({
        width: gridAreaNode.clientWidth,
        height: gridAreaNode.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(gridAreaNode);
    return () => observer.disconnect();
  }, [placements.length, shouldRunManualFit]);

  useEffect(() => {
    const gridNode = gridRef.current;
    if (!gridNode) {
      return;
    }

    const updateWidth = () => {
      const width = Math.max(0, gridNode.clientWidth);
      setGridWidth(width);
      setGridWidthPx(width);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(gridNode);
    return () => observer.disconnect();
  }, [setGridWidth, activePlacements.length, placements.length]);

  const handleAutoFit = useCallback(() => {
    setFitLayoutGeneration((current) => current + 1);
  }, []);

  const handleToggleGridEditMode = useCallback(() => {
    setGridEditMode((current) => !current);
  }, []);

  useEffect(() => {
    if (gridEditMode) {
      return;
    }
    cancelSwap();
    setContextMenu(null);
  }, [cancelSwap, gridEditMode]);

  const handleClose = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
    window.requestAnimationFrame(() => {
      onClose();
    });
  }, [onClose]);

  const handleOpenContextMenu = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      if (!gridEditMode || isResizingTile || isSwapMode) {
        return;
      }
      setContextMenu({ noteId, clientX, clientY });
    },
    [gridEditMode, isResizingTile, isSwapMode],
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      deleteNote(noteId);
      const nextPlacements = activePlacements.filter((item) => item.id !== noteId);
      if (nextPlacements.length !== activePlacements.length) {
        persistLayout(nextPlacements);
      }
    },
    [activePlacements, deleteNote, persistLayout],
  );

  const contextMenuActions = useMemo(() => {
    if (!contextMenu) {
      return [];
    }
    return buildWorkspaceNotesGridContextMenuActions({
      onSwap: () => {
        startSwap(contextMenu.noteId);
      },
      onDelete: () => {
        handleDeleteNote(contextMenu.noteId);
      },
    });
  }, [contextMenu, handleDeleteNote, startSwap]);

  const handleSwapSelect = useCallback(
    (targetId: string) => {
      completeSwap(activePlacements, targetId);
    },
    [activePlacements, completeSwap],
  );

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, [contenteditable='true']") ||
          target.closest("[role='listbox']"))
      ) {
        return;
      }
      if (contextMenu) {
        setContextMenu(null);
        return;
      }
      if (isSwapMode) {
        cancelSwap();
        return;
      }
      handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelSwap, contextMenu, handleClose, isSwapMode]);

  const handleResizeStart = useCallback(
    (
      itemId: string,
      edge: ResizeEdge,
      clientX: number,
      clientY: number,
      pointerId: number,
      boundarySegmentId?: string,
    ) => {
      startResize(
        activePlacements,
        itemId,
        edge,
        clientX,
        clientY,
        pointerId,
        {
          columnCount: WORKSPACE_NOTES_GRID_COLUMN_COUNT,
          rowUnitPx: displayRowUnitPx,
          gridWidth: gridWidthPx,
        },
        boundarySegmentId,
      );
    },
    [activePlacements, displayRowUnitPx, gridWidthPx, startResize],
  );

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Notes grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={workspaceNoteReferenceBackdropTransition()}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 px-6 py-4">
        <div>
          <h2 className="text-sm font-medium text-stone-100">Notes grid</h2>
          <p className="text-xs text-stone-400">
            {isSwapMode
              ? "Swap mode — click another tile to swap positions and sizes · Esc to cancel"
              : gridEditMode
                ? `${noteNodes.length} note${noteNodes.length === 1 ? "" : "s"} · edit mode — hover a tile edge to add · right-click a tile for swap or delete · move the cursor near a grid edge to resize · layout is saved after you resize, add, or swap · use Auto fit to fit everything in view`
                : `${noteNodes.length} note${noteNodes.length === 1 ? "" : "s"} · click tiles to edit notes · turn on edit mode to add, swap, or delete tiles · move the cursor near a grid edge to resize · use Auto fit to fit everything in view`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleGridEditMode}
            disabled={noteNodes.length === 0}
            aria-label={gridEditMode ? "Exit grid edit mode" : "Enter grid edit mode"}
            aria-pressed={gridEditMode}
            title={
              gridEditMode
                ? "Edit mode on — add, swap, or delete tiles"
                : "Edit mode off — enable to add, swap, or delete tiles"
            }
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 transition disabled:cursor-not-allowed disabled:opacity-50",
              gridEditMode
                ? "bg-sky-950/60 text-sky-300 ring-sky-500/60 hover:bg-sky-900/60"
                : "bg-stone-900/80 text-stone-400 ring-stone-700 hover:bg-stone-800 hover:text-stone-200",
            ].join(" ")}
          >
            <NotesGridEditModeIcon />
          </button>
          <button
            type="button"
            onClick={handleAutoFit}
            disabled={noteNodes.length === 0}
            className="rounded-md bg-stone-900/80 px-3 py-1.5 text-sm text-stone-200 ring-1 ring-stone-700 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auto fit
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md bg-stone-900/80 px-3 py-1.5 text-sm text-stone-200 ring-1 ring-stone-700 hover:bg-stone-800"
          >
            Close
          </button>
        </div>
      </header>

      <div ref={shellRef} className="min-h-0 flex-1 px-6 pb-6">
        {noteNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-stone-700/80 bg-stone-950/40 p-8 text-center text-sm text-stone-400">
            No notes on this canvas yet. Add notes on the canvas, then open Grid again.
          </div>
        ) : (
          <div
            ref={gridAreaRef}
            className={[
              "h-full w-full rounded-xl border border-white/[0.08] bg-stone-950/20 p-2",
              isResizingTile ? "overflow-visible" : "overflow-hidden",
            ].join(" ")}
            style={
              gridResizeOverflowBottomPx > 0
                ? { paddingBottom: 8 + gridResizeOverflowBottomPx }
                : undefined
            }
          >
            {placements.length === 0 && needsInitialFitLayout ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-stone-400">
                Arranging notes to fit the grid…
              </div>
            ) : (
              <div
                ref={gridRef}
                data-notes-grid
                className={[
                  "relative grid min-h-0 w-full gap-1.5",
                  isResizingTile ? "overflow-visible" : "overflow-hidden",
                ].join(" ")}
                style={{
                  minHeight: gridInnerHeightPx > 0 ? gridInnerHeightPx : undefined,
                  height: gridInnerHeightPx > 0 ? gridInnerHeightPx : undefined,
                  gridTemplateColumns: `repeat(${WORKSPACE_NOTES_GRID_COLUMN_COUNT}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridRowCount}, ${displayRowUnitPx}px)`,
                }}
                onPointerMove={handlePointerMove}
                onPointerMoveCapture={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                {activePlacements.map((placement) => {
                  const node = resolveWorkspaceNoteNode(noteNodes, placement.id);
                  if (!node) {
                    return null;
                  }
                  const data = node.data as WorkspaceNoteData;

                  return (
                    <WorkspaceNotesGridTile
                      key={placement.id}
                      placement={placement}
                      data={data}
                      resizePreview={resizePreview}
                      allowTileScroll
                      swapSourceId={gridEditMode ? swapSourceId : null}
                      swapHoverTargetId={gridEditMode ? hoverTargetId : null}
                      addZonesDisabled={!gridEditMode || isResizingTile || isSwapMode}
                      autoFocusTitle={pendingFocusNoteId === placement.id}
                      onSwapHover={gridEditMode ? setHoverTargetId : undefined}
                      onSwapSelect={gridEditMode ? handleSwapSelect : undefined}
                      onSwapContextMenu={gridEditMode ? handleOpenContextMenu : undefined}
                      onSplitAdd={gridEditMode ? handleSplitAdd : undefined}
                    />
                  );
                })}
                {!isSwapMode ? (
                  <WorkspaceNotesGridResizeEdges
                    placements={activePlacements}
                    columnCount={WORKSPACE_NOTES_GRID_COLUMN_COUNT}
                    rowUnitPx={displayRowUnitPx}
                    gridWidth={gridWidthPx}
                    edgeColor={edgeColor}
                    nearSegmentId={nearSegmentId}
                    resizePreview={resizePreview}
                    onResizeStart={handleResizeStart}
                  />
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  return createPortal(
    <>
      {showMeasureLayer ? (
        <div
          ref={measureLayerRef}
          aria-hidden
          className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] opacity-0"
        >
          {noteNodes.flatMap((node) => {
            const data = node.data as WorkspaceNoteData;
            return WORKSPACE_NOTES_GRID_MEASURE_COL_SPANS.map((colSpan) => (
              <div
                key={`${node.id}-${colSpan}`}
                data-notes-grid-measure-id={node.id}
                data-notes-grid-measure-col-span={colSpan}
                style={{ width: notesGridTileWidthPx(colSpan, gridContentWidthPx) }}
              >
                <WorkspaceEditableNoteCard
                  noteId={node.id}
                  data={data}
                  minWidth={0}
                  fillHeight={false}
                  fitContent
                />
              </div>
            ));
          })}
        </div>
      ) : null}
      {overlay}
      <WorkspaceNotesGridContextMenu
        menu={contextMenu}
        actions={contextMenuActions}
        onClose={() => setContextMenu(null)}
      />
    </>,
    document.body,
  );
}
