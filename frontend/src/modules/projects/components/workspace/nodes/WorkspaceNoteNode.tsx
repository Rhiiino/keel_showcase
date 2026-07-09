// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteNode.tsx

// Draggable, resizable note card for the project workspace canvas.

import {
  NodeToolbar,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

import type { WorkspaceNoteData } from "../../../lib/workspace";
import {
  applyMarkdownTextColor,
  toggleMarkdownBold,
  toggleMarkdownItalic,
  toggleMarkdownStrikethrough,
} from "../../../lib/workspace/note";
import { useWorkspaceNoteBodyEditing } from "../../../hooks/useWorkspaceNoteBodyEditing";
import { useWorkspaceNodeConnectedSides } from "../../../hooks/useWorkspaceNodeConnectedSides";
import { useWorkspaceNodeHover } from "../../../hooks/useWorkspaceNodeHover";
import {
  resolveContainerShape,
  resolveWorkspaceNoteColorStyleOrDefault,
  type WorkspaceContainerShape,
} from "../../../lib/workspace/node";
import { resolveNoteColors } from "../../../lib/workspace/node";
import {
  useWorkspaceNodeToolbarVisible,
  useWorkspaceFilesPanelNoteHighlighted,
  useWorkspaceNoteColorStyle,
  useWorkspaceOpenNoteContextMenu,
  useWorkspaceDeleteNote,
  useWorkspaceSetNoteBodyEditing,
  useWorkspaceRequestSave,
  useWorkspaceSelectNoteColor,
  useWorkspaceTextFontSizes,
} from "../context/WorkspaceCanvasContext";
import {
  WorkspaceNodeContainer,
  type WorkspaceNodeMeasuredSize,
} from "./WorkspaceNodeContainer";
import { WorkspaceNodeHandlesLayer } from "./WorkspaceNodeHandlesLayer";
import { WorkspaceNodeResizer } from "./WorkspaceNodeResizer";
import { WorkspaceNoteToolbar } from "./WorkspaceNoteToolbar";
import { WorkspaceNoteMarkdown } from "./WorkspaceNoteMarkdown";
import { WorkspaceNoteRefPicker } from "./WorkspaceNoteRefPicker";
import { WorkspaceNoteBodyContextMenu } from "./WorkspaceNoteBodyContextMenu";
import { WorkspaceNoteBodySelectionToolbar } from "./WorkspaceNoteBodySelectionToolbar";

const DEFAULT_NOTE_TITLE = "Note";
const DRAG_SURFACE_CLICK_THRESHOLD_PX = 5;
const NOTE_CONTENT_INLINE_PADDING_PX = 24;
const NOTE_CONTENT_TOP_PADDING_PX = 24;
const NOTE_CONTENT_BOTTOM_PADDING_PX = 24;
const NOTE_TITLE_BODY_GAP_PX = 16;

function WorkspaceNoteNodeComponent({
  id,
  data,
  selected,
  dragging,
}: NodeProps<Node<WorkspaceNoteData>>) {
  const { updateNodeData } = useReactFlow();
  const requestSave = useWorkspaceRequestSave();
  const onSelectNoteColor = useWorkspaceSelectNoteColor();
  const openNoteContextMenu = useWorkspaceOpenNoteContextMenu();
  const deleteNote = useWorkspaceDeleteNote();
  const setNoteBodyEditing = useWorkspaceSetNoteBodyEditing();
  const noteColorStyle = useWorkspaceNoteColorStyle();
  const { titlePx, bodyPx } = useWorkspaceTextFontSizes();
  const bodyPaddingTop =
    NOTE_CONTENT_TOP_PADDING_PX + Math.round(titlePx * 1.25) + NOTE_TITLE_BODY_GAP_PX;
  const [titleDraft, setTitleDraft] = useState(data.title ?? "");
  const [titleFocused, setTitleFocused] = useState(false);
  const [nodeSize, setNodeSize] = useState<WorkspaceNodeMeasuredSize>({
    width: 0,
    height: 0,
  });
  const titleFocusedRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dragSurfacePointerRef = useRef<{ x: number; y: number } | null>(null);

  const bodyEditing = useWorkspaceNoteBodyEditing({
    noteId: id,
    bodyText: data.text ?? "",
    selected,
    textareaRef: bodyTextareaRef,
    updateNodeData,
  });

  const releaseTextFocus = useCallback(() => {
    titleFocusedRef.current = false;
    setTitleFocused(false);
    titleInputRef.current?.blur();
    bodyEditing.releaseBodyFocus();
  }, [bodyEditing]);

  const focusBody = useCallback(() => {
    if (!selected) {
      return;
    }
    titleFocusedRef.current = false;
    setTitleFocused(false);
    titleInputRef.current?.blur();
    bodyEditing.focusBody();
  }, [bodyEditing, selected]);

  useEffect(() => {
    if (!bodyEditing.bodyFocused) {
      return;
    }
    setNoteBodyEditing(id);
    return () => setNoteBodyEditing(null);
  }, [bodyEditing.bodyFocused, id, setNoteBodyEditing]);

  useEffect(() => {
    if (!selected) {
      releaseTextFocus();
    }
  }, [selected, releaseTextFocus]);

  useEffect(() => {
    if (dragging) {
      releaseTextFocus();
    }
  }, [dragging, releaseTextFocus]);

  const editingText = titleFocused || bodyEditing.bodyFocused;
  const showDragSurface = !editingText;

  const handleDragSurfacePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      dragSurfacePointerRef.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handleDragSurfacePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const start = dragSurfacePointerRef.current;
      dragSurfacePointerRef.current = null;
      if (!start || !selected) {
        return;
      }

      const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (moved > DRAG_SURFACE_CLICK_THRESHOLD_PX) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      if (clickY < bodyPaddingTop) {
        titleInputRef.current?.focus();
        return;
      }
      focusBody();
    },
    [bodyPaddingTop, focusBody, selected],
  );

  const { border, fill } = resolveNoteColors(data.color);
  const colorStyle = resolveWorkspaceNoteColorStyleOrDefault(noteColorStyle, {
    border,
    fill,
  });
  const transparent = data.transparent ?? false;
  const hideChrome = data.hideChrome ?? false;
  const containerShape = resolveContainerShape(data.containerShape);
  const connectedSides = useWorkspaceNodeConnectedSides(id);
  const toolbarVisible = useWorkspaceNodeToolbarVisible(id, selected);
  const filesPanelHighlighted = useWorkspaceFilesPanelNoteHighlighted(id);
  const toolbarHiddenWhileDragging = dragging && toolbarVisible;
  const nodePointerHoverEnabled = !dragging && !editingText;
  const { hovered, onPointerEnter, onPointerLeave } =
    useWorkspaceNodeHover(nodePointerHoverEnabled);
  const resizerVisible = (selected || hovered) && !editingText;

  useEffect(() => {
    if (!titleFocusedRef.current) {
      setTitleDraft(data.title ?? "");
    }
  }, [data.title]);

  const handleSelectColor = useCallback(
    (hex: string) => {
      onSelectNoteColor(id, hex);
    },
    [id, onSelectNoteColor],
  );

  const handleTitleCommit = useCallback(
    (nextTitle: string) => {
      const trimmed = nextTitle.trim() || DEFAULT_NOTE_TITLE;
      const current = (data.title ?? "").trim() || DEFAULT_NOTE_TITLE;
      setTitleDraft(trimmed);
      if (trimmed === current) {
        return;
      }
      updateNodeData(id, { title: trimmed });
      requestSave();
    },
    [data.title, id, updateNodeData, requestSave],
  );

  const handleTitleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleTitleCommit(titleDraft);
        event.currentTarget.blur();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setTitleDraft(data.title ?? "");
        event.currentTarget.blur();
      }
      event.stopPropagation();
    },
    [data.title, handleTitleCommit, titleDraft],
  );

  const handleToggleTransparent = useCallback(() => {
    updateNodeData(id, { transparent: !transparent });
    requestSave();
  }, [id, transparent, updateNodeData, requestSave]);

  const handleToggleHideChrome = useCallback(() => {
    updateNodeData(id, { hideChrome: !hideChrome });
    requestSave();
  }, [hideChrome, id, updateNodeData, requestSave]);

  const handleSelectContainerShape = useCallback(
    (shape: WorkspaceContainerShape) => {
      updateNodeData(id, { containerShape: shape });
      requestSave();
    },
    [id, updateNodeData, requestSave],
  );

  const handleDeleteNote = useCallback(() => {
    deleteNote(id);
  }, [deleteNote, id]);

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (bodyEditing.bodyFocusedRef.current) {
        const cursor = bodyTextareaRef.current?.selectionStart ?? 0;
        bodyEditing.openBodyContextMenu(event.clientX, event.clientY, cursor);
        return;
      }
      openNoteContextMenu(id, event.clientX, event.clientY);
    },
    [bodyEditing, id, openNoteContextMenu],
  );

  return (
    <>
      <NodeToolbar
        isVisible={toolbarVisible}
        position={Position.Top}
        offset={8}
        align="center"
        className={[
          "nodrag nopan",
          toolbarHiddenWhileDragging ? "pointer-events-none opacity-0" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <WorkspaceNoteToolbar
          nodeId={id}
          borderColor={border}
          transparent={transparent}
          hideChrome={hideChrome}
          containerShape={containerShape}
          onDelete={handleDeleteNote}
          onSelectContainerShape={handleSelectContainerShape}
          onSelectColor={handleSelectColor}
          onToggleTransparent={handleToggleTransparent}
          onToggleHideChrome={handleToggleHideChrome}
        />
      </NodeToolbar>

      {bodyEditing.bodyContextMenu ? (
        <WorkspaceNoteBodyContextMenu
          clientX={bodyEditing.bodyContextMenu.clientX}
          clientY={bodyEditing.bodyContextMenu.clientY}
          actions={bodyEditing.bodyContextMenuActions}
          onClose={bodyEditing.closeBodyContextMenu}
        />
      ) : null}

      {bodyEditing.textSelection.selection ? (
        <WorkspaceNoteBodySelectionToolbar
          selection={bodyEditing.textSelection.selection}
          textareaRef={bodyTextareaRef}
          actions={bodyEditing.bodySelectionActions}
          onClose={bodyEditing.textSelection.clearSelection}
          onToggleBold={() => bodyEditing.applyBodySelectionEdit(toggleMarkdownBold)}
          onToggleItalic={() => bodyEditing.applyBodySelectionEdit(toggleMarkdownItalic)}
          onToggleStrikethrough={() =>
            bodyEditing.applyBodySelectionEdit(toggleMarkdownStrikethrough)
          }
          onSelectColor={(hex) =>
            bodyEditing.applyBodySelectionEdit((text, range) =>
              applyMarkdownTextColor(text, range, hex),
            )
          }
        />
      ) : null}

      <div
        className={[
          "group/note relative h-full w-full",
          editingText ? "" : "cursor-grab active:cursor-grabbing",
        ]
          .filter(Boolean)
          .join(" ")}
        onContextMenu={handleContextMenu}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <WorkspaceNodeContainer
          nodeId={id}
          shape={containerShape}
          hideChrome={hideChrome}
          selected={selected}
          filesPanelHighlighted={filesPanelHighlighted}
          connectedSides={connectedSides}
          accentColor={border}
          transparent={transparent}
          fillColor={colorStyle.fillColor}
          borderColor={colorStyle.borderColor}
          borderWidth={colorStyle.borderWidth}
          onSizeChange={setNodeSize}
        >
          <div
            className={[
              "absolute inset-x-0 top-0 z-[2]",
              showDragSurface ? "pointer-events-none" : "pointer-events-auto",
            ].join(" ")}
            style={{
              paddingLeft: NOTE_CONTENT_INLINE_PADDING_PX,
              paddingRight: NOTE_CONTENT_INLINE_PADDING_PX,
              paddingTop: NOTE_CONTENT_TOP_PADDING_PX,
            }}
          >
            <input
              ref={titleInputRef}
              type="text"
              value={titleDraft}
              placeholder={DEFAULT_NOTE_TITLE}
              aria-label="Note title"
              onChange={(event) => setTitleDraft(event.target.value)}
              onFocus={(event) => {
                if (!selected) {
                  event.currentTarget.blur();
                  return;
                }
                titleFocusedRef.current = true;
                setTitleFocused(true);
                event.currentTarget.select();
              }}
              onBlur={(event) => {
                titleFocusedRef.current = false;
                setTitleFocused(false);
                handleTitleCommit(event.target.value);
              }}
              onKeyDown={handleTitleKeyDown}
              onPointerDown={(event) => event.stopPropagation()}
              className={[
                "nodrag nopan min-w-0 w-full rounded-sm bg-transparent font-medium leading-tight text-stone-200 outline-none ring-0 placeholder:text-stone-500 focus:ring-1 focus:ring-sky-400/40 cursor-text",
                titleFocused ? "" : "truncate",
              ].join(" ")}
              style={{ fontSize: titlePx }}
            />
          </div>

          {bodyEditing.bodyFocused ? (
            <div className="relative z-[1] h-full w-full">
              <textarea
                ref={bodyTextareaRef}
                value={bodyEditing.bodyDraft}
                placeholder="Write a note…"
                aria-label="Note body"
                onChange={(event) => {
                  bodyEditing.setBodyDraft(event.target.value);
                  bodyEditing.syncSelectionFromTextarea(event.target);
                }}
                onSelect={(event) => bodyEditing.syncSelectionFromTextarea(event.currentTarget)}
                onMouseUp={(event) => bodyEditing.syncSelectionAfterPointer(event.currentTarget)}
                onPointerUp={(event) => bodyEditing.syncSelectionAfterPointer(event.currentTarget)}
                onKeyUp={(event) => bodyEditing.syncSelectionFromTextarea(event.currentTarget)}
                onClick={(event) => bodyEditing.syncSelectionFromTextarea(event.currentTarget)}
                onFocus={(event) => {
                  if (!selected) {
                    event.currentTarget.blur();
                    return;
                  }
                  bodyEditing.bodyFocusedRef.current = true;
                  bodyEditing.focusBody();
                  bodyEditing.syncSelectionFromTextarea(event.currentTarget);
                }}
                onBlur={(event) => {
                  bodyEditing.bodyFocusedRef.current = false;
                  bodyEditing.releaseBodyFocus();
                  bodyEditing.noteRefPicker.dismiss();
                  bodyEditing.textSelection.clearSelection();
                  bodyEditing.commitBody(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (bodyEditing.noteRefPicker.handleKeyDown(event)) {
                    event.stopPropagation();
                    return;
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    bodyEditing.setBodyDraft(data.text ?? "");
                    bodyEditing.noteRefPicker.dismiss();
                    event.currentTarget.blur();
                  }
                  event.stopPropagation();
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className="nodrag nopan h-full w-full resize-none bg-transparent leading-relaxed text-stone-100 outline-none placeholder:text-stone-500 cursor-text"
                style={{
                  fontSize: bodyPx,
                  paddingLeft: NOTE_CONTENT_INLINE_PADDING_PX,
                  paddingRight: NOTE_CONTENT_INLINE_PADDING_PX,
                  paddingTop: bodyPaddingTop,
                  paddingBottom: NOTE_CONTENT_BOTTOM_PADDING_PX,
                }}
              />
              <WorkspaceNoteRefPicker
                open={bodyEditing.noteRefPicker.open}
                candidates={bodyEditing.noteRefPicker.candidates}
                activeIndex={bodyEditing.noteRefPicker.activeIndex}
                onSelect={bodyEditing.noteRefPicker.selectCandidate}
              />
            </div>
          ) : (
            <>
              <div
                className="absolute inset-0 z-[4] overflow-hidden pointer-events-none text-stone-100"
                style={{
                  fontSize: bodyPx,
                  paddingLeft: NOTE_CONTENT_INLINE_PADDING_PX,
                  paddingRight: NOTE_CONTENT_INLINE_PADDING_PX,
                  paddingTop: bodyPaddingTop,
                  paddingBottom: NOTE_CONTENT_BOTTOM_PADDING_PX,
                }}
              >
                <WorkspaceNoteMarkdown
                  text={bodyEditing.bodyDraft}
                  onToggleTaskLine={bodyEditing.handleToggleTaskLine}
                />
              </div>

              {showDragSurface ? (
                <div
                  className="absolute inset-0 z-[3] cursor-grab active:cursor-grabbing"
                  onPointerDown={handleDragSurfacePointerDown}
                  onPointerUp={handleDragSurfacePointerUp}
                  onPointerCancel={() => {
                    dragSurfacePointerRef.current = null;
                  }}
                />
              ) : null}
            </>
          )}
        </WorkspaceNodeContainer>

        <WorkspaceNodeHandlesLayer
          nodeId={id}
          selected={selected && !dragging}
          hideChrome={hideChrome}
          containerShape={containerShape}
          nodeSize={nodeSize}
          hovered={hovered}
        />

        <WorkspaceNodeResizer
          minWidth={160}
          minHeight={100}
          isVisible={resizerVisible}
          interactive={!dragging}
          shape={containerShape}
          width={nodeSize.width}
          height={nodeSize.height}
        />
      </div>
    </>
  );
}

export const WorkspaceNoteNode = memo(WorkspaceNoteNodeComponent);
