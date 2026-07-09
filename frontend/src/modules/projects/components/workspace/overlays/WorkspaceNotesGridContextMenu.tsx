// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceNotesGridContextMenu.tsx

// Right-click context menu for workspace notes grid tiles.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { useWorkspaceCanvasDeleteConfirm } from "../canvas/useWorkspaceCanvasDeleteConfirm";
import type { WorkspaceNotesGridContextMenuAction } from "../../../lib/workspace/note/workspaceNotesGridContextMenuActions";

export type WorkspaceNotesGridContextMenuState = {
  noteId: string;
  clientX: number;
  clientY: number;
} | null;

type WorkspaceNotesGridContextMenuProps = {
  menu: WorkspaceNotesGridContextMenuState;
  actions: WorkspaceNotesGridContextMenuAction[];
  onClose: () => void;
};

export function WorkspaceNotesGridContextMenu({
  menu,
  actions,
  onClose,
}: WorkspaceNotesGridContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteConfirmPending, setDeleteConfirmPending } = useWorkspaceCanvasDeleteConfirm(
    menu?.noteId ?? null,
  );

  useEffect(() => {
    if (!menu) {
      return;
    }

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
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Notes grid tile actions"
      className="fixed z-[110] min-w-[160px] overflow-hidden rounded-lg border border-stone-700/90 bg-stone-950/95 py-1 shadow-xl backdrop-blur-sm"
      style={{ left: menu.clientX, top: menu.clientY }}
    >
      {actions.map((action) => {
        const isDelete = action.destructive === true;
        const label =
          isDelete && deleteConfirmPending
            ? (action.confirmLabel ?? "Confirm delete")
            : action.label;

        return (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            onClick={() => {
              if (typeof action.onSelect !== "function") {
                return;
              }
              if (isDelete) {
                if (deleteConfirmPending) {
                  action.onSelect();
                  onClose();
                  return;
                }
                setDeleteConfirmPending(true);
                return;
              }
              action.onSelect();
              onClose();
            }}
            className={[
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
              isDelete
                ? deleteConfirmPending
                  ? "bg-red-950/50 text-red-200 hover:bg-red-950/70"
                  : "text-red-300 hover:bg-red-950/40"
                : "text-stone-200 hover:bg-stone-900",
            ].join(" ")}
          >
            {action.icon}
            {label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
