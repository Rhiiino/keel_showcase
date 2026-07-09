// keel_web/src/modules/finance/pages/FinanceVendorsPage.tsx

// Vendor list — card grid or table with search and pagination.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListSearch } from "../../../components/ListSearch";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { deleteFinanceVendor, fetchFinanceVendors, financeQueryKeys } from "../api";
import { FinanceVendorCard } from "../components/FinanceVendorCard";
import { FinanceVendorsListView } from "../components/FinanceVendorsListView";
import { FinanceViewToggle } from "../components/FinanceViewToggle";
import { financeVendorMatchesSearch } from "../lib/transactionSearch";
import type { FinanceViewMode } from "../lib/transactionView";
import {
  readFinanceVendorViewMode,
  writeFinanceVendorViewMode,
} from "../lib/vendorView";

export function FinanceVendorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<FinanceViewMode>(() => readFinanceVendorViewMode());
  const [searchQuery, setSearchQuery] = useState("");

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
  });

  const filteredVendors = useMemo(
    () =>
      (vendorsQuery.data ?? []).filter((vendor) =>
        financeVendorMatchesSearch(vendor, searchQuery),
      ),
    [vendorsQuery.data, searchQuery],
  );

  const isSearchActive = searchQuery.trim().length > 0;

  const deleteMutation = useMutation({
    mutationFn: (vendorId: number) => deleteFinanceVendor(vendorId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const handleViewModeChange = (next: FinanceViewMode) => {
    setViewMode(next);
    writeFinanceVendorViewMode(next);
  };

  const emptyMessage =
    isSearchActive && filteredVendors.length === 0
      ? "No vendors match your search."
      : "No vendors yet.";

  return (
    <ListPageLayout
      title="Vendors"
      recordCount={vendorsQuery.data?.length}
      subtitle="Stores and sellers you buy from."
      actions={
        <>
          <FinanceViewToggle
            viewMode={viewMode}
            onChange={handleViewModeChange}
            ariaLabel="Vendor view"
          />
          <IconPlusButton
            onClick={() => navigate("/finance/vendors/new")}
            ariaLabel="New vendor"
          />
        </>
      }
    >
      <RouteNoticeBanner />
      <ListSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search vendors…"
        className="mb-6"
      />

      {vendorsQuery.isLoading && (
        <p className="py-12 text-center text-sm text-stone-500">Loading vendors…</p>
      )}
      {vendorsQuery.isError && (
        <p className="py-12 text-center text-sm text-red-400">Failed to load vendors.</p>
      )}

      {vendorsQuery.data && viewMode === "kanban" && filteredVendors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
          {filteredVendors.map((vendor) => (
            <FinanceVendorCard
              key={vendor.id}
              vendor={vendor}
              onDelete={(id) => deleteMutation.mutate(id)}
              deleteDisabled={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {vendorsQuery.data && viewMode === "kanban" && filteredVendors.length === 0 && (
        <p className="py-12 text-center text-sm text-stone-500">{emptyMessage}</p>
      )}

      {vendorsQuery.data && viewMode === "list" && (
        <FinanceVendorsListView
          vendors={filteredVendors}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleteDisabled={deleteMutation.isPending}
          emptyMessage={emptyMessage}
          paginationResetKey={searchQuery}
        />
      )}
    </ListPageLayout>
  );
}
