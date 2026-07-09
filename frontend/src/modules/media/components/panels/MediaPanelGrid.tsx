// keel_web/src/modules/media/components/panels/MediaPanelGrid.tsx

// Full-bleed CSS grid container for panel tiles.

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { MediaObject, MediaPanelDetail, MediaPanelItem } from "../../api";
import type { ResizePreview } from "../../hooks/useMediaPanelGridResize";
import type { PanelPlacement, ResizeEdge } from "../../lib/panelGrid";
import { rectEndY } from "../../lib/panelGrid";
import {
  panelGridAddZoneHeightPx,
  panelGridEdgeAppendColSpan,
  panelGridEdgeBandWidthPx,
  panelGridEmptyShellMinHeightPx,
  panelGridGapAppendPlacement,
  panelGridOuterBottomMarginPx,
  panelGridViewportContentHeightPx,
  PANEL_EMPTY_SHELL_BAND_ROWS,
  PANEL_GRID_ADD_ZONE_HOVER_PROXIMITY_PX,
  PANEL_GRID_SHELL_PADDING_PX,
  PANEL_VIEWPORT_HANDLE_HEIGHT_PX,
  type PanelGapAppendPlacement,
} from "../../lib/panelGridMetrics";
import {
  computeEdgeAppendPlans,
  type PanelAddEdge,
  type PanelEdgeAppendPlan,
} from "../../lib/panelGridEdgeAppend";
import type { SplitZone } from "../../lib/panelGridSplit";
import type { PanelTilePreview } from "../../lib/panelTilePreview";
import { MediaPanelTile } from "./MediaPanelTile";
import { MediaPanelViewportHandle } from "./MediaPanelViewportHandle";

type MediaPanelGridProps = {
  panel: MediaPanelDetail;
  items: MediaPanelItem[];
  editMode: boolean;
  displayRowUnitPx?: number;
  viewportHeightPx?: number;
  isViewportResizing?: boolean;
  onViewportResizeStart?: (clientY: number, pointerId: number) => void;
  resizePreview?: ResizePreview | null;
  isTileResizing?: boolean;
  flippedItemId?: string | null;
  onFlippedChange?: (itemId: string | null) => void;
  swapSourceId?: string | null;
  swapAnimatingIds?: string[] | null;
  swapAnimPhase?: "shrink" | "expand" | null;
  splitPickerItemId?: string | null;
  splitPickerZone?: SplitZone | null;
  excludeMediaIds?: string[];
  getItemPreview: (item: MediaPanelItem) => PanelTilePreview;
  onPreviewChange?: (itemId: string, preview: PanelTilePreview) => void;
  onGridRef?: (node: HTMLDivElement | null) => void;
  onAdd?: (placement?: PanelGapAppendPlacement | PanelEdgeAppendPlan) => void;
  onEnterEditMode?: () => void;
  addDisabled?: boolean;
  onTileContextMenu?: (
    itemId: string,
    clientX: number,
    clientY: number,
    tileRect: DOMRect,
  ) => void;
  onSplitZoneOpen?: (itemId: string, zone: SplitZone) => void;
  onSplitPickSelect?: (media: MediaObject) => void;
  onSplitPickCancel?: () => void;
  onSwapTargetSelect?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onResizeStart?: (
    itemId: string,
    edge: ResizeEdge,
    clientX: number,
    clientY: number,
    pointerId: number,
  ) => void;
};

function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PanelAddButton({
  disabled,
  ariaLabel,
  onClick,
}: {
  disabled?: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-black/30 transition",
        disabled
          ? "cursor-not-allowed bg-stone-800/80 text-stone-600 opacity-50"
          : "bg-sky-500/90 text-stone-950 hover:bg-sky-400",
      ].join(" ")}
    >
      <PlusIcon className="h-6 w-6" />
    </button>
  );
}

