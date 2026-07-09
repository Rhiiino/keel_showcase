// keel_web/src/modules/finance/pages/FinanceAccountsPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import {
  deleteFinancePaymentMethod,
  fetchFinancePaymentMethods,
  financeQueryKeys,
} from "../api";
import { FinanceAccountsListView } from "../components/FinanceAccountsListView";

export function FinanceAccountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: financeQueryKeys.paymentMethods(),
    queryFn: fetchFinancePaymentMethods,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFinancePaymentMethod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const accounts = accountsQuery.data ?? [];

  return (
    <ListPageLayout
      title="Accounts"
      recordCount={accounts.length}
      subtitle="Credit cards and bank accounts used for subscriptions."
      actions={
        <IconPlusButton
          onClick={() => navigate("/finance/accounts/new")}
          ariaLabel="New account"
        />
      }
    >
      <RouteNoticeBanner />
      {accountsQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading accounts…</p>
      ) : null}
      {accountsQuery.isError ? (
        <p className="text-sm text-red-400">Failed to load accounts.</p>
      ) : null}

      {accountsQuery.data ? (
        <FinanceAccountsListView
          accounts={accounts}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleteDisabled={deleteMutation.isPending}
        />
      ) : null}
    </ListPageLayout>
  );
}
