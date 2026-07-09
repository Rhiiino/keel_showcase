// keel_web/src/modules/media/components/panels/MediaPanelTile.tsx

// Flip-card tile for one media item on a panel grid.

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { buildMediaContentUrl, type MediaObject, type MediaPanelItem } from "../../api";
import type { ResizePreview } from "../../hooks/useMediaPanelGridResize";
import type { ResizeEdge } from "../../lib/panelGrid";
import { mediaPanelTileBorderStyle } from "../../lib/panelTileBorderColors";
import {
  canSplitTile,
  computeSplitPlacements,
  resolveSplitZone,
  type SplitZone,
} from "../../lib/panelGridSplit";
import {
  zoomPanelTilePreviewTowardCursor,
  type PanelTilePreview,
} from "../../lib/panelTilePreview";
import { MediaPreview } from "../shared/MediaPreview";
import { MediaPanelTileBack } from "./MediaPanelTileBack";
import { MediaPanelTileSplitOverlay } from "./MediaPanelTileSplitOverlay";

const RESIZE_HANDLES: { edge: ResizeEdge; className: string; cursor: string }[] = [
  { edge: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { edge: "n", className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
  { edge: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { edge: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { edge: "e", className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { edge: "sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
  { edge: "s", className: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { edge: "se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
];

const SWAP_ANIM_MS = 280;

type MediaPanelTileProps = {
  item: MediaPanelItem;
  editMode: boolean;
  panelPreview: PanelTilePreview;
  resizePreview?: ResizePreview | null;
  flipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  swapSourceId?: string | null;
  swapAnimatingIds?: string[] | null;
  swapAnimPhase?: "shrink" | "expand" | null;
  activeSplitZone?: SplitZone | null;
  splitPickerOpen?: boolean;
  excludeMediaIds?: string[];
  onPreviewChange?: (itemId: string, preview: PanelTilePreview) => void;
  onRemove?: (itemId: string) => void;
  onContextMenu?: (
    itemId: string,
    clientX: number,
    clientY: number,
    tileRect: DOMRect,
  ) => void;
  onSplitZoneOpen?: (itemId: string, zone: SplitZone) => void;
  onSplitPickSelect?: (media: MediaObject) => void;
  onSplitPickCancel?: () => void;
  onSwapTargetSelect?: (itemId: string) => void;
  onResizeStart?: (
    itemId: string,
    edge: ResizeEdge,
    clientX: number,
    clientY: number,
    pointerId: number,
  ) => void;
};

export function MediaPanelTile({
  item,
  editMode,
  panelPreview,
  resizePreview,
  flipped = false,
  onFlippedChange,
  swapSourceId = null,
  swapAnimatingIds = null,
  swapAnimPhase = null,
  activeSplitZone = null,
  splitPickerOpen = false,
  excludeMediaIds = [],
  onPreviewChange,
  onRemove,
  onContextMenu,
  onSplitZoneOpen,
  onSplitPickSelect,
  onSplitPickCancel,
  onSwapTargetSelect,
  onResizeStart,
}: MediaPanelTileProps) {
  const tileRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef(panelPreview);
  const [hoverZone, setHoverZone] = useState<SplitZone | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const previewUrl =
    item.media.status === "ready"
      ? buildMediaContentUrl(item.media.id, item.media.updated_at)
      : null;

  previewRef.current = panelPreview;

  const isResizingThisTile = resizePreview?.itemId === item.id;
  const isResizingParticipant = Boolean(resizePreview?.tileStyles[item.id]);
  const canWheelZoom = (editMode || isHovered) && !flipped && !isResizingThisTile;
  const previewStyle = resizePreview?.tileStyles[item.id];

  const placement = {
    id: item.id,
    grid_x: item.grid_x,
    grid_y: item.grid_y,
    col_span: item.col_span,
    row_span: item.row_span,
  };

  const isSwapSource = swapSourceId === item.id;
  const isSwapMode = Boolean(swapSourceId);
  const isSwapAnimating = Boolean(
    swapAnimatingIds?.includes(item.id) && swapAnimPhase,
  );
  const swapMediaScale = !isSwapAnimating
    ? 1
    : swapAnimPhase === "expand"
      ? 1
      : 0;

  const border = mediaPanelTileBorderStyle(item.border_color);

  useEffect(() => {
    const node = tileRef.current;
    if (!node || !canWheelZoom || !onPreviewChange) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-panel-split-picker]")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const bounds = node.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      const cursorX = (event.clientX - bounds.left) / bounds.width;
      const cursorY = (event.clientY - bounds.top) / bounds.height;
      const nextPreview = zoomPanelTilePreviewTowardCursor(
        previewRef.current,
        event.deltaY,
        cursorX,
        cursorY,
      );
      onPreviewChange(item.id, nextPreview);
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [canWheelZoom, item.id, onPreviewChange]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!editMode || !onSplitZoneOpen || isResizingThisTile || splitPickerOpen) {
      return;
    }

    const bounds = tileRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const zone = resolveSplitZone(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      bounds.width,
      bounds.height,
    );
    if (!zone || !canSplitTile(placement, zone)) {
      setHoverZone(null);
      return;
    }

    setHoverZone(zone);
  };

  const handlePointerLeave = () => {
    if (!splitPickerOpen) {
      setHoverZone(null);
    }
    setIsHovered(false);
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const bounds = tileRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }
    onContextMenu?.(item.id, event.clientX, event.clientY, bounds);
  };

  const handleTileClick = () => {
    if (isSwapMode && swapSourceId && swapSourceId !== item.id) {
      onSwapTargetSelect?.(item.id);
    }
  };

  const displayZone = splitPickerOpen && activeSplitZone ? activeSplitZone : hoverZone;

  return (
    <div
      ref={tileRef}
      className={[
        "relative h-full w-full overflow-hidden rounded-2xl bg-stone-950",
        border.className,
        isResizingThisTile || isResizingParticipant ? "z-40 overflow-visible ring-sky-400/50" : "",
        isSwapSource ? "z-30 ring-2 ring-amber-400/90" : "",
        isSwapMode && !isSwapSource ? "cursor-pointer ring-1 ring-amber-400/40" : "",
        canWheelZoom && !isSwapMode ? "cursor-zoom-in" : "",
      ].join(" ")}
      style={{
        gridColumn: `${item.grid_x + 1} / span ${item.col_span}`,
        gridRow: `${item.grid_y + 1} / span ${item.row_span}`,
        ...previewStyle,
        ...border.style,
      }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={editMode ? handlePointerMove : undefined}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
      onClick={isSwapMode ? handleTileClick : undefined}
    >
      <div className="relative h-full w-full [perspective:1200px]">
        <motion.div
          className="relative h-full w-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={[
              "absolute inset-0 h-full w-full overflow-hidden rounded-2xl bg-stone-950",
              editMode ? "cursor-default" : "",
            ].join(" ")}
            style={{ backfaceVisibility: "hidden" }}
          >
            <motion.div
              className="h-full w-full origin-center"
              initial={false}
              animate={{ scale: swapMediaScale }}
              transition={{ duration: SWAP_ANIM_MS / 1000, ease: "easeInOut" }}
            >
              <MediaPreview
                srcUrl={previewUrl}
                mimeType={item.media.mime_type}
                mediaKind={item.media.media_kind}
                alt={item.media.original_filename}
                size="panel"
                panelPreview={panelPreview}
              />
            </motion.div>
          </div>

          <MediaPanelTileBack
            item={item}
            editMode={editMode}
            onFlipBack={() => onFlippedChange?.(false)}
          />
        </motion.div>
      </div>

      {editMode && displayZone && onSplitZoneOpen ? (
        <MediaPanelTileSplitOverlay
          zone={displayZone}
          pickerOpen={splitPickerOpen && activeSplitZone === displayZone}
          excludeMediaIds={excludeMediaIds}
          onZoneClick={(zone) => {
            if (!canSplitTile(placement, zone) || !computeSplitPlacements(placement, zone)) {
              return;
            }
            onSplitZoneOpen(item.id, zone);
          }}
          onPickSelect={(media) => onSplitPickSelect?.(media)}
          onPickCancel={() => onSplitPickCancel?.()}
        />
      ) : null}

      {editMode ? (
        <>
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${item.media.original_filename}`}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(item.id);
              }}
              className="absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-stone-100 hover:bg-red-950/80"
            >
              ×
            </button>
          ) : null}
          {onResizeStart
            ? RESIZE_HANDLES.map((handle) => (
                <button
                  key={handle.edge}
                  type="button"
                  aria-label={`Resize ${handle.edge}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setHoverZone(null);
                    onResizeStart(
                      item.id,
                      handle.edge,
                      event.clientX,
                      event.clientY,
                      event.pointerId,
                    );
                  }}
                  className={[
                    "absolute z-20 h-3 w-3 rounded-full border border-sky-300/70 bg-sky-400/80",
                    handle.className,
                  ].join(" ")}
                  style={{ cursor: handle.cursor, touchAction: "none" }}
                />
              ))
            : null}
        </>
      ) : null}
    </div>
  );
}
