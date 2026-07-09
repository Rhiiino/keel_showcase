// stack_sandbox/frontend_web/src/modules/chat/components/status/StatusPanel.tsx

// Tabbed status panel with drag-to-stack panes (General, Log, …).

import { useCallback, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";

import {
  PanelRepositionGrip,
  PanelResizeHandle,
} from "../../../../components/panels";
import {
  allowStatusPanelTabDrop,
  readStatusPanelTabDragData,
  setStatusPanelTabDragData,
  statusPanelTabs,
  StatusPanelTabContent,
  type StatusPanelTabContentProps,
  type StatusPanelTabId,
  type StatusPanelSide,
  type StatusPanelTabLayout,
  isStackedLayout,
  MIN_STACKED_PANE_FRACTION,
  tabLabel,
} from "../../lib/status";

type StatusPanelProps = Omit<StatusPanelTabContentProps, "tabId"> & {
  side: StatusPanelSide;
  width: number;
  isResizing: boolean;
  isRepositioning: boolean;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onRepositionPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  layout: StatusPanelTabLayout;
  activeTabId: StatusPanelTabId;
  onSelectTab: (tabId: StatusPanelTabId) => void;
  onDockTab: (tabId: StatusPanelTabId, index?: number) => void;
  onUndockTab: (tabId: StatusPanelTabId) => void;
  paneHeightFractions: number[];
  onResizePaneDivider: (
    dividerIndex: number,
    topFraction: number,
    bottomFraction: number,
  ) => void;
};

function PaneJoinDivider({
  dividerIndex,
  active,
  dragging,
  isResizing,
  onResizePointerDown,
  onDragOver,
  onDrop,
}: {
  dividerIndex: number;
  active: boolean;
  dragging: boolean;
  isResizing: boolean;
  onResizePointerDown: (
    dividerIndex: number,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "relative z-10 mx-1 shrink-0 transition-all",
        dragging ? "py-2" : "py-0.5",
      ].join(" ")}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize stacked panes"
        title="Drag to resize stacked panes"
        onPointerDown={(event) => onResizePointerDown(dividerIndex, event)}
        className={[
          "flex touch-none items-center justify-center rounded-full transition-all",
          dragging ? "h-1.5" : "h-2",
          isResizing
            ? "cursor-row-resize bg-lime-400/70 shadow-[0_0_12px_rgba(163,230,53,0.35)]"
            : active
              ? "cursor-row-resize bg-lime-400/70 shadow-[0_0_12px_rgba(163,230,53,0.35)]"
              : dragging
                ? "cursor-row-resize bg-stone-800/90 ring-1 ring-stone-700/80"
                : "cursor-row-resize bg-gradient-to-r from-transparent via-stone-700/80 to-transparent hover:via-stone-500/90",
        ].join(" ")}
      />
    </div>
  );
}

function StackedPaneHeader({
  tabId,
  onDragStart,
  onDragEnd,
  isDraggingThis,
}: {
  tabId: StatusPanelTabId;
  onDragStart: (tabId: StatusPanelTabId, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  isDraggingThis: boolean;
}) {
  return (
    <div
      draggable
      title="Drag to main header to undock"
      onDragStart={(event) => onDragStart(tabId, event)}
      onDragEnd={onDragEnd}
      className={[
        "flex shrink-0 cursor-grab items-center gap-2 border-b border-stone-800/90 bg-stone-900/80 px-3 py-2 transition active:cursor-grabbing",
        isDraggingThis ? "opacity-50" : "hover:bg-stone-900",
      ].join(" ")}
    >
      <span className="h-3 w-0.5 shrink-0 rounded-full bg-lime-400/50" aria-hidden />
      <span className="min-w-0 flex-1 font-mono text-[10px] uppercase tracking-wider text-stone-300">
        {tabLabel(tabId)}
      </span>
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 shrink-0 text-stone-600"
        fill="currentColor"
        aria-hidden
      >
        <circle cx="9" cy="7" r="1.25" />
        <circle cx="15" cy="7" r="1.25" />
        <circle cx="9" cy="12" r="1.25" />
        <circle cx="15" cy="12" r="1.25" />
      </svg>
    </div>
  );
}

function BottomDropZone({
  active,
  visible,
  onDragOver,
  onDrop,
}: {
  active: boolean;
  visible: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "flex min-h-0 flex-1 flex-col items-center justify-center border-t-2 border-dashed transition",
        active
          ? "border-lime-400/70 bg-lime-400/10"
          : "border-stone-600/70 bg-stone-900/40",
      ].join(" ")}
    >
      <span className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-lime-400/90">
        Drop to stack below
      </span>
      <span className="mt-1.5 text-[11px] text-stone-500">
        Release to add this tab here
      </span>
    </div>
  );
}

