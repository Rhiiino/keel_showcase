// keel_web/src/modules/finance/components/detail/FinanceTransactionDetailView.tsx

// Transaction detail layout with inline editable fields and media carousel.

import type {
  FinanceObligation,
  FinanceTransaction,
  FinanceTransactionGalleryEntry,
  FinanceVendor,
} from "../../api";
import type { FinanceTransactionKind, FinanceTransactionStatus } from "../../lib/transaction";
import { FinanceMediaCarousel, type PendingMediaSelection, type PendingUpload } from "../FinanceMediaCarousel";
import { ObligationSelect } from "../ObligationSelect";
import { VendorSelect } from "../VendorSelect";
import { FinanceTransactionInlineTags } from "../tags/FinanceTransactionInlineTags";
import { FinanceDetailInlineDates } from "./FinanceDetailInlineDates";
import { FinanceDetailInlineKind } from "./FinanceDetailInlineKind";
import { FinanceDetailInlineListingUrl } from "./FinanceDetailInlineListingUrl";
import { FinanceDetailInlineNotes } from "./FinanceDetailInlineNotes";
import { FinanceDetailInlinePrice } from "./FinanceDetailInlinePrice";
import { FinanceDetailInlineStatus } from "./FinanceDetailInlineStatus";
import { FinanceDetailInlineTitle } from "./FinanceDetailInlineTitle";

type FinanceTransactionDetailViewProps = {
  item: FinanceTransaction | null;
  createMode?: boolean;
  vendors: FinanceVendor[];
  obligations: FinanceObligation[];
  kindDraft: FinanceTransactionKind;
  onKindDraftChange: (kind: FinanceTransactionKind) => void;
  statusDraft: FinanceTransactionStatus;
  onStatusDraftChange: (status: FinanceTransactionStatus) => void;
  titleDraft: string;
  onTitleDraftChange: (title: string) => void;
  notesDraft: string;
  onNotesDraftChange: (notes: string) => void;
  vendorIdDraft: number | null;
  onVendorIdDraftChange: (vendorId: number | null) => void;
  obligationIdDraft: number | null;
  onObligationIdDraftChange: (obligationId: number | null) => void;
  listingUrlDraft: string;
  onListingUrlDraftChange: (url: string) => void;
  priceAmountDraft: string;
  onPriceAmountDraftChange: (value: string) => void;
  currencyDraft: string;
  onCurrencyDraftChange: (value: string) => void;
  quantityDraft: string;
  onQuantityDraftChange: (value: string) => void;
  orderedAtDraft: string;
  onOrderedAtDraftChange: (value: string) => void;
  receivedAtDraft: string;
  onReceivedAtDraftChange: (value: string) => void;
  media?: FinanceTransactionGalleryEntry[];
  pendingUploads?: PendingUpload[];
  pendingMediaSelections?: PendingMediaSelection[];
  onQueueUploads?: (files: FileList | File[]) => void;
  onQueueMediaSelections?: (media: PendingMediaSelection["media"][]) => void;
  onRemovePendingUpload?: (clientId: string) => void;
  onRemovePendingMedia?: (clientId: string) => void;
  onDeleteMedia?: (attachmentId: number) => void;
  onSetCover?: (mediaId: string) => void;
  onNavigateToVendor?: (vendorId: number) => void;
  onNavigateToObligation?: (obligationId: number) => void;
  tagIdsDraft: number[];
  onTagIdsDraftChange: (tagIds: number[]) => void;
  pageFileDragActive?: boolean;
  savePending?: boolean;
};

export function FinanceTransactionDetailView({
  item: _item,
  createMode = false,
  vendors,
  obligations,
  kindDraft,
  onKindDraftChange,
  statusDraft,
  onStatusDraftChange,
  titleDraft,
  onTitleDraftChange,
  notesDraft,
  onNotesDraftChange,
  vendorIdDraft,
  onVendorIdDraftChange,
  obligationIdDraft,
  onObligationIdDraftChange,
  listingUrlDraft,
  onListingUrlDraftChange,
  priceAmountDraft,
  onPriceAmountDraftChange,
  currencyDraft,
  onCurrencyDraftChange,
  quantityDraft,
  onQuantityDraftChange,
  orderedAtDraft,
  onOrderedAtDraftChange,
  receivedAtDraft,
  onReceivedAtDraftChange,
  media = [],
  pendingUploads = [],
  pendingMediaSelections = [],
  onQueueUploads,
  onQueueMediaSelections,
  onRemovePendingUpload,
  onRemovePendingMedia,
  onDeleteMedia,
  onSetCover,
  onNavigateToVendor,
  onNavigateToObligation,
  tagIdsDraft,
  onTagIdsDraftChange,
  pageFileDragActive = false,
  savePending = false,
}: FinanceTransactionDetailViewProps) {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <FinanceDetailInlineKind
          kindDraft={kindDraft}
          onKindDraftChange={onKindDraftChange}
          disabled={savePending}
        />
        <FinanceDetailInlineStatus
          statusDraft={statusDraft}
          onStatusDraftChange={onStatusDraftChange}
          disabled={savePending}
        />
        <FinanceDetailInlineTitle
          value={titleDraft}
          onChange={onTitleDraftChange}
          disabled={savePending}
          placeholder={createMode ? "Item name" : undefined}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Tags
        </p>
        <FinanceTransactionInlineTags
          tagIdsDraft={tagIdsDraft}
          onTagIdsDraftChange={onTagIdsDraftChange}
          disabled={savePending}
        />
      </div>

      <VendorSelect
        vendors={vendors}
        value={vendorIdDraft}
        onChange={onVendorIdDraftChange}
        onNavigateToVendor={onNavigateToVendor}
        disabled={savePending}
      />

      {kindDraft === "subscription" ? (
        <ObligationSelect
          obligations={obligations}
          value={obligationIdDraft}
          onChange={onObligationIdDraftChange}
          onNavigateToObligation={onNavigateToObligation}
          disabled={savePending}
        />
      ) : null}

      <FinanceDetailInlinePrice
        priceAmount={priceAmountDraft}
        currency={currencyDraft}
        quantity={quantityDraft}
        onPriceAmountChange={onPriceAmountDraftChange}
        onCurrencyChange={onCurrencyDraftChange}
        onQuantityChange={onQuantityDraftChange}
        disabled={savePending}
      />

      <FinanceDetailInlineDates
        orderedAtDraft={orderedAtDraft}
        receivedAtDraft={receivedAtDraft}
        onOrderedAtDraftChange={onOrderedAtDraftChange}
        onReceivedAtDraftChange={onReceivedAtDraftChange}
        disabled={savePending}
      />

      <FinanceDetailInlineListingUrl
        value={listingUrlDraft}
        onChange={onListingUrlDraftChange}
        disabled={savePending}
      />

      <FinanceDetailInlineNotes
        value={notesDraft}
        onChange={onNotesDraftChange}
        disabled={savePending}
      />

      {(createMode ? onQueueUploads : true) && (
        <FinanceMediaCarousel
          media={createMode ? [] : media}
          pendingUploads={pendingUploads}
          pendingMediaSelections={pendingMediaSelections}
          onQueueUploads={onQueueUploads}
          onQueueMediaSelections={onQueueMediaSelections}
          onRemovePending={onRemovePendingUpload}
          onRemovePendingMedia={onRemovePendingMedia}
          onDeleteMedia={onDeleteMedia}
          onSetCover={onSetCover}
          disabled={savePending}
          pageFileDragActive={pageFileDragActive}
        />
      )}
    </div>
  );
}
