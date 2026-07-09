// keel_web/src/modules/journal/pages/JournalPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import { JournalFilters } from "../components/browse/JournalFilters";
import { JournalListView } from "../components/browse/JournalListView";
import {
  deleteJournalEntry,
  fetchJournalEntries,
  fetchJournalTags,
  journalQueryKeys,
} from "../api";
import {
  countJournalFilters,
  emptyJournalFilters,
  type JournalFilterValues,
} from "../lib/journalFilters";

export function JournalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<JournalFilterValues>(emptyJournalFilters());
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(filters.query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.query]);

  const tagsQuery = useQuery({
    queryKey: journalQueryKeys.tags(),
    queryFn: fetchJournalTags,
  });

  const listFilters = useMemo(
    () => ({
      tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
      query: debouncedQuery || undefined,
      entryDateFrom: filters.entryDateFrom.trim() || undefined,
      entryDateTo: filters.entryDateTo.trim() || undefined,
    }),
    [filters.tagIds, filters.entryDateFrom, filters.entryDateTo, debouncedQuery],
  );

  const entriesQuery = useQuery({
    queryKey: journalQueryKeys.entries(listFilters),
    queryFn: () => fetchJournalEntries(listFilters),
  });

  const totalEntriesQuery = useQuery({
    queryKey: journalQueryKeys.entries({}),
    queryFn: () => fetchJournalEntries(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all });
    },
  });

  const filtersDisabled = tagsQuery.isLoading;

  const actionError = deleteMutation.isError
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : "Failed to delete journal entry."
    : null;

  const hasActiveFilters = countJournalFilters(filters) > 0;
  const entries = entriesQuery.data ?? [];
  const emptyMessage =
    hasActiveFilters && entries.length === 0
      ? "No entries match the current filters."
      : "No entries yet.";

  return (
    <ListPageLayout
      title="Entries"
      recordCount={totalEntriesQuery.data?.length}
      subtitle="Personal journal entries organized by date."
      actions={
        <IconPlusButton
          onClick={() => navigate("/journal/new")}
          ariaLabel="New journal entry"
        />
      }
    >
      <div className="space-y-4">
        <RouteNoticeBanner />
        <JournalFilters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          tags={tagsQuery.data ?? []}
          filters={filters}
          onFiltersChange={setFilters}
          disabled={filtersDisabled}
        />

        {entriesQuery.isLoading ? (
          <p className="text-sm text-stone-500">Loading entries…</p>
        ) : null}
        {entriesQuery.isError ? (
          <p className="text-sm text-red-400">Failed to load entries.</p>
        ) : null}
        {actionError ? <p className="text-sm text-red-400">{actionError}</p> : null}

        {entriesQuery.data ? (
          <JournalListView
            entries={entries}
            onDelete={(entryId) => deleteMutation.mutate(entryId)}
            deleteDisabled={deleteMutation.isPending}
            emptyMessage={emptyMessage}
            paginationResetKey={listFilters}
          />
        ) : null}
      </div>
    </ListPageLayout>
  );
}
