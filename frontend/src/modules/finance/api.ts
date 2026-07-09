// keel_web/src/modules/finance/api.ts

// Finance module API: transactions, vendors, obligations, payment methods, and media.

import { ApiError, apiFetch } from "../../lib/api";
import {
  buildMediaContentUrl,
  createMediaAttachment,
  deleteMediaAttachment,
  fetchEntityAttachments,
  uploadMedia,
  type MediaAttachment,
  type MediaObject,
} from "../media/api";
import type { FinanceTransactionStatus } from "./lib/transaction";

export type FinanceVendor = {
  id: number;
  name: string;
  website_url: string | null;
  billing_portal_url: string | null;
  notes: string;
  default_currency: string | null;
  logo: MediaObject | null;
  created_at: string;
  updated_at: string;
};

export type FinanceTransactionGalleryEntry = {
  attachmentId: number;
  mediaId: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  media_kind: string;
  url: string;
  updated_at: string;
};

export type FinanceTransactionTag = {
  id: number;
  name: string;
  description: string | null;
  color_hex: string;
  transaction_count: number;
};

export type FinanceObligationTag = {
  id: number;
  name: string;
  description: string | null;
  color_hex: string;
  obligation_count: number;
};

export type FinanceTransaction = {
  id: number;
  user_id: number;
  title: string;
  kind: string;
  status: string;
  sort_order: number;
  vendor_id: number | null;
  vendor_name: string | null;
  obligation_id: number | null;
  obligation_name: string | null;
  listing_url: string | null;
  notes: string;
  price_amount: string | null;
  currency: string;
  quantity: number;
  ordered_at: string | null;
  received_at: string | null;
  cover: MediaObject | null;
  gallery: MediaAttachment[];
  tags: FinanceTransactionTag[];
  created_at: string;
  updated_at: string;
};

export type FinanceObligation = {
  id: number;
  user_id: number;
  vendor_id: number | null;
  vendor_name: string | null;
  payment_method_id: number | null;
  payment_method_label: string | null;
  name: string;
  kind: string;
  status: string;
  amount: string | null;
  currency: string;
  billing_interval: string;
  billing_day: number | null;
  started_at: string | null;
  next_billing_at: string | null;
  cancelled_at: string | null;
  ends_at: string | null;
  account_url: string | null;
  notes: string;
  sort_order: number;
  tags: FinanceObligationTag[];
  created_at: string;
  updated_at: string;
};

