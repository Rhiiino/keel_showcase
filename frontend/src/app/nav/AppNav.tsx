// src/app/nav/AppNav.tsx

// Unified app navigation: a single resizable panel that collapses to an icon rail
// and expands to reveal the Keel header, menu labels, and the signed-in user.

import { Link } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import keelLogo from "../../assets/general/keel.png";
import { ListInsertIndicator } from "../../views/list/primitives/ListInsertIndicator";
import {
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../lib/listReorder";
import { ProfileMenu } from "../../modules/auth/components/ProfileMenu";
import { PanelResizeHandle } from "../../components/panels/PanelResizeHandle";
import {
  layoutSignature,
  moveEntryInLayout,
  type NavLayoutEntry,
} from "./appNavLayout";
import { AppNavSeparator } from "./components/AppNavSeparator";
import {
  APP_NAV_RAIL_WIDTH,
  APP_NAV_WAVE_CYCLE_MS,
  buildNavWaveDelays,
  NAV_ICON_BUTTON_CLASS,
  NAV_ICON_SLOT_CLASS,
  NAV_LOGO_BLOCK_CLASS,
  NAV_RAIL_IMAGE_CLASS,
  NAV_ROW_CLASS,
  NAV_ROW_LABEL_CLASS,
  type NavAccent,
} from "./appNavConfig";
import {
  BreadcrumbContextMenu,
  type BreadcrumbContextMenuItem,
} from "../navigation/BreadcrumbContextMenu";
import type { NavMenuVisibility } from "../../modules/settings/api";
import {
  filterNavDisplayRows,
  resolveLayoutInsertIndexFromDisplay,
} from "./navMenuVisibility";
import type { NavRenderRow } from "./useAppNavOrder";
import { useNavWaveGlowEnabled } from "./useNavWaveGlowEnabled";

const RAIL_ACTIVE_CLASS: Record<NavAccent, string> = {
  lime: "bg-app-accent/15 text-app-accent ring-1 ring-app-accent/30",
  blue: "bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/30",
};

const LABEL_ACTIVE_TEXT: Record<NavAccent, string> = {
  lime: "font-semibold text-stone-50",
  blue: "font-semibold text-blue-100",
};

type NavContextMenuState =
  | {
      kind: "panel";
      left: number;
      top: number;
      displayInsertIndex: number;
    }
  | {
      kind: "item";
      left: number;
      top: number;
      itemId: string;
      hiddenPreview: boolean;
    }
  | {
      kind: "delete";
      left: number;
      top: number;
      separatorId: string;
    };

type AppNavProps = {
  allRows: NavRenderRow[];
  layout: NavLayoutEntry[];
  visibility: NavMenuVisibility | null;
  hasHiddenItems: boolean;
  activeId: string;
  labelsOpen: boolean;
  width: number;
  isResizing: boolean;
  onToggleLabels: () => void;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSelect: (id: string) => void;
  onReorderLayout: (layout: NavLayoutEntry[]) => void;
  onHideItem: (itemId: string) => void;
  onUnhideItem: (itemId: string) => void;
  user: {
    display_name: string;
    email: string;
    picture_url: string | null;
  } | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  logoutPending: boolean;
};

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-[0.8rem] w-[0.8rem] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function createNavSeparatorId(): string {
  return `sep-custom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

type NavRowTooltip = {
  title: string;
  top: number;
  left: number;
};

function NavRow({
  title,
  icon,
  active,
  accent = "lime",
  comingSoon,
  hiddenPreview = false,
  href,
  isDragging,
  labelsOpen,
  waveDelayMs = 0,
  waveGlowEnabled = true,
  onShowTooltip,
  onHideTooltip,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: {
  title: string;
  icon: ReactNode;
  active: boolean;
  accent?: NavAccent;
  comingSoon?: boolean;
  hiddenPreview?: boolean;
  href?: string;
  isDragging: boolean;
  labelsOpen: boolean;
  waveDelayMs?: number;
  waveGlowEnabled?: boolean;
  onShowTooltip: (title: string, anchor: HTMLElement) => void;
  onHideTooltip: () => void;
  onClick: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const waveStyle = waveGlowEnabled
    ? ({
        animationDelay: `${waveDelayMs}ms`,
        "--app-nav-wave-cycle": `${APP_NAV_WAVE_CYCLE_MS}ms`,
      } as CSSProperties)
    : undefined;

  const rowClass = [
    "group/navrow",
    NAV_ROW_CLASS,
    "min-w-0 w-full touch-none",
    isDragging ? "cursor-grabbing opacity-40" : "cursor-grab",
    hiddenPreview ? "opacity-45" : "",
  ].join(" ");

  const handleMouseEnter = (event: ReactMouseEvent<HTMLElement>) => {
    if (!labelsOpen) {
      onShowTooltip(title, event.currentTarget);
    }
  };

  const handleMouseLeave = () => {
    onHideTooltip();
  };

  const inner = (
    <>
      <span className={NAV_ICON_SLOT_CLASS}>
        <span
          className={[
            NAV_ICON_BUTTON_CLASS,
            active
              ? RAIL_ACTIVE_CLASS[accent]
              : hiddenPreview
                ? "text-stone-500 group-hover/navrow:bg-stone-800/50 group-hover/navrow:text-stone-400"
                : "text-stone-400 group-hover/navrow:bg-stone-800/80 group-hover/navrow:text-stone-200",
          ].join(" ")}
        >
          <span
            className={
              waveGlowEnabled
                ? "app-nav-wave-icon-target inline-flex text-inherit"
                : "inline-flex text-inherit"
            }
            style={waveStyle}
          >
            {icon}
          </span>
        </span>
      </span>

      <span
        className={[
          `min-w-0 flex-1 truncate pr-3 ${NAV_ROW_LABEL_CLASS} transition`,
          active
            ? LABEL_ACTIVE_TEXT[accent]
            : hiddenPreview
              ? "font-medium text-stone-500 group-hover/navrow:text-stone-400"
              : "font-medium text-stone-400 group-hover/navrow:text-stone-200",
          comingSoon ? "opacity-70" : "",
        ].join(" ")}
      >
        <span
          className={waveGlowEnabled ? "app-nav-wave-label-target inline" : "inline"}
          style={waveStyle}
        >
          {title}
        </span>
      </span>

      {comingSoon ? (
        <span className="shrink-0 pr-3 font-mono text-[9px] uppercase tracking-wider text-stone-600">
          Soon
        </span>
      ) : null}
    </>
  );

  if (href && !comingSoon) {
    return (
      <Link
        to={href}
        draggable
        onClick={onClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={onContextMenu}
        title={labelsOpen ? title : undefined}
        aria-label={title}
        aria-current={active ? "page" : undefined}
        aria-grabbed={isDragging}
        className={rowClass}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={onContextMenu}
      title={labelsOpen ? title : undefined}
      aria-label={title}
      aria-current={active ? "page" : undefined}
      aria-grabbed={isDragging}
      className={rowClass}
    >
      {inner}
    </button>
  );
}

export function AppNav({
  allRows,
  layout,
  visibility,
  hasHiddenItems,
  activeId,
  labelsOpen,
  width,
  isResizing,
  onToggleLabels,
  onResizePointerDown,
  onSelect,
  onReorderLayout,
  onHideItem,
  onUnhideItem,
  user,
  onOpenSettings,
  onLogout,
  logoutPending,
}: AppNavProps) {
  const panelWidth = labelsOpen ? `${width}px` : `${APP_NAV_RAIL_WIDTH}px`;
  const [showHiddenNavItems, setShowHiddenNavItems] = useState(false);
  const [draggingRowKey, setDraggingRowKey] = useState<string | null>(null);
  const [draggingRowKind, setDraggingRowKind] = useState<"item" | "separator" | null>(
    null,
  );
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const panelRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<NavContextMenuState | null>(null);
  const [navRowTooltip, setNavRowTooltip] = useState<NavRowTooltip | null>(null);

  const rows = useMemo(
    () => filterNavDisplayRows(allRows, visibility, showHiddenNavItems),
    [allRows, showHiddenNavItems, visibility],
  );

  const navWaveDelays = useMemo(() => buildNavWaveDelays(rows), [rows]);
  const waveGlowEnabled = useNavWaveGlowEnabled();

  const showNavRowTooltip = useCallback(
    (title: string, anchor: HTMLElement) => {
      if (labelsOpen) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      setNavRowTooltip({
        title,
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    },
    [labelsOpen],
  );

  const hideNavRowTooltip = useCallback(() => {
    setNavRowTooltip(null);
  }, []);

  const insertIndicatorTone = draggingRowKind === "separator" ? "blue" : "lime";

  const clearDragState = useCallback(() => {
    setDraggingRowKey(null);
    setDraggingRowKind(null);
    setDropInsertIndex(null);
    setNavRowTooltip(null);
  }, []);

  const handleDragStart = useCallback(
    (
      rowKey: string,
      rowKind: "item" | "separator",
      event: DragEvent<HTMLElement>,
    ) => {
      setTransparentDragImage(event.dataTransfer);
      setDraggingRowKey(rowKey);
      setDraggingRowKind(rowKind);
      const startIndex = rows.findIndex((row) => row.key === rowKey);
      setDropInsertIndex(startIndex === -1 ? 0 : startIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", rowKey);
    },
    [rows],
  );

  const resolveDisplayInsertIndexFromPointer = useCallback(
    (clientY: number): number => {
      const rowRects = rows.flatMap((row) => {
        const element = rowRefs.current.get(row.key);
        if (!element) {
          return [];
        }
        const rect = element.getBoundingClientRect();
        return [{ top: rect.top, bottom: rect.bottom }];
      });

      if (rowRects.length === 0) {
        return 0;
      }

      return resolveInsertIndexFromPointer(clientY, rowRects);
    },
    [rows],
  );

  const handleListDragOver = useCallback(
    (event: DragEvent<HTMLUListElement>) => {
      if (draggingRowKey === null) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const nextIndex = resolveDisplayInsertIndexFromPointer(event.clientY);
      setDropInsertIndex((current) =>
        current === nextIndex ? current : nextIndex,
      );
    },
    [draggingRowKey, resolveDisplayInsertIndexFromPointer],
  );

  const setRowRef = useCallback((rowKey: string, node: HTMLLIElement | null) => {
    if (node) {
      rowRefs.current.set(rowKey, node);
      return;
    }
    rowRefs.current.delete(rowKey);
  }, []);

  const getContextMenuPosition = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const panelRect = panelRef.current?.getBoundingClientRect();
      if (!panelRect) {
        return { left: 8, top: 8 };
      }

      return {
        left: Math.max(8, Math.min(event.clientX - panelRect.left, panelRect.width - 152)),
        top: Math.max(8, Math.min(event.clientY - panelRect.top, panelRect.height - 48)),
      };
    },
    [],
  );

  const openPanelContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>, displayInsertIndex: number) => {
      event.preventDefault();
      event.stopPropagation();
      const { left, top } = getContextMenuPosition(event);
      setContextMenu({ kind: "panel", left, top, displayInsertIndex });
    },
    [getContextMenuPosition],
  );

  const openItemContextMenu = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      itemId: string,
      hiddenPreview: boolean,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const { left, top } = getContextMenuPosition(event);
      setContextMenu({ kind: "item", left, top, itemId, hiddenPreview });
    },
    [getContextMenuPosition],
  );

  const openDeleteSeparatorMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>, separatorId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const { left, top } = getContextMenuPosition(event);
      setContextMenu({ kind: "delete", left, top, separatorId });
    },
    [getContextMenuPosition],
  );

  const addSeparator = useCallback(
    (displayInsertIndex: number) => {
      const layoutInsertIndex = resolveLayoutInsertIndexFromDisplay(
        layout,
        rows,
        displayInsertIndex,
      );
      const nextLayout = [...layout];
      nextLayout.splice(
        Math.max(0, Math.min(layoutInsertIndex, nextLayout.length)),
        0,
        {
          kind: "separator",
          id: createNavSeparatorId(),
        },
      );
      onReorderLayout(nextLayout);
      setContextMenu(null);
    },
    [layout, onReorderLayout, rows],
  );

  const deleteSeparator = useCallback(
    (separatorId: string) => {
      const nextLayout = layout.filter(
        (entry) => entry.kind !== "separator" || entry.id !== separatorId,
      );
      if (layoutSignature(nextLayout) !== layoutSignature(layout)) {
        onReorderLayout(nextLayout);
      }
      setContextMenu(null);
    },
    [layout, onReorderLayout],
  );

  const handleDrop = useCallback(() => {
    const draggedKey = draggingRowKey;
    const insertIndex = dropInsertIndex;
    clearDragState();

    if (draggedKey === null || insertIndex === null) {
      return;
    }

    const layoutInsertIndex = resolveLayoutInsertIndexFromDisplay(
      layout,
      rows,
      insertIndex,
    );

    const nextLayout = moveEntryInLayout(layout, draggedKey, layoutInsertIndex);
    if (layoutSignature(nextLayout) !== layoutSignature(layout)) {
      onReorderLayout(nextLayout);
    }
  }, [clearDragState, draggingRowKey, dropInsertIndex, layout, onReorderLayout, rows]);

  const contextMenuItems = useMemo((): BreadcrumbContextMenuItem[] => {
    if (!contextMenu) {
      return [];
    }

    if (contextMenu.kind === "panel") {
      return [
        {
          id: "add-separator",
          label: "Add separator",
          onSelect: () => addSeparator(contextMenu.displayInsertIndex),
        },
        {
          id: "show-hidden",
          label: "Show hidden",
          disabled: !hasHiddenItems || showHiddenNavItems,
          onSelect: () => setShowHiddenNavItems(true),
        },
      ];
    }

    if (contextMenu.kind === "item") {
      if (contextMenu.hiddenPreview) {
        return [
          {
            id: "unhide",
            label: "Unhide",
            onSelect: () => onUnhideItem(contextMenu.itemId),
          },
        ];
      }

      return [
        {
          id: "hide",
          label: "Hide",
          onSelect: () => onHideItem(contextMenu.itemId),
        },
      ];
    }

    return [
      {
        id: "delete-separator",
        label: "Delete",
        tone: "danger",
        onSelect: () => deleteSeparator(contextMenu.separatorId),
      },
    ];
  }, [
    addSeparator,
    contextMenu,
    deleteSeparator,
    hasHiddenItems,
    onHideItem,
    onUnhideItem,
    showHiddenNavItems,
  ]);

  const contextMenuPosition = useMemo(() => {
    if (!contextMenu || !panelRef.current) {
      return null;
    }
    const panelRect = panelRef.current.getBoundingClientRect();
    return {
      top: panelRect.top + contextMenu.top,
      left: panelRect.left + contextMenu.left,
    };
  }, [contextMenu]);

  useEffect(() => {
    if (labelsOpen) {
      setNavRowTooltip(null);
    }
  }, [labelsOpen]);

  useEffect(() => {
    if (!hasHiddenItems) {
      setShowHiddenNavItems(false);
    }
  }, [hasHiddenItems]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div
      ref={panelRef}
      data-app-nav
      className={[
        "relative shrink-0",
        isResizing ? "" : "transition-[width] duration-300 ease-in-out",
      ].join(" ")}
      style={{ width: panelWidth }}
    >
      <div className="app-chrome-nav flex h-full flex-col overflow-hidden border-r border-stone-800/80 bg-app">
        <div className={`${NAV_LOGO_BLOCK_CLASS} w-full`}>
          <span className={NAV_ICON_SLOT_CLASS}>
            <Link
              to="/"
              aria-label="Go to home"
              className="rounded-xl transition hover:bg-stone-800/80"
            >
              <img src={keelLogo} alt="Keel" className={NAV_RAIL_IMAGE_CLASS} />
            </Link>
          </span>

          <div className="min-w-0 flex-1 pr-3 text-left">
            <p className="whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.28em] text-lime-300">
              K E E L
            </p>
            <p className="whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Your Backbone
            </p>
          </div>
        </div>

        <div className={`${NAV_ROW_CLASS} w-full`}>
          <span className={NAV_ICON_SLOT_CLASS}>
            <button
              type="button"
              onClick={onToggleLabels}
              aria-label={labelsOpen ? "Hide navigation labels" : "Show navigation labels"}
              aria-expanded={labelsOpen}
              className={`${NAV_ICON_BUTTON_CLASS} border border-stone-800/40 bg-stone-950/20 text-stone-500/80 transition hover:border-stone-700/60 hover:bg-stone-800/60 hover:text-stone-300`}
            >
              <IconChevron open={labelsOpen} />
            </button>
          </span>
        </div>

        <nav aria-label="Features">
          <ul
            className="flex flex-col gap-0.5 py-0.5"
            onContextMenu={(event) => {
              if (event.target !== event.currentTarget) {
                return;
              }
              openPanelContextMenu(
                event,
                resolveDisplayInsertIndexFromPointer(event.clientY),
              );
            }}
            onDragOver={handleListDragOver}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop();
            }}
          >
            {rows.map((row, index) => {
              if (row.kind === "separator") {
                const isDraggingRow = draggingRowKey === row.key;

                return (
                  <li
                    key={row.key}
                    ref={(node) => setRowRef(row.key, node)}
                    className="relative w-full"
                  >
                    {draggingRowKey !== null && dropInsertIndex === index ? (
                      <ListInsertIndicator
                        position="top"
                        tone={insertIndicatorTone}
                      />
                    ) : null}
                    {draggingRowKey !== null &&
                    dropInsertIndex === rows.length &&
                    index === rows.length - 1 ? (
                      <ListInsertIndicator
                        position="bottom"
                        tone={insertIndicatorTone}
                      />
                    ) : null}
                    <AppNavSeparator
                      labelsOpen={labelsOpen}
                      isDragging={isDraggingRow}
                      onDragStart={(event) =>
                        handleDragStart(row.key, "separator", event)
                      }
                      onDragEnd={clearDragState}
                      onContextMenu={(event) =>
                        openDeleteSeparatorMenu(event, row.id)
                      }
                    />
                  </li>
                );
              }

              const isDraggingRow = draggingRowKey === row.key;

              return (
                <li
                  key={row.key}
                  ref={(node) => setRowRef(row.key, node)}
                  className="relative flex w-full items-center"
                >
                  {draggingRowKey !== null && dropInsertIndex === index ? (
                    <ListInsertIndicator
                      position="top"
                      tone={insertIndicatorTone}
                    />
                  ) : null}
                  {draggingRowKey !== null &&
                  dropInsertIndex === rows.length &&
                  index === rows.length - 1 ? (
                    <ListInsertIndicator
                      position="bottom"
                      tone={insertIndicatorTone}
                    />
                  ) : null}

                  <NavRow
                    title={row.item.title}
                    icon={row.item.icon}
                    active={activeId === row.item.id}
                    accent={row.item.accent}
                    comingSoon={row.item.comingSoon}
                    hiddenPreview={row.hiddenPreview}
                    href={row.item.comingSoon ? undefined : row.item.href}
                    isDragging={isDraggingRow}
                    labelsOpen={labelsOpen}
                    waveDelayMs={navWaveDelays.get(row.key) ?? 0}
                    waveGlowEnabled={waveGlowEnabled}
                    onShowTooltip={showNavRowTooltip}
                    onHideTooltip={hideNavRowTooltip}
                    onClick={() => onSelect(row.item.id)}
                    onContextMenu={(event) =>
                      openItemContextMenu(
                        event,
                        row.item.id,
                        row.hiddenPreview === true,
                      )
                    }
                    onDragStart={(event) =>
                      handleDragStart(row.key, "item", event)
                    }
                    onDragEnd={clearDragState}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className="flex-1"
          onContextMenu={(event) => openPanelContextMenu(event, rows.length)}
        />

        {user ? (
          <div className="flex w-full items-center border-t border-stone-800/80 py-4">
            <span className={NAV_ICON_SLOT_CLASS}>
              <ProfileMenu
                displayName={user.display_name}
                email={user.email}
                pictureUrl={user.picture_url}
                onOpenSettings={onOpenSettings}
                onLogout={onLogout}
                logoutPending={logoutPending}
              />
            </span>

            <div className="min-w-0 flex-1 pr-3 text-left">
              <p className="truncate text-sm font-medium text-stone-100">
                {user.display_name}
              </p>
              <p className="truncate text-xs text-stone-500">{user.email}</p>
            </div>
          </div>
        ) : null}
      </div>

      {contextMenu && contextMenuPosition ? (
        <BreadcrumbContextMenu
          position={contextMenuPosition}
          items={contextMenuItems}
          ariaLabel="Navigation actions"
          onClose={closeContextMenu}
        />
      ) : null}

      {navRowTooltip && !labelsOpen ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[200] -translate-y-1/2 whitespace-nowrap rounded-lg border border-stone-700/90 bg-stone-950/95 px-2.5 py-1.5 text-xs font-medium text-stone-100 shadow-lg ring-1 ring-stone-800/80"
          style={{ top: navRowTooltip.top, left: navRowTooltip.left }}
        >
          {navRowTooltip.title}
        </div>
      ) : null}

      {labelsOpen ? (
        <PanelResizeHandle
          side="left"
          isResizing={isResizing}
          onPointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  );
}
