// keel_web/src/modules/finance/pages/FinanceTransactionsPage.tsx

// Purchase list — items grouped by status with card or list view.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListSearch } from "../../../components/ListSearch";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import {
  deleteFinanceTransaction,
  fetchFinanceTransactions,
  fetchFinanceVendors,
  financeQueryKeys,
} from "../api";
import { FinanceKanbanView } from "../components/FinanceKanbanView";
import { FinanceListView } from "../components/FinanceListView";
import { FinanceViewToggle } from "../components/FinanceViewToggle";
import {
  STATUS_ORDER,
  type FinanceTransactionStatus,
  isFinanceTransactionStatus,
} from "../lib/transaction";
import { filterFinanceTransactionGroups } from "../lib/transactionSearch";
import {
  readFinanceViewMode,
  writeFinanceViewMode,
  type FinanceViewMode,
} from "../lib/transactionView";

export function FinanceTransactionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<FinanceViewMode>(() => readFinanceViewMode());
  const [searchQuery, setSearchQuery] = useState("");

  const itemsQuery = useQuery({
    queryKey: financeQueryKeys.transactionsList(undefined),
    queryFn: () => fetchFinanceTransactions(),
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

  const grouped = useMemo(() => {
    const items = itemsQuery.data ?? [];
    const map = new Map<FinanceTransactionStatus, typeof items>();
    for (const status of STATUS_ORDER) {
      map.set(status, []);
    }
    for (const item of items) {
      if (isFinanceTransactionStatus(item.status)) {
        map.get(item.status)?.push(item);
      }
    }
    return STATUS_ORDER.map((status) => ({
      status,
      items: map.get(status) ?? [],
    })).filter((group) => group.items.length > 0);
  }, [itemsQuery.data]);

  const filteredGrouped = useMemo(
    () => filterFinanceTransactionGroups(grouped, searchQuery, vendorById),
    [grouped, vendorById, searchQuery],
  );

  const filteredItems = useMemo(
    () => filteredGrouped.flatMap((group) => group.items),
    [filteredGrouped],
  );

  const isSearchActive = searchQuery.trim().length > 0;

  const deleteMutation = useMutation({
    mutationFn: (transactionId: number) => deleteFinanceTransaction(transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const handleViewModeChange = (next: FinanceViewMode) => {
    setViewMode(next);
    writeFinanceViewMode(next);
  };

  const handleDelete = (transactionId: number) => {
    deleteMutation.mutate(transactionId);
  };

  const kanbanProps = {
    grouped: filteredGrouped,
    vendorById,
    onDelete: handleDelete,
    deleteDisabled: deleteMutation.isPending,
  };

  const listEmptyMessage =
    isSearchActive && filteredItems.length === 0
      ? "No items match your search."
      : "No items yet. Add something you are considering or have ordered.";

  return (
    <ListPageLayout
      title="Transactions"
      recordCount={itemsQuery.data?.length}
      subtitle="Track spending, wishlist items, and orders in one place."
      actions={
        <>
          <FinanceViewToggle
            viewMode={viewMode}
            onChange={handleViewModeChange}
            ariaLabel="Transaction view"
          />
          <IconPlusButton
            onClick={() => navigate("/finance/transactions/new")}
            ariaLabel="New item"
          />
        </>
      }
    >
      <RouteNoticeBanner />
      {viewMode === "list" ? (
        <ListSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search items…"
          className="mb-6"
        />
      ) : null}

      {itemsQuery.isLoading && (
        <p className="py-12 text-center text-sm text-stone-500">Loading items…</p>
      )}
      {itemsQuery.isError && (
        <p className="py-12 text-center text-sm text-red-400">Failed to load items.</p>
      )}
      {itemsQuery.data && grouped.length === 0 && (
        <p className="py-12 text-center text-sm text-stone-500">
          No items yet. Add something you are considering or have ordered.
        </p>
      )}
      {itemsQuery.data && grouped.length > 0 && viewMode === "kanban" && filteredGrouped.length > 0 && (
        <FinanceKanbanView {...kanbanProps} />
      )}
      {itemsQuery.data && grouped.length > 0 && viewMode === "kanban" && isSearchActive && filteredGrouped.length === 0 && (
        <p className="py-12 text-center text-sm text-stone-500">
          No items match your search.
        </p>
      )}
      {itemsQuery.data && grouped.length > 0 && viewMode === "list" && (
        <FinanceListView
          items={filteredItems}
          vendorById={vendorById}
          onDelete={handleDelete}
          deleteDisabled={deleteMutation.isPending}
          emptyMessage={listEmptyMessage}
          paginationResetKey={searchQuery}
        />
      )}
    </ListPageLayout>
  );
}
