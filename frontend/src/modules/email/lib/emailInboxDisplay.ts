// keel_web/src/modules/email/lib/emailInboxDisplay.ts

import type { EmailLastFetchFilters, EmailMailbox } from "../../settings/api";

export type EmailInboxFetchFilters = {
  mailbox: EmailMailbox;
  from_or_to: string;
  subject: string;
  body: string;
  max_results: string;
};

export const EMAIL_MAILBOX_OPTIONS: Array<{ value: EmailMailbox; label: string }> = [
  { value: "inbox", label: "Inbox" },
  { value: "sent", label: "Sent" },
  { value: "junk", label: "Junk" },
  { value: "trash", label: "Trash" },
];

export function defaultEmailInboxFetchFilters(): EmailInboxFetchFilters {
  return {
    mailbox: "inbox",
    from_or_to: "",
    subject: "",
    body: "",
    max_results: "",
  };
}

export function formatEmailMessageReceivedAt(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function emailMessageFromLabel(
  fromName: string | null | undefined,
  fromEmail: string | null | undefined,
): { primary: string; secondary: string | null } {
  const name = fromName?.trim() ?? "";
  const email = fromEmail?.trim() ?? "";

  if (name && email) {
    return { primary: name, secondary: email };
  }
  if (email) {
    return { primary: email, secondary: null };
  }
  if (name) {
    return { primary: name, secondary: null };
  }
  return { primary: "Unknown sender", secondary: null };
}

export function emailMessageIsUnread(labelIds: string[]): boolean {
  return labelIds.includes("UNREAD");
}

export function emailInboxFetchFiltersToPayload(filters: EmailInboxFetchFilters) {
  const maxResultsRaw = filters.max_results.trim();
  const parsedMaxResults =
    maxResultsRaw.length > 0 ? Number.parseInt(maxResultsRaw, 10) : undefined;

  return {
    mailbox: filters.mailbox,
    from_or_to: filters.from_or_to.trim() || undefined,
    subject: filters.subject.trim() || undefined,
    body: filters.body.trim() || undefined,
    max_results:
      parsedMaxResults != null && Number.isFinite(parsedMaxResults) && parsedMaxResults > 0
        ? parsedMaxResults
        : undefined,
  };
}

export function emailInboxFetchFiltersFromPreferences(
  value: EmailLastFetchFilters | undefined,
): EmailInboxFetchFilters {
  const defaults = defaultEmailInboxFetchFilters();
  if (!value) {
    return defaults;
  }

  return {
    mailbox: value.mailbox ?? defaults.mailbox,
    from_or_to: value.from_or_to ?? defaults.from_or_to,
    subject: value.subject ?? defaults.subject,
    body: value.body ?? defaults.body,
    max_results:
      value.max_results != null && value.max_results > 0
        ? String(value.max_results)
        : defaults.max_results,
  };
}

export function emailInboxFetchFiltersToPreferences(
  filters: EmailInboxFetchFilters,
): Record<string, string | EmailMailbox | number | null> {
  const maxResultsRaw = filters.max_results.trim();
  const parsedMaxResults =
    maxResultsRaw.length > 0 ? Number.parseInt(maxResultsRaw, 10) : null;

  return {
    mailbox: filters.mailbox,
    from_or_to: filters.from_or_to.trim(),
    subject: filters.subject.trim(),
    body: filters.body.trim(),
    max_results:
      parsedMaxResults != null && Number.isFinite(parsedMaxResults) && parsedMaxResults > 0
        ? parsedMaxResults
        : null,
  };
}
