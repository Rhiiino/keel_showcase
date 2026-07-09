// keel_web/src/modules/projects/components/workspace/panel/WorkspaceMediaDragPreview.tsx

// Floating ghost card while dragging saved media from the files panel onto the canvas.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { projectMediaKindBadge } from "../../../lib/project/media";
import {
  getWorkspaceMediaDragPreview,
  subscribeWorkspaceMediaDragPreview,
} from "../../../lib/workspace";

export function WorkspaceMediaDragPreview() {
  const [preview, setPreview] = useState(getWorkspaceMediaDragPreview);

  useEffect(() => subscribeWorkspaceMediaDragPreview(() => {
    setPreview(getWorkspaceMediaDragPreview());
  }), []);

  if (!preview) {
    return null;
  }

  const { payload, x, y } = preview;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] flex items-center gap-2 rounded-lg border border-stone-700/90 bg-stone-950/95 px-2.5 py-2 shadow-xl ring-1 ring-sky-400/30 backdrop-blur-sm"
      style={{
        left: x + 14,
        top: y + 14,
      }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-800 text-[9px] font-semibold uppercase text-stone-300">
        {projectMediaKindBadge(payload.media_kind)}
      </span>
      <span className="max-w-[180px] truncate text-xs font-medium text-stone-100">
        {payload.original_filename}
      </span>
    </div>,
    document.body,
  );
}
