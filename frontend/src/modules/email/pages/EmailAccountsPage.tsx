// keel_web/src/modules/email/pages/EmailAccountsPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import { deleteEmailAccount, emailQueryKeys, fetchEmailAccounts } from "../api";
import { EmailAccountsListView } from "../components/EmailAccountsListView";

export function EmailAccountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: emailQueryKeys.list(),
    queryFn: fetchEmailAccounts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: emailQueryKeys.all });
    },
  });

  const accounts = accountsQuery.data ?? [];

  const actionError = deleteMutation.isError
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : "Something went wrong."
    : null;

  return (
    <ListPageLayout
      title="Email"
      recordCount={accounts.length}
      subtitle="Manage connected Gmail accounts and their connection status."
      actions={
        <IconPlusButton
          ariaLabel="Add email account"
          onClick={() => navigate("/email/new")}
        />
      }
    >
      <RouteNoticeBanner />
      {accountsQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading email accounts…</p>
      ) : null}
      {accountsQuery.isError ? (
        <p className="text-sm text-red-400">
          {accountsQuery.error instanceof ApiError
            ? accountsQuery.error.message
            : "Failed to load email accounts."}
        </p>
      ) : null}
      {actionError ? <p className="text-sm text-red-400">{actionError}</p> : null}

      {accountsQuery.data ? (
        <EmailAccountsListView
          accounts={accounts}
          onDelete={(accountId) => deleteMutation.mutate(accountId)}
          deleteDisabled={deleteMutation.isPending}
          paginationResetKey={accounts.length}
        />
      ) : null}
    </ListPageLayout>
  );
}
