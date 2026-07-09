// stack_sandbox/frontend_web/src/modules/shop/components/detail/FinanceDetailInlineListingUrl.tsx

// Inline listing URL field for purchase detail.

import { ExternalLinkButton } from "../../../../components/links/ExternalLinkButton";

type FinanceDetailInlineListingUrlProps = {
  value: string;
  onChange: (nextUrl: string) => void;
  disabled?: boolean;
};

export function FinanceDetailInlineListingUrl({
  value,
  onChange,
  disabled = false,
}: FinanceDetailInlineListingUrlProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
        Listing URL
      </p>
      <div className="flex max-w-xl items-center gap-2">
        <input
          type="url"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          aria-label="Listing URL"
          className="min-w-0 flex-1 rounded-lg border-0 bg-stone-900/40 px-3 py-2 text-sm text-sky-300 placeholder:text-stone-600 ring-1 ring-stone-800/80 focus:ring-stone-600"
        />
        <ExternalLinkButton
          href={value}
          ariaLabel="Open listing in new tab"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
