// keel_web/src/modules/projects/components/workspace/canvas/WorkspaceCanvasContextMenu.tsx

// Right-click context menu for the project workspace canvas.

import { useEffect, useRef } from "react";

import { useWorkspaceCanvasDeleteConfirm } from "./useWorkspaceCanvasDeleteConfirm";

export type WorkspaceCanvasContextMenuState =
  | {
      kind: "pane";
      clientX: number;
      clientY: number;
    }
  | {
      kind: "note";
      clientX: number;
      clientY: number;
      nodeId: string;
    }
  | null;

type WorkspaceCanvasContextMenuProps = {
  menu: WorkspaceCanvasContextMenuState;
  onClose: () => void;
  onAddNote: () => void;
  onDeleteNote: (nodeId: string) => void;
};

export function WorkspaceCanvasContextMenu({
  menu,
  onClose,
  onAddNote,
  onDeleteNote,
}: WorkspaceCanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteResetKey = menu?.kind === "note" ? menu.nodeId : null;
  const { deleteConfirmPending, setDeleteConfirmPending } =
    useWorkspaceCanvasDeleteConfirm(deleteResetKey);

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

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={menu.kind === "note" ? "Note actions" : "Canvas actions"}
      className="fixed z-[100] min-w-[160px] overflow-hidden rounded-lg border border-stone-700/90 bg-stone-950/95 py-1 shadow-xl backdrop-blur-sm"
      style={{ left: menu.clientX, top: menu.clientY }}
    >
      {menu.kind === "pane" ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onAddNote();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-stone-900"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-stone-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add note
        </button>
      ) : (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            if (deleteConfirmPending) {
              onDeleteNote(menu.nodeId);
              onClose();
              return;
            }
            setDeleteConfirmPending(true);
          }}
          className={[
            "flex w-full px-3 py-2 text-left text-sm transition",
            deleteConfirmPending
              ? "bg-red-950/50 text-red-200 hover:bg-red-950/70"
              : "text-red-300 hover:bg-red-950/40",
          ].join(" ")}
        >
          {deleteConfirmPending ? "Confirm delete" : "Delete"}
        </button>
      )}
    </div>
  );
}
