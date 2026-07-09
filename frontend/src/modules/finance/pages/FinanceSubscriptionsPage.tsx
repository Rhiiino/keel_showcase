// keel_web/src/modules/finance/pages/FinanceSubscriptionsPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListSearch } from "../../../components/ListSearch";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import {
  deleteFinanceObligation,
  fetchFinanceObligations,
  fetchFinanceSummary,
  fetchFinanceVendors,
  financeQueryKeys,
} from "../api";
import { FinanceSubscriptionsListView } from "../components/FinanceSubscriptionsListView";
import { FinanceSummaryHeader } from "../components/FinanceSummaryHeader";
import { filterFinanceObligations } from "../lib/obligationSearch";

export function FinanceSubscriptionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const summaryQuery = useQuery({
    queryKey: financeQueryKeys.summary(),
    queryFn: fetchFinanceSummary,
  });

  const obligationsQuery = useQuery({
    queryKey: financeQueryKeys.obligationsList(),
    queryFn: () => fetchFinanceObligations(),
  });

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
  });

  const vendorById = useMemo(() => {
    const map = new Map<number, NonNullable<typeof vendorsQuery.data>[number]>();
    for (const vendor of vendorsQuery.data ?? []) {
      map.set(vendor.id, vendor);
    }
    return map;
  }, [vendorsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (obligationId: number) => deleteFinanceObligation(obligationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const filtered = useMemo(
    () => filterFinanceObligations(obligationsQuery.data ?? [], searchQuery),
    [obligationsQuery.data, searchQuery],
  );

  const emptyMessage =
    searchQuery.trim() && filtered.length === 0
      ? "No subscriptions match your search."
      : "No subscriptions yet.";

  return (
    <ListPageLayout
      title="Subscriptions"
      recordCount={obligationsQuery.data?.length}
      subtitle="Track recurring bills, memberships, and streaming services."
      actions={
        <IconPlusButton
          onClick={() => navigate("/finance/subscriptions/new")}
          ariaLabel="New subscription"
        />
      }
    >
      <RouteNoticeBanner />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <ListSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search subscriptions…"
          className="min-w-0 flex-1"
        />
        <FinanceSummaryHeader
          summary={summaryQuery.data}
          isLoading={summaryQuery.isLoading}
        />
      </div>

      {obligationsQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading subscriptions…</p>
      ) : null}
      {obligationsQuery.isError ? (
        <p className="text-sm text-red-400">Failed to load subscriptions.</p>
      ) : null}

      {obligationsQuery.data ? (
        <FinanceSubscriptionsListView
          obligations={filtered}
          vendorById={vendorById}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleteDisabled={deleteMutation.isPending}
          emptyMessage={emptyMessage}
          paginationResetKey={searchQuery}
        />
      ) : null}
    </ListPageLayout>
  );
}
