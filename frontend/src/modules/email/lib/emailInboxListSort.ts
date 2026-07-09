// keel_web/src/modules/email/lib/emailInboxListSort.ts

import type { ListColumnSortState } from "../../../views/list/primitives/listColumnSort";
import type { EmailMessageSummary } from "../api";
import {
  emailMessageFromLabel,
  emailMessageIsUnread,
} from "./emailInboxDisplay";

export type EmailInboxSortColumn = "received" | "from" | "subject";

export const EMAIL_INBOX_DEFAULT_SORT: ListColumnSortState<EmailInboxSortColumn> = {
  column: "received",
  direction: "desc",
};

export function getEmailInboxSortValue(
  message: EmailMessageSummary,
  column: EmailInboxSortColumn,
): string | number | boolean | null {
  switch (column) {
    case "received":
      return message.received_at;
    case "from":
      return emailMessageFromLabel(message.from_name, message.from_email).primary;
    case "subject":
      return message.subject;
    default:
      return null;
  }
}

export function emailInboxUnreadSortValue(message: EmailMessageSummary): number {
  return emailMessageIsUnread(message.label_ids) ? 0 : 1;
}
