// stack_sandbox/frontend_web/src/modules/shop/pages/FinanceTransactionPage.tsx

// Purchase detail with inline editing and Save.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
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
  deleteFinanceTransaction,
  deleteFinanceTransactionMedia,
  fetchFinanceTransaction,
  fetchFinanceTransactionMedia,
  fetchFinanceObligations,
  fetchFinanceVendors,
  setFinanceTransactionCoverFromMedia,
  financeQueryKeys,
  updateFinanceTransaction,
  uploadFinanceTransactionMedia,
  type FinanceTransactionUpdatePayload,
} from "../api";
import {
  isFinanceTransactionKind,
  isFinanceTransactionStatus,
  financeTransactionDateInputValue,
  financeTransactionDateInputToIso,
  type FinanceTransactionKind,
  type FinanceTransactionStatus,
} from "../lib/transaction";

function buildUpdatePayload(
  kindDraft: FinanceTransactionKind,
  statusDraft: FinanceTransactionStatus,
  titleDraft: string,
  notesDraft: string,
  vendorIdDraft: number | null,
  obligationIdDraft: number | null,
  listingUrlDraft: string,
  priceAmountDraft: string,
  currencyDraft: string,
  quantityDraft: string,
  orderedAtDraft: string,
  receivedAtDraft: string,
  tagIdsDraft: number[],
): FinanceTransactionUpdatePayload {
  const payload: FinanceTransactionUpdatePayload = {};
  payload.kind = kindDraft;
  payload.status = statusDraft;
  payload.title = titleDraft.trim();
  payload.notes = notesDraft.trim();
  payload.vendor_id = vendorIdDraft;
  payload.obligation_id = kindDraft === "subscription" ? obligationIdDraft : null;
  payload.listing_url = listingUrlDraft.trim() || null;
  const priceTrimmed = priceAmountDraft.trim();
  payload.price_amount = priceTrimmed ? priceTrimmed : null;
  payload.currency = currencyDraft.trim() || "USD";
  const qty = Number(quantityDraft);
  payload.quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
  payload.ordered_at = financeTransactionDateInputToIso(orderedAtDraft);
  payload.received_at = financeTransactionDateInputToIso(receivedAtDraft);
  payload.tag_ids = tagIdsDraft;
  return payload;
}

