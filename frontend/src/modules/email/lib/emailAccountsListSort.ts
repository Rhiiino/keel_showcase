// keel_web/src/modules/email/lib/emailAccountsListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { EmailAccount } from "../api";
import {
  emailAccountConnectionLabel,
  emailAccountDisplayName,
} from "./emailDisplay";

export type EmailAccountSortColumn = "status" | "name" | "connection";

export const EMAIL_ACCOUNT_DEFAULT_SORT: ListColumnSortState<EmailAccountSortColumn> = {
  column: "name",
  direction: "asc",
};

const STATUS_SORT_RANK: Record<EmailAccount["status"], number> = {
  connected: 0,
  needs_reauth: 1,
  disconnected: 2,
};

export function getEmailAccountSortValue(
  account: EmailAccount,
  column: EmailAccountSortColumn,
): string | number | null {
  switch (column) {
    case "status":
      return STATUS_SORT_RANK[account.status];
    case "name":
      return emailAccountDisplayName(account);
    case "connection":
      return emailAccountConnectionLabel(account);
    default:
      return null;
  }
}
