// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceNotesGridTile.tsx

// One note tile in the workspace notes grid overlay.

import { useCallback, useState, type CSSProperties, type MouseEvent } from "react";

import type { PanelPlacement } from "../../../../media/lib/panelGrid";
import type { SplitZone } from "../../../../media/lib/panelGridSplit";
import type { WorkspaceNotesGridResizePreview } from "../../../hooks/useWorkspaceNotesGridResize";
import type { WorkspaceNoteData } from "../../../lib/workspace";
import {
  resolveContainerShape,
  resolveNoteColors,
  resolveWorkspaceNoteColorStyleOrDefault,
} from "../../../lib/workspace/node";
import { useWorkspaceNoteColorStyle } from "../context/WorkspaceCanvasContext";
import { WorkspaceEditableNoteCard } from "./WorkspaceEditableNoteCard";
import { WorkspaceNotesGridTileAddZones } from "./WorkspaceNotesGridTileAddZones";

type WorkspaceNotesGridTileProps = {
  placement: PanelPlacement;
  data: WorkspaceNoteData;
  resizePreview?: WorkspaceNotesGridResizePreview | null;
  allowTileScroll?: boolean;
  swapSourceId?: string | null;
  swapHoverTargetId?: string | null;
  addZonesDisabled?: boolean;
  autoFocusTitle?: boolean;
  onSwapHover?: (noteId: string | null) => void;
  onSwapSelect?: (noteId: string) => void;
  onSwapContextMenu?: (noteId: string, clientX: number, clientY: number) => void;
  onSplitAdd?: (noteId: string, zone: SplitZone) => void;
  onEditingStateChange?: (
    noteId: string,
    editing: { title: boolean; body: boolean },
  ) => void;
};

export function WorkspaceNotesGridTile({
  placement,
  data,
  resizePreview = null,
  allowTileScroll = false,
  swapSourceId = null,
  swapHoverTargetId = null,
  addZonesDisabled = false,
  autoFocusTitle = false,
  onSwapHover,
  onSwapSelect,
  onSwapContextMenu,
  onSplitAdd,
  onEditingStateChange,
}: WorkspaceNotesGridTileProps) {
  const noteColorStyle = useWorkspaceNoteColorStyle();
  const [isEditing, setIsEditing] = useState(false);
  const isResizingThisTile = resizePreview?.itemId === placement.id;
  const isResizingParticipant = Boolean(resizePreview?.tileStyles[placement.id]);
  const previewStyle = resizePreview?.tileStyles[placement.id] as CSSProperties | undefined;
  const previewZIndex = previewStyle?.zIndex;
  const isSwapMode = swapSourceId !== null;
  const isSwapSource = swapSourceId === placement.id;
  const isSwapTarget = isSwapMode && !isSwapSource;
  const isSwapHoverTarget = isSwapTarget && swapHoverTargetId === placement.id;

  const { border, fill } = resolveNoteColors(data.color);
  const colorStyle = resolveWorkspaceNoteColorStyleOrDefault(noteColorStyle, {
    border,
    fill,
  });
  const containerShape = resolveContainerShape(data.containerShape);
  const shapeClass =
    containerShape === "circle"
      ? "rounded-full"
      : containerShape === "hexagon"
        ? "rounded-2xl"
        : "rounded-xl";

  const handleEditingStateChange = useCallback(
    (editing: { title: boolean; body: boolean }) => {
      setIsEditing(editing.title || editing.body);
      onEditingStateChange?.(placement.id, editing);
    },
    [onEditingStateChange, placement.id],
  );

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isSwapTarget) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onSwapSelect?.(placement.id);
  };

  const tileZClass =
    isResizingThisTile || isResizingParticipant
      ? previewZIndex !== undefined && Number(previewZIndex) >= 50
        ? "z-50 overflow-visible"
        : previewZIndex !== undefined && Number(previewZIndex) <= 30
          ? "z-30 overflow-visible"
          : "z-40 overflow-visible"
      : "z-0";

  const noteCard = (
    <WorkspaceEditableNoteCard
      noteId={placement.id}
      data={data}
      minWidth={0}
      fillHeight
      fitContent={!allowTileScroll}
      className="h-full w-full min-w-0"
      autoFocusTitle={autoFocusTitle}
      enableTaskToggle
      enableBodyContextMenu
      onEditingStateChange={handleEditingStateChange}
      onSwapContextMenu={(clientX, clientY) =>
        onSwapContextMenu?.(placement.id, clientX, clientY)
      }
    />
  );

  const tileContent =
    onSplitAdd && !isSwapMode ? (
      <WorkspaceNotesGridTileAddZones
        placement={placement}
        disabled={addZonesDisabled || isEditing}
        onSplitAdd={onSplitAdd}
      >
        {noteCard}
      </WorkspaceNotesGridTileAddZones>
    ) : (
      noteCard
    );

  const swapTargetBlurClass = isSwapTarget
    ? isSwapHoverTarget
      ? "blur-[2px] brightness-[0.92]"
      : "blur-sm brightness-[0.88]"
    : "";

  return (
    <div
      className={[
        "relative h-full min-h-0 w-full overflow-hidden",
        tileZClass,
        isSwapTarget ? "cursor-pointer" : "",
      ].join(" ")}
      style={{
        gridColumn: `${placement.grid_x + 1} / span ${placement.col_span}`,
        gridRow: `${placement.grid_y + 1} / span ${placement.row_span}`,
        ...previewStyle,
      }}
      onClick={handleClick}
      onPointerEnter={() => {
        if (isSwapTarget) {
          onSwapHover?.(placement.id);
        }
      }}
      onPointerLeave={() => {
        if (isSwapTarget && swapHoverTargetId === placement.id) {
          onSwapHover?.(null);
        }
      }}
    >
      {isSwapTarget ? (
        <div
          className={[
            "relative h-full w-full overflow-hidden",
            shapeClass,
          ].join(" ")}
        >
          <div
            className={[
              "h-full w-full transition-[filter] duration-150 pointer-events-none",
              swapTargetBlurClass,
            ].join(" ")}
          >
            {tileContent}
          </div>
          <div
            className={[
              "pointer-events-none absolute inset-0 border transition-[border-color,box-shadow] duration-150",
              shapeClass,
              isSwapHoverTarget
                ? "border-stone-500/80"
                : "border-stone-700/30",
            ].join(" ")}
            style={
              isSwapHoverTarget
                ? {
                    boxShadow: `0 0 0 1px ${colorStyle.borderColor}, 0 0 14px color-mix(in srgb, ${colorStyle.borderColor} 45%, transparent)`,
                  }
                : undefined
            }
            aria-hidden
          />
        </div>
      ) : (
        <div
          className="relative h-full w-full"
          style={
            isSwapSource
              ? {
                  boxShadow: `0 0 0 2px ${colorStyle.borderColor}, 0 0 16px ${colorStyle.borderColor}, 0 0 32px color-mix(in srgb, ${colorStyle.borderColor} 55%, transparent)`,
                  borderRadius:
                    containerShape === "circle"
                      ? "9999px"
                      : containerShape === "hexagon"
                        ? "1rem"
                        : "0.75rem",
                }
              : undefined
          }
        >
          {tileContent}
        </div>
      )}
    </div>
  );
}
