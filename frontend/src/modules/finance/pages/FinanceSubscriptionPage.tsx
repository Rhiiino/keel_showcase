// keel_web/src/modules/finance/pages/FinanceSubscriptionPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";
import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import {
  attachFinanceObligationMediaFromMedia,
  deleteFinanceObligation,
  deleteFinanceObligationMedia,
  fetchFinanceObligation,
  fetchFinanceObligationMedia,
  fetchFinancePaymentMethods,
  fetchFinanceVendors,
  financeQueryKeys,
  updateFinanceObligation,
  uploadFinanceObligationMedia,
  type FinanceObligationUpdatePayload,
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

function toDateInput(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

export function FinanceSubscriptionPage() {
  const { obligationId: obligationIdParam } = useParams<{ obligationId: string }>();
  const obligationId = Number(obligationIdParam);
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

  const invalidObligationId = !Number.isFinite(obligationId) || obligationId <= 0;

  const obligationQuery = useQuery({
    queryKey: financeQueryKeys.obligation(obligationId),
    queryFn: () => fetchFinanceObligation(obligationId),
    enabled: !invalidObligationId,
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidObligationId,
    isLoading: obligationQuery.isLoading,
    error: obligationQuery.error,
    isFetched: obligationQuery.isFetched,
    hasData: Boolean(obligationQuery.data),
    listPath: "/finance/subscriptions",
    notice: "That subscription could not be found.",
  });

  const mediaQuery = useQuery({
    queryKey: financeQueryKeys.obligationMedia(obligationId),
    queryFn: () => fetchFinanceObligationMedia(obligationId),
    enabled: Number.isFinite(obligationId) && obligationId > 0 && Boolean(obligationQuery.data),
  });

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
  });

  const paymentMethodsQuery = useQuery({
    queryKey: financeQueryKeys.paymentMethods(),
    queryFn: fetchFinancePaymentMethods,
  });

  const obligation = obligationQuery.data;

  useEffect(() => {
    if (!obligation) {
      return;
    }
    setNameDraft(obligation.name);
    setKindDraft(obligation.kind as FinanceObligationKind);
    setStatusDraft(obligation.status as FinanceObligationStatus);
    setVendorIdDraft(obligation.vendor_id);
    setPaymentMethodIdDraft(obligation.payment_method_id);
    setAmountDraft(obligation.amount ?? "");
    setCurrencyDraft(obligation.currency);
    setIntervalDraft(obligation.billing_interval as FinanceBillingInterval);
    setBillingDayDraft(obligation.billing_day ? String(obligation.billing_day) : "");
    setNextBillingDraft(toDateInput(obligation.next_billing_at));
    setEndsAtDraft(toDateInput(obligation.ends_at));
    setAccountUrlDraft(obligation.account_url ?? "");
    setNotesDraft(obligation.notes);
    setTagIdsDraft(obligation.tags.map((tag) => tag.id));
    setPendingUploads([]);
    setPendingMediaSelections([]);
  }, [obligation?.id, obligation?.updated_at]);

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
    enabled: Boolean(obligation),
    onDropFiles: queueUploads,
  });

  const obligationTagIds = useMemo(
    () => (obligation?.tags ?? []).map((tag) => tag.id).sort((left, right) => left - right),
    [obligation?.tags],
  );

  const isDirty = useMemo(() => {
    if (!obligation) {
      return false;
    }
    const draftTagIds = [...tagIdsDraft].sort((left, right) => left - right);
    return (
      nameDraft.trim() !== obligation.name ||
      kindDraft !== obligation.kind ||
      statusDraft !== obligation.status ||
      vendorIdDraft !== obligation.vendor_id ||
      paymentMethodIdDraft !== obligation.payment_method_id ||
      amountDraft.trim() !== (obligation.amount ?? "") ||
      currencyDraft.trim() !== obligation.currency ||
      intervalDraft !== obligation.billing_interval ||
      billingDayDraft !== (obligation.billing_day ? String(obligation.billing_day) : "") ||
      nextBillingDraft !== toDateInput(obligation.next_billing_at) ||
      endsAtDraft !== toDateInput(obligation.ends_at) ||
      accountUrlDraft.trim() !== (obligation.account_url ?? "") ||
      notesDraft.trim() !== obligation.notes ||
      draftTagIds.join(",") !== obligationTagIds.join(",") ||
      pendingUploads.length > 0 ||
      pendingMediaSelections.length > 0
    );
  }, [
    obligation,
    obligationTagIds,
    nameDraft,
    kindDraft,
    statusDraft,
    vendorIdDraft,
    paymentMethodIdDraft,
    amountDraft,
    currencyDraft,
    intervalDraft,
    billingDayDraft,
    nextBillingDraft,
    endsAtDraft,
    accountUrlDraft,
    notesDraft,
    tagIdsDraft,
    pendingUploads.length,
    pendingMediaSelections.length,
  ]);

  const buildPayload = (): FinanceObligationUpdatePayload => ({
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updated = await updateFinanceObligation(obligationId, buildPayload());
      for (const pending of pendingUploads) {
        await uploadFinanceObligationMedia(obligationId, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachFinanceObligationMediaFromMedia(obligationId, pending.media.id);
      }
      return updated;
    },
    onSuccess: () => {
      setPendingUploads([]);
      setPendingMediaSelections([]);
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFinanceObligation(obligationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate("/finance/subscriptions");
    },
  });

  const handleDeleteMedia = async (attachmentId: number) => {
    await deleteFinanceObligationMedia(obligationId, attachmentId);
    void queryClient.invalidateQueries({
      queryKey: financeQueryKeys.obligationMedia(obligationId),
    });
  };

  const handleNavigateToVendor = async (vendorId: number) => {
    const target = `/finance/vendors/${vendorId}`;
    if (!isDirty) {
      navigate(target);
      return;
    }
    const saveFirst = window.confirm(
      "You have unsaved changes. Save before leaving?\n\nOK = Save and go\nCancel = Leave without saving",
    );
    if (saveFirst) {
      if (!nameDraft.trim()) {
        return;
      }
      await saveMutation.mutateAsync();
    }
    navigate(target);
  };

  if (redirecting || obligationQuery.isLoading) {
    return (
      <FormPageLayout backHref="/finance/subscriptions" backLabel="Back to subscriptions">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!obligation) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/finance/subscriptions"
      backLabel="Back to subscriptions"
      isDirty={isDirty}
      onDiscard={() => {
        setNameDraft(obligation.name);
        setKindDraft(obligation.kind as FinanceObligationKind);
        setStatusDraft(obligation.status as FinanceObligationStatus);
        setVendorIdDraft(obligation.vendor_id);
        setPaymentMethodIdDraft(obligation.payment_method_id);
        setAmountDraft(obligation.amount ?? "");
        setCurrencyDraft(obligation.currency);
        setIntervalDraft(obligation.billing_interval as FinanceBillingInterval);
        setBillingDayDraft(obligation.billing_day ? String(obligation.billing_day) : "");
        setNextBillingDraft(toDateInput(obligation.next_billing_at));
        setEndsAtDraft(toDateInput(obligation.ends_at));
        setAccountUrlDraft(obligation.account_url ?? "");
        setNotesDraft(obligation.notes);
        setTagIdsDraft(obligation.tags.map((tag) => tag.id));
        setPendingUploads([]);
        setPendingMediaSelections([]);
      }}
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
      canSave={Boolean(nameDraft.trim())}
      headerAction={
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this subscription?")) {
              deleteMutation.mutate();
            }
          }}
          className="rounded-lg px-3 py-2 text-sm text-red-400 ring-1 ring-red-900/50 hover:bg-red-950/30"
        >
          Delete
        </button>
      }
      persistHeaderAction
      errorMessage={saveMutation.isError ? "Failed to save changes." : null}
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
              disabled={saveMutation.isPending}
            />
          </div>

          <VendorSelect
            vendors={vendorsQuery.data ?? []}
            value={vendorIdDraft}
            onChange={setVendorIdDraft}
            onNavigateToVendor={(id) => void handleNavigateToVendor(id)}
            disabled={saveMutation.isPending}
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
            <label className="block">
              <span className="text-sm text-stone-400">Amount</span>
              <input
                value={amountDraft}
                onChange={(event) => setAmountDraft(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
              />
            </label>
            <label className="block">
              <span className="text-sm text-stone-400">Currency</span>
              <input
                value={currencyDraft}
                onChange={(event) => setCurrencyDraft(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
              />
            </label>
            <label className="block">
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
            media={mediaQuery.data ?? []}
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
            onDeleteMedia={(attachmentId) => void handleDeleteMedia(attachmentId)}
            disabled={saveMutation.isPending}
            pageFileDragActive={pageFileDragActive}
          />
        </div>
    </FormPageLayout>
  );
}
