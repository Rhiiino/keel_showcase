// keel_web/src/modules/projects/components/media/ProjectItemDragPreview.tsx

// Off-screen drag ghost with thumbnail and filename for project file/folder cards.

import { createPortal } from "react-dom";
import type { DragEvent, ReactNode, RefObject } from "react";

export const PROJECT_ITEM_DRAG_IMAGE_OFFSET = { x: 17, y: 26 } as const;

type ProjectItemDragPreviewProps = {
  previewRef: RefObject<HTMLDivElement>;
  filename: string;
  children: ReactNode;
  variant?: "media" | "folder";
};

export function ProjectItemDragPreview({
  previewRef,
  filename,
  children,
  variant = "media",
}: ProjectItemDragPreviewProps) {
  const iconFrameClass =
    variant === "folder"
      ? "flex h-[34px] w-[34px] items-center justify-center text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
      : "flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-md bg-stone-900/95 ring-1 ring-stone-700/60 shadow-lg shadow-black/40";

  return createPortal(
    <div
      ref={previewRef}
      className="pointer-events-none fixed -left-[9999px] -top-[9999px] z-[9999] flex w-[72px] flex-col items-center gap-1 text-center"
      aria-hidden
    >
      <div className={iconFrameClass}>{children}</div>
      <p className="line-clamp-2 w-full break-words text-[10px] font-medium leading-tight text-stone-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
        {filename}
      </p>
    </div>,
    document.body,
  );
}

export function applyProjectItemDragImage(
  event: DragEvent,
  previewRef: RefObject<HTMLDivElement>,
) {
  if (previewRef.current) {
    event.dataTransfer.setDragImage(
      previewRef.current,
      PROJECT_ITEM_DRAG_IMAGE_OFFSET.x,
      PROJECT_ITEM_DRAG_IMAGE_OFFSET.y,
    );
  }
}