export function FinanceTransactionPage() {
  const { transactionId: transactionIdParam } = useParams<{ transactionId: string }>();
  const transactionId = Number(transactionIdParam);
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

  const invalidTransactionId = !Number.isFinite(transactionId) || transactionId <= 0;

  const itemQuery = useQuery({
    queryKey: financeQueryKeys.transaction(transactionId),
    queryFn: () => fetchFinanceTransaction(transactionId),
    enabled: !invalidTransactionId,
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidTransactionId,
    isLoading: itemQuery.isLoading,
    error: itemQuery.error,
    isFetched: itemQuery.isFetched,
    hasData: Boolean(itemQuery.data),
    listPath: "/finance/transactions",
    notice: "That item could not be found.",
  });

  const mediaQuery = useQuery({
    queryKey: financeQueryKeys.transactionMedia(transactionId),
    queryFn: () => fetchFinanceTransactionMedia(transactionId),
    enabled: Number.isFinite(transactionId) && transactionId > 0 && Boolean(itemQuery.data),
  });

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
  });

  const obligationsQuery = useQuery({
    queryKey: financeQueryKeys.obligations(),
    queryFn: () => fetchFinanceObligations(),
  });

  const item = itemQuery.data;

  useEffect(() => {
    if (!item) {
      return;
    }
    setKindDraft(isFinanceTransactionKind(item.kind) ? item.kind : "physical");
    setStatusDraft(isFinanceTransactionStatus(item.status) ? item.status : "considering");
    setTitleDraft(item.title);
    setNotesDraft(item.notes);
    setVendorIdDraft(item.vendor_id);
    setObligationIdDraft(item.obligation_id);
    setListingUrlDraft(item.listing_url ?? "");
    setPriceAmountDraft(item.price_amount ?? "");
    setCurrencyDraft(item.currency);
    setQuantityDraft(String(item.quantity));
    setOrderedAtDraft(financeTransactionDateInputValue(item.ordered_at));
    setReceivedAtDraft(financeTransactionDateInputValue(item.received_at));
    setTagIdsDraft((item.tags ?? []).map((tag) => tag.id));
    setPendingUploads([]);
    setPendingMediaSelections([]);
  }, [
    item?.id,
    item?.updated_at,
    item?.title,
    item?.status,
    item?.notes,
    item?.kind,
    item?.obligation_id,
    item?.listing_url,
    item?.price_amount,
    item?.currency,
    item?.quantity,
    item?.ordered_at,
    item?.received_at,
    item?.tags,
  ]);

  const isDirty = useMemo(() => {
    if (!item) {
      return false;
    }
    const savedKind = isFinanceTransactionKind(item.kind) ? item.kind : "physical";
    const savedStatus = isFinanceTransactionStatus(item.status) ? item.status : "considering";
    const savedTagIds = (item.tags ?? []).map((tag) => tag.id);
    const tagsDirty =
      [...tagIdsDraft].sort((left, right) => left - right).join(",") !==
      [...savedTagIds].sort((left, right) => left - right).join(",");
    return (
      kindDraft !== savedKind ||
      statusDraft !== savedStatus ||
      titleDraft.trim() !== item.title ||
      notesDraft.trim() !== item.notes ||
      vendorIdDraft !== item.vendor_id ||
      obligationIdDraft !== item.obligation_id ||
      listingUrlDraft.trim() !== (item.listing_url ?? "") ||
      priceAmountDraft.trim() !== (item.price_amount ?? "") ||
      currencyDraft.trim() !== item.currency ||
      quantityDraft !== String(item.quantity) ||
      orderedAtDraft !== financeTransactionDateInputValue(item.ordered_at) ||
      receivedAtDraft !== financeTransactionDateInputValue(item.received_at) ||
      tagsDirty ||
      pendingUploads.length > 0 ||
      pendingMediaSelections.length > 0
    );
  }, [
    item,
    kindDraft,
    statusDraft,
    titleDraft,
    notesDraft,
    vendorIdDraft,
    obligationIdDraft,
    listingUrlDraft,
    priceAmountDraft,
    currencyDraft,
    quantityDraft,
    orderedAtDraft,
    receivedAtDraft,
    tagIdsDraft,
    pendingUploads.length,
    pendingMediaSelections.length,
  ]);

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
    enabled: Boolean(item),
    onDropFiles: queueUploads,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!item) {
        return;
      }
      const updated = await updateFinanceTransaction(
        transactionId,
        buildUpdatePayload(
          kindDraft,
          statusDraft,
          titleDraft,
          notesDraft,
          vendorIdDraft,
          obligationIdDraft,
          listingUrlDraft,
          priceAmountDraft,
          currencyDraft,
          quantityDraft,
          orderedAtDraft,
          receivedAtDraft,
          tagIdsDraft,
        ),
      );
      for (const pending of pendingUploads) {
        await uploadFinanceTransactionMedia(transactionId, pending.file);
        URL.revokeObjectURL(pending.previewUrl);
      }
      for (const pending of pendingMediaSelections) {
        await attachFinanceTransactionMediaFromMedia(transactionId, pending.media.id);
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
    mutationFn: () => deleteFinanceTransaction(transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate("/finance/transactions");
    },
  });

  const handleDeleteMedia = async (attachmentId: number) => {
    await deleteFinanceTransactionMedia(transactionId, attachmentId);
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactionMedia(transactionId) });
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.transaction(transactionId) });
  };

  const handleSetCover = async (mediaId: string) => {
    await setFinanceTransactionCoverFromMedia(transactionId, mediaId);
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.transaction(transactionId) });
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
      if (!titleDraft.trim()) {
        return;
      }
      await saveMutation.mutateAsync();
    }
    navigate(target);
  };

  const handleNavigateToObligation = async (obligationId: number) => {
    const target = `/finance/subscriptions/${obligationId}`;
    if (!isDirty) {
      navigate(target);
      return;
    }
    const saveFirst = window.confirm(
      "You have unsaved changes. Save before leaving?\n\nOK = Save and go\nCancel = Leave without saving",
    );
    if (saveFirst) {
      if (!titleDraft.trim()) {
        return;
      }
      await saveMutation.mutateAsync();
    }
    navigate(target);
  };

  const handleKindDraftChange = (kind: FinanceTransactionKind) => {
    setKindDraft(kind);
    if (kind !== "subscription") {
      setObligationIdDraft(null);
    }
  };

  const discardChanges = useCallback(() => {
    if (!item) {
      return;
    }
    setKindDraft(isFinanceTransactionKind(item.kind) ? item.kind : "physical");
    setStatusDraft(isFinanceTransactionStatus(item.status) ? item.status : "considering");
    setTitleDraft(item.title);
    setNotesDraft(item.notes);
    setVendorIdDraft(item.vendor_id);
    setObligationIdDraft(item.obligation_id);
    setListingUrlDraft(item.listing_url ?? "");
    setPriceAmountDraft(item.price_amount ?? "");
    setCurrencyDraft(item.currency);
    setQuantityDraft(String(item.quantity));
    setOrderedAtDraft(financeTransactionDateInputValue(item.ordered_at));
    setReceivedAtDraft(financeTransactionDateInputValue(item.received_at));
    setTagIdsDraft((item.tags ?? []).map((tag) => tag.id));
    setPendingUploads([]);
    setPendingMediaSelections([]);
  }, [item]);

  const deleteButton = (
    <button
      type="button"
      onClick={() => {
        if (window.confirm("Delete this item?")) {
          deleteMutation.mutate();
        }
      }}
      className="rounded-lg px-3 py-2 text-sm text-red-400 ring-1 ring-red-900/50 hover:bg-red-950/30"
    >
      Delete
    </button>
  );

  if (redirecting || itemQuery.isLoading) {
    return (
      <FormPageLayout backHref="/finance/transactions" backLabel="Back to items">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/finance/transactions"
      backLabel="Back to items"
      isDirty={isDirty}
      onDiscard={discardChanges}
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
      canSave={Boolean(titleDraft.trim())}
      headerAction={deleteButton}
      persistHeaderAction
      errorMessage={saveMutation.isError ? "Failed to save changes." : null}
    >
            <FinanceTransactionDetailView
              item={item}
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
              obligationIdDraft={obligationIdDraft}
              onObligationIdDraftChange={setObligationIdDraft}
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
              media={mediaQuery.data ?? []}
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
              onDeleteMedia={(mediaId) => void handleDeleteMedia(mediaId)}
              onSetCover={(mediaId) => void handleSetCover(mediaId)}
              onNavigateToVendor={(id) => void handleNavigateToVendor(id)}
              onNavigateToObligation={(id) => void handleNavigateToObligation(id)}
              pageFileDragActive={pageFileDragActive}
              savePending={saveMutation.isPending}
            />
    </FormPageLayout>
  );
}
