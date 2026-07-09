// keel_web/src/modules/email/pages/EmailAccountDetailPage.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { EmailAccountConnectButton } from "../components/EmailAccountConnectButton";
import { EmailAccountInboxPageLayout } from "../components/EmailAccountInboxPageLayout";
import { EmailAccountSettingsModal } from "../components/EmailAccountSettingsModal";
import { EmailInboxFetchFiltersPanel } from "../components/EmailInboxFetchFilters";
import { EmailInboxMessagesListView } from "../components/EmailInboxMessagesListView";
import { EmailMessageDetailModal } from "../components/EmailMessageDetailModal";
import { useEmailInboxFetch } from "../hooks/useEmailInboxFetch";
import {
  emailAccountDisplayName,
  emailAccountNeedsConnect,
  emailConnectErrorMessage,
} from "../lib/emailDisplay";
import { fetchEmailAccount, emailQueryKeys } from "../api";
import { useQuery } from "@tanstack/react-query";

export function EmailAccountDetailPage() {
  const { accountId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const accountQuery = useQuery({
    queryKey: emailQueryKeys.detail(accountId),
    queryFn: () => fetchEmailAccount(accountId),
    enabled: accountId.length > 0,
  });

  const inbox = useEmailInboxFetch({
    accountId,
    enabled: accountQuery.isSuccess,
  });

  useEffect(() => {
    const code = searchParams.get("connect_error");
    if (!code) {
      return;
    }
    setConnectError(emailConnectErrorMessage(code));
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("connect_error");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const redirecting = useRecordNotFoundRedirect({
    invalidId: accountId.length === 0,
    isLoading: accountQuery.isLoading,
    error: accountQuery.error,
    isFetched: accountQuery.isFetched,
    hasData: Boolean(accountQuery.data),
    listPath: "/email",
    notice: "That email account could not be found.",
  });

  if (redirecting || accountQuery.isLoading || inbox.isSettingsLoading) {
    return (
      <EmailAccountInboxPageLayout>
        <p className="text-sm text-stone-500">Loading…</p>
      </EmailAccountInboxPageLayout>
    );
  }

  if (!accountQuery.data) {
    return null;
  }

  const account = accountQuery.data;
  const needsConnect = emailAccountNeedsConnect(account.status);
  const bannerError = connectError ?? inbox.fetchError;

  return (
    <>
      <EmailAccountInboxPageLayout
        title={emailAccountDisplayName(account)}
        onFetch={() => void inbox.fetchMessages()}
        fetchDisabled={needsConnect}
        isFetching={inbox.isFetching}
        onOpenSettings={() => setSettingsOpen(true)}
        errorMessage={bannerError}
      >
        {needsConnect ? (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-100">
              Connect this Gmail account before fetching messages.
            </p>
            <div className="mt-3">
              <EmailAccountConnectButton accountId={account.id} status={account.status} />
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          <EmailInboxFetchFiltersPanel
            values={inbox.filters}
            onChange={inbox.setFilters}
            disabled={inbox.isFetching || needsConnect}
          />

          <EmailInboxMessagesListView
            messages={inbox.messages}
            hasFetched={inbox.hasFetched}
            isFetching={inbox.isFetching}
            onOpenMessage={inbox.openMessage}
          />
        </div>
      </EmailAccountInboxPageLayout>

      <EmailAccountSettingsModal
        accountId={account.id}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDeleteSuccess={() => navigate("/email")}
      />

      <EmailMessageDetailModal
        summary={inbox.selectedSummary}
        detail={inbox.selectedDetail}
        isLoading={inbox.isDetailLoading}
        errorMessage={inbox.detailError}
        onClose={inbox.closeMessage}
      />
    </>
  );
}