export type FinancePaymentMethod = {
  id: number;
  kind: string;
  label: string;
  institution_name: string | null;
  last_four: string | null;
  notes: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FinanceSummary = {
  active_obligation_count: number;
  monthly_burn: string;
  renewals_next_30_days: number;
};

export type FinanceTransactionCreatePayload = {
  title: string;
  kind?: string;
  status?: FinanceTransactionStatus;
  vendor_id?: number | null;
  vendor_name?: string | null;
  obligation_id?: number | null;
  listing_url?: string | null;
  notes?: string;
  price_amount?: number | string | null;
  currency?: string;
  quantity?: number;
  ordered_at?: string | null;
  received_at?: string | null;
  tag_ids?: number[];
};

export type FinanceTransactionUpdatePayload = {
  title?: string;
  kind?: string;
  status?: FinanceTransactionStatus;
  vendor_id?: number | null;
  vendor_name?: string | null;
  obligation_id?: number | null;
  listing_url?: string | null;
  notes?: string;
  price_amount?: number | string | null;
  currency?: string;
  quantity?: number;
  ordered_at?: string | null;
  received_at?: string | null;
  tag_ids?: number[];
};

export type FinanceVendorCreatePayload = {
  name: string;
  website_url?: string | null;
  billing_portal_url?: string | null;
  notes?: string;
  default_currency?: string | null;
};

export type FinanceVendorUpdatePayload = {
  name?: string;
  website_url?: string | null;
  billing_portal_url?: string | null;
  notes?: string;
  default_currency?: string | null;
};

export type FinanceObligationCreatePayload = {
  name: string;
  kind?: string;
  status?: string;
  vendor_id?: number | null;
  vendor_name?: string | null;
  payment_method_id?: number | null;
  amount?: number | string | null;
  currency?: string;
  billing_interval?: string;
  billing_day?: number | null;
  started_at?: string | null;
  next_billing_at?: string | null;
  ends_at?: string | null;
  account_url?: string | null;
  notes?: string;
  tag_ids?: number[];
};

export type FinanceObligationUpdatePayload = {
  name?: string;
  kind?: string;
  status?: string;
  vendor_id?: number | null;
  vendor_name?: string | null;
  payment_method_id?: number | null;
  amount?: number | string | null;
  currency?: string;
  billing_interval?: string;
  billing_day?: number | null;
  started_at?: string | null;
  next_billing_at?: string | null;
  cancelled_at?: string | null;
  ends_at?: string | null;
  account_url?: string | null;
  notes?: string;
  tag_ids?: number[];
};

export type FinancePaymentMethodCreatePayload = {
  kind?: string;
  label: string;
  institution_name?: string | null;
  last_four?: string | null;
  notes?: string;
  is_active?: boolean;
};

export type FinancePaymentMethodUpdatePayload = {
  kind?: string;
  label?: string;
  institution_name?: string | null;
  last_four?: string | null;
  notes?: string;
  is_active?: boolean;
  sort_order?: number;
};

const credentials = "include" as const;

export const financeQueryKeys = {
  all: ["finance"] as const,
  summary: () => [...financeQueryKeys.all, "summary"] as const,
  transactions: () => [...financeQueryKeys.all, "transactions"] as const,
  transactionsList: (filters?: Record<string, string | number | undefined>) =>
    [...financeQueryKeys.transactions(), "list", filters ?? {}] as const,
  transaction: (transactionId: number) =>
    [...financeQueryKeys.transactions(), "detail", transactionId] as const,
  transactionMedia: (transactionId: number) =>
    [...financeQueryKeys.transactions(), "media", transactionId] as const,
  vendors: () => [...financeQueryKeys.all, "vendors"] as const,
  vendor: (vendorId: number) =>
    [...financeQueryKeys.vendors(), "detail", vendorId] as const,
  transactionTags: () => [...financeQueryKeys.all, "transaction-tags"] as const,
  obligationTags: () => [...financeQueryKeys.all, "obligation-tags"] as const,
  obligations: () => [...financeQueryKeys.all, "obligations"] as const,
  obligationsList: (filters?: Record<string, string | number | undefined>) =>
    [...financeQueryKeys.obligations(), "list", filters ?? {}] as const,
  obligation: (obligationId: number) =>
    [...financeQueryKeys.obligations(), "detail", obligationId] as const,
  obligationMedia: (obligationId: number) =>
    [...financeQueryKeys.obligations(), "media", obligationId] as const,
  paymentMethods: () => [...financeQueryKeys.all, "payment-methods"] as const,
  paymentMethod: (paymentMethodId: number) =>
    [...financeQueryKeys.paymentMethods(), "detail", paymentMethodId] as const,
  proposal: (proposalId: number) =>
    [...financeQueryKeys.all, "proposals", proposalId] as const,
};

export type FinanceListingProposal = {
  id: number;
  status: string;
  payload: Record<string, unknown>;
  created_transaction_id: number | null;
  created_vendor_id: number | null;
  created_at: string;
  updated_at: string;
};

export type FinanceListingProposalConfirmResult = {
  proposal: FinanceListingProposal;
  transaction: FinanceTransaction;
  vendor: FinanceVendor | null;
};

function galleryEntryFromAttachment(attachment: MediaAttachment): FinanceTransactionGalleryEntry {
  return {
    attachmentId: attachment.id,
    mediaId: attachment.media_id,
    original_filename: attachment.media.original_filename,
    mime_type: attachment.media.mime_type,
    byte_size: attachment.media.byte_size,
    media_kind: attachment.media.media_kind,
    url: attachment.media.url,
    updated_at: attachment.media.updated_at,
  };
}

export function financeTransactionCoverUrl(transaction: FinanceTransaction): string | null {
  if (!transaction.cover) {
    return null;
  }
  return buildMediaContentUrl(transaction.cover.id, transaction.cover.updated_at);
}

export function fetchFinanceSummary(): Promise<FinanceSummary> {
  return apiFetch<FinanceSummary>("/finance/summary", { credentials });
}

export function fetchFinanceTransactions(params?: {
  status?: string;
  vendor_id?: number;
  query?: string;
}): Promise<FinanceTransaction[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.vendor_id) search.set("vendor_id", String(params.vendor_id));
  if (params?.query) search.set("query", params.query);
  const qs = search.toString();
  return apiFetch<FinanceTransaction[]>(`/finance/transactions${qs ? `?${qs}` : ""}`, { credentials });
}

export function fetchFinanceTransaction(transactionId: number): Promise<FinanceTransaction> {
  return apiFetch<FinanceTransaction>(`/finance/transactions/${transactionId}`, { credentials });
}

