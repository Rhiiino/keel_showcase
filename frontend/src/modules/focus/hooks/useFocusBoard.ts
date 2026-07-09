// keel_web/src/modules/focus/hooks/useFocusBoard.ts

// Loads root focus lists for the hub card grid.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { fetchFocusLists, focusQueryKeys, type FocusList } from "../api";

/** Hub card grid: all root lists (any status), not only active. */
export const FOCUS_HUB_CARD_GRID_LISTS_KEY = focusQueryKeys.listsList({ hub: "card-grid" });

function hubCardGridLists(lists: FocusList[]): FocusList[] {
  return lists.filter((list) => list.parent_id === null);
}

export function useFocusBoard() {
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: FOCUS_HUB_CARD_GRID_LISTS_KEY,
    queryFn: async () => hubCardGridLists(await fetchFocusLists()),
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: FOCUS_HUB_CARD_GRID_LISTS_KEY });
  }, [queryClient]);

  return {
    lists: listsQuery.data ?? [],
    isLoading: listsQuery.isLoading,
    errorMessage: listsQuery.error?.message ?? null,
    refresh,
  };
}
