// keel_web/src/modules/coak/components/panels/CoakWorkspaceTabDragPreview.tsx

import { createPortal } from "react-dom";

import type { CoakTabDragPreview } from "../../hooks/panels/useCoakWorkspaceTabDrag";
import { coakTabLabel } from "../../lib/panels/coakWindowLayout";
import {
  CoakConstellationTabIcon,
  CoakDirectoryTabIcon,
  CoakGeneralTabIcon,
  CoakSettingsTabIcon,
} from "./CoakWorkspaceTabIcons";

type CoakWorkspaceTabDragPreviewProps = {
  preview: CoakTabDragPreview | null;
};

function tabIcon(tabId: CoakTabDragPreview["tabId"]) {
  const className = "h-3.5 w-3.5 shrink-0";
  if (tabId === "constellation") {
    return <CoakConstellationTabIcon className={className} />;
  }
  if (tabId === "general") {
    return <CoakGeneralTabIcon className={className} />;
  }
  if (tabId === "settings") {
    return <CoakSettingsTabIcon className={className} />;
  }
  return <CoakDirectoryTabIcon className={className} />;
}

export function CoakWorkspaceTabDragPreview({ preview }: CoakWorkspaceTabDragPreviewProps) {
  if (!preview || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md border border-stone-600/80 bg-stone-900/95 px-2 py-1 text-xs font-medium text-stone-100 shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/[0.06]"
      style={{
        left: preview.clientX,
        top: preview.clientY,
      }}
      aria-hidden
    >
      {tabIcon(preview.tabId)}
      <span className="truncate">{coakTabLabel(preview.tabId)}</span>
    </div>,
    document.body,
  );
}
