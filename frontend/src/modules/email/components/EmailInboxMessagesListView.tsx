// keel_web/src/modules/email/components/EmailInboxMessagesListView.tsx

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { EmailMessageSummary } from "../api";
import {
  EMAIL_INBOX_DEFAULT_SORT,
  getEmailInboxSortValue,
  type EmailInboxSortColumn,
} from "../lib/emailInboxListSort";
import {
  EMAIL_INBOX_LIST_GRID_CLASS,
  EmailInboxMessageRow,
} from "./EmailInboxMessageRow";

const INBOX_COLUMNS: ListColumnDef<EmailInboxSortColumn | "unread">[] = [
  { id: "unread", label: "", sortable: false, headerClassName: "px-2 py-3" },
  { id: "received", label: "Received", headerClassName: "px-3 py-3" },
  { id: "from", label: "From", headerClassName: "px-3 py-3" },
  { id: "subject", label: "Subject", headerClassName: "px-3 py-3" },
];

type EmailInboxMessagesListViewProps = {
  messages: EmailMessageSummary[];
  hasFetched: boolean;
  isFetching: boolean;
  onOpenMessage: (messageId: string) => void;
};

export function EmailInboxMessagesListView({
  messages,
  hasFetched,
  isFetching,
  onOpenMessage,
}: EmailInboxMessagesListViewProps) {
  const showPlaceholder = isFetching || !hasFetched || messages.length === 0;

  return (
    <ListView
      items={messages}
      columns={INBOX_COLUMNS}
      getSortValue={(message, column) => {
        if (column === "unread") {
          return null;
        }
        return getEmailInboxSortValue(message, column);
      }}
      defaultSort={EMAIL_INBOX_DEFAULT_SORT}
      gridClassName={EMAIL_INBOX_LIST_GRID_CLASS}
      tableWidthClassName="min-w-[48rem] w-full"
      renderRow={(message) => (
        <EmailInboxMessageRow message={message} onOpen={onOpenMessage} />
      )}
      getRowKey={(message) => message.id}
      pagination={false}
      suppressEmptyState={showPlaceholder}
      beforeRows={
        <>
          {isFetching ? (
            <p className="px-4 py-10 text-sm text-stone-500">Fetching messages…</p>
          ) : null}
          {!isFetching && !hasFetched ? (
            <p className="px-4 py-10 text-sm text-stone-500">
              Click Fetch to load messages for this account.
            </p>
          ) : null}
          {!isFetching && hasFetched && messages.length === 0 ? (
            <p className="px-4 py-10 text-sm text-stone-500">
              No messages matched your search.
            </p>
          ) : null}
        </>
      }
    />
  );
}
