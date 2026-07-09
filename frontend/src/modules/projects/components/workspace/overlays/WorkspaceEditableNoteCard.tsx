// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceEditableNoteCard.tsx

// Inline-editable note card body used in reference modal and notes grid overlay.

import { useReactFlow } from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { useWorkspaceNoteRefPicker } from "../../../hooks/useWorkspaceNoteRefPicker";
import type { WorkspaceNoteData } from "../../../lib/workspace";
import {
  insertMarkdownCheckboxAtLine,
  insertMarkdownSeparatorAtLine,
  toggleMarkdownTaskItemAtLine,
} from "../../../lib/workspace/note";
import {
  resolveContainerShape,
  resolveNoteColors,
  resolveWorkspaceNoteColorStyleOrDefault,
} from "../../../lib/workspace/node";
import {
  useWorkspaceNoteColorStyle,
  useWorkspaceRequestSave,
  useWorkspaceTextFontSizes,
} from "../context/WorkspaceCanvasContext";
import { WorkspaceNoteBodyContextMenu } from "../nodes/WorkspaceNoteBodyContextMenu";
import { buildWorkspaceNoteBodyContextMenuActions } from "../nodes/workspaceNoteBodyContextMenuActions";
import { WorkspaceNoteMarkdown } from "../nodes/WorkspaceNoteMarkdown";
import { WorkspaceNoteRefPicker } from "../nodes/WorkspaceNoteRefPicker";

const DEFAULT_NOTE_TITLE = "Note";

type WorkspaceEditableNoteCardProps = {
  noteId: string;
  data: WorkspaceNoteData;
  minWidth?: number;
  className?: string;
  fillHeight?: boolean;
  fitContent?: boolean;
  autoFocusTitle?: boolean;
  enableTaskToggle?: boolean;
  enableBodyContextMenu?: boolean;
  onEditingStateChange?: (editing: { title: boolean; body: boolean }) => void;
  onSwapContextMenu?: (clientX: number, clientY: number) => void;
};

