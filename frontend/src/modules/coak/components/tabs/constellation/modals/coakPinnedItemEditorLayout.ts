// keel_web/src/modules/coak/components/tabs/constellation/modals/coakPinnedItemEditorLayout.ts

import { parseCoakItemNodeId, type CoakItem } from "../../../../api";

export const COAK_PINNED_ITEM_EDITOR_WIDTH = 272;

export const COAK_PINNED_PANEL_HORIZONTAL_PADDING = 12;

/** Matches `-right-2` on `CoakPinnedModalUnpinBadge`. */
export const COAK_PINNED_MODAL_UNPIN_BADGE_OVERFLOW = 8;

/** Matches `-top-2` on `CoakPinnedModalUnpinBadge`. */
export const COAK_PINNED_MODAL_UNPIN_BADGE_TOP_OVERFLOW = 8;

export const COAK_PINNED_PANEL_WIDTH =
  COAK_PINNED_PANEL_HORIZONTAL_PADDING * 2 +
  COAK_PINNED_ITEM_EDITOR_WIDTH +
  COAK_PINNED_MODAL_UNPIN_BADGE_OVERFLOW;

export function filterVisibleCoakPinnedNodeIds(
  pinnedNodeIds: string[],
  items: CoakItem[],
): string[] {
  return pinnedNodeIds.filter((nodeId) => {
    const itemId = parseCoakItemNodeId(nodeId);
    return itemId != null && items.some((item) => item.id === itemId);
  });
}

export function resolveCoakConstellationSearchBarLeft(hasPinnedPanel: boolean): number {
  return hasPinnedPanel
    ? COAK_PINNED_PANEL_WIDTH + COAK_PINNED_PANEL_HORIZONTAL_PADDING
    : COAK_PINNED_PANEL_HORIZONTAL_PADDING;
}

export function scrollCoakPinnedPanelFrameToCenter(
  container: HTMLElement,
  frame: HTMLElement,
  behavior: ScrollBehavior = "smooth",
): void {
  const containerRect = container.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const frameCenterY = frameRect.top + frameRect.height / 2;
  const containerCenterY = containerRect.top + containerRect.height / 2;
  const nextScrollTop = container.scrollTop + (frameCenterY - containerCenterY);
  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

  container.scrollTo({
    top: Math.min(Math.max(0, nextScrollTop), maxScrollTop),
    behavior,
  });
}

export function queryCoakPinnedPanelFrame(
  container: HTMLElement,
  nodeId: string,
): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-coak-pinned-node-id="${nodeId}"]`);
}
