// keel_web/src/modules/email/api.ts

import { apiFetch, getApiBaseUrl } from "../../lib/api";
import type { EmailMailbox } from "../settings/api";

const credentials: RequestCredentials = "include";

export type EmailProvider = "gmail";
export type EmailAccountStatus = "connected" | "needs_reauth" | "disconnected";

export type EmailAccount = {
  id: number;
  user_id: number;
  provider: EmailProvider;
  email_address: string;
  nickname: string;
  status: EmailAccountStatus;
  connected_at: string | null;
  disconnected_at: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailAccountCreatePayload = {
  provider?: EmailProvider;
  email_address: string;
  nickname?: string;
};

export type EmailAccountUpdatePayload = {
  provider?: EmailProvider;
  email_address?: string;
  nickname?: string;
};

export type EmailAddress = {
  name: string | null;
  email: string | null;
};

export type EmailMessageSummary = {
  id: string;
  thread_id: string;
  received_at: string | null;
  from_name: string | null;
  from_email: string | null;
  to: EmailAddress[];
  subject: string | null;
  snippet: string | null;
  label_ids: string[];
  has_attachments: boolean;
};

export type EmailMessageDetail = EmailMessageSummary & {
  cc: EmailAddress[];
  body_plain: string | null;
  body_html: string | null;
  attachment_names: string[];
};

export type EmailMessageFetchPayload = {
  mailbox?: EmailMailbox;
  from_or_to?: string;
  subject?: string;
  body?: string;
  max_results?: number;
};

export type EmailMessageFetchResponse = {
  messages: EmailMessageSummary[];
  total_fetched: number;
};

export const emailQueryKeys = {
  all: ["email"] as const,
  list: () => [...emailQueryKeys.all, "list"] as const,
  detail: (accountId: number | string) =>
    [...emailQueryKeys.all, "detail", String(accountId)] as const,
  messageDetail: (accountId: number | string, messageId: string) =>
    [...emailQueryKeys.all, "detail", String(accountId), "message", messageId] as const,
};

export async function fetchEmailAccounts(): Promise<EmailAccount[]> {
  return apiFetch<EmailAccount[]>("/email", { credentials });
}

export async function fetchEmailAccount(accountId: number | string): Promise<EmailAccount> {
  return apiFetch<EmailAccount>(`/email/${accountId}`, { credentials });
}

export async function createEmailAccount(
  payload: EmailAccountCreatePayload,
): Promise<EmailAccount> {
  return apiFetch<EmailAccount>("/email", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function updateEmailAccount(
  accountId: number | string,
  payload: EmailAccountUpdatePayload,
): Promise<EmailAccount> {
  return apiFetch<EmailAccount>(`/email/${accountId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export async function deleteEmailAccount(accountId: number | string): Promise<void> {
  await apiFetch<void>(`/email/${accountId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchEmailMessages(
  accountId: number | string,
  payload: EmailMessageFetchPayload,
): Promise<EmailMessageFetchResponse> {
  return apiFetch<EmailMessageFetchResponse>(`/email/${accountId}/messages/fetch`, {
    method: "POST",
    credentials,
    body: payload,
  });
}

export async function fetchEmailMessageDetail(
  accountId: number | string,
  messageId: string,
): Promise<EmailMessageDetail> {
  return apiFetch<EmailMessageDetail>(`/email/${accountId}/messages/${messageId}`, {
    credentials,
  });
}

export function emailAccountPath(account: Pick<EmailAccount, "id">): string {
  return `/email/${account.id}`;
}

export function getEmailAccountConnectUrl(accountId: number | string): string {
  return `${getApiBaseUrl().replace(/\/$/, "")}/email/${accountId}/connect`;
}
