// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteBodySelectionToolbar.tsx

// Floating toolbar shown near highlighted text while editing a workspace note body.

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";

import type { WorkspaceNoteTextSelectionState } from "../../../hooks/useWorkspaceNoteTextSelection";
import { WorkspaceNoteBodySelectionActionRow } from "./WorkspaceNoteBodySelectionActionRow";
import { WorkspaceNoteBodyTextFormatToolbar } from "./WorkspaceNoteBodyTextFormatToolbar";
import type { WorkspaceNoteBodySelectionAction } from "./workspaceNoteBodySelectionActions";

const TOOLBAR_GAP_PX = 8;

type WorkspaceNoteBodySelectionToolbarProps = {
  selection: WorkspaceNoteTextSelectionState;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  actions: WorkspaceNoteBodySelectionAction[];
  onClose: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleStrikethrough: () => void;
  onSelectColor: (hex: string) => void;
};

export function WorkspaceNoteBodySelectionToolbar({
  selection,
  textareaRef,
  actions,
  onClose,
  onToggleBold,
  onToggleItalic,
  onToggleStrikethrough,
  onSelectColor,
}: WorkspaceNoteBodySelectionToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        toolbarRef.current &&
        target instanceof Node &&
        toolbarRef.current.contains(target)
      ) {
        return;
      }
      if (
        textareaRef.current &&
        target instanceof Node &&
        textareaRef.current.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, textareaRef]);

  const centerX = selection.rect.left + selection.rect.width / 2;
  const anchorTop = selection.rect.top - TOOLBAR_GAP_PX;

  const toolbar = (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Note body text formatting"
      className="nodrag nopan fixed z-[1000] -translate-x-1/2 -translate-y-full rounded-lg border border-stone-800 bg-stone-950/90 p-1 shadow-lg ring-1 ring-stone-800/80 backdrop-blur-sm"
      style={{ left: centerX, top: anchorTop }}
    >
      <div className="flex flex-col gap-1">
        <WorkspaceNoteBodyTextFormatToolbar
          formats={selection.formats}
          onToggleBold={onToggleBold}
          onToggleItalic={onToggleItalic}
          onToggleStrikethrough={onToggleStrikethrough}
          onSelectColor={onSelectColor}
        />
        <WorkspaceNoteBodySelectionActionRow actions={actions} />
      </div>
    </div>
  );

  return createPortal(toolbar, document.body);
}
