// stack_sandbox/frontend_web/src/modules/shop/components/detail/FinanceDetailInlinePrice.tsx

// Inline price, currency, and quantity fields for purchase detail.

type FinanceDetailInlinePriceProps = {
  priceAmount: string;
  currency: string;
  quantity: string;
  onPriceAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  disabled?: boolean;
};

export function FinanceDetailInlinePrice({
  priceAmount,
  currency,
  quantity,
  onPriceAmountChange,
  onCurrencyChange,
  onQuantityChange,
  disabled = false,
}: FinanceDetailInlinePriceProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Price
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={priceAmount}
          disabled={disabled}
          onChange={(e) => onPriceAmountChange(e.target.value)}
          placeholder="0.00"
          className="w-28 rounded-lg border-0 bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:ring-stone-600"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Currency
        </span>
        <input
          type="text"
          value={currency}
          maxLength={8}
          disabled={disabled}
          onChange={(e) => onCurrencyChange(e.target.value.toUpperCase())}
          className="w-20 rounded-lg border-0 bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:ring-stone-600"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Qty
        </span>
        <input
          type="number"
          min={1}
          value={quantity}
          disabled={disabled}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="w-16 rounded-lg border-0 bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:ring-stone-600"
        />
      </label>
    </div>
  );
}
