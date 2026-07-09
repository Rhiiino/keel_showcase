// keel_web/src/modules/people/figures/pages/FiguresPage.tsx

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../../views/list/ListPageLayout";
import { ListSearch } from "../../../../components/ListSearch";
import { FiguresListView } from "../components/FiguresListView";
import { fetchFigures, figureMatchesSearch, figuresQueryKeys } from "../api";

export function FiguresPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const figuresQuery = useQuery({
    queryKey: figuresQueryKeys.list(),
    queryFn: fetchFigures,
  });

  const filteredFigures = useMemo(
    () => (figuresQuery.data ?? []).filter((figure) => figureMatchesSearch(figure, query)),
    [figuresQuery.data, query],
  );

  const emptyMessage =
    query.trim() && filteredFigures.length === 0
      ? "No figures match the current search."
      : "No figures yet.";

  return (
    <ListPageLayout
      className="mx-auto flex min-h-0 w-full flex-1 flex-col"
      title="Figures"
      recordCount={figuresQuery.data?.length}
      subtitle="Public people you track — celebrities, creators, politicians, and more."
      actions={
        <IconPlusButton
          onClick={() => navigate("/people/figures/new")}
          ariaLabel="New figure"
        />
      }
    >
      <div className="space-y-4">
        <RouteNoticeBanner />
        <ListSearch
          value={query}
          onChange={setQuery}
          placeholder="Search figures…"
        />

        {figuresQuery.isLoading && (
          <p className="text-sm text-stone-500">Loading figures…</p>
        )}
        {figuresQuery.isError && (
          <p className="text-sm text-red-400">Failed to load figures.</p>
        )}

        {figuresQuery.data ? (
          <FiguresListView
            figures={filteredFigures}
            emptyMessage={emptyMessage}
            paginationResetKey={query}
          />
        ) : null}
      </div>
    </ListPageLayout>
  );
}
