// stack_sandbox/frontend_web/src/app/navigation/AppBreadcrumb.tsx

// Clickable breadcrumb trail for recent in-app locations (length from user prefs),
// with optional pinned shortcuts on the left.

import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { buildNavigationLabelContext } from "./buildNavigationLabelContext";
import {
  BreadcrumbContextMenu,
  type BreadcrumbContextMenuItem,
} from "./BreadcrumbContextMenu";
import { pinnedBreadcrumbLocation } from "./breadcrumbPins";
import { useNavigationStack } from "./NavigationStackContext";
import {
  navigationSegmentClassName,
  resolveNavigationSegment,
} from "./resolveNavigationLabel";
import { resolveNavigationNavIconId } from "./resolveNavigationNavIcon";
import { resolvePinnedNavigationLabel } from "./resolvePinnedNavigationLabel";
import { useBreadcrumbLabelRefresh } from "./useBreadcrumbLabelRefresh";
import { useNavigationBreadcrumbPins } from "./useNavigationBreadcrumbPins";
import { usePrefetchPinnedNavigationLabels } from "./usePrefetchPinnedNavigationLabels";
import { AppNavIconImage } from "../nav/appNavIcons";
import type { NavigationSegmentKind } from "./navigationStackTypes";
import type { PinnedBreadcrumb } from "./breadcrumbPins";

type BreadcrumbContextMenuState = {
  top: number;
  left: number;
  items: BreadcrumbContextMenuItem[];
  ariaLabel: string;
};

function BreadcrumbSeparator() {
  return (
    <span className="select-none text-stone-600" aria-hidden>
      ›
    </span>
  );
}

function pinnedSegmentClassName(isCurrent: boolean): string {
  return [
    "max-w-[10rem] truncate rounded-md px-2 py-0.5 text-xs font-medium transition sm:max-w-[12rem]",
    isCurrent
      ? "bg-lime-400/10 text-lime-200 ring-1 ring-lime-400/30"
      : "bg-stone-800/70 text-stone-300 ring-1 ring-stone-700/80 hover:bg-stone-800 hover:text-stone-100",
  ].join(" ");
}

function buildTrailContextMenuItems(
  pathname: string,
  search: string,
  hash: string,
  label: string,
  isPinned: boolean,
  pin: (entry: {
    pathname: string;
    search: string;
    hash: string;
    label: string;
  }) => void,
): BreadcrumbContextMenuItem[] {
  if (isPinned) {
    return [];
  }

  return [
    {
      id: "pin",
      label: "Pin",
      onSelect: () => pin({ pathname, search, hash, label }),
    },
  ];
}

function buildPinnedContextMenuItems(
  pathname: string,
  search: string,
  unpin: (pathname: string, search: string) => void,
): BreadcrumbContextMenuItem[] {
  return [
    {
      id: "unpin",
      label: "Unpin",
      onSelect: () => unpin(pathname, search),
    },
  ];
}

type PinnedBreadcrumbSegmentProps = {
  label: string;
  navIconId: ReturnType<typeof resolveNavigationNavIconId>;
  isCurrent: boolean;
  onNavigate: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
};

function PinnedBreadcrumbSegment({
  label,
  navIconId,
  isCurrent,
  onNavigate,
  onContextMenu,
}: PinnedBreadcrumbSegmentProps) {
  return (
    <button
        type="button"
        onClick={onNavigate}
        onContextMenu={onContextMenu}
        title={label}
        aria-current={isCurrent ? "page" : undefined}
        className={[
          pinnedSegmentClassName(isCurrent),
          "inline-flex min-w-0 items-center gap-1.5",
        ].join(" ")}
      >
        {navIconId ? (
          <AppNavIconImage
            id={navIconId}
            className="h-6 w-6 shrink-0 text-app-accent"
          />
        ) : null}
        <span className="truncate">{label}</span>
      </button>
  );
}

type TrailBreadcrumbSegmentProps = {
  label: string;
  kind: NavigationSegmentKind;
  isCurrent: boolean;
  isClickable: boolean;
  onNavigate: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
};

function TrailBreadcrumbSegment({
  label,
  kind,
  isCurrent,
  isClickable,
  onNavigate,
  onContextMenu,
}: TrailBreadcrumbSegmentProps) {
  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onNavigate}
        onContextMenu={onContextMenu}
        title={`Back to ${label}`}
        className={navigationSegmentClassName(kind, false, true)}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      aria-current="page"
      onContextMenu={onContextMenu}
      className={navigationSegmentClassName(kind, isCurrent, false)}
      title={label}
    >
      {label}
    </span>
  );
}

