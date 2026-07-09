// keel_web/src/modules/finance/pages/FinanceSubscriptionCreatePage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../views";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import {
  attachFinanceObligationMediaFromMedia,
  createFinanceObligation,
  fetchFinancePaymentMethods,
  fetchFinanceVendors,
  financeQueryKeys,
  uploadFinanceObligationMedia,
  type FinanceObligationCreatePayload,
} from "../api";
import {
  createPendingMediaSelection,
  createPendingUpload,
  FinanceMediaCarousel,
  type PendingMediaSelection,
  type PendingUpload,
} from "../components/FinanceMediaCarousel";
import { VendorSelect } from "../components/VendorSelect";
import { FinanceObligationInlineTags } from "../components/tags/FinanceObligationInlineTags";
import {
  BILLING_INTERVALS,
  BILLING_INTERVAL_LABELS,
  OBLIGATION_KINDS,
  OBLIGATION_KIND_LABELS,
  OBLIGATION_STATUSES,
  OBLIGATION_STATUS_LABELS,
  type FinanceBillingInterval,
  type FinanceObligationKind,
  type FinanceObligationStatus,
} from "../lib/obligation";

export function FinanceSubscriptionCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nameDraft, setNameDraft] = useState("");
  const [kindDraft, setKindDraft] = useState<FinanceObligationKind>("subscription");
  const [statusDraft, setStatusDraft] = useState<FinanceObligationStatus>("active");
  const [vendorIdDraft, setVendorIdDraft] = useState<number | null>(null);
  const [paymentMethodIdDraft, setPaymentMethodIdDraft] = useState<number | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [currencyDraft, setCurrencyDraft] = useState("USD");
  const [intervalDraft, setIntervalDraft] = useState<FinanceBillingInterval>("monthly");
  const [billingDayDraft, setBillingDayDraft] = useState("");
  const [nextBillingDraft, setNextBillingDraft] = useState("");
  const [endsAtDraft, setEndsAtDraft] = useState("");
  const [accountUrlDraft, setAccountUrlDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>([]);

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
  });

  const paymentMethodsQuery = useQuery({
    queryKey: financeQueryKeys.paymentMethods(),
    queryFn: fetchFinancePaymentMethods,
  });

  const queueUploads = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    setPendingUploads((current) => [
      ...current,
      ...list.map((file) => createPendingUpload(file)),
    ]);
  }, []);

  const queueMediaSelections = useCallback((mediaItems: PendingMediaSelection["media"][]) => {
    setPendingMediaSelections((current) => [
      ...current,
      ...mediaItems.map((media) => createPendingMediaSelection(media)),
    ]);
  }, []);

  const pageFileDragActive = usePageFileDrop({
    enabled: true,
    onDropFiles: queueUploads,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FinanceObligationCreatePayload) => {
      const obligation = await createFinanceObligation(payload);
      for (const pending of pendingUploads) {
        await uploadFinanceObligationMedia(obligation.id, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachFinanceObligationMediaFromMedia(obligation.id, pending.media.id);
      }
      return obligation;
    },
    onSuccess: (obligation) => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate(`/finance/subscriptions/${obligation.id}`);
    },
  });

  const buildPayload = (): FinanceObligationCreatePayload => ({
    name: nameDraft.trim(),
    kind: kindDraft,
    status: statusDraft,
    vendor_id: vendorIdDraft,
    payment_method_id: paymentMethodIdDraft,
    amount: amountDraft.trim() || null,
    currency: currencyDraft.trim() || "USD",
    billing_interval: intervalDraft,
    billing_day: billingDayDraft ? Number(billingDayDraft) : null,
    next_billing_at: nextBillingDraft ? `${nextBillingDraft}T00:00:00` : null,
    ends_at: endsAtDraft ? `${endsAtDraft}T00:00:00` : null,
    account_url: accountUrlDraft.trim() || null,
    notes: notesDraft.trim(),
    tag_ids: tagIdsDraft,
  });

  const isDirty =
    Boolean(nameDraft.trim()) ||
    kindDraft !== "subscription" ||
    statusDraft !== "active" ||
    vendorIdDraft !== null ||
    paymentMethodIdDraft !== null ||
    Boolean(amountDraft.trim()) ||
    currencyDraft.trim() !== "USD" ||
    intervalDraft !== "monthly" ||
    Boolean(billingDayDraft) ||
    Boolean(nextBillingDraft) ||
    Boolean(endsAtDraft) ||
    Boolean(accountUrlDraft.trim()) ||
    Boolean(notesDraft.trim()) ||
    tagIdsDraft.length > 0 ||
    pendingUploads.length > 0 ||
    pendingMediaSelections.length > 0;

  const handleNavigateToVendor = (vendorId: number) => {
    const target = `/finance/vendors/${vendorId}`;
    if (!isDirty) {
      navigate(target);
      return;
    }
    const discard = window.confirm(
      "Discard this new subscription and open the vendor?\n\nOK = Discard and go\nCancel = Stay on this page",
    );
    if (discard) {
      navigate(target);
    }
  };

  return (
    <FormPageLayout
      backHref="/finance/subscriptions"
      backLabel="Back to subscriptions"
      isDirty={isDirty}
      onDiscard={() => navigate("/finance/subscriptions")}
      onSave={() => createMutation.mutate(buildPayload())}
      isSaving={createMutation.isPending}
      canSave={Boolean(nameDraft.trim())}
      errorMessage={createMutation.isError ? "Failed to create subscription." : null}
    >
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm text-stone-400">Name</span>
          <input
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-stone-400">Kind</span>
            <select
              value={kindDraft}
              onChange={(event) => setKindDraft(event.target.value as FinanceObligationKind)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            >
              {OBLIGATION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {OBLIGATION_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-stone-400">Status</span>
            <select
              value={statusDraft}
              onChange={(event) => setStatusDraft(event.target.value as FinanceObligationStatus)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            >
              {OBLIGATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {OBLIGATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Tags</p>
          <FinanceObligationInlineTags
            tagIdsDraft={tagIdsDraft}
            onTagIdsDraftChange={setTagIdsDraft}
            disabled={createMutation.isPending}
          />
        </div>

        <VendorSelect
          vendors={vendorsQuery.data ?? []}
          value={vendorIdDraft}
          onChange={setVendorIdDraft}
          onNavigateToVendor={handleNavigateToVendor}
          disabled={createMutation.isPending}
        />

        <label className="block">
          <span className="text-sm text-stone-400">Payment method</span>
          <select
            value={paymentMethodIdDraft ?? ""}
            onChange={(event) =>
              setPaymentMethodIdDraft(event.target.value ? Number(event.target.value) : null)
            }
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          >
            <option value="">None</option>
            {(paymentMethodsQuery.data ?? []).map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="text-sm text-stone-400">Amount</span>
            <input
              value={amountDraft}
              onChange={(event) => setAmountDraft(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="text-sm text-stone-400">Currency</span>
            <input
              value={currencyDraft}
              onChange={(event) => setCurrencyDraft(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="text-sm text-stone-400">Interval</span>
            <select
              value={intervalDraft}
              onChange={(event) => setIntervalDraft(event.target.value as FinanceBillingInterval)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            >
              {BILLING_INTERVALS.map((interval) => (
                <option key={interval} value={interval}>
                  {BILLING_INTERVAL_LABELS[interval]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-stone-400">Billing day (1–31)</span>
            <input
              type="number"
              min={1}
              max={31}
              value={billingDayDraft}
              onChange={(event) => setBillingDayDraft(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-400">Next billing date</span>
            <input
              type="date"
              value={nextBillingDraft}
              onChange={(event) => setNextBillingDraft(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
            />
          </label>
        </div>

        <label className="block sm:max-w-xs">
          <span className="text-sm text-stone-400">Service end date</span>
          <input
            type="date"
            value={endsAtDraft}
            onChange={(event) => setEndsAtDraft(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">Account URL</span>
          <input
            value={accountUrlDraft}
            onChange={(event) => setAccountUrlDraft(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">Notes</span>
          <textarea
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <FinanceMediaCarousel
          media={[]}
          pendingUploads={pendingUploads}
          pendingMediaSelections={pendingMediaSelections}
          onQueueUploads={queueUploads}
          onQueueMediaSelections={queueMediaSelections}
          onRemovePending={(clientId) => {
            setPendingUploads((current) => {
              const removed = current.find((pending) => pending.clientId === clientId);
              if (removed) {
                URL.revokeObjectURL(removed.previewUrl);
              }
              return current.filter((pending) => pending.clientId !== clientId);
            });
          }}
          onRemovePendingMedia={(clientId) => {
            setPendingMediaSelections((current) =>
              current.filter((pending) => pending.clientId !== clientId),
            );
          }}
          disabled={createMutation.isPending}
          pageFileDragActive={pageFileDragActive}
        />
      </div>
    </FormPageLayout>
  );
}