function PanelEmptyAddSurface({
  disabled,
  shellHeightPx,
  fillAvailableHeight = false,
  onClick,
}: {
  disabled?: boolean;
  shellHeightPx: number;
  fillAvailableHeight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Add your first tile"
      onClick={onClick}
      className={[
        "flex w-full flex-col items-center justify-center gap-3 border-0 bg-transparent p-6 outline-none transition-colors",
        fillAvailableHeight ? "min-h-0 flex-1" : "",
        "focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-accent)/0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
      style={{ minHeight: shellHeightPx }}
    >
      <span
        aria-hidden
        className={[
          "inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-black/30 transition",
          disabled
            ? "bg-stone-800/80 text-stone-600"
            : "bg-sky-500/90 text-stone-950 group-hover/empty:bg-sky-400",
        ].join(" ")}
      >
        <PlusIcon className="h-6 w-6" />
      </span>
      <span className="text-sm text-stone-400 transition-colors group-hover/empty:text-stone-300">
        Click to add your first tile
      </span>
    </button>
  );
}

function PanelEdgeAddZone({
  edge,
  active,
  bandSizePx,
  disabled,
  ariaLabel,
  onClick,
  onPeekEnter,
}: {
  edge: "top" | "bottom" | "left" | "right";
  active: boolean;
  bandSizePx: number;
  disabled?: boolean;
  ariaLabel: string;
  onClick: () => void;
  onPeekEnter?: () => void;
}) {
  const isHorizontalSide = edge === "left" || edge === "right";
  const sizeStyle = isHorizontalSide
    ? { width: active ? bandSizePx : 0, minWidth: 0 }
    : { maxHeight: active ? bandSizePx : 0, height: bandSizePx };

  return (
    <div
      className={[
        "shrink-0 overflow-hidden transition-[max-height,width,opacity] duration-300 ease-in-out",
        active ? "opacity-100" : "pointer-events-none opacity-0",
        isHorizontalSide
          ? "flex self-stretch items-center justify-center"
          : "flex w-full items-center justify-center",
      ].join(" ")}
      style={sizeStyle}
      onPointerEnter={active ? onPeekEnter : undefined}
    >
      <PanelAddButton disabled={disabled} ariaLabel={ariaLabel} onClick={onClick} />
    </div>
  );
}

function resolveAddEdgePeek(
  clientX: number,
  clientY: number,
  shellRect: DOMRect,
  contentBottom: number,
  activeEdge: PanelAddEdge | null,
  proximityPx: number,
  bandSizes: { top: number; bottom: number; left: number; right: number },
  availableEdges: Partial<Record<PanelAddEdge, boolean>>,
): PanelAddEdge | null {
  const edgeProximity = (edge: PanelAddEdge): number => {
    const band = bandSizes[edge];
    return activeEdge === edge ? band + proximityPx : proximityPx;
  };

  const candidates: { edge: PanelAddEdge; distance: number }[] = [];

  if (availableEdges.top && clientY <= shellRect.top + edgeProximity("top")) {
    candidates.push({ edge: "top", distance: clientY - shellRect.top });
  }
  if (
    availableEdges.bottom &&
    clientY >= contentBottom - edgeProximity("bottom") &&
    clientY < contentBottom
  ) {
    candidates.push({ edge: "bottom", distance: contentBottom - clientY });
  }
  if (availableEdges.left && clientX <= shellRect.left + edgeProximity("left")) {
    candidates.push({ edge: "left", distance: clientX - shellRect.left });
  }
  if (availableEdges.right && clientX >= shellRect.right - edgeProximity("right")) {
    candidates.push({ edge: "right", distance: shellRect.right - clientX });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0]?.edge ?? null;
}

const ADD_ZONE_HOVER_PROXIMITY_PX = PANEL_GRID_ADD_ZONE_HOVER_PROXIMITY_PX;

function bottomResizeOverflowPx(
  resizePreview: ResizePreview | null | undefined,
  items: MediaPanelItem[],
): number {
  if (!resizePreview?.edge.includes("s")) {
    return 0;
  }

  const maxRow = items.reduce(
    (max, item) => Math.max(max, rectEndY(item as PanelPlacement)),
    0,
  );
  const target = items.find((item) => item.id === resizePreview.itemId);
  if (!target || rectEndY(target as PanelPlacement) < maxRow) {
    return 0;
  }

  return Math.max(0, resizePreview.offsetY);
}

function PanelGridOuter({
  bottomMarginPx,
  children,
}: {
  bottomMarginPx: number;
  children: ReactNode;
}) {
  return (
    <div
      className="w-full"
      style={{ marginBottom: bottomMarginPx }}
    >
      {children}
    </div>
  );
}

export function MediaPanelGrid({
  panel,
  items,
  editMode,
  displayRowUnitPx,
  viewportHeightPx,
  isViewportResizing = false,
  onViewportResizeStart,
  resizePreview = null,
  isTileResizing = false,
  flippedItemId = null,
  onFlippedChange,
  swapSourceId = null,
  swapAnimatingIds = null,
  swapAnimPhase = null,
  splitPickerItemId = null,
  splitPickerZone = null,
  excludeMediaIds = [],
  getItemPreview,
  onPreviewChange,
  onGridRef,
  onAdd,
  onEnterEditMode,
  addDisabled = false,
  onTileContextMenu,
  onSplitZoneOpen,
  onSplitPickSelect,
  onSplitPickCancel,
  onSwapTargetSelect,
  onRemoveItem,
  onResizeStart,
}: MediaPanelGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [addEdgePeek, setAddEdgePeek] = useState<PanelAddEdge | null>(null);
  const [shellContentWidthPx, setShellContentWidthPx] = useState(0);

  const isEmpty = items.length === 0;

  useEffect(() => {
    onGridRef?.(gridRef.current);
    return () => onGridRef?.(null);
  }, [onGridRef, items.length]);

  useEffect(() => {
    const shellNode = shellRef.current;
    if (!shellNode || isEmpty) {
      return;
    }

    const updateWidth = () => {
      const padding = PANEL_GRID_SHELL_PADDING_PX * 2;
      setShellContentWidthPx(Math.max(0, shellNode.clientWidth - padding));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(shellNode);
    return () => observer.disconnect();
  }, [items.length, isEmpty]);
  const rowUnitPx = displayRowUnitPx ?? panel.row_unit_px;
  const maxRow = items.reduce((max, item) => Math.max(max, rectEndY(item as PanelPlacement)), 0);
  const gridRowCount = isEmpty ? PANEL_EMPTY_SHELL_BAND_ROWS : Math.max(maxRow, 1);
  const isResizingTile = resizePreview !== null || isTileResizing;
  const useViewportHeight = viewportHeightPx !== undefined;
  const scaledContentHeightPx = panelGridViewportContentHeightPx(gridRowCount, rowUnitPx);
  const showScroll =
    useViewportHeight &&
    !isResizingTile &&
    !isViewportResizing &&
    scaledContentHeightPx > viewportHeightPx + 0.5;
  const contentHeightPx = panelGridViewportContentHeightPx(
    gridRowCount,
    panel.row_unit_px,
  );
  const addZoneHeightPx = panelGridAddZoneHeightPx(rowUnitPx);
  const outerBottomMarginPx = panelGridOuterBottomMarginPx(rowUnitPx);
  const shellHeightPx = isEmpty
    ? panelGridEmptyShellMinHeightPx(rowUnitPx)
    : contentHeightPx;
  const gapAppendPlacement = panelGridGapAppendPlacement(
    items,
    panel.column_count,
    addZoneHeightPx,
    rowUnitPx,
  );
  const edgeAppendPlans = computeEdgeAppendPlans(
    items as PanelPlacement[],
    panel.column_count,
  );
  const edgeAppendColSpan = panelGridEdgeAppendColSpan(panel.column_count);
  const edgeBandWidthPx = panelGridEdgeBandWidthPx(
    shellContentWidthPx,
    panel.column_count,
    edgeAppendColSpan,
  );

  const shellPadBottom = bottomResizeOverflowPx(resizePreview, items);
  const bottomAddAvailable = Boolean(gapAppendPlacement);
  const bottomPeekExtraPx =
    addEdgePeek === "bottom" && bottomAddAvailable ? addZoneHeightPx : 0;
  const viewportHandlePx =
    useViewportHeight && onViewportResizeStart ? PANEL_VIEWPORT_HANDLE_HEIGHT_PX : 0;

  const updateAddEdgePeek = (clientX: number, clientY: number) => {
    if (!editMode || !onAdd || isResizingTile || isViewportResizing) {
      setAddEdgePeek(null);
      return;
    }

    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const contentBottom = rect.bottom - viewportHandlePx;

    const availableEdges: Partial<Record<PanelAddEdge, boolean>> = {
      top: Boolean(edgeAppendPlans.top),
      left: Boolean(edgeAppendPlans.left),
      right: Boolean(edgeAppendPlans.right),
      bottom: bottomAddAvailable,
    };

    setAddEdgePeek(
      resolveAddEdgePeek(
        clientX,
        clientY,
        rect,
        contentBottom,
        addEdgePeek,
        ADD_ZONE_HOVER_PROXIMITY_PX,
        {
          top: addZoneHeightPx,
          bottom: addZoneHeightPx,
          left: edgeBandWidthPx,
          right: edgeBandWidthPx,
        },
        availableEdges,
      ),
    );
  };

  const shellClassName = [
    "w-full bg-stone-950/20",
    isResizingTile ? "overflow-visible" : "overflow-hidden",
    "flex flex-col rounded-xl border border-white/[0.08]",
    !isResizingTile && !isViewportResizing
      ? "transition-[height,min-height] duration-300 ease-in-out"
      : "",
  ].join(" ");

  const shellStyle = useViewportHeight
    ? {
        height: viewportHeightPx + viewportHandlePx + bottomPeekExtraPx,
      }
    : { minHeight: shellHeightPx + shellPadBottom + bottomPeekExtraPx };

  const innerStyle = useViewportHeight
    ? { height: viewportHeightPx + bottomPeekExtraPx, minHeight: 0 }
    : { minHeight: shellHeightPx + shellPadBottom + bottomPeekExtraPx };

  const innerOverflowClass = [
    "flex flex-col p-2",
    isResizingTile ? "overflow-visible" : showScroll ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
    useViewportHeight ? "min-h-0 shrink-0" : "",
  ].join(" ");

  if (isEmpty) {
    const emptyShellHoverClasses =
      editMode && onAdd && !addDisabled
        ? "group/empty transition-[box-shadow,border-color] duration-300 hover:border-[rgb(var(--app-accent)/0.38)] hover:shadow-[0_0_40px_rgb(var(--app-accent)/0.22),inset_0_0_56px_rgb(var(--app-accent)/0.07)]"
        : "";

    return (
      <PanelGridOuter bottomMarginPx={outerBottomMarginPx}>
        <div
          ref={shellRef}
          className={[
            shellClassName,
            emptyShellHoverClasses,
          ].join(" ")}
          style={shellStyle ?? { minHeight: shellHeightPx }}
        >
          <div className={innerOverflowClass} style={innerStyle}>
            {editMode && onAdd ? (
              <PanelEmptyAddSurface
                disabled={addDisabled}
                shellHeightPx={shellHeightPx}
                fillAvailableHeight={useViewportHeight}
                onClick={() => onAdd()}
              />
            ) : (
              <div
                className="flex flex-1 items-center justify-center p-6"
                style={useViewportHeight ? undefined : { minHeight: shellHeightPx }}
              >
                <button
                  type="button"
                  onClick={onEnterEditMode}
                  className="rounded-lg px-4 py-2 text-sm text-stone-300 ring-1 ring-stone-700 hover:text-stone-100"
                >
                  Edit panel to add files
                </button>
              </div>
            )}
          </div>
          {useViewportHeight && onViewportResizeStart ? (
            <MediaPanelViewportHandle
              active={isViewportResizing}
              onPointerDown={onViewportResizeStart}
            />
          ) : null}
        </div>
      </PanelGridOuter>
    );
  }

  return (
    <PanelGridOuter bottomMarginPx={outerBottomMarginPx}>
      <div
        ref={shellRef}
        className={shellClassName}
        style={shellStyle}
        onPointerMove={(event) => updateAddEdgePeek(event.clientX, event.clientY)}
        onPointerLeave={() => setAddEdgePeek(null)}
      >
        <div className={innerOverflowClass} style={innerStyle}>
          {editMode && onAdd && edgeAppendPlans.top ? (
            <PanelEdgeAddZone
              edge="top"
              active={addEdgePeek === "top"}
              bandSizePx={addZoneHeightPx}
              disabled={addDisabled}
              ariaLabel="Add file to top of panel"
              onClick={() => onAdd(edgeAppendPlans.top!)}
            />
          ) : null}

          <div className="flex min-h-0 w-full flex-1 items-stretch">
            {editMode && onAdd && edgeAppendPlans.left ? (
              <PanelEdgeAddZone
                edge="left"
                active={addEdgePeek === "left"}
                bandSizePx={edgeBandWidthPx}
                disabled={addDisabled}
                ariaLabel="Add file to left of panel"
                onClick={() => onAdd(edgeAppendPlans.left!)}
              />
            ) : null}

            <div
              ref={gridRef}
              className={[
                "relative grid min-w-0 flex-1 shrink gap-1.5",
                isResizingTile ? "overflow-visible" : "",
              ].join(" ")}
              style={{
                gridTemplateColumns: `repeat(${panel.column_count}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${gridRowCount}, ${rowUnitPx}px)`,
              }}
            >
              {items.map((item) => (
                <MediaPanelTile
                  key={item.id}
                  item={item}
                  editMode={editMode}
                  panelPreview={getItemPreview(item)}
                  resizePreview={resizePreview}
                  flipped={flippedItemId === item.id}
                  onFlippedChange={(flipped) => {
                    if (flipped) {
                      onFlippedChange?.(item.id);
                    } else if (flippedItemId === item.id) {
                      onFlippedChange?.(null);
                    }
                  }}
                  swapSourceId={swapSourceId}
                  swapAnimatingIds={swapAnimatingIds}
                  swapAnimPhase={swapAnimPhase}
                  activeSplitZone={splitPickerItemId === item.id ? splitPickerZone : null}
                  splitPickerOpen={splitPickerItemId === item.id && splitPickerZone !== null}
                  excludeMediaIds={excludeMediaIds}
                  onPreviewChange={onPreviewChange}
                  onContextMenu={onTileContextMenu}
                  onSplitZoneOpen={onSplitZoneOpen}
                  onSplitPickSelect={onSplitPickSelect}
                  onSplitPickCancel={onSplitPickCancel}
                  onSwapTargetSelect={onSwapTargetSelect}
                  onRemove={onRemoveItem}
                  onResizeStart={onResizeStart}
                />
              ))}
            </div>

            {editMode && onAdd && edgeAppendPlans.right ? (
              <PanelEdgeAddZone
                edge="right"
                active={addEdgePeek === "right"}
                bandSizePx={edgeBandWidthPx}
                disabled={addDisabled}
                ariaLabel="Add file to right of panel"
                onClick={() => onAdd(edgeAppendPlans.right!)}
              />
            ) : null}
          </div>

          {editMode && onAdd && gapAppendPlacement ? (
            <PanelEdgeAddZone
              edge="bottom"
              active={addEdgePeek === "bottom"}
              bandSizePx={addZoneHeightPx}
              disabled={addDisabled}
              ariaLabel="Add file to bottom of panel"
              onClick={() => onAdd(gapAppendPlacement)}
              onPeekEnter={() => setAddEdgePeek("bottom")}
            />
          ) : null}
        </div>

        {useViewportHeight && onViewportResizeStart ? (
          <MediaPanelViewportHandle
            active={isViewportResizing}
            onPointerDown={onViewportResizeStart}
          />
        ) : null}
      </div>
    </PanelGridOuter>
  );
}