export function StatusPanel({
  side,
  width,
  isResizing,
  isRepositioning,
  onResizePointerDown,
  onRepositionPointerDown,
  layout,
  activeTabId,
  onSelectTab,
  onDockTab,
  onUndockTab,
  paneHeightFractions,
  onResizePaneDivider,
  ...tabContentProps
}: StatusPanelProps) {
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const isLeft = side === "left";
  const borderClass = isLeft ? "border-r" : "border-l";

  const stacked = isStackedLayout(layout);
  const [draggingTabId, setDraggingTabId] = useState<StatusPanelTabId | null>(
    null,
  );
  const isDragging = draggingTabId !== null;
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [headerDropActive, setHeaderDropActive] = useState(false);
  const [bottomDropActive, setBottomDropActive] = useState(false);
  const [resizingDividerIndex, setResizingDividerIndex] = useState<number | null>(
    null,
  );

  const clearDragUi = () => {
    setDraggingTabId(null);
    setDropIndex(null);
    setHeaderDropActive(false);
    setBottomDropActive(false);
  };

  const handleTabDragStart = (
    tabId: StatusPanelTabId,
    event: DragEvent<HTMLElement>,
  ) => {
    setStatusPanelTabDragData(event.dataTransfer, tabId);
    setDraggingTabId(tabId);
  };

  const handleTabBarDragOver = (event: DragEvent<HTMLDivElement>) => {
    const tabId = readStatusPanelTabDragData(event.dataTransfer) ?? draggingTabId;
    if (!tabId) {
      return;
    }
    allowStatusPanelTabDrop(event);
    setHeaderDropActive(true);
    setBottomDropActive(false);
    setDropIndex(null);
  };

  const handleTabBarDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const tabId = readStatusPanelTabDragData(event.dataTransfer) ?? draggingTabId;
    clearDragUi();
    if (tabId && stacked && layout.panes.includes(tabId)) {
      onUndockTab(tabId);
    }
  };

  const handlePaneInsertDragOver = (
    index: number,
    event: DragEvent<HTMLDivElement>,
  ) => {
    if (!draggingTabId) {
      return;
    }
    allowStatusPanelTabDrop(event);
    setDropIndex(index);
    setHeaderDropActive(false);
    setBottomDropActive(false);
  };

  const handlePaneInsertDrop = (
    index: number,
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    const tabId = readStatusPanelTabDragData(event.dataTransfer) ?? draggingTabId;
    clearDragUi();
    if (tabId) {
      onDockTab(tabId, index);
    }
  };

  const handleBottomDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!draggingTabId) {
      return;
    }
    allowStatusPanelTabDrop(event);
    setBottomDropActive(true);
    setHeaderDropActive(false);
    setDropIndex(null);
  };

  const handleBottomDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const tabId = readStatusPanelTabDragData(event.dataTransfer) ?? draggingTabId;
    clearDragUi();
    if (tabId) {
      onDockTab(tabId);
    }
  };

  const handleDividerResizePointerDown = useCallback(
    (dividerIndex: number, event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const container = stackContainerRef.current;
      if (!container || dividerIndex <= 0 || dividerIndex >= layout.panes.length) {
        return;
      }

      const startY = event.clientY;
      const containerHeight = container.clientHeight;
      if (containerHeight <= 0) {
        return;
      }

      const topStart = paneHeightFractions[dividerIndex - 1] ?? 0.5;
      const bottomStart = paneHeightFractions[dividerIndex] ?? 0.5;
      const minFraction = MIN_STACKED_PANE_FRACTION;

      setResizingDividerIndex(dividerIndex);

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const deltaFraction = (moveEvent.clientY - startY) / containerHeight;
        let nextTop = topStart + deltaFraction;
        let nextBottom = bottomStart - deltaFraction;

        if (nextTop < minFraction) {
          nextBottom -= minFraction - nextTop;
          nextTop = minFraction;
        }
        if (nextBottom < minFraction) {
          nextTop -= minFraction - nextBottom;
          nextBottom = minFraction;
        }

        onResizePaneDivider(dividerIndex, nextTop, nextBottom);
      };

      const handlePointerUp = () => {
        setResizingDividerIndex(null);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [layout.panes.length, onResizePaneDivider, paneHeightFractions],
  );

  const lastPaneIndex = layout.panes.length - 1;

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col ${borderClass} border-stone-800/80 bg-stone-950/30`}
      style={{ width }}
    >
      <div
        className={[
          "flex shrink-0 border-b transition",
          headerDropActive
            ? "border-lime-400/40 bg-lime-400/5"
            : "border-stone-800/80",
        ].join(" ")}
        role="tablist"
        aria-label="Status panel"
        onDragOver={handleTabBarDragOver}
        onDragLeave={() => setHeaderDropActive(false)}
        onDrop={handleTabBarDrop}
      >
        {isLeft && (
          <PanelRepositionGrip
            side={side}
            isRepositioning={isRepositioning}
            onPointerDown={onRepositionPointerDown}
          />
        )}

        {statusPanelTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isDocked = stacked && layout.panes.includes(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              draggable
              title="Drag to stack below; drop on header to undock"
              onDragStart={(event) => handleTabDragStart(tab.id, event)}
              onDragEnd={clearDragUi}
              onClick={() => onSelectTab(tab.id)}
              className={[
                "flex flex-1 cursor-grab items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition active:cursor-grabbing",
                isActive
                  ? "border-b-2 border-lime-400/80 text-stone-100"
                  : "border-b-2 border-transparent text-stone-500 hover:text-stone-300",
              ].join(" ")}
            >
              {isDocked && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400/70"
                  aria-hidden
                />
              )}
              {tab.label}
            </button>
          );
        })}

        {!isLeft && (
          <PanelRepositionGrip
            side={side}
            isRepositioning={isRepositioning}
            onPointerDown={onRepositionPointerDown}
          />
        )}
      </div>

      <div
        ref={stackContainerRef}
        className={[
          "flex min-h-0 flex-1 flex-col",
          stacked ? "gap-2 bg-stone-950/50 p-2" : "",
        ].join(" ")}
      >
        {layout.panes.map((paneTabId, index) => {
          const isLastPane = index === lastPaneIndex;
          const showBottomDropInPane = isDragging && isLastPane;
          const paneFlex = stacked ? (paneHeightFractions[index] ?? 1) : 1;

          return (
            <div
              key={paneTabId}
              className="flex min-h-0 flex-col"
              style={stacked ? { flex: `${paneFlex} 1 0%` } : { flex: "1 1 0%" }}
            >
              {index > 0 && (
                <PaneJoinDivider
                  dividerIndex={index}
                  active={dropIndex === index}
                  dragging={isDragging}
                  isResizing={resizingDividerIndex === index}
                  onResizePointerDown={handleDividerResizePointerDown}
                  onDragOver={(event) => handlePaneInsertDragOver(index, event)}
                  onDrop={(event) => handlePaneInsertDrop(index, event)}
                />
              )}

              <div
                className={[
                  "flex min-h-0 flex-1 flex-col overflow-hidden",
                  stacked
                    ? "rounded-lg border border-stone-800/90 bg-stone-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    : "",
                ].join(" ")}
              >
                {stacked && (
                  <StackedPaneHeader
                    tabId={paneTabId}
                    onDragStart={handleTabDragStart}
                    onDragEnd={clearDragUi}
                    isDraggingThis={draggingTabId === paneTabId}
                  />
                )}

                <div
                  className={[
                    "flex min-h-0 flex-1 flex-col",
                    showBottomDropInPane ? "min-h-0" : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex min-h-0 flex-col",
                      showBottomDropInPane ? "min-h-0 flex-1 overflow-hidden" : "flex-1",
                    ].join(" ")}
                    role="tabpanel"
                    aria-label={tabLabel(paneTabId)}
                  >
                    <StatusPanelTabContent
                      tabId={paneTabId}
                      {...tabContentProps}
                    />
                  </div>

                  <BottomDropZone
                    visible={showBottomDropInPane}
                    active={bottomDropActive}
                    onDragOver={handleBottomDragOver}
                    onDrop={handleBottomDrop}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PanelResizeHandle
        side={side}
        isResizing={isResizing}
        onPointerDown={onResizePointerDown}
      />
    </aside>
  );
}
