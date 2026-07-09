// stack_sandbox/frontend_web/src/modules/shop/components/detail/FinanceVendorDetailView.tsx

// Inline edit layout for a shop vendor (detail and create).

import { ExternalLinkButton } from "../../../../components/links/ExternalLinkButton";
import type { FinanceVendor } from "../../api";
import { VendorImageBox } from "../VendorImageBox";
import { VendorLogoMenu } from "../VendorLogoMenu";
import { FinanceVendorDetailInlineTitle } from "./FinanceVendorDetailInlineTitle";
import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";

type FinanceVendorDetailViewProps = {
  vendor: FinanceVendor | null;
  createMode?: boolean;
  nameDraft: string;
  onNameDraftChange: (value: string) => void;
  websiteUrlDraft: string;
  onWebsiteUrlDraftChange: (value: string) => void;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  currencyDraft: string;
  onCurrencyDraftChange: (value: string) => void;
  onImageClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onViewLogoMedia?: () => void;
  logoPreviewUrl?: string | null;
  createImagePreviewUrl?: string | null;
  createImageFileName?: string | null;
  onCreateImageClear?: () => void;
  savePending?: boolean;
};

export function FinanceVendorDetailView({
  vendor,
  createMode = false,
  nameDraft,
  onNameDraftChange,
  websiteUrlDraft,
  onWebsiteUrlDraftChange,
  notesDraft,
  onNotesDraftChange,
  currencyDraft,
  onCurrencyDraftChange,
  onImageClick,
  onViewLogoMedia,
  logoPreviewUrl,
  createImagePreviewUrl,
  createImageFileName,
  onCreateImageClear,
  savePending = false,
}: FinanceVendorDetailViewProps) {
  const disabled = savePending;
  const showImage = vendor && !createMode;
  const showCreateImageInput = createMode && onImageClick;

  return (
    <div className="space-y-10">
      {showImage && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500">
            Logo
          </p>
          <div className="relative inline-block">
            <button
              type="button"
              disabled={disabled || !onImageClick}
              onClick={onImageClick}
              title="Change vendor image"
              className="rounded-lg transition hover:opacity-80 disabled:opacity-50"
            >
              <VendorImageBox
                vendorName={vendor.name}
                logo={vendor.logo}
                previewUrl={logoPreviewUrl}
                size="lg"
              />
            </button>
            {vendor.logo && onViewLogoMedia && (
              <VendorLogoMenu
                disabled={disabled}
                onViewMedia={onViewLogoMedia}
                className="absolute bottom-1 right-1"
              />
            )}
          </div>
        </div>
      )}

      {showCreateImageInput && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500">
            Logo
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={disabled || !onImageClick}
              onClick={onImageClick}
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 text-sm font-semibold uppercase text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_4px_rgba(0,0,0,0.45)] ring-1 ring-stone-600/80 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createImagePreviewUrl ? (
                <img
                  src={createImagePreviewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                "Logo"
              )}
            </button>
            <div className="min-w-0 space-y-2">
              <button
                type="button"
                disabled={disabled || !onImageClick}
                onClick={onImageClick}
                className="inline-flex rounded-lg bg-stone-900/60 px-3 py-2 text-sm text-stone-200 ring-1 ring-stone-800 transition hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose image
              </button>
              {createImageFileName ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="max-w-xs truncate">{createImageFileName}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onCreateImageClear}
                    className="text-red-400 transition hover:text-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  Optional image to upload after the vendor is created.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <FinanceVendorDetailInlineTitle
        value={nameDraft}
        onChange={onNameDraftChange}
        disabled={disabled}
        placeholder={createMode ? "Vendor name" : undefined}
      />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Website
        </p>
        <div className="flex max-w-md items-center gap-2">
          <input
            type="url"
            value={websiteUrlDraft}
            disabled={disabled}
            onChange={(event) => onWebsiteUrlDraftChange(event.target.value)}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded-lg bg-stone-900/40 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600"
          />
          <ExternalLinkButton
            href={websiteUrlDraft}
            ariaLabel="Open website in new tab"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Default currency
        </p>
        <input
          type="text"
          value={currencyDraft}
          disabled={disabled}
          onChange={(event) => onCurrencyDraftChange(event.target.value)}
          placeholder="USD"
          maxLength={8}
          className="w-24 rounded-lg bg-stone-900/40 px-3 py-2 text-sm uppercase text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Notes
        </p>
        <AutoSizeTextarea
          value={notesDraft}
          disabled={disabled}
          onChange={(event) => onNotesDraftChange(event.target.value)}
          placeholder="Notes about this vendor…"
          aria-label="Vendor notes"
          className="w-full cursor-text border-0 bg-transparent text-base leading-relaxed text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}
