// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteBodyContextMenu.tsx

// Right-click menu shown while editing a workspace note body.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { WorkspaceNoteBodyContextMenuAction } from "./workspaceNoteBodyContextMenuActions";

type WorkspaceNoteBodyContextMenuProps = {
  clientX: number;
  clientY: number;
  actions: WorkspaceNoteBodyContextMenuAction[];
  onClose: () => void;
};

export function WorkspaceNoteBodyContextMenu({
  clientX,
  clientY,
  actions,
  onClose,
}: WorkspaceNoteBodyContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (menuRef.current && target instanceof Node && menuRef.current.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Note body actions"
      className="fixed z-[1000] min-w-[180px] overflow-hidden rounded-lg border border-stone-700/90 bg-stone-950/95 py-1 shadow-xl backdrop-blur-sm"
      style={{ left: clientX, top: clientY }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          onMouseDown={(event) => {
            // Keep the note textarea focused so blur does not revert the edit.
            event.preventDefault();
          }}
          onClick={() => {
            action.onSelect();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-stone-900"
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );

  return createPortal(menu, document.body);
}