export function createFinanceTransaction(payload: FinanceTransactionCreatePayload): Promise<FinanceTransaction> {
  return apiFetch<FinanceTransaction>("/finance/transactions", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateFinanceTransaction(
  transactionId: number,
  payload: FinanceTransactionUpdatePayload,
): Promise<FinanceTransaction> {
  return apiFetch<FinanceTransaction>(`/finance/transactions/${transactionId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteFinanceTransaction(transactionId: number): Promise<void> {
  return apiFetch<void>(`/finance/transactions/${transactionId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchFinanceVendors(query?: string): Promise<FinanceVendor[]> {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  return apiFetch<FinanceVendor[]>(`/finance/vendors${qs}`, { credentials });
}

export async function fetchFinanceVendor(vendorId: number): Promise<FinanceVendor> {
  const vendors = await fetchFinanceVendors();
  const vendor = vendors.find((row) => row.id === vendorId);
  if (!vendor) {
    throw new ApiError("Vendor not found.", 404);
  }
  return vendor;
}

export function createFinanceVendor(payload: FinanceVendorCreatePayload): Promise<FinanceVendor> {
  return apiFetch<FinanceVendor>("/finance/vendors", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateFinanceVendor(
  vendorId: number,
  payload: FinanceVendorUpdatePayload,
): Promise<FinanceVendor> {
  return apiFetch<FinanceVendor>(`/finance/vendors/${vendorId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteFinanceVendor(vendorId: number): Promise<void> {
  return apiFetch<void>(`/finance/vendors/${vendorId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchFinanceObligations(params?: {
  status?: string;
  kind?: string;
  vendor_id?: number;
  payment_method_id?: number;
  query?: string;
}): Promise<FinanceObligation[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.kind) search.set("kind", params.kind);
  if (params?.vendor_id) search.set("vendor_id", String(params.vendor_id));
  if (params?.payment_method_id) {
    search.set("payment_method_id", String(params.payment_method_id));
  }
  if (params?.query) search.set("query", params.query);
  const qs = search.toString();
  return apiFetch<FinanceObligation[]>(`/finance/obligations${qs ? `?${qs}` : ""}`, { credentials });
}

export function fetchFinanceObligation(obligationId: number): Promise<FinanceObligation> {
  return apiFetch<FinanceObligation>(`/finance/obligations/${obligationId}`, { credentials });
}

export function createFinanceObligation(
  payload: FinanceObligationCreatePayload,
): Promise<FinanceObligation> {
  return apiFetch<FinanceObligation>("/finance/obligations", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateFinanceObligation(
  obligationId: number,
  payload: FinanceObligationUpdatePayload,
): Promise<FinanceObligation> {
  return apiFetch<FinanceObligation>(`/finance/obligations/${obligationId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteFinanceObligation(obligationId: number): Promise<void> {
  return apiFetch<void>(`/finance/obligations/${obligationId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchFinancePaymentMethods(): Promise<FinancePaymentMethod[]> {
  return apiFetch<FinancePaymentMethod[]>("/finance/payment-methods", { credentials });
}

export function fetchFinancePaymentMethod(
  paymentMethodId: number,
): Promise<FinancePaymentMethod> {
  return apiFetch<FinancePaymentMethod>(`/finance/payment-methods/${paymentMethodId}`, {
    credentials,
  });
}

export function createFinancePaymentMethod(
  payload: FinancePaymentMethodCreatePayload,
): Promise<FinancePaymentMethod> {
  return apiFetch<FinancePaymentMethod>("/finance/payment-methods", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateFinancePaymentMethod(
  paymentMethodId: number,
  payload: FinancePaymentMethodUpdatePayload,
): Promise<FinancePaymentMethod> {
  return apiFetch<FinancePaymentMethod>(`/finance/payment-methods/${paymentMethodId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteFinancePaymentMethod(paymentMethodId: number): Promise<void> {
  return apiFetch<void>(`/finance/payment-methods/${paymentMethodId}`, {
    method: "DELETE",
    credentials,
  });
}

export async function fetchFinanceTransactionMedia(
  transactionId: number,
): Promise<FinanceTransactionGalleryEntry[]> {
  const attachments = await fetchEntityAttachments("finance_transaction", transactionId);
  return attachments
    .filter((attachment) => attachment.role === "gallery")
    .map(galleryEntryFromAttachment);
}

export function deleteFinanceTransactionMedia(_transactionId: number, attachmentId: number): Promise<void> {
  return deleteMediaAttachment(attachmentId);
}

export async function setFinanceTransactionCoverFromMedia(
  transactionId: number,
  mediaId: string,
): Promise<FinanceTransaction> {
  await createMediaAttachment(mediaId, {
    entity_type: "finance_transaction",
    entity_id: transactionId,
    role: "cover",
  });
  return fetchFinanceTransaction(transactionId);
}

export async function attachFinanceTransactionMediaFromMedia(
  transactionId: number,
  mediaId: string,
): Promise<FinanceTransactionGalleryEntry> {
  const attachment = await createMediaAttachment(mediaId, {
    entity_type: "finance_transaction",
    entity_id: transactionId,
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export async function uploadFinanceTransactionMedia(
  transactionId: number,
  file: File,
): Promise<FinanceTransactionGalleryEntry> {
  const media = await uploadMedia(file);
  const attachment = await createMediaAttachment(media.id, {
    entity_type: "finance_transaction",
    entity_id: transactionId,
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export async function fetchFinanceObligationMedia(
  obligationId: number,
): Promise<FinanceTransactionGalleryEntry[]> {
  const attachments = await fetchEntityAttachments("finance_obligation", obligationId);
  return attachments
    .filter((attachment) => attachment.role === "gallery")
    .map(galleryEntryFromAttachment);
}

export function deleteFinanceObligationMedia(
  _obligationId: number,
  attachmentId: number,
): Promise<void> {
  return deleteMediaAttachment(attachmentId);
}

export async function attachFinanceObligationMediaFromMedia(
  obligationId: number,
  mediaId: string,
): Promise<FinanceTransactionGalleryEntry> {
  const attachment = await createMediaAttachment(mediaId, {
    entity_type: "finance_obligation",
    entity_id: obligationId,
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export async function uploadFinanceObligationMedia(
  obligationId: number,
  file: File,
): Promise<FinanceTransactionGalleryEntry> {
  const media = await uploadMedia(file);
  const attachment = await createMediaAttachment(media.id, {
    entity_type: "finance_obligation",
    entity_id: obligationId,
    role: "gallery",
  });
  return galleryEntryFromAttachment(attachment);
}

export async function uploadFinanceVendorImage(
  vendorId: number,
  file: File,
): Promise<FinanceVendor> {
  const media = await uploadMedia(file);
  await createMediaAttachment(media.id, {
    entity_type: "finance_vendor",
    entity_id: vendorId,
    role: "logo",
  });
  return fetchFinanceVendor(vendorId);
}

export async function setFinanceVendorImageFromMedia(
  vendorId: number,
  mediaId: string,
): Promise<FinanceVendor> {
  await createMediaAttachment(mediaId, {
    entity_type: "finance_vendor",
    entity_id: vendorId,
    role: "logo",
  });
  return fetchFinanceVendor(vendorId);
}

export function fetchFinanceListingProposal(
  proposalId: number,
): Promise<FinanceListingProposal> {
  return apiFetch<FinanceListingProposal>(`/finance/proposals/${proposalId}`, {
    credentials,
  });
}

export function confirmFinanceListingProposal(
  proposalId: number,
): Promise<FinanceListingProposalConfirmResult> {
  return apiFetch<FinanceListingProposalConfirmResult>(
    `/finance/proposals/${proposalId}/confirm`,
    { method: "POST", credentials },
  );
}

export function declineFinanceListingProposal(
  proposalId: number,
): Promise<FinanceListingProposal> {
  return apiFetch<FinanceListingProposal>(`/finance/proposals/${proposalId}/decline`, {
    method: "POST",
    credentials,
  });
}

type FinanceTransactionTagCreatePayload = {
  name: string;
  description?: string | null;
  color_hex?: string;
};

type FinanceTransactionTagUpdatePayload = {
  name?: string;
  description?: string | null;
  color_hex?: string;
};

type FinanceObligationTagCreatePayload = {
  name: string;
  description?: string | null;
  color_hex?: string;
};

type FinanceObligationTagUpdatePayload = {
  name?: string;
  description?: string | null;
  color_hex?: string;
};

export function fetchFinanceTransactionTags(): Promise<FinanceTransactionTag[]> {
  return apiFetch<FinanceTransactionTag[]>("/finance/transaction-tags", { credentials });
}

export function createFinanceTransactionTag(
  payload: FinanceTransactionTagCreatePayload,
): Promise<FinanceTransactionTag> {
  return apiFetch<FinanceTransactionTag>("/finance/transaction-tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateFinanceTransactionTag(
  tagId: number,
  payload: FinanceTransactionTagUpdatePayload,
): Promise<FinanceTransactionTag> {
  return apiFetch<FinanceTransactionTag>(`/finance/transaction-tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteFinanceTransactionTag(tagId: number): Promise<void> {
  return apiFetch<void>(`/finance/transaction-tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}

export function fetchFinanceObligationTags(): Promise<FinanceObligationTag[]> {
  return apiFetch<FinanceObligationTag[]>("/finance/obligation-tags", { credentials });
}

export function createFinanceObligationTag(
  payload: FinanceObligationTagCreatePayload,
): Promise<FinanceObligationTag> {
  return apiFetch<FinanceObligationTag>("/finance/obligation-tags", {
    method: "POST",
    credentials,
    body: payload,
  });
}

export function updateFinanceObligationTag(
  tagId: number,
  payload: FinanceObligationTagUpdatePayload,
): Promise<FinanceObligationTag> {
  return apiFetch<FinanceObligationTag>(`/finance/obligation-tags/${tagId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function deleteFinanceObligationTag(tagId: number): Promise<void> {
  return apiFetch<void>(`/finance/obligation-tags/${tagId}`, {
    method: "DELETE",
    credentials,
  });
}
