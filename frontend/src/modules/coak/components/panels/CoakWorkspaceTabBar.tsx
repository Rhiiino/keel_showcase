// keel_web/src/modules/coak/components/panels/CoakWorkspaceTabBar.tsx

import { useLayoutEffect, useRef, useState } from "react";

import type { CoakTabDropIndicator } from "../../hooks/panels/useCoakWorkspaceTabDrag";
import type { CoakWorkspaceTabId } from "../../api";
import { coakTabLabel } from "../../lib/panels/coakWindowLayout";
import {
  CoakConstellationTabIcon,
  CoakDirectoryTabIcon,
  CoakGeneralTabIcon,
  CoakSettingsTabIcon,
  CoakTagsTabIcon,
} from "./CoakWorkspaceTabIcons";

type CoakWorkspaceTabBarProps = {
  windowId: string;
  tabs: CoakWorkspaceTabId[];
  activeTab: CoakWorkspaceTabId;
  draggingTabId: CoakWorkspaceTabId | null;
  dropIndicator: CoakTabDropIndicator | null;
  className?: string;
  onSelectTab: (tabId: CoakWorkspaceTabId) => void;
  onTabPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    tabId: CoakWorkspaceTabId,
    windowId: string,
  ) => void;
  onTabPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onTabPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onTabPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

function tabIcon(tabId: CoakWorkspaceTabId) {
  const className = "h-3.5 w-3.5 shrink-0";
  if (tabId === "constellation") {
    return <CoakConstellationTabIcon className={className} />;
  }
  if (tabId === "general") {
    return <CoakGeneralTabIcon className={className} />;
  }
  if (tabId === "tags") {
    return <CoakTagsTabIcon className={className} />;
  }
  if (tabId === "settings") {
    return <CoakSettingsTabIcon className={className} />;
  }
  return <CoakDirectoryTabIcon className={className} />;
}

function measureDropLineOffset(
  dropZone: HTMLElement,
  index: number,
  draggingTabId: CoakWorkspaceTabId | null,
): number | null {
  const tabElements = [...dropZone.querySelectorAll<HTMLElement>("[data-coak-tab-id]")].filter(
    (tabElement) => tabElement.getAttribute("data-coak-tab-id") !== draggingTabId,
  );

  if (tabElements.length === 0) {
    return 4;
  }

  if (index <= 0) {
    return tabElements[0].offsetLeft - 2;
  }

  if (index >= tabElements.length) {
    const lastTab = tabElements[tabElements.length - 1];
    return lastTab.offsetLeft + lastTab.offsetWidth + 2;
  }

  return tabElements[index].offsetLeft - 2;
}

export function CoakWorkspaceTabBar({
  windowId,
  tabs,
  activeTab,
  draggingTabId,
  dropIndicator,
  className,
  onSelectTab,
  onTabPointerDown,
  onTabPointerMove,
  onTabPointerUp,
  onTabPointerCancel,
}: CoakWorkspaceTabBarProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dropLineOffset, setDropLineOffset] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (
      !dropIndicator ||
      dropIndicator.windowId !== windowId ||
      !dropZoneRef.current
    ) {
      setDropLineOffset(null);
      return;
    }

    setDropLineOffset(
      measureDropLineOffset(dropZoneRef.current, dropIndicator.index, draggingTabId),
    );
  }, [draggingTabId, dropIndicator, tabs, windowId]);

  return (
    <div
      ref={dropZoneRef}
      role="tablist"
      aria-label="Workspace tabs"
      data-coak-tab-drop-zone
      data-coak-window-id={windowId}
      className={["relative flex min-w-0 items-center gap-1", className ?? "flex-1"].join(" ")}
    >
      {dropLineOffset != null ? (
        <div
          className="pointer-events-none absolute top-1 bottom-1 w-px bg-lime-400/80 shadow-[0_0_6px_rgba(163,230,53,0.45)]"
          style={{ left: dropLineOffset }}
          aria-hidden
        />
      ) : null}

      {tabs.map((tabId) => {
        const active = activeTab === tabId;
        const dragging = draggingTabId === tabId;

        return (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={active}
            data-coak-tab-id={tabId}
            onClick={() => {
              if (draggingTabId) {
                return;
              }
              onSelectTab(tabId);
            }}
            onPointerDown={(event) => onTabPointerDown(event, tabId, windowId)}
            onPointerMove={onTabPointerMove}
            onPointerUp={onTabPointerUp}
            onPointerCancel={onTabPointerCancel}
            className={[
              "relative inline-flex min-w-0 touch-none select-none items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
              dragging ? "opacity-40" : "",
              active
                ? "bg-stone-800/80 text-stone-100 shadow-sm ring-1 ring-inset ring-white/[0.06]"
                : "text-stone-500 hover:bg-stone-900/70 hover:text-stone-300",
            ].join(" ")}
          >
            {tabIcon(tabId)}
            <span className="truncate">{coakTabLabel(tabId)}</span>
          </button>
        );
      })}
    </div>
  );
}
