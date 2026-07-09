// keel_web/src/modules/focus/pages/FocusCardsPage.tsx

// Card grid view for the focus hub.

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CARD_GALLERY_GRID_CLASS } from "../../../views/cards/cardGridClasses";
import { CardGalleryPageLayout } from "../../../views/cards/CardGalleryPageLayout";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import type { FocusList } from "../api";
import { fetchFocusEntries, focusQueryKeys } from "../api";
import { FocusListCard } from "../components/cards/card";
import { FocusHubHeaderControls } from "../components/shared/hub";
import { FocusTagManager } from "../components/shared/tags";
import { useFocusBoard } from "../hooks/useFocusBoard";
import { useFocusHubMutations } from "../hooks/useFocusHubMutations";
import { listNodeId } from "../lib/constellation/graph";
import type { FocusHubViewMode } from "../lib/focus";

type FocusCardsPageProps = {
  viewMode: FocusHubViewMode;
  onViewModeChange: (mode: FocusHubViewMode) => void;
  onOpenScopedConstellation: (canvasNodeId: string) => void;
};

export function FocusCardsPage({
  viewMode,
  onViewModeChange,
  onOpenScopedConstellation,
}: FocusCardsPageProps) {
  const navigate = useNavigate();
  const board = useFocusBoard();
  const {
    deleteListMutation,
    updateListColorMutation,
  } = useFocusHubMutations();

  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [expandedListId, setExpandedListId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleLists = useMemo(
    () => board.lists.filter((list) => focusListMatchesSearch(list, searchQuery)),
    [board.lists, searchQuery],
  );

  const expandedEntriesQuery = useQuery({
    queryKey: [...focusQueryKeys.entries(), "peek", expandedListId ?? "none"],
    queryFn: () =>
      expandedListId === null ? Promise.resolve([]) : fetchFocusEntries({ list_id: expandedListId }),
    enabled: expandedListId !== null,
  });

  const toggleItemsExpanded = useCallback((listId: number) => {
    setExpandedListId((current) => (current === listId ? null : listId));
  }, []);

  useEffect(() => {
    if (expandedListId === null) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const shell = (event.target as Element).closest("[data-focus-card-shell]");
      if (shell?.getAttribute("data-list-id") === String(expandedListId)) {
        return;
      }
      setExpandedListId(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [expandedListId]);

  return (
    <CardGalleryPageLayout
      title="Focus"
      recordCount={!board.isLoading ? board.lists.length : undefined}
      subtitle="Every parent-less focus node appears here as a list card. Open a card to edit its items, or use the constellation view to connect nodes visually."
      headerExtras={
        <FocusHubHeaderControls
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onOpenTagManager={() => setTagManagerOpen(true)}
          onCreateNode={() => navigate("/focus/lists/new")}
        />
      }
      searchId="focus-card-search"
      searchLabel="Search focus cards"
      searchPlaceholder="Search cards…"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={board.isLoading}
      isError={Boolean(board.errorMessage)}
      totalCount={board.lists.length}
      filteredCount={visibleLists.length}
      loadingMessage="Loading lists…"
      errorMessage="Failed to load focus lists."
      emptyMessage="No parent-less nodes yet. Use the plus button to create one."
      noMatchMessage="No cards match your search."
      afterContent={
        <FocusTagManager
          open={tagManagerOpen}
          onClose={() => {
            setTagManagerOpen(false);
            void board.refresh();
          }}
        />
      }
    >
      <RouteNoticeBanner />
      <div data-focus-lists-grid className={CARD_GALLERY_GRID_CLASS}>
        {visibleLists.map((list) => (
          <div key={list.id} data-focus-card-shell data-list-id={list.id}>
            <FocusListCard
              list={list}
              hubInteraction
              onDelete={(listId) => deleteListMutation.mutate(listId)}
              onColorChange={(listId, nodeColorHex) =>
                updateListColorMutation.mutate({ listId, nodeColorHex })
              }
              deleteDisabled={deleteListMutation.isPending}
              colorDisabled={updateListColorMutation.isPending}
              itemsExpanded={expandedListId === list.id}
              onToggleItemsExpanded={() => toggleItemsExpanded(list.id)}
              peekEntries={expandedEntriesQuery.data ?? []}
              peekLoading={expandedEntriesQuery.isLoading}
              constellationActionLabel={
                list.is_origin
                  ? "Open constellation view"
                  : `Open scoped constellation for ${list.title}`
              }
              onOpenScopedConstellation={() => {
                if (list.is_origin) {
                  onViewModeChange("constellation");
                  return;
                }
                onOpenScopedConstellation(listNodeId(list.id));
              }}
            />
          </div>
        ))}
      </div>
    </CardGalleryPageLayout>
  );
}

function focusListMatchesSearch(list: FocusList, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (
    list.title.toLowerCase().includes(normalizedQuery) ||
    list.notes.toLowerCase().includes(normalizedQuery) ||
    list.tags.some((tag) => tag.name.toLowerCase().includes(normalizedQuery))
  );
}