export function WorkspaceEditableNoteCard({
  noteId,
  data,
  minWidth = 280,
  className = "",
  fillHeight = false,
  fitContent = false,
  autoFocusTitle = false,
  enableTaskToggle = false,
  enableBodyContextMenu = false,
  onEditingStateChange,
  onSwapContextMenu,
}: WorkspaceEditableNoteCardProps) {
  const { updateNodeData } = useReactFlow();
  const requestSave = useWorkspaceRequestSave();
  const noteColorStyle = useWorkspaceNoteColorStyle();
  const { titlePx, bodyPx } = useWorkspaceTextFontSizes();

  const [titleDraft, setTitleDraft] = useState(data.title ?? "");
  const [bodyDraft, setBodyDraft] = useState(data.text ?? "");
  const [bodyFocused, setBodyFocused] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [bodyContextMenu, setBodyContextMenu] = useState<{
    clientX: number;
    clientY: number;
    cursor: number;
  } | null>(null);
  const titleFocusedRef = useRef(false);
  const bodyFocusedRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const autoFocusTitleAppliedRef = useRef(false);

  const noteRefPicker = useWorkspaceNoteRefPicker({
    noteId,
    text: bodyDraft,
    textareaRef: bodyTextareaRef,
    onTextChange: setBodyDraft,
  });

  useEffect(() => {
    if (!titleFocusedRef.current) {
      setTitleDraft(data.title ?? "");
    }
  }, [data.title, noteId]);

  useEffect(() => {
    autoFocusTitleAppliedRef.current = false;
  }, [noteId]);

  useEffect(() => {
    if (!bodyFocusedRef.current) {
      setBodyDraft(data.text ?? "");
    }
  }, [data.text, noteId]);

  useEffect(() => {
    onEditingStateChange?.({ title: titleFocused, body: bodyFocused });
  }, [bodyFocused, onEditingStateChange, titleFocused]);

  useEffect(() => {
    if (!autoFocusTitle || autoFocusTitleAppliedRef.current) {
      return;
    }
    autoFocusTitleAppliedRef.current = true;
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, [autoFocusTitle]);

  useEffect(() => {
    if (!bodyFocused) {
      return;
    }
    bodyTextareaRef.current?.focus();
  }, [bodyFocused]);

  const autosizeBodyTextarea = useCallback(() => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    if (!bodyFocused) {
      return;
    }
    autosizeBodyTextarea();
  }, [autosizeBodyTextarea, bodyDraft, bodyFocused, bodyPx, titlePx, titleDraft]);

  const commitBody = useCallback(
    (value: string) => {
      if (value === data.text) {
        return;
      }
      updateNodeData(noteId, { text: value });
      requestSave();
    },
    [data.text, noteId, requestSave, updateNodeData],
  );

  const commitTitle = useCallback(
    (nextTitle: string) => {
      const trimmed = nextTitle.trim() || DEFAULT_NOTE_TITLE;
      const current = (data.title ?? "").trim() || DEFAULT_NOTE_TITLE;
      setTitleDraft(trimmed);
      if (trimmed === current) {
        return;
      }
      updateNodeData(noteId, { title: trimmed });
      requestSave();
    },
    [data.title, noteId, requestSave, updateNodeData],
  );

  const applyBodyTextEdit = useCallback(
    (nextText: string, nextCursor: number) => {
      setBodyDraft(nextText);
      noteRefPicker.dismiss();

      if (nextText !== data.text) {
        updateNodeData(noteId, { text: nextText });
        requestSave();
      }

      requestAnimationFrame(() => {
        const textarea = bodyTextareaRef.current;
        textarea?.focus();
        textarea?.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [data.text, noteId, noteRefPicker, requestSave, updateNodeData],
  );

  const handleToggleTaskLine = useCallback(
    (lineIndex: number) => {
      const result = toggleMarkdownTaskItemAtLine(bodyDraft, lineIndex);
      if (!result) {
        return;
      }

      setBodyDraft(result.nextText);
      if (result.nextText !== data.text) {
        updateNodeData(noteId, { text: result.nextText });
        requestSave();
      }
    },
    [bodyDraft, data.text, noteId, requestSave, updateNodeData],
  );

  const handleAddSeparator = useCallback(
    (cursor: number) => {
      const { nextText, nextCursor } = insertMarkdownSeparatorAtLine(bodyDraft, cursor);
      applyBodyTextEdit(nextText, nextCursor);
    },
    [applyBodyTextEdit, bodyDraft],
  );

  const handleAddCheckbox = useCallback(
    (cursor: number) => {
      const { nextText, nextCursor } = insertMarkdownCheckboxAtLine(bodyDraft, cursor);
      applyBodyTextEdit(nextText, nextCursor);
    },
    [applyBodyTextEdit, bodyDraft],
  );

  const bodyContextMenuActions = useMemo(() => {
    if (!bodyContextMenu) {
      return [];
    }
    return buildWorkspaceNoteBodyContextMenuActions({
      onAddSeparator: () => handleAddSeparator(bodyContextMenu.cursor),
      onAddCheckbox: () => handleAddCheckbox(bodyContextMenu.cursor),
    });
  }, [bodyContextMenu, handleAddCheckbox, handleAddSeparator]);

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (bodyFocusedRef.current && enableBodyContextMenu) {
        event.preventDefault();
        event.stopPropagation();
        const cursor = bodyTextareaRef.current?.selectionStart ?? 0;
        setBodyContextMenu({
          clientX: event.clientX,
          clientY: event.clientY,
          cursor,
        });
        return;
      }

      if (titleFocusedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (onSwapContextMenu) {
        event.preventDefault();
        event.stopPropagation();
        onSwapContextMenu(event.clientX, event.clientY);
      }
    },
    [enableBodyContextMenu, onSwapContextMenu],
  );

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

  return (
    <>
      <article
        className={[
          "relative flex min-h-0 flex-col overflow-hidden shadow-2xl",
          fillHeight ? "h-full" : "h-fit max-h-full",
          shapeClass,
          className,
        ].join(" ")}
        style={{
          minWidth,
          backgroundColor: data.transparent ? "transparent" : colorStyle.fillColor,
          boxShadow: data.hideChrome
            ? undefined
            : `inset 0 0 0 ${colorStyle.borderWidth}px ${colorStyle.borderColor}`,
        }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={handleContextMenu}
      >
        <header className="shrink-0 px-6 pt-6" style={{ fontSize: titlePx }}>
          <input
            ref={titleInputRef}
            type="text"
            value={titleDraft}
            placeholder={DEFAULT_NOTE_TITLE}
            aria-label="Note title"
            onChange={(event) => setTitleDraft(event.target.value)}
            onFocus={() => {
              titleFocusedRef.current = true;
              setTitleFocused(true);
            }}
            onBlur={(event) => {
              titleFocusedRef.current = false;
              setTitleFocused(false);
              commitTitle(event.target.value);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTitle(titleDraft);
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setTitleDraft(data.title ?? "");
                event.currentTarget.blur();
              }
            }}
            className="w-full rounded-sm bg-transparent font-medium leading-tight text-stone-100 outline-none ring-0 placeholder:text-stone-500 focus:ring-1 focus:ring-sky-400/40"
          />
        </header>

        <div
          className={[
            "relative min-h-0 break-words px-6 pb-6 pt-4 text-stone-100 [overflow-wrap:anywhere] [&_pre]:whitespace-pre-wrap [&_pre]:break-words",
            fillHeight && !fitContent ? "flex-1 overflow-y-auto" : "",
          ].join(" ")}
          style={{ fontSize: bodyPx }}
        >
          {bodyFocused ? (
            <>
              <textarea
                ref={bodyTextareaRef}
                value={bodyDraft}
                placeholder="Write a note…"
                aria-label="Note body"
                onChange={(event) => {
                  setBodyDraft(event.target.value);
                  noteRefPicker.updateFromCursor(event.target.selectionStart ?? 0);
                }}
                onSelect={(event) => {
                  noteRefPicker.updateFromCursor(event.currentTarget.selectionStart ?? 0);
                }}
                onClick={(event) => {
                  noteRefPicker.updateFromCursor(event.currentTarget.selectionStart ?? 0);
                }}
                onFocus={() => {
                  bodyFocusedRef.current = true;
                  setBodyFocused(true);
                }}
                onBlur={(event) => {
                  bodyFocusedRef.current = false;
                  setBodyFocused(false);
                  noteRefPicker.dismiss();
                  commitBody(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (noteRefPicker.handleKeyDown(event)) {
                    return;
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setBodyDraft(data.text ?? "");
                    noteRefPicker.dismiss();
                    event.currentTarget.blur();
                  }
                }}
                className="min-h-[1.5em] w-full resize-none overflow-hidden bg-transparent leading-relaxed text-stone-100 outline-none placeholder:text-stone-500"
              />
              <WorkspaceNoteRefPicker
                open={noteRefPicker.open}
                candidates={noteRefPicker.candidates}
                activeIndex={noteRefPicker.activeIndex}
                onSelect={noteRefPicker.selectCandidate}
              />
            </>
          ) : (
            <div
              className="cursor-text"
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).closest("[data-workspace-note-ref]")) {
                  return;
                }
                if ((event.target as HTMLElement).closest("input[type='checkbox']")) {
                  return;
                }
                event.stopPropagation();
              }}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("[data-workspace-note-ref]")) {
                  return;
                }
                if ((event.target as HTMLElement).closest("input[type='checkbox']")) {
                  return;
                }
                bodyFocusedRef.current = true;
                setBodyFocused(true);
              }}
            >
              <WorkspaceNoteMarkdown
                text={bodyDraft}
                onToggleTaskLine={enableTaskToggle ? handleToggleTaskLine : undefined}
              />
            </div>
          )}
        </div>
      </article>
      {bodyContextMenu ? (
        <WorkspaceNoteBodyContextMenu
          clientX={bodyContextMenu.clientX}
          clientY={bodyContextMenu.clientY}
          actions={bodyContextMenuActions}
          onClose={() => setBodyContextMenu(null)}
        />
      ) : null}
    </>
  );
}
