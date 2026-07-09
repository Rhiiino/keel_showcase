// stack_sandbox/frontend_web/src/modules/shop/pages/FinanceTransactionCreatePage.tsx

// New transaction — same layout as detail view; Create persists the record.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../views";

import { usePageFileDrop } from "../../../hooks/usePageFileDrop";
import { FinanceTransactionDetailView } from "../components/detail/FinanceTransactionDetailView";
import {
  createPendingMediaSelection,
  createPendingUpload,
  type PendingMediaSelection,
  type PendingUpload,
} from "../components/FinanceMediaCarousel";
import {
  attachFinanceTransactionMediaFromMedia,
  createFinanceTransaction,
  fetchFinanceObligations,
  fetchFinanceVendors,
  financeQueryKeys,
  uploadFinanceTransactionMedia,
  type FinanceTransactionCreatePayload,
} from "../api";
import {
  financeTransactionDateInputToIso,
  type FinanceTransactionKind,
  type FinanceTransactionStatus,
} from "../lib/transaction";

export function FinanceTransactionCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [kindDraft, setKindDraft] = useState<FinanceTransactionKind>("physical");
  const [statusDraft, setStatusDraft] = useState<FinanceTransactionStatus>("considering");
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [vendorIdDraft, setVendorIdDraft] = useState<number | null>(null);
  const [obligationIdDraft, setObligationIdDraft] = useState<number | null>(null);
  const [listingUrlDraft, setListingUrlDraft] = useState("");
  const [priceAmountDraft, setPriceAmountDraft] = useState("");
  const [currencyDraft, setCurrencyDraft] = useState("USD");
  const [quantityDraft, setQuantityDraft] = useState("1");
  const [orderedAtDraft, setOrderedAtDraft] = useState("");
  const [receivedAtDraft, setReceivedAtDraft] = useState("");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingMediaSelections, setPendingMediaSelections] = useState<PendingMediaSelection[]>([]);

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
  });

  const obligationsQuery = useQuery({
    queryKey: financeQueryKeys.obligations(),
    queryFn: () => fetchFinanceObligations(),
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
    mutationFn: async () => {
      const priceTrimmed = priceAmountDraft.trim();
      const qty = Number(quantityDraft);
      const payload: FinanceTransactionCreatePayload = {
        title: titleDraft.trim(),
        kind: kindDraft,
        status: statusDraft,
        vendor_id: vendorIdDraft,
        obligation_id: kindDraft === "subscription" ? obligationIdDraft : null,
        listing_url: listingUrlDraft.trim() || null,
        notes: notesDraft.trim(),
        price_amount: priceTrimmed ? priceTrimmed : null,
        currency: currencyDraft.trim() || "USD",
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        ordered_at: financeTransactionDateInputToIso(orderedAtDraft),
        received_at: financeTransactionDateInputToIso(receivedAtDraft),
        tag_ids: tagIdsDraft,
      };
      const item = await createFinanceTransaction(payload);
      for (const pending of pendingUploads) {
        await uploadFinanceTransactionMedia(item.id, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachFinanceTransactionMediaFromMedia(item.id, pending.media.id);
      }
      return item;
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate(`/finance/transactions/${item.id}`);
    },
  });

  const canCreate = titleDraft.trim().length > 0;

  const hasUnsavedDraft =
    Boolean(titleDraft.trim()) ||
    Boolean(notesDraft.trim()) ||
    Boolean(listingUrlDraft.trim()) ||
    vendorIdDraft !== null ||
    obligationIdDraft !== null ||
    pendingUploads.length > 0 ||
    pendingMediaSelections.length > 0 ||
    tagIdsDraft.length > 0 ||
    Boolean(priceAmountDraft.trim()) ||
    Boolean(orderedAtDraft) ||
    Boolean(receivedAtDraft) ||
    kindDraft !== "physical" ||
    statusDraft !== "considering" ||
    quantityDraft !== "1" ||
    currencyDraft.trim() !== "USD";

  const handleNavigateToVendor = (vendorId: number) => {
    const target = `/finance/vendors/${vendorId}`;
    if (!hasUnsavedDraft) {
      navigate(target);
      return;
    }
    const discard = window.confirm(
      "Discard this new item and open the vendor?\n\nOK = Discard and go\nCancel = Stay on this page",
    );
    if (discard) {
      navigate(target);
    }
  };

  const handleNavigateToObligation = (obligationId: number) => {
    const target = `/finance/subscriptions/${obligationId}`;
    if (!hasUnsavedDraft) {
      navigate(target);
      return;
    }
    const discard = window.confirm(
      "Discard this new item and open the subscription?\n\nOK = Discard and go\nCancel = Stay on this page",
    );
    if (discard) {
      navigate(target);
    }
  };

  const handleKindDraftChange = (kind: FinanceTransactionKind) => {
    setKindDraft(kind);
    if (kind !== "subscription") {
      setObligationIdDraft(null);
    }
  };

  return (
    <FormPageLayout
      backHref="/finance/transactions"
      backLabel="Back to items"
      headerAction={
        <button
          type="button"
          disabled={!canCreate || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating…" : "Create"}
        </button>
      }
      errorMessage={createMutation.isError ? "Failed to create item." : null}
    >
          <FinanceTransactionDetailView
            item={null}
            createMode
            vendors={vendorsQuery.data ?? []}
            obligations={obligationsQuery.data ?? []}
            kindDraft={kindDraft}
            onKindDraftChange={handleKindDraftChange}
            statusDraft={statusDraft}
            onStatusDraftChange={setStatusDraft}
            titleDraft={titleDraft}
            onTitleDraftChange={setTitleDraft}
            notesDraft={notesDraft}
            onNotesDraftChange={setNotesDraft}
            vendorIdDraft={vendorIdDraft}
            onVendorIdDraftChange={setVendorIdDraft}
            onNavigateToVendor={handleNavigateToVendor}
            obligationIdDraft={obligationIdDraft}
            onObligationIdDraftChange={setObligationIdDraft}
            onNavigateToObligation={handleNavigateToObligation}
            listingUrlDraft={listingUrlDraft}
            onListingUrlDraftChange={setListingUrlDraft}
            priceAmountDraft={priceAmountDraft}
            onPriceAmountDraftChange={setPriceAmountDraft}
            currencyDraft={currencyDraft}
            onCurrencyDraftChange={setCurrencyDraft}
            quantityDraft={quantityDraft}
            onQuantityDraftChange={setQuantityDraft}
            orderedAtDraft={orderedAtDraft}
            onOrderedAtDraftChange={setOrderedAtDraft}
            receivedAtDraft={receivedAtDraft}
            onReceivedAtDraftChange={setReceivedAtDraft}
            tagIdsDraft={tagIdsDraft}
            onTagIdsDraftChange={setTagIdsDraft}
            pendingUploads={pendingUploads}
            pendingMediaSelections={pendingMediaSelections}
            onQueueUploads={queueUploads}
            onQueueMediaSelections={queueMediaSelections}
            onRemovePendingUpload={(clientId) => {
              setPendingUploads((current) => {
                const removed = current.find((p) => p.clientId === clientId);
                if (removed) {
                  URL.revokeObjectURL(removed.previewUrl);
                }
                return current.filter((p) => p.clientId !== clientId);
              });
            }}
            onRemovePendingMedia={(clientId) => {
              setPendingMediaSelections((current) =>
                current.filter((p) => p.clientId !== clientId),
              );
            }}
            pageFileDragActive={pageFileDragActive}
            savePending={createMutation.isPending}
          />
    </FormPageLayout>
  );
}
