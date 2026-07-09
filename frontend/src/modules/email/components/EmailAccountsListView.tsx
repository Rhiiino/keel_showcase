// keel_web/src/modules/email/components/EmailAccountsListView.tsx

import { ListView } from "../../../views/list/ListView";
import type { ListColumnDef } from "../../../views/list/types";
import type { EmailAccount } from "../api";
import {
  EMAIL_ACCOUNT_DEFAULT_SORT,
  getEmailAccountSortValue,
  type EmailAccountSortColumn,
} from "../lib/emailAccountsListSort";
import {
  EMAIL_ACCOUNTS_LIST_GRID_CLASS,
  EMAIL_ACCOUNTS_LIST_TABLE_WIDTH_CLASS,
  EmailAccountsListRow,
} from "./EmailAccountsListRow";

const EMAIL_ACCOUNT_COLUMNS: ListColumnDef<EmailAccountSortColumn | "spacer" | "actions">[] = [
  { id: "status", label: "Status" },
  { id: "name", label: "Name" },
  { id: "connection", label: "Connection" },
  { id: "spacer", label: "", sortable: false },
  { id: "actions", label: "", sortable: false, headerClassName: "px-1 py-3" },
];

type EmailAccountsListViewProps = {
  accounts: EmailAccount[];
  onDelete?: (accountId: number) => void;
  deleteDisabled?: boolean;
  emptyMessage?: string;
  paginationResetKey?: unknown;
};

export function EmailAccountsListView({
  accounts,
  onDelete,
  deleteDisabled = false,
  emptyMessage = "No email accounts yet.",
  paginationResetKey,
}: EmailAccountsListViewProps) {
  return (
    <ListView
      items={accounts}
      columns={EMAIL_ACCOUNT_COLUMNS}
      getSortValue={(account, column) => {
        if (column === "spacer" || column === "actions") {
          return null;
        }
        return getEmailAccountSortValue(account, column);
      }}
      defaultSort={EMAIL_ACCOUNT_DEFAULT_SORT}
      gridClassName={EMAIL_ACCOUNTS_LIST_GRID_CLASS}
      tableWidthClassName={EMAIL_ACCOUNTS_LIST_TABLE_WIDTH_CLASS}
      renderRow={(account) => (
        <EmailAccountsListRow
          account={account}
          onDelete={onDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
      getRowKey={(account) => account.id}
      emptyMessage={emptyMessage}
      paginationResetKey={paginationResetKey}
    />
  );
}