export function AppBreadcrumb() {
  const { stack, restoreToIndex, navigateTo } = useNavigationStack();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { pins, pin, unpin, isPinned } = useNavigationBreadcrumbPins();
  const [contextMenu, setContextMenu] = useState<BreadcrumbContextMenuState | null>(
    null,
  );

  useBreadcrumbLabelRefresh();
  usePrefetchPinnedNavigationLabels(pins);

  const labelContext = buildNavigationLabelContext(queryClient);

  const segments = useMemo(
    () =>
      stack.map((entry) =>
        resolveNavigationSegment(entry.pathname, entry.search, labelContext),
      ),
    [stack, labelContext],
  );

  const pinnedSegments = useMemo(
    () =>
      pins.map((entry) => ({
        entry,
        label: resolvePinnedNavigationLabel(entry, labelContext),
        navIconId: resolveNavigationNavIconId(entry.pathname),
      })),
    [pins, labelContext],
  );

  const openContextMenu = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      items: BreadcrumbContextMenuItem[],
      ariaLabel: string,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (items.length === 0) {
        setContextMenu(null);
        return;
      }

      setContextMenu({
        top: event.clientY,
        left: event.clientX,
        items,
        ariaLabel,
      });
    },
    [],
  );

  const handlePinnedNavigate = useCallback(
    (entry: PinnedBreadcrumb) => {
      navigateTo(pinnedBreadcrumbLocation(entry));
    },
    [navigateTo],
  );

  if (stack.length === 0 && pins.length === 0) {
    return null;
  }

  return (
    <>
      <nav aria-label="Navigation trail" className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {pins.length > 0 ? (
            <>
              <ol
                aria-label="Pinned locations"
                className="flex min-w-0 shrink-0 items-center gap-1"
              >
                {pinnedSegments.map(({ entry, label, navIconId }, index) => {
                  const isCurrent =
                    pinnedBreadcrumbLocation(entry) ===
                    `${location.pathname}${location.search}${location.hash}`;

                  return (
                    <li
                      key={entry.id}
                      className="flex min-w-0 items-center gap-1"
                    >
                      {index > 0 ? (
                        <span
                          className="select-none text-stone-700"
                          aria-hidden
                        >
                          ·
                        </span>
                      ) : null}
                      <PinnedBreadcrumbSegment
                        label={label}
                        navIconId={navIconId}
                        isCurrent={isCurrent}
                        onNavigate={() => handlePinnedNavigate(entry)}
                        onContextMenu={(event) =>
                          openContextMenu(
                            event,
                            buildPinnedContextMenuItems(
                              entry.pathname,
                              entry.search,
                              unpin,
                            ),
                            "Pinned breadcrumb actions",
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ol>

              {stack.length > 0 ? (
                <span
                  className="h-4 w-px shrink-0 bg-stone-700/90"
                  aria-hidden
                />
              ) : null}
            </>
          ) : null}

          {stack.length > 0 ? (
            <ol className="flex min-w-0 items-center gap-1.5 text-xs">
              {stack.map((entry, index) => {
                const isCurrent = index === stack.length - 1;
                const isClickable = !isCurrent;
                const segment = segments[index];
                const label = segment?.label ?? entry.label;
                const kind = segment?.kind ?? "page";
                const entryPinned = isPinned(entry.pathname, entry.search);

                return (
                  <li
                    key={entry.id}
                    className="flex min-w-0 items-center gap-1.5"
                  >
                    {index > 0 && <BreadcrumbSeparator />}
                    <TrailBreadcrumbSegment
                      label={label}
                      kind={kind}
                      isCurrent={isCurrent}
                      isClickable={isClickable}
                      onNavigate={() => restoreToIndex(index)}
                      onContextMenu={(event) =>
                        openContextMenu(
                          event,
                          buildTrailContextMenuItems(
                            entry.pathname,
                            entry.search,
                            entry.hash,
                            label,
                            entryPinned,
                            pin,
                          ),
                          "Breadcrumb actions",
                        )
                      }
                    />
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </nav>

      {contextMenu ? (
        <BreadcrumbContextMenu
          position={{ top: contextMenu.top, left: contextMenu.left }}
          items={contextMenu.items}
          ariaLabel={contextMenu.ariaLabel}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </>
  );
}
